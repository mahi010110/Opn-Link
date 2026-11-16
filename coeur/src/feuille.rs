use crate::appel::{Demi, IdSeance, PAS_DU_QR_MS, Presence as PresenceSignee, Qr, SecretDeSeance, VALIDITE_DU_CODE_MS, code_du_qr};
use crate::classe::{Membre, SecretsDeClasse};
use crate::cles::{CleAppareil, ClePublique, Signature};
use crate::encodage::{champ, hex, sha256};
use crate::erreur::Erreur;

/// Le formateur a trente secondes pour annuler une clôture.
pub const ANNULER_CLOTURE_MS: u64 = 30_000;

const ENTETE: &str = "opn-link·feuille·v1";

/// Par où une présence est arrivée chez le formateur.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Voie {
    /// Par le réseau, scellée dans sa boîte.
    Reseau,
    /// Le formateur a lu le QR de l'apprenant sans réseau, en face de lui.
    QrLu,
    /// L'apprenant a signé sur l'appareil du formateur.
    Ici,
}

impl Voie {
    fn texte(self) -> &'static str {
        match self {
            Voie::Reseau => "reseau",
            Voie::QrLu => "qr",
            Voie::Ici => "ici",
        }
    }

    fn lire(texte: &str) -> Result<Self, Erreur> {
        match texte {
            "reseau" => Ok(Voie::Reseau),
            "qr" => Ok(Voie::QrLu),
            _ => Err(Erreur::JournalAbime),
        }
    }
}

/// Ce que devient une présence reçue.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Recu {
    /// Elle entre dans la feuille.
    Nouvelle,
    /// L'apprenant avait déjà signé : rien ne change.
    Deja,
}

/// Où en est un apprenant dans la feuille.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EtatPresence {
    PasEncore,
    Present { quand: u64, voie: Voie },
    Absent,
}

/// Un apprenant inscrit à la feuille, et son état.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EtatMembre {
    pub prenom: String,
    pub nom: String,
    pub cle: ClePublique,
    pub presence: EtatPresence,
    pub retard: Option<u64>,
    pub depart: Option<u64>,
    /// Une correction a changé sa case après la clôture. Elle reste visible.
    pub corrige: bool,
}

#[derive(Clone, Debug)]
struct Inscrit {
    prenom: String,
    nom: String,
    cle: ClePublique,
}

#[derive(Clone, Debug)]
enum Evenement {
    Ouverture {
        classe: String,
        seance: IdSeance,
        date: String,
        demi: Demi,
        formateur: ClePublique,
        engagement: String,
        inscrits: Vec<Inscrit>,
    },
    Presence {
        voie: Voie,
        presence: PresenceSignee,
    },
    Ici {
        membre: ClePublique,
    },
    Retard {
        membre: ClePublique,
        heure: u64,
    },
    Depart {
        membre: ClePublique,
        heure: u64,
    },
    Cloture {
        presents: u32,
        absents: u32,
        secret: SecretDeSeance,
        signature: Signature,
    },
    Reouverture,
    Correction {
        membre: ClePublique,
        present: bool,
        motif: String,
        signature: Signature,
    },
}

impl Evenement {
    fn champs(&self) -> Vec<String> {
        match self {
            Evenement::Ouverture { classe, seance, date, demi, formateur, engagement, inscrits } => {
                let mut c = vec![
                    "ouverture".into(),
                    classe.clone(),
                    seance.texte().into(),
                    date.clone(),
                    demi.texte().into(),
                    formateur.texte(),
                    engagement.clone(),
                ];
                for i in inscrits {
                    c.extend([i.prenom.clone(), i.nom.clone(), i.cle.texte()]);
                }
                c
            }
            Evenement::Presence { voie, presence } => vec!["presence".into(), voie.texte().into(), presence.texte()],
            Evenement::Ici { membre } => vec!["ici".into(), membre.texte()],
            Evenement::Retard { membre, heure } => vec!["retard".into(), membre.texte(), heure.to_string()],
            Evenement::Depart { membre, heure } => vec!["depart".into(), membre.texte(), heure.to_string()],
            Evenement::Cloture { presents, absents, secret, .. } => {
                vec!["cloture".into(), presents.to_string(), absents.to_string(), secret.texte()]
            }
            Evenement::Reouverture => vec!["reouverture".into()],
            Evenement::Correction { membre, present, motif, .. } => {
                vec!["correction".into(), membre.texte(), if *present { "present" } else { "absent" }.into(), motif.clone()]
            }
        }
    }

    fn signature(&self) -> Option<&Signature> {
        match self {
            Evenement::Cloture { signature, .. } | Evenement::Correction { signature, .. } => Some(signature),
            _ => None,
        }
    }

    fn lire(champs: &[&str]) -> Result<Self, Erreur> {
        let abime = |_| Erreur::JournalAbime;
        let nombre = |t: &str| t.parse::<u64>().map_err(|_| Erreur::JournalAbime);
        Ok(match champs {
            ["ouverture", classe, seance, date, demi, formateur, engagement, reste @ ..] if reste.len() % 3 == 0 => Evenement::Ouverture {
                classe: (*classe).into(),
                seance: IdSeance::lire(seance).map_err(abime)?,
                date: (*date).into(),
                demi: Demi::lire(demi).map_err(abime)?,
                formateur: ClePublique::lire(formateur).map_err(abime)?,
                engagement: (*engagement).into(),
                inscrits: reste
                    .chunks(3)
                    .map(|i| Ok(Inscrit { prenom: i[0].into(), nom: i[1].into(), cle: ClePublique::lire(i[2]).map_err(abime)? }))
                    .collect::<Result<_, Erreur>>()?,
            },
            ["presence", voie, presence] => {
                Evenement::Presence { voie: Voie::lire(voie)?, presence: PresenceSignee::lire(presence).map_err(abime)? }
            }
            ["ici", membre] => Evenement::Ici { membre: ClePublique::lire(membre).map_err(abime)? },
            ["retard", membre, heure] => Evenement::Retard { membre: ClePublique::lire(membre).map_err(abime)?, heure: nombre(heure)? },
            ["depart", membre, heure] => Evenement::Depart { membre: ClePublique::lire(membre).map_err(abime)?, heure: nombre(heure)? },
            ["cloture", presents, absents, secret, signature] => Evenement::Cloture {
                presents: presents.parse().map_err(|_| Erreur::JournalAbime)?,
                absents: absents.parse().map_err(|_| Erreur::JournalAbime)?,
                secret: SecretDeSeance::lire(secret).map_err(abime)?,
                signature: Signature::lire(signature).map_err(abime)?,
            },
            ["reouverture"] => Evenement::Reouverture,
            ["correction", membre, etat, motif, signature] => Evenement::Correction {
                membre: ClePublique::lire(membre).map_err(abime)?,
                present: match *etat {
                    "present" => true,
                    "absent" => false,
                    _ => return Err(Erreur::JournalAbime),
                },
                motif: (*motif).into(),
                signature: Signature::lire(signature).map_err(abime)?,
            },
            _ => return Err(Erreur::JournalAbime),
        })
    }
}

/// Une ligne du journal. Chaque ligne porte l'empreinte de la précédente :
/// on peut ajouter, jamais changer ni retirer sans que ça se voie.
#[derive(Clone, Debug)]
pub struct Ligne {
    pub quand: u64,
    pub texte: String,
    pub empreinte: [u8; 32],
    evenement: Evenement,
}

fn texte_de_ligne(n: usize, quand: u64, champs: &[String]) -> String {
    let mut t = format!("{n}\t{quand}");
    for c in champs {
        t.push('\t');
        t.push_str(c);
    }
    t
}

fn empreinte_de(precedente: &[u8; 32], texte: &str) -> [u8; 32] {
    sha256(&[ENTETE.as_bytes(), precedente, texte.as_bytes()])
}

/// La feuille de présence d'une demi-journée, tenue par l'appareil du formateur.
#[derive(Clone, Debug)]
pub struct Feuille {
    secret: Option<SecretDeSeance>,
    lignes: Vec<Ligne>,
}

impl Feuille {
    /// Le formateur lance l'appel.
    pub fn ouvrir(
        classe: &SecretsDeClasse,
        date: &str,
        demi: Demi,
        formateur: &CleAppareil,
        inscrits: &[Membre],
        maintenant: u64,
    ) -> Result<Self, Erreur> {
        let secret = SecretDeSeance::nouveau()?;
        Self::ouvrir_avec(classe, date, demi, formateur, inscrits, secret, maintenant)
    }

    pub(crate) fn ouvrir_avec(
        classe: &SecretsDeClasse,
        date: &str,
        demi: Demi,
        formateur: &CleAppareil,
        inscrits: &[Membre],
        secret: SecretDeSeance,
        maintenant: u64,
    ) -> Result<Self, Erreur> {
        let inscrits = inscrits
            .iter()
            .map(|m| Ok(Inscrit { prenom: champ(&m.prenom)?.into(), nom: champ(&m.nom)?.into(), cle: m.cle.clone() }))
            .collect::<Result<Vec<_>, Erreur>>()?;
        let ouverture = Evenement::Ouverture {
            classe: classe.etiquette().into(),
            seance: classe.seance(date, demi)?,
            date: champ(date)?.into(),
            demi,
            formateur: formateur.publique(),
            engagement: secret.engagement(),
            inscrits,
        };
        let mut feuille = Feuille { secret: Some(secret), lignes: Vec::new() };
        feuille.ajouter(ouverture, maintenant, None)?;
        Ok(feuille)
    }

    fn ajouter(&mut self, evenement: Evenement, quand: u64, formateur: Option<&CleAppareil>) -> Result<(), Erreur> {
        let mut champs = evenement.champs();
        for c in &champs {
            champ(c)?;
        }
        let precedente = self.lignes.last().map_or([0u8; 32], |l| l.empreinte);
        let n = self.lignes.len();
        let evenement = match (evenement, formateur) {
            (Evenement::Cloture { presents, absents, secret, .. }, Some(f)) => {
                let signature = f.signer(&empreinte_de(&precedente, &texte_de_ligne(n, quand, &champs)));
                champs.push(signature.texte());
                Evenement::Cloture { presents, absents, secret, signature }
            }
            (Evenement::Correction { membre, present, motif, .. }, Some(f)) => {
                let signature = f.signer(&empreinte_de(&precedente, &texte_de_ligne(n, quand, &champs)));
                champs.push(signature.texte());
                Evenement::Correction { membre, present, motif, signature }
            }
            (e, _) => e,
        };
        let texte = texte_de_ligne(n, quand, &champs);
        let empreinte = empreinte_de(&precedente, &texte);
        self.lignes.push(Ligne { quand, texte, empreinte, evenement });
        Ok(())
    }

    fn ouverture(&self) -> (&IdSeance, &ClePublique, &[Inscrit], u64, &str, &str, Demi) {
        match &self.lignes[0].evenement {
            Evenement::Ouverture { seance, formateur, inscrits, classe, date, demi, .. } => {
                (seance, formateur, inscrits, self.lignes[0].quand, classe, date, *demi)
            }
            _ => unreachable!("une feuille commence toujours par son ouverture"),
        }
    }

    /// Le secret de l'appel, que gardent les appareils du formateur tant que l'appel est ouvert.
    pub fn secret(&self) -> Option<&SecretDeSeance> {
        self.secret.as_ref()
    }

    pub fn seance(&self) -> &IdSeance {
        self.ouverture().0
    }

    pub fn classe(&self) -> &str {
        self.ouverture().4
    }

    pub fn date(&self) -> &str {
        self.ouverture().5
    }

    pub fn demi(&self) -> Demi {
        self.ouverture().6
    }

    /// La fenêtre de dix secondes en cours, comptée depuis le lancement de l'appel.
    pub fn fenetre(&self, maintenant: u64) -> u64 {
        maintenant.saturating_sub(self.ouverture().3) / PAS_DU_QR_MS
    }

    /// Ce que montre le QR de la salle à cet instant.
    pub fn qr(&self, maintenant: u64) -> Result<Qr, Erreur> {
        if self.close() {
            return Err(Erreur::AppelClos);
        }
        let secret = self.secret.as_ref().ok_or(Erreur::AppelClos)?;
        let fenetre = self.fenetre(maintenant);
        Ok(Qr { seance: self.seance().clone(), fenetre, code: code_du_qr(secret, fenetre) })
    }

    /// L'heure de la clôture, si l'appel est clos.
    pub fn cloture_a(&self) -> Option<u64> {
        let mut close = None;
        for l in &self.lignes {
            match l.evenement {
                Evenement::Cloture { .. } => close = Some(l.quand),
                Evenement::Reouverture => close = None,
                _ => {}
            }
        }
        close
    }

    pub fn close(&self) -> bool {
        self.cloture_a().is_some()
    }

    /// Close depuis plus de trente secondes : la clôture ne s'annule plus.
    pub fn definitive(&self, maintenant: u64) -> bool {
        self.cloture_a().is_some_and(|c| maintenant.saturating_sub(c) > ANNULER_CLOTURE_MS)
    }

    fn inscrit(&self, cle: &ClePublique) -> Result<(), Erreur> {
        if self.ouverture().2.iter().any(|i| &i.cle == cle) { Ok(()) } else { Err(Erreur::AppareilNonAccepte) }
    }

    fn a_signe(&self, cle: &ClePublique) -> bool {
        self.lignes.iter().any(|l| match &l.evenement {
            Evenement::Presence { presence, .. } => &presence.cle == cle,
            Evenement::Ici { membre } => membre == cle,
            _ => false,
        })
    }

    fn verifier_code(&self, presence: &PresenceSignee, voie: Voie, maintenant: u64) -> Result<(), Erreur> {
        let Some(secret) = &self.secret else { return Ok(()) };
        let fin = self.fenetre(maintenant);
        let debut = match voie {
            Voie::Reseau => self.fenetre(maintenant.saturating_sub(VALIDITE_DU_CODE_MS)),
            Voie::QrLu | Voie::Ici => 0,
        };
        let bonne = |f: u64| code_du_qr(secret, f) == presence.code;
        match presence.fenetre {
            Some(f) if f > fin || !bonne(f) => Err(Erreur::CodeInconnu),
            Some(f) if f < debut => Err(Erreur::CodePerime),
            Some(_) => Ok(()),
            None if (debut..=fin).any(bonne) => Ok(()),
            None if (0..debut).any(bonne) => Err(Erreur::CodePerime),
            None => Err(Erreur::CodeInconnu),
        }
    }

    /// Une présence arrive. Elle entre si elle est signée par l'appareil accepté d'un inscrit,
    /// pour cette séance, avec un code que l'écran a montré, et avant la clôture.
    pub fn recevoir(&mut self, presence: &PresenceSignee, voie: Voie, maintenant: u64) -> Result<Recu, Erreur> {
        if voie == Voie::Ici {
            return Err(Erreur::ChampInvalide);
        }
        if self.close() {
            return Err(Erreur::AppelClos);
        }
        if &presence.seance != self.seance() {
            return Err(Erreur::AutreSeance);
        }
        presence.verifier_signature()?;
        self.inscrit(&presence.cle)?;
        if self.a_signe(&presence.cle) {
            return Ok(Recu::Deja);
        }
        self.verifier_code(presence, voie, maintenant)?;
        self.ajouter(Evenement::Presence { voie, presence: presence.clone() }, maintenant, None)?;
        Ok(Recu::Nouvelle)
    }

    /// L'apprenant n'a pas de téléphone : il signe sur celui du formateur. La feuille le dit.
    pub fn signer_ici(&mut self, membre: &ClePublique, maintenant: u64) -> Result<Recu, Erreur> {
        if self.close() {
            return Err(Erreur::AppelClos);
        }
        self.inscrit(membre).map_err(|_| Erreur::MembreInconnu)?;
        if self.a_signe(membre) {
            return Ok(Recu::Deja);
        }
        self.ajouter(Evenement::Ici { membre: membre.clone() }, maintenant, None)?;
        Ok(Recu::Nouvelle)
    }

    pub fn noter_retard(&mut self, membre: &ClePublique, heure: u64, maintenant: u64) -> Result<(), Erreur> {
        self.noter(Evenement::Retard { membre: membre.clone(), heure }, membre, maintenant)
    }

    pub fn noter_depart(&mut self, membre: &ClePublique, heure: u64, maintenant: u64) -> Result<(), Erreur> {
        self.noter(Evenement::Depart { membre: membre.clone(), heure }, membre, maintenant)
    }

    fn noter(&mut self, evenement: Evenement, membre: &ClePublique, maintenant: u64) -> Result<(), Erreur> {
        if self.close() {
            return Err(Erreur::AppelClos);
        }
        self.inscrit(membre).map_err(|_| Erreur::MembreInconnu)?;
        self.ajouter(evenement, maintenant, None)
    }

    /// Le formateur clôt et contresigne. Chaque case vide devient une absence,
    /// et le secret de l'appel est révélé pour que chacun puisse revérifier les codes.
    pub fn clore(&mut self, formateur: &CleAppareil, maintenant: u64) -> Result<(u32, u32), Erreur> {
        if self.close() {
            return Err(Erreur::AppelClos);
        }
        if &formateur.publique() != self.ouverture().1 {
            return Err(Erreur::PasLeFormateur);
        }
        let secret = self.secret.clone().ok_or(Erreur::AppelClos)?;
        let inscrits = self.ouverture().2.len() as u32;
        let presents = self.ouverture().2.iter().filter(|i| self.a_signe(&i.cle)).count() as u32;
        let signature = Signature([0u8; 64]);
        self.ajouter(Evenement::Cloture { presents, absents: inscrits - presents, secret, signature }, maintenant, Some(formateur))?;
        Ok((presents, inscrits - presents))
    }

    /// Annule la clôture, dans les trente secondes, si rien n'a été ajouté depuis.
    pub fn annuler_cloture(&mut self, maintenant: u64) -> Result<(), Erreur> {
        match self.lignes.last() {
            Some(Ligne { evenement: Evenement::Cloture { .. }, quand, .. }) if maintenant.saturating_sub(*quand) <= ANNULER_CLOTURE_MS => {
                self.ajouter(Evenement::Reouverture, maintenant, None)
            }
            Some(Ligne { evenement: Evenement::Cloture { .. }, .. }) | Some(Ligne { evenement: Evenement::Correction { .. }, .. }) => {
                Err(Erreur::ClotureDefinitive)
            }
            _ => Err(Erreur::AppelOuvert),
        }
    }

    /// Après la clôture, seul le formateur corrige, et la correction reste visible.
    pub fn corriger(
        &mut self,
        formateur: &CleAppareil,
        membre: &ClePublique,
        present: bool,
        motif: &str,
        maintenant: u64,
    ) -> Result<(), Erreur> {
        if !self.close() {
            return Err(Erreur::AppelOuvert);
        }
        if &formateur.publique() != self.ouverture().1 {
            return Err(Erreur::PasLeFormateur);
        }
        self.inscrit(membre).map_err(|_| Erreur::MembreInconnu)?;
        let signature = Signature([0u8; 64]);
        self.ajouter(
            Evenement::Correction { membre: membre.clone(), present, motif: champ(motif)?.into(), signature },
            maintenant,
            Some(formateur),
        )
    }

    /// Chaque inscrit et son état, dans l'ordre de l'ouverture.
    pub fn etat(&self) -> Vec<EtatMembre> {
        let close = self.close();
        self.ouverture()
            .2
            .iter()
            .map(|i| {
                let mut etat = EtatMembre {
                    prenom: i.prenom.clone(),
                    nom: i.nom.clone(),
                    cle: i.cle.clone(),
                    presence: if close { EtatPresence::Absent } else { EtatPresence::PasEncore },
                    retard: None,
                    depart: None,
                    corrige: false,
                };
                for l in &self.lignes {
                    match &l.evenement {
                        Evenement::Presence { voie, presence } if presence.cle == i.cle => {
                            etat.presence = EtatPresence::Present { quand: l.quand, voie: *voie }
                        }
                        Evenement::Ici { membre } if *membre == i.cle => {
                            etat.presence = EtatPresence::Present { quand: l.quand, voie: Voie::Ici }
                        }
                        Evenement::Retard { membre, heure } if *membre == i.cle => etat.retard = Some(*heure),
                        Evenement::Depart { membre, heure } if *membre == i.cle => etat.depart = Some(*heure),
                        Evenement::Correction { membre, present, .. } if *membre == i.cle => {
                            etat.corrige = true;
                            etat.presence =
                                if *present { EtatPresence::Present { quand: l.quand, voie: Voie::Ici } } else { EtatPresence::Absent };
                        }
                        _ => {}
                    }
                }
                etat
            })
            .collect()
    }

    /// Combien ont signé, sur combien d'inscrits. C'est tout ce que voit la salle.
    pub fn compte(&self) -> (u32, u32) {
        let inscrits = self.ouverture().2;
        let presents = inscrits.iter().filter(|i| self.a_signe(&i.cle)).count();
        (presents as u32, inscrits.len() as u32)
    }

    /// L'empreinte de la dernière ligne : c'est elle qui part au registre public.
    pub fn empreinte(&self) -> String {
        hex(&self.lignes.last().expect("une feuille a toujours son ouverture").empreinte)
    }

    pub fn lignes(&self) -> &[Ligne] {
        &self.lignes
    }

    /// Le journal en texte, une ligne par événement : c'est ce que gardent le formateur,
    /// le centre et l'apprenant, et ce qui prouve la feuille.
    pub fn journal(&self) -> String {
        let mut t = String::from(ENTETE);
        for l in &self.lignes {
            t.push('\n');
            t.push_str(&l.texte);
        }
        t
    }

    /// Relit un journal, en vérifiant chaque ligne comme à son arrivée.
    /// Le secret de l'appel, s'il est connu, permet de continuer l'appel.
    pub fn relire(journal: &str, secret: Option<SecretDeSeance>) -> Result<Self, Erreur> {
        let mut lignes = journal.split('\n');
        if lignes.next() != Some(ENTETE) {
            return Err(Erreur::JournalAbime);
        }
        let lues: Vec<(u64, Evenement, String)> = lignes
            .enumerate()
            .map(|(n, texte)| {
                let champs: Vec<&str> = texte.split('\t').collect();
                if champs.len() < 3 || champs[0] != n.to_string() {
                    return Err(Erreur::JournalAbime);
                }
                let quand = champs[1].parse().map_err(|_| Erreur::JournalAbime)?;
                Ok((quand, Evenement::lire(&champs[2..])?, texte.to_owned()))
            })
            .collect::<Result<_, Erreur>>()?;
        let revele = lues.iter().rev().find_map(|(_, e, _)| match e {
            Evenement::Cloture { secret, .. } => Some(secret.clone()),
            _ => None,
        });
        let Some((_, Evenement::Ouverture { engagement, formateur, .. }, _)) = lues.first() else {
            return Err(Erreur::JournalAbime);
        };
        let secret = revele.or(secret);
        if secret.as_ref().is_some_and(|s| &s.engagement() != engagement) {
            return Err(Erreur::JournalAbime);
        }
        let formateur = formateur.clone();
        let mut feuille = Feuille { secret, lignes: Vec::new() };
        for (quand, evenement, texte) in lues {
            let precedente = feuille.lignes.last().map_or([0u8; 32], |l| l.empreinte);
            feuille.verifier_ligne(&evenement, quand, &precedente, &texte, &formateur)?;
            feuille.lignes.push(Ligne { quand, empreinte: empreinte_de(&precedente, &texte), texte, evenement });
        }
        Ok(feuille)
    }

    fn verifier_ligne(
        &self,
        evenement: &Evenement,
        quand: u64,
        precedente: &[u8; 32],
        texte: &str,
        formateur: &ClePublique,
    ) -> Result<(), Erreur> {
        let abime = |_| Erreur::JournalAbime;
        if let Some(signature) = evenement.signature() {
            let sans = texte.rsplit_once('\t').ok_or(Erreur::JournalAbime)?.0;
            formateur.verifier(&empreinte_de(precedente, sans), signature).map_err(abime)?;
        }
        if self.lignes.is_empty() != matches!(evenement, Evenement::Ouverture { .. }) {
            return Err(Erreur::JournalAbime);
        }
        let mut essai = self.clone();
        match evenement {
            Evenement::Ouverture { .. } => Ok(()),
            Evenement::Presence { voie, presence } => match essai.recevoir(presence, *voie, quand).map_err(abime)? {
                Recu::Nouvelle => Ok(()),
                Recu::Deja => Err(Erreur::JournalAbime),
            },
            Evenement::Ici { membre } => match essai.signer_ici(membre, quand).map_err(abime)? {
                Recu::Nouvelle => Ok(()),
                Recu::Deja => Err(Erreur::JournalAbime),
            },
            Evenement::Retard { membre, .. } | Evenement::Depart { membre, .. } => {
                if self.close() {
                    return Err(Erreur::JournalAbime);
                }
                self.inscrit(membre).map_err(abime)
            }
            Evenement::Cloture { presents, absents, .. } => {
                let (p, total) = self.compte();
                if self.close() || *presents != p || *absents != total - p {
                    return Err(Erreur::JournalAbime);
                }
                Ok(())
            }
            Evenement::Reouverture => essai.annuler_cloture(quand).map_err(abime),
            Evenement::Correction { membre, .. } => {
                if !self.close() {
                    return Err(Erreur::JournalAbime);
                }
                self.inscrit(membre).map_err(abime)
            }
        }
    }
}

/// Vérifie un journal reçu, sans rien savoir de plus : les empreintes, les signatures,
/// les codes une fois le secret révélé. Rend l'empreinte de la dernière ligne.
pub fn verifier_journal(journal: &str) -> Result<String, Erreur> {
    Feuille::relire(journal, None).map(|f| f.empreinte())
}

//! Ce que le cœur expose au navigateur. Les heures arrivent en millisecondes (`Date.now()`),
//! les erreurs repartent avec leur code, que l'écran traduit.

use wasm_bindgen::prelude::*;

use crate::appel::{Demi, IdSeance, Presence, Qr};
use crate::classe::{Acceptation, CodeDeClasse, Membre};
use crate::cles::{CleAppareil, ClePublique};
use crate::encodage::{b64, de_b64};
use crate::entree::{Demande, Porte, Responsable, Role};
use crate::erreur::Erreur;
use crate::feuille::{EtatPresence, Feuille, Recu, Voie};
use crate::fil::SecretDuFil;
use crate::{appel, feuille, lettre};

impl From<Erreur> for JsValue {
    fn from(e: Erreur) -> Self {
        JsError::new(e.code()).into()
    }
}

fn heure(ms: f64) -> u64 {
    ms.max(0.0) as u64
}

fn demi(texte: &str) -> Result<Demi, Erreur> {
    Demi::lire(texte)
}

/// Les clés de cet appareil.
#[wasm_bindgen]
pub struct Appareil(CleAppareil);

#[wasm_bindgen]
impl Appareil {
    #[wasm_bindgen(constructor)]
    pub fn nouveau() -> Result<Appareil, Erreur> {
        Ok(Appareil(CleAppareil::nouvelle()?))
    }

    /// Relit les clés gardées : le texte rendu par `secrets()`.
    pub fn relire(secrets: &str) -> Result<Appareil, Erreur> {
        let octets = de_b64(secrets)?;
        if octets.len() != 64 {
            return Err(Erreur::CleInvalide);
        }
        let (signe, boite) = octets.split_at(32);
        Ok(Appareil(CleAppareil::depuis_octets(
            signe.try_into().map_err(|_| Erreur::CleInvalide)?,
            boite.try_into().map_err(|_| Erreur::CleInvalide)?,
        )?))
    }

    /// Les deux clés secrètes en un texte, pour que l'appareil les garde.
    pub fn secrets(&self) -> String {
        let (signe, boite) = self.0.octets();
        b64(&[signe, boite].concat())
    }

    pub fn cle(&self) -> String {
        self.0.publique().texte()
    }

    pub fn boite(&self) -> String {
        self.0.boite().texte()
    }

    pub fn ouvrir(&self, lettre: &str) -> Result<String, Erreur> {
        String::from_utf8(self.0.ouvrir(lettre)?).map_err(|_| Erreur::LettreIllisible)
    }

    /// Signe sa présence avec le QR lu par la caméra. Rend la présence en texte.
    pub fn signer_qr(&self, qr: &str, maintenant: f64) -> Result<String, Erreur> {
        Ok(Presence::depuis_qr(&self.0, &Qr::lire(qr)?, heure(maintenant))?.texte())
    }

    /// Demande à entrer dans la classe : le prénom, le nom, et les clés de cet appareil, signés par lui.
    pub fn demander_entree(&self, code: &str, prenom: &str, nom: &str, maintenant: f64) -> Result<String, Erreur> {
        Demande::signer(&CodeDeClasse::lire(code)?.secrets(), prenom, nom, &self.0, heure(maintenant))
    }

    /// Accepte une demande d'entrée. Rend l'acceptation signée, à remettre à l'apprenant.
    pub fn accepter(&self, code: &str, demande: &str, maintenant: f64) -> Result<String, Erreur> {
        let classe = CodeDeClasse::lire(code)?.secrets();
        let demande = Demande::lire(&classe, demande)?;
        Acceptation::signer(&classe, demande.membre, &self.0, heure(maintenant))?.texte(&classe)
    }

    /// Signe sa présence avec les six chiffres tapés.
    pub fn signer_code(&self, seance: &str, code: &str, maintenant: f64) -> Result<String, Erreur> {
        Ok(Presence::depuis_code(&self.0, IdSeance::lire(seance)?, code, heure(maintenant))?.texte())
    }
}

/// L'étiquette de la classe, que voient les relais.
#[wasm_bindgen]
pub fn etiquette_de_classe(code: &str) -> Result<String, Erreur> {
    Ok(CodeDeClasse::lire(code)?.secrets().etiquette().to_owned())
}

/// L'identifiant d'une demi-journée de la classe, calculé sans rien échanger.
#[wasm_bindgen]
pub fn seance(code: &str, date: &str, demi_journee: &str) -> Result<String, Erreur> {
    Ok(CodeDeClasse::lire(code)?.secrets().seance(date, demi(demi_journee)?)?.texte().to_owned())
}

/// Un code de classe neuf, tel qu'on l'affiche.
#[wasm_bindgen]
pub fn nouveau_code_de_classe() -> Result<String, Erreur> {
    Ok(CodeDeClasse::nouveau()?.affiche())
}

/// Un responsable de la classe.
#[wasm_bindgen(getter_with_clone)]
#[derive(Clone)]
pub struct ResponsableJs {
    pub prenom: String,
    pub nom: String,
    /// `formateur` ou `centre`.
    pub role: String,
    pub cle: String,
    pub boite: String,
}

/// Ce que dit la porte d'une classe.
#[wasm_bindgen(getter_with_clone)]
pub struct PorteJs {
    pub nom: String,
    pub centre: String,
    pub matin: String,
    pub apres_midi: String,
    pub quand: f64,
    pub texte: String,
    pub responsables: Vec<ResponsableJs>,
}

impl From<Porte> for PorteJs {
    fn from(p: Porte) -> Self {
        PorteJs {
            responsables: p
                .responsables
                .iter()
                .map(|r| ResponsableJs {
                    prenom: r.prenom.clone(),
                    nom: r.nom.clone(),
                    role: r.role.texte().into(),
                    cle: r.cle.texte(),
                    boite: r.boite.texte(),
                })
                .collect(),
            nom: p.nom,
            centre: p.centre,
            matin: p.matin,
            apres_midi: p.apres_midi,
            quand: p.quand as f64,
            texte: p.texte,
        }
    }
}

/// Un apprenant qui demande à entrer, ou qui a été accepté.
#[wasm_bindgen(getter_with_clone)]
pub struct MembreJs {
    pub prenom: String,
    pub nom: String,
    pub cle: String,
    pub boite: String,
    pub quand: f64,
}

fn membre_js(m: Membre, quand: u64) -> MembreJs {
    MembreJs { prenom: m.prenom, nom: m.nom, cle: m.cle.texte(), boite: m.boite.texte(), quand: quand as f64 }
}

/// Le chef signe la porte. Les responsables arrivent en texte : une ligne chacun, prénom, nom,
/// rôle, clé et boîte séparés par des tabulations, le chef en premier.
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn signer_porte(
    code: &str,
    nom: &str,
    centre: &str,
    matin: &str,
    apres_midi: &str,
    responsables: &str,
    chef: &Appareil,
    maintenant: f64,
) -> Result<String, Erreur> {
    let responsables = responsables
        .lines()
        .filter(|l| !l.is_empty())
        .map(|l| match l.split('\t').collect::<Vec<_>>()[..] {
            [prenom, nom, role, cle, boite] => Ok(Responsable {
                prenom: prenom.into(),
                nom: nom.into(),
                role: Role::lire(role)?,
                cle: ClePublique::lire(cle)?,
                boite: ClePublique::lire(boite)?,
            }),
            _ => Err(Erreur::ChampInvalide),
        })
        .collect::<Result<Vec<_>, Erreur>>()?;
    Porte::signer(&CodeDeClasse::lire(code)?.secrets(), nom, centre, matin, apres_midi, &responsables, &chef.0, heure(maintenant))
}

/// Choisit la porte parmi celles que rendent les relais. `chef` vient du lien du QR, s'il y en a un.
#[wasm_bindgen]
pub fn choisir_porte(code: &str, textes: Vec<String>, chef: Option<String>) -> Result<PorteJs, Erreur> {
    let chef = chef.map(|c| ClePublique::lire(&c)).transpose()?;
    let textes: Vec<&str> = textes.iter().map(String::as_str).collect();
    Ok(crate::entree::choisir_porte(&CodeDeClasse::lire(code)?.secrets(), &textes, chef.as_ref())?.into())
}

#[wasm_bindgen]
pub fn lire_porte(code: &str, texte: &str) -> Result<PorteJs, Erreur> {
    Ok(Porte::lire(&CodeDeClasse::lire(code)?.secrets(), texte)?.into())
}

#[wasm_bindgen]
pub fn lire_demande(code: &str, demande: &str) -> Result<MembreJs, Erreur> {
    let d = Demande::lire(&CodeDeClasse::lire(code)?.secrets(), demande)?;
    Ok(membre_js(d.membre, d.quand))
}

/// Relit une acceptation, et vérifie qu'un des responsables donnés l'a signée.
#[wasm_bindgen]
pub fn lire_acceptation(code: &str, acceptation: &str, responsables: Vec<String>) -> Result<MembreJs, Erreur> {
    let responsables = responsables.iter().map(|c| ClePublique::lire(c)).collect::<Result<Vec<_>, Erreur>>()?;
    let a = Acceptation::lire(&CodeDeClasse::lire(code)?.secrets(), acceptation, &responsables)?;
    Ok(membre_js(a.membre, a.quand))
}

/// Chiffre pour qui a le code de la classe : c'est ainsi que voyage la porte.
#[wasm_bindgen]
pub fn chiffrer_pour_la_classe(code: &str, texte: &str) -> Result<String, Erreur> {
    CodeDeClasse::lire(code)?.secrets().chiffrer(texte.as_bytes())
}

#[wasm_bindgen]
pub fn dechiffrer_pour_la_classe(code: &str, chiffre: &str) -> Result<String, Erreur> {
    String::from_utf8(CodeDeClasse::lire(code)?.secrets().dechiffrer(chiffre)?).map_err(|_| Erreur::LettreIllisible)
}

#[wasm_bindgen]
pub fn nouveau_secret_du_fil() -> Result<String, Erreur> {
    Ok(SecretDuFil::nouveau()?.texte())
}

#[wasm_bindgen]
pub fn etiquette_du_fil(secret: &str) -> Result<String, Erreur> {
    Ok(SecretDuFil::lire(secret)?.etiquette())
}

#[wasm_bindgen]
pub fn chiffrer_pour_le_fil(secret: &str, texte: &str) -> Result<String, Erreur> {
    SecretDuFil::lire(secret)?.chiffrer(texte.as_bytes())
}

#[wasm_bindgen]
pub fn dechiffrer_du_fil(secret: &str, chiffre: &str) -> Result<String, Erreur> {
    String::from_utf8(SecretDuFil::lire(secret)?.dechiffrer(chiffre)?).map_err(|_| Erreur::LettreIllisible)
}

/// Une clé publique sous sa forme courte, pour la faire tenir dans un lien.
#[wasm_bindgen]
pub fn cle_courte(cle: &str) -> Result<String, Erreur> {
    Ok(ClePublique::lire(cle)?.courte())
}

/// Une clé publique sous sa forme longue, celle qui se compare.
#[wasm_bindgen]
pub fn cle_longue(cle: &str) -> Result<String, Erreur> {
    Ok(ClePublique::lire(cle)?.texte())
}

/// La séance que porte le QR de la salle, pour savoir de quelle classe il vient.
#[wasm_bindgen]
pub fn seance_du_qr(qr: &str) -> Result<String, Erreur> {
    Ok(Qr::lire(qr)?.seance.texte().to_owned())
}

#[wasm_bindgen]
pub fn sceller(boite: &str, texte: &str) -> Result<String, Erreur> {
    lettre::sceller(&ClePublique::lire(boite)?, texte.as_bytes())
}

#[wasm_bindgen]
pub fn etiquette_de_boite(boite: &str) -> Result<String, Erreur> {
    Ok(lettre::etiquette_de_boite(&ClePublique::lire(boite)?))
}

/// La clé de l'appareil qui a signé une présence, pour savoir qui elle concerne.
#[wasm_bindgen]
pub fn cle_de_la_presence(presence: &str) -> Result<String, Erreur> {
    Ok(Presence::lire(presence)?.cle.texte())
}

/// Un événement Nostr prêt à partir, signé d'une clé jetable. Les heures sont en secondes, comme Nostr.
#[wasm_bindgen]
pub fn evenement_nostr(etiquette: &str, expiration_s: f64, contenu: &str, maintenant_s: f64) -> Result<String, Erreur> {
    crate::nostr::evenement(etiquette, heure(expiration_s), contenu, heure(maintenant_s))
}

/// Le dessin d'un QR, en SVG.
#[wasm_bindgen]
pub fn svg_du_qr(texte: &str) -> Result<String, Erreur> {
    crate::dessin::svg_du_qr(texte)
}

#[wasm_bindgen]
pub fn verifier_journal(journal: &str) -> Result<String, Erreur> {
    feuille::verifier_journal(journal)
}

#[wasm_bindgen]
pub fn pas_du_qr() -> f64 {
    appel::PAS_DU_QR_MS as f64
}

/// Ce que montre l'écran de la salle à un instant.
#[wasm_bindgen(getter_with_clone)]
pub struct QrDeLaSalle {
    pub texte: String,
    pub code: String,
}

/// Un inscrit et son état, pour la liste du formateur.
#[wasm_bindgen(getter_with_clone)]
pub struct Ligne {
    pub prenom: String,
    pub nom: String,
    pub cle: String,
    /// `pas-encore`, `present` ou `absent`.
    pub etat: String,
    /// `reseau`, `qr` ou `ici` pour une présence, sinon vide.
    pub voie: String,
    pub quand: f64,
    pub retard: Option<f64>,
    pub depart: Option<f64>,
    pub corrige: bool,
}

/// L'appel, tenu par l'appareil du formateur.
#[wasm_bindgen]
pub struct Appel {
    feuille: Feuille,
    formateur: CleAppareil,
}

/// Les inscrits arrivent en texte : une ligne par apprenant, prénom, nom, clé et boîte séparés par des tabulations.
fn lire_inscrits(texte: &str) -> Result<Vec<Membre>, Erreur> {
    texte
        .lines()
        .filter(|l| !l.is_empty())
        .map(|l| match l.split('\t').collect::<Vec<_>>()[..] {
            [prenom, nom, cle, boite] => {
                Ok(Membre { prenom: prenom.into(), nom: nom.into(), cle: ClePublique::lire(cle)?, boite: ClePublique::lire(boite)? })
            }
            _ => Err(Erreur::ChampInvalide),
        })
        .collect()
}

#[wasm_bindgen]
impl Appel {
    /// Le formateur lance l'appel d'une demi-journée.
    pub fn ouvrir(
        code: &str,
        date: &str,
        demi_journee: &str,
        formateur: &Appareil,
        inscrits: &str,
        maintenant: f64,
    ) -> Result<Appel, Erreur> {
        let secrets = CodeDeClasse::lire(code)?.secrets();
        let feuille = Feuille::ouvrir(&secrets, date, demi(demi_journee)?, &formateur.0, &lire_inscrits(inscrits)?, heure(maintenant))?;
        Ok(Appel { feuille, formateur: formateur.0.clone() })
    }

    /// Reprend un appel gardé : son journal et son secret.
    pub fn relire(journal: &str, secret: Option<String>, formateur: &Appareil) -> Result<Appel, Erreur> {
        let secret = secret.map(|s| appel::SecretDeSeance::lire(&s)).transpose()?;
        Ok(Appel { feuille: Feuille::relire(journal, secret)?, formateur: formateur.0.clone() })
    }

    pub fn seance(&self) -> String {
        self.feuille.seance().texte().to_owned()
    }

    /// Le secret de l'appel, à garder avec le journal pour reprendre l'appel.
    pub fn secret(&self) -> Option<String> {
        self.feuille.secret().map(|s| s.texte())
    }

    pub fn qr(&self, maintenant: f64) -> Result<QrDeLaSalle, Erreur> {
        let qr = self.feuille.qr(heure(maintenant))?;
        Ok(QrDeLaSalle { texte: qr.texte(), code: qr.code })
    }

    /// Une présence arrive, par le réseau (`reseau`) ou lue dans le QR de l'apprenant (`qr`).
    /// Rend `nouvelle` ou `deja`.
    pub fn recevoir(&mut self, presence: &str, voie: &str, maintenant: f64) -> Result<String, Erreur> {
        let voie = match voie {
            "reseau" => Voie::Reseau,
            "qr" => Voie::QrLu,
            _ => return Err(Erreur::ChampInvalide),
        };
        recu(self.feuille.recevoir(&Presence::lire(presence)?, voie, heure(maintenant))?)
    }

    pub fn signer_ici(&mut self, cle: &str, maintenant: f64) -> Result<String, Erreur> {
        recu(self.feuille.signer_ici(&ClePublique::lire(cle)?, heure(maintenant))?)
    }

    pub fn noter_retard(&mut self, cle: &str, a: f64, maintenant: f64) -> Result<(), Erreur> {
        self.feuille.noter_retard(&ClePublique::lire(cle)?, heure(a), heure(maintenant))
    }

    pub fn noter_depart(&mut self, cle: &str, a: f64, maintenant: f64) -> Result<(), Erreur> {
        self.feuille.noter_depart(&ClePublique::lire(cle)?, heure(a), heure(maintenant))
    }

    /// Clôt et contresigne. Rend le nombre de présents et d'absents.
    pub fn clore(&mut self, maintenant: f64) -> Result<Vec<u32>, Erreur> {
        let (presents, absents) = self.feuille.clore(&self.formateur, heure(maintenant))?;
        Ok(vec![presents, absents])
    }

    pub fn annuler_cloture(&mut self, maintenant: f64) -> Result<(), Erreur> {
        self.feuille.annuler_cloture(heure(maintenant))
    }

    pub fn corriger(&mut self, cle: &str, present: bool, motif: &str, maintenant: f64) -> Result<(), Erreur> {
        self.feuille.corriger(&self.formateur, &ClePublique::lire(cle)?, present, motif, heure(maintenant))
    }

    pub fn close(&self) -> bool {
        self.feuille.close()
    }

    pub fn cloture_a(&self) -> Option<f64> {
        self.feuille.cloture_a().map(|h| h as f64)
    }

    pub fn date(&self) -> String {
        self.feuille.date().to_owned()
    }

    /// `matin` ou `apres-midi`.
    pub fn demi(&self) -> String {
        self.feuille.demi().texte().to_owned()
    }

    pub fn definitive(&self, maintenant: f64) -> bool {
        self.feuille.definitive(heure(maintenant))
    }

    /// Combien ont signé, et combien sont inscrits : tout ce que voit la salle.
    pub fn compte(&self) -> Vec<u32> {
        let (presents, inscrits) = self.feuille.compte();
        vec![presents, inscrits]
    }

    pub fn lignes(&self) -> Vec<Ligne> {
        self.feuille
            .etat()
            .into_iter()
            .map(|e| {
                let (etat, voie, quand) = match e.presence {
                    EtatPresence::PasEncore => ("pas-encore", "", 0),
                    EtatPresence::Absent => ("absent", "", 0),
                    EtatPresence::Present { quand, voie } => ("present", voie_texte(voie), quand),
                };
                Ligne {
                    prenom: e.prenom,
                    nom: e.nom,
                    cle: e.cle.texte(),
                    etat: etat.into(),
                    voie: voie.into(),
                    quand: quand as f64,
                    retard: e.retard.map(|h| h as f64),
                    depart: e.depart.map(|h| h as f64),
                    corrige: e.corrige,
                }
            })
            .collect()
    }

    pub fn journal(&self) -> String {
        self.feuille.journal()
    }

    pub fn empreinte(&self) -> String {
        self.feuille.empreinte()
    }
}

fn recu(r: Recu) -> Result<String, Erreur> {
    Ok(match r {
        Recu::Nouvelle => "nouvelle",
        Recu::Deja => "deja",
    }
    .into())
}

fn voie_texte(v: Voie) -> &'static str {
    match v {
        Voie::Reseau => "reseau",
        Voie::QrLu => "qr",
        Voie::Ici => "ici",
    }
}

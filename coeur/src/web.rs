//! Ce que le cœur expose au navigateur. Les heures arrivent en millisecondes (`Date.now()`),
//! les erreurs repartent avec leur code, que l'écran traduit.

use std::cell::RefCell;

use wasm_bindgen::prelude::*;

use crate::annonce::{AnnonceDeLAppel, EtatDeLAppel, ProchainCours};
use crate::appel::{Demi, IdSeance, Presence, Qr};
use crate::classe::{Acceptation, CodeDeClasse, Membre, SecretsDeClasse};
use crate::cles::{CleAppareil, ClePublique};
use crate::encodage::{b64, de_b64};
use crate::entree::{Demande, Porte, Responsable, Role};
use crate::erreur::Erreur;
use crate::feuille::{EtatPresence, Feuille, Recu, Voie};
use crate::fil::SecretDuFil;
use crate::responsables::{CorrectionDeNom, EntreResponsables, Passation};
use crate::{appel, feuille, lettre};

impl From<Erreur> for JsValue {
    fn from(e: Erreur) -> Self {
        JsError::new(e.code()).into()
    }
}

thread_local! {
    static SECRETS: RefCell<Vec<(String, SecretsDeClasse)>> = const { RefCell::new(Vec::new()) };
}

/// Les secrets d'une classe se tirent de son code par PBKDF2, 100 000 tours : un calcul long dans
/// le navigateur, dont l'écran a besoin à chaque dessin. On les garde le temps de la page, et
/// l'appareil les garde avec la classe (`secrets_de_la_classe`).
fn secrets(code: &str) -> Result<SecretsDeClasse, Erreur> {
    let code = CodeDeClasse::lire(code)?;
    SECRETS.with(|gardes| {
        let mut gardes = gardes.borrow_mut();
        if let Some((_, s)) = gardes.iter().find(|(c, _)| c == code.texte()) {
            return Ok(s.clone());
        }
        let s = code.secrets();
        gardes.push((code.texte().to_owned(), s.clone()));
        Ok(s)
    })
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
        Demande::signer(&secrets(code)?, prenom, nom, &self.0, heure(maintenant))
    }

    /// Accepte une demande d'entrée. Rend l'acceptation signée, à remettre à l'apprenant.
    pub fn accepter(&self, code: &str, demande: &str, maintenant: f64) -> Result<String, Erreur> {
        let classe = secrets(code)?;
        let demande = Demande::lire(&classe, demande)?;
        Acceptation::signer(&classe, demande.membre, &self.0, heure(maintenant))?.texte(&classe)
    }

    /// Signe sa présence avec les six chiffres tapés.
    pub fn signer_code(&self, seance: &str, code: &str, maintenant: f64) -> Result<String, Erreur> {
        Ok(Presence::depuis_code(&self.0, IdSeance::lire(seance)?, code, heure(maintenant))?.texte())
    }

    /// Corrige son prénom et son nom, signés par cet appareil. Les responsables gardent l'ancien.
    pub fn corriger_son_nom(&self, code: &str, prenom: &str, nom: &str, maintenant: f64) -> Result<String, Erreur> {
        CorrectionDeNom::signer(&secrets(code)?, &self.0, prenom, nom, heure(maintenant))
    }

    /// Le chef passe la main à un autre responsable. La passation voyage comme la porte.
    pub fn passer_la_main(&self, code: &str, nouveau: &str, maintenant: f64) -> Result<String, Erreur> {
        Passation::signer(&secrets(code)?, &self.0, &ClePublique::lire(nouveau)?, heure(maintenant))
    }

    /// Une lettre aux autres responsables, signée : leurs boîtes sont dans la porte, que tous lisent.
    pub fn ecrire_aux_responsables(&self, code: &str, contenu: &str, maintenant: f64) -> Result<String, Erreur> {
        EntreResponsables::signer(&secrets(code)?, &self.0, contenu, heure(maintenant))
    }

    /// Le responsable dit à la classe, sur le fil, la date et la demi-journée du prochain cours.
    pub fn prochain_cours(&self, fil: &str, date: &str, demi_journee: &str, maintenant: f64) -> Result<String, Erreur> {
        let fil = SecretDuFil::lire(fil)?;
        ProchainCours::signer(&fil, date, demi(demi_journee)?, &self.0, heure(maintenant))?.texte(&fil)
    }
}

/// L'étiquette de la classe, que voient les relais.
#[wasm_bindgen]
pub fn etiquette_de_classe(code: &str) -> Result<String, Erreur> {
    Ok(secrets(code)?.etiquette().to_owned())
}

/// Les secrets de la classe en texte, à garder sur l'appareil avec elle : les tirer du code
/// prend 140 ms dans un navigateur, à chaque ouverture (docs/mesures.md).
#[wasm_bindgen]
pub fn secrets_de_la_classe(code: &str) -> Result<String, Erreur> {
    let code = CodeDeClasse::lire(code)?;
    Ok(secrets(code.texte())?.texte(&code))
}

/// Redonne au cœur les secrets gardés d'une classe : il ne les tire plus de son code.
#[wasm_bindgen]
pub fn reprendre_les_secrets(code: &str, texte: &str) -> Result<(), Erreur> {
    let code = CodeDeClasse::lire(code)?;
    let relus = SecretsDeClasse::lire(&code, texte)?;
    SECRETS.with(|gardes| {
        let mut gardes = gardes.borrow_mut();
        if !gardes.iter().any(|(c, _)| c == code.texte()) {
            gardes.push((code.texte().to_owned(), relus));
        }
    });
    Ok(())
}

/// L'identifiant d'une demi-journée de la classe, calculé sans rien échanger.
#[wasm_bindgen]
pub fn seance(code: &str, date: &str, demi_journee: &str) -> Result<String, Erreur> {
    Ok(secrets(code)?.seance(date, demi(demi_journee)?)?.texte().to_owned())
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
    Porte::signer(&secrets(code)?, nom, centre, matin, apres_midi, &responsables, &chef.0, heure(maintenant))
}

/// Choisit la porte parmi celles que rendent les relais. `chef` vient du lien du QR, s'il y en a un.
#[wasm_bindgen]
pub fn choisir_porte(code: &str, textes: Vec<String>, chef: Option<String>) -> Result<PorteJs, Erreur> {
    let chef = chef.map(|c| ClePublique::lire(&c)).transpose()?;
    let textes: Vec<&str> = textes.iter().map(String::as_str).collect();
    Ok(crate::entree::choisir_porte(&secrets(code)?, &textes, chef.as_ref())?.into())
}

#[wasm_bindgen]
pub fn lire_porte(code: &str, texte: &str) -> Result<PorteJs, Erreur> {
    Ok(Porte::lire(&secrets(code)?, texte)?.into())
}

/// Qui a passé la main, à qui, et quand.
#[wasm_bindgen(getter_with_clone)]
pub struct PassationJs {
    pub ancien: String,
    pub nouveau: String,
    pub quand: f64,
}

/// Relit une passation, et vérifie que l'ancien chef l'a signée.
#[wasm_bindgen]
pub fn lire_passation(code: &str, texte: &str) -> Result<PassationJs, Erreur> {
    let p = Passation::lire(&secrets(code)?, texte)?;
    Ok(PassationJs { ancien: p.ancien.texte(), nouveau: p.nouveau.texte(), quand: p.quand as f64 })
}

/// Un nom corrigé : la clé de celui qui l'a corrigé, et son nouveau nom.
#[wasm_bindgen(getter_with_clone)]
pub struct CorrectionJs {
    pub cle: String,
    pub prenom: String,
    pub nom: String,
    pub quand: f64,
}

/// Relit un nom corrigé, et vérifie que la clé qu'il porte l'a signé.
#[wasm_bindgen]
pub fn lire_correction_de_nom(code: &str, texte: &str) -> Result<CorrectionJs, Erreur> {
    let c = CorrectionDeNom::lire(&secrets(code)?, texte)?;
    Ok(CorrectionJs { cle: c.cle.texte(), prenom: c.prenom, nom: c.nom, quand: c.quand as f64 })
}

/// Le chef actuel : on suit les passations, parmi les textes donnés, à partir du chef qu'on connaît.
#[wasm_bindgen]
pub fn chef_actuel(code: &str, textes: Vec<String>, depart: &str) -> Result<String, Erreur> {
    let classe = secrets(code)?;
    let passations: Vec<Passation> = textes.iter().filter_map(|t| Passation::lire(&classe, t).ok()).collect();
    let regnes = crate::responsables::lignee(&passations, &ClePublique::lire(depart)?);
    Ok(regnes.last().expect("une lignée a toujours un chef").chef.texte())
}

/// Une lettre d'un responsable aux autres.
#[wasm_bindgen(getter_with_clone)]
pub struct EntreResponsablesJs {
    pub de: String,
    pub quand: f64,
    pub contenu: String,
}

/// Relit une lettre entre responsables. Elle ne compte que signée par l'un des responsables donnés.
#[wasm_bindgen]
pub fn lire_entre_responsables(code: &str, texte: &str, responsables: Vec<String>) -> Result<EntreResponsablesJs, Erreur> {
    let responsables = responsables.iter().map(|c| ClePublique::lire(c)).collect::<Result<Vec<_>, Erreur>>()?;
    let l = EntreResponsables::lire(&secrets(code)?, texte, &responsables)?;
    Ok(EntreResponsablesJs { de: l.de.texte(), quand: l.quand as f64, contenu: l.contenu })
}

#[wasm_bindgen]
pub fn lire_demande(code: &str, demande: &str) -> Result<MembreJs, Erreur> {
    let d = Demande::lire(&secrets(code)?, demande)?;
    Ok(membre_js(d.membre, d.quand))
}

/// Relit une acceptation, et vérifie qu'un des responsables donnés l'a signée.
#[wasm_bindgen]
pub fn lire_acceptation(code: &str, acceptation: &str, responsables: Vec<String>) -> Result<MembreJs, Erreur> {
    let responsables = responsables.iter().map(|c| ClePublique::lire(c)).collect::<Result<Vec<_>, Erreur>>()?;
    let a = Acceptation::lire(&secrets(code)?, acceptation, &responsables)?;
    Ok(membre_js(a.membre, a.quand))
}

/// Chiffre pour qui a le code de la classe : c'est ainsi que voyage la porte.
#[wasm_bindgen]
pub fn chiffrer_pour_la_classe(code: &str, texte: &str) -> Result<String, Erreur> {
    secrets(code)?.chiffrer(texte.as_bytes())
}

#[wasm_bindgen]
pub fn dechiffrer_pour_la_classe(code: &str, chiffre: &str) -> Result<String, Erreur> {
    String::from_utf8(secrets(code)?.dechiffrer(chiffre)?).map_err(|_| Erreur::LettreIllisible)
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

/// Le texte du QR que montre l'image de la caméra, en niveaux de gris. Rend l'erreur `pas-de-qr`
/// tant qu'aucun QR n'est lisible.
#[wasm_bindgen]
pub fn lire_qr(gris: &[u8], largeur: u32, hauteur: u32) -> Result<String, Erreur> {
    crate::lecture::lire_qr(gris, largeur as usize, hauteur as usize)
}

/// L'état de l'appel d'une demi-journée, tel qu'un responsable l'a annoncé sur le fil.
#[wasm_bindgen(getter_with_clone)]
pub struct AnnonceJs {
    pub seance: String,
    pub date: String,
    /// `matin` ou `apres-midi`.
    pub demi: String,
    /// `ouvert` ou `clos`.
    pub etat: String,
    pub quand: f64,
    /// La clé du responsable qui l'a signée.
    pub par: String,
}

/// Le prochain cours d'une classe, tel qu'un responsable l'a annoncé sur le fil.
#[wasm_bindgen(getter_with_clone)]
pub struct ProchainJs {
    pub date: String,
    /// `matin` ou `apres-midi`.
    pub demi: String,
    pub quand: f64,
    pub par: String,
}

/// Relit le prochain cours venu du fil, et vérifie qu'un des responsables donnés l'a signé.
#[wasm_bindgen]
pub fn lire_prochain_cours(fil: &str, texte: &str, responsables: Vec<String>) -> Result<ProchainJs, Erreur> {
    let responsables = responsables.iter().map(|c| ClePublique::lire(c)).collect::<Result<Vec<_>, Erreur>>()?;
    let p = ProchainCours::lire(&SecretDuFil::lire(fil)?, texte, &responsables)?;
    Ok(ProchainJs { date: p.date, demi: p.demi.texte().into(), quand: p.quand as f64, par: p.par.texte() })
}

/// Relit une annonce de l'appel venue du fil, et vérifie qu'un des responsables donnés l'a signée.
#[wasm_bindgen]
pub fn lire_annonce_de_l_appel(code: &str, fil: &str, texte: &str, responsables: Vec<String>) -> Result<AnnonceJs, Erreur> {
    let responsables = responsables.iter().map(|c| ClePublique::lire(c)).collect::<Result<Vec<_>, Erreur>>()?;
    let a = AnnonceDeLAppel::lire(&SecretDuFil::lire(fil)?, &secrets(code)?, texte, &responsables)?;
    Ok(AnnonceJs {
        seance: a.seance.texte().into(),
        date: a.date,
        demi: a.demi.texte().into(),
        etat: a.etat.texte().into(),
        quand: a.quand as f64,
        par: a.par.texte(),
    })
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

/// La séance d'une présence : chaque responsable la reçoit, seul celui qui tient cet appel répond.
#[wasm_bindgen]
pub fn seance_de_la_presence(presence: &str) -> Result<String, Erreur> {
    Ok(Presence::lire(presence)?.seance.texte().to_owned())
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
        let secrets = secrets(code)?;
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

    /// Ce que le formateur dit à la classe sur le fil : l'appel est ouvert, ou clos.
    pub fn annonce(&self, fil: &str, maintenant: f64) -> Result<String, Erreur> {
        let etat = if self.feuille.close() { EtatDeLAppel::Clos } else { EtatDeLAppel::Ouvert };
        let fil = SecretDuFil::lire(fil)?;
        let f = &self.feuille;
        AnnonceDeLAppel::signer(&fil, f.seance(), f.date(), f.demi(), etat, &self.formateur, heure(maintenant))?.texte(&fil)
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

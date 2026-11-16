//! Ce que le cœur expose au navigateur. Les heures arrivent en millisecondes (`Date.now()`),
//! les erreurs repartent avec leur code, que l'écran traduit.

use wasm_bindgen::prelude::*;

use crate::appel::{Demi, IdSeance, Presence, Qr};
use crate::classe::{CodeDeClasse, Membre};
use crate::cles::{CleAppareil, ClePublique};
use crate::encodage::{b64, de_b64};
use crate::erreur::Erreur;
use crate::feuille::{EtatPresence, Feuille, Recu, Voie};
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

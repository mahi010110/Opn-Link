use hmac::{Hmac, KeyInit, Mac};
use sha2::Sha256;

use crate::cles::{CleAppareil, ClePublique, Signature};
use crate::encodage::{a_signer, b64, de_b64, sha256};
use crate::erreur::Erreur;
use crate::hasard;

/// Le QR de la salle change toutes les dix secondes.
pub const PAS_DU_QR_MS: u64 = 10_000;
/// Un code tapé à la main reste bon une minute, le temps de le lire de loin et de le taper.
/// À mesurer dans une vraie salle.
pub const VALIDITE_DU_CODE_MS: u64 = 60_000;

const QR: &str = "OPL1";
const PRESENCE: &str = "OPS1";

/// Le matin ou l'après-midi.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Demi {
    Matin,
    ApresMidi,
}

impl Demi {
    pub fn texte(self) -> &'static str {
        match self {
            Demi::Matin => "matin",
            Demi::ApresMidi => "apres-midi",
        }
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        match texte {
            "matin" => Ok(Demi::Matin),
            "apres-midi" => Ok(Demi::ApresMidi),
            _ => Err(Erreur::ChampInvalide),
        }
    }
}

/// L'identifiant d'une demi-journée d'une classe : 12 caractères, qui ne disent rien sans la clé de la classe.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IdSeance(String);

impl IdSeance {
    pub(crate) fn depuis_octets(octets: &[u8]) -> Result<Self, Erreur> {
        Ok(IdSeance(b64(octets)))
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        if texte.len() != 12 || de_b64(texte).is_err() {
            return Err(Erreur::ChampInvalide);
        }
        Ok(IdSeance(texte.to_owned()))
    }

    pub fn texte(&self) -> &str {
        &self.0
    }
}

/// Le secret d'un appel, tiré quand le formateur le lance. Il fait les codes du QR,
/// et se révèle à la clôture pour que chacun puisse revérifier les codes.
#[derive(Clone, PartialEq, Eq)]
pub struct SecretDeSeance(pub(crate) [u8; 32]);

// Le secret ne s'écrit jamais dans un message de débogage.
impl core::fmt::Debug for SecretDeSeance {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.write_str("SecretDeSeance(…)")
    }
}

impl SecretDeSeance {
    pub fn nouveau() -> Result<Self, Erreur> {
        Ok(SecretDeSeance(hasard::octets::<32>()?))
    }

    pub fn depuis_octets(octets: [u8; 32]) -> Self {
        SecretDeSeance(octets)
    }

    pub fn texte(&self) -> String {
        b64(&self.0)
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        Ok(SecretDeSeance(de_b64(texte)?.try_into().map_err(|_| Erreur::Encodage)?))
    }

    /// Ce que l'ouverture de la feuille publie : l'empreinte du secret, pas le secret.
    pub fn engagement(&self) -> String {
        b64(&sha256(&["opn-link·engagement·v1".as_bytes(), &self.0]))
    }
}

/// Le code de six chiffres d'une fenêtre de dix secondes.
pub fn code_du_qr(secret: &SecretDeSeance, fenetre: u64) -> String {
    let mut mac = <Hmac<Sha256> as KeyInit>::new_from_slice(&secret.0).expect("une clé HMAC accepte toute longueur");
    mac.update("opn-link·code·v1".as_bytes());
    mac.update(&fenetre.to_be_bytes());
    let octets = mac.finalize().into_bytes();
    let nombre = u32::from_be_bytes([octets[0], octets[1], octets[2], octets[3]]) % 1_000_000;
    format!("{nombre:06}")
}

/// Ce que montre le QR de la salle : la séance, la fenêtre et son code. Pas de nom, jamais.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Qr {
    pub seance: IdSeance,
    pub fenetre: u64,
    pub code: String,
}

impl Qr {
    pub fn texte(&self) -> String {
        format!("{QR}.{}.{}.{}", self.seance.texte(), self.fenetre, self.code)
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        let morceaux: Vec<&str> = texte.trim().split('.').collect();
        let [prefixe, seance, fenetre, code] = morceaux[..] else {
            return Err(Erreur::QrInconnu);
        };
        if prefixe != QR {
            return Err(Erreur::QrInconnu);
        }
        Ok(Qr {
            seance: IdSeance::lire(seance).map_err(|_| Erreur::QrInconnu)?,
            fenetre: fenetre.parse().map_err(|_| Erreur::QrInconnu)?,
            code: lire_code(code).map_err(|_| Erreur::QrInconnu)?,
        })
    }
}

/// Six chiffres, comme on les tape : les espaces ne comptent pas.
pub(crate) fn lire_code(texte: &str) -> Result<String, Erreur> {
    let code: String = texte.chars().filter(|c| !c.is_whitespace()).collect();
    if code.len() != 6 || !code.bytes().all(|o| o.is_ascii_digit()) {
        return Err(Erreur::CodeInconnu);
    }
    Ok(code)
}

/// La présence signée par l'appareil d'un apprenant.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Presence {
    pub seance: IdSeance,
    pub cle: ClePublique,
    pub code: String,
    /// La fenêtre lue dans le QR, ou rien si le code a été tapé.
    pub fenetre: Option<u64>,
    /// L'heure de l'appareil de l'apprenant. Elle se lit, mais ne prouve rien.
    pub heure: u64,
    pub signature: Signature,
}

impl Presence {
    fn octets(seance: &IdSeance, cle: &ClePublique, code: &str, fenetre: Option<u64>, heure: u64) -> Result<Vec<u8>, Erreur> {
        let fenetre = fenetre.map_or_else(|| "-".to_owned(), |f| f.to_string());
        a_signer("opn-link·presence·v1", &[seance.texte(), &cle.texte(), code, &fenetre, &heure.to_string()])
    }

    /// Signe sa présence après avoir lu le QR de la salle.
    pub fn depuis_qr(appareil: &CleAppareil, qr: &Qr, heure: u64) -> Result<Self, Erreur> {
        Self::signer(appareil, qr.seance.clone(), &qr.code, Some(qr.fenetre), heure)
    }

    /// Signe sa présence avec les six chiffres tapés à la main.
    pub fn depuis_code(appareil: &CleAppareil, seance: IdSeance, code: &str, heure: u64) -> Result<Self, Erreur> {
        Self::signer(appareil, seance, &lire_code(code)?, None, heure)
    }

    fn signer(appareil: &CleAppareil, seance: IdSeance, code: &str, fenetre: Option<u64>, heure: u64) -> Result<Self, Erreur> {
        let cle = appareil.publique();
        let signature = appareil.signer(&Self::octets(&seance, &cle, code, fenetre, heure)?);
        Ok(Presence { seance, cle, code: code.to_owned(), fenetre, heure, signature })
    }

    pub fn verifier_signature(&self) -> Result<(), Erreur> {
        self.cle.verifier(&Self::octets(&self.seance, &self.cle, &self.code, self.fenetre, self.heure)?, &self.signature)
    }

    /// La présence en texte : c'est ce que montre le QR d'un apprenant sans réseau,
    /// et ce qui part, scellé, dans la boîte du formateur.
    pub fn texte(&self) -> String {
        let fenetre = self.fenetre.map_or_else(|| "-".to_owned(), |f| f.to_string());
        format!(
            "{PRESENCE}.{}.{}.{fenetre}.{}.{}.{}",
            self.seance.texte(),
            self.code,
            self.heure,
            self.cle.courte(),
            self.signature.texte()
        )
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        let morceaux: Vec<&str> = texte.trim().split('.').collect();
        let [prefixe, seance, code, fenetre, heure, cle, signature] = morceaux[..] else {
            return Err(Erreur::QrInconnu);
        };
        if prefixe != PRESENCE {
            return Err(Erreur::QrInconnu);
        }
        let presence = Presence {
            seance: IdSeance::lire(seance)?,
            cle: ClePublique::lire(cle)?,
            code: lire_code(code)?,
            fenetre: if fenetre == "-" { None } else { Some(fenetre.parse().map_err(|_| Erreur::Encodage)?) },
            heure: heure.parse().map_err(|_| Erreur::Encodage)?,
            signature: Signature::lire(signature)?,
        };
        presence.verifier_signature()?;
        Ok(presence)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::classe::CodeDeClasse;

    fn seance() -> IdSeance {
        CodeDeClasse::lire("RJ4KP 7MX2D W8QHN").unwrap().secrets().seance("2026-11-17", Demi::Matin).unwrap()
    }

    #[test]
    fn le_code_change_avec_la_fenetre() {
        let secret = SecretDeSeance::depuis_octets([7u8; 32]);
        let codes: Vec<String> = (0..20).map(|f| code_du_qr(&secret, f)).collect();
        assert!(codes.iter().all(|c| c.len() == 6 && c.bytes().all(|o| o.is_ascii_digit())));
        assert_eq!(codes[3], code_du_qr(&secret, 3));
        assert!(codes.windows(2).filter(|p| p[0] == p[1]).count() <= 1);
        assert_ne!(code_du_qr(&SecretDeSeance::depuis_octets([8u8; 32]), 3), codes[3]);
    }

    #[test]
    fn le_qr_de_la_salle_se_lit_et_reste_court() {
        let qr = Qr { seance: seance(), fenetre: 42, code: "048213".into() };
        let texte = qr.texte();
        assert!(texte.len() < 40, "{texte}");
        assert_eq!(Qr::lire(&texte).unwrap(), qr);
        assert_eq!(Qr::lire("https://exemple.fr"), Err(Erreur::QrInconnu));
        assert_eq!(Qr::lire("OPL1.court.1.123456"), Err(Erreur::QrInconnu));
    }

    #[test]
    fn une_presence_lue_dans_un_qr_se_verifie() {
        let lea = CleAppareil::nouvelle().unwrap();
        let qr = Qr { seance: seance(), fenetre: 3, code: "120934".into() };
        let presence = Presence::depuis_qr(&lea, &qr, 1_763_366_520_000).unwrap();
        assert!(presence.verifier_signature().is_ok());
        let texte = presence.texte();
        assert!(texte.len() <= 180, "{} caractères", texte.len());
        assert_eq!(Presence::lire(&texte).unwrap(), presence);
    }

    #[test]
    fn un_code_tape_garde_ses_chiffres_sans_les_espaces() {
        let lea = CleAppareil::nouvelle().unwrap();
        let presence = Presence::depuis_code(&lea, seance(), "120 934", 1).unwrap();
        assert_eq!(presence.code, "120934");
        assert_eq!(presence.fenetre, None);
        assert_eq!(Presence::lire(&presence.texte()).unwrap(), presence);
        assert_eq!(Presence::depuis_code(&lea, seance(), "12093", 1).unwrap_err(), Erreur::CodeInconnu);
        assert_eq!(Presence::depuis_code(&lea, seance(), "12a934", 1).unwrap_err(), Erreur::CodeInconnu);
    }

    #[test]
    fn une_presence_changee_ne_se_verifie_plus() {
        let lea = CleAppareil::nouvelle().unwrap();
        let presence = Presence::depuis_code(&lea, seance(), "120934", 1).unwrap();
        let mut autre = presence.clone();
        autre.code = "120935".into();
        assert_eq!(autre.verifier_signature(), Err(Erreur::SignatureInvalide));
        let mut tard = presence.clone();
        tard.heure = 2;
        assert_eq!(Presence::lire(&tard.texte()).unwrap_err(), Erreur::SignatureInvalide);
    }
}

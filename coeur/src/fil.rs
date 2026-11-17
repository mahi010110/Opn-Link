use hkdf::Hkdf;
use sha2::Sha256;

use crate::chiffre;
use crate::encodage::{b64, de_b64, hex};
use crate::erreur::Erreur;
use crate::hasard;

const SEL: &[u8] = "opn-link·fil·v1".as_bytes();

/// Le secret du fil de la classe : il ouvre les annonces et ce que la classe se dit.
/// Il n'est jamais affiché. Un responsable le remet à l'apprenant qu'il accepte, scellé pour lui seul.
#[derive(Clone, PartialEq, Eq)]
pub struct SecretDuFil([u8; 32]);

// Le secret ne s'écrit jamais dans un message de débogage.
impl core::fmt::Debug for SecretDuFil {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.write_str("SecretDuFil(…)")
    }
}

impl SecretDuFil {
    pub fn nouveau() -> Result<Self, Erreur> {
        Ok(SecretDuFil(hasard::octets::<32>()?))
    }

    pub fn depuis_octets(octets: [u8; 32]) -> Self {
        SecretDuFil(octets)
    }

    pub fn texte(&self) -> String {
        b64(&self.0)
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        Ok(SecretDuFil(de_b64(texte)?.try_into().map_err(|_| Erreur::Encodage)?))
    }

    fn derive(&self) -> ([u8; 16], [u8; 32]) {
        let mut sortie = [0u8; 48];
        Hkdf::<Sha256>::new(Some(SEL), &self.0).expand(b"fil", &mut sortie).expect("48 octets tiennent dans HKDF-SHA-256");
        let (mut etiquette, mut cle) = ([0u8; 16], [0u8; 32]);
        etiquette.copy_from_slice(&sortie[..16]);
        cle.copy_from_slice(&sortie[16..]);
        (etiquette, cle)
    }

    /// L'étiquette du fil que voient les relais.
    pub fn etiquette(&self) -> String {
        format!("opl-fil-{}", hex(&self.derive().0))
    }

    pub fn chiffrer(&self, texte: &[u8]) -> Result<String, Erreur> {
        chiffre::chiffrer(&self.derive().1, texte)
    }

    pub fn dechiffrer(&self, texte: &str) -> Result<Vec<u8>, Erreur> {
        chiffre::dechiffrer(&self.derive().1, texte)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn le_fil_a_son_etiquette_et_sa_cle() {
        let fil = SecretDuFil::nouveau().unwrap();
        assert_eq!(SecretDuFil::lire(&fil.texte()).unwrap(), fil);
        assert!(fil.etiquette().starts_with("opl-fil-"));
        assert_ne!(fil.etiquette(), SecretDuFil::nouveau().unwrap().etiquette());
        let annonce = fil.chiffrer("Lundi, salle B12.".as_bytes()).unwrap();
        assert_eq!(fil.dechiffrer(&annonce).unwrap(), "Lundi, salle B12.".as_bytes());
        assert!(SecretDuFil::nouveau().unwrap().dechiffrer(&annonce).is_err());
    }
}

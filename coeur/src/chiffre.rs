use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit};

use crate::encodage::{b64, de_b64};
use crate::erreur::Erreur;
use crate::hasard;

const PREFIXE: &str = "OPC1.";

/// Chiffre pour qui a la clé : AES-256-GCM, un IV neuf à chaque fois.
pub(crate) fn chiffrer(cle: &[u8; 32], texte: &[u8]) -> Result<String, Erreur> {
    chiffrer_avec(cle, texte, hasard::octets::<12>()?)
}

pub(crate) fn chiffrer_avec(cle: &[u8; 32], texte: &[u8], iv: [u8; 12]) -> Result<String, Erreur> {
    let chiffre = Aes256Gcm::new(cle.into()).encrypt(&iv.into(), texte).map_err(|_| Erreur::LettreIllisible)?;
    Ok(format!("{PREFIXE}{}", b64(&[iv.as_slice(), &chiffre].concat())))
}

pub(crate) fn dechiffrer(cle: &[u8; 32], texte: &str) -> Result<Vec<u8>, Erreur> {
    let octets = de_b64(texte.trim().strip_prefix(PREFIXE).ok_or(Erreur::LettreIllisible)?).map_err(|_| Erreur::LettreIllisible)?;
    if octets.len() < 12 + 16 {
        return Err(Erreur::LettreIllisible);
    }
    let iv: [u8; 12] = octets[..12].try_into().map_err(|_| Erreur::LettreIllisible)?;
    Aes256Gcm::new(cle.into()).decrypt(&iv.into(), &octets[12..]).map_err(|_| Erreur::LettreIllisible)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn seule_la_bonne_cle_dechiffre() {
        let texte = chiffrer(&[3u8; 32], b"BTS SIO 2").unwrap();
        assert!(texte.starts_with("OPC1."));
        assert_eq!(dechiffrer(&[3u8; 32], &texte).unwrap(), b"BTS SIO 2");
        assert_eq!(dechiffrer(&[4u8; 32], &texte), Err(Erreur::LettreIllisible));
        assert_ne!(chiffrer(&[3u8; 32], b"BTS SIO 2").unwrap(), texte);
    }
}

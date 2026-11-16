use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit};
use hkdf::Hkdf;
use p256::{PublicKey, SecretKey};
use sha2::Sha256;

use crate::cles::ClePublique;
use crate::encodage::{b64, de_b64, hex, sha256};
use crate::erreur::Erreur;
use crate::hasard;

// Le schéma de la boîte aux lettres d'OpenContact (OCB1), avec les sels d'Opn-Link.
const PREFIXE: &str = "OPB1.";
const SEL: &[u8] = "opn-link·boite·v1".as_bytes();

/// Scelle une lettre pour une seule boîte, avec une clé jetable :
/// rien ne relie deux lettres du même auteur.
pub fn sceller(destinataire: &ClePublique, message: &[u8]) -> Result<String, Erreur> {
    loop {
        if let Ok(jetable) = SecretKey::from_slice(&hasard::octets::<32>()?) {
            return sceller_avec(destinataire, message, &jetable, hasard::octets::<12>()?);
        }
    }
}

pub(crate) fn sceller_avec(destinataire: &ClePublique, message: &[u8], jetable: &SecretKey, iv: [u8; 12]) -> Result<String, Erreur> {
    let cle = cle_de_lettre(jetable, &destinataire.0)?;
    let chiffre = Aes256Gcm::new(&cle.into()).encrypt(&iv.into(), message).map_err(|_| Erreur::LettreIllisible)?;
    let publique = jetable.public_key().to_sec1_bytes();
    Ok(format!("{PREFIXE}{}", b64(&[publique.as_ref(), &iv, &chiffre].concat())))
}

/// Ouvre une lettre avec la clé secrète de sa boîte.
pub fn ouvrir(boite: &SecretKey, lettre: &str) -> Result<Vec<u8>, Erreur> {
    let octets = de_b64(lettre.strip_prefix(PREFIXE).ok_or(Erreur::LettreIllisible)?).map_err(|_| Erreur::LettreIllisible)?;
    if octets.len() < 65 + 12 + 16 {
        return Err(Erreur::LettreIllisible);
    }
    let jetable = PublicKey::from_sec1_bytes(&octets[..65]).map_err(|_| Erreur::LettreIllisible)?;
    let partage = p256::ecdh::diffie_hellman(boite.to_nonzero_scalar(), jetable.as_affine());
    let cle = derive(partage.raw_secret_bytes())?;
    let iv: [u8; 12] = octets[65..77].try_into().map_err(|_| Erreur::LettreIllisible)?;
    Aes256Gcm::new(&cle.into()).decrypt(&iv.into(), &octets[77..]).map_err(|_| Erreur::LettreIllisible)
}

/// L'étiquette que voient les relais : elle ne dit rien du destinataire à qui n'a pas sa clé.
pub fn etiquette_de_boite(destinataire: &ClePublique) -> String {
    let empreinte = sha256(&["opn-link·boite·v1·".as_bytes(), destinataire.texte().as_bytes()]);
    format!("opl-boite-{}", hex(&empreinte[..16]))
}

fn cle_de_lettre(jetable: &SecretKey, destinataire: &PublicKey) -> Result<[u8; 32], Erreur> {
    let partage = p256::ecdh::diffie_hellman(jetable.to_nonzero_scalar(), destinataire.as_affine());
    derive(partage.raw_secret_bytes())
}

fn derive(partage: &[u8]) -> Result<[u8; 32], Erreur> {
    let mut cle = [0u8; 32];
    Hkdf::<Sha256>::new(Some(SEL), partage).expand(b"lettre", &mut cle).map_err(|_| Erreur::LettreIllisible)?;
    Ok(cle)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cles::CleAppareil;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn seul_le_destinataire_ouvre_la_lettre() {
        let awa = CleAppareil::nouvelle().unwrap();
        let lea = CleAppareil::nouvelle().unwrap();
        let lettre = sceller(&awa.boite(), b"presence de Lea").unwrap();
        assert!(lettre.starts_with("OPB1."));
        assert_eq!(awa.ouvrir(&lettre).unwrap(), b"presence de Lea");
        assert_eq!(lea.ouvrir(&lettre), Err(Erreur::LettreIllisible));
    }

    #[test]
    fn deux_lettres_du_meme_auteur_ne_se_ressemblent_pas() {
        let awa = CleAppareil::nouvelle().unwrap();
        let a = sceller(&awa.boite(), b"meme texte").unwrap();
        let b = sceller(&awa.boite(), b"meme texte").unwrap();
        assert_ne!(a[5..92], b[5..92]);
    }

    #[test]
    fn une_lettre_abimee_ne_s_ouvre_pas() {
        let awa = CleAppareil::nouvelle().unwrap();
        let mut lettre = sceller(&awa.boite(), b"bonjour").unwrap();
        let dernier = lettre.pop().unwrap();
        lettre.push(if dernier == 'A' { 'B' } else { 'A' });
        assert_eq!(awa.ouvrir(&lettre), Err(Erreur::LettreIllisible));
        assert_eq!(awa.ouvrir("OPB1.court"), Err(Erreur::LettreIllisible));
        assert_eq!(awa.ouvrir("OCB1.abc"), Err(Erreur::LettreIllisible));
    }

    #[test]
    fn l_etiquette_de_boite_ne_change_pas() {
        let awa = CleAppareil::nouvelle().unwrap();
        let e = etiquette_de_boite(&awa.boite());
        assert_eq!(e, etiquette_de_boite(&awa.boite()));
        assert_eq!(e.len(), "opl-boite-".len() + 32);
    }
}

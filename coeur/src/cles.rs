use p256::ecdsa::signature::{Signer, Verifier};
use p256::ecdsa::{SigningKey, VerifyingKey};
use p256::elliptic_curve::sec1::ToSec1Point;
use p256::{PublicKey, SecretKey};

use crate::encodage::{b64, de_b64};
use crate::erreur::Erreur;
use crate::hasard;
use crate::lettre;

/// Les deux clés d'un appareil : une pour signer, une pour recevoir des lettres.
/// Ce sont les mêmes familles qu'OpenContact (P-256).
#[derive(Clone)]
pub struct CleAppareil {
    signe: SigningKey,
    boite: SecretKey,
}

impl CleAppareil {
    /// Deux clés neuves, tirées au hasard.
    pub fn nouvelle() -> Result<Self, Erreur> {
        loop {
            let (signe, boite) = (hasard::octets::<32>()?, hasard::octets::<32>()?);
            if let Ok(cle) = Self::depuis_octets(&signe, &boite) {
                return Ok(cle);
            }
        }
    }

    /// Relit les deux clés gardées par l'appareil.
    pub fn depuis_octets(signe: &[u8; 32], boite: &[u8; 32]) -> Result<Self, Erreur> {
        Ok(Self {
            signe: SigningKey::from_slice(signe).map_err(|_| Erreur::CleInvalide)?,
            boite: SecretKey::from_slice(boite).map_err(|_| Erreur::CleInvalide)?,
        })
    }

    /// Les deux clés secrètes, pour que l'appareil les garde.
    pub fn octets(&self) -> ([u8; 32], [u8; 32]) {
        (self.signe.to_bytes().into(), self.boite.to_bytes().into())
    }

    /// La clé publique qui vérifie ses signatures.
    pub fn publique(&self) -> ClePublique {
        ClePublique(PublicKey::from(self.signe.verifying_key()))
    }

    /// La clé publique de sa boîte aux lettres.
    pub fn boite(&self) -> ClePublique {
        ClePublique(self.boite.public_key())
    }

    /// Signe des octets (ECDSA P-256 avec SHA-256, comme WebCrypto).
    pub fn signer(&self, octets: &[u8]) -> Signature {
        let signature: p256::ecdsa::Signature = self.signe.sign(octets);
        Signature(signature.to_bytes().into())
    }

    /// Ouvre une lettre scellée pour sa boîte.
    pub fn ouvrir(&self, lettre: &str) -> Result<Vec<u8>, Erreur> {
        lettre::ouvrir(&self.boite, lettre)
    }
}

/// Une clé publique P-256. Écrite en base64url de ses 65 octets, comme la donne WebCrypto.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ClePublique(pub(crate) PublicKey);

impl ClePublique {
    /// Lit une clé, longue (65 octets) ou courte (33 octets).
    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        let octets = de_b64(texte).map_err(|_| Erreur::CleInvalide)?;
        PublicKey::from_sec1_bytes(&octets).map(ClePublique).map_err(|_| Erreur::CleInvalide)
    }

    /// La forme longue : c'est elle qui entre dans tout ce qu'on signe.
    pub fn texte(&self) -> String {
        b64(&self.0.to_sec1_bytes())
    }

    /// La forme courte, pour faire tenir une clé dans un QR.
    pub fn courte(&self) -> String {
        b64(self.0.to_sec1_point(true).as_bytes())
    }

    /// Vérifie une signature faite par la clé secrète qui va avec.
    pub fn verifier(&self, octets: &[u8], signature: &Signature) -> Result<(), Erreur> {
        let sig = p256::ecdsa::Signature::from_slice(&signature.0).map_err(|_| Erreur::SignatureInvalide)?;
        VerifyingKey::from(&self.0).verify(octets, &sig).map_err(|_| Erreur::SignatureInvalide)
    }
}

/// Une signature ECDSA P-256 : 64 octets, r puis s.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Signature(pub(crate) [u8; 64]);

impl Signature {
    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        let octets = de_b64(texte).map_err(|_| Erreur::SignatureInvalide)?;
        Ok(Signature(octets.try_into().map_err(|_| Erreur::SignatureInvalide)?))
    }

    pub fn texte(&self) -> String {
        b64(&self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn une_signature_se_verifie_et_ne_resert_pas_ailleurs() {
        let cle = CleAppareil::nouvelle().unwrap();
        let sig = cle.signer(b"mardi matin");
        assert!(cle.publique().verifier(b"mardi matin", &sig).is_ok());
        assert_eq!(cle.publique().verifier(b"mardi apres-midi", &sig), Err(Erreur::SignatureInvalide));
        let autre = CleAppareil::nouvelle().unwrap();
        assert_eq!(autre.publique().verifier(b"mardi matin", &sig), Err(Erreur::SignatureInvalide));
    }

    #[test]
    fn les_cles_se_relisent() {
        let cle = CleAppareil::nouvelle().unwrap();
        let (signe, boite) = cle.octets();
        let relue = CleAppareil::depuis_octets(&signe, &boite).unwrap();
        assert_eq!(relue.publique(), cle.publique());
        assert_eq!(relue.boite(), cle.boite());
        let texte = cle.publique().texte();
        assert_eq!(texte.len(), 87);
        assert_eq!(ClePublique::lire(&texte).unwrap(), cle.publique());
        let courte = cle.publique().courte();
        assert_eq!(courte.len(), 44);
        assert_eq!(ClePublique::lire(&courte).unwrap(), cle.publique());
        assert_eq!(cle.signer(b"x").texte().len(), 86);
    }

    #[test]
    fn une_cle_abimee_est_refusee() {
        assert_eq!(ClePublique::lire("pas une cle"), Err(Erreur::CleInvalide));
        assert_eq!(ClePublique::lire(&b64(&[4u8; 65])), Err(Erreur::CleInvalide));
        assert!(CleAppareil::depuis_octets(&[0u8; 32], &[1u8; 32]).is_err());
    }
}

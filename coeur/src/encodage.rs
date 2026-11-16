use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use sha2::{Digest, Sha256};

use crate::erreur::Erreur;

pub(crate) fn b64(octets: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(octets)
}

pub(crate) fn de_b64(texte: &str) -> Result<Vec<u8>, Erreur> {
    URL_SAFE_NO_PAD.decode(texte).map_err(|_| Erreur::Encodage)
}

pub(crate) fn hex(octets: &[u8]) -> String {
    octets.iter().map(|o| format!("{o:02x}")).collect()
}

pub(crate) fn sha256(morceaux: &[&[u8]]) -> [u8; 32] {
    let mut h = Sha256::new();
    for m in morceaux {
        h.update(m);
    }
    h.finalize().into()
}

/// Un texte qui entre dans un format signé : ni saut de ligne, ni tabulation,
/// ni autre caractère de contrôle, et pas vide.
pub(crate) fn champ(texte: &str) -> Result<&str, Erreur> {
    if texte.is_empty() || texte.chars().any(char::is_control) {
        return Err(Erreur::ChampInvalide);
    }
    Ok(texte)
}

/// Les octets qu'on signe : une étiquette qui dit le format, puis un champ par ligne.
pub(crate) fn a_signer(format: &str, champs: &[&str]) -> Result<Vec<u8>, Erreur> {
    let mut sortie = String::from(format);
    for c in champs {
        sortie.push('\n');
        sortie.push_str(champ(c)?);
    }
    Ok(sortie.into_bytes())
}

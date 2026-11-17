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

/// Un texte signé : une étiquette de format, un champ par ligne, puis la signature en dernière
/// ligne. Ce qui est signé, c'est le texte sans sa dernière ligne.
pub(crate) fn texte_signe(format: &str, champs: &[&str], signataire: &crate::cles::CleAppareil) -> Result<String, Erreur> {
    let octets = a_signer(format, champs)?;
    let signature = signataire.signer(&octets);
    let mut texte = String::from_utf8(octets).map_err(|_| Erreur::Encodage)?;
    texte.push('\n');
    texte.push_str(&signature.texte());
    Ok(texte)
}

/// Relit un texte signé : ses champs, sa signature, et la partie signée, que l'appelant vérifie
/// avec la clé qu'il attend.
pub(crate) fn lire_signe<'a>(texte: &'a str, format: &str) -> Result<(Vec<&'a str>, crate::cles::Signature, &'a str), Erreur> {
    let (signe, signature) = texte.trim_end_matches('\n').rsplit_once('\n').ok_or(Erreur::Encodage)?;
    let mut lignes = signe.split('\n');
    if lignes.next() != Some(format) {
        return Err(Erreur::Encodage);
    }
    let champs: Vec<&str> = lignes.collect();
    for c in &champs {
        champ(c)?;
    }
    Ok((champs, crate::cles::Signature::lire(signature)?, signe))
}

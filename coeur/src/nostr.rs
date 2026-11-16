//! Le peu de Nostr dont Opn-Link a besoin : signer un événement d'une clé jetable.
//! rust-nostr ajouterait 1,2 Mo au site (docs/mesures.md).

use k256::schnorr::SigningKey;
use k256::schnorr::signature::hazmat::PrehashSigner;

use crate::encodage::{hex, sha256};
use crate::erreur::Erreur;
use crate::hasard;

/// La sorte d'événement de la boîte aux lettres d'OpenContact, gardée par six relais sur sept (mesuré).
pub const SORTE: u16 = 8571;

/// Un événement Nostr prêt à partir, en JSON. Il porte l'étiquette `x`, et l'expiration
/// (NIP-40) passé laquelle les relais l'effacent. Une clé jetable par événement :
/// rien ne relie deux messages du même auteur.
pub fn evenement(etiquette: &str, expiration_s: u64, contenu: &str, maintenant_s: u64) -> Result<String, Erreur> {
    loop {
        if let Ok(cle) = SigningKey::from_bytes(&hasard::octets::<32>()?.into()) {
            return evenement_avec(&cle, etiquette, expiration_s, contenu, maintenant_s);
        }
    }
}

fn evenement_avec(cle: &SigningKey, etiquette: &str, expiration_s: u64, contenu: &str, maintenant_s: u64) -> Result<String, Erreur> {
    let auteur = hex(&cle.verifying_key().to_bytes());
    let etiquettes = format!("[[\"x\",{}],[\"expiration\",\"{expiration_s}\"]]", chaine(etiquette));
    let serialise = format!("[0,\"{auteur}\",{maintenant_s},{SORTE},{etiquettes},{}]", chaine(contenu));
    let id = sha256(&[serialise.as_bytes()]);
    let signature = cle.sign_prehash(&id).map_err(|_| Erreur::Hasard)?;
    Ok(format!(
        "{{\"id\":\"{}\",\"pubkey\":\"{auteur}\",\"created_at\":{maintenant_s},\"kind\":{SORTE},\"tags\":{etiquettes},\"content\":{},\"sig\":\"{}\"}}",
        hex(&id),
        chaine(contenu),
        hex(&signature.to_bytes())
    ))
}

/// Une chaîne JSON, échappée comme NIP-01 le demande pour calculer l'identifiant.
fn chaine(texte: &str) -> String {
    let mut sortie = String::with_capacity(texte.len() + 2);
    sortie.push('"');
    for c in texte.chars() {
        match c {
            '"' => sortie.push_str("\\\""),
            '\\' => sortie.push_str("\\\\"),
            '\n' => sortie.push_str("\\n"),
            '\r' => sortie.push_str("\\r"),
            '\t' => sortie.push_str("\\t"),
            '\u{8}' => sortie.push_str("\\b"),
            '\u{c}' => sortie.push_str("\\f"),
            c => sortie.push(c),
        }
    }
    sortie.push('"');
    sortie
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn deux_evenements_n_ont_pas_le_meme_auteur() {
        let a = evenement("opl-boite-00", 1_763_400_000, "OPB1.abc", 1_763_366_400).unwrap();
        let b = evenement("opl-boite-00", 1_763_400_000, "OPB1.abc", 1_763_366_400).unwrap();
        let auteur = |e: &str| e.split("\"pubkey\":\"").nth(1).unwrap()[..64].to_owned();
        assert_ne!(auteur(&a), auteur(&b));
        assert!(a.contains("\"kind\":8571"));
        assert!(a.contains("[\"x\",\"opl-boite-00\"],[\"expiration\",\"1763400000\"]"));
    }

    #[test]
    fn l_identifiant_suit_nip_01() {
        let cle = SigningKey::from_bytes(&[0x41u8; 32].into()).unwrap();
        let e = evenement_avec(&cle, "opl-x", 2, "ligne\n\"citée\"", 1).unwrap();
        let auteur = hex(&cle.verifying_key().to_bytes());
        let attendu =
            sha256(&[format!("[0,\"{auteur}\",1,8571,[[\"x\",\"opl-x\"],[\"expiration\",\"2\"]],\"ligne\\n\\\"citée\\\"\"]").as_bytes()]);
        assert!(e.starts_with(&format!("{{\"id\":\"{}\"", hex(&attendu))));
    }
}

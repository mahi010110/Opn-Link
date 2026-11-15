use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit};
use hkdf::Hkdf;
use p256::ecdsa::signature::Signer;
use p256::ecdsa::{Signature, SigningKey};
use p256::{PublicKey, SecretKey};
use sha2::Sha256;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn signer(cle_secrete: &[u8], message: &[u8]) -> Result<Vec<u8>, JsError> {
    let cle = SigningKey::from_slice(cle_secrete).map_err(|e| JsError::new(&e.to_string()))?;
    let signature: Signature = cle.sign(message);
    Ok(signature.to_bytes().to_vec())
}

#[wasm_bindgen]
pub fn sceller(cle_publique: &[u8], message: &[u8]) -> Result<Vec<u8>, JsError> {
    let destinataire = PublicKey::from_sec1_bytes(cle_publique).map_err(|e| JsError::new(&e.to_string()))?;
    let mut graine = [0u8; 32];
    getrandom::fill(&mut graine).map_err(|e| JsError::new(&e.to_string()))?;
    let ephemere = SecretKey::from_slice(&graine).map_err(|e| JsError::new(&e.to_string()))?;
    let partage = p256::ecdh::diffie_hellman(ephemere.to_nonzero_scalar(), destinataire.as_affine());
    let mut cle = [0u8; 32];
    Hkdf::<Sha256>::new(Some(b"opn-link mesure"), partage.raw_secret_bytes())
        .expand(b"lettre", &mut cle)
        .map_err(|e| JsError::new(&e.to_string()))?;
    let mut iv = [0u8; 12];
    getrandom::fill(&mut iv).map_err(|e| JsError::new(&e.to_string()))?;
    let chiffre = Aes256Gcm::new(&cle.into())
        .encrypt(&iv.into(), message)
        .map_err(|e| JsError::new(&e.to_string()))?;
    Ok([iv.as_slice(), chiffre.as_slice()].concat())
}

#[wasm_bindgen]
pub fn cle_de_classe(code: &str) -> Vec<u8> {
    let mut sortie = [0u8; 48];
    pbkdf2::pbkdf2_hmac::<Sha256>(code.as_bytes(), b"opn-link mesure", 100_000, &mut sortie);
    sortie.to_vec()
}

#[cfg(feature = "nostr")]
#[wasm_bindgen]
pub fn evenement_nostr(contenu: &str) -> String {
    use nostr::prelude::*;
    let cles = Keys::generate();
    EventBuilder::new(Kind::TextNote, contenu)
        .finalize(&cles)
        .map(|ev| ev.as_json())
        .unwrap_or_default()
}

#[cfg(feature = "lopdf")]
#[wasm_bindgen]
pub fn pages_du_pdf(pdf: &[u8]) -> Result<usize, JsError> {
    let doc = lopdf::Document::load_mem(pdf).map_err(|e| JsError::new(&e.to_string()))?;
    Ok(doc.get_pages().len())
}

#[cfg(feature = "qrcode")]
#[wasm_bindgen]
pub fn modules_du_qr(texte: &str) -> usize {
    qrcode::QrCode::new(texte).map(|qr| qr.width()).unwrap_or(0)
}

#[cfg(feature = "rqrr")]
#[wasm_bindgen]
pub fn lire_qr(largeur: usize, hauteur: usize, gris: &[u8]) -> Option<String> {
    let mut image = rqrr::PreparedImage::prepare_from_greyscale(largeur, hauteur, |x, y| gris[y * largeur + x]);
    image.detect_grids().first()?.decode().ok().map(|(_, texte)| texte)
}

// nostr ne sait pas lire l'heure seul sur wasm32-unknown-unknown : on lui donne celle du navigateur.
#[cfg(all(feature = "nostr", target_arch = "wasm32"))]
mod horloge {
    use core::time::Duration;
    use universal_time::{Instant, MonotonicClock, SystemTime, WallClock, define_time_provider};

    struct Navigateur;

    fn maintenant() -> Duration {
        Duration::from_secs_f64(js_sys::Date::now() / 1000.0)
    }

    impl WallClock for Navigateur {
        fn system_time(&self) -> SystemTime {
            SystemTime::from_unix_duration(maintenant())
        }
    }

    impl MonotonicClock for Navigateur {
        fn instant(&self) -> Instant {
            Instant::from_ticks(maintenant())
        }
    }

    define_time_provider!(Navigateur);
}

#[cfg(feature = "k256")]
#[wasm_bindgen]
pub fn signer_evenement(cle_secrete: &[u8], identifiant: &[u8]) -> Result<Vec<u8>, JsError> {
    use k256::schnorr::SigningKey;
    use k256::schnorr::signature::Signer;
    let cle = SigningKey::from_bytes(cle_secrete.try_into().map_err(|_| JsError::new("clé de 32 octets attendue"))?)
        .map_err(|e| JsError::new(&e.to_string()))?;
    let signature: k256::schnorr::Signature = cle.sign(identifiant);
    Ok(signature.to_bytes().to_vec())
}

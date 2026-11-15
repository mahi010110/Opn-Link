use std::time::Instant;

fn largeur(texte: &str, niveau: qrcode::EcLevel) -> (usize, String) {
    let qr = qrcode::QrCode::with_error_correction_level(texte, niveau).expect("trop long pour un QR");
    (qr.width(), format!("{:?}", qr.version()))
}

fn decoder(texte: &str) -> (bool, u128) {
    let qr = qrcode::QrCode::with_error_correction_level(texte, qrcode::EcLevel::M).unwrap();
    let cote = qr.width();
    let pixels = 6;
    let marge = 4 * pixels;
    let taille = cote * pixels + 2 * marge;
    let couleurs = qr.to_colors();
    let gris: Vec<u8> = (0..taille * taille)
        .map(|i| {
            let (x, y) = (i % taille, i / taille);
            if x < marge || y < marge || x >= marge + cote * pixels || y >= marge + cote * pixels {
                return 255;
            }
            let module = ((y - marge) / pixels) * cote + (x - marge) / pixels;
            if couleurs[module] == qrcode::Color::Dark { 0 } else { 255 }
        })
        .collect();
    let debut = Instant::now();
    let mut image = rqrr::PreparedImage::prepare_from_greyscale(taille, taille, |x, y| gris[y * taille + x]);
    let lu = image.detect_grids().first().and_then(|g| g.decode().ok()).map(|(_, t)| t);
    (lu.as_deref() == Some(texte), debut.elapsed().as_micros())
}

fn base64url(octets: usize) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut graine: u32 = 2_166_136_261;
    (0..(octets * 4).div_ceil(3))
        .map(|_| {
            graine = graine.wrapping_mul(16_777_619) ^ 0x9e37_79b9;
            ALPHABET[(graine >> 26) as usize] as char
        })
        .collect()
}

fn main() {
    let cas = [
        ("QR de l'appel (classe, séance, code, heure)", format!("OPL1.{}", base64url(16 + 8 + 16 + 4))),
        ("QR de signature sans réseau (clé, séance, code, heure, signature)", format!("OPS1.{}", base64url(33 + 8 + 16 + 4 + 64))),
        ("QR d'invitation (code, nom, clé du chef)", format!("OPI1.{}.{}.{}", "abcde12345fghjk", base64url(40), base64url(65))),
    ];
    for (nom, texte) in &cas {
        let (m, version) = largeur(texte, qrcode::EcLevel::M);
        let (ok, us) = decoder(texte);
        println!("{nom}: {} caractères, {m} × {m} modules ({version}, correction M), relu {ok} en {us} µs", texte.len());
    }
}

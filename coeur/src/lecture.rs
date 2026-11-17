// Lire un QR dans l'image de la caméra. Le navigateur donne la luminance de chaque pixel ; le
// décodage se fait ici, parce que Safari n'a pas de lecteur de QR à offrir aux pages.

use crate::erreur::Erreur;

/// Le texte du premier QR lisible d'une image en niveaux de gris : un octet par pixel, ligne par ligne.
pub fn lire_qr(gris: &[u8], largeur: usize, hauteur: usize) -> Result<String, Erreur> {
    if largeur == 0 || gris.len() != largeur * hauteur {
        return Err(Erreur::ChampInvalide);
    }
    let mut decodeur = quircs::Quirc::default();
    decodeur
        .identify(largeur, hauteur, gris)
        .filter_map(|code| code.ok()?.decode().ok())
        .find_map(|donnees| String::from_utf8(donnees.payload).ok())
        .ok_or(Erreur::PasDeQr)
}

#[cfg(test)]
mod tests {
    use super::*;
    use qrcode::{Color, EcLevel, QrCode};
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    // Le QR tel que la salle le dessine, avec sa marge blanche de quatre cases.
    fn image(texte: &str, pixels_par_case: usize) -> (Vec<u8>, usize) {
        let qr = QrCode::with_error_correction_level(texte, EcLevel::M).unwrap();
        let (cases, couleurs) = (qr.width(), qr.to_colors());
        let cote = (cases + 8) * pixels_par_case;
        let mut gris = vec![235u8; cote * cote];
        for y in 0..cote {
            for x in 0..cote {
                let (cx, cy) = (x / pixels_par_case, y / pixels_par_case);
                let dedans = (4..cases + 4).contains(&cx) && (4..cases + 4).contains(&cy);
                if dedans && couleurs[(cy - 4) * cases + cx - 4] == Color::Dark {
                    gris[y * cote + x] = 30;
                }
            }
        }
        (gris, cote)
    }

    #[test]
    fn le_qr_de_la_salle_se_relit() {
        let (gris, cote) = image("OPL1.rMP92Y86dEqy.3.055972", 4);
        assert_eq!(lire_qr(&gris, cote, cote).unwrap(), "OPL1.rMP92Y86dEqy.3.055972");
    }

    #[test]
    fn le_qr_d_une_presence_se_relit() {
        let presence = "OPS1.rMP92Y86dEqy.055972.3.1763366432000.A0Ytuhrk_BqWi02s8gzdbb4frjSqlxUUpj00BcPRz9OD.P4reyGxw0adVieERry-CYDT1qV8G7adtgL9lYF5eAPWBkzGptWdhLqRqYr1Oc0X4ugyudnLW96Fc_qGo4O6htg";
        let (gris, cote) = image(presence, 3);
        assert_eq!(lire_qr(&gris, cote, cote).unwrap(), presence);
    }

    #[test]
    fn une_image_sans_qr_le_dit() {
        assert_eq!(lire_qr(&vec![200u8; 64 * 48], 64, 48).unwrap_err(), Erreur::PasDeQr);
        assert_eq!(lire_qr(&[0u8; 10], 4, 4).unwrap_err(), Erreur::ChampInvalide);
    }
}

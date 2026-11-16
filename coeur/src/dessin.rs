use qrcode::{Color, EcLevel, QrCode};

use crate::erreur::Erreur;

/// Le dessin d'un QR en SVG, sans marge : le cadre blanc autour la donne.
/// Il reste sombre sur blanc dans les deux thèmes.
pub fn svg_du_qr(texte: &str) -> Result<String, Erreur> {
    let qr = QrCode::with_error_correction_level(texte, EcLevel::M).map_err(|_| Erreur::ChampInvalide)?;
    let largeur = qr.width();
    let cases: Vec<bool> = qr.to_colors().into_iter().map(|c| c == Color::Dark).collect();
    let mut chemin = String::new();
    for y in 0..largeur {
        let mut x = 0;
        while x < largeur {
            if cases[y * largeur + x] {
                let debut = x;
                while x < largeur && cases[y * largeur + x] {
                    x += 1;
                }
                chemin.push_str(&format!("M{debut} {y}h{}v1h-{}z", x - debut, x - debut));
            } else {
                x += 1;
            }
        }
    }
    Ok(format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {largeur} {largeur}\" shape-rendering=\"crispEdges\"><path fill=\"#1D242C\" d=\"{chemin}\"/></svg>"
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn le_qr_de_la_salle_reste_petit() {
        let svg = svg_du_qr("OPL1.rMP92Y86dEqy.3.055972").unwrap();
        assert!(svg.contains("viewBox=\"0 0 25 25\""), "{}", &svg[..80]);
    }
}

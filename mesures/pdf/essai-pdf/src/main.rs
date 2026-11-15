use lopdf::{Dictionary, Document, Object, ObjectId, Stream, dictionary};
use std::error::Error;

type Resultat<T> = Result<T, Box<dyn Error>>;

// underskrift 0.1.4 hache une seconde fois l'empreinte qu'il reçoit avant de signer en ECDSA
// (SoftwareSigner::sign_hash appelle Signer::sign) : la signature ne se vérifie plus.
// Ce signataire signe l'empreinte telle quelle.
struct SceauP256 {
    cle: p256::ecdsa::SigningKey,
    certificat: Vec<u8>,
}

impl underskrift::CryptoSigner for SceauP256 {
    fn sign_hash(&self, empreinte: &[u8]) -> Result<Vec<u8>, underskrift::error::CryptoError> {
        use p256::ecdsa::signature::hazmat::PrehashSigner;
        let signature: p256::ecdsa::Signature = self
            .cle
            .sign_prehash(empreinte)
            .map_err(|e| underskrift::error::CryptoError::SigningFailed(e.to_string()))?;
        Ok(signature.to_der().as_bytes().to_vec())
    }
    fn certificate_der(&self) -> &[u8] {
        &self.certificat
    }
    fn certificate_chain_der(&self) -> Vec<&[u8]> {
        vec![&self.certificat]
    }
    fn digest_algorithm(&self) -> underskrift::DigestAlgorithm {
        underskrift::DigestAlgorithm::Sha256
    }
    fn signature_algorithm(&self) -> underskrift::SignatureAlgorithm {
        underskrift::SignatureAlgorithm::EcdsaP256
    }
}

struct CaseDeSignature {
    nom: String,
    page: ObjectId,
    cadre: [f32; 4],
}

// Un dessin fait au doigt, tel que l'app le garderait : des traits, en points entre 0 et 1.
const DESSIN: &[&[(f32, f32)]] = &[
    &[(0.05, 0.4), (0.15, 0.8), (0.25, 0.3), (0.35, 0.75), (0.45, 0.35)],
    &[(0.5, 0.5), (0.6, 0.7), (0.7, 0.4), (0.8, 0.65), (0.95, 0.45)],
];

fn nombre(objet: &Object) -> f32 {
    objet.as_float().or_else(|_| objet.as_i64().map(|n| n as f32)).unwrap_or(0.0)
}

fn cases_de_signature(doc: &Document) -> Resultat<Vec<CaseDeSignature>> {
    let formulaire = doc.catalog()?.get_deref(b"AcroForm", doc)?.as_dict()?;
    let mut cases = Vec::new();
    for reference in formulaire.get(b"Fields")?.as_array()? {
        let id = reference.as_reference()?;
        let champ = doc.get_dictionary(id)?;
        if champ.get(b"FT").and_then(Object::as_name).ok() != Some(b"Sig".as_slice()) {
            continue;
        }
        let nom = String::from_utf8_lossy(champ.get(b"T")?.as_str()?).into_owned();
        let r = champ.get(b"Rect")?.as_array()?;
        let cadre = [nombre(&r[0]), nombre(&r[1]), nombre(&r[2]), nombre(&r[3])];
        // pyHanko et d'autres outils ne posent pas toujours /P : on cherche alors la page qui porte le champ.
        let page = match champ.get(b"P").and_then(Object::as_reference) {
            Ok(p) => p,
            Err(_) => doc
                .get_pages()
                .values()
                .copied()
                .find(|p| {
                    doc.get_dictionary(*p)
                        .and_then(|d| d.get_deref(b"Annots", doc))
                        .and_then(Object::as_array)
                        .map(|annots| annots.iter().any(|a| a.as_reference().ok() == Some(id)))
                        .unwrap_or(false)
                })
                .ok_or("page du champ introuvable")?,
        };
        cases.push(CaseDeSignature { nom, page, cadre });
    }
    Ok(cases)
}

fn traits(cadre: [f32; 4]) -> String {
    let (x, y, l, h) = (cadre[0], cadre[1], cadre[2] - cadre[0], cadre[3] - cadre[1]);
    let mut ops = String::from("q 0.1 0.1 0.3 RG 1.4 w 1 J 1 j\n");
    for trait_ in DESSIN {
        for (i, (px, py)) in trait_.iter().enumerate() {
            ops += &format!("{:.2} {:.2} {}\n", x + px * l, y + py * h, if i == 0 { "m" } else { "l" });
        }
        ops += "S\n";
    }
    ops + "Q\n"
}

fn ajouter_au_contenu(doc: &mut Document, page: ObjectId, ops: String) -> Resultat<()> {
    let flux = doc.add_object(Stream::new(Dictionary::new(), ops.into_bytes()));
    let page_dict = doc.get_dictionary_mut(page)?;
    let contenus = match page_dict.get(b"Contents") {
        Ok(Object::Array(a)) => a.clone(),
        Ok(Object::Reference(r)) => vec![Object::Reference(*r)],
        _ => vec![],
    };
    page_dict.set("Contents", Object::Array([contenus, vec![Object::Reference(flux)]].concat()));
    Ok(())
}

fn latin1(texte: &str) -> Vec<u8> {
    texte.chars().map(|c| if (c as u32) < 256 { c as u8 } else { b'?' }).collect()
}

fn page_de_signature(doc: &mut Document, lignes: &[String]) -> Resultat<()> {
    let police = doc.add_object(dictionary! {
        "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica", "Encoding" => "WinAnsiEncoding",
    });
    let mut ops = String::from("BT /F1 12 Tf 72 770 Td 16 TL\n");
    for ligne in lignes {
        let octets = latin1(ligne);
        let echappe: String = octets
            .iter()
            .map(|&o| match o {
                b'(' | b')' | b'\\' => format!("\\{}", o as char),
                0x20..=0x7e => (o as char).to_string(),
                _ => format!("\\{o:03o}"),
            })
            .collect();
        ops += &format!("({echappe}) Tj T*\n");
    }
    ops += "ET\n";
    ops += &traits([72.0, 560.0, 292.0, 620.0]);
    let pages_id = doc.catalog()?.get(b"Pages")?.as_reference()?;
    let flux = doc.add_object(Stream::new(Dictionary::new(), ops.into_bytes()));
    let page = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
        "Resources" => dictionary! { "Font" => dictionary! { "F1" => police } },
        "Contents" => flux,
    });
    let pages = doc.get_dictionary_mut(pages_id)?;
    let mut enfants = pages.get(b"Kids")?.as_array()?.clone();
    enfants.push(Object::Reference(page));
    let compte = enfants.len() as i64;
    pages.set("Kids", Object::Array(enfants));
    pages.set("Count", compte);
    Ok(())
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Resultat<()> {
    let mut doc = Document::load("../convention-case.pdf")?;
    let cases = cases_de_signature(&doc)?;
    for case in &cases {
        println!("case trouvée : {} sur la page {:?}, cadre {:?}", case.nom, case.page, case.cadre);
        ajouter_au_contenu(&mut doc, case.page, traits(case.cadre))?;
    }
    page_de_signature(
        &mut doc,
        &[
            "Page de signature ajoutée par Opn-Link (essai, données inventées)".into(),
            "Document : Convention de stage".into(),
            "Signé par : Léa Martin, apprenante".into(),
            "Le 15 novembre 2026 à 17 h 10, avec la clé de son téléphone".into(),
            "Empreinte du document signé : voir le dossier de preuve".into(),
        ],
    )?;
    let mut sortie = Vec::new();
    doc.save_to(&mut sortie)?;
    std::fs::write("../convention-signee.pdf", &sortie)?;
    println!("page de signature ajoutée, {} octets", sortie.len());

    use p256::pkcs8::DecodePrivateKey;
    let signataire = SceauP256 {
        cle: p256::ecdsa::SigningKey::from_pkcs8_der(&std::fs::read("../cle-essai.der")?)?,
        certificat: std::fs::read("../cert-essai.der")?,
    };
    let options = underskrift::SigningOptions {
        sub_filter: underskrift::SubFilter::Pades,
        field_name: "SceauCentre".into(),
        reason: Some("Document scellé par le centre (essai Opn-Link)".into()),
        page: 2,
        ..Default::default()
    };
    let scelle = underskrift::PdfSigner::new().options(options).sign(&sortie, &signataire).await?;
    std::fs::write("../convention-scellee.pdf", &scelle)?;
    println!("document scellé en PAdES, {} octets", scelle.len());
    Ok(())
}

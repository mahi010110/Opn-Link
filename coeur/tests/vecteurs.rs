//! Les vecteurs du contrat (docs/contrat.md). Ils ont été écrits une fois, avec la version 1
//! des formats, et ne changent plus : une version future doit toujours les relire.

use opn_core::*;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::wasm_bindgen_test as test;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

const CODE: &str = "RJ4KP 7MX2D W8QHN";
const ETIQUETTE: &str = "opl-classe-48c4e5ebf83ef60682ad29918ce4ec5a";
const SEANCE_MATIN: &str = "rMP92Y86dEqy";
const SEANCE_APRES_MIDI: &str = "Y79LPiRW-lpH";
const ENGAGEMENT: &str = "zOUhGpib3ZPJ26Y1QWRH2e_IvxgGIY32rMkwC5aNG8g";
const CODES: [&str; 4] = ["218210", "490691", "673754", "055972"];
const AWA_CLE: &str = "BAIX5hfwtkQ5KCePlpmeaaI6TywVK99tbN9m5bgCgtTtGUp968uXcS0t2jyoWqh2Wlb0X8dYWZZS8ol8ZTBuV5Q";
const AWA_BOITE: &str = "BCYVk5Ks93UZ7EWglzEWh8fF3wXEXu7kXWNzG8yHdfechHqGgOXNaIBD4MfGlR2ZVrCuLWddHmBh-EXKnPWyOL8";
const ETIQUETTE_BOITE_AWA: &str = "opl-boite-60afe90523c629e512718802beab7884";
const LEA_CLE: &str = "BEYtuhrk_BqWi02s8gzdbb4frjSqlxUUpj00BcPRz9ODtYu7CMEzg0KMWFPHHEyFHhNLBWgh5Gj-Cpd6v0MT3eE";
const LEA_CLE_COURTE: &str = "A0Ytuhrk_BqWi02s8gzdbb4frjSqlxUUpj00BcPRz9OD";
const QR: &str = "OPL1.rMP92Y86dEqy.3.055972";
const PRESENCE: &str = "OPS1.rMP92Y86dEqy.055972.3.1763366432000.A0Ytuhrk_BqWi02s8gzdbb4frjSqlxUUpj00BcPRz9OD.P4reyGxw0adVieERry-CYDT1qV8G7adtgL9lYF5eAPWBkzGptWdhLqRqYr1Oc0X4ugyudnLW96Fc_qGo4O6htg";
const LETTRE: &str = include_str!("vecteurs/lettre-v1.txt");
const FEUILLE: &str = include_str!("vecteurs/feuille-v1.txt");
const EMPREINTE_FEUILLE: &str = "dbf1a4850aa7bf151b5208c11381da4a82002af7b2b5a2397e7a76ae9c873480";

fn awa() -> CleAppareil {
    CleAppareil::depuis_octets(&[0x11; 32], &[0x12; 32]).unwrap()
}

fn lea() -> CleAppareil {
    CleAppareil::depuis_octets(&[0x21; 32], &[0x22; 32]).unwrap()
}

fn julien() -> CleAppareil {
    CleAppareil::depuis_octets(&[0x31; 32], &[0x32; 32]).unwrap()
}

#[test]
fn la_classe_et_ses_seances() {
    let secrets = CodeDeClasse::lire(CODE).unwrap().secrets();
    assert_eq!(secrets.etiquette(), ETIQUETTE);
    assert_eq!(secrets.seance("2026-11-17", Demi::Matin).unwrap().texte(), SEANCE_MATIN);
    assert_eq!(secrets.seance("2026-11-17", Demi::ApresMidi).unwrap().texte(), SEANCE_APRES_MIDI);
}

#[test]
fn les_codes_du_qr() {
    let secret = SecretDeSeance::depuis_octets([7u8; 32]);
    assert_eq!(secret.engagement(), ENGAGEMENT);
    for (f, code) in CODES.iter().enumerate() {
        assert_eq!(&code_du_qr(&secret, f as u64), code);
    }
}

#[test]
fn les_cles_publiques() {
    assert_eq!(awa().publique().texte(), AWA_CLE);
    assert_eq!(awa().boite().texte(), AWA_BOITE);
    assert_eq!(lea().publique().texte(), LEA_CLE);
    assert_eq!(lea().publique().courte(), LEA_CLE_COURTE);
    assert_eq!(etiquette_de_boite(&awa().boite()), ETIQUETTE_BOITE_AWA);
}

#[test]
fn le_qr_et_la_presence() {
    let qr = Qr::lire(QR).unwrap();
    assert_eq!((qr.seance.texte(), qr.fenetre, qr.code.as_str()), (SEANCE_MATIN, 3, CODES[3]));
    let presence = Presence::lire(PRESENCE).unwrap();
    assert_eq!(presence.cle, lea().publique());
    assert_eq!(presence.heure, 1_763_366_432_000);
    assert_eq!(Presence::depuis_qr(&lea(), &qr, 1_763_366_432_000).unwrap().texte(), PRESENCE);
}

#[test]
fn la_lettre() {
    assert_eq!(awa().ouvrir(LETTRE.trim()).unwrap(), PRESENCE.as_bytes());
    assert_eq!(lea().ouvrir(LETTRE.trim()), Err(Erreur::LettreIllisible));
}

#[test]
fn la_feuille() {
    assert_eq!(verifier_journal(FEUILLE), Ok(EMPREINTE_FEUILLE.into()));
    let feuille = Feuille::relire(FEUILLE, None).unwrap();
    assert!(feuille.close());
    let etat = feuille.etat();
    assert_eq!(
        (etat[0].prenom.as_str(), etat[0].presence),
        ("Léa", EtatPresence::Present { quand: 1_763_366_433_000, voie: Voie::Reseau })
    );
    assert_eq!(etat[1].prenom, "Yanis");
    assert!(etat[1].corrige);
}

const PORTE: &str = include_str!("vecteurs/porte-v1.txt");
const PORTE_CHIFFREE: &str = include_str!("vecteurs/porte-chiffree-v1.txt");
const DEMANDE: &str = include_str!("vecteurs/demande-v1.txt");
const ACCEPTATION: &str = include_str!("vecteurs/acceptation-v1.txt");
const FIL_CHIFFRE: &str = include_str!("vecteurs/fil-chiffre-v1.txt");
const ETIQUETTE_DU_FIL: &str = "opl-fil-68e3771df5dddf4deb00bafc6ef946a7";
const ANNONCE_DE_L_APPEL: &str = include_str!("vecteurs/appel-v1.txt");
const PROCHAIN_COURS: &str = include_str!("vecteurs/prochain-v1.txt");
const PASSATION: &str = include_str!("vecteurs/passation-v1.txt");
const ENTRE_RESPONSABLES: &str = include_str!("vecteurs/responsables-v1.txt");
const JULIEN_CLE: &str = "BHQxsY8FWshzset9dNhxatHj3waQiwDML5ARU_jrZCgYSGfA_asznGxJCjmucE0ptbTC8SRDUKKQWWIs9JtCEVU";

#[test]
fn la_porte() {
    let classe = CodeDeClasse::lire(CODE).unwrap().secrets();
    let porte = Porte::lire(&classe, PORTE).unwrap();
    assert_eq!((porte.nom.as_str(), porte.centre.as_str(), porte.matin.as_str()), ("BTS SIO 2", "Centre Exemple", "9:00-12:30"));
    assert_eq!(porte.chef().cle, awa().publique());
    assert_eq!(String::from_utf8(classe.dechiffrer(PORTE_CHIFFREE).unwrap()).unwrap(), PORTE);
    let chef =
        Responsable { prenom: "Awa".into(), nom: "Diallo".into(), role: Role::Formateur, cle: awa().publique(), boite: awa().boite() };
    assert_eq!(
        Porte::signer(&classe, "BTS SIO 2", "Centre Exemple", "9:00-12:30", "13:30-17:00", &[chef], &awa(), 1_763_366_000_000).unwrap(),
        PORTE
    );
}

#[test]
fn la_demande_et_l_acceptation() {
    let classe = CodeDeClasse::lire(CODE).unwrap().secrets();
    let demande = Demande::lire(&classe, DEMANDE).unwrap();
    assert_eq!((demande.membre.prenom.as_str(), demande.membre.cle.clone()), ("Léa", lea().publique()));
    assert_eq!(Demande::signer(&classe, "Léa", "Martin", &lea(), 1_763_366_100_000).unwrap(), DEMANDE);
    let acceptation = Acceptation::lire(&classe, ACCEPTATION, &[awa().publique()]).unwrap();
    assert_eq!(acceptation.membre, demande.membre);
    assert_eq!(acceptation.texte(&classe).unwrap(), ACCEPTATION);
}

#[test]
fn le_fil() {
    let fil = SecretDuFil::depuis_octets([9u8; 32]);
    assert_eq!(fil.etiquette(), ETIQUETTE_DU_FIL);
    assert_eq!(fil.dechiffrer(FIL_CHIFFRE).unwrap(), "Lundi 23, salle B12.".as_bytes());
}

#[test]
fn l_annonce_de_l_appel() {
    let classe = CodeDeClasse::lire(CODE).unwrap().secrets();
    let fil = SecretDuFil::depuis_octets([9u8; 32]);
    let annonce = AnnonceDeLAppel::lire(&fil, &classe, ANNONCE_DE_L_APPEL, &[awa().publique()]).unwrap();
    assert_eq!((annonce.seance.texte(), annonce.etat, annonce.quand), (SEANCE_MATIN, EtatDeLAppel::Ouvert, 1_763_366_460_000));
    assert_eq!(annonce.texte(&fil).unwrap(), ANNONCE_DE_L_APPEL);
    let seance = classe.seance("2026-11-17", Demi::Matin).unwrap();
    let signee =
        AnnonceDeLAppel::signer(&fil, &seance, "2026-11-17", Demi::Matin, EtatDeLAppel::Ouvert, &awa(), 1_763_366_460_000).unwrap();
    assert_eq!(signee.texte(&fil).unwrap(), ANNONCE_DE_L_APPEL);
}

#[test]
fn le_prochain_cours() {
    let fil = SecretDuFil::depuis_octets([9u8; 32]);
    let prochain = ProchainCours::lire(&fil, PROCHAIN_COURS, &[awa().publique()]).unwrap();
    assert_eq!((prochain.date.as_str(), prochain.demi, prochain.quand), ("2026-11-23", Demi::Matin, 1_763_367_120_000));
    assert_eq!(prochain.texte(&fil).unwrap(), PROCHAIN_COURS);
    assert_eq!(
        ProchainCours::signer(&fil, "2026-11-23", Demi::Matin, &awa(), 1_763_367_120_000).unwrap().texte(&fil).unwrap(),
        PROCHAIN_COURS
    );
}

#[test]
fn la_passation() {
    let classe = CodeDeClasse::lire(CODE).unwrap().secrets();
    let passation = Passation::lire(&classe, PASSATION).unwrap();
    assert_eq!(
        (passation.ancien.clone(), passation.nouveau.texte(), passation.quand),
        (awa().publique(), JULIEN_CLE.into(), 1_763_377_200_000)
    );
    assert_eq!(passation.nouveau, julien().publique());
    assert_eq!(Passation::signer(&classe, &awa(), &julien().publique(), 1_763_377_200_000).unwrap(), PASSATION);
}

#[test]
fn la_lettre_entre_responsables() {
    let classe = CodeDeClasse::lire(CODE).unwrap().secrets();
    let lettre = EntreResponsables::lire(&classe, ENTRE_RESPONSABLES, &[awa().publique(), julien().publique()]).unwrap();
    assert_eq!((lettre.de, lettre.quand, lettre.contenu.as_str()), (awa().publique(), 1_763_368_200_000, r#"{"v":1,"t":"classe"}"#));
    assert_eq!(EntreResponsables::signer(&classe, &awa(), r#"{"v":1,"t":"classe"}"#, 1_763_368_200_000).unwrap(), ENTRE_RESPONSABLES);
}

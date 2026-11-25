//! L'appel d'un mardi matin, joué de bout en bout avec une horloge qu'on avance.

use opn_core::*;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::wasm_bindgen_test as test;

#[cfg(target_arch = "wasm32")]
wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

const NEUF_HEURES: u64 = 1_763_366_400_000;
const SECONDE: u64 = 1_000;

struct Classe {
    secrets: SecretsDeClasse,
    awa: CleAppareil,
    lea: CleAppareil,
    yanis: CleAppareil,
    ines: CleAppareil,
    noah: CleAppareil,
    membres: Vec<Membre>,
}

fn membre(prenom: &str, nom: &str, cle: &CleAppareil) -> Membre {
    Membre { prenom: prenom.into(), nom: nom.into(), cle: cle.publique(), boite: cle.boite() }
}

fn classe() -> Classe {
    let secrets = CodeDeClasse::lire("RJ4KP 7MX2D W8QHN").unwrap().secrets();
    let [awa, lea, yanis, ines, noah] = [(); 5].map(|_| CleAppareil::nouvelle().unwrap());
    let membres = vec![
        membre("Léa", "Martin", &lea),
        membre("Yanis", "Haddad", &yanis),
        membre("Inès", "Roux", &ines),
        membre("Noah", "Petit", &noah),
    ];
    Classe { secrets, awa, lea, yanis, ines, noah, membres }
}

fn ouvrir(c: &Classe) -> Feuille {
    Feuille::ouvrir(&c.secrets, "2026-11-17", Demi::Matin, &c.awa, &c.membres, NEUF_HEURES).unwrap()
}

#[test]
fn l_apprenant_vise_le_qr_et_sa_presence_entre() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 62 * SECONDE;
    let qr = Qr::lire(&feuille.qr(t).unwrap().texte()).unwrap();
    assert_eq!(qr.fenetre, 6);
    let presence = Presence::depuis_qr(&c.lea, &qr, t).unwrap();
    assert_eq!(feuille.recevoir(&presence, Voie::Reseau, t + 2 * SECONDE), Ok(Recu::Nouvelle));
    assert_eq!(feuille.recevoir(&presence, Voie::Reseau, t + 3 * SECONDE), Ok(Recu::Deja));
    assert_eq!(feuille.compte(), (1, 4));
    let lea = &feuille.etat()[0];
    assert_eq!(lea.prenom, "Léa");
    assert_eq!(lea.presence, EtatPresence::Present { quand: t + 2 * SECONDE, voie: Voie::Reseau });
}

#[test]
fn le_code_tape_reste_bon_une_minute() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let lu = NEUF_HEURES + 15 * SECONDE;
    let code = feuille.qr(lu).unwrap().code;
    let seance = c.secrets.seance("2026-11-17", Demi::Matin).unwrap();
    let presence = Presence::depuis_code(&c.yanis, seance.clone(), &code, lu + 40 * SECONDE).unwrap();
    assert_eq!(feuille.recevoir(&presence, Voie::Reseau, lu + 45 * SECONDE), Ok(Recu::Nouvelle));

    let trop_tard = Presence::depuis_code(&c.noah, seance.clone(), &code, lu + 90 * SECONDE).unwrap();
    assert_eq!(feuille.recevoir(&trop_tard, Voie::Reseau, lu + 90 * SECONDE), Err(Erreur::CodePerime));

    let invente = Presence::depuis_code(&c.noah, seance, "000000", lu).unwrap();
    let attendu = if (0..=feuille.fenetre(lu)).any(|f| feuille.qr(NEUF_HEURES + f * PAS_DU_QR_MS).unwrap().code == "000000") {
        Erreur::CodePerime
    } else {
        Erreur::CodeInconnu
    };
    assert_eq!(feuille.recevoir(&invente, Voie::Reseau, lu), Err(attendu));
}

#[test]
fn sans_reseau_le_formateur_lit_le_qr_de_l_apprenant() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 20 * SECONDE;
    let presence = Presence::depuis_qr(&c.ines, &feuille.qr(t).unwrap(), t).unwrap();
    let qr_de_l_apprenant = presence.texte();
    let lue = Presence::lire(&qr_de_l_apprenant).unwrap();
    let plus_tard = t + 5 * 60 * SECONDE;
    assert_eq!(feuille.recevoir(&lue, Voie::Reseau, plus_tard), Err(Erreur::CodePerime));
    assert_eq!(feuille.recevoir(&lue, Voie::QrLu, plus_tard), Ok(Recu::Nouvelle));
}

#[test]
fn seul_l_appareil_accepte_signe() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 5 * SECONDE;
    let qr = feuille.qr(t).unwrap();
    let telephone_d_un_camarade = CleAppareil::nouvelle().unwrap();
    let presence = Presence::depuis_qr(&telephone_d_un_camarade, &qr, t).unwrap();
    assert_eq!(feuille.recevoir(&presence, Voie::Reseau, t), Err(Erreur::AppareilNonAccepte));
}

#[test]
fn une_presence_ne_resert_pas_pour_une_autre_seance() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 5 * SECONDE;
    let mut qr = feuille.qr(t).unwrap();
    qr.seance = c.secrets.seance("2026-11-17", Demi::ApresMidi).unwrap();
    let presence = Presence::depuis_qr(&c.lea, &qr, t).unwrap();
    assert_eq!(feuille.recevoir(&presence, Voie::Reseau, t), Err(Erreur::AutreSeance));
}

#[test]
fn la_cloture_compte_les_absences_et_ferme_la_feuille() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 30 * SECONDE;
    let qr = feuille.qr(t).unwrap();
    feuille.recevoir(&Presence::depuis_qr(&c.lea, &qr, t).unwrap(), Voie::Reseau, t).unwrap();
    feuille.signer_ici(&c.ines.publique(), t).unwrap();
    feuille.noter_retard(&c.ines.publique(), t, t).unwrap();
    assert_eq!(feuille.clore(&c.lea, t + SECONDE), Err(Erreur::PasLeFormateur));
    let fin = NEUF_HEURES + 12 * 60 * SECONDE;
    assert_eq!(feuille.clore(&c.awa, fin), Ok((2, 2)));
    assert!(feuille.close());
    assert_eq!(feuille.qr(fin), Err(Erreur::AppelClos));

    let etat = feuille.etat();
    assert_eq!(etat[2].presence, EtatPresence::Present { quand: t, voie: Voie::Ici });
    assert_eq!(etat[2].retard, Some(t));
    assert_eq!(etat[1].presence, EtatPresence::Absent);
    assert_eq!(etat[3].presence, EtatPresence::Absent);

    let en_retard = Presence::depuis_qr(&c.yanis, &qr, t).unwrap();
    assert_eq!(feuille.recevoir(&en_retard, Voie::QrLu, fin + SECONDE), Err(Erreur::AppelClos));
    assert_eq!(feuille.noter_depart(&c.lea.publique(), fin, fin + SECONDE), Err(Erreur::AppelClos));
}

#[test]
fn la_cloture_s_annule_pendant_trente_secondes() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let fin = NEUF_HEURES + 10 * 60 * SECONDE;
    feuille.clore(&c.awa, fin).unwrap();
    assert_eq!(feuille.annuler_cloture(fin + 24 * SECONDE), Ok(()));
    assert!(!feuille.close());
    let presence = Presence::depuis_qr(&c.noah, &feuille.qr(fin + 25 * SECONDE).unwrap(), fin + 25 * SECONDE).unwrap();
    assert_eq!(feuille.recevoir(&presence, Voie::Reseau, fin + 26 * SECONDE), Ok(Recu::Nouvelle));

    feuille.clore(&c.awa, fin + 60 * SECONDE).unwrap();
    assert!(!feuille.definitive(fin + 60 * SECONDE + ANNULER_CLOTURE_MS));
    assert!(feuille.definitive(fin + 61 * SECONDE + ANNULER_CLOTURE_MS));
    assert_eq!(feuille.annuler_cloture(fin + 120 * SECONDE), Err(Erreur::ClotureDefinitive));
}

#[test]
fn une_correction_s_ajoute_apres_la_cloture_et_reste_visible() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let ines = c.ines.publique();
    assert_eq!(feuille.corriger(&c.awa, &ines, true, "badge oublié, vue en salle", NEUF_HEURES), Err(Erreur::AppelOuvert));
    let fin = NEUF_HEURES + 10 * 60 * SECONDE;
    feuille.clore(&c.awa, fin).unwrap();
    assert_eq!(feuille.corriger(&c.lea, &ines, true, "pas le formateur", fin + 60 * SECONDE), Err(Erreur::PasLeFormateur));
    feuille.corriger(&c.awa, &ines, true, "badge oublié, vue en salle", fin + 60 * SECONDE).unwrap();
    let etat = &feuille.etat()[2];
    assert!(etat.corrige);
    assert!(matches!(etat.presence, EtatPresence::Present { .. }));
    assert!(feuille.journal().contains("\tcorrection\t"));
}

#[test]
fn le_journal_se_relit_et_se_verifie() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 30 * SECONDE;
    let qr = feuille.qr(t).unwrap();
    feuille.recevoir(&Presence::depuis_qr(&c.lea, &qr, t).unwrap(), Voie::Reseau, t).unwrap();
    let seance = c.secrets.seance("2026-11-17", Demi::Matin).unwrap();
    feuille.recevoir(&Presence::depuis_code(&c.yanis, seance, &qr.code, t).unwrap(), Voie::Reseau, t + 20 * SECONDE).unwrap();
    feuille.signer_ici(&c.ines.publique(), t).unwrap();
    feuille.clore(&c.awa, NEUF_HEURES + 12 * 60 * SECONDE).unwrap();
    feuille.corriger(&c.awa, &c.noah.publique(), true, "arrivé à 9 h 40, vu en salle", NEUF_HEURES + 13 * 60 * SECONDE).unwrap();

    let journal = feuille.journal();
    assert_eq!(verifier_journal(&journal), Ok(feuille.empreinte()));
    let relue = Feuille::relire(&journal, None).unwrap();
    assert_eq!(relue.etat(), feuille.etat());
    assert_eq!(relue.empreinte(), feuille.empreinte());
    assert_eq!((relue.formateur(), relue.classe()), (&c.awa.publique(), c.secrets.etiquette()));
}

#[test]
fn un_journal_change_ne_se_verifie_plus() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 30 * SECONDE;
    feuille.recevoir(&Presence::depuis_qr(&c.lea, &feuille.qr(t).unwrap(), t).unwrap(), Voie::Reseau, t).unwrap();
    feuille.clore(&c.awa, NEUF_HEURES + 12 * 60 * SECONDE).unwrap();
    let journal = feuille.journal();

    let lignes: Vec<&str> = journal.split('\n').collect();
    let sans_la_presence = [&lignes[..2], &lignes[3..]].concat().join("\n");
    assert_eq!(verifier_journal(&sans_la_presence), Err(Erreur::JournalAbime));

    let antidate =
        journal.replacen(&format!("\t{}\t", NEUF_HEURES + 12 * 60 * SECONDE), &format!("\t{}\t", NEUF_HEURES + 5 * 60 * SECONDE), 1);
    assert_ne!(antidate, journal);
    assert_eq!(verifier_journal(&antidate), Err(Erreur::JournalAbime));

    let absent_devenu_present = journal.replace("\tcloture\t1\t3\t", "\tcloture\t2\t2\t");
    assert_ne!(absent_devenu_present, journal);
    assert_eq!(verifier_journal(&absent_devenu_present), Err(Erreur::JournalAbime));

    let autre_formateur = CleAppareil::nouvelle().unwrap();
    let ouverture = lignes[1];
    let forge = journal.replace(ouverture, &ouverture.replace(&c.awa.publique().texte(), &autre_formateur.publique().texte()));
    assert_eq!(verifier_journal(&forge), Err(Erreur::JournalAbime));
}

#[test]
fn un_code_invente_ne_passe_pas_la_verification_apres_coup() {
    let c = classe();
    let mut feuille = ouvrir(&c);
    let t = NEUF_HEURES + 30 * SECONDE;
    feuille.recevoir(&Presence::depuis_qr(&c.lea, &feuille.qr(t).unwrap(), t).unwrap(), Voie::Reseau, t).unwrap();
    feuille.clore(&c.awa, NEUF_HEURES + 12 * 60 * SECONDE).unwrap();
    let journal = feuille.journal();
    let presence_ligne = journal.split('\n').nth(2).unwrap().to_owned();
    let vraie = Presence::lire(presence_ligne.rsplit('\t').next().unwrap()).unwrap();
    let faux_code = if vraie.code == "111111" { "222222" } else { "111111" };
    let fausse = Presence::depuis_qr(
        &c.lea,
        &Qr { seance: vraie.seance.clone(), fenetre: vraie.fenetre.unwrap(), code: faux_code.into() },
        vraie.heure,
    )
    .unwrap();
    let triche = journal.replace(&vraie.texte(), &fausse.texte());
    assert_eq!(verifier_journal(&triche), Err(Erreur::JournalAbime));
}

#[test]
fn une_feuille_ouverte_ne_se_relit_qu_avec_son_secret() {
    let c = classe();
    let feuille = ouvrir(&c);
    let journal = feuille.journal();
    assert!(Feuille::relire(&journal, Some(SecretDeSeance::nouveau().unwrap())).is_err());
    let relue = Feuille::relire(&journal, None).unwrap();
    assert_eq!(relue.qr(NEUF_HEURES), Err(Erreur::AppelClos));
}

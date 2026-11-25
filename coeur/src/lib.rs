//! Le cœur d'Opn-Link : les règles de l'appel, les clés et les formats.
//!
//! Il ne lit ni l'horloge, ni le disque, ni le réseau. Il reçoit l'heure en
//! millisecondes depuis 1970, et rend des décisions. Les formats sont décrits
//! dans `docs/contrat.md`.

mod annonce;
mod annonce_de_la_classe;
mod appel;
mod chiffre;
mod classe;
mod cles;
mod dessin;
mod encodage;
mod entree;
mod erreur;
mod feuille;
mod fil;
mod hasard;
mod lecture;
mod lettre;
mod message;
mod nostr;
mod responsables;
#[cfg(target_arch = "wasm32")]
mod web;

pub use annonce::{AnnonceDeLAppel, EtatDeLAppel, ProchainCours};
pub use annonce_de_la_classe::{AnnonceDeLaClasse, EtatDeLAnnonce, identifiant_d_annonce};
pub use appel::{Demi, IdSeance, PAS_DU_QR_MS, Presence, Qr, SecretDeSeance, VALIDITE_DU_CODE_MS, code_du_qr};
pub use classe::{Acceptation, CodeDeClasse, Membre, SecretsDeClasse};
pub use cles::{CleAppareil, ClePublique, Signature};
pub use dessin::svg_du_qr;
pub use encodage::TEXTE_AU_PLUS;
pub use entree::{Demande, Porte, Responsable, Role, choisir_porte};
pub use erreur::Erreur;
pub use feuille::{ANNULER_CLOTURE_MS, EtatMembre, EtatPresence, Feuille, Ligne, Recu, Voie, verifier_journal};
pub use fil::SecretDuFil;
pub use lecture::lire_qr;
pub use lettre::{etiquette_de_boite, ouvrir, sceller};
pub use message::MessagePrive;
pub use nostr::{SORTE as SORTE_NOSTR, evenement as evenement_nostr};
pub use responsables::{CorrectionDeNom, EntreResponsables, Passation, Regne, lignee};

#[cfg(all(test, target_arch = "wasm32"))]
wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

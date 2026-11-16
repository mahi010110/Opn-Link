//! Le cœur d'Opn-Link : les règles de l'appel, les clés et les formats.
//!
//! Il ne lit ni l'horloge, ni le disque, ni le réseau. Il reçoit l'heure en
//! millisecondes depuis 1970, et rend des décisions. Les formats sont décrits
//! dans `docs/contrat.md`.

mod appel;
mod classe;
mod cles;
mod encodage;
mod erreur;
mod feuille;
mod hasard;
mod lettre;
#[cfg(target_arch = "wasm32")]
mod web;

pub use appel::{Demi, IdSeance, PAS_DU_QR_MS, Presence, Qr, SecretDeSeance, VALIDITE_DU_CODE_MS, code_du_qr};
pub use classe::{Acceptation, CodeDeClasse, Membre, SecretsDeClasse};
pub use cles::{CleAppareil, ClePublique, Signature};
pub use erreur::Erreur;
pub use feuille::{ANNULER_CLOTURE_MS, EtatMembre, EtatPresence, Feuille, Ligne, Recu, Voie, verifier_journal};
pub use lettre::{etiquette_de_boite, ouvrir, sceller};

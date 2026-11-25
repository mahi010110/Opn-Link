//! La justification d'une absence : l'apprenant dit pourquoi il était absent, et l'envoie aux
//! responsables. Elle est signée par l'appareil qui a manqué l'appel, et ne part qu'à eux : le
//! motif ne va jamais au tuteur, qui saura seulement que l'absence est justifiée.

use crate::appel::{Demi, IdSeance};
use crate::classe::SecretsDeClasse;
use crate::cles::{CleAppareil, ClePublique};
use crate::encodage::{lire_signe, texte_signe};
use crate::erreur::Erreur;

const FORMAT: &str = "opn-link·justification·v1";

/// Pourquoi l'apprenant était absent.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Motif {
    Maladie,
    Transport,
    Entreprise,
    Autre,
}

impl Motif {
    pub fn texte(self) -> &'static str {
        match self {
            Motif::Maladie => "maladie",
            Motif::Transport => "transport",
            Motif::Entreprise => "entreprise",
            Motif::Autre => "autre",
        }
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        match texte {
            "maladie" => Ok(Motif::Maladie),
            "transport" => Ok(Motif::Transport),
            "entreprise" => Ok(Motif::Entreprise),
            "autre" => Ok(Motif::Autre),
            _ => Err(Erreur::ChampInvalide),
        }
    }
}

/// Une absence justifiée par l'apprenant, signée par son appareil.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Justification {
    pub apprenant: ClePublique,
    pub seance: IdSeance,
    pub date: String,
    pub demi: Demi,
    pub motif: Motif,
    pub quand: u64,
}

impl Justification {
    /// L'apprenant justifie son absence à une demi-journée de la classe.
    pub fn signer(
        classe: &SecretsDeClasse,
        apprenant: &CleAppareil,
        date: &str,
        demi: Demi,
        motif: Motif,
        quand: u64,
    ) -> Result<String, Erreur> {
        let seance = classe.seance(date, demi)?;
        texte_signe(
            FORMAT,
            &[classe.etiquette(), &apprenant.publique().texte(), seance.texte(), date, demi.texte(), motif.texte(), &quand.to_string()],
            apprenant,
        )
    }

    /// Relit une justification, et vérifie qu'elle est faite pour cette classe, pour la séance de sa
    /// demi-journée, et signée par la clé qu'elle porte.
    pub fn lire(classe: &SecretsDeClasse, texte: &str) -> Result<Self, Erreur> {
        let (champs, signature, signe) = lire_signe(texte, FORMAT)?;
        let [etiquette, apprenant, seance, date, demi, motif, quand] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != classe.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let demi = Demi::lire(demi)?;
        let seance = IdSeance::lire(seance)?;
        if seance != classe.seance(date, demi)? {
            return Err(Erreur::AutreSeance);
        }
        let apprenant = ClePublique::lire(apprenant)?;
        apprenant.verifier(signe.as_bytes(), &signature)?;
        Ok(Justification {
            apprenant,
            seance,
            date: date.into(),
            demi,
            motif: Motif::lire(motif)?,
            quand: quand.parse().map_err(|_| Erreur::Encodage)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::classe::CodeDeClasse;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn une_justification_se_relit_avec_sa_seance() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let noah = CleAppareil::nouvelle().unwrap();
        let texte = Justification::signer(&classe, &noah, "2026-11-17", Demi::Matin, Motif::Transport, 5).unwrap();
        let lue = Justification::lire(&classe, &texte).unwrap();
        assert_eq!(
            (lue.apprenant, lue.date.as_str(), lue.demi, lue.motif, lue.quand),
            (noah.publique(), "2026-11-17", Demi::Matin, Motif::Transport, 5)
        );
        assert_eq!(lue.seance, classe.seance("2026-11-17", Demi::Matin).unwrap());
    }

    #[test]
    fn une_justification_changee_ou_d_une_autre_classe_ne_compte_pas() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let noah = CleAppareil::nouvelle().unwrap();
        let texte = Justification::signer(&classe, &noah, "2026-11-17", Demi::Matin, Motif::Transport, 5).unwrap();
        let maladie = texte.replace("\ntransport\n", "\nmaladie\n");
        assert_eq!(Justification::lire(&classe, &maladie), Err(Erreur::SignatureInvalide));
        let autre_jour = texte.replace("\n2026-11-17\n", "\n2026-11-18\n");
        assert_eq!(Justification::lire(&classe, &autre_jour), Err(Erreur::AutreSeance));
        assert_eq!(Justification::lire(&CodeDeClasse::nouveau().unwrap().secrets(), &texte), Err(Erreur::AutreSeance));
        let seance = classe.seance("2026-11-17", Demi::Matin).unwrap();
        let champs = [classe.etiquette(), &noah.publique().texte(), seance.texte(), "2026-11-17", "matin", "panne", "5"];
        let motif_inconnu = texte_signe(FORMAT, &champs, &noah).unwrap();
        assert_eq!(Justification::lire(&classe, &motif_inconnu), Err(Erreur::ChampInvalide));
    }
}

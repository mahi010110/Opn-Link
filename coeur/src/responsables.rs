//! Ce qui se passe entre les responsables d'une classe : le chef qui passe la main, et les lettres
//! qu'ils s'écrivent pour partager l'état de la classe. Leurs boîtes sont dans la porte, que tout
//! apprenant peut lire : une lettre entre responsables est donc signée par celui qui l'écrit.

use crate::classe::SecretsDeClasse;
use crate::cles::{CleAppareil, ClePublique};
use crate::encodage::{champ, lire_signe, texte_signe};
use crate::erreur::Erreur;

const PASSATION: &str = "opn-link·passation·v1";
const ENTRE_RESPONSABLES: &str = "opn-link·responsables·v1";

/// Le chef passe la main à un autre responsable. Il signe seul : c'est sa clé qui fait foi.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Passation {
    pub ancien: ClePublique,
    pub nouveau: ClePublique,
    pub quand: u64,
    pub texte: String,
}

impl Passation {
    pub fn signer(classe: &SecretsDeClasse, chef: &CleAppareil, nouveau: &ClePublique, quand: u64) -> Result<String, Erreur> {
        if &chef.publique() == nouveau {
            return Err(Erreur::ChampInvalide);
        }
        texte_signe(PASSATION, &[classe.etiquette(), &chef.publique().texte(), &nouveau.texte(), &quand.to_string()], chef)
    }

    /// Relit une passation, et vérifie qu'elle est faite pour cette classe et signée par l'ancien chef.
    pub fn lire(classe: &SecretsDeClasse, texte: &str) -> Result<Self, Erreur> {
        let (champs, signature, signe) = lire_signe(texte, PASSATION)?;
        let [etiquette, ancien, nouveau, quand] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != classe.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let ancien = ClePublique::lire(ancien)?;
        ancien.verifier(signe.as_bytes(), &signature)?;
        Ok(Passation {
            ancien,
            nouveau: ClePublique::lire(nouveau)?,
            quand: quand.parse().map_err(|_| Erreur::Encodage)?,
            texte: texte.trim_end_matches('\n').into(),
        })
    }
}

/// Un chef de la lignée, et le temps où il l'a été.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Regne {
    pub chef: ClePublique,
    pub depuis: u64,
    pub jusqua: Option<u64>,
}

/// Les chefs successifs d'une classe, à partir de celui qu'on connaît. Un chef ne passe la main
/// qu'une fois : sa première passation compte, et ce qu'il signe ensuite comme chef ne compte plus.
pub fn lignee(passations: &[Passation], depart: &ClePublique) -> Vec<Regne> {
    let mut regnes = Vec::new();
    let (mut chef, mut depuis) = (depart.clone(), 0);
    loop {
        let suivante = passations.iter().filter(|p| p.ancien == chef && p.quand > depuis).min_by_key(|p| p.quand);
        let Some(p) = suivante else {
            regnes.push(Regne { chef, depuis, jusqua: None });
            return regnes;
        };
        regnes.push(Regne { chef, depuis, jusqua: Some(p.quand) });
        chef = p.nouveau.clone();
        depuis = p.quand;
    }
}

/// Une lettre d'un responsable aux autres, signée. Son contenu est une ligne, du JSON pour le site.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EntreResponsables {
    pub de: ClePublique,
    pub quand: u64,
    pub contenu: String,
}

impl EntreResponsables {
    pub fn signer(classe: &SecretsDeClasse, responsable: &CleAppareil, contenu: &str, quand: u64) -> Result<String, Erreur> {
        texte_signe(
            ENTRE_RESPONSABLES,
            &[classe.etiquette(), &responsable.publique().texte(), &quand.to_string(), champ(contenu)?],
            responsable,
        )
    }

    /// Relit une lettre entre responsables. Elle ne compte que signée par l'un des responsables donnés.
    pub fn lire(classe: &SecretsDeClasse, texte: &str, responsables: &[ClePublique]) -> Result<Self, Erreur> {
        let (champs, signature, signe) = lire_signe(texte, ENTRE_RESPONSABLES)?;
        let [etiquette, de, quand, contenu] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != classe.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let de = ClePublique::lire(de)?;
        if !responsables.contains(&de) {
            return Err(Erreur::PasLeFormateur);
        }
        de.verifier(signe.as_bytes(), &signature)?;
        Ok(EntreResponsables { de, quand: quand.parse().map_err(|_| Erreur::Encodage)?, contenu: contenu.into() })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::classe::CodeDeClasse;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    fn cles() -> (SecretsDeClasse, CleAppareil, CleAppareil, CleAppareil) {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        (classe, CleAppareil::nouvelle().unwrap(), CleAppareil::nouvelle().unwrap(), CleAppareil::nouvelle().unwrap())
    }

    #[test]
    fn une_passation_se_relit() {
        let (classe, awa, julien, _) = cles();
        let texte = Passation::signer(&classe, &awa, &julien.publique(), 6).unwrap();
        let p = Passation::lire(&classe, &texte).unwrap();
        assert_eq!((p.ancien, p.nouveau, p.quand), (awa.publique(), julien.publique(), 6));
        assert_eq!(Passation::signer(&classe, &awa, &awa.publique(), 6), Err(Erreur::ChampInvalide));
    }

    #[test]
    fn seul_le_chef_passe_sa_main() {
        let (classe, awa, julien, intrus) = cles();
        let texte = Passation::signer(&classe, &intrus, &julien.publique(), 6).unwrap();
        let usurpee = texte.replace(&intrus.publique().texte(), &awa.publique().texte());
        assert_eq!(Passation::lire(&classe, &usurpee), Err(Erreur::SignatureInvalide));
        let autre = CodeDeClasse::nouveau().unwrap().secrets();
        assert_eq!(Passation::lire(&autre, &texte), Err(Erreur::AutreSeance));
    }

    #[test]
    fn la_lignee_suit_les_passations_et_la_premiere_compte() {
        let (classe, awa, julien, sandrine) = cles();
        let lire = |t: String| Passation::lire(&classe, &t).unwrap();
        let vers_julien = lire(Passation::signer(&classe, &awa, &julien.publique(), 6).unwrap());
        let vers_sandrine_trop_tard = lire(Passation::signer(&classe, &awa, &sandrine.publique(), 8).unwrap());
        let rendue = lire(Passation::signer(&classe, &julien, &awa.publique(), 9).unwrap());
        let regnes = lignee(&[rendue, vers_sandrine_trop_tard, vers_julien], &awa.publique());
        let chefs: Vec<_> = regnes.iter().map(|r| (r.chef.clone(), r.depuis, r.jusqua)).collect();
        assert_eq!(chefs, [(awa.publique(), 0, Some(6)), (julien.publique(), 6, Some(9)), (awa.publique(), 9, None)]);
        assert_eq!(lignee(&[], &awa.publique()), [Regne { chef: awa.publique(), depuis: 0, jusqua: None }]);
    }

    #[test]
    fn une_lettre_entre_responsables_ne_compte_que_signee_par_l_un_d_eux() {
        let (classe, awa, julien, yanis) = cles();
        let responsables = [awa.publique(), julien.publique()];
        let texte = EntreResponsables::signer(&classe, &julien, r#"{"v":1}"#, 5).unwrap();
        let lue = EntreResponsables::lire(&classe, &texte, &responsables).unwrap();
        assert_eq!((lue.de, lue.quand, lue.contenu.as_str()), (julien.publique(), 5, r#"{"v":1}"#));
        let de_yanis = EntreResponsables::signer(&classe, &yanis, r#"{"v":1}"#, 5).unwrap();
        assert_eq!(EntreResponsables::lire(&classe, &de_yanis, &responsables), Err(Erreur::PasLeFormateur));
        let changee = texte.replace(r#"{"v":1}"#, r#"{"v":2}"#);
        assert_eq!(EntreResponsables::lire(&classe, &changee, &responsables), Err(Erreur::SignatureInvalide));
        assert_eq!(EntreResponsables::signer(&classe, &awa, "deux\nlignes", 5), Err(Erreur::ChampInvalide));
    }
}

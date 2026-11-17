//! Entrer dans une classe. Le code de la classe ouvre la porte : il permet de trouver la classe
//! et de demander à entrer, rien de plus. Un responsable accepte, et remet le secret du fil.

use crate::classe::{Membre, SecretsDeClasse};
use crate::cles::{CleAppareil, ClePublique};
use crate::encodage::{champ, lire_signe, texte_signe};
use crate::erreur::Erreur;

const PORTE: &str = "opn-link·porte·v1";
const ENTREE: &str = "opn-link·entree·v1";

/// Ce qui s'écrit à côté du nom d'un responsable.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Role {
    Formateur,
    Centre,
}

impl Role {
    pub fn texte(self) -> &'static str {
        match self {
            Role::Formateur => "formateur",
            Role::Centre => "centre",
        }
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        match texte {
            "formateur" => Ok(Role::Formateur),
            "centre" => Ok(Role::Centre),
            _ => Err(Erreur::ChampInvalide),
        }
    }
}

/// Un responsable de la classe : le chef, ou un adjoint.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Responsable {
    pub prenom: String,
    pub nom: String,
    pub role: Role,
    pub cle: ClePublique,
    pub boite: ClePublique,
}

/// La porte de la classe, publiée par le chef sous l'étiquette du code, chiffrée par sa clé.
/// Elle dit le nom de la classe, son centre, ses horaires, et à qui demander d'entrer.
/// Le premier responsable est le chef, et c'est lui qui la signe.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Porte {
    pub nom: String,
    pub centre: String,
    pub matin: String,
    pub apres_midi: String,
    pub quand: u64,
    pub responsables: Vec<Responsable>,
    pub texte: String,
}

impl Porte {
    /// Le chef signe la porte. Il doit être le premier des responsables.
    #[allow(clippy::too_many_arguments)]
    pub fn signer(
        classe: &SecretsDeClasse,
        nom: &str,
        centre: &str,
        matin: &str,
        apres_midi: &str,
        responsables: &[Responsable],
        chef: &CleAppareil,
        quand: u64,
    ) -> Result<String, Erreur> {
        if responsables.first().map(|r| &r.cle) != Some(&chef.publique()) {
            return Err(Erreur::PasLeFormateur);
        }
        let quand = quand.to_string();
        let mut champs: Vec<String> = [classe.etiquette(), nom, centre, matin, apres_midi, &quand].map(String::from).to_vec();
        for r in responsables {
            champs.extend([r.prenom.clone(), r.nom.clone(), r.role.texte().into(), r.cle.texte(), r.boite.texte()]);
        }
        texte_signe(PORTE, &champs.iter().map(String::as_str).collect::<Vec<_>>(), chef)
    }

    /// Relit une porte, et vérifie qu'elle est signée par son chef et faite pour cette classe.
    pub fn lire(classe: &SecretsDeClasse, texte: &str) -> Result<Self, Erreur> {
        let (champs, signature, signe) = lire_signe(texte, PORTE).map_err(|_| Erreur::PorteInconnue)?;
        let [etiquette, nom, centre, matin, apres_midi, quand, reste @ ..] = &champs[..] else {
            return Err(Erreur::PorteInconnue);
        };
        if *etiquette != classe.etiquette() || reste.is_empty() || reste.len() % 5 != 0 {
            return Err(Erreur::PorteInconnue);
        }
        let responsables = reste
            .chunks(5)
            .map(|r| {
                Ok(Responsable {
                    prenom: r[0].into(),
                    nom: r[1].into(),
                    role: Role::lire(r[2])?,
                    cle: ClePublique::lire(r[3])?,
                    boite: ClePublique::lire(r[4])?,
                })
            })
            .collect::<Result<Vec<_>, Erreur>>()
            .map_err(|_| Erreur::PorteInconnue)?;
        responsables[0].cle.verifier(signe.as_bytes(), &signature).map_err(|_| Erreur::PorteInconnue)?;
        Ok(Porte {
            nom: (*nom).into(),
            centre: (*centre).into(),
            matin: (*matin).into(),
            apres_midi: (*apres_midi).into(),
            quand: quand.parse().map_err(|_| Erreur::PorteInconnue)?,
            responsables,
            texte: texte.trim_end_matches('\n').into(),
        })
    }

    pub fn chef(&self) -> &Responsable {
        &self.responsables[0]
    }
}

/// Choisit la porte d'une classe parmi celles que les relais rendent pour son étiquette.
/// Le lien du QR donne la clé du chef : seule une porte signée par lui compte. Un code tapé
/// à la main ne la donne pas : si deux chefs différents ont publié une porte, on ne choisit pas.
pub fn choisir_porte(classe: &SecretsDeClasse, textes: &[&str], chef: Option<&ClePublique>) -> Result<Porte, Erreur> {
    let portes: Vec<Porte> =
        textes.iter().filter_map(|t| Porte::lire(classe, t).ok()).filter(|p| chef.is_none_or(|c| &p.chef().cle == c)).collect();
    let premiere = portes.first().ok_or(Erreur::PorteInconnue)?;
    if portes.iter().any(|p| p.chef().cle != premiere.chef().cle) {
        return Err(Erreur::PorteAmbigue);
    }
    Ok(portes.into_iter().max_by_key(|p| p.quand).expect("au moins une porte"))
}

/// La demande d'entrée d'un apprenant, signée par l'appareil qui signera sa présence.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Demande {
    pub membre: Membre,
    pub quand: u64,
    pub texte: String,
}

impl Demande {
    pub fn signer(classe: &SecretsDeClasse, prenom: &str, nom: &str, appareil: &CleAppareil, quand: u64) -> Result<String, Erreur> {
        let (cle, boite) = (appareil.publique().texte(), appareil.boite().texte());
        texte_signe(ENTREE, &[classe.etiquette(), champ(prenom.trim())?, champ(nom.trim())?, &cle, &boite, &quand.to_string()], appareil)
    }

    /// Relit une demande, et vérifie qu'elle est faite pour cette classe et signée par la clé qu'elle porte.
    pub fn lire(classe: &SecretsDeClasse, texte: &str) -> Result<Self, Erreur> {
        let (champs, signature, signe) = lire_signe(texte, ENTREE)?;
        let [etiquette, prenom, nom, cle, boite, quand] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != classe.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let membre = Membre { prenom: prenom.into(), nom: nom.into(), cle: ClePublique::lire(cle)?, boite: ClePublique::lire(boite)? };
        membre.cle.verifier(signe.as_bytes(), &signature)?;
        Ok(Demande { membre, quand: quand.parse().map_err(|_| Erreur::Encodage)?, texte: texte.trim_end_matches('\n').into() })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::classe::{Acceptation, CodeDeClasse};
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    fn responsable(prenom: &str, nom: &str, role: Role, cle: &CleAppareil) -> Responsable {
        Responsable { prenom: prenom.into(), nom: nom.into(), role, cle: cle.publique(), boite: cle.boite() }
    }

    #[test]
    fn la_porte_se_relit_et_dit_a_qui_demander() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let awa = CleAppareil::nouvelle().unwrap();
        let sandrine = CleAppareil::nouvelle().unwrap();
        let responsables =
            [responsable("Awa", "Diallo", Role::Formateur, &awa), responsable("Sandrine", "Robert", Role::Centre, &sandrine)];
        let texte = Porte::signer(&classe, "BTS SIO 2", "Centre Exemple", "9:00-12:30", "13:30-17:00", &responsables, &awa, 1).unwrap();
        let porte = Porte::lire(&classe, &texte).unwrap();
        assert_eq!(porte.nom, "BTS SIO 2");
        assert_eq!(porte.chef().prenom, "Awa");
        assert_eq!(porte.responsables[1].role, Role::Centre);
        assert_eq!(porte.texte, texte);
        let autre = CodeDeClasse::nouveau().unwrap().secrets();
        assert_eq!(Porte::lire(&autre, &texte), Err(Erreur::PorteInconnue));
    }

    #[test]
    fn seul_le_premier_responsable_signe_la_porte() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let awa = CleAppareil::nouvelle().unwrap();
        let intrus = CleAppareil::nouvelle().unwrap();
        let responsables = [responsable("Awa", "Diallo", Role::Formateur, &awa)];
        assert_eq!(
            Porte::signer(&classe, "BTS", "Centre", "9:00-12:30", "13:30-17:00", &responsables, &intrus, 1),
            Err(Erreur::PasLeFormateur)
        );
        let texte = Porte::signer(&classe, "BTS", "Centre", "9:00-12:30", "13:30-17:00", &responsables, &awa, 1).unwrap();
        let change = texte.replacen("BTS", "CAP", 1);
        assert_eq!(Porte::lire(&classe, &change), Err(Erreur::PorteInconnue));
    }

    #[test]
    fn deux_chefs_pour_un_meme_code_rendent_la_porte_ambigue() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let awa = CleAppareil::nouvelle().unwrap();
        let intrus = CleAppareil::nouvelle().unwrap();
        let vraie = Porte::signer(
            &classe,
            "BTS SIO 2",
            "Centre",
            "9:00-12:30",
            "13:30-17:00",
            &[responsable("Awa", "Diallo", Role::Formateur, &awa)],
            &awa,
            1,
        )
        .unwrap();
        let plus_neuve = Porte::signer(
            &classe,
            "BTS SIO 2",
            "Centre",
            "9:00-12:30",
            "13:30-17:00",
            &[responsable("Awa", "Diallo", Role::Formateur, &awa)],
            &awa,
            5,
        )
        .unwrap();
        let fausse = Porte::signer(
            &classe,
            "BTS SIO 2",
            "Centre",
            "9:00-12:30",
            "13:30-17:00",
            &[responsable("Awa", "Diallo", Role::Formateur, &intrus)],
            &intrus,
            9,
        )
        .unwrap();
        assert_eq!(choisir_porte(&classe, &[&vraie, &plus_neuve], None).unwrap().quand, 5);
        assert_eq!(choisir_porte(&classe, &[&vraie, &fausse], None), Err(Erreur::PorteAmbigue));
        assert_eq!(choisir_porte(&classe, &[&vraie, &fausse, &plus_neuve], Some(&awa.publique())).unwrap().quand, 5);
        assert_eq!(choisir_porte(&classe, &[], None), Err(Erreur::PorteInconnue));
    }

    #[test]
    fn une_demande_puis_son_acceptation() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let awa = CleAppareil::nouvelle().unwrap();
        let lea = CleAppareil::nouvelle().unwrap();
        let texte = Demande::signer(&classe, " Léa ", "Martin", &lea, 7).unwrap();
        let demande = Demande::lire(&classe, &texte).unwrap();
        assert_eq!((demande.membre.prenom.as_str(), demande.membre.cle.clone()), ("Léa", lea.publique()));
        let acceptation = Acceptation::signer(&classe, demande.membre.clone(), &awa, 8).unwrap();
        let texte = acceptation.texte(&classe).unwrap();
        let relue = Acceptation::lire(&classe, &texte, &[awa.publique()]).unwrap();
        assert_eq!(relue.membre, demande.membre);
        assert_eq!(Acceptation::lire(&classe, &texte, &[lea.publique()]).unwrap_err(), Erreur::PasLeFormateur);
    }

    #[test]
    fn une_demande_au_nom_d_un_autre_ne_se_verifie_pas() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let lea = CleAppareil::nouvelle().unwrap();
        let intrus = CleAppareil::nouvelle().unwrap();
        let texte = Demande::signer(&classe, "Léa", "Martin", &intrus, 7).unwrap();
        let usurpee = texte.replace(&intrus.publique().texte(), &lea.publique().texte());
        assert_eq!(Demande::lire(&classe, &usurpee), Err(Erreur::SignatureInvalide));
        assert_eq!(Demande::signer(&classe, "", "Martin", &lea, 7), Err(Erreur::ChampInvalide));
    }
}

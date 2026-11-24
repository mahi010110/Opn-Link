//! Les annonces de la classe : ce que les responsables publient sur le fil, que toute la classe lit.
//! Seuls les responsables publient. L'auteur modifie son annonce en signant une nouvelle version,
//! avec le même identifiant, et n'importe quel responsable la retire de la même façon. Chaque
//! version dit à quelle heure la montrer : écrite en dehors des heures de la classe, elle arrive à
//! l'ouverture suivante, et c'est l'appareil qui la reçoit qui attend.

use crate::cles::{CleAppareil, ClePublique, Signature};
use crate::encodage::{a_signer, b64, de_b64, lire_signe};
use crate::erreur::Erreur;
use crate::fil::SecretDuFil;
use crate::hasard;

const FORMAT: &str = "opn-link·annonce·v1";
const SANS_TEXTE: &str = "-";

/// Le texte d'une annonce, en octets : il tient dans un événement des relais (60 Ko), avec de la marge.
pub const TEXTE_AU_PLUS: usize = 8 * 1024;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EtatDeLAnnonce {
    Publiee,
    Retiree,
}

impl EtatDeLAnnonce {
    pub fn texte(self) -> &'static str {
        match self {
            EtatDeLAnnonce::Publiee => "publiee",
            EtatDeLAnnonce::Retiree => "retiree",
        }
    }

    fn lire(texte: &str) -> Result<Self, Erreur> {
        match texte {
            "publiee" => Ok(EtatDeLAnnonce::Publiee),
            "retiree" => Ok(EtatDeLAnnonce::Retiree),
            _ => Err(Erreur::ChampInvalide),
        }
    }
}

/// Une version d'une annonce à la classe, signée par un responsable.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AnnonceDeLaClasse {
    /// 16 octets tirés au hasard, en base64url : le même pour toutes les versions d'une annonce.
    pub id: String,
    pub auteur: ClePublique,
    /// L'heure de la première version.
    pub creee: u64,
    /// L'heure de cette version.
    pub quand: u64,
    /// L'heure à partir de laquelle la montrer.
    pub arrivee: u64,
    pub etat: EtatDeLAnnonce,
    /// Vide pour une annonce retirée.
    pub texte: String,
    pub par: ClePublique,
    pub signature: Signature,
}

/// Un identifiant d'annonce neuf.
pub fn identifiant_d_annonce() -> Result<String, Erreur> {
    Ok(b64(&hasard::octets::<16>()?))
}

fn identifiant(id: &str) -> Result<&str, Erreur> {
    if de_b64(id).is_ok_and(|o| o.len() == 16) { Ok(id) } else { Err(Erreur::ChampInvalide) }
}

fn texte_publie(texte: &str) -> Result<&str, Erreur> {
    if texte.trim().is_empty() || texte.len() > TEXTE_AU_PLUS {
        return Err(Erreur::ChampInvalide);
    }
    Ok(texte)
}

impl AnnonceDeLaClasse {
    #[allow(clippy::too_many_arguments)]
    fn octets(
        fil: &SecretDuFil,
        id: &str,
        auteur: &ClePublique,
        creee: u64,
        quand: u64,
        arrivee: u64,
        etat: EtatDeLAnnonce,
        texte: &str,
        par: &ClePublique,
    ) -> Result<Vec<u8>, Erreur> {
        let texte = match etat {
            EtatDeLAnnonce::Publiee => b64(texte_publie(texte)?.as_bytes()),
            EtatDeLAnnonce::Retiree => SANS_TEXTE.into(),
        };
        if !(creee <= quand && quand <= arrivee) {
            return Err(Erreur::ChampInvalide);
        }
        a_signer(
            FORMAT,
            &[
                &fil.etiquette(),
                identifiant(id)?,
                &auteur.texte(),
                &creee.to_string(),
                &quand.to_string(),
                &arrivee.to_string(),
                etat.texte(),
                &texte,
                &par.texte(),
            ],
        )
    }

    /// Un responsable publie une annonce neuve, ou une nouvelle version de la sienne : même
    /// identifiant, même heure de création.
    pub fn publier(
        fil: &SecretDuFil,
        id: &str,
        creee: u64,
        texte: &str,
        responsable: &CleAppareil,
        quand: u64,
        arrivee: u64,
    ) -> Result<Self, Erreur> {
        let par = responsable.publique();
        let signature = responsable.signer(&Self::octets(fil, id, &par, creee, quand, arrivee, EtatDeLAnnonce::Publiee, texte, &par)?);
        Ok(AnnonceDeLaClasse {
            id: id.into(),
            auteur: par.clone(),
            creee,
            quand,
            arrivee,
            etat: EtatDeLAnnonce::Publiee,
            texte: texte.into(),
            par,
            signature,
        })
    }

    /// Un responsable retire une annonce, la sienne ou celle d'un autre. Le retrait vaut tout de suite.
    pub fn retirer(
        fil: &SecretDuFil,
        id: &str,
        auteur: &ClePublique,
        creee: u64,
        responsable: &CleAppareil,
        quand: u64,
    ) -> Result<Self, Erreur> {
        let par = responsable.publique();
        let signature = responsable.signer(&Self::octets(fil, id, auteur, creee, quand, quand, EtatDeLAnnonce::Retiree, "", &par)?);
        Ok(AnnonceDeLaClasse {
            id: id.into(),
            auteur: auteur.clone(),
            creee,
            quand,
            arrivee: quand,
            etat: EtatDeLAnnonce::Retiree,
            texte: String::new(),
            par,
            signature,
        })
    }

    pub fn texte(&self, fil: &SecretDuFil) -> Result<String, Erreur> {
        let octets = Self::octets(fil, &self.id, &self.auteur, self.creee, self.quand, self.arrivee, self.etat, &self.texte, &self.par)?;
        let mut texte = String::from_utf8(octets).map_err(|_| Erreur::Encodage)?;
        texte.push('\n');
        texte.push_str(&self.signature.texte());
        Ok(texte)
    }

    /// Relit une annonce venue du fil. Elle ne compte que signée par l'un des responsables donnés,
    /// pour ce fil. Une version publiée est signée par son auteur ; un retrait, par n'importe lequel.
    pub fn lire(fil: &SecretDuFil, texte: &str, responsables: &[ClePublique]) -> Result<Self, Erreur> {
        let (champs, signature, _) = lire_signe(texte, FORMAT)?;
        let [etiquette, id, auteur, creee, quand, arrivee, etat, contenu, par] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != fil.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let nombre = |t: &str| t.parse::<u64>().map_err(|_| Erreur::Encodage);
        let etat = EtatDeLAnnonce::lire(etat)?;
        let texte = match etat {
            EtatDeLAnnonce::Publiee => String::from_utf8(de_b64(contenu)?).map_err(|_| Erreur::Encodage)?,
            EtatDeLAnnonce::Retiree if contenu == SANS_TEXTE => String::new(),
            EtatDeLAnnonce::Retiree => return Err(Erreur::Encodage),
        };
        let annonce = AnnonceDeLaClasse {
            id: identifiant(id)?.into(),
            auteur: ClePublique::lire(auteur)?,
            creee: nombre(creee)?,
            quand: nombre(quand)?,
            arrivee: nombre(arrivee)?,
            etat,
            texte,
            par: ClePublique::lire(par)?,
            signature,
        };
        if !responsables.contains(&annonce.par) || (etat == EtatDeLAnnonce::Publiee && annonce.par != annonce.auteur) {
            return Err(Erreur::PasLeFormateur);
        }
        let octets = Self::octets(
            fil,
            &annonce.id,
            &annonce.auteur,
            annonce.creee,
            annonce.quand,
            annonce.arrivee,
            etat,
            &annonce.texte,
            &annonce.par,
        )?;
        annonce.par.verifier(&octets, &annonce.signature)?;
        Ok(annonce)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    const TEXTE: &str = "Lundi 23, le cours a lieu en salle B12.\nApportez votre ordinateur, chargé.";

    fn cles() -> (SecretDuFil, CleAppareil, CleAppareil, CleAppareil) {
        (
            SecretDuFil::nouveau().unwrap(),
            CleAppareil::nouvelle().unwrap(),
            CleAppareil::nouvelle().unwrap(),
            CleAppareil::nouvelle().unwrap(),
        )
    }

    #[test]
    fn une_annonce_se_relit_avec_ses_lignes() {
        let (fil, awa, julien, _) = cles();
        let id = identifiant_d_annonce().unwrap();
        let texte = AnnonceDeLaClasse::publier(&fil, &id, 5, TEXTE, &awa, 5, 9).unwrap().texte(&fil).unwrap();
        let lue = AnnonceDeLaClasse::lire(&fil, &texte, &[awa.publique(), julien.publique()]).unwrap();
        assert_eq!((lue.id, lue.auteur, lue.creee, lue.quand, lue.arrivee), (id, awa.publique(), 5, 5, 9));
        assert_eq!((lue.etat, lue.texte.as_str()), (EtatDeLAnnonce::Publiee, TEXTE));
    }

    #[test]
    fn seul_un_responsable_publie_et_seul_l_auteur_modifie() {
        let (fil, awa, julien, lea) = cles();
        let responsables = [awa.publique(), julien.publique()];
        let id = identifiant_d_annonce().unwrap();
        let par_lea = AnnonceDeLaClasse::publier(&fil, &id, 5, TEXTE, &lea, 5, 5).unwrap().texte(&fil).unwrap();
        assert_eq!(AnnonceDeLaClasse::lire(&fil, &par_lea, &responsables), Err(Erreur::PasLeFormateur));
        let d_awa = AnnonceDeLaClasse::publier(&fil, &id, 5, TEXTE, &awa, 5, 5).unwrap().texte(&fil).unwrap();
        let octets =
            AnnonceDeLaClasse::octets(&fil, &id, &awa.publique(), 5, 6, 6, EtatDeLAnnonce::Publiee, "Salle C4.", &julien.publique())
                .unwrap();
        let au_nom_d_awa = AnnonceDeLaClasse {
            id: id.clone(),
            auteur: awa.publique(),
            creee: 5,
            quand: 6,
            arrivee: 6,
            etat: EtatDeLAnnonce::Publiee,
            texte: "Salle C4.".into(),
            par: julien.publique(),
            signature: julien.signer(&octets),
        };
        assert_eq!(AnnonceDeLaClasse::lire(&fil, &au_nom_d_awa.texte(&fil).unwrap(), &responsables), Err(Erreur::PasLeFormateur));
        let changee = d_awa.replace(&b64(TEXTE.as_bytes()), &b64("Lundi 23, salle C4.".as_bytes()));
        assert_eq!(AnnonceDeLaClasse::lire(&fil, &changee, &responsables), Err(Erreur::SignatureInvalide));
        assert_eq!(AnnonceDeLaClasse::lire(&SecretDuFil::nouveau().unwrap(), &d_awa, &responsables), Err(Erreur::AutreSeance));
    }

    #[test]
    fn un_responsable_retire_l_annonce_d_un_autre() {
        let (fil, awa, julien, lea) = cles();
        let responsables = [awa.publique(), julien.publique()];
        let id = identifiant_d_annonce().unwrap();
        let retrait = AnnonceDeLaClasse::retirer(&fil, &id, &awa.publique(), 5, &julien, 8).unwrap().texte(&fil).unwrap();
        let lu = AnnonceDeLaClasse::lire(&fil, &retrait, &responsables).unwrap();
        assert_eq!(
            (lu.etat, lu.auteur, lu.par, lu.arrivee, lu.texte.as_str()),
            (EtatDeLAnnonce::Retiree, awa.publique(), julien.publique(), 8, "")
        );
        let par_lea = AnnonceDeLaClasse::retirer(&fil, &id, &awa.publique(), 5, &lea, 8).unwrap().texte(&fil).unwrap();
        assert_eq!(AnnonceDeLaClasse::lire(&fil, &par_lea, &responsables), Err(Erreur::PasLeFormateur));
        let avec_un_texte = retrait.replace("\nretiree\n-\n", &format!("\nretiree\n{}\n", b64(TEXTE.as_bytes())));
        assert_eq!(AnnonceDeLaClasse::lire(&fil, &avec_un_texte, &responsables), Err(Erreur::Encodage));
    }

    #[test]
    fn une_annonce_vide_trop_longue_ou_qui_arrive_avant_d_etre_ecrite_ne_se_signe_pas() {
        let (fil, awa, _, _) = cles();
        let id = identifiant_d_annonce().unwrap();
        assert_eq!(AnnonceDeLaClasse::publier(&fil, &id, 5, "  \n ", &awa, 5, 5), Err(Erreur::ChampInvalide));
        assert_eq!(AnnonceDeLaClasse::publier(&fil, &id, 5, &"é".repeat(TEXTE_AU_PLUS), &awa, 5, 5), Err(Erreur::ChampInvalide));
        assert_eq!(AnnonceDeLaClasse::publier(&fil, &id, 5, TEXTE, &awa, 5, 4), Err(Erreur::ChampInvalide));
        assert_eq!(AnnonceDeLaClasse::publier(&fil, &id, 6, TEXTE, &awa, 5, 5), Err(Erreur::ChampInvalide));
        assert_eq!(AnnonceDeLaClasse::publier(&fil, "court", 5, TEXTE, &awa, 5, 5), Err(Erreur::ChampInvalide));
    }
}

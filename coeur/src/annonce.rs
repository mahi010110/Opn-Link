// L'annonce de l'appel : ce que le formateur dit à la classe, sur le fil, quand il ouvre l'appel
// d'une demi-journée et quand il le clôt. Chaque membre a le secret du fil : sans signature, un
// apprenant pourrait clore l'appel sur le téléphone des autres.

use crate::appel::{Demi, IdSeance};
use crate::classe::SecretsDeClasse;
use crate::cles::{CleAppareil, ClePublique, Signature};
use crate::encodage::{a_signer, lire_signe};
use crate::erreur::Erreur;
use crate::fil::SecretDuFil;

const FORMAT: &str = "opn-link·appel·v1";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EtatDeLAppel {
    Ouvert,
    Clos,
}

impl EtatDeLAppel {
    pub fn texte(self) -> &'static str {
        match self {
            EtatDeLAppel::Ouvert => "ouvert",
            EtatDeLAppel::Clos => "clos",
        }
    }

    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        match texte {
            "ouvert" => Ok(EtatDeLAppel::Ouvert),
            "clos" => Ok(EtatDeLAppel::Clos),
            _ => Err(Erreur::ChampInvalide),
        }
    }
}

/// L'état de l'appel d'une demi-journée, signé par le responsable qui le tient.
/// Pour une même séance, c'est l'annonce la plus récente qui compte.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AnnonceDeLAppel {
    pub seance: IdSeance,
    pub date: String,
    pub demi: Demi,
    pub etat: EtatDeLAppel,
    pub quand: u64,
    pub par: ClePublique,
    pub signature: Signature,
}

impl AnnonceDeLAppel {
    fn octets(
        fil: &SecretDuFil,
        seance: &IdSeance,
        date: &str,
        demi: Demi,
        etat: EtatDeLAppel,
        quand: u64,
        par: &ClePublique,
    ) -> Result<Vec<u8>, Erreur> {
        a_signer(FORMAT, &[&fil.etiquette(), seance.texte(), date, demi.texte(), etat.texte(), &quand.to_string(), &par.texte()])
    }

    /// Le responsable annonce que l'appel d'une séance est ouvert, ou clos.
    pub fn signer(
        fil: &SecretDuFil,
        seance: &IdSeance,
        date: &str,
        demi: Demi,
        etat: EtatDeLAppel,
        responsable: &CleAppareil,
        quand: u64,
    ) -> Result<Self, Erreur> {
        let par = responsable.publique();
        let signature = responsable.signer(&Self::octets(fil, seance, date, demi, etat, quand, &par)?);
        Ok(AnnonceDeLAppel { seance: seance.clone(), date: date.into(), demi, etat, quand, par, signature })
    }

    /// L'annonce en texte : les champs signés, une ligne chacun, puis la signature.
    pub fn texte(&self, fil: &SecretDuFil) -> Result<String, Erreur> {
        let octets = Self::octets(fil, &self.seance, &self.date, self.demi, self.etat, self.quand, &self.par)?;
        let mut texte = String::from_utf8(octets).map_err(|_| Erreur::Encodage)?;
        texte.push('\n');
        texte.push_str(&self.signature.texte());
        Ok(texte)
    }

    /// Relit une annonce venue du fil. Elle ne compte que signée par un responsable, pour ce fil,
    /// et pour une séance de cette classe qui correspond à sa date et à sa demi-journée.
    pub fn lire(fil: &SecretDuFil, classe: &SecretsDeClasse, texte: &str, responsables: &[ClePublique]) -> Result<Self, Erreur> {
        let (champs, signature, _) = lire_signe(texte, FORMAT)?;
        let [etiquette, seance, date, demi, etat, quand, par] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != fil.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let annonce = AnnonceDeLAppel {
            seance: IdSeance::lire(seance)?,
            date: date.into(),
            demi: Demi::lire(demi)?,
            etat: EtatDeLAppel::lire(etat)?,
            quand: quand.parse().map_err(|_| Erreur::Encodage)?,
            par: ClePublique::lire(par)?,
            signature,
        };
        if classe.seance(&annonce.date, annonce.demi)? != annonce.seance {
            return Err(Erreur::AutreSeance);
        }
        if !responsables.contains(&annonce.par) {
            return Err(Erreur::PasLeFormateur);
        }
        let octets = Self::octets(fil, &annonce.seance, &annonce.date, annonce.demi, annonce.etat, annonce.quand, &annonce.par)?;
        annonce.par.verifier(&octets, &annonce.signature)?;
        Ok(annonce)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::classe::CodeDeClasse;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    struct Classe {
        secrets: SecretsDeClasse,
        fil: SecretDuFil,
        formateur: CleAppareil,
        apprenant: CleAppareil,
    }

    fn classe() -> Classe {
        Classe {
            secrets: CodeDeClasse::nouveau().unwrap().secrets(),
            fil: SecretDuFil::nouveau().unwrap(),
            formateur: CleAppareil::nouvelle().unwrap(),
            apprenant: CleAppareil::nouvelle().unwrap(),
        }
    }

    fn annonce(c: &Classe, etat: EtatDeLAppel, par: &CleAppareil) -> String {
        let seance = c.secrets.seance("2026-11-17", Demi::Matin).unwrap();
        AnnonceDeLAppel::signer(&c.fil, &seance, "2026-11-17", Demi::Matin, etat, par, 1_763_366_400_000).unwrap().texte(&c.fil).unwrap()
    }

    #[test]
    fn une_annonce_se_relit() {
        let c = classe();
        let lue =
            AnnonceDeLAppel::lire(&c.fil, &c.secrets, &annonce(&c, EtatDeLAppel::Clos, &c.formateur), &[c.formateur.publique()]).unwrap();
        assert_eq!((lue.etat, lue.demi, lue.date.as_str(), lue.quand), (EtatDeLAppel::Clos, Demi::Matin, "2026-11-17", 1_763_366_400_000));
        assert_eq!(lue.seance, c.secrets.seance("2026-11-17", Demi::Matin).unwrap());
    }

    #[test]
    fn un_apprenant_n_annonce_rien() {
        let c = classe();
        let fausse = annonce(&c, EtatDeLAppel::Clos, &c.apprenant);
        assert_eq!(AnnonceDeLAppel::lire(&c.fil, &c.secrets, &fausse, &[c.formateur.publique()]).unwrap_err(), Erreur::PasLeFormateur);
    }

    #[test]
    fn une_annonce_changee_ne_se_lit_plus() {
        let c = classe();
        let changee = annonce(&c, EtatDeLAppel::Ouvert, &c.formateur).replace("\nouvert\n", "\nclos\n");
        assert_eq!(AnnonceDeLAppel::lire(&c.fil, &c.secrets, &changee, &[c.formateur.publique()]).unwrap_err(), Erreur::SignatureInvalide);
    }

    #[test]
    fn une_annonce_ne_vaut_que_pour_son_fil_et_sa_classe() {
        let c = classe();
        let texte = annonce(&c, EtatDeLAppel::Ouvert, &c.formateur);
        let autre = classe();
        assert_eq!(AnnonceDeLAppel::lire(&autre.fil, &c.secrets, &texte, &[c.formateur.publique()]).unwrap_err(), Erreur::AutreSeance);
        assert_eq!(AnnonceDeLAppel::lire(&c.fil, &autre.secrets, &texte, &[c.formateur.publique()]).unwrap_err(), Erreur::AutreSeance);
    }

    #[test]
    fn la_seance_doit_etre_celle_de_la_date() {
        let c = classe();
        let veille = c.secrets.seance("2026-11-16", Demi::Matin).unwrap();
        let texte = AnnonceDeLAppel::signer(&c.fil, &veille, "2026-11-17", Demi::Matin, EtatDeLAppel::Ouvert, &c.formateur, 1)
            .unwrap()
            .texte(&c.fil)
            .unwrap();
        assert_eq!(AnnonceDeLAppel::lire(&c.fil, &c.secrets, &texte, &[c.formateur.publique()]).unwrap_err(), Erreur::AutreSeance);
    }
}

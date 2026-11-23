// L'annonce de l'appel : ce que le formateur dit à la classe, sur le fil, quand il ouvre l'appel
// d'une demi-journée et quand il le clôt. Chaque membre a le secret du fil : sans signature, un
// apprenant pourrait clore l'appel sur le téléphone des autres.
// Le prochain cours se dit de la même façon, à la clôture : c'est ainsi que l'app apprend les
// jours au centre, sans calendrier à saisir.

use crate::appel::{Demi, IdSeance};
use crate::classe::SecretsDeClasse;
use crate::cles::{CleAppareil, ClePublique, Signature};
use crate::encodage::{a_signer, lire_signe};
use crate::erreur::Erreur;
use crate::fil::SecretDuFil;

const FORMAT: &str = "opn-link·appel·v1";
const FORMAT_DU_PROCHAIN: &str = "opn-link·prochain·v1";

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

/// Le prochain cours d'une classe, une demi-journée, signé par un responsable.
/// Le plus récent compte : changer le prochain cours, c'est en signer un nouveau.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ProchainCours {
    pub date: String,
    pub demi: Demi,
    pub quand: u64,
    pub par: ClePublique,
    pub signature: Signature,
}

/// Une date `2026-11-23`, et rien d'autre.
fn date(texte: &str) -> Result<&str, Erreur> {
    let o = texte.as_bytes();
    let bonne = o.len() == 10 && o.iter().enumerate().all(|(i, c)| if i == 4 || i == 7 { *c == b'-' } else { c.is_ascii_digit() });
    if bonne { Ok(texte) } else { Err(Erreur::ChampInvalide) }
}

impl ProchainCours {
    fn octets(fil: &SecretDuFil, date_du_cours: &str, demi: Demi, quand: u64, par: &ClePublique) -> Result<Vec<u8>, Erreur> {
        a_signer(FORMAT_DU_PROCHAIN, &[&fil.etiquette(), date(date_du_cours)?, demi.texte(), &quand.to_string(), &par.texte()])
    }

    pub fn signer(fil: &SecretDuFil, date_du_cours: &str, demi: Demi, responsable: &CleAppareil, quand: u64) -> Result<Self, Erreur> {
        let par = responsable.publique();
        let signature = responsable.signer(&Self::octets(fil, date_du_cours, demi, quand, &par)?);
        Ok(ProchainCours { date: date_du_cours.into(), demi, quand, par, signature })
    }

    pub fn texte(&self, fil: &SecretDuFil) -> Result<String, Erreur> {
        let octets = Self::octets(fil, &self.date, self.demi, self.quand, &self.par)?;
        let mut texte = String::from_utf8(octets).map_err(|_| Erreur::Encodage)?;
        texte.push('\n');
        texte.push_str(&self.signature.texte());
        Ok(texte)
    }

    /// Relit le prochain cours venu du fil. Il ne compte que signé par un responsable, pour ce fil.
    pub fn lire(fil: &SecretDuFil, texte: &str, responsables: &[ClePublique]) -> Result<Self, Erreur> {
        let (champs, signature, _) = lire_signe(texte, FORMAT_DU_PROCHAIN)?;
        let [etiquette, date_du_cours, demi, quand, par] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != fil.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let prochain = ProchainCours {
            date: date(date_du_cours)?.into(),
            demi: Demi::lire(demi)?,
            quand: quand.parse().map_err(|_| Erreur::Encodage)?,
            par: ClePublique::lire(par)?,
            signature,
        };
        if !responsables.contains(&prochain.par) {
            return Err(Erreur::PasLeFormateur);
        }
        prochain.par.verifier(&Self::octets(fil, &prochain.date, prochain.demi, prochain.quand, &prochain.par)?, &prochain.signature)?;
        Ok(prochain)
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

    fn prochain(c: &Classe, par: &CleAppareil) -> String {
        ProchainCours::signer(&c.fil, "2026-11-23", Demi::Matin, par, 1_763_367_120_000).unwrap().texte(&c.fil).unwrap()
    }

    #[test]
    fn le_prochain_cours_se_relit() {
        let c = classe();
        let lu = ProchainCours::lire(&c.fil, &prochain(&c, &c.formateur), &[c.formateur.publique()]).unwrap();
        assert_eq!((lu.date.as_str(), lu.demi, lu.quand), ("2026-11-23", Demi::Matin, 1_763_367_120_000));
    }

    #[test]
    fn un_apprenant_ne_fixe_pas_le_prochain_cours() {
        let c = classe();
        let faux = prochain(&c, &c.apprenant);
        assert_eq!(ProchainCours::lire(&c.fil, &faux, &[c.formateur.publique()]).unwrap_err(), Erreur::PasLeFormateur);
    }

    #[test]
    fn un_prochain_cours_change_ne_se_lit_plus() {
        let c = classe();
        let change = prochain(&c, &c.formateur).replace("\n2026-11-23\n", "\n2026-11-30\n");
        assert_eq!(ProchainCours::lire(&c.fil, &change, &[c.formateur.publique()]).unwrap_err(), Erreur::SignatureInvalide);
        let autre = classe();
        assert_eq!(
            ProchainCours::lire(&autre.fil, &prochain(&c, &c.formateur), &[c.formateur.publique()]).unwrap_err(),
            Erreur::AutreSeance
        );
    }

    #[test]
    fn une_date_mal_ecrite_ne_se_signe_pas() {
        let c = classe();
        for mauvaise in ["23/11/2026", "2026-11-2", "lundi 23", "2026-11-233"] {
            assert_eq!(ProchainCours::signer(&c.fil, mauvaise, Demi::Matin, &c.formateur, 1).unwrap_err(), Erreur::ChampInvalide);
        }
    }

    #[test]
    fn une_annonce_de_l_appel_n_est_pas_un_prochain_cours() {
        let c = classe();
        let appel = annonce(&c, EtatDeLAppel::Clos, &c.formateur);
        assert!(ProchainCours::lire(&c.fil, &appel, &[c.formateur.publique()]).is_err());
        assert!(AnnonceDeLAppel::lire(&c.fil, &c.secrets, &prochain(&c, &c.formateur), &[c.formateur.publique()]).is_err());
    }
}

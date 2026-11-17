use hmac::{Hmac, KeyInit, Mac};
use sha2::Sha256;

use crate::appel::{Demi, IdSeance};
use crate::cles::{CleAppareil, ClePublique, Signature};
use crate::encodage::{a_signer, champ, hex, lire_signe};
use crate::erreur::Erreur;
use crate::hasard;

// L'alphabet et la longueur des codes de groupe d'OpenContact : ni i, l, o, 0 ni 1, qui se confondent.
const ALPHABET: &[u8] = b"abcdefghjkmnpqrstuvwxyz23456789";
const LONGUEUR: usize = 15;
const SEL: &[u8] = "opn-link·classe·v1".as_bytes();
const TOURS: u32 = 100_000;

/// Le code d'une classe. C'est le secret de la classe : qui l'a peut demander à entrer.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CodeDeClasse(String);

impl CodeDeClasse {
    /// Un code neuf, tiré au hasard.
    pub fn nouveau() -> Result<Self, Erreur> {
        let mut code = String::with_capacity(LONGUEUR);
        while code.len() < LONGUEUR {
            for octet in hasard::octets::<32>()? {
                // 248 = 8 × 31 : au-delà, garder l'octet pencherait vers les premières lettres.
                if octet < 248 && code.len() < LONGUEUR {
                    code.push(ALPHABET[usize::from(octet) % ALPHABET.len()] as char);
                }
            }
        }
        Ok(CodeDeClasse(code))
    }

    /// Lit un code tapé à la main : les espaces, les tirets et les majuscules ne comptent pas.
    pub fn lire(texte: &str) -> Result<Self, Erreur> {
        let code: String = texte.chars().filter(|c| !c.is_whitespace() && *c != '-').map(|c| c.to_ascii_lowercase()).collect();
        if code.len() != LONGUEUR || !code.bytes().all(|o| ALPHABET.contains(&o)) {
            return Err(Erreur::CodeDeClasseInvalide);
        }
        Ok(CodeDeClasse(code))
    }

    /// Le code tel qu'on l'affiche : trois blocs de cinq, en majuscules.
    pub fn affiche(&self) -> String {
        self.0.to_ascii_uppercase().as_bytes().chunks(5).map(|b| String::from_utf8_lossy(b).into_owned()).collect::<Vec<_>>().join(" ")
    }

    /// Le code tel qu'il voyage.
    pub fn texte(&self) -> &str {
        &self.0
    }

    /// L'étiquette que voient les relais et la clé de la classe, tirées du code.
    pub fn secrets(&self) -> SecretsDeClasse {
        let mut sortie = [0u8; 48];
        pbkdf2::pbkdf2_hmac::<Sha256>(self.0.as_bytes(), SEL, TOURS, &mut sortie);
        let mut cle = [0u8; 32];
        cle.copy_from_slice(&sortie[16..]);
        SecretsDeClasse { etiquette: format!("opl-classe-{}", hex(&sortie[..16])), cle }
    }
}

/// Ce que le code d'une classe donne : l'étiquette publique et la clé secrète.
#[derive(Clone)]
pub struct SecretsDeClasse {
    etiquette: String,
    cle: [u8; 32],
}

impl SecretsDeClasse {
    pub fn etiquette(&self) -> &str {
        &self.etiquette
    }

    /// L'identifiant d'une demi-journée de cette classe. Il se calcule des deux côtés,
    /// chez le formateur et chez l'apprenant, sans rien échanger.
    /// Chiffre pour qui a le code, comme la porte de la classe.
    pub fn chiffrer(&self, texte: &[u8]) -> Result<String, Erreur> {
        crate::chiffre::chiffrer(&self.cle, texte)
    }

    pub fn dechiffrer(&self, texte: &str) -> Result<Vec<u8>, Erreur> {
        crate::chiffre::dechiffrer(&self.cle, texte)
    }

    pub fn seance(&self, date: &str, demi: Demi) -> Result<IdSeance, Erreur> {
        let mut mac = <Hmac<Sha256> as KeyInit>::new_from_slice(&self.cle).map_err(|_| Erreur::Encodage)?;
        mac.update(&a_signer("opn-link·seance·v1", &[champ(date)?, demi.texte()])?);
        IdSeance::depuis_octets(&mac.finalize().into_bytes()[..9])
    }
}

/// Un apprenant accepté dans une classe, avec le seul appareil qui signe sa présence.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Membre {
    pub prenom: String,
    pub nom: String,
    pub cle: ClePublique,
    pub boite: ClePublique,
}

/// L'acceptation d'un apprenant par un responsable, signée par lui.
#[derive(Clone, Debug)]
pub struct Acceptation {
    pub membre: Membre,
    pub par: ClePublique,
    pub quand: u64,
    pub signature: Signature,
}

impl Acceptation {
    fn octets(classe: &SecretsDeClasse, membre: &Membre, par: &ClePublique, quand: u64) -> Result<Vec<u8>, Erreur> {
        a_signer(
            "opn-link·acceptation·v1",
            &[
                classe.etiquette(),
                &membre.prenom,
                &membre.nom,
                &membre.cle.texte(),
                &membre.boite.texte(),
                &par.texte(),
                &quand.to_string(),
            ],
        )
    }

    /// Un responsable accepte un apprenant et l'appareil qui a demandé à entrer.
    pub fn signer(classe: &SecretsDeClasse, membre: Membre, responsable: &CleAppareil, quand: u64) -> Result<Self, Erreur> {
        let par = responsable.publique();
        let signature = responsable.signer(&Self::octets(classe, &membre, &par, quand)?);
        Ok(Acceptation { membre, par, quand, signature })
    }

    /// L'acceptation en texte : les champs signés, une ligne chacun, puis la signature.
    pub fn texte(&self, classe: &SecretsDeClasse) -> Result<String, Erreur> {
        let mut texte = String::from_utf8(Self::octets(classe, &self.membre, &self.par, self.quand)?).map_err(|_| Erreur::Encodage)?;
        texte.push('\n');
        texte.push_str(&self.signature.texte());
        Ok(texte)
    }

    /// Relit une acceptation, et vérifie qu'un responsable l'a signée.
    pub fn lire(classe: &SecretsDeClasse, texte: &str, responsables: &[ClePublique]) -> Result<Self, Erreur> {
        let (champs, signature, _) = lire_signe(texte, "opn-link·acceptation·v1")?;
        let [etiquette, prenom, nom, cle, boite, par, quand] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != classe.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let membre = Membre { prenom: prenom.into(), nom: nom.into(), cle: ClePublique::lire(cle)?, boite: ClePublique::lire(boite)? };
        let acceptation =
            Acceptation { membre, par: ClePublique::lire(par)?, quand: quand.parse().map_err(|_| Erreur::Encodage)?, signature };
        acceptation.verifier(classe, responsables)?;
        Ok(acceptation)
    }

    /// Vérifie la signature, et que celui qui a accepté est bien un responsable.
    pub fn verifier(&self, classe: &SecretsDeClasse, responsables: &[ClePublique]) -> Result<&Membre, Erreur> {
        if !responsables.contains(&self.par) {
            return Err(Erreur::PasLeFormateur);
        }
        self.par.verifier(&Self::octets(classe, &self.membre, &self.par, self.quand)?, &self.signature)?;
        Ok(&self.membre)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn un_code_se_lit_comme_il_s_affiche() {
        let code = CodeDeClasse::nouveau().unwrap();
        assert_eq!(code.texte().len(), 15);
        assert_eq!(CodeDeClasse::lire(&code.affiche()).unwrap(), code);
        assert_eq!(CodeDeClasse::lire("RJ4KP 7MX2D W8QHN").unwrap().texte(), "rj4kp7mx2dw8qhn");
        assert_eq!(CodeDeClasse::lire("rj4kp-7mx2d-w8qhn").unwrap().affiche(), "RJ4KP 7MX2D W8QHN");
    }

    #[test]
    fn un_code_mal_tape_est_refuse() {
        assert_eq!(CodeDeClasse::lire("RJ4KP 7MX2D W8QH"), Err(Erreur::CodeDeClasseInvalide));
        assert_eq!(CodeDeClasse::lire("RJ4KP 7MX2D W8QHO"), Err(Erreur::CodeDeClasseInvalide));
        assert_eq!(CodeDeClasse::lire("RJ4KP 7MX2D W8QH1"), Err(Erreur::CodeDeClasseInvalide));
    }

    #[test]
    fn le_meme_code_donne_les_memes_secrets() {
        let a = CodeDeClasse::lire("RJ4KP 7MX2D W8QHN").unwrap().secrets();
        let b = CodeDeClasse::lire("rj4kp7mx2dw8qhn").unwrap().secrets();
        assert_eq!(a.etiquette(), b.etiquette());
        assert!(a.etiquette().starts_with("opl-classe-"));
        let autre = CodeDeClasse::lire("RJ4KP 7MX2D W8QHM").unwrap().secrets();
        assert_ne!(a.etiquette(), autre.etiquette());
    }

    #[test]
    fn une_seance_par_demi_journee_et_par_classe() {
        let a = CodeDeClasse::lire("RJ4KP 7MX2D W8QHN").unwrap().secrets();
        let b = CodeDeClasse::lire("RJ4KP 7MX2D W8QHM").unwrap().secrets();
        let matin = a.seance("2026-11-17", Demi::Matin).unwrap();
        assert_eq!(matin, a.seance("2026-11-17", Demi::Matin).unwrap());
        assert_ne!(matin, a.seance("2026-11-17", Demi::ApresMidi).unwrap());
        assert_ne!(matin, a.seance("2026-11-18", Demi::Matin).unwrap());
        assert_ne!(matin, b.seance("2026-11-17", Demi::Matin).unwrap());
        assert_eq!(matin.texte().len(), 12);
    }

    #[test]
    fn seul_un_responsable_accepte() {
        let classe = CodeDeClasse::nouveau().unwrap().secrets();
        let awa = CleAppareil::nouvelle().unwrap();
        let lea = CleAppareil::nouvelle().unwrap();
        let membre = Membre { prenom: "Léa".into(), nom: "Martin".into(), cle: lea.publique(), boite: lea.boite() };
        let acceptation = Acceptation::signer(&classe, membre.clone(), &awa, 1_763_366_400_000).unwrap();
        assert_eq!(acceptation.verifier(&classe, &[awa.publique()]).unwrap(), &membre);
        assert_eq!(acceptation.verifier(&classe, &[lea.publique()]).unwrap_err(), Erreur::PasLeFormateur);
        let faussaire = Acceptation::signer(&classe, membre, &lea, 1_763_366_400_000).unwrap();
        assert_eq!(faussaire.verifier(&classe, &[awa.publique()]).unwrap_err(), Erreur::PasLeFormateur);
        let mut changee = acceptation.clone();
        changee.membre.nom = "Durand".into();
        assert_eq!(changee.verifier(&classe, &[awa.publique()]).unwrap_err(), Erreur::SignatureInvalide);
    }
}

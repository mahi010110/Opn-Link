//! Les messages privés. Un apprenant écrit à un responsable, un responsable à un apprenant ou à un
//! autre responsable : jamais un apprenant à un autre. Le message part scellé dans la boîte de celui
//! à qui il est écrit, et il est signé par l'appareil qui l'écrit : la boîte d'un responsable est
//! dans la porte, que tout apprenant lit. Comme une annonce, il dit à quelle heure le montrer.

use crate::classe::SecretsDeClasse;
use crate::cles::{CleAppareil, ClePublique, Signature};
use crate::encodage::{a_signer, b64, de_b64, identifiant, lire_signe, texte_ecrit};
use crate::erreur::Erreur;

const FORMAT: &str = "opn-link·message·v1";
const SANS_ANNONCE: &str = "-";

/// Un message privé, signé par celui qui l'écrit.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MessagePrive {
    pub de: ClePublique,
    pub pour: ClePublique,
    pub quand: u64,
    /// L'heure à partir de laquelle le montrer.
    pub arrivee: u64,
    /// L'identifiant de l'annonce de la classe à laquelle il répond.
    pub annonce: Option<String>,
    pub texte: String,
    pub signature: Signature,
}

impl MessagePrive {
    #[allow(clippy::too_many_arguments)]
    fn octets(
        classe: &SecretsDeClasse,
        de: &ClePublique,
        pour: &ClePublique,
        quand: u64,
        arrivee: u64,
        annonce: Option<&str>,
        texte: &str,
    ) -> Result<Vec<u8>, Erreur> {
        if de == pour || quand > arrivee {
            return Err(Erreur::ChampInvalide);
        }
        let annonce = match annonce {
            Some(id) => identifiant(id)?,
            None => SANS_ANNONCE,
        };
        a_signer(
            FORMAT,
            &[
                classe.etiquette(),
                &de.texte(),
                &pour.texte(),
                &quand.to_string(),
                &arrivee.to_string(),
                annonce,
                &b64(texte_ecrit(texte)?.as_bytes()),
            ],
        )
    }

    /// Écrit un message à quelqu'un de la classe, en réponse à une annonce ou non.
    pub fn ecrire(
        classe: &SecretsDeClasse,
        de: &CleAppareil,
        pour: &ClePublique,
        annonce: Option<&str>,
        texte: &str,
        quand: u64,
        arrivee: u64,
    ) -> Result<Self, Erreur> {
        let cle = de.publique();
        let signature = de.signer(&Self::octets(classe, &cle, pour, quand, arrivee, annonce, texte)?);
        Ok(MessagePrive { de: cle, pour: pour.clone(), quand, arrivee, annonce: annonce.map(Into::into), texte: texte.into(), signature })
    }

    pub fn texte(&self, classe: &SecretsDeClasse) -> Result<String, Erreur> {
        let octets = Self::octets(classe, &self.de, &self.pour, self.quand, self.arrivee, self.annonce.as_deref(), &self.texte)?;
        let mut texte = String::from_utf8(octets).map_err(|_| Erreur::Encodage)?;
        texte.push('\n');
        texte.push_str(&self.signature.texte());
        Ok(texte)
    }

    /// Relit un message de cette classe. Il ne compte qu'entre `moi` et l'une des clés données,
    /// dans un sens ou dans l'autre, et signé par celui qui l'a écrit.
    pub fn lire(classe: &SecretsDeClasse, texte: &str, moi: &ClePublique, autres: &[ClePublique]) -> Result<Self, Erreur> {
        let (champs, signature, signe) = lire_signe(texte, FORMAT)?;
        let [etiquette, de, pour, quand, arrivee, annonce, contenu] = champs[..] else {
            return Err(Erreur::Encodage);
        };
        if etiquette != classe.etiquette() {
            return Err(Erreur::AutreSeance);
        }
        let nombre = |t: &str| t.parse::<u64>().map_err(|_| Erreur::Encodage);
        let message = MessagePrive {
            de: ClePublique::lire(de)?,
            pour: ClePublique::lire(pour)?,
            quand: nombre(quand)?,
            arrivee: nombre(arrivee)?,
            annonce: if annonce == SANS_ANNONCE { None } else { Some(identifiant(annonce)?.into()) },
            texte: String::from_utf8(de_b64(contenu)?).map_err(|_| Erreur::Encodage)?,
            signature,
        };
        let entre_nous = (&message.pour == moi && autres.contains(&message.de)) || (&message.de == moi && autres.contains(&message.pour));
        if !entre_nous {
            return Err(Erreur::MembreInconnu);
        }
        message.de.verifier(signe.as_bytes(), &message.signature)?;
        Ok(message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::classe::CodeDeClasse;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    const TEXTE: &str = "Bonsoir, mon train de demain est supprimé.\nJ’arriverai vers 9 h 30.";
    const ANNONCE: &str = "QkJCQkJCQkJCQkJCQkJCQg";

    fn cles() -> (SecretsDeClasse, CleAppareil, CleAppareil, CleAppareil) {
        (
            CodeDeClasse::nouveau().unwrap().secrets(),
            CleAppareil::nouvelle().unwrap(),
            CleAppareil::nouvelle().unwrap(),
            CleAppareil::nouvelle().unwrap(),
        )
    }

    #[test]
    fn un_message_se_relit_chez_les_deux() {
        let (classe, awa, lea, _) = cles();
        let texte = MessagePrive::ecrire(&classe, &lea, &awa.publique(), Some(ANNONCE), TEXTE, 5, 9).unwrap().texte(&classe).unwrap();
        let chez_awa = MessagePrive::lire(&classe, &texte, &awa.publique(), &[lea.publique()]).unwrap();
        assert_eq!((chez_awa.de, chez_awa.pour, chez_awa.quand, chez_awa.arrivee), (lea.publique(), awa.publique(), 5, 9));
        assert_eq!((chez_awa.annonce.as_deref(), chez_awa.texte.as_str()), (Some(ANNONCE), TEXTE));
        let chez_lea = MessagePrive::lire(&classe, &texte, &lea.publique(), &[awa.publique()]).unwrap();
        assert_eq!(chez_lea.texte, TEXTE);
        let sans_annonce = MessagePrive::ecrire(&classe, &awa, &lea.publique(), None, "Bien reçu.", 6, 6).unwrap().texte(&classe).unwrap();
        assert_eq!(MessagePrive::lire(&classe, &sans_annonce, &lea.publique(), &[awa.publique()]).unwrap().annonce, None);
    }

    #[test]
    fn un_message_ne_compte_qu_entre_ceux_qu_il_nomme() {
        let (classe, awa, lea, yanis) = cles();
        let de_lea = MessagePrive::ecrire(&classe, &lea, &awa.publique(), None, TEXTE, 5, 5).unwrap().texte(&classe).unwrap();
        assert_eq!(MessagePrive::lire(&classe, &de_lea, &yanis.publique(), &[lea.publique(), awa.publique()]), Err(Erreur::MembreInconnu));
        assert_eq!(MessagePrive::lire(&classe, &de_lea, &awa.publique(), &[yanis.publique()]), Err(Erreur::MembreInconnu));
        let au_nom_de_lea = de_lea.replace(&lea.publique().texte(), &yanis.publique().texte());
        assert_eq!(
            MessagePrive::lire(&classe, &au_nom_de_lea, &awa.publique(), &[lea.publique(), yanis.publique()]),
            Err(Erreur::SignatureInvalide)
        );
        let change = de_lea.replace(&b64(TEXTE.as_bytes()), &b64("Je ne viendrai pas.".as_bytes()));
        assert_eq!(MessagePrive::lire(&classe, &change, &awa.publique(), &[lea.publique()]), Err(Erreur::SignatureInvalide));
        let autre_classe = CodeDeClasse::nouveau().unwrap().secrets();
        assert_eq!(MessagePrive::lire(&autre_classe, &de_lea, &awa.publique(), &[lea.publique()]), Err(Erreur::AutreSeance));
    }

    #[test]
    fn un_message_vide_trop_long_a_soi_ou_qui_arrive_avant_d_etre_ecrit_ne_se_signe_pas() {
        let (classe, awa, lea, _) = cles();
        let pour = awa.publique();
        assert_eq!(MessagePrive::ecrire(&classe, &lea, &pour, None, " \n ", 5, 5), Err(Erreur::ChampInvalide));
        assert_eq!(MessagePrive::ecrire(&classe, &lea, &pour, None, &"é".repeat(crate::TEXTE_AU_PLUS), 5, 5), Err(Erreur::ChampInvalide));
        assert_eq!(MessagePrive::ecrire(&classe, &lea, &pour, None, TEXTE, 5, 4), Err(Erreur::ChampInvalide));
        assert_eq!(MessagePrive::ecrire(&classe, &lea, &lea.publique(), None, TEXTE, 5, 5), Err(Erreur::ChampInvalide));
        assert_eq!(MessagePrive::ecrire(&classe, &lea, &pour, Some("court"), TEXTE, 5, 5), Err(Erreur::ChampInvalide));
    }
}

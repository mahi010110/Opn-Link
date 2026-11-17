/// Ce qui peut refuser une opération. L'écran traduit le code en une phrase :
/// une erreur technique ne s'affiche jamais telle quelle.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Erreur {
    Hasard,
    Encodage,
    ChampInvalide,
    CleInvalide,
    SignatureInvalide,
    CodeDeClasseInvalide,
    LettreIllisible,
    QrInconnu,
    AutreSeance,
    AppareilNonAccepte,
    CodeInconnu,
    CodePerime,
    AppelClos,
    AppelOuvert,
    PasLeFormateur,
    MembreInconnu,
    ClotureDefinitive,
    JournalAbime,
    PorteInconnue,
    PorteAmbigue,
}

impl Erreur {
    /// Le nom stable de l'erreur, que l'écran traduit.
    pub fn code(self) -> &'static str {
        match self {
            Erreur::Hasard => "hasard",
            Erreur::Encodage => "encodage",
            Erreur::ChampInvalide => "champ-invalide",
            Erreur::CleInvalide => "cle-invalide",
            Erreur::SignatureInvalide => "signature-invalide",
            Erreur::CodeDeClasseInvalide => "code-de-classe-invalide",
            Erreur::LettreIllisible => "lettre-illisible",
            Erreur::QrInconnu => "qr-inconnu",
            Erreur::AutreSeance => "autre-seance",
            Erreur::AppareilNonAccepte => "appareil-non-accepte",
            Erreur::CodeInconnu => "code-inconnu",
            Erreur::CodePerime => "code-perime",
            Erreur::AppelClos => "appel-clos",
            Erreur::AppelOuvert => "appel-ouvert",
            Erreur::PasLeFormateur => "pas-le-formateur",
            Erreur::MembreInconnu => "membre-inconnu",
            Erreur::ClotureDefinitive => "cloture-definitive",
            Erreur::JournalAbime => "journal-abime",
            Erreur::PorteInconnue => "porte-inconnue",
            Erreur::PorteAmbigue => "porte-ambigue",
        }
    }
}

impl core::fmt::Display for Erreur {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.write_str(self.code())
    }
}

impl std::error::Error for Erreur {}

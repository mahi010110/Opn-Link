use crate::erreur::Erreur;

pub(crate) fn octets<const N: usize>() -> Result<[u8; N], Erreur> {
    let mut sortie = [0u8; N];
    getrandom::fill(&mut sortie).map_err(|_| Erreur::Hasard)?;
    Ok(sortie)
}

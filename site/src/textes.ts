// Les erreurs du cœur, dites avec des mots. Un code technique ne s'affiche jamais.

export function phrase(code: string, formateur = 'ton formateur'): string {
  switch (code) {
    case 'code-perime':
      return 'Ce code a changé. Regarde l’écran de la salle et retape les 6 chiffres.';
    case 'code-inconnu':
      return 'Ce code ne correspond pas. Regarde l’écran de la salle et retape les 6 chiffres.';
    case 'appel-clos':
      return `L’appel est clos. Parle à ${formateur}.`;
    case 'appareil-non-accepte':
      return `Ce téléphone ne signe pas ta présence. Parle à ${formateur}.`;
    case 'autre-seance':
      return 'Ce code est celui d’un autre appel. Regarde l’écran de ta salle.';
    case 'qr-inconnu':
      return 'Ce QR n’est pas celui d’une présence.';
    case 'code-de-classe-invalide':
    case 'porte-inconnue':
      return 'Aucune classe n’a ce code. Compare-le à celui de l’écran, bloc par bloc.';
    case 'porte-ambigue':
      return 'Ce code mène à deux classes. Demande à ton formateur le lien de la classe.';
    case 'champ-invalide':
      return 'Écris-le en toutes lettres.';
    case 'sans-reseau':
      return 'Pas de réseau. Je cherche la classe dès qu’il revient.';
    default:
      return `Ça n’a pas marché. Réessaie, ou montre ton écran à ${formateur}.`;
  }
}

export const codeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

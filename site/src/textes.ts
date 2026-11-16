// Les erreurs du cœur, dites avec des mots. Un code technique ne s'affiche jamais.

export function phrase(code: string, formateur: string): string {
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
    default:
      return `Ça n’a pas marché. Réessaie, ou montre ton écran à ${formateur}.`;
  }
}

export const codeDe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

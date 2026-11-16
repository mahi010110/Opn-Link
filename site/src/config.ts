// La configuration d'un appareil du prototype. Les vrais écrans de « Rejoindre » et de
// « Créer une classe » viendront après : ici, les tests et la démonstration la posent.
// Les clés de stockage commencent par opl_proto_ : elles disparaîtront avec le prototype.

export interface Personne {
  prenom: string;
  nom: string;
  cle: string;
  boite: string;
}

export interface Config {
  role: 'apprenant' | 'formateur' | 'salle';
  secrets: string;
  moi: { prenom: string; nom: string };
  classe: { code: string; nom: string; centre: string; matin: string; apresMidi: string };
  formateur: Personne;
  inscrits: Personne[];
  relais: string;
}

export const appareil = new URLSearchParams(location.search).get('appareil') ?? 'moi';
const cle = (nom: string) => `opl_proto_${appareil}_${nom}`;

export function lire<T>(nom: string): T | undefined {
  try {
    const t = localStorage.getItem(cle(nom));
    return t ? (JSON.parse(t) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function ecrire(nom: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle(nom), JSON.stringify(valeur));
  } catch {
    // Sans stockage, l'appareil marche le temps de la page.
  }
}

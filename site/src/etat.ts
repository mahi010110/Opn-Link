// Ce que l'appareil garde. Les clés de stockage commencent par opl_proto_ : elles disparaîtront
// avec le prototype, et le contrat écrira les vraies.

import type { Appareil, Coeur } from './coeur';
import type { Creneau } from './creneaux';

export interface Moi {
  prenom: string;
  nom: string;
}

/// L'apprenant : une présence qu'il a signée, et sa réception.
export interface PresenceGardee extends Creneau {
  seance: string;
  presence: string;
  signee: number;
  recu?: { quand: number; par: string };
}

/// L'apprenant : l'annonce de l'appel d'une séance, déjà vérifiée. La plus récente compte.
export interface AnnonceGardee extends Creneau {
  seance: string;
  etat: string;
  quand: number;
  par: string;
}

/// Le formateur : l'appel qu'il tient, son journal et son secret.
export interface AppelGarde {
  journal: string;
  secret?: string;
}

/// Un téléphone suit dix classes au plus (docs/questions-ouvertes.md, « À fixer au prototype »).
export const CLASSES_AU_PLUS = 10;

export interface ClasseGardee {
  code: string;
  /// Les secrets tirés du code, gardés par le cœur (opn-link·secrets·v1) : les tirer prend 140 ms.
  secrets?: string;
  /// « chef » ou « adjoint » chez un responsable : la porte et ses passations disent qui est chef.
  role: 'chef' | 'adjoint' | 'apprenant';
  porte: string;
  fil?: string;
  /// L'apprenant : son acceptation, une fois admis, ou sa demande, tant qu'il attend.
  acceptation?: string;
  demande?: string;
  /// Le chef : les acceptations, les demandes en attente, et les clés de ceux qu'il a laissés dehors.
  membres?: string[];
  demandes?: string[];
  dehors?: string[];
  portePubliee?: number;
  /// Le chef : les demi-journées où l'appel a été clos, huit semaines au plus, et le prochain cours
  /// annoncé à la classe.
  cours?: string[];
  /// Chez l'apprenant, le dernier prochain cours reçu, et qui l'a signé.
  prochain?: { date: string; demi: string; quand: number; par?: string };
  /// Le prochain cours qui attend la fin du délai pour annuler, avant de partir à la classe.
  prochainEnAttente?: { date: string; demi: string; part: number };
  /// Les passations du chef, qui voyagent avec la porte.
  passations?: string[];
  /// Le chef : les invitations d'adjoint qu'il a données, sept jours au plus, et ceux qui y ont
  /// répondu en demandant à être adjoint.
  invitations?: { jeton: string; role: string; quand: number }[];
  candidats?: { demande: string; role: string; jeton: string }[];
  /// Le chef qui passe la main : à qui, et quand la passation part, après le délai pour annuler.
  passationEnAttente?: { vers: string; part: number };
  /// Le chef qui change les horaires : les nouveaux, et quand la porte qui les porte part.
  horairesEnAttente?: { matin: string; apresMidi: string; part: number };
  /// L'apprenant : son dernier nom corrigé, signé. Chez chacun, le nom corrigé qui attend la fin
  /// du délai pour annuler.
  nom?: string;
  nomEnAttente?: { prenom: string; nom: string; part: number };
  /// Les noms corrigés, le plus récent de chacun : ceux des responsables chez tout le monde, et
  /// ceux des membres chez les responsables.
  noms?: string[];
  /// L'apprenant : ses présences, huit semaines, et les annonces de l'appel, sept jours.
  presences?: PresenceGardee[];
  annoncesAppel?: AnnonceGardee[];
  /// Chez chacun, les annonces à la classe, signées : la dernière version de chacune, jusqu'à son
  /// retrait, et son retrait jusqu'à la fermeture de la classe.
  annoncesDeLaClasse?: string[];
  /// Le responsable : l'annonce qui part dans trente secondes, une nouvelle version ou un retrait,
  /// le temps d'annuler. Sans texte, c'est un retrait ; sans création, une annonce neuve.
  annonceEnAttente?: { id: string; auteur: string; creee?: number; texte?: string; part: number };
}

export const estResponsable = (c: ClasseGardee): boolean => c.role === 'chef' || c.role === 'adjoint';

const parametres = new URLSearchParams(location.search);
export const appareil = parametres.get('appareil') ?? 'moi';
export const ecran = parametres.get('ecran');
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
    if (valeur === undefined || valeur === null) localStorage.removeItem(cle(nom));
    else localStorage.setItem(cle(nom), JSON.stringify(valeur));
  } catch {
    // Sans stockage, l'appareil marche le temps de la page.
  }
}

/// Les clés de cet appareil, tirées la première fois.
export function clesDeLAppareil(coeur: Coeur): Appareil {
  const gardees = lire<string>('cles');
  if (gardees) return coeur.Appareil.relire(gardees);
  const neuves = new coeur.Appareil();
  ecrire('cles', neuves.secrets());
  return neuves;
}

export const classes = (): ClasseGardee[] => lire<ClasseGardee[]>('classes') ?? [];

/// Garde une classe à sa place dans la liste, ou à la fin si elle est neuve.
export function garderClasse(classe: ClasseGardee): void {
  const liste = classes();
  const ici = liste.findIndex((c) => c.code === classe.code);
  if (ici < 0) liste.push(classe);
  else liste[ici] = classe;
  ecrire('classes', liste);
}

/// Oublie une classe, et ce qui partait avec elle : son appel, et la dernière classe montrée.
export function oublierClasse(code: string): void {
  ecrire('classes', classes().filter((c) => c.code !== code));
  if (appelGarde(code)) garderAppel(code, undefined);
  if (lire<string>('derniere-classe') === code) ecrire('derniere-classe', null);
}

// Les relais par défaut, mesurés le 15 novembre 2026 (docs/architecture.md). Les tests donnent les leurs.
const RELAIS_PAR_DEFAUT = {
  principaux: ['wss://nostr.sathoarder.com', 'wss://nos.lol'],
  secours: ['wss://nostr-relay.corb.net', 'wss://nostr-01.yakihonne.com'],
};
export const listeDesRelais = (): { principaux: string[]; secours: string[] } => lire('relais') ?? RELAIS_PAR_DEFAUT;

/// Le thème choisi dans « Moi », ou rien pour suivre le téléphone.
export type Theme = 'clair' | 'sombre' | undefined;
const sombre = matchMedia('(prefers-color-scheme: dark)');
export function appliquerLeTheme(): void {
  const choix = lire<Theme>('theme');
  const fonce = choix === 'sombre' || (choix !== 'clair' && sombre.matches);
  document.documentElement.dataset.theme = fonce ? 'dark' : 'light';
}
sombre.addEventListener('change', appliquerLeTheme);

/// L'appel que tient ce téléphone dans une classe.
export const appelGarde = (code: string): AppelGarde | undefined => lire<Record<string, AppelGarde>>('appels')?.[code];
export function garderAppel(code: string, appel: AppelGarde | undefined): void {
  const appels = { ...lire<Record<string, AppelGarde>>('appels') };
  if (appel) appels[code] = appel;
  else delete appels[code];
  ecrire('appels', appels);
}

/// Avant le 24 novembre 2026, le téléphone ne suivait qu'une classe : l'appel du formateur, et les
/// présences, les annonces et le prochain cours de l'apprenant, étaient gardés à part. Ils
/// rejoignent leur classe, sans rien perdre.
export function rangerParClasse(): void {
  const liste = classes();
  const appel = lire<AppelGarde>('appel');
  const responsable = liste.find(estResponsable);
  if (appel && responsable && !appelGarde(responsable.code)) garderAppel(responsable.code, appel);
  const apprenant = liste.find((c) => c.role === 'apprenant');
  const anciennes = { presences: lire<PresenceGardee[]>('presences'), annoncesAppel: lire<AnnonceGardee[]>('annonces-appel'), prochain: lire<ClasseGardee['prochain']>('prochain') };
  if (apprenant && Object.values(anciennes).some(Boolean)) garderClasse({ ...anciennes, ...apprenant });
  for (const ancienne of ['appel', 'presence', 'presences', 'annonces-appel', 'prochain']) ecrire(ancienne, null);
}

// Ce qui passe entre les appareils : les lettres scellées dans la boîte du destinataire,
// et la porte de la classe, chiffrée par son code.

import type { Appareil, Coeur } from './coeur';
import type { ClasseGardee } from './etat';
import type { Relais } from './relais';

export type Lettre =
  | { v: 1; t: 'entree'; code: string; demande: string }
  | { v: 1; t: 'admis'; code: string; porte: string; fil: string; acceptation: string }
  | { v: 1; t: 'classe'; classe: ClasseGardee }
  | { v: 1; t: 'montrer'; code: string; quoi: 'rejoindre' | 'rien' }
  | { v: 1; t: 'appel'; code?: string; journal: string; secret: string }
  | { v: 1; t: 'presence'; presence: string }
  | { v: 1; t: 'recu'; seance: string; quand: number; par: string }
  | { v: 1; t: 'refus'; seance: string; raison: string }
  | { v: 1; t: 'compte'; seance: string; presents: number; inscrits: number }
  | { v: 1; t: 'clos'; seance: string; presents: number; absents: number; quand: number }
  | { v: 1; t: 'reouvert'; seance: string }
  | { v: 1; t: 'adjoint'; code: string; demande: string; jeton: string }
  | { v: 1; t: 'nom'; code: string; correction: string }
  | { v: 1; t: 'responsables'; code: string; porte: string; passations: string[]; lettre: string }
  | { v: 1; t: 'message'; code: string; message: string };

const UN_JOUR = 24 * 3600;
const SEPT_JOURS = 7 * UN_JOUR;
// Le prochain cours peut être à plusieurs semaines, en alternance : le fil se relit sur huit.
const HUIT_SEMAINES = 56 * UN_JOUR;
const TRENTE_JOURS = 30 * 24 * 3600;
const secondes = () => Math.floor(Date.now() / 1000);

/// Scelle une lettre pour une boîte et la confie aux relais, qui la gardent sept jours, ou jusqu'à
/// l'heure donnée, en secondes.
export function envoyer(coeur: Coeur, relais: Relais, boite: string, lettre: Lettre, jusqua = secondes() + SEPT_JOURS): void {
  const maintenant = secondes();
  const scellee = coeur.sceller(boite, JSON.stringify(lettre));
  relais.publier(coeur.evenement_nostr(coeur.etiquette_de_boite(boite), jusqua, scellee, maintenant));
}

/// Un message privé reste trente jours après son arrivée sur les relais : un apprenant en
/// entreprise trois semaines le reçoit encore à son retour.
export function envoyerUnMessage(coeur: Coeur, relais: Relais, boite: string, code: string, message: string, arrivee: number): void {
  envoyer(coeur, relais, boite, { v: 1, t: 'message', code, message }, Math.max(Math.floor(arrivee / 1000), secondes()) + TRENTE_JOURS);
}

// Un seul abonnement par sorte, pour toutes les classes de l'appareil : la boîte, les fils, les
// portes. Les relais en acceptent de 20 à 200 par connexion (docs/questions-ouvertes.md), et un
// appareil suit jusqu'à dix classes. Chaque classe s'y inscrit, et chacune ne garde que ce qui est pour elle.
const lecteursDeLettres = new Set<(l: Lettre) => void>();
let boiteEcoutee = false;

/// Les lettres de la boîte de cet appareil, celles du mois : un message privé reste trente jours
/// sur les relais, les autres lettres sept. Rend de quoi arrêter de les lire.
export function recevoir(coeur: Coeur, relais: Relais, appareil: Appareil, rappel: (l: Lettre) => void): () => void {
  lecteursDeLettres.add(rappel);
  if (!boiteEcoutee) {
    boiteEcoutee = true;
    relais.ecouter('boite', { kinds: [8571], '#x': [coeur.etiquette_de_boite(appareil.boite())], since: secondes() - TRENTE_JOURS }, (e) => {
      let lettre: Lettre;
      try {
        lettre = JSON.parse(appareil.ouvrir(e.content));
      } catch {
        return; // Une lettre qui ne s'ouvre pas n'était pas pour nous.
      }
      if (lettre?.v === 1) for (const lecteur of [...lecteursDeLettres]) lecteur(lettre);
    });
  }
  return () => lecteursDeLettres.delete(rappel);
}

const etiquetteDe = (e: { tags?: string[][] }) => e.tags?.find((t) => t[0] === 'x')?.[1] ?? '';

/// Un abonnement qui suit plusieurs étiquettes. Les inscriptions d'un même instant partent en une
/// seule demande aux relais, qui remplace la précédente.
function abonnementPartage(relais: Relais, id: string, depuis: number) {
  const inscrits = new Map<string, (contenu: string) => void>();
  let prevu = false;
  const demander = () => {
    prevu = false;
    relais.ecouter(id, { kinds: [8571], '#x': [...inscrits.keys()], since: secondes() - depuis }, (e) => inscrits.get(etiquetteDe(e))?.(e.content));
  };
  return (etiquette: string, rappel: (contenu: string) => void): (() => void) => {
    inscrits.set(etiquette, rappel);
    if (!prevu) {
      prevu = true;
      queueMicrotask(demander);
    }
    return () => {
      if (inscrits.get(etiquette) === rappel) inscrits.delete(etiquette);
    };
  };
}
let fils: ReturnType<typeof abonnementPartage> | undefined;
let portes: ReturnType<typeof abonnementPartage> | undefined;

/// Un responsable dit à la classe, sur le fil, que l'appel est ouvert ou clos. L'annonce ne sert
/// que le jour même : les relais la gardent un jour.
export function annoncerLAppel(coeur: Coeur, relais: Relais, fil: string, annonce: string): void {
  const maintenant = secondes();
  relais.publier(coeur.evenement_nostr(coeur.etiquette_du_fil(fil), maintenant + UN_JOUR, coeur.chiffrer_pour_le_fil(fil, annonce), maintenant));
}

/// Un responsable dit le prochain cours. Les relais le gardent jusqu'au lendemain de ce cours.
export function annoncerLeProchain(coeur: Coeur, relais: Relais, fil: string, prochain: string, date: string): void {
  const maintenant = secondes();
  const [a, m, j] = date.split('-').map(Number);
  const lendemain = Math.floor(new Date(a, m - 1, j + 2).getTime() / 1000);
  relais.publier(coeur.evenement_nostr(coeur.etiquette_du_fil(fil), Math.max(lendemain, maintenant + UN_JOUR), coeur.chiffrer_pour_le_fil(fil, prochain), maintenant));
}

/// Un responsable publie une annonce à la classe, ou une nouvelle version, sur le fil. Les relais
/// la gardent trente jours après son arrivée, ou après sa republication.
export function publierSurLeFil(coeur: Coeur, relais: Relais, fil: string, annonce: string, arrivee: number): void {
  const maintenant = secondes();
  const expiration = Math.max(Math.floor(arrivee / 1000), maintenant) + TRENTE_JOURS;
  relais.publier(coeur.evenement_nostr(coeur.etiquette_du_fil(fil), expiration, coeur.chiffrer_pour_le_fil(fil, annonce), maintenant));
}

/// Ce qui arrive sur le fil de la classe, déchiffré. Celui qui le lit vérifie qui l'a signé.
/// Rend de quoi arrêter d'écouter.
export function ecouterLeFil(coeur: Coeur, relais: Relais, fil: string, rappel: (texte: string) => void): () => void {
  fils ??= abonnementPartage(relais, 'fils', HUIT_SEMAINES);
  return fils(coeur.etiquette_du_fil(fil), (contenu) => {
    try {
      rappel(coeur.dechiffrer_du_fil(fil, contenu));
    } catch {
      // Ce qui ne se déchiffre pas n'est pas de ce fil.
    }
  });
}

/// Ce qui arrive sous l'étiquette de la classe : la porte, les passations de ses chefs, et les
/// noms corrigés de ses responsables.
/// Rend de quoi arrêter d'écouter.
export function ecouterLaPorte(coeur: Coeur, relais: Relais, code: string, rappel: (texte: string) => void): () => void {
  portes ??= abonnementPartage(relais, 'portes', TRENTE_JOURS);
  return portes(coeur.etiquette_de_classe(code), (contenu) => {
    try {
      rappel(coeur.dechiffrer_pour_la_classe(code, contenu));
    } catch {
      // Ce qui ne se déchiffre pas n'est pas de cette classe.
    }
  });
}

/// Un responsable publie la porte de la classe, une passation ou son nom corrigé, sous l'étiquette
/// du code. Les relais les gardent trente jours.
export function publierPorte(coeur: Coeur, relais: Relais, code: string, porte: string): void {
  const maintenant = secondes();
  const chiffree = coeur.chiffrer_pour_la_classe(code, porte);
  relais.publier(coeur.evenement_nostr(coeur.etiquette_de_classe(code), maintenant + TRENTE_JOURS, chiffree, maintenant));
}

/// Cherche la porte d'une classe sur les relais. Rend la porte, avec tout ce qui voyage sous son
/// étiquette, déchiffré. Rend le code d'erreur du cœur si rien ne va.
export async function chercherPorte(coeur: Coeur, relais: Relais, code: string, chef?: string): Promise<{ porte: ReturnType<Coeur['choisir_porte']>; textes: string[] }> {
  const evenements = await relais.chercher({ kinds: [8571], '#x': [coeur.etiquette_de_classe(code)] });
  const textes: string[] = [];
  // Les passations voyagent avec la porte : le cœur les suit depuis le chef du lien.
  for (const e of evenements) {
    try {
      textes.push(coeur.dechiffrer_pour_la_classe(code, e.content));
    } catch {
      // Ce qui ne se déchiffre pas n'est pas une porte de cette classe.
    }
  }
  return { porte: coeur.choisir_porte(code, textes, chef), textes };
}

/// Le code d'une classe sous la seule forme qu'on garde et qu'on compare : en minuscules, sans espaces.
export const codeNormal = (code: string): string => code.replace(/[\s-]/g, '').toLowerCase();

/// Le lien du QR de la classe : le code, et la clé du chef, qui seule signe la vraie porte.
/// Il passe après #, que le navigateur n'envoie jamais au serveur du site.
export function lienDeLaClasse(coeur: Coeur, code: string, cleDuChef: string): string {
  return `${location.origin}${location.pathname}#r=${codeNormal(code)}.${coeur.cle_courte(cleDuChef)}`;
}

export function lireLien(hash: string): { code: string; chef: string } | undefined {
  const m = /^#r=([a-z0-9]{15})\.([A-Za-z0-9_-]{44})$/.exec(hash);
  return m ? { code: m[1], chef: m[2] } : undefined;
}

/// L'invitation d'un adjoint : le lien de la classe, un jeton que le chef a tiré pour elle, et le
/// rôle proposé, f pour formateur ou c pour centre. Sans un jeton qu'il a donné, le chef ne voit
/// pas la demande.
export function lienDAdjoint(coeur: Coeur, code: string, cleDuChef: string, jeton: string, role: string): string {
  return `${location.origin}${location.pathname}#a=${codeNormal(code)}.${coeur.cle_courte(cleDuChef)}.${jeton}.${role === 'centre' ? 'c' : 'f'}`;
}

export function lireLienDAdjoint(hash: string): { code: string; chef: string; jeton: string; role: 'formateur' | 'centre' } | undefined {
  const m = /^#a=([a-z0-9]{15})\.([A-Za-z0-9_-]{44})\.([A-Za-z0-9_-]{22})\.([fc])$/.exec(hash);
  return m ? { code: m[1], chef: m[2], jeton: m[3], role: m[4] === 'c' ? 'centre' : 'formateur' } : undefined;
}

/// Un jeton tiré au hasard, 16 octets en base64url.
export function nouveauJeton(): string {
  const octets = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

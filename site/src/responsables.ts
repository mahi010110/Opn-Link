// Ce que les responsables d'une classe partagent : la porte et ses passations, le secret du fil,
// les membres, les demandes, les cours et le prochain cours. Ils se l'écrivent par une lettre
// signée, que chacun vérifie avec la porte qu'il connaît, puis fusionne avec ce qu'il sait.
// Une fusion ne retire rien : les listes s'unissent, et le prochain cours le plus récent gagne.

import type { Contexte } from './contexte';
import type { ClasseGardee } from './etat';
import { envoyer } from './lettres';

export interface EtatPartage {
  porte: string;
  passations: string[];
  fil?: string;
  membres: string[];
  demandes: string[];
  dehors: string[];
  cours: string[];
  prochain?: { date: string; demi: string; quand: number };
  noms?: string[];
}

export interface LettreDeResponsable {
  porte: string;
  passations: string[];
  lettre: string;
}

const union = (...listes: (string[] | undefined)[]): string[] => [...new Set(listes.flatMap((l) => l ?? []))].sort();

export const partage = (c: ClasseGardee): EtatPartage => ({
  porte: c.porte,
  passations: union(c.passations),
  fil: c.fil,
  membres: union(c.membres),
  demandes: union(c.demandes),
  dehors: union(c.dehors),
  cours: union(c.cours),
  prochain: c.prochain,
  noms: union(c.noms),
});

// La même forme des deux côtés, pour comparer ce qu'on sait à ce qu'on a reçu.
const canon = (e: EtatPartage): string =>
  JSON.stringify([e.porte, union(e.passations), e.fil, union(e.membres), union(e.demandes), union(e.dehors), union(e.cours), e.prochain, union(e.noms)]);

/// Les noms corrigés, vérifiés : la correction la plus récente de chaque personne.
export function nomsAJour(ctx: Contexte, code: string, textes: string[]): string[] {
  const parCle = new Map<string, { texte: string; quand: number }>();
  for (const texte of new Set(textes)) {
    try {
      const c = ctx.coeur.lire_correction_de_nom(code, texte);
      const avant = parCle.get(c.cle);
      if (!avant || c.quand > avant.quand) parCle.set(c.cle, { texte, quand: c.quand });
    } catch {
      // Une correction que la personne n'a pas signée ne compte pas.
    }
  }
  return [...parCle.values()].map((c) => c.texte).sort();
}

/// Le nom d'une personne, corrigé si elle l'a fait, parmi des corrections déjà vérifiées.
export function nomCorrige(ctx: Contexte, code: string, noms: string[] | undefined, p: { cle: string; prenom: string; nom: string }): { prenom: string; nom: string } {
  for (const texte of noms ?? []) {
    try {
      const c = ctx.coeur.lire_correction_de_nom(code, texte);
      if (c.cle === p.cle) return { prenom: c.prenom, nom: c.nom };
    } catch {
      // Une correction illisible ne change pas le nom.
    }
  }
  return { prenom: p.prenom, nom: p.nom };
}

/// Les noms corrigés des responsables de la porte, parmi des textes venus d'ailleurs. Ceux-là
/// voyagent avec la porte, que toute la classe lit : jamais ceux des apprenants.
export function nomsDesResponsables(ctx: Contexte, code: string, porte: string, textes: string[]): string[] {
  const cles = ctx.coeur.lire_porte(code, porte).responsables.map((r) => r.cle);
  return textes.filter((texte) => {
    try {
      return cles.includes(ctx.coeur.lire_correction_de_nom(code, texte).cle);
    } catch {
      return false;
    }
  });
}

/// Les passations valables de cette classe, parmi des textes venus d'ailleurs.
export const passationsDe = (ctx: Contexte, code: string, textes: string[]): string[] =>
  textes.filter((t) => {
    try {
      ctx.coeur.lire_passation(code, t);
      return true;
    } catch {
      return false;
    }
  });

/// La porte à jour : on suit les passations depuis le chef de la porte qu'on a, et on prend la
/// porte du chef actuel parmi celles qu'on connaît.
export function porteAJour(ctx: Contexte, code: string, porte: string, textes: string[]): string {
  const chef = ctx.coeur.lire_porte(code, porte).responsables[0].cle;
  try {
    return ctx.coeur.choisir_porte(code, [porte, ...textes], chef).texte;
  } catch {
    return porte;
  }
}

/// Le chef actuel, en suivant les passations connues depuis le chef de la porte.
export const chefActuel = (ctx: Contexte, classe: ClasseGardee): string =>
  ctx.coeur.chef_actuel(classe.code, classe.passations ?? [], ctx.coeur.lire_porte(classe.code, classe.porte).responsables[0].cle);

/// Écrit l'état partagé aux autres responsables, chacun dans sa boîte. La porte et les passations
/// voyagent aussi à côté de la lettre : celui qui la reçoit met d'abord sa porte à jour, pour
/// reconnaître la signature d'un responsable qu'il ne connaissait pas encore.
export function ecrireAuxResponsables(ctx: Contexte, classe: ClasseGardee): void {
  const { coeur, relais, moi } = ctx;
  const contenu = JSON.stringify({ v: 1, t: 'classe', etat: partage(classe) });
  const lettre = moi.ecrire_aux_responsables(classe.code, contenu, Date.now());
  for (const r of coeur.lire_porte(classe.code, classe.porte).responsables) {
    if (r.cle === moi.cle()) continue;
    envoyer(coeur, relais, r.boite, { v: 1, t: 'responsables', code: classe.code, porte: classe.porte, passations: classe.passations ?? [], lettre });
  }
}

/// Relit la lettre d'un autre responsable et la fusionne avec ce qu'on sait. Rend la classe fusionnée,
/// ou rien si la lettre n'est pas signée par un responsable de la porte à jour.
export function fusionner(ctx: Contexte, classe: ClasseGardee, l: LettreDeResponsable): { classe: ClasseGardee; recu: EtatPartage } | undefined {
  const { coeur } = ctx;
  const connues = union(classe.passations, passationsDe(ctx, classe.code, l.passations));
  let recu: EtatPartage;
  let porte: string;
  try {
    porte = porteAJour(ctx, classe.code, classe.porte, [l.porte, ...connues]);
    const cles = coeur.lire_porte(classe.code, porte).responsables.map((r) => r.cle);
    const contenu = JSON.parse(coeur.lire_entre_responsables(classe.code, l.lettre, cles).contenu);
    if (contenu?.v !== 1 || contenu.t !== 'classe') return undefined;
    recu = contenu.etat;
  } catch {
    return undefined;
  }
  const passations = union(connues, passationsDe(ctx, classe.code, recu.passations ?? []));
  porte = porteAJour(ctx, classe.code, porte, [recu.porte, ...passations]);
  const cles = coeur.lire_porte(classe.code, porte).responsables.map((r) => r.cle);

  // Deux responsables peuvent accepter le même apprenant : la première acceptation compte.
  const parApprenant = new Map<string, { texte: string; quand: number }>();
  for (const texte of union(classe.membres, recu.membres)) {
    try {
      const m = coeur.lire_acceptation(classe.code, texte, cles);
      const avant = parApprenant.get(m.cle);
      if (!avant || m.quand < avant.quand) parApprenant.set(m.cle, { texte, quand: m.quand });
    } catch {
      // Une acceptation qu'aucun responsable n'a signée ne compte pas.
    }
  }
  const dehors = union(classe.dehors, recu.dehors);
  const vues = new Set<string>();
  const demandes = union(classe.demandes, recu.demandes).filter((texte) => {
    try {
      const d = coeur.lire_demande(classe.code, texte);
      if (parApprenant.has(d.cle) || dehors.includes(d.cle) || vues.has(d.cle)) return false;
      vues.add(d.cle);
      return true;
    } catch {
      return false;
    }
  });
  const prochain = [classe.prochain, recu.prochain].filter((p) => p !== undefined).sort((a, b) => b!.quand - a!.quand)[0];
  return {
    classe: {
      ...classe,
      porte,
      passations,
      fil: classe.fil ?? recu.fil,
      membres: [...parApprenant.values()].map((m) => m.texte).sort(),
      demandes,
      dehors,
      cours: union(classe.cours, recu.cours),
      prochain,
      noms: nomsAJour(ctx, classe.code, union(classe.noms, recu.noms)),
    },
    recu,
  };
}

/// Après une fusion, ce qu'on sait de plus repart aux autres. Deux responsables convergent ainsi
/// en un échange : la fusion ne fait qu'ajouter.
export const aDeQuoiRepondre = (fusionnee: ClasseGardee, recu: EtatPartage): boolean => canon(partage(fusionnee)) !== canon(recu);

export const etatChange = (avant: ClasseGardee, apres: ClasseGardee): boolean => canon(partage(avant)) !== canon(partage(apres));

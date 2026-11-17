// Quel écran ouvrir, d'après ce que l'appareil garde : le lien d'entrée fixe le rôle.

import { apprenant } from './apprenant';
import type { Contexte } from './contexte';
import { sansClasse } from './entree';
import { classes } from './etat';
import { formateur } from './formateur';

export function entree(ctx: Contexte): void {
  const liste = classes();
  if (liste.some((c) => c.role === 'chef')) return formateur(ctx);
  if (liste.some((c) => c.role === 'apprenant')) return apprenant(ctx);
  sansClasse(ctx);
}

// Le cœur compilé en WebAssembly, servi à côté de app.js.
export type Coeur = typeof import('../dist/coeur/opn_core.js');

export async function chargerCoeur(): Promise<Coeur> {
  const chemin = './coeur/opn_core.js';
  const coeur: Coeur = await import(chemin);
  await coeur.default();
  return coeur;
}

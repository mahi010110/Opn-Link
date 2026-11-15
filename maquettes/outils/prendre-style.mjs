import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAQUETTES = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(MAQUETTES, 'kit');
const OC = process.env.OC_REPO ?? join(MAQUETTES, '..', '..', 'Open-Contact');

// La version d'OpenContact dont on prend le style. Elle change exprès, jamais en passant.
const VERSION_OC = 'a1d317b82c3b2f3621ac9aa947b1349dcfdab79a';
const CHEMINS = ['styles/tokens', 'styles/app.css', 'assets/fonts', 'assets/icons'];
// Ces icônes manquent aux 73 qu'OpenContact a copiées : elles viennent du même jeu.
const ICONES_EN_PLUS = ['qr-code', 'camera', 'file-text', 'pen-square', 'check-double', 'clipboard-note', 'notes', 'teach', 'user-x', 'bell-ring'];

const git = (...args) => execFileSync('git', ['-C', OC, ...args]);
rmSync(KIT, { recursive: true, force: true });
const fichiers = git('ls-tree', '-r', '--name-only', VERSION_OC, '--', ...CHEMINS).toString().trim().split('\n');
for (const fichier of fichiers) {
  const destination = join(KIT, fichier);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, git('show', `${VERSION_OC}:${fichier}`));
}
const pixelarticons = join(MAQUETTES, 'node_modules', 'pixelarticons', 'svg');
for (const nom of ICONES_EN_PLUS) {
  copyFileSync(join(pixelarticons, `${nom}.svg`), join(KIT, 'assets', 'icons', `${nom}.svg`));
}
writeFileSync(
  join(KIT, 'VERSION'),
  `OpenContact ${VERSION_OC}\npixelarticons 2.4.2 : ${ICONES_EN_PLUS.join(', ')}\n`,
);
console.log(`${fichiers.length} fichiers d'OpenContact et ${ICONES_EN_PLUS.length} icônes dans kit/`);

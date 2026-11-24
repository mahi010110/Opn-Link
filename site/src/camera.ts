// La caméra arrière, filmée dans le viseur de l'écran. Un seul élément vidéo traverse les
// redessins : afficher() remplace toute la page à chaque chiffre tapé, et une vidéo retirée de la
// page s'arrête. Les images sont lues cinq fois par seconde, réduites, par le cœur.

import type { Coeur } from './coeur';

const IMAGES_PAR_SECONDE = 5;
const LARGEUR_LUE = 640;

let flux: MediaStream | undefined;
let video: HTMLVideoElement | undefined;
let minuterie: ReturnType<typeof setInterval> | undefined;
let rappel: ((texte: string) => void) | undefined;
const toile = document.createElement('canvas');

/// Ouvre la caméra dans le `.viseur` de l'écran, et passe au rappel le texte de chaque QR lu.
/// Rend false si elle ne s'ouvre pas : les six chiffres restent le chemin de secours.
export async function viser(coeur: Coeur, lu: (texte: string) => void): Promise<boolean> {
  rappel = lu;
  if (!flux) {
    try {
      flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch {
      return false;
    }
    if (!rappel) {
      couper();
      return false;
    }
    video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = flux;
    minuterie = setInterval(() => lire(coeur), 1000 / IMAGES_PAR_SECONDE);
  }
  poser();
  return true;
}

/// Après un redessin de l'écran, remet la vidéo dans le viseur.
export function poser(): void {
  const viseur = document.querySelector('.viseur');
  if (!video || !viseur) return;
  if (video.parentElement !== viseur) viseur.prepend(video);
  video.play().catch(() => {});
}

export function couper(): void {
  clearInterval(minuterie);
  flux?.getTracks().forEach((piste) => piste.stop());
  flux = video = rappel = undefined;
}

function lire(coeur: Coeur): void {
  if (!video?.isConnected || video.readyState < 2 || !video.videoWidth) return;
  const echelle = Math.min(1, LARGEUR_LUE / video.videoWidth);
  const largeur = Math.round(video.videoWidth * echelle);
  const hauteur = Math.round(video.videoHeight * echelle);
  toile.width = largeur;
  toile.height = hauteur;
  const ctx = toile.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, largeur, hauteur);
  const rvb = ctx.getImageData(0, 0, largeur, hauteur).data;
  const gris = new Uint8Array(largeur * hauteur);
  for (let i = 0; i < gris.length; i++) gris[i] = (rvb[i * 4] * 77 + rvb[i * 4 + 1] * 150 + rvb[i * 4 + 2] * 29) >> 8;
  let texte: string;
  try {
    texte = coeur.lire_qr(gris, largeur, hauteur);
  } catch {
    return; // Pas encore de QR lisible dans cette image.
  }
  rappel?.(texte);
}

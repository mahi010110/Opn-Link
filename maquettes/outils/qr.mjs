import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGES = join(dirname(fileURLToPath(import.meta.url)), '..', 'images');

// Des contenus de la même longueur que les vrais (docs/mesures.md, « Les QR codes »), inventés.
// Sans marge : le cadre blanc d'OpenContact (.qr-wrap) la donne.
const QR = {
  'qr-appel': 'OPL1.k3Rw9xQ2mZ7vT1bN4cY8hL0pD6sF5gJ2aE9uK1oW3iR7tY5qX8zV0nM4bC6l',
  'qr-signature':
    'OPS1.A3kR8wQ1zX7mT2vN9bY4cL6pD0sF5hJ8gE2uK7oW1iR3tY9qX5zV8nM0bC4lA6jH2fG7dS1aP9oI3uY5tR8eW0qZ2xC4vB6nM9kL1jH3gF5dS7aP0oI2uY4tR6eW8qZ1xC3vB5nM7kL9jH0gF2dS4aP6oI8uY0tR3e',
};

for (const [nom, contenu] of Object.entries(QR)) {
  const svg = await QRCode.toString(contenu, { type: 'svg', errorCorrectionLevel: 'M', margin: 0, color: { dark: '#1D242C', light: '#FFFFFF' } });
  writeFileSync(join(IMAGES, `${nom}.svg`), svg);
  console.log(nom, contenu.length, 'caractères');
}

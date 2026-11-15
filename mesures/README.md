# Les mesures d'Opn-Link

Des sondes qui mesurent les services publics dont dépend Opn-Link. Les
résultats sont expliqués dans [../docs/mesures.md](../docs/mesures.md), et les
chiffres bruts sont dans `resultats/`.

Depuis une session dans le cloud, il faut l'environnement « OpenContact et
Opn-Link », qui ouvre les adresses mesurées.

## Les relais, les fichiers, l'horodatage

```sh
npm install
node sonde-relais.mjs       # les 7 relais : écrire, relire, taille, rafale, une classe de 30
node sonde-morceaux.mjs     # un fichier de 1 Mo en morceaux par 4 relais
node sonde-fichiers.mjs     # les serveurs Blossom
node sonde-horodatage.mjs   # OpenTimestamps : dépôt, et ce qu'un navigateur peut lire
```

Le délai d'une preuve complète se mesure avec le client officiel :

```sh
pip install opentimestamps-client
cd resultats/horodatage
ots stamp -c https://alice.btc.calendar.opentimestamps.org -c https://bob.btc.calendar.opentimestamps.org -c https://finney.calendar.eternitywall.com -m 2 fichier
ots upgrade fichier.ots
```

## Le poids du cœur dans le navigateur

```sh
cd taille-coeur
cargo build --release --target wasm32-unknown-unknown --features k256,qrcode,rqrr
gzip -9 -c target/wasm32-unknown-unknown/release/taille_coeur.wasm | wc -c
```

Les options : `k256`, `nostr`, `qrcode`, `rqrr`, `lopdf`.

## Les QR

```sh
cd taille-coeur
cargo run --release --features qrcode,rqrr --example qr
```

## Les PDF

```sh
cd pdf
pip install pyhanko reportlab
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout cle-essai.pem -out cert-essai.pem -days 30 -subj "/CN=Centre Exemple (essai Opn-Link)"
openssl pkcs8 -topk8 -nocrypt -in cle-essai.pem -outform DER -out cle-essai.der
openssl x509 -in cert-essai.pem -outform DER -out cert-essai.der
python3 fabriquer-convention.py
(cd essai-pdf && cargo run --release)
python3 verifier.py
```

La clé d'essai n'est jamais versionnée.

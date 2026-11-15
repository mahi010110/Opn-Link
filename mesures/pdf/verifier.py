import re
import subprocess

from pyhanko.keys import load_cert_from_pemder
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature
from pyhanko_certvalidator import ValidationContext

with open("convention-scellee.pdf", "rb") as f:
    sig = PdfFileReader(f).embedded_signatures[0]
    etat = validate_pdf_signature(sig, ValidationContext(trust_roots=[load_cert_from_pemder("cert-essai.pem")]))
    print("pyHanko : intact", etat.intact, "| valide", etat.valid, "| reconnu", etat.trusted, "|", etat.coverage.name)

donnees = open("convention-scellee.pdf", "rb").read()
a, b, c, d = map(int, re.search(rb"/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]", donnees).groups())
open("contenu-signe.bin", "wb").write(donnees[a : a + b] + donnees[c : c + d])
hexa = donnees[a + b : c].strip()[1:-1].rstrip(b"0")
hexa += b"0" * (len(hexa) % 2)
open("sceau.cms", "wb").write(bytes.fromhex(hexa.decode()))
verdict = subprocess.run(
    ["openssl", "cms", "-verify", "-binary", "-inform", "DER", "-in", "sceau.cms", "-content", "contenu-signe.bin",
     "-CAfile", "cert-essai.pem", "-purpose", "any", "-out", "/dev/null"],
    capture_output=True, text=True,
)
print("OpenSSL :", (verdict.stderr or verdict.stdout).strip().splitlines()[-1])

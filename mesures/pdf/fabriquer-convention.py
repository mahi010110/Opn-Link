from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import fields
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

c = canvas.Canvas("convention.pdf", pagesize=A4)
for page in (1, 2):
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 780, "Convention de stage (exemple fictif)")
    c.setFont("Helvetica", 11)
    c.drawString(72, 750, f"Page {page} sur 2. Centre : Centre Exemple. Apprenant : Léa Martin (donnée inventée).")
    if page == 2:
        c.drawString(72, 160, "Signature de l'apprenant :")
    c.showPage()
c.save()

with open("convention.pdf", "rb") as entree:
    w = IncrementalPdfFileWriter(entree)
    fields.append_signature_field(
        w, sig_field_spec=fields.SigFieldSpec("SignatureApprenant", on_page=1, box=(300, 100, 520, 150))
    )
    with open("convention-case.pdf", "wb") as sortie:
        w.write(sortie)

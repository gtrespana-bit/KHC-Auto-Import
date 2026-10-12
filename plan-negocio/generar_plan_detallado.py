#!/usr/bin/env python3
"""Plan detallado: 50.000 € propios, sin préstamo.

Cada cifra sale del libro de caja. El coste del coche no se parte:
no hay un desglose que sume exactamente esa cifra.
"""

from __future__ import annotations

import importlib.util
import sys
from collections import Counter
from pathlib import Path

from reportlab.lib.colors import Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import datos_nave_milladoiro as d  # noqa: E402

spec = importlib.util.spec_from_file_location("p", str(HERE / "probar_sin_financiacion.py"))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
g = p.g

HERE = Path(__file__).resolve().parent
OUT = HERE / "Plan_Detallado_50mil.pdf"
FONT = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DejaVu", f"{FONT}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuBold", f"{FONT}/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerif", f"{FONT}/DejaVuSerif.ttf"))

W, H = 960, 540
INK = Color(0.039, 0.063, 0.125)
GOLD = Color(0.702, 0.576, 0.306)
GOLD_DEEP = Color(0.459, 0.365, 0.169)
IVORY = Color(0.969, 0.965, 0.953)
WHITE = white
SLATE = Color(0.290, 0.345, 0.447)
GREEN = Color(0.122, 0.420, 0.290)
RED = Color(0.549, 0.227, 0.227)
COVER = Color(33 / 255, 34 / 255, 40 / 255)
CARD = Color(1, 1, 1)
LINE = Color(0.855, 0.835, 0.788)
SOFT = Color(0.955, 0.949, 0.935)

KIT_LINES = d.KIT_LINES
REFORM_LINES = [(pt["partida"], pt["total"]) for pt in d.REFORMA]
FIXED_LINES = [
    ("Nave, O Milladoiro (465 m²)", g.RENT),
    ("Autónomo", g.RETA),
    ("Portales y gestoría", g.MKT),
    ("Luz, agua y vado", g.UTIL),
    ("Internet y teléfono", g.NET),
]
assert g.r2(sum(a for _, a in KIT_LINES)) == g.KIT
assert g.r2(sum(a for _, a in REFORM_LINES)) == g.REFORM
assert g.r2(sum(a for _, a in FIXED_LINES)) == p.fixed_of(True)

# Fianza de dos meses el día 1. Lo que falte para el fondo sale de la
# reforma y se paga cuando cabe (probar_sin_financiacion.arranque).
A = p.arranque(["GTI", "GTI", "116d"])
DEPOSIT, LATER, REFORM_NOW, LATER_LINES = A["deposit"], A["later"], A["now"], A["lines"]
MONTHS = p.ledger(["GTI", "GTI", "116d"], 1, p.FAM, deposit=DEPOSIT, later=LATER)
OWN = p.simulate(["GTI", "GTI", "116d"], 1, p.FAM, deposit=DEPOSIT, later=LATER)
assert OWN and OWN["pending"] == 0.0
LATER_N = OWN["later_n"]
TAX_MONTHS = [m["n"] for m in MONTHS if m["tax_paid"]]
REFORM_NOW_LINES = [
    (pt["partida"], g.r2(pt["total"] - sum(a for q, _, a in LATER_LINES if q == pt["partida"])))
    for pt in d.REFORMA
]
LATER_ROWS = [(lab + "  ·  " + pt, a) for pt, lab, a in LATER_LINES]
assert g.r2(sum(a for _, a in REFORM_NOW_LINES)) == REFORM_NOW
assert abs(MONTHS[-1]["end"] - OWN["cash"]) < 0.05
CUTS = [m for m in OWN["months"] if m["sal"] + 0.02 < m["want"]]


def eur(n, cents=True):
    return g.eur(n, cents)


def bg(c, dark=False):
    c.setFillColor(COVER if dark else IVORY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 4, W, 4, fill=1, stroke=0)
    c.rect(0, 0, 4, H, fill=1, stroke=0)


def footer(c, n, total, dark=False):
    c.setFillColor(GOLD if dark else GOLD_DEEP)
    c.setFont("DejaVu", 7.5)
    c.drawString(36, 18, "KHC AUTO IMPORT")
    c.setFillColor(Color(0.72, 0.70, 0.64) if dark else SLATE)
    c.drawCentredString(W / 2, 18, "50.000 € propios  ·  sin préstamo  ·  plan detallado")
    c.drawRightString(W - 28, 18, f"{n:02d}  /  {total:02d}")


def kicker(c, text, y, dark=False):
    c.setFillColor(GOLD if dark else GOLD_DEEP)
    c.setFont("DejaVuBold", 8)
    c.drawString(36, y, text.upper())


def heading(c, kick, text, y=498, size=20):
    kicker(c, kick, y)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", size)
    c.drawString(36, y - 30, text)
    return y - 30


def wrap(c, text, font, size, x, y, width, leading, color, max_lines=8):
    c.setFont(font, size)
    words = text.replace(" €", "\u00a0€").split(" ")
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    if len(lines) > max_lines:
        raise SystemExit("texto cortado: " + text[:80])
    for i, line in enumerate(lines):
        c.setFillColor(color)
        c.setFont(font, size)
        c.drawString(x, y - i * leading, line)
    return len(lines) * leading


def short_name(name):
    name = name.replace("Volkswagen ", "").replace("Mercedes-Benz ", "")
    name = name.replace(" Performance 2015", "").replace(" Manual 2015", "")
    name = name.replace(" Estate 2019", "").replace(" 1.0 TSI 2021", "")
    name = name.replace(" Touring 2019", "").replace(" 2.0 D3 2020", "")
    name = name.replace(" 1.0 TFSI 2018", "")
    return name.replace("Clase C", "Mercedes Clase C")


def move_label(label):
    label = label.replace("Volkswagen Golf GTI Performance 2015", "Golf GTI")
    label = label.replace("BMW 116d Manual 2015", "BMW 116d")
    label = label.replace("Mercedes-Benz Clase C Estate 2019", "Mercedes Clase C")
    label = label.replace("Volkswagen Golf VIII 1.0 TSI 2021", "Golf VIII")
    label = label.replace("BMW 318d Touring 2019", "BMW 318d")
    label = label.replace("Volvo XC40 2.0 D3 2020", "Volvo XC40")
    label = label.replace("Audi A3 1.0 TFSI 2018", "Audi A3")
    label = label.replace("IVA de esa ganancia, GTI", "IVA de esa ganancia")
    label = label.replace("IVA de esa ganancia, 116d", "IVA de esa ganancia")
    label = label.replace("IVA de esa ganancia, Mercedes", "IVA de esa ganancia")
    label = label.replace("IVA de esa ganancia, Golf VIII", "IVA de esa ganancia")
    label = label.replace("IVA de esa ganancia, 318d", "IVA de esa ganancia")
    label = label.replace("IVA de esa ganancia, XC40", "IVA de esa ganancia")
    label = label.replace("IVA de esa ganancia, Audi", "IVA de esa ganancia")
    label = label.replace("Reposición, mismo coste, GTI", "Reposición del Golf GTI")
    label = label.replace("Reposición, mismo coste, 116d", "Reposición del BMW 116d")
    label = label.replace("Reposición, mismo coste, Mercedes", "Reposición del Mercedes")
    label = label.replace("Reposición, mismo coste, Golf VIII", "Reposición del Golf VIII")
    label = label.replace("Reposición, mismo coste, 318d", "Reposición del BMW 318d")
    label = label.replace("Reposición, mismo coste, XC40", "Reposición del Volvo XC40")
    label = label.replace("Reposición, mismo coste, Audi", "Reposición del Audi A3")
    label = label.replace("Otro 116d, cabe sin tocar el fondo", "Otro BMW 116d, cabe")
    label = label.replace("Otro GTI, cabe sin tocar el fondo", "Otro Golf GTI, cabe")
    label = label.replace("Otro Audi, cabe sin tocar el fondo", "Otro Audi A3, cabe")
    return label


def floor_line(nicks):
    order = ["GTI", "116d", "Mercedes", "Audi", "318d", "Golf VIII", "XC40"]
    names = {
        "GTI": "GTI", "116d": "116d", "Mercedes": "Mercedes", "Audi": "A3",
        "318d": "318d", "Golf VIII": "Golf VIII", "XC40": "XC40",
    }
    counts = Counter(nicks)
    parts = []
    for nick in order:
        if counts[nick]:
            parts.append(f"{counts[nick]} {names[nick]}")
    return ", ".join(parts)


def month_title(m):
    if m["n"] == 1:
        return "Se abre. Este mes no se vende."
    bits = []
    if m.get("later"):
        bits.append("Se termina la reforma.")
    if m["tax_paid"] and m["n"] == TAX_MONTHS[0]:
        bits.append("Se paga el impuesto del año 1.")
    if m["sal"] + 0.02 < m["want"]:
        bits.append("El sueldo baja este mes.")
    if m["tax_paid"] and m["n"] == TAX_MONTHS[1]:
        bits.append("Se paga el impuesto del año 2.")
    if any(lab.startswith("Entra el Mercedes") for lab, _ in m["moves"]):
        bits.append("Entra el Mercedes.")
    if m["n"] == 6:
        bits.append("Empieza el sueldo.")
    elif m["n"] == 13:
        bits.append("El bolsillo pasa a 2.500 €.")
    elif m["n"] == 25:
        bits.append("El bolsillo pasa a 3.000 €.")
    if not bits or bits == ["Se termina la reforma."]:
        return f"Se venden {m['sales']}. Se reponen en la semana." + (" " + bits[0] if bits else "")
    return " ".join(bits)


def draw_cover(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    logo = HERE / "presentacion" / "logo_flat.png"
    if logo.exists():
        c.drawImage(str(logo), 36, 430, width=132, height=56, mask="auto", preserveAspectRatio=True, anchor="w")
    kicker(c, "Plan de arranque. No es la solicitud.", 400, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 28)
    c.drawString(36, 348, "50.000 € propios.")
    c.drawString(36, 314, "Desde el día que llegas.")
    wrap(
        c,
        "Sin préstamo. Nave O Milladoiro, 465 m², con su fianza de " + eur(DEPOSIT) + ". Dos Golf GTI y un BMW 116d. Kit y " + eur(REFORM_NOW) + " de reforma el día 1; el resto, " + eur(LATER) + ", el mes " + str(LATER_N) + ". Cada gasto, y cada euro que entra, hasta el mes 24. Del 34 al 36, solo el cierre.",
        "DejaVu", 12, 36, 270, 860, 16, Color(0.78, 0.76, 0.70), 3,
    )
    stats = [
        (eur(MONTHS[0]["end"]), "Caja al cerrar el día 1"),
        (f"{len(CUTS)} recorte" + ("" if len(CUTS) == 1 else "s"), "El sueldo de la familia"),
        ("3 → " + str(OWN["stock"]), "Coches, del día 1 al mes 36"),
    ]
    x = 36
    for val, lab in stats:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 72, 286, 78, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 16)
        c.drawString(x + 14, 112, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 8)
        c.drawString(x + 14, 90, lab.upper())
        x += 302
    footer(c, n, total, True)


def draw_steps(c, n, total):
    bg(c)
    heading(c, "El día que llegas a A Coruña", "Primero lo que ya está. Después, el dinero.", size=20)
    steps = [
        ("01", "Certificado y cuenta", "Ya están. 0 €. El certificado sirve para matricular desde casa, sin gestoría en cada coche."),
        ("02", "Web y ERP", "khcimport.autos y el programa ya funcionan. 0 €. El ERP decide, compra y vende. La lámina del programa lo dice."),
        ("03", "El equipo, antes del coche", "822,90 €. No se mira un anuncio sin la máquina, el medidor y los informes. Partida a partida, a continuación."),
        ("04", "La nave, en O Milladoiro", "Ames, junto a la autopista. 465 m²: 400 de almacén y 60 de oficinas. 1.200 € al mes. No hay un precio de ir y volver: no se suma."),
        ("05", "La fianza, al firmar", eur(DEPOSIT) + ": dos mensualidades, como pide la ley en un local. No es gasto y se recupera al irse, pero sale el día 1."),
        ("06", "La reforma la haces tú", eur(REFORM_NOW) + " el día 1: lo que hace falta para abrir. El resto, " + eur(LATER) + " en " + str(len(LATER_LINES)) + " líneas, el mes " + str(LATER_N) + ", con la primera venta."),
        ("07", "El primer mes de la nave", eur(p.fixed_of(True)) + ": alquiler, autónomo, portales, luz e internet. El autónomo no es un sueldo."),
        ("08", "Entonces, los tres coches", "Dos Golf GTI y un BMW 116d. El coste ya incluye coche, transporte, matriculación y puesta a la venta."),
        ("09", "Una semana, no cuatro", "La importación tarda como máximo una semana. Placas temporales desde el día uno. No hay un mes en blanco de espera."),
    ]
    y = 428
    for num, title, body in steps:
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(36, y, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10)
        c.drawString(68, y, title)
        wrap(c, body, "DejaVu", 9, 250, y, 670, 11, SLATE, 1)
        y -= 40
    footer(c, n, total)


def draw_lines(c, n, total, kick, title, rows, total_label, total_n, note):
    bg(c)
    heading(c, kick, title, size=18)
    c.setFillColor(INK)
    c.rect(36, 430, 888, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawString(52, 436, "PARTIDA")
    c.drawRightString(900, 436, "IMPORTE")
    top = 404
    row_h = 26 if len(rows) > 8 else 30
    for i, (lab, amount) in enumerate(rows):
        y = top - i * row_h
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 6, 888, row_h - 2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 10)
        c.drawString(52, y, lab)
        c.setFont("DejaVuBold", 10)
        c.drawRightString(900, y, "−" + eur(amount))
    y = top - len(rows) * row_h - 8
    c.setFillColor(COVER)
    c.roundRect(36, y - 8, 888, 28, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 10)
    c.drawString(52, y, total_label)
    c.drawRightString(900, y, "−" + eur(total_n))
    wrap(c, note, "DejaVu", 10, 36, y - 28, 888, 13, SLATE, 3)
    footer(c, n, total)


def draw_fixed(c, n, total):
    bg(c)
    heading(c, "Cada mes, haya venta o no", "Cinco partidas. El sueldo no está aquí.", size=20)
    y = 400
    for lab, amount in FIXED_LINES:
        c.setFillColor(CARD)
        c.roundRect(36, y - 18, 888, 44, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 18, 3, 44, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 13)
        c.drawString(56, y - 2, lab)
        c.setFont("DejaVuBold", 13)
        c.drawRightString(900, y - 2, eur(amount))
        y -= 56
    c.setFillColor(COVER)
    c.roundRect(36, y - 10, 888, 36, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 12)
    c.drawString(52, y + 2, "Cada mes, sin sueldo y sin cuota")
    c.setFillColor(GOLD)
    c.drawRightString(900, y + 2, eur(p.fixed_of(True)))
    wrap(
        c,
        "El fondo son tres meses de esto: " + eur(p.fund_of(True)) + ". No se compra un coche que lo rompa. El sueldo va encima, desde el mes 6. No hay cuota: no hay préstamo.",
        "DejaVu", 11, 36, y - 28, 888, 15, INK, 2,
    )
    footer(c, n, total)


def draw_not(c, n, total):
    bg(c)
    heading(c, "Lo que no se suma otra vez", "Está dicho para que no parezca un olvido.", size=20)
    rows = [
        ("Dentro del coste del coche", "Anuncio, transporte, matriculación y puesta a la venta. El manual de campo tiene precios de ITV, DGT y placas. No se restan otra vez: no hay un desglose que sume exactamente el coste cerrado. Partirlo sería inventar."),
        ("Aceite y filtros, 116,60 €", "Precio cerrado de taller, sin mano de obra, en la nave. No es una línea mensual. No se añade otra vez a la caja."),
        ("Notaría", "La sociedad aún no está hecha. No hay un precio cerrado. No se pone. El cargo de administrador es gratuito si los estatutos no dicen lo contrario."),
        ("Licencia de actividad y seguro del local", "La tasa de licencia de Ames y el seguro de la nave no tienen precio cerrado: no se ponen. La fianza, en cambio, sí está: " + eur(DEPOSIT) + " el día 1, y por eso parte de la reforma espera al mes " + str(LATER_N) + "."),
    ]
    y = 400
    for title, body in rows:
        c.setFillColor(CARD)
        c.roundRect(36, y - 58, 888, 74, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 58, 3, 74, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(54, y - 2, title)
        wrap(c, body, "DejaVu", 9.5, 54, y - 22, 850, 12, SLATE, 3)
        y -= 84
    footer(c, n, total)


def draw_erp(c, n, total):
    bg(c)
    heading(c, "El programa", "Se llama ERP. Lo hemos hecho nosotros. No es un programa comprado.", size=17)
    steps = [
        ("1", "Simulador", "Se mete el coche, a quién se compra y a qué precio saldría. Devuelve el coste, el impuesto y lo que queda. Si no sale, no se compra."),
        ("2", "Catálogo", "1.104 versiones de 37 marcas. Cada motor está marcado: fiable, correcto, con precaución o prohibido. El prohibido no se da de alta."),
        ("3", "Ficha", "Si se compra, entra en la flota. De «lo estamos mirando» a «entregado». Gastos, papeles y fotos, en el móvil y en el ordenador."),
        ("4", "Viaje e impuesto", "Antes del billete, compara traerlo rodando o en camión. Si la factura trae IVA descontable, no deja aplicar el IVA solo sobre la ganancia."),
        ("5", "Web y factura", "khcimport.autos publica ese coche. Reservado o vendido se ve el mismo día. El cliente no ve el coste. La factura sale del mismo programa."),
    ]
    y = 408
    for num, title, body in steps:
        c.setFillColor(CARD)
        c.roundRect(36, y - 48, 888, 60, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 48, 3, 60, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 11)
        c.drawString(52, y - 6, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(76, y - 6, title)
        wrap(c, body, "DejaVu", 9, 200, y - 6, 700, 12, SLATE, 2)
        y -= 68
    footer(c, n, total)


def car_table(c, rows, y0, title):
    c.setFillColor(INK)
    c.setFont("DejaVuBold", 10)
    c.drawString(36, y0 + 28, title)
    c.setFillColor(INK)
    c.rect(36, y0, 888, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawString(48, y0 + 6, "COCHE")
    for x, lab in ((430, "COSTE"), (560, "VENTA"), (710, "IVA GANANCIA"), (900, "QUEDAN")):
        c.drawRightString(x, y0 + 6, lab)
    for i, u in enumerate(rows):
        y = y0 - 28 - i * 32
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 8, 888, 30, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 10)
        c.drawString(48, y, short_name(u["name"]))
        c.drawRightString(430, y, eur(u["cost"]))
        c.drawRightString(560, y, eur(u["sell"]))
        c.drawRightString(710, y, eur(u["rebu"]))
        c.setFillColor(GREEN)
        c.setFont("DejaVuBold", 10)
        c.drawRightString(900, y, eur(u["net"]))
    return y0 - 28 - len(rows) * 32


def draw_opening_cars(c, n, total):
    bg(c)
    heading(c, "Los tres primeros", "Se pagan el día 1. El coste ya está cerrado.", size=20)
    rows = [p.BY[nick] for nick in ("GTI", "116d")]
    # GTI twice in the purchase, once in the table.
    y = car_table(c, rows, 400, "Precio de la web, 11 de octubre de 2026. El coste no se toca.")
    c.setFillColor(COVER)
    c.roundRect(36, 168, 888, 64, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVu", 11)
    c.drawString(52, 206, "Dos GTI y un 116d")
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 12)
    c.drawRightString(900, 206, eur(2 * p.BY["GTI"]["cost"] + p.BY["116d"]["cost"]))
    c.setFillColor(Color(0.78, 0.76, 0.70))
    c.setFont("DejaVu", 10)
    c.drawString(52, 184, "12.674 + 12.674 + 9.010. Transporte y matriculación ya dentro. No se resta otra vez.")
    wrap(
        c,
        "Quedan, después del IVA de la ganancia: 4.814,88 € en cada GTI y 2.863,64 € en el 116d. El IVA es solo sobre la ganancia. En un usado, a eso se le llama REBU.",
        "DejaVu", 11, 36, 130, 888, 15, INK, 3,
    )
    footer(c, n, total)


def draw_week(c, n, total):
    bg(c)
    heading(c, "La semana del coche", "El dinero ya salió. Estos son los pasos, no una segunda factura.", size=17)
    steps = [
        ("1", "Sale de origen", "Como máximo una semana. Placas temporales desde el día uno. Si baja en camión o rodando, el transporte ya está en el coste."),
        ("2", "Al pisar Galicia", "Se mide la pintura con el GOYOJO y se leen las centralitas con el Launch. El informe se guarda. Si el historial no se acredita, ese coche no se habría pagado."),
        ("3", "En la nave", "Aceite y filtros, 116,60 €, sin mano de obra. Es el precio cerrado de taller. No se suma otra vez."),
        ("4", "Matrícula", "ITV en Espíritu Santo o Sabón. Modelo 576 o 06, IVTM y DGT, desde casa, con el certificado. 0 € de gestoría en el trámite."),
        ("5", "A la venta", "Placas, fotos con los tapamatrículas y anuncio en khcimport.autos. El cliente ve el precio de la web. No ve el coste."),
    ]
    y = 400
    for num, title, body in steps:
        c.setFillColor(CARD)
        c.roundRect(36, y - 46, 888, 60, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 46, 3, 60, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 11)
        c.drawString(52, y - 4, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(76, y - 4, title)
        wrap(c, body, "DejaVu", 9.5, 200, y - 4, 700, 12, SLATE, 2)
        y -= 68
    footer(c, n, total)


def draw_one_car(c, n, total):
    bg(c)
    heading(c, "Cómo entra el dinero", "Un Golf GTI. Las mismas cuatro restas, siempre.", size=20)
    u = p.BY["GTI"]
    rows = [
        ("Venta, precio de la web", u["sell"], GREEN),
        ("Coste, ya cerrado", -u["cost"], INK),
        ("IVA solo de la ganancia", -u["rebu"], INK),
        ("Quedan en la empresa", u["net"], GREEN),
    ]
    y = 390
    for lab, amount, color in rows:
        c.setFillColor(CARD)
        c.roundRect(36, y - 16, 888, 48, 3, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 13)
        c.drawString(56, y, lab)
        c.setFillColor(color)
        c.setFont("DejaVuBold", 14)
        c.drawRightString(900, y, ("+" if amount > 0 and lab.startswith("Venta") else "") + eur(amount))
        y -= 60
    wrap(
        c,
        "Cuando se vende, ese dinero entra el mismo mes. La reposición se paga en la semana, al mismo coste, 12.674 €. El fondo no se toca. Si después cabe el Mercedes, entra. Si no, no.",
        "DejaVu", 11, 36, 118, 888, 15, INK, 3,
    )
    footer(c, n, total)


def draw_rule(c, n, total):
    bg(c)
    heading(c, "La regla, todos los meses", "No es un deseo. Es la cuenta.", size=22)
    rows = [
        ("Ventas", "Una de cada tres unidades en el suelo, y nunca menos de dos. Con menos de nueve coches, se venden dos al mes."),
        ("Reposición", "Cada venta se repone en la semana, al mismo coste. El stock no baja por vender."),
        ("El siguiente coche", "Primero el Mercedes, cuando cabe sin bajar del fondo. Después, el más barato que quepa: el 116d, a 9.010 €."),
        ("El sueldo", "Meses 1 a 5, cero. Lo cubre el colchón familiar de 25.000 €, fuera de la empresa. Mes 6: 2.083,33 € brutos, 1.687,50 € en el bolsillo."),
        ("Después", "Mes 13, 2.500 € en el bolsillo. Mes 25, 3.000 €. El bruto sube porque la retención pasa al 35 %: el año 1 factura más de 100.000 €."),
        ("El impuesto", "15 % los dos primeros años con beneficio. El año 1 se paga en el mes 19. El año 2, en el mes 31. El año 3 se reserva y no sale en estos 36 meses."),
    ]
    y = 412
    for title, body in rows:
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10)
        c.drawString(36, y, title)
        wrap(c, body, "DejaVu", 9.5, 150, y, 770, 12, SLATE, 2)
        y -= 58
    footer(c, n, total)


def draw_later_cars(c, n, total):
    bg(c)
    heading(c, "El catálogo", "No se compran el día 1. Entran cuando caben.", size=20)
    rows = [p.BY[nick] for nick in ("Mercedes", "Audi", "318d", "Golf VIII", "XC40")]
    car_table(c, rows, 400, "Mismos precios de la web. Mismo coste cerrado.")
    wrap(
        c,
        "El Mercedes es el primero que se añade, en cuanto la caja lo permite sin romper el fondo. Los otros cuatro son el catálogo. En esta cuenta, el que cabe una y otra vez es el 116d, porque es el más barato.",
        "DejaVu", 11, 36, 118, 888, 15, INK, 3,
    )
    footer(c, n, total)


def draw_month(c, n, total, m):
    bg(c)
    kicker(c, f"Mes {m['n']}", 500)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 16)
    c.drawString(36, 474, month_title(m))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 9)
    c.drawString(36, 454, "Caja al abrir  " + eur(m["start"]) + "     ·     En el suelo, al cerrar: " + floor_line(m["floor_cars"]))
    moves = m["moves"]
    leading = 16 if len(moves) <= 14 else 15
    y = 428
    for i, (lab, amount) in enumerate(moves):
        yy = y - i * leading
        if i % 2 == 0:
            c.setFillColor(SOFT)
            c.rect(36, yy - 4, 888, leading - 1, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 9)
        c.drawString(48, yy, move_label(lab))
        c.setFillColor(GREEN if amount > 0 else INK)
        c.setFont("DejaVuBold", 9)
        sign = "+" if amount > 0 else "−"
        c.drawRightString(900, yy, sign + eur(abs(amount)))
    bar_y = 52
    c.setFillColor(COVER)
    c.roundRect(36, bar_y, 888, 28, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 9)
    c.drawString(48, bar_y + 9, "Caja al cerrar  " + eur(m["end"]))
    c.setFillColor(WHITE)
    c.setFont("DejaVu", 8)
    cushion = g.r2(m["end"] - m["floor"])
    extra = ""
    if m["pocket"]:
        extra = "     ·     Él recibe " + eur(m["pocket"])
    c.drawRightString(908, bar_y + 9, f"{m['stock']} coches     ·     fondo {eur(m['floor'])}     ·     por encima {eur(cushion)}" + extra)
    footer(c, n, total)


def year_rows(rows):
    cobro = g.r2(sum(m["cobro"] for m in rows))
    rebu = g.r2(sum(m["rebu"] for m in rows))
    compra = g.r2(sum(m["compra"] for m in rows))
    sal = g.r2(sum(m["sal"] for m in rows))
    pocket = g.r2(sum(m["pocket"] for m in rows))
    tax = g.r2(sum(m["tax_paid"] for m in rows))
    sales = sum(m["sales"] for m in rows)
    return cobro, rebu, compra, sal, pocket, tax, sales


def draw_year(c, n, total, year, rows, result, tax_accrued):
    bg(c)
    heading(c, f"Año {year}", "Doce meses, sumados. El detalle está en las láminas anteriores.", size=18)
    cobro, rebu, compra, sal, pocket, tax, sales = year_rows(rows)
    lines = [
        ("Ventas", str(sales) + " coches"),
        ("Entra, precio de venta", eur(cobro)),
        ("Sale, IVA de la ganancia", eur(rebu)),
        ("Sale, compras y reposiciones", eur(compra)),
        ("Sale, sueldo bruto", eur(sal)),
        ("Él recibe, en el bolsillo", eur(pocket)),
        ("Impuesto que sale de caja este año", eur(tax)),
        ("Impuesto del año, se pague ahora o después", eur(tax_accrued)),
        ("Beneficio del año", eur(result)),
        ("Caja al cerrar el año", eur(rows[-1]["end"])),
        ("Coches al cerrar", str(rows[-1]["stock"])),
    ]
    y = 412
    for i, (lab, val) in enumerate(lines):
        c.setFillColor(COVER if i >= 8 else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 6, 888, 26, fill=1, stroke=0)
        c.setFillColor(GOLD if i >= 8 else INK)
        c.setFont("DejaVuBold" if i >= 8 else "DejaVu", 10)
        c.drawString(52, y, lab)
        c.drawRightString(900, y, val)
        y -= 28
    footer(c, n, total)


def draw_chart(c, n, total):
    bg(c)
    heading(c, "Los 36 meses, de un vistazo", "Arriba, la caja. Abajo, los coches. Escalas distintas.", size=18)
    cash = [m["end"] for m in MONTHS]
    stock = [m["stock"] for m in MONTHS]
    left, right = 64, 900

    def panel(bottom, top, values, vmax, color, labels):
        c.setStrokeColor(LINE)
        c.line(left, bottom, right, bottom)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 7)
        for i in (6, 12, 18, 24, 30, 36):
            x = left + (right - left) * (i / 36)
            c.drawCentredString(x, bottom - 12, str(i))
        bw = (right - left) / 36 * 0.55

        def x_of(i):
            return left + (right - left) * ((i + 1) / 36)

        if labels:
            path = c.beginPath()
            for i, v in enumerate(values):
                y = bottom + (top - bottom) * (v / vmax)
                if i == 0:
                    path.moveTo(x_of(i), y)
                else:
                    path.lineTo(x_of(i), y)
            c.setStrokeColor(color)
            c.setLineWidth(1.6)
            c.drawPath(path, stroke=1, fill=0)
            c.setFillColor(color)
            c.circle(x_of(0), bottom + (top - bottom) * (values[0] / vmax), 2.2, fill=1, stroke=0)
            c.circle(x_of(35), bottom + (top - bottom) * (values[-1] / vmax), 2.2, fill=1, stroke=0)
        else:
            for i, v in enumerate(values):
                h = (top - bottom) * (v / vmax)
                c.setFillColor(color)
                c.rect(x_of(i) - bw / 2, bottom, bw, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont("DejaVu", 8)
    c.drawString(left, 418, "Caja al cerrar cada mes  ·  " + eur(cash[0]) + "  →  " + eur(cash[-1]))
    panel(268, 404, cash, max(cash) * 1.08, GOLD_DEEP, True)
    c.setFillColor(INK)
    c.setFont("DejaVu", 8)
    c.drawString(left, 228, "Coches al cerrar cada mes  ·  3  →  " + str(OWN["stock"]))
    panel(78, 214, stock, max(stock) + 1, Color(0.78, 0.74, 0.64), False)
    footer(c, n, total)


def draw_span_table(c, n, total, kick, title, rows):
    bg(c)
    heading(c, kick, title, size=18)
    headers = ["MES", "VENTAS", "ENTRA", "IVA", "COMPRAS", "SUELDO", "IMPUESTO", "CAJA", "COCHES"]
    xs = [48, 110, 230, 340, 470, 590, 720, 820, 900]
    c.setFillColor(INK)
    c.rect(36, 430, 888, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7)
    for x, lab in zip(xs, headers):
        if lab == "MES":
            c.drawString(x, 435, lab)
        else:
            c.drawRightString(x, 435, lab)
    row_h = 28 if len(rows) <= 9 else 24
    for i, m in enumerate(rows):
        y = 404 - i * row_h
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 6, 888, row_h - 2, fill=1, stroke=0)
        vals = [
            str(m["n"]),
            str(m["sales"]),
            eur(m["cobro"]),
            eur(m["rebu"]),
            eur(m["compra"]),
            eur(m["sal"]) if m["sal"] else "—",
            eur(m["tax_paid"]) if m["tax_paid"] else "—",
            eur(m["end"]),
            str(m["stock"]),
        ]
        c.setFillColor(INK)
        c.setFont("DejaVu", 8)
        for x, val, lab in zip(xs, vals, headers):
            if lab == "MES":
                c.setFont("DejaVuBold", 8)
                c.drawString(x, y, val)
                c.setFont("DejaVu", 8)
            else:
                c.drawRightString(x, y, val)
    footer(c, n, total)


def draw_late(c, n, total):
    bg(c)
    heading(c, "Meses 34, 35 y 36", "Menos detalle. El cierre, sí.", size=22)
    y = 400
    for m in MONTHS[33:]:
        c.setFillColor(CARD)
        c.roundRect(36, y - 78, 888, 92, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 78, 3, 92, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 14)
        c.drawString(54, y - 8, f"Mes {m['n']}")
        c.setFont("DejaVu", 10)
        c.setFillColor(SLATE)
        c.drawString(140, y - 6, f"{m['sales']} ventas  ·  entra {eur(m['cobro'])}  ·  sueldo {eur(m['sal'])}")
        c.setFillColor(INK)
        c.setFont("DejaVu", 10)
        c.drawString(54, y - 36, "Caja al cerrar")
        c.setFont("DejaVuBold", 12)
        c.drawString(180, y - 37, eur(m["end"]))
        c.setFont("DejaVu", 10)
        c.drawString(360, y - 36, f"{m['stock']} coches")
        c.setFillColor(SLATE)
        c.drawString(470, y - 36, "Él recibe " + eur(m["pocket"]))
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 9)
        c.drawString(54, y - 58, "En el suelo: " + floor_line(m["floor_cars"]))
        y -= 104
    footer(c, n, total)


def draw_close(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    kicker(c, "Al mes 36", 470, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, 418, "Suyo, sin deuda.")
    free = g.r2(MONTHS[-1]["end"] - OWN["tax3"])
    lines = [
        ("Caja", eur(OWN["cash"])),
        ("Coches, a coste", eur(OWN["stock_cost"])),
        ("Fianza de la nave, se recupera al irse", eur(DEPOSIT)),
        ("Impuesto del año 3, reservado, aún no pagado", "−" + eur(OWN["tax3"])),
        ("Lo que es suyo dentro", eur(OWN["equity"])),
    ]
    assert abs(g.r2(OWN["cash"] + OWN["stock_cost"] + DEPOSIT - OWN["tax3"]) - OWN["equity"]) < 0.05
    y = 366
    for i, (lab, val) in enumerate(lines):
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(36, y - 14, 888, 40, 3, fill=1, stroke=0)
        last = i == len(lines) - 1
        c.setFillColor(GOLD if last else WHITE)
        c.setFont("DejaVuBold" if last else "DejaVu", 12)
        c.drawString(52, y, lab)
        c.drawRightString(900, y, val)
        y -= 46
    wrap(
        c,
        "La caja todavía lleva dentro el impuesto del año 3. Libre, " + eur(free) + ", por encima del fondo de " + eur(p.fund_of(True)) + ". El bolsillo de los 36 meses, " + eur(OWN["pocket"]) + ". " + ("Cero recortes." if not CUTS else "El sueldo se recorta en el mes " + ", ".join(str(m["n"]) for m in CUTS) + ", cuando se paga el impuesto.") + " Cero deuda. El préstamo no está en este plan.",
        "DejaVu", 11, 36, 132, 880, 15, Color(0.78, 0.76, 0.70), 4,
    )
    footer(c, n, total, True)


def main():
    slides = [
        draw_cover,
        draw_steps,
        lambda c, n, t: draw_lines(
            c, n, t, "Antes de comprar un coche", "El equipo, partida a partida.",
            KIT_LINES, "Equipo, antes de comprar", g.KIT,
            "Suma exacta: 822,90 €. Se paga el día 1, antes de los coches. La web, el dominio y el certificado no suman: ya están, a 0 €.",
        ),
        lambda c, n, t: draw_lines(
            c, n, t, "La nave, el mismo día", "La reforma la hace él. Solo materiales.",
            REFORM_NOW_LINES, "Reforma, el día 1", REFORM_NOW,
            "De " + eur(g.REFORM) + " con IVA, el día 1 se pagan " + eur(REFORM_NOW) + ": suelo, pintura, luz, puertas, seguridad y lo básico de la oficina. Sin contratista. No entra en la base del impuesto. Detalle en REFORMA_FASE1_COMPLETA.md.",
        ),
        lambda c, n, t: draw_lines(
            c, n, t, "Lo que espera", "La fianza no deja sitio. Esto se compra el mes " + str(LATER_N) + ".",
            LATER_ROWS, "Resto de la reforma, mes " + str(LATER_N), LATER,
            "Faltaban " + eur(A["falta"]) + " para pagar la fianza sin bajar del fondo. Se aplaza lo que no hace falta para abrir: decoración, archivo, el logo de pared y las herramientas de taller. Se paga con la primera venta, sin tocar el fondo.",
        ),
        draw_fixed,
        draw_not,
        draw_erp,
        draw_opening_cars,
        draw_week,
        draw_one_car,
        draw_later_cars,
        draw_rule,
    ]
    for m in MONTHS[:24]:
        slides.append(lambda c, n, t, m=m: draw_month(c, n, t, m))
    slides.append(lambda c, n, t: draw_year(c, n, t, 1, MONTHS[:12], OWN["y1_result"], OWN["y1_tax"]))
    slides.append(lambda c, n, t: draw_year(c, n, t, 2, MONTHS[12:24], OWN["y2_result"], OWN["y2_tax"]))
    slides.append(draw_chart)
    slides.append(lambda c, n, t: draw_span_table(
        c, n, t, "Año 3, meses 25 a 33", "Entra y sale. Sin el detalle de cada coche.", MONTHS[24:33]
    ))
    slides.append(draw_late)
    slides.append(draw_close)
    pdf = canvas.Canvas(str(OUT), pagesize=(W, H))
    pdf.setTitle("KHC — 50.000 € propios, plan detallado")
    total = len(slides)
    for i, fn in enumerate(slides, 1):
        fn(pdf, i, total)
        pdf.showPage()
    pdf.save()
    print(OUT)
    print("slides", total, "end", MONTHS[-1]["end"], "equity", OWN["equity"])


if __name__ == "__main__":
    main()

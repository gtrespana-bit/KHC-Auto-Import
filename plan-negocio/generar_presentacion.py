#!/usr/bin/env python3
"""Plan de negocio en formato de presentación.

Dos regímenes, sin mezclarlos:
- Piloto de 75 días: particular, IRPF, sin nave. Cifras cerradas de plan-negocio/03.
- Sociedad: lote del plan de viabilidad. El coste de compra ya incluye
  coche, transporte, matriculación y puesta a la venta.

El taller es una línea nueva. Solo se monetiza lo que tiene tarifa cerrada.
"""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib.colors import Color, white
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
OUT_PDF = HERE / "Plan_Negocio_KHC_Presentacion.pdf"
OUT_HTML = HERE / "presentacion" / "index.html"
LOGO = REPO / "public" / "brand" / "logo-khc.png"
MODEL = json.loads((HERE / "DOCUMENTOS LEGALES KHC IMPORT" / "modelo_cifras.json").read_text(encoding="utf-8"))

FONT = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DejaVu", f"{FONT}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuBold", f"{FONT}/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerif", f"{FONT}/DejaVuSerif.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerifBold", f"{FONT}/DejaVuSerif-Bold.ttf"))

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

# Piloto cerrado. Columna de 50.000 €. Particular, no sociedad.
PILOT = [
    ("0", "Capital en la cuenta", "—", "50.000"),
    ("1", "Arranque cerrado: Launch, medidor, historial, imagen", "−823", "49.177"),
    ("4", "Focus ST 280, compra y bajada rodando", "−18.880", "30.297"),
    ("11", "ITV, modelo 576, DGT y placas del Focus", "−1.831", "28.466"),
    ("14", "Compra del Golf GTI en Alemania", "−19.400", "9.066"),
    ("25", "Camión, 576 y taller del GTI. Valle de caja", "−2.812", "6.254"),
    ("28", "Cobro del Focus, 24.490 €, menos reserva", "+23.444", "29.699"),
    ("44", "Cobro del GTI, 26.290 €, menos reserva", "+25.183", "54.881"),
    ("47", "Cayenne E-Hybrid / Q7 TFSIe. Impuesto 576 a cero", "−29.500", "25.381"),
    ("60", "Camión y matriculación del híbrido", "−1.840", "23.542"),
    ("75", "Cobro 36.900 €, menos IRPF, garantía y SIM", "+35.310", "58.852"),
]


def eur(n, d=0):
    neg = float(n) < 0
    n = abs(float(n))
    s = f"{n:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" + s if neg else s) + " €"


def footer(c, n, total, dark=False):
    c.setFillColor(GOLD if dark else GOLD_DEEP)
    c.setFont("DejaVu", 7.5)
    c.drawString(36, 18, "KHC AUTO IMPORT")
    c.setFillColor(Color(0.72, 0.70, 0.64) if dark else SLATE)
    c.drawCentredString(W / 2, 18, "Plan de negocio  ·  octubre 2026  ·  cifras del propio proyecto")
    c.setFillColor(GOLD if dark else INK)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(W - 36, 18, f"{n:02d}  /  {total:02d}")
    c.setStrokeColor(GOLD)
    c.setLineWidth(2.2 if dark else 1.4)
    c.line(0, H - 0 if False else H, 0, 0)


def hairline(c, y, dark=False):
    c.setStrokeColor(GOLD if not dark else Color(0.55, 0.45, 0.24))
    c.setLineWidth(0.6)
    c.line(36, y, W - 36, y)


def kicker(c, text, x, y, dark=False):
    c.setFillColor(GOLD if dark else GOLD_DEEP)
    c.setFont("DejaVuBold", 8)
    c.drawString(x, y, text.upper())


def wrap(c, text, font, size, x, y, width, leading, color, max_lines=6):
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
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
    lines = lines[:max_lines]
    for i, line in enumerate(lines):
        c.drawString(x, y - i * leading, line)
    return len(lines) * leading


class Deck:
    def __init__(self):
        self.slides = []

    def add(self, kind, **kw):
        self.slides.append({"kind": kind, **kw})


def build_deck():
    m = MODEL
    t = m["totals"]
    stress = m["scenarios"]["stress_12"]
    base = m["scenarios"]["base_30"]
    tax23 = m["scenarios"]["stress_23"]
    price5 = m["scenarios"]["price_5"]
    web = m["scenarios"]["web_prices"]
    f = m["funds"]
    d = Deck()

    d.add(
        "cover",
        kicker="Plan de negocio",
        title="Vehículos seleccionados,\ncon el coste ya cerrado.",
        sub="Para banco, aval o capital privado. Galicia, octubre 2026.",
        stats=[
            ("3.781 €", "Margen neto real\npor coche del lote"),
            ("822,90 €", "Para arrancar\nequipados"),
            ("1,72×", "RCSD con una venta\nal mes y la nave"),
        ],
    )
    d.add(
        "statement",
        kicker="La tesis",
        title="El margen no se negocia en el anuncio.\nSe decide antes de pagar.",
        body="Galicia compra etiqueta C o ECO, motor que un mecánico recomendaría a su familia, y un precio entre 16.000 y 23.000 €. Lo demás se deja en Alemania. El ERP ya impide comprar lo que rompe la garantía.",
        stats=[
            ("12–20 días", "Rotación de los modelos que el estudio de mercado da por ganadores"),
            ("26.467 €", "Margen neto del lote de siete, después de coste completo e IVA REBU"),
            ("0 €", "De sueldo. Los 25.000 € familiares no entran en la sociedad"),
        ],
    )
    d.add(
        "cards",
        kicker="Qué se vende",
        title="No se vende una importación. Se vende un coche revisado.",
        cards=[
            ("01", "Seleccionado", "Nacional o importado, sin jerarquía. Se compra donde el número cierra: Alemania, Bélgica, Italia o España.", "El simulador compara las dos orillas antes de reservar el vuelo."),
            ("02", "Con historial", "Libro de mantenimiento, kilometraje correlativo y ausencia de siniestro estructural. Si no se acredita, no se paga.", "Si el kilometraje no cuadra con el libro, no hay transferencia."),
            ("03", "Con garantía", "Mínimo 12 meses, por escrito, en todas las ventas. Es la promesa pública de khcimport.autos.", "Va dentro del coste cerrado. No se resta otra vez del margen."),
        ],
    )
    d.add(
        "split",
        kicker="Mercado",
        title="Cuatro coches que Galicia ya compra.",
        left_title="Lo que rota",
        left=[
            "Golf 7.5 2.0 TDI — 12 a 18 días. Impuesto de matriculación al 0 %.",
            "BMW X1 18d — 12 a 25 días. El SUV que pide la lluvia.",
            "Mercedes Clase A W177 — 14 a 22 días. Interior que cierra la visita.",
            "BMW 320d Touring, solo con pocos kilómetros. A 162.000 km el catálogo ya no da margen.",
        ],
        right_title="Lo que no entra",
        right=[
            "PureTech, 1.2 TCe, EcoBoost de correa bañada, N47, Ingenium diésel.",
            "Diésel anterior a septiembre de 2015. Etiqueta B, y las ZBE ya están.",
            "SUV grande de gasolina o diésel alto en CO₂. El 576 se come el expediente.",
            "El kilómetro manda más que el modelo. Dos ganadores de la matriz pierden a 162.000 km.",
        ],
    )
    d.add(
        "modules",
        kicker="El sistema, ya construido",
        title="El control existe antes de pedir el dinero.",
        items=[
            ("1.104", "Variantes en catálogo, con fiabilidad y precio de las dos orillas", "El motor prohibido no se puede marcar como comprable."),
            ("Flota", "Coste real, no precio de anuncio. Del prospecto a la entrega", "El estado del coche y lo que ha costado viven en la misma ficha."),
            ("Impuestos", "REBU, régimen general, ITP e IEDMT, calculados en la ficha", "Si la factura trae IVA deducible, el REBU queda bloqueado."),
            ("Viaje", "Peajes, combustible y tres rutas antes de subir al avión", "La ruta se elige con el número, no al llegar al peaje."),
            ("Inspección", "Launch, espesor de pintura y los seis papeles alemanes", "La pintura gruesa o el fallo en diagnosis paran la compra."),
            ("Web", "Stock vivo en khcimport.autos. Si se reserva, se marca el mismo día", "Lo que se enseña al cliente sale del mismo sistema."),
        ],
    )
    d.add(
        "money",
        kicker="Día 0",
        title="822,90 € para no comprar a ciegas.\nEl resto es stock.",
        rows=[
            ("Diagnosis Launch, medidor de pintura y arrancador", "476,18 €"),
            ("Diez informes de historial", "145,08 €"),
            ("Imagen de entrega: tapamatrículas, carpetas, cerámica", "136,64 €"),
            ("Línea de negocio y una consulta con la gestoría", "65,00 €"),
        ],
        note="Con 50.000 € propios quedan 49.177 € para coches. Un mes sin compra, en el piloto, cuesta entre 100 y 245 €.",
    )
    d.add(
        "lot",
        kicker="La unidad de la sociedad",
        title="Compra, venta y margen. El aterrizaje ya está dentro.",
        note="Venta menos coste completo, menos el IVA del REBU, que va dentro del margen. El transporte no se resta otra vez.",
        rows=m["lot"],
        totals=t,
    )
    d.add(
        "pilot",
        kicker="Flujo desde el día 1  ·  sin nave  ·  particular",
        title="75 días. Tres coches. Todo descontado.",
        rows=PILOT,
        foot="Tabla redondeada al euro. Al día 75 la cuenta operativa tiene 58.851,94 € y la subcuenta de IRPF y garantía, 3.727,93 €. Total en el banco: 62.579,87 €. Beneficio neto: 8.851,94 €. Régimen de particular: no es el de la sociedad.",
    )
    d.add(
        "two",
        kicker="Capital",
        title="Dos maneras de entrar. Una sola disciplina.",
        a_title="Piloto, capital propio",
        a=[
            "45.000 a 50.000 €. Sin deuda y sin nave.",
            "Tres coches en 75 días, uno de ellos híbrido enchufable para no pagar el 576.",
            "Valle de caja: 6.254 €. No se compra el tercero antes de cobrar el segundo.",
            "Después, autónomo REBU a 284,14 € al mes, todavía sin local.",
        ],
        b_title="Sociedad, con financiación",
        b=[
            "50.000 € propios y 50.000 € ajenos. Aval, préstamo o las dos cosas.",
            "Siete coches a coste cerrado: 95.380 €. Caja el día 1: 4.620 €.",
            "Nave de San Marcos en el plan: 1.100 € al mes. La reforma, con el primer cobro.",
            "RCSD de 1,72× vendiendo un coche al mes. El taller no hace falta para que cuadre.",
        ],
    )
    d.add(
        "nave",
        kicker="La nave y el taller",
        title="El local no es un capricho. Tampoco se abre el mismo día.",
        cards=[
            ("1.100 €", "Renta de San Marcos en el plan. Otras naves del roadmap: 750 a 1.300 €."),
            ("4.550 €", "Reforma de materiales. Con el primer cobro. Si se adelanta, la caja baja a 2.461 €."),
            ("60 €", "Mano de obra que hoy sale fuera. Aceite, 52,70. Filtros, 63,90."),
        ],
        services=[
            ("Aceite y cuatro filtros", "116,60 €", "60 €", "176,60 €", "60 €"),
            ("Aceite de caja", "sin tarifa", "—", "al abrir", "0 €"),
            ("Pastillas de freno", "sin tarifa", "—", "al abrir", "0 €"),
            ("Neumáticos", "después", "—", "más tarde", "0 €"),
        ],
        body="Hipótesis, no facturación: dos servicios externos por semana. Mano de obra, 5.760 € al año, más 720 € en los doce coches propios. Total, 6.480 €, fuera del 1,72×. El recambio se cobra a coste.",
    )
    d.add(
        "ledger",
        kicker="Gastos e impuestos",
        title="Lo fijo, al mes. El impuesto, sin mezclarlo.",
        left_title="Estructura de la sociedad",
        left=[
            ("San Marcos, 550 m²", "1.100 €"),
            ("Autónomo societario", "380 €"),
            ("Portales y gestoría", "250 €"),
            ("Suministros", "150 €"),
            ("Estructura, sin la cuota", "1.880 €"),
            ("Cuota exacta, 5,50 % y 60 meses", "955,06 €"),
        ],
        right_title="Impuestos, cada uno en su sitio",
        right=[
            ("IVA del REBU, dentro del margen del lote", "5.558 €"),
            ("Sociedades al 15 % en el año de estrés", "3.043 €"),
            ("Sociedades al 23 %, el mismo año", "4.666 €"),
            ("IRPF del piloto, apartado y no gastado", "2.677,93 €"),
            ("Modelo 576 del híbrido enchufable", "0 €"),
            ("Cuota de autónomo REBU, camino sin nave", "284,14 €"),
        ],
        note="La cuota no es un gasto de explotación: va al denominador del RCSD, no dentro de los 1.880 €. El impuesto al 23 % son 4.666 € y el ratio baja a 1,58×. No se rompe.",
    )
    d.add(
        "ratio",
        kicker="El año de la sociedad",
        title="Una venta al mes ya cubre la nave y la cuota.",
        rows=[
            ("Una venta al mes, impuesto 15 %", "12", "1,72×", "El suelo con el que se pide el dinero"),
            ("La misma venta, impuesto al 23 %", "12", "1,58×", "Si el tipo de nueva creación no aplica"),
            ("Dos precios de la web, mil euros debajo", "12", "1,51×", "116d a 12.475 € y 318d a 17.250 €"),
            ("Precio de venta un 5 % por debajo", "12", "1,06×", "Cubre la cuota. Queda bajo 1,30×"),
            ("Objetivo del plan, 2,5 coches al mes", "30", "6,77×", "Siete coches a 90 días dan unas 28 ventas"),
        ],
        note=f"Estructura mensual del plan, sin la cuota: 1.880 €. Cuota exacta al 5,50 % y 60 meses: 955,06 €. Hacen falta {m['break_even_sales']['dscr_130_15']} ventas al año para el 1,30×.",
    )
    d.add(
        "cash",
        kicker="Caja de la sociedad, año 1",
        title="Se compran los siete. Se repone uno al mes.",
        series_a=[r["end"] for r in m["cash_base"]],
        series_b=[r["end"] for r in m["cash_reform_m1"]],
        note="El mes más justo es el Audi: 2.921 € de margen contra 2.835 € de estructura y cuota. Cubre. No sobra.",
    )
    d.add(
        "uses",
        kicker="Destino del dinero",
        title="Cien mil euros. Un solo uso el día 1.",
        big=[
            ("95.380 €", "Siete coches, coste ya completo"),
            ("4.620 €", "Caja que no se toca hasta cobrar"),
            ("0 €", "De reforma, de sueldo y de taller nuevo"),
        ],
        body="El aval o el préstamo de 50.000 € rota existencias. La reforma, el elevador y el utillaje de frenos salen de la caja que generan las ventas. El 5,50 % a 60 meses es la hipótesis del plan, no una oferta: si el tipo es otro, se sustituye la cuota y se vuelve a mirar el 1,72×.",
    )
    d.add(
        "risks",
        kicker="Lo que puede fallar",
        title="Cuatro golpes, y la respuesta ya está escrita.",
        rows=[
            ("El precio cede un 5 %", "El ratio baja a 1,06×. Se deja de reponer y se adelgaza la deuda."),
            ("Un motor de la lista negra", "No se compra. El catálogo lo marca prohibido antes de la transferencia."),
            ("Hace falta un sueldo", "No sale de la sociedad. El administrador vive de los 25.000 € personales."),
            ("La nave tienta el día 1", "La renta cabe en el 1,72×. La reforma, no, hasta el primer cobro."),
        ],
    )
    d.add(
        "close",
        kicker="Para la reunión",
        title="50.000 € al lado\nde otros 50.000 €.",
        body="El papel que se firma es un circulante para siete coches cuyo coste ya está cerrado, con una nave que se paga con la explotación y un taller que es margen de más, no la tesis. Lo que se pide en la sala es una oferta de tipo, no una rebaja del margen.",
        stats=[
            ("50.000 €", "Financiación"),
            ("3.781 €", "Por coche"),
            ("1,72×", "En el suelo"),
        ],
    )
    d.add(
        "sources",
        kicker="De dónde sale cada cifra",
        title="Nada de esta presentación es una venta cobrada.",
        items=[
            "Piloto de 75 días: plan-negocio/03, columna de 50.000 €. Particular e IRPF.",
            "Lote de siete y gastos de la nave: plan de viabilidad de cuatro páginas. Coste de compra ya completo.",
            "Contraste ERP: borrador del Golf VIII, 14.611,82 € frente a 14.617 € del plan.",
            "Mercado y motores: estudio Alemania / Galicia, guía de fiabilidad y matriz de ganadores, con la corrección de kilometraje del 24 de septiembre de 2026.",
            "Arranque: 822,90 € cerrados en el presupuesto de día 0, con proveedor.",
            "Taller: aceite 52,70 € y filtros 63,90 € del escandallo. La mano de obra de 60 € es la que hoy se paga fuera. Dos servicios externos por semana son hipótesis, no facturación.",
            "Web: precios públicos de khcimport.autos a 11 de octubre de 2026.",
        ],
    )
    return d


def draw_bg(c, dark=False):
    c.setFillColor(COVER if dark else IVORY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 4, W, 4, fill=1, stroke=0)


def draw_cover(c, s, n, total):
    draw_bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    logo = HERE / "presentacion" / "logo_flat.png"
    if logo.exists():
        c.drawImage(str(logo), 36, 392, width=168, height=72, mask=None, preserveAspectRatio=True, anchor="w")
    kicker(c, s["kicker"], 36, 368, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 32)
    y = 328
    for line in s["title"].split("\n"):
        c.drawString(36, y, line)
        y -= 38
    c.setFillColor(Color(0.78, 0.76, 0.70))
    c.setFont("DejaVu", 12)
    c.drawString(36, y - 6, s["sub"])
    x = 36
    for val, lab in s["stats"]:
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.6)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 78, 270, 78, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 154, 270, 2.2, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 20)
        c.drawString(x + 16, 118, val)
        c.setFillColor(Color(0.75, 0.73, 0.66))
        c.setFont("DejaVu", 8.5)
        yy = 100
        for bit in lab.split("\n"):
            c.drawString(x + 16, yy, bit)
            yy -= 11
        x += 286
    footer(c, n, total, True)


def draw_statement(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 26)
    y = 448
    for line in s["title"].split("\n"):
        c.drawString(36, y, line)
        y -= 32
    wrap(c, s["body"], "DejaVu", 12, 36, y - 8, 860, 16, SLATE, 4)
    x = 36
    for val, lab in s["stats"]:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.4)
        c.roundRect(x, 48, 286, 92, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 138, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 16)
        c.drawString(x + 14, 108, val)
        wrap(c, lab, "DejaVu", 8.5, x + 14, 90, 256, 11, SLATE, 3)
        x += 302
    footer(c, n, total)


def draw_cards(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, 452, s["title"])
    x = 36
    for num, title, body, proof in s["cards"]:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 70, 286, 340, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 408, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 11)
        c.drawString(x + 18, 372, num)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 18, 338, title)
        wrap(c, body, "DejaVu", 11, x + 18, 300, 250, 15, SLATE, 6)
        c.setFillColor(Color(0.965, 0.945, 0.905))
        c.rect(x + 1, 71, 284, 72, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(x + 18, 128, 28, 1.4, fill=1, stroke=0)
        wrap(c, proof, "DejaVu", 9.5, x + 18, 112, 250, 13, INK, 3)
        x += 302
    footer(c, n, total)


def draw_split(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, 452, s["title"])
    boxes = [(36, s["left_title"], s["left"], GREEN), (492, s["right_title"], s["right"], RED)]
    for x, title, items, tone in boxes:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 48, 432, 380, 3, fill=1, stroke=1)
        c.setFillColor(tone)
        c.rect(x, 426, 432, 2.2, fill=1, stroke=0)
        c.setFillColor(tone)
        c.setFont("DejaVuBold", 11)
        c.drawString(x + 18, 396, title.upper())
        y = 360
        for item in items:
            c.setFillColor(tone)
            c.circle(x + 24, y + 3, 2.4, fill=1, stroke=0)
            h = wrap(c, item, "DejaVu", 11, x + 36, y, 376, 14.5, INK, 3)
            y -= h + 14
    footer(c, n, total)


def draw_modules(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, 452, s["title"])
    positions = [(36, 250), (332, 250), (628, 250), (36, 56), (332, 56), (628, 56)]
    for (x, y), (num, text, proof) in zip(positions, s["items"]):
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, y, 280, 168, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, y + 166, 280, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 16, y + 128, num)
        wrap(c, text, "DejaVu", 10, x + 16, y + 104, 248, 13, SLATE, 3)
        c.setFillColor(GOLD)
        c.rect(x + 16, y + 52, 24, 1.3, fill=1, stroke=0)
        wrap(c, proof, "DejaVu", 8.5, x + 16, y + 38, 248, 11.5, INK, 2)
    footer(c, n, total)


def draw_money(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 26)
    y = 448
    for line in s["title"].split("\n"):
        c.drawString(36, y, line)
        y -= 32
    top = y - 16
    for i, (name, amount) in enumerate(s["rows"]):
        yy = top - i * 52
        c.setFillColor(CARD)
        c.roundRect(36, yy - 28, 888, 44, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, yy - 28, 3, 44, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 12)
        c.drawString(52, yy - 12, name)
        c.setFont("DejaVuSerif", 14)
        c.drawRightString(908, yy - 12, amount)
    c.setFillColor(COVER)
    c.roundRect(36, 48, 888, 52, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuSerif", 14)
    c.drawString(52, 68, "822,90 €")
    c.setFillColor(Color(0.82, 0.80, 0.74))
    c.setFont("DejaVu", 10)
    c.drawString(150, 70, "El 1,6 % de 50.000 €. El 98,4 % queda para coches.")
    footer(c, n, total)


def short_name(name):
    return (name.replace("Mercedes-Benz ", "").replace("Volkswagen ", ""))


def draw_lot(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 498)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 20)
    c.drawString(36, 472, s["title"])
    wrap(c, s["note"], "DejaVu", 8.5, 36, 452, 888, 11, SLATE, 2)
    headers = ["Unidad", "Coste", "Venta", "Neto", ""]
    xs = [48, 330, 410, 490, 575]
    c.setFillColor(INK)
    c.rect(36, 412, 888, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(xs[0], 417, headers[0])
    for x, h in zip(xs[1:4], headers[1:4]):
        c.drawRightString(x + 52, 417, h)
    max_net = max(u["net"] for u in s["rows"])
    for i, u in enumerate(s["rows"]):
        y = 390 - i * 36
        if i % 2 == 0:
            c.setFillColor(CARD)
            c.rect(36, y - 8, 888, 32, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 9)
        c.drawString(48, y, short_name(u["name"]))
        c.setFont("DejaVu", 9)
        c.drawRightString(382, y, eur(u["cost"]))
        c.drawRightString(462, y, eur(u["sell"]))
        c.setFont("DejaVuBold", 9)
        c.setFillColor(GREEN)
        c.drawRightString(542, y, eur(u["net"]))
        c.setFillColor(GREEN)
        c.roundRect(560, y - 2, 340 * (u["net"] / max_net), 11, 1, fill=1, stroke=0)
    t = s["totals"]
    c.setFillColor(COVER)
    c.rect(36, 128, 888, 22, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8.5)
    c.drawString(48, 135, "Lote de siete")
    c.drawRightString(382, 135, eur(t["cost"]))
    c.drawRightString(462, 135, eur(t["sell"]))
    c.setFillColor(GOLD)
    c.drawRightString(542, 135, eur(t["net"]))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8)
    c.drawString(36, 100, "Media 3.781 €. IVA ya descontado: " + eur(t["rebu"], 0) + ". En la web el 116d está a 12.475 € y el 318d a 17.250 €; el neto medio baja a 3.545 €.")
    footer(c, n, total)


def draw_pilot(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 508)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 20)
    c.drawString(36, 482, s["title"])
    headers = ["Día", "Qué ocurre", "Movimiento", "Caja"]
    xs = [44, 90, 700, 860]
    c.setFillColor(INK)
    c.rect(36, 456, 888, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7.5)
    for x, h in zip(xs, headers):
        c.drawString(x, 461, h)
    for i, (day, what, move, cash) in enumerate(s["rows"]):
        y = 438 - i * 28
        if i % 2 == 0:
            c.setFillColor(Color(1, 1, 1))
            c.rect(36, y - 6, 888, 26, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8.5)
        c.drawString(44, y, day)
        c.setFillColor(INK)
        c.setFont("DejaVu", 8.5)
        c.drawString(90, y, what)
        c.setFont("DejaVuBold", 8.5)
        c.setFillColor(GREEN if move.startswith("+") else INK)
        c.drawRightString(780, y, move + " €" if move != "—" else "—")
        c.setFillColor(INK)
        c.drawRightString(912, y, cash + " €")
    wrap(c, s["foot"], "DejaVu", 8.5, 36, 78, 888, 11, SLATE, 2)
    footer(c, n, total)


def draw_two(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, 452, s["title"])
    for x, title, items, tone in ((36, s["a_title"], s["a"], INK), (492, s["b_title"], s["b"], GOLD_DEEP)):
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 48, 432, 380, 3, fill=1, stroke=1)
        c.setFillColor(tone)
        c.rect(x, 426, 432, 2.2, fill=1, stroke=0)
        c.setFont("DejaVuBold", 12)
        c.drawString(x + 18, 396, title.upper())
        y = 356
        for item in items:
            c.setFillColor(GOLD)
            c.circle(x + 26, y + 3, 2.3, fill=1, stroke=0)
            h = wrap(c, item, "DejaVu", 11.5, x + 38, y, 372, 15, INK, 3)
            y -= h + 16
    footer(c, n, total)


def draw_nave(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 500)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 18)
    c.drawString(36, 476, s["title"])
    x = 36
    for val, lab in s["cards"]:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 368, 286, 96, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 462, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 16)
        c.drawString(x + 12, 430, val)
        wrap(c, lab, "DejaVu", 7.5, x + 12, 412, 262, 9.5, SLATE, 4)
        x += 302
    headers = ["Servicio", "Recambio", "Mano de obra", "Ticket", "Beneficio contado"]
    widths = [250, 140, 150, 140, 168]
    c.setFillColor(INK)
    c.rect(36, 338, 888, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7.5)
    hx = 48
    for h, w in zip(headers, widths):
        c.drawString(hx, 343, h)
        hx += w
    for i, row in enumerate(s["services"]):
        y = 316 - i * 28
        if i % 2 == 0:
            c.setFillColor(CARD)
            c.rect(36, y - 8, 888, 26, fill=1, stroke=0)
        c.setFillColor(INK if row[-1] != "0 €" else SLATE)
        c.setFont("DejaVuBold" if i == 0 else "DejaVu", 9)
        hx = 48
        for cell, w in zip(row, widths):
            c.drawString(hx, y, cell)
            hx += w
    wrap(c, s["body"], "DejaVu", 9.5, 36, 178, 888, 13, INK, 3)
    footer(c, n, total)


def draw_ledger(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 498)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 22)
    c.drawString(36, 466, s["title"])
    for x, title, rows, tone in (
        (36, s["left_title"], s["left"], INK),
        (492, s["right_title"], s["right"], GOLD_DEEP),
    ):
        c.setFillColor(tone)
        c.setFont("DejaVuBold", 9)
        c.drawString(x, 438, title.upper())
        for i, (name, amount) in enumerate(rows):
            y = 404 - i * 46
            c.setFillColor(CARD)
            c.roundRect(x, y - 10, 432, 38, 3, fill=1, stroke=0)
            c.setFillColor(GOLD)
            c.rect(x, y - 10, 3, 38, fill=1, stroke=0)
            c.setFillColor(INK)
            c.setFont("DejaVu", 9)
            c.drawString(x + 14, y + 2, name)
            c.setFont("DejaVuSerif", 11)
            c.drawRightString(x + 416, y + 2, amount)
    wrap(c, s["note"], "DejaVu", 9, 36, 78, 888, 12, SLATE, 2)
    footer(c, n, total)


def draw_ratio(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 22)
    c.drawString(36, 454, s["title"])
    c.setFillColor(INK)
    c.rect(36, 412, 888, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    for x, h in ((48, "Lectura"), (470, "Ventas"), (560, "RCSD"), (640, "Qué significa")):
        c.drawString(x, 418, h)
    for i, (name, sales, ratio, meaning) in enumerate(s["rows"]):
        y = 378 - i * 52
        c.setFillColor(CARD if i % 2 == 0 else Color(0.955, 0.949, 0.935))
        c.roundRect(36, y - 10, 888, 44, 2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 10)
        c.drawString(48, y + 4, name)
        c.drawString(478, y + 4, sales)
        c.setFont("DejaVuSerif", 14)
        c.setFillColor(GREEN if ratio not in ("1,06×",) else GOLD_DEEP)
        c.drawString(552, y + 2, ratio)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 9)
        c.drawString(640, y + 4, meaning)
    wrap(c, s["note"], "DejaVu", 10, 36, 78, 888, 13, SLATE, 2)
    footer(c, n, total)


def draw_cash(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 498)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 20)
    c.drawString(36, 472, s["title"])
    a, b = s["series_a"], s["series_b"]
    max_v = 20000
    left, right, bottom, top = 92, 880, 156, 410

    def xy(i, v):
        return left + i * ((right - left) / 11), bottom + (v / max_v) * (top - bottom)

    c.setFont("DejaVu", 7)
    for tick in (0, 5000, 10000, 15000, 20000):
        y = bottom + (tick / max_v) * (top - bottom)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.5)
        c.line(left, y, right, y)
        c.setFillColor(SLATE)
        c.drawRightString(left - 8, y - 2, "0" if tick == 0 else f"{tick // 1000} mil")
    for series, color in ((a, INK), (b, GOLD_DEEP)):
        c.setStrokeColor(color)
        c.setFillColor(color)
        c.setLineWidth(2.2)
        path = c.beginPath()
        for i, v in enumerate(series):
            x, y = xy(i, v)
            if i == 0:
                path.moveTo(x, y)
            else:
                path.lineTo(x, y)
        c.drawPath(path, stroke=1, fill=0)
        for i, v in enumerate(series):
            x, y = xy(i, v)
            c.circle(x, y, 2.5, fill=1, stroke=0)
    c.setFont("DejaVuBold", 8)
    x, y = xy(0, a[0])
    c.setFillColor(INK)
    c.drawString(x + 10, y + 14, eur(round(a[0])))
    x, y = xy(0, b[0])
    c.setFillColor(GOLD_DEEP)
    c.drawString(x + 10, y - 14, eur(round(b[0])))
    x, y = xy(11, a[-1])
    c.setFillColor(INK)
    c.drawRightString(x - 8, y + 8, eur(round(a[-1])))
    x, y = xy(11, b[-1])
    c.setFillColor(GOLD_DEEP)
    c.drawRightString(x - 8, y - 12, eur(round(b[-1])))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7.5)
    for i in range(12):
        x, _ = xy(i, 0)
        c.drawCentredString(x, 140, f"M{i + 1}")
    c.setFillColor(INK)
    c.rect(92, 116, 16, 3, fill=1, stroke=0)
    c.setFont("DejaVu", 8)
    c.drawString(114, 113, "Reforma después del primer cobro")
    c.setFillColor(GOLD_DEEP)
    c.rect(340, 116, 16, 3, fill=1, stroke=0)
    c.setFillColor(INK)
    c.drawString(362, 113, "Reforma pagada en el mes 1")
    wrap(c, s["note"], "DejaVu", 9, 36, 96, 888, 12, SLATE, 2)
    footer(c, n, total)


def draw_uses(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, 452, s["title"])
    x = 36
    for val, lab in s["big"]:
        c.setFillColor(COVER)
        c.roundRect(x, 280, 286, 140, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(x, 418, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 22)
        c.drawString(x + 16, 360, val)
        wrap(c, lab, "DejaVu", 10, x + 16, 332, 254, 13, Color(0.82, 0.80, 0.74), 2)
        x += 302
    wrap(c, s["body"], "DejaVu", 12.5, 36, 230, 888, 17, INK, 5)
    footer(c, n, total)


def draw_risks(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, 452, s["title"])
    for i, (risk, answer) in enumerate(s["rows"]):
        y = 360 - i * 78
        c.setFillColor(CARD)
        c.roundRect(36, y, 888, 66, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y, 3.2, 66, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 12)
        c.drawString(54, y + 38, risk)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 11)
        c.drawString(54, y + 16, answer)
    footer(c, n, total)


def draw_close(c, s, n, total):
    draw_bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    kicker(c, s["kicker"], 36, 470, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 32)
    y = 420
    for line in s["title"].split("\n"):
        c.drawString(36, y, line)
        y -= 38
    wrap(c, s["body"], "DejaVu", 12, 36, y - 8, 860, 16, Color(0.78, 0.76, 0.70), 4)
    x = 36
    for val, lab in s["stats"]:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 78, 270, 72, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 16, 112, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 9)
        c.drawString(x + 16, 94, lab.upper())
        x += 286
    footer(c, n, total, True)


def draw_sources(c, s, n, total):
    draw_bg(c)
    kicker(c, s["kicker"], 36, 490)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 22)
    c.drawString(36, 454, s["title"])
    y = 410
    for item in s["items"]:
        c.setFillColor(GOLD)
        c.circle(46, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 11, 60, y, 860, 14.5, INK, 3)
        y -= h + 12
    footer(c, n, total)


DRAW = {
    "cover": draw_cover,
    "statement": draw_statement,
    "cards": draw_cards,
    "split": draw_split,
    "modules": draw_modules,
    "money": draw_money,
    "lot": draw_lot,
    "pilot": draw_pilot,
    "two": draw_two,
    "nave": draw_nave,
    "ledger": draw_ledger,
    "ratio": draw_ratio,
    "cash": draw_cash,
    "uses": draw_uses,
    "risks": draw_risks,
    "close": draw_close,
    "sources": draw_sources,
}


def flatten_logo():
    try:
        from PIL import Image
    except ImportError:
        return
    if not LOGO.exists():
        return
    im = Image.open(LOGO).convert("RGBA")
    w, h = im.size
    im = im.crop((4, 4, w - 4, h - 4))
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                px[x, y] = (0, 0, 0, 0)
                continue
            silver = r > 68 and g > 68 and b > 68 and abs(r - b) < 48
            gold = r > 105 and r > b + 18 and g > 55
            if not (silver or gold):
                px[x, y] = (0, 0, 0, 0)
    bbox = im.getbbox()
    if not bbox:
        return
    pad = 20
    x0, y0, x1, y1 = bbox
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
    im = im.resize((640, max(1, round(im.height * 640 / im.width))), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", im.size, (33, 34, 40))
    bg.paste(im, mask=im.split()[-1])
    dest = HERE / "presentacion"
    dest.mkdir(exist_ok=True)
    bg.save(dest / "logo_flat.png", "PNG")


def write_pdf(deck):
    c = canvas.Canvas(str(OUT_PDF), pagesize=(W, H))
    c.setTitle("Plan de negocio — KHC Auto Import")
    c.setAuthor("KHC Auto Import")
    total = len(deck.slides)
    for i, slide in enumerate(deck.slides, 1):
        DRAW[slide["kind"]](c, slide, i, total)
        c.showPage()
    c.save()


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def write_html(deck):
    parts = []
    for i, s in enumerate(deck.slides):
        kind = s["kind"]
        inner = ""
        if kind == "cover":
            stats = "".join(f"<div class='stat'><b>{esc(a)}</b><span>{esc(b).replace(chr(10), '<br>')}</span></div>" for a, b in s["stats"])
            inner = f"<img class='logo' src='logo_flat.png' alt='KHC Auto Import'><p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title']).replace(chr(10), '<br>')}</h1><p class='sub'>{esc(s['sub'])}</p><div class='stats'>{stats}</div>"
            cls = "dark"
        elif kind == "statement":
            stats = "".join(f"<div class='stat light'><b>{esc(a)}</b><span>{esc(b)}</span></div>" for a, b in s["stats"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title']).replace(chr(10), '<br>')}</h1><p class='lead'>{esc(s['body'])}</p><div class='stats'>{stats}</div>"
            cls = ""
        elif kind == "cards":
            cards = "".join(f"<article><em>{esc(n)}</em><h3>{esc(t)}</h3><p>{esc(b)}</p><small>{esc(p)}</small></article>" for n, t, b, p in s["cards"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='grid3'>{cards}</div>"
            cls = ""
        elif kind == "split":
            left = "".join(f"<li>{esc(x)}</li>" for x in s["left"])
            right = "".join(f"<li>{esc(x)}</li>" for x in s["right"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='split'><section class='good'><h3>{esc(s['left_title'])}</h3><ul>{left}</ul></section><section class='bad'><h3>{esc(s['right_title'])}</h3><ul>{right}</ul></section></div>"
            cls = ""
        elif kind == "modules":
            items = "".join(f"<article><b>{esc(a)}</b><p>{esc(b)}</p><small>{esc(p)}</small></article>" for a, b, p in s["items"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='grid3'>{items}</div>"
            cls = ""
        elif kind == "money":
            rows = "".join(f"<div class='line'><span>{esc(a)}</span><b>{esc(b)}</b></div>" for a, b in s["rows"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title']).replace(chr(10), '<br>')}</h1>{rows}<p class='note'>{esc(s['note'])}</p>"
            cls = ""
        elif kind == "lot":
            max_net = max(u["net"] for u in s["rows"])
            rows = "".join(
                f"<tr><td>{esc(short_name(u['name']))}</td><td class='num'>{esc(eur(u['cost']))}</td><td class='num'>{esc(eur(u['sell']))}</td><td class='num ratio'>{esc(eur(u['net']))}</td><td><i class='mini' style='width:{u['net']/max_net*100:.0f}%'></i></td></tr>"
                for u in s["rows"]
            )
            t = s["totals"]
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><p class='note'>{esc(s['note'])}</p><table><thead><tr><th>Unidad</th><th>Coste</th><th>Venta</th><th>Neto</th><th></th></tr></thead><tbody>{rows}<tr class='total'><td>Lote de siete</td><td class='num'>{esc(eur(t['cost']))}</td><td class='num'>{esc(eur(t['sell']))}</td><td class='num'>{esc(eur(t['net']))}</td><td></td></tr></tbody></table>"
            cls = ""
        elif kind == "pilot":
            rows = "".join(
                f"<tr><td>{esc(a)}</td><td>{esc(b)}</td><td class='num'>{esc(c)}</td><td class='num'>{esc(d)} €</td></tr>"
                for a, b, c, d in s["rows"]
            )
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><table><thead><tr><th>Día</th><th>Qué ocurre</th><th>Movimiento</th><th>Caja</th></tr></thead><tbody>{rows}</tbody></table><p class='note'>{esc(s['foot'])}</p>"
            cls = ""
        elif kind == "two":
            aa = "".join(f"<li>{esc(x)}</li>" for x in s["a"])
            bb = "".join(f"<li>{esc(x)}</li>" for x in s["b"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='split'><section><h3>{esc(s['a_title'])}</h3><ul>{aa}</ul></section><section class='gold'><h3>{esc(s['b_title'])}</h3><ul>{bb}</ul></section></div>"
            cls = ""
        elif kind == "nave":
            cards = "".join(f"<article><b>{esc(a)}</b><p>{esc(b)}</p></article>" for a, b in s["cards"])
            rows = "".join(f"<tr>{''.join(f'<td>{esc(cell)}</td>' for cell in row)}</tr>" for row in s["services"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='grid3'>{cards}</div><table><thead><tr><th>Servicio</th><th>Recambio</th><th>Mano de obra</th><th>Ticket</th><th>Beneficio contado</th></tr></thead><tbody>{rows}</tbody></table><p class='note'>{esc(s['body'])}</p>"
            cls = ""
        elif kind == "ledger":
            def lines(rows):
                return "".join(f"<div class='line{' last' if i == len(rows)-1 else ''}'><span>{esc(a)}</span><b>{esc(b)}</b></div>" for i, (a, b) in enumerate(rows))
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='split'><section><h3>{esc(s['left_title'])}</h3>{lines(s['left'])}</section><section><h3>{esc(s['right_title'])}</h3>{lines(s['right'])}</section></div><p class='note'>{esc(s['note'])}</p>"
            cls = ""
        elif kind == "ratio":
            rows = "".join(
                f"<tr><td>{esc(a)}</td><td class='num'>{esc(b)}</td><td class='num ratio'>{esc(c)}</td><td>{esc(d)}</td></tr>"
                for a, b, c, d in s["rows"]
            )
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><table><thead><tr><th>Lectura</th><th>Ventas</th><th>RCSD</th><th>Qué significa</th></tr></thead><tbody>{rows}</tbody></table><p class='note'>{esc(s['note'])}</p>"
            cls = ""
        elif kind == "cash":
            max_v = 20000
            def poly(series):
                pts = []
                for i, v in enumerate(series):
                    x = 70 + i * (680 / 11)
                    y = 210 - (v / max_v) * 170
                    pts.append(f"{x:.1f},{y:.1f}")
                return " ".join(pts)
            def dots(series, css):
                out = []
                for i, v in enumerate(series):
                    x = 70 + i * (680 / 11)
                    y = 210 - (v / max_v) * 170
                    out.append(f"<circle cx='{x:.1f}' cy='{y:.1f}' r='3.2' class='{css}'/>")
                return "".join(out)
            grid = "".join(
                f"<line x1='70' y1='{210 - tick/max_v*170:.1f}' x2='750' y2='{210 - tick/max_v*170:.1f}' class='grid'/><text x='62' y='{214 - tick/max_v*170:.1f}' class='axis'>{'0' if tick==0 else str(tick//1000)+' mil'}</text>"
                for tick in (0, 5000, 10000, 15000, 20000)
            )
            labels = "".join(f"<span>M{i}</span>" for i in range(1, 13))
            a0, a1 = eur(round(s["series_a"][0])), eur(round(s["series_a"][-1]))
            b0, b1 = eur(round(s["series_b"][0])), eur(round(s["series_b"][-1]))
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><svg viewBox='0 0 800 240' class='chart'>{grid}<polyline points='{poly(s['series_a'])}' class='ink'/>{dots(s['series_a'], 'inkdot')}<polyline points='{poly(s['series_b'])}' class='goldline'/>{dots(s['series_b'], 'golddot')}<text x='84' y='{210 - s['series_a'][0]/max_v*170 - 8:.0f}' class='tag'>{esc(a0)}</text><text x='84' y='{210 - s['series_b'][0]/max_v*170 + 16:.0f}' class='tag goldtext'>{esc(b0)}</text><text x='740' y='{210 - s['series_a'][-1]/max_v*170 - 8:.0f}' text-anchor='end' class='tag'>{esc(a1)}</text><text x='740' y='{210 - s['series_b'][-1]/max_v*170 + 16:.0f}' text-anchor='end' class='tag goldtext'>{esc(b1)}</text></svg><div class='months'>{labels}</div><p class='legend'><i class='inkswatch'></i> Reforma después del primer cobro <i class='goldswatch'></i> Reforma pagada en el mes 1</p><p class='note'>{esc(s['note'])}</p>"
            cls = ""
        elif kind == "uses":
            cards = "".join(f"<article class='darkcard'><b>{esc(a)}</b><p>{esc(b)}</p></article>" for a, b in s["big"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='grid3'>{cards}</div><p class='lead'>{esc(s['body'])}</p>"
            cls = ""
        elif kind == "risks":
            rows = "".join(f"<article><b>{esc(a)}</b><p>{esc(b)}</p></article>" for a, b in s["rows"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><div class='stack'>{rows}</div>"
            cls = ""
        elif kind == "close":
            stats = "".join(f"<div class='stat'><b>{esc(a)}</b><span>{esc(b)}</span></div>" for a, b in s["stats"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title']).replace(chr(10), '<br>')}</h1><p class='lead light'>{esc(s['body'])}</p><div class='stats'>{stats}</div>"
            cls = "dark"
        else:
            items = "".join(f"<li>{esc(x)}</li>" for x in s["items"])
            inner = f"<p class='kicker'>{esc(s['kicker'])}</p><h1>{esc(s['title'])}</h1><ul class='sources'>{items}</ul>"
            cls = ""
        parts.append(f"<section class='slide {cls}' data-i='{i}'>{inner}<footer><span>KHC AUTO IMPORT</span><span>{i+1:02d} / {len(deck.slides):02d}</span></footer></section>")

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plan de negocio — KHC Auto Import</title>
<style>
  :root {{ --ink:#0a1020; --gold:#b3934e; --ivory:#f7f6f2; --cover:#212228; --slate:#4a5872; --green:#1f6b4a; --line:#e4dfd4; }}
  * {{ box-sizing:border-box; }}
  html, body {{ margin:0; height:100%; background:var(--cover); color:var(--ink); font-family: "Segoe UI", Helvetica, Arial, sans-serif; }}
  .slide {{ display:none; min-height:100vh; padding:7vh 7vw 8vh; flex-direction:column; background:var(--ivory); }}
  .slide.active {{ display:flex; }}
  .slide.dark {{ background:var(--cover); color:#f4f1ea; }}
  .logo {{ width:168px; height:auto; margin:0 0 18px; }}
  .kicker {{ letter-spacing:.14em; font-size:12px; font-weight:700; color:var(--gold); margin:0 0 12px; }}
  h1 {{ font-family: Georgia, "Times New Roman", serif; font-weight:500; font-size:clamp(28px, 3.6vw, 46px); line-height:1.08; margin:0 0 18px; max-width:28ch; }}
  .slide.dark h1 {{ max-width:16ch; }}
  .sub, .lead {{ font-size:18px; line-height:1.45; max-width:62ch; color:var(--slate); }}
  .lead.light, .slide.dark .sub {{ color:#cfc8ba; }}
  .stats, .grid3, .split {{ display:grid; gap:16px; margin-top:28px; }}
  .stats {{ grid-template-columns:repeat(3, 1fr); }}
  .grid3 {{ grid-template-columns:repeat(3, 1fr); }}
  .split {{ grid-template-columns:1fr 1fr; }}
  .stat, article, section {{ background:#fff; border:1px solid var(--line); border-top:3px solid var(--gold); border-radius:8px; padding:18px 18px 16px; }}
  .slide.dark .stat {{ background:#2a2b32; border-color:#3a3b44; color:#f4f1ea; }}
  .stat b, article b, .darkcard b {{ display:block; font-family:Georgia, serif; font-size:28px; font-weight:500; margin-bottom:6px; }}
  .stat span, article p, section li {{ color:var(--slate); font-size:15px; line-height:1.4; }}
  .slide.dark .stat span {{ color:#cfc8ba; }}
  .good {{ border-top-color:var(--green); }}
  .bad {{ border-top-color:#8c3a3a; }}
  .gold {{ border-top-color:var(--gold); }}
  h3 {{ margin:0 0 10px; font-size:13px; letter-spacing:.08em; text-transform:uppercase; }}
  ul {{ margin:0; padding-left:18px; }}
  li {{ margin:0 0 10px; line-height:1.4; }}
  .line {{ display:flex; justify-content:space-between; gap:24px; background:#fff; border-left:3px solid var(--gold); padding:14px 16px; margin:8px 0; }}
  .bars {{ margin-top:18px; }}
  .bar {{ display:grid; grid-template-columns:220px 1fr 90px; align-items:center; gap:12px; margin:8px 0; font-size:14px; }}
  .bar i {{ display:block; height:12px; background:var(--green); border-radius:2px; }}
  table {{ width:100%; border-collapse:collapse; font-size:14px; margin-top:8px; }}
  th {{ text-align:left; background:var(--ink); color:#fff; padding:8px 10px; font-size:12px; }}
  td {{ padding:7px 10px; border-bottom:1px solid var(--line); }}
  .num {{ text-align:right; font-variant-numeric:tabular-nums; }}
  .ratio {{ font-family:Georgia, serif; font-size:18px; }}
  .note {{ color:var(--slate); font-size:14px; line-height:1.45; margin-top:14px; }}
  .chart {{ width:100%; height:220px; margin-top:10px; }}
  .ink {{ fill:none; stroke:#0a1020; stroke-width:2.5; }}
  .goldline {{ fill:none; stroke:#b3934e; stroke-width:2.5; }}
  .inkdot {{ fill:#0a1020; }}
  .golddot {{ fill:#b3934e; }}
  .grid {{ stroke:#e4dfd4; stroke-width:1; }}
  .axis {{ fill:#4a5872; font-size:11px; text-anchor:end; }}
  .tag {{ fill:#0a1020; font-size:12px; font-weight:700; }}
  .goldtext {{ fill:#755d2b; }}
  .legend {{ color:#4a5872; font-size:14px; display:flex; gap:18px; align-items:center; }}
  .inkswatch, .goldswatch {{ display:inline-block; width:22px; height:3px; margin-right:6px; }}
  .inkswatch {{ background:#0a1020; }}
  .goldswatch {{ background:#b3934e; }}
  .mini {{ display:block; height:10px; background:#1f6b4a; border-radius:2px; }}
  tr.total td {{ background:#212228; color:#f4f1ea; font-weight:700; }}
  article small {{ display:block; margin-top:14px; color:#0a1020; font-size:14px; border-top:1px solid var(--line); padding-top:10px; }}
  .line.last {{ background:#212228; color:#f4f1ea; }}
  .line.last b {{ color:#b3934e; }}
  .months {{ display:flex; justify-content:space-between; color:var(--slate); font-size:12px; padding:0 4% 0 5%; }}
  .darkcard {{ background:var(--cover); color:#f4f1ea; border:0; }}
  .darkcard p {{ color:#cfc8ba; }}
  .stack article {{ margin-bottom:12px; }}
  .sources li {{ font-size:16px; }}
  footer {{ margin-top:auto; display:flex; justify-content:space-between; padding-top:18px; font-size:12px; letter-spacing:.08em; color:var(--gold); }}
  .progress {{ position:fixed; left:0; top:0; height:3px; background:var(--gold); width:0; }}
  .hint {{ position:fixed; right:18px; bottom:14px; color:#8a8172; font-size:12px; }}
  @media (max-width: 800px) {{
    .stats, .grid3, .split, .bar {{ grid-template-columns:1fr; }}
    h1 {{ font-size:32px; }}
  }}
</style>
</head>
<body>
<div class="progress" id="bar"></div>
{''.join(parts)}
<div class="hint">Flechas para avanzar · F para pantalla completa</div>
<script>
  const slides = [...document.querySelectorAll('.slide')];
  let i = 0;
  const bar = document.getElementById('bar');
  function show(n) {{
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    bar.style.width = ((i + 1) / slides.length * 100) + '%';
    history.replaceState(null, '', '#' + (i + 1));
  }}
  addEventListener('keydown', (e) => {{
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {{ e.preventDefault(); show(i + 1); }}
    if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) {{ e.preventDefault(); show(i - 1); }}
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(slides.length - 1);
    if (e.key === 'f' || e.key === 'F') {{
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }}
  }});
  addEventListener('click', (e) => {{
    if (e.target.closest('a, button')) return;
    show(e.clientX > innerWidth / 2 ? i + 1 : i - 1);
  }});
  show(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
</script>
</body>
</html>
"""
    OUT_HTML.parent.mkdir(exist_ok=True)
    OUT_HTML.write_text(html, encoding="utf-8")


def main():
    flatten_logo()
    deck = build_deck()
    write_pdf(deck)
    write_html(deck)
    print(OUT_PDF, OUT_PDF.stat().st_size)
    print(OUT_HTML, OUT_HTML.stat().st_size, "slides", len(deck.slides))


if __name__ == "__main__":
    main()

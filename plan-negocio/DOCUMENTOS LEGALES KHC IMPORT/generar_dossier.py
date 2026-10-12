#!/usr/bin/env python3
"""Dossier de aval. El margen es el del plan: el coste de compra ya incluye todo."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib.colors import Color, white
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Flowable,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(HERE))

FONT = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DejaVu", f"{FONT}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuBold", f"{FONT}/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerif", f"{FONT}/DejaVuSerif.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerifBold", f"{FONT}/DejaVuSerif-Bold.ttf"))

INK = Color(0.039, 0.063, 0.125)
INK_SOFT = Color(0.071, 0.106, 0.188)
GOLD = Color(0.702, 0.576, 0.306)
GOLD_DEEP = Color(0.459, 0.365, 0.169)
IVORY = Color(0.976, 0.973, 0.961)
IVORY_D = Color(0.945, 0.937, 0.914)
SLATE = Color(0.290, 0.345, 0.447)
GREEN = Color(0.122, 0.420, 0.290)
LINE = Color(0.855, 0.835, 0.788)
WHITE = white
COVER = Color(33 / 255, 34 / 255, 40 / 255)

PAGE_W, PAGE_H = A4
LEFT = 16 * mm
RIGHT = 16 * mm
TOP = 16.5 * mm
BOTTOM = 13 * mm
USABLE = PAGE_W - LEFT - RIGHT
CHARTS = Path("/tmp/khc_charts")
CHARTS.mkdir(exist_ok=True)
OUT = HERE / "Dossier_Aval_Sogarpo_KHC.pdf"
LOGO = REPO / "public" / "brand" / "logo-khc.png"
MODEL = {}


def eur(n, d=0):
    neg = float(n) < 0
    n = abs(float(n))
    s = f"{n:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" + s if neg else s) + " €"


def ratio(n):
    return f"{float(n):.2f}x".replace(".", ",")


S = {
    "h1": ParagraphStyle("h1", fontName="DejaVuSerifBold", fontSize=15.5, leading=19, textColor=INK, spaceBefore=0, spaceAfter=2),
    "h2": ParagraphStyle("h2", fontName="DejaVuBold", fontSize=10.5, leading=13.5, textColor=INK, spaceBefore=9, spaceAfter=3),
    "eyebrow": ParagraphStyle("eyebrow", fontName="DejaVuBold", fontSize=7.4, leading=9, textColor=GOLD_DEEP, spaceBefore=0, spaceAfter=2),
    "body": ParagraphStyle("body", fontName="DejaVu", fontSize=8.7, leading=12.0, textColor=INK_SOFT, alignment=TA_LEFT, spaceAfter=6),
    "bodyjust": ParagraphStyle("bodyjust", fontName="DejaVu", fontSize=8.7, leading=12.0, textColor=INK_SOFT, alignment=TA_JUSTIFY, spaceAfter=6),
    "small": ParagraphStyle("small", fontName="DejaVu", fontSize=7.6, leading=10.0, textColor=SLATE, spaceAfter=4),
    "tiny": ParagraphStyle("tiny", fontName="DejaVu", fontSize=6.7, leading=8.6, textColor=SLATE),
    "bullet": ParagraphStyle("bullet", fontName="DejaVu", fontSize=8.5, leading=11.3, textColor=INK_SOFT),
    "th": ParagraphStyle("th", fontName="DejaVuBold", fontSize=7.1, leading=9.0, textColor=WHITE),
    "td": ParagraphStyle("td", fontName="DejaVu", fontSize=7.2, leading=9.2, textColor=INK),
    "tdr": ParagraphStyle("tdr", fontName="DejaVu", fontSize=7.2, leading=9.2, textColor=INK, alignment=TA_RIGHT),
    "tdb": ParagraphStyle("tdb", fontName="DejaVuBold", fontSize=7.2, leading=9.2, textColor=INK),
    "tdbr": ParagraphStyle("tdbr", fontName="DejaVuBold", fontSize=7.2, leading=9.2, textColor=INK, alignment=TA_RIGHT),
    "kpi_n": ParagraphStyle("kpi_n", fontName="DejaVuSerifBold", fontSize=12.5, leading=15, textColor=INK, alignment=TA_CENTER),
    "kpi_l": ParagraphStyle("kpi_l", fontName="DejaVu", fontSize=6.5, leading=8.2, textColor=SLATE, alignment=TA_CENTER),
}


def P(text, style="body"):
    return Paragraph(text, S[style] if isinstance(style, str) else style)


def bullets(items):
    rows = [[P("—", "tiny"), P(item, "bullet")] for item in items]
    t = Table(rows, colWidths=[12, USABLE - 12])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 1.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.4),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD_DEEP),
    ]))
    return t


def h1(number, title):
    return KeepTogether([
        P(f"{number}    {title}", "h1"),
        HRFlowable(width="100%", thickness=0.7, color=GOLD, spaceBefore=1, spaceAfter=8),
    ])


def h2(title):
    return P(title, "h2")


class Callout(Flowable):
    def __init__(self, title, body, width=USABLE, tone="gold"):
        super().__init__()
        self.title = title
        self.body_p = P(body, "bullet")
        self.box_width = width
        self.tone = tone

    def wrap(self, aw, ah):
        w, h = self.body_p.wrap(self.box_width - 22, ah)
        self.width = self.box_width
        self.height = h + (28 if self.title else 16)
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(Color(0.98, 0.94, 0.91) if self.tone == "alert" else IVORY_D)
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(Color(0.55, 0.23, 0.23) if self.tone == "alert" else GOLD)
        c.rect(0, 0, 3.2, self.height, fill=1, stroke=0)
        if self.title:
            c.setFillColor(GOLD_DEEP)
            c.setFont("DejaVuBold", 7.2)
            c.drawString(12, self.height - 13, self.title.upper())
        self.body_p.drawOn(c, 12, 7)


def kpi_row(items):
    n = len(items)
    gap = 6
    w = (USABLE - gap * (n - 1)) / n
    cards = []
    for value, label in items:
        card = Table([[P(value, "kpi_n")], [P(label, "kpi_l")]], colWidths=[w - 8])
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), WHITE),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (0, 0), 7),
            ("BOTTOMPADDING", (0, -1), (-1, -1), 7),
            ("TOPPADDING", (0, 1), (-1, 1), 1),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ("LINEABOVE", (0, 0), (-1, 0), 2.2, GOLD),
        ]))
        cards.append(card)
    row = Table([cards], colWidths=[w] * n)
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-2, -1), gap),
        ("RIGHTPADDING", (-1, 0), (-1, 0), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return row


def table(headers, rows, widths, aligns=None, emphasize_last=False):
    data = [[P(h, "th") for h in headers]]
    for r in rows:
        line = []
        for i, cell in enumerate(r):
            style = "tdr" if aligns and aligns[i] == "RIGHT" else "td"
            if emphasize_last and r is rows[-1]:
                style = "tdbr" if style == "tdr" else "tdb"
            line.append(cell if isinstance(cell, Paragraph) else P(str(cell), style))
        data.append(line)
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, IVORY]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
        ("LINEBELOW", (0, 0), (-1, 0), 1.4, GOLD),
        ("LINEBELOW", (0, 1), (-1, -2), 0.2, LINE),
        ("ALIGN", (1, 0), (-1, 0), "RIGHT"),
    ]
    if emphasize_last:
        style += [
            ("BACKGROUND", (0, -1), (-1, -1), Color(0.96, 0.93, 0.86)),
            ("LINEABOVE", (0, -1), (-1, -1), 0.6, GOLD),
        ]
    t.setStyle(TableStyle(style))
    return t


def save_chart(fig, name):
    path = CHARTS / name
    fig.savefig(path, dpi=160, bbox_inches="tight", facecolor=fig.get_facecolor(), pad_inches=0.12)
    plt.close(fig)
    return str(path)


def style_ax(ax):
    ax.set_facecolor("#f9f8f5")
    ax.figure.set_facecolor("#f9f8f5")
    for sp in ("top", "right"):
        ax.spines[sp].set_visible(False)
    ax.spines["left"].set_color("#e4dfd4")
    ax.spines["bottom"].set_color("#e4dfd4")
    ax.tick_params(colors="#4a5872", labelsize=8)
    ax.grid(axis="y", color="#e6e1d6", linewidth=0.6)
    ax.set_axisbelow(True)


def chart_margins(units):
    labels = [u["name"].replace("Mercedes-Benz ", "").replace("Volkswagen ", "") for u in units][::-1]
    values = [u["net"] for u in units][::-1]
    fig, ax = plt.subplots(figsize=(7.35, 3.15))
    style_ax(ax)
    ax.barh(labels, values, color="#1f6b4a", height=0.62)
    ceiling = max(values) * 1.22
    for i, v in enumerate(values):
        ax.text(v + 60, i, f"{v:,.0f} €".replace(",", "."), va="center", fontsize=8, color="#0a1020")
    ax.set_xlim(0, ceiling)
    ax.set_xlabel("Margen neto real, €", fontsize=8, color="#4a5872")
    ax.tick_params(axis="y", length=0, labelsize=7.4)
    fig.tight_layout()
    return save_chart(fig, "margins.png")


def chart_dscr(rows):
    labels = [r[0] for r in rows]
    values = [r[1] for r in rows]
    colors = ["#1f6b4a" if v >= 1.30 else "#b08a3e" if v >= 1.0 else "#8c3a3a" for v in values]
    fig, ax = plt.subplots(figsize=(7.35, 2.7))
    style_ax(ax)
    ax.bar(labels, values, color=colors, width=0.62)
    ax.axhline(1.30, color="#1d2840", linestyle="--", linewidth=0.9)
    ax.text(len(labels) - 0.55, 1.34, "1,30x", fontsize=7.5, color="#1d2840")
    for i, v in enumerate(values):
        ax.text(i, v + 0.05, f"{v:.2f}x".replace(".", ","), ha="center", fontsize=8, color="#0a1020")
    ax.set_ylim(0, max(values) * 1.25)
    ax.set_ylabel("RCSD", fontsize=8, color="#4a5872")
    fig.tight_layout()
    return save_chart(fig, "dscr.png")


def chart_cash(base, reform):
    fig, ax = plt.subplots(figsize=(7.35, 2.7))
    style_ax(ax)
    x = [r["month"] for r in base]
    ax.plot(x, [r["end"] for r in base], color="#1d2840", linewidth=2.0, marker="o", markersize=3.5, label="Reforma después del primer cobro")
    ax.plot(x, [r["end"] for r in reform], color="#b3934e", linewidth=1.8, marker="o", markersize=3.2, label="Reforma pagada en el mes 1")
    ax.axhline(0, color="#e4dfd4", linewidth=0.6)
    ax.set_xticks(x)
    ax.set_xticklabels([f"M{m}" for m in x], fontsize=7.5)
    ax.set_ylabel("Caja al cierre, €", fontsize=8, color="#4a5872")
    ax.legend(frameon=False, fontsize=7.2, loc="upper left")
    fig.tight_layout()
    return save_chart(fig, "cash.png")


def chart_uses(stock, residual):
    labels = ["Caja que queda el día 1", "Siete coches, coste ya completo"]
    values = [residual, stock]
    fig, ax = plt.subplots(figsize=(7.35, 1.7))
    style_ax(ax)
    ax.barh(labels, values, color=["#b3934e", "#1d2840"], height=0.55)
    ceiling = stock * 1.28
    for i, v in enumerate(values):
        ax.text(v + ceiling * 0.015, i, f"{v:,.0f} €".replace(",", "."), va="center", fontsize=8, color="#0a1020")
    ax.set_xlim(0, ceiling)
    ax.tick_params(axis="y", length=0, labelsize=8)
    fig.tight_layout()
    return save_chart(fig, "uses.png")


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
    pad = 28
    x0, y0, x1, y1 = bbox
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
    target_w = 720
    im = im.resize((target_w, max(1, round(im.height * target_w / im.width))), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", im.size, (33, 34, 40))
    bg.paste(im, mask=im.split()[-1])
    bg.save(CHARTS / "logo_flat.png", "PNG")


def draw_cover(canvas, doc):
    c = canvas
    c.saveState()
    c.setFillColor(COVER)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 7, PAGE_W, 7, fill=1, stroke=0)
    c.rect(0, 0, PAGE_W, 7, fill=1, stroke=0)
    logo_flat = CHARTS / "logo_flat.png"
    if logo_flat.exists():
        iw, ih = ImageReader(str(logo_flat)).getSize()
        dw = 248
        dh = dw * ih / iw
        bottom = 546
        if dh > 150:
            dh = 150
            dw = dh * iw / ih
        c.drawImage(str(logo_flat), (PAGE_W - dw) / 2, bottom, width=dw, height=dh, mask=None)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 8)
    c.drawCentredString(PAGE_W / 2, 532, "DOSSIER DE SOLICITUD DE AVAL")
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 22)
    c.drawCentredString(PAGE_W / 2, 492, "Viabilidad para el comité")
    c.setFont("DejaVuSerif", 13)
    c.setFillColor(Color(0.86, 0.84, 0.78))
    c.drawCentredString(PAGE_W / 2, 470, "KHC Auto Import  ·  Galicia")
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.6)
    c.line(170, 452, PAGE_W - 170, 452)
    c.setFillColor(Color(0.78, 0.76, 0.70))
    c.setFont("DejaVu", 8.5)
    c.drawCentredString(PAGE_W / 2, 432, "Preparado para Sogarpo SGR y la banca de empresas")
    c.drawCentredString(PAGE_W / 2, 418, "11 de octubre de 2026   ·   Márgenes del propio plan, no una certificación")

    stress = MODEL["scenarios"]["stress_12"]["dscr"]
    avg = MODEL["totals"]["avg_net"]
    boxes = [
        ("50.000 €", "Aval solicitado"),
        (eur(avg), "Margen neto real"),
        (ratio(stress), "RCSD a 1 venta/mes"),
    ]
    bw, bh, gap = 148, 62, 12
    x0 = (PAGE_W - (bw * 3 + gap * 2)) / 2
    y0 = 300
    for i, (val, lab) in enumerate(boxes):
        x = x0 + i * (bw + gap)
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.6)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, y0, bw, bh, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, y0 + bh - 2.4, bw, 2.4, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 14)
        c.drawCentredString(x + bw / 2, y0 + 30, val)
        c.setFillColor(Color(0.75, 0.73, 0.66))
        c.setFont("DejaVu", 7)
        c.drawCentredString(x + bw / 2, y0 + 14, lab.upper())

    c.setFillColor(GOLD)
    c.setFont("DejaVu", 8)
    c.drawCentredString(PAGE_W / 2, 268, "El coste de compra ya incluye coche, transporte, matriculación y puesta a la venta.")
    c.setFillColor(Color(0.72, 0.70, 0.64))
    c.setFont("DejaVu", 7.4)
    lines = [
        "Cifras del plan de viabilidad y del motor del ERP. No son cuentas auditadas",
        "y no hay ventas cobradas. El 15 % de sociedades y la cuota de Sogarpo",
        "se confirman con la gestoría antes de la firma.",
    ]
    y = 214
    for line in lines:
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= 11
    c.setFillColor(GOLD)
    c.setFont("DejaVu", 7.2)
    c.drawCentredString(PAGE_W / 2, 78, "CONFIDENCIAL   ·   MÁRGENES DEL PLAN   ·   COSTE DE COMPRA YA CERRADO")
    c.restoreState()


def draw_later(canvas, doc):
    c = canvas
    c.saveState()
    c.setFillColor(IVORY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 3.2, PAGE_W, 3.2, fill=1, stroke=0)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 7)
    c.drawString(LEFT, PAGE_H - 28, "KHC AUTO IMPORT")
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7)
    c.drawRightString(PAGE_W - RIGHT, PAGE_H - 28, "Dossier de aval  ·  confidencial")
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.line(LEFT, PAGE_H - 34, PAGE_W - RIGHT, PAGE_H - 34)
    c.line(LEFT, 28, PAGE_W - RIGHT, 28)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 6.6)
    c.drawString(LEFT, 16, "Plan de viabilidad  ·  11 de octubre de 2026  ·  márgenes del propio plan")
    c.setFillColor(INK)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(PAGE_W - RIGHT, 15, f"{doc.page:02d}")
    c.restoreState()


def build_story(m):
    t = m["totals"]
    o = m["opex_month"]
    loan = m["loan"]
    f = m["funds"]
    stress = m["scenarios"]["stress_12"]
    base = m["scenarios"]["base_30"]
    tax23 = m["scenarios"]["stress_23"]
    price5 = m["scenarios"]["price_5"]
    web = m["scenarios"]["web_prices"]
    charts = {
        "margins": chart_margins(m["lot"]),
        "dscr": chart_dscr([
            ("1 venta\nal mes", stress["dscr"]),
            ("Precios\nde la web", web["dscr"]),
            ("Impuesto\nal 23 %", tax23["dscr"]),
            ("Precio\n−5 %", price5["dscr"]),
        ]),
        "cash": chart_cash(m["cash_base"], m["cash_reform_m1"]),
        "uses": chart_uses(f["stock"], f["residual"]),
    }
    short = {
        "Mercedes-Benz Clase C Estate 2019": "Mercedes C Estate",
        "Volkswagen Golf GTI Performance 2015": "Golf GTI Performance",
        "BMW 116d Manual 2015": "BMW 116d",
        "Volkswagen Golf VIII 1.0 TSI 2021": "Golf VIII 1.0 TSI",
        "BMW 318d Touring 2019": "BMW 318d Touring",
        "Volvo XC40 2.0 D3 2020": "Volvo XC40 D3",
        "Audi A3 1.0 TFSI 2018": "Audi A3 1.0 TFSI",
    }
    lot_rows = [
        [short[u["name"]], eur(u["cost"], 0), eur(u["sell"], 0), eur(u["gross"], 0), eur(u["rebu"], 2), eur(u["net"], 2)]
        for u in m["lot"]
    ] + [[
        "Lote de siete",
        eur(t["cost"], 0),
        eur(t["sell"], 0),
        eur(t["gross"], 0),
        eur(t["rebu"], 2),
        eur(t["net"], 2),
    ]]
    erp_rows = [
        [
            e["name"],
            eur(e["precio_de"], 0),
            eur(e["erp_all_in"], 2),
            eur(e["plan_cost"], 0),
            eur(e["venta_web"], 0),
        ]
        for e in m["erp_check"]
    ]
    story = [
        NextPageTemplate("later"),
        PageBreak(),
        P("PARA EL COMITÉ DE RIESGOS", "eyebrow"),
        h1("01", "Lo que se pide firmar"),
        kpi_row([
            ("50.000 €", "Aval para el stock. Capital propio, otros 50.000 €."),
            (eur(t["avg_net"]), "Margen neto real. Coste completo e IVA ya restados."),
            (ratio(stress["dscr"]), "RCSD con una venta al mes y la nave abierta."),
            (eur(f["residual"]), "Caja el día 1, después de comprar los siete."),
        ]),
        Spacer(1, 8),
        P("La operación es la del plan de cuatro páginas. Sociedad limitada unipersonal de compraventa en Santiago de Compostela, nave de 550 m² en San Marcos, lote inicial de siete coches y financiación de 50.000 € a 60 meses junto a 50.000 € de capital. El colchón familiar de 25.000 € no entra en el balance: es la subsistencia del administrador, para no cobrar sueldo de la sociedad.", "bodyjust"),
        P("El coste de compra de ese plan no es el precio de Alemania. Ya incluye el coche, el transporte, la matriculación y la puesta a la venta. El margen neto real —3.781 € de media, 26.467 € en el lote— es el margen después de ese coste y del IVA del régimen de bienes usados. No se le resta otra vez el aterrizaje.", "bodyjust"),
        Callout(
            "Cómo se lee el 1,32x del plan",
            "El plan divide el margen de 3.781 € entre 2.846 € de gastos mensuales. Esos 2.846 € ya contienen la cuota del préstamo, así que el 1,32x no es el ratio que usa un banco. Con la misma estructura y la misma cuota, el RCSD —caja después de gastos de explotación e impuesto, dividida entre principal e intereses— es 1,72x vendiendo un coche al mes. El margen no cambia. Cambia la fórmula.",
        ),
        Spacer(1, 8),
        P("LA UNIDAD", "eyebrow"),
        h1("02", "Siete coches, con el coste ya cerrado"),
        P("Cada fila es la del plan. Margen bruto es venta menos coste completo. El IVA REBU es el 21/121 de ese margen. El neto es lo que queda. La media de 3.781 € no es un redondeo amable: 26.466,95 € entre siete coches.", "bodyjust"),
        table(
            ["Unidad del plan", "Coste", "Venta", "Bruto", "REBU", "Neto"],
            lot_rows,
            [160, 66, 66, 64, 70, 78],
            aligns=["LEFT", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "RIGHT"],
            emphasize_last=True,
        ),
        Spacer(1, 6),
        Image(charts["margins"], width=USABLE, height=USABLE * 0.40),
        P("Los siete márgenes son positivos. El más fino del lote, el Audi, deja 2.921 € después de coste completo e IVA. El Mercedes deja 5.226 €.", "small"),
        h2("El mismo coste, visto desde el ERP"),
        P("El motor del ERP suma el anuncio de origen, el transporte, la ITV, las tasas, la gestoría, la preparación, el mantenimiento, la garantía y el anuncio. Esa suma es el coste de aterrizaje. En el Golf VIII da 14.611,82 €. El plan pone 14.617 €. Es la misma partida, no una partida que faltara.", "bodyjust"),
        table(
            ["Unidad en el ERP", "Precio origen", "Coste ERP", "Coste plan", "Venta web"],
            erp_rows,
            [164, 85, 85, 85, 85],
            aligns=["LEFT", "RIGHT", "RIGHT", "RIGHT", "RIGHT"],
        ),
        Spacer(1, 4),
        P("Donde el plan y el borrador del ERP no coinciden al euro, el plan es la cifra que se presenta: en el Mercedes y en el XC40 el coste del plan es más alto que el del borrador; en el Audi y en el 318d, algo más bajo. La venta publicada hoy en khcimport.autos coincide con el plan en Mercedes, Golf VIII, XC40, Audi y Golf GTI. El 116d está anunciado a 12.475 € y el 318d a 17.250 €, mil euros por debajo de la columna del plan. Con esos dos precios, el margen medio del lote pasa de 3.781 € a 3.545 € y el RCSD de una venta al mes queda en 1,51x. Sigue por encima de 1,30x.", "small"),
        CondPageBreak(280),
        P("COBERTURA", "eyebrow"),
        h1("03", "El ratio, con la fórmula del banco"),
        P("La estructura mensual es la del plan. La cuota no es un gasto de explotación: es el servicio de la deuda, y va al denominador del RCSD, no dentro de los 1.880 €.", "bodyjust"),
        table(
            ["Partida mensual", "€", "Dónde entra"],
            [
                ["Arrendamiento San Marcos, 550 m²", eur(o["rent"]), "Estructura"],
                ["Autónomo societario", eur(o["reta"]), "Estructura"],
                ["Portales y gestoría", eur(o["marketing"]), "Estructura"],
                ["Suministros", eur(o["utilities"]), "Estructura"],
                ["Estructura, sin la cuota", eur(o["structure"]), "Se resta antes del ratio"],
                ["Cuota del plan, redondeada", eur(o["debt_plan"]), "El plan la mete en los 2.846 €"],
                ["Cuota exacta al 5,50 % y 60 meses", eur(o["debt_exact"], 2), "La que usa este dossier"],
            ],
            [250, 80, 174],
            aligns=["LEFT", "RIGHT", "LEFT"],
            emphasize_last=True,
        ),
        Spacer(1, 6),
        P(f"Un coche al mes deja {eur(t['avg_net'])} de margen. Menos {eur(o['structure'])} de estructura, quedan {eur(t['avg_net'] - o['structure'])} para una cuota de {eur(loan['payment_exact'], 2)}. Antes de impuesto, eso es {ratio((t['avg_net'] - o['structure']) / loan['payment_exact'])}. El año, ya con el 15 % de sociedades sobre el beneficio, cierra en {ratio(stress['dscr'])}.", "bodyjust"),
        table(
            ["Lectura", "Ventas", "RCSD", "Qué es"],
            [
                ["Fórmula impresa en el plan", "12", "1,32x", "Margen dividido entre estructura más cuota."],
                ["Una venta al mes, impuesto 15 %", "12", ratio(stress["dscr"]), "El número con el que se mira el estrés."],
                ["Misma venta, impuesto al 23 %", "12", ratio(tax23["dscr"]), "Si el 15 % de nueva creación no aplica."],
                ["Precios publicados hoy en dos coches", "12", ratio(web["dscr"]), "116d a 12.475 € y 318d a 17.250 €."],
                ["Precio de venta un 5 % por debajo", "12", ratio(price5["dscr"]), "Cubre la cuota. Queda bajo el 1,30x."],
                ["Objetivo del plan, 2,5 coches al mes", "30", ratio(base["dscr"]), "Siete coches a 90 días dan unas 28 ventas."],
            ],
            [190, 48, 52, 214],
            aligns=["LEFT", "RIGHT", "RIGHT", "LEFT"],
        ),
        Spacer(1, 6),
        Image(charts["dscr"], width=USABLE, height=USABLE * 0.34),
        P(f"Verde, en o por encima de 1,30x. El objetivo del plan, {ratio(base['dscr'])}, no cabe en la escala: está en la tabla. Hacen falta {m['break_even_sales']['dscr_130_15']} ventas al año para sostener el 1,30x, y {m['break_even_sales']['dscr_100_15']} para cubrir la cuota. Las dos están por debajo de una venta al mes.", "small"),
        CondPageBreak(260),
        P("CAJA", "eyebrow"),
        h1("04", "Los siete coches caben. La reforma, no el mismo día"),
        P(f"Cien mil euros menos {eur(f['stock'])} de stock dejan {eur(f['residual'])}. La reforma de la nave —{eur(f['capex_nave'])} de materiales— no cabe en ese resto si se paga antes del primer cobro. Cabe en cuanto se cobra el primer coche. No es un problema de margen. Es el orden de los pagos.", "bodyjust"),
        Image(charts["uses"], width=USABLE, height=USABLE * 0.22),
        Spacer(1, 4),
        P("La simulación de estrés compra los siete el día 1, vende uno al mes y lo repone por otro del mismo coste. Cada mes entra el margen neto de esa unidad y salen la estructura y la cuota. El REBU se resta en el mes de la venta, no se deja para el trimestre.", "small"),
        Image(charts["cash"], width=USABLE, height=USABLE * 0.34),
        table(
            ["Mes", "Unidad que se vende y se repone", "Margen", "Caja si la reforma espera", "Caja si se paga en el mes 1"],
            [
                [
                    str(a["month"]),
                    short[a["unit"]],
                    eur(a["margin"], 0),
                    eur(a["end"], 0),
                    eur(b["end"], 0),
                ]
                for a, b in zip(m["cash_base"], m["cash_reform_m1"])
            ],
            [32, 168, 64, 120, 120],
            aligns=["RIGHT", "LEFT", "RIGHT", "RIGHT", "RIGHT"],
        ),
        Spacer(1, 4),
        P(f"La caja más baja, si la reforma se paga con el primer cobro, es {eur(min(r['end'] for r in m['cash_reform_m1']))}. No baja de cero en ningún mes. Al cabo de doce ventas de reposición termina en {eur(m['cash_reform_m1'][-1]['end'])}. El Audi es el mes más justo: su margen de 2.921 € cubre los 2.835 € de estructura y cuota, y deja unos 86 €. El lote no depende de que todos los coches sean el Mercedes.", "small"),
        Callout(
            "Lo que se pide por escrito en la primera reunión",
            f"Comisión de aval, cuota social real y si la operación entra en el reaval de IGAPE o de CERSA. Al 2 %, la cuota social sería {eur(f['sgr_2pct'])}, reintegrable al cancelar, y saldrían de los {eur(f['residual'])} de caja, no del margen de los coches. El tipo de este papel es el 5,50 % del plan. Si la oferta es otra, se sustituye esta cuota de {eur(loan['payment_exact'], 2)} por la de la oferta.",
        ),
        CondPageBreak(240),
        P("PARA PRESENTAR", "eyebrow"),
        h1("05", "Qué acompaña a este papel"),
        P("Sociedad todavía no constituida: no hay cuentas anuales que adjuntar. Lo que el comité va a pedir, y el estado en el que está, es esto.", "bodyjust"),
        table(
            ["Documento", "Estado"],
            [
                ["Este plan y el margen por coche del lote", "En este dossier"],
                ["Precios publicados de las mismas unidades", "khcimport.autos"],
                ["Motor de coste del ERP, coche a coche", "En el sistema de gestión"],
                ["DNI, residencia en Galicia e IRPF de dos ejercicios", "A acreditar"],
                ["Certificados de estar al corriente: AEAT, TGSS y ATRIGA", "A acreditar"],
                ["Autorización CIRBE y extractos de seis meses", "A acreditar"],
                ["Origen de los 50.000 € de capital", "A acreditar"],
                ["Denominación social. No usar un nombre no inscrito", "A acreditar"],
                ["Alta de socio partícipe y aval personal del administrador", "Al sancionar"],
                ["Escrituras y cuentas", "No aplica: sociedad no constituida"],
            ],
            [340, 164],
        ),
        Spacer(1, 8),
        h2("Orden"),
        bullets([
            "Confirmar con la gestoría el 15 % de nueva creación y el alta en REBU el mismo día del 036.",
            "Pedir el certificado de denominación. La marca es KHC Auto Import. La razón social no se anticipa.",
            "Alta en la oficina de Sogarpo —Reconquista 11, Vigo, o Progreso 145, Ourense— con este dossier y los justificantes de la columna anterior.",
            "Contratar el préstamo con una entidad con convenio. El 5,50 % es la hipótesis del plan, no una oferta.",
            "Desembolsar los 50.000 € en la cuenta de la sociedad. Comprar el lote. Pagar la reforma con el primer cobro, no antes.",
        ]),
        Spacer(1, 6),
        Callout(
            "Cierre",
            f"El aval de 50.000 € se sostiene con el margen que el plan ya calculó: {eur(t['avg_net'])} por coche, {eur(t['net'])} en el lote de siete, después de un coste que ya incluye transporte, matriculación y puesta a la venta. Con una venta al mes, la nave abierta y el impuesto al 15 %, el RCSD es {ratio(stress['dscr'])}. Al 23 % sigue en {ratio(tax23['dscr'])}. No hace falta rebajar el margen para que la cuenta cuadre. Hace falta no pagar la reforma antes de cobrar el primero.",
        ),
        Spacer(1, 8),
        P("Fuentes. Plan de viabilidad de cuatro páginas, lote y gastos mensuales. Motor de coste del ERP, borradores de alta del Golf VIII, Audi A3, Mercedes Clase C Estate, Volvo XC40 y BMW 318d. Precios públicos de khcimport.autos a 11 de octubre de 2026. Tipo del 5,50 % y cuota social del 2 %: hipótesis, a sustituir por la oferta.", "tiny"),
    ]
    return story


def main():
    global MODEL
    flatten_logo()
    from modelo_aval import main as build_model
    build_model()
    MODEL = json.loads((HERE / "modelo_cifras.json").read_text(encoding="utf-8"))
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        title="Dossier de viabilidad para aval Sogarpo — KHC Auto Import",
        author="KHC Auto Import",
        subject="Márgenes del plan de viabilidad. El coste de compra ya incluye el aterrizaje.",
    )
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(0, 0, PAGE_W, PAGE_H, id="coverframe", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=draw_cover),
        PageTemplate(id="later", frames=[Frame(LEFT, BOTTOM, USABLE, PAGE_H - TOP - BOTTOM - 8, id="laterframe")], onPage=draw_later),
    ])
    doc.build(build_story(MODEL))
    print(OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Dossier visual de solicitud de aval. Lee el modelo de trabajo y no inventa cifras."""

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

from modelo_aval import (  # noqa: E402
    IS_PYME,
    LOAN,
    min_sales_for_dscr,
    steady_year,
)

FONT = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DejaVu", f"{FONT}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuBold", f"{FONT}/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerif", f"{FONT}/DejaVuSerif.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerifBold", f"{FONT}/DejaVuSerif-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuMono", f"{FONT}/DejaVuSansMono.ttf"))
pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVuBold", italic="DejaVu", boldItalic="DejaVuBold")

INK = Color(0.039, 0.063, 0.125)
INK_SOFT = Color(0.071, 0.106, 0.188)
GOLD = Color(0.702, 0.576, 0.306)
GOLD_DEEP = Color(0.459, 0.365, 0.169)
IVORY = Color(0.976, 0.973, 0.961)
IVORY_D = Color(0.945, 0.937, 0.914)
SLATE = Color(0.290, 0.345, 0.447)
GREEN = Color(0.122, 0.420, 0.290)
RED = Color(0.549, 0.227, 0.227)
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


def eur(n, d=0):
    neg = n < 0
    n = abs(float(n))
    s = f"{n:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" + s if neg else s) + " €"


def num(n, d=1):
    neg = n < 0
    n = abs(float(n))
    s = f"{n:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return "−" + s if neg else s


def ratio(n):
    if n is None:
        return "n/d"
    return f"{n:.2f}x".replace(".", ",")


S = {
    "h1": ParagraphStyle("h1", fontName="DejaVuSerifBold", fontSize=15.5, leading=19, textColor=INK, spaceBefore=0, spaceAfter=2),
    "h2": ParagraphStyle("h2", fontName="DejaVuBold", fontSize=10.5, leading=13.5, textColor=INK, spaceBefore=9, spaceAfter=3),
    "eyebrow": ParagraphStyle("eyebrow", fontName="DejaVuBold", fontSize=7.4, leading=9, textColor=GOLD_DEEP, tracking=1.1, spaceBefore=0, spaceAfter=2),
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
    "tdw": ParagraphStyle("tdw", fontName="DejaVu", fontSize=7.2, leading=9.2, textColor=WHITE),
    "good": ParagraphStyle("good", fontName="DejaVuBold", fontSize=7.2, leading=9.2, textColor=GREEN, alignment=TA_RIGHT),
    "bad": ParagraphStyle("bad", fontName="DejaVuBold", fontSize=7.2, leading=9.2, textColor=RED, alignment=TA_RIGHT),
    "mono": ParagraphStyle("mono", fontName="DejaVuMono", fontSize=7.3, leading=10.2, textColor=INK),
    "center": ParagraphStyle("center", fontName="DejaVu", fontSize=8, leading=10.5, textColor=SLATE, alignment=TA_CENTER),
    "kpi_n": ParagraphStyle("kpi_n", fontName="DejaVuSerifBold", fontSize=12.5, leading=15, textColor=INK, alignment=TA_CENTER),
    "kpi_l": ParagraphStyle("kpi_l", fontName="DejaVu", fontSize=6.5, leading=8.2, textColor=SLATE, alignment=TA_CENTER),
    "cover_note": ParagraphStyle("cover_note", fontName="DejaVu", fontSize=8, leading=11, textColor=Color(0.78, 0.76, 0.70)),
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
        self._bh = 0

    def wrap(self, aw, ah):
        w, h = self.body_p.wrap(self.box_width - 22, ah)
        self._bh = h
        self.width = self.box_width
        self.height = h + (28 if self.title else 16)
        return self.width, self.height

    def draw(self):
        c = self.canv
        if self.tone == "ink":
            c.setFillColor(INK)
            c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
            c.setFillColor(GOLD)
            title_color = GOLD
            # body is already dark-ink; redraw not possible. Use gold tone for ink callouts via a different path.
        c.setFillColor(IVORY_D if self.tone != "alert" else Color(0.98, 0.94, 0.91))
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(RED if self.tone == "alert" else GOLD)
        c.rect(0, 0, 3.2, self.height, fill=1, stroke=0)
        if self.title:
            c.setFillColor(RED if self.tone == "alert" else GOLD_DEEP)
            c.setFont("DejaVuBold", 7.2)
            c.drawString(12, self.height - 13, self.title.upper())
        self.body_p.drawOn(c, 12, 7)


class InkBand(Flowable):
    """Franja oscura con título claro y cuerpo. El cuerpo se pinta en claro."""

    def __init__(self, title, lines, width=USABLE):
        super().__init__()
        self.title = title
        self.lines = lines
        self.box_width = width

    def wrap(self, aw, ah):
        self.width = self.box_width
        self.height = 22 + 13 * len(self.lines) + 8
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(INK)
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(0, self.height - 3, self.width, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("DejaVuBold", 7.4)
        c.drawString(12, self.height - 16, self.title.upper())
        c.setFillColor(Color(0.93, 0.91, 0.86))
        c.setFont("DejaVu", 8)
        y = self.height - 32
        for line in self.lines:
            c.drawString(12, y, line)
            y -= 13


def kpi_row(items):
    """items: list of (value, label)."""
    n = len(items)
    gap = 6
    w = (USABLE - gap * (n - 1)) / n
    cells = []
    for value, label in items:
        inner = [P(value, "kpi_n"), Spacer(1, 1), P(label, "kpi_l")]
        cells.append(inner)
    # wrap each as a nested table so the card has padding
    cards = []
    for value, label in items:
        card = Table(
            [[P(value, "kpi_n")], [P(label, "kpi_l")]],
            colWidths=[w - 8],
        )
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
        ("RIGHTPADDING", (0, 0), (-1, -1), gap if n else 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("RIGHTPADDING", (-1, 0), (-1, 0), 0),
    ]))
    return row


def table(headers, rows, widths, aligns=None, emphasize_last=False, font=7.15):
    head = [P(h, "th") for h in headers]
    data = [head]
    for r in rows:
        line = []
        for i, cell in enumerate(r):
            if isinstance(cell, Paragraph):
                line.append(cell)
            else:
                style = "tdr" if aligns and aligns[i] == "RIGHT" else "td"
                if emphasize_last and r is rows[-1]:
                    style = "tdbr" if style == "tdr" else "tdb"
                line.append(P(str(cell), style))
        data.append(line)
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "DejaVuBold"),
        ("FONTSIZE", (0, 0), (-1, -1), font),
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


def chart_uses(uses):
    labels = [u[0] for u in uses][::-1]
    values = [u[1] for u in uses][::-1]
    colors = ["#b3934e" if "Tesorer" in lab or "Stock" in lab else "#1d2840" for lab in labels]
    fig, ax = plt.subplots(figsize=(7.35, 2.45))
    style_ax(ax)
    ax.barh(labels, values, color=colors, height=0.62)
    ceiling = max(values) * 1.28
    for i, v in enumerate(values):
        label = f"{v:,.0f} €".replace(",", ".")
        ax.text(v + ceiling * 0.012, i, label, va="center", fontsize=7.5, color="#0a1020")
    ax.set_xlim(0, ceiling)
    ax.tick_params(axis="y", length=0, labelsize=8)
    fig.tight_layout()
    return save_chart(fig, "uses.png")


def chart_waterfall():
    # PVP, compra, aterrizaje, REBU, contribución
    steps = [
        ("Precio de venta", 21167, "up"),
        ("Compra", -16050, "down"),
        ("Aterrizaje", -2220, "down"),
        ("IVA REBU", -888, "down"),
        ("Contribución", 2009, "total"),
    ]
    # manual waterfall positions
    labels = [s[0] for s in steps]
    fig, ax = plt.subplots(figsize=(7.35, 2.7))
    style_ax(ax)
    running = 0
    for i, (lab, val, kind) in enumerate(steps):
        pretty = f"{val:,.0f}".replace(",", ".")
        if kind == "up":
            ax.bar(i, val, color="#1d2840", width=0.62)
            ax.text(i, val + 500, pretty, ha="center", fontsize=7.5, color="#0a1020")
            running = val
        elif kind == "down":
            ax.bar(i, abs(val), bottom=running + val, color="#8c3a3a", width=0.62)
            if abs(val) > 4000:
                ax.text(i, running + val / 2, pretty, ha="center", va="center", fontsize=7.5, color="white")
            else:
                ax.text(i, running + 450, pretty, ha="center", fontsize=7.4, color="#8c3a3a")
            running = running + val
        else:
            ax.bar(i, val, color="#b3934e", width=0.62)
            ax.text(i, val + 500, pretty, ha="center", fontsize=7.5, color="#0a1020")
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=7.6)
    ax.set_ylim(0, 25000)
    ax.set_ylabel("€ por unidad media", fontsize=8, color="#4a5872")
    fig.tight_layout()
    return save_chart(fig, "waterfall.png")


def chart_cash(model):
    fig, ax = plt.subplots(figsize=(7.35, 3.15))
    style_ax(ax)
    months = list(range(1, 13))
    series = [
        ("Base, sin local", model["scenarios"]["base"]["rows"], "#0a1020", 2.2),
        ("Estrés, 7 ventas", model["scenarios"]["stress"]["rows"], "#b3934e", 1.8),
        ("Local desde el mes 1", model["scenarios"]["showroom_now"]["rows"], "#8c3a3a", 1.6),
    ]
    for name, rows, color, lw in series:
        ax.plot(months, [r["cash"] for r in rows], color=color, lw=lw, label=name)
    ax.axhline(12000, color="#4a5872", ls="--", lw=0.9, label="Covenant 12.000 €")
    ax.axvline(7, color="#d9d3c7", lw=0.8)
    ax.text(7.15, 43000, "Empieza a amortizar", fontsize=7, color="#4a5872")
    ax.set_xticks(months)
    ax.set_xticklabels([f"M{m}" for m in months], fontsize=7.5)
    ax.set_ylabel("Tesorería al cierre del mes, €", fontsize=8, color="#4a5872")
    ax.legend(frameon=False, fontsize=7.4, loc="upper left")
    ax.set_ylim(0, 48000)
    fig.tight_layout()
    return save_chart(fig, "cash.png")


def chart_dscr():
    labels = [
        "Año 2\n16 ventas\nsin local",
        "Año 2\n14 ventas\numbral",
        "Año 1\nsin carencia",
        "Estrés\n7 ventas",
        "Precio\n−5 %",
        "Local\ndesde el día 1",
    ]
    values = [1.60, 1.30, 1.49, 0.44, 0.66, 0.07]
    colors = ["#1f6b4a" if v >= 1.30 else ("#b3934e" if v >= 1.0 else "#8c3a3a") for v in values]
    fig, ax = plt.subplots(figsize=(7.35, 2.85))
    style_ax(ax)
    bars = ax.bar(labels, values, color=colors, width=0.68)
    ax.axhline(1.30, color="#0a1020", ls="--", lw=0.9)
    ax.text(5.35, 1.38, "1,30x", fontsize=7.5, color="#0a1020")
    for b, v in zip(bars, values):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.06, f"{v:.2f}".replace(".", ","), ha="center", fontsize=7.5, color="#0a1020")
    ax.set_ylim(0, 2.05)
    ax.set_ylabel("RCSD", fontsize=8, color="#4a5872")
    fig.tight_layout()
    return save_chart(fig, "dscr.png")


def chart_tornado(pairs):
    # pairs: (label, sales_needed), already sorted
    labels = [p[0] for p in pairs][::-1]
    values = [p[1] for p in pairs][::-1]
    colors = ["#1f6b4a" if v <= 16 else "#8c3a3a" for v in values]
    fig, ax = plt.subplots(figsize=(7.35, 2.9))
    style_ax(ax)
    ax.barh(labels, values, color=colors, height=0.62)
    ax.axvline(16, color="#b3934e", ls="--", lw=1)
    ax.text(16.3, len(labels) - 0.65, "Ritmo del caso base: 16", fontsize=7, color="#967838")
    for i, v in enumerate(values):
        ax.text(v + 0.3, i, str(v), va="center", fontsize=8, color="#0a1020")
    ax.set_xlim(0, max(values) + 6)
    ax.set_xlabel("Ventas al año para un RCSD de 1,30", fontsize=8, color="#4a5872")
    ax.tick_params(axis="y", length=0)
    fig.tight_layout()
    return save_chart(fig, "tornado.png")


def chart_draft(draft):
    labels = [c["name"].replace("Mercedes-Benz ", "MB ").replace("Performance", "Perf.") for c in draft]
    claimed = [c["draft_net"] for c in draft]
    real = [c["contrib"] for c in draft]
    import numpy as np
    x = np.arange(len(labels))
    fig, ax = plt.subplots(figsize=(7.35, 2.9))
    style_ax(ax)
    ax.bar(x - 0.18, claimed, width=0.36, color="#c5bfb4", label="«Neto» del borrador")
    ax.bar(x + 0.18, real, width=0.36, color="#1d2840", label="Contribución real")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=6.4, rotation=18, ha="right")
    ax.legend(frameon=False, fontsize=7.4)
    ax.set_ylabel("€ por coche", fontsize=8, color="#4a5872")
    fig.tight_layout()
    return save_chart(fig, "draft.png")


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
        # Compuesto sobre el color de la portada. Sin máscara no aparece el recuadro del PNG.
        iw, ih = ImageReader(str(logo_flat)).getSize()
        dw = 248
        dh = dw * ih / iw
        bottom = 546
        if dh > 150:
            dh = 150
            dw = dh * iw / ih
        c.drawImage(str(logo_flat), (PAGE_W - dw) / 2, bottom, width=dw, height=dh, mask=None)
    elif LOGO.exists():
        c.drawImage(str(LOGO), PAGE_W / 2 - 92, 548, width=184, height=120, mask="auto")
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
    c.drawCentredString(PAGE_W / 2, 418, "11 de octubre de 2026   ·   Modelo de trabajo, no certificación")

    boxes = [
        ("50.000 €", "Aval solicitado"),
        ("1,60×", "RCSD de crucero"),
        ("50 %", "Capital propio"),
    ]
    bw, bh, gap = 148, 62, 12
    total = bw * 3 + gap * 2
    x0 = (PAGE_W - total) / 2
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
    c.drawCentredString(PAGE_W / 2, 268, "Circulante para existencias. La nave no se financia con este aval.")
    c.setFillColor(Color(0.72, 0.70, 0.64))
    c.setFont("DejaVu", 7.4)
    text = (
        "Cifras de planificación del proyecto. No son cuentas auditadas, no hay ventas realizadas\n"
        "y este documento no certifica solvencia ni ausencia de riesgo. Antes de la firma, cada\n"
        "hipótesis marcada como «a acreditar» se sustituye por su justificante."
    )
    y = 214
    for line in text.split("\n"):
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= 11

    c.setFillColor(GOLD)
    c.setFont("DejaVu", 7.2)
    c.drawCentredString(PAGE_W / 2, 78, "CONFIDENCIAL   ·   SUSTITUYE AL BORRADOR DE 4 PÁGINAS   ·   NO ENVIAR EL BORRADOR")
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
    c.drawString(LEFT, 16, "Modelo de trabajo  ·  11 de octubre de 2026  ·  no es una certificación")
    c.setFillColor(INK)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(PAGE_W - RIGHT, 15, f"{doc.page:02d}")
    c.restoreState()


def build_story(model):
    base = model["scenarios"]["base"]
    stress = model["scenarios"]["stress"]
    cons = model["scenarios"]["conservative"]
    show = model["scenarios"]["showroom_now"]
    aggr = model["scenarios"]["aggressive"]
    nog = model["scenarios"]["no_grace"]
    y2 = model["steady"]["y2_pilot_16"]
    y3_salary = model["steady"]["y3_pilot"]
    y3 = steady_year(18, LOAN, False, 0, tax_rate=IS_PYME, year_index=3)
    th = model["thresholds"]
    unit = model["unit"]
    be = model["break_even"]

    uses = [
        ("Stock de apertura, 4 unidades", 73078),
        ("Tesorería que no se toca", 23449.10),
        ("Constitución de la SLU", 1150),
        ("Cuota social SGR, reintegrable", 1000),
        ("Equipamiento de inspección", 822.90),
        ("Comisiones de estudio y apertura", 500),
    ]
    charts = {
        "uses": chart_uses(uses),
        "water": chart_waterfall(),
        "cash": chart_cash(model),
        "dscr": chart_dscr(),
        "draft": chart_draft(model["draft"]),
        "tornado": chart_tornado([
            ("Sin local, sin sueldo", th["pilot_dscr_130"]),
            ("Tipo de interés al 7 %", min_sales_for_dscr(1.30, LOAN, False, rate=0.07)),
            ("Avería extra de 500 €", min_sales_for_dscr(1.30, LOAN, False, extra_repair=500)),
            ("Sueldo de 800 € al mes", th["pilot_dscr_130_salary"]),
            ("Local a 1.100 €", th["show_dscr_130"]),
            ("Precio de venta −5 %", th["pilot_dscr_130_price95"]),
            ("Local y precio −5 %", min_sales_for_dscr(1.30, LOAN, True, price_factor=0.95)),
        ]),
    }

    story = [NextPageTemplate("later"), PageBreak()]

    # ----- 1. Dictamen -----
    story += [
        P("PARA EL COMITÉ DE RIESGOS", "eyebrow"),
        h1("01", "Lo que se pide firmar, y lo que no"),
        kpi_row([
            ("50.000 €", "Aval de circulante. No financia la nave."),
            ("1,60×", "RCSD del año 2, el que decide. No el del año 1."),
            ("2.009 €", "Contribución real por coche, después de todo."),
            ("12.000 €", "Caja mínima. Si se toca, se deja de comprar."),
        ]),
        Spacer(1, 8),
        P("Este dossier sustituye al borrador de cuatro páginas. La operación que puede firmarse no es la de aquel borrador. El borrador pedía 50.000 € para abrir una nave de 550 m² en San Marcos y comprar siete coches, y concluía que una venta al mes cubría la deuda con un RCSD de 1,32x y riesgo nulo. Esa conclusión no resiste el contraste con las tarifas y la fiscalidad que el propio proyecto ya tiene cerradas.", "bodyjust"),
        P("La solicitud que sí cierra es más pequeña en ambición y más sólida en caja: <b>aval de 50.000 € para rotar existencias</b>, con 50.000 € de capital social al lado. El local no se abre con este dinero. Se abre, si acaso, cuando el ritmo medido llegue a 24 ventas al año y exista un precontrato a no más de 1.100 €. Hasta entonces, la estructura fija es de 716 € al mes, no de 2.846.", "bodyjust"),
        h2("Tres correcciones que el analista haría solo"),
        bullets([
            "<b>El margen no era neto.</b> Los 3.781 € por coche del borrador son el margen después del IVA y antes de transporte, ITV, modelo 576, garantía, taller y anuncios. En el lote de siete coches, esa omisión suma 17.032 €. Es exactamente la diferencia entre los 26.467 € anunciados y los 9.434 € que quedan cuando se resta el aterrizaje.",
            "<b>El 1,32x no era un RCSD.</b> Era 3.781 dividido entre 2.846: cobertura de unos gastos incompletos, no cobertura de la deuda. El ratio de concesión, año 2, sin carencia, 16 ventas, sin local y sin sueldo, es <b>1,60x</b>. El umbral de 1,30x se alcanza con 14 ventas al año.",
            "<b>Siete coches no caben.</b> La compra del lote son 95.380 €. Con el aterrizaje, el desembolso supera los 112.000 €, antes de constitución, fianza y colchón. Forzar esa compra deja la caja en 2.192 €. Aquí se compran cuatro unidades y se dejan 23.449 € sin tocar.",
        ]),
        Callout(
            "Lo que este documento no dice",
            "No hay ventas realizadas: el cuaderno de tesorería del proyecto está a cero. No hay auditoría. No hay riesgo de insolvencia nulo, y no se certifica nada. Los 25.000 € familiares no son garantía ni tesorería de la sociedad. Son la subsistencia del administrador, y hacen falta: un sueldo de 800 € al mes rompe el 1,30x salvo que se vendan 19 coches al año. Presentar estas hipótesis como cuentas históricas no supera el primer contraste con IRPF, CIRBE y extractos.",
            tone="alert",
        ),
        Spacer(1, 8),
    ]

    # ----- 2. Solicitud -----
    story += [
        CondPageBreak(220),
        P("LA OPERACIÓN", "eyebrow"),
        h1("02", "Solicitud, destino del dinero y covenants"),
        InkBand(
            "Ficha para el analista",
            [
                "Solicitante     KHC Auto Import, S.L.U.  ·  denominación pendiente del Registro Mercantil Central",
                "Actividad         Compraventa de vehículos de ocasión seleccionados, etiqueta C o ECO, garantía 12 meses",
                "Aval                 50.000 €  ·  Sogarpo, producto orientativo aval económico, cobertura objetivo 100 %",
                "Préstamo        60 meses  ·  carencia de principal solicitada de 6 meses  ·  el caso también cierra sin ella",
                "Tipo de trabajo  5,50 % nominal  ·  no es una oferta  ·  a 7 % el RCSD de crucero sigue en 1,56x",
                "Capital            50.000 € a desembolsar  ·  50 % de la estructura  ·  a acreditar con extractos",
                "Destino            Existencias bajo política de compra, inspección y coste de entrar en la SGR. No la nave.",
            ],
        ),
        Spacer(1, 8),
        P("Sogarpo publica el aval económico hasta 600.000 € y 60 meses, y una póliza de crédito en la que el aval llega como máximo al 50 %. Para una cobertura del 100 % el encaje natural es el aval sobre préstamo, no la póliza. En la primera reunión hay que pedir, por escrito, la comisión de aval, la cuota social real y si la operación puede acogerse al reaval de IGAPE 2026 o de CERSA. Nada de eso está contado como ingreso en este modelo. Tampoco se modela el préstamo Aquisgrán: existe para socios y hay que comparar su tipo, no suponerlo.", "bodyjust"),
        KeepTogether([
            h2("De dónde sale el dinero y a dónde va el día de la disposición"),
            table(
                ["Empleo", "Importe", "%"],
                [
                    ["Stock de apertura, 4 unidades de la política de compra", "73.078,00 €", "73,1 %"],
                    ["Tesorería que permanece por encima del covenant", "23.449,10 €", "23,4 %"],
                    ["Constitución de la sociedad, notarías y alta censal", "1.150,00 €", "1,2 %"],
                    ["Cuota social de Sogarpo, 2 %, reintegrable al cancelar", "1.000,00 €", "1,0 %"],
                    ["Equipamiento de inspección ya costeado en el proyecto", "822,90 €", "0,8 %"],
                    ["Comisión de estudio SGR y apertura bancaria, 0,50 % + 0,50 %", "500,00 €", "0,5 %"],
                    ["Total fuentes: 50.000 € de capital + 50.000 € de préstamo", "100.000,00 €", "100 %"],
                ],
                [318, 110, 95],
                aligns=["LEFT", "RIGHT", "RIGHT"],
                emphasize_last=True,
            ),
            Spacer(1, 6),
            Image(charts["uses"], width=USABLE, height=USABLE * 0.33),
            P("La reforma de la nave —4.550 € de materiales más rotulación, mobiliario y fianza— no está en este destino. Cabe pagarla más adelante con caja generada. El problema del local no es el capex: es la renta mensual. Ver la sección 09.", "small"),
        ]),
        h2("Lo que se ofrece firmar, sin que lo pidan"),
        bullets([
            "<b>Caja mínima de 12.000 €.</b> No se compra la siguiente unidad si el cobro dejaría la cuenta por debajo. En el estrés de 7 ventas la caja no baja de 20.461 €. En el intento de comprar siete coches de entrada, sí: baja a 2.192 €. Por eso el tope de stock inicial es cuatro.",
            "<b>Ni sueldo ni dividendos</b> mientras el RCSD proforma, después de esa retribución, no supere 1,40x. Con 16 ventas, un sueldo de 9.600 € al año deja el ratio en 0,95x. El administrador vive de los 25.000 € personales, que hay que acreditar y que no entran en el balance.",
            "<b>Si el margen realizado se comprime, el préstamo se adelgaza.</b> Dos meses seguidos con contribución por debajo de 1.200 € suspenden la reposición, y el 70 % de cada cobro amortiza principal hasta recuperar 1,30x. Es la respuesta al estrés de precio: a −5 % el ratio de crucero cae a 0,66x si se sigue comprando como si nada.",
            "<b>Cuenta de cobros identificada</b>, seguro de stock y de responsabilidad civil en vigor, y garantía mecánica de 12 meses provisionada a 250 € por unidad, que es el mínimo legal del profesional, no un extra comercial.",
            "<b>Información trimestral:</b> stock, días de rotación, modelo 303, tesorería y unidades descartadas por la política de compra. Un comité que ve los descartes confía más que uno que solo ve las compras.",
            "<b>Aval personal del administrador.</b> Es previsible y no se presenta como innecesario. La sociedad limita el riesgo operativo; no limita el aval que la SGR suele pedir al socio. Los 25.000 € no sustituyen esa firma.",
            "<b>El alquiler no se firma</b> sin precontrato igual o inferior a 1.100 € y sin un ritmo anualizado de 24 ventas. Incumplir esto es la forma más rápida de convertir un expediente viable en uno que no lo es.",
        ]),
        P("Carencia. Se solicitan 6 meses sin amortizar principal. La cuota de intereses en ese tramo es de 229 €. Después, la cuota sube a 1.047 € durante 54 meses. Sin carencia, la cuota constante a 60 meses es de 955 € —la cifra que el borrador redondeaba a 966 €— y el caso sigue en pie: caja mínima de 21.747 € y RCSD del año 1 de 1,49x. La carencia ayuda. No es la condición de la que cuelga el expediente.", "bodyjust"),
    ]

    # ----- 3. Borrador -----
    story += [
        CondPageBreak(240),
        P("POR QUÉ SE REHACE EL BORRADOR", "eyebrow"),
        h1("03", "Lo que el comité habría tachado"),
        P("El borrador no falla por el oficio de la prosa. Falla por tres identidades que un analista comprueba con una calculadora: llama neto a lo que no lo es, llama RCSD a lo que no lo es, y llama viable a una caja que no llega.", "bodyjust"),
        table(
            ["Afirmación del borrador", "Qué dice el modelo cerrado"],
            [
                ["Margen neto medio 3.781 €, y 26.467 € en el lote", "Eso es el margen después de IVA y antes del aterrizaje. La contribución real del lote es 9.434 €."],
                ["Fórmula: IVA = precio de venta − (margen / 1,21)", "Esa fórmula, en el Mercedes, da unos 18.764 €. La cuota correcta es 1.097,55 €. La tabla del borrador acertaba; la fórmula impresa al lado, no."],
                ["RCSD 1,32x con una venta al mes", "3.781 / 2.846 no es un RCSD. Con costes reales, una venta al mes no paga la nave. El 1,60x del año 2 es otra operación: sin nave."],
                ["OPEX 2.846 €, «máxima prudencia»", "Esos 2.846 € metían la cuota del préstamo dentro del gasto y se dejaban fuera seguro, gestoría separada, garantía mecánica y comisión de aval."],
                ["CAPEX 4.550 € gracias a la construcción", "El capex es creíble como hipótesis y menor que el problema. Falta vida laboral que lo acredite, y faltan rotulación, mobiliario, alarma y la fianza de dos meses."],
                ["Colchón familiar de 25.000 €, riesgo cero", "No está pignorado, no está en la sociedad y no es aval. Sirve para que el administrador no cobre sueldo. Nada más, y nada menos."],
                ["Siete coches con 100.000 € de fondos", "Desembolso real del lote, con aterrizaje: por encima de 112.000 €. La simulación que insiste en comprarlos deja 2.192 € en cuenta."],
                ["Riesgo de insolvencia nulo", "No es una categoría que un comité acepte, y no es verdad. El estrés de precio y el local abierto a destiempo rompen el ratio. La caja, con disciplina, no se rompe."],
            ],
            [200, 323],
        ),
        Spacer(1, 8),
        Image(charts["draft"], width=USABLE, height=USABLE * 0.36),
        P("Gris: lo que el borrador llamaba neto. Tinta: lo que queda después del aterrizaje y del IVA REBU, calculado solo sobre el precio de compra, que es como manda la norma.", "small"),
        h2("El lote del borrador, coche a coche"),
        table(
            ["Unidad del borrador", "«Neto»", "Real", "Qué hacer"],
            [
                ["Mercedes Clase C Estate 2019", eur(5226), eur(2679), "Pasa el número. Exige COC, etiqueta C y Unfallfrei."],
                ["Golf GTI Performance 2015", eur(4815), eur(1633), "El 576 al 9,75 % se come el expediente. No se financia."],
                ["BMW 116d 2015", eur(3690), eur(1628), "Año límite de ZBE. Sin etiqueta C verificada, se descarta."],
                ["Golf VIII 1.0 TSI 2021", eur(3374), eur(1312), "Aceptable solo si el COC da 120 g o menos."],
                ["BMW 318d Touring 2019", eur(3331), eur(784), "B47 sí. El margen, después del 576, es fino."],
                ["Volvo XC40 D3 2020", eur(3109), eur(539), "No cubre un susto mecánico. Fuera del stock financiado."],
                ["Audi A3 1.0 TFSI 2018", eur(2921), eur(859), "Aceptable con filtro de CO2. No es el centro del mix."],
                ["Lote completo", eur(26467), eur(9434), "Sobrevaloración: 17.032 €, el aterrizaje omitido."],
            ],
            [150, 62, 58, 253],
            aligns=["LEFT", "RIGHT", "RIGHT", "LEFT"],
            emphasize_last=True,
        ),
        Spacer(1, 6),
        P("El nombre del borrador, «Automoción Santiago SLU», no es la marca del proyecto ni una denominación inscrita. La marca es KHC Auto Import. La razón social se pide al Registro Mercantil Central y no se anticipa.", "small"),
    ]

    # ----- 4. Unidad -----
    story += [
        CondPageBreak(240),
        P("UNIDAD ECONÓMICA", "eyebrow"),
        h1("04", "Lo que gana un coche cuando se resta todo"),
        P("La unidad de este expediente no es el coche más bonito del borrador. Es la media de seis referencias que el proyecto ya estudió para Galicia y que pasan el filtro: etiqueta C o ECO, modelo 576 al 0 % o como mucho al 4,75 %, y motor que no está en la lista de exclusión. Los precios de compra y de venta son los de esos escandallos, no anuncios nuevos inventados para este papel.", "bodyjust"),
        table(
            ["Referencia ya estudiada", "Compra", "Venta", "REBU", "Aterrizaje", "Contribución"],
            [
                [c["name"].replace(" (B47)", ""), eur(c["buy"]), eur(c["sell"]), eur(c["rebu"]), eur(c["extra"]), eur(c["contrib"])]
                for c in model["policy"]
            ] + [[
                "Media que usa la simulación",
                eur(unit["buy"]),
                eur(unit["sell"], 0),
                eur(unit["rebu"]),
                eur(unit["extra"]),
                eur(unit["contrib"]),
            ]],
            [175, 62, 62, 58, 72, 94],
            emphasize_last=True,
        ),
        Spacer(1, 4),
        P("El desembolso medio, antes de cobrar, es de 18.269,50 €. Por eso cuatro coches son 73.078 € y no el precio de compra a secas. Quien financie solo el precio de Alemania se queda sin dinero el día de la ITV.", "small"),
        Image(charts["water"], width=USABLE, height=USABLE * 0.34),
        P("Cascada de la unidad media. El IVA no se calcula sobre el beneficio contable: se calcula sobre precio de venta menos precio de compra. El aterrizaje baja el beneficio y no baja la cuota. Esa es la trampa del REBU, y está metida en los 2.009 €, no escondida debajo.", "small"),
        h2("Regla de compra que viaja con el dinero"),
        bullets([
            "Etiqueta C o ECO. Euro 5 y anteriores no se financian: ZBE de A Coruña, Santiago, Vigo y Pontevedra.",
            "Modelo 576 al 0 % o, como techo, al 4,75 % con la base de tablas, no un porcentaje inventado sobre el precio alemán. El tramo del 9,75 % y el del 14,75 % están fuera.",
            "Factura sin IVA deducible: particular o profesional en régimen de margen. Si el vendedor alemán renuncia al margen y repercute IVA, la unidad se recalcula en régimen general o se deja.",
            "Motor fuera de la lista de exclusión del proyecto: PureTech de correa bañada, Powershift en seco, N47, 1.2 TCe con consumo de aceite. El Launch y el medidor de pintura no son un adorno; son el control que evita la avería de 500 € que baja el RCSD a 1,06x.",
            "No se compra una unidad cuya contribución, simulada con el precio de venta un 5 % por debajo, quede por debajo de 800 €. A ese corte, el Golf del mix sigue en 835 € y el 320d se queda en el límite. El XC40 del borrador no entra.",
            "COC o se presupuesta la ficha reducida. Unfallfrei por escrito. Dos llaves. TÜV en vigor si se van a sacar placas de exportación.",
        ]),
    ]

    # ----- 5. Fiscal -----
    story += [
        CondPageBreak(200),
        P("FISCALIDAD", "eyebrow"),
        h1("05", "Lo que el comité va a preguntar del IVA"),
        P("El REBU no es una opinión. Es el régimen de los artículos 135 a 139 de la Ley del IVA, y solo cabe cuando la compra no trae IVA deducible. La cuota se integra en el precio y no se desglosa en la factura. El comprador empresarial no la deduce. Hay que llevar el libro registro operación por operación.", "bodyjust"),
        Callout(
            "Fórmula que sí cuadra con la tabla",
            "Cuota REBU = (precio de venta − precio de compra del vehículo) × 21 / 121.<br/>Base = (precio de venta − precio de compra) / 1,21.<br/>Contribución = precio de venta − precio de compra − aterrizaje − cuota REBU.<br/>El aterrizaje —transporte, ITV, tasas, taller, garantía— no aumenta el precio de compra, salvo el ITP pagado o los gastos que facture el propio vendedor. Baja el beneficio. No baja el IVA.",
        ),
        Spacer(1, 6),
        P("En el Mercedes del borrador, precio de venta 23.990 € y compra 17.666 €, el margen es 6.324 € y la cuota es 1.097,55 €. La fórmula impresa en el borrador —precio de venta menos el margen dividido entre 1,21— devuelve unos 18.764 €. No es un redondeo. Es otra magnitud. Un analista que comprueba la fórmula deja de leer el resto.", "bodyjust"),
        h2("Tres formas de comprar el mismo coche, y solo dos sirven"),
        table(
            ["Vía", "Qué ocurre en España", "Decisión"],
            [
                ["A. Particular alemán", "Sin IVA de compra. ITP exento si se revende dentro del año. La reventa puede ir en REBU.", "Sí, con el 620 a cuota cero y control del plazo."],
                ["C. Profesional en margen (§25a)", "No hay adquisición intracomunitaria ni modelo 349. La reventa puede ir en REBU. El IVA alemán va oculto en el precio.", "Sí, si la factura lo dice y no hay renuncia al margen."],
                ["B. Profesional con IVA deducible", "Adquisición intracomunitaria, neutra de caja si hay NIF-IVA. La reventa no puede ir en REBU: IVA del 21 % sobre el total.", "No, al mismo PVP. El punto de equilibrio sube un 21 %."],
            ],
            [130, 230, 163],
        ),
        Spacer(1, 6),
        P("La auditoría interna del proyecto lo cuantifica con un mismo coche y un mismo PVP de 19.900 €: la vía A deja unos cientos de euros; la vía B, al mismo precio de etiqueta, pierde más de 2.000 €. Por eso la política de compra no es un gusto. Es la condición para que los 2.009 € existan.", "bodyjust"),
        P("<b>Impuesto de Sociedades.</b> Caso base: 15 % en el primer ejercicio con base positiva y en el siguiente, que es el tipo de entidad de nueva creación, y 23 % a partir de ahí por ser pyme por debajo del millón. El 15 % se pierde si la actividad ya la ejerció una persona vinculada. Por eso el piloto no se hace a nombre del promotor para luego aportarlo a la sociedad: la SLU compra desde la primera unidad, y el historial que verá el banco está en quien debe. Si la gestoría concluye que el 15 % no aplica, el estrés fiscal es el 23 %, no una sorpresa del 25 % escondida.", "bodyjust"),
        P("El administrador societario no se ha contado con tarifa plana ni con la Cuota Cero de la Xunta. Esas ayudas, cuando existen, son del autónomo persona física de nueva alta, no un derecho automático del administrador de una limitada. La cuota de 380 € es hipótesis de mínimo y se confirma antes de firmar. Si baja, es mejora. No está en el caso base.", "small"),
    ]

    # ----- 6. Ratios -----
    story += [
        CondPageBreak(220),
        P("COBERTURA DE LA DEUDA", "eyebrow"),
        h1("06", "El ratio, definido como lo va a recalcular el banco"),
        P("RCSD = (EBITDA − impuesto de sociedades) / (principal + intereses del periodo). El EBITDA de este modelo es la contribución de los coches vendidos menos la estructura y menos la comisión de aval. No incluye la cuota del préstamo: si se mete dentro, el ratio deja de significar nada.", "bodyjust"),
        Callout(
            "Año 2, la cuenta que se enseña",
            f"16 ventas × {eur(unit['contrib'])} = {eur(y2['contrib'])} de contribución.<br/>Estructura del piloto, 716 € × 12 = {eur(y2['fixed'])}. Comisión de aval, {eur(y2['aval'])}.<br/>EBITDA {eur(y2['ebitda'])} − impuesto {eur(y2['tax'])} = {eur(y2['cfads'])} para la deuda.<br/>Servicio de la deuda {eur(y2['service'])}.  RCSD = {ratio(y2['dscr'])}.",
        ),
        Spacer(1, 6),
        Image(charts["dscr"], width=USABLE, height=USABLE * 0.36),
        P("Verde, en o por encima de 1,30x. Oro, por encima de 1 y por debajo del covenant. Teja, no cubre el servicio con la explotación. El 1,30x de las 14 ventas es el umbral, no un resultado: es el punto en el que el ratio empieza a cumplirse.", "small"),
        table(
            ["Lectura", "Ventas", "RCSD", "Qué significa"],
            [
                ["Año 2, caso de concesión, sin local y sin sueldo", "16", ratio(y2["dscr"]), "El número con el que se pide el aval."],
                ["Umbral de 1,30x, mismo perímetro", "14", "1,30x", "Por debajo de esto el covenant de ratio no se ofrece."],
                ["Año 1 con carencia de 6 meses", "15", ratio(base["dscr"]), "Inflado por la carencia. No se usa para decidir."],
                ["Año 1 sin carencia", "15", ratio(nog["dscr"]), "Sigue por encima de 1,30. La carencia no es imprescindible."],
                ["Conservador, una venta al mes desde el mes 2", "11", ratio(cons["dscr"]), "Año 1, todavía con media carencia. La caja no sufre."],
                ["Estrés, 7 ventas", "7", ratio(stress["dscr"]), "El ratio se rompe. La caja no: mínimo 20.461 €."],
                ["Año 2 con el precio un 5 % por debajo", "16", ratio(model["steady"]["price_minus_5"]["dscr"]), "Activa la amortización anticipada. No se ignora."],
                ["Año 2 con el tipo al 7 %", "16", ratio(model["steady"]["rate_7"]["dscr"]), "El tipo no es la variable que tumba el expediente."],
                ["Local abierto y 18 ventas", "18", ratio(model["steady"]["y2_show_18"]["dscr"]), "La nave, a ritmo prudente, no se paga."],
                ["Local abierto y 26 ventas", "26", ratio(model["steady"]["y2_show_26"]["dscr"]), "Solo entonces el local convive con el 1,30x."],
            ],
            [230, 42, 48, 203],
        ),
        Spacer(1, 6),
        P(f"Punto de equilibrio de caja, ya con la cuota completa de {eur(be['pilot']['payment'])} y la comisión de aval: <b>{num(be['pilot']['units_cash_month'], 2)} coches al mes</b> sin local, y <b>{num(be['showroom']['units_cash_month'], 2)} con la nave</b>. El borrador situaba ese umbral en una venta. Con la nave, una venta no llega. Sin la nave, sí.", "bodyjust"),
        P(f"Liquidación. Cuatro coches vendidos sin reponer, al precio de trabajo y después del IVA REBU, liberan del orden de {eur(model['liquidation_4_cars'])}. La deuda viva parte de 50.000 €. El impago exige que el stock no se venda, no que se venda despacio. De ahí la política de compra: el riesgo de verdad es llenar la nave de unidades que Galicia no quiere.", "bodyjust"),
    ]

    # ----- 7. Tesorería -----
    story += [
        CondPageBreak(200),
        CondPageBreak(320),
        P("TESORERÍA", "eyebrow"),
        h1("07", "Doce meses de caja, tres maneras de usar el mismo préstamo"),
        Image(charts["cash"], width=USABLE, height=USABLE * 0.40),
        P("Tinta: el plan. Se abre con cuatro coches y 23.449 €, se venden 15 en el año y se cierra con 40.520 €, stock intacto y la deuda ya en 45.034 €. Oro: siete ventas. La caja no baja de 20.461 € porque la reposición respeta el covenant. Teja: la misma deuda, pero pagando la nave desde el mes 1. La cuenta roza los 12.000 € y el año pierde 3.625 €.", "small"),
        table(
            ["Escenario del año 1", "Ventas", "Caja mínima", "Caja final", "Resultado", "RCSD"],
            [
                ["Base, sin local, con carencia", "15", eur(base["min_cash"]), eur(base["ending_cash"]), eur(base["net"]), ratio(base["dscr"])],
                ["Base, sin carencia", "15", eur(nog["min_cash"]), eur(nog["ending_cash"]), eur(nog["net"]), ratio(nog["dscr"])],
                ["Conservador, 1 venta/mes desde el mes 2", "11", eur(cons["min_cash"]), eur(cons["ending_cash"]), eur(cons["net"]), ratio(cons["dscr"])],
                ["Estrés, 7 ventas, con disciplina", "7", eur(stress["min_cash"]), eur(stress["ending_cash"]), eur(stress["net"]), ratio(stress["dscr"])],
                ["Local desde el mes 1, ritmo base", "15", eur(show["min_cash"]), eur(show["ending_cash"]), eur(show["net"]), ratio(show["dscr"])],
                ["Local y estrés de ventas", "7", eur(model["scenarios"]["showroom_stress"]["min_cash"]), eur(model["scenarios"]["showroom_stress"]["ending_cash"]), eur(model["scenarios"]["showroom_stress"]["net"]), ratio(model["scenarios"]["showroom_stress"]["dscr"])],
                ["El error: 7 coches de entrada, sin freno", "7", eur(aggr["min_cash"]), eur(aggr["ending_cash"]), eur(aggr["net"]), ratio(aggr["dscr"])],
            ],
            [188, 42, 72, 68, 78, 75],
        ),
        Spacer(1, 6),
        Callout(
            "Cómo se lee la fila del estrés",
            "RCSD de 0,44x y caja de 20.461 € no se contradicen. El ratio mira si la explotación paga principal e intereses. La caja mira si se puede atender el recibo. Con siete ventas la explotación no amortiza cómoda, y por eso no se ofrece un covenant de 1,30x en el año 1. Sí se ofrece no romper la cuenta. El stock sigue siendo cuatro coches vendibles. Eso es solvencia de liquidación, no un ratio holgado, y se dice así.",
        ),
    ]

    # ----- 8. Proyecciones -----
    story += [
        CondPageBreak(220),
        P("PROYECCIONES", "eyebrow"),
        h1("08", "Tres años sin la nave, que es el perímetro del aval"),
        P("Año 1 sale de la simulación mensual: 15 ventas, carencia de seis meses, sin sueldo, sin local. Año 2 es el crucero a 16 ventas, ya sin carencia. Año 3 sube a 18 ventas y pasa al 23 % de sociedades. El sueldo no está en ninguna de las tres columnas. Meter 9.600 € en el año 3 bajaría el RCSD de un ratio holgado a 1,12x. Se revisa a los 24 meses, no antes.", "bodyjust"),
        KeepTogether([
        table(
            ["", "Año 1", "Año 2", "Año 3"],
            [
                ["Ventas, unidades", "15", "16", "18"],
                ["Contribución de las ventas", eur(base["contrib"]), eur(y2["contrib"]), eur(y3["contrib"])],
                ["Estructura fija", eur(base["fixed"]), eur(y2["fixed"]), eur(y3["fixed"])],
                ["Comisión de aval", eur(base["aval_fees"]), eur(y2["aval"]), eur(y3["aval"])],
                ["EBITDA", eur(base["ebitda"]), eur(y2["ebitda"]), eur(y3["ebitda"])],
                ["Constitución y comisiones de apertura", eur(base["opening_expense"]), "—", "—"],
                ["Amortización del equipamiento", eur(206), eur(y2["depreciation"]), eur(y3["depreciation"])],
                ["Intereses", eur(base["interest"]), eur(y2["interest"]), eur(y3["interest"])],
                ["Impuesto de sociedades", eur(base["tax"]), eur(y2["tax"]), eur(y3["tax"])],
                ["Resultado", eur(base["net"]), eur(y2["net"]), eur(y3["net"])],
                ["Servicio de la deuda", eur(base["debt_service"]), eur(y2["service"]), eur(y3["service"])],
                ["RCSD", ratio(base["dscr"]), ratio(y2["dscr"]), ratio(y3["dscr"])],
            ],
            [220, 101, 101, 101],
            emphasize_last=True,
        ),
        Spacer(1, 4),
        P("El RCSD del año 1 no se compara con el de los años 2 y 3: la carencia recorta el principal de los seis primeros meses. El año 3, ya al 23 % y con más principal amortizado en la cuota, sigue por encima de 1,30x siempre que no se detraiga sueldo. Tipo del año 1: 15 %. Tipo del año 2: 15 %, segundo ejercicio del tipo de nueva creación. Tipo del año 3: 23 %.", "small"),
        ]),
        h2("Balance al cierre del año 1, caso base"),
        table(
            ["Activo", ""],
            [
                ["Tesorería", eur(base["ending_cash"], 0)],
                ["Existencias, 4 unidades a coste de aterrizaje", eur(base["ending_stock_cost"])],
                ["Participaciones en Sogarpo, reintegrables", "1.000 €"],
                ["Equipamiento, neto de un año de amortización", "617 €"],
                ["Total activo", eur(base["ending_cash"] + base["ending_stock_cost"] + 1000 + 617)],
            ],
            [360, 163],
            emphasize_last=True,
        ),
        Spacer(1, 4),
        table(
            ["Pasivo y patrimonio", ""],
            [
                ["Deuda financiera viva", eur(base["rows"][-1]["balance"])],
                ["IVA REBU del cuarto trimestre, a ingresar en enero", eur(base["vat_payable"])],
                ["Impuesto de sociedades, a ingresar en julio del año 2", eur(base["tax"])],
                ["Capital social", "50.000 €"],
                ["Resultado del ejercicio", eur(base["net"])],
                ["Total pasivo y patrimonio", eur(base["rows"][-1]["balance"] + base["vat_payable"] + base["tax"] + 50000 + base["net"])],
            ],
            [360, 163],
            emphasize_last=True,
        ),
        Spacer(1, 4),
        P("No hay proveedores aplazados: los coches se pagan al contado. Eso empeora la caja y mejora la credibilidad. No hay activo por la nave porque la nave no se ha alquilado. El descuadre de redondeo al euro es inferior a 2 € y no se ha tapado con una partida de ajuste.", "small"),
        h2("Capacidad de financiación por encima de los 50.000 €"),
        P(f"A 16 ventas, sin local y sin sueldo, el principal que todavía deja el RCSD en 1,30x es <b>{eur(model['meta']['accordion_ceiling_dscr_130'])}</b>. Es decir, 10.000 € por encima de la solicitud, no 30.000 ni 50.000. Ese tramo adicional solo tiene sentido como ampliación no dispuesta, liberable cuando hayan pasado 90 días a un ritmo de 1,5 ventas al mes y la contribución media realizada supere 1.500 €. Pedirlo el día 1, para un proyecto sin una venta, debilita el expediente en lugar de ampliarlo. Por encima de 60.000 €, con estas hipótesis, el modelo ya no sostiene el 1,30x. No se pide.", "bodyjust"),
    ]

    # ----- 9. Showroom -----
    story += [
        CondPageBreak(200),
        P("EL LOCAL", "eyebrow"),
        h1("09", "San Marcos, cuando sí y cuando no"),
        P("La nave de 550 m² a 1.100 € es la hipótesis más frágil del borrador, y no porque Santiago sea un mal sitio. Porque 2 € por metro y mes, en una nave de ese tamaño, o es una oportunidad que hay que atar con un precontrato, o es un error de dato. El proyecto, en su hoja de ruta, situaba naves de 150 a 250 m² en el área de A Coruña entre 750 y 1.800 €. Una renta real de 2.200 €, con 22 ventas, deja el RCSD en 0,25x. Antes de hablar de reforma hay que tener el papel del alquiler.", "bodyjust"),
        KeepTogether([
            table(
                ["Partida mensual con la nave", "€"],
                [[n, eur(v)] for n, v in model["fixed_pilot"]]
                + [[n, eur(v)] for n, v in model["fixed_showroom_only"]]
                + [["Estructura con nave, sin la cuota del préstamo", eur(model["fixed_showroom_month"])]],
                [400, 123],
                emphasize_last=True,
            ),
        ]),
        Spacer(1, 6),
        P(f"Para que esa estructura, más la cuota de {eur(be['showroom']['payment'])}, deje un RCSD de 1,30x hacen falta <b>{th['show_dscr_130']} ventas al año</b>. El caso base de este aval presupone 16. Abrir la nave el día de la disposición no es ambición: es cambiar de negocio antes de haber probado el primero. En la simulación, ese cambio pierde {eur(show['net'])} en el año 1 y deja el ratio en {ratio(show['dscr'])}.", "bodyjust"),
        h2("La puerta, por escrito"),
        bullets([
            "Precontrato o oferta en firme, renta igual o inferior a 1.100 €, licencia de actividad de compraventa ya existente o plazo de obtención cerrado con el concello.",
            "Ritmo anualizado de 24 ventas, medido, no prometido. Contribución media realizada de al menos 1.500 €.",
            "Después de pagar fianza y reforma, la caja sigue en 12.000 € o más. La reforma —epoxi 1.800, LED 1.100, oficinas 1.300, PCI 350, más rotulación, mobiliario y alarma— se paga con caja generada, no con un segundo préstamo.",
            "Si San Marcos no se cierra a ese precio, el plan B ya estudiado es una nave menor en Espíritu Santo, PO.CO.MA.CO o el eje de la N-VI, no una nave más cara.",
            "La experiencia de construcción del promotor, que es lo que hace creíble un capex de materiales de 4.550 €, se acredita con vida laboral. Hasta ese papel, el ahorro de reforma es una hipótesis.",
        ]),
        P("Plan B de sede, si el comité pregunta por qué no A Coruña desde el primer día: el proyecto nació mirando a A Coruña, donde están la ITV de referencia, el IVTM costeado y la demanda estudiada. Santiago no se descarta. Simplemente no se financia el alquiler antes de medirlo. Operar el primer año sin local, con cita previa, es la fase que el propio plan de arranque ya cerró a 822,90 € de equipamiento y menos de 300 € de estructura cuando aún se pensaba como autónomo. En sociedad, con RETA de administrador, la estructura queda en 716 €. Sigue siendo el perímetro que el aval puede garantizar.", "bodyjust"),
    ]

    # ----- 10. Mercado y activos -----
    story += [
        CondPageBreak(180),
        P("MERCADO Y CONTROLES", "eyebrow"),
        h1("10", "Por qué estos coches, y qué está ya construido"),
        P("Galicia no paga el mismo coche que Madrid. Llueve, la orografía pide par, las ZBE de las ciudades ya no perdonan la etiqueta B, y el comprador de 16.000 a 23.000 € cierra con su banco en pocos días. El estudio del proyecto, contrastado con anuncios capturados el 24 de septiembre de 2026 en Mobile.de, AutoScout24, coches.net y Milanuncios, dejó cuatro referencias de rotación corta: Golf 7.5 2.0 TDI, Mercedes Clase A, BMW 320d Touring y BMW X1 18d, más el híbrido Toyota cuando se busca etiqueta ECO. Los días de venta estudiados, en esas referencias y a precio agresivo, van de 12 a 25. No se han usado como promesa. Se han usado para no comprar lo contrario.", "bodyjust"),
        P("Lo que el mismo estudio manda no comprar, y que este aval tampoco financia: diésel anteriores a septiembre de 2015, grandes SUV de gasolina con el 576 en el tramo alto, berlinas grandes de poca salida local, y los motores de la lista de exclusión. El margen de un anuncio alemán no es un margen. El kilometraje manda más que el modelo: dos «ganadores» de la matriz, a 162.000 km y a precio de anuncio, salían en pérdida. La ficha de compra lo tiene que decir antes de transferir.", "bodyjust"),
        h2("Activos que ya no hay que financiar"),
        bullets([
            "<b>Web pública</b> en khcimport.autos, con el posicionamiento ya decidido: vehículos seleccionados, nacionales e importados, garantía mínima de 12 meses por escrito. No se vende «importación» como producto.",
            "<b>ERP de gestión</b> con simulador fiscal que distingue las tres vías de compra, flota, CRM, libros, facturación REBU sin desglose, y calculadora de viaje. Un comité no financia un Excel. Esto es el control.",
            "<b>Protocolo de campo:</b> diagnosis Launch, medidor de espesor que detecta masilla magnética, seis documentos alemanes sin los cuales no se paga, y el circuito de placas de exportación cuando se baja rodando.",
            "<b>Catálogo de 1.104 variantes</b> con el origen de cada precio declarado, y una matriz de motores que separa lo que se rota de lo que se avería. El aval financia la aplicación de esa matriz, no su redacción.",
        ]),
        P("Nada de eso sustituye a un extracto bancario. Sirve para otra pregunta del comité, la de si el promotor improvisará la primera compra. La respuesta documentada es que no.", "small"),
    ]

    # ----- 11. Sensibilidad -----
    story += [
        CondPageBreak(180),
        P("SENSIBILIDAD", "eyebrow"),
        h1("11", "Qué tiene que salir mal para que el ratio no llegue"),
        Image(charts["tornado"], width=USABLE, height=USABLE * 0.38),
        P("Cada barra es el número de ventas al año que haría falta para seguir en 1,30x. La línea marca las 16 del caso base. Lo que queda a la izquierda de la línea cabe en el plan. Lo que queda a la derecha no cabe, y por eso tiene covenant o está fuera del destino del aval.", "small"),
        table(
            ["Si ocurre esto", "RCSD a 16 ventas", "Ventas para volver a 1,30x", "Respuesta que se firma"],
            [
                ["Nada: caso base, sin local", ratio(y2["dscr"]), "14", "Es la solicitud."],
                ["El tipo sube al 7 %", ratio(model["steady"]["rate_7"]["dscr"]), str(min_sales_for_dscr(1.30, LOAN, False, rate=0.07)), "Se acepta. No es el riesgo."],
                ["Tipo orientativo más bajo, 4,30 %", ratio(model["steady"]["rate_ico"]["dscr"]), "—", "Mejora. No se presupone."],
                ["Una avería extra de 500 € por coche", ratio(model["steady"]["repair_500"]["dscr"]), str(min_sales_for_dscr(1.30, LOAN, False, extra_repair=500)), "Protocolo de inspección y descarte."],
                ["Sueldo de 800 € al mes", ratio(model["steady"]["y2_pilot_salary"]["dscr"]), "19", "Prohibido hasta revisar el ratio."],
                ["El precio de venta cede un 5 %", ratio(model["steady"]["price_minus_5"]["dscr"]), "25", "Se para la compra y se amortiza."],
                ["Se abre el local a 1.100 €", ratio(model["steady"]["y2_show_18"]["dscr"]), "24", "No se abre con este aval."],
                ["La renta real es 2.200 €", ratio(model["steady"]["rent_2200"]["dscr"]), "no cabe en el plan", "Sin precontrato, no hay nave."],
            ],
            [155, 78, 110, 180],
        ),
        Spacer(1, 6),
        P("La lectura que se quiere dejar en el comité es esta: el expediente aguanta un tipo más alto y aguanta vender menos de lo previsto, hasta 14 unidades. No aguanta, a la vez, abrir la nave, cobrar un sueldo y rebajar los precios. Como esas tres cosas son decisiones del promotor y no golpes del mercado, se pueden prohibir por contrato. El golpe de mercado que sí preocupa —el precio— tiene una respuesta automática: dejar de reponer y devolver principal.", "bodyjust"),
    ]

    # ----- 12. Riesgos -----
    story += [
        CondPageBreak(160),
        P("RIESGOS", "eyebrow"),
        h1("12", "Lo que puede fallar, y lo que se hace entonces"),
        table(
            ["Riesgo", "Efecto", "Mitigante que no es una frase"],
            [
                ["Rotación más lenta de lo estudiado", "El RCSD baja; la caja, si se deja de comprar, no.", "Covenant de 12.000 € y tope de 4 unidades hasta ver los días reales."],
                ["Precio de cierre un 5 % bajo el escandallo", "RCSD 0,66x si se sigue el plan ciego.", "Regla de los 1.200 € y amortización del 70 % del cobro."],
                ["Unidad con vicio oculto", "Se come la contribución y la reputación.", "Launch, espesor, historial, exclusión de motores, póliza de 250 € y reserva de 150 € ya metida en el coste."],
                ["Compra con IVA deducible creyendo que es REBU", "El mismo PVP pasa a pérdida.", "Filtro de factura antes de transferir. El ERP ya bloquea el régimen equivocado."],
                ["El 15 % de sociedades no aplica", "Sube el impuesto, no tumba la caja.", "Constituir antes de comprar. La gestoría lo confirma por escrito."],
                ["Abrir la nave demasiado pronto", "Pérdidas y ratio por debajo de cero en estrés.", "El alquiler no es destino de este aval. Gate de 24 ventas y precontrato."],
                ["El promotor necesita dinero para vivir", "La tentación es el sueldo o un préstamo al socio.", "25.000 € personales, a acreditar. Prohibido el sueldo y el préstamo al socio."],
                ["Sogarpo pide más garantía", "Sin aval personal, muchas operaciones nuevas no salen.", "Se anticipa y se firma. No se discute como si fuera una ofensa."],
            ],
            [145, 155, 223],
        ),
        Spacer(1, 6),
        P("No está en la tabla, y conviene decirlo: no hay historial de la sociedad porque la sociedad no existe. El comité va a mirar al promotor. IRPF, CIRBE, extractos y origen de los 50.000 € pesan más que este PDF. El PDF sirve para que, cuando esos papeles lleguen, la historia que cuentan coincida con la operación.", "bodyjust"),
    ]

    # ----- 13. Checklist -----
    story += [
        CondPageBreak(200),
        P("PARA PRESENTAR", "eyebrow"),
        h1("13", "Qué acompaña a este dossier, y qué falta"),
        P("Sogarpo estudia la viabilidad con la documentación, no con la reunión. Sociedad de nueva constitución: no hay cuentas que adjuntar, y decirlo de entrada evita un requerimiento. Lo que sigue es la lista con la que se entra en la oficina online, o en Reconquista 11, Vigo, o en Progreso 145, Ourense.", "bodyjust"),
        table(
            ["Documento", "Estado"],
            [
                ["Esta memoria: actividad, mercado, inversión, proyecciones a 3 años, sensibilidad", "En este dossier"],
                ["Política de compra, protocolo de inspección y tratamiento REBU", "En este dossier"],
                ["DNI del promotor y residencia en Galicia", "A acreditar"],
                ["IRPF de los dos últimos ejercicios", "A acreditar"],
                ["Certificados de estar al corriente: AEAT, TGSS y ATRIGA", "A acreditar"],
                ["Autorización para consultar la CIRBE", "A acreditar"],
                ["Extractos de 6 meses y origen de los 50.000 €", "A acreditar"],
                ["Declaración de bienes, si se quieren invocar los 25.000 €", "A acreditar"],
                ["Vida laboral y currículum. La obra, si se alega, con referencia", "A acreditar"],
                ["Certificado negativo de denominación y proyecto de estatutos", "A acreditar"],
                ["Declaración de ayudas públicas recibidas o pedidas. Hoy: ninguna", "A acreditar"],
                ["Escritura, CIF, cuentas anuales, IS de ejercicios cerrados", "No aplica: sociedad no constituida"],
                ["Precontrato de nave y presupuestos de reforma", "No aplica a este aval. Solo a la fase 2"],
                ["Alta como socio partícipe y suscripción de la cuota social", "Al sancionar, no antes"],
                ["Aval personal del administrador", "Previsible. Llevarlo decidido"],
            ],
            [390, 133],
        ),
        Spacer(1, 8),
        h2("Orden de los próximos pasos"),
        bullets([
            "Confirmar con la gestoría, antes de constituir, el 15 % de nueva creación, la cuota de administrador y el alta en REBU y en VIES el mismo día del 036.",
            "Pedir el certificado de denominación. No usar «Automoción Santiago» ni dar por inscrita una razón social.",
            "Alta en la oficina online de Sogarpo y entrega de este dossier con los justificantes de la columna «a acreditar». Preguntar comisión, cuota social real, reaval IGAPE/CERSA y si prefieren préstamo o, para una parte, póliza.",
            "En paralelo, una entidad con convenio —en Galicia es razonable contrastar al menos dos, no llegar con una sola— para que la oferta de tipo sustituya el 5,50 % de trabajo.",
            "Constituir, desembolsar los 50.000 € en la cuenta de la sociedad y no moverlos a la del promotor. El comité lo va a mirar.",
            "Comprar la primera unidad solo cuando la factura encaje en la vía A o en la vía C y la contribución, con el precio un 5 % por debajo, siga en 800 € o más.",
        ]),
        Spacer(1, 6),
        Callout(
            "Cierre",
            "El aval de 50.000 € se sostiene si el dinero rota coches que Galicia ya ha demostrado que compra, si la caja no baja de 12.000 € y si nadie cobra un sueldo ni abre una nave con el primer desembolso. El RCSD que se ofrece para decidir es 1,60x en el año 2, no el 1,32x del borrador y no el 2,22x del año 1 con carencia. Por encima de 60.000 €, estas hipótesis ya no dan 1,30x. No se pide más. Lo que se pide es que el comité no tenga que descubrir solo lo que este papel ya ha corregido.",
        ),
        Spacer(1, 10),
        P("Fuentes. Tarifas 2026 del plan de arranque interno (DGT, ITV Galicia, IVTM, transporte, placas y equipamiento). Fiscalidad: Ley del IVA y la auditoría interna de las tres vías de compra. Mercado: estudio Alemania / Galicia y matriz de motores, capturas del 24 de septiembre de 2026. Sogarpo: información pública de octubre de 2026 (aval económico, póliza, sedes, reaval IGAPE). El tipo bancario y la comisión exacta de aval son hipótesis. Ninguna cifra es una venta realizada.", "tiny"),
    ]
    return story


def flatten_logo():
    """Compone el logo sobre el color exacto de la portada, sin borde ni canal alfa."""
    try:
        from PIL import Image
    except ImportError:
        return
    if not LOGO.exists():
        return
    im = Image.open(LOGO).convert("RGBA")
    w, h = im.size
    # El PNG trae un filete opaco de 1 px que, al escalar, se ve como un recuadro.
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
    target_h = max(1, round(im.height * target_w / im.width))
    im = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", im.size, (33, 34, 40))
    bg.paste(im, mask=im.split()[-1])
    bg.save(CHARTS / "logo_flat.png", "PNG")


def main():
    flatten_logo()
    model = json.loads((HERE / "modelo_cifras.json").read_text(encoding="utf-8"))
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        title="Dossier de viabilidad para aval Sogarpo — KHC Auto Import",
        author="KHC Auto Import",
        subject="Modelo de trabajo, octubre 2026. No constituye certificación de solvencia.",
        creator="KHC Auto Import — modelo de planificación",
    )
    cover = PageTemplate(
        id="cover",
        frames=[Frame(0, 0, PAGE_W, PAGE_H, id="coverframe", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)],
        onPage=draw_cover,
    )
    later = PageTemplate(
        id="later",
        frames=[Frame(LEFT, BOTTOM, USABLE, PAGE_H - TOP - BOTTOM - 8, id="laterframe", showBoundary=0)],
        onPage=draw_later,
    )
    doc.addPageTemplates([cover, later])
    doc.build(build_story(model))
    print(OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()

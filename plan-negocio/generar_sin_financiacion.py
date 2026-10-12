#!/usr/bin/env python3
"""Plan de arranque con 50.000 € propios, sin préstamo. Nave O Milladoiro.

Las cifras salen del mismo libro de caja (probar_sin_financiacion.py) y de
los datos cerrados de la nave, la reforma y el equipo
(datos_nave_milladoiro.py). No se inventa ninguna partida.
"""

from __future__ import annotations

import importlib.util
from collections import Counter
import sys
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import Color, white
from reportlab.lib.utils import ImageReader
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
r2 = g.r2

OUT = HERE / "Analisis_Sin_Financiacion.pdf"
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
MUTED = Color(0.78, 0.76, 0.70)

# --- Cifras ---------------------------------------------------------------
OPENING = ["GTI", "GTI", "116d"]
assert d.REFORMA_TOTAL == g.REFORM, (d.REFORMA_TOTAL, g.REFORM)
assert r2(sum(a for _, a in d.KIT_LINES)) == g.KIT
assert d.NAVE["alquiler"] == g.RENT

FIXED_LINES = [
    ("Nave O Milladoiro, 465 m²", g.RENT, "Alquiler"),
    ("Autónomo societario", g.RETA, "Seguridad Social. No es un sueldo"),
    ("Portales y gestoría", g.MKT, "Coches.net, Milanuncios Pro y gestoría"),
    ("Luz, agua y vado", g.UTIL, "Suministros de la nave"),
    ("Internet y teléfono", g.NET, "Fibra y línea de la nave"),
]
FIXED = p.fixed_of(True)
FUND = p.fund_of(True)
assert r2(sum(a for _, a, _ in FIXED_LINES)) == FIXED

# Fianza (LAU art. 36.1): dos mensualidades, sale el día 1 y se recupera.
# Lo que falte para el fondo se quita de la reforma y se paga cuando cabe.
A = p.arranque(OPENING)
DEPOSIT = A["deposit"]
LATER = A["later"]
REFORM_NOW = A["now"]
LATER_LINES = A["lines"]
LATER_KEYS = {(pt, lab) for pt, lab, _ in LATER_LINES}
CARS3 = A["cars"]
OWN = p.simulate(OPENING, 1, p.FAM, deposit=DEPOSIT, later=LATER)
assert OWN and OWN["pending"] == 0.0 and OWN["later_n"] and OWN["later_n"] <= 12
LATER_N = OWN["later_n"]
DAY1 = OWN["months"][0]["end"]
assert abs(DAY1 - r2(50000 - DEPOSIT - g.KIT - REFORM_NOW - CARS3 - FIXED)) < 0.02
assert DAY1 + 1e-6 >= FUND
CUT_MONTHS = [m for m in OWN["months"] if m["sal"] + 0.02 < m["want"]]
# Sin aplazar nada, con la fianza, la apertura no cabe sobre el fondo.
assert p.simulate(OPENING, 1, p.FAM, deposit=DEPOSIT) is None
# Alternativa: abrir con dos GTI, fianza pagada y reforma entera el día 1.
TWO_GTI = p.simulate(["GTI", "GTI"], 1, p.FAM, deposit=DEPOSIT)
assert TWO_GTI and TWO_GTI["cuts"] == 0
NOFIANZA = p.simulate(OPENING, 1, p.FAM)
try:
    _extra = d.lineas_aplazadas(r2(A["falta"] + g.RENT))
    EXTRA_MONTH_OK = True
except SystemExit:
    EXTRA_MONTH_OK = False

MISS = r2(DAY1 - FIXED)
MISS2 = r2(MISS - FIXED)


def _old_plan():
    """El mismo plan con la nave anterior (San Marcos), para ver qué cambia."""
    keep = (g.RENT, g.NET, g.REFORM)
    g.RENT, g.NET, g.REFORM = 1100.0, 0.0, 4550.0
    try:
        return p.simulate(OPENING, 1, p.FAM), p.fixed_of(True)
    finally:
        g.RENT, g.NET, g.REFORM = keep


OLD, OLD_FIXED = _old_plan()
assert abs(OLD["equity"] - 227649.38) < 0.05  # cifra del PDF anterior
assert p.fixed_of(True) == FIXED


def _scaled(unit, factor):
    u = dict(unit)
    u["sell"] = r2(u["sell"] * factor)
    gross = r2(u["sell"] - u["cost"])
    u["rebu"] = r2(gross * 21 / 121)
    u["net"] = r2(gross - u["rebu"])
    return u


def own_price_cut(factor):
    saved = {id(u): (u["sell"], u["rebu"], u["net"]) for u in p.LOT}
    for u in p.LOT:
        s = _scaled(u, factor)
        u["sell"], u["rebu"], u["net"] = s["sell"], s["rebu"], s["net"]
    try:
        return p.simulate(OPENING, 1, p.FAM, deposit=DEPOSIT, later=LATER)
    finally:
        for u in p.LOT:
            u["sell"], u["rebu"], u["net"] = saved[id(u)]


CUT5 = own_price_cut(0.95)
assert abs(p.BY["GTI"]["sell"] - 18500) < 0.05


def eur(n, cents=True):
    return g.eur(n, cents)


# --- Dibujo ----------------------------------------------------------------
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
    c.drawCentredString(W / 2, 18, "50.000 € propios  ·  sin préstamo  ·  nave O Milladoiro, 465 m²")
    c.setFillColor(GOLD if dark else INK)
    c.drawRightString(W - 28, 18, f"{n:02d}  /  {total:02d}")


def kicker(c, text, y, x=36):
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 8)
    c.drawString(x, y, text.upper())


def heading(c, kick, text, y=498, size=20):
    kicker(c, kick, y)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", size)
    c.drawString(36, y - 30, text)
    return y - 30


def wrap(c, text, font, size, x, y, width, leading, color, max_lines=6):
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


def photo(c, path, x, y, w, h, caption=None, dark=False):
    """Recorta al centro para llenar el hueco sin deformar."""
    im = Image.open(path).convert("RGB")
    target = w / h
    iw, ih = im.size
    if iw / ih > target:
        nw = int(ih * target)
        im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else:
        nh = int(iw / target)
        im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    im.thumbnail((int(w * 2.2), int(h * 2.2)))
    c.drawImage(ImageReader(im), x, y, width=w, height=h)
    c.setStrokeColor(GOLD if dark else LINE)
    c.setLineWidth(0.8)
    c.rect(x, y, w, h, fill=0, stroke=1)
    if caption:
        c.setFillColor(Color(0, 0, 0, alpha=0.55))
        c.rect(x, y, w, 16, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DejaVu", 7)
        c.drawString(x + 6, y + 5, caption)


def stat_cards(c, stats, y=72, h=78, size=16):
    x = 36
    for val, lab in stats:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, y, 286, h, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", size)
        c.drawString(x + 14, y + h - 38, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 8)
        c.drawString(x + 14, y + 16, lab.upper())
        x += 302


def draw_cover(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    logo = HERE / "presentacion" / "logo_flat.png"
    if logo.exists():
        c.drawImage(str(logo), 36, 440, width=120, height=50, mask="auto", preserveAspectRatio=True, anchor="w")
    photo(c, d.FOTOS / "render_fachada_real.jpg", 560, 182, 364, 272, "Recreación sobre la fachada real, Ref. C1290", dark=True)
    kicker(c, "Plan de arranque sin financiación", 410)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 27)
    c.drawString(36, 362, "50.000 € propios.")
    c.drawString(36, 328, "Nave O Milladoiro, 465 m².")
    wrap(
        c,
        "Sin préstamo. Nave nueva en Ames, junto a la autopista. Fianza de " + eur(DEPOSIT, False) + " pagada el día 1. Reforma con materiales cerrados, " + eur(g.REFORM) + ", hecha por él: " + eur(REFORM_NOW) + " el día 1 y " + eur(LATER) + " el mes " + str(LATER_N) + ". Dos GTI y un 116d el día 1.",
        "DejaVu", 11.5, 36, 292, 500, 15.5, MUTED, 5,
    )
    stat_cards(c, [
        (eur(DAY1), "Caja al cerrar el día 1"),
        (eur(DEPOSIT, False), "Fianza, dos meses (se recupera)"),
        ("3 → " + str(OWN["stock"]), "Coches, del día 1 al mes 36"),
    ])
    footer(c, n, total, True)


def draw_nave(c, n, total):
    bg(c)
    heading(c, "La nave", "O Milladoiro, Ames. 465 m² por 1.200 € al mes.", size=19)
    photo(c, d.FOTOS / "87526-57032525-1498641103.jpg.webp", 36, 262, 300, 190, "Fachada, foto real")
    photo(c, d.FOTOS / "87526-57032525-1498641086.jpg.webp", 36, 62, 300, 190, "Almacén, 40 × 10 m, foto real")
    y = 432
    for i, (lab, val) in enumerate(d.NAVE_FICHA):
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(356, y - 14, 568, 40, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(372, y + 10, lab.upper())
        c.setFillColor(INK)
        c.setFont("DejaVu", 11)
        c.drawString(372, y - 5, val)
        y -= 44
    c.setFillColor(SLATE)
    wrap(
        c,
        "Sustituye a San Marcos. Más del doble de espacio por 100 € más de alquiler. Sin mudanza en 3-5 años.",
        "DejaVu", 9.5, 356, y + 8, 568, 12.5, SLATE, 2,
    )
    footer(c, n, total)


def draw_zonas(c, n, total):
    bg(c)
    heading(c, "Cómo se usa", "Dentro caben de 11 a 14 coches. Fuera, de 6 a 8.", size=19)
    photo(c, d.FOTOS / "plano.webp", 36, 62, 220, 390, "Plano de la nave")
    c.setFillColor(INK)
    c.rect(276, 430, 648, 22, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawString(290, 437, "ZONA")
    c.drawRightString(520, 437, "M²")
    c.drawString(540, 437, "USO")
    c.drawRightString(910, 437, "COCHES")
    for i, (zona, m2, uso, coches) in enumerate(d.ZONAS):
        y = 402 - i * 34
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(276, y - 10, 648, 32, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10)
        c.drawString(290, y, zona)
        c.setFont("DejaVu", 10)
        c.drawRightString(520, y, str(m2))
        c.setFillColor(SLATE)
        c.drawString(540, y, uso)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10)
        c.drawRightString(910, y, coches)
    y = 402 - len(d.ZONAS) * 34 - 8
    c.setFillColor(COVER)
    c.roundRect(276, y - 10, 648, 32, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 10)
    c.drawString(290, y, "Capacidad total")
    c.drawRightString(910, y, "14-18 coches a la vez")
    wrap(
        c,
        "El plan empieza con 3 coches y llega a " + str(OWN["stock"]) + " en el mes 36. La nave aguanta ese suelo sin cambiar de local. Las fotos para los portales se hacen dentro, con luz controlada.",
        "DejaVu", 10, 276, y - 32, 648, 13.5, SLATE, 3,
    )
    footer(c, n, total)


def draw_reforma(c, n, total):
    bg(c)
    heading(c, "La reforma, hecha por él", "Siete partidas. " + eur(g.REFORM) + " en materiales. Día 1: " + eur(REFORM_NOW) + ". El resto, " + eur(LATER) + ", el mes " + str(LATER_N) + ".", size=18)
    maxv = max(pt["total"] for pt in d.REFORMA)
    y = 418
    for pt in d.REFORMA:
        c.setFillColor(CARD)
        c.rect(36, y - 12, 888, 36, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10.5)
        c.drawString(50, y + 4, pt["partida"])
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8.5)
        c.drawString(50, y - 7, pt["nota"])
        late = r2(sum(a for q, _, a in LATER_LINES if q == pt["partida"]))
        wnow = 300 * (pt["total"] - late) / maxv
        c.setFillColor(GOLD)
        c.roundRect(400, y - 3, max(wnow, 0.1), 12, 2, fill=1, stroke=0)
        if late:
            c.setFillColor(LINE)
            c.roundRect(400 + wnow, y - 3, 300 * late / maxv, 12, 2, fill=1, stroke=0)
            c.setFillColor(GOLD_DEEP)
            c.setFont("DejaVuBold", 7.5)
            c.drawString(400 + wnow + 300 * late / maxv + 6, y, "mes " + str(LATER_N) + ": " + eur(late))
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10.5)
        c.drawRightString(908, y - 1, eur(pt["total"]))
        y -= 40
    c.setFillColor(COVER)
    c.roundRect(36, y - 12, 888, 34, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 11)
    c.drawString(50, y + 1, "Total reforma Fase 1, IVA incluido")
    c.setFillColor(GOLD)
    c.drawRightString(908, y + 1, eur(g.REFORM))
    wrap(
        c,
        "Precios con IVA. Sin contratista: él tiene oficio. No hace falta permiso de obra. Dorado: se paga el día 1 (" + eur(REFORM_NOW) + "). Gris: " + str(len(LATER_LINES)) + " líneas que pueden esperar (" + eur(LATER) + "), porque la fianza no deja sitio. Se pagan el mes " + str(LATER_N) + ", con la primera venta. No entra en la base del impuesto.",
        "DejaVu", 9.5, 36, y - 30, 888, 12.5, SLATE, 2,
    )
    footer(c, n, total)


def draw_reforma_detalle(c, n, total):
    bg(c)
    heading(c, "La lista de la compra", "Cada línea de la reforma, con su precio. Las marcadas «mes " + str(LATER_N) + "» esperan a la primera venta.", size=19)
    cols = [d.REFORMA[0:3], d.REFORMA[3:5], d.REFORMA[5:7]]
    xs = [36, 338, 640]
    for x, group in zip(xs, cols):
        y = 440
        for pt in group:
            c.setFillColor(COVER)
            c.rect(x, y - 6, 284, 20, fill=1, stroke=0)
            c.setFillColor(GOLD)
            c.setFont("DejaVuBold", 8.5)
            c.drawString(x + 8, y, pt["partida"].upper())
            c.drawRightString(x + 276, y, eur(pt["total"]))
            y -= 18
            for i, (lab, amount) in enumerate(pt["lineas"]):
                late = (pt["partida"], lab) in LATER_KEYS
                c.setFillColor(CARD if i % 2 == 0 else SOFT)
                c.rect(x, y - 5, 284, 16, fill=1, stroke=0)
                c.setFillColor(SLATE if late else INK)
                c.setFont("DejaVu", 7.4)
                c.drawString(x + 8, y, lab)
                if late:
                    c.setFillColor(GOLD)
                    c.roundRect(x + 196, y - 3, 34, 11, 2, fill=1, stroke=0)
                    c.setFillColor(WHITE)
                    c.setFont("DejaVuBold", 6.3)
                    c.drawCentredString(x + 213, y, "mes " + str(LATER_N))
                    c.setFillColor(SLATE)
                c.setFont("DejaVuBold", 7.4)
                c.drawRightString(x + 276, y, eur(amount))
                y -= 16
            y -= 12
    c.setFillColor(COVER)
    c.roundRect(640, y - 14, 284, 34, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 10)
    c.drawString(652, y - 1, "Total reforma")
    c.setFillColor(GOLD)
    c.drawRightString(912, y - 1, eur(g.REFORM))
    wrap(c, "Día 1: " + eur(REFORM_NOW) + ". Mes " + str(LATER_N) + ": " + eur(LATER) + ". IVA incluido. Mano de obra propia: 0 €. Fuente: REFORMA_FASE1_COMPLETA.md.", "DejaVu", 8.5, 640, y - 34, 284, 11, SLATE, 3)
    footer(c, n, total)


def draw_cronograma(c, n, total):
    bg(c)
    heading(c, "Catorce días", "Lo que abre la nave se hace en el mes 1, mientras llegan los coches. El resto, el mes " + str(LATER_N) + ".", size=19)
    y = 432
    for i, (dias, trabajo) in enumerate(d.CRONOGRAMA):
        last = i == len(d.CRONOGRAMA) - 1
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 10, 430, 32, fill=1, stroke=0)
        c.setFillColor(GOLD if last else GOLD_DEEP)
        c.setFont("DejaVuBold", 9.5)
        c.drawString(50, y, dias)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 10)
        c.drawString(140, y, trabajo)
        y -= 36
    wrap(
        c,
        "Epoxi: tráfico ligero a las 24 h, coches a los 7 días. Los coches tardan como máximo una semana en llegar.",
        "DejaVu", 9, 36, y + 6, 430, 12, SLATE, 2,
    )
    photo(c, d.FOTOS / "render_interior_real.jpg", 490, 262, 434, 190, "Así quedará el almacén. Recreación sobre la foto real")
    photo(c, d.FOTOS / "render_oficinas_real.jpg", 490, 62, 434, 190, "Así quedarán las oficinas. Recreación sobre la foto real")
    footer(c, n, total)


def draw_equipo(c, n, total):
    bg(c)
    heading(c, "El equipo", "Lo que se compra para revisar coches, y lo que la nave ya trae.", size=18)
    kicker(c, "Equipo de revisión, antes del primer coche", 440)
    y = 418
    for i, (lab, amount) in enumerate(d.KIT_LINES):
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 7, 470, 22, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 9.5)
        c.drawString(48, y, lab)
        c.setFont("DejaVuBold", 9.5)
        c.drawRightString(494, y, eur(amount))
        y -= 24
    y -= 8
    c.setFillColor(COVER)
    c.roundRect(36, y - 9, 470, 28, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 10)
    c.drawString(48, y, "Total equipo de revisión")
    c.drawRightString(494, y, eur(g.KIT))

    kicker(c, "Equipamiento de la nave, dentro de la reforma", 440, 530)
    rows = [
        ("Mobiliario de oficina", d.REFORMA[4]["total"]),
        ("Cámaras, alarma y focos", d.REFORMA[5]["total"]),
        ("Herramientas de taller", 500.00),
        ("Extintores y botiquín", 100.00),
    ]
    y = 418
    for i, (lab, amount) in enumerate(rows):
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(530, y - 7, 394, 22, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 9.5)
        c.drawString(542, y, lab)
        c.setFont("DejaVuBold", 9.5)
        c.drawRightString(912, y, eur(amount))
        y -= 24
    wrap(c, "Ya están sumados en los " + eur(g.REFORM) + ". No se cuentan otra vez. Las herramientas de taller y parte del mobiliario se compran el mes " + str(LATER_N) + ".", "DejaVu", 8.5, 530, y + 2, 394, 11, SLATE, 2)
    kicker(c, "Ya viene con la nave. 0 €", y - 30, 530)
    y -= 52
    for item in d.YA_ESTA:
        c.setFillColor(GREEN)
        c.circle(538, y + 3, 2.5, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 9.5)
        c.drawString(548, y, item)
        y -= 17
    footer(c, n, total)


def draw_fixed(c, n, total):
    bg(c)
    heading(c, "Cada mes, haya venta o no", "Cinco partidas. El sueldo no está aquí. No hay cuota.", size=19)
    maxv = g.RENT
    y = 408
    for lab, amount, note in FIXED_LINES:
        c.setFillColor(CARD)
        c.roundRect(36, y - 16, 888, 42, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 16, 3, 42, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 12)
        c.drawString(56, y + 4, lab)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8.5)
        c.drawString(56, y - 9, note)
        c.setFillColor(GOLD)
        c.roundRect(420, y - 1, 320 * amount / maxv, 10, 2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 12)
        c.drawRightString(908, y - 1, eur(amount))
        y -= 50
    c.setFillColor(COVER)
    c.roundRect(36, y - 10, 888, 36, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 12)
    c.drawString(52, y + 2, "Cada mes, sin sueldo y sin cuota")
    c.setFillColor(GOLD)
    c.drawRightString(908, y + 2, eur(FIXED))
    wrap(
        c,
        "El fondo son tres meses de esto: " + eur(FUND) + ". No se compra un coche que lo rompa. Con San Marcos eran " + eur(OLD_FIXED) + " al mes: " + eur(r2(FIXED - OLD_FIXED)) + " más, 100 € de alquiler y 50 € de internet.",
        "DejaVu", 10.5, 36, y - 28, 888, 14, INK, 2,
    )
    footer(c, n, total)


def draw_day1(c, n, total):
    bg(c)
    heading(c, "El día 1, con 50.000 €", "Fianza, kit, reforma, tres coches y el primer mes. Cabe, sin tocar el fondo.", size=19)
    rows = [
        ("Capital propio", 50000, False),
        ("Fianza de la nave, dos mensualidades (se recupera)", -DEPOSIT, False),
        ("Equipo de revisión, antes de comprar", -g.KIT, False),
        ("Reforma, parte del día 1 (materiales, hecha por él)", -REFORM_NOW, False),
        ("Dos Golf GTI y un BMW 116d", -CARS3, False),
        ("Nave, autónomo, portales, luz e internet, mes 1", -FIXED, False),
        ("Caja al cerrar el día", DAY1, True),
    ]
    y = 414
    for i, (lab, val, last) in enumerate(rows):
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.roundRect(36, y - 8, 888, 30, 3, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 11)
        c.drawString(52, y + 2, lab)
        c.setFont("DejaVuBold", 11)
        c.drawRightString(908, y + 2, eur(val))
        y -= 36
    y -= 4
    boxes = [
        ("Fondo, tres meses de gastos", eur(FUND), INK),
        ("Queda por encima del fondo", eur(r2(DAY1 - FUND)), GREEN),
        ("Resto de la reforma, mes " + str(LATER_N), eur(LATER), GOLD_DEEP),
    ]
    x = 36
    for lab, val, col in boxes:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, y - 44, 286, 56, 3, fill=1, stroke=1)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8.5)
        c.drawString(x + 14, y - 6, lab.upper())
        c.setFillColor(col)
        c.setFont("DejaVuSerif", 17)
        c.drawString(x + 14, y - 32, val)
        x += 301
    wrap(
        c,
        "Sin la fianza el día 1 cerraba con " + eur(NOFIANZA["months"][0]["end"]) + ". Para pagarla y seguir por encima del fondo faltaban " + eur(A["falta"]) + ": salen de la reforma, en " + str(len(LATER_LINES)) + " líneas que pueden esperar.",
        "DejaVu", 9, 36, y - 62, 888, 12, SLATE, 2,
    )
    footer(c, n, total)


def draw_fianza(c, n, total):
    bg(c)
    heading(c, "La fianza entra. La reforma se parte", "Dos mensualidades, " + eur(DEPOSIT) + ", el día de la firma. Lo que falta sale de la reforma.", size=18)
    wrap(
        c,
        "La Ley de Arrendamientos Urbanos (art. 36.1) obliga a dos mensualidades de fianza en un local que no es vivienda. No es gasto y se recupera al dejar la nave, pero sale de caja el día 1. Con ella, al fondo de reserva le faltaban "
        + eur(A["falta"]) + ". No se toca el fondo ni el sueldo: se aplaza lo que no hace falta para abrir.",
        "DejaVu", 10, 36, 440, 888, 13.5, INK, 3,
    )
    # Tabla de lo aplazado
    x0, w0 = 36, 520
    y = 384
    c.setFillColor(INK)
    c.rect(x0, y - 6, w0, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawString(x0 + 10, y, "SE COMPRA EL MES " + str(LATER_N) + ", CON LA PRIMERA VENTA")
    c.drawString(x0 + 300, y, "PARTIDA")
    c.drawRightString(x0 + w0 - 10, y, "IMPORTE")
    y -= 20
    for i, (pt, lab, amount) in enumerate(LATER_LINES):
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(x0, y - 6, w0, 20, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 8.8)
        c.drawString(x0 + 10, y, lab)
        c.setFillColor(SLATE)
        ptxt = pt
        while c.stringWidth(ptxt, "DejaVu", 8.8) > 135:
            ptxt = ptxt[:-2].rstrip(" ,") + "…"
            ptxt = ptxt.replace("……", "…")
        c.drawString(x0 + 300, y, ptxt)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 8.8)
        c.drawRightString(x0 + w0 - 10, y, eur(amount))
        y -= 20
    c.setFillColor(COVER)
    c.rect(x0, y - 6, w0, 22, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 9)
    c.drawString(x0 + 10, y + 1, "Total aplazado")
    c.setFillColor(GOLD)
    c.drawRightString(x0 + w0 - 10, y + 1, eur(LATER))
    wrap(c, "Suelo, pintura, luz, puertas y la mesa de recepción se hacen el día 1: sin eso no se abre. Lo aplazado es decoración, archivo, el logo de pared y las herramientas de taller.", "DejaVu", 8.8, x0, y - 22, w0, 11.5, SLATE, 3)
    # Tarjetas
    cards = [
        ("Así queda el plan", eur(DAY1), "Caja al cerrar el día 1, " + eur(r2(DAY1 - FUND)) + " sobre el fondo. Reforma: " + eur(REFORM_NOW) + " el día 1 y " + eur(LATER) + " el mes " + str(LATER_N) + ". " + ("Sueldo sin recortes en 36 meses." if not OWN["cuts"] else "Sueldo recortado " + str(OWN["cuts"]) + " meses.") + " Al mes 36: " + str(OWN["stock"]) + " coches y " + eur(OWN["equity"]) + " dentro.", GREEN),
        ("La otra salida: dos GTI", eur(TWO_GTI["months"][0]["end"]), "Reforma entera el día 1 y el 116d entra después. Sin recortes: " + str(TWO_GTI["stock"]) + " coches al mes 36 y " + eur(TWO_GTI["equity"]) + " dentro.", SLATE),
    ]
    y = 384
    for title, val, body, col in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(580, y - 138, 344, 150, 3, fill=1, stroke=1)
        c.setFillColor(col)
        c.rect(580, y + 9, 344, 3, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(596, y - 12, title)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 7.5)
        c.drawString(596, y - 28, "CAJA AL CERRAR EL DÍA 1")
        c.setFillColor(col)
        c.setFont("DejaVuSerif", 18)
        c.drawString(596, y - 52, val)
        wrap(c, body, "DejaVu", 9, 596, y - 74, 312, 12, SLATE, 5)
        y -= 164
    footer(c, n, total)


def draw_36(c, n, total):
    bg(c)
    heading(c, "Los 36 meses", "Misma regla de venta y de sueldo. Cambian la nave, la reforma y la fianza.", size=18)
    c.setFillColor(INK)
    c.rect(36, 440, 888, 22, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(640, 447, "ANTES · SAN MARCOS")
    c.drawRightString(900, 447, "AHORA · O MILLADOIRO")
    cut_txt = "Ninguno" if not CUT_MONTHS else ", ".join("mes " + str(m["n"]) for m in CUT_MONTHS)
    rows = [
        ("Fianza de la nave", "No estaba", eur(DEPOSIT), False),
        ("Reforma", eur(4550) + " el día 1", eur(REFORM_NOW) + " + " + eur(LATER) + " (mes " + str(LATER_N) + ")", False),
        ("Gastos fijos al mes", eur(OLD_FIXED), eur(FIXED), False),
        ("Caja al cerrar el día 1", eur(OLD["months"][0]["end"]), eur(DAY1), False),
        ("Ventas, año 1 / 2 / 3", " / ".join(str(x) for x in OLD["sales_y"]), " / ".join(str(x) for x in OWN["sales_y"]), False),
        ("Coches al mes 36", str(OLD["stock"]), str(OWN["stock"]), False),
        ("Bolsillo de la familia, 36 meses", eur(OLD["pocket"]), eur(OWN["pocket"]), False),
        ("Mes con el sueldo recortado", "Ninguno", cut_txt, False),
        ("Beneficio del año 3", eur(OLD["result3"]), eur(OWN["result3"]), False),
        ("Caja al cerrar el mes 36", eur(OLD["cash"]), eur(OWN["cash"]), False),
        ("Deuda", "0 €", "0 €", False),
        ("Lo que es suyo dentro (fianza incluida)", eur(OLD["equity"]), eur(OWN["equity"]), True),
    ]
    for i, (lab, a, b, last) in enumerate(rows):
        y = 416 - i * 29
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 9, 888, 27, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 10)
        c.drawString(52, y, lab)
        c.setFont("DejaVu", 10)
        c.setFillColor(GOLD if last else SLATE)
        c.drawRightString(640, y, a)
        c.setFont("DejaVuBold", 10)
        c.setFillColor(GOLD if last else (RED if lab.startswith("Mes con") and CUT_MONTHS else INK))
        c.drawRightString(900, y, b)
    wrap(c, "La fianza y la reforma aplazada frenan el crecimiento: el plan repone menos coches durante el año 2. A cambio, el sueldo no se recorta ningún mes.", "DejaVu", 8.8, 36, 416 - len(rows) * 29 + 4, 888, 11.5, SLATE, 2)
    footer(c, n, total)


def draw_close(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    kicker(c, "La decisión", 430)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 26)
    c.drawString(36, 378, "Con la nave de O Milladoiro,")
    c.drawString(36, 344, "el plan sin préstamo sigue en pie.")
    wrap(
        c,
        "Fianza de " + eur(DEPOSIT) + ", kit de " + eur(g.KIT) + " y " + eur(REFORM_NOW) + " de reforma el día 1; el resto, " + eur(LATER) + ", el mes " + str(LATER_N) + ". Con dos GTI y un 116d quedan " + eur(r2(DAY1 - FUND)) + " sobre el fondo y hay que vender desde el mes 2. Sueldo sin recortes. Sin deuda.",
        "DejaVu", 12, 36, 296, 880, 16, MUTED, 5,
    )
    stat_cards(c, [
        (eur(OWN["equity"]), "Suyo, sin deuda, al mes 36"),
        (eur(OWN["pocket"]), "Bolsillo de la familia, 36 meses"),
        ("465 m²", "Sin cambiar de nave en 3-5 años"),
    ])
    footer(c, n, total, True)


# --- Libro de caja, mes a mes ---------------------------------------------
LEDGER = p.ledger(OPENING, 1, p.FAM, deposit=DEPOSIT, later=LATER)
assert abs(LEDGER[-1]["end"] - OWN["cash"]) < 0.05
LOT7 = sorted(p.LOT, key=lambda u: -u["net"])
AVG = {k: r2(sum(u[k] for u in p.LOT) / len(p.LOT)) for k in ("cost", "sell", "rebu", "net")}
NICK_NAME = {
    "GTI": "Golf GTI", "116d": "BMW 116d", "Mercedes": "Mercedes Clase C",
    "Golf VIII": "Golf VIII", "318d": "BMW 318d", "XC40": "Volvo XC40", "Audi": "Audi A3",
}


def short_car(name):
    return (
        name.replace("Mercedes-Benz ", "").replace("Volkswagen ", "")
        .replace(" Performance", "").replace(" Manual", "").replace(" Touring", "")
        .replace(" 2.0 D3", "").replace(" 1.0 TFSI", "").replace(" 1.0 TSI", "")
    )


def extra_bought(m):
    """Coches comprados ese mes que no reponen una venta."""
    left = Counter(u["nick"] for u in m["sold"])
    out = []
    for u in m["bought"]:
        if left[u["nick"]]:
            left[u["nick"]] -= 1
        else:
            out.append(u["nick"])
    return out


def what_happened(m):
    if m["n"] == 1:
        return "Apertura: fianza, kit, reforma (parte) y tres coches"
    sold = g.join_names([u["nick"] for u in m["sold"]])
    extra = extra_bought(m)
    bits = [sold]
    if "Mercedes" in extra:
        bits.append("entra el Mercedes")
        extra = [x for x in extra if x != "Mercedes"]
    if extra:
        bits.append("otro " + g.join_names(extra) if len(extra) == 1 else g.join_names(extra) + " más")
    if m.get("later"):
        bits.append("resto de la reforma")
    if m["tax_paid"]:
        bits.append("impuesto")
    if m["sal"] + 0.02 < m["want"]:
        bits.append("sueldo recortado")
    elif m["n"] == SAL_START:
        bits.append("empieza el sueldo")
    elif m["n"] in (13, 25):
        bits.append("sube el sueldo")
    return ", ".join(bits)


def year_sum(y):
    a, b = (1, 12) if y == 1 else (13, 24) if y == 2 else (25, 36)
    ms = [m for m in LEDGER if a <= m["n"] <= b]
    out = {
        "months": ms,
        "sales": sum(m["sales"] for m in ms),
        "cobro": r2(sum(m["cobro"] for m in ms)),
        "rebu": r2(sum(m["rebu"] for m in ms)),
        "compra": r2(sum(m["compra"] for m in ms)),
        "margen": r2(sum(m.get("margen", 0.0) for m in ms)),
        "fixed": r2(FIXED * len(ms)),
        "kit": g.KIT if y == 1 else 0.0,
        "reform": g.REFORM if y == 1 else 0.0,
        "sal": r2(sum(m["sal"] for m in ms)),
        "pocket": r2(sum(m["pocket"] for m in ms)),
        "tax_paid": r2(sum(m["tax_paid"] for m in ms)),
        "start": ms[0]["start"],
        "end": ms[-1]["end"],
        "stock": ms[-1]["stock"],
        "min": min(ms, key=lambda m: m["end"]),
    }
    out["ebitda"] = r2(out["margen"] - out["fixed"] - out["kit"] - out["sal"])
    out["tax"] = {1: OWN["y1_tax"], 2: OWN["y2_tax"], 3: OWN["tax3"]}[y]
    out["result"] = r2(out["ebitda"] - out["tax"])
    out["stock_cost"] = r2(sum(u["cost"] for u in [dict(p.BY[nk]) for nk in ms[-1]["floor_cars"]]))
    return out


Y = {y: year_sum(y) for y in (1, 2, 3)}
assert abs(Y[1]["result"] - OWN["y1_result"]) < 0.05
assert abs(Y[2]["result"] - OWN["y2_result"]) < 0.05
assert abs(Y[3]["result"] - OWN["result3"]) < 0.05
assert [Y[y]["sales"] for y in (1, 2, 3)] == OWN["sales_y"]
_y1 = Y[1]
assert abs(r2(50000 - DEPOSIT + _y1["cobro"] - _y1["compra"] - _y1["rebu"] - _y1["fixed"] - _y1["kit"] - _y1["reform"] - _y1["sal"] - _y1["tax_paid"]) - _y1["end"]) < 0.05
REDUC2 = r2(min(0.20 * max(0.0, Y[1]["result"]), 0.25 * max(0.0, Y[2]["ebitda"])))
SAVE2 = r2(r2(Y[2]["ebitda"] * 0.15) - Y[2]["tax"])
REFORM_TAX = r2(g.REFORM * 0.15)
LOW = min(LEDGER, key=lambda m: m["end"])
PRICE3 = own_price_cut(0.97)
TAX23_Y1 = r2(max(0.0, Y[1]["ebitda"]) * 0.23)
SAL_CUTS = [m for m in LEDGER if m["sal"] + 0.02 < m["want"]]
TAX_MONTHS = [m["n"] for m in LEDGER if m["tax_paid"]]
assert len(TAX_MONTHS) == 2
TAX_M1, TAX_M2 = TAX_MONTHS
MERC_N = next(m["n"] for m in LEDGER if m["n"] > 1 and "Mercedes" in extra_bought(m))
SAL_START = next(m["n"] for m in LEDGER if m["want"] > 0)
assert abs(OWN["equity"] - r2(OWN["cash"] + OWN["stock_cost"] + DEPOSIT - OWN["tax3"])) < 0.05
GTI_MONTHS = r2(2 * p.BY["GTI"]["net"] / FIXED)


def table_head(c, y, cols):
    c.setFillColor(INK)
    c.rect(36, y, 888, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7.5)
    for x, lab, align in cols:
        if align == "l":
            c.drawString(x, y + 7, lab)
        else:
            c.drawRightString(x, y + 7, lab)


def draw_index(c, n, total):
    bg(c)
    heading(c, "Qué hay en este plan", "Cuatro partes. Todas con las cifras de la nave nueva.", size=19)
    parts = [
        ("01", "La empresa", "Qué se vende, cómo se gana un coche, los siete coches con coste cerrado, el programa y qué motor entra."),
        ("02", "La nave", "O Milladoiro: fotos, plano y zonas. La reforma con cada material y su precio, los 14 días de obra y el equipo."),
        ("03", "El dinero", "Gastos fijos, sueldo de la familia y la regla. El día 1, el mes 2 y los tres años mes a mes, con caja, impuesto y beneficio."),
        ("04", "Lo que puede fallar", "Antes y ahora, la fianza del local, cada desvío con su número, la decisión y de dónde sale cada cifra."),
    ]
    y = 420
    for num, title, body in parts:
        c.setFillColor(CARD)
        c.roundRect(36, y - 50, 888, 70, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 50, 3, 70, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuSerif", 24)
        c.drawString(56, y - 26, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 13)
        c.drawString(120, y - 6, title)
        wrap(c, body, "DejaVu", 10, 120, y - 26, 780, 13, SLATE, 2)
        y -= 84
    footer(c, n, total)


def draw_company(c, n, total):
    bg(c)
    heading(c, "Qué es la empresa", "Se venden coches seleccionados. No se vende una importación.", size=19)
    cards = [
        ("01", "El producto", "Coches de ocasión, nacionales o traídos de fuera. Se compra donde el número cierra. No hay un país de bandera."),
        ("02", "El cliente", "Galicia, y envío a toda España. El precio publicado va de 12.000 a 24.000 €: se decide y se financia en días."),
        ("03", "La promesa", "Doce meses de garantía, por escrito, en todas las ventas. Si el historial no se acredita, no se paga el coche."),
        ("04", "El local", "Nave de 465 m² en O Milladoiro, Ames, junto a la autopista. 400 m² de almacén, 60 m² de oficinas y patio de 100 m²."),
        ("05", "El dinero", "50.000 € propios. Sin préstamo, sin aval y sin cuota. Lo que se gana se queda dentro y compra más coches."),
        ("06", "Quién lo hace", "Él compra, revisa, reforma la nave y vende. La familia cobra un sueldo desde el mes 6. El cargo de administrador es gratuito si los estatutos no dicen otra cosa."),
    ]
    for i, (num, title, body) in enumerate(cards):
        x = 36 + (i % 3) * 302
        y = 420 - (i // 3) * 170
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, y - 140, 286, 156, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, y + 14, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(x + 16, y - 8, num)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 16)
        c.drawString(x + 16, y - 32, title)
        wrap(c, body, "DejaVu", 9.5, x + 16, y - 56, 254, 13, SLATE, 6)
    footer(c, n, total)


def draw_unit(c, n, total):
    bg(c)
    heading(c, "Cómo se gana un coche", "Cuatro restas. En este orden. Siempre las mismas.", size=19)
    cards = [
        ("1  COSTE", eur(AVG["cost"]), "Coche, transporte, matriculación y puesta a punto. Ya está dentro. No se resta otra vez."),
        ("2  VENTA", eur(AVG["sell"]), "El precio al que sale en khcimport.autos. La media de los siete."),
        ("3  IVA", eur(AVG["rebu"]), "Solo sobre la ganancia, no sobre la venta. En un usado se llama REBU: 21/121 de lo que se gana."),
        ("4  QUEDAN", eur(AVG["net"]), "Venta menos coste menos ese IVA. Es el margen de cada coche, antes de los gastos del mes."),
    ]
    x = 36
    for lab, val, body in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 262, 210, 158, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 418, 210, 2.2, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(x + 14, 396, lab)
        c.setFillColor(GREEN if lab.endswith("QUEDAN") else INK)
        c.setFont("DejaVuSerif", 19)
        c.drawString(x + 14, 362, val)
        wrap(c, body, "DejaVu", 9.5, x + 14, 336, 182, 13, SLATE, 5)
        x += 226
    gti = p.BY["GTI"]
    c.setFillColor(COVER)
    c.roundRect(36, 164, 888, 76, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 9)
    c.drawString(52, 218, "EJEMPLO: UN GOLF GTI")
    c.setFillColor(WHITE)
    c.setFont("DejaVu", 11)
    c.drawString(52, 194, eur(gti["sell"]) + "  −  " + eur(gti["cost"]) + "  −  " + eur(gti["rebu"]) + " de IVA  =  " + eur(gti["net"]) + " que quedan")
    c.setFillColor(MUTED)
    c.setFont("DejaVu", 9)
    c.drawString(52, 176, "Con dos ventas de GTI (" + eur(r2(2 * gti["net"])) + ") se pagan " + f"{GTI_MONTHS:.1f}".replace(".", ",") + " meses de nave, autónomo, portales, luz e internet (" + eur(FIXED) + " al mes).")
    wrap(c, "Las cifras de las cuatro tarjetas son la media de los siete coches con coste cerrado. La lámina siguiente los pone uno a uno. El IVA del REBU se paga en el trimestre de la venta; el impuesto de sociedades, sobre el beneficio del año, va aparte.", "DejaVu", 10, 36, 140, 888, 13, SLATE, 3)
    footer(c, n, total)


def draw_seven(c, n, total):
    bg(c)
    heading(c, "Los siete coches del plan", "Coste cerrado, precio de la web y lo que queda.", size=19)
    cols = [(52, "COCHE", "l"), (420, "COSTE", "r"), (540, "VENTA", "r"), (680, "IVA GANANCIA", "r"), (790, "QUEDAN", "r"), (908, "EN EL PLAN", "r")]
    table_head(c, 424, cols)
    role = {"GTI": "Día 1, ×2", "116d": "Día 1 y crece", "Mercedes": "Entra el mes " + str(MERC_N)}
    for i, u in enumerate(LOT7):
        y = 398 - i * 30
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 9, 888, 28, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold" if u["nick"] in role else "DejaVu", 10)
        c.drawString(52, y, short_car(u["name"]))
        c.setFont("DejaVu", 10)
        c.drawRightString(420, y, eur(u["cost"], False))
        c.drawRightString(540, y, eur(u["sell"], False))
        c.drawRightString(680, y, eur(u["rebu"]))
        c.setFillColor(GREEN)
        c.setFont("DejaVuBold", 10)
        c.drawRightString(790, y, eur(u["net"]))
        c.setFillColor(GOLD_DEEP if u["nick"] in role else SLATE)
        c.setFont("DejaVu", 8.5)
        c.drawRightString(908, y, role.get(u["nick"], "En catálogo"))
    y = 398 - 7 * 30 - 6
    c.setFillColor(COVER)
    c.rect(36, y - 9, 888, 28, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 10)
    c.drawString(52, y, "Media de los siete")
    c.drawRightString(420, y, eur(AVG["cost"]))
    c.drawRightString(540, y, eur(AVG["sell"]))
    c.drawRightString(680, y, eur(AVG["rebu"]))
    c.drawRightString(790, y, eur(AVG["net"]))
    wrap(
        c,
        "Precios de khcimport.autos el 11 de octubre de 2026. El coste no se toca. El plan compra siempre el que cabe: dos GTI el día 1, el Mercedes cuando entra sin tocar el fondo y, después, el más barato, el 116d. Los otros cuatro tienen coste cerrado y quedan en catálogo.",
        "DejaVu", 9.5, 36, y - 26, 888, 12.5, SLATE, 3,
    )
    footer(c, n, total)


def draw_erp(c, n, total):
    bg(c)
    heading(c, "El programa", "Se llama ERP. Lo hemos programado nosotros. No es un programa comprado.", size=17)
    steps = [
        ("1", "Simulador", "Se mete el coche, a quién se compra y a qué precio se vendería. Devuelve el coste, el impuesto y lo que queda. Si no sale, no se compra."),
        ("2", "Catálogo", "1.104 versiones de 37 marcas. Cada motor está marcado: fiable, correcto, con precaución o prohibido. El prohibido no se da de alta."),
        ("3", "Ficha", "Si se compra, entra en la flota. De «lo estamos mirando» a «entregado». Gastos, papeles y fotos, en el móvil y en el ordenador."),
        ("4", "Viaje e impuesto", "Antes del billete, compara traerlo rodando o en camión, con peajes y consumo. Si la factura trae IVA descontable, no deja aplicar el REBU."),
        ("5", "Web y factura", "khcimport.autos publica ese coche. Reservado o vendido se ve el mismo día. El cliente no ve el coste. La factura sale del mismo programa."),
    ]
    y = 418
    for num, title, body in steps:
        c.setFillColor(CARD)
        c.roundRect(36, y - 48, 888, 62, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 48, 3, 62, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuSerif", 20)
        c.drawString(54, y - 24, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(90, y - 6, title)
        wrap(c, body, "DejaVu", 9.5, 250, y - 6, 660, 12.5, SLATE, 3)
        y -= 72
    footer(c, n, total)


def draw_engine(c, n, total):
    bg(c)
    heading(c, "Qué coche entra", "Primero el motor. Después el precio.", size=19)
    yes = [
        "Etiqueta C o ECO, libro de mantenimiento y sin golpe estructural.",
        "Diésel 2.0 de correa seca. Es el que un mecánico recomienda.",
        "Un BMW diésel solo si el motor es el posterior a la cadena que rompía.",
        "El Mercedes de la tabla: se mira el código del motor antes de transferir.",
        "Revisión con diagnosis Launch, medidor de pintura e informe carVertical.",
        "Doce meses de garantía, en todas las ventas, sin excepción.",
    ]
    no = [
        "PureTech y EcoBoost de correa bañada en aceite. Rompen.",
        "El 1.2 de gasolina que bebe aceite. El diésel de Jaguar y Land Rover.",
        "El BMW de cadena antigua, hasta mediados de 2015.",
        "Diésel de antes de septiembre de 2015. No entra en zonas de bajas emisiones.",
        "Kilómetros que no cuadran entre centralitas o con el historial.",
        "El 116d de 2015 de la tabla no se paga hasta ver qué motor lleva.",
    ]
    for x, title, items, col in ((36, "SE COMPRA", yes, GREEN), (488, "NO SE COMPRA", no, RED)):
        c.setFillColor(col)
        c.rect(x, 424, 436, 22, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DejaVuBold", 9)
        c.drawString(x + 14, 431, title)
        y = 396
        for i, it in enumerate(items):
            c.setFillColor(CARD if i % 2 == 0 else SOFT)
            c.rect(x, y - 16, 436, 42, fill=1, stroke=0)
            c.setFillColor(col)
            c.circle(x + 16, y + 3, 3, fill=1, stroke=0)
            wrap(c, it, "DejaVu", 9.5, x + 28, y, 396, 12.5, INK, 2)
            y -= 46
    footer(c, n, total)


def draw_salary(c, n, total):
    bg(c)
    heading(c, "El sueldo de la familia", "Cinco personas. Sube cada año. La empresa no se para.", size=19)
    cards = [
        ("MESES 1–5", "0 €", "Lo cubre el colchón de 25.000 €, fuera de la empresa."),
        ("MESES 6–12", eur(g.POCKET_Y1), "En el bolsillo. Bruto " + eur(g.LIVE) + ". Retiene el 19 %."),
        ("MESES 13–24", eur(g.POCKET_Y2), "En el bolsillo. Bruto " + eur(g.GROSS_Y2) + ". Retiene el 35 %."),
        ("MESES 25–36", eur(g.POCKET_Y3), "En el bolsillo. Bruto " + eur(g.GROSS_Y3) + ". Retiene el 35 %."),
    ]
    x = 36
    for lab, val, body in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 280, 210, 140, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 418, 210, 2.2, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8.5)
        c.drawString(x + 14, 398, lab)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 20)
        c.drawString(x + 14, 366, val)
        wrap(c, body, "DejaVu", 9.5, x + 14, 340, 182, 13, SLATE, 4)
        x += 226
    cut = SAL_CUTS[0] if SAL_CUTS else None
    rows = [
        ("En 36 meses", "Bolsillo de la familia: " + eur(OWN["pocket"]) + ". Bruto pagado por la empresa: " + eur(OWN["sal"]) + "."),
        ("Cuándo sube", "Mes 13 y mes 25, si el año anterior se cobró entero y el stock no bajó. El bruto sube porque la retención pasa al 35 %: el año 1 factura " + eur(Y[1]["cobro"], False) + "."),
        ("La excepción", ("Mes " + str(cut["n"]) + ": se paga el impuesto del año 1 y el bruto baja a " + eur(cut["sal"]) + ", " + eur(cut["pocket"]) + " en el bolsillo. Un solo mes.") if cut else "Ningún mes se recorta. El mes " + str(TAX_M1) + " se paga el impuesto del año 1, " + eur(OWN["y1_tax"]) + ", y el sueldo se paga entero."),
        ("La familia", "Mujer y tres hijas, de 1, 6 y 16 años. El mínimo familiar de Hacienda baja la declaración del IRPF; no baja la retención del 35 %. El autónomo, " + eur(g.RETA) + ", se paga desde el mes 1 y no es sueldo."),
    ]
    y = 248
    for title, body in rows:
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 9.5)
        c.drawString(36, y, title)
        wrap(c, body, "DejaVu", 9.5, 150, y, 774, 12.5, SLATE, 2)
        y -= 40
    footer(c, n, total)


def draw_rule(c, n, total):
    bg(c)
    heading(c, "La regla, todos los meses", "No es un deseo. Es la cuenta.", size=20)
    rows = [
        ("El fondo", "Tres meses de gastos fijos: " + eur(FUND) + ". Nunca se compra un coche ni se paga un sueldo que lo rompa."),
        ("Ventas", "Una de cada tres unidades en el suelo, y nunca menos de dos. Con menos de nueve coches, dos al mes. Con nueve, tres. Con quince, cinco."),
        ("Reposición", "Cada venta se repone en la semana, al mismo coste. Se pide a los dos días; en una semana está en España, con matrícula temporal, publicado."),
        ("El siguiente coche", "Primero el Mercedes, cuando cabe sin bajar del fondo. Después, el más barato que quepa por encima del fondo y de la reserva del impuesto: el 116d, a " + eur(p.BY["116d"]["cost"], False) + "."),
        ("El sueldo", "Desde el mes " + str(SAL_START) + ". Se paga encima del fondo. Si un mes no cabe entero, se paga lo que cabe y no se toca el fondo."),
        ("El impuesto", "15 % los dos primeros años con beneficio. El año 1 se paga en el mes " + str(TAX_M1) + " y el año 2 en el mes " + str(TAX_M2) + ". El año 3 queda reservado al cierre."),
        ("El beneficio", "No se reparte. Se queda dentro, compra coches y baja el impuesto del año siguiente por la reserva de capitalización."),
    ]
    y = 420
    for title, body in rows:
        c.setFillColor(CARD)
        c.rect(36, y - 18, 888, 44, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 18, 3, 44, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10)
        c.drawString(52, y + 4, title)
        wrap(c, body, "DejaVu", 9.3, 190, y + 4, 724, 12, SLATE, 2)
        y -= 50
    footer(c, n, total)


def draw_month_detail(c, n, total, m, title):
    bg(c)
    heading(c, "Mes " + str(m["n"]), title, size=19)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 9)
    c.drawString(36, 446, "Caja al abrir  " + eur(m["start"]) + "     ·     En el suelo al cerrar: " + g.join_names([NICK_NAME[x] for x in sorted(m["floor_cars"])]))
    moves = m["moves"]
    rows = []
    for lab, amount in moves:
        lab = lab.replace("Volkswagen Golf GTI Performance 2015", "Golf GTI").replace("BMW 116d Manual 2015", "BMW 116d")
        lab = lab.replace("Mercedes-Benz Clase C Estate 2019", "Mercedes Clase C").replace(", hecha por él", "")
        lab = lab.replace("Reposición, mismo coste, GTI", "Reposición del Golf GTI").replace("Reposición, mismo coste, 116d", "Reposición del BMW 116d")
        lab = lab.replace("IVA de esa ganancia, GTI", "IVA de esa ganancia (REBU)").replace("IVA de esa ganancia, 116d", "IVA de esa ganancia (REBU)")
        rows.append((lab, amount))
    h = min(22, 330 / max(1, len(rows)))
    y = 420
    for i, (lab, amount) in enumerate(rows):
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 6, 888, h - 2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 9.5)
        c.drawString(52, y, lab)
        c.setFillColor(GREEN if amount > 0 else INK)
        c.setFont("DejaVuBold", 9.5)
        c.drawRightString(908, y, ("+" if amount > 0 else "") + eur(amount))
        y -= h
    y -= 6
    c.setFillColor(COVER)
    c.roundRect(36, y - 8, 888, 30, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 10.5)
    c.drawString(52, y + 2, "Caja al cerrar el mes")
    c.drawRightString(908, y + 2, eur(m["end"]))
    c.setFillColor(MUTED)
    c.setFont("DejaVu", 8.5)
    c.drawString(250, y + 3, "Fondo " + eur(m["floor"]) + "   ·   por encima " + eur(r2(m["end"] - m["floor"])) + "   ·   " + str(m["stock"]) + " coches")
    footer(c, n, total)


def draw_year1_bars(c, n, total):
    bg(c)
    heading(c, "El primer año", "Verde, lo que dejan las ventas. Dorado, lo que cuesta el mes.", size=19)
    ms = Y[1]["months"]
    left, right, bottom, top = 80, 910, 110, 420
    vmax = 12000.0
    c.setStrokeColor(LINE)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7.5)
    for t in (0, 3000, 6000, 9000, 12000):
        yy = bottom + (top - bottom) * t / vmax
        c.line(left, yy, right, yy)
        c.drawRightString(left - 6, yy - 3, g.k(t))
    slot = (right - left) / 12
    for i, m in enumerate(ms):
        cost = r2(FIXED + m["sal"] + m.get("later", 0.0) + (g.KIT + REFORM_NOW if m["n"] == 1 else 0))
        cost_plot = min(cost, vmax)
        x = left + slot * i + slot * 0.18
        bw = slot * 0.3
        c.setFillColor(GOLD)
        c.rect(x, bottom, bw, (top - bottom) * cost_plot / vmax, fill=1, stroke=0)
        mg = m.get("margen", 0.0)
        c.setFillColor(GREEN)
        c.rect(x + bw + 2, bottom, bw, (top - bottom) * mg / vmax, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 6.5)
        if mg:
            c.drawCentredString(x + bw * 1.5 + 2, bottom + (top - bottom) * mg / vmax + 4, g.k(mg))
        c.setFillColor(GOLD_DEEP)
        c.drawCentredString(x + bw / 2, bottom + (top - bottom) * cost_plot / vmax + 4, g.k(cost))
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8)
        c.drawCentredString(left + slot * (i + 0.5), bottom - 14, str(m["n"]))
    wrap(
        c,
        "El mes 1 lleva el kit y la reforma del día 1 (" + eur(r2(FIXED + g.KIT + REFORM_NOW)) + ") y no se vende; la fianza, " + eur(DEPOSIT) + ", no es gasto y no está en la barra. El mes " + str(LATER_N) + " suma el resto de la reforma, " + eur(LATER) + ". Desde el mes " + str(SAL_START) + " el coste del mes incluye el sueldo bruto. Margen del año: " + eur(Y[1]["margen"]) + ". Gastos fijos, kit y sueldo: " + eur(r2(Y[1]["fixed"] + Y[1]["kit"] + Y[1]["sal"])) + ".",
        "DejaVu", 9.5, 36, 76, 888, 12.5, SLATE, 2,
    )
    footer(c, n, total)


def draw_year_table(c, n, total, y_no, title):
    bg(c)
    heading(c, "Año " + str(y_no) + ", mes a mes", title, size=18)
    cols = [
        (44, "MES", "l"), (80, "QUÉ OCURRE", "l"), (430, "COBRO", "r"), (505, "IVA", "r"),
        (590, "COMPRA", "r"), (665, "GASTOS", "r"), (740, "SUELDO", "r"), (812, "MARGEN", "r"),
        (870, "CAJA", "r"), (912, "UDS", "r"),
    ]
    table_head(c, 432, cols)
    ms = Y[y_no]["months"]
    for i, m in enumerate(ms):
        y = 410 - i * 25
        cut = m["sal"] + 0.02 < m["want"]
        c.setFillColor(Color(0.98, 0.93, 0.92) if cut else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 8, 888, 24, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(44, y, str(m["n"]))
        c.setFillColor(INK)
        c.setFont("DejaVu", 7.6)
        txt = what_happened(m)
        while c.stringWidth(txt, "DejaVu", 7.6) > 340:
            txt = txt[:-2]
        c.drawString(80, y, txt)
        vals = [
            m["cobro"], -m["rebu"], -m["compra"],
            -(FIXED + m.get("later", 0.0) + (g.KIT + REFORM_NOW if m["n"] == 1 else 0)), -m["sal"],
        ]
        for x, v in zip((430, 505, 590, 665, 740), vals):
            c.setFillColor(INK if v else SLATE)
            c.drawRightString(x, y, g.k(v) if v else "—")
        c.setFillColor(GREEN)
        c.setFont("DejaVuBold", 7.6)
        c.drawRightString(812, y, g.k(m.get("margen", 0.0)) if m.get("margen") else "—")
        c.setFillColor(INK)
        c.drawRightString(870, y, g.k(m["end"]))
        c.setFont("DejaVu", 7.6)
        c.drawRightString(912, y, str(m["stock"]))
    yy = 410 - 12 * 25 - 4
    s = Y[y_no]
    c.setFillColor(COVER)
    c.rect(36, yy - 8, 888, 24, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 7.8)
    c.drawString(44, yy, "Año " + str(y_no) + ": " + str(s["sales"]) + " ventas")
    for x, v in zip((430, 505, 590, 665, 740), (s["cobro"], -s["rebu"], -s["compra"], -(s["fixed"] + s["kit"] + s["reform"]), -s["sal"])):
        c.drawRightString(x, yy, g.k(v))
    c.drawRightString(812, yy, g.k(s["margen"]))
    c.drawRightString(870, yy, g.k(s["end"]))
    c.drawRightString(912, yy, str(s["stock"]))
    note = "Euros sin céntimos. Cobro: precio de venta. IVA: REBU, solo sobre la ganancia. Compra: reposición y coches nuevos. Gastos: nave, autónomo, portales, luz e internet"
    note += " (el mes 1, también kit y reforma del día 1; el mes " + str(LATER_N) + ", el resto de la reforma). La fianza, " + eur(DEPOSIT) + ", no es gasto: solo baja la caja del mes 1." if y_no == 1 else "."
    if s["tax_paid"]:
        note += " Impuesto pagado este año: " + eur(s["tax_paid"]) + " (no sale en la tabla, sí en la caja)."
    wrap(c, note, "DejaVu", 8, 36, yy - 22, 888, 10.5, SLATE, 3)
    footer(c, n, total)


def draw_year1_account(c, n, total):
    bg(c)
    heading(c, "El primer año, en una cuenta", "Lo que entra, lo que sale y lo que queda. Sin préstamo.", size=18)
    s = Y[1]
    rows = [
        ("Capital propio", 50000.0),
        ("Fianza de la nave, dos meses (se recupera)", -DEPOSIT),
        (str(s["sales"]) + " cobros, del mes 2 al mes 12", s["cobro"]),
        ("Coches comprados: apertura, reposición y crecimiento", -s["compra"]),
        ("IVA de las ganancias (REBU)", -s["rebu"]),
        ("Doce meses de gastos fijos", -s["fixed"]),
        ("Equipo de revisión y reforma (día 1 y mes " + str(LATER_N) + ")", -r2(s["kit"] + s["reform"])),
        ("Sueldo bruto, meses " + str(SAL_START) + " a 12", -s["sal"]),
    ]
    y = 420
    for i, (lab, val) in enumerate(rows):
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 8, 540, 28, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 10)
        c.drawString(50, y + 1, lab)
        c.setFont("DejaVuBold", 10)
        c.setFillColor(GREEN if val > 0 else INK)
        c.drawRightString(564, y + 1, ("+" if val > 0 else "") + eur(val))
        y -= 27
    y -= 6
    c.setFillColor(COVER)
    c.roundRect(36, y - 10, 540, 32, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 11)
    c.drawString(50, y + 1, "Caja al cerrar diciembre")
    c.drawRightString(564, y + 1, eur(s["end"]))
    box = [
        ("Margen de las ventas", s["margen"]),
        ("− Gastos fijos", -s["fixed"]),
        ("− Equipo de revisión", -s["kit"]),
        ("− Sueldo", -s["sal"]),
        ("= Resultado antes del impuesto", s["ebitda"]),
        ("− Impuesto, 15 %, se paga el mes " + str(TAX_M1), -s["tax"]),
        ("= Beneficio del año 1", s["result"]),
    ]
    c.setFillColor(CARD)
    c.setStrokeColor(LINE)
    c.roundRect(596, 196, 328, 252, 3, fill=1, stroke=1)
    kicker(c, "La cuenta de resultados", 428, 612)
    yy = 402
    for lab, val in box:
        strong = lab.startswith("=")
        c.setFillColor(INK)
        c.setFont("DejaVuBold" if strong else "DejaVu", 9.5)
        c.drawString(612, yy, lab)
        c.setFillColor(GREEN if strong else INK)
        c.drawRightString(910, yy, eur(val))
        yy -= 28
    wrap(
        c,
        "La reforma, " + eur(g.REFORM) + ", sale de caja y no se ha metido en la base del impuesto. Si la gestoría la admite como gasto o amortización, el impuesto bajaría hasta " + eur(REFORM_TAX) + ". La fianza tampoco es gasto: se recupera. En la caja de diciembre sigue dentro el impuesto del año 1, que se paga en el mes " + str(TAX_M1) + ". Coches en el suelo: " + str(s["stock"]) + ", a coste " + eur(s["stock_cost"]) + ".",
        "DejaVu", 9.5, 36, 152, 888, 12.5, SLATE, 4,
    )
    footer(c, n, total)


def draw_tax(c, n, total):
    bg(c)
    heading(c, "El impuesto", "Qué lo baja de verdad. Qué solo mueve el dinero.", size=19)
    yes = [
        ("No repartir el beneficio", "Reserva de capitalización: el año 2 baja la base " + eur(REDUC2) + ". Ahorra " + eur(SAVE2) + ". Hay que mantenerlo 3 años."),
        ("Un gasto real, con factura", "El sueldo lo es. El kit de revisión lo es. Lo que no tiene precio cerrado no se inventa."),
        ("El 15 % dura dos años", "Sociedad nueva, primeros dos años con beneficio. El tercero, micropyme: 17 % hasta 50.000 € y 20 % el resto."),
        ("La reforma, aparte", eur(g.REFORM) + " no están en la base. Si la gestoría la admite, bajaría hasta " + eur(REFORM_TAX) + ". No cambia las compras."),
    ]
    no = [
        ("Comprar coches", "El stock es un activo, no un gasto. La caja baja. El impuesto, no."),
        ("La fianza de la nave", eur(DEPOSIT) + " que se recuperan al irse. No es gasto. Sale de caja el día 1 y no baja nada."),
        ("Gastar lo apartado", "El impuesto se calcula sobre el beneficio, no sobre la caja. Gastarlo no lo reduce y puede faltar al pagarlo, el mes " + str(TAX_M1) + "."),
        ("Aplazar o repartir", "La reserva de nivelación aplaza y se revierte. Un dividendo no baja el impuesto: ya tributó."),
    ]
    for x, title, items, col in ((36, "ESTO SÍ BAJA EL IMPUESTO", yes, GREEN), (488, "ESTO NO LO BAJA", no, RED)):
        c.setFillColor(col)
        c.rect(x, 428, 436, 20, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DejaVuBold", 8.5)
        c.drawString(x + 12, 434, title)
        y = 404
        for t, b in items:
            c.setFillColor(CARD)
            c.rect(x, y - 52, 436, 70, fill=1, stroke=0)
            c.setFillColor(col)
            c.rect(x, y - 52, 3, 70, fill=1, stroke=0)
            c.setFillColor(INK)
            c.setFont("DejaVuBold", 10)
            c.drawString(x + 14, y + 2, t)
            wrap(c, b, "DejaVu", 9, x + 14, y - 14, 410, 11.5, SLATE, 3)
            y -= 78
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 9)
    c.drawString(36, 70, "Impuesto: año 1, " + eur(Y[1]["tax"]) + " (mes " + str(TAX_M1) + ")  ·  año 2, " + eur(Y[2]["tax"]) + " (mes " + str(TAX_M2) + ")  ·  año 3, " + eur(Y[3]["tax"]) + " reservado al cierre.")
    footer(c, n, total)


def draw_cash36(c, n, total):
    bg(c)
    heading(c, "Treinta y seis meses de caja", "Sube con las ventas. Baja cuando entra otro coche. Nunca bajo el fondo.", size=17)
    cash = [m["end"] for m in LEDGER]
    stock = [m["stock"] for m in LEDGER]
    left, right = 70, 910
    bottom, top = 214, 420
    vmax = max(cash) * 1.1
    c.setStrokeColor(LINE)
    c.setFont("DejaVu", 7)
    c.setFillColor(SLATE)
    for t in (0, 10000, 20000, 30000):
        if t > vmax:
            continue
        yy = bottom + (top - bottom) * t / vmax
        c.line(left, yy, right, yy)
        c.drawRightString(left - 6, yy - 3, g.k(t))

    def x_of(i):
        return left + (right - left) * (i + 0.5) / 36

    fy = bottom + (top - bottom) * FUND / vmax
    c.setStrokeColor(RED)
    c.setDash(3, 3)
    c.line(left, fy, right, fy)
    c.setDash()
    c.setFillColor(RED)
    c.drawRightString(right - 4, fy - 10, "Fondo " + eur(FUND))
    path = c.beginPath()
    for i, v in enumerate(cash):
        yy = bottom + (top - bottom) * v / vmax
        path.moveTo(x_of(i), yy) if i == 0 else path.lineTo(x_of(i), yy)
    c.setStrokeColor(GOLD_DEEP)
    c.setLineWidth(1.6)
    c.drawPath(path, stroke=1, fill=0)
    c.setLineWidth(1)
    for i, v in enumerate(cash):
        yy = bottom + (top - bottom) * v / vmax
        c.setFillColor(RED if LEDGER[i]["tax_paid"] else GOLD_DEEP)
        c.circle(x_of(i), yy, 2.4 if LEDGER[i]["tax_paid"] else 1.6, fill=1, stroke=0)
    for i in (0, LOW["n"] - 1, 35):
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 7)
        c.drawCentredString(x_of(i), bottom + (top - bottom) * cash[i] / vmax + 6, eur(cash[i], False))
    sb, st = 80, 180
    smax = max(stock) + 2
    bw = (right - left) / 36 * 0.6
    for i, v in enumerate(stock):
        c.setFillColor(Color(0.78, 0.74, 0.64))
        c.rect(x_of(i) - bw / 2, sb, bw, (st - sb) * v / smax, fill=1, stroke=0)
        if i in (0, 11, 23, 35):
            c.setFillColor(INK)
            c.setFont("DejaVuBold", 7)
            c.drawCentredString(x_of(i), sb + (st - sb) * v / smax + 3, str(v))
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 6.5)
        if (i + 1) % 3 == 0 or i == 0:
            c.drawCentredString(x_of(i), sb - 10, str(i + 1))
    c.setFillColor(INK)
    c.setFont("DejaVu", 8)
    c.drawString(left, 426, "Caja al cerrar cada mes")
    c.drawString(left, 186, "Coches en el suelo al cerrar cada mes")
    c.setFillColor(SLATE)
    c.drawString(left, 52, "Punto rojo: mes en que se paga el impuesto (" + str(TAX_M1) + " y " + str(TAX_M2) + "). Mínimo: mes " + str(LOW["n"]) + ", " + eur(LOW["end"]) + ".")
    footer(c, n, total)


def draw_three_years(c, n, total):
    bg(c)
    heading(c, "Los tres años", "La misma empresa. El tercero ya no es el de arrancar.", size=19)
    cols = [(52, "", "l"), (560, "AÑO 1", "r"), (740, "AÑO 2", "r"), (908, "AÑO 3", "r")]
    table_head(c, 432, cols)
    rows = [
        ("Ventas", [str(Y[y]["sales"]) for y in (1, 2, 3)], False),
        ("Cobros", [eur(Y[y]["cobro"], False) for y in (1, 2, 3)], False),
        ("Margen de las ventas", [eur(Y[y]["margen"]) for y in (1, 2, 3)], False),
        ("Gastos fijos (y kit el año 1)", [eur(r2(Y[y]["fixed"] + Y[y]["kit"])) for y in (1, 2, 3)], False),
        ("Sueldo bruto", [eur(Y[y]["sal"]) for y in (1, 2, 3)], False),
        ("Resultado antes del impuesto", [eur(Y[y]["ebitda"]) for y in (1, 2, 3)], False),
        ("Impuesto de sociedades", [eur(Y[y]["tax"]) for y in (1, 2, 3)], False),
        ("Beneficio, sueldo ya restado", [eur(Y[y]["result"]) for y in (1, 2, 3)], True),
        ("Bolsillo de la familia", [eur(Y[y]["pocket"]) for y in (1, 2, 3)], False),
        ("Caja al cerrar", [eur(Y[y]["end"]) for y in (1, 2, 3)], False),
        ("Coches en el suelo / a coste", [str(Y[y]["stock"]) + "  ·  " + eur(Y[y]["stock_cost"], False) for y in (1, 2, 3)], False),
        ("Deuda", ["0 €", "0 €", "0 €"], False),
    ]
    for i, (lab, vals, strong) in enumerate(rows):
        y = 408 - i * 27
        c.setFillColor(COVER if strong else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 8, 888, 25, fill=1, stroke=0)
        c.setFillColor(GOLD if strong else INK)
        c.setFont("DejaVuBold" if strong else "DejaVu", 9.5)
        c.drawString(52, y, lab)
        for x, v in zip((560, 740, 908), vals):
            c.drawRightString(x, y, v)
    wrap(
        c,
        "Año 1 y 2 al 15 %; el año 2 con la reserva de capitalización. Año 3, micropyme, 17 % y 20 %. El impuesto del año 3 está reservado dentro de la caja del mes 36. Lo que es suyo al cierre: caja " + eur(OWN["cash"]) + " + coches " + eur(OWN["stock_cost"]) + " + fianza " + eur(DEPOSIT) + " − impuesto " + eur(OWN["tax3"]) + " = " + eur(OWN["equity"]) + ".",
        "DejaVu", 9, 36, 70, 888, 12, SLATE, 3,
    )
    footer(c, n, total)


def cuts_txt(k):
    if not k:
        return "El sueldo no se recorta: el fondo aguanta, pero se compran menos coches."
    return "El sueldo se recorta " + str(k) + (" mes." if k == 1 else " meses.")


def draw_risk_full(c, n, total):
    bg(c)
    heading(c, "Si no sale como en la tabla", "Cada desvío tiene un número. Con la nave nueva, el primer año aprieta.", size=17)
    cut = SAL_CUTS[0] if SAL_CUTS else None
    rows = [
        ("El mes 2 no se vende", "La caja baja a " + eur(MISS) + ", " + eur(r2(FUND - MISS)) + " por debajo del fondo. El resto de la reforma, " + eur(LATER) + ", espera a la primera venta. Hay que vender desde el mes 2."),
        ("Dos meses seguidos sin vender", "Baja a " + eur(MISS2) + ", " + eur(r2(FUND - MISS2)) + " bajo el fondo. Se esperaría con el sueldo, la reposición y la reforma pendiente."),
        ("Mes " + (str(cut["n"]) if cut else str(TAX_M1)) + ": el impuesto del año 1", ("Se pagan " + eur(OWN["y1_tax"]) + " y el bruto baja " + eur(r2(cut["want"] - cut["sal"])) + " ese mes.") if cut else "Se pagan " + eur(OWN["y1_tax"]) + " sin recortar el sueldo: el año 2 se compran menos coches y la caja llega con sitio."),
        ("Precios un 3 % más bajos", cuts_txt(PRICE3["cuts"]) + " Al mes 36: " + str(PRICE3["stock"]) + " coches y " + eur(PRICE3["equity"]) + " dentro."),
        ("Precios un 5 % más bajos", cuts_txt(CUT5["cuts"]) + " Al mes 36: " + str(CUT5["stock"]) + " coches y " + eur(CUT5["equity"]) + " dentro. Los precios de la web tienen que cumplirse."),
        ("El impuesto, al 23 % y no al 15 %", "El año 1 pagaría " + eur(TAX23_Y1) + " en vez de " + eur(Y[1]["tax"]) + ": " + eur(r2(TAX23_Y1 - Y[1]["tax"])) + " más en el mes " + str(TAX_M1) + "."),
        ("Si el propietario pide más garantía", ("Un mes más, " + eur(g.RENT) + ", también saldría de la reforma aplazable.") if EXTRA_MONTH_OK else ("Un mes más, " + eur(g.RENT) + ", ya no cabe en la reforma que puede esperar sin tocar suelo, luz o pintura. Habría que abrir con dos GTI (lámina de la fianza).")),
    ]
    y = 424
    for title, body in rows:
        c.setFillColor(CARD)
        c.rect(36, y - 30, 888, 46, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 30, 3, 46, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10)
        c.drawString(52, y, title)
        wrap(c, body, "DejaVu", 9, 52, y - 15, 860, 11, SLATE, 2)
        y -= 52
    footer(c, n, total)


def draw_sources(c, n, total):
    bg(c)
    heading(c, "De dónde sale cada cifra", "Nada de este plan es una venta ya cobrada.", size=19)
    items = [
        "Coste de los coches: cerrado, ya incluye transporte, matriculación y puesta a la venta. No se resta otra vez. Venta: khcimport.autos, 11 de octubre de 2026.",
        "Nave: O Milladoiro, Ames, Ref. C1290, 465 m², 1.200 €/mes (ANALISIS_NAVE_SANTIAGO_MILLADOIRO.md). Fotos y plano del anuncio; las recreaciones están marcadas como tales.",
        "Reforma: " + eur(g.REFORM) + ", IVA incluido, línea a línea en REFORMA_FASE1_COMPLETA.md. Mano de obra propia, 0 €. Internet y teléfono, 50 €/mes, del mismo documento.",
        "Equipo de revisión: " + eur(g.KIT) + ", once productos con enlace (01_PRESUPUESTO_ARRANQUE_Y_ASIGNACION_CAPITAL.md).",
        "Autónomo: " + eur(g.RETA) + ", cuota mínima de 2026. Portales y gestoría, 250 €. Luz, agua y vado, 150 €. No es sueldo.",
        "Sueldo: meses 6-12, " + eur(g.LIVE) + " brutos; 13-24, " + eur(g.GROSS_Y2) + "; 25-36, " + eur(g.GROSS_Y3) + ". Retención 19 % el primer año, 35 % después. El cargo es gratuito si los estatutos no dicen lo contrario (art. 217 LSC).",
        "Impuesto de sociedades: 15 % los dos primeros años con beneficio; después micropyme, 17 % hasta 50.000 € y 20 % el resto. Reserva de capitalización del 20 % del beneficio no repartido.",
        "Fondo: tres meses de gastos fijos, " + eur(FUND) + ". La reserva del impuesto no compra coches, salvo la del año anterior (por eso el mes " + str(TAX_M1) + ").",
        "Fianza: dos mensualidades en un local, " + eur(DEPOSIT) + ", art. 36.1 de la Ley de Arrendamientos Urbanos. Entra el día 1 y se recupera. Lo que faltaba para el fondo (" + eur(A["falta"]) + ") sale de la reforma: " + str(len(LATER_LINES)) + " líneas, " + eur(LATER) + ", que se pagan cuando caben, el mes " + str(LATER_N) + ".",
        "Comparación con San Marcos: el mismo cálculo con 1.100 € de alquiler, sin internet, 4.550 € de reforma y sin fianza, como estaba. Todo sale de probar_sin_financiacion.py.",
    ]
    y = 432
    for it in items:
        c.setFillColor(GOLD)
        c.circle(42, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, it, "DejaVu", 9, 52, y, 870, 11.5, INK, 3)
        y -= h + 7
    footer(c, n, total)



def main():
    slides = [
        draw_cover, draw_index,
        draw_company, draw_unit, draw_seven, draw_erp, draw_engine,
        draw_nave, draw_zonas, draw_reforma, draw_reforma_detalle, draw_cronograma, draw_equipo,
        draw_fixed, draw_salary, draw_rule, draw_day1,
        lambda c, n, t: draw_month_detail(c, n, t, LEDGER[1], "Dos ventas, repuestas en la semana. Y se termina la reforma." if LEDGER[1]["later"] else "Dos ventas. Las dos se reponen en la semana."),
        draw_year1_bars,
        lambda c, n, t: draw_year_table(c, n, t, 1, "Doce meses: qué entra, qué sale y qué queda."),
        draw_year1_account,
        lambda c, n, t: draw_year_table(c, n, t, 2, "Más coches en el suelo. Más ventas. La misma regla."),
        lambda c, n, t: draw_year_table(c, n, t, 3, "Con nueve coches se venden tres. Con quince, cinco."),
        draw_tax, draw_cash36, draw_three_years,
        draw_36, draw_fianza, draw_risk_full, draw_close, draw_sources,
    ]
    c = canvas.Canvas(str(OUT), pagesize=(W, H))
    c.setTitle("KHC — 50.000 € propios, sin préstamo. Nave O Milladoiro")
    c.setAuthor("KHC Auto Import")
    for i, fn in enumerate(slides, 1):
        fn(c, i, len(slides))
        c.showPage()
    c.save()
    print(OUT)
    print("dia1", DAY1, "fondo", FUND, "sobre", r2(DAY1 - FUND), "fijos", FIXED)
    print("own", OWN["equity"], OWN["stock"], OWN["cuts"], OWN["sales_y"], "aplazado", LATER, "mes", LATER_N, "merc", MERC_N, "2gti", TWO_GTI["equity"], TWO_GTI["stock"], "extra", EXTRA_MONTH_OK)
    print("old", OLD["equity"], OLD["stock"], "miss", MISS, MISS2, "cut5", CUT5["cuts"], CUT5["stock"])


if __name__ == "__main__":
    main()

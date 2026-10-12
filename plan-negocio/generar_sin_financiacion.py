#!/usr/bin/env python3
"""Plan de arranque con 50.000 € propios, sin préstamo. Nave O Milladoiro.

Las cifras salen del mismo libro de caja (probar_sin_financiacion.py) y de
los datos cerrados de la nave, la reforma y el equipo
(datos_nave_milladoiro.py). No se inventa ninguna partida.
"""

from __future__ import annotations

import importlib.util
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

OWN = p.simulate(OPENING, 1, p.FAM)
SAFE = p.simulate(OPENING, 1, p.FAM, keep_tax=True)
assert OWN and SAFE and SAFE["cuts"] == 0
DAY1 = OWN["months"][0]["end"]
CARS3 = r2(2 * p.BY["GTI"]["cost"] + p.BY["116d"]["cost"])
assert abs(DAY1 - r2(50000 - g.KIT - g.REFORM - CARS3 - FIXED)) < 0.02
CUT_MONTHS = [m for m in OWN["months"] if m["sal"] + 0.02 < m["want"]]
POCKET_FULL = 7 * 1687.50 + 12 * 2500 + 12 * 3000
assert abs(SAFE["pocket"] - POCKET_FULL) < 0.05

# Fianza: la Ley de Arrendamientos Urbanos (art. 36.1) obliga a dos
# mensualidades en un local. No es gasto: se recupera al dejar la nave.
DEPOSIT = r2(2 * g.RENT)
DEP_DAY1 = r2(DAY1 - DEPOSIT)
assert p.simulate(OPENING, 1, p.FAM, deposit=DEPOSIT) is None  # no cabe con la fianza
TWO_GTI = p.simulate(["GTI", "GTI"], 1, p.FAM, deposit=DEPOSIT)
MIXED = p.simulate(["GTI", "116d", "116d"], 1, p.FAM, deposit=DEPOSIT)
assert TWO_GTI and TWO_GTI["cuts"] == 0 and MIXED

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
        return p.simulate(OPENING, 1, p.FAM)
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
        "Sin préstamo. Nave nueva en Ames, junto a la autopista. Reforma con materiales cerrados, " + eur(g.REFORM) + ", hecha por él. Dos GTI y un 116d el día 1. Kit, reforma y nave también el día 1.",
        "DejaVu", 11.5, 36, 292, 500, 15.5, MUTED, 5,
    )
    stat_cards(c, [
        (eur(DAY1), "Caja al cerrar el día 1"),
        (eur(g.REFORM), "Reforma, solo materiales"),
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
    heading(c, "La reforma, hecha por él", "Siete partidas. " + eur(g.REFORM) + " en materiales. Mano de obra: 0 €.", size=18)
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
        c.setFillColor(GOLD)
        c.roundRect(400, y - 3, 360 * pt["total"] / maxv, 12, 2, fill=1, stroke=0)
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
        "Precios con IVA, producto a producto. Sin contratista: él tiene oficio y herramienta. No hace falta permiso de obra: es pintura, suelo, luz y mobiliario. Sale de caja el día 1 y no entra en la base del impuesto.",
        "DejaVu", 9.5, 36, y - 30, 888, 12.5, SLATE, 2,
    )
    footer(c, n, total)


def draw_reforma_detalle(c, n, total):
    bg(c)
    heading(c, "La lista de la compra", "Cada línea de la reforma, con su precio.", size=19)
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
                c.setFillColor(CARD if i % 2 == 0 else SOFT)
                c.rect(x, y - 5, 284, 16, fill=1, stroke=0)
                c.setFillColor(INK)
                c.setFont("DejaVu", 7.4)
                c.drawString(x + 8, y, lab)
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
    wrap(c, "IVA incluido. Mano de obra propia: 0 €. Fuente: REFORMA_FASE1_COMPLETA.md.", "DejaVu", 8.5, 640, y - 34, 284, 11, SLATE, 3)
    footer(c, n, total)


def draw_cronograma(c, n, total):
    bg(c)
    heading(c, "Catorce días", "La reforma cabe en el mes 1, mientras llegan los coches.", size=19)
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
    wrap(c, "Ya están sumados en los " + eur(g.REFORM) + ". No se cuentan otra vez.", "DejaVu", 8.5, 530, y + 2, 394, 11, SLATE, 2)
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
    heading(c, "El día 1, con 50.000 €", "Kit, reforma, tres coches y el primer mes. Cabe.", size=19)
    rows = [
        ("Capital propio", 50000, False),
        ("Equipo de revisión, antes de comprar", -g.KIT, False),
        ("Reforma de la nave, materiales, hecha por él", -g.REFORM, False),
        ("Dos Golf GTI y un BMW 116d", -CARS3, False),
        ("Nave, autónomo, portales, luz e internet, mes 1", -FIXED, False),
        ("Caja al cerrar el día", DAY1, True),
    ]
    y = 410
    for i, (lab, val, last) in enumerate(rows):
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.roundRect(36, y - 8, 888, 32, 3, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 11)
        c.drawString(52, y + 2, lab)
        c.setFont("DejaVuBold", 11)
        c.drawRightString(908, y + 2, eur(val))
        y -= 40
    y -= 4
    boxes = [
        ("Fondo, tres meses de gastos", eur(FUND), INK),
        ("Queda por encima del fondo", eur(r2(DAY1 - FUND)), GREEN),
        ("Antes, con San Marcos", eur(OLD["months"][0]["end"]), SLATE),
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
    footer(c, n, total)


def draw_fianza(c, n, total):
    bg(c)
    heading(c, "Una partida que no estaba", "La fianza del local: " + eur(DEPOSIT) + " el día de la firma.", size=19)
    wrap(
        c,
        "La Ley de Arrendamientos Urbanos (art. 36) obliga a dos mensualidades de fianza en un local que no es vivienda: 2 × " + eur(g.RENT) + ". No es un gasto y se recupera al dejar la nave, pero sale de caja el día 1. No estaba en el plan anterior ni en los documentos de la nave.",
        "DejaVu", 10.5, 36, 440, 888, 14, INK, 3,
    )
    cards = [
        ("Con dos GTI y un 116d", eur(DEP_DAY1), "Caja del día 1 con la fianza. El fondo es " + eur(FUND) + ": faltan " + eur(r2(FUND - DEP_DAY1)) + ". Así no se puede abrir.", RED),
        ("Con dos GTI", eur(TWO_GTI["months"][0]["end"]), "Sueldo sin recortes. " + str(TWO_GTI["stock"]) + " coches al mes 36 y " + eur(TWO_GTI["equity"]) + " dentro, fianza incluida. El 116d entra después, cuando cabe.", GREEN),
        ("Con un GTI y dos 116d", eur(MIXED["months"][0]["end"]), str(MIXED["cuts"]) + " mes con el sueldo recortado. Solo " + str(MIXED["stock"]) + " coches al mes 36 y " + eur(MIXED["equity"]) + " dentro. Los 116d dejan poco.", SLATE),
    ]
    x = 36
    for title, val, body, col in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 206, 286, 164, 3, fill=1, stroke=1)
        c.setFillColor(col)
        c.rect(x, 367, 286, 3, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(x + 16, 342, title)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8)
        c.drawString(x + 16, 322, "CAJA AL CERRAR EL DÍA 1")
        c.setFillColor(col)
        c.setFont("DejaVuSerif", 20)
        c.drawString(x + 16, 296, val)
        wrap(c, body, "DejaVu", 9.5, x + 16, 268, 254, 13, SLATE, 7)
        x += 301
    wrap(
        c,
        "Hay que cerrar la fianza con el propietario antes de firmar. Si pide dos meses, la apertura que cabe y no recorta el sueldo es la de dos GTI, con la misma regla de venta.",
        "DejaVu", 10.5, 36, 176, 888, 14, INK, 2,
    )
    footer(c, n, total)


def draw_36(c, n, total):
    bg(c)
    heading(c, "Los 36 meses", "Misma regla de venta y de sueldo. Cambian la nave y la reforma.", size=18)
    c.setFillColor(INK)
    c.rect(36, 436, 888, 22, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(640, 443, "ANTES · SAN MARCOS")
    c.drawRightString(900, 443, "AHORA · O MILLADOIRO")
    cut_txt = "Ninguno" if not CUT_MONTHS else ", ".join("mes " + str(m["n"]) for m in CUT_MONTHS)
    rows = [
        ("Reforma", eur(4550), eur(g.REFORM), False),
        ("Gastos fijos al mes", eur(OLD_FIXED), eur(FIXED), False),
        ("Caja al cerrar el día 1", eur(OLD["months"][0]["end"]), eur(DAY1), False),
        ("Ventas, año 1 / 2 / 3", " / ".join(str(x) for x in OLD["sales_y"]), " / ".join(str(x) for x in OWN["sales_y"]), False),
        ("Coches al mes 36", str(OLD["stock"]), str(OWN["stock"]), False),
        ("Bolsillo de la familia, 36 meses", eur(OLD["pocket"]), eur(OWN["pocket"]), False),
        ("Mes con el sueldo recortado", "Ninguno", cut_txt, False),
        ("Beneficio del año 3", eur(OLD["result3"]), eur(OWN["result3"]), False),
        ("Caja al cerrar el mes 36", eur(OLD["cash"]), eur(OWN["cash"]), False),
        ("Deuda", "0 €", "0 €", False),
        ("Lo que es suyo dentro", eur(OLD["equity"]), eur(OWN["equity"]), True),
    ]
    for i, (lab, a, b, last) in enumerate(rows):
        y = 410 - i * 31
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 9, 888, 29, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 10)
        c.drawString(52, y, lab)
        c.setFont("DejaVu", 10)
        c.setFillColor(GOLD if last else SLATE)
        c.drawRightString(640, y, a)
        c.setFont("DejaVuBold", 10)
        c.setFillColor(GOLD if last else (RED if lab.startswith("Mes con") and CUT_MONTHS else INK))
        c.drawRightString(900, y, b)
    footer(c, n, total)


def draw_risk(c, n, total):
    bg(c)
    heading(c, "Lo que hay que vigilar", "La nave nueva aprieta el primer año. Esto es lo que cambia.", size=18)
    cut = CUT_MONTHS[0] if CUT_MONTHS else None
    rows = []
    if cut:
        rows.append((
            "Mes " + str(cut["n"]) + ": se paga el impuesto del año 1, " + eur(OWN["y1_tax"]),
            "Con la regla de siempre, ese mes el sueldo bruto baja de " + eur(cut["want"]) + " a " + eur(cut["sal"]) + " (−" + eur(r2(cut["want"] - cut["sal"])) + "). Si el impuesto se aparta desde el mes 13, el sueldo no se toca nunca, pero a los 36 meses hay " + str(SAFE["stock"]) + " coches y " + eur(SAFE["equity"]) + " dentro.",
        ))
    rows += [
        (
            "Un mes sin vender, al empezar",
            "No aguanta: la caja baja a " + eur(MISS) + ", " + eur(r2(FUND - MISS)) + " por debajo del fondo. Con San Marcos quedaba justo por encima. Hay que vender en el mes 2.",
        ),
        (
            "Dos meses seguidos sin vender",
            "Baja a " + eur(MISS2) + ", " + eur(r2(FUND - MISS2)) + " por debajo del fondo. Habría que esperar con el sueldo y con la reposición.",
        ),
        (
            "Precios un 5 % más bajos",
            "El sueldo se recorta " + str(CUT5["cuts"]) + " meses y el suelo se queda en " + str(CUT5["stock"]) + " coches. Hace falta que los precios de la web se cumplan.",
        ),
    ]
    y = 410
    for title, body in rows:
        c.setFillColor(CARD)
        c.roundRect(36, y - 62, 888, 78, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 62, 3, 78, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11.5)
        c.drawString(54, y - 2, title)
        wrap(c, body, "DejaVu", 9.5, 54, y - 22, 850, 12.5, SLATE, 3)
        y -= 88
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
        "Kit de " + eur(g.KIT) + ", reforma de " + eur(g.REFORM) + " y la nave, el día 1. Con dos GTI y un 116d quedan " + eur(r2(DAY1 - FUND)) + " sobre el fondo y hay que vender desde el mes 2. Falta cerrar la fianza: si son dos meses, " + eur(DEPOSIT) + ", se abre con dos GTI. Sin deuda en ningún caso.",
        "DejaVu", 12, 36, 296, 880, 16, MUTED, 5,
    )
    stat_cards(c, [
        (eur(OWN["equity"]), "Suyo, sin deuda, al mes 36"),
        (eur(OWN["pocket"]), "Bolsillo de la familia, 36 meses"),
        ("465 m²", "Sin cambiar de nave en 3-5 años"),
    ])
    footer(c, n, total, True)


def main():
    slides = [
        draw_cover, draw_nave, draw_zonas, draw_reforma, draw_reforma_detalle,
        draw_cronograma, draw_equipo, draw_fixed, draw_day1, draw_fianza, draw_36, draw_risk, draw_close,
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
    print("own", OWN["equity"], OWN["stock"], OWN["cuts"], "safe", SAFE["equity"], SAFE["stock"])
    print("old", OLD["equity"], OLD["stock"], "miss", MISS, MISS2, "cut5", CUT5["cuts"], CUT5["stock"])


if __name__ == "__main__":
    main()

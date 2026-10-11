#!/usr/bin/env python3
"""Presentación para conseguir 50.000 € de financiación.

Una sola operación, desde el día en que entra el dinero:
sociedad, nave abierta, seis coches comprados, el más caro en espera
hasta el primer cobro. El coste de cada coche ya incluye transporte,
matriculación y puesta a la venta. No se resta otra vez.

El taller no entra en la cobertura. Solo se cuenta lo que tiene tarifa cerrada,
y se marca como hipótesis.
"""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib.colors import Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

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
SOFT = Color(0.955, 0.949, 0.935)


def eur(n, cents=False):
    n = float(n)
    neg = n < 0
    n = abs(n)
    d = 2 if cents else 0
    s = f"{n:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if neg else "") + s + " €"


def money(n, cents=False):
    """Signed amount for a movement, with the sign explicit."""
    n = float(n)
    body = eur(abs(n), cents)
    if n > 0:
        return "+" + body
    if n < 0:
        return "−" + body[1:] if body.startswith("−") else "−" + body
    return body


def r2(n):
    return round(float(n) + 1e-9, 2)


def build_numbers():
    lot = MODEL["lot"]
    held = max(lot, key=lambda u: u["cost"])
    bought = [u for u in lot if u["name"] != held["name"]]
    o = MODEL["opex_month"]
    loan = MODEL["loan"]
    stress = MODEL["scenarios"]["stress_12"]
    tax23 = MODEL["scenarios"]["stress_23"]
    price5 = MODEL["scenarios"]["price_5"]
    web = MODEL["scenarios"]["web_prices"]
    thin = min(lot, key=lambda u: u["net"])
    capital = 50000.0
    financing = 50000.0
    reform = 4550.0
    bought_cost = r2(sum(u["cost"] for u in bought))
    cash0 = r2(capital + financing - bought_cost - reform)
    month = r2(o["structure"] + loan["payment_exact"])
    silence = [r2(cash0 - i * month) for i in range(8)]
    # Primer cobro: el que menos deja. Luego se compra el que esperaba.
    after_cost = r2(cash0 - month)
    after_sale = r2(after_cost + thin["sell"])
    after_vat = r2(after_sale - thin["rebu"])
    after_buy = r2(after_vat - held["cost"])
    gti = next(u for u in lot if "GTI" in u["name"])
    after_gti = r2(after_cost + gti["sell"] - gti["rebu"] - held["cost"])
    audi_left = r2(thin["net"] - month)
    avg_left = r2(MODEL["totals"]["avg_net"] - month)
    assert bought_cost == r2(MODEL["totals"]["cost"] - held["cost"])
    assert cash0 == 17736.00
    assert abs(month - 2835.06) < 0.001
    assert abs(audi_left - 86.43) < 0.02
    return {
        "lot": lot,
        "held": held,
        "bought": bought,
        "thin": thin,
        "gti": gti,
        "o": o,
        "loan": loan,
        "stress": stress,
        "tax23": tax23,
        "price5": price5,
        "web": web,
        "totals": MODEL["totals"],
        "capital": capital,
        "financing": financing,
        "reform": reform,
        "bought_cost": bought_cost,
        "cash0": cash0,
        "month": month,
        "silence": silence,
        "after_cost": after_cost,
        "after_sale": after_sale,
        "after_vat": after_vat,
        "after_buy": after_buy,
        "after_gti": after_gti,
        "audi_left": audi_left,
        "avg_left": avg_left,
        "be": MODEL["break_even_sales"]["dscr_130_15"],
    }


N = build_numbers()


def short(name):
    return name.replace("Mercedes-Benz ", "").replace("Volkswagen ", "")


def footer(c, n, total, dark=False):
    c.setFillColor(GOLD)
    c.rect(0, 0, 4, H, fill=1, stroke=0)
    c.setFillColor(GOLD if dark else GOLD_DEEP)
    c.setFont("DejaVu", 7.5)
    c.drawString(36, 18, "KHC AUTO IMPORT")
    c.setFillColor(Color(0.72, 0.70, 0.64) if dark else SLATE)
    c.drawCentredString(W / 2, 18, "Solicitud de financiación  ·  50.000 €  ·  octubre 2026")
    c.setFillColor(GOLD if dark else INK)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(W - 36, 18, f"{n:02d}  /  {total:02d}")


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


def bg(c, dark=False):
    c.setFillColor(COVER if dark else IVORY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 4, W, 4, fill=1, stroke=0)


def title(c, text, y, size=24):
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", size)
    c.drawString(36, y, text)


def card(c, x, y, w, h, top=GOLD):
    c.setFillColor(CARD)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    c.setFillColor(top)
    c.rect(x, y + h - 2.2, w, 2.2, fill=1, stroke=0)


def draw_cover(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    logo = HERE / "presentacion" / "logo_flat.png"
    if logo.exists():
        c.drawImage(str(logo), 36, 400, width=156, height=68, mask=None, preserveAspectRatio=True, anchor="w")
    kicker(c, "Solicitud de financiación", 36, 372, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 30)
    c.drawString(36, 328, "50.000 € para abrir la nave")
    c.drawString(36, 290, "y comprar seis coches.")
    c.setFillColor(Color(0.78, 0.76, 0.70))
    c.setFont("DejaVu", 12)
    c.drawString(36, 258, "Otros 50.000 € son capital propio. Santiago de Compostela, nave de San Marcos.")
    c.drawString(36, 240, "El séptimo coche no se paga hasta que entra el primer cobro.")
    stats = [
        ("50.000 €", "Lo que se pide"),
        ("17.736 €", "Caja el día 1, nave abierta"),
        ("3.781 €", "Lo que deja un coche, de media"),
    ]
    x = 36
    for val, lab in stats:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 78, 286, 86, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 22)
        c.drawString(x + 16, 118, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 9)
        c.drawString(x + 16, 96, lab.upper())
        x += 302
    footer(c, n, total, True)


def draw_day(c, n, total):
    bg(c)
    kicker(c, "El día que entra el dinero", 36, 498)
    title(c, "Quedan 17.736 € en el banco. La nave ya está abierta.", 462, 20)
    rows = [
        ("Capital propio, ya en la cuenta", "+50.000 €", False),
        ("Financiación que se pide", "+50.000 €", False),
        ("Seis coches, coste ya completo", "−77.714 €", False),
        ("Reforma de la nave, para abrirla ese día", "−4.550 €", False),
        ("Caja que no se toca", "17.736 €", True),
    ]
    y = 408
    for name, amount, last in rows:
        c.setFillColor(COVER if last else CARD)
        c.roundRect(36, y, 888, 42, 3, fill=1, stroke=0)
        if not last:
            c.setFillColor(GOLD)
            c.rect(36, y, 3, 42, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 12)
        c.drawString(54, y + 14, name)
        c.setFont("DejaVuSerif", 14)
        c.drawRightString(908, y + 13, amount)
        y -= 52
    wrap(
        c,
        "El Mercedes Clase C, 17.666 €, no se compra ese día. No porque sobre: es el más caro, y su precio es la caja de emergencia. Se paga cuando entra el primer cobro. El coste de cada coche ya incluye transporte, matriculación y puesta a la venta.",
        "DejaVu", 10.5, 36, 128, 888, 14, SLATE, 3,
    )
    footer(c, n, total)


def draw_thin(c, n, total):
    bg(c)
    kicker(c, "Cómo se gana un coche", 36, 498)
    title(c, "El que menos deja cubre el mes. Sobran 86 €.", 462, 22)
    thin = N["thin"]
    steps = [
        ("1", "Coste", eur(thin["cost"]), "Coche, transporte, matriculación y puesta a punto. Ya está dentro."),
        ("2", "Venta", eur(thin["sell"]), "Precio del plan. En la web, este Audi está a ese mismo precio."),
        ("3", "IVA", eur(thin["rebu"], True), "Solo sobre la ganancia, no sobre los 15.990 €. Va dentro del margen."),
        ("4", "Quedan", eur(thin["net"], True), "Esto es lo que el coche aporta. No se le resta el transporte otra vez."),
    ]
    x = 36
    for num, name, val, note in steps:
        card(c, x, 250, 216, 180)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(x + 14, 400, num)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 9)
        c.drawString(x + 32, 400, name.upper())
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 14, 358, val)
        wrap(c, note, "DejaVu", 8.5, x + 14, 330, 188, 11.5, SLATE, 4)
        x += 228
    c.setFillColor(COVER)
    c.roundRect(36, 56, 888, 168, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 8)
    c.drawString(54, 196, "EL MES, AL LADO DEL COCHE")
    lines = [
        ("Nave, autónomo, portales y luz", eur(N["o"]["structure"])),
        ("Cuota del préstamo, 5,50 % y 60 meses", eur(N["loan"]["payment_exact"], True)),
        ("El mes", eur(N["month"], True)),
        ("Este Audi, después del mes", eur(N["audi_left"], True)),
    ]
    y = 166
    for name, amount in lines:
        c.setFillColor(Color(0.82, 0.80, 0.74))
        c.setFont("DejaVu", 11)
        c.drawString(54, y, name)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 13)
        c.drawRightString(900, y, amount)
        y -= 28
    footer(c, n, total)


def draw_lot(c, n, total):
    bg(c)
    kicker(c, "Los siete del plan", 36, 500)
    title(c, "Seis se compran el día 1. El Mercedes espera.", 468, 22)
    headers = ["Coche", "Coste", "Venta", "IVA de la ganancia", "Quedan", "Día 1"]
    c.setFillColor(INK)
    c.rect(36, 430, 888, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7.5)
    xs = [48, 300, 390, 500, 640, 760]
    for x, h in zip(xs, headers):
        c.drawString(x, 436, h)
    rows = sorted(N["lot"], key=lambda u: -u["net"])
    for i, u in enumerate(rows):
        y = 400 - i * 36
        waiting = u["name"] == N["held"]["name"]
        c.setFillColor(Color(0.965, 0.945, 0.905) if waiting else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 8, 888, 32, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP if waiting else INK)
        c.setFont("DejaVuBold" if waiting else "DejaVu", 9)
        c.drawString(48, y, short(u["name"]))
        c.setFont("DejaVu", 9)
        c.setFillColor(INK)
        c.drawRightString(360, y, eur(u["cost"]))
        c.drawRightString(450, y, eur(u["sell"]))
        c.drawRightString(590, y, eur(u["rebu"], True))
        c.setFillColor(GREEN)
        c.setFont("DejaVuBold", 9)
        c.drawRightString(710, y, eur(u["net"], True))
        c.setFillColor(GOLD_DEEP if waiting else SLATE)
        c.setFont("DejaVuBold" if waiting else "DejaVu", 8)
        c.drawString(760, y, "Espera" if waiting else "Se compra")
    c.setFillColor(COVER)
    c.rect(36, 132, 888, 24, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8.5)
    c.drawString(48, 140, "Los seis que se pagan")
    c.drawRightString(360, 140, eur(N["bought_cost"]))
    c.setFillColor(GOLD)
    c.drawString(760, 140, "El Mercedes, no")
    wrap(
        c,
        "Media de los siete: 3.781 €. Hoy, en khcimport.autos, el 116d está a 12.475 € y el 318d a 17.250 €, mil euros bajo el plan. Con esos dos precios, la cobertura de una venta al mes pasa de 1,72 a 1,51. Sigue por encima de 1,30.",
        "DejaVu", 9.5, 36, 108, 888, 13, SLATE, 3,
    )
    footer(c, n, total)


def draw_month(c, n, total):
    bg(c)
    kicker(c, "Cada mes, con la nave abierta", 36, 498)
    title(c, "Una venta paga el mes. Sobran 946 €.", 462, 24)
    left = [
        ("Nave de San Marcos, 550 m²", "1.100 €"),
        ("Autónomo del administrador", "380 €"),
        ("Portales y gestoría", "250 €"),
        ("Luz, agua y tasas del local", "150 €"),
        ("Cuota, 5,50 % y 60 meses", "955,06 €"),
        ("Sale cada mes, venda o no venda", "2.835,06 €"),
    ]
    y = 418
    for i, (name, amount) in enumerate(left):
        last = i == len(left) - 1
        c.setFillColor(COVER if last else CARD)
        c.roundRect(36, y - 28, 430, 36, 3, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVu", 9)
        c.drawString(50, y - 16, name)
        c.setFont("DejaVuSerif", 11)
        c.drawRightString(452, y - 16, amount)
        y -= 42
    card(c, 492, 168, 432, 250, GREEN)
    c.setFillColor(GREEN)
    c.setFont("DejaVuBold", 8)
    c.drawString(508, 390, "UNA VENTA MEDIA")
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 28)
    c.drawString(508, 348, "3.781 €")
    c.setFont("DejaVu", 12)
    c.setFillColor(SLATE)
    c.drawString(508, 318, "entran")
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 22)
    c.drawString(508, 278, "− 2.835 €")
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 12)
    c.drawString(508, 252, "sale el mes")
    c.setFillColor(GREEN)
    c.setFont("DejaVuSerif", 22)
    c.drawString(508, 206, "Sobran 946 €")
    wrap(
        c,
        "El plan de cuatro páginas divide 3.781 entre 2.846 y escribe 1,32. Usa la cuota redondeada a 966 € y no quita el impuesto. El banco mira otra cuenta: doce ventas, se paga el impuesto, y lo que queda se divide entre las doce cuotas. Eso da 1,72. Es el mismo margen. No es otro negocio.",
        "DejaVu", 10, 36, 118, 888, 13.5, INK, 4,
    )
    footer(c, n, total)


def draw_first(c, n, total):
    bg(c)
    kicker(c, "El primer cobro", 36, 498)
    title(c, "Aunque sea el Audi, se compra el Mercedes y sobra caja.", 462, 20)
    steps = [
        ("Día 1", "Nave abierta y seis coches pagados", eur(N["cash0"], True)),
        ("Pasa un mes", "Nave, autónomo, portales, luz y cuota", eur(N["after_cost"], True)),
        ("Se cobra el Audi", "Entran 15.990 €, el precio de venta", eur(N["after_sale"], True)),
        ("Se aparta el IVA", "613,51 €, solo de la ganancia de ese coche", eur(N["after_vat"], True)),
        ("Se compra el Mercedes", "17.666 €. El que esperaba, ya está pagado", eur(N["after_buy"], True)),
    ]
    y = 408
    for i, (when, what, cash) in enumerate(steps):
        last = i == len(steps) - 1
        c.setFillColor(COVER if last else CARD)
        c.roundRect(36, y, 888, 46, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y, 3.2, 46, fill=1, stroke=0)
        c.setFillColor(GOLD if last else GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(54, y + 26, when.upper())
        c.setFillColor(WHITE if last else INK)
        c.setFont("DejaVu", 11)
        c.drawString(54, y + 10, what)
        c.setFont("DejaVuSerif", 13)
        c.drawRightString(908, y + 15, cash)
        y -= 56
    wrap(
        c,
        "La caja queda en 12.611,43 €, con el Mercedes ya comprado y el mes pagado. Si el primero es el Golf GTI, queda en " + eur(N["after_gti"], True) + ". En los dos casos se puede comprar el coche que esperaba.",
        "DejaVu", 10, 36, 108, 888, 13, SLATE, 2,
    )
    footer(c, n, total)


def draw_silence(c, n, total):
    bg(c)
    kicker(c, "Si no entra ningún cobro", 36, 498)
    title(c, "La caja aguanta seis meses. Al séptimo, faltan 2.109 €.", 462, 20)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 11)
    c.drawString(36, 432, "Cada mes salen 2.835,06 €. No entra ninguna venta. El Mercedes sigue sin comprarse.")
    labels = ["Día 1", "Mes 1", "Mes 2", "Mes 3", "Mes 4", "Mes 5", "Mes 6", "Mes 7"]
    vals = N["silence"]
    x = 36
    for i, (lab, val) in enumerate(zip(labels, vals)):
        neg = val < 0
        c.setFillColor(Color(0.55, 0.23, 0.23) if neg else (COVER if i == 0 else CARD))
        c.roundRect(x, 168, 104, 230, 3, fill=1, stroke=0)
        c.setFillColor(GOLD if not neg else WHITE)
        c.rect(x, 396, 104, 2.2, fill=1, stroke=0)
        c.setFillColor(WHITE if i == 0 or neg else INK)
        c.setFont("DejaVuBold", 8)
        c.drawCentredString(x + 52, 360, lab.upper())
        c.setFont("DejaVuSerif", 8)
        c.drawCentredString(x + 52, 292, eur(val, True))
        c.setFillColor(GOLD if i == 0 else (WHITE if neg else GREEN))
        c.setFont("DejaVu", 7.5)
        c.drawCentredString(x + 52, 200, "Falta" if neg else "Aguanta")
        x += 114
    wrap(
        c,
        "Seis meses de nave y de cuota, sin vender un coche, dejan 725,64 €. El séptimo mes no se cubre. Esa es la caja de emergencia: no es infinita, y se ve el día en que se acaba.",
        "DejaVu", 11, 36, 120, 888, 15, INK, 2,
    )
    footer(c, n, total)


def draw_engines(c, n, total):
    bg(c)
    kicker(c, "Qué se compra", 36, 498)
    title(c, "Se compra el motor. No el anuncio.", 462, 24)
    card(c, 36, 56, 432, 380, GREEN)
    card(c, 492, 56, 432, 380, RED)
    c.setFillColor(GREEN)
    c.setFont("DejaVuBold", 11)
    c.drawString(54, 400, "SÍ")
    c.setFillColor(RED)
    c.setFont("DejaVuBold", 11)
    c.drawString(510, 400, "NO")
    yes = [
        "Etiqueta C o ECO, libro de mantenimiento y sin siniestro estructural.",
        "Diésel 2.0 con correa seca, el que un mecánico recomienda.",
        "BMW diésel solo si el motor es el posterior a la cadena que rompía.",
        "Mercedes del lote: se verifica el código del motor antes de pagar.",
        "Garantía de 12 meses, por escrito, en todas las ventas.",
    ]
    no = [
        "PureTech y EcoBoost de correa bañada en aceite. Rompen.",
        "1.2 TCe. Bebe aceite. El diésel Ingenium de Jaguar y Land Rover.",
        "BMW con la cadena antigua, el N47, hasta mediados de 2015.",
        "Diésel de antes de septiembre de 2015. Etiqueta B, y las ZBE ya están.",
        "El 116d de 2015 del lote no se transfiere hasta ver qué motor lleva.",
    ]
    for items, x in ((yes, 54), (no, 510)):
        y = 360
        for item in items:
            c.setFillColor(GOLD)
            c.circle(x + 4, y + 3, 2.2, fill=1, stroke=0)
            h = wrap(c, item, "DejaVu", 10.5, x + 16, y, 380, 13.5, INK, 3)
            y -= h + 12
    footer(c, n, total)


def draw_program(c, n, total):
    bg(c)
    kicker(c, "El programa de gestión", 36, 498)
    title(c, "Ya está hecho. Dice que no antes de que salga el dinero.", 462, 20)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 11)
    c.drawString(36, 432, "En la empresa se llama ERP. No es un Excel ni la web. Es el programa con el que se compra.")
    items = [
        ("Antes de pagar", "Suma coche, transporte, impuestos y preparación, y dice lo que queda a ese precio de venta. Si no sale, no se compra."),
        ("El motor", "1.104 versiones, de 37 marcas. Cada una está marcada: fiable, correcta, con precaución o prohibida. La prohibida no se puede dar de alta como compra."),
        ("El impuesto", "Pregunta a quién se compra. Si la factura trae un IVA que se puede descontar, impide calcular el impuesto solo sobre la ganancia. Así no se aplica el que no toca."),
        ("La ficha y la web", "Cada coche pasa de «lo estamos mirando» a «entregado», con los papeles que faltan. khcimport.autos enseña el mismo stock. Reservado o vendido se ve el mismo día. El cliente no ve lo que costó."),
    ]
    y = 388
    for head, body in items:
        c.setFillColor(CARD)
        c.roundRect(36, y - 62, 888, 74, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 62, 3.2, 74, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(54, y - 4, head)
        wrap(c, body, "DejaVu", 10, 54, y - 24, 850, 13, SLATE, 2)
        y -= 84
    footer(c, n, total)


def draw_nave(c, n, total):
    bg(c)
    kicker(c, "La nave, desde el día 1", 36, 498)
    title(c, "San Marcos se abre con el dinero. El taller no paga la cuota.", 462, 20)
    facts = [
        ("550 m²", "San Marcos, Santiago. La licencia de actividad ya existe. La renta es 1.100 € al mes, desde el día 1."),
        ("4.550 €", "Reforma de materiales: suelo, luz, aseos y extintores. La hace el promotor. Se paga el día que se abre."),
        ("60 €", "Mano de obra que hoy se paga a un taller de fuera, por cada coche. Aceite 52,70 €. Cuatro filtros 63,90 €."),
    ]
    x = 36
    for val, lab in facts:
        card(c, x, 318, 286, 120)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 14, 400, val)
        wrap(c, lab, "DejaVu", 8.5, x + 14, 376, 258, 11.5, SLATE, 4)
        x += 302
    headers = ["Trabajo en la nave", "Lo que se sabe", "Lo que se cuenta"]
    c.setFillColor(INK)
    c.rect(36, 280, 888, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    for x, h in ((48, headers[0]), (360, headers[1]), (680, headers[2])):
        c.drawString(x, 285, h)
    jobs = [
        ("Aceite y cuatro filtros, a un cliente", "Recambio 116,60 €. Mano de obra 60 €.", "60 € por servicio"),
        ("El mismo trabajo, en un coche propio", "Hoy esos 60 € salen a un taller de fuera.", "60 € que se quedan"),
        ("Aceite de caja y pastillas", "No hay tarifa cerrada.", "0 €"),
        ("Neumáticos", "Más adelante. No hay precio.", "0 €"),
    ]
    for i, row in enumerate(jobs):
        y = 252 - i * 28
        if i % 2 == 0:
            c.setFillColor(CARD)
            c.rect(36, y - 6, 888, 26, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 8.5)
        c.drawString(48, y, row[0])
        c.setFillColor(SLATE)
        c.drawString(360, y, row[1])
        c.setFillColor(GREEN if row[2] != "0 €" else SLATE)
        c.setFont("DejaVuBold", 8.5)
        c.drawString(680, y, row[2])
    wrap(
        c,
        "Dos servicios a clientes por semana serían 5.760 € al año, más 720 € en doce coches propios. Es hipótesis, no facturación. No está dentro del 1,72. El recambio se cobra a coste.",
        "DejaVu", 10, 36, 108, 888, 13, INK, 2,
    )
    footer(c, n, total)


def draw_stress(c, n, total):
    bg(c)
    kicker(c, "Si el número se mueve", 36, 498)
    title(c, "Cada golpe tiene un resultado. No hay que imaginarlo.", 462, 22)
    rows = [
        ("Doce ventas, impuesto al 15 %", "1,72 veces", "Cubre la cuota. Es el número con el que se pide el dinero."),
        ("El mismo año, impuesto al 23 %", "1,58 veces", "Si el tipo de empresa nueva no aplica. Sigue cubriendo."),
        ("Dos coches, mil euros más baratos", "1,51 veces", "El precio que hoy tienen en la web el 116d y el 318d."),
        ("Todos los precios, un 5 % más bajos", "1,06 veces", "La cuota se paga. No queda el colchón de 1,30."),
        ("Seis meses sin una venta", "725,64 €", "Eso queda en el banco. Al séptimo mes faltan 2.109 €."),
    ]
    y = 400
    for name, num, meaning in rows:
        c.setFillColor(CARD)
        c.roundRect(36, y - 18, 888, 52, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 18, 3.2, 52, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 11)
        c.drawString(54, y + 12, name)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 9.5)
        c.drawString(54, y - 6, meaning)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 16)
        c.drawRightString(908, y + 4, num)
        y -= 64
    footer(c, n, total)


def draw_uses(c, n, total):
    bg(c)
    kicker(c, "Para qué es el dinero", 36, 498)
    title(c, "Los 50.000 € son coches. No son sueldo ni reforma.", 462, 22)
    blocks = [
        ("50.000 €", "Financiación", "Circulante para stock. Entra el mismo día que se abre la nave."),
        ("50.000 €", "Capital propio", "La otra mitad. Ya está comprometida al lado del préstamo."),
        ("0 €", "De sueldo", "El administrador no cobra. Los 25.000 € familiares están fuera de la sociedad."),
    ]
    x = 36
    for val, name, note in blocks:
        c.setFillColor(COVER)
        c.roundRect(x, 250, 286, 180, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(x, 428, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 22)
        c.drawString(x + 16, 370, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVuBold", 9)
        c.drawString(x + 16, 346, name.upper())
        wrap(c, note, "DejaVu", 10, x + 16, 318, 254, 13.5, Color(0.82, 0.80, 0.74), 4)
        x += 302
    wrap(
        c,
        "El préstamo se queda en coches. La reforma, 4.550 €, sale del capital propio. El 5,50 % a 60 meses es la hipótesis de este plan, no una oferta: la cuota exacta es 955,06 €. Si el tipo es otro, se cambia esa línea y se vuelve a mirar el 1,72.",
        "DejaVu", 12, 36, 200, 888, 16, INK, 4,
    )
    footer(c, n, total)


def draw_close(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    kicker(c, "La petición", 36, 430, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 32)
    c.drawString(36, 378, "50.000 € al lado")
    c.drawString(36, 338, "de otros 50.000 €.")
    wrap(
        c,
        "El día que entran, se abre la nave de San Marcos, se compran seis coches cuyo coste ya está cerrado y el Mercedes espera en la cuenta. Lo que se pide es una oferta de tipo y de plazo. No una rebaja del margen.",
        "DejaVu", 13, 36, 290, 860, 18, Color(0.78, 0.76, 0.70), 3,
    )
    stats = [("50.000 €", "Financiación"), ("17.736 €", "Caja el día 1"), ("1,72 veces", "La cuota, con una venta al mes")]
    x = 36
    for val, lab in stats:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 78, 286, 78, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 20)
        c.drawString(x + 16, 116, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 8.5)
        c.drawString(x + 16, 96, lab.upper())
        x += 302
    footer(c, n, total, True)


def draw_sources(c, n, total):
    bg(c)
    kicker(c, "De dónde sale cada cifra", 36, 498)
    title(c, "Nada de aquí es una venta ya cobrada.", 462, 22)
    items = [
        "Lote, nave, reforma y gastos mensuales: plan de viabilidad de cuatro páginas. San Marcos, 550 m², licencia ya existente.",
        "El coste de compra de ese plan ya incluye coche, transporte, matriculación y puesta a la venta. No se resta otra vez.",
        "La cuota de 955,06 € es la exacta al 5,50 % y 60 meses. El plan la redondea a 966 € y por eso imprime 1,32, no 1,72.",
        "La regla de dejar un coche sin comprar es de esta financiación. El que espera es el Mercedes, porque es el más caro. En las cuatro páginas se compran los siete el mismo día.",
        "El 116d a 12.475 € y el 318d a 17.250 € son los precios públicos de khcimport.autos a 11 de octubre de 2026.",
        "Taller: aceite 52,70 € y filtros 63,90 €, tarifas cerradas. Los 60 € son la mano de obra que hoy se paga fuera. Dos servicios por semana son hipótesis.",
        "El equipo de inspección, 822,90 €, está presupuestado en otro documento. No se ha restado de los 17.736 €.",
    ]
    y = 410
    for item in items:
        c.setFillColor(GOLD)
        c.circle(46, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 11, 60, y, 860, 14.5, INK, 3)
        y -= h + 10
    footer(c, n, total)


SLIDES = [
    draw_cover, draw_day, draw_thin, draw_lot, draw_month, draw_first,
    draw_silence, draw_engines, draw_program, draw_nave, draw_stress,
    draw_uses, draw_close, draw_sources,
]


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


def write_pdf():
    c = canvas.Canvas(str(OUT_PDF), pagesize=(W, H))
    c.setTitle("Solicitud de financiación — KHC Auto Import")
    c.setAuthor("KHC Auto Import")
    total = len(SLIDES)
    for i, fn in enumerate(SLIDES, 1):
        fn(c, i, total)
        c.showPage()
    c.save()


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def write_html():
    thin = N["thin"]
    lot_rows = []
    for u in sorted(N["lot"], key=lambda u: -u["net"]):
        waiting = u["name"] == N["held"]["name"]
        lot_rows.append(
            f"<tr class='{'wait' if waiting else ''}'><td>{esc(short(u['name']))}</td><td class='num'>{esc(eur(u['cost']))}</td><td class='num'>{esc(eur(u['sell']))}</td><td class='num'>{esc(eur(u['net'], True))}</td><td>{'Espera' if waiting else 'Se compra'}</td></tr>"
        )
    silence = "".join(
        f"<div class='pill {'bad' if v < 0 else ''}'><b>{esc(eur(v))}</b><span>Mes {i if i else 'día 1'}</span></div>"
        for i, v in enumerate(N["silence"])
    )
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Financiación 50.000 € — KHC Auto Import</title>
<style>
  :root {{ --ink:#0a1020; --gold:#b3934e; --ivory:#f7f6f2; --cover:#212228; --slate:#4a5872; --green:#1f6b4a; --line:#e4dfd4; }}
  * {{ box-sizing:border-box; }}
  html, body {{ margin:0; background:var(--cover); color:var(--ink); font-family:"Segoe UI", Helvetica, Arial, sans-serif; }}
  .slide {{ display:none; min-height:100vh; padding:7vh 8vw 9vh; flex-direction:column; background:var(--ivory); }}
  .slide.active {{ display:flex; }}
  .slide.dark {{ background:var(--cover); color:#f4f1ea; }}
  .kicker {{ letter-spacing:.14em; font-size:12px; font-weight:700; color:var(--gold); margin:0 0 10px; }}
  h1 {{ font-family:Georgia, serif; font-weight:500; font-size:clamp(28px, 3.6vw, 46px); line-height:1.08; margin:0 0 16px; max-width:22ch; }}
  .lead, .note {{ font-size:18px; line-height:1.45; max-width:68ch; color:var(--slate); }}
  .slide.dark .lead {{ color:#cfc8ba; }}
  .stats, .grid3 {{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:22px; }}
  .stat, article {{ background:#fff; border-top:3px solid var(--gold); border-radius:8px; padding:16px 18px; }}
  .slide.dark .stat {{ background:#2a2b32; color:#f4f1ea; }}
  .stat b, article b {{ display:block; font-family:Georgia, serif; font-size:28px; font-weight:500; }}
  .stat span, article p {{ color:var(--slate); font-size:15px; line-height:1.4; }}
  .slide.dark .stat span {{ color:#cfc8ba; }}
  .line {{ display:flex; justify-content:space-between; gap:16px; background:#fff; border-left:3px solid var(--gold); padding:12px 16px; margin:8px 0; }}
  .line.total {{ background:#212228; color:#f4f1ea; }}
  .line.total b {{ color:#b3934e; }}
  table {{ width:100%; border-collapse:collapse; font-size:15px; margin-top:8px; }}
  th {{ text-align:left; background:var(--ink); color:#fff; padding:8px 10px; font-size:12px; }}
  td {{ padding:8px 10px; border-bottom:1px solid var(--line); }}
  tr.wait td {{ background:#f6efe2; font-weight:700; }}
  .num {{ text-align:right; font-variant-numeric:tabular-nums; }}
  .split {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
  .yes {{ border-top:3px solid var(--green); background:#fff; border-radius:8px; padding:16px 20px; }}
  .no {{ border-top:3px solid #8c3a3a; background:#fff; border-radius:8px; padding:16px 20px; }}
  ul {{ margin:8px 0 0; padding-left:18px; }}
  li {{ margin:0 0 8px; line-height:1.4; }}
  .pills {{ display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }}
  .pill {{ background:#fff; border-radius:8px; padding:12px; min-width:100px; border-top:3px solid var(--green); }}
  .pill.bad {{ border-top-color:#8c3a3a; }}
  .pill b {{ display:block; font-family:Georgia, serif; font-size:18px; }}
  .pill span {{ color:var(--slate); font-size:12px; }}
  .logo {{ width:160px; margin-bottom:12px; }}
  footer {{ margin-top:auto; display:flex; justify-content:space-between; padding-top:18px; color:var(--gold); font-size:12px; letter-spacing:.08em; }}
  .progress {{ position:fixed; left:0; top:0; height:3px; background:var(--gold); }}
  .hint {{ position:fixed; right:16px; bottom:12px; color:#8a8172; font-size:12px; }}
  @media (max-width: 800px) {{ .stats, .grid3, .split {{ grid-template-columns:1fr; }} }}
</style>
</head>
<body>
<div class="progress" id="bar"></div>
<section class="slide dark">
  <img class="logo" src="logo_flat.png" alt="KHC">
  <p class="kicker">Solicitud de financiación</p>
  <h1>50.000 € para abrir la nave y comprar seis coches.</h1>
  <p class="lead">Otros 50.000 € son capital propio. Santiago de Compostela. El Mercedes no se paga hasta el primer cobro.</p>
  <div class="stats">
    <div class="stat"><b>50.000 €</b><span>Lo que se pide</span></div>
    <div class="stat"><b>17.736 €</b><span>Caja el día 1, nave abierta</span></div>
    <div class="stat"><b>3.781 €</b><span>Lo que deja un coche, de media</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>01 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">El día que entra el dinero</p>
  <h1>Quedan 17.736 € en el banco. La nave ya está abierta.</h1>
  <div class="line"><span>Capital propio</span><b>+50.000 €</b></div>
  <div class="line"><span>Financiación</span><b>+50.000 €</b></div>
  <div class="line"><span>Seis coches, coste ya completo</span><b>−77.714 €</b></div>
  <div class="line"><span>Reforma, para abrir la nave ese día</span><b>−4.550 €</b></div>
  <div class="line total"><span>Caja que no se toca</span><b>17.736 €</b></div>
  <p class="note">El Mercedes, 17.666 €, espera. No porque sobre: es el más caro, y ese dinero es la caja de emergencia. Se paga con el primer cobro.</p>
  <footer><span>KHC AUTO IMPORT</span><span>02 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Cómo se gana un coche</p>
  <h1>El que menos deja cubre el mes. Sobran 86 €.</h1>
  <div class="stats">
    <div class="stat"><b>{esc(eur(thin['cost']))}</b><span>Coste del Audi. Transporte y matriculación ya dentro.</span></div>
    <div class="stat"><b>{esc(eur(thin['sell']))}</b><span>Venta. El IVA, {esc(eur(thin['rebu'], True))}, solo grava la ganancia.</span></div>
    <div class="stat"><b>{esc(eur(thin['net'], True))}</b><span>Quedan. El mes cuesta 2.835,06 €. Sobran 86,43 €.</span></div>
  </div>
  <p class="note">El IVA no se paga sobre los 15.990 €. Se paga sobre la ganancia. Ya está restado. No se vuelve a restar el transporte.</p>
  <footer><span>KHC AUTO IMPORT</span><span>03 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Los siete del plan</p>
  <h1>Seis se compran el día 1. El Mercedes espera.</h1>
  <table><thead><tr><th>Coche</th><th>Coste</th><th>Venta</th><th>Quedan</th><th>Día 1</th></tr></thead><tbody>{''.join(lot_rows)}</tbody></table>
  <p class="note">Los seis cuestan 77.714 €. En la web, el 116d está a 12.475 € y el 318d a 17.250 €. Con esos precios la cobertura baja de 1,72 a 1,51.</p>
  <footer><span>KHC AUTO IMPORT</span><span>04 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Cada mes</p>
  <h1>Una venta paga el mes. Sobran 946 €.</h1>
  <div class="split">
    <div>
      <div class="line"><span>Nave</span><b>1.100 €</b></div>
      <div class="line"><span>Autónomo</span><b>380 €</b></div>
      <div class="line"><span>Portales y gestoría</span><b>250 €</b></div>
      <div class="line"><span>Luz y tasas</span><b>150 €</b></div>
      <div class="line"><span>Cuota exacta</span><b>955,06 €</b></div>
      <div class="line total"><span>El mes</span><b>2.835,06 €</b></div>
    </div>
    <article>
      <b>1,72</b>
      <p>Doce ventas, pagado el impuesto, dividido entre las doce cuotas. El 1,32 de las cuatro páginas es el margen partido por nave más cuota redondeada, sin quitar el impuesto. Mismo margen. Otra cuenta.</p>
    </article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>05 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">El primer cobro</p>
  <h1>Aunque sea el Audi, se compra el Mercedes y sobra caja.</h1>
  <div class="line"><span>Día 1</span><b>17.736,00 €</b></div>
  <div class="line"><span>Un mes de nave y cuota</span><b>14.900,94 €</b></div>
  <div class="line"><span>Cobro del Audi, 15.990 €</span><b>30.890,94 €</b></div>
  <div class="line"><span>IVA de esa ganancia, 613,51 €</span><b>30.277,43 €</b></div>
  <div class="line total"><span>Compra del Mercedes, 17.666 €</span><b>12.611,43 €</b></div>
  <p class="note">Si el primero es el Golf GTI, la caja queda en {esc(eur(N['after_gti'], True))}.</p>
  <footer><span>KHC AUTO IMPORT</span><span>06 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Si no entra ningún cobro</p>
  <h1>La caja aguanta seis meses. Al séptimo, faltan 2.109 €.</h1>
  <div class="pills">{silence}</div>
  <p class="note">Cada columna resta 2.835,06 €. Al sexto mes quedan 725,64 €. Al séptimo faltan 2.109,42 €. La emergencia se ve. No es infinita.</p>
  <footer><span>KHC AUTO IMPORT</span><span>07 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Qué se compra</p>
  <h1>Se compra el motor. No el anuncio.</h1>
  <div class="split">
    <section class="yes"><h3>Sí</h3><ul>
      <li>Etiqueta C o ECO, libro de mantenimiento, sin siniestro estructural.</li>
      <li>Diésel 2.0 de correa seca. BMW solo si el motor es el posterior a la cadena que rompía.</li>
      <li>Garantía de 12 meses, por escrito, en todas las ventas.</li>
    </ul></section>
    <section class="no"><h3>No</h3><ul>
      <li>PureTech, EcoBoost de correa bañada, 1.2 TCe, diésel Ingenium.</li>
      <li>BMW N47, la cadena antigua, hasta mediados de 2015.</li>
      <li>El 116d de 2015 del lote no se transfiere hasta ver qué motor lleva.</li>
    </ul></section>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>08 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">El programa de gestión</p>
  <h1>Ya está hecho. Dice que no antes de que salga el dinero.</h1>
  <p class="lead">En la empresa se llama ERP. No es un Excel ni la página web. Es el programa con el que se compra.</p>
  <div class="line"><span><b>Antes de pagar.</b> Suma coche, transporte, impuestos y preparación, y dice lo que queda.</span></div>
  <div class="line"><span><b>El motor.</b> 1.104 versiones de 37 marcas. La prohibida no se puede dar de alta como compra.</span></div>
  <div class="line"><span><b>El impuesto.</b> Si la factura trae IVA deducible, impide usar el régimen de margen.</span></div>
  <div class="line"><span><b>La web.</b> khcimport.autos enseña el mismo stock. Reservado o vendido se ve el mismo día. El cliente no ve lo que costó.</span></div>
  <footer><span>KHC AUTO IMPORT</span><span>09 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">La nave, desde el día 1</p>
  <h1>San Marcos se abre con el dinero. El taller no paga la cuota.</h1>
  <div class="grid3">
    <article><b>1.100 €</b><p>Renta mensual. 550 m², licencia de actividad ya existente.</p></article>
    <article><b>4.550 €</b><p>Reforma de materiales, pagada el día que se abre.</p></article>
    <article><b>60 €</b><p>Mano de obra que hoy sale fuera. Aceite 52,70 €. Filtros 63,90 €.</p></article>
  </div>
  <p class="note">Pastillas, aceite de caja y neumáticos no tienen tarifa cerrada: se cuentan a 0 €. Dos servicios externos por semana serían 5.760 € al año. Es hipótesis. No está en el 1,72.</p>
  <footer><span>KHC AUTO IMPORT</span><span>10 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Si el número se mueve</p>
  <h1>Cada golpe tiene un resultado.</h1>
  <div class="line"><span>Doce ventas, impuesto 15 %</span><b>1,72 veces</b></div>
  <div class="line"><span>Impuesto al 23 %</span><b>1,58 veces</b></div>
  <div class="line"><span>Dos precios de la web, mil euros debajo</span><b>1,51 veces</b></div>
  <div class="line"><span>Todos los precios, un 5 % más bajos</span><b>1,06 veces</b></div>
  <div class="line"><span>Seis meses sin una venta</span><b>725,64 €</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>11 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Para qué es el dinero</p>
  <h1>Los 50.000 € son coches. No son sueldo.</h1>
  <div class="grid3">
    <article><b>50.000 €</b><p>Financiación. Circulante para stock.</p></article>
    <article><b>50.000 €</b><p>Capital propio, al lado.</p></article>
    <article><b>0 €</b><p>De sueldo. Los 25.000 € familiares están fuera.</p></article>
  </div>
  <p class="note">El préstamo se queda en coches. La reforma, 4.550 €, sale del capital propio. El 5,50 % es la hipótesis del plan, no una oferta.</p>
  <footer><span>KHC AUTO IMPORT</span><span>12 / 14</span></footer>
</section>
<section class="slide dark">
  <p class="kicker">La petición</p>
  <h1>50.000 € al lado de otros 50.000 €.</h1>
  <p class="lead">El día que entran, se abre la nave, se compran seis coches y el Mercedes espera en la cuenta. Lo que se pide es una oferta de tipo y de plazo.</p>
  <div class="stats">
    <div class="stat"><b>50.000 €</b><span>Financiación</span></div>
    <div class="stat"><b>17.736 €</b><span>Caja el día 1</span></div>
    <div class="stat"><b>1,72 veces</b><span>La cuota, con una venta al mes</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>13 / 14</span></footer>
</section>
<section class="slide">
  <p class="kicker">De dónde sale cada cifra</p>
  <h1>Nada de aquí es una venta ya cobrada.</h1>
  <ul>
    <li>Lote, nave, reforma y gastos: plan de viabilidad de cuatro páginas.</li>
    <li>El coste de compra ya incluye transporte y matriculación. No se resta otra vez.</li>
    <li>Dejar el Mercedes sin comprar es la regla de esta financiación. En las cuatro páginas se compran los siete el mismo día.</li>
    <li>El equipo de inspección, 822,90 €, está en otro documento. No se ha restado de los 17.736 €.</li>
    <li>Taller: solo tarifas cerradas. El volumen externo es hipótesis.</li>
  </ul>
  <footer><span>KHC AUTO IMPORT</span><span>14 / 14</span></footer>
</section>
<div class="hint">Flechas para avanzar · F para pantalla completa</div>
<script>
  const slides = [...document.querySelectorAll('.slide')];
  let i = 0;
  const bar = document.getElementById('bar');
  function show(n) {{
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    bar.style.width = ((i + 1) / slides.length * 100) + '%';
  }}
  addEventListener('keydown', (e) => {{
    if (['ArrowRight','PageDown',' '].includes(e.key)) {{ e.preventDefault(); show(i + 1); }}
    if (['ArrowLeft','PageUp','Backspace'].includes(e.key)) {{ e.preventDefault(); show(i - 1); }}
    if (e.key === 'f' || e.key === 'F') {{
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }}
  }});
  addEventListener('click', (e) => {{
    if (e.clientX > innerWidth * 0.2) show(i + 1); else show(i - 1);
  }});
  show(0);
</script>
</body>
</html>
"""
    OUT_HTML.parent.mkdir(exist_ok=True)
    OUT_HTML.write_text(html, encoding="utf-8")


def main():
    flatten_logo()
    write_pdf()
    write_html()
    print("cash0", N["cash0"], "month", N["month"], "silence", N["silence"])
    print("first sale ends", N["after_buy"], "gti", N["after_gti"])
    print(OUT_PDF, OUT_PDF.stat().st_size, "slides", len(SLIDES))


if __name__ == "__main__":
    main()

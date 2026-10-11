#!/usr/bin/env python3
"""Solicitud de financiación, en el orden en que se entiende.

Primero el negocio, después los coches, después el programa, y solo entonces
el dinero. El mes 1 abre la nave y compra seis. Cada venta posterior compra
el siguiente coche en el mismo mes. La caja no acumula el precio de venta.
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
MONTH = 2835.06
REFORM = 4550.0


def r2(n):
    return round(float(n) + 1e-9, 2)


def eur(n, cents=False):
    n = float(n)
    neg = n < 0
    d = 2 if cents or abs(n - round(n)) > 0.001 else 0
    s = f"{abs(n):,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if neg else "") + s + " €"


def short(name):
    return (
        name.replace("Mercedes-Benz ", "")
        .replace("Volkswagen ", "")
        .replace(" Performance", "")
        .replace(" Manual", "")
        .replace(" Touring", "")
        .replace(" 2.0 D3", "")
        .replace(" 1.0 TFSI", "")
        .replace(" 1.0 TSI", "")
    )


def build():
    lot = list(MODEL["lot"])
    held = max(lot, key=lambda u: u["cost"])
    bought = [u for u in lot if u["name"] != held["name"]]
    bought_cost = r2(sum(u["cost"] for u in bought))
    cash = r2(100000 - bought_cost - REFORM - MONTH)
    months = [{
        "n": 1,
        "what": "Apertura. Seis coches y reforma. Sin venta.",
        "inn": 100000.0,
        "out": r2(bought_cost + REFORM + MONTH),
        "end": cash,
        "kind": "open",
    }]
    # Mes 2: se vende el primero de los seis y se compra el que esperaba.
    first = bought[0]
    cash = r2(cash - MONTH + first["sell"] - first["rebu"] - held["cost"])
    months.append({
        "n": 2,
        "what": f"Venta del {short(first['name'])}. Compra del Mercedes.",
        "inn": first["sell"],
        "out": r2(MONTH + first["rebu"] + held["cost"]),
        "end": cash,
        "kind": "turn",
    })
    cycle = bought[1:] + [held] + bought
    for i, car in enumerate(cycle[:10], start=3):
        cash = r2(cash - MONTH + car["sell"] - car["rebu"] - car["cost"])
        months.append({
            "n": i,
            "what": f"Venta del {short(car['name'])}. Se repone al mismo coste.",
            "inn": car["sell"],
            "out": r2(MONTH + car["rebu"] + car["cost"]),
            "end": cash,
            "kind": "roll",
        })
    assert len(months) == 12
    assert months[0]["end"] == 14900.94
    assert months[1]["end"] == 11888.76
    return {
        "lot": lot,
        "held": held,
        "bought": bought,
        "bought_cost": bought_cost,
        "first": first,
        "months": months,
        "o": MODEL["opex_month"],
        "loan": MODEL["loan"],
        "totals": MODEL["totals"],
        "stress": MODEL["scenarios"]["stress_12"],
        "tax23": MODEL["scenarios"]["stress_23"],
        "web": MODEL["scenarios"]["web_prices"],
        "price5": MODEL["scenarios"]["price_5"],
        "thin": min(lot, key=lambda u: u["net"]),
    }


S = build()


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
    c.drawCentredString(W / 2, 18, "Solicitud de financiación  ·  50.000 €  ·  octubre 2026")
    c.setFillColor(GOLD if dark else INK)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(W - 36, 18, f"{n:02d}  /  {total:02d}")


def kicker(c, text, y, dark=False):
    c.setFillColor(GOLD if dark else GOLD_DEEP)
    c.setFont("DejaVuBold", 8)
    c.drawString(36, y, text.upper())


def wrap(c, text, font, size, x, y, width, leading, color, max_lines=6):
    c.setFont(font, size)
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
    for i, line in enumerate(lines[:max_lines]):
        c.setFillColor(color)
        c.setFont(font, size)
        c.drawString(x, y - i * leading, line)
    return min(len(lines), max_lines) * leading


def heading(c, kick, text, y=498, size=22):
    kicker(c, kick, y)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", size)
    c.drawString(36, y - 36, text)
    return y - 36


def draw_cover(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    logo = HERE / "presentacion" / "logo_flat.png"
    if logo.exists():
        c.drawImage(str(logo), 36, 404, width=150, height=64, mask=None, preserveAspectRatio=True, anchor="w")
    kicker(c, "Solicitud de financiación", 376, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 30)
    c.drawString(36, 328, "50.000 € para abrir la nave")
    c.drawString(36, 290, "y poner el stock en marcha.")
    c.setFillColor(Color(0.78, 0.76, 0.70))
    c.setFont("DejaVu", 12)
    c.drawString(36, 252, "Otros 50.000 € son capital propio. Santiago de Compostela.")
    c.drawString(36, 234, "El día que entra el dinero se abre la nave y el stock empieza a rotar.")
    stats = [
        ("50.000 €", "Lo que se pide"),
        ("50.000 €", "Capital propio, al lado"),
        ("12 meses", "El primer año, con cada venta"),
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


def draw_business(c, n, total):
    bg(c)
    heading(c, "Qué es la empresa", "Se venden coches seleccionados. No se vende una importación.", size=20)
    rows = [
        ("01", "El producto", "Coches de ocasión, nacionales o traídos de fuera. Se compra donde el número cierra. No hay un país de bandera."),
        ("02", "El cliente", "Galicia. El precio de venta del plan cae entre 13.000 y 24.000 €, que es donde se decide y se financia en días."),
        ("03", "La promesa", "Doce meses de garantía, por escrito, en todas las ventas. Si el historial no se acredita, no se paga el coche."),
        ("04", "El local", "Nave de 550 m² en San Marcos, Santiago. La licencia de actividad ya existe. Se abre el día que entra el dinero."),
    ]
    y = 400
    for num, title, body in rows:
        c.setFillColor(CARD)
        c.roundRect(36, y - 62, 888, 74, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 62, 3, 74, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 11)
        c.drawString(54, y - 8, num)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 13)
        c.drawString(92, y - 10, title)
        wrap(c, body, "DejaVu", 10.5, 92, y - 32, 800, 13.5, SLATE, 2)
        y -= 84
    footer(c, n, total)


def draw_method(c, n, total):
    bg(c)
    heading(c, "Cómo se gana un coche", "Cuatro restas. En este orden. Siempre las mismas.", size=22)
    t = S["totals"]
    steps = [
        ("1", "Coste", eur(t["cost"] / 7), "Coche, transporte, matriculación y puesta a punto. Ya está dentro. No se resta otra vez."),
        ("2", "Venta", eur(t["sell"] / 7), "El precio al que sale. La media de los siete es esta. El detalle, en la lámina siguiente."),
        ("3", "IVA", eur(t["rebu"] / 7), "Solo sobre la ganancia, no sobre la venta. En un usado, a eso se le llama REBU."),
        ("4", "Quedan", "3.781 €", "Venta menos coste menos ese IVA. Es el margen. La media de los siete."),
    ]
    x = 36
    for num, name, val, note in steps:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 168, 216, 210, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 376, 216, 2.2, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 10)
        c.drawString(x + 14, 348, num + "   " + name.upper())
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 14, 308, val)
        wrap(c, note, "DejaVu", 9, x + 14, 276, 188, 12, SLATE, 5)
        x += 228
    wrap(
        c,
        "Es la media de los siete. La lámina siguiente los pone uno a uno, con su coste y su venta.",
        "DejaVu", 11, 36, 128, 888, 15, INK, 2,
    )
    footer(c, n, total)


def draw_lot(c, n, total):
    bg(c)
    heading(c, "Los siete coches del plan", "Esto es el stock. Coste, venta y lo que queda.", size=22)
    c.setFillColor(INK)
    c.rect(36, 418, 888, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawString(48, 424, "Coche")
    c.drawRightString(410, 424, "Coste")
    c.drawRightString(520, 424, "Venta")
    c.drawRightString(700, 424, "IVA de la ganancia")
    c.drawRightString(900, 424, "Quedan")
    for i, u in enumerate(S["lot"]):
        y = 388 - i * 34
        c.setFillColor(CARD if i % 2 == 0 else SOFT)
        c.rect(36, y - 8, 888, 30, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 9)
        c.drawString(48, y, short(u["name"]))
        c.drawRightString(410, y, eur(u["cost"]))
        c.drawRightString(520, y, eur(u["sell"]))
        c.drawRightString(700, y, eur(u["rebu"], True))
        c.setFillColor(GREEN)
        c.setFont("DejaVuBold", 9)
        c.drawRightString(900, y, eur(u["net"], True))
    c.setFillColor(COVER)
    c.rect(36, 132, 888, 24, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8.5)
    c.drawString(48, 140, "Siete coches")
    c.drawRightString(410, 140, eur(S["totals"]["cost"]))
    c.drawRightString(520, 140, eur(S["totals"]["sell"]))
    c.setFillColor(GOLD)
    c.drawRightString(900, 140, eur(S["totals"]["net"], True))
    wrap(
        c,
        "Hoy, en la web khcimport.autos, el 116d está a 12.475 € y el 318d a 17.250 €. Mil euros bajo esta tabla.",
        "DejaVu", 10, 36, 100, 888, 13, SLATE, 2,
    )
    footer(c, n, total)


def draw_program(c, n, total):
    bg(c)
    heading(c, "El programa", "Lo hemos programado nosotros. No es un programa comprado.", size=20)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 10.5)
    c.drawString(36, 430, "En la empresa se llama ERP. Es la aplicación con la que se decide, se compra y se vende. Se usa en este orden.")
    steps = [
        ("1", "Simulador", "Se mete el coche, a quién se compra y a qué precio se vendería. Devuelve el coste completo, el impuesto y lo que queda. Si no sale, no se compra."),
        ("2", "Catálogo", "1.104 versiones de 37 marcas. Cada motor está marcado: fiable, correcto, con precaución o prohibido. El prohibido no se puede dar de alta como compra."),
        ("3", "Ficha", "Si se compra, entra en la flota. Pasa de «lo estamos mirando» a «entregado». Ahí se acumulan gastos, papeles y fotos. El mismo dato en el móvil y en el ordenador."),
        ("4", "Viaje e impuesto", "Antes del billete, compara traerlo rodando o en camión. El impuesto depende de a quién se compra. Si la factura trae IVA descontable, no deja aplicar el IVA solo sobre la ganancia."),
        ("5", "Web y factura", "khcimport.autos publica ese coche. Reservado o vendido se ve el mismo día. El cliente no ve el coste ni la matrícula. La factura sale del mismo programa."),
    ]
    y = 398
    for num, title, body in steps:
        c.setFillColor(CARD)
        c.roundRect(36, y - 46, 888, 58, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 46, 3, 58, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 10)
        c.drawString(52, y - 4, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 10)
        c.drawString(72, y - 4, title)
        wrap(c, body, "DejaVu", 9, 200, y - 4, 700, 12, SLATE, 2)
        y -= 66
    footer(c, n, total)


def draw_engines(c, n, total):
    bg(c)
    heading(c, "Qué coche entra", "Primero el motor. Después el precio.", size=24)
    c.setFillColor(CARD)
    c.setStrokeColor(LINE)
    c.roundRect(36, 56, 432, 370, 3, fill=1, stroke=1)
    c.setFillColor(GREEN)
    c.rect(36, 424, 432, 2.2, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.setFont("DejaVuBold", 11)
    c.drawString(54, 396, "SE COMPRA")
    yes = [
        "Etiqueta C o ECO, libro de mantenimiento y sin golpe estructural.",
        "Diésel 2.0 de correa seca. Es el que un mecánico recomienda.",
        "Un BMW diésel solo si el motor es el posterior a la cadena que rompía.",
        "El Mercedes de la tabla: se mira el código del motor antes de transferir.",
        "Doce meses de garantía, en todas las ventas, sin excepción.",
    ]
    y = 360
    for item in yes:
        c.setFillColor(GOLD)
        c.circle(62, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 10.5, 74, y, 370, 13.5, INK, 3)
        y -= h + 10
    c.setFillColor(CARD)
    c.roundRect(492, 56, 432, 370, 3, fill=1, stroke=1)
    c.setFillColor(RED)
    c.rect(492, 424, 432, 2.2, fill=1, stroke=0)
    c.setFillColor(RED)
    c.setFont("DejaVuBold", 11)
    c.drawString(510, 396, "NO SE COMPRA")
    no = [
        "PureTech y EcoBoost de correa bañada en aceite. Rompen.",
        "El 1.2 de gasolina que bebe aceite. El diésel de Jaguar y Land Rover.",
        "El BMW de cadena antigua, hasta mediados de 2015.",
        "Diésel de antes de septiembre de 2015. Ya no entra en las zonas de bajas emisiones.",
        "El 116d de 2015 de la tabla no se paga hasta ver qué motor lleva.",
    ]
    y = 360
    for item in no:
        c.setFillColor(GOLD)
        c.circle(518, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 10.5, 530, y, 370, 13.5, INK, 3)
        y -= h + 10
    footer(c, n, total)


def draw_rule(c, n, total):
    bg(c)
    heading(c, "La regla del dinero", "Seis en el suelo. El séptimo se paga con la primera venta.", size=20)
    rules = [
        ("1", "El mes 1 se abre la nave.", "Entran 100.000 €. Se pagan seis coches y la reforma. El Mercedes, el más caro de la tabla, no se compra todavía."),
        ("2", "Ese hueco es el fondo.", "17.666 € que no salen el mes 1. No es dinero olvidado: es la compra que espera un cobro."),
        ("3", "Cuando se cobra, se compra.", "El precio de la venta no se queda en el banco. Ese mismo mes paga el siguiente coche. A partir de ahí, cada venta repone otro igual."),
        ("4", "La reforma no lleva contratista.", "4.550 € son materiales: suelo 1.800, luz 1.100, aseos 1.300 y extintores 350. La obra la hace el promotor, por su oficio de constructor."),
    ]
    y = 400
    for num, title, body in rules:
        c.setFillColor(CARD)
        c.roundRect(36, y - 64, 888, 76, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.circle(62, y - 16, 11, fill=1, stroke=0)
        c.setFillColor(COVER)
        c.setFont("DejaVuBold", 9)
        c.drawCentredString(62, y - 20, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 12)
        c.drawString(86, y - 8, title)
        wrap(c, body, "DejaVu", 10, 86, y - 28, 800, 13, SLATE, 2)
        y -= 86
    footer(c, n, total)


def waterfall(c, rows, top):
    y = top
    for name, amount, last in rows:
        c.setFillColor(COVER if last else CARD)
        c.roundRect(36, y, 888, 36, 3, fill=1, stroke=0)
        if not last:
            c.setFillColor(GOLD)
            c.rect(36, y, 3, 36, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 11)
        c.drawString(52, y + 12, name)
        c.setFont("DejaVuSerif", 12)
        c.drawRightString(908, y + 11, amount)
        y -= 42
    return y


def draw_m1(c, n, total):
    bg(c)
    heading(c, "Mes 1", "Se abre. Se compra. Todavía no se vende.", size=24)
    rows = [
        ("Capital propio", "+50.000 €", False),
        ("Financiación", "+50.000 €", False),
        ("Seis coches: GTI, 116d, Golf VIII, 318d, XC40 y Audi", "−77.714 €", False),
        ("Reforma, solo materiales", "−4.550 €", False),
        ("Nave, autónomo, portales, luz y cuota", "−2.835,06 €", False),
        ("Caja al cerrar el mes", "14.900,94 €", True),
    ]
    waterfall(c, rows, 400)
    wrap(
        c,
        "El mes cuesta 2.835,06 € venda o no venda: nave 1.100, autónomo 380, portales y gestoría 250, luz 150, cuota 955,06. El autónomo no es un sueldo. El administrador no cobra. Los 25.000 € familiares están fuera de la sociedad. El Mercedes sigue sin comprarse.",
        "DejaVu", 10, 36, 118, 888, 13, SLATE, 4,
    )
    footer(c, n, total)


def draw_m2(c, n, total):
    bg(c)
    heading(c, "Mes 2", "Se cobra el Golf GTI. Ese dinero compra el Mercedes.", size=20)
    rows = [
        ("Caja con la que se abre el mes", "14.900,94 €", False),
        ("El mes: nave, autónomo, portales, luz y cuota", "−2.835,06 €", False),
        ("Cobro del Golf GTI", "+18.500 €", False),
        ("IVA de esa ganancia, apartado", "−1.011,12 €", False),
        ("Compra del Mercedes, el que esperaba", "−17.666 €", False),
        ("Caja al cerrar el mes", "11.888,76 €", True),
    ]
    waterfall(c, rows, 400)
    wrap(
        c,
        "El precio de la venta no se ha quedado en el banco. Ha pagado el coche que faltaba. En el suelo siguen seis: salió el GTI y entró el Mercedes. La caja baja porque el fondo se ha convertido en un coche.",
        "DejaVu", 10.5, 36, 118, 888, 14, INK, 3,
    )
    footer(c, n, total)


def draw_year(c, n, total):
    bg(c)
    kicker(c, "Doce meses", 500)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 18)
    c.drawString(36, 472, "Cada venta compra el siguiente. La caja no guarda el precio.")
    c.setFillColor(INK)
    c.rect(36, 444, 888, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(44, 449, "Mes")
    c.drawString(78, 449, "Qué ocurre")
    c.drawRightString(560, 449, "Entra")
    c.drawRightString(690, 449, "Sale")
    c.drawRightString(908, 449, "Caja")
    for i, m in enumerate(S["months"]):
        y = 422 - i * 28
        if m["kind"] == "turn":
            c.setFillColor(Color(0.965, 0.945, 0.905))
        elif i % 2 == 0:
            c.setFillColor(CARD)
        else:
            c.setFillColor(SOFT)
        c.rect(36, y - 6, 888, 26, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(44, y, str(m["n"]))
        c.setFillColor(INK)
        c.setFont("DejaVu", 8)
        c.drawString(78, y, m["what"])
        c.drawRightString(560, y, eur(m["inn"]))
        c.drawRightString(690, y, eur(m["out"], True))
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 8)
        c.drawRightString(908, y, eur(m["end"], True))
    wrap(
        c,
        "En el mes 1 entra el capital, no una venta. El suelo sigue en seis: lo vendido se repone al coste de la tabla. La caja sube solo con lo que sobra del mes. Diciembre cierra con " + eur(S["months"][-1]["end"], True) + " y los mismos seis coches.",
        "DejaVu", 8, 36, 68, 888, 10.5, SLATE, 2,
    )
    footer(c, n, total)


def draw_bank(c, n, total):
    bg(c)
    heading(c, "Lo que mira quien presta", "Una venta paga el mes. Doce ventas cubren la cuota 1,72 veces.", size=18)
    cards = [
        ("2.835 €", "Sale cada mes, haya venta o no. Nave, autónomo, portales, luz y la cuota de 955,06 €."),
        ("86 €", "Lo que sobra si el coche es el Audi, el que menos deja de los siete. Cubre, y sobra poco."),
        ("946 €", "Lo que sobra con el coche medio, 3.781 €. Es la cuenta de un mes normal."),
    ]
    x = 36
    for val, lab in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 268, 286, 130, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 396, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 22)
        c.drawString(x + 14, 348, val)
        wrap(c, lab, "DejaVu", 9, x + 14, 320, 258, 12, SLATE, 4)
        x += 302
    wrap(
        c,
        "Doce ventas del coche medio, pagado el impuesto de sociedades al 15 %, dejan 1,72 veces la cuota del año. El 1,32 de las cuatro páginas es otra división: el margen partido por el mes, con la cuota redondeada a 966 € y sin quitar el impuesto. Mismo margen. El primer año de la tabla anterior tiene once ventas, porque el mes 1 es la apertura. Termina con " + eur(S["months"][-1]["end"], True) + " en el banco, y los seis coches repuestos.",
        "DejaVu", 10.5, 36, 220, 888, 14, INK, 6,
    )
    footer(c, n, total)


def draw_workshop(c, n, total):
    bg(c)
    heading(c, "El taller, dentro de la nave", "No está en los doce meses. No paga la cuota.", size=22)
    facts = [
        ("60 €", "Lo que hoy se paga a un taller de fuera por el aceite y los filtros de un coche propio. Con la nave, ese dinero se queda."),
        ("116,60 €", "El recambio, a precio cerrado: aceite Castrol 52,70 € y cuatro filtros 63,90 €. Al cliente se cobra a ese coste."),
        ("0 €", "Aceite de caja, pastillas y neumáticos. Se harán. No tienen tarifa cerrada, así que no entran en la cuenta."),
    ]
    x = 36
    for val, lab in facts:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 200, 286, 190, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 388, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 22)
        c.drawString(x + 14, 340, val)
        wrap(c, lab, "DejaVu", 10, x + 14, 300, 258, 13.5, SLATE, 6)
        x += 302
    wrap(
        c,
        "Si además se hacen dos servicios a clientes por semana, la mano de obra serían 5.760 € al año. Es una hipótesis, no una facturación. No se ha sumado a la caja de los doce meses ni al 1,72.",
        "DejaVu", 11, 36, 140, 888, 15, INK, 3,
    )
    footer(c, n, total)


def draw_risk(c, n, total):
    bg(c)
    heading(c, "Si no sale como en la tabla", "Cada desvío tiene un número. No hay que imaginarlo.", size=20)
    no_sale = r2(S["months"][0]["end"] - MONTH)
    rows = [
        ("El mes 2 tampoco se vende", eur(no_sale, True) + " en caja. El Mercedes sigue sin comprarse. El fondo aguanta."),
        ("El impuesto de sociedades es el 23 %", "La cobertura de doce ventas pasa de 1,72 a 1,58 veces. Sigue cubriendo la cuota."),
        ("El 116d y el 318d, al precio de la web", "Mil euros menos cada uno. La cobertura de doce ventas queda en 1,51 veces."),
        ("Todos los precios, un 5 % más bajos", "La cuota se paga, pero solo sobra un 6 %. No hay colchón."),
    ]
    y = 390
    for title, body in rows:
        c.setFillColor(CARD)
        c.roundRect(36, y - 36, 888, 64, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 36, 3, 64, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 12)
        c.drawString(54, y + 6, title)
        wrap(c, body, "DejaVu", 10.5, 54, y - 16, 840, 13, SLATE, 2)
        y -= 76
    footer(c, n, total)


def draw_close(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    kicker(c, "La petición", 430, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 32)
    c.drawString(36, 376, "50.000 € al lado")
    c.drawString(36, 336, "de otros 50.000 €.")
    wrap(
        c,
        "El mes 1 se abre la nave, se compran seis coches y el Mercedes espera. El mes 2, el primer cobro compra ese Mercedes. A partir de ahí, cada venta compra el siguiente. Lo que se pide es una oferta de tipo y de plazo.",
        "DejaVu", 13, 36, 286, 880, 18, Color(0.78, 0.76, 0.70), 3,
    )
    stats = [
        ("50.000 €", "Financiación"),
        ("14.900,94 €", "Caja al cerrar el mes 1"),
        ("1,72 veces", "La cuota, con doce ventas"),
    ]
    x = 36
    for val, lab in stats:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 72, 286, 78, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 16)
        c.drawString(x + 14, 110, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 8)
        c.drawString(x + 14, 90, lab.upper())
        x += 302
    footer(c, n, total, True)


def draw_sources(c, n, total):
    bg(c)
    heading(c, "De dónde sale cada cifra", "Nada de esta sala es una venta ya cobrada.", size=22)
    items = [
        "Los siete coches, la nave, la reforma y los gastos del mes: plan de viabilidad de cuatro páginas.",
        "El coste de cada coche ya incluye transporte, matriculación y puesta a punto. No se ha restado otra vez.",
        "Dejar el Mercedes sin comprar el mes 1 es la regla de esta solicitud. En las cuatro páginas se compran los siete el mismo día.",
        "El orden de las ventas es una hipótesis de trabajo: una al mes, desde el mes 2, en el orden de la tabla. No es una agenda firmada.",
        "«Se repone al mismo coste» usa el coste que ese modelo ya tiene en el plan. No se ha inventado un octavo coche.",
        "La cuota de 955,06 € es la exacta al 5,50 % y 60 meses. El plan la redondea a 966 €.",
        "El programa es el que está construido en este proyecto. La web es khcimport.autos. Los dos precios distintos son los publicados el 11 de octubre de 2026.",
        "El equipo de inspección, 822,90 €, está en otro documento. No se ha restado de estos meses.",
    ]
    y = 400
    for item in items:
        c.setFillColor(GOLD)
        c.circle(46, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 10.5, 60, y, 860, 13.5, INK, 2)
        y -= h + 8
    footer(c, n, total)


SLIDES = [
    draw_cover, draw_business, draw_method, draw_lot, draw_program, draw_engines,
    draw_rule, draw_m1, draw_m2, draw_year, draw_bank, draw_workshop, draw_risk,
    draw_close, draw_sources,
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
            goldish = r > 105 and r > b + 18 and g > 55
            if not (silver or goldish):
                px[x, y] = (0, 0, 0, 0)
    bbox = im.getbbox()
    if not bbox:
        return
    pad = 20
    x0, y0, x1, y1 = bbox
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
    im = im.resize((640, max(1, round(im.height * 640 / im.width))), Image.Resampling.LANCZOS)
    plate = Image.new("RGB", im.size, (33, 34, 40))
    plate.paste(im, mask=im.split()[-1])
    dest = HERE / "presentacion"
    dest.mkdir(exist_ok=True)
    plate.save(dest / "logo_flat.png", "PNG")


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
    lot_rows = "".join(
        f"<tr><td>{esc(short(u['name']))}</td><td class='num'>{esc(eur(u['cost']))}</td><td class='num'>{esc(eur(u['sell']))}</td><td class='num'>{esc(eur(u['net'], True))}</td></tr>"
        for u in S["lot"]
    )
    year_rows = "".join(
        f"<tr class='{m['kind']}'><td>{m['n']}</td><td>{esc(m['what'])}</td><td class='num'>{esc(eur(m['inn']))}</td><td class='num'>{esc(eur(m['out'], True))}</td><td class='num'><b>{esc(eur(m['end'], True))}</b></td></tr>"
        for m in S["months"]
    )
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Financiación 50.000 € — KHC Auto Import</title>
<style>
  :root {{ --ink:#0a1020; --gold:#b3934e; --ivory:#f7f6f2; --cover:#212228; --slate:#4a5872; --line:#e4dfd4; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--cover); color:var(--ink); font-family:"Segoe UI", Helvetica, Arial, sans-serif; }}
  .slide {{ display:none; min-height:100vh; padding:6vh 7vw 8vh; flex-direction:column; background:var(--ivory); }}
  .slide.active {{ display:flex; }}
  .dark {{ background:var(--cover); color:#f4f1ea; }}
  .kicker {{ letter-spacing:.14em; font-size:12px; font-weight:700; color:var(--gold); margin:0 0 8px; }}
  h1 {{ font-family:Georgia, serif; font-weight:500; font-size:clamp(26px, 3.4vw, 42px); line-height:1.08; margin:0 0 14px; max-width:24ch; }}
  p {{ font-size:17px; line-height:1.45; max-width:70ch; }}
  .muted {{ color:var(--slate); }}
  .dark p {{ color:#cfc8ba; }}
  .grid {{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }}
  .grid3 {{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }}
  article, .stat {{ background:#fff; border-top:3px solid var(--gold); border-radius:8px; padding:14px 16px; }}
  .dark .stat {{ background:#2a2b32; }}
  article b, .stat b {{ display:block; font-family:Georgia, serif; font-size:26px; font-weight:500; margin-bottom:6px; }}
  .line {{ display:flex; justify-content:space-between; gap:12px; background:#fff; border-left:3px solid var(--gold); padding:10px 14px; margin:6px 0; }}
  .line.total {{ background:#212228; color:#f4f1ea; }}
  .line.total b {{ color:#b3934e; }}
  table {{ width:100%; border-collapse:collapse; font-size:14px; }}
  th {{ text-align:left; background:var(--ink); color:#fff; padding:7px 8px; font-size:12px; }}
  td {{ padding:6px 8px; border-bottom:1px solid var(--line); }}
  tr.turn td {{ background:#f6efe2; }}
  .num {{ text-align:right; font-variant-numeric:tabular-nums; }}
  ol {{ margin:8px 0 0; padding-left:20px; }}
  li {{ margin:0 0 8px; line-height:1.4; }}
  .logo {{ width:150px; margin-bottom:10px; }}
  footer {{ margin-top:auto; display:flex; justify-content:space-between; padding-top:16px; color:var(--gold); font-size:12px; letter-spacing:.08em; }}
  .bar {{ position:fixed; left:0; top:0; height:3px; background:var(--gold); }}
  .hint {{ position:fixed; right:14px; bottom:10px; color:#8a8172; font-size:12px; }}
</style>
</head>
<body>
<div class="bar" id="bar"></div>
<section class="slide dark">
  <img class="logo" src="logo_flat.png" alt="KHC">
  <p class="kicker">Solicitud de financiación</p>
  <h1>50.000 € para abrir la nave y poner el stock en marcha.</h1>
  <p>Otros 50.000 € son capital propio. Santiago de Compostela. El día que entra el dinero se abre la nave y el stock empieza a rotar.</p>
  <div class="grid3">
    <div class="stat"><b>50.000 €</b><span>Lo que se pide</span></div>
    <div class="stat"><b>50.000 €</b><span>Capital propio, al lado</span></div>
    <div class="stat"><b>12 meses</b><span>El primer año, con cada venta</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>01</span></footer>
</section>
<section class="slide">
  <p class="kicker">Qué es la empresa</p>
  <h1>Se venden coches seleccionados. No se vende una importación.</h1>
  <div class="line"><span><b>El producto.</b> Nacionales o traídos de fuera. Se compra donde el número cierra.</span></div>
  <div class="line"><span><b>El cliente.</b> Galicia. El precio del plan cae entre 13.000 y 24.000 €.</span></div>
  <div class="line"><span><b>La promesa.</b> Doce meses de garantía, por escrito. Sin historial, no se paga el coche.</span></div>
  <div class="line"><span><b>El local.</b> Nave de 550 m² en San Marcos, Santiago. La licencia ya existe. Se abre con el dinero.</span></div>
  <footer><span>KHC AUTO IMPORT</span><span>02</span></footer>
</section>
<section class="slide">
  <p class="kicker">Cómo se gana un coche</p>
  <h1>Cuatro restas. Siempre las mismas.</h1>
  <div class="grid">
    <article><b>{esc(eur(S['totals']['cost']/7))}</b><p class="muted">Coste medio. Transporte y matriculación ya dentro.</p></article>
    <article><b>{esc(eur(S['totals']['sell']/7))}</b><p class="muted">Venta media. El detalle, en la lámina siguiente.</p></article>
    <article><b>{esc(eur(S['totals']['rebu']/7))}</b><p class="muted">IVA solo sobre la ganancia. En un usado se llama REBU.</p></article>
    <article><b>3.781 €</b><p class="muted">Lo que queda, de media. Venta menos coste menos ese IVA.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>03</span></footer>
</section>
<section class="slide">
  <p class="kicker">Los siete coches del plan</p>
  <h1>Esto es el stock.</h1>
  <table><thead><tr><th>Coche</th><th>Coste</th><th>Venta</th><th>Quedan</th></tr></thead><tbody>{lot_rows}</tbody></table>
  <p class="muted">En la web, el 116d está a 12.475 € y el 318d a 17.250 €. Mil euros bajo esta tabla.</p>
  <footer><span>KHC AUTO IMPORT</span><span>04</span></footer>
</section>
<section class="slide">
  <p class="kicker">El programa</p>
  <h1>Lo hemos programado nosotros.</h1>
  <p class="muted">No es un programa comprado. En la empresa se llama ERP. Se usa en este orden.</p>
  <ol>
    <li><b>Simulador.</b> Coche, vendedor y precio de venta. Devuelve el coste, el impuesto y lo que queda. Si no sale, no se compra.</li>
    <li><b>Catálogo.</b> 1.104 versiones de 37 marcas. El motor prohibido no se puede dar de alta como compra.</li>
    <li><b>Ficha.</b> De «lo estamos mirando» a «entregado». Gastos, papeles y fotos, en el móvil y en el ordenador.</li>
    <li><b>Viaje e impuesto.</b> Rodando o en camión, antes del billete. Si la factura trae IVA descontable, no deja aplicar el IVA solo sobre la ganancia.</li>
    <li><b>Web y factura.</b> khcimport.autos publica el coche. Reservado o vendido se ve el mismo día. El cliente no ve el coste.</li>
  </ol>
  <footer><span>KHC AUTO IMPORT</span><span>05</span></footer>
</section>
<section class="slide">
  <p class="kicker">Qué coche entra</p>
  <h1>Primero el motor. Después el precio.</h1>
  <div class="grid">
    <article><b>Se compra</b><p>Etiqueta C o ECO, libro de mantenimiento, diésel 2.0 de correa seca. Un BMW diésel solo si el motor es el posterior a la cadena que rompía. Garantía de 12 meses.</p></article>
    <article><b>No se compra</b><p>PureTech, EcoBoost de correa bañada, el 1.2 que bebe aceite, el diésel de Jaguar y Land Rover, el BMW de cadena antigua. El 116d de 2015 de la tabla no se paga hasta ver el motor.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>06</span></footer>
</section>
<section class="slide">
  <p class="kicker">La regla del dinero</p>
  <h1>Seis en el suelo. El séptimo se paga con la primera venta.</h1>
  <div class="line"><span><b>Mes 1.</b> Se abre la nave. Se pagan seis coches y la reforma. El Mercedes no se compra.</span></div>
  <div class="line"><span><b>El fondo.</b> Esos 17.666 € no están olvidados. Son la compra que espera un cobro.</span></div>
  <div class="line"><span><b>Cuando se cobra.</b> El precio no se queda en el banco. Ese mes compra el siguiente. Después, cada venta repone otro igual.</span></div>
  <div class="line"><span><b>La reforma.</b> 4.550 € de materiales: suelo 1.800, luz 1.100, aseos 1.300 y extintores 350. La obra la hace el promotor.</span></div>
  <footer><span>KHC AUTO IMPORT</span><span>07</span></footer>
</section>
<section class="slide">
  <p class="kicker">Mes 1</p>
  <h1>Se abre. Se compra. Todavía no se vende.</h1>
  <div class="line"><span>Capital propio</span><b>+50.000 €</b></div>
  <div class="line"><span>Financiación</span><b>+50.000 €</b></div>
  <div class="line"><span>Seis coches</span><b>−77.714 €</b></div>
  <div class="line"><span>Reforma, materiales</span><b>−4.550 €</b></div>
  <div class="line"><span>El mes</span><b>−2.835,06 €</b></div>
  <div class="line total"><span>Caja</span><b>14.900,94 €</b></div>
  <p class="muted">El mes: nave 1.100, autónomo 380, portales 250, luz 150, cuota 955,06. El autónomo no es un sueldo.</p>
  <footer><span>KHC AUTO IMPORT</span><span>08</span></footer>
</section>
<section class="slide">
  <p class="kicker">Mes 2</p>
  <h1>Se cobra el Golf GTI. Ese dinero compra el Mercedes.</h1>
  <div class="line"><span>Caja de apertura del mes</span><b>14.900,94 €</b></div>
  <div class="line"><span>El mes</span><b>−2.835,06 €</b></div>
  <div class="line"><span>Cobro del GTI</span><b>+18.500 €</b></div>
  <div class="line"><span>IVA de esa ganancia</span><b>−1.011,12 €</b></div>
  <div class="line"><span>Compra del Mercedes</span><b>−17.666 €</b></div>
  <div class="line total"><span>Caja</span><b>11.888,76 €</b></div>
  <p class="muted">El precio no se ha quedado en el banco. Ha pagado el coche que faltaba. La caja baja porque el fondo se ha convertido en un coche.</p>
  <footer><span>KHC AUTO IMPORT</span><span>09</span></footer>
</section>
<section class="slide">
  <p class="kicker">Doce meses</p>
  <h1>Cada venta compra el siguiente.</h1>
  <table><thead><tr><th>Mes</th><th>Qué ocurre</th><th>Entra</th><th>Sale</th><th>Caja</th></tr></thead><tbody>{year_rows}</tbody></table>
  <p class="muted">En el mes 1 entra el capital, no una venta. El suelo sigue en seis. Diciembre cierra con {esc(eur(S['months'][-1]['end'], True))} y los mismos seis coches.</p>
  <footer><span>KHC AUTO IMPORT</span><span>10</span></footer>
</section>
<section class="slide">
  <p class="kicker">Lo que mira quien presta</p>
  <h1>Una venta paga el mes. Doce cubren la cuota 1,72 veces.</h1>
  <div class="grid3">
    <article><b>2.835 €</b><p class="muted">Sale cada mes, haya venta o no.</p></article>
    <article><b>86 €</b><p class="muted">Lo que sobra con el Audi, el que menos deja. Cubre, y sobra poco.</p></article>
    <article><b>946 €</b><p class="muted">Lo que sobra con el coche medio.</p></article>
  </div>
  <p class="muted">El 1,32 de las cuatro páginas no quita el impuesto y redondea la cuota. El primer año de la tabla tiene once ventas, porque el mes 1 es la apertura. Termina con {esc(eur(S['months'][-1]['end'], True))}.</p>
  <footer><span>KHC AUTO IMPORT</span><span>11</span></footer>
</section>
<section class="slide">
  <p class="kicker">El taller</p>
  <h1>No está en los doce meses. No paga la cuota.</h1>
  <div class="grid3">
    <article><b>60 €</b><p class="muted">Mano de obra que hoy sale a un taller de fuera, por coche propio.</p></article>
    <article><b>116,60 €</b><p class="muted">Aceite y cuatro filtros, a precio cerrado. Al cliente, a ese coste.</p></article>
    <article><b>0 €</b><p class="muted">Caja, pastillas y neumáticos. Sin tarifa, no entran.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>12</span></footer>
</section>
<section class="slide">
  <p class="kicker">Si no sale como en la tabla</p>
  <h1>Cada desvío tiene un número.</h1>
  <div class="line"><span>El mes 2 tampoco se vende</span><b>{esc(eur(S['months'][0]['end']-MONTH, True))}</b></div>
  <div class="line"><span>Impuesto al 23 %</span><b>1,58 veces</b></div>
  <div class="line"><span>116d y 318d al precio de la web</span><b>1,51 veces</b></div>
  <div class="line"><span>Todos los precios, un 5 % más bajos. La cuota se paga, pero solo sobra un 6 %.</span><b>1,06 veces</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>13</span></footer>
</section>
<section class="slide dark">
  <p class="kicker">La petición</p>
  <h1>50.000 € al lado de otros 50.000 €.</h1>
  <p>El mes 1 se abre la nave y se compran seis coches. El mes 2, el primer cobro compra el Mercedes. Después, cada venta compra el siguiente. Lo que se pide es una oferta de tipo y de plazo.</p>
  <div class="grid3">
    <div class="stat"><b>50.000 €</b><span>Financiación</span></div>
    <div class="stat"><b>14.900,94 €</b><span>Caja al cerrar el mes 1</span></div>
    <div class="stat"><b>1,72 veces</b><span>La cuota, con doce ventas</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>14</span></footer>
</section>
<section class="slide">
  <p class="kicker">De dónde sale cada cifra</p>
  <h1>Nada de esta sala es una venta ya cobrada.</h1>
  <ul>
    <li>Coches, nave, reforma y gastos: plan de viabilidad de cuatro páginas.</li>
    <li>Dejar el Mercedes para el mes 2 es la regla de esta solicitud. En las cuatro páginas se compran los siete el día 1.</li>
    <li>El orden de las ventas es hipótesis: una al mes, desde el mes 2. «Otro igual» usa el coste ya cerrado. No hay un octavo coche inventado.</li>
    <li>El programa es el de este proyecto. La web es khcimport.autos.</li>
  </ul>
  <footer><span>KHC AUTO IMPORT</span><span>15</span></footer>
</section>
<div class="hint">Flechas · F pantalla completa</div>
<script>
  const slides = [...document.querySelectorAll('.slide')];
  let i = 0;
  const bar = document.getElementById('bar');
  function show(n) {{
    i = Math.max(0, Math.min(slides.length-1, n));
    slides.forEach((s,k) => s.classList.toggle('active', k===i));
    bar.style.width = ((i+1)/slides.length*100)+'%';
  }}
  addEventListener('keydown', e => {{
    if (['ArrowRight','PageDown',' '].includes(e.key)) {{ e.preventDefault(); show(i+1); }}
    if (['ArrowLeft','PageUp','Backspace'].includes(e.key)) {{ e.preventDefault(); show(i-1); }}
    if (e.key==='f' || e.key==='F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  }});
  addEventListener('click', e => show(e.clientX > innerWidth*0.25 ? i+1 : i-1));
  show(0);
</script>
</body>
</html>
"""
    OUT_HTML.write_text(html, encoding="utf-8")


def main():
    flatten_logo()
    write_pdf()
    write_html()
    print("months", len(S["months"]), "end", S["months"][-1]["end"])
    for m in S["months"]:
        print(m["n"], m["what"], m["end"])
    print(OUT_PDF, "slides", len(SLIDES))


if __name__ == "__main__":
    main()

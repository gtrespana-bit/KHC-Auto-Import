#!/usr/bin/env python3
"""Solicitud de 50.000 €. El primer año, mes a mes, con gráficos.

El fondo son tres meses de gastos. Cada venta compra el siguiente coche.
Si la caja supera el fondo en el coste de un coche del plan, se compra
el más barato que quepa, al coste ya cerrado. No se inventa un modelo.
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
GREEN_SOFT = Color(0.86, 0.93, 0.89)
RED = Color(0.549, 0.227, 0.227)
COVER = Color(33 / 255, 34 / 255, 40 / 255)
CARD = Color(1, 1, 1)
LINE = Color(0.855, 0.835, 0.788)
SOFT = Color(0.955, 0.949, 0.935)
GRID = Color(0.91, 0.89, 0.85)
MONTH = 2835.06
REFORM = 4550.0
KIT = 822.90
RENT, RETA, MKT, UTIL = 1100.0, 380.0, 250.0, 150.0
QUOTA = 955.06
STRUCT = 1880.0


def r2(n):
    return round(float(n) + 1e-9, 2)


def eur(n, cents=False):
    n = float(n)
    neg = n < 0
    d = 2 if cents or abs(n - round(n)) > 0.001 else 0
    s = f"{abs(n):,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if neg else "") + s + " €"


def k(n):
    """Etiqueta corta de eje, sin céntimos."""
    n = float(n)
    s = f"{abs(n):,.0f}".replace(",", ".")
    return ("−" if n < 0 else "") + s


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


def nick(name):
    s = short(name)
    for cut in (" 2015", " 2018", " 2019", " 2020", " 2021", " Estate"):
        s = s.replace(cut, "")
    return s.strip()


def simulate():
    lot = [dict(u) for u in MODEL["lot"]]
    held = max(lot, key=lambda u: u["cost"])
    opening = [u for u in lot if u["name"] != held["name"]]
    models = sorted(lot, key=lambda u: (u["cost"], u["name"]))
    floor = r2(MONTH * 3)
    six = r2(sum(u["cost"] for u in opening))
    cash = r2(100000 - six - REFORM - KIT - MONTH)
    stock = [dict(u) for u in opening]
    waiting = False
    months = [{
        "n": 1,
        "what": "Apertura. Equipo, seis coches y reforma. Sin venta.",
        "sold": None,
        "cobro": 100000.0,
        "gastos": r2(MONTH + REFORM + KIT),
        "iva": 0.0,
        "compra": six,
        "margen": 0.0,
        "sobra": r2(-MONTH),
        "end": cash,
        "stock": 6,
        "kind": "open",
        "buys": [nick(u["name"]) for u in opening],
    }]
    for n in range(2, 13):
        cash = r2(cash - MONTH)
        car = stock.pop(0)
        cash = r2(cash + car["sell"] - car["rebu"])
        buys = []
        compra = 0.0
        if not waiting and r2(cash - floor) >= held["cost"]:
            cash = r2(cash - held["cost"])
            stock.append(dict(held))
            waiting = True
            buys.append(nick(held["name"]))
            compra = held["cost"]
            what = f"Venta del {nick(car['name'])}. Compra del Mercedes."
            kind = "turn"
        else:
            cash = r2(cash - car["cost"])
            stock.append(dict(car))
            buys.append(nick(car["name"]))
            compra = car["cost"]
            what = f"Venta del {nick(car['name'])}. Se repone."
            kind = "roll"
        while True:
            room = r2(cash - floor)
            fits = [u for u in models if u["cost"] <= room + 1e-6]
            if not fits:
                break
            nxt = fits[0]
            cash = r2(cash - nxt["cost"])
            stock.append(dict(nxt))
            buys.append(nick(nxt["name"]) + " extra")
            compra = r2(compra + nxt["cost"])
            what = f"Venta del {nick(car['name'])}. Reposición y otro 116d."
            kind = "extra"
        months.append({
            "n": n,
            "what": what,
            "sold": nick(car["name"]),
            "cobro": car["sell"],
            "gastos": MONTH,
            "iva": car["rebu"],
            "compra": compra,
            "margen": car["net"],
            "sobra": r2(car["net"] - MONTH),
            "end": cash,
            "stock": len(stock),
            "kind": kind,
            "buys": buys,
        })
    nets = [m["margen"] for m in months if m["n"] > 1]
    sales = r2(sum(m["cobro"] for m in months if m["n"] > 1))
    purchases = r2(sum(m["compra"] for m in months))
    gastos = r2(sum(m["gastos"] for m in months))
    iva = r2(sum(m["iva"] for m in months))
    ebitda = r2(sum(nets) - STRUCT * 12 - KIT)
    interest = MODEL["loan"]["y1_interest"]
    taxable = r2(ebitda - interest)
    tax = r2(max(0.0, taxable) * 0.15)
    service = MODEL["loan"]["y1_service"]
    dscr = r2((ebitda - tax) / service)
    extra = next(m for m in months if m["kind"] == "extra")
    identity = r2(100000 + sales - purchases - gastos - iva)
    assert months[0]["end"] == r2(100000 - six - REFORM - KIT - MONTH)
    assert months[1]["kind"] == "turn"
    assert months[-1]["stock"] == 7
    assert identity == months[-1]["end"]
    assert min(m["end"] for m in months) >= floor - 0.01
    return {
        "lot": lot,
        "held": held,
        "opening": opening,
        "months": months,
        "floor": floor,
        "sales": sales,
        "purchases": purchases,
        "gastos": gastos,
        "iva": iva,
        "nets": r2(sum(nets)),
        "ebitda": ebitda,
        "tax": tax,
        "free": r2(months[-1]["end"] - tax),
        "dscr": dscr,
        "dscr_txt": f"{dscr:.2f}".replace(".", ","),
        "extra_n": extra["n"],
        "kit": KIT,
        "interest": interest,
        "principal": MODEL["loan"]["y1_principal"],
        "balance": MODEL["loan"]["y1_balance"],
        "service": service,
        "thin": min(lot, key=lambda u: u["net"]),
        "totals": MODEL["totals"],
    }


S = simulate()


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
    c.drawCentredString(W / 2, 18, "Solicitud de financiación  ·  50.000 €  ·  primer año")
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
    c.drawString(36, y - 32, text)
    return y - 32


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
    c.drawString(36, 234, "El primer año está cerrado mes a mes: gastos, ventas y compras.")
    stats = [
        ("50.000 €", "Lo que se pide"),
        ("50.000 €", "Capital propio, al lado"),
        ("12 meses", "Plan cerrado, con gráficos"),
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
        ("2", "Venta", eur(t["sell"] / 7), "El precio al que sale. La media de los siete. El detalle, en la lámina siguiente."),
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
    wrap(c, "Es la media de los siete. La lámina siguiente los pone uno a uno, con su coste y su venta.", "DejaVu", 11, 36, 128, 888, 15, INK, 2)
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
        "Hoy, en la web khcimport.autos, el 116d está a 12.475 € y el 318d a 17.250 €. Mil euros bajo esta tabla. El efecto está en la lámina de desvíos, con su número.",
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
        ("1", "Simulador", "Se mete el coche, a quién se compra y a qué precio se vendería. Devuelve el coste, el impuesto y lo que queda. Si no sale, no se compra."),
        ("2", "Catálogo", "1.104 versiones de 37 marcas. Cada motor está marcado: fiable, correcto, con precaución o prohibido. El prohibido no se da de alta."),
        ("3", "Ficha", "Si se compra, entra en la flota. De «lo estamos mirando» a «entregado». Gastos, papeles y fotos, en el móvil y en el ordenador."),
        ("4", "Viaje e impuesto", "Antes del billete, compara traerlo rodando o en camión. Si la factura trae IVA descontable, no deja aplicar el IVA solo sobre la ganancia."),
        ("5", "Web y factura", "khcimport.autos publica ese coche. Reservado o vendido se ve el mismo día. El cliente no ve el coste. La factura sale del mismo programa."),
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
    c.roundRect(36, 148, 432, 278, 3, fill=1, stroke=1)
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
    y = 362
    for item in yes:
        c.setFillColor(GOLD)
        c.circle(62, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 10.5, 74, y, 370, 13.5, INK, 2)
        y -= h + 8
    c.setFillColor(CARD)
    c.roundRect(492, 148, 432, 278, 3, fill=1, stroke=1)
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
    y = 362
    for item in no:
        c.setFillColor(GOLD)
        c.circle(518, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 10.5, 530, y, 370, 13.5, INK, 2)
        y -= h + 8
    footer(c, n, total)


def draw_expenses(c, n, total):
    bg(c)
    heading(c, "Todos los gastos", "Cinco partidas cada mes. Ninguna está escondida en un total.", size=18)
    lines = [
        ("Nave, San Marcos", RENT, "Alquiler. La licencia ya existe."),
        ("Autónomo del administrador", RETA, "Seguridad Social. No es un sueldo."),
        ("Portales y gestoría", MKT, "Coches.net, Milanuncios Pro y la gestoría."),
        ("Luz, agua y vado", UTIL, "Suministros de la nave."),
        ("Cuota del préstamo", QUOTA, "50.000 €, 5,50 %, 60 meses. Exacta, no los 966 € del plan."),
    ]
    maxv = RENT
    y = 408
    for name, val, note in lines:
        c.setFillColor(GOLD)
        c.roundRect(250, y - 2, 280 * (val / maxv), 14, 2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 10)
        c.drawString(36, y, name)
        c.setFont("DejaVuBold", 10)
        c.drawRightString(620, y, eur(val, True))
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8.5)
        c.drawString(636, y, note)
        y -= 36
    c.setFillColor(COVER)
    c.roundRect(36, y - 8, 888, 28, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 10)
    c.drawString(48, y, "Cada mes, haya venta o no")
    c.setFillColor(GOLD)
    c.drawRightString(908, y, eur(MONTH, True))
    wrap(
        c,
        "De la cuota, en el primer año, 2.527,03 € son intereses y 8.933,69 € reducen la deuda. Al cerrar se deben 41.066,31 €. El mes 1, antes de comprar, suma el equipo de revisión, 822,90 €: sin él no se mira un coche. Y la reforma: suelo 1.800, luz 1.100, aseos 1.300 y extintores 350. La obra la hace el promotor.",
        "DejaVu", 9.5, 36, y - 28, 888, 12.5, INK, 3,
    )
    wrap(
        c,
        "No está, y se dice para que no parezca un olvido: sueldo (los 25.000 € familiares están fuera de la sociedad), taller (aceite y filtros 116,60 € a precio cerrado, sin tarifa de mano de obra) y la cuota de una SGR, 1.000 € en el modelo, solo si el aval es de una SGR, y se recupera al cancelar.",
        "DejaVu", 9, 36, 148, 888, 11.5, SLATE, 3,
    )
    footer(c, n, total)


def draw_rule(c, n, total):
    bg(c)
    heading(c, "La regla del año", "Se vende, se compra. Si la caja pasa del fondo, se compra más.", size=18)
    rules = [
        ("1", "El mes 1 caben seis.", "Lo primero es el equipo de revisión, 822,90 €. Sin él no se compra. Después, seis coches y la reforma. El Mercedes no cabe sin bajar del fondo."),
        ("2", "El fondo son tres meses.", eur(S["floor"], True) + ". Es 2.835,06 € × 3. Por debajo de esa cifra no se compra un coche."),
        ("3", "La venta compra en el mismo mes.", "El primer cobro compra el Mercedes. A partir de ahí, cada venta repone ese modelo, al coste que ya tiene en la tabla."),
        ("4", "Lo que sobra también compra.", "Si después de reponer la caja supera el fondo en el coste de un coche del plan, se compra el más barato que quepa. En este año ocurre una vez: otro 116d, el mes " + str(S["extra_n"]) + ", a 9.010 €. No es un modelo nuevo."),
    ]
    y = 400
    for num, title, body in rules:
        c.setFillColor(CARD)
        c.roundRect(36, y - 58, 888, 70, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.circle(62, y - 14, 11, fill=1, stroke=0)
        c.setFillColor(COVER)
        c.setFont("DejaVuBold", 9)
        c.drawCentredString(62, y - 18, num)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 12)
        c.drawString(86, y - 6, title)
        wrap(c, body, "DejaVu", 10, 86, y - 26, 810, 13, SLATE, 2)
        y -= 80
    footer(c, n, total)


def waterfall(c, rows, top):
    y = top
    for name, amount, last in rows:
        c.setFillColor(COVER if last else CARD)
        c.roundRect(36, y, 888, 34, 3, fill=1, stroke=0)
        if not last:
            c.setFillColor(GOLD)
            c.rect(36, y, 3, 34, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 11)
        c.drawString(52, y + 11, name)
        c.setFont("DejaVuSerif", 12)
        c.drawRightString(908, y + 10, amount)
        y -= 40
    return y


def draw_m1(c, n, total):
    bg(c)
    heading(c, "Mes 1", "Primero el equipo. Después los coches. Todavía no se vende.", size=18)
    room = r2(S["months"][0]["end"] - S["floor"])
    rows = [
        ("Capital propio", "+50.000 €", False),
        ("Financiación", "+50.000 €", False),
        ("Equipo de revisión, antes de comprar", "−822,90 €", False),
        ("Seis coches: GTI, 116d, Golf VIII, 318d, XC40 y Audi", "−77.714 €", False),
        ("Reforma, solo materiales. La obra la hace el promotor.", "−4.550 €", False),
        ("El mes: nave, autónomo, portales, luz y cuota", "−2.835,06 €", False),
        ("Caja al cerrar el mes. El Mercedes sigue fuera.", eur(S["months"][0]["end"], True), True),
    ]
    waterfall(c, rows, 416)
    wrap(
        c,
        "Diagnosis 368,40, medidor 50,39, arrancador 57,39, diez informes 145,08, imagen y entrega 136,64, línea y gestoría 65,00. Sin eso no se revisa un coche, así que sale antes de pagar el primero. Por encima del fondo quedan " + eur(room, True) + ". No llegan para el Mercedes ni para el 116d.",
        "DejaVu", 10, 36, 108, 888, 13, INK, 3,
    )
    footer(c, n, total)


def draw_m2(c, n, total):
    bg(c)
    heading(c, "Mes 2", "Se cobra el Golf GTI. Ese dinero compra el Mercedes.", size=20)
    rows = [
        ("Caja con la que se abre el mes", eur(S["months"][0]["end"], True), False),
        ("El mes: nave, autónomo, portales, luz y cuota", "−2.835,06 €", False),
        ("Cobro del Golf GTI", "+18.500 €", False),
        ("IVA de esa ganancia, apartado", "−1.011,12 €", False),
        ("Compra del Mercedes, el que esperaba", "−17.666 €", False),
        ("Caja al cerrar el mes", eur(S["months"][1]["end"], True), True),
    ]
    waterfall(c, rows, 408)
    wrap(
        c,
        "El precio no se ha quedado en el banco. Ha pagado el coche que faltaba. En el suelo siguen seis: salió el GTI y entró el Mercedes. La caja baja porque el fondo se ha convertido en un coche. Lo que sobra del mes, después del gasto, son 1.979,82 €.",
        "DejaVu", 10.5, 36, 128, 888, 14, INK, 3,
    )
    footer(c, n, total)


def plot_frame(c, x, y, w, h, ymin, ymax, ticks):
    c.setFillColor(CARD)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    c.setFont("DejaVu", 7.5)
    for t in ticks:
        yy = y + 28 + (t - ymin) / (ymax - ymin) * (h - 46)
        c.setStrokeColor(GRID)
        c.setDash(1, 2)
        c.line(x + 46, yy, x + w - 14, yy)
        c.setDash()
        c.setFillColor(SLATE)
        c.drawRightString(x + 40, yy - 3, k(t))
    return x + 46, y + 28, w - 60, h - 46


def slot_x(inner_x, inner_w, i, n=12):
    return inner_x + (i + 0.5) * inner_w / n


def draw_gains(c, n, total):
    bg(c)
    heading(c, "Ganancia y gasto, mes a mes", "La barra verde deja más que la dorada. En los once meses con venta.", size=16)
    x, y, w, h = 36, 78, 888, 340
    ix, iy, iw, ih = plot_frame(c, x, y, w, h, 0, 6000, [0, 2000, 4000, 6000])
    bw = 14
    for i, m in enumerate(S["months"]):
        cx = slot_x(ix, iw, i)
        gold_h = MONTH / 6000 * ih
        c.setFillColor(GOLD)
        c.rect(cx - bw - 1, iy, bw, gold_h, fill=1, stroke=0)
        if m["n"] > 1:
            gh = m["margen"] / 6000 * ih
            c.setFillColor(GREEN)
            c.rect(cx + 1, iy, bw, gh, fill=1, stroke=0)
            c.setFillColor(INK)
            c.setFont("DejaVuBold", 6.5)
            c.drawCentredString(cx + 1 + bw / 2, iy + gh + 4, k(m["margen"]))
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 7.5)
        c.drawCentredString(cx, iy - 14, str(m["n"]))
    c.setFillColor(GOLD)
    c.rect(48, 58, 10, 8, fill=1, stroke=0)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8)
    c.drawString(62, 58, "Gasto del mes, 2.835 €")
    c.setFillColor(GREEN)
    c.rect(230, 58, 10, 8, fill=1, stroke=0)
    c.setFillColor(SLATE)
    c.drawString(244, 58, "Margen. Equipo y reforma del mes 1 están en la tabla, no en la barra. El Audi supera el gasto en 86 €.")
    footer(c, n, total)


def draw_cash_chart(c, n, total):
    bg(c)
    heading(c, "La caja del año", "Sube con lo que sobra. Baja cuando se compra.", size=20)
    x, y, w, h = 36, 86, 888, 332
    ix, iy, iw, ih = plot_frame(c, x, y, w, h, 0, 20000, [0, 5000, 10000, 15000, 20000])
    def py(val):
        return iy + val / 20000 * ih
    fy = py(S["floor"])
    c.setStrokeColor(GOLD)
    c.setDash(3, 2)
    c.setLineWidth(1.2)
    c.line(ix, fy, ix + iw, fy)
    c.setDash()
    pts = [(slot_x(ix, iw, i), py(m["end"])) for i, m in enumerate(S["months"])]
    c.setStrokeColor(GREEN)
    c.setFillColor(GREEN_SOFT)
    c.setLineWidth(2)
    p = c.beginPath()
    p.moveTo(pts[0][0], iy)
    for px, py_ in pts:
        p.lineTo(px, py_)
    p.lineTo(pts[-1][0], iy)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(INK)
    c.setLineWidth(1.8)
    path = c.beginPath()
    path.moveTo(pts[0][0], pts[0][1])
    for px, py_ in pts[1:]:
        path.lineTo(px, py_)
    c.drawPath(path, stroke=1, fill=0)
    for i, m in enumerate(S["months"]):
        px, py_ = pts[i]
        c.setFillColor(GOLD if m["kind"] in ("turn", "extra") else INK)
        c.circle(px, py_, 3.4, fill=1, stroke=0)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 7.5)
        c.drawCentredString(px, iy - 14, str(m["n"]))
    labels = {1: (0, 12), 2: (0, -16), S["extra_n"] - 1: (0, 12), S["extra_n"]: (0, -18), 12: (0, 12)}
    for i, m in enumerate(S["months"]):
        if m["n"] not in labels:
            continue
        dx, dy = labels[m["n"]]
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 7.5)
        c.drawCentredString(pts[i][0] + dx, pts[i][1] + dy, eur(m["end"]))
    fund = "Fondo  " + eur(S["floor"])
    c.setFont("DejaVuBold", 8)
    tw = c.stringWidth(fund, "DejaVuBold", 8)
    c.setFillColor(WHITE)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.roundRect(ix + 10, fy - 22, tw + 12, 15, 2, fill=1, stroke=1)
    c.setFillColor(GOLD_DEEP)
    c.drawString(ix + 16, fy - 18, fund)
    c.setFillColor(INK)
    c.setFont("DejaVu", 8.5)
    c.drawString(48, 62, "Mes 2: compra del Mercedes, 17.666 €.   Mes " + str(S["extra_n"]) + ": otro 116d, 9.010 €, el coste de la tabla.   Mes 12: " + eur(S["months"][-1]["end"], True) + " y siete coches.")
    footer(c, n, total)


def draw_ledger(c, n, total):
    bg(c)
    kicker(c, "El primer año", 508)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 16)
    c.drawString(36, 484, "Cada mes: qué se cobra, qué se gasta, qué se compra, qué queda.")
    c.setFillColor(INK)
    c.rect(28, 460, 904, 16, fill=1, stroke=0)
    heads = [
        (36, "Mes", "l"),
        (68, "Qué ocurre", "l"),
        (360, "Cobro", "r"),
        (448, "Gastos", "r"),
        (530, "IVA", "r"),
        (628, "Compra", "r"),
        (724, "Sobra", "r"),
        (912, "Caja", "r"),
    ]
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7)
    for x, lab, al in heads:
        if al == "r":
            c.drawRightString(x, 464, lab)
        else:
            c.drawString(x, 464, lab)
    for i, m in enumerate(S["months"]):
        y = 438 - i * 30
        if m["kind"] == "extra":
            c.setFillColor(Color(0.90, 0.95, 0.91))
        elif m["kind"] == "turn":
            c.setFillColor(Color(0.965, 0.945, 0.905))
        elif i % 2 == 0:
            c.setFillColor(CARD)
        else:
            c.setFillColor(SOFT)
        c.rect(28, y - 8, 904, 28, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(36, y, str(m["n"]))
        c.setFillColor(INK)
        c.setFont("DejaVu", 7.5)
        c.drawString(68, y, m["what"])
        c.drawRightString(360, y, eur(m["cobro"]))
        c.drawRightString(448, y, eur(m["gastos"], True))
        c.drawRightString(530, y, "—" if m["n"] == 1 else eur(m["iva"], True))
        c.drawRightString(628, y, eur(m["compra"]))
        c.setFillColor(GREEN if m["sobra"] > 0 else SLATE)
        c.setFont("DejaVuBold", 7.5)
        c.drawRightString(724, y, eur(m["sobra"], True))
        c.setFillColor(INK)
        c.drawRightString(912, y, eur(m["end"], True))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7.5)
    c.drawString(36, 52, "La caja es la del mes anterior, más el cobro, menos gastos, IVA y compra. Sobra es el margen menos el mes: no incluye la compra. El mes 1, cobro es el capital.")
    footer(c, n, total)


def draw_year(c, n, total):
    bg(c)
    heading(c, "El año, en una cuenta", "Once ventas. Siete coches al cerrar. La cuota, pagada.", size=18)
    rows = [
        ("Capital, propio y financiado", "+100.000 €", False),
        ("Once cobros, del mes 2 al mes 12", "+" + eur(S["sales"]), False),
        ("Coches comprados, apertura y reposición", "−" + eur(S["purchases"]), False),
        ("Doce meses, la reforma y el equipo de revisión", "−" + eur(S["gastos"], True), False),
        ("IVA de las once ganancias, apartado", "−" + eur(S["iva"], True), False),
        ("Caja al cerrar diciembre", eur(S["months"][-1]["end"], True), True),
    ]
    waterfall(c, rows, 400)
    wrap(
        c,
        "El margen de las once ventas es " + eur(S["nets"], True) + ". Menos la estructura, " + eur(STRUCT * 12) + ", el equipo, 822,90 €, y los intereses, " + eur(S["interest"], True) + ", el impuesto al 15 % son " + eur(S["tax"], True) + ". No se paga en estos doce meses. Si se aparta, quedan " + eur(S["free"], True) + ". Durante el año la caja no baja del fondo.",
        "DejaVu", 10, 36, 118, 888, 13, INK, 4,
    )
    footer(c, n, total)


def draw_bank(c, n, total):
    bg(c)
    heading(c, "Lo que mira quien presta", "Este año paga la cuota " + S["dscr_txt"] + " veces. El ritmo de doce, 1,72.", size=18)
    cards = [
        (S["dscr_txt"], "Este año. Once ventas, el equipo de 822,90 € restado y el impuesto al 15 % ya quitado."),
        ("1,72", "Si hubiera una venta cada mes, doce, del coche medio de 3.781 €. Es el ritmo, no el diario de la apertura."),
        ("86 €", "Lo que sobra el mes del Audi, el que menos deja. Cubre el mes, y sobra poco."),
    ]
    x = 36
    for val, lab in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 250, 286, 150, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 398, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 28)
        c.drawString(x + 16, 340, val)
        wrap(c, lab, "DejaVu", 9.5, x + 16, 310, 254, 13, SLATE, 5)
        x += 302
    wrap(
        c,
        "El 1,32 de las cuatro páginas es otra división: el margen medio partido por 2.846 €, con la cuota redondeada a 966 € y sin quitar el impuesto ni el equipo. El " + S["dscr_txt"] + " de esta lámina es la cuenta de las once ventas, con el equipo y el impuesto ya restados. El 1,72 es el ritmo de doce ventas medias, sin el equipo.",
        "DejaVu", 11, 36, 200, 888, 15, INK, 4,
    )
    footer(c, n, total)


def draw_risk(c, n, total):
    bg(c)
    heading(c, "Si no sale como en la tabla", "Cada desvío tiene un número. No hay que imaginarlo.", size=20)
    no_sale = r2(S["months"][0]["end"] - MONTH)
    rows = [
        ("El mes 2 tampoco se vende", eur(no_sale, True) + " en caja. El Mercedes sigue sin comprarse. El fondo aguanta, y sobra."),
        ("El impuesto de sociedades es el 23 %", "La cobertura de doce ventas del coche medio pasa de 1,72 a 1,58 veces. Sigue cubriendo la cuota."),
        ("El 116d y el 318d, al precio de la web", "Mil euros menos cada uno. La cobertura de doce ventas queda en 1,51 veces."),
        ("Todos los precios, un 5 % más bajos", "La cuota se paga, pero solo sobra un 6 %. La cobertura de doce ventas queda en 1,06 veces. No hay colchón."),
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
        "El mes 1 se paga el equipo, se abre la nave y se compran seis coches. El mes 2, el primer cobro compra el Mercedes. El mes " + str(S["extra_n"]) + ", la caja compra otro 116d. Lo que se pide es una oferta de tipo y de plazo.",
        "DejaVu", 13, 36, 286, 880, 18, Color(0.78, 0.76, 0.70), 3,
    )
    stats = [
        ("50.000 €", "Financiación"),
        (eur(S["months"][-1]["end"], True), "Caja al cerrar el año"),
        (S["dscr_txt"] + " veces", "La cuota, en este año"),
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
        "Los siete coches, la nave, la reforma y los cinco gastos del mes: plan de viabilidad de cuatro páginas.",
        "El coste de cada coche ya incluye transporte, matriculación y puesta a punto. No se ha restado otra vez.",
        "La cuota de 955,06 € es la exacta al 5,50 % y 60 meses. El plan la redondea a 966 €. Intereses del año: 2.527,03 €.",
        "El fondo de " + eur(S["floor"], True) + " es tres veces el mes. Es la regla de esta solicitud, no una cifra del plan de cuatro páginas.",
        "El orden de las ventas es hipótesis: una al mes, desde el mes 2, en el orden de la tabla. No es una agenda firmada.",
        "El segundo 116d del mes " + str(S["extra_n"]) + " se compra a 9.010 €, el coste que ese modelo ya tiene. No se ha inventado un octavo coche.",
        "El " + S["dscr_txt"] + " de este año usa las once ventas y resta el equipo. El 1,72 usa doce veces el coche medio y no resta el equipo. El 1,32 de las cuatro páginas no quita el impuesto.",
        "El equipo, 822,90 €, sale del presupuesto de arranque: diagnosis 368,40, medidor 50,39, arrancador 57,39, diez informes 145,08, imagen 136,64, línea y gestoría 65,00. Se paga el mes 1, antes de comprar.",
        "El programa es el que está construido en este proyecto. La web es khcimport.autos, precios del 11 de octubre de 2026.",
    ]
    y = 408
    for item in items:
        c.setFillColor(GOLD)
        c.circle(46, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 10, 60, y, 860, 13, INK, 2)
        y -= h + 6
    footer(c, n, total)


SLIDES = [
    draw_cover, draw_business, draw_method, draw_lot, draw_program, draw_engines,
    draw_expenses, draw_rule, draw_m1, draw_m2, draw_gains, draw_cash_chart,
    draw_ledger, draw_year, draw_bank, draw_risk, draw_close, draw_sources,
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
    for yy in range(h):
        for xx in range(w):
            r, g, b, a = px[xx, yy]
            if a < 16:
                px[xx, yy] = (0, 0, 0, 0)
                continue
            silver = r > 68 and g > 68 and b > 68 and abs(r - b) < 48
            goldish = r > 105 and r > b + 18 and g > 55
            if not (silver or goldish):
                px[xx, yy] = (0, 0, 0, 0)
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


def svg_gains():
    width, height = 880, 280
    left, bottom, top = 46, 28, 18
    iw, ih = width - left - 10, height - bottom - top
    parts = [f'<svg viewBox="0 0 {width} {height}" width="100%" role="img">']
    for t in (0, 2000, 4000, 6000):
        yy = height - bottom - t / 6000 * ih
        parts.append(f'<line x1="{left}" y1="{yy:.1f}" x2="{width-8}" y2="{yy:.1f}" stroke="#e8e2d6" stroke-dasharray="2 3"/>')
        parts.append(f'<text x="{left-6}" y="{yy+3:.1f}" text-anchor="end" font-size="11" fill="#4a5872">{k(t)}</text>')
    bw = 10
    for i, m in enumerate(S["months"]):
        cx = left + (i + 0.5) * iw / 12
        gh = MONTH / 6000 * ih
        parts.append(f'<rect x="{cx-bw-1:.1f}" y="{height-bottom-gh:.1f}" width="{bw}" height="{gh:.1f}" fill="#b3934e"/>')
        if m["n"] > 1:
            mh = m["margen"] / 6000 * ih
            parts.append(f'<rect x="{cx+1:.1f}" y="{height-bottom-mh:.1f}" width="{bw}" height="{mh:.1f}" fill="#1f6b4a"/>')
            parts.append(f'<text x="{cx+6:.1f}" y="{height-bottom-mh-4:.1f}" text-anchor="middle" font-size="10" fill="#0a1020">{k(m["margen"])}</text>')
        parts.append(f'<text x="{cx:.1f}" y="{height-8}" text-anchor="middle" font-size="11" fill="#4a5872">{m["n"]}</text>')
    parts.append("</svg>")
    return "".join(parts)


def svg_cash():
    width, height = 880, 280
    left, bottom, top = 52, 28, 16
    iw, ih = width - left - 10, height - bottom - top
    def X(i):
        return left + (i + 0.5) * iw / 12
    def Y(v):
        return height - bottom - v / 20000 * ih
    parts = [f'<svg viewBox="0 0 {width} {height}" width="100%" role="img">']
    for t in (0, 5000, 10000, 15000, 20000):
        yy = Y(t)
        parts.append(f'<line x1="{left}" y1="{yy:.1f}" x2="{width-8}" y2="{yy:.1f}" stroke="#e8e2d6" stroke-dasharray="2 3"/>')
        parts.append(f'<text x="{left-6}" y="{yy+3:.1f}" text-anchor="end" font-size="11" fill="#4a5872">{k(t)}</text>')
    fy = Y(S["floor"])
    parts.append(f'<line x1="{left}" y1="{fy:.1f}" x2="{width-8}" y2="{fy:.1f}" stroke="#b3934e" stroke-dasharray="4 3"/>')
    pts = " ".join(f"{X(i):.1f},{Y(m['end']):.1f}" for i, m in enumerate(S["months"]))
    area = f"{X(0):.1f},{height-bottom} " + pts + f" {X(11):.1f},{height-bottom}"
    parts.append(f'<polygon points="{area}" fill="#dceee4"/>')
    parts.append(f'<polyline points="{pts}" fill="none" stroke="#0a1020" stroke-width="2"/>')
    for i, m in enumerate(S["months"]):
        color = "#b3934e" if m["kind"] in ("turn", "extra") else "#0a1020"
        parts.append(f'<circle cx="{X(i):.1f}" cy="{Y(m["end"]):.1f}" r="3.5" fill="{color}"/>')
        parts.append(f'<text x="{X(i):.1f}" y="{height-8}" text-anchor="middle" font-size="11" fill="#4a5872">{m["n"]}</text>')
    parts.append("</svg>")
    return "".join(parts)


def write_html():
    lot_rows = "".join(
        f"<tr><td>{esc(short(u['name']))}</td><td class='num'>{esc(eur(u['cost']))}</td><td class='num'>{esc(eur(u['sell']))}</td><td class='num'>{esc(eur(u['net'], True))}</td></tr>"
        for u in S["lot"]
    )
    year_rows = "".join(
        f"<tr class='{m['kind']}'><td>{m['n']}</td><td>{esc(m['what'])}</td><td class='num'>{esc(eur(m['cobro']))}</td><td class='num'>{esc(eur(m['gastos'], True))}</td><td class='num'>{'—' if m['n']==1 else esc(eur(m['iva'], True))}</td><td class='num'>{esc(eur(m['compra']))}</td><td class='num'>{esc(eur(m['sobra'], True))}</td><td class='num'><b>{esc(eur(m['end'], True))}</b></td></tr>"
        for m in S["months"]
    )
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Financiación 50.000 € — KHC Auto Import</title>
<style>
  :root {{ --ink:#0a1020; --gold:#b3934e; --ivory:#f7f6f2; --cover:#212228; --slate:#4a5872; --line:#e4dfd4; --green:#1f6b4a; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--cover); color:var(--ink); font-family:"Segoe UI", Helvetica, Arial, sans-serif; }}
  .slide {{ display:none; min-height:100vh; padding:5vh 6vw 7vh; flex-direction:column; background:var(--ivory); }}
  .slide.active {{ display:flex; }}
  .dark {{ background:var(--cover); color:#f4f1ea; }}
  .kicker {{ letter-spacing:.14em; font-size:12px; font-weight:700; color:var(--gold); margin:0 0 8px; }}
  h1 {{ font-family:Georgia, serif; font-weight:500; font-size:clamp(24px, 3vw, 38px); line-height:1.08; margin:0 0 12px; max-width:28ch; }}
  p {{ font-size:16px; line-height:1.45; max-width:78ch; }}
  .muted {{ color:var(--slate); }}
  .dark p {{ color:#cfc8ba; }}
  .grid {{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }}
  .grid3 {{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }}
  article, .stat {{ background:#fff; border-top:3px solid var(--gold); border-radius:8px; padding:14px 16px; }}
  .dark .stat {{ background:#2a2b32; }}
  article b, .stat b {{ display:block; font-family:Georgia, serif; font-size:26px; font-weight:500; margin-bottom:6px; }}
  .line {{ display:flex; justify-content:space-between; gap:12px; background:#fff; border-left:3px solid var(--gold); padding:8px 14px; margin:5px 0; }}
  .line.total {{ background:#212228; color:#f4f1ea; }}
  .line.total b {{ color:#b3934e; }}
  table {{ width:100%; border-collapse:collapse; font-size:13px; }}
  th {{ text-align:left; background:var(--ink); color:#fff; padding:6px 8px; font-size:11px; }}
  td {{ padding:5px 8px; border-bottom:1px solid var(--line); }}
  tr.turn td {{ background:#f6efe2; }}
  tr.extra td {{ background:#e7f3ec; }}
  .num {{ text-align:right; font-variant-numeric:tabular-nums; }}
  ol {{ margin:8px 0 0; padding-left:20px; }}
  li {{ margin:0 0 8px; line-height:1.4; }}
  .logo {{ width:150px; margin-bottom:10px; }}
  footer {{ margin-top:auto; display:flex; justify-content:space-between; padding-top:14px; color:var(--gold); font-size:12px; letter-spacing:.08em; }}
  .bar {{ position:fixed; left:0; top:0; height:3px; background:var(--gold); }}
  .hint {{ position:fixed; right:14px; bottom:10px; color:#8a8172; font-size:12px; }}
  .chart {{ background:#fff; border-radius:8px; padding:8px 8px 0; }}
</style>
</head>
<body>
<div class="bar" id="bar"></div>
<section class="slide dark">
  <img class="logo" src="logo_flat.png" alt="KHC">
  <p class="kicker">Solicitud de financiación</p>
  <h1>50.000 € para abrir la nave y poner el stock en marcha.</h1>
  <p>Otros 50.000 € son capital propio. Santiago de Compostela. El primer año está cerrado mes a mes.</p>
  <div class="grid3">
    <div class="stat"><b>50.000 €</b><span>Lo que se pide</span></div>
    <div class="stat"><b>50.000 €</b><span>Capital propio, al lado</span></div>
    <div class="stat"><b>12 meses</b><span>Plan cerrado, con gráficos</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>01</span></footer>
</section>
<section class="slide">
  <p class="kicker">Qué es la empresa</p>
  <h1>Se venden coches seleccionados. No se vende una importación.</h1>
  <div class="line"><span>Coches de ocasión, nacionales o de fuera. Se compra donde el número cierra.</span></div>
  <div class="line"><span>Galicia. Precio del plan entre 13.000 y 24.000 €.</span></div>
  <div class="line"><span>Doce meses de garantía, por escrito. Sin historial, no se paga el coche.</span></div>
  <div class="line"><span>Nave de 550 m² en San Marcos. La licencia ya existe. Se abre con el dinero.</span></div>
  <footer><span>KHC AUTO IMPORT</span><span>02</span></footer>
</section>
<section class="slide">
  <p class="kicker">Cómo se gana un coche</p>
  <h1>Cuatro restas. Siempre las mismas.</h1>
  <div class="grid">
    <article><b>{esc(eur(S['totals']['cost']/7))}</b><p class="muted">Coste medio. Transporte y matriculación ya dentro.</p></article>
    <article><b>{esc(eur(S['totals']['sell']/7))}</b><p class="muted">Venta media de los siete.</p></article>
    <article><b>{esc(eur(S['totals']['rebu']/7))}</b><p class="muted">IVA solo sobre la ganancia. En un usado se llama REBU.</p></article>
    <article><b>3.781 €</b><p class="muted">Lo que queda, de media.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>03</span></footer>
</section>
<section class="slide">
  <p class="kicker">Los siete coches del plan</p>
  <h1>Esto es el stock.</h1>
  <table><thead><tr><th>Coche</th><th>Coste</th><th>Venta</th><th>Quedan</th></tr></thead><tbody>{lot_rows}</tbody></table>
  <p class="muted">En la web, el 116d está a 12.475 € y el 318d a 17.250 €.</p>
  <footer><span>KHC AUTO IMPORT</span><span>04</span></footer>
</section>
<section class="slide">
  <p class="kicker">El programa</p>
  <h1>Lo hemos programado nosotros.</h1>
  <ol>
    <li><b>Simulador.</b> Coche, vendedor y precio. Si no sale, no se compra.</li>
    <li><b>Catálogo.</b> 1.104 versiones. El motor prohibido no se da de alta.</li>
    <li><b>Ficha.</b> De «lo estamos mirando» a «entregado». El mismo dato en el móvil y en el ordenador.</li>
    <li><b>Viaje e impuesto.</b> Rodando o en camión. Si la factura trae IVA descontable, no deja aplicar el IVA solo sobre la ganancia.</li>
    <li><b>Web y factura.</b> khcimport.autos. Reservado o vendido se ve el mismo día. El cliente no ve el coste.</li>
  </ol>
  <footer><span>KHC AUTO IMPORT</span><span>05</span></footer>
</section>
<section class="slide">
  <p class="kicker">Qué coche entra</p>
  <h1>Primero el motor. Después el precio.</h1>
  <div class="grid">
    <article><b>Se compra</b><p>Etiqueta C o ECO, libro de mantenimiento, diésel 2.0 de correa seca. Garantía de 12 meses.</p></article>
    <article><b>No se compra</b><p>PureTech, EcoBoost de correa bañada, el BMW de cadena antigua. El 116d de la tabla no se paga hasta ver el motor.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>06</span></footer>
</section>
<section class="slide">
  <p class="kicker">Todos los gastos</p>
  <h1>Cinco partidas. Cada mes. Haya venta o no.</h1>
  <div class="line"><span>Nave</span><b>1.100 €</b></div>
  <div class="line"><span>Autónomo. No es un sueldo.</span><b>380 €</b></div>
  <div class="line"><span>Portales y gestoría</span><b>250 €</b></div>
  <div class="line"><span>Luz, agua y vado</span><b>150 €</b></div>
  <div class="line"><span>Cuota, 5,50 % y 60 meses</span><b>955,06 €</b></div>
  <div class="line total"><span>El mes</span><b>2.835,06 €</b></div>
  <p class="muted">El mes 1, antes de comprar, suma el equipo de revisión, 822,90 €, y la reforma, 4.550 €. La obra la hace el promotor. No están: sueldo, taller y la cuota SGR.</p>
  <footer><span>KHC AUTO IMPORT</span><span>07</span></footer>
</section>
<section class="slide">
  <p class="kicker">La regla del año</p>
  <h1>Se vende, se compra. Si la caja pasa del fondo, se compra más.</h1>
  <div class="line"><span><b>Mes 1.</b> Primero el equipo, 822,90 €. Después seis coches y la reforma. El Mercedes no cabe.</span></div>
  <div class="line"><span><b>Fondo.</b> {esc(eur(S['floor'], True))}. Tres meses de gastos. Por debajo no se compra.</span></div>
  <div class="line"><span><b>La venta.</b> El primer cobro compra el Mercedes. Después, cada venta repone ese modelo.</span></div>
  <div class="line"><span><b>Lo que sobra.</b> El mes {S['extra_n']} compra otro 116d, a 9.010 €. El coste que ya tiene. No es un modelo nuevo.</span></div>
  <footer><span>KHC AUTO IMPORT</span><span>08</span></footer>
</section>
<section class="slide">
  <p class="kicker">Mes 1</p>
  <h1>Primero el equipo. Después los coches.</h1>
  <div class="line"><span>Capital y financiación</span><b>+100.000 €</b></div>
  <div class="line"><span>Equipo de revisión, antes de comprar</span><b>−822,90 €</b></div>
  <div class="line"><span>Seis coches</span><b>−77.714 €</b></div>
  <div class="line"><span>Reforma, materiales</span><b>−4.550 €</b></div>
  <div class="line"><span>El mes</span><b>−2.835,06 €</b></div>
  <div class="line total"><span>Caja</span><b>{esc(eur(S['months'][0]['end'], True))}</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>09</span></footer>
</section>
<section class="slide">
  <p class="kicker">Mes 2</p>
  <h1>Se cobra el Golf GTI. Ese dinero compra el Mercedes.</h1>
  <div class="line"><span>Caja</span><b>{esc(eur(S['months'][0]['end'], True))}</b></div>
  <div class="line"><span>El mes</span><b>−2.835,06 €</b></div>
  <div class="line"><span>Cobro del GTI</span><b>+18.500 €</b></div>
  <div class="line"><span>IVA de esa ganancia</span><b>−1.011,12 €</b></div>
  <div class="line"><span>Compra del Mercedes</span><b>−17.666 €</b></div>
  <div class="line total"><span>Caja</span><b>{esc(eur(S['months'][1]['end'], True))}</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>10</span></footer>
</section>
<section class="slide">
  <p class="kicker">Ganancia y gasto</p>
  <h1>La barra verde deja más que la dorada.</h1>
  <div class="chart">{svg_gains()}</div>
  <p class="muted">Dorada: el mes, 2.835 €. Verde: el margen. El mes 1 no vende. El Audi, el mes 7, supera el gasto en 86 €.</p>
  <footer><span>KHC AUTO IMPORT</span><span>11</span></footer>
</section>
<section class="slide">
  <p class="kicker">La caja</p>
  <h1>Sube con lo que sobra. Baja cuando se compra.</h1>
  <div class="chart">{svg_cash()}</div>
  <p class="muted">Mes 2, el Mercedes. Mes {S['extra_n']}, otro 116d a 9.010 €. Diciembre cierra con {esc(eur(S['months'][-1]['end'], True))} y siete coches.</p>
  <footer><span>KHC AUTO IMPORT</span><span>12</span></footer>
</section>
<section class="slide">
  <p class="kicker">El primer año</p>
  <h1>Mes a mes.</h1>
  <table><thead><tr><th>Mes</th><th>Qué ocurre</th><th>Cobro</th><th>Gastos</th><th>IVA</th><th>Compra</th><th>Sobra</th><th>Caja</th></tr></thead><tbody>{year_rows}</tbody></table>
  <p class="muted">Sobra es el margen menos el mes. No incluye la compra. El mes 1, cobro es el capital.</p>
  <footer><span>KHC AUTO IMPORT</span><span>13</span></footer>
</section>
<section class="slide">
  <p class="kicker">El año, en una cuenta</p>
  <h1>Once ventas. Siete coches. La cuota, pagada.</h1>
  <div class="line"><span>Capital</span><b>+100.000 €</b></div>
  <div class="line"><span>Once cobros</span><b>+{esc(eur(S['sales']))}</b></div>
  <div class="line"><span>Coches comprados</span><b>−{esc(eur(S['purchases']))}</b></div>
  <div class="line"><span>Gastos y reforma</span><b>−{esc(eur(S['gastos'], True))}</b></div>
  <div class="line"><span>IVA de las ganancias</span><b>−{esc(eur(S['iva'], True))}</b></div>
  <div class="line total"><span>Caja en diciembre</span><b>{esc(eur(S['months'][-1]['end'], True))}</b></div>
  <p class="muted">Impuesto del año, al 15 %: {esc(eur(S['tax'], True))}. No se paga en estos doce meses. Si se aparta, quedan {esc(eur(S['free'], True))}.</p>
  <footer><span>KHC AUTO IMPORT</span><span>14</span></footer>
</section>
<section class="slide">
  <p class="kicker">Lo que mira quien presta</p>
  <h1>Este año, {S['dscr_txt']} veces. El ritmo de doce, 1,72.</h1>
  <div class="grid3">
    <article><b>{S['dscr_txt']}</b><p class="muted">Once ventas, el equipo restado y el impuesto ya quitado.</p></article>
    <article><b>1,72</b><p class="muted">Doce ventas del coche medio. Es el ritmo, no el diario de la apertura.</p></article>
    <article><b>86 €</b><p class="muted">Lo que sobra el mes del Audi, el que menos deja.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>15</span></footer>
</section>
<section class="slide">
  <p class="kicker">Si no sale como en la tabla</p>
  <h1>Cada desvío tiene un número.</h1>
  <div class="line"><span>El mes 2 tampoco se vende</span><b>{esc(eur(S['months'][0]['end']-MONTH, True))}</b></div>
  <div class="line"><span>Impuesto al 23 %, doce ventas medias</span><b>1,58 veces</b></div>
  <div class="line"><span>116d y 318d al precio de la web</span><b>1,51 veces</b></div>
  <div class="line"><span>Todos los precios, un 5 % más bajos</span><b>1,06 veces</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>16</span></footer>
</section>
<section class="slide dark">
  <p class="kicker">La petición</p>
  <h1>50.000 € al lado de otros 50.000 €.</h1>
  <p>El mes 1 paga el equipo y compra seis coches. El mes 2 compra el Mercedes. El mes {S['extra_n']}, otro 116d. Lo que se pide es una oferta de tipo y de plazo.</p>
  <div class="grid3">
    <div class="stat"><b>50.000 €</b><span>Financiación</span></div>
    <div class="stat"><b>{esc(eur(S['months'][-1]['end'], True))}</b><span>Caja al cerrar el año</span></div>
    <div class="stat"><b>{S['dscr_txt']} veces</b><span>La cuota, en este año</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>17</span></footer>
</section>
<section class="slide">
  <p class="kicker">De dónde sale cada cifra</p>
  <h1>Nada de esta sala es una venta ya cobrada.</h1>
  <ul>
    <li>Coches, nave, reforma y gastos: plan de cuatro páginas. La cuota exacta es 955,06 €, no 966 €.</li>
    <li>El fondo de {esc(eur(S['floor'], True))} es tres veces el mes. Es la regla de esta solicitud.</li>
    <li>El orden de las ventas es hipótesis. El segundo 116d usa el coste ya cerrado, 9.010 €. No hay un octavo modelo inventado.</li>
    <li>El equipo, 822,90 €, se paga el mes 1, antes de comprar. El {S['dscr_txt']} de este año lo resta. El 1,72 no lo resta.</li>
  </ul>
  <footer><span>KHC AUTO IMPORT</span><span>18</span></footer>
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
    print("slides", len(SLIDES), "end", S["months"][-1]["end"], "tax", S["tax"], "dscr", S["dscr"])
    for m in S["months"]:
        print(m["n"], m["kind"], m["what"], m["end"], "sobra", m["sobra"])


if __name__ == "__main__":
    main()

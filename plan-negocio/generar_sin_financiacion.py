#!/usr/bin/env python3
"""Comparación: 50.000 € propios, sin préstamo, contra el plan financiado.

No sustituye la solicitud. Las cifras salen de la misma regla y de los
mismos costes. No hay un precio cerrado de garaje: no se inventa.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

from reportlab.lib.colors import Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

spec = importlib.util.spec_from_file_location(
    "g", "/home/user/KHC-Auto-Import/plan-negocio/generar_presentacion.py"
)
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
spec2 = importlib.util.spec_from_file_location(
    "p", "/home/user/KHC-Auto-Import/plan-negocio/probar_sin_financiacion.py"
)
p = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(p)

HERE = Path(__file__).resolve().parent
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
COVER = Color(33 / 255, 34 / 255, 40 / 255)
CARD = Color(1, 1, 1)
LINE = Color(0.855, 0.835, 0.788)
SOFT = Color(0.955, 0.949, 0.935)
S = g.S
OWN = p.simulate(["GTI", "GTI", "116d"], 1, p.FAM)
CHEAP = p.simulate(["116d", "116d", "116d", "116d"], 1, p.FAM)
assert OWN and OWN["cuts"] == 0
assert CHEAP and CHEAP["cuts"] > 0
POCKET = 7 * 1687.50 + 12 * 2500 + 12 * 3000
assert abs(OWN["pocket"] - POCKET) < 0.05
assert abs(S["y3_end"] - 26460.75) < 0.05
QUOTA_36 = g.r2(g.QUOTA * 36)
INTEREST_36 = g.r2(S["interest"] + S["y2_interest"] + S["y3_interest"])
GAP = g.r2(OWN["equity"] - S["equity"])
MISS = g.r2(OWN["months"][0]["end"] - p.fixed_of(True))
MISS2 = g.r2(MISS - p.fixed_of(True))
FIN_MISS = g.r2(S["months"][0]["end"] - g.FIXED)
FIN_CUSH = g.r2(FIN_MISS - S["floor"])
FIN_MISS2 = g.r2(FIN_MISS - g.FIXED)
FIN_SHORT = g.r2(S["floor"] - FIN_MISS2)


def _scaled(unit, factor):
    u = dict(unit)
    u["sell"] = g.r2(u["sell"] * factor)
    gross = g.r2(u["sell"] - u["cost"])
    u["rebu"] = g.r2(gross * 21 / 121)
    u["net"] = g.r2(gross - u["rebu"])
    return u


def own_price_cut(factor):
    saved = {id(u): (u["sell"], u["rebu"], u["net"]) for u in p.LOT}
    for u in p.LOT:
        s = _scaled(u, factor)
        u["sell"], u["rebu"], u["net"] = s["sell"], s["rebu"], s["net"]
    try:
        return p.simulate(["GTI", "GTI", "116d"], 1, p.FAM)
    finally:
        for u in p.LOT:
            u["sell"], u["rebu"], u["net"] = saved[id(u)]


def financed_price_cut(factor):
    """Misma regla que la solicitud, sin los assert del caso base."""
    r2 = g.r2
    lot = [_scaled(g.apply_web(u), factor) for u in g.MODEL["lot"]]
    held = max(lot, key=lambda u: u["cost"])
    opening = [u for u in lot if u["name"] != held["name"]]
    models = sorted(lot, key=lambda u: (u["cost"], u["name"]))
    floor = r2(g.FIXED * 3)
    cash = r2(100000 - sum(u["cost"] for u in opening) - g.REFORM - g.KIT - g.FIXED)
    stock = [dict(u) for u in opening]
    mercedes_in = False
    cum_net = sal_sum = y_net = y_sal = 0.0
    y1_tax = y1_result = y2_tax = 0.0
    interest = g.MODEL["loan"]["y1_interest"]
    y2_interest, _, y2_balance = g.amortize(
        g.MODEL["loan"]["y1_balance"], g.MODEL["loan"]["rate"], g.MODEL["loan"]["payment_exact"]
    )
    y3_interest, _, _ = g.amortize(
        y2_balance, g.MODEL["loan"]["rate"], g.MODEL["loan"]["payment_exact"]
    )
    cuts = 0
    end = cash
    for n in range(2, 37):
        if n in (13, 25):
            y_net = y_sal = 0.0
        if n == 19:
            cash = r2(cash - y1_tax)
        elif n == 31:
            cash = r2(cash - y2_tax)
        want = g.scheduled_salary(n, len(stock))
        cash = r2(cash - g.FIXED)
        k = min(g.sales_count(len(stock)), len(stock))
        for _ in range(k):
            car = stock.pop(0)
            cash = r2(cash + car["sell"] - car["rebu"])
            y_net = r2(y_net + car["net"])
            cum_net = r2(cum_net + car["net"])
            cash = r2(cash - car["cost"])
            stock.append(dict(car))
            if not mercedes_in and r2(cash - floor) >= held["cost"]:
                cash = r2(cash - held["cost"])
                stock.append(dict(held))
                mercedes_in = True
        room = r2(cash - floor)
        sal = want if room + 1e-6 >= want else r2(max(0.0, room))
        if sal + 0.02 < want:
            cuts += 1
        cash = r2(cash - sal)
        sal_sum = r2(sal_sum + sal)
        y_sal = r2(y_sal + sal)
        if n <= 12:
            tax_now = g.tax_reserve(cum_net, n, interest, sal_sum)
        elif n <= 24:
            tax_now = r2(max(0.0, y_net - g.STRUCT * (n - 12) - y_sal - y2_interest) * 0.15)
        else:
            tax_now = g.micro_tax(r2(max(0.0, y_net - g.STRUCT * (n - 24) - y_sal - y3_interest)))
        if mercedes_in:
            while True:
                room = r2(cash - floor - tax_now)
                fits = [u for u in models if u["cost"] <= room + 1e-6]
                if not fits:
                    break
                nxt = fits[0]
                cash = r2(cash - nxt["cost"])
                stock.append(dict(nxt))
        if n == 12:
            ebitda_y1 = r2(cum_net - g.STRUCT * 12 - g.KIT - sal_sum)
            y1_tax = r2(max(0.0, ebitda_y1 - interest) * 0.15)
            y1_result = r2(ebitda_y1 - interest - y1_tax)
        if n == 24:
            ebitda_y2 = r2(y_net - g.STRUCT * 12 - y_sal)
            base_y2 = r2(ebitda_y2 - y2_interest)
            reduc_y2 = r2(min(0.20 * y1_result, 0.25 * base_y2))
            y2_tax = r2(max(0.0, base_y2 - reduc_y2) * 0.15)
        end = cash
    return {"cuts": cuts, "stock": len(stock), "cash": end}


_BASE_FIN = financed_price_cut(1.0)
assert _BASE_FIN["cuts"] == 0 and _BASE_FIN["stock"] == S["y3_stock"]
assert abs(_BASE_FIN["cash"] - S["y3_end"]) < 0.05
OWN_CUT = own_price_cut(0.95)
FIN_CUT = financed_price_cut(0.95)
assert OWN_CUT and OWN_CUT["stock"] == 7 and FIN_CUT["stock"] == 7
# El recorte de precio no debe dejar el lote tocado para el resto del PDF.
assert abs(p.BY["GTI"]["sell"] - 18500) < 0.05


def eur(n, cents=False):
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
    c.drawCentredString(W / 2, 18, "50.000 € propios  ·  sin préstamo  ·  no es la solicitud")
    c.setFillColor(GOLD if dark else INK)
    c.drawRightString(W - 28, 18, f"{n:02d}  /  {total:02d}")


def kicker(c, text, y, dark=False):
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 8)
    c.drawString(36, y, text.upper())


def heading(c, kick, text, y=498, size=22):
    kicker(c, kick, y)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", size)
    c.drawString(36, y - 32, text)
    return y - 32


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
    for i, line in enumerate(lines[:max_lines]):
        c.setFillColor(color)
        c.setFont(font, size)
        c.drawString(x, y - i * leading, line)
    return min(len(lines), max_lines) * leading


def draw_cover(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    kicker(c, "Otra pregunta. No es la solicitud.", 400, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 28)
    c.drawString(36, 348, "¿Hace falta el préstamo")
    c.drawString(36, 312, "para que esto viva?")
    c.setFillColor(Color(0.78, 0.76, 0.70))
    c.setFont("DejaVu", 12)
    wrap(
        c,
        "50.000 € propios. Sin cuota. La nave puede abrir el día 1 si los tres primeros coches son dos GTI y un 116d. El sueldo de la familia se paga igual. A los 36 meses, la empresa vale más y no debe nada.",
        "DejaVu", 12, 36, 268, 860, 16, Color(0.78, 0.76, 0.70), 4,
    )
    stats = [
        (eur(GAP), "Más valor, sin deber el préstamo"),
        (eur(POCKET, True), "El mismo bolsillo, en 36 meses"),
        ("3 → 22", "Coches. La misma regla de venta"),
    ]
    x = 36
    for val, lab in stats:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 78, 286, 86, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 20)
        c.drawString(x + 16, 118, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 8)
        c.drawString(x + 16, 96, lab.upper())
        x += 302
    footer(c, n, total, True)


def draw_day1(c, n, total):
    bg(c)
    heading(c, "El día 1, con 50.000 €", "Seis coches no caben. Tres, de los que más dejan, sí.", size=18)
    rows = [
        ("Capital propio", 50000, False),
        ("Equipo de revisión, antes de comprar", -g.KIT, False),
        ("Reforma de la nave, hecha por él", -g.REFORM, False),
        ("Dos GTI y un 116d", -g.r2(2 * p.BY["GTI"]["cost"] + p.BY["116d"]["cost"]), False),
        ("Nave, autónomo y portales, mes 1", -p.fixed_of(True), False),
        ("Caja al cerrar el día", OWN["months"][0]["end"], True),
    ]
    y = 400
    for lab, val, last in rows:
        c.setFillColor(COVER if last else (CARD if int(y) % 2 == 0 else SOFT))
        c.roundRect(36, y - 8, 888, 32, 3, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 11)
        c.drawString(52, y, lab)
        c.setFont("DejaVuBold", 11)
        c.drawRightString(900, y, eur(val, True))
        y -= 40
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 10)
    wrap(
        c,
        "El fondo, tres meses sin la cuota, son " + eur(p.fund_of(True), True) + ". Quedan " + eur(g.r2(OWN["months"][0]["end"] - p.fund_of(True)), True) + " por encima. Cuatro 116d también caben. Esa apertura recorta el sueldo. El préstamo no es lo que falta. Lo que no cabe es llenar el suelo de coches que dejan poco.",
        "DejaVu", 10.5, 36, 138, 888, 14, SLATE, 3,
    )
    footer(c, n, total)


def draw_compare(c, n, total):
    bg(c)
    heading(c, "Los 36 meses", "El mismo sueldo. Sin cuota, queda más empresa.", size=18)
    c.setFillColor(INK)
    c.rect(36, 412, 888, 22, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(640, 419, "CON PRÉSTAMO")
    c.drawRightString(900, 419, "SOLO 50.000 €")
    rows = [
        ("Coches el día 1", "6", "3", False),
        ("Ventas, año 1 / 2 / 3", f"{S['sales_n']} / {S['y2_sales_n']} / {S['y3_sales_n']}", " / ".join(str(x) for x in OWN["sales_y"]), False),
        ("Coches al mes 36", str(S["y3_stock"]), str(OWN["stock"]), False),
        ("Bolsillo de la familia", eur(POCKET, True), eur(OWN["pocket"], True), False),
        ("Beneficio del año 3", eur(S["y3_result"], True), eur(OWN["result3"], True), False),
        ("Caja al cerrar", eur(S["y3_end"], True), eur(OWN["cash"], True), False),
        ("Deuda que queda", eur(S["y3_balance"], True), "0 €", False),
        ("Lo que es suyo dentro", eur(S["equity"], True), eur(OWN["equity"], True), True),
    ]
    for i, (lab, a, b, last) in enumerate(rows):
        y = 382 - i * 34
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 8, 888, 32, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 10)
        c.drawString(52, y, lab)
        c.setFont("DejaVuBold", 10)
        c.setFillColor(SLATE if not last else GOLD)
        c.drawRightString(640, y, a)
        c.setFillColor(GREEN if not last else GOLD)
        c.drawRightString(900, y, b)
    footer(c, n, total)


def draw_why(c, n, total):
    bg(c)
    heading(c, "Por qué el préstamo no suma", "El año 1 vende lo mismo. La cuota se come el crecimiento.", size=17)
    cards = [
        ("22 y 22", "Ventas del año 1. Con 3 coches o con 6, la regla vende dos al mes hasta llegar a nueve."),
        (eur(g.QUOTA, True), "Cada mes, 60 veces. En 36 meses, " + eur(QUOTA_36) + ". Interés de esos años, " + eur(INTEREST_36) + "."),
        (eur(S["floor"], True), "Fondo con cuota. Sin ella, " + eur(p.fund_of(True), True) + ". El fondo alto frena la compra del siguiente coche."),
    ]
    x = 36
    for val, lab in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 250, 286, 150, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 398, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 16, 348, val)
        wrap(c, lab, "DejaVu", 10, x + 16, 318, 254, 13.5, SLATE, 5)
        x += 302
    wrap(
        c,
        "El préstamo pone seis coches el día 1. La regla no premia esos tres de más hasta que el suelo llega a nueve. Mientras tanto se pagan " + eur(g.QUOTA, True) + " y se guarda un fondo más alto. A los 36 meses hay menos coches, queda una deuda de " + eur(S["y3_balance"], True) + ", y el sueldo es el mismo. La diferencia de valor es " + eur(GAP, True) + ", a favor de no pedirlo.",
        "DejaVu", 11, 36, 210, 888, 15, INK, 4,
    )
    footer(c, n, total)


def draw_risk(c, n, total):
    bg(c)
    heading(c, "Lo que el préstamo sí compra", "Colchón el primer mes. No compra el sueldo si los precios bajan.", size=16)
    rows = [
        ("Un mes sin vender, al empezar", "Aguanta justo: " + eur(MISS, True) + ", solo " + eur(g.r2(MISS - p.fund_of(True)), True) + " sobre el fondo. Con el préstamo, ese mes en blanco deja " + eur(FIN_MISS, True) + ", " + eur(FIN_CUSH, True) + " sobre el suyo."),
        ("Dos meses seguidos sin vender", "No aguanta. Baja a " + eur(MISS2, True) + ", " + eur(g.r2(p.fund_of(True) - MISS2), True) + " por debajo del fondo. Con el préstamo, esos dos meses dejan " + eur(FIN_MISS2, True) + ", " + eur(FIN_SHORT, True) + " por debajo del suyo."),
        ("Precios un 5 % más bajos", "Los dos recortan el sueldo: este plan, " + str(OWN_CUT["cuts"]) + " meses; el del préstamo, " + str(FIN_CUT["cuts"]) + " meses. En los dos, el stock se queda en " + str(OWN_CUT["stock"]) + ". Hace falta que los precios de la web se cumplan."),
        ("Sin nave los primeros meses", "No hace falta. Con estos tres coches la nave cabe el día 1. No hay un precio cerrado de garaje: no se usa. Esperar la nave deja más caja, y cierra el taller."),
    ]
    y = 400
    for title, body in rows:
        c.setFillColor(CARD)
        c.roundRect(36, y - 52, 888, 68, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 52, 3, 68, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 12)
        c.drawString(54, y - 4, title)
        wrap(c, body, "DejaVu", 10, 54, y - 24, 850, 13, SLATE, 2)
        y -= 78
    footer(c, n, total)


def draw_close(c, n, total):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    kicker(c, "La decisión", 430, True)
    c.setFillColor(WHITE)
    c.setFont("DejaVuSerif", 26)
    c.drawString(36, 378, "Para vivir y para ganar,")
    c.drawString(36, 344, "el préstamo no hace falta.")
    wrap(
        c,
        "Se abre con dos GTI y un 116d. Kit, reforma y nave, el día 1. El sueldo entra el mes 6 y sube igual: 2.500 € en el bolsillo desde el mes 13, y 3.000 € desde el mes 25. A los 36 meses hay 22 coches, cero deuda, y " + eur(GAP, True) + " más dentro de la empresa. El préstamo compra seis coches el primer día y un colchón más grueso. No compra más sueldo ni más beneficio.",
        "DejaVu", 12, 36, 292, 880, 16, Color(0.78, 0.76, 0.70), 5,
    )
    stats = [
        ("No pedirlo", "Si el objetivo es el mes 36"),
        ("Pedirlo", "Si hacen falta seis coches ya"),
        (eur(OWN["equity"], True), "Suyo, sin deuda, al mes 36"),
    ]
    x = 36
    for val, lab in stats:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(x, 72, 286, 78, 3, fill=1, stroke=1)
        c.setFillColor(WHITE)
        c.setFont("DejaVuSerif", 16)
        c.drawString(x + 14, 108, val)
        c.setFillColor(GOLD)
        c.setFont("DejaVu", 8)
        c.drawString(x + 14, 88, lab.upper())
        x += 302
    footer(c, n, total, True)


def main():
    slides = [draw_cover, draw_day1, draw_compare, draw_why, draw_risk, draw_close]
    c = canvas.Canvas(str(OUT), pagesize=(W, H))
    c.setTitle("KHC — 50.000 € propios, sin préstamo")
    for i, fn in enumerate(slides, 1):
        fn(c, i, len(slides))
        c.showPage()
    c.save()
    print(OUT)
    print("gap", GAP, "own equity", OWN["equity"], "fin", S["equity"])
    print("miss", MISS, "miss2", MISS2, "quota36", QUOTA_36, "interest", INTEREST_36)
    print("cut5", OWN_CUT["cuts"], FIN_CUT["cuts"], "stock", OWN_CUT["stock"], FIN_CUT["stock"])


if __name__ == "__main__":
    main()

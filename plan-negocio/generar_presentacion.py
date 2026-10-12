#!/usr/bin/env python3
"""Solicitud de 50.000 €. Veinticuatro meses, con cifras cerradas.

Precios de venta: los de khcimport.autos. Costes: los ya cerrados.
Se vende una de cada tres unidades con las que abre el mes, y nunca
menos de dos. Cada venta se repone en la semana, al mismo coste.
El Mercedes entra cuando cabe sin bajar del fondo. Lo que sobra, después
del fondo y de la reserva del 15 %, compra el más barato que quepa.
El sueldo no es obligatorio. Entra el mes 6. El segundo año sube a un
bolsillo de 2.500 € y el tercero a 3.000 €, si el año anterior se cobró
entero y el stock no bajó. No se inventa un modelo ni un precio.
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
REFORM = 4550.0
KIT = 822.90
RENT, RETA, MKT, UTIL = 1100.0, 448.69, 250.0, 150.0
QUOTA = 955.06
FIXED = 2903.75
STRUCT = 1948.69
SMI = 1424.50
LIVE = 2083.33
# El 35 % es fijo: no mira a las hijas y no se cobra a fin de mes.
# El bruto se calcula para que el bolsillo no baje, y luego suba.
POCKET_Y1 = 1687.50
POCKET_Y2 = 2500.00
POCKET_Y3 = 3000.00
GROSS_Y2 = 3846.15
GROSS_Y3 = 4615.38
POCKET_STEP = 500.00
SALARY_START = 6
RISE_STOCK = 8
WITHHOLD = 0.19
Y2_WITHHOLD = 0.35


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
    if name.startswith("Mercedes"):
        return "Mercedes"
    if "GTI" in name:
        return "GTI"
    if "116d" in name:
        return "116d"
    if "Golf VIII" in name:
        return "Golf VIII"
    if "318d" in name:
        return "318d"
    if "XC40" in name:
        return "XC40"
    if "A3" in name:
        return "Audi"
    return short(name)


def join_names(names):
    order, counts = [], {}
    for name in names:
        if name not in counts:
            order.append(name)
            counts[name] = 0
        counts[name] += 1
    parts = []
    for name in order:
        c = counts[name]
        parts.append(name if c == 1 else ("dos " + name if c == 2 else f"{c} {name}"))
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] + " y " + parts[1]
    return ", ".join(parts[:-1]) + " y " + parts[-1]


# Precios publicados en khcimport.autos el 11 de octubre de 2026.
WEB_SELL = {
    "Mercedes-Benz Clase C Estate 2019": 23990.0,
    "Volkswagen Golf GTI Performance 2015": 18500.0,
    "BMW 116d Manual 2015": 12475.0,
    "Volkswagen Golf VIII 1.0 TSI 2021": 18700.0,
    "BMW 318d Touring 2019": 17250.0,
    "Volvo XC40 2.0 D3 2020": 18500.0,
    "Audi A3 1.0 TFSI 2018": 15990.0,
}


def apply_web(unit):
    u = dict(unit)
    if u["name"] not in WEB_SELL:
        raise SystemExit("sin precio web para " + u["name"])
    u["sell"] = WEB_SELL[u["name"]]
    gross = r2(u["sell"] - u["cost"])
    u["rebu"] = r2(gross * 21 / 121)
    u["net"] = r2(gross - u["rebu"])
    u["nick"] = nick(u["name"])
    return u


def scheduled_salary(n, stock):
    if n < SALARY_START:
        return 0.0
    if n <= 12:
        return LIVE
    if n <= 24:
        return GROSS_Y2
    return GROSS_Y3


def micro_tax(base):
    """Micropymes desde 2027: 17 % hasta 50.000 € y 20 % el resto."""
    base = max(0.0, base)
    first = min(base, 50000.0)
    return r2(first * 0.17 + max(0.0, base - 50000.0) * 0.20)


def sales_count(stock):
    """Una de cada tres unidades en el suelo, y nunca menos de dos."""
    return max(2, stock // 3)


def pocket(gross):
    return r2(gross - r2(gross * WITHHOLD))


def amortize(balance, annual_rate, payment, months=12):
    rate = annual_rate / 12
    inte = prin = 0.0
    bal = balance
    for _ in range(months):
        i = r2(bal * rate)
        p = r2(payment - i)
        bal = r2(bal - p)
        inte = r2(inte + i)
        prin = r2(prin + p)
    return inte, prin, bal


def tax_reserve(cum_net, n, interest, sal_sum):
    ebitda = r2(cum_net - STRUCT * n - KIT - sal_sum)
    return r2(max(0.0, ebitda - interest) * 0.15)


def simulate(y2_gross=None):
    assert r2(RENT + RETA + MKT + UTIL + QUOTA) == FIXED
    assert r2(RENT + RETA + MKT + UTIL) == STRUCT
    assert r2(25000 / 12) == LIVE
    assert pocket(LIVE) == POCKET_Y1
    assert r2(POCKET_Y2 / (1 - Y2_WITHHOLD)) == GROSS_Y2
    assert r2(POCKET_Y3 / (1 - Y2_WITHHOLD)) == GROSS_Y3
    lot = [apply_web(u) for u in MODEL["lot"]]
    held = max(lot, key=lambda u: u["cost"])
    opening = [u for u in lot if u["name"] != held["name"]]
    models = sorted(lot, key=lambda u: (u["cost"], u["name"]))
    floor = r2(FIXED * 3)
    six = r2(sum(u["cost"] for u in opening))
    cash = r2(100000 - six - REFORM - KIT - FIXED)
    stock = [dict(u) for u in opening]
    mercedes_in = False
    cum_net = 0.0
    sal_sum = 0.0
    y_net = 0.0
    y_sal = 0.0
    y1_tax = 0.0
    y1_result = 0.0
    interest = MODEL["loan"]["y1_interest"]
    y2_interest, y2_principal, y2_balance = amortize(
        MODEL["loan"]["y1_balance"], MODEL["loan"]["rate"], MODEL["loan"]["payment_exact"]
    )
    y3_interest, y3_principal, y3_balance = amortize(
        y2_balance, MODEL["loan"]["rate"], MODEL["loan"]["payment_exact"]
    )
    y2_tax = 0.0
    months = [{
        "n": 1,
        "what": "Apertura. Equipo, reforma y seis coches. Sin venta.",
        "sold": [],
        "cobro": 100000.0,
        "fijos": FIXED,
        "sal": 0.0,
        "bill": FIXED,
        "gastos": r2(FIXED + REFORM + KIT),
        "iva": 0.0,
        "compra": six,
        "margen": 0.0,
        "sobra": r2(-FIXED),
        "end": cash,
        "stock": 6,
        "open_stock": 0,
        "sales": 0,
        "kind": "open",
        "buys": [u["nick"] for u in opening],
        "extras": [],
    }]
    for n in range(2, 37):
        tax_paid = 0.0
        if n in (13, 25):
            y_net = 0.0
            y_sal = 0.0
        if n == 19:
            cash = r2(cash - y1_tax)
            tax_paid = y1_tax
        elif n == 31:
            cash = r2(cash - y2_tax)
            tax_paid = y2_tax
        open_stock = len(stock)
        want = scheduled_salary(n, open_stock)
        cash = r2(cash - FIXED)
        k = min(sales_count(len(stock)), len(stock))
        sold, buys, sold_units = [], [], []
        compra = cobro = iva = margen = 0.0
        entered = False
        for _ in range(k):
            car = stock.pop(0)
            sold.append(car["nick"])
            sold_units.append(car)
            cash = r2(cash + car["sell"] - car["rebu"])
            cobro = r2(cobro + car["sell"])
            iva = r2(iva + car["rebu"])
            margen = r2(margen + car["net"])
            cum_net = r2(cum_net + car["net"])
            y_net = r2(y_net + car["net"])
            cash = r2(cash - car["cost"])
            compra = r2(compra + car["cost"])
            stock.append(dict(car))
            buys.append(car["nick"])
            if not mercedes_in and r2(cash - floor) >= held["cost"]:
                cash = r2(cash - held["cost"])
                compra = r2(compra + held["cost"])
                stock.append(dict(held))
                mercedes_in = True
                entered = True
                buys.append("Mercedes")
        room = r2(cash - floor)
        sal = want if room + 1e-6 >= want else r2(max(0.0, room))
        cash = r2(cash - sal)
        sal_sum = r2(sal_sum + sal)
        y_sal = r2(y_sal + sal)
        bill = r2(FIXED + sal)
        if n <= 12:
            tax_now = tax_reserve(cum_net, n, interest, sal_sum)
        elif n <= 24:
            ebitda_run = r2(y_net - STRUCT * (n - 12) - y_sal)
            tax_now = r2(max(0.0, ebitda_run - y2_interest) * 0.15)
        else:
            ebitda_run = r2(y_net - STRUCT * (n - 24) - y_sal)
            tax_now = micro_tax(r2(max(0.0, ebitda_run - y3_interest)))
        extras = []
        if mercedes_in:
            while True:
                room = r2(cash - floor - tax_now)
                fits = [u for u in models if u["cost"] <= room + 1e-6]
                if not fits:
                    break
                nxt = fits[0]
                cash = r2(cash - nxt["cost"])
                compra = r2(compra + nxt["cost"])
                stock.append(dict(nxt))
                extras.append(nxt["nick"])
                buys.append(nxt["nick"] + " extra")
        what = join_names(sold)
        if entered:
            what += ". Entra el Mercedes"
        if extras:
            what += ". Otro " + join_names(extras)
        elif not entered:
            what += ". Se reponen"
        if n == SALARY_START:
            what += ". Empieza el sueldo"
        elif sal > months[-1]["sal"] + 0.01:
            what += ". El sueldo sube"
        if n == 19 and tax_paid:
            what += ". Impuesto del año 1"
        elif n == 31 and tax_paid:
            what += ". Impuesto del año 2"
        if entered and not extras:
            kind = "turn"
        elif extras:
            kind = "extra"
        elif k == 3:
            kind = "three"
        else:
            kind = "roll"
        months.append({
            "n": n,
            "what": what,
            "sold": sold,
            "sold_units": sold_units,
            "cobro": cobro,
            "fijos": FIXED,
            "sal": sal,
            "bill": bill,
            "gastos": bill,
            "iva": iva,
            "compra": compra,
            "margen": margen,
            "sobra": r2(margen - bill),
            "end": cash,
            "stock": len(stock),
            "open_stock": open_stock,
            "sales": k,
            "kind": kind,
            "buys": buys,
            "extras": extras,
            "tax_paid": tax_paid,
        })
        if n == 12:
            ebitda_y1 = r2(cum_net - STRUCT * 12 - KIT - sal_sum)
            y1_tax = r2(max(0.0, ebitda_y1 - interest) * 0.15)
            y1_result = r2(ebitda_y1 - interest - y1_tax)
        if n == 24:
            ebitda_y2 = r2(y_net - STRUCT * 12 - y_sal)
            base_y2 = r2(ebitda_y2 - y2_interest)
            reduc_y2 = r2(min(0.20 * y1_result, 0.25 * base_y2))
            y2_tax = r2(max(0.0, base_y2 - reduc_y2) * 0.15)
    y1 = [m for m in months if m["n"] <= 12]
    y2 = [m for m in months if 13 <= m["n"] <= 24]
    y3 = [m for m in months if m["n"] >= 25]
    def year_cut(rows):
        cut = 0.0
        for m in rows:
            for car in m.get("sold_units") or []:
                cut += (car["sell"] * 0.95 - car["cost"]) / 1.21
        return cut

    nets = r2(sum(m["margen"] for m in y1 if m["n"] > 1))
    sales = r2(sum(m["cobro"] for m in y1 if m["n"] > 1))
    sales_n = sum(m["sales"] for m in y1)
    purchases = r2(sum(m["compra"] for m in y1))
    gastos = r2(sum(m["gastos"] for m in y1))
    iva = r2(sum(m["iva"] for m in y1))
    sal_year = r2(sum(m["sal"] for m in y1))
    ebitda = r2(nets - STRUCT * 12 - KIT - sal_year)
    taxable = r2(ebitda - interest)
    tax = r2(max(0.0, taxable) * 0.15)
    tax23 = r2(max(0.0, taxable) * 0.23)
    service = MODEL["loan"]["y1_service"]
    dscr = r2((ebitda - tax) / service)
    dscr23 = r2((ebitda - tax23) / service)
    cut_ebitda = r2(year_cut(y1) - STRUCT * 12 - KIT - sal_year)
    cut_tax = r2(max(0.0, cut_ebitda - interest) * 0.15)
    dscr5 = r2((cut_ebitda - cut_tax) / service)
    identity_y1 = r2(100000 + sales - purchases - gastos - iva)
    nets2 = r2(sum(m["margen"] for m in y2))
    sales2 = r2(sum(m["cobro"] for m in y2))
    sales2_n = sum(m["sales"] for m in y2)
    sal2 = r2(sum(m["sal"] for m in y2))
    ebitda2 = r2(nets2 - STRUCT * 12 - sal2)
    base2 = r2(ebitda2 - y2_interest)
    # Art. 25 LIS: el incremento computable es el beneficio del año anterior
    # que no se reparte. No incluye el resultado del propio ejercicio.
    reduc2 = r2(min(0.20 * y1_result, 0.25 * base2))
    tax2 = r2(max(0.0, base2 - reduc2) * 0.15)
    tax2_plain = r2(max(0.0, base2) * 0.15)
    result2 = r2(ebitda2 - y2_interest - tax2)
    dscr2 = r2((ebitda2 - tax2) / service)
    assert abs(tax2 - y2_tax) < 0.02
    nets3 = r2(sum(m["margen"] for m in y3))
    sales3 = r2(sum(m["cobro"] for m in y3))
    sales3_n = sum(m["sales"] for m in y3)
    sal3 = r2(sum(m["sal"] for m in y3))
    ebitda3 = r2(nets3 - STRUCT * 12 - sal3)
    base3 = r2(ebitda3 - y3_interest)
    reduc3 = r2(min(0.20 * result2, 0.25 * base3))
    tax3 = micro_tax(r2(max(0.0, base3 - reduc3)))
    tax3_plain = micro_tax(base3)
    result3 = r2(ebitda3 - y3_interest - tax3)
    dscr3 = r2((ebitda3 - tax3) / service)
    sales_all = r2(sum(m["cobro"] for m in months if m["n"] > 1))
    purchases_all = r2(sum(m["compra"] for m in months))
    gastos_all = r2(sum(m["gastos"] for m in months))
    iva_all = r2(sum(m["iva"] for m in months))
    identity = r2(100000 + sales_all - purchases_all - gastos_all - iva_all - y1_tax - y2_tax)
    merc = next(m for m in y1 if m["kind"] == "turn")
    thin = min(lot, key=lambda u: u["net"])
    weak = min((m for m in y1 if m["n"] > 1), key=lambda m: m["sobra"])
    free = r2(y1[-1]["end"] - tax)
    free2 = r2(y2[-1]["end"] - tax2)
    free3 = r2(months[-1]["end"] - tax3)
    spans = []
    for m in months:
        if not spans or abs(spans[-1]["sal"] - m["sal"]) > 0.01:
            spans.append({"from": m["n"], "to": m["n"], "sal": m["sal"]})
        else:
            spans[-1]["to"] = m["n"]
    stock_cost = r2(sum(u["cost"] for u in stock))
    equity = r2(months[-1]["end"] + stock_cost - y3_balance - tax3)
    gap = r2(free2 - floor)
    div_hold = r2(gap * 0.19)
    div_tax = r2(min(gap, 6000) * 0.19 + max(0.0, gap - 6000) * 0.21)
    low = min(months, key=lambda m: m["end"])
    cheap = min(lot, key=lambda u: u["cost"])
    assert months[0]["end"] == r2(100000 - six - REFORM - KIT - FIXED)
    assert identity_y1 == y1[-1]["end"]
    assert identity == months[-1]["end"]
    assert min(m["end"] for m in months) >= floor - 0.01
    assert free >= floor - 0.01
    assert free2 >= floor - 0.01
    assert free3 >= floor - 0.01
    assert y2[-1]["stock"] > y1[-1]["stock"]
    assert months[-1]["stock"] > y2[-1]["stock"]
    assert sales_n == 22
    assert abs(tax - y1_tax) < 0.02
    assert abs(y1_result - r2(ebitda - interest - tax)) < 0.02
    weak_months = [m for m in months if m["n"] > 1 and m["sobra"] <= 0]
    for m in months:
        if m["n"] == 1:
            continue
        assert abs(m["sal"] - scheduled_salary(m["n"], m["open_stock"])) < 0.02
    assert abs(y_net - nets3) < 0.02
    assert dscr2 > 1.5 and dscr3 > 1.5
    totals = {
        "cars": 7,
        "cost": r2(sum(u["cost"] for u in lot)),
        "sell": r2(sum(u["sell"] for u in lot)),
        "rebu": r2(sum(u["rebu"] for u in lot)),
        "net": r2(sum(u["net"] for u in lot)),
    }
    return {
        "lot": lot,
        "held": held,
        "opening": opening,
        "months": y1,
        "all_months": months,
        "y2_months": y2,
        "floor": floor,
        "sales": sales,
        "sales_n": sales_n,
        "purchases": purchases,
        "gastos": gastos,
        "gastos_fijos": r2(gastos - sal_year),
        "salary": sal_year,
        "spans": spans,
        "smi_net": pocket(SMI),
        "live_net": pocket(LIVE),
        "iva": iva,
        "nets": nets,
        "ebitda": ebitda,
        "tax": tax,
        "free": free,
        "free_gap": r2(free - floor),
        "result": r2(ebitda - interest - tax),
        "dscr": dscr,
        "dscr_txt": f"{dscr:.2f}".replace(".", ","),
        "dscr23": dscr23,
        "dscr23_txt": f"{dscr23:.2f}".replace(".", ","),
        "dscr5": dscr5,
        "dscr5_txt": f"{dscr5:.2f}".replace(".", ","),
        "merc_n": merc["n"],
        "end_stock": y1[-1]["stock"],
        "kit": KIT,
        "interest": interest,
        "principal": MODEL["loan"]["y1_principal"],
        "balance": MODEL["loan"]["y1_balance"],
        "y2_interest": y2_interest,
        "y2_principal": y2_principal,
        "y2_balance": y2_balance,
        "y2_sales": sales2,
        "y2_sales_n": sales2_n,
        "y2_nets": nets2,
        "y2_salary": sal2,
        "y2_ebitda": ebitda2,
        "y2_base": base2,
        "y2_reduc": reduc2,
        "y2_tax": tax2,
        "y2_tax_plain": tax2_plain,
        "y2_save": r2(tax2_plain - tax2),
        "y2_result": result2,
        "y2_dscr": dscr2,
        "y2_dscr_txt": f"{dscr2:.2f}".replace(".", ","),
        "y2_end": y2[-1]["end"],
        "y2_stock": y2[-1]["stock"],
        "y2_stock_cost": r2(sum(u["cost"] for u in stock)),
        "y2_free": free2,
        "y2_gap": r2(free2 - floor),
        "y2_pocket": POCKET_Y2,
        "sal_cost": r2(GROSS_Y2 * 0.85),
        "div_same": r2(POCKET_Y2 / 0.81),
        "div_pretax": r2(r2(POCKET_Y2 / 0.81) / 0.85),
        "y3_months": y3,
        "y3_interest": y3_interest,
        "y3_principal": y3_principal,
        "y3_balance": y3_balance,
        "y3_sales": sales3,
        "y3_sales_n": sales3_n,
        "y3_nets": nets3,
        "y3_salary": sal3,
        "y3_ebitda": ebitda3,
        "y3_base": base3,
        "y3_reduc": reduc3,
        "y3_tax": tax3,
        "y3_tax_plain": tax3_plain,
        "y3_save": r2(tax3_plain - tax3),
        "y3_result": result3,
        "y3_dscr": dscr3,
        "y3_dscr_txt": f"{dscr3:.2f}".replace(".", ","),
        "y3_end": months[-1]["end"],
        "y3_stock": months[-1]["stock"],
        "y3_free": free3,
        "y3_gap": r2(free3 - floor),
        "y3_pocket": POCKET_Y3,
        "div_hold": div_hold,
        "div_tax": div_tax,
        "div_pocket": r2(gap - div_tax),
        "equity": equity,
        "min_cash": low["end"],
        "min_n": low["n"],
        "cheap": cheap,
        "reform_tax": r2(REFORM * 0.15),
        "sales_all_n": sales_n + sales2_n,
        "service": service,
        "thin": thin,
        "thin_gap": r2(thin["net"] - (FIXED + LIVE)),
        "weak": weak,
        "gain_max": 12000,
        "cash_max": 30000,
        "totals": totals,
        "avg_net": r2(totals["net"] / 7),
        "avg_sell": r2(totals["sell"] / 7),
        "avg_cost": r2(totals["cost"] / 7),
        "avg_rebu": r2(totals["rebu"] / 7),
    }


S = simulate()
assert S["y2_pocket"] == POCKET_Y2
assert S["y3_pocket"] == POCKET_Y3
assert S["reform_tax"] == 682.50


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
    c.drawCentredString(W / 2, 18, "Solicitud de financiación  ·  50.000 €  ·  36 meses")
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
    c.drawString(36, 234, "Treinta y seis meses. Más coches en el suelo, más ventas al mes.")
    stats = [
        ("50.000 €", "Lo que se pide"),
        ("36 meses", "El plan, desde el día 1"),
        ("6 → " + str(S["y3_stock"]), "Coches. El stock no se queda en seis"),
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
        ("02", "El cliente", "Galicia, y envío a toda España. El precio publicado va de 12.000 a 24.000 €: se decide y se financia en días."),
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
        ("4", "Quedan", eur(S["avg_net"], True), "Venta menos coste menos ese IVA. Es el margen. La media de los siete, al precio de la web."),
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
        "Estos son los precios de khcimport.autos el 11 de octubre de 2026. El 116d, 12.475 €. El 318d, 17.250 €. Los otros cinco coinciden con el plan de cuatro páginas. El coste no se toca.",
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
    heading(c, "Los gastos que no paran", "Cinco partidas cada mes. El sueldo no está aquí.", size=18)
    lines = [
        ("Nave, San Marcos", RENT, "Alquiler. La licencia ya existe."),
        ("Autónomo societario", RETA, "Seguridad Social. No es un sueldo."),
        ("Portales y gestoría", MKT, "Coches.net, Milanuncios Pro y la gestoría."),
        ("Luz, agua y vado", UTIL, "Suministros de la nave."),
        ("Cuota del préstamo", QUOTA, "50.000 €, 5,50 %, 60 meses. Exacta."),
    ]
    maxv = RENT
    y = 400
    for name, val, note in lines:
        c.setFillColor(GOLD)
        c.roundRect(248, y - 2, 250 * (val / maxv), 14, 2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVu", 11)
        c.drawString(36, y, name)
        c.setFont("DejaVuBold", 11)
        c.drawRightString(590, y, eur(val, True))
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 9)
        c.drawString(608, y, note)
        y -= 38
    c.setFillColor(COVER)
    c.roundRect(36, y - 6, 888, 32, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 11)
    c.drawString(48, y + 4, "Cada mes, haya venta o no. Sin el sueldo.")
    c.setFillColor(GOLD)
    c.drawRightString(908, y + 4, eur(FIXED, True))
    wrap(
        c,
        "El mes 1, antes de comprar, suma el equipo de revisión, 822,90 €, y la reforma, 4.550 €. La obra la hace el promotor: suelo 1.800, luz 1.100, aseos 1.300 y extintores 350. De la cuota, en el año, 2.527,03 € son intereses y 8.933,69 € reducen la deuda.",
        "DejaVu", 10, 36, y - 28, 888, 13.5, INK, 3,
    )
    wrap(
        c,
        "El sueldo va en la lámina siguiente: no empieza el día 1, y sube. No están, y se dice para que no parezca un olvido: el taller (aceite y filtros, 116,60 € a precio cerrado, sin mano de obra) y la cuota de una SGR, 1.000 €, solo si el aval es de una SGR.",
        "DejaVu", 10, 36, 118, 888, 13.5, SLATE, 3,
    )
    footer(c, n, total)


def span_label(span):
    if span["from"] == span["to"]:
        return "MES " + str(span["from"])
    return "MESES " + str(span["from"]) + "–" + str(span["to"])


def span_note(span):
    if span["sal"] == 0:
        return "Lo cubre el colchón familiar de 25.000 €. Ese dinero no entra en la empresa."
    if abs(span["sal"] - SMI) < 0.01:
        return "Salario mínimo de 2026, en 12 pagas. Él recibe " + eur(S["smi_net"], True) + "."
    return "Los 25.000 € del proyecto, en doce meses. El bruto se queda. El primer año él recibe " + eur(S["live_net"], True) + ". En el segundo, con el 35 %, " + eur(S["y2_pocket"], True) + "."


def draw_salary(c, n, total):
    bg(c)
    heading(c, "El sueldo de la familia", "Cinco personas. Sube cada año. La empresa no se para.", size=18)
    steps = [
        ("MESES 1–5", "0 €", "Lo cubre el colchón", "de 25.000 €. Fuera."),
        ("MESES 6–12", eur(POCKET_Y1, True), "Puente. Bruto " + eur(LIVE), "Retiene el 19 %."),
        ("MESES 13–24", eur(POCKET_Y2, True), "Bruto " + eur(GROSS_Y2), "Retiene el 35 %."),
        ("MESES 25–36", eur(POCKET_Y3, True), "Bruto " + eur(GROSS_Y3), "Retiene el 35 %."),
    ]
    x = 36
    for lab, val, a, b in steps:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 292, 210, 128, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 418, 210, 2.2, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(x + 14, 396, lab)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 18)
        c.drawString(x + 14, 362, val)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8.5)
        c.drawString(x + 14, 334, a)
        c.drawString(x + 14, 320, b)
        x += 222
    c.setFillColor(CARD)
    c.roundRect(36, 168, 888, 108, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(36, 168, 3, 108, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("DejaVuBold", 12)
    c.drawString(52, 248, "Por encima de una caja de supermercado. Y sube.")
    wrap(
        c,
        "Mercadona, 2026: 1.734 € brutos al empezar y 2.346 € al cuarto año, en 14 pagas, más variable. Aquí, desde el mes 13, son 2.500 € en el bolsillo. Desde el mes 25, 3.000 €. No se sube el puente: a 1.800 € el stock se queda en ocho y el año 3 recorta el sueldo.",
        "DejaVu", 10, 52, 226, 850, 13.5, SLATE, 3,
    )
    c.setFillColor(INK)
    c.setFont("DejaVu", 9.5)
    wrap(
        c,
        "Mujer y tres hijas, de 1, 6 y 16 años. El mínimo de Hacienda, si viven con él, no ganan 8.000 € y no declaran más de 1.800 €, son 17.450 €. Baja el IRPF de la declaración. No baja la retención del 35 % y no paga el alquiler de este mes. El cargo es gratuito si los estatutos no dicen lo contrario: la sociedad aún no está hecha, y se escribe ahí. El autónomo, " + eur(RETA, True) + ", se paga desde el mes 1 y no es un sueldo.",
        "DejaVu", 9, 36, 132, 888, 12.5, INK, 4,
    )
    footer(c, n, total)


def draw_rule(c, n, total):
    bg(c)
    heading(c, "La regla del año", "Dos ventas al mes. Se reponen en la semana. El stock crece.", size=17)
    rules = [
        ("1", "El mes 1 caben seis.", "Primero el equipo, 822,90 €. Después seis coches y la reforma. El Mercedes no cabe sin bajar del fondo. Entra el mes " + str(S["merc_n"]) + "."),
        ("2", "El fondo son tres meses.", eur(S["floor"], True) + ". Nave, autónomo, portales, luz y cuota. El sueldo se paga encima y no se toca este fondo."),
        ("3", "Dos ventas. Reposición en la semana.", "Desde el mes 2. Se pide a los dos días. En una semana está en España, publicado, con matrícula temporal. Se puede ver y probar."),
        ("4", "Más suelo, más ventas.", "Una de cada tres, nunca menos de dos. Año 1: " + str(S["end_stock"]) + ". Año 2: " + str(S["y2_stock"]) + ". Año 3: " + str(S["y3_stock"]) + ". Con 15, cinco. No se inventa un modelo."),
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
        ("El mes: nave, autónomo, portales, luz y cuota. Sin sueldo.", "−" + eur(FIXED, True), False),
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
    heading(c, "Mes 2", "Dos ventas. Las dos se reponen en la semana.", size=20)
    m = S["months"][1]
    rows = [("Caja con la que se abre el mes", eur(S["months"][0]["end"], True), False),
            ("El mes: nave, autónomo, portales, luz y cuota. Sin sueldo.", "−" + eur(FIXED, True), False)]
    for car in m["sold_units"]:
        rows.append((car["nick"] + ", cobrado y repuesto", "+" + eur(car["net"], True), False))
    rows.append(("Caja al cerrar el mes. El Mercedes sigue fuera.", eur(m["end"], True), True))
    waterfall(c, rows, 400)
    wrap(
        c,
        "El precio no se queda parado. A los dos días se pide otro. Como máximo, en una semana está en España, con matrícula temporal, y ya se publica: se puede ver y probar mientras se hace la ITV. El Mercedes todavía no cabe. Entra el mes " + str(S["merc_n"]) + ", sin bajar del fondo. Lo que sobra este mes, después del gasto, son " + eur(m["sobra"], True) + ".",
        "DejaVu", 10.5, 36, 148, 888, 14, INK, 4,
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
    heading(c, "El primer año", "Verde, lo que dejan las ventas. Dorado, lo que cuesta el mes.", size=16)
    x, y, w, h = 36, 78, 888, 340
    ymax = S["gain_max"]
    ix, iy, iw, ih = plot_frame(c, x, y, w, h, 0, ymax, [0, 4000, 8000, 12000])
    bw = 14
    for i, m in enumerate(S["months"]):
        cx = slot_x(ix, iw, i)
        gold_h = m["bill"] / ymax * ih
        c.setFillColor(GOLD)
        c.rect(cx - bw - 1, iy, bw, gold_h, fill=1, stroke=0)
        if m["n"] > 1:
            gh = m["margen"] / ymax * ih
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
    c.drawString(62, 58, "El mes, con el sueldo cuando ya se cobra. Entra el mes 6. Este año no vuelve a subir.")
    c.setFillColor(GREEN)
    c.rect(470, 58, 10, 8, fill=1, stroke=0)
    c.setFillColor(SLATE)
    c.drawString(484, 58, "Margen. El más flojo deja " + eur(S["weak"]["sobra"], True) + ".")
    footer(c, n, total)


def draw_cash_chart(c, n, total):
    bg(c)
    heading(c, "La caja del primer año", "Sube con las ventas. Baja cuando el stock crece.", size=18)
    x, y, w, h = 36, 86, 888, 332
    ymax = S["cash_max"]
    ix, iy, iw, ih = plot_frame(c, x, y, w, h, 0, ymax, [0, 10000, 20000, 30000])
    def py(val):
        return iy + val / ymax * ih
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
    peak = max(S["months"], key=lambda m: m["end"])["n"]
    labels = {1: (0, 12), peak: (0, 12), S["merc_n"]: (0, -16), 12: (0, 12)}
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
    extras = [m for m in S["months"] if m["extras"]]
    extra_txt = ".   ".join("Mes " + str(m["n"]) + ": otro " + join_names(m["extras"]) + ", " + eur(next(u["cost"] for u in S["lot"] if u["nick"] == m["extras"][0])) for m in extras)
    c.setFillColor(INK)
    c.setFont("DejaVu", 8.5)
    c.drawString(48, 62, "Mes " + str(S["merc_n"]) + ": entra el Mercedes, " + eur(S["held"]["cost"]) + ".   " + extra_txt + ".   Mes 12: " + eur(S["months"][-1]["end"], True) + " y " + str(S["end_stock"]) + " coches.")
    footer(c, n, total)


def draw_ledger(c, n, total):
    bg(c)
    kicker(c, "El primer año", 508)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 16)
    c.drawString(36, 484, "Cada mes: qué entra, qué sale, qué queda.")
    c.setFillColor(INK)
    c.rect(28, 460, 904, 16, fill=1, stroke=0)
    heads = [
        (36, "Mes", "l"),
        (60, "Qué ocurre", "l"),
        (318, "Cobro", "r"),
        (400, "Gastos", "r"),
        (482, "Sueldo", "r"),
        (556, "IVA", "r"),
        (646, "Compra", "r"),
        (738, "Sobra", "r"),
        (916, "Caja", "r"),
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
        c.setFont("DejaVu", 7)
        c.drawString(60, y, m["what"])
        c.setFont("DejaVu", 7.5)
        c.drawRightString(318, y, eur(m["cobro"]))
        c.drawRightString(400, y, eur(m["gastos"], True))
        c.setFillColor(GOLD_DEEP if m["sal"] else SLATE)
        c.drawRightString(482, y, "—" if m["sal"] == 0 else eur(m["sal"], True))
        c.setFillColor(INK)
        c.drawRightString(556, y, "—" if m["n"] == 1 else eur(m["iva"], True))
        c.drawRightString(646, y, eur(m["compra"]))
        c.setFillColor(GREEN if m["sobra"] > 0 else SLATE)
        c.setFont("DejaVuBold", 7.5)
        c.drawRightString(738, y, eur(m["sobra"], True))
        c.setFillColor(INK)
        c.drawRightString(916, y, eur(m["end"], True))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7.5)
    c.drawString(36, 64, "Gastos es el mes y el sueldo. El mes 1 suma el equipo y la reforma. El sueldo entra el mes 6, a " + eur(LIVE, True) + ", y no sube hasta el año 2.")
    c.drawString(36, 50, "Sobra es el margen menos el mes y el sueldo. No incluye la compra. Caja = caja anterior + cobro − gastos − IVA − compra. El mes 1, cobro es el capital.")
    footer(c, n, total)


def draw_year(c, n, total):
    bg(c)
    heading(c, "El primer año, en una cuenta", str(S["sales_n"]) + " ventas. El stock pasa de 6 a " + str(S["end_stock"]) + ". La cuota, pagada.", size=16)
    rows = [
        ("Capital, propio y financiado", "+100.000 €", False),
        (str(S["sales_n"]) + " cobros, del mes 2 al mes 12", "+" + eur(S["sales"]), False),
        ("Coches comprados, apertura, reposición y crecimiento", "−" + eur(S["purchases"]), False),
        ("Doce meses, la reforma y el equipo. Sin el sueldo.", "−" + eur(S["gastos_fijos"], True), False),
        ("Sueldo del año. Meses 6 a 12, el puente.", "−" + eur(S["salary"], True), False),
        ("IVA de las " + str(S["sales_n"]) + " ganancias, apartado", "−" + eur(S["iva"], True), False),
        ("Caja al cerrar diciembre", eur(S["months"][-1]["end"], True), True),
    ]
    waterfall(c, rows, 400)
    wrap(
        c,
        "El beneficio del año son " + eur(S["result"], True) + ". El sueldo, " + eur(S["salary"], True) + ", ya está restado. Es el margen, menos la estructura, el sueldo, el equipo, los intereses y el impuesto del 15 %, " + eur(S["tax"], True) + ". Apartado el impuesto, por encima del fondo quedan " + eur(S["free_gap"], True) + ". No es el cierre: el segundo año sigue.",
        "DejaVu", 10, 36, 118, 888, 13, INK, 4,
    )
    footer(c, n, total)


def draw_year2(c, n, total):
    bg(c)
    heading(c, "El segundo año", "Más coches en el suelo. Más ventas. La misma regla.", size=18)
    cards = [
        (str(S["y2_sales_n"]), "Ventas. El primero tuvo " + str(S["sales_n"]) + "."),
        ("8 → " + str(S["y2_stock"]), "Coches. No se queda en ocho."),
        (eur(S["y2_result"]), "Beneficio. El sueldo ya está restado."),
        (S["y2_dscr_txt"], "Veces que se cubre la cuota."),
    ]
    x = 36
    for val, lab in cards:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 352, 216, 78, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 428, 216, 2.2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 20)
        c.drawString(x + 12, 392, val)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8)
        c.drawString(x + 12, 368, lab)
        x += 228
    bands = [
        ("6 a 8 al abrir", "2 ventas", "Hasta el mes 16. El año 2 abre así."),
        ("9 a 11 al abrir", "3 ventas", "El año 2 cierra en tres ventas."),
        ("15 al abrir", "5 ventas", "Año 3. El segundo no llega."),
    ]
    y = 318
    for left, mid, right in bands:
        c.setFillColor(CARD)
        c.roundRect(36, y - 28, 888, 40, 3, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(36, y - 28, 3, 40, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 11)
        c.drawString(52, y - 14, left)
        c.setFillColor(GREEN)
        c.drawString(250, y - 14, mid)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 10)
        c.drawString(380, y - 14, right)
        y -= 48
    wrap(
        c,
        "Una de cada tres, y nunca menos de dos. Con 12 a 14, cuatro: eso es el año 3. Cada venta se repone en la semana. Si después del fondo y de la reserva cabe el " + S["cheap"]["nick"] + " a " + eur(S["cheap"]["cost"]) + ", se compra. El mes 19 paga el impuesto del año 1, " + eur(S["tax"], True) + ". La caja no baja de " + eur(S["floor"], True) + ".",
        "DejaVu", 10, 36, 148, 888, 13.5, INK, 4,
    )
    footer(c, n, total)


def draw_tax(c, n, total):
    bg(c)
    heading(c, "El impuesto", "Qué lo baja de verdad. Qué solo mueve el dinero.", size=18)
    c.setFillColor(GREEN)
    c.roundRect(36, 418, 432, 20, 2, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawString(48, 424, "ESTO SÍ BAJA EL IMPUESTO")
    c.setFillColor(RED)
    c.roundRect(484, 418, 440, 20, 2, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.drawString(496, 424, "ESTO NO LO BAJA")
    left = [
        ("No repartir: " + eur(S["y2_save"], True) + " menos.", "El 20 % de los " + eur(S["result"], True) + " del año 1, si se quedan, son " + eur(S["y2_reduc"], True) + ". El impuesto pasa de " + eur(S["y2_tax_plain"], True) + " a " + eur(S["y2_tax"], True) + ". Se mantiene 3 años."),
        ("Un gasto real, con factura.", "El sueldo lo es. Una herramienta o una obra, si se hacen. No hay precio cerrado de ninguna de las dos. No se inventa."),
        ("El 15 % dura dos años.", "Sociedad nueva, y los dos ejercicios dan beneficio. El tercero, micropyme: 17 % hasta 50.000 € y 20 % el resto."),
        ("La reforma, aparte.", eur(REFORM) + " ya salieron de caja y no están en esta base. Si la gestoría la admite, bajaría " + eur(S["reform_tax"], True) + ". No cambia las compras."),
    ]
    right = [
        ("Comprar coches.", "El stock es un activo, no un gasto. La caja baja. El impuesto, no."),
        ("Pagar el préstamo.", "Solo el interés, " + eur(S["y2_interest"], True) + ", es gasto. El principal, " + eur(S["y2_principal"], True) + ", no."),
        ("Gastar lo apartado para el impuesto.", "Se calcula sobre el beneficio, no sobre la caja. Gastarlo no lo reduce, y puede faltar al pagarlo."),
        ("Aplazar o repartir.", "La reserva de nivelación aplaza y se revierte en 5 años. Un dividendo tampoco baja el impuesto: ya tributó."),
    ]
    for i, ((lt, lb), (rt, rb)) in enumerate(zip(left, right)):
        y = 388 - i * 84
        c.setFillColor(CARD)
        c.roundRect(36, y - 68, 432, 76, 3, fill=1, stroke=0)
        c.setFillColor(GREEN)
        c.rect(36, y - 68, 3, 76, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 9.5)
        c.drawString(50, y - 14, lt)
        wrap(c, lb, "DejaVu", 8, 50, y - 30, 404, 11, SLATE, 3)
        c.setFillColor(CARD)
        c.roundRect(484, y - 68, 440, 76, 3, fill=1, stroke=0)
        c.setFillColor(RED)
        c.rect(484, y - 68, 3, 76, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 9.5)
        c.drawString(498, y - 14, rt)
        wrap(c, rb, "DejaVu", 8, 498, y - 30, 410, 11, SLATE, 3)
    footer(c, n, total)


def draw_pay(c, n, total):
    bg(c)
    heading(c, "Sueldo, no dividendo", "El sueldo paga este mes. El dividendo, una vez.", size=18)
    c.setFillColor(INK)
    c.rect(36, 400, 888, 22, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawString(48, 407, "")
    c.drawRightString(620, 407, "EL SUELDO")
    c.drawRightString(900, 407, "UN DIVIDENDO")
    rows = [
        ("Cuándo", "Cada mes, desde el 13", "Una vez, al cerrar el año 2"),
        ("Él recibe", eur(POCKET_Y2, True) + " / mes. Luego " + eur(POCKET_Y3, True), eur(S["div_pocket"], True) + " una vez"),
        ("Le cuesta a la empresa", eur(S["sal_cost"], True) + " por mes, al 15 %", eur(S["div_pretax"], True) + " para el mismo mes"),
        ("Los coches", "Siguen. Año 2: " + str(S["y2_stock"]) + ". Año 3: " + str(S["y3_stock"]), "Salen " + eur(S["y2_gap"], True) + ". No llega el " + S["cheap"]["nick"]),
        ("¿Se hace?", "Sí. Es el plan.", "No. La caja se queda en el fondo."),
    ]
    for i, (lab, a, b) in enumerate(rows):
        y = 368 - i * 36
        last = i == len(rows) - 1
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 10, 888, 34, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 9)
        c.drawString(48, y, lab)
        c.setFont("DejaVuBold", 9)
        c.setFillColor(GREEN if not last else GOLD)
        c.drawRightString(620, y, a)
        c.setFillColor(GOLD if last else SLATE)
        c.drawRightString(900, y, b)
    notes = [
        ("La familia", "El mínimo de 17.450 € baja la declaración del sueldo. El dividendo no lo usa. La retención del 35 % no mira a las hijas."),
        ("Este mes", "2.500 € entran ahora. Si la declaración devuelve algo, llega al año siguiente. No paga el alquiler de hoy."),
        ("Lo que es suyo", "A los 36 meses, " + eur(S["equity"], True) + " dentro: caja y coches, menos préstamo e impuesto. El sueldo ya se cobró."),
    ]
    x = 36
    for title, body in notes:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 48, 286, 92, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 138, 286, 2, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", 9)
        c.drawString(x + 12, 118, title)
        wrap(c, body, "DejaVu", 8, x + 12, 100, 262, 11, SLATE, 4)
        x += 302
    footer(c, n, total)


def draw_ledger2(c, n, total):
    bg(c)
    kicker(c, "El segundo año", 508)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 16)
    c.drawString(36, 484, "Misma regla. Más ventas, porque hay más coches.")
    c.setFillColor(INK)
    c.rect(28, 460, 904, 16, fill=1, stroke=0)
    heads = [
        (36, "Mes", "l"),
        (64, "Qué ocurre", "l"),
        (340, "Cobro", "r"),
        (418, "Gastos", "r"),
        (496, "Sueldo", "r"),
        (566, "IVA", "r"),
        (656, "Compra", "r"),
        (748, "Sobra", "r"),
        (916, "Caja", "r"),
    ]
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 7)
    for x, lab, al in heads:
        if al == "r":
            c.drawRightString(x, 464, lab)
        else:
            c.drawString(x, 464, lab)
    for i, m in enumerate(S["y2_months"]):
        y = 438 - i * 30
        if m["kind"] == "extra":
            c.setFillColor(Color(0.90, 0.95, 0.91))
        elif i % 2 == 0:
            c.setFillColor(CARD)
        else:
            c.setFillColor(SOFT)
        c.rect(28, y - 8, 904, 28, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(36, y, str(m["n"]))
        c.setFillColor(INK)
        size = 6.4 if c.stringWidth(m["what"], "DejaVu", 7) > 268 else 7
        c.setFont("DejaVu", size)
        c.drawString(64, y, m["what"])
        c.setFont("DejaVu", 7.5)
        c.drawRightString(340, y, eur(m["cobro"]))
        c.drawRightString(418, y, eur(m["gastos"], True))
        c.setFillColor(GOLD_DEEP)
        c.drawRightString(496, y, eur(m["sal"], True))
        c.setFillColor(INK)
        c.drawRightString(566, y, eur(m["iva"], True))
        c.drawRightString(656, y, eur(m["compra"]))
        c.setFillColor(GREEN if m["sobra"] > 0 else GOLD_DEEP)
        c.setFont("DejaVuBold", 7.5)
        c.drawRightString(748, y, eur(m["sobra"], True))
        c.setFillColor(INK)
        c.drawRightString(916, y, eur(m["end"], True))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7.5)
    c.drawString(36, 64, "Sueldo " + eur(GROSS_Y2, True) + ". Los meses 13 y 14, en oro, no lo cubren: dos coches baratos. La caja aguanta. El mes 19 paga el impuesto del año 1, " + eur(S["tax"], True) + ".")
    c.drawString(36, 50, "Verde: se compra un " + S["cheap"]["nick"] + " de más, a " + eur(S["cheap"]["cost"]) + ". Cierra con " + str(S["y2_stock"]) + " coches y " + eur(S["y2_end"], True) + ". Por encima del fondo, " + eur(S["y2_gap"], True) + ": no llega.")
    footer(c, n, total)


def draw_cash24(c, n, total):
    bg(c)
    heading(c, "Treinta y seis meses de caja", "Sube con las ventas. Baja cuando el stock crece. No se queda parada.", size=16)
    x, y, w, h = 36, 78, 888, 332
    ymax = S["cash_max"]
    ix, iy, iw, ih = plot_frame(c, x, y, w, h, 0, ymax, [0, 10000, 20000, 30000])

    def py(val):
        return iy + val / ymax * ih

    fy = py(S["floor"])
    c.setStrokeColor(GOLD)
    c.setDash(3, 2)
    c.setLineWidth(1.2)
    c.line(ix, fy, ix + iw, fy)
    c.setDash()
    rows = S["all_months"]
    pts = [(slot_x(ix, iw, i, len(rows)), py(m["end"])) for i, m in enumerate(rows)]
    c.setFillColor(GREEN_SOFT)
    p = c.beginPath()
    p.moveTo(pts[0][0], iy)
    for px, py_ in pts:
        p.lineTo(px, py_)
    p.lineTo(pts[-1][0], iy)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(INK)
    c.setLineWidth(1.6)
    path = c.beginPath()
    path.moveTo(pts[0][0], pts[0][1])
    for px, py_ in pts[1:]:
        path.lineTo(px, py_)
    c.drawPath(path, stroke=1, fill=0)
    mark = {S["min_n"]: -14, 24: 12}
    for i, m in enumerate(rows):
        px, py_ = pts[i]
        c.setFillColor(GOLD if m["n"] in (S["merc_n"], 19, 31) or m["extras"] else INK)
        c.circle(px, py_, 2.6, fill=1, stroke=0)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 6.5)
        c.drawCentredString(px, iy - 12, str(m["n"]))
        if m["n"] in mark:
            c.setFillColor(INK)
            c.setFont("DejaVuBold", 7)
            c.drawCentredString(px, py_ + mark[m["n"]], eur(m["end"]))
        elif m["n"] == 36:
            c.setFillColor(INK)
            c.setFont("DejaVuBold", 7)
            c.drawRightString(px - 8, py_ - 22, eur(m["end"]))
    fund = "Fondo  " + eur(S["floor"])
    c.setFont("DejaVuBold", 8)
    tw = c.stringWidth(fund, "DejaVuBold", 8)
    c.setFillColor(WHITE)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.roundRect(ix + 8, fy + 6, tw + 12, 14, 2, fill=1, stroke=1)
    c.setFillColor(GOLD_DEEP)
    c.drawString(ix + 14, fy + 9, fund)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8)
    c.drawString(36, 56, "Mínimo, mes " + str(S["min_n"]) + ": " + eur(S["min_cash"], True) + ".   Dorado: un coche de más, o el impuesto.   Mes 19 y mes 31.   Mes 36: " + eur(S["y3_end"], True) + " y " + str(S["y3_stock"]) + " coches.")
    footer(c, n, total)


def draw_account(c, n, total):
    bg(c)
    heading(c, "Los tres años", "La misma empresa. El tercero ya no es el de arrancar.", size=18)
    c.setFillColor(INK)
    c.rect(36, 418, 888, 20, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DejaVuBold", 8)
    c.drawRightString(520, 424, "AÑO 1")
    c.drawRightString(700, 424, "AÑO 2")
    c.drawRightString(900, 424, "AÑO 3")
    rows = [
        ("Ventas", str(S["sales_n"]), str(S["y2_sales_n"]), str(S["y3_sales_n"]), False),
        ("Cobros", eur(S["sales"]), eur(S["y2_sales"]), eur(S["y3_sales"]), False),
        ("Margen de las ventas", eur(S["nets"], True), eur(S["y2_nets"], True), eur(S["y3_nets"], True), False),
        ("Sueldo", eur(S["salary"], True), eur(S["y2_salary"], True), eur(S["y3_salary"], True), False),
        ("Intereses del préstamo", eur(S["interest"], True), eur(S["y2_interest"], True), eur(S["y3_interest"], True), False),
        ("Impuesto de sociedades", eur(S["tax"], True), eur(S["y2_tax"], True), eur(S["y3_tax"], True), False),
        ("Beneficio, sueldo ya restado", eur(S["result"], True), eur(S["y2_result"], True), eur(S["y3_result"], True), True),
        ("Caja al cerrar", eur(S["months"][-1]["end"], True), eur(S["y2_end"], True), eur(S["y3_end"], True), False),
        ("Coches en el suelo", str(S["end_stock"]), str(S["y2_stock"]), str(S["y3_stock"]), False),
        ("Deuda del préstamo", eur(S["balance"], True), eur(S["y2_balance"], True), eur(S["y3_balance"], True), False),
        ("La cuota, veces cubierta", S["dscr_txt"], S["y2_dscr_txt"], S["y3_dscr_txt"], False),
    ]
    for i, (lab, a, b, d, last) in enumerate(rows):
        y = 390 - i * 28
        c.setFillColor(COVER if last else (CARD if i % 2 == 0 else SOFT))
        c.rect(36, y - 6, 888, 26, fill=1, stroke=0)
        c.setFillColor(GOLD if last else INK)
        c.setFont("DejaVuBold" if last else "DejaVu", 9)
        c.drawString(52, y, lab)
        c.setFont("DejaVuBold", 9)
        c.drawRightString(520, y, a)
        c.drawRightString(700, y, b)
        c.drawRightString(900, y, d)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8)
    c.drawString(36, 52, "Años 1 y 2, 15 %. Año 3, 17 % y 20 %. La reserva ahorra " + eur(S["y2_save"], True) + " y " + eur(S["y3_save"], True) + ". El impuesto se paga los meses 19 y 31. Al mes 36 la deuda es " + eur(S["y3_balance"], True) + ".")
    footer(c, n, total)


def draw_bank(c, n, total):
    bg(c)
    heading(c, "Lo que mira quien presta", "La cuota se cubre. El stock crece. El sueldo ya está pagado.", size=16)
    years = [
        ("AÑO 1", str(S["sales_n"]) + " ventas", str(S["end_stock"]) + " coches", S["dscr_txt"] + " veces", eur(S["result"], True)),
        ("AÑO 2", str(S["y2_sales_n"]) + " ventas", str(S["y2_stock"]) + " coches", S["y2_dscr_txt"] + " veces", eur(S["y2_result"], True)),
        ("AÑO 3", str(S["y3_sales_n"]) + " ventas", str(S["y3_stock"]) + " coches", S["y3_dscr_txt"] + " veces", eur(S["y3_result"], True)),
    ]
    x = 36
    for title, sales, cars, cover, result in years:
        c.setFillColor(CARD)
        c.setStrokeColor(LINE)
        c.roundRect(x, 214, 286, 176, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.rect(x, 388, 286, 2.2, fill=1, stroke=0)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(x + 16, 360, title)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 16)
        c.drawString(x + 16, 328, result)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 11)
        c.drawString(x + 16, 296, "Beneficio, sueldo restado")
        c.setFillColor(INK)
        c.setFont("DejaVu", 12)
        c.drawString(x + 16, 266, sales)
        c.drawString(x + 16, 246, cars)
        c.drawString(x + 16, 226, "Cuota cubierta " + cover)
        x += 302
    short = [m for m in S["y2_months"] if m["sobra"] < 0]
    wrap(
        c,
        "Los meses " + " y ".join(str(m["n"]) for m in short) + " no cubren el sueldo: dos coches baratos, " + " y ".join(eur(m["sobra"], True) for m in short) + ". La caja no baja del fondo. Por eso el stock no se queda en ocho.",
        "DejaVu", 11, 36, 188, 888, 15, INK, 2,
    )
    facts = [
        (eur(S["y3_balance"], True), "Deuda al mes 36"),
        (eur(S["y3_end"], True), "Caja, con " + str(S["y3_stock"]) + " coches"),
        (eur(S["min_cash"], True), "Mínimo, mes " + str(S["min_n"]) + ". Sobre el fondo"),
    ]
    x = 36
    for val, lab in facts:
        c.setFillColor(SOFT)
        c.roundRect(x, 58, 286, 58, 3, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 14)
        c.drawString(x + 14, 86, val)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8)
        c.drawString(x + 14, 68, lab)
        x += 302
    footer(c, n, total)


def draw_risk(c, n, total):
    bg(c)
    heading(c, "Si no sale como en la tabla", "El primer año. Cada desvío tiene un número.", size=20)
    no_sale = r2(S["months"][0]["end"] - FIXED)
    rows = [
        ("El mes 2 no se vende", eur(no_sale, True) + " en caja. El fondo aguanta. El Mercedes espera al mes " + str(S["merc_n"]) + "."),
        ("Un mes solo sale el 318d", "Con el sueldo ya cobrado, faltan " + eur(abs(S["thin_gap"]), True) + ". El fondo lo absorbe una vez. El plan no se apoya en una sola venta."),
        ("El impuesto es el 23 %, no el 15 %", "La cobertura pasa de " + S["dscr_txt"] + " a " + S["dscr23_txt"] + " veces. Sigue cubriendo la cuota, con margen."),
        ("Todos los precios, un 5 % más bajos", "La cobertura de estas " + str(S["sales_n"]) + " ventas queda en " + S["dscr5_txt"] + " veces. Sigue habiendo colchón."),
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
        "El mes 1 se abre la nave, se paga el equipo y entran seis coches. En 36 meses el stock pasa de seis a " + str(S["y3_stock"]) + ". El sueldo entra el mes 6. Desde el mes 13 son " + eur(POCKET_Y2, True) + " en el bolsillo. Desde el mes 25, " + eur(POCKET_Y3, True) + ". El beneficio no se reparte. Lo que se pide es una oferta de tipo y de plazo.",
        "DejaVu", 13, 36, 286, 880, 18, Color(0.78, 0.76, 0.70), 3,
    )
    stats = [
        ("50.000 €", "Financiación"),
        (eur(S["y3_result"], True), "Beneficio del tercer año"),
        (S["y3_dscr_txt"] + " veces", "La cuota, en ese año"),
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
        "Costes, nave y reforma: el plan de cuatro páginas. La venta, de khcimport.autos el 11 de octubre de 2026. El coste ya incluye transporte y matriculación. No se resta otra vez.",
        "La cuota de 955,06 € es la exacta al 5,50 % y 60 meses. El plan la redondea a 966 €. Intereses: " + eur(S["interest"], True) + ", " + eur(S["y2_interest"], True) + " y " + eur(S["y3_interest"], True) + ". Al mes 36 la deuda es " + eur(S["y3_balance"], True) + ".",
        "El autónomo, " + eur(RETA, True) + ", es la cuota mínima de 2026: base 1.424,40 € por 31,5 %. Las cuatro páginas usaban 380 €. No es un sueldo.",
        "El sueldo no lo obliga la ley. El artículo 217 de la Ley de Sociedades de Capital dice que el cargo es gratuito si los estatutos no lo prevén. La sociedad aún no está constituida.",
        "Sueldo: meses 6 a 12, " + eur(LIVE, True) + " brutos y " + eur(POCKET_Y1, True) + " de bolsillo. Meses 13 a 24, " + eur(GROSS_Y2, True) + " y " + eur(POCKET_Y2, True) + ". Meses 25 a 36, " + eur(GROSS_Y3, True) + " y " + eur(POCKET_Y3, True) + ". Sube si el año anterior se cobró entero y el stock no bajó.",
        "Retención del administrador: 19 % el primer año. Después, 35 %, porque el anterior factura " + eur(S["sales"]) + ". Es un tipo fijo. No baja por las hijas. Es un anticipo, no el impuesto final.",
        "Impuesto de sociedades: 15 % los dos primeros años con beneficio. El tercero, micropyme: 17 % hasta 50.000 € y 20 % el resto. La reserva ahorra " + eur(S["y2_save"], True) + " y " + eur(S["y3_save"], True) + ", y se mantiene 3 años.",
        "El fondo de " + eur(S["floor"], True) + " es tres meses de los gastos que no paran. El sueldo va encima. La reserva del impuesto no compra coches. La reforma de " + eur(REFORM) + " salió de caja y no está en la base.",
        "Ventas: una de cada tres, nunca menos de dos. Reposición en la semana. Solo los siete modelos con coste cerrado. El dividendo de la lámina usa la escala del ahorro sobre " + eur(S["y2_gap"], True) + ". No es una liquidación.",
        "Mercadona, 2026, según ABC y El Debate: 1.734 € brutos el primer año y 2.346 € el cuarto, en 14 pagas, más variable. Es la comparación. No es el sueldo de este plan.",
    ]
    y = 408
    for item in items:
        c.setFillColor(GOLD)
        c.circle(46, y + 3, 2.2, fill=1, stroke=0)
        h = wrap(c, item, "DejaVu", 9, 60, y, 860, 12, INK, 3)
        y -= h + 6
    footer(c, n, total)


SLIDES = [
    draw_cover, draw_business, draw_method, draw_lot, draw_program, draw_engines,
    draw_expenses, draw_salary, draw_rule, draw_m1, draw_m2, draw_gains, draw_cash_chart,
    draw_ledger, draw_year, draw_year2, draw_tax, draw_pay, draw_ledger2,
    draw_cash24, draw_account, draw_bank, draw_risk, draw_close, draw_sources,
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
    ymax = S["gain_max"]
    for t in (0, 4000, 8000, 12000):
        yy = height - bottom - t / ymax * ih
        parts.append(f'<line x1="{left}" y1="{yy:.1f}" x2="{width-8}" y2="{yy:.1f}" stroke="#e8e2d6" stroke-dasharray="2 3"/>')
        parts.append(f'<text x="{left-6}" y="{yy+3:.1f}" text-anchor="end" font-size="11" fill="#4a5872">{k(t)}</text>')
    bw = 10
    for i, m in enumerate(S["months"]):
        cx = left + (i + 0.5) * iw / 12
        gh = m["bill"] / ymax * ih
        parts.append(f'<rect x="{cx-bw-1:.1f}" y="{height-bottom-gh:.1f}" width="{bw}" height="{gh:.1f}" fill="#b3934e"/>')
        if m["n"] > 1:
            mh = m["margen"] / ymax * ih
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
    ymax = S["cash_max"]
    def Y(v):
        return height - bottom - v / ymax * ih
    parts = [f'<svg viewBox="0 0 {width} {height}" width="100%" role="img">']
    for t in (0, 10000, 20000, 30000):
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


def svg_cash24():
    width, height = 880, 260
    left, bottom, top = 52, 24, 16
    iw, ih = width - left - 10, height - bottom - top
    rows = S["all_months"]

    def X(i):
        return left + (i + 0.5) * iw / len(rows)

    ymax = S["cash_max"]

    def Y(v):
        return height - bottom - v / ymax * ih

    parts = [f'<svg viewBox="0 0 {width} {height}" width="100%" role="img">']
    for t in (0, 10000, 20000, 30000):
        yy = Y(t)
        parts.append(f'<line x1="{left}" y1="{yy:.1f}" x2="{width-8}" y2="{yy:.1f}" stroke="#e8e2d6" stroke-dasharray="2 3"/>')
        parts.append(f'<text x="{left-6}" y="{yy+3:.1f}" text-anchor="end" font-size="11" fill="#4a5872">{k(t)}</text>')
    fy = Y(S["floor"])
    parts.append(f'<line x1="{left}" y1="{fy:.1f}" x2="{width-8}" y2="{fy:.1f}" stroke="#b3934e" stroke-dasharray="4 3"/>')
    pts = " ".join(f"{X(i):.1f},{Y(m['end']):.1f}" for i, m in enumerate(rows))
    area = f"{X(0):.1f},{height-bottom} " + pts + f" {X(len(rows)-1):.1f},{height-bottom}"
    parts.append(f'<polygon points="{area}" fill="#dceee4"/>')
    parts.append(f'<polyline points="{pts}" fill="none" stroke="#0a1020" stroke-width="2"/>')
    for i, m in enumerate(rows):
        parts.append(f'<circle cx="{X(i):.1f}" cy="{Y(m["end"]):.1f}" r="2.4" fill="#0a1020"/>')
        parts.append(f'<text x="{X(i):.1f}" y="{height-6}" text-anchor="middle" font-size="7" fill="#4a5872">{m["n"]}</text>')
    parts.append("</svg>")
    return "".join(parts)


def write_html():
    lot_rows = "".join(
        f"<tr><td>{esc(short(u['name']))}</td><td class='num'>{esc(eur(u['cost']))}</td><td class='num'>{esc(eur(u['sell']))}</td><td class='num'>{esc(eur(u['net'], True))}</td></tr>"
        for u in S["lot"]
    )
    year_rows = "".join(
        f"<tr class='{m['kind']}'><td>{m['n']}</td><td>{esc(m['what'])}</td><td class='num'>{esc(eur(m['cobro']))}</td><td class='num'>{esc(eur(m['gastos'], True))}</td><td class='num'>{'—' if m['sal']==0 else esc(eur(m['sal'], True))}</td><td class='num'>{'—' if m['n']==1 else esc(eur(m['iva'], True))}</td><td class='num'>{esc(eur(m['compra']))}</td><td class='num'>{esc(eur(m['sobra'], True))}</td><td class='num'><b>{esc(eur(m['end'], True))}</b></td></tr>"
        for m in S["months"]
    )
    y2_rows = "".join(
        f"<tr class='{m['kind']}'><td>{m['n']}</td><td>{esc(m['what'])}</td><td class='num'>{esc(eur(m['cobro']))}</td><td class='num'>{esc(eur(m['gastos'], True))}</td><td class='num'>{esc(eur(m['sal'], True))}</td><td class='num'>{esc(eur(m['iva'], True))}</td><td class='num'>{esc(eur(m['compra']))}</td><td class='num'>{esc(eur(m['sobra'], True))}</td><td class='num'><b>{esc(eur(m['end'], True))}</b></td></tr>"
        for m in S["y2_months"]
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
  <p>Otros 50.000 € son capital propio. Santiago de Compostela. Treinta y seis meses. Más coches en el suelo, más ventas al mes.</p>
  <div class="grid3">
    <div class="stat"><b>50.000 €</b><span>Lo que se pide</span></div>
    <div class="stat"><b>36 meses</b><span>El plan, desde el día 1</span></div>
    <div class="stat"><b>6 → {S['y3_stock']}</b><span>Coches. El stock no se queda en seis</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>01</span></footer>
</section>
<section class="slide">
  <p class="kicker">Qué es la empresa</p>
  <h1>Se venden coches seleccionados. No se vende una importación.</h1>
  <div class="line"><span>Coches de ocasión, nacionales o de fuera. Se compra donde el número cierra.</span></div>
  <div class="line"><span>Galicia, y envío a toda España. Precio publicado entre 12.000 y 24.000 €.</span></div>
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
    <article><b>{esc(eur(S['avg_net'], True))}</b><p class="muted">Lo que queda, de media, al precio de la web.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>03</span></footer>
</section>
<section class="slide">
  <p class="kicker">Los siete coches del plan</p>
  <h1>Esto es el stock.</h1>
  <table><thead><tr><th>Coche</th><th>Coste</th><th>Venta</th><th>Quedan</th></tr></thead><tbody>{lot_rows}</tbody></table>
  <p class="muted">Precios de khcimport.autos el 11 de octubre de 2026. El 116d, 12.475 €. El 318d, 17.250 €. El coste no se toca.</p>
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
  <p class="kicker">Los gastos que no paran</p>
  <h1>Cinco partidas. El sueldo no está aquí.</h1>
  <div class="line"><span>Nave</span><b>1.100 €</b></div>
  <div class="line"><span>Autónomo societario. No es un sueldo.</span><b>{esc(eur(RETA, True))}</b></div>
  <div class="line"><span>Portales y gestoría</span><b>250 €</b></div>
  <div class="line"><span>Luz, agua y vado</span><b>150 €</b></div>
  <div class="line"><span>Cuota, 5,50 % y 60 meses</span><b>955,06 €</b></div>
  <div class="line total"><span>Cada mes, sin el sueldo</span><b>{esc(eur(FIXED, True))}</b></div>
  <p class="muted">El mes 1 suma el equipo, 822,90 €, y la reforma, 4.550 €. La obra la hace el promotor. El sueldo va en la lámina siguiente.</p>
  <footer><span>KHC AUTO IMPORT</span><span>07</span></footer>
</section>
<section class="slide">
  <p class="kicker">El sueldo de la familia</p>
  <h1>Cinco personas. Sube cada año. La empresa no se para.</h1>
  <div class="grid3">
    <article><b>0 €</b><p class="muted">Meses 1 a 5. Lo cubre el colchón de 25.000 €, fuera de la empresa.</p></article>
    <article><b>{esc(eur(POCKET_Y1, True))}</b><p class="muted">Meses 6 a 12. Puente. Bruto {esc(eur(LIVE, True))}. Retención 19 %.</p></article>
    <article><b>{esc(eur(POCKET_Y2, True))}</b><p class="muted">Meses 13 a 24. Bruto {esc(eur(GROSS_Y2, True))}. Retención 35 %.</p></article>
  </div>
  <div class="line"><span>Meses 25 a 36: {esc(eur(POCKET_Y3, True))} en el bolsillo. Bruto {esc(eur(GROSS_Y3, True))}. Sube si el año anterior se cobró entero y el stock no bajó.</span></div>
  <footer><span>KHC AUTO IMPORT</span><span>08</span></footer>
</section>
<section class="slide">
  <p class="kicker">La regla del año</p>
  <h1>Dos ventas al mes. Se reponen en la semana. El stock crece.</h1>
  <div class="line"><span><b>Mes 1.</b> Primero el equipo, 822,90 €. Después seis coches y la reforma. El Mercedes entra el mes {S['merc_n']}.</span></div>
  <div class="line"><span><b>Fondo.</b> {esc(eur(S['floor'], True))}. Tres meses. El impuesto del año no compra coches.</span></div>
  <div class="line"><span><b>La venta.</b> Dos al mes desde el mes 2. Se pide a los dos días. En una semana está publicada, con matrícula temporal.</span></div>
  <div class="line"><span><b>Más suelo, más ventas.</b> Una de cada tres, nunca menos de dos. Año 1: {S['end_stock']}. Año 2: {S['y2_stock']}. Año 3: {S['y3_stock']}. Con 15, cinco.</span></div>
  <footer><span>KHC AUTO IMPORT</span><span>09</span></footer>
</section>
<section class="slide">
  <p class="kicker">Mes 1</p>
  <h1>Primero el equipo. Después los coches.</h1>
  <div class="line"><span>Capital y financiación</span><b>+100.000 €</b></div>
  <div class="line"><span>Equipo de revisión, antes de comprar</span><b>−822,90 €</b></div>
  <div class="line"><span>Seis coches</span><b>−77.714 €</b></div>
  <div class="line"><span>Reforma, materiales</span><b>−4.550 €</b></div>
  <div class="line"><span>El mes, sin sueldo</span><b>−{esc(eur(FIXED, True))}</b></div>
  <div class="line total"><span>Caja</span><b>{esc(eur(S['months'][0]['end'], True))}</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>10</span></footer>
</section>
<section class="slide">
  <p class="kicker">Mes 2</p>
  <h1>Dos ventas. Las dos se reponen en la semana.</h1>
  <div class="line"><span>Caja al abrir</span><b>{esc(eur(S['months'][0]['end'], True))}</b></div>
  <div class="line"><span>El mes, sin sueldo</span><b>−{esc(eur(FIXED, True))}</b></div>
  <div class="line"><span>GTI, cobrado y repuesto</span><b>+{esc(eur(S['months'][1]['sold_units'][0]['net'], True))}</b></div>
  <div class="line"><span>116d, cobrado y repuesto</span><b>+{esc(eur(S['months'][1]['sold_units'][1]['net'], True))}</b></div>
  <div class="line total"><span>Caja. El Mercedes sigue fuera.</span><b>{esc(eur(S['months'][1]['end'], True))}</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>11</span></footer>
</section>
<section class="slide">
  <p class="kicker">El primer año</p>
  <h1>La barra verde deja más que la dorada.</h1>
  <div class="chart">{svg_gains()}</div>
  <p class="muted">Dorada: el mes, con el sueldo cuando ya se cobra. Verde: el margen. El mes más flojo deja {esc(eur(S['weak']['sobra'], True))}.</p>
  <footer><span>KHC AUTO IMPORT</span><span>12</span></footer>
</section>
<section class="slide">
  <p class="kicker">La caja del primer año</p>
  <h1>Sube con lo que sobra. Baja cuando se compra.</h1>
  <div class="chart">{svg_cash()}</div>
  <p class="muted">Mes {S['merc_n']}, entra el Mercedes. Luego, otro 116d a 9.010 € cuando cabe. Diciembre cierra con {esc(eur(S['months'][-1]['end'], True))} y {S['end_stock']} coches.</p>
  <footer><span>KHC AUTO IMPORT</span><span>13</span></footer>
</section>
<section class="slide">
  <p class="kicker">El primer año</p>
  <h1>Mes a mes.</h1>
  <table><thead><tr><th>Mes</th><th>Qué ocurre</th><th>Cobro</th><th>Gastos</th><th>Sueldo</th><th>IVA</th><th>Compra</th><th>Sobra</th><th>Caja</th></tr></thead><tbody>{year_rows}</tbody></table>
  <p class="muted">El sueldo ya está dentro de gastos. Sobra es el margen menos el mes y el sueldo. El mes 1, cobro es el capital.</p>
  <footer><span>KHC AUTO IMPORT</span><span>14</span></footer>
</section>
<section class="slide">
  <p class="kicker">El primer año, en una cuenta</p>
  <h1>{S['sales_n']} ventas. El stock pasa de 6 a {S['end_stock']}. La cuota, pagada.</h1>
  <div class="line"><span>Capital</span><b>+100.000 €</b></div>
  <div class="line"><span>{S['sales_n']} cobros</span><b>+{esc(eur(S['sales']))}</b></div>
  <div class="line"><span>Coches comprados</span><b>−{esc(eur(S['purchases']))}</b></div>
  <div class="line"><span>Gastos, reforma y equipo. Sin el sueldo.</span><b>−{esc(eur(S['gastos_fijos'], True))}</b></div>
  <div class="line"><span>Sueldo del año</span><b>−{esc(eur(S['salary'], True))}</b></div>
  <div class="line"><span>IVA de las ganancias</span><b>−{esc(eur(S['iva'], True))}</b></div>
  <div class="line total"><span>Caja en diciembre</span><b>{esc(eur(S['months'][-1]['end'], True))}</b></div>
  <p class="muted">Beneficio del año: {esc(eur(S['result'], True))}, con el sueldo ya restado. Impuesto al 15 %: {esc(eur(S['tax'], True))}. Por encima del fondo quedan {esc(eur(S['free_gap'], True))}.</p>
  <footer><span>KHC AUTO IMPORT</span><span>15</span></footer>
</section>
<section class="slide">
  <p class="kicker">El segundo año</p>
  <h1>Más coches en el suelo. Más ventas. La misma regla.</h1>
  <div class="grid3">
    <article><b>{S['y2_sales_n']}</b><p class="muted">Ventas. El primero tuvo {S['sales_n']}.</p></article>
    <article><b>8 → {S['y2_stock']}</b><p class="muted">Coches. No se queda en ocho.</p></article>
    <article><b>{esc(eur(S['y2_result']))}</b><p class="muted">Beneficio. El sueldo ya está restado.</p></article>
  </div>
  <div class="line"><span>6 a 8 al abrir</span><b>2 ventas</b></div>
  <div class="line"><span>9 a 11 al abrir</span><b>3 ventas</b></div>
  <div class="line"><span>12 a 14 al abrir</span><b>4 ventas</b></div>
  <p class="muted">Una de cada tres, nunca menos de dos. El mes 19 se paga el impuesto del primer año, {esc(eur(S['tax'], True))}, antes de las facturas. La cuota se cubre {S['y2_dscr_txt']} veces.</p>
  <footer><span>KHC AUTO IMPORT</span><span>16</span></footer>
</section>
<section class="slide">
  <p class="kicker">El impuesto</p>
  <h1>Qué lo baja de verdad. Qué solo mueve el dinero.</h1>
  <div class="grid">
    <article><b>Sí lo baja</b><p>No repartir: la reserva ahorra {esc(eur(S['y2_save'], True))} y {esc(eur(S['y3_save'], True))}. El 15 % dura dos años. El tercero, micropyme: 17 % y 20 %.</p></article>
    <article><b>No lo baja</b><p>Comprar coches. Pagar el principal del préstamo. Gastar lo apartado para el impuesto. Aplazar con la reserva de nivelación, o repartir un dividendo.</p></article>
  </div>
  <p class="muted">La reforma de {esc(eur(REFORM))} ya salió de caja y no está en la base. Si la gestoría la admite, bajaría {esc(eur(S['reform_tax'], True))}. No cambia las compras.</p>
  <footer><span>KHC AUTO IMPORT</span><span>17</span></footer>
</section>
<section class="slide">
  <p class="kicker">Sueldo, no dividendo</p>
  <h1>El sueldo paga este mes. El dividendo, una vez.</h1>
  <table>
    <thead><tr><th></th><th>El sueldo</th><th>Un dividendo</th></tr></thead>
    <tbody>
      <tr><td>Cuándo</td><td class="num">Cada mes, desde el 13</td><td class="num">Una vez, al cerrar el año 2</td></tr>
      <tr><td>Él recibe</td><td class="num">{esc(eur(POCKET_Y2, True))} / mes. Luego {esc(eur(POCKET_Y3, True))}</td><td class="num">{esc(eur(S['div_pocket'], True))} una vez</td></tr>
      <tr><td>Le cuesta a la empresa</td><td class="num">{esc(eur(S['sal_cost'], True))} por mes</td><td class="num">{esc(eur(S['div_pretax'], True))} para el mismo mes</td></tr>
      <tr><td>¿Se hace?</td><td class="num">Sí. Es el plan.</td><td class="num">No. No llega al {S['cheap']['nick']}.</td></tr>
    </tbody>
  </table>
  <p class="muted">El mínimo familiar baja la declaración del sueldo, no el dividendo. A los 36 meses, dentro hay {esc(eur(S['equity'], True))}. El sueldo ya se cobró.</p>
  <footer><span>KHC AUTO IMPORT</span><span>18</span></footer>
</section>
<section class="slide">
  <p class="kicker">El segundo año</p>
  <h1>Mes a mes.</h1>
  <table><thead><tr><th>Mes</th><th>Qué ocurre</th><th>Cobro</th><th>Gastos</th><th>Sueldo</th><th>IVA</th><th>Compra</th><th>Sobra</th><th>Caja</th></tr></thead><tbody>{y2_rows}</tbody></table>
  <p class="muted">El mes 19 paga el impuesto del año 1 en la caja, no en gastos. Verde: se compra un {S['cheap']['nick']} de más, a {esc(eur(S['cheap']['cost']))}. Por encima del fondo quedan {esc(eur(S['y2_gap'], True))}: no llega.</p>
  <footer><span>KHC AUTO IMPORT</span><span>19</span></footer>
</section>
<section class="slide">
  <p class="kicker">Treinta y seis meses de caja</p>
  <h1>Sube con las ventas. Baja cuando el stock crece.</h1>
  <div class="chart">{svg_cash24()}</div>
  <p class="muted">Mínimo, mes {S['min_n']}: {esc(eur(S['min_cash'], True))}. Mes 36: {esc(eur(S['y3_end'], True))} y {S['y3_stock']} coches. El impuesto se paga los meses 19 y 31.</p>
  <footer><span>KHC AUTO IMPORT</span><span>20</span></footer>
</section>
<section class="slide">
  <p class="kicker">Los tres años</p>
  <h1>La misma empresa. El tercero ya no es el de arrancar.</h1>
  <table>
    <thead><tr><th></th><th>Año 1</th><th>Año 2</th><th>Año 3</th></tr></thead>
    <tbody>
      <tr><td>Ventas</td><td class="num">{S['sales_n']}</td><td class="num">{S['y2_sales_n']}</td><td class="num">{S['y3_sales_n']}</td></tr>
      <tr><td>Cobros</td><td class="num">{esc(eur(S['sales']))}</td><td class="num">{esc(eur(S['y2_sales']))}</td><td class="num">{esc(eur(S['y3_sales']))}</td></tr>
      <tr><td>Beneficio</td><td class="num">{esc(eur(S['result'], True))}</td><td class="num">{esc(eur(S['y2_result'], True))}</td><td class="num">{esc(eur(S['y3_result'], True))}</td></tr>
      <tr><td>Caja</td><td class="num">{esc(eur(S['months'][-1]['end'], True))}</td><td class="num">{esc(eur(S['y2_end'], True))}</td><td class="num">{esc(eur(S['y3_end'], True))}</td></tr>
      <tr><td>Coches</td><td class="num">{S['end_stock']}</td><td class="num">{S['y2_stock']}</td><td class="num">{S['y3_stock']}</td></tr>
      <tr><td>La cuota, veces</td><td class="num">{S['dscr_txt']}</td><td class="num">{S['y2_dscr_txt']}</td><td class="num">{S['y3_dscr_txt']}</td></tr>
    </tbody>
  </table>
  <footer><span>KHC AUTO IMPORT</span><span>21</span></footer>
</section>
<section class="slide">
  <p class="kicker">Lo que mira quien presta</p>
  <h1>La cuota se cubre. El stock crece. El sueldo ya está pagado.</h1>
  <div class="grid3">
    <article><b>{esc(eur(S['result'], True))}</b><p class="muted">Año 1. {S['sales_n']} ventas. {S['end_stock']} coches. Cuota {S['dscr_txt']} veces.</p></article>
    <article><b>{esc(eur(S['y2_result'], True))}</b><p class="muted">Año 2. {S['y2_sales_n']} ventas. {S['y2_stock']} coches. Cuota {S['y2_dscr_txt']} veces.</p></article>
    <article><b>{esc(eur(S['y3_result'], True))}</b><p class="muted">Año 3. {S['y3_sales_n']} ventas. {S['y3_stock']} coches. Cuota {S['y3_dscr_txt']} veces.</p></article>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>22</span></footer>
</section>
<section class="slide">
  <p class="kicker">Si no sale como en la tabla</p>
  <h1>El primer año. Cada desvío tiene un número.</h1>
  <div class="line"><span>El mes 2 no se vende. El fondo aguanta.</span><b>{esc(eur(S['months'][0]['end']-FIXED, True))}</b></div>
  <div class="line"><span>Un mes solo sale el 318d. Con el sueldo ya cobrado, faltan.</span><b>{esc(eur(abs(S['thin_gap']), True))}</b></div>
  <div class="line"><span>Impuesto al 23 %. Sigue cubriendo.</span><b>{S['dscr23_txt']} veces</b></div>
  <div class="line"><span>Precios un 5 % más bajos. Sigue habiendo colchón.</span><b>{S['dscr5_txt']} veces</b></div>
  <footer><span>KHC AUTO IMPORT</span><span>23</span></footer>
</section>
<section class="slide dark">
  <p class="kicker">La petición</p>
  <h1>50.000 € al lado de otros 50.000 €.</h1>
  <p>En 36 meses el stock pasa de seis a {S['y3_stock']}. El sueldo entra el mes 6. Desde el mes 13 son {esc(eur(POCKET_Y2, True))} en el bolsillo. Desde el mes 25, {esc(eur(POCKET_Y3, True))}. El beneficio no se reparte. Lo que se pide es una oferta de tipo y de plazo.</p>
  <div class="grid3">
    <div class="stat"><b>50.000 €</b><span>Financiación</span></div>
    <div class="stat"><b>{esc(eur(S['y3_result'], True))}</b><span>Beneficio del tercer año</span></div>
    <div class="stat"><b>{S['y3_dscr_txt']} veces</b><span>La cuota, en ese año</span></div>
  </div>
  <footer><span>KHC AUTO IMPORT</span><span>24</span></footer>
</section>
<section class="slide">
  <p class="kicker">De dónde sale cada cifra</p>
  <h1>Nada de esta sala es una venta ya cobrada.</h1>
  <ul>
    <li>Coches, nave y reforma: plan de cuatro páginas. La cuota exacta es 955,06 €, no 966 €. El autónomo, {esc(eur(RETA, True))}, es el mínimo de 2026, no los 380 € de las cuatro páginas.</li>
    <li>El sueldo no lo obliga la ley. Meses 6 a 12: {esc(eur(POCKET_Y1, True))} de bolsillo. Meses 13 a 24: {esc(eur(POCKET_Y2, True))}. Meses 25 a 36: {esc(eur(POCKET_Y3, True))}. Sube si el año anterior se cobró entero y el stock no bajó.</li>
    <li>El fondo de {esc(eur(S['floor'], True))} es tres meses de los gastos que no paran. El sueldo se paga encima y no se toca.</li>
    <li>Dos ventas al mes desde el mes 2. Con nueve al abrir, tres. Cada venta se repone en la semana. Precios de la web, 11 de octubre de 2026. No hay un modelo inventado.</li>
    <li>Impuesto de sociedades, 15 % los dos primeros ejercicios con beneficio. La reserva de capitalización ahorra {esc(eur(S['y2_save'], True))} en el año 2 si el beneficio no se reparte. La de nivelación aplaza: no está en el resultado.</li>
    <li>Ventas: una de cada tres, nunca menos de dos. El dividendo y el IRPF de la comparación son una estimación, no una liquidación. No hay un modelo inventado.</li>
  </ul>
  <footer><span>KHC AUTO IMPORT</span><span>25</span></footer>
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

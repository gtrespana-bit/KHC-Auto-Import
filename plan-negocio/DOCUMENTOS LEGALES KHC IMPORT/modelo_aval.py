#!/usr/bin/env python3
"""Modelo de trabajo del dossier de aval. Cifras ilustrativas, no cuentas auditadas.

Todas las magnitudes salen de las hipótesis cerradas del repositorio (tarifas 2026,
auditoría fiscal de las tres vías, política de compra) y del borrador de 4 páginas.
No son ventas realizadas: el cuaderno de tesorería del proyecto está a cero.
"""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_JSON = ROOT / "modelo_cifras.json"

# --- Tarifas cerradas 2026 (plan-negocio/02 y 01). IVA no deducible en REBU. ---
TARIFAS = {
    "transporte": 1000.00,
    "seguro_axa_7d": 50.97,
    "ficha_reducida": 54.45,
    "itv": 129.85,
    "dgt": 99.77,
    "placas": 17.27,
    "aceite": 52.70,
    "filtros": 63.90,
    "mano_obra": 60.00,
    "imprevistos": 150.00,
    "detallado": 10.00,
    "combustible_local": 30.00,
    "anuncio": 26.99,
    "garantia_12m": 250.00,
    "ivtm_base": 66.10,
}


def landed_items(ivtm=66.10, iedmt=0.0, coc=False):
    items = [
        ("Transporte portacoches (IVA incl., no deducible en REBU)", TARIFAS["transporte"]),
        ("Seguro temporal 7 días", TARIFAS["seguro_axa_7d"]),
        ("Ficha reducida (0 € si el coche trae COC)", 0.0 if coc else TARIFAS["ficha_reducida"]),
        ("ITV de importación Galicia", TARIFAS["itv"]),
        ("IVTM (2 trimestres, hipótesis de tramo)", ivtm),
        ("Tasa DGT 1.1", TARIFAS["dgt"]),
        ("Placas", TARIFAS["placas"]),
        ("Mantenimiento preventivo (aceite, filtros, mano de obra)", TARIFAS["aceite"] + TARIFAS["filtros"] + TARIFAS["mano_obra"]),
        ("Imprevistos mecánicos", TARIFAS["imprevistos"]),
        ("Detallado", TARIFAS["detallado"]),
        ("Combustible de movimientos locales", TARIFAS["combustible_local"]),
        ("Anuncio destacado", TARIFAS["anuncio"]),
        ("Póliza de garantía mecánica 12 meses", TARIFAS["garantia_12m"]),
        ("IEDMT modelo 576 (hipótesis de tablas, no % del precio de compra)", iedmt),
    ]
    return items


def rebu_vat(sell, buy):
    margin = sell - buy
    if margin <= 0:
        return 0.0
    return margin * 21.0 / 121.0


def analyze_car(name, buy, sell, ivtm, iedmt, note, policy, year=None):
    items = landed_items(ivtm, iedmt)
    extra = sum(v for _, v in items)
    vat = rebu_vat(sell, buy)
    gross = sell - buy
    contrib = sell - buy - extra - vat
    return {
        "name": name,
        "year": year,
        "buy": buy,
        "sell": sell,
        "gross": gross,
        "rebu": vat,
        "rebu_base": gross / 1.21 if gross > 0 else 0.0,
        "draft_net": gross / 1.21 if gross > 0 else 0.0,  # lo que el borrador llamaba «neto»
        "extra": extra,
        "iedmt": iedmt,
        "ivtm": ivtm,
        "contrib": contrib,
        "cash_out": buy + extra,
        "note": note,
        "policy": policy,
        "items": items,
    }


# Mix que SÍ pasa la política de compra del proyecto (estudio de mercado + matriz).
# Precios de trabajo tomados de los escandallos ya estudiados, no de anuncios sueltos.
POLICY = [
    analyze_car("VW Golf 7.5 2.0 TDI 150", 13500, 17900, 66.10, 0, "Filtro ≤120 g. Rotación estudiada 12–18 días.", True, "2018-19"),
    analyze_car("Audi A3 Sportback 2.0 TDI", 14800, 19900, 66.10, 0, "Solo si el COC confirma ≤120 g; si no, se recalcula el 576.", True, "2017-19"),
    analyze_car("BMW 320d Touring F31 LCI (B47)", 16800, 21900, 66.10, 485, "576 hipótesis de tablas, tramo 4,75 %. Prohibido el N47.", True, "2017-18"),
    analyze_car("Mercedes A 180 d W177", 16500, 21500, 66.10, 0, "Demanda local alta. Filtro ≤120 g.", True, "2018-19"),
    analyze_car("BMW X1 F48 18d", 16500, 22400, 66.10, 460, "576 hipótesis 4,75 %. SUV de rotación corta.", True, "2018"),
    analyze_car("Toyota Corolla TS 2.0 Hybrid", 18200, 23400, 66.10, 0, "Etiqueta ECO. Exento de 576. Rotación muy corta.", True, "2019-21"),
]

# Lote del borrador de 4 páginas, recalculado con las mismas tarifas.
DRAFT = [
    analyze_car("Mercedes-Benz Clase C Estate", 17666, 23990, 66.10, 485, "El borrador daba 5.226 € «netos». Tras aterrizaje quedan menos.", False, "2019"),
    analyze_car("VW Golf GTI Performance", 12674, 18500, 66.10, 1120, "Tramo 9,75 %. La política de compra lo evita: el 576 se come el margen.", False, "2015"),
    analyze_car("BMW 116d manual", 9010, 13475, 66.10, 0, "Año 2015: riesgo de etiqueta B / Euro 5. No se financia sin verificar ZBE.", False, "2015"),
    analyze_car("VW Golf VIII 1.0 TSI", 14617, 18700, 66.10, 0, "Aceptable si el COC da ≤120 g y etiqueta C.", False, "2021"),
    analyze_car("BMW 318d Touring", 14220, 18250, 66.10, 485, "B47 aceptable. 576 conservador en el caso base.", False, "2019"),
    analyze_car("Volvo XC40 2.0 D3", 14738, 18500, 89.60, 485, "Margen fino tras 576 e IVTM de tramo superior.", False, "2020"),
    analyze_car("Audi A3 1.0 TFSI", 12455, 15990, 66.10, 0, "Aceptable si ≤120 g. Ticket bajo, contribución justa.", False, "2018"),
]


def avg(cars, key):
    return sum(c[key] for c in cars) / len(cars)


UNIT = {
    "buy": avg(POLICY, "buy"),
    "sell": avg(POLICY, "sell"),
    "extra": avg(POLICY, "extra"),
    "rebu": avg(POLICY, "rebu"),
    "contrib": avg(POLICY, "contrib"),
    "cash_out": avg(POLICY, "cash_out"),
    "gross": avg(POLICY, "gross"),
    "draft_net": avg(POLICY, "draft_net"),
}

# Estructura fija mensual. El RETA societario NO cuenta con Cuota Cero.
FIXED_PILOT = [
    ("RETA administrador societario (hipótesis de mínimo)", 380.00),
    ("Gestoría SL, REBU, VIES e Impuesto de Sociedades", 121.00),
    ("Portales, versión ajustada al stock piloto", 90.00),
    ("Seguro de stock y responsabilidad civil", 60.00),
    ("Telefonía e internet", 35.00),
    ("Varios", 30.00),
]
FIXED_SHOWROOM_ONLY = [
    ("Alquiler nave San Marcos, 550 m² (hipótesis sin precontrato)", 1100.00),
    ("Suministros", 180.00),
    ("Incremento de portales a tarifa profesional", 100.00),
    ("Incremento de seguro de nave", 85.00),
    ("Alarma, cuota", 35.00),
    ("Limpieza", 60.00),
    ("Varios de local", 20.00),
]

EQUITY = 50_000.0
LOAN = 50_000.0
ACCORDION = 20_000.0
RATE = 0.055  # hipótesis banca tradicional. El tope orientativo ICO a 5+ años se prueba en sensibilidad.
SGR_CAPITAL_RATE = 0.02  # reintegrable al cancelar
SGR_STUDY = 0.005
BANK_FEE = 0.005
SGR_AVAL_ANNUAL = 0.0075
GRACE = 6
TERM = 60
COVENANT_CASH = 12_000.0
TARGET_STOCK = 4
IS_NEW = 0.15
IS_PYME = 0.23

CAPEX_FITOUT = 4550.00  # epoxi 1800 + LED 1100 + oficinas 1300 + PCI 350
CAPEX_EXTRA = 780 + 650 + 490  # rotulación, mobiliario, instalación alarma
DEPOSIT = 2_200.00
CONSTITUTION = 1_150.00
EQUIPMENT = 822.90


def pmt(principal, annual, n):
    r = annual / 12.0
    if n <= 0:
        return 0.0
    if abs(r) < 1e-12:
        return principal / n
    return principal * r * (1 + r) ** n / ((1 + r) ** n - 1)


def schedule(principal, annual, n, grace, start_month):
    """Meses de calendario 1.. en los que hay cuota. start_month es el mes de disposición (1-index)."""
    r = annual / 12.0
    amort_n = n - grace
    payment = pmt(principal, annual, amort_n)
    bal = principal
    rows = []
    for i in range(n):
        interest = bal * r
        if i < grace:
            principal_pay = 0.0
            pay = interest
        else:
            principal_pay = min(bal, payment - interest)
            if principal_pay < 0:
                principal_pay = 0.0
            pay = interest + principal_pay
        bal = max(0.0, bal - principal_pay)
        rows.append({
            "cal_month": start_month + i,
            "interest": interest,
            "principal": principal_pay,
            "payment": pay,
            "balance": bal,
        })
    return rows


def debt_at(schedules, cal_month):
    interest = principal = payment = balance = 0.0
    for sch in schedules:
        for row in sch:
            if row["cal_month"] == cal_month:
                interest += row["interest"]
                principal += row["principal"]
                payment += row["payment"]
            if row["cal_month"] <= cal_month:
                # balance is the remaining after that installment; take the latest
                pass
        latest = [row for row in sch if row["cal_month"] <= cal_month]
        if latest:
            balance += latest[-1]["balance"]
        elif sch and sch[0]["cal_month"] > cal_month:
            balance += sch[0]["balance"] + sch[0]["principal"]  # not yet drawn
    return {"interest": interest, "principal": principal, "payment": payment, "balance": balance}


def opening_costs(loan):
    return {
        "constitucion": CONSTITUTION,
        "equipamiento": EQUIPMENT,
        "cuota_social_sgr": loan * SGR_CAPITAL_RATE,
        "comision_estudio_sgr": loan * SGR_STUDY,
        "comision_apertura_banco": loan * BANK_FEE,
    }


def simulate(
    loan=LOAN,
    equity=EQUITY,
    sales=None,
    showroom_from=None,
    accordion_at=None,
    accordion=0.0,
    covenant=COVENANT_CASH,
    target_stock=TARGET_STOCK,
    price_factor=1.0,
    extra_repair=0.0,
    rate=RATE,
    rent_override=None,
    discipline=True,
    months=12,
    grace=GRACE,
    label="",
):
    """Simulación mensual. discipline=True impide comprar si se rompe el covenant de caja."""
    if sales is None:
        sales = [0, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2]
    costs = opening_costs(loan)
    upfront = sum(costs.values())
    cash = equity + loan - upfront
    sgr_shares = costs["cuota_social_sgr"]
    fitout_gross = 0.0
    deposit = 0.0
    stock = []  # list of cash_out actually paid
    sch = [schedule(loan, rate, TERM, grace, 1)]
    drawn_accordion = 0.0

    unit_buy = UNIT["buy"]
    unit_extra = UNIT["extra"] + extra_repair
    unit_sell = UNIT["sell"] * price_factor
    unit_rebu = rebu_vat(unit_sell, unit_buy)
    unit_cash = unit_buy + unit_extra
    unit_contrib = unit_sell - unit_buy - unit_extra - unit_rebu

    def fixed_for(month, showroom):
        total = sum(v for _, v in FIXED_PILOT)
        detail = list(FIXED_PILOT)
        if showroom:
            extra = list(FIXED_SHOWROOM_ONLY)
            if rent_override is not None:
                extra = [(n, rent_override if n.startswith("Alquiler") else v) for n, v in extra]
            detail += extra
            total += sum(v for _, v in extra)
        return total, detail

    def buy_until(floor):
        n = 0
        nonlocal cash
        while len(stock) < target_stock and (cash - unit_cash) >= (floor if discipline else 500):
            cash -= unit_cash
            stock.append(unit_cash)
            n += 1
            if n >= 8:
                break
        return n

    buy_until(covenant)

    vat_bucket = 0.0
    vat_paid = 0.0
    rows = []
    sales_done = 0
    purchases = len(stock)
    interest_y = principal_y = fixed_y = contrib_y = fees_aval = 0.0
    min_cash = cash
    showroom_open = False

    for m in range(1, months + 1):
        if accordion_at and m == accordion_at and accordion > 0 and drawn_accordion == 0:
            cash += accordion
            extra_share = accordion * SGR_CAPITAL_RATE
            extra_fees = accordion * (SGR_STUDY + BANK_FEE)
            cash -= extra_share + extra_fees
            sgr_shares += extra_share
            drawn_accordion = accordion
            sch.append(schedule(accordion, rate, TERM, grace, m))
            fees_aval += extra_fees

        if showroom_from and m == showroom_from and not showroom_open:
            implant = CAPEX_FITOUT + CAPEX_EXTRA + (DEPOSIT if rent_override is None else rent_override * 2)
            if rent_override is not None:
                implant = CAPEX_FITOUT + CAPEX_EXTRA + rent_override * 2
            cash -= implant
            fitout_gross += CAPEX_FITOUT + CAPEX_EXTRA
            deposit += implant - (CAPEX_FITOUT + CAPEX_EXTRA)
            showroom_open = True

        fixed, _ = fixed_for(m, showroom_open)
        debt = debt_at(sch, m)
        # comisión de aval sobre saldo vivo al inicio del mes
        bal_start = debt["balance"] + debt["principal"]
        aval_fee = bal_start * SGR_AVAL_ANNUAL / 12.0

        # ventas
        want = sales[m - 1] if m - 1 < len(sales) else 0
        sold = 0
        sale_cash = 0.0
        sale_rebu = 0.0
        sale_contrib = 0.0
        while sold < want and stock:
            stock.pop(0)
            cash += unit_sell
            vat_bucket += unit_rebu
            sale_cash += unit_sell
            sale_rebu += unit_rebu
            sale_contrib += unit_contrib
            sold += 1
        sales_done += sold

        # pago IVA del trimestre anterior
        vat_out = 0.0
        if m in (4, 7, 10, 13):
            vat_out = vat_bucket
            cash -= vat_out
            vat_paid += vat_out
            vat_bucket = 0.0

        cash -= fixed
        cash -= debt["payment"]
        cash -= aval_fee

        # reposición con disciplina
        rebought = 0
        floor = covenant if discipline else 500
        while len(stock) < target_stock and cash - unit_cash >= floor:
            cash -= unit_cash
            stock.append(unit_cash)
            rebought += 1
            purchases += 1

        min_cash = min(min_cash, cash)
        interest_y += debt["interest"]
        principal_y += debt["principal"]
        fixed_y += fixed
        contrib_y += sale_contrib
        fees_aval += aval_fee

        rows.append({
            "month": m,
            "sales": sold,
            "wanted": want,
            "stock": len(stock),
            "cash": round(cash, 2),
            "fixed": round(fixed, 2),
            "debt_payment": round(debt["payment"], 2),
            "interest": round(debt["interest"], 2),
            "principal": round(debt["principal"], 2),
            "balance": round(debt["balance"], 2),
            "aval_fee": round(aval_fee, 2),
            "vat_paid": round(vat_out, 2),
            "showroom": showroom_open,
            "contrib": round(sale_contrib, 2),
        })

    ebitda = contrib_y - fixed_y - fees_aval
    # Constitución, estudio del aval y apertura: gasto del año, no activo.
    opening_expense = costs["constitucion"] + costs["comision_estudio_sgr"] + costs["comision_apertura_banco"]
    if drawn_accordion:
        opening_expense += drawn_accordion * (SGR_STUDY + BANK_FEE)
    dep = EQUIPMENT / 4.0 + fitout_gross / 5.0
    ebt = ebitda - opening_expense - interest_y - dep
    tax = max(0.0, ebt) * IS_NEW
    cfads = ebitda - opening_expense - tax
    debt_service = interest_y + principal_y
    dscr = (cfads / debt_service) if debt_service > 1 else None
    dscr_pretax = ((ebitda - opening_expense) / debt_service) if debt_service > 1 else None

    stock_cost = sum(stock)
    # balance simplificado al cierre del mes 12
    loan_balance = rows[-1]["balance"] if rows else loan
    assets = {
        "tesoreria": cash,
        "existencias": stock_cost,
        "fianza": deposit,
        "participaciones_sgr": sgr_shares,
        "inmovilizado_neto": EQUIPMENT + fitout_gross - dep,
    }
    liabilities = {
        "deuda_largo": loan_balance,  # todo se presenta como deuda financiera viva
        "iva_rebu_a_ingresar": vat_bucket,
        "impuesto_sociedades": tax,
    }
    equity_end = equity + (ebt - tax)
    # El balance cuadra por construcción si el resultado explica la diferencia.
    # Ajuste de redondeo documentado.
    total_assets = sum(assets.values())
    total_liab_eq = sum(liabilities.values()) + equity_end
    plug = total_assets - total_liab_eq
    equity_end += plug  # el plug absorbe diferencias de devengo (IVA, depósitos) para presentar un balance que cuadra
    # Mejor no disfrazar: guardar el descuadre y explicarlo.
    equity_end -= plug

    return {
        "label": label,
        "loan": loan,
        "equity": equity,
        "upfront": costs,
        "upfront_total": upfront,
        "opening_cash_after_stock": None,
        "unit": {
            "buy": unit_buy,
            "sell": unit_sell,
            "extra": unit_extra,
            "rebu": unit_rebu,
            "cash_out": unit_cash,
            "contrib": unit_contrib,
        },
        "rows": rows,
        "sales": sales_done,
        "purchases": purchases,
        "ending_stock_units": len(stock),
        "ending_stock_cost": stock_cost,
        "min_cash": min_cash,
        "ending_cash": cash,
        "contrib": contrib_y,
        "fixed": fixed_y,
        "aval_fees": fees_aval,
        "interest": interest_y,
        "principal": principal_y,
        "debt_service": debt_service,
        "opening_expense": opening_expense,
        "depreciation": dep,
        "ebitda": ebitda,
        "ebt": ebt,
        "tax": tax,
        "net": ebt - tax,
        "cfads": cfads,
        "dscr": dscr,
        "dscr_pretax": dscr_pretax,
        "vat_payable": vat_bucket,
        "sgr_shares": sgr_shares,
        "fitout_gross": fitout_gross,
        "deposit": deposit,
        "drawn_accordion": drawn_accordion,
        "assets": assets,
        "liabilities": liabilities,
        "equity_end_raw": equity + (ebt - tax),
        "balance_gap": total_assets - (sum(liabilities.values()) + equity + (ebt - tax)),
        "showroom_opened": showroom_open,
    }


def steady_year(sales, loan, showroom, salary, rate=RATE, price_factor=1.0, extra_repair=0.0, rent=None, tax_rate=IS_PYME, year_index=2):
    """Año de crucero, sin carencia. year_index=2 es el primer año completo sin carencia del préstamo inicial."""
    unit_sell = UNIT["sell"] * price_factor
    unit_buy = UNIT["buy"]
    unit_extra = UNIT["extra"] + extra_repair
    unit_rebu = rebu_vat(unit_sell, unit_buy)
    contrib_u = unit_sell - unit_buy - unit_extra - unit_rebu
    fixed = sum(v for _, v in FIXED_PILOT) * 12
    if showroom:
        extra = 0.0
        for n, v in FIXED_SHOWROOM_ONLY:
            if rent is not None and n.startswith("Alquiler"):
                extra += rent
            else:
                extra += v
        fixed += extra * 12
    fixed += salary
    contrib = contrib_u * sales
    # servicio de la deuda: anualidad completa (ya pasó la carencia)
    pay_m = pmt(loan, rate, TERM - GRACE)
    # aproximación del interés del año: saldo medio tras la carencia
    # Se recalcula con el cuadro real, meses 13-24 del préstamo dispuesto en el mes 1.
    sch = schedule(loan, rate, TERM, GRACE, 1)
    start = 12 * (year_index - 1) + 1
    end = start + 11
    chunk = [r for r in sch if start <= r["cal_month"] <= end]
    interest = sum(r["interest"] for r in chunk)
    principal = sum(r["principal"] for r in chunk)
    service = interest + principal
    aval = 0.0
    # saldo medio del año * tasa
    if chunk:
        bals = []
        for r in chunk:
            bals.append(r["balance"] + r["principal"])
        aval = (sum(bals) / len(bals)) * SGR_AVAL_ANNUAL
    dep = EQUIPMENT / 4.0 + ((CAPEX_FITOUT + CAPEX_EXTRA) / 5.0 if showroom else 0.0)
    ebitda = contrib - fixed - aval
    ebt = ebitda - interest - dep
    tax = max(0.0, ebt) * tax_rate
    cfads = ebitda - tax
    dscr = cfads / service if service else None
    return {
        "sales": sales,
        "contrib_unit": contrib_u,
        "contrib": contrib,
        "fixed": fixed,
        "salary": salary,
        "aval": aval,
        "ebitda": ebitda,
        "interest": interest,
        "principal": principal,
        "service": service,
        "depreciation": dep,
        "ebt": ebt,
        "tax": tax,
        "net": ebt - tax,
        "cfads": cfads,
        "dscr": dscr,
        "monthly_payment": pay_m,
        "showroom": showroom,
    }


def min_sales_for_dscr(target, loan, showroom, salary=0, rate=RATE, price_factor=1.0, extra_repair=0.0, rent=None, tax_rate=IS_NEW):
    for s in range(6, 61):
        y = steady_year(s, loan, showroom, salary, rate=rate, price_factor=price_factor, extra_repair=extra_repair, rent=rent, tax_rate=tax_rate)
        if y["dscr"] and y["dscr"] >= target:
            return s
    return None


def break_even_units(showroom, loan, rate=RATE):
    fixed_m = sum(v for _, v in FIXED_PILOT)
    if showroom:
        fixed_m += sum(v for _, v in FIXED_SHOWROOM_ONLY)
    pay = pmt(loan, rate, TERM - GRACE)
    aval_m = loan * SGR_AVAL_ANNUAL / 12.0
    need_cash = fixed_m + pay + aval_m
    units_cash = need_cash / UNIT["contrib"]
    return {
        "fixed_month": fixed_m,
        "payment": pay,
        "aval_month": aval_m,
        "units_cash_month": units_cash,
        "sales_year_dscr_130": min_sales_for_dscr(1.30, loan, showroom, rate=rate),
        "sales_year_dscr_130_salary": min_sales_for_dscr(1.30, loan, showroom, salary=9600, rate=rate),
        "sales_year_dscr_130_price95": min_sales_for_dscr(1.30, loan, showroom, price_factor=0.95, rate=rate),
    }


def liquidation_value(units):
    """Si se deja de comprar y se vende el stock al precio de trabajo, caja liberada antes de impuestos."""
    return units * (UNIT["sell"] - UNIT["rebu"])


def build():
    base_sales = [0, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2]  # 15
    cons_sales = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  # 11
    stress_sales = [0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]  # 7

    base = simulate(sales=base_sales, label="Base año 1 — piloto, sin local")
    cons = simulate(sales=cons_sales, label="Conservador — 1 venta al mes desde el mes 2")
    stress = simulate(sales=stress_sales, label="Estrés — 7 ventas y disciplina de caja")
    no_discipline = simulate(sales=stress_sales, discipline=False, covenant=500, label="Estrés sin disciplina de compra")
    # showroom abierto en el mes 1 con el mismo préstamo: el caso que el borrador pedía
    showroom_now = simulate(sales=base_sales, showroom_from=1, label="Local desde el mes 1, mismas 15 ventas")
    showroom_stress = simulate(sales=stress_sales, showroom_from=1, label="Local desde el mes 1 y estrés de ventas")
    accordion = simulate(sales=base_sales, accordion_at=7, accordion=10_000, target_stock=5, label="Base + ampliación de 10.000 € en el mes 7")
    no_grace = simulate(sales=base_sales, grace=0, label="Base sin carencia")
    stress_no_grace = simulate(sales=stress_sales, grace=0, label="Estrés sin carencia")
    aggressive = simulate(sales=stress_sales, target_stock=7, discipline=False, covenant=1500, label="Error del borrador: 7 coches y sin disciplina")

    y2_pilot = steady_year(16, LOAN, False, 0, tax_rate=IS_NEW, year_index=2)
    y2_pilot_salary = steady_year(16, LOAN, False, 9600, tax_rate=IS_NEW, year_index=2)
    y3_pilot = steady_year(18, LOAN, False, 9600, tax_rate=IS_PYME, year_index=3)
    y2_show = steady_year(26, LOAN, True, 0, tax_rate=IS_NEW, year_index=2)
    y2_show_cons = steady_year(18, LOAN, True, 0, tax_rate=IS_NEW, year_index=2)
    y_price = steady_year(16, LOAN, False, 0, price_factor=0.95, tax_rate=IS_NEW, year_index=2)
    y_repair = steady_year(16, LOAN, False, 0, extra_repair=500, tax_rate=IS_NEW, year_index=2)
    y_rate = steady_year(16, LOAN, False, 0, rate=0.07, tax_rate=IS_NEW, year_index=2)
    y_rate_ico = steady_year(16, LOAN, False, 0, rate=0.043, tax_rate=IS_NEW, year_index=2)
    y_rent = steady_year(22, LOAN, True, 0, rent=2200, tax_rate=IS_NEW, year_index=2)

    # capacidad adicional: mayor principal que aún deja RCSD >= 1,30 a 16 ventas, sin local, sin sueldo
    ceiling = LOAN
    for extra in range(0, 61_000, 5_000):
        y = steady_year(16, LOAN + extra, False, 0, tax_rate=IS_NEW, year_index=2)
        if y["dscr"] and y["dscr"] >= 1.30:
            ceiling = LOAN + extra
        else:
            break

    be_pilot = break_even_units(False, LOAN)
    be_show = break_even_units(True, LOAN)

    draft_contrib = sum(c["contrib"] for c in DRAFT)
    draft_claimed = sum(c["draft_net"] for c in DRAFT)
    draft_cash = sum(c["cash_out"] for c in DRAFT)
    policy_contrib = sum(c["contrib"] for c in POLICY)

    # Cuadro de amortización de referencia (50.000 €, 5,5 %, 6 meses de carencia, 54 cuotas)
    sch = schedule(LOAN, RATE, TERM, GRACE, 1)
    pay_after_grace = pmt(LOAN, RATE, TERM - GRACE)
    pay_no_grace = pmt(LOAN, RATE, TERM)

    def slim_car(c):
        d = {k: c[k] for k in ("name", "year", "buy", "sell", "gross", "rebu", "draft_net", "extra", "contrib", "cash_out", "iedmt", "note", "policy")}
        return d

    def slim_sim(s):
        return {k: s[k] for k in (
            "label", "sales", "purchases", "ending_stock_units", "min_cash", "ending_cash",
            "contrib", "fixed", "interest", "principal", "debt_service", "ebitda", "ebt",
            "tax", "net", "cfads", "dscr", "dscr_pretax", "opening_expense", "aval_fees",
            "vat_payable", "showroom_opened", "balance_gap", "ending_stock_cost",
        )} | {"rows": s["rows"], "upfront": s["upfront"], "upfront_total": s["upfront_total"], "unit": s["unit"]}

    model = {
        "meta": {
            "date": "2026-10-11",
            "nature": "hipotesis_de_trabajo",
            "equity": EQUITY,
            "loan_request": LOAN,
            "accordion": ACCORDION,
            "accordion_ceiling_dscr_130": ceiling,
            "rate": RATE,
            "grace_months": GRACE,
            "term_months": TERM,
            "sgr_capital_rate": SGR_CAPITAL_RATE,
            "sgr_study": SGR_STUDY,
            "bank_fee": BANK_FEE,
            "sgr_aval_annual": SGR_AVAL_ANNUAL,
            "covenant_cash": COVENANT_CASH,
            "target_stock": TARGET_STOCK,
            "is_new": IS_NEW,
            "is_pyme": IS_PYME,
            "family_liquidity": 25000,
            "payment_after_grace": pay_after_grace,
            "payment_no_grace_60": pay_no_grace,
            "interest_only_month": LOAN * RATE / 12.0,
        },
        "unit": UNIT,
        "policy": [slim_car(c) for c in POLICY],
        "draft": [slim_car(c) for c in DRAFT],
        "draft_totals": {
            "buy": sum(c["buy"] for c in DRAFT),
            "sell": sum(c["sell"] for c in DRAFT),
            "claimed_net": draft_claimed,
            "contrib": draft_contrib,
            "cash_out": draft_cash,
            "overstatement": draft_claimed - draft_contrib,
        },
        "policy_totals": {
            "contrib_sum": policy_contrib,
            "avg_contrib": UNIT["contrib"],
        },
        "fixed_pilot": FIXED_PILOT,
        "fixed_showroom_only": FIXED_SHOWROOM_ONLY,
        "fixed_pilot_month": sum(v for _, v in FIXED_PILOT),
        "fixed_showroom_month": sum(v for _, v in FIXED_PILOT) + sum(v for _, v in FIXED_SHOWROOM_ONLY),
        "capex": {
            "fitout": CAPEX_FITOUT,
            "extra": CAPEX_EXTRA,
            "deposit": DEPOSIT,
            "constitution": CONSTITUTION,
            "equipment": EQUIPMENT,
            "implant_total": CAPEX_FITOUT + CAPEX_EXTRA + DEPOSIT,
        },
        "break_even": {"pilot": be_pilot, "showroom": be_show},
        "thresholds": {
            "pilot_dscr_130": be_pilot["sales_year_dscr_130"],
            "pilot_dscr_130_salary": be_pilot["sales_year_dscr_130_salary"],
            "pilot_dscr_130_price95": be_pilot["sales_year_dscr_130_price95"],
            "show_dscr_130": be_show["sales_year_dscr_130"],
            "show_dscr_130_salary": be_show["sales_year_dscr_130_salary"],
        },
        "scenarios": {
            "base": slim_sim(base),
            "conservative": slim_sim(cons),
            "stress": slim_sim(stress),
            "no_discipline": slim_sim(no_discipline),
            "showroom_now": slim_sim(showroom_now),
            "showroom_stress": slim_sim(showroom_stress),
            "accordion": slim_sim(accordion),
            "aggressive": slim_sim(aggressive),
            "no_grace": slim_sim(no_grace),
            "stress_no_grace": slim_sim(stress_no_grace),
        },
        "steady": {
            "y2_pilot_16": y2_pilot,
            "y2_pilot_salary": y2_pilot_salary,
            "y3_pilot": y3_pilot,
            "y2_show_26": y2_show,
            "y2_show_18": y2_show_cons,
            "price_minus_5": y_price,
            "repair_500": y_repair,
            "rate_7": y_rate,
            "rate_ico": y_rate_ico,
            "rent_2200": y_rent,
        },
        "liquidation_4_cars": liquidation_value(4),
        "schedule_head": sch[:8],
    }
    return model


def main():
    model = build()
    # JSON sin problemas de tuplas
    OUT_JSON.write_text(json.dumps(model, ensure_ascii=False, indent=2), encoding="utf-8")
    m = model["meta"]
    b = model["scenarios"]["base"]
    s = model["scenarios"]["stress"]
    sh = model["scenarios"]["showroom_stress"]
    print("UNIT contrib", round(model["unit"]["contrib"], 2), "cash_out", round(model["unit"]["cash_out"], 2))
    print("payment grace", round(m["payment_after_grace"], 2), "no grace", round(m["payment_no_grace_60"], 2), "io", round(m["interest_only_month"], 2))
    print("BASE sales", b["sales"], "mincash", round(b["min_cash"]), "end", round(b["ending_cash"]), "dscr", None if b["dscr"] is None else round(b["dscr"], 3), "net", round(b["net"]))
    print("CONS", model["scenarios"]["conservative"]["sales"], "min", round(model["scenarios"]["conservative"]["min_cash"]), "dscr", round(model["scenarios"]["conservative"]["dscr"], 3))
    print("STRESS sales", s["sales"], "min", round(s["min_cash"]), "end", round(s["ending_cash"]), "stock", s["ending_stock_units"], "dscr", None if not s["dscr"] else round(s["dscr"], 3))
    print("NO DISC min", round(model["scenarios"]["no_discipline"]["min_cash"]), "end", round(model["scenarios"]["no_discipline"]["ending_cash"]))
    print("SHOW NOW min", round(model["scenarios"]["showroom_now"]["min_cash"]), "dscr", round(model["scenarios"]["showroom_now"]["dscr"] or 0, 3), "net", round(model["scenarios"]["showroom_now"]["net"]))
    print("SHOW STRESS min", round(sh["min_cash"]), "end", round(sh["ending_cash"]), "stock", sh["ending_stock_units"])
    print("Y2 pilot", round(model["steady"]["y2_pilot_16"]["dscr"], 3), "net", round(model["steady"]["y2_pilot_16"]["net"]))
    print("Y2 show 26", round(model["steady"]["y2_show_26"]["dscr"], 3), "Y2 show 18", round(model["steady"]["y2_show_18"]["dscr"], 3))
    print("ceiling", m["accordion_ceiling_dscr_130"])
    print("BE pilot", {k: (round(v, 2) if isinstance(v, float) else v) for k, v in model["break_even"]["pilot"].items()})
    print("BE show", {k: (round(v, 2) if isinstance(v, float) else v) for k, v in model["break_even"]["showroom"].items()})
    print("draft overstatement", round(model["draft_totals"]["overstatement"]), "claimed", round(model["draft_totals"]["claimed_net"]), "real", round(model["draft_totals"]["contrib"]))
    print("gap", round(b["balance_gap"], 2))
    print("wrote", OUT_JSON)


if __name__ == "__main__":
    main()

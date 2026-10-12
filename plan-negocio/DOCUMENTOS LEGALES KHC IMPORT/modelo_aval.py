#!/usr/bin/env python3
"""Modelo del dossier de aval.

El coste de compra del plan de 4 páginas ya es el coste puesto en España:
coche, transporte, matriculación y puesta a la venta. El margen neto del
plan es el margen real. No se vuelve a restar el aterrizaje.

Las cifras salen de ese plan, de las tarifas del ERP y de los precios
publicados en khcimport.autos. No son ventas cobradas.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_JSON = ROOT / "modelo_cifras.json"

# Lote del plan. «coste» = coste de compra del plan, ya con gastos dentro.
LOT = [
    ("Mercedes-Benz Clase C Estate 2019", 17666.00, 23990.00),
    ("Volkswagen Golf GTI Performance 2015", 12674.00, 18500.00),
    ("BMW 116d Manual 2015", 9010.00, 13475.00),
    ("Volkswagen Golf VIII 1.0 TSI 2021", 14617.00, 18700.00),
    ("BMW 318d Touring 2019", 14220.00, 18250.00),
    ("Volvo XC40 2.0 D3 2020", 14738.00, 18500.00),
    ("Audi A3 1.0 TFSI 2018", 12455.00, 15990.00),
]

# Contraste con el motor del ERP (landingCost sobre el borrador de alta).
# precio_de = anuncio de origen. all_in = suma de costes del borrador.
# venta_web = precio publicado en khcimport.autos el 11 de octubre de 2026.
ERP_CHECK = [
    {
        "name": "Golf VIII 1.0 TSI 2021",
        "precio_de": 12500.00,
        "erp_all_in": 14611.82,
        "plan_cost": 14617.00,
        "venta_plan": 18700.00,
        "venta_web": 18700.00,
    },
    {
        "name": "Audi A3 1.0 TFSI 2018",
        "precio_de": 10650.00,
        "erp_all_in": 12761.82,
        "plan_cost": 12455.00,
        "venta_plan": 15990.00,
        "venta_web": 15990.00,
    },
    {
        "name": "Mercedes Clase C Estate 2019",
        "precio_de": 15000.00,
        "erp_all_in": 17120.36,
        "plan_cost": 17666.00,
        "venta_plan": 23990.00,
        "venta_web": 23990.00,
    },
    {
        "name": "Volvo XC40 D3 2020",
        "precio_de": 12000.00,
        "erp_all_in": 14120.36,
        "plan_cost": 14738.00,
        "venta_plan": 18500.00,
        "venta_web": 18500.00,
    },
    {
        "name": "BMW 318d Touring 2019",
        "precio_de": 12990.00,
        "erp_all_in": 15110.36,
        "plan_cost": 14220.00,
        "venta_plan": 18250.00,
        "venta_web": 17250.00,
    },
]

# Precios de la web que no coinciden con la columna de venta del plan.
WEB_SALE = {
    "BMW 116d Manual 2015": 12475.00,
    "BMW 318d Touring 2019": 17250.00,
}

RENT = 1100.00
RETA = 380.00
MARKETING = 250.00
UTILITIES = 150.00
STRUCTURE = RENT + RETA + MARKETING + UTILITIES  # 1.880, sin la cuota
CAPEX_NAVE = 4550.00
CAPITAL = 50000.00
LOAN = 50000.00
RATE = 0.055
MONTHS = 60
# El plan redondea la cuota a 966 €. La anualidad exacta al 5,50 % es 955,06 €.
PAYMENT_PLAN = 966.00


def r2(n):
    return round(float(n) + 1e-9, 2)


def rebu(sell, cost):
    margin = sell - cost
    if margin <= 0:
        return 0.0
    return r2(margin * 21.0 / 121.0)


def net_margin(sell, cost):
    return r2(sell - cost - rebu(sell, cost))


def annuity(principal, annual_rate, months):
    r = annual_rate / 12.0
    return r2(principal * r * (1 + r) ** months / ((1 + r) ** months - 1))


def year_interest(principal, annual_rate, payment, months=12):
    bal = principal
    r = annual_rate / 12.0
    interest = 0.0
    principal_paid = 0.0
    for _ in range(months):
        i = bal * r
        prin = payment - i
        bal -= prin
        interest += i
        principal_paid += prin
    return r2(interest), r2(principal_paid), r2(bal)


def year_result(sales, unit_net, tax_rate, interest, service):
    contrib = r2(unit_net * sales)
    structure = r2(STRUCTURE * 12)
    ebitda = r2(contrib - structure)
    taxable = r2(ebitda - interest)
    tax = r2(max(0.0, taxable) * tax_rate)
    result = r2(taxable - tax)
    cash_for_debt = r2(ebitda - tax)
    dscr = r2(cash_for_debt / service) if service else None
    return {
        "sales": sales,
        "unit_net": r2(unit_net),
        "contrib": contrib,
        "structure": structure,
        "ebitda": ebitda,
        "interest": r2(interest),
        "tax_rate": tax_rate,
        "tax": tax,
        "result": result,
        "service": r2(service),
        "dscr": dscr,
        "monthly_surplus": r2(unit_net - STRUCTURE - service / 12.0),
    }


def min_sales(unit_net, tax_rate, interest, service, target=1.30):
    """Ventas al año para un RCSD objetivo. Búsqueda entera."""
    for n in range(1, 80):
        row = year_result(n, unit_net, tax_rate, interest, service)
        if row["dscr"] is not None and row["dscr"] >= target:
            return n
    return None


def cash_path(payment, pay_reform_month=None, sgr=0.0):
    """Compra los 7 el día 1, vende y repone uno al mes, en el orden del lote."""
    cash = r2(CAPITAL + LOAN - sum(c for _, c, _ in LOT) - sgr)
    rows = []
    for m in range(12):
        name, cost, sell = LOT[m % len(LOT)]
        margin = net_margin(sell, cost)
        reform = CAPEX_NAVE if pay_reform_month == m + 1 else 0.0
        end = r2(cash + margin - STRUCTURE - payment - reform)
        rows.append({
            "month": m + 1,
            "unit": name,
            "margin": margin,
            "structure": STRUCTURE,
            "debt": payment,
            "reform": reform,
            "start": cash,
            "end": end,
        })
        cash = end
    return rows


def main():
    units = []
    for name, cost, sell in LOT:
        gross = r2(sell - cost)
        vat = rebu(sell, cost)
        units.append({
            "name": name,
            "cost": cost,
            "sell": sell,
            "gross": gross,
            "rebu": vat,
            "net": r2(gross - vat),
            "web_sell": WEB_SALE.get(name),
            "web_net": net_margin(WEB_SALE[name], cost) if name in WEB_SALE else None,
        })

    n = len(units)
    cost_sum = r2(sum(u["cost"] for u in units))
    sell_sum = r2(sum(u["sell"] for u in units))
    gross_sum = r2(sum(u["gross"] for u in units))
    rebu_sum = r2(sum(u["rebu"] for u in units))
    net_sum = r2(sum(u["net"] for u in units))
    avg_net = r2(net_sum / n)
    web_net_sum = r2(sum(u["web_net"] if u["web_net"] is not None else u["net"] for u in units))
    avg_web = r2(web_net_sum / n)

    payment = annuity(LOAN, RATE, MONTHS)
    interest, principal_paid, bal = year_interest(LOAN, RATE, payment)
    service = r2(payment * 12)
    service_plan = r2(PAYMENT_PLAN * 12)

    stress = year_result(12, avg_net, 0.15, interest, service)
    base = year_result(30, avg_net, 0.15, interest, service)
    stress_23 = year_result(12, avg_net, 0.23, interest, service)
    price5_units = []
    for u in units:
        sell = r2(u["sell"] * 0.95)
        price5_units.append(net_margin(sell, u["cost"]))
    avg_price5 = r2(sum(price5_units) / n)
    price5 = year_result(12, avg_price5, 0.15, interest, service)
    web = year_result(12, avg_web, 0.15, interest, service)
    # Sin nave: se quitan los 1.100 € de renta. No es el caso que se pide.
    global STRUCTURE
    saved = STRUCTURE
    STRUCTURE = saved - RENT
    no_nave = year_result(12, avg_net, 0.15, interest, service)
    STRUCTURE = saved

    # La fórmula del plan: margen / (estructura + cuota). No es el RCSD del banco.
    plan_ratio = r2(avg_net / (STRUCTURE + PAYMENT_PLAN))

    model = {
        "lot": units,
        "totals": {
            "cars": n,
            "cost": cost_sum,
            "sell": sell_sum,
            "gross": gross_sum,
            "rebu": rebu_sum,
            "net": net_sum,
            "avg_net": avg_net,
            "avg_web_net": avg_web,
            "web_net": web_net_sum,
        },
        "opex_month": {
            "rent": RENT,
            "reta": RETA,
            "marketing": MARKETING,
            "utilities": UTILITIES,
            "structure": STRUCTURE,
            "debt_plan": PAYMENT_PLAN,
            "debt_exact": payment,
            "total_plan": r2(STRUCTURE + PAYMENT_PLAN),
        },
        "loan": {
            "principal": LOAN,
            "rate": RATE,
            "months": MONTHS,
            "payment_exact": payment,
            "payment_plan": PAYMENT_PLAN,
            "y1_interest": interest,
            "y1_principal": principal_paid,
            "y1_balance": bal,
            "y1_service": service,
            "y1_service_plan": service_plan,
        },
        "funds": {
            "capital": CAPITAL,
            "loan": LOAN,
            "total": CAPITAL + LOAN,
            "stock": cost_sum,
            "residual": r2(CAPITAL + LOAN - cost_sum),
            "capex_nave": CAPEX_NAVE,
            "sgr_2pct": r2(LOAN * 0.02),
        },
        "plan_ratio": plan_ratio,
        "scenarios": {
            "stress_12": stress,
            "base_30": base,
            "stress_23": stress_23,
            "price_5": price5,
            "web_prices": web,
            "no_nave": no_nave,
        },
        "break_even_sales": {
            "dscr_130_15": min_sales(avg_net, 0.15, interest, service, 1.30),
            "dscr_100_15": min_sales(avg_net, 0.15, interest, service, 1.00),
        },
        "cash_base": cash_path(payment),
        "cash_reform_m1": cash_path(payment, pay_reform_month=1),
        "erp_check": ERP_CHECK,
        "note": (
            "El coste del plan ya incluye coche, transporte, matriculación y puesta a la venta. "
            "El margen neto no se vuelve a reducir por esos conceptos."
        ),
    }
    OUT_JSON.write_text(json.dumps(model, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUT_JSON)
    print("avg_net", avg_net, "plan_ratio", plan_ratio, "stress_dscr", stress["dscr"], "base_dscr", base["dscr"])
    print("payment", payment, "residual", model["funds"]["residual"], "be", model["break_even_sales"])
    print("price5", price5["dscr"], "web", web["dscr"], "tax23", stress_23["dscr"])
    print("cash end", model["cash_base"][-1]["end"], "with reform m1", model["cash_reform_m1"][-1]["end"])
    print("min cash base", min(r["end"] for r in model["cash_base"]))
    print("min cash reform", min(r["end"] for r in model["cash_reform_m1"]))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Arranque con 50.000 € propios. No toca el PDF de la solicitud."""

from __future__ import annotations

import importlib.util

spec = importlib.util.spec_from_file_location(
    "g", "/home/user/KHC-Auto-Import/plan-negocio/generar_presentacion.py"
)
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

LOT = [g.apply_web(u) for u in g.MODEL["lot"]]
BY = {u["nick"]: u for u in LOT}
CHEAP = sorted(LOT, key=lambda u: (u["cost"], u["name"]))
MERC = BY["Mercedes"]
r2 = g.r2


def fixed_of(nave: bool) -> float:
    return r2(g.RETA + g.MKT + (g.RENT + g.UTIL if nave else 0.0))


def fund_of(nave: bool) -> float:
    return r2(fixed_of(nave) * 3)


def n_sales(stock: int) -> int:
    if stock <= 0:
        return 0
    if stock == 1:
        return 1
    return max(2, stock // 3)


def simulate(opening, nave_from, salary_at, wait_mercedes=True):
    cash = 50000.0
    stock = []
    nave = False
    nave_opened = None
    mercedes_in = "Mercedes" in opening
    y_net = y_sal = 0.0
    struct = {1: 0.0, 2: 0.0, 3: 0.0}
    y1_tax = y2_tax = 0.0
    y1_result = y2_result = 0.0
    reduced_used = 0
    months = []
    cuts = 0
    purchases = 0.0
    gastos = g.KIT
    cobros = 0.0
    iva_all = 0.0
    taxes_paid = 0.0

    def apply_rate(base):
        nonlocal reduced_used
        if base <= 0:
            return 0.0
        if reduced_used < 2:
            reduced_used += 1
            return r2(base * 0.15)
        return g.micro_tax(base)

    def tax_now(year, ynet, ysal):
        ebitda = r2(ynet - struct[year] - (g.KIT if year == 1 else 0.0) - ysal)
        if year < 3 or reduced_used < 2:
            return r2(max(0.0, ebitda) * 0.15)
        return g.micro_tax(ebitda)

    cash = r2(cash - g.KIT)
    for nick in opening:
        car = BY[nick]
        cash = r2(cash - car["cost"])
        purchases = r2(purchases + car["cost"])
        stock.append(dict(car))
    if nave_from == 1:
        cash = r2(cash - g.REFORM)
        gastos = r2(gastos + g.REFORM)
        nave = True
        nave_opened = 1
    fx = fixed_of(nave)
    cash = r2(cash - fx)
    gastos = r2(gastos + fx)
    struct[1] = fx
    floor = fund_of(nave)
    if cash + 1e-6 < floor:
        return None
    months.append({
        "n": 1, "end": cash, "stock": len(stock), "sales": 0, "sal": 0.0,
        "want": 0.0, "margen": 0.0, "nave": nave, "floor": floor, "cobro": 0.0,
        "what": "Apertura",
    })

    for n in range(2, 37):
        year = 1 if n <= 12 else 2 if n <= 24 else 3
        if n in (13, 25):
            y_net = 0.0
            y_sal = 0.0
        if n == 19 and y1_tax:
            cash = r2(cash - y1_tax)
            taxes_paid = r2(taxes_paid + y1_tax)
        elif n == 31 and y2_tax:
            cash = r2(cash - y2_tax)
            taxes_paid = r2(taxes_paid + y2_tax)
        if not nave and nave_from is not None and n >= nave_from:
            if cash - g.REFORM + 1e-6 >= fund_of(True):
                cash = r2(cash - g.REFORM)
                gastos = r2(gastos + g.REFORM)
                nave = True
                nave_opened = n
        fx = fixed_of(nave)
        floor = fund_of(nave)
        cash = r2(cash - fx)
        gastos = r2(gastos + fx)
        struct[year] = r2(struct[year] + fx)

        k = min(n_sales(len(stock)), len(stock))
        sold = []
        margen = cobro = 0.0
        for _ in range(k):
            car = stock.pop(0)
            sold.append(car["nick"])
            cash = r2(cash + car["sell"] - car["rebu"])
            cobro = r2(cobro + car["sell"])
            cobros = r2(cobros + car["sell"])
            iva_all = r2(iva_all + car["rebu"])
            margen = r2(margen + car["net"])
            y_net = r2(y_net + car["net"])
            cash = r2(cash - car["cost"])
            purchases = r2(purchases + car["cost"])
            stock.append(dict(car))
            if not mercedes_in and r2(cash - floor) + 1e-6 >= MERC["cost"]:
                cash = r2(cash - MERC["cost"])
                purchases = r2(purchases + MERC["cost"])
                stock.append(dict(MERC))
                mercedes_in = True
                sold.append("+Mercedes")

        want = salary_at(n)
        room = r2(cash - floor)
        sal = want if room + 1e-6 >= want else r2(max(0.0, room))
        if sal + 0.02 < want:
            cuts += 1
        cash = r2(cash - sal)
        gastos = r2(gastos + sal)
        y_sal = r2(y_sal + sal)
        reserve = tax_now(year, y_net, y_sal)
        if mercedes_in or not wait_mercedes:
            while True:
                room = r2(cash - floor - reserve)
                fits = [u for u in CHEAP if u["nick"] != "Mercedes" and u["cost"] <= room + 1e-6]
                if not fits:
                    break
                nxt = fits[0]
                cash = r2(cash - nxt["cost"])
                purchases = r2(purchases + nxt["cost"])
                stock.append(dict(nxt))
        if cash + 1e-6 < floor:
            return None
        months.append({
            "n": n, "end": cash, "stock": len(stock), "sales": k, "sal": sal,
            "want": want, "margen": margen, "nave": nave, "floor": floor,
            "cobro": cobro, "what": ",".join(sold),
        })
        if n == 12:
            ebitda = r2(y_net - struct[1] - g.KIT - y_sal)
            y1_tax = apply_rate(ebitda)
            y1_result = r2(ebitda - y1_tax)
        if n == 24:
            ebitda = r2(y_net - struct[2] - y_sal)
            reduc = r2(min(0.20 * max(0.0, y1_result), 0.25 * max(0.0, ebitda)))
            y2_tax = apply_rate(r2(max(0.0, ebitda - reduc)))
            y2_result = r2(ebitda - y2_tax)

    ebitda3 = r2(y_net - struct[3] - y_sal)
    reduc3 = r2(min(0.20 * max(0.0, y2_result), 0.25 * max(0.0, ebitda3)))
    tax3 = apply_rate(r2(max(0.0, ebitda3 - reduc3)))
    result3 = r2(ebitda3 - tax3)
    identity = r2(50000 + cobros - purchases - gastos - iva_all - taxes_paid)
    if abs(identity - months[-1]["end"]) > 0.05:
        raise SystemExit(f"identidad {identity} != {months[-1]['end']}")
    stock_cost = r2(sum(u["cost"] for u in stock))
    pocket = 0.0
    for m in months:
        if m["sal"] <= 0:
            continue
        pocket = r2(pocket + m["sal"] * (0.81 if m["n"] <= 12 else 0.65))
    return {
        "months": months,
        "cuts": cuts,
        "nave": nave_opened,
        "stock": months[-1]["stock"],
        "cash": months[-1]["end"],
        "equity": r2(months[-1]["end"] + stock_cost - tax3),
        "tax3": tax3,
        "stock_cost": stock_cost,
        "y1_result": y1_result,
        "y2_result": y2_result,
        "result3": result3,
        "y1_tax": y1_tax,
        "y2_tax": y2_tax,
        "sales": sum(m["sales"] for m in months),
        "sales_y": [
            sum(m["sales"] for m in months if (1 if y == 0 else 13 if y == 1 else 25) <= m["n"] <= (12 if y == 0 else 24 if y == 1 else 36))
            for y in range(3)
        ],
        "min": min(months, key=lambda m: m["end"]),
        "pocket": pocket,
        "sal": r2(sum(m["sal"] for m in months)),
        "identity": identity,
    }


def sched(start, g1, g2, g3):
    def at(n):
        if n < start:
            return 0.0
        if n <= 12:
            return g1
        if n <= 24:
            return g2
        return g3
    return at


FAM = sched(6, g.LIVE, g.GROSS_Y2, g.GROSS_Y3)


if __name__ == "__main__":
    res = simulate(["GTI", "GTI", "116d"], 1, FAM)
    print("cuts", res["cuts"], "nave", res["nave"], "stock", res["stock"], "equity", res["equity"])
    print("sales", res["sales_y"], "pocket", res["pocket"], "cash", res["cash"], "tax3", res["tax3"])
    print("results", res["y1_result"], res["y2_result"], res["result3"])
    print("min", res["min"]["n"], res["min"]["end"], "fund", res["min"]["floor"])
    for m in res["months"]:
        if m["n"] <= 12 or m["n"] in (13, 16, 19, 24, 25, 31, 36) or m["sal"] + 0.02 < m["want"]:
            print(m["n"], m["what"] if m["n"] > 1 else "open", "sal", m["sal"], "stk", m["stock"], "end", m["end"], "floor", m["floor"])

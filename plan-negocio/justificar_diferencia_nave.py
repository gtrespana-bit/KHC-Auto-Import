#!/usr/bin/env python3
"""Por qué «lo que es suyo dentro» baja de 227.649,38 € a 141.830,56 €.

No calcula nada nuevo: llama al mismo motor que los PDF
(probar_sin_financiacion.simulate) y separa, paso a paso, lo que es coste
directo de lo que es efecto de la trayectoria de compras.

Reproduce las tablas de ANEXO_POR_QUE_BAJA_LA_CIFRA.md.
No regenera ni toca ningún PDF.

    python3 justificar_diferencia_nave.py
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

spec = importlib.util.spec_from_file_location("p", str(HERE / "probar_sin_financiacion.py"))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
g = p.g

OPEN = ["GTI", "GTI", "116d"]

# Parámetros de los dos planes, tal como están en los PDF.
VIEJO = dict(rent=1100.0, net=0.0, reform=4550.00, deposit=0.0, later=0.0, opening=OPEN)
NUEVO = dict(rent=1200.0, net=50.0, reform=5115.47, deposit=2400.0, later=1141.54, opening=OPEN)

# Coste directo (aritmética, sin motor) de cada paso.
DIRECTO = {
    "alquiler": 100.0 * 36,
    "internet": 50.0 * 36,
    "reforma": 565.47,
    "fianza": 0.0,  # se recupera al dejar la nave: no es gasto, es caja inmovilizada
}


def run(cfg, **over):
    cfg = {**cfg, **over}
    g.RENT, g.NET, g.REFORM = cfg["rent"], cfg["net"], cfg["reform"]
    return p.simulate(cfg["opening"], 1, p.FAM, deposit=cfg["deposit"], later=cfg["later"])


def money(n):
    return g.eur(n, True).rjust(12)


def fila(lab, r, ancho=40):
    dia1 = r["months"][0]
    print(
        f"{lab:<{ancho}} {money(r['equity'])}  {money(r['cash'])} {r['stock']:>4}"
        f"  {money(dia1['end'])}  {money(dia1['end'] - dia1['floor'])}"
    )


def cab(lab, ancho=40):
    print(
        f"{lab:<{ancho}} {'patrimonio':>12}  {'caja m36':>12} {'coches':>4}"
        f"  {'caja dia 1':>12}  {'sobre fondo':>12}"
    )


print("=" * 108)
print("1. LOS DOS PLANES. Misma regla de venta, mismo sueldo, mismos coches al abrir.")
print("=" * 108)
viejo, nuevo = run(VIEJO), run(NUEVO)
assert viejo["equity"] == 227649.38, viejo["equity"]
assert nuevo["equity"] == 141830.56, nuevo["equity"]
cab("")
fila("ANTES · nave San Marcos (1.100 €/mes)", viejo)
fila("HOY · nave O Milladoiro (1.200 €/mes)", nuevo)
print(f"{'Diferencia':<40} {money(viejo['equity'] - nuevo['equity'])}")
print(f"{'  ventas año 1 / 2 / 3':<40} {viejo['sales_y']}  vs  {nuevo['sales_y']}")
print()

print("=" * 108)
print("2. LA CADENA. Cada paso, uno solo, desde el plan viejo hasta el de hoy.")
print("=" * 108)
cab("")
pasos = [
    ("ANTES · San Marcos", VIEJO, None, 0.0),
    ("+100 €/mes de alquiler", None, "alquiler", DIRECTO["alquiler"]),
    ("+50 €/mes de internet", None, "internet", DIRECTO["internet"]),
    ("+565,47 € de reforma", None, "reforma", DIRECTO["reforma"]),
    ("+fianza 2.400 € y aplazar reforma", NUEVO, "fianza", DIRECTO["fianza"]),
]
cfgs = [
    VIEJO,
    dict(VIEJO, rent=1200.0),
    dict(VIEJO, rent=1200.0, net=50.0),
    dict(VIEJO, rent=1200.0, net=50.0, reform=5115.47),
    NUEVO,
]
res = [run(c) for c in cfgs]
for (lab, _, tecla, directo), r in zip(pasos, res):
    fila(lab, r)
print()
print("   paso                                  patrimonio   efecto    de eso,   de eso,")
print("                                                       total     directo   trayectoria")
for i in range(1, len(res)):
    lab, _, tecla, directo = pasos[i]
    efecto = res[i]["equity"] - res[i - 1]["equity"]
    print(
        f"   {lab:<36} {money(efecto)}  {money(-directo)} {money(efecto + directo)}"
    )
total = res[-1]["equity"] - res[0]["equity"]
directo_total = sum(DIRECTO.values())
print(
    f"   {'TOTAL':<36} {money(total)}  {money(-directo_total)}"
    f" {money(total + directo_total)}"
)
print()

print("=" * 108)
print("3. SI SE MUEVE OTRA COSA. El motor va por escalones, no en línea recta.")
print("=" * 108)
cab("partiendo del plan de hoy")
escenarios = [
    ("HOY · 3 coches, fianza 2 meses", {}),
    ("Fianza de una mensualidad (1.200 €)", dict(deposit=1200.0)),
    ("Abrir con 2 GTI y reforma entera", dict(opening=["GTI", "GTI"], later=0.0)),
    ("Un solo GTI (el mínimo)", dict(opening=["GTI"], later=0.0)),
]
for lab, over in escenarios:
    r = run(NUEVO, **over)
    fila(lab, r)
for rent in (1100.0, 1000.0):
    g.RENT = rent
    A = p.arranque(OPEN)
    r = run(NUEVO, rent=rent, deposit=A["deposit"], later=A["later"])
    fila(f"Alquiler a {rent:,.0f} €/mes".replace(",", "."), r)
print()
print("   Bajando la reforma 250 € (y dejando que el plan recalcule lo que aplaza):")
for x in (0.0, 250.0, 500.0, 750.0, 1000.0):
    g.RENT, g.NET, g.REFORM = 1200.0, 50.0, 5115.47 - x
    A = p.arranque(OPEN)
    r = p.simulate(OPEN, 1, p.FAM, deposit=A["deposit"], later=A["later"])
    dia1 = r["months"][0]
    print(
        f"   −{x:>8,.0f} € de reforma   aplazado {money(A['later'])}   caja día 1 {money(dia1['end'])}"
        f"   sobre fondo {money(dia1['end'] - dia1['floor'])}   patrimonio {money(r['equity'])}"
    )
print()

print("=" * 108)
print("4. EL TEST HONESTO. Qué queda si el mercado no traga todo lo que el plan quiere vender.")
print("=" * 108)
original = p.n_sales
for tope in (None, 5, 4, 2):
    p.n_sales = original if tope is None else (lambda s, t=tope: min(original(s), t))
    v, n = run(VIEJO), run(NUEVO)
    etiqueta = "sin tope (como los PDF)" if tope is None else f"tope de {tope} ventas al mes"
    print(
        f"   {etiqueta:<28} viejo {money(v['equity'])}  nuevo {money(n['equity'])}"
        f"   diferencia {money(v['equity'] - n['equity'])}"
    )
p.n_sales = original
print()

print("=" * 108)
print("5. DE QUÉ ESTÁ HECHA LA CIFRA")
print("=" * 108)
for lab, r in (("VIEJO", viejo), ("NUEVO", nuevo)):
    pct = 100 * r["stock_cost"] / r["equity"]
    print(
        f"   {lab:<6} {money(r['equity'])}  =  caja {money(r['cash'])}"
        f"  + coches {money(r['stock_cost'])}  + fianza {money(r['deposit'])}"
        f"  − impuesto del año 3 {money(r['tax3'])}   →  {pct:.0f} % es inventario"
    )
print()
print(
    f"   Coste directo de los cambios en 36 meses: {g.eur(directo_total, True)}"
    f"   ({100 * directo_total / (viejo['equity'] - nuevo['equity']):.0f} % de la diferencia)"
)
print(
    f"   Efecto trayectoria: {g.eur(viejo['equity'] - nuevo['equity'] - directo_total, True)}"
    f"   ({100 * (viejo['equity'] - nuevo['equity'] - directo_total) / (viejo['equity'] - nuevo['equity']):.0f} %)"
)

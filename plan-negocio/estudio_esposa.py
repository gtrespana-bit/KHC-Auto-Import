#!/usr/bin/env python3
"""Estudio fiscal: ¿contratar a la esposa (empleada), hacerla socia (autónoma o
dividendos), o no hacer nada? Sobre la trayectoria real del escenario de la
decisión (O Milladoiro, 24 plazas). 2026-2028.

Método:
  1. Cálculo marginal puro: de cada 1 € de beneficio antes de IS, cuánto llega
     a la familia (bolsillo + valor de la sociedad después de impuestos) por
     cada vía y cada año (IS 15 % años 1-2, micropyme 17/20 % año 3).
  2. Simulación sobre el motor (modelo_realista.simular): se añade la nómina
     de la esposa como coste fijo (personal) desde el mes X, a un bruto Y, y se
     mide la riqueza total (patrimonio + bolsillo dueño + bolsillo esposa), la
     solvencia y el dinero que entra a casa cada año.
"""
from __future__ import annotations
import random, sys
sys.path.insert(0, ".")
import modelo_realista as mr

E, N = mr.ESTRATEGIAS, mr.NAVES
R2 = lambda x: round(x, 2)
EUR = lambda x: f"{x:,.0f}"

# ---------------------------------------------------------------------------
# Parámetros de Seguridad Social e IRPF (2026-2028, valores reales)
# ---------------------------------------------------------------------------
# Empleada: cuota patronal total (contingencias comunes 23,60 + paro 5,20 +
# formación 0,60 + riesgos 1,00 + FOGASA 0,20 + financ. IT 0,05) y propia.
CUOTA_PATRONAL = 0.306   # ~30,6 %
CUOTA_EMPLEADA = 0.0655  # ~6,55 %
RETA = 448.69            # autónomo societario / autónoma, base mínima 2026

def irpf_general(bruto_anual):
    """IRPF general progresivo (base general) + mínimo personal 5.550.
    Devuelve (cuota, tipo efectivo sobre la base)."""
    base = bruto_anual * (1 - CUOTA_EMPLEADA)
    base_min = max(0.0, base - 5550.0)
    tramos = [(12450, .19), (20200, .24), (35200, .30), (60000, .37), (float('inf'), .45)]
    cuota, prev = 0.0, 0.0
    for lim, t in tramos:
        h = max(0.0, min(base_min, lim) - prev)
        cuota += h * t
        prev = lim
    return cuota, (cuota / base if base > 0 else 0.0)

def irpf_dividendos(importe):
    """Base del ahorro: 19 % a 6.000, 21 % a 50.000, 23 % a 200.000..."""
    tramos = [(6000, .19), (50000, .21), (200000, .23), (300000, .27), (float('inf'), .28)]
    cuota, prev = 0.0, 0.0
    for lim, t in tramos:
        cuota += max(0.0, min(importe, lim) - prev) * t
        prev = lim
    return cuota

def is_de(resultado, anio):
    if resultado <= 0:
        return 0.0
    if anio <= 2:
        return resultado * 0.15
    return min(resultado, 50000) * 0.17 + max(0.0, resultado - 50000) * 0.20

# ---------------------------------------------------------------------------
# 1) Cálculo marginal puro
# ---------------------------------------------------------------------------
def retencion(bruto_anual, anio, via):
    """De 1 € de beneficio antes de IS, cuántos € quedan (familia + sociedad)."""
    t_is = 0.15 if anio <= 2 else 0.17
    if via == "dividendo_dueno_21":
        return (1 - t_is) * (1 - 0.21)
    if via == "dividendo_dueno_19":
        return (1 - t_is) * (1 - 0.19)
    if via == "sueldo_dueno":
        # retención modelo: 19 % año 1, 35 % años 2-3 (proxy del IRPF real)
        r = 0.19 if anio == 1 else 0.35
        return (1 / (1 + CUOTA_PATRONAL)) * (1 - CUOTA_EMPLEADA) * (1 - r)
    if via == "sueldo_esposa":
        _, eff = irpf_general(bruto_anual)
        return (1 / (1 + CUOTA_PATRONAL)) * (1 - CUOTA_EMPLEADA) * (1 - eff)
    if via == "esposa_autonoma_socia":
        # Dividendo (no deducible) + RETA propio. Puro por € de beneficio:
        # el beneficio sale como dividendo 21 % y la RETA es un fijo aparte.
        return (1 - t_is) * (1 - 0.21)

print("=" * 78)
print("1) RETENCIÓN MARGINAL  (de 1 € de beneficio antes de IS, cuánto queda)")
print("   Sueldos a 1.500 €/mes.  Retención = (familia + sociedad) / beneficio.")
print("=" * 78)
vias = ["dividendo_dueno_19", "dividendo_dueno_21",
        "sueldo_dueno", "sueldo_esposa", "esposa_autonoma_socia"]
nom = {"dividendo_dueno_19": "Dividendo (dueño, tramo 19 %)",
       "dividendo_dueno_21": "Dividendo (dueño, tramo 21 %)",
       "sueldo_dueno": "Sueldo dueño (19/35 % modelo)",
       "sueldo_esposa": "Sueldo esposa 1.500 (empleada)",
       "esposa_autonoma_socia": "Esposa socia-autónoma (div. 21 %)"}
print(f"{'vía':34} {'año1 IS15':>11} {'año2 IS15':>11} {'año3 IS17':>11}")
for v in vias:
    row = [retencion(18000, a, v) for a in (1, 2, 3)]
    print(f"{nom[v]:34} {row[0]*100:>10.1f}% {row[1]*100:>10.1f}% {row[2]*100:>10.1f}%")
print()
print("Coste fijo extra de hacerla socia-autónoma: RETA", EUR(RETA*12), "€/año (no deducible).")

# ---------------------------------------------------------------------------
# 2) Simulación sobre el motor: añadir la nómina de la esposa
# ---------------------------------------------------------------------------
def owner_pocket(meses):
    """Bolsillo del dueño según la retención del modelo (19 % a12, 35 % resto)."""
    tot = 0.0
    for m in meses:
        r = 0.19 if m["mes"] <= 12 else 0.35
        tot += m["sueldo"] * (1 - r)
    return tot

def wife_pocket(meses, desde, bruto):
    """Bolsillo de la esposa: bruto - cuota propia - IRPF efectivo (anual)."""
    _, eff = irpf_general(bruto * 12)
    neto_mes = bruto * (1 - CUOTA_EMPLEADA) * (1 - eff)
    return sum(neto_mes for m in meses if m["mes"] >= desde)

def run(esposa_desde=None, esposa_bruto=0.0):
    est = dict(E["decision"], objetivo_flota=24)
    if esposa_desde:
        est["personal"] = esposa_bruto * (1 + CUOTA_PATRONAL)
        est["personal_desde"] = esposa_desde
    r = mr.simular(est, random.Random(41 * 7919))
    meses = r["meses"]
    op = owner_pocket(meses)
    wp = wife_pocket(meses, esposa_desde or 99, esposa_bruto) if esposa_desde else 0.0
    casa = op + wp
    riqueza = r["patrimonio"] + casa
    # dinero a casa por año
    def casa_anio(a):
        o = sum(m["sueldo"]*(1-(0.19 if m["mes"]<=12 else 0.35)) for m in meses if (a-1)*12 < m["mes"] <= a*12)
        w = 0.0
        if esposa_desde:
            _, eff = irpf_general(esposa_bruto*12)
            nm = esposa_bruto*(1-CUOTA_EMPLEADA)*(1-eff)
            w = sum(nm for m in meses if m["mes"]>=esposa_desde and (a-1)*12 < m["mes"] <= a*12)
        return o + w
    return dict(r=r, op=op, wp=wp, casa=casa, riqueza=riqueza,
                insol=r["insolvente"] is not None, pat=r["patrimonio"],
                ventas=r["ventas"],
                a1=casa_anio(1), a2=casa_anio(2), a3=casa_anio(3),
                min_caja=min(m["caja"] for m in meses))

print("=" * 78)
print("2) SIMULACIÓN 36 meses (O Milladoiro, 24 plazas, misma semilla)")
print("   Riqueza = patrimonio de la SL + bolsillo dueño + bolsillo esposa.")
print("=" * 78)
print(f"{'escenario':38} {'sol':>3} {'vent':>5} {'patr':>9} {'casa':>9} {'RIQUEZA':>10}")
base = run()
print(f"{'BASE: sin ella (solo dueño)':38} {int(base['insol']):>3} {base['ventas']:>5} "
      f"{EUR(base['pat']):>9} {EUR(base['casa']):>9} {EUR(base['riqueza']):>10}")
print("-" * 78)
for desde in (1, 3, 6, 9, 12, 13):
    for bruto in (1200, 1500, 1800):
        s = run(desde, bruto)
        tag = f"Empleada desde m{desde:>2} · {bruto} €/mes"
        print(f"{tag:38} {int(s['insol']):>3} {s['ventas']:>5} "
              f"{EUR(s['pat']):>9} {EUR(s['casa']):>9} {EUR(s['riqueza']):>10}")
    print("-" * 78)
print()
print("Dinero que entra a CASA por año (dueño + esposa, neto de IRPF):")
for desde in (1, 6, 13):
    for bruto in (1200, 1500, 1800):
        s = run(desde, bruto)
        print(f"  m{desde:>2} {bruto:>5} €/mes:  a1 {EUR(s['a1']):>8} | a2 {EUR(s['a2']):>8} | a3 {EUR(s['a3']):>8}   "
              f"(base: a1 {EUR(base['a1']):>8} | a2 {EUR(base['a2']):>8} | a3 {EUR(base['a3']):>8})")

# ---------------------------------------------------------------------------
# 3) Múltiples semillas (P10/P50 de la riqueza)
# ---------------------------------------------------------------------------
def run_med(desde=None, bruto=0.0, sims=25, seed=41):
    filas = []
    for i in range(sims):
        est = dict(E["decision"], objetivo_flota=24)
        if desde:
            est["personal"] = bruto * (1 + CUOTA_PATRONAL)
            est["personal_desde"] = desde
        r = mr.simular(est, random.Random(seed * 7919 + i))
        meses = r["meses"]
        op = owner_pocket(meses)
        wp = 0.0
        if desde:
            _, eff = irpf_general(bruto * 12)
            nm = bruto * (1 - CUOTA_EMPLEADA) * (1 - eff)
            wp = sum(nm for m in meses if m["mes"] >= desde)
        filas.append(dict(riqueza=r["patrimonio"] + op + wp, casa=op + wp,
                          pat=r["patrimonio"], v=r["ventas"],
                          insol=r["insolvente"] is not None, op=op, wp=wp))
    def q(k, p):
        xs = sorted(f[k] for f in filas)
        return xs[min(len(xs) - 1, int(p * len(xs)))]
    return dict(p10=q("riqueza", .10), p50=q("riqueza", .50),
                casa50=q("casa", .50), v50=q("v", .50),
                insol=100 * sum(f["insol"] for f in filas) / len(filas))

print("=" * 78)
print("3) RIQUEZA (P10/P50, 25 semillas) — O Milladoiro 24 plazas")
print("=" * 78)
print(f"{'escenario':40} {'P10':>9} {'P50':>9} {'casa50':>9} {'vent':>4} {'insol%':>6}")
b = run_med()
print(f"{'BASE: sin ella':40} {EUR(b['p10']):>9} {EUR(b['p50']):>9} {EUR(b['casa50']):>9} {b['v50']:>4} {b['insol']:>5.0f}%")
esc = [("m1 · 1.200", 1, 1200), ("m3 · 1.200", 3, 1200), ("m3 · 1.500", 3, 1500),
       ("m6 · 1.200", 6, 1200), ("m6 · 1.500", 6, 1500), ("m6 · 1.800", 6, 1800),
       ("m9 · 1.500", 9, 1500), ("m12 · 1.500", 12, 1500), ("m13 · 1.500", 13, 1500),
       ("m13 · 1.800", 13, 1800)]
for tag, desde, bruto in esc:
    s = run_med(desde, bruto)
    d = s["p50"] - b["p50"]
    print(f"{'empleado desde ' + tag:40} {EUR(s['p10']):>9} {EUR(s['p50']):>9} {EUR(s['casa50']):>9} "
          f"{s['v50']:>4} {s['insol']:>5.0f}%   ΔP50 {d:+,.0f}")

#!/usr/bin/env python3
"""Calcula todos los números del plan de ejecución (escenario 24 pl + ella +
dividendos 50/50 a fin de año) y los guarda en plan_ejecucion.json.

Uso:  python3 calc_plan.py
"""
from __future__ import annotations
import importlib.util
import json
import random
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location("mr", str(HERE / "modelo_realista.py"))
mr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mr)
import estudio_esposa as es

CUOTA = es.CUOTA_PATRONAL
SIM = 250


def div_neto(bruto):
    """Neto de un dividendo bruto repartido 50/50 (IRPF del ahorro a cada mitad)."""
    if bruto <= 0:
        return 0.0
    mitad = bruto / 2.0
    return bruto - 2.0 * es.irpf_dividendos(mitad)


def escenario():
    e = dict(mr.ESTRATEGIAS["decision"])
    e["nave"] = dict(mr.NAVES["milladoiro"], plazas=24)
    e["objetivo_flota"] = 24
    e["tope_modelo"] = 3
    # Media jornada (750 €) desde m6; subida a completa (1.500 €) en m16
    e["personal"] = 750 * (1 + CUOTA)
    e["personal_desde"] = 6
    e["personal_sube"] = 16
    e["personal_sube_imp"] = 1500 * (1 + CUOTA)
    e["dividendos"] = True
    return e


def bruto_ella(mes):
    """Bruto mensual de ella según el plan (media→completa en m16)."""
    if mes < 6:
        return 0.0
    return 1500.0 if mes >= 16 else 750.0


def neto_ella(mes):
    bruto = bruto_ella(mes)
    if bruto <= 0:
        return 0.0
    _, e = es.irpf_general(bruto * 12)
    return bruto * (1 - es.CUOTA_EMPLEADA) * (1 - e)


def main():
    u = mr.UNIDADES
    kit = mr.g.KIT
    n = mr.NAVES["milladoiro"]
    fijos1 = n["rent"] + n["util"] + n["net"] + n["seguro"] + n["tasas"] + 448.69 + mr.g.MKT
    trio_coste = u["116d"]["coste"] + u["A3"]["coste"] + u["GTI"]["coste"]

    raw = [
        ("Capital propio (lo que tenéis)", 50000.0),
        ("Constitución de la SL (notaría, registro, gestoría)", -1200.0),
        ("Fianza de la nave (2 mensualidades)", -2400.0),
        ("Licencia de actividad + técnico", -800.0),
        ("Kit de equipo y detallado", -kit),
        ("Trío de arranque (116d + A3 + GTI)", -trio_coste),
        ("Gastos fijos del mes 1", -fijos1),
    ]
    dia1, run = [], 0.0
    for i, (lab, mov) in enumerate(raw):
        run = mov if i == 0 else run + mov
        dia1.append([lab, mov, run])

    V = [{} for _ in range(37)]
    F = [{} for _ in range(37)]
    C = [{} for _ in range(37)]
    insol = 0
    pat, vtot, rm, minc, minmes = [], [], [], [], []
    sd = {1: [], 2: [], 3: []}   # dueño sueldo neto
    se = {1: [], 2: [], 3: []}   # ella sueldo neto
    dv = {1: [], 2: [], 3: []}   # dividendos netos
    for i in range(SIM):
        r = mr.simular(escenario(), random.Random(41 * 7919 + i))
        if r["insolvente"] is not None:
            insol += 1
        pat.append(r["patrimonio"])
        vtot.append(r["ventas"])
        minc.append(r["min_caja"])
        minmes.append(r["min_caja_mes"])
        if r["reforma_mes"]:
            rm.append(r["reforma_mes"])
        meses = r["meses"]
        for x in meses:
            V[x["mes"]][i] = x["ventas"]
            F[x["mes"]][i] = x["flota"]
            C[x["mes"]][i] = x["caja"]
        a_sd = {1: 0.0, 2: 0.0, 3: 0.0}
        a_se = {1: 0.0, 2: 0.0, 3: 0.0}
        for x in meses:
            a = 1 if x["mes"] <= 12 else 2 if x["mes"] <= 24 else 3
            a_sd[a] += x["sueldo"] * (1 - (0.19 if x["mes"] <= 12 else 0.35))
            a_se[a] += neto_ella(x["mes"])
        for a in (1, 2, 3):
            sd[a].append(a_sd[a])
            se[a].append(a_se[a])
            dv[a].append(div_neto(r["dividendos_anio"][a]))

    med = lambda d: statistics.median(d.values()) if d else 0.0
    mensual = {m: [med(V[m]), med(F[m]), med(C[m])] for m in range(1, 37)}
    sd_m = {a: statistics.mean(sd[a]) for a in (1, 2, 3)}
    se_m = {a: statistics.mean(se[a]) for a in (1, 2, 3)}
    dv_m = {a: statistics.mean(dv[a]) for a in (1, 2, 3)}
    out = dict(
        dia1=dia1, kit=kit, fijos1=fijos1, trio_coste=trio_coste,
        mensual=mensual, insol=100 * insol / SIM,
        v50=statistics.median(vtot), pat50=statistics.median(pat),
        obra=statistics.median(rm), obra_min=min(rm), obra_max=max(rm),
        minc=statistics.median(minc), minmes=statistics.median(minmes),
        sd=sd_m, se=se_m, dv=dv_m,
    )
    for a in (1, 2, 3):
        out[f"casa_{a}"] = sd_m[a] + se_m[a] + dv_m[a]
    out["casa_tot"] = sum(out[f"casa_{a}"] for a in (1, 2, 3))
    (HERE / "plan_ejecucion.json").write_text(json.dumps(out, indent=2))
    print("mes  vent  flota   caja")
    for m in range(1, 37):
        print(f"{m:2d}   {mensual[m][0]:4.0f}  {mensual[m][1]:4.0f}  {mensual[m][2]:9,.0f}")
    print(f"insol {out['insol']:.1f}% vent {out['v50']:.0f} patr {out['pat50']:,.0f} "
          f"obra m{out['obra']:.0f} (rango {out['obra_min']}-{out['obra_max']})")
    print(f"minc mediana {out['minc']:,.0f} (mes ~{out['minmes']:.0f})")
    for a in (1, 2, 3):
        print(f"a{a}: dueño {sd_m[a]:,.0f} + ella {se_m[a]:,.0f} + div {dv_m[a]:,.0f} "
              f"= CASA {out[f'casa_{a}']:,.0f}")
    print(f"CASA total {out['casa_tot']:,.0f}")


if __name__ == "__main__":
    main()

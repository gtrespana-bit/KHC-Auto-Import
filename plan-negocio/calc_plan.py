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


# ---------------------------------------------------------------------------
# PLAN DE CATERA (24 plazas). En vez de una sola regla de compra, el dealer
# fija cuántas unidades de cada modelo quiere mantener en la flota completa.
# La mezcla es la de un negocio real de reventa (variedad por segmento):
#   - 11 pequeños de alta rotación  -> el motor de caja (giran en ~32-45 días)
#   -  9 SUV / compactos            -> el volumen y la variedad (45-48 días)
#   -  4 premium de margen alto     -> tardan ~1-2 semanas más, pero dan
#                                       4.500-6.500 € de beneficio por coche
# Dentro de esta mezcla, el motor siempre compra el coche MÁS EFICIENTE (ROI)
# entre los que aún no han llegado a su cupo: maximiza la caja a casa.
# ---------------------------------------------------------------------------
CUPOS = dict(
    # pequeños rápidos
    Polo=2, **{"116d": 2, "Leon": 2, "Golf VIII": 2, "GTI": 2, "A3": 1},
    # SUV / compactos
    Corolla=2, **{"3008": 2, "Tiguan": 2, "XC40": 2, "318d": 1},
    # premium de margen alto
    X1=1, Mercedes=1, XC60=1, **{"330d": 1},
)
assert sum(CUPOS.values()) == 24, "los cupos deben sumar 24 plazas"


def escenario():
    e = dict(mr.ESTRATEGIAS["decision"])
    e["nave"] = dict(mr.NAVES["milladoiro"], plazas=24)
    e["objetivo_flota"] = 24
    e["cupos"] = CUPOS
    # Media jornada (750 €) desde m6; subida a completa (1.500 €) en m16
    e["personal"] = 750 * (1 + CUOTA)
    e["personal_desde"] = 6
    e["personal_sube"] = 16
    e["personal_sube_imp"] = 1500 * (1 + CUOTA)
    # Obra en 2 tramos: el suelo exige la nave vacía (se paga en el día 1); el
    # resto (luz, pintura, señalización, mobiliario, seguridad, limpieza) se hace
    # poco a poco con coches dentro y se paga cuando la caja lo aguanta.
    e["reforma_b"] = 4210.47     # resto de la obra (de 5.115,47 €)
    e["reforma_suelo"] = 905.0   # suelo epoxi, con la nave vacía
    e["suelo_max_flota"] = 5
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

    SUELO = 905.0
    raw = [
        ("Capital propio (lo que tenéis)", 50000.0),
        ("Constitución de la SL (notaría, registro, gestoría)", -1200.0),
        ("Fianza de la nave (2 mensualidades)", -2400.0),
        ("Licencia de actividad + técnico", -800.0),
        ("Kit de equipo y detallado", -kit),
        ("Trío de arranque (116d + A3 + GTI)", -trio_coste),
        ("Suelo, con la nave vacía (tramo urgente de la obra)", -SUELO),
        ("Gastos fijos del mes 1", -fijos1),
    ]
    dia1, run = [], 0.0
    for i, (lab, mov) in enumerate(raw):
        run = mov if i == 0 else run + mov
        dia1.append([lab, mov, run])

    V = [{} for _ in range(37)]
    F = [{} for _ in range(37)]
    C = [{} for _ in range(37)]
    FJ = [{} for _ in range(37)]   # fijos del mes (mediana)
    SU = [{} for _ in range(37)]   # sueldo dueño bruto del mes (mediana)
    # Detalle mensual: por mes y sim, unidades/€ comprados y vendidos, y mezcla.
    CP_N = [dict() for _ in range(37)]    # mes -> {sim: unidades}
    CP_E = [dict() for _ in range(37)]    # mes -> {sim: €}
    CP_MX = [dict() for _ in range(37)]   # mes -> {nick: unidades totales}
    VT_N = [dict() for _ in range(37)]
    VT_E = [dict() for _ in range(37)]
    VT_NT = [dict() for _ in range(37)]
    VT_MX = [dict() for _ in range(37)]
    insol = 0
    pat, vtot, rm, minc, minmes = [], [], [], [], []
    casa_list = []
    rm_suelo = 1  # se paga en el día 1 (nave vacía) si el escenario lo pide
    sd = {1: [], 2: [], 3: []}   # dueño sueldo neto
    se = {1: [], 2: [], 3: []}   # ella sueldo neto
    dv = {1: [], 2: [], 3: []}   # dividendos netos
    div_bruto = {1: [], 2: [], 3: []}
    is_anio = {1: [], 2: [], 3: []}
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
        rm_suelo = r["reforma_suelo_mes"] or rm_suelo
        meses = r["meses"]
        for x in meses:
            m = x["mes"]
            V[m][i] = x["ventas"]
            F[m][i] = x["flota"]
            C[m][i] = x["caja"]
            FJ[m][i] = x["fijos"]
            SU[m][i] = x["sueldo"]
            for nick, coste in x.get("compras", []):
                CP_N[m][i] = CP_N[m].get(i, 0) + 1
                CP_E[m][i] = CP_E[m].get(i, 0.0) + coste
                CP_MX[m][nick] = CP_MX[m].get(nick, 0) + 1
            for nick, venta, neto in x.get("ventas_det", []):
                VT_N[m][i] = VT_N[m].get(i, 0) + 1
                VT_E[m][i] = VT_E[m].get(i, 0.0) + venta
                VT_NT[m][i] = VT_NT[m].get(i, 0.0) + neto
                VT_MX[m][nick] = VT_MX[m].get(nick, 0) + 1
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
            div_bruto[a].append(r["dividendos_anio"][a])
            is_anio[a].append(r[f"impuesto{a}"])
        casa_list.append(sum(a_sd.values()) + sum(a_se.values())
                        + sum(div_neto(r["dividendos_anio"][a]) for a in (1, 2, 3)))

    med = lambda d: statistics.median(d.values()) if d else 0.0
    mensual = {m: [med(V[m]), med(F[m]), med(C[m])] for m in range(1, 37)}
    fijos_m = {m: med(FJ[m]) for m in range(1, 37)}
    sueldo_m = {m: med(SU[m]) for m in range(1, 37)}
    # Trayectoria representativa: la sim cuya caja mes a mes más replica a la mediana
    # (mínima desviación absoluta total). Se usa para el mes a mes: el flujo cuadra al
    # céntimo y la caja de cada mes coincide con la que muestra el resumen.
    med_caja_m = {m: statistics.median(C[m].values()) for m in range(1, 37)}
    best_i = min(
        range(SIM),
        key=lambda i: sum(abs(C[m][i] - med_caja_m[m]) for m in range(1, 37)),
    )
    r_rep = mr.simular(escenario(), random.Random(41 * 7919 + best_i))
    tray = [
        dict(mes=x["mes"], caja=x["caja"], flota=x["flota"], fijos=x["fijos"], sueldo=x["sueldo"],
             ventas_det=x.get("ventas_det", []), compras=x.get("compras", []),
             stock_mix=x.get("stock_mix", {}),
             averias=x.get("averias", 0.0), obra=x.get("obra", 0.0),
             is_paid=x.get("is_paid", 0.0), div=x.get("div", 0.0),
             rebu=x.get("rebu", 0.0))
        for x in r_rep["meses"]
    ]
    # Catálogo completo (para la lámina del PDF): coste de compra, precio de
    # venta (IVA incluido en la venta al cliente), margen neto y €/día.
    catalogo = [
        dict(nick=nick, nombre=u["nombre"], coste=u["coste"], venta=u["venta"],
             dias=u["dias"], neto=u["neto"], margen_dia=round(u["margen_dia"], 1),
             pct=round(100.0 * (u["venta"] - u["coste"]) / u["coste"], 1))
        for nick, u in sorted(u.items(), key=lambda kv: kv[1]["margen_dia"], reverse=True)
    ]
    # "A casa" de la trayectoria representativa (para contrastar con la mediana).
    _sd = {1: 0.0, 2: 0.0, 3: 0.0}
    _se = {1: 0.0, 2: 0.0, 3: 0.0}
    for x in r_rep["meses"]:
        a = 1 if x["mes"] <= 12 else 2 if x["mes"] <= 24 else 3
        _sd[a] += x["sueldo"] * (1 - (0.19 if x["mes"] <= 12 else 0.35))
        _se[a] += neto_ella(x["mes"])
    tray_casa = {a: _sd[a] + _se[a] + div_neto(r_rep["dividendos_anio"][a]) for a in (1, 2, 3)}
    tray_casa_total = sum(tray_casa.values())
    # Detalle mensual agregado (mesa "típica" sobre las SIM trayectorias).
    def _mix(d):
        return {k: v / SIM for k, v in d.items() if v / SIM >= 0.3}
    compra_det = {
        m: dict(n=med(CP_N[m]), eur=med(CP_E[m]), mix=_mix(CP_MX[m]))
        for m in range(1, 37)}
    venta_det = {
        m: dict(n=med(VT_N[m]), eur=med(VT_E[m]), neto=med(VT_NT[m]), mix=_mix(VT_MX[m]))
        for m in range(1, 37)}
    sd_m = {a: statistics.mean(sd[a]) for a in (1, 2, 3)}
    se_m = {a: statistics.mean(se[a]) for a in (1, 2, 3)}
    dv_m = {a: statistics.mean(dv[a]) for a in (1, 2, 3)}
    out = dict(
        dia1=dia1, kit=kit, fijos1=fijos1, trio_coste=trio_coste,
        catalogo=catalogo,
        mensual=mensual, insol=100 * insol / SIM,
        v50=statistics.median(vtot), pat50=statistics.median(pat),
        obra=statistics.median(rm), obra_min=min(rm), obra_max=max(rm),
        obra_suelo=rm_suelo,
        minc=statistics.median(minc), minmes=statistics.median(minmes),
        sd=sd_m, se=se_m, dv=dv_m,
        compra_det=compra_det, venta_det=venta_det,
        fijos_m=fijos_m, sueldo_m=sueldo_m,
        div_bruto={a: statistics.median(div_bruto[a]) for a in (1, 2, 3)},
        is_anio={a: statistics.median(is_anio[a]) for a in (1, 2, 3)},
        tray=tray, tray_casa=tray_casa, tray_casa_total=tray_casa_total,
        rep_ventas=r_rep["ventas"], rep_insolvente=r_rep["insolvente"],
        rep_patrimonio=r_rep["patrimonio"],
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

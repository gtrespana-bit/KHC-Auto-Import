#!/usr/bin/env python3
"""Sensibilidad de rotación: mismo motor legal (modelo_realista) con días +20% y +40%.

No cambia NINGÚN supuesto salvo el multiplicador `dias` del escenario (f_dias en
simular()). Se usa la misma semilla y nº de simulaciones que calc_plan.py para que
la comparación sea manzanita: mismas trayectorias, solo más lentas las ventas.
Salida: sensibilibdad_rotacion.json (consumido por generar_plan_ejecucion.py).
"""
from __future__ import annotations
import importlib.util, json, random, statistics, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location("mr", str(HERE / "modelo_realista.py"))
mr = importlib.util.module_from_spec(spec); spec.loader.exec_module(mr)
import calc_plan as cp

SIM = 250
FACTORES = {"central": 1.0, "rot+20": 1.20, "rot+40": 1.40}

def run(f_dias):
    e = dict(cp.escenario())
    e["dias"] = f_dias
    casa, pat, vent, insol, minc = [], [], [], 0, []
    for i in range(SIM):
        r = mr.simular(e, random.Random(41 * 7919 + i))
        if r["insolvente"] is not None:
            insol += 1
        pat.append(r["patrimonio"]); vent.append(r["ventas"])
        minc.append(r["min_caja"])
        divs = r["dividendos_anio"]
        c = sum(divs[a] and cp.div_neto(divs[a]) or 0.0 for a in (1, 2, 3))
        # sueldos netos igual que calc_plan
        for x in r["meses"]:
            pass
        sd = sum(x["sueldo"] * (1 - (0.19 if x["mes"] <= 12 else 0.35)) for x in r["meses"])
        se = sum(cp.neto_ella(x["mes"]) for x in r["meses"])
        casa.append(sd + se + c)
    med = lambda v: statistics.median(v)
    return dict(factor=f_dias, ventas_p50=med(vent), patrimonio_p50=round(med(pat), 2),
                casa_p50=round(med(casa), 2), insolvente_pct=round(100 * insol / SIM, 1),
                min_caja_p50=round(med(minc), 2))

res = {k: run(v) for k, v in FACTORES.items()}
out = HERE / "sensibilidad_rotacion.json"
out.write_text(json.dumps(res, indent=2, ensure_ascii=False))
for k, v in res.items():
    print(f"{k:>8}: ventas {v['ventas_p50']:.0f} · patrimonio {v['patrimonio_p50']:,.0f} € · "
          f"a casa {v['casa_p50']:,.0f} € · insolvente {v['insolvente_pct']} %")

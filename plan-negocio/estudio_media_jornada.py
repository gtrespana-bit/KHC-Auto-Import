#!/usr/bin/env python3
"""¿Media jornada para la socia-empleada hasta que el sueldo se pueda subir?

Compara (250 sims, mediana/insolvente) el plan actual (completa desde m6) contra
media jornada (750 €) con subida a completa (1.500 €) en distintos meses.

Uso:  python3 estudio_media_jornada.py
"""
from __future__ import annotations
import importlib.util
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
EMP = es.CUOTA_EMPLEADA
SIM = 250
FULL = 1500.0
MED = 750.0


def esc(sube=None):
    e = dict(mr.ESTRATEGIAS["decision"])
    e["nave"] = dict(mr.NAVES["milladoiro"], plazas=24)
    e["objetivo_flota"] = 24
    e["tope_modelo"] = 3
    e["personal_desde"] = 6
    e["personal"] = MED * (1 + CUOTA) if sube else FULL * (1 + CUOTA)
    if sube:
        e["personal_sube"] = sube
        e["personal_sube_imp"] = FULL * (1 + CUOTA)
    e["dividendos"] = True
    return e


def irpf_net(gross_monthly):
    """Neto mensual de un sueldo bruto (SS + IRPF general con mínimo)."""
    cuota, e = es.irpf_general(gross_monthly * 12)
    return gross_monthly * (1 - EMP) * (1 - e)


def gross_month(mes, sube):
    """Bruto mensual de ella en el mes `mes` según el escenario."""
    if mes < 6:
        return 0.0
    if sube and mes >= sube:
        return FULL
    return MED if sube else FULL


def correr(sube):
    insol = 0
    minc, minmes, pat, vtot = [], [], [], []
    sd, se, dv = {1: [], 2: [], 3: []}, {1: [], 2: [], 3: []}, {1: [], 2: [], 3: []}
    for i in range(SIM):
        r = mr.simular(esc(sube), random.Random(41 * 7919 + i))
        if r["insolvente"] is not None:
            insol += 1
        minc.append(r["min_caja"])
        minmes.append(r["min_caja_mes"])
        pat.append(r["patrimonio"])
        vtot.append(r["ventas"])
        a_sd = {1: 0.0, 2: 0.0, 3: 0.0}
        a_se = {1: 0.0, 2: 0.0, 3: 0.0}
        for x in r["meses"]:
            a = 1 if x["mes"] <= 12 else 2 if x["mes"] <= 24 else 3
            a_sd[a] += x["sueldo"] * (1 - (0.19 if x["mes"] <= 12 else 0.35))
            g = gross_month(x["mes"], sube)
            if g:
                a_se[a] += irpf_net(g)
        for a in (1, 2, 3):
            sd[a].append(a_sd[a])
            se[a].append(a_se[a])
            dv[a].append(div_neto(r["dividendos_anio"][a]))
    med = lambda L: statistics.median(L)
    casa = {a: statistics.mean(sd[a]) + statistics.mean(se[a]) + statistics.mean(dv[a])
            for a in (1, 2, 3)}
    return dict(
        insol=100 * insol / SIM, minc=med(minc), minmes=med(minmes),
        v50=med(vtot), pat50=med(pat),
        casa=casa, casa_tot=sum(casa.values()),
        se_tot=sum(statistics.mean(se[a]) for a in (1, 2, 3)),
        dv_tot=sum(statistics.mean(dv[a]) for a in (1, 2, 3)),
    )


def div_neto(bruto):
    if bruto <= 0:
        return 0.0
    h = bruto / 2.0
    return bruto - 2.0 * es.irpf_dividendos(h)


if __name__ == "__main__":
    print(f"{'escenario':34s} {'insol':>6s} {'mín caja':>9s} {'m.mín':>5s} "
          f"{'vent':>4s} {'patrim':>9s} {'ella':>8s} {'a casa':>9s}")
    base = correr(None)
    print(f"{'completa desde m6 (plan actual)':34s} {base['insol']:5.1f}% {base['minc']:9,.0f} "
          f"{base['minmes']:4.0f} {base['v50']:4.0f} {base['pat50']:9,.0f} "
          f"{base['se_tot']:8,.0f} {base['casa_tot']:9,.0f}")
    for sube in (13, 16, 19, 24):
        r = correr(sube)
        print(f"{'media→completa en m%02d' % sube:34s} {r['insol']:5.1f}% {r['minc']:9,.0f} "
              f"{r['minmes']:4.0f} {r['v50']:4.0f} {r['pat50']:9,.0f} "
              f"{r['se_tot']:8,.0f} {r['casa_tot']:9,.0f}")
    print()
    print("Detalle a casa (media→completa m16):")
    r = correr(16)
    for a in (1, 2, 3):
        print(f"  a{a}: {r['casa'][a]:,.0f}")

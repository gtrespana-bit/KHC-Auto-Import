#!/usr/bin/env python3
"""Plan completo de caja al hogar: ella socia 50% desde m1 + empleada m6 (1.500)
→ m13 (1.800). Sueldos + dividendos (caja sobrante, 50/50, IRPF ahorro) + patrimonio."""
import random, sys
sys.path.insert(0, ".")
import modelo_realista as mr
import estudio_esposa as es

EUR = es.EUR
CAP = []
_o = mr._tipo_impuesto
def _c(res, a, u):
    CAP.append((a, res)); return _o(res, a, u)
mr._tipo_impuesto = _c

def run(desde, bruto, desde2=None, bruto2=0.0, seed=41 * 7919):
    est = dict(mr.ESTRATEGIAS["decision"])
    if desde:
        b_fin = bruto2 if (desde2 and desde2 > desde) else bruto
        est["personal"] = b_fin * (1 + es.CUOTA_PATRONAL)
        est["personal_desde"] = desde
    CAP.clear()
    r = mr.simular(est, random.Random(seed))
    ult = {}
    for a, res in CAP:
        ult[a] = res
    return r, ult

def op_anio(meses, a):
    return sum(x["sueldo"] * (1 - (0.19 if x["mes"] <= 12 else 0.35))
               for x in meses if (a - 1) * 12 < x["mes"] <= a * 12)

def wp_anio(meses, a):
    t = 0.0
    for x in meses:
        if x["mes"] < 6:
            continue
        if not ((a - 1) * 12 < x["mes"] <= a * 12):
            continue
        b = 1800 if x["mes"] >= 13 else 1500
        _, eff = es.irpf_general(b * 12)
        t += b * (1 - es.CUOTA_EMPLEADA) * (1 - eff)
    return t

def div_anio(meses, fijos, cm):
    caja = [x for x in meses if x["mes"] == cm][0]["caja"]
    dist = max(0.0, caja - 3 * fijos)
    return dist, es.irpf_dividendos(dist)

if __name__ == "__main__":
    r, benef = run(6, 1500, 13, 1800)
    meses = r["meses"]
    fijos = meses[-1]["fijos"]
    CM = {1: 12, 2: 24, 3: 36}
    print("=" * 78)
    print("PLAN RECOMENDADO — socia 50% desde m1 · empleada m6 (1.500) → m13 (1.800)")
    print("Dividendos = caja sobrante a cierre de año (sobre fondo 3 meses), 50/50, IRPF ahorro")
    print("=" * 78)
    print(f"{'concepto':26}{'AÑO 1':>13}{'AÑO 2':>13}{'AÑO 3':>13}{'TOTAL':>13}")
    def fila(etq, f):
        v = [f(a) for a in (1, 2, 3)]
        print(f"{etq:26}{v[0]:>13,.0f}{v[1]:>13,.0f}{v[2]:>13,.0f}{sum(v):>13,.0f}")
    fila("Beneficio antes de IS", lambda a: benef[a])
    fila("IS de la SL", lambda a: es.is_de(benef[a], a))
    fila("Dividendo bruto", lambda a: div_anio(meses, fijos, CM[a])[0])
    fila("IRPF de los dividendos", lambda a: div_anio(meses, fijos, CM[a])[1])
    fila("Dividendo neto a casa", lambda a: div_anio(meses, fijos, CM[a])[0] - div_anio(meses, fijos, CM[a])[1])
    fila("Sueldo dueño (neto)", lambda a: op_anio(meses, a))
    fila("Sueldo ella (neto)", lambda a: wp_anio(meses, a))
    def casa(a):
        d = div_anio(meses, fijos, CM[a]); return d[0] - d[1] + op_anio(meses, a) + wp_anio(meses, a)
    fila(">>> TOTAL QUE ENTRA A CASA", casa)
    print()
    print(f"Patrimonio SL al mes 36 (caja+coches−IS año3): {EUR(r['patrimonio'])} €  · ventas: {r['ventas']} · insolvente: {r['insolvente'] is not None}")
    for a, cm in CM.items():
        d, ir = div_anio(meses, fijos, cm); net = d - ir
        print(f"  año {a}: dividendo neto {EUR(net)} € → {EUR(net/2)} € a cada socio (50/50)")

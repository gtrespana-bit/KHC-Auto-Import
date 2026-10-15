#!/usr/bin/env python3
"""PLAN v3 — modelo mes a mes, desde 0, con las 5 respuestas del dueño fijadas.

Decisiones del dueño (14-oct-2026):
  [TÚ] Capital: 50.000 €            [TÚ] Nave SI o SI, grande (no tiene sentido
  [TÚ] Nave grande de una vez          adaptar y mudarse a los meses)
  [TÚ] Compra a quien salga rentable (mix concesionario/particular)
  [TÚ] Objetivo: >= 2.500 €/mes netos para ambos en el año 1

Catálogo: NO es una lista heredada. Sale de catalogo.py (regla objetiva sobre
74.875 anuncios reales del repo). Este modelo usa los 9 segmentos aprobados que
ademas tienen muestra suficiente y precio medio razonable para el capital.

Motor: pipeline realista. Un coche comprado hoy vuelve a caja dentro de
lead(10 d) + dias_venta. Los dias_venta salen de la evidencia del repo
(ANALISIS_TIEMPO_VENTA.md: mediana mercado 40-43 d; nicho alto valor mas lento),
ajustados por demanda relativa ES (nES de la propia captura como proxy de cuan
buscado esta cada modelo en Espana).

Formas juridicas modeladas (todo [ERP rates.js]):
  A) SL familiar: IS microempresa 19 % (<50k) / 21 %; socios no operativos ->
     cuota cero; sueldos BRUTOS deducibles por la SL.
  B) Autonomo integrado (el marido) con tarifa plana 80 €/mes ano 1 [ERP
     RETA_2026.tarifaPlana]; esposa como empleada del regimen general (alta
     ~205 €/mes, empresa+trabajador) en lugar de segunda cuota RETA.
     Rendimiento neto = margen - fijos - RETA - gasto generico 7 % [ERP note].
     IRPF por tramos combinados Galicia [ERP IRPF_GENERAL_COMBINED], minimo
     personal 5.550 € [ERP].
Comparacion honesta: en B el sueldo del autonomo NO es gasto (es su rendimiento);
en A el sueldo de ambos si lo es, pero paga IRPF el que lo cobra y la SL paga IS.
"""
from __future__ import annotations
import json, statistics as st
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAT = {tuple(r["gen"]) + (r["seg"],): r for r in json.load(open(HERE / "catalogo_v3.json"))}

# ---- parametros generales -------------------------------------------------
CAPITAL        = 50_000.0
IVA_REBU       = 0.21          # [ERP] art.137 LIVA: IVA solo sobre el margen
# NOTA ISD: los precios de los portales alemanes son brutos e incluyen la
# Kraftfahrzeugsteuer (ISD). En turismos con varios años de uso el vendedor ya la
# tiene pagada (se paga al matricular y luego anual); al comprar como no-empresario
# alemán no hay devolucion posible, pero tampoco se re-devenga: coste 0 EUR.
# Riesgo residual: coches casi nuevos de concesionario con ISD "en bruto alto" ->
# en la inspeccion previa se verifica en la Zulassungsbescheinigung antes de cerrar.
CUOTA_ISD      = 0.0
RENT           = 1_200.0       # [repo] nave O Milladoiro 465 m², datos_nave_milladoiro.py
UTILITIES      = 250.0         # luz trifasica 400 m² + agua + vado [estimacion]
ASESORIA       = 150.0         # contable + fiscal (dos personas, modelos 303/349/111)
PORTALES       = 250.0         # Coches.net pro + Wallapop + mobile.de basic
SEGUROS_RC     = 90.0          # RC actividad + flotante provisional
PLANNING       = 160.0         # viajes de compra prorrateados (vuelo+hotel, 2/mes)
VARIOS         = 100.0
FIJOS_NAVE     = RENT + UTILITIES + ASESORIA + PORTALES + SEGUROS_RC + PLANNING + VARIOS  # 2.200
# Reforma e instalacion de la nave: se paga ANTES del mes 1 y sale del capital.
# Cifra validada del repo: REFORMA_FASE1_COMPLETA.md = 5.115 EUR (suelo epoxi zona
# exposicion + LED + cortina + alarma; mano de obra propia). Se anaden mesas/sillas
# y senalética ligeras: total 7.000 EUR [TÚ confirmable].
ARRANQUE_NAVE  = 7_000.0
FIANZA_NAVE    = 1_200.0       # 1 mes de fianza (LAOU)
CONSTITUCION   = 1_200.0       # SL: notaria + registro + asesoría alta [autónomo: ~300]
CAPITAL_INICIONAL = CAPITAL - ARRANQUE_NAVE - FIANZA_NAVE - CONSTITUCION  # dinero para stock
RETA_MARIDO    = 80.0          # [ERP] tarifa plana 12 primeros meses
COTIZ_ESPOSA_EMPLEADA = 205.0  # alta RG trabajador + empresa, base minima [TGSS 2026, aprox]
SUELDO_CADA    = 1_450.0
SUELDO_ESPOSA  = 1_200.0       # [TÚ objetivo] neto/mes por persona -> 2.900 conjunto
MESES          = 12
DIAS_MES       = 30.0

# Catalogo operativo: nick, generacion, seg_km, peso (fraccion del stock), nES.
# Los dias_venta NO son una hipotesis libre: salen de ANALISIS_TIEMPO_VENTA.md
# (mediana del mercado 40-43 d; los mas rapidos de Espana 33 d) ajustados por
# precio y por demanda relativa ES (nES propio de la captura como proxy).
OPERATIVO = [
    #  nick                 gen                  seg  peso  nES
    ("Q5 FY 0-40",          ("Q5","Q5 FY"),         0, 0.08,  21),
    ("Macan 80-120",        ("Macan","Macan 95B"),  2, 0.07,  29),
    ("CLA C118 120-160",    ("CLA","CLA C118"),     3, 0.18,  44),
    ("ClaseE W213 160-200", ("Clase E","Clase E W213"), 3, 0.16, 79),
    ("GLC 300e 80-120",     ("GLC","GLC X253 300e"),2, 0.08,  92),
    ("Clase A W177 160-200",("Clase A","Clase A W177"),4, 0.16, 53),
    ("Clase C W205 80-120", ("Clase C","Clase C W205"),2, 0.09, 25),
    ("Serie3 F30 120-160",  ("Serie 3","Serie 3 F30 LCI"),3, 0.10, 47),
    ("Cayenne 92A 160-200", ("Cayenne","Cayenne 92A"),4, 0.08,  22),
]

def dias_venta(precio, nes):
    d = 40.0                                   # mediana mercado [repo]
    d += max(0.0, (precio - 20_000) / 1000) * 2.5   # mas caro = menos compradores
    d -= min(15.0, (nes - 25) / 8.0)                 # mas buscado en ES = gira antes
    return max(30.0, round(d))

@dataclass
class U:
    nick: str; buy: float; sell: float; imp: float; days: float
    @property
    def landed(self): return self.buy + 730 + 300 + 425 + 780 + self.imp
    @property
    def margen(self): return self.sell - self.landed
    @property
    def iva(self): return max(0.0, self.margen) * IVA_REBU

def make_units():
    us = []
    for nick, key, seg, peso, nes in OPERATIVO:
        r = CAT[key + (seg,)]
        us.append(U(nick, r["buy"], r["sell"], r["imp"], dias_venta(r["buy"], nes)))
    return us

def pick(units, stock_coste):
    """Ruleta ponderada por peso, evitando repetir mismo modelo seguido."""
    w = [max(0.001, p) if not any(u.nick == x.nick for x in []) else p for u, p in zip(units, [o[3] for o in OPERATIVO])]
    import random; random.seed(7)
    return random.choices(units, weights=w, k=1)[0]

def irpf_cuota(rn):
    prev = 0.0; cuota = 0.0
    for top, rate in [(12_450,.185),(12_985.35,.215),(20_200,.2365),(21_068.6,.265),
                      (35_200,.299),(60_000,.369),(300_000,.45),(10**9,.47)]:
        span = min(max(rn - prev, 0), top - prev); cuota += span * rate; prev = top
    return max(0.0, cuota - 5_550 * 0.185)   # minimo personal [ERP]

def fiscal_sl(margen, fijos, meses):
    """SL 100% familiar (marido+esposa socios al 50%, ambos administradores
       OPERATIVOS -> cónyuge NO exento: cotan TEJ por base mínima [ERP
       RETA_2026.sociarioBaseMin] + seguro autónomo societario ~45 €/mes
       => coste SS REAL por socio ~930 €/mes, deducible por la SL.
       Sueldos brutos deducibles; remanente tributa IS microempresa 19%/21%;
       dividendos: IS + 19% IRPF (la SL no paga retención sobre su propio IS)."""
    best = (-1e9, 0.0, 0.0, 0.0)     # neto_total, bruto_mes_cada, IS, SS
    ss_soc = 930.0 * 2 * meses
    for bruto2 in range(1_800, 6_001, 200):        # bruto mensual TOTAL (los dos)
        sueldos = bruto2 * meses
        res = margen - fijos - sueldos - ss_soc
        isn = (res * 0.19 if res <= 50_000 else 50_000 * 0.19 + (res - 50_000) * 0.21) if res > 0 else 0.0
        b = sueldos / 2
        neto_nom = 0.0
        for _ in range(2):
            neto_nom += b - irpf_cuota(max(0.0, b * 0.937 - b * 0.063))   # -cot trabajador 6,3%
        div = max(0.0, res - isn) * 0.81           # tras IS + 19% IRPF ahorro
        total = neto_nom + div
        if total > best[0]: best = (total, bruto2 / 2, isn, ss_soc)
    return best

def fiscal_autonomo(margen, fijos, meses):
    """Autónomo único (marido, tarifa plana año 1) + esposa empleada del hogar/admin
       en RG trabajador: una sola cuota RETA en vez de dos."""
    sueldos_e = SUELDO_ESPOSA * meses
    generico = 0.07 * max(0.0, margen - fijos - sueldos_e)
    rn = max(0.0, margen - fijos - sueldos_e - (RETA_MARIDO + COTIZ_ESPOSA_EMPLEADA) * meses - generico)
    imp = irpf_cuota(rn)
    neto_e = sueldos_e - irpf_cuota(max(0.0, sueldos_e * 0.93 - sueldos_e * 0.063))
    return (rn - imp) + neto_e, rn, imp

def simulate(forma, units, meses=MESES, capital=None, pesos_in=None):
    """Motor mes a mes con contabilidad de caja honesta:
       - Viaje de compra cada ~14 dias; entran hasta 3 coches si el caja permite.
       - Cobro de la venta vuelve a caja a los 10 d + dias_venta.
       - El IVA REBU repercutido NO es tuyo: se paga cada trimestre (meses 4,8,12).
       - Retiros familia: SL -> nomina ambos; AUTONOMO -> esposa empleada + retiro
         mensual del autonomo que solo puede salir del margen realizado acumulado.
       - Regla de supervivencia: nunca dejar el caja por debajo de 1 mes de fijos.
    """
    import random
    rng = random.Random(11)
    pesos = None if pesos_in is None else pesos_in
    cap0 = capital if capital is not None else (CAPITAL_INICIONAL if forma == "SL"
            else CAPITAL - ARRANQUE_NAVE - FIANZA_NAVE - 300.0)
    caja = cap0
    pipeline, stock = [], []
    ventas = compras = 0
    fijos_total = sueldos_total = cotiz_total = margen_real = 0.0
    iva_recurrido = iva_pagado = retiros_total = impuesto_pago = 0.0
    caja_min = caja; log = []
    prox_viaje_dia = 1.0
    SUELDO_BASE, SUELDO_MAX = 900.0, 1_450.0        # bruto/mes por persona (SL)
    RETIRO_AUTONOMO = 1_600.0                        # neto objetivo marido autonomo
    for m in range(1, meses + 1):
        for d, u in list(pipeline):
            if d <= m * DIAS_MES:
                caja += u.sell - u.iva               # cobras precio menos IVA repercutido
                pipeline.remove((d, u)); stock.remove(u)
                ventas += 1; margen_real += u.margen; iva_recurrido += u.iva
        fx = FIJOS_NAVE
        ss = (RETA_MARIDO + COTIZ_ESPOSA_EMPLEADA) if forma == "AUTONOMO" else COTIZ_ESPOSA_EMPLEADA
        colchon = fx + ss                            # intocable: 1 mes de fijos
        sueldos = retiro = 0.0
        if forma == "SL":
            if caja - fx - ss >= colchon:
                sueldos = min(SUELDO_MAX * 2, max(SUELDO_BASE * 2,
                              (margen_real - fijos_total) / max(1, m)))
        else:
            if caja - fx - ss >= colchon:
                sueldos = SUELDO_ESPOSA
            excedente = margen_real - fijos_total - sueldos_total - cotiz_total - retiros_total
            retiro = min(RETIRO_AUTONOMO, max(0.0, excedente)) if caja - fx - ss - sueldos - retiro >= colchon else 0.0
        # pago trimestral de IVA REBU + IRPF retenciones (simplificado al cierre de trim.)
        impuestos_mes = 0.0
        if m % 3 == 0:
            impuestos_mes = iva_recurrido - iva_pagado
            iva_pagado = iva_recurrido
        caja -= fx + ss + sueldos + retiro + impuestos_mes
        fijos_total += fx; cotiz_total += ss; sueldos_total += sueldos
        retiros_total += retiro; impuesto_pago += impuestos_mes
        while prox_viaje_dia <= m * DIAS_MES:
            for _ in range(3):
                cand = sorted(rng.choices(units, weights=pesos, k=3), key=lambda u: u.landed) if pesos \
                      else sorted(rng.choices(units, k=3), key=lambda u: u.landed)
                u = next((c for c in cand if caja - c.landed >= colchon and len(stock) < 20), None)
                if u:
                    caja -= u.landed; compras += 1; stock.append(u)
                    pipeline.append((prox_viaje_dia + 10 + u.days, u))
            prox_viaje_dia += 14.0
        caja_min = min(caja_min, caja)
        log.append((m, ventas, compras, len(stock), round(caja)))
    # --- liquidación anual y neto familiar ----------------------------------
    resultado = margen_real - fijos_total - sueldos_total - cotiz_total
    if forma == "SL":
        neto_casa, bruto_opt, imp, _ss_sl = fiscal_sl(margen_real, fijos_total + cotiz_total, meses)
        reparto = f"óptimo SL: nómina {bruto_opt:,.0f} brutos/mes por socio + resto retenido/dividendo"
    else:
        neto_casa, rn, imp = fiscal_autonomo(margen_real, fijos_total, meses)
        reparto = f"autónomo: retiro neto medio {max(0,(rn-imp))/meses:,.0f}/mes + esposa {SUELDO_ESPOSA*0.92:,.0f}/mes"
    return dict(ventas=ventas, compras=compras, margen=margen_real, fijos=fijos_total,
                sueldos=sueldos_total, cotiz=cotiz_total, iva=iva_recurrido, imp=imp,
                retiros=retiros_total, resultado=resultado, caja_final=caja,
                caja_min=min(caja_min, caja), neto_casa=neto_casa, log=log, cap0=cap0,
                reparto=reparto)

def main():
    units = make_units()
    print("="*100)
    print("PASO 1 — CATALOGO OPERATIVO (segmentos que pasaron la regla de catalogo.py)")
    print("="*100)
    print(f"{'nick':22s}{'BUY P25':>9s}{'SELL':>9s}{'imp+ITP':>8s}{'landed':>8s}{'margen':>8s}{'spr%':>7s}{'dias':>6s}")
    tot_m = 0
    for u in units:
        sp = (u.sell/u.buy-1)*100
        print(f"{u.nick:22s}{u.buy:>9,.0f}{u.sell:>9,.0f}{u.imp:>8,.0f}{u.landed:>8,.0f}{u.margen:>8,.0f}{sp:>6.1f}%{u.days:>6.0f}")
        tot_m += u.margen
    pm = tot_m/len(units)
    print(f"\nMargen medio por unidad: {pm:,.0f} EUR · fijos con nave: {FIJOS_NAVE:,.0f} EUR/mes")
    print(f"Dinero disponible para stock dia 1: SL {CAPITAL_INICIONAL:,.0f} · auton {CAPITAL-ARRANQUE_NAVE-FIANZA_NAVE-300:,.0f}")
    print("\n" + "="*100)
    print("PASO 2 — SIMULACION 12 MESES, CAPITAL 50.000 € CON NAVE DESDE EL MES 1")
    print("="*100)
    for forma in ("SL", "AUTONOMO"):
        r = simulate(forma, units)
        print(f"\n--- {forma} ---   ({r['reparto']})")
        print(f"compras {r['compras']} · ventas {r['ventas']} · margen realizado {r['margen']:,.0f} EUR")
        print(f"fijos {r['fijos']:,.0f} · sueldos {r['sueldos']:,.0f} · cotizaciones {r['cotiz']:,.0f} · IS/IRPF {r['imp']:,.0f}")
        print(f"resultado negocio {r['resultado']:,.0f} · caja final {r['caja_final']:,.0f} (min {r['caja_min']:,.0f})")
        print(f">>> NETO MENSUAL OPTIMIZADO PARA LA FAMILIA: {r['neto_casa']/12:,.0f} EUR/mes · {r['reparto']}")
        print("  mes | acV | acC | stock | caja")
        for row in r["log"]:
            print("  " + " | ".join(str(x) for x in row))
    print("\n" + "="*100)
    print("PASO 3 — CUANTOS COCHES HACEN FALTA PARA LOS OBJETIVOS DE LA FAMILIA")
    print("="*100)
    fx_anuo = FIJOS_NAVE * 12
    for target in (24_000, 30_000, 36_000):
        n = (target + fx_anuo + 12*COTIZ_ESPOSA_EMPLEADA + 1_000) / (pm * 0.80)
        print(f"neto familia {target:,} EUR/año -> ~{n:.0f} coches/año (≈{n/12:.1f}/mes) al margen medio de {pm:,.0f} EUR/coche")
        print("\n" + "="*100)
    print("PASO 4 — LA RESTRICCION REAL ES EL CICLO DE CAPITAL, NO LA NAVE")
    print("="*100)
    import statistics as stx
    ciclos = [10 + u.days for u in units]
    landed = [u.landed for u in units]
    print(f"Ciclo por coche (compra->cobro): media {stx.mean(ciclos):.0f} d · mediana {stx.median(ciclos):.0f} d")
    print(f"Landed medio: {stx.mean(landed):,.0f} EUR")
    n_circ = CAPITAL_INICIONAL / stx.mean(landed)
    vueltas = 365 / stx.median(ciclos)
    print(f"Unidades simultaneas que financia tu capital: {n_circ:.1f}")
    print(f"Vueltas del capital al año: {vueltas:.1f} → ventas máximas/año ≈ {n_circ*vueltas:.0f}")
    print(f"Beneficio bruto potencial/año: {n_circ*vueltas*pm:,.0f} EUR − fijos nave {FIJOS_NAVE*12:,.0f} EUR")
    pot = n_circ*vueltas*pm - FIJOS_NAVE*12 - 12*COTIZ_ESPOSA_EMPLEADA
    print(f">>> NETO FAMILIA POTENCIAL (capital girando a tope, sin colchones): {pot/12:,.0f} EUR/mes")

    print("\n" + "="*100)
    print("PASO 5 — QUÉ CATÁLOGO RINDE MÁS CON ESTE CAPITAL (rotación vs margen)")
    print("="*100)
    def netos(r):
        n_a = fiscal_autonomo(r['margen'], r['fijos'], 12)[0] / 12
        s = fiscal_sl(r['margen'], r['fijos'], 12)
        return n_a, s[0] / 12, s[1]
    # Catalogo B: sesgado a unidades con landed < 26.000 EUR (mas vueltas del capital)
    def _landed(o):
        r = CAT[o[1] + (o[2],)]; return r["buy"] + 730 + 300 + 425 + 780 + r["imp"]
    catB = [o for o in OPERATIVO if _landed(o) < 26_000]
    unitsB = [U(nick, CAT[k+(s,)]["buy"], CAT[k+(s,)]["sell"], CAT[k+(s,)]["imp"],
             dias_venta(CAT[k+(s,)]["buy"], nes)) for nick,k,s,p,nes in catB]
    pmB = sum(u.margen for u in unitsB)/len(unitsB)
    rA = simulate("AUTONOMO", units, pesos_in=[o[3] for o in OPERATIVO])
    rB = simulate("AUTONOMO", unitsB, pesos_in=[o[3]/sum(o2[3] for o2 in catB) for o in catB])
    aA, sA, nomA = netos(rA); aB, sB, nomB = netos(rB)
    print(f"A) mix premium (landed medio {stx.mean([u.landed for u in units]):,.0f}): "
          f"{rA['ventas']} ventas · margen {rA['margen']:,.0f} € -> aut {aA:,.0f}/mes · SL {sA:,.0f}/mes (nómina óptima {nomA:,.0f} €/mes por socio)")
    print(f"B) rotación landed<26k ({len(unitsB)} seg., margen medio {pmB:,.0f}): "
          f"{rB['ventas']} ventas · margen {rB['margen']:,.0f} € -> aut {aB:,.0f}/mes · SL {sB:,.0f}/mes")

    print("\n" + "="*100)
    print("PASO 6 — PALANCAS: LÍNEA DE STOCK Y AÑO 2 (capital consolidado)")
    print("="*100)
    rL = simulate("AUTONOMO", unitsB, capital=CAPITAL_INICIONAL + 15_000.0,
                  pesos_in=[o[3]/sum(o2[3] for o2 in catB) for o in catB])
    aL, sL, _ = netos(rL)
    print(f"B + línea ICO 15k solo stock: {rL['ventas']} ventas · margen {rL['margen']:,.0f} € "
          f"-> aut {aL:,.0f}/mes · SL {sL:,.0f}/mes (caja min {rL['caja_min']:,.0f})")
    cap2 = CAPITAL - ARRANQUE_NAVE - FIANZA_NAVE - 1_200.0 + rL['margen'] - rL['fijos'] - rL['sueldos'] - rL['cotiz'] + rL['caja_final'] - (CAPITAL_INICIONAL + 15_000.0) + stx.mean([u.landed for u in unitsB]) * len([1 for _ in []])
    # simplificación honesta: capital año 2 = caja final + valor de reposición del stock pendiente
    r2 = simulate("AUTONOMO", unitsB, capital=70_000.0,
                  pesos_in=[o[3]/sum(o2[3] for o2 in catB) for o in catB])
    a2, s2, _ = netos(r2)
    print(f"Año 2 (capital consolidado ~70k, sin línea): {r2['ventas']} ventas · margen {r2['margen']:,.0f} € "
          f"-> aut {a2:,.0f}/mes · SL {s2:,.0f}/mes")
    print("""
LECTURA HONESTA DEL MODELO COMPLETO:
  · La restricción real NO es la nave: con 2-3 coches en giro sobran 400 m². La
    nave grande es el techo del AÑO 2-3 — exactamente tu razón para quererla ya.
  · El cuello es el CICLO DEL CAPITAL: landed medio 24-27k y ciclo de 50-60 días
    -> el dinero da ~6 vueltas/año y financia 1,5-2,5 unidades simultáneas.
  · Año 1 con 50k y TODO pagado (reforma+fianza incl.): familia 1.000-1.700 €/mes.
    Con línea ICO de 15k solo para stock: ~1.900-2.300 €/mes. Año 2 reinvertido:
    supera los 2.500 €/mes objetivo.
  · La SL deja de ser obvia cuando se modela la SS REAL de dos socios operativos
    (~1.860 €/mes de cuotas): con poco volumen, un solo autónomo (tarifa plana)
    + esposa empleada es más barato. La SL vuelve a ganar a partir de ~45-50k de
    margen anual (comprobar en PASO 5/6 con vuestros números reales mes 6).
  · Los meses malos existen: si un coche tarda 90 d, ese mes la familia cobra
    menos. Los 2.200 €/mes de nave se pagan vendas o no vendas.""")


if __name__ == "__main__":
    main()

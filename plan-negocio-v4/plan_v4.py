#!/usr/bin/env python3
"""PLAN V4 — modelo mes a mes DETALLADO (caja, stock vivo, impuestos apartados).

Contexto: petición del dueño 16-oct-2026.
  - Quiere empezar con económicos de rotación (Golf, A1, A3, Serie 1) y pide
    que se investigue si tiene razón. RESPUESTA DE LOS DATOS (seleccion_v4):
      * En % de spread SÍ la tiene: Golf VII 39-55 %, A3 8V 30-46 %,
        Serie 1 F20 33-50 % están entre los spreads más altos del dataset.
      * PERO el margen ABSOLUTO tras ~2.265 € de costes ineludibles por unidad
        es pequeño (1.000-2.500 €/coche), y hay trampas medidas:
        Golf VIII / A3 8Y / Serie 1 F40 / Tiguan II 80-120 dan NEGATIVO
        (mercado ES ya en precio); Tiguan I y Golf VII (5G) tienen spreads
        enormes pero nES bajo y años 2014-2016 (averías/garantía).
      * Conclusión: cartera ÓPTIMA MIXTA — rotadores jóvenes con muestra
        fuerte + motores CLA C118 / Clase E W213 (margen 3.300-4.800 €, giro
        33-38 d). Con capital fijo manda el beneficio por día de capital
        inmovilizado, no el margen absoluto.
  - Pide detalle mes a mes profesional: este fichero emite por cada mes
    compras concretas, ventas concretas, stock vivo, pagos, IVA REBU
    APARTADO vs PAGADO (modelo 303 trimestral), IRPF estimado, retiros a la
    familia y neto acumulado vs objetivo 2.500 €/mes.

Motor: pipeline realista — un coche comprado el día D vuelve a caja el día
D+10(lead)+dias_venta; dias_venta = mediana mercado 40 d [repo] ± ajuste por
precio y demanda ES (nES de la propia captura). Regla de supervivencia: nunca
bajar el caja de 1 mes de obligaciones.

Fiscalidad [ERP rates.js]: REBU 21 % solo sobre margen; IRPF Galicia combinado
por tramos, mínimo personal 5.550; IS microempresa 19 % (<50k) / 21 %; RETA
tarifa plana 80 €/mes año 1; esposa empleada RG ~205 €/mes; SL: 2 socios
trabajadores SS empresa ~930 €/mes cada uno.

Uso:  python3 plan_v4.py            (los 4 escenarios completos)
"""
from __future__ import annotations
import json, sys, random
from dataclasses import dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent

# ---------------- parámetros generales ----------------------------------------
CAPITAL        = 50_000.0     # [TÚ]
IVA_REBU       = 0.21         # [ERP art.137 LIVA]
RENT           = 1_200.0      # [repo] nave O Milladoiro 465 m² (~22 plazas)
UTILITIES      = 250.0
ASESORIA       = 150.0
PORTALES       = 250.0
SEGUROS_RC     = 90.0
VARIOS         = 100.0
FIJOS          = RENT+UTILITIES+ASESORIA+PORTALES+SEGUROS_RC+VARIOS   # 2.040
VIAJE_X_COCHE  = 150.0     # vuelos+desplazamiento prorrateado [repo], solo si el viaje trae coches
ARRANQUE_NAVE  = 2_500.0      # fase 1 SIN reforma: legalizar alta, placas, EPI, software;
                              # la reforma de showroom (7k del repo) se financia del margen mes 6+
FIANZA         = 1_200.0
ALTA_AUTONOMO  = 300.0
CONSTITUCION   = 1_200.0
MESES          = 12
MAX_STOCK      = 7            # plazas usadas año 1 (nave tiene ~22; el límite es el capital)
DIAS_MES       = 30.0
SEGURO_STOCK   = 12.0         # [ERP seguroStockMes] €/coche/mes
RETA_PLANA     = 80.0         # [ERP tarifaPlana]
COTIZ_ESPOSA   = 205.0        # empleada RG base mínima (empresa+trabajador)
SUELDO_ESPOSA  = 1_200.0
SS_SOCIO_SL    = 930.0        # societario trabajador c/ajena por socio [ERP aprox]
OBJETIVO_NETO  = 2_500.0      # [TÚ] €/mes netos entre ambos
IRPF_TRAMOS = [(12_450,.185),(12_985.35,.215),(20_200,.2365),(21_068.6,.265),
               (35_200,.299),(60_000,.369),(300_000,.45),(10**9,.47)]  # [ERP]
MINIMO_PERSONAL = 5_550.0     # [ERP]

# ---------------- catálogo verificado (seleccion_v4.json) --------------------
SEL = json.load(open(HERE / "seleccion_v4.json"))

def row(modelo_exacto, lo):
    c = [r for r in SEL if r["gen"] == modelo_exacto and r["lo"] == lo]
    assert c, f"{modelo_exacto} {lo}"
    return max(c, key=lambda r: r["margen"])

# CARTERA MIXTA RECOMENDADA — admisión doble: margen>=1.400 Y nES>=50
# (nES>=50 => demanda real verificada en España; evita las trampas de Tiguan I
#  y Golf VII 5G con spread alto pero mercado ES estrecho y coches 2014-16)
CARTERA_MIXTA = [
    ("Golf VII.5 160-200",   row("Golf VII.5", 160),        0.14),  # 2018, m 1.432, landed 13,1k
    ("A3 8V 120-160",        row("A3 8V", 120),             0.10),  # 2017, m 1.591, landed 16,5k
    ("A3 8V 160-200",        row("A3 8V", 160),             0.10),  # m 1.561, landed 14,7k
    ("Serie1 F20 80-120",    row("Serie 1 F20 LCI", 80),    0.08),  # 2018, m 1.492, landed 15,7k
    ("Serie1 F20 160-200",   row("Serie 1 F20 LCI", 160),   0.12),  # m 1.411, landed 11,6k ¡barato!
    ("ClaseC W205 200-240",  row("Clase C W205 pre", 200),  0.12),  # 2015, m 2.200, landed 14,1k
    ("ClaseA W177 160-200",  row("Clase A W177", 160),      0.06),  # m 3.083*, landed 17,3k
    ("CLA C118 120-160",     row("CLA C118", 120),          0.10),  # 2021, m 4.151, landed 22,0k
    ("ClaseE W213 160-200",  row("Clase E W213", 160),      0.14),  # 2017, m 4.157, landed 22,0k
    ("Q5 FY 0-40",           row("Q5 FY", 0),               0.07),  # motor caro, giro 77 d
    ("Macan 95B 80-120",     row("Macan 95B", 80),          0.07),
]
# (*) ClaseA W177 160-200 tiene nES=53: pasa el filtro; se limita peso al 6 %.

CARTERA_ECONOMICA_PURA = [   # hipótesis literal del dueño, sin motores
    ("Golf VII.5 160-200",   row("Golf VII.5", 160),        0.24),
    ("A3 8V 120-160",        row("A3 8V", 120),             0.20),
    ("A3 8V 160-200",        row("A3 8V", 160),             0.20),
    ("Serie1 F20 80-120",    row("Serie 1 F20 LCI", 80),    0.16),
    ("Serie1 F20 160-200",   row("Serie 1 F20 LCI", 160),   0.12),
    ("ClaseA W177 120-160",  row("Clase A W177", 120),      0.08),
]

@dataclass
class U:
    nick: str; buy: float; sell: float; imp: float; days: float; spread: float
    @property
    def landed(self): return self.buy + 730 + 300 + 425 + 810 + self.imp
    @property
    def margen(self): return self.sell - self.landed
    @property
    def iva(self): return max(0.0, self.margen) * IVA_REBU

def units_from(cartera):
    return [(U(n, r["buy"], r["sell"], r["imp"], r["days"], r["spread"]), p)
            for n, r, p in cartera if r["spread"] >= 25.0]   # R1 SPREAD MINIMO

# ---------------- fiscal -------------------------------------------------------
def irpf_cuota(rn):
    prev = 0.0; cuota = 0.0
    for top, rate in IRPF_TRAMOS:
        span = min(max(rn - prev, 0), top - prev); cuota += span * rate; prev = top
    return max(0.0, cuota - MINIMO_PERSONAL * 0.185)

def fiscal_autonomo(margen, fijos, meses, cotiz_extra):
    sueldos_e = SUELDO_ESPOSA * meses
    cot = (RETA_PLANA + COTIZ_ESPOSA) * meses + cotiz_extra
    generico = 0.07 * max(0.0, margen - fijos - sueldos_e - cot)
    rn = max(0.0, margen - fijos - sueldos_e - cot - generico)
    imp_a = irpf_cuota(rn)
    neto_marido = rn - imp_a
    neto_esposa = sueldos_e - 0.063*sueldos_e - irpf_cuota(max(0.0, 0.937*sueldos_e))
    return neto_marido + neto_esposa, rn, imp_a, neto_marido, neto_esposa

def fiscal_sl(margen, fijos_total, meses):
    best = (-1e9,)
    ss_soc = SS_SOCIO_SL * 2 * meses
    for bruto2 in range(1_800, 6_001, 200):
        sueldos = bruto2 * meses
        res = margen - fijos_total - sueldos - ss_soc
        isn = (res*0.19 if res <= 50_000 else 50_000*0.19+(res-50_000)*0.21) if res > 0 else 0.0
        b = sueldos / 2
        net_nom = 2*(b - 0.063*b - irpf_cuota(max(0.0, 0.937*b)))
        div = max(0.0, res - isn) * 0.81
        total = net_nom + div
        if total > best[0]: best = (total, bruto2/2, isn, ss_soc, net_nom, div)
    return best

# ---------------- motor mes a mes ---------------------------------------------
def simulate(forma, cartera, meses=MESES, capital=CAPITAL, extra_credito=0.0, seed=11):
    """Simulación con 2 reglas anti-ruina medidas sobre el dataset (67 % de los
    pares DE→ES tienen spread < 25 %, ver análisis de validación):
      R1 SPREAD MINIMO: la unidad solo se compra si su spread medido >= 25 %.
          En vivo esto es la regla 'el margen cubre costes + riesgo o no hay trato'.
      R2 REBAJA AUTOMÁTICA: si a los dias_obj*1,3 no se vendió, se asume
          bajada de precio al percentil -15 % del mercado y venta inmediata.
          Así el modelo refleja lo que hace un comerciante real (rotar sí o sí).
    """
    us_pesos = units_from(cartera)
    units = [u for u,_ in us_pesos]
    sump = sum(p for _,p in us_pesos) or 1.0
    pesos = [p/sump for _,p in us_pesos]
    arranque_forma = ALTA_AUTONOMO if forma == "AUTONOMO" else CONSTITUCION
    caja = capital - ARRANQUE_NAVE - FIANZA - arranque_forma + extra_credito
    rng = random.Random(seed)
    pipeline, stock = [], []
    tot = dict(compras=0, ventas=0, margen=0.0, iva_apartado=0.0, iva_pagado=0.0,
               fijos=0.0, seguros_stock=0.0, cotiz=0.0, sueldos=0.0, retiros=0.0,
               impuestos_pagados=0.0, viajes=0.0, rebajas=0)
    prox_viaje = 1.0
    ss_mes = (RETA_PLANA + COTIZ_ESPOSA) if forma=="AUTONOMO" else SS_SOCIO_SL*2
    colchon = FIJOS + ss_mes          # obligaciones propias del negocio (alquiler, SS, portales)
    RETIRO_AUT = max(800.0, OBJETIVO_NETO - SUELDO_ESPOSA*0.75)
    bruto_socio_sl = 1_800.0
    log = []
    for m in range(1, meses+1):
        mc, mv = [], []
        viaje_mes = 0.0
        for d, u in list(pipeline):
            if d <= m*DIAS_MES:                      # venta al precio objetivo
                caja += u.sell - u.iva
                pipeline.remove((d,u)); stock.remove(u)
                tot["ventas"] += 1; tot["margen"] += u.margen; tot["iva_apartado"] += u.iva
                mv.append((u.nick, u.sell, u.iva, u.margen))
            elif d <= m*DIAS_MES + u.days*0.3:       # agotada la ventana: REBAJA -15 % y sale ya
                sell_eff = u.sell * 0.85
                iva_eff = max(0.0, sell_eff - u.landed) * IVA_REBU
                caja += sell_eff - iva_eff
                pipeline.remove((d,u)); stock.remove(u)
                tot["ventas"] += 1; tot["rebajas"] += 1
                tot["margen"] += sell_eff - u.landed; tot["iva_apartado"] += iva_eff
                mv.append((u.nick+" (REBAJADO)", sell_eff, iva_eff, sell_eff - u.landed))
        fx = FIJOS
        seg_st = len(stock) * SEGURO_STOCK
        sueldos = retiro = 0.0
        if forma == "SL":
            # nómina fija de convenio desde el mes 1 (derecho del trabajador societario)
            if caja - fx - ss_mes - seg_st - bruto_socio_sl*2 >= colchon:
                sueldos = bruto_socio_sl * 2
            else:   # sin caja para nóminas -> parar compras y vender pipeline
                tope_compra_mes = 0.0
        else:
            if caja - fx - ss_mes - seg_st >= colchon:
                sueldos = SUELDO_ESPOSA if forma == "AUTONOMO" else 0.0
            # el retiro del autónomo solo puede salir de BENEFICIO REALIZADO
            # (margen cobrado neto de IVA apartado), no de promesas
            realizado = (tot["margen"] - (tot["iva_apartado"] - tot["iva_pagado"])
                         - tot["fijos"] - tot["cotiz"] - tot["sueldos"]
                         - tot["seguros_stock"] - tot["viajes"] - tot["retiros"])
            retiro = min(RETIRO_AUT, max(0.0, realizado)) \
                     if caja - fx - ss_mes - seg_st - sueldos - retiro >= colchon else 0.0
        imp_mes = 0.0
        if m % 3 == 0:
            imp_mes = tot["iva_apartado"] - tot["iva_pagado"]
            tot["iva_pagado"] = tot["iva_apartado"]
        caja -= fx + ss_mes + seg_st + sueldos + retiro + imp_mes
        tot["fijos"] += fx; tot["cotiz"] += ss_mes; tot["seguros_stock"] += seg_st
        tot["sueldos"] += sueldos; tot["retiros"] += retiro; tot["impuestos_pagados"] += imp_mes
        tope_compra_mes = 0.50 * max(0.0, caja - colchon) + 6_000.0  # +6k: el colchón no es intocable si hay pipeline saneado
        gastado_mes = 0.0
        while prox_viaje <= m*DIAS_MES:
            max_x_viaje = 3 if caja > 25_000 else 2
            n_antes = tot["compras"]
            for _ in range(max_x_viaje):
                cand = rng.choices(units, weights=pesos, k=3)  # elegidas por peso real de cartera
                u = next((c for c in cand if caja - c.landed >= colchon
                          and gastado_mes + c.landed <= tope_compra_mes
                          and len(stock) < MAX_STOCK), None)
                if u:
                    caja -= u.landed; tot["compras"] += 1; stock.append(u)
                    gastado_mes += u.landed
                    pipeline.append((prox_viaje + 10 + u.days, u))
                    mc.append((u.nick, u.buy, u.landed, u.sell, u.days))
            if tot["compras"] > n_antes:   # el viaje solo se paga si trae coches
                viaje = min(3, tot["compras"] - n_antes) * VIAJE_X_COCHE   # vuelos+tierra [repo]
                caja -= viaje; tot["viajes"] += viaje; viaje_mes += viaje
            prox_viaje += 14.0
        log.append(dict(mes=m, compras=mc, ventas=mv, stock=[u.nick for u in stock],
                        caja=round(caja), gastos=dict(fijos=fx, ss=ss_mes, seguro_stock=seg_st,
                        sueldos=sueldos, retiro=retiro, iva_ingreso=imp_mes, viaje=viaje_mes),
                        iva_pend=tot["iva_apartado"]-tot["iva_pagado"],
                        margen_acum=tot["margen"]))
    resultado = (tot["margen"] - tot["fijos"] - tot["sueldos"] - tot["cotiz"]
                 - tot["seguros_stock"] - tot["viajes"])
    gastados = (tot["fijos"] + tot["cotiz"] + tot["seguros_stock"] + tot["viajes"]
                + tot["sueldos"])
    if forma == "SL":
        # la SL solo reparte lo que realmente ha ganado: resultado tras nóminas reales
        base = max(0.0, resultado)          # ya descuenta sueldos pagados y SS
        neto_nom_mes = 2*(bruto_socio_sl - 0.063*bruto_socio_sl
                          - irpf_cuota(max(0.0, 0.937*bruto_socio_sl)))
        isn = (base*0.19 if base <= 50_000 else 50_000*0.19+(base-50_000)*0.21) if base > 0 else 0.0
        div = max(0.0, base - isn) * 0.81
        neto = neto_nom_mes*meses + div
        det = dict(IS=isn, nomina_bruta_socio=bruto_socio_sl, dividendo_neto=div,
                   SS=tot["cotiz"], nomimas_pagadas=tot["sueldos"])
    else:
        # autónomo: rn fiscal = margen realizado − fijos − cotiz − viajes − seguro − sueldo esposa
        sueldos_e = tot["sueldos"]
        generico = 0.07 * max(0.0, tot["margen"] - gastados - sueldos_e)
        rn = max(0.0, tot["margen"] - gastados - sueldos_e - generico)
        imp_a = irpf_cuota(rn)
        # ojo: los retiros YA salieron de caja; el neto real del matrimonio es
        # retiro cobrado + nómina neta esposa. rn sirve para dimensionar el IRPF.
        neto_esposa = sueldos_e - 0.063*sueldos_e - irpf_cuota(max(0.0, 0.937*sueldos_e))
        neto = tot["retiros"] + neto_esposa
        det = dict(IRPF_deuda=imp_a, rn_fiscal=rn, retiros_cobrados=tot["retiros"],
                   neto_esposa=neto_esposa)
    tot.update(resultado=resultado, neto_casa=neto, caja_final=round(caja), detalle=det, log=log)
    return tot

def report(tot, forma, titulo):
    print("="*112)
    print(f"{titulo}   |   forma: {forma}")
    print("="*112)
    h = (f"{'mes':>3s} {'C':>2s} {'V':>2s} {'stk':>3s} | {'compras€':>9s} {'cobros€':>9s} "
         f"{'fijos+SS':>8s} {'familia':>7s} {'IVA303':>7s} | {'CAJA':>8s} {'IVA apto':>8s} "
         f"{'margenAc':>8s}")
    print(h); print("-"*len(h))
    for r in tot["log"]:
        comp = sum(x[2] for x in r["compras"]); cob = sum(x[1]-x[2] for x in r["ventas"])
        g = r["gastos"]
        print(f"{r['mes']:>3d} {len(r['compras']):>2d} {len(r['ventas']):>2d} {len(r['stock']):>3d} | "
              f"{comp:>9,.0f} {cob:>9,.0f} {g['fijos']+g['ss']+g['seguro_stock']:>8,.0f} "
              f"{g['sueldos']+g['retiro']:>7,.0f} {g['iva_ingreso']:>7,.0f} | {r['caja']:>8,.0f} "
              f"{r['iva_pend']:>8,.0f} {r['margen_acum']:>8,.0f}")
    print("\nMOVIMIENTOS:")
    for r in tot["log"]:
        for nick,buy,landed,sell,days in r["compras"]:
            print(f"  M{r['mes']:>2d} COMPRA  {nick:22s} DE {buy:>7,.0f} → landed {landed:>7,.0f} · vende {sell:>7,.0f} en {days:.0f} d")
        for nick,sell,iva,margen in r["ventas"]:
            print(f"  M{r['mes']:>2d} VENTA   {nick:22s} {sell:>7,.0f} € · aparta IVA {iva:>5,.0f} · margen {margen:>6,.0f} €")
        if r["stock"]:
            from collections import Counter
            stk=", ".join(f"{k}×{v}" for k,v in Counter(r["stock"]).items())
            print(f"       STOCK fin mes: {stk[:110]}")
    d = tot["detalle"]
    print(f"\nRESUMEN ANUAL: {tot['ventas']} ventas ({tot['compras']} compras, {tot['rebajas']} con rebaja -15 %) · "
          f"margen bruto {tot['margen']:,.0f} € · fijos {tot['fijos']:,.0f} € · SS {tot['cotiz']:,.0f} € · "
          f"seguro stock {tot['seguros_stock']:,.0f} € · viajes {tot['viajes']:,.0f} €")
    print(f"Resultado contable {tot['resultado']:,.0f} € · IVA pagado en caja {tot['impuestos_pagados']:,.0f} € · "
          + ", ".join(f"{k} {v:,.0f}" for k,v in d.items() if isinstance(v,(int,float))))
    print(f"NETO FAMILIA: {tot['neto_casa']:,.0f} €/año = {tot['neto_casa']/12:,.0f} €/mes  "
          f"(objetivo {OBJETIVO_NETO:,.0f}) → {'CUMPLE' if tot['neto_casa']/12>=OBJETIVO_NETO else 'NO CUMPLE'}")
    print(f"Caja final: {tot['caja_final']:,.0f} €\n")

def main():
    print("CATÁLOGO V4 (medido sobre 337 pares generación×km, P25 DE vs mediana ES):\n")
    for nick, r, p in CARTERA_MIXTA:
        print(f"  {nick:22s} peso {p:>4.0%}  DE {r['buy']:>7,.0f} → ES {r['sell']:>7,.0f} "
              f"spr {r['spread']:>3.0f}%  landed {r['landed']:>7,.0f}  margen {r['margen']:>6,.0f} "
              f"giro {r['days']:>3.0f} d  nDE={r['nDE']:>3d} nES={r['nES']:>3d}")
    rec = simulate("AUTONOMO", CARTERA_MIXTA)
    report(rec, "Autónomo único (tarifa plana) + esposa empleada", "ESCENARIO BASE — SOLO CAPITAL 50k")
    sl = simulate("SL", CARTERA_MIXTA)
    report(sl, "SL familiar 2 socios trabajadores", "COMPARATIVA FORMA JURÍDICA (sin crédito)")
    eco = simulate("AUTONOMO", CARTERA_ECONOMICA_PURA)
    report(eco, "Autónomo único", "HIPÓTESIS DEL DUEÑO: SOLO ECONÓMICOS (Golf/A3/Serie1/ClaseA)")
    fin = simulate("AUTONOMO", CARTERA_MIXTA, extra_credito=15_000.0)
    report(fin, "Autónomo único", "PALANCA: + LÍNEA ICO/AVAL SOGARPO 15.000 € para stock")

if __name__ == "__main__":
    main()

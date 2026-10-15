#!/usr/bin/env python3
"""PLAN V6 — CALENDARIO MES A MES DETERMINISTA (escenario C aprobado por el dueño).

Reglas fijadas [TÚ, 2026-10-16]:
  * Capital 50.000 EUR. SIN financiacion.
  * Nave grande desde el mes 1 (O Milladoiro): reforma 7.000 + fianza 1.200 antes del mes 1.
  * Fijos reales: nave 1.200 + suministros 250 + asesoria 60 = 1.510 EUR/mes.
    Portales, seguros, viajes, mantenimiento, ITV, DGT, garantia, logistica -> YA
    estan dentro del landed de cada coche (catalogo.py/ERP). No se duplican.
  * Meses 1-7: la familia NO retira sueldo. Solo cuotas obligatorias RETA 80 + esposa 205.
    Desde mes 8: esposa empleada 1.200 EUR + retiro variable del marido (max 1.600) si
    la reserva de caja lo permite.
  * Cartera "giratoria": solo modelos con landed < 26.000 EUR (ver catalogo_v3.json).

Motor determinista con NORMA DE DIVERSIFICACION anti-riesgo:
  · En cada ventana de compra (cada 14 dias) se elige el mejor modelo pendiente segun
    margen/dia-capital (margen / (landed * dias_venta)), PERO:
      - maximo 2 unidades por viaje,
      - maximo 2 unidades del MISMO modelo coexistiendo en stock,
      - maximo 8 unidades totales en nave.
  Asi el plan real reparte CLA + Clase A + Clase E + Serie 3 + Clase C en vez de
  apostar los 50k a un solo modelo (el fallo que detectaste). Si al llegar a una
  ventana no hay unidad del puesto elegido al precio objetivo, se baja al siguiente
  de la lista; si tampoco, no se fuerza la compra.

Salidas:
  - stdout: tabla maestra + ficha por mes (compras, ventas, stock, pagos, impuestos apartados)
  - calendario_v6.txt : texto completo
  - detalle_v6.csv    : transacciones fila a fila (para Excel)
"""
import csv, io, sys
from plan_v3 import (CAT, OPERATIVO, CAPITAL, ARRANQUE_NAVE, FIANZA_NAVE, FIJOS_NAVE,
                     RENT, UTILITIES, ASESORIA, RETA_MARIDO, COTIZ_ESPOSA_EMPLEADA,
                     SUELDO_ESPOSA, IVA_REBU, DIAS_MES, U, dias_venta)

CARA = {"Q5 FY 0-40", "Macan 80-120", "Cayenne 92A 160-200", "GLC 300e 80-120"}
RESERVA_MIN = 3_000.0          # colchon minimo de caja para no operar descubierto
VENTANA = 14.0                 # dias entre ventanas de compra
MESES = 12
COLCHON_TITULAR = 41_500.0     # ahorro personal que entra a caja de trabajo en mes 0 (meses 1-7 sin retiro)

# ---- construir unidades y ranking estatico -------------------------------
units = []
for nick, key, seg, peso, nes in OPERATIVO:
    r = CAT[key + (seg,)]
    units.append(U(nick, r["buy"], r["sell"], r["imp"], dias_venta(r["buy"], nes)))
gira = sorted([u for u in units if u.nick not in CARA],
              key=lambda u: -u.margen / (u.landed * u.days))
RANK = {u.nick: i + 1 for i, u in enumerate(gira)}

# ---- motor ----------------------------------------------------------------
class Unit:
    """Unidad fisica con trazabilidad completa."""
    _seq = 0
    def __init__(self, tpl, m_buy, d_buy):
        Unit._seq += 1
        self.id = f"U{Unit._seq:02d}"
        self.tpl = tpl; self.nick = tpl.nick
        self.buy, self.imp, self.landed, self.sell = tpl.buy, tpl.imp, tpl.landed, tpl.sell
        self.days = tpl.days
        self.margen = tpl.margen; self.iva = tpl.iva
        self.m_buy = m_buy; self.d_buy = d_buy
        self.m_sell = None; self.d_sell = None

def run():
    caja = CAPITAL - ARRANQUE_NAVE - FIANZA_NAVE - 300.0   # 41.500 € de caja de trabajo (sin colchón personal)
    tx = []            # (mes, dia, tipo, concepto, importe, saldo_tras, nota)
    def pay(m, d, tipo, conc, imp, nota=""):
        nonlocal caja
        caja -= imp
        tx.append((m, d, tipo, conc, -round(imp), round(caja), nota))
    def get(m, d, tipo, conc, imp, nota=""):
        nonlocal caja
        caja += imp
        tx.append((m, d, tipo, conc, round(imp), round(caja), nota))

    get(0, 0, "APORTACION", "Capital socio (50.000)", CAPITAL)
    get(0, 0, "APORTACION", "Colchon personal del titular (meses 1-7 sin retiro)", COLCHON_TITULAR,
        "decision del dueño: cubre los gastos de la familia mientras la caja trabaja al 100% en stock")
    pay(0, 0, "INVERSION", "Reforma e instalacion nave", ARRANQUE_NAVE)
    pay(0, 0, "INVERSION", "Fianza 1 mes nave", FIANZA_NAVE)
    pay(0, 0, "GASTO", "Alta autonomo + asesor apertura", 300.0)

    stock, pipeline = [], []      # pipeline: (dia_cobro, unit)
    prox_ventana = 7.0            # primer viaje DE en dia 7
    iva_apartado = 0.0            # IVA REBU devengado y pendiente de ingreso
    retencion_hija = 0.0          # IRPF retenido nomina esposa (se ingresa en el 111)
    per_iva = []; per_ret = []
    compras = ventas = 0
    rows = []
    nadie_hasta = 8
    for m in range(1, MESES + 1):
        ini = caja
        v_mes, c_mes = [], []
        cobros_mes = pagos_fijos = ss_mes = sueldos_mes = retiros_mes = imp_mes = 0.0
        # -- ventas que cobran este mes (cobro a los 7-10 dias de firmar) --
        for d, u in list(pipeline):
            if d <= m * DIAS_MES:
                pipeline.remove((d, u)); stock.remove(u)
                u.m_sell = m; u.d_sell = d
                cobro = u.sell - u.iva           # comprador paga PVP; nosotros apartamos IVA
                get(m, int(d), "VENTA", f"{u.id} {u.nick}", cobro,
                    f"compra dia {int(u.d_buy)} m{u.m_buy}, en venta {int(d)-int(u.d_buy)}d")
                iva_apartado += u.iva
                per_iva.append((u.id, u.nick, m, round(u.iva)))
                cobros_mes += cobro; ventas += 1; v_mes.append(u)
        # -- gastos fijos del mes (dias 1-5) --
        for d, conc, imp in [(2, "Alquiler nave O Milladoiro", RENT),
                             (3, "Suministros (luz/agua/vado)", UTILITIES),
                             (4, "Asesor fiscal-laboral", ASESORIA)]:
            pay(m, d, "FIJO", conc, imp); pagos_fijos += imp
        # -- Seguridad Social obligatoria --
        pay(m, 5, "SS", "RETA tarifa plana titular", RETA_MARIDO)
        pay(m, 5, "SS", "Cotizacion esposa empleada", COTIZ_ESPOSA_EMPLEADA)
        ss_mes = RETA_MARIDO + COTIZ_ESPOSA_EMPLEADA
        # -- sueldos/retiros solo desde el mes `nadie_hasta` --
        ret_bruta_mes = 0.0
        if m >= nadie_hasta:
            bruto_e = SUELDO_ESPOSA; ret_irpf_e = round(bruto_e * 0.10)
            pay(m, 28, "NOMINA", "Nomina esposa (neto)", bruto_e - ret_irpf_e)
            ret_bruta_mes = bruto_e          # gasto contable = bruto
            retencion_hija += ret_irpf_e; per_ret.append((m, ret_irpf_e))
            exc = sum(u.margen for u in v_mes) - FIJOS_NAVE - ss_mes
            # retiro real: maximo 1.600 si tras pagarlo queda reserva minima de 3.000
            want = min(1_600.0, max(0.0, exc))
            ret_m = want if caja - want >= RESERVA_MIN else max(0.0, caja - RESERVA_MIN)
            if ret_m > 0:
                pay(m, 28, "RETIRO", "Retiro variable titular", ret_m)
                retiros_mes = ret_m
        # -- liquidaciones trimestrales de impuestos (modelos 303/111, dias 20) --
        if m % 3 == 0:
            if iva_apartado > 0.5:
                pay(m, 20, "IMPUESTO", "Modelo 303 IVA (trimestral)", iva_apartado,
                    "apartado de los margenes cobrados")
                imp_mes += iva_apartado; iva_apartado = 0.0
            if retencion_hija > 0.5:
                pay(m, 20, "IMPUESTO", "Modelo 111 IRPF retenido esposa", retencion_hija)
                imp_mes += retencion_hija; retencion_hija = 0.0
        # -- ventanas de compra (cada 14 dias, pago en transferencia DE ese dia) --
        while prox_ventana <= m * DIAS_MES:
            d = int(prox_ventana)
            for _ in range(2):                       # hasta 2 coches por viaje
                best = None
                for u in gira:                       # ordenadas por margen/dia-capital
                    if len(stock) >= 8: break
                    n_mismo = sum(1 for s in stock if s.nick == u.nick)
                    if n_mismo >= 2: continue        # max 2 unidades del mismo modelo
                    if caja - u.landed >= RESERVA_MIN + FIJOS_NAVE + ss_mes:
                        best = u; break
                if not best: break
                un = Unit(best, m, d)
                pay(m, d, "COMPRA", f"{un.id} {un.nick}", un.landed,
                    f"P25 DE {un.buy:,.0f} + log 730 + imprev 300 + admin 425 + prep 780 + imp {un.imp:,.0f}")
                stock.append(un); pipeline.append((d + 10 + un.days, un))
                compras += 1; c_mes.append(un)
            prox_ventana += VENTANA
        # -- cierre de mes --
        fin = caja
        rows.append(dict(m=m, ini=ini, fin=fin, v=v_mes, c=c_mes, stock=list(stock),
                         cobros=cobros_mes, fijos=pagos_fijos, ss=ss_mes,
                         sueldos=ret_bruta_mes - 120.0 if ret_bruta_mes else 0.0,   # neto pagado en caja
                         sueldos_bruto=ret_bruta_mes,                                # gasto contable
                         retiros=retiros_mes, imp=imp_mes,
                         compras=sum(u.landed for u in c_mes),
                         iva_pend=iva_apartado,
                         ret_pend=retencion_hija))
        # sanity: nada puede quedar bajo cero
        assert fin >= 0, f"caja negativa en mes {m}: {fin}"
    return rows, tx, stock, pipeline, iva_apartado, retencion_hija

def ret_m_safe(exc):
    return min(1_600.0, max(0.0, exc))

def iva_deudor_en_stock():
    return 0.0   # el IVA del margen solo se devenga al vender (regimen REBU)

# ---- impresion -------------------------------------------------------------
def fmt_money(x): return f"{x:,.0f}".replace(",", ".")

def main():
    out = io.StringIO()
    def P(s=""):
        print(s); print(s, file=out)

    rows, tx, stock_end, pipe_end, iva_p, ret_p = run()
    P("=" * 100)
    P("KHC IMPORT · PLAN V6 — CALENDARIO MES A MES DETERMINISTA · SIN FINANCIACION")
    P("Escenario C: capital 50.000 · nave mes 1 · cartera giratoria (<26k landed) · familia cobra desde mes 8")
    P("=" * 100)

    P("\n[1] RANKING DE CARTERA (margen por euro y dia inmovilizado — el criterio de eleccion)")
    P(f"    {'#':>2} {'modelo':22s} {'compra P25 DE':>13} {'imp':>7} {'landed':>8} {'venta ES':>9} {'margen':>8} {'dias':>5} {'€/€·dia':>8}")
    for i, u in enumerate(gira, 1):
        eff = u.margen / (u.landed * u.days)
        P(f"    {i:>2} {u.nick:22s} {fmt_money(u.buy):>13} {fmt_money(u.imp):>7} {fmt_money(u.landed):>8} {fmt_money(u.sell):>9} {fmt_money(u.margen):>8} {u.days:>5.0f} {eff*1000:>7.2f}‰")
    P("    Excluidos por capital (landed alto, 1 unidad inmoviliza todo): Q5 FY, Macan, GLC 300e, Cayenne.")

    P("\n[2] TABLA MAESTRA MENSUAL")
    hdr = f"{'mes':>3} {'caja ini':>9} {'+cobros':>9} {'-compras':>9} {'-fijos':>7} {'-SS':>6} {'-sueldos':>8} {'-retiros':>8} {'-impuestos':>10} {'caja fin':>9} {'stock':>5}"
    P(hdr); P("-" * len(hdr))
    for r in rows:
        P(f"{r['m']:>3} {fmt_money(r['ini']):>9} {fmt_money(r['cobros']):>9} {fmt_money(-r['compras']):>9} "
          f"{fmt_money(-r['fijos']):>7} {fmt_money(-r['ss']):>6} {fmt_money(-r['sueldos']):>8} {fmt_money(-r['retiros']):>8} "
          f"{fmt_money(-r['imp']):>10} {fmt_money(r['fin']):>9} {len(r['stock']):>5}")

    P("\n[3] FICHA DETALLADA MES A MES")
    for r in rows:
        m = r["m"]
        P("-" * 100)
        P(f"MES {m}  |  caja inicial {fmt_money(r['ini'])} €  →  caja final {fmt_money(r['fin'])} €")
        if r["c"]:
            P("  COMPRAS:")
            for u in r["c"]:
                P(f"    {u.id} {u.nick:22s} dia {int(u.d_buy):>2}: compra DE {fmt_money(u.buy)} + impuestos {fmt_money(u.imp)} "
                  f"+ costes ERP 2.235 = landed {fmt_money(u.landed)} € · previsto cobro dia {int(u.d_buy)+10+int(u.days)} (~mes {(int(u.d_buy)+10+int(u.days))//30 or 1})")
        if r["v"]:
            P("  VENTAS (cobro a los 7-10 dias de firmar):")
            for u in r["v"]:
                P(f"    {u.id} {u.nick:22s} vendido por {fmt_money(u.sell)} € · margen {fmt_money(u.margen)} € · "
                  f"IVA REBU apartado {fmt_money(u.iva)} € (ingreso en mod. 303)")
        if not r["c"] and not r["v"]:
            P("  (sin movimientos de vehiculos este mes)")
        P(f"  PAGOS DEL MES: fijos {fmt_money(r['fijos'])} (nave 1.200 + sumin. 250 + asesoria 60) · "
          f"SS {fmt_money(r['ss'])} (RETA 80 + esposa 205) · sueldos {fmt_money(r['sueldos'])} · "
          f"retiros {fmt_money(r['retiros'])} · impuestos {fmt_money(r['imp'])}")
        P(f"  IMPUESTOS APARTADOS Y PENDIENTES AL CIERRE: IVA REBU acumulado {fmt_money(r['iva_pend'])} €")
        stt = r["stock"]
        P(f"  STOCK FIN DE MES ({len(stt)} uds, coste inmovilizado {fmt_money(sum(u.landed for u in stt))} €, margen potencial {fmt_money(sum(u.margen for u in stt))} €):")
        if stt:
            for u in stt:
                edad = m - u.m_buy
                P(f"    {u.id} {u.nick:22s} en vitrina desde mes {u.m_buy} (hace {edad}) · PVP {fmt_money(u.sell)} € · giro previsto {u.days:.0f} d")
        else:
            P("    — vacio —")

    P("\n[4] CUENTA DE RESULTADOS ECONÓMICA (base contable, no caja)")
    tot_v = sum(len(r["v"]) for r in rows)
    margen_t = sum(u.margen for r in rows for u in r["v"])
    fijos_t = FIJOS_NAVE * MESES
    ss_t = (RETA_MARIDO + COTIZ_ESPOSA_EMPLEADA) * MESES
    sueldos_t = sum(r["sueldos_bruto"] + r["retiros"] for r in rows)   # contable: esposa a BRUTO
    iva_t = sum(u.iva for r in rows for u in r["v"])
    res = margen_t - fijos_t - ss_t - sueldos_t
    rn = max(0.0, res - 0.07 * res)
    from plan_v3 import irpf_cuota
    irpf = irpf_cuota(rn)
    P(f"  Ventas: {tot_v} unidades · margen bruto {fmt_money(margen_t)} €")
    P(f"  (-) Fijos nave+asesoria: {fmt_money(fijos_t)} €   (-) Cuotas SS: {fmt_money(ss_t)} €")
    P(f"  (-) Sueldos+retiros familia: {fmt_money(sueldos_t)} €   [el sueldo esposa es gasto deducible; el retiro titular no]")
    P(f"  (=) Resultado antes de IRPF: {fmt_money(res)} €")
    P(f"  (-) IRPF estimado (base {fmt_money(rn)}): {fmt_money(irpf)} €  → neto familiar ≈ {fmt_money(res - irpf)} €")
    P(f"  IVA REBU repercutido y pagado: {fmt_money(iva_t)} € (sale del margen, no es coste: lo paga el comprador)")
    P(f"  Caja final: {fmt_money(rows[-1]['fin'])} € + stock {len(stock_end)} uds ({fmt_money(sum(u.landed for u in stock_end))} €) "
      f"+ en tramitacion {len(pipe_end)} uds")

    P("\n[5] REGLAS DE EJECUCION Y QUÉ HACER SI EL PLAN SE DESVIA")
    P("  · Ventanas de compra cada 14 dias, max 2 unidades/viaje, max 8 en stock.")
    P("  · Si en una ventana no hay unidad del puesto #1 al precio objetivo, se baja al siguiente de la")
    P("    lista; si tampoco, se VIAJA BARATO (no se fuerza la compra). La caja manda sobre el ansia.")
    P("  · Regla anti-atasco: cualquier unidad con >55 dias en vitrina baja de precio 4%; >75 dias, 7%.")
    P("  · El IVA del margen se aparta en cuenta separada desde el dia del cobro; nunca es dinero 'nuestro'.")
    P("  · Mes 8+: si la caja final prevista bajaria de 3.000 € tras el retiro, el retiro se recorta. Intocables:")
    P("    nomina esposa 1.200 + cuota SS + fijos.")
    P("  · Revision mensual contra esta hoja: desviacion >15% en dos meses seguidos => parar compras y diagnosticar.")

    txt = out.getvalue()
    open("calendario_v6.txt", "w").write(txt)

    with open("detalle_v6.csv", "w", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["mes", "dia", "tipo", "concepto", "importe_EUR", "saldo_caja_EUR", "nota"])
        for t in tx:
            w.writerow(t)
    return rows, stock_end, pipe_end

if __name__ == "__main__":
    main()

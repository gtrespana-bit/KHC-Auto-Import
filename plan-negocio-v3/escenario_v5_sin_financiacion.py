#!/usr/bin/env python3
"""ESCENARIO v5 — SIN financiacion + colchon familiar meses 1-7 (dueño, 2026-10-16).

Reglas nuevas fijadas por el dueño:
  [TÚ] Nada de prestamos ni lineas de stock. Solo los 50.000 EUR.
  [TÚ] Los primeros 6-7 meses la familia NO saca dinero del negocio: solo se
       pagan las cuotas obligatorias (RETA tarifa plana 80 + esposa empleada 205).
  El resto del caja -> stock. Motor identico a plan_v3.simulate (landed incluye
  logistica+imprevistos+admin+preparacion ya dentro del precio de compra, segun
  catalogo.py/ERP; fijos = nave 1.200 + suministros 250 + asesoria 60 = 1.510).

Compara 4 variantes con Monte-Carlo (30 semillas) para no engañarse con un solo
camino afortunado:
  A) cartera mixta (incluye Q5/Macan/Cayenne/GLC), esposa cobra desde mes 1
  B) cartera giratoria <26k landed, esposa cobra desde mes 1
  C) cartera giratoria <26k landed, NADIE cobra hasta mes 8   <-- recomendada
  D) SL, cartera giratoria, sin nomina hasta mes 8
"""
import random, statistics as st
import plan_v3 as p

UNITS = p.make_units()
CARA = {"Q5 FY 0-40", "Macan 80-120", "Cayenne 92A 160-200", "GLC 300e 80-120"}
GIRA = [u for u in UNITS if u.nick not in CARA]

def sim(forma, units_use, meses=12, nadie_cobra_hasta=8, seed=11):
    """nadie_cobra_hasta: primer mes en que la familia puede empezar a retirar."""
    rng = random.Random(seed)
    cap0 = p.CAPITAL - p.ARRANQUE_NAVE - p.FIANZA_NAVE - (p.CONSTITUCION if forma == "SL" else 300.0)
    caja = cap0; pipeline = []; stock = []
    ventas = compras = 0
    fijos_t = sueldos_t = cotiz_t = margen_r = iva_rec = iva_pag = retiros_t = 0.0
    caja_min = caja; log = []; prox = 1.0
    for m in range(1, meses + 1):
        for d, u in list(pipeline):
            if d <= m * p.DIAS_MES:
                caja += u.sell - u.iva
                pipeline.remove((d, u)); stock.remove(u)
                ventas += 1; margen_r += u.margen; iva_rec += u.iva
        fx = p.FIJOS_NAVE
        # durante el colchon SOLO cuotas obligatorias (marido RETA 80 + esposa 205)
        ss = (p.RETA_MARIDO + p.COTIZ_ESPOSA_EMPLEADA) if forma == "AUTONOMO" else p.COTIZ_ESPOSA_EMPLEADA
        reserve = fx + ss
        sueldos = retiro = 0.0
        if m >= nadie_cobra_hasta and caja - fx - ss >= reserve:
            if forma == "SL":
                sueldos = min(p.SUELDO_CADA + p.SUELDO_ESPOSA, max(1800.0, (margen_r - fijos_t) / max(1, m)))
            else:
                sueldos = p.SUELDO_ESPOSA
                exc = margen_r - fijos_t - sueldos_t - cotiz_t - retiros_t
                retiro = min(1600.0, max(0.0, exc)) if caja - fx - ss - sueldos - 1600 >= reserve else 0.0
        imp_mes = 0.0
        if m % 3 == 0:
            imp_mes = iva_rec - iva_pag; iva_pag = iva_rec
        caja -= fx + ss + sueldos + retiro + imp_mes
        fijos_t += fx; cotiz_t += ss; sueldos_t += sueldos; retiros_t += retiro
        while prox <= m * p.DIAS_MES:
            for _ in range(3):
                cand = sorted(rng.choices(units_use, k=3), key=lambda u: u.landed)
                u = next((c for c in cand if caja - c.landed >= reserve and len(stock) < 20), None)
                if u:
                    caja -= u.landed; compras += 1; stock.append(u)
                    pipeline.append((prox + 10 + u.days, u))
            prox += 14.0
        caja_min = min(caja_min, caja)
        log.append((m, ventas, compras, len(stock), round(caja), round(margen_r), round(sueldos_t + retiros_t)))
    res = margen_r - fijos_t - sueldos_t - cotiz_t - retiros_t
    return dict(res=res, caja=caja, caja_min=caja_min, v=ventas, c=compras,
                margen=margen_r, retiros=sueldos_t + retiros_t, log=log)

def mc(forma, use, hasta, n=30):
    rs = [sim(forma, use, nadie_cobra_hasta=hasta, seed=s) for s in range(1, n + 1)]
    med = st.median([r["res"] for r in rs])
    lo = min(r["res"] for r in rs); hi = max(r["res"] for r in rs)
    vm = st.median([r["v"] for r in rs]); vlo = min(r["v"] for r in rs); vhi = max(r["v"] for r in rs)
    rojo = sum(1 for r in rs if r["res"] < 0)
    cm = st.median([r["caja_min"] for r in rs])
    return med, lo, hi, vm, vlo, vhi, rojo, cm

if __name__ == "__main__":
    print("=" * 96)
    print("MONTE-CARLO 30 SEMILLAS · CAPITAL 50.000 · NAVE MES 1 · SIN FINANCIACION")
    print("=" * 96)
    print(f"{'escenario':44s}{'resultado med':>14s}{'peor':>9s}{'mejor':>9s}{'vent/mes':>10s}{'rojo':>6s}")
    for tag, forma, use, hasta in [
        ("A mixta, esposa cobra mes 1",              "AUTONOMO", UNITS, 1),
        ("B giratoria, esposa cobra mes 1",          "AUTONOMO", GIRA,  1),
        ("C giratoria, NADIE cobra hasta mes 8",     "AUTONOMO", GIRA,  8),
        ("D SL giratoria, sin nomina hasta mes 8",   "SL",       GIRA,  8),
    ]:
        med, lo, hi, vm, vlo, vhi, rojo, cm = mc(forma, use, hasta)
        print(f"{tag:44s}{med:>14,.0f}{lo:>9,.0f}{hi:>9,.0f}   {vlo}-{vhi:<3d} ({vm:.0f}/yr){rojo:>5d}/30")
    print("\n--- DESGLOSE DETALLADO DEL RECOMENDADO (C, seed 11) ---")
    r = sim("AUTONOMO", GIRA, nadie_cobra_hasta=8)
    print(f"mes | acVentas | acCompras | stock | caja | margenAcum | retirosAcum")
    for row in r["log"]:
        print(f"{row[0]:>3d} | {row[1]:>8d} | {row[2]:>9d} | {row[3]:>5d} | {row[4]:>7,d} | {row[5]:>10,d} | {row[6]:>11,d}")
    print(f"\nResultado antes de IRPF: {r['res']:,.0f} EUR · caja final {r['caja']:,.0f} · minima {r['caja_min']:,.0f}")

# --- anexo: horizonte 18 meses del recomendado C (la financiacion NO es necesaria,
# solo retrasa el objetivo; esto responde a "que tan mal vamos sin prestamos") ---
def run18():
    r = sim("AUTONOMO", GIRA, meses=18, nadie_cobra_hasta=8, seed=11)
    print("\n--- ESCENARIO C A 18 MESES (seed 11) ---")
    for row in r["log"]:
        print(row)
    print(f"resultado {r['res']:,.0f} EUR · caja final {r['caja']:,.0f}")

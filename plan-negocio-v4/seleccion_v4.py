#!/usr/bin/env python3
"""SELECCIÓN V4 — ¿tiene razón el dueño con Golf / A1 / A3 / Serie 1?

Pregunta del dueño (16-oct-2026): "empezar con modelos más económicos y de
rotación más rápida: Golf, Audi A1, A3, BMW Serie 1... investiga y dime si
estoy errado".

Método: MISMO motor que catalogo v3 (catalogo.py, reglas idénticas: P25 DE,
mediana ES -3 % regateo, IEDMT por CO2 [ERP], mix 50 % particular +ITP 3 %,
logística 730, admin 425, preparación 810, imprevistos 300) sobre TODOS los
pares generación+segmento km con muestra mínima. Después se comparan tres
carteras posibles con la métrica que de verdad importa cuando el capital es
fijo: **beneficio por euro inmovilizado y por día** (ROI·velocidad), no solo
el margen absoluto por coche.
"""
from __future__ import annotations
import json, statistics as st
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent   # /workspace
DE_FILES = ["data/autoscout/rows.json", "data/mobilede/rows.json"]
ES_FILES = ["data/milanuncios/rows.json", "data/autoscout-es/rows.json"]

# CO2 por generacion: mismo diccionario validado de catalogo v3
CO2_HINTS = {
    ("Golf", "Golf VII.5"): 110, ("Golf", "Golf VII"): 105, ("Golf", "Golf VIII"): 118,
    ("Golf", "Golf VII (5G)"): 105, ("Golf Variant", "BA7"): 108,
    ("Serie 1", "F20 LCI"): 109, ("Serie 1", "F40"): 118,
    ("Serie 3", "F30 LCI"): 110, ("Serie 3 Touring", "F31"): 115, ("Serie 3 Touring", "G21"): 122,
    ("Clase A", "W176"): 104, ("Clase A", "W177"): 112, ("Clase B", "W247"): 119,
    ("Clase C", "W205 pre"): 112, ("Clase C", "W205 post"): 120,
    ("Clase E", "W212"): 127, ("Clase E", "W213"): 118,
    ("CLA", "C117"): 109, ("CLA", "C118"): 114,
    ("GLA", "X156"): 119, ("GLB", "X247"): 132, ("GLC", "X253 pre"): 127, ("GLC", "X253 post"): 148,
    ("A3", "8V"): 100, ("A3", "8Y"): 112, ("A4", "B9"): 112, ("A1", "8X"): 110, ("A1", "GB"): 122,
    ("Q2", "GA"): 122, ("Q3", "NU"): 119, ("Q3", "F3"): 130, ("Q5", "8R"): 139, ("Q5", "FY"): 141,
    ("Tiguan", "AD1"): 130, ("Tiguan", "AC"): 133, ("T-Roc", "A1"): 128,
    ("X1", "F48 LCI"): 125, ("X1", "F48"): 125, ("X3", "G01"): 141,
    ("Leon", "KL"): 105, ("Octavia Combi", "NE"): 107,
    ("Corolla", "E210"): 100, ("C-HR", "AX10"): 100, ("Yaris", "XP217"): 85,
    ("Niro", "DE"): 95, ("Kona", "OS"): 118, ("XC40", "C411"): 125,
    ("Macan", "95B"): 159, ("Cayenne", "E3"): 199, ("Cayenne", "92A"): 199,
}
DEFAULT_CO2 = 140.0
MIN_PRICE, MAX_PRICE, MIN_KM, MAX_KM, MIN_YEAR = 4_000, 60_000, 15_000, 250_000, 2012
SEG = 40_000
MIN_N_DE, MIN_N_ES = 20, 12
REGATEO = 0.03; VENDOR_MIX = 0.5; ITP_PARTICULAR = 0.03
LOGISTICA, IMPREVISTOS = 730.0, 300.0
ADMIN = 425.0            # ITV 132,59 + DGT 99,77 + placas 28 + traductor 45 + COC 120 [ERP]
PREPARACION = 810.0      # profe 180 + mantenimiento 150 + garantía ALD 450 + anuncios 30

def iedmt(co2, base):
    if co2 <= 120: return 0.0
    if co2 <= 159: return base * 0.0475
    if co2 <= 199: return base * 0.0975
    return base * 0.1475

def load(files):
    d = defaultdict(lambda: defaultdict(list))
    for f in files:
        for r in json.load(open(ROOT / f)):
            b, m, g, ctry, ver, yr, km, p = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
            if not all(isinstance(x, (int, float)) for x in (yr, km, p)): continue
            if not (MIN_PRICE <= p <= MAX_PRICE and MIN_KM <= km <= MAX_KM and yr >= MIN_YEAR): continue
            key = (m.replace("Gran Coupé", "Gran Coupe"), g)
            d[key][km // SEG].append((p, ver))
    return d

def dias_venta(precio, nes):
    """Rotación estimada: mediana mercado 40 d [repo ANALISIS_TIEMPO_VENTA.md],
    +2,5 d por cada 1.000 € sobre 20k (menos compradores), - hasta 15 d según
    densidad de demanda ES (nES de la propia captura como proxy)."""
    d = 40.0 + max(0.0, (precio - 20_000) / 1000) * 2.5 - min(15.0, (nes - 25) / 8.0)
    return max(28.0, round(d))

def main():
    DE, ES = load(DE_FILES), load(ES_FILES)
    rows = []
    for k in sorted(set(DE) & set(ES)):
        for seg in set(DE[k]) & set(ES[k]):
            de = sorted(DE[k][seg]); es = sorted(ES[k][seg])
            if len(de) < MIN_N_DE or len(es) < MIN_N_ES: continue
            buy = st.quantiles([p for p, _ in de], n=4)[0]
            sell = st.median([p for p, _ in es]) * (1 - REGATEO)
            spread = (sell / buy - 1) * 100
            co2 = CO2_HINTS.get(k, DEFAULT_CO2)
            imp = iedmt(co2, buy) * (1 - VENDOR_MIX) + buy * ITP_PARTICULAR * VENDOR_MIX
            landed = buy + LOGISTICA + IMPREVISTOS + ADMIN + PREPARACION + imp
            margen = sell - landed
            days = dias_venta(buy, len(es))
            roi_dia = margen / landed / days * 365     # % anualizado del capital inmovilizado
            gan_dia = margen / days                    # €/día generado mientras el dinero está dentro
            rows.append(dict(modelo=f"{k[0]} {k[1]}", gen=k[1], seg=seg, lo=seg*SEG//1000,
                             hi=(seg+1)*SEG//1000, nDE=len(de), nES=len(es), buy=buy, sell=sell,
                             spread=spread, co2=co2, imp=imp, landed=landed, margen=margen,
                             days=days, roi_dia=roi_dia, gan_dia=gan_dia))
    with open(Path(__file__).with_name("seleccion_v4.json"), "w") as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=1)

    def show(filtro, titulo, n=12):
        sel = [r for r in rows if filtro(r)]
        sel.sort(key=lambda r: -r["gan_dia"])
        print(f"\n### {titulo} ({len(sel)} pares que pasan filtros)")
        print(f"{'modelo':26s}{'km':>9s}{'nDE':>5s}{'nES':>5s}{'BUY':>8s}{'SELL':>8s}{'spr%':>6s}"
              f"{'landed':>8s}{'MARGEN':>8s}{'días':>5s}{'€/día':>7s}{'ROI%':>6s}")
        for r in sel[:n]:
            print(f"{r['modelo'][:26]:26s}{r['lo']:>4d}-{r['hi']:<4d}{r['nDE']:>5d}{r['nES']:>5d}"
                  f"{r['buy']:>8,.0f}{r['sell']:>8,.0f}{r['spread']:>5.0f}%{r['landed']:>8,.0f}"
                  f"{r['margen']:>8,.0f}{r['days']:>5.0f}{r['gan_dia']:>7,.0f}{r['roi_dia']:>5.0f}%")

    ECON = {"Golf","Golf Variant","A1","A3","Serie 1","Leon","Octavia Combi","Clase A","Clase B",
            "Q2","Q3","Tiguan","T-Roc","Corolla","C-HR","X1","Serie 3 Touring"}
    show(lambda r: any(e in r["gen"] for e in ECON) and r["margen"]>=1200 and r["landed"]<=24000,
         "HIPÓTESIS DEL DUEÑO: compactos/económicos (<24k landed, margen>=1.200)")
    show(lambda r: r["margen"]>=2500, "MEJORES MARGENES ABSOLUTOS (>=2.500)")
    show(lambda r: True, "TOP GLOBAL POR €/DÍA (todas las muestras válidas)", 15)

if __name__ == "__main__":
    main()

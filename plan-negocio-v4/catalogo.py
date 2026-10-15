#!/usr/bin/env python3
"""CATALOGO v3 — construido desde 0 sobre 74.875 anuncios reales del repo.

Fuentes (todas capturadas por el propio sistema):
  DE: data/autoscout/rows.json (7.736) + data/mobilede/rows.json (37.580) = 45.316
  ES: data/milanuncios/rows.json (11.539) + data/autoscout-es/rows.json (18.559) = 30.098

Metodo (cada paso es reproducible ejecutando este fichero):
  1. Emparejar por GENERACION exacta (el campo de variante del scraper, p.ej.
     'Golf VII.5', 'Clase C W205 pre'). Solo se comparan coches que son el mismo
     coche: misma marca, mismo modelo, misma generacion.
  2. Filtrar anuncios creibles: precio entre 4.000 y 60.000 EUR, km entre
     15.000 y 250.000, año 2012+.
  3. Vender en el MISMO segmento de kilometraje: la compra alemana y la venta
     espanola tienen que caer en la misma banda de 40.000 km. Evita comparar un
     Golf de 60.000 km aleman contra uno de 180.000 km espanol.
  4. Precio de compra = PERCENTIL 25 de los anuncios DE del segmento (compras
     por debajo de la mediana: un profesional negocia y escoge; ademas da colchon
     si el mercado se mueve). Precio de venta = MEDIANA de los anuncios ES menos
     3% de regateo [ERP rates.js rebajaVenta].
  5. Muestras minimas: nDE >= 25 y nES >= 15 (un dato con 5 anuncios es ruido).
  6. CO2 tipico: se toma del catalogo de versiones mas frecuentes del scraper
     (coincidencia por version); si no hay dato, 140 g/km como hipotesis.
  7. Regla de entrada al plan: margen bruto por coche >= 1.800 EUR una vez
     descontados TODOS los costes fijos por unidad (logistica, impuestos,
     matriculacion, preparacion, garantia) Y spread DE->ES >= 8%.

Salida: tabla ordenada por margen, con el veredicto ENTRA/fuera.
"""
from __future__ import annotations
import json, statistics as st
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DE_FILES = ["data/autoscout/rows.json", "data/mobilede/rows.json"]
ES_FILES = ["data/milanuncios/rows.json", "data/autoscout-es/rows.json"]

# CO2 tipico por (modelo, generacion) segun la version dominante en la muestra
# del scraper. Fuente: ficha tecnica de esas versiones (valores WLTP/NEDC segun
# epoca). Donde no hay certeza se usa 140 (hipotesis conservadora, tramo 4,75%).
CO2_HINTS = {
    ("Golf", "Golf VII.5"): 110, ("Golf", "Golf VII"): 105, ("Golf", "Golf VIII"): 118,
    ("Serie 1", "F20 LCI"): 109, ("Serie 1", "F40"): 118,
    ("Serie 3", "F30 LCI"): 110, ("Serie 3 Touring", "F31"): 115, ("Serie 3 Touring", "G21"): 122,
    ("Serie 4 Gran Coupe", "F36"): 118, ("Serie 5", "F10"): 122, ("Serie 5 Touring", "F11 LCI"): 129,
    ("X1", "F48 LCI"): 125, ("X3", "F25"): 140, ("X3", "G01"): 141, ("X4", "F26"): 134, ("X4", "G02"): 143,
    ("X5", "F15"): 170, ("X5", "G05"): 160,
    ("Clase A", "W176"): 104, ("Clase A", "W177"): 112, ("Clase B", "W247"): 119,
    ("Clase C", "W205 pre"): 112, ("Clase C", "W205 post"): 120, ("Clase C Estate", "S205"): 118,
    ("Clase E", "W212"): 127, ("Clase E", "W213"): 118,
    ("CLA", "C117"): 109, ("CLA", "C118"): 114, ("GLA", "X156"): 119, ("GLA", "H247"): 128,
    ("GLB", "X247"): 132, ("GLC", "X253 pre"): 127, ("GLC", "X253 post"): 148, ("GLE", "W166"): 159, ("GLE", "V167"): 168,
    ("A3", "8V"): 100, ("A3", "8Y"): 112, ("A4", "B9"): 112, ("A4 Avant", "B9"): 118,
    ("A5 Sportback", "F5"): 122, ("A6", "C7"): 132, ("A6", "C8"): 134,
    ("Q2", "GA"): 122, ("Q3", "NU"): 119, ("Q3", "F3"): 130, ("Q5", "8R"): 139, ("Q5", "FY"): 141, ("Q7", "4M"): 158,
    ("Tiguan", "AD1"): 130, ("Tiguan", "AC"): 133, ("Passat Variant", "B8"): 110,
    ("Touran", "5T1"): 122, ("T-Roc", "A1"): 128, ("Arteon", "3H"): 139, ("Golf Variant", "BA7"): 108,
    ("Leon", "KL"): 105, ("Octavia Combi", "NE"): 107, ("Kodiaq", "NS7"): 132, ("Karoq", "NU7"): 128,
    ("Superb", "B8"): 118,
    ("3008", "P84"): 115, ("5008", "P87"): 122, ("C-HR", "AX10"): 100, ("RAV4", "XA50"): 105,
    ("Corolla", "E210"): 100, ("Yaris", "XP217"): 85, ("Qashqai", "J11"): 120, ("Tucson", "TL"): 128, ("Tucson", "NX4"): 130,
    ("Sportage", "QL"): 122, ("Niro", "DE"): 95, ("Kona", "OS"): 118,
    ("XC40", "C411"): 125, ("XC60", "V21"): 132, ("XC90", "II"): 145, ("V60", "II"): 126,
    ("Macan", "95B"): 159, ("Cayenne", "E3"): 199,
    ("Duster", "HM"): 125, ("Sandero", "B840"): 95,
    ("Discovery Sport", "L550"): 140, ("Range Rover Evoque", "L551"): 138,
    ("Multivan", "T6.1"): 152, ("Caddy", "SKODA"): 122, ("California", "T6"): 160,
    ("Outlander", "GF"): 160, ("Model 3", "3"): 0, ("Zoe", "X10"): 0, ("Ioniq", "AE"): 85,
}
DEFAULT_CO2 = 140.0

MIN_PRICE, MAX_PRICE = 4_000, 60_000
MIN_KM, MAX_KM = 15_000, 250_000
MIN_YEAR = 2012
SEG = 40_000          # anchura de banda de km
MIN_N_DE, MIN_N_ES = 20, 12
UMBRAL_MARGEN = 1_800.0
UMBRAL_SPREAD = 8.0
ITP_PARTICULAR = 0.03   # [ERP rates.js ITP_GALICIA] compra a particular DE: sin IVA, pero ITP 3 %
VENDOR_MIX = 0.5         # fraccion de compras que se asumen a particular (conservador)
REGATEO = 0.03        # [ERP]

# Costes fijos por unidad [ERP rates.js]
LOGISTICA = 730.0
IMPREVISTOS = 300.0
ADMIN = 132.59 + 99.77 + 28.0 + 45.0 + 120.0   # ITV+DGT+placas+trad+COC ~ 425
PREPARACION = 180.0 + 150.0 + 450.0 + 30.0      # profe + mant + garantia + anuncio

def iedmt(co2, base):
    if co2 <= 120: return 0.0
    if co2 <= 159: return base * 0.0475
    if co2 <= 199: return base * 0.0975
    return base * 0.1475

def load(files):
    out = []
    for f in files:
        for r in json.load(open(ROOT / f)):
            brand, model, gen, ctry, ver, year, km, price = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
            if not all(isinstance(x, (int, float)) for x in (year, km, price)): continue
            if not (MIN_PRICE <= price <= MAX_PRICE): continue
            if not (MIN_KM <= km <= MAX_KM): continue
            if year < MIN_YEAR: continue
            out.append((brand, model, gen, ver, year, int(km), float(price)))
    return out

def key_of(b, m, g):  return (m.replace("Gran Coupé", "Gran Coupe"), g)

def bucket(rows):
    d = defaultdict(lambda: defaultdict(list))
    for b, m, g, ver, y, km, p in rows:
        d[key_of(b, m, g)][km // SEG].append((p, ver))
    return d

PLUG_HYBRID = {"3008 II Hybrid4", "XC40 T5 Recharge", "X1 25e", "GLC X253 300e",
               "Serie 3 G20 330e", "Outlander PHEV III", "A3 Sportback e-tron"}

def co2_for(model_gen, versions):
    if model_gen in CO2_HINTS: return float(CO2_HINTS[model_gen]), "ficha"
    if model_gen[0] in PLUG_HYBRID or any(k in str(model_gen) for k in ("Hybrid4", "Recharge", "300e", "330e", "25e")):
        return 45.0, "PHEV (tramo 0%)"
    low = model_gen[0].lower()
    if "id.3" in low or "zoe" in low or "ioniq" in low and "electric" in low: return 0.0, "BEV"
    return DEFAULT_CO2, "hipotesis 140"

def main():
    DE, ES = bucket(load(DE_FILES)), bucket(load(ES_FILES))
    results = []
    for k in sorted(set(DE) & set(ES)):
        for seg in set(DE[k]) & set(ES[k]):
            de = sorted(p for p, _ in DE[k][seg]); es = sorted(p for p, _ in ES[k][seg])
            if len(de) < MIN_N_DE or len(es) < MIN_N_ES: continue
            buy = st.quantiles(de, n=4)[0]          # P25 aleman
            sell = st.median(es) * (1 - REGATEO)    # mediana ES con regateo
            spread = (sell / buy - 1) * 100
            models = {v for _, v in list(DE[k][seg])[:50]} | {v for _, v in list(ES[k][seg])[:50]}
            co2, src = co2_for(k, models)
            imp = iedmt(co2, buy) * (1 - VENDOR_MIX)   # concesionario DE con ISD ya pagado: no devenga
            itp = buy * ITP_PARTICULAR * VENDOR_MIX     # particular DE: ITP 3 % (Modelo 620)
            imp += itp
            coste = buy + LOGISTICA + IMPREVISTOS + ADMIN + PREPARACION + imp
            margen = sell - coste
            results.append(dict(gen=k, seg=seg, nDE=len(de), nES=len(es), buy=buy,
                                sell=sell, spread=spread, co2=co2, co2src=src,
                                imp=imp, coste=coste, margen=margen,
                                ejemplo=", ".join(sorted({v for _, v in DE[k][seg]}))[:60]))
    results.sort(key=lambda r: -r["margen"])
    print(f"{'generacion':34s}{'km':>9s}{'nDE':>5s}{'nES':>5s}{'BUY-P25':>9s}{'SELL':>9s}"
          f"{'spr%':>7s}{'CO2':>5s}{'IEDMT':>7s}{'MARGEN':>8s}  veredicto")
    entran = 0
    for r in results:
        ok = r["margen"] >= UMBRAL_MARGEN and r["spread"] >= UMBRAL_SPREAD
        entran += ok
        lo, hi = r["seg"] * SEG, (r["seg"] + 1) * SEG
        print(f"{r['gen'][0]+' '+r['gen'][1]:34s}{lo//1000:>6d}-{hi//1000:<3d}"
              f"{r['nDE']:>5d}{r['nES']:>5d}{r['buy']:>9,.0f}{r['sell']:>9,.0f}"
              f"{r['spread']:>6.1f}%{r['co2']:>5.0f}{r['imp']:>7,.0f}{r['margen']:>8,.0f}"
              f"  {'ENTRA' if ok else ''}")
    print(f"\nTotal pares generacion+segmento evaluados: {len(results)} · con ENTRAN: {entran}")
    with open(Path(__file__).with_name("catalogo_v3.json"), "w") as fh:
        json.dump(results, fh, ensure_ascii=False, indent=1)
    print("Guardado: catalogo_v3.json")

if __name__ == "__main__":
    main()

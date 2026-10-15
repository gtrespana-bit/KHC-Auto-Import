#!/usr/bin/env python3
"""Modelo realista de arranque y 36 meses. Motor de simulación, en semanas.

Por qué existe este fichero
---------------------------
El plan de los PDF (`probar_sin_financiacion.py`) vende «una de cada tres
unidades en el suelo, y nunca menos de dos, cada mes», y el dinero de una venta
vuelve el mismo mes. Eso da 7 ventas al mes con 22 coches y 84 coches al año.
Aquí se modela lo que de verdad limita a un comprador-vendedor pequeño:

  1. CICLO DE CAJA. El coche se paga en Alemania y el dinero no vuelve hasta
     cobrar la venta: el tiempo de traerlo y ponerlo a la venta (`lead`) más los
     días que tarde en venderse. Mientras tanto ese dinero no trabaja (docs/03:
     ciclo de 28-40 días; aquí se modela semana a semana).
     `lead` = 1 semana como máximo (búsqueda, vuelo, compra, viaje de vuelta,
     revisión y detallado). Viajando se cierra en 3 días; enviándolo, en 1
     semana. El coche se anuncia en cuanto llega y **los papeles no retrasan
     nada**: se le puede entregar al cliente con placas temporales, así que la
     venta y el cobro no esperan a la matriculación. Antes del 12/10/2026 el
     modelo usaba 3 semanas fijas sólo para llegar.
  2. ROTACIÓN POR UNIDAD. Cada coche tiene sus días de venta: 12-30 días en los
     modelos top de docs/07, 43 días de media online y 90 en tienda según
     MSI/Autocasión, 75-100 según Green Car Monitor y BCA.
  3. TECHO DE DEMANDA POR MODELO. No se venden 19 BMW 116d iguales en un año en
     Galicia. Más stock da más ventas HASTA que el modelo se satura; a partir de
     ahí hay que cambiar de modelo, no de cantidad. El plan viejo no tenía esto.
  4. SITIO FÍSICO. La nave tiene plazas. 22 coches no caben en 200 m².
  5. COSTES QUE FALTABAN. Seguro del local, licencia de apertura, constitución
     de la sociedad y avería grave ocasional (una DSG no la cubre la reserva de
     300 € que ya va dentro del coste de cada coche).

Todo lo demás —precios de compra y de venta, REBU, gastos fijos, kit, sueldo e
impuesto— sale de los ficheros del plan: `generar_presentacion.py` (vía
`probar_sin_financiacion.py`) y `datos_nave_milladoiro.py`.

    python3 modelo_realista.py                  # comparativa y mes a mes
    python3 modelo_realista.py --sims 2000      # más simulaciones (más lento)
    python3 modelo_realista.py --una pequena    # una sola estrategia, en detalle
"""

from __future__ import annotations

import argparse
import importlib.util
import math
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

spec = importlib.util.spec_from_file_location("p", str(HERE / "probar_sin_financiacion.py"))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
g = p.g

r2 = g.r2
SEM_MES = 52 / 12.0
MESES = 36


def eur(n, cents=True):
    return g.eur(n, cents)


# ---------------------------------------------------------------------------
# 1. Los siete coches del plan. `coste` es «puesto en A Coruña y a la venta»:
#    incluye coche, transporte, ITV, tasas DGT, impuesto de matriculación,
#    preparación, garantía, anuncios y una reserva de 300 € para imprevistos.
#    `dias`  = días medios en venderse una vez anunciado.
#    `techo` = unidades que el mercado gallego absorbe de ese modelo al mes.
#    ⚠ CORREGIDO el 12/10/2026: estos techos (5,65 coches/mes para los ocho modelos)
#    eran demasiado bajos y NO son el límite de la venta. El área metropolitana de
#    Santiago vende ~7.200 coches de ocasión al año (2,18 M en España, Autonocion
#    1S-2026); un negocio que venda 42 al año está en el 0,6 % del mercado. Los
#    techos sólo se usan si se activa el modelo antiguo de cuota mensual
#    (`--con-cola`); en el modelo base cada coche vende a su ritmo y el límite son
#    las plazas de la nave y el capital, no la demanda.
# ---------------------------------------------------------------------------
#    `dias` = días medios en venderse una vez anunciado. Están fijados con la
#    evidencia de mercado de octubre de 2026 (ver `ANALISIS_TIEMPO_VENTA.md`):
#      · los cinco coches que más rápido se venden en España tardan 33-38 días
#        (Autovista24 vía Coches.net);
#      · un turismo de combustión medio pasa 43 días en stock (Faconauto) y una
#        mediana de 40 días anunciado (Autouncle, oct-2026);
#      · los eléctricos, 103 días: fuera del catálogo.
#    El escenario «mercado» pone los modelos de mayor demanda al nivel de los
#    más rápidos de España (33-38) y el resto por encima de la media (45-60),
#    porque un modelo de nicho tarda más y un negocio nuevo no gira más rápido
#    que la media. Los días se pueden sustituir con `dias_unidad` (presets
#    DIAS_MEDIA y DIAS_CATALOGO) para ver el abanico.
# ---------------------------------------------------------------------------
UNIDADES = {
    # nick          coste      venta     días  techo/mes  nombre
    # Pequeños de alta rotación
    "Polo":     dict(coste=8900.0, venta=11900.0, dias=32, techo=1.30, nombre="VW Polo 1.0 TSI"),
    "116d":     dict(coste=9010.0, venta=12475.0, dias=35, techo=1.20, nombre="BMW 116d"),
    "A3":       dict(coste=12455.0, venta=15990.0, dias=35, techo=0.90, nombre="Audi A3 1.0 TFSI"),
    "Golf VIII": dict(coste=14617.0, venta=18700.0, dias=32, techo=0.70, nombre="VW Golf VIII 1.0 TSI"),
    "Leon":     dict(coste=12900.0, venta=17500.0, dias=32, techo=0.80, nombre="Seat León 2.0 TDI FR"),
    "GTI":      dict(coste=12674.0, venta=18500.0, dias=45, techo=0.60, nombre="Golf GTI Performance"),
    "3008":     dict(coste=15500.0, venta=20500.0, dias=48, techo=0.55, nombre="Peugeot 3008 BlueHDi"),
    "Corolla":  dict(coste=14500.0, venta=18500.0, dias=36, techo=0.85, nombre="Toyota Corolla Hybrid"),
    "XC40":     dict(coste=14738.0, venta=18500.0, dias=45, techo=0.50, nombre="Volvo XC40 D3"),
    "318d":     dict(coste=14220.0, venta=17250.0, dias=45, techo=0.50, nombre="BMW 318d Touring"),
    # SUV / premium de margen alto (tardan algo más, pero se justifica)
    "Tiguan":   dict(coste=16500.0, venta=21500.0, dias=46, techo=0.50, nombre="VW Tiguan 1.5 TSI"),
    "X1":       dict(coste=17500.0, venta=23000.0, dias=48, techo=0.45, nombre="BMW X1 xDrive18d"),
    "330d":     dict(coste=21000.0, venta=28000.0, dias=58, techo=0.40, nombre="BMW 330d Touring"),
    "Mercedes": dict(coste=17666.0, venta=23990.0, dias=55, techo=0.35, nombre="Mercedes C Estate"),
    "XC60":     dict(coste=22500.0, venta=30000.0, dias=56, techo=0.40, nombre="Volvo XC60 D5"),
}
for _u in UNIDADES.values():
    _bruto = r2(_u["venta"] - _u["coste"])
    _u["rebu"] = r2(_bruto * 21 / 121)          # IVA sólo de la ganancia (REBU)
    _u["neto"] = r2(_bruto - _u["rebu"])
    _u["roi_mes"] = _u["neto"] / (_u["coste"] * _u["dias"] / 30.0)
    _u["margen_dia"] = _u["neto"] / _u["dias"]   # € netos recuperados por día ocupando plaza

# ---------------------------------------------------------------------------
# 1.b Velocidad de venta por modelo. `UNIDADES[nick]["dias"]` es el escenario
#     conservador: el mercado general tarda 43 días de media online y 90 en
#     tienda (MSI/Autocasión, 2026); un negocio nuevo sin reseñas no gira más
#     rápido que la media del mercado.
#     El escenario «catalogo» usa la velocidad que el propio proyecto atribuye a
#     los modelos ganadores en `docs/07_MATRIZ_MODELOS_GANADORES_VS_PROHIBIDOS.md`
#     (Golf 7.5 2.0 TDI 10-18 d, A3 2.0 TDI 12-18, Serie 1 118d/120d 10-15,
#     Serie 3 Touring 14-24). Se usa el extremo lento de cada rango, redondeado
#     al alza: es techo optimista, no suelo.
#     `media` es el escenario intermedio: el doble del catálogo, la mitad de la
#     media del mercado. Es el que se usa por defecto en la comparativa.
# ---------------------------------------------------------------------------
DIAS_OPTIMISTA = {"116d": 22, "A3": 22, "Golf VIII": 25, "GTI": 30,
                  "XC40": 35, "318d": 35, "Mercedes": 45}
DIAS_PESIMISTA = {"116d": 45, "A3": 45, "Golf VIII": 45, "GTI": 60,
                  "XC40": 60, "318d": 55, "Mercedes": 70}
DIAS_MEDIA = DIAS_OPTIMISTA   # nombre antiguo
DIAS_CATALOGO = {"116d": 18, "A3": 18, "Golf VIII": 18, "GTI": 20,
                 "XC40": 25, "318d": 25, "Mercedes": 22}

# Estacionalidad del mercado de ocasión en España (agosto muerto; enero, marzo,
# mayo y noviembre fuertes).
ESTAC = [1.15, 1.10, 1.15, 1.00, 1.00, 1.05, 0.90, 0.60, 1.00, 1.05, 1.10, 0.95]


def rampa(mes):
    """Cuánta demanda real hay según la antigüedad del negocio.

    Un negocio que abre no vende lo mismo que uno con reseñas, tráfico en la web
    y dos años de teléfono sonando. Estos factores son una hipótesis de trabajo,
    no un dato de mercado: se mueven en la sensibilidad.
    """
    if mes <= 6:
        return 0.65
    if mes <= 12:
        return 0.80
    if mes <= 24:
        return 1.00
    return 1.15

# ---------------------------------------------------------------------------
# 2. Locales. Alquileres de naves en Santiago consultados en portales en
#    octubre de 2026: 220 m² en Castiñeiriño 590 €/mes, 227 m² en Sionlla
#    600 €/mes, 185 m² en Campus Norte 600 €/mes, 334 m² en Fontiñas 1.200 €/mes,
#    550 m² en San Marcos 1.100 €/mes, 428 m² en San Lázaro 1.690 €/mes,
#    465 m² en O Milladoiro 1.200 €/mes.
#    `seguro` y `tasas` son costes que el plan no tenía: seguro de nave de
#    300-900 €/año la póliza básica de almacén (hasta 1.200-1.800 la completa) y
#    tasa de apertura + técnico de 400-1.500 € una sola vez.
# ---------------------------------------------------------------------------
NAVES = {
    "milladoiro": dict(
        nombre="O Milladoiro, 465 m²", rent=1200.0, util=150.0, net=50.0,
        seguro=60.0, tasas=25.0, plazas=14, m2=465,
    ),
    "mediana": dict(
        nombre="Fontiñas, 334 m²", rent=1200.0, util=120.0, net=50.0,
        seguro=55.0, tasas=25.0, plazas=11, m2=334,
    ),
    "pequena": dict(
        nombre="Nave 220-227 m² (Sionlla/Castiñeiriño)", rent=600.0, util=100.0,
        net=50.0, seguro=45.0, tasas=25.0, plazas=7, m2=220,
    ),
    "san_marcos": dict(
        nombre="San Marcos, 550 m²", rent=1100.0, util=160.0, net=50.0,
        seguro=60.0, tasas=25.0, plazas=17, m2=550,
    ),
    "sin_nave": dict(
        nombre="Sin nave: 3 plazas de garaje", rent=195.0, util=0.0, net=5.0,
        seguro=0.0, tasas=0.0, plazas=4, m2=0,
    ),
}
# Un local sin escaparate ni sitio donde enseñar el coche convierte peor y tarda
# más por unidad. Es una hipótesis, no un dato: se mueve en la sensibilidad.
PENAL_SIN_NAVE = dict(demanda=0.75, dias=1.40)

# ---------------------------------------------------------------------------
# 3. Reforma por fases. El plan sólo tiene la lista completa (5.115,47 €). Los
#    precios son los de `datos_nave_milladoiro.py`; aquí sólo se reparten entre
#    lo que hace falta para abrir (limpieza, pintura, suelo, luz, lonas y
#    seguridad) y lo que puede esperar (decoración, archivo, herramientas).
# ---------------------------------------------------------------------------
REFORMA_A = 3160.00
REFORMA_B = r2(g.REFORM - REFORMA_A)
REFORMA_PEQ_A = 1950.00   # equivalente en 220 m²: 150 m² de suelo y 8 puntos de luz
REFORMA_PEQ_B = 1150.00

CONSTITUCION_SL = 1200.00  # notaría, registro y gestoría (el plan no la ponía)
LICENCIA = 800.00          # tasa de apertura + técnico (el plan no la ponía)

# ---------------------------------------------------------------------------
# 3.b El ciclo de compra, tal como lo describe el dueño del negocio (12/10/2026):
#      · buscar: 1-2 días (varios portales, se eligen varias unidades a la vez);
#      · si es urgente, vuelo y compra en el sitio;
#      · 2 días más y el coche está otra vez en Santiago;
#      · revisión y detallado: 1-2 días.
#    Total: ~5-6 días hasta poder anunciarlo. `lead` se mide en semanas, así que
#    se pone 1,0 (entre 7 y 14 días según el día de la semana en que se compre):
#    es el dato del dueño redondeado a la baja contra el negocio.
#    `papeles` = ITV de importación, impuesto de matriculación, tasas de la DGT y
#    placas: 2-3 semanas con gestoría. **No retrasa la venta**: el coche se puede
#    entregar al cliente con placas temporales y la gestoría termina los papeles.
#    Se deja registrado por si algún día hay que modelar un comprador que exija
#    la matriculación hecha (entonces se pasa `papeles=2.5` y se activa el
#    bloqueo). Antes del 12/10/2026 el modelo usaba 3 semanas fijas.
#    El viaje de compra no es de 5-6 días: se sale de mañana, se revisan coches
#    todo el día y ese mismo día se emprende la vuelta — 3 días como máximo.
#    En una rejilla semanal eso es lo mismo que `lead` = 1,0; por eso el modelo
#    se queda con 1 semana (el máximo declarado) y no con 0,5.
# ---------------------------------------------------------------------------
LEAD_SEMANAS = 1.0
PAPELES_SEMANAS = 0.0


def estrategia(nombre, nave, coches, reforma_a, reforma_b, **kw):
    return dict(
        nombre=nombre, nave=nave, coches=list(coches), reforma_a=reforma_a,
        reforma_b=reforma_b, reforma_b_mes=kw.pop("reforma_b_mes", 4),
        # Meses de gastos fijos EXTRA que tienen que sobrar por encima del fondo
        # antes de pagar la obra aplazada. Con 0 se paga en cuanto la caja cubre
        # el fondo; con 2, sólo si además sobran dos meses de gastos.
        reforma_margen=kw.pop("reforma_margen", 0.0),
        # Tramo de reforma que exige la nave vacía (p. ej. el suelo epoxi): se paga
        # en el primer mes en que la flota ≤ suelo_max_flota y la caja lo aguanta.
        # Con 0 no hay tramo (comportamiento anterior).
        reforma_suelo=kw.pop("reforma_suelo", 0.0),
        suelo_max_flota=kw.pop("suelo_max_flota", 10 ** 9),
        nave_desde_mes=kw.pop("nave_desde_mes", None),
        floor_meses=kw.pop("floor_meses", 3.0), reta=kw.pop("reta", g.RETA),
        constitucion=kw.pop("constitucion", CONSTITUCION_SL),
        licencia=kw.pop("licencia", LICENCIA),
        demanda=kw.pop("demanda", 1.0), dias=kw.pop("dias", 1.0),
        politica=kw.pop("politica", "plan"),
        objetivo_flota=kw.pop("objetivo_flota", None),
        tope_modelo=kw.pop("tope_modelo", 1),
        independiente=kw.pop("independiente", True),
        arranque_meses=kw.pop("arranque_meses", 6),
        arranque_dias_max=kw.pop("arranque_dias_max", 35),
        arranque_eficiencia=kw.pop("arranque_eficiencia", 200.0),
        dias_unidad=kw.pop("dias_unidad", None),
        rampa=kw.pop("rampa", 1.0),
        lead=kw.pop("lead", LEAD_SEMANAS),
        papeles=kw.pop("papeles", PAPELES_SEMANAS),
        nave_destino=kw.pop("nave_destino", None),
        nave_destino_mes=kw.pop("nave_destino_mes", 0),
        # Coste de la mudanza (transporte de lo que no se conduce, rótulos,
        # alta de suministros, tiempo perdido). El modelo ya cobraba el cambio
        # de fianza y la licencia nueva; esto es lo de fuera del contrato.
        muda=kw.pop("muda", 0.0),
        # Coste mensual de personal CONTRATADO (no la nómina de la familia, que
        # va aparte). A partir de ~16 coches en stock el dueño no llega solo:
        # hace falta alguien en la nave y alguien que venda y prepare. Se
        # contrata cuando el volumen lo pide, no el día 1.
        personal=kw.pop("personal", 0.0),
        personal_desde=kw.pop("personal_desde", 1),
        # Reforma que se hace EN LA NAVE DE DESTINO al mudarse (si la nave de
        # paso se arregló sólo con cosas que viajan, aquí va el resto).
        reforma_destino=kw.pop("reforma_destino", 0.0),
        **kw,
    )


ESTRATEGIAS = {
    "plan_actual": estrategia(
        "Plan actual: O Milladoiro, reforma completa, 3 coches",
        NAVES["milladoiro"], ["GTI", "GTI", "116d"], REFORMA_A, REFORMA_B,
        reforma_b_mes=2, tope_modelo=2,
    ),
    "milladoiro_fases": estrategia(
        "O Milladoiro, reforma por fases, 3 coches de rotación",
        NAVES["milladoiro"], ["116d", "A3", "GTI"], REFORMA_A, REFORMA_B,
        reforma_b_mes=7, tope_modelo=2,
    ),
    "pequena": estrategia(
        "Nave 220 m² a 600 €, reforma mínima, 3 coches de rotación",
        NAVES["pequena"], ["116d", "A3", "GTI"], REFORMA_PEQ_A, REFORMA_PEQ_B,
        reforma_b_mes=5,
    ),
    "pequena_2": estrategia(
        "Nave 220 m² a 600 €, reforma mínima, 2 coches",
        NAVES["pequena"], ["116d", "A3"], REFORMA_PEQ_A, REFORMA_PEQ_B,
        reforma_b_mes=7,
    ),
    "sin_nave": estrategia(
        "Sin nave al principio, abrir local en el mes 10",
        NAVES["sin_nave"], ["116d", "A3", "GTI"], 0.0, 0.0,
        nave_desde_mes=10, constitucion=0.0, licencia=LICENCIA,
        reta=195.50,        # tarifa plana + gestoría de autónomo (docs/03, Fase 1.5)
        demanda=1.0, dias=1.0,
    ),
    "pequena_luego_milladoiro": estrategia(
        "Nave 220 m² y mudanza a O Milladoiro cuando haga falta",
        NAVES["pequena"], ["116d", "A3", "GTI"], REFORMA_PEQ_A, REFORMA_PEQ_B,
        reforma_b_mes=5, nave_destino=NAVES["milladoiro"], nave_destino_mes=15,
        tope_modelo=2,          # ya con sitio: 2 unidades del mismo modelo como máximo
    ),
    "decision": estrategia(
        "DECISIÓN: O Milladoiro sin obra, reforma cuando la caja la aguante",
        NAVES["milladoiro"], ["116d", "A3", "GTI"], 0.0, g.REFORM,
        reforma_b_mes=4, reforma_margen=2.0, tope_modelo=2,
    ),
    "milladoiro_sin_reforma": estrategia(
        "O Milladoiro, SIN reforma, 3 coches de rotación",
        NAVES["milladoiro"], ["116d", "A3", "GTI"], 0.0, 0.0, tope_modelo=2,
    ),
    "san_marcos": estrategia(
        "San Marcos 550 m² a 1.100 €, SIN reforma, 3 coches de rotación",
        NAVES["san_marcos"], ["116d", "A3", "GTI"], 0.0, 0.0, tope_modelo=2,
    ),
    "pequena_sin_reforma": estrategia(
        "Nave 220 m² a 600 €, SIN reforma, 3 coches de rotación",
        NAVES["pequena"], ["116d", "A3", "GTI"], 0.0, 0.0,
    ),
    "milladoiro_2": estrategia(
        "O Milladoiro, reforma completa, 2 coches",
        NAVES["milladoiro"], ["116d", "A3"], REFORMA_A, REFORMA_B,
        reforma_b_mes=2, tope_modelo=2,
    ),
}


# ---------------------------------------------------------------------------
# 4. Motor
# ---------------------------------------------------------------------------
def _poisson(rng, lam):
    if lam <= 0:
        return 0
    if lam > 25:
        return max(0, int(rng.gauss(lam, math.sqrt(lam)) + 0.5))
    limite, k, prod = math.exp(-lam), 0, rng.random()
    while prod > limite:
        k += 1
        prod *= rng.random()
    return k


def _tipo_impuesto(resultado, anio, usados, ventas_previas=0):
    """Tipo del Impuesto sobre Sociedades (LIS), corregido el 16/10/2026.

    Reglas que aplican a esta SL (art. 9.8 y 101 LIS):

      · 15 % (entidad de nueva creación): SOLO el primer ejercicio en que la
        base imponible es positiva. El segundo ejercicio NO sigue al 15 %:
        solo se extiende a ejercicios siguientes si la entidad mantiene CIE
        y facturación < 1 M€ (art. 103.4 LIS). Con la trayectoria del plan
        (año 2 ~1,5 M€ de cobros) ese requisito no se cumple.

      · Reducida dimensión (art. 101 LIS): requiere haber importado < 1 M€
        en el ejercicio ANTERIOR. Si se supera, todo el ejercicio tributa al
        25 % general — no hay tramo mixto.

      · "Micropyme" (17 % hasta 50k / 20 % resto, art. 101.uno LIS): exige
        importar < 1 M€ en el ejercicio ANTERIOR Y < 1 M€ en el corriente.
        Año 3 con año 2 > 1 M€ -> NO es micropyme: 25 %.

    `ventas_previas` = cobros brutos (cifra de negocios) del ejercicio
    anterior; `usados` = unidades vendidas hasta hoy (proxy de CIE).
    """
    if resultado <= 0:
        return 0.0
    if anio == 1 and usados > 0:
        return r2(resultado * 0.15)          # primer ejercicio con beneficio
    if ventas_previas < 1_000_000.0 and usados > 0:
        return g.micro_tax(resultado)        # micropyme: cumple ambos requisitos
    return r2(resultado * 0.25)              # régimen general


def simular(est, rng):
    """Una trayectoria de 36 meses. Semana a semana, como pasa de verdad."""
    con_nave = est["nave"]["m2"] > 0 and est["nave_desde_mes"] is None
    nave = est["nave"] if con_nave else None
    objetivo = est["nave"] if est["nave_desde_mes"] else None
    f_dias = est["dias"]
    f_dem = est["demanda"]

    def dias_de(nick):
        """Días de venta del modelo según el escenario de velocidad."""
        if est.get("dias_unidad"):
            return est["dias_unidad"].get(nick, UNIDADES[nick]["dias"])
        return UNIDADES[nick]["dias"]
    penal_dem, penal_dias = (PENAL_SIN_NAVE["demanda"], PENAL_SIN_NAVE["dias"]) if nave is None else (1.0, 1.0)

    def personal_mes(mes):
        """Coste de la nómina de la socia-empleada. Soporta un 2º tramo:
        desde `personal_sube` (mes) pasa a cobrar `personal_sube_imp`."""
        if mes < est["personal_desde"]:
            return 0.0
        if est.get("personal_sube") and mes >= est["personal_sube"]:
            return est.get("personal_sube_imp", est["personal"])
        return est["personal"]

    def fijos(nv):
        p = personal_mes(mes_actual[0])
        if nv is None:
            base = NAVES["sin_nave"]
            return r2(est["reta"] + g.MKT + base["rent"] + base["net"] + p)
        return r2(est["reta"] + g.MKT + nv["rent"] + nv["util"] + nv["net"]
                  + nv["seguro"] + nv["tasas"] + p)

    def plazas():
        tope = (nave or NAVES["sin_nave"])["plazas"]
        return min(tope, est["objetivo_flota"]) if est["objetivo_flota"] else tope

    mes_actual = [1]

    # --- día 1 -------------------------------------------------------------
    caja = 50000.0
    mov_dia1 = [("Kit de equipo y revisión", -g.KIT)]
    caja = r2(caja - g.KIT)
    if est["constitucion"]:
        mov_dia1.append(("Constitución de la sociedad", -est["constitucion"]))
        caja = r2(caja - est["constitucion"])
    if nave is not None:
        mov_dia1.append((f"Fianza de {nave['nombre']}, 2 mensualidades", -2 * nave["rent"]))
        caja = r2(caja - 2 * nave["rent"])
        mov_dia1.append(("Licencia de apertura y técnico", -est["licencia"]))
        caja = r2(caja - est["licencia"])
    reforma_pend = r2(est["reforma_a"] + est["reforma_b"])
    if nave is not None and reforma_pend:
        pago = min(reforma_pend, est["reforma_a"])
        mov_dia1.append(("Reforma, fase 1 (lo que hace falta para abrir)", -pago))
        caja = r2(caja - pago)
        reforma_pend = r2(reforma_pend - pago)
    listos, en_camino = [], []
    for nick in est["coches"]:
        caja = r2(caja - UNIDADES[nick]["coste"])
        mov_dia1.append((UNIDADES[nick]["nombre"], -UNIDADES[nick]["coste"]))
        en_camino.append(dict(nick=nick, dia=1 + est["lead"], compra=1, averia=rng.random() > 0.90))
    # Suelo (y lo que exija la nave vacía): se paga en el arranque, que es el único
    # momento en que la nave está vacía y se puede pintar todo el suelo. Si la flota
    # inicial ya supera el umbral, no se puede hacer aquí y se deja pendiente.
    # (floor() aún no está definido aquí: en el día 1 no hay reserva de impuesto ni
    # sueldo apartado, así que el fondo es simplemente meses de gastos fijos.)
    _flota_d1 = len(en_camino)
    _meses_d1 = est["floor_meses"] if _flota_d1 >= plazas() else 1.0
    if (nave is not None and est.get("reforma_suelo", 0.0) > 0
            and _flota_d1 <= est.get("suelo_max_flota", 10 ** 9)
            and caja - est["reforma_suelo"] + 1e-6 >= r2(_meses_d1 * fijos(nave))):
        caja = r2(caja - est["reforma_suelo"])
        mov_dia1.append(("Suelo, con la nave vacía (tramo urgente de la obra)", -est["reforma_suelo"]))
        reforma_suelo_mes = 1
    caja = r2(caja - fijos(nave))
    mov_dia1.append(("Gastos fijos del mes 1", -fijos(nave)))
    fijo_anio = fijos(nave)

    # --- estado ------------------------------------------------------------
    meses = []
    insolvente = None
    neto_anio = sueldo_anio = averia_anio = 0.0
    cobro_anio = 0.0
    impuesto = {1: 0.0, 2: 0.0, 3: 0.0}
    pagado = 0.0
    cobro_anio_prev = 0.0   # cifra de negocios del ejercicio anterior (regla 1 M€ LIS)
    dividendos_total = [0.0]
    dividendos_anio = {1: 0.0, 2: 0.0, 3: 0.0}
    reducidos = 0
    usados = 0
    averia_total = [0.0]
    ciclos = []
    detalle_ventas = []
    # Detalle por mes (para el mes a mes): qué se compró y qué se vendió.
    compras_mes = {m: [] for m in range(1, MESES + 1)}
    ventas_det_mes = {m: [] for m in range(1, MESES + 1)}
    # Gastos puntuales por mes (averías, obra, IS, dividendos) para cuadrar el flujo.
    averias_mes = {m: 0.0 for m in range(1, MESES + 1)}
    obra_mes = {m: 0.0 for m in range(1, MESES + 1)}
    is_mes = {m: 0.0 for m in range(1, MESES + 1)}
    div_mes = {m: 0.0 for m in range(1, MESES + 1)}
    rebu_mes = {m: 0.0 for m in range(1, MESES + 1)}
    reforma_pagada_mes = None
    reforma_suelo_mes = None
    nave_mes = None if nave is None else 1
    coches_comprados = len(est["coches"])
    ventas_total = 0
    mes_prev = 1

    def reserva_impuesto():
        """Lo que hay que apartar para el impuesto del año en curso.

        CORREGIDO 16/10/2026: la base imponible se estima como el resultado
        contable del año (márgenes netos − fijos − sueldos − averías − kit),
        NO sobre el margen bruto. Apartar el 15-25 % del margen bruto sin
        restar los gastos deducibles inflaba la reserva y asfixiaba la caja
        de forma artificial. Se descuenta además lo ya apartado/pagado por
        el mismo concepto, para no reservar dos veces el mismo impuesto.
        """
        res = r2(neto_anio - fijo_anio - sueldo_anio - averia_anio
                 - (g.KIT if neto_anio or fijo_anio else 0.0))
        m = mes_actual[0]
        anio = 1 if m <= 12 else 2 if m <= 24 else 3
        cuota = _tipo_impuesto(max(0.0, res), anio, usados, cobro_anio_prev)
        return r2(max(0.0, cuota - is_mes[m]))

    def floor_sueldo():
        """Lo que no se toca para pagar la nómina: el fondo de meses de gastos."""
        return r2(est["floor_meses"] * fijos(nave))

    def floor():
        """Lo que no se toca para comprar.

        Dos reglas, como en la vida real: si la flota está por debajo del stock
        de trabajo, se compra aunque la caja baje (nunca por debajo de un mes de
        gastos: el negocio no puede quedarse sin coches que vender). Si ya está
        en el objetivo, se compra sólo con lo que sobra por encima del fondo de
        tres meses.

        Con la política «familia», el sueldo del mes se aparta antes de comprar:
        la nómina no compite con la reinversión.
        """
        flota = len(listos) + len(en_camino)
        meses = est["floor_meses"] if flota >= plazas() else 1.0
        extra = 0.0
        if est.get("politica") in ("sueldo_primero", "familia") and mes_actual[0] >= 6:
            extra = p.FAM(mes_actual[0])
        return r2(meses * fijos(nave) + reserva_impuesto() + extra)

    min_caja = [float("inf"), None]
    ventas_mes = {m: 0 for m in range(1, MESES + 1)}
    cobro_mes = {m: 0.0 for m in range(1, MESES + 1)}
    sueldo_mes = {m: 0.0 for m in range(1, MESES + 1)}

    for w in range(1, int(MESES * SEM_MES) + 1):
        mes = int(w / SEM_MES) + 1
        if mes > MESES:
            break
        mes_actual[0] = mes
        anio = 1 if mes <= 12 else 2 if mes <= 24 else 3
        arranque_mes = mes != mes_prev
        if arranque_mes:
            mes_prev = mes

        # --- primer día del mes -------------------------------------------
        if arranque_mes:
            if (est["nave_destino"] is not None and mes >= est["nave_destino_mes"]
                    and nave is not None and nave is not est["nave_destino"]
                    and len(listos) + len(en_camino) >= plazas()):
                destino = est["nave_destino"]
                entra = r2(2 * destino["rent"] + est["licencia"] + est["muda"]
                           + est["reforma_destino"])
                sale = r2(2 * nave["rent"])  # la fianza vieja se recupera
                if caja - entra + sale + 1e-6 >= est["floor_meses"] * fijos(destino):
                    caja = r2(caja - entra + sale)
                    nave = destino
                    nave_mes = mes
            if objetivo is not None and nave is None and mes >= est["nave_desde_mes"]:
                abre = r2(2 * objetivo["rent"] + est["licencia"] + est["reforma_a"])
                if caja - abre + 1e-6 >= est["floor_meses"] * fijos(objetivo):
                    caja = r2(caja - 2 * objetivo["rent"] - est["licencia"] - est["reforma_a"])
                    nave = objetivo
                    nave_mes = mes
                    reforma_pend = est["reforma_b"]
            # La obra aplazada no se paga en una fecha fija: se paga en el primer
            # mes en que, además de cubrir el fondo, sobran `reforma_margen`
            # meses de gastos fijos. Si un mes no llega, se reintenta al
            # siguiente en lugar de quedarse pendiente para siempre.
            if nave is not None and mes >= est["reforma_b_mes"] and reforma_pend > 0:
                margen = est["reforma_margen"] * fijos(nave)
                if caja - reforma_pend - margen + 1e-6 >= floor():
                    _obra = r2(reforma_pend)
                    caja = r2(caja - _obra)
                    reforma_pend = 0.0
                    reforma_pagada_mes = mes
                    obra_mes[mes] = r2(obra_mes[mes] + _obra)
            caja = r2(caja - fijos(nave))
            fijo_anio = r2(fijo_anio + fijos(nave))
            if mes == 19 and impuesto[1]:
                caja = r2(caja - impuesto[1])
                pagado = r2(pagado + impuesto[1])
                is_mes[mes] = r2(is_mes[mes] + impuesto[1])
            elif mes == 31 and impuesto[2]:
                caja = r2(caja - impuesto[2])
                pagado = r2(pagado + impuesto[2])
                is_mes[mes] = r2(is_mes[mes] + impuesto[2])

        # --- sueldo --------------------------------------------------------
        if mes >= 6 and arranque_mes:
            quiere = p.FAM(mes)
            hueco = r2(caja - floor_sueldo())
            if hueco + 1e-6 >= quiere:
                caja = r2(caja - quiere)
                sueldo_mes[mes] = r2(sueldo_mes[mes] + quiere)
                sueldo_anio = r2(sueldo_anio + quiere)
            elif hueco > 0:
                caja = r2(caja - hueco)
                sueldo_mes[mes] = r2(sueldo_mes[mes] + hueco)
                sueldo_anio = r2(sueldo_anio + hueco)
                reducidos += 1

        # --- llega el coche, se revisa y se anuncia ------------------------
        for v in list(en_camino):
            if w >= v["dia"]:
                en_camino.remove(v)
                u = UNIDADES[v["nick"]]
                if v["averia"]:
                    gasto = r2(min(2600.0, max(600.0, rng.lognormvariate(math.log(1100), 0.45))))
                    caja = r2(caja - gasto)
                    averia_anio = r2(averia_anio + gasto)
                    averia_total[0] = r2(averia_total[0] + gasto)
                    averias_mes[mes] = r2(averias_mes[mes] + gasto)
                # Se anuncia el día que llega y la venta no espera a la
                # matriculación: el cliente se lo lleva con placas temporales.
                # Cada coche vende a su ritmo, pero ese ritmo lo modulan la
                # estacionalidad (agosto cuesta más; enero y marzo, menos), la
                # rampa del negocio (un negocio nuevo sin reseñas tarda más en
                # cada unidad) y el escenario de demanda.
                _ritmo = 1.0
                if sin_cuota:
                    _ritmo = (max(0.5, ESTAC[(mes - 1) % 12]) * f_dem * penal_dem
                              * est["rampa"] * rampa(mes))
                v["due"] = w + max(2.0, rng.expovariate(1.0 / (dias_de(v["nick"]) * f_dias * penal_dias / _ritmo)) / 7.0)
                if est.get("papeles"):
                    v["due"] = max(v["due"], v["compra"] + est["papeles"])
                listos.append(v)

        # --- cuota de demanda del mes --------------------------------------
        # Con `independiente` (escenario de venta rápida) cada coche vende a su
        # propio ritmo: no compite por una cuota mensual con otro coche distinto.
        # Lo único que compite es un coche con otro IGUAL, y eso se limita con
        # `tope_modelo` (por defecto 1 unidad del mismo modelo en stock).
        sin_cuota = est.get("independiente")
        if not sin_cuota and (arranque_mes or w == 1):
            cuota = {
                nick: _poisson(rng, u["techo"] * ESTAC[(mes - 1) % 12] * f_dem * penal_dem * est["rampa"] * rampa(mes))
                for nick, u in UNIDADES.items()
            }
        # --- ventas --------------------------------------------------------
        for v in sorted(listos, key=lambda x: x["due"]):
            if v not in listos:
                continue
            if not sin_cuota and cuota.get(v["nick"], 0) <= 0:
                continue
            if w < v["due"]:
                continue
            u = UNIDADES[v["nick"]]
            if not sin_cuota:
                cuota[v["nick"]] -= 1
            caja = r2(caja + u["venta"] - u["rebu"])
            neto_anio = r2(neto_anio + u["neto"])
            cobro_anio = r2(cobro_anio + u["venta"])
            cobro_mes[mes] = r2(cobro_mes[mes] + u["venta"])
            rebu_mes[mes] = r2(rebu_mes[mes] + u["rebu"])
            _vendido = True
            ventas_mes[mes] += 1
            ventas_total += 1
            usados += 1
            ciclos.append((w - v["compra"]) * 7.0)
            detalle_ventas.append((v["nick"], (w - v["compra"]) * 7.0))
            ventas_det_mes[mes].append((v["nick"], u["venta"], u["neto"]))
            listos.remove(v)

        # --- compras: el que produce más € netos por día ocupando plaza -----
        # La nave tiene un número fijo de plazas (stock, no showroom): el
        # objetivo es maximizar el beneficio que cada plaza produce al mes.
        # La métrica es el MARGEN NETO POR DÍA (neto / días que el coche pasa
        # de camino y en stock), que es la regla de un dealer de stock:
        #   - Preemia la rotación rápida (Golf, León, Polo) porque su neto
        #     se recicla más veces al año.
        #   - Pero NO descarta el premium de margen alto (XC60, 330d, X1):
        #     tarda 2 semanas más, pero su neto por día (95-111 €) iguala o
        #     supera al de los pequeños, y aporta 5.000-6.500 € de beneficio
        #     por coche y la variedad que un negocio real necesita.
        # El ROI por € inmovilizado (métrica anterior) premiaba solo el coche
        # barato+rápido y dejaba la flota en 3 modelos; margen/día da la
        # variedad de un dealer real (8-10 modelos en 24 plazas).
        # `cupos` (plan de cartera): {nick: unidades a mantener}. Si existe,
        # es el límite por modelo (sustituye a tope_modelo) y la flota completa
        # tiene EXACTAMENTE la mezcla planificada: 11 pequeños rápidos + 9 SUV/
        # compactos + 4 premium de margen alto = 24. El dealer compra siempre
        # el coche más eficiente (ROI) entre los que aún no llegan a su cupo.
        cupos = est.get("cupos")
        while len(listos) + len(en_camino) < plazas():
            libre = r2(caja - floor())
            mejor, mejor_mdia = None, 0.0
            for nick, u in UNIDADES.items():
                cola = 1 + sum(1 for x in listos + en_camino if x["nick"] == nick)
                if cupos is not None:
                    if cola > cupos.get(nick, 0):
                        continue
                elif est.get("tope_modelo") and cola > est["tope_modelo"]:
                    continue
                # Al arrancar sólo entra rotación rápida **o** un margen que pague
                # la espera: el capital no puede quedarse dormido en un coche de
                # nicho, pero el GTI (45 días y 38 % de margen) sí entra, porque
                # rinde 219 €/mes por cada 1.000 € inmovilizados.
                if mes <= est.get("arranque_meses", 0):
                    ciclo = 7 + dias_de(nick)
                    eficiencia = u["neto"] / (u["coste"] * ciclo / 30.0) * 1000.0
                    if (dias_de(nick) > est.get("arranque_dias_max", 10 ** 9)
                            and eficiencia < est.get("arranque_eficiencia", 0.0)):
                        continue
                espera = (dias_de(nick) * f_dias * penal_dias
                          / max(0.4, f_dem * penal_dem * est["rampa"] * rampa(mes)))
                if not est.get("independiente"):
                    espera = max(espera,
                                 cola / max(0.30, u["techo"] * f_dem * penal_dem * est["rampa"] * rampa(mes)) * 30.0)
                ciclo = est["lead"] * 7.0 + espera
                # Métrica de compra (ver comentario del bloque):
                #   "mdia"  -> margen neto por día (dealer de stock; preemia
                #              variedad + premium de alto margen).
                #   "roi"   -> retorno por € inmovilizado por mes (máx. caja).
                #   "blend" -> roi (máx. caja, objetivo de la pareja) + un
                #              bono por MARGEN ABSOLUTO (kappa·neto/CREF):
                #              los coches de margen alto (XC60, 330d) entran
                #              aunque giren algo más lento, sin sacrificar la
                #              caja del núcleo rápido.
                # Con `cupos` (plan de cartera) se ordena SIEMPRE por ROI: la
                # mezcla ya está fijada por los cupos, y dentro de ella se
                # compra el que mejor rinde el capital.
                metrica = "roi" if cupos is not None else est.get("metrica", "mdia")
                if metrica == "roi":
                    punt = u["neto"] / (u["coste"] * ciclo / 30.0)
                elif metrica == "blend":
                    kappa = est.get("blend_kappa", 0.0)
                    punt = (u["neto"] / (u["coste"] * ciclo / 30.0)
                            + kappa * u["neto"] / 14000.0)
                else:
                    punt = u["neto"] / ciclo
                if u["coste"] <= libre + 1e-6 and punt > mejor_mdia:
                    mejor, mejor_mdia = nick, punt
            if mejor is None:
                break
            u = UNIDADES[mejor]
            caja = r2(caja - u["coste"])
            coches_comprados += 1
            compras_mes[mes].append((mejor, u["coste"]))
            en_camino.append(dict(nick=mejor, dia=w + est["lead"], compra=w,
                                  averia=rng.random() > 0.90))

        # --- cierre del mes -------------------------------------------------
        ultimo = int((w + 1) / SEM_MES) + 1 != mes
        if ultimo:
            # Plan de caja a casa: a fin de ejercicio se reparte en dividendos
            # lo que sobra por encima del fondo, PERO SOLO DESPUÉS DE PAGAR el
            # IS devengado por ese ejercicio (235/236 LIS: sin pago del impuesto
            # no hay beneficio distribuible; repartir sin él sería una devolución
            # de aportaciones encubierta y la caja quedaría insuficiente).
            # CORREGIDO 16/10/2026: antes se repartía ignorando el IS pendiente
            # (en la trayectoria representativa, dividendo de 382.811 € con el
            # IS del año 3 —100.647 €— sin pagar y sin caja para pagarlo).
            # Además el reparto queda CAPADO por los resultados contables del
            # ejercicio (neto_anio − fijos − sueldos − averías − kit), porque
            # una SL solo puede repartir beneficios, no la caja que financió
            # el stock (reserva por plusvalías latentes, art. 19.4 LIS).
            if est.get("dividendos") and mes in (12, 24, MESES):
                _res_ej = r2(neto_anio - fijo_anio - sueldo_anio - averia_anio
                             - (g.KIT if anio == 1 else 0.0))
                cuota = _tipo_impuesto(max(0.0, _res_ej), anio, usados, cobro_anio_prev)
                impuesto[anio] = cuota
                if cuota > 0:   # el IS del ejercicio se paga antes de repartir
                    caja = r2(caja - cuota)
                    pagado = r2(pagado + cuota)
                    is_mes[mes] = r2(is_mes[mes] + cuota)
                distrib_beneficio = max(0.0, _res_ej - cuota)
                div = r2(min(distrib_beneficio,
                             max(0.0, caja - est["floor_meses"] * fijos(nave))))
                if div > 0:
                    caja = r2(caja - div)
                    dividendos_total[0] = r2(dividendos_total[0] + div)
                    dividendos_anio[anio] = r2(dividendos_anio[anio] + div)
                    div_mes[mes] = r2(div_mes[mes] + div)
            flota = [UNIDADES[v["nick"]]["coste"] for v in listos + en_camino]
            # Stock por modelo a fin de mes (lo que hay en la nave + de camino):
            # {nick: unidades}. El PDF lo usa para la línea "STOCK" siempre visible.
            stock_mix = {}
            for v in listos + en_camino:
                stock_mix[v["nick"]] = stock_mix.get(v["nick"], 0) + 1
            meses.append(dict(
                mes=mes, caja=caja, ventas=ventas_mes[mes], cobro=cobro_mes[mes],
                flota=len(flota), flota_coste=r2(sum(flota)),
                sueldo=sueldo_mes[mes], fijos=fijos(nave), floor=floor(),
                reforma_pend=reforma_pend, nave=bool(nave),
                patrimonio=r2(caja + sum(flota)),
                compras=list(compras_mes[mes]), ventas_det=list(ventas_det_mes[mes]),
                stock_mix=dict(stock_mix),
                averias=averias_mes[mes], obra=obra_mes[mes],
                is_paid=is_mes[mes], div=div_mes[mes], rebu=rebu_mes[mes],
            ))
            if anio == 1 and mes == 12:
                res = r2(neto_anio - fijo_anio - sueldo_anio - averia_anio - g.KIT)
                # Si el reparto de dividendos ya liquidó y pagó el IS del año,
                # no se vuelve a devengar (y si no hubo reparto, se devenga aquí
                # para la reserva; el pago real sale en mayo del año siguiente).
                if not est.get("dividendos"):
                    impuesto[1] = _tipo_impuesto(res, 1, usados, cobro_anio_prev)
                cobro_anio_prev = cobro_anio
            if anio == 2 and mes == 24:
                res = r2(neto_anio - fijo_anio - sueldo_anio - averia_anio)
                if not est.get("dividendos"):
                    impuesto[2] = _tipo_impuesto(res, 2, usados, cobro_anio_prev)
                cobro_anio_prev = cobro_anio
            if anio == 3 and mes == MESES:
                res = r2(neto_anio - fijo_anio - sueldo_anio - averia_anio)
                if not est.get("dividendos"):
                    impuesto[3] = _tipo_impuesto(res, 3, usados, cobro_anio_prev)
            if anio == 1 and mes == 12:
                neto_anio = fijo_anio = sueldo_anio = averia_anio = cobro_anio = 0.0
            elif anio == 2 and mes == 24:
                neto_anio = fijo_anio = sueldo_anio = averia_anio = cobro_anio = 0.0

        if caja < min_caja[0]:
            min_caja[0], min_caja[1] = caja, mes
        if caja < 0 and insolvente is None:
            insolvente = mes

    # cierre del mes 36, si el bucle no llegó a registrarlo
    if not meses or meses[-1]["mes"] != MESES:
        flota = [UNIDADES[v["nick"]]["coste"] for v in listos + en_camino]
        res = r2(neto_anio - fijo_anio - sueldo_anio - averia_anio)
        impuesto[3] = _tipo_impuesto(res, 3, usados)
        meses.append(dict(
            mes=MESES, caja=caja, ventas=ventas_mes[MESES], cobro=cobro_mes[MESES],
            flota=len(flota), flota_coste=r2(sum(flota)), sueldo=sueldo_mes[MESES],
            fijos=fijos(nave), floor=floor(), reforma_pend=reforma_pend,
            nave=bool(nave), patrimonio=r2(caja + sum(flota)),
            compras=list(compras_mes[MESES]), ventas_det=list(ventas_det_mes[MESES]),
            averias=averias_mes[MESES], obra=obra_mes[MESES],
            is_paid=is_mes[MESES], div=div_mes[MESES], rebu=rebu_mes[MESES],
        ))

    coste_flota = r2(sum(UNIDADES[v["nick"]]["coste"] for v in listos + en_camino))
    return dict(
        meses=meses, insolvente=insolvente, caja=caja, flota=len(listos) + len(en_camino),
        coste_flota=coste_flota, ventas=ventas_total, impuesto3=impuesto[3],
        impuesto1=impuesto[1], impuesto2=impuesto[2],
        patrimonio=r2(caja + coste_flota - impuesto[3]),
        sueldos=r2(sum(m["sueldo"] for m in meses)), dividendos=dividendos_total[0],
        dividendos_anio=dividendos_anio, reducidos=reducidos,
        comprados=coches_comprados, pagado=pagado, nave_mes=nave_mes,
        reforma_mes=reforma_pagada_mes, reforma_suelo_mes=reforma_suelo_mes,
        reforma_pend=r2(reforma_pend),
        averias_total=r2(averia_total[0]),
        ciclo_medio=r2(sum(ciclos) / len(ciclos)) if ciclos else 0.0,
        detalle_ventas=detalle_ventas,
        min_caja=min_caja[0], min_caja_mes=min_caja[1],
    )


def montecarlo(est, sims=600, seed=7):
    datos = [simular(est, random.Random(seed * 100003 + i)) for i in range(sims)]

    def pct(clave, q):
        xs = sorted(d[clave] for d in datos)
        return xs[min(len(xs) - 1, int(q * len(xs)))]

    return dict(
        n=sims, datos=datos,
        caja=(pct("caja", 0.1), pct("caja", 0.5), pct("caja", 0.9)),
        patr=(pct("patrimonio", 0.1), pct("patrimonio", 0.5), pct("patrimonio", 0.9)),
        ventas=(pct("ventas", 0.1), pct("ventas", 0.5), pct("ventas", 0.9)),
        flota=pct("flota", 0.5), sueldos=pct("sueldos", 0.5),
        sin_caja=sum(1 for d in datos if d["insolvente"]) / sims,
        min_caja=pct("min_caja", 0.1),
        reducidos=sum(d["reducidos"] for d in datos) / sims,
        caja_p50=datos[0]["caja"],
    )


def mes_a_mes(est, sims=600, seed=7):
    """Mediana de cada mes, para la tabla del informe."""
    datos = [simular(est, random.Random(seed * 100003 + i)) for i in range(sims)]
    filas = []
    for i in range(MESES):
        def med(clave):
            xs = sorted(d["meses"][i][clave] for d in datos)
            return xs[len(xs) // 2]
        filas.append(dict(
            mes=i + 1, caja=med("caja"), ventas=med("ventas"), cobro=med("cobro"),
            flota=med("flota"), flota_coste=med("flota_coste"),
            sueldo=med("sueldo"), fijos=med("fijos"), floor=med("floor"),
            patrimonio=med("patrimonio"),
        ))
    return filas


def tabla_mes_a_mes(filas, titulo):
    print(f"\n{titulo}")
    cab = f"{'mes':>3} {'ventas':>7} {'entra €':>11} {'sueldo €':>10} {'coches':>7} {'flota €':>11} {'caja €':>11} {'fondo €':>10} {'patrim. €':>12}"
    print(cab)
    print("-" * len(cab))
    acum = 0
    for f in filas:
        acum += f["ventas"]
        print(f"{f['mes']:>3} {f['ventas']:>7} {eur(f['cobro'], False):>11} {eur(f['sueldo'], False):>10} "
              f"{f['flota']:>7} {eur(f['flota_coste'], False):>11} {eur(f['caja'], False):>11} "
              f"{eur(f['floor'], False):>10} {eur(f['patrimonio'], False):>12}")
    print(f"    {'total':>7} {sum(f['ventas'] for f in filas):>7} coches vendidos en 36 meses")


def comparar(sims, solo=None):
    print("=" * 132)
    print(f"COMPARATIVA DE ESTRATEGIAS · {sims} simulaciones por estrategia · 50.000 € propios, sin préstamo")
    print("=" * 132)
    cab = (f"{'estrategia':<52}{'coches':>13}{'caja m36 (P10-P50-P90)':>31}"
           f"{'patrimonio m36 (P10-P50-P90)':>33}{'sin caja':>9}{'recortes':>9}")
    print(cab)
    print("-" * len(cab))
    salida = {}
    for clave, est in ESTRATEGIAS.items():
        if solo and clave != solo:
            continue
        r = montecarlo(est, sims=sims)
        salida[clave] = r
        print(f"{est['nombre']:<52}"
              f"{r['ventas'][1]:>4} ({r['ventas'][0]}-{r['ventas'][2]})".rjust(13) +
              f"{r['caja'][1]:>11,.0f} ({r['caja'][0]:>8,.0f} - {r['caja'][2]:>8,.0f})".rjust(31) +
              f"{r['patr'][1]:>12,.0f} ({r['patr'][0]:>8,.0f} - {r['patr'][2]:>8,.0f})".rjust(33) +
              f"{100 * r['sin_caja']:>8.1f}%{r['reducidos']:>9.1f}")
    return salida


def trayectoria(est, sims=300, seed=31):
    """La simulación «central»: la que acaba en la mediana de patrimonio.

    Se enseña una trayectoria entera y coherente (no la mediana columna a
    columna, que mezcla simulaciones distintas y puede no cuadrar al sumarla).
    """
    rs = [simular(est, random.Random(seed * 7919 + i)) for i in range(sims)]
    objetivo = sorted(r["patrimonio"] for r in rs)[len(rs) // 2]
    return min(rs, key=lambda r: abs(r["patrimonio"] - objetivo))


def informe(est, sims=300):
    r = trayectoria(est, sims=sims)
    print(f"\n{est['nombre']}")
    print("Trayectoria central sobre", sims, "simulaciones ·", eur(50000, False), "propios, sin préstamo")
    cab = (f"{'mes':>3} {'ventas':>7} {'vendidas':>9} {'entra':>10} {'sueldo':>9} "
           f"{'flota':>6} {'caja':>10} {'fondo':>9} {'patrim.':>10}")
    print(cab)
    print("-" * len(cab))
    acum = 0
    for m in r["meses"]:
        acum += m["ventas"]
        print(f"{m['mes']:>3} {m['ventas']:>7} {acum:>7} {eur(m['cobro'], False):>10} "
              f"{eur(m['sueldo'], False):>9} {m['flota']:>6} {eur(m['caja'], False):>10} "
              f"{eur(m['floor'], False):>9} {eur(m['patrimonio'], False):>10}")
    por_anio = [sum(m["ventas"] for m in r["meses"][a:b]) for a, b in ((0, 12), (12, 24), (24, 36))]
    print(f"ventas por año: {por_anio} · vendidas {r['ventas']} · comprados {r['comprados']} · "
          f"flota final {r['flota']} · caja final {eur(r['caja'])} · patrimonio {eur(r['patrimonio'])}")
    print(f"sueldo bruto pagado {eur(r['sueldos'])} en 36 meses · meses con recorte {r['reducidos']} · "
          f"caja mínima {eur(r['min_caja'])} (mes {r['min_caja_mes']}) · nave desde el mes {r['nave_mes']}")
    print(f"averías graves pagadas {eur(r['averias_total'])} · impuesto del año 3 reservado {eur(r['impuesto3'])}")
    print(f"ciclo medio compra -> cobro: {r['ciclo_medio']:.0f} días (lead {est['lead']:.1f} semana(s) "
          f"+ los días de venta del modelo; la matriculación no retrasa el cobro)")
    print(f"patrimonio = caja + coches − impuesto del año 3 = {eur(r['caja'])} + {eur(r['coste_flota'])} − {eur(r['impuesto3'])} = {eur(r['patrimonio'])}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sims", type=int, default=600)
    ap.add_argument("--solo", default=None)
    ap.add_argument("--una", default=None, help="clave de estrategia: mes a mes en detalle")
    ap.add_argument("--lead", type=float, default=None,
                    help="semanas hasta tener el coche anunciado (por defecto 1,0)")
    ap.add_argument("--con-cola", action="store_true",
                    help="modelo antiguo: cuota mensual de demanda por modelo (los coches compiten)")
    ap.add_argument("--velocidad", default=None,
                    choices=["base", "mercado", "optimista", "media", "catalogo", "pesimista"],
                    help="días de venta: base/mercado 35-55, optimista 22-45, catalogo 18-25, pesimista 45-70")
    args = ap.parse_args()
    if args.con_cola:
        for _e in ESTRATEGIAS.values():
            _e["independiente"] = False
    if args.velocidad:
        _v = {"optimista": DIAS_OPTIMISTA, "media": DIAS_OPTIMISTA,
              "catalogo": DIAS_CATALOGO, "pesimista": DIAS_PESIMISTA}.get(args.velocidad)
        for _e in ESTRATEGIAS.values():
            _e["dias_unidad"] = _v
    if args.lead is not None:
        for _e in ESTRATEGIAS.values():
            _e["lead"] = args.lead
    if args.una:
        e = dict(ESTRATEGIAS[args.una])
        e["objetivo_flota"] = e["objetivo_flota"] or 7
        informe(e)
    else:
        comparar(args.sims, args.solo)

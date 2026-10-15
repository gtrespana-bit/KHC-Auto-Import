#!/usr/bin/env python3
"""PARÁMETROS DEL PLAN v2 — una sola pantalla para revisar TODO.

Todo lo que está aquí es un DATO, no una conclusión. Cambia el número y
vuelve a lanzar `python3 modelo_v2.py` para ver el efecto. Cada bloque dice
de dónde sale: [ERP] = tabla del ERP (verificada con fuente legal),
[MKT] = calculado en vivo sobre 7.333 anuncios alemanes y 4.460 españoles
capturados por el propio sistema (data/autoscout y data/milanuncios),
[TÚ] = dato que me tienes que confirmar tú.

Nada de este fichero reutiliza el diseño ni las plantillas del plan anterior
(plan-negocio/): es un modelo nuevo, más simple y con otras hipótesis.
"""

# ---------------------------------------------------------------------------
# 1. CAPITAL INICIAL [TÚ]
#    El plan viejo partía de 50.000 €. Aquí se modelan 3 escenarios.
# ---------------------------------------------------------------------------
CAPITAL_ESCENARIOS = [25_000.0, 40_000.0, 60_000.0]

# ---------------------------------------------------------------------------
# 2. COSTE FIJO POR COCHE PUESTO EN GALICIA Y LISTO PARA VENDER [ERP]
#    Fuente: erp/src/domain/rates.js (OPERATING_COSTS, DGT_FEES, ITV_GALICIA)
# ---------------------------------------------------------------------------
LOGISTICA_POR_COACHE = 730.0   # mixto: 1 coche bajando rodando + 2 en portacoches
IMPREVISTOS          = 300.0   # reserva mecánica (neumáticos, frenos, revisión)
ITV_IMPORTACION      = 132.59  # diésel + ficha técnica (tarifa Xunta 2026)
TASA_DGT             = 99.77   # matriculación ordinaria (tasa 1.1)
PLACAS               = 28.00   # juego de placas
TRADUCCION           = 45.00   # traducción jurada documentación alemana
COC                  = 120.00  # Certificado de Conformidad si no viene con el coche
PREPARE                = 180.0 # preparación y limpieza profesional
MANTENIMIENTO        = 150.0   # puesta a punto (aceite, filtros)
GARANTIA             = 450.0   # póliza de garantía externa por vehículo
ANUNCIOS             = 30.0    # portales (Coches.net / Wallapop Pro)
SEGURO_STOCK_MES     = 12.0    # seguro de stock, por vehículo y mes en exposición

# Suma "administrativa" fija por coche (independiente del modelo):
COSTE_ADMIN = (ITV_IMPORTACION + TASA_DGT + PLACAS + TRADUCCION + COC)  # ≈ 425 €

# IEDMT (impuesto de matriculación) por tramo CO2 — Ley 38/1992, Galicia [ERP]:
def iedmt(co2: float, base_imponible: float) -> float:
    if co2 <= 120: return 0.0
    if co2 <= 159: return base_imponible * 0.0475
    if co2 <= 199: return base_imponible * 0.0975
    return base_imponible * 0.1475

# ---------------------------------------------------------------------------
# 3. CATALOGO — precios REALES de los datos capturados por tu sistema [MKT]
#    compra  = mediana de anuncios alemanes (autoscout24.de / mobile.de)
#    venta   = mediana de anuncios españoles (milanuncios) menos 3 % de regateo
#    co2     = emisión típica de la versión más frecuente en el mercado DE
#    dias    = días medios hasta vender (hipótesis; el plan viejo usaba otra escala)
#    Bandas usadas: 2014-2019, 60.000-200.000 km. Muestra mínima exigida: 15.
#    (spread% = cuánto más caro se vende el mismo coche en España que en Alemania)
# ---------------------------------------------------------------------------
CATALOGO = [
    # nick            compra€  venta€  co2  dias  nDE nES spread%  descripción
    ("cla_c118",      20_890, 26_795, 114,  60,   9, 20, 28.3, "Mercedes CLA C118 180d (muestra pequeña)"),
    ("macan",         32_650, 39_900, 159,  75,  38, 19, 22.8, "Porsche Macan 2.0 diesel"),
    ("x4",            21_000, 23_950, 134,  65,  65, 42, 19.8, "BMW X4 F26 xDrive20d"),
    ("audi_a6",       16_999, 19_625, 139,  60, 167, 57, 18.9, "Audi A6 C7 3.0 TDI"),
    ("golf_gti",      11_999, 13_500, 140,  45,  77, 57, 17.4, "Golf VII GTI / 2.0 TSI"),
    ("clase_c",       17_500, 19_945, 119,  55,  85, 98, 16.0, "Mercedes Clase C W205 C220d"),
    ("serie_4_gc",    17_500, 19_999, 139,  60,  75,  7, 14.3, "BMW Serie 4 Gran Coupé F36"),
    ("clase_b",       19_400, 21_900, 119,  55,  35, 21, 12.9, "Mercedes Clase B W247"),
    ("q5",            19_985, 21_999, 139,  70, 134, 37, 10.5, "Audi Q5 8R 2.0 TDI"),
    ("glc",           23_990, 25_945, 134,  70, 222, 78,  8.1, "Mercedes GLC X253 220d"),
    ("xc90",          28_990, 25_990, 140,  90, 132, 34,-10.3, "Volvo XC90 II D5 (¡negativo!)"),
    ("landcruiser",   41_900, 39_450, 209,  80,  17, 63, -5.8, "Toyota Land Cruiser J150 (¡negativo!)"),
]

# Regla derivada de los datos: margen bruto objetivo por coche >= 2.500 €
# y spread DE→ES >= 12 %. Con esto entran solo 4 modelos de 11 probados.
UMBRAL_MARGEN_MINIMO = 2_500.0
UMBRAL_SPREAD_MINIMO = 12.0   # %

# ---------------------------------------------------------------------------
# 4. GASTOS FIJOS MENSUALES — estructura ligera [TÚ/ERP]
#    Diferencia clave con el plan viejo: NO se parte de nave de 1.200 €.
#    Fase 1 = parking/alquiler pequeño; la nave llega cuando el caja lo paga.
# ---------------------------------------------------------------------------
FIJO_FASE1 = {                    # sin nave abierta (mes 1..N)
    "autonomo_reta":   320.0,     # cuota RETA tramo intermedio (ajustable)
    "asesoria":        120.0,     # gestoría contable mensual
    "portales_base":   100.0,     # suscripción/anuncios de reposición
    "seguro_rc":        60.0,     # RC actividad + seguro provisional stock
    "movil_datos":      30.0,
    "varios":           70.0,
}
FIJO_FASE2_EXTRA = {              # + al abrir nave (se suma a Fase 1)
    "alquiler_nave":   600.0,     # [TÚ] 220 m² Sionlla/Castiñeiriño ~600 €/mes
    "utilities":       150.0,     # luz, agua, vado
}

# ---------------------------------------------------------------------------
# 5. IMPLICADOS FISCALES [ERP]
# ---------------------------------------------------------------------------
IVA_REBU = 0.21          # REBU: IVA 21 % SOLO sobre el margen (art.137 Ley 37/1992)
REGATEO  = 0.03          # 3 % de rebaja media en la venta (rates.js: rebajaVenta)
# Forma jurídica: autónomo (IRPF ahorro 19-30 %) vs SL (IS microempresa 19%/21%).
# El modelo corre ambos y compara.

# ---------------------------------------------------------------------------
# 6. HIPOTESIS DE ARRANQUE QUE NECESITO QUE CONFIRMES [TÚ]
# ---------------------------------------------------------------------------
PREGUNTAS_ABIERTAS = [
    "¿Capital disponible real: 25k, 40k o 60k €? ¿Otra cifra?",
    "¿Tráiler propio o siempre portacoches externalizado (750 €/coche)?",
    "¿La esposa/second persona cobra sueldo fuera del régimen de autónomos o es societaria?",
    "¿Nave Milladoiro 1.200 €/mes sigue en pie o se descarta para el año 1?",
    "¿Compras SIEMPRE a concesionario alemán (factura, sin ITP) o también particulares (+3% ITP)?",
]

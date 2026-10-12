#!/usr/bin/env python3
"""Datos cerrados de la nave de O Milladoiro, su reforma y el equipo.

Fuente única para los PDF sin financiación. Las cifras salen de:
- ANALISIS_NAVE_SANTIAGO_MILLADOIRO.md (ficha y distribución de la nave)
- REFORMA_FASE1_COMPLETA.md (materiales, precios con IVA y cronograma)
- 01_PRESUPUESTO_ARRANQUE_Y_ASIGNACION_CAPITAL.md (equipo de revisión)

La mano de obra de la reforma es propia: 0 €.
"""

from __future__ import annotations

from pathlib import Path

HERE = Path(__file__).resolve().parent
FOTOS = HERE / "nave santiago"

NAVE = {
    "nombre": "Nave O Milladoiro",
    "lugar": "Polígono de O Milladoiro, Ames (A Coruña)",
    "ref": "C1290",
    "alquiler": 1200.0,
    "m2": 465,
    "almacen_m2": 400,
    "oficinas_m2": 60,
    "patio_m2": 100,
    "patio_trasero_m2": 30,
    "altura_m": 8,
    "largo_m": 40,
    "ancho_m": 10,
}

NAVE_FICHA = [
    ("Superficie", "465 m²: 400 m² de almacén y 60 m² de oficinas"),
    ("Medidas del almacén", "40 m de largo × 10 m de ancho × 8 m de altura libre"),
    ("Oficinas", "Entreplanta, 4 despachos, acceso independiente"),
    ("Exterior", "Patio delantero de 100 m² y trasero de 30 m²"),
    ("Instalaciones", "Corriente trifásica, sistema BIES, cubierta aislada, aseos"),
    ("Ubicación", "Junto a la autopista, entre Santiago y A Coruña"),
    ("Alquiler", "1.200 € al mes"),
]

# Zonas de la planta baja y el exterior: (zona, m², uso, coches)
ZONAS = [
    ("Exposición interior", 200, "Venta, fotos y clientes", "8-10"),
    ("Detallado", 80, "Limpieza, pulido y cerámica", "2-3"),
    ("Taller técnico", 60, "Diagnosis y preparación ITV", "1"),
    ("Almacén logístico", 60, "Piezas y materiales", "—"),
    ("Patio delantero", 100, "Clientes, camión portacoches", "6-8"),
    ("Oficinas, entreplanta", 60, "Dirección, administración, firma", "—"),
]

# Reforma Fase 1. Cada partida con sus líneas exactas (IVA incluido).
REFORMA = [
    {
        "partida": "Suelo epoxi, 400 m²",
        "nota": "Dos manos sobre todo el almacén.",
        "lineas": [
            ("5 cubos MONTÓ Epoxi + catalizador 20 kg gris × 165 €", 825.00),
            ("Limpieza y desengrasante", 80.00),
        ],
    },
    {
        "partida": "Pintura de paredes y techos",
        "nota": "Retoque de 437 m² de 1.093 m², dos manos.",
        "lineas": [
            ("6 cubos MONTÓ Plástica blanca mate 15 L × 51 €", 306.00),
            ("Rodillos, brochas y bandejas", 60.00),
            ("Plástico, cinta, masilla y limpieza", 113.00),
        ],
    },
    {
        "partida": "Iluminación LED",
        "nota": "1 campana cada 28 m². Luz cálida en exposición.",
        "lineas": [
            ("15 campanas LED industriales CCT 200 W × 65 €", 975.00),
            ("Cable 2,5 mm², rollo de 100 m", 80.00),
            ("Canaletas", 45.00),
            ("Cajas de derivación", 25.00),
            ("Magnetotérmicos", 35.00),
            ("Enchufes industriales", 40.00),
            ("Tornillería, tacos y colgadores", 30.00),
        ],
    },
    {
        "partida": "Señalización y cartelería",
        "nota": "Fachada, logo interior, fichas y suelo.",
        "lineas": [
            ("Lona de fachada", 116.54),
            ("Lona lateral, logo y horario", 34.13),
            ("Logo KHC, vinilo de pared", 116.54),
            ("10 soportes de metacrilato para fichas", 120.00),
            ("Señalización de zonas y seguridad", 40.00),
            ("3 cintas de suelo 50 mm × 33 m × 7,35 €", 22.05),
            ("6 conos de 50 cm × 7,85 €", 47.10),
        ],
    },
    {
        "partida": "Mobiliario de oficina",
        "nota": "Despacho de dirección y archivo. El resto, más adelante.",
        "lineas": [
            ("Mesa de despacho 160 × 80", 180.00),
            ("Silla ergonómica", 150.00),
            ("Estantería archivadora", 90.00),
            ("Cajonera de 3 cajones", 65.00),
            ("2 estanterías metálicas de archivo", 120.00),
            ("Mesa auxiliar", 70.00),
            ("Perchero, 3 papeleras y 3 plantas", 125.00),
        ],
    },
    {
        "partida": "Seguridad",
        "nota": "Cámaras, alarma y luz exterior.",
        "lineas": [
            ("Kit ZOSI 8 canales 5MP, 8 cámaras", 214.99),
            ("Alarma inalámbrica con SIM", 150.00),
            ("2 focos LED con sensor", 50.00),
        ],
    },
    {
        "partida": "Limpieza, extintores y herramientas",
        "nota": "Lo que hace falta para abrir y trabajar.",
        "lineas": [
            ("Detergente CLEANER PRO, fregona plana, cubo", 90.12),
            ("Extintores y botiquín", 100.00),
            ("Material de oficina", 100.00),
            ("Herramientas de taller", 500.00),
        ],
    },
]


def _r2(n):
    return round(float(n) + 1e-9, 2)


for _p in REFORMA:
    _p["total"] = _r2(sum(a for _, a in _p["lineas"]))

REFORMA_TOTAL = _r2(sum(p["total"] for p in REFORMA))

# Cronograma, mano de obra propia: (días, trabajo)
CRONOGRAMA = [
    ("Días 1-2", "Limpieza industrial a fondo"),
    ("Días 3-4", "Pintura, primera y segunda mano"),
    ("Días 5-6", "Suelo epoxi, dos manos (12 h entre capas)"),
    ("Días 7-8", "15 campanas LED y cuadro"),
    ("Día 9", "Lonas, logo y señalización"),
    ("Día 10", "Montaje del mobiliario"),
    ("Día 11", "Cámaras, alarma y focos"),
    ("Días 12-13", "Extintores, material y limpieza final"),
    ("Día 14", "Apertura"),
]

# Equipo de revisión, antes de comprar el primer coche.
KIT_LINES = [
    ("Máquina de diagnosis Launch CRP919E BT", 368.40),
    ("Medidor de pintura GOYOJO CTG-2", 50.39),
    ("Arrancador de 12 V", 57.39),
    ("10 informes carVertical, IVA incluido", 145.08),
    ("Dos tapamatrículas con el logo", 36.06),
    ("Cinco carpetas con logo", 24.50),
    ("Tres llaveros grabados", 23.97),
    ("Kit de detallado", 26.32),
    ("Tratamiento nano cerámico", 25.79),
    ("SIM y WhatsApp Business, primer mes", 5.00),
    ("Consulta con el asesor, una sesión", 60.00),
]

# Lo que la nave ya trae equipado y no se compra.
YA_ESTA = [
    "Corriente trifásica",
    "Sistema BIES contra incendios",
    "Cubierta aislada con lucernarios",
    "Aseos con ducha",
    "Oficinas con falso techo y ventanas al almacén",
    "Portón de entrada de 5 × 5 m",
]

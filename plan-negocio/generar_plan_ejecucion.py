#!/usr/bin/env python3
"""Plan de ejecución paso a paso (SOLO lo decidido). O Milladoiro, 36 meses.

SL 50/50 (tú administrador + ella socia), sin obra al abrir, trío de arranque,
stock 24 plazas, ella socia desde el día 1 + empleada desde el mes 6, dividendos
50/50 a fin de año (se reparte el sobrante sobre el fondo de 3 meses).

Los resultados resumen salen de `plan_ejecucion.json` (calc_plan.py): mediana de 250
trayectorias del escenario decidido, CON reparto de dividendos a fin de año. El detalle
mensual sigue la trayectoria simulada cuya caja más se acerca a la mediana mes a mes.

Uso:  python3 calc_plan.py && python3 generar_plan_ejecucion.py
"""
from __future__ import annotations
import json
from pathlib import Path

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import Color, white
import datos_nave_milladoiro as nvm   # partidas de la reforma (fuente única)

HERE = Path(__file__).resolve().parent
OUT = HERE / "Plan_Ejecucion_Paso_a_Paso.pdf"
FOTOS = HERE / "fotos_reforma"         # renders de "así va a quedar" (ejemplo)
FOTO_H_W = 1200.0 / 1600.0            # ratio alto/ancho de los renders (4:3)

D = json.loads((HERE / "plan_ejecucion.json").read_text())
try:
    SENS = json.loads((HERE / "sensibilidad_rotacion.json").read_text())
except FileNotFoundError:
    SENS = None   # lámina de sensibilidad se omite si no está calculada
M = {int(k): v for k, v in D["mensual"].items()}   # mes -> [ventas, flota, caja]
DI = D["dia1"]            # día 1: [lab, mov, run]
for _k in ("sd", "se", "dv", "div_bruto", "is_anio"):  # años -> int
    D[_k] = {int(k): v for k, v in D[_k].items()}
CD = {int(k): v for k, v in D["compra_det"].items()}   # mes -> {n, eur, mix}
VD = {int(k): v for k, v in D["venta_det"].items()}    # mes -> {n, eur, neto, mix}
FJ = {int(k): v for k, v in D["fijos_m"].items()}      # mes -> fijos (mediana)
SU = {int(k): v for k, v in D["sueldo_m"].items()}     # mes -> sueldo dueño (mediana)
FIJOS_BASE = D["fijos_base_detalle"]
NOMINAS = D["nominas"]
# Trayectoria representativa: la sim cuya caja mes a mes mejor replica la mediana.
# Se usa en el mes a mes: el flujo cuadra al céntimo y la caja coincide con la mediana.
TRAY = D["tray"]    # lista de 36 dicts con ventas, compras, gastos y nóminas detalladas
OBRA = D["obra"]                # mes mediano en que se paga el RESTO de la obra
OBRA_SUELO = D["obra_suelo"]    # 1 (el suelo se paga en el día 1)
SUELO = 905.0
RESTO_OBRA = 4210.47
# Catálogo completo (15 modelos), del JSON. CAT[nick] = dict(nombre, coste, venta,
# dias, neto, margen_dia, pct). Se usa para mostrar SIEMPRE el precio unitario.
CAT = {c["nick"]: c for c in D["catalogo"]}
NOMBRE_MODELO = {n: c["nombre"] for n, c in CAT.items()}
SHORT = {"116d": "116d", "A3": "A3", "Golf VIII": "Golf VIII", "Leon": "León", "GTI": "GTI",
         "XC40": "XC40", "318d": "318d", "Mercedes": "Mercedes C", "Polo": "Polo",
         "Corolla": "Corolla", "3008": "3008", "Tiguan": "Tiguan", "X1": "X1",
         "XC60": "XC60", "330d": "330d"}

FONT = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DejaVu", f"{FONT}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuBold", f"{FONT}/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSerif", f"{FONT}/DejaVuSerif.ttf"))

W, H = 960, 540
INK = Color(0.039, 0.063, 0.125)
GOLD = Color(0.702, 0.576, 0.306)
GOLD_DEEP = Color(0.459, 0.365, 0.169)
IVORY = Color(0.969, 0.965, 0.953)
SLATE = Color(0.290, 0.345, 0.447)
GREEN = Color(0.122, 0.420, 0.290)
RED = Color(0.549, 0.227, 0.227)
COVER = Color(33 / 255, 34 / 255, 40 / 255)
LINE = Color(0.855, 0.835, 0.788)
SOFT = Color(0.955, 0.949, 0.935)
MUTED = Color(0.55, 0.54, 0.50)

FONDO = 12428  # fondo de 3 meses (con nómina) que se deja en la SL


def eur(n, cents=False):
    s = f"{n:,.2f}" if cents else f"{n:,.0f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


# --- Dibujo ------------------------------------------------------------------
def bg(c, dark=False):
    c.setFillColor(COVER if dark else IVORY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 4, W, 4, fill=1, stroke=0)
    c.rect(0, 0, 4, H, fill=1, stroke=0)


def footer(c, n, total, dark=False):
    c.setFillColor(GOLD if dark else GOLD_DEEP)
    c.setFont("DejaVu", 7.5)
    c.drawString(36, 18, "KHC AUTO IMPORT")
    c.setFillColor(Color(0.72, 0.70, 0.64) if dark else SLATE)
    c.drawCentredString(W / 2, 18, "O Milladoiro · trayectoria representativa de 250 simulaciones · cifras estimadas")
    c.setFillColor(GOLD if dark else INK)
    c.drawRightString(W - 28, 18, f"{n:02d}  /  {total:02d}")


def kicker(c, text, y, x=36):
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 8)
    c.drawString(x, y, text.upper())


def heading(c, kick, text, y=498, size=20):
    kicker(c, kick, y)
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", size)
    c.drawString(36, y - 28, text)
    return y - 28


def wrap(c, text, x, y, width, size=9.5, leading=13, color=INK, font="DejaVu", max_lines=8):
    c.setFont(font, size)
    words = text.replace(" €", "\u00a0€").split(" ")
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    if len(lines) > max_lines:
        raise SystemExit("texto cortado: " + text[:80])
    for i, line in enumerate(lines):
        c.setFillColor(color)
        c.setFont(font, size)
        c.drawString(x, y - i * leading, line)
    return len(lines) * leading


def card(c, x, y, w, h, title, valor, nota="", acento=GOLD):
    c.setStrokeColor(acento)
    c.setFillColor(white)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    c.setFillColor(acento)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(x + 12, y + h - 16, title.upper())
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 17)
    c.drawString(x + 12, y + h - 42, valor)
    if nota:
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 8)
        c.drawString(x + 12, y + 12, nota)


def table(c, x, y, cols, rows, widths, size=8, hrow=17, aligns=None, bold_rows=()):
    aligns = aligns or ["l"] * len(cols)
    c.setFillColor(INK)
    c.setFont("DejaVuBold", size)
    cx = x
    for i, col in enumerate(cols):
        if aligns[i] == "r":
            c.drawRightString(cx + widths[i] - 6, y - 11, col)
        elif aligns[i] == "c":
            c.drawCentredString(cx + widths[i] / 2, y - 11, col)
        else:
            c.drawString(cx + 6, y - 11, col)
        cx += widths[i]
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.6)
    c.line(x, y - 15, x + sum(widths), y - 15)
    yy = y - 15
    for j, row in enumerate(rows):
        yy -= hrow
        if j % 2 == 0:
            c.setFillColor(SOFT)
            c.rect(x, yy, sum(widths), hrow, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold" if j in bold_rows else "DejaVu", size)
        cx = x
        for i, cell in enumerate(row):
            if aligns[i] == "r":
                c.drawRightString(cx + widths[i] - 6, yy + 5, cell)
            elif aligns[i] == "c":
                c.drawCentredString(cx + widths[i] / 2, yy + 5, cell)
            else:
                c.drawString(cx + 6, yy + 5, cell)
            cx += widths[i]
    return yy


def _foto(c, nombre, x, y, w, pie):
    """Dibuja un render de FOTOS/nombre.jpg a ancho w (4:3) con un pie.
    Devuelve la y inferior (debajo del pie)."""
    h = w * FOTO_H_W
    c.drawImage(str(FOTOS / nombre), x, y, width=w, height=h,
                preserveAspectRatio=True, mask='auto')
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.rect(x, y, w, h, fill=0, stroke=1)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7.5)
    c.drawCentredString(x + w / 2, y - 11, pie)
    return y - 20


PAGES = []


def page(fn):
    PAGES.append(fn)
    return fn


# --- Láminas -----------------------------------------------------------------
@page
def p_cover(c, n, t):
    bg(c, True)
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 10)
    c.drawString(60, H - 78, "KHC AUTO IMPORT  ·  SANTIAGO DE COMPOSTELA")
    c.setFillColor(white)
    c.setFont("DejaVuSerif", 40)
    c.drawString(60, H - 140, "Arranque paso a paso")
    c.setFillColor(GOLD)
    c.setFont("DejaVuSerif", 22)
    c.drawString(60, H - 178, "O Milladoiro  ·  36 meses  ·  50.000 € propios")
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(60, H - 210, 500, H - 210)
    c.setFillColor(Color(0.82, 0.80, 0.75))
    c.setFont("DejaVu", 11)
    for i, s in enumerate([
        "Sociedad 50/50: tú (administrador) + tu esposa (socia)",
        "Nave de stock: 24 plazas en espiga, hasta 28 en mixta",
        "Obra en dos tramos: el suelo el día 1 (nave vacía), el resto cuando la caja lo pague",
        "Arranque con trío de rotación rápida y compra permanente",
        "Dividendos 50/50 a fin de año: el sobrante, a casa",
    ]):
        c.drawString(60, H - 245 - i * 24, "—  " + s)
    c.setFillColor(GOLD)
    c.setFont("DejaVu", 9)
    c.drawString(60, 58, "Plan estimado a 36 meses (250 simulaciones), para contrastar con ventas y gastos reales; no es garantía.")
    footer(c, n, t, True)


@page
def p_reforma_fotos(c, n, t):
    bg(c)
    heading(c, "La reforma planeada", "Así va a quedar la nave (renders de ejemplo)")
    wrap(c, "Es la reforma completa de O Milladoiro (5.115 €), vista por zonas. Se abre la nave tal cual y se "
            "reforma poco a poco: el suelo el día 1 (nave vacía) y el resto cuando la caja lo pague (Paso 7). "
            "Son renders del diseño de la reforma (a modo de referencia), no fotos de la nave terminada.",
         36, 452, 890, size=9, leading=12, max_lines=2)
    # 3 arriba (4:3)
    _foto(c, "fachada.jpg", 36, 249, 244, "Fachada")
    _foto(c, "showroom.jpg", 358, 249, 244, "Nave / showroom (24 coches)")
    _foto(c, "sala_espera.jpg", 680, 249, 244, "Sala de espera")
    # 2 abajo (centradas, 4:3)
    _foto(c, "oficina_ruben.jpg", 216, 43, 244, "Oficina de dirección (Rubén)")
    _foto(c, "oficina_karen.jpg", 500, 43, 244, "Oficina de la socia (Karen)")
    footer(c, n, t)


@page
def p_reforma_costes(c, n, t):
    bg(c)
    heading(c, "La reforma planeada · presupuesto", "Qué incluye cada partida y cuánto cuesta")
    wrap(c, "La reforma completa suma 5.115 € (IVA incluido) y la mano de obra es propia (0 €). No se paga todo "
            "de golpe: el suelo se hace el día 1 con la nave vacía y el resto, poco a poco con coches dentro, "
            "cuando la caja lo pague.",
         36, 452, 890, size=9, leading=12, max_lines=2)
    filas = [[p["partida"], p["nota"], eur(p["total"])] for p in nvm.REFORMA]
    filas.append(["TOTAL reforma", "7 partidas · mano de obra propia", eur(nvm.REFORMA_TOTAL)])
    yb = table(c, 36, 418, ["Partida", "Qué incluye", "Coste"], filas,
               [250, 500, 138], size=8.5, hrow=18, aligns=["l", "l", "r"], bold_rows=(7,))
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, yb - 12, "CÓMO SE PAGA (dos tramos, sin préstamo)")
    resto = nvm.REFORMA_TOTAL - 905.0
    card(c, 36, 150, 430, 74, "Tramo 1 · Suelo (905 €)", "día 1 · nave vacía",
         "suelo epoxi de 400 m²: se pinta con la nave vacía, la única vez que está vacía", acento=RED)
    card(c, 494, 150, 430, 74, "Tramo 2 · Resto (" + eur(resto) + " €)", "progresivo · cuando la caja lo pague",
         "luz, pintura, señalización, mobiliario, seguridad y limpieza: poco a poco, con coches dentro", acento=GOLD)
    wrap(c, "Se financia con las ventas, sin préstamo: cada tramo se paga en el primer mes en que la caja lo "
            "cubre con 2 meses de margen, sin tocar el fondo de 3 meses.",
         36, 128, 890, size=9, leading=12, color=SLATE, max_lines=2)
    footer(c, n, t)


@page
def p_estructura(c, n, t):
    bg(c)
    heading(c, "La estructura", "Una SL 50/50, con los papeles puestos")
    wrap(c, "Constituís una sociedad limitada al 50 % para cada uno. Tú eres el único administrador; ella es "
            "socia, no administradora. Así ella no cotiza como autónoma (no paga la RETA de 448,69 €) hasta "
            "que, en el mes 6, se da de alta como empleada de la SL.",
         36, 442, 890, size=10, leading=14, max_lines=2)
    card(c, 36, 336, 430, 86, "Tú — administrador único", "Cotizas como autónomo societario",
         "RETA 448,69 €/mes desde el día 1. Además cobras sueldo como trabajador.", acento=GOLD)
    card(c, 494, 336, 430, 86, "Tu esposa — socia 50 %", "Sin coste de Seguridad Social al inicio",
         "Es propietaria, no administradora. Cobra dividendos y, desde m6, sueldo.", acento=GREEN)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 292, "POR QUÉ ASÍ (y no al revés)")
    wrap(c, "Si ella fuera administradora, cotizaría como autónoma societaria: 448,69 €/mes fijos que la SL no "
            "puede deducir. Si además trabajara, doble cotización. Al ser solo socia, la SL le paga un sueldo "
            "normal de trabajadora (deducible, con su IRPF bajo) y ella cobra dividendos (la vía más eficiente).",
         36, 276, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 224, "REPARTO")
    table(c, 36, 206, ["Concepción", "Tú", "Ella"], [
        ["Capital social", "50 %", "50 %"],
        ["Dividendos (año 1 en adelante)", "50 %", "50 %"],
        ["Sueldo (ingreso mensual)", "variable (el hueco)", "media jornada m6 (750 €) → completa m16 (1.500 €)"],
        ["Administración de la SL", "sí (único)", "no"],
    ], [300, 220, 368], size=9, hrow=19, aligns=["l", "c", "c"])
    card(c, 36, 34, 888, 66, "Regla del plan", "Reinvertir mientras crece la flota; repartir el sobrante a fin de año",
         "el beneficio financia los coches hasta llenar la nave; después, lo que sobra del fondo de 3 meses se reparte en dividendos 50/50", acento=GOLD)
    footer(c, n, t)


def _paso_caja(c, y_top, filas, alto_row=20, bold_rows=()):
    """Tabla Concepto / Gasto / Caja resultante. Devuelve la y de la última fila."""
    return table(c, 36, y_top, ["Concepto", "Gasto", "Caja resultante"], filas,
                 [520, 130, 238], size=9, hrow=alto_row, aligns=["l", "r", "r"], bold_rows=bold_rows)


@page
def p_paso1(c, n, t):
    bg(c)
    heading(c, "Paso 1  ·  Día 1", "Registramos la empresa")
    wrap(c, "Constitución de la SL: escritura en notaría, inscripción en el Registro Mercantil, NIF, cuenta "
            "bancaria de la sociedad y alta en AEAT y Seguridad Social. Capital repartido 50/50. Tú, "
            "administrador único; ella, socia. Gestoría incluida en la cifra.",
         36, 442, 890, size=10, leading=14, max_lines=2)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 398, "QUÉ SE PAGA Y QUÉ QUEDA EN CAJA")
    _paso_caja(c, 380, [
        ["Capital propio (lo que tenéis)", "—", eur(DI[0][2]) + " €"],
        ["Constitución de la SL (notaría, registro, gestoría)", "−1.200", eur(DI[1][2]) + " €"],
    ])
    card(c, 36, 240, 430, 74, "Coste del paso", "1.200 €", "se paga una sola vez el día 1", acento=GOLD)
    card(c, 494, 240, 430, 74, "Caja tras este paso", eur(DI[1][2]) + " €", "de los 50.000 iniciales", acento=GREEN)
    wrap(c, "Detalles a cerrar en la escritura: (1) reparto 50/50, (2) tú único administrador, (3) que la "
            "sociedad pueda repartir dividendos, (4) domicilio en la nave. Se firma en un día y está operativo "
            "en 1-2 semanas.",
         36, 224, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    card(c, 36, 108, 888, 66, "Importa", "No constituir antes de tener la nave firmada",
         "así la nave es el domicilio social, la licencia sale de una vez y el capital cubre la fianza", acento=RED)
    footer(c, n, t)


@page
def p_paso2(c, n, t):
    bg(c)
    heading(c, "Paso 2  ·  Día 1", "La nave: O Milladoiro, se abre tal cual")
    wrap(c, "Firmáis O Milladoiro: 465 m², almacén 40 × 10 m, 8 m de alto. Se abre tal cual (está apta; la "
            "reforma es mayormente visual). La obra (5.115 €) va en dos tramos: el suelo (905 €) se paga el "
            "día 1 porque exige la nave vacía; el resto (4.210 €) cuando la caja lo pague (Paso 7).",
         36, 442, 890, size=10, leading=14, max_lines=3)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 384, "LO QUE SE PAGA POR LA NAVE EL DÍA 1")
    _paso_caja(c, 366, [
        ["Fianza (2 mensualidades de 1.200 €)", "−2.400", eur(DI[2][2]) + " €"],
        ["Licencia de actividad + técnico", "−800", eur(DI[3][2]) + " €"],
        ["(alquiler 1.200 + suministros luz/agua 150 + internet/teléfono 50 + seguro 60 + tasas 25)", "—", "—"],
    ])
    card(c, 36, 205, 430, 76, "Coste del paso (día 1)", "3.200 €", "fianza 2.400 + licencia 800", acento=GOLD)
    card(c, 494, 205, 430, 76, "Caja tras este paso", eur(DI[3][2]) + " €", "el alquiler se paga mes a mes", acento=GREEN)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 189, "Fijos mensuales (ya están en la caja de cada mes)")
    wrap(c, "Alquiler 1.200 · suministros (luz/agua, provisión conjunta) 150 · internet/teléfono 50 · seguro 60 · "
            "tasas 25 · marketing/portales 250 · RETA administrador 448,69 = 2.183,69 €/mes. Desde m6: "
            "socia 750 bruto + 229,50 SS empresa = 979,50; desde m16: 1.500 + 459 = 1.959. Total fijo: "
            "3.163,19 €/mes desde m6 y 4.142,69 desde m16. El sueldo de administrador se muestra por separado mes a mes.",
         36, 173, 890, size=8.6, leading=11, color=SLATE, max_lines=4)
    card(c, 36, 72, 888, 66, "La obra, en dos tramos", "Suelo el día 1 (nave vacía) · resto cuando la caja lo pague",
         "pintar todo el suelo exige la nave vacía (solo está vacía al abrir); el resto se hace poco a poco con coches dentro, sin tocar el fondo", acento=RED)
    footer(c, n, t)


@page
def p_paso3(c, n, t):
    bg(c)
    heading(c, "Paso 3  ·  Día 1", "El kit y el trío de arranque")
    wrap(c, "Con el kit de equipo (detallado, material) y tres coches de rotación rápida estáis operando el "
            "mismo día. Se eligen coches que se venden solos: el trío rota en 35-45 días, así la caja recicla "
            "rápido.",
         36, 442, 890, size=10, leading=14, max_lines=2)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 400, "LOS TRES COCHES DEL ARRANQUE (34.139 €)")
    table(c, 36, 382, ["Coche", "Compra", "Venta", "Rotación", "Margen"], [
        ["BMW 116d", "9.010", "12.475", "~35 días", "3.465"],
        ["Audi A3", "12.455", "15.990", "~35 días", "3.535"],
        ["VW Golf GTI", "12.674", "18.500", "~45 días", "5.826"],
    ], [220, 130, 130, 150, 130], size=9, hrow=20, aligns=["l", "r", "r", "c", "r"])
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 300, "CAJA TRAS CERRAR EL DÍA 1")
    _paso_caja(c, 282, [
        ["Kit de equipo y detallado", f"−{eur(D['kit'])}", eur(DI[4][2]) + " €"],
        ["Trío de arranque (los 3 coches)", f"−{eur(D['trio_coste'])}", eur(DI[5][2]) + " €"],
        ["Suelo, con la nave vacía (tramo urgente de la obra)", f"−{eur(SUELO)}", eur(DI[6][2]) + " €"],
        ["Gastos fijos del mes 1", f"−{eur(D['fijos1'])}", eur(DI[7][2]) + " €"],
    ], alto_row=18, bold_rows=(3,))
    card(c, 36, 120, 888, 64, "CAJA DE APERTURA", eur(DI[7][2]) + " €",
         "punto de partida del mes 1. El suelo ya se pintó (nave vacía); el fondo de emergencia no se toca hasta que entre caja de ventas", acento=RED)
    wrap(c, "Regla: nunca se compra un coche que baje la caja por debajo de 1 mes de fijos. Al principio se "
            "compra con el fondo; cuando la flota llega al objetivo, solo con lo que sobre de 3 meses.",
         36, 104, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    footer(c, n, t)


@page
def p_paso4(c, n, t):
    bg(c)
    heading(c, "Paso 4  ·  Permanente", "La búsqueda: cómo entran los coches")
    wrap(c, "No hay un único momento de comprar: hay una fuente de coches permanente. Cada coche que se vende "
            "se reemplaza enseguida. El ciclo por unidad (regla: el coche se entrega con matrícula española "
            "definitiva; las temporales solo en el caso extremo de venderse el día 1, antes de matricular):",
         36, 442, 890, size=10, leading=14, max_lines=2)
    pasos = [("Buscar y ver", "1-2 días", "varias unidades vistas"),
             ("Viaje de ida", "≤3 días", "coche elegido"),
             ("Vuelta", "2 días", "coche en la nave"),
             ("Revisión y detallado", "1-2 días", "listo para vender"),
             ("Vender", "2-45 días", "según el modelo")]
    x = 36
    for i, (tt, dd, ss) in enumerate(pasos):
        c.setStrokeColor(GOLD)
        c.setFillColor(white)
        c.roundRect(x, 356, 164, 66, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.setFont("DejaVuBold", 8)
        c.drawString(x + 10, 356 + 50, tt.upper())
        c.setFillColor(INK)
        c.setFont("DejaVuSerif", 15)
        c.drawString(x + 10, 356 + 26, dd)
        c.setFillColor(SLATE)
        c.setFont("DejaVu", 7.5)
        c.drawString(x + 10, 356 + 12, ss)
        if i < len(pasos) - 1:
            c.setFillColor(GOLD_DEEP)
            c.setFont("DejaVu", 14)
            c.drawString(x + 164 + 2, 382, "→")
        x += 164 + 17
    wrap(c, "Resultado: en menos de una semana, desde que se vende un coche, hay otro en stock. Vuelo solo "
            "cuando hace falta rapidez; lo normal, envío (igual de rápido). Se compra siempre el que mejor rinde "
            "dentro del plan de cartera de 15 modelos (lámina siguiente).",
         36, 318, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 272, "LA FLOTA CRECE ASÍ (mediana de 250 trayectorias)")
    meses_sel = [1, 6, 12, 18, 24, 27, 36]
    table(c, 36, 254, [""] + [f"m{m}" for m in meses_sel], [
        ["Coches en stock"] + [str(int(round(M[m][1]))) for m in meses_sel],
        ["Ventas del mes"] + [str(int(round(M[m][0]))) for m in meses_sel],
    ], [170, 112, 112, 112, 112, 112, 112, 112], size=9, hrow=19, aligns=["l"] + ["c"] * 7)
    wrap(c, "La flota no llega a 24 coches hasta el mes 27: se va comprando con la caja que entra de las "
            "ventas (menos si ese año se reparten dividendos). No hace falta (ni cabe) financiar: el negocio "
            "se financia a sí mismo.",
         36, 196, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    card(c, 36, 92, 888, 66, "Disciplina de compra", "Comprar por margen, no por ganas",
         "cada compra exige margen claro y rotación; si la caja no llega, se espera un coche menos, nunca se rompe el fondo", acento=GOLD)
    footer(c, n, t)


@page
def p_paso4b(c, n, t):
    bg(c)
    heading(c, "Paso 4bis  ·  El catálogo", "15 modelos, cada uno con su precio fijo de compra y venta")
    wrap(c, "No compráis tres coches: trabajáis con un catálogo de 15 modelos, y cada uno tiene un PRECIO DE "
            "COMPRA y un PRECIO DE VENTA fijos (comprado «puesto en A Coruña», vendido con IVA de la ganancia). "
            "Eso es lo que veréis mes a mes: qué se compra, a cuánto, y qué se vende, a cuánto.",
         36, 448, 890, size=9, leading=12, max_lines=2)
    # Segmentos: (título, [nicks])
    seg = [
        ("Pequeños de alta rotación (el motor de caja, ~32-35 días)",
         ["Polo", "116d", "Leon", "Golf VIII", "GTI", "A3"]),
        ("SUV / compactos (el volumen y la variedad, ~36-48 días)",
         ["Corolla", "3008", "Tiguan", "XC40", "318d"]),
        ("Premium de margen alto (tardan ~1-2 semanas más, margen mayor)",
         ["X1", "Mercedes", "XC60", "330d"]),
    ]
    cupos = {"Polo": 2, "116d": 2, "Leon": 2, "Golf VIII": 2, "GTI": 2, "A3": 1,
             "Corolla": 2, "3008": 2, "Tiguan": 2, "XC40": 2, "318d": 1,
             "X1": 1, "Mercedes": 1, "XC60": 1, "330d": 1}
    y = 408
    for tit, nicks in seg:
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8.5)
        c.drawString(36, y, tit)
        y -= 4
        filas = [[CAT[n]["nombre"], eur(CAT[n]["coste"]), eur(CAT[n]["venta"]),
                  "+" + eur(CAT[n]["neto"]), f"~{CAT[n]['dias']} d",
                  f"{CAT[n]['margen_dia']:.0f} €", str(cupos[n])] for n in nicks]
        y = table(c, 36, y - 2, ["Modelo", "Compra", "Venta", "+Neto", "Días", "€/día", "Cupos"],
                  filas, [250, 120, 120, 120, 90, 90, 88], size=8, hrow=14,
                  aligns=["l", "r", "r", "r", "c", "r", "c"])
        y -= 10
    card(c, 36, 44, 888, 66, "El plan de cartera (24 plazas)", "11 pequeños · 9 SUV/compactos · 4 premium",
         "la flota completa mantiene esa mezcla: variedad de verdad, y dentro de ella se compra siempre el que mejor rinde el capital", acento=GOLD)
    footer(c, n, t)


@page
def p_paso5(c, n, t):
    bg(c)
    heading(c, "Paso 5  ·  La nave", "Stock, no showroom: 24 plazas (hasta 28)")
    wrap(c, "La nave se opera como almacén de stock: los coches van apretados (espiga a 45°) y se mueven cuando "
            "un cliente muestra interés real. No hace falta pasillo de exposición. Con 10 m de ancho caben dos "
            "filas a 45° (9,19 m).",
         36, 442, 890, size=10, leading=14, max_lines=2)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 398, "LO QUE CABE")
    table(c, 36, 380, ["Distribución", "Coches", "Cuándo"], [
        ["Espiga a 45° (derecha 14 + izquierda 10)", "24", "uso normal"],
        ["Mixta (izquierda 90° + derecha 45°)", "28", "recurso, si hace falta"],
    ], [420, 90, 378], size=9, hrow=20, aligns=["l", "c", "l"], bold_rows=(0,))
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 306, "Y CUÁNDO MOLESTA APRETAR (mediana de coches en stock)")
    meses_sel = [6, 12, 18, 23, 26, 36]
    table(c, 36, 288, [""] + [f"m{m}" for m in meses_sel], [
        ["Coches en la nave"] + [str(int(round(M[m][1]))) for m in meses_sel],
        ["¿Hay que moverlos para enseñar?"] + ["no", "no", "a veces", "sí", "sí", "sí"],
    ], [250, 114, 114, 114, 114, 114, 114], size=9, hrow=19, aligns=["l"] + ["c"] * 6)
    wrap(c, "La nave se llena de verdad en el mes 26 y pasa de 20 coches solo ~12 de los 36 meses: los dos "
            "primeros años el layout apretado no molesta a nadie. Cuando moleste, ya se cobra sueldo y se puede "
            "pagar a quien mueva los coches.",
         36, 224, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    card(c, 36, 112, 284, 72, "Regla de oro", "máx. 2 coches",
         "si hay que mover más de dos, se vende antes", acento=RED)
    card(c, 336, 112, 284, 72, "Lo que se ve poco", "los del fondo",
         "van los de rotación lenta; el escaparate cambia a menudo", acento=GOLD)
    card(c, 636, 112, 288, 72, "Hasta 28", "solo si hace falta",
         "pasar a mixta cuando la nave esté llena y la caja lo aguante", acento=GREEN)
    footer(c, n, t)


@page
def p_paso6(c, n, t):
    bg(c)
    heading(c, "Paso 6  ·  Meses 6 y 16", "Su contrato: media jornada, luego completa")
    wrap(c, "En el mes 6 ella entra como trabajadora de la SL (ya era socia desde el día 1) a MEDIA jornada "
            "(750 €). En el mes 16, cuando la caja ya no vuelve a bajar del fondo, se le sube a jornada "
            "COMPLETA (1.500 €). Cotiza en el Régimen General en ambos tramos. Es la forma más barata y legal "
            "de pagarle su trabajo.",
         36, 442, 890, size=10, leading=14, max_lines=3)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 396, "SUELDO A DOS TRAMOS Y SU COSTE REAL")
    table(c, 36, 378, ["Concepto", "Meses 6-15 (media)", "Desde m16 (completa)"], [
        ["Sueldo bruto", "750 €/mes", "1.500 €/mes"],
        ["Coste para la SL (con cuota patronal)", "979 €/mes", "1.959 €/mes"],
        ["IRPF efectivo (con mínimo personal)", "~6,5 %", "~12,7 %"],
        ["Su bolsillo (neto)", "655 €/mes", "1.223 €/mes"],
    ], [360, 264, 264], size=9, hrow=19, aligns=["l", "c", "c"], bold_rows=(3,))
    card(c, 36, 196, 430, 74, "Por qué media al inicio", "proteger el fondo",
         "la nómina fija es lo que hunde la caja en el arranque; a media el insolvente baja del 16 % al 12 %", acento=GOLD)
    card(c, 494, 196, 430, 74, "Por qué completa en m16", "la caja ya es sólida",
         "desde m16 la caja ya no baja del fondo: se paga la subida sin riesgo, y no se recorta de nuevo", acento=GREEN)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 178, "Y LOS DIVIDENDOS (su otra vía de ingreso)")
    wrap(c, "Como es socia 50 %, a cada fin de ejercicio la SL reparte en dividendos lo que sobra sobre el "
            "fondo de 3 meses. Ella cobra el 50 % (tú el otro 50 %), cada uno con su IRPF del ahorro. Es la vía "
            "más eficiente de sacar beneficio a casa. (Nunca autónoma: le costaría 5.887 €/año + riesgo de falsa autónoma.)",
         36, 162, 890, size=9.5, leading=13, color=SLATE, max_lines=3)
    card(c, 36, 48, 888, 66, "Sueldo + dividendos = su plan", "655 €/mes (m6-15) → 1.223 €/mes (m16+) + 50 % de los dividendos",
         "el sueldo es el ingreso fijo; los dividendos reparten el beneficio que la SL no reinvierte", acento=GREEN)
    footer(c, n, t)


@page
def p_paso7(c, n, t):
    bg(c)
    heading(c, "Paso 7  ·  Día 1 y Mes 15", "La obra, en dos fases: el suelo no puede esperar")
    wrap(c, "La obra (5.115 €) se divide en dos tramos porque no todas las tareas tienen la misma urgencia. "
            "Pintar TODO el suelo exige la nave vacía (hay que sacar todos los coches), y el único momento en "
            "que la nave está vacía es el arranque. El resto (luz, paredes, señalización, mobiliario) se puede "
            "hacer poco a poco, incluso con coches dentro.",
         36, 442, 890, size=9.5, leading=13, max_lines=3)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 398, "LOS DOS TRAMOS DE LA OBRA (5.115 € en total)")
    card(c, 36, 312, 430, 74, "Tramo 1 · Suelo (URGENTE)", "905 €  ·  día 1",
         "suelo epoxi de 400 m²: se pinta con la nave vacía, la única vez que está vacía", acento=RED)
    card(c, 494, 312, 430, 74, "Tramo 2 · Resto (progresivo)", "4.210 €  ·  mes 20 (mediana)",
         "luz, pintura de paredes, señalización, mobiliario, seguridad: poco a poco, con coches dentro", acento=GOLD)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 292, "POR QUÉ EL SUELO NO PUEDE ESPERAR: la ventana de la nave vacía")
    table(c, 36, 276, ["Mes", "Flota (coches)", "¿Se puede pintar todo el suelo?"], [
        ["m1-m2", "3", "SÍ: la nave está casi vacía; se sacan 3 coches y se pinta en 2-3 días"],
        ["m3-m5", "4", "Aún posible, pero ya más apurado (hay que aparcar los 4 fuera)"],
        ["m6-m11", "5-7", "Muy difícil: no hay sitio donde aparcarlos todos fuera"],
        ["m12 en adelante", "7+", "IMPOSIBLE: la nave se va llenando y no se puede vaciar"],
    ], [140, 110, 638], size=8.5, hrow=17, aligns=["c", "c", "l"], bold_rows=(0,))
    wrap(c, f"Por eso el suelo se paga en el día 1, con la nave vacía. Es el precio de hacerlo bien: son 905 € "
            f"que, si se pagaran más tarde, habrían financiado un coche más en el arranque. A cambio, se pinta todo "
            f"el suelo de una vez, sin tener que sacar 24 coches a la calle. Si se dejara para cuando la nave está "
            f"llena, no se podría pintar (no hay sitio donde aparcarlos).",
         36, 176, 890, size=9, leading=12, color=SLATE, max_lines=3)
    card(c, 36, 48, 888, 66, "Regla", "El suelo con la nave vacía; el resto, cuando la caja lo pague",
         "el suelo (905 €) es del día 1; el resto (4.210 €) se paga en el primer mes en que la caja lo cubre con 2 meses de margen, sin tocar el fondo", acento=RED)
    footer(c, n, t)


def _amount(n):
    return eur(float(n), cents=True) + " €"


def _outflow_amount(n):
    return "−" + _amount(abs(float(n))) if abs(float(n)) >= 0.005 else _amount(0)


def _group_ventas(dets):
    """Agrupa por modelo y conserva importe vendido y margen neto por unidad."""
    from collections import OrderedDict
    grouped = OrderedDict()
    for nick, venta, neto in dets:
        row = grouped.setdefault(nick, dict(unidades=0, unitario=float(venta), ventas=0.0, margen=0.0))
        if abs(row["unitario"] - float(venta)) > 0.01:
            raise AssertionError(f"precio de venta inconsistente para {nick}")
        row["unidades"] += 1
        row["ventas"] += float(venta)
        row["margen"] += float(neto)
    return sorted(grouped.items(), key=lambda item: (-item[1]["unidades"], item[0]))


def _group_compras(dets):
    """Agrupa por modelo las compras de stock del mes."""
    from collections import OrderedDict
    grouped = OrderedDict()
    for nick, coste in dets:
        row = grouped.setdefault(nick, dict(unidades=0, unitario=float(coste), total=0.0))
        if abs(row["unitario"] - float(coste)) > 0.01:
            raise AssertionError(f"coste de compra inconsistente para {nick}")
        row["unidades"] += 1
        row["total"] += float(coste)
    return sorted(grouped.items(), key=lambda item: (-item[1]["unidades"], item[0]))


def _sales_rows(dets):
    grouped = _group_ventas(dets)
    rows = [
        [SHORT.get(nick, nick), str(v["unidades"]), _amount(v["unitario"]),
         _amount(v["ventas"]), _amount(v["margen"])]
        for nick, v in grouped
    ]
    if not rows:
        rows = [["Sin ventas", "0", "—", _amount(0), _amount(0)]]
    rows.append([
        "TOTAL VENTAS", str(sum(v["unidades"] for _, v in grouped)), "",
        _amount(sum(v["ventas"] for _, v in grouped)),
        _amount(sum(v["margen"] for _, v in grouped)),
    ])
    return rows


def _purchase_rows(dets):
    grouped = _group_compras(dets)
    rows = [
        [SHORT.get(nick, nick), str(v["unidades"]), _amount(v["unitario"]), _amount(v["total"])]
        for nick, v in grouped
    ]
    if not rows:
        rows = [["Sin compras", "0", "—", _amount(0)]]
    rows.append([
        "TOTAL COMPRAS", str(sum(v["unidades"] for _, v in grouped)), "",
        _amount(sum(v["total"] for _, v in grouped)),
    ])
    return rows


def _net_dividendos(total_bruto):
    """Neto conjunto orientativo del dividendo, aplicando tramos por socio al 50 %."""
    def cuota(importe):
        tramos = [(6000, .19), (50000, .21), (200000, .23), (300000, .27), (float("inf"), .28)]
        restante, anterior, impuesto = importe, 0.0, 0.0
        for limite, tipo in tramos:
            base = max(0.0, min(restante, limite - anterior))
            impuesto += base * tipo
            restante -= base
            anterior = limite
            if restante <= 0:
                break
        return impuesto
    mitad = max(0.0, float(total_bruto)) / 2.0
    return round(float(total_bruto) - 2.0 * cuota(mitad), 2)


def _stock_detalle(mix):
    items = sorted(mix.items(), key=lambda item: (-item[1], SHORT.get(item[0], item[0])))
    return " · ".join(f"{cantidad}× {SHORT.get(nick, nick)}" for nick, cantidad in items) or "vacío"


def _validate_monthly_detail():
    """Comprueba gastos desglosados, ventas, compras y caja antes de emitir el PDF."""
    fixed_base = sum(float(row["importe"]) for row in FIJOS_BASE)
    for i, x in enumerate(TRAY):
        m = int(x["mes"])
        wife = x["nomina_ella"]
        wife_cfg = NOMINAS["socia"]
        expected_wife_gross = (
            0.0 if m < wife_cfg["desde_mes"]
            else wife_cfg["bruto_completa"] if m >= wife_cfg["jornada_completa_desde_mes"]
            else wife_cfg["bruto_media"]
        )
        if abs(expected_wife_gross - float(wife["bruto"])) > 0.01:
            raise AssertionError(f"nómina de la socia de m{m} no cuadra")
        if abs(wife["bruto"] + wife["ss_empresa"] - wife["coste_empresa"]) > 0.01:
            raise AssertionError(f"coste patronal de la socia de m{m} no cuadra")
        expected_fixed = round(fixed_base + wife["coste_empresa"], 2)
        if abs(expected_fixed - float(x["fijos"])) > 0.02:
            raise AssertionError(f"gastos fijos de m{m} no cuadran: {expected_fixed} != {x['fijos']}")
        if abs(sum(v["ventas"] for _, v in _group_ventas(x["ventas_det"]))
               - sum(float(sale) for _, sale, _ in x["ventas_det"])) > 0.02:
            raise AssertionError(f"ventas agrupadas de m{m} no cuadran")
        if abs(sum(v["total"] for _, v in _group_compras(x["compras"]))
               - sum(float(cost) for _, cost in x["compras"])) > 0.02:
            raise AssertionError(f"compras agrupadas de m{m} no cuadran")
        expected_rebu = 0.0
        for nick, sale, neto in x["ventas_det"]:
            if abs(float(sale) - CAT[nick]["venta"]) > 0.01 or abs(float(neto) - CAT[nick]["neto"]) > 0.01:
                raise AssertionError(f"precio o margen de venta inconsistente en m{m}: {nick}")
            expected_rebu += float(sale) - CAT[nick]["coste"] - float(neto)
        for nick, cost in x["compras"]:
            if abs(float(cost) - CAT[nick]["coste"]) > 0.01:
                raise AssertionError(f"coste de compra inconsistente en m{m}: {nick}")
        if abs(expected_rebu - float(x["rebu"])) > 0.02:
            raise AssertionError(f"reserva REBU de m{m} no cuadra")
        start = float(DI[6][2]) if m == 1 else float(TRAY[i - 1]["caja"])

        ventas = sum(float(sale) for _, sale, _ in x["ventas_det"])
        compras = sum(float(cost) for _, cost in x["compras"])
        end_calc = round(
            start + ventas - float(x["rebu"]) - compras - float(x["fijos"])
            - float(x["sueldo"]) - float(x["averias"]) - float(x["obra"])
            - float(x["is_paid"]) - float(x["div"]),
            2,
        )
        if abs(end_calc - float(x["caja"])) > 0.02:
            raise AssertionError(f"flujo de caja de m{m} no cuadra: {end_calc} != {x['caja']}")
        if sum(x.get("stock_mix", {}).values()) != int(x["flota"]):
            raise AssertionError(f"stock final de m{m} no cuadra")


def _draw_month_detail(c, n, t, m):
    x = TRAY[m - 1]
    ventas = x["ventas_det"]
    compras = x["compras"]
    total_ventas = sum(float(sale) for _, sale, _ in ventas)
    margen_neto = sum(float(net) for _, _, net in ventas)
    total_compras = sum(float(cost) for _, cost in compras)
    stock_mix = x.get("stock_mix", {})
    stock_coste = sum(int(q) * CAT[nick]["coste"] for nick, q in stock_mix.items())
    start = float(DI[6][2]) if m == 1 else float(TRAY[m - 2]["caja"])
    wife = x["nomina_ella"]
    admin_gross = float(x["sueldo"])
    admin_target = float(x["sueldo_admin_objetivo"])
    admin_tax = float(x["sueldo_admin_retencion"])
    admin_net = float(x["sueldo_admin_neto"])
    dividend_gross = float(x["div"])
    dividend_net_total = _net_dividendos(dividend_gross)
    dividend_net_each = dividend_net_total / 2.0
    admin_income_home = admin_net + dividend_net_each
    wife_income_home = float(wife["neto"]) + dividend_net_each

    total_sales_count = len(ventas)
    total_purchase_count = len(compras)
    ventas_label = "venta" if total_sales_count == 1 else "ventas"
    compras_label = "compra" if total_purchase_count == 1 else "compras"
    title = f"Mes {m} · {total_sales_count} {ventas_label} · {total_purchase_count} {compras_label}"
    heading(c, f"Detalle mensual · {m:02d} de 36", title, size=18)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 7.5)
    if m == 1:
        start_note = "Saldo tras los pagos de apertura, antes de los gastos recurrentes de m1"
    else:
        start_note = "Saldo al cierre del mes anterior"
    c.drawString(36, 449, f"{start_note}: {_amount(start)}")
    c.drawRightString(W - 36, 449, f"Saldo al cierre de m{m}: {_amount(x['caja'])}")

    # Tablas paralelas: cada modelo queda en su propia fila con unidades,
    # precio unitario y subtotal; a la izquierda también aparece su margen.
    c.setFillColor(GREEN)
    c.setFont("DejaVuBold", 8)
    c.drawString(36, 429, "VENTAS A CLIENTES · importe cobrado por modelo")
    c.setFillColor(RED)
    c.drawString(492, 429, "COMPRAS DE STOCK · coste completo por modelo")
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 6.6)
    c.drawString(36, 417, "Margen neto = venta − coste del coche − REBU; antes de nave, nóminas, averías e IS.")
    c.drawString(492, 417, "Coste unitario puesto en A Coruña y listo para anunciar; ver escandallo unitario.")
    sales_rows = _sales_rows(ventas)
    purchase_rows = _purchase_rows(compras)
    table(c, 36, 407,
          ["Modelo", "Uds", "€/ud", "Ventas total", "Margen neto"], sales_rows,
          [118, 30, 78, 102, 104], size=6.8, hrow=10.4,
          aligns=["l", "c", "r", "r", "r"], bold_rows=(len(sales_rows) - 1,))
    table(c, 492, 407,
          ["Modelo", "Uds", "€/ud", "Coste total"], purchase_rows,
          [143, 32, 105, 154], size=7.0, hrow=10.4,
          aligns=["l", "c", "r", "r"], bold_rows=(len(purchase_rows) - 1,))

    # Parte inferior izquierda: fijos repetidos y desglosados en cada mes.
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 8)
    c.drawString(36, 225, "GASTOS RECURRENTES DE LA SL · DESGLOSE DEL MES")
    recurring_rows = [[row["concepto"], _amount(row["importe"])] for row in FIJOS_BASE]
    recurring_rows.extend([
        ["Salario socia empleada (bruto)", _amount(wife["bruto"])],
        ["Seguridad Social empresa sobre su nómina", _amount(wife["ss_empresa"])],
        ["TOTAL GASTO RECURRENTE (incluye coste laboral socia)", _amount(x["fijos"])],
    ])
    table(c, 36, 214, ["Concepto", "Importe"], recurring_rows,
          [332, 100], size=6.65, hrow=9.6, aligns=["l", "r"],
          bold_rows=(len(recurring_rows) - 1,))

    # Parte inferior derecha: puente de caja, con cada salida en línea separada.
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 8)
    c.drawString(492, 225, "MOVIMIENTO DE CAJA · QUÉ ENTRA Y QUÉ SALE")
    # Motor corregido: el IS del ejercicio se paga en caja antes de repartir dividendos.
    impuesto_label = "− Impuesto Sociedades pagado (devengado del ejercicio)"
    cash_rows = [
        ["Caja antes de movimientos del mes", _amount(start)],
        ["+ Cobros de las ventas (brutos)", "+" + _amount(total_ventas)],
        ["− Reserva IVA de margen REBU", _outflow_amount(x["rebu"])],
        ["− Coches comprados, coste completo", _outflow_amount(total_compras)],
        ["− Gastos recurrentes (detalle a la izquierda)", _outflow_amount(x["fijos"])],
        ["− Salario del administrador (bruto pagado)", _outflow_amount(admin_gross)],
        ["− Averías extraordinarias", _outflow_amount(x["averias"])],
        ["− Reforma pagada este mes", _outflow_amount(x["obra"])],
        [impuesto_label, _outflow_amount(x["is_paid"])],
        ["− Dividendos totales repartidos 50/50", _outflow_amount(dividend_gross)],
        ["CAJA AL CIERRE DEL MES", _amount(x["caja"])],
    ]
    table(c, 492, 214, ["Movimiento", "Importe"], cash_rows,
          [324, 108], size=6.45, hrow=9.6, aligns=["l", "r"],
          bold_rows=(len(cash_rows) - 1,))

    # El sueldo del administrador es variable: aquí se muestra lo cobrado y el objetivo.
    c.setFillColor(INK)
    c.setFont("DejaVuBold", 6.5)
    c.drawString(36, 79, "SUELDOS DEL MES · BRUTO, RETENCIONES Y NETO ESTIMADO")
    c.setFont("DejaVu", 6.2)
    admin_cfg = NOMINAS["administrador"]
    admin_rate = round(
        100 * (admin_cfg["retencion_m1_m12"] if m <= 12
               else admin_cfg["retencion_m13_m36"])
    )
    admin_line = (
        f"Admin.: bruto {_amount(admin_gross)} · IRPF mod. {admin_rate}% ({_amount(admin_tax)}) · "
        f"neto {_amount(admin_net)} · objetivo {_amount(admin_target)}."
    )
    wife_line = (
        f"Socia: bruto {_amount(wife['bruto'])} · SS trabajadora {_amount(wife['ss_trabajadora'])} · "
        f"IRPF est. {_amount(wife['irpf_estimado'])} · neto {_amount(wife['neto'])}."
    )
    c.drawString(36, 66, admin_line)
    c.drawString(36, 54, wife_line)

    c.setFillColor(INK)
    c.setFont("DejaVuBold", 6.5)
    c.drawString(492, 79, "DINERO A CASA · NETO ORIENTATIVO DEL MODELO")
    c.setFont("DejaVu", 6.2)
    c.drawString(492, 66,
                 f"Tú: sueldo {_amount(admin_net)} + dividendo {_amount(dividend_net_each)} "
                 f"= {_amount(admin_income_home)}.")
    c.drawString(492, 54,
                 f"Socia: nómina {_amount(wife['neto'])} + dividendo {_amount(dividend_net_each)} "
                 f"= {_amount(wife_income_home)}.")
    c.setFont("DejaVuBold", 6.4)
    c.drawRightString(W - 36, 42, f"TOTAL NETO PAREJA ESTE MES: {_amount(admin_income_home + wife_income_home)}")

    # El stock se valora al coste de entrada, no a un precio de venta hipotético.
    stock_line = (
        f"STOCK AL CIERRE: {x['flota']} coches · {_stock_detalle(stock_mix)} · "
        f"coste inmovilizado {_amount(stock_coste)} (valor de compra, no tasación)."
    )
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVu", 6.25)
    c.drawString(36, 29, stock_line)
    footer(c, n, t)


def _register_month_pages():
    for month in range(1, 37):
        def _make_page(month_number):
            @page
            def p_month(c, n, t):
                _draw_month_detail(c, n, t, month_number)
            p_month.__name__ = f"p_mes_{month_number:02d}"
            return p_month
        _make_page(month)


_register_month_pages()


@page
def p_resumen(c, n, t):
    bg(c)
    heading(c, "Resumen  ·  36 meses", "Lo que os lleváis a casa")
    sd_tot = D["sd"][1] + D["sd"][2] + D["sd"][3]
    se_tot = D["se"][1] + D["se"][2] + D["se"][3]
    dv_tot = D["dv"][1] + D["dv"][2] + D["dv"][3]
    suel_tot = sd_tot + se_tot
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 428, "DINERO QUE ENTRA A CASA POR AÑO (sueldos netos + dividendos netos, la pareja junta)")
    filas = [
        ["Sueldos (tú + ella, neto)", eur(D["sd"][1] + D["se"][1]), eur(D["sd"][2] + D["se"][2]),
         eur(D["sd"][3] + D["se"][3]), eur(suel_tot)],
        ["Dividendos netos (50/50)", eur(D["dv"][1]), eur(D["dv"][2]), eur(D["dv"][3]), eur(dv_tot)],
        ["TOTAL A CASA", eur(D["casa_1"]), eur(D["casa_2"]), eur(D["casa_3"]), eur(D["casa_tot"])],
    ]
    table(c, 36, 410, ["", "Año 1", "Año 2", "Año 3", "Total 36 m"], filas,
          [300, 130, 130, 130, 150], size=9.5, hrow=26, aligns=["l", "r", "r", "r", "r"], bold_rows=(2,))
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 300, "Y QUÉ QUEDA EN LA SL AL MES 36 (mediana, tras repartir dividendos)")
    card(c, 36, 216, 216, 74, "Caja en cuenta", eur(M[36][2]) + " €", "su fondo de 3 meses", acento=GOLD)
    card(c, 264, 216, 216, 74, "Coches en stock", "24", "flota operando", acento=GOLD)
    card(c, 492, 216, 216, 74, "Ventas 36 m", str(int(D["v50"])), "unidades vendidas", acento=GOLD)
    card(c, 720, 216, 204, 74, "Patrimonio SL", eur(D["pat50"]) + " €", "caja + coches − IS", acento=GREEN)
    card(c, 36, 140, 888, 66, "El riesgo y su control", f"~{D['insol']:.0f} % de las trayectorias roza la caja en el arranque",
         "se controla con el fondo de 3 meses y los disparadores: si en m6 hay <5 ventas o la caja no sube, se frena la compra y se adelanta el dividendo", acento=RED)
    footer(c, n, t)


@page
def p_sensibilidad(c, n, t):
    bg(c)
    heading(c, "Sensibilidad  ·  rotación", "Si los coches tardan más en venderse: +20 % y +40 % de días")
    wrap(c, "La hipótesis más frágil del plan es la velocidad de venta (32-58 días por modelo). Esta lámina repite "
            "las MISMAS 250 simulaciones (misma semilla) cambiando un solo número: los días que tarda cada coche "
            "en venderse. Todo lo demás (precios, cupos, fondo, dividendos legales, IS) queda idéntico.",
         36, 448, 890, size=9.5, leading=13, color=SLATE, max_lines=3)
    filas = []
    for k, lab in (("central", "Central (días del plan)"), ("rot+20", "Rotación +20 % (Golf 32→38 d)"),
                   ("rot+40", "Rotación +40 % (Golf 32→45 d)")):
        s = SENS[k]
        filas.append([lab, f"{s['ventas_p50']:.0f}", eur(s["patrimonio_p50"]) + " €",
                      eur(s["casa_p50"]) + " €", f"{s['insolvente_pct']:.1f} %"])
    table(c, 36, 372, ["Escenario (P50, 250 sims)", "Ventas 36 m", "Patrimonio SL", "A casa neto", "% insolvente"],
          filas, [300, 110, 160, 160, 120], size=9.5, hrow=24, aligns=["l", "r", "r", "r", "r"], bold_rows=(0,))
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 268, "LECTURA HONESTA")
    wrap(c, "Con +20 % de días las ventas caen de ~286 a ~208 unidades y el dinero a casa de ~264.000 € a "
            "~124.000 €: el resultado es hipersensible a la rotación (un 20 % menos de velocidad es casi la mitad "
            "de beneficio), porque cada plaza lenta bloquea reinversión. Con +40 % el negocio sigue siendo viable "
            "(patrimonio SL intacto: el stock retiene valor) pero apenas genera caja para repartir, y 1 de cada 3 "
            "trayectorias roza el descubierto.",
         36, 200, 890, size=9.5, leading=13, max_lines=4)
    card(c, 36, 118, 888, 66, "DISPARADOR OPERATIVO (regla de tablero)",
         "Rotación media real > 40 días durante 2 meses seguidos → frenar compra de rotación lenta",
         "medirlo en el ERP desde el mes 1: es LA métrica que decide si el plan se sostiene o se recorta; "
         "los vídeos de revisión y prueba con el cliente son la herramienta para defender los 32-35 días", acento=RED)
    footer(c, n, t)


def main():
    _validate_monthly_detail()
    total = len(PAGES)
    cv = canvas.Canvas(str(OUT), pagesize=(W, H))
    for i, fn in enumerate(PAGES, start=1):
        fn(cv, i, total)
        cv.showPage()
    cv.save()
    print(f"escrito {OUT.name} · {total} láminas")
    print(f"insol {D['insol']:.1f} % · ventas P50 {D['v50']:.0f} · patrimonio P50 {eur(D['pat50'])} · "
          f"obra m{D['obra']:.0f}")
    print(f"a casa: a1 {eur(D['casa_1'])} · a2 {eur(D['casa_2'])} · a3 {eur(D['casa_3'])} · "
          f"total {eur(D['casa_tot'])}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Plan de ejecución paso a paso (SOLO lo decidido). O Milladoiro, 36 meses.

SL 50/50 (tú administrador + ella socia), sin obra al abrir, trío de arranque,
stock 24 plazas, ella socia desde el día 1 + empleada desde el mes 6, dividendos
50/50 a fin de año (se reparte el sobrante sobre el fondo de 3 meses).

Los números salen de `plan_ejecucion.json` (calc_plan.py): mediana de 250
trayectorias del escenario decidido, CON reparto de dividendos a fin de año.

Uso:  python3 calc_plan.py && python3 generar_plan_ejecucion.py
"""
from __future__ import annotations
import json
from pathlib import Path

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import Color, white

HERE = Path(__file__).resolve().parent
OUT = HERE / "Plan_Ejecucion_Paso_a_Paso.pdf"

D = json.loads((HERE / "plan_ejecucion.json").read_text())
M = {int(k): v for k, v in D["mensual"].items()}   # mes -> [ventas, flota, caja]
DI = D["dia1"]            # día 1: [lab, mov, run]
for _k in ("sd", "se", "dv", "div_bruto", "is_anio"):  # años -> int
    D[_k] = {int(k): v for k, v in D[_k].items()}
CD = {int(k): v for k, v in D["compra_det"].items()}   # mes -> {n, eur, mix}
VD = {int(k): v for k, v in D["venta_det"].items()}    # mes -> {n, eur, neto, mix}
FJ = {int(k): v for k, v in D["fijos_m"].items()}      # mes -> fijos (mediana)
SU = {int(k): v for k, v in D["sueldo_m"].items()}     # mes -> sueldo dueño (mediana)
# Trayectoria representativa: la sim cuya caja mes a mes mejor replica la mediana.
# Se usa en el mes a mes: el flujo cuadra al céntimo y la caja coincide con la mediana.
TRAY = D["tray"]    # lista de 36 dicts: mes, caja, flota, fijos, sueldo, ventas_det, compras, ...
OBRA = D["obra"]                # mes mediano en que se paga el RESTO de la obra
OBRA_SUELO = D["obra_suelo"]    # 1 (el suelo se paga en el día 1)
SUELO = 905.0
RESTO_OBRA = 4210.47
# Catálogo completo (15 modelos), del JSON. CAT[nick] = dict(nombre, coste, venta,
# dias, neto, margen_dia, pct). Se usa para mostrar SIEMPRE el precio unitario.
CAT = {c["nick"]: c for c in D["catalogo"]}
NOMBRE_MODELO = {n: c["nombre"] for n, c in CAT.items()}
SHORT = {"116d": "116d", "A3": "A3", "Golf VIII": "Golf", "Leon": "León", "GTI": "GTI",
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
    c.drawCentredString(W / 2, 18, "Plan de ejecución  ·  O Milladoiro  ·  36 meses  ·  mediana de 250 trayectorias")
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
    c.drawString(60, 58, "Todo lo decidido: la estructura, los gastos, la caja mes a mes y el plan de pago.")
    footer(c, n, t, True)


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
        ["(alquiler 1.200 + comunidad 150 + luz 50 + seguro 60 + tasas 25 → fijos)", "—", "—"],
    ])
    card(c, 36, 205, 430, 76, "Coste del paso (día 1)", "3.200 €", "fianza 2.400 + licencia 800", acento=GOLD)
    card(c, 494, 205, 430, 76, "Caja tras este paso", eur(DI[3][2]) + " €", "el alquiler se paga mes a mes", acento=GREEN)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 189, "Fijos mensuales (ya están en la caja de cada mes)")
    wrap(c, "Alquiler 1.200 · Comunidad 150 · Luz 50 · Seguro 60 · Tasas 25 · Portales/mkt 250 · RETA (tú) "
            "448,69 → 2.184 €/mes. Desde el mes 6 se suma la nómina de ella a media jornada (979 € con cuota "
            "patronal) → 3.163 €/mes; desde el 16, completa (1.959 €) → 4.143 €/mes.",
         36, 173, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
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
            "se reemplaza enseguida. El ciclo por unidad (los papeles no frenan nada: se vende con matrículas "
            "temporales y la gestoría termina la documentación):",
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


def _ventas_str(dets, maxn=6):
    """'4× León @17.500 · 2× GTI @18.500 …' (precio de venta unitario)."""
    from collections import Counter
    cnt = Counter(n for n, *_ in dets)
    parts = [f"{k}× {SHORT.get(n, n)} @{eur(CAT[n]['venta'])}" for n, k in cnt.most_common(maxn)]
    s = " · ".join(parts)
    resto = [k for _, k in cnt.most_common()[maxn:]]
    if resto:
        s += f"  · +{sum(resto)} más"
    return s


def _compras_str(dets, maxn=6):
    """'2× Corolla @14.500 · 1× XC60 @22.500 …' (precio de compra unitario)."""
    from collections import Counter
    cnt = Counter(n for n, _ in dets)
    parts = [f"{k}× {SHORT.get(n, n)} @{eur(CAT[n]['coste'])}" for n, k in cnt.most_common(maxn)]
    s = " · ".join(parts)
    resto = [k for _, k in cnt.most_common()[maxn:]]
    if resto:
        s += f"  · +{sum(resto)} más"
    return s


def _stock_str(mix, maxn=8):
    """'2× León · 2× 116d · 1× XC60 …' (composición del stock por modelo)."""
    items = sorted(mix.items(), key=lambda kv: (-kv[1], NOMBRE_MODELO.get(kv[0], kv[0])))
    parts = [f"{k}× {SHORT.get(n, n)}" for n, k in items[:maxn]]
    s = " · ".join(parts)
    if len(items) > maxn:
        s += f"  · +{sum(k for _, k in items[maxn:])} más"
    return s or "vacío"


def _mes_det(c, y, m, title, nota):
    """Un mes en detalle (trayectoria exacta). Devuelve la y del siguiente."""
    x = TRAY[m - 1]
    end = x["caja"]
    start = DI[7][2] if m == 1 else TRAY[m - 2]["caja"]
    nv = len(x["ventas_det"]); nc = len(x["compras"])
    V = sum(e for _, e, _ in x["ventas_det"])
    C_ = sum(co for _, co in x["compras"])
    R = x["rebu"]; S = x["sueldo"]; O = x["obra"]; I = x["is_paid"]; Dv = x["div"]; A = x["averias"]
    mix = x.get("stock_mix", {})
    stock_valor = sum(k * CAT[n]["coste"] for n, k in mix.items())
    # cabecera
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, y, f"MES {m}")
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 10)
    c.drawString(82, y, title)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 8.5)
    c.drawRightString(W - 36, y, f"Caja {eur(start)} € → {eur(end)} € · flota {x['flota']}")
    y -= 12
    # ventas (con precio unitario por modelo)
    c.setFillColor(GREEN)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(82, y, "VENDEN")
    c.setFillColor(INK)
    c.setFont("DejaVu", 8)
    c.drawString(140, y, _ventas_str(x["ventas_det"]) if nv else "— (sin ventas este mes)")
    if nv:
        c.setFillColor(GREEN)
        c.setFont("DejaVuBold", 8)
        c.drawRightString(W - 36, y, f"{nv} coches · +{eur(V)} €")
    y -= 11
    # compras (con precio unitario por modelo)
    c.setFillColor(RED)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(82, y, "COMPRAN")
    c.setFillColor(INK)
    c.setFont("DejaVu", 8)
    c.drawString(140, y, _compras_str(x["compras"]) if nc else "— (sin compras este mes)")
    if nc:
        c.setFillColor(RED)
        c.setFont("DejaVuBold", 8)
        c.drawRightString(W - 36, y, f"{nc} coches · −{eur(C_)} €")
    y -= 11
    # STOCK (siempre visible): composición por modelo + valor inmovilizado
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(82, y, "STOCK")
    c.setFillColor(INK)
    c.setFont("DejaVu", 8)
    c.drawString(140, y, f"{x['flota']} coches · {_stock_str(mix)}")
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVu", 8)
    c.drawRightString(W - 36, y, f"valor {eur(stock_valor)} €")
    y -= 12
    # otros gastos (fijos, sueldo, obra, IS, dividendo, averías, IVA)
    parts = ["fijos " + ("pagados el día 1" if m == 1 else f"−{eur(x['fijos'])} €")]
    if S > 0.5:
        parts.append(f"tu sueldo −{eur(S)} €")
    if O > 0.5:
        parts.append(f"obra (resto) −{eur(O)} €")
    if I > 0.5:
        parts.append(f"IS a AEAT −{eur(I)} €")
    if Dv > 0.5:
        parts.append(f"dividendo 50/50 −{eur(Dv)} €")
    if A > 0.5:
        parts.append(f"averías −{eur(A)} €")
    parts.append(f"IVA de la ganancia −{eur(R)} €")
    c.setFillColor(SLATE)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(82, y, "GASTOS")
    c.setFillColor(INK)
    c.setFont("DejaVu", 8)
    c.drawString(140, y, " · ".join(parts))
    y -= 12
    # explicación (1-2 líneas)
    if nota:
        h = wrap(c, "·  " + nota, 82, y, W - 36 - 82, size=7.5, leading=10, color=SLATE, max_lines=2)
        y -= h
    # separador
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(36, y - 2, W - 36, y - 2)
    return y - 13


# Títulos y explicación de cada mes (trayectoria representativa; el flujo cuadra al céntimo)
TIT = {
    1: "Apertura: SL, nave y suelo", 2: "El trío empieza a girar",
    3: "Primeras ventas y reposición", 4: "3 ventas, 4 reposiciones", 5: "Reposición (3 compras)",
    6: "Entran los sueldos (ella a medias)", 7: "3 ventas, 3 compras",
    8: "Ritmo de 2 ventas", 9: "Primer sueldo tuyo", 10: "La caja respira",
    11: "Mes tranquilo", 12: "Año 1: dividendo 50/50",
    13: "La flota toca 6 · 5 ventas", 14: "5 ventas, 6 compras", 15: "La flota toca 8",
    16: "Ella a completa · 7 ventas", 17: "La flota toca 10", 18: "Mes de 9 ventas",
    19: "IS año 1 · flota 12 · 10 ventas", 20: "Mes de 6 ventas", 21: "9 ventas, 10 compras",
    22: "Mes de 13 ventas · flota 16", 23: "La flota toca 18", 24: "Año 2: dividendo 50/50",
    25: "Casi llena (21) · 14 ventas", 26: "Se paga el resto de la obra", 27: "La nave llena: 24 coches",
    28: "Mes de 17 ventas", 29: "La caja pasa de 130.000 €", 30: "La caja pasa de 170.000 €",
    31: "IS año 2 · 21 ventas", 32: "La caja pasa de 240.000 €", 33: "La caja pasa de 270.000 €",
    34: "Mes de 17 ventas", 35: "El pico de caja", 36: "El dividendo gordo",
}
NOTA = {
    1: "Se abren la SL y la nave y se pinta el suelo (nave vacía). El trío (116d, A3, GTI) llega esta semana y ya "
       "se vende un 116d (12.475 €) y se compra un León (12.900 €). Caja 4.787 €.",
    2: "Gira el trío: se vende el Audi A3 (15.990 €) y se compra otro León (12.900 €). La caja se mantiene estable.",
    3: "Se vende un León (17.500 €) y se reponen otros: empieza el ritmo de comprar y vender cada semana.",
    4: "Primer mes con volumen: 3 ventas (2× León, 1× GTI) y 4 reposiciones. La caja sube a 10.907 €.",
    5: "Mes de reposición (3 compras, 2× 116d y 1× Polo); la caja baja a 5.551 € pero no roza el fondo.",
    6: "Empiezan los sueldos: el de ella a media jornada (750 €) entra en fijos (3.163 €) y el fondo de 3 meses pasa a 9.490 €.",
    7: "Ritmo de 3 ventas (Polo, 116d, León): la nave ya rota con soltura.",
    8: "Dos ventas, dos compras; la caja sube a 14.762 €.",
    9: "La caja lo permite: por primera vez te llevas parte del hueco como sueldo (2.083 €).",
    10: "Mes de 2 ventas (León, 116d); la caja toca 16.155 €.",
    11: "Mes tranquilo (1 venta, 1 compra); la caja respira.",
    12: "Cierra el año 1: se reparte el dividendo 50/50 (6.665 € brutos); la SL se queda su fondo (9.490 €).",
    13: "La flota toca 6. Hay una avería mayor (3.701 €): normal al importar, contemplada en el coste.",
    14: "5 ventas y 6 compras: la flota crece hacia 8.",
    15: "La flota toca 8; mes de 5 ventas (2× GTI, 116d, 2× Polo, León).",
    16: "El sueldo de ella se dobla a completa (1.500 €): fijos 4.143 € y fondo 12.428 €. Mes de 7 ventas.",
    17: "La flota toca 10; 5 ventas (2× 116d, GTI, Golf, A3).",
    18: "Mes de 9 ventas; la flota llega a 11.",
    19: "Se ingresa en AEAT el IS del año 1 (4.193 €). La flota toca 12; 10 ventas.",
    20: "Mes de 6 ventas (GTI, Polo, 2× Golf, 2× Corolla); la caja pasa de 26.000 €.",
    21: "9 ventas y 10 compras; ya entra el primer Peugeot 3008 (15.500 €). La flota toca 14.",
    22: "Mes de 13 ventas; ya rotan también los modelos grandes (3008, Tiguan). La flota toca 16.",
    23: "La flota toca 18; mes de 13 ventas. Entra el primer Mercedes C (17.666 €).",
    24: "Cierra el año 2: se reparte el dividendo 50/50 (35.994 € brutos). Entra el primer BMW X1 (17.500 €).",
    25: "La nave ya tiene 21 coches; mes de 14 ventas. Entra el primer Volvo XC60 (22.500 €).",
    26: "La caja lo permite: se paga el RESTO de la obra (4.210 €: luz, pintura, señalización, mobiliario, seguridad). 14 ventas.",
    27: "La nave se llena (24 coches) y la flota ya tiene los 15 modelos: cada ciclo venta + reposición suma su margen.",
    28: "Mes de 17 ventas (y 17 reposiciones): la caja pasa de 100.000 €.",
    29: "La caja pasa de 130.000 €.",
    30: "La caja pasa de 170.000 €.",
    31: "Se ingresa en AEAT el IS del año 2 (36.518 €). Mes de 21 ventas.",
    32: "La caja pasa de 240.000 €.",
    33: "La caja pasa de 270.000 €.",
    34: "Mes de 17 ventas; la caja sube en línea recta hacia el dividendo.",
    35: "La caja toca su pico (357.357 €) justo antes del dividendo grande.",
    36: "Cierra el año 3: se reparte el dividendo gordo (382.811 € brutos) y la SL se queda su fondo (12.428 €).",
}


def _mes_page(c, n, t, pag, m0, m1, titulo, intro):
    bg(c)
    heading(c, f"Mes a mes  ·  {pag} de 9", titulo)
    wrap(c, intro, 36, 448, 890, size=9, leading=12, max_lines=2)
    wrap(c, "Cada mes, lo que se VENDE y se COMPRA con el precio de cada coche (n× modelo @ precio), la línea "
            "STOCK (qué hay en la nave y su valor), los gastos y la caja al final. Es la trayectoria representativa "
            "(la que mejor replica la mediana de 250); el flujo cuadra al céntimo.",
         36, 430, 890, size=8, leading=10, color=SLATE, max_lines=2)
    y = 404
    for m in range(m0, m1 + 1):
        y = _mes_det(c, y, m, TIT[m], NOTA[m])
    footer(c, n, t)


@page
def p_mes_1_4(c, n, t):
    _mes_page(c, n, t, 1, 1, 4, "Meses 1 a 4: el arranque",
              f"La caja sale del día 1 en {eur(DI[7][2])} €. El trío (116d, A3, GTI) llega en m1 y desde ya se "
              f"venden y se compran coches (con su precio). Lo más justo es m1-m5, cuando la caja está cerca del fondo.")


@page
def p_mes_5_8(c, n, t):
    _mes_page(c, n, t, 2, 5, 8, "Meses 5 a 8: el ritmo empieza",
              "La flota se mantiene en 5 y se venden 1-3 coches al mes. En m6 entra el sueldo de ella a media "
              "jornada (750 €) y suben los fijos a 3.163 €.")


@page
def p_mes_9_12(c, n, t):
    _mes_page(c, n, t, 3, 9, 12, "Meses 9 a 12: cierra el año 1",
              "En m9, por primera vez, te llevas parte del hueco como sueldo. Hay averías puntuales "
              "(contempladas). Al cerrar el año 1 se reparte el dividendo 50/50: la SL se queda su fondo (9.490 €).")


@page
def p_mes_13_16(c, n, t):
    _mes_page(c, n, t, 4, 13, 16, "Meses 13 a 16: el despegue",
              "Las ventas suben (5-7/mes) y la flota crece de 6 a 9. En m16 ella pasa a jornada completa "
              "(1.500 €) y el fondo sube a 12.428 €.")


@page
def p_mes_17_20(c, n, t):
    _mes_page(c, n, t, 5, 17, 20, "Meses 17 a 20: arranca el año 2",
              "La flota crece de 10 a 13 y el sueldo tuyo crece con el beneficio. En m19 se ingresa en AEAT el IS "
              "del año 1 (4.193 €).")


@page
def p_mes_21_24(c, n, t):
    _mes_page(c, n, t, 6, 21, 24, "Meses 21 a 24: entran los grandes",
              "Meses de 9-13 ventas; ya rotan los modelos grandes (3008, Tiguan, Mercedes, XC40) con ticket y "
              "margen mayores. Al cerrar el año 2 se reparte el dividendo 50/50.")


@page
def p_mes_25_28(c, n, t):
    _mes_page(c, n, t, 7, 25, 28, "Meses 25 a 28: la nave llena",
              "En m26 se paga el resto de la obra (4.210 €) y en m27 la flota llega a 24 con los 15 modelos "
              "(la nave llena). A partir de ahí se reponen coches al mismo ritmo que se venden.")


@page
def p_mes_29_32(c, n, t):
    _mes_page(c, n, t, 8, 29, 32, "Meses 29 a 32: la caja acelera",
              "Nave llena y la caja sube de 130.000 € a 240.000 €. En m31 se ingresa en AEAT el IS del año 2 "
              "(36.518 €).")


@page
def p_mes_33_36(c, n, t):
    _mes_page(c, n, t, 9, 33, 36, "Meses 33 a 36: el último año",
              "La caja pasa de 270.000 € y toca su pico en m35 (357.357 €). Al cerrar el año 3 se reparte el "
              "dividendo gordo (382.811 € brutos) y la SL se queda su fondo (12.428 €).")


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


def main():
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

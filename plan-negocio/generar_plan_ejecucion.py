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
for _k in ("sd", "se", "dv"):                       # años -> int
    D[_k] = {int(k): v for k, v in D[_k].items()}

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
        "Sin obra al abrir: la reforma entra cuando la caja la aguanta",
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
    heading(c, "Paso 2  ·  Día 1", "La nave: O Milladoiro, sin obra al abrir")
    wrap(c, "Firmáis O Milladoiro: 465 m², almacén 40 × 10 m, 8 m de alto. Se abre tal cual (está apta; la "
            "reforma es mayormente visual). La obra de imagen (5.115 €) se aplaza hasta que la caja la pague "
            "sin tocar el fondo (mediana: mes 26, cuando la flota ya está llena).",
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
    card(c, 36, 72, 888, 66, "Por qué no hacer la obra ahora", "Se hace cuando la caja la pague sola",
         "5.115 € de golpe al abrir bajarían la caja por debajo del fondo; en el plan se paga en el mes 26 con 2 meses de margen", acento=RED)
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
    c.drawString(36, 296, "CAJA TRAS CERRAR EL DÍA 1")
    _paso_caja(c, 278, [
        ["Kit de equipo y detallado", f"−{eur(D['kit'])}", eur(DI[4][2]) + " €"],
        ["Trío de arranque (los 3 coches)", f"−{eur(D['trio_coste'])}", eur(DI[5][2]) + " €"],
        ["Gastos fijos del mes 1", f"−{eur(D['fijos1'])}", eur(DI[6][2]) + " €"],
    ], bold_rows=(2,))
    card(c, 36, 119, 888, 74, "CAJA DE APERTURA", eur(DI[6][2]) + " €",
         "el punto de partida del mes 1. El fondo de emergencia (3 meses ≈ 6.550 € sin nómina) casi coincide: no se toca hasta que entre caja de ventas", acento=RED)
    wrap(c, "Regla: nunca se compra un coche que baje la caja por debajo de 1 mes de fijos. Al principio se "
            "compra con el fondo; cuando la flota llega al objetivo, solo con lo que sobre de 3 meses.",
         36, 103, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
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
            "cuando hace falta rapidez; lo normal, envío (igual de rápido). Nunca se compra el BMW 318d (rota "
            "demasiado lento para el capital que inmoviliza).",
         36, 318, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 272, "LA FLOTA CRECE ASÍ (mediana de 250 trayectorias)")
    meses_sel = [1, 6, 12, 18, 24, 26, 36]
    table(c, 36, 254, [""] + [f"m{m}" for m in meses_sel], [
        ["Coches en stock"] + [str(int(round(M[m][1]))) for m in meses_sel],
        ["Ventas del mes"] + [str(int(round(M[m][0]))) for m in meses_sel],
    ], [170, 112, 112, 112, 112, 112, 112, 112], size=9, hrow=19, aligns=["l"] + ["c"] * 7)
    wrap(c, "La flota no llega a 24 coches hasta el mes 26: se va comprando con la caja que entra de las "
            "ventas (menos si ese año se reparten dividendos). No hace falta (ni cabe) financiar: el negocio "
            "se financia a sí mismo.",
         36, 196, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    card(c, 36, 92, 888, 66, "Disciplina de compra", "Comprar por margen, no por ganas",
         "cada compra exige margen claro y rotación; si la caja no llega, se espera un coche menos, nunca se rompe el fondo", acento=GOLD)
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
         "la nómina fija es lo que hunde la caja en el arranque; a media el insolvente baja del 16 % al 10 %", acento=GOLD)
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
    heading(c, "Paso 7  ·  Mes 26", "La obra: cuando la caja la pague sola")
    wrap(c, "La reforma de imagen (5.115 €: pintura, suelo, frontis) se hace cuando la flota ya está llena y la "
            "caja la paga sin tocar el fondo. En el plan, la mediana es el mes 26 (el rango según las "
            "trayectorias, 7-36). Siempre con 2 meses de fijos de margen antes de pagarla.",
         36, 442, 890, size=10, leading=14, max_lines=2)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 394, "LA REGLA DE LA OBRA")
    card(c, 36, 306, 284, 76, "Importe", "5.115 €", "pintura, suelo, frontis, imagen", acento=GOLD)
    card(c, 336, 306, 284, 76, "Cuándo", "mes 26 (mediana)", "flota llena (24 coches)", acento=GREEN)
    card(c, 636, 306, 288, 76, "Condición", "fondo + obra + 2 meses", "si no se cumple, se aplaza", acento=RED)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 270, "QUÉ PASA CON LA CAJA ALREDEDOR")
    table(c, 36, 254, ["Mes", "Flota", "Caja fin de mes", "Qué ocurre"], [
        ["25", str(int(round(M[25][1]))), eur(M[25][2]) + " €", "la flota casi llena (23)"],
        ["26", str(int(round(M[26][1]))), eur(M[26][2]) + " €", "flota completa (24) + se paga la obra (−5.115)"],
        ["27", str(int(round(M[27][1]))), eur(M[27][2]) + " €", "sigue subiendo caja"],
        ["28", str(int(round(M[28][1]))), eur(M[28][2]) + " €", "sigue subiendo caja"],
    ], [70, 90, 210, 528], size=9, hrow=18, aligns=["c", "c", "r", "l"], bold_rows=(1,))
    wrap(c, "La obra no crea ventas (es visual), pero protege la imagen cuando el local ya está a pleno "
            "rendimiento. Por eso no se adelanta: cada mes que se aplaza, esos 5.115 € siguen en la caja "
            "trabajando (comprando coches que rinden ~25 % neto).",
         36, 150, 890, size=9.5, leading=13, color=SLATE, max_lines=2)
    card(c, 36, 48, 888, 64, "Regla", "La obra nunca toca el fondo de emergencia",
         "si el mes no alcanza (fondo 3 meses + obra + 2 meses), se aplaza; el negocio no se para por la pintura", acento=RED)
    footer(c, n, t)


def _tabla_mes(c, y, m0, m1, notas):
    filas = []
    for m in range(m0, m1 + 1):
        v, f, caja = M[m]
        filas.append([str(m), str(int(round(v))), str(int(round(f))), eur(caja) + " €", notas.get(m, "")])
    return table(c, 36, y, ["Mes", "Ventas", "Flota", "Caja fin de mes", "Suceso"],
                 filas, [56, 70, 70, 150, 544], size=8.5, hrow=17, aligns=["c", "c", "c", "r", "l"])


@page
def p_mes_1_12(c, n, t):
    bg(c)
    heading(c, "Mes a mes  ·  1 de 3", "Los meses 1 a 12: el arranque")
    wrap(c, f"La caja empieza en {eur(DI[6][2])} € (día 1). Lo más justo es el arranque (meses 1-4): el punto "
            f"más bajo de la mediana es ~{eur(D['minc'])} €, a mitad de mes, justo después de una compra (a fin "
            f"de mes queda ~6.500-8.000 €, cerca del fondo). El fondo de emergencia (3×fijos) está en 6.552 € y "
            f"sube a 9.490 € en el mes 6, cuando entran las nóminas: la tuya y la de ella a media jornada (750 €).",
         36, 442, 890, size=9.5, leading=13, max_lines=3)
    notas = {
        1: "apertura: trío en stock, caja 8.454 €",
        4: f"punto más bajo ~{eur(D['minc'])} € (mitad de mes, tras comprar)",
        6: "entran las nóminas: la tuya (2.083 €) y la de ella a MEDIA (750 €)",
        12: "cierre año 1: dividendo 50/50 (caja → 9.490 €)",
    }
    _tabla_mes(c, 396, 1, 12, notas)
    card(c, 36, 60, 888, 66, "Cómo leerlo", "Caja fin de mes = lo que queda en la cuenta de la SL",
         f"{D['insol']:.0f} % de las trayectorias se ponen negativas un momento en el arranque: se controla con el fondo y no comprar por debajo de 1 mes de fijos", acento=GOLD)
    footer(c, n, t)


@page
def p_mes_13_24(c, n, t):
    bg(c)
    heading(c, "Mes a mes  ·  2 de 3", "Los meses 13 a 24: el despegue")
    wrap(c, "El año 2 despegan las ventas y la flota crece de 7 a 20 coches. En el mes 16 ella pasa a jornada "
            "COMPLETA (1.500 €) y el fondo sube a 12.428 €. La caja sube hasta ~43.000 € y, al cerrar el año "
            "(mes 24), se reparte el dividendo 50/50: la SL se queda su fondo (12.428 €) y el sobrante va a casa.",
         36, 442, 890, size=9.5, leading=13, max_lines=3)
    notas = {
        13: "sube el sueldo tuyo (año 2: 3.846 €)",
        16: "ella pasa a jornada COMPLETA (1.500 €); el fondo sube a 12.428 €",
        19: "se paga el IS del año 1",
        24: "cierre año 2: dividendo 50/50 (caja → 12.428 €)",
    }
    _tabla_mes(c, 396, 13, 24, notas)
    card(c, 36, 60, 888, 66, "El punto de inflexión", "del mes 16 en adelante la caja ya no vuelve a bajar del fondo",
         "es cuando el negocio se financia a sí mismo sin depender del capital inicial", acento=GREEN)
    footer(c, n, t)


@page
def p_mes_25_36(c, n, t):
    bg(c)
    heading(c, "Mes a mes  ·  3 de 3", "Los meses 25 a 36: la nave llena")
    wrap(c, "En el mes 26 la flota llega a 24 coches (la nave llena) y se paga la obra (−5.115 €): de aquí al 36 "
            "todo el beneficio es caja. La caja sube en línea recta hasta ~398.000 € (mes 35). Al cerrar el año "
            "(mes 36) se reparte el dividendo del año 3 (el gordo): ~311.000 € netos van a casa y la SL se queda "
            "su fondo (12.428 €).",
         36, 442, 890, size=9.5, leading=13, max_lines=3)
    notas = {
        26: "flota completa (24) + se paga la obra (−5.115 €)",
        31: "se paga el IS del año 2",
        35: "pico de caja (~398.000 €) antes del dividendo",
        36: "cierre año 3: el dividendo gordo (~311.000 € netos; caja → 12.428 €)",
    }
    _tabla_mes(c, 396, 25, 36, notas)
    card(c, 36, 60, 888, 66, "El mes 36", "la SL se queda su fondo + 24 coches operando",
         "los ~311.000 € netos del dividendo ya están en casa; la SL sigue viva y productiva para el año 4", acento=GREEN)
    footer(c, n, t)


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

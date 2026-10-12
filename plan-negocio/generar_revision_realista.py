#!/usr/bin/env python3
"""Genera `Revision_Realista_Arranque.pdf`: el análisis completo del arranque.

Todas las cifras salen EN VIVO de `modelo_realista.py` (250 simulaciones por
escenario), así que el PDF no puede contradecir al modelo: si el modelo cambia,
se vuelve a lanzar este generador y el PDF se actualiza solo.

    python3 generar_revision_realista.py
"""

from __future__ import annotations

import importlib.util
import random
import sys
from pathlib import Path

from reportlab.lib.colors import Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

spec = importlib.util.spec_from_file_location("mr", str(HERE / "modelo_realista.py"))
mr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mr)
g = mr.g

OUT = HERE / "Revision_Realista_Arranque.pdf"
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

SIM = 250
SEED = 41


# --- Cálculo -----------------------------------------------------------------
def _rs(est, sims=SIM, seed=SEED):
    return [mr.simular(est, random.Random(seed * 7919 + i)) for i in range(sims)]


def _q(rs, k, p):
    xs = sorted(r[k] for r in rs)
    return xs[min(len(xs) - 1, int(p * len(xs)))]


def medir(est, sims=SIM):
    rs = _rs(est, sims)
    tot = [d for r in rs for _, d in r["detalle_ventas"]]
    return dict(
        ventas=_q(rs, "ventas", .5), p10=_q(rs, "patrimonio", .1), p50=_q(rs, "patrimonio", .5),
        p90=_q(rs, "patrimonio", .9), caja=_q(rs, "caja", .5), sueldo=_q(rs, "sueldos", .5),
        riesgo=sum(1 for r in rs if r["insolvente"]) / len(rs),
        pozo=sum(1 for r in rs if r["min_caja"] < -3000) / len(rs),
        recortes=sum(r["reducidos"] for r in rs) / len(rs),
        ciclo=sum(tot) / len(tot), rs=rs,
        dia1=sorted(r["meses"][0]["caja"] for r in rs)[len(rs) // 2],
        obra_mes=(sorted(m for m in (r["reforma_mes"] for r in rs) if m)[
            max(0, sum(1 for r in rs if r["reforma_mes"]) // 2 - 1)] if any(r["reforma_mes"] for r in rs) else None),
        obra_pct=100 * sum(1 for r in rs if r["reforma_mes"]) / len(rs),
        min_caja=sorted(r["min_caja"] for r in rs)[len(rs) // 2],
    )


PEQ = dict(mr.ESTRATEGIAS["pequena"], objetivo_flota=7)
PLAN = dict(mr.ESTRATEGIAS["plan_actual"])
D12 = dict(mr.ESTRATEGIAS["pequena_luego_milladoiro"], objetivo_flota=12)

M = {}
M["plan"] = medir(PLAN)
M["plan7"] = medir(dict(PLAN, objetivo_flota=7))
M["peq"] = medir(PEQ)
M["peq5"] = medir(dict(mr.ESTRATEGIAS["pequena"], objetivo_flota=5))
M["nave"] = medir(dict(mr.ESTRATEGIAS["sin_nave"]))
M["mud10"] = medir(dict(mr.ESTRATEGIAS["pequena_luego_milladoiro"], objetivo_flota=10))
M["mud12"] = medir(D12)
M["mud12fam"] = medir(dict(D12, politica="familia"))
# Curva de plazas, toda con las reglas de la decisión (sin obra el día 1):
# hasta 7 plazas no hay nave de 465 m² que firmar, así que se mide con la nave
# pequeña; de 10 en adelante, con O Milladoiro.
M["stock"] = {n: medir(dict(mr.ESTRATEGIAS["pequena_sin_reforma"], objetivo_flota=n))
              for n in (3, 4, 5, 6, 7)}
M["vel"] = {
    "Pesimista 45-70 d": medir(dict(PEQ, dias_unidad=mr.DIAS_PESIMISTA)),
    "Base 32-55 d": M["peq"],
    "Optimista 22-45 d": medir(dict(PEQ, dias_unidad=mr.DIAS_OPTIMISTA)),
    "Catálogo 18-25 d": medir(dict(PEQ, dias_unidad=mr.DIAS_CATALOGO)),
}
M["dem"] = {
    "−40 %": medir(dict(PEQ, demanda=0.6)), "−25 %": medir(dict(PEQ, demanda=0.75)),
    "Base": M["peq"], "+25 %": medir(dict(PEQ, demanda=1.25)), "+50 %": medir(dict(PEQ, demanda=1.5)),
}
M["dem_plan"] = medir(dict(PLAN, demanda=0.6))
M["lead"] = {l: medir(dict(PEQ, lead=l)) for l in (0.5, 1.0, 1.5, 3.0)}
M["tray"] = mr.trayectoria(PEQ, sims=300)

# --- la decisión del local (12/10/2026): nave de paso contra nave definitiva ---
MUDA = 2500.0            # transporte, rótulos, suministros y tiempo
OBRA_MOVIBLE = 2045.0    # luces LED + alarma/cámaras + limpieza y extintores: se desmonta o se reutiliza
OBRA_SUNK = 1384.0       # suelo epoxi 905 + pintura 479: en una nave de paso, dinero perdido
M["local"] = {
    "peq_fija": medir(dict(mr.ESTRATEGIAS["pequena_sin_reforma"], objetivo_flota=7)),
    "peq_muda": medir(dict(mr.ESTRATEGIAS["pequena_sin_reforma"], objetivo_flota=12,
                           nave_destino=mr.NAVES["milladoiro"], nave_destino_mes=15,
                           tope_modelo=2, muda=MUDA)),
    "grande12": medir(dict(mr.ESTRATEGIAS["milladoiro_sin_reforma"], objetivo_flota=12)),
    "grande14": medir(dict(mr.ESTRATEGIAS["milladoiro_sin_reforma"])),
    "obra_min": medir(dict(mr.ESTRATEGIAS["milladoiro_sin_reforma"], reforma_a=OBRA_MOVIBLE)),
    "obra_todo": medir(dict(mr.ESTRATEGIAS["milladoiro_fases"])),
    "plan_hoy": M["plan"],
}
# --- la decisión tomada (12/10/2026): O Milladoiro sin obra al abrir ---
DEC = dict(mr.ESTRATEGIAS["decision"], objetivo_flota=14)
M["dec"] = medir(DEC)
M["dec_mes9"] = medir(dict(DEC, reforma_b_mes=9))
M["dec_mes6"] = medir(dict(DEC, reforma_b_mes=6))
M["dec_margen0"] = medir(dict(DEC, reforma_margen=0.0))
M["dec_margen4"] = medir(dict(DEC, reforma_margen=4.0))
M["dec_nunca"] = medir(dict(mr.ESTRATEGIAS["milladoiro_sin_reforma"], objetivo_flota=14))
M["dec_obradia1"] = M["plan"]
M["dec_mal"] = medir(dict(DEC, demanda=0.6))
M["dem_dec"] = {
    "−40 %": M["dec_mal"], "−25 %": medir(dict(DEC, demanda=0.75)), "Base": M["dec"],
    "+25 %": medir(dict(DEC, demanda=1.25)), "+50 %": medir(dict(DEC, demanda=1.5)),
}
M["lead_dec"] = {l: medir(dict(DEC, lead=l)) for l in (0.5, 1.0, 1.5, 3.0)}
M["dec_img10"] = medir(dict(DEC, dias=1.10))
M["dec_img20"] = medir(dict(DEC, dias=1.20))

# --- el techo físico de la nave (dato del dueño, 12/10/2026: espiga 24 / mixta 28) ---
def _cap(plazas, objetivo, tope, personal=2500.0, desde=13, **kw):
    return medir(dict(mr.ESTRATEGIAS["decision"], reforma_b_mes=4, reforma_margen=2.0,
                      nave=dict(mr.NAVES["milladoiro"], plazas=plazas),
                      objetivo_flota=objetivo, tope_modelo=tope,
                      personal=personal, personal_desde=desde, **kw))

M["cap"] = {14: _cap(14, 14, 2, personal=0.0), 16: _cap(16, 16, 2, personal=0.0),
            20: _cap(20, 20, 3), 24: _cap(24, 24, 3), 28: _cap(28, 28, 4)}
M["cap_lento"] = _cap(24, 24, 3, dias=1.10)
M["stock_mud"] = {n: _cap(n, n, 2 if n <= 16 else (3 if n <= 24 else 4),
                          personal=0.0 if n <= 16 else 2500.0, desde=13)
                  for n in (10, 12, 14, 16, 20, 24, 28)}
# ocupación de la decisión (14 plazas): cuántos meses está llena y por qué no lo está
_simsdec = M["dec"]["rs"]
_lleno = sum(1 for r in _simsdec for m in r["meses"] if m["flota"] >= 14)
_sin_dinero = sum(1 for r in _simsdec for m in r["meses"]
                  if m["flota"] < 14 and (m["caja"] - m["floor"]) < 9010)
M["ocup"] = dict(lleno=_lleno / len(_simsdec), libre=36 - _lleno / len(_simsdec),
                 sin_dinero=_sin_dinero / len(_simsdec),
                 con_dinero=36 - _lleno / len(_simsdec) - _sin_dinero / len(_simsdec),
                 ocioso=300012)

M["local_mal"] = {
    "peq_muda": medir(dict(mr.ESTRATEGIAS["pequena_sin_reforma"], objetivo_flota=12,
                           nave_destino=mr.NAVES["milladoiro"], nave_destino_mes=15,
                           tope_modelo=2, muda=MUDA, demanda=0.6)),
    "grande14": medir(dict(mr.ESTRATEGIAS["milladoiro_sin_reforma"], demanda=0.6)),
    "plan_hoy": M["dem_plan"],
}

# ocupación
rs = M["dec"]["rs"]        # la decisión: O Milladoiro, 14 plazas, sin obra al abrir
lleno = sorted(sum(1 for m in r["meses"] if m["flota"] >= 14) for r in rs)
libre = sin_dinero = 0
for r in rs:
    for m in r["meses"]:
        if m["flota"] < 14:
            libre += 1
            if (m["caja"] - m["floor"]) < 9010:      # ni siquiera para el 116d más barato
                sin_dinero += 1
LLENO_MESES = lleno[len(lleno) // 2]
PLAZAS_LIBRES = libre / len(rs)
SIN_DINERO = sin_dinero / len(rs)
OCIOSO = sorted(max(0.0, r["meses"][35]["caja"] - r["meses"][35]["floor"]) for r in rs)[len(rs) // 2]
rsm = M["mud12"]["rs"]
NAVES_MES = sorted(r["nave_mes"] for r in rsm if r["nave_mes"])
MUD_MES = NAVES_MES[len(NAVES_MES) // 2]

COSTES_FALTAN = [("Licencia de apertura y técnico", 800.0), ("Constitución de la Sociedad Limitada", 1200.0)]
DIA1_PLAN = round(50000 - g.KIT - 1200 - 2 * 1200 - 800 - mr.REFORMA_A - (12674 + 12674 + 9010) - 2183.69, 2)
FONDO_PLAN = round(3 * 2183.69, 2)
DIA1_PEQ = round(50000 - g.KIT - 1200 - 2 * 600 - 800 - mr.REFORMA_PEQ_A - (9010 + 12455 + 12674) - 1518.69, 2)
FONDO_PEQ = round(3 * 1518.69, 2)


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
    c.drawCentredString(W / 2, 18, "Revisión realista del arranque  ·  50.000 € propios  ·  250 simulaciones")
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


def card(c, x, y, w, h, title, valor, nota="", acento=GOLD, dark=False):
    c.setStrokeColor(acento)
    c.setFillColor(Color(0.16, 0.17, 0.20) if dark else white)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    c.setFillColor(acento)
    c.setFont("DejaVuBold", 7.5)
    c.drawString(x + 12, y + h - 16, title.upper())
    c.setFillColor(white if dark else INK)
    c.setFont("DejaVuSerif", 17)
    c.drawString(x + 12, y + h - 40, valor)
    if nota:
        c.setFillColor(Color(0.72, 0.70, 0.64) if dark else SLATE)
        c.setFont("DejaVu", 8)
        c.drawString(x + 12, y + 12, nota)


def table(c, x, y, cols, rows, widths, size=8, hrow=17, head_bg=SOFT, zebra=True,
          aligns=None, colors=None, bold_rows=()):
    """Tabla simple. `cols` y cada fila son listas de textos."""
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
        if zebra and j % 2 == 0:
            c.setFillColor(SOFT)
            c.rect(x, yy, sum(widths), hrow, fill=1, stroke=0)
        bold = j in bold_rows
        c.setFillColor(INK if not colors else colors[j])
        c.setFont("DejaVuBold" if bold else "DejaVu", size)
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


def barras(c, x, y, w, datos, size=8, alto=15, hueco=6, ancho_valor=110):
    """Barras horizontales: datos = [(etiqueta, valor, texto)]. El valor va DENTRO
    de la barra, alineado a la derecha, así nunca se solapa con nada de al lado."""
    maxv = max(v for _, v, _ in datos)
    for lab, v, txt in datos:
        c.setFillColor(SLATE)
        c.setFont("DejaVu", size)
        c.drawRightString(x + 92, y + 3, lab)
        c.setFillColor(SOFT)
        c.rect(x + 100, y, w, alto, fill=1, stroke=0)
        bw = max(2, w * v / maxv)
        c.setFillColor(GOLD)
        c.rect(x + 100, y, bw, alto, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("DejaVuBold", size)
        dentro = bw >= ancho_valor      # cabe dentro de la barra rellena
        if dentro:
            c.setFillColor(white)
            c.drawRightString(x + 100 + bw - 6, y + 4, txt)
        else:
            c.drawString(x + 100 + bw + 8, y + 4, txt)
        y -= alto + hueco
    return y


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
    c.setFont("DejaVuBold", 9)
    c.drawString(60, H - 70, "KHC AUTO IMPORT  ·  A CORUÑA")
    c.setFillColor(white)
    c.setFont("DejaVuSerif", 34)
    c.drawString(60, H - 150, "Revisión realista")
    c.drawString(60, H - 195, "del arranque")
    c.setFillColor(GOLD)
    c.setFont("DejaVu", 13)
    c.drawString(60, H - 235, "36 meses, semana a semana · 250 simulaciones · P10-P50-P90")
    c.setFillColor(Color(0.78, 0.76, 0.70))
    c.setFont("DejaVu", 10)
    c.drawString(60, H - 268, "Qué aguanta el plan de 50.000 € propios y qué no")
    c.setFillColor(GOLD)
    c.rect(60, H - 300, 90, 2, fill=1, stroke=0)
    y = H - 340
    for txt in (
        f"El plan de hoy abre el día 1 con {eur(DIA1_PLAN)} € de caja: {eur(FONDO_PLAN)} € por debajo de su propio fondo.",
        f"La misma nave sin obra abre con {eur(M['dec']['dia1'])} € en caja y la obra se paga en el mes {M['dec']['obra_mes']} (mediana).",
        f"Ventas, caja y sueldo mes a mes; ocho caminos de local comparados; y los disparadores que obligan a cambiar.",
    ):
        wrap(c, txt, 60, y, 620, size=10, leading=15, color=Color(0.86, 0.85, 0.82))
        y -= 22
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 8)
    c.drawString(60, 40, "12 DE OCTUBRE DE 2026  ·  USO INTERNO  ·  NO SUSTITUYE AL PLAN: LO MIDE")


@page
def p_cambia(c, n, t):
    bg(c)
    heading(c, "Lo que cambió en el análisis", "Cuatro supuestos que no se sostenían")
    y = 428
    wrap(c, "El plan de los PDF vende «una de cada tres unidades en el suelo, y nunca menos de dos, cada mes». "
            "El modelo se construyó para comprobar si eso es posible, y tres de sus supuestos iniciales "
            "también tuvieron que corregirse. Cada corrección está documentada y medida.", 36, y, 880, size=10, leading=14)
    filas = [
        ("Ciclo de compra", "3 semanas fijas (camión, taller, ITV, DGT)", "1 semana: con unidades ya vistas y el viaje cerrado en 3 días", "+93.000 € de patrimonio"),
        ("Papeles", "Bloqueaban la venta hasta matricular", "No bloquean: el coche se entrega con placas temporales", "0 € (no cambia nada)"),
        ("Venta", "Cuota mensual de demanda por modelo: los coches competían entre sí", "Cada coche vende a su ritmo: nunca hay dos iguales en la nave", "+133.000 € y +47 coches"),
        ("Límite", "Techo de demanda (68 coches/año para todo el catálogo)", "Las plazas y el capital. El área de Santiago vende ~7.200 coches al año", "La nave es el motor"),
    ]
    x = 36
    for tit, antes, ahora, efecto in filas:
        c.setStrokeColor(LINE)
        c.setFillColor(white)
        c.roundRect(x, 128, 214, 232, 3, fill=1, stroke=1)
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 8)
        c.drawString(x + 12, 344, tit.upper())
        c.setFillColor(RED)
        c.setFont("DejaVu", 8)
        c.drawString(x + 12, 326, "ANTES")
        wrap(c, antes, x + 12, 310, 190, size=8, leading=11, color=SLATE, max_lines=4)
        c.setFillColor(GREEN)
        c.setFont("DejaVu", 8)
        c.drawString(x + 12, 262, "AHORA")
        wrap(c, ahora, x + 12, 246, 190, size=8, leading=11, color=INK, max_lines=4)
        c.setFillColor(GOLD)
        c.setFont("DejaVuBold", 8)
        c.drawString(x + 12, 198, "EFECTO")
        wrap(c, efecto, x + 12, 184, 190, size=9, leading=11, color=GOLD_DEEP, max_lines=3)
        x += 226
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8.5)
    c.drawString(36, 108, "El error de los «techos de demanda» era grave: limitaba el negocio al 0,9 % del mercado real de la zona.")
    c.drawString(36, 94, "Con la corrección, el modelo vende 127 coches en 36 meses (0,6 % del mercado del área) en vez de 80.")


@page
def p_falta(c, n, t):
    bg(c)
    heading(c, "Lo que faltaba en el plan", "El día 1 no cerraba por debajo del fondo: cerraba en descubierto")
    y = 430
    wrap(c, "El plan dice, literalmente, que «la tasa de licencia de Ames y el seguro de la nave no tienen precio cerrado: no se ponen». "
            "Ya lo tienen, y faltaban dos costes más. Con ellos, el día 1 del plan de hoy queda por debajo de su propia regla del fondo.", 36, y, 880, size=10, leading=14)
    table(c, 36, 356,
          ["Coste que faltaba", "Importe", "Fuente / razonamiento"],
          [["Licencia de apertura y técnico", "800 €", "Comunicación previa 100-300 €; con técnico 400-1.500 € (media 1.280-1.460 €)"],
           ["Seguro de la nave", "45-60 €/mes", "Póliza básica de almacén 300-900 €/año; nave 600-1.800 €/año"],
           ["Tasas municipales", "25 €/mes", "Tasa de apertura y vado"],
           ["Constitución de la Sociedad Limitada", "1.200 €", "Notaría, registro y gestoría (el plan tampoco la ponía)"]],
          [300, 110, 470], size=8.5, hrow=20)
    y2 = 232
    card(c, 36, y2 - 96, 430, 100, "Plan de hoy (O Milladoiro, 1.200 €/mes)",
         f"{eur(DIA1_PLAN)} €", f"Fondo exigido {eur(FONDO_PLAN)} € → {eur(DIA1_PLAN - FONDO_PLAN)} €",
         acento=RED)
    card(c, 494, y2 - 96, 430, 100, "Nave de 220 m² a 600 €/mes",
         f"{eur(DIA1_PEQ)} €", f"Fondo exigido {eur(FONDO_PEQ)} € → +{eur(DIA1_PEQ - FONDO_PEQ)} € de aire",
         acento=GREEN)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 9)
    c.drawString(36, 108, "El desfase del plan de hoy lo provocan sobre todo la sociedad y la licencia, no la fianza:")
    c.drawString(36, 93, f"{eur(DIA1_PLAN - FONDO_PLAN)} € por debajo del fondo. Con la nave pequeña, el día 1 cierra con {eur(DIA1_PEQ)} €.")


@page
def p_modelo(c, n, t):
    bg(c)
    heading(c, "El modelo", "Semana a semana, 36 meses, 250 veces")
    y = 430
    izq = [
        ("Ciclo de caja", "Compra → 1 semana → anunciado → 32-55 días de venta → cobro. La matriculación no retrasa el cobro: placas temporales."),
        ("Cada coche a su ritmo", "Los días de venta son de cada modelo (evidencia de mercado), y los modulan la estacionalidad y la rampa del negocio (65 % los 6 primeros meses)."),
        ("Stock diversificado", "Una plaza, un modelo. Nunca dos coches iguales compitiendo. En locales grandes, dos como máximo."),
        ("Plazas", "El stock no pasa de las plazas de la nave: 7 en 220 m², 14 en O Milladoiro, 4 sin local."),
    ]
    yy = y
    for tit, txt in izq:
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(36, yy, tit.upper())
        yy -= 14
        yy -= wrap(c, txt, 36, yy, 420, size=9, leading=12, color=INK, max_lines=4)
        yy -= 10
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(500, y, "DÍAS DE VENTA POR MODELO")
    table(c, 500, y - 16,
          ["Coche", "Días", "€/mes por 1.000 €"],
          [[u["nombre"].split(" ")[0] if len(u["nombre"]) > 16 else u["nombre"], str(u["dias"]),
            eur(u["neto"] / (u["coste"] * (7 + u["dias"]) / 30.0) * 1000)]
           for u in sorted(mr.UNIDADES.values(), key=lambda z: -z["neto"] / (z["coste"] * (7 + z["dias"])))],
          [220, 50, 140], size=8, hrow=16.5)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8)
    wrap(c, "La última columna es el margen neto al mes por cada 1.000 € inmovilizados: es lo que decide qué comprar. "
            "El 318d (102 €) es el peor del catálogo y el modelo no lo elige ni una vez en 250 simulaciones.", 36, 120, 880, size=8.5, leading=12, color=SLATE, max_lines=3)


@page
def p_dia1(c, n, t):
    bg(c)
    heading(c, "El día 1 de la decisión", "O Milladoiro sin obra al abrir · la obra espera a la caja")
    D = M["dec"]
    lineas = [
        ("Aportación propia", 50000.00, ""),
        ("Kit de equipo y revisión", -g.KIT, "doc 02: revisión, Launch, medidor de pintura"),
        ("Constitución de la Sociedad Limitada", -1200.0, "notaría, registro y gestoría"),
        ("Fianza de la nave", -2400.0, "dos mensualidades (LAU art. 36)"),
        ("Licencia de apertura y técnico", -800.0, "comunicación previa + técnico"),
        ("Reforma", 0.0, "aplazada: se paga cuando la caja cubra el fondo + la obra + 2 meses"),
        ("BMW 116d + Audi A3 + Golf GTI", -34139.0, "rotación rápida y mejor margen por euro"),
        ("Gastos fijos del mes 1", -2183.69, "alquiler, RETA, portales, luz, seguro y tasas"),
    ]
    rows = [[a, eur(b), c_] for a, b, c_ in lineas]
    rows.append(["CAJA AL CERRAR EL DÍA 1", eur(D["dia1"]), f"fondo de 3 meses: {eur(2183.69 * 3)} €"])
    table(c, 36, 424, ["Concepto", "Importe", "Por qué"], rows, [300, 110, 470], size=8.5, hrow=19.5,
          aligns=["l", "r", "l"], bold_rows=(len(rows) - 1,),
          colors=[INK] * (len(rows) - 1) + [GREEN])
    card(c, 36, 84, 284, 84, "Aire sobre el fondo",
         f"+{eur(D['dia1'] - 2183.69 * 3)} €", "el plan de hoy: −" + eur(FONDO_PLAN - DIA1_PLAN) + " €", acento=GREEN)
    card(c, 336, 84, 284, 84, "Obra aplazada", f"{eur(5115.47)} €",
         f"mediana: mes {D['obra_mes']}, sin tocar el fondo", acento=GOLD)
    card(c, 636, 84, 288, 84, "Patrimonio al mes 36", f"{eur(D['p50'])} €",
         f"con la obra el día 1: {eur(M['dec_obradia1']['p50'])} €", acento=GOLD)


@page
def p_mes1(c, n, t):
    bg(c)
    heading(c, "Estimación mes a mes", "Meses 1 a 18 · la trayectoria central de 300 simulaciones")
    r = M["tray"]
    acum = 0
    rows = []
    for m in r["meses"][:18]:
        acum += m["ventas"]
        rows.append([str(m["mes"]), str(m["ventas"]), str(acum), eur(m["cobro"]), eur(m["sueldo"]),
                     str(m["flota"]), eur(m["caja"]), eur(m["floor"]), eur(m["caja"] + m["flota_coste"])])
    table(c, 36, 434, ["mes", "ventas", "acumuladas", "entra €", "sueldo €", "flota", "caja €", "fondo €", "caja+coches €"],
          rows, [56, 74, 96, 108, 100, 66, 112, 108, 152], size=8.5, hrow=15,
          aligns=["c", "c", "c", "r", "r", "c", "r", "r", "r"])
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8.5)
    c.drawString(36, 118, "El primer dinero entra en el mes 2. Los meses 1-6 son los más justos (nómina a trozos) y en el mes 13 la nave se llena con 7 coches.")
    c.drawString(36, 102, f"Caja mínima intramensual {eur(r['min_caja'], True)} € (mes {r['min_caja_mes']}); ningún mes cierra por debajo de {eur(min(m['caja'] for m in r['meses']))} €.")


@page
def p_mes2(c, n, t):
    bg(c)
    heading(c, "Estimación mes a mes", "Meses 19 a 36 · el stock trabaja y la caja se acumula")
    r = M["tray"]
    acum = sum(m["ventas"] for m in r["meses"][:18])
    rows = []
    for m in r["meses"][18:]:
        acum += m["ventas"]
        rows.append([str(m["mes"]), str(m["ventas"]), str(acum), eur(m["cobro"]), eur(m["sueldo"]),
                     str(m["flota"]), eur(m["caja"]), eur(m["floor"]), eur(m["caja"] + m["flota_coste"])])
    table(c, 36, 434, ["mes", "ventas", "acumuladas", "entra €", "sueldo €", "flota", "caja €", "fondo €", "caja+coches €"],
          rows, [56, 74, 96, 108, 100, 66, 112, 108, 152], size=8.5, hrow=14.2,
          aligns=["c", "c", "c", "r", "r", "c", "r", "r", "r"])
    card(c, 36, 84, 290, 74, "Ventas en 36 meses", f"{r['ventas']}", "22 + 47 + 56 por año", acento=GOLD)
    card(c, 336, 84, 290, 74, "Sueldo bruto pagado", f"{eur(r['sueldos'])} €", f"{r['reducidos']} meses con nómina recortada", acento=GOLD)
    card(c, 636, 84, 288, 74, "Patrimonio al mes 36", f"{eur(r['patrimonio'])} €", "caja + coches − impuesto del año 3", acento=GREEN)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8.5)
    c.drawString(36, 66, f"Al mes 36 hay {eur(OCIOSO)} € de mediana por encima del fondo, parados: no caben más coches. Es el disparador para crecer de plazas.")


@page
def p_comparativa(c, n, t):
    bg(c)
    heading(c, "Siete arranques", "Patrimonio, caja y riesgo · 250 simulaciones por fila")
    filas = [
        ("A · Plan de hoy: O Milladoiro, 14 plazas", M["plan"], False),
        ("A2 · Plan de hoy con 7 coches de stock", M["plan7"], False),
        ("B · Nave 220 m² (600 €), 7 plazas", M["peq"], True),
        ("B2 · Nave 220 m², 5 coches de stock", M["peq5"], False),
        ("C · Sin nave (4 plazas), local al mes 10", M["nave"], False),
        ("D · Nave 220 m² → O Milladoiro (10 plazas)", M["mud10"], False),
        ("D2 · Nave 220 m² → O Milladoiro (12 plazas)", M["mud12"], True),
        ("D3 · Como D2, con la nómina antes de reinvertir", M["mud12fam"], False),
    ]
    rows = [[nom, str(m["ventas"]), eur(m["p10"]), eur(m["p50"]), eur(m["p90"]), eur(m["caja"]),
             eur(m["sueldo"]), f"{100*m['riesgo']:.1f} %", f"{100*m['pozo']:.1f} %"]
            for nom, m, _ in filas]
    table(c, 36, 420, ["Arranque", "ventas", "patr. P10", "patr. P50", "patr. P90", "caja P50", "sueldo bruto", "caja<0", "pozo>3k"],
          rows, [286, 58, 86, 88, 88, 84, 92, 62, 62], size=8, hrow=25,
          aligns=["l", "c", "r", "r", "r", "r", "r", "c", "c"],
          bold_rows=tuple(i for i, (_, _, b) in enumerate(filas) if b))
    y = 184
    for tit, txt, acento in (
        ("Las plazas son el motor", "Cada plaza vale 25.000-60.000 € en tres años. El negocio no crece vendiendo más rápido: crece teniendo más coches a la vez.", GOLD),
        ("Quedarse pequeño cuesta dinero", f"7 plazas dan {eur(M['peq']['p50'])} € al mes 36 y 24 plazas dan {eur(M['cap'][24]['p50'])} €: la diferencia es techo, no gestión.", GREEN),
        ("El plan de hoy paga caro el arranque", f"{100*M['plan']['riesgo']:.0f} % de caja negativa: paga 1.200 €/mes, fianza y reforma completa antes de tener coches que facturen.", RED),
        ("Ojo con esta tabla", "En las siete rutas de arriba la nave grande lleva siempre la obra del plan. Repetida la comparación sin obra (lámina 10), el ganador cambia.", SLATE),
    ):
        c.setFillColor(acento)
        c.setFont("DejaVuBold", 8.5)
        c.drawString(36 + (0 if acento is GOLD else 0), y, tit.upper())
        wrap(c, txt, 36, y - 13, 880, size=8.5, leading=11.5, color=INK, max_lines=2)
        y -= 36


@page
def p_plazas(c, n, t):
    bg(c)
    heading(c, "Las plazas son el motor", "Cada plaza de la nave produce ~0,6 ventas al mes")
    datos = []
    for pl, m in list(M["stock"].items()) + list(M["stock_mud"].items()):
        datos.append((f"{pl} plazas", m["p50"], eur(m["p50"]) + " €"))
    # de mayor a menor para que las barras se lean mejor
    datos.sort(key=lambda d: d[1])
    barras(c, 24, 392, 400, datos, size=8, alto=15, hueco=6, ancho_valor=96)
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8.5)
    wrap(c, "Patrimonio P50 al mes 36 según las plazas de la nave, todo medido con las reglas de la decisión (sin obra el día 1). "
            "Hasta 7 plazas, con la nave pequeña; de 10 en adelante, con O Milladoiro y una persona contratada desde el mes 13 "
            "a partir de 20 plazas (lámina 10).",
         24, 118, 400, size=8.5, leading=11.5, color=SLATE, max_lines=4)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(500, 392, "¿QUÉ LIMITA EL CRECIMIENTO?")
    wrap(c, "Con O Milladoiro y 14 plazas el negocio vende todo lo que puede a partir del mes 16. Medido en 250 simulaciones:",
         500, 376, 420, size=9, leading=12)
    table(c, 500, 348, ["Situación (14 plazas)", "Meses de 36"], [
        ["Nave llena (14 de 14 plazas)", str(LLENO_MESES)],
        ["Con plazas libres", f"{PLAZAS_LIBRES:.1f}"],
        ["…y sin dinero para comprar", f"{SIN_DINERO:.1f}"],
        ["…con plaza y dinero (solo búsqueda)", f"{PLAZAS_LIBRES - SIN_DINERO:.1f}"],
    ], [300, 120], size=8.5, hrow=19, aligns=["l", "r"])
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(500, 240, "DINERO PARADO AL MES 36")
    c.setFillColor(INK)
    c.setFont("DejaVuSerif", 24)
    c.drawString(500, 206, f"{eur(OCIOSO)} €")
    wrap(c, "por encima del fondo, porque no hay dónde meter más coches. Ese dinero es el argumento para crecer: cada plaza extra "
            "vale 25.000-45.000 € al mes 36, y sale gratis si la nave aguanta la maniobra (lámina 10).",
         500, 182, 420, size=8.5, leading=11.5, color=SLATE, max_lines=3)


@page
def p_capacidad(c, n, t):
    bg(c)
    heading(c, "Cuántos coches caben", "10 metros de ancho, en modo stock (no showroom)")
    wrap(c, "Comprobado con cinta: el almacén tiene 40 × 10 m. Dos filas de coches a 45° ocupan 9,19 m de ancho: caben. Lo que no cabe es un "
            "pasillo de circulación, y no hace falta: la nave se opera como stock y los coches se mueven cuando un cliente muestra interés real. "
            "Ese coste aparece sólo con la nave llena, no antes.",
         36, 442, 890, size=9.5, leading=13, max_lines=3)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 388, "TU REPARTO, COMPROBADO (la geometría pura da más: tus cuentas ya llevan margen)")
    table(c, 36, 374, ["Fila", "Paso por coche", "40 m dan", "Tu cuenta", "Margen"], [
        ["Derecha a 45°, menos 4 m del tiro del portón", "2,55-2,83 m", "14", "14", "al límite, bien calibrado"],
        ["Izquierda a 45°, empieza a los 6 m del tabique", "2,55-2,83 m", "13-16", "10", "prudente"],
        ["Izquierda a 90° (mixta)", "1,80 m", "18", "15", "prudente"],
        ["Derecha a 45° (mixta)", "2,55-2,83 m", "14", "13", "al límite"],
        ["Dos filas a 45° en los 10 m de ancho", "9,19 m ocupados", "sobran 0,81 m", "sin pasillo", "es el criterio de stock"],
    ], [286, 96, 84, 84, 340], size=8.5, hrow=15, aligns=["l", "c", "c", "c", "l"])
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 256, "Y CUÁNDO MOLESTA (mediana de coches en stock, objetivo 24 plazas)")
    table(c, 36, 242, ["", "mes 6", "mes 12", "mes 15", "mes 20", "mes 23", "mes 25", "mes 36"], [
        ["Coches en la nave", "5", "7", "10", "16", "20", "24", "24"],
        ["% de la nave ocupada", "21 %", "29 %", "42 %", "67 %", "83 %", "100 %", "100 %"],
        ["¿Hay que moverlos para enseñar?", "no", "no", "no", "a veces", "sí", "sí", "sí"],
    ], [216, 60, 60, 60, 60, 60, 60, 84], size=8.5, hrow=15, aligns=["l", "c", "c", "c", "c", "c", "c", "c"])
    wrap(c, "La nave se llena de verdad en el mes 25 y pasa de 20 coches 14 de los 36 meses: los dos primeros años el layout apretado no molesta a "
            "nadie. Con 24 plazas el plan da 306 ventas y 713.093 €; con 28, 354 ventas y 861.167 €; con 14, 209 ventas y 494.519 €.",
         36, 164, 890, size=8.5, leading=12, color=SLATE, max_lines=2)
    card(c, 36, 62, 284, 58, "La regla de oro", "máx. 2 coches",
         "si hay que mover más de dos para sacar uno, se vende antes de comprar", acento=RED)
    card(c, 336, 62, 284, 58, "Lo que gana apretar", f"+{eur(M['cap'][24]['p50'] - M['cap'][14]['p50'])} €",
         "de 14 a 24 plazas, con el mismo local", acento=GREEN)
    card(c, 636, 62, 288, 58, "Si el fondo vende lento", f"−{eur(M['cap'][24]['p50'] - M['cap_lento']['p50'])} €",
         "que un coche enterrado no se vea (10 % de días)", acento=GOLD)


@page
def p_local(c, n, t):
    bg(c)
    heading(c, "La decisión del local", "¿Nave de paso un año o la nave definitiva desde el día 1?")
    wrap(c, "Mismo motor, mismas 250 simulaciones. La nave de paso no es más barata por plaza: 220 m² a 600 € son 2,73 €/m² y "
            "86 €/plaza; O Milladoiro, 2,58 €/m² y 86 €/plaza; San Marcos, 550 m² a 1.100 €, 2,00 €/m² y 65 €/plaza. La cuota es "
            "más pequeña, el precio no. Lo que decide es cuándo empiezas a pagar plazas que aún no puedes llenar.",
         36, 440, 890, size=9.5, leading=13, max_lines=3)
    L, LM = M["local"], M["local_mal"]
    filas = [
        ["Nave 220 m² a 600 € · 7 plazas · no se muda", str(L["peq_fija"]["ventas"]),
         eur(L["peq_fija"]["dia1"]), eur(L["peq_fija"]["p50"]), f"{100*L['peq_fija']['riesgo']:.1f} %", "—"],
        ["Nave 220 m² a 600 € → O Milladoiro · 12 plazas", str(L["peq_muda"]["ventas"]),
         eur(L["peq_muda"]["dia1"]), eur(L["peq_muda"]["p50"]), f"{100*L['peq_muda']['riesgo']:.1f} %",
         eur(LM["peq_muda"]["p50"])],
        ["O Milladoiro desde el día 1 · 12 plazas", str(L["grande12"]["ventas"]),
         eur(L["grande12"]["dia1"]), eur(L["grande12"]["p50"]), f"{100*L['grande12']['riesgo']:.1f} %", "—"],
        ["O Milladoiro desde el día 1 · 14 plazas", str(L["grande14"]["ventas"]),
         eur(L["grande14"]["dia1"]), eur(L["grande14"]["p50"]), f"{100*L['grande14']['riesgo']:.1f} %",
         eur(LM["grande14"]["p50"])],
        ["Plan de hoy: O Milladoiro + obra completa", str(L["plan_hoy"]["ventas"]),
         eur(L["plan_hoy"]["dia1"]), eur(L["plan_hoy"]["p50"]), f"{100*L['plan_hoy']['riesgo']:.1f} %",
         eur(LM["plan_hoy"]["p50"])],
    ]
    table(c, 36, 390, ["Camino", "ventas", "caja día 1", "patrim. P50", "caja<0", "P50 si el mercado −40 %"],
          filas, [316, 62, 92, 104, 78, 156], size=8.5, hrow=18, bold_rows=(1, 3),
          aligns=["l", "c", "r", "r", "c", "r"])
    wrap(c, "O Milladoiro a 1.200 €/mes son 86 €/plaza: los mismos que la nave de 220 m² a 600 €. La grande gana en "
            "resultado y en riesgo (3,2 % frente a 9,2 %): la pequeña sólo empata cuando la grande pasa de ~1.700 €/mes "
            "(≈125 €/plaza). Con el precio del anuncio, se empieza en O Milladoiro, desde el día 1 y sin obra.",
         36, 268, 890, size=8.5, leading=12, color=SLATE, max_lines=3)
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 206, "LA CUENTA DE LA MUDANZA (15 MESES EN LA PEQUEÑA)")
    table(c, 36, 192, ["Concepto", "€"], [
        ["Alquiler ahorrado: 600 €/mes × 15", "+9.000"],
        ["Licencia de apertura nueva", "−800"],
        ["Transporte, rótulos y suministros", "−2.500"],
        ["Más fianza inmovilizada (se recupera)", "−1.200"],
        ["Suelo y pintura de la nave de paso (si se hace)", "−1.384 (perdido)"],
        ["Saldo a favor de empezar pequeño", "+4.316"],
    ], [340, 142], size=8.5, hrow=16, aligns=["l", "r"], bold_rows=(5,))
    c.setFillColor(RED)
    c.setFont("DejaVuBold", 9)
    c.drawString(600, 206, "LA OBRA DEL DÍA 1, COBRADA A 36 MESES")
    table(c, 600, 192, ["Obra el día 1 (misma nave, 14 plazas)", "patrim. P50", "caja<0"], [
        ["0 €", eur(L["grande14"]["p50"]), f"{100*L['grande14']['riesgo']:.1f} %"],
        [f"{eur(OBRA_MOVIBLE)} € (sólo lo movible)", eur(L["obra_min"]["p50"]), f"{100*L['obra_min']['riesgo']:.1f} %"],
        [f"{eur(5115)} € (obra completa)", eur(L["obra_todo"]["p50"]), f"{100*L['obra_todo']['riesgo']:.1f} %"],
    ], [186, 78, 52], size=8, hrow=17, aligns=["l", "r", "c"], bold_rows=(2,))
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(600, 108, "LA REGLA")
    wrap(c, "Si la nave sirve tal cual, no se toca suelo ni pintura de ninguna nave que no sea la definitiva, y la obra "
            "se paga con caja sobrante: nunca con el capital de arranque.",
         600, 92, 316, size=8.5, leading=12, color=SLATE, max_lines=3)


@page
def p_velocidad(c, n, t):
    bg(c)
    heading(c, "Tiempo de venta", "Con evidencia, no con el ranking interno del proyecto")
    y = 428
    wrap(c, "El mercado: un turismo de combustión pasa 43 días de media en stock (Faconauto) y 40 de mediana anunciado (Autouncle, oct-2026). "
            "El coche que más rápido se vende en España tarda 33-38 días (Autovista24: RAV4 33,4 · Yaris 34,5 · C-HR 34,6 · i20 38,5 · XC60 38,6). "
            "La horquilla profesional sana es 30-45 días. Los 10-18 días que afirma la documentación interna no los sostiene ninguna fuente externa: son un objetivo.",
         36, y, 880, size=9.5, leading=13)
    table(c, 36, 348, ["Coche", "Días", "Motivo del número"],
          [["Seat León 2.0 TDI FR", "32", "Gran rotación en docs/07 y mecánica EA288 (la más demandada de Galicia)"],
           ["VW Golf VIII", "32", "El coche con más demanda de Galicia (docs/03 y docs/06): «el rey de la liquidez»"],
           ["BMW 116d", "35", "El tramo 12.000-15.000 € de PVP es el más líquido del mercado"],
           ["Audi A3 1.0 TFSI", "35", "Mismo tramo de precio; la gasolina pequeña es el volumen del particular"],
           ["Golf GTI", "45", "Nicho, pero 38 % de margen: el mejor del catálogo por euro invertido"],
           ["Volvo XC40 D3", "45", "SUV premium: demanda sólida, mercado más estrecho"],
           ["BMW 318d Touring", "45", "Buen producto, el peor retorno del catálogo: no se compra"],
           ["Mercedes C Estate", "55", "18.000-24.000 € y familiar: el tramo más estrecho"]],
          [220, 60, 600], size=8.5, hrow=18, aligns=["l", "c", "l"])
    y2 = 176
    table(c, 36, y2, ["Escenario", "ventas", "ciclo", "patr. P10", "patr. P50", "caja P50", "caja<0"], [
        [k, str(v["ventas"]), f"{v['ciclo']:.0f} d", eur(v["p10"]), eur(v["p50"]), eur(v["caja"]), f"{100*v['riesgo']:.1f} %"]
        for k, v in M["vel"].items()],
        [230, 80, 70, 130, 130, 130, 90], size=8.5, hrow=19, aligns=["l", "c", "c", "r", "r", "r", "c"],
        bold_rows=(1,))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8.5)
    c.drawString(36, 66, "La decisión no cambia en ninguno de los cuatro escenarios: nave de 220 m², 7 plazas y mudanza en el mes 15. Solo cambia el tamaño del titular.")


@page
def p_sens(c, n, t):
    bg(c)
    heading(c, "Sensibilidad", "Qué pasa si el mercado es peor o la operación se retrasa")
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 430, "DEMANDA DEL MERCADO (DECISIÓN: O Milladoiro, 14 plazas)")
    table(c, 36, 414, ["Escenario", "ventas", "patr. P10", "patr. P50", "caja P50", "sueldo", "caja<0"], [
        [k, str(v["ventas"]), eur(v["p10"]), eur(v["p50"]), eur(v["caja"]), eur(v["sueldo"]), f"{100*v['riesgo']:.1f} %"]
        for k, v in M["dem_dec"].items()],
        [120, 55, 80, 80, 80, 75, 70], size=7.5, hrow=17, 
        aligns=["l", "c", "r", "r", "r", "r", "c"], bold_rows=(2,))
    c.setFillColor(GOLD_DEEP)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 252, "CICLO DE COMPRA (semanas hasta tener el coche anunciado)")
    table(c, 36, 236, ["Semanas", "ventas", "ciclo", "patr. P10", "patr. P50", "caja P50", "caja<0"], [
        [f"{k:.1f}", str(v["ventas"]), f"{v['ciclo']:.0f} d", eur(v["p10"]), eur(v["p50"]), eur(v["caja"]), f"{100*v['riesgo']:.1f} %"]
        for k, v in M["lead_dec"].items()],
        [120, 55, 60, 80, 80, 80, 70], size=7.5, hrow=17,
        aligns=["l", "c", "c", "r", "r", "r", "c"], bold_rows=(1,))
    c.setFillColor(SLATE)
    c.setFont("DejaVu", 8.5)
    c.drawString(36, 130, "Ni con la demanda un 40 % por debajo ni con el ciclo al doble el negocio se rompe: aguanta porque no hay deuda.")
    c.setFillColor(RED)
    c.setFont("DejaVuBold", 9)
    c.drawString(620, 430, "Y EL PLAN DE HOY, SI EL MERCADO CAE −40 %")
    m = M["dem_plan"]
    table(c, 620, 414, ["", "ventas", "patr. P10", "patr. P50", "caja<0"], [
        ["O Milladoiro", str(m["ventas"]), eur(m["p10"]), eur(m["p50"]), f"{100*m['riesgo']:.1f} %"]],
        [110, 50, 65, 65, 60], size=8, hrow=20, aligns=["l", "c", "r", "r", "c"])
    wrap(c, f"Casi cuatro de cada diez simulaciones acaban con un pozo de más de 3.000 € y la familia cobra "
            f"{eur(12840)} € en tres años. Ahí se ve por qué el orden importa: la nave grande no es mala idea; "
            "lo malo es pagarla antes de tener coches que facturen.",
         620, 372, 296, size=8.5, leading=11.5, color=SLATE, max_lines=6)
    card(c, 620, 214, 296, 74, "Si el mercado cae un 40 %", f"{eur(M['dem_dec']['−40 %']['p50'])} €",
         f"y aun así paga {eur(M['dem_dec']['−40 %']['sueldo'])} € de sueldo", acento=GOLD)
    card(c, 620, 124, 296, 74, "Si el ciclo sube a 3 semanas", f"{eur(M['lead_dec'][3.0]['p50'])} €",
         "es el supuesto que más pesa", acento=GOLD)


@page
def p_reco(c, n, t):
    bg(c)
    heading(c, "Recomendación", "O Milladoiro, sin obra al abrir y obra cuando la caja la aguante")
    items = [
        ("1. Local", "O Milladoiro, 465 m² a 1.200 €/mes: 14 plazas y 86 €/plaza, los mismos que la nave de 220 m² a 600 €. Decidir por €/plaza, no por cuota: la pequeña no ahorra precio, sólo techo."),
        ("2. Día 1", f"O Milladoiro sin obra: {eur(M['local']['grande14']['dia1'], True)} € en caja frente a {eur(DIA1_PLAN, True)} € del plan. Sin obra, el riesgo de descubierto baja del 16,0 % al 3,2 %."),
        ("3. Actividad y obra", "Inocua (compraventa, exposición, almacén), taller fuera. Al abrir, sólo luces, alarma y extintores. La obra (5.115 €) se paga cuando la caja cubra el fondo + la obra + 2 meses; mediana, el mes 8."),
        ("4. Los tres primeros coches", "BMW 116d (9.010 €), Audi A3 (12.455 €) y Golf GTI (12.674 €). Después, Golf VIII y Seat León: los de más giro (32 días). Y medir los días reales en el ERP: son la señal de si la nave sin arreglar frena la venta."),
        ("5. Stock", "Llenar las plazas y mantenerlas llenas, una plaza un modelo. Medido con la nave grande: 8 plazas 326.725 € · 12 → 465.106 € · 14 → 515.093 €."),
        ("6. El 318d no se compra", "Es el peor retorno del catálogo (102 €/mes por cada 1.000 € inmovilizados). El XC40 solo cuando la nave ya esté llena."),
        ("7. La nave de paso, plan B", "Sólo si el precio real de la grande pasa de ~1.700 €/mes (≈125 €/plaza) o no hay salida a 12 meses: 220 m² a 600 €, sin obra, y mudanza en el mes 15-18. Es un seguro: cuesta ~4.300 € y en el escenario malo vale 24.000."),
        ("8. Fondo y nómina", "Fondo de 3 meses más la reserva del impuesto, intocables. La nómina antes de comprar el siguiente coche."),
        ("9. Cerrar antes de firmar", "€/plaza y €/m² de cada candidata, salida pactada, tasa exacta del concello y cotización real del seguro."),
    ]
    y = 430
    for tit, txt in items:
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(36, y, tit)
        wrap(c, txt, 200, y, 716, size=9, leading=12, color=INK, max_lines=2)
        y -= 34


@page
def p_decision(c, n, t):
    bg(c)
    heading(c, "La decisión", "O Milladoiro sin obra al abrir · la obra cuando la caja la aguante")
    D, DM = M["dec"], M["dec_mal"]
    wrap(c, "Regla de pago de la obra (fase única, 5.115 €): se paga en el primer mes en que la caja cubra, a la vez, "
            "el fondo de 3 meses, el importe de la obra y dos meses más de gastos fijos. Si un mes no llega, se intenta al "
            "siguiente. El fondo de emergencia nunca se toca.",
         36, 440, 890, size=9.5, leading=13, max_lines=3)
    table(c, 36, 392, ["Variante de la obra", "ventas", "P10", "P50", "caja<0", "obra pagada", "mes mediano"],
          [["Sin obra nunca", str(M["dec_nunca"]["ventas"]), eur(M["dec_nunca"]["p10"]), eur(M["dec_nunca"]["p50"]),
            f"{100*M['dec_nunca']['riesgo']:.1f} %", "—", "—"],
           ["Obra completa el día 1 (plan de hoy)", str(M["dec_obradia1"]["ventas"]), eur(M["dec_obradia1"]["p10"]),
            eur(M["dec_obradia1"]["p50"]), f"{100*M['dec_obradia1']['riesgo']:.1f} %", "100 %", "día 1"],
           ["Sin obra al abrir, sólo el fondo (sin margen)", str(M["dec_margen0"]["ventas"]), eur(M["dec_margen0"]["p10"]),
            eur(M["dec_margen0"]["p50"]), f"{100*M['dec_margen0']['riesgo']:.1f} %",
            f"{M['dec_margen0']['obra_pct']:.0f} %", f"mes {M['dec_margen0']['obra_mes']}"],
           ["Sin obra, desde el mes 6 (+2 meses de gastos)", str(M["dec_mes6"]["ventas"]), eur(M["dec_mes6"]["p10"]),
            eur(M["dec_mes6"]["p50"]), f"{100*M['dec_mes6']['riesgo']:.1f} %",
            f"{M['dec_mes6']['obra_pct']:.0f} %", f"mes {M['dec_mes6']['obra_mes']}"],
           ["DECISIÓN: sin obra, mes 4 + 2 meses de gastos", str(D["ventas"]), eur(D["p10"]), eur(D["p50"]),
            f"{100*D['riesgo']:.1f} %", f"{D['obra_pct']:.0f} %", f"mes {D['obra_mes']}"],
           ["Sin obra, desde el mes 9 (+2 meses de gastos)", str(M["dec_mes9"]["ventas"]), eur(M["dec_mes9"]["p10"]),
            eur(M["dec_mes9"]["p50"]), f"{100*M['dec_mes9']['riesgo']:.1f} %",
            f"{M['dec_mes9']['obra_pct']:.0f} %", f"mes {M['dec_mes9']['obra_mes']}"],
           ["Sin obra, desde el mes 4 (+4 meses de gastos)", str(M["dec_margen4"]["ventas"]), eur(M["dec_margen4"]["p10"]),
            eur(M["dec_margen4"]["p50"]), f"{100*M['dec_margen4']['riesgo']:.1f} %",
            f"{M['dec_margen4']['obra_pct']:.0f} %", f"mes {M['dec_margen4']['obra_mes']}"]],
          [244, 54, 84, 84, 66, 76, 78], size=8, hrow=17, bold_rows=(4,),
          aligns=["l", "c", "r", "r", "c", "c", "c"])
    wrap(c, f"Con la decisión, el día 1 cierra con {eur(D['dia1'])} € en caja y la obra se paga en el mes {D['obra_mes']} "
            f"(el 10 % de los casos antes del mes 5). Ni un solo escenario se queda sin fondo: la caja mínima mediana es "
            f"{eur(D['min_caja'])} €. Y si el mercado cae un 40 %, la obra se paga igual en el {DM['obra_pct']:.0f} % "
            f"de los casos (mes {DM['obra_mes']}): se retrasa sola cuando hay que retrasarla.",
         36, 250, 890, size=8.5, leading=12, color=SLATE, max_lines=3)
    c.setFillColor(RED)
    c.setFont("DejaVuBold", 9)
    c.drawString(36, 198, "LO ÚNICO QUE EL MODELO NO MIDE: LA IMAGEN")
    wrap(c, "La nave sin arreglar puede frenar la venta y eso sí que vale dinero. Si el aspecto costara sólo un 10 % más de "
            "días por coche, el patrimonio caería de "
            f"{eur(D['p50'])} € a {eur(M['dec_img10']['p50'])} € (~{eur(D['p50'] - M['dec_img10']['p50'])} €); con un 20 %, a "
            f"{eur(M['dec_img20']['p50'])} €. Por eso: 1) medir los días reales de venta en el ERP desde el primer coche; "
            "2) si pasan de 50, adelantar la pintura (479 €) antes que la obra entera, que es lo barato y lo que se ve.",
         36, 182, 890, size=8.5, leading=12, color=INK, max_lines=3)
    card(c, 36, 84, 284, 70, "Caja el día 1 (decisión)", f"{eur(D['dia1'])} €",
         f"plan de hoy: {eur(M['dec_obradia1']['dia1'])} €", acento=GREEN)
    card(c, 336, 84, 284, 70, "Obra pagada (mediana)", f"mes {D['obra_mes']}",
         f"antes del mes 5 en el 10 % de los casos", acento=GOLD)
    card(c, 636, 84, 288, 70, "Patrimonio al mes 36", f"{eur(D['p50'])} €",
         f"con la obra el día 1: {eur(M['dec_obradia1']['p50'])} €", acento=GOLD)


@page
def p_disparadores(c, n, t):
    bg(c, dark=True)
    kicker(c, "Control del plan", H - 42)
    c.setFillColor(white)
    c.setFont("DejaVuSerif", 22)
    c.drawString(36, H - 72, "Tres disparadores que obligan a cambiar el plan")
    y = 378
    bloques = [
        ("Mes 6 con menos de 5 coches vendidos", "El problema es la captación, no la nave. Parar la reinversión y trabajar web y portales."),
        ("Mes 12 con menos de 16 coches vendidos", "Recortar el stock de trabajo a 5 plazas y bajar la nómina un escalón."),
        ("Flota llena tres meses seguidos con caja sobre el fondo",
         "Mudanza, si se empezó en la nave de paso: en el modelo, el mes " + str(MUD_MES) + ". Y el contrario: tres meses pagando "
         "plazas que no puedes llenar por falta de capital significa que el contrato es demasiado grande."),
    ]
    for tit, txt in bloques:
        c.setStrokeColor(GOLD)
        c.setFillColor(Color(0.16, 0.17, 0.20))
        c.roundRect(36, y - 66, 880, 84, 3, fill=1, stroke=1)
        c.setFillColor(GOLD)
        c.setFont("DejaVuBold", 11)
        c.drawString(54, y - 4, tit)
        wrap(c, txt, 54, y - 24, 840, size=9.5, leading=13, color=Color(0.86, 0.85, 0.82), max_lines=2)
        y -= 98
    c.setFillColor(GOLD)
    c.setFont("DejaVuBold", 8.5)
    c.drawString(36, 96, "Y EL CONTROL QUE MIDE TODO ESTO:")
    wrap(c, "Un campo por coche en el ERP: fecha de compra, fecha de anuncio y fecha de cobro. De ahí salen los días reales de cada modelo. "
            "A los seis meses se compara con la tabla de días y el modelo se ajusta solo: si el 116d sale a 25 días, las cifras suben; si sale a 60, al revés.",
         36, 80, 880, size=9, leading=12.5, color=Color(0.86, 0.85, 0.82), max_lines=3)


@page
def p_limites(c, n, t):
    bg(c)
    heading(c, "Lo que este modelo no dice", "Límites y letra pequeña, para que nadie se lleve una sorpresa")
    items = [
        ("No es una previsión, es un modelo", "Los días de venta llevan fuente y fecha; la rampa del negocio (65 % al principio) y la estacionalidad son supuestos declarados. Los escenarios de las secciones anteriores enseñan el rango."),
        ("No incluye financiación", "Los 50.000 € son propios. Con aval y póliza el arranque cambia por completo (dossier de Sogarpo): es otro escenario."),
        ("El viaje no siempre sale bien", "El modelo da por hecho que cada viaje acaba con un coche bueno comprado. Volver con las manos vacías cuesta un vuelo (135 € + 39 €) y, sobre todo, tiempo."),
        ("Las naves no están negociadas", "Los precios son de anuncios de octubre de 2026: faltan visita, estado real, potencia eléctrica y contrato. El ancho ya está confirmado (10 m) y con él la capacidad (24-28)."),
        ("La capacidad de O Milladoiro", "El almacén tiene 40 × 10 m: dos filas de coches a 45° ocupan 9,19 m, así que caben 24 (espiga) y hasta 28 "
                                          "(mixta) sin pasillo de circulación. Se opera como stock: los coches del fondo se mueven cuando hay interés real. "
                                          "La nave no se llena de verdad hasta el mes 25 (mediana) y está por encima de 20 coches 14 de los 36 meses."),
        ("La fiscalidad de los escenarios sin sociedad", "Está aproximada con el mismo motor. La gestoría debe confirmarla."),
        ("Dos palancas que no recoge", "Vender con señal un coche antes de comprarlo, y comprar en subasta de flota (BCA, Autorola) en vez de anuncio: baja el coste de compra un 5-10 %."),
    ]
    y = 430
    for tit, txt in items:
        c.setFillColor(GOLD_DEEP)
        c.setFont("DejaVuBold", 9)
        c.drawString(36, y, "· " + tit)
        wrap(c, txt, 36, y - 14, 880, size=9, leading=12, color=SLATE, max_lines=3)
        y -= 50


@page
def p_final(c, n, t):
    bg(c, dark=True)
    kicker(c, "Cierre", H - 42)
    c.setFillColor(white)
    c.setFont("DejaVuSerif", 24)
    c.drawString(36, H - 76, "En una frase")
    y = 380
    wrap(c, "El plan de hoy no falla por vender poco: falla por pagar la nave, la fianza y la reforma antes de tener coches que facturen.",
         36, y, 880, size=13, leading=19, color=GOLD, max_lines=3)
    y -= 66
    for txt in (
        f"Decision tomada: O Milladoiro desde el día 1, sin obra al abrir, y la obra (5.115 €) pagada por la caja cuando cubra el fondo y dos meses más. "
        f"Mediana: mes {M['dec']['obra_mes']}. Caja mínima, 2.446 €.",
        f"Con la operación comprometida (unidades vistas, ciclo de una semana, placas temporales) y 14 plazas: 209 ventas y {eur(M['dec']['p50'])} € de patrimonio al mes 36, con la obra ya pagada.",
        f"Y un aviso: diez puntos de días de venta valen seis veces más que la obra. Si la nave sin arreglar frena la venta, se adelanta la pintura, no la obra entera.",
    ):
        wrap(c, txt, 36, y, 880, size=10.5, leading=15, color=Color(0.86, 0.85, 0.82), max_lines=3)
        y -= 40
    y -= 10
    wrap(c, f"Detalle de método: la tabla mes a mes de las láminas 6-7 es la trayectoria central de 300 simulaciones "
            f"(125 ventas, {eur(M['tray']['patrimonio'])} € de patrimonio); la comparativa de la lámina 8 corre 250 simulaciones por fila.",
         36, y + 30, 880, size=9.5, leading=13, color=Color(0.72, 0.70, 0.64), max_lines=2)
    y -= 30
    c.setFillColor(GOLD)
    c.rect(36, y + 12, 100, 2, fill=1, stroke=0)
    wrap(c, "Reproducible: python3 modelo_realista.py --sims 250 · Los informes completos están en REVISION_REALISTA_ARRANQUE.md y ANALISIS_TIEMPO_VENTA.md, "
            "y la lista de correcciones del PDF del plan en QUE_CORREGIR_EN_EL_PDF.md.",
         36, y - 8, 880, size=9, leading=12.5, color=Color(0.72, 0.70, 0.64), max_lines=3)


def main():
    total = len(PAGES)
    c = canvas.Canvas(str(OUT), pagesize=(W, H))
    c.setTitle("KHC Auto Import · Revisión realista del arranque")
    c.setAuthor("KHC Auto Import")
    for i, fn in enumerate(PAGES, start=1):
        fn(c, i, total)
        footer(c, i, total, dark=(fn in (p_cover, p_disparadores, p_final)))
        c.showPage()
    c.save()
    print(f"escrito {OUT.name} · {total} láminas · {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()

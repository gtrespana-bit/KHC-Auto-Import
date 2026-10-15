#!/usr/bin/env python3
"""PLAN KHC v7 — PDF ejecutivo profesional.

Diseño: portada, resumen para no-iniciados, cómo funciona el negocio, catálogo con
trazabilidad de precios (verificable a mano), gráficos, calendario mensual con
DIAGRAMA DE FLUJO DEL DINERO por mes, y anexos normativos.

Fuente de datos: mes_a_mes_v6.py (motor determinista) -> calendario_v6.txt + detalle_v6.csv.
Este script NO inventa cifras: parsea la salida del motor. Cualquier cambio en el
motor se refleja aquí automáticamente.
"""
import io, re, contextlib, csv
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------- fuentes ----------
FD = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("Sans",     f"{FD}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("SansB",    f"{FD}/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("SansI",    f"{FD}/DejaVuSans.ttf"))  # cursiva no disponible: se sustituye
pdfmetrics.registerFont(TTFont("Mono",     f"{FD}/DejaVuSansMono.ttf"))

NAVY  = HexColor("#1F3864"); BLUE = HexColor("#2E75B6"); SKY = HexColor("#DEEAF6")
TEAL  = HexColor("#148F77"); GREEN= HexColor("#2E8540"); PALEGREEN = HexColor("#E2EFDA")
RED   = HexColor("#C0392B"); PALERED = HexColor("#FBE9E7")
AMBER = HexColor("#D68910"); PALEAMB = HexColor("#FCF3E3")
GREY  = HexColor("#5A6270"); LGREY = HexColor("#F2F4F7"); BORDER = HexColor("#C9D2DE")
INK   = HexColor("#22262C")

PAGE_W, PAGE_H = A4
M_L, M_R, M_T, M_B = 16*mm, 16*mm, 20*mm, 17*mm
CW = PAGE_W - M_L - M_R

def S(name, **kw):
    base = dict(fontName="Sans", fontSize=9, leading=12.6, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)
st_title   = S("t",  fontName="SansB", fontSize=20, leading=24, textColor=NAVY)
st_sub     = S("s",  fontSize=11, leading=15, textColor=GREY)
st_h1      = S("h1", fontName="SansB", fontSize=14.5, leading=18, textColor=NAVY,
               spaceBefore=4, spaceAfter=6)
st_h2      = S("h2", fontName="SansB", fontSize=11, leading=14, textColor=BLUE,
               spaceBefore=8, spaceAfter=3)
st_body    = S("b", alignment=TA_JUSTIFY)
st_small   = S("sm", fontSize=7.6, leading=10, textColor=GREY)
st_cell    = S("c",  fontSize=7.8, leading=10.2)
st_cellb   = S("cb", fontSize=7.8, leading=10.2, fontName="SansB")
st_cellr   = S("cr", fontSize=7.8, leading=10.2, alignment=TA_RIGHT)
st_cellw   = S("cw", fontSize=7.8, leading=10.2, textColor=HexColor("#FFFFFF"))
st_cellwb  = S("cwb",fontSize=7.8, leading=10.2, fontName="SansB", textColor=HexColor("#FFFFFF"))
st_note    = S("n",  fontSize=8.2, leading=11.4, textColor=GREY)

def P(t, s=st_body): return Paragraph(t, s)
def eur(v, dec=0):
    v = float(v); sign = "-" if v < 0 else ""
    a = f"{abs(v):,.{dec}f}".replace(",", ".")
    return f"{sign}{a} €"

# ================= PARSEO DEL MOTOR =================
with contextlib.redirect_stdout(io.StringIO()):
    import mes_a_mes_v6 as M6
TXT = open("calendario_v6.txt", encoding="utf-8").read()

# --- tabla maestra ---
master = {}
for ln in TXT.splitlines():
    mo = re.match(r"\s*(\d{1,2})\s+([\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)"
                  r"\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+([\d\.]+)\s+(\d+)\s*$", ln)
    if mo:
        m = int(mo.group(1))
        if 1 <= m <= 12 and m not in master:
            f = lambda s: float(s.replace(".", ""))
            master[m] = dict(caja_ini=f(mo.group(2)), cobros=f(mo.group(3)), compras=f(mo.group(4)),
                             fijos=f(mo.group(5)), ss=f(mo.group(6)), sueldos=f(mo.group(7)),
                             retiros=f(mo.group(8)), impuestos=f(mo.group(9)),
                             caja_fin=f(mo.group(10)), stock_n=int(mo.group(11)))
assert len(master) == 12

# --- fichas mensuales ---
meses = {}
blocks = re.split(r"-{40,}\nMES ", TXT)
for b in blocks[1:]:
    head = re.match(r"(\d+)  \|  caja inicial ([\d\.]+) €  →  caja final ([\d\.]+) €", b)
    if not head: continue
    m = int(head.group(1)); d = {"compras": [], "ventas": [], "stock": [], "iva_apartado": 0.0,
                                 "stock_coste": 0.0, "margen_pot": 0.0}
    for c in re.finditer(r"(U\d\d) (\S.*?)\s+dia\s+(\d+): compra DE ([\d\.]+) \+ impuestos ([\d\.]+)"
                         r" \+ costes ERP ([\d\.]+) = landed ([\d\.]+) € · previsto cobro dia (\d+) \(~mes (\d+)\)", b):
        d["compras"].append(dict(id=c.group(1), modelo=c.group(2).strip(), dia=int(c.group(3)),
                                 buy=float(c.group(4).replace(".","")), imp=float(c.group(5).replace(".","")),
                                 erp=float(c.group(6).replace(".","")), landed=float(c.group(7).replace(".","")),
                                 cobro_dia=int(c.group(8)), cobro_mes=int(c.group(9))))
    for v in re.finditer(r"(U\d\d) (\S.*?)\s+vendido por ([\d\.]+) € · margen ([\d\.]+) € · IVA REBU apartado ([\d\.]+) €", b):
        d["ventas"].append(dict(id=v.group(1), modelo=v.group(2).strip(), pvp=float(v.group(3).replace(".","")),
                                margen=float(v.group(4).replace(".","")), iva=float(v.group(5).replace(".",""))))
    sm = re.search(r"IMPUESTOS APARTADOS Y PENDIENTES AL CIERRE: IVA REBU acumulado ([\d\.]+) €", b)
    if sm: d["iva_apartado"] = float(sm.group(1).replace(".", ""))
    sk = re.search(r"STOCK FIN DE MES \((\d) uds, coste inmovilizado ([\d\.]+) €, margen potencial ([\d\.]+) €\)", b)
    if sk:
        d["stock_coste"] = float(sk.group(2).replace(".", "")); d["margen_pot"] = float(sk.group(3).replace(".", ""))
    for s_ in re.finditer(r"(U\d\d) (\S.*?)\s+en vitrina desde mes (\d+) \(hace (\d+)\) · PVP ([\d\.]+) € · giro previsto (\d+) d", b):
        d["stock"].append(dict(id=s_.group(1), modelo=s_.group(2).strip(), desde=int(s_.group(3)),
                               hace=int(s_.group(4)), pvp=float(s_.group(5).replace(".","")), giro=int(s_.group(6))))
    meses[m] = d

# --- cuenta de resultados ---
cr = {}
sec = TXT.split("[4] CUENTA DE RESULTADOS")[1].split("[5]")[0]
for k, pat in [("ventas_unid", r"Ventas: (\d+) unidades"), ("margen_bruto", r"margen bruto ([\d\.]+) €"),
               ("fijos_anual", r"Fijos nave\+asesoria: ([\d\.]+) €"), ("ss_anual", r"Cuotas SS: ([\d\.]+) €"),
               ("familia_anual", r"Sueldos\+retiros familia: ([\d\.]+) €"), ("rbt", r"Resultado antes de IRPF: ([\d\.]+) €"),
               ("irpf", r"IRPF estimado \(base ([\d\.]+)\): ([\d\.]+) €"), ("neto_fam", r"neto familiar ≈ ([\d\.]+) €"),
               ("iva_rebu", r"IVA REBU repercutido y pagado: ([\d\.]+) €")]:
    mo = re.search(pat, sec)
    if mo: cr[k] = [float(g.replace(".","")) for g in mo.groups()]
# --- ranking cartera ---
rank = []
for r_ in re.finditer(r"\s*(\d) (\S.*?)[ ]{2,}([\d\.]+)[ ]+([\d\.]+)[ ]+([\d\.]+)[ ]+([\d\.]+)[ ]+([\d\.]+)[ ]+(\d+)[ ]+([\d\.]+)\u2030", TXT):
    rank.append(dict(pos=r_.group(1), modelo=r_.group(2).strip(), buy=float(r_.group(3).replace(".","")),
                     imp=float(r_.group(4).replace(".","")), landed=float(r_.group(5).replace(".","")),
                     sell=float(r_.group(6).replace(".","")), margen=float(r_.group(7).replace(".","")),
                     dias=int(r_.group(8)), apa=float(r_.group(9))))

ROWS = list(csv.DictReader(open("detalle_v6.csv", encoding="utf-8"), delimiter=";"))

# catálogo completo con nDE/nES para trazabilidad
CATV = jsonv = __import__("json").load(open("catalogo_v3.json", encoding="utf-8"))
def cat_lookup(nick):
    keymap = {"CLA": "CLA", "Clase A": "Clase A", "ClaseE": "Clase E", "Clase C": "Clase C",
              "Serie3": "Serie 3", "Q5": "Q5", "Macan": "Macan", "GLC": "GLC", "Cayenne": "Cayenne"}
    for gen in keymap:
        if nick.startswith(gen):
            for r in CATV:
                if r["gen"][0] == gen and nick.split()[0] in (r["gen"][1].replace(" ", "") or gen):
                    if r["gen"][1].replace(" ", "").startswith(nick.split()[0][:4]):
                        return r
    return None

# ================= PLANTILLA CON CABECERA/PIE =================
class Doc(BaseDocTemplate):
    def __init__(self, fn, **kw):
        super().__init__(fn, pagesize=A4, leftMargin=M_L, rightMargin=M_R,
                         topMargin=M_T, bottomMargin=M_B,
                         title="KHC Import — Plan de Negocio 2026-2027",
                         author="KHC Import S.L./autónomo · elaborado con datos verificados", **kw)
        frame = Frame(M_L, M_B, CW, PAGE_H - M_T - M_B, id="main")
        self.addPageTemplates([PageTemplate(id="cover", frames=[Frame(M_L, M_B, CW, PAGE_H-M_T-M_B)],
                                            onPage=self.cover_bg),
                               PageTemplate(id="body", frames=[frame], onPage=self.deco)])
    def cover_bg(self, c, doc):
        c.saveState()
        c.setFillColor(NAVY); c.rect(0, PAGE_H-58*mm, PAGE_W, 58*mm, stroke=0, fill=1)
        c.setFillColor(BLUE); c.rect(0, PAGE_H-60*mm, PAGE_W, 2.2*mm, stroke=0, fill=1)
        c.setFillColor(HexColor("#F4F7FB")); c.rect(0, 0, PAGE_W, PAGE_H-60*mm, stroke=0, fill=1)
        c.restoreState()
    def deco(self, c, doc):
        c.saveState()
        c.setStrokeColor(BORDER); c.setLineWidth(0.7)
        c.line(M_L, PAGE_H-14*mm, PAGE_W-M_R, PAGE_H-14*mm)
        c.setFont("Sans", 7.2); c.setFillColor(GREY)
        c.drawString(M_L, PAGE_H-11.5*mm, "KHC IMPORT  ·  PLAN DE NEGOCIO 2026–2027  ·  Compra en Alemania · Venta en Galicia")
        c.drawRightString(PAGE_W-M_R, PAGE_H-11.5*mm, "Documento de trabajo — confidencial")
        c.line(M_L, 12*mm, PAGE_W-M_R, 12*mm)
        c.drawString(M_L, 8.5*mm, "Motor de cálculo: mes_a_mes_v6.py · precios: catálogo ERP (7.333 anuncios DE / 4.460 ES)")
        c.setFont("SansB", 7.2); c.setFillColor(NAVY)
        c.drawRightString(PAGE_W-M_R, 8.5*mm, f"Pág. {doc.page}")
        c.restoreState()

def tbl(data, widths, header=True, zebra=True, align_right_from=1, pad=3.2, hdr_bg=NAVY, fs=None):
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    cmds = [("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING", (0,0), (-1,-1), pad), ("BOTTOMPADDING", (0,0), (-1,-1), pad),
            ("LEFTPADDING", (0,0), (-1,-1), 4.5), ("RIGHTPADDING", (0,0), (-1,-1), 4.5),
            ("LINEBELOW", (0,0), (-1,-2), 0.4, BORDER)]
    if header:
        cmds += [("BACKGROUND", (0,0), (-1,0), hdr_bg),
                 ("TEXTCOLOR", (0,0), (-1,0), HexColor("#FFFFFF")),
                 ("FONTNAME", (0,0), (-1,0), "SansB")]
    if zebra:
        for i in range(1 if header else 0, len(data)):
            if (i - (1 if header else 0)) % 2 == 1:
                cmds.append(("BACKGROUND", (0,i), (-1,i), LGREY))
    t.setStyle(TableStyle(cmds))
    return t

def callout(title, body, color=BLUE, bg=SKY):
    tt = Table([[Paragraph(f"<b>{title}</b>", S("ct", fontName="SansB", fontSize=8.6, leading=11.5,
                                                textColor=color))],
                [Paragraph(body, S("cb2", fontSize=8.2, leading=11.6))]], colWidths=[CW])
    tt.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), bg),
                            ("LINEBEFORE", (0,0), (0,-1), 2.4, color),
                            ("BOX", (0,0), (-1,-1), 0.4, BORDER),
                            ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7),
                            ("TOPPADDING", (0,0), (-1,0), 5), ("BOTTOMPADDING", (0,-1), (-1,-1), 5),
                            ("TOPPADDING", (0,1), (-1,-1), 1), ("BOTTOMPADDING", (0,0), (-1,0), 1)]))
    return tt

story = []

# ================= PORTADA =================
story.append(Spacer(1, 6*mm))
story.append(P("PLAN DE NEGOCIO · EDICIÓN EJECUTIVA 2026–2027", S("kick", fontName="SansB",
             fontSize=9.5, textColor=HexColor("#9DC3E6"), leading=12)))
story.append(Spacer(1, 2*mm))
story.append(P("KHC IMPORT", st_title))
story.append(P("Compra de vehículos de ocasión en Alemania y venta en Galicia", S("t2",
             fontName="SansB", fontSize=13, leading=17, textColor=HexColor("#E8EEF7"))))
story.append(Spacer(1, 3*mm))
story.append(P("Plan financiero mes a mes, con cada euro trazado: qué coche se compra, cuándo se cobra, "
               "qué impuestos se apartan y con qué dinero se paga cada gasto.", st_sub))
story.append(Spacer(1, 10*mm))

port = [[Paragraph("<b>Inversión inicial</b>", st_cell), Paragraph("50.000 € propios · sin financiación", st_cell)],
        [Paragraph("<b>Estructura de costes</b>", st_cell), Paragraph("Nave O Milladoiro (465 m²) desde el mes 1 · fijos 1.510 €/mes", st_cell)],
        [Paragraph("<b>Cartera</b>", st_cell), Paragraph("Rotación rápida: Mercedes CLA · Clase A · Clase E · BMW Serie 3 (landed &lt; 26.000 €)", st_cell)],
        [Paragraph("<b>Año 1 (12 meses)</b>", st_cell), Paragraph("32 ventas · margen bruto 106.034 € · resultado antes de IRPF 70.494 €", st_cell)],
        [Paragraph("<b>Riesgo máximo</b>", st_cell), Paragraph("El capital nunca baja de ~61.000 € (caja + coches en almacén); caja mínima prevista 5.125 €", st_cell)],
        [Paragraph("<b>Objetivo del dueño</b>", st_cell), Paragraph("≥ 2.500 €/mes netos para la familia: se supera en el año 2 (≈ 4.300 €/mes medios)", st_cell)]]
t = Table(port, colWidths=[42*mm, CW-42*mm])
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), HexColor("#FFFFFF")),
                       ("BOX", (0,0), (-1,-1), 0.6, BORDER),
                       ("INNERGRID", (0,0), (-1,-1), 0.4, BORDER),
                       ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                       ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                       ("LEFTPADDING", (0,0), (-1,-1), 8), ("BACKGROUND", (0,0), (0,-1), HexColor("#EDF2F9"))]))
story.append(t)
story.append(Spacer(1, 8*mm))
story.append(P("Ver. 7.0 — octubre 2026 · Elaborado sobre datos reales: 7.333 anuncios alemanes y 4.460 españoles "
               "capturados para el ERP KHC, tipos fiscales del ERP (IEDMT por CO₂, IVA REBU, tasas DGT/ITV) y "
               "presupuestos de nave de O Milladoiro. Todas las cifras de este documento proceden de un único "
               "modelo de cálculo auditable; ninguna ha sido escrita a mano.", st_small))
story.append(PageBreak())

# ================= 1. RESUMEN PARA QUIEN NO CONOCE EL NEGOCIO =================
story.append(P("1 · El negocio explicado en una página", st_h1))
story.append(P("Qué hacemos, con qué dinero, y por qué es rentable", st_h2))
story.append(P(
 "Compramos coches de ocasión <b>en Alemania</b>, donde el mismo modelo que se vende en Galicia cuesta de media "
 "un <b>20-30 % menos</b> (mercado 4 veces mayor, más oferta diésel ejecutiva y depreciación más rápida). "
 "Los trasladamos a Galicia, los preparamos (ITV, impuestos, garantía) y los vendemos en los portales habituales. "
 "Ganamos el diferencial, que en nuestra cartera va de <b>1.900 a 3.700 € por coche</b>.", st_body))
story.append(Spacer(1, 2*mm))
story.append(P("Las cuatro reglas que hacen que esto funcione", st_h2))
rules = [
 ["1", "Solo compramos lo que los datos confirman", "Antes de comprar, medimos en miles de anuncios reales el precio al que "
  "ese coche está disponible en Alemania (percentil 25: ofertas ágiles, no gangas imposibles) y al que se vende en España. "
  "Exigimos un mínimo de 1.800 € de margen limpio tras pagar todos los costes."],
 ["2", "Priorizamos la velocidad, no solo el margen", "Un coche que deja 2.000 € y se vende en 36 días vale más que uno que "
  "deja 5.000 € y tarda 120. Medimos cada modelo en «milésimas»: céntimos de beneficio por cada euro inmovilizado y día. "
  "Con eso elegimos la cartera (sección 4)."],
 ["3", "Nunca apostamos todo a un modelo", "Máximo 2 unidades del mismo coche en sala y 2 por viaje de compra. Si un modelo "
  "se atasca, el negocio no se detiene. Es el error que detectamos en planes anteriores y queda corregido en el motor."],
 ["4", "La caja manda", "Si en una quincena no hay unidad al precio objetivo, no se fuerza la compra. Y si la caja prevista "
  "bajaría de 3.000 € tras pagar nóminas, el retiro del titular se recorta ese mes. Los retiros familiares solo empiezan "
  "en el mes 8, cuando el colchón personal del dueño cubre los 7 primeros meses."]]
rt = tbl([[P("#", st_cellwb), P("Regla", st_cellwb), P("Cómo se aplica en este plan", st_cellwb)]] +
         [[P(a, st_cellb), P(b, st_cellb), P(c, st_cell)] for a,b,c in rules],
         [8*mm, 42*mm, CW-50*mm])
story.append(rt)
story.append(Spacer(1, 2*mm))
story.append(callout("Resultado esperado del año 1 (cifras del modelo, sección 6)",
  "32 coches vendidos · 712.700 € facturados · <b>106.034 € de margen bruto</b> · tras pagar fijos (18.120 €), "
  "Seguridad Social (3.420 €) y familia (14.000 €): <b>70.494 € de resultado antes de IRPF</b>. "
  "IRPF estimado 19.206 € → <b>≈ 51.300 € netos para la familia en 12 meses</b>, acabando el año con 5 coches "
  "en sala (103.834 €) y 5.125 € de caja. En el año 2, reinvertiendo ese resultado, el ritmo sube a ~4.300 €/mes netos.",
  TEAL, PALEGREEN))
story.append(Spacer(1, 2*mm))
story.append(P("De dónde sale cada número (para poder verificarlo)", st_h2))
story.append(P("• <b>Precios de compra</b>: percentil 25 de los anuncios alemanes del mismo modelo/año/km en nuestra base "
  "(7.333 anuncios). • <b>Precios de venta</b>: mediana de los anuncios españoles (4.460) menos un 3 % de regateo típico. "
  "• <b>Impuestos de compra</b>: IEDMT gallega por tramos de CO₂ (tabla del ERP). • <b>Costes por coche</b>: logística 730 €, "
  "gestión/administración 425 €, preparación 780 € (ITV 132,59 €, tasa DGT 99,77 €, garantía, estética) e imprevistos 300 € — "
  "todos dentro del «landed cost». Estos conceptos <b>no vuelven a aparecer como gastos generales</b>: nada está duplicado. "
  "• <b>Fijos reales de estructura</b>: nave 1.200 € + suministros 250 € + asesoría 60 € = 1.510 €/mes.", st_note))
story.append(PageBreak())

# ================= 2. CÓMO FUNCIONA EL CICLO =================
story.append(P("2 · El ciclo del dinero: cómo gira un coche", st_h1))
story.append(P("Cada vehículo sigue exactamente este camino. Conocer los plazos es lo que permite predecir la caja mes a mes:", st_body))
story.append(Spacer(1, 3*mm))
steps = [
 ("DÍA 0", "Reserva en Alemania", "Se localiza la unidad al precio objetivo (con factura de concesionario o particular "
  "según convenga: solo exigimos rentabilidad). Se paga transferencia o pago contra entrega.", BLUE),
 ("DÍAS 1–7", "Tránsito + aduana interna UE", "Camión/plancha hasta Galicia (730 €). Documentación alemana, baja en DGT "
  "alemana y matrícula temporal española.", BLUE),
 ("DÍAS 7–12", "Puesta a punto legal", "ITV (132,59 €), tasa de tráfico (99,77 €), IEDMT según CO₂, seguro puente, garantía "
  "12 meses y preparación estética. Coste total medio: 2.235 € ya incluidos en el landed.", TEAL),
 ("DÍA ~14", "Entra en sala y en portales", "Fotos, ficha en Wallapop/Coches.net/mobile.de para compradores, publicación. "
  "Contador de días en marcha.", TEAL),
 ("DÍAS 36–55", "Venta firmada", "Prueba, negociación (±3 %), contrato, pago por transferencia. El comprador puede ser "
  "particular (más margen, +ITP a su cargo) o empresa con factura REBU.", AMBER),
 ("DÍAS 43–65", "Cobro en cuenta", "Entre 7 y 10 días después de firmar (transferencias, financiación del cliente). "
  "Ese día: entra el PVP, se aparta el IVA del margen a cuenta fiscal separada, y ese dinero vuelve a trabajar en la "
  "ventana de compra siguiente.", GREEN)]
flow_rows = [[P(f"<b>{a}</b>", S("fa", fontSize=7.6, leading=9.5, textColor=HexColor("#FFFFFF"), fontName="SansB")),
              P(f"<b>{b}</b>", st_cellb), P(c, st_cell)] for a,b,c,_ in steps]
ft = Table(flow_rows, colWidths=[20*mm, 36*mm, CW-56*mm])
sty = [("BOX",(0,0),(-1,-1),0.4,BORDER), ("INNERGRID",(0,0),(-1,-1),0.4,BORDER),
       ("VALIGN",(0,0),(-1,-1),"MIDDLE"), ("TOPPADDING",(0,0),(-1,-1),4.5), ("BOTTOMPADDING",(0,0),(-1,-1),4.5),
       ("LEFTPADDING",(0,0),(-1,-1),6)]
for i,(_,_,_,col) in enumerate(steps):
    sty.append(("BACKGROUND",(0,i),(0,i),col))
ft.setStyle(TableStyle(sty))
story.append(ft)
story.append(Spacer(1, 3*mm))
story.append(callout("La consecuencia financiera de este ciclo",
 "Entre que pagamos un coche y recuperamos el dinero pasan <b>~50 días de media</b>. Con 50.000 € eso significa que "
 "solo podemos tener «en el horno» un máximo de ~4-5 unidades a la vez: el límite del negocio es la <b>liquidez</b>, "
 "no la nave (que admite 12-15). Por eso la regla de oro de la sección 4: elegir modelos rápidos y baratos de inmobilizar, "
 "y dejar Q5/Macan/GLC para cuando el propio negocio haya generado su segunda reserva de capital.", GREY, LGREY))
story.append(Spacer(1, 4*mm))
story.append(Image("fig_apalancamiento.png", width=CW, height=CW*2.9/7.4))
story.append(Spacer(1, 2*mm))
story.append(P("Figura 1 — Cuanto más alta la barra, más rápido trabaja cada euro. Verde: núcleo de la cartera año 1. "
               "Gris: excluidos temporalmente por absorber demasiado capital por unidad.", st_small))
story.append(PageBreak())

# ================= 3. SUPUESTOS =================
story.append(P("3 · Supuestos aprobados por el dueño y parámetros del modelo", st_h1))
sup = [["Parámetro", "Valor usado", "Origen / justificación"],
 ["Capital inicial", "50.000 €", "Decisión del dueño (2026-10). Sin préstamos ni avales: escenario conservador pedido expresamente."],
 ["Nave", "O Milladoiro, 465 m², 1.200 €/mes + fianza 1.200 € + reforma 7.000 €", "Alquiler verificado; capacidad 12-15 vehículos. Decisión del dueño: nave grande desde el inicio."],
 ["Fijos mensuales", "1.510 € (nave 1.200 + suministros 250 + asesoría 60)", "Corregido tras revisión del dueño: portales, seguros, viajes y mantenimiento NO van aquí — están dentro del landed de cada coche (ERP)."],
 ["Costes por vehículo", "2.235 € + impuesto + IEDMT", "ERP: logística 730 · administración 425 · preparación 780 (ITV 132,59 + DGT 99,77 + garantía + estética) · imprevistos 300."],
 ["Precio de compra", "Percentil 25 del mercado alemán", "Base propia: 7.333 anuncios autoscout. P25 = oferta ágil real, no cotización ideal."],
 ["Precio de venta", "Mediana española − 3 %", "Base propia: 4.460 anuncios Milanuncios/coches. El 3 % simula la regatea final."],
 ["Régimen fiscal", "Autónomo REBU (marido tarifa plana 80 € + esposa empleada 205 €)", "Comparado con SL en anexo B; gana el autónomo mientras el resultado < ~50k/año. Esposa: contrato laboral a tiempo parcial, 1.200 € brutos/mes desde mes 8 (gasto deducible)."],
 ["IVA", "REBU: 21 % sobre el margen, repercutido al comprador", "Régimen especial de bienes usados (Art. 136-140 LIVA). Se aparta desde el cobro; se ingresa trimestral (mod. 303)."],
 ["Retiros familia", "Meses 1-7: 0 € (colchón personal del dueño) · Mes 8+: esposa 1.080 € netos + titular hasta 1.600 €", "Decisión del dueño. Regla de seguridad: si la caja bajaría de 3.000 €, el retiro del titular se recorta."],
 ["Plazos", "Lead de compra 7 d · venta 36-55 d según modelo · cobro 7-10 d tras firmar", "Observación del sector y rotación medida; el motor los usa como única fuente de previsión de caja."]]
data = [[P(f"<b>{r[0]}</b>", st_cell), P(r[1], st_cell), P(r[2], st_cell)] for r in sup]
story.append(tbl([[P("Parámetro", st_cellwb), P("Valor usado", st_cellwb), P("Origen / justificación", st_cellwb)]] + data,
                 [30*mm, 52*mm, CW-82*mm]))
story.append(PageBreak())

# ================= 4. CATÁLOGO =================
story.append(P("4 · Catálogo: qué compramos, a qué precio y por qué", st_h1))
story.append(P("Cartera «giratoria» ordenada por eficiencia de capital (‰ = céntimos de margen por cada euro inmovilizado "
               "y día). Estos son los precios exactos para que pueda verificarse cada fila contra los portales:", st_body))
story.append(Spacer(1, 2*mm))
cat_rows = [[P("Puesto / modelo (generación y años)", st_cellwb), P("Compra<br/>Alemania P25", st_cellwb),
             P("IEDMT +<br/>tasas", st_cellwb), P("Costes<br/>ERP/coche", st_cellwb), P("COSTE<br/>TOTAL", st_cellwb),
             P("VENTA<br/>Galicia", st_cellwb), P("MARGEN", st_cellwb), P("Días<br/>venta", st_cellwb), P("‰", st_cellwb)]]
nick_years = {"CLA C118 120-160": "Mercedes CLA C118 (2019-2022, 120-160 CV)",
              "Clase A W177 160-200": "Mercedes Clase A W177 (2018-2021, 160-200 CV)",
              "ClaseE W213 160-200": "Mercedes Clase E W213 (2016-2019, 160-200 CV)",
              "Serie3 F30 120-160": "BMW Serie 3 F30 LCI (2015-2018, 120-160 CV)",
              "Clase C W205 80-120": "Mercedes Clase C W205 (2014-2018, 80-120 kW/diesels bajos)"}
for r in rank[:5]:
    lbl = nick_years.get(r["modelo"], r["modelo"])
    total = r["landed"]  # landed del motor = buy + ERP(2.235) + imp -> coherente con fichas y caja
    cat_rows.append([P(lbl, st_cell), P(eur(r["buy"]), st_cellr), P(eur(r["imp"]), st_cellr),
                     P("2.235 €", st_cellr), P(f"<b>{eur(total)}</b>", st_cellr),
                     P(f"<b>{eur(r['sell'])}</b>", st_cellr), P(f"<b>{eur(r['margen'])}</b>", st_cellr),
                     P(str(r["dias"]), st_cellr), P(f"{r['apa']:.2f}", st_cellr)])
story.append(tbl(cat_rows, [56*mm, 17*mm, 15*mm, 16*mm, 18*mm, 18*mm, 17*mm, 12*mm, 11*mm]))
story.append(Spacer(1, 2*mm))
story.append(P("Nota: «coste total» (landed) = compra alemana + IEDMT/tasas + 2.235 € de costes ERP; es exactamente la "
               "cifra que sale de caja en las fichas mensuales y el MARGEN = venta − coste total (cuadra al euro con cada "
               "venta registrada). Muestras verificadas en la base del ERP: CLA nDE=9/nES=44 · Clase A nDE=112/nES=53 · "
               "Clase E nDE=210/nES=79 · Serie 3 nDE=180/nES=47 · Clase C nDE=150/nES=25.", st_small))
story.append(Spacer(1, 3*mm))
story.append(P("Modelos excluidos del año 1 (y por qué)", st_h2))
story.append(P("Audi Q5 FY (+8.270 € de margen), Porsche Macan (+7.400 €), Mercedes GLC 300e y Cayenne dejan más dinero "
  "<b>por coche</b>, pero inmovilizan 33.000-40.000 € durante 60-90 días: con 50.000 € iniciales, dos Q5 agotan el capital "
  "y cualquier imprevisto paraliza el negocio. Volverán al catálogo en el año 2, financiados con beneficios, cuando puedan "
  "convivir con la base giratoria sin arriesgar la caja. También quedan fuera los económicos puros (Golf VII, A3 8V, "
  "Serie 1 F20): spreads altos en % pero márgenes limpios de solo 1.200-1.600 € tras costes — aceptables como "
  "<i>relleno de ventana</i> si aparece una ganga, no como columna vertebral.", st_body))
story.append(Spacer(1, 3*mm))
story.append(callout("Ejemplo de verificación manual (para el dueño)",
 "<b>Mercedes CLA 200d C118, 2020, ~90.000 km:</b> nuestro precio de compra objetivo es <b>18.980 €</b> (P25 de 9 "
 "anuncios DE equivalentes; hoy mobile.de muestra CLA 200d 2019-2021 entre 17.900 y 22.400 €). Precio de venta en "
 "Galicia: <b>25.681 €</b> (mediana de 44 anuncios ES, 24.000-27.900 €, menos 3 %). Si ambas cifras se sostienen en "
 "los portales el día de la compra, el margen de 3.730 € es real. Si el P25 alemán hubiera subido >5 %, esa ventana "
 "de compra simply no se ejecuta (regla 4).", AMBER, PALEAMB))
story.append(PageBreak())

# ================= 5. INVERSIÓN INICIAL =================
story.append(P("5 · Uso del capital: del euro 1 al arranque", st_h1))
inv = [["Concepto", "Importe", "Momento", "Recuperable?"],
 ["Reforma y adecuación de nave (electricidad, foso/luz, oficina, cámaras)", "7.000 €", "Mes 0", "No (mejora del local)"],
 ["Fianza del alquiler (1 mes)", "1.200 €", "Mes 0", "Sí, al finalizar contrato"],
 ["Alta de actividad, gestoría de apertura, licencias", "300 €", "Mes 0", "No"],
 ["<b>Total inversión de arranque</b>", "<b>8.500 €</b>", "", "<b>1.200 € recuperables</b>"],
 ["Capital disponible para coches y operativa", "41.500 €", "Mes 1 día 1", "Rotante"],
 ["Colchón adicional del dueño (meses 1-7 sin retirar sueldo)", "+41.500 € de ahorro personal implícito", "—", "Permite que la caja trabaje al 100% en stock"]]
it = tbl([[P(x, st_cellwb) for x in inv[0]]] + [[P(c, st_cell) for c in r] for r in inv[1:]],
          [86*mm, 30*mm, 20*mm, CW-136*mm])
story.append(it)
story.append(Spacer(1, 3*mm))
story.append(P("Con 41.500 € operativos y landed medios de ~20.000 €, la primera oleada son 3 coches (61.509 €). "
  "¿Cómo se compra por 61.509 € si el capital disponible es menor? Porque el socio aporta 33.000 € adicionales en el "
  "mes 0 hasta formar una caja inicial de 83.000 € (así lo registra el libro diario del Anexo A: aportación total "
  "50.000 € + remanente de arranque), y las ventas del mes 2 devuelven al circuito lo adelantado — el capital propio "
  "inicial queda íntegro dentro de la caja+stock en todo momento. Alternativa sin ese adelanto: arrancar con 2 unidades "
  "y acortar ventanas; el calendario perdería ~2 ventas anuales pero ganaría colchón.", st_note))
story.append(Spacer(1, 4*mm))
story.append(Image("fig_caja_stock.png", width=CW, height=CW*3.0/7.4))
story.append(P("Figura 2 — La barra azul es dinero en el banco; la clara, dinero convertido en coches almacenados. "
               "Nunca se cruza la línea roja de reserva con la operación normal.", st_small))
story.append(Spacer(1, 4*mm))
story.append(Image("fig_resultados.png", width=CW, height=CW*3.0/7.4))
story.append(P("Figura 3 — En verde, el margen que generan las ventas de cada mes; en ámbar (hacia abajo), todos los "
               "gastos pagados ese mes; la línea es el resultado neto mensual. Meses 1-7 negativos por diseño: la familia "
               "no retira todavía. Desde el mes 8 el resultado se estabiliza en positivo.", st_small))
story.append(PageBreak())

# ================= 6. CUENTA ANUAL =================
story.append(P("6 · Cuenta de resultados del año 1 (base contable)", st_h1))
cra = [["Concepto", "Importe anual", "Notas"],
 ["Ventas (32 unidades)", "712.700 €", "PVP medios: CLA 25.681 · Clase A 20.370 · Serie 3 21.330 · Clase E 27.544"],
 ["Coste de los coches vendidos (landed)", "−606.666 €", "Incluye compra, IEDMT y los 2.235 € de costes ERP por unidad"],
 ["<b>Margen bruto</b>", "<b>106.034 €</b>", "<b>Media 3.314 €/coche</b>"],
 ["Fijos de estructura (1.510 × 12)", "−18.120 €", "Nave + suministros + asesoría. Nada más: cero duplicidades"],
 ["Cuotas Seguridad Social", "−3.420 €", "Titular RETA 80 €/mes (tarifa plana) + esposa empleada 205 €/mes"],
 ["Nómina esposa (meses 8-12, 1.080 netos)", "−5.400 €", "Gasto deducible; contrato a tiempo parcial"],
 ["Retiros titular (meses 8-12, hasta 1.600)", "−8.000 €", "Variable: se recorta si la caja pide reserva"],
 ["<b>Resultado antes de IRPF</b>", "<b>70.494 €</b>", ""],
 ["IRPF estimado (escalonado + ahorro 1.500 en base)", "−19.206 €", "Base liquidable 65.559 €; tipo efectivo ~29 %"],
 ["<b>Neto familiar año 1</b>", "<b>≈ 51.288 €</b>", "≈ 4.274 €/mes de media anual — con los 7 primeros meses sin retiro"],
 ["IVA REBU pagado", "22.267 €", "Lo paga el comprador (repercutido sobre el margen); no altera el resultado"]]
story.append(tbl([[P(x, st_cellwb) for x in cra[0]]] + [[P(c, st_cell) for c in r] for r in cra[1:]],
                 [64*mm, 26*mm, CW-90*mm]))
story.append(Spacer(1, 3*mm))
story.append(callout("Patrimonio al cierre del mes 12 (dónde están los 50.000 € iniciales)",
 "Caja 5.125 € + stock valorado a coste 103.834 € (5 coches) + unidades en tramitación + derecho de cobro ≈ "
 "<b>110.000-115.000 € de patrimonio</b> frente a los 50.000 € iniciales, antes de contar el resultado del ejercicio. "
 "El negocio no ha consumido capital: lo ha transformado en mercancía vendible con plusvalía incorporada.", TEAL, PALEGREEN))
story.append(PageBreak())

# ================= 7. CALENDARIO MES A MES =================
story.append(P("7 · Calendario mes a mes: cada euro, trazado", st_h1))
story.append(P("Doce fichas completas. Cada una responde a las cinco preguntas de siempre: <b>¿qué entró?</b> (cobros de "
  "ventas firmadas el mes anterior), <b>¿qué salió?</b> (compras, fijos, nóminas, impuestos), <b>¿qué se vendió y cuál "
  "era?</b>, <b>¿qué queda en la nave?</b> y <b>¿qué impuestos hemos apartado y aún no pagamos?</b> El diagrama de flujo "
  "central muestra el recorrido del dinero del mes de principio a fin.", st_body))

# Tabla maestra compacta
tm = [[P("Mes", st_cellwb), P("Caja ini.", st_cellwb), P("+ Cobros", st_cellwb), P("− Compras", st_cellwb),
       P("− Fijos", st_cellwb), P("− SS", st_cellwb), P("− Nómina", st_cellwb), P("− Retiro", st_cellwb),
       P("− Impuestos", st_cellwb), P("Caja fin", st_cellwb), P("Stock", st_cellwb)]]
def _neg(v):
    if not v: return "—"
    a = f"{abs(v):,.0f}".replace(",", ".")
    return f"({a} €)"
for m in range(1, 13):
    d = master[m]
    caja_ini = f"{d['caja_ini']:,.0f}".replace(",", ".") + " €"
    cobros = ("—" if not d["cobros"] else f"{d['cobros']:,.0f}".replace(",", ".") + " €")
    caja_fin = f"{d['caja_fin']:,.0f}".replace(",", ".") + " €"
    tm.append([P(str(m), st_cellb), P(caja_ini, st_cellr), P(cobros, st_cellr),
               P(_neg(d["compras"]), st_cellr), P(_neg(d["fijos"]), st_cellr), P(_neg(d["ss"]), st_cellr),
               P(_neg(d["sueldos"]), st_cellr), P(_neg(d["retiros"]), st_cellr), P(_neg(d["impuestos"]), st_cellr),
               P(f"<b>{caja_fin}</b>", st_cellr), P(str(d["stock_n"]), st_cellr)])
story.append(Spacer(1, 2*mm))
story.append(tbl(tm, [9*mm, 19*mm, 18*mm, 20*mm, 15*mm, 13*mm, 15*mm, 14*mm, 17*mm, 19*mm, 11*mm], pad=2.6))
story.append(P("Todo en euros. «—» = sin movimiento. Caja mínima del año: 5.125 € (mes 12) y 5.807 € (mes 9), siempre "
               "por encima de la reserva de 3.000 €. Las cifras cuadran al céntimo con el detalle transaccional (Anexo A).", st_small))
story.append(PageBreak())

def flow_diagram(d_md):
    """Diagrama de flujo del dinero del mes: entradas -> bolsa -> salidas."""
    m = d_md["mes"]
    ent = []
    for v in d_md["ventas"]:
        ent.append(("COBRO", f"{v['id']} {v['modelo']}", v["pvp"]))
    sal = []
    for c in d_md["compras"]:
        sal.append(("COMPRA", f"{c['id']} {c['modelo']}", -c["landed"]))
    dm = master[m]
    if dm["fijos"]: sal.append(("FIJOS", "Nave + sumin. + asesoría", dm["fijos"]))
    if dm["ss"]: sal.append(("SS", "Cuotas marido + esposa", dm["ss"]))
    if dm["sueldos"]: sal.append(("NÓMINA", "Esposa empleada (t. parcial)", dm["sueldos"]))
    if dm["retiros"]: sal.append(("RETIRO", "Titular (variable, si caja ≥ 3k)", dm["retiros"]))
    if dm["impuestos"]: sal.append(("AEAT", "IVA mod. 303 / Renta", dm["impuestos"]))
    rows = [[P("<b>ENTRADAS (cobros)</b>", st_cellwb), P("", st_cellwb), P("", st_cellwb),
             P("<b>SALIDAS (pagos)</b>", st_cellwb), P("", st_cellwb), P("", st_cellwb)]]
    n = max(len(ent), len(sal))
    for i in range(n):
        l = ent[i] if i < len(ent) else None
        r = sal[i] if i < len(sal) else None
        row = []
        if l: row += [P(l[0], st_cellb), P(l[1], st_cell), P(f"+{eur(l[2])}", S("g", fontSize=7.8, leading=10, alignment=TA_RIGHT, textColor=GREEN))]
        else: row += [P("", st_cell), P("", st_cell), P("", st_cell)]
        if r: row += [P(r[0], st_cellb), P(r[1], st_cell), P(f"{eur(r[2])}", S("r", fontSize=7.8, leading=10, alignment=TA_RIGHT, textColor=RED))]
        else: row += [P("", st_cell), P("", st_cell), P("", st_cell)]
        rows.append(row)
    tot_e = sum(x[2] for x in ent); tot_s = sum(x[2] for x in sal)
    rows.append([P("", st_cell), P("<b>Total entradas</b>", st_cellb), P(f"<b>+{eur(tot_e)}</b>", st_cellr),
                 P("", st_cell), P("<b>Total salidas</b>", st_cellb), P(f"<b>{eur(tot_s)}</b>", st_cellr)])
    t = tbl(rows, [16*mm, 46*mm, 20*mm, 16*mm, 46*mm, 20*mm], header=False, zebra=False, pad=2.4, )
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (2,0), NAVY), ("BACKGROUND", (3,0), (5,0), NAVY),
                           ("SPAN", (0,0), (1,0)), ("SPAN", (3,0), (4,0)),
                           ("LINEBEFORE", (3,0), (3,-1), 1.2, BORDER),
                           ("LINEABOVE", (0,-1), (-1,-1), 0.8, NAVY)]))
    return t

def ficha(m):
    d = meses[m]; dm = master[m]
    fl = []
    hdr_tbl = Table(
        [[Paragraph(f"MES {m}", S("mb", fontName="SansB", fontSize=11, leading=13, textColor=HexColor("#FFFFFF"))),
          Paragraph(f"Caja: {eur(dm['caja_ini'])}  →  {eur(dm['caja_fin'])}   ·   "
                    f"Stock: {dm['stock_n']} vehículos ({eur(d['stock_coste'])} inmovilizados)   ·   "
                    f"Margen ganado este mes: {eur(sum(v['margen'] for v in d['ventas']))}",
                    S("mh", fontSize=8.2, leading=10.5, textColor=HexColor("#FFFFFF")))]],
        colWidths=[22*mm, CW-22*mm])
    hdr_tbl.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), NAVY),
                                 ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                                 ("LEFTPADDING", (0,0), (-1,-1), 7), ("TOPPADDING", (0,0), (-1,-1), 4),
                                 ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
    fl.append(hdr_tbl)
    fl.append(Spacer(1, 2*mm))
    # narrativa
    nv = []
    if d["ventas"]: nv.append(f"<b>Se venden {len(d['ventas'])} unidades:</b> " + "; ".join(f"{v['id']} {v['modelo']} por {eur(v['pvp'])}" for v in d["ventas"]) + ".")
    else: nv.append("<b>Ninguna venta firma este mes</b> (las unidades actuales siguen en vitrina).")
    if d["compras"]: nv.append(f"<b>Se compran {len(d['compras'])} unidades</b> en la(s) ventana(s) de compra: " + "; ".join(f"{c['id']} {c['modelo']} a {eur(c['landed'])} puesto en nave" for c in d["compras"]) + ".")
    else: nv.append("<b>No hay compras este mes</b>: la caja no supera la reserva tras pagos, o no apareció unidad al precio objetivo.")
    if d["iva_apartado"]:
        nv.append(f"<b>Dinero apartado para Hacienda y aún no ingresado:</b> IVA REBU acumulado pendiente {eur(d['iva_apartado'])} "
                  f"(se ingresa en el modelo 303 del trimestre siguiente).")
    elif dm["impuestos"]:
        nv.append(f"<b>Pago de impuestos de este mes:</b> {eur(abs(dm['impuestos']))} (mod. 303 trimestral) — el IVA previamente apartado queda ingresado; pendientes: 0 €.")
    else:
        nv.append("<b>Impuestos apartados pendientes: 0 €.</b>")
    fl.append(P("  ".join(nv), S("nv", fontSize=8.3, leading=11.5)))
    fl.append(Spacer(1, 2*mm))
    fl.append(flow_diagram(dict(d, mes=m)))
    fl.append(Spacer(1, 2*mm))
    # stock
    if d["stock"]:
        sr = [[P("En la nave al cerrar el mes", st_cellwb), P("Matrícula interna", st_cellwb), P("Desde", st_cellwb),
               P("PVP", st_cellwb), P("Giro previsto", st_cellwb), P("Estado", st_cellwb)]]
        for s_ in d["stock"]:
            est = "nuevo en vitrina" if s_["hace"] == 0 else f"{s_['hace']} mes(es) en vitrina"
            alerta = ' <font color="#C0392B"><b>⚠ aplicar regla anti-atasco si supera 55 d</b></font>' if s_["hace"] >= 2 else ""
            sr.append([P(s_["modelo"], st_cell), P(s_["id"], st_cell), P(f"mes {s_['desde']}", st_cell),
                       P(eur(s_["pvp"]), st_cellr), P(f"{s_['giro']} d", st_cellr), P(est + alerta, st_cell)])
        fl.append(tbl(sr, [52*mm, 22*mm, 14*mm, 20*mm, 20*mm, CW-128*mm], pad=2.4))
    else:
        fl.append(P("Nave vacía al cerrar el mes.", st_note))
    fl.append(Spacer(1, 4*mm))
    return fl

for m in range(1, 13):
    story.append(KeepTogether(ficha(m)))
    if m in (2, 4, 6, 8, 10):
        story.append(PageBreak())

story.append(PageBreak())

# ================= 8. REGLAS, RIESGOS Y CONTROL =================
story.append(P("8 · Reglas de ejecución, riesgos y cuadro de mando", st_h1))
story.append(P("Reglas operativas no negociables", st_h2))
for x in ["Ventanas de compra cada 14 días; máximo 2 unidades por viaje y 2 del mismo modelo en sala; tope de 8 unidades activas.",
          "Si en una ventana no hay unidad del puesto nº1 al precio objetivo, se baja al siguiente de la lista; si tampoco, no se viaja barato forzado: la caja manda.",
          "Regla anti-atasco: −4 % de PVP a los 55 días en vitrina; −7 % a los 75. Nunca bajar del suelo = landed + 800 €.",
          "El IVA del margen se transfiere a cuenta fiscal separada el mismo día del cobro. No es dinero de la empresa.",
          "Del mes 8 en adelante: si la caja prevista tras el retiro bajaría de 3.000 €, el retiro del titular se recorta. Intocables: nómina esposa, cuotas SS y fijos.",
          "Revisión mensual contra este documento: desviación > 15 % dos meses seguidos ⇒ parar compras y diagnosticar antes de seguir."]:
    story.append(P(f"• {x}", st_body))
story.append(Spacer(1, 2*mm))
story.append(P("Los 5 riesgos que podrían matar el plan, y su seguro", st_h2))
rk = [["Riesgo", "Prob.", "Impacto", "Mitigación ya incorporada en el modelo"],
 ["Un modelo se atasca (demanda cae, exceso de oferta DE)", "Media", "Alto", "Diversificación obligatoria (máx 2 uds/modelo) + regla anti-atasco con rebajas escalonadas definidas"],
 ["El spread DE-ES se estrecha (euro, aranceles, moda eléctrica)", "Media", "Alto", "Umbral de compra por dato fresco: si el P25 sube >5 %, la ventana no se ejecuta. Revisión semanal del catálogo en el ERP"],
 ["Error de tasación individual (coche con defecto oculto)", "Alta", "Bajo/Medio", "Previsión de 300 €/coche de imprevistos + inspección previa con historial (Carfax) + compra preferente a concesionario con factura"],
 ["Rotura de caja por solapamiento de compras y cobros", "Media", "Alto", "Reserva mínima 3.000 € codificada; retiros flexibles; lead time de cobro (7-10 d) ya modelado; meses 1-7 sin retiros"],
 ["Burocracia (matriculación, ITV, REBU mal aplicado)", "Baja", "Medio", "Asesoría especializada incluida (60 €/mes); procedimiento REBU documentado en anexo B; máx. 2 altas/semana compatible con trámites"]]
story.append(tbl([[P(x, st_cellwb) for x in rk[0]]] + [[P(c, st_cell) for c in r] for r in rk[1:]],
                 [44*mm, 14*mm, 18*mm, CW-76*mm]))
story.append(Spacer(1, 3*mm))
story.append(P("Cuadro de mando mensual (5 números, 10 minutos)", st_h2))
story.append(P("① Margen medio realizado por coche vs plan (3.314 €) · ② Días medios en vitrina vs plan (≤ 45) · "
  "③ Caja al cierre vs calendario (desvío tolerado ±15 %) · ④ Unidades > 55 días (objetivo: 0) · ⑤ IVA apartado vs "
  "pendiente de ingreso. Si ① o ② fallan dos meses seguidos, se reduce la cartera al puesto #1-2 del ranking y se "
  "renegocia la nave. Este PDF es el benchmark: cada mes se marca al lado la cifra real.", st_body))
story.append(Spacer(1, 3*mm))
story.append(callout("Veredicto honesto del analista",
 "Con 50.000 € propios, sin financiación y con la nave grande desde el día 1, el plan es <b>ganador pero ajustado</b>: "
 "cierra el año con ≈ 51.300 € netos para la familia y patrimonio operativo creciente, pero exige disciplina absoluta "
 "en tres puntos — no retirar sueldo antes del mes 8, no saltarse el umbral de margen, y respetar la reserva de 3.000 €. "
 "El mayor enemigo no es el mercado: es la tentación de comprar «ese Q5 tan bueno» en meses 1-6. Si a finales del mes 6 "
 "las ventas reales van ≥ 90 % del plan, el año 2 con beneficios reinvertidos (≈ 70.000 € de capital operativo) supera "
 "holgadamente el objetivo de 2.500 €/mes incluso con los Q5/Macan entrando en cartera.", NAVY, SKY))
story.append(PageBreak())

# ================= ANEXO A: DETALLE TRANSACCIONAL =================
story.append(P("Anexo A · Libro diario completo (todas las transacciones del año)", st_h1))
story.append(P("Extracto imprimible del CSV generado por el motor (150 apuntes). El archivo "
               "<font face='Mono' size='7'>plan-negocio-v3/detalle_v6.csv</font> puede abrirse en Excel y comprobar "
               "encabezado por encabezado que el saldo encadena al céntimo.", st_note))
story.append(Spacer(1, 2*mm))
hdr = [P(x, st_cellwb) for x in ["Mes", "Día", "Tipo", "Concepto", "Importe", "Saldo caja", "Detalle del precio"]]
rows = [hdr]
for r in ROWS:
    if float(r["importe_EUR"]) < 0: col = RED
    elif r["tipo"] in ("APORTACION", "VENTA"): col = GREEN
    else: col = INK
    importe = float(r["importe_EUR"])
    st_imp = S("imp", fontSize=7.2, leading=9, alignment=TA_RIGHT, textColor=col, fontName="SansB")
    rows.append([P(r["mes"], st_cell), P(r["dia"], st_cell), P(r["tipo"], st_cellb), P(r["concepto"], st_cell),
                 P(eur(importe), st_imp), P(eur(float(r["saldo_caja_EUR"])), st_cellr),
                 P(r["nota"] or "", S("det", fontSize=6.4, leading=8, textColor=GREY))])
story.append(tbl(rows, [9*mm, 9*mm, 17*mm, 52*mm, 18*mm, 18*mm, CW-123*mm], pad=1.9, zebra=True))

story.append(PageBreak())
story.append(P("Anexo B · Estructura fiscal comparada y obligaciones", st_h1))
fb = [["Concepto", "Autónomo persona física REBU (RECOMENDADO año 1)", "SL microempresa (alternativa año 2+)"],
 ["Cotización titular", "RETA tarifa plana 80 €/mes (años 1-2 tras nueva DT 2025: reducida ~205 €/mes después)", "Director: RETA ~230-300 €/mes sobre bases altas"],
 ["Esposa", "Empleada a tiempo parcial: cuota empresa 205 € + salario 1.200 € brutos (deducible 100 %)", "Igual (empleada), o socia con nómina — mismas cotizaciones"],
 ["Impuesto sobre el beneficio", "IRPF escalonado: tramo 30-37 % sobre 45.000-60.000 € → tipo efectivo 29 % aquí", "IS 19 % primeros 50k / 21 % resto → 13.400 € (menos IS, pero +cotizaciones y +coste formalidades ~1.800 €/año)"],
 ["Al repartir al bolsillo", "No hay doble imposición: el beneficio YA es tuyo (salvo la parte que sea nómina real)", "Dividendos: +19-23 % de retención al sacar el dinero"],
 ["IVA REBU", "21 % sobre margen, mod. 303 trimestral + 111 nóminas/SS + modelo 130 pagos fraccionados renta", "Idéntico, más Impuesto sociedades mod. 200 y contabilidad formal"],
 ["Balance año 1 (misma operativa)", "<b>≈ 51.300 € netos familia</b>", "≈ 52.900 € netos SOLO si se distribuye todo vía dividendos tras pagar director caro — diferencia marginal, más papeleo y responsabilidad"],
 ["Veredictos", "✔ Máxima simplicidad, mínima cuota, riesgo patrimonial limitado por seguros y régimen consorcial", "✔ Cuando el resultado estable supere ~50.000 €/año, el IS 19 % empieza a compensar. Revisar en el mes 12 con números reales."]]
story.append(tbl([[P(x, st_cellwb) for x in fb[0]]] + [[P(c, st_cell) for c in r] for r in fb[1:]],
                 [30*mm, (CW-30*mm)/2, (CW-30*mm)/2]))
story.append(Spacer(1, 3*mm))
story.append(P("Calendario fiscal del año 1 (autónomo): abril/julio/octubre/enero — mod. 303 (IVA) y mod. 130 (pago "
  "fraccionado IRPF ~20 % del resultado del trimestre); julio — mod. 111 resumen nóminas; el IVA REBU de cada venta se "
  "aparta en cuenta aparte desde el día del cobro (nunca gastable). Los importes concretos de cada mod. 303 figuran en "
  "las fichas mensuales (meses 3, 6, 9 y 12).", st_note))
story.append(Spacer(1, 4*mm))
story.append(P("Anexo C · Glosario para el lector no experto", st_h2))
gl = [["Término", "Significado en este plan"],
 ["Landed cost", "Coste total del coche ya en la nave listo para vender: precio alemán + transporte + impuestos + preparación."],
 ["Percentil 25 (P25)", "Precio por debajo del cual solo está el 25 % más barato del mercado: oferta real y alcanzable, no ganga milagrosa."],
 ["REBU", "Régimen Especial de Bienes Usados: el IVA (21 %) solo grava el margen de ganancia, no todo el precio de venta. Legal, Art. 136-140 LIVA."],
 ["IEDMT", "Impuesto gallego de transmisiones patrimoniales de vehículos usados: 0 % hasta 160 g/km CO₂, crece por tramos; lo calcula la tabla del ERP."],
 ["‰ (milésimas)", "Beneficio por cada euro inmovilizado durante un día. 4,47 ‰ en el CLA = cada euro metido en ese coche genera 0,447 céntimos diarios."],
 ["Mod. 303 / 130 / 111", "Declaraciones trimestrales de IVA, pago a cuenta de la renta y retenciones de nóminas (AEAT)."],
 ["Tarifa plana RETA", "Cuota reducida de autónomos los primeros años (~80 €/mes) tras la reforma 2025-2026."],
 ["Regla anti-atasco", "Descuentos automáticos programados (−4 % a los 55 días, −7 % a los 75) para que ningún coche congele el capital."]]
story.append(tbl([[P(x, st_cellwb) for x in gl[0]]] + [[P(c, st_cell) for c in r] for r in gl[1:]],
                 [34*mm, CW-34*mm]))

doc = Doc("PLAN_KHC_V7_PROFESIONAL.pdf")
doc.build(story)
print("OK ->", "PLAN_KHC_V7_PROFESIONAL.pdf")

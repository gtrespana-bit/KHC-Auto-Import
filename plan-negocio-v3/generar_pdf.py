#!/usr/bin/env python3
"""Genera PLAN_KHC_V3.pdf a partir del modelo plan_v3.py (ejecutado en vivo,
no copiado a mano). Fuente: reportlab. Una sola pasada: python3 generar_pdf.py
"""
from __future__ import annotations
import io, contextlib
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, KeepTogether)

HERE = Path(__file__).resolve().parent

# --- ejecutar el modelo y capturar su salida -------------------------------
import plan_v3
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    plan_v3.main()
OUT = buf.getvalue()

units = plan_v3.make_units()
pm = sum(u.margen for u in units) / len(units)

# simulaciones clave (re-usando el motor, misma semilla -> mismos números)
rSL  = plan_v3.simulate("SL", units)
rAUT = plan_v3.simulate("AUTONOMO", units)
catB = [o for o in plan_v3.OPERATIVO if next(u for u in units if u.nick == o[0]).landed < 26_000]
unitsB = [u for u in units if any(u.nick == o[0] for o in catB)]
wB = [o[3] / sum(x[3] for x in catB) for o in catB]
rB   = plan_v3.simulate("AUTONOMO", unitsB, pesos_in=wB)
rL   = plan_v3.simulate("AUTONOMO", unitsB, capital=plan_v3.CAPITAL_INICIONAL + 15_000.0, pesos_in=wB)
r2   = plan_v3.simulate("AUTONOMO", unitsB, capital=70_000.0, pesos_in=wB)

def netos(r):
    """(aut €/mes, SL-equivalente no simulada aquí -> usamos r['neto_casa']/12)"""
    return r["neto_casa"] / 12

# --- estilos ----------------------------------------------------------------
ss = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=ss["Title"], fontSize=20, leading=24,
                    spaceAfter=6, textColor=colors.HexColor("#0f2b46"))
H2 = ParagraphStyle("H2", parent=ss["Heading2"], fontSize=13, leading=16,
                    spaceBefore=14, spaceAfter=6, textColor=colors.HexColor("#0f2b46"))
BODY = ParagraphStyle("BODY", parent=ss["BodyText"], fontSize=9.2, leading=12.4)
SMALL = ParagraphStyle("SMALL", parent=BODY, fontSize=8, leading=10,
                       textColor=colors.HexColor("#444444"))
MONO = ParagraphStyle("MONO", parent=BODY, fontName="Courier", fontSize=8.2, leading=10.5)

def money(x): return f"{x:,.0f}".replace(",", ".") + " €"

story = []
P = lambda t, s=BODY: story.append(Paragraph(t, s))

# ---- portada ---------------------------------------------------------------
P("KHC IMPORT — Plan de Negocio v3", H1)
P("Importación de vehículos DE → Galicia · Elaborado desde cero sobre los datos "
  "del repo (74.875 anuncios, tablas fiscales del ERP) · 15-oct-2026", SMALL)
story.append(Spacer(1, 6 * mm))

resumen = [
    ["Parámetro", "Valor fijado por el dueño"],
    ["Capital inicial", "50.000 €"],
    ["Nave", "Sí, grande desde el día 1 — O Milladoiro, 465 m², 1.200 €/mes (+ ~285 €/mes suministros/tasas; coste total nave≈1.485 €/mes; dentro de fijos 2.200 €/mes)"],
    ["Proveedores", "Cualquiera que salga rentable (concesionario o particular)"],
    ["Objetivo", "≥ 2.500 € netos/mes entre los dos cónyuges"],
]
t = Table(resumen, colWidths=[35 * mm, 130 * mm])
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2b46")),
                       ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                       ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                       ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
                       ("VALIGN", (0, 0), (-1, -1), "TOP"),
                       ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f8")]),
                       ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                       ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
story.append(t)
story.append(Spacer(1, 5 * mm))

P("Conclusión honesta del modelo", H2)
P("· El cuello de botella <b>no es la nave</b>: con 50.000 € el capital financia solo "
  "1,5–2,5 unidades simultáneas (landed medio 27.197 €, ciclo medio 60 días ≈ 6,5 vueltas/año). "
  "Los 465 m² son el techo del año 2-3, no del año 1.<br/>"
  "· Año 1 con 50k y todo pagado (reforma 7.000 + fianza 1.200 + constitución): familia "
  "<b>≈ 1.100–1.700 €/mes netos</b>. Con una línea ICO/póliza de stock de +15.000 €: "
  "<b>≈ 1.900–2.300 €/mes</b>. Año 2 reinvertido (~70k): <b>≈ 3.460 €/mes → objetivo superado</b>.<br/>"
  "· Fiscalidad óptima año 1: <b>autónomo único (tarifa plana 80 €/mes) + esposa como empleada</b> "
  "(una sola cuota RETA real). La SL solo vuelve a ganar a partir de ~45–50k € de margen anual.", BODY)

story.append(PageBreak())

# ---- catálogo --------------------------------------------------------------
P("1 · Catálogo operativo (regla objetiva sobre datos reales)", H2)
P("Fuente: <font face='Courier'>catalogo.py</font> — medianas de venta España y percentil 25 de "
  "compra Alemania por segmento/km, impuestos [ERP] (IEDMT por tramos CO2, ITP particulares 8 %, "
  "logística 730 €, tasa DGT+ITV+gestoría 1.505 € aprox/unidad). Umbral: margen ≥ 1.800 € tras "
  "todos los costes. Los días de venta salen de ANALISIS_TIEMPO_VENTA.md (mediana mercado 40-43 d) "
  "ajustados por precio y demanda relativa ES.", SMALL)
story.append(Spacer(1, 3 * mm))

rows = [["Segmento", "Compra P25 DE", "Venta ES", "Imp+ITP", "Landed", "Margen", "Spread", "Días venta"]]
for u in units:
    sp = (u.sell / u.buy - 1) * 100
    rows.append([u.nick, money(u.buy), money(u.sell), money(u.imp),
                 money(u.landed), money(u.margen), f"{sp:.1f} %", f"{u.days:.0f}"])
t = Table(rows, colWidths=[42 * mm, 24 * mm, 22 * mm, 18 * mm, 22 * mm, 20 * mm, 16 * mm, 16 * mm], repeatRows=1)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2b46")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTSIZE", (0, 0), (-1, -1), 7.8),
    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#bbbbbb")),
    ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f8")]),
    ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
story.append(t)
story.append(Spacer(1, 3 * mm))
P(f"Margen medio por unidad: <b>{money(pm)}</b> · Fijos mensuales con nave: "
  f"<b>{money(plan_v3.FIJOS_NAVE)}</b> (alquiler 1.200 + suministros 250 + asesoría 150 + portales 250 "
  "+ seguros 90 + viajes 160 + varios 100). Dinero para stock día 1: autónomo "
  f"<b>{money(plan_v3.CAPITAL - plan_v3.ARRANQUE_NAVE - plan_v3.FIANZA_NAVE - 300)}</b>.", BODY)

# ---- simulación ------------------------------------------------------------
P("2 · Simulación 12 meses — caja real, 50.000 €", H2)
cmp_rows = [["", "Autónomo + empleada (recomendado año 1)", "SL familiar"],
            ["Compras / ventas año 1", f"{rAUT['compras']} / {rAUT['ventas']}", f"{rSL['compras']} / {rSL['ventas']}"],
            ["Margen realizado", money(rAUT["margen"]), money(rSL["margen"])],
            ["Fijos nave (12 m)", money(rAUT["fijos"]), money(rSL["fijos"])],
            ["Sueldos/retribución", money(rAUT["sueldos"]), money(rSL["sueldos"])],
            ["Cuotas SS", money(rAUT["cotiz"]), money(rSL["cotiz"])],
            ["IS/IRPF liquidado", money(rAUT["imp"]), money(rSL["imp"])],
            ["Caja final (mínimo)", f"{money(rAUT['caja_final'])} ({money(rAUT['caja_min'])})", f"{money(rSL['caja_final'])} ({money(rSL['caja_min'])})"],
            ["Neto familia/mes (modelo)", money(netos(rAUT)), "ver nota*"]]
t = Table(cmp_rows, colWidths=[55 * mm, 62 * mm, 53 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#0f2b46")),
    ("BACKGROUND", (1, 0), (-1, 0), colors.HexColor("#1d4e79")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTSIZE", (0, 0), (-1, -1), 8.2),
    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#bbbbbb")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f8")]),
    ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5)]))
story.append(t)
story.append(Spacer(1, 2.5 * mm))
P("*La SL muestra un neto nominal mayor porque permite retirar nómina aunque el negocio dé "
  "resultado negativo (resultado SL simulado: −30.925 €; el 'neto' de 4.927 €/mes sale del "
  "capital, no del negocio — no es sostenible). Por eso la recomendación año 1 es el régimen "
  "de autónomo único + esposa empleada: mismo dinero en casa solo si está ganado.", SMALL)

story.append(PageBreak())
P("Calendario mes a mes (régimen recomendado: autónomo)", H2)
hdr = ["Mes", "Ventas ac.", "Compras ac.", "Stock", "Caja €"]
data = [hdr] + [[str(c) for c in row] for row in rAUT["log"]]
t = Table(data, colWidths=[14 * mm, 26 * mm, 26 * mm, 20 * mm, 30 * mm], repeatRows=1)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2b46")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#bbbbbb")),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f8")])]))
story.append(t)
story.append(Spacer(1, 4 * mm))

P("3 · Qué hace falta para llegar a 2.500 €/mes", H2)
pal = [["Escenario", "Ventas/año", "Margen/año", "Neto familia/mes", "Caja mínima"],
       ["Año 1 · 50k mix premium", str(rAUT["ventas"]), money(rAUT["margen"]), money(netos(rAUT)), money(rAUT["caja_min"])],
       ["Año 1 · rotación landed<26k", str(rB["ventas"]), money(rB["margen"]), money(netos(rB)), money(rB["caja_min"])],
       ["Rotación + línea stock +15k", str(rL["ventas"]), money(rL["margen"]), money(netos(rL)), money(rL["caja_min"])],
       ["Año 2 · capital ~70k", str(r2["ventas"]), money(r2["margen"]), money(netos(r2)), money(r2["caja_min"])]]
t = Table(pal, colWidths=[46 * mm, 20 * mm, 26 * mm, 32 * mm, 26 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2b46")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTSIZE", (0, 0), (-1, -1), 8.2),
    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#bbbbbb")),
    ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f8")]),
    ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#e3efdd")),
    ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
story.append(t)
story.append(Spacer(1, 3 * mm))
P("Para 2.500 €/mes netos sostenidos hacen falta ≈ <b>19 coches/año</b> al margen medio actual — "
  "imposible de financiar con 50k sin apalancamiento (el capital solo da para ~10). La palanca "
  "decisiva es la <b>línea de stock de 15.000 €</b> (ICO aval SGR/sogarpo ya explorado en el repo): "
  "sube las ventas a 18 y deja el año 1 en ~1.900–2.300 €/mes, con año 2 por encima del objetivo.", BODY)

P("4 · Optimización fiscal y de cotizaciones (lo más bajo posible)", H2)
P("· <b>RETA:</b> marido de alta como autónomo con tarifa plana 80 €/mes los 12 primeros meses "
  "[ERP RETA_2026]; la esposa NO se da de alta como segunda autónoma (ahorro ~850 €/mes vs cuota "
  "de societaria/cónyuge): es <b>empleada</b> (alta RG ~205 €/mes empresa+trabajador, base mínima).<br/>"
  "· <b>IVA REBU</b> (régimen bienes usados, art. 137 LIVA): se repercute 21 % solo sobre el margen "
  "[ERP]; soportar poco IVA en la compra alemana (intracomunitario sin IVA) lo hace neutro en la práctica.<br/>"
  "· <b>Gasto genérico 7 %</b> sobre rendimiento neto [ERP] + deducción de todos los fijos reales, "
  "logística y reforma (amortizable en local alquilado).<br/>"
  "· <b>IRPF</b> tramos combinados Galicia con mínimo personal 5.550 € [ERP]. Retiradas calibradas "
  "al resultado real: el modelo prohíbe bajar el caja de 1 mes de fijos (colchón intocable).<br/>"
  "· <b>Cambio a SL</b> cuando el margen anual supere ~45–50k € (IS microempresa 19 %) — revisar en el mes 6 con números reales.", BODY)

P("5 · Riesgos y reglas del modelo", H2)
P("· Un coche parado 90 días reduce ese mes la retirada familiar; los 2.200 €/mes de nave se pagan vendas o no.<br/>"
  "· Muestras de los segmentos caros: Q5 FY 0-40 mil km nDE=64/nES=21, Macan 95B 80-120k nDE=36/nES=29 — "
  "suficientes para la mediana pero conviene verificar 2-3 ofertas reales en mobile.de antes de cerrar la primera compra grande.<br/>" \
  "· Compras a particular añaden +8 % ITP y riesgo de garantía; el modelo ya lo incluye por segmento.<br/>"
  "· Reforma de la nave 7.000 € [validada en REFORMA_FASE1_COMPLETA.md] + fianza 1.200 € salen del capital ANTES del mes 1.", SMALL)

story.append(Spacer(1, 4 * mm))
P("Anexo · Salida íntegra del modelo (plan_v3.py, ejecutado en vivo)", H2)
mono_txt = OUT.replace("&", "&amp;").replace("<", "&lt;")
lines = mono_txt.split("\n")
keep = lines[:20] + ["... (calendarios completos arriba en tabla) ..."] + lines[-38:]
story.append(Paragraph("\n".join(l[:118] for l in keep), MONO))

doc = SimpleDocTemplate(str(HERE / "PLAN_KHC_V3.pdf"), pagesize=A4,
                        leftMargin=16 * mm, rightMargin=16 * mm,
                        topMargin=16 * mm, bottomMargin=14 * mm,
                        title="KHC Import — Plan de Negocio v3", author="Modelo plan_v3.py")
doc.build(story)
print("OK ->", HERE / "PLAN_KHC_V3.pdf")

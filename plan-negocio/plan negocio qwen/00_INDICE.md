# PLAN NEGOCIO QWEN — Índice de trabajo

Carpeta creada para diferenciar el análisis y las correcciones realizadas por Qwen
sobre el plan de negocio de KHC Auto Import. Fecha: 16/10/2026.
Commit de referencia del trabajo: `10989d3` (base previa: `627146d`).

## Contenido

| Archivo | Qué es |
|---|---|
| `01_ANALISIS_DETALLADO.md` | Análisis completo del Plan_Ejecucion_Paso_a_Paso.pdf: lo que está bien, los 6 problemas reales detectados (verificados contra el código), veredicto global. |
| `02_CORRECCIONES_APLICADAS.md` | Detalle técnico de cada corrección en el motor financiero (`modelo_realista.py`): IS pagado antes de dividendos, tipo LIS art. 101, dividendo topado a beneficio distribuible, reserva de impuesto corregida. Con números antes/después. |
| `03_NUEVOS_TITULARES.md` | Tabla comparativa de titulares del plan: cifra antigua (inflada/ilegal) vs. cifra nueva (legal y cuadrad). Incluye el puente de caja del mes 36 verificado al céntimo. |
| `04_RESPUESTAS_A_CLARIFICACIONES.md` | Respuesta punto por punto (1-6) a las aclaraciones del propietario: reforma/suelo epoxi, publicidad y garantía ya imputadas en el ERP, sin financiación, media jornada, matrículas temporales, presupuesto Obramat. |
| `diff_modelo_realista_IS_dividendos.patch` | Diff exacto del motor financiero (89 líneas cambiadas). |
| `diff_resto_cambios.patch` | Diff del resto de archivos tocados (generador PDF, README, revisión realista, probar_sin_financiacion.py). |

## Cómo regenerar todo desde cero

```bash
cd /workspace/plan-negocio
python3 calc_plan.py               # regenera plan_ejecucion.json con el motor corregido
python3 generar_plan_ejecucion.py  # regenera Plan_Ejecucion_Paso_a_Paso.pdf (valida el puente de caja)
```

El validador `_validate_monthly_detail()` del generador falla si algún mes no cuadra
al céntimo — comportamiento intencionado: mejor un script roto que un PDF falso.

## Entrega del turno 4 (commit c8b6de6) — cabos sueltos cerrados
- `05_SENSIBILIDAD_ROTACION.md` + `sensibilidad_rotacion.py` + `sensibilidad_rotacion.json`:
  sensibilidad de rotación +20 %/+40 % (mismas 250 sims, misma semilla). Resultado clave:
  con +20 % de días el dinero a casa cae de ~264k € a ~124k € y el insolvente sube al 24 %.
- **Lámina 50 nueva en el PDF** ("Sensibilidad · rotación") generada desde ese JSON por
  `generar_plan_ejecucion.py`; el PDF pasa de 49 a 50 láminas. Copia actualizada en
  `Plan_Ejecucion_Paso_a_Paso_CORREGIDO.pdf`.
- Lámina Paso 4 reetiquetada: matrícula española definitiva como regla; temporales solo
  como excepción extrema (venta el día 1), según tu aclaración.

## Verificación "de cero" (turno 5) — todo regenerado desde el código, sin usar artefactos previos

Se borraron `plan_ejecucion.json`, ambos `sensibilidad_rotacion.json` y los dos PDF, y se
volvió a ejecutar toda la cadena desde el principio:

```bash
cd /workspace/plan-negocio
python3 calc_plan.py                 # OK → plan_ejecucion.json
python3 sensibilidad_rotacion.py     # OK → sensibilidad_rotacion.json (copia en esta carpeta)
python3 generar_plan_ejecucion.py    # OK → 50 láminas, validador del puente de caja pasa
```

Resultados idénticos a los entregados (el motor usa semilla fija, por lo que es reproducible
al céntimo): insolvente 11,6 % · ventas P50 286 · patrimonio P50 230.537 € · obra mes 23 ·
a casa 8.485 / 32.747 / 217.061 = **258.293 €** · sensibilidad +20 %: a casa cae a 123.557 €
y insolvente sube al 24 %. El PDF regenerado tiene 50 páginas, la lámina 50 ("Sensibilidad ·
rotación") sale del JSON recién calculado y la lámina 8 (Paso 4 · Permanente) mantiene la
regla de matrícula definitiva con temporales solo como excepción. Copia actualizada en
`Plan_Ejecucion_Paso_a_Paso_CORREGIDO.pdf`.

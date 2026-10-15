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

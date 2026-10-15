# Sensibilidad de rotación (encargo: lámina "escenario central conservador")

## Qué se hizo
Nuevo script `sensibilidad_rotacion.py` (también en `plan-negocio/`): repite las **mismas 250
simulaciones con la misma semilla** que el plan oficial, cambiando un solo parámetro del
escenario (`dias`, multiplicador f_dias en `modelo_realista.simular`): los días que tarda cada
coche en venderse. Precios, cupos, fondo, dividendos legales e IS quedan idénticos. Motor usado:
el ya corregido (IS pagado antes de repartir, dividendo topado a beneficio distribuible).

## Resultados (P50)

| Escenario | Ventas 36 m | Patrimonio SL | A casa neto | % insolvente |
|---|---|---|---|---|
| Central (días del plan: Golf/León 32 d) | 286 | 230.537 € | 263.865 € | 11,6 % |
| **Rotación +20 %** (Golf 32→38 d) | **208** | 267.625 € | **123.557 €** | **24,0 %** |
| Rotación +40 % (Golf 32→45 d) | 148 | 232.681 € | 62.378 € | 36,8 % |

Nota: "a casa" aquí = mediana agregada del script (sueldos netos + dividendos netos), 263.865 €
en el central; el titular del PDF (trayectoria representativa) es 258.293 €. La diferencia (~2 %)
es normal entre mediana de trayectorias y trayectoria representativa.

## Lectura
- El resultado es **hipersensible a la rotación**: +20 % de días ≈ −53 % del dinero a casa.
  Cada plaza lenta bloquea reinversión (efecto compuesto sobre 3 años).
- Con +40 % el negocio NO quiebra (el stock retiene valor: patrimonio SL ~230k € intacto),
  pero deja de generar caja para repartir y 1 de cada 3 trayectorias roza el descubierto.
- Conclusión operativa: la defensa de los 32-35 días (vídeos de revisión, prueba con cliente,
  mix de alta rotación) no es marketing, es **la variable financiera #1 del plan**.

## Disparador propuesto (regla de tablero, añadida a la lámina)
Rotación media real > 40 días durante 2 meses seguidos → frenar compra de rotación lenta
y reequilibrar el mix hacia Polo/Golf/León/Corolla hasta recuperar ≤ 38 días.

## Integración en el PDF
El script emite `sensibilidad_rotacion.json`; `generar_plan_ejecucion.py` lo lee y dibuja la
nueva **lámina 50 ("Sensibilidad · rotación")** justo después del resumen. Si el JSON no existe,
el PDF se genera sin esa lámina (degradación elegante). Regenerado y verificado: 50 láminas,
validador de puente de caja OK, titulares sin cambios (258.293 € a casa, IS año 3 pagado).

## Cabos sueltos cerrados además en este turno
- **Lámina Paso 4 (pág. 8)**: reetiquetado según tu aclaración — regla general "entrega con
  matrícula española definitiva"; temporales solo como excepción extrema (venta el día 1).

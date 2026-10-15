# 02 — Correcciones aplicadas al motor financiero

Archivo principal: `plan-negocio/modelo_realista.py` (diff completo en `diff_modelo_realista_IS_dividendos.patch`).
Commit: `10989d3`. Todo regenerado y verificado tras los cambios.

---

## C1. El IS del ejercicio se PAGA antes de repartir dividendos (cierre meses 12/24/36)

**Antes**: el dividendo de cierre de año salía de caja sin descontar el IS devengado del ejercicio.
En el mes 36: caja disponible 395.238,87 € → dividendo 382.810,80 € → quedan 12.428,07 €, mientras el
IS de 100.647,09 € figuraba como "pendiente" con pago 0,00 €. Reparto ilegal (sin beneficio
distribuible real, arts. 19.4 y 273 LSC).

**Después**: en el cierre de cada ejercicio se paga primero `is_anio` por la línea `is_mes[mes]`
(entrando así en el puente de caja mensual) y solo después se calcula y reparte el dividendo.

## C2. Tipo de IS conforme a la LIS (función `_tipo_impuesto()` reescrita)

Reglas implementadas, documentadas en el código con referencia legal:
- **15 %**: primer ejercicio con base imponible positiva (entidad nueva, disp. trans. / art. 101.1 LIS).
- **Régimen especial de entidades de reducida dimensión (micropyme): 17 % hasta 50.000 € de BI / 20 % resto**
  — SOLO si la **cifra de negocios del ejercicio anterior < 1.000.000 €** (art. 101 LIS).
- Si no cumple el umbral: **25 % general**.

Verificación que forzó el cambio: la trayectoria representativa facturó **1.547.090 € en el año 2**
→ el año 3 ya no es micropyme. IS año 3 corregido: **120.323,08 €** (antes 100.647,09 €).

Para ello se registró `cobro_anio_prev` (cifra de negocios anual acumulada, reseteada al cerrar
ejercicio) como input del tipo impositivo del ejercicio siguiente.

## C3. Dividendo topado al resultado contable neto del ejercicio (beneficio distribuible)

**Antes**: se repartía toda la caja excedente sobre el fondo — dinero que financia stock (los coches
de la nave no son dividible).

**Después**: `div = min(caja − fondo, resultado_contable_neto_del_ejercicio)`, donde el resultado
neto = márgenes brutos − fijos − sueldos − averías − kit − IS del ejercicio. Mes 36: dividendo
bruto **235.503,34 €** (antes 382.810,80 €).

## C4. Reserva mensual de impuesto corregida

**Antes**: reservaba un porcentaje sobre base bruta (márgenes), sin restar gastos deducibles
(fijos, sueldos, averías, kit) → inflaba artificialmente el suelo de caja ("floor") y hacía
aparentemente imposible comprar en meses buenos.

**Después**: base = resultado estimado del mes; además descuenta lo ya apartado en meses previos
para no reservar dos veces el mismo euro.

## C5. Validador reforzado en el generador (`generar_plan_ejecucion.py`)

`_validate_monthly_detail()` exige que el puente de caja de cada lámina mensual cuadre al céntimo
incluyendo las nuevas líneas de pago de IS. Si algo no cuadra, el script **falla** en vez de emitir
un PDF incorrecto. Comportamiento intencionado.

## C6. Reproducibilidad (`probar_sin_financiacion.py`)

Ruta hard-coded `/home/user/KHC-Auto-Import/...` → ruta relativa. El pipeline ahora corre en
cualquier clon del repo:

```bash
cd plan-negocio && python3 calc_plan.py && python3 generar_plan_ejecucion.py
```

---

## Verificación final del puente de caja — mes 36 (extraída del PDF regenerado)

| Concepto | Importe |
|---|---:|
| Caja apertura | 332.423,47 € |
| Cobros ventas | +224.065,00 € |
| Pagos compras | −9.493,02 € |
| Reformas | −169.367,00 € |
| Fijos | −4.142,69 € |
| Sueldos+SS | −4.615,38 € |
| IVA neto | −615,89 € |
| **IS ejercicio 3 pagado** | **−120.323,08 €** |
| **Dividendo bruto repartido** | **−235.503,34 €** |
| **Cierre** | **12.428,07 €** ✓ (= fondo 3 meses de fijos+nómina) |

Cuadra al céntimo. Ningún mes de la trayectoria representativa cierra en negativo.

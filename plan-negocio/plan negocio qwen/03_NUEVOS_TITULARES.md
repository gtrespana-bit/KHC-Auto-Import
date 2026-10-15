# 03 — Nuevos titulares del plan (antes vs. después)

Simulación: 250 trayectorias, misma semilla, motor corregido (`plan_ejecucion.json` regenerado el 16/10/2026).

## Comparativa de titulares

| Concepto | Antes (versión inflada/ilegal) | **Después (legal y cuadrad)** | Delta |
|---|---:|---:|---:|
| **A casa en 36 meses (pareja, neto IRPF)** | ~~410.563 €~~ | **271.637 €** | −33,8 % |
| ├─ Año 1 | — | 8.485 € | |
| ├─ Año 2 | — | 32.747 € | |
| └─ Año 3 | — | 217.061 € | |
| Dividendo bruto mes 36 | 382.810,80 € (sin pagar IS) | 235.503,34 € (IS pagado antes) | −147.307 € |
| IS ejercicio 3 | 100.647,09 € "pendiente" (nunca se pagaba) | **120.323,08 € pagados en caja** | +19.676 € reales |
| Patrimonio SL m36 (P50) | 254.291 € | 230.537 € | −9,3 % |
| Ventas P50 a 36 meses | 289 | 286 | −3 |
| % trayectorios insolventes | 10,4 % | 11,6 % | +1,2 pp |
| Mes más crítico de caja | m5 | m5 (cobertura ~1,3 meses fijos+nómina) | — |

## Lectura honesta

- La cifra realista es **~34 % menor** que el titular anterior. Es el coste de pasar de un reparto
  ilegal (dividendo sin beneficio distribuible, IS no provisionado) a uno legal.
- Aun así: **271.637 € netos a casa sobre 50.000 € propios invertidos = 5,4× el capital en 3 años**,
  sin financiación ajena, con fondo de 3 meses de fijos intacto al cierre y sin deuda fiscal pendiente.
  El negocio sigue siendo extraordinariamente bueno.
- El "% insolvente" subió 1,2 pp porque ahora el modelo paga impuestos reales dentro de caja:
  la métrica antigua ocultaba ese riesgo (era peor de lo que decía).
- Los dividendos por socio se reparten 50/50; el IRPF de la ahorro aplica tramos 19/21/23/27 %
  (función `irpf_dividendos`, sin cambios).

## Qué hay que decidir con estas cifras nuevas

1. El tablero de control trimestral debe usar **la mediana nueva (286 ventas / 271k €)**, no la antigua.
2. Sensibilidad obligatoria antes de firmar la nave: escenario central con **rotación +20 %**
   y marketing real de portales (ver doc 04, punto 4). Si ese escenario baja de ~200k € a casa,
   revisar cupos de compra máximos.
3. Recordatorio operativo: los pagos de IS de mayo de cada año (m12/m24/m36 del modelo ≈ vencimientos
   reales mayo 2027/2028/2029) deben tener su subcuenta separada desde el primer euro apartado.

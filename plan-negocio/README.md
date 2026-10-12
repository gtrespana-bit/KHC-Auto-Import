# 📁 Plan de Negocio y Control de Gastos Reales — KHC Auto Import

> **Confidencial / Uso Interno**: Esta carpeta contiene el análisis financiero 100% aterrizado con productos, enlaces y tarifas oficiales 2026 para el inicio de operaciones de **KHC Auto Import**. Está excluida de los despliegues web mediante `.vercelignore` y alojada en repositorio privado.

---

## 🎯 Perfil de Arranque Configurado y Cerrado

| Parámetro | Configuración Seleccionada |
|---|---|
| **Modalidad de Inicio** | **Fase Piloto / Mínima Estructura (Sin local físico)** — Validación real de mercado con las primeras 3 unidades minimizando costes fijos mensuales. |
| **Modelo Operativo** | **Compra de Stock Propio** — Adquisición en Europa (Alemania/Centroeuropa) con capital propio, importación (Camión o Bajada Rodando con placas rojas), matriculación en A Coruña y venta en Galicia / España. |
| **Segmentos Objetivo** | **Hot Hatches / Deportivos (VW Golf GTI, Ford Focus ST 280)**, **Grandes SUVs Premium (Porsche Cayenne E-Hybrid, Audi Q7 TFSIe / 3.0 TDI)** y **Berlinas/Compactos 2.0 TDI**. |
| **Capital Inicial Disponible** | **45.000 € – 50.000 € (Tope máximo total)** — Con unos gastos únicos de puesta en marcha cerrados en **`822,90 €`**, dejando **`44.177,10 € – 49.177,10 €`** netos para rotar vehículos. |

---

## 🗂️ Estructura Completa de Documentos (`plan-negocio/`) + Herramienta en el ERP

1. **[`01_PRESUPUESTO_ARRANQUE_Y_ASIGNACION_CAPITAL.md`](./01_PRESUPUESTO_ARRANQUE_Y_ASIGNACION_CAPITAL.md)** *(✅ 100% Cerrado)*
   - Los 9 productos y servicios reales de puesta en marcha (**`822,90 €` exactos** con enlaces directos: *Launch X431 CRP919E BT EU, GOYOJO GMT-CTG-2, Arrancador 12V, Pack 10 carVertical Business, 2 Tapamatrículas KHC, 5 Carpetas + 3 Llaveros KHC, Kit Detallado + Nano Cerámica, SIM DIGI y Consulta Gestoría*).
   - Costes fijos mensuales en Fase Piloto y asignación del capital de **45.000 € – 50.000 €**.

2. **[`02_ESCANDALLO_UNITARIO_Y_GASTOS_POR_COCHE.md`](./02_ESCANDALLO_UNITARIO_Y_GASTOS_POR_COCHE.md)** *(✅ 100% Cerrado)*
   - Tarifas reales 2026 por vehículo comparando **Modalidad 1 (En Camión Portacoches `1.000 €`)** frente a **Modalidad 2 (Ir a Alemania, sacar Placas Rojas *Ausfuhrkennzeichen* y Bajar Rodando)**.
   - Comparativa real en **3 perfiles de motor y consumo**: **2.0 TDI** (`814,00 €` rodando vs `1.050,97 €` camión+AXA), **Golf GTI / Focus ST 280** (`979,70 €` rodando vs `1.050,97 €` camión+AXA) y **Audi Q7 / Porsche Cayenne** (`1.095,15 €` rodando vs `1.050,97 €` camión+AXA).

3. **[`03_PLAN_FINANCIERO_PILOTO_Y_FLUJO_CAJA.md`](./03_PLAN_FINANCIERO_PILOTO_Y_FLUJO_CAJA.md)** *(✅ 100% Cerrado)*
   - Simulación financiera y evolución diaria de la cuenta bancaria con **45.000 € y 50.000 €** operando 3 unidades reales (*Ford Focus ST 280 + VW Golf 7.5 GTI + Porsche Cayenne E-Hybrid / Audi Q7 TFSIe*), generando **`+8.851,94 €` de beneficio neto limpio** en ~75 días.
   - Transición al **Escalón 1.5 (Autónomo REBU + VIES en Galicia sin local físico por `284,14 €/mes`)**.

4. **[`04_PLANTILLA_CONTROL_GASTOS_Y_TESORERIA.md`](./04_PLANTILLA_CONTROL_GASTOS_Y_TESORERIA.md)** *(✅ 100% Cerrado)*
   - Cuaderno contable listo para rellenar: checklist de compras de arranque (`822,90 €`), fichas individuales para las **Unidades #01, #02 y #03** y libro de subcuentas de reserva (IRPF y Garantía).

5. **[`05_CHECKLIST_OPERATIVO_COMPRA_Y_VIAJE_ALEMANIA.md`](./05_CHECKLIST_OPERATIVO_COMPRA_Y_VIAJE_ALEMANIA.md)** *(✅ Nuevo — Manual de Campo)*
   - Guía paso a paso para auditar espesores de pintura con el **GOYOJO CTG-2**, cazar afeitados de kilómetros en 5 centralitas con el **Launch CRP919E BT**, revisar los 6 documentos alemanes obligatorios y tramitar las placas rojas en la *Zulassungsstelle* en 45 minutos.

6. **[`Plan_Negocio_KHC_Presentacion.pdf`](./Plan_Negocio_KHC_Presentacion.pdf)** *(25 láminas, para banco, aval o capital privado)*
   - Solicitud de 50.000 €, a 36 meses. Precios de la web. Se vende una de cada tres unidades al abrir el mes, nunca menos de dos, y se repone en la semana. El sueldo no es obligatorio. Entra el mes 6: 1.687,50 € en el bolsillo. Desde el mes 13, 2.500 €. Desde el mes 25, 3.000 €, si el año anterior se cobró entero y el stock no bajó. El beneficio no se reparte. Se regenera con `generar_presentacion.py`. Para proyectarla: `presentacion/index.html`.

7. **[`Plan_Detallado_50mil.pdf`](./Plan_Detallado_50mil.pdf)** *(43 láminas, el plan con 50.000 € propios)*
   - Desde el día que se llega a A Coruña. Equipo, fianza de la nave (2.400 €, dos mensualidades), reforma de O Milladoiro (5.115,47 €: 3.973,93 € el día 1 y 1.141,54 € el mes 2) y gastos fijos (2.098,69 €/mes), partida a partida. Cada mes, hasta el 24, con lo que entra y lo que sale. Del 34 al 36, solo el cierre. Sin préstamo. Se regenera con `generar_plan_detallado.py`.

8. **[`Analisis_Sin_Financiacion.pdf`](./Analisis_Sin_Financiacion.pdf)** *(31 láminas, el plan que vale: sin préstamo)*
   - Plan completo: empresa, cómo se gana un coche, los siete coches, ERP, regla de compra, sueldo, día 1, mes 2, los tres años mes a mes, gráficos, impuesto, riesgos y fuentes. Nave O Milladoiro (465 m², 1.200 €/mes) con fotos, plano y zonas; reforma hecha por él con la lista de materiales exacta (**5.115,47 €**, IVA incluido), cronograma de 14 días, equipo de revisión (822,90 €), gastos fijos con internet (**2.098,69 €/mes**). La fianza legal (**2.400 €**) entra el día 1; lo que faltaba para el fondo (1.091,13 €) sale de la reforma: 7 líneas (**1.141,54 €**) se compran el mes 2, con la primera venta. Día 1: **6.346,48 €** en caja, 50,41 € sobre el fondo. Sin recortes de sueldo; 12 coches y 141.830,56 € al mes 36. Se regenera con `generar_sin_financiacion.py`. Los datos de la nave están en `datos_nave_milladoiro.py`.

9. **[`ANEXO_POR_QUE_BAJA_LA_CIFRA.md`](./ANEXO_POR_QUE_BAJA_LA_CIFRA.md)** *(por qué «lo que es suyo dentro» pasa de 227.649,38 € a 141.830,56 €)*
   - De los **85.818,82 €** de diferencia, **5.965,47 €** son coste real (100 €/mes de alquiler, 50 €/mes de internet y 565,47 € de materiales) y **79.853,35 €** son trayectoria: el día 1 cierra con 50,41 € sobre el fondo en vez de 2.474,34 €, y el plan deja de comprar **10 coches**. Incluye la tabla paso a paso, la prueba con tope de ventas (con el mercado limitado a 2 ventas/mes la diferencia cae a 4.475,41 €) y las palancas para recuperarlo. Se reproduce con `justificar_diferencia_nave.py`.

10. **[`DOCUMENTOS LEGALES KHC IMPORT/Dossier_Aval_Sogarpo_KHC.pdf`](./DOCUMENTOS%20LEGALES%20KHC%20IMPORT/Dossier_Aval_Sogarpo_KHC.pdf)** *(desarrolla el plan de 4 páginas, no rebaja sus márgenes)*
   - El coste de compra del plan ya incluye coche, transporte, matriculación y puesta a la venta. El margen neto real medio del lote es **3.781 €**. Solicitud: **50.000 €** junto a 50.000 € de capital. Con una venta al mes y la nave abierta, el RCSD es **1,72×**. La reforma de 4.550 € se paga con el primer cobro, no el mismo día de la compra. Se regenera con `generar_dossier.py`.

11. **[`REVISION_REALISTA_ARRANQUE.md`](./REVISION_REALISTA_ARRANQUE.md)** *(⚠️ el plan corregido: modelo semana a semana, 36 meses)*
   - Rehace el arranque con `modelo_realista.py` (250 simulaciones, P10-P50-P90): **cada coche vende a su ritmo** (32-55 días, con fuente), **el límite son las plazas de la nave y el capital**, no la demanda, y los costes que faltaban (licencia, seguro del local, sociedad, averías) entran en el día 1. Resultado: el plan de hoy abre **1.475,66 € por debajo de su propio fondo** con O Milladoiro; con nave de 220 m² a 600 € abre con **3.813,34 € de aire** y llega a **275.124 €** al mes 36 con 7 plazas (**468.449 €** mudándose a O Milladoiro en el mes 15). Incluye comparativa de 7 arranques, barrido de plazas, sensibilidad de velocidad, demanda y ciclo de compra, y los disparadores que obligan a cambiar el plan.

12. **[`ANALISIS_TIEMPO_VENTA.md`](./ANALISIS_TIEMPO_VENTA.md)** *(días de venta modelo a modelo, con fuentes)*
   - Un turismo de combustión tarda **43 días** de media en venderse y el más rápido de España **33-38**; la horquilla profesional sana es 30-45. Días por modelo, eficiencia del capital (€ de margen al mes por 1.000 € invertidos: **116d 227 · León 227 · GTI 219 · … · 318d 102**) y el tamaño real del mercado del área de Santiago (**~7.200 coches/año**), que es lo que desmonta el supuesto de «techos de demanda» del modelo antiguo.

13. **🗺️ Módulo Interactivo en el ERP: `Calculadora de viaje` (`erp/src/views/TripCalculatorView.jsx`)**
   - Integrada en el menú lateral del ERP con mapa interactivo **Leaflet + OSRM**, buscador de cualquier ciudad/dirección europea, 3 rutas alternativas reales con cálculo automático de peajes por país y consumo según coche (*Focus ST 280, Golf GTI, Audi Q7, Porsche Cayenne, 2.0 TDI*) y envío en 1 clic al **Simulador de Importación**.

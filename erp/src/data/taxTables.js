// ============================================================================
// TABLAS FISCALES Y DE TASAS DE REFERENCIA PARA MATRICULAR UN COCHE IMPORTADO
// EN A CORUÑA (GALICIA). Fuentes: Ley 38/1992 (IEDMT), Orden HFP anual de
// precios medios de venta (valor venal), Ordenanza Fiscal nº 2 Concello de
// A Coruña (IVTM), Tasas DGT (Ley 16/1979 actualizada), tarifas ITV Galicia.
// Los importes marcados como "orientativo" deben verificarse cada ejercicio.
// ============================================================================

export const TAX_TABLES_YEAR = 2026;

// ---------------------------------------------------------------------------
// 1. IMPUESTO ESPECIAL SOBRE DETERMINADOS MEDIOS DE TRANSPORTE (IEDMT)
//    "Impuesto de Matriculación" - Modelo 576 AEAT. Art. 70 Ley 38/1992.
//    Galicia aplica los tipos estatales (no ha ejercido competencia normativa).
// ---------------------------------------------------------------------------
export const IEDMT_BRACKETS = [
  { epigrafe: "1º", label: "Hasta 120 g/km", minCo2: 0, maxCo2: 120, rate: 0.0, note: "Exento. Incluye ECO/híbridos y la mayoría de diésel modernos WLTP < 120." },
  { epigrafe: "2º", label: "De 121 a 159 g/km", minCo2: 121, maxCo2: 159, rate: 0.0475, note: "Tramo habitual de SUV diésel y gasolina 1.5 TSI." },
  { epigrafe: "3º", label: "De 160 a 199 g/km", minCo2: 160, maxCo2: 199, rate: 0.0975, note: "SUV grandes 2.2 CRDi, furgonetas T6 y 4x4." },
  { epigrafe: "4º", label: "200 g/km o más", minCo2: 200, maxCo2: 9999, rate: 0.1475, note: "Deportivos, pick-ups pesados, V6/V8." },
];

// ---------------------------------------------------------------------------
// 2. VALOR VENAL HACIENDA: PORCENTAJES DE DEPRECIACIÓN POR ANTIGÜEDAD
//    Anexo IV Orden HFP de precios medios (idéntica cada año).
//    Se aplica sobre el "precio medio de venta" del vehículo nuevo.
// ---------------------------------------------------------------------------
export const HACIENDA_DEPRECIATION = [
  { label: "Hasta 1 año", maxYears: 1, pct: 100 },
  { label: "Más de 1 año, hasta 2", maxYears: 2, pct: 84 },
  { label: "Más de 2 años, hasta 3", maxYears: 3, pct: 67 },
  { label: "Más de 3 años, hasta 4", maxYears: 4, pct: 56 },
  { label: "Más de 4 años, hasta 5", maxYears: 5, pct: 47 },
  { label: "Más de 5 años, hasta 6", maxYears: 6, pct: 39 },
  { label: "Más de 6 años, hasta 7", maxYears: 7, pct: 34 },
  { label: "Más de 7 años, hasta 8", maxYears: 8, pct: 28 },
  { label: "Más de 8 años, hasta 9", maxYears: 9, pct: 24 },
  { label: "Más de 9 años, hasta 10", maxYears: 10, pct: 19 },
  { label: "Más de 10 años, hasta 11", maxYears: 11, pct: 17 },
  { label: "Más de 11 años, hasta 12", maxYears: 12, pct: 13 },
  { label: "Más de 12 años", maxYears: 99, pct: 10 },
];

// Notas de aplicación de la Orden de precios medios
export const HACIENDA_VALUATION_NOTES = [
  "El valor venal = Precio medio de venta (tabla Hacienda, vehículo nuevo) × % de depreciación según antigüedad.",
  "Para el IEDMT (Mod. 576) la Orden permite minorar el valor de tablas en la parte de IVA (21 %) e IEDMT que ya incluye el precio medio.",
  "Si declaras por tablas Hacienda NO puede comprobarte valores. Si declaras por precio de factura y es inferior a tablas, la AEAT/Atriga puede girar una liquidación complementaria.",
  "El ITP (Mod. 620 Atriga) se liquida sobre el mayor entre precio pactado y valor venal de tablas.",
  "Antigüedad: se cuenta desde la primera matriculación (Teil II / carta de circulación) hasta la fecha de devengo.",
];

// ---------------------------------------------------------------------------
// 3. IVTM (Impuesto de Circulación) CONCELLO DE A CORUÑA - Turismos por CVF.
//    Ordenanza Fiscal nº 2. Cuota anual. Se prorratea por trimestres naturales
//    en el año de matriculación (ej: matricular en junio = 3/4 de la cuota).
// ---------------------------------------------------------------------------
export const IVTM_CORUNA_TURISMOS = [
  { label: "Menos de 8 CVF", minCvf: 0, maxCvf: 7.99, annual: 19.50 },
  { label: "De 8 hasta 11,99 CVF", minCvf: 8, maxCvf: 11.99, annual: 62.62 },
  { label: "De 12 hasta 15,99 CVF", minCvf: 12, maxCvf: 15.99, annual: 132.19 },
  { label: "De 16 hasta 19,99 CVF", minCvf: 16, maxCvf: 19.99, annual: 179.20 },
  { label: "20 CVF o más", minCvf: 20, maxCvf: 999, annual: 224.00 },
];
// Fuente: Ordenanza Fiscal nº 52 del Concello da Coruña (Pleno 18-11-2024,
// BOP nº 9 de 15-01-2025), libro de ordenanzas 2026. Periodo voluntario 2026:
// del 3 de marzo al 5 de mayo (cargo a domiciliados el 10 de abril).

export const IVTM_CORUNA_BONIFICACIONES = [
  { label: "Vehículos eléctricos / 0 Emisiones", pct: 75, years: "5 años" },
  { label: "Híbridos enchufables / ECO (según ordenanza vigente)", pct: 50, years: "4 años" },
  { label: "Vehículos históricos (+25 años)", pct: 100, years: "Indefinido" },
];

// ---------------------------------------------------------------------------
// 4. TASAS DGT, ITV Y GASTOS DE MATRICULACIÓN (Jefatura A Coruña)
// ---------------------------------------------------------------------------
export const REGISTRATION_FEES = [
  { group: "DGT", code: "Tasa 1.1", label: "Matriculación ordinaria (permiso de circulación)", amount: 99.77, mandatory: true, note: "Fija estatal. Se paga online en sede.dgt.gob.es o en Jefatura (C/ Médico Rodríguez)." },
  { group: "DGT", code: "Tasa 1.5", label: "Cambio de titularidad (transferencia al comprador final)", amount: 55.70, mandatory: false, note: "La paga el comprador final al transferir. Si el vehículo tiene +25 años: 27,85 €." },
  { group: "DGT", code: "Tasa 4.1", label: "Duplicado permiso / anotaciones", amount: 21.30, mandatory: false, note: "Solo si hay que corregir datos." },
  { group: "DGT", code: "Placas verdes", label: "Matrícula temporal de circulación (P) 60 días", amount: 20.61, mandatory: false, note: "Tasa 1.4 DGT. Alternativa a las placas rojas alemanas para circular hasta matricular." },
  { group: "ITV", code: "ITV Import.", label: "Inspección previa a matriculación (turismo diésel + ficha técnica, Galicia)", amount: 132.59, mandatory: true, note: "Tarifa regulada Xunta 2026: turismo diésel 52,30 € + expedición de ficha técnica 80,29 € (IVA y tasa DGT incluidos). Gasolina: 43,76 € + 80,29 €. Estaciones Espíritu Santo (Cambre) y Sabón (Arteixo)." },
  { group: "ITV", code: "Ficha Reducida", label: "Ficha técnica reducida (si NO trae COC)", amount: 90.00, mandatory: false, note: "De 60 a 200 € según ingeniería. Gratis si el coche trae el Certificado de Conformidad (COC)." },
  { group: "ITV", code: "COC fabricante", label: "Certificado de Conformidad pedido al fabricante", amount: 120.00, mandatory: false, note: "VW/Audi/Seat ~120-150 €. BMW ~150 €. Mercedes ~110 €. Toyota ~100 €." },
  { group: "AEAT", code: "Mod. 576", label: "Impuesto de Matriculación (IEDMT)", amount: null, mandatory: true, note: "Según tramo CO2 y valor venal. Ver tabla IEDMT. 0 € si CO2 ≤ 120 g/km (Mod. 06 exento)." },
  { group: "AEAT", code: "Mod. 06", label: "Declaración de no sujeción / exención IEDMT", amount: 0, mandatory: false, note: "Se presenta en lugar del 576 cuando el coche está exento (≤120 g/km)." },
  { group: "Atriga", code: "Mod. 620", label: "ITP 8 % Galicia (solo compra a particular)", amount: null, mandatory: false, note: "Sobre el mayor de precio pagado o valor venal. No aplica si compras a concesionario con factura (IVA/REBU)." },
  { group: "Concello", code: "IVTM", label: "Impuesto de circulación A Coruña (alta)", amount: null, mandatory: true, note: "Prorrateado por trimestres. Ver tabla IVTM por CVF." },
  { group: "Otros", code: "Placas", label: "Placas de matrícula metacrilato (par)", amount: 28.00, mandatory: true, note: "De 20 a 40 € en tienda de recambios / gestoría." },
  { group: "Otros", code: "Gestoría", label: "Gestoría administrativa (opcional)", amount: 180.00, mandatory: false, note: "De 120 a 300 € en A Coruña. Si lo haces tú en DGT te lo ahorras." },
  { group: "Otros", code: "Seguro", label: "Seguro temporal para bajar rodando / seguro del stock", amount: 90.00, mandatory: false, note: "Solo si bajas el coche rodando. En camión no hace falta." },
  { group: "Alemania", code: "Kurzzeitkennzeichen", label: "Placas cortas alemanas 5 días (bajar rodando)", amount: 110.00, mandatory: false, note: "Placas 5 días + seguro eVB ~100-150 €. Placas Zoll de exportación 30 días ~ 250 €." },
];

// ---------------------------------------------------------------------------
// 5. FÓRMULA OFICIAL DE POTENCIA FISCAL (CVF) - Anexo V RD 2822/1998
//    Motor 4 tiempos:  CVF = 0,08 × (0,785 × D² × R)^0,6 × N
//    Siendo 0,785·D²·R = cilindrada unitaria en cm³ (cc / nº cilindros)
// ---------------------------------------------------------------------------
export const CVF_EXAMPLES = [
  { engine: "1.0 TSI 3 cil. (999 cc)", cc: 999, cyl: 3 },
  { engine: "1.2 PureTech 3 cil. (1.199 cc)", cc: 1199, cyl: 3 },
  { engine: "1.5 TSI 4 cil. (1.498 cc)", cc: 1498, cyl: 4 },
  { engine: "1.6 CRDi 4 cil. (1.598 cc)", cc: 1598, cyl: 4 },
  { engine: "1.8 Hybrid 4 cil. (1.798 cc)", cc: 1798, cyl: 4 },
  { engine: "2.0 TDI 4 cil. (1.968 cc)", cc: 1968, cyl: 4 },
  { engine: "2.2 CRDi 4 cil. (2.199 cc)", cc: 2199, cyl: 4 },
  { engine: "2.5 Hybrid 4 cil. (2.487 cc)", cc: 2487, cyl: 4 },
  { engine: "2.8 D-4D 4 cil. (2.755 cc)", cc: 2755, cyl: 4 },
  { engine: "3.0 V6 (2.993 cc)", cc: 2993, cyl: 6 },
];

// ---------------------------------------------------------------------------
// 6. TIPOS IRPF BASE DEL AHORRO (Ganancia patrimonial particular)
// ---------------------------------------------------------------------------
export const IRPF_SAVINGS_BRACKETS = [
  { label: "Hasta 6.000 €", rate: 19 },
  { label: "De 6.000 a 50.000 €", rate: 21 },
  { label: "De 50.000 a 200.000 €", rate: 23 },
  { label: "De 200.000 a 300.000 €", rate: 27 },
  { label: "Más de 300.000 €", rate: 30 },
];

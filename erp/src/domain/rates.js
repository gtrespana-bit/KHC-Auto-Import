// ============================================================================
//  TARIFAS Y TABLAS OFICIALES — EJERCICIO 2026
// ----------------------------------------------------------------------------
//  Todos los importes de este fichero proceden de fuentes públicas y se pueden
//  sobrescribir desde «Ajustes → Tarifas» (se guardan en tu base de datos y se
//  aplican a todos los cálculos). Cada bloque indica su fuente y su estado de
//  verificación:
//     [V]  verificado en fuente oficial o libro de ordenanzas
//     [E]  estimación de mercado / importe orientativo → revísalo cada año
// ============================================================================

export const RATES_YEAR = 2026;

// ---------------------------------------------------------------------------
// 1. IEDMT — Impuesto Especial sobre Determinados Medios de Transporte
//    («impuesto de matriculación»). Art. 70 y ss. Ley 38/1992. Modelo 576.
//    Galicia no ha ejercido la facultad de modificar los tipos estatales.   [V]
// ---------------------------------------------------------------------------
export const IEDMT_BRACKETS = [
  { epigrafe: '1.º', label: 'Hasta 120 g/km', minCo2: 0, maxCo2: 120, rate: 0, note: 'Exento. Híbridos, eléctricos y buena parte de los diésel/gasolina WLTP actuales. Se presenta el Modelo 06.' },
  { epigrafe: '2.º', label: 'Más de 120 y menos de 160 g/km', minCo2: 121, maxCo2: 159, rate: 0.0475, note: 'Tramo más habitual en SUV medios y compactos gasolina.' },
  { epigrafe: '3.º', label: 'De 160 a menos de 200 g/km', minCo2: 160, maxCo2: 199, rate: 0.0975, note: 'SUV grandes, furgonetas, 4x4.' },
  { epigrafe: '4.º', label: '200 g/km o más', minCo2: 200, maxCo2: 99999, rate: 0.1475, note: 'Deportivos, pick-up, V6/V8.' },
];

// ---------------------------------------------------------------------------
// 2. Depreciación oficial para el valor venal (Orden anual de precios medios
//    de venta. Última publicada: Orden HAC/1501/2025).                    [V]
// ---------------------------------------------------------------------------
export const VALOR_VENAL_DEPRECIATION = [
  { label: 'Hasta 1 año', maxYears: 1, pct: 100 },
  { label: 'Más de 1 año, hasta 2', maxYears: 2, pct: 84 },
  { label: 'Más de 2 años, hasta 3', maxYears: 3, pct: 67 },
  { label: 'Más de 3 años, hasta 4', maxYears: 4, pct: 56 },
  { label: 'Más de 4 años, hasta 5', maxYears: 5, pct: 47 },
  { label: 'Más de 5 años, hasta 6', maxYears: 6, pct: 39 },
  { label: 'Más de 6 años, hasta 7', maxYears: 7, pct: 34 },
  { label: 'Más de 7 años, hasta 8', maxYears: 8, pct: 28 },
  { label: 'Más de 8 años, hasta 9', maxYears: 9, pct: 24 },
  { label: 'Más de 9 años, hasta 10', maxYears: 10, pct: 19 },
  { label: 'Más de 10 años, hasta 11', maxYears: 11, pct: 17 },
  { label: 'Más de 11 años, hasta 12', maxYears: 12, pct: 13 },
  { label: 'Más de 12 años', maxYears: 99, pct: 10 },
];

export const VALOR_VENAL_NOTES = [
  'Valor venal = precio medio de venta del vehículo nuevo (tabla de la Orden) × % de depreciación por antigüedad.',
  'Para el IEDMT la Orden permite minorar el valor de tablas en el IVA (21 %) y en el propio IEDMT que ya incluye el precio medio: base = valor venal / (1 + 0,21 + tipo).',
  'Declarar por tablas impide a la Administración comprobar valores. Declarar por debajo de tablas abre la puerta a una liquidación complementaria.',
  'El ITP se liquida sobre el MAYOR entre el precio pactado y el valor de tablas.',
  'La antigüedad se computa desde la fecha de primera matriculación que figura en el permiso de circulación del país de origen (Teil I alemán, carte grise…).',
];

// ---------------------------------------------------------------------------
// 3. IVTM — Concello da Coruña, Ordenanza Fiscal nº 52 (Pleno 18-11-2024,
//    BOP nº 9 de 15-01-2025; libro de ordenanzas 2026).                   [V]
//    Periodo voluntario 2026: 3 de marzo – 5 de mayo. Se devenga el 1/1 y se
//    prorratea por trimestres naturales en la primera matriculación.
// ---------------------------------------------------------------------------
export const IVTM_CORUNA_TURISMOS = [
  { label: 'Menos de 8 CVF', min: 0, max: 7.99, annual: 19.50 },
  { label: 'De 8 hasta 11,99 CVF', min: 8, max: 11.99, annual: 62.62 },
  { label: 'De 12 hasta 15,99 CVF', min: 12, max: 15.99, annual: 132.19 },
  { label: 'De 16 hasta 19,99 CVF', min: 16, max: 19.99, annual: 179.20 },
  { label: '20 CVF o más', min: 20, max: 9999, annual: 224.00 },
];

// Cuotas mínimas estatales (art. 95.1 TRLRHL) para el resto de clases.
// El Concello puede aplicar un coeficiente de hasta 2: verifica el recibo real
// y ajusta en Ajustes → Tarifas.                                          [E]
export const IVTM_BASE_STATE = {
  camiones: [
    { label: 'Carga útil < 1.000 kg', min: 0, max: 999, annual: 42.28 },
    { label: 'Carga útil 1.000 – 2.999 kg', min: 1000, max: 2999, annual: 83.30 },
    { label: 'Carga útil 3.000 – 9.999 kg', min: 3000, max: 9999, annual: 118.64 },
    { label: 'Carga útil ≥ 10.000 kg', min: 10000, max: 999999, annual: 148.30 },
  ],
  motos: [
    { label: 'Ciclomotores', min: 0, max: 50, annual: 4.42 },
    { label: 'Hasta 125 cc', min: 51, max: 125, annual: 4.42 },
    { label: 'Más de 125 hasta 250 cc', min: 126, max: 250, annual: 7.57 },
    { label: 'Más de 250 hasta 500 cc', min: 251, max: 500, annual: 15.15 },
    { label: 'Más de 500 hasta 1.000 cc', min: 501, max: 1000, annual: 30.29 },
    { label: 'Más de 1.000 cc', min: 1001, max: 99999, annual: 60.58 },
  ],
};

export const IVTM_CORUNA_BONIFICACIONES = [
  { label: 'Eléctricos / cero emisiones', pct: 60, years: 'Ejercicio de matriculación y el siguiente', note: 'Bonificación rogada: solicitar en el mes siguiente a la matriculación (art. 5.2 OF 52).' },
  { label: 'Híbridos de fábrica / etiqueta ECO', pct: 60, years: 'Ejercicio de matriculación y el siguiente', note: 'No acumulable con la anterior.' },
  { label: 'Biogás, GNC, metano, metanol, hidrógeno, GLP', pct: 60, years: 'Ejercicio de matriculación y el siguiente', note: 'No acumulable.' },
  { label: 'Vehículos históricos', pct: 100, years: 'Indefinido', note: 'Catalogados como históricos o con ≥25 años a 31-12-2015, al corriente de pago de los 4 últimos ejercicios.' },
  { label: 'Domiciliación (sistema especial de pagos)', pct: 3, years: 'Cada ejercicio', note: 'Descuento por domiciliar el recibo.' },
];

export const IVTM_PERIOD = { year: 2026, start: '2026-03-03', end: '2026-05-05', directDebit: '2026-04-10' };

// ---------------------------------------------------------------------------
// 4. TASAS DGT 2026 (Anexo de tasas de la Ley de Presupuestos).            [V]
// ---------------------------------------------------------------------------
export const DGT_FEES = {
  matriculacion: { code: '1.1', label: 'Matriculación / rehabilitación (permiso de circulación)', amount: 99.77 },
  ciclomotores: { code: '1.2', label: 'Matriculación, transferencia o rehabilitación de ciclomotores', amount: 27.85 },
  autorizComplementaria: { code: '1.3', label: 'Autorización complementaria de circulación', amount: 132.72 },
  temporal: { code: '1.4', label: 'Matrícula temporal (placas verdes y rojas)', amount: 20.61 },
  transferencia: { code: '1.5', label: 'Cambio de titularidad (transferencia al comprador)', amount: 55.70 },
  fusion: { code: '1.6', label: 'Cambio de titularidad por fusión, escisión o aportación no dineraria', amount: 9.89 },
  duplicadoPermiso: { code: '4.1', label: 'Duplicado del permiso de circulación / anotaciones', amount: 21.30 },
  informe: { code: '4.1 inf.', label: 'Informe del vehículo (historial DGT)', amount: 8.67 },
  bajaTemporal: { code: '1.4 bt', label: 'Baja temporal del vehículo', amount: 0 },
};

// ---------------------------------------------------------------------------
// 5. ITV GALICIA 2026 — tarifas reguladas por la Xunta (IVA y tasa DGT
//    incluidos). Estaciones: Espíritu Santo (Cambre), Sabón (Arteixo),
//    A Grela, O Portiño…                                                [V]
// ---------------------------------------------------------------------------
export const ITV_GALICIA = {
  turismoGasolina: 43.76,
  turismoDiesel: 52.30,
  turismoSinCatalizar: 38.50,
  fichaMatriculacion: 80.29,   // expedición de ficha técnica para matriculación
  fichaMatriculacionRemolque: 39.74,
  segundaInspeccion: 0,        // gratuita dentro de los 15 días en la mayoría de estaciones
  note: 'La inspección previa a la matriculación de un vehículo importado se factura como expedición de ficha técnica (80,29 €) más la inspección correspondiente al tipo de vehículo. Ajusta el importe real de tu estación.',
};

// ---------------------------------------------------------------------------
// 6. ITP — Galicia. Art. 14.Uno del TR aprobado por D. Leg. 1/2011 (redacción
//    de la Ley 10/2023, en vigor desde 2024): tipo general 8 %.            [V]
//    Autoliquidación: Modelo 620 (vehículos) ante la ATRIGA. Plazo: 1 mes.
// ---------------------------------------------------------------------------
export const ITP_GALICIA = {
  rate: 0.08,
  model: '620',
  agency: 'ATRIGA (Axencia Tributaria de Galicia)',
  deadlineDays: 30,
  base: 'Mayor entre el precio pactado y el valor medio de tablas (Hacienda).',
  appliesWhen: 'Compra a PARTICULAR (dentro o fuera de España). Si el vendedor es empresario que factura con IVA o en REBU, la operación no tributa por ITP.',
  exemptions: [
    'Vehículos de cero emisiones adquiridos por sujetos pasivos de IVA en el ejercicio de su actividad (verificar en la normativa autonómica vigente).',
    'Compraventas entre empresarios por vehículos afectos a la actividad: sujetas a IVA, no a ITP.',
  ],
};

// Tipos de ITP de las demás CCAA (para compras fuera de Galicia).         [E]
export const ITP_BY_REGION = [
  { region: 'Galicia', rate: 0.08 }, { region: 'Andalucía', rate: 0.04 },
  { region: 'Aragón', rate: 0.08 }, { region: 'Asturias', rate: 0.08 },
  { region: 'Baleares', rate: 0.08 }, { region: 'Canarias', rate: 0.055 },
  { region: 'Cantabria', rate: 0.05 }, { region: 'Castilla-La Mancha', rate: 0.06 },
  { region: 'Castilla y León', rate: 0.05 }, { region: 'Cataluña', rate: 0.05 },
  { region: 'C. Valenciana', rate: 0.08 }, { region: 'Extremadura', rate: 0.06 },
  { region: 'Madrid', rate: 0.04 }, { region: 'Murcia', rate: 0.04 },
  { region: 'Navarra', rate: 0.06 }, { region: 'País Vasco', rate: 0.04 },
  { region: 'La Rioja', rate: 0.07 },
];

// ---------------------------------------------------------------------------
// 7. IVA / REBU (arts. 135-139 Ley 37/1992).                               [V]
// ---------------------------------------------------------------------------
export const VAT = {
  general: 0.21,
  rebu: 0.21,
  reduced: 0.10,
  intraCommunityNote:
    'Compra intracomunitaria a empresario que repercuta IVA: si eres empresario, autoliquidas el 21 % en el Modelo 303 (devengado y deducido simultáneamente) y declaras la operación en el Modelo 349. Si eres particular, ingresas el IVA con el Modelo 309.',
  rebuNote:
    'Régimen Especial de Bienes Usados: el IVA se aplica solo sobre el margen (precio de venta − precio de compra), la compra no da derecho a deducción y la factura debe llevar la mención «Régimen especial de los bienes usados» (art. 137 Ley IVA). Prohibido consignar el IVA en la factura de venta.',
};

// ---------------------------------------------------------------------------
// 8. IRPF 2026 — base del ahorro (ganancias patrimoniales). El último tramo
//    pasa del 28 % al 30 % desde 2025 (Ley 7/2024).                       [V]
// ---------------------------------------------------------------------------
export const IRPF_SAVINGS = [
  { label: 'Hasta 6.000 €', from: 0, to: 6000, rate: 0.19 },
  { label: 'De 6.000 a 50.000 €', from: 6000, to: 50000, rate: 0.21 },
  { label: 'De 50.000 a 200.000 €', from: 50000, to: 200000, rate: 0.23 },
  { label: 'De 200.000 a 300.000 €', from: 200000, to: 300000, rate: 0.27 },
  { label: 'Más de 300.000 €', from: 300000, to: Infinity, rate: 0.30 },
];

// Escala general combinada (estatal + autonómica) usada para estimar el IRPF
// de un autónomo. Galicia aplica un primer tramo autonómico del 9,00 % (0,50
// puntos menos que el estatal) y el mismo 22,50 % máximo: la escala agregada
// real puede diferir unas décimas. EDITABLE en Ajustes → Fiscalidad.      [E]
export const IRPF_GENERAL_COMBINED = [
  { from: 0, to: 12450, rate: 0.185 },
  { from: 12450, to: 20200, rate: 0.235 },
  { from: 20200, to: 35200, rate: 0.295 },
  { from: 35200, to: 60000, rate: 0.365 },
  { from: 60000, to: 300000, rate: 0.445 },
  { from: 300000, to: Infinity, rate: 0.465 },
];

export const IRPF_MINIMO_PERSONAL = 5550; // mínimo del contribuyente 2026

// ---------------------------------------------------------------------------
// 9. Impuesto sobre Sociedades 2026 (art. 29 LIS y DT 38.ª).               [V]
// ---------------------------------------------------------------------------
export const IS_2026 = {
  general: 0.25,
  reducida: { maxTurnover: 10000000, rate: 0.23 }, // empresas de reducida dimensión
  microempresa: { maxTurnover: 1000000, first: 50000, rateFirst: 0.19, rateRest: 0.21 },
  nuevaCreacion: 0.15, // primer período con base positiva y el siguiente
  note: 'Microempresa (cifra de negocios < 1 M€): 19 % sobre los primeros 50.000 € de base y 21 % sobre el resto en 2026 (17 %/20 % desde 2027). Reducida dimensión (< 10 M€): 23 % en 2026. Resto: 25 %.',
};

// ---------------------------------------------------------------------------
// 10. RETA — cuota de autónomos 2026 (cotización por ingresos reales, 15
//     tramos). Tipo general 2026: 31,5 %. Los importes de cuota son
//     ESTIMACIONES: confírmalos en la TGSS.                              [E]
// ---------------------------------------------------------------------------
export const RETA_2026 = {
  tipo: 0.315,
  tarifaPlana: 80, // €/mes durante los 12 primeros meses de alta
  tramos: [
    { n: 1, from: 0, to: 670, base: 653.59, cuota: 200 },
    { n: 2, from: 670.01, to: 900, base: 718.95, cuota: 220 },
    { n: 3, from: 900.01, to: 1166.7, base: 849.67, cuota: 260 },
    { n: 4, from: 1166.71, to: 1300, base: 950.98, cuota: 298.61 },
    { n: 5, from: 1300.01, to: 1500, base: 960.78, cuota: 301.68 },
    { n: 6, from: 1500.01, to: 1700, base: 960.78, cuota: 301.68 },
    { n: 7, from: 1700.01, to: 1850, base: 1143.79, cuota: 359.15 },
    { n: 8, from: 1850.01, to: 2030, base: 1209.15, cuota: 379.67 },
    { n: 9, from: 2030.01, to: 2330, base: 1274.51, cuota: 400.20 },
    { n: 10, from: 2330.01, to: 2760, base: 1356.21, cuota: 425.85 },
    { n: 11, from: 2760.01, to: 3190, base: 1437.91, cuota: 451.50 },
    { n: 12, from: 3190.01, to: 3620, base: 1519.61, cuota: 477.16 },
    { n: 13, from: 3620.01, to: 4050, base: 1601.31, cuota: 502.81 },
    { n: 14, from: 4050.01, to: 6000, base: 1732.03, cuota: 543.86 },
    { n: 15, from: 6000.01, to: Infinity, base: 1928.10, cuota: 605.42 },
  ],
  note: 'Sistema de cotización por rendimientos netos reales. Se puede cambiar de tramo hasta 6 veces al año. Rendimiento neto = ingresos − gastos deducibles − 7 % de gastos genéricos.',
};

// ---------------------------------------------------------------------------
// 11. Costes operativos medios del corredor A Coruña (editables).         [E]
// ---------------------------------------------------------------------------
export const OPERATING_COSTS = {
  transporteCamion: { label: 'Portacoches Alemania → A Coruña', amount: 750, unit: '€/vehículo', note: '650-950 € según destino y temporada. Bélgica/Holanda +100 €.' },
  transporteCarretera: { label: 'Bajada rodando (placas cortas + seguro + viaje)', amount: 690, unit: '€/vehículo', note: 'Placas 5 días + seguro eVB ≈ 110 €, combustible ≈ 260 €, peajes ≈ 90 €, hotel/vuelos ≈ 230 €.' },
  transporteMixto: { label: 'Logística por viaje: 1 coche rodando + 2 en camión (prorrateado)', amount: 730, unit: '€/vehículo', note: '(2 × 750 € camión + 690 € bajada rodando con vuelo/hotel) / 3 coches. El viaje para ver los coches va incluido en la bajada rodando.' },
  imprevistos: { label: 'Reserva para imprevistos mecánicos (neumáticos, frenos, revisión)', amount: 300, unit: '€/vehículo' },
  rebajaVenta: { label: 'Rebaja por regateo en la venta', amount: 3, unit: '% del precio anunciado' },
  placasAlemanas5dias: { label: 'Kurzzeitkennzeichen (placas 5 días + seguro eVB)', amount: 110 },
  placasZollExport: { label: 'Placas Zoll de exportación (30 días)', amount: 250 },
  gestoria: { label: 'Gestoría administrativa (matriculación completa)', amount: 180 },
  placasMatricula: { label: 'Juego de placas de matrícula (par)', amount: 28 },
  coc: { label: 'Certificado de Conformidad (COC) pedido a fábrica', amount: 120 },
  fichaReducida: { label: 'Ficha técnica reducida (sin COC)', amount: 90 },
  traduccionJurada: { label: 'Traducción jurada de la documentación', amount: 45 },
  seguroStockMes: { label: 'Seguro de stock / garaje (por vehículo y mes)', amount: 12 },
  preparacionBasica: { label: 'Preparación y limpieza profesional', amount: 180 },
  garantiaExternaAnual: { label: 'Póliza de garantía mecánica (por vehículo vendido)', amount: 240 },
  anuncioPortal: { label: 'Publicación en portales (Coches.net / Wallapop Pro)', amount: 30 },
  financionComision: { label: 'Comisión de financiación intermediada', amount: 0 },
};

// ---------------------------------------------------------------------------
// 12. Fuentes consultadas (para el panel «Fuentes y verificación»)
// ---------------------------------------------------------------------------
export const SOURCES = [
  { label: 'Ley 38/1992, arts. 65-80 (IEDMT) y Orden anual de precios medios de venta (Orden HAC/1501/2025)', url: 'https://www.boe.es' },
  { label: 'Tasas DGT 2026 (anexo de tasas, Ley de Presupuestos Generales del Estado)', url: 'https://sede.dgt.gob.es' },
  { label: 'Ordenanza Fiscal nº 52 IVTM — Concello da Coruña (Pleno 18-11-2024, BOP nº 9 de 15-01-2025)', url: 'https://www.coruna.gal' },
  { label: 'Tarifas ITV Galicia 2026 (Xunta de Galicia, tarifas reguladas)', url: 'https://sycitv.com' },
  { label: 'D. Leg. 1/2011 de Galicia, art. 14 (ITP) — ATRIGA', url: 'https://atriga.xunta.gal' },
  { label: 'Ley 37/1992 del IVA, arts. 135-139 (REBU)', url: 'https://sede.agenciatributaria.gob.es' },
  { label: 'Ley 35/2006 del IRPF, arts. 63 y 66 (escalas) y Ley 7/2024 (tipo 30 %)', url: 'https://sede.agenciatributaria.gob.es' },
  { label: 'Ley 27/2014 del Impuesto sobre Sociedades, art. 29 y DT 38.ª', url: 'https://sede.agenciatributaria.gob.es' },
  { label: 'RD-ley 13/2022 y tablas RETA 2026 (cotización por ingresos reales) — TGSS', url: 'https://www.seg-social.es' },
  { label: 'RD 2822/1998, Anexo V: fórmula de potencia fiscal (CVF)', url: 'https://www.boe.es' },
];

// ---------------------------------------------------------------------------
// Tarifas efectivas: valores por defecto fusionados con los ajustes de empresa
// ---------------------------------------------------------------------------
export const DEFAULT_TARIFFS = {
  ...Object.fromEntries(Object.entries(DGT_FEES).map(([k, v]) => [`dgt_${k}`, v.amount])),
  itv_turismo_gasolina: ITV_GALICIA.turismoGasolina,
  itv_turismo_diesel: ITV_GALICIA.turismoDiesel,
  itv_ficha_matriculacion: ITV_GALICIA.fichaMatriculacion,
  itp_galicia: ITP_GALICIA.rate * 100,
  placas_matricula: OPERATING_COSTS.placasMatricula.amount,
  transporte_camion: OPERATING_COSTS.transporteCamion.amount,
  transporte_carretera: OPERATING_COSTS.transporteCarretera.amount,
  transporte_mixto: OPERATING_COSTS.transporteMixto.amount,
  imprevistos: OPERATING_COSTS.imprevistos.amount,
  rebaja_venta_pct: OPERATING_COSTS.rebajaVenta.amount,
  gestoria: OPERATING_COSTS.gestoria.amount,
  preparacion: OPERATING_COSTS.preparacionBasica.amount,
  garantia_externa: OPERATING_COSTS.garantiaExternaAnual.amount,
  anuncio_portal: OPERATING_COSTS.anuncioPortal.amount,
  ivtm_turismo_1: IVTM_CORUNA_TURISMOS[0].annual,
  ivtm_turismo_2: IVTM_CORUNA_TURISMOS[1].annual,
  ivtm_turismo_3: IVTM_CORUNA_TURISMOS[2].annual,
  ivtm_turismo_4: IVTM_CORUNA_TURISMOS[3].annual,
  ivtm_turismo_5: IVTM_CORUNA_TURISMOS[4].annual,
};

export function effectiveTariffs(company = {}) {
  return { ...DEFAULT_TARIFFS, ...(company?.tariffs || {}) };
}

export const TARIFF_GROUPS = [
  {
    title: 'Tasas DGT',
    items: Object.entries(DGT_FEES).map(([k, v]) => ({ key: `dgt_${k}`, label: `${v.code} · ${v.label}` })),
  },
  {
    title: 'ITV Galicia',
    items: [
      { key: 'itv_turismo_gasolina', label: 'ITV turismo gasolina' },
      { key: 'itv_turismo_diesel', label: 'ITV turismo diésel' },
      { key: 'itv_ficha_matriculacion', label: 'Expedición ficha técnica para matriculación' },
    ],
  },
  {
    title: 'IVTM A Coruña (turismos)',
    items: [
      { key: 'ivtm_turismo_1', label: 'Menos de 8 CVF' },
      { key: 'ivtm_turismo_2', label: 'De 8 a 11,99 CVF' },
      { key: 'ivtm_turismo_3', label: 'De 12 a 15,99 CVF' },
      { key: 'ivtm_turismo_4', label: 'De 16 a 19,99 CVF' },
      { key: 'ivtm_turismo_5', label: '20 CVF o más' },
    ],
  },
  {
    title: 'Impuestos',
    items: [{ key: 'itp_galicia', label: 'ITP Galicia (% sobre el valor mayor)', suffix: '%' }],
  },
  {
    title: 'Costes operativos',
    items: [
      { key: 'transporte_camion', label: 'Transporte en portacoches' },
      { key: 'transporte_mixto', label: 'Logística media por coche (1 rodando + 2 camión)' },
      { key: 'imprevistos', label: 'Reserva imprevistos mecánicos' },
      { key: 'rebaja_venta_pct', label: 'Rebaja por regateo en venta (%)' },
      { key: 'transporte_carretera', label: 'Bajada rodando' },
      { key: 'gestoria', label: 'Gestoría' },
      { key: 'placas_matricula', label: 'Placas de matrícula' },
      { key: 'preparacion', label: 'Preparación y limpieza' },
      { key: 'garantia_externa', label: 'Póliza de garantía mecánica' },
      { key: 'anuncio_portal', label: 'Anuncio en portales' },
    ],
  },
];

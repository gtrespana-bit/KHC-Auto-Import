// ============================================================================
//  GUÍA DE MODELOS — fichas públicas generadas desde el catálogo del ERP
// ----------------------------------------------------------------------------
//  Fuente única de verdad: erp/src/data/catalog/*.js (modelos, generaciones y
//  motores) + reliability.js (veredictos). Esta capa solo transforma y añade
//  texto público seguro. NUNCA exponer aquí: PVP nuevo, factor de demanda,
//  CO₂ de cálculo, notas internas del registro ni precios de mercado.
//  Política editorial: sin cifras de precio — los precios se consultan.
// ============================================================================

import { VAG } from '../erp/src/data/catalog/vag.js';
import { PREMIUM } from '../erp/src/data/catalog/premium.js';
import { ASIATICOS } from '../erp/src/data/catalog/asiaticos.js';
import { FRANCESES } from '../erp/src/data/catalog/franceses.js';
import { OTROS } from '../erp/src/data/catalog/otros.js';
import { ENGINES } from '../erp/src/data/catalog/engines.js';
import RELIABILITY from '../erp/src/data/catalog/reliability.js';
import { FUEL_LABEL, GEAR_LABEL } from '../erp/src/data/catalog/index.js';
import { MOTORS } from './motores.js';

// ---------------------------------------------------------------------------
//  Motivo público (seguro) de cada familia en precaución / prohibida.
//  Redacción propia a partir del hecho mecánico; sin estrategia interna.
// ---------------------------------------------------------------------------
const MOTIVOS = {
  // Prohibidos
  BITDI: 'El enfriador de EGR se desintegra y sus virutas rayan los cilindros: consumo de aceite extremo y, en el límite, motor nuevo. Existe versión monoturbo del mismo motor que sí es fiable.',
  N47: 'Cadena de distribución trasera que se estira y rompe; su sustitución exige desmontar el motor y cuesta entre 3.000 y 4.500 €. Síntoma: cascabeleo metálico en frío.',
  INGENIUM: 'Cadena de distribución trasera con patines frágiles que puede romper antes de 100.000 km, más dilución de gasóleo en el aceite. Reparación superior a 4.000 €.',
  BLUEHDI15: 'Cadena de 7 mm entre árboles de levas subdimensionada (rotura con válvulas dobladas) y depósito de AdBlue que cristaliza.',
  TCE12: 'Segmentos con fuga: consumo de aceite de hasta 1 l cada 800 km, autodetonación y rotura de válvulas. Motivo de demandas colectivas al fabricante.',
  PURETECH: 'Correa de distribución húmeda que se degrada en el aceite, tapona la chupona de la bomba y puede gripar el motor. Solo con correa revisada sustituida y chupona verificada.',
  DCI16_BI: 'Roturas del turbo de baja presión y fisuras en culata y bloque por sobretemperatura en las versiones BiTurbo.',
  MULTIAIR: 'Fallos de las electroválvulas MultiAir, cajas DDCT problemáticas y anomalías eléctricas crónicas del CAN-Bus.',
  ECOBOOST10: 'Correas de distribución y de bomba de aceite bañadas en aceite que se degradan y destruyen el motor (unidades hasta 2019). Las fugas de refrigerante de las primeras series agravan el cuadro.',
  // Precaución
  V6TDI: 'Motor duradero, pero con culatas, inyectores piezoeléctricos y EGR caros de reparar. Solo con historial oficial completo.',
  N57: 'Excelente rendimiento, pero con problemas de cadena de distribución (patines) e inyectores piezoeléctricos. Solo unidades posteriores a 2014 con historial completo.',
  OM651: 'Duro pero ruidoso; las unidades de 2009 a 2011 sufren fallos de inyectores piezoeléctricos Delphi. Desde 2016 existe el OM654, muy superior.',
  VOLVO_T8: 'Combinación de motor turbo/sobrealimentado y sistema eléctrico de 400 V: averías caras y depreciación alta. Exige batería con garantía vigente.',
  JLR_20P: 'Dilución de aceite por el turbo, holgura de la cadena de equilibrado y fallos de refrigeración. Reparaciones de 4.000 a 6.000 €.',
  JLR_I6D: 'Diseño Ingenium con cadena trasera: la sustitución supera los 4.000 € por mano de obra. Solo con garantía vigente o cadena ya cambiada.',
  JLR_I6P: 'Seis cilindros Ingenium más sistema híbrido de 400 V: complejidad y coste de reparación muy altos.',
  TOY_AD: 'Juntas de culata y consumo de aceite en unidades de 2006 a 2009; Toyota amplió la garantía en su día. Exige el historial de la culata.',
  GDI16: 'Atmosférico justo de par para mover un SUV: prestaciones escasas y 9-9,5 l/100 km en autovía. Busca el 1.6 CRDi o el 1.6 T-GDI turbo.',
  SKYACTIV_D: 'Acumulación de carbonilla en la admisión, dilución de aceite y holguras de culata. Reparaciones caras; los gasolina Skyactiv-G son mejor compra.',
  SUBARU_BOXER: 'Consumo de aceite y problemas de cojinetes/culata en unidades anteriores a 2015. Exige pruebas de compresión e historial de consumo.',
  SUBARU_EBOXER: 'Mismo bloque Boxer con hibridación ligera: consumo de aceite documentado y red de servicio escasa.',
  PURETECH_MHEV: 'La versión 2023+ cambia la correa húmeda por cadena, pero el bloque EB2 arrastra historial de desgaste. Exige pruebas de compresión.',
  PSA_PHEV: 'Hereda el bloque PureTech de correa húmeda más la complejidad eléctrica del enchufable. Solo con histórico completo de correa y batería.',
  ECOBOOST15: 'Bloque abierto con infiltración de refrigerante en los cilindros y culatas fisuradas (2013-2018). Solo unidades posteriores a 2019 con pruebas de compresión.',
  JEEP_4XE: 'Caja de doble embrague DDCT problemática, electrónica compleja y batería de tracción: averías caras y red de servicio irregular.',
  FD_D15: 'Motor de origen PSA: mismo riesgo de cadena de 7 mm y cristalización de AdBlue que el 1.5 BlueHDi.',
  FD_PHEV: 'Campaña de llamada a revisión por baterías (2020): verifica el VIN y el estado de la batería antes de comprar.',
  ECOBLUE_BI: 'El segundo turbo y sus actuadores fallan con frecuencia y la reparación supera los 3.000 €. El monoturbo 150/170 CV es la compra sensata.',
  EV_PSA: 'Eléctrico usado: exige certificado de estado de batería (SoH) y comprueba el cargador embarcado. Valor residual bajo: negocia fuerte.',
  EV_RN: 'Las unidades con batería en alquiler obligan a mantener la cuota mensual: revisa el contrato y exige informe de SoH.',
  EV_MG: 'Red de servicio limitada y cobertura de recambios por comprobar. Garantía de 7 años transferible; exige informe de SoH.',
};

const MOTIVO_BANNED_GENERICO = 'Riesgo de avería grave documentado en esta familia mecánica. No lo compramos ni con descuento.';
const MOTIVO_WARN_GENERICO = 'Exige pruebas específicas e historial completo antes de comprar.';

// family -> slug de la ficha pública de motor (cuando existe)
const FICHA_POR_FAMILIA = Object.fromEntries(MOTORS.filter((m) => m.family).map((m) => [m.family, m.slug]));

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const RANK = { gold: 0, ok: 1, warn: 2, banned: 3, none: 4 };

function buildEngine([rawCode, , ov = {}]) {
  const base = rawCode.split(' ')[0];
  const reg = ENGINES[base];
  const name = ov.name || reg?.[0] || rawCode;
  const family = reg?.[6] || null;
  const verdict = (family && RELIABILITY[family]?.reliability) || 'none';
  return {
    name,
    hp: ov.hp || reg?.[3] || null,
    cc: reg?.[1] || null,
    fuel: reg?.[4] || null,
    fuelLabel: reg ? FUEL_LABEL[reg[4]] || reg[4] : null,
    gear: ov.gear || reg?.[5] || null,
    gearLabel: (ov.gear || reg?.[5]) ? GEAR_LABEL[ov.gear || reg[5]] || null : null,
    family,
    verdict,
    fichaSlug: family ? FICHA_POR_FAMILIA[family] || null : null,
    motivo: verdict === 'banned' ? MOTIVOS[family] || MOTIVO_BANNED_GENERICO : verdict === 'warn' ? MOTIVOS[family] || MOTIVO_WARN_GENERICO : null,
  };
}

function buildModel(m, grupo) {
  const generations = m.g.map(([name, from, to, , engines]) => ({
    name,
    from,
    to,
    engines: engines.map(buildEngine).sort((a, b) => RANK[a.verdict] - RANK[b.verdict] || (a.hp || 0) - (b.hp || 0)),
  }));

  // Resumen por familia (sin repetir familias entre generaciones)
  const porFamilia = new Map();
  for (const gen of generations) {
    for (const e of gen.engines) {
      const key = e.family || e.name;
      if (!porFamilia.has(key) || RANK[e.verdict] < RANK[porFamilia.get(key).verdict]) porFamilia.set(key, e);
    }
  }
  const todos = [...porFamilia.values()];
  return {
    slug: slugify(`${m.b} ${m.m}`),
    brand: m.b,
    model: m.m,
    segment: m.seg,
    body: m.body || null,
    grupo,
    generations,
    recomendados: todos.filter((e) => e.verdict === 'gold' || e.verdict === 'ok').sort((a, b) => RANK[a.verdict] - RANK[b.verdict]),
    evitar: todos.filter((e) => e.verdict === 'banned' || e.verdict === 'warn').sort((a, b) => RANK[a.verdict] - RANK[b.verdict]),
    sinClasificar: todos.filter((e) => e.verdict === 'none'),
    tieneDSG: m.b && ['Volkswagen', 'Audi', 'Seat', 'Cupra', 'Skoda'].includes(m.b) && generations.some((g) => g.engines.some((e) => e.gear === 'D')),
  };
}

const CATS = [
  [VAG, 'vag'],
  [PREMIUM, 'premium'],
  [ASIATICOS, 'asiaticos'],
  [FRANCESES, 'franceses'],
  [OTROS, 'otros'],
];

export const MODELOS = CATS.flatMap(([cat, grupo]) => cat.map((m) => buildModel(m, grupo))).sort((a, b) =>
  a.brand.localeCompare(b.brand, 'es') || a.model.localeCompare(b.model, 'es'),
);

export const getModelo = (slug) => MODELOS.find((m) => m.slug === slug) || null;

export const MARCAS = [...new Set(MODELOS.map((m) => m.brand))].sort((a, b) => a.localeCompare(b, 'es'));

export function modelosDeMarca(brand) {
  return MODELOS.filter((m) => m.brand === brand);
}

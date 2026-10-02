// ============================================================================
// GUARDIÁN MECÁNICO: detecta motores problemáticos (lista negra) y motores
// "roca" (lista de oro). Prioriza la ficha de la base de datos; si el usuario
// ha escrito el coche a mano, aplica heurísticas por texto.
// Devuelve { level: 'banned'|'warn'|'gold'|'ok'|null, title, note, source }
// ============================================================================

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const has = (t, ...needles) => needles.some((n) => t.includes(n));

// Reglas de texto (orden = prioridad). year se usa para N47/B47 y EcoBoost.
const TEXT_RULES = [
  {
    level: "banned",
    title: "Stellantis 1.2 PureTech (correa húmeda)",
    note: "Correa de distribución sumergida en aceite que se deshilacha, tapona la bomba de aceite y gripa el motor. Plataforma masiva de afectados en España y Francia. PROHIBIDO importar.",
    test: (t) =>
      has(t, "puretech", "1.2 pure", "eb2dt", "eb2ad") ||
      ((has(t, "peugeot", "citroen", "ds ", "ds3", "ds7", "opel corsa f", "crossland", "grandland", "mokka b") ) && has(t, "1.2 ", "1,2 ", "1.2t", "12 turbo", "1.2 turbo")),
  },
  {
    level: "banned",
    title: "Stellantis 1.5 BlueHDi (DV5)",
    note: "Cadena de 7 mm entre árboles de levas subdimensionada (rotura y válvulas dobladas) y depósito de AdBlue que cristaliza (~1.200 €). PROHIBIDO importar.",
    test: (t) => has(t, "1.5 bluehdi", "1.5bluehdi", "dv5r", "1.5 hdi", "bluehdi 100", "bluehdi 130") && !has(t, "2.0"),
  },
  {
    level: "banned",
    title: "Renault / Nissan / Dacia 1.2 TCe · 1.2 DIG-T (H5Ft)",
    note: "Consumo de 1 l de aceite cada 800 km, autodetonación y rotura de válvulas. Causa directa de demandas por vicios ocultos. PROHIBIDO importar.",
    test: (t) => has(t, "1.2 tce", "1.2tce", "1.2 dig-t", "1.2 dig t", "h5ft", "tce 115", "tce 125", "tce 130") || (has(t, "qashqai", "juke", "captur", "kadjar", "duster", "megane", "clio") && has(t, "1.2 ", "1,2 ")),
  },
  {
    level: "banned",
    title: "Renault 1.6 dCi BiTurbo (R9M 160)",
    note: "Roturas del turbo de baja presión y fisuras de culata/bloque por sobretemperatura (Espace V, Talisman, Trafic, Vivaro 2014-2018).",
    test: (t) => has(t, "1.6 dci 160", "biturbo", "bi-turbo", "twin turbo dci", "dci 145", "dci 160") && has(t, "dci", "1.6"),
  },
  {
    level: "banned",
    title: "Ford 1.0 EcoBoost 'Fox' con correa húmeda (2012-2019)",
    note: "Correa de distribución y de la bomba de aceite bañadas en aceite: se degradan, taponan la bomba y destruyen el motor. Solo el 1.0 EcoBoost mHEV (2020+, cadena) es aceptable.",
    test: (t, y) => has(t, "1.0 ecoboost", "1.0 eco boost", "ecoboost 100", "ecoboost 125", "ecoboost 140") && !has(t, "mhev", "hybrid", "hibrido") && (!y || y < 2020),
  },
  {
    level: "banned",
    title: "Caja Ford Powershift 6DCT250 (doble embrague seco)",
    note: "Tirones severos, sobrecalentamiento y rotura de la mecatrónica en Focus / C-Max / Mondeo / S-Max / Galaxy automáticos anteriores a 2018-19.",
    test: (t, y) => has(t, "powershift") || (has(t, "ford") && has(t, "focus", "c-max", "cmax", "mondeo", "s-max", "smax", "galaxy") && has(t, "automatico", "automático", "aut.", "auto") && (!y || y < 2019)),
  },
  {
    level: "banned",
    title: "Jaguar / Land Rover 2.0 Diésel Ingenium (AJ200D)",
    note: "Cadena de distribución trasera que rompe antes de 100.000 km, holgura de turbo y dilución de gasóleo en el aceite. Altísimo riesgo. PROHIBIDO importar.",
    test: (t) => has(t, "ingenium", "aj200d", "td4 150", "td4 180", "d150", "d180", "d240") || (has(t, "evoque", "discovery sport", "velar", "f-pace", "fpace", "jaguar xe", "jaguar xf") && has(t, "diesel", "diésel", "d ", "td4", "2.0d")),
  },
  {
    level: "banned",
    title: "VW 2.0 BiTDI 180 / 204 CV (CFCA / CXEB) — T5 / T6 / Amarok",
    note: "El enfriador de EGR se desintegra y sus virutas rayan los cilindros: 1 l de aceite cada 200 km y motor completo (10.000 €). Comprar SOLO la 150 CV monoturbo.",
    test: (t) => has(t, "bitdi", "bi-tdi", "cfca", "cxeb", "tdi 180", "tdi 204") && has(t, "2.0", "transporter", "multivan", "caravelle", "california", "t5", "t6", "amarok"),
  },
  {
    level: "banned",
    title: "BMW N47 2.0d (2007 – mediados 2015)",
    note: "Cadena de distribución trasera con guías y piñones defectuosos: se estira y rompe (3.000-4.500 € de reparación). Exigir SIEMPRE bloque B47 (Euro 6, desde mediados de 2015).",
    test: (t, y) => has(t, "n47") || (has(t, "bmw", "mini") && has(t, "116d", "118d", "120d", "316d", "318d", "320d", "x1 18d", "x1 20d", "sdrive18d", "xdrive20d", "cooper d", "cooper sd", "2.0d") && !has(t, "b47") && y && y < 2015),
  },
  {
    level: "banned",
    title: "Nissan cambio CVT X-Tronic (Jatco)",
    note: "Variador continuo por correa metálica que patina y rompe (4.500 €). Evitar Qashqai / X-Trail / Juke / Pulsar automáticos.",
    test: (t) => has(t, "x-tronic", "xtronic", "cvt") && has(t, "nissan", "qashqai", "x-trail", "xtrail", "juke", "pulsar"),
  },
  {
    level: "banned",
    title: "Jeep / Fiat 1.4 MultiAir · 1.6 MJet (2015-2019)",
    note: "Electroválvulas MultiAir, caja DDCT y anomalías eléctricas CAN-Bus crónicas en Renegade / Compass / 500X.",
    test: (t, y) => has(t, "multiair", "multi air", "ddct") || (has(t, "renegade", "compass", "500x") && (!y || y < 2020)),
  },
  {
    level: "warn",
    title: "Hyundai / Kia 1.6 GDI atmosférico (132 CV)",
    note: "Motor perezoso (160 Nm) para un SUV en las cuestas gallegas y 9-9,5 l/100 km en autovía: genera reclamaciones. Busca el 1.6 CRDi diésel o el 1.6 T-GDI turbo.",
    test: (t) => has(t, "1.6 gdi", "1.6gdi", "gdi 132") && !has(t, "hev", "phev", "hybrid", "hibrido", "tgdi", "t-gdi", "turbo"),
  },
  {
    level: "warn",
    title: "Mercedes 2.1 CDI OM651 (pre-2016)",
    note: "Fiable en general pero ruidoso; unidades pre-2012 con inyectores Delphi y cadena de distribución. Post-2016 (Euro 6) aceptable. Preferir OM654 (2018+).",
    test: (t, y) => has(t, "om651", "2.1 cdi", "2.2 cdi", "200 cdi", "220 cdi", "250 cdi") || (has(t, "mercedes") && has(t, "220 d", "220d") && y && y < 2018),
  },
  {
    level: "warn",
    title: "VW / Seat / Skoda DSG DQ200 (7 vel. embragues secos)",
    note: "Los 1.0 TSI / 1.4 TSI / 1.6 TDI automáticos montan la DQ200 de embragues secos: mecatrónica y tirones. Exigir historial y probar en atasco. Los 2.0 TDI / 1.5 TSI 150 DSG montan la DQ381 húmeda (sin problema).",
    test: (t) => has(t, "dq200") || (has(t, "1.0 tsi", "1.4 tsi", "1.6 tdi", "1.2 tsi") && has(t, "dsg", "s tronic", "s-tronic", "automatico", "automático")),
  },
  // ---- Lista de oro ----
  {
    level: "gold",
    title: "VW T6 2.0 TDI 150 CV monoturbo (CXFA / DNAA)",
    note: "Bloque indestructible con manual o DSG DQ500 húmeda. Mayor retención de precio de España en Galicia (surf, ciclismo, camper).",
    test: (t) => has(t, "transporter", "caravelle", "multivan", "california", "t6") && has(t, "150", "cxfa", "dnaa") && !has(t, "bitdi", "204", "180"),
  },
  {
    level: "gold",
    title: "MOTOR ROCA VAG: 2.0 TDI EA288",
    note: "Correa de distribución tradicional seca, inyección Bosch y cajas DSG DQ381/DQ250 húmedas. Durabilidad +400.000 km. El coche más demandado y rápido de vender en Galicia.",
    test: (t, y) => has(t, "ea288") || (has(t, "2.0 tdi", "2.0tdi", "35 tdi", "tdi 150") && has(t, "volkswagen", "vw", "audi", "seat", "cupra", "skoda", "golf", "tiguan", "leon", "ateca", "octavia", "kodiaq", "caddy", "sharan", "alhambra", "formentor", "passat", "a3", "a4", "q3", "q5") && (!y || y >= 2015)),
  },
  {
    level: "gold",
    title: "MOTOR ROCA BMW: B47 2.0d + ZF 8HP",
    note: "Distribución rediseñada respecto al N47 y caja automática ZF 8HP de convertidor de par. Fiabilidad de referencia en su categoría.",
    test: (t, y) => has(t, "b47") || (has(t, "bmw") && has(t, "118d", "120d", "318d", "320d", "218d", "18d", "20d", "2.0d") && y && y >= 2016),
  },
  {
    level: "gold",
    title: "JOYA COREANA: 1.6 CRDi Smartstream U3 48V",
    note: "Cadena robusta, 5,1 l/100 km, Etiqueta ECO (0 % IEDMT) y equipamiento N-Line / GT-Line. Margen neto muy alto en A Coruña.",
    test: (t) => has(t, "1.6 crdi", "1.6crdi", "crdi 136", "crdi 115", "crdi 48v", "smartstream") && has(t, "tucson", "sportage", "ceed", "i30", "kona", "hyundai", "kia"),
  },
  {
    level: "gold",
    title: "TITÁN COREANO: 2.2 CRDi bloque 'R'",
    note: "Bloque de fundición indestructible (200 CV / 440 Nm) con doble cadena. 7 plazas reales y 4x4. Muy cotizado por familias y rural gallego.",
    test: (t) => has(t, "2.2 crdi", "2.2crdi", "crdi 200") && has(t, "santa fe", "santafe", "sorento", "hyundai", "kia"),
  },
  {
    level: "gold",
    title: "MOTOR INDESTRUCTIBLE: Toyota / Lexus Hybrid HSD",
    note: "Ciclo Atkinson con cadena, sin turbo, sin embrague, sin alternador. e-CVT planetaria sin desgaste. Etiqueta ECO: 0 % IEDMT y bonificación IVTM.",
    test: (t) => (has(t, "toyota", "lexus") && has(t, "hybrid", "hibrido", "híbrido", "hsd", "125h", "140h", "180h", "220h", "200h", "120h", "115h")) || has(t, "corolla hybrid", "c-hr", "chr hybrid", "rav4 hybrid", "yaris hybrid", "prius", "auris hybrid"),
  },
  {
    level: "gold",
    title: "MOTOR PREMIUM: Mercedes OM654 2.0d",
    note: "Bloque de aluminio con recubrimiento NANOSLIDE, pistones de acero, silencioso y de bajo consumo. Cajas 8G-DCT húmeda o 9G-Tronic.",
    test: (t, y) => has(t, "om654") || (has(t, "mercedes") && has(t, "200 d", "200d", "220 d", "220d", "a200d", "cla 200 d", "glc 220 d", "c 220 d") && y && y >= 2018),
  },
  {
    level: "gold",
    title: "MOTOR JAPONÉS: Mazda Skyactiv-G 2.0 atmosférico",
    note: "Cadena, sin turbo ni FAP. Fiabilidad extrema de la vieja escuela. Versiones M-Hybrid 2019+ con Etiqueta ECO.",
    test: (t) => has(t, "skyactiv-g", "skyactiv g", "skyactivg") || (has(t, "mazda") && has(t, "2.0 g", "2.0g", "165 cv", "122 cv") && !has(t, "skyactiv-d", "diesel", "diésel")),
  },
  {
    level: "gold",
    title: "MOTOR ETERNO: Renault 1.5 dCi K9K (Gen 8)",
    note: "Diésel de referencia por sencillez y consumo (4,5 l/100 km). Cambiar correa cada 120.000 km / 6 años. Vigilar inyectores en unidades pre-2012.",
    test: (t, y) => has(t, "k9k", "1.5 dci", "1.5dci", "blue dci") && !has(t, "cvt", "x-tronic", "xtronic") && (!y || y >= 2013),
  },
  {
    level: "gold",
    title: "INDESTRUCTIBLE: Toyota 2.4 / 2.8 D-4D (2GD / 1GD)",
    note: "Motores de chasis de largueros con cadena. Depreciación nula o negativa en el rural gallego (Hilux, Land Cruiser).",
    test: (t) => has(t, "hilux", "land cruiser", "landcruiser", "2gd", "1gd") || (has(t, "toyota") && has(t, "2.4 d-4d", "2.8 d-4d", "2.4 d4d", "2.8 d4d")),
  },
];

export function detectEngineRisk({ vehicle, text, year }) {
  // 1) Ficha de base de datos: fuente de verdad
  if (vehicle && vehicle.reliability && vehicle.reliability !== "ok") {
    return {
      level: vehicle.reliability,
      title: vehicle.reliabilityTitle || "",
      note: vehicle.reliabilityNote || "",
      source: "db",
    };
  }
  if (vehicle && vehicle.reliability === "ok") {
    return { level: "ok", title: vehicle.reliabilityTitle || "Motor sin incidencias destacadas", note: vehicle.reliabilityNote || "", source: "db" };
  }

  // 2) Heurística por texto
  const t = " " + norm(text) + " ";
  const y = Number(year) || null;
  for (const rule of TEXT_RULES) {
    try {
      if (rule.test(t, y)) return { level: rule.level, title: rule.title, note: rule.note, source: "text" };
    } catch {
      /* ignore */
    }
  }
  return { level: null, title: "", note: "", source: "none" };
}

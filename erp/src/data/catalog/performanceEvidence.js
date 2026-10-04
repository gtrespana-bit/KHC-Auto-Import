// Evidencia observada en AutoScout24, Coches.net y fichas de vendedores el
// 04-10-2026 para variantes deportivas con identidad verificable. Las fichas
// son precios pedidos, no precios de cierre; anuncios duplicados entre portales
// o sucursales se deduplican.
const observedAt = '2026-10-04';

const profiles = {
  // Golf VII/7.5 — perfiles independientes por motor y acabado; los anuncios
  // 3/5 puertas se agrupan en carrocería hatchback, nunca con Variant.
  golf220: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VII GTI 220 DSG', engineCode: '20tsi220',
    variantKey: 'vw-golf-vii-gti-220-dsg', variantLabel: 'GTI 220 DSG', trim: 'GTI 220',
    body: 'Hatchback', years: [2016, 2017], co2: 148,
    transmission: 'DSG', fuel: 'Gasolina', cv: 220, engine: '2.0 TSI 220 CV GTI DSG',
  },
  golf230: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VII GTI Performance 230 DSG', engineCode: '20tsi230',
    variantKey: 'vw-golf-vii-gti-performance-230-dsg', variantLabel: 'GTI Performance 230 DSG', trim: 'GTI Performance',
    body: 'Hatchback', years: [2016, 2017], co2: 149,
    transmission: 'DSG', fuel: 'Gasolina', cv: 230, engine: '2.0 TSI 230 CV GTI Performance DSG',
  },
  golf245VII: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VII.5 GTI Performance 245 DSG', engineCode: '20tsi245',
    variantKey: 'vw-golf-vii5-gti-performance-245-dsg', variantLabel: 'GTI Performance 245 DSG', trim: 'GTI Performance',
    body: 'Hatchback', years: [2017, 2020], co2: 149,
    transmission: 'DSG', fuel: 'Gasolina', cv: 245, engine: '2.0 TSI 245 CV GTI Performance DSG',
  },
  golfClubsportVII: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VII GTI Clubsport 265 DSG', engineCode: '20tsi265',
    variantKey: 'vw-golf-vii-gti-clubsport-265-dsg', variantLabel: 'GTI Clubsport 265 DSG', trim: 'GTI Clubsport',
    body: 'Hatchback', years: [2016, 2017], co2: 155,
    transmission: 'DSG', fuel: 'Gasolina', cv: 265, engine: '2.0 TSI 265 CV GTI Clubsport DSG',
  },
  golfTCR: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VII.5 GTI TCR 290 DSG', engineCode: '20tsi290',
    variantKey: 'vw-golf-vii5-gti-tcr-290-dsg', variantLabel: 'GTI TCR 290 DSG', trim: 'GTI TCR',
    body: 'Hatchback', years: [2019, 2020], co2: 153,
    transmission: 'DSG', fuel: 'Gasolina', cv: 290, engine: '2.0 TSI 290 CV GTI TCR DSG',
  },
  golf245: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VIII', engineCode: '20tsi245',
    variantKey: 'vw-golf-viii-gti-245-dsg', variantLabel: 'GTI 245 DSG', trim: 'GTI',
    body: 'Hatchback 5 puertas', years: [2020, 2024], co2: 166,
    transmission: 'DSG', fuel: 'Gasolina', cv: 245, engine: '2.0 TSI 245 CV GTI DSG',
  },
  golf265: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VIII GTI facelift 265 DSG', engineCode: '20tsi265',
    variantKey: 'vw-golf-viii-gti-265-dsg', variantLabel: 'GTI facelift 265 DSG', trim: 'GTI',
    body: 'Hatchback 5 puertas', years: [2024, 2026], co2: 162,
    transmission: 'DSG', fuel: 'Gasolina', cv: 265, engine: '2.0 TSI 265 CV GTI facelift DSG',
  },
  clubsport: {
    brand: 'Volkswagen', model: 'Golf', gen: 'Golf VIII GTI Clubsport 300 DSG', engineCode: '20tsi300',
    variantKey: 'vw-golf-viii-gti-clubsport-300-dsg', variantLabel: 'GTI Clubsport 300 DSG', trim: 'GTI Clubsport',
    body: 'Hatchback 5 puertas', years: [2020, 2026], co2: 168,
    transmission: 'DSG', fuel: 'Gasolina', cv: 300, engine: '2.0 TSI 300 CV GTI Clubsport DSG',
  },
  focusST: {
    brand: 'Ford', model: 'Focus ST', gen: 'Focus IV ST 2.3 EcoBoost 280 manual', engineCode: 'fd23st280',
    variantKey: 'ford-focus-iv-st-280-manual', variantLabel: 'ST 280 manual', trim: 'ST',
    body: 'Hatchback 5 puertas', years: [2019, 2022], co2: 188,
    transmission: 'Manual', fuel: 'Gasolina', cv: 280, engine: '2.3 EcoBoost 280 CV Focus ST manual',
  },
  focusIII: {
    brand: 'Ford', model: 'Focus ST', gen: 'Focus III ST 2.0 EcoBoost 250 manual', engineCode: 'fd20st250',
    variantKey: 'ford-focus-iii-st-250-manual', variantLabel: 'ST 250 manual', trim: 'ST',
    body: 'Hatchback 5 puertas', years: [2016, 2018], co2: 159,
    transmission: 'Manual', fuel: 'Gasolina', cv: 250, engine: '2.0 EcoBoost 250 CV Focus ST manual',
  },
  civicFK2: {
    brand: 'Honda', model: 'Civic Type R', gen: 'Civic Type R FK2 310 manual', engineCode: 'hn20vtec310',
    variantKey: 'honda-civic-type-r-fk2-310-manual', variantLabel: 'Type R FK2 310 manual', trim: 'Type R GT',
    body: 'Hatchback 5 puertas', years: [2016, 2017], co2: 170,
    transmission: 'Manual', fuel: 'Gasolina', cv: 310, engine: '2.0 VTEC Turbo 310 CV Type R GT manual',
  },
  civicFK8: {
    brand: 'Honda', model: 'Civic Type R', gen: 'Civic Type R FK8 320 manual', engineCode: 'hn20vtec320',
    variantKey: 'honda-civic-type-r-fk8-320-manual', variantLabel: 'Type R FK8 320 manual', trim: 'Type R GT',
    body: 'Hatchback 5 puertas', years: [2017, 2021], co2: 177,
    transmission: 'Manual', fuel: 'Gasolina', cv: 320, engine: '2.0 VTEC Turbo 320 CV Type R GT manual',
  },
  civicFL5: {
    brand: 'Honda', model: 'Civic Type R', gen: 'Civic Type R FL5 329 manual', engineCode: 'hn20vtec329',
    variantKey: 'honda-civic-type-r-fl5-329-manual', variantLabel: 'Type R FL5 329 manual', trim: 'Type R',
    body: 'Hatchback 5 puertas', years: [2023, 2026], co2: 186,
    transmission: 'Manual', fuel: 'Gasolina', cv: 329, engine: '2.0 VTEC Turbo 329 CV Type R manual',
  },
};

function ad(profile, market, listingId, year, km, price, url, extra = {}) {
  return {
    ...profile,
    market,
    kind: 'anuncio',
    listingId,
    year,
    km,
    price,
    source: extra.source || `AutoScout24.${market.toLowerCase()}`,
    ...(extra.seller ? { seller: extra.seller } : {}),
    url,
    observedAt,
    evidenceType: extra.evidenceType || 'listing-card',
    eligible: extra.eligible !== false,
    ...(extra.note ? { note: extra.note } : {}),
    ...(extra.eligibilityReason ? { eligibilityReason: extra.eligibilityReason } : {}),
  };
}

const DE_GOLF_16 = 'https://www.autoscout24.de/lst/volkswagen/golf/va_gti/re_2016/tr_automatik';
const ES_GOLF_16 = 'https://www.autoscout24.es/lst/volkswagen/golf-gti/re_2016/tr_automatico';
const DE_GOLF_17 = 'https://www.autoscout24.de/lst/volkswagen/golf/va_gti/re_2017/tr_automatik';
const ES_GOLF_17 = 'https://www.autoscout24.es/lst/volkswagen/golf-gti/re_2017/tr_automatico';
const DE_GOLF_TCR_19 = 'https://www.autoscout24.de/lst/volkswagen/golf/va_gti/ve_tcr/re_2019?gear=A';
const ES_GOLF_19 = 'https://www.autoscout24.es/lst/volkswagen/golf-gti/re_2019/tr_automatico';
const DE_FOCUS_16 = 'https://www.autoscout24.de/lst/ford/focus/ve_st-2.0/re_2016';
const ES_FOCUS_16 = 'https://www.autoscout24.es/lst/ford/focus/ve_st-2.0/re_2016';
const DE_GOLF_23 = 'https://www.autoscout24.de/lst/volkswagen/golf/va_gti/ve_8/re_2023?gear=A';
const DE_GOLF_24 = 'https://www.autoscout24.de/lst/volkswagen/golf/va_gti/ve_8/re_2024?gear=A';
const ES_GOLF_23 = 'https://www.autoscout24.es/lst/volkswagen/golf-gti/re_2023/tr_automatico';
const ES_GOLF_24 = 'https://www.autoscout24.es/lst/volkswagen/golf-gti/re_2024/tr_automatico';
const DE_FOCUS_19 = 'https://www.autoscout24.de/lst/ford/focus/va_focus-st/re_2019/tr_schaltgetriebe';
const DE_FOCUS_20 = 'https://www.autoscout24.de/lst/ford/focus/va_focus-st/re_2020/tr_schaltgetriebe';
const ES_FOCUS_20 = 'https://www.autoscout24.es/lst/ford/focus/ve_st-3/re_2020/tr_manual';
const ES_FOCUS_21 = 'https://www.autoscout24.es/lst/ford/focus/ve_st-3/re_2021/tr_manual';
const DE_FK2_16 = 'https://www.autoscout24.de/lst/honda/civic/ve_type-r-gt/re_2016/tr_schaltgetriebe';
const ES_FK2_16 = 'https://www.autoscout24.es/lst/honda/civic/ve_type-r-gt/re_2016/tr_manual';
const DE_FK8_18 = 'https://www.autoscout24.de/lst/honda/civic/ve_type-r-gt/re_2018/tr_schaltgetriebe';
const ES_FK8_17 = 'https://www.autoscout24.es/lst/honda/civic/ve_type-r-gt/re_2017/tr_manual';
const ES_FK8_18 = 'https://www.autoscout24.es/lst/honda/civic/ve_type-r-gt/re_2018/tr_manual';
const ES_FK8_20 = 'https://www.autoscout24.es/lst/honda/civic/ve_type-r-gt/re_2020/tr_manual';
const ES_FL5_24 = 'https://www.autoscout24.es/lst/honda/civic/ve_type-r/re_2024/tr_manual';
const DE_FL5_25 = 'https://www.autoscout24.de/lst/honda/civic/ve_type-r/re_2025/tr_schaltgetriebe';

export const PERFORMANCE_MARKET_OBSERVATIONS = [
  // Golf VII GTI 220 CV DSG (2016–2017). En España solo apareció una tarjeta
  // particular; se conserva excluida para no convertirla en PVP profesional.
  ad(profiles.golf220, 'DE', 'ee442ea6-b4ef-4392-9133-fc60edd1db8c', 2016, 172000, 13490, DE_GOLF_16,
    { source: 'AutoScout24.de · Car Point Bremen (profesional)' }),
  ad(profiles.golf220, 'DE', '66afb43a-324c-4d50-a28e-e18340b4adaa', 2016, 200921, 11400, DE_GOLF_16,
    { source: 'AutoScout24.de · Trinufa (profesional)' }),
  ad(profiles.golf220, 'DE', '5bcf41bd-77ed-4847-8b11-02a639dc964b', 2016, 192921, 11270, DE_GOLF_16,
    { source: 'AutoScout24.de · Wisura Motors (profesional)' }),
  ad(profiles.golf220, 'DE', '38aab030-5159-4ec4-ac9d-9d03988f8b49', 2016, 52688, 17980, DE_GOLF_16,
    { source: 'AutoScout24.de · Autohaus Stegelmann (profesional)' }),
  ad(profiles.golf220, 'DE', '70e96489-5b26-46ed-b987-ecfc0cac9b37', 2016, 101098, 15750, DE_GOLF_16,
    { source: 'AutoScout24.de · vendedor particular DE' }),
  ad(profiles.golf220, 'DE', '1d261ea7-d47a-450b-8d8f-6b05102ce597', 2016, 242000, 10800, DE_GOLF_16,
    { source: 'AutoScout24.de · deinautowelt.de (profesional)' }),
  ad(profiles.golf220, 'ES', '26d22bd5-2cf2-4c26-8be6-ed189410be9c', 2016, 134000, 20900, ES_GOLF_16,
    { eligible: false, source: 'AutoScout24.es · Particular', note: 'Vendedor particular; excluido de PVP profesional.', eligibilityReason: 'Anuncio español de vendedor particular.' }),

  // Golf VII GTI Performance 230 CV DSG. Acabado y transmisión identificados;
  // la potencia 230 CV sin “Performance” no se mezcla con esta variante.
  ad(profiles.golf230, 'DE', 'c53e0599-0650-4e4a-b5ae-a45faa9263e6', 2016, 136001, 16900, DE_GOLF_16,
    { source: 'AutoScout24.de · Particular (coste de compra válido)' }),
  ad(profiles.golf230, 'DE', '3373f2ec-5fb8-4b7f-b90d-7a01003f05ec', 2016, 83200, 19990, DE_GOLF_16,
    { source: 'AutoScout24.de · Particular (coste de compra válido)' }),
  ad(profiles.golf230, 'DE', '10a368a3-c7f0-4d98-8fc1-6ec843114cb4', 2016, 40000, 18980, DE_GOLF_16,
    { source: 'AutoScout24.de · AHM Autogroup (profesional)' }),
  ad(profiles.golf230, 'DE', '83a01749-5a99-4ec4-b330-e862c68fa88e', 2016, 118000, 15990, DE_GOLF_16,
    { source: 'AutoScout24.de · SR Automobile (profesional)' }),
  ad(profiles.golf230, 'DE', 'b4fba976-08d0-477e-a065-1926f4e526ef', 2017, 111046, 16950, DE_GOLF_17,
    { source: 'AutoScout24.de · Monheim-Car (profesional)' }),
  ad(profiles.golf230, 'ES', 'e7d54889-0789-4ea5-b4cf-0925e3a8e521', 2016, 163500, 18900, ES_GOLF_16,
    { source: 'AutoScout24.es · Madrid Ocasión VO (profesional)' }),
  ad(profiles.golf230, 'ES', 'es-golf-perf230-2016-accimoviles-97860', 2016, 97860, 21900, ES_GOLF_16,
    { source: 'AutoScout24.es · Accimóviles (profesional)' }),
  ad(profiles.golf230, 'ES', 'es-golf-perf230-2016-tevendemos-63000', 2016, 63000, 25999, ES_GOLF_16,
    { source: 'AutoScout24.es · Te Vendemos el Coche (profesional)' }),
  ad(profiles.golf230, 'ES', '91026d19-ca17-4edb-932b-d4a7442fb59b', 2017, 136788, 21970, ES_GOLF_17,
    { source: 'AutoScout24.es · Flexicar Madrid', note: 'La misma unidad se repetía en Málaga; contada una sola vez.' }),

  // Golf VII.5 GTI Performance 245 CV DSG (2017–2020), separado del 230 CV.
  ad(profiles.golf245VII, 'DE', '2eb7bbbe-ad67-4558-9c0e-44ff6ce5f91e', 2017, 108275, 19890, DE_GOLF_17,
    { source: 'AutoScout24.de · Car4you (profesional)' }),
  ad(profiles.golf245VII, 'DE', '4829274d-1040-4594-8c87-0b3d51b7d909', 2017, 117000, 16490, DE_GOLF_17,
    { source: 'AutoScout24.de · Dem Automobile (profesional)' }),
  ad(profiles.golf245VII, 'DE', 'a6ae3f71-810e-41f4-8b13-87ae34c0987b', 2017, 98900, 19500, DE_GOLF_17,
    { source: 'AutoScout24.de · Particular (coste de compra válido)' }),
  ad(profiles.golf245VII, 'DE', 'bb49fda7-f8d2-4c4c-b0a7-4f922bdbd603', 2017, 115000, 18999, DE_GOLF_17,
    { source: 'AutoScout24.de · Particular (coste de compra válido)' }),
  ad(profiles.golf245VII, 'ES', 'ea89b71e-975e-42fe-aa1e-1ff809ccc614', 2017, 120000, 22900, ES_GOLF_17,
    { source: 'AutoScout24.es · Premium Cars Valldaura (profesional)' }),
  ad(profiles.golf245VII, 'ES', 'a59ed918-1db6-434a-75f5-17f2e1f29d17', 2017, 109900, 22900, ES_GOLF_17,
    { source: 'AutoScout24.es · Next Drive (profesional)' }),
  ad(profiles.golf245VII, 'ES', '055f7826-41e2-45ca-83e0-1d2f0fcdb299', 2017, 123164, 24990, ES_GOLF_17,
    { source: 'AutoScout24.es · AJ Racing Cars Box (profesional)' }),
  ad(profiles.golf245VII, 'ES', 'c4e64673-5bd2-4ae6-a6fc-3928e489dc3b', 2017, 120919, 23490, ES_GOLF_17,
    { source: 'AutoScout24.es · Flexicar Alicante', note: 'Contada una sola sucursal de la unidad publicada por Flexicar.' }),
  ad(profiles.golf245VII, 'ES', '15cd2985-5f09-4dad-a1d2-421b04cf5eb0', 2019, 225822, 21890, ES_GOLF_19,
    { source: 'AutoScout24.es · OcasiónPlus Las Rozas (profesional)' }),
  ad(profiles.golf245VII, 'ES', '121a4149-c414-4096-bf22-1df653ae756e', 2019, 129860, 22999, ES_GOLF_19,
    { source: 'AutoScout24.es · BR Motors (profesional)' }),
  ad(profiles.golf245VII, 'ES', '350f8df0-4d65-491d-adda-c20442bddc8f', 2019, 104428, 22991, ES_GOLF_19,
    { source: 'AutoScout24.es · OcasiónPlus Jaén (profesional)' }),
  ad(profiles.golf245VII, 'ES', '7123ec6a-8f2f-4658-8e17-c93e4cfce644', 2019, 92000, 22590, ES_GOLF_19,
    { source: 'AutoScout24.es · Flexicar Valencia (profesional)' }),

  // Golf VII GTI Clubsport 265 DSG; las fichas particulares/modificadas quedan
  // trazadas pero no entran en la referencia profesional.
  ad(profiles.golfClubsportVII, 'DE', '07276965-c21b-4048-91c0-a7ec6d132abb', 2016, 68000, 24780, DE_GOLF_16,
    { source: 'AutoScout24.de · Paolino Automobile (profesional)' }),
  ad(profiles.golfClubsportVII, 'DE', 'dfbd432c-169d-435d-82cd-dd54ceeee54c', 2017, 112900, 22420, DE_GOLF_17,
    { source: 'AutoScout24.de · Autohaus Vollmer (profesional)' }),
  ad(profiles.golfClubsportVII, 'DE', '8eccde2a-d601-4db3-96dd-cd81aa59a5e7', 2017, 169000, 16990, DE_GOLF_17,
    { source: 'AutoScout24.de · Auto Baumer (profesional)' }),
  ad(profiles.golfClubsportVII, 'ES', '7b8cb003-67bf-4c61-b124-a014496f7d79', 2016, 99999, 25900, ES_GOLF_16,
    { source: 'AutoScout24.es · Box Sport BCN (profesional)' }),
  ad(profiles.golfClubsportVII, 'ES', '17547841-e0bb-431f-878c-fbef8cdddc85', 2016, 99000, 30600, ES_GOLF_16,
    { source: 'AutoScout24.es · Segalà (profesional)' }),
  ad(profiles.golfClubsportVII, 'ES', 'a798db7c-a82b-4e48-b8b5-054968f14d17', 2017, 129000, 28790, ES_GOLF_17,
    { source: 'AutoScout24.es · Auto DMD Care (profesional)' }),
  ad(profiles.golfClubsportVII, 'DE', 'fee88af2-e47d-4bc1-ac32-389e92748b32', 2016, 92000, 23999, DE_GOLF_16,
    { eligible: false, source: 'AutoScout24.de · vendedor profesional', eligibilityReason: 'Modificado con suspensión KW V2 y piezas de competición; no comparable con Clubsport de serie.' }),
  ad(profiles.golfClubsportVII, 'ES', '94bc2a05-b772-4cda-a60b-6b6321437f63', 2016, 130000, 24500, ES_GOLF_16,
    { eligible: false, source: 'AutoScout24.es · Particular', eligibilityReason: 'Anuncio español de vendedor particular.' }),
  ad(profiles.golfClubsportVII, 'ES', '88c9ee29-798c-4f60-a609-ac87ce88e00a', 2016, 170000, 15000, ES_GOLF_16,
    { eligible: false, source: 'AutoScout24.es · Particular', eligibilityReason: 'Anuncio español de vendedor particular.' }),

  // Golf VII.5 GTI TCR 290 DSG: muestra abundante y acabado expresamente TCR;
  // no se mezcla con Performance 245 ni con Clubsport.
  ad(profiles.golfTCR, 'DE', '591f922b-c663-4030-9180-0e1d05820be8', 2019, 38359, 26840, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Autohaus Steinböhmer (profesional)' }),
  ad(profiles.golfTCR, 'DE', '74ec4d95-5b4a-41bf-b334-de39eff99be5', 2019, 87689, 23720, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Autohero (profesional)' }),
  ad(profiles.golfTCR, 'DE', '6bb1c9fe-77ea-4ca2-968a-e9ec506d57aa', 2019, 69446, 26220, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Autohero (profesional)', note: 'Stock distinto del otro Autohero: precio, km e ID propios; sucursales repetidas deduplicadas.' }),
  ad(profiles.golfTCR, 'DE', '9612eaf2-e19e-459e-936b-8ed5a625e244', 2019, 111016, 22450, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Auto Mager (profesional)' }),
  ad(profiles.golfTCR, 'DE', '49376883-6b9d-4b36-b1bf-dc6468387603', 2019, 100000, 24990, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · MS Automobile (profesional)' }),
  ad(profiles.golfTCR, 'DE', '2f2bb63b-ce96-476f-8cc0-b126204e6d36', 2019, 104460, 24880, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Automobile Werner (profesional)' }),
  ad(profiles.golfTCR, 'DE', 'dece8eb0-0437-4a06-b5fd-7013daad910b', 2019, 144977, 22500, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Automobile Henrich (profesional)' }),
  ad(profiles.golfTCR, 'DE', 'dfaae4a1-09e5-45b5-8595-62f3e72753b4', 2019, 80851, 26790, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Autohaus Voigt (profesional)', note: 'Precio anunciado tras reducción desde 27.990 €.' }),
  ad(profiles.golfTCR, 'DE', '599034ca-a2bd-48c7-a865-41cb52a68ffd', 2019, 94000, 19999, DE_GOLF_TCR_19,
    { source: 'AutoScout24.de · Particular (coste de compra válido)' }),
  ad(profiles.golfTCR, 'ES', '9643e42c-d120-426f-b115-e158c265dc66', 2019, 97800, 29900, ES_GOLF_19,
    { source: 'AutoScout24.es · Luxauto (profesional)' }),
  ad(profiles.golfTCR, 'ES', 'f58c8252-64b0-46db-8325-6d87d8ae2520', 2019, 118500, 27800, ES_GOLF_19,
    { source: 'AutoScout24.es · Antumotors (profesional)' }),
  ad(profiles.golfTCR, 'ES', 'f801f2a7-d51e-4088-b040-90ecc6b53c5f', 2019, 70000, 32990, ES_GOLF_19,
    { source: 'AutoScout24.es · LCOCHES (profesional)' }),
  ad(profiles.golfTCR, 'ES', '09197fb4-b227-4fca-9d27-ccc310999c12', 2019, 110000, 28990, ES_GOLF_19,
    { source: 'AutoScout24.es · Autosman (profesional)' }),
  ad(profiles.golfTCR, 'ES', 'f0f94ecf-bcb6-4d58-901c-a52dad0fa2e4', 2019, 70000, 28490, ES_GOLF_19,
    { source: 'AutoScout24.es · AC Group (profesional)' }),
  ad(profiles.golfTCR, 'ES', 'a44a1a07-8575-4438-b9c0-d454cfd297db', 2019, 100605, 26990, ES_GOLF_19,
    { source: 'AutoScout24.es · HR Motor Vila-real (profesional)' }),
  ad(profiles.golfTCR, 'ES', '0e02ef43-a1f2-4cce-9014-85663b2c0aec', 2019, 46000, 33990, ES_GOLF_19,
    { source: 'AutoScout24.es · LCOCHES (profesional)' }),
  ad(profiles.golfTCR, 'ES', 'fb5bfc7c-f4c4-4cd2-8a86-8d1429b8ff69', 2019, 116500, 28400, ES_GOLF_19,
    { eligible: false, source: 'AutoScout24.es · Particular', eligibilityReason: 'Anuncio español de vendedor particular.' }),

  // Ford Focus ST Mk3 2.0 EcoBoost 250 CV manual. No se incluyen los diésel
  // 185 CV, ST-Line ni carrocerías Turnier; Autohero se deduplica por stock.
  ad(profiles.focusIII, 'DE', 'e7da4cdc-ae4e-4157-aef0-94919dd2e401', 2016, 98075, 14990, DE_FOCUS_16,
    { source: 'AutoScout24.de · Auto-Tischler (profesional)', note: '2.0 EcoBoost gasolina 250 CV; hatchback, cambio manual.' }),
  ad(profiles.focusIII, 'DE', 'ad2b32db-4f2e-433b-b5c9-8ac8c38fea34', 2016, 105180, 13790, DE_FOCUS_16,
    { source: 'AutoScout24.de · Autohero (profesional)', note: 'Mismo stock repetido en Essen, Köln y Stuttgart; contado una vez. Hatchback manual.' }),
  ad(profiles.focusIII, 'DE', 'ca84beb9-4ede-4513-a05c-62864c93d586', 2016, 79000, 15750, DE_FOCUS_16,
    { source: 'AutoScout24.de · Particular (coste de compra válido)' }),
  ad(profiles.focusIII, 'DE', '58c4cb4e-2658-409d-955e-af9aed41b09f', 2016, 135700, 14500, DE_FOCUS_16,
    { source: 'AutoScout24.de · Particular (coste de compra válido)' }),
  ad(profiles.focusIII, 'ES', '42f3ed30-2472-44e0-8552-13fc5cbadcbb', 2016, 199000, 12900, ES_FOCUS_16,
    { source: 'AutoScout24.es · Automóviles Roma 2000 (profesional)', note: '2.0 EcoBoost 250 CV, ST de gasolina; no es ST-Line.' }),
  ad(profiles.focusIII, 'ES', 'b54cf998-0198-41ee-956c-e2e31d4701a3', 2016, 80000, 19990, ES_FOCUS_16,
    { source: 'AutoScout24.es · Flexicar Alicante (profesional)', note: 'La misma unidad aparece en varias sucursales; se cuenta una vez.' }),
  ad(profiles.focusIII, 'ES', 'deb7dd5b-51e2-479a-a5ba-97361eb0b4d1', 2016, 120000, 18900, ES_FOCUS_16,
    { source: 'AutoScout24.es · Automóviles Martín (profesional)' }),

  // Golf VIII GTI 245 CV DSG — mantiene separado el GTI normal.
  ad(profiles.golf245, 'DE', '2e5329fb-42ac-466d-bfe5-34f319fa7863', 2023, 13253, 26480,
    'https://www.autoscout24.de/angebote/volkswagen-golf-viii-2-0-tsi-gti-dsg-kamera-acc-navi-led-benzin-grau-cat_ma74gr100101ge8va178mt441tr480888-2e5329fb-42ac-466d-bfe5-34f319fa7863', { evidenceType: 'direct-detail' }),
  ad(profiles.golf245, 'DE', '9e9dcc0b-cb49-48f0-a9b6-b15da39889d1', 2023, 54110, 22980, DE_GOLF_23),
  ad(profiles.golf245, 'DE', 'fb3193e3-7848-45cb-a01d-a048ed56a998', 2023, 43915, 26450, DE_GOLF_23),
  ad(profiles.golf245, 'DE', '0a5ef7b9-1f53-4b51-90bd-1a6a295fd603', 2023, 28230, 28450, DE_GOLF_23),
  ad(profiles.golf245, 'DE', '366d4303-8250-4aac-a260-df776b715615', 2023, 23936, 27950, DE_GOLF_23),
  ad(profiles.golf245, 'DE', 'ad67c070-ba97-4812-b55d-d0b5eb974ca0', 2024, 10300, 29600, DE_GOLF_24),
  ad(profiles.golf245, 'DE', 'd81fc5e9-c1a7-49ac-b394-b099be37db6a', 2024, 32120, 25950, DE_GOLF_24),
  ad(profiles.golf245, 'DE', '627d69b7-cb48-4c19-9c29-5e87a87e771c', 2024, 21900, 25490, DE_GOLF_24),
  ad(profiles.golf245, 'DE', '7cdc928a-1957-4426-aeb6-cc7b83a8574b', 2024, 24541, 26350, DE_GOLF_24),
  ad(profiles.golf245, 'ES', 'dad838e3-107a-4664-bf0d-73da2732dac6', 2023, 22000, 32999, ES_GOLF_23),
  ad(profiles.golf245, 'ES', 'fa68f2c2-6fd8-48af-97bf-de77e1eced74', 2023, 80000, 29900, ES_GOLF_23),
  ad(profiles.golf245, 'ES', '57a7d8bf-d6db-43c0-8998-9afd7a87117a', 2023, 37006, 30890, ES_GOLF_23),
  ad(profiles.golf245, 'ES', 'e1bd52a0-593e-4c9a-afa7-482dcc9c248a', 2023, 18000, 30999, ES_GOLF_23),
  ad(profiles.golf245, 'ES', '8b4bf495-6966-4c9d-b5c6-d4cebdf16f13', 2023, 49826, 32900, ES_GOLF_23),
  ad(profiles.golf245, 'ES', '5c4910f3-2093-483a-b6f2-9b617d4d8f21', 2024, 17800, 33500, ES_GOLF_24),
  ad(profiles.golf245, 'ES', 'e79069b0-3e3b-4a58-811b-7982262094b8', 2024, 30000, 32900, ES_GOLF_24),
  ad(profiles.golf245, 'ES', 'c8af886c-5674-46ff-b0d5-4c96162ef58d', 2024, 25579, 32980, ES_GOLF_24),
  ad(profiles.golf245, 'ES', '307a7db5-4196-4071-a4c3-b946a93ca88b', 2024, 18000, 32500, ES_GOLF_24),
  ad(profiles.golf245, 'ES', '6ffed350-31eb-4e27-81d4-e5f65876075c', 2024, 23314, 32999, ES_GOLF_24),
  ad(profiles.golf245, 'ES', '3aae90d3-2065-4879-b6f2-e3144f1c7a54', 2024, 18450, 33990, ES_GOLF_24),

  // Golf VIII facelift GTI 265 CV DSG — no se mezcla con los 245 CV pre-facelift.
  ad(profiles.golf265, 'DE', 'a5a48700-4e6f-40fb-a93f-c903c24851b6', 2024, 26080, 27450,
    'https://www.autoscout24.de/angebote/volkswagen-golf-8-2-0-tsi-dsg-facelift-acc-17-kamera-dab-benzin-grau-cat_ma74gr100101ge8va178mt441tr480888-a5a48700-4e6f-40fb-a93f-c903c24851b6', { evidenceType: 'direct-detail' }),
  ad(profiles.golf265, 'ES', '532c5468-cbeb-4c80-a218-566a7ccdf3e1', 2024, 18800, 42500, ES_GOLF_24,
    { note: 'Ficha AutoScout24: 195 kW / 265 CV, GTI normal; no es Clubsport.' }),

  // Golf VIII GTI Clubsport 300 CV DSG — variante propia, no GTI 245/265.
  ad(profiles.clubsport, 'DE', '07acdde2-5d8a-45f3-834a-206eb3ea440c', 2023, 39650, 28910,
    'https://www.autoscout24.de/angebote/volkswagen-golf-8-clubsport-2-0-tsi-dsg-harman-navi-shz-acc-benzin-grau-cat_ma74gr100101ge8va178mt441tr558-07acdde2-5d8a-45f3-834a-206eb3ea440c', { evidenceType: 'direct-detail' }),
  ad(profiles.clubsport, 'DE', 'cf894a97-8b3e-42da-96eb-9cbfe17d6d7d', 2023, 34780, 28450, DE_GOLF_23),
  ad(profiles.clubsport, 'DE', '8ac05b9a-9c86-4b2b-a003-6de856c0d4e3', 2023, 48124, 30470, DE_GOLF_23),
  ad(profiles.clubsport, 'DE', '6f6f55e5-b59b-46fe-a9df-046a8b04dde9', 2024, 24848, 33690, DE_GOLF_24),
  ad(profiles.clubsport, 'DE', '3a07f2e8-6078-4d44-9570-defbe4e78d26', 2024, 40407, 29409, DE_GOLF_24),
  ad(profiles.clubsport, 'DE', 'f0d49d40-959b-43bf-bffb-6c9700d69ee5', 2024, 24249, 34850, DE_GOLF_24),
  ad(profiles.clubsport, 'DE', '67a90107-80a0-4521-9f93-32ecf7ee01fd', 2024, 27400, 30980, DE_GOLF_24),
  ad(profiles.clubsport, 'DE', 'f67d41ba-a951-475a-8c74-1cada9568743', 2024, 34420, 30950, DE_GOLF_24),
  ad(profiles.clubsport, 'DE', '7e7f8a7f-eddf-49a8-858d-5819fb61ca80', 2024, 30520, 29950, DE_GOLF_24),
  ad(profiles.clubsport, 'DE', '711924c0-79e3-46ea-9584-a99a4bdce1e6', 2024, 24504, 38450, DE_GOLF_24),
  ad(profiles.clubsport, 'ES', 'f6ee0051-375a-4397-b694-6d9c4da14e18', 2023, 37557, 39990, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', 'f10a6954-5a39-4a56-a15f-660a38617654', 2023, 31708, 34990, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', '018fa553-e311-4944-9aed-3449f2998470', 2023, 21700, 36499, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', '1f7d2cf5-c056-4b59-be8e-2cb2ed952365', 2023, 26560, 35900, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', '1f8629e7-5bd3-4127-b12c-5cdf1d15a1ca', 2023, 30000, 36000, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', '5bccd87e-fba6-4d0f-a1f1-4e1468033868', 2023, 56000, 35900, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', 'b5d4368a-b9d2-479c-a149-bbfe44bcdcc1', 2023, 46000, 33900, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', '4130430f-7751-4f03-a4ab-d086a35c547e', 2023, 33400, 36900, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', '0c12909d-771d-43cc-925e-d8cf17481a64', 2023, 42790, 36500, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', '24714c16-9c83-4a87-ad19-80953793f258', 2023, 16387, 39000, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', 'c73b64f6-3cc9-4915-811d-96556327cebf', 2023, 24300, 37490, ES_GOLF_23),
  ad(profiles.clubsport, 'ES', 'd560dd4b-0e4d-4a1b-bae2-a2da820cbffa', 2024, 16803, 37990, ES_GOLF_24),
  ad(profiles.clubsport, 'ES', '8c78b849-5a40-4c19-a189-02035c373378', 2024, 26000, 39000, ES_GOLF_24),
  ad(profiles.clubsport, 'ES', 'f86e4a7e-9e1e-403b-a6f8-778b0f5e63f2', 2024, 18500, 38900, ES_GOLF_24),
  ad(profiles.clubsport, 'ES', 'ac1ff87e-b297-4135-b740-f4ef596124f8', 2024, 42000, 37500, ES_GOLF_24),
  ad(profiles.clubsport, 'ES', 'c5d395f5-a5a2-4166-bf77-6e30e5364fc5', 2024, 25000, 39990, ES_GOLF_24),

  // Focus ST 2.3 EcoBoost 280 manual. ST-Line, Sportbreak y ST X no se mezclan.
  ad(profiles.focusST, 'DE', 'c9b52419-801d-4c42-8d13-52271ca3563f', 2019, 79100, 21390, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', 'f219d293-f33a-420a-9839-d457c296293f', 2019, 50500, 19500, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', 'b895043a-aa71-4338-8b5e-a9ac409d7c21', 2019, 78330, 20950, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', 'ae7f9c75-6311-4c69-809f-74ee2b17f77c', 2019, 73500, 19890, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', 'afa9e9f8-7525-411d-a161-d151d768418f', 2019, 81000, 20400, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', '1d7f1a21-1cbf-447c-90b7-a2acb1bb02db', 2019, 75000, 20590, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', 'abb5350e-11a6-4a88-95ab-b8409ba4268a', 2019, 84948, 18810, DE_FOCUS_19,
    { note: 'Autohero repetía el mismo stock en varias sucursales; solo se cuenta una tarjeta.' }),
  ad(profiles.focusST, 'DE', '5115c690-7420-4e2a-8c16-7b26554856b8', 2019, 56632, 23950, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', 'ff0f8ee9-fe63-47e8-aef5-30e84dcc4253', 2019, 95900, 18900, DE_FOCUS_19),
  ad(profiles.focusST, 'DE', '4168bc6f-1538-4792-aec8-a68de360f6b3', 2020, 39987, 24990,
    'https://www.autoscout24.de/angebote/ford-focus-2-3-ecoboost-st-led-navi-alcantara-acc-dab-benzin-blau-cat_ma29gr15537ge274va260mt12333tr7369-4168bc6f-1538-4792-aec8-a68de360f6b3', { evidenceType: 'direct-detail' }),
  ad(profiles.focusST, 'DE', 'c9d88d57-9147-4859-9a90-8c9015a81cdc', 2020, 47508, 21990,
    'https://www.autoscout24.de/angebote/ford-focus-focus-lim-st-im-kundenauftrag-benzin-orange-cat_ma29gr15537ge274va260mt12333tr7369-c9d88d57-9147-4859-9a90-8c9015a81cdc', { evidenceType: 'direct-detail', note: 'Venta por encargo; ficha completa confirma 2.3/280 CV, manual y 5 puertas.' }),
  ad(profiles.focusST, 'DE', 'c90e3bb7-3ffb-45b4-9348-b26fb56e6978', 2020, 56331, 23450, DE_FOCUS_20),
  ad(profiles.focusST, 'DE', '64d295a1-6e29-4802-9857-080e4cc30b10', 2020, 76400, 21000, DE_FOCUS_20),
  ad(profiles.focusST, 'DE', 'ffa58df9-da8d-468b-a992-8beb39cfb35b', 2020, 69500, 21950, DE_FOCUS_20),
  ad(profiles.focusST, 'DE', 'afef1a24-7a83-4407-8c88-bd7620e6af4d', 2020, 28730, 23990, DE_FOCUS_20),
  ad(profiles.focusST, 'DE', '404cfa44-6b05-4fa3-aa9b-635f46035d8e', 2020, 83500, 19950, DE_FOCUS_20),
  ad(profiles.focusST, 'DE', '183e6043-598a-4b9d-b0c6-bc249e5dd581', 2020, 85850, 22980, DE_FOCUS_20),
  ad(profiles.focusST, 'DE', '84cc820c-f0cd-46c2-b7b5-8c34c5d54d44', 2020, 38431, 23490, DE_FOCUS_20),
  ad(profiles.focusST, 'ES', 'b9ca0103-c62e-48e1-99eb-111e310199af', 2020, 90000, 25700, ES_FOCUS_20,
    { eligible: false, source: 'AutoScout24.es · Particular', note: 'Particular; ficha de búsqueda filtrada a España, manual, 2.3 EcoBoost ST 3 y 280 CV.', eligibilityReason: 'Anuncio español de vendedor particular; excluir del PVP profesional.' }),
  ad(profiles.focusST, 'ES', '9265ced5-ce60-48f0-99b6-5c4edbf4a187', 2020, 157478, 24150, ES_FOCUS_20,
    { note: 'Se conserva una sola de las tarjetas CARHAY/CAR10 con el mismo año y km; precios divergentes, requiere confirmar que no sea stock duplicado.' }),
  ad(profiles.focusST, 'ES', '85b88e88-ab9e-421c-a37e-e47dc76d94de', 2021, 15781, 25908, ES_FOCUS_21),
  ad(profiles.focusST, 'ES', '1fefee46-b59c-4a97-9e73-a908a5f58b01', 2021, 61430, 28900, ES_FOCUS_21),
  ad(profiles.focusST, 'ES', '8c16da13-dc65-4525-a74a-b0291cf60944', 2021, 87499, 22290, ES_FOCUS_21,
    { note: 'Mismo coche Flexicar repetido en sucursales; se conserva una sola unidad.' }),

  // Focus: exclusiones deliberadas que documentan el filtro de calidad.
  ad(profiles.focusST, 'DE', '2ad1cf09-c2d8-41bf-996f-9b7bbfc8ba25', 2020, 84998, 20690, DE_FOCUS_20,
    { eligible: false, eligibilityReason: 'Anuncio identificado como taxi/comercial; no comparable con unidad particular de uso normal.' }),
  ad(profiles.focusST, 'DE', '9d664b99-f464-441a-886a-0085abf66246', 2020, 98000, 19980, DE_FOCUS_20,
    { eligible: false, eligibilityReason: 'Ficha de carrocería/puertas inconsistente; excluir hasta verificar la unidad.' }),
  ad(profiles.focusST, 'DE', '2d7e6276-f913-4944-8833-9a79c0878e0f', 2020, 70850, 19980, DE_FOCUS_20,
    { eligible: false, eligibilityReason: 'Ficha de carrocería/puertas inconsistente; excluir hasta verificar la unidad.' }),
  ad(profiles.focusST, 'DE', '47d7b5e5-6bfc-4637-ba59-e8165b1cee9b', 2020, 98500, 21870, DE_FOCUS_20,
    { eligible: false, eligibilityReason: 'Anuncio declara escape Milltek; modificación no comparable con variante de serie.' }),

  // Honda Civic Type R FK2, 310 CV manual — generación separada del FK8 y
  // limitada a 2016–2017 (2015 queda fuera de la ventana de antigüedad).
  ad(profiles.civicFK2, 'DE', '8ab46357-fbef-4db3-9d51-fd8be41c84ed', 2016, 94252, 23340,
    'https://www.autoscout24.de/angebote/honda-civic-2-0-vtec-type-r-gt-navi-tempo-cam-pdc-klima-benzin-grau-cat_ma31gr200622ge1978va2415mt12731tr4266-8ab46357-fbef-4db3-9d51-fd8be41c84ed', { evidenceType: 'direct-detail', source: 'AutoScout24.de · Autohero (profesional)' }),
  ad(profiles.civicFK2, 'DE', 'c654bc87-ebad-410a-8bd4-545ec503ab25', 2016, 54050, 26990, DE_FK2_16,
    { source: 'AutoScout24.de · Autohaus Armin Birk (profesional)' }),
  ad(profiles.civicFK2, 'DE', '986cc3db-726b-4eb0-bf27-ae2b442482a0', 2016, 96180, 25855, DE_FK2_16,
    { source: 'AutoScout24.de · Automobiltechnik Mäder (profesional)' }),
  ad(profiles.civicFK2, 'DE', '11aae308-28ea-407c-bdcd-cd33f9a11bc0', 2016, 26064, 29850, DE_FK2_16,
    { source: 'AutoScout24.de · Kfz-Handel Ingo Chmell (profesional)' }),
  ad(profiles.civicFK2, 'ES', 'car10-autocasion-fk2gt-2016-102205', 2016, 102205, 28490,
    'https://www.autocasion.com/coches-segunda-mano/honda-ocasion/toledo',
    { source: 'Autocasión.com · CAR10 Toledo (profesional; precio al contado)', note: 'Ficha del vendedor confirma FK2 Type R GT, 2016, 310 CV, gasolina, manual, 5 puertas y 102.205 km. Precio contado 28.490 €; financiado 25.990 €. AutoScout muestra 26.990 € para la misma unidad: se cuenta una sola ficha y se usa el precio al contado del vendedor, excluyendo el financiado.' }),
  ad(profiles.civicFK2, 'ES', 'cochesnet-71361722', 2016, 76700, 27990,
    'https://www.coches.net/honda-civic-20-vtec-turbo-type-r-gt-5p-gasolina-2015-en-barcelona-71361722-covo.aspx',
    { source: 'Coches.net · Balboni Automoción (profesional; precio contado)', evidenceType: 'direct-detail', note: 'Ficha individual confirma FK2 Type R GT, 2016, 310 CV, gasolina, manual, 5 puertas y 76.700 km; precio al contado 27.990 €.' }),
  ad(profiles.civicFK2, 'ES', 'cochesnet-71036171', 2017, 121000, 29500,
    'https://www.coches.net/honda-civic-20-vtec-turbo-type-r-gt-5p-gasolina-2015-en-orense-71036171-covo.aspx',
    { eligible: false, evidenceType: 'direct-detail', source: 'Coches.net · Martínez Multimarca (profesional)', note: 'Ficha individual confirma 2017, 310 CV, manual, 5 puertas y 121.000 km, pero la unidad es Final White Edition limitada (R-SE0340), no FK2 GT estándar.', eligibilityReason: 'Edición Final White Edition especial; excluir de los comparables del acabado FK2 GT estándar hasta tener una muestra separada de esa edición.' }),
  ad(profiles.civicFK2, 'ES', '452a89b7-476e-4855-acef-3ee9eab3570b', 2016, 82600, 29000, ES_FK2_16,
    { eligible: false, source: 'AutoScout24.es · Particular', eligibilityReason: 'Anuncio español de vendedor particular; excluido del PVP profesional.' }),
  ad(profiles.civicFK2, 'ES', 'df85db2c-379e-4fd8-bb87-8811a14cf3d6', 2016, 118000, 29999, ES_FK2_16,
    { eligible: false, source: 'AutoScout24.es · Particular', eligibilityReason: 'Anuncio español de vendedor particular; excluido del PVP profesional.' }),
  ad(profiles.civicFK2, 'DE', '3e02ba36-ca12-49cc-aae6-97b9e8116eb2', 2016, 21000, 29000, DE_FK2_16,
    { eligible: false, eligibilityReason: 'Anuncio declara 421 CV; preparación, no es el FK2 de serie de 310 CV.' }),

  // Honda Civic Type R FK8, 320 CV manual, acabado Type R GT.
  ad(profiles.civicFK8, 'DE', '016bac6f-2e0c-4f0b-be4d-2b46bfd3de7b', 2018, 101298, 30420,
    'https://www.autoscout24.de/angebote/honda-civic-type-r-gt-led-kamera-schale-navi-benzin-weiss-cat_ma31gr200622ge1979va2415mt12731tr4266-016bac6f-2e0c-4f0b-be4d-2b46bfd3de7b',
    { evidenceType: 'direct-detail', note: 'Detalle confirma 320 CV, manual, 5 puertas y 176 g/km; AutoScout etiqueta la carrocería como «Limousine».' }),
  ad(profiles.civicFK8, 'DE', 'df212bc1-0f01-4007-8bd7-fa26509ccc36', 2020, 48000, 34900,
    'https://www.autoscout24.de/angebote/honda-civic-2-0-vtec-turbo-type-r-gt-benzin-cat_ma31gr200622ge1979va2415mt12731tr4266-df212bc1-0f01-4007-8bd7-fa26509ccc36',
    { evidenceType: 'direct-detail', note: 'Detalle confirma FK8 de serie, 320 CV, manual, 5 puertas y 177 g/km.' }),
  ad(profiles.civicFK8, 'ES', '0092eaa5-5d5e-4ae7-ac20-6577f408a078', 2017, 110608, 30990, ES_FK8_17,
    { note: 'La misma unidad Flexicar aparece repetida en ocho sucursales; deduplicada a una observación.' }),
  ad(profiles.civicFK8, 'ES', '58c82f1f-73e1-4343-b0da-58a75c9c63af', 2018, 88206, 36000, ES_FK8_18,
    { eligible: false, source: 'AutoScout24.es · Particular', note: 'Tarjeta de vendedor particular; anuncio individual dejó de estar disponible al abrir el detalle.', eligibilityReason: 'Anuncio español de vendedor particular; excluir del PVP profesional.' }),
  ad(profiles.civicFK8, 'ES', '858f1098-9472-4306-83a1-f9cdfe1efbd4', 2020, 71260, 35990, ES_FK8_20,
    { note: 'La misma unidad Flexicar aparece repetida en varias sucursales; deduplicada a una observación.' }),
  ad(profiles.civicFK8, 'ES', 'qualiauto-fk8-2018-45000', 2018, 45000, 39990,
    'https://www.autoscout24.es/lst/honda/civic/ve_type-r-gt',
    { eligible: false, source: 'AutoScout24.es · Qualiauto (profesional)', note: 'La descripción comercial asociada declara escape Remus; no comparable de serie.', eligibilityReason: 'Modificación del escape; excluir del precio de FK8 estándar.' }),
  ad(profiles.civicFK8, 'ES', 'cochesnet-71470744', 2018, 70000, 38990,
    'https://www.coches.net/honda-civic-20-ivtec-turbo-type-r-gt-5p-gasolina-2018-en-valencia-71470744-covo.aspx',
    { seller: 'OLYMPIC GOLDEN CARS', source: 'Coches.net · Olympic Golden Cars (profesional)', evidenceType: 'direct-detail', note: 'Detalle individual confirma FK8 GT, 2018, 320 CV, manual, 5 puertas y unidad R-17229.' }),
  ad(profiles.civicFK8, 'ES', 'cochesnet-71494931', 2018, 90000, 37990,
    'https://www.coches.net/honda-civic-20-ivtec-turbo-type-r-gt-5p-gasolina-2018-en-valencia-71494931-covo.aspx',
    { seller: 'OLYMPIC GOLDEN CARS', source: 'Coches.net · Olympic Golden Cars (profesional)', evidenceType: 'direct-detail', note: 'Detalle individual confirma FK8 GT, 2018, 320 CV, manual, 5 puertas y unidad R-19242; distinta de las unidades R-17229 y R-15217.' }),
  ad(profiles.civicFK8, 'ES', 'cochesnet-71561149', 2018, 86000, 37990,
    'https://www.coches.net/honda-civic-20-ivtec-turbo-type-r-gt-5p-gasolina-2018-en-valencia-71561149-covo.aspx',
    { eligible: false, seller: 'OLYMPIC GOLDEN CARS', source: 'Coches.net · Olympic Golden Cars (profesional)', evidenceType: 'direct-detail', note: 'Ficha dice FK8 GT y 320 CV, pero declara pilotos Mugen y contradice el color (texto White Championship vs ficha Gris Pulido).', eligibilityReason: 'Unidad con modificación estética y descripción de color inconsistente; excluir hasta verificar origen/configuración.' }),
  ad(profiles.civicFK8, 'ES', 'cochesnet-71447808', 2019, 77000, 38990,
    'https://www.coches.net/honda-civic-20-ivtec-turbo-type-r-gt-5p-gasolina-2019-en-valencia-71447808-covo.aspx',
    { eligible: false, seller: 'OLYMPIC GOLDEN CARS', source: 'Coches.net · Olympic Golden Cars (profesional)', evidenceType: 'direct-detail', note: 'Ficha de listado 2019, pero comentario del vendedor indica unidad de 12/2018; además menciona asientos calefactados aftermarket.', eligibilityReason: 'Año de matriculación/fecha y modificación aftermarket no concordantes; excluir de comparables hasta verificar.' }),

  // Honda Civic Type R FL5, 329 CV manual. No se extrapola 2024 ES a 2025 DE.
  ad(profiles.civicFL5, 'ES', 'e968d16c-2982-4a70-99cd-794809ebc216', 2024, 24000, 54490, ES_FL5_24,
    { note: 'FL5 estándar, 242 kW/329 CV; no es FK8, Best Lap ni Edición S.' }),
  ad(profiles.civicFL5, 'DE', 'a88d99e4-902f-447a-a54b-b684283b880b', 2025, 7200, 51890,
    'https://www.autoscout24.de/angebote/honda-civic-2-0-vtec-type-r-navi-led-242-kw-benzin-weiss-cat_ma31gr200622ge1980va3479mt12731tr480264-a88d99e4-902f-447a-a54b-b684283b880b',
    { evidenceType: 'direct-detail', note: 'Detalle confirma unidad de serie sin accidente/repintado, manual y 186 g/km.' }),
  ad(profiles.civicFL5, 'ES', '651de708-3804-47bb-b1dc-07fed63259c6', 2025, 13000, 56900, DE_FL5_25,
    { eligible: false, source: 'AutoScout24.de (vendedor ES)', eligibilityReason: 'Edición S; acabado especial distinto del Type R estándar.' }),

  // Excluidos FK8: hay potencia/trim pero modificación visible o ajuste de
  // carrocería incompatible; quedan trazados sin contaminar los precios de serie.
  ad(profiles.civicFK8, 'DE', 'c27bdfbb-7f92-4c1e-bdd5-5b5a8a49e313', 2018, 79700, 33900, DE_FK8_18,
    { eligible: false, eligibilityReason: 'Modificado: admisión Eventuri, escape Remus, separadores y carrocería repintada.' }),
  ad(profiles.civicFK8, 'DE', '0c9ea420-3670-4ee9-9e0f-7b6f3f217931', 2018, 84700, 34795, DE_FK8_18,
    { eligible: false, eligibilityReason: 'Modificado: intercooler, admisión, escape, bomba, embrague y otras piezas.' }),
  ad(profiles.civicFK8, 'DE', '32c0403b-f2f0-4906-bb6c-42c85387884e', 2018, 73700, 34990, DE_FK8_18,
    { eligible: false, eligibilityReason: 'El título declara escape Invidia; excluir de los FK8 de serie.' }),
  ad(profiles.civicFK8, 'DE', '9ad117bb-ac7e-4d35-b93a-0be7dd467b94', 2018, 89964, 31900, DE_FK8_18,
    { eligible: false, eligibilityReason: 'Modificación de motor/acabado y discrepancia de puertas anotadas en la ficha.' }),
  ad(profiles.civicFK8, 'DE', '193e58bb-7a23-4ad1-9067-623722c7f0bd', 2017, 66170, 34990,
    'https://www.autoscout24.de/angebote/honda-civic-lim-5-trg-type-r-gt-rfk-navi-pdc-dab-benzin-rot-cat_ma31gr200622ge1979va2415mt12731tr4266-193e58bb-7a23-4ad1-9067-623722c7f0bd',
    { eligible: false, evidenceType: 'direct-detail', eligibilityReason: 'La ficha base marca 4 puertas y la descripción 5 puertas; excluir por contradicción interna.' }),
];

export const PERFORMANCE_VARIANT_PROFILES = profiles;

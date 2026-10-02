// ============================================================================
//  CATÁLOGO — OTROS (Ford, MG, Smart, SsangYong comerciales, Iveco, Fiat
//  Professional, Mercedes furgones ligeros y eléctricos chinos)
// ============================================================================

export const OTROS = [
  // --------------------------------- FORD ---------------------------------
  {
    b: 'Ford', m: 'Fiesta', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Fiesta VII', 2017, 2023, 18500, [['fd10eb100', 108], ['fd10eb125', 110], ['fd10eb155', 104], ['fd15tdci120', 98, { hp: 85, name: '1.5 TDCi 85 CV' }]]],
    ],
  },
  {
    b: 'Ford', m: 'Focus', seg: 'Compacto', dmd: 1.0,
    g: [
      ['Focus IV', 2018, 2025, 25500, [['fd10eb125', 112], ['fd10eb155', 106], ['fd15eb150', 122], ['fd20ecoblue120', 104], ['fd15tdci120', 100]]],
      ['Focus III', 2014, 2018, 21500, [['fd10eb125', 114], ['fd15eb150', 124], ['fd15tdci120', 102], ['fd20tdci140', 110, { cc: 1997, name: '2.0 TDCi 150 CV', hp: 150, fuel: 'D', gear: 'M', rel: 'FD_D15' }]]],
    ],
  },
  {
    b: 'Ford', m: 'Focus Sportbreak', seg: 'Familiar', dmd: 1.0, body: 'Ranchera',
    g: [
      ['Focus Sportbreak IV', 2018, 2025, 27500, [['fd10eb125', 114], ['fd15eb150', 124], ['fd20ecoblue120', 106]]],
    ],
  },
  {
    b: 'Ford', m: 'Puma', seg: 'B-SUV', dmd: 1.04,
    g: [
      ['Puma', 2019, 2025, 24500, [['fd10eb125', 116], ['fd10eb155', 108], ['fd15tdci120', 102, { hp: 95, name: '1.5 EcoBlue 95 CV' }], ['fd25t200', 30, { hp: 155, name: '1.0 EcoBoost mHEV 155 CV', fuel: 'M', gear: 'M', rel: 'MHEV_ECOBOOST' }]]],
    ],
  },
  {
    b: 'Ford', m: 'Kuga', seg: 'C-SUV', dmd: 1.0,
    g: [
      ['Kuga III', 2020, 2025, 33500, [['fd20ecoblue120', 118], ['fd20ecoblue150', 126], ['fd25t200', 30], ['fd15eb150', 132]]],
      ['Kuga II', 2014, 2019, 29500, [['fd15tdci120', 112], ['fd20ecoblue150', 128, { hp: 150, name: '2.0 TDCi 150 CV', rel: 'ECOBLUE' }], ['fd15eb150', 134], ['fd10eb125', 124]]],
    ],
  },
  {
    b: 'Ford', m: 'Mondeo', seg: 'Berlina', dmd: 0.9,
    g: [
      ['Mondeo IV', 2015, 2022, 33500, [['fd20ecoblue150', 118], ['fd15eb150', 128], ['fd15tdci120', 112], ['fd20ecoblue190', 126]]],
    ],
  },
  {
    b: 'Ford', m: 'S-Max', seg: 'Monovolumen 7 plazas', dmd: 0.93,
    g: [
      ['S-Max II', 2015, 2022, 41500, [['fd20ecoblue150', 140], ['fd20ecoblue190', 148], ['fd15eb150', 145]]],
    ],
  },
  {
    b: 'Ford', m: 'Galaxy', seg: 'Monovolumen 7 plazas', dmd: 0.9,
    g: [
      ['Galaxy III', 2015, 2022, 43500, [['fd20ecoblue150', 142], ['fd20ecoblue190', 150]]],
    ],
  },
  {
    b: 'Ford', m: 'Tourneo Connect', seg: 'Furgoneta Combi', dmd: 1.02, body: 'Furgoneta mixta',
    g: [
      ['Tourneo Connect II', 2015, 2022, 27500, [['fd15tdci120', 120, { hp: 100, name: '1.5 TDCi 100 CV' }], ['fd10eb100', 126, { hp: 100, name: '1.0 EcoBoost 100 CV' }]]],
      ['Tourneo Connect III', 2022, 2025, 33500, [['psa15bhd100', 118], ['psa15bhd130', 122], ['psa12pt110', 126], ['psa_ev_136', 0, { name: 'E-Tourneo Connect 136 CV' }]]],
    ],
  },
  {
    b: 'Ford', m: 'Tourneo Custom', seg: 'Furgoneta Combi', dmd: 1.06, body: 'Furgón pasajeros',
    g: [
      ['Tourneo Custom', 2016, 2024, 46500, [['fd20ecoblue120', 178, { hp: 130, name: '2.0 EcoBlue 130 CV' }], ['fd20ecoblue150', 184], ['fd20ecoblue190', 190]]],
      ['Tourneo Custom II', 2024, 2025, 56500, [['fd20ecoblue150', 182], ['fd20ecoblue190', 190]]],
    ],
  },
  {
    b: 'Ford', m: 'Transit Custom', seg: 'Furgón', dmd: 1.08, body: 'Furgón',
    g: [
      ['Transit Custom', 2016, 2024, 38500, [['fd20ecoblue120', 180, { hp: 130, name: '2.0 EcoBlue 130 CV' }], ['fd20ecoblue150', 186], ['fd20ecoblue190', 192]]],
    ],
  },
  {
    b: 'Ford', m: 'Transit', seg: 'Furgón grande', dmd: 1.05, body: 'Furgón',
    g: [
      ['Transit VI', 2014, 2025, 44500, [['fd20ecoblue120', 200, { hp: 130, name: '2.0 EcoBlue 130 CV' }], ['fd20ecoblue150', 208], ['fd20ecoblue240', 220]]],
    ],
  },
  {
    b: 'Ford', m: 'Ranger', seg: 'Pick-up', dmd: 1.05, body: 'Pick-up 4x4',
    g: [
      ['Ranger T6', 2016, 2022, 42500, [['fd20ecoblue150', 210, { hp: 170, name: '2.0 EcoBlue 170 CV' }], ['fd20ecoblue240', 225], ['fd25t200', 220, { cc: 3198, name: '3.2 TDCi 200 CV', hp: 200, cyl: 5, fuel: 'D', gear: 'A', rel: 'ECOBLUE' }]]],
    ],
  },
  {
    b: 'Ford', m: 'Explorer', seg: 'D-SUV', dmd: 0.85,
    g: [
      ['Explorer VI', 2019, 2025, 76500, [['fd25t200', 55, { name: '3.0 V6 PHEV 457 CV', hp: 457, cyl: 6, cc: 2956, fuel: 'P', gear: 'A', rel: 'FD_PHEV' }]]],
    ],
  },

  // ---------------------------------- MG ----------------------------------
  {
    b: 'MG', m: 'MG4', seg: 'Compacto', dmd: 0.95,
    g: [
      ['MG4', 2022, 2025, 32500, [['mg4_170', 0], ['mg4_204', 0], ['mg4_204', 0, { hp: 435, name: 'MG4 XPower 435 CV' }]]],
    ],
  },
  {
    b: 'MG', m: 'ZS', seg: 'B-SUV', dmd: 0.95,
    g: [
      ['ZS', 2018, 2025, 22500, [['mg15t162', 130, { hp: 106, name: '1.5 106 CV', fuel: 'G', gear: 'M' }], ['mg_ev_143', 0, { name: 'ZS EV 143 CV', hp: 143, fuel: 'E', gear: 'E', cc: 0, cyl: 0, rel: 'EV_MG' }]]],
    ],
  },
  {
    b: 'MG', m: 'HS', seg: 'C-SUV', dmd: 0.93,
    g: [
      ['HS', 2019, 2025, 32500, [['mg15t162', 138], ['mgphev258', 42]]],
    ],
  },

  // -------------------------------- SMART ---------------------------------
  {
    b: 'Smart', m: 'fortwo', seg: 'Urbano', dmd: 0.9,
    g: [
      ['fortwo EQ', 2017, 2023, 22500, [['sm_eq_82', 0]]],
    ],
  },
  {
    b: 'Smart', m: 'forfour', seg: 'Urbano', dmd: 0.9,
    g: [
      ['forfour EQ', 2017, 2023, 23500, [['sm_eq_82', 0]]],
    ],
  },
  {
    b: 'Smart', m: '#1', seg: 'B-SUV', dmd: 0.85,
    g: [
      ['Smart #1', 2022, 2025, 41500, [['mg_ev_143', 0, { hp: 272, name: 'Eléctrico 272 CV', rel: 'EV_MG' }]]],
    ],
  },

  // ------------------------------- IVECO / FIAT PRO ------------------------
  {
    b: 'Iveco', m: 'Daily', seg: 'Furgón grande', dmd: 1.1, body: 'Furgón',
    g: [
      ['Daily 35S', 2015, 2025, 48500, [['iveco23d136', 210, { hp: 136, name: '2.3 F1A 136 CV' }], ['iveco23d156', 220], ['iveco30_180', 230, { cc: 2998, name: '3.0 F1C 180 CV', hp: 180, fuel: 'D', gear: 'A', cyl: 4, rel: 'F1A' }]]],
    ],
  },
  {
    b: 'Fiat', m: 'Fiorino', seg: 'Furgón', dmd: 1.0, body: 'Furgón',
    g: [
      ['Fiorino', 2016, 2024, 17500, [['fiat13mjet95', 110, { hp: 80, name: '1.3 MultiJet 80 CV' }], ['fiat12f70', 116, { hp: 77, name: '1.4 77 CV' }]]],
    ],
  },
  {
    b: 'Fiat', m: 'Doblò', seg: 'Furgoneta Combi', dmd: 1.02, body: 'Furgoneta mixta',
    g: [
      ['Doblò II', 2015, 2022, 22500, [['fiat13mjet95', 118], ['fiat16mjet120', 122], ['fiat12f70', 124, { hp: 95, name: '1.4 95 CV' }]]],
      ['Doblò III', 2022, 2025, 28500, [['psa15bhd100', 112], ['psa15bhd130', 116], ['psa12pt110', 120], ['psa_ev_136', 0, { name: 'e-Doblò 136 CV' }]]],
    ],
  },

  // ------------------------- OTRAS MARCAS DE VOLUMEN -----------------------
  {
    b: 'Dacia', m: 'Spring', seg: 'Urbano', dmd: 0.75,
    g: [
      ['Spring', 2021, 2025, 19500, [['rn_ev_150', 0, { hp: 45, name: 'Eléctrico 45 CV' }], ['rn_ev_150', 0, { hp: 65, name: 'Eléctrico 65 CV' }]]],
    ],
  },
  {
    b: 'MG', m: 'MG5', seg: 'Familiar', dmd: 0.92, body: 'Ranchera',
    g: [
      ['MG5 Electric', 2021, 2025, 31500, [['mg_ev_143', 0, { hp: 156, name: 'Eléctrico 156 CV', rel: 'EV_MG' }]]],
    ],
  },
  {
    b: 'Tesla', m: 'Model S', seg: 'Berlina', dmd: 0.8,
    g: [
      ['Model S', 2016, 2023, 95500, [['ts_model3lr', 0, { name: 'Long Range 495 CV', hp: 495 }]]],
    ],
  },
  {
    b: 'Tesla', m: 'Model X', seg: 'D-SUV', dmd: 0.78,
    g: [
      ['Model X', 2016, 2023, 105500, [['ts_model3lr', 0, { name: 'Long Range 480 CV', hp: 480 }]]],
    ],
  },
];

// ============================================================================
//  CATÁLOGO — FRANCIA / ITALIA (Peugeot, Citroën, DS, Renault, Dacia, Opel,
//  Fiat, Jeep, Alfa Romeo)
// ============================================================================

export const FRANCESES = [
  // ------------------------------ PEUGEOT ---------------------------------
  {
    b: 'Peugeot', m: '208', seg: 'Urbano', dmd: 1.0,
    g: [
      ['208 I', 2015, 2019, 18500, [['psa12pt110', 105], ['psa16bhd120', 95], ['psa12pt130', 110], ['psa16hdi112', 98]]],
      ['208 II', 2019, 2025, 22500, [['psa12pt100', 108], ['psa12pt130', 112], ['psa15bhd100', 100], ['psa15bhd130', 104], ['psa_ev_136', 0, { name: 'e-208 136 CV' }]]],
    ],
  },
  {
    b: 'Peugeot', m: '308', seg: 'Compacto', dmd: 0.98,
    g: [
      ['308 II', 2015, 2021, 25500, [['psa16bhd120', 98], ['psa12pt130', 110], ['psa20bhd150', 108], ['psa15bhd130', 104]]],
      ['308 III', 2021, 2025, 30500, [['psa15bhd130', 106], ['psa12pt130', 114], ['psa15phev136', 108], ['psa12phev225', 30, { name: 'Hybrid 225 CV' }]]],
    ],
  },
  {
    b: 'Peugeot', m: '308 SW', seg: 'Familiar', dmd: 0.99, body: 'Ranchera',
    g: [
      ['308 SW III', 2021, 2025, 32500, [['psa15bhd130', 108], ['psa12pt130', 116], ['psa15phev136', 110]]],
    ],
  },
  {
    b: 'Peugeot', m: '3008', seg: 'C-SUV', dmd: 1.02,
    g: [
      ['3008 II', 2016, 2023, 33500, [['psa16bhd120', 108], ['psa12pt130', 118], ['psa20bhd180', 122], ['psa15bhd130', 110], ['psa12phev225', 32]]],
      ['3008 III', 2024, 2025, 41500, [['psa15bhd130', 112], ['psa15phev136', 114], ['psa_ev_156', 0, { name: 'E-3008 210 CV', hp: 210 }]]],
    ],
  },
  {
    b: 'Peugeot', m: '5008', seg: 'D-SUV', dmd: 0.99,
    g: [
      ['5008 II', 2017, 2024, 37500, [['psa15bhd130', 118], ['psa12pt130', 124], ['psa20bhd180', 128], ['psa12phev225', 35]]],
    ],
  },
  {
    b: 'Peugeot', m: '508', seg: 'Berlina', dmd: 0.9,
    g: [
      ['508 II', 2018, 2025, 42500, [['psa15bhd130', 112], ['psa20bhd150', 116], ['psa20bhd180', 122], ['psa12phev225', 30]]],
    ],
  },
  {
    b: 'Peugeot', m: '2008', seg: 'B-SUV', dmd: 1.03,
    g: [
      ['2008 II', 2019, 2025, 26500, [['psa12pt100', 112], ['psa12pt130', 116], ['psa15bhd100', 104], ['psa15bhd130', 108], ['psa_ev_136', 0, { name: 'e-2008 136 CV' }]]],
    ],
  },
  {
    b: 'Peugeot', m: 'Rifter', seg: 'Furgoneta Combi', dmd: 1.0, body: 'Furgoneta mixta',
    g: [
      ['Rifter', 2018, 2025, 27500, [['psa15bhd100', 112], ['psa15bhd130', 116], ['psa12pt110', 120], ['psa_ev_136', 0, { name: 'e-Rifter 136 CV' }]]],
    ],
  },
  {
    b: 'Peugeot', m: 'Partner', seg: 'Furgón', dmd: 1.02, body: 'Furgón',
    g: [
      ['Partner III', 2018, 2025, 24500, [['psa15bhd100', 108], ['psa15bhd130', 112], ['psa12pt110', 118]]],
    ],
  },

  // ------------------------------ CITROËN ---------------------------------
  {
    b: 'Citroën', m: 'C3', seg: 'Urbano', dmd: 0.96,
    g: [
      ['C3 III', 2016, 2024, 17500, [['psa12pt110', 104], ['psa16bhd120', 94], ['psa12pt100', 106], ['psa15bhd100', 98]]],
    ],
  },
  {
    b: 'Citroën', m: 'C4', seg: 'Compacto', dmd: 0.95,
    g: [
      ['C4 III', 2020, 2025, 26500, [['psa12pt130', 112], ['psa15bhd130', 106], ['psa15phev136', 108], ['psa_ev_136', 0, { name: 'ë-C4 136 CV' }]]],
    ],
  },
  {
    b: 'Citroën', m: 'C5 Aircross', seg: 'C-SUV', dmd: 0.94,
    g: [
      ['C5 Aircross', 2018, 2025, 33500, [['psa15bhd130', 112], ['psa20bhd180', 124], ['psa12pt130', 118], ['psa12phev225', 32]]],
    ],
  },
  {
    b: 'Citroën', m: 'Berlingo', seg: 'Furgoneta Combi', dmd: 1.02, body: 'Furgoneta mixta',
    g: [
      ['Berlingo III', 2018, 2025, 25500, [['psa15bhd100', 110], ['psa15bhd130', 114], ['psa12pt110', 118], ['psa_ev_136', 0, { name: 'ë-Berlingo 136 CV' }]]],
    ],
  },
  {
    b: 'Citroën', m: 'Jumper', seg: 'Furgón grande', dmd: 1.0, body: 'Furgón',
    g: [
      ['Jumper II', 2015, 2025, 42500, [['psa20bhd150', 190, { hp: 140, name: '2.0 BlueHDi 140 CV' }], ['psa22bhd190', 205, { hp: 165, name: '2.2 BlueHDi 165 CV' }]]],
    ],
  },

  // --------------------------------- DS -----------------------------------
  {
    b: 'DS', m: 'DS 7', seg: 'D-SUV', dmd: 0.85,
    g: [
      ['DS 7 Crossback', 2018, 2025, 51500, [['psa15bhd130', 116], ['psa20bhd180', 128], ['psa12phev225', 32], ['psa12phev225', 45, { hp: 360, name: 'E-Tense 4x4 360 CV' }]]],
    ],
  },

  // ------------------------------ RENAULT --------------------------------
  {
    b: 'Renault', m: 'Clio', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Clio IV', 2015, 2019, 16500, [['rn15dci95', 92], ['rn12tce115', 108], ['rn10sce75', 105], ['rn15dci115', 94]]],
      ['Clio V', 2019, 2025, 20500, [['rn15dci115', 96], ['rn10tce100', 106], ['rn13tce130', 112], ['rne-tech145', 98], ['rn10lpg100', 102]]],
    ],
  },
  {
    b: 'Renault', m: 'Mégane', seg: 'Compacto', dmd: 0.95,
    g: [
      ['Mégane IV', 2016, 2022, 24500, [['rn15dci115', 98], ['rn13tce140', 114], ['rn16dci130', 104], ['rn12tce130', 112]]],
    ],
  },
  {
    b: 'Renault', m: 'Captur', seg: 'B-SUV', dmd: 1.02,
    g: [
      ['Captur I', 2015, 2019, 20500, [['rn15dci95', 98], ['rn12tce115', 112], ['rn10sce75', 108]]],
      ['Captur II', 2019, 2025, 25500, [['rn15dci115', 102], ['rn10tce100', 110], ['rn13tce140', 118], ['rne-tech145', 104], ['rn13tce_mhev', 116]]],
    ],
  },
  {
    b: 'Renault', m: 'Kadjar', seg: 'C-SUV', dmd: 0.95,
    g: [
      ['Kadjar', 2015, 2022, 27500, [['rn15dci115', 106], ['rn13tce140', 122], ['rn16dci130', 112], ['rn12tce130', 120]]],
    ],
  },
  {
    b: 'Renault', m: 'Austral', seg: 'C-SUV', dmd: 1.0,
    g: [
      ['Austral', 2022, 2025, 36500, [['rne-tech145', 108], ['rn13tce_mhev', 118], ['rn12tce130', 120, { name: '1.2 TCe 130 CV mild hybrid', rel: 'H5HT' }]]],
    ],
  },
  {
    b: 'Renault', m: 'Scénic', seg: 'Monovolumen', dmd: 0.94,
    g: [
      ['Scénic IV', 2016, 2022, 29500, [['rn15dci115', 104], ['rn13tce140', 118], ['rn16dci160', 116]]],
      ['Scénic E-Tech', 2024, 2025, 42500, [['rn_ev_218', 0, {}]]],
    ],
  },
  {
    b: 'Renault', m: 'Espace', seg: 'Monovolumen 7 plazas', dmd: 0.85,
    g: [
      ['Espace V', 2015, 2023, 45500, [['rn16dci160', 128], ['rn20dci175', 138], ['rn18tce225', 145, { cc: 1798, name: '1.8 TCe 225 CV', hp: 225, rel: 'M9R' }]]],
    ],
  },
  {
    b: 'Renault', m: 'Trafic', seg: 'Furgoneta Combi', dmd: 1.05, body: 'Furgón pasajeros',
    g: [
      ['Trafic III', 2015, 2025, 38500, [['rn16dci130', 165, { hp: 125, name: '1.6 dCi 125 CV' }], ['rn20dci150', 172], ['rn20dci175', 178]]],
    ],
  },
  {
    b: 'Renault', m: 'Master', seg: 'Furgón grande', dmd: 1.02, body: 'Furgón',
    g: [
      ['Master III', 2015, 2024, 42500, [['rn23dci150', 195, { hp: 135, name: '2.3 dCi 135 CV' }], ['rn23dci150', 200, { hp: 165, name: '2.3 dCi 165 CV' }]]],
    ],
  },
  {
    b: 'Renault', m: 'Zoe', seg: 'Urbano', dmd: 0.8,
    g: [
      ['Zoe', 2016, 2024, 26500, [['rn_ev_150', 0, { hp: 92, name: 'Eléctrico 92 CV' }], ['rn_ev_150', 0, { hp: 135, name: 'Eléctrico 135 CV' }]]],
    ],
  },

  // -------------------------------- DACIA ---------------------------------
  {
    b: 'Dacia', m: 'Sandero', seg: 'Urbano', dmd: 1.1,
    g: [
      ['Sandero III', 2020, 2025, 14500, [['rn10sce75', 110], ['rn10tce90', 108], ['rn10lpg100', 106], ['rn15dci95', 100]]],
      ['Sandero II', 2015, 2020, 11500, [['rn15dci95', 98], ['rn10sce75', 112], ['rn12tce115', 110, { hp: 90, name: '0.9 TCe 90 CV', cc: 898, cyl: 3, rel: 'B4D' }]]],
    ],
  },
  {
    b: 'Dacia', m: 'Duster', seg: 'B-SUV', dmd: 1.15,
    g: [
      ['Duster II', 2018, 2024, 19500, [['rn15blue_115', 118], ['rn13tce130', 128], ['rn10lpg100', 122], ['rn15dci115', 120], ['rn13tce130', 138, { name: '1.3 TCe 150 CV 4x4', hp: 150 }]]],
      ['Duster III', 2024, 2025, 23500, [['rn13tce_mhev', 130], ['rne-tech145', 118], ['rn10lpg100', 124], ['rn15blue_115', 120]]],
    ],
  },
  {
    b: 'Dacia', m: 'Jogger', seg: 'Monovolumen 7 plazas', dmd: 1.08,
    g: [
      ['Jogger', 2021, 2025, 19500, [['rn10tce100', 118], ['rn10lpg100', 116], ['rne-tech145', 112], ['rn15blue_115', 114]]],
    ],
  },
  {
    b: 'Dacia', m: 'Lodgy', seg: 'Monovolumen 7 plazas', dmd: 0.95,
    g: [
      ['Lodgy', 2015, 2022, 15500, [['rn15dci115', 108], ['rn16dci130', 112], ['rn10sce75', 116]]],
    ],
  },

  // -------------------------------- OPEL ----------------------------------
  {
    b: 'Opel', m: 'Corsa', seg: 'Urbano', dmd: 0.98,
    g: [
      ['Corsa E', 2015, 2019, 16500, [['op16d136', 98, { hp: 95, name: '1.6 CDTi 95 CV' }], ['psa12pt110', 108, { hp: 90, name: '1.4 90 CV', cc: 1398, rel: 'FIREFLY' }], ['psa12pt110', 106]]],
      ['Corsa F', 2019, 2025, 20500, [['psa12pt100', 106], ['psa12pt130', 110], ['psa15bhd100', 100], ['psa_ev_136', 0, { name: 'Corsa-e 136 CV' }]]],
    ],
  },
  {
    b: 'Opel', m: 'Astra', seg: 'Compacto', dmd: 0.95,
    g: [
      ['Astra K', 2015, 2021, 23500, [['op16d136', 102], ['psa12pt130', 114], ['fd15eb150', 118, { hp: 145, name: '1.4 Turbo 145 CV' }]]],
      ['Astra L', 2021, 2025, 29500, [['psa15bhd130', 106], ['psa12pt130', 112], ['psa15phev136', 108], ['psa_ev_156', 0, { name: 'Astra Electric 156 CV' }]]],
    ],
  },
  {
    b: 'Opel', m: 'Mokka', seg: 'B-SUV', dmd: 0.97,
    g: [
      ['Mokka B', 2020, 2025, 25500, [['psa12pt100', 110], ['psa12pt130', 114], ['psa15bhd110', 104, { hp: 110, name: '1.5 D 110 CV' }], ['psa_ev_136', 0, { name: 'Mokka-e 136 CV' }]]],
    ],
  },
  {
    b: 'Opel', m: 'Grandland', seg: 'C-SUV', dmd: 0.93,
    g: [
      ['Grandland X', 2017, 2025, 32500, [['psa15bhd130', 114], ['psa20bhd180', 124], ['psa12pt130', 118], ['psa12phev225', 32], ['op16d136', 112]]],
    ],
  },
  {
    b: 'Opel', m: 'Combo', seg: 'Furgoneta Combi', dmd: 0.99, body: 'Furgoneta mixta',
    g: [
      ['Combo E', 2018, 2025, 25500, [['psa15bhd100', 110], ['psa15bhd130', 114], ['psa12pt110', 118], ['psa_ev_136', 0, { name: 'Combo-e 136 CV' }]]],
    ],
  },
  {
    b: 'Opel', m: 'Vivaro', seg: 'Furgón', dmd: 1.0, body: 'Furgón',
    g: [
      ['Vivaro C', 2019, 2025, 34500, [['psa15bhd130', 150], ['psa20bhd150', 160], ['psa_ev_136', 0, { name: 'Vivaro-e 136 CV' }]]],
    ],
  },

  // -------------------------------- FIAT ----------------------------------
  {
    b: 'Fiat', m: '500', seg: 'Urbano', dmd: 1.05,
    g: [
      ['500 (312)', 2015, 2023, 16500, [['fiat12f70', 110], ['fiat13mjet95', 98], ['fiat10h70', 102], ['fiat_ev_118', 0, { name: '500e 118 CV' }]]],
    ],
  },
  {
    b: 'Fiat', m: 'Panda', seg: 'Urbano', dmd: 1.06,
    g: [
      ['Panda III', 2015, 2025, 14500, [['fiat12f70', 108], ['fiat13mjet95', 96], ['fiat10h70', 100], ['fiat12f70 4x4', 118, { name: '1.2 4x4 69 CV', hp: 69 }]]],
    ],
  },
  {
    b: 'Fiat', m: 'Tipo', seg: 'Compacto', dmd: 0.92,
    g: [
      ['Tipo (356)', 2016, 2024, 19500, [['fiat16mjet120', 106], ['fiat14ma140', 118, { hp: 120, name: '1.4 120 CV', rel: 'FIREFLY' }], ['fiat10h70', 104], ['fiat13mjet95', 100]]],
    ],
  },
  {
    b: 'Fiat', m: '500X', seg: 'B-SUV', dmd: 0.94,
    g: [
      ['500X', 2015, 2024, 22500, [['fiat16mjet120', 112], ['fiat14ma140', 120], ['fiat10h70', 106], ['fiat13mjet95', 102]]],
    ],
  },
  {
    b: 'Fiat', m: 'Ducato', seg: 'Furgón grande', dmd: 1.12, body: 'Furgón',
    g: [
      ['Ducato 250', 2015, 2025, 38500, [['iveco23d136', 195], ['iveco23d156', 200], ['fiat16mjet120', 180, { hp: 120, name: '2.0 MultiJet 120 CV' }]]],
    ],
  },
  {
    b: 'Fiat', m: 'Talento', seg: 'Furgón', dmd: 0.98, body: 'Furgón',
    g: [
      ['Talento', 2016, 2022, 32500, [['rn16dci130', 165, { hp: 125, name: '1.6 dCi 125 CV' }], ['rn20dci150', 172]]],
    ],
  },

  // -------------------------------- JEEP ----------------------------------
  {
    b: 'Jeep', m: 'Renegade', seg: 'B-SUV', dmd: 0.95,
    g: [
      ['Renegade', 2015, 2024, 27500, [['fiat16mjet120', 118], ['fiat14ma140', 128], ['jeep13t150', 132], ['jeep4xe240', 45], ['fiat13mjet95', 108]]],
    ],
  },
  {
    b: 'Jeep', m: 'Compass', seg: 'C-SUV', dmd: 0.93,
    g: [
      ['Compass MP', 2017, 2025, 33500, [['fiat16mjet120', 122], ['fiat20mjet170', 138], ['jeep13t150', 136], ['jeep4xe240', 48]]],
    ],
  },

  // ------------------------------ ALFA ROMEO ------------------------------
  {
    b: 'Alfa Romeo', m: 'Giulia', seg: 'Berlina', dmd: 0.8,
    g: [
      ['Giulia (952)', 2016, 2024, 48500, [['alfa20jtdm190', 118], ['alfa20g280', 148], ['alfa16jtdm120', 112], ['alfa20g280', 158, { hp: 510, name: '2.9 V6 Quadrifoglio 510 CV', cc: 2891, cyl: 6, rel: 'EA839' }]]],
    ],
  },
  {
    b: 'Alfa Romeo', m: 'Stelvio', seg: 'D-SUV', dmd: 0.82,
    g: [
      ['Stelvio', 2017, 2025, 54500, [['alfa20jtdm190', 132], ['alfa20g280', 158], ['alfa16jtdm120', 126]]],
    ],
  },
  {
    b: 'Alfa Romeo', m: 'Tonale', seg: 'C-SUV', dmd: 0.9,
    g: [
      ['Tonale', 2022, 2025, 39500, [['jeep4xe240', 40], ['fiat16mjet120', 118, { hp: 130, name: '1.6 MultiJet 130 CV' }], ['fiat10h70', 112, { hp: 130, name: '1.5 Hybrid 130 CV', rel: 'FIREFLY_HEV' }]]],
    ],
  },
];

// ============================================================================
//  CATÁLOGO — GRUPO VOLKSWAGEN (VW, Audi, Seat, Cupra, Škoda)
//  Formato por generación: [nombre, añoInicio, añoFin, PVP nuevo, motores]
//  Formato por motor:      [código de engines.js, CO₂ WLTP, sobrescrituras]
// ============================================================================

export const VAG = [
  // ------------------------- VOLKSWAGEN ----------------------------------
  {
    b: 'Volkswagen', m: 'Golf', seg: 'Compacto', dmd: 1.10,
    g: [
      ['Golf VII (5G)', 2013, 2016, 27500, [['20tdi150', 118, { gear: 'D' }], ['16tdi105', 109], ['14tsi140', 127], ['12tsi105', 119], ['20tdi184', 129], ['14tsi125', 124]]],
      ['Golf VII.5', 2017, 2020, 31500, [['20tdi150', 118, { gear: 'D' }], ['16tdi115', 110], ['15tsi150', 122, { gear: 'D' }], ['10tsi115', 112], ['20tdi184', 129]]],
      ['Golf VIII', 2020, 2025, 34900, [['20tdi150', 116, { gear: 'D' }], ['20tdi115', 114], ['15tsi130', 124], ['15etsi150', 120], ['10tsi110', 112], ['20tsi245', 155]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Golf Variant', seg: 'Familiar', dmd: 1.05, body: 'Ranchera',
    g: [
      ['Golf VII Variant', 2014, 2020, 32500, [['20tdi150', 120, { gear: 'D' }], ['16tdi115', 112], ['15tsi150', 124, { gear: 'D' }], ['10tsi115', 114]]],
      ['Golf VIII Variant', 2020, 2025, 36500, [['20tdi150', 118, { gear: 'D' }], ['15etsi150', 122], ['15tsi130', 126]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Polo', seg: 'Urbano', dmd: 1.02,
    g: [
      ['Polo VI (AW)', 2017, 2021, 21500, [['10mpi80', 118], ['10tsi95', 112], ['10tsi115', 116], ['16tdi90', 110], ['10tsi110', 114]]],
      ['Polo VI restyling', 2021, 2025, 23900, [['10mpi80', 119], ['10tsi95', 113], ['10tsi110', 114], ['15tsi150', 122, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Passat', seg: 'Berlina', dmd: 0.98,
    g: [
      ['Passat B8', 2015, 2019, 39500, [['20tdi150', 119, { gear: 'D' }], ['20tdi184', 125], ['14tsi150', 125, { gear: 'D' }], ['16tdi115', 116]]],
      ['Passat B8 restyling', 2019, 2023, 44500, [['20tdi150', 122, { gear: 'D' }], ['20tdi200', 131], ['15tsi150', 128, { gear: 'D' }], ['15etsi150', 126]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Passat Variant', seg: 'Familiar', dmd: 1.0, body: 'Ranchera',
    g: [
      ['Passat Variant B8', 2015, 2023, 42000, [['20tdi150', 124, { gear: 'D' }], ['20tdi190', 130, { hp: 190, name: '2.0 TDI 190 CV' }], ['15tsi150', 132, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Tiguan', seg: 'C-SUV', dmd: 1.06,
    g: [
      ['Tiguan II', 2016, 2020, 41500, [['20tdi150', 130, { gear: 'D' }], ['20tdi150 4M', 148, { name: '2.0 TDI 150 CV 4Motion', gear: 'D' }], ['15tsi150', 138], ['20tdi184', 150, { hp: 190, name: '2.0 TDI 190 CV 4Motion' }]]],
      ['Tiguan II restyling', 2020, 2024, 45900, [['20tdi150', 135, { gear: 'D' }], ['20tdi200', 152], ['15tsi150', 140], ['15etsi150', 139], ['20tsi190', 160]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'T-Roc', seg: 'B-SUV', dmd: 1.04,
    g: [
      ['T-Roc', 2018, 2025, 33500, [['10tsi110', 118], ['15tsi150', 127, { gear: 'D' }], ['20tdi150', 126, { gear: 'D' }], ['20tsi190', 145], ['20tdi115', 122]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Touran', seg: 'Monovolumen 7 plazas', dmd: 0.97,
    g: [
      ['Touran II', 2015, 2024, 39500, [['20tdi150', 128, { gear: 'D' }], ['16tdi115', 120], ['15tsi150', 135, { gear: 'D' }], ['20tdi115', 125]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Sharan', seg: 'Monovolumen 7 plazas', dmd: 0.93,
    g: [
      ['Sharan II', 2015, 2021, 45000, [['20tdi150', 138, { gear: 'D' }], ['20tdi184', 145], ['14tsi150', 146, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Caddy', seg: 'Furgoneta Combi', dmd: 1.08, body: 'Furgoneta mixta',
    g: [
      ['Caddy 4', 2015, 2020, 29500, [['20tdi102', 126], ['20tdi75', 119], ['20tdi150', 134, { gear: 'D' }], ['12tsi105', 130, { hp: 84, name: '1.2 TSI 84 CV' }]]],
      ['Caddy 5', 2020, 2025, 34500, [['20tdi102', 128], ['20tdi115', 130, { hp: 122, name: '2.0 TDI 122 CV' }], ['20tdi75', 121], ['15tsi130', 134, { hp: 114, name: '1.5 TSI 114 CV' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Transporter / Caravelle T6', seg: 'Furgoneta Combi', dmd: 1.18, body: 'Furgón pasajeros',
    g: [
      ['T6', 2015, 2019, 48000, [['20tdi150', 168], ['20tdi102', 165], ['20bitdi204', 189], ['20tdi150 4M', 178, { name: '2.0 TDI 150 CV 4Motion' }]]],
      ['T6.1', 2019, 2024, 55500, [['20tdi150', 175, { gear: 'D' }], ['20tdi115', 172, { hp: 110, name: '2.0 TDI 110 CV' }], ['20tdi200', 178], ['20tdi150 4M', 186, { name: '2.0 TDI 150 CV 4Motion' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Multivan / Caravelle T7', seg: 'Furgoneta Combi', dmd: 1.1, body: 'Monovolumen',
    g: [
      ['T7', 2022, 2025, 68000, [['20tdi150', 180, { gear: 'D' }], ['14tsi150', 165, { hp: 218, name: '1.4 eHybrid 218 CV', fuel: 'P', gear: 'D' }], ['20tdi200', 188]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Crafter', seg: 'Furgón grande', dmd: 1.0, body: 'Furgón',
    g: [
      ['Crafter II', 2017, 2025, 52000, [['20tdi150', 190, { hp: 140, name: '2.0 TDI 140 CV' }], ['20tdi150 177', 195, { hp: 177, name: '2.0 TDI 177 CV' }], ['20tdi102', 185, { hp: 102, name: '2.0 TDI 102 CV' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Arteon', seg: 'Berlina', dmd: 0.9,
    g: [
      ['Arteon', 2017, 2024, 52000, [['20tdi150', 125, { gear: 'D' }], ['20tdi200', 140], ['20tsi190', 145], ['20bitdi204', 150], ['20tdi150 4M', 138, { name: '2.0 TDI 150 CV 4Motion', gear: 'D' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'Touareg', seg: 'D-SUV', dmd: 0.85,
    g: [
      ['Touareg III (CR)', 2018, 2024, 76000, [['30tdi286', 180], ['30tdi245', 175, { hp: 231, name: '3.0 V6 TDI 231 CV' }], ['30tdi204', 172]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'up!', seg: 'Urbano', dmd: 0.98,
    g: [
      ['up!', 2016, 2023, 15500, [['10mpi80', 105], ['10mpi80 60', 101, { hp: 60, name: '1.0 MPI 60 CV' }], ['10tsi95', 112, { hp: 90, name: '1.0 TSI 90 CV GTI' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'ID.3', seg: 'Compacto', dmd: 0.86,
    g: [
      ['ID.3', 2020, 2025, 40500, [['psa_ev_136', 0, { hp: 204, name: 'Eléctrico Pro 204 CV', gear: 'E' }], ['psa_ev_156', 0, { hp: 150, name: 'Eléctrico Pure 150 CV', gear: 'E' }]]],
    ],
  },
  {
    b: 'Volkswagen', m: 'ID.4', seg: 'C-SUV', dmd: 0.85,
    g: [
      ['ID.4', 2021, 2025, 46500, [['psa_ev_136', 0, { hp: 204, name: 'Eléctrico Pro 204 CV', gear: 'E' }], ['psa_ev_156', 0, { hp: 286, name: 'Eléctrico GTX 286 CV', gear: 'E' }]]],
    ],
  },

  // ---------------------------- AUDI --------------------------------------
  {
    b: 'Audi', m: 'A1', seg: 'Urbano', dmd: 0.98,
    g: [
      ['A1 (GB)', 2019, 2025, 27500, [['10tsi95', 118, { name: '25 TFSI 95 CV' }], ['10tsi110', 120, { name: '30 TFSI 110 CV' }], ['15tsi150', 128, { name: '35 TFSI 150 CV', gear: 'D' }], ['16tdi90', 112, { name: '25 TDI 95 CV' }]]],
    ],
  },
  {
    b: 'Audi', m: 'A3', seg: 'Compacto', dmd: 1.05,
    g: [
      ['A3 8V', 2016, 2020, 36500, [['20tdi150', 116, { gear: 'D' }], ['16tdi115', 112], ['14tsi150', 120, { gear: 'D' }], ['10tsi115', 114, { name: '1.0 TFSI 116 CV' }]]],
      ['A3 8Y', 2020, 2025, 39500, [['20tdi150', 118, { name: '35 TDI 150 CV', gear: 'D' }], ['16tdi115', 114, { hp: 116, name: '30 TDI 116 CV' }], ['15tsi150', 124, { name: '35 TFSI 150 CV', gear: 'D' }], ['14tgi130', 105], ['20tdi150 4x4', 132, { name: '35 TDI quattro 150 CV', gear: 'D' }]]],
    ],
  },
  {
    b: 'Audi', m: 'A3 Sportback', seg: 'Compacto', dmd: 1.05,
    g: [
      ['A3 Sportback 8Y', 2020, 2025, 40500, [['20tdi150', 119, { name: '35 TDI 150 CV', gear: 'D' }], ['15tsi150', 125, { name: '35 TFSI 150 CV', gear: 'D' }], ['15etsi150', 122, { name: '35 TFSI S tronic mHEV' }]]],
    ],
  },
  {
    b: 'Audi', m: 'A4', seg: 'Berlina', dmd: 1.0,
    g: [
      ['A4 B9', 2016, 2019, 44000, [['20tdi150', 115, { gear: 'D' }], ['20tdi184', 119, { hp: 190, name: '2.0 TDI 190 CV' }], ['14tsi150', 122, { gear: 'D' }]]],
      ['A4 B9 restyling', 2019, 2024, 48500, [['20tdi150', 118, { name: '35 TDI 150 CV', gear: 'D' }], ['20tdi184', 120, { hp: 190, name: '40 TDI 190 CV' }], ['20tsi190', 130, { name: '40 TFSI 204 CV', hp: 204 }], ['20tdi150 4x4', 135, { name: '35 TDI quattro', gear: 'D' }]]],
    ],
  },
  {
    b: 'Audi', m: 'A4 Avant', seg: 'Familiar', dmd: 1.04, body: 'Ranchera',
    g: [
      ['A4 Avant B9', 2016, 2024, 47000, [['20tdi150', 120, { gear: 'D' }], ['20tdi184', 124, { hp: 190, name: '2.0 TDI 190 CV' }], ['14tsi150', 126, { gear: 'D' }], ['30tdi204', 132, { hp: 204, name: '45 TDI quattro 204 CV' }]]],
    ],
  },
  {
    b: 'Audi', m: 'A5', seg: 'Coupé', dmd: 0.96,
    g: [
      ['A5 F5', 2017, 2024, 52000, [['20tdi150', 118, { name: '35 TDI 163 CV', hp: 163, gear: 'D' }], ['20tdi184', 122, { hp: 190, name: '40 TDI 190 CV' }], ['20tsi190', 132], ['20tdi150 4x4', 130, { name: '35 TDI quattro', gear: 'D' }]]],
    ],
  },
  {
    b: 'Audi', m: 'A6', seg: 'Berlina', dmd: 0.9,
    g: [
      ['A6 C7', 2015, 2018, 62000, [['20tdi184', 119, { hp: 190, name: '2.0 TDI 190 CV' }], ['30tdi204', 130, { hp: 218, name: '3.0 TDI 218 CV' }], ['30tdi245', 140, { hp: 272, name: '3.0 TDI 272 CV' }]]],
      ['A6 C8', 2018, 2025, 68000, [['20tdi184', 125, { hp: 204, name: '40 TDI 204 CV' }], ['20tdi184', 132, { hp: 231, name: '45 TDI 231 CV' }], ['30tdi286', 145], ['20tsi190', 148, { hp: 265, name: '45 TFSI 265 CV' }]]],
    ],
  },
  {
    b: 'Audi', m: 'Q2', seg: 'B-SUV', dmd: 0.99,
    g: [
      ['Q2', 2017, 2025, 32500, [['16tdi115', 115], ['20tdi150', 125, { hp: 143, name: '2.0 TDI 143 CV' }], ['14tsi150', 127, { gear: 'D' }], ['10tsi115', 119], ['20tdi150 4x4', 138, { hp: 150, name: '35 TDI quattro', gear: 'D' }]]],
    ],
  },
  {
    b: 'Audi', m: 'Q3', seg: 'C-SUV', dmd: 1.05,
    g: [
      ['Q3 8U', 2015, 2018, 40000, [['20tdi150', 127, { gear: 'D' }], ['20tdi184', 134], ['14tsi150', 135, { gear: 'D' }]]],
      ['Q3 F3', 2018, 2025, 46500, [['20tdi150', 138, { name: '35 TDI 150 CV', gear: 'D' }], ['20tdi184', 145, { hp: 200, name: '40 TDI 200 CV' }], ['15tsi150', 142, { name: '35 TFSI 150 CV', gear: 'D' }], ['20tsi190', 160, { name: '45 TFSI quattro' }]]],
    ],
  },
  {
    b: 'Audi', m: 'Q5', seg: 'D-SUV', dmd: 1.0,
    g: [
      ['Q5 8R', 2013, 2016, 52000, [['20tdi150', 140, { gear: 'D' }], ['20tdi184', 145, { hp: 190, name: '2.0 TDI 190 CV' }], ['30tdi245', 155]]],
      ['Q5 FY', 2017, 2024, 58500, [['20tdi184', 148, { hp: 204, name: '40 TDI 204 CV' }], ['20tdi150', 143, { name: '35 TDI 163 CV', hp: 163, gear: 'D' }], ['20tsi190', 163, { hp: 265, name: '45 TFSI 265 CV' }], ['30tdi286', 168]]],
    ],
  },
  {
    b: 'Audi', m: 'Q7', seg: 'D-SUV', dmd: 0.82,
    g: [
      ['Q7 4M', 2015, 2024, 78000, [['30tdi286', 180, { name: '50 TDI quattro' }], ['30tdi245', 175, { hp: 231, name: '45 TDI quattro' }], ['30tdi204', 172]]],
    ],
  },
  {
    b: 'Audi', m: 'Q4 e-tron', seg: 'C-SUV', dmd: 0.84,
    g: [
      ['Q4 e-tron', 2021, 2025, 52500, [['psa_ev_136', 0, { hp: 204, name: '40 e-tron 204 CV', gear: 'E' }], ['psa_ev_156', 0, { hp: 299, name: '50 e-tron quattro 299 CV', gear: 'E' }]]],
    ],
  },

  // ---------------------------- SEAT --------------------------------------
  {
    b: 'Seat', m: 'Ibiza', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Ibiza V (KJ)', 2017, 2021, 19500, [['10mpi80', 116], ['10tsi95', 110], ['10tsi115', 114], ['16tdi90', 108], ['10tsi110', 112]]],
      ['Ibiza V restyling', 2021, 2025, 21500, [['10mpi80', 118], ['10tsi95', 111], ['10tsi110', 112], ['15tsi150', 121, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Seat', m: 'León', seg: 'Compacto', dmd: 1.03,
    g: [
      ['León 5F', 2017, 2020, 27500, [['20tdi150', 117, { gear: 'D' }], ['16tdi115', 110], ['14tsi150', 124, { gear: 'D' }], ['10tsi115', 112]]],
      ['León KL', 2020, 2025, 30500, [['20tdi150', 116, { gear: 'D' }], ['20tdi115', 114], ['15tsi130', 123], ['15etsi150', 120], ['10tsi110', 112]]],
    ],
  },
  {
    b: 'Seat', m: 'León ST', seg: 'Familiar', dmd: 1.02, body: 'Ranchera',
    g: [
      ['León ST 5F', 2017, 2020, 29500, [['20tdi150', 119, { gear: 'D' }], ['16tdi115', 112], ['15tsi150', 126, { gear: 'D' }]]],
      ['León ST KL', 2020, 2025, 32500, [['20tdi150', 118, { gear: 'D' }], ['15etsi150', 122]]],
    ],
  },
  {
    b: 'Seat', m: 'Arona', seg: 'B-SUV', dmd: 1.04,
    g: [
      ['Arona', 2018, 2025, 23500, [['10tsi95', 116], ['10tsi110', 114], ['15tsi150', 124, { gear: 'D' }], ['16tdi90', 110], ['20tdi150', 124, { hp: 95, name: '1.6 TDI 95 CV' }]]],
    ],
  },
  {
    b: 'Seat', m: 'Ateca', seg: 'C-SUV', dmd: 1.03,
    g: [
      ['Ateca', 2016, 2020, 33500, [['20tdi150', 128, { gear: 'D' }], ['16tdi115', 118], ['14tsi150', 132, { gear: 'D' }], ['10tsi115', 120]]],
      ['Ateca restyling', 2020, 2025, 36500, [['20tdi150', 126, { gear: 'D' }], ['15tsi150', 131, { gear: 'D' }], ['10tsi110', 119], ['20tdi150 4x4', 142, { name: '2.0 TDI 150 CV 4Drive', gear: 'D' }]]],
    ],
  },
  {
    b: 'Seat', m: 'Tarraco', seg: 'D-SUV', dmd: 0.97,
    g: [
      ['Tarraco', 2019, 2025, 42500, [['20tdi150', 138, { gear: 'D' }], ['20tdi150 4x4', 152, { name: '2.0 TDI 150 CV 4Drive', gear: 'D' }], ['15tsi150', 140, { gear: 'D' }], ['20tdi200', 158]]],
    ],
  },
  {
    b: 'Seat', m: 'Alhambra', seg: 'Monovolumen 7 plazas', dmd: 0.94,
    g: [
      ['Alhambra II', 2015, 2020, 42000, [['20tdi150', 138, { gear: 'D' }], ['20tdi184', 146], ['14tsi150', 148, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Seat', m: 'Toledo', seg: 'Berlina', dmd: 0.92,
    g: [
      ['Toledo IV', 2015, 2019, 21500, [['16tdi90', 108], ['10tsi95', 112], ['10mpi80', 118], ['14tsi125', 122]]],
    ],
  },

  // ---------------------------- CUPRA -------------------------------------
  {
    b: 'Cupra', m: 'Formentor', seg: 'C-SUV', dmd: 1.12,
    g: [
      ['Formentor', 2021, 2025, 42500, [['20tdi150', 132, { name: '2.0 TDI 150 CV', gear: 'D' }], ['15tsi150', 138, { gear: 'D' }], ['15etsi150', 135, { name: '1.5 eTSI 150 CV' }], ['20tsi245', 168], ['20tsi245', 175, { hp: 310, name: '2.0 TSI 310 CV 4Drive' }]]],
    ],
  },
  {
    b: 'Cupra', m: 'Ateca', seg: 'C-SUV', dmd: 1.0,
    g: [
      ['Ateca Cupra', 2019, 2024, 47500, [['20tsi245', 175, { hp: 300, name: '2.0 TSI 300 CV 4Drive' }], ['20tdi150', 130, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Cupra', m: 'León', seg: 'Compacto', dmd: 1.05,
    g: [
      ['León Cupra', 2020, 2025, 41500, [['20tsi245', 158, { hp: 300, name: '2.0 TSI 300 CV' }], ['15etsi150', 122, { name: '1.5 eTSI 150 CV' }], ['20tdi150', 118, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Cupra', m: 'Born', seg: 'Compacto', dmd: 0.88,
    g: [
      ['Born', 2021, 2025, 39500, [['psa_ev_136', 0, { hp: 204, name: 'Eléctrico 204 CV', gear: 'E' }], ['psa_ev_156', 0, { hp: 231, name: 'Eléctrico VZ 231 CV', gear: 'E' }]]],
    ],
  },

  // ---------------------------- SKODA -------------------------------------
  {
    b: 'Skoda', m: 'Fabia', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Fabia III', 2015, 2021, 17500, [['10mpi80', 112], ['10tsi95', 108], ['14tdi90', 106, { cc: 1422, name: '1.4 TDI 90 CV' }], ['10tsi110', 110]]],
      ['Fabia IV', 2021, 2025, 20500, [['10mpi80', 114], ['10tsi95', 110], ['10tsi110', 112], ['15tsi150', 120, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Skoda', m: 'Octavia', seg: 'Compacto', dmd: 1.08,
    g: [
      ['Octavia III', 2015, 2019, 26500, [['20tdi150', 116, { gear: 'D' }], ['16tdi115', 108], ['14tsi150', 122, { gear: 'D' }], ['10tsi115', 112]]],
      ['Octavia IV', 2020, 2025, 31500, [['20tdi150', 114, { gear: 'D' }], ['20tdi115', 112], ['15tsi150', 121, { gear: 'D' }], ['10tsi110', 110], ['20tdi200', 125]]],
    ],
  },
  {
    b: 'Skoda', m: 'Octavia Combi', seg: 'Familiar', dmd: 1.09, body: 'Ranchera',
    g: [
      ['Octavia Combi IV', 2020, 2025, 33500, [['20tdi150', 116, { gear: 'D' }], ['15tsi150', 123, { gear: 'D' }], ['20tdi200', 128], ['20tdi150 4x4', 130, { name: '2.0 TDI 150 CV 4x4', gear: 'D' }]]],
      ['Octavia Combi III', 2015, 2019, 28500, [['20tdi150', 118, { gear: 'D' }], ['16tdi115', 110], ['14tsi150', 124, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Skoda', m: 'Superb', seg: 'Berlina', dmd: 1.0,
    g: [
      ['Superb III', 2015, 2023, 39500, [['20tdi150', 118, { gear: 'D' }], ['20tdi190', 124, { hp: 190, name: '2.0 TDI 190 CV', gear: 'D' }], ['15tsi150', 126, { gear: 'D' }], ['30tdi245', 145, { hp: 190, name: '2.0 TDI 190 CV 4x4' }]]],
      ['Superb IV', 2024, 2025, 46500, [['20tdi150', 116, { gear: 'D' }], ['15etsi150', 122], ['20tdi200', 128]]],
    ],
  },
  {
    b: 'Skoda', m: 'Superb Combi', seg: 'Familiar', dmd: 1.02, body: 'Ranchera',
    g: [
      ['Superb Combi III', 2016, 2023, 41500, [['20tdi150', 120, { gear: 'D' }], ['20tdi190', 126, { hp: 190, name: '2.0 TDI 190 CV', gear: 'D' }], ['15tsi150', 128, { gear: 'D' }]]],
    ],
  },
  {
    b: 'Skoda', m: 'Kamiq', seg: 'B-SUV', dmd: 1.03,
    g: [
      ['Kamiq', 2019, 2025, 25500, [['10tsi95', 114], ['10tsi110', 112], ['15tsi150', 122, { gear: 'D' }], ['20tdi115', 116]]],
    ],
  },
  {
    b: 'Skoda', m: 'Karoq', seg: 'C-SUV', dmd: 1.04,
    g: [
      ['Karoq', 2017, 2025, 32500, [['20tdi150', 128, { gear: 'D' }], ['16tdi115', 118], ['15tsi150', 130, { gear: 'D' }], ['10tsi110', 120], ['20tdi150 4x4', 142, { name: '2.0 TDI 150 CV 4x4', gear: 'D' }]]],
    ],
  },
  {
    b: 'Skoda', m: 'Kodiaq', seg: 'D-SUV', dmd: 1.06,
    g: [
      ['Kodiaq I', 2017, 2024, 41500, [['20tdi150', 138, { gear: 'D' }], ['20tdi190', 148, { hp: 190, name: '2.0 TDI 190 CV 4x4', gear: 'D' }], ['15tsi150', 140, { gear: 'D' }], ['20tdi150 4x4', 145, { name: '2.0 TDI 150 CV 4x4', gear: 'D' }]]],
      ['Kodiaq II', 2024, 2025, 47500, [['20tdi150', 132, { gear: 'D' }], ['15etsi150', 134], ['20tdi200', 142]]],
    ],
  },
  {
    b: 'Skoda', m: 'Scala', seg: 'Compacto', dmd: 0.99,
    g: [
      ['Scala', 2019, 2025, 24500, [['10tsi95', 112], ['10tsi110', 111], ['15tsi150', 120, { gear: 'D' }], ['20tdi115', 115]]],
    ],
  },
];

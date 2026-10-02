// ============================================================================
//  CATÁLOGO — PREMIUM (BMW, Mini, Mercedes-Benz, Porsche, Volvo, Jaguar,
//  Land Rover, Lexus, Tesla)
// ============================================================================

export const PREMIUM = [
  // ------------------------------- BMW -----------------------------------
  {
    b: 'BMW', m: 'Serie 1', seg: 'Compacto', dmd: 0.98,
    g: [
      ['Serie 1 F20 LCI', 2015, 2019, 33500, [['b47_116', 108, { name: '116d 116 CV' }], ['b47_150', 110, { name: '118d 150 CV' }], ['b47_190', 116, { name: '120d 190 CV' }], ['b38_109', 112, { name: '116i 109 CV' }], ['b48_184', 128, { name: '120i 184 CV' }]]],
      ['Serie 1 F40', 2019, 2025, 36500, [['b47_116', 110, { name: '116d 116 CV' }], ['b47_150', 112, { name: '118d 150 CV' }], ['b38_140', 116, { name: '118i 140 CV' }], ['b48_192', 130, { name: '120i 192 CV' }], ['b48_306', 148, { name: 'M135i 306 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 2 Gran Coupé', seg: 'Berlina', dmd: 0.95,
    g: [
      ['Serie 2 F44', 2020, 2025, 38500, [['b47_150', 114, { name: '218d 150 CV' }], ['b38_140', 118, { name: '218i 140 CV' }], ['b48_306', 150, { name: 'M235i 306 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 3', seg: 'Berlina', dmd: 1.02,
    g: [
      ['Serie 3 F30 LCI', 2015, 2019, 42500, [['b47_150', 108, { name: '318d 150 CV' }], ['b47_190', 112, { name: '320d 190 CV' }], ['b47_231', 120, { name: '325d 231 CV' }], ['b48_184', 126, { name: '320i 184 CV' }], ['n47_184', 116, { name: '320d 184 CV (N47)' }]]],
      ['Serie 3 G20', 2019, 2025, 48500, [['b47_150', 110, { name: '318d 150 CV' }], ['b47_190', 114, { name: '320d 190 CV' }], ['b47_190', 122, { name: '320d xDrive 190 CV' }], ['b48_184', 130, { name: '320i 184 CV' }], ['b57_265', 138, { name: '330d 265 CV' }], ['b48_phev', 38, { name: '330e 292 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 3 Touring', seg: 'Familiar', dmd: 1.04, body: 'Ranchera',
    g: [
      ['Serie 3 Touring F31', 2015, 2019, 45500, [['b47_150', 110, { name: '318d 150 CV' }], ['b47_190', 114, { name: '320d 190 CV' }], ['b57_265', 138, { name: '330d 265 CV' }]]],
      ['Serie 3 Touring G21', 2019, 2025, 51500, [['b47_150', 112, { name: '318d 150 CV' }], ['b47_190', 116, { name: '320d 190 CV' }], ['b47_190', 124, { name: '320d xDrive 190 CV' }], ['b57_286', 140, { name: '330d 286 CV' }], ['b48_184', 132, { name: '320i 184 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 4', seg: 'Coupé', dmd: 0.94,
    g: [
      ['Serie 4 F32', 2015, 2020, 48500, [['b47_190', 116, { name: '420d 190 CV' }], ['b47_150', 112, { name: '418d 150 CV' }], ['b48_184', 130, { name: '420i 184 CV' }], ['b48_252', 148, { name: '430i 252 CV' }]]],
      ['Serie 4 G22', 2020, 2025, 54500, [['b47_190', 118, { name: '420d 190 CV' }], ['b48_184', 132, { name: '420i 184 CV' }], ['b57_286', 145, { name: '430d 286 CV' }], ['b48_phev', 40, { name: '430e 292 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 5', seg: 'Berlina', dmd: 0.9,
    g: [
      ['Serie 5 G30', 2017, 2023, 62500, [['b47_190', 118, { name: '520d 190 CV' }], ['b47_150', 114, { name: '518d 150 CV' }], ['b57_265', 142, { name: '530d 265 CV' }], ['b48_252', 148, { name: '530i 252 CV' }], ['b47_phev', 42, { name: '530e 292 CV' }]]],
      ['Serie 5 G60', 2024, 2025, 72500, [['b47_190', 120, { name: '520d 197 CV', hp: 197 }], ['b57_286', 145, { name: '540d 286 CV' }], ['b48_258', 150, { name: '530i 258 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 5 Touring', seg: 'Familiar', dmd: 0.93, body: 'Ranchera',
    g: [
      ['Serie 5 Touring G31', 2017, 2023, 65500, [['b47_190', 120, { name: '520d 190 CV' }], ['b57_265', 145, { name: '530d 265 CV' }], ['b48_252', 150, { name: '530i 252 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'X1', seg: 'C-SUV', dmd: 1.03,
    g: [
      ['X1 F48', 2016, 2022, 40500, [['b47_116', 118, { name: '16d 116 CV' }], ['b47_150', 120, { name: '18d 150 CV' }], ['b47_190', 128, { name: '20d 190 CV' }], ['b38_140', 124, { name: '18i 140 CV' }], ['b48_192', 136, { name: '20i 192 CV' }]]],
      ['X1 U11', 2022, 2025, 47500, [['b47_150', 122, { name: 'sDrive18d 150 CV' }], ['b47_190', 130, { name: 'xDrive20d 190 CV' }], ['b38_136', 126, { name: 'sDrive18i 136 CV' }], ['b48_258', 145, { name: 'xDrive23i 218 CV', hp: 218 }]]],
    ],
  },
  {
    b: 'BMW', m: 'X2', seg: 'C-SUV', dmd: 0.96,
    g: [
      ['X2 F39', 2018, 2023, 43500, [['b47_150', 124, { name: '18d 150 CV' }], ['b47_190', 132, { name: '20d 190 CV' }], ['b38_140', 128, { name: '18i 140 CV' }], ['b48_192', 140, { name: '20i 192 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'X3', seg: 'D-SUV', dmd: 1.0,
    g: [
      ['X3 F25 LCI', 2014, 2017, 51500, [['b47_190', 130, { name: '20d 190 CV' }], ['n47_184', 132, { name: '20d 184 CV (N47)' }], ['n57_258', 152, { name: '30d 258 CV' }], ['b48_252', 148, { name: '28i 245 CV', hp: 245 }]]],
      ['X3 G01', 2018, 2024, 58500, [['b47_190', 134, { name: '20d 190 CV' }], ['b47_150', 128, { name: '18d 150 CV' }], ['b57_265', 152, { name: '30d 265 CV' }], ['b48_252', 150, { name: '30i 252 CV' }], ['b47_phev', 45, { name: '30e 292 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'X4', seg: 'D-SUV', dmd: 0.95,
    g: [
      ['X4 G02', 2018, 2024, 64500, [['b47_190', 136, { name: '20d 190 CV' }], ['b57_265', 155, { name: '30d 265 CV' }], ['b48_252', 152, { name: '30i 252 CV' }]]],
    ],
  },
  {
    b: 'BMW', m: 'X5', seg: 'D-SUV', dmd: 0.82,
    g: [
      ['X5 F15', 2014, 2018, 76500, [['n57_258', 158, { name: '30d 258 CV' }], ['b57_265', 160, { name: '30d 265 CV' }], ['b48_306', 172, { name: '40i 340 CV', hp: 340 }]]],
      ['X5 G05', 2018, 2025, 88500, [['b57_286', 165, { name: '30d 286 CV' }], ['b57_340', 175, { name: '40d 340 CV' }], ['b58_340', 185, { name: '40i 340 CV' }], ['b48_phev', 48, { name: '45e 394 CV', hp: 394 }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 2 Active Tourer', seg: 'Monovolumen', dmd: 0.9,
    g: [
      ['Active Tourer F45', 2015, 2021, 37500, [['b47_116', 116, { name: '216d 116 CV' }], ['b47_150', 118, { name: '218d 150 CV' }], ['b38_136', 122, { name: '218i 136 CV' }], ['b48_192', 134, { name: '220i 192 CV' }]]],
      ['Active Tourer U06', 2021, 2025, 44500, [['b47_150', 118, { name: '218d 150 CV' }], ['b38_136', 124, { name: '218i 136 CV' }], ['b48_258', 142, { name: '220i 218 CV', hp: 218 }], ['b38_140', 40, { name: '225xe PHEV 245 CV', hp: 245, fuel: 'P' }]]],
    ],
  },
  {
    b: 'BMW', m: 'Serie 2 Gran Tourer', seg: 'Monovolumen 7 plazas', dmd: 0.88,
    g: [
      ['Gran Tourer F46', 2015, 2021, 39500, [['b47_116', 118, { name: '216d 116 CV' }], ['b47_150', 120, { name: '218d 150 CV' }], ['b38_136', 124, { name: '218i 136 CV' }]]],
    ],
  },

  // ------------------------------ MINI ------------------------------------
  {
    b: 'Mini', m: 'Cooper 3p', seg: 'Urbano', dmd: 0.98,
    g: [
      ['Mini F56', 2015, 2023, 27500, [['b38_109', 110, { name: 'One 102 CV', hp: 102 }], ['b38_136', 112, { name: 'Cooper 136 CV' }], ['b48_192', 128, { name: 'Cooper S 192 CV' }], ['b47_116', 108, { name: 'One D 116 CV' }], ['b47_150', 110, { name: 'Cooper D 150 CV' }]]],
    ],
  },
  {
    b: 'Mini', m: 'Countryman', seg: 'B-SUV', dmd: 0.96,
    g: [
      ['Countryman F60', 2017, 2023, 38500, [['b38_140', 124, { name: 'Cooper 136 CV', hp: 136 }], ['b47_150', 122, { name: 'Cooper D 150 CV' }], ['b48_192', 138, { name: 'Cooper S 192 CV' }], ['b47_190', 130, { name: 'Cooper SD 190 CV' }], ['b38_140', 42, { name: 'Cooper S E PHEV 220 CV', hp: 220, fuel: 'P' }]]],
    ],
  },

  // --------------------------- MERCEDES-BENZ ------------------------------
  {
    b: 'Mercedes-Benz', m: 'Clase A', seg: 'Compacto', dmd: 0.99,
    g: [
      ['Clase A W176', 2015, 2018, 33500, [['om651_136', 108, { name: 'A 180 d 136 CV' }], ['m274_156', 122, { name: 'A 200 156 CV' }], ['om651_170', 116, { name: 'A 200 d 170 CV' }]]],
      ['Clase A W177', 2018, 2025, 38500, [['om654_150', 110, { name: 'A 180 d 116 CV', hp: 116 }], ['om654_150', 114, { name: 'A 200 d 150 CV' }], ['m254_170', 122, { name: 'A 200 163 CV', hp: 163 }], ['m274_156', 120, { name: 'A 180 136 CV', hp: 136 }], ['m254_204', 132, { name: 'A 250 224 CV', hp: 224 }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'Clase B', seg: 'Monovolumen', dmd: 0.9,
    g: [
      ['Clase B W246', 2015, 2019, 34500, [['om651_136', 112, { name: 'B 180 d 136 CV' }], ['m274_156', 126, { name: 'B 200 156 CV' }]]],
      ['Clase B W247', 2019, 2025, 39500, [['om654_150', 114, { name: 'B 200 d 150 CV' }], ['m254_170', 124, { name: 'B 180 136 CV', hp: 136 }], ['m254_204', 134, { name: 'B 200 163 CV', hp: 163 }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'Clase C', seg: 'Berlina', dmd: 1.0,
    g: [
      ['Clase C W205', 2015, 2021, 46500, [['om651_136', 110, { name: 'C 200 d 136 CV' }], ['om654_150', 112, { name: 'C 200 d 150 CV' }], ['om654_194', 118, { name: 'C 220 d 194 CV' }], ['m274_156', 124, { name: 'C 180 156 CV' }], ['m274_211', 138, { name: 'C 250 211 CV' }]]],
      ['Clase C W206', 2021, 2025, 53500, [['om654_150', 116, { name: 'C 200 d 163 CV', hp: 163 }], ['om654_194', 120, { name: 'C 220 d 200 CV', hp: 200 }], ['m254_170', 128, { name: 'C 180 170 CV' }], ['m254_204', 134, { name: 'C 200 204 CV' }], ['om654_phev', 32, { name: 'C 300 de 313 CV', hp: 313 }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'Clase C Estate', seg: 'Familiar', dmd: 1.02, body: 'Ranchera',
    g: [
      ['Clase C Estate S205', 2015, 2021, 48500, [['om654_150', 116, { name: 'C 200 d 150 CV' }], ['om654_194', 122, { name: 'C 220 d 194 CV' }], ['m274_156', 128, { name: 'C 180 156 CV' }]]],
      ['Clase C Estate S206', 2021, 2025, 55500, [['om654_194', 124, { name: 'C 220 d 200 CV', hp: 200 }], ['m254_204', 136, { name: 'C 200 204 CV' }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'Clase E', seg: 'Berlina', dmd: 0.88,
    g: [
      ['Clase E W213', 2016, 2023, 62500, [['om654_194', 120, { name: 'E 220 d 194 CV' }], ['om654_150', 116, { name: 'E 200 d 150 CV' }], ['om654_265', 132, { name: 'E 300 d 265 CV' }], ['m274_211', 142, { name: 'E 250 211 CV' }], ['m254_258', 148, { name: 'E 300 258 CV' }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'GLA', seg: 'B-SUV', dmd: 0.97,
    g: [
      ['GLA X156', 2015, 2020, 40500, [['om651_136', 118, { name: 'GLA 200 d 136 CV' }], ['om654_150', 120, { name: 'GLA 200 d 150 CV' }], ['m274_156', 132, { name: 'GLA 200 156 CV' }]]],
      ['GLA H247', 2020, 2025, 46500, [['om654_150', 122, { name: 'GLA 200 d 150 CV' }], ['m254_170', 130, { name: 'GLA 200 163 CV', hp: 163 }], ['om654_194', 132, { name: 'GLA 220 d 190 CV', hp: 190 }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'GLC', seg: 'D-SUV', dmd: 1.0,
    g: [
      ['GLC X253', 2016, 2022, 56500, [['om654_150', 130, { name: 'GLC 220 d 170 CV', hp: 170 }], ['om654_194', 136, { name: 'GLC 220 d 194 CV' }], ['om654_265', 146, { name: 'GLC 300 d 265 CV' }], ['m274_211', 150, { name: 'GLC 300 245 CV', hp: 245 }]]],
      ['GLC X254', 2022, 2025, 66500, [['om654_194', 138, { name: 'GLC 220 d 197 CV', hp: 197 }], ['om654_265', 148, { name: 'GLC 300 d 269 CV', hp: 269 }], ['m254_204', 152, { name: 'GLC 300 258 CV', hp: 258 }], ['om654_phev', 30, { name: 'GLC 300 de 333 CV', hp: 333 }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'GLB', seg: 'C-SUV', dmd: 0.98,
    g: [
      ['GLB X247', 2019, 2025, 49500, [['om654_150', 128, { name: 'GLB 200 d 150 CV' }], ['om654_194', 136, { name: 'GLB 220 d 190 CV', hp: 190 }], ['m254_170', 138, { name: 'GLB 200 163 CV', hp: 163 }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'Vito / Clase V', seg: 'Furgoneta Combi', dmd: 1.08, body: 'Furgón pasajeros',
    g: [
      ['Vito W447', 2015, 2024, 52500, [['om651_136', 178, { name: '114 CDI 136 CV' }], ['om654_150', 182, { name: '116 CDI 163 CV', hp: 163 }], ['om654_194', 190, { name: '119 CDI 190 CV' }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'Sprinter', seg: 'Furgón grande', dmd: 1.02, body: 'Furgón',
    g: [
      ['Sprinter W907', 2018, 2025, 55500, [['om654_150', 205, { name: '314 CDI 143 CV', hp: 143 }], ['om654_194', 212, { name: '316 CDI 190 CV' }], ['om654_265', 220, { name: '319 CDI 265 CV' }]]],
    ],
  },
  {
    b: 'Mercedes-Benz', m: 'CLA', seg: 'Berlina', dmd: 0.95,
    g: [
      ['CLA C118', 2019, 2025, 44500, [['om654_150', 116, { name: 'CLA 200 d 150 CV' }], ['m254_170', 128, { name: 'CLA 200 163 CV', hp: 163 }], ['m254_204', 138, { name: 'CLA 250 224 CV', hp: 224 }]]],
    ],
  },

  // ------------------------------ PORSCHE ---------------------------------
  {
    b: 'Porsche', m: 'Macan', seg: 'D-SUV', dmd: 0.95,
    g: [
      ['Macan I', 2015, 2021, 68500, [['b48_252', 175, { name: 'Macan 252 CV' }], ['b48_306', 185, { name: 'Macan S 354 CV', hp: 354 }], ['b47_190', 155, { name: 'Macan S Diesel 258 CV', hp: 258, fuel: 'D' }]]],
      ['Macan I restyling', 2022, 2024, 78500, [['porsche20_265', 180, {}], ['porsche29_380', 192, {}]]],
    ],
  },
  {
    b: 'Porsche', m: 'Cayenne', seg: 'D-SUV', dmd: 0.8,
    g: [
      ['Cayenne II', 2014, 2018, 88500, [['b57_265', 185, { name: 'Cayenne S Diesel 385 CV', hp: 385 }], ['porsche36_420', 205, {}]]],
      ['Cayenne III', 2018, 2025, 105000, [['b58_340', 195, { name: 'Cayenne 340 CV' }], ['b57_286', 190, { name: 'Cayenne Diesel 286 CV' }], ['porsche29_440', 210, {}]]],
    ],
  },

  // ------------------------------- VOLVO ----------------------------------
  {
    b: 'Volvo', m: 'V40', seg: 'Compacto', dmd: 0.9,
    g: [
      ['V40', 2015, 2019, 33500, [['vl_d3_163', 112, { hp: 120, name: 'D2 120 CV' }], ['vl_d4_190', 118, { hp: 190, name: 'D4 190 CV' }], ['b38_140', 124, { hp: 122, name: 'T2 122 CV', fuel: 'G' }]]],
    ],
  },
  {
    b: 'Volvo', m: 'XC40', seg: 'C-SUV', dmd: 0.96,
    g: [
      ['XC40', 2018, 2025, 45500, [['vl_d3_163', 122, { hp: 150, name: 'D3 150 CV' }], ['vl_b3_163', 128, { name: 'B3 163 CV' }], ['vl_b4_197', 138, { name: 'B4 197 CV' }], ['vl_t8_455', 45, { hp: 262, name: 'T4 Recharge PHEV 262 CV' }]]],
    ],
  },
  {
    b: 'Volvo', m: 'XC60', seg: 'D-SUV', dmd: 0.94,
    g: [
      ['XC60 II', 2017, 2025, 58500, [['vl_d4_190', 132, { hp: 190, name: 'D4 190 CV' }], ['vl_b4_197', 138, { name: 'B4 197 CV' }], ['vl_b5_250', 148, { name: 'B5 250 CV' }], ['vl_t8_455', 48, { name: 'T8 Recharge 455 CV' }]]],
    ],
  },
  {
    b: 'Volvo', m: 'V60', seg: 'Familiar', dmd: 0.92, body: 'Ranchera',
    g: [
      ['V60 II', 2018, 2025, 51500, [['vl_d4_190', 126, { hp: 190, name: 'D4 190 CV' }], ['vl_b3_163', 124, { name: 'B3 163 CV' }], ['vl_b4_197', 130, { name: 'B4 197 CV' }], ['vl_t8_455', 42, { hp: 340, name: 'T6 Recharge 340 CV' }]]],
    ],
  },
  {
    b: 'Volvo', m: 'XC90', seg: 'D-SUV', dmd: 0.82,
    g: [
      ['XC90 II', 2015, 2024, 78500, [['vl_d4_190', 145, { hp: 235, name: 'D5 235 CV' }], ['vl_b5_250', 148, { name: 'B5 235 CV', hp: 235 }], ['vl_t8_455', 52, { name: 'T8 Recharge 455 CV' }]]],
    ],
  },

  // ------------------------- JAGUAR / LAND ROVER --------------------------
  {
    b: 'Land Rover', m: 'Range Rover Evoque', seg: 'C-SUV', dmd: 0.85,
    g: [
      ['Evoque II', 2019, 2025, 52500, [['jl20d180', 138, { name: 'D180 180 CV' }], ['jl20d240', 148, { name: 'D240 240 CV' }], ['jl20p250', 158, { name: 'P250 250 CV' }], ['jl20p300', 42, { name: 'P300e 309 CV' }]]],
    ],
  },
  {
    b: 'Land Rover', m: 'Discovery Sport', seg: 'C-SUV', dmd: 0.82,
    g: [
      ['Discovery Sport', 2015, 2025, 51500, [['jl20d180', 142, { name: 'D180 180 CV' }], ['jl20p250', 162, { name: 'P250 250 CV' }], ['jl20p300', 45, { name: 'P300e 309 CV' }]]],
    ],
  },
  {
    b: 'Land Rover', m: 'Defender', seg: 'Todoterreno', dmd: 1.05,
    g: [
      ['Defender L663', 2020, 2025, 82500, [['jl20d240', 195, { name: 'D200 200 CV', hp: 200 }], ['jl30d300', 205, { name: 'D300 300 CV' }], ['jl30p400', 55, { name: 'P400 400 CV' }]]],
    ],
  },
  {
    b: 'Jaguar', m: 'F-Pace', seg: 'D-SUV', dmd: 0.78,
    g: [
      ['F-Pace', 2016, 2025, 66500, [['jl20d180', 145, { name: '20d 180 CV' }], ['jl30d300', 165, { name: '30d 300 CV' }], ['jl20p250', 168, { name: '25t 250 CV' }], ['jl30p400', 50, { name: 'P400e 404 CV' }]]],
    ],
  },
  {
    b: 'Jaguar', m: 'XE', seg: 'Berlina', dmd: 0.75,
    g: [
      ['XE', 2015, 2024, 48500, [['jl20d180', 118, { name: '20d 180 CV' }], ['jl20p250', 138, { name: '25t 250 CV' }], ['n47_184', 116, { name: '20d 180 CV (motor N47 pre-2016)', hp: 180, rel: 'N47' }]]],
    ],
  },

  // ------------------------------- LEXUS ----------------------------------
  {
    b: 'Lexus', m: 'UX', seg: 'C-SUV', dmd: 1.0,
    g: [
      ['UX 250h', 2019, 2025, 44500, [['lex25h_218', 120, { name: 'UX 250h 184 CV', hp: 184 }], ['lex25h_218', 40, { name: 'UX 300e eléctrico 204 CV', hp: 204, fuel: 'E' }]]],
    ],
  },
  {
    b: 'Lexus', m: 'NX', seg: 'D-SUV', dmd: 1.02,
    g: [
      ['NX 300h', 2015, 2021, 51500, [['lex25h_218', 135, { hp: 197, name: 'NX 300h 197 CV' }]]],
      ['NX 350h', 2022, 2025, 62500, [['lex25h_218', 128, { hp: 243, name: 'NX 350h 243 CV' }], ['lex25t_245', 155, { name: 'NX 350 279 CV', hp: 279 }]]],
    ],
  },
  {
    b: 'Lexus', m: 'RX', seg: 'D-SUV', dmd: 0.9,
    g: [
      ['RX 450h', 2016, 2023, 76500, [['lex35h_350', 158, { name: 'RX 450h 313 CV', hp: 313 }]]],
    ],
  },

  // ------------------------------- TESLA ----------------------------------
  {
    b: 'Tesla', m: 'Model 3', seg: 'Berlina', dmd: 0.95,
    g: [
      ['Model 3', 2019, 2025, 46500, [['ts_model3', 0, {}], ['ts_model3lr', 0, {}], ['ts_modelyperf', 0, { name: 'Performance 460 CV' }]]],
    ],
  },
  {
    b: 'Tesla', m: 'Model Y', seg: 'C-SUV', dmd: 1.0,
    g: [
      ['Model Y', 2021, 2025, 52500, [['ts_model3', 0, { name: 'Eléctrico RWD 299 CV', hp: 299 }], ['ts_model3lr', 0, { name: 'Long Range AWD 378 CV', hp: 378 }]]],
    ],
  },
];

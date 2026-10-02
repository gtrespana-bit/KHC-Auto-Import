// ============================================================================
//  CATÁLOGO — ASIA (Toyota, Hyundai, Kia, Mazda, Nissan, Honda, Mitsubishi,
//  Subaru, Suzuki, SsangYong)
// ============================================================================

export const ASIATICOS = [
  // ------------------------------- TOYOTA ---------------------------------
  {
    b: 'Toyota', m: 'Yaris', seg: 'Urbano', dmd: 1.08,
    g: [
      ['Yaris III', 2015, 2020, 17500, [['toy15_111', 118], ['toy18h_122', 84], ['toy14d_90', 104]]],
      ['Yaris IV', 2020, 2025, 22500, [['toy15h_116', 98], ['toy15_111', 116], ['toy18h_140', 102]]],
    ],
  },
  {
    b: 'Toyota', m: 'Corolla', seg: 'Compacto', dmd: 1.07,
    g: [
      ['Corolla E210', 2019, 2025, 28500, [['toy18h_122', 100], ['toy20h_184', 112], ['toy15_111', 124]]],
      ['Auris II', 2015, 2019, 23500, [['toy18h_122', 92], ['toy14d_90', 108], ['toy12_69', 112, { hp: 99, name: '1.2 Turbo 116 CV', cc: 1197, rel: 'TOY_GAS' }]]],
    ],
  },
  {
    b: 'Toyota', m: 'Corolla Touring Sports', seg: 'Familiar', dmd: 1.08, body: 'Ranchera',
    g: [
      ['Corolla TS E210', 2019, 2025, 30500, [['toy18h_122', 102], ['toy20h_184', 114]]],
    ],
  },
  {
    b: 'Toyota', m: 'C-HR', seg: 'B-SUV', dmd: 1.16,
    g: [
      ['C-HR I', 2017, 2023, 29500, [['toy18h_122', 110], ['toy20h_184', 120], ['toy15_111', 132]]],
      ['C-HR II', 2024, 2025, 36500, [['toy18h_140', 108], ['toy20h_197', 116], ['toy25phev_306', 30]]],
    ],
  },
  {
    b: 'Toyota', m: 'RAV4', seg: 'C-SUV', dmd: 1.14,
    g: [
      ['RAV4 IV', 2015, 2018, 36500, [['toy20d_143', 130, { cc: 1998, name: '2.0 D-4D 143 CV', hp: 143, fuel: 'D', gear: 'M', rel: 'TOY_D' }], ['toy15_111', 148, { hp: 152, name: '2.0 VVT-i 152 CV', cc: 1987 }], ['toy18h_122', 120, { hp: 197, name: '2.5 Hybrid 197 CV', cc: 2494, fuel: 'H', gear: 'C', rel: 'HSD' }]]],
      ['RAV4 V', 2019, 2025, 42500, [['toy25h_218', 128], ['toy25h_218 4x4', 135, { name: '2.5 Hybrid 222 CV AWD-i', hp: 222 }], ['toy25phev_306', 26]]],
    ],
  },
  {
    b: 'Toyota', m: 'Yaris Cross', seg: 'B-SUV', dmd: 1.12,
    g: [
      ['Yaris Cross', 2021, 2025, 27500, [['toy15h_116', 108], ['toy15h_116 4x4', 112, { name: '1.5 Hybrid AWD-i 116 CV' }], ['toy15_111', 120]]],
    ],
  },
  {
    b: 'Toyota', m: 'Camry', seg: 'Berlina', dmd: 0.95,
    g: [
      ['Camry VIII', 2019, 2025, 42500, [['toy25h_218', 122]]],
    ],
  },
  {
    b: 'Toyota', m: 'Land Cruiser', seg: 'Todoterreno', dmd: 1.25,
    g: [
      ['Land Cruiser 150', 2015, 2024, 62500, [['toy28d_177', 195], ['toy28d_204', 205]]],
    ],
  },
  {
    b: 'Toyota', m: 'Hilux', seg: 'Pick-up', dmd: 1.15, body: 'Pick-up 4x4',
    g: [
      ['Hilux VIII', 2016, 2025, 42500, [['toy28d_204', 210], ['toy28d_177', 200]]],
    ],
  },
  {
    b: 'Toyota', m: 'Proace Verso', seg: 'Furgoneta Combi', dmd: 1.02, body: 'Furgón pasajeros',
    g: [
      ['Proace Verso', 2016, 2025, 42500, [['psa20bhd150', 165], ['psa20bhd180', 172], ['psa15bhd130', 158]]],
    ],
  },
  {
    b: 'Toyota', m: 'Aygo', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Aygo II', 2015, 2022, 12500, [['toy10_72', 98, { cc: 998, name: '1.0 VVT-i 72 CV', hp: 72, fuel: 'G', gear: 'M', rel: 'TOY_GAS' }]]],
    ],
  },

  // ------------------------------- HYUNDAI --------------------------------
  {
    b: 'Hyundai', m: 'i10', seg: 'Urbano', dmd: 1.0,
    g: [
      ['i10 III', 2020, 2025, 14500, [['hkg10_100', 108, { hp: 67, name: '1.0 MPI 67 CV', fuel: 'G' }], ['hkg10_100', 110]]],
    ],
  },
  {
    b: 'Hyundai', m: 'i20', seg: 'Urbano', dmd: 1.0,
    g: [
      ['i20 III', 2020, 2025, 18500, [['hkg10_100', 110], ['hkg10_120', 112], ['hkg16_180', 120, { hp: 204, name: '1.6 T-GDi N 204 CV' }]]],
    ],
  },
  {
    b: 'Hyundai', m: 'i30', seg: 'Compacto', dmd: 1.0,
    g: [
      ['i30 III', 2017, 2025, 24500, [['hkd16_136', 106], ['hkg14_140', 122], ['hkd16mhev_136', 108], ['hkg16_177', 130]]],
    ],
  },
  {
    b: 'Hyundai', m: 'Tucson', seg: 'C-SUV', dmd: 1.1,
    g: [
      ['Tucson TL', 2016, 2020, 31500, [['hkd16_136', 122], ['hkd16mhev_136', 124], ['hkg16_177', 138], ['hkd20_185', 140], ['hkg16gdi_132', 142]]],
      ['Tucson NX4', 2021, 2025, 38500, [['hkd16mhev_136', 126], ['hkg16_180', 140], ['hkg16hev_141', 118], ['hkg20hev_192', 132], ['hkg16phev_141', 32, { hp: 265, name: '1.6 T-GDi PHEV 265 CV' }]]],
    ],
  },
  {
    b: 'Hyundai', m: 'Santa Fe', seg: 'D-SUV', dmd: 1.02,
    g: [
      ['Santa Fe TM', 2018, 2024, 51500, [['hkd22_200', 168], ['hkd22_193', 162], ['hkg20hev_192', 155]]],
      ['Santa Fe III', 2013, 2018, 42500, [['hkd22_200', 172], ['hkd20_185', 165], ['hkg16gdi_132', 175, { hp: 188, name: '2.4 GDi 188 CV', cc: 2359 }]]],
    ],
  },
  {
    b: 'Hyundai', m: 'Kona', seg: 'B-SUV', dmd: 1.04,
    g: [
      ['Kona I', 2018, 2023, 26500, [['hkg10_120', 118], ['hkd16_136', 112], ['hk_ev_204', 0], ['hkg16hev_141', 108]]],
      ['Kona II', 2023, 2025, 32500, [['hkg16_180', 132], ['hkg16hev_141', 112], ['hk_ev_204', 0]]],
    ],
  },
  {
    b: 'Hyundai', m: 'Bayon', seg: 'B-SUV', dmd: 1.0,
    g: [
      ['Bayon', 2021, 2025, 21500, [['hkg10_100', 112], ['hkg10_120', 114], ['hkg16hev_141', 110, { hp: 100, name: '1.0 T-GDi 48V 100 CV' }]]],
    ],
  },
  {
    b: 'Hyundai', m: 'i20 Cross', seg: 'B-SUV', dmd: 0.99,
    g: [
      ['i20 Cross', 2016, 2021, 19500, [['hkg10_100', 112], ['hkg14_140', 118]]],
    ],
  },
  {
    b: 'Hyundai', m: 'IONIQ 5', seg: 'C-SUV', dmd: 0.9,
    g: [
      ['IONIQ 5', 2021, 2025, 46500, [['hk_ev_204', 0], ['hk_ev_325', 0]]],
    ],
  },
  {
    b: 'Hyundai', m: 'H-1 / Staria', seg: 'Furgoneta Combi', dmd: 1.0, body: 'Furgón pasajeros',
    g: [
      ['H-1 Travel', 2015, 2021, 36500, [['hkd25_170', 190, { cc: 2497, name: '2.5 CRDi 170 CV', hp: 170, fuel: 'D', gear: 'A', rel: 'R20' }]]],
    ],
  },

  // --------------------------------- KIA ----------------------------------
  {
    b: 'Kia', m: 'Picanto', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Picanto III', 2017, 2025, 13500, [['hkg10_100', 106, { hp: 67, name: '1.0 CVVT 67 CV', fuel: 'G' }], ['hkg10_100', 108, { hp: 84, name: '1.2 CVVT 84 CV', cc: 1248, fuel: 'G' }]]],
    ],
  },
  {
    b: 'Kia', m: 'Rio', seg: 'Urbano', dmd: 0.99,
    g: [
      ['Rio IV', 2017, 2023, 17500, [['hkg10_100', 108], ['hkg12_84', 106, { cc: 1197, name: '1.2 CVVT 84 CV', hp: 84, fuel: 'G', gear: 'M', rel: 'KAPPA' }], ['hkg14_140', 116, { hp: 100, name: '1.0 T-GDi 100 CV' }]]],
    ],
  },
  {
    b: 'Kia', m: 'Ceed', seg: 'Compacto', dmd: 1.02,
    g: [
      ['Ceed III', 2018, 2025, 24500, [['hkd16_136', 108], ['hkg14_140', 120], ['hkg10_120', 112], ['hkg16hev_141', 106]]],
    ],
  },
  {
    b: 'Kia', m: 'Proceed', seg: 'Familiar', dmd: 1.0, body: 'Shooting brake',
    g: [
      ['Proceed III', 2019, 2025, 29500, [['hkd16_136', 110], ['hkg16_177', 130], ['hkg14_140', 122]]],
    ],
  },
  {
    b: 'Kia', m: 'Sportage', seg: 'C-SUV', dmd: 1.08,
    g: [
      ['Sportage QL', 2016, 2021, 31500, [['hkd16_136', 124], ['hkd16mhev_136', 126], ['hkg16_177', 140], ['hkd20_185', 142], ['hkg16gdi_132', 144]]],
      ['Sportage NQ5', 2021, 2025, 39500, [['hkd16mhev_136', 128], ['hkg16_180', 142], ['hkg16hev_141', 120], ['hkg16phev_141', 34, { hp: 265, name: '1.6 T-GDi PHEV 265 CV' }]]],
    ],
  },
  {
    b: 'Kia', m: 'Niro', seg: 'B-SUV', dmd: 1.06,
    g: [
      ['Niro I', 2016, 2022, 29500, [['hkg16hev_141', 100], ['hkg16phev_141', 30], ['hk_ev_204', 0]]],
      ['Niro II', 2022, 2025, 35500, [['hkg16hev_141', 102], ['hkg16phev_141', 32], ['hk_ev_204', 0]]],
    ],
  },
  {
    b: 'Kia', m: 'Sorento', seg: 'D-SUV', dmd: 0.98,
    g: [
      ['Sorento MQ4', 2020, 2025, 55500, [['hkd22_193', 168], ['hkg20hev_192', 158], ['hkg16phev_141', 40, { hp: 265, name: '1.6 T-GDi PHEV 265 CV' }]]],
      ['Sorento UM', 2015, 2020, 44500, [['hkd22_200', 175], ['hkd20_185', 168]]],
    ],
  },
  {
    b: 'Kia', m: 'Stonic', seg: 'B-SUV', dmd: 1.02,
    g: [
      ['Stonic', 2017, 2025, 20500, [['hkg10_100', 110], ['hkg10_120', 112], ['hkg12_84', 108, { cc: 1197, hp: 84, name: '1.2 CVVT 84 CV', fuel: 'G' }]]],
    ],
  },
  {
    b: 'Kia', m: 'XCeed', seg: 'C-SUV', dmd: 1.02,
    g: [
      ['XCeed', 2019, 2025, 27500, [['hkd16_136', 112], ['hkg14_140', 124], ['hkg16hev_141', 108], ['hkg16phev_141', 32, { hp: 141, name: '1.6 GDi PHEV 141 CV' }]]],
    ],
  },
  {
    b: 'Kia', m: 'EV6', seg: 'C-SUV', dmd: 0.9,
    g: [
      ['EV6', 2021, 2025, 49500, [['hk_ev_204', 0], ['hk_ev_325', 0]]],
    ],
  },

  // -------------------------------- MAZDA ---------------------------------
  {
    b: 'Mazda', m: 'Mazda 2', seg: 'Urbano', dmd: 0.98,
    g: [
      ['Mazda 2 DJ', 2015, 2024, 18500, [['mz15g90', 110, { cc: 1496, name: '1.5 Skyactiv-G 90 CV', hp: 90, fuel: 'G', gear: 'M', rel: 'SKYACTIV' }], ['mz20g122', 116, { hp: 115, name: '1.5 Skyactiv-G 115 CV' }], ['mz15d105', 104, { cc: 1499, name: '1.5 Skyactiv-D 105 CV', hp: 105, fuel: 'D', gear: 'M', rel: 'SKYACTIV_D' }]]],
    ],
  },
  {
    b: 'Mazda', m: 'Mazda 3', seg: 'Compacto', dmd: 1.0,
    g: [
      ['Mazda 3 BP', 2019, 2025, 28500, [['mz20g122', 122], ['mz30e200', 118], ['mz22d184', 126]]],
      ['Mazda 3 BM', 2014, 2019, 23500, [['mz20g122', 128, { hp: 120, name: '2.0 Skyactiv-G 120 CV' }], ['mz22d184', 118, { hp: 150, name: '2.2 Skyactiv-D 150 CV' }]]],
    ],
  },
  {
    b: 'Mazda', m: 'Mazda 6', seg: 'Berlina', dmd: 0.92,
    g: [
      ['Mazda 6 GL', 2015, 2023, 33500, [['mz20g165', 132, { hp: 165, name: '2.0 Skyactiv-G 165 CV' }], ['mz25g194', 148], ['mz22d184', 126]]],
    ],
  },
  {
    b: 'Mazda', m: 'CX-3', seg: 'B-SUV', dmd: 0.99,
    g: [
      ['CX-3', 2015, 2022, 24500, [['mz20g122', 130], ['mz22d184', 122, { hp: 105, name: '1.8 Skyactiv-D 105 CV', cc: 1759 }]]],
    ],
  },
  {
    b: 'Mazda', m: 'CX-30', seg: 'C-SUV', dmd: 1.03,
    g: [
      ['CX-30', 2019, 2025, 31500, [['mz20g122', 128], ['mz30e200', 124], ['mz22d184', 132]]],
    ],
  },
  {
    b: 'Mazda', m: 'CX-5', seg: 'C-SUV', dmd: 1.04,
    g: [
      ['CX-5 KF', 2017, 2025, 36500, [['mz20g165', 145], ['mz25g194', 158], ['mz22d184', 138]]],
      ['CX-5 KE', 2013, 2017, 30500, [['mz20g122', 148, { hp: 160, name: '2.0 Skyactiv-G 160 CV' }], ['mz22d184', 135, { hp: 150, name: '2.2 Skyactiv-D 150 CV' }]]],
    ],
  },
  {
    b: 'Mazda', m: 'MX-30', seg: 'B-SUV', dmd: 0.85,
    g: [
      ['MX-30', 2020, 2024, 34500, [['mz_ev_145', 0]]],
    ],
  },

  // -------------------------------- NISSAN --------------------------------
  {
    b: 'Nissan', m: 'Micra', seg: 'Urbano', dmd: 0.96,
    g: [
      ['Micra K14', 2017, 2024, 17500, [['rn10sce75', 108], ['rn10tce90', 106], ['rn15dci95', 98]]],
    ],
  },
  {
    b: 'Nissan', m: 'Juke', seg: 'B-SUV', dmd: 1.0,
    g: [
      ['Juke II', 2019, 2025, 24500, [['ns13digt140', 118, { hp: 114, name: '1.0 DIG-T 114 CV', cc: 999, cyl: 3 }], ['rne-tech145', 106, { hp: 143, name: '1.6 Hybrid 143 CV' }], ['ns15dci115', 112]]],
      ['Juke I', 2014, 2019, 20500, [['rn15dci115', 108], ['rn12tce115', 118, { hp: 117, name: '1.2 DIG-T 117 CV' }], ['ns10igt117', 120, { hp: 112, name: '1.6 112 CV', cc: 1598, cyl: 4, fuel: 'G' }]]],
    ],
  },
  {
    b: 'Nissan', m: 'Qashqai', seg: 'C-SUV', dmd: 1.06,
    g: [
      ['Qashqai J11', 2014, 2021, 28500, [['rn15dci115', 108], ['rn13digt140', 122, { hp: 140, name: '1.3 DIG-T 140 CV' }], ['rn16dci130', 118], ['rn12tce115', 124, { hp: 115, name: '1.2 DIG-T 115 CV' }]]],
      ['Qashqai J12', 2021, 2025, 34500, [['rn13digt140', 124, { hp: 140, name: '1.3 DIG-T 140 CV mild hybrid' }], ['ns_epower190', 108], ['ns15digt158', 118]]],
    ],
  },
  {
    b: 'Nissan', m: 'X-Trail', seg: 'D-SUV', dmd: 0.98,
    g: [
      ['X-Trail T32', 2014, 2022, 36500, [['rn16dci130', 130], ['rn20dci150', 140, { hp: 177, name: '2.0 dCi 177 CV' }], ['rn13digt140', 138, { hp: 158, name: '1.3 DIG-T 158 CV' }]]],
      ['X-Trail T33', 2022, 2025, 44500, [['ns_epower205', 118], ['ns15digt158', 128]]],
    ],
  },
  {
    b: 'Nissan', m: 'Leaf', seg: 'Compacto', dmd: 0.82,
    g: [
      ['Leaf ZE1', 2018, 2024, 33500, [['rn_ev_150', 0], ['rn_ev_218', 0]]],
    ],
  },
  {
    b: 'Nissan', m: 'NV200 / Evalia', seg: 'Furgoneta Combi', dmd: 1.0, body: 'Furgoneta mixta',
    g: [
      ['NV200', 2015, 2022, 22500, [['rn15dci115', 130, { hp: 110, name: '1.5 dCi 110 CV' }]]],
    ],
  },
  {
    b: 'Nissan', m: 'Navara', seg: 'Pick-up', dmd: 1.0, body: 'Pick-up 4x4',
    g: [
      ['Navara NP300', 2016, 2022, 42500, [['ns23dci150', 200, { hp: 160, name: '2.3 dCi 160 CV' }], ['ns23dci150', 210, { hp: 190, name: '2.3 dCi 190 CV' }]]],
    ],
  },

  // -------------------------------- HONDA ---------------------------------
  {
    b: 'Honda', m: 'Jazz', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Jazz IV', 2020, 2025, 23500, [['hn15hev131', 102, { hp: 109, name: '1.5 e:HEV 109 CV' }]]],
      ['Jazz III', 2015, 2020, 18500, [['hn13_102', 112, { cc: 1318, name: '1.3 i-VTEC 102 CV', hp: 102, fuel: 'G', gear: 'M', rel: 'HONDA_10' }], ['hn16idtec120', 104]]],
    ],
  },
  {
    b: 'Honda', m: 'Civic', seg: 'Compacto', dmd: 1.02,
    g: [
      ['Civic X', 2017, 2022, 26500, [['hn10vtec126', 118], ['hn15vtec182', 132], ['hn16idtec120', 108]]],
      ['Civic XI', 2022, 2025, 36500, [['hn20hev184', 108]]],
    ],
  },
  {
    b: 'Honda', m: 'HR-V', seg: 'B-SUV', dmd: 1.02,
    g: [
      ['HR-V III', 2021, 2025, 32500, [['hn15hev131', 112]]],
      ['HR-V II', 2015, 2021, 26500, [['hn15_130', 128, { cc: 1498, name: '1.5 i-VTEC 130 CV', hp: 130, fuel: 'G', gear: 'M', rel: 'HONDA_15' }], ['hn16idtec120', 110]]],
    ],
  },
  {
    b: 'Honda', m: 'CR-V', seg: 'C-SUV', dmd: 1.04,
    g: [
      ['CR-V V', 2018, 2023, 42500, [['hn15vtec182', 142, { hp: 173, name: '1.5 VTEC 173 CV' }], ['hn20hev184', 130], ['hn16idtec120', 122]]],
      ['CR-V VI', 2023, 2025, 52500, [['hn20hev184', 132, { hp: 184, name: '2.0 e:HEV 184 CV' }]]],
    ],
  },

  // ------------------------------- MITSUBISHI ------------------------------
  {
    b: 'Mitsubishi', m: 'ASX', seg: 'C-SUV', dmd: 0.95,
    g: [
      ['ASX', 2015, 2022, 25500, [['mm15mivec117', 130], ['mm16didi114', 122, { cc: 1560, name: '1.6 DI-D 114 CV', hp: 114, fuel: 'D', gear: 'M', rel: 'DV6' }]]],
      ['ASX II', 2023, 2025, 28500, [['rn13tce130', 124], ['rne-tech145', 106], ['rn15blue_115', 110]]],
    ],
  },
  {
    b: 'Mitsubishi', m: 'Outlander', seg: 'D-SUV', dmd: 0.98,
    g: [
      ['Outlander III', 2015, 2022, 36500, [['mm22did150', 145], ['mm24phev224', 40], ['mm15mivec117', 150, { hp: 150, name: '2.0 MIVEC 150 CV', cc: 1998 }]]],
    ],
  },
  {
    b: 'Mitsubishi', m: 'L200', seg: 'Pick-up', dmd: 1.0, body: 'Pick-up 4x4',
    g: [
      ['L200 VI', 2019, 2025, 38500, [['mm22did150', 205, { hp: 150, name: '2.2 DI-D 150 CV' }]]],
    ],
  },
  {
    b: 'Mitsubishi', m: 'Eclipse Cross', seg: 'C-SUV', dmd: 0.93,
    g: [
      ['Eclipse Cross', 2018, 2024, 30500, [['mm15mivec117', 142, { hp: 163, name: '1.5 Turbo 163 CV', cc: 1499 }], ['mm22did150', 150, { hp: 148, name: '2.2 DI-D 148 CV' }], ['mm24phev224', 42]]],
    ],
  },

  // -------------------------------- SUBARU --------------------------------
  {
    b: 'Subaru', m: 'XV', seg: 'C-SUV', dmd: 0.95,
    g: [
      ['XV II', 2017, 2023, 32500, [['sb20boxer150', 148], ['sb20eboxer150', 142], ['sb16boxer114', 138, { cc: 1600, name: '1.6 Boxer 114 CV', hp: 114, fuel: 'G', gear: 'C', rel: 'SUBARU_BOXER' }]]],
    ],
  },
  {
    b: 'Subaru', m: 'Forester', seg: 'C-SUV', dmd: 1.0,
    g: [
      ['Forester SK', 2019, 2025, 39500, [['sb20eboxer150', 148], ['sb25boxer169', 155], ['sb20boxer150', 152]]],
    ],
  },
  {
    b: 'Subaru', m: 'Outback', seg: 'Familiar', dmd: 0.95, body: 'Ranchera',
    g: [
      ['Outback VI', 2020, 2025, 47500, [['sb25boxer169', 162]]],
    ],
  },

  // -------------------------------- SUZUKI --------------------------------
  {
    b: 'Suzuki', m: 'Swift', seg: 'Urbano', dmd: 1.04,
    g: [
      ['Swift VI', 2017, 2024, 16500, [['sz12dualjet83', 106], ['sz14booster129', 114], ['sz14hybrid95', 104]]],
      ['Swift VII', 2024, 2025, 19500, [['sz12dualjet83', 104], ['sz14hybrid95', 102]]],
    ],
  },
  {
    b: 'Suzuki', m: 'Ignis', seg: 'Urbano', dmd: 1.0,
    g: [
      ['Ignis', 2017, 2025, 16500, [['sz12dualjet83', 108], ['sz14hybrid95', 104, { hp: 83, name: '1.2 Hybrid 83 CV', cc: 1242, rel: 'SUZUKI_K' }]]],
    ],
  },
  {
    b: 'Suzuki', m: 'Vitara', seg: 'B-SUV', dmd: 1.03,
    g: [
      ['Vitara LY', 2015, 2025, 22500, [['sz12dualjet83', 118], ['sz14booster129', 122], ['sz14hybrid95', 114], ['sz16didi120', 124, { cc: 1598, name: '1.6 DDiS 120 CV', hp: 120, fuel: 'D', gear: 'M', rel: 'MJET16' }]]],
    ],
  },
  {
    b: 'Suzuki', m: 'S-Cross', seg: 'C-SUV', dmd: 1.0,
    g: [
      ['S-Cross', 2016, 2025, 24500, [['sz14booster129', 124], ['sz14hybrid95', 116], ['sz15hybrid116', 112]]],
    ],
  },
  {
    b: 'Suzuki', m: 'Jimny', seg: 'Todoterreno', dmd: 1.2,
    g: [
      ['Jimny IV', 2018, 2025, 22500, [['sz15_102', 155, { cc: 1462, name: '1.5 VVT 102 CV', hp: 102, fuel: 'G', gear: 'M', rel: 'SUZUKI_K' }]]],
    ],
  },
  {
    b: 'Suzuki', m: 'Across', seg: 'D-SUV', dmd: 0.95,
    g: [
      ['Across', 2020, 2024, 55500, [['toy25phev_306', 28]]],
    ],
  },

  // ------------------------------- SSANGYONG -------------------------------
  {
    b: 'SsangYong', m: 'Korando', seg: 'C-SUV', dmd: 0.9,
    g: [
      ['Korando C300', 2019, 2025, 28500, [['ss22d178', 140, { hp: 136, name: '1.6 Diésel 136 CV', cc: 1597, rel: 'MJET16' }], ['ss15t163', 150, { cc: 1497, name: '1.5 Turbo 163 CV', hp: 163, fuel: 'G', gear: 'A', rel: 'SSY_22' }]]],
    ],
  },
  {
    b: 'SsangYong', m: 'Musso', seg: 'Pick-up', dmd: 0.95, body: 'Pick-up 4x4',
    g: [
      ['Musso Grand', 2019, 2025, 36500, [['ss22d178', 215]]],
    ],
  },
];

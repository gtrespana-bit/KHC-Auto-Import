// ============================================================================
// BASE DE DATOS DE VEHÍCULOS PARA EL BUSCADOR / AUTOCOMPLETADO DEL SIMULADOR
// ----------------------------------------------------------------------------
// Cada entrada lleva:
//  - Datos técnicos homologados (cc, cilindros, CV, CO2 WLTP orientativo)
//  - newPrice: precio medio de venta orientativo (tablas Hacienda, vehículo
//    nuevo) para calcular el VALOR VENAL. Verificar con la Orden HFP vigente.
//  - reliability: 'gold' (motor roca) | 'ok' (neutro) | 'warn' (precaución)
//                 | 'banned' (PROHIBIDO importar)
//  - dePrice / esPrice: horquillas orientativas de compra en Alemania y venta
//    en Galicia para un ejemplar de 4-6 años y 80-120k km.
// ============================================================================

import { computeCvf } from '../utils/calculations.js';

const V = (o) => ({
  transmission: "Automático",
  cyl: 4,
  reliability: "ok",
  reliabilityTitle: null,
  reliabilityNote: null,
  dePrice: null,
  esPrice: null,
  ...o,
  cvf: o.cvf ?? Number(computeCvf(o.cc, o.cyl ?? 4).toFixed(2)),
});

import R, { RELIABILITY_LEVELS } from './catalog/reliability.js';
import { GENERATED_DB } from './catalog/index.js';
import { normalizeKm } from './catalog/marketEvidence.js';

export { R as RELIABILITY_NOTES, RELIABILITY_LEVELS };

export const CURATED_DB = [
  // ======================== VOLKSWAGEN ====================================
  V({ id: "vw-golf75-20tdi", brand: "Volkswagen", model: "Golf 7.5", segment: "Compacto", version: "2.0 TDI 150 CV DSG (R-Line / Highline)", engine: "2.0 TDI EA288 (DFGA)", fuel: "Diésel", years: [2017, 2020], cv: 150, cc: 1968, co2: 118, badge: "C", newPrice: 31500, dePrice: [12500, 16000], esPrice: [17500, 20500], ...R.EA288 }),
  V({ id: "vw-golf75-15tsi", brand: "Volkswagen", model: "Golf 7.5", segment: "Compacto", version: "1.5 TSI EVO 150 CV DSG", engine: "1.5 TSI EA211 evo (DADA)", fuel: "Gasolina", years: [2017, 2020], cv: 150, cc: 1498, co2: 122, badge: "C", newPrice: 29800, dePrice: [12000, 15500], esPrice: [16900, 19900], ...R.EA211_15 }),
  V({ id: "vw-golf8-20tdi", brand: "Volkswagen", model: "Golf 8", segment: "Compacto", version: "2.0 TDI 150 CV DSG Life / Style", engine: "2.0 TDI EA288 evo (DTTC)", fuel: "Diésel", years: [2020, 2024], cv: 150, cc: 1968, co2: 116, badge: "C", newPrice: 36500, dePrice: [17000, 22000], esPrice: [22900, 27900], ...R.EA288 }),
  V({ id: "vw-tiguan-20tdi-4m", brand: "Volkswagen", model: "Tiguan II", segment: "C-SUV", version: "2.0 TDI 150 CV DSG 4Motion Advance / R-Line", engine: "2.0 TDI EA288 (DFGA)", fuel: "Diésel", years: [2016, 2020], cv: 150, cc: 1968, co2: 148, badge: "C", newPrice: 41500, dePrice: [16000, 21000], esPrice: [22500, 27500], ...R.EA288 }),
  V({ id: "vw-tiguan-20tdi-4x2", brand: "Volkswagen", model: "Tiguan II", segment: "C-SUV", version: "2.0 TDI 150 CV DSG 4x2", engine: "2.0 TDI EA288 (DFGA)", fuel: "Diésel", years: [2016, 2020], cv: 150, cc: 1968, co2: 130, badge: "C", newPrice: 38500, dePrice: [15000, 19500], esPrice: [20900, 25500], ...R.EA288 }),
  V({ id: "vw-caddy4-20tdi", brand: "Volkswagen", model: "Caddy 4", segment: "Furgoneta Combi", version: "2.0 TDI 150 CV DSG Comfortline Combi 5p", engine: "2.0 TDI EA288 (DFSD)", fuel: "Diésel", years: [2015, 2020], cv: 150, cc: 1968, co2: 134, badge: "C", newPrice: 32000, dePrice: [13500, 17500], esPrice: [19900, 23900], ...R.EA288 }),
  V({ id: "vw-caddy4-20tdi-102", brand: "Volkswagen", model: "Caddy 4", segment: "Furgoneta Combi", version: "2.0 TDI 102 CV Manual Trendline Combi", engine: "2.0 TDI EA288 (DFSF)", fuel: "Diésel", years: [2015, 2020], cv: 102, cc: 1968, co2: 126, badge: "C", newPrice: 26500, dePrice: [10500, 14000], esPrice: [15900, 19500], transmission: "Manual", ...R.EA288 }),
  V({ id: "vw-t6-150", brand: "Volkswagen", model: "Transporter / Caravelle T6", segment: "Furgoneta Combi", version: "2.0 TDI 150 CV Monoturbo (Manual / DSG)", engine: "2.0 TDI CXFA / DNAA", fuel: "Diésel", years: [2015, 2023], cv: 150, cc: 1968, co2: 168, badge: "C", newPrice: 48000, dePrice: [22000, 30000], esPrice: [29900, 38900], ...R.T6_150 }),
  V({ id: "vw-t6-bitdi", brand: "Volkswagen", model: "Transporter / Multivan T6", segment: "Furgoneta Combi", version: "2.0 BiTDI 204 CV DSG 4Motion", engine: "2.0 BiTDI CXEB / CFCA", fuel: "Diésel", years: [2010, 2019], cv: 204, cc: 1968, co2: 189, badge: "C", newPrice: 58000, dePrice: [24000, 34000], esPrice: [30000, 40000], ...R.BITDI }),
  V({ id: "vw-sharan-20tdi", brand: "Volkswagen", model: "Sharan", segment: "Monovolumen 7 plazas", version: "2.0 TDI 150 CV DSG Advance 7 plazas", engine: "2.0 TDI EA288 (DFLA)", fuel: "Diésel", years: [2015, 2021], cv: 150, cc: 1968, co2: 138, badge: "C", newPrice: 42000, dePrice: [15000, 20000], esPrice: [21500, 26500], ...R.EA288 }),
  V({ id: "vw-polo-10tsi", brand: "Volkswagen", model: "Polo VI", segment: "Urbano", version: "1.0 TSI 95 / 110 CV Advance Manual", engine: "1.0 TSI EA211 (DKLA)", fuel: "Gasolina", years: [2017, 2023], cv: 95, cc: 999, cyl: 3, co2: 112, badge: "C", newPrice: 21500, dePrice: [10000, 13500], esPrice: [13900, 17500], transmission: "Manual", ...R.EA211_10 }),

  // ======================== AUDI ==========================================
  V({ id: "audi-a3-8v-20tdi", brand: "Audi", model: "A3 Sportback (8V)", segment: "Compacto", version: "2.0 TDI 150 CV S tronic S line", engine: "2.0 TDI EA288 (CRLB / DFGA)", fuel: "Diésel", years: [2016, 2020], cv: 150, cc: 1968, co2: 116, badge: "C", newPrice: 36500, dePrice: [14500, 19000], esPrice: [20500, 24900], ...R.EA288 }),
  V({ id: "audi-q3-f3-35tdi", brand: "Audi", model: "Q3 (F3)", segment: "C-SUV", version: "35 TDI 150 CV S tronic S line", engine: "2.0 TDI EA288 evo (DFGA)", fuel: "Diésel", years: [2018, 2023], cv: 150, cc: 1968, co2: 138, badge: "C", newPrice: 44500, dePrice: [21000, 27000], esPrice: [27900, 34500], ...R.EA288 }),
  V({ id: "audi-q3-8u-20tdi", brand: "Audi", model: "Q3 (8U)", segment: "C-SUV", version: "2.0 TDI 150 CV S tronic", engine: "2.0 TDI EA288 (CUVC)", fuel: "Diésel", years: [2015, 2018], cv: 150, cc: 1968, co2: 127, badge: "C", newPrice: 38000, dePrice: [13500, 17500], esPrice: [18900, 23500], ...R.EA288 }),
  V({ id: "audi-a4-b9-20tdi", brand: "Audi", model: "A4 Avant (B9)", segment: "Familiar", version: "2.0 TDI 150 CV S tronic S line", engine: "2.0 TDI EA288 (DEUA)", fuel: "Diésel", years: [2016, 2019], cv: 150, cc: 1968, co2: 115, badge: "C", newPrice: 44000, dePrice: [16500, 21500], esPrice: [22900, 28500], ...R.EA288 }),

  // ======================== SEAT / CUPRA / SKODA ==========================
  V({ id: "seat-leon-5f-20tdi", brand: "Seat", model: "León ST (5F Restyling)", segment: "Familiar", version: "2.0 TDI 150 CV DSG FR", engine: "2.0 TDI EA288 (DFGA)", fuel: "Diésel", years: [2017, 2020], cv: 150, cc: 1968, co2: 117, badge: "C", newPrice: 28500, dePrice: [11500, 15000], esPrice: [16500, 19900], ...R.EA288 }),
  V({ id: "seat-ateca-20tdi", brand: "Seat", model: "Ateca", segment: "C-SUV", version: "2.0 TDI 150 CV DSG FR / Xcellence", engine: "2.0 TDI EA288 (DFGA)", fuel: "Diésel", years: [2016, 2020], cv: 150, cc: 1968, co2: 128, badge: "C", newPrice: 33500, dePrice: [14000, 18500], esPrice: [19900, 24500], ...R.EA288 }),
  V({ id: "seat-arona-10tsi", brand: "Seat", model: "Arona", segment: "B-SUV", version: "1.0 TSI 110 / 115 CV FR / Style", engine: "1.0 TSI EA211 (DKRF)", fuel: "Gasolina", years: [2018, 2024], cv: 110, cc: 999, cyl: 3, co2: 118, badge: "C", newPrice: 23500, dePrice: [11000, 15000], esPrice: [15500, 19500], transmission: "Manual", ...R.EA211_10 }),
  V({ id: "seat-alhambra-20tdi", brand: "Seat", model: "Alhambra", segment: "Monovolumen 7 plazas", version: "2.0 TDI 150 CV DSG Style 7 plazas", engine: "2.0 TDI EA288 (DFLA)", fuel: "Diésel", years: [2015, 2020], cv: 150, cc: 1968, co2: 139, badge: "C", newPrice: 38500, dePrice: [14000, 18500], esPrice: [19900, 24900], ...R.EA288 }),
  V({ id: "cupra-formentor-15tsi", brand: "Cupra", model: "Formentor", segment: "C-SUV", version: "1.5 TSI 150 CV DSG 7v", engine: "1.5 TSI EA211 evo (DPCA)", fuel: "Gasolina", years: [2020, 2024], cv: 150, cc: 1498, co2: 128, badge: "C", newPrice: 34500, dePrice: [19000, 24000], esPrice: [25500, 30500], ...R.EA211_15 }),
  V({ id: "cupra-formentor-20tdi", brand: "Cupra", model: "Formentor", segment: "C-SUV", version: "2.0 TDI 150 CV DSG", engine: "2.0 TDI EA288 evo (DTUA)", fuel: "Diésel", years: [2020, 2024], cv: 150, cc: 1968, co2: 124, badge: "C", newPrice: 35500, dePrice: [19500, 24500], esPrice: [26000, 31000], ...R.EA288 }),
  V({ id: "skoda-octavia-20tdi", brand: "Skoda", model: "Octavia Combi III", segment: "Familiar", version: "2.0 TDI 150 CV DSG Style / RS", engine: "2.0 TDI EA288 (DFGA)", fuel: "Diésel", years: [2017, 2020], cv: 150, cc: 1968, co2: 116, badge: "C", newPrice: 30500, dePrice: [11500, 15500], esPrice: [16900, 20900], ...R.EA288 }),
  V({ id: "skoda-kodiaq-20tdi", brand: "Skoda", model: "Kodiaq", segment: "D-SUV 7 plazas", version: "2.0 TDI 150 CV DSG 4x4 7 plazas", engine: "2.0 TDI EA288 (DFGA)", fuel: "Diésel", years: [2017, 2021], cv: 150, cc: 1968, co2: 148, badge: "C", newPrice: 40500, dePrice: [17500, 23000], esPrice: [24500, 29900], ...R.EA288 }),

  // ======================== BMW ===========================================
  V({ id: "bmw-f20-118d-b47", brand: "BMW", model: "Serie 1 (F20 LCI)", segment: "Compacto", version: "118d 150 CV Steptronic (B47)", engine: "B47D20A", fuel: "Diésel", years: [2015, 2019], cv: 150, cc: 1995, co2: 112, badge: "C", newPrice: 33500, dePrice: [13000, 17500], esPrice: [18500, 22900], ...R.B47 }),
  V({ id: "bmw-f20-120d-b47", brand: "BMW", model: "Serie 1 (F20 LCI)", segment: "Compacto", version: "120d 190 CV Steptronic M Sport", engine: "B47D20A", fuel: "Diésel", years: [2015, 2019], cv: 190, cc: 1995, co2: 118, badge: "C", newPrice: 38500, dePrice: [15000, 20000], esPrice: [21000, 25900], ...R.B47 }),
  V({ id: "bmw-f20-118d-n47", brand: "BMW", model: "Serie 1 (F20 pre-LCI)", segment: "Compacto", version: "118d / 120d 143-184 CV (N47)", engine: "N47D20C", fuel: "Diésel", years: [2011, 2015], cv: 143, cc: 1995, co2: 118, badge: "C", newPrice: 31000, dePrice: [8500, 12000], esPrice: [12500, 15900], ...R.N47 }),
  V({ id: "bmw-f31-320d-b47", brand: "BMW", model: "Serie 3 Touring (F31 LCI)", segment: "Familiar", version: "320d xDrive 190 CV Steptronic", engine: "B47D20A", fuel: "Diésel", years: [2015, 2019], cv: 190, cc: 1995, co2: 124, badge: "C", newPrice: 48500, dePrice: [17000, 23000], esPrice: [23900, 29900], ...R.B47 }),
  V({ id: "bmw-f30-320d-n47", brand: "BMW", model: "Serie 3 (F30 pre-LCI)", segment: "Berlina", version: "318d / 320d 143-184 CV (N47)", engine: "N47D20C", fuel: "Diésel", years: [2012, 2015], cv: 184, cc: 1995, co2: 120, badge: "C", newPrice: 41000, dePrice: [10000, 14000], esPrice: [14500, 18900], ...R.N47 }),
  V({ id: "bmw-x1-f48-18d", brand: "BMW", model: "X1 (F48)", segment: "C-SUV", version: "sDrive18d 150 CV Steptronic xLine", engine: "B47C20A", fuel: "Diésel", years: [2016, 2022], cv: 150, cc: 1995, co2: 124, badge: "C", newPrice: 40500, dePrice: [15500, 21000], esPrice: [21900, 27500], ...R.B47 }),
  V({ id: "bmw-x1-f48-20d", brand: "BMW", model: "X1 (F48)", segment: "C-SUV", version: "xDrive20d 190 CV Steptronic M Sport", engine: "B47C20A", fuel: "Diésel", years: [2016, 2022], cv: 190, cc: 1995, co2: 134, badge: "C", newPrice: 47500, dePrice: [18500, 24500], esPrice: [25500, 31500], ...R.B47 }),
  V({ id: "bmw-f46-218d", brand: "BMW", model: "Serie 2 Gran Tourer (F46)", segment: "Monovolumen 7 plazas", version: "218d 150 CV Steptronic 7 plazas", engine: "B47C20A", fuel: "Diésel", years: [2015, 2021], cv: 150, cc: 1995, co2: 122, badge: "C", newPrice: 38000, dePrice: [14000, 19000], esPrice: [19900, 24900], ...R.B47 }),

  // ======================== MERCEDES-BENZ =================================
  V({ id: "mb-w177-a200d", brand: "Mercedes-Benz", model: "Clase A (W177)", segment: "Compacto", version: "A 200 d 150 CV 8G-DCT AMG Line", engine: "OM654q DE20", fuel: "Diésel", years: [2018, 2023], cv: 150, cc: 1950, co2: 124, badge: "C", newPrice: 40500, dePrice: [18500, 23500], esPrice: [24900, 29900], ...R.OM654 }),
  V({ id: "mb-w177-a180d", brand: "Mercedes-Benz", model: "Clase A (W177)", segment: "Compacto", version: "A 180 d 116 CV 7G-DCT (OM608 Renault)", engine: "OM608 1.5 dCi (Renault K9K)", fuel: "Diésel", years: [2018, 2023], cv: 116, cc: 1461, co2: 114, badge: "C", newPrice: 34500, dePrice: [16000, 20500], esPrice: [21500, 25900], reliability: "ok", reliabilityTitle: "MOTOR CORRECTO: OM608 (base Renault 1.5 dCi)", reliabilityNote: "Fiable y económico, pero justo de potencia y con menor prestigio ante el cliente. El A 200 d (OM654) se vende mejor en A Coruña." }),
  V({ id: "mb-x118-cla200d", brand: "Mercedes-Benz", model: "CLA Shooting Brake (X118)", segment: "Familiar", version: "CLA 200 d 150 CV 8G-DCT AMG Line", engine: "OM654q DE20", fuel: "Diésel", years: [2019, 2023], cv: 150, cc: 1950, co2: 126, badge: "C", newPrice: 46500, dePrice: [22000, 27500], esPrice: [28900, 34500], ...R.OM654 }),
  V({ id: "mb-x253-glc220d", brand: "Mercedes-Benz", model: "GLC (X253 Restyling)", segment: "D-SUV", version: "GLC 220 d 4MATIC 194 CV 9G-Tronic", engine: "OM654 DE20", fuel: "Diésel", years: [2019, 2022], cv: 194, cc: 1950, co2: 152, badge: "C", newPrice: 58500, dePrice: [27000, 34000], esPrice: [34900, 42900], ...R.OM654 }),
  V({ id: "mb-w205-c220d", brand: "Mercedes-Benz", model: "Clase C Estate (S205 Restyling)", segment: "Familiar", version: "C 220 d 194 CV 9G-Tronic AMG Line", engine: "OM654 DE20", fuel: "Diésel", years: [2018, 2021], cv: 194, cc: 1950, co2: 132, badge: "C", newPrice: 50500, dePrice: [21000, 27000], esPrice: [28500, 34500], ...R.OM654 }),
  V({ id: "mb-w447-vito", brand: "Mercedes-Benz", model: "Vito / Clase V (W447)", segment: "Furgoneta Combi", version: "V 220 d / Vito 116 CDI 163 CV 9G-Tronic", engine: "OM654 DE20 / OM651 (pre-2019)", fuel: "Diésel", years: [2016, 2023], cv: 163, cc: 1950, co2: 172, badge: "C", newPrice: 62000, dePrice: [26000, 36000], esPrice: [34900, 46900], ...R.OM654 }),
  V({ id: "mb-w176-a200cdi", brand: "Mercedes-Benz", model: "Clase A (W176)", segment: "Compacto", version: "A 200 CDI / A 200 d 136 CV 7G-DCT", engine: "OM651 2.1 CDI / OM626 1.5", fuel: "Diésel", years: [2013, 2018], cv: 136, cc: 2143, co2: 108, badge: "C", newPrice: 33000, dePrice: [11000, 15000], esPrice: [15900, 19900], ...R.OM651 }),

  // ======================== TOYOTA / LEXUS ================================
  V({ id: "toyota-corolla-18h", brand: "Toyota", model: "Corolla (E210)", segment: "Compacto", version: "125H 1.8 Hybrid Active Tech e-CVT", engine: "2ZR-FXE 1.8 HSD", fuel: "Híbrido Gasolina", years: [2019, 2023], cv: 122, cc: 1798, co2: 102, badge: "ECO", newPrice: 27500, dePrice: [13500, 17500], esPrice: [18400, 22500], ...R.HSD }),
  V({ id: "toyota-corolla-ts-20h", brand: "Toyota", model: "Corolla Touring Sports", segment: "Familiar", version: "180H 2.0 Hybrid Style e-CVT", engine: "M20A-FXS 2.0 HSD", fuel: "Híbrido Gasolina", years: [2019, 2023], cv: 184, cc: 1987, co2: 112, badge: "ECO", newPrice: 33500, dePrice: [17000, 22000], esPrice: [22900, 27900], ...R.HSD }),
  V({ id: "toyota-chr-18h", brand: "Toyota", model: "C-HR", segment: "C-SUV", version: "125H 1.8 Hybrid Advance e-CVT", engine: "2ZR-FXE 1.8 HSD", fuel: "Híbrido Gasolina", years: [2017, 2023], cv: 122, cc: 1798, co2: 108, badge: "ECO", newPrice: 30500, dePrice: [15000, 19500], esPrice: [20500, 24900], ...R.HSD }),
  V({ id: "toyota-chr-20h", brand: "Toyota", model: "C-HR", segment: "C-SUV", version: "180H 2.0 Hybrid Dynamic Plus e-CVT", engine: "M20A-FXS 2.0 HSD", fuel: "Híbrido Gasolina", years: [2020, 2023], cv: 184, cc: 1987, co2: 119, badge: "ECO", newPrice: 34500, dePrice: [18500, 23000], esPrice: [24500, 28900], ...R.HSD }),
  V({ id: "toyota-rav4-25h-awd", brand: "Toyota", model: "RAV4 (XA50)", segment: "D-SUV", version: "2.5 Hybrid 222 CV AWD-i Advance", engine: "A25A-FXS 2.5 HSD", fuel: "Híbrido Gasolina", years: [2019, 2024], cv: 222, cc: 2487, co2: 126, badge: "ECO", newPrice: 44500, dePrice: [24000, 30000], esPrice: [30900, 37900], ...R.HSD }),
  V({ id: "toyota-rav4-25h-2wd", brand: "Toyota", model: "RAV4 (XA50)", segment: "D-SUV", version: "2.5 Hybrid 218 CV 4x2 Advance", engine: "A25A-FXS 2.5 HSD", fuel: "Híbrido Gasolina", years: [2019, 2024], cv: 218, cc: 2487, co2: 119, badge: "ECO", newPrice: 41500, dePrice: [22000, 28000], esPrice: [28900, 35500], ...R.HSD }),
  V({ id: "toyota-yaris-15h", brand: "Toyota", model: "Yaris (XP210)", segment: "Urbano", version: "120H 1.5 Hybrid Active Tech", engine: "M15A-FXE 1.5 HSD 3 cil.", fuel: "Híbrido Gasolina", years: [2020, 2024], cv: 116, cc: 1490, cyl: 3, co2: 92, badge: "ECO", newPrice: 24500, dePrice: [13500, 17000], esPrice: [17900, 21500], ...R.HSD }),
  V({ id: "toyota-yariscross-15h", brand: "Toyota", model: "Yaris Cross", segment: "B-SUV", version: "120H 1.5 Hybrid Active Tech", engine: "M15A-FXE 1.5 HSD 3 cil.", fuel: "Híbrido Gasolina", years: [2021, 2024], cv: 116, cc: 1490, cyl: 3, co2: 100, badge: "ECO", newPrice: 27500, dePrice: [16000, 20000], esPrice: [21500, 25500], ...R.HSD }),
  V({ id: "toyota-proace-verso", brand: "Toyota", model: "Proace Verso", segment: "Furgoneta Combi", version: "2.0 D-4D 150 CV Manual Family", engine: "2.0 HDi DW10FD (PSA)", fuel: "Diésel", years: [2016, 2022], cv: 150, cc: 1997, co2: 151, badge: "C", newPrice: 41000, dePrice: [19000, 25000], esPrice: [25900, 31900], transmission: "Manual", ...R.DW10 }),
  V({ id: "toyota-hilux-24", brand: "Toyota", model: "Hilux (AN120)", segment: "Pick-up 4x4", version: "2.4 D-4D 150 CV Doble Cabina 4x4", engine: "2GD-FTV", fuel: "Diésel", years: [2016, 2023], cv: 150, cc: 2393, co2: 204, badge: "C", newPrice: 39500, dePrice: [20000, 27000], esPrice: [27900, 34900], transmission: "Manual", ...R.GD_TOYOTA }),
  V({ id: "toyota-landcruiser-28", brand: "Toyota", model: "Land Cruiser (J150)", segment: "Todoterreno 4x4", version: "2.8 D-4D 177 / 204 CV Aut. VX", engine: "1GD-FTV", fuel: "Diésel", years: [2016, 2023], cv: 177, cc: 2755, co2: 194, badge: "C", newPrice: 58000, dePrice: [32000, 42000], esPrice: [39900, 52900], ...R.GD_TOYOTA }),
  V({ id: "lexus-ct200h", brand: "Lexus", model: "CT 200h", segment: "Compacto", version: "1.8 Hybrid 136 CV Business", engine: "2ZR-FXE 1.8 HSD", fuel: "Híbrido Gasolina", years: [2014, 2020], cv: 136, cc: 1798, co2: 94, badge: "ECO", newPrice: 30500, dePrice: [12000, 16500], esPrice: [16900, 21500], ...R.HSD }),

  // ======================== HYUNDAI / KIA =================================
  V({ id: "hyundai-tucson-nx4-16crdi", brand: "Hyundai", model: "Tucson (NX4)", segment: "C-SUV", version: "1.6 CRDi 136 CV 48V N-Line 4x2 DCT", engine: "Smartstream U3 1.6 CRDi MHEV", fuel: "Diésel Microhíbrido", years: [2021, 2024], cv: 136, cc: 1598, co2: 122, badge: "ECO", newPrice: 36500, dePrice: [19500, 25000], esPrice: [26500, 31900], ...R.U3_CRDI }),
  V({ id: "hyundai-tucson-tl-16crdi-48v", brand: "Hyundai", model: "Tucson (TL Restyling)", segment: "C-SUV", version: "1.6 CRDi 136 CV 48V N-Line 4x2 DCT", engine: "Smartstream U3 1.6 CRDi MHEV", fuel: "Diésel Microhíbrido", years: [2019, 2020], cv: 136, cc: 1598, co2: 122, badge: "ECO", newPrice: 32500, dePrice: [15000, 18500], esPrice: [21500, 24900], ...R.U3_CRDI }),
  V({ id: "hyundai-tucson-tl-17crdi", brand: "Hyundai", model: "Tucson (TL)", segment: "C-SUV", version: "1.7 CRDi 115 CV Manual Tecno", engine: "U2 1.7 CRDi", fuel: "Diésel", years: [2015, 2018], cv: 115, cc: 1685, co2: 119, badge: "C", newPrice: 27500, dePrice: [11000, 14500], esPrice: [15900, 19500], transmission: "Manual", ...R.U2_CRDI }),
  V({ id: "hyundai-tucson-16gdi", brand: "Hyundai", model: "Tucson (TL)", segment: "C-SUV", version: "1.6 GDI 132 CV Gasolina Atmosférico", engine: "Gamma 1.6 GDI", fuel: "Gasolina", years: [2015, 2020], cv: 132, cc: 1591, co2: 147, badge: "C", newPrice: 26000, dePrice: [10500, 14000], esPrice: [14900, 18500], transmission: "Manual", ...R.GDI16 }),
  V({ id: "hyundai-santafe-tm-22crdi", brand: "Hyundai", model: "Santa Fe (TM)", segment: "D-SUV 7 plazas", version: "2.2 CRDi 200 CV 4WD Aut. 7 plazas Style", engine: "R 2.2 CRDi", fuel: "Diésel", years: [2018, 2020], cv: 200, cc: 2199, co2: 169, badge: "C", newPrice: 49500, dePrice: [21000, 27000], esPrice: [28900, 35900], ...R.R22 }),
  V({ id: "hyundai-santafe-dm-22crdi", brand: "Hyundai", model: "Santa Fe (DM)", segment: "D-SUV 7 plazas", version: "2.2 CRDi 200 CV 4x4 Aut. 7 plazas", engine: "R 2.2 CRDi", fuel: "Diésel", years: [2013, 2018], cv: 200, cc: 2199, co2: 174, badge: "C", newPrice: 44000, dePrice: [15500, 20500], esPrice: [21900, 27500], ...R.R22 }),
  V({ id: "kia-sportage-ql-16crdi-mhev", brand: "Kia", model: "Sportage (QL Restyling)", segment: "C-SUV", version: "1.6 CRDi 136 CV MHEV GT-Line DCT 4x2", engine: "Smartstream U3 1.6 CRDi MHEV", fuel: "Diésel Microhíbrido", years: [2018, 2021], cv: 136, cc: 1598, co2: 123, badge: "ECO", newPrice: 33500, dePrice: [15000, 19500], esPrice: [21500, 25900], ...R.U3_CRDI }),
  V({ id: "kia-sportage-nq5-16crdi", brand: "Kia", model: "Sportage (NQ5)", segment: "C-SUV", version: "1.6 CRDi 136 CV MHEV GT-Line DCT", engine: "Smartstream U3 1.6 CRDi MHEV", fuel: "Diésel Microhíbrido", years: [2022, 2024], cv: 136, cc: 1598, co2: 126, badge: "ECO", newPrice: 38500, dePrice: [22000, 27500], esPrice: [28900, 34500], ...R.U3_CRDI }),
  V({ id: "kia-sportage-16gdi", brand: "Kia", model: "Sportage (QL)", segment: "C-SUV", version: "1.6 GDI 132 CV Gasolina Concept", engine: "Gamma 1.6 GDI", fuel: "Gasolina", years: [2016, 2021], cv: 132, cc: 1591, co2: 149, badge: "C", newPrice: 25500, dePrice: [10500, 14500], esPrice: [14900, 18900], transmission: "Manual", ...R.GDI16 }),
  V({ id: "kia-sorento-22crdi", brand: "Kia", model: "Sorento (UM)", segment: "D-SUV 7 plazas", version: "2.2 CRDi 200 CV 4x4 Aut. 7 plazas Emotion", engine: "R 2.2 CRDi", fuel: "Diésel", years: [2015, 2020], cv: 200, cc: 2199, co2: 170, badge: "C", newPrice: 46500, dePrice: [18000, 24000], esPrice: [24900, 31900], ...R.R22 }),
  V({ id: "kia-niro-hev", brand: "Kia", model: "Niro (DE)", segment: "B-SUV", version: "1.6 GDI HEV 141 CV Híbrido 6-DCT Drive", engine: "Kappa 1.6 GDI HEV", fuel: "Híbrido Gasolina", years: [2017, 2022], cv: 141, cc: 1580, co2: 101, badge: "ECO", newPrice: 28500, dePrice: [14000, 18500], esPrice: [19500, 23900], ...R.KAPPA_HEV }),
  V({ id: "hyundai-kona-hev", brand: "Hyundai", model: "Kona", segment: "B-SUV", version: "1.6 GDI HEV 141 CV Híbrido 6-DCT Tecno", engine: "Kappa 1.6 GDI HEV", fuel: "Híbrido Gasolina", years: [2019, 2023], cv: 141, cc: 1580, co2: 103, badge: "ECO", newPrice: 27500, dePrice: [14500, 19000], esPrice: [19900, 24500], ...R.KAPPA_HEV }),

  // ======================== MAZDA =========================================
  V({ id: "mazda-cx5-20g", brand: "Mazda", model: "CX-5 (KF)", segment: "C-SUV", version: "2.0 Skyactiv-G 165 CV Zenith 2WD", engine: "PE-VPS 2.0 Skyactiv-G", fuel: "Gasolina", years: [2017, 2022], cv: 165, cc: 1998, co2: 152, badge: "C", newPrice: 33500, dePrice: [15500, 20500], esPrice: [21500, 26500], transmission: "Manual", ...R.SKYACTIV }),
  V({ id: "mazda-3-bp-20g", brand: "Mazda", model: "Mazda3 (BP)", segment: "Compacto", version: "2.0 Skyactiv-G 122 CV M-Hybrid Zenith", engine: "PE-VPS 2.0 Skyactiv-G M-Hybrid 24V", fuel: "Gasolina Microhíbrido", years: [2019, 2023], cv: 122, cc: 1998, co2: 122, badge: "ECO", newPrice: 27500, dePrice: [14000, 18000], esPrice: [19500, 23500], transmission: "Manual", ...R.SKYACTIV }),
  V({ id: "mazda-cx30-20g", brand: "Mazda", model: "CX-30", segment: "B-SUV", version: "2.0 Skyactiv-G 122 CV M-Hybrid Evolution", engine: "PE-VPS 2.0 Skyactiv-G M-Hybrid 24V", fuel: "Gasolina Microhíbrido", years: [2019, 2023], cv: 122, cc: 1998, co2: 125, badge: "ECO", newPrice: 29500, dePrice: [15500, 19500], esPrice: [21500, 25500], transmission: "Manual", ...R.SKYACTIV }),

  // ======================== DACIA / RENAULT / NISSAN ======================
  V({ id: "dacia-duster-15dci-4x4", brand: "Dacia", model: "Duster II", segment: "Todoterreno 4x4", version: "1.5 dCi 115 CV 4x4 Prestige", engine: "K9K 1.5 dCi Gen 8", fuel: "Diésel", years: [2018, 2023], cv: 115, cc: 1461, co2: 128, badge: "C", newPrice: 21500, dePrice: [12000, 15500], esPrice: [16500, 20500], transmission: "Manual", ...R.K9K }),
  V({ id: "dacia-duster-12tce", brand: "Dacia", model: "Duster I/II", segment: "Todoterreno 4x4", version: "1.2 TCe 125 CV Gasolina 4x2/4x4", engine: "H5Ft 1.2 TCe", fuel: "Gasolina", years: [2013, 2018], cv: 125, cc: 1197, co2: 138, badge: "C", newPrice: 17500, dePrice: [7500, 10500], esPrice: [10500, 13900], transmission: "Manual", ...R.TCE12 }),
  V({ id: "renault-clio5-15dci", brand: "Renault", model: "Clio V", segment: "Urbano", version: "Blue dCi 85 / 100 CV Zen", engine: "K9K 1.5 Blue dCi", fuel: "Diésel", years: [2019, 2023], cv: 100, cc: 1461, co2: 100, badge: "C", newPrice: 20500, dePrice: [10000, 13500], esPrice: [13900, 17500], transmission: "Manual", ...R.K9K }),
  V({ id: "renault-clio5-ecog", brand: "Renault", model: "Clio V", segment: "Urbano", version: "1.0 TCe 100 CV ECO-G GLP", engine: "H4Dt 1.0 TCe GLP", fuel: "GLP / Gasolina", years: [2020, 2024], cv: 100, cc: 999, cyl: 3, co2: 107, badge: "ECO", newPrice: 19500, dePrice: [10500, 14000], esPrice: [14500, 18500], transmission: "Manual", reliability: "ok", reliabilityTitle: "MOTOR CORRECTO: 1.0 TCe H4Dt ECO-G", reliabilityNote: "Motor moderno de cadena (nada que ver con el 1.2 TCe H5Ft). Etiqueta ECO gracias al GLP. Comprobar historial de la correa de accesorios y revisión del sistema GLP." }),
  V({ id: "renault-megane4-12tce", brand: "Renault", model: "Mégane IV", segment: "Compacto", version: "1.2 TCe 130 CV Energy Zen", engine: "H5Ft 1.2 TCe", fuel: "Gasolina", years: [2016, 2018], cv: 130, cc: 1197, co2: 120, badge: "C", newPrice: 23500, dePrice: [8500, 11500], esPrice: [11900, 15500], transmission: "Manual", ...R.TCE12 }),
  V({ id: "renault-megane4-15dci", brand: "Renault", model: "Mégane IV Sport Tourer", segment: "Familiar", version: "1.5 dCi 115 CV Blue Zen / Limited", engine: "K9K 1.5 Blue dCi", fuel: "Diésel", years: [2018, 2022], cv: 115, cc: 1461, co2: 108, badge: "C", newPrice: 25500, dePrice: [11000, 14500], esPrice: [15500, 19500], transmission: "Manual", ...R.K9K }),
  V({ id: "renault-espace5-16dci", brand: "Renault", model: "Espace V", segment: "Monovolumen 7 plazas", version: "1.6 dCi 160 CV BiTurbo EDC Initiale", engine: "R9M 1.6 dCi Twin Turbo", fuel: "Diésel", years: [2015, 2019], cv: 160, cc: 1598, co2: 120, badge: "C", newPrice: 42000, dePrice: [12000, 17000], esPrice: [16900, 22500], ...R.DCI16_BI }),
  V({ id: "renault-trafic-16dci", brand: "Renault", model: "Trafic III / Opel Vivaro B", segment: "Furgoneta Combi", version: "1.6 dCi 145 CV BiTurbo Combi", engine: "R9M 1.6 dCi Twin Turbo", fuel: "Diésel", years: [2014, 2019], cv: 145, cc: 1598, co2: 155, badge: "C", newPrice: 33000, dePrice: [12500, 17500], esPrice: [17500, 23500], transmission: "Manual", ...R.DCI16_BI }),
  V({ id: "nissan-qashqai-12digt", brand: "Nissan", model: "Qashqai (J11)", segment: "C-SUV", version: "1.2 DIG-T 115 CV Acenta / N-Connecta", engine: "HRA2DDT 1.2 DIG-T (Renault H5Ft)", fuel: "Gasolina", years: [2014, 2018], cv: 115, cc: 1197, co2: 129, badge: "C", newPrice: 25500, dePrice: [9000, 12500], esPrice: [12900, 16500], transmission: "Manual", ...R.TCE12 }),
  V({ id: "nissan-qashqai-15dci-xtronic", brand: "Nissan", model: "Qashqai (J11)", segment: "C-SUV", version: "1.5 dCi / 1.6 dCi Xtronic CVT", engine: "K9K + CVT Jatco X-Tronic", fuel: "Diésel", years: [2014, 2021], cv: 115, cc: 1461, co2: 119, badge: "C", newPrice: 28500, dePrice: [11000, 15000], esPrice: [15500, 19900], ...R.CVT_XTRONIC }),
  V({ id: "nissan-qashqai-15dci-man", brand: "Nissan", model: "Qashqai (J11)", segment: "C-SUV", version: "1.5 dCi 115 CV Manual N-Connecta", engine: "K9K 1.5 dCi", fuel: "Diésel", years: [2014, 2021], cv: 115, cc: 1461, co2: 103, badge: "C", newPrice: 26500, dePrice: [11000, 14500], esPrice: [15900, 19500], transmission: "Manual", ...R.K9K }),

  // ======================== PEUGEOT / CITROËN / OPEL / DS =================
  V({ id: "peugeot-3008-12puretech", brand: "Peugeot", model: "3008 II", segment: "C-SUV", version: "1.2 PureTech 130 CV Allure / GT Line", engine: "EB2DTS 1.2 PureTech", fuel: "Gasolina", years: [2016, 2023], cv: 130, cc: 1199, cyl: 3, co2: 124, badge: "C", newPrice: 31500, dePrice: [13000, 18000], esPrice: [17900, 23500], ...R.PURETECH }),
  V({ id: "peugeot-3008-15bluehdi", brand: "Peugeot", model: "3008 II", segment: "C-SUV", version: "1.5 BlueHDi 130 CV EAT8 Allure", engine: "DV5RC 1.5 BlueHDi", fuel: "Diésel", years: [2018, 2023], cv: 130, cc: 1499, co2: 118, badge: "C", newPrice: 33500, dePrice: [14000, 19500], esPrice: [18900, 24900], ...R.BLUEHDI15 }),
  V({ id: "peugeot-3008-20bluehdi", brand: "Peugeot", model: "3008 II", segment: "C-SUV", version: "2.0 BlueHDi 150 / 180 CV EAT8 GT", engine: "DW10FC 2.0 BlueHDi", fuel: "Diésel", years: [2016, 2021], cv: 150, cc: 1997, co2: 128, badge: "C", newPrice: 37500, dePrice: [14500, 19500], esPrice: [19900, 25500], ...R.DW10 }),
  V({ id: "peugeot-308-12puretech", brand: "Peugeot", model: "308 II", segment: "Compacto", version: "1.2 PureTech 110 / 130 CV Allure", engine: "EB2DT 1.2 PureTech", fuel: "Gasolina", years: [2014, 2021], cv: 130, cc: 1199, cyl: 3, co2: 115, badge: "C", newPrice: 24500, dePrice: [9000, 13000], esPrice: [12500, 16900], ...R.PURETECH }),
  V({ id: "peugeot-2008-12puretech", brand: "Peugeot", model: "2008 II", segment: "B-SUV", version: "1.2 PureTech 100 / 130 CV Allure", engine: "EB2ADTS 1.2 PureTech", fuel: "Gasolina", years: [2019, 2023], cv: 130, cc: 1199, cyl: 3, co2: 120, badge: "C", newPrice: 26500, dePrice: [13000, 17500], esPrice: [17500, 22500], ...R.PURETECH }),
  V({ id: "peugeot-5008-12puretech", brand: "Peugeot", model: "5008 II", segment: "D-SUV 7 plazas", version: "1.2 PureTech 130 CV EAT8 7 plazas", engine: "EB2DTS 1.2 PureTech", fuel: "Gasolina", years: [2017, 2023], cv: 130, cc: 1199, cyl: 3, co2: 126, badge: "C", newPrice: 34500, dePrice: [15000, 20500], esPrice: [20500, 26500], ...R.PURETECH }),
  V({ id: "citroen-c4-12puretech", brand: "Citroën", model: "C4 / C4 Cactus", segment: "Compacto", version: "1.2 PureTech 110 / 130 CV Shine", engine: "EB2DT 1.2 PureTech", fuel: "Gasolina", years: [2014, 2023], cv: 130, cc: 1199, cyl: 3, co2: 118, badge: "C", newPrice: 24000, dePrice: [9500, 14500], esPrice: [13500, 18900], ...R.PURETECH }),
  V({ id: "citroen-c5aircross-15bluehdi", brand: "Citroën", model: "C5 Aircross", segment: "C-SUV", version: "1.5 BlueHDi 130 CV EAT8 Shine", engine: "DV5RC 1.5 BlueHDi", fuel: "Diésel", years: [2018, 2023], cv: 130, cc: 1499, co2: 122, badge: "C", newPrice: 33500, dePrice: [14500, 19500], esPrice: [19500, 25500], ...R.BLUEHDI15 }),
  V({ id: "citroen-berlingo-15bluehdi", brand: "Citroën", model: "Berlingo III / Rifter / Combo", segment: "Furgoneta Combi", version: "1.5 BlueHDi 100 / 130 CV Feel", engine: "DV5RD 1.5 BlueHDi", fuel: "Diésel", years: [2018, 2023], cv: 130, cc: 1499, co2: 124, badge: "C", newPrice: 27500, dePrice: [12500, 17000], esPrice: [17500, 22500], transmission: "Manual", ...R.BLUEHDI15 }),
  V({ id: "citroen-c3aircross-12puretech", brand: "Citroën", model: "C3 Aircross", segment: "B-SUV", version: "1.2 PureTech 110 CV Shine", engine: "EB2ADT 1.2 PureTech", fuel: "Gasolina", years: [2017, 2023], cv: 110, cc: 1199, cyl: 3, co2: 121, badge: "C", newPrice: 22500, dePrice: [10000, 14000], esPrice: [13900, 18500], transmission: "Manual", ...R.PURETECH }),
  V({ id: "opel-corsa-f-12turbo", brand: "Opel", model: "Corsa F", segment: "Urbano", version: "1.2 Turbo 100 / 130 CV Elegance / GS Line", engine: "EB2ADTS 1.2 PureTech (Stellantis)", fuel: "Gasolina", years: [2019, 2024], cv: 100, cc: 1199, cyl: 3, co2: 106, badge: "C", newPrice: 21500, dePrice: [11000, 14500], esPrice: [14900, 18900], transmission: "Manual", ...R.PURETECH }),
  V({ id: "opel-grandland-12turbo", brand: "Opel", model: "Grandland X", segment: "C-SUV", version: "1.2 Turbo 130 CV Ultimate", engine: "EB2DTS 1.2 PureTech (Stellantis)", fuel: "Gasolina", years: [2017, 2023], cv: 130, cc: 1199, cyl: 3, co2: 128, badge: "C", newPrice: 30500, dePrice: [12500, 17000], esPrice: [16900, 22500], ...R.PURETECH }),
  V({ id: "opel-mokka-b-12turbo", brand: "Opel", model: "Mokka B / Crossland", segment: "B-SUV", version: "1.2 Turbo 130 CV GS Line", engine: "EB2ADTS 1.2 PureTech (Stellantis)", fuel: "Gasolina", years: [2020, 2024], cv: 130, cc: 1199, cyl: 3, co2: 124, badge: "C", newPrice: 26500, dePrice: [13500, 18000], esPrice: [17900, 23500], ...R.PURETECH }),
  V({ id: "ds7-15bluehdi", brand: "DS", model: "DS 7 Crossback", segment: "C-SUV", version: "1.5 BlueHDi 130 CV EAT8 So Chic", engine: "DV5RC 1.5 BlueHDi", fuel: "Diésel", years: [2018, 2023], cv: 130, cc: 1499, co2: 122, badge: "C", newPrice: 39500, dePrice: [16000, 22000], esPrice: [21500, 28500], ...R.BLUEHDI15 }),

  // ======================== FORD ==========================================
  V({ id: "ford-focus-10ecoboost", brand: "Ford", model: "Focus III / IV", segment: "Compacto", version: "1.0 EcoBoost 100 / 125 CV Titanium", engine: "1.0 EcoBoost Fox (correa húmeda)", fuel: "Gasolina", years: [2012, 2019], cv: 125, cc: 999, cyl: 3, co2: 108, badge: "C", newPrice: 23500, dePrice: [8500, 13000], esPrice: [12500, 17500], transmission: "Manual", ...R.ECOBOOST10 }),
  V({ id: "ford-fiesta-10ecoboost", brand: "Ford", model: "Fiesta VII / VIII", segment: "Urbano", version: "1.0 EcoBoost 100 / 125 CV ST-Line", engine: "1.0 EcoBoost Fox (correa húmeda)", fuel: "Gasolina", years: [2013, 2019], cv: 100, cc: 999, cyl: 3, co2: 99, badge: "C", newPrice: 19500, dePrice: [8000, 12000], esPrice: [11500, 16000], transmission: "Manual", ...R.ECOBOOST10 }),
  V({ id: "ford-puma-mhev", brand: "Ford", model: "Puma", segment: "B-SUV", version: "1.0 EcoBoost mHEV 125 CV ST-Line", engine: "1.0 EcoBoost mHEV (cadena, 2020+)", fuel: "Gasolina Microhíbrido", years: [2020, 2024], cv: 125, cc: 999, cyl: 3, co2: 112, badge: "ECO", newPrice: 27500, dePrice: [14500, 19000], esPrice: [19500, 24500], transmission: "Manual", ...R.MHEV_ECOBOOST }),
  V({ id: "ford-focus-powershift", brand: "Ford", model: "Focus III / C-Max", segment: "Compacto", version: "1.5 TDCi / 1.6 TDCi Powershift Automático", engine: "1.5 TDCi + Powershift 6DCT250", fuel: "Diésel", years: [2011, 2018], cv: 120, cc: 1499, co2: 105, badge: "C", newPrice: 26500, dePrice: [8000, 12000], esPrice: [11900, 16500], ...R.POWERSHIFT }),
  V({ id: "ford-smax-powershift", brand: "Ford", model: "S-Max / Galaxy II", segment: "Monovolumen 7 plazas", version: "2.0 TDCi 150 / 180 CV Powershift 7 plazas", engine: "2.0 TDCi + Powershift", fuel: "Diésel", years: [2015, 2018], cv: 150, cc: 1997, co2: 139, badge: "C", newPrice: 40500, dePrice: [13500, 19000], esPrice: [18900, 24900], ...R.POWERSHIFT }),
  V({ id: "ford-kuga-20tdci-man", brand: "Ford", model: "Kuga II", segment: "C-SUV", version: "2.0 TDCi 150 CV Manual 4x2 Titanium", engine: "2.0 TDCi Duratorq (DW10 PSA)", fuel: "Diésel", years: [2015, 2019], cv: 150, cc: 1997, co2: 122, badge: "C", newPrice: 31500, dePrice: [12500, 16500], esPrice: [17500, 22500], transmission: "Manual", ...R.DW10 }),

  // ======================== JAGUAR / LAND ROVER ===========================
  V({ id: "lr-evoque-20d-ingenium", brand: "Land Rover", model: "Range Rover Evoque (L538 / L551)", segment: "C-SUV", version: "2.0 TD4 / D150-D180 Ingenium Aut. AWD", engine: "AJ200D 2.0 Ingenium Diésel", fuel: "Diésel", years: [2015, 2021], cv: 180, cc: 1999, co2: 149, badge: "C", newPrice: 49500, dePrice: [19000, 28000], esPrice: [25500, 36500], ...R.INGENIUM }),
  V({ id: "lr-discosport-20d-ingenium", brand: "Land Rover", model: "Discovery Sport (L550)", segment: "D-SUV 7 plazas", version: "2.0 TD4 150 / 180 CV Ingenium Aut. 7 plazas", engine: "AJ200D 2.0 Ingenium Diésel", fuel: "Diésel", years: [2015, 2021], cv: 180, cc: 1999, co2: 159, badge: "C", newPrice: 52500, dePrice: [19500, 28500], esPrice: [26500, 37500], ...R.INGENIUM }),
  V({ id: "jaguar-fpace-20d-ingenium", brand: "Jaguar", model: "F-Pace / XE / XF", segment: "D-SUV", version: "2.0d 180 CV Ingenium Aut. AWD", engine: "AJ200D 2.0 Ingenium Diésel", fuel: "Diésel", years: [2016, 2021], cv: 180, cc: 1999, co2: 139, badge: "C", newPrice: 55000, dePrice: [21000, 30000], esPrice: [27500, 38500], ...R.INGENIUM }),

  // ======================== JEEP / FIAT ===================================
  V({ id: "jeep-renegade-14multiair", brand: "Jeep", model: "Renegade / Compass", segment: "B-SUV", version: "1.4 MultiAir 140 / 170 CV DDCT Limited", engine: "1.4 MultiAir Turbo + DDCT", fuel: "Gasolina", years: [2015, 2019], cv: 140, cc: 1368, co2: 140, badge: "C", newPrice: 27500, dePrice: [10500, 15000], esPrice: [14500, 19900], ...R.MULTIAIR }),
  V({ id: "jeep-compass-16mjet", brand: "Jeep", model: "Compass (MP)", segment: "C-SUV", version: "1.6 MultiJet 120 CV Manual Longitude", engine: "1.6 MultiJet II", fuel: "Diésel", years: [2017, 2020], cv: 120, cc: 1598, co2: 117, badge: "C", newPrice: 30500, dePrice: [12000, 16500], esPrice: [16500, 21900], transmission: "Manual", ...R.MULTIAIR }),
];

// ---------------------------------------------------------------------------
//  BASE DE DATOS COMPLETA = ficha curada (precios verificados a mano) +
//  catálogo ampliado generado desde los datos de homologación.
// ---------------------------------------------------------------------------
/**
 * Kilometraje al que se refieren las horquillas de las fichas curadas:
 * el propio fichero declara "un ejemplar de 4-6 años y 80-120k km".
 */
export const CURATED_KM_REF = 110000;

const midYear = (y) => (Number(y?.[0]) + Number(y?.[1] ?? y?.[0])) / 2;

/**
 * Las fichas curadas tenían los precios escritos a mano, y eso provocaba que
 * el MISMO coche saliera con dos precios distintos según en qué lista cayera.
 * Ahora heredan la horquilla del catálogo (que es la que se contrasta con
 * anuncios reales en marketEvidence.js), llevada a su propio kilometraje.
 * Las que no tienen equivalente en el catálogo conservan su cifra manual, pero
 * marcada como 'manual' para que se vea que no está contrastada.
 */
function reconcileWithCatalog(list) {
  return list.map((c) => {
    const twins = GENERATED_DB.filter((g) => g.brand === c.brand
      && (String(g.model).includes(String(c.model).split(" ")[0]) || String(c.model).includes(String(g.model).split(" ")[0]))
      && g.cv === c.cv
      && Math.abs(midYear(g.years) - midYear(c.years)) <= 1);
    if (!twins.length) return { ...c, priceSource: { de: "manual", es: "manual", kmRef: CURATED_KM_REF } };
    // Se prefiere la ficha generada que tenga anuncios reales detrás.
    const rank = (g) => (g.priceSource.de === "evidencia" || g.priceSource.es === "evidencia" ? 0 : 1);
    const twin = [...twins].sort((a, b) => rank(a) - rank(b))[0];
    const scale = normalizeKm(1, twin.kmRef, CURATED_KM_REF);
    const adjust = (r) => [Math.round((r[0] * scale) / 50) * 50, Math.round((r[1] * scale) / 50) * 50];
    return {
      ...c,
      dePrice: adjust(twin.dePrice),
      esPrice: adjust(twin.esPrice),
      priceSource: { ...twin.priceSource, kmRef: CURATED_KM_REF, reconciledFrom: twin.id },
    };
  });
}

export const CURATED_RECONCILED = reconcileWithCatalog(CURATED_DB);

export const VEHICLE_DB = [...CURATED_RECONCILED, ...GENERATED_DB]
  .filter((v) => !['Seat', 'Cupra'].includes(v.brand)); // fabricadas en España: no compensa importarlas
export const CURATED_COUNT = CURATED_DB.length;
export const GENERATED_COUNT = GENERATED_DB.length;

// ---------------------------------------------------------------------------
// Utilidades de búsqueda / autocompletado
// ---------------------------------------------------------------------------
const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9. ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const vehicleLabel = (v) => `${v.brand} ${v.model} ${v.version}`;

export const vehicleSearchText = (v) =>
  normalize(`${v.brand} ${v.model} ${v.version} ${v.engine} ${v.fuel} ${v.segment} ${v.badge} ${v.years?.[0]}-${v.years?.[1]}`);

/**
 * Busca en la base de datos: todas las palabras de la consulta deben aparecer
 * (en cualquier orden). Ordena por relevancia (coincidencia de marca/modelo
 * primero y motores roca antes que los prohibidos, para no sugerir chatarra).
 */
export function searchVehicles(query, limit = 12) {
  const q = normalize(query);
  if (!q) return VEHICLE_DB.slice(0, limit);
  const tokens = q.split(" ").filter(Boolean);

  const scored = [];
  for (const v of VEHICLE_DB) {
    const text = vehicleSearchText(v);
    const head = normalize(`${v.brand} ${v.model}`);
    if (!tokens.every((t) => text.includes(t))) continue;
    let score = 0;
    for (const t of tokens) {
      if (head.startsWith(t)) score += 6;
      else if (head.includes(t)) score += 4;
      else if (normalize(v.version).includes(t)) score += 2;
      else score += 1;
    }
    if (v.reliability === "gold") score += 1.5;
    if (v.reliability === "banned") score -= 0.5;
    scored.push({ v, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.v);
}

export const getBrands = () => [...new Set(VEHICLE_DB.map((v) => v.brand))].sort();
export const getModelsForBrand = (brand) =>
  [...new Set(VEHICLE_DB.filter((v) => normalize(v.brand) === normalize(brand)).map((v) => v.model))].sort();
export const getVersionsFor = (brand, model) =>
  VEHICLE_DB.filter((v) => normalize(v.brand) === normalize(brand) && normalize(v.model) === normalize(model));

export const RELIABILITY_META = {
  gold: { label: "Motor roca", color: "emerald" },
  ok: { label: "Correcto", color: "sky" },
  warn: { label: "Precaución", color: "amber" },
  banned: { label: "PROHIBIDO", color: "rose" },
};

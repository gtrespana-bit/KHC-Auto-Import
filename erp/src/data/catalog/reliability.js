// ============================================================================
//  REGISTRO DE FIABILIDAD DE MOTORES Y CAJAS DE CAMBIO
// ----------------------------------------------------------------------------
//  Cada clave es una familia mecánica. Se reutiliza en la ficha curada
//  (CURATED_DB) y en el catálogo ampliado (src/data/catalog/*.js).
//
//  reliability: 'gold'  → motor roca, compra sin miedo
//               'ok'    → correcto, revisa historial
//               'warn'  → precaución, exige pruebas e historial
//               'banned'→ PROHIBIDO importar (riesgo de avería catastrófica)
// ============================================================================

const R = {
  EA288: {
    reliability: "gold",
    reliabilityTitle: "MOTOR ROCA VAG: 2.0 TDI EA288",
    reliabilityNote: "Correa de distribución tradicional seca (intervalo 210.000 km), inyección Bosch y cajas DSG DQ381/DQ250 de embragues húmedos. Durabilidad +400.000 km. El coche más demandado y rápido de vender en Galicia.",
  },
  EA211_15: {
    reliability: "gold",
    reliabilityTitle: "MOTOR FIABLE VAG: 1.5 TSI EA211 evo",
    reliabilityNote: "Correa seca, inyección directa + indirecta y DSG DQ381 húmeda en la versión 150 CV. Evitar unidades pre-2019 con tirones en frío (actualización de software resuelta).",
  },
  EA211_10: {
    reliability: "ok",
    reliabilityTitle: "MOTOR CORRECTO: 1.0 TSI EA211 (3 cil.)",
    reliabilityNote: "Motor fiable con correa seca. Si es automático monta DSG DQ200 de embragues SECOS: exigir historial de la mecatrónica y probar en atasco. Preferible manual.",
  },
  B47: {
    reliability: "gold",
    reliabilityTitle: "MOTOR ROCA BMW: B47 2.0d + ZF 8HP",
    reliabilityNote: "Distribución rediseñada respecto al N47, acoplado a la caja automática ZF 8HP de convertidor de par (la mejor del mercado). Fiabilidad de referencia en su categoría.",
  },
  N47: {
    reliability: "banned",
    reliabilityTitle: "ATENCIÓN: MOTOR BMW N47 2.0d (2007 - mediados 2015)",
    reliabilityNote: "Cadena de distribución trasera con guías y piñones defectuosos: se estira y rompe (reparación 3.000-4.500 € porque va pegada a la caja). Exigir SIEMPRE bloque B47 (Euro 6, desde mediados de 2015).",
  },
  HSD: {
    reliability: "gold",
    reliabilityTitle: "MOTOR INDESTRUCTIBLE: Toyota Hybrid HSD",
    reliabilityNote: "Ciclo Atkinson con cadena, sin turbo, sin embrague, sin alternador ni motor de arranque. e-CVT planetaria sin desgaste. Etiqueta ECO: 0 % IEDMT y bonificación IVTM. Cero averías.",
  },
  OM654: {
    reliability: "gold",
    reliabilityTitle: "MOTOR PREMIUM: Mercedes OM654 2.0d",
    reliabilityNote: "Bloque de aluminio con recubrimiento NANOSLIDE, pistones de acero, muy silencioso y de bajo consumo. Cajas 8G-DCT (húmeda) o 9G-Tronic. Superior en todo al antiguo 2.1 OM651.",
  },
  OM651: {
    reliability: "warn",
    reliabilityTitle: "PRECAUCIÓN: Mercedes 2.1 CDI OM651",
    reliabilityNote: "Fiable en general pero ruidoso; unidades pre-2012 con fallos de inyectores Delphi y cadena de distribución. Post-2016 (Euro 6) aceptable. Preferir OM654 si el precio es similar.",
  },
  U3_CRDI: {
    reliability: "gold",
    reliabilityTitle: "JOYA COREANA: 1.6 CRDi Smartstream U3 48V",
    reliabilityNote: "Distribución por cadena robusta, consumo real 5,1 l/100 km, Etiqueta ECO (0 % IEDMT + bonificación IVTM) y equipamiento N-Line / GT-Line. Margen neto muy alto en A Coruña.",
  },
  U2_CRDI: {
    reliability: "ok",
    reliabilityTitle: "MOTOR CORRECTO: 1.6 CRDi U2 (pre-2018)",
    reliabilityNote: "Motor diésel sencillo y fiable con correa (cambiar cada 90.000 km). Sin etiqueta ECO (C). Vigilar EGR y FAP en unidades muy urbanas.",
  },
  R22: {
    reliability: "gold",
    reliabilityTitle: "TITÁN COREANO: 2.2 CRDi bloque 'R'",
    reliabilityNote: "Bloque de fundición indestructible (200 CV / 440 Nm) con doble cadena de distribución. 7 plazas reales y 4x4. Muy cotizado por familias y rural gallego.",
  },
  GDI16: {
    reliability: "warn",
    reliabilityTitle: "ADVERTENCIA: 1.6 GDI atmosférico Hyundai/Kia (132 CV)",
    reliabilityNote: "Motor perezoso (160 Nm) para mover un SUV en las cuestas gallegas, gasta 9-9,5 l/100 km en autovía y genera reclamaciones. Busca el 1.6 CRDi diésel o el 1.6 T-GDI turbo.",
  },
  PURETECH: {
    reliability: "banned",
    reliabilityTitle: "ALERTA MÁXIMA: Stellantis 1.2 PureTech (EB2)",
    reliabilityNote: "Correa de distribución húmeda que se degrada en el aceite, tapona la chupona de la bomba, endurece el pedal de freno y gripa el motor. Plataforma masiva de afectados. PROHIBIDO importar.",
  },
  BLUEHDI15: {
    reliability: "banned",
    reliabilityTitle: "ALERTA: Stellantis 1.5 BlueHDi (DV5)",
    reliabilityNote: "Cadena de 7 mm entre árboles de levas subdimensionada (rotura + válvulas dobladas) y depósito de AdBlue que cristaliza (~1.200 €). PROHIBIDO importar.",
  },
  DW10: {
    reliability: "ok",
    reliabilityTitle: "MOTOR CORRECTO: 2.0 HDi / BlueHDi DW10 (150-180 CV)",
    reliabilityNote: "El 2.0 francés SÍ es fiable (a diferencia del 1.5). Vigilar depósito de AdBlue y caja EAT8 con mantenimiento. Aceptable con historial completo.",
  },
  TCE12: {
    reliability: "banned",
    reliabilityTitle: "ALERTA MÁXIMA: Renault/Nissan 1.2 TCe / DIG-T (H5Ft)",
    reliabilityNote: "Segmentos con fuga: consumo de 1 l de aceite cada 800 km, autodetonación (LSPI) y rotura de válvulas. Causa directa de demandas por vicios ocultos. PROHIBIDO importar.",
  },
  DCI16_BI: {
    reliability: "banned",
    reliabilityTitle: "ALERTA: Renault 1.6 dCi BiTurbo (R9M 160)",
    reliabilityNote: "Roturas del turbo de baja presión, fisuras en culata y bloque por sobretemperatura. Evitar en Espace, Talisman, Trafic y Vivaro 2014-2018.",
  },
  K9K: {
    reliability: "gold",
    reliabilityTitle: "MOTOR ETERNO: Renault 1.5 dCi K9K (Gen 8)",
    reliabilityNote: "Diésel de referencia por sencillez y consumo (4,5 l/100 km). Cambiar correa cada 120.000 km / 6 años. Vigilar inyectores en unidades pre-2012.",
  },
  ECOBOOST10: {
    reliability: "banned",
    reliabilityTitle: "ALERTA: Ford 1.0 EcoBoost 'Fox' (hasta 2019)",
    reliabilityNote: "Correa de distribución y de bomba de aceite bañadas en aceite que se degradan y destruyen el motor. Solo aceptable el 1.0 EcoBoost mHEV (2020+) que volvió a cadena.",
  },
  POWERSHIFT: {
    reliability: "banned",
    reliabilityTitle: "ALERTA: Caja Ford Powershift 6DCT250 (doble embrague seco)",
    reliabilityNote: "Tirones severos, sobrecalentamiento y rotura de mecatrónica. Evitar Focus / C-Max / Mondeo / S-Max automáticos pre-2018/19.",
  },
  INGENIUM: {
    reliability: "banned",
    reliabilityTitle: "ALERTA: Jaguar/Land Rover 2.0 Diésel Ingenium (AJ200D)",
    reliabilityNote: "Cadena de distribución trasera con patines frágiles que rompe antes de 100.000 km, holgura del turbo y dilución de gasóleo en el aceite. Altísimo riesgo. PROHIBIDO importar.",
  },
  BITDI: {
    reliability: "banned",
    reliabilityTitle: "FALLO CATASTRÓFICO: VW 2.0 BiTDI 180/204 CV (CFCA / CXEB)",
    reliabilityNote: "El enfriador de EGR se desintegra y sus virutas rayan los cilindros: 1 l de aceite cada 200 km y motor nuevo (10.000 €). Comprar SOLO la 150 CV monoturbo (CXFA/DNAA).",
  },
  T6_150: {
    reliability: "gold",
    reliabilityTitle: "LA REINA CAMPER: VW T6 2.0 TDI 150 CV monoturbo",
    reliabilityNote: "Bloque CXFA/DNAA indestructible con cambio manual o DSG DQ500 (húmeda, 7 vel.). Mayor retención de precio de España en Galicia (surf, ciclismo, camper).",
  },
  MULTIAIR: {
    reliability: "banned",
    reliabilityTitle: "ALERTA: Jeep/Fiat 1.4 MultiAir / 1.6 MJet (2015-2019)",
    reliabilityNote: "Fallos en electroválvulas MultiAir, cajas DDCT problemáticas y anomalías eléctricas crónicas CAN-Bus. Evitar Renegade / Compass / 500X de esos años.",
  },
  SKYACTIV: {
    reliability: "gold",
    reliabilityTitle: "MOTOR JAPONÉS: Mazda 2.0 Skyactiv-G",
    reliabilityNote: "Atmosférico de cadena sin turbo ni FAP. Fiabilidad extrema de la vieja escuela. Versiones M-Hybrid 2019+ con Etiqueta ECO.",
  },
  KAPPA_HEV: {
    reliability: "gold",
    reliabilityTitle: "HÍBRIDO FIABLE: Hyundai/Kia 1.6 GDI HEV (Kappa) + 6-DCT",
    reliabilityNote: "Ciclo Atkinson + eléctrico con cambio de doble embrague real (no CVT). Etiqueta ECO. Buena fiabilidad y 0 % IEDMT.",
  },
  GD_TOYOTA: {
    reliability: "gold",
    reliabilityTitle: "INDESTRUCTIBLE: Toyota 2.4 / 2.8 D-4D (2GD / 1GD)",
    reliabilityNote: "Motores de chasis de largueros con cadena. Vigilar el DPF en uso urbano y el intervalo de la correa de accesorios. Depreciación nula en el rural gallego.",
  },
  CVT_XTRONIC: {
    reliability: "banned",
    reliabilityTitle: "ALERTA: Nissan cambio CVT X-Tronic (Jatco)",
    reliabilityNote: "Variador continuo por correa metálica que patina y rompe (4.500 €). Evitar Qashqai / X-Trail / Juke automáticos.",
  },
  MHEV_ECOBOOST: {
    reliability: "ok",
    reliabilityTitle: "MOTOR CORRECTO: Ford 1.0 EcoBoost mHEV (2020+, cadena)",
    reliabilityNote: "Ford abandonó la correa húmeda en la versión microhíbrida. Aceptable con libro de mantenimiento. Etiqueta ECO.",
  },
};

// ---------------------------------------------------------------------------
//  FAMILIAS MECÁNICAS DEL CATÁLOGO AMPLIADO
// ---------------------------------------------------------------------------
const R_EXT = {
  EA288_16: { reliability: "gold", reliabilityTitle: "MOTOR ROCA VAG: 1.6 TDI EA288", reliabilityNote: "Diésel sencillo de correa seca con 250 Nm. Intervalo 210.000 km. Sin AdBlue en la mayoría de unidades (Euro 6 con EGR de baja presión). Muy buscado en compactos y furgonetas ligeras." },
  EA888: { reliability: "ok", reliabilityTitle: "CORRECTO: 2.0 TSI/TFSI EA888", reliabilityNote: "Bloque de hierro fundido muy resistente. Las generaciones 2 (2008-2012) consumen aceite por segmentos: exige historial. Gen 3/3B (2013+) corregido. Vigilar bomba de agua y tensor de cadena en unidades con más de 200.000 km." },
  V6TDI: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: 3.0 V6 TDI", reliabilityNote: "Motor potente y duradero, pero con culatas, inyectores piezoeléctricos y EGR caros de reparar. Solo interesante con historial oficial completo y a buen precio. Revisión de cadena a 250.000 km." },
  B38: { reliability: "ok", reliabilityTitle: "CORRECTO: BMW 1.5 tres cilindros (B38)", reliabilityNote: "Cadena de distribución y bloque de aluminio. Fiable; vigilar soportes de motor y la bomba de refrigerante eléctrica en unidades muy urbanas." },
  B48: { reliability: "gold", reliabilityTitle: "MOTOR ROCA BMW: 2.0 gasolina B48 + ZF 8HP", reliabilityNote: "Sustituto del N20: cadena reforzada, inyección directa y caja ZF 8HP de convertidor de par. Consumo y fiabilidad de referencia en la gama BMW/Mini." },
  B57: { reliability: "gold", reliabilityTitle: "MOTOR ROCA BMW: 3.0 diésel B57", reliabilityNote: "Seis en línea con cadena, doble admisión y ZF 8HP. Es el diésel grande más fiable del mercado premium y aguanta 400.000 km con mantenimiento." },
  B58: { reliability: "gold", reliabilityTitle: "MOTOR ROCA BMW: 3.0 gasolina B58", reliabilityNote: "Seis en línea sobrealimentado con bloque cerrado. Considerado uno de los mejores motores modernos; admite mucha potencia sin modificaciones." },
  N57: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: BMW 3.0d N57 (2009-2015)", reliabilityNote: "Excelente rendimiento pero con problemas de cadena de distribución (patines) y de inyectores piezoeléctricos. Solo unidades post-2014 con historial completo." },
  M254: { reliability: "ok", reliabilityTitle: "CORRECTO: Mercedes M254 con hibridación ligera", reliabilityNote: "Cuatro cilindros modular con recubrimiento NANOSLIDE y alternador-arranque 48 V. Vigilar el módulo 48 V (ISG) y el termostato; el resto es sólido." },
  M264: { reliability: "ok", reliabilityTitle: "CORRECTO: Mercedes M264 48V", reliabilityNote: "Evolución del M274 con sistema 48 V. Fiabilidad correcta; revisa el compresor auxiliar eléctrico y las actualizaciones de software." },
  M274: { reliability: "ok", reliabilityTitle: "CORRECTO: Mercedes 1.6/2.0 M274", reliabilityNote: "Motor gasolina de origen Mercedes/Nissan-Renault (2.0). Bomba de agua y termostato mejorables. Fiable con mantenimiento al día." },
  EV_MB: { reliability: "warn", reliabilityTitle: "ATENCIÓN: eléctrico usado (Mercedes EQ)", reliabilityNote: "Mecánicamente sencillo, pero exige certificado de estado de batería (SoH) y revisar la garantía de 8 años/160.000 km. La depreciación es alta: negocia fuerte o evita." },
  EV_PSA: { reliability: "warn", reliabilityTitle: "ATENCIÓN: eléctrico usado (Stellantis/VW)", reliabilityNote: "Comprueba el SoH de la batería y el estado del cargador embarcado. Valor residual bajo: solo interesa si el precio cae por debajo del equivalente térmico." },
  EV_RN: { reliability: "warn", reliabilityTitle: "ATENCIÓN: eléctrico usado (Renault)", reliabilityNote: "Los Zoe con batería en alquiler (leasing) obligan a mantener la cuota mensual: revisa el contrato antes de comprar. Exige informe de SoH." },
  EV_HK: { reliability: "ok", reliabilityTitle: "ELÉCTRICO FIABLE: Hyundai/Kia E-GMP", reliabilityNote: "Plataforma 800 V con baterías muy duraderas y garantía de 8 años/160.000 km. Buen valor residual dentro del segmento eléctrico." },
  EV_FIAT: { reliability: "ok", reliabilityTitle: "ELÉCTRICO SENCILLO: Fiat 500e", reliabilityNote: "Poca mecánica y gran demanda urbana. Verifica SoH de batería y que la garantía de 8 años sea transferible." },
  EV_MZ: { reliability: "ok", reliabilityTitle: "ELÉCTRICO: Mazda MX-30", reliabilityNote: "Batería pequeña (35,5 kWh) y autonomía real corta: solo para uso urbano. Depreciación muy alta, negocia con fuerza." },
  EV_MG: { reliability: "warn", reliabilityTitle: "ATENCIÓN: eléctrico usado MG", reliabilityNote: "Marca con red de servicio limitada en Galicia. Garantía de 7 años transferible, pero exige informe de SoH y comprueba la cobertura de recambios." },
  EV_SMART: { reliability: "ok", reliabilityTitle: "ELÉCTRICO URBANO: Smart EQ", reliabilityNote: "Autonomía muy limitada (130 km reales). Solo como segundo vehículo urbano. Batería con garantía de 8 años." },
  EV_TESLA: { reliability: "ok", reliabilityTitle: "ELÉCTRICO: Tesla", reliabilityNote: "Mecánica fiable y batería con garantía de 8 años/160.000-192.000 km. Vigila suspensión, pantalla y pintura; la depreciación 2024-2026 ha sido muy fuerte, aprovecha para comprar." },
  KAPPA: { reliability: "ok", reliabilityTitle: "CORRECTO: Hyundai/Kia 1.0 T-GDi", reliabilityNote: "Tres cilindros con cadena y turbo pequeño. Consumo real ajustado. Exige libro de revisiones: los intervalos largos en unidades de renting acortan la vida del turbo." },
  KAPPA_GDI: { reliability: "ok", reliabilityTitle: "CORRECTO: 1.4/1.6 T-GDi con DCT-7", reliabilityNote: "Motor de cadena fiable. El cambio de doble embrague seco DCT-7 es sensible al tráfico denso: pruébalo en atasco y exige el historial de la mecatrónica." },
  R20: { reliability: "ok", reliabilityTitle: "CORRECTO: Hyundai/Kia 2.0 CRDi", reliabilityNote: "Diésel de cadena, sin AdBlue en las versiones anteriores a 2018. Robusto y barato de mantener; vigila el FAP en unidades urbanas." },
  H5HT: { reliability: "gold", reliabilityTitle: "MOTOR FIABLE: 1.3 TCe / DIG-T (Renault-Nissan-Mercedes)", reliabilityNote: "Desarrollado con Daimler: cadena de distribución, cuatro cilindros y consumo bajo. Es el sustituto natural del problemático 1.2 TCe y tiene una fiabilidad excelente. Evita las unidades con consumo de aceite declarado." },
  B4D: { reliability: "ok", reliabilityTitle: "CORRECTO: 1.0 SCe / TCe (B4D)", reliabilityNote: "Tres cilindros muy sencillo, correa de distribución accesible y sin turbo en las versiones SCe. Ideal para urbanos baratos, aunque perezoso en autovía." },
  R9M: { reliability: "ok", reliabilityTitle: "CORRECTO: 1.6 dCi R9M (monoturbo)", reliabilityNote: "Diésel de cadena con buen par. La versión BiTurbo 160 CV es problemática; la monoturbo 130 CV es aceptable con historial." },
  M9R: { reliability: "gold", reliabilityTitle: "MOTOR ROCA RENAULT: 2.0 dCi M9R", reliabilityNote: "Diésel de correa con 340-400 Nm, usado en Espace, Trafic y Nissan. Aguanta 400.000 km. Cambia la correa cada 150.000 km / 6 años y revisa el turbo en unidades con muchos kilómetros." },
  M9T: { reliability: "gold", reliabilityTitle: "MOTOR ROCA: 2.3 dCi M9T (Master / NV400 / Interstar)", reliabilityNote: "El furgón grande más vendido de Europa por algo: cadena, inyección Bosch y mantenimiento barato. La mejor opción en furgones de 3,5 t para el rural gallego." },
  ETECH: { reliability: "ok", reliabilityTitle: "HÍBRIDO CORRECTO: Renault E-Tech", reliabilityNote: "Sin embrague ni correa: caja multimodal de 4+2 marchas y batería pequeña. Consumo urbano excelente. Algunas unidades 2020-2021 con fallos de la caja resueltos por software: exige historial de actualizaciones." },
  ETECH_PHEV: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: E-Tech Plug-in sobre base 1.2 TCe", reliabilityNote: "Combina la caja multimodal con el bloque 1.2 TCe (correa húmeda) como generador. Complejidad alta y averías caras. Evita salvo precio muy atractivo." },
  NS_15D: { reliability: "gold", reliabilityTitle: "MOTOR ETERNO: Nissan 1.5 dCi (K9K)", reliabilityNote: "El mismo 1.5 dCi de Renault con ajustes propios: sencillez y consumo de 4,5 l/100 km. Correa cada 120.000 km / 6 años." },
  EPOWER: { reliability: "ok", reliabilityTitle: "CORRECTO: Nissan e-Power", reliabilityNote: "El motor de gasolina solo genera electricidad: no hay caja de cambios ni embrague. Conducción de eléctrico sin enchufe. Vigila la batería de tracción y el software del inversor." },
  DV6: { reliability: "ok", reliabilityTitle: "CORRECTO: 1.6 HDi / BlueHDi (DV6)", reliabilityNote: "Diésel pequeño de correa, muy extendido y barato de reparar. En las versiones BlueHDi revisa el depósito de AdBlue (cristaliza) y el FAP en uso urbano." },
  DW12: { reliability: "ok", reliabilityTitle: "CORRECTO: 2.2 BlueHDi (DW12) furgonetas", reliabilityNote: "Bloque grande y robusto para Boxer/Jumper/Ducato. Mantenimiento accesible; revisa AdBlue y el turbo en unidades de reparto con muchos arranques en frío." },
  PSA_PHEV: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: 1.6 PureTech PHEV 225/300 CV", reliabilityNote: "Hereda el bloque PureTech con correa húmeda (riesgo conocido) más la complejidad eléctrica del enchufable. Evitar salvo histórico completo de correa y batería." },
  PURETECH_MHEV: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: 1.2 PureTech mild-hybrid 136 CV", reliabilityNote: "La versión 2023+ cambia la correa húmeda por cadena, pero el bloque EB2 arrastra el historial de dilución y desgaste. Exige pruebas de compresión y revisiones documentadas." },
  F16: { reliability: "gold", reliabilityTitle: "MOTOR FIABLE: Opel 1.6 CDTi (cadena)", reliabilityNote: "El 'whisper diesel' de Opel: cadena de distribución, bajo ruido y consumo. Muy buena opción en Astra, Insignia y Zafira." },
  FIREFLY: { reliability: "gold", reliabilityTitle: "INDESTRUCTIBLE: 1.2 FireFly atmosférico", reliabilityNote: "Motor de cuatro cilindros sin turbo, correa barata y mecánica de los años 90 actualizada. Ideal para urbano de bajo coste y margen alto." },
  FIREFLY_HEV: { reliability: "ok", reliabilityTitle: "CORRECTO: 1.0 mild-hybrid 70 CV", reliabilityNote: "Tres cilindros con hibridación ligera de 12 V y etiqueta ECO. Mecánica simple; batería pequeña y barata de sustituir." },
  MJET13: { reliability: "gold", reliabilityTitle: "MOTOR ETERNO: 1.3 MultiJet", reliabilityNote: "El diésel pequeño más vendido de Europa: cadena, inyección common-rail robusta y repuestos baratísimos. Perfecto para Panda, Punto, 500 y Corsa." },
  MJET16: { reliability: "ok", reliabilityTitle: "CORRECTO: 1.6 MultiJet 120 CV", reliabilityNote: "Diésel de correa con buen empuje. Vigila el embrague bimasa y el FAP en unidades urbanas." },
  MJET20: { reliability: "ok", reliabilityTitle: "CORRECTO: 2.0 MultiJet 170 CV", reliabilityNote: "Diésel grande y duradero para Jeep Renegade/Compass y Alfa. Revisa el AdBlue y el cambio automático ZF 9HP (tirones en frío en unidades pre-2019)." },
  JTD22: { reliability: "ok", reliabilityTitle: "CORRECTO: 2.2 JTDm (Alfa Giulia/Stelvio)", reliabilityNote: "Diésel de aluminio con buen par y caja ZF 8HP. Fiable si se respeta el mantenimiento; vigila la bomba de AdBlue." },
  JEEP_4XE: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Jeep Renegade/Compass 4xe PHEV", reliabilityNote: "Caja de doble embrague DDCT problemática, electrónica compleja y batería de tracción. Averías caras y red de servicio irregular. Evita." },
  ALFA_20: { reliability: "ok", reliabilityTitle: "CORRECTO: 2.0 Turbo GME 280 CV", reliabilityNote: "Bloque de origen Chrysler con turbo twin-scroll. Mecánica sencilla para el segmento; revisa el sistema de tracción Q4 y el termostato." },
  ECOBOOST15: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Ford 1.5 EcoBoost 4 cilindros", reliabilityNote: "Bloque abierto con problemas de infiltración de refrigerante en los cilindros (2013-2018) y culatas fisuradas. Solo unidades post-2019 con el bloque mejorado y pruebas de compresión." },
  ECOBOOST20: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Ford 2.0 EcoBoost", reliabilityNote: "Culatas con fisuras y consumo de refrigerante documentado en Focus ST, Kuga y Mondeo. Evita salvo historial de culata sustituida." },
  ECOBLUE: { reliability: "ok", reliabilityTitle: "CORRECTO: Ford 2.0 EcoBlue", reliabilityNote: "Diésel de cadena diseñado por Ford para Transit, Kuga y Focus. Correcto con mantenimiento; vigila el sistema de AdBlue y el volante bimasa." },
  ECOBLUE_BI: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: 2.0 EcoBlue BiTurbo 240 CV", reliabilityNote: "El segundo turbo y sus actuadores fallan con frecuencia y la reparación supera los 3.000 €. Prefiere el monoturbo 150/170 CV." },
  FD_D15: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: 1.5 TDCi (derivado DV5)", reliabilityNote: "Motor de origen PSA: mismo riesgo de cadena de 7 mm y cristalización de AdBlue que el 1.5 BlueHDi. Evita en Focus, Fiesta, Puma y Mondeo." },
  FD_PHEV: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Ford Kuga 2.5 PHEV", reliabilityNote: "Ciclo Atkinson con eCVT, mecánica fiable, pero la campaña de llamada a revisión por baterías (2020) y el riesgo de incendio obliga a verificar el VIN y el estado de la batería." },
  SKYACTIV_D: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Mazda 2.2 Skyactiv-D", reliabilityNote: "Acumulación de carbonilla en la admisión, dilución de aceite y culatas con holguras. Reparaciones caras y depreciación alta. Prefiere los gasolina Skyactiv-G." },
  SKYACTIV_X: { reliability: "ok", reliabilityTitle: "CORRECTO: Skyactiv-X (encendido por compresión)", reliabilityNote: "Tecnología SPCCI compleja pero sin turbo y con cadena. Consumo muy bajo. Exige libro de mantenimiento oficial y revisa el sensor de presión del colector." },
  HONDA_10: { reliability: "gold", reliabilityTitle: "MOTOR FIABLE: Honda 1.0 VTEC Turbo", reliabilityNote: "Tres cilindros con cadena y turbo pequeño. Fabricación Honda: fiabilidad excelente y consumo contenido." },
  HONDA_15: { reliability: "gold", reliabilityTitle: "MOTOR FIABLE: Honda 1.5 VTEC Turbo", reliabilityNote: "Cuatro cilindros de cadena, muy elástico y duradero. Uno de los mejores motores turbo del mercado junto con el 2.0 atmosférico." },
  HONDA_D16: { reliability: "gold", reliabilityTitle: "DIÉSEL FIABLE: Honda 1.6 i-DTEC", reliabilityNote: "Bloque de aluminio de 120 CV con consumo de 3,8 l/100 km. Sin AdBlue en las versiones Euro 6b. Muy valorado en Civic y CR-V." },
  HONDA_HEV: { reliability: "gold", reliabilityTitle: "HÍBRIDO INDESTRUCTIBLE: Honda e:HEV / i-MMD", reliabilityNote: "Dos motores eléctricos y un gasolina Atkinson sin caja de cambios convencional. Fiabilidad de Toyota sin ser Toyota. Etiqueta ECO." },
  MM_22: { reliability: "ok", reliabilityTitle: "CORRECTO: Mitsubishi 2.2 DI-D (4N14)", reliabilityNote: "Diésel de correa con buen par para L200, ASX y Outlander. Robusto; revisa el turbo y el FAP en unidades de trabajo." },
  MM_15: { reliability: "ok", reliabilityTitle: "CORRECTO: 1.5 MIVEC", reliabilityNote: "Gasolina atmosférico sencillo de cadena. Poco potente pero barato de mantener." },
  MM_PHEV: { reliability: "ok", reliabilityTitle: "ENCHUFABLE PROBADO: Outlander PHEV", reliabilityNote: "El híbrido enchufable más vendido de Europa durante años, con batería de 8 años/160.000 km. Verifica el SoH y el estado del generador; 4x4 real y muy cotizado en el rural gallego." },
  SUBARU_BOXER: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Subaru 2.0/2.5 Boxer", reliabilityNote: "Consumo de aceite y problemas de cojinetes/culata en unidades anteriores a 2015 (FB20/FB25). La tracción total es excelente, pero exige pruebas de compresión y historial de consumo." },
  SUBARU_EBOXER: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Subaru e-Boxer", reliabilityNote: "Mismo bloque Boxer con hibridación ligera y batería adicional. Consumo de aceite documentado y red de servicio escasa en Galicia." },
  SUZUKI_K: { reliability: "gold", reliabilityTitle: "INDESTRUCTIBLE: Suzuki 1.2 DualJet", reliabilityNote: "Atmosférico de cadena, sin turbo ni FAP. Mantenimiento mínimo y fiabilidad absoluta en Swift, Ignis y Baleno." },
  SUZUKI_BOOSTER: { reliability: "gold", reliabilityTitle: "MOTOR FIABLE: 1.4 BoosterJet", reliabilityNote: "Turbo pequeño con cadena y muy buen par. Versiones 48V con etiqueta ECO y consumo real bajo." },
  SUZUKI_HEV: { reliability: "ok", reliabilityTitle: "HÍBRIDO CORRECTO: Suzuki 1.5 Strong Hybrid", reliabilityNote: "Sistema derivado de Toyota con caja automatizada. Fiable, aunque la caja tiene tirones en maniobra; pruébalo antes de comprar." },
  JLR_20P: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: JLR 2.0 Ingenium gasolina (Si4/P250)", reliabilityNote: "Dilución de aceite por el turbo, holgura de la cadena de equilibrado y fallos del sistema de refrigeración. Reparaciones de 4.000-6.000 €. Evita." },
  JLR_I6D: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Land Rover 3.0 I6 diésel Ingenium", reliabilityNote: "Mismo diseño Ingenium con cadena trasera: coste de sustitución superior a 4.000 € por la mano de obra. Solo con garantía vigente o historial de cadena cambiada." },
  JLR_I6P: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Land Rover 3.0 I6 PHEV", reliabilityNote: "Motor Ingenium de seis cilindros más sistema híbrido de 400 V: complejidad y coste de reparación muy altos. Evita salvo precio de derribo." },
  JLR_V8: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: 5.0 V8 sobrealimentado JLR", reliabilityNote: "Cadena de distribución y cojinetes de cigüeñal con desgaste prematuro en unidades con mantenimiento irregular. Consumo y mantenimiento muy altos: solo para cliente que lo pida expresamente." },
  VOLVO_B: { reliability: "ok", reliabilityTitle: "CORRECTO: Volvo B3/B4/B5 mild hybrid", reliabilityNote: "Motor Ingenium de gasolina con hibridación ligera 48 V y correa. Correcto con mantenimiento oficial; revisa el módulo 48 V y el filtro de partículas en uso urbano." },
  VOLVO_T8: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Volvo T8 Recharge PHEV", reliabilityNote: "Combinación de motor turbo/sobrealimentado y sistema eléctrico de 400 V. Averías caras y depreciación alta; exige batería con garantía vigente." },
  SSY_22: { reliability: "ok", reliabilityTitle: "CORRECTO: SsangYong 2.2 diésel", reliabilityNote: "Bloque derivado de tecnología Mercedes, robusto y barato de reparar, con caja Aisin fiable. Poco valor residual: compra muy barato y vende rápido." },
  F1A: { reliability: "gold", reliabilityTitle: "FURGÓN INDESTRUCTIBLE: Iveco 2.3 MultiJet (F1A)", reliabilityNote: "El motor de Daily, Ducato y Jumper: cadena, inyección common-rail y 500.000 km de vida útil. La mejor base para camperizar o para reparto en Galicia." },
  TOY_GAS: { reliability: "gold", reliabilityTitle: "FIABILIDAD JAPONESA: gasolina Toyota", reliabilityNote: "Atmosférico de cadena sin turbo ni FAP. Mantenimiento mínimo y valor residual alto. La opción segura cuando el cliente quiere 'un coche que no dé guerra'." },
  TOY_AD: { reliability: "warn", reliabilityTitle: "PRECAUCIÓN: Toyota 2.0/2.2 D-4D (1AD / 2AD)", reliabilityNote: "Juntas de culata y consumo de aceite en unidades 2006-2009 (bloques 1AD-FTV y 2AD-FHV). Toyota amplió la garantía en su día: exige el historial de la culata. Post-2010 corregido." },
  RN_18T: { reliability: "ok", reliabilityTitle: "CORRECTO: Renault 1.8 TCe (M5Pt)", reliabilityNote: "Motor de aluminio con turbo y cadena, usado en Espace, Alpine y Megane RS. Fiabilidad buena; respeta los intervalos de aceite y revisa el turbo en unidades deportivas." },
  EA839: { reliability: "ok", reliabilityTitle: "CORRECTO: V6 2.9/3.0 EA839 (Porsche/Audi)", reliabilityNote: "V6 biturbo desarrollado con Porsche: cadena y rendimiento excelente. Mantenimiento caro y revisiones obligatorias en servicio oficial; revisa el historial de la bomba de agua y de los turbos." },
  TOY_D: { reliability: "ok", reliabilityTitle: "CORRECTO: Toyota 1.4 D-4D", reliabilityNote: "Diésel pequeño de origen PSA (DV4) con correa. Sencillo y barato, aunque algo ruidoso y sin grandes prestaciones." },
};


const ALL = { ...R_EXT, ...R };

export default ALL;

export const RELIABILITY_LEVELS = {
  gold: { label: 'Motor roca', short: 'ROCA', tone: 'emerald', score: 3 },
  ok: { label: 'Correcto', short: 'OK', tone: 'sky', score: 2 },
  warn: { label: 'Precaución', short: 'OJO', tone: 'amber', score: 1 },
  banned: { label: 'PROHIBIDO', short: 'NO', tone: 'rose', score: 0 },
};

/** Devuelve el bloque de fiabilidad de una familia mecánica (o neutro). */
export function reliabilityOf(code) {
  return ALL[code] || { reliability: 'ok', reliabilityTitle: null, reliabilityNote: null };
}

export const ALL_RELIABILITY = ALL;

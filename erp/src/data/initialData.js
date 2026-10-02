export const INITIAL_VEHICLES = [
  {
    id: "car-01",
    brand: "Volkswagen",
    model: "Golf 7.5 R-Line",
    version: "2.0 TDI 150 CV DSG BMT",
    year: 2019,
    km: 115000,
    fuel: "Diésel",
    transmission: "Automático DSG 7 vel.",
    co2: 118, // 0% IEDMT
    cvf: 13.2,
    originCountry: "Alemania",
    originCity: "Frankfurt",
    sellerType: "dealer", // dealer (factura) o private (particular)
    purchasePrice: 13500,
    transportCost: 750, // Portacoches a Coruña
    transportMethod: "truck",
    cocOrFichaCost: 90,
    itvCost: 140, // ITV Espíritu Santo
    dgtFee: 99.77,
    ivtmCost: 38.00, // Concello Coruña prorrateo
    iedmtTax: 0, // <=120 g/km = 0%
    itpTax: 0, // Compra a concesionario = exento ITP
    platesCost: 28,
    reconditioningCost: 220, // Limpieza integral y pulido
    maintenanceCost: 150, // Filtros y aceite
    targetSalePrice: 17400,
    actualSalePrice: 17400,
    status: "sold", // prospect, bought, transit, paperwork, available, sold
    purchaseDate: "2026-06-10",
    arrivalDate: "2026-06-20",
    registrationDate: "2026-06-26",
    saleDate: "2026-07-15",
    daysToSell: 19,
    imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
    vin: "WVWZZZAUZKW142981",
    environmentalBadge: "C (Verde)",
    notes: "Comprado a Autohaus en Frankfurt con libro de revisiones oficial completo. Vendido por Wallapop a un comprador de Oleiros (A Coruña) en 19 días.",
    docsChecklist: {
      teil1: true,
      teil2: true,
      coc: true,
      invoice: true,
      itvPassed: true,
      dgtRegistered: true,
      contractSigned: true,
      taxesDeclared: true
    }
  },
  {
    id: "car-02",
    brand: "BMW",
    model: "Serie 3 Touring Pack M",
    version: "320d 190 CV Steptronic xDrive",
    year: 2018,
    km: 128000,
    fuel: "Diésel",
    transmission: "Automático ZF 8 vel.",
    co2: 128, // 4.75% IEDMT
    cvf: 13.0,
    originCountry: "Alemania",
    originCity: "Múnich",
    sellerType: "dealer",
    purchasePrice: 16800,
    transportCost: 690, // Bajada por carretera con placas rojas alemanas + seguro + vuelos + peajes
    transportMethod: "road",
    cocOrFichaCost: 90,
    itvCost: 145, // ITV Sabón (Arteixo)
    dgtFee: 99.77,
    ivtmCost: 45.00,
    iedmtTax: 420.00, // 4.75% sobre base Hacienda
    itpTax: 0,
    platesCost: 28,
    reconditioningCost: 180,
    maintenanceCost: 220, // Cambio pastillas y líquido
    targetSalePrice: 21900,
    actualSalePrice: null,
    status: "available", // Actualmente en stock para la venta en A Coruña
    purchaseDate: "2026-08-15",
    arrivalDate: "2026-08-20",
    registrationDate: "2026-08-28",
    saleDate: null,
    daysToSell: null,
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    vin: "WBA8H71040K583921",
    environmentalBadge: "C (Verde)",
    notes: "Impecable estado con tracción total xDrive, ideal para el clima gallego. Anunciado en Coches.net y Wallapop. Varios interesados de Arteixo y A Coruña centro.",
    docsChecklist: {
      teil1: true,
      teil2: true,
      coc: true,
      invoice: true,
      itvPassed: true,
      dgtRegistered: true,
      contractSigned: false,
      taxesDeclared: false
    }
  },
  {
    id: "car-03",
    brand: "Audi",
    model: "Q3 S-Line",
    version: "35 TFSI 150 CV S-Tronic Mild-Hybrid",
    year: 2019,
    km: 89000,
    fuel: "Gasolina Mild-Hybrid",
    transmission: "Automático S-Tronic 7 vel.",
    co2: 135, // 4.75% IEDMT
    cvf: 11.1,
    originCountry: "Alemania",
    originCity: "Stuttgart",
    sellerType: "dealer",
    purchasePrice: 20400,
    transportCost: 780, // Camión portacoches
    transportMethod: "truck",
    cocOrFichaCost: 95,
    itvCost: 140, // ITV Espíritu Santo
    dgtFee: 99.77,
    ivtmCost: 42.00,
    iedmtTax: 510.00,
    itpTax: 0,
    platesCost: 28,
    reconditioningCost: 200,
    maintenanceCost: 160,
    targetSalePrice: 25800,
    actualSalePrice: null,
    status: "transit", // En tránsito en camión hacia A Coruña
    purchaseDate: "2026-09-18",
    arrivalDate: "2026-09-27",
    registrationDate: null,
    saleDate: null,
    daysToSell: null,
    imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    vin: "WAUZZZF31K1094832",
    environmentalBadge: "ECO (Microhíbrido)",
    notes: "Etiqueta ECO de la DGT para acceso sin restricciones al centro de A Coruña y ventajas fiscales. Camión contratado con entrega prevista en Polígono Espíritu Santo.",
    docsChecklist: {
      teil1: true,
      teil2: true,
      coc: true,
      invoice: true,
      itvPassed: false,
      dgtRegistered: false,
      contractSigned: false,
      taxesDeclared: false
    }
  }
];

export const CORUNA_LOCATIONS = [
  {
    name: "Jefatura Provincial de Tráfico (DGT A Coruña)",
    address: "Rúa Médico Rodríguez, 5, 15004 A Coruña",
    phone: "060 / 981 23 10 00",
    role: "Matriculación ordinaria definitiva, asignación de matrícula española y expedición del Permiso de Circulación.",
    tips: "Pedir cita previa online ('Matriculación') o tramitar por el Registro Electrónico con certificado digital."
  },
  {
    name: "Estación ITV Espíritu Santo (SyC Applus+)",
    address: "Ctra. N-VI, km 581, 15650 Cambre (A Coruña)",
    phone: "981 67 50 14",
    role: "ITV previa a matriculación e inspección de homologación comunitaria.",
    tips: "Gran experiencia en vehículos importados de Alemania. Entregar Teil I, Teil II, COC o ficha reducida y factura."
  },
  {
    name: "Estación ITV Sabón - Arteixo (SyC Applus+)",
    address: "Polígono Industrial de Sabón, Parcela 110, 15142 Arteixo",
    phone: "981 60 21 02",
    role: "Alternativa rápida en el área industrial de Sabón.",
    tips: "Menos saturación de citas que otras estaciones. Muy puntuales en la emisión de fichas electrónicas e-ITV."
  },
  {
    name: "Delegación Especial AEAT de Galicia (Hacienda)",
    address: "Rúa Comandante Fontanes, 17, 15003 A Coruña",
    phone: "981 16 01 00",
    role: "Presentación y validación del Modelo 576 (Impuesto de Matriculación) y consulta censal.",
    tips: "El Modelo 576 se liquida 100% por internet con obtención inmediata del NRC bancario y justificante."
  },
  {
    name: "ATRIGA - Axencia Tributaria de Galicia (Delegación Coruña)",
    address: "Praza de Pontevedra, 22, 15003 A Coruña",
    phone: "881 99 90 00",
    role: "Modelo 620/621 (Impuesto de Transmisiones Patrimoniales ITP al 8% en Galicia) solo si se compra a particular europeo.",
    tips: "Si se compra a profesional con factura de IVA / REBU, este trámite está exento."
  },
  {
    name: "Concello de A Coruña - Xestión Tributaria",
    address: "Praza de María Pita, 1 / Oficina de Recadación Rúa Franxa 20",
    phone: "010 / 981 18 42 00",
    role: "Alta y liquidación del Impuesto de Vehículos de Tracción Mecánica (IVTM).",
    tips: "Se puede autoliquidar en la sede electrónica del Concello con la ficha técnica para llevar el justificante a la DGT."
  }
];

export const POLIGONOS_CORUNA = [
  {
    name: "Polígono PO.CO.MA.CO (Mesoiro)",
    rentPerM2: "4.50 - 6.50 €/m²",
    avg200m2: "1.000 €/mes",
    pros: "Excelente comunicación directa por Tercera Ronda, naves diáfanas de tamaño medio, facilidad de carga para camiones portacoches.",
    cons: "Algunas naves requieren adecuación estética o suelo de pintura epoxi para exposición moderna.",
    suitability: "⭐⭐⭐⭐⭐ Ideal para arrancar Fase 2"
  },
  {
    name: "Polígono de Agrela (A Coruña urbana)",
    rentPerM2: "6.50 - 9.00 €/m²",
    avg200m2: "1.500 €/mes",
    pros: "Ubicación urbana insuperable junto a Marineda City y concesionarios de referencia, máxima visibilidad y tráfico de clientes.",
    cons: "Rentas más altas y escasez de naves pequeñas (<250 m²).",
    suitability: "⭐⭐⭐⭐ Para fase consolidada con alto volumen"
  },
  {
    name: "Polígono Espíritu Santo / Bergondo",
    rentPerM2: "3.80 - 5.50 €/m²",
    avg200m2: "850 €/mes",
    pros: "A 1 minuto de la ITV de importación, fachadas acristaladas de escaparate sobre la N-VI, alquileres económicos.",
    cons: "Distancia al centro de A Coruña (12 km), el cliente debe desplazarse expresamente con cita.",
    suitability: "⭐⭐⭐⭐⭐ Gran opción de bajo coste fijo"
  },
  {
    name: "Polígono Sabón / Morás (Arteixo)",
    rentPerM2: "4.50 - 7.00 €/m²",
    avg200m2: "1.100 €/mes",
    pros: "Proximidad inmediata a Inditex y su ecosistema laboral de alto poder adquisitivo, conexiones rápidas por autovía AG-55.",
    cons: "Menor tradición de compraventas expuestos que en Agrela.",
    suitability: "⭐⭐⭐⭐ Muy interesante para segmento premium joven"
  }
];

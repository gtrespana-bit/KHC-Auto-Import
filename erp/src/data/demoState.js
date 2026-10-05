// ============================================================================
//  JUEGO DE DATOS DE DEMOSTRACIÓN
// ----------------------------------------------------------------------------
//  Un negocio de ejemplo (autónomo en REBU) con una venta cerrada, dos unidades
//  en stock, una prospección, gastos, contactos y tareas. Sirve para:
//    · que el usuario vea la aplicación funcionando en un clic
//    · ejercitar todas las vistas en la prueba de humo (scripts/smoke.mjs)
//  Las cifras cuadran con las verificadas en `npm run check`.
// ============================================================================

export function demoState() {
  return {
    schema: 2,
    company: {
      name: 'AutoImport Coruña', nif: 'B15000000', address: 'Polígono de Pocomaco, nave 12',
      postalCode: '15009', city: 'A Coruña', province: 'A Coruña', phone: '981 000 000',
      email: 'hola@autoimport.gal', web: 'autoimport.gal', bankIban: 'ES66 2100 0418 4012 3456 7891',
      legalForm: 'autonomo', vatRegime: 'rebu', turnover: 180000, buyerIsBusiness: true,
      warrantyMonths: 12, targetMarginPct: 12, invoicePrefix: 'F2026-', nextInvoiceNumber: 7,
      tariffs: {}, notes: 'Fase 1 como autónomo; SL prevista para 2027.',
      fiscal: { irpfBrackets: null, retaData: '2026-01-01', tarifaPlana: false, monthlyQuota: 425.85, fixedCosts: 900 },
    },
    vehicles: [
      {
        id: 'veh-golf', brand: 'Volkswagen', model: 'Golf 7.5', version: '2.0 TDI 150 CV DSG', year: 2019, km: 118000,
        segment: 'Compacto', body: 'Compacto', engine: '2.0 TDI EA288', engineCode: '20tdi150', fuel: 'Diésel',
        transmission: 'DSG', cv: 150, cc: 1968, cyl: 4, co2: 118, cvf: 13.19, badge: 'C', newPrice: 31500,
        dePrice: [12500, 16000], esPrice: [17500, 20500], reliability: 'gold', reliabilityTitle: 'Motor roca',
        reliabilityNote: 'EA288 sin incidencias graves documentadas.', rotationDays: 45, winner: true,
        plate: '1234 MZZ', vin: 'WVWZZZAUZKW142981', purchaseDate: '2026-01-10', registrationDate: '2026-02-05',
        firstRegDate: '2019-06-01', sellerType: 'pro_eu_vat', taxMethod: 'tablas', status: 'vendido',
        costs: { purchase: 13500, transport: 750, cocFicha: 90, itv: 132.59, dgt: 99.77, placas: 28, iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 99.14, recond: 220, maintenance: 150, guarantee: 240, advertising: 30 },
        sale: { price: 17400, date: '2026-03-14', regime: 'rebu', status: 'cobrado', deposit: 500, depositDate: '2026-03-08' },
        documents: { teil1: true, teil2: true, invoice: true, coc: true, serviceBook: true, keys: true, itv: true, model576: true, dgt: true, insurance: true, contract: true, invoiceOut: true, warranty: true },
        notes: 'Unidad vendida a particular en A Coruña.',
      },
      {
        id: 'veh-rav4', brand: 'Toyota', model: 'RAV4 V', version: '2.5 Hybrid 218 CV', year: 2021, km: 62000,
        segment: 'C-SUV', body: 'SUV', engine: '2.5 Hybrid', engineCode: 'toy25h_218', fuel: 'Híbrido',
        transmission: 'e-CVT', cv: 218, cc: 2487, cyl: 4, co2: 128, cvf: 17.4, badge: 'ECO', newPrice: 42900,
        dePrice: [22000, 28000], esPrice: [27000, 33000], reliability: 'gold', rotationDays: 40, winner: true,
        purchaseDate: '2026-07-02', firstRegDate: '2021-04-01', sellerType: 'pro_eu_rebu', taxMethod: 'tablas',
        status: 'disponible', targetSalePrice: 31900,
        costs: { purchase: 24500, transport: 850, cocFicha: 90, itv: 132.59, dgt: 99.77, placas: 28, ivtm: 132.19, recond: 300, maintenance: 200, advertising: 60 },
        sale: { price: 31900, regime: 'rebu' },
        documents: { teil1: true, teil2: true, invoice: true, coc: true, keys: true, itv: true, model576: true, insurance: true },
        itvDue: '2027-07-01', insuranceDue: '2026-07-01',
      },
      {
        id: 'veh-x3', brand: 'BMW', model: 'X3 F25', version: 'xDrive20d 184 CV', year: 2015, km: 168000,
        segment: 'C-SUV', engine: '2.0d N47', engineCode: 'n47d20', fuel: 'Diésel', cv: 184, cc: 1995, cyl: 4,
        co2: 168, cvf: 15.9, badge: 'C', newPrice: 51200, dePrice: [13000, 16500], esPrice: [17000, 20500],
        reliability: 'banned', reliabilityTitle: 'Cadena de distribución N47', reliabilityNote: 'Rotura de cadena documentada.',
        rotationDays: 90, purchaseDate: '2026-08-20', firstRegDate: '2015-03-01', sellerType: 'private_eu',
        status: 'prospeccion',
        costs: { purchase: 14200 },
        documents: {},
      },
      // Vehículo con el esquema antiguo (campos planos) para ejercitar la migración
      {
        id: 'veh-legacy', brand: 'Peugeot', model: '3008 II', version: '1.5 BlueHDi 130 EAT8', year: 2020,
        purchasePrice: 16800, transportCost: 780, itvCost: 132.59, reconditioningCost: 260,
        status: 'available', targetSalePrice: 22400, purchaseDate: '2026-06-15', km: 74000, cc: 1499, co2: 124,
        fuel: 'Diésel', cv: 130, segment: 'C-SUV', docsChecklist: { teil1: true, invoice: true },
      },
    ],
    expenses: [
      { id: 'exp-1', date: '2026-01-31', category: 'Alquiler / nave', concept: 'Alquiler nave Pocomaco, enero', amount: 650, vatDeductible: 135.21, supplier: 'Inmobiliaria Pocomaco' },
      { id: 'exp-2', date: '2026-02-28', category: 'Cuota de autónomo', concept: 'Cuota RETA febrero', amount: 425.85, vatDeductible: 0 },
      { id: 'exp-3', date: '2026-03-05', category: 'Publicidad y portales', concept: 'Coches.net + Wallapop Pro', amount: 89.9, vatDeductible: 15.61 },
    ],
    contacts: [
      { id: 'ct-1', name: 'Ana Ferreiro', phone: '600 111 222', email: 'ana@example.com', city: 'Santiago', source: 'Wallapop', stage: 'oferta', budget: 32000, vehicleId: 'veh-rav4', interest: 'SUV híbrido automático', nextFollowUp: '2026-09-28', notes: 'Quiere financiación.' },
      { id: 'ct-2', name: 'Talleres Oza', phone: '981 222 333', city: 'A Coruña', source: 'Taller', stage: 'cerrado', budget: 0, vehicleId: 'veh-golf', notes: 'Intermedió la venta del Golf.' },
    ],
    tasks: [
      { id: 'task-1', title: 'Llamar a Ana para cerrar la entrega del RAV4', dueDate: '2026-09-20', priority: 'alta', vehicleId: 'veh-rav4', contactId: 'ct-1', status: 'open' },
      { id: 'task-2', title: 'Pedir informe DGT del X3 antes de comprar', dueDate: '2026-10-02', priority: 'media', vehicleId: 'veh-x3', status: 'done' },
    ],
    filings: [
      { id: '303-2026-T1', model: '303', label: 'IVA 1T 2026', status: 'presentado', filedAt: '2026-04-18', paidAmount: 676.86 },
    ],
    activity: [{ id: 'log-1', at: '2026-09-20T09:12:00.000Z', text: 'Venta registrada: Volkswagen Golf 7.5' }],
    // Publicaciones en la web pública (solo contenido comercial: ni costes ni margen).
    publications: [
      {
        id: 'pub-rav4', vehicleId: 'veh-rav4', site: 'khc', status: 'publicado',
        publishedAt: '2026-09-26T09:00:00.000Z', soldAt: null, updatedAt: '2026-09-26T09:00:00.000Z',
        data: {
          slug: 'toyota-rav4-2021',
          title: 'Toyota RAV4 2.5 Hybrid 218 CV', version: '2.5 Hybrid 218 CV', brand: 'Toyota', model: 'RAV4 V',
          year: 2021, km: 62000, fuel: 'Híbrido', transmission: 'e-CVT', cv: 218, cc: 2487, co2: 128,
          badge: 'ECO', segment: 'C-SUV', firstRegDate: '2021-04-01', originCountry: 'Alemania',
          price: 31900, priceNote: 'Precio al contado, IVA incluido.',
          description: 'Toyota RAV4 V 2.5 Hybrid 218 CV: unidad de 2021 con 62.000 km, etiqueta ECO y consumo real contenido.\n\nSe entrega revisado y con la documentación al día, con libro de mantenimiento y dos llaves. Incluye garantía de 12 meses y acompañamiento en todos los trámites.',
          features: ['218 CV · Híbrido · e-CVT', 'Etiqueta ambiental ECO', 'Libro de mantenimiento', 'Dos llaves'],
          warrantyMonths: 12, financingText: 'Financiación a medida. Consúltanos condiciones sin compromiso.',
          location: 'A Coruña', photos: [],
        },
      },
      {
        id: 'pub-golf', vehicleId: 'veh-golf', site: 'khc', status: 'vendido',
        publishedAt: '2026-02-10T09:00:00.000Z', soldAt: '2026-03-14T09:00:00.000Z', updatedAt: '2026-03-14T09:00:00.000Z',
        data: {
          slug: 'volkswagen-golf-2019', title: 'Volkswagen Golf 7.5 2.0 TDI 150 CV DSG', version: '2.0 TDI 150 CV DSG',
          brand: 'Volkswagen', model: 'Golf 7.5', year: 2019, km: 118000, fuel: 'Diésel', transmission: 'DSG',
          cv: 150, cc: 1968, co2: 118, badge: 'C', segment: 'Compacto', firstRegDate: '2019-06-01',
          originCountry: 'Alemania', price: 17400, priceNote: 'Vendido.',
          description: 'Unidad vendida en 19 días. Mantenemos la ficha publicada como referencia.',
          features: ['150 CV · Diésel · DSG', 'Etiqueta ambiental C', 'Libro de mantenimiento'],
          warrantyMonths: 12, financingText: '', location: 'A Coruña', photos: [],
        },
      },
    ],
    // Contactos llegados desde los formularios de la web.
    leads: [
      {
        id: 'lead-1', kind: 'coche', name: 'Marcos Varela', phone: '600 333 444', email: 'marcos@example.com',
        message: 'Me interesa el RAV4. ¿Se puede ver el sábado por la mañana?',
        vehicleSlug: 'toyota-rav4-2021', source: 'ficha:toyota-rav4-2021', status: 'nuevo',
        createdAt: '2026-10-01T18:22:00.000Z', updatedAt: null,
      },
      {
        id: 'lead-2', kind: 'encargo', name: 'Lucía Piñeiro', phone: '699 555 666',
        email: '', message: 'Busco un Golf o un León automático, hasta 20.000 €, menos de 130.000 km, para enero.',
        vehicleSlug: '', source: 'pagina:encargo', status: 'contactado',
        createdAt: '2026-09-29T09:05:00.000Z', updatedAt: '2026-09-30T10:00:00.000Z',
      },
      {
        id: 'lead-3', kind: 'compra', name: 'Sergio Paleo', phone: '622 777 888',
        email: 'sergio@example.com', message: 'Tengo un León 1.6 TDI de 2016 con 178.000 km, ITV de marzo. ¿Cuánto me dais?',
        vehicleSlug: '', source: 'pagina:compramos-tu-coche', status: 'nuevo',
        createdAt: '2026-09-30T16:40:00.000Z', updatedAt: null,
      },
    ],
    meta: { createdAt: '2026-01-01T00:00:00.000Z', savedAt: '2026-09-20T09:12:00.000Z' },
  };
}

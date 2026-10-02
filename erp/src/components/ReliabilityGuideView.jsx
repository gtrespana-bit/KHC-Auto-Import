import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles,
  Layers,
  Search,
  Filter
} from 'lucide-react';

const SEGMENTS = [
  {
    category: "🚗 Compactos y Berlinas Familiares (Segmento C & D)",
    desc: "Carrocerías hatchback y familiares (Combi/Touring/Avant) de altísima rotación en Galicia por autopistas y clima.",
    winners: [
      { name: "Cupra Formentor 1.5 TSI / 2.0 TDI (150 CV)", engine: "1.5 TSI EA211evo / 2.0 TDI EA288 con DSG DQ381", rot: "8-15 días", profit: "+3.200 € a 4.200 €", badge: "C / ECO", highlight: "El coche más buscado de segunda mano en España hoy en día." },
      { name: "Volkswagen Golf 7.5 2.0 TDI (150 CV)", engine: "EA288 con correa seca duradera y DSG DQ381", rot: "10-18 días", profit: "+2.400 € a 2.900 €", badge: "C", highlight: "Líder absoluto de liquidez y mínimo tiempo de exposición." },
      { name: "Audi A3 Sportback 2.0 TDI (150 CV) S-Line", engine: "EA288, paquete exterior e interior S-Line", rot: "12-18 días", profit: "+2.600 € a 3.300 €", badge: "C", highlight: "Gran valor residual y venta asegurada entre profesionales jóvenes." },
      { name: "Skoda Octavia Combi 2.0 TDI (150 CV)", engine: "EA288 con maletero récord de 640 litros", rot: "12-20 días", profit: "+2.500 € a 3.200 €", badge: "C", highlight: "El familiar más demandado por espacio y economía real." },
      { name: "Toyota Corolla Touring Sports 2.0 Hybrid (184 CV)", engine: "M20A-FXS con cadena metálica (0-100 en 7,9s)", rot: "9-15 días", profit: "+2.700 € a 3.400 €", badge: "ECO", highlight: "Híbrido veloz, consumo de 4,7L y etiqueta ECO para ZBE Coruña." },
      { name: "Mercedes-Benz Clase A 200d (W177) AMG Line", engine: "OM654q 2.0 Diésel (150 CV) 100% Mercedes con 8G-DCT", rot: "10-16 días", profit: "+2.800 € a 3.600 €", badge: "C", highlight: "Doble pantalla MBUX y paquete AMG Line. Se vende solo." },
      { name: "Mercedes CLA 200d Shooting Brake (X118)", engine: "OM654q 2.0 Diésel con 8G-DCT (húmeda)", rot: "12-20 días", profit: "+3.200 € a 4.000 €", badge: "C", highlight: "Diseño coupé familiar que enamora. Márgenes sobresalientes." },
      { name: "BMW Serie 1 (F20 LCI 2) 118d / 120d", engine: "B47D20A (150/190 CV) con caja ZF 8HP Steptronic", rot: "10-15 días", profit: "+2.500 € a 3.200 €", badge: "C", highlight: "El último Serie 1 con propulsión trasera. Coche de culto." },
      { name: "BMW Serie 3 Touring (F31 LCI) 320d xDrive", engine: "B47 190 CV con tracción 4x4 xDrive y cambio ZF", rot: "14-24 días", profit: "+2.600 € a 3.400 €", badge: "C", highlight: "Seguridad total en lluvia para autovías gallegas." },
      { name: "Seat León ST Mk3 Restyling 2.0 TDI FR", engine: "EA288 150 CV con paquete FR deportivo", rot: "12-18 días", profit: "+2.200 € a 2.800 €", badge: "C", highlight: "La alternativa inteligente al Golf con gran salida comercial." }
    ],
    banned: [
      { name: "Peugeot 308 / 508 & Citroën C4 (2014-2023)", reason: "1.2 PureTech (correa deshecha en aceite) o 1.5 BlueHDi (rotura cadena 7mm y fallo AdBlue de 1.200 €)." },
      { name: "Ford Focus / Mondeo Automáticos (pre-2019)", reason: "Caja Powershift 6DCT250 de doble embrague en seco con tirones severos y rotura de mecatrónica." },
      { name: "Renault Mégane / Talisman 1.2 TCe o 1.6 dCi BiTurbo", reason: "1.2 TCe quema 1L de aceite cada 800 km; 1.6 dCi BiTurbo sufre fisuras en culata y rotura del turbo." },
      { name: "BMW Serie 1 / 3 anteriores a 2015 con motor N47", reason: "Rotura de la cadena de distribución trasera por guías y piñones defectuosos. Exigir siempre motor B47." }
    ]
  },
  {
    category: "🚙 SUVs y Crossovers Medios (C-SUV & D-SUV)",
    desc: "Los vehículos con mayor margen bruto unitario (+3.000 € a 5.000 € limpios) y máxima preferencia de compra.",
    winners: [
      { name: "Toyota C-HR 1.8 / 2.0 Hybrid (122 / 184 CV)", engine: "HSD híbrido planetario indestructible", rot: "9-16 días", profit: "+2.800 € a 3.500 €", badge: "ECO", highlight: "Uno de los coches más vendidos de España. Etiqueta ECO sin averías." },
      { name: "Toyota RAV4 Hybrid 2.5 (218 CV / 222 CV AWD-i)", engine: "A25A-FXS con tracción 4x4 eléctrica trasera", rot: "10-18 días", profit: "+3.200 € a 4.200 €", badge: "ECO", highlight: "Depreciación prácticamente cero. Es como un cheque al portador." },
      { name: "Hyundai Tucson 1.6 CRDi 48V N-Line (136 CV)", engine: "Smartstream U3 con cadena y microhibridación", rot: "12-18 días", profit: "+3.300 € a 3.800 €", badge: "ECO", highlight: "Diésel económico + Etiqueta ECO + equipamiento N-Line espectacular." },
      { name: "Kia Sportage 1.6 CRDi GT-Line (136 CV MHEV)", engine: "Cadena doble, cuero perforado, escape doble, sonido JBL", rot: "14-20 días", profit: "+3.100 € a 3.500 €", badge: "ECO", highlight: "Misma base sólida que el Tucson con diseño deportivo agresivo." },
      { name: "Mercedes-Benz GLC 220d 4MATIC (X253 Restyling)", engine: "OM654 2.0 Diésel (194 CV) con cambio 9G-Tronic", rot: "14-22 días", profit: "+3.800 € a 5.000 €", badge: "C", highlight: "El SUV premium predilecto en zonas pudientes como Oleiros o Ciudad Jardín." },
      { name: "Audi Q3 35 TDI (F3 Restyling 2018+)", engine: "EA288evo 2.0 TDI (150 CV) con cambio S-Tronic DQ381", rot: "12-18 días", profit: "+3.200 € a 4.000 €", badge: "C", highlight: "Virtual Cockpit y alta reputación de estatus en A Coruña." },
      { name: "BMW X1 (F48) sDrive18d / xDrive20d", engine: "B47 150/190 CV con maletero de 505L y cambio automático", rot: "12-20 días", profit: "+3.000 € a 3.800 €", badge: "C", highlight: "Comportamiento dinámico insuperable y posición de conducción elevada." },
      { name: "Volkswagen Tiguan 2.0 TDI 150 CV 4Motion", engine: "Tracción total para el invierno gallego con caja DSG DQ381", rot: "14-22 días", profit: "+2.900 € a 3.700 €", badge: "C", highlight: "Solidez y tracción integral perfecta para familias gallegas." },
      { name: "Seat Ateca 2.0 TDI 150 CV FR", engine: "EA288 con chasis dinámico y amplio espacio interior", rot: "11-18 días", profit: "+2.700 € a 3.300 €", badge: "C", highlight: "La opción con mejor relación precio/dinamismo del mercado." },
      { name: "Mazda CX-5 2.0 Skyactiv-G (165 CV) Gasolina", engine: "Atmosférico japonés con cadena. Sin turbo ni FAP", rot: "16-25 días", profit: "+2.600 € a 3.200 €", badge: "C", highlight: "Fiabilidad mecánica legendaria y acabados con piel y Bose." }
    ],
    banned: [
      { name: "Range Rover Evoque & Land Rover Discovery Sport (2015-2021)", reason: "Motor 2.0 Diésel Ingenium: cadena trasera rota antes de 100k km, holgura en eje de turbo y dilución de gasóleo en el cárter." },
      { name: "Nissan Qashqai 1.2 DIG-T o cambio CVT X-Tronic", reason: "Consumo exagerado de aceite y cambio de variador continuo por correa metálica que patina y rompe por 4.500 €." },
      { name: "Peugeot 3008 / 5008 & Citroën C5 Aircross", reason: "Equipados con PureTech o BlueHDi. Fuente inagotable de averías y descontento." },
      { name: "Hyundai Tucson / Kia Sportage 1.6 GDi Atmosférico Gasolina", reason: "Motor perezoso sin par motor (160 Nm). En las cuestas de las autovías gallegas se muere y gasta 9,5L provocando reclamaciones." },
      { name: "Jeep Renegade / Compass (2015-2019)", reason: "Motores 1.4 MultiAir / 1.6 MJet con fallos en electroválvulas y anomalías eléctricas crónicas de la red CAN-Bus." }
    ]
  },
  {
    category: "🚐 Furgonetas Combi, Camperizables y Ocio (El Filón Gallego)",
    desc: "En Galicia este segmento tiene la mayor demanda y retención de precio de toda España por surf, ciclismo, naturaleza y escapadas.",
    winners: [
      { name: "Volkswagen Caddy 4 2.0 TDI (102 o 150 CV)", engine: "EA288 (DFSD/CUUD). Distribución correa seca de larga vida", rot: "10-20 días", profit: "+3.500 € a 4.800 €", badge: "C", highlight: "El vehículo dual definitivo: trabajo de lunes a viernes y camper el finde." },
      { name: "Volkswagen Caravelle / Transporter T6 2.0 TDI 150 CV", engine: "2.0 TDI Monoturbol (CXFA/DNAA) con cambio manual o DSG DQ500", rot: "12-25 días", profit: "+4.500 € a 6.000 €", badge: "C", highlight: "La reina del mundo camper en Galicia. El motor 150 CV mono-turbo es indestructible." },
      { name: "Mercedes-Benz Vito / Clase V (W447) 114/116/119 CDI", engine: "OM654 2.0d o OM651 post-2016 con cambio 9G/7G-Tronic", rot: "15-28 días", profit: "+4.000 € a 6.000 €", badge: "C", highlight: "Vehículo camper y transporte VIP. Se compra caro en Alemania pero se vende de oro en España." },
      { name: "Toyota Proace Verso 2.0 D-4D (150 CV)", engine: "Bloque 2.0 HDI (DW10) hiperfiable con cambio manual 6v", rot: "14-22 días", profit: "+3.200 € a 4.200 €", badge: "C", highlight: "Ojo: equipa el bloque 2.0 DW10 que es una roca francesa fiable (a diferencia del 1.5)." }
    ],
    banned: [
      { name: "Volkswagen T5 / T6 2.0 BiTDI (180 o 204 CV - CFCA / CXEB)", reason: "FALLO CATASTRÓFICO: El enfriador de EGR de aluminio se desintegra; sus virutas rayan los cilindros y provoca consumo de 1L de aceite cada 200 km. Requiere cambio de motor completo (10.000 €). ¡COMPRAR SOLO LA 150 CV MONOTURBO!" },
      { name: "Citroën Berlingo / Peugeot Rifter / Opel Combo 1.5 BlueHDi", reason: "Cadena de sincronización de árboles de 7mm subdimensionada y fallo crónico del depósito de AdBlue." },
      { name: "Renault Trafic / Opel Vivaro 1.6 dCi BiTurbo (2014-2018)", reason: "Roturas del turbo de baja presión y agrietamiento de bloque motor por sobretemperatura." }
    ]
  },
  {
    category: "🚜 Todoterrenos Puros y 4x4 Rurales (El Mercado de Fondo)",
    desc: "Enorme demanda en el rural gallego, cooperativas ganaderas, sector maderero, pesca y aficionados al todoterreno.",
    winners: [
      { name: "Dacia Duster 1.5 dCi 4x4 (115 CV)", engine: "1.5 dCi K9K Gen 8 con 1ª velocidad ultracorta y tracción 4WD con bloqueo", rot: "9-16 días", profit: "+2.300 € a 2.800 €", badge: "C", highlight: "El 4x4 del pueblo. Gastos de mantenimiento mínimos, 5L de consumo y tracción imparable." },
      { name: "Toyota Hilux 2.4 D-4D / 2.8 D-4D Pick-up", engine: "2GD / 1GD con reductora tradicional y chasis de largueros", rot: "12-22 días", profit: "+4.000 € a 5.500 €", badge: "C", highlight: "La pick-up más dura del mundo. En explotaciones del interior gallego se pagan fortunas." },
      { name: "Toyota Land Cruiser (J150) 2.8 D-4D", engine: "1GD-FTV 2.8 Diésel con tracción 4x4 permanente y bloqueo central", rot: "15-30 días", profit: "+4.500 € a 6.500 €", badge: "C", highlight: "Depreciación nula o negativa (sube de valor con los años). El todoterreno supremo." }
    ],
    banned: [
      { name: "Dacia Duster 1.2 TCe Gasolina", reason: "Consumo excesivo de aceite y riesgo de autodetonación en cilindros. Solo comprar el Duster en 1.5 dCi o 1.0 ECO-G." },
      { name: "Nissan Pathfinder / Navara 2.5 dCi (pre-reforzado)", reason: "Desgaste acelerado en casquillos de biela y estiramiento de cadena de distribución primaria." }
    ]
  },
  {
    category: "⚡ Urbanos y Crossovers Compactos (Segmento B & B-SUV)",
    desc: "Coches ágiles para el centro de A Coruña y ZBE, segundos vehículos de hogar y conductores noveles.",
    winners: [
      { name: "Toyota Yaris / Yaris Cross Hybrid (116 CV)", engine: "1.5 3 cilindros M15A con sistema híbrido HSD", rot: "8-14 días", profit: "+2.600 € a 3.200 €", badge: "ECO", highlight: "Consumo de 3,8L en ciudad, etiqueta ECO y facilidad máxima de aparcamiento en A Coruña." },
      { name: "Kia Niro 1.6 GDI HEV Híbrido (141 CV)", engine: "1.6 Atkinson + Eléctrico con cambio 6-DCT de doble embrague", rot: "9-16 días", profit: "+2.700 € a 3.200 €", badge: "ECO", highlight: "Híbrido con cambio real de marchas (no resbala como los CVT). 0% de impuesto de matriculación." },
      { name: "Seat Arona 1.0 TSI (110 o 115 CV) FR / Style", engine: "EA211 1.0 TSI con correa de distribución seca", rot: "10-16 días", profit: "+2.300 € a 2.800 €", badge: "C", highlight: "El SUV urbano líder de ventas en España. Muy ágil y mantenimiento baratísimo." },
      { name: "Renault Clio V 1.0 TCe GLP / 1.5 dCi (K9K)", engine: "1.0 ECO-G GLP con Etiqueta ECO o diésel 1.5 dCi eterno", rot: "9-15 días", profit: "+2.100 € a 2.600 €", badge: "ECO / C", highlight: "Coste por kilómetro imbatible y gran liquidez en el mercado de particulares." },
      { name: "Volkswagen Polo 1.0 TSI (95 / 110 CV)", engine: "EA211 1.0 TSI con cambio manual", rot: "10-17 días", profit: "+2.200 € a 2.700 €", badge: "C", highlight: "Acabados premium en tamaño contenido y alta demanda entre gente joven." }
    ],
    banned: [
      { name: "Peugeot 2008 & Citroën C3 Aircross 1.2 PureTech", reason: "Mismo defecto crítico de correa sumergida que contamina la chupona del cárter." },
      { name: "Ford EcoSport / Fiesta 1.0 EcoBoost (pre-2020)", reason: "Correa de distribución y de bomba de aceite bañadas en aceite con degradación prematura." },
      { name: "Opel Crossland & Mokka 1.2 Turbo", reason: "Montan el motor 1.2 PureTech tras la adquisición de Opel por parte del grupo Stellantis." }
    ]
  },
  {
    category: "👨‍👩‍👧‍👦 Grandes Familiares y Monovolúmenes (7 Plazas)",
    desc: "Vehículos para familias numerosas de 3 o más hijos que necesitan espacio real, maletero y enganche de remolque.",
    winners: [
      { name: "Hyundai Santa Fe / Kia Sorento 2.2 CRDi 4x4", engine: "Bloque 'R' 2.2 de fundición (200 CV / 440 Nm) con doble cadena", rot: "18-30 días", profit: "+3.200 € a 3.800 €", badge: "C", highlight: "7 plazas de verdad con motor incansable para viajar con equipaje y remolques." },
      { name: "BMW Serie 2 Gran Tourer 2.0d (F46)", engine: "B47 150/190 CV con cambio automático de 8 marchas", rot: "14-22 días", profit: "+2.700 € a 3.400 €", badge: "C", highlight: "El único monovolumen de 7 plazas con tacto deportivo de conducción BMW." },
      { name: "Seat Alhambra / VW Sharan 2.0 TDI 150 CV", engine: "EA288 con puertas traseras correderas y 7 asientos individuales", rot: "16-25 días", profit: "+2.800 € a 3.500 €", badge: "C", highlight: "El rey de la modularidad familiar con anclajes ISOFIX en todas las plazas." }
    ],
    banned: [
      { name: "Renault Espace V (2015-2020) 1.6 dCi BiTurbo", reason: "Averías severas de turbo y culata, sumadas a fallos continuos en la caja de cambios EDC y el eje trasero direccional 4Control." },
      { name: "Ford Galaxy & S-Max Automáticos (pre-2018)", reason: "Caja Powershift propensa a sobrecalentamiento, tirones bruscos y averías de la unidad mecatrónica." }
    ]
  }
];

export default function ReliabilityGuideView() {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'koreansuv' | 'blacklist' | 'rotation'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSegments = SEGMENTS.map(seg => {
    if (!searchQuery.trim()) return seg;
    const query = searchQuery.toLowerCase();
    const filteredWinners = seg.winners.filter(w => 
      w.name.toLowerCase().includes(query) || 
      w.engine.toLowerCase().includes(query) ||
      w.highlight.toLowerCase().includes(query)
    );
    const filteredBanned = seg.banned.filter(b => 
      b.name.toLowerCase().includes(query) || 
      b.reason.toLowerCase().includes(query)
    );
    return {
      ...seg,
      winners: filteredWinners,
      banned: filteredBanned
    };
  }).filter(seg => seg.winners.length > 0 || seg.banned.length > 0);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/40 p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
        <div className="max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Matriz Maestra de Inteligencia de Mercado Europeo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Catálogo Completo: Modelos Ganadores vs Modelos Prohibidos
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Hemos ampliado el análisis a todos los segmentos con salida demostrada en A Coruña y España: desde el superventas <strong>Cupra Formentor</strong> y el <strong>Toyota C-HR</strong>, hasta los <strong>Mercedes 200d (OM654)</strong>, <strong>BMW Serie 1 (F20 LCI)</strong>, furgonetas camper <strong>Volkswagen T6 150 CV</strong>, el fenómeno 4x4 rural <strong>Dacia Duster 1.5 dCi</strong> y los todoterrenos Toyota.
          </p>
        </div>
      </div>

      {/* Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>🎯 Matriz Completa ({SEGMENTS.reduce((acc, s) => acc + s.winners.length, 0)} Modelos Ganadores)</span>
          </button>

          <button
            onClick={() => setActiveTab('koreansuv')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'koreansuv'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>🔥 Especial Coreanos (Tucson / Sportage / Niro)</span>
          </button>

          <button
            onClick={() => setActiveTab('blacklist')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'blacklist'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>🚫 Lista Negra & Motores Trampa</span>
          </button>

          <button
            onClick={() => setActiveTab('rotation')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'rotation'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>⏱️ Ranking Días de Stock</span>
          </button>
        </div>

        {activeTab === 'matrix' && (
          <div className="relative shrink-0 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Filtrar modelo, motor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* TAB 1: FULL SEGMENTS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-8">
          {filteredSegments.map((seg, sIdx) => (
            <div key={sIdx} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>{seg.category}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{seg.desc}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Winners (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Modelos Ganadores ({seg.winners.length} coches recomendados)</span>
                  </div>

                  <div className="space-y-2.5">
                    {seg.winners.map((win, wIdx) => (
                      <div 
                        key={wIdx}
                        className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between gap-2.5 hover:border-emerald-500/70 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-white">{win.name}</span>
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                                {win.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">{win.engine}</p>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0 text-xs text-right">
                            <div className="hidden sm:block">
                              <span className="text-[10px] text-slate-500 block">Rotación:</span>
                              <span className="font-semibold text-slate-300">{win.rot}</span>
                            </div>
                            <div className="bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                              <span className="text-[9px] text-emerald-400 block font-semibold">Neto estimado:</span>
                              <span className="font-bold text-emerald-300 text-xs">{win.profit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-amber-200/80 bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800/80">
                          💡 {win.highlight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banned (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <XCircle className="w-4 h-4" />
                    <span>Modelos Prohibidos en este Segmento</span>
                  </div>

                  <div className="space-y-2.5">
                    {seg.banned.map((ban, bIdx) => (
                      <div 
                        key={bIdx}
                        className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1 text-xs"
                      >
                        <span className="font-bold text-rose-300 block text-xs">{ban.name}</span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">{ban.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: KOREAN SUVS */}
      {activeTab === 'koreansuv' && (
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>El Fenómeno de los SUVs Coreanos (Hyundai & Kia) en Galicia</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tienen el mayor nivel de equipamiento por euro del mercado (Full Equip de serie) y una demanda descomunal en A Coruña.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                name: "Hyundai Tucson 1.6 CRDi 48V (136 CV) N-Line / Tecno",
                years: "2019 - 2021",
                engine: "1.6 Smartstream Diésel Microhíbrido (Cadena doble)",
                badge: "ECO (DGT)",
                whyGold: "Diésel de 5 l/100 km con Etiqueta ECO oficial. Cero problemas de correa porque lleva distribución por cadena. Equipamiento N-Line espectacular (techo panorámico, asientos ventilados, cámara 360).",
                germanyPrice: "15.500 € - 17.000 €",
                corunaPrice: "21.900 € - 23.490 €",
                netProfit: "+3.300 € a 3.700 €",
                rotation: "12 a 18 días en A Coruña"
              },
              {
                name: "Kia Sportage 1.6 CRDi MHEV 136 CV GT-Line",
                years: "2019 - 2021",
                engine: "1.6 CRDi 48V con cambio 7-DCT o Manual",
                badge: "ECO (DGT)",
                whyGold: "Misma base mecánica fiable que el Tucson. El acabado GT-Line entra por los ojos: doble escape cromado, tapicería de cuero perforado, volante achatado y sonido JBL. Reventa inmediata.",
                germanyPrice: "15.000 € - 16.500 €",
                corunaPrice: "20.900 € - 22.500 €",
                netProfit: "+3.100 € a 3.500 €",
                rotation: "14 a 20 días en A Coruña"
              },
              {
                name: "Kia Niro 1.6 GDI HEV Híbrido (141 CV) Emotion / Drive",
                years: "2019 - 2021",
                engine: "1.6 Gasolina Atkinson + Motor Eléctrico (Sin turbo)",
                badge: "ECO (DGT)",
                whyGold: "Híbrido autorrecargable con cambio automático de doble embrague de 6 marchas. Consumo de 4,3 l/100 km. 0% de impuesto de matriculación. Fiabilidad indestructible.",
                germanyPrice: "14.000 € - 15.500 €",
                corunaPrice: "18.500 € - 19.900 €",
                netProfit: "+2.700 € a 3.100 €",
                rotation: "9 a 16 días en A Coruña"
              },
              {
                name: "Hyundai Santa Fe 2.2 CRDi (200 CV) 4x4 7 Plazas",
                years: "2016 - 2019",
                engine: "Bloque 'R' 2.2 Diésel de fundición de hierro (200 CV / 440 Nm)",
                badge: "C (Verde)",
                whyGold: "El todoterreno familiar definitivo: 7 plazas reales, maletero gigantesco, tracción 4x4 y motor de hierro que aguanta 400.000 km. Ojo al Modelo 576 (tramo 9,75%), pero muy cotizado por familias numerosas en Galicia.",
                germanyPrice: "16.000 € - 18.000 €",
                corunaPrice: "23.500 € - 25.500 €",
                netProfit: "+3.200 € a 3.800 €",
                rotation: "18 a 30 días en A Coruña"
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                      RECOMENDACIÓN TOP
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">
                    {item.name}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-slate-400">Motor:</strong> {item.engine}</p>
                    <p><strong className="text-slate-400">Años recomendados:</strong> {item.years}</p>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                    💡 <strong>Por qué triunfa en Galicia:</strong> {item.whyGold}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Mobile.de</span>
                      <span className="font-semibold text-white">{item.germanyPrice}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PVP Coruña</span>
                      <span className="font-semibold text-amber-400">{item.corunaPrice}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Neto Limpio</span>
                      <span className="font-bold text-emerald-400">{item.netProfit}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300 font-semibold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotación estimada: {item.rotation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BLACKLIST DETAILED */}
      {activeTab === 'blacklist' && (
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <span>La Lista Negra: Motores Problemáticos que Arruinan Compraventas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tienen fallos de diseño reconocidos. Aunque parezcan baratos en Mobile.de, te costarán miles de euros en demandas y clientes enfadados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                name: "Volkswagen T5 / T6 2.0 BiTDI (CFCA / CXEB - 180 / 204 CV)",
                brands: "Volkswagen Transporter, Caravelle, Multivan, California",
                years: "2010 - 2019",
                problem: "FALLO CATASTRÓFICO: El enfriador de aluminio de la EGR se oxida y se disuelve, arrojando virutas metálicas dentro de los cilindros. Provoca un consumo salvaje de 1L de aceite cada 200 km y requiere cambiar el motor entero (10.000 €). Solo comprar el 2.0 TDI mono-turbo de 150 CV.",
                verdict: "🚫 PELIGRO DE MUERTE MECÁNICA"
              },
              {
                name: "Stellantis 1.2 PureTech (EB2)",
                brands: "Peugeot 208/2008/3008, Citroën C3/C4, Opel Corsa/Crossland",
                years: "2014 - 2023",
                problem: "Correa húmeda bañada en aceite (Wet Belt). La gasolina degrada la correa, tapa la chupona, destruye la bomba de vacío y gripa el motor. Macrodemandas en España y Francia.",
                verdict: "🚫 PROHIBIDO IMPORTAR"
              },
              {
                name: "Stellantis 1.5 BlueHDi (DV5)",
                brands: "Peugeot, Citroën, Opel (años 2018-2023)",
                years: "2018 - 2023",
                problem: "Cadena de 7mm entre árboles de levas subdimensionada que rompe prematuramente. Fallo continuo en la bomba integrada del depósito de AdBlue (1.200 €).",
                verdict: "🚫 EVITAR ABSOLUTAMENTE"
              },
              {
                name: "Renault / Nissan 1.2 TCe (H5Ft) & 1.2 DIG-T",
                brands: "Renault Mégane, Captur, Kadjar; Nissan Qashqai, Juke, Dacia Duster",
                years: "2012 - 2018",
                problem: "Segmentos defectuosos, consumo masivo de aceite (1L/800 km) y rotura de válvulas de escape por autodetonación (LSPI).",
                verdict: "🚫 PROHIBIDO IMPORTAR"
              },
              {
                name: "Jaguar & Land Rover 2.0 Diésel Ingenium",
                brands: "Range Rover Evoque, Discovery Sport, Jaguar F-Pace, XE",
                years: "2015 - 2021",
                problem: "Cadena de distribución trasera con patines plásticos que se desintegran antes de los 100.000 km, eje de turbo con holgura y gasóleo en cárter.",
                verdict: "🚫 PROHIBIDO"
              },
              {
                name: "Ford 1.0 EcoBoost (Fox con correa húmeda)",
                brands: "Ford Fiesta, Focus, EcoSport (2012-2019)",
                years: "2012 - 2019",
                problem: "Correa de distribución y de bomba de aceite bañadas en aceite. Al degradarse bloquean lubricación. (Solo fiables a partir de 2020 con cadena mHEV).",
                verdict: "🚫 EVITAR pre-2020"
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 rounded-xl border border-rose-500/30 p-5 shadow-lg flex flex-col justify-between space-y-4 bg-gradient-to-b from-rose-950/10 to-slate-900"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-rose-400 bg-rose-500/20 px-2.5 py-0.5 rounded border border-rose-500/30">
                      PELIGRO CRÍTICO
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {item.years}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">
                    {item.name}
                  </h3>

                  <p className="text-xs text-slate-400">
                    <strong>Marcas y Modelos:</strong> {item.brands}
                  </p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-rose-500/20 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                    <span className="font-bold text-rose-400 block">El Fallo de Diseño Fatal:</span>
                    <p>{item.problem}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 font-bold">
                  {item.verdict}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ROTATION RANKING */}
      {activeTab === 'rotation' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Ranking de Velocidad de Venta (Días en Stock en A Coruña y Galicia)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tiempo medio comprobado que tarda cada modelo en venderse y formalizar la transferencia en A Coruña
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                rank: "1º",
                car: "Cupra Formentor 1.5 TSI / 2.0 TDI (150 CV)",
                time: "8 a 15 días",
                why: "Es el coche de mayor tirón mediático y demanda activa en el mercado joven y profesional en España.",
                badge: "C / ECO",
                badgeColor: "bg-amber-500 text-slate-950"
              },
              {
                rank: "2º",
                car: "Toyota Yaris Cross & C-HR Hybrid (Etiqueta ECO)",
                time: "8 a 15 días",
                why: "Inmunes a la ZBE de A Coruña. Máxima fiabilidad del planeta. Se venden solos con colas de interesados.",
                badge: "ECO",
                badgeColor: "bg-emerald-500 text-slate-950"
              },
              {
                rank: "3º",
                car: "Volkswagen Golf 7.5 & Audi A3 Sportback 2.0 TDI (150 CV) DSG",
                time: "10 a 18 días",
                why: "Los modelos compactos diésel más buscados de Galicia. Mínima depreciación y reventa asegurada.",
                badge: "C",
                badgeColor: "bg-amber-500 text-slate-950"
              },
              {
                rank: "4º",
                car: "Volkswagen Caddy 4 2.0 TDI & T6 Caravelle 150 CV Combi",
                time: "10 a 20 días",
                why: "Enorme demanda de surfistas, familias y profesionales en A Coruña. Retiene el valor como el oro y deja márgenes de más de 4.000€.",
                badge: "C",
                badgeColor: "bg-amber-500 text-slate-950"
              },
              {
                rank: "5º",
                car: "Hyundai Tucson 1.6 CRDi 48V N-Line & Kia Sportage GT-Line (Etiqueta ECO)",
                time: "12 a 18 días",
                why: "El formato SUV más vendido de España con equipamiento Full Equip por menos de 23.000€.",
                badge: "ECO",
                badgeColor: "bg-emerald-500 text-slate-950"
              },
              {
                rank: "6º",
                car: "Mercedes-Benz Clase A 200d (W177) AMG Line & CLA Shooting Brake",
                time: "10 a 16 días",
                why: "El motor 2.0 diésel OM654 de Mercedes con doble pantalla MBUX y paquete AMG vuela en el mercado gallego.",
                badge: "C",
                badgeColor: "bg-amber-500 text-slate-950"
              },
              {
                rank: "7º",
                car: "Dacia Duster 1.5 dCi 4x4 (K9K) & Toyota Hilux Pick-up",
                time: "9 a 16 días",
                why: "Demanda incansable en las comarcas del interior de A Coruña y Lugo por explotaciones y pistas rurales.",
                badge: "C",
                badgeColor: "bg-amber-500 text-slate-950"
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center space-x-3.5">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                    {item.rank}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-white">{item.car}</h4>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      {item.why}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Tiempo de Venta:</span>
                  <span className="text-sm font-black text-emerald-400">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

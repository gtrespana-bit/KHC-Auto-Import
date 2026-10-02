import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { CORUNA_LOCATIONS } from '../data/initialData';

const STEPS = [
  {
    id: "step-1",
    title: "1. Búsqueda y Compra Segura en Europa (Alemania / Bélgica)",
    desc: "Mobile.de y Autoscout24. Documentación alemana y contratos.",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>
          Alemania es el mercado líder por volumen y rigor de mantenimiento. Busca siempre anuncios con las etiquetas:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300">
          <li><strong className="text-white">Scheckheftgepflegt:</strong> Historial oficial de revisiones sellado. Vital para la reventa en A Coruña.</li>
          <li><strong className="text-white">Unfallfrei:</strong> Sin accidentes estructurales previos.</li>
          <li><strong className="text-white">HU / AU neu (TÜV):</strong> Inspección técnica alemana recién superada.</li>
        </ul>
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <strong className="text-amber-400 block">Papeles obligatorios que debes traerte:</strong>
          <p>1. <strong>Zulassungsbescheinigung Teil I</strong> (Permiso de circulación extranjero verde).</p>
          <p>2. <strong>Zulassungsbescheinigung Teil II</strong> (Título de propiedad / Fahrzeugbrief original).</p>
          <p>3. <strong>COC (Certificado de Conformidad Europeo)</strong> original emitido por el fabricante.</p>
          <p>4. <strong>Factura comercial</strong> (si compras a compraventa con NIF intracomunitario) o <strong>Kaufvertrag</strong> con copia de DNI/Pasaporte si es particular.</p>
        </div>
      </div>
    )
  },
  {
    id: "step-2",
    title: "2. Traslado del Vehículo a A Coruña (Camión vs Rodando)",
    desc: "Cómo transportar el vehículo minimizando costes y riesgos.",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <span className="font-bold text-amber-400 block">Opción A: Camión Portacoches (Recomendado)</span>
            <p>Coste medio Alemania → Coruña: <strong>650 € - 850 €</strong>.</p>
            <p>Plazo habitual: 6 a 12 días laborables.</p>
            <p>Entrega habitualmente en polígonos como Espíritu Santo, Sabón o PO.CO.MA.CO donde los trailers de 8 coches pueden maniobrar.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <span className="font-bold text-white block">Opción B: Bajar Conduciendo con Placas Rojas</span>
            <p>Solicitar en la Zulassungsstelle alemana las <strong>Ausfuhrkennzeichen</strong> (placas de exportación con franja roja, 15-30 días).</p>
            <p>Incluye seguro internacional temporal (carta verde). Coste total placas + seguro + vuelo + peajes Francia + combustible: <strong>~700 €</strong>.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "step-3",
    title: "3. Ficha Técnica Reducida & Cita de ITV en A Coruña",
    desc: "Homologación obligatoria previa a la matriculación española.",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>
          Si no dispones del COC original, contrata una <strong>Ficha Técnica Reducida</strong> emitida por un ingeniero colegiado (70€-95€ online en 24h).
        </p>
        <p>
          Pide cita previa para <strong>ITV Previa a Matriculación</strong> en:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-white block">ITV Espíritu Santo (Cambre / N-VI)</strong>
            <span className="text-slate-400 text-[11px]">Altísima experiencia con vehículos alemanes de importación. Trato ágil con la e-ITV.</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-white block">ITV Sabón (Arteixo)</strong>
            <span className="text-slate-400 text-[11px]">Instalaciones amplias y citas más accesibles en fines de semana o tardes.</span>
          </div>
        </div>
        <p className="text-amber-300 text-[11px]">
          Coste de la inspección: <strong>~135 € a 155 €</strong>. La estación retendrá temporalmente la documentación extranjera original y emitirá la ficha técnica española electrónica.
        </p>
      </div>
    )
  },
  {
    id: "step-4",
    title: "4. Hacienda Estatal (Modelo 576) y Concello de A Coruña (IVTM)",
    desc: "Liquidación telemática del impuesto de matriculación y el 'numerito'.",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <div className="space-y-2">
          <p><strong className="text-white">A. Impuesto Especial de Matriculación (Modelo 576 AEAT):</strong></p>
          <p>
            Se presenta telemáticamente en la web de la Agencia Tributaria con Cl@ve o Certificado Digital. 
            Si el vehículo emite <strong>≤ 120 g/km CO2 (WLTP)</strong>, está exento al <strong>0%</strong> (pero es obligatorio presentar el modelo y obtener el código electrónico CEM).
          </p>
        </div>
        <div className="space-y-2">
          <p><strong className="text-white">B. Impuesto de Vehículos de Tracción Mecánica (IVTM Concello A Coruña):</strong></p>
          <p>
            Se tramita en la Oficina Tributaria del Concello de A Coruña (Plaza de María Pita o sede electrónica). 
            Se liquida el trimestre en curso según los caballos fiscales (CVF) del coche (~35€ a 50€).
          </p>
        </div>
      </div>
    )
  },
  {
    id: "step-5",
    title: "5. Jefatura de Tráfico DGT de A Coruña (Médico Rodríguez)",
    desc: "Asignación de matrícula definitiva española y Permiso de Circulación.",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>
          Sede física: <strong>Rúa Médico Rodríguez, 5, 15004 A Coruña</strong> (o telemático mediante Registro Electrónico).
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tasa oficial DGT 1.1: <strong>99,77 €</strong>.</li>
          <li>Aportar: Solicitud oficial, DNI, justificante del Modelo 576 de Hacienda, carta de pago IVTM del Concello de A Coruña, y expediente ITV.</li>
        </ul>
        <p className="text-emerald-400 font-semibold">
          En el mismo instante se te asigna el número de matrícula definitivo (ej: 5412-MZY) y se imprime el Permiso de Circulación oficial a tu nombre.
        </p>
      </div>
    )
  },
  {
    id: "step-6",
    title: "6. Troquelado de Placas, Detallado y Publicación en Coruña",
    desc: "Preparación estética y venta a particulares en Galicia.",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>
          1. Troquelar placas acrílicas de metacrilato en Norauto Marineda o Feu Vert (~28€).
        </p>
        <p>
          2. Detallado profesional: Lavado a presión de bajos, limpieza de tapicería con inyección-extracción y desinfección con ozono (~150€-200€).
        </p>
        <p>
          3. Reportaje fotográfico de 25-30 fotos en lugares representativos de A Coruña (O Parrote, Torre de Hércules o Mirador de San Pedro).
        </p>
        <p>
          4. Publicar en <strong>Wallapop</strong> (el canal con mayor dinamismo en Galicia) y <strong>Coches.net</strong>. Incluir informe Carfax o CarVertical para generar máxima confianza.
        </p>
      </div>
    )
  },
  {
    id: "step-7",
    title: "7. Cierre de Venta Legal y Declaración de IRPF",
    desc: "Protección jurídica de 6 meses y liquidación tributaria limpia.",
    content: (
      <div className="space-y-3 text-xs text-slate-300">
        <p>
          - Firmar el <strong>Contrato de Compraventa entre Particulares</strong> con la cláusula de sumisión exclusiva a los artículos 1484 y ss. del Código Civil (vicios ocultos durante 6 meses, sin garantía comercial de 1 año).
        </p>
        <p>
          - Notificar la venta a la DGT o exigir al comprador que presente el cambio de titularidad en 15 días.
        </p>
        <p>
          - <strong>Declaración en Renta (IRPF):</strong> Anotar el beneficio neto (Precio Venta - Precio Compra - Todos los gastos justificados con factura) para incluirlo en la Base Imponible del Ahorro (Modelo 100 anual).
        </p>
      </div>
    )
  }
];

export default function GuideView() {
  const [openSteps, setOpenSteps] = useState({ 'step-1': true, 'step-3': true, 'step-5': true });
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('importauto_completed_steps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleStep = (id) => {
    setOpenSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCheckStep = (id, e) => {
    e.stopPropagation();
    const updated = { ...completedSteps, [id]: !completedSteps[id] };
    setCompletedSteps(updated);
    localStorage.setItem('importauto_completed_steps', JSON.stringify(updated));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            <span>Procedimiento Oficial y Local</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Guía Operativa: De Europa a A Coruña
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manual de campo con trámites exactos, plazos, costes y ubicaciones en el área de A Coruña.
          </p>
        </div>

        {/* Completion Progress Widget */}
        <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            {completedCount}/{STEPS.length}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Progreso del Flujo</span>
            <span className="text-xs font-bold text-white">
              {Math.round((completedCount / STEPS.length) * 100)}% de los hitos completados
            </span>
          </div>
        </div>
      </div>

      {/* Accordion Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const isOpen = Boolean(openSteps[step.id]);
          const isDone = Boolean(completedSteps[step.id]);

          return (
            <div 
              key={step.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isDone 
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div 
                onClick={() => toggleStep(step.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <button
                    onClick={(e) => toggleCheckStep(step.id, e)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      isDone 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'border border-slate-700 hover:border-amber-400 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div>
                    <h3 className={`text-sm sm:text-base font-bold ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="text-slate-400 p-1">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 bg-slate-950/40">
                  {step.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Directory of Local Offices in A Coruña */}
      <div className="space-y-4 pt-4">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span>Directorio de Trámites en A Coruña y Área Metropolitana</span>
          </h2>
          <p className="text-xs text-slate-400">
            Direcciones exactas, teléfonos y consejos prácticos para que no pierdas viajes ni tiempo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORUNA_LOCATIONS.map((loc, idx) => (
            <div 
              key={idx}
              className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
                  Sede Oficial Coruña
                </span>
                <h4 className="font-bold text-sm text-white">
                  {loc.name}
                </h4>
                <p className="text-xs text-slate-300 flex items-start space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{loc.address}</span>
                </p>
                <p className="text-xs text-slate-400 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{loc.phone}</span>
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  <strong>Trámite:</strong> {loc.role}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-amber-300/90 leading-tight">
                💡 <strong>Consejo:</strong> {loc.tips}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

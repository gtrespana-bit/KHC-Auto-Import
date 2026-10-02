import React, { useState } from 'react';
import { BookOpen, ShieldCheck, MapPin, FileText, Rocket } from 'lucide-react';
import { SectionTitle, Tabs, Alert } from '../components/ui.jsx';
import GuideView from '../components/GuideView.jsx';
import ReliabilityGuideView from '../components/ReliabilityGuideView.jsx';
import Phase2RoadmapView from '../components/Phase2RoadmapView.jsx';
import ContractsView from '../components/ContractsView.jsx';

export default function GuidesView({ vehicles = [], initialTab = 'importacion' }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={BookOpen}
        title="Guías y documentos"
        subtitle="El proceso de importación paso a paso, la fiabilidad de cada motor, los contratos listos para imprimir y el plan para pasar de particular a autónomo o sociedad."
      />

      <Alert tone="info">
        Las guías explican el procedimiento. Cuando tengas los datos de un coche concreto, usa el <b>simulador</b> y la pestaña <b>Impuestos</b>: ahí los importes se calculan con tus cifras reales, no con ejemplos.
      </Alert>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'importacion', label: 'Proceso de importación' },
          { id: 'fiabilidad', label: 'Fiabilidad de motores' },
          { id: 'contratos', label: 'Contratos' },
          { id: 'fase2', label: 'Plan de crecimiento' },
        ]}
      />

      <div className="pb-8">
        {tab === 'importacion' && <GuideView />}
        {tab === 'fiabilidad' && <ReliabilityGuideView />}
        {tab === 'contratos' && <ContractsView vehicles={vehicles} />}
        {tab === 'fase2' && <Phase2RoadmapView />}
      </div>
    </div>
  );
}

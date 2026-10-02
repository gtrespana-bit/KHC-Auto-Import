import React, { useState } from 'react';
import { Table2, ChevronDown, ChevronUp, Landmark, Scale, Building2, Receipt, Cog, ArrowDownToLine, Info } from 'lucide-react';
import {
  TAX_TABLES_YEAR,
  IEDMT_BRACKETS,
  HACIENDA_DEPRECIATION,
  HACIENDA_VALUATION_NOTES,
  IVTM_CORUNA_TURISMOS,
  IVTM_CORUNA_BONIFICACIONES,
  REGISTRATION_FEES,
  CVF_EXAMPLES,
  IRPF_SAVINGS_BRACKETS,
} from '../data/taxTables';
import { computeCvf, getHaciendaValuation, getIedmtRate, formatEuro, formatEuroDetailed } from '../utils/calculations';

const TABS = [
  { id: 'iedmt', label: 'Impuesto Matriculación (576)', icon: Landmark },
  { id: 'venal', label: 'Valor Venal Hacienda', icon: Scale },
  { id: 'ivtm', label: 'IVTM Concello Coruña', icon: Building2 },
  { id: 'fees', label: 'Tasas DGT / ITV / Gestoría', icon: Receipt },
  { id: 'cvf', label: 'Calculadora CVF', icon: Cog },
];

const th = 'text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold py-2 px-2 border-b border-slate-800';
const td = 'py-2 px-2 text-xs border-b border-slate-800/60';
const rowHl = 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/40';

export default function ReferenceTablesPanel({ formData, valuation, onApply }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('iedmt');
  const [cvfCalc, setCvfCalc] = useState({ cc: 1968, cyl: 4 });
  const [venalCalc, setVenalCalc] = useState({ newPrice: formData.newPrice || 30000, year: formData.year || 2019, co2: formData.co2 || 120 });

  const currentRate = getIedmtRate(formData.co2);
  const cvfResult = computeCvf(cvfCalc.cc, cvfCalc.cyl);
  const venalResult = getHaciendaValuation(venalCalc);

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Table2 className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block">Tablas oficiales de referencia {TAX_TABLES_YEAR}</span>
            <span className="text-[11px] text-slate-400">
              Tramos Mod. 576 · Depreciación y valor venal Hacienda · IVTM A Coruña · Tasas DGT/ITV · Fórmula CVF
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-800">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto px-3 pt-3 scrollbar-none">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-colors ${
                    active ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5 space-y-4">

            {/* ---------------- IEDMT ---------------- */}
            {tab === 'iedmt' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Impuesto Especial sobre Determinados Medios de Transporte (Ley 38/1992, art. 70). Se liquida en la AEAT de A Coruña (Mod. 576) <strong className="text-slate-200">antes</strong> de pedir cita en la DGT. Galicia aplica los tipos estatales. La fila resaltada es la que aplica a tu vehículo ({formData.co2} g/km).
                </p>
                <table className="w-full">
                  <thead><tr><th className={th}>Epígrafe</th><th className={th}>Emisiones CO₂ (WLTP)</th><th className={th}>Tipo</th><th className={th}>Ejemplos</th></tr></thead>
                  <tbody>
                    {IEDMT_BRACKETS.map((b) => {
                      const hl = Number(formData.co2) >= b.minCo2 && Number(formData.co2) <= b.maxCo2;
                      return (
                        <tr key={b.epigrafe} className={hl ? rowHl : ''}>
                          <td className={`${td} text-slate-300 font-semibold`}>{b.epigrafe}</td>
                          <td className={`${td} text-white`}>{b.label}</td>
                          <td className={`${td} font-black ${b.rate === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{(b.rate * 100).toFixed(2)} %</td>
                          <td className={`${td} text-slate-400`}>{b.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="grid sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block">Tipo aplicable</span>
                    <span className="text-lg font-black text-white">{(currentRate * 100).toFixed(2)} %</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block">Base imponible ({valuation.source === 'tablas' ? 'tablas Hacienda' : 'precio factura'})</span>
                    <span className="text-lg font-black text-white">{formatEuro(valuation.base)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-amber-500/30">
                    <span className="text-slate-400 block">Cuota Mod. 576</span>
                    <span className="text-lg font-black text-amber-400">{formatEuroDetailed(valuation.base * currentRate)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 flex items-start gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0" />Si el CO₂ es ≤ 120 g/km se presenta el Mod. 06 (exención) en lugar del 576. Los datos de CO₂ WLTP se leen del COC (campo 49) o del Teil I alemán (campo V.7).</p>
              </div>
            )}

            {/* ---------------- VALOR VENAL ---------------- */}
            {tab === 'venal' && (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hacienda publica cada año la <strong className="text-slate-200">Orden de precios medios de venta</strong> (BOE, diciembre) con el precio del vehículo nuevo y una tabla de porcentajes por antigüedad. Ese valor venal es la referencia mínima que acepta la AEAT (Mod. 576) y Atriga (ITP Mod. 620). Los precios medios de nuestra base de datos son <strong className="text-amber-300">orientativos</strong>: comprueba el importe exacto en la Orden vigente (buscar por marca + modelo + CV en el Anexo I).
                </p>

                <div className="grid lg:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Anexo IV · % del precio medio según antigüedad</span>
                    <table className="w-full">
                      <thead><tr><th className={th}>Antigüedad</th><th className={th}>% valor</th></tr></thead>
                      <tbody>
                        {HACIENDA_DEPRECIATION.map((d, i) => {
                          const prev = i === 0 ? 0 : HACIENDA_DEPRECIATION[i - 1].maxYears;
                          const age = Math.max(1, venalResult.age);
                          const hl = age > prev && age <= d.maxYears;
                          return (
                            <tr key={d.label} className={hl ? rowHl : ''}>
                              <td className={`${td} text-white`}>{d.label}</td>
                              <td className={`${td} font-black text-amber-400`}>{d.pct} %</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Simulador de valor venal</span>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <label className="block">
                        <span className="text-slate-400 block mb-1">Precio medio nuevo (€)</span>
                        <input type="number" step="500" value={venalCalc.newPrice} onChange={(e) => setVenalCalc({ ...venalCalc, newPrice: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-none" />
                      </label>
                      <label className="block">
                        <span className="text-slate-400 block mb-1">Año 1ª matric.</span>
                        <input type="number" value={venalCalc.year} onChange={(e) => setVenalCalc({ ...venalCalc, year: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-none" />
                      </label>
                      <label className="block">
                        <span className="text-slate-400 block mb-1">CO₂ g/km</span>
                        <input type="number" value={venalCalc.co2} onChange={(e) => setVenalCalc({ ...venalCalc, co2: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-none" />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 block">Antigüedad · % aplicado</span>
                        <span className="text-sm font-black text-white">{venalResult.age} años · {(venalResult.depreciation * 100).toFixed(0)} %</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 block">Valor venal (ITP / referencia)</span>
                        <span className="text-sm font-black text-white">{formatEuro(venalResult.valorVenal)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-amber-500/30 col-span-2">
                        <span className="text-slate-400 block">Base IEDMT (minorada IVA 21 % + IEDMT {(venalResult.rate * 100).toFixed(2)} %)</span>
                        <span className="text-sm font-black text-amber-400">{formatEuro(venalResult.iedmtBase)}</span>
                        <span className="text-slate-500 ml-2">→ cuota {formatEuroDetailed(venalResult.iedmtBase * venalResult.rate)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onApply?.({ newPrice: venalCalc.newPrice, valuationMethod: 'tablas' })}
                      className="w-full py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" /> Usar este precio medio y liquidar por tablas
                    </button>
                  </div>
                </div>

                <ul className="space-y-1">
                  {HACIENDA_VALUATION_NOTES.map((n, i) => (
                    <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0" />{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ---------------- IVTM ---------------- */}
            {tab === 'ivtm' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Impuesto sobre Vehículos de Tracción Mecánica del <strong className="text-slate-200">Concello de A Coruña</strong> (Ordenanza Fiscal nº 2), turismos según potencia fiscal. En el año de alta se paga la parte proporcional por trimestres naturales (el simulador aplica 2/4 por defecto). Se autoliquida en el Concello antes de matricular.
                </p>
                <table className="w-full">
                  <thead><tr><th className={th}>Potencia fiscal</th><th className={th}>Cuota anual</th><th className={th}>Alta a mitad de año (2 trim.)</th></tr></thead>
                  <tbody>
                    {IVTM_CORUNA_TURISMOS.map((r) => {
                      const hl = Number(formData.cvf) >= r.minCvf && Number(formData.cvf) <= r.maxCvf;
                      return (
                        <tr key={r.label} className={hl ? rowHl : ''}>
                          <td className={`${td} text-white`}>{r.label}</td>
                          <td className={`${td} font-black text-amber-400`}>{formatEuroDetailed(r.annual)}</td>
                          <td className={`${td} text-slate-300`}>{formatEuroDetailed(r.annual / 2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block pt-1">Bonificaciones (verificar en ordenanza vigente)</span>
                <table className="w-full">
                  <tbody>
                    {IVTM_CORUNA_BONIFICACIONES.map((b) => (
                      <tr key={b.label}>
                        <td className={`${td} text-white`}>{b.label}</td>
                        <td className={`${td} font-bold text-emerald-400`}>-{b.pct} %</td>
                        <td className={`${td} text-slate-400`}>{b.years}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-500 flex items-start gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0" />Si el comprador final vive en otro concello (Oleiros, Culleredo, Arteixo, Cambre…) la cuota anual siguiente la pagará en su municipio, normalmente más barata que en A Coruña.</p>
              </div>
            )}

            {/* ---------------- TASAS ---------------- */}
            {tab === 'fees' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Todas las tasas y gastos administrativos del proceso de matriculación en A Coruña. Pulsa <strong className="text-slate-200">«Aplicar»</strong> para llevar el importe al simulador.
                </p>
                <table className="w-full">
                  <thead><tr><th className={th}>Org.</th><th className={th}>Concepto</th><th className={th}>Importe</th><th className={th}>Nota</th><th className={th}></th></tr></thead>
                  <tbody>
                    {REGISTRATION_FEES.map((f) => {
                      const target = { 'Tasa 1.1': 'dgtFee', 'ITV Import.': 'itvCost', 'Ficha Reducida': 'cocOrFichaCost', 'COC fabricante': 'cocOrFichaCost', 'Placas': 'platesCost' }[f.code];
                      return (
                        <tr key={f.code + f.label}>
                          <td className={`${td} text-slate-400 font-semibold whitespace-nowrap`}>{f.group}</td>
                          <td className={`${td} text-white`}>
                            <span className="font-bold">{f.code}</span> <span className="text-slate-300">· {f.label}</span>
                            {f.mandatory && <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">OBLIG.</span>}
                          </td>
                          <td className={`${td} font-black whitespace-nowrap ${f.amount === null ? 'text-slate-400' : f.amount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {f.amount === null ? 'Variable' : formatEuroDetailed(f.amount)}
                          </td>
                          <td className={`${td} text-slate-400 text-[10px]`}>{f.note}</td>
                          <td className={`${td}`}>
                            {target && f.amount !== null && (
                              <button type="button" onClick={() => onApply?.({ [target]: f.amount })} className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 whitespace-nowrap">
                                Aplicar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block pt-2">IRPF · base del ahorro (ganancia patrimonial del particular)</span>
                <div className="flex flex-wrap gap-2">
                  {IRPF_SAVINGS_BRACKETS.map((b) => (
                    <span key={b.label} className="text-[10px] px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300"><strong className="text-white">{b.rate} %</strong> {b.label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- CVF ---------------- */}
            {tab === 'cvf' && (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  La potencia fiscal (CVF) determina el tramo del IVTM. Fórmula oficial (Anexo V RD 2822/1998, motor 4 tiempos): <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded">CVF = 0,08 × (cc ÷ nº cilindros)^0,6 × nº cilindros</code>. La cilindrada está en el campo P.1 del Teil I alemán.
                </p>
                <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end text-[11px]">
                  <label className="block">
                    <span className="text-slate-400 block mb-1">Cilindrada (cm³)</span>
                    <input type="number" value={cvfCalc.cc} onChange={(e) => setCvfCalc({ ...cvfCalc, cc: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 block mb-1">Nº cilindros</span>
                    <select value={cvfCalc.cyl} onChange={(e) => setCvfCalc({ ...cvfCalc, cyl: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
                      {[2, 3, 4, 5, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-amber-500/30">
                    <span className="text-slate-400 block">Resultado</span>
                    <span className="text-lg font-black text-amber-400">{cvfResult.toFixed(2)} CVF</span>
                  </div>
                  <button type="button" onClick={() => onApply?.({ cvf: Number(cvfResult.toFixed(2)) })} className="py-2.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5">
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Aplicar al simulador
                  </button>
                </div>
                <table className="w-full">
                  <thead><tr><th className={th}>Motor habitual</th><th className={th}>cc</th><th className={th}>Cil.</th><th className={th}>CVF</th><th className={th}>Tramo IVTM Coruña</th></tr></thead>
                  <tbody>
                    {CVF_EXAMPLES.map((ex) => {
                      const e = { ...ex, cvf: computeCvf(ex.cc, ex.cyl) };
                      const tramo = IVTM_CORUNA_TURISMOS.find((r) => e.cvf >= r.minCvf && e.cvf <= r.maxCvf);
                      return (
                        <tr key={e.engine} className="hover:bg-slate-800/40 cursor-pointer" onClick={() => setCvfCalc({ cc: e.cc, cyl: e.cyl })}>
                          <td className={`${td} text-white`}>{e.engine}</td>
                          <td className={`${td} text-slate-300`}>{e.cc}</td>
                          <td className={`${td} text-slate-300`}>{e.cyl}</td>
                          <td className={`${td} font-black text-amber-400`}>{e.cvf.toFixed(2)}</td>
                          <td className={`${td} text-slate-400`}>{tramo?.label} · {formatEuroDetailed(tramo?.annual || 0)}/año</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

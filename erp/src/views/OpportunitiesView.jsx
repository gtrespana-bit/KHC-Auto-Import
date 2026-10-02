import React, { useMemo, useState } from 'react';
import { TrendingUp, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, SectionTitle, Badge } from '../components/ui.jsx';
import { EMPRESA_RANKING, EMPRESA_META } from '../data/catalog/empresaRanking.js';

const eur = (x) => `${Math.round(x).toLocaleString('es-ES')} €`;
const pct = (x) => `${Math.round(x * 100)} %`;
const TONE = { '🟢': 'emerald', '🟡': 'amber', '🟠': 'sky', '🔴': 'rose', '⚪': 'slate' };
const trust = (r) => (r.nES >= 30 ? ['Alta', 'emerald'] : r.nES >= 15 ? ['Media', 'amber'] : ['Baja: pocos anuncios ES', 'rose']);

export default function OpportunitiesView() {
  const [q, setQ] = useState('');
  const [minProfit, setMinProfit] = useState(1500);
  const [maxBuy, setMaxBuy] = useState(60000);
  const [sort, setSort] = useState('pEmp');
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => EMPRESA_RANKING
    .filter((r) => `${r.brand} ${r.model} ${r.gen} ${r.fuel}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => r.pEmp >= minProfit && r.buyEmp <= maxBuy)
    .sort((a, b) => b[sort] - a[sort]), [q, minProfit, maxBuy, sort]);

  return (
    <div className="space-y-4">
      <SectionTitle icon={TrendingUp} title="Oportunidades (criterio empresa)"
        subtitle={`${EMPRESA_META.nDE.toLocaleString('es-ES')} anuncios alemanes (autoscout24 + mobile.de) y ${EMPRESA_META.nES.toLocaleString('es-ES')} españoles · ${EMPRESA_META.at}`} />
      <Card className="p-4 text-sm text-slate-300 space-y-1">
        <p><b>Compra:</b> el 10 % más barato de Alemania para ese año y km (versiones económicas, aunque tengan algún detalle; sin siniestros) con un <b>{Math.round(EMPRESA_META.neg * 100)} % negociado</b> por volumen o proveedor habitual.</p>
        <p><b>Venta:</b> precio <b>mediano</b> en España, menos un 3 % de regateo. Nunca el más barato.</p>
        <p><b>Beneficio neto</b> después de logística (1 rodando + 2 en camión), imprevistos, ITV, impuesto de matriculación, DGT, gestoría, preparación, garantía, anuncios e IVA del margen (REBU).</p>
      </Card>

      <Card className="p-4 flex flex-wrap gap-4 items-end text-sm">
        <label className="flex flex-col gap-1">Buscar<input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Macan, CLA, diésel…" /></label>
        <label className="flex flex-col gap-1">Beneficio mínimo: {eur(minProfit)}<input type="range" min={-3000} max={6000} step={250} value={minProfit} onChange={(e) => setMinProfit(+e.target.value)} /></label>
        <label className="flex flex-col gap-1">Compra máxima: {eur(maxBuy)}<input type="range" min={8000} max={60000} step={1000} value={maxBuy} onChange={(e) => setMaxBuy(+e.target.value)} /></label>
        <label className="flex flex-col gap-1">Ordenar por
          <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="pEmp">Beneficio por coche</option>
            <option value="roiEmp">Rentabilidad sobre lo invertido</option>
          </select>
        </label>
        <span className="text-slate-400">{rows.length} de {EMPRESA_RANKING.length} modelos</span>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-xs uppercase">
            <tr className="border-b border-slate-800">
              <th className="p-2" /><th className="p-2 text-left">Modelo</th><th className="p-2">Año · km</th><th className="p-2 text-right">Compra DE</th>
              <th className="p-2 text-right">Venta ES (mediana)</th><th className="p-2 text-right">Gastos + IVA</th><th className="p-2 text-right">Beneficio</th>
              <th className="p-2 text-right">Rentab.</th><th className="p-2">Fiabilidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = r.name; const [tl, tt] = trust(r); const isOpen = open === id;
              const vat = r.cost.find((c) => c[0].startsWith('IVA'))?.[1] || 0;
              return (
                <React.Fragment key={id}>
                  <tr className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer" onClick={() => setOpen(isOpen ? null : id)}>
                    <td className="p-2 text-slate-500">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                    <td className="p-2"><div className="font-semibold text-slate-100">{r.brand} {r.model} <span className="text-slate-400 font-normal">({r.gen})</span></div><div className="text-xs text-slate-400">{r.fuel} · {r.cv} CV · <Badge tone={TONE[r.verdict.slice(0, 2)] || 'slate'}>{r.verdict}</Badge></div></td>
                    <td className="p-2 text-center tabular-nums">{r.Y} · {Math.round(r.K / 1000)}k</td>
                    <td className="p-2 text-right tabular-nums">{eur(r.buyEmp)}</td>
                    <td className="p-2 text-right tabular-nums">{eur(r.e50)}</td>
                    <td className="p-2 text-right tabular-nums text-slate-400">{eur(r.expenses + vat)}</td>
                    <td className={`p-2 text-right tabular-nums font-bold ${r.pEmp >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{eur(r.pEmp)}</td>
                    <td className="p-2 text-right tabular-nums">{pct(r.roiEmp)}</td>
                    <td className="p-2 text-center"><Badge tone={tt}>{tl}</Badge><div className="text-[11px] text-slate-500">{r.nDE} DE / {r.nES} ES</div></td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-950/50"><td colSpan={9} className="p-4">
                      <div className="grid md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="font-semibold text-slate-200 mb-1">Cuenta de un coche</div>
                          <div className="flex justify-between"><span>Compra en Alemania</span><span className="tabular-nums">{eur(r.buyEmp)}</span></div>
                          {r.cost.map(([l, a]) => <div key={l} className="flex justify-between text-slate-400"><span>{l}</span><span className="tabular-nums">{eur(a)}</span></div>)}
                          <div className="flex justify-between"><span>Venta en España (mediana −3 %)</span><span className="tabular-nums">{eur(r.sellNet)}</span></div>
                          <div className="flex justify-between font-bold border-t border-slate-800 mt-1 pt-1"><span>Beneficio neto</span><span className="tabular-nums">{eur(r.pEmp)}</span></div>
                          <div className="text-slate-500 mt-2">Otros escenarios: comprando en el 25 % barato {eur(r.pReal)} · mediana contra mediana {eur(r.pMed)}</div>
                        </div>
                        {[['Anuncios alemanes baratos (lo que se compraría)', r.adsDE], ['Anuncios españoles en la mediana (a lo que se vende)', r.adsES]].map(([t, ads]) => (
                          <div key={t}>
                            <div className="font-semibold text-slate-200 mb-1">{t}</div>
                            {ads.map((a) => (
                              <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="flex justify-between gap-2 hover:text-amber-300 text-slate-300">
                                <span>{a.y} · {Math.round(a.km / 1000)}k km · {a.src}</span><span className="tabular-nums flex items-center gap-1">{eur(a.p)}<ExternalLink className="w-3 h-3" /></span>
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

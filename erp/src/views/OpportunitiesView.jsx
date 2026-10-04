import React, { useMemo, useState } from 'react';
import { TrendingUp, ExternalLink, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { Card, SectionTitle, Badge } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { VEHICLE_DB } from '../data/vehicleDatabase.js';
import { buildPerformanceOpportunityRows, performancePriceSourceLabel } from '../domain/performanceOpportunities.js';
import { profitLevel } from '../domain/catalogEstimate.js';
import { EMPRESA_RANKING, EMPRESA_META } from '../data/catalog/empresaRanking.js';

const eur = (x) => `${Math.round(x).toLocaleString('es-ES')} €`;
const pct = (x) => `${Math.round(x * 100)} %`;
const TONE = { '🟢': 'emerald', '🟡': 'amber', '🟠': 'sky', '🔴': 'rose', '⚪': 'slate' };
const PROFIT_TEXT_COLOR = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-300',
  rose: 'text-rose-400',
  slate: 'text-slate-300',
};
const profitTextColor = (profit) => PROFIT_TEXT_COLOR[profitLevel(profit).tone] || PROFIT_TEXT_COLOR.slate;
const trust = (r) => (r.nES >= 30 ? ['Alta', 'emerald'] : r.nES >= 15 ? ['Media', 'amber'] : ['Baja: pocos anuncios ES', 'rose']);

export default function OpportunitiesView() {
  const { tariffs } = useStore();
  const [q, setQ] = useState('');
  const [minProfit, setMinProfit] = useState(1500);
  const [maxBuy, setMaxBuy] = useState(60000);
  const [sort, setSort] = useState('pEmp');
  const [open, setOpen] = useState(null);
  const [openHotHatch, setOpenHotHatch] = useState(null);

  const rows = useMemo(() => EMPRESA_RANKING
    .filter((r) => `${r.brand} ${r.model} ${r.gen} ${r.fuel}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => r.pEmp >= minProfit && r.buyEmp <= maxBuy)
    .sort((a, b) => b[sort] - a[sort]), [q, minProfit, maxBuy, sort]);
  const hotHatchRows = useMemo(() => buildPerformanceOpportunityRows(VEHICLE_DB, tariffs), [tariffs]);
  const filteredHotHatches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return hotHatchRows;
    return hotHatchRows.filter(({ profile, vehicle }) =>
      `${vehicle.brand} ${vehicle.model} ${vehicle.version} ${vehicle.engine} ${profile.gen}`.toLowerCase().includes(term));
  }, [hotHatchRows, q]);

  return (
    <div className="space-y-4">
      <SectionTitle icon={TrendingUp} title="Oportunidades (criterio empresa)"
        subtitle={`${EMPRESA_META.nDE.toLocaleString('es-ES')} anuncios alemanes (autoscout24 + mobile.de) y ${EMPRESA_META.nES.toLocaleString('es-ES')} españoles · ${EMPRESA_META.at}`} />
      <Card className="p-4 text-sm text-slate-300 space-y-1">
        <p><b>Compra:</b> el 10 % más barato de Alemania para ese año y km (versiones económicas, aunque tengan algún detalle; sin siniestros) con un <b>{Math.round(EMPRESA_META.neg * 100)} % negociado</b> por volumen o proveedor habitual.</p>
        <p><b>Venta:</b> precio <b>mediano</b> en España, menos un 3 % de regateo. Nunca el más barato.</p>
        <p><b>Beneficio neto</b> después de logística (1 rodando + 2 en camión), imprevistos, ITV, impuesto de matriculación, DGT, gestoría, preparación, garantía, anuncios e IVA del margen (REBU).</p>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Zap className="w-4 h-4 text-amber-400" />Hot hatches deportivos investigados</h3>
              <p className="text-xs text-slate-400 mt-1">{filteredHotHatches.length} de {hotHatchRows.length} variantes con precios DE/ES y margen estimado.</p>
            </div>
            <Badge tone="sky">{hotHatchRows.length} variantes</Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Se incluyen también los modelos con margen negativo o muestra corta. Este margen central/prudente sigue el cálculo REBU del Catálogo,
            {' '}no el criterio empresa de la tabla inferior: compra DE con el descuento supuesto del 8 % y venta ES con la rebaja configurada.
            {' '}Cada cifra se colorea por separado según su propio margen (verde ≥2.000 €, ámbar 800–1.999 €, rojo &lt;800 €); el prudente es una prueba de estrés: compra DE en techo y venta ES en suelo.
            {' '}La búsqueda de oportunidades también se aplica aquí; los filtros de beneficio y compra de la tabla general no ocultan estos estudios.
          </p>
        </div>
        {filteredHotHatches.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead className="text-slate-400 text-[10px] uppercase">
                <tr className="border-b border-slate-800">
                  <th className="p-2 w-8" />
                  <th className="p-2 text-left">Modelo / versión</th>
                  <th className="p-2 text-left">Años / generación</th>
                  <th className="p-2 text-right">Compra Alemania</th>
                  <th className="p-2 text-right">Venta España</th>
                  <th className="p-2 text-right">Margen REBU central / prudente</th>
                  <th className="p-2 text-center">Muestra DE / ES</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotHatches.map((row) => {
                  const { profile, vehicle, mean, prudent, status } = row;
                  const isOpen = openHotHatch === profile.variantKey;
                  return (
                    <React.Fragment key={profile.variantKey}>
                      <tr
                        className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer"
                        onClick={() => setOpenHotHatch(isOpen ? null : profile.variantKey)}
                      >
                        <td className="p-2 text-slate-500">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                        <td className="p-2">
                          <p className="font-semibold text-slate-100">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-[11px] text-slate-400">{profile.variantLabel} · {vehicle.cv} CV</p>
                        </td>
                        <td className="p-2 text-xs text-slate-300">
                          <p>{profile.years.join('–')}</p>
                          <p className="text-[10px] text-slate-500">{profile.gen}</p>
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          <p>{eur(vehicle.dePrice[0])} – {eur(vehicle.dePrice[1])}</p>
                          <p className="text-[10px] text-slate-500">{performancePriceSourceLabel(vehicle.priceSource?.de)}</p>
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          <p>{eur(vehicle.esPrice[0])} – {eur(vehicle.esPrice[1])}</p>
                          <p className="text-[10px] text-slate-500">{performancePriceSourceLabel(vehicle.priceSource?.es)}</p>
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          <p className={`font-bold ${profitTextColor(mean?.profit)}`}>central {mean ? eur(mean.profit) : '—'}</p>
                          <p className={`text-[10px] ${profitTextColor(prudent?.profit)}`}>prudente {prudent ? eur(prudent.profit) : '—'}</p>
                        </td>
                        <td className="p-2 text-center">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <p className="text-[10px] text-slate-500 mt-1">{row.deEvidenceCount} DE / {row.esEvidenceCount} ES</p>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-950/50">
                          <td colSpan={7} className="p-4">
                            <p className="text-xs text-slate-400 mb-3">{status.note} Los precios enlazados son precios pedidos del anuncio; las horquillas de la tabla se normalizan al año/km de referencia y el cálculo aplica las hipótesis del Catálogo.</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              {[
                                ['DE', 'Anuncios alemanes usados para compra'],
                                ['ES', 'Anuncios españoles usados para venta'],
                              ].map(([market, title]) => {
                                const ads = row.eligibleObservations.filter((ad) => ad.market === market);
                                return (
                                  <div key={market}>
                                    <p className="font-semibold text-slate-200 text-xs mb-2">{title} ({ads.length})</p>
                                    {ads.length ? (
                                      <div className="space-y-1">
                                        {ads.map((ad, index) => (
                                          <a
                                            key={ad.listingId || ad.url || `${market}-${index}`}
                                            href={ad.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between gap-3 text-[11px] text-slate-300 hover:text-amber-300"
                                          >
                                            <span className="min-w-0 truncate">{ad.year} · {Math.round(ad.km / 1000)}k km · {ad.source}</span>
                                            <span className="shrink-0 tabular-nums flex items-center gap-1">{eur(ad.price)}<ExternalLink className="w-3 h-3" /></span>
                                          </a>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-slate-500">Sin anuncios elegibles directos; el precio indicado es orientativo.</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {row.excludedEvidenceCount > 0 && (
                              <p className="text-[10px] text-slate-500 mt-3">{row.excludedEvidenceCount} anuncio(s) excluido(s) por particularidad, modificaciones, acabado o calidad; no entran en precios ni márgenes.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-sm text-slate-400">No hay estudios deportivos que coincidan con la búsqueda.</p>
        )}
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

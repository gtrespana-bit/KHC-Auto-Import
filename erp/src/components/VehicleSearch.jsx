import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, XCircle, CheckCircle2, AlertTriangle, Info, Zap, Fuel, Gauge, Leaf } from 'lucide-react';
import { searchVehicles, vehicleLabel, VEHICLE_DB } from '../data/vehicleDatabase';

const RELIABILITY_STYLE = {
  gold: { Icon: CheckCircle2, cls: 'text-emerald-400', chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'MOTOR ROCA' },
  ok: { Icon: Info, cls: 'text-sky-400', chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30', label: 'CORRECTO' },
  warn: { Icon: AlertTriangle, cls: 'text-amber-400', chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'PRECAUCIÓN' },
  banned: { Icon: XCircle, cls: 'text-rose-400', chip: 'bg-rose-500/15 text-rose-300 border-rose-500/30', label: 'PROHIBIDO' },
};

const BADGE_STYLE = {
  ECO: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  C: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
  B: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
};

/**
 * Buscador con autocompletado sobre la base de datos de vehículos.
 * Al seleccionar, dispara onSelect(vehicle) para rellenar el formulario.
 */
export default function VehicleSearch({ onSelect, selectedId, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => searchVehicles(query, 14), [query]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => { setHighlight(0); }, [query]);

  const choose = (v) => {
    onSelect(v);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[highlight]) choose(results[highlight]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const bannedCount = VEHICLE_DB.filter(v => v.reliability === 'banned').length;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || 'Busca marca, modelo o motor… ej: "tucson crdi", "golf tdi", "puretech", "b47"'}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border-2 border-amber-500/40 focus:border-amber-400 text-white text-sm font-semibold placeholder:text-slate-500 placeholder:font-normal focus:outline-none shadow-inner"
          autoComplete="off"
          spellCheck="false"
          role="combobox"
          aria-expanded={open}
          aria-controls="vehicle-search-listbox"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            aria-label="Limpiar búsqueda"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-slate-500">
          {VEHICLE_DB.length} motorizaciones en base de datos · {bannedCount} marcadas como prohibidas · ↑↓ y Enter para seleccionar
        </span>
        {selectedId && (
          <span className="text-[10px] text-emerald-400 font-semibold">✓ Datos técnicos autocompletados</span>
        )}
      </div>

      {open && (
        <ul
          id="vehicle-search-listbox"
          role="listbox"
          className="absolute z-40 mt-1 w-full max-h-[420px] overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 divide-y divide-slate-800"
        >
          {results.length === 0 && (
            <li className="px-4 py-4 text-xs text-slate-400">
              Sin resultados para «{query}». Puedes escribir los datos a mano en el formulario; el detector de motores seguirá vigilando el texto.
            </li>
          )}
          {results.map((v, idx) => {
            const rs = RELIABILITY_STYLE[v.reliability] || RELIABILITY_STYLE.ok;
            const Icon = rs.Icon;
            const active = idx === highlight;
            return (
              <li
                key={v.id}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => { e.preventDefault(); choose(v); }}
                className={`px-3.5 py-2.5 cursor-pointer flex items-start gap-3 transition-colors ${
                  active ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                } ${v.reliability === 'banned' ? 'bg-rose-950/20' : ''}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${rs.cls}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${v.reliability === 'banned' ? 'text-rose-200 line-through decoration-rose-500/70' : 'text-white'}`}>
                      {v.brand} {v.model}
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">{v.version}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-slate-400">
                    <span className={`px-1.5 py-0.5 rounded border font-black tracking-wide ${rs.chip}`}>{rs.label}</span>
                    <span className={`px-1.5 py-0.5 rounded border font-bold ${BADGE_STYLE[v.badge] || BADGE_STYLE.C}`}>
                      <Leaf className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />{v.badge}
                    </span>
                    <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" />{v.engine}</span>
                    <span className="inline-flex items-center gap-1"><Fuel className="w-3 h-3" />{v.fuel}</span>
                    <span className="inline-flex items-center gap-1"><Gauge className="w-3 h-3" />{v.co2} g/km · {v.cvf} CVF</span>
                    <span>{v.years[0]}–{v.years[1]}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

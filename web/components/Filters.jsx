'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

const priceOptions = [12000, 15000, 18000, 20000, 25000, 30000, 40000];
const kmOptions = [80000, 100000, 120000, 150000, 200000];

export default function Filters({ brands = [], fuels = [], total = 0, shown = 0 }) {
  const router = useRouter();
  const params = useSearchParams();

  const get = (key) => params.get(key) || '';

  const update = (patch) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    const qs = next.toString();
    router.push(qs ? `/coches?${qs}` : '/coches', { scroll: false });
  };

  const hasFilters = ['q', 'marca', 'combustible', 'cambio', 'precio_max', 'km_max', 'orden'].some((k) => params.get(k));

  const selectClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="relative lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            defaultValue={get('q')}
            placeholder="Buscar (Golf, 320d, Q3…)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') update({ q: e.currentTarget.value });
            }}
            onBlur={(e) => {
              if (e.currentTarget.value !== get('q')) update({ q: e.currentTarget.value });
            }}
            className={`${selectClass} pl-9`}
          />
        </label>

        <select className={selectClass} value={get('marca')} onChange={(e) => update({ marca: e.target.value })}>
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select className={selectClass} value={get('combustible')} onChange={(e) => update({ combustible: e.target.value })}>
          <option value="">Todos los combustibles</option>
          {fuels.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select className={selectClass} value={get('precio_max')} onChange={(e) => update({ precio_max: e.target.value })}>
          <option value="">Cualquier precio</option>
          {priceOptions.map((p) => (
            <option key={p} value={p}>
              Hasta {new Intl.NumberFormat('es-ES').format(p)} €
            </option>
          ))}
        </select>

        <select className={selectClass} value={get('km_max')} onChange={(e) => update({ km_max: e.target.value })}>
          <option value="">Cualquier kilometraje</option>
          {kmOptions.map((k) => (
            <option key={k} value={k}>
              Hasta {new Intl.NumberFormat('es-ES').format(k)} km
            </option>
          ))}
        </select>

        <select className={selectClass} value={get('cambio')} onChange={(e) => update({ cambio: e.target.value })}>
          <option value="">Cualquier cambio</option>
          <option value="Automático">Automático</option>
          <option value="Manual">Manual</option>
        </select>

        <select className={selectClass} value={get('orden') || 'recientes'} onChange={(e) => update({ orden: e.target.value })}>
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Precio: de menor a mayor</option>
          <option value="precio_desc">Precio: de mayor a menor</option>
          <option value="km_asc">Menos kilómetros</option>
          <option value="ano_desc">Más nuevos</option>
        </select>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {shown} de {total} coches
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => router.push('/coches', { scroll: false })}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

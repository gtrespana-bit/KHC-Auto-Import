'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

const priceOptions = [12000, 15000, 18000, 20000, 25000, 30000, 40000];
const kmOptions = [80000, 100000, 120000, 150000, 200000];

const FIELD = 'field pr-8';

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

  const hasFilters = ['q', 'marca', 'combustible', 'cambio', 'procedencia', 'precio_max', 'km_max', 'orden'].some(
    (k) => params.get(k),
  );

  return (
    <div className="rounded-xl border border-ink-900/10 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-600">Buscar en el stock</p>
        <p className="text-xs text-ink-400">
          {shown} de {total} {total === 1 ? 'vehículo' : 'vehículos'}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.8} />
          <input
            defaultValue={get('q')}
            placeholder="Buscar (Golf, 320d, Q3…)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') update({ q: e.currentTarget.value });
            }}
            onBlur={(e) => {
              if (e.currentTarget.value !== get('q')) update({ q: e.currentTarget.value });
            }}
            className="field pl-9"
          />
        </label>

        <select className={FIELD} value={get('marca')} onChange={(e) => update({ marca: e.target.value })}>
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          className={FIELD}
          value={get('procedencia')}
          onChange={(e) => update({ procedencia: e.target.value })}
        >
          <option value="">Nacional e importado</option>
          <option value="importado">Solo importados</option>
          <option value="nacional">Solo nacionales</option>
        </select>

        <select className={FIELD} value={get('combustible')} onChange={(e) => update({ combustible: e.target.value })}>
          <option value="">Todos los combustibles</option>
          {fuels.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select className={FIELD} value={get('cambio')} onChange={(e) => update({ cambio: e.target.value })}>
          <option value="">Cualquier cambio</option>
          <option value="Automático">Automático</option>
          <option value="Manual">Manual</option>
        </select>

        <select className={FIELD} value={get('precio_max')} onChange={(e) => update({ precio_max: e.target.value })}>
          <option value="">Cualquier precio</option>
          {priceOptions.map((p) => (
            <option key={p} value={p}>
              Hasta {new Intl.NumberFormat('es-ES').format(p)} €
            </option>
          ))}
        </select>

        <select className={FIELD} value={get('km_max')} onChange={(e) => update({ km_max: e.target.value })}>
          <option value="">Cualquier kilometraje</option>
          {kmOptions.map((k) => (
            <option key={k} value={k}>
              Hasta {new Intl.NumberFormat('es-ES').format(k)} km
            </option>
          ))}
        </select>

        <select className={FIELD} value={get('orden') || 'recientes'} onChange={(e) => update({ orden: e.target.value })}>
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Precio: de menor a mayor</option>
          <option value="precio_desc">Precio: de mayor a menor</option>
          <option value="km_asc">Menos kilómetros</option>
          <option value="ano_desc">Más nuevos</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push('/coches', { scroll: false })}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-900/15 px-3 py-2.5 text-xs font-semibold text-ink-600 transition hover:bg-ivory"
          >
            <X className="h-3.5 w-3.5" /> Quitar filtros
          </button>
        )}
      </div>
    </div>
  );
}

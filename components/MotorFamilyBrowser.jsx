'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  BookOpenCheck,
  ArrowRight,
  ChevronDown,
  Filter,
  Fuel,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

const VERDICT_ORDER = ['gold', 'ok', 'warn', 'banned', 'none'];
const VERDICT_ICONS = {
  gold: BadgeCheck,
  ok: BadgeCheck,
  warn: ShieldAlert,
  banned: ShieldAlert,
  none: BookOpenCheck,
};
const FUEL_FILTERS = [
  { id: 'all', label: 'Todos los combustibles' },
  { id: 'diesel', label: 'Diésel' },
  { id: 'gasolina', label: 'Gasolina' },
  { id: 'hybrid', label: 'Híbridos' },
  { id: 'electric', label: 'Eléctricos' },
  { id: 'alternative', label: 'GLP / GNC' },
  { id: 'gearbox', label: 'Cambios automáticos' },
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesFuel(group, filter) {
  if (filter === 'all') return true;
  const labels = normalize(group.fuels.join(' '));
  if (filter === 'diesel') return labels.includes('diesel');
  if (filter === 'gasolina') return labels.includes('gasolina');
  if (filter === 'hybrid') return /hibrid|mhev|hev|phev|e-power/.test(labels);
  if (filter === 'electric') return /electrico|electric/.test(labels);
  if (filter === 'alternative') return /glp|gnc|gas licuado|gas natural/.test(labels);
  if (filter === 'gearbox') return /automatico|cvt|doble embrague/.test(normalize(group.gears.join(' ')));
  return true;
}

export default function MotorFamilyBrowser({ families, stats, tones }) {
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('all');
  const [fuel, setFuel] = useState('all');
  const [verdict, setVerdict] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const brands = useMemo(
    () => [...new Set(families.flatMap((family) => family.brands))].sort((a, b) => a.localeCompare(b, 'es')),
    [families],
  );
  const filteredFamilies = useMemo(() => {
    const query = normalize(search);
    return families.filter((family) => {
      const matchesQuery = !query || normalize(family.searchText).includes(query);
      const matchesBrand = brand === 'all' || family.brands.includes(brand);
      const matchesVerdict = verdict === 'all' || family.verdict === verdict;
      return matchesQuery && matchesBrand && matchesVerdict && matchesFuel(family, fuel);
    });
  }, [families, search, brand, fuel, verdict]);

  const visibleFamilies = showAll ? filteredFamilies : filteredFamilies.slice(0, 36);
  const hasFilters = search || brand !== 'all' || fuel !== 'all' || verdict !== 'all';

  const resetFilters = () => {
    setSearch('');
    setBrand('all');
    setFuel('all');
    setVerdict('all');
    setShowAll(false);
  };

  return (
    <section id="atlas-motores" className="scroll-mt-24 bg-ivory py-16 md:py-24">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-warm-600">
            <SlidersHorizontal size={13} aria-hidden="true" /> Atlas de motores
          </span>
          <h2 className="mt-5 font-serif text-4xl font-medium tracking-tight text-ink-900 md:text-5xl">
            Encuentra una familia y sus aplicaciones
          </h2>
          <p className="mt-5 text-base leading-7 text-warm-600 md:text-lg">
            Busca por motor, marca, modelo, generación o año. Un grupo sin veredicto está pendiente de investigación: no significa que sea problemático.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Grupos del catálogo', stats.groups],
            ['Familias con veredicto', stats.withVerdict],
            ['Modelos registrados', stats.models],
            ['Generaciones registradas', stats.generations],
            ['Asociaciones familia–modelo/generación', stats.applications],
          ].map(([label, value]) => (
            <div key={label} className="border border-ink-900/10 bg-white px-5 py-4">
              <p className="text-2xl font-semibold text-ink-900">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[.14em] text-warm-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-ink-900/10 bg-white p-4 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.5fr)_repeat(2,minmax(180px,1fr))]">
            <label className="relative block">
              <span className="sr-only">Buscar motor, marca, modelo o generación</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-warm-400" size={18} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setShowAll(false); }}
                placeholder="Ej.: 1.5 BlueHDi, Toyota, Golf, 2019…"
                className="h-12 w-full border border-ink-900/15 bg-ivory pl-11 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-warm-400 focus:border-warm-600 focus:ring-2 focus:ring-warm-600/15"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Filtrar por marca</span>
              <select
                value={brand}
                onChange={(event) => { setBrand(event.target.value); setShowAll(false); }}
                className="h-12 w-full appearance-none border border-ink-900/15 bg-ivory px-4 pr-10 text-sm text-ink-900 outline-none focus:border-warm-600 focus:ring-2 focus:ring-warm-600/15"
              >
                <option value="all">Todas las marcas</option>
                {brands.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-warm-500" size={16} aria-hidden="true" />
            </label>

            <label className="relative block">
              <span className="sr-only">Filtrar por combustible o tipo de motor</span>
              <Fuel className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-warm-500" size={16} aria-hidden="true" />
              <select
                value={fuel}
                onChange={(event) => { setFuel(event.target.value); setShowAll(false); }}
                className="h-12 w-full appearance-none border border-ink-900/15 bg-ivory pl-10 pr-10 text-sm text-ink-900 outline-none focus:border-warm-600 focus:ring-2 focus:ring-warm-600/15"
              >
                {FUEL_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-warm-500" size={16} aria-hidden="true" />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-ink-900/10 pt-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2" aria-label="Filtrar por veredicto">
              <button
                type="button"
                onClick={() => { setVerdict('all'); setShowAll(false); }}
                aria-pressed={verdict === 'all'}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${verdict === 'all' ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-900/15 text-warm-600 hover:border-ink-900/40'}`}
              >
                Todos ({families.length})
              </button>
              {VERDICT_ORDER.map((item) => {
                const tone = tones[item] || tones.none;
                const Icon = VERDICT_ICONS[item];
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => { setVerdict(verdict === item ? 'all' : item); setShowAll(false); }}
                    aria-pressed={verdict === item}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${verdict === item ? tone.badge : 'border-ink-900/15 text-warm-600 hover:border-ink-900/40'}`}
                  >
                    <Icon size={13} aria-hidden="true" /> {tone.label} ({stats.countsByVerdict[item] || 0})
                  </button>
                );
              })}
            </div>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="inline-flex shrink-0 items-center gap-2 self-start text-xs font-semibold text-warm-600 underline underline-offset-4 hover:text-ink-900 xl:self-auto">
                <RotateCcw size={14} aria-hidden="true" /> Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-warm-600" aria-live="polite">
            <strong className="text-ink-900">{filteredFamilies.length}</strong> grupos encontrados
            {fuel !== 'all' ? ` · ${FUEL_FILTERS.find((item) => item.id === fuel)?.label}` : ''}
          </p>
          <p className="inline-flex items-center gap-2 text-xs text-warm-500">
            <Filter size={14} aria-hidden="true" /> La valoración es editorial, no una tasa estadística de averías.
          </p>
        </div>

        {filteredFamilies.length === 0 ? (
          <div className="mt-5 border border-dashed border-ink-900/20 bg-white px-6 py-12 text-center">
            <p className="font-serif text-2xl text-ink-900">No hay coincidencias</p>
            <p className="mt-2 text-sm text-warm-600">Prueba otra búsqueda o elimina alguno de los filtros.</p>
            <button type="button" onClick={resetFilters} className="mt-5 rounded-full bg-ink-900 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-warm-700">Ver todo el catálogo</button>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleFamilies.map((family) => {
              const tone = tones[family.verdict] || tones.none;
              const Icon = VERDICT_ICONS[family.verdict] || BookOpenCheck;
              const applications = family.applications.slice(0, 4);
              return (
                <article key={family.id} className="flex min-w-0 flex-col border border-ink-900/10 bg-white p-5 transition hover:border-ink-900/25 hover:shadow-sm md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] ${tone.badge}`}>
                      <Icon size={13} aria-hidden="true" /> {tone.label}
                    </span>
                    {family.family && <span className="shrink-0 font-mono text-[10px] text-warm-400">{family.family}</span>}
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-medium leading-tight text-ink-900">{family.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-warm-600">{family.variants.slice(0, 3).join(' · ')}</p>

                  <p className="mt-4 flex items-center gap-2 text-[11px] font-medium text-warm-500">
                    <Fuel size={14} aria-hidden="true" /> {family.fuels.length ? family.fuels.join(' · ') : 'Combustible no indicado'}
                  </p>
                  {family.gears.length > 0 && <p className="mt-1 text-[11px] leading-5 text-warm-500">Transmisiones catalogadas: {family.gears.join(' · ')}</p>}

                  <div className="mt-4 border-t border-ink-900/10 pt-4">
                    <div className="flex items-center justify-between gap-3 text-[11px] text-warm-500">
                      <span>{family.modelCount} modelos · {family.generationCount} generaciones</span>
                      <span>{family.yearStart}{family.yearEnd !== family.yearStart ? `–${family.yearEnd}` : ''}</span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {applications.map((application) => (
                        <li key={`${application.modelSlug}:${application.generation}`} className="text-xs leading-5">
                          <Link href={`/guia/modelos/${application.modelSlug}`} className="font-semibold text-ink-900 underline decoration-ink-900/20 underline-offset-2 hover:decoration-ink-900">
                            {application.brand} {application.model}
                          </Link>
                          <span className="text-warm-500"> · {application.generation}</span>
                        </li>
                      ))}
                    </ul>
                    {family.applicationCount > applications.length && (
                      <p className="mt-2 text-[11px] text-warm-500">y {family.applicationCount - applications.length} aplicaciones más</p>
                    )}
                  </div>

                  {family.reason && <p className="mt-4 border-l-2 border-warm-300 pl-3 text-xs leading-5 text-warm-600">{family.reason}</p>}
                  {family.verdict === 'none' && (
                    <p className="mt-4 text-xs leading-5 text-warm-600">{family.familyStatusLabel}. No se publica una recomendación hasta contar con respaldo suficiente.</p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
                    {family.detailSlug ? (
                      <Link href={`/motores/${family.detailSlug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-900 underline underline-offset-4 hover:text-warm-700">
                        Ficha técnica a fondo <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-warm-400">Sin ficha editorial ampliada</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {filteredFamilies.length > 36 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="rounded-full border border-ink-900/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
            >
              {showAll ? 'Mostrar menos' : `Mostrar los ${filteredFamilies.length} grupos`}
            </button>
          </div>
        )}

        <div className="mt-10 border-l-2 border-warm-400 bg-white px-5 py-4 text-sm leading-6 text-warm-600">
          <strong className="text-ink-900">Alcance:</strong> el atlas agrupa los modelos y generaciones incluidos en el catálogo KHC; no es un inventario exhaustivo de todos los motores vendidos. Las denominaciones pueden abarcar variantes distintas. Confirma código de motor, año, mercado y VIN antes de aplicar una conclusión a una unidad.
        </div>
      </div>
    </section>
  );
}

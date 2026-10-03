'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Fuel,
  BookOpenCheck,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function fuelCategory(fuel) {
  const value = normalize(fuel);
  if (value.includes('diesel')) return 'diesel';
  if (/hibrido|mhev|hev|phev|e-power/.test(value)) return 'hibrido';
  if (value.includes('gasolina')) return 'gasolina';
  if (/electrico|electric/.test(value)) return 'electrico';
  if (value.includes('cambio')) return 'cambio';
  return 'otro';
}

const FUEL_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'diesel', label: 'Diésel' },
  { id: 'gasolina', label: 'Gasolina' },
  { id: 'hibrido', label: 'Híbridos' },
  { id: 'electrico', label: 'Eléctricos' },
  { id: 'cambio', label: 'Cambios' },
];

const VERDICT_ICON = {
  gold: CheckCircle2,
  ok: ClipboardCheck,
  warn: ShieldAlert,
  banned: Ban,
  none: BookOpenCheck,
};

const cardAccent = {
  gold: 'bg-emerald-500',
  ok: 'bg-sky-500',
  warn: 'bg-amber-500',
  banned: 'bg-rose-500',
  none: 'bg-ink-300',
};

export default function MotorExplorer({ motors, groups, tones }) {
  const [query, setQuery] = useState('');
  const [fuel, setFuel] = useState('todos');
  const [verdict, setVerdict] = useState('todos');

  const filteredMotors = useMemo(() => {
    const needle = normalize(query);
    return motors.filter((motor) => {
      const text = normalize(
        [
          motor.name,
          motor.family,
          motor.maker,
          motor.fuel,
          motor.years,
          motor.subtitle,
          motor.excerpt,
          ...motor.models,
        ].join(' '),
      );
      return (
        (!needle || text.includes(needle)) &&
        (fuel === 'todos' || fuelCategory(motor.fuel) === fuel) &&
        (verdict === 'todos' || motor.verdict === verdict)
      );
    });
  }, [fuel, motors, query, verdict]);

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      cards: filteredMotors.filter((motor) => motor.verdict === group.verdict),
    }))
    .filter((group) => group.cards.length > 0);

  const hasFilters = query.trim() || fuel !== 'todos' || verdict !== 'todos';
  const resetFilters = () => {
    setQuery('');
    setFuel('todos');
    setVerdict('todos');
  };

  return (
    <section id="fichas-a-fondo" className="scroll-mt-28 pt-14 sm:pt-20">
      <div className="flex flex-col gap-5 border-b border-ink-900/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Investigaciones editoriales</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Fichas técnicas a fondo</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">
            Análisis ampliados de familias seleccionadas, separados del atlas general. Busca por código, familia, marca o modelo y filtra por combustible o criterio KHC.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-ink-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-gold-700">
            <Wrench className="h-4 w-4" />
          </span>
          <span><strong className="text-ink-900">{motors.length}</strong> fichas publicadas</span>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => {
          const tone = tones[group.verdict];
          const Icon = VERDICT_ICON[group.verdict] || BadgeCheck;
          const count = motors.filter((motor) => motor.verdict === group.verdict).length;
          const examples = motors
            .filter((motor) => motor.verdict === group.verdict)
            .slice(0, 3)
            .map((motor) => motor.name);
          const isSelected = verdict === group.verdict;

          return (
            <button
              key={group.verdict}
              type="button"
              onClick={() => setVerdict(isSelected ? 'todos' : group.verdict)}
              aria-pressed={isSelected}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${tone.border} ${tone.bg} ${isSelected ? 'ring-2 ring-gold-500 ring-offset-2' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.text}`}>
                    {tone.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold leading-none text-ink-900">{count}</p>
                </div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 ${tone.text}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 line-clamp-2 min-h-8 text-[11px] font-medium leading-relaxed text-ink-500">
                {examples.length ? examples.join(' · ') : 'No hay fichas en esta categoría'}
                {count > examples.length ? ` · +${count - examples.length} más` : ''}
              </p>
              <span className={`absolute inset-x-0 bottom-0 h-1 ${cardAccent[group.verdict]}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-ink-900/10 bg-white p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label htmlFor="motor-search" className="mb-2 block text-xs font-semibold text-ink-700">
              Buscar una mecánica
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                id="motor-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej.: EA288, PureTech, BMW, Qashqai…"
                className="field pl-10 pr-4"
              />
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-ink-400 lg:pb-3">
            <SlidersHorizontal className="h-4 w-4" />
            {filteredMotors.length} {filteredMotors.length === 1 ? 'ficha encontrada' : 'fichas encontradas'}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-ink-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Combustible o transmisión
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por combustible o transmisión">
              {FUEL_FILTERS.map((option) => {
                const selected = fuel === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFuel(option.id)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                      selected
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-900/10 bg-ivory text-ink-600 hover:border-gold-500/60 hover:text-ink-900'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-gold-700 underline-offset-4 hover:underline sm:self-end"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Quitar filtros
            </button>
          )}
        </div>
      </div>

      <div id="motor-results" className="scroll-mt-28 mt-10 space-y-12">
        {visibleGroups.map((group) => {
          const tone = tones[group.verdict];
          const Icon = VERDICT_ICON[group.verdict] || BadgeCheck;
          return (
            <section key={group.verdict} aria-labelledby={`motor-group-${group.verdict}`}>
              <div className="mb-5 flex items-start gap-3 border-b border-ink-900/10 pb-4">
                <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 id={`motor-group-${group.verdict}`} className="display text-xl sm:text-2xl">
                      {group.title}
                    </h3>
                    <span className="text-xs text-ink-400">{group.cards.length} {group.cards.length === 1 ? 'ficha' : 'fichas'}</span>
                  </div>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-500">{group.intro}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.cards.map((motor) => (
                  <Link
                    key={motor.slug}
                    href={`/guia/motores/${motor.slug}`}
                    className="group relative flex min-h-[270px] flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-gold-400/60 hover:shadow-[0_10px_35px_rgba(15,23,42,0.08)] sm:p-6"
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 ${cardAccent[motor.verdict]}`} aria-hidden="true" />
                    <div className="flex items-start justify-between gap-3 pl-1">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400">
                          {motor.maker}
                        </p>
                        {motor.family && (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gold-700">
                            Familia {motor.family}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${tone.text} ${tone.bg} ${tone.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                        {motor.verdictLabel || tone.label}
                      </span>
                    </div>

                    <div className="pl-1">
                      <h4 className="display mt-4 text-xl font-semibold leading-tight text-ink-900 transition group-hover:text-gold-700">
                        {motor.name}
                      </h4>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-ink-600">{motor.subtitle}</p>
                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-ink-500">{motor.excerpt}</p>
                    </div>

                    <div className="mt-auto pl-1 pt-5">
                      <div className="flex flex-wrap gap-2 border-t border-ink-900/10 pt-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-2.5 py-1 text-[10px] font-medium text-ink-600">
                          <Fuel className="h-3 w-3 text-gold-600" /> {motor.fuel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-2.5 py-1 text-[10px] font-medium text-ink-600">
                          <Clock3 className="h-3 w-3 text-gold-600" /> {motor.years}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="line-clamp-1 text-[10px] text-ink-400">
                          {motor.models[0]}{motor.models.length > 1 ? ` · +${motor.models.length - 1} aplicaciones` : ''}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gold-700">
                          Ficha <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {filteredMotors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink-900/20 bg-white px-6 py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-ink-300" />
            <h3 className="display mt-4 text-xl">No encontramos esa combinación</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              Prueba con el código del motor, la marca o elimina algún filtro para ver más fichas.
            </p>
            <button type="button" onClick={resetFilters} className="btn-outline mt-5">
              Ver todas las fichas <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Directorio público de motores: agrupa las aplicaciones del catálogo de
// modelos, sin inventar datos ni tratar un veredicto pendiente como avería.
// La familia proviene del catálogo KHC; la identificación definitiva de una
// unidad concreta requiere código de motor/VIN.
// ============================================================================

import { MODELOS } from './modelos.js';
import { MOTORS } from './motores.js';

const VERDICT_ORDER = ['gold', 'ok', 'warn', 'banned', 'none'];
const VERDICT_RANK = Object.fromEntries(VERDICT_ORDER.map((verdict, index) => [verdict, index]));

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const editorialByFamily = new Map(
  MOTORS.filter((motor) => motor.family).map((motor) => [motor.family, motor]),
);

function sorted(set) {
  return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));
}

const directory = new Map();

for (const model of MODELOS) {
  for (const generation of model.generations) {
    for (const engine of generation.engines) {
      const family = engine.family || null;
      const id = family ? `familia:${family}` : `sin-familia:${slugify(engine.name)}`;

      if (!directory.has(id)) {
        directory.set(id, {
          id,
          family,
          names: new Map(),
          brands: new Set(),
          fuels: new Set(),
          gears: new Set(),
          verdicts: new Set(),
          applications: new Map(),
          reasons: new Set(),
        });
      }

      const group = directory.get(id);
      const name = engine.name || 'Motor sin nombre en el catálogo';
      group.names.set(name, (group.names.get(name) || 0) + 1);
      group.brands.add(model.brand);
      if (engine.fuelLabel) group.fuels.add(engine.fuelLabel);
      if (engine.gearLabel) group.gears.add(engine.gearLabel);
      group.verdicts.add(VERDICT_RANK[engine.verdict] === undefined ? 'none' : engine.verdict);
      if (engine.motivo && !engine.motivo.startsWith('Exige pruebas específicas') && !engine.motivo.startsWith('Riesgo de avería grave documentado')) {
        group.reasons.add(engine.motivo);
      }

      const applicationId = `${model.slug}:${generation.name}`;
      if (!group.applications.has(applicationId)) {
        group.applications.set(applicationId, {
          modelSlug: model.slug,
          brand: model.brand,
          model: model.model,
          generation: generation.name,
          from: generation.from,
          to: generation.to,
          engines: new Set(),
        });
      }
      group.applications.get(applicationId).engines.add(name);
    }
  }
}

export const MOTOR_DIRECTORY = [...directory.values()]
  .map((group) => {
    const editorial = group.family ? editorialByFamily.get(group.family) : null;
    const variants = [...group.names.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
      .map(([name]) => name);
    const verdicts = [...group.verdicts];
    const verdict = verdicts.length === 1 ? verdicts[0] : 'none';
    const applications = [...group.applications.values()]
      .map((application) => ({ ...application, engines: sorted(application.engines) }))
      .sort((a, b) =>
        a.brand.localeCompare(b.brand, 'es') ||
        a.model.localeCompare(b.model, 'es') ||
        a.from - b.from,
      );
    const models = new Map(applications.map((application) => [
      application.modelSlug,
      { slug: application.modelSlug, brand: application.brand, model: application.model },
    ]));
    const familyStatus = !group.family
      ? 'unidentified'
      : verdict === 'none'
        ? 'pending'
        : 'rated';

    return {
      id: group.id,
      family: group.family,
      title: editorial?.name || variants[0] || group.family || 'Motor sin clasificar',
      variants,
      brands: sorted(group.brands),
      fuels: sorted(group.fuels),
      gears: sorted(group.gears),
      verdict,
      verdictConflict: verdicts.length > 1,
      familyStatus,
      familyStatusLabel: familyStatus === 'rated'
        ? 'Con veredicto en el registro KHC'
        : familyStatus === 'pending'
          ? 'Familia identificada · sin veredicto'
          : 'Sin familia identificada',
      reason: [...group.reasons][0] || null,
      detailSlug: editorial?.slug || null,
      detailName: editorial?.name || null,
      applicationCount: applications.length,
      modelCount: models.size,
      generationCount: applications.length,
      applications,
      models: [...models.values()].sort((a, b) =>
        a.brand.localeCompare(b.brand, 'es') || a.model.localeCompare(b.model, 'es'),
      ),
      yearStart: applications.length ? Math.min(...applications.map((application) => application.from)) : null,
      yearEnd: applications.length ? Math.max(...applications.map((application) => application.to)) : null,
      searchText: [
        group.family,
        editorial?.name,
        ...variants,
        ...group.brands,
        ...applications.flatMap((application) => [
          application.model,
          application.generation,
          application.from,
          application.to,
        ]),
      ].filter(Boolean).join(' '),
    };
  })
  .sort((a, b) =>
    (VERDICT_RANK[a.verdict] ?? VERDICT_RANK.none) - (VERDICT_RANK[b.verdict] ?? VERDICT_RANK.none) ||
    a.title.localeCompare(b.title, 'es'),
  );

const generations = MODELOS.reduce((total, model) => total + model.generations.length, 0);
const countsByVerdict = Object.fromEntries(
  VERDICT_ORDER.map((verdict) => [
    verdict,
    MOTOR_DIRECTORY.filter((group) => group.verdict === verdict).length,
  ]),
);

export const MOTOR_DIRECTORY_STATS = {
  groups: MOTOR_DIRECTORY.length,
  identifiedFamilies: MOTOR_DIRECTORY.filter((group) => group.family).length,
  unidentified: MOTOR_DIRECTORY.filter((group) => !group.family).length,
  pendingFamilies: MOTOR_DIRECTORY.filter((group) => group.family && group.verdict === 'none').length,
  withVerdict: MOTOR_DIRECTORY.filter((group) => group.verdict !== 'none').length,
  withoutVerdict: MOTOR_DIRECTORY.filter((group) => group.verdict === 'none').length,
  models: MODELOS.length,
  generations,
  applications: MOTOR_DIRECTORY.reduce((total, group) => total + group.applicationCount, 0),
  deepGuides: MOTORS.length,
  countsByVerdict,
};

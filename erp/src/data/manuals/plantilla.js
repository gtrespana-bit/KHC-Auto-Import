// ============================================================================
//  PLANTILLA DE MANUAL DE REPARACIÓN — KHC Auto Import
// ----------------------------------------------------------------------------
//  Copia este fichero para crear un manual nuevo (p. ej. `frenos-golf7.js`),
//  rellena cada campo siguiendo las anotaciones y expórtalo desde `index.js`.
//
//  REGLAS DE ORO
//  1. Cada cifra (litros, Nm, referencias, intervalos) lleva un `confidence`:
//       · 'oficial'    → procede de documentación del fabricante (erWin/ELSA,
//                        boletines, manual del propietario) y está contrastada.
//       · 'orientativo'→ valor estándar de la familia de motores o manual de
//                        taller conocido. Sirve para trabajar, pero conviene
//                        confirmarlo.
//       · 'verificar'  → hay duda o depende del mercado/año exacto. NO usar
//                        como referencia de apriete o llenado sin confirmar.
//  2. Todo lo que se apriete lleva su par en la tabla `torque`. Nunca inventar
//     un par: si no se conoce, dejar la entrada con `confidence: 'verificar'`.
//  3. IMÁGENES — política estricta (ver `steps[].image`):
//       · Solo fotos REALES del vehículo/motor concreto (scope: 'modelo') o, como
//         mucho, de su familia de motor claramente identificada (scope: 'familia').
//       · PROHIBIDO ilustraciones genéricas, renders de otros motores o fotos de
//         motorizaciones distintas (un filtro «arriba» en una foto y «abajo» en
//         otra desorienta más que ayudar).
//       · Cada foto declara `shows` (qué se ve de verdad), `source` (origen) y
//         `points` (pines {x, y, label} sobre el punto exacto, en % de la imagen).
//       · Si NO hay foto real verificada del punto, usar `kind: 'pendiente'` con
//         el `brief` del encuadre exacto a fotografiar. El hueco es honesto; una
//         imagen genérica no lo es.
//  4. Los pasos se redactan en imperativo, con el objetivo de cada acción y el
//     criterio de éxito ("el testigo se apaga", "hasta MIN/MAX", etc.).
// ============================================================================

/**
 * Esquema de un manual (para referencia en el código):
 *
 * id            string   único, en kebab-case: `<marca>-<modelo>-<motor>-<procedimiento>`
 * rev           number   versión del manual (subir al corregir cifras)
 * status        'borrador' | 'verificado'
 * category      'mantenimiento' | 'motor' | 'frenos' | 'suspension' | 'transmision'
 *               | 'refrigeracion' | 'electricidad' | 'escape' | 'neumaticos'
 *               | 'carroceria' | 'interior' | 'climatizacion'
 * title         string   nombre del procedimiento ("Cambio de aceite y filtro")
 * summary       string   una línea para el listado
 * vehicle       { brand, model, years, engines: [{ code, name }], notes }
 * meta          { difficulty 1-5, time, interval, frequency, warrantySafe }
 * specs         [{ label, value, note, confidence }]   especificaciones del fabricante
 * tools         [{ name, note }]                       herramientas necesarias
 * parts         [{ name, ref, qty, note, consumable }] recambios y consumibles
 * warnings      [{ title, text }]                      seguridad / avisos previos
 * steps         [{ title, text, bullets, image, imageCaption, tip, warning, torque }]
 * torque        [{ element, value, note, confidence }] pares de apriete
 * checklist     [string]                              verificación final
 * mistakes      [{ title, text }]                      errores frecuentes
 * aftercare     [{ label, text }]                      qué hacer tras el trabajo
 * sources       [{ name, note }]                       de dónde sale cada bloque
 */

export const MANUAL_TEMPLATE = {
  id: 'marca-modelo-motor-procedimiento',
  rev: 1,
  status: 'borrador',
  category: 'mantenimiento',
  title: 'Nombre del procedimiento (p. ej. Cambio de pastillas de freno delanteras)',
  summary: 'Una línea que resume para qué sirve este manual y a qué vehículos cubre.',

  vehicle: {
    brand: 'Marca',
    model: 'Modelo y generación (p. ej. Golf VII 5G/BE)',
    years: '2016-2020',
    engines: [
      // Un manual puede cubrir varios motores si el procedimiento coincide.
      { code: 'CÓDIGO DEL MOTOR', name: 'Denominación comercial (1.5 TSI 150 CV)' },
    ],
    notes: 'Matices por motor/año/acabado. Si el procedimiento cambia, crear un manual por variante.',
  },

  meta: {
    difficulty: 2, // 1 = mecánica básica · 5 = requiere experiencia/herramienta especial
    time: '45-60 min',
    interval: 'Cada X km / X años',
    frequency: 'Según mantenimiento periódico', // o 'por avería', 'según desgaste'
    warrantySafe: true, // puede hacerse sin perder la garantía de fábrica
  },

  // Especificaciones del fabricante. `confidence` obligatorio en cada fila.
  specs: [
    { label: 'Capacidad de aceite (con filtro)', value: 'X,X L', note: 'Notas de llenado', confidence: 'verificar' },
    { label: 'Viscosidad / homologación', value: '0W-30 VW 504 00', note: 'Alternativas admitidas', confidence: 'verificar' },
    { label: 'Par de apriete del tapón', value: '30 Nm', note: 'Tapón de un solo uso', confidence: 'verificar' },
    { label: 'Intervalo de sustitución', value: '30.000 km / 2 años', note: 'LongLife vs. intervalo fijo', confidence: 'verificar' },
  ],

  tools: [
    { name: 'Herramienta principal (p. ej. llave de 13 mm)', note: 'Alternativas' },
    { name: 'Bandeja de drenaje ≥ 6 L', note: '' },
    { name: 'Soportes / rampas homologadas', note: 'Nunca trabajar solo con el gato' },
    { name: 'Equipo de protección: guantes nitrilo, gafas', note: '' },
  ],

  parts: [
    { name: 'Recambio principal', ref: 'REFERENCIA', qty: '1 ud.', note: 'Confirmar por VIN', consumable: false },
    { name: 'Junta tórica', ref: 'REFERENCIA', qty: '1 ud.', note: 'Siempre sustituir', consumable: true },
    { name: 'Aceite', ref: 'Homologación', qty: 'X L', note: '', consumable: true },
  ],

  warnings: [
    {
      title: 'Seguridad',
      text: 'Motor caliente, fluidos a temperatura de servicio. Usar protección y trabajar sobre superficie nivelada.',
    },
    {
      title: 'Garantía',
      text: 'Mantener recambios con homologación del fabricante y registrar el servicio para conservar la garantía.',
    },
  ],

  // Cada paso: acción → cómo se comprueba que está bien.
  steps: [
    {
      title: 'Preparación y seguridad',
      text: 'Qué hacer primero y por qué. Incluir estado del vehículo (nivelado, freno de mano, ruedas calzadas).',
      bullets: ['Detalle 1', 'Detalle 2'],
      // IMAGEN — dos formas, y solo dos:
      //
      //  a) Foto real verificada (obligatorio declarar qué se ve, origen y pines):
      //     image: {
      //       kind: 'foto',
      //       src: imagenImportada,            // import desde erp/src/assets/manuals/real/…
      //       scope: 'modelo',                 // 'modelo' = motor exacto · 'familia' = familia de motor identificada
      //       shows: 'Qué aparece realmente en la foto y de qué motor/vehículo es',
      //       source: 'Origen de la foto (taller propio, guía, fabricante…)',
      //       caption: 'Pie de foto: qué mirar exactamente',
      //       points: [{ x: 42, y: 55, label: 'Tapón de drenaje' }],  // coordenadas en % de la imagen
      //     },
      //
      //  b) Hueco honesto mientras no exista foto real del motor concreto:
      //     image: {
      //       kind: 'pendiente',
      //       brief: 'Encuadre exacto a fotografiar (ángulo, qué debe verse, elemento de referencia).',
      //     },
      //
      //  NUNCA: ilustraciones genéricas, renders de otros motores o fotos de
      //  motorizaciones distintas a la cubierta por el manual.
      tip: 'Truco de taller que ahorra tiempo.',
      warning: 'Riesgo concreto de este paso.',
      torque: '30 Nm', // par que se aplica en este paso (debe estar también en `torque`)
    },
    {
      title: 'Sustitución',
      text: 'Paso a paso del trabajo. Cifras concretas (Nm, litros, posiciones de reloj).',
      bullets: [],
    },
    {
      title: 'Comprobación y puesta a punto',
      text: 'Niveles, fugas, reinicio de intervalos, arranque de prueba.',
    },
  ],

  torque: [
    { element: 'Elemento roscado', value: '30 Nm', note: 'Siempre con junta/elemento nuevo', confidence: 'verificar' },
    { element: 'Tapa de filtro', value: '25 Nm', note: 'Junta tórica nueva engrasada', confidence: 'verificar' },
  ],

  checklist: [
    'Sin fugas en los elementos intervenidos',
    'Nivel entre MIN y MAX con motor a temperatura de servicio',
    'Intervalos reiniciados',
    'Servicio registrado en la historia del vehículo',
  ],

  mistakes: [
    {
      title: 'Error frecuente',
      text: 'Qué se hace mal a menudo y cómo evitarlo.',
    },
  ],

  aftercare: [
    { label: 'Residuos', text: 'Aceite usado y filtros al punto limpio; guardar justificante.' },
    { label: 'Historial', text: 'Anotar fecha, km, recambios y homologación usada.' },
    { label: 'Próximo servicio', text: 'Programar el siguiente intervalo.' },
  ],

  sources: [
    { name: 'Documentación oficial del fabricante (erWin / ELSA)', note: 'Consultar por VIN antes de usar cifras marcadas como verificar' },
    { name: 'Manual de taller de la familia de motores', note: '' },
    { name: 'Experiencia de taller', note: 'Solo para tips y errores frecuentes' },
  ],
};

export default MANUAL_TEMPLATE;

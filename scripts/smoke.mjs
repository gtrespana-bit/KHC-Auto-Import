// Runner de la prueba de humo: levanta Vite para poder importar JSX en Node.
import { createServer } from 'vite';

// Leaflet lee algunas propiedades del DOM al importarse, aunque durante SSR de humo no se monta el mapa.
globalThis.window ||= globalThis;
globalThis.window.screen ||= { deviceXDPI: 96, logicalXDPI: 96 };
globalThis.navigator ||= { userAgent: 'node', platform: 'linux' };
globalThis.document ||= {
  documentElement: { style: {} },
  body: { appendChild() {}, removeChild() {}, style: {} },
  createElement: () => ({ style: {}, getContext: () => null }),
  createElementNS: () => ({ createSVGRect() {} }),
  addEventListener() {},
  removeEventListener() {},
};

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true },
});

let failed = false;
try {
  const mod = await server.ssrLoadModule('/scripts/smoke-render.jsx');
  const { results, errors } = await mod.run();

  let pass = 0;
  for (const r of results) {
    if (r.ok) pass += 1;
    else {
      failed = true;
      console.error(`✗ [${r.scenario}] ${r.name}: ${r.error}`);
      if (r.stack) console.error(String(r.stack).split('\n').slice(1, 4).join('\n'));
    }
  }
  console.log(`\n[render] ${pass}/${results.length} vistas renderizadas correctamente`);
  if (errors.length) {
    failed = true;
    console.error(`[render] ${errors.length} console.error durante el render:`);
    [...new Set(errors)].slice(0, 10).forEach((e) => console.error('  · ' + e));
  }
} catch (e) {
  failed = true;
  console.error('[render] fallo al cargar el módulo:', e && e.stack ? e.stack : e);
} finally {
  await server.close();
}

process.exit(failed ? 1 : 0);

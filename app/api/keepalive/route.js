import { NextResponse } from 'next/server';

// Mantiene activo el proyecto de Supabase en el plan gratuito.
// Supabase pausa los proyectos Free tras 7 días sin actividad en la base de datos;
// Vercel llama a esta función a diario (ver "crons" en vercel.json) y ella hace una
// consulta trivial. La clave publicable no ve más filas que las publicadas (RLS),
// pero la consulta llega a Postgres y cuenta como actividad. También se puede abrir
// a mano: https://TU-DOMINIO/api/keepalive
export const dynamic = 'force-dynamic';

export async function GET() {
  // Sin barra final: `https://x.supabase.co/` + `/rest/v1/…` daría doble barra.
  const url = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en Vercel' },
      { status: 500 },
    );
  }

  // Cabeceras: `apikey` siempre; `Authorization: Bearer` solo con las claves
  // antiguas (JWT, empiezan por «eyJ»). Las nuevas (`sb_publishable_…`) no son un
  // JWT y Supabase responde 401 si se mandan en esa cabecera.
  const headers = { apikey: key };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  // Se prueban dos consultas: la primera es la tabla que la web ya lee en
  // público (permiso garantizado por la migración de la web); la segunda es el
  // recuento de empresas, por si algún día cambiara lo anterior. Basta con que
  // una llegue a Postgres para que el proyecto no se pause.
  const queries = [
    ['publications', `${url}/rest/v1/publications?select=id&limit=1&status=eq.publicado`],
    ['organizations', `${url}/rest/v1/organizations?select=id&limit=1`],
  ];

  const problems = [];
  for (const [name, target] of queries) {
    try {
      const r = await fetch(target, { headers, cache: 'no-store' });
      const ok = r.status === 200 || r.status === 206;
      if (ok) {
        return NextResponse.json({
          ok: true,
          status: r.status,
          query: name,
          at: new Date().toISOString(),
          note: 'Proyecto de Supabase activo',
        });
      }
      // El motivo exacto de Supabase: ahorra tener que adivinar si el problema
      // está en la URL, en la clave o en los permisos de la tabla.
      const detail = (await r.text().catch(() => '')).slice(0, 300);
      problems.push({ query: name, status: r.status, detail });
    } catch (err) {
      problems.push({ query: name, error: String(err && err.message ? err.message : err) });
    }
  }

  return NextResponse.json(
    {
      ok: false,
      at: new Date().toISOString(),
      note: 'Ninguna consulta de comprobación ha funcionado: revisa la URL, la clave y los permisos.',
      problems,
    },
    { status: 502 },
  );
}

import { NextResponse } from 'next/server';

// Mantiene activo el proyecto de Supabase en el plan gratuito.
// Supabase pausa los proyectos Free tras 7 días sin actividad en la base de datos;
// Vercel llama a esta función a diario (ver "crons" en vercel.json) y ella hace una
// consulta trivial. La clave publicable no ve filas (RLS), pero la consulta llega a
// Postgres y cuenta como actividad. También se puede abrir a mano:
// https://TU-DOMINIO/api/keepalive
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

  try {
    const r = await fetch(`${url}/rest/v1/organizations?select=id&limit=1`, {
      headers,
      cache: 'no-store',
    });
    const ok = r.status === 200 || r.status === 206;
    // El motivo exacto de Supabase, solo cuando algo va mal: ahorra tener que
    // adivinar si el problema está en la URL, en la clave o en un proyecto pausado.
    const detail = ok ? undefined : (await r.text().catch(() => '')).slice(0, 300);
    return NextResponse.json(
      {
        ok,
        status: r.status,
        at: new Date().toISOString(),
        note: ok
          ? 'Proyecto de Supabase activo'
          : 'Respuesta inesperada: mira «detail» y revisa la URL y la clave en Vercel.',
        ...(detail ? { detail } : {}),
      },
      { status: ok ? 200 : 502 },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err && err.message ? err.message : err) },
      { status: 502 },
    );
  }
}

import { NextResponse } from 'next/server';

// Mantiene activo el proyecto de Supabase en el plan gratuito.
// Supabase pausa los proyectos Free tras 7 días sin actividad en la base de datos;
// Vercel llama a esta función a diario (ver "crons" en vercel.json) y ella hace una
// consulta trivial. La clave anon no ve filas (RLS), pero la consulta llega a Postgres
// y cuenta como actividad. También se puede abrir a mano: https://TU-DOMINIO/api/keepalive
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en Vercel' },
      { status: 500 },
    );
  }
  try {
    const r = await fetch(`${url}/rest/v1/organizations?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    const ok = r.status === 200 || r.status === 206;
    return NextResponse.json(
      {
        ok,
        status: r.status,
        at: new Date().toISOString(),
        note: ok
          ? 'Proyecto de Supabase activo'
          : 'Respuesta inesperada: puede que el proyecto esté pausado. Reanúdalo en el panel de Supabase.',
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

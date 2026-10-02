import { NextResponse } from 'next/server';
import { submitLead } from '@/lib/leads.js';

const KINDS = ['contacto', 'coche', 'encargo', 'compra'];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Petición no válida' }, { status: 400 });
  }

  // Trampa para robots: si viene rellena, se descarta sin decir nada.
  if (body.website) return NextResponse.json({ ok: true });

  const name = String(body.name || '').trim().slice(0, 120);
  const phone = String(body.phone || '').trim().slice(0, 40);
  const email = String(body.email || '').trim().slice(0, 160);
  const message = String(body.message || '').trim().slice(0, 4000);
  const kind = KINDS.includes(body.kind) ? body.kind : 'contacto';
  const vehicleSlug = body.vehicleSlug ? String(body.vehicleSlug).trim().slice(0, 160) : null;
  const source = body.source ? String(body.source).trim().slice(0, 80) : 'web';

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: 'Indica tu nombre para poder contestarte.' }, { status: 400 });
  }
  if (phone.length < 6 && email.length < 5) {
    return NextResponse.json(
      { ok: false, error: 'Necesitamos un teléfono o un correo para contestarte.' },
      { status: 400 },
    );
  }

  const result = await submitLead({ name, phone, email, message, kind, vehicleSlug, source });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

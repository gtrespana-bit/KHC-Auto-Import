// ============================================================================
//  ALTA DE CONTACTOS DESDE LA WEB
// ----------------------------------------------------------------------------
//  La web no escribe en ninguna tabla: llama a la función `web_submit_lead`
//  de Supabase, que resuelve la empresa a partir del slug del sitio y valida
//  los datos. El rol anónimo no tiene permiso de INSERT en `web_leads`.
//
//  Si aún no hay Supabase configurado (modo demostración), el contacto se
//  registra en el log del servidor para poder probar el formulario.
// ============================================================================
import { createClient } from '@supabase/supabase-js';
import { SITE_SLUG, isDemo } from './listings.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client = null;
function sb() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function submitLead(lead) {
  const { name, phone, email, message, kind, vehicleSlug, source } = lead;

  if (isDemo) {
    console.info('[lead · modo demostración]', { kind, name, phone, email, message, vehicleSlug, source });
    return { ok: true, demo: true };
  }

  const { data, error } = await sb().rpc('web_submit_lead', {
    p_site: SITE_SLUG,
    p_kind: kind || 'contacto',
    p_name: name,
    p_phone: phone || null,
    p_email: email || null,
    p_message: message || null,
    p_vehicle_slug: vehicleSlug || null,
    p_source: source || null,
  });

  if (error) {
    console.error('[leads] error al guardar el contacto:', error.message);
    return { ok: false, error: 'No hemos podido guardar tu solicitud. Inténtalo de nuevo en unos minutos.' };
  }

  // Aviso instantáneo opcional (Telegram, Slack, Make, n8n…). No bloquea.
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: SITE_SLUG, id: data, ...lead }),
    }).catch(() => {});
  }

  return { ok: true, id: data };
}

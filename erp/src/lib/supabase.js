// ============================================================================
//  CLIENTE DE SUPABASE
// ----------------------------------------------------------------------------
//  Las credenciales vienen de variables de entorno de Vite (fichero .env.local
//  en desarrollo, panel de Vercel en producción). Solo se usa la clave `anon`:
//  la seguridad real la imponen las políticas RLS de la base de datos.
//  Si no hay credenciales, la app funciona en modo local (IndexedDB), que es
//  lo que usan los scripts de prueba.
// ============================================================================
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Traslada la sesión guardada por la versión «coruna_autoimport_auth». */
function migrateAuthKey() {
  const NEW_KEY = 'khc_autoimport_auth';
  try {
    const legacy = localStorage.getItem('coruna_autoimport_auth');
    if (legacy && !localStorage.getItem(NEW_KEY)) {
      localStorage.setItem(NEW_KEY, legacy);
      localStorage.removeItem('coruna_autoimport_auth');
    }
  } catch {
    /* sin localStorage no hay nada que migrar */
  }
  return NEW_KEY;
}

let client = null;
export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // La clave de sesión cambió con el renombrado: se migra sola para no
        // tener que volver a iniciar sesión tras la actualización.
        storageKey: migrateAuthKey(),
      },
    });
  }
  return client;
}

/** Traduce los errores más habituales de Supabase a mensajes en castellano. */
export function describeError(err) {
  const msg = String(err?.message || err || '');
  const code = err?.code || '';
  if (code === '42501' || /row-level security/i.test(msg)) return 'Tu rol no tiene permiso para hacer esta operación';
  if (code === '23505' && /invoices_org_id_number_key/.test(msg)) return 'Ya existe una factura con ese número';
  if (code === '23505') return 'Ya existe un registro con ese identificador';
  if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos';
  if (/Email not confirmed/i.test(msg)) return 'Debes confirmar tu correo antes de entrar (revisa la bandeja de entrada)';
  if (/User already registered/i.test(msg)) return 'Ya existe una cuenta con ese correo';
  if (/Password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres';
  if (/rate limit/i.test(msg)) return 'Demasiados intentos; espera un momento';
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Sin conexión con el servidor';
  return msg || 'Error desconocido';
}

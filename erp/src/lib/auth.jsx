// ============================================================================
//  AUTENTICACIÓN Y EMPRESA ACTIVA
// ----------------------------------------------------------------------------
//  · Sesión de Supabase Auth (correo + contraseña).
//  · Empresas a las que pertenece el usuario y su rol en cada una
//    (RPC `my_memberships`). La empresa activa se recuerda en localStorage.
//  · En modo local (sin credenciales) no hay sesión: `user` es null y
//    `mode` es 'local'.
// ============================================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase, isSupabaseConfigured, describeError } from './supabase.js';

const ORG_KEY = 'khc_autoimport_org';
const LEGACY_ORG_KEY = 'coruna_autoimport_org';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const sb = getSupabase();
  const [session, setSession] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [orgId, setOrgIdState] = useState(() => {
    try {
      const current = localStorage.getItem(ORG_KEY);
      if (current) return current;
      // Versión anterior («coruna_autoimport_org»): se adopta y se limpia.
      const legacy = localStorage.getItem(LEGACY_ORG_KEY);
      if (legacy) {
        localStorage.setItem(ORG_KEY, legacy);
        localStorage.removeItem(LEGACY_ORG_KEY);
        return legacy;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'local'); // loading | anon | ready | recovery | local
  const [error, setError] = useState('');

  const loadMemberships = useCallback(async () => {
    if (!sb) return [];
    const { data, error: err } = await sb.rpc('my_memberships');
    if (err) {
      setError(describeError(err));
      return [];
    }
    const list = data || [];
    setMemberships(list);
    return list;
  }, [sb]);

  // Sesión inicial + cambios (login, logout, recuperación de contraseña, refresco)
  useEffect(() => {
    if (!sb) return undefined;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setStatus(data.session ? 'ready' : 'anon');
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (!alive) return;
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setStatus('recovery');
      else if (event === 'SIGNED_OUT') { setMemberships([]); setStatus('anon'); }
      else if (s) setStatus((prev) => (prev === 'recovery' ? prev : 'ready'));
      else setStatus('anon');
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  // Empresas del usuario al iniciar sesión
  useEffect(() => {
    if (!sb || !session?.user) return;
    let attempts = 0;
    const tick = async () => {
      const list = await loadMemberships();
      // Justo tras registrarse el trigger puede tardar unos ms en crear la empresa
      if (!list.length && attempts < 5) { attempts += 1; setTimeout(tick, 700); }
    };
    tick();
  }, [sb, session?.user?.id, loadMemberships]);

  const setOrgId = useCallback((id) => {
    setOrgIdState(id);
    try { if (id) localStorage.setItem(ORG_KEY, id); else localStorage.removeItem(ORG_KEY); } catch { /* noop */ }
  }, []);

  // Empresa activa: la recordada si sigue siendo válida; si no, la primera
  const current = useMemo(() => {
    if (!memberships.length) return null;
    return memberships.find((m) => m.org_id === orgId) || memberships[0];
  }, [memberships, orgId]);

  useEffect(() => {
    if (current && current.org_id !== orgId) setOrgId(current.org_id);
  }, [current, orgId, setOrgId]);

  const signIn = useCallback(async (email, password) => {
    setError('');
    const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (err) { const m = describeError(err); setError(m); throw new Error(m); }
  }, [sb]);

  const signUp = useCallback(async ({ email, password, fullName, company }) => {
    setError('');
    const { data, error: err } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName || '', company: company || '' }, emailRedirectTo: window.location.origin },
    });
    if (err) { const m = describeError(err); setError(m); throw new Error(m); }
    // Si el proyecto exige confirmar el correo, no hay sesión todavía
    return { needsConfirmation: !data.session };
  }, [sb]);

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
    setMemberships([]);
  }, [sb]);

  const resetPassword = useCallback(async (email) => {
    setError('');
    const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (err) { const m = describeError(err); setError(m); throw new Error(m); }
  }, [sb]);

  const updatePassword = useCallback(async (password) => {
    setError('');
    const { error: err } = await sb.auth.updateUser({ password });
    if (err) { const m = describeError(err); setError(m); throw new Error(m); }
    setStatus('ready');
  }, [sb]);

  const value = useMemo(() => ({
    mode: isSupabaseConfigured ? 'supabase' : 'local',
    status,
    error,
    session,
    user: session?.user || null,
    memberships,
    current,
    orgId: current?.org_id || null,
    role: current?.role || null,
    setOrgId,
    refreshMemberships: loadMemberships,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }), [status, error, session, memberships, current, setOrgId, loadMemberships, signIn, signUp, signOut, resetPassword, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Igual que useAuth pero devuelve null si no hay proveedor (tests, modo local). */
export function useOptionalAuth() {
  return useContext(AuthContext);
}

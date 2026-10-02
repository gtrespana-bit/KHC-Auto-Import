import React, { useState } from 'react';
import { Car, LogIn, UserPlus, KeyRound, Loader2, MailCheck, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input, Alert, cx } from './ui.jsx';

/**
 * Pantalla de acceso. Envuelve la aplicación: si hay sesión y empresa,
 * renderiza `children`; si no, muestra entrar / crear cuenta / recuperar.
 * En modo local (sin Supabase) deja pasar directamente.
 */
export default function AuthGate({ children }) {
  const auth = useAuth();

  if (auth.mode === 'local') return children;
  if (auth.status === 'loading') return <Splash text="Conectando…" />;
  if (auth.status === 'recovery') return <Frame><NewPasswordForm /></Frame>;
  if (auth.status === 'anon' || !auth.user) return <Frame><AuthForms /></Frame>;
  if (!auth.current) {
    return (
      <Frame>
        {auth.error ? (
          <Alert tone="danger" title="No se ha podido cargar tu empresa">{auth.error}</Alert>
        ) : (
          <Splash text="Preparando tu empresa…" inline />
        )}
        <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
          <span>{auth.user.email}</span>
          <button className="underline hover:text-white" onClick={auth.signOut}>Salir</button>
        </div>
      </Frame>
    );
  }
  return children;
}

function Splash({ text, inline }) {
  const body = (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-10">
      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      <p className="text-sm">{text}</p>
    </div>
  );
  if (inline) return body;
  return <div className="min-h-screen bg-slate-950 flex items-center justify-center">{body}</div>;
}

function Frame({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-white leading-tight">KHC Auto Import</p>
            <p className="text-xs text-slate-500">Gestión de importación y venta de vehículos</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">{children}</div>
        <p className="text-[11px] text-slate-600 text-center mt-4">Datos alojados en la Unión Europea · acceso cifrado · un usuario por persona</p>
      </div>
    </div>
  );
}

function AuthForms() {
  const auth = useAuth();
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const [err, setErr] = useState('');

  const run = async (fn) => {
    setBusy(true); setErr(''); setInfo('');
    try { await fn(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'login') return run(() => auth.signIn(email, password));
    if (mode === 'signup') {
      return run(async () => {
        const { needsConfirmation } = await auth.signUp({ email, password, fullName, company });
        if (needsConfirmation) setInfo('Cuenta creada. Te hemos enviado un correo para confirmarla: ábrelo y vuelve aquí para entrar.');
      });
    }
    return run(async () => {
      await auth.resetPassword(email);
      setInfo('Si el correo existe, recibirás un enlace para crear una nueva contraseña.');
    });
  };

  const tabs = [
    { id: 'login', label: 'Entrar', icon: LogIn },
    { id: 'signup', label: 'Crear cuenta', icon: UserPlus },
    { id: 'reset', label: 'Recuperar', icon: KeyRound },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950/60 p-1 border border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setMode(t.id); setErr(''); setInfo(''); }}
            className={cx('flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg py-2 transition-colors',
              mode === t.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white')}
          >
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <>
          <Field label="Tu nombre"><Input value={fullName} onChange={setFullName} placeholder="Nombre y apellidos" /></Field>
          <Field label="Nombre de la empresa" hint="Puedes cambiarlo después en Ajustes">
            <Input value={company} onChange={setCompany} placeholder="KHC Auto Import" />
          </Field>
        </>
      )}

      <Field label="Correo electrónico" required>
        <Input type="email" value={email} onChange={setEmail} placeholder="tu@correo.es" />
      </Field>

      {mode !== 'reset' && (
        <Field label="Contraseña" required hint={mode === 'signup' ? 'Mínimo 6 caracteres' : undefined}>
          <Input type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        </Field>
      )}

      {err && <Alert tone="danger">{err}</Alert>}
      {info && <Alert tone="ok"><span className="flex items-start gap-2"><MailCheck className="w-4 h-4 mt-0.5 shrink-0" />{info}</span></Alert>}

      <Button type="submit" className="w-full justify-center" disabled={busy || !email || (mode !== 'reset' && !password)}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta y empresa' : 'Enviar enlace'}
      </Button>

      {mode === 'signup' && (
        <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
          <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Si alguien te ha invitado a su empresa con este correo, entrarás directamente en ella con el rol que te asignó; si no, se creará tu propia empresa y serás su propietario.
        </p>
      )}
    </form>
  );
}

function NewPasswordForm() {
  const auth = useAuth();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (password !== again) { setErr('Las contraseñas no coinciden'); return; }
    setBusy(true); setErr('');
    try { await auth.updatePassword(password); } catch (er) { setErr(er.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-sm font-bold text-white">Nueva contraseña</h2>
      <Field label="Contraseña" required hint="Mínimo 6 caracteres"><Input type="password" value={password} onChange={setPassword} /></Field>
      <Field label="Repite la contraseña" required><Input type="password" value={again} onChange={setAgain} /></Field>
      {err && <Alert tone="danger">{err}</Alert>}
      <Button type="submit" className="w-full justify-center" disabled={busy || password.length < 6}>Guardar y entrar</Button>
    </form>
  );
}

import React, { useEffect, useState } from 'react';
import { X, Search, ChevronDown, AlertTriangle, CheckCircle2, Info, Trash2, Plus } from 'lucide-react';
import { eur, eur0, dateEs, pct as pctFmt } from '../lib/format.js';

export { eur, eur0, dateEs, pctFmt };

export const cx = (...args) => args.filter(Boolean).join(' ');

export function Card({ children, className = '', tone = 'default' }) {
  const tones = {
    default: 'bg-slate-900/70 border-slate-800',
    amber: 'bg-amber-500/5 border-amber-500/30',
    emerald: 'bg-emerald-500/5 border-emerald-500/30',
    rose: 'bg-rose-500/5 border-rose-500/30',
    sky: 'bg-sky-500/5 border-sky-500/30',
  };
  return <div className={cx('rounded-2xl border backdrop-blur-sm', tones[tone], className)}>{children}</div>;
}

export function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone = 'default', icon: Icon }) {
  const tones = {
    default: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    sky: 'text-sky-400',
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>
      <p className={cx('text-2xl font-extrabold mt-1.5 tracking-tight', tones[tone])}>{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </Card>
  );
}

export function Button({ children, onClick, variant = 'primary', size = 'md', icon: Icon, className = '', type = 'button', disabled, title }) {
  const variants = {
    primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold border border-amber-400/50',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 border border-transparent',
    danger: 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/40',
    outline: 'bg-transparent text-amber-300 hover:bg-amber-500/10 border border-amber-500/40',
  };
  const sizes = { sm: 'text-xs px-2.5 py-1.5', md: 'text-sm px-3.5 py-2', lg: 'text-sm px-5 py-2.5' };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className,
      )}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className = '', required }) {
  return (
    <label className={cx('block', className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

const inputClass = 'w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition-colors';

export function Input({ value, onChange, type = 'text', placeholder, className = '', step, min, max, list }) {
  return (
    <input
      type={type}
      step={step}
      min={min}
      max={max}
      list={list}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      className={cx(inputClass, className)}
    />
  );
}

export function Money({ value, onChange, className = '', placeholder = '0,00' }) {
  return (
    <div className={cx('relative', className)}>
      <Input type="number" step="0.01" value={value} onChange={onChange} placeholder={placeholder} className="pr-8" />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">€</span>
    </div>
  );
}

export function Textarea({ value, onChange, rows = 3, placeholder, className = '' }) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={cx(inputClass, 'resize-y', className)}
    />
  );
}

export function Select({ value, onChange, options = [], className = '', placeholder }) {
  return (
    <div className={cx('relative', className)}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputClass, 'appearance-none pr-9 cursor-pointer')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export function Checkbox({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500/40"
      />
      <span>
        <span className="text-sm text-slate-200 group-hover:text-white">{label}</span>
        {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Buscar…', className = '' }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputClass, 'pl-9')}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

const BADGE_TONES = {
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  lime: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
  green: 'bg-green-500/15 text-green-300 border-green-500/30',
  orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  teal: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

export function Badge({ children, tone = 'slate', className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap', BADGE_TONES[tone] || BADGE_TONES.slate, className)}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, subtitle, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm print:hidden">
      <div className={cx('w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl my-4', wide ? 'max-w-5xl' : 'max-w-2xl')}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-slate-800 flex flex-wrap justify-end gap-2 bg-slate-950/40 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-slate-900/70 border border-slate-800 rounded-xl">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            active === t.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800',
          )}
        >
          {t.icon && <t.icon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Alert({ tone = 'info', title, children, action, className = '' }) {
  const tones = {
    info: 'border-sky-500/30 bg-sky-500/5 text-sky-200',
    warn: 'border-amber-500/40 bg-amber-500/5 text-amber-200',
    danger: 'border-rose-500/40 bg-rose-500/5 text-rose-200',
    ok: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-200',
    success: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-200',
  };
  const icons = { info: Info, warn: AlertTriangle, danger: AlertTriangle, ok: CheckCircle2, success: CheckCircle2 };
  const Icon = icons[tone] || Info;
  return (
    <div className={cx('rounded-xl border px-3.5 py-3 flex items-start gap-2.5', tones[tone] || tones.info, className)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="text-xs leading-relaxed flex-1">
        {title && <p className="font-bold mb-0.5">{title}</p>}
        {children}
      </div>
      {action}
    </div>
  );
}

export function Row({ label, value, strong, tone = 'default', hint }) {
  const tones = { default: 'text-slate-200', emerald: 'text-emerald-400', rose: 'text-rose-400', amber: 'text-amber-300', slate: 'text-slate-400' };
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-right">
        <span className={cx('text-sm tabular-nums', strong && 'font-bold', tones[tone])}>{value}</span>
        {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
      </span>
    </div>
  );
}

export function Table({ columns, rows, empty = 'Sin registros', onRowClick, dense }) {
  if (!rows.length) {
    return <div className="text-center text-sm text-slate-500 py-10 border border-dashed border-slate-800 rounded-xl">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
            {columns.map((c) => (
              <th key={c.key} className={cx('px-3 text-left font-semibold whitespace-nowrap', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', dense ? 'py-2' : 'py-2.5')}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.id || i}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cx('border-t border-slate-800/70 hover:bg-slate-800/30', onRowClick && 'cursor-pointer')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('px-3 text-slate-200', c.align === 'right' && 'text-right tabular-nums', c.align === 'center' && 'text-center', dense ? 'py-1.5' : 'py-2.5')}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Progress({ value, tone = 'amber' }) {
  const tones = { amber: 'bg-amber-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500', sky: 'bg-sky-500' };
  return (
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
      <div className={cx('h-full rounded-full transition-all', tones[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="text-center py-14 px-6 border border-dashed border-slate-800 rounded-2xl">
      {Icon && <Icon className="w-9 h-9 mx-auto text-slate-700 mb-3" />}
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      {children && <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function KeyValueGrid({ items, cols = 2, className = '' }) {
  return (
    <div className={cx('grid gap-x-6 gap-y-1', cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3', className)}>
      {items.map((it) => (
        <Row key={it.label} label={it.label} value={it.value} tone={it.tone} hint={it.hint} />
      ))}
    </div>
  );
}

export function Toasts({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2 print:hidden">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xl backdrop-blur-md',
            t.tone === 'error' ? 'bg-rose-500/15 border-rose-500/40 text-rose-200' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Eliminar' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" icon={Trash2} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-slate-300">{message}</p>
    </Modal>
  );
}

export function AddButton({ onClick, children = 'Nuevo' }) {
  return (
    <Button onClick={onClick} icon={Plus}>{children}</Button>
  );
}

export function PrintButton({ onClick = () => window.print(), label = 'Imprimir / PDF' }) {
  return <Button variant="secondary" onClick={onClick}>{label}</Button>;
}

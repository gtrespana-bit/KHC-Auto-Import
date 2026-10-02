import React, { useMemo, useState } from 'react';
import { Copy, Check, Megaphone } from 'lucide-react';
import { Modal, Button, Field, Input, Select, Alert, Badge, Row } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { buildAd } from '../lib/templates.js';
import { eur, eur0 } from '../lib/format.js';
import { salePriceOf, vehiclePnl } from '../domain/finance.js';

const PORTALS = [
  { value: 'wallapop', label: 'Wallapop (máx. 1.000 caracteres)' },
  { value: 'milanuncios', label: 'Milanuncios (máx. 1.500)' },
  { value: 'cochesnet', label: 'Coches.net / Autocasión (máx. 3.000)' },
  { value: 'generico', label: 'Genérico' },
];

export default function AdModal({ open, onClose, vehicle }) {
  const { state, toast, tariffs } = useStore();
  const [portal, setPortal] = useState('wallapop');
  const [price, setPrice] = useState(vehicle ? salePriceOf(vehicle) : 0);
  const [copied, setCopied] = useState('');

  const ad = useMemo(
    () => (vehicle ? buildAd({ vehicle, price, company: state.company, portal }) : null),
    [vehicle, price, state.company, portal],
  );

  const pnl = useMemo(
    () => (vehicle ? vehiclePnl({ ...vehicle, sale: { ...vehicle.sale, price } }, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs }) : null),
    [vehicle, price, state.company.vatRegime, tariffs],
  );

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      toast(`${what} copiado al portapapeles`);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      toast('El navegador no permite copiar: selecciona el texto manualmente', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={vehicle ? `Anuncio — ${vehicle.brand} ${vehicle.model}` : 'Anuncio'}
      subtitle="Texto listo para pegar en el portal. Se genera con los datos reales de la ficha."
      footer={<Button variant="ghost" onClick={onClose}>Cerrar</Button>}
    >
      {vehicle && ad && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Portal"><Select value={portal} onChange={setPortal} options={PORTALS} /></Field>
            <Field label="Precio del anuncio" hint={`Beneficio neto previsto ${eur0(pnl.net)}`}>
              <Input type="number" step="50" value={price} onChange={setPrice} />
            </Field>
            <Field label="Teléfono / contacto" hint="Sale en el anuncio"><Input value={state.company.phone} onChange={() => {}} disabled /></Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Título</p>
              <Button size="sm" variant="ghost" icon={copied === 'Título' ? Check : Copy} onClick={() => copy(ad.title, 'Título')}>
                {copied === 'Título' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">{ad.title}</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Descripción
                <span className="ml-2 normal-case tracking-normal">
                  <Badge tone={ad.truncated ? 'amber' : 'emerald'}>{ad.chars} / {ad.limit} caracteres</Badge>
                </span>
              </p>
              <Button size="sm" variant="secondary" icon={copied === 'Descripción' ? Check : Copy} onClick={() => copy(ad.body, 'Descripción')}>
                {copied === 'Descripción' ? 'Copiado' : 'Copiar descripción'}
              </Button>
            </div>
            <pre className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-xs text-slate-200 whitespace-pre-wrap font-sans max-h-80 overflow-y-auto">{ad.body}</pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Versión corta (estado o respuesta rápida)</p>
              <Button size="sm" variant="ghost" icon={copied === 'Versión corta' ? Check : Copy} onClick={() => copy(ad.short, 'Versión corta')}>Copiar</Button>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">{ad.short}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 p-3.5">
              <Row label="Precio anunciado" value={eur(price)} />
              <Row label="Coste total real" value={eur(pnl.cost.total)} tone="rose" />
              <Row label="Beneficio neto previsto" value={eur(pnl.net)} tone={pnl.net >= 0 ? 'emerald' : 'rose'} strong />
              <Row label="Precio de equilibrio" value={eur(pnl.breakEven)} tone="slate" />
            </div>
            <Alert tone="info">
              No publiques nunca un precio por debajo del <b>punto de equilibrio</b>: a partir de ahí cada descuento es pérdida neta. Si el coche lleva mucho tiempo en stock, baja el precio de golpe (un 5 % visible) en lugar de negociar poco a poco: el algoritmo de los portales lo detecta y lo enseña más.
            </Alert>
          </div>
        </div>
      )}
    </Modal>
  );
}

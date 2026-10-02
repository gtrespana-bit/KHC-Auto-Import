import React, { useMemo, useState } from 'react';
import { Settings as SettingsIcon, Building2, Percent, Database, BookOpen, Upload, Download, RotateCcw, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, SectionTitle, Tabs, Badge, Row, Alert, KeyValueGrid, ConfirmDialog, Checkbox, Textarea, Stat } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, numEs, todayISO, download } from '../lib/format.js';
import { TARIFF_GROUPS, DEFAULT_TARIFFS, SOURCES, IEDMT_BRACKETS, IRPF_SAVINGS, IRPF_GENERAL_COMBINED, RETA_2026, IS_2026, ITP_GALICIA, RATES_YEAR } from '../domain/rates.js';
import { calcReta } from '../domain/taxes.js';
import { ROLES, roleLabel } from '../lib/roles.js';
import { useOptionalAuth } from '../lib/auth.jsx';

export default function SettingsView({ initialTab = 'empresa' }) {
  const { state, setCompany, tariffs, replaceAll, loadDemo, removeDemo, hasDemo, resetData, toast, mode, role, can } = useStore();
  const auth = useOptionalAuth();
  const isCloud = mode === 'supabase';
  const [tab, setTab] = useState(initialTab);
  const [confirmReset, setConfirmReset] = useState(false);
  const [monthly, setMonthly] = useState(2500);
  const [importText, setImportText] = useState('');
  const c = state.company;

  const reta = calcReta(Number(monthly) || 0, { tarifaPlana: !!c.fiscal?.tarifaPlana });
  const overridden = Object.keys(c.tariffs || {}).filter((k) => Number(c.tariffs[k]) !== Number(DEFAULT_TARIFFS[k]));

  const exportJson = () => {
    download(`khc_autoimport_${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json');
    toast('Respaldo descargado. Guárdalo a buen recaudo.');
  };

  const importJson = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || (!data.vehicles && !data.company)) throw new Error('El archivo no tiene el formato esperado');
      replaceAll(data);
      toast('Datos importados correctamente');
    } catch (e) {
      toast(`No se ha podido importar: ${e.message}`, 'error');
    }
  };

  const tariffGroups = TARIFF_GROUPS;

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={SettingsIcon}
        title="Ajustes"
        subtitle="Datos fiscales de la empresa, régimen de IVA, tarifas verificadas del ejercicio, respaldo de los datos y las fuentes de cada cifra que usa la aplicación."
        right={<Button variant="secondary" icon={Download} onClick={exportJson}>Exportar respaldo JSON</Button>}
      />

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'empresa', label: 'Empresa' },
        { id: 'fiscal', label: 'Régimen fiscal' },
        { id: 'tarifas', label: 'Tarifas y tablas' },
        { id: 'datos', label: 'Datos y respaldo' },
        { id: 'fuentes', label: 'Fuentes y verificación' },
      ]} />

      {tab === 'empresa' && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Datos de la empresa</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre comercial / razón social" className="sm:col-span-2"><Input value={c.name} onChange={(v) => setCompany({ name: v })} placeholder="AutoImport Coruña S.L." /></Field>
            <Field label="NIF / CIF"><Input value={c.nif} onChange={(v) => setCompany({ nif: v })} placeholder="B15000000" /></Field>
            <Field label="Teléfono"><Input value={c.phone} onChange={(v) => setCompany({ phone: v })} /></Field>
            <Field label="Dirección fiscal" className="sm:col-span-2"><Input value={c.address} onChange={(v) => setCompany({ address: v })} placeholder="Polígono de Pocomaco, nave 12" /></Field>
            <Field label="Código postal"><Input value={c.postalCode} onChange={(v) => setCompany({ postalCode: v })} /></Field>
            <Field label="Localidad"><Input value={c.city} onChange={(v) => setCompany({ city: v })} /></Field>
            <Field label="Provincia"><Input value={c.province} onChange={(v) => setCompany({ province: v })} /></Field>
            <Field label="Email"><Input value={c.email} onChange={(v) => setCompany({ email: v })} /></Field>
            <Field label="Web"><Input value={c.web} onChange={(v) => setCompany({ web: v })} /></Field>
            <Field label="IBAN de cobro" className="sm:col-span-2"><Input value={c.bankIban} onChange={(v) => setCompany({ bankIban: v })} placeholder="ES00 0000 0000 0000 0000 0000" /></Field>
            <Field label="Prefijo de factura"><Input value={c.invoicePrefix} onChange={(v) => setCompany({ invoicePrefix: v })} /></Field>
            <Field label="Próximo número"><Input type="number" value={c.nextInvoiceNumber} onChange={(v) => setCompany({ nextInvoiceNumber: v })} /></Field>
            <Field label="Garantía comercial (meses)" hint="Mínimo legal 1 año en venta a particular (RDL 1/2007)"><Input type="number" value={c.warrantyMonths} onChange={(v) => setCompany({ warrantyMonths: v })} /></Field>
            <Field label="Margen neto objetivo (%)"><Input type="number" step="0.5" value={c.targetMarginPct} onChange={(v) => setCompany({ targetMarginPct: v })} /></Field>
            <Field label="Notas internas" className="sm:col-span-2"><Textarea rows={2} value={c.notes} onChange={(v) => setCompany({ notes: v })} /></Field>
          </div>
          <Alert tone="info" className="mt-4">
            Estos datos se usan para generar facturas, contratos y el encabezado de los modelos tributarios. Operando como particular, indica tu nombre y NIF: es lo que irá en el contrato de compraventa.
          </Alert>
        </Card>
      )}

      {tab === 'fiscal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Situación fiscal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Forma jurídica" hint="Determina IRPF o Impuesto sobre Sociedades">
                <Select
                  value={c.legalForm}
                  onChange={(v) => setCompany({ legalForm: v })}
                  options={[
                    { value: 'particular', label: 'Particular (ganancia patrimonial en el IRPF)' },
                    { value: 'autonomo', label: 'Autónomo (actividad económica)' },
                    { value: 'sl', label: 'Sociedad Limitada' },
                  ]}
                />
              </Field>
              <Field label="Régimen de IVA" hint="REBU es el habitual en compraventa de usados">
                <Select
                  value={c.vatRegime}
                  onChange={(v) => setCompany({ vatRegime: v })}
                  options={[
                    { value: 'rebu', label: 'REBU — 21 % sobre el margen' },
                    { value: 'general', label: 'Régimen general — 21 % sobre el precio' },
                  ]}
                />
              </Field>
              <Field label="Cifra de negocio anual estimada" hint="Determina si aplicas tipo reducido de IS">
                <Money value={c.turnover} onChange={(v) => setCompany({ turnover: v })} />
              </Field>
              <Field label="Cuota de autónomo mensual" hint="Solo si eres autónomo: entra en el calendario fiscal">
                <Money value={c.fiscal?.monthlyQuota} onChange={(v) => setCompany({ fiscal: { ...c.fiscal, monthlyQuota: v } })} />
              </Field>
            </div>
            <div className="mt-3">
              <Checkbox
                checked={!!c.fiscal?.tarifaPlana}
                onChange={(v) => setCompany({ fiscal: { ...c.fiscal, tarifaPlana: v } })}
                label="Tengo derecho a la tarifa plana de nuevos autónomos"
                hint={`${eur(RETA_2026.tarifaPlana)}/mes durante los primeros 12 meses`}
              />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Estimador de cuota de autónomo</h3>
            <Field label="Rendimiento neto mensual estimado"><Money value={monthly} onChange={setMonthly} /></Field>
            <div className="mt-3">
              <KeyValueGrid
                cols={2}
                items={[
                  { label: 'Tramo', value: reta.tramo },
                  { label: 'Cuota estimada', value: `${eur(reta.cuota)}/mes`, tone: 'amber' },
                  { label: 'Base de cotización', value: reta.base ? eur(reta.base) : '—' },
                  { label: 'Coste anual', value: eur(Number(reta.cuota) * 12) },
                ]}
              />
            </div>
            <Alert tone="warn" className="mt-3">
              <b>Estimación.</b> Los tramos de rendimiento neto de 2026 están publicados, pero el tipo de cotización definitivo y la cuota exacta de cada tramo los fija la TGSS y varían según la base elegida. Comprueba tu cuota real en el simulador de la Seguridad Social antes de presupuestarla.
            </Alert>
            <div className="mt-4 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white mb-2">Tipos aplicados</h4>
              {c.legalForm === 'sl' ? (
                <>
                  <Row label="IS tipo general" value={`${numEs(IS_2026.general * 100, 0)} %`} />
                  <Row label="IS entidad de reducida dimensión" value={`${numEs(IS_2026.reducida.rate * 100, 0)} %`} hint={`Cifra de negocios < ${eur0(IS_2026.reducida.maxTurnover)}`} />
                  <Row label="IS microempresa" value={`${numEs(IS_2026.microempresa.rateFirst * 100, 0)} % + ${numEs(IS_2026.microempresa.rateRest * 100, 0)} %`} hint={`Primeros ${eur0(IS_2026.microempresa.first)} al ${numEs(IS_2026.microempresa.rateFirst * 100, 0)} %`} />
                </>
              ) : (
                <>
                  <Row label="Base del ahorro (ganancias)" value={`${numEs(IRPF_SAVINGS[0].rate * 100, 0)} % – ${numEs(IRPF_SAVINGS[IRPF_SAVINGS.length - 1].rate * 100, 0)} %`} hint="Estatal, vigente desde la Ley 7/2024" />
                  <Row label="Mínimo personal" value={eur(5550)} />
                  {c.legalForm === 'autonomo' && <Row label="Pago fraccionado (Modelo 130)" value="20 % del rendimiento neto" />}
                </>
              )}
              <Row label="ITP Galicia" value={`${numEs(ITP_GALICIA.rate * 100, 0)} %`} hint={`${ITP_GALICIA.model} · ${ITP_GALICIA.agency}`} />
            </div>
          </Card>

          <Card className="p-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-3">Escala del IRPF aplicada a la base general</h3>
            <Alert tone="warn" className="mb-3">
              La escala autonómica gallega completa no está publicada de forma agregada en ninguna fuente oficial consultada, así que la aplicación usa la <b>escala estatal duplicada</b> como aproximación (18,5 % – 46,5 %). El primer tramo gallego es del 9,0 % (medio punto menos que el estatal) y el último del 22,5 %, pero los tramos intermedios no se pueden verificar. Revisa el resultado con tu asesor antes de declararlo.
            </Alert>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {IRPF_GENERAL_COMBINED.map((b, i) => (
                <div key={i} className="rounded-lg border border-slate-800 px-2.5 py-2">
                  <p className="text-[10px] text-slate-500">Hasta {b.to === Infinity ? '∞' : eur0(b.to)}</p>
                  <p className="text-sm font-bold text-white tabular-nums">{numEs(b.rate * 100, 1)} %</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'tarifas' && (
        <div className="space-y-4">
          <Alert tone="info">
            Estas son las tarifas verificadas del ejercicio <b>{RATES_YEAR}</b> que usa la aplicación. Puedes ajustar cualquiera (por ejemplo, el precio real que te cobra tu gestoría o tu estación de ITV) y todos los cálculos se recalcularán al momento.
            {overridden.length > 0 && <> <b>Tienes {overridden.length} valores personalizados.</b></>}
          </Alert>
          {overridden.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {overridden.map((k) => (
                <button key={k} onClick={() => setCompany({ tariffs: Object.fromEntries(Object.entries(c.tariffs).filter(([kk]) => kk !== k)) })} className="text-[11px] px-2 py-1 rounded-md border border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                  {k}: {eur0(c.tariffs[k])} → volver a {eur0(DEFAULT_TARIFFS[k])}
                </button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setCompany({ tariffs: {} })}>Restaurar todas</Button>
            </div>
          )}
          {tariffGroups.map((g) => (
            <Card key={g.title} className="p-4">
              <h3 className="text-sm font-bold text-white mb-3">{g.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map((it) => (
                  <Field key={it.key} label={it.label} hint={Number(tariffs[it.key]) !== Number(DEFAULT_TARIFFS[it.key]) ? `Por defecto: ${eur(DEFAULT_TARIFFS[it.key])}` : undefined}>
                    <Money
                      value={Number(tariffs[it.key])}
                      onChange={(v) => setCompany({ tariffs: { ...(c.tariffs || {}), [it.key]: v } })}
                    />
                  </Field>
                ))}
              </div>
            </Card>
          ))}
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Tramos del Impuesto de Matriculación (art. 70 Ley 38/1992)</h3>
            {IEDMT_BRACKETS.map((b) => (
              <Row key={b.epigrafe || b.label} label={`${b.label} · epígrafe ${b.epigrafe}`} value={`${numEs(b.rate * 100, 2)} %`} tone={b.rate === 0 ? 'emerald' : 'default'} />
            ))}
            <Alert tone="info" className="mt-3">
              Con CO₂ ≤ 120 g/km la cuota es 0 y no se presenta el Modelo 576, sino el Modelo 06 de no sujeción. La base es el valor del vehículo según la Orden anual de precios medios (minorando IVA e IEDMT) o, si es mayor, el precio de factura.
            </Alert>
          </Card>
        </div>
      )}

      {tab === 'datos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Almacenamiento</h3>
            </div>
            <KeyValueGrid
              cols={2}
              items={[
                { label: 'Vehículos', value: state.vehicles.length },
                { label: 'Contactos', value: state.contacts.length },
                { label: 'Gastos', value: state.expenses.length },
                { label: 'Modelos presentados', value: state.filings.length },
                { label: 'Tareas', value: state.tasks.length },
                { label: 'Registro de actividad', value: (state.activity || []).length },
              ]}
            />
            {isCloud ? (
              <Alert tone="ok" className="mt-4">
                Los datos se guardan en la <b>nube (Supabase, servidores en la UE)</b> y se comparten entre todos tus dispositivos y usuarios de la empresa. Aun así, descarga un respaldo JSON de vez en cuando: es tu copia independiente del proveedor.
              </Alert>
            ) : (
              <Alert tone="warn" className="mt-4">
                Los datos se guardan <b>solo en este navegador</b> (IndexedDB, con copia en localStorage). No hay servidor: si borras los datos del navegador o cambias de equipo, se pierden. Exporta un respaldo JSON con regularidad.
              </Alert>
            )}
            {isCloud && !can('data') && (
              <Alert tone="info" className="mt-3">Restaurar, cargar ejemplos y borrar todo están reservados al rol <b>Propietario</b>. Tu rol actual: <b>{roleLabel(role)}</b>.</Alert>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button icon={Download} onClick={exportJson}>Descargar respaldo</Button>
              <label className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 text-sm px-3.5 py-2 cursor-pointer">
                <Upload className="w-4 h-4" /> Restaurar desde archivo
                <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
              </label>
              {hasDemo
                ? <Button variant="secondary" icon={RotateCcw} onClick={async () => { await removeDemo(); toast('Datos de ejemplo quitados'); }}>Quitar datos de ejemplo</Button>
                : <Button variant="secondary" icon={Database} onClick={() => { loadDemo(); toast('Datos de ejemplo cargados'); }}>Cargar datos de ejemplo</Button>}
              <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Borrar todo</Button>
            </div>
          </Card>
          {isCloud && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Cuenta y equipo</h3>
              </div>
              <KeyValueGrid
                cols={2}
                items={[
                  { label: 'Usuario', value: auth?.user?.email || '—' },
                  { label: 'Tu rol', value: roleLabel(role) },
                  { label: 'Empresa', value: auth?.current?.org_name || c.name || '—' },
                  { label: 'Identificador', value: <span className="font-mono text-[10px]">{auth?.orgId || '—'}</span> },
                ]}
              />
              <p className="text-[11px] text-slate-500 mt-3 mb-2">Roles disponibles (la gestión de invitaciones desde la app llegará en la Fase 2; hoy se hace desde la tabla <code>invitations</code> de Supabase):</p>
              <div className="space-y-1.5">
                {Object.entries(ROLES).map(([id, r]) => (
                  <div key={id} className="flex items-start gap-2 text-xs">
                    <Badge tone={id === role ? 'amber' : 'slate'}>{r.label}</Badge>
                    <span className="text-slate-400">{r.description}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Pegar un respaldo</h3>
            <Textarea rows={8} value={importText} onChange={setImportText} placeholder='{"schema":2,"company":{...},"vehicles":[...]}' />
            <Button
              className="mt-3"
              disabled={!importText.trim()}
              onClick={() => {
                try {
                  replaceAll(JSON.parse(importText));
                  setImportText('');
                  toast('Datos importados');
                } catch (e) {
                  toast(`JSON no válido: ${e.message}`, 'error');
                }
              }}
            >
              Importar texto
            </Button>
          </Card>
        </div>
      )}

      {tab === 'fuentes' && (
        <div className="space-y-4">
          <Alert tone="info">
            Cada cifra de la aplicación está marcada internamente como <b>[V] verificada</b> (fuente oficial o tarifa publicada) o <b>[E] estimada</b> (aproximación que debes confirmar). Aquí tienes las fuentes de las verificadas.
          </Alert>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Normativa y fuentes consultadas ({RATES_YEAR})</h3>
            </div>
            <div className="space-y-2">
              {SOURCES.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-xs text-slate-300 hover:text-amber-300 py-1.5 border-b border-slate-800/60 last:border-0">
                  <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500" />
                  <span>{s.label}</span>
                </a>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Cifras que debes verificar antes de usarlas en una declaración</h3>
            </div>
            <div className="space-y-2">
              {[
                ['Cuotas de autónomo por tramo', 'Los tramos de 2026 están publicados, pero la cuota exacta y el tipo de cotización los fija la TGSS.'],
                ['Escala autonómica gallega del IRPF', 'Solo están verificados el primer (9,0 %) y el último (22,5 %) tramo.'],
                ['Bonificación del ITP gallego para vehículos eléctricos', 'No confirmada contra el texto vigente del D. Leg. 1/2011.'],
                ['Precio medio del vehículo nuevo (valor venal)', 'Depende de la Orden anual de precios medios vigente en el momento del devengo.'],
                ['Bonificaciones del IVTM de A Coruña', 'Según la Ordenanza Fiscal nº 52: 60 % para vehículos de bajas emisiones, no acumulables.'],
              ].map(([t, d]) => (
                <div key={t} className="flex items-start gap-2 py-1.5 border-b border-slate-800/60 last:border-0">
                  <Badge tone="amber">Verificar</Badge>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{t}</p>
                    <p className="text-[11px] text-slate-500">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetData();
          toast('Todos los datos se han borrado');
        }}
        title="Borrar todos los datos"
        message={isCloud
          ? 'Se eliminarán de la nube vehículos, contactos, gastos, facturas, modelos presentados, tareas y fotos de tu empresa, para todos los usuarios. Esta acción no se puede deshacer: exporta antes un respaldo JSON si quieres conservarlos.'
          : 'Se eliminarán vehículos, contactos, gastos, modelos presentados y tareas de este navegador. Esta acción no se puede deshacer: exporta antes un respaldo JSON si quieres conservarlos.'}
      />
    </div>
  );
}

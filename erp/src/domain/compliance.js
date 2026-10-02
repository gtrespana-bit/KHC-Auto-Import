// ============================================================================
//  CUMPLIMIENTO — calendario fiscal, avisos y control documental
// ----------------------------------------------------------------------------
//  El calendario se genera a partir de los datos reales (vehículos, ventas,
//  gastos y régimen de la empresa). Cada línea lleva su modelo, su base, su
//  importe y su plazo legal. El estado (pendiente / presentado) se guarda en
//  la colección `filings`.
// ============================================================================
import { calcSaleVat, calcIrpfGain, calcIs, calcReta, calcModelo130, landingCost } from './taxes.js';
import { vehiclePnl, isSold, isInStock, daysInStock } from './finance.js';
import { quarterOf, addDays, round2, dateEs } from '../lib/format.js';

const n2 = (v) => round2(v);
import { IVTM_PERIOD, RETA_2026, ITP_GALICIA } from './rates.js';

export const QUARTER_DEADLINES = { 1: '04-20', 2: '07-20', 3: '10-20', 4: null }; // el 4T se presenta en enero

const quarterEnd = (year, q) => `${year}-${['03-31', '06-30', '09-30', '12-31'][q - 1]}`;

export function nextDeadline(year, q) {
  if (q < 4) return `${year}-${QUARTER_DEADLINES[q]}`;
  return `${year + 1}-01-30`;
}

export function monthsInQuarter(q) {
  return [`${q * 3 - 2}`, `${q * 3 - 1}`, `${q * 3}`].map((m) => `${m}`.padStart(2, '0'));
}

function inQuarter(iso, year, q) {
  if (!iso || String(iso).slice(0, 4) !== String(year)) return false;
  return quarterOf(iso) === q;
}

/**
 * Calendario fiscal completo de un ejercicio.
 */
export function buildTaxCalendar({ company, vehicles = [], expenses = [], year, tariffs }) {
  const y = Number(year) || new Date().getFullYear();
  const isBusiness = company.legalForm === 'autonomo' || company.legalForm === 'sl';
  const rebu = company.vatRegime === 'rebu';
  const rows = [];
  const add = (row) => rows.push({ status: 'pendiente', amount: 0, base: 0, ...row, id: row.id });
  // Obligación ligada a un vehículo: ya contabilizada en su coste.
  const addVehicleRow = (row) => add({ status: 'registrado', ...row });

  // --- Impuestos ligados a cada vehículo --------------------------------
  vehicles.forEach((v) => {
    const label = `${v.brand || ''} ${v.model || ''} ${v.version || ''}`.trim();
    const reg = v.registrationDate;
    // Estos importes salen de `v.costs`, es decir, ya están contabilizados en el
    // vehículo: no son pagos futuros, sino obligaciones ya registradas.
    if (n2(v.costs?.iedmt) > 0) {
      addVehicleRow({
        id: `576-${v.id}`, model: '576', label: `IEDMT — ${label}`, kind: 'vehiculo', vehicleId: v.id,
        base: n2(v.costs?.iedmt), amount: n2(v.costs?.iedmt),
        deadline: reg ? addDays(reg, -1) : v.purchaseDate || v.createdAt,
        note: 'Se presenta antes de matricular. Base: tablas de Hacienda o precio de factura.',
      });
    } else if (v.co2 && v.co2 <= 120 && reg) {
      addVehicleRow({
        id: `06-${v.id}`, model: '06', label: `Exención IEDMT — ${label}`, kind: 'vehiculo', vehicleId: v.id,
        amount: 0, deadline: reg, note: 'Vehículo exento (≤ 120 g/km): se presenta el Modelo 06 de no sujeción.',
      });
    }
    if (n2(v.costs?.itp) > 0) {
      addVehicleRow({
        id: `620-${v.id}`, model: '620', label: `ITP 8 % — ${label}`, kind: 'vehiculo', vehicleId: v.id,
        base: n2(v.costs?.itp) / (ITP_GALICIA.rate || 0.08), amount: n2(v.costs?.itp),
        deadline: addDays(v.purchaseDate || v.createdAt, 30),
        note: 'Compra a particular. Autoliquidación ante la ATRIGA en el plazo de un mes.',
      });
    }
    if (n2(v.costs?.vatPurchase) > 0) {
      addVehicleRow({
        id: `309-${v.id}`, model: isBusiness ? '303 + 349' : '309',
        label: `${isBusiness ? 'IVA adquisición intracomunitaria' : 'IVA importación'} — ${label}`,
        kind: 'vehiculo', vehicleId: v.id, amount: n2(v.costs?.vatPurchase),
        deadline: nextDeadline(y, quarterOf(v.purchaseDate || v.createdAt) || 1),
        note: isBusiness
          ? 'Autoliquidado y deducido en el 303 del trimestre; la operación se declara en el 349.'
          : 'Particular que compra a profesional de la UE: ingreso mediante Modelo 309.',
      });
    }
    if (n2(v.costs?.ivtm) > 0) {
      addVehicleRow({
        id: `ivtm-${v.id}`, model: 'IVTM', label: `Impuesto de circulación — ${label}`, kind: 'vehiculo',
        vehicleId: v.id, amount: n2(v.costs?.ivtm),
        deadline: IVTM_PERIOD.end,
        note: `Alta prorrateada por trimestres. Periodo voluntario ${dateEs(IVTM_PERIOD.start)} – ${dateEs(IVTM_PERIOD.end)}.`,
      });
    }
  });

  // --- IVA trimestral ----------------------------------------------------
  if (isBusiness) {
    [1, 2, 3, 4].forEach((q) => {
      let output = 0;
      let input = 0;
      let marginBase = 0;
      vehicles.forEach((v) => {
        const date = v.sale?.date || v.saleDate;
        if (!isSold(v) || !inQuarter(date, y, q)) return;
        const p = vehiclePnl(v, { regime: rebu ? 'rebu' : 'general', tariffs });
        output += p.vat;
        // En REBU la base es el margen BRUTO fiscal (precio de venta − precio de
        // compra del bien), no el resultado contable después de gastos.
        marginBase += round2(p.price - p.purchaseCost);
      });
      expenses.forEach((e) => {
        if (!inQuarter(e.date, y, q)) return;
        const vat = Number(e.vatDeductible) || 0;
        input += vat;
      });
      vehicles.forEach((v) => {
        if (!inQuarter(v.purchaseDate, y, q)) return;
        if (v.sellerType === 'national_dealer' && isBusiness) input += n2(v.costs?.vatPurchase);
      });
      const due = round2(output - input);
      if (output === 0 && input === 0) return;
      add({
        id: `303-${y}-T${q}`, model: '303', kind: 'periodico',
        label: `IVA ${q}T ${y}${rebu ? ' (REBU sobre margen)' : ''}`,
        base: round2(marginBase), amount: due,
        deadline: nextDeadline(y, q),
        note: rebu
          ? `REBU: base = margen bruto del trimestre (ventas − precio de compra de los bienes) = ${round2(marginBase)} €; se repercute el 21 % de esa base menos el IVA soportado deducible.`
          : 'Régimen general: IVA repercutido menos IVA soportado.',
      });
      add({
        id: `349-${y}-T${q}`, model: '349', kind: 'periodico',
        label: `Declaración recapitulativa operaciones intracomunitarias ${q}T ${y}`,
        amount: 0, deadline: nextDeadline(y, q),
        note: 'Obligatoria si has comprado o vendido a empresarios de otros países de la UE.',
      });
    });
    add({
      id: `390-${y}`, model: '390', kind: 'periodico', label: `Resumen anual de IVA ${y}`,
      amount: 0, deadline: `${y + 1}-01-30`, note: 'Declaración informativa anual que resume los cuatro 303.',
    });
  }

  // --- Pagos fraccionados / cuotas --------------------------------------
  if (company.legalForm === 'autonomo') {
    [1, 2, 3, 4].forEach((q) => {
      const revenue = vehicles.reduce((a, v) => {
        const date = v.sale?.date || v.saleDate;
        return isSold(v) && inQuarter(date, y, q) ? a + (v.sale?.price || v.actualSalePrice || 0) : a;
      }, 0);
      const cost = vehicles.reduce((a, v) => {
        const date = v.sale?.date || v.saleDate;
        return isSold(v) && inQuarter(date, y, q) ? a + landingCost(v, tariffs).total : a;
      }, 0);
      const fixed = expenses
        .filter((e) => inQuarter(e.date, y, q))
        .reduce((a, e) => a + n2(e.amount), 0);
      const net = round2(revenue - cost - fixed);
      add({
        id: `130-${y}-T${q}`, model: '130', kind: 'periodico',
        label: `Pago fraccionado IRPF ${q}T ${y}`, base: net, amount: calcModelo130(net),
        deadline: nextDeadline(y, q),
        note: '20 % del rendimiento neto acumulado del ejercicio (ingresos − gastos).',
      });
    });
    const monthlyNet = company.fiscal?.monthlyQuota ? 0 : null;
    if (n2(company.fiscal?.monthlyQuota) > 0) {
      add({
        id: `reta-${y}`, model: 'RETA', kind: 'periodico',
        label: `Cuota de autónomo ${y} (${n2(company.fiscal.monthlyQuota)} €/mes)`,
        amount: round2(n2(company.fiscal.monthlyQuota) * 12),
        deadline: `${y}-12-31`,
        note: RETA_2026.note,
      });
    }
  }

  if (company.legalForm === 'sl') {
    const base = round2(
      vehicles.filter((v) => isSold(v) && String(v.sale?.date || v.saleDate || '').startsWith(String(y)))
        .reduce((a, v) => a + vehiclePnl(v, { regime: rebu ? 'rebu' : 'general', tariffs }).net, 0)
      - expenses.filter((e) => String(e.date || '').startsWith(String(y))).reduce((a, e) => a + n2(e.amount), 0),
    );
    const is = calcIs(base, Number(company.turnover) || 0);
    [[1, '04-20'], [2, '10-20'], [3, '12-20']].forEach(([n, md]) => {
      add({
        id: `202-${y}-${n}`, model: '202', kind: 'periodico',
        label: `Pago fraccionado IS ${n}º ${y}`, base, amount: round2(Math.max(0, base) * 0.18),
        deadline: `${y}-${md}`, note: '18 % de la base (régimen general) sobre el resultado del ejercicio en curso.',
      });
    });
    add({
      id: `200-${y}`, model: '200', kind: 'periodico', label: `Impuesto sobre Sociedades ${y}`,
      base, amount: is.tax, deadline: `${y + 1}-07-25`,
      note: `Régimen aplicable: ${is.regime}.`,
    });
  }

  if (company.legalForm === 'particular' || company.legalForm === 'autonomo') {
    const gains = vehicles
      .filter((v) => isSold(v) && String(v.sale?.date || v.saleDate || '').startsWith(String(y)))
      .reduce((a, v) => a + vehiclePnl(v, { regime: rebu ? 'rebu' : 'general', tariffs }).gross, 0);
    const gain = company.legalForm === 'particular' ? round2(gains) : 0;
    if (company.legalForm === 'particular') {
      add({
        id: `renta-${y}`, model: '100', kind: 'periodico', label: `Declaración de la Renta ${y} (ganancias patrimoniales)`,
        base: gain, amount: calcIrpfGain(gain).tax, deadline: `${y + 1}-06-30`,
        note: 'Ganancia patrimonial integrada en la base del ahorro (19 % – 30 %). Se compensa con pérdidas de los 4 años anteriores.',
      });
    }
  }

  return rows.sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)));
}

/** Aplica el estado guardado (presentado / pagado) al calendario calculado. */
export function applyFilingStatus(calendar = [], filings = []) {
  const map = new Map((filings || []).map((f) => [f.id, f]));
  return calendar.map((row) => {
    const saved = map.get(row.id);
    return saved ? { ...row, status: saved.status || row.status, filedAt: saved.filedAt, paidAmount: saved.paidAmount ?? row.amount } : row;
  });
}

// ---------------------------------------------------------------------------
//  CONTROL DOCUMENTAL
// ---------------------------------------------------------------------------
export const DOCUMENT_CHECKLIST = [
  { key: 'teil1', label: 'Permiso de circulación parte I (Teil I / carte grise)', required: true },
  { key: 'teil2', label: 'Permiso de circulación parte II o título de propiedad', required: true },
  { key: 'invoice', label: 'Factura o contrato de compra firmado', required: true },
  { key: 'coc', label: 'Certificado de Conformidad (COC) o ficha reducida', required: true },
  { key: 'serviceBook', label: 'Libro de revisiones / historial de mantenimiento', required: false },
  { key: 'keys', label: 'Dos llaves', required: false },
  { key: 'itv', label: 'ITV de importación superada', required: true },
  { key: 'model576', label: 'Modelo 576 (o 06) presentado y pagado', required: true },
  { key: 'itp', label: 'Modelo 620 ITP liquidado (si procede)', required: false },
  { key: 'dgt', label: 'Matriculado en la DGT (permiso español)', required: true },
  { key: 'insurance', label: 'Seguro contratado', required: true },
  { key: 'contract', label: 'Contrato de venta firmado con el comprador', required: false },
  { key: 'invoiceOut', label: 'Factura de venta emitida (con mención REBU si aplica)', required: false },
  { key: 'warranty', label: 'Garantía entregada al comprador', required: false },
  { key: 'transfer', label: 'Cambio de titularidad presentado (Tasa 1.5)', required: false },
];

export function documentProgress(vehicle = {}) {
  const docs = vehicle.documents || {};
  const done = DOCUMENT_CHECKLIST.filter((d) => docs[d.key]).length;
  const missingRequired = DOCUMENT_CHECKLIST.filter((d) => d.required && !docs[d.key]);
  return { done, total: DOCUMENT_CHECKLIST.length, pct: (done / DOCUMENT_CHECKLIST.length) * 100, missingRequired };
}

// ---------------------------------------------------------------------------
//  AVISOS OPERATIVOS
// ---------------------------------------------------------------------------
export function buildAlerts({ state, tariffs }) {
  const { vehicles = [], tasks = [], company } = state;
  const alerts = [];
  const today = new Date();

  vehicles.filter(isInStock).forEach((v) => {
    const days = daysInStock(v);
    const limit = v.rotationDays || 60;
    if (days > limit) {
      alerts.push({
        id: `aging-${v.id}`, level: 'warn', title: 'Stock envejecido',
        text: `${v.brand} ${v.model} lleva ${days} días en stock (objetivo ${limit}). Cada mes inmovilizado cuesta dinero: revisa precio o promoción.`,
        view: 'fleet', vehicleId: v.id,
      });
    }
    const { missingRequired } = documentProgress(v);
    if (missingRequired.length && ['comprado', 'transito', 'tramites', 'preparacion', 'disponible', 'reservado'].includes(v.status)) {
      alerts.push({
        id: `docs-${v.id}`, level: missingRequired.some((d) => d.key === 'dgt' || d.key === 'model576') ? 'danger' : 'info',
        title: 'Documentación pendiente',
        text: `${v.brand} ${v.model}: falta ${missingRequired.map((d) => d.label).join(', ')}.`,
        view: 'fleet', vehicleId: v.id,
      });
    }
    if (v.itvDue && new Date(v.itvDue) < today) {
      alerts.push({ id: `itv-${v.id}`, level: 'danger', title: 'ITV caducada', text: `${v.brand} ${v.model}: ITV vencida el ${dateEs(v.itvDue)}.`, view: 'fleet', vehicleId: v.id });
    }
    if (v.insuranceDue && new Date(v.insuranceDue) < today) {
      alerts.push({ id: `ins-${v.id}`, level: 'warn', title: 'Seguro de stock vencido', text: `${v.brand} ${v.model}: seguro vencido el ${dateEs(v.insuranceDue)}.`, view: 'fleet', vehicleId: v.id });
    }
    if (v.status === 'reservado' && v.sale?.depositDate && daysInStock(v) > 15) {
      alerts.push({ id: `dep-${v.id}`, level: 'info', title: 'Señal antigua', text: `${v.brand} ${v.model} reservado desde ${dateEs(v.sale.depositDate)}: confirma la firma del contrato.`, view: 'fleet', vehicleId: v.id });
    }
  });

  vehicles.filter((v) => isSold(v) && v.sale?.status === 'firmado').forEach((v) => {
    alerts.push({ id: `cobro-${v.id}`, level: 'warn', title: 'Cobro pendiente', text: `${v.brand} ${v.model}: contrato firmado, falta el cobro de ${v.sale.price - (v.sale.deposit || 0)} €.`, view: 'fleet', vehicleId: v.id });
  });

  tasks.filter((t) => !t.done && t.status !== 'done' && (t.due || t.dueDate) && new Date(t.due || t.dueDate) <= today).forEach((t) => {
    alerts.push({ id: `task-${t.id}`, level: 'danger', title: 'Tarea vencida', text: t.title, view: 'tasks' });
  });

  if (!company.name) {
    alerts.push({ id: 'company', level: 'info', title: 'Completa los datos de tu empresa', text: 'En Ajustes → Empresa define tu NIF, domicilio y régimen fiscal para que las facturas, contratos y modelos se generen correctos.', view: 'settings' });
  }

  return alerts;
}

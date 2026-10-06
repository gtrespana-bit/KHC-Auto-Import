// ============================================================================
//  CUMPLIMIENTO — calendario fiscal, avisos y control documental
// ----------------------------------------------------------------------------
//  El calendario se genera a partir de los datos reales (vehículos, ventas,
//  gastos y régimen de la empresa). Cada línea lleva su modelo, su base, su
//  importe y su plazo legal. El estado (pendiente / presentado) se guarda en
//  la colección `filings`.
// ============================================================================
import { calcIrpfGain, calcIs, calcReta, calcPurchaseTax, calcIedmt } from './taxes.js';
import { vehiclePnl, isSold, isInStock, daysInStock } from './finance.js';
import { quarterOf, addDays, round2, dateEs, numEs, eur } from '../lib/format.js';

const n2 = (v) => round2(v);
import { IVTM_PERIOD, RETA_2026 } from './rates.js';

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
  const companyRegime = rebu ? 'rebu' : 'general';
  const refDate = new Date();
  /** Impuesto de la compra de un vehículo, con la misma lógica que el motor. */
  const purchaseTaxOf = (v) => calcPurchaseTax({
    sellerType: v.sellerType,
    priceNet: n2(v.costs?.purchase ?? v.purchasePrice),
    firstRegDate: v.firstRegDate || (v.year ? `${v.year}-01-01` : null),
    km: v.km,
    newPrice: n2(v.newPrice),
    buyerIsBusiness: isBusiness,
    cc: v.cc,
    badge: v.environmentalBadge || v.badge,
    itpExemption: !!v.itpExemption,
    refDate,
  });
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
    const pt = purchaseTaxOf(v);

    if (n2(v.costs?.iedmt) > 0) {
      const iedmt = calcIedmt({ co2: n2(v.co2), method: v.taxMethod || 'tablas', purchasePrice: n2(v.costs?.purchase), newPrice: n2(v.newPrice), firstRegDate: v.firstRegDate || (v.year ? `${v.year}-01-01` : null), refDate });
      addVehicleRow({
        id: `576-${v.id}`, model: '576', label: `IEDMT — ${label}`, kind: 'vehiculo', vehicleId: v.id,
        base: iedmt.base || n2(v.costs?.iedmt), amount: n2(v.costs?.iedmt),
        deadline: reg ? addDays(reg, -1) : v.purchaseDate || v.createdAt,
        note: `Se presenta antes de matricular. Base ${eur(iedmt.base)} (tablas de Hacienda) y cuota ${eur(n2(v.costs?.iedmt))}.`,
      });
    } else if (v.iedmtExemption) {
      addVehicleRow({
        id: `06-${v.id}`, model: '06', label: `Exención / no sujeción IEDMT — ${label}`, kind: 'vehiculo', vehicleId: v.id,
        amount: 0, deadline: reg || v.purchaseDate || v.createdAt,
        note: 'Exención o no sujeción legal sin reconocimiento previo: Modelo 06 (3 ejemplares) antes de matricular.',
      });
    } else if (n2(v.co2) > 0 && n2(v.co2) <= 120 && reg) {
      const iedmtCero = calcIedmt({ co2: n2(v.co2), method: v.taxMethod || 'tablas', purchasePrice: n2(v.costs?.purchase), newPrice: n2(v.newPrice), firstRegDate: v.firstRegDate || (v.year ? `${v.year}-01-01` : null), refDate });
      addVehicleRow({
        id: `576-${v.id}`, model: '576', label: `IEDMT 0 % (cuota cero) — ${label}`, kind: 'vehiculo', vehicleId: v.id,
        base: iedmtCero.base, amount: 0, deadline: addDays(reg, -1),
        note: 'CO₂ ≤ 120 g/km: tipo 0 %, no exención. Se presenta el Modelo 576 con cuota cero (el Modelo 06 se reserva a las exenciones y no sujeciones legales).',
      });
    }

    if (pt.kind === 'itp') {
      const tipoTxt = pt.exempt ? '' : ` ${numEs((pt.rate || 0) * 100, 2)} %`;
      addVehicleRow({
        id: `620-${v.id}`, model: '620',
        label: pt.exempt ? `ITP exento por reventa (cuota 0) — ${label}` : `ITP${tipoTxt} — ${label}`,
        kind: 'vehiculo', vehicleId: v.id, base: pt.base, amount: pt.exempt ? 0 : n2(v.costs?.itp) || pt.amount,
        deadline: addDays(v.purchaseDate || v.createdAt, 30),
        note: pt.exempt
          ? 'Exención provisional del revendedor (art. 45.I.B).17 TRLITPAJD). Se presenta el 620 con cuota cero y se eleva a definitiva si vendes el vehículo en el año.'
          : `Compra a particular. Base: mayor entre el precio y el valor de tablas. Autoliquidación ante la ATRIGA en el plazo de un mes.`,
      });
    }

    if (pt.kind === 'aib' && isBusiness) {
      addVehicleRow({
        id: `aib-${v.id}`, model: '303 + 349', label: `IVA autoliquidado (AIB) — ${label}`, kind: 'vehiculo', vehicleId: v.id,
        base: pt.base, amount: 0, deadline: nextDeadline(y, quarterOf(v.purchaseDate || v.createdAt) || 1),
        note: `Adquisición intracomunitaria: ${eur(pt.amount)} devengados en las casillas 10/11 y deducidos en las 36/37 del 303 del trimestre (efecto en caja 0 €). Se declara en el 349 con clave A.`,
      });
    } else if (pt.kind === 'iva') {
      addVehicleRow({
        id: `309-${v.id}`, model: '309', label: `IVA de la compra (Modelo 309) — ${label}`,
        kind: 'vehiculo', vehicleId: v.id, base: pt.base, amount: n2(v.costs?.vatPurchase) || pt.amount,
        deadline: nextDeadline(y, quarterOf(v.purchaseDate || v.createdAt) || 1),
        note: isBusiness
          ? 'La operación no es una AIB (vendedor no empresario y vehículo nuevo a efectos de IVA): el IVA se ingresa con el Modelo 309.'
          : 'Particular que compra a un profesional de la UE: ingreso mediante Modelo 309 antes de matricular.',
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
    let cumNet = 0;
    let cumFixed = 0;
    let cumPaid130 = 0;
    [1, 2, 3, 4].forEach((q) => {
      let output = 0;
      let input = 0;
      let marginBase = 0;
      let aibBase = 0;
      let aibVat = 0;
      let exemptBase = 0;
      const intraOps = [];
      let revenueNet = 0;
      let costOfSales = 0;

      vehicles.forEach((v) => {
        const date = v.sale?.date || v.saleDate;
        if (isSold(v) && inQuarter(date, y, q)) {
          const p = vehiclePnl(v, { regime: companyRegime, tariffs });
          output += p.vat;
          revenueNet += round2(p.price - p.vat);
          costOfSales += p.cost.total;
          // En REBU la base es el margen BRUTO fiscal (precio de venta − precio
          // de compra del bien), no el resultado contable después de gastos.
          if (p.vatRegime === 'rebu') marginBase += round2(p.price - p.marginPurchase);
          if (p.vatRegime === 'intra_exempt') {
            exemptBase += p.price;
            intraOps.push({ clave: 'E', base: p.price, side: 'entrega' });
          }
        }
        // IVA de las compras del trimestre: la AIB se devenga y se deduce en
        // el mismo 303 (casillas 10/11 y 36/37); la factura nacional con IVA
        // deducible (pro_es) entra directamente como soportado.
        if (inQuarter(v.purchaseDate, y, q)) {
          const pt = purchaseTaxOf(v);
          if (pt.kind === 'aib') {
            aibBase += pt.base;
            aibVat += pt.amount;
            input += pt.amount;
            intraOps.push({ clave: 'A', base: pt.base, side: 'adquisición' });
          } else if (pt.kind === 'iva_included' && pt.deductible) {
            input += pt.amount;
          }
        }
      });

      let fixedNet = 0;
      expenses.forEach((e) => {
        if (!inQuarter(e.date, y, q)) return;
        const vat = Number(e.vatDeductible) || 0;
        input += vat;
        fixedNet += round2(n2(e.amount) - vat);
      });

      const due = round2(output + aibVat - input);
      if (output === 0 && input === 0 && aibVat === 0 && exemptBase === 0) return;

      const casillas = [
        aibBase > 0 ? `casillas 10/11 por la AIB (base ${eur(aibBase)}, cuota ${eur(aibVat)}) y su deducción en las 36/37` : null,
        marginBase > 0 ? `base REBU del trimestre ${eur(marginBase)} (entregas de bienes usados; no se desglosa la cuota en la factura)` : null,
        exemptBase > 0 ? `entregas intracomunitarias exentas (art. 25 LIVA) por ${eur(exemptBase)} → casilla 59` : null,
      ].filter(Boolean).join('; ');
      add({
        id: `303-${y}-T${q}`, model: '303', kind: 'periodico',
        label: `IVA ${q}T ${y}${marginBase > 0 ? ' (REBU sobre margen)' : ''}`,
        base: round2(marginBase), amount: due,
        deadline: nextDeadline(y, q),
        note: `IVA devengado ${eur(output)}${aibVat ? ` + AIB ${eur(aibVat)}` : ''} − IVA deducible ${eur(input)}.${casillas ? ` Incluye: ${casillas}.` : ''}`,
      });

      // El 349 solo se presenta si hay operaciones intracomunitarias: las
      // compras a un revendedor en régimen de margen NO van al 349 (no son
      // adquisiciones intracomunitarias, art. 13.1º.b LIVA).
      if (aibBase > 0 || exemptBase > 0) {
        add({
          id: `349-${y}-T${q}`, model: '349', kind: 'periodico',
          label: `Declaración recapitulativa operaciones intracomunitarias ${q}T ${y}`,
          amount: 0, deadline: nextDeadline(y, q),
          note: `Solo operaciones intracomunitarias: ${intraOps.map((o) => `${o.clave} (${o.side}) ${eur(o.base)}`).join(' · ')}. Se declara por operador con su NIF-IVA validado en VIES. Las compras a revendedores en régimen de margen no se incluyen.`,
        });
      }

      // Base del pago fraccionado: rendimiento neto del trimestre, sin el IVA
      // (que no es ingreso ni gasto) y acumulado desde el 1 de enero.
      cumNet = round2(cumNet + round2(revenueNet - costOfSales));
      cumFixed = round2(cumFixed + fixedNet);
      if (company.legalForm === 'autonomo') {
        const net130 = round2(cumNet - cumFixed);
        const target130 = Math.max(0, round2(net130 * 0.2));
        const amount130 = Math.max(0, round2(target130 - cumPaid130));
        cumPaid130 = round2(cumPaid130 + amount130);
        if (net130 === 0 && amount130 === 0) return;
        add({
          id: `130-${y}-T${q}`, model: '130', kind: 'periodico',
          label: `Pago fraccionado IRPF ${q}T ${y}`, base: net130, amount: amount130,
          deadline: nextDeadline(y, q),
          note: `20 % del rendimiento neto acumulado del ejercicio hasta el trimestre (${eur(net130)}), neto de IVA y de gastos, menos los pagos ya realizados (${eur(cumPaid130 - amount130)}).`,
        });
      }
    });
    add({
      id: `390-${y}`, model: '390', kind: 'periodico', label: `Resumen anual de IVA ${y}`,
      amount: 0, deadline: `${y + 1}-01-30`, note: 'Declaración informativa anual que resume los cuatro 303.',
    });
  }

  // --- Pagos fraccionados / cuotas --------------------------------------
  // El Modelo 130 es cosa de autónomos, pero las bases ya se acumulan en el
  // bloque trimestral anterior para no declarar dos veces el mismo pago.
  if (company.legalForm === 'autonomo') {
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

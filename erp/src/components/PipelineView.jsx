import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Euro, 
  Fuel, 
  Gauge, 
  FileCheck, 
  ExternalLink,
  X,
  Printer,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { calculateVehicleSummary, formatEuro, formatEuroDetailed } from '../utils/calculations';

const STATUS_OPTIONS = [
  { id: 'all', label: 'Todos los Vehículos' },
  { id: 'prospect', label: 'Prospección' },
  { id: 'transit', label: 'En Tránsito a Coruña' },
  { id: 'paperwork', label: 'En ITV/DGT Coruña' },
  { id: 'available', label: 'En Stock / Venta' },
  { id: 'sold', label: 'Vendido' },
];

export default function PipelineView({ 
  vehicles, 
  onUpdateVehicle, 
  onDeleteVehicle, 
  onAddVehicle, 
  selectedCar, 
  setSelectedCar, 
  setActiveTab 
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailModalCar, setDetailModalCar] = useState(selectedCar || null);
  const [soldModalCar, setSoldModalCar] = useState(null);
  const [actualPriceInput, setActualPriceInput] = useState('');
  const [saleDateInput, setSaleDateInput] = useState(new Date().toISOString().split('T')[0]);

  // Filtered cars
  const filteredVehicles = filterStatus === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.status === filterStatus);

  const handleStatusChange = (carId, newStatus) => {
    const car = vehicles.find(v => v.id === carId);
    if (!car) return;

    if (newStatus === 'sold') {
      setSoldModalCar(car);
      setActualPriceInput(car.targetSalePrice?.toString() || '');
      return;
    }

    onUpdateVehicle({
      ...car,
      status: newStatus
    });
  };

  const handleConfirmSold = () => {
    if (!soldModalCar) return;

    // Calculate days to sell if arrivalDate or purchaseDate exists
    let daysToSell = 20;
    const refDate = soldModalCar.arrivalDate || soldModalCar.purchaseDate;
    if (refDate && saleDateInput) {
      const diffTime = Math.abs(new Date(saleDateInput) - new Date(refDate));
      daysToSell = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    onUpdateVehicle({
      ...soldModalCar,
      status: 'sold',
      actualSalePrice: Number(actualPriceInput) || soldModalCar.targetSalePrice,
      saleDate: saleDateInput,
      daysToSell: daysToSell,
      docsChecklist: {
        ...soldModalCar.docsChecklist,
        contractSigned: true,
        taxesDeclared: true
      }
    });

    setSoldModalCar(null);
  };

  const handleToggleDocCheck = (car, docKey) => {
    const updatedChecklist = {
      ...car.docsChecklist,
      [docKey]: !car.docsChecklist?.[docKey]
    };

    onUpdateVehicle({
      ...car,
      docsChecklist: updatedChecklist
    });

    if (detailModalCar && detailModalCar.id === car.id) {
      setDetailModalCar({
        ...detailModalCar,
        docsChecklist: updatedChecklist
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Car className="w-4 h-4" />
            <span>Inventario & Pipeline Operativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestión de Vehículos ({vehicles.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Supervisa el estado exacto de cada coche: compra en origen, transporte, inspección en A Coruña y venta final.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('calculator')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Añadir Nuevo Vehículo</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {STATUS_OPTIONS.map((status) => {
          const count = status.id === 'all' 
            ? vehicles.length 
            : vehicles.filter(v => v.status === status.id).length;

          const isActive = filterStatus === status.id;

          return (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{status.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center space-y-4">
          <Car className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No hay vehículos en este estado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Puedes simular y añadir nuevos coches utilizando la calculadora de importación.
          </p>
          <button
            onClick={() => setActiveTab('calculator')}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Ir a Simulador
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((car, idx) => {
            const summary = calculateVehicleSummary(car);
            
            const statusConfig = {
              sold: { label: 'Vendido', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              available: { label: 'En Stock / A la Venta', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              transit: { label: 'En Transporte a Coruña', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
              paperwork: { label: 'En ITV/DGT Coruña', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
              bought: { label: 'Comprado en Europa', bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
              prospect: { label: 'En Prospección', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' }
            }[car.status] || { label: car.status, bg: 'bg-slate-700 text-slate-300' };

            // Calculate document completion count
            const docs = car.docsChecklist || {};
            const completedDocs = Object.values(docs).filter(Boolean).length;
            const totalDocs = 8;

            return (
              <div 
                key={car.id}
                className="bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image banner */}
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    <img 
                      src={car.imageUrl} 
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-white border border-white/10">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                        {car.environmentalBadge}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border backdrop-blur-md ${statusConfig.bg}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-xs text-slate-300 font-medium">{car.brand} • {car.year}</p>
                      <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                        {car.model}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 text-xs">
                    <p className="text-slate-400 font-medium line-clamp-1">
                      {car.version}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Kilometraje</span>
                        <span className="font-semibold text-slate-200">{car.km?.toLocaleString('es-ES')} km</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Origen</span>
                        <span className="font-semibold text-slate-200">{car.originCity || car.originCountry}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Coste Coruña</span>
                        <span className="font-semibold text-slate-200">{formatEuro(summary.totalCost)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">
                          {car.status === 'sold' ? 'Venta Real' : 'PVP Objetivo'}
                        </span>
                        <span className="font-bold text-amber-400">{formatEuro(summary.effectiveSalePrice)}</span>
                      </div>
                    </div>

                    {/* Profit Strip */}
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Neto Post-IRPF</span>
                        <span className="text-sm font-black text-emerald-400">+{formatEuro(summary.netProfit)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ROI Neto</span>
                        <span className="text-xs font-bold text-emerald-400">{summary.netRoi.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Paperwork / Checklist completion */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Checklist de Documentación:</span>
                        <span className="font-semibold text-slate-300">{completedDocs}/8</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-amber-400 h-full rounded-full transition-all"
                          style={{ width: `${(completedDocs / totalDocs) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Changer Dropdown */}
                    <div className="pt-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Cambiar Estado:
                      </label>
                      <select
                        value={car.status}
                        onChange={(e) => handleStatusChange(car.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-medium text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option value="prospect">En Prospección</option>
                        <option value="bought">Comprado en Europa</option>
                        <option value="transit">En Tránsito (Camión/Ruta)</option>
                        <option value="paperwork">En Trámites (ITV / DGT Coruña)</option>
                        <option value="available">En Stock / A la Venta Coruña</option>
                        <option value="sold">✓ Marcar como Vendido</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setDetailModalCar(car)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                  >
                    <span>Ver Ficha Completa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onDeleteVehicle(car.id)}
                      title="Eliminar vehículo"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalCar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md p-5 border-b border-slate-800 flex items-center justify-between z-10">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Ficha Técnica & Económica
                </span>
                <h2 className="text-xl font-black text-white">
                  {detailModalCar.brand} {detailModalCar.model}
                </h2>
              </div>
              <button
                onClick={() => setDetailModalCar(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Image & Quick Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <img 
                  src={detailModalCar.imageUrl} 
                  alt={detailModalCar.model}
                  className="rounded-xl w-full h-48 object-cover border border-slate-800"
                />
                <div className="space-y-2 text-xs">
                  <p className="text-slate-400"><strong>Versión:</strong> {detailModalCar.version}</p>
                  <p className="text-slate-400"><strong>Año:</strong> {detailModalCar.year} | <strong>Combustible:</strong> {detailModalCar.fuel}</p>
                  <p className="text-slate-400"><strong>Kilómetros:</strong> {detailModalCar.km?.toLocaleString('es-ES')} km</p>
                  <p className="text-slate-400"><strong>Bastidor (VIN):</strong> <span className="font-mono text-slate-200">{detailModalCar.vin}</span></p>
                  <p className="text-slate-400"><strong>Emisiones CO2:</strong> {detailModalCar.co2} g/km (WLTP)</p>
                  <p className="text-slate-400"><strong>Origen:</strong> {detailModalCar.originCity} ({detailModalCar.originCountry})</p>
                  <p className="text-slate-400"><strong>Etiqueta DGT:</strong> <span className="text-amber-400 font-bold">{detailModalCar.environmentalBadge}</span></p>
                </div>
              </div>

              {/* Economic Summary */}
              {(() => {
                const s = calculateVehicleSummary(detailModalCar);
                return (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Resumen Económico Puesto en A Coruña
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Precio Compra</span>
                        <span className="font-bold text-white text-sm">{formatEuro(s.purchase)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Costes Importación</span>
                        <span className="font-bold text-white text-sm">{formatEuro(s.totalCostsWithoutCar)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Coste Total</span>
                        <span className="font-bold text-white text-sm">{formatEuro(s.totalCost)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">PVP Venta</span>
                        <span className="font-bold text-amber-400 text-sm">{formatEuro(s.effectiveSalePrice)}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Margen Bruto: <strong className="text-white">+{formatEuro(s.grossProfit)}</strong> ({s.grossRoi.toFixed(1)}%)
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Neto estimado en bolsillo: +{formatEuro(s.netProfit)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Paperwork Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  <span>Control de Documentación y Trámites (Haz clic para marcar)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'teil1', label: 'Zulassungsbescheinigung Teil I (Permiso alemán)' },
                    { key: 'teil2', label: 'Zulassungsbescheinigung Teil II (Título propiedad)' },
                    { key: 'coc', label: 'Certificado de Conformidad (COC) o Ficha reducida' },
                    { key: 'invoice', label: 'Factura oficial o Kaufvertrag firmado' },
                    { key: 'itvPassed', label: 'ITV de importación superada en A Coruña' },
                    { key: 'dgtRegistered', label: 'Matriculación DGT y placas emitidas' },
                    { key: 'contractSigned', label: 'Contrato compraventa particular firmado' },
                    { key: 'taxesDeclared', label: 'Ganancia patrimonial anotada para IRPF' },
                  ].map((doc) => {
                    const isChecked = Boolean(detailModalCar.docsChecklist?.[doc.key]);
                    return (
                      <div
                        key={doc.key}
                        onClick={() => handleToggleDocCheck(detailModalCar, doc.key)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center space-x-2.5 ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${
                          isChecked ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700'
                        }`}>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="font-medium text-xs">{doc.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {detailModalCar.notes && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Notas Internas:</span>
                  <p className="text-slate-300 leading-relaxed">{detailModalCar.notes}</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ficha</span>
              </button>

              <button
                onClick={() => setDetailModalCar(null)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SOLD MODAL */}
      {soldModalCar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-black text-white">¡Vehículo Vendido en A Coruña!</h3>
            </div>

            <p className="text-xs text-slate-300">
              Registra los datos reales de la venta de <strong>{soldModalCar.brand} {soldModalCar.model}</strong> para el cómputo final de días y beneficio del piloto.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Precio Final de Venta Acordado (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={actualPriceInput}
                    onChange={(e) => setActualPriceInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-emerald-500 text-emerald-400 font-black text-base focus:outline-none"
                  />
                  <Euro className="w-4 h-4 text-emerald-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Fecha de la Venta / Contrato</label>
                <input
                  type="date"
                  value={saleDateInput}
                  onChange={(e) => setSaleDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSoldModalCar(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSold}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

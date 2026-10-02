import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Car, 
  ShieldCheck, 
  Sparkles,
  Download
} from 'lucide-react';

export default function ContractsView({ vehicles }) {
  const [docType, setDocType] = useState('compraventa'); // 'compraventa' | 'reserva'
  const [copied, setCopied] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    city: "A Coruña",
    date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
    
    // Vendedor
    sellerName: "Tu Nombre Completo",
    sellerDni: "12345678Z",
    sellerAddress: "Rúa Juan Flórez, 45, 15004 A Coruña",
    sellerPhone: "600 000 000",
    
    // Comprador
    buyerName: "Nombre del Comprador",
    buyerDni: "87654321A",
    buyerAddress: "Avenida de Oza, 12, 15006 A Coruña",
    buyerPhone: "611 111 111",

    // Vehículo
    brandModel: vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model} ${vehicles[0].version}` : "Volkswagen Golf 7.5 2.0 TDI DSG R-Line",
    plate: "5420-MZZ",
    vin: vehicles[0]?.vin || "WVWZZZAUZKW142981",
    km: vehicles[0]?.km || 115000,
    price: vehicles[0]?.targetSalePrice || 17400,
    paymentMethod: "Transferencia bancaria inmediata",
    depositAmount: 500,
    deadlineDate: "15 de octubre de 2026"
  });

  const handleSelectCarForContract = (carId) => {
    const car = vehicles.find(v => v.id === carId);
    if (!car) return;

    setFormData(prev => ({
      ...prev,
      brandModel: `${car.brand} ${car.model} ${car.version}`,
      vin: car.vin || "WVWZZZAUZKW142981",
      km: car.km || 100000,
      price: car.status === 'sold' && car.actualSalePrice ? car.actualSalePrice : car.targetSalePrice
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = document.getElementById('contract-document-preview')?.innerText;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Herramientas Jurídicas para Particular</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Generador de Contratos Legales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Modelos adaptados al Código Civil español (Arts. 1484-1490) con exclusión de garantías comerciales y protección de vicios ocultos en A Coruña.
          </p>
        </div>

        {/* Document Type Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDocType('compraventa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              docType === 'compraventa'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Contrato de Compraventa
          </button>
          <button
            onClick={() => setDocType('reserva')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              docType === 'reserva'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recibo de Señal / Arras
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: Data input (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Quick populate from inventory */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Autocompletar con un coche de mi inventario:
            </label>
            <select
              onChange={(e) => handleSelectCarForContract(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:border-amber-400 focus:outline-none"
            >
              <option value="">Selecciona un vehículo...</option>
              {vehicles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.brand} {c.model} - {c.version} ({c.year})
                </option>
              ))}
            </select>
          </div>

          {/* Form Sections */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Datos del Vendedor (Tú)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.sellerName}
                  onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">DNI / NIE</label>
                  <input
                    type="text"
                    value={formData.sellerDni}
                    onChange={e => setFormData({ ...formData, sellerDni: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.sellerPhone}
                    onChange={e => setFormData({ ...formData, sellerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Domicilio en A Coruña</label>
                <input
                  type="text"
                  value={formData.sellerAddress}
                  onChange={e => setFormData({ ...formData, sellerAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 pt-2">
              Datos del Comprador
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Nombre del Comprador</label>
                <input
                  type="text"
                  value={formData.buyerName}
                  onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">DNI / NIE</label>
                  <input
                    type="text"
                    value={formData.buyerDni}
                    onChange={e => setFormData({ ...formData, buyerDni: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.buyerPhone}
                    onChange={e => setFormData({ ...formData, buyerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Domicilio del Comprador</label>
                <input
                  type="text"
                  value={formData.buyerAddress}
                  onChange={e => setFormData({ ...formData, buyerAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 pt-2">
              Datos del Vehículo y Precio
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Marca, Modelo y Versión</label>
                <input
                  type="text"
                  value={formData.brandModel}
                  onChange={e => setFormData({ ...formData, brandModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Matrícula Asignada</label>
                  <input
                    type="text"
                    value={formData.plate}
                    onChange={e => setFormData({ ...formData, plate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kilometraje Odómetro</label>
                  <input
                    type="number"
                    value={formData.km}
                    onChange={e => setFormData({ ...formData, km: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Número de Bastidor (VIN)</label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={e => setFormData({ ...formData, vin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Precio Total Acordado (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500 text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                {docType === 'reserva' ? (
                  <div>
                    <label className="block text-slate-400 mb-1">Importe Señal (€)</label>
                    <input
                      type="number"
                      value={formData.depositAmount}
                      onChange={e => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-500 text-amber-400 font-bold focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 mb-1">Forma de Pago</label>
                    <input
                      type="text"
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Preview: Printable Legal Document (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vista Previa del Documento Oficial
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>
          </div>

          {/* White Paper Mockup */}
          <div 
            id="contract-document-preview"
            className="bg-white text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl font-serif text-[13px] leading-relaxed border border-slate-300 print:m-0 print:p-0 print:border-none print:shadow-none"
          >
            {docType === 'compraventa' ? (
              <div className="space-y-5">
                <div className="text-center pb-4 border-b-2 border-slate-900">
                  <h2 className="text-base font-bold uppercase tracking-wider text-black">
                    Contrato de Compraventa de Vehículo Usado entre Particulares
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Conforme al régimen de los Artículos 1484 a 1490 del Código Civil español
                  </p>
                </div>

                <p className="text-right text-xs text-slate-600">
                  En {formData.city}, a {formData.date}
                </p>

                <div>
                  <h3 className="font-bold text-black uppercase text-xs tracking-wider mb-1">REUNIDOS</h3>
                  <p className="mb-2">
                    <strong>DE UNA PARTE, COMO VENDEDOR:</strong> D./Dña. <u>{formData.sellerName}</u>, mayor de edad, con DNI/NIE número <u>{formData.sellerDni}</u>, con domicilio en <u>{formData.sellerAddress}</u> y teléfono <u>{formData.sellerPhone}</u>.
                  </p>
                  <p>
                    <strong>DE OTRA PARTE, COMO COMPRADOR:</strong> D./Dña. <u>{formData.buyerName}</u>, mayor de edad, con DNI/NIE número <u>{formData.buyerDni}</u>, con domicilio en <u>{formData.buyerAddress}</u> y teléfono <u>{formData.buyerPhone}</u>.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-black uppercase text-xs tracking-wider mb-1">EXPONEN</h3>
                  <p className="mb-2">
                    Que la parte vendedora es propietaria del vehículo automóvil cuyas características son:
                  </p>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs font-sans space-y-1">
                    <p>• <strong>Marca y Modelo:</strong> {formData.brandModel}</p>
                    <p>• <strong>Matrícula:</strong> {formData.plate} | <strong>Bastidor (VIN):</strong> {formData.vin}</p>
                    <p>• <strong>Kilometraje odómetro:</strong> {Number(formData.km).toLocaleString('es-ES')} km</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-black uppercase text-xs tracking-wider mb-1">CLÁUSULAS</h3>
                  <div className="space-y-2 text-xs text-justify">
                    <p>
                      <strong>PRIMERA. - Objeto y Precio:</strong> La parte vendedora transmite la propiedad del vehículo a la parte compradora por el precio cierto y convenido de <strong>{Number(formData.price).toLocaleString('es-ES')} EUROS ({formData.price} €)</strong>, satisfechos mediante {formData.paymentMethod}.
                    </p>
                    <p>
                      <strong>SEGUNDA. - Prueba Dinámica y Estado:</strong> El comprador manifiesta de forma expresa haber inspeccionado ocularmente el vehículo y realizado una prueba dinámica en carretera a su entera satisfacción, aceptando el vehículo en el estado técnico, visual y de desgaste propio de su kilometraje.
                    </p>
                    <p className="p-2 bg-amber-50 border-l-4 border-amber-600 font-sans text-[11px] leading-snug">
                      <strong>TERCERA. - Régimen Legal de Garantía y Vicios Ocultos:</strong> Al tratarse de una compraventa privada entre particulares, queda expresamente excluida la aplicación del Real Decreto Legislativo 1/2007 (Ley de Consumidores). El vendedor responde únicamente de los vicios ocultos de carácter grave y preexistente regulados en los Artículos 1484 y ss. del Código Civil durante el plazo legal de seis (6) meses desde la entrega. No existirá responsabilidad por averías de desgaste natural o mantenimiento periódico.
                    </p>
                    <p>
                      <strong>CUARTA. - Entrega y Transferencia DGT:</strong> En este acto se hace entrega de las llaves, permiso de circulación y ficha de ITV. El comprador asume desde este instante la responsabilidad derivada del uso del vehículo y se compromete a tramitar el cambio de titularidad en la Jefatura Provincial de Tráfico (DGT) y el abono del Impuesto de Transmisiones Patrimoniales en ATRIGA Galicia en el plazo de quince (15) días.
                    </p>
                    <p>
                      <strong>QUINTA. - Jurisdicción:</strong> Ambas partes se someten expresamente a la jurisdicción de los Juzgados y Tribunales de la ciudad de A Coruña.
                    </p>
                  </div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-12">
                    <p className="font-bold">EL VENDEDOR</p>
                    <p className="border-t border-slate-400 pt-1 text-slate-500">Fdo: {formData.sellerName}</p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold">EL COMPRADOR</p>
                    <p className="border-t border-slate-400 pt-1 text-slate-500">Fdo: {formData.buyerName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center pb-4 border-b-2 border-slate-900">
                  <h2 className="text-base font-bold uppercase tracking-wider text-black">
                    Documento de Señal y Arras Confirmatorias
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Conforme al Artículo 1454 del Código Civil español
                  </p>
                </div>

                <p className="text-right text-xs text-slate-600">
                  En {formData.city}, a {formData.date}
                </p>

                <div className="space-y-3 text-xs text-justify">
                  <p>
                    <strong>REUNIDOS:</strong> De una parte como Vendedor D./Dña. <u>{formData.sellerName}</u> (DNI {formData.sellerDni}), y de otra parte como Comprador D./Dña. <u>{formData.buyerName}</u> (DNI {formData.buyerDni}).
                  </p>
                  <p>
                    <strong>DECLARAN:</strong> Que el Comprador entrega en este acto a la parte Vendedora la cantidad de <strong>{formData.depositAmount} EUROS ({formData.depositAmount} €)</strong> en concepto de SEÑAL Y RESERVA para la adquisición del vehículo:
                  </p>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 font-sans space-y-1">
                    <p>• <strong>Vehículo:</strong> {formData.brandModel}</p>
                    <p>• <strong>Bastidor / Matrícula:</strong> {formData.vin} / {formData.plate}</p>
                    <p>• <strong>Precio Total Pactado:</strong> {Number(formData.price).toLocaleString('es-ES')} €</p>
                    <p>• <strong>Cantidad Restante a Liquidar:</strong> {Number(formData.price - formData.depositAmount).toLocaleString('es-ES')} €</p>
                  </div>
                  <p>
                    <strong>ESTIPULACIONES:</strong>
                  </p>
                  <p>
                    1. La cantidad entregada en concepto de señal se descontará íntegramente del precio total convenido en el momento de la formalización del contrato definitivo y entrega del vehículo.
                  </p>
                  <p>
                    2. Se establece como fecha límite para el abono de la cantidad restante y retirada del vehículo el día <strong>{formData.deadlineDate}</strong>.
                  </p>
                  <p>
                    3. Si el Comprador desiste unilateralmente de la compra, perderá la cantidad entregada en concepto de señal. Si desistiese el Vendedor, devolverá duplicada la señal percibida según prevé el Código Civil.
                  </p>
                </div>

                <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-12">
                    <p className="font-bold">EL VENDEDOR</p>
                    <p className="border-t border-slate-400 pt-1 text-slate-500">Fdo: {formData.sellerName}</p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold">EL COMPRADOR</p>
                    <p className="border-t border-slate-400 pt-1 text-slate-500">Fdo: {formData.buyerName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

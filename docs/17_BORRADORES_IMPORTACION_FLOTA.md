# Borradores de alta de vehículos (importación en un clic)

La pantalla **ERP → Flota y stock** puede enseñar fichas de coches preparados antes de que existan en la base de datos de la empresa. El borrador está versionado con la aplicación; solo al pulsar **Añadir a mi flota** se crea el vehículo real en Supabase o IndexedDB.

## Qué hace el flujo

- Presenta los vehículos pendientes con fotos, datos técnicos, tipo de vendedor, aviso del anuncio, anuncio original y precio objetivo. Los gastos estándar (transporte, COC, ITV de importación, tasa DGT, placas y gestoría) vienen rellenados con las tarifas de *Ajustes → Tarifas*; solo lo que de verdad no se puede estimar (viaje, seguro de stock, otros) queda a 0, se identifica como pendiente y no se cuenta en el subtotal.
- **Puesta a la venta automática:** al añadir el coche a la flota se rellenan siempre **Reacondicionamiento 180 €**, **Mantenimiento 150 €**, **Póliza de garantía 450 €** y **Publicidad y portales 30 €**, aunque el borrador los traiga a 0 o como pendientes. Son las tarifas estándar de *Ajustes → Tarifas* y se sustituyen por las facturas reales en la ficha; si el borrador consigna un importe distinto de 0 (por ejemplo un presupuesto real de chapa y pintura), ese importe se respeta.
- **Añadir a mi flota** guarda la ficha completa y copia las fotos al almacenamiento privado del vehículo. La ficha se crea como **Prospección**, no como compra confirmada ni como publicación web.
- Los impuestos se recalculan con la forma jurídica y tarifas de la empresa. La exención provisional de ITP no se presume por comprar como empresa: queda sin marcar hasta que se confirme que se cumplen sus requisitos y el plazo legal de reventa.
- **Descartar** registra la decisión en `activity`; no vuelve a ofrecer ese borrador al iniciar sesión en otro dispositivo.
- La importación es idempotente: `importDraftId` y el ID estable evitan altas duplicadas. No requiere una migración nueva de Supabase.

## Añadir un borrador futuro

1. Guarda las imágenes proporcionadas en `public/images/<carpeta-del-coche>/`.
2. Añade sus `import` y entradas en `PHOTO_ASSETS` de `erp/src/data/vehicleImportDrafts.js`.
3. Añade un registro a `PENDING_VEHICLE_IMPORT_DATA` en `erp/src/data/vehicleImportDraftData.js` con:
   - un `id` único e inmutable (por ejemplo, el marketplace y el ID del anuncio);
   - `sourceListing` con URL, precio anunciado, vendedor, localización y fecha de captura;
   - `vehicle` con la ficha conocida, estado `prospeccion` y `purchaseDate: null` si aún no se ha comprado;
   - `costs` con el precio anunciado y los gastos estándar rellenados con las tarifas configuradas (transporte en camión, COC de fábrica, ITV de importación + ficha técnica, tasa DGT 1.1, placas y gestoría), para que la ficha importada no quede con huecos; son estimaciones y se sustituyen por las facturas reales al cerrar. Consigna también la puesta a la venta con sus tarifas estándar (`recond` 180, `maintenance` 150, `guarantee` 450, `advertising` 30) para que borrador y ficha coincidan: el ERP la rellena igual al importar, así que nunca la dejes en `pendingCostFields`. Para cada concepto que de verdad no se pueda estimar (viaje, seguro de stock, otros, una reparación aún sin presupuestar), añade su clave a `pendingCostFields` y fija su coste explícitamente en 0 (no significa que sea gratuito);
   - `warnings` con los avisos propios del anuncio que hay que leer antes de comprar (defectos declarados, régimen de la factura del vendedor, CO₂ dudoso…); la tarjeta de Flota los muestra en el recuadro «Revisar antes de comprar»;
   - `itpExemption: false` salvo que la elegibilidad esté confirmada expresamente; deja `itpExemptionPending: true` si aún debe revisarse (en compras a profesional no hay ITP y puede ir a `false`);
   - `priceTarget` indicando que es una estimación y cuál es su base;
   - `photos` con el nombre de archivo, identificador estable, descripción y una sola portada. Las vistas exteriores se homogeneizan **siempre** a la ubicación de la empresa (fachada de hormigón y madera, sin rótulos ni matrículas del vendedor) y se marcan con `backgroundEdited: true`; los originales del anuncio se conservan en la carpeta del coche y las fotos de interior y maletero quedan intactas.
4. Deja como vacío/null lo que no se haya verificado (VIN, matrícula, código de motor, día exacto de matriculación, etc.). Si el anuncio solo da mes y año, guarda ese texto en `sourceListing` y usa `firstRegDatePending: true`, sin inventar el día. Si una cifra técnica viene del catálogo y no del anuncio, anótalo y marca qué documentación debe confirmarla.
5. Ejecuta `npm run test:vehicle-imports` y `npm run build:erp`.

El ERP convierte cada foto a JPEG (máximo 1.600 px) al importarla; así la copia guardada en la ficha no depende de que el anuncio siga publicado y no conserva metadatos EXIF. Los originales permanecen en `public/images/` como material del borrador.

## Volvo V40 · CarReport 11514903 (10/10/2026)

- Borrador `carreport-11514903`, sin alta automática ni publicación. Aprobar en **Flota y stock → Vehículos preparados para importar → Añadir a mi flota**.
- Fuente: `public/Volvo V40/CarReport-11514903.pdf`. El enlace del ERP se empaqueta con Vite para funcionar en el dominio de la aplicación.
- D2 Cross Country Black Edition, 120 CV, manual, diésel, 1.969 cc; primera matriculación 17/10/2019 y 141.723 km. Recogida en Bilzen (Bélgica).
- Precio comunicado por el usuario: **9.800 € netos**, antes 10.100 € (descuento 300 €); compra a empresa UE con IVA deducible. Total anunciado: 12.390,40 €, pendiente de desglose: supera en 532,40 € los 11.858 € resultantes de aplicar el 21 % al neto. No se imputan comisiones sin confirmación. Objetivo de venta pendiente. No se inventan CO₂, VIN, valor fiscal ni etiqueta. Los impuestos automáticos no son una liquidación validada.
- Arañazos declarados en parachoques trasero; reparación pendiente. Inspección válida hasta 17/10/2026 según el informe. IVA deducible confirmado por el usuario; comprobar factura y requisitos de AIB. Sin ITP y venta en régimen general, no REBU.
- 25 imágenes: cuatro exteriores con fondo de hormigón/madera editado por IA y 21 interiores/detalles originales, incluido el detalle del parachoques. Los originales de los exteriores se conservan junto a las demás fotos. Las miniaturas del PDF tienen solo 300 px: verificar fidelidad de las ediciones antes de publicar. No son prueba de ubicación física.
- No se incorporan las fotos de documentos a la galería comercial. COC e historial constan como disponibles en el informe, no como comprobados en el expediente.

## Fiat 500X 1.6 MultiJet Pop · Openlane CarReport 11625065 (11/10/2026)

- Borrador `carreport-11625065`, preparado en estado `prospeccion` en **Flota y stock → Vehículos preparados para importar**.
- Fuente: `public/Fiat 500X 1.6/CarReport-11625065.pdf` y desglose Openlane comunicado por el usuario.
- 1.6 MultiJet Pop 114 CV (84 kW, 1.598 cc, manual 6v, diésel, EU6b, 109 g/km CO₂); primera matriculación 17/04/2018 (producción 26/02/2018), 50.439 km, 2 llaves, color rojo; recogida en Bilzen (Bélgica).
- Desglose de subasta en **REBU** (`pro_eu_rebu`): precio del vehículo **8.300,00 €** (antes 8.400,00 €, ahorro 100,00 €) + costes específicos del país **195,00 €** + honorarios de subasta **245,00 €** = subtotal **8.740,00 €** (`costs.purchase = 8.300 €`, `costs.marginExtras = 440 €`) + **92,40 €** de IVA (21 % sobre los 440 € de comisiones) = **8.832,40 €** total con IVA.
- Sin ITP ni AIB sobre el vehículo y elegible para reventa en REBU. Con 109 g/km de CO₂ queda en el tramo 0 % del Modelo 576 (cuota 0 €).
- Daños declarados en página 3: impactos de piedras y arañazos en parachoques delantero y trasero, impactos de piedras en capó y arañazos/abolladuras en panel lateral izquierdo (`other = 0 €`, pendiente de presupuesto). Sin registro de mantenimiento disponible e inspección técnica belga vencida el 17/04/2026.
- 16 imágenes: 4 vistas exteriores con fondo homogeneizado a la fachada de hormigón y madera en `public/images/fiat 500x editadas/` y 12 fotos originales de interior y detalle de daños en `public/images/fiat 500x/` (junto con los 4 originales de exterior).
- Precio objetivo recomendado: **12.990 €** (suelo competitivo de rotación rápida en **12.490 €**), frente a un coste de aterrizaje conocido de **10.907,33 €** (**10.999,73 €** con el IVA de comisiones) y punto de equilibrio REBU en **11.362,47 €**.

## Renault Talisman 1.7 dCi Zen · Openlane CarReport 11662976 (11/10/2026)

- Borrador `carreport-11662976`, preparado en estado `prospeccion` en **Flota y stock → Vehículos preparados para importar**.
- Fuente: `public/Renault Talisman 1.7 DCI/CarReport-11662976.pdf` y desglose Openlane comunicado por el usuario.
- 1.7 dCi Zen 120 CV (88 kW, 1.749 cc, motor 1.7 Blue dCi R9N, manual 6v, diésel, EU6d); primera matriculación 08/09/2020, 110.311 km, **1 llave**, color gris metalizado; recogida en Bilzen (Bélgica).
- Desglose de subasta en **REBU** (`pro_eu_rebu`): precio del vehículo **10.700,00 €** + costes específicos del país **195,00 €** + honorarios de subasta **300,00 €** = subtotal **11.195,00 €** (`costs.purchase = 10.700 €`, `costs.marginExtras = 495 €`) + **103,95 €** de IVA (21 % sobre los 495 € de comisiones) = **11.298,95 €** total con IVA.
- Sin ITP ni AIB sobre el vehículo y elegible para reventa en REBU. El PDF no consigna la cifra de CO₂ (`co2: null`, `iedmt` en `pendingCostFields`): verificar en el CdC/COC disponible (0 € si ≤ 120 g/km; ~430 € al 4,75 % por tablas si consigna WLTP entre 121 y 159 g/km).
- Daños declarados en página 3: impactos de piedras y arañazos en parachoques delantero/trasero y parrilla, impactos en capó, arañazos en lateral derecho y daño especial por **llantas arañadas** (`other = 0 €`, pendiente de presupuesto junto con el duplicado de la 2.ª tarjeta manos libres). Sin registro de mantenimiento disponible e inspección técnica belga vencida el 08/09/2026.
- 16 imágenes únicas (descartada la 17.ª imagen del PDF por ser duplicada exacta de la portada): 4 vistas exteriores con fondo homogeneizado a la fachada de hormigón y madera en `public/images/renault talisman editadas/` y 12 fotos originales de interior y detalle en `public/images/renault talisman/` (junto con los 4 originales de exterior).
- Precio objetivo recomendado: **15.990 €** (salida recomendada en portal en **16.490 €**), frente a un coste de aterrizaje conocido antes de IEDMT/chapa de **13.381,46 €** (**13.485,41 €** con el IVA de comisiones, o **~13.812 €** si aplica el 4,75 % de IEDMT) y punto de equilibrio REBU en **13.840,62 €**.

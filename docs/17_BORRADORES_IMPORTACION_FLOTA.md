# Borradores de alta de vehículos (importación en un clic)

La pantalla **ERP → Flota y stock** puede enseñar fichas de coches preparados antes de que existan en la base de datos de la empresa. El borrador está versionado con la aplicación; solo al pulsar **Añadir a mi flota** se crea el vehículo real en Supabase o IndexedDB.

## Qué hace el flujo

- Presenta los vehículos pendientes con fotos, datos técnicos, tipo de vendedor, aviso del anuncio, anuncio original y precio objetivo. Los gastos estándar (transporte, COC, ITV de importación, tasa DGT, placas, gestoría, preparación, mantenimiento y publicidad) vienen rellenados con las tarifas de *Ajustes → Tarifas*; solo lo que de verdad no se puede estimar queda a 0, se identifica como pendiente y no se cuenta en el subtotal.
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
   - `costs` con el precio anunciado y los gastos estándar rellenados con las tarifas configuradas (transporte en camión, COC de fábrica, ITV de importación + ficha técnica, tasa DGT 1.1, placas, gestoría, preparación, mantenimiento y publicidad), para que la ficha importada no quede con huecos; son estimaciones y se sustituyen por las facturas reales al cerrar; para cada concepto que de verdad no se pueda estimar (viaje, garantía, seguro de stock, otros), añade su clave a `pendingCostFields` y fija su coste explícitamente en 0 (no significa que sea gratuito);
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
- Sin precio en el informe: compra, comisiones y objetivo de venta pendientes. No se inventan CO₂, VIN, valor fiscal ni etiqueta. Los impuestos automáticos no son una liquidación validada.
- Arañazos declarados en parachoques trasero; reparación pendiente. Inspección válida hasta 17/10/2026 según el informe. IVA excluido: confirmar factura y vendedor.
- 25 imágenes: cuatro exteriores con fondo de hormigón/madera editado por IA y 21 interiores/detalles originales, incluido el detalle del parachoques. Los originales de los exteriores se conservan junto a las demás fotos. Las miniaturas del PDF tienen solo 300 px: verificar fidelidad de las ediciones antes de publicar. No son prueba de ubicación física.
- No se incorporan las fotos de documentos a la galería comercial. COC e historial constan como disponibles en el informe, no como comprobados en el expediente.

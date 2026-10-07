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

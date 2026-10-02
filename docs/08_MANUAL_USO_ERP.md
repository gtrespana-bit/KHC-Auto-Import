# 08 · Manual de uso del ERP (gestión diaria del negocio)

Este documento explica cómo se usa la aplicación para **operar de verdad**: dar de alta un
coche, saber cuánto cuesta traerlo, qué impuestos paga, a qué precio venderlo, qué papeles
faltan, qué modelos hay que presentar y cuánto dinero entra y sale.

> **Importante sobre los datos.** La aplicación guarda todo en la nube (Supabase, servidores
> en la UE): los mismos datos en el móvil y en el ordenador, con acceso por usuario y rol.
> Necesita conexión. Exporta un respaldo JSON desde *Ajustes → Datos y respaldo* de vez en
> cuando: es tu copia independiente del proveedor. Detalles técnicos, roles e invitaciones en
> [`09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md`](09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md).

---

## 0. Entrar en la aplicación

- **Primera vez:** pestaña *Crear cuenta* → tu nombre, el nombre de la empresa, correo y
  contraseña. Si el proyecto tiene activada la confirmación por correo, abre el enlace que
  recibirás y vuelve a entrar. Se crea tu empresa y eres su **propietario**.
- **Siguientes veces:** *Entrar* con correo y contraseña. La sesión se recuerda en el
  dispositivo.
- **Contraseña olvidada:** pestaña *Recuperar*; el correo trae un enlace que abre la app
  pidiendo la nueva contraseña.
- **Si te han invitado:** crea la cuenta con **el mismo correo** al que te invitaron y
  entrarás directamente en esa empresa con el rol que te asignaron.
- **Datos de la versión anterior:** si este navegador guardaba datos en local, al entrar
  aparece un aviso amarillo para subirlos a la nube (las fotos hay que volver a subirlas).
- En la barra lateral ves tu correo, tu rol, el estado *Sincronizado / Guardando… / Error* y
  el botón de salir.

Qué puede hacer cada rol:

| | Propietario | Gestor | Comercial | Gestoría |
| --- | :-: | :-: | :-: | :-: |
| Ver todo | ✅ | ✅ | ✅ | ✅ |
| Flota, clientes, tareas, fotos | ✅ | ✅ | ✅ | — |
| Gastos, impuestos, facturas | ✅ | ✅ | — | — |
| Ajustes de empresa y tarifas | ✅ | ✅ | — | — |
| Importar respaldo, ejemplos, borrar todo | ✅ | — | — | — |
| Equipo e invitaciones | ✅ | — | — | — |

---

## 1. Empezar: tres pasos

1. **Ajustes → Empresa.** Nombre o razón social, NIF, domicilio, IBAN, forma jurídica
   (particular / autónomo / SL) y régimen de IVA (REBU o general). Estos datos alimentan
   las facturas, los contratos y el calendario fiscal.
2. **Catálogo** o **Simulador.** Busca el coche que vas a comprar y comprueba si la
   operación sale.
3. **Flota → Añadir vehículo.** Cuando la compra es real, se da de alta y empieza a
   acumular costes, impuestos y documentación.

Si quieres ver la aplicación funcionando antes de meter tus datos:
*Cuadro de mando → Cargar datos de ejemplo*.

---

## 2. Módulo a módulo

### Cuadro de mando
La foto del día: caja, capital inmovilizado en stock, beneficio neto realizado, impuestos
pendientes, avisos operativos (stock envejecido, ITV caducada, papeles que faltan, cobros
pendientes), cuenta de resultados por meses y los cobros y pagos de los próximos 90 días.

### Flota y stock
Cada vehículo con su **coste real** (no el precio de compra), su estado en el flujo
(Prospección → Negociación → Comprado → En tránsito → Trámites en Coruña → En preparación →
En venta → Reservado → Vendido → Entregado), el avance de su documentación y su margen neto.

Dos vistas: tabla y tablero por estados. Se puede filtrar, exportar a CSV y abrir la ficha
completa haciendo clic en la fila.

### Catálogo
1.104 variantes de 37 marcas (101 fichas revisadas a mano + 1.003 generadas por modelo de depreciación). Cada ficha lleva motor, fiabilidad (`Motor roca` / `Correcto` /
`Precaución` / `PROHIBIDO`), precio de compra estimado en Alemania y precio de venta estimado
en Galicia, rotación prevista y potencia fiscal.

> Las horquillas de precio son una **estimación de mercado** (curva de depreciación aplicada
> al precio medio del vehículo nuevo). Sirven para decidir rápido, no sustituyen a Mobile.de
> ni a la tabla oficial de Hacienda.

### Simulador de importación
La herramienta de decisión. Se rellena en tres bloques (vehículo / compra / venta) y
devuelve:

- **Coste total real**, desglosado línea a línea y en porcentaje.
- **Impuestos exactos**: IEDMT (576 o 06), ITP de Galicia o IVA según quién te venda, tasa
  1.1 de la DGT, placas, ITV e IVTM de A Coruña prorrateado.
- **Precio de venta sugerido** para el margen neto que quieras.
- **Punto de equilibrio**: por debajo de ese precio no ganas nada.
- **Sensibilidad**: qué pasa si bajas el precio un 5 % o un 10 %, y dónde se gana más dinero
  si consigues reducir cada coste un 20 %.

Desde aquí puedes enviar el coche a la flota con un clic.

### Clientes y ventas
Contactos con su origen (Wallapop, Coches.net, taller, boca a boca…), fase de negociación,
presupuesto, vehículo de interés y próximo paso. Embudo visual y tareas con fecha límite.

### Contabilidad
Todos los cobros y pagos: los del vehículo (compra, transporte, 576, 620, ITV, DGT,
reacondicionamiento…) y los de estructura (nave, luz, cuota de autónomo, gestoría,
publicidad). Cuenta de resultados por meses, previsión de tesorería a 90 días y
rentabilidad por marca, modelo y segmento.

El IVA deducible que anotes en cada gasto se descuenta solo en el Modelo 303 del trimestre.

### Facturación
Emite las facturas de cada venta con numeración correlativa (no dejes huecos). El desglose
se hace solo según el régimen: en **REBU** el IVA va incluido y se hace constar la mención al
régimen especial de bienes usados; en **régimen general** se separa base e IVA; vendiendo como
**particular** no hay IVA (el comprador liquida el ITP). Cada factura se imprime en PDF con
firma de ambas partes. Las ventas cerradas que aún no tienen factura aparecen arriba como
*pendientes de facturar*.

### Anuncios
Desde la flota, botón de megáfono: genera el título y la descripción listos para pegar en
Wallapop, Milanuncios o Coches.net, con los datos reales de la ficha (motor, km, etiqueta,
garantías) y el precio que elijas. Controla el límite de caracteres de cada portal y te dice
en vivo qué beneficio neto deja ese precio. Versión corta para responder rápido.

### Publicar un coche en la web

En la ficha del vehículo, pestaña **Web** → botón *Publicar en la web* (solo propietario y gestor).

1. **Contenido:** precio publicado, garantía, título, descripción y equipamiento. Todo llega
   rellenado desde la ficha; el botón *Regenerar desde la ficha* vuelve a redactarlo si has
   cambiado los datos. La descripción solo afirma lo que está marcado en la ficha (libro de
   mantenimiento, llaves, ITV): revisa que lo que afirmas es verdad.
2. **Fotos:** marca las que se publican, elige la portada y, si se ve la matrícula, pulsa el lápiz
   para **taparla** (se pixela solo en la copia que sube a la web; la original de la ficha no se
   toca). Las imágenes salen redimensionadas y sin datos EXIF (nada de geolocalización).
3. **Vista previa:** comprueba cómo quedará en la web antes de publicar.
4. **Publicar.** El coche aparece en la web en menos de un minuto.

Después:

- Si cambias el **precio o los kilómetros** en la ficha, verás el aviso *«La web está
  desactualizada»* con un botón para actualizar. Nada se actualiza solo salvo el estado.
- Al marcar el coche como **Reservado** o **Vendido**, la web se actualiza sola. La ficha del
  coche vendido se mantiene publicada (con el aviso de vendido): es bueno para Google y transmite
  confianza. Si quieres retirarla, *Retirar de la web*.
- El botón **Copiar enlace** sirve para pegar la ficha en WhatsApp, un email o la respuesta a un
  comprador.
- **Nunca** se publican: precio de compra, costes, margen, VIN, matrícula, documentación, datos
  del vendedor anterior ni notas internas. La web lee su propia tabla, no la ficha del ERP.

### Contactos web

Los formularios de la web (ficha de un coche, búsqueda por encargo, compramos tu coche y contacto)
caen en el módulo **Contactos web** del menú lateral, con un contador en rojo mientras haya
consultas sin atender.

- Cada consulta trae tipo, teléfono, correo, mensaje y de qué página viene.
- Acciones directas: **WhatsApp**, llamar, correo y *Crear ficha en el CRM* (la crea en
  *Clientes y ventas* con el mensaje ya dentro).
- Estados: **Nuevo → Contactado → Ganado** (o Descartado), con notas internas de seguimiento.
- Si no hay credenciales de Supabase configuradas, esta pantalla avisa: en modo local no puede
  recibir los contactos reales de la web.

### Financiación al comprador
En la pestaña *Venta y cliente* de cada ficha y en el CRM. Metes entrada, TIN, plazo y tu
comisión, y te da la cuota mensual, los intereses, el total que paga el cliente y **tu comisión
por intermediar** (un ingreso que hay que registrar aparte del margen del coche). Puedes
guardar la oferta en la ficha o copiar el mensaje para el cliente.

### Fotos
Pestaña *Fotos* de la ficha. Subes varias, reordenas y marcas la principal; se redimensionan a
1.600 px y se guardan en IndexedDB. La principal aparece en la flota y sirve para el anuncio.

### WhatsApp y email
En *Clientes y ventas* cada contacto tiene botón de WhatsApp y de email con un mensaje de
seguimiento ya escrito según el contexto (seguimiento, cita, oferta, financiación, entrega,
postventa). Edita el tipo de mensaje, ajusta la cuota si quieres, copia o envía directo.

### App instalable (PWA)
Desde el navegador del móvil, *Añadir a pantalla de inicio*. La app se instala, se abre a
pantalla completa y funciona sin cobertura: los datos viven en tu dispositivo.

### Impuestos
El calendario fiscal del ejercicio, generado con tus datos:

| Modelo | Qué es | Cuándo |
| --- | --- | --- |
| 576 / 06 | IEDMT (matriculación) | Antes de matricular; 06 si CO₂ ≤ 120 g/km |
| 620 | ITP Galicia 8 % (compra a particular) | 1 mes, ATRIGA |
| 303 | IVA trimestral | 20 abr / 20 jul / 20 oct / 30 ene |
| 349 | Operaciones intracomunitarias | Con cada 303 |
| 390 | Resumen anual de IVA | 30 de enero |
| 130 | Pago fraccionado IRPF (autónomo) | 20 abr / 20 jul / 20 oct / 30 ene |
| 202 / 200 | Pagos fraccionados e IS (SL) | 20 abr, 20 oct, 20 dic / 25 jul |
| 100 | Renta (particular) | 30 de junio del año siguiente |
| IVTM | Impuesto de circulación | 3 mar – 5 may (A Coruña) |

Las líneas marcadas como **Contabilizado** son impuestos ligados a un vehículo concreto que
ya forman parte de su coste: no vuelven a contarse como pago pendiente. Marca cada modelo
como **Presentado** cuando lo liquides: se descuenta de la tesorería y queda con su fecha.

### Documentación
15 documentos por vehículo, 8 de ellos obligatorios. Sin ITV, COC, Modelo 576 y matrícula no
hay venta posible. Se puede imprimir la ficha del expediente en PDF.

### Informes
Cuenta de resultados del ejercicio, rentabilidad por marca, valoración del stock a coste y a
precio de venta, antigüedad de cada unidad, carga fiscal y evolución mensual. Botón
*Imprimir / PDF*.

### Ajustes
Datos de la empresa, régimen fiscal, **tarifas editables** (si tu gestoría o tu estación de
ITV cobran otra cosa, cámbialo y todo se recalcula), respaldo JSON (exportar, importar,
pegar, borrar) y el listado de fuentes de cada cifra.

---

## 3. Cifras verificadas que usa la aplicación (ejercicio 2026)

| Concepto | Valor | Fuente |
| --- | --- | --- |
| Tasa 1.1 matriculación | 99,77 € | Anexo de tasas DGT 2026 |
| Tasa 1.5 cambio de titularidad | 55,70 € | Anexo de tasas DGT 2026 |
| Placas de matrícula | 28 € | Referencia de mercado |
| ITV turismo gasolina / diésel (Galicia) | 43,76 € / 52,30 € | Tarifas reguladas Xunta, IVA incluido |
| Expedición de ficha técnica | 80,29 € | Tarifas reguladas Xunta |
| IEDMT | 0 / 4,75 / 9,75 / 14,75 % | Art. 70 Ley 38/1992, por tramos de CO₂ |
| ITP Galicia | 8 % (Mod. 620, ATRIGA, 1 mes) | Art. 14.Uno TR D. Leg. 1/2011 |
| IVTM A Coruña (turismos) | 19,50 / 62,62 / 132,19 / 179,20 / 224,00 € | Ordenanza Fiscal nº 52 (BOP 15-01-2025) |
| Bonificación IVTM bajas emisiones | 60 % (no acumulable) | OF 52, art. 5.2 |
| IVA general / REBU | 21 % / 21 % sobre el margen | Ley 37/1992, arts. 135-139 |
| IRPF base del ahorro | 19 – 30 % | Ley 35/2006 y Ley 7/2024 |
| IS 2026 | 25 % general · 23 % ERD · 19 %+21 % microempresa | Art. 29 Ley 27/2014 |

### Cifras que debes verificar tú antes de declararlas

- **Cuotas de autónomo por tramo.** Los tramos de 2026 están publicados; la cuota exacta y el
  tipo de cotización los fija la TGSS.
- **Escala autonómica gallega del IRPF.** Solo están verificados el primer tramo (9,0 %) y el
  último (22,5 %); los intermedios no se publican de forma agregada, así que la aplicación usa
  la escala estatal duplicada como aproximación.
- **Precio medio del vehículo nuevo.** Depende de la Orden anual de precios medios vigente en
  el momento del devengo.
- **Bonificación del ITP gallego para eléctricos.** No confirmada contra el texto vigente.

---

## 4. Comprobaciones técnicas

```bash
npm run dev            # entorno de desarrollo
npm run build          # compilación de producción
npm run check          # 65 aserciones sobre el motor fiscal, económico, facturación y plantillas
npm run catalog:stats  # estadísticas e integridad de la base de vehículos
npm run smoke          # monta las 34 vistas con 3 escenarios de datos y comprueba que ninguna revienta
node scripts/make-icons.mjs  # regenera los iconos de la PWA
```

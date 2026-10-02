# 14 · Identidad, posicionamiento y estilo de la web

> Documento de decisión: **2 de octubre de 2026**.
> Aplica a la web pública (`web/`) y a los textos comerciales que genera el ERP
> (anuncios, fichas web). El ERP interno no cambia.

---

## 0 · Qué se pidió y qué se decidió

Lo que pidió el negocio:

1. **Presencia online mucho más premium y elegante**: que se note que es una
   empresa de venta de vehículos de gran calidad.
2. **No presentarse como «solo importadores»**: también hay vehículos
   nacionales.
3. **No presentar la importación como Alemania y nada más**: se compra en
   cualquier país que compense.
4. **Que quede claro que la garantía mínima es de 1 año (12 meses).**

Y una aclaración que ordena el discurso (no se publica así, pero explica el
negocio): el programa de importación existe porque **compensa**; es una vía de
aprovisionamiento, no la identidad de la empresa. La identidad es *vender
vehículos seleccionados con garantía*.

---

## 1 · Posicionamiento: las tres reglas que gobiernan todos los textos

| Regla | Cómo se escribe | Cómo NO se escribe |
| --- | --- | --- |
| **1. Vendemos vehículos, no «importaciones»** | «Vehículos seleccionados», «stock nacional e importado», «vendemos coches de ocasión de calidad» | «Somos importadores de coches», «importamos tu coche de Alemania» como propuesta principal |
| **2. Nacional e importado, sin jerarquía** | «Comprobamos las dos vías y te decimos qué conviene»; el catálogo etiqueta cada unidad (Nacional / Importado · país) y hay filtro de procedencia | Presentar lo importado como superior o como la única vía de compra |
| **3. Garantía mínima de 12 meses, siempre** | «Garantía mínima de 12 meses, por escrito» en cabecera, ficha, pie, anuncios y datos estructurados | «Garantía incluida» sin plazo, o plazos distintos según la unidad |

Reglas de apoyo:

- **Países**: Alemania primero por volumen y rigor documental, pero se nombran
  los demás mercados (Francia, Bélgica, Países Bajos, Italia, Suiza, Austria,
  Luxemburgo, Portugal) y **también España**. Fuente única:
  `site.origins` en `web/lib/site.js`.
- **Nada de promesas que no se sostengan**: la ficha web solo afirma lo que
  está marcado en la ficha del ERP (libro, llaves, ITV). Si un dato no está,
  no se inventa.
- **Honestidad comercial como argumento**: «importar no siempre es la
  respuesta» es un diferenciador, no una debilidad.

> El nombre comercial (KHC Auto Import) se mantiene: es marca registrada de
> facto y ya tiene dominio y correo. Lo que cambia es el discurso, no la marca.

---

## 2 · Lenguaje visual (web pública)

Diseño «escaparate premium», definido en `web/app/globals.css` como sistema
(`@theme` + clases de componente). Cambiar aquí, no clase a clase.

| Pieza | Decisión |
| --- | --- |
| Colores | **Tinta** (`ink-950…400`, azul noche casi negro), **marfil** (`ivory`, fondos claros cálidos) y **dorado champán** (`gold-500 #b3934e`) como único acento. Nada de amarillos saturados. |
| Tipografía | Titulares en **serif** (`font-display`), cuerpo en sans del sistema, etiquetas en mayúsculas con `tracking` amplio (`.eyebrow`). Sin dependencias de fuentes externas: nada de peticiones a Google Fonts. |
| Estructura | Filetes finos (`border-ink-900/10`) en lugar de sombras; tarjetas con borde de 1 px; radios discretos (`rounded-lg`/`xl`); mucho aire. |
| Jerarquía | Titular grande + entradilla corta + filete + contenido. Numeración `01…04` en los procesos. |
| Botones | Dorado = acción principal; contorno = secundaria; tinta = acción neutra. |
| Fotos | Sin marcos gruesos ni sombras; zoom suave al pasar el ratón (700 ms). |

---

## 3 · Qué ha cambiado, archivo por archivo

### Web pública (`web/`)

| Archivo | Cambio |
| --- | --- |
| `lib/site.js` | Reescrito el discurso: `claim`, `tagline`, `description`, `origins` (9 países) y `pillars` (los cuatro compromisos). Nueva navegación con **Garantía 12 meses** y **Cómo trabajamos**. |
| `app/globals.css` | Sistema de diseño completo (tinta/marfil/dorado, serif en titulares, botones, campos, filetes). |
| `components/Header.jsx` | Franja superior con los dos mensajes fijos (garantía 12 meses · nacional e importado), barra con logotipo tipográfico y menú móvil oscuro. |
| `components/Footer.jsx` | Pie oscuro con compromiso, contacto, bloque «De dónde traemos» y aviso de garantía legal mínima de 1 año. |
| `components/VehicleCard.jsx` | Tarjeta nueva: procedencia (Nacional / Importado · país), precio en serif, ficha técnica en rejilla con filetes y garantía visible. |
| `components/Gallery.jsx`, `ShareButton.jsx`, `WhatsAppFab.jsx`, `LeadForm.jsx`, `Filters.jsx` | Reestilizados al sistema; el filtro añade **procedencia** (nacional / importado). |
| `app/page.jsx` | Portada nueva: hero oscuro, franja de compromisos, stock destacado, cómo trabajamos, **bloque de procedencia** («compramos donde está la unidad correcta»), bloque de garantía, servicios y cierre. |
| `app/coches/page.jsx` y `app/coches/[slug]/page.jsx` | Lenguaje «vehículo»; especificaciones con procedencia; bloques de **garantía mínima** y **procedencia** en cada ficha; datos estructurados con `countryOfOrigin` y `WarrantyPromise`. |
| `app/como-funciona/page.jsx` | Sección explícita «Nacional o importado» con los mercados de compra y 8 preguntas frecuentes reescritas. |
| `app/garantia/page.jsx` | **Página nueva**: coberturas, exclusiones, cómo se hace valer, garantía legal y preguntas frecuentes. |
| `app/encargo/`, `app/compramos-tu-coche/`, `app/contacto/`, `app/not-found.jsx` | Reestilizados y reescritos con el mismo tono. |
| `lib/format.js` | Nueva función `originOf()`: traduce la procedencia de la ficha a lenguaje de cliente sin inventar el origen. |
| `app/sitemap.js`, `app/layout.jsx` | Se añade `/garantia`; metadatos, palabras clave y datos estructurados (`AutoDealer` con mercados de compra) actualizados. |

### ERP (textos que salen al público)

| Archivo | Cambio |
| --- | --- |
| `src/lib/templates.js` | Nuevo `originLabel()` (nacional / importado). Los anuncios de portales dicen **siempre** «Garantía mínima de 12 meses» (respetando plazos mayores). La ficha web que genera el ERP declara la procedencia real y la garantía mínima por escrito. |
| `scripts/check-domain.mjs` | 3 comprobaciones nuevas (garantía en anuncios, etiquetado de procedencia, garantía mínima en la ficha web): 74 en total. |

---

## 4 · Lo que sigue pendiente en la web (datos, no diseño)

Todo esto está marcado con `[PENDIENTE]` en `web/lib/site.js`:

- [ ] **Teléfono y WhatsApp reales** (`phone`, `phoneDisplay`, `whatsapp`). Sin
      ellos, los botones de llamada y WhatsApp no sirven.
- [ ] **NIF/CIF y razón social** al constituir la empresa; sin ellos el aviso
      legal lo dice expresamente.
- [ ] **Dirección** (calle y código postal) cuando haya local. Hoy solo ciudad.
- [ ] **Redes sociales** (Instagram/Facebook) cuando existan.
- [ ] **Fotos reales**: hoy el hero y las fichas de ejemplo usan imágenes
      genéricas. La primera impresión de una web premium son las fotos.
- [ ] **`admin.khcimport.autos` / `app.khcimport.autos`**: el ERP todavía debe
      moverse a su subdominio (ver `docs/13`).
- [ ] **Google Business Profile y Search Console** (ver `docs/13`).

---

## 5 · Cómo mantener la coherencia al editar textos

1. **Mensajes fijos**: si tocas una cabecera, un pie o una ficha, comprueba que
   siguen apareciendo «garantía mínima de 12 meses» y la doble vía nacional /
   importado.
2. **Países**: se editan en un solo sitio (`site.origins`). No escribas listas
   de países a mano en las páginas.
3. **Procedencia de una ficha**: sale de `originCountry` del vehículo. Si un
   coche no trae país, la web dice «Disponible en España» y nunca «importado».
4. **Antes de subir cambios**:
   ```bash
   cd web && npm run build      # compila y detecta enlaces/páginas rotas
   cd .. && npm run check       # 74 comprobaciones, incluidas plantillas y web
   ```
5. **Textos de anuncios**: los genera `buildAd()` en `src/lib/templates.js`.
   Es el único sitio donde hay que tocar el discurso de los portales.

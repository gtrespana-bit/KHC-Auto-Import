# Carpeta de marca — KHC Auto Import

- `LOGO KHC IMPORT.png` — logo oficial original (subido por el equipo, con fondo oscuro).
- `logo-khc.png` — versión derivada con **fondo transparente** (recorte por color del
  fondo oscuro). Es la que muestra el pie de página (`components/Footer.jsx` la detecta
  automáticamente; si se borra, la web vuelve a la réplica SVG `public/images/logo-khc.svg`).
- `logo-khc-header.png` — versión para la cabecera: solo silueta + KHC (sin la línea
  «AUTO IMPORT», ilegible a ese tamaño) recoloreada a tinta oscura para leer sobre el
  fondo marfil. La usa `components/Header.jsx`.
- El favicon (`app/icon.png`) se generó redimensionando el original a 512 px.

Si se sube un logo nuevo: volver a generar `logo-khc.png` con fondo transparente y
`app/icon.png` (512 px) desde el original.

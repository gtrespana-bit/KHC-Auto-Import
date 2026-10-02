export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      // Datos estructurados generados por nosotros a partir del catálogo.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

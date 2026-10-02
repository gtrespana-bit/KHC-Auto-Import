import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Política de privacidad',
  description: 'Información sobre el tratamiento de datos personales de los usuarios del sitio web.',
  alternates: { canonical: '/legal/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Política de privacidad</h1>
      <p className="mt-2 text-sm text-slate-500">Información básica sobre protección de datos (RGPD y LOPDGDD)</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-base font-bold text-slate-900">1. Responsable del tratamiento</h2>
          <p className="mt-2">
            {site.legalName}
            {site.nif ? `, con NIF ${site.nif}` : <span className="pending"> (NIF pendiente de indicar)</span>},{' '}
            con domicilio en {site.address.city} ({site.address.region}), España. Correo de contacto:{' '}
            <a className="text-amber-700 underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">2. Qué datos tratamos y para qué</h2>
          <ul className="mt-2 space-y-2">
            <li>
              <span className="font-semibold text-slate-900">Formularios de contacto, búsqueda y valoración:</span>{' '}
              nombre, teléfono, correo y el contenido de tu mensaje. Finalidad: atender tu solicitud, informarte
              sobre vehículos y, si procede, preparar una propuesta.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Vehículos que nos ofreces para comprar:</span> datos
              del vehículo y del titular que sean necesarios para valorarlo y, en su caso, formalizar la
              compraventa y la transferencia ante la DGT.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Clientes:</span> datos identificativos, fiscales y
              bancarios necesarios para facturar, matricular y entregar el vehículo, y para cumplir las
              obligaciones legales (fiscales, de garantía y de registro de operaciones).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">3. Base jurídica</h2>
          <p className="mt-2">
            El consentimiento que otorgas al enviar un formulario (art. 6.1.a RGPD); la ejecución de un contrato
            o de medidas precontractuales (art. 6.1.b); el cumplimiento de obligaciones legales, en particular
            fiscales y de consumo (art. 6.1.c); y el interés legítimo en atender consultas y defender
            reclamaciones (art. 6.1.f).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">4. Cuánto tiempo los conservamos</h2>
          <p className="mt-2">
            Las consultas que no llegan a convertirse en cliente se conservan como máximo 12 meses. Los datos de
            clientes y las operaciones se conservan durante los plazos legales (con carácter general, 4 años a
            efectos fiscales y 6 años a efectos mercantiles) y, en el caso de las garantías, mientras estén
            vigentes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">5. Destinatarios y encargados</h2>
          <p className="mt-2">
            No cedemos tus datos a terceros salvo obligación legal. Usamos proveedores que actúan como
            encargados del tratamiento: Supabase (base de datos y almacenamiento, con servidores en la Unión
            Europea) y Vercel (alojamiento del sitio web). Ambos ofrecen garantías contractuales conforme al
            RGPD. Si contratamos la financiación con una entidad, los datos necesarios se comunicarán a esa
            entidad con tu consentimiento.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">6. Tus derechos</h2>
          <p className="mt-2">
            Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del
            tratamiento y portabilidad escribiendo a{' '}
            <a className="text-amber-700 underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            , indicando qué derecho ejercitas y adjuntando un documento que acredite tu identidad. También
            puedes reclamar ante la Agencia Española de Protección de Datos (
            <a
              className="text-amber-700 underline"
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.aepd.es
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">7. Seguridad</h2>
          <p className="mt-2">
            Aplicamos medidas técnicas y organizativas apropiadas para proteger los datos: cifrado en tránsito,
            control de acceso por usuario y rol, y acceso restringido a la base de datos mediante políticas de
            seguridad a nivel de fila.
          </p>
        </section>
      </div>
    </div>
  );
}

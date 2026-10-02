import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Aviso legal',
  description: 'Datos identificativos del titular del sitio web y condiciones de uso.',
  alternates: { canonical: '/legal/aviso-legal' },
};

export default function AvisoLegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Aviso legal</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {new Date().getFullYear()}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-base font-bold text-slate-900">1. Titular del sitio web</h2>
          <p className="mt-2">
            En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información y
            Comercio Electrónico (LSSI-CE), se informa de que este sitio web es titularidad de:
          </p>
          <ul className="mt-3 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <li>
              <span className="font-semibold text-slate-900">Denominación:</span> {site.legalName}
            </li>
            <li>
              <span className="font-semibold text-slate-900">NIF/CIF:</span>{' '}
              {site.nif || <span className="pending">pendiente de indicar tras la constitución</span>}
            </li>
            <li>
              <span className="font-semibold text-slate-900">Domicilio:</span>{' '}
              {site.address.street
                ? `${site.address.street}, ${site.address.postalCode} ${site.address.city} (${site.address.region}), España`
                : `${site.address.city} (${site.address.region}), España`}
            </li>
            <li>
              <span className="font-semibold text-slate-900">Correo electrónico:</span>{' '}
              <a className="text-amber-700 underline" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li>
              <span className="font-semibold text-slate-900">Teléfono:</span> {site.phoneDisplay}
            </li>
            {site.reacv && (
              <li>
                <span className="font-semibold text-slate-900">Registro de comerciantes:</span> {site.reacv}
              </li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">2. Objeto y condiciones de uso</h2>
          <p className="mt-2">
            Este sitio web tiene como finalidad informar sobre los vehículos disponibles, los servicios de
            importación y compraventa, y facilitar el contacto con personas interesadas. El acceso y uso del
            sitio atribuye la condición de usuario e implica la aceptación de este aviso legal.
          </p>
          <p className="mt-2">
            La información publicada (características, equipamiento, precios y fotografías) es orientativa y no
            constituye una oferta contractual vinculante. Las condiciones definitivas de cada operación se
            acuerdan por escrito entre las partes antes de la compraventa. Los errores tipográficos o de
            transcripción no generan derechos adquiridos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">3. Vehículos y precios</h2>
          <p className="mt-2">
            Los vehículos anunciados son de segunda mano y se identifican con los datos facilitados por el
            vendedor anterior y verificados en la medida de lo posible. Los precios se expresan en euros, con
            los impuestos indirectos que correspondan incluidos, salvo indicación expresa en contrario. Cualquier
            gasto adicional (transferencia, matriculación u otros) se informará antes de cerrar la operación.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">4. Propiedad intelectual</h2>
          <p className="mt-2">
            Los contenidos de este sitio (textos, fotografías, logotipos y diseño) están protegidos por la
            normativa de propiedad intelectual e industrial. Queda prohibida su reproducción o uso sin
            autorización expresa del titular.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">5. Responsabilidad</h2>
          <p className="mt-2">
            El titular no se responsabiliza del uso que terceros hagan de la información publicada ni de los
            daños derivados de causas ajenas a su control. Los enlaces a sitios de terceros se facilitan
            únicamente a título informativo.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">6. Legislación aplicable</h2>
          <p className="mt-2">
            Esta relación se rige por la legislación española. Para cualquier controversia serán competentes los
            juzgados y tribunales que correspondan conforme a la ley, con los fueros especiales previstos para
            consumidores y usuarios.
          </p>
        </section>
      </div>
    </div>
  );
}

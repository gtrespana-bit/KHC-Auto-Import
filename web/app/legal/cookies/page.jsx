import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Política de cookies',
  description: 'Información sobre el uso de cookies y tecnologías similares en este sitio web.',
  alternates: { canonical: '/legal/cookies' },
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Política de cookies</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-base font-bold text-slate-900">Cookies que utiliza esta web</h2>
          <p className="mt-2">
            <span className="font-semibold text-slate-900">Ninguna cookie de análisis, publicidad o seguimiento.</span>{' '}
            Este sitio no instala cookies con fines publicitarios ni utiliza herramientas de analítica que
            perfilen al visitante, por lo que no se muestra un banner de consentimiento: no hay nada que
            consentir.
          </p>
          <p className="mt-2">
            Únicamente pueden generarse cookies o almacenamiento técnico estrictamente necesarios para el
            funcionamiento del sitio (por ejemplo, preferencias de navegación), que están exentos del deber de
            consentimiento conforme al artículo 22.2 de la LSSI.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">Enlaces a servicios externos</h2>
          <p className="mt-2">
            Los botones de WhatsApp, teléfono y correo simplemente abren la aplicación correspondiente de tu
            dispositivo. Al pulsarlos, el proveedor de ese servicio (por ejemplo, WhatsApp o tu cliente de
            correo) puede tratar tus datos conforme a sus propias políticas, sobre las que no tenemos control.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">Si esto cambia</h2>
          <p className="mt-2">
            Si en el futuro incorporamos analítica o publicidad, actualizaremos esta página y pediremos
            consentimiento previo mediante un panel de configuración de cookies, indicando proveedor, finalidad
            y duración de cada una.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900">Contacto</h2>
          <p className="mt-2">
            Para cualquier duda sobre esta política puedes escribirnos a{' '}
            <a className="text-amber-700 underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

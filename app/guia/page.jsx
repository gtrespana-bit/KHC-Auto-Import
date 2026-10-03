import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import { GUIDE_POSTS } from '@/lib/guia.js';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Guía de compra',
  description:
    'Cómo revisar un coche usado, cuánto cuesta realmente importar de Alemania y cómo detectar un cuentakilómetros manipulado: lo que aplicamos en cada compra, explicado con datos.',
  alternates: { canonical: '/guia' },
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

export default function GuiaPage() {
  return (
    <div>
      <section className="container-x py-14 sm:py-20">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          / <span className="text-ink-600">Guía de compra</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="eyebrow">Guía de compra</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">
            Compra tu próximo coche sabiendo lo que miras
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Publicamos lo mismo que aplicamos al comprar cada unidad: métodos de
            verificación, costes reales con sus tasas y los trucos para detectar fraudes.
            Sin relleno y sin consejos de folleto: datos que sirven para decidir.
          </p>
        </header>

        <div className="mt-14 divide-y divide-ink-900/10 border-y border-ink-900/10">
          {GUIDE_POSTS.map((post) => {
            const cover = post.blocks.find((b) => b.t === 'img');
            return (
              <Link
                key={post.slug}
                href={`/guia/${post.slug}`}
                className="group grid gap-6 py-10 sm:grid-cols-[240px_1fr] sm:gap-10 lg:grid-cols-[320px_1fr]"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-ink-900/10 bg-ivory-dark">
                  {cover && (
                    <Image
                      src={cover.url}
                      alt={cover.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    {fmtDate(post.date)} ·{' '}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readMinutes} min de lectura
                    </span>
                  </p>
                  <h2 className="display mt-3 text-2xl leading-snug text-ink-900 transition group-hover:text-gold-700 sm:text-3xl">
                    {post.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">{post.excerpt}</p>
                  <span className="link-gold mt-5">
                    Leer artículo <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 bg-ink-950 px-8 py-12 text-white sm:px-12">
          <h2 className="display-light text-2xl sm:text-3xl">¿Prefieres que lo miremos nosotros?</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            Todo lo que lees aquí es exactamente lo que aplicamos a cada coche que vendemos en{' '}
            {site.city}. Mira el stock o cuéntanos qué buscas.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/coches" className="btn-gold">
              Ver vehículos disponibles <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/encargo" className="btn-outline-light">
              Pedir búsqueda
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

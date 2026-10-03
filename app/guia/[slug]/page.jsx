import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock } from 'lucide-react';
import GuideBlock from '@/components/GuideBlocks.jsx';
import { GUIDE_POSTS, getPost } from '@/lib/guia.js';
import { site } from '@/lib/site.js';
import JsonLd from '@/components/JsonLd.jsx';

export function generateStaticParams() {
  return GUIDE_POSTS.map((p) => ({ slug: p.slug }));
}

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/guia/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/guia/${post.slug}`,
    },
  };
}

export default async function GuiaPostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const idx = GUIDE_POSTS.findIndex((p) => p.slug === slug);
  const nextPost = GUIDE_POSTS[(idx + 1) % GUIDE_POSTS.length];
  let firstP = true;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    wordCount: undefined,
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name },
    mainEntityOfPage: `${site.url}/guia/${post.slug}`,
  };

  return (
    <div>
      <JsonLd data={articleLd} />
      <article className="container-x py-14 sm:py-16">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          /{' '}
          <Link href="/guia" className="transition hover:text-ink-700">
            Guía de compra
          </Link>
        </nav>

        <header className="mx-auto mt-8 max-w-[720px]">
          <h1 className="display text-3xl leading-[1.15] text-ink-900 sm:text-[2.6rem]">{post.title}</h1>
          <p className="mt-5 text-base leading-relaxed text-ink-500 sm:text-lg">{post.excerpt}</p>
          <p className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            {site.name} · {fmtDate(post.date)} ·{' '}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readMinutes} min de lectura
            </span>
          </p>
        </header>

        <div className="mx-auto mt-4 max-w-[720px]">
          {post.blocks.map((block, i) => {
            const isFirst = block.t === 'p' && firstP && !(firstP = false);
            return <GuideBlock key={i} block={block} first={isFirst} />;
          })}
        </div>

        <footer className="mx-auto mt-16 max-w-[720px] border-t border-ink-900/10 pt-10">
          <div className="bg-ink-950 px-8 py-10 text-white sm:px-10">
            <h2 className="display-light text-2xl">Lo aplicamos en cada coche que vendemos</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Verificación, historial, precio final por escrito y garantía mínima de 12 meses.
              Mira el stock o pide una búsqueda a medida.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/coches" className="btn-gold">
                Ver vehículos disponibles <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contacto" className="btn-outline-light">
                Hablar con nosotros
              </Link>
            </div>
          </div>
          <Link href={`/guia/${nextPost.slug}`} className="group mt-8 flex items-center justify-between gap-4">
            <span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Siguiente artículo</span>
              <span className="mt-1 block font-display text-lg font-semibold text-ink-900 transition group-hover:text-gold-700">
                {nextPost.title}
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-gold-600 transition group-hover:translate-x-1" />
          </Link>
        </footer>
      </article>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Clock, Lightbulb } from 'lucide-react';
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

function Block({ block, first }) {
  switch (block.t) {
    case 'p':
      return (
        <p
          className={`mt-6 text-[15px] leading-[1.85] text-ink-600 sm:text-base sm:leading-[1.9] ${
            first
              ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-5xl first-letter:font-semibold first-letter:leading-[0.9] first-letter:text-gold-600'
              : ''
          }`}
        >
          {block.x}
        </p>
      );
    case 'h2':
      return (
        <h2 className="mt-12 flex items-center gap-3 font-display text-2xl font-semibold text-ink-900 sm:text-[1.7rem]">
          <span className="h-px w-8 shrink-0 bg-gold-500" aria-hidden="true" />
          {block.x}
        </h2>
      );
    case 'ul':
      return (
        <ul className="mt-6 space-y-3">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-600 sm:text-base">
              <Check className="mt-1 h-4 w-4 shrink-0 text-gold-600" strokeWidth={2} />
              {item}
            </li>
          ))}
        </ul>
      );
    case 'tip':
      return (
        <aside className="mt-8 border-l-2 border-gold-500 bg-gold-100/60 px-6 py-5">
          <p className="flex items-center gap-2 font-display text-base font-semibold text-ink-900">
            <Lightbulb className="h-4 w-4 text-gold-600" strokeWidth={1.8} /> {block.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{block.x}</p>
        </aside>
      );
    case 'img':
      return (
        <figure className="mt-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-ink-900/10 bg-ivory-dark">
            <Image src={block.url} alt={block.alt} fill sizes="(max-width: 1024px) 100vw, 720px" className="object-cover" />
          </div>
          {block.caption && <figcaption className="mt-3 text-xs leading-relaxed text-ink-400">{block.caption}</figcaption>}
        </figure>
      );
    case 'data':
      return (
        <div className="mt-8 border border-ink-900/10 bg-white">
          <p className="border-b border-ink-900/10 px-6 py-4 font-display text-base font-semibold text-ink-900">
            {block.title}
          </p>
          <dl className="divide-y divide-ink-900/10">
            {block.rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-6 py-3.5 sm:grid-cols-[1fr_auto] sm:gap-6">
                <dt className="text-sm text-ink-600">{k}</dt>
                <dd className="text-sm font-semibold text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    default:
      return null;
  }
}

export default async function GuiaPostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return null;

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
            return <Block key={i} block={block} first={isFirst} />;
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

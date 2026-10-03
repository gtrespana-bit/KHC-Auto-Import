import Image from 'next/image';
import { Check, Lightbulb } from 'lucide-react';

// Renderizador único de bloques editoriales de la Guía de compra.
// Tipos: p | h2 | ul | tip | data | img. Lo comparten los artículos
// (/guia/[slug]) y las fichas de motor (/guia/motores/[slug]).
export default function GuideBlock({ block, first }) {
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

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = { title: 'Página no encontrada' };

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-28 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="display mt-4 text-3xl sm:text-4xl">Esta página ya no existe</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500">
        Puede que el vehículo que buscabas se haya vendido o que el enlace esté mal. Mira el stock
        disponible o cuéntanos qué buscas: te lo encontramos.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/coches" className="btn-gold">
          Ver vehículos disponibles <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/encargo" className="btn-outline">
          Pedir búsqueda
        </Link>
      </div>
    </div>
  );
}

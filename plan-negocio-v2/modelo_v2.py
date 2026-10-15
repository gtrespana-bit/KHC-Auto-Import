#!/usr/bin/env python3
"""MODELO v2 — simulación mensual del negocio de importación DE→ES.

Diseño nuevo (no reutiliza nada de plan-negocio/):
  * Motor determinista mes a mes, con "pipeline" simple: cada coche comprado
    vuelve a caja `dias` después (lead 7 días + días en venta), no al instante.
  * El catálogo NO lo elige una lista fija heredada: lo filtra la regla
    margen>=2.500 € y spread>=12 % aplicada sobre los precios reales medidos
    desde tus propios datos capturados (ver datos.CATALOGO).
  * Estructura de costes ligera: se empieza SIN nave; la nave (600 €/mes)
    solo se abre cuando la caja puede sostener 3 meses extra de fijos.
  * Compara dos formas jurídicas: autónomo REBU vs SL microempresa.
  * Salida: por escenario de capital → nº de coches/año, beneficio neto,
    caja mínima, punto de equilibrio y calendario de los 12 primeros meses.

Uso:  python3 modelo_v2.py            (todos los escenarios)
      python3 modelo_v2.py --meses 24
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass, field
import datos as D

DIAS_MES = 30.0


# --------------------------------------------------------------------------
# Selección de catálogo por regla de datos
# --------------------------------------------------------------------------
@dataclass
class Coche:
    nick: str
    desc: str
    compra: float
    venta_anuncio: float
    co2: float
    dias_venta: float
    spread: float

    @property
    def venta_neta(self):          # tras regateo medio
        return self.venta_anuncio * (1 - D.REGATEO)

    def coste_puesto(self) -> float:
        """Coche + logística + impuestos + puesta en mercado."""
        imp = D.iedmt(self.co2, self.compra)
        prep = (D.PREPARE + D.MANTENIMIENTO + D.GARANTIA + D.ANUNCIOS
                + D.IMPREVISTOS + D.COSTE_ADMIN)
        return self.compra + D.LOGISTICA_POR_COACHE + imp + prep

    def margen_bruto(self) -> float:
        return self.venta_neta - self.coste_puesto()

    def iva_rebu(self) -> float:
        return max(0.0, self.margen_bruto()) * D.IVA_REBU


def cargar_catalogo(verbose=True):
    coches = []
    for (nick, compra, venta, co2, dias, nDE, nES, spread, desc) in D.CATALOGO:
        c = Coche(nick, desc, compra, venta, co2, float(dias), spread)
        coches.append(c)
    aprobados = [c for c in coches
                 if c.margen_bruto() >= D.UMBRAL_MARGEN_MINIMO
                 and c.spread >= D.UMBRAL_SPREAD_MINIMO]
    if verbose:
        print("=" * 96)
        print("PASO 1 — FILTRO DEL CATÁLOGO CON DATOS REALES (mediana anuncio DE vs ES)")
        print("=" * 96)
        print(f"{'modelo':16s}{'compraDE':>9s}{'ventaES':>9s}{'IEDMT':>7s}{'coste':>8s}"
              f"{'margen':>8s}{'spread':>8s}  veredicto")
        for c in sorted(coches, key=lambda x: -x.margen_bruto()):
            sp = c.spread
            ok = "ENTRA" if (c.margen_bruto() >= D.UMBRAL_MARGEN_MINIMO and sp >= D.UMBRAL_SPREAD_MINIMO) else "fuera"
            print(f"{c.nick:16s}{c.compra:9,.0f}{c.venta_neta:9,.0f}"
                  f"{D.iedmt(c.co2, c.compra):7,.0f}{c.coste_puesto():8,.0f}"
                  f"{c.margen_bruto():8,.0f}{c.spread:7.1f}%  {ok}")
        print(f"\nCatálogo aprobado: {', '.join(c.nick for c in aprobados)}")
    return aprobados


# --------------------------------------------------------------------------
# Simulación
# --------------------------------------------------------------------------
@dataclass
class Resultado:
    capital: float
    meses: int
    ventas: int = 0
    compras: int = 0
    caja: float = 0.0
    caja_min: float = float("inf")
    ingresos: float = 0.0
    costes_directos: float = 0.0
    fijos: float = 0.0
    iva: float = 0.0
    is_or_irpf: float = 0.0
    margen_realizado: float = 0.0
    margen_comprado: float = 0.0
    stock_final_coste: float = 0.0
    nave_mes: int = 0
    log: list = field(default_factory=list)

    @property
    def beneficio(self):
        # En devengo: margen de TODO lo comprado (vendido o aún en stock)
        # menos fijos menos impuesto. El IVA REBU no es coste: se repercute.
        return self.margen_comprado - self.fijos - self.is_or_irpf


def simular(capital, coches, meses=12, forma="SL", nave=False, seed_pool=None):
    """Motor simple:
       - Cada mes se compra 1 coche si hay caja > coste + colchón (2 meses fijos).
       - El cobro entra `lead + dias_venta` días después de la compra.
       - La nave se abre automáticamente cuando caja > 3 meses de fijos fase2.
    """
    lead = 7.0  # días: búsqueda, vuelo, compra, vuelta, prep y anuncio
    fijo1 = sum(D.FIJO_FASE1.values())
    fijo2 = fijo1 + sum(D.FIJO_FASE2_EXTRA.values())
    caja = capital
    pipeline = []           # (mes_de_cobro, coche)
    stock_coste = []        # coste inmovilizado (para ratio)
    ventas = compras = 0
    ingresos = directos = gastofijos = ivareca = margen_real = margen_comprado = 0.0
    dias_transcurridos = 0.0
    r = Resultado(capital, meses)
    nave_mes = 0
    pool = seed_pool or list(range(len(coches)))
    for m in range(1, meses + 1):
        # cobros pendientes: entran cuando se cumplen los días desde la compra
        nuevos_pipe = []
        for (dia_cobro, c) in pipeline:
            if dia_cobro <= dias_transcurridos:
                caja += c.venta_neta
                ingresos += c.venta_neta
                ivareca += c.iva_rebu()
                margen_real += c.margen_bruto()
                ventas += 1
                stock_coste.remove(c.coste_puesto())
            else:
                nuevos_pipe.append((dia_cobro, c))
        pipeline = nuevos_pipe

        # la nave solo se abre si el escenario lo pide desde el inicio

        fijos_mes = fijo2 if nave else fijo1
        caja -= fijos_mes / 1.0
        gastofijos += fijos_mes

        # política de compra: se puede comprar más de un coche por mes si la
        # caja lo permite; entre compra y compra pasan >= 7 días (logística).
        compras_posibles = max(1, int(DIAS_MES // 7))
        for _ in range(compras_posibles):
            if not coches:
                break
            # elegir el modelo aprobado con mayor margen que quepa
            candidatos = sorted(coches, key=lambda x: -x.margen_bruto())
            comprado = None
            for c in candidatos:
                need = c.coste_puesto()
                colchon = fijos_mes * 2 + c.iva_rebu()
                if caja - need >= colchon:
                    comprado = c
                    break
            if not comprado:
                break
            c = comprado
            need = c.coste_puesto()
            caja -= need
            directos += need
            compras += 1
            margen_comprado += c.margen_bruto()
            stock_coste.append(need)
            dur = lead + c.dias_venta
            pipeline.append((dias_transcurridos + dur, c))

        r.caja_min = min(r.caja_min, caja)
        r.log.append(dict(mes=m, caja=round(caja), stock=len(stock_coste),
                          ventas_acum=ventas, compras_acum=compras))
        dias_transcurridos += DIAS_MES

    # liquidación fiscal del resultado del periodo
    base = margen_real - gastofijos  # margen realizado (solo ventas cobradas) - fijos
    if base > 0:
        if forma == "SL":
            tax = min(base, 50_000) * 0.19 + max(0.0, base - 50_000) * 0.21
        else:  # autónomo ahorro
            tax = min(base, 6_000) * 0.19 + max(0, min(base, 50_000) - 6_000) * 0.21 \
                  + max(0, min(base, 200_000) - 50_000) * 0.23
        caja -= tax
    else:
        tax = 0.0
    r.ventas, r.compras = ventas, compras
    r.caja, r.ingresos, r.costes_directos = caja, ingresos, directos
    r.fijos, r.iva, r.is_or_irpf = gastofijos, ivareca, tax
    r.margen_realizado = margen_real
    r.margen_comprado = margen_comprado
    r.stock_final_coste = sum(stock_coste)
    if r.caja_min == float("inf"):
        r.caja_min = caja
    return r


def informe(coches, meses):
    print("\n" + "=" * 96)
    print(f"PASO 2 — SIMULACIÓN {MESES_LABEL[meses]} · catálogo filtrado ({len(coches)} modelos)")
    print("=" * 96)
    for cap in D.CAPITAL_ESCENARIOS:
        for forma in ("SL", "AUTONOMO"):
            for nave in (False, True):
                r = simular(cap, coches, meses=meses, forma=forma, nave=nave)
            print(f"capital {cap:>7,.0f} € · {forma:9s} · {"CON NAVE " if nave else "SIN NAVE"} → "
                  f"compras {r.compras:2d}, ventas {r.ventas:2d}, "
                  f"margen comprado {r.margen_comprado:>7,.0f} (vendido {r.margen_realizado:>6,.0f}), fijos {r.fijos:>6,.0f}, "
                  f"impuesto {r.is_or_irpf:>6,.0f}, beneficio {r.beneficio:>7,.0f} €, "
                  f"caja final {r.caja:>8,.0f} € (min {r.caja_min:>8,.0f}), "
                  f"stock pendiente {r.stock_final_coste:>7,.0f} €")
    # sensibilidad: ¿qué pasa si los dias de venta se duplican?
    lentos = [Coche(c.nick, c.desc, c.compra, c.venta_anuncio, c.co2, c.dias_venta * 2, c.spread) for c in coches]
    print("\nSensibilidad (días de venta x2, mismo capital):")
    for cap in D.CAPITAL_ESCENARIOS:
        r = simular(cap, lentos, meses=meses, forma="SL")
        print(f"  capital {cap:>7,.0f} € → ventas {r.ventas:2d}, caja final {r.caja:>8,.0f} €")


MESES_LABEL = {12: "AÑO 1", 24: "2 AÑOS", 6: "MEDIA ANUAL (6 meses)"}



def paso3(coches, meses=12):
    print("\n" + "=" * 96)
    print("PASO 3 — BÚSQUEDA DEL PUNTO DE EQUILIBRIO")
    print("=" * 96)
    if not coches:
        print("Catálogo vacío: no hay negocio posible con estos umbrales.")
        return
    mejor = max(coches, key=lambda c: c.margen_bruto())
    fijo1 = sum(D.FIJO_FASE1.values()); fijo2 = fijo1 + sum(D.FIJO_FASE2_EXTRA.values())
    print(f"Mejor modelo aprobado: {mejor.nick} · margen bruto/coche {mejor.margen_bruto():,.0f} €")
    print(f"Ventas mínimas para cubrir fijos SIN nave (año): {fijo1*meses/mejor.margen_bruto():.1f} coches")
    print(f"Ventas mínimas CON nave (año):                    {fijo2*meses/mejor.margen_bruto():.1f} coches")
    # barrido de capital
    print("\nBarrido de capital inicial (SL, sin nave, 12 meses):")
    for cap in range(20_000, 90_001, 10_000):
        r = simular(float(cap), coches, meses=12, forma="SL", nave=False)
        estado = "VIABLE" if r.beneficio > 0 else "no"
        print(f"  {cap:>6,.0f} € → compras {r.compras:2d}, ventas {r.ventas:2d}, "
              f"beneficio {r.beneficio:>8,.0f} €  [{estado}]")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--meses", type=int, default=12)
    args = ap.parse_args()
    coches = cargar_catalogo()
    informe(coches, args.meses)
    paso3(coches, args.meses)

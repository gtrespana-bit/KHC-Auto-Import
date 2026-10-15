#!/usr/bin/env python3
"""Gráficos profesionales para el PDF v7 (mismo motor de datos: mes_a_mes_v6)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

# Paleta corporativa del documento
NAVY   = "#1F3864"
BLUE   = "#2E75B6"
TEAL   = "#148F77"
GREEN  = "#2E8540"
RED    = "#C0392B"
AMBER  = "#D68910"
GREY   = "#8A8F98"
LIGHT  = "#E8EDF4"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "axes.edgecolor": "#B7C0CC",
    "axes.linewidth": 0.8,
    "axes.grid": True,
    "grid.color": "#DDE3EA",
    "grid.linewidth": 0.6,
    "axes.axisbelow": True,
    "xtick.color": "#444B55",
    "ytick.color": "#444B55",
    "axes.labelcolor": NAVY,
})

eur = FuncFormatter(lambda v, p: f"{v:,.0f}".replace(",", ".") + " €")


def caja_y_stock(df):
    """df: lista de dicts por mes con caja_fin y stock_coste."""
    fig, ax = plt.subplots(figsize=(7.4, 3.0), dpi=200)
    meses = [d["mes"] for d in df]
    caja = [d["caja_fin"] for d in df]
    stk = [d["stock_coste"] for d in df]
    ax.bar(meses, caja, color=BLUE, label="Caja fin de mes", width=0.62)
    ax.bar(meses, stk, bottom=caja, color=LIGHT, edgecolor="#B7C0CC",
           linewidth=0.5, label="Capital inmovilizado en stock", width=0.62)
    ax.axhline(3000, color=RED, lw=1.1, ls="--", label="Reserva mínima operativa (3.000 €)")
    ax.set_ylabel("Miles de €")
    ax.set_xlabel("Mes")
    ax.xaxis.set_major_locator(plt.MultipleLocator(1))
    ax.yaxis.set_major_formatter(eur)
    ax.legend(loc="upper right", fontsize=7.5, framealpha=0.95)
    ax.set_title("Evolución de la caja y del capital inmovilizado en vehículos",
                 fontsize=10, color=NAVY, fontweight="bold", loc="left")
    fig.tight_layout()
    fig.savefig("fig_caja_stock.png"); plt.close(fig)


def resultados_mes(df):
    """Margen ganado vs gastos pagados por mes (fijos+SS+sueldos/retiros)."""
    fig, ax = plt.subplots(figsize=(7.4, 3.0), dpi=200)
    meses = [d["mes"] for d in df]
    margen = [d["margen_mes"] for d in df]
    gastos = [d["gastos_mes"] for d in df]
    neto = [m - g for m, g in zip(margen, gastos)]
    ax.bar([m - 0.17 for m in meses], margen, width=0.34, color=TEAL, label="Margen bruto ganado (devengado)")
    ax.bar([m + 0.17 for m in meses], [-g for g in gastos], width=0.34, color=AMBER, label="Gastos del mes (fijos + SS + familia)")
    ax.plot(meses, neto, color=NAVY, marker="o", ms=3.5, lw=1.4, label="Resultado neto del mes")
    ax.axhline(0, color="#444B55", lw=0.8)
    ax.set_xticks(meses)
    ax.yaxis.set_major_formatter(eur)
    ax.legend(loc="lower right", fontsize=7.5, framealpha=0.95)
    ax.set_title("Margen generado frente a gastos, mes a mes",
                 fontsize=10, color=NAVY, fontweight="bold", loc="left")
    fig.tight_layout()
    fig.savefig("fig_resultados.png"); plt.close(fig)


def apalancamiento():
    """€ de beneficio por cada € y día de capital inmovilizado (ranking cartera).

    Calculado EN VIVO desde el motor (mes_a_mes_v6.gira + catalogo): ‰ = margen / (landed * dias) * 1000.
    Se muestran los 8 mejores; los excluidos por capital (landed > 26k) van al final con su valor real."""
    import re as _re, io as _io, contextlib as _ctx
    with _ctx.redirect_stdout(_io.StringIO()):
        import mes_a_mes_v6 as _M
    ranked = []
    for u in _M.gira:
        eff = u.margen / (u.landed * u.days) * 1000.0
        ranked.append((u.nick, round(eff, 2)))
    ranked = ranked[:8]
    data = ranked[::-1]          # barh dibuja de abajo arriba: invierto para que el mejor quede arriba
    names = [d[0] for d in data]; vals = [d[1] for d in data]
    colors = [GREEN if v >= 3 else (BLUE if v >= 2 else GREY) for v in vals]
    fig, ax = plt.subplots(figsize=(7.4, 2.9), dpi=200)
    ax.barh(names, vals, color=colors, height=0.62)
    for i, v in enumerate(vals):
        ax.text(v + 0.06, i, f"{v:.2f} ‰", va="center", fontsize=7.5, color="#333")
    ax.set_xlim(0, 5.2)
    ax.set_xlabel("‰ (milésimas) — margen por cada € inmovilizado durante un día")
    ax.grid(axis="y", visible=False)
    ax.set_title("Ranking de rotación de la cartera: dónde trabaja mejor cada euro",
                 fontsize=10, color=NAVY, fontweight="bold", loc="left")
    fig.tight_layout()
    fig.savefig("fig_apalancamiento.png"); plt.close(fig)


if __name__ == "__main__":
    import io, contextlib, csv
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        import mes_a_mes_v6 as M
    rows = list(csv.DictReader(open("detalle_v6.csv", encoding="utf-8"), delimiter=";"))
    # reconstruir por mes desde el txt maestro ya validado
    import re
    txt = open("calendario_v6.txt", encoding="utf-8").read()
    master = {}
    for ln in txt.splitlines():
        mo = re.match(r"\s*(\d{1,2})\s+([\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)\s+([\d\.]+)\s+(\d+)\s+([\d\.]+)\s*$", ln)
        if mo:
            m = int(mo.group(1))
            if 1 <= m <= 12 and m not in master:
                f = lambda s: float(s.replace(".", "").replace("-", "-")) if s not in ("-",) else 0.0
                fv = lambda s: -f(s[1:]) if s.startswith("-") else f(s)
                master[m] = dict(caja_ini=f(mo.group(2)), cobros=f(mo.group(3)),
                                 compras=-fv(mo.group(4)), fijos=-fv(mo.group(5)), ss=-fv(mo.group(6)),
                                 sueldos=-fv(mo.group(7)), retiros=-fv(mo.group(8)),
                                 impuestos=-fv(mo.group(9)), caja_fin=f(mo.group(10)),
                                 stock_n=int(mo.group(11)), deuda_de=f(mo.group(12)))
    assert len(master) == 12, f"tabla maestra incompleta: {sorted(master)}"
    sc = re.findall(r"MES (\d+)  \|.*?\n(?:.*?\n)*?.*?STOCK FIN DE MES \((\d) uds, coste inmovilizado ([\d\.]+) €", txt)
    # más robusto: recorrer líneas
    cur = None
    for line in txt.splitlines():
        mm0 = re.match(r"MES (\d+)  \|", line)
        if mm0: cur = int(mm0.group(1))
        mm2 = re.search(r"STOCK FIN DE MES \(\d+ uds, coste inmovilizado ([\d\.]+) €", line)
        if mm2 and cur: master[cur]["stock_coste"] = float(mm2.group(1).replace(".", ""))
    # margen devengado por mes: suma de margenes de ventas
    ventas_margen = {}
    for u_id, mm in re.findall(r"(U\d\d) .*?vendido por [\d\.]+ € · margen ([\d\.]+) €", txt):
        pass
    for line in txt.splitlines():
        s = line.strip()
        if s.startswith("MES ") and "caja inicial" in s:
            cur = int(re.search(r"MES (\d+)", s).group(1)); ventas_margen.setdefault(cur, 0.0)
        if "vendido por" in s:
            vg = re.search(r"margen ([\d\.]+) €", s)
            if vg: ventas_margen[cur] += float(vg.group(1).replace(".", ""))
    df = []
    for m in range(1, 13):
        d = master[m]
        gastos = abs(d["fijos"]) + abs(d["ss"]) + abs(d["sueldos"]) + abs(d["retiros"])
        df.append(dict(mes=m, caja_fin=d["caja_fin"], stock_coste=d.get("stock_coste", 0),
                       margen_mes=ventas_margen.get(m, 0), gastos_mes=gastos))
    caja_y_stock(df); resultados_mes(df); apalancamiento()
    print("OK figuras:", ", ".join(["fig_caja_stock.png", "fig_resultados.png", "fig_apalancamiento.png"]))

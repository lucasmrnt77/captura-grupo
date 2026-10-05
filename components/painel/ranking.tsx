import Link from "next/link"
import { num } from "@/lib/painel/formato"

type Item = { valor: string; n: number }

/** Barras horizontais com o número escrito ao lado. Clicar filtra o painel por aquele valor. */
export function Ranking({ titulo, itens, total, ativo, href, limite = 8 }: {
  titulo: string; itens: Item[]; total: number; ativo?: string; href: (valor: string | null) => string; limite?: number
}) {
  const topo = itens.slice(0, limite)
  const resto = itens.slice(limite).reduce((s, i) => s + i.n, 0)
  const max = Math.max(1, ...topo.map((i) => i.n))
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {ativo && <Link href={href(null)} className="text-xs text-[var(--series-1)] hover:underline">limpar filtro</Link>}
      </div>
      {topo.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">Sem dados no período.</p>
      ) : (
        <ul className="space-y-2">
          {topo.map((i) => {
            const pct = total ? Math.round((i.n / total) * 100) : 0
            const sel = ativo === i.valor
            return (
              <li key={i.valor}>
                <Link
                  href={href(sel ? null : i.valor)}
                  title={sel ? "Remover filtro" : `Filtrar por ${i.valor}`}
                  className={`group block rounded-md px-1.5 py-1 -mx-1.5 hover:bg-[var(--surface-0)] ${sel ? "ring-1 ring-[var(--series-1)]" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{i.valor}</span>
                    <span className="tabular shrink-0"><strong>{num(i.n)}</strong> <span className="text-[var(--text-muted)]">{pct}%</span></span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--surface-0)]">
                    <div className="h-full rounded-full" style={{ width: `${(i.n / max) * 100}%`, background: "var(--series-1)" }} />
                  </div>
                </Link>
              </li>
            )
          })}
          {resto > 0 && (
            <li className="flex justify-between px-0 pt-1 text-sm text-[var(--text-secondary)]">
              <span>Outros ({itens.length - limite})</span><span className="tabular">{num(resto)}</span>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

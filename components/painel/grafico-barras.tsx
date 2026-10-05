"use client"

import { useState } from "react"

export type Ponto = { chave: string; rotulo: string; rotuloLongo: string; n: number }

/**
 * Barras verticais de uma série só (quantidade por dia ou por hora).
 * Passe o mouse/foco numa barra para ver o valor; a área de toque é a coluna inteira.
 */
export function GraficoBarras({ pontos, titulo, unidade }: { pontos: Ponto[]; titulo: string; unidade: string }) {
  const [ativo, setAtivo] = useState<number | null>(null)
  const max = Math.max(1, ...pontos.map((p) => p.n))
  const passo = Math.ceil(max / 4) || 1
  const topo = passo * 4
  const marcas = [0, 1, 2, 3, 4].map((i) => i * passo)
  const passoRotulo = pontos.length <= 8 ? 1 : Math.ceil(pontos.length / 7)
  const mostrarRotulo = (i: number) => i % passoRotulo === 0
  const p = ativo !== null ? pontos[ativo] : null

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{titulo}</figcaption>
      <div className="relative flex h-56 gap-3">
        {/* eixo y */}
        <div className="tabular flex w-8 shrink-0 flex-col-reverse justify-between text-right text-[11px] text-[var(--text-muted)]">
          {marcas.map((m) => <span key={m} className="-mb-1.5 leading-3">{m}</span>)}
        </div>
        <div className="relative flex-1">
          {marcas.map((m) => (
            <div key={m} className="pointer-events-none absolute inset-x-0 border-t border-[var(--line)]" style={{ bottom: `${(m / topo) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" onPointerLeave={() => setAtivo(null)}>
            {pontos.map((pt, i) => (
              <button
                key={pt.chave}
                type="button"
                aria-label={`${pt.rotuloLongo}: ${pt.n} ${unidade}`}
                onPointerEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onBlur={() => setAtivo(null)}
                className="group relative flex h-full min-w-0 flex-1 items-end outline-none"
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-opacity ${ativo !== null && ativo !== i ? "opacity-50" : ""}`}
                  style={{ height: pt.n ? `max(2px, ${(pt.n / topo) * 100}%)` : 0, background: "var(--series-1)" }}
                />
                {ativo === i && <span className="pointer-events-none absolute inset-0 rounded bg-[var(--series-1-soft)] opacity-40" />}
              </button>
            ))}
          </div>
          {p && ativo !== null && (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[var(--line)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs shadow-md"
              style={{ left: `${((ativo + 0.5) / pontos.length) * 100}%` }}
            >
              <strong className="tabular text-sm">{p.n}</strong> <span className="text-[var(--text-secondary)]">{unidade} · {p.rotuloLongo}</span>
            </div>
          )}
        </div>
      </div>
      {/* eixo x: poucos rótulos, centralizados na barra, sem cortar */}
      <div className="relative ml-11 mt-1.5 h-4 text-[11px] text-[var(--text-muted)]">
        {pontos.map((pt, i) => mostrarRotulo(i) && (
          <span key={pt.chave} className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / pontos.length) * 100}%` }}>{pt.rotulo}</span>
        ))}
      </div>
      {/* versão em tabela (leitores de tela / sem mouse) */}
      <details className="mt-3 text-xs text-[var(--text-secondary)]">
        <summary className="cursor-pointer select-none">Ver em tabela</summary>
        <table className="tabular mt-2 w-full max-w-xs">
          <tbody>
            {pontos.map((pt) => (
              <tr key={pt.chave} className="border-b border-[var(--line)]"><td className="py-0.5">{pt.rotuloLongo}</td><td className="py-0.5 text-right">{pt.n}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

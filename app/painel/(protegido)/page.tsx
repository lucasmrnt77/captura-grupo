import Link from "next/link"
import { rpc, listar } from "@/lib/painel/supabase"
import { argsResumo, DIMENSOES, hojeUY, hrefCom, lerFiltros, PERIODOS, queryLista, somarDias, type Dimensao } from "@/lib/painel/filtros"
import { dataHora, diaCurto, num, telefoneBonito } from "@/lib/painel/formato"
import { GraficoBarras, type Ponto } from "@/components/painel/grafico-barras"
import { Ranking } from "@/components/painel/ranking"
import { AutoAtualizar } from "@/components/painel/auto-atualizar"

export const dynamic = "force-dynamic"

type Item = { valor: string; n: number }
type Resumo = {
  total: number; repetidas: number; hoje: number; primeira: string | null
  por_dia: { dia: string; n: number }[]; por_hora: { hora: number; n: number }[]
  por_pais: Item[]; por_source: Item[]; por_campaign: Item[]; por_content: Item[]
}
type Linha = {
  id: number; creado_en: string; email: string; telefono: string; pais: string | null
  utm_source: string | null; utm_campaign: string | null; utm_content: string | null; envios: number
}

const POR_PAGINA = 50

export default async function Painel({ searchParams }: PageProps<"/painel">) {
  const f = lerFiltros(await searchParams)
  const [r, lista] = await Promise.all([
    rpc<Resumo>("painel_resumo", argsResumo(f)),
    listar<Linha>("inscripciones", queryLista(f, "id,creado_en,email,telefono,pais,utm_source,utm_campaign,utm_content,envios"),
      (f.pagina - 1) * POR_PAGINA, f.pagina * POR_PAGINA - 1),
  ])

  // Série do gráfico: por hora quando o período é "hoje"; por dia nos demais (dias sem inscrição = 0)
  let pontos: Ponto[]
  let tituloGrafico: string
  if (f.periodo === "hoje") {
    const m = new Map(r.por_hora.map((h) => [h.hora, h.n]))
    pontos = Array.from({ length: 24 }, (_, h) => ({ chave: String(h), rotulo: `${h}h`, rotuloLongo: `${String(h).padStart(2, "0")}h–${String(h).padStart(2, "0")}h59`, n: m.get(h) ?? 0 }))
    tituloGrafico = "Inscrições por hora (hoje, horário do Uruguai)"
  } else {
    const m = new Map(r.por_dia.map((d) => [d.dia, d.n]))
    const fim = hojeUY()
    const inicio = f.periodo === "7d" ? somarDias(fim, -6) : f.periodo === "30d" ? somarDias(fim, -29) : (r.por_dia[0]?.dia ?? fim)
    pontos = []
    for (let d = inicio; d <= fim; d = somarDias(d, 1)) pontos.push({ chave: d, rotulo: diaCurto(d), rotuloLongo: diaCurto(d, true), n: m.get(d) ?? 0 })
    tituloGrafico = "Inscrições por dia (horário do Uruguai)"
  }
  const dias = f.periodo === "hoje" ? 1 : pontos.length
  const media = dias ? r.total / dias : 0
  const paginas = Math.max(1, Math.ceil(lista.total / POR_PAGINA))
  const filtrosAtivos = DIMENSOES.filter((d) => f.dims[d.chave])
  const exportar = hrefCom(f, {}).replace("/painel?", "/painel/exportar?")

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <AutoAtualizar segundos={60} />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Inscrições do grupo</h1>
          <p className="text-sm text-[var(--text-secondary)]">Página do grupo gratuito de WhatsApp · atualiza a cada minuto</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={exportar} className="rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--surface-0)]">Exportar CSV</a>
          <form action="/painel/sair" method="post">
            <button className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)]">Sair</button>
          </form>
        </div>
      </header>

      {/* Filtros: período + filtros ativos, numa linha só */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <nav className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface-1)] p-0.5" aria-label="Período">
          {PERIODOS.map((p) => (
            <Link key={p.valor} href={hrefCom(f, { periodo: p.valor })} aria-current={f.periodo === p.valor ? "page" : undefined}
              className={`rounded-md px-3 py-1 text-sm ${f.periodo === p.valor ? "bg-[var(--text-primary)] font-semibold text-[var(--surface-1)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
              {p.rotulo}
            </Link>
          ))}
        </nav>
        {filtrosAtivos.map((d) => (
          <Link key={d.chave} href={hrefCom(f, { [d.chave]: null })}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--series-1)] px-3 py-1 text-xs" title="Remover filtro">
            <span className="text-[var(--text-secondary)]">{d.rotulo.split(" (")[0]}:</span> <strong>{f.dims[d.chave]}</strong> <span aria-hidden>✕</span>
          </Link>
        ))}
      </div>

      {/* Números principais */}
      <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi rotulo={`Inscrições · ${PERIODOS.find((p) => p.valor === f.periodo)!.rotulo.toLowerCase()}`} valor={num(r.total)} />
        <Kpi rotulo="Hoje" valor={num(r.hoje)} detalhe="desde 00h do Uruguai" />
        <Kpi rotulo="Média por dia" valor={media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} detalhe={f.periodo === "tudo" && r.primeira ? `desde ${dataHora(r.primeira).split(",")[0]}` : undefined} />
        <Kpi rotulo="Se inscreveram mais de 1 vez" valor={num(r.repetidas)} detalhe={r.total ? `${Math.round((r.repetidas / r.total) * 100)}% do total` : undefined} />
      </section>

      <section className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
        <h2 className="mb-4 text-sm font-semibold">{tituloGrafico}</h2>
        <GraficoBarras pontos={pontos} titulo={tituloGrafico} unidade="inscrições" />
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {DIMENSOES.map((d) => (
          <Ranking key={d.chave} titulo={d.rotulo} itens={r[`por_${d.chave}` as `por_${Dimensao}`]} total={r.total}
            ativo={f.dims[d.chave]} href={(v) => hrefCom(f, { [d.chave]: v })} />
        ))}
      </div>

      {/* Lista */}
      <section className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-1)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-semibold">Inscritos <span className="tabular font-normal text-[var(--text-muted)]">({num(lista.total)})</span></h2>
          <form action="/painel" className="flex gap-2">
            <input type="hidden" name="periodo" value={f.periodo} />
            {filtrosAtivos.map((d) => <input key={d.chave} type="hidden" name={d.chave} value={f.dims[d.chave]} />)}
            <input name="q" defaultValue={f.q} placeholder="Buscar e-mail ou WhatsApp"
              className="w-56 rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-1.5 text-sm outline-none focus:border-[var(--series-1)]" />
            <button className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm hover:bg-[var(--surface-0)]">Buscar</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs text-[var(--text-secondary)]">
                {["Inscrito em", "E-mail", "WhatsApp", "País", "Origem", "Campanha", "Anúncio", "Vezes"].map((c) => <th key={c} className="px-4 py-2 font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {lista.linhas.map((l) => (
                <tr key={l.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface-0)]">
                  <td className="tabular whitespace-nowrap px-4 py-2">{dataHora(l.creado_en)}</td>
                  <td className="max-w-[220px] truncate px-4 py-2" title={l.email}>{l.email}</td>
                  <td className="tabular whitespace-nowrap px-4 py-2">
                    <a href={`https://wa.me/${l.telefono}`} target="_blank" rel="noreferrer" className="text-[var(--series-1)] hover:underline">{telefoneBonito(l.telefono)}</a>
                  </td>
                  <td className="px-4 py-2">{l.pais ?? "—"}</td>
                  <td className="px-4 py-2">{l.utm_source ?? "—"}</td>
                  <td className="max-w-[160px] truncate px-4 py-2" title={l.utm_campaign ?? ""}>{l.utm_campaign ?? "—"}</td>
                  <td className="max-w-[140px] truncate px-4 py-2" title={l.utm_content ?? ""}>{l.utm_content ?? "—"}</td>
                  <td className="tabular px-4 py-2">{l.envios}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.linhas.length === 0 && <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Nenhuma inscrição com esses filtros.</p>}
        </div>
        {paginas > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2 text-xs text-[var(--text-secondary)]">
            <span className="tabular">Página {f.pagina} de {paginas}</span>
            <div className="flex gap-2">
              {f.pagina > 1 && <Link className="rounded border border-[var(--line)] px-2 py-1 hover:bg-[var(--surface-0)]" href={hrefCom(f, { pagina: String(f.pagina - 1) })}>← Anterior</Link>}
              {f.pagina < paginas && <Link className="rounded border border-[var(--line)] px-2 py-1 hover:bg-[var(--surface-0)]" href={hrefCom(f, { pagina: String(f.pagina + 1) })}>Próxima →</Link>}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Kpi({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
      <div className="text-xs font-medium text-[var(--text-secondary)]">{rotulo}</div>
      <div className="tabular mt-1 text-2xl font-semibold">{valor}</div>
      {detalhe && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{detalhe}</div>}
    </div>
  )
}

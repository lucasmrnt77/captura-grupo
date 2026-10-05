/** Período e filtros do painel, lidos da URL. Fuso: Uruguai (UTC-3, sem horário de verão). */
export const FUSO = "America/Montevideo"
const OFFSET = "-03:00"

export const PERIODOS = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7d", rotulo: "7 dias" },
  { valor: "30d", rotulo: "30 dias" },
  { valor: "tudo", rotulo: "Tudo" },
] as const
export type Periodo = (typeof PERIODOS)[number]["valor"]

export const DIMENSOES = [
  { chave: "pais", rotulo: "País" },
  { chave: "source", rotulo: "Origem (utm_source)" },
  { chave: "campaign", rotulo: "Campanha (utm_campaign)" },
  { chave: "content", rotulo: "Anúncio (utm_content)" },
] as const
export type Dimensao = (typeof DIMENSOES)[number]["chave"]

export const SEM_VALOR: Record<Dimensao, string> = { pais: "(sem país)", source: "(sem UTM)", campaign: "(sem UTM)", content: "(sem UTM)" }
export const COLUNA: Record<Dimensao, string> = { pais: "pais", source: "utm_source", campaign: "utm_campaign", content: "utm_content" }

export type Filtros = {
  periodo: Periodo
  desde: string | null // ISO
  ate: string | null
  dims: Partial<Record<Dimensao, string>>
  q: string
  pagina: number
}

/** "YYYY-MM-DD" de hoje no Uruguai. */
export function hojeUY(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora)
}

export function somarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const inicioDoDia = (dia: string) => new Date(`${dia}T00:00:00${OFFSET}`).toISOString()

export function lerFiltros(sp: Record<string, string | string[] | undefined>, agora = new Date()): Filtros {
  const um = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) ?? ""
  const periodo = (PERIODOS.some((p) => p.valor === um("periodo")) ? um("periodo") : "7d") as Periodo
  const hoje = hojeUY(agora)
  const desde =
    periodo === "hoje" ? inicioDoDia(hoje)
    : periodo === "7d" ? inicioDoDia(somarDias(hoje, -6))
    : periodo === "30d" ? inicioDoDia(somarDias(hoje, -29))
    : null
  const dims: Filtros["dims"] = {}
  for (const d of DIMENSOES) {
    const v = um(d.chave).trim().slice(0, 200)
    if (v) dims[d.chave] = v
  }
  const q = um("q").replace(/[^\p{L}\p{N}@.+_-]/gu, "").slice(0, 80)
  const pagina = Math.max(1, Math.min(10_000, Number.parseInt(um("pagina"), 10) || 1))
  return { periodo, desde, ate: null, dims, q, pagina }
}

/** Monta a URL do painel trocando só alguns parâmetros. */
export function hrefCom(f: Filtros, mudar: Record<string, string | null>) {
  const p = new URLSearchParams()
  p.set("periodo", f.periodo)
  for (const [k, v] of Object.entries(f.dims)) if (v) p.set(k, v)
  if (f.q) p.set("q", f.q)
  for (const [k, v] of Object.entries(mudar)) {
    if (v === null || v === "") p.delete(k)
    else p.set(k, v)
  }
  if (!("pagina" in mudar)) p.delete("pagina")
  return `/painel?${p.toString()}`
}

/** Filtros do PostgREST para a lista/CSV (mesmos critérios do resumo). */
export function queryLista(f: Filtros, colunas: string) {
  const q = new URLSearchParams()
  q.set("select", colunas)
  q.set("order", "creado_en.desc")
  if (f.desde) q.append("creado_en", `gte.${f.desde}`)
  if (f.ate) q.append("creado_en", `lt.${f.ate}`)
  for (const d of DIMENSOES) {
    const v = f.dims[d.chave]
    if (!v) continue
    q.append(COLUNA[d.chave], v === SEM_VALOR[d.chave] ? "is.null" : `eq.${v}`)
  }
  if (f.q) {
    const digitos = f.q.replace(/\D/g, "")
    const partes = [`email.ilike.*${f.q}*`]
    if (digitos.length >= 3) partes.push(`telefono.like.*${digitos}*`)
    q.set("or", `(${partes.join(",")})`)
  }
  return q
}

export function argsResumo(f: Filtros) {
  return {
    p_desde: f.desde, p_ate: f.ate,
    p_pais: f.dims.pais ?? null, p_source: f.dims.source ?? null,
    p_campaign: f.dims.campaign ?? null, p_content: f.dims.content ?? null,
  }
}

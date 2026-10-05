import "server-only"

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "")
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) throw new Error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  return { url, chave }
}

function cabecalhos(extra: Record<string, string> = {}) {
  const { chave } = cfg()
  return { apikey: chave, Authorization: `Bearer ${chave}`, "Content-Type": "application/json", ...extra }
}

export async function rpc<T>(nome: string, args: Record<string, unknown>): Promise<T> {
  const { url } = cfg()
  const r = await fetch(`${url}/rest/v1/rpc/${nome}`, { method: "POST", headers: cabecalhos(), body: JSON.stringify(args), cache: "no-store" })
  if (!r.ok) throw new Error(`Supabase ${nome}: ${r.status} ${await r.text()}`)
  return r.json()
}

/** GET na tabela com filtros do PostgREST; devolve linhas + total (Prefer: count=exact). */
export async function listar<T>(tabela: string, query: URLSearchParams, inicio: number, fim: number): Promise<{ linhas: T[]; total: number }> {
  const { url } = cfg()
  const r = await fetch(`${url}/rest/v1/${tabela}?${query.toString()}`, {
    headers: cabecalhos({ Prefer: "count=exact", Range: `${inicio}-${fim}`, "Range-Unit": "items" }),
    cache: "no-store",
  })
  if (!r.ok && r.status !== 206) throw new Error(`Supabase ${tabela}: ${r.status} ${await r.text()}`)
  const total = Number(r.headers.get("content-range")?.split("/")[1] ?? 0)
  return { linhas: await r.json(), total: Number.isFinite(total) ? total : 0 }
}

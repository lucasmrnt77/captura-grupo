import { createHash } from "node:crypto"

/** Nome do evento de inscrição (o mesmo no pixel e na API de Conversões). */
export const EVENTO_LEAD = process.env.NEXT_PUBLIC_META_EVENTO_LEAD?.trim() || "Lead"

const sha = (v: string) => createHash("sha256").update(v).digest("hex")

export type DadosLead = {
  eventId: string
  email: string
  telefone: string // só dígitos, com DDI
  paisCodigo: string // UY, AR...
  url: string
  ip: string | null
  userAgent: string | null
  fbp: string | null
  fbc: string | null
}

export function montarEventoMeta(d: DadosLead, agora = Date.now()) {
  const user_data: Record<string, unknown> = {
    em: [sha(d.email.trim().toLowerCase())],
    ph: [sha(d.telefone.replace(/\D/g, ""))],
    country: [sha(d.paisCodigo.toLowerCase())],
    external_id: [sha(d.telefone.replace(/\D/g, ""))],
  }
  if (d.ip) user_data.client_ip_address = d.ip
  if (d.userAgent) user_data.client_user_agent = d.userAgent
  if (d.fbp) user_data.fbp = d.fbp
  if (d.fbc) user_data.fbc = d.fbc
  return {
    event_name: EVENTO_LEAD,
    event_time: Math.floor(agora / 1000),
    event_id: d.eventId,
    action_source: "website",
    event_source_url: limparUrl(d.url),
    user_data,
  }
}

/** Tira e-mail/telefone que possam ter vindo na URL antes de mandar para a Meta. */
function limparUrl(url: string) {
  try {
    const u = new URL(url)
    for (const k of [...u.searchParams.keys()]) if (/mail|tel|phone|whats|correo/i.test(k)) u.searchParams.delete(k)
    return u.toString().slice(0, 1000)
  } catch {
    return undefined
  }
}

/** fbc: cookie _fbc ou, se não tiver, monta a partir do fbclid da URL. */
export function calcularFbc(cookieFbc: string | null, fbclid: string | null, agora = Date.now()) {
  if (cookieFbc) return cookieFbc
  if (fbclid) return `fb.1.${agora}.${fbclid}`
  return null
}

/** Monta o corpo enviado à Meta. O código de teste só entra em requisições de teste. */
export function corpoMeta(evento: ReturnType<typeof montarEventoMeta>, teste: boolean, codigoTeste = process.env.META_TEST_EVENT_CODE) {
  const corpo: Record<string, unknown> = { data: [evento] }
  const codigo = codigoTeste?.trim()
  if (teste && codigo) corpo.test_event_code = codigo
  return corpo
}

export type ResultadoMeta = { ok: boolean; motivo?: "sem_config" | "recusado" | "falhou"; http?: number; resposta?: unknown }

export async function enviarParaMeta(evento: ReturnType<typeof montarEventoMeta>, opcoes: { teste?: boolean } = {}): Promise<ResultadoMeta> {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.replace(/\D/g, "")
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim()
  if (!pixel || !token) return { ok: false, motivo: "sem_config" }

  const corpo = corpoMeta(evento, opcoes.teste === true)

  let ultimo: ResultadoMeta = { ok: false, motivo: "falhou" }
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        cache: "no-store",
      })
      const texto = await r.text().catch(() => "")
      let resposta: unknown = texto.slice(0, 500)
      try { resposta = JSON.parse(texto) } catch { /* texto puro */ }
      if (r.ok) return { ok: true, http: r.status, resposta }
      console.error(`[meta] ${evento.event_name} falhou (${r.status}) tentativa ${tentativa}:`, texto.slice(0, 500))
      ultimo = { ok: false, motivo: "recusado", http: r.status, resposta }
      if (r.status < 500 && r.status !== 429) return ultimo
    } catch (e) {
      console.error(`[meta] erro de rede tentativa ${tentativa}`, e)
      ultimo = { ok: false, motivo: "falhou", resposta: e instanceof Error ? e.message : String(e) }
    }
    await new Promise((res) => setTimeout(res, 400 * tentativa))
  }
  return ultimo
}

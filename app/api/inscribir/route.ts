import { NextResponse, after } from "next/server"
import { EVENTO_LEAD, calcularFbc, enviarParaMeta, montarEventoMeta } from "@/lib/meta"
import { emailValido, montarTelefone, paisPorCodigo } from "@/lib/paises"
import { modoTeste } from "@/lib/teste"

const txt = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "")

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    const bruto = await req.text()
    if (bruto.length > 10_000) return NextResponse.json({ ok: false, erro: "grande" }, { status: 413 })
    body = JSON.parse(bruto)
  } catch {
    return NextResponse.json({ ok: false, erro: "json_invalido" }, { status: 400 })
  }

  const grupo = process.env.GRUPO_WHATSAPP_URL || ""

  // Campo-armadilha: humanos não veem, robôs preenchem. Finge sucesso e não grava.
  if (txt(body.website)) return NextResponse.json({ ok: true, grupo })

  const email = txt(body.email, 254).toLowerCase()
  const pais = paisPorCodigo(txt(body.pais, 2))
  const telefono = pais ? montarTelefone(txt(body.telefono, 40), pais) : null

  if (!emailValido(email)) return NextResponse.json({ ok: false, erro: "email" }, { status: 400 })
  if (!pais || !telefono) return NextResponse.json({ ok: false, erro: "telefono" }, { status: 400 })

  // Teste automático: não grava a inscrição e manda o evento só para "Eventos de teste" da Meta
  const teste = modoTeste(body.teste, req.headers.get("x-teste-token"))
  if (teste === "negado") return NextResponse.json({ ok: false, erro: "teste_nao_autorizado" }, { status: 403 })
  if (teste === "sim") {
    const eventId = txt(body.event_id, 100)
    if (!eventId) return NextResponse.json({ ok: false, erro: "event_id" }, { status: 400 })
    const meta = await enviarParaMeta(montarEventoMeta({
      eventId, email, telefone: telefono, paisCodigo: pais.code, url: txt(body.url, 2000),
      ip: null, userAgent: req.headers.get("user-agent"), fbp: txt(body.fbp, 200) || null, fbc: txt(body.fbc, 500) || null,
    }), { teste: true })
    return NextResponse.json({ ok: true, grupo: "", teste: { event_id: eventId, evento: EVENTO_LEAD, meta } })
  }

  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "")
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) {
    console.error("[inscribir] faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
    return NextResponse.json({ ok: false, erro: "config" }, { status: 500 })
  }

  const r = await fetch(`${url}/rest/v1/rpc/inscribir`, {
    method: "POST",
    headers: { apikey: chave, Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_email: email,
      p_telefono: telefono,
      p_pais: pais.name,
      p_pais_ip: (req.headers.get("x-vercel-ip-country") || "").toUpperCase() || null,
      p_utm_source: txt(body.utm_source),
      p_utm_medium: txt(body.utm_medium),
      p_utm_campaign: txt(body.utm_campaign),
      p_utm_content: txt(body.utm_content),
      p_utm_term: txt(body.utm_term),
      p_fbclid: txt(body.fbclid, 500),
      p_url: txt(body.url, 2000),
      p_user_agent: (req.headers.get("user-agent") || "").slice(0, 500),
    }),
    cache: "no-store",
  }).catch((e) => {
    console.error("[inscribir] falha de rede com o Supabase", e)
    return null
  })

  if (!r || !r.ok) {
    if (r) console.error("[inscribir] Supabase respondeu", r.status, await r.text().catch(() => ""))
    return NextResponse.json({ ok: false, erro: "banco" }, { status: 502 })
  }

  // Evento de inscrição para a Meta (API de Conversões), com o MESMO event_id do pixel
  // para a Meta contar uma vez só. Roda depois da resposta, sem atrasar o redirecionamento.
  const eventId = txt(body.event_id, 100)
  if (eventId) {
    const cookies = req.headers.get("cookie") || ""
    const cookie = (n: string) => cookies.match(new RegExp(`(?:^|;\\s*)${n}=([^;]+)`))?.[1] ?? null
    const evento = montarEventoMeta({
      eventId,
      email,
      telefone: telefono,
      paisCodigo: pais.code,
      url: txt(body.url, 2000),
      ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
      userAgent: req.headers.get("user-agent"),
      fbp: txt(body.fbp, 200) || cookie("_fbp"),
      fbc: calcularFbc(txt(body.fbc, 500) || cookie("_fbc"), txt(body.fbclid, 500) || null),
    })
    after(() => enviarParaMeta(evento))
  }

  return NextResponse.json({ ok: true, grupo })
}

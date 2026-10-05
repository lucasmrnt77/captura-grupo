"use client"

import { useEffect, useRef, useState } from "react"
import { PAISES, PAIS_PADRAO, emailValido, montarTelefone, paisPorCodigo, type Pais } from "@/lib/paises"

const UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const

const EVENTO_LEAD = process.env.NEXT_PUBLIC_META_EVENTO_LEAD?.trim() || "Lead"
const PADRAO_META = new Set(["Lead", "CompleteRegistration", "Contact", "SubmitApplication", "Subscribe"])

function lerCookie(nome: string) {
  return document.cookie.match(new RegExp(`(?:^|;\\s*)${nome}=([^;]+)`))?.[1] ?? ""
}

function novoEventId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export function Formulario() {
  const [pais, setPais] = useState<Pais>(PAIS_PADRAO)
  const [aberto, setAberto] = useState(false)
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [erroTel, setErroTel] = useState("")
  const [erroEmail, setErroEmail] = useState("")
  const [erroGeral, setErroGeral] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState<string | null>(null)
  const escolheuManual = useRef(false)
  const caixa = useRef<HTMLDivElement>(null)

  // País automático pelo IP (só se a pessoa ainda não escolheu na mão)
  useEffect(() => {
    fetch("/api/pais")
      .then((r) => r.json())
      .then((d) => {
        const p = paisPorCodigo(d.country)
        if (p && !escolheuManual.current) setPais(p)
      })
      .catch(() => undefined)
  }, [])

  // Fecha a lista de países ao clicar fora / Esc
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false) }
    document.addEventListener("mousedown", fora)
    document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc) }
  }, [aberto])

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return
    setErroGeral("")
    const mail = email.trim().toLowerCase()
    const tel = montarTelefone(telefone, pais)
    const eMail = !mail ? "Ingresá tu correo electrónico" : !emailValido(mail) ? "Revisá tu correo electrónico" : ""
    const eTel = !telefone.trim() ? "Ingresá tu número de WhatsApp" : !tel ? "Revisá tu número de WhatsApp" : ""
    setErroEmail(eMail)
    setErroTel(eTel)
    if (eMail || eTel) return

    const qs = new URLSearchParams(window.location.search)
    const payload: Record<string, string> = {
      email: mail,
      telefono: telefone,
      pais: pais.code,
      url: window.location.href,
      website: (new FormData(e.currentTarget).get("website") as string) || "",
      event_id: novoEventId(),
      fbp: lerCookie("_fbp"),
      fbc: lerCookie("_fbc"),
    }
    for (const k of UTMS) payload[k] = qs.get(k) || ""

    setEnviando(true)
    try {
      const r = await fetch("/api/inscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.ok) {
        if (d.erro === "email") setErroEmail("Revisá tu correo electrónico")
        else if (d.erro === "telefono") setErroTel("Revisá tu número de WhatsApp")
        else setErroGeral("No pudimos registrarte. Probá de nuevo en unos segundos.")
        setEnviando(false)
        return
      }
      // Pixel com o mesmo event_id que o servidor manda pela API de Conversões
      if (window.fbq) {
        window.fbq(PADRAO_META.has(EVENTO_LEAD) ? "track" : "trackCustom", EVENTO_LEAD, {}, { eventID: payload.event_id })
      }
      if (d.grupo) {
        setPronto(d.grupo)
        // pequena espera para o pixel sair antes de trocar de página
        setTimeout(() => { window.location.href = d.grupo }, window.fbq ? 500 : 0)
      } else {
        setPronto("")
      }
    } catch {
      setErroGeral("Sin conexión. Probá de nuevo.")
      setEnviando(false)
    }
  }

  if (pronto !== null) {
    return (
      <div className="rounded-2xl border border-[#20d681]/40 bg-[#171717] p-6 text-center">
        <p className="text-lg font-bold text-white">¡Listo! Ya estás registrado ✅</p>
        {pronto ? (
          <>
            <p className="mt-2 text-sm text-gray-300">Te estamos llevando al grupo de WhatsApp…</p>
            <a href={pronto} className="pulse-green-button mt-5 w-full px-4 py-4 text-base font-bold">
              ENTRAR AL GRUPO
            </a>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-300">En breve te llega el acceso por WhatsApp.</p>
        )}
      </div>
    )
  }

  const campo = "h-[52px] w-full min-w-0 rounded-lg border-2 bg-[#2a2a2a] px-4 text-base text-white placeholder:text-gray-500 outline-none transition-colors"

  return (
    <form onSubmit={enviar} noValidate className="rounded-2xl border border-gray-700 bg-[#171717] p-5 md:p-7">
      {/* armadilha anti-robô */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">Correo electrónico</label>
      <input
        id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
        value={email} placeholder="tucorreo@ejemplo.com"
        onChange={(e) => { setEmail(e.target.value); if (erroEmail) setErroEmail("") }}
        aria-invalid={!!erroEmail}
        className={`${campo} ${erroEmail ? "border-red-500" : "border-gray-600 focus:border-[#20d681]"}`}
      />
      {erroEmail && <p className="mt-1.5 text-sm text-red-400">{erroEmail}</p>}

      <label htmlFor="whatsapp" className="mb-1 mt-4 block text-sm font-medium text-gray-300">WhatsApp</label>
      <div className="flex gap-2">
        <div className="relative shrink-0" ref={caixa}>
          <button
            type="button" aria-label="Seleccionar país" aria-haspopup="listbox" aria-expanded={aberto}
            onClick={() => setAberto(!aberto)}
            className="flex h-[52px] items-center gap-1.5 rounded-lg border-2 border-gray-600 bg-[#2a2a2a] px-3 text-white transition-colors hover:border-[#20d681]"
          >
            <span className="text-xl leading-none">{pais.flag}</span>
            <span className="text-base font-medium">+{pais.dial}</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {aberto && (
            <ul role="listbox" className="absolute left-0 top-full z-50 mt-1 max-h-[45vh] w-[260px] overflow-y-auto rounded-lg border-2 border-gray-600 bg-[#2a2a2a] py-1 shadow-xl">
              {PAISES.map((p) => (
                <li key={p.code}>
                  <button
                    type="button" role="option" aria-selected={p.code === pais.code}
                    onClick={() => { escolheuManual.current = true; setPais(p); setAberto(false) }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-white hover:bg-[#3a3a3a] ${p.code === pais.code ? "bg-[#333]" : ""}`}
                  >
                    <span className="text-xl leading-none">{p.flag}</span>
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="text-sm text-gray-400">+{p.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          id="whatsapp" type="tel" inputMode="tel" autoComplete="tel-national"
          value={telefone} placeholder={pais.placeholder}
          onChange={(e) => { setTelefone(e.target.value.replace(/[^\d\s+()-]/g, "")); if (erroTel) setErroTel("") }}
          aria-invalid={!!erroTel}
          className={`${campo} flex-1 ${erroTel ? "border-red-500" : "border-gray-600 focus:border-[#20d681]"}`}
        />
      </div>
      {erroTel && <p className="mt-1.5 text-sm text-red-400">{erroTel}</p>}

      <button type="submit" disabled={enviando} className="pulse-green-button mt-6 w-full px-4 py-5 text-base font-bold disabled:opacity-70 md:text-lg">
        {enviando ? "REGISTRANDO…" : "QUIERO UNIRME AL GRUPO"}
      </button>
      {erroGeral && <p className="mt-3 text-center text-sm text-red-400">{erroGeral}</p>}
      <p className="mt-3 text-center text-xs text-gray-500">🔒 Tus datos están seguros. 100% gratis.</p>
    </form>
  )
}

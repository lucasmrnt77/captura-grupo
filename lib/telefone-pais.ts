import { normalizarWhatsappPorPais } from "./normalizar"

/**
 * WhatsApp com código do país, pelas regras do normalizar.ts (as mesmas em todas as páginas
 * e no painel — o normalizar.ts é copiado sem mudança).
 *
 * Única adição: países que não estão na tabela do normalizar.ts (ex.: França) recebem o DDI
 * do país que a PESSOA escolheu no seletor. Não é adivinhar o código: ela mesma informou.
 */
export function telefoneComPais(digitado: string, pais: { nome: string; ddi: string }): string {
  const d = String(digitado ?? "").replace(/\D/g, "")
  if (!d) return ""
  const r = normalizarWhatsappPorPais(d, pais.nome)
  const ddi = String(pais.ddi ?? "").replace(/\D/g, "")
  if (!ddi || r.startsWith(ddi)) return r
  return ddi + d.replace(/^0+/, "")
}

/** Número final plausível para WhatsApp (só dígitos, 10 a 15). */
export const telefoneValido = (t: string) => /^\d{10,15}$/.test(t)

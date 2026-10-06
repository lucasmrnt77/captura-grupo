import { telefoneComPais } from "./telefone-pais"

export type Pais = { code: string; name: string; dial: string; flag: string; placeholder: string }

/** Ordem: primeiro os países com mais leads, depois o resto em ordem alfabética. */
export const PAISES: Pais[] = [
  { code: "UY", name: "Uruguay", dial: "598", flag: "🇺🇾", placeholder: "99 123 456" },
  { code: "AR", name: "Argentina", dial: "54", flag: "🇦🇷", placeholder: "11 2345 6789" },
  { code: "CL", name: "Chile", dial: "56", flag: "🇨🇱", placeholder: "9 8765 4321" },
  { code: "PY", name: "Paraguay", dial: "595", flag: "🇵🇾", placeholder: "981 234567" },
  { code: "BO", name: "Bolivia", dial: "591", flag: "🇧🇴", placeholder: "71234567" },
  { code: "BR", name: "Brasil", dial: "55", flag: "🇧🇷", placeholder: "11 98765 4321" },
  { code: "CO", name: "Colombia", dial: "57", flag: "🇨🇴", placeholder: "300 123 4567" },
  { code: "CR", name: "Costa Rica", dial: "506", flag: "🇨🇷", placeholder: "8312 3456" },
  { code: "EC", name: "Ecuador", dial: "593", flag: "🇪🇨", placeholder: "99 123 4567" },
  { code: "SV", name: "El Salvador", dial: "503", flag: "🇸🇻", placeholder: "7012 3456" },
  { code: "ES", name: "España", dial: "34", flag: "🇪🇸", placeholder: "612 34 56 78" },
  { code: "US", name: "Estados Unidos", dial: "1", flag: "🇺🇸", placeholder: "202 555 0123" },
  { code: "GT", name: "Guatemala", dial: "502", flag: "🇬🇹", placeholder: "5123 4567" },
  { code: "HN", name: "Honduras", dial: "504", flag: "🇭🇳", placeholder: "9123 4567" },
  { code: "MX", name: "México", dial: "52", flag: "🇲🇽", placeholder: "55 1234 5678" },
  { code: "NI", name: "Nicaragua", dial: "505", flag: "🇳🇮", placeholder: "8123 4567" },
  { code: "PA", name: "Panamá", dial: "507", flag: "🇵🇦", placeholder: "6123 4567" },
  { code: "PE", name: "Perú", dial: "51", flag: "🇵🇪", placeholder: "987 654 321" },
  { code: "PR", name: "Puerto Rico", dial: "1", flag: "🇵🇷", placeholder: "787 234 5678" },
  { code: "DO", name: "República Dominicana", dial: "1", flag: "🇩🇴", placeholder: "809 234 5678" },
  { code: "VE", name: "Venezuela", dial: "58", flag: "🇻🇪", placeholder: "412 123 4567" },
]

export const PAIS_PADRAO = PAISES[0]

export function paisPorCodigo(code: string | null | undefined): Pais | undefined {
  if (!code) return undefined
  return PAISES.find((p) => p.code === code.toUpperCase())
}

/**
 * Monta o número completo (só dígitos, com DDI) a partir do que a pessoa digitou,
 * seguindo as regras de lib/normalizar.ts (Argentina 549 + nacional, tira o 0
 * de tronco, não duplica o DDI, México 52...).
 * Retorna null se o número não parece válido.
 */
export function montarTelefone(digitado: string, pais: Pais): string | null {
  const n = telefoneComPais(digitado, { nome: pais.name, ddi: pais.dial })
  if (!n) return null
  const local = n.length - pais.dial.length
  if (n.length < 9 || n.length > 15 || local < 6) return null
  return n
}

export function emailValido(email: string): boolean {
  const e = (email || "").trim()
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
}

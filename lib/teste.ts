import { createHash, timingSafeEqual } from "node:crypto"

/**
 * Modo teste do formulário (usado pelos testes automáticos diários).
 * Só vale com o cabeçalho "x-teste-token" igual a TESTES_TOKEN: aí a inscrição
 * NÃO é gravada no banco e o evento vai para "Eventos de teste" da Meta.
 * Retorna "nao" (inscrição normal), "sim" (teste autorizado) ou "negado".
 */
export function modoTeste(pediuTeste: unknown, token: string | null, segredo = process.env.TESTES_TOKEN): "nao" | "sim" | "negado" {
  if (pediuTeste !== true) return "nao"
  const s = segredo?.trim()
  if (!s || !token) return "negado"
  const a = createHash("sha256").update(token).digest()
  const b = createHash("sha256").update(s).digest()
  return timingSafeEqual(a, b) ? "sim" : "negado"
}

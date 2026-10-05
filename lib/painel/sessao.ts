import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const COOKIE = "painel_sessao"
const DURACAO_S = 60 * 60 * 24 * 14 // 14 dias

function segredo() {
  const s = process.env.PAINEL_SENHA
  if (!s) throw new Error("Falta PAINEL_SENHA")
  return `${s}:${process.env.SESSAO_SEGREDO ?? "captura-grupo"}`
}

const assinar = (v: string) => createHmac("sha256", segredo()).update(v).digest("base64url")

function iguais(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function senhaCorreta(tentativa: string) {
  const s = process.env.PAINEL_SENHA
  if (!s) return false
  return iguais(assinar(tentativa), assinar(s))
}

export function novoToken() {
  const exp = String(Math.floor(Date.now() / 1000) + DURACAO_S)
  return { valor: `${exp}.${assinar(exp)}`, maxAge: DURACAO_S }
}

export function tokenValido(token: string | undefined) {
  if (!token || !process.env.PAINEL_SENHA) return false
  const [exp, sig] = token.split(".")
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false
  return iguais(sig, assinar(exp))
}

export async function logado() {
  return tokenValido((await cookies()).get(COOKIE)?.value)
}

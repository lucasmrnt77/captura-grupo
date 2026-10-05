import { NextResponse } from "next/server"
import { COOKIE } from "@/lib/painel/sessao"

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/painel/entrar", req.url), 303)
  res.cookies.set(COOKIE, "", { path: "/painel", maxAge: 0 })
  return res
}

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE, tokenValido } from "@/lib/painel/sessao"
import { listar } from "@/lib/painel/supabase"
import { lerFiltros, queryLista } from "@/lib/painel/filtros"

const COLUNAS = ["creado_en", "email", "telefono", "pais", "pais_ip", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "url", "envios", "actualizado_en"]

const celula = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v)
  // evita fórmulas ao abrir no Excel/Sheets
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n;]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

export async function GET(req: Request) {
  if (!tokenValido((await cookies()).get(COOKIE)?.value)) return NextResponse.redirect(new URL("/painel/entrar", req.url))
  const f = lerFiltros(Object.fromEntries(new URL(req.url).searchParams))
  const q = queryLista(f, COLUNAS.join(","))
  const linhas: Record<string, unknown>[] = []
  for (let inicio = 0; ; inicio += 1000) {
    const { linhas: lote } = await listar<Record<string, unknown>>("inscripciones", q, inicio, inicio + 999)
    linhas.push(...lote)
    if (lote.length < 1000 || inicio > 200_000) break
  }
  const csv = "﻿" + [COLUNAS.join(","), ...linhas.map((l) => COLUNAS.map((c) => celula(l[c])).join(","))].join("\n")
  const nome = `inscricoes-grupo-${f.periodo}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nome}"`, "Cache-Control": "no-store" } })
}

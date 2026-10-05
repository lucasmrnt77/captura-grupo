import { NextResponse } from "next/server"

// O navegador chama isto para pré-selecionar o país do WhatsApp (a Vercel informa o país pelo IP).
export async function GET(req: Request) {
  const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase()
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } })
}

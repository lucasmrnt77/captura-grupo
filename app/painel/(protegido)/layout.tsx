import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { logado } from "@/lib/painel/sessao"

export const metadata: Metadata = { title: "Painel do grupo", robots: { index: false, follow: false } }

export default async function LayoutProtegido({ children }: { children: React.ReactNode }) {
  if (!(await logado())) redirect("/painel/entrar")
  return <div className="painel min-h-screen">{children}</div>
}

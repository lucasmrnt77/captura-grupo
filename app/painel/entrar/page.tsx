import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { COOKIE, logado, novoToken, senhaCorreta } from "@/lib/painel/sessao"

export const metadata: Metadata = { title: "Entrar · Painel do grupo", robots: { index: false, follow: false } }

async function entrar(form: FormData) {
  "use server"
  const senha = String(form.get("senha") ?? "")
  if (!senhaCorreta(senha)) redirect("/painel/entrar?erro=1")
  const t = novoToken()
  ;(await cookies()).set(COOKIE, t.valor, { httpOnly: true, secure: true, sameSite: "lax", path: "/painel", maxAge: t.maxAge })
  redirect("/painel")
}

export default async function Entrar({ searchParams }: PageProps<"/painel/entrar">) {
  if (await logado()) redirect("/painel")
  const erro = (await searchParams).erro
  return (
    <main className="painel flex min-h-screen items-center justify-center px-4">
      <form action={entrar} className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-6">
        <h1 className="text-lg font-semibold">Painel do grupo</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Inscrições da página do grupo de WhatsApp.</p>
        <label htmlFor="senha" className="mt-5 block text-sm font-medium">Senha</label>
        <input id="senha" name="senha" type="password" required autoFocus autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 outline-none focus:border-[var(--series-1)]" />
        {erro && <p className="mt-2 text-sm text-red-600 dark:text-red-400">Senha incorreta.</p>}
        <button className="mt-4 w-full rounded-lg bg-[var(--text-primary)] px-3 py-2 text-sm font-semibold text-[var(--surface-1)]">Entrar</button>
      </form>
    </main>
  )
}

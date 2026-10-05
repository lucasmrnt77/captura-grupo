import { FUSO } from "./filtros"

export const num = (n: number) => new Intl.NumberFormat("pt-BR").format(n)

export function dataHora(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
}

/** "2026-10-05" → "05/10" (+ dia da semana opcional) */
export function diaCurto(dia: string, comSemana = false) {
  const d = new Date(`${dia}T12:00:00Z`)
  const base = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" }).format(d)
  if (!comSemana) return base
  const sem = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short" }).format(d).replace(".", "")
  return `${sem} ${base}`
}

export function telefoneBonito(t: string) {
  const d = t.replace(/\D/g, "")
  const ddis = ["598", "595", "591", "593", "506", "503", "502", "504", "505", "507", "54", "55", "56", "57", "58", "51", "52", "34", "1"]
  const ddi = ddis.find((x) => d.startsWith(x))
  return ddi ? `+${ddi} ${d.slice(ddi.length)}` : `+${d}`
}

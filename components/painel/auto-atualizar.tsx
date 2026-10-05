"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Atualiza os números a cada `segundos` enquanto a aba estiver visível. */
export function AutoAtualizar({ segundos = 60 }: { segundos?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh() }, segundos * 1000)
    return () => clearInterval(id)
  }, [router, segundos])
  return null
}

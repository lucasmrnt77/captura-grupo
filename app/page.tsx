import Image from "next/image"
import { Formulario } from "@/components/formulario"

export default function Pagina() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="bg-[#20d681] px-4 py-3 text-center text-sm font-bold tracking-wide md:py-4 md:text-base">
        GRUPO GRATUITO DE WHATSAPP
      </div>

      <div className="relative mx-auto w-full max-w-[1100px]">
        <Image
          src="/hero-trading-en-vivo.jpg" alt="Martín Morales — Trading en vivo Nasdaq"
          width={1280} height={720} priority sizes="(max-width: 1100px) 100vw, 1100px"
          className="block h-auto w-full"
        />
        {/* funde a borda de baixo da imagem com o fundo preto */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-b from-transparent to-black" />
      </div>

      <section className="relative z-10 mx-auto mt-4 max-w-xl px-4 pb-14 md:mt-6">
        <h1 className="font-poppins text-center text-[22px] leading-tight md:text-4xl">
          <span className="font-bold text-[#20d681]">Unite gratis al grupo de WhatsApp</span>{" "}
          donde comparto los accesos a mis <span className="font-bold">operativas en vivo</span> y mirá cómo{" "}
          <span className="font-bold">analizo el mercado</span> y <span className="font-bold">ejecuto mis operaciones en vivo</span>
        </h1>

        <p className="font-poppins mb-5 mt-6 text-center text-base font-semibold md:text-lg">Completá tus datos y unite al grupo👇</p>

        <Formulario />
      </section>
    </main>
  )
}

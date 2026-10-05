import Image from "next/image"
import { Formulario } from "@/components/formulario"

export default function Pagina() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="bg-[#20d681] px-4 py-2 text-center text-xs font-bold tracking-wide md:py-3 md:text-base">
        GRUPO GRATUITO DE WHATSAPP
      </div>

      {/* Celular: imagem em cima e formulário embaixo. Computador: lado a lado, tudo visível sem rolar. */}
      <div className="mx-auto md:grid md:max-w-6xl md:grid-cols-2 md:items-center md:gap-10 md:px-8 md:py-10">
        <div className="relative w-full">
          <Image
            src="/hero-trading-en-vivo.jpg" alt="Martín Morales — Trading en vivo Nasdaq"
            width={1280} height={720} priority sizes="(max-width: 768px) 100vw, 560px"
            className="block aspect-[16/8] h-auto w-full object-cover object-top md:aspect-auto md:rounded-2xl"
          />
          {/* funde a borda de baixo da imagem com o fundo preto (só no celular) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-black md:hidden" />
        </div>

        <section className="relative z-10 mx-auto mt-1 max-w-xl px-4 pb-14 md:mt-0 md:px-0 md:pb-0">
          <h1 className="font-poppins text-center text-[17px] leading-snug md:text-left md:text-[28px] md:leading-tight">
            <span className="font-bold text-[#20d681]">Unite gratis al grupo de WhatsApp</span>{" "}
            donde comparto los accesos a mis <span className="font-bold">operativas en{" "}vivo</span> y mirá cómo{" "}
            <span className="font-bold">analizo el mercado</span> y <span className="font-bold">ejecuto mis operaciones en{" "}vivo</span>
          </h1>

          <p className="font-poppins mb-3 mt-3 text-center text-sm font-semibold md:mb-4 md:mt-4 md:text-left md:text-lg">Completá tus datos y unite al grupo👇</p>

          <Formulario />
        </section>
      </div>
    </main>
  )
}

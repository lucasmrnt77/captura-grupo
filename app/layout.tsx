import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "600", "700"] })

const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Grupo gratuito de WhatsApp — Operativas en vivo",
  description: "Unite gratis al grupo de WhatsApp y mirá cómo analizo el mercado y ejecuto mis operaciones en vivo.",
  openGraph: { title: "Grupo gratuito de WhatsApp — Operativas en vivo", images: ["/hero-trading-en-vivo.jpg"], type: "website" },
}

export const viewport: Viewport = { themeColor: "#000000" }

const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} antialiased`}>
        {children}
        {PIXEL && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${PIXEL.replace(/\D/g, "")}');fbq('track','PageView');
          `}</Script>
        )}
      </body>
    </html>
  )
}

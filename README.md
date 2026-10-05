# Página "Grupo de operativas en vivo"

Página de captura simples: hero + texto + formulário (e-mail e WhatsApp com país automático).
Grava em um banco Supabase **só desta página** e manda a pessoa direto para o grupo de WhatsApp.

## Publicar (uma vez)

1. **Supabase** → crie um projeto novo → SQL Editor → cole e rode `supabase/001-inscripciones.sql`.
   A última consulta tem que mostrar `tudo_ok = true`.
2. **GitHub** → crie o repositório `captura-grupo` (privado) e suba esta pasta.
3. **Vercel** → Add New → Project → importe o repositório (preset Next.js) e crie as variáveis:
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API, chave secreta / service_role)
   - `GRUPO_WHATSAPP_URL` (link do grupo)
   - `NEXT_PUBLIC_META_PIXEL_ID` (opcional; liga PageView + Lead)
4. Deploy.

## Trocar a imagem do topo
Coloque a nova imagem em `public/` com um nome NOVO e troque o nome em `app/page.tsx` e `app/layout.tsx` (nome novo evita a Vercel mostrar a imagem antiga do cache) (ideal 960×540, até ~150 KB).

## Ver os inscritos
Supabase → Table Editor → `inscripciones` (dá para exportar CSV).
Se o mesmo WhatsApp se inscrever de novo, não duplica: atualiza o e-mail e soma 1 em `envios`.

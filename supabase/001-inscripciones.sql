-- Page "Grupo de operativas" — banco próprio desta página.
-- Rode uma vez no SQL Editor do projeto Supabase novo (pode rodar de novo sem quebrar).
BEGIN;

CREATE TABLE IF NOT EXISTS public.inscripciones (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  email          text NOT NULL CHECK (length(email) <= 254 AND email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  telefono       text NOT NULL UNIQUE CHECK (telefono ~ '^[0-9]{9,15}$'),
  pais           text,
  pais_ip        text,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  utm_term       text,
  fbclid         text,
  url            text,
  user_agent     text,
  envios         integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS inscripciones_creado_en_idx ON public.inscripciones (creado_en DESC);
CREATE INDEX IF NOT EXISTS inscripciones_email_idx ON public.inscripciones (email);

-- Só o servidor da página (service_role) acessa. Nada público.
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inscripciones FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inscripciones TO service_role;

-- Grava a inscrição. Se o mesmo WhatsApp se inscrever de novo, atualiza o e-mail,
-- soma 1 em "envios" e mantém a data e as UTMs da primeira vez (só preenche as vazias).
CREATE OR REPLACE FUNCTION public.inscribir(
  p_email text, p_telefono text, p_pais text, p_pais_ip text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text, p_utm_term text,
  p_fbclid text, p_url text, p_user_agent text
) RETURNS jsonb
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO public.inscripciones AS i
    (email, telefono, pais, pais_ip, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, url, user_agent)
  VALUES
    (lower(trim(p_email)), p_telefono, p_pais, p_pais_ip,
     nullif(p_utm_source,''), nullif(p_utm_medium,''), nullif(p_utm_campaign,''), nullif(p_utm_content,''), nullif(p_utm_term,''),
     nullif(p_fbclid,''), left(p_url, 2000), left(p_user_agent, 500))
  ON CONFLICT (telefono) DO UPDATE SET
    email          = excluded.email,
    actualizado_en = now(),
    envios         = i.envios + 1,
    pais           = coalesce(i.pais, excluded.pais),
    pais_ip        = coalesce(i.pais_ip, excluded.pais_ip),
    utm_source     = coalesce(i.utm_source, excluded.utm_source),
    utm_medium     = coalesce(i.utm_medium, excluded.utm_medium),
    utm_campaign   = coalesce(i.utm_campaign, excluded.utm_campaign),
    utm_content    = coalesce(i.utm_content, excluded.utm_content),
    utm_term       = coalesce(i.utm_term, excluded.utm_term),
    fbclid         = coalesce(i.fbclid, excluded.fbclid)
  RETURNING jsonb_build_object('id', i.id, 'nuevo', i.envios = 1);
$$;

REVOKE ALL ON FUNCTION public.inscribir(text,text,text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.inscribir(text,text,text,text,text,text,text,text,text,text,text,text) TO service_role;

COMMIT;

-- Conferência (deve devolver 1 linha com tudo_ok = true)
SELECT
  to_regclass('public.inscripciones') IS NOT NULL                         AS tabela_criada,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inscripciones'::regclass) AS rls_ligado,
  NOT has_table_privilege('anon', 'public.inscripciones', 'SELECT')        AS anon_bloqueado,
  (to_regclass('public.inscripciones') IS NOT NULL
   AND (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inscripciones'::regclass)
   AND NOT has_table_privilege('anon', 'public.inscripciones', 'SELECT')) AS tudo_ok;

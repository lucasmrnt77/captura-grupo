-- Painel das inscrições do grupo: resumo agregado (rode uma vez no SQL Editor do projeto
-- "Captura Leads Evengreen", depois do 001). Pode rodar de novo sem quebrar.
BEGIN;

CREATE OR REPLACE FUNCTION public.painel_resumo(
  p_desde timestamptz DEFAULT NULL,
  p_ate timestamptz DEFAULT NULL,
  p_pais text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_campaign text DEFAULT NULL,
  p_content text DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT creado_en, envios,
           coalesce(pais, '(sem país)')         AS pais,
           coalesce(utm_source, '(sem UTM)')    AS source,
           coalesce(utm_campaign, '(sem UTM)')  AS campaign,
           coalesce(utm_content, '(sem UTM)')   AS content
      FROM public.inscripciones
     WHERE (p_desde IS NULL OR creado_en >= p_desde)
       AND (p_ate   IS NULL OR creado_en <  p_ate)
       AND (p_pais     IS NULL OR coalesce(pais, '(sem país)')        = p_pais)
       AND (p_source   IS NULL OR coalesce(utm_source, '(sem UTM)')   = p_source)
       AND (p_campaign IS NULL OR coalesce(utm_campaign, '(sem UTM)') = p_campaign)
       AND (p_content  IS NULL OR coalesce(utm_content, '(sem UTM)')  = p_content)
  )
  SELECT jsonb_build_object(
    'total',     (SELECT count(*) FROM base),
    'repetidas', (SELECT count(*) FROM base WHERE envios > 1),
    'hoje',      (SELECT count(*) FROM base
                   WHERE creado_en >= (date_trunc('day', now() AT TIME ZONE 'America/Montevideo') AT TIME ZONE 'America/Montevideo')),
    'primeira',  (SELECT min(creado_en) FROM base),
    'por_dia',   (SELECT coalesce(jsonb_agg(jsonb_build_object('dia', d, 'n', n) ORDER BY d), '[]'::jsonb)
                    FROM (SELECT (creado_en AT TIME ZONE 'America/Montevideo')::date AS d, count(*) AS n FROM base GROUP BY 1) x),
    'por_hora',  (SELECT coalesce(jsonb_agg(jsonb_build_object('hora', h, 'n', n) ORDER BY h), '[]'::jsonb)
                    FROM (SELECT extract(hour FROM creado_en AT TIME ZONE 'America/Montevideo')::int AS h, count(*) AS n FROM base GROUP BY 1) x),
    'por_pais',     (SELECT coalesce(jsonb_agg(jsonb_build_object('valor', v, 'n', n) ORDER BY n DESC, v), '[]'::jsonb) FROM (SELECT pais AS v, count(*) AS n FROM base GROUP BY 1) x),
    'por_source',   (SELECT coalesce(jsonb_agg(jsonb_build_object('valor', v, 'n', n) ORDER BY n DESC, v), '[]'::jsonb) FROM (SELECT source AS v, count(*) AS n FROM base GROUP BY 1) x),
    'por_campaign', (SELECT coalesce(jsonb_agg(jsonb_build_object('valor', v, 'n', n) ORDER BY n DESC, v), '[]'::jsonb) FROM (SELECT campaign AS v, count(*) AS n FROM base GROUP BY 1) x),
    'por_content',  (SELECT coalesce(jsonb_agg(jsonb_build_object('valor', v, 'n', n) ORDER BY n DESC, v), '[]'::jsonb) FROM (SELECT content AS v, count(*) AS n FROM base GROUP BY 1) x)
  );
$$;

REVOKE ALL ON FUNCTION public.painel_resumo(timestamptz, timestamptz, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.painel_resumo(timestamptz, timestamptz, text, text, text, text) TO service_role;

COMMIT;

-- Conferência (1 linha, tudo_ok = true)
SELECT to_regprocedure('public.painel_resumo(timestamptz,timestamptz,text,text,text,text)') IS NOT NULL AS tudo_ok;

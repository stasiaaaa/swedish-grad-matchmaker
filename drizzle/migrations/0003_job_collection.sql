ALTER TABLE public.jobs DROP CONSTRAINT jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (status = ANY (ARRAY['open','closed','pending','rejected']));
ALTER TABLE public.jobs ADD COLUMN content_hash text;
CREATE UNIQUE INDEX jobs_company_source_ext_uq ON public.jobs (company_id, source, external_id);

CREATE TABLE public.scrape_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  companies_checked integer NOT NULL DEFAULT 0,
  jobs_new integer NOT NULL DEFAULT 0,
  jobs_updated integer NOT NULL DEFAULT 0,
  jobs_closed integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb
);
GRANT SELECT ON public.scrape_runs TO authenticated;
GRANT ALL ON public.scrape_runs TO service_role;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read scrape runs" ON public.scrape_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
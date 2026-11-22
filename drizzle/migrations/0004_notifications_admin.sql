ALTER TABLE public.jobs ADD COLUMN notified_at timestamptz;
UPDATE public.jobs SET notified_at = now();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.guest_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  consent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, company_id)
);
GRANT ALL ON public.guest_subscriptions TO service_role;
ALTER TABLE public.guest_subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.company_follows ADD COLUMN email_opt_in boolean NOT NULL DEFAULT true;

GRANT INSERT, UPDATE, DELETE ON public.companies TO authenticated;
CREATE POLICY "admins insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update companies" ON public.companies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete companies" ON public.companies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
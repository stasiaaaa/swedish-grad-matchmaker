CREATE TABLE public.admin_emails (email text PRIMARY KEY);
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_emails (email) VALUES ('anastasia.saprunova@proton.me');

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare t text := coalesce(new.raw_user_meta_data->>'account_type','student');
begin
  if t not in ('student','company') then t := 'student'; end if;
  insert into public.profiles (id, account_type, full_name)
  values (new.id, t, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, t::app_role);
  if exists (select 1 from public.admin_emails a where a.email = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $function$;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u JOIN public.admin_emails a ON a.email = lower(u.email)
ON CONFLICT DO NOTHING;
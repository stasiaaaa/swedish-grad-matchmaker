
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null default 'student' check (account_type in ('student','company')),
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile delete" on public.profiles for delete to authenticated using (auth.uid() = id);

create type public.app_role as enum ('admin','company','student');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text := coalesce(new.raw_user_meta_data->>'account_type','student');
begin
  if t not in ('student','company') then t := 'student'; end if;
  insert into public.profiles (id, account_type, full_name)
  values (new.id, t, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, t::app_role);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.student_profiles (
  user_id uuid primary key,
  university text,
  programme text,
  study_level text check (study_level in ('Bachelor','Master','PhD')),
  grad_year int,
  looking_for text[] not null default '{}',
  cities text[] not null default '{}',
  work_modes text[] not null default '{}',
  fields text[] not null default '{}',
  visible_to_companies boolean not null default false,
  onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.student_profiles to authenticated;
grant all on public.student_profiles to service_role;
alter table public.student_profiles enable row level security;
create policy "own student profile" on public.student_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.student_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  skill text not null,
  level text not null default 'Intermediate' check (level in ('Beginner','Intermediate','Advanced')),
  unique (user_id, skill)
);
grant select, insert, update, delete on public.student_skills to authenticated;
grant all on public.student_skills to service_role;
alter table public.student_skills enable row level security;
create policy "own skills" on public.student_skills for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  company text not null,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.experiences to authenticated;
grant all on public.experiences to service_role;
alter table public.experiences enable row level security;
create policy "own experiences" on public.experiences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved','applied','interview','offer','rejected')),
  notes text,
  saved_at timestamptz not null default now(),
  unique (user_id, job_id)
);
grant select, insert, update, delete on public.saved_jobs to authenticated;
grant all on public.saved_jobs to service_role;
alter table public.saved_jobs enable row level security;
create policy "own saved jobs" on public.saved_jobs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.company_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);
grant select, insert, update, delete on public.company_follows to authenticated;
grant all on public.company_follows to service_role;
alter table public.company_follows enable row level security;
create policy "own follows" on public.company_follows for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

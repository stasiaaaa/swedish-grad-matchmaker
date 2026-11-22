
create policy "own cv read" on storage.objects for select to authenticated using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own cv insert" on storage.objects for insert to authenticated with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own cv update" on storage.objects for update to authenticated using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own cv delete" on storage.objects for delete to authenticated using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
alter table public.student_profiles add column cv_path text, add column cv_consent_at timestamptz;

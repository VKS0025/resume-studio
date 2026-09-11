-- Storage for uploaded study material.
--
-- The bucket is private: files are reached through short-lived signed URLs, so
-- a link copied out of the page stops working instead of becoming a permanent
-- public mirror of the library.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study',
  'study',
  false,
  52428800,  -- 50 MB; large enough for a scanned question paper.
  array[
    'application/pdf',
    'image/png','image/jpeg','image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','application/zip'
  ]
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = false;

-- Anyone may *read* an object, which is what createSignedUrl needs. The bucket
-- being private still means no object is reachable without a signed link.
drop policy if exists "study_read" on storage.objects;
create policy "study_read" on storage.objects for select
  using (bucket_id = 'study');

-- Only admins put things in the library, or take them out again.
drop policy if exists "study_admin_insert" on storage.objects;
create policy "study_admin_insert" on storage.objects for insert
  with check (bucket_id = 'study' and public.is_admin());

drop policy if exists "study_admin_update" on storage.objects;
create policy "study_admin_update" on storage.objects for update
  using (bucket_id = 'study' and public.is_admin())
  with check (bucket_id = 'study' and public.is_admin());

drop policy if exists "study_admin_delete" on storage.objects;
create policy "study_admin_delete" on storage.objects for delete
  using (bucket_id = 'study' and public.is_admin());

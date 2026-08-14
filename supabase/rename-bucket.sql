-- Create the new "files" storage bucket (replaces "receipts")
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, type)
values ('files', 'files', false, false, null, null, 'STANDARD');

-- Same RLS shape as the old "receipts" bucket, scoped to each user's own folder
create policy "Users can view their own files"
on storage.objects for select
to authenticated
using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

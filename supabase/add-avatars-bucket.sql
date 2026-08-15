-- Profile photo storage. Public (not sensitive), so no signed URLs needed --
-- reading avoids the private-bucket URL issue we hit with the files bucket.
-- Each user's photo lives at a fixed path ({user_id}/avatar) and is
-- overwritten on every upload, so there's nothing to clean up.
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, type)
values ('avatars', 'avatars', true, false, null, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'], 'STANDARD');

-- "Public" only lets anonymous viewers fetch via the special
-- /object/public/... URL. Authenticated operations (like the upsert's
-- existence check during upload) still go through normal RLS.
create policy "Users can view their own avatar (authenticated)"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 1. Create the bucket (Skip this if you already created it via the dashboard)
insert into storage.buckets (id, name, public)
values ('alusea-assets', 'alusea-assets', true)
on conflict (id) do nothing;

-- 2. Allow public read access to the bucket
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'alusea-assets' );

-- 3. Allow authenticated users (like your admin) to upload files
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'alusea-assets' );

-- 4. Allow authenticated users to update/delete their uploads
create policy "Authenticated users can update"
on storage.objects for update
to authenticated
using ( bucket_id = 'alusea-assets' );

create policy "Authenticated users can delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'alusea-assets' );

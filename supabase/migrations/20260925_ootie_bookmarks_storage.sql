insert into storage.buckets (id, name, public)
values ('ootie-bookmarks-images', 'ootie-bookmarks-images', true)
on conflict (id) do update set public = excluded.public;

grant select on storage.buckets to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;

drop policy if exists "Bookmarks images are viewable by everyone" on storage.objects;
create policy "Bookmarks images are viewable by everyone"
on storage.objects for select
using (bucket_id = 'ootie-bookmarks-images');

drop policy if exists "Users can upload their own bookmark images" on storage.objects;
create policy "Users can upload their own bookmark images"
on storage.objects for insert
with check (
  bucket_id = 'ootie-bookmarks-images'
  and auth.uid() is not null
  and name like ('bookmarks/' || auth.uid()::text || '/%')
);

drop policy if exists "Users can update their own bookmark images" on storage.objects;
create policy "Users can update their own bookmark images"
on storage.objects for update
using (
  bucket_id = 'ootie-bookmarks-images'
  and name like ('bookmarks/' || auth.uid()::text || '/%')
)
with check (
  bucket_id = 'ootie-bookmarks-images'
  and name like ('bookmarks/' || auth.uid()::text || '/%')
);

drop policy if exists "Users can delete their own bookmark images" on storage.objects;
create policy "Users can delete their own bookmark images"
on storage.objects for delete
using (
  bucket_id = 'ootie-bookmarks-images'
  and name like ('bookmarks/' || auth.uid()::text || '/%')
);
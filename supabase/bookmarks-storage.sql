create policy "Bookmarks images are viewable by everyone"
on storage.objects for select
using (bucket_id = 'ootie-bookmarks-images');

create policy "Users can upload their own bookmark images"
on storage.objects for insert
with check (bucket_id = 'ootie-bookmarks-images' and auth.role() = 'authenticated');

create policy "Users can update their own bookmark images"
on storage.objects for update
using (bucket_id = 'ootie-bookmarks-images' and auth.role() = 'authenticated')
with check (bucket_id = 'ootie-bookmarks-images' and auth.role() = 'authenticated');

create policy "Users can delete their own bookmark images"
on storage.objects for delete
using (bucket_id = 'ootie-bookmarks-images' and auth.role() = 'authenticated');

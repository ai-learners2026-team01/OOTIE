import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const root = process.cwd();
const migrationDirectory = resolve(root, 'supabase/migrations');
const migrationFiles = (await readdir(migrationDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();
const database = new PGlite();

try {
  await database.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid()
    returns uuid
    language sql
    stable
    as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create schema storage;
    create table storage.buckets (
      id text primary key,
      name text not null unique,
      public boolean not null default false
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text not null,
      name text not null
    );
    alter table storage.objects enable row level security;
    insert into auth.users (id, email, raw_user_meta_data)
    values ('00000000-0000-4000-8000-000000000001', 'one@example.test', '{"full_name":"User One"}');
  `);

  for (let pass = 1; pass <= 2; pass += 1) {
    for (const file of migrationFiles) {
      await database.exec(await readFile(resolve(migrationDirectory, file), 'utf8'));
    }
  }

  await database.exec(`
    grant usage on schema public to anon, authenticated;
    grant usage on schema auth to anon, authenticated;
    grant usage on schema storage to anon, authenticated;
    insert into auth.users (id, email, raw_user_meta_data)
    values ('00000000-0000-4000-8000-000000000002', 'two@example.test', '{"full_name":"User Two"}');
  `);

  const generatedProfiles = await database.query(
    "select count(*)::int as count from public.profiles where id in ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')"
  );
  assert.equal(generatedProfiles.rows[0].count, 2, 'Auth users should receive profiles using the same UUID');

  await database.exec(`
    set role authenticated;
    select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);
    update public.profiles set public_closet = false where id = '00000000-0000-4000-8000-000000000001';
    insert into public.items (owner_id, name, price, wear_count)
      values ('00000000-0000-4000-8000-000000000001', 'Test shirt', 1200, 3);
    insert into public.ootie_bookmarks (owner_id, product_url, title)
      values ('00000000-0000-4000-8000-000000000001', 'https://example.test/item', 'Saved shirt');
    insert into storage.objects (bucket_id, name)
      values ('ootie-bookmarks-images', 'bookmarks/00000000-0000-4000-8000-000000000001/test.jpg');
  `);

  const closetStats = await database.query('select public.get_closet_stats() as stats');
  assert.deepEqual(Object.keys(closetStats.rows[0].stats).sort(), [
    'categoryStats', 'colorFamilyStats', 'colorStats', 'styleStats'
  ]);
  assert.equal((await database.query('select count(*)::int as count from public.get_brand_stats()')).rows[0].count, 1);
  assert.equal((await database.query('select count(*)::int as count from public.get_top_worn_items()')).rows[0].count, 1);
  assert.equal((await database.query('select count(*)::int as count from public.get_cost_per_wear_ranking()')).rows[0].count, 1);
  assert.equal((await database.query('select count(*)::int as count from public.get_disused_items()')).rows[0].count, 0);

  await database.exec("select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false)");
  const otherUsersBookmarks = await database.query('select id from public.ootie_bookmarks');
  const otherUsersItems = await database.query('select id from public.items');
  assert.equal(otherUsersBookmarks.rows.length, 0, 'Bookmarks must remain private to their owner');
  assert.equal(otherUsersItems.rows.length, 0, 'Private closet items must remain hidden from other users');

  await database.exec(`
    insert into public.items (owner_id, name, hidden)
      values
        ('00000000-0000-4000-8000-000000000002', 'Shared item', false),
        ('00000000-0000-4000-8000-000000000002', 'Hidden item', true);
  `);

  await database.exec('reset role');
  const publicHeartItem = await database.query("select id from public.items where name = 'Shared item'");
  const privateHeartItem = await database.query("select id from public.items where name = 'Test shirt'");
  const visitorId = '00000000-0000-4000-8000-000000000099';
  await database.exec("select set_config('request.jwt.claim.sub', '', false); set role anon");

  await assert.rejects(
    database.query('select public.toggle_ootie_item_heart($1, $2)', [privateHeartItem.rows[0].id, visitorId]),
    /only available for visible items/i,
    'Visitors must not heart items in a private closet'
  );
  const addedHeart = await database.query(
    'select public.toggle_ootie_item_heart($1, $2) as result',
    [publicHeartItem.rows[0].id, visitorId]
  );
  assert.deepEqual(addedHeart.rows[0].result, { liked: true, heart_count: 1 });
  const heartStats = await database.query(
    'select * from public.get_ootie_item_heart_stats(array[$1::uuid], $2::uuid)',
    [publicHeartItem.rows[0].id, visitorId]
  );
  assert.equal(Number(heartStats.rows[0].heart_count), 1);
  assert.equal(heartStats.rows[0].liked_by_viewer, true);
  assert.equal(
    (await database.query("select hearts from public.profiles where id = '00000000-0000-4000-8000-000000000002'")).rows[0].hearts,
    1,
    'A received item heart must update the profile total'
  );

  const removedHeart = await database.query(
    'select public.toggle_ootie_item_heart($1, $2) as result',
    [publicHeartItem.rows[0].id, visitorId]
  );
  assert.deepEqual(removedHeart.rows[0].result, { liked: false, heart_count: 0 });
  assert.equal(
    (await database.query("select hearts from public.profiles where id = '00000000-0000-4000-8000-000000000002'")).rows[0].hearts,
    0,
    'Removing an item heart must update the profile total'
  );
  await database.exec("reset role; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false); set role authenticated");

  await assert.rejects(
    database.query("insert into public.ootie_bookmarks (owner_id, product_url, title) values ('00000000-0000-4000-8000-000000000001', 'https://example.test/forged', 'Forged')"),
    /row-level security|policy/i,
    'A user must not be able to write a bookmark for another owner'
  );
  await assert.rejects(
    database.query("insert into storage.objects (bucket_id, name) values ('ootie-bookmarks-images', 'bookmarks/00000000-0000-4000-8000-000000000001/forged.jpg')"),
    /row-level security|policy/i,
    'A user must not be able to upload an image under another owner UUID'
  );

  await database.exec('reset role');
  await database.exec("select set_config('request.jwt.claim.sub', '', false)");
  await database.exec('set role anon');
  const publicItems = await database.query('select name from public.items order by name');
  assert.deepEqual(publicItems.rows.map((row) => row.name), ['Shared item'], 'Public closets expose visible items but not hidden items');
  await database.exec('reset role');
  const bucket = await database.query("select count(*)::int as count from storage.buckets where id = 'ootie-bookmarks-images'");
  assert.equal(bucket.rows[0].count, 1, 'Storage bucket setup must be idempotent');

  console.log(`Migration smoke passed: ${migrationFiles.length} migrations applied twice; Auth profile trigger and owner isolation verified.`);
} finally {
  await database.close();
}
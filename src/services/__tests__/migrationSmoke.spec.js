import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

describe('Supabase Migrations Smoke Test', () => {
  it('applies all migrations twice idempotently and verifies Auth triggers and RLS policies', async () => {
    const root = process.cwd();
    const migrationDirectory = resolve(root, 'supabase/migrations');
    const migrationFiles = (await readdir(migrationDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    expect(migrationFiles.length).toBeGreaterThan(0);

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

      // Verify idempotency by applying migrations twice
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

      // 1. Verify Auth profile trigger creates profiles matching auth.users
      const profiles = await database.query(
        "select count(*)::int as count from public.profiles where id in ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')"
      );
      expect(profiles.rows[0].count).toBe(2);

      // 2. Set authenticated context as user 1 and insert items and bookmarks
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

      // 3. Verify closet stats functions
      const closetStats = await database.query('select public.get_closet_stats() as stats');
      expect(Object.keys(closetStats.rows[0].stats).sort()).toEqual([
        'categoryStats', 'colorFamilyStats', 'colorStats', 'styleStats'
      ]);

      // 4. Verify RLS private data isolation for user 2
      await database.exec("select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false)");
      const user2Bookmarks = await database.query('select id from public.ootie_bookmarks');
      const user2Items = await database.query('select id from public.items');
      expect(user2Bookmarks.rows.length).toBe(0);
      expect(user2Items.rows.length).toBe(0);

      await database.exec(`
        insert into public.items (owner_id, name, hidden)
          values
            ('00000000-0000-4000-8000-000000000002', 'Shared item', false),
            ('00000000-0000-4000-8000-000000000002', 'Hidden item', true);
      `);

      // 5. Verify RLS rejects cross-user writes
      await expect(
        database.query("insert into public.ootie_bookmarks (owner_id, product_url, title) values ('00000000-0000-4000-8000-000000000001', 'https://example.test/forged', 'Forged')")
      ).rejects.toThrow(/row-level security|policy/i);

      await expect(
        database.query("insert into storage.objects (bucket_id, name) values ('ootie-bookmarks-images', 'bookmarks/00000000-0000-4000-8000-000000000001/forged.jpg')")
      ).rejects.toThrow(/row-level security|policy/i);

      // 6. Verify anonymous access respects privacy
      await database.exec('reset role');
      await database.exec("select set_config('request.jwt.claim.sub', '', false)");
      await database.exec('set role anon');
      const publicItems = await database.query('select name from public.items order by name');
      expect(publicItems.rows.map((row) => row.name)).toEqual(['Shared item']);

      // 7. Verify storage bucket idempotency
      await database.exec('reset role');
      const bucket = await database.query("select count(*)::int as count from storage.buckets where id = 'ootie-bookmarks-images'");
      expect(bucket.rows[0].count).toBe(1);
    } finally {
      await database.close();
    }
  }, 35000);
});

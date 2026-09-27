import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createFixtureWorld } from '@/features/sos/fixture';
import { outfitRows } from '@/features/sos/outfitBoard';

it('uses bundled JPEG photos for every fixture item and covers all outfit categories', () => {
  const { items } = createFixtureWorld();
  expect(new Set(items.map(item => item.category))).toEqual(new Set([
    'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Bags', 'Accessories', 'Dress'
  ]));
  for (const item of items) {
    expect(item.photo).toMatch(/^\/assets\/sos-fixture\/[a-z]+\.jpg$/);
    const bytes = readFileSync(resolve('public', item.photo.slice(1)));
    expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  }
});

it('keeps three OPEN owner-scoped public closets and an unknown CLOSED history', () => {
  const { items, sosPosts } = createFixtureWorld();
  const byId = new Map(items.map(item => [item.id, item]));
  const open = sosPosts.filter(post => post.status === 'OPEN');
  expect(open).toHaveLength(3);
  for (const post of open) {
    expect(post.closet_item_ids.length).toBeGreaterThanOrEqual(3);
    expect(post.closet_item_ids.length).toBeLessThanOrEqual(6);
    expect(post.closet_item_ids.every(id => byId.get(id)?.owner_id === post.sender_id)).toBe(true);
    expect(post.closet_item_ids).not.toContain(`${post.sender_id}-private`);
  }
  expect(sosPosts.find(post => post.id === 'fixture-history')).toMatchObject({ status: 'CLOSED', closet_item_ids: null });
});

it('seeds three valid outfits, requester-liked and adopted states without closing SOS', () => {
  const world = createFixtureWorld();
  const posts = new Map(world.sosPosts.map(post => [post.id, post]));
  const items = new Map(world.items.map(item => [item.id, item]));
  expect(world.outfitSuggestions).toHaveLength(3);
  for (const suggestion of world.outfitSuggestions) {
    const post = posts.get(suggestion.sos_id);
    expect(post.status).toBe('OPEN');
    expect(suggestion.responder_id).not.toBe(post.sender_id);
    expect(suggestion.item_ids.every(id => post.closet_item_ids.includes(id))).toBe(true);
  }
  const categories = world.outfitSuggestions.map(suggestion =>
    outfitRows(suggestion.item_ids.map(id => items.get(id))).flat().map(group => group.key));
  expect(categories).toEqual([
    ['tops', 'bags', 'bottoms', 'shoes'],
    ['outerwear', 'tops', 'bottoms', 'shoes'],
    ['dress', 'accessories', 'shoes']
  ]);
  const post = posts.get('fixture-sos-1');
  expect(post.status).toBe('OPEN');
  expect(post.liked_suggestion_ids).toContain('fixture-suggestion-a');
  expect(post.adopted_suggestion_id).toBe('fixture-suggestion-b');
  expect(world.likes).toContainEqual(expect.objectContaining({ actorId: post.sender_id, suggestionId: 'fixture-suggestion-a' }));
});

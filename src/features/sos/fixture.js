import { emptyWorld } from './storage';

// Synthetic identities and licensed demo photos never enter the real Closet/Profile.
export const fixtureProfiles = [
  { id: 'fixture-a', name: 'Sandy', username: '@sandy', initials: 'SA', helped: 0 },
  { id: 'fixture-b', name: 'Ella', username: '@ella', initials: 'EL', helped: 2 },
  { id: 'fixture-c', name: 'Mika', username: '@mika', initials: 'MK', helped: 1 }
];

const photo = category => `/assets/sos-fixture/${category}.jpg`;
const clothing = (owner, id, name, category) => ({
  id: `${owner}-${id}`, owner_id: owner, name, name_zh: name, category,
  photo: photo(category.toLowerCase())
});

export function createFixtureWorld() {
  const world = emptyWorld();
  world.profiles = fixtureProfiles.map(profile => ({ ...profile }));
  world.items = [
    clothing('fixture-a', 'shirt', '藍色丹寧襯衫', 'Tops'),
    clothing('fixture-a', 'pants', '淺藍牛仔褲', 'Bottoms'),
    clothing('fixture-a', 'jacket', '復古棕色外套', 'Outerwear'),
    clothing('fixture-a', 'shoes', '白色高筒球鞋', 'Shoes'),
    clothing('fixture-a', 'bag', '白色帆布托特包', 'Bags'),
    clothing('fixture-a', 'private', '未公開的居家上衣', 'Tops'),
    clothing('fixture-b', 'shirt', '藍色丹寧襯衫', 'Tops'),
    clothing('fixture-b', 'pants', '淺藍牛仔褲', 'Bottoms'),
    clothing('fixture-b', 'jacket', '復古棕色外套', 'Outerwear'),
    clothing('fixture-b', 'shoes', '白色高筒球鞋', 'Shoes'),
    clothing('fixture-b', 'private', '未公開的居家上衣', 'Tops'),
    clothing('fixture-c', 'shirt', '藍色丹寧襯衫', 'Tops'),
    clothing('fixture-c', 'pants', '淺藍牛仔褲', 'Bottoms'),
    clothing('fixture-c', 'jacket', '復古棕色外套', 'Outerwear'),
    clothing('fixture-c', 'dress', '白底花卉洋裝', 'Dress'),
    clothing('fixture-c', 'shoes', '白色高筒球鞋', 'Shoes'),
    clothing('fixture-c', 'accessories', '金色項鍊', 'Accessories'),
    clothing('fixture-c', 'private', '未公開的居家上衣', 'Tops')
  ];
  const themes = [
    ['週末散步兼逛展，怎麼穿舒服又有精神？', '戶外活動', '週末', '想走一整天，穿著要方便活動；晚上可能變涼。', ['fixture-a-shirt', 'fixture-a-pants', 'fixture-a-jacket', 'fixture-a-shoes', 'fixture-a-bag']],
    ['明天咖啡廳約會，想自然一點又有打扮感', '約會', '明天', '不想太正式，喜歡乾淨的配色。可以幫我選一套嗎？', ['fixture-b-shirt', 'fixture-b-pants', 'fixture-b-jacket', 'fixture-b-shoes']],
    ['週末戶外聚會，想輕鬆又有打扮感', '聚會', '週末', '白天在戶外走動，想穿得輕鬆，也希望有一點精緻細節。', ['fixture-c-shirt', 'fixture-c-pants', 'fixture-c-jacket', 'fixture-c-dress', 'fixture-c-shoes', 'fixture-c-accessories']]
  ];
  world.sosPosts = fixtureProfiles.map((profile, index) => ({
    id: `fixture-sos-${index + 1}`, sender_id: profile.id, closet_owner_id: profile.id,
    username: profile.username, initials: profile.initials, title: themes[index][0],
    occasion: themes[index][1], weather: '涼爽', when_label: themes[index][2], vibes: ['Relaxed', 'Smart Casual'],
    details: themes[index][3], closet_item_ids: themes[index][4],
    status: 'OPEN', adopted_suggestion_id: index === 0 ? 'fixture-suggestion-b' : null,
    liked_suggestion_ids: index === 0 ? ['fixture-suggestion-a'] : [],
    created_at: '2026-09-26T08:00:00.000Z'
  }));
  world.sosPosts.push({ ...world.sosPosts[0], id: 'fixture-history', title: '上次旅行的穿搭紀錄', status: 'CLOSED', closet_item_ids: null, adopted_suggestion_id: null, liked_suggestion_ids: [] });
  world.outfitSuggestions = [
    { id: 'fixture-suggestion-a', sos_id: 'fixture-sos-1', responder_id: 'fixture-b', username: '@ella', item_ids: ['fixture-a-shirt', 'fixture-a-pants', 'fixture-a-shoes', 'fixture-a-bag'], message: '丹寧襯衫搭牛仔褲和白球鞋，帆布包剛好裝逛展小物。', hearts: 0, created_at: '2026-09-26T09:00:00.000Z' },
    { id: 'fixture-suggestion-b', sos_id: 'fixture-sos-1', responder_id: 'fixture-c', username: '@mika', item_ids: ['fixture-a-jacket', 'fixture-a-shirt', 'fixture-a-pants', 'fixture-a-shoes'], message: '傍晚降溫時加上復古棕色外套，讓丹寧搭配有層次。', hearts: 0, created_at: '2026-09-26T09:20:00.000Z' },
    { id: 'fixture-suggestion-c', sos_id: 'fixture-sos-3', responder_id: 'fixture-b', username: '@ella', item_ids: ['fixture-c-dress', 'fixture-c-shoes', 'fixture-c-accessories'], message: '花卉洋裝搭白球鞋和細項鍊，輕鬆走動也有細節。', hearts: 0, created_at: '2026-09-26T09:40:00.000Z' }
  ];
  world.likes = [{ id: 'fixture-like-a', actorId: 'fixture-a', sosId: 'fixture-sos-1', suggestionId: 'fixture-suggestion-a' }];
  return world;
}

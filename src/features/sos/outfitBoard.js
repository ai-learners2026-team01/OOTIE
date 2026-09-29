// Presentation only. Keep the clothing category values in storage unchanged.
const CATEGORY_MAP = {
  outerwear: ['Outerwear', '外套'],
  tops: ['Tops', '上衣'],
  bottoms: ['Bottoms', '下身'],
  dress: ['Dress', '洋裝'],
  shoes: ['Shoes', '鞋子'],
  bags: ['Bags', '包包'],
  accessories: ['Accessories', '配件']
};

const ALIASES = {
  outerwear: 'outerwear', coat: 'outerwear', jacket: 'outerwear', 外套: 'outerwear',
  tops: 'tops', top: 'tops', shirt: 'tops', 上衣: 'tops',
  bottoms: 'bottoms', bottom: 'bottoms', pants: 'bottoms', skirt: 'bottoms', 下身: 'bottoms', 下裝: 'bottoms',
  dress: 'dress', dresses: 'dress', 洋裝: 'dress',
  shoes: 'shoes', shoe: 'shoes', footwear: 'shoes', 鞋: 'shoes', 鞋子: 'shoes',
  bags: 'bags', bag: 'bags', 包包: 'bags', 包款: 'bags',
  accessories: 'accessories', accessory: 'accessories', 配件: 'accessories'
};

export const outfitCategory = category => ALIASES[String(category || '').trim().toLowerCase()] || 'other';

export function outfitRows(items) {
  const grouped = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!item) continue;
    const key = outfitCategory(item.category);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  const group = key => ({ key, label: CATEGORY_MAP[key]?.[1] || '其他', items: grouped.get(key) || [] });
  return [
    ['outerwear'], ['tops'], ['dress'], ['bags', 'accessories'],
    ['bottoms'], ['shoes'], ['other']
  ].map(keys => keys.filter(key => grouped.has(key)).map(group)).filter(row => row.length);
}

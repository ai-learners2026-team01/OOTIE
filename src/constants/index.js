export const STORAGE_KEY = 'weary-app-state-v1';
export const BOOKMARKS_STORAGE_KEY = 'ootie-bookmarks-data';
export const imageBase = 'https://images.unsplash.com/';

export const DISUSED_DAYS_THRESHOLD = 90;
export const DISUSED_WEAR_COUNT_THRESHOLD = 2;

export const categories = ['All', 'Tops', 'Bottoms', 'Dress', 'Outerwear', 'Shoes', 'Bags', 'Accessories'];

export const colorFamilies = ['無彩色系', '大地色系', '清甜暖色系', '藍綠冷色系', '紫紅神秘系'];

export const colorDetailGroups = {
  '無彩色系': [['白色', 'color-white'], ['黑色', 'color-black'], ['炭灰色', 'color-charcoal'], ['米白色', 'color-beige']],
  '大地色系': [['卡其色', 'color-khaki'], ['奶茶色', 'color-milk-tea'], ['棕色', 'color-brown']],
  '清甜暖色系': [['暖橙色', 'color-orange'], ['奶油黃', 'color-butter'], ['櫻花粉', 'color-pink'], ['芥末黃', 'color-mustard']],
  '藍綠冷色系': [['丹寧藍', 'color-denim'], ['天藍色', 'color-sky'], ['軍綠色', 'color-olive'], ['酪梨綠', 'color-avocado']],
  '紫紅神秘系': [['酒紅色', 'color-wine'], ['薰衣草紫', 'color-lavender'], ['玫瑰紅', 'color-rose'], ['葡萄紫', 'color-grape']]
};

export const colorHexValues = {
  '白色': '#F5F3EC', '黑色': '#242321', '炭灰色': '#55565A', '米白色': '#F1EAD9',
  '卡其色': '#C2A878', '奶茶色': '#C8A98A', '棕色': '#806454',
  '暖橙色': '#E58B4A', '奶油黃': '#F2D77B', '櫻花粉': '#F4C2C2', '芥末黃': '#C49A28',
  '丹寧藍': '#3B5998', '天藍色': '#83C5E8', '軍綠色': '#4B5320', '酪梨綠': '#8A9A5B',
  '酒紅色': '#722F37', '薰衣草紫': '#B7A4D4', '玫瑰紅': '#C85A70', '葡萄紫': '#653B83'
};

export const legacyColorNames = {
  White: '白色', Black: '黑色', Blue: '丹寧藍', Beige: '米白色', Brown: '棕色', Gray: '炭灰色', Grey: '炭灰色'
};

export function getColorFamilyForPrimaryColor(color) {
  const normalizedColor = legacyColorNames[color] || color;
  return Object.entries(colorDetailGroups).find(([, details]) => details.some(([name]) => name === normalizedColor))?.[0] || '';
}

export const labels = {
  All: '全部',
  Tops: '上衣',
  Bottoms: '下身',
  Dress: '洋裝',
  Outerwear: '外套',
  Shoes: '鞋履',
  Bags: '包款',
  Accessories: '配件',
  White: '白色',
  Black: '黑色',
  Blue: '丹寧藍',
  Beige: '米色',
  Brown: '棕色',
  '無彩色系': '無彩色系',
  '大地色系': '大地色系',
  '清甜暖色系': '清甜暖色系',
  '藍綠冷色系': '藍綠冷色系',
  '紫紅神秘系': '紫紅神秘系',
  Minimal: '極簡',
  Casual: '休閒',
  'Smart Casual': '簡約正式',
  Chic: '時髦',
  'Spring / Summer': '春夏',
  'Autumn / Winter': '秋冬',
  'All year': '四季'
};

export const occasions = [
  { label: '上班', title: '工作日的俐落一套', copy: '簡潔、舒服，讓你自在地完成今天的待辦。', picks: ['1', '4', '6'] },
  { label: '約會', title: '浪漫約會提案', copy: '保留一點柔和感，再加上一個讓人記住的細節。', picks: ['5', '4', '6'] },
  { label: '旅行', title: '旅行中的輕盈層次', copy: '好走、好搭，也能應付旅途中變化的天氣。', picks: ['2', '3', '6'] },
  { label: '隨性', title: '週末的輕鬆日常', copy: '柔軟、舒服，也保留一點俐落感。', picks: ['7', '2', '4'] },
  { label: '聚會', title: '亮眼又不失溫度的聚會提案', copy: '適合與朋友聚餐、發表近況的明亮視覺。', picks: ['1', '5', '6'] },
  { label: '正式', title: '經典得體的正式著裝', copy: '剪裁流暢、細節到位的滿分搭配。', picks: ['1', '4', '8'] },
  { label: '運動', title: '活動量滿分的輕便層次', copy: '延展性好、透氣無負擔的動態美感。', picks: ['7', '2', '6'] }
];

export const defaultFollowingUsers = ['@minji', '@nora', '@jules'];

export const defaultItems = [
  { id: '1', owner_id: 'profile-01', name: 'Blue printed shirt', name_zh: '藍色印花襯衫', brand: '', category: 'Tops', shape: 'Relaxed fit', primary_color: 'Blue', secondary_color: '藍綠冷色系', color_hex: '#44576A', style: 'Smart Casual', season: 'Spring / Summer', photo: imageBase + 'photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85', price: 1980, wear_count: 12, last_worn: '2026-09-18', purchase_date: '2025-03-12', favorite: true, hidden: false, notes: 'A reliable everyday layer.', virtual_heart_count: 18, created_at: '2026-01-04' },
  { id: '2', owner_id: 'profile-01', name: 'Straight denim jeans', name_zh: '直筒牛仔褲', brand: "Levi's", category: 'Bottoms', shape: 'Straight leg', primary_color: 'Blue', secondary_color: '藍綠冷色系', color_hex: '#3B5998', style: 'Casual', season: 'All year', photo: imageBase + 'photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=85', price: 3490, wear_count: 24, last_worn: '2026-09-21', purchase_date: '2024-11-20', favorite: true, hidden: false, notes: 'Works with almost everything.', virtual_heart_count: 15, created_at: '2026-01-04' },
  { id: '3', owner_id: 'profile-01', name: 'White crewneck sweatshirt', name_zh: '白色圓領上衣', brand: '', category: 'Tops', shape: 'Relaxed crewneck', primary_color: 'White', secondary_color: '無彩色系', color_hex: '#F5F3EC', style: 'Minimal', season: 'Autumn / Winter', photo: imageBase + 'photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=85', price: 2890, wear_count: 8, last_worn: '2026-09-10', purchase_date: '2025-09-02', favorite: false, hidden: false, notes: 'A soft everyday crewneck.', virtual_heart_count: 13, created_at: '2026-01-04' },
  { id: '4', owner_id: 'profile-01', name: 'Brown zip jacket', name_zh: '棕色拉鍊外套', brand: '', category: 'Outerwear', shape: 'Zip jacket', primary_color: 'Brown', secondary_color: '大地色系', color_hex: '#806454', style: 'Chic', season: 'Autumn / Winter', photo: imageBase + 'photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=85', price: 4200, wear_count: 16, last_worn: '2026-09-20', purchase_date: '2025-02-14', favorite: true, hidden: false, notes: 'A warm brown zip jacket.', virtual_heart_count: 11, created_at: '2026-01-04' },
  { id: '5', owner_id: 'profile-01', name: 'Purple off-shoulder dress', name_zh: '紫色平口洋裝', brand: '', category: 'Dress', shape: 'Off-shoulder midi dress', primary_color: 'Purple', secondary_color: '紫色系', color_hex: '#6C4C91', style: 'Chic', season: 'Spring / Summer', photo: imageBase + 'photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=85', price: 3800, wear_count: 5, last_worn: '2026-08-29', purchase_date: '2025-06-18', favorite: false, hidden: false, notes: 'An elegant off-shoulder silhouette.', virtual_heart_count: 10, created_at: '2026-01-04' },
  { id: '6', owner_id: 'profile-01', name: 'Black quilted shoulder bag', name_zh: '黑色菱格肩背包', brand: 'Gucci', category: 'Bags', shape: 'Quilted shoulder bag', primary_color: 'Black', secondary_color: '無彩色系', color_hex: '#252525', style: 'Chic', season: 'All year', photo: imageBase + 'photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85', price: 12500, wear_count: 21, last_worn: '2026-09-21', purchase_date: '2024-08-07', favorite: false, hidden: false, notes: 'A quilted black shoulder bag.', virtual_heart_count: 8, created_at: '2026-01-04' },
  { id: '7', owner_id: 'profile-01', name: 'Outerwear on a clothing rack', name_zh: '衣架上的多款外套', brand: '', category: 'Outerwear', shape: 'Layered outerwear', primary_color: 'Blue', secondary_color: '藍綠冷色系', color_hex: '#6B8091', style: 'Casual', season: 'Autumn / Winter', photo: imageBase + 'photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85', price: 490, wear_count: 19, last_worn: '2026-09-16', purchase_date: '2025-04-01', favorite: false, hidden: false, notes: 'A clothing-rack outerwear reference.', virtual_heart_count: 6, created_at: '2026-01-04' },
  { id: '8', owner_id: 'profile-01', name: 'Blue belted long coat', name_zh: '藍色腰帶長版大衣', brand: '', category: 'Outerwear', shape: 'Belted long coat', primary_color: 'Blue', secondary_color: '藍綠冷色系', color_hex: '#6B91B1', style: 'Smart Casual', season: 'Autumn / Winter', photo: imageBase + 'photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=85', price: 8990, wear_count: 3, last_worn: '2026-02-15', purchase_date: '2025-12-05', favorite: true, notes: 'A long blue coat with a waist belt.', virtual_heart_count: 5, created_at: '2026-01-04' }
];

export const defaultProfile = {
  id: 'profile-01',
  user_id: 'user-01',
  name: 'Hayley Lin',
  username: '@hayley',
  initials: 'HL',
  avatar_url: '',
  bio: '用衣櫥記錄日常，也和衣友分享每一個穿搭靈感。',
  hearts: 0,
  helped: 24,
  likes: 0,
  public_closet: true,
  created_at: '2026-01-04'
};

const demoCommentUsers = ['@ella', '@minji', '@rachel', '@mika', '@hayley', '@nora', '@sofia', '@jules'];
const demoCommentTexts = [
  '這套配色好舒服，想照著搭一次！',
  '外套版型好好看，請問是哪個品牌？',
  '簡單又有層次，收藏這個靈感。',
  '鞋子跟整體風格好搭！',
  '很適合週末散步的穿搭。',
  '這個顏色意外地很耐看。',
  '配件選得剛剛好，整體完成度很高。',
  '可以分享一下單品資訊嗎？'
];

const createDemoComments = (postId, count, initialComments = []) => {
  const comments = [...initialComments];
  while (comments.length < count) {
    const index = comments.length;
    comments.push({
      id: `${postId}-comment-${index + 1}`,
      user: demoCommentUsers[index % demoCommentUsers.length],
      text: demoCommentTexts[(index + Number(postId.slice(-1))) % demoCommentTexts.length]
    });
  }
  return comments.slice(0, count);
};

export const exploreDemoOotdPosts = [
  { id: 'post-06', username: '@ava', initials: 'AV', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85', caption: '外套依色系掛好，丹寧、針織和大地色單品一眼就能找到。', wearing: ['軍綠外套', '駝色外套', '黑色皮衣', '淺色針織', '丹寧外套'], hashtags: ['#女性穿搭', '#衣櫥靈感'], styleCategory: '女性穿搭', likes: 83, comments: 2, liked: false, saved: false, following: false, commentList: createDemoComments('post-06', 2) },
  { id: 'post-07', username: '@ethan', initials: 'ET', image: 'https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?auto=format&fit=crop&w=900&q=85', caption: '駝色外套配直筒牛仔褲，為日常添一點俐落層次。', wearing: ['駝色外套', '直筒牛仔褲', '白色上衣'], hashtags: ['#男性穿搭', '#日常俐落'], styleCategory: '男性穿搭', likes: 67, comments: 3, liked: false, saved: false, following: false, commentList: createDemoComments('post-07', 3) },
  { id: 'post-08', username: '@chloe', initials: 'CH', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85', caption: '黑色透膚上衣搭同色下身，以輕薄材質穿出層次。', wearing: ['黑色透膚上衣', '黑色內搭', '黑色長裙'], hashtags: ['#女性穿搭', '#黑色層次'], styleCategory: '女性穿搭', likes: 54, comments: 2, liked: false, saved: false, following: false, commentList: createDemoComments('post-08', 2) },
  { id: 'post-09', username: '@noah', initials: 'NH', image: 'https://images.unsplash.com/photo-1627379114594-7aff6664cd94?auto=format&fit=crop&w=900&q=85', caption: '黑色西裝外套配丹寧褲，週末穿出輕鬆俐落感。', wearing: ['黑色西裝外套', '丹寧褲', '休閒鞋'], hashtags: ['#男性穿搭', '#週末穿搭'], styleCategory: '男性穿搭', likes: 92, comments: 4, liked: false, saved: false, following: false, commentList: createDemoComments('post-09', 4) },
  { id: 'post-10', username: '@liam', initials: 'LI', image: 'https://images.unsplash.com/photo-1618886614638-80e3c103d31a?auto=format&fit=crop&w=900&q=85', caption: '黑色西裝成套穿著，正式場合也保有俐落感。', wearing: ['黑色西裝外套', '黑色西裝褲', '皮鞋'], hashtags: ['#男性穿搭', '#正式穿搭'], styleCategory: '男性穿搭', likes: 76, comments: 3, liked: false, saved: false, following: false, commentList: createDemoComments('post-10', 3) },
  { id: 'post-11', username: '@runwithme', initials: 'RM', image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=85', caption: '白色運動內衣搭藍綠緊身褲，跑步時保持輕盈自在。', wearing: ['白色運動內衣', '藍綠緊身褲', '慢跑鞋'], hashtags: ['#運動穿搭', '#跑步日常'], styleCategory: '運動穿搭', likes: 48, comments: 2, liked: false, saved: false, following: false, commentList: createDemoComments('post-11', 2) },
  { id: 'post-12', username: '@activekai', initials: 'AK', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85', caption: '訓練日穿上透氣背心和短褲，專注動作也自在。', wearing: ['透氣運動背心', '訓練短褲', '運動鞋'], hashtags: ['#運動穿搭', '#訓練日'], styleCategory: '運動穿搭', likes: 61, comments: 3, liked: false, saved: false, following: false, commentList: createDemoComments('post-12', 3) },
  { id: 'post-13', username: '@tinycloset', initials: 'TC', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=85', caption: '孩子在戶外彩繪玩耍，穿上柔軟上衣自在探索色彩。', wearing: ['柔軟短袖上衣', '舒適長褲', '防滑鞋'], hashtags: ['#兒童穿搭', '#戶外彩繪'], styleCategory: '兒童穿搭', likes: 105, comments: 5, liked: false, saved: false, following: false, commentList: createDemoComments('post-13', 5) },
  { id: 'post-14', username: '@littlelook', initials: 'LL', image: 'https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=900&q=85', caption: '橘色外套配灰色長褲，戴上棒球帽去動物園探險。', wearing: ['橘色外套', '灰色長褲', '棒球帽', '休閒鞋'], hashtags: ['#兒童穿搭', '#戶外日常'], styleCategory: '兒童穿搭', likes: 72, comments: 3, liked: false, saved: false, following: false, commentList: createDemoComments('post-14', 3) }
];

export const defaultOotdPosts = [
  { id: 'post-01', username: '@minji', initials: 'MJ', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85', caption: '藍色長版大衣配白色長靴，在米蘭街頭穿出亮眼層次。', wearing: ['藍色長版大衣', '淺藍圍巾', '粉色腰包', '白色長靴'], hashtags: ['#女性穿搭', '#城市旅行'], styleCategory: '女性穿搭', likes: 328, comments: 18, liked: false, saved: false, following: true, commentList: createDemoComments('post-01', 18, [{ id: 'comment-01', user: '@ella', text: '這套層次好好看！' }, { id: 'comment-03', user: '@minji', text: '謝謝！外套是幾年前買的經典款～' }]) },
  { id: 'post-02', username: '@sofia', initials: 'SF', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85', caption: '亮黃色短版帽T搭同色運動長褲，週末穿出醒目活力。', wearing: ['黃色短版帽T', '同色運動長褲', '白色長靴'], hashtags: ['#女性穿搭', '#亮色休閒'], styleCategory: '女性穿搭', likes: 214, comments: 9, liked: true, saved: false, following: false, commentList: createDemoComments('post-02', 9) },
  { id: 'post-03', username: '@nora', initials: 'NR', image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85', caption: '深藍格紋長外套配酒紅手提包，冷天也有俐落層次。', wearing: ['深藍格紋長外套', '黑色內搭', '酒紅手提包'], hashtags: ['#女性穿搭', '#格紋外套'], styleCategory: '女性穿搭', likes: 186, comments: 12, liked: false, saved: true, following: true, commentList: createDemoComments('post-03', 12) },
  { id: 'post-04', username: '@alex', initials: 'AX', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85', caption: '藍色西裝搭白襯衫，俐落剪裁讓正式造型不顯拘謹。', wearing: ['藍色西裝外套', '白襯衫', '西裝長褲'], hashtags: ['#男性穿搭', '#簡約正式'], styleCategory: '男性穿搭', likes: 142, comments: 7, liked: false, saved: false, following: false, commentList: createDemoComments('post-04', 7) },
  { id: 'post-05', username: '@jules', initials: 'JL', image: 'https://images.unsplash.com/photo-1581382575275-97901c2635b7?auto=format&fit=crop&w=900&q=85', caption: '灰色西裝外套配黑褲，通勤正式又不拘謹。', wearing: ['灰色西裝外套', '黑色長褲', '皮鞋'], hashtags: ['#男性穿搭', '#通勤穿搭'], styleCategory: '男性穿搭', likes: 97, comments: 4, liked: false, saved: false, following: true, commentList: createDemoComments('post-05', 4) },
  ...exploreDemoOotdPosts
];

export const defaultNotifications = [
  { id: 'notification-01', text: '@ella 喜歡了你的穿搭。', time: '剛剛', read: false, target: 'explore', type: 'post-like', postId: 'post-01', userId: '@ella' },
  { id: 'notification-02', text: '你的 SOS 穿搭建議獲得了 3 個 Hearts。', time: '1 小時前', read: false, target: 'sos', type: 'sos-hearts', sosId: 'sos-01' },
  { id: 'notification-03', text: '@minji 回覆了你的留言。', time: '昨天', read: true, target: 'explore', type: 'comment-reply', postId: 'post-01', commentId: 'comment-03', userId: '@minji' }
];

export const defaultSosPosts = [
  { id: 'sos-01', sender_id: 'profile-02', closet_owner_id: 'profile-02', username: '@ella', initials: 'EL', title: '明天第一次約會，我該穿什麼？', occasion: '約會', weather: '涼爽', when_label: '明天', vibes: ['Soft', 'Elegant'], closet_item_ids: ['1', '2', '3', '5', '6'], closet_count: 5, details: '下午先去咖啡廳，晚上會去義大利餐廳，希望看起來有打扮但不要太正式。', status: 'OPEN', adopted_suggestion_id: null, liked_suggestion_ids: [] },
  { id: 'sos-02', sender_id: 'profile-03', closet_owner_id: 'profile-03', username: '@rachel', initials: 'RC', title: '面試新創公司，西裝會不會太正式？', occasion: '工作', weather: '晴天', when_label: '週五', vibes: ['Smart Casual', 'Confident'], closet_item_ids: ['1', '2', '4', '8'], closet_count: 4, details: '想要專業一點，但也希望保留自己的風格。', status: 'OPEN', adopted_suggestion_id: null, liked_suggestion_ids: [] },
  { id: 'sos-03', sender_id: 'profile-04', closet_owner_id: 'profile-04', username: '@mika', initials: 'MK', title: '週末戶外聚餐，怎麼穿才不怕冷？', occasion: '聚餐', weather: '微涼有風', when_label: '週末', vibes: ['Relaxed', 'Layered'], closet_item_ids: ['2', '3', '6', '7', '8'], closet_count: 5, details: '會在戶外待一整天，希望活動方便又好看。', status: 'OPEN', adopted_suggestion_id: null, liked_suggestion_ids: [] },
  { id: 'sos-04', sender_id: 'profile-01', closet_owner_id: 'profile-01', username: '@hayley', initials: 'HL', title: '旅行行李只能帶三套，拜託幫我選！', occasion: '旅行', weather: '晴天', when_label: '下週', vibes: ['Easy', 'Versatile'], closet_item_ids: ['1', '2', '3', '4', '6', '7'], closet_count: 6, details: '目的地白天溫暖、晚上偏涼，想要每件都能互相搭配。', status: 'OPEN', adopted_suggestion_id: null, liked_suggestion_ids: [] }
];

export const defaultBookmarks = [
  {
    id: 'bookmark-01',
    owner_id: 'profile-01',
    product_url: 'https://www.aritzia.com/ca/en/product/ilana-cardigan/32703.html',
    title: 'The Ilana Cardigan',
    image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
    image_storage_path: '',
    brand: 'Aritzia',
    price: '3990',
    currency: 'TWD',
    variant_name: 'Caramel beige',
    color: 'Beige',
    size: 'M',
    source_domain: 'aritzia.com',
    notes: '想等週末再買，先存起來。',
    created_at: '2026-09-18T10:00:00.000Z',
    updated_at: '2026-09-18T10:00:00.000Z'
  },
  {
    id: 'bookmark-02',
    owner_id: 'profile-01',
    product_url: 'https://www.zara.com/tw/zh/p/%E5%A4%A7%E8%B2%8C%E5%8F%8D%E7%A7%8B%E8%A4%B2%E8%A1%AB-p08412317.html',
    title: 'Oversized striped shirt',
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85',
    image_storage_path: '',
    brand: 'Zara',
    price: '1990',
    currency: 'TWD',
    variant_name: '條紋款',
    color: 'White / Blue',
    size: 'L',
    source_domain: 'zara.com',
    notes: '這件很適合和牛仔褲搭配。',
    created_at: '2026-09-20T10:00:00.000Z',
    updated_at: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 'bookmark-03',
    owner_id: 'profile-01',
    product_url: 'https://www.mango.com/tw/%E7%A9%9F%E8%83%BD%E5%8C%96%E6%94%BE%E9%AB%92-p-123456',
    title: 'Wide-leg trousers',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=85',
    image_storage_path: '',
    brand: 'Mango',
    price: '2490',
    currency: 'TWD',
    variant_name: 'Wide-leg',
    color: 'Black',
    size: '34',
    source_domain: 'mango.com',
    notes: '想搭配鞋款先保留。',
    created_at: '2026-09-22T10:00:00.000Z',
    updated_at: '2026-09-22T10:00:00.000Z'
  }
];



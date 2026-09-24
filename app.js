/* ===================== 共用資料與狀態（跨頁面透過 localStorage 保留） ===================== */
const STORAGE_KEY = 'weary-app-state-v1';
const SOS_CLOSET_PREVIEW_LIMIT = 10;
const imageBase = 'https://images.unsplash.com/';

const defaultItems = [
  { id:'1', owner_id:'profile-01', name:'Classic white shirt', name_zh:'白色經典襯衫', brand:'COS', category:'Tops', shape:'Relaxed fit', primary_color:'White', secondary_color:'', color_hex:'#F5F3EC', style:'Smart Casual', season:'Spring / Summer', photo:imageBase+'photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85', wear_count:12, last_worn:'2026-09-18', purchase_date:'2025-03-12', favorite:true, hidden:false, notes:'A reliable everyday layer.', created_at:'2026-01-04' },
  { id:'2', owner_id:'profile-01', name:'Straight denim', name_zh:'直筒牛仔褲', brand:'Levi\'s', category:'Bottoms', shape:'Straight leg', primary_color:'Blue', secondary_color:'', color_hex:'#63778A', style:'Casual', season:'All year', photo:imageBase+'photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=85', wear_count:24, last_worn:'2026-09-21', purchase_date:'2024-11-20', favorite:true, hidden:false, notes:'Works with almost everything.', created_at:'2026-01-04' },
  { id:'3', owner_id:'profile-01', name:'Soft knit cardigan', name_zh:'柔軟針織外套', brand:'Arket', category:'Outerwear', shape:'Cropped cardigan', primary_color:'Beige', secondary_color:'', color_hex:'#C7B9A5', style:'Minimal', season:'Autumn / Winter', photo:imageBase+'photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=85', wear_count:8, last_worn:'2026-09-10', purchase_date:'2025-09-02', favorite:false, hidden:false, notes:'Warm without feeling heavy.', created_at:'2026-01-04' },
  { id:'4', owner_id:'profile-01', name:'Black leather loafers', name_zh:'黑色樂福鞋', brand:'Vagabond', category:'Shoes', shape:'Penny loafer', primary_color:'Black', secondary_color:'', color_hex:'#242321', style:'Chic', season:'All year', photo:imageBase+'photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=85', wear_count:16, last_worn:'2026-09-20', purchase_date:'2025-02-14', favorite:true, hidden:false, notes:'The finishing touch for work days.', created_at:'2026-01-04' },
  { id:'5', owner_id:'profile-01', name:'Silk slip dress', name_zh:'絲質吊帶洋裝', brand:'& Other Stories', category:'Dress', shape:'Midi slip dress', primary_color:'Brown', secondary_color:'', color_hex:'#806454', style:'Chic', season:'Spring / Summer', photo:imageBase+'photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=85', wear_count:5, last_worn:'2026-08-29', purchase_date:'2025-06-18', favorite:false, hidden:false, notes:'Easy for dinners and special plans.', created_at:'2026-01-04' },
  { id:'6', owner_id:'profile-01', name:'Canvas shoulder bag', name_zh:'帆布肩背包', brand:'Lemaire', category:'Bags', shape:'Small shoulder bag', primary_color:'Beige', secondary_color:'Brown', color_hex:'#C4B49C', style:'Casual', season:'All year', photo:imageBase+'photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85', wear_count:21, last_worn:'2026-09-21', purchase_date:'2024-08-07', favorite:false, hidden:false, notes:'Fits phone, wallet and a little more.', created_at:'2026-01-04' },
  { id:'7', owner_id:'profile-01', name:'Ribbed tank top', name_zh:'羅紋背心', brand:'Uniqlo', category:'Tops', shape:'Fitted tank', primary_color:'Black', secondary_color:'', color_hex:'#252525', style:'Minimal', season:'Spring / Summer', photo:imageBase+'photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85', wear_count:19, last_worn:'2026-09-16', purchase_date:'2025-04-01', favorite:false, hidden:false, notes:'A base layer for warm days.', created_at:'2026-01-04' },
  { id:'8', owner_id:'profile-01', name:'Wool wrap coat', name_zh:'羊毛綁帶大衣', brand:'Massimo Dutti', category:'Outerwear', shape:'Wrap coat', primary_color:'Brown', secondary_color:'', color_hex:'#68584B', style:'Smart Casual', season:'Autumn / Winter', photo:imageBase+'photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=85', wear_count:3, last_worn:'2026-02-15', purchase_date:'2025-12-05', favorite:true, hidden:false, notes:'Structured but still soft.', created_at:'2026-01-04' }
  ,{ id:'ella-1', owner_id:'profile-ella', name:'Ivory blouse', name_zh:'象牙白襯衫', brand:'Mock Atelier', category:'Tops', shape:'Soft blouse', primary_color:'White', secondary_color:'', color_hex:'#F2EEE5', style:'Minimal', season:'All year', photo:imageBase+'photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85', wear_count:4, last_worn:'2026-09-10', purchase_date:'2025-05-14', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
  ,{ id:'ella-2', owner_id:'profile-ella', name:'Satin midi skirt', name_zh:'緞面中長裙', brand:'Mock Atelier', category:'Bottoms', shape:'Midi skirt', primary_color:'Brown', secondary_color:'', color_hex:'#806454', style:'Chic', season:'All year', photo:imageBase+'photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85', wear_count:2, last_worn:'2026-09-03', purchase_date:'2025-07-02', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
  ,{ id:'rachel-1', owner_id:'profile-rachel', name:'Relaxed blazer', name_zh:'寬版西裝外套', brand:'Mock Atelier', category:'Outerwear', shape:'Relaxed blazer', primary_color:'Black', secondary_color:'', color_hex:'#252525', style:'Smart Casual', season:'All year', photo:imageBase+'photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=85', wear_count:3, last_worn:'2026-09-08', purchase_date:'2025-04-12', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
  ,{ id:'rachel-2', owner_id:'profile-rachel', name:'White sneakers', name_zh:'白色球鞋', brand:'Mock Atelier', category:'Shoes', shape:'Low top', primary_color:'White', secondary_color:'', color_hex:'#F5F3EC', style:'Casual', season:'All year', photo:imageBase+'photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=85', wear_count:7, last_worn:'2026-09-12', purchase_date:'2025-01-20', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
  ,{ id:'mika-1', owner_id:'profile-mika', name:'Layered knit', name_zh:'層次針織上衣', brand:'Mock Atelier', category:'Tops', shape:'Relaxed knit', primary_color:'Beige', secondary_color:'', color_hex:'#C7B9A5', style:'Casual', season:'Autumn / Winter', photo:imageBase+'photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=85', wear_count:5, last_worn:'2026-09-01', purchase_date:'2025-08-11', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
  ,{ id:'mika-2', owner_id:'profile-mika', name:'Utility trousers', name_zh:'戶外工裝褲', brand:'Mock Atelier', category:'Bottoms', shape:'Straight leg', primary_color:'Blue', secondary_color:'', color_hex:'#63778A', style:'Casual', season:'All year', photo:imageBase+'photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=85', wear_count:6, last_worn:'2026-09-06', purchase_date:'2025-03-23', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
  ,{ id:'jo-1', owner_id:'profile-jo', name:'Travel shirt', name_zh:'旅行薄襯衫', brand:'Mock Atelier', category:'Tops', shape:'Relaxed fit', primary_color:'Blue', secondary_color:'', color_hex:'#63778A', style:'Minimal', season:'Spring / Summer', photo:imageBase+'photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85', wear_count:4, last_worn:'2026-09-05', purchase_date:'2025-06-04', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
  ,{ id:'jo-2', owner_id:'profile-jo', name:'Lightweight cardigan', name_zh:'輕薄針織外套', brand:'Mock Atelier', category:'Outerwear', shape:'Cardigan', primary_color:'Beige', secondary_color:'', color_hex:'#C7B9A5', style:'Casual', season:'All year', photo:imageBase+'photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=85', wear_count:3, last_worn:'2026-09-07', purchase_date:'2025-09-17', favorite:false, hidden:false, notes:'', created_at:'2026-01-04' }
];
const defaultProfile = { id:'profile-01', user_id:'user-01', name:'Hayley Lin', username:'@hayley', initials:'HL', avatar_url:'', bio:'用衣櫥記錄日常，也和衣友分享每一個穿搭靈感。', hearts:328, helped:24, likes:186, public_closet:true, created_at:'2026-01-04' };
const defaultOotdPosts = [
  { id:'post-01', username:'@minji', initials:'MJ', image:'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85', caption:'一件外套，讓簡單的白 T 也有了秋天的樣子。', wearing:['羊毛大衣','白色上衣','直筒牛仔褲'], hashtags:['#everydaystyle','#autumn'], likes:328, comments:18, liked:false, saved:false, following:true, commentList:[{user:'@ella',text:'這套層次好好看！'}] },
  { id:'post-02', username:'@sofia', initials:'SF', image:'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=85', caption:'週末散步，喜歡這種不需要想太多的搭配。', wearing:['針織上衣','長裙'], hashtags:['#minimal','#weekend'], likes:214, comments:9, liked:true, saved:false, following:false, commentList:[] },
  { id:'post-03', username:'@nora', initials:'NR', image:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85', caption:'今天的顏色是奶油白和一點點棕色。', wearing:['絲質洋裝','肩背包'], hashtags:['#softlook','#ootd'], likes:186, comments:12, liked:false, saved:true, following:true, commentList:[] },
  { id:'post-04', username:'@alex', initials:'AX', image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85', caption:'工作日也想穿得像自己。', wearing:['西裝外套','樂福鞋'], hashtags:['#workwear','#smartcasual'], likes:142, comments:7, liked:false, saved:false, following:false, commentList:[] },
  { id:'post-05', username:'@jules', initials:'JL', image:'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=85', caption:'把熟悉的單品重新搭一次，總會有新發現。', wearing:['寬鬆襯衫','黑色長褲'], hashtags:['#closetremix','#dailylook'], likes:97, comments:4, liked:false, saved:false, following:true, commentList:[] }
];
const defaultNotifications = [
  { id:'notification-01', text:'@ella 喜歡了你的穿搭。', time:'剛剛', read:false, target:'explore' },
  { id:'notification-02', text:'你的 SOS 穿搭建議獲得了 3 個 Hearts。', time:'1 小時前', read:false, target:'sos' },
  { id:'notification-03', text:'@minji 回覆了你的留言。', time:'昨天', read:true, target:'explore' }
];
const defaultSosPosts = [
  { id:'sos-01', sender_id:'profile-ella', username:'@ella', initials:'EL', title:'明天第一次約會，我該穿什麼？', occasion:'約會', weather:'涼爽', when_label:'明天', vibes:['Soft','Elegant'], closet_item_ids:['ella-1','ella-2'], closet_count:2, details:'下午先去咖啡廳，晚上會去義大利餐廳，希望看起來有打扮但不要太正式。' },
  { id:'sos-02', sender_id:'profile-rachel', username:'@rachel', initials:'RC', title:'面試新創公司，西裝會不會太正式？', occasion:'工作', weather:'晴天', when_label:'週五', vibes:['Smart Casual','Confident'], closet_item_ids:['rachel-1','rachel-2'], closet_count:2, details:'想要專業一點，但也希望保留自己的風格。' },
  { id:'sos-03', sender_id:'profile-mika', username:'@mika', initials:'MK', title:'週末戶外聚餐，怎麼穿才不怕冷？', occasion:'聚餐', weather:'微涼有風', when_label:'週末', vibes:['Relaxed','Layered'], closet_item_ids:['mika-1','mika-2'], closet_count:2, details:'會在戶外待一整天，希望活動方便又好看。' },
  { id:'sos-04', sender_id:'profile-jo', username:'@jo', initials:'JO', title:'旅行行李只能帶三套，拜託幫我選！', occasion:'旅行', weather:'晴天', when_label:'下週', vibes:['Easy','Versatile'], closet_item_ids:['jo-1','jo-2'], closet_count:2, details:'目的地白天溫暖、晚上偏涼，想要每件都能互相搭配。' }
];
const categories = ['All','Tops','Bottoms','Dress','Outerwear','Shoes','Bags','Accessories'];
const labels = { All:'全部', Tops:'上衣', Bottoms:'下身', Dress:'洋裝', Outerwear:'外套', Shoes:'鞋履', Bags:'包款', Accessories:'配件', White:'白色', Black:'黑色', Blue:'藍色', Beige:'米色', Brown:'棕色', Minimal:'極簡', Casual:'休閒', 'Smart Casual':'簡約正式', Chic:'時髦', 'Spring / Summer':'春夏', 'Autumn / Winter':'秋冬', 'All year':'四季' };
const occasions = [
  { label:'上班', title:'工作日的俐落一套', copy:'簡潔、舒服，讓你自在地完成今天的待辦。', picks:['1','4','6'] },
  { label:'約會', title:'浪漫約會提案', copy:'保留一點柔和感，再加上一個讓人記住的細節。', picks:['5','4','6'] },
  { label:'旅行', title:'旅行中的輕盈層次', copy:'好走、好搭，也能應付旅途中變化的天氣。', picks:['2','3','6'] },
  { label:'隨性', title:'週末的輕鬆日常', copy:'柔軟、舒服，也保留一點俐落感。', picks:['7','2','4'] }
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, profile, ootdPosts, notifications, sosPosts, outfitSuggestions }));
  } catch (e) { /* storage unavailable, continue without persistence */ }
}

function inferSenderId(username, currentProfile) {
  if (username === currentProfile.username) return currentProfile.id;
  const knownSenders = { '@ella':'profile-ella', '@rachel':'profile-rachel', '@mika':'profile-mika', '@jo':'profile-jo' };
  return knownSenders[username] || '';
}
function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const nextProfile = { ...JSON.parse(JSON.stringify(defaultProfile)), ...(source.profile || {}) };
  nextProfile.id = nextProfile.id || defaultProfile.id;
  nextProfile.username = nextProfile.username || defaultProfile.username;
  nextProfile.initials = nextProfile.initials || defaultProfile.initials;
  const sourceItems = Array.isArray(source.items) ? source.items : [];
  const defaultCommunityItems = defaultItems.filter(item => item.owner_id !== defaultProfile.id);
  const nextItems = (sourceItems.length ? sourceItems : JSON.parse(JSON.stringify(defaultItems)))
    .filter(item => item && item.id)
    .map(item => ({
      ...item,
      owner_id: item.owner_id || nextProfile.id,
      name: item.name || item.name_zh || '未命名單品',
      name_zh: item.name_zh || item.name || '未命名單品',
      category: item.category || 'Tops',
      style: item.style || 'Minimal',
      photo: item.photo || imageBase + 'photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85'
    }));
  defaultCommunityItems.forEach(item => {
    if (!nextItems.some(existing => existing.id === item.id)) nextItems.push(JSON.parse(JSON.stringify(item)));
  });
  const nextSosPosts = (Array.isArray(source.sosPosts) ? source.sosPosts : JSON.parse(JSON.stringify(defaultSosPosts)))
    .filter(post => post && typeof post === 'object')
    .map(post => {
    const senderId = post.sender_id || inferSenderId(post.username, nextProfile);
    const sharedIds = Array.isArray(post.closet_item_ids)
      ? post.closet_item_ids.filter(Boolean)
      : nextItems.filter(item => item.owner_id === senderId).map(item => item.id);
    const validSharedIds = sharedIds.filter(itemId => nextItems.some(item => item.id === itemId && item.owner_id === senderId));
    return {
      ...post,
      sender_id: senderId,
      closet_item_ids: validSharedIds,
      closet_count: validSharedIds.length,
      status: post.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
      adopted_suggestion_id: post.adopted_suggestion_id || null
    };
  });
  const nextSuggestions = (Array.isArray(source.outfitSuggestions) ? source.outfitSuggestions : [])
    .filter(suggestion => suggestion && typeof suggestion === 'object')
    .map(suggestion => ({
    ...suggestion,
    responder_id: suggestion.responder_id || suggestion.user_id || '',
    item_ids: Array.isArray(suggestion.item_ids) ? suggestion.item_ids : [],
    requester_liked: Boolean(suggestion.requester_liked)
  }));
  return {
    items: nextItems,
    profile: nextProfile,
    ootdPosts: Array.isArray(source.ootdPosts) ? source.ootdPosts : JSON.parse(JSON.stringify(defaultOotdPosts)),
    notifications: (Array.isArray(source.notifications) ? source.notifications : JSON.parse(JSON.stringify(defaultNotifications)))
      .filter(notification => notification && typeof notification === 'object')
      .map(notification => ({
        ...notification,
        recipient_id: notification.recipient_id || nextProfile.id,
        read: Boolean(notification.read)
      })),
    sosPosts: nextSosPosts,
    outfitSuggestions: nextSuggestions
  };
}

const normalizedState = normalizeState(loadState());
let items = normalizedState.items;
let profile = normalizedState.profile;
let ootdPosts = normalizedState.ootdPosts;
let notifications = normalizedState.notifications;
let sosPosts = normalizedState.sosPosts;
let outfitSuggestions = normalizedState.outfitSuggestions;

let activeCategory = 'All';
let editingId = null;
let sosFeedMode = 'received';

/* ===================== 小工具 ===================== */
function el(id) { return document.getElementById(id); }
function getCurrentUserItems() {
  return items.filter(item => item.owner_id === profile.id);
}
function getSosSharedItems(sos) {
  if (!sos || !sos.sender_id || !Array.isArray(sos.closet_item_ids)) return [];
  return sos.closet_item_ids
    .map(itemId => items.find(item => item.id === itemId))
    .filter(item => item && item.owner_id === sos.sender_id);
}
function hasUserRepliedToSos(sosId, responderId) {
  return outfitSuggestions.some(suggestion =>
    suggestion.sos_id === sosId &&
    (suggestion.responder_id || suggestion.user_id) === responderId
  );
}
function getSosSuggestions(sosId) {
  return outfitSuggestions.filter(suggestion => suggestion && suggestion.sos_id === sosId);
}
function findRequesterSuggestion(sosId, suggestionId) {
  const post = sosPosts.find(item => item.id === sosId);
  if (!post || post.sender_id !== profile.id) {
    showToast('只有求救者可以操作這筆搭配建議');
    return null;
  }
  const suggestion = outfitSuggestions.find(item => item.id === suggestionId);
  if (!suggestion || suggestion.sos_id !== post.id) {
    showToast('找不到這份搭配建議');
    return null;
  }
  return { post, suggestion };
}
/* ===================== Unified Action Layer ===================== */
const OOTIE_ACTIONS = {
  mode: 'local',
  remoteReadEnabled: typeof OOTIE_DATA !== 'undefined' && OOTIE_DATA.isRemoteConfigured(),
  remoteWriteEnabled: false,

  // Remote Write Stubs (Intentional stubs for DB-002 / WORK-PACK-02A)
  async createRemoteSos() { throw new Error('REMOTE_WRITE_NOT_ENABLED'); },
  async createRemoteSuggestion() { throw new Error('REMOTE_WRITE_NOT_ENABLED'); },
  async updateRemoteLike() { throw new Error('REMOTE_WRITE_NOT_ENABLED'); },
  async updateRemotePick() { throw new Error('REMOTE_WRITE_NOT_ENABLED'); },
  async closeRemoteSos() { throw new Error('REMOTE_WRITE_NOT_ENABLED'); },

  async publishSos(payload) {
    if (this.remoteWriteEnabled) {
      return this.createRemoteSos(payload);
    }
    sosPosts.unshift(payload);
    saveState();
    closeSosForm();
    renderSosFeed();
    showToast('穿搭求救已發布');
    return { ok: true, post: payload };
  },

  async submitSuggestion(payload) {
    if (this.remoteWriteEnabled) {
      return this.createRemoteSuggestion(payload);
    }
    outfitSuggestions.unshift(payload);
    profile.helped += 1;
    addNotification(`${getResponderDisplay(profile.id)} 幫你的「${payload.title || '穿搭求救'}」搭了一套`, 'sos', {
      recipient_id: payload.sender_id || profile.id,
      type: 'sos_suggestion',
      sos_id: payload.sos_id,
      suggestion_id: payload.id,
      actor_id: profile.id
    });
    saveState();
    renderProfile();
    closeSuggestionForm();
    showToast('穿搭建議已送出，謝謝你的搭配');
    return { ok: true, suggestion: payload };
  },

  async toggleLike(sosId, suggestionId) {
    if (this.remoteWriteEnabled) {
      return this.updateRemoteLike(sosId, suggestionId);
    }
    const result = findRequesterSuggestion(sosId, suggestionId);
    if (!result) return { ok: false, error: 'NOT_FOUND' };
    result.suggestion.requester_liked = !Boolean(result.suggestion.requester_liked);
    saveState();
    openSosDetail(sosId);
    return { ok: true, liked: result.suggestion.requester_liked };
  },

  async adoptSuggestion(sosId, suggestionId) {
    if (this.remoteWriteEnabled) {
      return this.updateRemotePick(sosId, suggestionId);
    }
    const result = findRequesterSuggestion(sosId, suggestionId);
    if (!result) return { ok: false, error: 'NOT_FOUND' };
    result.post.adopted_suggestion_id = result.suggestion.id;
    result.post.status = 'CLOSED';
    saveState();
    openSosDetail(sosId);
    return { ok: true, adoptedId: result.suggestion.id };
  },

  async closeSos(sosId) {
    if (this.remoteWriteEnabled) {
      return this.closeRemoteSos(sosId);
    }
    const post = sosPosts.find(item => item.id === sosId);
    if (!post || post.sender_id !== profile.id) {
      showToast('只有求救者可以結束這筆求救');
      return { ok: false, error: 'UNAUTHORIZED' };
    }
    if (post.status !== 'OPEN') {
      showToast('這筆求救已經結束');
      return { ok: false, error: 'ALREADY_CLOSED' };
    }
    post.status = 'CLOSED';
    saveState();
    closeSosConfirmation();
    renderSosFeed();
    openSosDetail(sosId);
    showToast('這次求救已結束');
    return { ok: true, status: 'CLOSED' };
  }
};
window.OOTIE_ACTIONS = OOTIE_ACTIONS;

function toggleRequesterLike(sosId, suggestionId) {
  OOTIE_ACTIONS.toggleLike(sosId, suggestionId);
}
function adoptRequesterSuggestion(sosId, suggestionId) {
  OOTIE_ACTIONS.adoptSuggestion(sosId, suggestionId);
}

async function loadSosPageData() {
  if (typeof OOTIE_DATA !== 'undefined' && OOTIE_DATA.isRemoteConfigured()) {
    try {
      const bundle = await OOTIE_DATA.fetchSosBundle();
      if (bundle && Array.isArray(bundle.sosPosts) && bundle.sosPosts.length > 0) {
        return {
          ok: true,
          source: 'remote',
          profiles: bundle.profiles || [],
          items: bundle.items || [],
          sosPosts: bundle.sosPosts || [],
          outfitSuggestions: bundle.outfitSuggestions || []
        };
      }
    } catch (err) {
      console.warn('[OOTie Data Source] Remote fetch failed, falling back to local state:', err);
    }
  }
  return {
    ok: true,
    source: 'local',
    profiles: [profile],
    items: getCurrentUserItems(),
    sosPosts: sosPosts,
    outfitSuggestions: outfitSuggestions
  };
}

async function syncFromSupabase() {
  if (typeof OOTIE_DATA === 'undefined' || !OOTIE_DATA.isRemoteConfigured()) return;
  const feed = el('sosFeed');
  if (feed && document.body.dataset.page === 'sos') {
    feed.innerHTML = '<div class="sos-loading" style="text-align:center; padding:40px; color:var(--muted);">載入最新求救資料中...</div>';
  }
  try {
    const pageData = await loadSosPageData();
    if (pageData && pageData.source === 'remote') {
      if (pageData.items && pageData.items.length) {
        const itemMap = new Set(items.map(i => i.id));
        pageData.items.forEach(remoteItem => {
          if (!itemMap.has(remoteItem.id)) items.push(remoteItem);
        });
      }
      if (pageData.sosPosts && pageData.sosPosts.length) {
        const postMap = new Set(sosPosts.map(p => p.id));
        pageData.sosPosts.forEach(remotePost => {
          if (!postMap.has(remotePost.id)) sosPosts.push(remotePost);
        });
      }
      if (pageData.outfitSuggestions && pageData.outfitSuggestions.length) {
        const sugMap = new Set(outfitSuggestions.map(s => s.id));
        pageData.outfitSuggestions.forEach(remoteSug => {
          if (!sugMap.has(remoteSug.id)) outfitSuggestions.push(remoteSug);
        });
      }
    }
  } catch (err) {
    console.warn('[OOTie Sync Warning]', err);
  } finally {
    const page = document.body.dataset.page;
    if (page === 'sos') {
      renderSosFeed();
    } else if (page === 'closet') {
      renderCategories();
      renderItems();
    } else if (page === 'profile') {
      renderProfile();
    } else if (page === 'explore') {
      renderExplore();
    } else if (page === 'home') {
      renderHome();
    }
  }
}
function setSosFeedMode(mode) {
  sosFeedMode = mode;
  const receivedTab = el('sosReceivedTab');
  const sentTab = el('sosSentTab');
  if (receivedTab) {
    receivedTab.classList.toggle('active', mode === 'received');
    receivedTab.setAttribute('aria-selected', mode === 'received');
  }
  if (sentTab) {
    sentTab.classList.toggle('active', mode === 'sent');
    sentTab.setAttribute('aria-selected', mode === 'sent');
  }
  renderSosFeed();
}
function getResponderDisplay(responderId) {
  if (responderId === profile.id) return profile.username || profile.initials || '衣友';
  const responderPost = sosPosts.find(post => post.sender_id === responderId);
  return responderPost?.username || '衣友';
}
function getVisibleNotifications() {
  return notifications.filter(notification => notification.recipient_id === profile.id);
}
function showToast(message) {
  const toast = el('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function detectCategory(fileName) { const name = fileName.toLowerCase(); if (name.includes('shoe') || name.includes('loafer')) return 'Shoes'; if (name.includes('dress')) return 'Dress'; if (name.includes('coat') || name.includes('jacket')) return 'Outerwear'; if (name.includes('bag')) return 'Bags'; if (name.includes('pant') || name.includes('denim') || name.includes('skirt')) return 'Bottoms'; return 'Tops'; }
function detectColor(fileName) { const name = fileName.toLowerCase(); if (name.includes('black')) return 'Black'; if (name.includes('blue') || name.includes('denim')) return 'Blue'; if (name.includes('brown')) return 'Brown'; if (name.includes('beige') || name.includes('cream')) return 'Beige'; return 'White'; }
function setActiveNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll('[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === current));
}

/* ===================== 共用版型（側邊欄／頂欄／手機導覽／通知視窗） ===================== */
const SIDEBAR_HTML = `
<aside class="sidebar">
  <div class="brand">OOTie</div>
  <nav class="nav" aria-label="主選單">
    <a data-page="home" href="home.html"><span class="nav-icon">⌂</span>首頁</a>
    <a data-page="closet" href="closet.html"><span class="nav-icon">▦</span>我的衣櫥</a>
    <a data-page="explore" href="explore.html"><span class="nav-icon">✦</span>探索</a>
    <a data-page="sos" href="sos.html"><span class="nav-icon">♡</span>穿搭求救</a>
    <a data-page="profile" href="profile.html"><span class="nav-icon">◯</span>個人檔案</a>
  </nav>
  <div class="sidebar-footer">你的衣櫥，是每天選擇穿搭的<br>專屬空間。</div>
</aside>`;

const TOPBAR_HTML = `
<header class="topbar">
  <div class="mobile-brand">OOTie</div>
  <div class="top-actions">
    <button class="secondary" id="authStatusBtn" style="font-size:11px; padding:6px 11px;">🔑 登入 (Auth)</button>
    <button class="icon-button" id="notificationButton" aria-label="通知">♧<span class="notification-badge" id="notificationBadge">0</span></button>
    <div class="avatar">HL</div>
  </div>
</header>`;

const BOTTOM_NAV_HTML = `
<nav class="bottom-nav" aria-label="手機版導覽">
  <a data-page="home" href="home.html"><span>⌂</span>首頁</a>
  <a data-page="closet" href="closet.html"><span>▦</span>衣櫥</a>
  <a class="add" href="closet.html" aria-label="新增單品">+</a>
  <a data-page="sos" href="sos.html"><span>♡</span>求救</a>
  <a data-page="profile" href="profile.html"><span>◯</span>我的</a>
</nav>`;

const NOTIFICATION_MODAL_HTML = `
<div class="modal-backdrop" id="notificationBackdrop">
  <section class="modal notification-modal">
    <button class="modal-close" id="closeNotifications" aria-label="關閉">×</button>
    <p class="eyebrow">Community</p>
    <h2>通知</h2>
    <div class="notification-list" id="notificationList"></div>
  </section>
</div>`;

function injectShell() {
  el('sidebar-slot')?.insertAdjacentHTML('afterbegin', SIDEBAR_HTML);
  el('topbar-slot')?.insertAdjacentHTML('afterbegin', TOPBAR_HTML);
  el('bottom-nav-slot')?.insertAdjacentHTML('afterbegin', BOTTOM_NAV_HTML);
  el('notification-modal-slot')?.insertAdjacentHTML('afterbegin', NOTIFICATION_MODAL_HTML);
}

/* ===================== 首頁 ===================== */
function renderHome() {
  const occasionRow = el('occasionRow');
  if (!occasionRow) return;
  occasionRow.innerHTML = occasions.map((occasion, index) => `<button class="occasion ${index === 3 ? 'selected' : ''}" data-occasion="${occasion.label}">${occasion.label}</button>`).join('');
  occasionRow.querySelectorAll('[data-occasion]').forEach(button => button.addEventListener('click', () => updateRecommendation(button.dataset.occasion)));
  const recentRow = el('recentRow');
  if (recentRow) {
    recentRow.innerHTML = getCurrentUserItems().slice(0, 4).map(item => `<a class="recent-card" href="closet.html" data-item="${item.id}"><div class="item-image"><img src="${item.photo}" alt="${item.name_zh || item.name}" loading="lazy"></div><h3>${item.name_zh || item.name}</h3></a>`).join('');
    recentRow.querySelectorAll('[data-item]').forEach(card => card.addEventListener('click', event => { event.preventDefault(); openDetail(card.dataset.item); }));
  }
  updateRecommendation('隨性');
}
function updateRecommendation(label) {
  if (!el('recommendationTitle')) return;
  const occasion = occasions.find(entry => entry.label === label) || occasions[3];
  document.querySelectorAll('.occasion').forEach(button => button.classList.toggle('selected', button.dataset.occasion === occasion.label));
  el('recommendationTitle').textContent = occasion.title;
  el('recommendationCopy').textContent = occasion.copy;
  el('outfitMini').innerHTML = occasion.picks.map(id => { const item = getCurrentUserItems().find(entry => entry.id === id); return item ? `<img src="${item.photo}" alt="${item.name_zh || item.name}">` : ''; }).join('');
}

/* ===================== 個人檔案 ===================== */
function renderProfile() {
  if (!el('profileName')) return;
  el('profileName').textContent = profile.name;
  el('profileHandle').textContent = profile.username;
  el('profileBio').textContent = profile.bio;
  el('profileAvatar').textContent = profile.initials;
  el('profileHearts').textContent = profile.hearts;
  el('profileHelped').textContent = profile.helped;
  el('profileLikes').textContent = profile.likes;
  el('publicClosetToggle').classList.toggle('on', profile.public_closet);
  el('publicClosetToggle').setAttribute('aria-pressed', profile.public_closet);
  renderProfileOotd();
}
function openProfileEdit() { el('editProfileName').value = profile.name; el('editProfileUsername').value = profile.username; el('editProfileInitials').value = profile.initials; el('editProfileBio').value = profile.bio; el('profileEditBackdrop').classList.add('open'); }
function closeProfileEdit() { el('profileEditBackdrop').classList.remove('open'); }
function renderProfileOotd() {
  const gridElement = el('profileOotdGrid');
  if (!gridElement) return;
  const posts = ootdPosts.filter(post => post.username === profile.username);
  if (!posts.length) { gridElement.innerHTML = '<div class="profile-ootd-empty">你發布的 OOTD 會顯示在這裡。</div>'; return; }
  gridElement.innerHTML = posts.map(post => `<article class="ootd-card"><img class="ootd-photo" src="${post.image}" alt="我的 OOTD"><div class="ootd-body"><p class="ootd-caption">${post.caption}</p><div class="ootd-tags">${post.hashtags.join('　')}</div><div class="ootd-actions"><span class="ootd-action">♥ ${post.likes}</span><span class="ootd-action">♡ ${post.comments}</span></div></div></article>`).join('');
}

/* ===================== 通知（每一頁共用） ===================== */
function renderNotifications() {
  const badge = el('notificationBadge');
  if (!badge) return;
  const visibleNotifications = getVisibleNotifications();
  const unread = visibleNotifications.filter(notification => !notification.read).length;
  badge.textContent = unread;
  badge.style.display = unread ? 'block' : 'none';
  el('notificationList').innerHTML = visibleNotifications.length
    ? visibleNotifications.map(notification => `<button type="button" class="notification-item ${notification.read ? '' : 'unread'}" data-notification-id="${notification.id}" data-notification-target="${notification.target || 'profile'}">${notification.text}<span class="notification-time">${notification.time || ''}</span></button>`).join('')
    : '<p class="notification-time">目前沒有通知。</p>';
  document.querySelectorAll('[data-notification-id]').forEach(notification => notification.addEventListener('click', () => {
    const selected = notifications.find(item => item.id === notification.dataset.notificationId);
    if (!selected) return;
    selected.read = true;
    saveState();
    renderNotifications();
    el('notificationBackdrop').classList.remove('open');
    if (selected.type === 'sos_suggestion' && selected.sos_id) {
      if (document.body.dataset.page === 'sos') {
        openRequesterSosDetail(selected.sos_id);
      } else {
        window.location.href = `sos.html?tab=sent&sos=${encodeURIComponent(selected.sos_id)}`;
      }
      return;
    }
    window.location.href = `${selected.target || 'profile'}.html`;
  }));
}
function addNotification(text, target = 'profile', metadata = {}) {
  notifications.unshift({ id:`notification-${Date.now()}`, text, time:'剛剛', read:false, target, recipient_id:profile.id, ...metadata });
  saveState();
  renderNotifications();
}

/* ===================== 探索 / OOTD ===================== */
function renderComments(post) {
  const list = el('commentList');
  if (!list) return;
  list.innerHTML = post.commentList.length ? post.commentList.map(comment => `<div class="comment-item"><strong>${comment.user}</strong>${comment.text}</div>`).join('') : '<p class="notification-time">還沒有留言，成為第一個留言的人吧。</p>';
  el('commentBackdrop').dataset.postId = post.id;
  el('commentInput').value = '';
}
function openComments(postId) { const post = ootdPosts.find(item => item.id === postId); renderComments(post); el('commentBackdrop').classList.add('open'); }
function closeComments() { el('commentBackdrop').classList.remove('open'); }
function renderExplore() {
  const gridElement = el('ootdGrid');
  if (!gridElement) return;
  const query = el('exploreSearch').value.toLowerCase().trim();
  const feed = document.querySelector('.feed-tab.active').dataset.feed;
  const posts = ootdPosts.filter(post => (feed === 'for-you' || post.following) && (!query || `${post.username} ${post.caption} ${post.hashtags.join(' ')} ${post.wearing.join(' ')}`.toLowerCase().includes(query)));
  if (!posts.length) { gridElement.innerHTML = '<div class="explore-empty">找不到符合的穿搭，換個關鍵字試試看吧。</div>'; return; }
  gridElement.innerHTML = posts.map((post, index) => `<article class="ootd-card" style="animation-delay:${index * 45}ms"><img class="ootd-photo" src="${post.image}" alt="${post.username} 的穿搭"><div class="ootd-body"><div class="ootd-user"><div class="ootd-avatar">${post.initials}</div><div><strong>${post.username}</strong><span>今日分享</span></div></div><p class="ootd-caption">${post.caption}</p><div class="ootd-tags">${post.hashtags.join('　')}</div><div class="ootd-actions"><button class="ootd-action ${post.liked ? 'liked' : ''}" data-like-post="${post.id}">${post.liked ? '♥' : '♡'} ${post.likes}</button><button class="ootd-action" data-comment-post="${post.id}">🗨 ${post.comments}</button><button class="ootd-action ${post.saved ? 'saved' : ''}" data-save-post="${post.id}">${post.saved ? '▣ 已收藏' : '▢ 收藏'}</button></div></div></article>`).join('');
  gridElement.querySelectorAll('[data-like-post]').forEach(button => button.addEventListener('click', () => { const post = ootdPosts.find(item => item.id === button.dataset.likePost); post.liked = !post.liked; post.likes += post.liked ? 1 : -1; if (post.liked && post.username === profile.username) { profile.hearts += 1; renderProfile(); addNotification('你的穿搭收到了一個 Heart。', 'explore'); } saveState(); renderExplore(); }));
  gridElement.querySelectorAll('[data-comment-post]').forEach(button => button.addEventListener('click', () => openComments(button.dataset.commentPost)));
  gridElement.querySelectorAll('[data-save-post]').forEach(button => button.addEventListener('click', () => { const post = ootdPosts.find(item => item.id === button.dataset.savePost); post.saved = !post.saved; saveState(); renderExplore(); showToast(post.saved ? '已收藏這篇穿搭' : '已取消收藏'); }));
}
function renderOotdTagItems() {
  const container = el('ootdTagItems');
  if (!container) return;
  container.innerHTML = getCurrentUserItems().map(item => `<label class="tag-item"><input type="checkbox" value="${item.id}"> ${item.name_zh || item.name}</label>`).join('');
}
function openOotdForm() { el('ootdForm').reset(); el('ootdPhoto').value = ''; el('ootdPreview').src = ''; el('ootdPreview').classList.remove('visible'); renderOotdTagItems(); el('ootdBackdrop').classList.add('open'); }
function closeOotdForm() { el('ootdBackdrop').classList.remove('open'); }

/* ===================== 穿搭求救（SOS） ===================== */
function renderSosFeed() {
  const feed = el('sosFeed');
  if (!feed) return;
  const query = el('sosSearch').value.toLowerCase().trim();
  const posts = sosPosts.filter(post => {
    const isOwned = post.sender_id === profile.id;
    const matchesMode = sosFeedMode === 'sent' ? isOwned : !isOwned;
    const isVisible = sosFeedMode === 'sent' || post.status === 'OPEN';
    return matchesMode && isVisible && `${post.username || ''} ${post.title || ''} ${post.occasion || ''} ${(post.vibes || []).join(' ')}`.toLowerCase().includes(query);
  });
  if (!posts.length) { feed.innerHTML = '<div class="sos-empty">找不到符合的求救貼文，換個關鍵字試試看吧。</div>'; return; }
  feed.innerHTML = posts.map((post, index) => {
    const footerInfo = sosFeedMode === 'sent'
      ? `<span class="sos-available">${getSosSharedItems(post).length} 件分享衣物 · 收到 ${getSosSuggestions(post.id).length} 個搭配建議 <em class="sos-status-badge ${post.status === 'CLOSED' ? 'is-closed' : ''}">${post.status === 'CLOSED' ? '已結束' : '進行中'}</em></span>`
      : `<span class="sos-available">${getSosSharedItems(post).length} 件公開衣物</span>`;
    return `<article class="sos-feed-card" style="animation-delay:${index * 45}ms"><div class="sos-feed-user"><div class="sos-feed-avatar">${post.initials || '?'}</div><div><strong>${post.username || '衣友'}</strong><span>${sosFeedMode === 'sent' ? '我發出的求救' : '穿搭求救'}</span></div></div><h2>${post.title || '穿搭求救'}</h2><div class="sos-meta"><span>場合｜${post.occasion || '未設定'}</span><span>天氣｜${post.weather || '未設定'}</span><span>時間｜${post.when_label || '未設定'}</span></div><div class="sos-vibes">想呈現：${(post.vibes || []).join('　')}</div><div class="sos-card-footer">${footerInfo}<button class="secondary sos-detail-cta" data-sos-detail="${post.id}">查看詳情</button></div></article>`;
  }).join('');
  feed.querySelectorAll('[data-sos-detail]').forEach(button => button.addEventListener('click', () => openSosDetail(button.dataset.sosDetail)));
}
function renderSosShareItems() {
  const container = el('sosShareItems');
  if (!container) return;
  container.innerHTML = getCurrentUserItems().map(item => `<label class="suggestion-item"><input type="checkbox" value="${item.id}"><img src="${item.photo}" alt="${item.name_zh || item.name}"><span>${item.name_zh || item.name}</span></label>`).join('');
  container.querySelectorAll('input').forEach(input => input.addEventListener('change', updateSosShareSelectionCount));
  updateSosShareSelectionCount();
}
function updateSosShareSelectionCount() {
  const count = document.querySelectorAll('#sosShareItems input:checked').length;
  const selected = el('sosShareSelected');
  if (selected) selected.textContent = `已選 ${count} 件`;
}
function renderSuggestionItems(sos) {
  const container = el('suggestionItems');
  if (!container) return;
  document.querySelectorAll('#openSuggestionGallery').forEach(button => button.remove());
  const sharedItems = getSosSharedItems(sos);
  const previewItems = sharedItems.slice(0, SOS_CLOSET_PREVIEW_LIMIT);
  container.innerHTML = previewItems.map(item => `<label class="suggestion-item"><input type="checkbox" value="${item.id}"><img src="${item.photo}" alt="${item.name_zh || item.name}"><span>${item.name_zh || item.name}</span></label>`).join('') + sharedItems.slice(SOS_CLOSET_PREVIEW_LIMIT).map(item => `<input class="sos-gallery-sync-input" type="checkbox" value="${item.id}">`).join('');
  document.querySelectorAll('#suggestionItems input').forEach(input => input.addEventListener('change', updateCurrentOutfit));
  if (sharedItems.length > SOS_CLOSET_PREVIEW_LIMIT) {
    container.insertAdjacentHTML('afterend', `<button type="button" class="secondary sos-gallery-trigger" id="openSuggestionGallery">從公開衣物選擇（共 ${sharedItems.length} 件）</button>`);
    el('openSuggestionGallery').addEventListener('click', () => openSosClosetGallery(sos.id, 'select'));
  }
}
function renderSosClosetGalleryItems(items, mode, sosId) {
  return items.map(item => {
    const checked = mode === 'select' && document.querySelector(`#suggestionItems input[value="${item.id}"]`)?.checked;
    return mode === 'select'
      ? `<label class="sos-gallery-item sos-gallery-select-item"><input type="checkbox" value="${item.id}"${checked ? ' checked' : ''}><img src="${item.photo}" alt="${item.name_zh || item.name}"><span>${item.name_zh || item.name}</span></label>`
      : `<div class="sos-gallery-item"><img src="${item.photo}" alt="${item.name_zh || item.name}"><span>${item.name_zh || item.name}</span></div>`;
  }).join('');
}
function openSosClosetGallery(sosId, mode = 'view') {
  const post = sosPosts.find(item => item.id === sosId);
  const backdrop = el('sosClosetGalleryBackdrop');
  const content = el('sosClosetGalleryContent');
  const sharedItems = getSosSharedItems(post);
  if (!post || !sharedItems.length || !backdrop || !content) return;
  content.innerHTML = `<p class="eyebrow">Style SOS</p><h2>本次公開的衣物</h2><p class="sos-gallery-count">共 ${sharedItems.length} 件</p><div class="sos-gallery-grid">${renderSosClosetGalleryItems(sharedItems, mode, sosId)}</div>${mode === 'select' ? '<div class="form-actions"><button type="button" class="primary" id="sosGalleryDone">完成選擇</button></div>' : ''}`;
  backdrop.dataset.sosId = sosId;
  backdrop.dataset.mode = mode;
  backdrop.classList.add('open');
  if (mode === 'select') {
    content.querySelectorAll('.sos-gallery-select-item input').forEach(input => input.addEventListener('change', () => {
      const mainInput = document.querySelector(`#suggestionItems input[value="${input.value}"]`);
      if (mainInput) mainInput.checked = input.checked;
      updateCurrentOutfit();
    }));
    el('sosGalleryDone').addEventListener('click', closeSosClosetGallery);
  }
}
function closeSosClosetGallery() { el('sosClosetGalleryBackdrop')?.classList.remove('open'); }
function updateCurrentOutfit() {
  if (!el('suggestionSelected')) return;
  const sos = sosPosts.find(item => item.id === el('suggestionBackdrop').dataset.sosId);
  const sharedItems = getSosSharedItems(sos);
  const selected = [...document.querySelectorAll('#suggestionItems input:checked')].map(input => sharedItems.find(item => item.id === input.value)).filter(Boolean);
  el('suggestionSelected').textContent = `已選 ${selected.length} 件`;
  const currentOutfit = el('currentOutfit');
  currentOutfit.classList.toggle('visible', selected.length > 0);
  if (!selected.length) return;
  el('currentOutfitImages').innerHTML = selected.map((item, index) => `${index ? '<span class="outfit-plus">＋</span>' : ''}<img src="${item.photo}" alt="${item.name_zh || item.name}">`).join('');
  el('currentOutfitNames').textContent = selected.map(item => item.name_zh || item.name).join(' ＋ ');
}
function openSuggestionForm(sosId) {
  const post = sosPosts.find(item => item.id === sosId);
  if (!post || !post.sender_id) { showToast('找不到這筆求救的分享者'); return; }
  if (post.status !== 'OPEN') { showToast('這筆求救已經結束'); return; }
  if (post.sender_id === profile.id) { showToast('不能替自己的求救搭配'); return; }
  if (hasUserRepliedToSos(sosId, profile.id)) { showToast('你已經回覆過這筆求救'); return; }
  const sharedItems = getSosSharedItems(post);
  if (!sharedItems.length) { showToast('這筆求救目前沒有公開可搭配的衣物'); return; }
  el('suggestionForm').reset();
  el('suggestionIntro').textContent = `正在為 ${post.username || '衣友'} 的「${post.title || '穿搭求救'}」挑選搭配。`;
  el('suggestionBackdrop').dataset.sosId = sosId;
  renderSuggestionItems(post);
  el('suggestionSelected').textContent = '已選 0 件';
  el('currentOutfit').classList.remove('visible');
  el('currentOutfitImages').innerHTML = '';
  el('currentOutfitNames').textContent = '';
  el('suggestionBackdrop').classList.add('open');
}
function closeSuggestionForm() { el('suggestionBackdrop').classList.remove('open'); }
function openSosDetail(sosId) {
  const post = sosPosts.find(item => item.id === sosId);
  const content = el('sosDetailContent');
  if (!post || !content) { showToast('找不到這筆求救'); return; }
  const sharedItems = getSosSharedItems(post);
  const isRequester = post.sender_id === profile.id;
  const replied = hasUserRepliedToSos(sosId, profile.id);
  const suggestions = getSosSuggestions(sosId);
  const adoptedSuggestion = suggestions.find(suggestion => suggestion.id === post.adopted_suggestion_id);
  const previewItems = sharedItems.slice(0, SOS_CLOSET_PREVIEW_LIMIT);
  const galleryTrigger = sharedItems.length > SOS_CLOSET_PREVIEW_LIMIT
    ? `<button type="button" class="secondary sos-gallery-trigger" data-sos-gallery="${sosId}">＋ 查看全部 ${sharedItems.length} 件</button>`
    : '';
  const detailAction = replied
    ? '<button type="button" class="primary" disabled>已回覆</button>'
    : sharedItems.length
      ? '<button type="button" class="primary" id="detailStartSuggestion">開始幫她搭配</button>'
      : '<button type="button" class="primary" disabled>暫無可搭配衣物</button>';
  const requesterStatus = isRequester
    ? `<div class="sos-detail-status ${post.status === 'CLOSED' ? 'is-replied' : ''}"><strong>求救狀態：${post.status === 'CLOSED' ? '已結束' : '進行中'}</strong><span>${post.status === 'CLOSED' ? '這筆求救已結束，不再接受新的搭配建議。' : '你可以繼續查看回覆，或結束這次求救。'}</span></div>`
    : '';
  const requesterAction = isRequester && post.status === 'OPEN'
    ? '<button type="button" class="primary" id="detailCloseSos">結束這次求救</button>'
    : '';
  const suggestionMarkup = isRequester
    ? `<div class="sos-detail-section"><div class="sos-detail-section-title"><h3>收到的搭配建議</h3><span>目前收到 ${suggestions.length} 份</span></div>${adoptedSuggestion ? '<p class="sos-adopted-summary">已採用 1 份搭配建議</p>' : ''}${suggestions.length ? `<div class="sos-received-suggestions">${suggestions.map(suggestion => {
      const suggestionItems = (suggestion.item_ids || []).map(itemId => sharedItems.find(item => item.id === itemId)).filter(Boolean);
      const responderId = suggestion.responder_id || suggestion.user_id || '未知衣友';
      const isAdopted = adoptedSuggestion?.id === suggestion.id;
      return `<article class="sos-suggestion-card${isAdopted ? ' is-adopted' : ''}"><div class="sos-suggestion-header"><strong>${getResponderDisplay(responderId)}</strong><span>${suggestion.created_at ? new Date(suggestion.created_at).toLocaleDateString('zh-TW') : ''}</span></div>${isAdopted ? '<span class="sos-adopted-label">✓ 已採用</span>' : ''}<div class="sos-suggestion-items">${suggestionItems.length ? suggestionItems.map(item => `<div class="sos-suggestion-item"><img src="${item.photo}" alt="${item.name_zh || item.name}"><span>${item.name_zh || item.name}</span></div>`).join('') : '<p class="sos-detail-empty">找不到這份建議的衣物。</p>'}</div><p class="sos-suggestion-message">${suggestion.message || '這位衣友沒有留下文字建議。'}</p><div class="sos-suggestion-actions"><button type="button" class="secondary" data-sos-like="${suggestion.id}">${suggestion.requester_liked ? '♥ 已喜歡' : '♡ 喜歡'}</button><button type="button" class="primary" data-sos-adopt="${suggestion.id}"${isAdopted ? ' disabled' : ''}>${isAdopted ? '✓ 已採用' : '採用這套'}</button></div></article>`;
    }).join('')}</div>` : '<p class="sos-detail-empty">目前還沒有收到搭配建議。</p>'}</div>`
    : `<div class="sos-detail-status ${replied ? 'is-replied' : ''}"><strong>${replied ? '你已經回覆過這筆求救' : '你還沒有回覆這筆求救'}</strong><span>${replied ? '每位衣友對同一筆求救只能送出一份建議。' : sharedItems.length ? '如果你有靈感，可以開始幫她搭配。' : '這筆求救目前沒有公開可搭配的衣物。'}</span></div>`;
  content.innerHTML = `<div class="sos-detail-heading"><p class="eyebrow">Style SOS</p><div class="sos-detail-user"><div class="sos-feed-avatar">${post.initials || '?'}</div><div><strong>${post.username || '衣友'}</strong><span>${isRequester ? '我發出的求救' : '正在尋找穿搭建議'}</span></div></div><h2>${post.title || '穿搭求救'}</h2></div><div class="sos-detail-body">${requesterStatus}<div class="sos-detail-section"><h3>${isRequester ? '求救內容' : '她遇到的問題'}</h3><p>${post.details || '這位衣友沒有補充更多需求。'}</p></div><div class="sos-detail-meta"><div><dt>場合</dt><dd>${post.occasion || '未設定'}</dd></div><div><dt>天氣</dt><dd>${post.weather || '未設定'}</dd></div><div><dt>穿著時機</dt><dd>${post.when_label || '未設定'}</dd></div><div><dt>想呈現的風格</dt><dd>${(post.vibes || []).join('、') || '未設定'}</dd></div></div><div class="sos-detail-section"><div class="sos-detail-section-title"><h3>本次公開的衣物</h3><span>${sharedItems.length} 件</span></div><div class="sos-detail-items">${sharedItems.length ? previewItems.map(item => `<div class="sos-detail-item"><img src="${item.photo}" alt="${item.name_zh || item.name}"><span>${item.name_zh || item.name}</span></div>`).join('') : '<p class="sos-detail-empty">這筆求救目前沒有公開可搭配的衣物。</p>'}</div>${galleryTrigger}</div>${suggestionMarkup}<div class="form-actions"><button type="button" class="secondary" id="detailCloseAction">關閉</button>${isRequester ? requesterAction : (post.status === 'OPEN' ? detailAction : '<button type="button" class="primary" disabled>求救已結束</button>')}</div></div>`;
  el('sosDetailBackdrop').dataset.sosId = sosId;
  el('sosDetailBackdrop').classList.add('open');
  el('detailCloseAction').addEventListener('click', closeSosDetail);
  el('detailStartSuggestion')?.addEventListener('click', () => { closeSosDetail(); openSuggestionForm(sosId); });
  el('detailCloseSos')?.addEventListener('click', () => openCloseSosConfirmation(sosId));
  content.querySelector('[data-sos-gallery]')?.addEventListener('click', () => openSosClosetGallery(sosId, 'view'));
  content.querySelectorAll('[data-sos-like]').forEach(button => button.addEventListener('click', () => toggleRequesterLike(sosId, button.dataset.sosLike)));
  content.querySelectorAll('[data-sos-adopt]').forEach(button => button.addEventListener('click', () => adoptRequesterSuggestion(sosId, button.dataset.sosAdopt)));
}
function closeSosDetail() { el('sosDetailBackdrop')?.classList.remove('open'); }
function openCloseSosConfirmation(sosId) {
  const post = sosPosts.find(item => item.id === sosId);
  if (!post || post.sender_id !== profile.id) {
    showToast('只有求救者可以結束這筆求救');
    return;
  }
  if (post.status !== 'OPEN') {
    showToast('這筆求救已經結束');
    return;
  }
  el('closeSosConfirmBackdrop').dataset.sosId = sosId;
  el('closeSosConfirmBackdrop').classList.add('open');
}
function closeSosConfirmation() { el('closeSosConfirmBackdrop')?.classList.remove('open'); }
function closeSos(sosId) {
  OOTIE_ACTIONS.closeSos(sosId);
}
function openRequesterSosDetail(sosId) {
  const post = sosPosts.find(item => item.id === sosId);
  if (!post) { setSosFeedMode('sent'); showToast('找不到這筆求救'); return; }
  if (post.sender_id !== profile.id) { showToast('這筆求救不屬於目前帳號'); return; }
  setSosFeedMode('sent');
  openSosDetail(sosId);
}
function handleSosDeepLink() {
  if (document.body.dataset.page !== 'sos') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'sent') setSosFeedMode('sent');
  const sosId = params.get('sos');
  if (sosId) openRequesterSosDetail(sosId);
}
function openSosForm() { el('sosForm').reset(); renderSosShareItems(); el('sosFormBackdrop').classList.add('open'); }
function closeSosForm() { el('sosFormBackdrop').classList.remove('open'); }

/* ===================== 衣櫥 ===================== */
function renderCategories() {
  const categoryRow = el('categoryRow');
  if (!categoryRow) return;
  categoryRow.innerHTML = categories.map(category => `<button class="category ${activeCategory === category ? 'active' : ''}" data-category="${category}">${labels[category]}</button>`).join('');
  categoryRow.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { activeCategory = button.dataset.category; renderCategories(); renderItems(); }));
}
function getFilteredItems() {
  const query = el('searchInput').value.toLowerCase().trim();
  const color = el('colorFilter').value;
  const season = el('seasonFilter').value;
  const style = el('styleFilter').value;
  return getCurrentUserItems().filter(item => {
    const searchable = `${item.name} ${item.name_zh} ${item.brand} ${item.category}`.toLowerCase();
    return (!query || searchable.includes(query)) && (activeCategory === 'All' || item.category === activeCategory) && (!color || item.primary_color === color) && (!season || item.season === season) && (!style || item.style === style);
  });
}
function renderItems() {
  const grid = el('itemGrid');
  if (!grid) return;
  const filtered = getFilteredItems();
  el('itemCount').textContent = `${filtered.length} 件單品`;
  if (!filtered.length) { grid.innerHTML = `<div class="empty">沒有符合篩選條件的單品。<br><button id="emptyAdd">新增單品</button></div>`; el('emptyAdd').addEventListener('click', openAddForm); return; }
  grid.innerHTML = filtered.map((item, index) => `<article class="item-card" style="animation-delay:${index * 45}ms"><div class="item-image" data-id="${item.id}"><button class="favorite ${item.favorite ? 'is-favorite' : ''}" data-favorite="${item.id}" aria-label="收藏">${item.favorite ? '♥' : '♡'}</button><img src="${item.photo}" alt="${item.name_zh || item.name}" loading="lazy"></div><div class="item-info"><h3>${item.name_zh || item.name}</h3><p>${labels[item.category]} · ${labels[item.style]}</p></div></article>`).join('');
  grid.querySelectorAll('.item-image').forEach(image => image.addEventListener('click', event => { if (!event.target.dataset.favorite) openDetail(image.dataset.id); }));
  grid.querySelectorAll('[data-favorite]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); toggleFavorite(button.dataset.favorite); }));
}
function toggleFavorite(id) { const item = items.find(entry => entry.id === id); item.favorite = !item.favorite; saveState(); renderItems(); showToast(item.favorite ? '已加入收藏' : '已取消收藏'); }
function openDetail(id) {
  const detailBackdrop = el('detailBackdrop');
  if (!detailBackdrop) return;
  const item = items.find(entry => entry.id === id);
  detailBackdrop.querySelector('#detailModal').innerHTML = `<button class="modal-close" data-close-detail aria-label="關閉">×</button><div class="detail-photo"><img src="${item.photo}" alt="${item.name}"></div><div class="detail-content"><p class="eyebrow">${labels[item.category]}</p><h2>${item.name_zh || item.name}</h2><p class="detail-category">${item.brand ? `品牌：${item.brand}` : '品牌未設定'}</p><dl class="detail-fields"><div><dt>分類</dt><dd>${labels[item.category]}</dd></div><div><dt>主要顏色</dt><dd>${labels[item.primary_color] || item.primary_color}</dd></div><div><dt>次要顏色</dt><dd>${labels[item.secondary_color] || item.secondary_color || '無'}</dd></div><div><dt>風格</dt><dd>${labels[item.style] || item.style}</dd></div><div><dt>適合季節</dt><dd>${labels[item.season] || item.season}</dd></div><div><dt>版型</dt><dd>${item.shape || '未設定'}</dd></div><div><dt>品牌</dt><dd>${item.brand || '未設定'}</dd></div><div><dt>購買日期</dt><dd>${item.purchase_date || '未設定'}</dd></div><div><dt>穿著次數</dt><dd>${item.wear_count} 次</dd></div><div><dt>上次穿著</dt><dd>${item.last_worn || '尚未穿著'}</dd></div></dl><p class="detail-notes">${item.notes || '這件單品還沒有備註。'}</p><div class="modal-actions"><button class="primary" data-add-outfit>加入穿搭</button><button class="secondary" data-favorite-detail>${item.favorite ? '♥ 已收藏' : '♡ 加入收藏'}</button><button class="secondary" data-edit="${item.id}">編輯</button><button class="danger" data-delete="${item.id}">刪除</button></div></div>`;
  detailBackdrop.classList.add('open');
  detailBackdrop.querySelector('[data-close-detail]').addEventListener('click', closeDetail);
  detailBackdrop.querySelector('[data-edit]').addEventListener('click', () => { closeDetail(); openEditForm(item.id); });
  detailBackdrop.querySelector('[data-delete]').addEventListener('click', () => deleteItem(item.id));
  detailBackdrop.querySelector('[data-add-outfit]').addEventListener('click', () => showToast('已加入你的穿搭'));
  detailBackdrop.querySelector('[data-favorite-detail]').addEventListener('click', () => { toggleFavorite(item.id); closeDetail(); openDetail(item.id); });
}
function closeDetail() { el('detailBackdrop').classList.remove('open'); }
function resetUploadState() { el('photo').value = ''; el('photoFile').value = ''; el('uploadPreview').src = ''; el('uploadPreview').classList.remove('visible'); }
function openAddForm() { editingId = null; el('formEyebrow').textContent = '新增單品'; el('formTitle').textContent = '加入衣櫥'; el('itemForm').reset(); resetUploadState(); el('formBackdrop').classList.add('open'); }
function openEditForm(id) { const item = items.find(entry => entry.id === id); editingId = id; el('formEyebrow').textContent = '編輯你的單品'; el('formTitle').textContent = '編輯單品'; Object.keys(item).forEach(key => { const field = el(key); if (field) field.value = item[key] || ''; }); el('formBackdrop').classList.add('open'); }
function closeForm() { el('formBackdrop').classList.remove('open'); }
function deleteItem(id) { const item = items.find(entry => entry.id === id); if (!confirm(`確定要將「${item.name_zh || item.name}」從衣櫥刪除嗎？`)) return; items = items.filter(entry => entry.id !== id); saveState(); closeDetail(); renderItems(); showToast('單品已從衣櫥移除'); }

/* ===================== 共用事件綁定（每頁都呼叫，缺少的元素會自動略過） ===================== */
function bindCommonEvents() {
  el('searchInput')?.addEventListener('input', renderItems);
  ['colorFilter','seasonFilter','styleFilter'].forEach(id => el(id)?.addEventListener('change', renderItems));
  el('clearFilters')?.addEventListener('click', () => { activeCategory = 'All'; el('searchInput').value = ''; ['colorFilter','seasonFilter','styleFilter'].forEach(id => el(id).value = ''); renderCategories(); renderItems(); });
  el('mobileAdd')?.addEventListener('click', openAddForm);
  el('desktopAdd')?.addEventListener('click', openAddForm);
  el('editProfile')?.addEventListener('click', openProfileEdit);
  el('closeProfileEdit')?.addEventListener('click', closeProfileEdit);
  el('cancelProfileEdit')?.addEventListener('click', closeProfileEdit);
  el('profileEditBackdrop')?.addEventListener('click', event => { if (event.target.id === 'profileEditBackdrop') closeProfileEdit(); });
  el('profileEditForm')?.addEventListener('submit', event => { event.preventDefault(); const username = el('editProfileUsername').value.trim(); profile.name = el('editProfileName').value.trim(); profile.username = username.startsWith('@') ? username : `@${username}`; profile.initials = el('editProfileInitials').value.trim().toUpperCase(); profile.bio = el('editProfileBio').value.trim(); saveState(); renderProfile(); renderExplore(); closeProfileEdit(); showToast('個人資料已更新'); });
  el('publicClosetToggle')?.addEventListener('click', () => { profile.public_closet = !profile.public_closet; saveState(); renderProfile(); showToast(profile.public_closet ? '衣櫥已公開' : '衣櫥已設為私人'); });
  el('exploreSearch')?.addEventListener('input', renderExplore);
  el('notificationButton')?.addEventListener('click', () => { notifications.forEach(notification => notification.read = true); saveState(); renderNotifications(); el('notificationBackdrop').classList.add('open'); });
  el('closeNotifications')?.addEventListener('click', () => el('notificationBackdrop').classList.remove('open'));
  el('notificationBackdrop')?.addEventListener('click', event => { if (event.target.id === 'notificationBackdrop') el('notificationBackdrop').classList.remove('open'); });
  el('closeComments')?.addEventListener('click', closeComments);
  el('commentBackdrop')?.addEventListener('click', event => { if (event.target.id === 'commentBackdrop') closeComments(); });
  el('commentForm')?.addEventListener('submit', event => { event.preventDefault(); const post = ootdPosts.find(item => item.id === el('commentBackdrop').dataset.postId); const text = el('commentInput').value.trim(); if (!text) return; post.commentList.push({ user:profile.username, text }); post.comments += 1; if (post.username === profile.username) addNotification(`${profile.username} 的貼文有了新留言。`, 'explore'); saveState(); renderComments(post); renderExplore(); showToast('留言已送出'); });
  el('sosSearch')?.addEventListener('input', renderSosFeed);
  el('sosReceivedTab')?.addEventListener('click', () => setSosFeedMode('received'));
  el('sosSentTab')?.addEventListener('click', () => setSosFeedMode('sent'));
  el('openSosForm')?.addEventListener('click', openSosForm);
  el('closeSosForm')?.addEventListener('click', closeSosForm);
  el('cancelSosForm')?.addEventListener('click', closeSosForm);
  el('sosForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const vibes = [...document.querySelectorAll('#sosForm .vibe-options input:checked')].map(input => input.value);
    const selectedIds = [...document.querySelectorAll('#sosShareItems input:checked')].map(input => input.value);
    const ownIds = new Set(getCurrentUserItems().map(item => item.id));
    if (!vibes.length) { showToast('至少選一個想呈現的風格'); return; }
    if (!selectedIds.length) { showToast('請至少選擇 1 件要公開給衣友的衣物'); return; }
    if (selectedIds.some(itemId => !ownIds.has(itemId))) { showToast('只能分享自己擁有的衣物'); return; }
    const newPostId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `sos-${Date.now()}`;
    const newPost = {
      id: newPostId,
      sender_id: profile.id,
      closet_owner_id: profile.id,
      username: profile.username,
      initials: profile.initials,
      title: el('sosTitle').value.trim(),
      occasion: el('sosOccasion').value,
      weather: el('sosWeather').value,
      when_label: el('sosWhen').value,
      vibes,
      closet_item_ids: selectedIds,
      closet_count: selectedIds.length,
      status: 'OPEN',
      details: el('sosDetails').value.trim(),
      created_at: new Date().toISOString()
    };
    await OOTIE_ACTIONS.publishSos(newPost);
  });
  el('sosFormBackdrop')?.addEventListener('click', event => { if (event.target.id === 'sosFormBackdrop') closeSosForm(); });
  el('closeSuggestion')?.addEventListener('click', closeSuggestionForm);
  el('cancelSuggestion')?.addEventListener('click', closeSuggestionForm);
  el('suggestionForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const sosId = el('suggestionBackdrop').dataset.sosId;
    const post = sosPosts.find(item => item.id === sosId);
    const sharedIds = new Set(getSosSharedItems(post).map(item => item.id));
    const selectedIds = [...document.querySelectorAll('#suggestionItems input:checked')].map(input => input.value);
    if (!post) { showToast('找不到這筆求救'); return; }
    if (post.status !== 'OPEN') { showToast('這筆求救已經結束'); closeSuggestionForm(); return; }
    if (post.sender_id === profile.id) { showToast('不能替自己的求救搭配'); closeSuggestionForm(); return; }
    if (hasUserRepliedToSos(sosId, profile.id)) { showToast('你已經回覆過這筆求救'); closeSuggestionForm(); return; }
    if (!selectedIds.length) { showToast('至少選一件衣物來搭配'); return; }
    if (selectedIds.some(itemId => !sharedIds.has(itemId))) { showToast('只能選擇這筆求救分享的衣物'); return; }
    const suggestionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `suggestion-${Date.now()}`;
    const newSuggestion = {
      id: suggestionId,
      sos_id: sosId,
      responder_id: profile.id,
      item_ids: selectedIds,
      message: el('suggestionMessage').value.trim(),
      title: post.title || '穿搭求救',
      sender_id: post.sender_id,
      hearts: 0,
      created_at: new Date().toISOString()
    };
    await OOTIE_ACTIONS.submitSuggestion(newSuggestion);
  });
  el('suggestionBackdrop')?.addEventListener('click', event => { if (event.target.id === 'suggestionBackdrop') closeSuggestionForm(); });
  el('closeSosDetail')?.addEventListener('click', closeSosDetail);
  el('sosDetailBackdrop')?.addEventListener('click', event => { if (event.target.id === 'sosDetailBackdrop') closeSosDetail(); });
  el('closeSosConfirm')?.addEventListener('click', closeSosConfirmation);
  el('cancelCloseSos')?.addEventListener('click', closeSosConfirmation);
  el('confirmCloseSos')?.addEventListener('click', () => closeSos(el('closeSosConfirmBackdrop').dataset.sosId));
  el('closeSosConfirmBackdrop')?.addEventListener('click', event => { if (event.target.id === 'closeSosConfirmBackdrop') closeSosConfirmation(); });
  el('closeSosClosetGallery')?.addEventListener('click', closeSosClosetGallery);
  el('sosClosetGalleryBackdrop')?.addEventListener('click', event => { if (event.target.id === 'sosClosetGalleryBackdrop') closeSosClosetGallery(); });
  document.querySelectorAll('[data-feed]').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('[data-feed]').forEach(item => item.classList.toggle('active', item === tab)); renderExplore(); }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeSosForm();
      closeSuggestionForm();
      closeSosDetail();
      closeSosClosetGallery();
      closeSosConfirmation();
      closeAuthForm();
      closeForm();
      closeDetail();
      closeComments();
      el('notificationBackdrop')?.classList.remove('open');
    }
  });
  el('openOotdForm')?.addEventListener('click', openOotdForm);
  el('closeOotdForm')?.addEventListener('click', closeOotdForm);
  el('cancelOotdForm')?.addEventListener('click', closeOotdForm);
  el('ootdPhotoFile')?.addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = loadEvent => { el('ootdPhoto').value = loadEvent.target.result; const preview = el('ootdPreview'); preview.src = loadEvent.target.result; preview.classList.add('visible'); }; reader.readAsDataURL(file); });
  el('ootdForm')?.addEventListener('submit', event => { event.preventDefault(); const image = el('ootdPhoto').value; if (!image) { showToast('請先上傳一張 OOTD 照片'); return; } const hashtags = el('ootdHashtags').value.split(/\s+/).filter(Boolean).map(tag => tag.startsWith('#') ? tag : `#${tag}`); const selectedItems = [...document.querySelectorAll('#ootdTagItems input:checked')].map(input => items.find(item => item.id === input.value)); ootdPosts.unshift({ id:`post-${Date.now()}`, username:profile.username, initials:profile.initials, image, caption:el('ootdCaption').value.trim(), wearing:selectedItems.map(item => item.name_zh || item.name), hashtags, likes:0, comments:0, liked:false, saved:false, following:true, commentList:[] }); saveState(); closeOotdForm(); renderExplore(); renderProfileOotd(); addNotification('你的 OOTD 已成功發布。', 'explore'); showToast('OOTD 已發布'); });
  el('ootdBackdrop')?.addEventListener('click', event => { if (event.target.id === 'ootdBackdrop') closeOotdForm(); });
  el('photoFile')?.addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = loadEvent => { el('photo').value = loadEvent.target.result; const preview = el('uploadPreview'); preview.src = loadEvent.target.result; preview.classList.add('visible'); }; reader.readAsDataURL(file); });
  el('closeForm')?.addEventListener('click', closeForm);
  el('cancelForm')?.addEventListener('click', closeForm);
  [el('detailBackdrop'), el('formBackdrop')].forEach(backdrop => backdrop?.addEventListener('click', event => { if (event.target === backdrop) backdrop.classList.remove('open'); }));
  el('itemForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    delete data.photoFile;
    if (!editingId && !data.photo) { showToast('請先上傳單品照片'); return; }
    if (editingId) { Object.assign(items.find(item => item.id === editingId), data); showToast('衣櫥已更新'); } else { items.unshift({ ...data, id: crypto.randomUUID(), owner_id:profile.id, name_zh:'', secondary_color:'', color_hex:'#D8D2C8', wear_count:0, last_worn:'', purchase_date:new Date().toISOString().slice(0,10), favorite:false, hidden:false, created_at:new Date().toISOString(), photo:data.photo || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85' }); showToast('已加入衣櫥'); }
    saveState();
    closeForm(); renderItems();
  });
  setActiveNav();
  renderNotifications();
  handleSosDeepLink();
  el('authStatusBtn')?.addEventListener('click', async () => {
    if (typeof OOTIE_AUTH !== 'undefined' && OOTIE_AUTH.isAuthenticated()) {
      await OOTIE_AUTH.signOut();
      updateAuthStatusUI();
      showToast('已登出 Supabase Auth');
    } else {
      openAuthForm();
    }
  });
  el('closeAuthForm')?.addEventListener('click', closeAuthForm);
  el('cancelAuthForm')?.addEventListener('click', closeAuthForm);
  el('authFormBackdrop')?.addEventListener('click', event => { if (event.target.id === 'authFormBackdrop') closeAuthForm(); });
  el('authForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = el('authEmail').value.trim();
    const password = el('authPassword').value.trim();
    const errorEl = el('authError');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    if (typeof OOTIE_AUTH === 'undefined') {
      if (errorEl) { errorEl.textContent = 'Supabase Auth 模組尚未載入'; errorEl.style.display = 'block'; }
      return;
    }

    try {
      const res = await OOTIE_AUTH.signIn(email, password);
      if (!res.ok) {
        if (res.error === 'PROFILE_NOT_FOUND') {
          if (errorEl) {
            errorEl.textContent = '登入成功，但找不到相對應的 ootie_profiles 個人檔案（PROFILE_NOT_FOUND）。';
            errorEl.style.display = 'block';
          }
          showToast('PROFILE_NOT_FOUND');
          return;
        }
        throw new Error(res.error || '登入失敗');
      }

      closeAuthForm();
      if (res.profile) {
        profile = res.profile;
        renderProfile();
        renderSosFeed();
      }
      updateAuthStatusUI();
      showToast(`歡迎回來，${res.profile.username || res.profile.name}`);
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || '登入失敗';
        errorEl.style.display = 'block';
      }
    }
  });
}

function openAuthForm() {
  const backdrop = el('authFormBackdrop');
  if (!backdrop) return;
  el('authForm')?.reset();
  const errorEl = el('authError');
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
  backdrop.classList.add('open');
}
function closeAuthForm() {
  el('authFormBackdrop')?.classList.remove('open');
}
function updateAuthStatusUI() {
  const btn = el('authStatusBtn');
  if (!btn) return;
  if (typeof OOTIE_AUTH !== 'undefined' && OOTIE_AUTH.isAuthenticated()) {
    btn.textContent = `🔑 ${profile.username || profile.name || '已登入'} (登出)`;
  } else {
    btn.textContent = '🔑 登入 (Auth)';
  }
}
async function updateAuthProfileSync() {
  if (typeof OOTIE_AUTH !== 'undefined' && OOTIE_AUTH.isAuthenticated()) {
    try {
      const remoteProfile = await OOTIE_AUTH.getProfile();
      if (remoteProfile) {
        profile = remoteProfile;
        renderProfile();
        renderSosFeed();
      }
    } catch (e) {
      console.warn('[OOTie Auth Profile Sync Error]', e);
    }
  }
  updateAuthStatusUI();
}

function initApp() {
  injectShell();
  bindCommonEvents();
  syncFromSupabase();
  updateAuthProfileSync();
  if (typeof OOTIE_AUTH !== 'undefined') {
    OOTIE_AUTH.onAuthStateChange(() => updateAuthProfileSync());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

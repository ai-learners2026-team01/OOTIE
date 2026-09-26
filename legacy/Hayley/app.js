/* ===================== 共用資料與狀態（跨頁面透過 localStorage 保留） ===================== */
const STORAGE_KEY = 'weary-app-state-v1';
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
];
const defaultProfile = { id:'profile-01', user_id:'user-01', name:'Hayley Lin', username:'@hayley', initials:'HL', avatar_url:'', bio:'用衣櫥記錄日常，也和衣友分享每一個穿搭靈感。', hearts:328, helped:24, likes:186, public_closet:true, created_at:'2026-01-04' };
const defaultOotdPosts = [
  { id:'post-01', username:'@minji', initials:'MJ', image:'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85', caption:'一件外套，讓簡單的白 T 也有了秋天的樣子。', wearing:['羊毛大衣','白色上衣','直筒牛仔褲'], hashtags:['#everydaystyle','#autumn'], likes:328, comments:18, liked:false, saved:false, following:true, commentList:[{ id:'comment-01', user:'@ella', text:'這套層次好好看！' },{ id:'comment-02', user:'@hayley', text:'外套的顏色好好看，想問是哪一家的！' },{ id:'comment-03', user:'@minji', text:'@hayley 是去年在 COS 買的，真的很百搭。' }] },
  { id:'post-02', username:'@sofia', initials:'SF', image:'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=85', caption:'週末散步，喜歡這種不需要想太多的搭配。', wearing:['針織上衣','長裙'], hashtags:['#minimal','#weekend'], likes:214, comments:9, liked:true, saved:false, following:false, commentList:[] },
  { id:'post-03', username:'@nora', initials:'NR', image:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85', caption:'今天的顏色是奶油白和一點點棕色。', wearing:['絲質洋裝','肩背包'], hashtags:['#softlook','#ootd'], likes:186, comments:12, liked:false, saved:true, following:true, commentList:[] },
  { id:'post-04', username:'@alex', initials:'AX', image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85', caption:'工作日也想穿得像自己。', wearing:['西裝外套','樂福鞋'], hashtags:['#workwear','#smartcasual'], likes:142, comments:7, liked:false, saved:false, following:false, commentList:[] },
  { id:'post-05', username:'@jules', initials:'JL', image:'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=85', caption:'把熟悉的單品重新搭一次，總會有新發現。', wearing:['寬鬆襯衫','黑色長褲'], hashtags:['#closetremix','#dailylook'], likes:97, comments:4, liked:false, saved:false, following:true, commentList:[] }
];
const defaultNotifications = [
  { id:'notification-01', text:'@ella 喜歡了你的穿搭。', time:'剛剛', read:false, target:'explore', type:'post-like', postId:'post-01', commentId:'', sosId:'', userId:'@ella' },
  { id:'notification-02', text:'你的 SOS 穿搭建議獲得了 3 個 Hearts。', time:'1 小時前', read:false, target:'sos', type:'sos-hearts', postId:'', commentId:'', sosId:'sos-01', userId:'' },
  { id:'notification-03', text:'@minji 回覆了你的留言。', time:'昨天', read:true, target:'explore', type:'comment-reply', postId:'post-01', commentId:'comment-03', sosId:'', userId:'@minji' },
  { id:'notification-04', text:'@sofia 對你的留言按了愛心。', time:'2 天前', read:true, target:'explore', type:'comment-like', postId:'post-01', commentId:'comment-02', sosId:'', userId:'@sofia' },
  { id:'notification-05', text:'@nora 開始追蹤你了。', time:'3 天前', read:true, target:'profile', type:'follow', postId:'', commentId:'', sosId:'', userId:'@nora' }
];
const defaultSosPosts = [
  { id:'sos-01', username:'@ella', initials:'EL', title:'明天第一次約會，我該穿什麼？', occasion:'約會', weather:'涼爽', when_label:'明天', vibes:['Soft','Elegant'], closet_count:32, details:'下午先去咖啡廳，晚上會去義大利餐廳，希望看起來有打扮但不要太正式。' },
  { id:'sos-02', username:'@rachel', initials:'RC', title:'面試新創公司，西裝會不會太正式？', occasion:'工作', weather:'晴天', when_label:'週五', vibes:['Smart Casual','Confident'], closet_count:24, details:'想要專業一點，但也希望保留自己的風格。' },
  { id:'sos-03', username:'@mika', initials:'MK', title:'週末戶外聚餐，怎麼穿才不怕冷？', occasion:'聚餐', weather:'微涼有風', when_label:'週末', vibes:['Relaxed','Layered'], closet_count:41, details:'會在戶外待一整天，希望活動方便又好看。' },
  { id:'sos-04', username:'@jo', initials:'JO', title:'旅行行李只能帶三套，拜託幫我選！', occasion:'旅行', weather:'晴天', when_label:'下週', vibes:['Easy','Versatile'], closet_count:18, details:'目的地白天溫暖、晚上偏涼，想要每件都能互相搭配。' }
];
const categories = ['All','Tops','Bottoms','Dress','Outerwear','Shoes','Bags','Accessories'];
const labels = { All:'全部', Tops:'上衣', Bottoms:'下身', Dress:'洋裝', Outerwear:'外套', Shoes:'鞋履', Bags:'包款', Accessories:'配件', White:'白色', Black:'黑色', Blue:'藍色', Beige:'米色', Brown:'棕色', Minimal:'極簡', Casual:'休閒', 'Smart Casual':'簡約正式', Chic:'時髦', 'Spring / Summer':'春夏', 'Autumn / Winter':'秋冬', 'All year':'四季' };
const occasions = [
  { label:'上班', title:'工作日的俐落一套', copy:'簡潔、舒服，讓你自在地完成今天的待辦。', picks:['1','4','6'] },
  { label:'上課', title:'上課日的舒服層次', copy:'輕鬆好活動，也保留剛剛好的精神感。', picks:['7','2','6'] },
  { label:'約會', title:'浪漫約會提案', copy:'保留一點柔和感，再加上一個讓人記住的細節。', picks:['5','4','6'] },
  { label:'聚餐', title:'聚餐時的恰好打扮', copy:'不用太用力，也能在餐桌邊留下好印象。', picks:['3','5','4'] },
  { label:'運動', title:'輕盈活動日常', copy:'自在伸展、方便行動，穿出輕鬆的好心情。', picks:['7','2','4'] },
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, profile, ootdPosts, notifications, sosPosts, outfitSuggestions, followingUsers }));
  } catch (e) { /* storage unavailable, continue without persistence */ }
}

const saved = loadState();
let items = saved && saved.items ? saved.items : JSON.parse(JSON.stringify(defaultItems));
let profile = saved && saved.profile ? saved.profile : JSON.parse(JSON.stringify(defaultProfile));
let ootdPosts = saved && saved.ootdPosts ? saved.ootdPosts : JSON.parse(JSON.stringify(defaultOotdPosts));
let notifications = saved && saved.notifications ? saved.notifications : JSON.parse(JSON.stringify(defaultNotifications));
let sosPosts = saved && saved.sosPosts ? saved.sosPosts : JSON.parse(JSON.stringify(defaultSosPosts));
let outfitSuggestions = (saved && saved.outfitSuggestions) || [];
/* 追蹤關係的唯一來源（貼文的 following 只用於探索頁顯示，會由 setFollowingUser 同步更新） */
let followingUsers = (saved && Array.isArray(saved.followingUsers)) ? saved.followingUsers.slice() : ootdPosts.filter(post => post.following).map(post => normalizeUsername(post.username));
followingUsers = [...new Set(followingUsers.map(normalizeUsername))].filter(name => name && name !== normalizeUsername(profile.username));
let weatherState = { temperature: null, rain: false, label: '正在取得天氣…', icon: '☁' };

let activeCategory = 'All';
let editingId = null;

/* ===================== 小工具 ===================== */
function el(id) { return document.getElementById(id); }
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
  const requestedUser = new URLSearchParams(window.location.search).get('user');
  const activePage = current === 'profile' && requestedUser && normalizeUsername(requestedUser) !== normalizeUsername(profile.username) ? 'explore' : current;
  document.querySelectorAll('[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === activePage));
}

/* ===================== 共用版型（側邊欄／頂欄／手機導覽／通知視窗） ===================== */
const SIDEBAR_HTML = `
<aside class="sidebar">
  <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="收起側欄" aria-expanded="true">‹</button>
  <nav class="nav" aria-label="主選單">
    <a data-page="home" href="home.html"><span class="nav-icon">⌂</span>首頁</a>
    <a data-page="explore" href="explore.html"><span class="nav-icon">✦</span>探索</a>
    <a data-page="closet" href="closet.html"><span class="nav-icon closet-nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5zM12 4.5v15M9 8h1M14 8h1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>衣櫥</a>
    <a data-page="profile" href="profile.html"><span class="nav-icon">◯</span>我的</a>
  </nav>
  <div class="sidebar-footer">你的衣櫥，是每天選擇穿搭的<br>專屬空間。</div>
</aside>`;

const TOPBAR_HTML = `
<header class="topbar">
  <div class="mobile-brand">OOTie</div>
  <div class="top-actions">
    <button class="icon-button" id="notificationButton" aria-label="通知">♧<span class="notification-badge" id="notificationBadge">0</span></button>
    <a class="avatar" id="topbarAvatar" href="profile.html" aria-label="前往我的個人檔案" title="我的個人檔案">HL</a>
  </div>
</header>`;

const BOTTOM_NAV_HTML = `
<nav class="bottom-nav" aria-label="手機版導覽">
  <a data-page="home" href="home.html"><span>⌂</span>首頁</a>
  <a data-page="explore" href="explore.html"><span>✦</span>探索</a>
  <div class="quick-action-wrap">
    <button type="button" class="quick-action-trigger" id="quickActionToggle" aria-label="新增內容"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
    <div class="quick-action-menu" id="quickActionMenu" aria-hidden="true">
      <button type="button" class="quick-action-item" data-quick-action="add-item">
        <span class="quick-action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4l4 2 4-2 4 3-2 4-2-1v10H8V10l-2 1-2-4 4-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></span>
        <span>
          <strong>加入單品</strong>
          <small>加入衣櫥</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" data-quick-action="ootd">
        <span class="quick-action-icon">♡</span>
        <span>
          <strong>發布 OOTD</strong>
          <small>分享穿搭</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" data-quick-action="sos">
        <span class="quick-action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v6A2.5 2.5 0 0 1 16.5 14H11l-4.5 4v-4.35A2.5 2.5 0 0 1 5 11.5v-6ZM9 8.5h6M9 11.5h3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span>
          <strong>發布求救</strong>
          <small>尋求搭配</small>
        </span>
      </button>
    </div>
  </div>
  <a data-page="closet" href="closet.html"><span class="closet-nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5zM12 4.5v15M9 8h1M14 8h1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>衣櫥</a>
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

function setupSidebarToggle() {
  const sidebarToggle = el('sidebarToggle');
  if (!sidebarToggle) return;
  const collapsed = localStorage.getItem('ootie-sidebar-collapsed') === 'true';
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.setAttribute('aria-label', collapsed ? '展開側欄' : '收起側欄');
  sidebarToggle.textContent = collapsed ? '›' : '‹';
  sidebarToggle.addEventListener('click', () => {
    const nextCollapsed = !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', nextCollapsed);
    localStorage.setItem('ootie-sidebar-collapsed', String(nextCollapsed));
    sidebarToggle.setAttribute('aria-expanded', String(!nextCollapsed));
    sidebarToggle.setAttribute('aria-label', nextCollapsed ? '展開側欄' : '收起側欄');
    sidebarToggle.textContent = nextCollapsed ? '›' : '‹';
  });
}

/* ===================== 首頁 ===================== */
function weatherLabel(code, temperature) {
  const descriptions = { 0:'晴朗', 1:'大致晴朗', 2:'多雲', 3:'陰天', 45:'有霧', 48:'有霧', 51:'細雨', 53:'細雨', 55:'細雨', 61:'小雨', 63:'下雨', 65:'大雨', 71:'下雪', 73:'下雪', 75:'大雪', 80:'陣雨', 81:'陣雨', 82:'大陣雨', 95:'雷雨', 96:'雷雨', 99:'雷雨' };
  return `${descriptions[code] || '天氣良好'} ${Math.round(temperature)}°C`;
}
function weatherIcon(code) {
  if ([95,96,99].includes(code)) return '⚡';
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return '☂';
  if ([71,73,75].includes(code)) return '❄';
  if ([2,3,45,48].includes(code)) return '☁';
  return '☀';
}
async function loadWeather() {
  const useWeather = async (latitude, longitude) => {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,rain&timezone=auto`);
    if (!response.ok) throw new Error('weather request failed');
    const current = (await response.json()).current;
    weatherState = { temperature: current.temperature_2m, rain: current.rain > 0 || [51,53,55,61,63,65,80,81,82,95,96,99].includes(current.weather_code), label: weatherLabel(current.weather_code, current.temperature_2m), icon: weatherIcon(current.weather_code) };
    const weatherElement = el('weatherStatus');
    if (weatherElement) weatherElement.innerHTML = `<span class="weather-icon" aria-hidden="true">${weatherState.icon}</span><span>${weatherState.label}</span>`;
    updateRecommendation(document.querySelector('.occasion.selected')?.dataset.occasion || '上班');
  };
  try {
    if (!navigator.geolocation) throw new Error('geolocation unavailable');
    navigator.geolocation.getCurrentPosition(position => useWeather(position.coords.latitude, position.coords.longitude).catch(() => useWeather(25.033, 121.565)), () => useWeather(25.033, 121.565).catch(() => {}), { timeout:5000 });
  } catch (error) {
    await useWeather(25.033, 121.565).catch(() => {});
  }
}
function renderHome() {
  const occasionRow = el('occasionRow');
  if (!occasionRow) return;
  occasionRow.innerHTML = occasions.map(occasion => `<button class="occasion ${occasion.label === '上班' ? 'selected' : ''}" data-occasion="${occasion.label}">${occasion.label}</button>`).join('');
  occasionRow.querySelectorAll('[data-occasion]').forEach(button => button.addEventListener('click', () => updateRecommendation(button.dataset.occasion)));
  el('rerollRecommendation')?.addEventListener('click', () => updateRecommendation(document.querySelector('.occasion.selected')?.dataset.occasion || '上班', true));
  document.querySelectorAll('[data-home-post]').forEach(card => {
    const openPost = () => openComments(card.dataset.homePost);
    card.addEventListener('click', openPost);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPost(); } });
  });
  const recentRow = el('recentRow');
  if (recentRow) {
    recentRow.innerHTML = items.slice(0, 4).map(item => `<a class="recent-card" href="closet.html" data-item="${item.id}"><div class="item-image"><img src="${item.photo}" alt="${item.name_zh || item.name}" loading="lazy"></div><h3>${item.name_zh || item.name}</h3></a>`).join('');
    recentRow.querySelectorAll('[data-item]').forEach(card => card.addEventListener('click', event => { event.preventDefault(); openDetail(card.dataset.item); }));
  }
  updateRecommendation('上班');
  loadWeather();
}
function getRecommendationItems(occasion, reroll = false) {
  const availableItems = items.filter(item => !item.hidden);
  const preferredItems = occasion.picks.map(id => availableItems.find(item => item.id === id)).filter(Boolean);
  const currentIds = new Set((el('outfitMini')?.querySelectorAll('img') ? [...el('outfitMini').querySelectorAll('img')].map(image => image.dataset.itemId) : []).filter(Boolean));
  const selectedItems = [];
  const selectedCategories = new Set();
  const requiredCategories = ['Tops', 'Bottoms', 'Shoes'];

  requiredCategories.forEach(category => {
    const categoryItems = availableItems.filter(entry => entry.category === category && (!reroll || !currentIds.has(entry.id)));
    const scoredItems = categoryItems.map(item => ({ item, score: weatherScore(item) + (preferredItems.includes(item) ? 2 : 0) + Math.random() * 2 })).sort((a, b) => b.score - a.score);
    const item = scoredItems[0]?.item || preferredItems.find(entry => entry.category === category) || availableItems.find(entry => entry.category === category);
    if (item && !selectedCategories.has(item.category)) {
      selectedItems.push(item);
      selectedCategories.add(item.category);
    }
  });

  (reroll ? [...availableItems].sort(() => Math.random() - 0.5) : preferredItems.concat(availableItems)).forEach(item => {
    if (selectedItems.length >= 3 || selectedCategories.has(item.category)) return;
    selectedItems.push(item);
    selectedCategories.add(item.category);
  });

  return selectedItems.slice(0, 3);
}
function weatherScore(item) {
  if (weatherState.temperature === null) return 0;
  let score = 0;
  const cold = weatherState.temperature < 18;
  const hot = weatherState.temperature >= 26;
  if (cold && ['Autumn / Winter', 'All year'].includes(item.season)) score += 4;
  if (hot && ['Spring / Summer', 'All year'].includes(item.season)) score += 4;
  if (weatherState.rain && item.category === 'Shoes' && ['Black', 'Brown'].includes(item.primary_color)) score += 2;
  if (cold && item.category === 'Outerwear') score += 3;
  if (hot && item.category === 'Outerwear') score -= 4;
  return score;
}
function updateRecommendation(label, reroll = false) {
  if (!el('recommendationTitle')) return;
  const occasion = occasions.find(entry => entry.label === label) || occasions[3];
  document.querySelectorAll('.occasion').forEach(button => button.classList.toggle('selected', button.dataset.occasion === occasion.label));
  el('recommendationTitle').textContent = occasion.title;
  el('recommendationCopy').textContent = occasion.copy;
  const outfitMini = el('outfitMini');
  outfitMini.innerHTML = getRecommendationItems(occasion, reroll).map(item => `<img data-item-id="${item.id}" src="${item.photo}" alt="${item.name_zh || item.name}" role="button" tabindex="0" aria-label="查看「${item.name_zh || item.name}」的詳細資訊">`).join('');
  outfitMini.querySelectorAll('[data-item-id]').forEach(image => {
    const openItem = () => openDetail(image.dataset.itemId);
    image.addEventListener('click', openItem);
    image.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openItem();
    });
  });
}

function normalizeUsername(username = '') {
  const cleaned = (username || '').trim();
  return cleaned.startsWith('@') ? cleaned : cleaned ? `@${cleaned}` : '';
}
function isFollowingUser(username) {
  const target = normalizeUsername(username);
  if (!target || target === normalizeUsername(profile.username)) return false;
  return followingUsers.includes(target);
}
function setFollowingUser(username, following) {
  const target = normalizeUsername(username);
  if (!target || target === normalizeUsername(profile.username)) return false;
  followingUsers = following ? [...new Set(followingUsers.concat(target))] : followingUsers.filter(name => name !== target);
  ootdPosts.forEach(post => { if (normalizeUsername(post.username) === target) post.following = following; });
  saveState();
  return following;
}
function getTargetProfileUsername() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('user');
  return normalizeUsername(requested || profile.username);
}
function getProfileByUsername(username) {
  const targetUsername = normalizeUsername(username);
  if (!targetUsername) return profile;
  if (targetUsername === normalizeUsername(profile.username)) return profile;

  const userPosts = ootdPosts.filter(post => normalizeUsername(post.username) === targetUsername);
  const userSos = sosPosts.filter(post => normalizeUsername(post.username) === targetUsername);
  const displayName = targetUsername.replace(/^@/, '').split(/[-_\s]+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Style Friend';
  const initials = targetUsername.replace(/^@/, '').slice(0, 2).toUpperCase() || 'SF';

  return {
    id: `profile-${targetUsername.replace(/^@/, '')}`,
    user_id: targetUsername,
    name: displayName,
    username: targetUsername,
    initials,
    avatar_url:'',
    bio: userPosts.length ? `正在分享 ${userPosts.length} 篇穿搭靈感，和大家交換日常穿搭。` : '這位衣友還沒有更新過穿搭，但一定有好看的風格等著被發現。',
    hearts: userPosts.reduce((sum, post) => sum + post.likes, 0),
    helped: userSos.length,
    likes: userPosts.reduce((sum, post) => sum + post.likes, 0),
    public_closet: true,
    created_at: new Date().toISOString()
  };
}

/* ===================== 個人檔案 ===================== */
function renderProfile() {
  if (!el('profileName')) return;
  const targetUsername = getTargetProfileUsername();
  const currentProfile = getProfileByUsername(targetUsername);
  const isSelf = normalizeUsername(currentProfile.username) === normalizeUsername(profile.username);

  el('profileName').textContent = currentProfile.name;
  el('profileHandle').textContent = currentProfile.username;
  el('profileBio').textContent = currentProfile.bio;
  el('profileAvatar').textContent = currentProfile.initials;
  el('profileHearts').textContent = currentProfile.hearts;
  el('profileHelped').textContent = currentProfile.helped;
  el('profileLikes').textContent = currentProfile.likes;

  const publicClosetToggle = el('publicClosetToggle');
  if (publicClosetToggle) {
    publicClosetToggle.classList.toggle('on', currentProfile.public_closet);
    publicClosetToggle.setAttribute('aria-pressed', currentProfile.public_closet);
    publicClosetToggle.style.display = isSelf ? 'inline-flex' : 'none';
  }

  const editButton = el('editProfile');
  if (editButton) editButton.style.display = isSelf ? 'inline-flex' : 'none';

  const ootdButton = el('openOotdForm');
  if (ootdButton) ootdButton.style.display = isSelf ? 'inline-flex' : 'none';

  const followButton = el('followProfile');
  if (followButton) {
    const following = isFollowingUser(currentProfile.username);
    followButton.style.display = isSelf ? 'none' : 'inline-flex';
    followButton.classList.toggle('primary', !following);
    followButton.classList.toggle('secondary', following);
    followButton.textContent = following ? '已追蹤' : '＋ 追蹤';
    followButton.setAttribute('aria-pressed', String(following));
    followButton.setAttribute('aria-label', following ? `取消追蹤 ${currentProfile.username}` : `追蹤 ${currentProfile.username}`);
  }

  renderProfileOotd();
}
function openProfileEdit() { el('editProfileName').value = profile.name; el('editProfileUsername').value = profile.username; el('editProfileInitials').value = profile.initials; el('editProfileBio').value = profile.bio; el('profileEditBackdrop').classList.add('open'); }
function closeProfileEdit() { el('profileEditBackdrop').classList.remove('open'); }
function renderProfileOotd() {
  const gridElement = el('profileOotdGrid');
  if (!gridElement) return;
  const targetUsername = getTargetProfileUsername();
  const posts = ootdPosts.filter(post => normalizeUsername(post.username) === normalizeUsername(targetUsername));
  if (!posts.length) {
    const isSelf = normalizeUsername(targetUsername) === normalizeUsername(profile.username);
    gridElement.innerHTML = `<div class="profile-ootd-empty">${isSelf ? '你發布的 OOTD 會顯示在這裡。' : '這位衣友還沒有發布 OOTD。'}</div>`;
    return;
  }
  gridElement.innerHTML = posts.map(post => `
    <article class="ootd-card profile-ootd-card" data-comment-post="${post.id}" tabindex="0" role="button" aria-label="查看 ${post.username} 的 OOTD">
      <img class="ootd-photo" src="${post.image}" alt="${post.username} 的 OOTD">
      <div class="ootd-body">
        <p class="ootd-caption">${post.caption}</p>
        <div class="ootd-tags">${post.hashtags.join('　')}</div>
        <div class="ootd-actions profile-ootd-actions">
          <button type="button" class="ootd-action profile-ootd-action ${post.liked ? 'liked' : ''}" data-like-post="${post.id}">${post.liked ? '♥' : '♡'} ${post.likes}</button>
          <button type="button" class="ootd-action profile-ootd-action" data-comment-post="${post.id}"><svg class="comment-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v6A2.5 2.5 0 0 1 16.5 14H11l-4.5 4v-4.35A2.5 2.5 0 0 1 5 11.5v-6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>${post.comments}</button>
          <button type="button" class="ootd-action profile-ootd-action ${post.saved ? 'saved' : ''}" data-save-post="${post.id}"><svg class="save-action-icon ${post.saved ? 'filled' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75v14.5a.75.75 0 0 1-1.15.64L12 17.95l-3.85 2.04A.75.75 0 0 1 7 19.25V4.75Z"/></svg>${post.saved_count ?? 0}</button>
        </div>
      </div>
    </article>
  `).join('');

  gridElement.querySelectorAll('[data-like-post]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    const post = ootdPosts.find(item => item.id === button.dataset.likePost);
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    if (post.liked && post.username === profile.username) { profile.hearts += 1; renderProfile(); addNotification('你的穿搭收到了一個 Heart。', { target:'explore', type:'post-like', postId:post.id }); }
    saveState(); renderProfileOotd();
  }));

  gridElement.querySelectorAll('[data-comment-post]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    openComments(button.dataset.commentPost);
  }));

  gridElement.querySelectorAll('[data-save-post]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    const post = ootdPosts.find(item => item.id === button.dataset.savePost);
    post.saved = !post.saved;
    post.saved_count = Math.max(0, (post.saved_count ?? 0) + (post.saved ? 1 : -1));
    saveState(); renderProfileOotd(); showToast(post.saved ? '已收藏這篇穿搭' : '已取消收藏');
  }));

  gridElement.querySelectorAll('.profile-ootd-card').forEach(card => {
    const openPost = () => openComments(card.dataset.commentPost);
    card.addEventListener('click', openPost);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPost();
      }
    });
  });
}

/* ===================== 通知（每一頁共用） ===================== */
function notificationLink(notification) {
  const target = notification.target || 'profile';
  const params = new URLSearchParams();
  if (notification.postId) params.set('post', notification.postId);
  if (notification.commentId) params.set('comment', notification.commentId);
  if (notification.sosId) params.set('sos', notification.sosId);
  if (target === 'profile' && !notification.postId && notification.userId) params.set('user', normalizeUsername(notification.userId));
  const query = params.toString();
  return query ? `${target}.html?${query}` : `${target}.html`;
}
function notificationProfileLink(notification) {
  const username = normalizeUsername(notification.userId);
  return username ? `profile.html?user=${encodeURIComponent(username)}` : '';
}
function notificationTextHtml(notification) {
  const text = notification.text || '';
  const actor = normalizeUsername(notification.userId);
  const index = actor ? text.indexOf(actor) : -1;
  if (index < 0) return `<span class="notification-text">${text}</span>`;
  const before = text.slice(0, index);
  const after = text.slice(index + actor.length);
  return `<span class="notification-text">${before}<a class="notification-user" href="${notificationProfileLink(notification)}" data-notification-user="${actor}" aria-label="查看 ${actor} 的個人檔案">${actor}</a>${after}</span>`;
}
function renderNotifications() {
  const badge = el('notificationBadge');
  if (!badge) return;
  const unread = notifications.filter(notification => !notification.read).length;
  badge.textContent = unread;
  badge.style.display = unread ? 'block' : 'none';
  const list = el('notificationList');
  if (!list) return;
  list.innerHTML = notifications.map(notification => `<div class="notification-item ${notification.read ? '' : 'unread'}" role="button" tabindex="0" data-notification-id="${notification.id}" aria-label="查看這則通知">${notificationTextHtml(notification)}<span class="notification-time">${notification.time}</span></div>`).join('');

  list.querySelectorAll('[data-notification-id]').forEach(item => {
    const notification = notifications.find(entry => entry.id === item.dataset.notificationId);
    if (!notification) return;
    const openNotification = () => { closeNotificationPanel(); window.location.href = notificationLink(notification); };
    item.addEventListener('click', openNotification);
    item.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openNotification();
    });
    const profileLink = item.querySelector('[data-notification-user]');
    if (profileLink) {
      profileLink.addEventListener('click', event => { event.stopPropagation(); closeNotificationPanel(); });
      profileLink.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation(); });
    }
  });
}
function closeNotificationPanel() { el('notificationBackdrop')?.classList.remove('open'); }
function addNotification(text, options = {}) {
  const details = typeof options === 'string' ? { target: options } : options;
  notifications.unshift({ id:`notification-${Date.now()}-${notifications.length}`, text, time:'剛剛', read:false, target:details.target || 'profile', type:details.type || 'system', postId:details.postId || '', commentId:details.commentId || '', userId:details.userId || '', sosId:details.sosId || '' });
  saveState();
  renderNotifications();
}

/* ===================== 探索 / OOTD ===================== */
function renderComments(post) {
  const list = el('commentList');
  if (!list) return;
  const postImage = el('commentPostImage');
  if (postImage) postImage.src = post.image;
  const postHeader = el('commentPostHeader');
  if (postHeader) postHeader.innerHTML = `<div class="comment-post-user"><span class="comment-post-avatar">${post.initials}</span><div><strong>${post.username}</strong><span>今日分享</span></div></div>`;
  const postCaption = el('commentPostCaption');
  if (postCaption) postCaption.innerHTML = `<strong>${post.username}</strong> ${post.caption}`;
  const postMeta = el('commentPostMeta');
  if (postMeta) postMeta.innerHTML = post.hashtags.join('　');
  const postActions = el('commentPostActions');
  if (postActions) {
    postActions.innerHTML = `<button type="button" class="comment-post-action ${post.liked ? 'liked' : ''}" data-modal-like="${post.id}" aria-label="${post.liked ? '取消愛心' : '按愛心'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S4 15.7 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5c0 6.2-8 11-8 11Z" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7"/></svg><span>${post.likes}</span></button><button type="button" class="comment-post-action" data-modal-comment="${post.id}" aria-label="留言"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v6A2.5 2.5 0 0 1 16.5 14H11l-4.5 4v-4.35A2.5 2.5 0 0 1 5 11.5v-6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span>${post.comments}</span></button><button type="button" class="comment-post-action ${post.saved ? 'saved' : ''}" data-modal-save="${post.id}" aria-label="${post.saved ? '取消收藏' : '收藏'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75v14.5a.75.75 0 0 1-1.15.64L12 17.95l-3.85 2.04A.75.75 0 0 1 7 19.25V4.75Z" fill="${post.saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7"/></svg><span>${post.saved ? '已收藏' : '收藏'}</span></button>`;
    postActions.querySelector('[data-modal-like]')?.addEventListener('click', () => {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      saveState();
      renderComments(post);
      renderExplore();
      renderProfileOotd();
    });
    postActions.querySelector('[data-modal-save]')?.addEventListener('click', () => {
      post.saved = !post.saved;
      post.saved_count = Math.max(0, (post.saved_count ?? 0) + (post.saved ? 1 : -1));
      saveState();
      renderComments(post);
      renderExplore();
      renderProfileOotd();
      showToast(post.saved ? '已收藏這篇穿搭' : '已取消收藏');
    });
    postActions.querySelector('[data-modal-comment]')?.addEventListener('click', () => el('commentInput')?.focus());
  }
  list.innerHTML = post.commentList.length ? post.commentList.map((comment, index) => `<div class="comment-item" data-comment-id="${comment.id || `comment-${post.id}-${index}`}"><strong>${comment.user}</strong>${comment.text}</div>`).join('') : '<p class="notification-time">還沒有留言，成為第一個留言的人吧。</p>';
  const backdrop = el('commentBackdrop');
  if (backdrop) backdrop.dataset.postId = post.id;
  const input = el('commentInput');
  if (input) input.value = '';
}
function openComments(postId, commentId = '') { const post = ootdPosts.find(item => item.id === postId); if (!post) return false; renderComments(post); const backdrop = el('commentBackdrop'); if (!backdrop) return false; backdrop.classList.add('open'); if (commentId) highlightComment(commentId); return true; }
function closeComments() { const backdrop = el('commentBackdrop'); if (backdrop) backdrop.classList.remove('open'); }
function highlightComment(commentId) {
  const comment = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
  if (!comment) return false;
  comment.classList.add('highlight');
  comment.scrollIntoView({ block:'nearest', behavior:'smooth' });
  return true;
}
function renderExplore() {
  const gridElement = el('ootdGrid');
  if (!gridElement) return;
  const query = el('exploreSearch').value.toLowerCase().trim();
  const feed = document.querySelector('.feed-tab.active').dataset.feed;
  const posts = ootdPosts.filter(post => (feed === 'for-you' || post.following) && (!query || `${post.username} ${post.caption} ${post.hashtags.join(' ')} ${post.wearing.join(' ')}`.toLowerCase().includes(query)));
  if (!posts.length) { gridElement.innerHTML = '<div class="explore-empty">找不到符合的穿搭，換個關鍵字試試看吧。</div>'; return; }
  gridElement.innerHTML = posts.map((post, index) => `
    <article class="ootd-card" style="animation-delay:${index * 45}ms">
      <button type="button" class="photo-link" data-comment-post="${post.id}" aria-label="查看 ${post.username} 的穿搭貼文">
        <img class="ootd-photo" src="${post.image}" alt="${post.username} 的穿搭">
      </button>
      <div class="ootd-body">
        <div class="ootd-user">
          <button type="button" class="user-link" data-profile-user="${post.username}" aria-label="查看 ${post.username} 的主頁">
            <span class="ootd-avatar">${post.initials}</span>
          </button>
          <div class="ootd-user-copy">
            <button type="button" class="user-name-button" data-profile-user="${post.username}">${post.username}</button>
            <span>今日分享</span>
          </div>
          <button type="button" class="follow-toggle ${post.following ? 'following' : ''}" data-follow-user="${post.username}">${post.following ? '已追蹤' : '＋ 追蹤'}</button>
        </div>
        <p class="ootd-caption">${post.caption}</p>
        <div class="ootd-tags">${post.hashtags.join('　')}</div>
        <div class="ootd-actions ootd-actions-three">
          <button class="ootd-action ${post.liked ? 'liked' : ''}" data-like-post="${post.id}">${post.liked ? '♥' : '♡'} ${post.likes}</button>
          <button class="ootd-action" data-comment-post="${post.id}"><svg class="comment-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v6A2.5 2.5 0 0 1 16.5 14H11l-4.5 4v-4.35A2.5 2.5 0 0 1 5 11.5v-6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>${post.comments}</button>
          <button class="ootd-action ${post.saved ? 'saved' : ''}" data-save-post="${post.id}"><svg class="save-action-icon ${post.saved ? 'filled' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75v14.5a.75.75 0 0 1-1.15.64L12 17.95l-3.85 2.04A.75.75 0 0 1 7 19.25V4.75Z"/></svg>${post.saved_count ?? 0}</button>
        </div>
      </div>
    </article>
  `).join('');
  gridElement.querySelectorAll('[data-profile-user]').forEach(button => button.addEventListener('click', () => {
    const username = normalizeUsername(button.dataset.profileUser);
    window.location.href = `profile.html?user=${encodeURIComponent(username)}`;
  }));
  gridElement.querySelectorAll('[data-follow-user]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const username = normalizeUsername(button.dataset.followUser);
      const targetPost = ootdPosts.find(post => normalizeUsername(post.username) === username);
      if (!targetPost) return;
      const following = setFollowingUser(username, !isFollowingUser(username));

      const feed = document.querySelector('.feed-tab.active')?.dataset.feed;
      const card = button.closest('article');
      button.classList.toggle('following', following);
      button.textContent = following ? '已追蹤' : '＋ 追蹤';

      if (feed === 'following' && !following && card) {
        card.remove();
      }

      showToast(following ? '已追蹤這位衣友' : '已取消追蹤');
    });
  });
  gridElement.querySelectorAll('[data-like-post]').forEach(button => button.addEventListener('click', () => {
    const post = ootdPosts.find(item => item.id === button.dataset.likePost);
    if (!post) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    button.classList.toggle('liked', post.liked);
    button.textContent = `${post.liked ? '♥' : '♡'} ${post.likes}`;
    if (post.liked && post.username === profile.username) { profile.hearts += 1; renderProfile(); addNotification('你的穿搭收到了一個 Heart。', { target:'explore', type:'post-like', postId:post.id }); }
    saveState();
  }));
  gridElement.querySelectorAll('[data-comment-post]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    openComments(button.dataset.commentPost);
  }));
  gridElement.querySelectorAll('.photo-link').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    openComments(button.dataset.commentPost);
  }));
  gridElement.querySelectorAll('[data-save-post]').forEach(button => button.addEventListener('click', () => {
    const post = ootdPosts.find(item => item.id === button.dataset.savePost);
    post.saved = !post.saved;
    post.saved_count = Math.max(0, (post.saved_count ?? 0) + (post.saved ? 1 : -1));
    button.classList.toggle('saved', post.saved);
    button.innerHTML = `<svg class="save-action-icon ${post.saved ? 'filled' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75v14.5a.75.75 0 0 1-1.15.64L12 17.95l-3.85 2.04A.75.75 0 0 1 7 19.25V4.75Z"/></svg>${post.saved_count ?? 0}`;
    saveState(); showToast(post.saved ? '已收藏這篇穿搭' : '已取消收藏');
  }));
}
function renderOotdTagItems() {
  const container = el('ootdTagItems');
  if (!container) return;
  container.innerHTML = items.map(item => `<label class="tag-item"><input type="checkbox" value="${item.id}"> ${item.name_zh || item.name}</label>`).join('');
}
function openOotdForm() { el('ootdForm').reset(); el('ootdPhoto').value = ''; el('ootdPreview').src = ''; el('ootdPreview').classList.remove('visible'); renderOotdTagItems(); el('ootdBackdrop').classList.add('open'); }
function closeOotdForm() { el('ootdBackdrop').classList.remove('open'); }

/* ===================== 穿搭求救（SOS） ===================== */
function renderSosFeed() {
  const feed = el('sosFeed');
  if (!feed) return;
  const query = el('sosSearch').value.toLowerCase().trim();
  const posts = sosPosts.filter(post => `${post.username} ${post.title} ${post.occasion} ${post.vibes.join(' ')}`.toLowerCase().includes(query));
  if (!posts.length) { feed.innerHTML = '<div class="sos-empty">找不到符合的求救貼文，換個關鍵字試試看吧。</div>'; return; }
  feed.innerHTML = posts.map((post, index) => `<article class="sos-feed-card" data-sos-post="${post.id}" style="animation-delay:${index * 45}ms"><div class="sos-feed-user"><div class="sos-feed-avatar">${post.initials}</div><div><strong>${post.username}</strong><span>穿搭求救</span></div></div><h2>${post.title}</h2><div class="sos-meta"><span>場合｜${post.occasion}</span><span>天氣｜${post.weather}</span><span>時間｜${post.when_label}</span></div><div class="sos-vibes">想呈現：${post.vibes.join('　')}</div><div class="sos-card-footer"><span class="sos-available">${post.closet_count} 件衣服可選</span><button class="sos-cta" data-style-sos="${post.id}">幫她搭配</button></div></article>`).join('');
  feed.querySelectorAll('[data-style-sos]').forEach(button => button.addEventListener('click', () => openSuggestionForm(button.dataset.styleSos)));
}
function highlightSosPost(sosId) {
  const card = document.querySelector(`.sos-feed-card[data-sos-post="${sosId}"]`);
  if (!card) return false;
  card.classList.add('highlight');
  card.scrollIntoView({ block:'center', behavior:'smooth' });
  return true;
}
function renderSuggestionItems() {
  const container = el('suggestionItems');
  if (!container) return;
  container.innerHTML = items.slice(0, 8).map(item => `<label class="suggestion-item"><input type="checkbox" value="${item.id}"><img src="${item.photo}" alt="${item.name_zh || item.name}"><span>${item.name_zh || item.name}</span></label>`).join('');
  document.querySelectorAll('#suggestionItems input').forEach(input => input.addEventListener('change', updateCurrentOutfit));
}
function updateCurrentOutfit() {
  if (!el('suggestionSelected')) return;
  const selected = [...document.querySelectorAll('#suggestionItems input:checked')].map(input => items.find(item => item.id === input.value));
  el('suggestionSelected').textContent = `已選 ${selected.length} 件`;
  const currentOutfit = el('currentOutfit');
  currentOutfit.classList.toggle('visible', selected.length > 0);
  if (!selected.length) return;
  el('currentOutfitImages').innerHTML = selected.map((item, index) => `${index ? '<span class="outfit-plus">＋</span>' : ''}<img src="${item.photo}" alt="${item.name_zh || item.name}">`).join('');
  el('currentOutfitNames').textContent = selected.map(item => item.name_zh || item.name).join(' ＋ ');
}
function openSuggestionForm(sosId) { const post = sosPosts.find(item => item.id === sosId); el('suggestionForm').reset(); el('suggestionIntro').textContent = `正在為 ${post.username} 的「${post.title}」挑選搭配。`; renderSuggestionItems(); el('suggestionSelected').textContent = '已選 0 件'; el('currentOutfit').classList.remove('visible'); el('currentOutfitImages').innerHTML = ''; el('currentOutfitNames').textContent = ''; el('suggestionBackdrop').dataset.sosId = sosId; el('suggestionBackdrop').classList.add('open'); }
function closeSuggestionForm() { el('suggestionBackdrop').classList.remove('open'); }
function openSosForm() { el('sosForm').reset(); el('sosFormBackdrop').classList.add('open'); }
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
  return items.filter(item => {
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
  if (!item) { showToast('找不到這件單品'); return; }
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
function handleQuickAction(action) {
  closeQuickActionMenu();
  const currentPage = document.body.dataset.page;
  const actionMap = {
    'add-item': { page: 'closet.html', open: () => openAddForm() },
    'ootd': { page: 'explore.html', open: () => openOotdForm() },
    'sos': { page: 'sos.html', open: () => openSosForm() }
  };
  const target = actionMap[action];
  if (!target) return;

  if ((action === 'add-item' && currentPage === 'closet') || (action === 'ootd' && currentPage === 'explore') || (action === 'sos' && currentPage === 'sos')) {
    target.open();
    return;
  }

  const params = new URLSearchParams({ quick: action });
  window.location.href = `${target.page}?${params.toString()}`;
}

function closeQuickActionMenu() {
  document.querySelectorAll('.quick-action-menu').forEach(menu => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('.quick-action-trigger,.sidebar-add').forEach(trigger => trigger.classList.remove('open'));
}

function applyQuickActionFromUrl() {
  const quickAction = new URLSearchParams(window.location.search).get('quick');
  if (!quickAction) return;
  setTimeout(() => {
    if (quickAction === 'add-item') openAddForm();
    if (quickAction === 'ootd') openOotdForm();
    if (quickAction === 'sos') openSosForm();
  }, 0);
}

/* 通知細項的深層連結：?post= 開對應貼文、?comment= 標示該留言、?sos= 標示該求救貼文 */
function applyNotificationDeepLinkFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('post');
  const commentId = params.get('comment');
  const sosId = params.get('sos');
  if (!postId && !sosId) return;
  setTimeout(() => {
    if (postId && !openComments(postId, commentId || '')) showToast('找不到這則通知對應的貼文');
    if (sosId) highlightSosPost(sosId);
  }, 0);
}

function bindCommonEvents() {
  el('searchInput')?.addEventListener('input', renderItems);
  ['colorFilter','seasonFilter','styleFilter'].forEach(id => el(id)?.addEventListener('change', renderItems));
  el('clearFilters')?.addEventListener('click', () => { activeCategory = 'All'; el('searchInput').value = ''; ['colorFilter','seasonFilter','styleFilter'].forEach(id => el(id).value = ''); renderCategories(); renderItems(); });
  el('mobileAdd')?.addEventListener('click', openAddForm);
  el('desktopAdd')?.addEventListener('click', openAddForm);
  el('quickActionToggle')?.addEventListener('click', event => {
    event.stopPropagation();
    const menu = el('quickActionMenu');
    if (!menu) return;
    const isCurrentlyOpen = menu.classList.contains('open');
    closeQuickActionMenu();
    if (!isCurrentlyOpen) {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      el('quickActionToggle')?.classList.add('open');
      el('quickActionToggle')?.setAttribute('aria-expanded', 'true');
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.quick-action-wrap')) closeQuickActionMenu();
  });
  document.querySelectorAll('[data-quick-action]').forEach(button => button.addEventListener('click', () => handleQuickAction(button.dataset.quickAction)));
  el('editProfile')?.addEventListener('click', openProfileEdit);
  el('followProfile')?.addEventListener('click', () => {
    const targetUsername = getTargetProfileUsername();
    if (normalizeUsername(targetUsername) === normalizeUsername(profile.username)) return;
    const following = setFollowingUser(targetUsername, !isFollowingUser(targetUsername));
    renderProfile();
    showToast(following ? '已追蹤這位衣友' : '已取消追蹤');
  });
  const backToExplore = el('backToExplore');
  if (backToExplore) {
    const requestedUser = new URLSearchParams(window.location.search).get('user');
    const isOtherProfile = requestedUser && normalizeUsername(requestedUser) !== normalizeUsername(profile.username);
    backToExplore.classList.toggle('is-hidden', !isOtherProfile);
    backToExplore.addEventListener('click', () => {
      if (document.referrer && document.referrer.includes('explore.html')) {
        window.history.back();
        return;
      }
      window.location.href = 'explore.html';
    });
  }
  el('closeProfileEdit')?.addEventListener('click', closeProfileEdit);
  el('cancelProfileEdit')?.addEventListener('click', closeProfileEdit);
  el('profileEditBackdrop')?.addEventListener('click', event => { if (event.target.id === 'profileEditBackdrop') closeProfileEdit(); });
  el('profileEditForm')?.addEventListener('submit', event => { event.preventDefault(); const username = el('editProfileUsername').value.trim(); profile.name = el('editProfileName').value.trim(); profile.username = username.startsWith('@') ? username : `@${username}`; profile.initials = el('editProfileInitials').value.trim().toUpperCase(); profile.bio = el('editProfileBio').value.trim(); saveState(); renderProfile(); renderExplore(); closeProfileEdit(); showToast('個人資料已更新'); });
  el('publicClosetToggle')?.addEventListener('click', () => { profile.public_closet = !profile.public_closet; saveState(); renderProfile(); showToast(profile.public_closet ? '衣櫥已公開' : '衣櫥已設為私人'); });
  el('exploreSearch')?.addEventListener('input', renderExplore);
  el('notificationButton')?.addEventListener('click', () => { notifications.forEach(notification => notification.read = true); saveState(); renderNotifications(); el('notificationBackdrop').classList.add('open'); });
  el('closeNotifications')?.addEventListener('click', closeNotificationPanel);
  el('notificationBackdrop')?.addEventListener('click', event => { if (event.target.id === 'notificationBackdrop') closeNotificationPanel(); });
  el('closeComments')?.addEventListener('click', closeComments);
  el('commentBackdrop')?.addEventListener('click', event => { if (event.target.id === 'commentBackdrop') closeComments(); });
  el('commentForm')?.addEventListener('submit', event => { event.preventDefault(); const post = ootdPosts.find(item => item.id === el('commentBackdrop').dataset.postId); const text = el('commentInput').value.trim(); if (!post || !text) return; const comment = { id:`comment-${Date.now()}`, user:profile.username, text }; post.commentList.push(comment); post.comments += 1; const isMyPost = normalizeUsername(post.username) === normalizeUsername(profile.username); const repliedToMyComment = post.commentList.some(entry => entry.id !== comment.id && normalizeUsername(entry.user) === normalizeUsername(profile.username)); if (isMyPost) addNotification(`${profile.username} 的貼文有了新留言。`, { target:'explore', type:'post-comment', postId:post.id, commentId:comment.id }); else if (repliedToMyComment) addNotification(`${profile.username} 回覆了你的留言。`, { target:'explore', type:'comment-reply', postId:post.id, commentId:comment.id, userId:profile.username }); saveState(); renderComments(post); renderExplore(); showToast('留言已送出'); });
  el('sosSearch')?.addEventListener('input', renderSosFeed);
  el('openSosForm')?.addEventListener('click', openSosForm);
  el('closeSosForm')?.addEventListener('click', closeSosForm);
  el('cancelSosForm')?.addEventListener('click', closeSosForm);
  el('sosForm')?.addEventListener('submit', event => { event.preventDefault(); const vibes = [...document.querySelectorAll('#sosForm .vibe-options input:checked')].map(input => input.value); if (!vibes.length) { showToast('至少選一個想呈現的風格'); return; } sosPosts.unshift({ id:`sos-${Date.now()}`, username:profile.username, initials:profile.initials, title:el('sosTitle').value.trim(), occasion:el('sosOccasion').value, weather:el('sosWeather').value, when_label:el('sosWhen').value, vibes, closet_count:items.length, details:el('sosDetails').value.trim() }); saveState(); closeSosForm(); renderSosFeed(); showToast('穿搭求救已發布'); });
  el('sosFormBackdrop')?.addEventListener('click', event => { if (event.target.id === 'sosFormBackdrop') closeSosForm(); });
  el('closeSuggestion')?.addEventListener('click', closeSuggestionForm);
  el('cancelSuggestion')?.addEventListener('click', closeSuggestionForm);
  el('suggestionForm')?.addEventListener('submit', event => { event.preventDefault(); const selectedIds = [...document.querySelectorAll('#suggestionItems input:checked')].map(input => input.value); if (!selectedIds.length) { showToast('至少選一件衣物來搭配'); return; } const sosId = el('suggestionBackdrop').dataset.sosId; outfitSuggestions.unshift({ id:`suggestion-${Date.now()}`, sos_id:sosId, user_id:profile.id, item_ids:selectedIds, message:el('suggestionMessage').value.trim(), hearts:0, created_at:new Date().toISOString() }); profile.helped += 1; saveState(); renderProfile(); addNotification('你的 SOS 穿搭建議已送出。', { target:'sos', type:'sos-suggestion', sosId }); closeSuggestionForm(); showToast('穿搭建議已送出，謝謝你的搭配'); });
  el('suggestionBackdrop')?.addEventListener('click', event => { if (event.target.id === 'suggestionBackdrop') closeSuggestionForm(); });
  document.querySelectorAll('[data-feed]').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('[data-feed]').forEach(item => item.classList.toggle('active', item === tab)); renderExplore(); }));
  el('openOotdForm')?.addEventListener('click', openOotdForm);
  el('closeOotdForm')?.addEventListener('click', closeOotdForm);
  el('cancelOotdForm')?.addEventListener('click', closeOotdForm);
  el('ootdPhotoFile')?.addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = loadEvent => { el('ootdPhoto').value = loadEvent.target.result; const preview = el('ootdPreview'); preview.src = loadEvent.target.result; preview.classList.add('visible'); }; reader.readAsDataURL(file); });
  el('ootdForm')?.addEventListener('submit', event => { event.preventDefault(); const image = el('ootdPhoto').value; if (!image) { showToast('請先上傳一張 OOTD 照片'); return; } const hashtags = el('ootdHashtags').value.split(/\s+/).filter(Boolean).map(tag => tag.startsWith('#') ? tag : `#${tag}`); const selectedItems = [...document.querySelectorAll('#ootdTagItems input:checked')].map(input => items.find(item => item.id === input.value)); const newPost = { id:`post-${Date.now()}`, username:profile.username, initials:profile.initials, image, caption:el('ootdCaption').value.trim(), wearing:selectedItems.map(item => item.name_zh || item.name), hashtags, likes:0, comments:0, liked:false, saved:false, following:true, commentList:[] }; ootdPosts.unshift(newPost); saveState(); closeOotdForm(); renderExplore(); renderProfileOotd(); addNotification('你的 OOTD 已成功發布。', { target:'explore', type:'post-published', postId:newPost.id }); showToast('OOTD 已發布'); });
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
    if (editingId) { Object.assign(items.find(item => item.id === editingId), data); showToast('衣櫥已更新'); } else { items.unshift({ ...data, id: crypto.randomUUID(), owner_id:'profile-01', name_zh:'', secondary_color:'', color_hex:'#D8D2C8', wear_count:0, last_worn:'', purchase_date:new Date().toISOString().slice(0,10), favorite:false, hidden:false, created_at:new Date().toISOString(), photo:data.photo || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85' }); showToast('已加入衣櫥'); }
    saveState();
    closeForm(); renderItems();
  });
  setActiveNav();
  renderNotifications();
}

document.addEventListener('DOMContentLoaded', () => {
  injectShell();
  setupSidebarToggle();
  bindCommonEvents();
  applyQuickActionFromUrl();
  applyNotificationDeepLinkFromUrl();
});

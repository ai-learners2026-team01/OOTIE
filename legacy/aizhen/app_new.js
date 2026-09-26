/* OOTie app_new.js
 * Companion extension for the immutable app_old.js.
 * Load AFTER app_old.js.
 */
(() => {
  'use strict';

  const DISUSED_DAYS_THRESHOLD = 90;
  const DISUSED_WEAR_COUNT_THRESHOLD = 2;
  const SUPABASE_CONFIG = {
    url: 'https://tmegwwbmnwzgnbgadxwp.supabase.co',
    anonKey: 'sb_publishable_TLCDkQkINOK9hBQE5h01-g_NuaQO7Fe'
  };
  window.supabaseClient = window.supabase && window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
    : null;

  const OOTieNewFeatures = window.OOTieNewFeatures = window.OOTieNewFeatures || {};
  const closetCharts = {};
  const colorDetailGroups = {
    '無彩色系': [['白色', 'color-white'], ['黑色', 'color-black'], ['炭灰色', 'color-charcoal'], ['米白色', 'color-beige']],
    '大地色系': [['卡其色', 'color-khaki'], ['奶茶色', 'color-milk-tea'], ['棕色', 'color-brown']],
    '清甜暖色系': [['暖橙色', 'color-orange'], ['奶油黃', 'color-butter'], ['櫻花粉', 'color-pink'], ['芥末黃', 'color-mustard']],
    '藍綠冷色系': [['丹寧藍', 'color-denim'], ['天藍色', 'color-sky'], ['軍綠色', 'color-olive'], ['酪梨綠', 'color-avocado']],
    '紫紅神秘系': [['酒紅色', 'color-wine'], ['薰衣草紫', 'color-lavender'], ['玫瑰紅', 'color-rose'], ['葡萄紫', 'color-grape']]
  };
  const legacyColorNames = { White: '白色', Black: '黑色', Blue: '丹寧藍', Beige: '米白色', Brown: '棕色', Gray: '炭灰色', Grey: '炭灰色' };

  function getSupabaseClient() {
    if (window.supabase && window.supabase.createClient) {
      return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
    return null;
  }

  async function syncClosetFromSupabase() {
    const dbItems = await loadItemsFromSupabase();
    if (Array.isArray(dbItems) && dbItems.length) {
      items = dbItems;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, profile, ootdPosts, notifications, sosPosts, outfitSuggestions }));
      } catch (e) { /* storage unavailable */ }
    }
    renderCategories();
    renderItems();
    updateClosetCountDisplay();
    await renderDisusedItems();
  }

  function normalizeDbItem(row = {}) {
    return {
      id: row.id || crypto.randomUUID(),
      owner_id: row.owner_id || 'profile-01',
      name: row.name || '',
      name_zh: row.name_zh || '',
      brand: row.brand || '',
      category: row.category || 'Tops',
      shape: row.shape || '',
      primary_color: row.primary_color || '',
      secondary_color: row.secondary_color || '',
      color_hex: row.color_hex || '#D8D2C8',
      style: row.style || 'Minimal',
      season: row.season || 'All year',
      photo: row.photo || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85',
      price: row.price === null || row.price === undefined || row.price === '' ? null : Number(row.price),
      wear_count: Number(row.wear_count || 0),
      last_worn: row.last_worn || '',
      purchase_date: row.purchase_date || '',
      favorite: row.favorite === true || row.favorite === 'true',
      hidden: row.hidden === true || row.hidden === 'true',
      notes: row.notes || '',
      created_at: row.created_at || new Date().toISOString()
    };
  }

  function calculateCostPerWear(item) {
    const price = Number(item?.price);
    const wearCount = Number(item?.wear_count || 0);
    if (!Number.isFinite(price) || price <= 0 || wearCount <= 0) return null;
    return Math.round(price / wearCount);
  }

  function renderFavoriteBrandOptions() {
    const container = el('favoriteBrandOptions');
    if (!container) return;
    const commonBrands = ['Uniqlo', 'ZARA', 'H&M', 'COS', 'Nike', 'Adidas'];
    const closetBrands = items.map(item => String(item.brand || '').trim()).filter(Boolean);
    const brands = [...new Map([...commonBrands, ...closetBrands].map(brand => [brand.toLowerCase(), brand])).values()];
    container.innerHTML = brands.map(brand => `<button class="favorite-brand-option" type="button" data-brand-value="${escapeHtml(brand)}">${escapeHtml(brand)}</button>`).join('');
    container.querySelectorAll('[data-brand-value]').forEach(button => button.addEventListener('click', () => {
      const brandInput = el('brand');
      if (brandInput) {
        brandInput.value = button.dataset.brandValue;
        brandInput.focus();
      }
    }));
  }

  async function loadItemsFromSupabase() {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not loaded. Falling back to local storage / default mock data.');
      return null;
    }

    try {
      const { data, error } = await client
        .from('ootie_clothing_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Unable to fetch clothing_items from Supabase:', error.message);
        return null;
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data.length ? data.map(normalizeDbItem) : [];
    } catch (error) {
      console.warn('Supabase fetch failed:', error);
      return null;
    }
  }

  function getDaysSinceLastWorn(lastWorn) {
    if (!lastWorn) return null;
    const wornDate = new Date(lastWorn);
    if (Number.isNaN(wornDate.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - wornDate.getTime()) / 86400000));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function isDisusedItem(item) {
    const wearCount = Number(item.wear_count || 0);
    const daysSinceLastWorn = getDaysSinceLastWorn(item.last_worn);
    return item.hidden !== true && item.hidden !== 'true' && (
      (daysSinceLastWorn !== null && daysSinceLastWorn > DISUSED_DAYS_THRESHOLD)
      || wearCount < DISUSED_WEAR_COUNT_THRESHOLD
      || (!item.last_worn && wearCount === 0)
    );
  }

  async function getDisusedItems() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('get_disused_items');
        if (!error && Array.isArray(data)) return data.map(row => ({
          ...normalizeDbItem(row),
          notes: items.find(item => item.id === row.id)?.notes || ''
        }));
        if (error) console.warn('Unable to fetch disused items from Supabase:', error.message);
      } catch (error) {
        console.warn('Disused items RPC failed:', error);
      }
    }
    return items.filter(isDisusedItem).sort((a, b) => {
      const aDays = getDaysSinceLastWorn(a.last_worn);
      const bDays = getDaysSinceLastWorn(b.last_worn);
      if (aDays === null && bDays !== null) return -1;
      if (aDays !== null && bDays === null) return 1;
      return (bDays || 0) - (aDays || 0);
    });
  }

  async function renderDisusedItems() {
    const grid = el('disusedGrid');
    if (!grid) return;
    const disusedItems = await getDisusedItems();
    const visibleItems = disusedItems.slice(0, 3);
    const count = el('disusedCount');
    const moreLink = el('disusedMoreLink');
    if (count) count.textContent = disusedItems.length ? `${disusedItems.length} 件需要關心` : '';
    if (moreLink) moreLink.style.display = disusedItems.length > 3 ? 'inline-block' : 'none';
    if (!disusedItems.length) {
      grid.innerHTML = '<div class="disused-empty">太棒了！你的每件衣服都很常穿，衣櫥利用率很高！</div>';
      return;
    }
    grid.innerHTML = visibleItems.map((item, index) => {
      const displayName = item.name_zh || item.name || '這件單品';
      const days = getDaysSinceLastWorn(item.last_worn);
      const message = item.wear_count === 0 && !item.last_worn
        ? '你從來沒穿過耶！'
        : days !== null
          ? `已經 ${days} 天沒穿囉！`
          : `只穿過 ${Number(item.wear_count || 0)} 次。`;
      const marked = String(item.notes || '').includes('[待出清]');
      return `<article class="disused-card" style="animation-delay:${index * 45}ms"><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(displayName)}" loading="lazy"><div class="disused-card-body"><h3>${escapeHtml(displayName)}</h3><p>${message}</p><span class="disused-meta">穿著 ${Number(item.wear_count || 0)} 次${days !== null ? ` · ${days} 天前` : ' · 尚未穿過'}</span><div class="disused-actions"><button class="primary" type="button" data-disused-sos="${escapeHtml(item.id)}">丟到 SOS 求救</button><button class="secondary ${marked ? 'is-marked' : ''}" type="button" data-clearance-item="${escapeHtml(item.id)}" ${marked ? 'disabled' : ''}>${marked ? '已標記待出清' : '標記為考慮出清'}</button></div></div></article>`;
    }).join('');
    grid.querySelectorAll('[data-disused-sos]').forEach(button => button.addEventListener('click', () => {
      window.location.href = `sos.html?item_id=${encodeURIComponent(button.dataset.disusedSos)}`;
    }));
    grid.querySelectorAll('[data-clearance-item]').forEach(button => button.addEventListener('click', () => markItemForClearance(button.dataset.clearanceItem)));
  }

  async function renderDisusedRanking() {
    const list = el('disusedRanking');
    if (!list) return;
    const disusedItems = await getDisusedItems();
    if (!disusedItems.length) {
      list.innerHTML = '<div class="disused-empty">太棒了！你的每件衣服都很常穿，衣櫥利用率很高！</div>';
      return;
    }
    list.innerHTML = disusedItems.map((item, index) => {
      const displayName = item.name_zh || item.name || '未命名單品';
      const days = getDaysSinceLastWorn(item.last_worn);
      const message = item.wear_count === 0 && !item.last_worn
        ? '你從來沒穿過耶！'
        : days !== null
          ? `已經 ${days} 天沒穿囉！`
          : `只穿過 ${Number(item.wear_count || 0)} 次。`;
      const rank = index + 1;
      const rankLabel = rank === 1 ? '♛' : rank;
      return `<article class="disused-ranking-item"><span class="disused-rank rank-top-${Math.min(rank, 5)}" aria-label="第 ${rank} 名">${rankLabel}</span><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(displayName)}" loading="lazy"><div class="disused-ranking-copy"><h3>${escapeHtml(displayName)}</h3><p>${message}</p><span>穿著 ${Number(item.wear_count || 0)} 次${days !== null ? ` · ${days} 天前` : ' · 尚未穿過'}</span></div></article>`;
    }).join('');
  }

  async function markItemForClearance(id) {
    const item = items.find(entry => entry.id === id);
    if (!item || String(item.notes || '').includes('[待出清]')) return;
    item.notes = `${item.notes ? `${item.notes.trim()} ` : ''}[待出清]`;
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('ootie_clothing_items').update({ notes: item.notes }).eq('id', id);
      if (error) {
        console.warn('Clearance note update failed:', error.message);
        showToast('標記失敗，請稍後再試');
        return;
      }
    }
    saveState();
    await renderDisusedItems();
    showToast('已標記為考慮出清');
  }

  function aggregateClosetStats(sourceItems) {
    const visibleItems = sourceItems.filter(item => item.hidden !== true && item.hidden !== 'true');
    const colorFamilyMap = {
      '無彩色系': '無彩色系', '白色': '無彩色系', '黑色': '無彩色系', '炭灰色': '無彩色系', '米白色': '無彩色系', '白色系': '無彩色系', '黑色系': '無彩色系', '灰色系': '無彩色系',
      '大地色系': '大地色系', '卡其色': '大地色系', '奶茶色': '大地色系', '棕色': '大地色系', '米色': '大地色系', '棕色系': '大地色系', '米色系': '大地色系',
      '清甜暖色系': '清甜暖色系', '暖橙色': '清甜暖色系', '奶油黃': '清甜暖色系', '櫻花粉': '清甜暖色系', '芥末黃': '清甜暖色系',
      '藍綠冷色系': '藍綠冷色系', '丹寧藍': '藍綠冷色系', '天藍色': '藍綠冷色系', '軍綠色': '藍綠冷色系', '酪梨綠': '藍綠冷色系', '藍色系': '藍綠冷色系',
      '紫紅神秘系': '紫紅神秘系', '酒紅色': '紫紅神秘系', '薰衣草紫': '紫紅神秘系', '玫瑰紅': '紫紅神秘系', '葡萄紫': '紫紅神秘系'
    };
    const groupBy = (field, includeColor) => Object.values(visibleItems.reduce((groups, item) => {
      const value = field === 'secondary_color' ? colorFamilyMap[String(item[field] || '').trim()] : item[field];
      const groupValue = value || '未分類';
      if (!groups[groupValue]) groups[groupValue] = { [field === 'primary_color' ? 'color' : field]: groupValue, count: 0 };
      groups[groupValue].count += 1;
      if (includeColor && !groups[groupValue].color_hex) groups[groupValue].color_hex = item.color_hex || '#D8D2C8';
      return groups;
    }, {}));
    return { colorStats: groupBy('primary_color', true), colorFamilyStats: groupBy('secondary_color', false), styleStats: groupBy('style', false), categoryStats: groupBy('category', false) };
  }

  async function getClosetStats() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('get_closet_stats');
        const stats = typeof data === 'string' ? JSON.parse(data) : data;
        if (!error && stats && ['colorStats', 'colorFamilyStats', 'styleStats', 'categoryStats'].every(key => Array.isArray(stats[key]))) {
          const hasStats = Object.values(stats).some(entries => entries.some(entry => Number(entry.count) > 0));
          if (hasStats) return stats;

          const latestItems = await loadItemsFromSupabase();
          if (Array.isArray(latestItems) && latestItems.length) {
            items = latestItems;
            return aggregateClosetStats(items);
          }
          return stats;
        }
        if (error) console.warn('Unable to fetch closet stats from Supabase:', error.message);
      } catch (error) {
        console.warn('Closet stats RPC failed:', error);
      }
    }
    return aggregateClosetStats(items);
  }

  function destroyClosetCharts() {
    ['colorStatsChart', 'colorFamilyStatsChart', 'styleStatsChart', 'categoryStatsChart'].forEach(chartId => {
      if (closetCharts[chartId]) closetCharts[chartId].destroy();
      delete closetCharts[chartId];
    });
  }

  function renderStatsChart(canvasId, emptyId, entries, type, labelsKey, colors) {
    const canvas = el(canvasId);
    const empty = el(emptyId);
    if (!canvas || !empty) return;
    const hasData = Array.isArray(entries) && entries.some(entry => Number(entry.count) > 0);
    canvas.style.display = hasData ? 'block' : 'none';
    empty.style.display = hasData ? 'none' : 'grid';
    if (!hasData || !window.Chart) return;
    const chartColors = colors && colors.length ? colors : ['#A8B5A2', '#D9C8B8', '#667361', '#C7B9A5', '#A65F5B', '#63778A'];
    const colorFamilyColors = { '無彩色系': '#D8D5CB', '大地色系': '#C8A98A', '清甜暖色系': '#E58B4A', '藍綠冷色系': '#6F9A8A', '紫紅神秘系': '#8C5A78' };
    closetCharts[canvasId] = new window.Chart(canvas, {
      type,
      data: { labels: entries.map(entry => labels[entry[labelsKey]] || entry[labelsKey]), datasets: [{ data: entries.map(entry => entry.count), backgroundColor: entries.map((entry, index) => entry.color_hex || (canvasId === 'colorFamilyStatsChart' ? colorFamilyColors[entry[labelsKey]] : chartColors[index % chartColors.length])), borderColor: '#F8F7F3', borderWidth: 3, borderRadius: type === 'bar' ? 7 : 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: canvasId !== 'colorStatsChart' && canvasId !== 'colorFamilyStatsChart' && type !== 'bar', position: 'bottom', labels: { color: '#77766F', font: { family: 'DM Sans', size: 11 }, padding: 14, boxWidth: 12 } }, tooltip: { callbacks: { label: context => ` ${context.raw} 件` } } }, scales: type === 'bar' ? { x: { grid: { display: false }, ticks: { color: '#77766F', font: { family: 'DM Sans', size: 10 } } }, y: { beginAtZero: true, ticks: { precision: 0, color: '#77766F', font: { family: 'DM Sans', size: 10 } }, grid: { color: '#E7E3DC' } } } : {} }
    });
  }

  async function loadAndRenderClosetStats() {
    if (!el('colorStatsChart')) return;
    const stats = await getClosetStats();
    destroyClosetCharts();
    renderStatsChart('colorStatsChart', 'colorStatsEmpty', stats.colorStats, 'doughnut', 'color');
    renderStatsChart('colorFamilyStatsChart', 'colorFamilyStatsEmpty', stats.colorFamilyStats, 'doughnut', 'secondary_color', ['#D8D5CB', '#C8A98A', '#E58B4A', '#6F9A8A', '#8C5A78']);
    renderStatsChart('styleStatsChart', 'styleStatsEmpty', stats.styleStats, 'bar', 'style');
    renderStatsChart('categoryStatsChart', 'categoryStatsEmpty', stats.categoryStats, 'doughnut', 'category');
  }

  async function getBrandStats() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('get_brand_stats');
        if (!error && Array.isArray(data)) return data.map(row => ({
          brand: row.brand || '未分類',
          count: Number(row.item_count || 0),
          totalWearCount: Number(row.total_wear_count || 0)
        }));
        if (error) console.warn('Unable to fetch brand stats from Supabase:', error.message);
      } catch (error) {
        console.warn('Brand stats RPC failed:', error);
      }
    }
    const groups = {};
    items.filter(item => item.hidden !== true && item.hidden !== 'true').forEach(item => {
      const displayBrand = String(item.brand || '').trim();
      const brandKey = displayBrand.toLowerCase() || '未分類';
      if (!groups[brandKey]) groups[brandKey] = { brand: displayBrand || '未分類', count: 0, totalWearCount: 0 };
      groups[brandKey].count += 1;
      groups[brandKey].totalWearCount += Number(item.wear_count || 0);
    });
    return Object.values(groups).sort((a, b) => b.count - a.count || b.totalWearCount - a.totalWearCount).slice(0, 10);
  }

  async function renderBrandStats() {
    const canvas = el('brandStatsChart');
    const empty = el('brandStatsEmpty');
    const highlight = el('brandStatsHighlight');
    if (!canvas || !empty) return;
    const stats = await getBrandStats();
    const namedStats = stats.filter(entry => entry.brand !== '未分類');
    const hasItems = stats.some(entry => entry.count > 0);
    const unnamedCount = stats.find(entry => entry.brand === '未分類')?.count || 0;
    const namedCount = namedStats.reduce((total, entry) => total + entry.count, 0);
    const hasBrandData = namedStats.length > 0 && unnamedCount < namedCount;
    closetCharts.brandStatsChart?.destroy();
    delete closetCharts.brandStatsChart;
    canvas.style.display = hasBrandData ? 'block' : 'none';
    empty.style.display = hasBrandData ? 'none' : 'grid';
    empty.textContent = hasItems ? '幫衣服補上品牌資訊，看看你的愛用品牌排行吧！' : '尚無資料，快去新增你的第一件衣服吧！';
    if (highlight) {
      const mostWorn = [...namedStats].sort((a, b) => b.totalWearCount - a.totalWearCount)[0];
      highlight.textContent = mostWorn && mostWorn.totalWearCount > 0 ? `你最常穿的品牌是 ${mostWorn.brand}，共有 ${mostWorn.count} 件單品\n總共穿了 ${mostWorn.totalWearCount} 次！` : '';
    }
    if (!hasBrandData || !window.Chart) return;
    closetCharts.brandStatsChart = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: namedStats.map(entry => entry.brand),
        datasets: [{ data: namedStats.map(entry => entry.count), backgroundColor: '#A8B5A2', borderRadius: 7, borderSkipped: false }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` ${context.raw} 件` } } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0, color: '#77766F', font: { family: 'DM Sans', size: 10 } }, grid: { color: '#E7E3DC' } }, y: { ticks: { color: '#77766F', font: { family: 'DM Sans', size: 10 } }, grid: { display: false } } }
      }
    });
  }

  async function getTopWornItems() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('get_top_worn_items');
        if (!error && Array.isArray(data)) return data.map(row => ({
          id: row.id,
          name: row.name || '',
          name_zh: row.name_zh || '',
          photo: row.photo || '',
          wear_count: Number(row.wear_count || 0)
        }));
        if (error) console.warn('Unable to fetch top worn items from Supabase:', error.message);
      } catch (error) {
        console.warn('Top worn items RPC failed:', error);
      }
    }
    return [...items]
      .filter(item => item.hidden !== true && item.hidden !== 'true')
      .sort((a, b) => Number(b.wear_count || 0) - Number(a.wear_count || 0));
  }

  async function renderTopWornItems() {
    const list = el('topWornList');
    if (!list) return;
    const topItems = await getTopWornItems();
    if (!topItems.some(item => Number(item.wear_count || 0) > 0)) {
      list.innerHTML = '<div class="top-worn-empty">還沒有穿搭紀錄，開始記錄你的第一次穿搭吧！</div>';
      return;
    }
    list.innerHTML = topItems.map((item, index) => {
      const name = item.name_zh || item.name || '未命名單品';
      const rank = index + 1;
      const rankLabel = rank === 1 ? '♛' : rank;
      return `<article class="top-worn-item ${rank === 1 ? 'is-champion' : ''}"><span class="top-worn-rank rank-top-${Math.min(rank, 5)}" aria-label="第 ${rank} 名">${rankLabel}</span><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(name)}" loading="lazy"><div class="top-worn-copy"><h3>${escapeHtml(name)}</h3><p>穿了 ${Number(item.wear_count || 0)} 次</p></div></article>`;
    }).join('');
  }

  async function getCostPerWearRanking() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('get_cost_per_wear_ranking');
        if (!error && Array.isArray(data)) return data.map(row => ({
          id: row.id,
          name: row.name || '',
          name_zh: row.name_zh || '',
          photo: row.photo || '',
          price: Number(row.price),
          wear_count: Number(row.wear_count || 0),
          cost_per_wear: Number(row.cost_per_wear)
        }));
        if (error) console.warn('Unable to fetch cost-per-wear ranking from Supabase:', error.message);
      } catch (error) {
        console.warn('Cost-per-wear ranking RPC failed:', error);
      }
    }
    return [...items]
      .filter(item => item.hidden !== true && item.hidden !== 'true' && calculateCostPerWear(item) !== null)
      .sort((a, b) => calculateCostPerWear(a) - calculateCostPerWear(b))
      .map(item => ({ ...item, cost_per_wear: calculateCostPerWear(item) }));
  }

  function getYearlySummary(year) {
    const targetYear = Number(year);
    const visibleItems = items.filter(item => item.hidden !== true && item.hidden !== 'true');

    // 取得該年購入的單品
    const purchasedInYear = visibleItems.filter(item => {
      if (!item.purchase_date) return false;
      const d = new Date(item.purchase_date);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === targetYear;
    });

    // 取得該年最後穿著的單品
    const wornInYear = visibleItems.filter(item => {
      if (!item.last_worn) return false;
      const d = new Date(item.last_worn);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === targetYear;
    });

    // 1. 年度最愛顏色 (購入單品 primary_color)
    const colorCounts = {};
    const colorWearSums = {};
    purchasedInYear.forEach(item => {
      const c = String(item.primary_color || '').trim();
      if (!c) return;
      colorCounts[c] = (colorCounts[c] || 0) + 1;
      colorWearSums[c] = (colorWearSums[c] || 0) + Number(item.wear_count || 0);
    });
    const topColorEntry = Object.entries(colorCounts).sort((a, b) => b[1] - a[1] || (colorWearSums[b[0]] || 0) - (colorWearSums[a[0]] || 0))[0];
    const topColor = topColorEntry ? { name: topColorEntry[0], count: topColorEntry[1] } : null;

    // 2. 年度最愛風格 (購入單品 style)
    const styleCounts = {};
    purchasedInYear.forEach(item => {
      const s = String(item.style || '').trim();
      if (!s) return;
      styleCounts[s] = (styleCounts[s] || 0) + 1;
    });
    const topStyleEntry = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];
    const topStyle = topStyleEntry ? { name: labels[topStyleEntry[0]] || topStyleEntry[0], count: topStyleEntry[1] } : null;

    // 3. 年度最常穿單品 (依 last_worn 年度篩選，按 wear_count 排序)
    const mostWornItem = [...wornInYear].sort((a, b) => Number(b.wear_count || 0) - Number(a.wear_count || 0))[0] || null;

    // 4. 年度最愛品牌 (購入單品 brand，排除空值)
    const brandCounts = {};
    purchasedInYear.forEach(item => {
      const b = String(item.brand || '').trim();
      if (!b) return;
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    });
    const topBrandEntry = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0];
    const topBrand = topBrandEntry ? { name: topBrandEntry[0], count: topBrandEntry[1] } : null;

    return {
      year: targetYear,
      totalPurchased: purchasedInYear.length,
      topColor,
      topStyle,
      mostWornItem: mostWornItem ? {
        name: mostWornItem.name_zh || mostWornItem.name || '未命名單品',
        wearCount: Number(mostWornItem.wear_count || 0)
      } : null,
      topBrand
    };
  }

  function renderYearlySummary(targetYear) {
    const select = el('yearlySummarySelect');
    const tbody = el('yearlySummaryBody');
    const quote = el('yearlySummaryQuote');
    const wrap = el('yearlySummaryTableWrap');
    const empty = el('yearlySummaryEmpty');
    if (!tbody || !quote) return;

    // 收集現有資料的所有年份
    const yearsSet = new Set();
    items.forEach(item => {
      if (item.purchase_date) {
        const y = new Date(item.purchase_date).getFullYear();
        if (!Number.isNaN(y)) yearsSet.add(y);
      }
      if (item.last_worn) {
        const y = new Date(item.last_worn).getFullYear();
        if (!Number.isNaN(y)) yearsSet.add(y);
      }
    });
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    const sortedYears = [...yearsSet].sort((a, b) => b - a);

    if (select && select.options.length === 0) {
      select.innerHTML = sortedYears.map(y => `<option value="${y}">${y} 年</option>`).join('');
      select.addEventListener('change', () => renderYearlySummary(select.value));
    }

    const selectedYear = Number(targetYear || select?.value || sortedYears[0]);
    if (select) select.value = selectedYear;

    const summary = getYearlySummary(selectedYear);
    const hasData = summary.topColor || summary.topStyle || summary.mostWornItem || summary.topBrand;

    if (!hasData) {
      if (wrap) wrap.style.display = 'none';
      if (empty) empty.style.display = 'grid';
      return;
    }

    if (wrap) wrap.style.display = 'flex';
    if (empty) empty.style.display = 'none';

    const rows = [
      {
        icon: '🏆 年度最愛顏色',
        result: summary.topColor ? summary.topColor.name : '今年還沒有相關紀錄',
        proof: summary.topColor ? `共購入 ${summary.topColor.count} 件` : '無數據'
      },
      {
        icon: '🏆 年度最愛風格',
        result: summary.topStyle ? summary.topStyle.name : '今年還沒有相關紀錄',
        proof: summary.topStyle ? `共購入 ${summary.topStyle.count} 件` : '無數據'
      },
      {
        icon: '🏆 年度最常穿單品',
        result: summary.mostWornItem ? summary.mostWornItem.name : '今年還沒有相關紀錄',
        proof: summary.mostWornItem ? `共穿著 ${summary.mostWornItem.wearCount} 次` : '無數據'
      },
      {
        icon: '🏆 年度最愛品牌',
        result: summary.topBrand ? summary.topBrand.name : '今年還沒有相關紀錄',
        proof: summary.topBrand ? `共購入 ${summary.topBrand.count} 件` : '無數據'
      }
    ];

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.icon)}</td>
        <td>${escapeHtml(r.result)}</td>
        <td>${escapeHtml(r.proof)}</td>
      </tr>
    `).join('');

    const colorText = summary.topColor ? `${summary.topColor.name}的` : '';
    const styleText = summary.topStyle ? `${summary.topStyle.name}風格` : '風格多樣的';
    const brandText = summary.topBrand ? `最愛的品牌是 ${summary.topBrand.name}` : '嘗試了許多不同品牌';
    const itemText = summary.mostWornItem ? `而穿最兇的單品是${summary.mostWornItem.name}！` : '目前還沒有特別頻繁穿著的單品。';

    let quoteText = `「你 ${selectedYear} 年最常買${colorText}${styleText}衣服，${brandText}，${itemText}」`;
    if (summary.totalPurchased > 0 && summary.totalPurchased < 3) {
      quoteText += `<span class="yearly-summary-warning">⚠️ 提醒：${selectedYear} 年購入單品少於 3 件，統計僅供參考。</span>`;
    }
    quote.innerHTML = quoteText;
  }

  async function renderCostRanking() {
    const list = el('costRanking');
    if (!list) return;
    const ranking = await getCostPerWearRanking();
    if (!ranking.length) {
      list.innerHTML = '<div class="cost-ranking-empty">還沒有單品填寫購買價格，去衣櫥補上價格，看看你最划算的衣服是哪一件！<br><a href="closet.html">前往衣櫥編輯 →</a></div>';
      return;
    }
    list.innerHTML = ranking.map((item, index) => {
      const name = item.name_zh || item.name || '未命名單品';
      const rank = index + 1;
      const rankLabel = rank === 1 ? '♛' : rank;
      return `<article class="cost-ranking-item"><span class="cost-ranking-rank rank-top-${Math.min(rank, 5)}" aria-label="第 ${rank} 名">${rankLabel}</span><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(name)}" loading="lazy"><div class="cost-ranking-copy"><h3>${escapeHtml(name)}</h3><p>這件你穿了 ${Number(item.wear_count || 0)} 次<br>平均穿一次只要 ${Number(item.cost_per_wear || 0)} 元！</p><span>購買價格 ${Number(item.price || 0)} 元</span></div></article>`;
    }).join('');
  }

  function normalizeFilterValue(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function matchesFilterValue(itemValue, selectedValue) {
    if (!selectedValue) return true;
    const itemKey = normalizeFilterValue(itemValue);
    const selectedKey = normalizeFilterValue(selectedValue);
    if (itemKey === selectedKey) return true;
    return normalizeFilterValue(labels[itemValue]) === selectedKey || normalizeFilterValue(labels[selectedValue]) === itemKey;
  }

  function updateClosetCountDisplay() {
    const countLabel = el('itemCount');
    if (!countLabel) return;
    const filtered = getFilteredItems();
    countLabel.textContent = `${filtered.length} 件單品`;
  }

  function getColorFamilyForPrimaryColor(color) {
    const normalizedColor = legacyColorNames[color] || color;
    return Object.entries(colorDetailGroups).find(([, details]) => details.some(([name]) => name === normalizedColor))?.[0] || '';
  }

  function renderColorDetailOptions(family) {
    const group = el('colorDetailGroup');
    const options = el('colorDetailOptions');
    if (!group || !options) return;
    const details = colorDetailGroups[family] || [];
    group.hidden = !details.length;
    options.innerHTML = details.map(([name, swatch]) => `<button type="button" class="color-filter-option" data-color-detail="${name}" role="option" aria-selected="false"><span class="color-swatch ${swatch}"></span>${name}</button>`).join('');
  }

  function syncColorFamilyFromPrimaryColor() {
    const primaryColor = el('primary_color');
    const secondaryColor = el('secondary_color');
    if (primaryColor && secondaryColor) secondaryColor.value = getColorFamilyForPrimaryColor(primaryColor.value);
  }

  /* -------------------------------------------------------------
   * Compatibility wrappers / adapters.
   * app_old.js remains untouched. These adapters are installed before
   * app_old.js's DOMContentLoaded handler runs.
   * ------------------------------------------------------------- */

  const original = {
    injectShell: window.injectShell,
    openSosForm: window.openSosForm,
    getFilteredItems: window.getFilteredItems,
    renderItems: window.renderItems,
    openDetail: window.openDetail,
    openAddForm: window.openAddForm,
    openEditForm: window.openEditForm,
    deleteItem: window.deleteItem
  };

  function installShellWrapper() {
    if (typeof original.injectShell !== 'function') return;
    window.injectShell = function () {
      if (document.querySelector('.sidebar') || document.querySelector('.topbar') || document.querySelector('.bottom-nav')) return;
      original.injectShell.apply(this, arguments);
      const nav = document.querySelector('.sidebar .nav');
      if (nav && !nav.querySelector('[data-page="stats"]')) {
        nav.insertAdjacentHTML('beforeend', '<a data-page="stats" href="stats.html"><span class="nav-icon">▥</span>衣櫥統計</a>');
      }
    };
  }

  function installSosWrapper() {
    window.openSosForm = function (itemId = '') {
      const form = el('sosForm');
      const backdrop = el('sosFormBackdrop');
      if (!form || !backdrop) return;
      form.reset();
      const item = itemId ? items.find(entry => entry.id === itemId) : null;
      const idField = el('sosItemId');
      const context = el('sosItemContext');
      if (idField) idField.value = item ? item.id : '';
      if (context) context.textContent = item ? `已帶入單品：${item.name_zh || item.name}` : '';
      if (item) {
        const title = el('sosTitle');
        const details = el('sosDetails');
        if (title) title.value = `這件${item.name_zh || item.name}，想請衣友幫忙搭配`;
        if (details) details.value = `我很少穿這件${item.name_zh || item.name}，想請衣友幫我找找適合的搭配。`;
      }
      backdrop.classList.add('open');
    };
  }

  function installFilterWrapper() {
    window.getFilteredItems = function () {
      const query = normalizeFilterValue(el('searchInput')?.value);
      const color = el('colorFilter')?.value || '';
      const colorFamily = el('colorFamilyFilter')?.value || '';
      const season = el('seasonFilter')?.value || '';
      const style = el('styleFilter')?.value || '';
      return items.filter(item => {
        if (item.hidden === true || item.hidden === 'true') return false;
        const searchable = normalizeFilterValue(`${item.name} ${item.name_zh} ${item.brand} ${item.category}`);
        return (!query || searchable.includes(query))
          && (activeCategory === 'All' || matchesFilterValue(item.category, activeCategory))
          && matchesFilterValue(item.secondary_color, colorFamily)
          && matchesFilterValue(item.primary_color, color)
          && matchesFilterValue(item.season, season)
          && matchesFilterValue(item.style, style);
      });
    };
  }

  function installDetailWrapper() {
    if (typeof original.openDetail !== 'function') return;
    window.openDetail = function (id) {
      original.openDetail.apply(this, arguments);
      const item = items.find(entry => entry.id === id);
      const fields = el('detailModal')?.querySelector('.detail-fields');
      if (!item || !fields) return;

      const rows = [...fields.children];
      if (rows[1]) {
        const dt = rows[1].querySelector('dt');
        const dd = rows[1].querySelector('dd');
        if (dt) dt.textContent = '色系';
        if (dd) dd.textContent = labels[item.secondary_color] || item.secondary_color || '未設定';
      }
      if (rows[2]) {
        const dt = rows[2].querySelector('dt');
        const dd = rows[2].querySelector('dd');
        if (dt) dt.textContent = '主要顏色';
        if (dd) dd.textContent = labels[item.primary_color] || item.primary_color || '未設定';
      }
      const brandRow = rows.find(row => row.querySelector('dt')?.textContent === '品牌');
      if (brandRow) brandRow.remove();

      const price = item.price === null || item.price === undefined || item.price === '' ? null : Number(item.price);
      if (Number.isFinite(price)) {
        const priceRow = document.createElement('div');
        priceRow.innerHTML = `<dt>價格</dt><dd>${price} 元</dd>`;
        fields.appendChild(priceRow);
      }
    };
  }

  function installFormOpenWrappers() {
    if (typeof original.openAddForm === 'function') {
      window.openAddForm = function () {
        const result = original.openAddForm.apply(this, arguments);
        renderFavoriteBrandOptions();
        syncColorFamilyFromPrimaryColor();
        return result;
      };
    }
    if (typeof original.openEditForm === 'function') {
      window.openEditForm = function (id) {
        const item = items.find(entry => entry.id === id);
        const result = original.openEditForm.apply(this, arguments);
        if (item) {
          const primaryField = el('primary_color');
          if (primaryField) primaryField.value = legacyColorNames[item.primary_color] || item.primary_color || '';
          const nameField = el('name');
          if (nameField && !nameField.value) nameField.value = item.name_zh || item.name || '';
          const photoField = el('photo');
          if (photoField) photoField.value = item.photo || '';
          const preview = el('uploadPreview');
          if (preview && item.photo) {
            preview.src = item.photo;
            preview.classList.add('visible');
          }
        }
        syncColorFamilyFromPrimaryColor();
        renderFavoriteBrandOptions();
        return result;
      };
    }
  }

  /* Supabase-backed deletion must happen before the local deletion.
   * This cannot safely be layered after the old deleteItem because the old
   * function removes the item immediately and has no rollback path.
   */
  function installDeleteOverride() {
    window.deleteItem = async function (id) {
      const item = items.find(entry => entry.id === id);
      if (!item || !confirm(`確定要將「${item.name_zh || item.name}」從衣櫥刪除嗎？`)) return;
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('ootie_clothing_items').delete().eq('id', id);
        if (error) {
          console.warn('Delete failed:', error.message);
          showToast('刪除失敗，請稍後再試');
          return;
        }
      }
      items = items.filter(entry => entry.id !== id);
      saveState();
      closeDetail();
      renderItems();
      showToast('單品已從衣櫥移除');
    };
  }

  const colorHexValues = {
    '白色': '#F5F3EC', '黑色': '#242321', '炭灰色': '#55565A', '米白色': '#F1EAD9',
    '卡其色': '#C2A878', '奶茶色': '#C8A98A', '棕色': '#806454',
    '暖橙色': '#E58B4A', '奶油黃': '#F2D77B', '櫻花粉': '#F4C2C2', '芥末黃': '#C49A28',
    '丹寧藍': '#3B5998', '天藍色': '#83C5E8', '軍綠色': '#4B5320', '酪梨綠': '#8A9A5B',
    '酒紅色': '#722F37', '薰衣草紫': '#B7A4D4', '玫瑰紅': '#C85A70', '葡萄紫': '#653B83'
  };

  function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
  }

  function getEffectiveOwnerId() {
    if (typeof profile !== 'undefined' && profile && isValidUuid(profile.id)) {
      return profile.id;
    }
    return '2814dc14-61c5-4213-98fd-cc08a9be46bf';
  }

  function buildNewItemPayload(data) {
    const rawPrice = String(data.price || '').trim();
    if (rawPrice && (!Number.isFinite(Number(rawPrice)) || Number(rawPrice) <= 0)) {
      showToast('購買價格請輸入正數');
      return null;
    }
    const name = String(data.name || '').trim();
    const nameZh = String(data.name_zh || '').trim() || name;
    const primaryColor = String(data.primary_color || '').trim();
    const secondaryColor = getColorFamilyForPrimaryColor(primaryColor) || String(data.secondary_color || '').trim();
    const colorHex = colorHexValues[primaryColor] || String(data.color_hex || '#D8D2C8').trim();

    return {
      owner_id: getEffectiveOwnerId(),
      name: name || nameZh || '未命名單品',
      name_zh: nameZh || name || '未命名單品',
      brand: String(data.brand || '').trim(),
      category: data.category || 'Tops',
      shape: String(data.shape || '').trim(),
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      color_hex: colorHex,
      style: data.style || 'Minimal',
      season: data.season || 'All year',
      photo: data.photo || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85',
      price: rawPrice ? Number(rawPrice) : null,
      wear_count: 0,
      last_worn: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      favorite: false,
      hidden: false,
      notes: String(data.notes || '').trim(),
      created_at: new Date().toISOString()
    };
  }

  async function handleNewItemFormSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const data = Object.fromEntries(new FormData(event.target));
    delete data.photoFile;
    if (!editingId && !data.photo) {
      showToast('請先上傳單品照片');
      return;
    }
    const payload = buildNewItemPayload(data);
    if (!payload) return;

    const client = getSupabaseClient();
    if (editingId) {
      if (client && isValidUuid(editingId)) {
        const updatePayload = {
          name: payload.name,
          name_zh: payload.name_zh,
          brand: payload.brand,
          category: payload.category,
          shape: payload.shape,
          primary_color: payload.primary_color,
          secondary_color: payload.secondary_color,
          color_hex: payload.color_hex,
          style: payload.style,
          season: payload.season,
          photo: payload.photo,
          price: payload.price,
          notes: payload.notes
        };
        const { error } = await client.from('ootie_clothing_items').update(updatePayload).eq('id', editingId);
        if (error) {
          console.warn('Update failed:', error.message);
          showToast('更新失敗：' + (error.message || '請稍後再試'));
          return;
        }
      }
      const target = items.find(item => item.id === editingId);
      if (target) Object.assign(target, { ...payload, id: editingId, name_zh: payload.name_zh || payload.name });
      showToast('衣櫥已更新');
    } else {
      let insertedItem = null;
      if (client) {
        const { data: insertedRows, error } = await client.from('ootie_clothing_items').insert([payload]).select();
        if (error) {
          console.warn('Insert failed:', error.message);
          showToast('新增失敗：' + (error.message || '請稍後再試'));
          return;
        }
        insertedItem = insertedRows && insertedRows[0] ? normalizeDbItem(insertedRows[0]) : null;
      }
      if (insertedItem) {
        items.unshift(insertedItem);
      } else {
        items.unshift({ ...payload, id: crypto.randomUUID(), name_zh: payload.name_zh || payload.name });
      }
      showToast('已加入衣櫥');
    }
    saveState();
    closeForm();
    renderItems();
  }

  function handleNewSosFormSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const vibes = [...document.querySelectorAll('#sosForm .vibe-options input:checked')].map(input => input.value);
    if (!vibes.length) {
      showToast('至少選一個想呈現的風格');
      return;
    }
    const itemId = el('sosItemId')?.value || '';
    sosPosts.unshift({
      id: `sos-${Date.now()}`,
      username: profile.username,
      initials: profile.initials,
      title: el('sosTitle').value.trim(),
      occasion: el('sosOccasion').value,
      weather: el('sosWeather').value,
      when_label: el('sosWhen').value,
      vibes,
      closet_count: items.length,
      details: el('sosDetails').value.trim(),
      item_ids: itemId ? [itemId] : []
    });
    saveState();
    closeSosForm();
    renderSosFeed();
    showToast('穿搭求救已發布');
  }

  function installSubmitAdapters() {
    const sosForm = el('sosForm');
    if (sosForm && !sosForm.dataset.newSubmitAdapter) {
      sosForm.dataset.newSubmitAdapter = '1';
      sosForm.addEventListener('submit', handleNewSosFormSubmit, true);
    }
    const itemForm = el('itemForm');
    if (itemForm && !itemForm.dataset.newSubmitAdapter) {
      itemForm.dataset.newSubmitAdapter = '1';
      itemForm.addEventListener('submit', handleNewItemFormSubmit, true);
    }
  }

  function initializeNewFeatures() {
    if (window.__ootieNewFeaturesInitialized) return;
    window.__ootieNewFeaturesInitialized = true;

    if (typeof items !== 'undefined' && Array.isArray(items) && typeof saved !== 'undefined' && saved && Array.isArray(saved.items) && saved.items.length) {
      items = items.map(normalizeDbItem);
    }

    installSubmitAdapters();

    el('colorFamilyFilter')?.addEventListener('change', renderItems);
    el('colorFilter')?.addEventListener('change', renderItems);
    el('colorFilterToggle')?.addEventListener('click', () => {
      const menu = el('colorFilterMenu');
      if (!menu) return;
      const isOpen = menu.classList.toggle('open');
      el('colorFilterToggle')?.setAttribute('aria-expanded', String(isOpen));
    });

    document.querySelectorAll('[data-color-family]').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.colorFamily || '';
        const familyFilter = el('colorFamilyFilter');
        const colorFilter = el('colorFilter');
        if (familyFilter) familyFilter.value = value;
        if (colorFilter) colorFilter.value = '';
        renderColorDetailOptions(value);
        familyFilter?.dispatchEvent(new Event('change'));
        const label = el('colorFilterLabel');
        if (label) label.textContent = value || '色系／顏色';
        const preview = document.querySelector('.color-filter-preview');
        if (preview) {
          preview.className = 'color-filter-preview is-all';
          preview.style.background = '';
        }
        document.querySelectorAll('[data-color-family]').forEach(option => {
          option.classList.toggle('selected', option === button);
          option.setAttribute('aria-selected', String(option === button));
        });
      });
    });

    el('colorDetailOptions')?.addEventListener('click', event => {
      const button = event.target.closest('[data-color-detail]');
      if (!button) return;
      const value = button.dataset.colorDetail || '';
      const colorFilter = el('colorFilter');
      colorFilter && (colorFilter.value = value);
      colorFilter?.dispatchEvent(new Event('change'));
      const family = document.querySelector('[data-color-family].selected')?.dataset.colorFamily || '';
      const label = el('colorFilterLabel');
      if (label) label.textContent = value ? `${family ? `${family}／` : ''}${value}` : (family || '色系／顏色');
      const previewColors = { '白色': '#F5F3EC', '黑色': '#242321', '炭灰色': '#55565A', '米白色': '#F1EAD9', '卡其色': '#C2A878', '奶茶色': '#C8A98A', '棕色': '#806454', '暖橙色': '#E58B4A', '奶油黃': '#F2D77B', '櫻花粉': '#F4C2C2', '芥末黃': '#C49A28', '丹寧藍': '#3B5998', '天藍色': '#83C5E8', '軍綠色': '#4B5320', '酪梨綠': '#8A9A5B', '酒紅色': '#722F37', '薰衣草紫': '#B7A4D4', '玫瑰紅': '#C85A70', '葡萄紫': '#653B83' };
      const preview = document.querySelector('.color-filter-preview');
      if (preview) {
        preview.className = `color-filter-preview ${value ? `color-${value}` : 'is-all'}`;
        preview.style.background = value ? previewColors[value] || '' : '';
      }
      document.querySelectorAll('[data-color-detail]').forEach(option => {
        option.classList.toggle('selected', option === button);
        option.setAttribute('aria-selected', String(option === button));
      });
    });

    document.addEventListener('click', event => {
      if (!el('colorFilterMenu')?.contains(event.target)) {
        el('colorFilterMenu')?.classList.remove('open');
        el('colorFilterToggle')?.setAttribute('aria-expanded', 'false');
      }
    });

    el('clearFilters')?.addEventListener('click', () => {
      activeCategory = 'All';
      const search = el('searchInput');
      if (search) search.value = '';
      ['colorFilter', 'colorFamilyFilter', 'seasonFilter', 'styleFilter'].forEach(id => {
        const field = el(id);
        if (field) field.value = '';
      });
      const label = el('colorFilterLabel');
      if (label) label.textContent = '色系／顏色';
      const preview = document.querySelector('.color-filter-preview');
      if (preview) {
        preview.className = 'color-filter-preview is-all';
        preview.style.background = '';
      }
      document.querySelectorAll('[data-color-family]').forEach(option => {
        option.classList.toggle('selected', option.dataset.colorFamily === '');
        option.setAttribute('aria-selected', String(option.dataset.colorFamily === ''));
      });
      renderColorDetailOptions('');
      renderCategories();
      renderItems();
    });

    el('primary_color')?.addEventListener('change', syncColorFamilyFromPrimaryColor);

    setActiveNav();
  }

  installShellWrapper();
  installSosWrapper();
  installFilterWrapper();
  installDetailWrapper();
  installFormOpenWrappers();
  installDeleteOverride();

  const publicFunctions = {
    getSupabaseClient, syncClosetFromSupabase, normalizeDbItem, calculateCostPerWear,
    renderFavoriteBrandOptions, loadItemsFromSupabase, getDaysSinceLastWorn, escapeHtml,
    isDisusedItem, getDisusedItems, renderDisusedItems, renderDisusedRanking, markItemForClearance,
    aggregateClosetStats, getClosetStats, destroyClosetCharts, renderStatsChart, loadAndRenderClosetStats,
    getBrandStats, renderBrandStats, getTopWornItems, renderTopWornItems, getCostPerWearRanking,
    renderCostRanking, getYearlySummary, renderYearlySummary, normalizeFilterValue, matchesFilterValue, updateClosetCountDisplay,
    getColorFamilyForPrimaryColor, renderColorDetailOptions, syncColorFamilyFromPrimaryColor
  };
  Object.entries(publicFunctions).forEach(([name, fn]) => {
    OOTieNewFeatures[name] = fn;
    window[name] = fn;
  });
  OOTieNewFeatures.closetCharts = closetCharts;
  OOTieNewFeatures.SUPABASE_CONFIG = SUPABASE_CONFIG;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNewFeatures);
  } else {
    initializeNewFeatures();
  }
})();

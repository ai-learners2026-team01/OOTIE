/* ===================== 書籤模組 (Bookmarks Module) ===================== */
(function() {
  'use strict';

  // Supabase 設定
  const SUPABASE_URL = 'https://tmegwwbmnwzgnbgadxwp.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_TLCDkQkINOK9hBQE5h01-g_NuaQO7Fe';
  const BOOKMARKS_STORAGE_KEY = 'ootie-bookmarks-data';
  const fallbackBookmarkImage = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85';

  function getSupabaseClient() {
    if (typeof window === 'undefined') return null;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true }
      });
    }
    return null;
  }

  let sbClient = getSupabaseClient();

  function canUseSupabase() {
    if (!sbClient) sbClient = getSupabaseClient();
    return !!sbClient;
  }

  function getBookmarkOwnerId() {
    if (typeof profile !== 'undefined' && profile && (profile.id || profile.user_id)) {
      return String(profile.id || profile.user_id);
    }
    const localUid = localStorage.getItem('ootie-current-user-id');
    return localUid || 'profile-01';
  }

  const defaultBookmarks = [
    {
      id: 'bookmark-01',
      owner_id: 'profile-01',
      product_url: 'https://www.aritzia.com/ca/en/product/ilana-cardigan/32703.html',
      title: 'The Ilana Cardigan',
      image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
      image_storage_path: '',
      brand: 'Aritzia',
      price: 'NT$ 3,990',
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
      price: 'NT$ 1,990',
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
      price: 'NT$ 2,490',
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

  function loadBookmarks() {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    try {
      const appState = localStorage.getItem('weary-app-state-v1');
      if (appState) {
        const parsed = JSON.parse(appState);
        if (parsed && Array.isArray(parsed.bookmarks) && parsed.bookmarks.length > 0) {
          return parsed.bookmarks;
        }
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaultBookmarks));
  }

  function saveBookmarks() {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {}
  }

  let bookmarks = loadBookmarks();
  let bookmarkManagerMode = false;
  let bookmarkSelection = [];

  function helperEl(id) {
    return document.getElementById(id);
  }

  function helperToast(message) {
    if (typeof showToast === 'function') {
      showToast(message);
    } else {
      const toast = helperEl('toast');
      if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
      }
    }
  }

  function isValidHttpUrl(value) {
    if (!value || typeof value !== 'string') return false;
    try {
      const parsed = new URL(value.trim());
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch (error) {
      return false;
    }
  }

  function getSourceDomain(url) {
    if (!isValidHttpUrl(url)) return '';
    try {
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch (error) {
      return '';
    }
  }

  function normalizeBookmarkProductTitle(value = '') {
    const decoded = decodeURIComponent((value || '').replace(/&amp;/gi, '&'));
    const clean = decoded
      .replace(/[-_]+/g, ' ')
      .replace(/\.(html|htm|php|aspx|jsp|asp)$/i, '')
      .replace(/(?:^|[\s/])p-?\d+(?=$|[\s/])/gi, ' ')
      .replace(/(?:^|[\s/])product(?=$|[\s/])/gi, ' ')
      .replace(/[?#].*$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return clean || '未命名商品';
  }

  function getUrlTitle(url) {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        if (/^(tw|zh|en|ja|ko|us|ca|eu|p|item|product|products|goods|detail|details|catalog)$/i.test(seg)) continue;
        if (/^\d+(\.html?)?$/i.test(seg)) continue;
        const title = normalizeBookmarkProductTitle(seg);
        if (title && title !== '未命名商品') return title;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  function formatBookmarkPrice(price, currency = 'TWD') {
    if (!price || !String(price).trim()) return '價格未提供';
    const rawNum = String(price).replace(/[^0-9.]/g, '');
    if (!rawNum) return String(price).trim();
    const formattedNum = Number(rawNum).toLocaleString();
    const cur = (currency || 'TWD').toUpperCase();
    if (cur === 'TWD') return `NT$ ${formattedNum}`;
    if (cur === 'USD') return `$ ${formattedNum}`;
    if (cur === 'EUR') return `€ ${formattedNum}`;
    if (cur === 'JPY') return `¥ ${formattedNum}`;
    return `${cur} ${formattedNum}`;
  }

  function updateBookmarkImagePreview(src) {
    const preview = helperEl('bookmarkImagePreview');
    const placeholder = helperEl('bookmarkPreviewPlaceholder');
    const validSrc = (src || '').trim();
    if (validSrc) {
      if (preview) {
        preview.src = validSrc;
        preview.style.display = 'block';
        preview.onerror = () => {
          preview.style.display = 'none';
          if (placeholder) placeholder.style.display = 'flex';
        };
      }
      if (placeholder) placeholder.style.display = 'none';
    } else {
      if (preview) preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    }
  }

  function toggleBookmarkExtraFields() {
    const extra = helperEl('bookmarkExtraFields');
    if (!extra) return;
    extra.hidden = !extra.hidden;
    const button = helperEl('toggleBookmarkExtras');
    if (button) {
      button.textContent = extra.hidden ? '▾ 補充更多 (品牌、尺寸、價格等)' : '▴ 收合補充資訊';
    }
  }

  function findDuplicateBookmark(url, variant, color, size, excludeId = null) {
    const normUrl = (url || '').trim().toLowerCase();
    const normVariant = (variant || '').trim().toLowerCase();
    const normColor = (color || '').trim().toLowerCase();
    const normSize = (size || '').trim().toLowerCase();

    // 若無網址則不做重複檢查
    if (!normUrl) return null;

    return bookmarks.find(item => {
      if (excludeId && item.id === excludeId) return false;
      const itemUrl = (item.product_url || '').trim().toLowerCase();
      const itemVariant = (item.variant_name || '').trim().toLowerCase();
      const itemColor = (item.color || '').trim().toLowerCase();
      const itemSize = (item.size || '').trim().toLowerCase();
      return itemUrl === normUrl && itemVariant === normVariant && itemColor === normColor && itemSize === normSize;
    });
  }

  async function refreshBookmarksFromSupabase() {
    if (!canUseSupabase()) return;
    try {
      const ownerId = getBookmarkOwnerId();
      const { data, error } = await sbClient
        .from('ootie_bookmarks')
        .select('*')
        .or(`owner_id.eq.${ownerId},owner_id.eq.profile-01`)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        bookmarks = data.map(item => ({
          ...item,
          price: item.price || '',
          brand: item.brand || '',
          color: item.color || '',
          variant_name: item.variant_name || '',
          size: item.size || '',
          notes: item.notes || '',
          image_url: item.image_url || '',
          image_storage_path: item.image_storage_path || ''
        }));
        saveBookmarks();
        renderBookmarks();
      }
    } catch (error) {
      console.warn('Supabase bookmarks load failed:', error);
    }
  }


  function updateBookmarkSelectionUI() {
    const selectedCount = helperEl('bookmarkSelectedCount');
    if (selectedCount) {
      selectedCount.textContent = `已選 ${bookmarkSelection.length} 件`;
    }
    const deleteSelectedButton = helperEl('deleteSelectedBookmarks');
    if (deleteSelectedButton) {
      deleteSelectedButton.disabled = !bookmarkSelection.length;
    }
    const grid = helperEl('bookmarksGrid');
    if (!grid) return;
    grid.querySelectorAll('[data-bookmark-card]').forEach(card => {
      const id = card.dataset.bookmarkCard;
      const isSelected = bookmarkSelection.includes(id);
      card.classList.toggle('selected', isSelected);
      const checkbox = card.querySelector('[data-bookmark-select]');
      if (checkbox) checkbox.checked = isSelected;
    });
  }

  function renderBookmarks() {
    const grid = helperEl('bookmarksGrid');
    if (!grid) return;
    const sorted = [...bookmarks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const managerBar = helperEl('bookmarkManagerBar');
    const selectedCount = helperEl('bookmarkSelectedCount');
    if (managerBar) {
      managerBar.classList.toggle('hidden', !bookmarkManagerMode);
    }
    if (selectedCount) {
      selectedCount.textContent = `已選 ${bookmarkSelection.length} 件`;
    }
    const deleteSelectedButton = helperEl('deleteSelectedBookmarks');
    if (deleteSelectedButton) {
      deleteSelectedButton.disabled = !bookmarkSelection.length;
    }
    if (!sorted.length) {
      grid.innerHTML = '<div class="empty bookmark-empty"><h3>還沒有書籤</h3><p>把想要的商品網址貼進來，先存住好物。</p><button class="primary" id="bookmarkEmptyButton">建立書籤</button></div>';
      const button = helperEl('bookmarkEmptyButton');
      if (button) button.addEventListener('click', () => openBookmarkForm());
      return;
    }
    grid.innerHTML = sorted.map((bookmark, index) => {
      const selected = bookmarkSelection.includes(bookmark.id);
      const priceText = formatBookmarkPrice(bookmark.price, bookmark.currency);
      const metaParts = [
        bookmark.brand || bookmark.source_domain,
        bookmark.price ? priceText : ''
      ].filter(Boolean);
      const metaText = metaParts.length ? metaParts.join(' · ') : (bookmark.source_domain || '商品');

      return `
        <article class="bookmark-card ${selected ? 'selected' : ''}" data-bookmark-card="${bookmark.id}" style="animation-delay:${index * 45}ms">
          <div class="bookmark-image-wrap" data-bookmark-detail="${bookmark.id}">
            ${bookmarkManagerMode ? `
              <label class="bookmark-select" onclick="event.stopPropagation()">
                <input type="checkbox" data-bookmark-select="${bookmark.id}" ${selected ? 'checked' : ''}>
              </label>
            ` : `
              <button type="button" class="bookmark-card-link" data-bookmark-link="${bookmark.id}" aria-label="前往 ${bookmark.title}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </button>
            `}
            ${bookmark.image_url ? `
              <img src="${bookmark.image_url}" alt="${bookmark.title}" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';">
              <div class="card-no-image-placeholder" style="display:none;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>暫無圖片</span>
              </div>
            ` : `
              <div class="card-no-image-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>暫無圖片</span>
              </div>
            `}
          </div>
          <div class="bookmark-info" data-bookmark-detail="${bookmark.id}">
            <h3>${bookmark.title}</h3>
            <p>${metaText}</p>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('[data-bookmark-card]').forEach(card => {
      card.addEventListener('click', event => {
        const target = event.target;
        if (target.closest('[data-bookmark-link]') || target.closest('[data-bookmark-edit]') || target.closest('[data-bookmark-delete]') || target.closest('[data-bookmark-external]')) {
          return;
        }
        if (bookmarkManagerMode) {
          const id = card.dataset.bookmarkCard;
          if (bookmarkSelection.includes(id)) {
            bookmarkSelection = bookmarkSelection.filter(item => item !== id);
          } else {
            bookmarkSelection = [...bookmarkSelection, id];
          }
          updateBookmarkSelectionUI();
          return;
        }
        openBookmarkDetail(card.dataset.bookmarkCard);
      });
    });

    grid.querySelectorAll('[data-bookmark-link]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const id = button.dataset.bookmarkLink;
      const bookmark = bookmarks.find(item => item.id === id);
      if (bookmark) window.open(bookmark.product_url, '_blank', 'noopener,noreferrer');
    }));

    grid.querySelectorAll('[data-bookmark-select]').forEach(input => input.addEventListener('change', event => {
      const id = event.target.dataset.bookmarkSelect;
      if (event.target.checked) {
        bookmarkSelection = [...new Set([...bookmarkSelection, id])];
      } else {
        bookmarkSelection = bookmarkSelection.filter(item => item !== id);
      }
      updateBookmarkSelectionUI();
    }));
  }


  function openBookmarkDetail(bookmarkId) {
    const bookmark = bookmarks.find(item => item.id === bookmarkId);
    const backdrop = helperEl('bookmarkDetailBackdrop');
    if (!backdrop || !bookmark) return;
    const productLink = helperEl('bookmarkProductLink');
    if (productLink) {
      productLink.href = bookmark.product_url || '#';
    }
    const detailImage = helperEl('bookmarkDetailImage');
    const detailPlaceholder = helperEl('bookmarkDetailPlaceholder');
    if (detailImage) {
      if (bookmark.image_url) {
        detailImage.src = bookmark.image_url;
        detailImage.alt = bookmark.title;
        detailImage.style.display = 'block';
        if (detailPlaceholder) detailPlaceholder.style.display = 'none';
        detailImage.onerror = () => {
          detailImage.style.display = 'none';
          if (detailPlaceholder) detailPlaceholder.style.display = 'flex';
        };
      } else {
        detailImage.style.display = 'none';
        if (detailPlaceholder) detailPlaceholder.style.display = 'flex';
      }
    }
    const brand = bookmark.brand || '商品';
    const brandNode = helperEl('bookmarkDetailBrand');
    if (brandNode) brandNode.textContent = brand;
    const titleNode = helperEl('bookmarkDetailTitle');
    if (titleNode) titleNode.textContent = bookmark.title || '未命名商品';
    const metaNode = helperEl('bookmarkDetailMeta');
    if (metaNode) {
      const priceText = formatBookmarkPrice(bookmark.price, bookmark.currency);
      metaNode.textContent = `${bookmark.source_domain || '來源未知'} • ${priceText}`;
    }
    const fillText = (id, value) => {
      const node = helperEl(id);
      if (node) node.textContent = value || '—';
    };
    fillText('bookmarkDetailBrandValue', bookmark.brand || '—');
    fillText('bookmarkDetailPriceValue', formatBookmarkPrice(bookmark.price, bookmark.currency));
    fillText('bookmarkDetailSizeValue', bookmark.size || '—');
    fillText('bookmarkDetailColorValue', bookmark.color || '—');
    fillText('bookmarkDetailVariantValue', bookmark.variant_name || '—');
    fillText('bookmarkDetailSourceValue', bookmark.source_domain || '—');

    const descNode = helperEl('bookmarkDetailNotes') || helperEl('bookmarkDetailDescription');
    if (descNode) {
      descNode.textContent = bookmark.notes ? `備註：${bookmark.notes}` : '';
      descNode.style.display = bookmark.notes ? 'block' : 'none';
    }

    const editButton = helperEl('bookmarkDetailEditButton');
    if (editButton) {
      editButton.onclick = () => {
        openBookmarkEditorFromDetail(bookmark.id);
      };
    }
    backdrop.classList.add('open');
  }

  function closeBookmarkDetail() {
    const backdrop = helperEl('bookmarkDetailBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  function openBookmarkEditorFromDetail(bookmarkId) {
    closeBookmarkDetail();
    openBookmarkForm('edit', bookmarkId);
  }

  function openBookmarkForm(mode = 'create', bookmarkId = null, prefillData = null) {
    const form = helperEl('bookmarkForm');
    if (!form) return;

    const modal = helperEl('bookmarkModal');
    form.reset();

    const extraFields = helperEl('bookmarkExtraFields');
    const toggleBtn = helperEl('toggleBookmarkExtras');

    if (mode === 'edit' && bookmarkId) {
      const bookmark = bookmarks.find(item => item.id === bookmarkId);
      if (!bookmark) return;
      form.dataset.mode = 'edit';
      form.dataset.bookmarkId = bookmark.id;
      if (helperEl('bookmarkFormTitle')) helperEl('bookmarkFormTitle').textContent = '編輯書籤';

      if (helperEl('bookmarkTitle')) helperEl('bookmarkTitle').value = bookmark.title || '';
      if (helperEl('bookmarkUrlInput')) helperEl('bookmarkUrlInput').value = bookmark.product_url || '';
      if (helperEl('bookmarkImageUrl')) helperEl('bookmarkImageUrl').value = bookmark.image_url || '';
      if (helperEl('bookmarkBrand')) helperEl('bookmarkBrand').value = bookmark.brand || '';
      if (helperEl('bookmarkVariantNameDisplay')) helperEl('bookmarkVariantNameDisplay').value = bookmark.variant_name || '';
      if (helperEl('bookmarkColorDisplay')) helperEl('bookmarkColorDisplay').value = bookmark.color || '';
      if (helperEl('bookmarkSizeDisplay')) helperEl('bookmarkSizeDisplay').value = bookmark.size || '';
      if (helperEl('bookmarkPrice')) helperEl('bookmarkPrice').value = (bookmark.price || '').replace(/[^0-9.]/g, '');
      if (helperEl('bookmarkCurrency')) helperEl('bookmarkCurrency').value = bookmark.currency || 'TWD';
      if (helperEl('bookmarkNotes')) helperEl('bookmarkNotes').value = bookmark.notes || '';

      updateBookmarkImagePreview(bookmark.image_url);
    } else {
      form.dataset.mode = 'create';
      form.dataset.bookmarkId = '';
      if (helperEl('bookmarkFormTitle')) helperEl('bookmarkFormTitle').textContent = '建立書籤';

      const data = prefillData || {};
      if (helperEl('bookmarkTitle')) helperEl('bookmarkTitle').value = data.title || '';
      if (helperEl('bookmarkUrlInput')) helperEl('bookmarkUrlInput').value = data.url || '';
      if (helperEl('bookmarkImageUrl')) helperEl('bookmarkImageUrl').value = data.image || '';
      if (helperEl('bookmarkBrand')) helperEl('bookmarkBrand').value = data.brand || '';
      if (helperEl('bookmarkVariantNameDisplay')) helperEl('bookmarkVariantNameDisplay').value = data.variant_name || '';
      if (helperEl('bookmarkColorDisplay')) helperEl('bookmarkColorDisplay').value = data.color || '';
      if (helperEl('bookmarkSizeDisplay')) helperEl('bookmarkSizeDisplay').value = data.size || '';
      if (helperEl('bookmarkPrice')) helperEl('bookmarkPrice').value = (data.price || '').replace(/[^0-9.]/g, '');
      if (helperEl('bookmarkCurrency')) helperEl('bookmarkCurrency').value = data.currency || 'TWD';
      if (helperEl('bookmarkNotes')) helperEl('bookmarkNotes').value = data.notes || '';

      updateBookmarkImagePreview(data.image || '');
    }

    if (extraFields) extraFields.hidden = true;
    if (toggleBtn) toggleBtn.textContent = '▾ 補充更多 (品牌、尺寸、價格等)';

    modal?.classList.add('open');
    helperEl('bookmarkTitle')?.focus();
  }

  function closeBookmarkForm() {
    const modal = helperEl('bookmarkModal');
    if (modal) modal.classList.remove('open');
    const form = helperEl('bookmarkForm');
    if (form) {
      form.dataset.mode = 'create';
      form.dataset.bookmarkId = '';
      form.reset();
    }
    updateBookmarkImagePreview('');
    const extraFields = helperEl('bookmarkExtraFields');
    if (extraFields) extraFields.hidden = true;
  }

  async function deleteBookmark(id) {
    if (!confirm('確定要移除此書籤嗎？')) return;
    if (canUseSupabase()) {
      try {
        const { error } = await sbClient.from('ootie_bookmarks').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase delete bookmark failed:', err);
      }
    }
    bookmarks = bookmarks.filter(item => item.id !== id);
    bookmarkSelection = bookmarkSelection.filter(item => item !== id);
    saveBookmarks();
    renderBookmarks();
    helperToast('書籤已移除');
  }

  async function deleteSelectedBookmarks() {
    if (!bookmarkSelection.length) return;
    const pending = [...bookmarkSelection];
    if (!confirm(`確定要刪除選取的 ${pending.length} 個書籤嗎？`)) return;
    if (canUseSupabase()) {
      try {
        const { error } = await sbClient.from('ootie_bookmarks').delete().in('id', pending);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase batch delete bookmarks failed:', err);
      }
    }
    bookmarks = bookmarks.filter(item => !pending.includes(item.id));
    bookmarkSelection = [];
    bookmarkManagerMode = false;
    saveBookmarks();
    renderBookmarks();
    helperToast(`已移除 ${pending.length} 個書籤`);
  }


  async function submitBookmarkForm(event) {
    event.preventDefault();
    const form = helperEl('bookmarkForm');
    const mode = form.dataset.mode || 'create';
    let urlValue = helperEl('bookmarkUrlInput')?.value.trim() || '';
    const title = helperEl('bookmarkTitle')?.value.trim() || '';
    const imageUrl = helperEl('bookmarkImageUrl')?.value.trim() || '';
    const fileUpload = helperEl('bookmarkImageUpload')?.files?.[0];
    const brandVal = helperEl('bookmarkBrand')?.value.trim() || '';
    const variantName = helperEl('bookmarkVariantNameDisplay')?.value.trim() || '';
    const colorVal = helperEl('bookmarkColorDisplay')?.value.trim() || '';
    const sizeVal = helperEl('bookmarkSizeDisplay')?.value.trim() || '';
    const rawPriceVal = helperEl('bookmarkPrice')?.value.trim() || '';
    if (rawPriceVal && !/^\d+(?:\.\d+)?$/.test(rawPriceVal.replace(/[,$\s]/g, ''))) {
      helperToast('價格請填入純數字（例如：1980）');
      helperEl('bookmarkPrice')?.focus();
      return;
    }
    const priceVal = rawPriceVal.replace(/[^0-9.]/g, '');
    const currencyVal = helperEl('bookmarkCurrency')?.value || 'TWD';
    const notesVal = helperEl('bookmarkNotes')?.value.trim() || '';

    if (!title) {
      helperToast('請填寫商品名稱');
      helperEl('bookmarkTitle')?.focus();
      return;
    }

    if (urlValue && !/^https?:\/\//i.test(urlValue)) {
      if (urlValue.includes('.') || urlValue.startsWith('localhost')) {
        urlValue = 'https://' + urlValue;
        if (helperEl('bookmarkUrlInput')) helperEl('bookmarkUrlInput').value = urlValue;
      }
    }

    if (urlValue && !isValidHttpUrl(urlValue)) {
      helperToast('商品網址格式不正確，請確認網址');
      helperEl('bookmarkUrlInput')?.focus();
      return;
    }

    const duplicate = findDuplicateBookmark(urlValue, variantName, colorVal, sizeVal, mode === 'edit' ? form.dataset.bookmarkId : null);
    if (duplicate) {
      const confirmProceed = confirm('您已收藏過相同網址、款式及尺寸的商品，確定仍要儲存嗎？\n點擊「確定」繼續儲存，點擊「取消」返回修改。');
      if (!confirmProceed) return;
    }

    let imageStoragePath = '';
    let persistedImageUrl = fileUpload ? '' : (imageUrl || '');

    if (fileUpload && canUseSupabase()) {
      const fileExt = (fileUpload.name.split('.').pop() || 'jpg').toLowerCase();
      const storagePath = `bookmarks/${getBookmarkOwnerId()}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await sbClient.storage.from('ootie-bookmarks-images').upload(storagePath, fileUpload, {
        cacheControl: '3600',
        upsert: true
      });

      if (!uploadError) {
        const { data: publicUrlData } = sbClient.storage.from('ootie-bookmarks-images').getPublicUrl(storagePath);
        if (publicUrlData?.publicUrl) {
          persistedImageUrl = publicUrlData.publicUrl;
          imageStoragePath = storagePath;
        }
      } else {
        console.warn('Supabase storage upload error, fallback to data url:', uploadError);
      }
    }

    const domain = urlValue ? getSourceDomain(urlValue) : '';
    const defaultBrand = domain ? domain.split('.')[0].replace(/\b\w/g, c => c.toUpperCase()) : '';

    const payload = {
      owner_id: getBookmarkOwnerId(),
      product_url: urlValue,
      title,
      image_url: persistedImageUrl || '',
      image_storage_path: imageStoragePath,
      brand: brandVal || defaultBrand,
      price: priceVal,
      currency: currencyVal,
      variant_name: variantName,
      color: colorVal,
      size: sizeVal,
      source_domain: domain,
      notes: notesVal,
      updated_at: new Date().toISOString()
    };

    if (mode === 'edit') {
      const id = form.dataset.bookmarkId;
      const index = bookmarks.findIndex(item => item.id === id);
      if (index !== -1) {
        const updated = {
          ...bookmarks[index],
          ...payload,
          image_url: persistedImageUrl || bookmarks[index].image_url || '',
          image_storage_path: imageStoragePath || bookmarks[index].image_storage_path || '',
          id
        };
        bookmarks[index] = updated;

        if (canUseSupabase()) {
          try {
            await sbClient.from('ootie_bookmarks').update({
              product_url: updated.product_url,
              title: updated.title,
              image_url: updated.image_url,
              image_storage_path: updated.image_storage_path,
              brand: updated.brand,
              price: updated.price,
              currency: updated.currency,
              variant_name: updated.variant_name,
              color: updated.color,
              size: updated.size,
              source_domain: updated.source_domain,
              notes: updated.notes,
              updated_at: updated.updated_at
            }).eq('id', id);
          } catch (err) {
            console.warn('Supabase bookmark update failed:', err);
          }
        }
        helperToast('書籤已更新');
      }
    } else {
      const newBookmark = {
        id: `bookmark-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString()
      };
      bookmarks.unshift(newBookmark);

      if (canUseSupabase()) {
        try {
          const { data, error } = await sbClient.from('ootie_bookmarks').insert([newBookmark]).select().single();
          if (!error && data) {
            newBookmark.id = data.id;
          }
        } catch (err) {
          console.warn('Supabase bookmark insert failed:', err);
        }
      }
      helperToast('已建立書籤');
    }

    saveBookmarks();
    closeBookmarkForm();
    renderBookmarks();
  }


  function handleUrlQueryParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const rawUrl = params.get('url') || params.get('product_url');
      const rawTitle = params.get('title') || params.get('name');
      const rawImage = params.get('image') || params.get('image_url') || params.get('img');
      const rawPrice = params.get('price');
      const rawBrand = params.get('brand');
      const rawCurrency = params.get('currency');
      const rawVariant = params.get('variant') || params.get('variant_name');
      const rawColor = params.get('color');
      const rawSize = params.get('size');
      const rawNotes = params.get('notes');

      if (rawUrl || rawTitle || rawImage || rawPrice || rawBrand || rawColor || rawSize) {
        const safeDecode = (val) => {
          if (!val) return '';
          try {
            return decodeURIComponent(val).trim();
          } catch (e) {
            return String(val).trim();
          }
        };

        const prefill = {
          url: safeDecode(rawUrl),
          title: safeDecode(rawTitle),
          image: safeDecode(rawImage),
          price: safeDecode(rawPrice).replace(/[^0-9.]/g, ''),
          brand: safeDecode(rawBrand),
          currency: safeDecode(rawCurrency) || 'TWD',
          variant_name: safeDecode(rawVariant),
          color: safeDecode(rawColor),
          size: safeDecode(rawSize),
          notes: safeDecode(rawNotes)
        };

        openBookmarkForm('create', null, prefill);
        helperToast('已從擴充功能帶入商品資訊');

        // 清除網址列參數避免重新整理重複觸發
        try {
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to parse URL query params:', err);
    }
  }

  function openExtensionGuideModal() {
    helperEl('extensionGuideModal')?.classList.add('open');
  }

  function closeExtensionGuideModal() {
    helperEl('extensionGuideModal')?.classList.remove('open');
  }

  function copyExtensionUrl() {
    const text = 'chrome://extensions/';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        helperToast('已複製網址：' + text);
      }).catch(() => {
        helperToast('請手動選取複製：' + text);
      });
    } else {
      helperToast('請手動選取複製：' + text);
    }
  }

  function initBookmarks() {
    if (document.body.dataset.page !== 'bookmarks') return;

    renderBookmarks();
    refreshBookmarksFromSupabase();
    handleUrlQueryParams();

    helperEl('openBookmarkForm')?.addEventListener('click', () => openBookmarkForm('create'));
    helperEl('toggleBookmarkManager')?.addEventListener('click', () => {
      bookmarkManagerMode = !bookmarkManagerMode;
      if (!bookmarkManagerMode) bookmarkSelection = [];
      helperEl('toggleBookmarkManager')?.classList.toggle('selected', bookmarkManagerMode);
      renderBookmarks();
    });

    helperEl('deleteSelectedBookmarks')?.addEventListener('click', deleteSelectedBookmarks);
    helperEl('closeBookmarkForm')?.addEventListener('click', closeBookmarkForm);
    helperEl('cancelBookmarkForm')?.addEventListener('click', closeBookmarkForm);

    helperEl('bookmarkForm')?.addEventListener('submit', submitBookmarkForm);

    // 折疊補充更多
    helperEl('toggleBookmarkExtras')?.addEventListener('click', toggleBookmarkExtraFields);

    // 擴充功能導引 Modal 事件
    helperEl('openExtensionGuideBtn')?.addEventListener('click', openExtensionGuideModal);
    helperEl('closeExtensionGuide')?.addEventListener('click', closeExtensionGuideModal);
    helperEl('closeExtensionGuideConfirm')?.addEventListener('click', (e) => {
      e.preventDefault();
      // 展示按鈕，點擊無反應
    });
    helperEl('copyExtensionUrlBtn')?.addEventListener('click', copyExtensionUrl);

    helperEl('bookmarkImageUpload')?.addEventListener('change', event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = loadEvent => {
        helperEl('bookmarkImageUrl').value = loadEvent.target.result;
        updateBookmarkImagePreview(loadEvent.target.result);
      };
      reader.readAsDataURL(file);
    });

    helperEl('bookmarkImageUrl')?.addEventListener('input', event => {
      updateBookmarkImagePreview(event.target.value.trim());
    });

    document.querySelectorAll('[data-close-bookmark-detail]').forEach(btn => {
      btn.addEventListener('click', closeBookmarkDetail);
    });

    [helperEl('bookmarkModal'), helperEl('bookmarkDetailBackdrop'), helperEl('extensionGuideModal')].forEach(backdrop => {
      backdrop?.addEventListener('click', event => {
        if (event.target === backdrop) backdrop.classList.remove('open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookmarks, { once: true });
  } else {
    initBookmarks();
  }

  window.OotieBookmarks = {
    render: renderBookmarks,
    refresh: refreshBookmarksFromSupabase,
    openForm: openBookmarkForm,
    closeForm: closeBookmarkForm
  };
})();


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
      description: 'A soft knit cardigan that layers easily for everyday polish.',
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
      description: '轻盈版型，適合日常穿搭與層次堆疊。',
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
      description: 'A comfortable wide-leg silhouette for easy movement and clean layering.',
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

  function updateBookmarkExtraStatus() {
    const brand = helperEl('bookmarkBrand')?.value.trim() || '';
    const variant = helperEl('bookmarkVariantNameDisplay')?.value.trim() || '';
    const color = helperEl('bookmarkColorDisplay')?.value.trim() || '';
    const size = helperEl('bookmarkSizeDisplay')?.value.trim() || '';
    const price = helperEl('bookmarkPrice')?.value.trim() || '';
    const notes = helperEl('bookmarkNotes')?.value.trim() || '';
    const hasExtras = !!(brand || variant || color || size || price || notes);
    const statusEl = helperEl('bookmarkExtraStatus');
    if (statusEl) {
      statusEl.textContent = hasExtras ? '(已有補充資料)' : '';
    }
  }

  function toggleBookmarkExtraFields() {
    const extra = helperEl('bookmarkExtraFields');
    if (!extra) return;
    extra.hidden = !extra.hidden;
    const button = helperEl('toggleBookmarkExtras');
    if (button) {
      button.textContent = extra.hidden ? '▾ 補充更多' : '▴ 收合商品資訊';
    }
    updateBookmarkExtraStatus();
  }

  function findDuplicateBookmark(url, variant, color, size, excludeId = null) {
    const normUrl = (url || '').trim().toLowerCase();
    const normVariant = (variant || '').trim().toLowerCase();
    const normColor = (color || '').trim().toLowerCase();
    const normSize = (size || '').trim().toLowerCase();

    return bookmarks.find(item => {
      if (excludeId && item.id === excludeId) return false;
      const itemUrl = (item.product_url || '').trim().toLowerCase();
      const itemVariant = (item.variant_name || '').trim().toLowerCase();
      const itemColor = (item.color || '').trim().toLowerCase();
      const itemSize = (item.size || '').trim().toLowerCase();
      return itemUrl === normUrl && itemVariant === normVariant && itemColor === normColor && itemSize === normSize;
    });
  }

  function setBookmarkUrlStepVisible(showUrlStep) {
    const urlStep = helperEl('bookmarkUrlStep');
    const reviewPanel = helperEl('bookmarkReviewPanel');
    if (urlStep) urlStep.style.display = showUrlStep ? 'block' : 'none';
    if (reviewPanel) reviewPanel.style.display = showUrlStep ? 'none' : 'block';
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
          description: item.description || '',
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
      const metaParts = [
        bookmark.brand || bookmark.source_domain,
        bookmark.price
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
            <img src="${bookmark.image_url || fallbackBookmarkImage}" alt="${bookmark.title}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackBookmarkImage}'">
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
    if (detailImage) {
      detailImage.src = bookmark.image_url || fallbackBookmarkImage;
      detailImage.alt = bookmark.title;
      detailImage.onerror = () => { detailImage.src = fallbackBookmarkImage; };
    }
    const brand = bookmark.brand || '商品';
    const brandNode = helperEl('bookmarkDetailBrand');
    if (brandNode) brandNode.textContent = brand;
    const titleNode = helperEl('bookmarkDetailTitle');
    if (titleNode) titleNode.textContent = bookmark.title || '未命名商品';
    const metaNode = helperEl('bookmarkDetailMeta');
    if (metaNode) {
      const price = bookmark.price || '價格未提供';
      metaNode.textContent = `${bookmark.source_domain || '來源未知'} • ${price}`;
    }
    const fillText = (id, value) => {
      const node = helperEl(id);
      if (node) node.textContent = value || '—';
    };
    fillText('bookmarkDetailBrandValue', bookmark.brand || '—');
    fillText('bookmarkDetailPriceValue', bookmark.price || '—');
    fillText('bookmarkDetailSizeValue', bookmark.size || '—');
    fillText('bookmarkDetailColorValue', bookmark.color || '—');
    fillText('bookmarkDetailVariantValue', bookmark.variant_name || '—');
    fillText('bookmarkDetailSourceValue', bookmark.source_domain || '—');

    const descNode = helperEl('bookmarkDetailDescription');
    if (descNode) {
      const notesText = bookmark.notes ? `備註：${bookmark.notes}` : '';
      const descText = bookmark.description || '';
      descNode.textContent = [descText, notesText].filter(Boolean).join('\n') || '無補充描述';
    }

    const editButton = helperEl('bookmarkDetailEditButton');
    if (editButton) {
      editButton.onclick = () => {
        closeBookmarkDetail();
        openBookmarkForm('edit', bookmark.id);
      };
    }
    backdrop.classList.add('open');
  }

  function closeBookmarkDetail() {
    const backdrop = helperEl('bookmarkDetailBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  function openBookmarkEditorFromId(bookmarkId) {
    const bookmark = bookmarks.find(item => item.id === bookmarkId);
    if (!bookmark) return;
    const form = helperEl('bookmarkForm');
    if (!form) return;
    form.dataset.mode = 'edit';
    form.dataset.bookmarkId = bookmark.id;
    if (helperEl('bookmarkFormTitle')) helperEl('bookmarkFormTitle').textContent = '編輯書籤';
    setBookmarkUrlStepVisible(false);

    if (helperEl('bookmarkUrlInput')) helperEl('bookmarkUrlInput').value = bookmark.product_url || '';
    if (helperEl('bookmarkTitle')) helperEl('bookmarkTitle').value = bookmark.title || '';
    if (helperEl('bookmarkBrand')) helperEl('bookmarkBrand').value = bookmark.brand || '';
    if (helperEl('bookmarkPrice')) helperEl('bookmarkPrice').value = bookmark.price || '';
    if (helperEl('bookmarkCurrency')) helperEl('bookmarkCurrency').value = bookmark.currency || 'TWD';
    if (helperEl('bookmarkVariantNameDisplay')) helperEl('bookmarkVariantNameDisplay').value = bookmark.variant_name || '';
    if (helperEl('bookmarkColorDisplay')) helperEl('bookmarkColorDisplay').value = bookmark.color || '';
    if (helperEl('bookmarkSizeDisplay')) helperEl('bookmarkSizeDisplay').value = bookmark.size || '';
    if (helperEl('bookmarkNotes')) helperEl('bookmarkNotes').value = bookmark.notes || '';
    if (helperEl('bookmarkImageUrl')) helperEl('bookmarkImageUrl').value = bookmark.image_url || '';
    const preview = helperEl('bookmarkImagePreview');
    if (preview) {
      preview.src = bookmark.image_url || fallbackBookmarkImage;
      preview.onerror = () => { preview.src = fallbackBookmarkImage; };
    }
    const reviewPanel = helperEl('bookmarkReviewPanel');
    if (reviewPanel) reviewPanel.style.display = 'block';
    const extraFields = helperEl('bookmarkExtraFields');
    if (extraFields) extraFields.hidden = true;
    const toggleBtn = helperEl('toggleBookmarkExtras');
    if (toggleBtn) toggleBtn.textContent = '▾ 補充更多';
    updateBookmarkExtraStatus();
    helperEl('bookmarkModal')?.classList.add('open');
  }


  function openBookmarkForm(mode = 'create', bookmarkId = null) {
    const form = helperEl('bookmarkForm');
    if (!form) return;
    if (mode === 'edit' && bookmarkId) {
      openBookmarkEditorFromId(bookmarkId);
      return;
    }
    form.dataset.mode = 'create';
    form.dataset.bookmarkId = '';
    form.reset();
    setBookmarkUrlStepVisible(true);
    if (helperEl('bookmarkUrlInput')) helperEl('bookmarkUrlInput').value = '';
    if (helperEl('bookmarkTitle')) helperEl('bookmarkTitle').value = '';
    if (helperEl('bookmarkBrand')) helperEl('bookmarkBrand').value = '';
    if (helperEl('bookmarkPrice')) helperEl('bookmarkPrice').value = '';
    if (helperEl('bookmarkCurrency')) helperEl('bookmarkCurrency').value = 'TWD';
    if (helperEl('bookmarkVariantNameDisplay')) helperEl('bookmarkVariantNameDisplay').value = '';
    if (helperEl('bookmarkColorDisplay')) helperEl('bookmarkColorDisplay').value = '';
    if (helperEl('bookmarkSizeDisplay')) helperEl('bookmarkSizeDisplay').value = '';
    if (helperEl('bookmarkNotes')) helperEl('bookmarkNotes').value = '';
    if (helperEl('bookmarkImageUrl')) helperEl('bookmarkImageUrl').value = '';
    const preview = helperEl('bookmarkImagePreview');
    if (preview) {
      preview.src = fallbackBookmarkImage;
    }
    const reviewPanel = helperEl('bookmarkReviewPanel');
    if (reviewPanel) reviewPanel.style.display = 'none';
    const extraFields = helperEl('bookmarkExtraFields');
    if (extraFields) extraFields.hidden = true;
    const toggleBtn = helperEl('toggleBookmarkExtras');
    if (toggleBtn) toggleBtn.textContent = '▾ 補充更多';
    updateBookmarkExtraStatus();
    if (helperEl('bookmarkFormTitle')) helperEl('bookmarkFormTitle').textContent = '建立書籤';
    helperEl('bookmarkModal')?.classList.add('open');
    helperEl('bookmarkUrlInput')?.focus();
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
    setBookmarkUrlStepVisible(true);
    if (helperEl('bookmarkReviewPanel')) helperEl('bookmarkReviewPanel').style.display = 'none';
    if (helperEl('bookmarkExtraFields')) helperEl('bookmarkExtraFields').hidden = true;
    if (helperEl('toggleBookmarkExtras')) helperEl('toggleBookmarkExtras').textContent = '▾ 補充更多';
    updateBookmarkExtraStatus();
  }

  function parseBookmarkUrl() {
    const urlInput = helperEl('bookmarkUrlInput');
    const urlValue = urlInput?.value?.trim() || '';
    if (!isValidHttpUrl(urlValue)) {
      helperToast('商品 URL 必須是有效的 http 或 https 網址');
      return;
    }

    const domain = getSourceDomain(urlValue);
    const domainBrand = domain ? domain.split('.')[0].replace(/\b\w/g, c => c.toUpperCase()) : '';
    const urlTitle = getUrlTitle(urlValue);

    setBookmarkUrlStepVisible(false);
    if (helperEl('bookmarkTitle')) helperEl('bookmarkTitle').value = urlTitle || '';
    if (helperEl('bookmarkBrand')) helperEl('bookmarkBrand').value = domainBrand || '';
    if (helperEl('bookmarkPrice')) helperEl('bookmarkPrice').value = '';
    if (helperEl('bookmarkCurrency')) helperEl('bookmarkCurrency').value = 'TWD';
    if (helperEl('bookmarkVariantNameDisplay')) helperEl('bookmarkVariantNameDisplay').value = '';
    if (helperEl('bookmarkColorDisplay')) helperEl('bookmarkColorDisplay').value = '';
    if (helperEl('bookmarkSizeDisplay')) helperEl('bookmarkSizeDisplay').value = '';
    if (helperEl('bookmarkNotes')) helperEl('bookmarkNotes').value = '';

    const preview = helperEl('bookmarkImagePreview');
    if (preview) {
      preview.src = fallbackBookmarkImage;
    }
    const reviewPanel = helperEl('bookmarkReviewPanel');
    if (reviewPanel) reviewPanel.style.display = 'block';
    const extraFields = helperEl('bookmarkExtraFields');
    if (extraFields) extraFields.hidden = true;
    const toggleBtn = helperEl('toggleBookmarkExtras');
    if (toggleBtn) toggleBtn.textContent = '▾ 補充更多';
    updateBookmarkExtraStatus();

    helperToast('請確認並填寫商品資訊');
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
    const urlValue = helperEl('bookmarkUrlInput').value.trim();
    const title = helperEl('bookmarkTitle').value.trim();
    const imageUrl = helperEl('bookmarkImageUrl').value.trim();
    const fileUpload = helperEl('bookmarkImageUpload')?.files?.[0];
    const finalImage = fileUpload ? '' : imageUrl;
    const variantName = helperEl('bookmarkVariantNameDisplay').value.trim();
    const colorVal = helperEl('bookmarkColorDisplay').value.trim();
    const sizeVal = helperEl('bookmarkSizeDisplay').value.trim();

    if (!isValidHttpUrl(urlValue)) {
      helperToast('商品網址必須是 http 或 https');
      return;
    }
    if (!title) {
      helperToast('商品名稱為必填欄位');
      return;
    }
    if (!finalImage && !fileUpload) {
      helperToast('請提供商品圖片網址或上傳圖片');
      return;
    }

    const duplicate = findDuplicateBookmark(urlValue, variantName, colorVal, sizeVal, mode === 'edit' ? form.dataset.bookmarkId : null);
    if (duplicate) {
      const confirmProceed = confirm('您已收藏過相同網址、款式及尺寸的商品，確定仍要建立嗎？\n點擊「確定」繼續儲存，點擊「取消」返回修改。');
      if (!confirmProceed) {
        return;
      }
    }

    let imageStoragePath = '';
    let persistedImageUrl = finalImage || '';

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

    const payload = {
      owner_id: getBookmarkOwnerId(),
      product_url: urlValue,
      title,
      image_url: persistedImageUrl || fallbackBookmarkImage,
      image_storage_path: imageStoragePath,
      brand: helperEl('bookmarkBrand').value.trim() || getSourceDomain(urlValue).split('.')[0].replace(/\b\w/g, c => c.toUpperCase()) || '',
      price: helperEl('bookmarkPrice').value.trim() || '',
      currency: helperEl('bookmarkCurrency').value || 'TWD',
      variant_name: variantName,
      color: colorVal,
      size: sizeVal,
      source_domain: getSourceDomain(urlValue),
      description: '',
      notes: helperEl('bookmarkNotes').value.trim(),
      updated_at: new Date().toISOString()
    };

    if (mode === 'edit') {
      const id = form.dataset.bookmarkId;
      const index = bookmarks.findIndex(item => item.id === id);
      if (index !== -1) {
        const updated = {
          ...bookmarks[index],
          ...payload,
          image_url: persistedImageUrl || bookmarks[index].image_url || fallbackBookmarkImage,
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
              description: updated.description,
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


  function initBookmarks() {
    if (document.body.dataset.page !== 'bookmarks') return;

    renderBookmarks();
    refreshBookmarksFromSupabase();

    helperEl('openBookmarkForm')?.addEventListener('click', () => openBookmarkForm('create'));
    helperEl('toggleBookmarkManager')?.addEventListener('click', () => {
      bookmarkManagerMode = !bookmarkManagerMode;
      if (!bookmarkManagerMode) bookmarkSelection = [];
      helperEl('toggleBookmarkManager')?.classList.toggle('selected', bookmarkManagerMode);
      renderBookmarks();
    });

    helperEl('deleteSelectedBookmarks')?.addEventListener('click', deleteSelectedBookmarks);
    helperEl('bookmarkContinueBtn')?.addEventListener('click', parseBookmarkUrl);
    helperEl('bookmarkBackButton')?.addEventListener('click', () => {
      const reviewPanel = helperEl('bookmarkReviewPanel');
      if (reviewPanel && reviewPanel.style.display !== 'none') {
        reviewPanel.style.display = 'none';
        setBookmarkUrlStepVisible(true);
        return;
      }
      closeBookmarkForm();
    });

    helperEl('closeBookmarkForm')?.addEventListener('click', closeBookmarkForm);
    helperEl('cancelBookmarkForm')?.addEventListener('click', closeBookmarkForm);
    helperEl('cancelBookmarkFormSecondary')?.addEventListener('click', closeBookmarkForm);
    helperEl('toggleBookmarkExtras')?.addEventListener('click', toggleBookmarkExtraFields);

    ['bookmarkBrand', 'bookmarkVariantNameDisplay', 'bookmarkColorDisplay', 'bookmarkSizeDisplay', 'bookmarkPrice', 'bookmarkNotes'].forEach(id => {
      helperEl(id)?.addEventListener('input', updateBookmarkExtraStatus);
    });

    helperEl('bookmarkForm')?.addEventListener('submit', submitBookmarkForm);

    helperEl('bookmarkImageUpload')?.addEventListener('change', event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = loadEvent => {
        helperEl('bookmarkImageUrl').value = loadEvent.target.result;
        const preview = helperEl('bookmarkImagePreview');
        if (preview) preview.src = loadEvent.target.result;
      };
      reader.readAsDataURL(file);
    });

    helperEl('bookmarkImageUrl')?.addEventListener('input', event => {
      const value = event.target.value.trim();
      const preview = helperEl('bookmarkImagePreview');
      if (preview) {
        preview.src = value || fallbackBookmarkImage;
        preview.onerror = () => { preview.src = fallbackBookmarkImage; };
      }
    });

    document.querySelectorAll('[data-close-bookmark-detail]').forEach(btn => {
      btn.addEventListener('click', closeBookmarkDetail);
    });

    [helperEl('bookmarkModal'), helperEl('bookmarkDetailBackdrop')].forEach(backdrop => {
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


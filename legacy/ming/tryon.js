const TRYON_HISTORY_KEY = 'ootie-tryon-history-v1';

function getCurrentGeneratedTryon() {
  const resultWrap = document.getElementById('resultPhotoWrap');
  if (!resultWrap) return null;

  const img = resultWrap.querySelector('img');
  if (!img) return null;

  return {
    src: img.src,
    label: img.alt || '我的穿搭',
    created_at: new Date().toISOString()
  };
}

function getTryonHistory() {
  try {
    const raw = localStorage.getItem(TRYON_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveTryonHistory(history) {
  try {
    localStorage.setItem(TRYON_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    // ignore storage
  }
}

function getSelectedTryonClothes() {
  const selected = [...document.querySelectorAll('input[name="tryonCloth"]:checked')];
  return selected
    .map(input => items.find(item => item.id === input.value))
    .filter(Boolean);
}

function updateTryonSelectionSummary() {
  const summary = document.getElementById('tryonSelectedSummary');
  const chips = document.getElementById('tryonSelectedChips');
  const selected = getSelectedTryonClothes();

  if (summary) {
    summary.textContent = selected.length
      ? `已選擇：${selected.map(item => item.name_zh || item.name).slice(0, 3).join('、')}${selected.length > 3 ? '...' : ''}`
      : '已選擇：無';
  }

  if (chips) {
    chips.innerHTML = selected.length
      ? selected.map(item => `<span class="tryon-chip">${item.name_zh || item.name}</span>`).join('')
      : '<span class="tryon-chip empty">尚未選擇衣服</span>';
  }
}

function renderTryonClothes() {
  const root = document.getElementById('tryonClothes');
  if (!root) return;

  const clothes = Array.isArray(items) ? items.slice(0, 12) : [];
  root.innerHTML = clothes.map(item => `
    <label class="tryon-cloth-card" data-cloth-id="${item.id}">
      <input type="checkbox" name="tryonCloth" value="${item.id}">
      <img src="${item.photo}" alt="${item.name_zh || item.name}">
      <span>${item.name_zh || item.name}</span>
    </label>
  `).join('');

  root.querySelectorAll('input[name="tryonCloth"]').forEach(input => {
    input.addEventListener('change', updateTryonSelectionSummary);
  });

  updateTryonSelectionSummary();
}

function renderTryonHistory() {
  const root = document.getElementById('tryonHistoryList');
  if (!root) return;

  const history = getTryonHistory();
  if (!history.length) {
    root.innerHTML = '<div class="tryon-history-empty">尚未生成任何換裝預覽，先上傳照片試穿吧！</div>';
    return;
  }

  root.innerHTML = history.map(entry => `
    <div class="tryon-history-item">
      <img src="${entry.image || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'}" alt="${entry.name || '穿搭'}">
      <div class="tryon-history-copy">
        <strong>${entry.name || '我的穿搭'}</strong>
        <span>${entry.item || '選擇衣服'}</span>
        <small>${entry.mood || '輕鬆'} · ${new Date(entry.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}</small>
      </div>
    </div>
  `).join('');
}

function saveCurrentTryonLook() {
  const result = getCurrentGeneratedTryon();
  if (!result) {
    showToast('請先生成換裝預覽');
    return;
  }

  const name = document.getElementById('tryonLookName')?.value || '我的穿搭';
  const mood = document.getElementById('tryonMood')?.value || '輕鬆';
  const selected = document.querySelector('input[name="tryonCloth"]:checked');
  const selectedItem = selected ? items.find(item => item.id === selected.value) : null;

  const newClosetItem = {
    id: `tryon-${Date.now()}`,
    owner_id: profile?.id || 'profile-01',
    name: name,
    name_zh: name,
    brand: 'AI Try-On',
    category: selectedItem ? (selectedItem.category || 'Tops') : 'Tops',
    shape: 'AI generated look',
    primary_color: selectedItem ? (selectedItem.primary_color || 'Neutral') : 'Neutral',
    secondary_color: selectedItem ? (selectedItem.secondary_color || '') : '',
    color_hex: selectedItem ? (selectedItem.color_hex || '#E9E1D7') : '#E9E1D7',
    style: mood,
    season: 'All year',
    photo: result.src,
    wear_count: 0,
    last_worn: '',
    purchase_date: '',
    favorite: true,
    hidden: false,
    notes: `AI virtual try-on with ${selectedItem ? (selectedItem.name_zh || selectedItem.name) : 'selected clothing'} · ${mood}`,
    created_at: new Date().toISOString()
  };

  if (Array.isArray(items)) {
    items.unshift(newClosetItem);
  }

  const history = getTryonHistory();
  history.unshift({
    name,
    mood,
    item: selectedItem ? (selectedItem.name_zh || selectedItem.name) : '選擇衣服',
    image: result.src,
    created_at: new Date().toISOString()
  });
  saveTryonHistory(history.slice(0, 12));
  renderTryonHistory();

  if (typeof saveState === 'function') {
    saveState();
  }

  showToast('已加入衣櫃');
}

async function shareCurrentTryonLook() {
  const result = getCurrentGeneratedTryon();
  if (!result) {
    showToast('請先生成換裝預覽');
    return;
  }

  const text = `我在 OOTie 做了一個換裝試穿，穿搭感覺是 ${document.getElementById('tryonMood')?.value || '輕鬆'}。一起看看吧！`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('穿搭分享內容已複製');
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('穿搭分享內容已複製');
  } catch (error) {
    showToast('複製失敗，請手動複製內容');
  }
}

function setImageWrap(targetId, src, label) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;

  if (!src) {
    wrap.innerHTML = label || '尚未上傳';
    wrap.classList.add('empty');
    return;
  }

  wrap.classList.remove('empty');
  wrap.innerHTML = `<img src="${src}" alt="${label || '試穿預覽'}">`;
}

function handleSelfPhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const src = loadEvent.target.result;
    setImageWrap('originalPhotoWrap', src, '使用者原圖');

    const preview = document.getElementById('tryonSelfPreview');
    if (preview) {
      preview.src = src;
      preview.classList.add('visible');
    }

    document.getElementById('tryonStatus').textContent = '照片已上傳，現在可以選擇衣服進行換裝試穿。';
  };
  reader.readAsDataURL(file);
}

function buildDemoTryOnImage() {
  const selfPhoto = document.getElementById('tryonSelfPhoto');
  const selected = document.querySelector('input[name="tryonCloth"]:checked');
  const selectedItem = selected ? items.find(item => item.id === selected.value) : null;
  const baseSrc = selfPhoto && selfPhoto.files && selfPhoto.files[0] ? URL.createObjectURL(selfPhoto.files[0]) : 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85';

  if (!selectedItem) {
    return {
      src: baseSrc,
      label: '未選擇衣服'
    };
  }

  return {
    src: selectedItem.photo,
    label: selectedItem.name_zh || selectedItem.name
  };
}

async function generateTryon() {
  const selfPhotoInput = document.getElementById('tryonSelfPhoto');
  const selectedItems = getSelectedTryonClothes();
  const status = document.getElementById('tryonStatus');

  if (!selfPhotoInput || !selfPhotoInput.files || !selfPhotoInput.files[0]) {
    status.textContent = '請先上傳一張全身照。';
    showToast('請先上傳全身照');
    return;
  }

  if (!selectedItems.length) {
    status.textContent = '請先選擇至少一件衣服。';
    showToast('請先選擇至少一件衣服');
    return;
  }

  const personImage = await readFileAsDataUrl(selfPhotoInput.files[0]);
  const garmentImage = selectedItems[0] ? (selectedItems[0].photo || '') : '';
  const selectedNames = selectedItems.map(item => item.name_zh || item.name).join('、');

  status.textContent = '正在生成換裝效果，請稍候...';

  try {
    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        person_image: personImage,
        garment_image: garmentImage,
        prompt: `Create a realistic virtual try-on of the person in the uploaded photo wearing ${selectedNames} with a ${document.getElementById('tryonMood')?.value || '輕鬆'} style.`
      })
    });

    const payload = await response.json();
    const resultUrl = payload.url || garmentImage || personImage;
    const resultLabel = selectedItems.length > 1 ? `${selectedItems[0].name_zh || selectedItems[0].name} + ${selectedItems.length - 1} 件` : (selectedItems[0]?.name_zh || selectedItems[0]?.name || '試穿結果');
    setImageWrap('resultPhotoWrap', resultUrl, resultLabel);

    const resultSummary = document.createElement('div');
    resultSummary.className = 'tryon-result-summary';
    resultSummary.innerHTML = `
      <strong>${document.getElementById('tryonLookName')?.value || '我的穿搭'}</strong>
      <span>${selectedNames}</span>
      <small>${document.getElementById('tryonMood')?.value || '輕鬆'} 感</small>
    `;

    const existingSummary = document.querySelector('.tryon-result-summary');
    if (existingSummary) existingSummary.remove();
    document.getElementById('resultPhotoWrap')?.parentElement?.appendChild(resultSummary);

    status.textContent = payload.mode === 'demo-fallback'
      ? `目前沒有可用的 Fal.ai 金鑰，已切換到預覽模式。已生成「${selectedNames}」的試穿預覽。`
      : `已生成「${selectedNames}」的試穿預覽。`;

    const history = getTryonHistory();
    history.unshift({
      name: document.getElementById('tryonLookName')?.value || '我的穿搭',
      mood: document.getElementById('tryonMood')?.value || '輕鬆',
      item: selectedNames,
      image: resultUrl,
      created_at: new Date().toISOString()
    });
    saveTryonHistory(history.slice(0, 6));
    renderTryonHistory();

    showToast(payload.mode === 'demo-fallback' ? '已切換到預覽模式' : '試穿預覽已生成');
  } catch (error) {
    const fallback = buildDemoTryOnImage();
    setImageWrap('resultPhotoWrap', fallback.src, fallback.label);
    status.textContent = '試穿請求失敗，已切換到本地預覽模式。';
    showToast('試穿請求失敗，已切回預覽模式');
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resetTryon() {
  const form = document.getElementById('tryonSelfPhoto');
  if (form) form.value = '';

  const preview = document.getElementById('tryonSelfPreview');
  if (preview) {
    preview.removeAttribute('src');
    preview.classList.remove('visible');
  }

  document.querySelectorAll('input[name="tryonCloth"]').forEach(input => input.checked = false);
  document.getElementById('tryonLookName').value = '';
  document.getElementById('tryonMood').value = '輕鬆';
  document.getElementById('tryonStatus').textContent = '請先上傳全身照並選擇衣服。';
  updateTryonSelectionSummary();
  setImageWrap('originalPhotoWrap', '', '尚未上傳');
  setImageWrap('resultPhotoWrap', '', '等待生成');
}

function initTryonPage() {
  if (!document.getElementById('tryonPage')) return;

  renderTryonClothes();
  renderTryonHistory();
  document.getElementById('tryonSelfPhoto')?.addEventListener('change', handleSelfPhotoUpload);
  document.getElementById('generateTryon')?.addEventListener('click', generateTryon);
  document.getElementById('resetTryon')?.addEventListener('click', resetTryon);
  document.getElementById('saveTryonLook')?.addEventListener('click', saveCurrentTryonLook);
  document.getElementById('shareTryonLook')?.addEventListener('click', shareCurrentTryonLook);
}

document.addEventListener('DOMContentLoaded', () => {
  initTryonPage();
});

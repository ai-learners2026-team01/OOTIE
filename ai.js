const AI_HISTORY_KEY = 'ootie-ai-history-v1';

function getAiHistory() {
  try {
    const raw = localStorage.getItem(AI_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveAiHistory(history) {
  try {
    localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    // ignore storage issues
  }
}

function getAiWardrobeItems() {
  return Array.isArray(items) ? items : [];
}

function renderAiHistory() {
  const historyRoot = document.getElementById('aiHistory');
  if (!historyRoot) return;

  const history = getAiHistory();
  const historyCount = document.getElementById('aiHistoryCount');
  if (historyCount) historyCount.textContent = String(history.length);

  if (!history.length) {
    historyRoot.innerHTML = '<div class="ai-empty-history">尚未生成過 AI 組合，先生成一套吧。</div>';
    return;
  }

  historyRoot.innerHTML = history.map((item, index) => `
    <article class="ai-history-item" style="animation-delay:${index * 40}ms">
      <div>
        <p class="eyebrow">${item.when}</p>
        <h3>${item.title}</h3>
      </div>
      <div class="ai-history-tags">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
      <p>${item.summary}</p>
    </article>
  `).join('');
}

function renderAiBriefStatus() {
  const count = getAiWardrobeItems().length;
  const countEl = document.getElementById('aiWardrobeCount');
  if (countEl) countEl.textContent = String(count);

  const statusText = document.getElementById('aiStatusText');
  if (statusText) {
    statusText.textContent = '目前使用本地 demo 模式，若你後續設定 Fal.ai key，將自動切換到正式 API。';
  }
}

function buildDemoRecommendations(occasion, weather, vibe, limit) {
  const wardrobe = getAiWardrobeItems();
  const picks = wardrobe.slice(0, Math.max(3, Math.min(limit, 4)));

  return picks.map((item, idx) => {
    const variant = [
      `${item.name_zh || item.name}：${vibe}感的核心單品`,
      `${item.name_zh || item.name}：讓視覺層次更自然`,
      `${item.name_zh || item.name}：為整體搭配帶出舒適感`
    ][idx % 3];

    return {
      title: `${occasion}穿搭提案 ${idx + 1}`,
      score: 88 + idx * 4,
      summary: `${variant}，再搭配${weather}天氣與 ${occasion} 的情境，讓整體看起來更有氛圍。`,
      items: [item.name_zh || item.name],
      tag: item.category,
      image: item.photo
    };
  });
}

function renderAiResults(results) {
  const root = document.getElementById('aiResults');
  if (!root) return;

  if (!results || !results.length) {
    root.innerHTML = '<div class="ai-empty-state"><p>目前沒有可顯示的 AI 建議。</p></div>';
    return;
  }

  root.innerHTML = results.map((result, index) => `
    <article class="ai-result-card" style="animation-delay:${index * 60}ms">
      <div class="ai-result-visual">
        <img src="${result.image || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'}" alt="${result.title}">
      </div>
      <div class="ai-result-body">
        <div class="ai-result-topline">
          <span class="ai-tag">${result.tag}</span>
          <span class="ai-score">${result.score} / 100</span>
        </div>
        <h3>${result.title}</h3>
        <p>${result.summary}</p>
        <ul>
          ${result.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <div class="ai-result-actions">
          <button type="button" class="secondary">保存</button>
          <button type="button" class="primary">重新生成</button>
        </div>
      </div>
    </article>
  `).join('');

  root.querySelectorAll('.primary').forEach((button, index) => {
    button.addEventListener('click', () => {
      const form = document.getElementById('aiForm');
      if (form) form.requestSubmit();
    });
  });

  root.querySelectorAll('.secondary').forEach((button, index) => {
    button.addEventListener('click', () => {
      const suggestion = results[index];
      const history = getAiHistory();
      history.unshift({
        title: suggestion.title,
        when: `${document.getElementById('aiOccasion')?.value || '約會'} · ${document.getElementById('aiWeather')?.value || '涼爽'}`,
        tags: [document.getElementById('aiVibe')?.value || '輕鬆', suggestion.tag],
        summary: suggestion.summary
      });
      saveAiHistory(history.slice(0, 8));
      renderAiHistory();
      showToast('已保存這套 AI 搭配');
    });
  });
}

async function callFalProxyForOutfits(payload) {
  const response = await fetch('/api/fal/outfit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('AI request failed');
  }

  const data = await response.json();
  return data.suggestions || [];
}

async function handleAiSubmit(event) {
  event.preventDefault();

  const occasion = document.getElementById('aiOccasion')?.value || '約會';
  const weather = document.getElementById('aiWeather')?.value || '涼爽';
  const vibe = document.getElementById('aiVibe')?.value || '輕鬆';
  const limit = Number(document.getElementById('aiLimit')?.value || 3);

  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = '生成中...';
  }

  try {
    const results = await callFalProxyForOutfits({
      occasion,
      weather,
      vibe,
      limit,
      wardrobe: getAiWardrobeItems()
    });

    const finalResults = results.length ? results : buildDemoRecommendations(occasion, weather, vibe, limit);
    renderAiResults(finalResults);

    const history = getAiHistory();
    history.unshift({
      title: `${occasion} · ${vibe}風格`,
      when: `${occasion} · ${weather}`,
      tags: [vibe, weather],
      summary: `依據目前衣櫥產生的 ${finalResults.length} 套 AI 建議，適合 ${occasion} 情境與 ${weather} 天氣。`
    });
    saveAiHistory(history.slice(0, 8));
    renderAiHistory();
  } catch (error) {
    const fallbackResults = buildDemoRecommendations(occasion, weather, vibe, limit);
    renderAiResults(fallbackResults);
    showToast('AI 目前不可用，已切換到本地推薦');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = '生成 AI 建議';
    }
  }
}

function initAiPage() {
  if (!document.getElementById('aiPage')) return;

  renderAiBriefStatus();
  renderAiHistory();

  document.getElementById('aiForm')?.addEventListener('submit', handleAiSubmit);
  document.getElementById('loadClosetBtn')?.addEventListener('click', () => {
    renderAiBriefStatus();
    showToast('已更新衣櫥資料');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAiPage();
});

<template>
  <section class="page active" id="homePage">
    <div class="home-header-row">
      <div>
        <p class="eyebrow">早安，{{ appStore.profile.name.split(' ')[0] }}</p>
        <h1>今天想穿什麼？</h1>
      </div>
      <div class="weather-pill" id="weatherPill">
        <span class="weather-icon">{{ weatherState.icon }}</span> {{ weatherState.label }}
      </div>
    </div>
    <p class="intro">從你的衣櫥裡，找一點靈感開始今天。</p>

    <div class="home-hero">
      <div class="welcome-panel">
        <p class="eyebrow">選擇今天的情境</p>
        <h2>讓穿搭替你進入今天的狀態。</h2>
        <p>選一個場合，OOTie 會從你的衣櫥挑出一套提案。</p>
        <div class="occasion-row">
          <button
            v-for="occ in occasions"
            :key="occ.label"
            :class="['occasion', { selected: selectedOccasionLabel === occ.label }]"
            @click="selectOccasion(occ.label)"
          >
            {{ occ.label }}
          </button>
        </div>
      </div>

      <div class="recommendation">
        <div class="recommendation-header">
          <div>
            <p class="eyebrow">OOTie 為你挑了一套</p>
            <h3>{{ currentOccasion.title }}</h3>
            <p>{{ currentOccasion.copy }}</p>
          </div>
          <button type="button" class="reroll-btn" @click="rerollRecommendation" title="重新搭配">
            ↻ 重新搭配
          </button>
        </div>
        <div class="outfit-mini">
          <div
            v-for="item in recommendedItems"
            :key="item.id"
            class="recommendation-item-wrap"
            role="button"
            tabindex="0"
            @click="openDetail(item.id)"
            @keydown.enter="openDetail(item.id)"
            title="點擊查看詳細資訊"
          >
            <img :src="item.photo" :alt="item.name_zh || item.name" />
            <span class="item-name-tag">{{ item.name_zh || item.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-heading">
      <h2>最近加入衣櫥</h2>
      <router-link class="text-link" to="/closet">查看全部 →</router-link>
    </div>
    <div class="recent-row">
      <a
        v-for="item in recentItems"
        :key="item.id"
        class="recent-card"
        @click.prevent="openDetail(item.id)"
      >
        <div class="item-image">
          <img :src="item.photo" :alt="item.name_zh || item.name" loading="lazy" />
        </div>
        <h3>{{ item.name_zh || item.name }}</h3>
      </a>
    </div>

    <div class="home-columns">
      <section>
        <div class="section-heading">
          <h2>Style SOS</h2>
          <router-link class="text-link" to="/sos">查看更多 →</router-link>
        </div>
        <div class="sos-list">
          <router-link to="/sos" class="sos-card">
            <strong>第一次約會，要怎麼穿？</strong>
            <span>Soft · Elegant　32 件衣服可選</span>
          </router-link>
          <router-link to="/sos" class="sos-card">
            <strong>面試新創公司，西裝會不會太正式？</strong>
            <span>Smart Casual · 明天</span>
          </router-link>
        </div>
      </section>

      <section>
        <div class="section-heading">
          <h2>OOTD Inspiration</h2>
          <router-link class="text-link" to="/explore">探索更多 →</router-link>
        </div>
        <div class="inspiration-grid">
          <figure class="inspiration-card" role="button" tabindex="0" @click="openInspirationPost('post-01')">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85" alt="城市穿搭靈感" />
            <figcaption>@minji · #everydaystyle</figcaption>
          </figure>
          <figure class="inspiration-card" role="button" tabindex="0" @click="openInspirationPost('post-02')">
            <img src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=85" alt="簡約穿搭靈感" />
            <figcaption>@sofia · #minimal</figcaption>
          </figure>
          <figure class="inspiration-card" role="button" tabindex="0" @click="openInspirationPost('post-03')">
            <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85" alt="週末穿搭靈感" />
            <figcaption>@nora · #weekend</figcaption>
          </figure>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { occasions } from '@/constants';

const appStore = useAppStore();
const router = useRouter();

const selectedOccasionLabel = ref('上班');
const excludedItemIds = ref([]);

const weatherState = ref({
  temperature: null,
  rain: false,
  label: '23°C 台北',
  icon: '🌤️'
});

const currentOccasion = computed(() => {
  return occasions.find((o) => o.label === selectedOccasionLabel.value) || occasions[0];
});

const weatherScore = (item) => {
  if (weatherState.value.temperature === null) return 0;
  let score = 0;
  const temp = weatherState.value.temperature;
  const season = item.season || '';
  const cat = item.category || '';
  if (temp < 20) {
    if (season.includes('Winter') || season.includes('秋冬') || cat === 'Outerwear') score += 3;
    if (season.includes('Summer') || season.includes('春夏')) score -= 2;
  } else if (temp > 27) {
    if (season.includes('Summer') || season.includes('春夏')) score += 3;
    if (cat === 'Outerwear' || season.includes('Winter') || season.includes('秋冬')) score -= 4;
  }
  if (weatherState.value.rain && cat === 'Shoes') {
    if ((item.primary_color || '').includes('Black') || (item.name || '').includes('leather')) score += 2;
  }
  return score;
};

const recommendedItems = computed(() => {
  const allItems = appStore.items.filter((i) => !i.hidden);
  if (allItems.length === 0) return [];

  const picks = currentOccasion.value.picks || [];
  const candidateItems = allItems.filter((i) => !excludedItemIds.value.includes(i.id));
  const pool = candidateItems.length >= 3 ? candidateItems : allItems;

  const categoryMap = { Tops: [], Bottoms: [], Shoes: [], Other: [] };
  pool.forEach((item) => {
    let catScore = weatherScore(item);
    if (picks.includes(item.id)) catScore += 5;
    const itemWithScore = { item, score: catScore + Math.random() };

    if (item.category === 'Tops') categoryMap.Tops.push(itemWithScore);
    else if (item.category === 'Bottoms') categoryMap.Bottoms.push(itemWithScore);
    else if (item.category === 'Shoes') categoryMap.Shoes.push(itemWithScore);
    else categoryMap.Other.push(itemWithScore);
  });

  const getBestInCat = (list) => {
    if (!list || list.length === 0) return null;
    list.sort((a, b) => b.score - a.score);
    return list[0].item;
  };

  const selected = [];
  const top = getBestInCat(categoryMap.Tops);
  const bottom = getBestInCat(categoryMap.Bottoms);
  const shoes = getBestInCat(categoryMap.Shoes);

  if (top) selected.push(top);
  if (bottom) selected.push(bottom);
  if (shoes) selected.push(shoes);

  // Fallback to fill 3 items if missing
  if (selected.length < 3) {
    const remaining = pool.filter((i) => !selected.includes(i));
    remaining.sort((a, b) => weatherScore(b) - weatherScore(a));
    while (selected.length < 3 && remaining.length > 0) {
      selected.push(remaining.shift());
    }
  }

  return selected;
});

const recentItems = computed(() => {
  return appStore.items.slice(0, 4);
});

const selectOccasion = (label) => {
  selectedOccasionLabel.value = label;
  excludedItemIds.value = [];
};

const rerollRecommendation = () => {
  excludedItemIds.value = recommendedItems.value.map((i) => i.id);
};

const getItemById = (id) => {
  return appStore.items.find((i) => String(i.id) === String(id));
};

const openDetail = (id) => {
  const target = getItemById(id);
  if (!target) {
    appStore.showToast('找不到這件單品的詳細資訊');
    return;
  }
  appStore.selectedItemId = id;
  appStore.isDetailOpen = true;
};

const openInspirationPost = (postId) => {
  const post = appStore.ootdPosts.find((p) => String(p.id) === String(postId));
  if (post) {
    appStore.activeCommentPostId = post.id;
    appStore.isCommentOpen = true;
    router.push({ path: '/explore', query: { post: post.id } });
  } else {
    router.push('/explore');
  }
};

const loadWeather = async () => {
  try {
    let lat = 25.033, lon = 121.565;
    if (navigator.geolocation) {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      }).catch(() => null);
      if (pos && pos.coords) {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }
    }
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await res.json();
    if (data && data.current_weather) {
      const temp = Math.round(data.current_weather.temperature);
      weatherState.value.temperature = temp;
      weatherState.value.rain = (data.current_weather.weathercode >= 51);
      let icon = '☀️';
      let label = `${temp}°C 晴朗`;
      if (temp < 18) icon = '🧥';
      else if (temp > 28) icon = '🕶️';
      if (weatherState.value.rain) {
        icon = '🌧️';
        label = `${temp}°C 降雨`;
      }
      weatherState.value.label = label;
      weatherState.value.icon = icon;
    }
  } catch (e) {
    weatherState.value = { temperature: 23, rain: false, label: '23°C 台北', icon: '🌤️' };
  }
};

onMounted(() => {
  loadWeather();
});
</script>

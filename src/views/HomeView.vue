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
  temperature: 23,
  rain: false,
  city: '台北',
  condition: '晴朗',
  label: '23°C · 晴朗 台北',
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

const getWeatherCondition = (code, temp) => {
  // WMO Weather interpretation codes (WW)
  if (code >= 95) return { text: '雷陣雨', icon: '⛈️' };
  if (code >= 71) return { text: '降雪', icon: '❄️' };
  if (code >= 51) return { text: '降雨', icon: '🌧️' };
  if (code >= 45) return { text: '有霧', icon: '🌫️' };
  if (code >= 1) {
    if (code === 1 || code === 2) return { text: '晴時多雲', icon: '🌤️' };
    return { text: '陰天多雲', icon: '☁️' };
  }
  if (temp < 18) return { text: '晴朗微涼', icon: '🌤️' };
  if (temp > 28) return { text: '晴朗炎熱', icon: '☀️' };
  return { text: '晴朗舒適', icon: '☀️' };
};

const getCityFromCoords = (lat, lon) => {
  // 台灣主要都會區座標就近匹配作為快速無外部依賴備援
  const cities = [
    { name: '基隆', lat: 25.128, lon: 121.741 },
    { name: '台北', lat: 25.033, lon: 121.565 },
    { name: '新北', lat: 25.011, lon: 121.465 },
    { name: '桃園', lat: 24.993, lon: 121.301 },
    { name: '新竹', lat: 24.813, lon: 120.967 },
    { name: '苗栗', lat: 24.560, lon: 120.821 },
    { name: '台中', lat: 24.147, lon: 120.673 },
    { name: '彰化', lat: 24.081, lon: 120.538 },
    { name: '南投', lat: 23.903, lon: 120.686 },
    { name: '雲林', lat: 23.709, lon: 120.431 },
    { name: '嘉義', lat: 23.480, lon: 120.449 },
    { name: '台南', lat: 22.999, lon: 120.226 },
    { name: '高雄', lat: 22.627, lon: 120.301 },
    { name: '屏東', lat: 22.676, lon: 120.488 },
    { name: '宜蘭', lat: 24.757, lon: 121.753 },
    { name: '花蓮', lat: 23.977, lon: 121.604 },
    { name: '台東', lat: 22.758, lon: 121.144 },
    { name: '澎湖', lat: 23.571, lon: 119.579 }
  ];

  let closest = '台北';
  let minDistance = Infinity;
  for (const c of cities) {
    const d = Math.hypot(lat - c.lat, lon - c.lon);
    if (d < minDistance) {
      minDistance = d;
      closest = c.name;
    }
  }
  return closest;
};

const loadWeather = async () => {
  try {
    let lat = 25.033, lon = 121.565;
    let cityName = '台北';

    if (navigator.geolocation) {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      }).catch(() => null);
      if (pos && pos.coords) {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        cityName = getCityFromCoords(lat, lon);
      }
    }

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await res.json();
    if (data && data.current_weather) {
      const temp = Math.round(data.current_weather.temperature);
      const code = data.current_weather.weathercode || 0;
      const condition = getWeatherCondition(code, temp);
      const isRaining = code >= 51;

      weatherState.value.temperature = temp;
      weatherState.value.rain = isRaining;
      weatherState.value.city = cityName;
      weatherState.value.condition = condition.text;
      weatherState.value.icon = condition.icon;
      weatherState.value.label = `${temp}°C · ${condition.text} ${cityName}`;
    }
  } catch (e) {
    weatherState.value = {
      temperature: 23,
      rain: false,
      city: '台北',
      condition: '晴朗',
      label: '23°C · 晴朗 台北',
      icon: '🌤️'
    };
  }
};

onMounted(() => {
  loadWeather();
});
</script>

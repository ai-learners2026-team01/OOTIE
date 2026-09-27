<template>
  <aside class="sos-mode-panel" aria-label="SOS 使用模式">
    <template v-if="sos.isFixture">
      <div><strong class="sos-fixture-badge">FIXTURE · 多人體驗</strong><p>使用示範衣物，切換角色體驗求救與回覆。內容只保存在此瀏覽器。</p></div>
      <div class="sos-mode-controls">
        <label for="sos-fixture-profile">目前角色</label>
        <select id="sos-fixture-profile" :value="sos.actorId" @change="sos.switchFixtureProfile($event.target.value)">
          <option v-for="profile in sos.fixtureProfiles" :key="profile.id" :value="profile.id">{{ profile.name }} {{ profile.username }}</option>
        </select>
        <button type="button" @click="confirmReset = true">重設體驗</button>
      </div>
      <div v-if="confirmReset" class="sos-reset-confirm" role="alert">
        <p>清除體驗空間的求救、留言與搭配，還原示範資料？個人衣櫃不會改變。</p>
        <button type="button" @click="confirmReset = false">保留資料</button>
        <button type="button" @click="reset">確認重設</button>
      </div>
    </template>
    <template v-else>
      <div><strong>正式 SOS</strong><p>顯示衣友求救與本次指定公開的衣物。尚未確認帳號權限前，互動寫入會先停用。</p></div>
    </template>
  </aside>
</template>
<script setup>
import { ref } from 'vue';
import { useSosStore } from '@/stores/sos';
const sos = useSosStore();
const confirmReset = ref(false);
const reset = () => { if (sos.resetFixture()) confirmReset.value = false; };
</script>
<style scoped>
.sos-mode-panel { border: 1px solid #dddccf; background: #f4f5ee; border-radius: 16px; padding: 18px 20px; margin: 22px 0; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.sos-mode-panel > div:first-child { flex: 1; min-width: 200px; }
.sos-mode-panel strong { font-size: 12px; letter-spacing: .04em; color: #4b5c43; }
.sos-mode-panel p { font-size: 12px; color: var(--muted); margin: 6px 0 0; line-height: 1.65; }
.sos-mode-panel a, .sos-mode-panel button { color: #405037; font-size: 12px; }
.sos-mode-panel a { text-underline-offset: 4px; }
.sos-mode-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 12px; }
.sos-mode-controls select, .sos-mode-panel button { background: white; padding: 10px; border: 1px solid #d3d8cd; border-radius: 8px; }
.sos-team-tools { width: 100%; font-size: 11px; color: var(--muted); }
.sos-team-tools summary { cursor: pointer; } .sos-team-tools a { display: block; margin-top: 10px; }
.sos-reset-confirm { flex: 1 0 100%; } .sos-reset-confirm button { margin: 10px 8px 0 0; }
</style>

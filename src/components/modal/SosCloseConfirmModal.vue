<template>
  <SosDialog v-if="appStore.isSosCloseConfirmOpen" title="結束這次求救" panel-class="sos-close-confirm-modal" :busy="busy" @close="close">
      <p class="eyebrow">Style SOS</p>
      <h2 style="font-family:'Playfair Display',serif; font-size:26px; margin: 10px 0 14px;">結束這次求救？</h2>
      <p style="color:var(--muted); font-size:13px; line-height:1.6; margin-bottom:24px;">
        結束後將不再接受新的搭配建議和留言。已收到的回覆、採納結果會保留在「我發出的求救」。
      </p>
      <div class="form-actions">
        <button type="button" class="secondary" @click="close">取消</button>
        <button type="button" class="primary" :disabled="busy" @click="handleConfirm">{{ busy ? '儲存中…' : '確認結束' }}</button>
      </div>
      <p v-if="sosStore.lastError" class="sos-error" role="alert">{{ sosStore.lastError }}</p>
  </SosDialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';
import SosDialog from '@/features/sos/components/SosDialog.vue';

const appStore = useAppStore();
const sosStore = useSosStore();
const busy = ref(false);
watch(() => appStore.isSosCloseConfirmOpen, open => { if (open) sosStore.clearError(); });

const close = () => {
  if (busy.value) return;
  appStore.isSosCloseConfirmOpen = false;
  appStore.sosToCloseId = null;
};

const handleConfirm = async () => {
  if (busy.value) return;
  let success = false;
  busy.value = true;
  try {
  if (appStore.sosToCloseId) {
    success = await sosStore.closeSosPost(appStore.sosToCloseId);
  }
  } finally { busy.value = false; }
  if (success) close();
};
</script>

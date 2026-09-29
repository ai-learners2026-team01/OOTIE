<template>
  <div class="modal-backdrop open sos-backdrop" @click.self="requestClose">
    <section ref="panel" :class="['modal', 'sos-dialog', panelClass]" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1">
      <button class="modal-close" type="button" aria-label="關閉視窗" :disabled="busy" @click="requestClose">×</button>
      <slot />
    </section>
  </div>
</template>

<script>
// Shared only among SOS dialogs. Preserve another module's existing body styles.
let openCount = 0;
let previousOverflow = '';
</script>
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
const props = defineProps({ title: { type: String, required: true }, panelClass: String, busy: Boolean });
const emit = defineEmits(['close']);
const panel = ref(null);
let previousFocus;
const requestClose = () => { if (!props.busy) emit('close'); };
const focusable = () => [...panel.value.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')]
  .filter(el => !el.closest('[hidden], [inert]'));
const onKey = event => {
  const dialogs = document.querySelectorAll('.sos-dialog');
  if (dialogs[dialogs.length - 1] !== panel.value) return;
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); requestClose(); }
  if (event.key !== 'Tab') return;
  const elements = focusable();
  if (!elements.length) { event.preventDefault(); panel.value.focus(); return; }
  const index = elements.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); elements.at(-1).focus(); }
  else if (!event.shiftKey && (index === elements.length - 1 || index < 0)) { event.preventDefault(); elements[0].focus(); }
};
onMounted(async () => {
  previousFocus = document.activeElement;
  if (openCount++ === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  document.addEventListener('keydown', onKey);
  await nextTick();
  panel.value?.focus();
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  if (--openCount === 0) document.body.style.overflow = previousOverflow;
  if (previousFocus?.isConnected) previousFocus.focus();
});
</script>

<style scoped>
.sos-backdrop { z-index: 1000; overflow-y: auto; padding: 24px 16px; }
.sos-dialog { width: min(760px, 100%); padding: 34px; max-height: calc(100dvh - 48px); overflow-y: auto; overscroll-behavior: contain; overflow-wrap: anywhere; outline: none; }
.sos-dialog.sos-detail-modal { width: min(1080px, 100%); max-width: 1080px; max-height: calc(100dvh - 48px); }
.sos-dialog :deep(button:disabled) { opacity: .5; cursor: not-allowed; }
.sos-dialog :deep(:focus-visible) { outline: 2px solid var(--sage-dark); outline-offset: 3px; }
.sos-dialog :deep(.sos-error) { color: #923f36; padding: 12px; border-radius: 8px; background: #fff1ec; font-size: 13px; }
.sos-dialog :deep(.sos-note) { color: var(--muted); line-height: 1.65; font-size: 13px; }
.sos-dialog :deep(.sos-empty-note) { padding: 20px; border: 1px dashed var(--line); border-radius: 12px; color: var(--muted); font-size: 13px; line-height: 1.7; }
.sos-dialog :deep(textarea) { min-height: 105px; resize: vertical; }
.sos-dialog :deep(.suggestion-item) { position: relative; }
.sos-dialog :deep(.suggestion-item input[type="checkbox"]) { position: absolute; top: 10px; left: 10px; width: 18px; height: 18px; padding: 0; opacity: 1; pointer-events: auto; accent-color: var(--sage-dark); z-index: 1; }
.sos-dialog :deep(.suggestion-item:focus-within) { outline: 2px solid var(--sage-dark); outline-offset: 2px; }
.sos-dialog :deep(.suggestion-item img) { object-fit: contain; background: #f3f0e9; }
.sos-dialog :deep(.vibe-option) { white-space: nowrap; letter-spacing: 0; text-transform: none; font-size: 12px; min-height: 42px; }
.sos-dialog :deep(.vibe-option input[type="checkbox"]) { width: 16px; height: 16px; flex: 0 0 16px; padding: 0; }
.sos-dialog :deep(.form-actions) { flex-wrap: wrap; }
.sos-dialog :deep(.form-actions button) { min-height: 44px; }
@media (max-width: 600px) {
  .sos-backdrop { padding: 10px; }
  .sos-dialog { padding: 28px 18px 20px; max-height: calc(100dvh - 20px); border-radius: 20px; }
  .sos-dialog.sos-detail-modal { max-height: calc(100dvh - 20px); }
  .sos-dialog :deep(.form-grid) { grid-template-columns: 1fr; }
  .sos-dialog :deep(.form-actions) { display: flex; }
  .sos-dialog :deep(.form-actions button) { flex: 1; }
}
</style>

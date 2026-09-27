<template>
  <section class="sos-comments" aria-labelledby="sos-comments-title">
    <h3 id="sos-comments-title">留言交流 <span>{{ comments.length }}</span></h3>
    <p class="sos-note">可以詢問場合、補充穿著需求，或聊聊搭配的小細節。</p>
    <ol v-if="comments.length" class="sos-comment-list">
      <li v-for="comment in comments" :key="comment.id" :data-comment-id="comment.id" :class="{ highlighted: sos.highlightedCommentId === comment.id }" tabindex="-1">
        <div><strong>{{ comment.username || '衣友' }}</strong><span v-if="comment.author_id === post.sender_id" class="sos-author-badge">發布者</span><time>{{ formatTime(comment.created_at) }}</time></div>
        <p class="sos-comment-body">{{ comment.text }}</p>
      </li>
    </ol>
    <p v-else class="sos-empty-note">還沒有留言。先問一個問題，幫彼此找到更合適的穿法。</p>
    <form v-if="post.status === 'OPEN' && sos.canInteract" data-testid="sos-comment-form" @submit.prevent="submit">
      <label for="sos-comment-input">以 {{ sos.actorProfile.username || '目前角色' }} 留言</label>
      <textarea id="sos-comment-input" v-model="text" maxlength="500" required placeholder="例如：活動會待在室內還是戶外？" :disabled="submitting"></textarea>
      <div class="sos-comment-footer"><span>{{ text.length }} / 500</span><button class="primary" type="submit" :disabled="submitting || !text.trim()">{{ submitting ? '儲存中…' : '送出留言' }}</button></div>
    </form>
    <p v-else class="sos-note">{{ post.status !== 'OPEN' ? '求救已結束，留言已保留，暫不接受新留言。' : sos.interactionReason }}</p>
  </section>
</template>
<script setup>
import { ref, computed, watch } from 'vue';
import { useSosStore } from '@/stores/sos';
import { formatTime } from '../presentation';
const props = defineProps({ post: { type: Object, required: true } });
const sos = useSosStore();
const text = ref('');
const submitting = ref(false);
const comments = computed(() => sos.getCommentsForSos(props.post.id));
watch(() => [props.post.id, sos.actorId], () => { text.value = ''; });
async function submit() {
  if (submitting.value || !text.value.trim()) return;
  submitting.value = true;
  try { if (await sos.addComment({ sosId: props.post.id, text: text.value })) text.value = ''; }
  finally { submitting.value = false; }
}
</script>
<style scoped>
.sos-comments { margin-top: 30px; border-top: 1px solid var(--line); padding-top: 22px; }
.sos-comments h3 { font-size: 17px; } .sos-comments h3 span { color: var(--muted); font-size: 13px; margin-left: 6px; }
.sos-comment-list { padding: 0; list-style: none; margin: 18px 0; }
.sos-comment-list li { border-radius: 12px; padding: 16px; background: #f5f2ed; margin: 10px 0; border: 1px solid transparent; }
.sos-comment-list li.highlighted { border-color: var(--sage-dark); background: #edf2e6; }
.sos-comment-list li > div { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.sos-comment-list strong { font-size: 12px; } .sos-comment-list time { margin-left: auto; font-size: 10px; color: var(--muted); }
.sos-author-badge { background: #e6eada; color: #50623f; font-size: 10px; padding: 3px 6px; border-radius: 5px; }
.sos-comment-body { white-space: pre-wrap; font-size: 14px; line-height: 1.7; margin: 8px 0 0; }
.sos-comments form { margin-top: 20px; } .sos-comments label { font-size: 12px; display: block; margin-bottom: 8px; }
.sos-comments textarea { width: 100%; min-height: 90px; border: 1px solid var(--line); border-radius: 12px; padding: 12px; font: inherit; font-size: 14px; }
.sos-comment-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.sos-comment-footer span { color: var(--muted); font-size: 11px; }
</style>

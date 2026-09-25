<template>
  <div v-if="appStore.isOotdFormOpen" class="modal-backdrop open" @click.self="close">
    <section class="modal ootd-form-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">分享今天的穿搭</p>
      <h2>{{ isEditing ? '編輯 OOTD' : '發布 OOTD' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-field">
          <label for="ootdPhotoFile">穿搭照片</label>
          <label class="ootd-upload" for="ootdPhotoFile">
            <strong>上傳你的 OOTD</strong>
            <span>選一張最能代表今天的照片</span>
            <input
              id="ootdPhotoFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="handleFileChange"
            />
            <img
              :class="['ootd-upload-preview', { visible: photoPreview }]"
              :src="photoPreview"
              alt="OOTD 預覽"
            />
          </label>
        </div>

        <div class="form-field" style="margin-top:16px">
          <label for="ootdCaption">Caption</label>
          <textarea
            id="ootdCaption"
            v-model="caption"
            required
            placeholder="今天這套穿搭，想和衣友分享什麼？"
          ></textarea>
        </div>

        <div class="form-field" style="margin-top:16px">
          <label for="ootdHashtags">Hashtags</label>
          <input
            id="ootdHashtags"
            v-model="hashtags"
            placeholder="#minimal #dailylook"
          />
        </div>

        <div class="form-field" style="margin-top:16px">
          <label>標註衣櫥單品</label>
          <div class="tag-items">
            <label v-for="item in appStore.items" :key="item.id" class="tag-item">
              <input
                type="checkbox"
                :value="item.id"
                v-model="selectedItemIds"
              />
              {{ item.name_zh || item.name }}
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="secondary" @click="close">取消</button>
          <button type="submit" class="primary">{{ isEditing ? '儲存修改' : '發布穿搭' }}</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { useOotdStore } from '@/stores/ootd';

const appStore = useAppStore();
const ootdStore = useOotdStore();

const photo = ref('');
const photoPreview = ref('');
const caption = ref('');
const hashtags = ref('');
const selectedItemIds = ref([]);

const isEditing = computed(() => Boolean(ootdStore.editingPostId));

watch(
  () => appStore.isOotdFormOpen,
  (open) => {
    if (!open) return;
    if (ootdStore.editingPostId) {
      const post = appStore.ootdPosts.find(
        (item) => String(item.id) === String(ootdStore.editingPostId)
      );
      if (post) {
        photo.value = post.image || '';
        photoPreview.value = post.image || '';
        caption.value = post.caption || '';
        hashtags.value = (post.hashtags || []).join(' ');
        selectedItemIds.value = post.item_ids || post.itemIds || [];
        return;
      }
    }
    photo.value = '';
    photoPreview.value = '';
    caption.value = '';
    hashtags.value = '';
    selectedItemIds.value = [];
  }
);

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    photo.value = evt.target.result;
    photoPreview.value = evt.target.result;
  };
  reader.readAsDataURL(file);
};

const close = () => {
  ootdStore.editingPostId = null;
  appStore.isOotdFormOpen = false;
};

const handleSubmit = async () => {
  if (!photo.value) {
    appStore.showToast('請先上傳一張 OOTD 照片');
    return;
  }
  if (isEditing.value) {
    await ootdStore.updatePost(ootdStore.editingPostId, {
      image: photo.value,
      caption: caption.value,
      hashtags: hashtags.value,
      selectedItemIds: selectedItemIds.value
    });
  } else {
    await ootdStore.createPost({
      image: photo.value,
      caption: caption.value,
      hashtags: hashtags.value,
      selectedItemIds: selectedItemIds.value
    });
  }
  close();
};
</script>


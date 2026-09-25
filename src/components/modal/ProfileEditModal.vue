<template>
  <div v-if="appStore.isProfileEditOpen" class="modal-backdrop open" @click.self="close">
    <section class="modal profile-edit-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">Profile</p>
      <h2>編輯個人資料</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-field">
            <label for="editProfileName">姓名</label>
            <input id="editProfileName" v-model="form.name" required />
          </div>
          <div class="form-field">
            <label for="editProfileUsername">帳號 ID</label>
            <input id="editProfileUsername" v-model="form.username" required placeholder="@yourname" />
          </div>
          <div class="form-field">
            <label for="editProfileInitials">頭像縮寫</label>
            <input id="editProfileInitials" v-model="form.initials" maxlength="3" required placeholder="HL" />
          </div>

          <!-- 大頭貼上傳與裁切 -->
          <div class="form-field full">
            <label>大頭貼</label>
            <div class="avatar-upload-wrap">
              <label class="avatar-upload" for="avatarUploadFile">
                <span>上傳大頭貼</span>
                <input
                  id="avatarUploadFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="handleAvatarFileSelect"
                />
              </label>
              <div class="avatar-preview-shell">
                <img
                  v-if="avatarCrop.source"
                  class="avatar-preview visible"
                  :src="avatarCrop.source"
                  alt="大頭貼預覽"
                  :style="cropStyle"
                />
              </div>
            </div>

            <div v-if="avatarCrop.source" class="avatar-crop-controls">
              <label for="avatarZoom">照片調整</label>
              <input
                id="avatarZoom"
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                v-model.number="avatarCrop.zoom"
              />
              <div class="avatar-direction-row">
                <button type="button" class="avatar-direction" @click="moveAvatar('left')">←</button>
                <button type="button" class="avatar-direction" @click="moveAvatar('up')">↑</button>
                <button type="button" class="avatar-direction" @click="moveAvatar('right')">→</button>
                <button type="button" class="avatar-direction" @click="moveAvatar('down')">↓</button>
              </div>
            </div>
          </div>

          <div class="form-field full">
            <label for="editProfileBio">個人簡介</label>
            <textarea id="editProfileBio" v-model="form.bio" required></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="secondary" @click="close">取消</button>
          <button type="submit" class="primary">儲存資料</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const form = reactive({
  name: '',
  username: '',
  initials: '',
  bio: '',
  avatarUrl: ''
});

const avatarCrop = reactive({
  source: '',
  zoom: 1,
  offsetX: 0,
  offsetY: 0
});

const cropStyle = computed(() => {
  return {
    transform: `scale(${avatarCrop.zoom})`,
    objectPosition: `${50 + avatarCrop.offsetX}% ${50 + avatarCrop.offsetY}%`
  };
});

watch(
  () => appStore.isProfileEditOpen,
  (open) => {
    if (!open) return;
    form.name = appStore.profile.name;
    form.username = appStore.profile.username;
    form.initials = appStore.profile.initials;
    form.bio = appStore.profile.bio;
    form.avatarUrl = appStore.profile.avatar_url || '';

    avatarCrop.source = form.avatarUrl;
    avatarCrop.zoom = 1;
    avatarCrop.offsetX = 0;
    avatarCrop.offsetY = 0;
  }
);

const handleAvatarFileSelect = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    avatarCrop.source = evt.target.result;
    avatarCrop.zoom = 1;
    avatarCrop.offsetX = 0;
    avatarCrop.offsetY = 0;
  };
  reader.readAsDataURL(file);
};

const moveAvatar = (direction) => {
  const step = 8;
  if (direction === 'left') avatarCrop.offsetX -= step;
  if (direction === 'right') avatarCrop.offsetX += step;
  if (direction === 'up') avatarCrop.offsetY -= step;
  if (direction === 'down') avatarCrop.offsetY += step;
};

const generateAvatarCroppedDataUrl = () => {
  return new Promise((resolve) => {
    if (!avatarCrop.source) return resolve('');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(avatarCrop.source);
        const scale = Math.max(size / img.width, size / img.height) * avatarCrop.zoom;
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const dx = (size - drawWidth) / 2 + avatarCrop.offsetX * 2.8;
        const dy = (size - drawHeight) / 2 + avatarCrop.offsetY * 2.8;
        ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (e) {
        resolve(avatarCrop.source);
      }
    };
    img.onerror = () => resolve(avatarCrop.source);
    img.src = avatarCrop.source;
  });
};

const close = () => {
  appStore.isProfileEditOpen = false;
};

const handleSubmit = async () => {
  const handle = form.username.trim();
  appStore.profile.name = form.name.trim();
  appStore.profile.username = handle.startsWith('@') ? handle : `@${handle}`;
  appStore.profile.initials = form.initials.trim().toUpperCase();
  appStore.profile.bio = form.bio.trim();

  let finalAvatar = form.avatarUrl;
  if (avatarCrop.source) {
    finalAvatar = await generateAvatarCroppedDataUrl();
  }
  await appStore.syncAvatar(finalAvatar);

  appStore.showToast('個人資料已更新');
  close();
};
</script>


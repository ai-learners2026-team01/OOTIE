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
import { reactive, watch } from 'vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const form = reactive({
  name: '',
  username: '',
  initials: '',
  bio: ''
});

watch(
  () => appStore.isProfileEditOpen,
  (open) => {
    if (!open) return;
    form.name = appStore.profile.name;
    form.username = appStore.profile.username;
    form.initials = appStore.profile.initials;
    form.bio = appStore.profile.bio;
  }
);

const close = () => {
  appStore.isProfileEditOpen = false;
};

const handleSubmit = () => {
  const handle = form.username.trim();
  appStore.profile.name = form.name.trim();
  appStore.profile.username = handle.startsWith('@') ? handle : `@${handle}`;
  appStore.profile.initials = form.initials.trim().toUpperCase();
  appStore.profile.bio = form.bio.trim();
  appStore.showToast('個人資料已更新');
  close();
};
</script>

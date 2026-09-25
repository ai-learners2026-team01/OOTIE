<template>
  <div v-if="appStore.isItemFormOpen" class="modal-backdrop open" @click.self="close">
    <section class="modal form-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">{{ isEdit ? '編輯你的單品' : '新增單品' }}</p>
      <h2>{{ isEdit ? '編輯單品' : '加入衣櫥' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-field full">
          <label for="photoFile">上傳單品照片</label>
          <label class="upload-zone" for="photoFile">
            <strong>選擇一張單品照片</strong>
            <span>建議使用單件衣物照片，支援 JPG、PNG、WEBP</span>
            <input
              id="photoFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="handleFileChange"
            />
            <img
              :class="['upload-preview', { visible: photoPreview }]"
              :src="photoPreview"
              alt="照片預覽"
            />
          </label>
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label for="name">單品名稱</label>
            <input id="name" v-model="form.name" required placeholder="例如：亞麻襯衫" />
          </div>
          <div class="form-field">
            <label for="category">分類</label>
            <select id="category" v-model="form.category">
              <option value="Tops">上衣</option>
              <option value="Bottoms">下身</option>
              <option value="Dress">洋裝</option>
              <option value="Outerwear">外套</option>
              <option value="Shoes">鞋履</option>
              <option value="Bags">包款</option>
              <option value="Accessories">配件</option>
            </select>
          </div>
          <div class="form-field">
            <label for="brand">品牌</label>
            <input id="brand" v-model="form.brand" placeholder="選填" />
          </div>
          <div class="form-field">
            <label for="primary_color">主要顏色</label>
            <input id="primary_color" v-model="form.primary_color" required placeholder="例如：White" />
          </div>
          <div class="form-field">
            <label for="secondary_color">次要顏色</label>
            <input id="secondary_color" v-model="form.secondary_color" placeholder="選填，例如：Beige" />
          </div>
          <div class="form-field">
            <label for="shape">版型／款式</label>
            <input id="shape" v-model="form.shape" placeholder="例如：寬鬆版型" />
          </div>
          <div class="form-field">
            <label for="style">風格</label>
            <select id="style" v-model="form.style">
              <option value="Minimal">極簡</option>
              <option value="Casual">休閒</option>
              <option value="Smart Casual">簡約正式</option>
              <option value="Chic">時髦</option>
            </select>
          </div>
          <div class="form-field">
            <label for="season">適合季節</label>
            <select id="season" v-model="form.season">
              <option value="Spring / Summer">春夏</option>
              <option value="Autumn / Winter">秋冬</option>
              <option value="All year">四季</option>
            </select>
          </div>
          <div class="form-field full">
            <label for="notes">備註</label>
            <textarea id="notes" v-model="form.notes" placeholder="寫下這件單品的小筆記"></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="secondary" @click="close">取消</button>
          <button type="submit" class="primary">儲存到衣櫥</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { useClosetStore } from '@/stores/closet';

const appStore = useAppStore();
const closetStore = useClosetStore();

const isEdit = computed(() => !!appStore.editingItemId);

const photoPreview = ref('');
const form = reactive({
  name: '',
  category: 'Tops',
  brand: '',
  primary_color: 'White',
  secondary_color: '',
  shape: '',
  style: 'Casual',
  season: 'All year',
  notes: '',
  photo: ''
});

watch(
  () => appStore.isItemFormOpen,
  (open) => {
    if (!open) return;
    if (appStore.editingItemId) {
      const item = appStore.items.find((i) => i.id === appStore.editingItemId);
      if (item) {
        Object.assign(form, {
          name: item.name || '',
          category: item.category || 'Tops',
          brand: item.brand || '',
          primary_color: item.primary_color || 'White',
          secondary_color: item.secondary_color || '',
          shape: item.shape || '',
          style: item.style || 'Casual',
          season: item.season || 'All year',
          notes: item.notes || '',
          photo: item.photo || ''
        });
        photoPreview.value = item.photo || '';
      }
    } else {
      Object.assign(form, {
        name: '',
        category: 'Tops',
        brand: '',
        primary_color: 'White',
        secondary_color: '',
        shape: '',
        style: 'Casual',
        season: 'All year',
        notes: '',
        photo: ''
      });
      photoPreview.value = '';
    }
  }
);

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    form.photo = evt.target.result;
    photoPreview.value = evt.target.result;
  };
  reader.readAsDataURL(file);
};

const close = () => {
  appStore.isItemFormOpen = false;
};

const handleSubmit = () => {
  if (!isEdit.value && !form.photo) {
    appStore.showToast('請先上傳單品照片');
    return;
  }
  if (isEdit.value) {
    closetStore.updateItem(appStore.editingItemId, { ...form });
  } else {
    closetStore.addItem({ ...form });
  }
  close();
};
</script>

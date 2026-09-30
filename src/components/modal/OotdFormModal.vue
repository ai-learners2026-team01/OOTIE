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
              :style="{ objectFit: 'contain' }"
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
          <div class="tag-items-header">
            <label>標註衣櫥單品</label>
            <button
              type="button"
              class="text-button btn-add-tag-item"
              @click="isQuickAddOpen = !isQuickAddOpen"
            >
              {{ isQuickAddOpen ? '取消新增' : '＋ 新增單品到衣櫥' }}
            </button>
          </div>

          <!-- 快速新增單品內嵌表單 (方案 C) -->
          <div v-if="isQuickAddOpen" class="quick-add-item-box">
            <div class="quick-add-grid">
              <input
                v-model="quickItemName"
                class="quick-input"
                placeholder="單品名稱 (例如：杏色棉麻短褲)"
                @keydown.enter.prevent="handleQuickAddItem"
              />
              <select v-model="quickItemCategory" class="quick-select">
                <option value="Tops">上衣</option>
                <option value="Bottoms">下身</option>
                <option value="Dress">洋裝</option>
                <option value="Outerwear">外套</option>
                <option value="Shoes">鞋履</option>
                <option value="Bags">包款</option>
                <option value="Accessories">配件</option>
              </select>
              <button
                type="button"
                class="primary quick-add-btn"
                @click="handleQuickAddItem"
              >
                加入並標註
              </button>
            </div>

            <div class="quick-add-photo-options">
              <label class="photo-option-label" v-if="photoPreview || photo">
                <input type="checkbox" v-model="useOotdPhotoForNewItem" />
                <span>📷 直接使用本篇 OOTD 照片作為單品照片</span>
              </label>
              <div v-else class="quick-photo-hint">
                <span class="hint-text">💡 提示：先在上方選取 OOTD 照片，建立單品即可自動帶入照片！</span>
                <label class="custom-photo-btn" title="或是現在單獨為單品上傳照片">
                  <span>選取單品專屬照片</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style="display:none"
                    @change="handleQuickItemPhotoUpload"
                  />
                </label>
                <span v-if="quickItemCustomPhoto" class="custom-photo-name">✓ 已選取專屬照片</span>
              </div>
            </div>
          </div>

          <div class="tag-items">
            <div v-for="item in appStore.items" :key="item.id" class="tag-item">
              <label class="tag-item-label">
                <input
                  type="checkbox"
                  :value="item.id"
                  v-model="selectedItemIds"
                />
                <span>{{ item.name_zh || item.name }}</span>
              </label>
              <button
                type="button"
                class="tag-item-remove-btn"
                title="從衣櫥刪除此單品"
                aria-label="從衣櫥刪除此單品"
                @click.stop.prevent="handleRemoveItem(item)"
              >
                ×
              </button>
            </div>
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
import { useClosetStore } from '@/stores/closet';

const appStore = useAppStore();
const ootdStore = useOotdStore();
const closetStore = useClosetStore();

const photo = ref('');
const photoPreview = ref('');
const caption = ref('');
const hashtags = ref('');
const selectedItemIds = ref([]);

const isQuickAddOpen = ref(false);
const quickItemName = ref('');
const quickItemCategory = ref('Tops');
const useOotdPhotoForNewItem = ref(true);
const quickItemCustomPhoto = ref('');

const handleQuickItemPhotoUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    quickItemCustomPhoto.value = evt.target.result;
    appStore.showToast('已選取單品專屬照片');
  };
  reader.readAsDataURL(file);
};

const handleQuickAddItem = () => {
  const name = quickItemName.value.trim();
  if (!name) {
    appStore.showToast('請輸入單品名稱');
    return;
  }

  // 照片檢查：若未選取專屬照片，且沒有（或未勾選）OOTD 照片，則不匯入
  let itemPhoto = '';
  if (quickItemCustomPhoto.value) {
    itemPhoto = quickItemCustomPhoto.value;
  } else if (useOotdPhotoForNewItem.value && (photo.value || photoPreview.value)) {
    itemPhoto = photo.value || photoPreview.value;
  }

  if (!itemPhoto) {
    appStore.showToast('請先上傳 OOTD 照片或選取單品專屬照片，單品才可匯入衣櫥');
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const payload = {
    name,
    name_zh: name,
    category: quickItemCategory.value,
    photo: itemPhoto,
    // 穿搭發布匯入的衣服為當天現穿，穿著次數至少 2 次、最近穿著為當天，避免落入冷宮檢測
    wear_count: 2,
    last_worn: todayStr,
    purchase_date: todayStr
  };

  const created = closetStore.addItem(payload);
  if (created && created.id) {
    if (!selectedItemIds.value.includes(created.id)) {
      selectedItemIds.value.push(created.id);
    }
  }
  quickItemName.value = '';
  quickItemCustomPhoto.value = '';
  isQuickAddOpen.value = false;
};

const handleRemoveItem = (item) => {
  if (confirm(`確定要將「${item.name_zh || item.name}」從衣櫥刪除嗎？`)) {
    // 若已被選中，先從選取清單排除
    selectedItemIds.value = selectedItemIds.value.filter((id) => id !== item.id);
    // 從衣櫥刪除
    const index = appStore.items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      appStore.items.splice(index, 1);
      appStore.showToast('已從衣櫥刪除單品');
    }
  }
};

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

    // 檢查是否有由其他頁面 (如 Virtual Try-On) 帶入的預填資料
    if (ootdStore.prefillData) {
      photo.value = ootdStore.prefillData.image || '';
      photoPreview.value = ootdStore.prefillData.image || '';
      caption.value = ootdStore.prefillData.caption || '';
      hashtags.value = ootdStore.prefillData.hashtags || '#tryon #virtualtryon #ootd';
      selectedItemIds.value = ootdStore.prefillData.selectedItemIds || [];
      ootdStore.prefillData = null;
      return;
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


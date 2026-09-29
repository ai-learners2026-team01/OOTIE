<template>
  <div v-if="authStore.isAuthModalOpen" class="modal-backdrop open" @click.self="close" @keydown.esc="close">
    <section class="modal auth-modal" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      
      <div class="auth-header">
        <p class="eyebrow">Guest-First Access</p>
        <h2>{{ isLoginMode ? '歡迎回到 OOTie' : '加入 OOTie 社群' }}</h2>
        <p class="auth-subtitle">
          {{ isLoginMode ? '請登入以開啟衣櫥管理與私有互動功能' : '註冊帳號即可解鎖個人衣櫥、發文與 AI 試穿提案' }}
        </p>
      </div>

      <div class="auth-tabs">
        <button 
          type="button" 
          class="auth-tab" 
          :class="{ active: isLoginMode }" 
          @click="switchMode('login')"
        >
          登入
        </button>
        <button 
          type="button" 
          class="auth-tab" 
          :class="{ active: !isLoginMode }" 
          @click="switchMode('register')"
        >
          註冊
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="authStore.errorMsg" class="auth-error-alert">
          <span>⚠️ {{ authStore.errorMsg }}</span>
        </div>

        <div v-if="!isLoginMode" class="form-field">
          <label for="authFullName">全名 / 暱稱</label>
          <input
            id="authFullName"
            v-model="form.fullName"
            type="text"
            required
            placeholder="例如：Hayley Lin"
            @input="clearError"
          />
        </div>

        <div class="form-field">
          <label for="authEmail">電子郵件</label>
          <input
            id="authEmail"
            v-model="form.email"
            type="email"
            required
            placeholder="name@example.com"
            @input="clearError"
          />
        </div>

        <div class="form-field">
          <div class="field-header">
            <label for="authPassword">密碼</label>
            <button type="button" class="btn-toggle-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? '隱藏密碼' : '顯示密碼' }}
            </button>
          </div>
          <div class="input-wrap">
            <input
              id="authPassword"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="6"
              placeholder="請輸入至少 6 位字元密碼"
              @input="clearError"
            />
          </div>
        </div>

        <div class="demo-quick-box">
          <button type="button" class="btn-quick-demo" @click="fillDemoAccount">
            ⚡ 快速填入測試帳號 (demo@ootie.com)
          </button>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-ghost" @click="close">取消</button>
          <button type="submit" class="btn-primary" :disabled="authStore.loading">
            <span v-if="authStore.loading">處理中...</span>
            <span v-else>{{ isLoginMode ? '立即登入' : '完成註冊' }}</span>
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';

const authStore = useAuthStore();
const appStore = useAppStore();

const isLoginMode = computed(() => authStore.authMode === 'login');
const showPassword = ref(false);

const form = reactive({
  email: '',
  password: '',
  fullName: ''
});

const clearError = () => {
  if (authStore.errorMsg) {
    authStore.errorMsg = '';
  }
};

const switchMode = (mode) => {
  authStore.authMode = mode;
  authStore.errorMsg = '';
};

const close = () => {
  authStore.closeAuthModal();
};

const fillDemoAccount = () => {
  if (isLoginMode.value) {
    form.email = 'demo@ootie.com';
    form.password = 'password123';
  } else {
    form.fullName = 'OOTie 體驗會員';
    form.email = 'demo@ootie.com';
    form.password = 'password123';
  }
  clearError();
};

const syncUserProfile = () => {
  if (authStore.user) {
    if (authStore.user.user_metadata?.full_name) {
      appStore.profile.name = authStore.user.user_metadata.full_name;
      const names = authStore.user.user_metadata.full_name.trim().split(/\s+/);
      appStore.profile.initials = names.map(n => n[0].toUpperCase()).join('').slice(0, 2);
    }
    if (authStore.user.email) {
      appStore.profile.email = authStore.user.email;
      if (!appStore.profile.username || appStore.profile.username === '@hayley') {
        appStore.profile.username = `@${authStore.user.email.split('@')[0]}`;
      }
    }
  }
};

const handleSubmit = async () => {
  if (isLoginMode.value) {
    const success = await authStore.login(form.email, form.password);
    if (success) {
      syncUserProfile();
      appStore.showToast('登入成功！歡迎回來');
    }
  } else {
    const success = await authStore.register(form.email, form.password, form.fullName);
    if (success) {
      syncUserProfile();
      appStore.showToast('註冊成功！已正式登入');
    }
  }
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && authStore.isAuthModalOpen) {
    close();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.auth-modal {
  max-width: 440px;
  width: 90%;
  border-radius: 16px;
  background: var(--surface-card, #1c1c1e);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 32px 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.auth-header {
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent, #c9a96e);
  margin-bottom: 6px;
  font-weight: 600;
}

.auth-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted, #a0a0a5);
  line-height: 1.4;
}

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 8px;
}

.auth-tab {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-muted, #a0a0a5);
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-tab.active {
  background: var(--accent, #c9a96e);
  color: #111;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-error-alert {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-toggle-pwd {
  background: none;
  border: none;
  color: var(--accent, #c9a96e);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
}

.btn-toggle-pwd:hover {
  text-decoration: underline;
}

.form-field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-main, #e0e0e0);
}

.form-field input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.demo-quick-box {
  margin: -4px 0 4px;
}

.btn-quick-demo {
  background: rgba(201, 169, 110, 0.1);
  border: 1px dashed rgba(201, 169, 110, 0.4);
  color: var(--accent, #c9a96e);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-quick-demo:hover {
  background: rgba(201, 169, 110, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>

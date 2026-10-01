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
  width: min(100%, 440px);
  max-height: min(92vh, calc(100dvh - 32px));
  overflow-y: auto;
  border-radius: 16px;
  background: var(--paper);
  border: 1px solid var(--line);
  padding: 32px 28px;
  box-shadow: var(--shadow);
  color: var(--ink);
}

.auth-header {
  margin-bottom: 22px;
}

.eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--sage-dark);
  margin-bottom: 6px;
  font-weight: 600;
}

.auth-header h2 {
  font-family: "Nunito", sans-serif;
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--ink);
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.55;
  margin-bottom: 0;
}

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: #f0f2ec;
  padding: 4px;
  border-radius: 10px;
}

.auth-tab {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.auth-tab.active {
  background: var(--sage);
  color: var(--ink);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-error-alert {
  background: #f7e9e6;
  border: 1px solid #e8cbc5;
  color: #8f4c48;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.45;
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
  color: var(--sage-dark);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0 4px 8px;
}

.btn-toggle-pwd:hover {
  text-decoration: underline;
}

.form-field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.form-field input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink);
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}

.form-field input::placeholder {
  color: var(--muted);
  opacity: 0.8;
}

.form-field input:focus {
  border-color: var(--sage-dark);
  box-shadow: 0 0 0 3px rgba(168, 181, 162, 0.22);
}

.demo-quick-box {
  margin: -4px 0 4px;
}

.btn-quick-demo {
  background: #f0f2ec;
  border: 1px dashed var(--sage);
  color: var(--sage-dark);
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.4;
  width: 100%;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-quick-demo:hover {
  background: #e8ece3;
  border-color: var(--sage-dark);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.form-actions button {
  min-height: 42px;
  padding: 11px 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.form-actions .btn-ghost {
  border-color: var(--line);
  background: var(--white);
  color: var(--ink);
}

.btn-ghost:hover {
  background: #f0f2ec;
}

.form-actions .btn-primary {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--white);
}

.form-actions .btn-primary:hover:not(:disabled) {
  background: #383838;
}

.form-actions .btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.auth-modal button:focus-visible {
  outline: 2px solid var(--sage-dark);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .auth-modal {
    padding: 28px 20px 22px;
  }

  .auth-header h2 {
    font-size: 24px;
  }

  .form-actions {
    gap: 8px;
  }

  .form-actions button {
    flex: 1;
    min-width: 0;
    padding-inline: 12px;
  }
}
</style>

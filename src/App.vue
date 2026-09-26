<template>
  <div class="app">
    <!-- Sidebar -->
    <AppSidebar />

    <main>
      <!-- Topbar -->
      <AppTopbar />

      <!-- Page Views -->
      <router-view />
    </main>
  </div>

  <!-- Mobile Bottom Nav -->
  <AppBottomNav />

  <!-- Modals -->
  <AuthModal />
  <ItemDetailModal />
  <ItemFormModal />
  <OotdFormModal />
  <SosFormModal />
  <SuggestionModal />
  <SosDetailModal />
  <SosCloseConfirmModal />
  <CommentModal />
  <ProfileEditModal />
  <NotificationModal />

  <!-- Toast Message -->
  <BaseToast />
</template>

<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppBottomNav from '@/components/layout/AppBottomNav.vue';

import AuthModal from '@/components/modal/AuthModal.vue';
import ItemDetailModal from '@/components/modal/ItemDetailModal.vue';
import ItemFormModal from '@/components/modal/ItemFormModal.vue';
import OotdFormModal from '@/components/modal/OotdFormModal.vue';
import SosFormModal from '@/components/modal/SosFormModal.vue';
import SuggestionModal from '@/components/modal/SuggestionModal.vue';
import SosDetailModal from '@/components/modal/SosDetailModal.vue';
import SosCloseConfirmModal from '@/components/modal/SosCloseConfirmModal.vue';
import CommentModal from '@/components/modal/CommentModal.vue';
import ProfileEditModal from '@/components/modal/ProfileEditModal.vue';
import NotificationModal from '@/components/modal/NotificationModal.vue';

import BaseToast from '@/components/ui/BaseToast.vue';
</script>

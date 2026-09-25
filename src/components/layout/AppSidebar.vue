<template>
  <aside class="sidebar">
    <div class="brand">OOTie</div>
    <nav class="nav" aria-label="主選單">
      <router-link to="/">
        <span class="nav-icon">⌂</span>首頁
      </router-link>
      <router-link to="/closet">
        <span class="nav-icon">▦</span>我的衣櫥
      </router-link>
      <router-link to="/explore">
        <span class="nav-icon">✦</span>探索
      </router-link>
      <router-link to="/sos">
        <span class="nav-icon">♡</span>穿搭求救
      </router-link>
      <router-link to="/profile">
        <span class="nav-icon">◯</span>個人檔案
      </router-link>
    </nav>
    <div class="sidebar-footer">
      你的衣櫥，是每天選擇穿搭的<br />專屬空間。
    </div>
  </aside>
</template>

<script setup>
</script>

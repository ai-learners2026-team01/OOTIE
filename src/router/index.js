import { createRouter, createWebHistory } from 'vue-router';

const HomeView = () => import('@/views/HomeView.vue');
const ClosetView = () => import('@/views/ClosetView.vue');
const ExploreView = () => import('@/views/ExploreView.vue');
const SosView = () => import('@/views/SosView.vue');
const ProfileView = () => import('@/views/ProfileView.vue');
const OotdDetailView = () => import('@/views/OotdDetailView.vue');
const StatsView = () => import('@/views/StatsView.vue');
const AiView = () => import('@/views/AiView.vue');
const TryonView = () => import('@/views/TryonView.vue');
const BookmarksView = () => import('@/views/BookmarksView.vue');

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/home', redirect: '/' },
  { path: '/closet', name: 'Closet', component: ClosetView },
  { path: '/bookmarks', name: 'Bookmarks', component: BookmarksView },
  { path: '/stats', name: 'Stats', component: StatsView },
  { path: '/explore', name: 'Explore', component: ExploreView },
  { path: '/sos', name: 'Sos', component: SosView },
  { path: '/ai', name: 'Ai', component: AiView },
  { path: '/tryon', name: 'Tryon', component: TryonView },
  { path: '/profile', name: 'Profile', component: ProfileView },
  { path: '/ootd/:id', name: 'OotdDetail', component: OotdDetailView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

// 訪客保護守衛：未登入時僅開放探索功能與 OOTD 詳情頁，訪問其餘頁面導向探索並提示登入
router.beforeEach(async (to, from, next) => {
  // 開放白名單
  const publicPaths = ['/explore'];
  const isPublicProfile = to.path === '/profile' && typeof to.query.user === 'string' && Boolean(to.query.user.trim());
  const isPublicCloset = to.path === '/closet' && typeof to.query.user === 'string' && Boolean(to.query.user.trim());
  const isPublicRoute = publicPaths.includes(to.path) || to.path.startsWith('/ootd/') || isPublicProfile || isPublicCloset;

  if (isPublicRoute) {
    return next();
  }

  try {
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    if (typeof authStore.initAuth === 'function') {
      await authStore.initAuth();
    }

    if (authStore.isLoggedIn) {
      return next();
    }

    // 尚未登入：導向 /explore 並彈出登入視窗
    authStore.openAuthModal('login', () => {
      router.push(to.fullPath);
    });
    return next({ path: '/explore' });
  } catch (err) {
    return next();
  }
});

export default router;

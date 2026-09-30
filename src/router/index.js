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

export default router;

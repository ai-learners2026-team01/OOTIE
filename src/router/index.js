import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import ClosetView from '@/views/ClosetView.vue';
import ExploreView from '@/views/ExploreView.vue';
import SosView from '@/views/SosView.vue';
import ProfileView from '@/views/ProfileView.vue';
import OotdDetailView from '@/views/OotdDetailView.vue';
import StatsView from '@/views/StatsView.vue';
import AiView from '@/views/AiView.vue';
import TryonView from '@/views/TryonView.vue';
import BookmarksView from '@/views/BookmarksView.vue';

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

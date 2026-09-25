import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import ClosetView from '@/views/ClosetView.vue';
import ExploreView from '@/views/ExploreView.vue';
import SosView from '@/views/SosView.vue';
import ProfileView from '@/views/ProfileView.vue';

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/home', redirect: '/' },
  { path: '/closet', name: 'Closet', component: ClosetView },
  { path: '/explore', name: 'Explore', component: ExploreView },
  { path: '/sos', name: 'Sos', component: SosView },
  { path: '/profile', name: 'Profile', component: ProfileView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;

import { createRouter, createWebHistory } from 'vue-router';
import FixtureApp from './FixtureApp.vue';
import SosView from '@/views/SosView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/sos', component: SosView },
    { path: '/:pathMatch(.*)*', redirect: '/sos?sos_mode=fixture' }
  ]
});
export default FixtureApp;

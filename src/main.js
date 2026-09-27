import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { getSosMode } from './features/sos/mode';

import '@/assets/main.css';

async function bootstrap() {
  // Fixture is a separate import graph, so Auth and other modules never start remote requests.
  const entry = getSosMode() === 'FIXTURE'
    ? await import('./features/sos/fixtureEntry')
    : { ...(await import('./App.vue')), router: (await import('./router')).default };
  const app = createApp(entry.default);
  app.use(createPinia());
  app.use(entry.router);
  await entry.router.isReady();
  app.mount('#app');
}
bootstrap();

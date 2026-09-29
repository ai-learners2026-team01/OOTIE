import { mergeConfig } from 'vitest/config';
import base from '../../vite.config';
import { fileURLToPath } from 'node:url';

export default mergeConfig(base, {
  test: { setupFiles: [fileURLToPath(new URL('./offline.setup.js', import.meta.url))] }
});

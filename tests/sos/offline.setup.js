import { vi, beforeEach, afterEach } from 'vitest';

// All suite traffic stays in-process. This runner does not verify live Supabase behavior.
const offlineFetch = async () => new Response(JSON.stringify({ message: 'Offline regression test: backend disabled' }), {
  status: 503, headers: { 'Content-Type': 'application/json' }
});
vi.stubGlobal('fetch', offlineFetch);
beforeEach(() => { vi.stubGlobal('fetch', offlineFetch); });
afterEach(() => { vi.useRealTimers(); });

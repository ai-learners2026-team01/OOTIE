// Uses an existing Playwright installation. No npm install or live backend access.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.SOS_TEST_URL || 'http://127.0.0.1:5192';
const output = resolve(process.env.SOS_ARTIFACT_DIR || 'tests/sos/results.local');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.SOS_BROWSER_CHANNEL || 'msedge', headless: true });
const report = { fixtureRequests: { GET: 0, POST: 0, PATCH: 0, DELETE: 0 }, fixtureErrors: [], checks: [] };
const check = name => { report.checks.push(name); console.log(`PASS ${name}`); };
const remotePattern = /supabase\.co|\/rest\/v1\/|\/auth\/v1\//;

try {
  const context = await browser.newContext({ viewport: { width: 1365, height: 960 } });
  // Count attempted requests even though the test would block them from reaching a backend.
  context.on('request', request => {
    if (remotePattern.test(request.url())) report.fixtureRequests[request.method()] = (report.fixtureRequests[request.method()] || 0) + 1;
  });
  await context.route('**/*', route => {
    const url = route.request().url();
    return url.startsWith(base) || url.startsWith('data:') ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.fixtureErrors.push(error.message));
  const fixtureUrl = `${base}/sos?sos_mode=fixture`;
  await page.goto(fixtureUrl);
  await page.getByText('FIXTURE · 多人體驗', { exact: true }).waitFor();
  await page.evaluate(() => localStorage.setItem('weary-app-state-v1', '{"marker":"keep-my-closet"}'));
  await page.reload();
  await page.getByText('FIXTURE · 多人體驗', { exact: true }).waitFor();
  const original = await page.evaluate(() => localStorage.getItem('weary-app-state-v1'));
  assert.equal(await page.locator('.sos-feed-card').count(), 2);
  await page.screenshot({ path: resolve(output, 'fixture-desktop.png'), fullPage: true });
  check('Fixture boot/reload and Community board');

  // The initial requester view must render bundled photos and usable compare filters.
  await page.getByRole('button', { name: /我發出的求救/ }).click();
  await page.locator('[data-sos-id="fixture-sos-1"]').getByRole('button', { name: '查看詳情' }).click();
  const seededDetail = page.locator('.sos-detail-modal');
  await seededDetail.waitFor();
  assert.equal(await seededDetail.locator('.sos-compare-grid .sos-suggestion-card').count(), 2);
  await seededDetail.locator('.sos-outfit-photo img').first().waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.sos-detail-modal .sos-outfit-photo img')].every(image => image.complete && image.naturalWidth > 0));
  assert.equal(await seededDetail.locator('.sos-outfit-photo img').first().evaluate(image => getComputedStyle(image).objectFit), 'contain');
  assert.equal(await seededDetail.locator('.sos-outfit-group[data-category="bags"]').count(), 1);
  await seededDetail.locator('.sos-suggestion-filters button').nth(1).click();
  assert.equal(await seededDetail.locator('.sos-suggestion-card').count(), 1);
  assert.equal(await seededDetail.locator('.sos-suggestion-card').getAttribute('data-suggestion-id'), 'fixture-suggestion-a');
  await seededDetail.locator('.sos-suggestion-filters button').nth(2).click();
  assert.equal(await seededDetail.locator('.sos-suggestion-card').count(), 1);
  assert.equal(await seededDetail.locator('.sos-suggestion-card').getAttribute('data-suggestion-id'), 'fixture-suggestion-b');
  assert.equal(await seededDetail.getByText('徵求搭配中', { exact: true }).count(), 1);
  await seededDetail.locator('.sos-suggestion-filters button').first().click();
  await seededDetail.locator('.sos-outfit-board').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, 'fixture-outfit-compare.png'), fullPage: true });
  await seededDetail.getByRole('button', { name: '關閉視窗' }).click();
  await page.getByRole('button', { name: /衣友求救板/ }).click();
  await page.locator('[data-sos-id="fixture-sos-3"]').getByRole('button', { name: '查看詳情' }).click();
  await seededDetail.locator('.sos-outfit-group[data-category="dress"]').waitFor();
  assert.equal(await seededDetail.locator('.sos-outfit-group[data-category="accessories"]').count(), 1);
  await seededDetail.locator('.sos-outfit-board').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, 'fixture-dress-board.png'), fullPage: true });
  await seededDetail.getByRole('button', { name: '關閉視窗' }).click();
  check('Bundled photos, head-to-toe board, dress layout, All/Liked/Adopted compare and adopted OPEN');

  // Role A publishes; only the selected two owned items are exposed.
  await page.getByTestId('sos-publish').click();
  const publish = page.getByRole('dialog', { name: '發布穿搭求救' });
  await publish.locator('#sosTitle').fill('週末看展，想要輕鬆有精神');
  await publish.locator('#sosDetails').fill('會走很多路，晚上偏涼，想用現有衣服搭得舒服。');
  await publish.locator('.sos-share-items input[value="fixture-a-shirt"]').check();
  await publish.locator('.sos-share-items input[value="fixture-a-pants"]').check();
  await publish.getByRole('button', { name: '發布求救', exact: true }).click();
  await publish.waitFor({ state: 'hidden' });
  const newId = await page.locator('.sos-feed-card').filter({ hasText: '週末看展，想要輕鬆有精神' }).getAttribute('data-sos-id');
  assert.ok(newId);
  check('Publish owned selection → Sent SOS');

  // B provides a suggestion and a comment, with no private items visible.
  await page.locator('#sos-fixture-profile').selectOption('fixture-b');
  const card = page.locator(`[data-sos-id="${newId}"]`);
  await card.getByRole('button', { name: '幫忙搭配', exact: true }).click();
  const suggestion = page.getByRole('dialog', { name: '提供搭配建議' });
  assert.equal(await suggestion.locator('.suggestion-items input').count(), 2);
  await suggestion.locator('.suggestion-items input').first().check();
  await suggestion.locator('.suggestion-items input').nth(1).check();
  await suggestion.locator('#suggestionMessage').fill('襯衫紮一半搭深藍褲，晚上加外套就很舒服。');
  await suggestion.getByRole('button', { name: '送出建議', exact: true }).click();
  await suggestion.waitFor({ state: 'hidden' });
  const detail = page.locator('.sos-detail-modal');
  await detail.waitFor();
  await detail.locator('#sos-comment-input').fill('看展記得穿好走的鞋。');
  await detail.getByRole('button', { name: '送出留言', exact: true }).click();
  await detail.getByText('看展記得穿好走的鞋。', { exact: true }).waitFor();
  assert.equal(await detail.locator('.sos-suggestion-card').count(), 1);
  await detail.getByRole('button', { name: /喜歡 @ella 的搭配/ }).click();
  await detail.getByRole('button', { name: /取消喜歡 @ella 的搭配/ }).waitFor();
  await detail.getByRole('button', { name: '關閉視窗' }).click();
  assert.equal(await card.getByRole('button', { name: '已提供建議' }).isDisabled(), true);
  check('Role B: public-only Suggestion / Comment / Like / duplicate UI');

  // C has an independent like and cannot close/adopt somebody else's SOS.
  await page.locator('#sos-fixture-profile').selectOption('fixture-c');
  await page.locator(`[data-sos-id="${newId}"]`).getByRole('button', { name: '查看詳情' }).click();
  await detail.waitFor();
  assert.equal(await detail.getByRole('button', { name: /採用 @ella 的搭配/ }).count(), 0);
  await detail.getByRole('button', { name: /喜歡 @ella 的搭配/ }).click();
  await detail.getByRole('button', { name: /取消喜歡 @ella 的搭配/ }).waitFor();
  await page.keyboard.press('Escape');
  await detail.waitFor({ state: 'hidden' });
  await page.reload();
  assert.equal(await page.locator('#sos-fixture-profile').inputValue(), 'fixture-c');
  check('Role C: independent likes, no owner controls, Escape and role persistence');

  // A sees notifications, adopts while OPEN, then explicitly closes.
  await page.locator('#sos-fixture-profile').selectOption('fixture-a');
  await page.getByRole('button', { name: /互動通知/ }).click();
  const inbox = page.getByRole('dialog', { name: 'SOS 互動通知' });
  await inbox.getByRole('button', { name: /提供了一套搭配/ }).click();
  await detail.waitFor();
  await page.waitForURL(url => url.searchParams.has('suggestion'));
  assert.ok(page.url().includes('suggestion='));
  assert.equal(await detail.locator('.is-highlighted').count(), 1);
  await detail.getByRole('button', { name: /採用 @ella 的搭配/ }).click();
  await detail.getByText('✓ 已採用').waitFor();
  assert.ok(await detail.getByText('徵求搭配中', { exact: true }).count());
  await detail.getByRole('button', { name: '結束這次求救', exact: true }).click();
  const close = page.getByRole('dialog', { name: '結束這次求救', exact: true });
  await close.getByRole('button', { name: '確認結束' }).click();
  await close.waitFor({ state: 'hidden' });
  await detail.getByText('已結束', { exact: true }).waitFor();
  assert.equal(await detail.locator('#sos-comment-input').count(), 0);
  await page.reload();
  await detail.waitFor();
  await detail.getByText('✓ 已採用').waitFor();
  await detail.getByText('看展記得穿好走的鞋。', { exact: true }).waitFor();
  check('Notification → highlighted detail, Adopt stays OPEN, explicit Close, reload retained');

  await detail.getByRole('button', { name: '關閉視窗' }).click();
  await page.getByRole('button', { name: /我發出的求救/ }).click();
  await page.getByLabel('篩選求救狀態').selectOption('CLOSED');
  assert.equal(await page.locator(`[data-sos-id="${newId}"]`).count(), 1);
  await page.locator('#sos-fixture-profile').selectOption('fixture-b');
  assert.equal(await page.locator(`[data-sos-id="${newId}"]`).count(), 0);
  check('CLOSED retained in owner history and hidden from Community');

  // Mobile layout + focus trapping in a form.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#sos-fixture-profile').selectOption('fixture-a');
  await page.getByRole('button', { name: /我發出的求救/ }).click();
  await page.locator('[data-sos-id="fixture-sos-1"]').getByRole('button', { name: '查看詳情' }).click();
  await detail.locator('.sos-outfit-board').first().scrollIntoViewIfNeeded();
  assert.equal(await detail.locator('.sos-compare-grid .sos-suggestion-card').count(), 2);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.equal(await detail.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
  await page.screenshot({ path: resolve(output, 'fixture-mobile-outfit.png'), fullPage: true });
  await detail.getByRole('button', { name: '關閉視窗' }).click();
  await page.getByTestId('sos-publish').click();
  await publish.waitFor();
  await publish.locator('#sosTitle').fill('手機版測試');
  await publish.locator('#sosDetails').fill('手機上也能選擇衣物');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.equal(await publish.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
  await page.screenshot({ path: resolve(output, 'fixture-mobile-form.png'), fullPage: true });
  await publish.getByRole('button', { name: '發布求救', exact: true }).focus();
  await page.keyboard.press('Tab');
  assert.equal(await publish.getByRole('button', { name: '關閉視窗' }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Escape');
  await publish.waitFor({ state: 'hidden' });
  await page.screenshot({ path: resolve(output, 'fixture-mobile-board.png'), fullPage: true });
  check('390px board/form, no horizontal overflow, focus trap and Escape');

  await page.getByRole('button', { name: '重設體驗', exact: true }).click();
  await page.getByRole('button', { name: '確認重設', exact: true }).click();
  await page.reload();
  assert.equal(await page.evaluate(id => JSON.parse(localStorage.getItem('ootie-fixture-world-v1')).sosPosts.some(p => p.id === id), newId), false);
  assert.equal(await page.evaluate(() => localStorage.getItem('weary-app-state-v1')), original);
  assert.deepEqual(report.fixtureRequests, { GET: 0, POST: 0, PATCH: 0, DELETE: 0 });
  assert.deepEqual(report.fixtureErrors, []);
  check('Reset preserves main app storage; Fixture Supabase GET/POST/PATCH/DELETE = 0; no page errors');
  await context.close();

  // Normal app: prevent any live backend calls; this verifies UI contracts, not production DB.
  const normal = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  report.normalErrors = [];
  report.blockedNormalBackendRequests = 0;
  await normal.route('**/*', route => {
    const url = route.request().url();
    if (remotePattern.test(url)) {
      report.blockedNormalBackendRequests++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return url.startsWith(base) || url.startsWith('data:') ? route.continue() : route.abort();
  });
  const normalPage = await normal.newPage();
  normalPage.on('pageerror', error => report.normalErrors.push(error.message));
  await normalPage.goto(`${base}/sos?item_id=1`);
  await normalPage.getByRole('heading', { name: '穿搭求救', exact: true }).waitFor();
  assert.equal(await normalPage.getByTestId('sos-publish').isEnabled(), false);
  assert.equal(await normalPage.locator('.sos-dialog').count(), 0);
  assert.equal(normalPage.url().includes('item_id='), false);
  check('Formal SOS consumes Closet target without enabling an unauthorized write');
  for (const path of ['/', '/closet', '/explore', '/profile', '/sos']) {
    await normalPage.goto(`${base}${path}`);
    await normalPage.locator('.page.active').first().waitFor();
    assert.equal(await normalPage.locator('.sos-dialog').count(), 0);
  }
  assert.deepEqual(report.normalErrors, []);
  check('Normal Home/Closet/Explore/Profile/SOS routes render without page errors (backend mocked)');
  await normalPage.screenshot({ path: resolve(output, 'local-desktop.png'), fullPage: true });
  await normal.close();
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.error = error.message;
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}

/**
 * Learn With Hamster — UI Screenshot Script
 *
 * Captures all key screens for README / LinkedIn use.
 * Run after the full stack is up:
 *   node scripts/take-screenshots.mjs
 *
 * Output: docs/screenshots/*.png
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE = 'http://localhost:8081';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE  = { width: 390,  height: 844 };

await mkdir(OUT, { recursive: true });

// ── Auth helpers ─────────────────────────────────────────────────────────────
async function getToken(username, password) {
  const res = await fetch(`${BASE}/api/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe: true }),
  });
  if (!res.ok) throw new Error(`Auth failed for ${username}: ${res.status}`);
  const data = await res.json();
  return data.id_token;
}

// JWT is stored as HttpOnly cookie named 'jwt-token' — inject directly
async function setAuthCookie(ctx, token) {
  await ctx.addCookies([{
    name: 'jwt-token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  }]);
}

// ── Screenshot helper ─────────────────────────────────────────────────────────
async function shot(page, filename, { waitFor, fullPage = false, delay = 0 } = {}) {
  try {
    if (waitFor) await page.waitForSelector(waitFor, { timeout: 12_000 }).catch(() => {});
    if (delay)   await page.waitForTimeout(delay);
    // Block web fonts to let document.fonts.ready resolve immediately
    await page.evaluate(() => {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {});
      return Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 5000))]);
    }).catch(() => {});
    const file = path.join(OUT, filename);
    await page.screenshot({ path: file, fullPage, timeout: 120_000 });
    console.log(`  ✓  ${filename}`);
  } catch (e) {
    console.log(`  ✗  ${filename} — ${e.message.split('\n')[0]}`);
  }
}

// ── Block fonts so document.fonts.ready resolves immediately ─────────────────
async function blockFonts(ctx) {
  await ctx.route('**/*.{woff,woff2,ttf,eot}', route => route.abort());
}

// ── Navigate helper (never throws) ────────────────────────────────────────────
async function go(page, url, waitFor) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (waitFor) await page.waitForSelector(waitFor, { timeout: 12_000 }).catch(() => {});
    await page.waitForTimeout(800);
  } catch (e) {
    console.log(`  ! navigation failed: ${url} — ${e.message.split('\n')[0]}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
console.log('\n📸 Capturing screens…\n');

// Fetch tokens up front
let userToken, adminToken;
try {
  userToken  = await getToken('user', 'user');
  adminToken = await getToken('admin', 'admin');
  console.log('  ✓  Tokens obtained\n');
} catch (e) {
  console.error('  ✗  Could not authenticate:', e.message);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });

// ────────────────────────────────────────────────────────────────────────────
// Context A — anonymous (no auth)
// ────────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  await blockFonts(ctx);
  const page = await ctx.newPage();

  // 1 — Hero (logged out)
  await go(page, BASE);
  await shot(page, '01-hero-logged-out.png', { waitFor: '.hero-title' });

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// Context B — user (authenticated)
// ────────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  await blockFonts(ctx);
  await setAuthCookie(ctx, userToken);
  const page = await ctx.newPage();

  // 2 — Home dashboard (desktop)
  await go(page, BASE);
  await shot(page, '02-home-dashboard.png', { waitFor: '.stats-grid', delay: 2200 });

  // 2b — Home dashboard (mobile) — resize viewport
  await ctx.close();
  const mCtx = await browser.newContext({ viewport: MOBILE });
  await blockFonts(mCtx);
  await setAuthCookie(mCtx, userToken);
  const mPage = await mCtx.newPage();
  await go(mPage, BASE);
  await shot(mPage, '02-home-dashboard-mobile.png', { waitFor: '.stats-grid', delay: 2200 });
  await mCtx.close();
}

{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  await blockFonts(ctx);
  await setAuthCookie(ctx, userToken);
  const page = await ctx.newPage();

  // 3 — Catalog
  await go(page, `${BASE}/catalog`, '.discipline-card, .browse-hero');
  await shot(page, '03-catalog.png', { delay: 400 });

  // 4 — Discipline detail (Technology)
  await go(page, `${BASE}/catalog/discipline/3`, '.course-card, .browse-hero');
  await shot(page, '04-discipline-detail.png', { delay: 400 });

  // 5 — Course page (full curriculum)
  await go(page, `${BASE}/catalog/course/6`, '.curriculum-section, .browse-hero');
  await shot(page, '05-course-page.png', { delay: 500, fullPage: true });

  // 6 — Lesson page
  await go(page, `${BASE}/catalog/lesson/26?course=6`, '.lesson-hero, .lesson-content');
  await shot(page, '06-lesson-page.png', { delay: 500 });

  // 7 — My Learning
  await go(page, `${BASE}/my-learning`, '.my-learning-content, .my-learning-hero');
  await shot(page, '07-my-learning.png', { delay: 600, fullPage: true });

  // 8 — Cart: add item then navigate to cart
  await go(page, `${BASE}/catalog/course/2`, '.course-browse');
  try {
    const addBtn = page.locator('button:has-text("Add to Cart"), .btn-cart').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) await addBtn.click();
  } catch { /* ignore */ }
  await go(page, `${BASE}/cart`, '.cart-page');
  await shot(page, '08-cart.png', { delay: 300 });

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// Context C — admin
// ────────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  await blockFonts(ctx);
  await setAuthCookie(ctx, adminToken);
  const page = await ctx.newPage();

  // 9 — Home (admin view)
  await go(page, BASE);
  await shot(page, '09-home-admin.png', { waitFor: '.admin-section', delay: 1800 });

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// Context D — mobile catalog
// ────────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: MOBILE });
  await blockFonts(ctx);
  await setAuthCookie(ctx, userToken);
  const page = await ctx.newPage();

  // 10 — Catalog (mobile)
  await go(page, `${BASE}/catalog`, '.discipline-card, .browse-hero');
  await shot(page, '10-catalog-mobile.png', { delay: 400 });

  await ctx.close();
}

await browser.close();

console.log(`\n✅  Screenshots saved to docs/screenshots/\n`);

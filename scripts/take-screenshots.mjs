/**
 * Learn With Hamster — UI Screenshot Script
 *
 * Captures all key screens for README / LinkedIn use.
 * Run after the full stack is up:
 *   node scripts/take-screenshots.mjs
 *
 * Output: docs/screenshots/*.png
 */

import { createRequire } from 'module';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Puppeteer is installed in gateway/node_modules — use createRequire to load it
const _require = createRequire(path.join(__dirname, '..', 'gateway', 'package.json'));
const puppeteer = _require('puppeteer');

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

// Inject JWT cookie directly into the page
async function setAuthCookie(page, token) {
  await page.setCookie({
    name: 'jwt-token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  });
}

// ── Screenshot helper ─────────────────────────────────────────────────────────
async function shot(page, filename, { waitFor, fullPage = false, delay = 0 } = {}) {
  try {
    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 12_000 }).catch(() => {});
    }
    if (delay) await sleep(delay);
    // Wait for fonts
    await page.evaluate(() =>
      Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 3000))])
    ).catch(() => {});
    const file = path.join(OUT, filename);
    await page.screenshot({ path: file, fullPage });
    console.log(`  ✓  ${filename}`);
  } catch (e) {
    console.log(`  ✗  ${filename} — ${e.message.split('\n')[0]}`);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Navigate helper (never throws) ────────────────────────────────────────────
async function go(page, url, waitFor) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (waitFor) await page.waitForSelector(waitFor, { timeout: 12_000 }).catch(() => {});
    await sleep(800);
  } catch (e) {
    console.log(`  ! navigation failed: ${url} — ${e.message.split('\n')[0]}`);
  }
}

// ── New page helper (desktop or mobile) ───────────────────────────────────────
async function newPage(browser, viewport, token) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  // Block web fonts so document.fonts.ready resolves immediately
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (/\.(woff2?|ttf|eot)(\?.*)?$/.test(req.url())) {
      req.abort();
    } else {
      req.continue();
    }
  });
  if (token) await setAuthCookie(page, token);
  return page;
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

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

// ────────────────────────────────────────────────────────────────────────────
// 1 — Hero (anonymous, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, null);
  await go(page, BASE);
  await shot(page, '01-hero-logged-out.png', { waitFor: '.hero-title', delay: 1500 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 1b — Hero with scroll open (anonymous, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, null);
  await go(page, BASE);
  await page.waitForSelector('.hero-title', { timeout: 12_000 }).catch(() => {});
  await sleep(3500); // let the book auto-open animation settle
  // Try to click the book to open it if it has a trigger
  await page.evaluate(() => {
    const el = document.querySelector('.book-container, .scroll-book, jhi-scroll-three, jhi-book-three');
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(1200);
  await shot(page, '01b-hero-scroll-open.png', { fullPage: false });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 2 — Home dashboard (user, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, userToken);
  await go(page, BASE);
  await shot(page, '02-home-dashboard.png', { waitFor: '.stats-grid', delay: 2200 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 2b — Home dashboard (user, mobile)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, MOBILE, userToken);
  await go(page, BASE);
  await shot(page, '02-home-dashboard-mobile.png', { waitFor: '.stats-grid', delay: 2200 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 3 — Catalog (user, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, userToken);
  await go(page, `${BASE}/catalog`, '.discipline-card, .browse-hero');
  await shot(page, '03-catalog.png', { delay: 400 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 4 — Discipline detail (Technology, user, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, userToken);
  await go(page, `${BASE}/catalog/discipline/3`, '.course-card, .browse-hero');
  await shot(page, '04-discipline-detail.png', { delay: 400 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 5 — Course page — full curriculum (user, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, userToken);
  await go(page, `${BASE}/catalog/course/6`, '.curriculum-section, .browse-hero');
  await shot(page, '05-course-page.png', { delay: 500, fullPage: true });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 6 — Lesson viewer (user, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, userToken);
  await go(page, `${BASE}/catalog/lesson/26?course=6`, '.lesson-hero, .lesson-content');
  await shot(page, '06-lesson-page.png', { delay: 500 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 7 — My Learning (user, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, userToken);
  await go(page, `${BASE}/my-learning`, '.my-learning-content, .my-learning-hero');
  await shot(page, '07-my-learning.png', { delay: 600, fullPage: true });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 8 — Cart (user, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, userToken);
  // Add a paid course to the cart first
  await go(page, `${BASE}/catalog/course/2`, '.course-browse');
  try {
    const addBtn = await page.$('button[class*="cart"], .btn-cart');
    if (addBtn) await addBtn.click();
  } catch { /* ignore */ }
  await go(page, `${BASE}/cart`, '.cart-page');
  await shot(page, '08-cart.png', { delay: 300 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 9 — Home (admin view, desktop)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, adminToken);
  await go(page, BASE);
  await shot(page, '09-home-admin.png', { waitFor: '.admin-section', delay: 1800 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 10 — Catalog (mobile)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, MOBILE, userToken);
  await go(page, `${BASE}/catalog`, '.discipline-card, .browse-hero');
  await shot(page, '10-catalog-mobile.png', { delay: 400 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 11 — Admin manage content (disciplines list)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, adminToken);
  await go(page, `${BASE}/discipline`, 'table, .entity-list, .alert-info');
  await shot(page, '11-admin-disciplines.png', { delay: 400 });
  await page.close();
}

// ────────────────────────────────────────────────────────────────────────────
// 12 — Login page (anonymous)
// ────────────────────────────────────────────────────────────────────────────
{
  const page = await newPage(browser, DESKTOP, null);
  await go(page, `${BASE}/login`, 'form, .login-page, input[type="text"]');
  await shot(page, '12-login-page.png', { delay: 300 });
  await page.close();
}

await browser.close();

console.log(`\n✅  Screenshots saved to docs/screenshots/\n`);

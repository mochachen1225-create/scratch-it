import { chromium } from 'playwright';
import fs from 'fs';
// 用法：OUT=資料夾 FONT=Huninn 字型資料夾 LANGX=zh|en node tools/promo/capture.mjs（要先有 Playwright）
const R = new URL('../..', import.meta.url).pathname, OUT = process.env.OUT || new URL('./shots/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const FONT = process.env.FONT || '';
const L = process.env.LANGX || 'zh';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, timezoneId: 'Asia/Taipei' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(l => { localStorage.setItem('scratch-it-lang', l); }, L);
await p.route('**/*', r => {
  const u = new URL(r.request().url());
  if (u.host === 'game.local') { const f = u.pathname === '/' ? '/index.html' : u.pathname; const ct = f.endsWith('.js') ? 'application/javascript' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.png') ? 'image/png' : f.endsWith('.mp3') ? 'audio/mpeg' : 'text/html'; return r.fulfill({ contentType: ct, body: fs.readFileSync(R + f) }); }
  if (u.host === 'fonts.googleapis.com') return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(FONT + 'huninn.css') });
  if (u.host === 'fonts.gstatic.com') return r.fulfill({ contentType: 'font/ttf', body: fs.readFileSync(FONT + 'huninn.ttf') });
  return r.abort();
});
await p.goto('http://game.local/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const setSave = o => p.evaluate(o => localStorage.setItem('scratch-it-save', JSON.stringify({ unlocked: ['cardboard', 'bubble', 'sofa'], paintings: 9, love: { orange: 30, grey: 30, white: 30 }, texV: 2, tex: 'code', ...o })), o);
const sweep = async (y, x0 = 30, x1 = 360, steps = 26) => { await p.mouse.move(x0, y); await p.mouse.down(); await p.mouse.move(x1, y + 10, { steps }); await p.mouse.up(); };
const start = async (card) => { await p.reload(); await p.waitForTimeout(500); if (card) await p.evaluate(id => { window.pickCard = () => CARDS.find(c => c.id === id); }, card); await p.click('#startBtn'); await p.waitForSelector('#play.active'); await p.evaluate(() => { G.distracted = true; G.zoomAt = Infinity; G.zoomP = 9; G.nextBurst = Infinity; }); };
// 1 瓦楞紙長條抓痕（總編），手指按著
await setSave({ mat: 'cardboard', cat: 'orange' }); await start('chief_treat');
for (const y of [200, 236, 272, 400, 436, 472, 508, 620, 656]) await sweep(y);
await p.mouse.move(60, 560); await p.mouse.down(); await p.mouse.move(250, 566, { steps: 14 }); await p.waitForTimeout(120);
await p.screenshot({ path: OUT + `s1-${L}.png` }); await p.mouse.up(); await p.click('#quitBtn');
// 2 泡泡紙（小弟）
await setSave({ mat: 'bubble', cat: 'white' }); await start('box_trio');
for (const y of [180, 230, 300, 360, 430, 520, 580]) await sweep(y, 20, 370, 20);
await p.mouse.move(80, 650); await p.mouse.down(); await p.mouse.move(260, 640, { steps: 10 }); await p.waitForTimeout(100);
await p.screenshot({ path: OUT + `s2-${L}.png` }); await p.mouse.up(); await p.click('#quitBtn');
// 3 沙發裂開露棉花（架構師）
await setSave({ mat: 'sofa', cat: 'grey' }); await start('arch_cup');
for (let r = 0; r < 9; r++) for (const y of [260, 300, 340, 520, 560]) await sweep(y, 40, 350, 30);
await p.mouse.move(120, 420); await p.mouse.down(); await p.mouse.move(300, 430, { steps: 20 }); await p.waitForTimeout(250);
await p.screenshot({ path: OUT + `s3-${L}.png` }); await p.mouse.up(); await p.click('#quitBtn');
// 4 找到驚喜插畫（指定半夜偷開冰箱）
await setSave({ mat: 'cardboard', cat: 'white' }); await p.reload(); await p.waitForTimeout(400);
await p.evaluate(() => { window.pickCard = () => CARDS.find(c => c.id === 'fridge'); }); await p.click('#startBtn'); await p.waitForSelector('#play.active');
await p.evaluate(() => { G.distracted = true; G.zoomAt = Infinity; G.zoomP = 9; G.nextBurst = Infinity; });
for (let k = 0; k < 80; k++) { const y = 220 + (k * 37) % 420; await sweep(y, 60, 330, 14); if (await p.evaluate(() => G.found)) break; }
await p.waitForTimeout(450); await p.screenshot({ path: OUT + `s4-${L}.png` });
await p.click('#doneBtn'); await p.waitForTimeout(300); await p.click('#skipBtn').catch(() => {});
await p.waitForSelector('#cardScreen.active');
for (let i = 0; i < 5; i++) { await p.waitForTimeout(400); if (await p.isVisible('#dance')) await p.click('#dance', { position: { x: 10, y: 10 } }); else if (await p.isVisible('#unlockPop')) await p.click('#unlockOk'); }
// 6 慘狀照（整張手機框圖）
await p.click('#photoBtn'); await p.waitForSelector('#viewer:not([hidden])'); await p.waitForTimeout(900);
const src = await p.getAttribute('#viewerImg', 'src');
const b64 = await p.evaluate(async u => { const bl = await (await fetch(u)).blob(); return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(bl); }); }, src);
fs.writeFileSync(OUT + `s6-${L}.png`, Buffer.from(b64.split(',')[1], 'base64'));
await p.click('#viewerClose');
// 5 送禮反應：小弟拍飛紙團
await setSave({ mat: 'cardboard', bag: { paperball: 2 } }); await p.reload(); await p.waitForTimeout(400);
await p.click('#bookBtn'); await p.waitForTimeout(300); await p.click('#bag .bagitem >> nth=0 >> button'); await p.waitForTimeout(300);
await p.click('#pickCats .cat[data-id=white]'); await p.waitForTimeout(1350);
await p.screenshot({ path: OUT + `s5-${L}.png` });
console.log(L, 'errors', errs); await b.close();

// 《抓爛它！》試玩影片：用 Playwright 把真的遊戲錄下來（1080×1920），腳本一幕一幕操作，字幕疊在畫面上
// 用法：LANGX=zh|en FONT=Huninn 字型資料夾 OUT=輸出資料夾 node tools/promo/trailer.mjs
// 產出 OUT/raw-<lang>.webm，再用 trailer.sh 配上〈Kitchen Counter Zoomies〉轉成 mp4
import { chromium } from 'playwright';
import fs from 'fs';
const R = new URL('../..', import.meta.url).pathname, OUT = process.env.OUT || new URL('./trailer/', import.meta.url).pathname;
const FONT = process.env.FONT || '', L = process.env.LANGX || 'zh';
fs.mkdirSync(OUT, { recursive: true });
const CAP = {
  zh: { t1: "貓貓 Ready，", t1b: "爪！", t2: "手指一滑，就是貓掌", c1: "瓦楞紙沿著紙條撕開", c2: "泡泡紙啵啵啵", c3: "沙發會跟你拼", c4: "每張紙下面都藏著驚喜", c5: "送禮物，貓會真的玩", c6: "抓完拍一張慘狀照", e1: "抓爛它！", e2: "免費・手機瀏覽器就能玩", e3: "itch.io 搜尋 Scratch It!" },
  en: { t1: "Ready, set…", t1b: "CLAW!", t2: "Your finger is a paw", c1: "Cardboard tears into strips", c2: "Pop, pop, pop", c3: "The sofa fights back", c4: "A surprise under every sheet", c5: "Gifts get real cat reactions", c6: "Snap the crime scene", e1: "Scratch It!", e2: "Free · plays in your phone's browser", e3: "on itch.io" }
}[L];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 8 / 3, isMobile: true, hasTouch: false });
const p = await ctx.newPage();
const FR = OUT + 'f-' + L + '/'; fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
const frames = []; let rec = false, shooting = null, hold = false, cut = 0, holdAt = 0;
const cdp = await ctx.newCDPSession(p);
async function shootLoop() {
  while (rec) {
    if (hold) { await new Promise(r => setTimeout(r, 20)); continue; }
    const t = await p.evaluate(() => window.__gameNow()).catch(() => null);
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, optimizeForSpeed: true, clip: { x: 0, y: 0, width: 405, height: 720, scale: 8 / 3 } }).catch(() => null);
    if (r && t !== null) { const n = frames.length; fs.writeFileSync(FR + String(n).padStart(5, '0') + '.jpg', Buffer.from(r.data, 'base64')); frames.push({ n, t: t / 1000 - cut }); }
  }
}
// 慢動作錄影：遊戲時鐘放慢 SLOW 倍（performance.now、requestAnimationFrame、setTimeout、CSS／Web 動畫），
// 一邊連續截 1080×1920 的圖，最後照「遊戲時間」排成 30fps——截圖本身很慢，但成片很順
const SLOW = 5;
await p.addInitScript(S => {
  const pn = performance.now.bind(performance), base = pn();
  performance.now = () => base + (pn() - base) / S;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(t => cb(base + (t - base) / S));
  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
  window.setTimeout = (f, ms = 0, ...a) => st(f, ms * S, ...a);
  window.setInterval = (f, ms = 0, ...a) => si(f, ms * S, ...a);
  window.__gameNow = () => (pn() - base) / S;
}, SLOW);
await p.addInitScript(l => { try { localStorage.setItem('scratch-it-lang', l); localStorage.setItem('scratch-it-save', JSON.stringify({ unlocked: ['cardboard', 'bubble', 'sofa'], paintings: 9, love: { orange: 95, grey: 95, white: 95 }, backs: { orange: true, grey: true, white: true }, maxHoles: 99999, husky: true, styles: Object.fromEntries(['wild','cheese','blank','minimal','impression','chain','fauvism','cubism','pointillism','action','futurism','ukiyoe','symmetry','wabi','dada','am3','nap','pawpad'].map(k => [k, 1])), texV: 2, tex: 'code', muted: false, soundHint: 1, no: 23 })); } catch {} }, L);
await p.route('**/*', r => {
  const u = new URL(r.request().url());
  if (u.host === 'game.local') { const f = u.pathname === '/' ? '/index.html' : u.pathname; const ct = f.endsWith('.js') ? 'application/javascript' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.png') ? 'image/png' : f.endsWith('.mp3') ? 'audio/mpeg' : 'text/html'; return r.fulfill({ contentType: ct, body: fs.readFileSync(R + f) }); }
  if (u.host === 'fonts.googleapis.com' && FONT) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(FONT + 'huninn.css') });
  if (u.host === 'fonts.gstatic.com' && FONT) return r.fulfill({ contentType: 'font/ttf', body: fs.readFileSync(FONT + 'huninn.ttf') });
  return r.abort();
});
await p.goto('http://game.local/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW });
// 字幕與字卡（只在錄影時加進頁面）
await p.evaluate(() => {
  const st = document.createElement('style'); st.textContent = `
  #tcap { position: fixed; z-index: 999; left: 0; right: 0; bottom: 92px; text-align: center; pointer-events: none; transition: opacity .25s, transform .25s; }
  #tcap span { display: inline-block; font: 700 30px Huninn, sans-serif; color: #3a2e2a; background: #ffd96a; border: 3px solid #3a2e2a; border-radius: 18px; padding: 6px 18px; box-shadow: 4px 4px 0 #3a2e2a; transform: rotate(-2deg); }
  #tcap.hide { opacity: 0; transform: translateY(-14px); }
  #tcard { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: radial-gradient(circle at 50% 40%, #fff3d6, #f6c98f); transition: opacity .35s; text-align: center; }
  #tcard.hide { opacity: 0; pointer-events: none; }
  #tcard h1 { margin: 0; font: 700 64px Huninn, sans-serif; color: #fff3c4; -webkit-text-stroke: 9px #3a2e2a; paint-order: stroke fill; transform: rotate(-3deg); }
  #tcard p { margin: 0; font: 26px Huninn, sans-serif; color: #3a2e2a; }
  #tcard h1 .claw { display: block; width: max-content; margin: 4px auto 0; color: #ffd96a; font-size: 110px; animation: claw .35s cubic-bezier(.3,1.8,.5,1) both; }
  @keyframes claw { from { transform: scale(0) rotate(-20deg); } to { transform: scale(1) rotate(6deg); } }
  #tcard .paw { position: absolute; bottom: -30px; right: 18px; width: 150px; animation: pawup .3s cubic-bezier(.3,1.6,.5,1) both; transform-origin: 50% 100%; }
  @keyframes pawup { from { transform: translateY(260px) rotate(10deg); } to { transform: translateY(0) rotate(-8deg); } }
  #tcard .cats { display: flex; gap: 4px; align-items: flex-end; } #tcard .cats img { width: 110px; animation: tb .5s ease-in-out infinite alternate; } #tcard .cats img:nth-child(2) { animation-delay: .15s; } #tcard .cats img:nth-child(3) { animation-delay: .3s; }
  @keyframes tb { to { transform: translateY(-14px); } }`;
  document.head.appendChild(st);
  const c = document.createElement('div'); c.id = 'tcap'; c.className = 'hide'; c.innerHTML = '<span></span>'; document.body.appendChild(c);
  const k = document.createElement('div'); k.id = 'tcard'; document.body.appendChild(k);
  window.cap = t => { const e = document.getElementById('tcap'); if (!t) { e.classList.add('hide'); return; } e.firstChild.textContent = t; e.classList.remove('hide'); };
  window.claw = (w, src) => { const h = document.querySelector('#tcard h1'); h.insertAdjacentHTML('beforeend', `<span class="claw">${w}</span>`); document.getElementById('tcard').insertAdjacentHTML('beforeend', `<img class="paw" src="${src}">`); };
  window.card = (h, p1, p2) => { const e = document.getElementById('tcard'); if (!h) { e.classList.add('hide'); return; } e.innerHTML = `<div class="cats"><img src="art/orange_sit.webp"><img src="art/grey_sit.webp"><img src="art/white_sit.webp"></div><h1>${h}</h1>${p1 ? `<p>${p1}</p>` : ''}${p2 ? `<p><b>${p2}</b></p>` : ''}`; e.classList.remove('hide'); };
});
const W = ms => p.waitForTimeout(ms * SLOW);   // 等「遊戲時間」ms
// 剪掉一段：暫停截圖，之後的時間戳記扣掉這段，成片直接跳過（結算動畫那種一閃而過、看不清的轉場）
const pause = async () => { hold = true; await new Promise(r => setTimeout(r, 300)); holdAt = await p.evaluate(() => window.__gameNow() / 1000); };
const resume = async () => { cut += await p.evaluate(() => window.__gameNow() / 1000) - holdAt; hold = false; };
const sweep = async (y, x0 = 30, x1 = 375, steps = 22) => { await p.mouse.move(x0, y); await p.mouse.down(); await p.mouse.move(x1, y + 8, { steps: steps * SLOW }); await p.mouse.up(); await W(40); };
const play = async (mat, cat, card) => {
  await p.evaluate(([m, c, cd]) => { save.mat = m; save.cat = c; if (cd) window.pickCard = () => CARDS.find(x => x.id === cd); startGame(); G.distracted = true; G.zoomAt = Infinity; G.zoomP = 9; G.nextBurst = Infinity; }, [mat, cat, card]);
};
// 片頭
await p.evaluate(t => card(t[0], t[1]), [CAP.t1, CAP.t2]); await W(300); rec = true; shooting = shootLoop();
await W(900); await p.evaluate(w => claw(w, 'art/orange_paw_out.webp'), CAP.t1b); await W(1700);
// 1 瓦楞紙（總編）
await play('cardboard', 'orange', 'chief_treat'); await p.evaluate(() => card()); await p.evaluate(t => cap(t), CAP.c1);
for (const y of [190, 226, 262, 400, 436, 472]) await sweep(y);
// 2 泡泡紙（小弟）
await p.evaluate(() => { endPlay(); }); await play('bubble', 'white', 'box_trio'); await p.evaluate(t => cap(t), CAP.c2);
for (const y of [170, 230, 300, 370, 440, 510]) await sweep(y, 15, 390, 14);
// 3 沙發（架構師）
await p.evaluate(() => { endPlay(); }); await play('sofa', 'grey', 'arch_cup'); await p.evaluate(t => cap(t), CAP.c3);
for (let r = 0; r < 4; r++) for (const y of [250, 290, 330]) await sweep(y, 40, 365, 9);
// 4 找到驚喜插畫（小弟，冰箱）
await p.evaluate(() => { endPlay(); }); await play('cardboard', 'white', 'fridge'); await p.evaluate(t => cap(t), CAP.c4);
for (let k = 0; k < 60; k++) { await sweep(250 + (k * 29) % 300, 40, 365, 8); if (await p.evaluate(() => G.found)) break; }
await W(2800);   // 找到插畫：停 2.8 秒讓人看清楚
// 結束這局（結算動畫剪掉，直接接送禮物）
await pause();
await p.evaluate(() => { if (G && !G.done) finish(); }); await W(400); await p.evaluate(() => skipFinish()); await p.waitForSelector('#cardScreen.active');
await p.evaluate(() => { for (const id of ['dance', 'unlockPop', 'viewer', 'reveal']) { const e = document.getElementById(id); if (e) e.hidden = true; } }); await W(300);
// 5 送禮物（小弟爆衝）
await p.evaluate(t => cap(t), CAP.c5); await resume();
await p.evaluate(() => { save.bag.paperball = 1; gift(CARDS.find(c => c.id === 'paperball'), 'white'); }); await W(4200);
await p.evaluate(() => { document.getElementById('react').hidden = true; flingOff && flingOff(); for (const id of ['dance', 'unlockPop', 'viewer']) document.getElementById(id).hidden = true; show('cardScreen'); });
// 6 慘狀照
await p.evaluate(t => cap(t), CAP.c6); await W(200);
await p.click('#photoBtn'); await W(2600);
// 片尾
await p.evaluate(() => cap()); await p.evaluate(t => card(t[0], t[1], t[2]), [CAP.e1, CAP.e2, CAP.e3]); await W(3000);
rec = false; await shooting; await ctx.close(); await b.close();
// 照時間戳記排成 ffmpeg concat 清單
const t0 = frames[0].t; let list = '';
frames.forEach((f, i) => { const next = frames[i + 1]; list += `file '${FR}${String(f.n).padStart(5, '0')}.jpg'\nduration ${((next ? next.t : f.t + .04) - f.t).toFixed(4)}\n`; });
list += `file '${FR}${String(frames[frames.length - 1].n).padStart(5, '0')}.jpg'\n`;
fs.writeFileSync(OUT + `frames-${L}.txt`, list);
console.log(L, 'frames', frames.length, 'game seconds', (frames[frames.length - 1].t - t0).toFixed(1), 'fps', (frames.length / (frames[frames.length - 1].t - t0)).toFixed(1));

// 《抓爛它！》遊戲流程與畫面
const VERSION = "0.1.0";
const CHANGES = ["第一版：三隻貓、瓦楞紙和沙發、爪痕畫、收藏冊"];
const GAME_URL = window.GAME_URL || GAME_URL_DEFAULT;

/* ================= 小工具 ================= */
const $ = s => document.querySelector(s);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (a, b) => a + Math.random() * (b - a);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};
let screen = "home";
function show(id) {
  screen = id;
  document.querySelectorAll(".screen").forEach(el => el.classList.toggle("active", el.id === id));
  window.scrollTo(0, 0);
}
let toastTimer;
function toast(msg, ms = 2400) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), ms);
}
applyStatic();
if (LANG === "en") document.title = "Scratch It!";

/* ================= 存檔（只存在這支手機） ================= */
const SAVE_KEY = "scratch-it-save";
const save = Object.assign({ paintings: 0, time: 0, cats: [], maxHoles: 0, frenzy: 0, unlocked: ["cardboard"], album: [], cat: "orange", mat: "cardboard", no: 0, muted: false },
  store.get(SAVE_KEY, {}));
function persist() {
  // 收藏冊的圖比較大：存不下就丟掉最舊的再試
  while (!store.set(SAVE_KEY, save) && save.album.length) save.album.pop();
}
FX.init(save.muted);
document.addEventListener("pointerdown", () => FX.unlock(), { capture: true });
const renderMute = () => { $("#muteBtn").textContent = FX.muted ? "🔇" : "🔊"; };
$("#muteBtn").addEventListener("click", e => { e.stopPropagation(); FX.muted = !FX.muted; save.muted = FX.muted; persist(); renderMute(); FX.tap(); });
$("#muteBtn").addEventListener("pointerdown", e => e.stopPropagation());
renderMute();

/* ================= 解鎖 ================= */
const matById = id => MATERIALS.find(m => m.id === id);
function unlockState(m) {
  const u = m.unlock; if (!u) return { done: true, frac: 1 };
  const n = u.n || 1;
  let have = 0;
  if (u.type === "paintings") have = save.paintings;
  else if (u.type === "allcats") return { done: save.cats.length >= 3, frac: save.cats.length / 3 };
  else if (u.type === "time") return { done: save.time >= n, frac: save.time / n };
  else if (u.type === "holes") have = save.maxHoles;
  else if (u.type === "frenzy") have = save.frenzy;
  else if (u.type === "paintingsOrDecember") { if (new Date().getMonth() === 11) return { done: true, frac: 1 }; have = save.paintings; }
  return { done: have >= n, frac: have / n };
}
// 圖卡下面的「下一個解鎖」：讓人知道再抓一張會有什麼
function progressText(m) {
  const u = m.unlock, n = u.n || 1;
  if (u.type === "paintings" || u.type === "paintingsOrDecember") return `${Math.min(save.paintings, n)}/${n}`;
  if (u.type === "allcats") return `${save.cats.length}/3`;
  if (u.type === "time") return T("{0}/{1} 分鐘", Math.floor(save.time / 60), Math.round(n / 60));
  if (u.type === "holes") return `${Math.min(save.maxHoles, n)}/${n}`;
  return "";
}
function nextUnlockLine() {
  const locked = MATERIALS.filter(m => !save.unlocked.includes(m.id) && !m.secret);
  const m = locked.find(x => x.ready) || locked[0];
  if (!m) return "";
  return m.ready ? T("下一個解鎖：{0} {1}（{2}）", m.icon, W(m.name), progressText(m))
    : T("下一個材質：{0} {1}・敬請期待（{2}）", m.icon, W(m.name), progressText(m));
}
function unlockText(m) {
  const u = m.unlock; if (!u) return "";
  return T(UNLOCK_TEXT[u.type], u.type === "time" ? Math.round(u.n / 60) : u.n);
}
// 抓完一張畫後檢查：只解鎖這一版做好了的材質
function checkUnlocks() {
  const fresh = [];
  for (const m of MATERIALS) {
    if (!m.ready || save.unlocked.includes(m.id)) continue;
    if (unlockState(m).done) { save.unlocked.push(m.id); fresh.push(m); }
  }
  return fresh;
}

/* ================= 首頁 ================= */
function renderHome() {
  const cats = $("#cats"); cats.innerHTML = "";
  for (const [id, c] of Object.entries(CATS)) {
    const b = document.createElement("button");
    b.className = "cat" + (save.cat === id ? " on" : "");
    b.innerHTML = `${catSVG(id, "sit")}<b>${W(c.name)}</b><small>${W(c.style)}</small>`;
    b.addEventListener("click", () => { save.cat = id; persist(); FX.tap(); renderHome(); });
    cats.appendChild(b);
  }
  const mats = $("#mats"); mats.innerHTML = "";
  for (const m of MATERIALS) {
    const open = save.unlocked.includes(m.id);
    const st = unlockState(m);
    const b = document.createElement("button");
    b.className = "mat" + (open ? (save.mat === m.id ? " on" : "") : " locked");
    let sub;
    if (!open && !m.ready) sub = `<div class="cd">${T("敬請期待")}${m.secret ? "" : "・" + unlockText(m)}</div>`;
    else if (!open) sub = `<div class="cd">🔒 ${unlockText(m)}</div><div class="bar"><i style="width:${clamp(st.frac, 0, 1) * 100}%"></i></div>`;
    else sub = "";
    b.innerHTML = `<span class="ic">${open || !m.secret ? m.icon : "❓"}</span><span><div class="nm">${open || !m.secret ? W(m.name) : "？？？"}</div>${sub}</span>`;
    b.addEventListener("click", () => {
      if (!open) { toast(m.ready ? T("還沒解鎖：{0}", unlockText(m)) : T("這個材質還在做，敬請期待！")); return; }
      save.mat = m.id; persist(); FX.tap(); renderHome();
    });
    mats.appendChild(b);
  }
  if (!save.unlocked.includes(save.mat)) save.mat = "cardboard";
  $("#albumBtn").textContent = T("🖼️ 收藏冊（{0}）", save.album.length);
}
$("#startBtn").addEventListener("click", () => { FX.tap(); startGame(); });
$("#albumBtn").addEventListener("click", () => { FX.tap(); openAlbum(); });
$("#albumBtn2").addEventListener("click", () => { FX.tap(); openAlbum(); });
$("#albumBack").addEventListener("click", () => { FX.tap(); show("home"); renderHome(); });
$("#homeBtn").addEventListener("click", () => { FX.tap(); show("home"); renderHome(); });
$("#againBtn").addEventListener("click", () => { FX.tap(); startGame(); });
$("#langBtn").textContent = LANG === "en" ? "中文" : "English";
$("#langBtn").addEventListener("click", () => setLang(LANG === "en" ? "zh" : "en"));
$("#verBtn").textContent = `v${VERSION} ${T("🆕 更新了什麼")}`;
$("#changes").innerHTML = CHANGES.map(c => T(c)).join("<br>");
$("#verBtn").addEventListener("click", () => { $("#changes").hidden = !$("#changes").hidden; });

/* ================= 畫面與畫布 ================= */
const cv = $("#cv"), ctx = cv.getContext("2d");
let Wd = 0, Ht = 0, DPR = 1;
let base, dmg, pile, bctx, dctx, pctx;
const CELL = 16;
let G = null;   // 這一局的狀態

function makeLayer() { const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; return c; }
function setupCanvas() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  Wd = window.innerWidth; Ht = window.innerHeight;
  cv.width = Math.round(Wd * DPR); cv.height = Math.round(Ht * DPR);
  base = makeLayer(); dmg = makeLayer(); pile = makeLayer();
  bctx = base.getContext("2d"); dctx = dmg.getContext("2d"); pctx = pile.getContext("2d");
  for (const c of [bctx, dctx, pctx]) c.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// 材質底圖：全部程式畫
function paintBase(m) {
  const c = bctx;
  c.fillStyle = m.base; c.fillRect(0, 0, Wd, Ht);
  if (m.id === "cardboard") {
    // 瓦楞紙貓抓板：一條一條的紙層
    for (let y = 0; y < Ht; y += 9) {
      c.fillStyle = (y / 9) % 2 ? m.base2 : m.base; c.fillRect(0, y, Wd, 9);
      c.fillStyle = "rgba(255,240,210,.18)"; c.fillRect(0, y, Wd, 1.5);
      c.fillStyle = "rgba(80,50,20,.18)"; c.fillRect(0, y + 7.5, Wd, 1.5);
    }
    for (let i = 0; i < Wd * Ht / 900; i++) { c.fillStyle = `rgba(90,60,30,${rand(.04, .1)})`; c.fillRect(rand(0, Wd), rand(0, Ht), rand(1, 3), 1); }
    c.strokeStyle = "rgba(60,40,20,.5)"; c.lineWidth = 6; c.strokeRect(3, 3, Wd - 6, Ht - 6);
  } else if (m.id === "sofa") {
    // 沙發：布紋＋坐墊縫線
    for (let y = 0; y < Ht; y += 4) for (let x = (y / 4) % 2 * 2; x < Wd; x += 4) { c.fillStyle = "rgba(255,255,255,.05)"; c.fillRect(x, y, 2, 2); }
    c.strokeStyle = m.base2; c.lineWidth = 3; c.setLineDash([7, 6]);
    const pad = 22, h = (Ht - pad * 3) / 2;
    for (let i = 0; i < 2; i++) { roundRect(c, pad, pad + i * (h + pad), Wd - pad * 2, h, 26); c.stroke(); }
    c.setLineDash([]);
    for (let i = 0; i < 2; i++) { c.fillStyle = "rgba(0,0,0,.12)"; c.beginPath(); c.arc(Wd / 2, pad + h / 2 + i * (h + pad), 5, 0, Math.PI * 2); c.fill(); }
  }
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

/* ================= 開始一局 ================= */
function startGame() {
  const cat = CATS[save.cat], m = matById(save.mat);
  show("play");
  setupCanvas();
  paintBase(m);
  const cols = Math.ceil(Wd / CELL), rows = Math.ceil(Ht / CELL);
  G = {
    catId: save.cat, cat, m, cols, rows, cells: new Uint16Array(cols * rows), touched: new Float64Array(cols * rows), scratched: 0, holes: 0,
    start: performance.now(), scratchMs: 0, particles: [], down: false, pid: null,
    fx: 0, fy: 0, paw: { x: Wd / 2, y: Ht / 2 }, stroke: null, strokes: [], moved: 0, lastT: 0,
    frenzyRun: 0, lastMove: 0, nextBurst: performance.now() + rand(6000, 10000), burstUntil: 0, jx: 0, jy: 0,
    progress: 0, done: false, minX: Wd, minY: Ht, maxX: 0, maxY: 0
  };
  setPaw(false); $("#paw").style.opacity = .85; G.paw.x = Wd / 2; G.paw.y = Ht * .62; movePaw();
  $("#catChip").innerHTML = `${catSVG(save.cat, "sit")}<span>${W(cat.name)}</span>`;
  $("#doneBtn").disabled = true; $("#finish").hidden = true; $("#hint").style.opacity = 1;
  updateMeter();
  FX.start(m);
  cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
}
$("#quitBtn").addEventListener("click", () => { FX.tap(); endPlay(); show("home"); renderHome(); });
$("#doneBtn").addEventListener("click", () => { if (G && !G.done) finish(); });
function endPlay() { cancelAnimationFrame(raf); FX.stop(); G = null; }

/* ================= 抓：爪痕、打洞、紙屑 ================= */
function cellAt(x, y) { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return (cx < 0 || cy < 0 || cx >= G.cols || cy >= G.rows) ? -1 : cy * G.cols + cx; }
function claw(x0, y0, x1, y1, power = 1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 0.6) return;
  const nx = -dy / len, ny = dx / len, m = G.m, c = dctx;
  const sp = G.cat.spacing * (G.catId === "white" ? rand(.8, 1.35) : 1);
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * sp;
    const ax = x0 + nx * off, ay = y0 + ny * off, bx = x1 + nx * off, by = y1 + ny * off;
    // 溝：深色，旁邊一道亮的毛邊
    c.lineCap = "round";
    c.strokeStyle = m.fuzz; c.globalAlpha = .55; c.lineWidth = 4.6;
    c.beginPath(); c.moveTo(ax + nx, ay + ny); c.lineTo(bx + nx, by + ny); c.stroke();
    c.globalAlpha = .9; c.strokeStyle = m.groove; c.lineWidth = 2.6 * power;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    c.globalAlpha = 1;
    if (Math.random() < .35) {
      // 被抓起來的纖維
      const t = Math.random(), px = ax + (bx - ax) * t, py = ay + (by - ay) * t, a = Math.atan2(dy, dx) + rand(-1.2, 1.2), l = rand(2, 6);
      c.strokeStyle = m.fuzz; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); c.stroke();
    }
    // 記錄抓到哪些格子：同一格要隔一下才算「又抓了一次」，來回磨不會一下就破洞
    const now = performance.now();
    for (let s = 0; s <= len; s += 6) {
      const px = ax + (bx - ax) * s / len, py = ay + (by - ay) * s / len, k = cellAt(px, py);
      if (k < 0 || now - G.touched[k] < 110) continue;
      G.touched[k] = now;
      const v = ++G.cells[k];
      if (v === 1) G.scratched++;
      if (v === m.holeAt) hole(px, py, false);
      G.minX = Math.min(G.minX, px); G.maxX = Math.max(G.maxX, px); G.minY = Math.min(G.minY, py); G.maxY = Math.max(G.maxY, py);
    }
  }
  // 紙屑
  const n = len / 16 * (G.catId === "white" ? 1.7 : G.catId === "grey" ? .7 : 1);
  for (let i = 0; i < n; i++) if (Math.random() < n - i) spawnDebris(x0 + dx * Math.random(), y0 + dy * Math.random(), nx, ny);
  G.moved += len;
  if (G.moved > 50) { G.moved = 0; FX.vibrate(5); }
}
function hole(x, y, big) {
  const m = G.m, c = dctx, r = (big ? 22 : 11) * rand(1, 1.4), pts = 11;
  c.beginPath();
  for (let i = 0; i <= pts; i++) { const a = i / pts * Math.PI * 2, rr = r * rand(.65, 1.15); c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8); }
  c.closePath();
  if (m.id === "sofa") {
    // 沙發破洞：白色棉花跑出來
    c.fillStyle = m.groove; c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#fff" : m.hole; c.beginPath(); c.arc(x + rand(-r, r) * .6, y + rand(-r, r) * .5, r * rand(.35, .6), 0, Math.PI * 2); c.fill(); }
    if (Math.random() < .3) spring(x, y);
  } else {
    c.fillStyle = m.hole; c.fill();
    c.strokeStyle = m.fuzz; c.lineWidth = 2; c.stroke();
  }
  G.holes++;
  FX.rip(); FX.vibrate(25);
  for (let i = 0; i < 10; i++) spawnDebris(x, y, rand(-1, 1), rand(-1, 0));
}
function spring(x, y) {
  // 沙發彈簧蹦出來
  const c = dctx; c.strokeStyle = "#8a8f96"; c.lineWidth = 3; c.lineCap = "round"; c.beginPath();
  for (let i = 0; i <= 8; i++) c.lineTo(x + (i % 2 ? 8 : -8), y - i * 4);
  c.stroke(); FX.boing();
  bubble(T("蹦！"), x, y - 40);
}
function spawnDebris(x, y, nx, ny) {
  if (G.particles.length > 450) return;
  const m = G.m, side = Math.random() < .5 ? -1 : 1, sp = rand(60, 220);
  const fluff = m.debris === "fluff";
  G.particles.push({
    x, y, vx: nx * side * sp + rand(-60, 60), vy: ny * side * sp - rand(80, 240), rot: rand(0, 6.3), vr: rand(-8, 8),
    w: fluff ? rand(4, 8) : rand(4, 12), h: fluff ? 0 : rand(2, 4), fluff,
    color: fluff ? (Math.random() < .7 ? "#ffffff" : m.fuzz) : (Math.random() < .6 ? m.base2 : m.fuzz),
    floor: Ht - rand(4, 46)
  });
}
function updateParticles(dt) {
  const ps = G.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    if (p.fluff) { p.vy += 260 * dt; p.vx *= .98; p.vy = Math.min(p.vy, 140); } else p.vy += 900 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.y >= p.floor) { p.y = p.floor; drawParticle(pctx, p); ps.splice(i, 1); }
  }
}
function drawParticle(c, p) {
  c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color;
  if (p.fluff) { c.beginPath(); c.arc(0, 0, p.w / 2, 0, Math.PI * 2); c.arc(p.w / 3, -p.w / 4, p.w / 3, 0, Math.PI * 2); c.fill(); }
  else { c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.strokeStyle = "rgba(60,40,20,.35)"; c.lineWidth = .6; c.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); }
  c.restore();
}
function bubble(text, x, y) {
  const b = document.createElement("div"); b.className = "bubble"; b.textContent = text;
  b.style.left = clamp(x - 40, 8, Wd - 120) + "px"; b.style.top = clamp(y, 60, Ht - 80) + "px";
  document.body.appendChild(b); setTimeout(() => b.remove(), 950);
}

/* ================= 三隻貓的手感 ================= */
// 橘貓：方向鎖在最近的 45°，抓出整齊的平行直線
// 藍灰貓：貓掌慢半拍跟著手指，線條變成平順的弧線
// 白貓：亂抖、分岔、偶爾打大洞，還會突然暴衝
function onMove(x, y) {
  const s = G.stroke; if (!s) return;
  const prev = { x: G.paw.x, y: G.paw.y };
  if (G.catId === "orange") {
    const vx = x - s.ax, vy = y - s.ay;
    if (!s.dir) {
      // 方向還沒決定前也先畫，手指一碰就有反應；6px 後鎖定方向
      if (Math.hypot(vx, vy) < 6) { G.paw.x = x; G.paw.y = y; claw(prev.x, prev.y, x, y); track(prev); return; }
      const a = Math.round(Math.atan2(vy, vx) / (Math.PI / 4)) * (Math.PI / 4);
      s.dir = { x: Math.cos(a), y: Math.sin(a) }; s.ax = prev.x; s.ay = prev.y;
    }
    const d = vx * s.dir.x + vy * s.dir.y;
    G.paw.x = s.ax + s.dir.x * d; G.paw.y = s.ay + s.dir.y * d;
    claw(prev.x, prev.y, G.paw.x, G.paw.y);
  } else if (G.catId === "white") {
    G.jx = clamp(G.jx + rand(-3, 3), -12, 12); G.jy = clamp(G.jy + rand(-3, 3), -12, 12);
    G.paw.x = x + G.jx; G.paw.y = y + G.jy;
    const len = Math.hypot(G.paw.x - prev.x, G.paw.y - prev.y);
    claw(prev.x, prev.y, G.paw.x, G.paw.y, rand(.8, 1.3));
    if (Math.random() < len / 220) {
      // 分岔
      const a = Math.atan2(G.paw.y - prev.y, G.paw.x - prev.x) + rand(-1.2, 1.2), l = rand(25, 55);
      claw(G.paw.x, G.paw.y, G.paw.x + Math.cos(a) * l, G.paw.y + Math.sin(a) * l, .9);
    }
    if (Math.random() < len / 1400) hole(G.paw.x, G.paw.y, true);
  } else return;   // 藍灰貓在動畫迴圈裡處理
  track(prev);
}
function track(prev) {
  const s = G.stroke, d = Math.hypot(G.paw.x - prev.x, G.paw.y - prev.y);
  s.path += d;
  const now = performance.now();
  const dt = Math.max(16, now - G.lastT); G.lastT = now;
  FX.scratch(d / dt);
  if (d > 0.5) { G.scratchMs += Math.min(dt, 60); G.lastMove = now; }
  movePaw();
}
function setPaw(out) { const p = $("#paw"); p.innerHTML = pawSVG(G.catId, out); p.classList.toggle("down", out); }
function movePaw() { const p = $("#paw"); p.style.left = G.paw.x + "px"; p.style.top = G.paw.y + "px"; }

cv.addEventListener("pointerdown", e => {
  if (!G || G.done || G.pid !== null) return;
  e.preventDefault(); FX.unlock();
  G.pid = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch {}
  G.down = true; G.fx = e.clientX; G.fy = e.clientY;
  G.paw.x = e.clientX; G.paw.y = e.clientY;
  G.stroke = { ax: e.clientX, ay: e.clientY, dir: null, path: 0 };
  G.lastT = performance.now();
  setPaw(true); $("#paw").style.opacity = 1; movePaw();
  $("#hint").style.opacity = 0;
});
cv.addEventListener("pointermove", e => {
  if (!G || e.pointerId !== G.pid || G.done) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of (evs.length ? evs : [e])) { G.fx = ev.clientX; G.fy = ev.clientY; onMove(ev.clientX, ev.clientY); }
});
const lift = e => {
  if (!G || e.pointerId !== G.pid) return;
  const s = G.stroke;
  if (s && s.path > 5) G.strokes.push({ path: s.path, straight: Math.min(1, Math.hypot(G.paw.x - s.ax, G.paw.y - s.ay) / s.path) * (G.catId === "orange" ? 0 : 1) + (G.catId === "orange" ? 1 : 0) });
  G.pid = null; G.down = false; G.stroke = null; FX.quiet();
  setPaw(false); $("#paw").style.opacity = .85;
};
cv.addEventListener("pointerup", lift);
cv.addEventListener("pointercancel", lift);
cv.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

/* ================= 動畫迴圈 ================= */
let raf = null, last = 0;
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!G) return;
  if (G.down && !G.done) {
    if (G.catId === "grey") {
      const prev = { x: G.paw.x, y: G.paw.y };
      G.paw.x += (G.fx - G.paw.x) * .18; G.paw.y += (G.fy - G.paw.y) * .18;
      if (Math.hypot(G.paw.x - prev.x, G.paw.y - prev.y) > .4) { claw(prev.x, prev.y, G.paw.x, G.paw.y); track(prev); }
      else FX.scratch(0);
    }
    if (G.catId === "white" && now > G.nextBurst) {
      // 暴衝：0.7 秒自己亂抓一大片
      G.burstUntil = now + 700; G.nextBurst = now + rand(7000, 12000);
      bubble(T("喵嗚嗚！"), G.paw.x, G.paw.y - 70);
    }
    if (now < G.burstUntil) {
      const a = rand(0, Math.PI * 2), l = rand(25, 50), x = G.paw.x + rand(-40, 40), y = G.paw.y + rand(-40, 40);
      claw(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 1.1); FX.scratch(2);
      if (now + 20 > G.burstUntil && Math.random() < .4) sneeze();
    }
    // 連續亂抓多久（衛生紙捲的隱藏條件）
    if (now - G.lastMove < 350) G.frenzyRun += dt; else G.frenzyRun = 0;
    save.frenzy = Math.max(save.frenzy, Math.floor(G.frenzyRun));
  }
  updateParticles(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(base, 0, 0); ctx.drawImage(dmg, 0, 0); ctx.drawImage(pile, 0, 0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const p of G.particles) drawParticle(ctx, p);
  updateMeter();
  if (!G.done && G.progress >= 1) finish();
  raf = requestAnimationFrame(loop);
}
function sneeze() {
  FX.sneeze(); bubble(T("哈啾！"), G.paw.x, G.paw.y - 60);
  // 把地上的紙屑吹起來
  for (let i = 0; i < 40; i++) G.particles.push({ x: rand(0, Wd), y: Ht - rand(4, 40), vx: rand(-200, 200), vy: rand(-650, -350), rot: rand(0, 6), vr: rand(-10, 10),
    w: rand(4, 10), h: rand(2, 4), fluff: G.m.debris === "fluff", color: G.m.debris === "fluff" ? "#fff" : G.m.base2, floor: Ht - rand(4, 46) });
}
function updateMeter() {
  if (!G) return;
  const cov = G.scratched / (G.cols * G.rows);
  G.progress = clamp(cov / .62 * G.cat.speed + G.holes * .005, 0, 1);
  $("#meterFill").style.width = G.progress * 100 + "%";
  $("#meterTxt").textContent = T("抓爛度 {0}%", Math.floor(G.progress * 100));
  $("#doneBtn").disabled = G.progress < .15;
}

/* ================= 抓完 ================= */
function artStyle() {
  const cov = G.scratched / (G.cols * G.rows);
  const tot = G.strokes.reduce((s, x) => s + x.path, 0) || 1;
  const straight = G.strokes.reduce((s, x) => s + x.path * x.straight, 0) / tot;
  if (cov > .6) return "wild";
  if (G.holes >= 20) return "cheese";
  if (cov < .1) return "blank";
  if (straight > .8) return "minimal";
  return "impression";
}
function finish() {
  G.done = true; G.down = false; G.pid = null; FX.quiet();
  $("#paw").style.opacity = 0;
  const sec = Math.max(1, Math.round((performance.now() - G.start) / 1000));
  const pose = { sweep: "lie", lick: "lick", box: "box" }[G.cat.finish];
  $("#finishCat").innerHTML = catSVG(G.catId, pose);
  $("#finish").hidden = false;
  FX.purr(2.6);
  // 存檔：張數、時間、用過的貓、最多洞
  save.paintings++; save.no++;
  save.time += Math.round(G.scratchMs / 1000);
  if (!save.cats.includes(G.catId)) save.cats.push(G.catId);
  save.maxHoles = Math.max(save.maxHoles, G.holes);
  const styleKey = artStyle();
  const info = { cat: G.catId, mat: G.m.id, sec, style: styleKey, no: save.no, holes: G.holes };
  const fresh = checkUnlocks();
  setTimeout(async () => {
    const card = await buildCard(info);
    cancelAnimationFrame(raf); FX.stop();
    show("cardScreen");
    $("#cardImg").src = card.url; $("#saveBtn").href = card.url;
    $("#nextUnlock").textContent = nextUnlockLine();
    shareFile = card.file;
    save.album.unshift({ img: card.thumb, title: card.title, date: Date.now() });
    save.album = save.album.slice(0, 12);
    persist();
    if (fresh.length) showUnlock(fresh[0]);
    G = null;
  }, 2700);
}
function showUnlock(m) {
  $("#unlockIc").textContent = m.icon;
  $("#unlockTxt").textContent = T("解鎖新材質：{0}！", W(m.name));
  $("#unlockPop").hidden = false; FX.unlockChime();
}
$("#unlockOk").addEventListener("click", () => { $("#unlockPop").hidden = true; FX.tap(); });

/* ================= 爪痕畫圖卡（1080×1350） ================= */
let shareFile = null;
function svgImage(svg) {
  return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
}
async function buildCard(info) {
  try { await document.fonts.load("40px Huninn"); } catch {}
  const W0 = 1080, H0 = 1350, c = document.createElement("canvas"); c.width = W0; c.height = H0;
  const x = c.getContext("2d");
  const F = (n, b) => `${b ? "bold " : ""}${n}px Huninn, "PingFang TC", "Noto Sans TC", sans-serif`;
  x.fillStyle = "#fdf3e3"; x.fillRect(0, 0, W0, H0);
  x.fillStyle = "#ead8bd"; for (let yy = 11; yy < H0; yy += 22) for (let xx = 11; xx < W0; xx += 22) { x.beginPath(); x.arc(xx, yy, 1.4, 0, Math.PI * 2); x.fill(); }
  // 作品：把抓過的範圍裁成畫框的比例
  const fx = 60, fy = 60, fw = 960, fh = 900, aspect = fw / fh;
  let bx0 = G.minX, by0 = G.minY, bx1 = G.maxX, by1 = G.maxY;
  if (bx1 <= bx0) { bx0 = 0; by0 = 0; bx1 = Wd; by1 = Ht; }
  const pad = 30; bx0 -= pad; by0 -= pad; bx1 += pad; by1 += pad;
  let cw = bx1 - bx0, ch = by1 - by0;
  if (cw / ch > aspect) ch = cw / aspect; else cw = ch * aspect;
  cw = Math.min(cw, Wd); ch = Math.min(ch, Ht);
  if (cw / ch > aspect) cw = ch * aspect; else ch = cw / aspect;
  let sx = clamp((bx0 + bx1) / 2 - cw / 2, 0, Wd - cw), sy = clamp((by0 + by1) / 2 - ch / 2, 0, Ht - ch);
  const comp = document.createElement("canvas"); comp.width = cv.width; comp.height = cv.height;
  const cc = comp.getContext("2d"); cc.drawImage(base, 0, 0); cc.drawImage(dmg, 0, 0); cc.drawImage(pile, 0, 0);
  x.fillStyle = "#3a2e2a"; roundRect(x, fx + 10, fy + 10, fw, fh, 28); x.fill();
  x.save(); roundRect(x, fx, fy, fw, fh, 28); x.clip();
  x.drawImage(comp, sx * DPR, sy * DPR, cw * DPR, ch * DPR, fx, fy, fw, fh);
  x.restore();
  x.lineWidth = 8; x.strokeStyle = "#3a2e2a"; roundRect(x, fx, fy, fw, fh, 28); x.stroke();
  // 文字
  const cat = CATS[info.cat];
  const title = LANG === "en" ? `“${W(ART_STYLES[info.style])} No.${info.no}”` : `《${W(ART_STYLES[info.style])} No.${info.no}》`;
  const im = await svgImage(catSVG(info.cat, "sit"));
  if (im) x.drawImage(im, 60, 990, 190, 190);
  x.fillStyle = "#3a2e2a"; x.textAlign = "left";
  x.font = F(64, true); x.fillText(title, 270, 1068, 760);
  x.font = F(38); x.fillStyle = "#6a5a52";
  x.fillText(T("{0}的抓痕畫・{1}・{2} 秒", W(cat.name), W(cat.style), info.sec), 272, 1132, 760);
  x.font = F(32); x.fillText(`${matById(info.mat).icon} ${W(matById(info.mat).name)}${info.holes ? "・" + T("{0} 個洞", info.holes) : ""}`, 272, 1184, 760);
  x.textAlign = "center"; x.fillStyle = "#3a2e2a"; x.font = F(34, true); x.fillText(T("抓爛它！"), W0 / 2, 1268);
  x.font = F(26); x.fillStyle = "#4a7fc0"; x.fillText(GAME_URL, W0 / 2, 1310);
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  const url = URL.createObjectURL(blob);
  const t = document.createElement("canvas"); t.width = 360; t.height = 450; t.getContext("2d").drawImage(c, 0, 0, 360, 450);
  return { url, file: new File([blob], "scratch-it.png", { type: "image/png" }), thumb: t.toDataURL("image/jpeg", .72), title };
}
$("#shareBtn").addEventListener("click", async () => {
  FX.tap();
  if (shareFile && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
    try { await navigator.share({ files: [shareFile], text: `${T("我家的貓抓出一幅畫 🐾")} ${GAME_URL}` }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  toast(T("長按圖片就能存下來分享 🐾"), 3000);
});

/* ================= 收藏冊 ================= */
function openAlbum() {
  const box = $("#album"); box.innerHTML = "";
  save.album.forEach(a => {
    const im = document.createElement("img"); im.src = a.img; im.alt = a.title;
    im.addEventListener("click", () => { $("#viewerImg").src = a.img; $("#viewer").hidden = false; FX.tap(); });
    box.appendChild(im);
  });
  $("#albumEmpty").hidden = save.album.length > 0;
  show("albumScreen");
}
$("#viewerClose").addEventListener("click", () => { $("#viewer").hidden = true; });

renderHome();

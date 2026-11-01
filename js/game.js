// 《抓爛它！》遊戲流程與畫面
const VERSION = "0.2.1";
const CHANGES = [
  "加上背景音樂和插畫版貓掌",
  "密密麻麻的小洞：抓滿一塊就「啵」整片碎掉，還會連鎖",
  "新材質：泡泡紙，抓過去啵啵啵",
  "抓完貓會跳進紙屑堆，淹到只剩耳朵",
  "貓咪換成插畫版","第一版：三隻貓、瓦楞紙和沙發、爪痕畫、收藏冊"];
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
const save = Object.assign({ paintings: 0, time: 0, cats: [], maxHoles: 0, totalHoles: 0, frenzy: 0, tex: "code", unlocked: ["cardboard"], album: [], cat: "orange", mat: "cardboard", no: 0, muted: false },
  store.get(SAVE_KEY, {}));
function persist() {
  // 收藏冊的圖比較大：存不下就丟掉最舊的再試
  while (!store.set(SAVE_KEY, save) && save.album.length) save.album.pop();
}
FX.init(save.muted);
document.addEventListener("pointerdown", () => FX.unlock(), { capture: true });
const renderMute = () => { $("#muteBtn").textContent = FX.muted ? "🔇" : "🔊"; };
$("#muteBtn").addEventListener("click", e => { e.stopPropagation(); FX.muted = !FX.muted; save.muted = FX.muted; persist(); renderMute(); FX.tap(); FX.music(FX.wantTrack || "calm"); });
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
  else if (u.type === "totalHoles") have = save.totalHoles;
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
  if (u.type === "totalHoles") return `${Math.min(save.totalHoles, n).toLocaleString()}/${n.toLocaleString()}`;
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
  return T(UNLOCK_TEXT[u.type], u.type === "time" ? Math.round(u.n / 60) : (u.n || 0).toLocaleString());
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

/* ================= 插畫（AI 圖，載入失敗就用程式畫的） ================= */
function catImg(id, pose, cls = "") {
  const src = ART && ART[id] && ART[id][pose];
  const fallback = catSVG(id, pose === "box" || pose === "tail" ? "box" : pose === "lie" ? "lie" : "sit");
  if (!src) return fallback;
  return `<img class="${cls}" src="${src}" alt="" onerror="this.outerHTML=decodeURIComponent('${encodeURIComponent(fallback)}')">`;
}
const imgCache = {};
function loadImg(src) {
  if (!src) return Promise.resolve(null);
  if (!imgCache[src]) imgCache[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  return imgCache[src];
}
if (ART) { for (const id of Object.keys(CATS)) for (const k of Object.keys(ART[id])) loadImg(ART[id][k]); loadImg(ART.flutes); }

/* ================= 首頁 ================= */
function renderHome() {
  FX.music("calm");
  const cats = $("#cats"); cats.innerHTML = "";
  for (const [id, c] of Object.entries(CATS)) {
    const b = document.createElement("button");
    b.className = "cat" + (save.cat === id ? " on" : "");
    b.innerHTML = `${catImg(id, "sit", "catpic")}<b>${W(c.name)}</b><small>${W(c.style)}</small>`;
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
      save.mat = m.id; persist(); FX.tap(); if (!ART) $("#aiNote").hidden = true;
renderHome();
    });
    mats.appendChild(b);
  }
  if (!save.unlocked.includes(save.mat)) save.mat = "cardboard";
  $("#albumBtn").textContent = T("🖼️ 收藏冊（{0}）", save.album.length);
  // 貓抓板花紋：程式畫／AI 圖，給 Katie 比較
  $("#texBtn").hidden = !ART || save.mat !== "cardboard";
  $("#texBtn").textContent = save.tex === "ai" ? T("貓抓板花紋：AI 圖（點一下換程式畫）") : T("貓抓板花紋：程式畫（點一下換 AI 圖）");
}
$("#startBtn").addEventListener("click", () => { FX.tap(); startGame(); });
$("#albumBtn").addEventListener("click", () => { FX.tap(); openAlbum(); });
$("#albumBtn2").addEventListener("click", () => { FX.tap(); openAlbum(); });
$("#albumBack").addEventListener("click", () => { FX.tap(); show("home"); renderHome(); });
$("#homeBtn").addEventListener("click", () => { FX.tap(); show("home"); renderHome(); });
$("#againBtn").addEventListener("click", () => { FX.tap(); startGame(); });
$("#texBtn").addEventListener("click", () => { save.tex = save.tex === "ai" ? "code" : "ai"; persist(); FX.tap(); renderHome(); });
$("#langBtn").textContent = LANG === "en" ? "中文" : "English";
$("#langBtn").addEventListener("click", () => setLang(LANG === "en" ? "zh" : "en"));
$("#verBtn").textContent = `v${VERSION} ${T("🆕 更新了什麼")}`;
$("#changes").innerHTML = CHANGES.map(c => T(c)).join("<br>");
$("#verBtn").addEventListener("click", () => { $("#changes").hidden = !$("#changes").hidden; });

/* ================= 畫面與畫布 ================= */
const cv = $("#cv"), ctx = cv.getContext("2d");
let Wd = 0, Ht = 0, DPR = 1;
let base, dmg, pile, bctx, dctx, pctx;
let G = null;   // 這一局的狀態
let texImg = null;

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
  if (m.id === "cardboard" && save.tex === "ai" && texImg) {
    // AI 生成的瓦楞波浪紋，拼貼鋪滿
    const pat = c.createPattern(texImg, "repeat"); const k = 200 / texImg.width;
    c.save(); c.scale(k, k); c.fillStyle = pat; c.fillRect(0, 0, Wd / k, Ht / k); c.restore();
    c.strokeStyle = "rgba(70,45,20,.55)"; c.lineWidth = 6; c.strokeRect(3, 3, Wd - 6, Ht - 6);
  } else if (m.id === "bubble") {
    // 泡泡紙：一格格小泡泡，交錯排滿
    for (const b of G.bub.list) {
      const g = c.createRadialGradient(b.x - b.r * .35, b.y - b.r * .4, b.r * .1, b.x, b.y, b.r);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.45, "rgba(235,246,252,.75)"); g.addColorStop(1, "rgba(160,200,225,.75)");
      c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(120,170,205,.65)"; c.lineWidth = 1; c.stroke();
    }
  } else if (m.id === "cardboard") {
    // 瓦楞紙貓抓板：一條條瓦楞紙側立排在一起，從上面看是一排排細波浪（牛皮紙波浪絲帶並排）
    const row = 7;
    for (let y = 0; y < Ht; y += row) {
      // 每一條紙：亮的面紙、中間的波浪芯、底下一點陰影
      const tone = rand(-8, 8), shade = v => `rgb(${217 + tone + v},${180 + tone + v},${131 + tone + v})`;
      c.fillStyle = shade(0); c.fillRect(0, y, Wd, row);
      c.fillStyle = "rgba(255,245,225,.55)"; c.fillRect(0, y, Wd, 1);
      c.fillStyle = "rgba(95,62,28,.42)"; c.fillRect(0, y + row - 1.2, Wd, 1.2);
      c.strokeStyle = "rgba(120,82,40,.55)"; c.lineWidth = 1; c.beginPath();
      const ph = rand(0, 6);
      for (let x = 0; x <= Wd; x += 1.5) { const yy = y + row / 2 + Math.sin((x + ph) * 1.05) * (row / 2 - 1.6); x ? c.lineTo(x, yy) : c.moveTo(x, yy); }
      c.stroke();
    }
    // 紙纖維小顆粒
    for (let i = 0; i < Wd * Ht / 120; i++) { c.fillStyle = Math.random() < .5 ? `rgba(110,72,35,${rand(.08, .2)})` : `rgba(255,248,230,${rand(.15, .35)})`; c.fillRect(rand(0, Wd), rand(0, Ht), rand(.6, 1.6), rand(.6, 1.2)); }
    c.strokeStyle = "rgba(70,45,20,.55)"; c.lineWidth = 6; c.strokeRect(3, 3, Wd - 6, Ht - 6);
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
  G = {
    catId: save.cat, cat, m, holes: 0, bursts: 0, rainUntil: 0, rainBand: 46,
    start: performance.now(), scratchMs: 0, particles: [], down: false, pid: null,
    fx: 0, fy: 0, paw: { x: Wd / 2, y: Ht / 2 }, stroke: null, strokes: [], moved: 0, lastT: 0,
    frenzyRun: 0, lastMove: 0, nextBurst: performance.now() + rand(6000, 10000), burstUntil: 0, jx: 0, jy: 0,
    progress: 0, done: false, minX: Wd, minY: Ht, maxX: 0, maxY: 0
  };
  if (m.mode === "bubble") setupBubbles(); else { setupHoles(); paintUnder(m); }
  texImg = null;
  if (m.id === "cardboard" && save.tex === "ai" && ART) { imgCache[ART.flutes] && imgCache[ART.flutes].then(im => { texImg = im; if (G && im) { paintBase(m); } }); }
  paintBase(m);
  setPaw(false); $("#paw").style.opacity = .85; G.paw.x = Wd / 2; G.paw.y = Ht * .62; movePaw();
  $("#catChip").innerHTML = `${catImg(save.cat, "sit", "chippic")}<span>${W(cat.name)}</span>`;
  $("#doneBtn").disabled = true; $("#finish").hidden = true; $("#hint").style.opacity = 1;
  updateMeter();
  FX.start(m);
  FX.music(G.catId === "white" || m.id === "bubble" ? "busy" : "calm");
  cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
}
$("#quitBtn").addEventListener("click", () => { FX.tap(); endPlay(); show("home"); renderHome(); });
$("#doneBtn").addEventListener("click", () => { if (G && !G.done) finish(); });
function endPlay() { cancelAnimationFrame(raf); FX.stop(); G = null; }

/* ================= 抓：爪痕＋密密麻麻的小洞 ================= */
// 「幸福的密集恐懼感」：爪尖沿路打出小圓洞，洞吸附在蜂巢格上，越抓越整齊密集；
// 一小塊（6×6 格）打到 85% 就「啵」一聲整片碎掉，旁邊快滿的區塊會跟著連鎖碎掉
const HEX = 9, ROWH = HEX * 0.866, PATCH = 6;
const hexPos = (i, j) => [i * HEX + (j % 2 ? HEX / 2 : 0), j * ROWH];
const patchOf = (i, j) => Math.floor(j / PATCH) * G.hx.pc + Math.floor(i / PATCH);
function setupHoles() {
  const cols = Math.ceil(Wd / HEX) + 1, rows = Math.ceil(Ht / ROWH) + 1, pc = Math.ceil(cols / PATCH), pr = Math.ceil(rows / PATCH);
  const h = G.hx = { cols, rows, pc, punched: new Uint8Array(cols * rows), pTotal: new Uint16Array(pc * pr), pHit: new Uint16Array(pc * pr), pDone: new Uint8Array(pc * pr), total: 0 };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const [x, y] = hexPos(i, j);
    if (x > 6 && x < Wd - 6 && y > 6 && y < Ht - 6) { h.pTotal[patchOf(i, j)]++; h.total++; } else h.punched[j * cols + i] = 2;   // 2 = 邊框外
  }
}
// 好玩很多：紙下面藏著一張大圖案，碎掉的區塊會一塊塊把它露出來
const MOTIFS = ["heart", "fish", "paw", "catface", "star"];
function paintUnder(m) {
  G.under = makeLayer(); const c = G.under.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.fillStyle = m.under; c.fillRect(0, 0, Wd, Ht);
  const sofa = m.id === "sofa";
  const fill = sofa ? "#ffc7d4" : "#e9c27f", line = sofa ? "#e58fa5" : "#6b4a26";
  const S = Math.min(Wd, Ht) * .4, cx = Wd / 2, cy = Ht * .48;
  c.lineWidth = 10; c.lineJoin = "round"; c.lineCap = "round"; c.fillStyle = fill; c.strokeStyle = line;
  const motif = G.motif = MOTIFS[Math.floor(Math.random() * MOTIFS.length)];
  c.beginPath();
  if (motif === "heart") {
    c.moveTo(cx, cy + S * .9); c.bezierCurveTo(cx - S * 1.4, cy, cx - S * .7, cy - S * 1.1, cx, cy - S * .35); c.bezierCurveTo(cx + S * .7, cy - S * 1.1, cx + S * 1.4, cy, cx, cy + S * .9);
    c.fill(); c.stroke();
  } else if (motif === "fish") {
    c.ellipse(cx - S * .15, cy, S * .8, S * .5, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(cx + S * .55, cy); c.lineTo(cx + S * 1.05, cy - S * .45); c.lineTo(cx + S * 1.05, cy + S * .45); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = line; c.beginPath(); c.arc(cx - S * .55, cy - S * .1, S * .08, 0, Math.PI * 2); c.fill();
  } else if (motif === "paw") {
    c.ellipse(cx, cy + S * .3, S * .55, S * .45, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    for (const [dx, dy] of [[-.62, -.3], [-.22, -.62], [.22, -.62], [.62, -.3]]) { c.beginPath(); c.ellipse(cx + S * dx, cy + S * dy, S * .2, S * .25, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  } else if (motif === "catface") {
    c.moveTo(cx - S * .8, cy - S * .2); c.lineTo(cx - S * .7, cy - S * 1); c.lineTo(cx - S * .25, cy - S * .62);
    c.lineTo(cx + S * .25, cy - S * .62); c.lineTo(cx + S * .7, cy - S * 1); c.lineTo(cx + S * .8, cy - S * .2);
    c.quadraticCurveTo(cx + S * .9, cy + S * .8, cx, cy + S * .8); c.quadraticCurveTo(cx - S * .9, cy + S * .8, cx - S * .8, cy - S * .2); c.fill(); c.stroke();
    c.fillStyle = line; for (const dx of [-.32, .32]) { c.beginPath(); c.arc(cx + S * dx, cy, S * .09, 0, Math.PI * 2); c.fill(); }
    c.beginPath(); c.moveTo(cx - S * .15, cy + S * .3); c.quadraticCurveTo(cx, cy + S * .42, cx, cy + S * .3); c.quadraticCurveTo(cx, cy + S * .42, cx + S * .15, cy + S * .3); c.stroke();
  } else {
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? S * .42 : S; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    c.closePath(); c.fill(); c.stroke();
  }
  // 底層也鋪滿整齊的小點點（密集感）
  c.fillStyle = "rgba(60,40,20,.22)";
  for (let j = 0; j * ROWH < Ht; j++) for (let i = 0; i * HEX < Wd; i++) { const [x, y] = hexPos(i, j); c.beginPath(); c.arc(x, y, 1.4, 0, Math.PI * 2); c.fill(); }
}
function setupBubbles() {
  const r = 8.5, gap = 19, list = [], grid = new Map();
  for (let j = 0, y = gap * .8; y < Ht - gap * .5; j++, y += gap * .866)
    for (let x = (j % 2 ? gap : gap / 2) + 2; x < Wd - gap * .4; x += gap) {
      const k = `${Math.floor(x / gap)},${Math.floor(y / gap)}`;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(list.length); list.push({ x, y, r, popped: false });
    }
  G.bub = { r, gap, list, grid, total: list.length };
}
function track2(x, y) { G.minX = Math.min(G.minX, x); G.maxX = Math.max(G.maxX, x); G.minY = Math.min(G.minY, y); G.maxY = Math.max(G.maxY, y); }
function punchAt(x, y) {
  const h = G.hx, j = Math.round(y / ROWH), i = Math.round((x - (j % 2 ? HEX / 2 : 0)) / HEX);
  if (i < 0 || j < 0 || i >= h.cols || j >= h.rows) return;
  const k = j * h.cols + i; if (h.punched[k]) return;
  const p = patchOf(i, j); if (h.pDone[p]) return;
  h.punched[k] = 1; G.holes++; h.pHit[p]++;
  const [cx, cy] = hexPos(i, j), c = dctx, m = G.m;
  c.fillStyle = m.hole; c.beginPath(); c.arc(cx, cy, 2.9, 0, Math.PI * 2); c.fill();
  c.strokeStyle = m.fuzz; c.lineWidth = .9; c.stroke();
  track2(cx, cy);
  if (Math.random() < .1) spawnDebris(cx, cy, rand(-1, 1), -1);
  if (h.pHit[p] >= h.pTotal[p] * .85) burstPatch(p, 0);
}
function punchArea(x, y, r) {
  // 小弟的大爪：一爪打穿一整圈（泡泡紙就是一次壓破一圈泡泡）
  if (G.m.mode === "bubble") { for (let a = 0; a < 6.3; a += .5) for (let rr = 0; rr <= r; rr += 6) popNear(x + Math.cos(a) * rr, y + Math.sin(a) * rr); FX.vibrate(25); return; }
  for (let yy = y - r; yy <= y + r; yy += ROWH) for (let xx = x - r; xx <= x + r; xx += HEX / 2) if (Math.hypot(xx - x, yy - y) <= r) punchAt(xx, yy);
  FX.rip(); FX.vibrate(25);
}
function neighbors(p) {
  const pc = G.hx.pc, pi = p % pc, pj = Math.floor(p / pc), out = [];
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const a = pi + di, b = pj + dj; if (a >= 0 && b >= 0 && a < pc && b * pc + a < G.hx.pDone.length) out.push(b * pc + a);
  }
  return out.sort(() => Math.random() - .5);
}
function burstPatch(p, chain) {
  const h = G.hx; if (h.pDone[p] || !G) return;
  h.pDone[p] = 1; G.bursts++;
  const pc = h.pc, pi = p % pc, pj = Math.floor(p / pc), c = dctx, m = G.m;
  const cells = [];
  for (let j = pj * PATCH; j < Math.min(h.rows, (pj + 1) * PATCH); j++) for (let i = pi * PATCH; i < Math.min(h.cols, (pi + 1) * PATCH); i++) {
    const k = j * h.cols + i; if (h.punched[k] === 2) continue;
    if (!h.punched[k]) { h.punched[k] = 1; G.holes++; }
    cells.push(hexPos(i, j));
  }
  if (!cells.length) return;
  // 整片碎掉，露出底下藏的圖案
  c.save(); c.beginPath();
  for (const [x, y] of cells) { c.moveTo(x + HEX * .7, y); c.arc(x, y, HEX * .7, 0, Math.PI * 2); }
  c.clip(); c.drawImage(G.under, 0, 0, Wd, Ht); c.restore();
  const cx = cells.reduce((a, q) => a + q[0], 0) / cells.length, cy = cells.reduce((a, q) => a + q[1], 0) / cells.length;
  track2(cx, cy);
  for (let i = 0; i < 34; i++) spawnDebris(cx + rand(-24, 24), cy + rand(-24, 24), rand(-1, 1), rand(-1, .3));
  FX.pop(chain); FX.vibrate(12 + chain * 4);
  G.bestChain = Math.max(G.bestChain || 0, chain + 1);
  if (chain >= 1) {
    // 連鎖只留一個泡泡，數字往上跳
    if (G.chainEl) G.chainEl.remove();
    G.chainEl = bubble(T("連鎖 ×{0}！", chain + 1), cx, cy - 40);
  }
  else if (Math.random() < .25) bubble(T("啵！"), cx, cy - 40);
  if (m.id === "sofa" && Math.random() < .25) spring(cx, cy);
  // 連鎖：旁邊打到六成以上的區塊，接著一塊一塊碎
  setTimeout(() => {
    if (!G || G.done) return;
    for (const q of neighbors(p)) if (!h.pDone[q] && h.pTotal[q] && h.pHit[q] >= h.pTotal[q] * .6) { burstPatch(q, chain + 1); break; }
  }, 120);
}
function popNear(x, y) {
  const b = G.bub, gx = Math.floor(x / b.gap), gy = Math.floor(y / b.gap);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const ids = b.grid.get(`${gx + dx},${gy + dy}`); if (!ids) continue;
    for (const id of ids) {
      const q = b.list[id];
      if (q.popped || Math.hypot(q.x - x, q.y - y) > q.r * .95) continue;
      q.popped = true; G.holes++;
      // 破掉的泡泡：扁扁皺皺
      const c = dctx; c.fillStyle = G.m.hole; c.beginPath(); c.arc(q.x, q.y, q.r * .92, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(120,170,205,.8)"; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + rand(-.3, .3), rr = q.r * rand(.3, .85); c[i ? "lineTo" : "moveTo"](q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr); }
      c.closePath(); c.stroke();
      track2(q.x, q.y);
      FX.popSmall(); FX.vibrate(6);
      for (let i = 0; i < 2; i++) spawnDebris(q.x, q.y, rand(-1, 1), -1);
    }
  }
}
function claw(x0, y0, x1, y1, power = 1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 0.6) return;
  const nx = -dy / len, ny = dx / len, m = G.m, c = dctx;
  const sp = G.cat.spacing * (G.catId === "white" ? rand(.8, 1.35) : 1);
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * sp;
    const ax = x0 + nx * off, ay = y0 + ny * off, bx = x1 + nx * off, by = y1 + ny * off;
    // 爪痕線變淡，主角是洞
    c.lineCap = "round"; c.globalAlpha = m.mode === "bubble" ? .12 : .38; c.strokeStyle = m.mode === "bubble" ? "#ffffff" : m.groove; c.lineWidth = 2 * power;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.globalAlpha = 1;
    const step = 4;
    for (let s2 = 0; s2 <= len; s2 += step) {
      const px = ax + (bx - ax) * s2 / len, py = ay + (by - ay) * s2 / len;
      if (m.mode === "bubble") popNear(px, py); else punchAt(px, py);
    }
  }
  const n = len / 16 * (G.catId === "white" ? 1.7 : G.catId === "grey" ? .7 : 1);
  for (let i = 0; i < n; i++) if (Math.random() < n - i) spawnDebris(x0 + dx * Math.random(), y0 + dy * Math.random(), nx, ny);
  G.moved += len;
  if (G.moved > 50) { G.moved = 0; FX.vibrate(5); }
}
function spring(x, y) {
  // 沙發彈簧蹦出來
  const c = dctx; c.strokeStyle = "#8a8f96"; c.lineWidth = 3; c.lineCap = "round"; c.beginPath();
  for (let i = 0; i <= 8; i++) c.lineTo(x + (i % 2 ? 8 : -8), y - i * 4);
  c.stroke(); FX.boing();
  bubble(T("蹦！"), x, y - 40);
}
function spawnDebris(x, y, nx, ny) {
  if (G.particles.length > 1500) return;
  const m = G.m, side = Math.random() < .5 ? -1 : 1, sp = rand(60, 220);
  const fluff = m.debris === "fluff", plastic = m.debris === "plastic";
  G.particles.push({
    x, y, vx: nx * side * sp + rand(-60, 60), vy: ny * side * sp - rand(80, 240), rot: rand(0, 6.3), vr: rand(-8, 8),
    w: fluff ? rand(4, 8) : plastic ? rand(4, 8) : rand(7, 16), h: fluff ? 0 : plastic ? rand(3, 6) : rand(1.6, 3), fluff, plastic,
    color: fluff ? (Math.random() < .7 ? "#ffffff" : m.fuzz) : plastic ? "rgba(255,255,255,.75)" : (Math.random() < .6 ? m.base2 : m.fuzz),
    floor: Ht - rand(4, G.rainBand)
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
  else { c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.strokeStyle = p.plastic ? "rgba(120,170,205,.7)" : "rgba(60,40,20,.35)"; c.lineWidth = .6; c.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); }
  c.restore();
}
function bubble(text, x, y) {
  const b = document.createElement("div"); b.className = "bubble"; b.textContent = text;
  b.style.left = clamp(x - 40, 8, Wd - 120) + "px"; b.style.top = clamp(y, 60, Ht - 80) + "px";
  document.body.appendChild(b); setTimeout(() => b.remove(), 950);
  return b;
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
    if (Math.random() < len / 1400) punchArea(G.paw.x, G.paw.y, 20);
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
function setPaw(out) {
  // 有 AI 畫的貓掌就用（總編、架構師），沒有就用程式畫的
  const p = $("#paw"), src = ART && ART[G.catId] && ART[G.catId][out ? "pawOut" : "pawIn"];
  p.innerHTML = src ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:contain;object-position:top">` : pawSVG(G.catId, out);
  p.classList.toggle("down", out);
}
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
  if (now < G.rainUntil) {
    // 抓完：紙屑雨，堆得越來越高
    for (let i = 0; i < 22; i++) { spawnDebris(rand(0, Wd), rand(-40, Ht * .3), rand(-.3, .3), 1); const p = G.particles[G.particles.length - 1]; if (p) { p.vy = rand(100, 400); } }
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
    w: rand(4, 10), h: rand(2, 4), fluff: G.m.debris === "fluff", color: G.m.debris === "fluff" ? "#fff" : G.m.base2, floor: Ht - rand(4, G.rainBand) });
}
function updateMeter() {
  if (!G) return;
  G.progress = clamp(coverage() / .5 * G.cat.speed, 0, 1);
  $("#meterFill").style.width = G.progress * 100 + "%";
  $("#meterTxt").textContent = T("抓爛度 {0}%", Math.floor(G.progress * 100));
  $("#doneBtn").disabled = G.progress < .15;
}

/* ================= 抓完 ================= */
function coverage() { return G.holes / ((G.hx || G.bub).total || 1); }
function artStyle() {
  const cov = coverage();
  const tot = G.strokes.reduce((s, x) => s + x.path, 0) || 1;
  const straight = G.strokes.reduce((s, x) => s + x.path * x.straight, 0) / tot;
  const patches = G.hx ? G.hx.pTotal.filter(Boolean).length : 1;
  if ((G.bestChain || 0) >= 7) return "chain";
  if (G.hx && G.bursts / patches > .4) return "cheese";
  if (straight > .85) return "minimal";
  if (cov < .15) return "blank";
  if (cov > .42) return "wild";
  return "impression";
}
function finish() {
  G.done = true; G.down = false; G.pid = null; FX.quiet();
  $("#paw").style.opacity = 0;
  const sec = Math.max(1, Math.round((performance.now() - G.start) / 1000));
  // 先把抓完的畫存起來，再演「紙屑淹到只剩耳朵」
  G.snap = document.createElement("canvas"); G.snap.width = cv.width; G.snap.height = cv.height;
  const sc = G.snap.getContext("2d"); sc.drawImage(base, 0, 0); sc.drawImage(dmg, 0, 0); sc.drawImage(pile, 0, 0);
  $("#finishCat").innerHTML = ""; $("#finish").hidden = false;
  FX.purr(3.4);
  // 存檔：張數、時間、用過的貓、洞數
  save.paintings++; save.no++;
  save.time += Math.round(G.scratchMs / 1000);
  if (!save.cats.includes(G.catId)) save.cats.push(G.catId);
  save.maxHoles = Math.max(save.maxHoles, G.holes);
  save.totalHoles += G.holes;
  const info = { cat: G.catId, mat: G.m.id, sec, style: artStyle(), no: save.no, holes: G.holes, chain: G.bestChain || 0 };
  const fresh = checkUnlocks();
  G.rainBand = Ht * .3; G.rainUntil = performance.now() + 1100;
  setTimeout(diveIn, 1100);
  setTimeout(async () => {
    if (!G) return;
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
  }, 3300);
}
// 貓跳進紙屑堆：畫在爪痕那一層，再用紙屑堆蓋住，只露出耳朵（小弟只露尾巴）
const moundY = (x, y0) => y0 + 120 * Math.pow(Math.abs(x - Wd / 2) / (Wd / 2), 1.6);
async function diveIn() {
  if (!G) return;
  const id = G.catId, w = Math.min(Wd * .5, 220), top = Ht * .56, c = dctx;
  FX.plop(); bubble(T("噗通！"), Wd / 2 - 30, top - 70);
  let y0;
  if (id === "white") {
    const k = CATS.white;
    c.lineCap = "round";
    const tail = () => { c.beginPath(); c.moveTo(Wd / 2, top + 110); c.quadraticCurveTo(Wd / 2 - 30, top + 20, Wd / 2 + 10, top - 20); c.quadraticCurveTo(Wd / 2 + 34, top - 40, Wd / 2 + 26, top - 8); };
    c.strokeStyle = INK; c.lineWidth = 22; tail(); c.stroke();
    c.strokeStyle = k.fur; c.lineWidth = 15; tail(); c.stroke();
    c.strokeStyle = k.stripe; c.lineWidth = 15; c.beginPath(); c.moveTo(Wd / 2 + 10, top - 20); c.quadraticCurveTo(Wd / 2 + 34, top - 40, Wd / 2 + 26, top - 8); c.stroke();
    y0 = top + 70;
  } else {
    const im = (await loadImg(ART && ART[id] && ART[id].sit)) || await svgImage(catSVG(id, "sit"));
    if (!G) return;
    const h = im ? w * im.height / im.width : w;
    if (im) c.drawImage(im, Wd / 2 - w / 2, top, w, h);
    y0 = top + h * .3;
  }
  // 紙屑堆：一座小山，上面鋪滿紙屑
  const m = G.m, pc = pctx, fill = m.debris === "fluff" ? "#fffaf2" : m.debris === "plastic" ? "#e6f2fa" : m.base2;
  pc.fillStyle = fill; pc.beginPath(); pc.moveTo(0, Ht);
  for (let x = 0; x <= Wd; x += 6) pc.lineTo(x, moundY(x, y0) + 8);
  pc.lineTo(Wd, Ht); pc.closePath(); pc.fill();
  for (let i = 0; i < 1800; i++) {
    const x = rand(0, Wd), y = rand(moundY(x, y0), Ht);
    drawParticle(pc, { x, y, rot: rand(0, 6.3), w: m.debris === "fluff" ? rand(5, 10) : rand(7, 16), h: rand(1.6, 4), fluff: m.debris === "fluff", plastic: m.debris === "plastic",
      color: m.debris === "fluff" ? (Math.random() < .7 ? "#fff" : m.fuzz) : m.debris === "plastic" ? "rgba(255,255,255,.8)" : (Math.random() < .5 ? m.base2 : m.fuzz) });
  }
  G.rainBand = Ht - y0; G.rainUntil = performance.now() + 900;
}
function showUnlock(m) {
  $("#unlockIc").innerHTML = `<div>${m.icon}</div>${catImg(save.cat, "box", "unlockpic")}`;
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
  const comp = G.snap;
  x.fillStyle = "#3a2e2a"; roundRect(x, fx + 10, fy + 10, fw, fh, 28); x.fill();
  x.save(); roundRect(x, fx, fy, fw, fh, 28); x.clip();
  x.drawImage(comp, sx * DPR, sy * DPR, cw * DPR, ch * DPR, fx, fy, fw, fh);
  x.restore();
  x.lineWidth = 8; x.strokeStyle = "#3a2e2a"; roundRect(x, fx, fy, fw, fh, 28); x.stroke();
  // 文字
  const cat = CATS[info.cat];
  const title = LANG === "en" ? `“${W(ART_STYLES[info.style])} No.${info.no}”` : `《${W(ART_STYLES[info.style])} No.${info.no}》`;
  const im = (await loadImg(ART && ART[info.cat] && ART[info.cat].lie)) || await svgImage(catSVG(info.cat, "sit"));
  if (im) { const k = Math.min(190 / im.width, 190 / im.height); x.drawImage(im, 60 + (190 - im.width * k) / 2, 990 + (190 - im.height * k) / 2, im.width * k, im.height * k); }
  x.fillStyle = "#3a2e2a"; x.textAlign = "left";
  x.font = F(64, true); x.fillText(title, 270, 1068, 760);
  x.font = F(38); x.fillStyle = "#6a5a52";
  x.fillText(T("{0}的抓痕畫・{1}・{2} 秒", W(cat.name), W(cat.style), info.sec), 272, 1132, 760);
  const holesTxt = info.mat === "bubble" ? T("啵了 {0} 顆泡泡", info.holes.toLocaleString()) : T("這張打了 {0} 個洞", info.holes.toLocaleString());
  x.font = F(32); x.fillText(`${matById(info.mat).icon} ${W(matById(info.mat).name)}・${holesTxt}${info.chain >= 3 ? "・" + T("最長連鎖 ×{0}", info.chain) : ""}`, 272, 1184, 760);
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

if (!ART) $("#aiNote").hidden = true;
renderHome();

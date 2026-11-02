// 《抓爛它！》遊戲流程與畫面
const VERSION = "0.5.6";
const CHANGES = [
  "背景音樂調小聲、不會再兩首疊在一起（感謝玩家回報）",
  "材質改成一條路解鎖：用瓦楞紙抓 2 張開泡泡紙、用泡泡紙抓 1 張開沙發⋯⋯",
  "泡泡紙的「啵」變得清脆大聲，偶爾有特別大的一顆；架構師換上插畫貓掌",
  "畫名變成 18 種流派，還有策展人短評；作品集可以收集流派",
  "瓦楞紙有兩種花紋輪流出現，首頁可以切換",
  "沙發變得很難抓破：要重複抓，先起皺、勾出線頭、扯開縫，最後「啪」裂開露出棉花（感謝玩家回報）",
  "瓦楞紙改成沿著紙條扒開的長條抓痕（感謝玩家回報）",
  "同一張卡找到 3 次會變閃亮版；整人卡會噗一聲",
  "刮刮卡收集：每張紙下面藏一張驚喜插畫，抓開就收進收集冊（12 張＋全收集獎勵）",
  "找到的寶物可以送給貓咪",
  "跳舞時點貓會喵一聲跳更高；肉球章蓋滿 30 個變成大愛心",
  "小弟和總編的插畫換新（貓掌、尾巴）",
  "暴衝時間：連續狂抓會進入 8 秒暴衝，洞多三倍、畫面跟著晃",
  "一整排碎光會大慶祝；長按可以蓋肉球印章",
  "解鎖新材質或破紀錄，三隻貓出來跳舞",
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
const save = Object.assign({ paintings: 0, time: 0, cats: [], maxHoles: 0, totalHoles: 0, frenzy: 0, tex: "code", unlocked: ["cardboard"], album: [], cat: "orange", mat: "cardboard", no: 0, muted: false, found: {}, bag: {}, reward: false },
  store.get(SAVE_KEY, {}));
function persist() {
  // 作品集的圖比較大：存不下就丟掉最舊的再試
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
// 每個材質各自的紀錄（解鎖條件「用某個材質完成某件事」要用）；舊存檔沒有就用總數補上瓦楞紙
if (!save.ms) save.ms = { cardboard: { p: save.paintings, cats: save.cats.slice(), t: save.time } };
const matStat = id => save.ms[id] || { p: 0, cats: [], t: 0 };
function unlockState(m) {
  const u = m.unlock; if (!u) return { done: true, frac: 1 };
  if (u.after && !save.unlocked.includes(u.after)) return { done: false, frac: 0, blocked: true };
  const n = u.n || 1, st = u.mat ? matStat(u.mat) : null;
  if (u.type === "matPaintings") return { done: st.p >= n, frac: st.p / n };
  if (u.type === "allcatsOn") return { done: st.cats.length >= 3, frac: st.cats.length / 3 };
  if (u.type === "matTime") return { done: st.t >= n, frac: st.t / n };
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
  const u = m.unlock, n = u.n || 1, st = u.mat ? matStat(u.mat) : null;
  if (u.after && !save.unlocked.includes(u.after)) return T("先解鎖{0}", W(matById(u.after).name));
  if (u.type === "matPaintings") return `${Math.min(st.p, n)}/${n}`;
  if (u.type === "allcatsOn") return `${st.cats.length}/3`;
  if (u.type === "matTime") return T("{0}/{1} 分鐘", Math.floor(st.t / 60), Math.round(n / 60));
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
  if (u.mat) return T(UNLOCK_TEXT[u.type], W(matById(u.mat).name), u.type === "matTime" ? Math.round(u.n / 60) : (u.n || 0).toLocaleString());
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
const imgCache = {}, imgReady = {};
function loadImg(src) {
  if (!src) return Promise.resolve(null);
  if (!imgCache[src]) imgCache[src] = new Promise(res => { const im = new Image(); im.onload = () => { imgReady[src] = im; res(im); }; im.onerror = () => res(null); im.src = src; });
  return imgCache[src];
}
// 材質貼圖：已經載好就用，沒有就回傳 null（用程式畫的）
const matArt = (m, k) => { const src = MAT_ART[m.id] && MAT_ART[m.id][k]; return src ? imgReady[src] || null : null; };
for (const a of Object.values(MAT_ART)) for (const src of Object.values(a)) loadImg(src);
function fillTile(c, im, x, y, w, h, size = 200) {
  const k = size / im.width; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.scale(k, k); c.fillStyle = c.createPattern(im, "repeat"); c.fillRect(x / k, y / k, w / k, h / k); c.restore();
}
if (ART) { for (const id of Object.keys(CATS)) for (const k of Object.keys(ART[id])) loadImg(ART[id][k]); loadImg(ART.flux); }

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
// 舊存檔升級：已經達成的條件，打開遊戲就解鎖
{ const fresh = checkUnlocks(); if (fresh.length) { persist(); setTimeout(() => toast(T("解鎖新材質：{0}！", fresh.map(m => W(m.name)).join("、")), 3000), 600); } }
renderHome();
    });
    mats.appendChild(b);
  }
  if (!save.unlocked.includes(save.mat)) save.mat = "cardboard";
  $("#albumBtn").textContent = T("🖼️ 作品集（{0}）", save.album.length);
  $("#bookBtn").hidden = !ART;
  const bagN = CARDS.reduce((a, cd) => a + (save.bag[cd.id] || 0), 0);
  $("#bookBtn").textContent = T("📒 收集冊 {0}/{1}", foundCount(), CARDS.length) + (bagN ? " 🎁" : "");
  // 貓抓板花紋：程式畫／AI 圖，給 摩卡與貓貓小隊 比較
  $("#texBtn").hidden = !ART || save.mat !== "cardboard";
  $("#texBtn").textContent = T("瓦楞紙花紋：{0}（點一下換）", T(TEX_NAME[save.tex]));
}
$("#startBtn").addEventListener("click", () => { FX.tap(); startGame(); });
$("#albumBtn").addEventListener("click", () => { FX.tap(); openAlbum(); });
$("#albumBtn2").addEventListener("click", () => { FX.tap(); openAlbum(); });
$("#albumBack").addEventListener("click", () => { FX.tap(); show("home"); renderHome(); });
$("#homeBtn").addEventListener("click", () => { FX.tap(); show("home"); renderHome(); });
$("#againBtn").addEventListener("click", () => { FX.tap(); startGame(); });
// 瓦楞紙花紋：輪流（每張畫換一種，避免膩）→ 只用程式畫 → 只用 FLUX 圖
const TEX_NAME = { mix: "輪流", code: "花紋 A（程式畫）", flux: "花紋 B（AI 圖）" };
// 舊存檔的預設是 code（不是玩家選的），升級時改成輪流
if (save.texV !== 2) { save.tex = "mix"; save.texV = 2; }
$("#texBtn").addEventListener("click", () => { save.tex = { mix: "code", code: "flux", flux: "mix" }[save.tex]; persist(); FX.tap(); renderHome(); });
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
  const tile = matArt(m, "base");
  if (tile) {
    // 有材質插畫就拼貼鋪滿（泡泡紙的泡泡位置還是照程式排）
    fillTile(c, tile, 0, 0, Wd, Ht);
    c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 6; c.strokeRect(3, 3, Wd - 6, Ht - 6);
  } else if (m.id === "cardboard" && G.tex === "flux" && texImg) {
    // FLUX 的瓦楞波浪紋：一張 15 條波浪，縮成 105px 拼貼＝一條波浪對齊一條 7px 的紙，下移半條讓波浪在紙條正中間（抓痕剛好撕在波浪上）
    const k = 105 / texImg.width;
    c.save(); c.translate(0, 3.5); c.scale(k, k); c.fillStyle = c.createPattern(texImg, "repeat"); c.fillRect(0, -10, Wd / k, (Ht + 10) / k); c.restore();
    // 每條紙深淺不一（跟花紋 A 一樣），不會一整片太平
    for (let y = 0; y < Ht; y += 7) { const t = rand(-1, 1); c.fillStyle = t > 0 ? `rgba(255,240,215,${t * .12})` : `rgba(80,50,20,${-t * .12})`; c.fillRect(0, y, Wd, 7); c.fillStyle = "rgba(95,62,28,.25)"; c.fillRect(0, y + 5.8, Wd, 1.2); }
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
    progress: 0, done: false, minX: Wd, minY: Ht, maxX: 0, maxY: 0,
    press: null, stamps: 0, rows: 0, rowDone: {}, lastRowFx: 0,
    // 暴衝時間：一局最多一次。抓到隨機的進度點（30～65%）時正在連續抓 4 秒以上，或抓到某個隨機時間點（小弟比較容易）
    zoom: 0, zoomUntil: 0, zoomP: rand(.3, .65), zoomAt: Math.random() < (save.cat === "white" ? .7 : .3) ? rand(8000, 16000) : Infinity
  };
  // 驚喜插畫的位置：畫面中間一個正方形
  const ps = Math.min(Wd - 28, Ht * .5);
  G.pic = { x: (Wd - ps) / 2, y: Ht * .47 - ps / 2, s: ps };
  G.picTot = 0; G.picHit = 0; G.found = false;
  setGrid(m);
  if (m.mode === "bubble") setupBubbles(); else setupHoles();
  paintUnder(m);
  texImg = null;
  G.tex = !ART ? "code" : save.tex === "mix" ? (save.no % 2 ? "flux" : "code") : save.tex;
  if (m.id === "cardboard" && G.tex === "flux") { texImg = imgReady[ART.flux] || null; if (!texImg) loadImg(ART.flux).then(im => { texImg = im; if (G && im && G.holes === 0) paintBase(m); }); }
  paintBase(m);
  setPaw(false); $("#paw").style.opacity = .85; G.paw.x = Wd / 2; G.paw.y = Ht * .62; movePaw();
  $("#catChip").innerHTML = `${catImg(save.cat, "sit", "chippic")}<span>${W(cat.name)}</span>`;
  $("#doneBtn").disabled = true; $("#finish").hidden = true; $("#hint").style.opacity = 1;
  updateMeter();
  FX.start(m);
  G.track = G.catId === "white" || m.id === "bubble" ? "busy" : "calm";
  FX.music(G.track);
  cv.style.transform = "";
  // 第一次玩泡泡紙：提醒開聲音
  if (m.id === "bubble" && !save.soundHint) { save.soundHint = 1; persist(); setTimeout(() => toast(FX.muted ? T("開聲音更好玩 🔊（右上角）") : T("開聲音更好玩 🔊 iPhone 記得關掉側邊靜音鍵"), 3500), 400); }
  cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
}
$("#quitBtn").addEventListener("click", () => { FX.tap(); endPlay(); show("home"); renderHome(); });
$("#doneBtn").addEventListener("click", () => { if (G && !G.done) { G.pressedDone = true; finish(); } });
function endPlay() { cancelAnimationFrame(raf); FX.stop(); cv.style.transform = ""; document.body.classList.remove("zoomies"); $("#paw2").hidden = true; G = null; }

/* ================= 抓：爪痕＋密密麻麻的小洞 ================= */
// 「幸福的密集恐懼感」：爪尖沿路打出小圓洞，洞吸附在蜂巢格上，越抓越整齊密集；
// 一小塊（6×6 格）打到 85% 就「啵」一聲整片碎掉，旁邊快滿的區塊會跟著連鎖碎掉
// 格子：一般是蜂巢小圓洞；瓦楞紙改成沿著紙條排的「長條抓痕」格（一列對齊一條紙，橫向很密）
let HEX = 9, ROWH = 9 * 0.866, OFF = true, Y0 = 0;
const PATCH = 6;
let PX = 6;   // 一個區塊橫向幾格（瓦楞紙 8 格：直著抓不會一下就整欄碎掉）
function setGrid(m) {
  if (m.mode === "strip") { HEX = 6; ROWH = 7; OFF = false; Y0 = 3.5; PX = 8; }
  else { HEX = 9; ROWH = 9 * 0.866; OFF = true; Y0 = 0; PX = 6; }
}
const hexPos = (i, j) => [i * HEX + (OFF && j % 2 ? HEX / 2 : 0), Y0 + j * ROWH];
const patchOf = (i, j) => Math.floor(j / PATCH) * G.hx.pc + Math.floor(i / PX);
function setupHoles() {
  const cols = Math.ceil(Wd / HEX) + 1, rows = Math.ceil(Ht / ROWH) + 1, pc = Math.ceil(cols / PX), pr = Math.ceil(rows / PATCH);
  const h = G.hx = { cols, rows, pc, punched: new Uint8Array(cols * rows), pTotal: new Uint16Array(pc * pr), pHit: new Uint16Array(pc * pr), pDone: new Uint8Array(pc * pr), total: 0,
    dmg: new Float32Array(cols * rows), last: new Float32Array(cols * rows) };   // 沙發：每格的破壞程度、上次被抓的時間
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const [x, y] = hexPos(i, j);
    if (x > 6 && x < Wd - 6 && y > 6 && y < Ht - 6) { h.pTotal[patchOf(i, j)]++; h.total++; } else h.punched[j * cols + i] = 2;   // 2 = 邊框外
  }
  // 哪些區塊在驚喜插畫上：碎掉的比例決定「找到了沒」
  h.inPic = new Uint8Array(pc * pr); const P = G.pic;
  for (let b = 0; b < pr; b++) for (let a = 0; a < pc; a++) {
    const x = (a * PX + PX / 2) * HEX, y = Y0 + (b * PATCH + PATCH / 2) * ROWH;
    if (h.pTotal[b * pc + a] && x > P.x && x < P.x + P.s && y > P.y && y < P.y + P.s) { h.inPic[b * pc + a] = 1; G.picTot++; }
  }
  G.picCellTot = 0; G.picRip = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const [x, y] = hexPos(i, j); if (h.punched[j * cols + i] !== 2 && x > P.x && x < P.x + P.s && y > P.y && y < P.y + P.s) G.picCellTot++; }
}
// 紙下面藏著一張驚喜插畫（刮刮卡）；沒有 AI 圖時用程式畫的大圖案
const MOTIFS = ["heart", "fish", "paw", "catface", "star"];
function pickCard() {
  // 依稀有度抽；還沒收集到的機率高一點
  const pool = CARDS.map(cd => ({ cd, w: RARITY[cd.rarity].weight / CARDS.filter(x => x.rarity === cd.rarity).length * (save.found[cd.id] ? 1 : 1.6) }));
  let r = Math.random() * pool.reduce((a, x) => a + x.w, 0);
  for (const x of pool) if ((r -= x.w) <= 0) return x.cd;
  return pool[0].cd;
}
function paintUnder(m) {
  G.under = makeLayer(); const c = G.under.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.fillStyle = m.under; c.fillRect(0, 0, Wd, Ht);
  const ut = matArt(m, "under");
  if (ut) fillTile(c, ut, 0, 0, Wd, Ht);
  else if (m.mode === "strip") {
    // 瓦楞紙扒開後露出的深色波浪芯，一條條排好
    for (let y = 0; y < Ht; y += 7) {
      c.fillStyle = "rgba(60,35,15,.35)"; c.fillRect(0, y + 5.8, Wd, 1.2);
      c.strokeStyle = "rgba(240,205,150,.45)"; c.lineWidth = 1.2; c.beginPath();
      for (let x = 0; x <= Wd; x += 1.5) { const yy = y + 3.5 + Math.sin(x * .9) * 2; x ? c.lineTo(x, yy) : c.moveTo(x, yy); }
      c.stroke();
    }
  } else {
    // 底層也鋪滿整齊的小點點（密集感）
    c.fillStyle = "rgba(60,40,20,.22)";
    for (let j = 0; j * ROWH < Ht; j++) for (let i = 0; i * HEX < Wd; i++) { const [x, y] = hexPos(i, j); c.beginPath(); c.arc(x, y, 1.4, 0, Math.PI * 2); c.fill(); }
  }
  G.card = ART ? pickCard() : null;
  if (!G.card) { drawMotif(c, m); return; }
  const P = G.pic, cd = G.card, g = G;
  c.fillStyle = cd.sticker ? "#fff3d6" : "#fffaf2"; roundRect(c, P.x, P.y, P.s, P.s, 18); c.fill();
  loadImg(cardImg(cd.id)).then(im => {
    if (g !== G) return;
    if (!im) { G.card = null; drawMotif(c, m); return; }
    c.save(); roundRect(c, P.x, P.y, P.s, P.s, 18); c.clip();
    if (cd.sticker) {
      // 貼紙：暖色底＋放射狀光芒，貼紙放中間
      c.fillStyle = "#ffe9b8";
      for (let i = 0; i < 16; i++) { const a0 = i / 16 * Math.PI * 2; c.beginPath(); c.moveTo(P.x + P.s / 2, P.y + P.s / 2); c.arc(P.x + P.s / 2, P.y + P.s / 2, P.s, a0, a0 + Math.PI / 16); c.fill(); }
      const k = Math.min(P.s * .86 / im.width, P.s * .86 / im.height);
      c.drawImage(im, P.x + (P.s - im.width * k) / 2, P.y + (P.s - im.height * k) / 2, im.width * k, im.height * k);
    } else c.drawImage(im, P.x, P.y, P.s, P.s);
    c.restore();
    c.lineWidth = 5; c.strokeStyle = INK; roundRect(c, P.x, P.y, P.s, P.s, 18); c.stroke();
    peekCorner();
    // 好玩很多：超稀有卡的紙會閃閃發光
    if (cd.rarity === 3) { G.sparks = []; setTimeout(() => G === g && bubble(T("這張紙在閃閃發光…✨"), Wd / 2 - 90, P.y - 30), 600); }
  });
}
// 掀起一小塊：開局紙上已經破了一個小洞、紙片翹起來，偷看得到插畫的一部分
function peekCorner() {
  const P = G.pic, c = dctx, m = G.m;
  const x = P.x + P.s / 2 + rand(-.2, .2) * P.s, y = P.y + P.s / 2 + rand(-.2, .2) * P.s;
  const pts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = rand(24, 32); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * .85]); }
  const path = () => { c.beginPath(); pts.forEach(([u, v], i) => c[i ? "lineTo" : "moveTo"](u, v)); c.closePath(); };
  c.save(); path(); c.clip(); c.drawImage(G.under, 0, 0, Wd, Ht); c.restore();
  c.strokeStyle = m.fuzz; c.lineWidth = 3; path(); c.stroke();
  // 翹起來的紙片：接在洞的右上邊
  const [ax, ay] = pts[14], [bx, by] = pts[17];
  c.save(); c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = 6; c.shadowOffsetX = -2; c.shadowOffsetY = 3;
  c.fillStyle = m.base2 || m.base; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(x + 46, y - 42); c.closePath(); c.fill(); c.restore();
  c.strokeStyle = m.fuzz; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ax, ay); c.lineTo(x + 46, y - 42); c.lineTo(bx, by); c.stroke();
  track2(x, y);
}
// 插畫上的區塊碎掉三成：找到了！
const REVEAL_AT = .3;
const inPicRect = (x, y) => { const P = G.pic; return x > P.x && x < P.x + P.s && y > P.y && y < P.y + P.s; };
function checkReveal() {
  if (!G.card || G.found) return;
  // 沙發很難碎，改看插畫上裂開的格子：裂開快兩成就「啪」一大片撕開
  if (G.m.tough ? (G.picRip || 0) < G.picCellTot * .18 : G.picHit < G.picTot * REVEAL_AT) return;
  G.found = true;
  if (G.m.tough) openPic();
  const cd = G.card, r = RARITY[cd.rarity], el = $("#reveal");
  // 同一張卡第 3 次找到：解鎖閃亮版
  const n = save.found[cd.id] || 0, tag = !n ? "・" + T("新卡片！") : n + 1 === SHINY_AT ? "・" + T("✨ 閃亮版解鎖！") : "";
  el.innerHTML = `<span class="pic${n + 1 >= SHINY_AT ? " shiny" : ""}"><img src="${cardImg(cd.id)}" alt=""></span><div><b>${T(cd.say)}</b><small style="background:${r.color}">${r.stars} ${T(r.name)}${tag}</small></div>`;
  el.hidden = false; el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
  clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 2800);
  FX.reveal(cd.rarity); FX.vibrate([20, 40, 20]);
  // 整人卡：噗一聲、畫面抖一下
  if (cd.kind === "prank") {
    setTimeout(() => { FX.pfft(); FX.vibrate([60, 30, 90]); cv.classList.add("shake"); setTimeout(() => cv.classList.remove("shake"), 500); }, 350);
  }
}
const SHINY_AT = 3;
function openPic() {
  const h = G.hx, P = G.pic, pc = h.pc, cx = P.x + P.s / 2, cy = P.y + P.s / 2, list = [];
  for (let q = 0; q < h.inPic.length; q++) if (h.inPic[q] && !h.pDone[q]) {
    const x = ((q % pc) * PX + PX / 2) * HEX, y = Y0 + (Math.floor(q / pc) * PATCH + PATCH / 2) * ROWH;
    list.push([Math.hypot(x - cx, y - cy), q]);
  }
  list.sort((a, b) => a[0] - b[0]).slice(0, 9).forEach(([, q], n) => setTimeout(() => G && !G.done && burstPatch(q, n ? 1 : 0), n * 80));
  FX.tear(); FX.vibrate([30, 20, 60]);
}
function drawMotif(c, m) {
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
}
function setupBubbles() {
  const r = 8.5, gap = 19, list = [], grid = new Map(), rowLeft = [], rowTot = [], rowDone = [];
  for (let j = 0, y = gap * .8; y < Ht - gap * .5; j++, y += gap * .866)
    for (let x = (j % 2 ? gap : gap / 2) + 2; x < Wd - gap * .4; x += gap) {
      const k = `${Math.floor(x / gap)},${Math.floor(y / gap)}`;
      if (!grid.has(k)) grid.set(k, []);
      const P = G.pic, inPic = x > P.x && x < P.x + P.s && y > P.y && y < P.y + P.s; if (inPic) G.picTot++;
      grid.get(k).push(list.length); list.push({ x, y, r, j, inPic, popped: false });
      rowLeft[j] = (rowLeft[j] || 0) + 1; rowTot[j] = rowLeft[j];
    }
  G.bub = { r, gap, list, grid, rowLeft, rowTot, rowDone, total: list.length };
}
// 畫名用的統計：洞在左／右半邊、在邊邊、暴衝時打的
function holeAt(x, y) {
  const st = G.st || (G.st = { l: 0, r: 0, edge: 0, zoom: 0 });
  if (x < Wd / 2) st.l++; else st.r++;
  if (x < Wd * .15 || x > Wd * .85 || y < Ht * .15 || y > Ht * .85) st.edge++;
  if (G.zoom === 1) st.zoom++;
}
function track2(x, y) { G.minX = Math.min(G.minX, x); G.maxX = Math.max(G.maxX, x); G.minY = Math.min(G.minY, y); G.maxY = Math.max(G.maxY, y); }
function punchAt(x, y) {
  const j = Math.round((y - Y0) / ROWH), i = Math.round((x - (OFF && j % 2 ? HEX / 2 : 0)) / HEX);
  if (!punchCell(i, j)) return;
  // 瓦楞紙：沿著紙條方向一起被扒開，抓痕拉長
  if (G.m.mode === "strip") { if (Math.random() < .45) punchCell(i + 1, j); if (Math.random() < .45) punchCell(i - 1, j); }
}
function punchCell(i, j) {
  const h = G.hx;
  if (i < 0 || j < 0 || i >= h.cols || j >= h.rows) return false;
  const k = j * h.cols + i; if (h.punched[k]) return false;
  const p = patchOf(i, j); if (h.pDone[p]) return false;
  const [cx, cy] = hexPos(i, j), c = dctx, m = G.m;
  if (m.tough && !toughHit(h, k, cx, cy)) return false;
  h.punched[k] = 1; G.holes++; h.pHit[p]++; holeAt(cx, cy);
  if (m.tough && inPicRect(cx, cy)) { G.picRip = (G.picRip || 0) + 1; checkReveal(); }
  if (m.mode === "strip") {
    // 長條抓痕：紙條表面被刮開，露出深色的縫，上下是翹起來的淺色毛邊；相鄰的格子連成一長條
    c.fillStyle = m.hole; c.fillRect(cx - HEX / 2 - .6, cy - 1.5, HEX + 1.2, 3);
    c.fillStyle = m.fuzz;
    for (let x = cx - HEX / 2; x < cx + HEX / 2; x += 1.5) { c.fillRect(x, cy - 2.6 - rand(0, 1.2), 1.2, rand(.8, 1.6)); c.fillRect(x, cy + 1.4, 1.2, rand(.5, 1.3)); }
    if (Math.random() < .12) {
      // 翹起來的小紙條
      c.strokeStyle = m.fuzz; c.lineWidth = 1.4; c.lineCap = "round"; c.beginPath();
      c.moveTo(cx, cy - 2); c.quadraticCurveTo(cx + rand(2, 5), cy - rand(4, 7), cx + rand(5, 9), cy - rand(2, 6)); c.stroke();
    }
  } else if (m.tough && !matArt(m, "hole")) {
    // 沙發裂開：露出白白的棉花，四周是扯斷的線頭
    c.fillStyle = m.hole;
    for (let n = 0; n < 4; n++) { c.beginPath(); c.arc(cx + rand(-1.6, 1.6), cy + rand(-1.6, 1.6), rand(1.8, 2.8), 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = m.fuzz; c.lineWidth = .9; c.lineCap = "round";
    for (let n = 0; n < 3; n++) { const a = rand(0, 6.3); c.beginPath(); c.moveTo(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3); c.lineTo(cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5); c.stroke(); }
    if (Math.random() < .12) spawnDebris(cx, cy, rand(-1, 1), -1);
    if (performance.now() - (G.lastTear || 0) > 70) { G.lastTear = performance.now(); FX.tear(); }
    FX.vibrate(22);
  } else if (matArt(m, "hole")) {
    // 洞的插畫（例如沙發露出棉花、布邊毛邊），每個洞轉個隨機角度
    const im = matArt(m, "hole"), sz = HEX * 1.15;
    c.save(); c.translate(cx, cy); c.rotate(rand(0, 6.3)); c.drawImage(im, -sz / 2, -sz / 2, sz, sz); c.restore();
  } else {
    c.fillStyle = m.hole; c.beginPath(); c.arc(cx, cy, 2.9, 0, Math.PI * 2); c.fill();
    c.strokeStyle = m.fuzz; c.lineWidth = .9; c.stroke();
  }
  track2(cx, cy);
  if (Math.random() < .1) spawnDebris(cx, cy, rand(-1, 1), -1);
  if (h.pHit[p] >= h.pTotal[p] * (m.tough ? .7 : .85)) burstPatch(p, 0);
  return true;
}
// 沙發布很難抓破：同一格要重複抓好幾次，越快越用力（暴衝時加倍）
// ①起皺、淺抓痕 ②起毛球、線頭被勾出來 ③扯開一條縫 ④「啪」裂開、棉花跑出來
function toughHit(h, k, cx, cy) {
  const now = performance.now();
  if (now - h.last[k] < 110) return false;      // 同一筆劃過去只算一次
  h.last[k] = now;
  const pw = (.6 + Math.min(G.speed || 0, 2.5) * .5) * (G.zoom === 1 ? 2 : 1);
  const before = h.dmg[k], after = h.dmg[k] = Math.min(4, before + pw);
  const st = Math.floor(after);
  if (st >= 4) return true;
  if (st > Math.floor(before)) {
    const c = dctx, m = G.m, a = rand(-.5, .5);
    if (st === 1) { c.strokeStyle = "rgba(0,0,0,.16)"; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 3 * Math.cos(a), cy - 3 * Math.sin(a)); c.lineTo(cx + 3 * Math.cos(a), cy + 3 * Math.sin(a)); c.stroke(); }
    else if (st === 2) {
      c.strokeStyle = m.fuzz; c.lineWidth = 1; c.lineCap = "round"; c.beginPath(); c.arc(cx, cy, 1.4, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(cx + rand(-3, 3), cy + 3, cx + rand(-4, 4), cy + rand(4, 7)); c.stroke();
      if (Math.random() < .25) FX.twang(.6); FX.vibrate(6);
    } else {
      c.strokeStyle = m.groove; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.moveTo(cx - 3.5 * Math.cos(a), cy - 3.5 * Math.sin(a)); c.lineTo(cx + 3.5 * Math.cos(a), cy + 3.5 * Math.sin(a)); c.stroke();
      c.strokeStyle = m.fuzz; c.lineWidth = .8; c.beginPath(); c.moveTo(cx - 3 * Math.cos(a), cy - 3 * Math.sin(a) - 1.6); c.lineTo(cx + 3 * Math.cos(a), cy + 3 * Math.sin(a) - 1.6); c.stroke();
      if (Math.random() < .35) FX.twang(1); FX.vibrate(12);
    }
  }
  return false;
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
  if (h.inPic[p]) { G.picHit++; checkReveal(); }
  const pc = h.pc, pi = p % pc, pj = Math.floor(p / pc), c = dctx, m = G.m;
  let full = true;
  for (let i = 0; i < pc; i++) { const q = pj * pc + i; if (h.pTotal[q] && !h.pDone[q]) { full = false; break; } }
  const cells = [];
  for (let j = pj * PATCH; j < Math.min(h.rows, (pj + 1) * PATCH); j++) for (let i = pi * PX; i < Math.min(h.cols, (pi + 1) * PX); i++) {
    const k = j * h.cols + i; if (h.punched[k] === 2) continue;
    if (!h.punched[k]) { h.punched[k] = 1; G.holes++; const [hx, hy] = hexPos(i, j); holeAt(hx, hy); }
    cells.push(hexPos(i, j));
  }
  if (!cells.length) return;
  // 整片碎掉，露出底下藏的圖案
  c.save(); c.beginPath();
  if (OFF) for (const [x, y] of cells) { c.moveTo(x + HEX * .7, y); c.arc(x, y, HEX * .7, 0, Math.PI * 2); }
  else for (const [x, y] of cells) c.rect(x - HEX / 2 - .5, y - ROWH / 2, HEX + 1, ROWH);
  c.clip(); c.drawImage(G.under, 0, 0, Wd, Ht); c.restore();
  if (!OFF) {
    // 瓦楞紙：每條紙被撕開的上下邊都留一圈淺色毛邊，看起來是一條條扒掉的
    c.fillStyle = m.fuzz;
    for (const [x, y] of cells) for (let xx = x - HEX / 2; xx < x + HEX / 2; xx += 1.5) { c.fillRect(xx, y - ROWH / 2, 1.2, rand(.6, 1.8)); if (Math.random() < .5) c.fillRect(xx, y + ROWH / 2 - rand(.5, 1.2), 1.2, 1); }
  }
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
  // 彈簧偶爾蹦出來（一次最多一個，隔 2 秒）
  if (m.id === "sofa" && chain === 0 && Math.random() < .3 && performance.now() - (G.lastSpring || 0) > 2000) { G.lastSpring = performance.now(); spring(cx, cy); }
  // 一排碎了六成：剩下的區塊從左到右一路掃過去碎掉，整排清光
  if (!G.rowDone[pj]) {
    let done = 0, tot = 0;
    for (let i = 0; i < pc; i++) { const q = pj * pc + i; if (h.pTotal[q]) { tot++; done += h.pDone[q]; } }
    if (full || done >= tot * .6) {
      G.rowDone[pj] = 1;
      const rest = []; for (let i = 0; i < pc; i++) { const q = pj * pc + i; if (h.pTotal[q] && !h.pDone[q]) rest.push(q); }
      rest.forEach((q, n) => setTimeout(() => G && !G.done && burstPatch(q, 0), 160 + n * 70));
      setTimeout(() => G && !G.done && rowClear(Y0 + (pj + .5) * PATCH * ROWH - ROWH / 2, PATCH * ROWH), 200 + rest.length * 70);
    }
  }
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
      q.popped = true; G.holes++; holeAt(q.x, q.y);
      // 一排啵了八成：剩下的從左到右一路啵過去
      if (--b.rowLeft[q.j] <= b.rowTot[q.j] * .2 && !b.rowDone[q.j]) {
        b.rowDone[q.j] = 1;
        const rest = b.list.filter(o => o.j === q.j && !o.popped).sort((u, v) => u.x - v.x), y = q.y;
        rest.forEach((o, n) => setTimeout(() => G && !G.done && popNear(o.x, o.y), 120 + n * 45));
        setTimeout(() => G && !G.done && rowClear(y, b.gap * .9), 160 + rest.length * 45);
      }
      // 破掉的泡泡：扁扁皺皺
      const c = dctx;
      // 破掉的泡泡露出下面的插畫：圓圈放大到蓋住泡泡之間的縫，整片啵完就是完整的圖
      c.save(); c.beginPath(); c.arc(q.x, q.y, b.gap * .6, 0, Math.PI * 2); c.clip(); c.drawImage(G.under, 0, 0, Wd, Ht);
      c.fillStyle = "rgba(255,255,255,.18)"; c.fill(); c.restore();
      if (q.inPic) { G.picHit++; checkReveal(); }
      c.strokeStyle = "rgba(120,170,205,.4)"; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + rand(-.3, .3), rr = q.r * rand(.3, .85); c[i ? "lineTo" : "moveTo"](q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr); }
      c.closePath(); c.stroke();
      track2(q.x, q.y);
      G.popSeq = (G.popSeq || 0) + 1;
      if (Math.random() < .05 && performance.now() - (G.lastBigPop || 0) > 2500) {
        G.lastBigPop = performance.now();
        // 驚喜：特別大的一顆
        FX.bigPop(); FX.vibrate(35);
        if (performance.now() - (G.lastBig || 0) > 1500) { G.lastBig = performance.now(); bubble(T("啪！"), q.x, q.y - 50); }
      } else { FX.bubblePop(G.catId, G.popSeq); FX.vibrate(6); }
      for (let i = 0; i < 2; i++) spawnDebris(q.x, q.y, rand(-1, 1), -1);
    }
  }
}
function claw(x0, y0, x1, y1, power = 1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 0.6) return;
  const nx = -dy / len, ny = dx / len, m = G.m, c = dctx;
  const sp = G.cat.spacing * (G.catId === "white" ? rand(.8, 1.35) : 1);
  // 暴衝時：爪痕變粗，每一爪打兩排洞，再加上第二隻掌一起抓（共約三倍）
  const z = G.zoom === 1 && power > 0, lanes = z ? [-HEX * .3, HEX * .3] : [0];
  if (z) power *= 1.8;
  power = Math.abs(power);
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * sp;
    const ax = x0 + nx * off, ay = y0 + ny * off, bx = x1 + nx * off, by = y1 + ny * off;
    // 爪痕線變淡，主角是洞
    c.lineCap = "round"; c.globalAlpha = m.mode === "bubble" ? .12 : .38; c.strokeStyle = m.mode === "bubble" ? "#ffffff" : m.groove; c.lineWidth = 2 * power;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.globalAlpha = 1;
    const step = 4;
    for (let s2 = 0; s2 <= len; s2 += step) {
      const px = ax + (bx - ax) * s2 / len, py = ay + (by - ay) * s2 / len;
      for (const o of lanes) { const qx = px + nx * o, qy = py + ny * o; if (m.mode === "bubble") popNear(qx, qy); else punchAt(qx, qy); }
    }
  }
  const n = len / 16 * (G.catId === "white" ? 1.7 : G.catId === "grey" ? .7 : 1) * (z ? 3 : 1);
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
  if (G.press && Math.hypot(x - G.press.x, y - G.press.y) > 12) G.press = null;
  if (G.press && G.press.n) return;   // 正在蓋印章：手指小抖動不算抓
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
  G.speed = (G.speed || 0) * .7 + d / dt * .3;
  FX.scratch(d / dt);
  if (d > 0.5) { G.scratchMs += Math.min(dt, 60); G.lastMove = now; }
  if (G.zoom === 1 && d > 0.5) claw(prev.x + 46, prev.y + 14, G.paw.x + 46, G.paw.y + 14, -1.8);
  movePaw();
}
function setPaw(out) {
  // 有 AI 畫的貓掌就用（總編、架構師），沒有就用程式畫的
  const p = $("#paw"), src = ART && ART[G.catId] && ART[G.catId][out ? "pawOut" : "pawIn"];
  p.innerHTML = src ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:contain;object-position:top">` : pawSVG(G.catId, out);
  p.classList.toggle("down", out);
}
function movePaw() {
  const p = $("#paw"); p.style.left = G.paw.x + "px"; p.style.top = G.paw.y + "px";
  const q = $("#paw2"); if (!q.hidden) { q.style.left = G.paw.x + 46 + "px"; q.style.top = G.paw.y + 14 + "px"; }
}

cv.addEventListener("pointerdown", e => {
  if (!G || G.done || G.pid !== null) return;
  e.preventDefault(); FX.unlock();
  G.pid = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch {}
  G.down = true; G.fx = e.clientX; G.fy = e.clientY; G.lx = e.clientX; G.ly = e.clientY;
  G.paw.x = e.clientX; G.paw.y = e.clientY;
  G.stroke = { ax: e.clientX, ay: e.clientY, sx: e.clientX, sy: e.clientY, dir: null, path: 0 };
  G.press = { x: e.clientX, y: e.clientY, t: performance.now(), n: 0, next: 0 };
  G.popSeq = 0;   // 總編：每一筆從低音開始，沿著一排越啵越高
  G.lastT = performance.now();
  setPaw(true); $("#paw").style.opacity = 1; movePaw();
  $("#hint").style.opacity = 0;
});
cv.addEventListener("pointermove", e => {
  if (!G || e.pointerId !== G.pid || G.done) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of (evs.length ? evs : [e])) { G.fx = ev.clientX; G.fy = ev.clientY; if (!G.m.tough) onMove(ev.clientX, ev.clientY); }
});
const lift = e => {
  if (!G || e.pointerId !== G.pid) return;
  const s = G.stroke;
  if (s && s.path > 5) {
    const dx = G.paw.x - s.sx, dy = G.paw.y - s.sy, d = Math.hypot(dx, dy);
    G.strokes.push({ path: s.path, straight: Math.min(1, Math.hypot(G.paw.x - s.ax, G.paw.y - s.ay) / s.path) * (G.catId === "orange" ? 0 : 1) + (G.catId === "orange" ? 1 : 0),
      bend: Math.min(1, d / s.path),   // 起點到終點的距離÷路徑長：越小越彎
      dir: d > 10 ? Math.round(((Math.atan2(dy, dx) + Math.PI) % Math.PI) / (Math.PI / 4)) % 4 : -1 });
  }
  G.pid = null; G.down = false; G.stroke = null; G.press = null; FX.quiet();
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
    if (G.m.tough && G.catId !== "grey") {
      // 沙發：爪子勾住布，貓掌被拖住、慢半拍才跟上手指
      const ox = G.lx, oy = G.ly;
      G.lx += (G.fx - G.lx) * .3; G.ly += (G.fy - G.ly) * .3;
      if (Math.hypot(G.lx - ox, G.ly - oy) > .3) onMove(G.lx, G.ly); else FX.scratch(0);
    }
    if (G.catId === "grey") {
      const prev = { x: G.paw.x, y: G.paw.y }, k = G.m.tough ? .16 : .18;
      G.paw.x += (G.fx - G.paw.x) * k; G.paw.y += (G.fy - G.paw.y) * k;
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
    // 長按不動：蓋肉球印章，一圈一圈往外蓋滿
    const pr = G.press;
    if (pr && now - pr.t > 450 && now > pr.next) { stampAt(pr); pr.next = now + (pr.n < 3 ? 160 : 70); }
    if (!G.zoom && ((G.frenzyRun >= 4 && G.progress >= G.zoomP) || G.scratchMs > G.zoomAt)) startZoomies(now);
  }
  if (G.zoom === 1) {
    if (now > G.zoomUntil || G.done) endZoomies();
    else cv.style.transform = `translate(${rand(-3, 3)}px,${rand(-3, 3)}px)`;
  }
  if (now < G.rainUntil) {
    // 抓完：紙屑雨，堆得越來越高
    for (let i = 0; i < 22; i++) { spawnDebris(rand(0, Wd), rand(-40, Ht * .3), rand(-.3, .3), 1); const p = G.particles[G.particles.length - 1]; if (p) { p.vy = rand(100, 400); } }
  }
  updateParticles(dt);
  if (G.sparks && !G.found && !G.done && Math.random() < .25) { const P = G.pic; G.sparks.push({ x: P.x + rand(0, P.s), y: P.y + rand(0, P.s), t: 0 }); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(base, 0, 0); ctx.drawImage(dmg, 0, 0); ctx.drawImage(pile, 0, 0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const p of G.particles) drawParticle(ctx, p);
  if (G.sparks) drawSparks(dt);
  if (G.m.tough && G.down && !G.done) drawPull();
  updateMeter();
  if (!G.done && G.progress >= 1) finish();
  raf = requestAnimationFrame(loop);
}
// 布被爪子勾住往手指方向拉：貓掌四周畫出放射狀的拉扯皺褶，放開就彈回去（不畫）
function drawPull() {
  const px = G.paw.x, py = G.paw.y + 6, lag = Math.min(1, Math.hypot(G.fx - px, G.fy - py) / 60);
  ctx.save(); ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + .3, r0 = 16, r1 = 38 + lag * 22;
    ctx.strokeStyle = `rgba(20,50,45,${.1 + lag * .12})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * r1, py + Math.sin(a) * r1); ctx.quadraticCurveTo(px + Math.cos(a + .15) * (r0 + r1) / 2, py + Math.sin(a + .15) * (r0 + r1) / 2, px + Math.cos(a) * r0, py + Math.sin(a) * r0); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}
function drawSparks(dt) {
  for (let i = G.sparks.length - 1; i >= 0; i--) {
    const k = G.sparks[i]; k.t += dt; if (k.t > 1.1) { G.sparks.splice(i, 1); continue; }
    const a = Math.sin(k.t / 1.1 * Math.PI), r = 3 + 6 * a;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff6c2"; ctx.translate(k.x, k.y - k.t * 10); ctx.beginPath();
    for (let j = 0; j < 8; j++) { const rr = j % 2 ? r * .3 : r, an = j * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
    ctx.closePath(); ctx.shadowColor = "#ffd96a"; ctx.shadowBlur = 8; ctx.fill(); ctx.restore();
  }
}
function sneeze() {
  FX.sneeze(); bubble(T("哈啾！"), G.paw.x, G.paw.y - 60);
  // 把地上的紙屑吹起來
  for (let i = 0; i < 40; i++) G.particles.push({ x: rand(0, Wd), y: Ht - rand(4, 40), vx: rand(-200, 200), vy: rand(-650, -350), rot: rand(0, 6), vr: rand(-10, 10),
    w: rand(4, 10), h: rand(2, 4), fluff: G.m.debris === "fluff", color: G.m.debris === "fluff" ? "#fff" : G.m.base2, floor: Ht - rand(4, G.rainBand) });
}
function updateMeter() {
  if (!G) return;
  G.progress = clamp(coverage() / .5 * G.cat.speed * (G.m.ease || 1), 0, 1);
  $("#meterFill").style.width = G.progress * 100 + "%";
  $("#meterTxt").textContent = T("抓爛度 {0}%", Math.floor(G.progress * 100));
  $("#doneBtn").disabled = G.progress < .15;
}

/* ================= 好玩：肉球印章、整排清光、暴衝時間 ================= */
// 長按蓋印章：第一個蓋在手指下，之後沿著向日葵螺旋往外蓋，密密麻麻排滿
function stampAt(pr) {
  const n = pr.n++, a = n * 2.399, r = 13 * Math.sqrt(n);
  if (n === 30) { heartStamp(pr); return; }
  if (n > 30) return;
  const x = pr.x + Math.cos(a) * r, y = pr.y + Math.sin(a) * r;
  pawPrint(x, y, rand(-.35, .35), .95);
  FX.stamp(n); FX.vibrate(8);
  if (n === 0) bubble(T("蓋章！"), x, y - 70);
}
function pawPrint(x, y, rot, k) {
  if (!G || x < 8 || y < 8 || x > Wd - 8 || y > Ht - 8) return;
  const m = G.m, c = dctx;
  // 先在肉球的位置打洞（算進抓爛度），再蓋上淡淡的肉球
  const spots = [[0, 4, 6], [-7, -5, 3], [-2.5, -9, 3], [2.5, -9, 3], [7, -5, 3]];
  for (const [dx, dy] of spots) {
    const px = x + (dx * Math.cos(rot) - dy * Math.sin(rot)) * k, py = y + (dx * Math.sin(rot) + dy * Math.cos(rot)) * k;
    if (m.mode === "bubble") popNear(px, py); else punchAt(px, py);
  }
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  c.globalAlpha = .82; c.fillStyle = m.stamp || "#e8879c";
  c.beginPath(); c.ellipse(0, 4, 7, 5.6, 0, 0, Math.PI * 2); c.fill();
  for (const [dx, dy] of spots.slice(1)) { c.beginPath(); c.ellipse(dx, dy, 2.6, 3.2, 0, 0, Math.PI * 2); c.fill(); }
  c.restore();
  track2(x, y); G.stamps++;
}
// 好玩很多：蓋滿 30 個，整團變成一顆大愛心
function heartStamp(pr) {
  const cx = pr.x, cy = pr.y - 6, k = 5.6, c = dctx, g = G;
  const hp = t => [cx + k * 16 * Math.pow(Math.sin(t), 3), cy - k * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
  c.save(); c.globalAlpha = .4; c.fillStyle = "#ff8fab"; c.beginPath();
  for (let i = 0; i <= 60; i++) { const [x, y] = hp(i / 60 * Math.PI * 2); c[i ? "lineTo" : "moveTo"](x, y); }
  c.fill(); c.restore();
  for (let i = 0; i < 26; i++) setTimeout(() => {
    if (G !== g || G.done) return;
    const t = i / 26 * Math.PI * 2, [x, y] = hp(t);
    pawPrint(x, y, t + Math.PI, .85); FX.stamp(30 + i * 2);
  }, i * 28);
  setTimeout(() => { if (G === g) { FX.unlockChime(); FX.vibrate([20, 30, 60]); const b = bubble(T("💗 大愛心！"), cx - 60, cy - 130); b.classList.add("big"); G.hearts = (G.hearts || 0) + 1; } }, 26 * 28);
}
// 一整排都碎光：像消掉一排一樣大慶祝
function rowClear(y, hgt) {
  G.rows++;
  const now = performance.now();
  for (let i = 0; i < 70; i++) G.particles.push({ x: rand(0, Wd), y: y + rand(-hgt / 2, hgt / 2), vx: rand(-120, 120), vy: rand(-520, -200), rot: rand(0, 6.3), vr: rand(-10, 10),
    w: rand(6, 11), h: rand(3, 6), color: ["#ffd96a", "#ffb8c6", "#a9e5c6", "#aed5ff", "#ffffff"][i % 5], floor: Ht - rand(4, G.rainBand) });
  const f = document.createElement("div"); f.className = "rowflash"; f.style.top = (y - hgt / 2) + "px"; f.style.height = hgt + "px";
  document.body.appendChild(f); setTimeout(() => f.remove(), 700);
  FX.vibrate([20, 30, 40]);
  if (now - G.lastRowFx < 700) { FX.pop(3); return; }   // 太密集時只響一聲，不洗版
  G.lastRowFx = now;
  FX.sweep();
  const b = bubble(G.rows > 1 ? T("整排清光！×{0}", G.rows) : T("整排清光！"), Wd / 2 - 70, y - 50); b.classList.add("big");
}
function startZoomies(now) {
  G.zoom = 1; G.zoomUntil = now + 8000;
  FX.music("zoomies"); FX.vibrate([40, 30, 40]);
  document.body.classList.add("zoomies");
  // 好玩很多：第二隻掌也加入，兩隻一起狂抓
  const q = $("#paw2"); q.innerHTML = $("#paw").innerHTML; q.hidden = false; movePaw();
  const b = bubble(T("暴衝時間！"), Wd / 2 - 70, Ht * .3); b.classList.add("big");
}
function endZoomies() {
  G.zoom = 2; cv.style.transform = ""; document.body.classList.remove("zoomies"); $("#paw2").hidden = true;
  if (G.done) return;
  FX.music(G.track); FX.pant();
  bubble(T("呼…呼…"), G.paw.x, G.paw.y - 70);
}

/* ================= 抓完 ================= */
function coverage() { return G.holes / ((G.hx || G.bub).total || 1); }
// 畫名：依抓法自動決定（18 種流派，作品集會收集）。符合的照順序挑第一個；都不符合就從普通的流派裡隨機（貓的個性會偏向某幾種）
const STYLE_FALLBACK = { orange: ["minimal", "symmetry"], grey: ["ukiyoe", "pointillism"], white: ["fauvism", "action"] };
function artStyle(sec, done) {
  const cov = coverage(), S = G.strokes, n = S.length || 1;
  const tot = S.reduce((s, x) => s + x.path, 0) || 1;
  const straight = S.reduce((s, x) => s + x.path * x.straight, 0) / tot;
  const patches = G.hx ? G.hx.pTotal.filter(Boolean).length : 1;
  const st = G.st || { l: 0, r: 0, edge: 0, zoom: 0 }, holes = G.holes || 1;
  const speed = tot / Math.max(1, G.scratchMs);                 // px／ms
  const dirs = [0, 0, 0, 0]; for (const x of S) if (x.dir >= 0) dirs[x.dir] += x.path;
  const manyDirs = dirs.filter(v => v > tot * .15).length >= 3;
  const longS = S.filter(x => x.path > 120), curvy = longS.filter(x => x.bend < .6 && x.bend > .15).reduce((s, x) => s + x.path, 0);
  const avg = tot / n, spread = (G.maxX - G.minX) * (G.maxY - G.minY) / (Wd * Ht);
  const hour = new Date().getHours();
  if (done && sec < 5) return "dada";
  if (hour < 5 && Math.random() < .4) return "am3";   // 半夜不要每張都是同一個畫名
  if (Math.random() < .03 || (G.hearts && G.zoom && G.rows >= 2)) return "pawpad";
  if ((G.bestChain || 0) >= 7) return "chain";
  if (st.zoom / holes > .6) return "fauvism";
  if (sec > 90 && speed < .5) return "nap";
  if (G.hx && G.bursts / patches > .4) return "cheese";
  if (cov > .08 && cov < .3 && st.edge / holes > .8) return "wabi";
  if (cov > .15 && Math.abs(st.l - st.r) / holes < .06) return "symmetry";
  if (straight > .85 && G.catId !== "orange") return "minimal";
  if (manyDirs && n >= 8) return "cubism";
  if (longS.length >= 4 && curvy / tot > .45) return "ukiyoe";
  if (n >= 25 && avg < 45) return "pointillism";
  if (avg > 250 && straight < .5 && spread > .6) return "action";
  if (speed > 1.6) return "futurism";
  if (cov < .15) return "blank";
  if (cov > .42) return "wild";
  // 都不符合：一半機率挑這隻貓偏愛的，一半從普通的裡挑
  const pool = Math.random() < .5 ? STYLE_FALLBACK[G.catId] : ["impression", "impression", "cubism", "pointillism", "wild"];
  return pool[Math.floor(Math.random() * pool.length)];
}
function finish() {
  G.done = true; G.down = false; G.pid = null; FX.quiet();
  if (G.zoom === 1) endZoomies();
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
  const ms = save.ms[G.m.id] || (save.ms[G.m.id] = { p: 0, cats: [], t: 0 });
  ms.p++; ms.t += Math.round(G.scratchMs / 1000); if (!ms.cats.includes(G.catId)) ms.cats.push(G.catId);
  const record = save.paintings > 2 && G.holes > save.maxHoles;
  save.maxHoles = Math.max(save.maxHoles, G.holes);
  save.totalHoles += G.holes;
  const info = { cat: G.catId, mat: G.m.id, sec, style: artStyle(sec, !!G.pressedDone), no: save.no, holes: G.holes, chain: G.bestChain || 0, zoom: G.zoom ? 1 : 0, rows: G.rows, stamps: G.stamps,
    card: G.card ? G.card.id : null, found: G.found };
  // 刮刮卡：找到就收進收集冊，寶物放進寶物袋
  let firstFind = false, complete = false;
  if (G.found) {
    const id = G.card.id; firstFind = !save.found[id];
    save.found[id] = (save.found[id] || 0) + 1;
    if (G.card.kind === "treasure") save.bag[id] = (save.bag[id] || 0) + 1;
    if (!save.reward && CARDS.every(cd => save.found[cd.id])) { save.reward = true; complete = true; }
  }
  const fresh = checkUnlocks();
  save.styles = save.styles || {}; info.newStyle = !save.styles[info.style]; save.styles[info.style] = (save.styles[info.style] || 0) + 1;
  G.rainBand = Ht * .3; G.rainUntil = performance.now() + 1100;
  setTimeout(diveIn, 1100);
  setTimeout(async () => {
    if (!G) return;
    const card = await buildCard(info);
    cancelAnimationFrame(raf); FX.stop();
    show("cardScreen");
    $("#cardImg").src = card.url; $("#saveBtn").href = card.url;
    $("#nextUnlock").textContent = nextUnlockLine();
    $("#bookBtn2").textContent = T("📒 收集冊 {0}/{1}", foundCount(), CARDS.length);
    shareFile = card.file;
    save.album.unshift({ img: card.thumb, title: card.title, date: Date.now() });
    save.album = save.album.slice(0, 12);
    persist();
    G = null;
    // 解鎖新材質或破紀錄：三隻貓出來跳舞
    if (complete) dance(T("全收集！")).then(() => showCard(REWARD, true));
    else if (fresh.length) dance(T("解鎖新材質！")).then(() => showUnlock(fresh[0]));
    else if (record) dance(T("新紀錄！一張抓了 {0} 下", info.holes.toLocaleString()));
    else if (info.newStyle && save.paintings > 1) toast(T("🎨 新流派：{0}！作品集 {1}／{2}", W(ART_STYLES[info.style]), Object.keys(save.styles).length, Object.keys(ART_STYLES).length), 3000);
    else if (info.card && !info.found) toast(T("差一點就找到了！下面藏著一張{0}卡 {1}", T(RARITY[CARDS.find(cd => cd.id === info.card).rarity].name), RARITY[CARDS.find(cd => cd.id === info.card).rarity].stars), 3200);
    else if (firstFind && info.card && CARDS.find(cd => cd.id === info.card).kind === "treasure") toast(T("🎁 寶物放進寶物袋了，可以到收集冊送給貓咪"), 3200);
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
// 跳舞慶祝：三隻貓的坐姿插畫用程式動起來（彈跳、擺動、壓扁），配〈Zoomies〉最熱鬧的一段
// 點跳舞的貓：喵一聲、跳更高；點旁邊結束
function dance(text, { pose = "sit", bg = null, img = null, music = true } = {}) {
  const d = $("#dance");
  d.querySelector(".dancers").innerHTML = Object.keys(CATS).map(id => `<div class="dancer d-${id}${pose === "tail" ? " still" : ""}" data-id="${id}">${catImg(id, pose, "dancepic")}</div>`).join("");
  d.querySelector(".gift").innerHTML = img ? `<img src="${img}" alt="">` : "";
  d.style.backgroundImage = bg ? `linear-gradient(rgba(253,243,227,.35), rgba(253,243,227,.55)), url(${bg})` : "";
  d.querySelector("p").textContent = text;
  d.hidden = false;
  if (music) { FX.danceMusic(5); FX.unlockChime(); } else FX.sad();
  return new Promise(res => {
    let t;
    const done = () => { if (d.hidden) return; clearTimeout(t); d.hidden = true; FX.danceStop(); res(); };
    const arm = ms => { clearTimeout(t); t = setTimeout(done, ms); };
    d.onclick = e => {
      const k = e.target.closest(".dancer");
      if (!k) return done();
      k.classList.remove("jump"); void k.offsetWidth; k.classList.add("jump");
      FX.meow(k.dataset.id); arm(3000);
    };
    arm(4800);
  });
}
const foundCount = () => CARDS.filter(cd => save.found[cd.id]).length;
/* ================= 收集冊＋寶物袋 ================= */
function openBook() {
  const box = $("#book"); box.innerHTML = "";
  for (const cd of CARDS) {
    const n = save.found[cd.id] || 0, r = RARITY[cd.rarity];
    const el = document.createElement("button"); el.className = "slot" + (n ? "" : " unk") + (n >= SHINY_AT ? " shiny" : "");
    el.style.background = r.color;
    el.innerHTML = `<span class="pic"><img src="${cardImg(cd.id)}" alt=""></span>${n ? "" : "<i>？</i>"}${n > 1 ? `<em>×${n}</em>` : ""}<span>${n ? W(cd.name) : r.stars}</span>`;
    el.addEventListener("click", () => { FX.tap(); if (n) showCard(cd); else toast(T("還沒找到：{0} {1}", T(r.name), r.stars)); });
    box.appendChild(el);
  }
  const rw = $("#rewardSlot");
  rw.className = "slot reward" + (save.reward ? "" : " unk");
  rw.innerHTML = save.reward ? `<img src="${cardImg(REWARD.id)}" alt=""><span>${T(REWARD.name)}</span>` : `<i>🔒</i><span>${T("全收集獎勵：找齊 {0} 張", CARDS.length)}</span>`;
  rw.onclick = () => { FX.tap(); if (save.reward) showCard(REWARD, true); };
  $("#bookTitle").textContent = T("📒 收集冊 {0}/{1}", foundCount(), CARDS.length);
  renderBag();
  show("bookScreen");
}
function showCard(cd, reward) {
  $("#viewerImg").src = cardImg(cd.id);
  const n = save.found[cd.id] || 0, shiny = !reward && n >= SHINY_AT;
  $("#viewerPic").classList.toggle("shiny", shiny);
  $("#viewerTxt").textContent = reward ? T("🎉 全收集獎勵！謝謝你陪三隻貓抓了這麼多")
    : `${RARITY[cd.rarity].stars} ${T(RARITY[cd.rarity].name)}・${T(cd.say)}` + (shiny ? `\n✨ ${T("閃亮版")}` : `\n${T("找到 {0} 次（{1} 次變閃亮版）", n, SHINY_AT)}`);
  $("#viewer").hidden = false;
}
function renderBag() {
  const bag = $("#bag"); bag.innerHTML = "";
  const items = CARDS.filter(cd => cd.kind === "treasure" && save.bag[cd.id] > 0);
  $("#bagEmpty").hidden = items.length > 0;
  for (const cd of items) {
    const el = document.createElement("div"); el.className = "bagitem";
    el.innerHTML = `<img src="${cardImg(cd.id)}" alt=""><span>${W(cd.name)} ×${save.bag[cd.id]}</span><button class="btn btn-pink">${T("送給貓咪")}</button>`;
    el.querySelector("button").addEventListener("click", () => gift(cd));
    bag.appendChild(el);
  }
}
// 送寶物給貓：大部分開心跳舞；貓跳台會爬上去跳；高級貓窩……三隻都不理，跑去鑽紙箱
function gift(cd) {
  save.bag[cd.id]--; persist(); FX.tap();
  let p;
  if (cd.id === "catbed") p = dance(T("送了高級貓窩……三隻全跑去鑽紙箱了"), { pose: "tail", img: cardImg(cd.id), music: false });
  else if (cd.id === "cattree") p = dance(T("三隻爬上貓跳台跳舞！"), { bg: cardImg(cd.id) });
  else p = dance(T("收到{0}，三隻好開心！", W(cd.name)), { img: cardImg(cd.id) });
  p.then(renderBag);
}
$("#bookBtn").addEventListener("click", () => { FX.tap(); openBook(); });
$("#bookBtn2").addEventListener("click", () => { FX.tap(); openBook(); });
$("#bookBack").addEventListener("click", () => { FX.tap(); show("home"); renderHome(); });

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
  // 策展人短評：像美術館的小牌子，貼在畫框右下角
  {
    const F2 = n => `${n}px Huninn, "PingFang TC", "Noto Sans TC", sans-serif`, txt = T(STYLE_NOTES[info.style]);
    x.font = F2(30); const w = Math.min(860, x.measureText(txt).width + 56), bx = fx + fw - w - 24, by = fy + fh - 86;
    x.fillStyle = "rgba(255,250,242,.94)"; roundRect(x, bx, by, w, 62, 14); x.fill(); x.lineWidth = 3; x.strokeStyle = "#3a2e2a"; x.stroke();
    x.fillStyle = "#3a2e2a"; x.textAlign = "left"; x.fillText(txt, bx + 28, by + 42, w - 56);
  }
  // 文字
  const cat = CATS[info.cat];
  const title = LANG === "en" ? `“${W(ART_STYLES[info.style])} No.${info.no}”` : `《${W(ART_STYLES[info.style])} No.${info.no}》`;
  const im = (await loadImg(ART && ART[info.cat] && ART[info.cat].lie)) || await svgImage(catSVG(info.cat, "sit"));
  if (im) { const k = Math.min(190 / im.width, 190 / im.height); x.drawImage(im, 60 + (190 - im.width * k) / 2, 990 + (190 - im.height * k) / 2, im.width * k, im.height * k); }
  x.fillStyle = "#3a2e2a"; x.textAlign = "left";
  x.font = F(60, true); x.fillText(title, 270, 1050, 760);
  x.font = F(36); x.fillStyle = "#6a5a52";
  x.fillText(T("{0}的抓痕畫・{1}・{2} 秒", W(cat.name), W(cat.style), info.sec), 272, 1108, 760);
  const holesTxt = info.mat === "bubble" ? T("啵了 {0} 顆泡泡", info.holes.toLocaleString()) : info.mat === "cardboard" ? T("這張抓了 {0} 下", info.holes.toLocaleString()) : T("這張打了 {0} 個洞", info.holes.toLocaleString());
  x.font = F(32); x.fillText(`${matById(info.mat).icon} ${W(matById(info.mat).name)}・${holesTxt}`, 272, 1156, 760);
  if (info.card) {
    const cd = CARDS.find(q => q.id === info.card);
    x.fillStyle = "#3a2e2a";
    // 沒找到也告訴你錯過了多稀有的卡，讓人想再抓一張
    x.fillText(info.found ? `🎁 ${T("找到：{0}", W(cd.name))} ${RARITY[cd.rarity].stars}` : `❓ ${T("差一點！下面藏著一張{0}卡 {1}", T(RARITY[cd.rarity].name), RARITY[cd.rarity].stars)}`, 272, 1200, 760);
  }
  const extra = [info.chain >= 3 && T("最長連鎖 ×{0}", info.chain), info.rows && T("清光 {0} 排", info.rows), info.zoom && T("暴衝 ×{0}", info.zoom), info.stamps >= 5 && T("肉球章 ×{0}", info.stamps)].filter(Boolean);
  if (extra.length) { x.fillStyle = "#c06a3a"; x.fillText(extra.join("・"), 272, 1244, 760); }
  x.textAlign = "center"; x.fillStyle = "#3a2e2a"; x.font = F(32, true); x.fillText(T("抓爛它！"), W0 / 2, 1294);
  x.font = F(26); x.fillStyle = "#4a7fc0"; x.fillText(GAME_URL, W0 / 2, 1328);
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

/* ================= 作品集（收藏的抓痕畫） ================= */
function openAlbum() {
  const box = $("#album"); box.innerHTML = "";
  save.album.forEach(a => {
    const im = document.createElement("img"); im.src = a.img; im.alt = a.title;
    im.addEventListener("click", () => { $("#viewerImg").src = a.img; $("#viewerTxt").textContent = ""; $("#viewerPic").classList.remove("shiny"); $("#viewer").hidden = false; FX.tap(); });
    box.appendChild(im);
  });
  $("#albumEmpty").hidden = save.album.length > 0;
  // 收集到的流派
  const got = save.styles || {}, keys = Object.keys(ART_STYLES);
  $("#stylesTitle").textContent = T("🎨 收集到的流派 {0}／{1}", keys.filter(k => got[k]).length, keys.length);
  $("#styles").innerHTML = keys.map(k => `<button class="chip${got[k] ? " on" : ""}" data-k="${k}">${got[k] ? W(ART_STYLES[k]) : "？？？"}</button>`).join("");
  $("#styles").onclick = e => {
    const b = e.target.closest(".chip"); if (!b) return; const k = b.dataset.k; FX.tap();
    toast(got[k] ? `${W(ART_STYLES[k])}：${T(STYLE_NOTES[k])}` : T("提示：{0}", T(STYLE_HINTS[k])), 3000);
  };
  show("albumScreen");
}
$("#viewerClose").addEventListener("click", () => { $("#viewer").hidden = true; });

if (!ART) $("#aiNote").hidden = true;
// 舊存檔升級：已經達成的條件，打開遊戲就解鎖
{ const fresh = checkUnlocks(); if (fresh.length) { persist(); setTimeout(() => toast(T("解鎖新材質：{0}！", fresh.map(m => W(m.name)).join("、")), 3000), 600); } }
renderHome();

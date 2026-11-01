// 《抓爛它！》的資料（只有資料，沒有邏輯）。中文是 key，英文對照在 i18n.en.js

// 三隻貓：同一根手指，抓出來不一樣
const CATS = {
  orange: {
    name: "總編", style: "效率派", desc: "爪痕筆直整齊，抓最快",
    fur: "#f3a54a", stripe: "#d9802a", belly: "#ffe3bd", ear: "#f7b9a8", accessory: "glasses",
    spacing: 9, speed: 1.35,          // 爪痕間距（px）、抓爛度倍率
    finish: "sweep"                   // 抓完：把紙屑掃成一堆再躺
  },
  grey: {
    name: "架構師", style: "優雅派", desc: "長長的弧線，慢條斯理",
    fur: "#aab3bd", stripe: "#8c96a2", belly: "#eef1f4", ear: "#f2b8c0", accessory: "headset",
    spacing: 11, speed: 1.25,
    finish: "lick"                    // 抓完：坐好舔爪子
  },
  white: {
    name: "小弟", style: "亂抓派", desc: "亂抖、打大洞、突然暴衝",
    fur: "#fbfaf7", stripe: "#9a6b4b", belly: "#ffffff", ear: "#9a6b4b", accessory: "cap",
    spacing: 8, speed: 1.1,
    finish: "box"                     // 抓完：鑽進紙箱只露尾巴
  }
};

// 材質：手感、聲音、紙屑都不同。ready = 這一版做好了沒
const MATERIALS = [
  { id: "cardboard", name: "瓦楞紙貓抓板", icon: "📦", ready: true, unlock: null,
    base: "#d9b483", base2: "#c79d66", groove: "#8a6236", fuzz: "#f6e2bd", hole: "#2e2116",
    under: "#a8773f", stamp: "#9b5a3c", mode: "hex", debris: "strip", sound: { type: "bandpass", freq: 2600, q: 1.1, crackle: 0.5, gain: 0.5 } },
  { id: "sofa", name: "沙發", icon: "🛋️", ready: true, unlock: { type: "paintings", n: 3 },
    base: "#5f9e96", base2: "#4f8a83", groove: "#3f6f69", fuzz: "#e9f3f1", hole: "#fff7ea",
    under: "#fff7ea", stamp: "#ffc7d4", mode: "hex", debris: "fluff", sound: { type: "lowpass", freq: 1100, q: 0.7, crackle: 0, gain: 0.7 } },
  // 泡泡紙：一格格小泡泡，抓過去連續啵啵啵
  { id: "bubble", name: "泡泡紙", icon: "🫧", ready: true, unlock: { type: "totalHoles", n: 3000 },
    base: "#d9ecf7", base2: "#bcd9ec", groove: "#a9cbe0", fuzz: "#ffffff", hole: "#eef7fc", under: "#eef7fc", stamp: "#f39bb0",
    mode: "bubble", debris: "plastic", sound: { type: "highpass", freq: 1800, q: 0.7, crackle: 0, gain: 0.3 } },
  { id: "castle", name: "紙箱城堡", icon: "🏰", ready: false, unlock: { type: "allcats" } },
  { id: "rug", name: "長毛地毯", icon: "🧶", ready: false, unlock: { type: "time", n: 300 } },
  { id: "curtain", name: "窗簾", icon: "🪟", ready: false, unlock: { type: "holes", n: 1500 } },
  { id: "tissue", name: "衛生紙捲", icon: "🧻", ready: false, unlock: { type: "frenzy", n: 10 }, secret: true },
  { id: "xmas", name: "聖誕禮物紙箱", icon: "🎁", ready: false, unlock: { type: "paintingsOrDecember", n: 10 } }
];

// 解鎖條件的說明文字（{0} 是數字）
const UNLOCK_TEXT = {
  paintings: "抓完 {0} 張畫",
  allcats: "三隻貓都各抓過一次",
  time: "累積抓滿 {0} 分鐘",
  holes: "一張畫打出 {0} 個洞",
  totalHoles: "累積打 {0} 個洞",
  frenzy: "？？？",
  paintingsOrDecember: "12 月限定，或抓完 {0} 張畫"
};

// 爪痕畫的畫名：依抓法自動決定
const ART_STYLES = {
  wild: "狂野派",
  cheese: "瑞士起司派",
  blank: "留白大師",
  minimal: "極簡主義",
  impression: "印象派",
  chain: "連鎖大師"
};

// AI 插畫（Katie 用 Gemini App 生成）。window.NO_ART = true 時全部改用程式畫的版本
const ART = window.NO_ART ? null : {
  orange: { sit: "art/orange_sit.webp", lie: "art/orange_lie.webp", box: "art/orange_box.webp", tail: "art/orange_tail.webp", pawOut: "art/orange_paw_out.webp", pawIn: "art/orange_paw_in.webp" },
  // 架構師的伸爪圖還沒有（之前那張其實是小弟的掌），先用程式畫的掌
  grey: { sit: "art/grey_sit.webp", lie: "art/grey_lie.webp", box: "art/grey_box.webp", tail: "art/grey_tail.webp" },
  white: { sit: "art/white_sit.webp", lie: "art/white_lie.webp", box: "art/white_box.webp", tail: "art/white_tail.webp", pawOut: "art/white_paw_out.webp", pawIn: "art/white_paw_in.webp" },
  flutes: "art/tex_flutes.jpg"
};
// 刮刮卡收集：每張紙下面藏一張驚喜插畫（AI 圖），抓開一定比例就「找到了」
// kind：caught 被抓包、treasure 寶物（可以送給貓）、prank 整人卡；rarity：1 普通、2 稀有、3 超稀有
// sticker：去背貼紙圖（放在暖色底上），其他是滿版場景
const CARDS = [
  { id: "wand", kind: "treasure", rarity: 1, sticker: true, name: "逗貓棒", say: "找到逗貓棒！" },
  { id: "ball", kind: "treasure", rarity: 1, sticker: true, name: "鈴鐺球", say: "找到鈴鐺球和毛線球！" },
  { id: "kibble", kind: "treasure", rarity: 1, sticker: true, name: "一包飼料", say: "找到一包飼料！" },
  { id: "fish", kind: "treasure", rarity: 1, sticker: true, name: "魚魚抱枕", say: "找到魚魚抱枕！" },
  { id: "chief_treat", kind: "caught", rarity: 2, name: "總編偷舔肉泥", say: "被抓到了！總編在偷舔肉泥" },
  { id: "kit_kibble", kind: "caught", rarity: 2, name: "小弟頭卡飼料袋", say: "被抓到了！小弟頭卡在飼料袋裡" },
  { id: "arch_cup", kind: "caught", rarity: 2, name: "架構師推杯子", say: "被抓到了！架構師在推杯子" },
  { id: "box_trio", kind: "caught", rarity: 2, name: "紙箱大會", say: "被抓到了！三隻在開紙箱大會" },
  { id: "cattree", kind: "treasure", rarity: 2, name: "貓跳台", say: "找到貓跳台！" },
  { id: "poop", kind: "prank", rarity: 2, name: "是……禮物嗎？", say: "是……禮物嗎？" },
  { id: "fridge", kind: "caught", rarity: 3, name: "半夜偷開冰箱", say: "被抓到了！半夜偷開冰箱" },
  { id: "catbed", kind: "treasure", rarity: 3, name: "高級貓窩", say: "找到高級貓窩！" }
];
const REWARD = { id: "kiss", name: "全收集親親合照" };
const RARITY = { 1: { name: "普通", stars: "★", weight: 60, color: "#a9e5c6" }, 2: { name: "稀有", stars: "★★", weight: 30, color: "#aed5ff" }, 3: { name: "超稀有", stars: "★★★", weight: 10, color: "#ffd96a" } };
const cardImg = id => ART ? `art/cards/${id}.webp` : null;

// 背景音樂（Katie 用 Gemini 做的 AI 音樂）：一般用慵懶的 Sunbeams，小弟和泡泡紙用輕快的 Zoomies
const MUSIC = { calm: "audio/sunbeams.mp3", busy: "audio/zoomies.mp3", zoomies: "audio/gallop.mp3" };

const GAME_URL_DEFAULT = "https://mochachen1225-create.github.io/scratch-it/";

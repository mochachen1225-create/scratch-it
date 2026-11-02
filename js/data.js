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
// 解鎖一條路往下開（摩卡與貓貓小隊：完成 A 才解鎖 B）：after＝要先解鎖哪一個，條件都是「用上一個材質完成某件事」；聖誕紙箱、衛生紙捲是支線
const MATERIALS = [
  { id: "cardboard", name: "瓦楞紙貓抓板", icon: "📦", ready: true, unlock: null,
    base: "#d9b483", base2: "#c79d66", groove: "#8a6236", fuzz: "#fbeed2", hole: "#4a2f17",
    under: "#a8773f", stamp: "#9b5a3c", mode: "strip", debris: "strip", sound: { type: "bandpass", freq: 2600, q: 1.1, crackle: 0.5, gain: 0.5 } },
  // 泡泡紙：一格格小泡泡，抓過去連續啵啵啵
  { id: "bubble", name: "泡泡紙", icon: "🫧", ready: true, unlock: { after: "cardboard", type: "matPaintings", mat: "cardboard", n: 2 },
    base: "#d9ecf7", base2: "#bcd9ec", groove: "#a9cbe0", fuzz: "#ffffff", hole: "#eef7fc", under: "#eef7fc", stamp: "#f39bb0",
    mode: "bubble", debris: "plastic", sound: { type: "highpass", freq: 1800, q: 0.7, crackle: 0, gain: 0.3 } },
  { id: "sofa", name: "沙發", icon: "🛋️", ready: true, unlock: { after: "bubble", type: "matPaintings", mat: "bubble", n: 1 },
    base: "#5f9e96", base2: "#4f8a83", groove: "#3f6f69", fuzz: "#e9f3f1", hole: "#fff7ea",
    under: "#fff7ea", stamp: "#ffc7d4", mode: "hex", tough: true, ease: 2, debris: "fluff", sound: { type: "lowpass", freq: 1100, q: 0.7, crackle: 0, gain: 0.7 } },
  { id: "castle", name: "紙箱城堡", icon: "🏰", ready: false, unlock: { after: "sofa", type: "allcatsOn", mat: "sofa" } },
  { id: "curtain", name: "窗簾", icon: "🪟", ready: false, unlock: { after: "castle", type: "matPaintings", mat: "castle", n: 3 } },
  { id: "rug", name: "長毛地毯", icon: "🧶", ready: false, unlock: { after: "curtain", type: "matTime", mat: "curtain", n: 300 } },
  { id: "tissue", name: "衛生紙捲", icon: "🧻", ready: false, unlock: { type: "frenzy", n: 10 }, secret: true },
  { id: "xmas", name: "聖誕禮物紙箱", icon: "🎁", ready: false, unlock: { type: "paintingsOrDecember", n: 10 } }
];

// 解鎖條件的說明文字（{0} 是數字）
const UNLOCK_TEXT = {
  matPaintings: "用{0}抓完 {1} 張",
  allcatsOn: "三隻貓都用{0}抓過",
  matTime: "用{0}累積抓滿 {1} 分鐘",
  after: "先解鎖{0}",
  paintings: "抓完 {0} 張畫",
  allcats: "三隻貓都各抓過一次",
  time: "累積抓滿 {0} 分鐘",
  holes: "一張畫打出 {0} 個洞",
  totalHoles: "累積抓 {0} 下",
  frenzy: "？？？",
  paintingsOrDecember: "12 月限定，或抓完 {0} 張畫"
};

// 爪痕畫的畫名：依抓法自動決定（18 種，作品集會收集）＋策展人短評
const ART_STYLES = {
  wild: "狂野派", cheese: "瑞士起司派", blank: "留白大師", minimal: "極簡主義", impression: "印象派", chain: "連鎖大師",
  fauvism: "野獸派", cubism: "立體派", pointillism: "點描派", action: "行動繪畫", futurism: "未來主義", ukiyoe: "浮世繪",
  symmetry: "對稱派", wabi: "侘寂", dada: "達達主義", am3: "凌晨三點派", nap: "午睡派", pawpad: "肉球表現主義"
};
// 還沒收集到的流派：點一下看提示
const STYLE_HINTS = {"wild": "抓爛超過四成", "cheese": "讓很多區塊整片碎掉", "blank": "只抓一點點就收手", "minimal": "一筆一筆畫直線（總編以外的貓）", "impression": "沒有特別風格的時候", "chain": "連鎖 7 次以上", "fauvism": "大部分都在暴衝時抓的", "cubism": "橫的、直的、斜的都抓", "pointillism": "很多短短的小筆畫", "action": "又長又亂、整張都抓到", "futurism": "抓得非常快", "ukiyoe": "畫很多長長的弧線", "symmetry": "左右兩半抓得差不多", "wabi": "只抓邊邊角角", "dada": "不到 5 秒就按「抓夠了」", "am3": "半夜 0～5 點抓", "nap": "慢慢抓、抓很久", "pawpad": "很稀有，偶爾才會出現"};
const STYLE_NOTES = {
  wild: "整張紙都在尖叫，非常好。", cheese: "洞比紙多，可以拿去配紅酒。", blank: "留白，是給觀眾想像的空間。",
  minimal: "少即是多，貓也同意。", impression: "遠看很美，近看是貓抓的。", chain: "一個接一個，停不下來。",
  fauvism: "顏色？沒有。氣勢？滿分。", cubism: "同時從三個角度攻擊紙箱。", pointillism: "一點一點，耐心得令人害怕。",
  action: "藝術家本人也不知道發生了什麼。", futurism: "速度就是美。", ukiyoe: "一筆一浪，很有東方味。",
  symmetry: "黃金比例，貓也懂。", wabi: "不完美，才完美。", dada: "這也算？算。",
  am3: "這個時間，只有貓醒著。", nap: "抓著抓著就睡著了。", pawpad: "評審團一致喵過。"
};

// AI 插畫（摩卡與貓貓小隊 用 Gemini App 生成）。window.NO_ART = true 時全部改用程式畫的版本
const ART = window.NO_ART ? null : {
  orange: { sit: "art/orange_sit.webp", lie: "art/orange_lie.webp", box: "art/orange_box.webp", tail: "art/orange_tail.webp", pawOut: "art/orange_paw_out.webp", pawIn: "art/orange_paw_in.webp" },
  grey: { sit: "art/grey_sit.webp", lie: "art/grey_lie.webp", box: "art/grey_box.webp", tail: "art/grey_tail.webp", pawOut: "art/grey_paw_out.webp", pawIn: "art/grey_paw_in.webp" },
  white: { sit: "art/white_sit.webp", lie: "art/white_lie.webp", box: "art/white_box.webp", tail: "art/white_tail.webp", pawOut: "art/white_paw_out.webp", pawIn: "art/white_paw_in.webp" },
  // 瓦楞紙花紋 B：FLUX 生成的無縫貼圖（花紋 A 是程式畫的），兩種輪流用
  flux: "art/tex_flux.jpg"
};
// 材質插畫接口（之後 AI 圖到了填路徑；null＝用程式畫的）
// base：紙面無縫貼圖（拼貼鋪滿）；hole：一個洞的貼圖（沙發露棉花、布邊毛邊）；under：碎掉後露出的底層無縫貼圖
const MAT_ART = window.NO_ART ? {} : {
  sofa: { base: null, hole: null, under: null },
  bubble: { base: null, hole: null, under: null }
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
// 預留的小禮物（摩卡與貓貓小隊 的 Gemini 圖還沒到）：圖到了搬進 CARDS 就會出現；之後也給「叼玩具」「推杯子」共用
const CARDS_PENDING = [
  { id: "twine", kind: "treasure", rarity: 1, sticker: true, name: "麻繩", say: "找到一段麻繩！（可以咬一整天）" },
  { id: "doll", kind: "treasure", rarity: 2, sticker: true, name: "小娃娃", say: "找到小娃娃！（現在是貓的了）" },
  { id: "pencap", kind: "treasure", rarity: 1, sticker: true, name: "原子筆蓋", say: "找到原子筆蓋！（明天摩卡又要找筆了）" },
  { id: "bottlecap", kind: "treasure", rarity: 1, sticker: true, name: "寶特瓶蓋", say: "找到寶特瓶蓋！（一撥就滾好遠）" },
  { id: "scrunchie", kind: "treasure", rarity: 1, sticker: true, name: "髮圈", say: "找到髮圈！（沙發底下還有十個）" },
  { id: "paperball", kind: "treasure", rarity: 1, sticker: true, name: "紙團", say: "找到紙團！（比玩具還好玩）" },
  { id: "straw", kind: "treasure", rarity: 1, sticker: true, name: "吸管", say: "找到吸管！" },
  { id: "lace", kind: "treasure", rarity: 2, sticker: true, name: "鞋帶", say: "找到鞋帶！（摩卡的鞋要散了）" },
  { id: "tube", kind: "treasure", rarity: 1, sticker: true, name: "衛生紙捲筒", say: "找到衛生紙捲筒！" },
  { id: "bandball", kind: "treasure", rarity: 2, sticker: true, name: "橡皮筋球", say: "找到橡皮筋球！（彈得超高）" },
  { id: "button", kind: "treasure", rarity: 2, sticker: true, name: "鈕扣", say: "找到鈕扣！（是哪件衣服的？）" },
  { id: "capring", kind: "treasure", rarity: 1, sticker: true, name: "瓶蓋環", say: "找到瓶蓋環！（貓界的戒指）" }
];
const REWARD = { id: "kiss", name: "全收集親親合照" };
const RARITY = { 1: { name: "普通", stars: "★", weight: 60, color: "#a9e5c6" }, 2: { name: "稀有", stars: "★★", weight: 30, color: "#aed5ff" }, 3: { name: "超稀有", stars: "★★★", weight: 10, color: "#ffd96a" } };
const cardImg = id => ART ? `art/cards/${id}.webp` : null;

// 背景音樂（摩卡與貓貓小隊 用 Gemini 做的 AI 音樂）：一般用慵懶的 Sunbeams，小弟和泡泡紙用輕快的 Zoomies
const MUSIC = { calm: "audio/sunbeams.mp3", busy: "audio/zoomies.mp3", zoomies: "audio/gallop.mp3" };

const GAME_URL_DEFAULT = "https://mochachen1225-create.github.io/scratch-it/";

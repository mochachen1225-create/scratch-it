// 《抓爛它！》的資料（只有資料，沒有邏輯）。中文是 key，英文對照在 i18n.en.js

// 三隻貓：同一根手指，抓出來不一樣
const CATS = {
  orange: {
    name: "總編", style: "效率派", desc: "爪痕筆直整齊，抓最快",
    fur: "#f3a54a", stripe: "#d9802a", belly: "#ffe3bd", ear: "#f7b9a8", accessory: "glasses",
    spacing: 9, speed: 1.35,          // 爪痕間距（px）、抓爛度倍率
    like: "small",                    // 最愛的禮物：小的好叼的
    finish: "sweep"                   // 抓完：把紙屑掃成一堆再躺
  },
  grey: {
    name: "架構師", style: "優雅派", desc: "長長的弧線，慢條斯理",
    fur: "#aab3bd", stripe: "#8c96a2", belly: "#eef1f4", ear: "#f2b8c0", accessory: "headset",
    spacing: 11, speed: 1.25, like: "soft",   // 最愛：軟的
    finish: "lick"                    // 抓完：坐好舔爪子
  },
  white: {
    name: "小弟", style: "亂抓派", desc: "亂抖、打大洞、突然暴衝",
    fur: "#fbfaf7", stripe: "#9a6b4b", belly: "#ffffff", ear: "#9a6b4b", accessory: "cap",
    spacing: 8, speed: 1.1, like: "toss",     // 最愛：可以打飛的
    finish: "box"                     // 抓完：鑽進紙箱只露尾巴
  },
  // 彩蛋：哈士奇（拆家搞笑擔當，帶一點中二）。三隻貓都滿 5 顆❤️，或流派收集 18／18 才會出現
  husky: {
    name: "哈士奇", style: "拆家派", desc: "抓得比貓還兇，拆完自己嚇一跳",
    fur: "#f4f4f2", stripe: "#3d3d44", belly: "#ffffff", ear: "#3d3d44", accessory: "none",
    spacing: 13, speed: 1.2, finish: "sit", egg: true
  }
};
const MAIN_CATS = ["orange", "grey", "white"];

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
  orange: { sit: "art/orange_sit.webp", lie: "art/orange_lie.webp", box: "art/orange_box.webp", tail: "art/orange_tail.webp", pawOut: "art/orange_paw_out.webp", pawIn: "art/orange_paw_in.webp", back: "art/orange_back.webp" },
  grey: { sit: "art/grey_sit.webp", lie: "art/grey_lie.webp", box: "art/grey_box.webp", tail: "art/grey_tail.webp", pawOut: "art/grey_paw_out.webp", pawIn: "art/grey_paw_in.webp", back: "art/grey_back.webp" },
  white: { sit: "art/white_sit.webp", lie: "art/white_lie.webp", box: "art/white_box.webp", tail: "art/white_tail.webp", pawOut: "art/white_paw_out.webp", pawIn: "art/white_paw_in.webp", back: "art/white_back.webp" },
  // 哈士奇收爪的掌還沒到，先兩個狀態都用伸爪那張
  husky: { sit: "art/husky_sit.webp", lie: "art/husky_lie.webp", box: "art/husky_box.webp", tail: "art/husky_box.webp", pawOut: "art/husky_paw_out.webp", pawIn: "art/husky_paw_out.webp" },
  peek: { orange: "art/orange_peek.webp", white: "art/white_peek.webp" },
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
  { id: "wand", kind: "treasure", like: "soft", act: "string", rarity: 1, sticker: true, name: "逗貓棒", say: "找到逗貓棒！" },
  { id: "ball", kind: "treasure", like: "toss", rarity: 1, sticker: true, name: "鈴鐺球", say: "找到鈴鐺球和毛線球！" },
  { id: "kibble", kind: "treasure", like: "all", rarity: 1, sticker: true, name: "一包飼料", say: "找到一包飼料！" },
  { id: "fish", kind: "treasure", like: "soft", rarity: 1, sticker: true, name: "魚魚抱枕", say: "找到魚魚抱枕！" },
  { id: "chief_treat", kind: "caught", rarity: 2, name: "總編偷舔肉泥", say: "被抓到了！總編在偷舔肉泥" },
  { id: "kit_kibble", kind: "caught", rarity: 2, name: "小弟頭卡飼料袋", say: "被抓到了！小弟頭卡在飼料袋裡" },
  { id: "arch_cup", kind: "caught", rarity: 2, name: "架構師推杯子", say: "被抓到了！架構師在推杯子" },
  { id: "box_trio", kind: "caught", rarity: 2, name: "紙箱大會", say: "被抓到了！三隻在開紙箱大會" },
  { id: "cattree", kind: "treasure", like: "all", rarity: 2, name: "貓跳台", say: "找到貓跳台！" },
  { id: "poop", kind: "prank", rarity: 2, name: "是……禮物嗎？", say: "是……禮物嗎？" },
  { id: "fridge", kind: "caught", rarity: 3, name: "半夜偷開冰箱", say: "被抓到了！半夜偷開冰箱" },
  { id: "catbed", kind: "treasure", like: "none", rarity: 3, name: "高級貓窩", say: "找到高級貓窩！" }
];
// 小禮物（group: "gift"，收集冊第二頁）：之後也給「叼玩具」「推杯子」共用
const GIFT_CARDS = [
  { id: "twine", group: "gift", kind: "treasure", like: "soft", rarity: 1, sticker: true, name: "麻繩", say: "找到一段麻繩！（可以咬一整天）" },
  { id: "doll", group: "gift", kind: "treasure", like: "soft", rarity: 2, sticker: true, name: "小娃娃", say: "找到小娃娃！（現在是貓的了）" },
  { id: "pencap", group: "gift", kind: "treasure", like: "small", rarity: 1, sticker: true, name: "原子筆", say: "找到原子筆！（明天摩卡又要找筆了）" },
  { id: "bottlecap", group: "gift", kind: "treasure", like: "toss", rarity: 1, sticker: true, name: "寶特瓶蓋", say: "找到寶特瓶蓋！（一撥就滾好遠）" },
  { id: "scrunchie", group: "gift", kind: "treasure", like: "toss", rarity: 1, sticker: true, name: "髮圈", say: "找到髮圈！（沙發底下還有十個）" },
  { id: "paperball", group: "gift", kind: "treasure", like: "toss", rarity: 1, sticker: true, name: "紙團", say: "找到紙團！（比玩具還好玩）" },
  { id: "straw", group: "gift", kind: "treasure", like: "small", rarity: 1, sticker: true, name: "吸管", say: "找到吸管！" },
  { id: "lace", group: "gift", kind: "treasure", like: "soft", act: "string", rarity: 2, sticker: true, name: "鞋帶", say: "找到鞋帶！（摩卡的鞋要散了）" },
  { id: "tube", group: "gift", kind: "treasure", like: "toss", rarity: 1, sticker: true, name: "衛生紙捲筒", say: "找到衛生紙捲筒！" },
  { id: "bandball", group: "gift", kind: "treasure", like: "toss", rarity: 2, sticker: true, name: "橡皮筋球", say: "找到橡皮筋球！（彈得超高）" },
  { id: "button", group: "gift", kind: "treasure", like: "small", rarity: 2, sticker: true, name: "鈕扣", say: "找到鈕扣！（是哪件衣服的？）" },
  { id: "capring", group: "gift", kind: "treasure", like: "toss", rarity: 1, sticker: true, name: "瓶蓋環", say: "找到瓶蓋環！（貓界的戒指）" }
];
const PIC_CARDS = CARDS.slice();          // 驚喜插畫 12 張（全收集獎勵只算這些）
CARDS.push(...GIFT_CARDS);
const REWARD = { id: "kiss", name: "全收集親親合照" };
const RARITY = { 1: { name: "普通", stars: "★", weight: 60, color: "#a9e5c6" }, 2: { name: "稀有", stars: "★★", weight: 30, color: "#aed5ff" }, 3: { name: "超稀有", stars: "★★★", weight: 10, color: "#ffd96a" } };
const cardImg = id => ART ? `art/cards/${id}.webp` : null;

// 好感度：只會越來越愛。內部點數，玩家只看到愛心；前面超快、後面慢慢來
const HEART_AT = [3, 8, 18, 45, 90];
const LOVE = { paint: 3, found: 1, clean: 2, gift: 6, all: 10, fav: 12, none: 1 };
const HEART_TEXT = ["", "會在首頁對你眨眼了", "抓畫的時候會跑來蹭你", "學會招牌舞步了", "會睡在「開始抓」旁邊", "送你一份回禮！"];
// ❤️5 回禮卡
const GIFT_BACK = {
  orange: { id: "gift_orange", name: "總編的眼鏡布", say: "總編把擦眼鏡的布送給你了（上面還有一根橘毛）" },
  grey: { id: "gift_grey", name: "架構師的耳麥", say: "架構師把耳麥借你戴，說可以聽到呼嚕聲" },
  white: { id: "gift_white", name: "小弟的黃帽", say: "小弟把最愛的黃帽送你了（帽沿有咬過的痕跡）" }
};
// 收到禮物：貓真的會做的事（依禮物種類，act 可以另外指定動作）；{0}＝貓、{1}＝禮物
const REACT_LINE = {
  toss: "{0}一掌把{1}拍飛，追過去，再拍回來！",
  soft: "{0}抱住{1}在地上滾來滾去，後腳狂踢",
  string: "{0}屁股扭一扭，撲上去咬住{1}，叼著甩頭拖走了",
  lace: "{0}用前爪把{1}拉開、扯得長長的，再咬住甩頭拖走",
  small: "{0}把{1}慢慢推到桌邊……看了你一眼……推下去",
  kibble: "{0}把頭埋進{1}，喀滋喀滋",
  cattree: "{0}一層一層爬上貓跳台，在最上面窩好",
  none: "{0}聞了聞{1}……轉身背對你"
};
// 送到最愛的禮物：專屬反應
const FAV_LINE = { orange: "總編叼走{0}，收進紙箱排得整整齊齊", grey: "架構師抱著{0}蹭臉，捨不得放", white: "小弟把{0}打飛又追回來，再打飛！" };

// 背景音樂（摩卡與貓貓小隊 用 Gemini 做的 AI 音樂）：一般用慵懶的 Sunbeams，小弟和泡泡紙用輕快的 Zoomies
const MUSIC = { calm: "audio/sunbeams.mp3", busy: "audio/zoomies.mp3", zoomies: "audio/gallop.mp3" };
// 舞曲（摩卡與貓貓小隊用 Gemini 做）：start＝最熱鬧那一段從第幾秒開始。現在慶祝都跳 Disco，其他留給之後的「舞步解鎖」
const DANCE_MUSIC = {
  disco: { src: "audio/dance_disco.mp3", start: 23 },   // Polka Dot Sneakers
  kpop: { src: "audio/dance_kpop.mp3", start: 47 },     // Pink Pause（女團舞）
  break: { src: "audio/dance_break.mp3", start: 47 },   // Nine Lives at Noon（復古霹靂舞）
  court: { src: "audio/dance_court.mp3", start: 5 },    // A Courtly Pounce（宮廷舞）
  bon: { src: "audio/dance_bon.mp3", start: 36 },       // Festival of Whiskers（盆舞）
  ballet: { src: "audio/dance_ballet.mp3", start: 23 }  // Tiptoeing Paws（芭蕾）
};

const GAME_URL_DEFAULT = "https://mochachen1225-create.github.io/scratch-it/";

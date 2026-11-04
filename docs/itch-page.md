# 《抓爛它！ Scratch It!》上架資料

上架前請再看一次 itch.io 編輯頁的實際欄位：平台規定會變，這份是 2026/11 整理的。署名一律寫「摩卡與貓貓小隊」。

## 基本資料

| 欄位 | 內容 |
|---|---|
| Title | Scratch It!（抓爛它！） |
| Project URL | `scratch-it` → https://mocha-cat-team.itch.io/scratch-it |
| Short description / tagline | Be the cat. Shred the cardboard. Every mess is a masterpiece. |
| Classification | Games |
| Kind of project | HTML |
| Release status | Released |
| Pricing | No payments（免費） |
| Genre | Simulation（副：Other） |
| Tags | cats, cozy, relaxing, satisfying, asmr, mobile, cute, touch, short, collection |
| Languages | English, Chinese (Traditional) |
| Inputs | Touchscreen, Mouse |
| Accessibility | 不計時、不比分數；可以隨時「抓夠了」結束；有靜音鍵 |

## 上傳與嵌入（itch）

1. 在 Mac 上執行打包：`./tools/package.sh`（itch 網址已內建），產出 `dist/scratch-it-itch-<版本>.zip`（約 7MB）
2. Uploads：上傳這個 zip，勾 **This file will be played in the browser**
3. Embed options：
   - Viewport dimensions：**420 × 860**
   - 勾 **Mobile friendly**，Orientation 選 **Portrait**
   - 勾 **Fullscreen button**
   - 不勾 Automatically start on page load（讓玩家點了才開始，iPhone 的聲音才會解鎖）
4. 在 itch.io、itch.zone 上遊戲預設是英文，玩家可以在首頁切換中文
5. 存檔只存在玩家自己的瀏覽器（localStorage），不連網、不收集任何資料

## AI 揭露（Edit game → AI disclosure，照實勾）

| 類別 | 勾選 | 說明 |
|---|---|---|
| Graphics | **Yes** | 三隻貓、哈士奇的插畫、第一人稱貓掌、驚喜插畫、小禮物、回禮卡、背影貼紙由 Gemini 生成；瓦楞紙花紋之一由 FLUX 生成。所有角色和材質都另外保留程式畫的版本 |
| Sound | **Yes** | 背景音樂和舞曲由 Gemini 生成；音效（抓的聲音、啵啵、呼嚕）是程式即時合成 |
| Text and dialogue | **Yes** | 英文翻譯和部分文案由 AI 協助 |
| Code | **Yes** | 程式由 AI 協助撰寫 |

遊戲首頁也有標示：「貓咪插畫、驚喜插畫、貓掌和背景音樂由 AI 生成（Gemini），瓦楞紙花紋之一由 AI 生成（FLUX），也有程式畫的版本」。

## 頁面文案（英文，itch 主要）

> **Be the cat. Shred everything. Call it art.**
>
> Your finger is a cat paw. Swipe, and the claws come out: cardboard tears into long strips, bubble wrap goes pop-pop-pop, and the sofa… well, the sofa puts up a fight.
>
> There's no timer, no score and no way to lose. Just the very satisfying sound of things falling apart.
>
> **Three cats, three styles**
> - **The Chief** scratches in neat, efficient lines (and fixes the crooked ones)
> - **The Architect** draws slow, elegant curves
> - **Rookie** goes wild with tiny frantic scratches and random zoomies
>
> **Things to find**
> - A surprise picture hides under every sheet. Peek, scratch, and collect them all (with rare and shiny versions)
> - Little gifts to give the cats. They react like real cats do: swatting, bunny-kicking, pushing things off the table
> - Every cat has up to 5 hearts. It only ever goes up
> - 18 art-movement titles for your masterpieces, from Fauvism to the 3 AM School
> - Snap an "aftermath photo" of the crime scene, with the cat sitting innocently next to it
>
> Use two fingers for two paws. Hold still to stamp paw prints. Leave whenever you've had enough, or scratch the whole sheet clean.
>
> Made by Mocha & the Cat Crew. Plays in your phone's browser, saves only on your device.

## 頁面文案（中文）

> **你就是貓。抓爛它，就是藝術。**
>
> 手指一滑就是一隻貓掌：瓦楞紙沿著紙條撕成一條條，泡泡紙啵啵啵，沙發……沙發會跟你拼。
>
> 沒有倒數、不比分數、不會輸，只有東西被抓爛的那種療癒聲音。
>
> **三隻貓，三種抓法**
> - **總編**：整齊有效率，歪了還會補一筆
> - **架構師**：慢慢的、優雅的長弧線
> - **小弟**：細碎亂抓，偶爾突然暴衝
>
> **可以找、可以收集的**
> - 每張紙下面都藏著一張驚喜插畫，偷看一角、抓開收進收集冊（還有稀有和閃亮版）
> - 小禮物送給貓，貓會像真的貓一樣：拍飛、抱住踢、推下桌
> - 每隻貓最多 5 顆❤️，只會越來越愛
> - 18 種流派畫名，從野獸派到凌晨三點派
> - 抓完拍一張「慘狀照」，貓坐在旁邊一臉無辜
>
> 兩隻手指就是兩隻貓掌；按住不動可以蓋肉球章；找到插畫就能收下離開，也可以抓到一乾二淨。
>
> 摩卡與貓貓小隊製作。用手機瀏覽器就能玩，存檔只存在你的手機。

## 9453（摩卡與貓貓小隊上架當天自己投稿）

- 收錄方式：填遊戲網址（GitHub Pages：https://mochachen1225-create.github.io/scratch-it/），「開始玩」會帶 `?utm_source=9453games.com&utm_medium=referral` 回原站。遊戲不讀網址參數，實測帶參數開啟、玩一局都正常
- 不用另做上架包
- 準備：封面（用 itch 那張）、直式截圖 3～5 張（用 itch 的 6 張挑）、一句話介紹＋約 100 字說明：
  - 一句話：你就是貓，手指一滑把紙箱抓爛，抓痕就是你的作品。
  - 說明（約 100 字）：療癒解壓的手機小遊戲。選一隻貓，用手指當貓掌，把瓦楞紙撕成一條條、泡泡紙啵啵啵、沙發抓到露出棉花。沒有倒數、不比分數，每張紙下面都藏著驚喜插畫，還能送小禮物給貓、拍一張貓一臉無辜的「慘狀照」。

## 宣傳素材（11/7～12 做；上架包 11/14 前放好，11/20 上架）

| 項目 | 規格 | 做法 |
|---|---|---|
| 封面 | 630×500 | 抓到一半的瓦楞紙＋三隻貓貼紙＋標題字（程式排版，用遊戲裡的 AI 插畫） |
| 截圖 6 張 | 4:5（1080×1350） | ①瓦楞紙長條抓痕 ②泡泡紙啵啵 ③沙發裂開露棉花 ④找到驚喜插畫 ⑤收禮反應（拍飛／推下桌）⑥慘狀照（手機框） |
| 試玩影片 | 直式 1080×1920，20～30 秒（11/12 前） | 程式錄遊戲畫面（照盲畫 tools/trailer 的做法），配樂建議用遊戲裡的〈Kitchen Counter Zoomies〉 |

## 上架後

- 遊戲內分享網址、圖卡和慘狀照上的網址會自動指向 itch 頁（打包時寫進去）
- GitHub Pages 版（https://mochachen1225-create.github.io/scratch-it/）照常更新，分享網址指向 GitHub Pages

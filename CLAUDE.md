# 給接手的 Claude

《抓爛它！》是療癒解壓的手機網頁小遊戲（中英雙語）。設計在 `docs/game-design.md`，進度與決定在 `NOTES.md`，先讀它們。

## 每次修改都要做
1. 版本號：`VERSION`、`js/game.js` 的 `VERSION` 和 `CHANGES`（首頁「更新了什麼」）、`index.html` 每個 script 的 `?v=`
2. 新增中文字串時，同一個 commit 補英文到 `js/i18n.en.js`（貓名、材質、畫名也在這裡）
3. 390×844 實際玩一輪（三隻貓各抓一張），沒有錯誤才推
4. 更新 `NOTES.md`（更新紀錄、目前進度、還沒做的想法、設計決定）
5. 新功能、大改動先跟總編確認；小 bug 改完通知總編（版本號＋玩家看得懂的一兩句）

## 內容規則
- 不嚇人、不比分數、沒有倒數；療癒為主
- 不出現真實人名、品牌；公開 repo 不寫作者和家人是誰；感謝回報寫「感謝玩家回報」
- 程式註解和所有會公開的檔案，作者一律寫「摩卡與貓貓小隊」，不寫本名；英文署名一律寫「Mocha & the Cat Hero Party」
- AI 生成的圖要標示，並保留程式畫的備用版（`js/cats.js`）
- 不用中國的 AI 工具；聲音優先 Web Audio 合成；預算 0 元，要花錢先說

## 程式注意事項
- 翻譯函式叫 `T()`、`W()`：不要再宣告叫 `T` 或 `W` 的變數
- 所有 localStorage 讀寫都包 try/catch（用 `store.get/set`）；收藏冊存不下時丟最舊的
- 這個遊戲不加後端；唯一的連網是 GoatCounter 匿名事件計數（`gcEvent()`：scratch-replay／scratch-photo／scratch-other，不用 cookie、不記個人資料、失敗靜默略過），要加新事件先跟總編確認

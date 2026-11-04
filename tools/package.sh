#!/usr/bin/env bash
# 打包《抓爛它！》給 itch.io。在一般 Mac 上可直接跑（只用 bash、zip、perl）。
#
# 用法：
#   ./tools/package.sh [itch 遊戲頁網址]
# 預設 https://mocha-cat-team.itch.io/scratch-it
#
# 產出（在 repo 的 dist/ 資料夾）：
#   scratch-it-itch-<版本>.zip   上傳到 itch.io（勾 This file will be played in the browser）
# 遊戲完全不連網（字型用 Google Fonts，沒網路時會用系統字型），zip 裡有 index.html、js、art、audio。
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
VERSION="$(tr -d ' \n' < VERSION)"
ITCH_URL="${1:-https://mocha-cat-team.itch.io/scratch-it}"

build() {
  local name="$1" game_url="$2"
  local tmp; tmp="$(mktemp -d)"
  cp index.html "$tmp/"
  mkdir -p "$tmp/js"
  cp js/*.js "$tmp/js/"
  cp -R art audio "$tmp/"
  # 在第一個 script 前插入網址設定：分享、圖卡、慘狀照上的網址指向遊戲頁
  GAME_URL="$game_url" perl -0pi -e \
    's{<script src="js/i18n\.js}{<script>window.GAME_URL="$ENV{GAME_URL}";</script>\n<script src="js/i18n.js}' \
    "$tmp/index.html"
  grep -q 'window.GAME_URL' "$tmp/index.html" || { echo "插入網址設定失敗" >&2; exit 1; }
  mkdir -p "$ROOT/dist"
  local out="$ROOT/dist/scratch-it-$name-$VERSION.zip"
  rm -f "$out"
  (cd "$tmp" && zip -qr "$out" index.html js art audio)   # index.html 一定要在 zip 最外層
  rm -rf "$tmp"
  echo "✅ $out（$(du -h "$out" | cut -f1)）"
}

build itch "$ITCH_URL"
echo "版本 $VERSION 打包完成。上傳前可以解壓縮，用 python3 -m http.server 打開 index.html 測一次。"

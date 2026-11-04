#!/usr/bin/env bash
# 把 trailer.mjs 拍好的格子排成 30fps，配上〈Kitchen Counter Zoomies〉（最後 1.5 秒淡出），輸出 promo/trailer-<lang>.mp4
# 用法：tools/promo/trailer.sh <trailer.mjs 的輸出資料夾> <音樂 mp3> zh|en
set -euo pipefail
cd "$(dirname "$0")/../.."
DIR="$1"; MUSIC="$2"; L="$3"
OUT="promo/trailer-$L.mp4"
DUR=$(python3 -c "import sys; print(round(sum(float(l.split()[1]) for l in open(sys.argv[1]) if l.startswith('duration')), 2))" "$DIR/frames-$L.txt")
FADE=$(python3 -c "print(max(0, $DUR - 1.5))")
ffmpeg -v error -y -f concat -safe 0 -i "$DIR/frames-$L.txt" -i "$MUSIC" \
  -filter_complex "[0:v]fps=30,format=yuv420p[v];[1:a]atrim=0:$DUR,afade=t=in:d=0.3,afade=t=out:st=$FADE:d=1.5,volume=0.9[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 20 -preset slow -profile:v high -c:a aac -b:a 160k -movflags +faststart -shortest "$OUT"
echo "✅ $OUT（$(du -h "$OUT" | cut -f1)，$DUR 秒）"

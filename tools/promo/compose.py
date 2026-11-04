# 《抓爛它！》itch 截圖（1080×1350）和封面（1260×1000／630×500）
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
# D：capture.mjs 拍下的原始截圖資料夾（s1-zh.png …）
D = os.environ.get('SHOTS', os.path.dirname(os.path.abspath(__file__)) + '/shots/')
OUT = '/home/user/scratch-it/promo/itch/'
ART = '/home/user/scratch-it/art/'
os.makedirs(OUT, exist_ok=True)
FONT = os.environ.get('FONT', 'huninn.ttf')   # Google Fonts 的 Huninn（jf open 粉圓）
INK = (58, 46, 42)

def font(n): return ImageFont.truetype(FONT, n)

def grad(w, h, top, bot):
    im = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / (h - 1)
        d.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return im

def text_c(d, cx, y, s, f, fill=INK, stroke=0, sfill=None):
    w = d.textlength(s, font=f)
    d.text((cx - w / 2, y), s, font=f, fill=fill, stroke_width=stroke, stroke_fill=sfill or fill)

def ribbon(im, cx, cy, s, f, rot=-2):
    d0 = ImageDraw.Draw(im)
    w = int(d0.textlength(s, font=f)) + 110; h = f.size + 50
    r = Image.new('RGBA', (w + 20, h + 20), (0, 0, 0, 0)); d = ImageDraw.Draw(r)
    d.rounded_rectangle([12, 12, w + 8, h + 8], 24, fill=INK)
    d.rounded_rectangle([4, 4, w, h], 24, fill=(255, 217, 106), outline=INK, width=5)
    d.text((55, (h - f.size) / 2 - 2), s, font=f, fill=INK)
    r = r.rotate(rot, expand=True, resample=Image.BICUBIC)
    im.paste(r, (int(cx - r.width / 2), int(cy - r.height / 2)), r)

def phone(shot, width, max_h):
    s = Image.open(shot).convert('RGB')
    k = width / s.width; s = s.resize((width, int(s.height * k)), Image.LANCZOS)
    s = s.crop((0, 0, width, min(s.height, max_h)))
    pad = 16; fr = Image.new('RGBA', (width + pad * 2 + 18, s.height + pad * 2 + 18), (0, 0, 0, 0))
    d = ImageDraw.Draw(fr)
    d.rounded_rectangle([14, 14, width + pad * 2 + 14, s.height + pad * 2 + 14], 70, fill=(0, 0, 0, 70))
    d.rounded_rectangle([0, 0, width + pad * 2, s.height + pad * 2], 70, fill=INK)
    m = Image.new('L', s.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, s.width, s.height], 56, fill=255)
    fr.paste(s, (pad, pad), m)
    return fr

# 順序：慘狀照最好笑放第 1 張；第 6 張是小弟收禮爆衝；第 7 張是 12 月大更新預告
ORDER = [6, 1, 2, 3, 4, 5]
COPY = {
 'zh': {1: ("手指一滑", "就是貓掌", "瓦楞紙沿著紙條撕開"), 2: ("啵啵啵", "停不下來", "泡泡紙越抓越療癒"), 3: ("沙發", "會跟你拼", "抓久了才裂開露出棉花"),
        4: ("每張紙下面", "都藏著驚喜", "收集插畫・稀有和閃亮版"), 5: ("送禮物", "貓會真的玩", "小弟開心到 Z 字型爆衝"), 6: ("抓完", "拍一張慘狀照", "主人碎碎念，貓一臉無辜")},
 'en': {1: ("Your finger", "is a cat paw", "Cardboard tears into long strips"), 2: ("Pop, pop,", "pop, pop", "Bubble wrap you can't stop popping"), 3: ("The sofa", "fights back", "Keep going till the stuffing shows"),
        4: ("A surprise", "under every sheet", "Collect rare & shiny pictures"), 5: ("Gifts get real", "cat reactions", "Rookie gets the zoomies"), 6: ("Snap the", "crime scene", "The cat looks totally innocent")}}
SOON = {'zh': ("12 月", "大更新", "即將推出", ["紙箱城堡", "窗簾", "長毛地毯", "衛生紙捲", "聖誕禮物紙箱", "沙發布色和花紋", "柴犬阿柴來玩"]),
        'en': ("Coming in", "December", "Big update", ["Cardboard castle", "Curtains", "Shaggy rug", "Toilet paper roll", "Christmas gift box", "Sofa colors & patterns", "Shiba comes to play"])}
BG = {1: ((255, 226, 170), (255, 196, 170)), 2: ((214, 236, 250), (255, 214, 226)), 3: ((200, 232, 224), (255, 226, 190)),
      4: ((255, 232, 160), (255, 200, 200)), 5: ((255, 220, 230), (255, 236, 180)), 6: ((235, 222, 255), (255, 214, 190)), 7: ((255, 214, 170), (255, 170, 190))}
EMOJI = None
def card(img, w, radius=40):
    k = w / img.width; img = img.resize((w, int(img.height * k)), Image.LANCZOS).convert('RGBA')
    fr = Image.new('RGBA', (img.width + 32, img.height + 32), (0, 0, 0, 0)); d = ImageDraw.Draw(fr)
    d.rounded_rectangle([12, 12, img.width + 28, img.height + 28], radius + 8, fill=(0, 0, 0, 60))
    d.rounded_rectangle([0, 0, img.width + 16, img.height + 16], radius + 8, fill=INK)
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, img.width, img.height], radius, fill=255)
    fr.paste(img, (8, 8), m); return fr

for L in ('zh', 'en'):
    for n, src in enumerate(ORDER + [7], 1):
        W0, H0 = 1080, 1350
        im = grad(W0, H0, *BG[src]).convert('RGBA'); d = ImageDraw.Draw(im)
        h1, h2, rb = (SOON[L][:3] if src == 7 else COPY[L][src])
        fh = font(104 if L == 'zh' else 92)
        text_c(d, W0 / 2, 60, h1, fh, stroke=3)
        text_c(d, W0 / 2, 60 + fh.size + 18, h2, fh, stroke=3)
        ribbon(im, W0 / 2, 60 + fh.size * 2 + 100, rb, font(46 if L == 'zh' else 40))
        top = 60 + fh.size * 2 + 170
        if src == 7:
            # 預告清單＋柴犬
            box = Image.new('RGBA', (W0, H0), (0, 0, 0, 0)); bd = ImageDraw.Draw(box)
            bd.rounded_rectangle([90, top, W0 - 90, H0 - 70], 50, fill=(255, 250, 242, 235), outline=INK, width=6); im.alpha_composite(box)
            d = ImageDraw.Draw(im); f2 = font(54 if L == 'zh' else 46)
            cols = [(255, 184, 198), (174, 213, 255), (169, 229, 198), (255, 217, 106), (255, 160, 120), (200, 180, 255), (255, 200, 140)]
            for k2, item in enumerate(SOON[L][3]):
                y = top + 50 + k2 * 112; cy = y + f2.size / 2 + 4
                d.ellipse([140, cy - 20, 180, cy + 20], fill=cols[k2 % 7], outline=INK, width=4)   # 小肉球圓點
                for dx, dy in [(-12, -24), (0, -30), (12, -24)]: d.ellipse([160 + dx - 6, cy + dy - 6, 160 + dx + 6, cy + dy + 6], fill=cols[k2 % 7], outline=INK, width=3)
                d.text((205, y), item, font=f2, fill=INK)
            sh = Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shiba.png')).convert('RGBA'); k = 330 / sh.height
            sh = sh.resize((int(sh.width * k), 330), Image.LANCZOS); im.alpha_composite(sh, (W0 - sh.width - 110, H0 - sh.height - 90))
        elif src == 6:
            ph = Image.open(D + f's6-{L}.png').convert('RGBA'); k = min(860 / ph.width, (H0 - top - 20) / ph.height)
            ph = ph.resize((int(ph.width * k), int(ph.height * k)), Image.LANCZOS)
            im.paste(ph, (int(W0 / 2 - ph.width / 2), top), ph)
        elif src == 5:
            # 收禮爆衝：只取舞台那一段放大
            sc = Image.open(D + f's5-{L}.png').convert('RGB'); y0, y1 = int(sc.height * .30), int(sc.height * .76)
            cd = card(sc.crop((0, y0, sc.width, y1)), 860)
            im.paste(cd, (int(W0 / 2 - cd.width / 2), top + 10), cd)
        else:
            fr = phone(D + f's{src}-{L}.png', 470, H0 - top + 40)
            im.paste(fr, (int(W0 / 2 - fr.width / 2 + 9), top), fr)
        im.convert('RGB').save(OUT + f'screenshot-{L}-{n}.png')

# 封面：抓到一半的瓦楞紙當背景，標題＋三隻貓
W0, H0 = 1260, 1000
# 背景：程式畫的瓦楞紙（一條條波浪）＋幾道長條抓痕
import math, random
random.seed(7)
bg = Image.new('RGB', (W0, H0), (217, 180, 131)); dd = ImageDraw.Draw(bg)
for y in range(0, H0, 16):
    t = random.uniform(-10, 10); dd.rectangle([0, y, W0, y + 16], fill=(int(217 + t), int(180 + t), int(131 + t)))
    dd.line([(0, y + 15), (W0, y + 15)], fill=(150, 105, 60), width=2)
    pts = [(x, y + 8 + math.sin(x * .45) * 4) for x in range(0, W0 + 4, 3)]; dd.line(pts, fill=(140, 95, 50), width=2)
for k in range(14):
    y = random.choice(range(520, H0, 16)) + 8; x0 = random.randint(-100, 700); L = random.randint(220, 560)
    dd.rectangle([x0, y - 3, x0 + L, y + 3], fill=(74, 47, 23)); dd.line([(x0, y - 5), (x0 + L, y - 5)], fill=(251, 238, 210), width=2)
bg = bg.convert('RGBA')
d = ImageDraw.Draw(bg)
ov = Image.new('RGBA', (W0, H0), (0, 0, 0, 0)); ImageDraw.Draw(ov).rounded_rectangle([110, 70, W0 - 110, 470], 60, fill=(255, 250, 242, 230), outline=INK, width=8)
bg.alpha_composite(ov)
text_c(d, W0 / 2, 95, "Scratch It!", font(170), stroke=4)
text_c(d, W0 / 2, 300, "抓爛它！", font(120), fill=(201, 110, 60), stroke=3)
for j, (cat, x) in enumerate([('orange', 150), ('grey', 480), ('white', 810)]):
    c = Image.open(ART + f'{cat}_sit.webp').convert('RGBA'); k = 430 / c.height
    c = c.resize((int(c.width * k), 430), Image.LANCZOS)
    bg.paste(c, (x + (300 - c.width) // 2, H0 - 455 - (20 if j == 1 else 0)), c)
bg.convert('RGB').save(OUT + 'cover.png')
bg.convert('RGB').resize((630, 500), Image.LANCZOS).save(OUT + 'cover-630x500.png')
print('ok', sorted(os.listdir(OUT)))

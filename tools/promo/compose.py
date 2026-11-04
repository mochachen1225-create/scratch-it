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

COPY = {
 'zh': [("手指一滑", "就是貓掌", "瓦楞紙沿著紙條撕開"),
        ("啵啵啵", "停不下來", "泡泡紙越抓越療癒"),
        ("沙發", "會跟你拼", "抓久了才裂開露出棉花"),
        ("每張紙下面", "都藏著驚喜", "收集插畫・稀有和閃亮版"),
        ("送禮物", "貓會真的玩", "拍飛、抱住踢、推下桌"),
        ("抓完", "拍一張慘狀照", "貓坐旁邊一臉無辜")],
 'en': [("Your finger", "is a cat paw", "Cardboard tears into long strips"),
        ("Pop, pop,", "pop, pop", "Bubble wrap you can't stop popping"),
        ("The sofa", "fights back", "Keep going till the stuffing shows"),
        ("A surprise", "under every sheet", "Collect rare & shiny pictures"),
        ("Gifts get real", "cat reactions", "Swat it, kick it, push it off the table"),
        ("Snap the", "crime scene", "The cat looks totally innocent")]}
BG = [((255, 226, 170), (255, 196, 170)), ((214, 236, 250), (255, 214, 226)), ((200, 232, 224), (255, 226, 190)),
      ((255, 232, 160), (255, 200, 200)), ((255, 220, 230), (255, 236, 180)), ((235, 222, 255), (255, 214, 190))]

for L in ('zh', 'en'):
    for i, (h1, h2, rb) in enumerate(COPY[L]):
        W0, H0 = 1080, 1350
        im = grad(W0, H0, *BG[i]).convert('RGBA'); d = ImageDraw.Draw(im)
        fh = font(104 if L == 'zh' else 92)
        text_c(d, W0 / 2, 60, h1, fh, stroke=3)
        text_c(d, W0 / 2, 60 + fh.size + 18, h2, fh, stroke=3)
        ribbon(im, W0 / 2, 60 + fh.size * 2 + 100, rb, font(46 if L == 'zh' else 40))
        top = 60 + fh.size * 2 + 170
        shot = D + f's{i + 1}-{L}.png'
        if i == 5:
            ph = Image.open(shot).convert('RGBA'); k = min(860 / ph.width, (H0 - top - 20) / ph.height)
            ph = ph.resize((int(ph.width * k), int(ph.height * k)), Image.LANCZOS)
            im.paste(ph, (int(W0 / 2 - ph.width / 2), top), ph)
        else:
            fr = phone(shot, 470, H0 - top + 40)
            im.paste(fr, (int(W0 / 2 - fr.width / 2 + 9), top), fr)
        im.convert('RGB').save(OUT + f'screenshot-{L}-{i + 1}.png')

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

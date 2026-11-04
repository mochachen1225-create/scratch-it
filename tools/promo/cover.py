# 《抓爛它！》itch 封面兩版（1260×1000＋630×500）：整張是被抓破的瓦楞紙特寫，大字直接壓在紙上
# A：正中間一道橫向大撕痕，三隻貓從裂縫探頭；B：三道斜斜的大爪痕，貓掌正在撕，貓從爪痕裡探頭
import os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, '../../art/')
OUT = os.path.join(HERE, '../../promo/itch/')
FONT = os.environ.get('FONT', 'huninn.ttf')
INK = (58, 46, 42)
W0, H0 = 1260, 1000

def font(n): return ImageFont.truetype(FONT, n)

def cardboard(seed):
    random.seed(seed)
    im = Image.new('RGB', (W0, H0), (217, 180, 131)); d = ImageDraw.Draw(im)
    for y in range(0, H0, 18):
        t = random.uniform(-9, 9); d.rectangle([0, y, W0, y + 18], fill=(int(214 + t), int(176 + t), int(126 + t)))
        d.line([(0, y + 17), (W0, y + 17)], fill=(140, 98, 55), width=2)
        d.line([(x, y + 9 + math.sin(x * .42 + y) * 4.5) for x in range(0, W0 + 4, 3)], fill=(132, 90, 48), width=2)
        d.line([(0, y + 1), (W0, y + 1)], fill=(240, 214, 172), width=1)
    for _ in range(2600):   # 紙纖維小點
        x, y = random.randrange(W0), random.randrange(H0); c = random.choice([(120, 82, 40), (248, 232, 205)])
        d.point((x, y), fill=c)
    return im.convert('RGBA')

def jag(pts, amp, step, rnd):
    out = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
        for k in range(n):
            t = k / n; out.append((x0 + (x1 - x0) * t + rnd.uniform(-amp, amp) * .3, y0 + (y1 - y0) * t + rnd.uniform(-amp, amp)))
    out.append(pts[-1]); return out

def tear(im, top, bot, rnd):
    # 撕開的洞：深色裂縫＋邊緣一圈淺色毛邊＋翹起的紙條
    poly = top + bot[::-1]
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).polygon([(x + 6, y + 10) for x, y in poly], fill=(0, 0, 0, 90))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    d = ImageDraw.Draw(im)
    d.polygon(poly, fill=(70, 44, 22))
    for y in range(int(min(p[1] for p in poly)), int(max(p[1] for p in poly)), 18):   # 裡面的波浪芯
        d.line([(x, y + 9 + math.sin(x * .35) * 5) for x in range(0, W0, 4)], fill=(110, 72, 36), width=3)
    d.polygon(poly, outline=None)
    mask = Image.new('L', im.size, 0); ImageDraw.Draw(mask).polygon(poly, fill=255)
    inner = Image.new('RGBA', im.size, (0, 0, 0, 0)); im2 = im.copy()
    # 只留洞裡的芯（外面還原）
    return mask

def edges(d, line, rnd, up):
    for (x0, y0), (x1, y1) in zip(line, line[1:]):
        d.line([(x0, y0), (x1, y1)], fill=(252, 240, 214), width=7)
        if rnd.random() < .25:   # 翹起的小紙條
            L = rnd.uniform(14, 34); a = (-1 if up else 1) * rnd.uniform(.6, 1.3)
            d.line([(x0, y0), (x0 + rnd.uniform(-8, 8), y0 + a * L)], fill=(246, 226, 190), width=rnd.choice([3, 4, 5]))

def paste_cat(im, name, cx, bottom, h, clip_poly=None, rot=0):
    c = Image.open(ART + name + '.webp').convert('RGBA'); k = h / c.height
    c = c.resize((int(c.width * k), int(h)), Image.LANCZOS)
    if rot: c = c.rotate(rot, expand=True, resample=Image.BICUBIC)
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0)); layer.paste(c, (int(cx - c.width / 2), int(bottom - c.height)), c)
    if clip_poly:
        m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(clip_poly, fill=255)
        layer.putalpha(Image.composite(layer.getchannel('A'), Image.new('L', im.size, 0), m))
    im.alpha_composite(layer)

def title(im, cy, zh_y=None):
    d = ImageDraw.Draw(im)
    for s, f, y, fill in [("抓爛它！", font(210), cy, (255, 236, 176)), ("Scratch It!", font(108), (zh_y or cy + 225), (255, 255, 255))]:
        w = d.textlength(s, font=f); x = W0 / 2 - w / 2
        d.text((x + 10, y + 12), s, font=f, fill=INK, stroke_width=14, stroke_fill=INK)   # 厚陰影
        d.text((x, y), s, font=f, fill=fill, stroke_width=14, stroke_fill=INK)

def scraps(im, rnd, n, area):
    d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = rnd.uniform(area[0], area[2]), rnd.uniform(area[1], area[3]); w, h = rnd.uniform(14, 40), rnd.uniform(5, 11); a = rnd.uniform(0, math.pi)
        pts = [(x + math.cos(a) * dx - math.sin(a) * dy, y + math.sin(a) * dx + math.cos(a) * dy) for dx, dy in [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]]
        d.polygon(pts, fill=rnd.choice([(232, 200, 150), (252, 238, 210), (199, 157, 102)]), outline=INK)

def version_a():
    rnd = random.Random(3); im = cardboard(3)
    top = jag([(-20, 560), (300, 520), (640, 545), (960, 515), (1290, 550)], 26, 22, rnd)
    bot = jag([(-20, 905), (330, 935), (640, 915), (950, 940), (1290, 905)], 26, 22, rnd)
    poly = top + bot[::-1]
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).polygon([(x + 6, y + 12) for x, y in poly], fill=(0, 0, 0, 110)); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(im); d.polygon(poly, fill=(64, 40, 20))
    for y in range(500, 960, 20): d.line([(x, y + math.sin(x * .3) * 6) for x in range(0, W0, 4)], fill=(104, 68, 34), width=4)
    hole = [(x, y) for x, y in poly]
    # 三隻貓從裂縫探頭（下半身藏在下緣後面）
    for name, cx, h, rot in [('orange_sit', 270, 470, -4), ('grey_sit', 640, 500, 0), ('white_sit', 1000, 480, 5)]:
        paste_cat(im, name, cx, 1090, h, clip_poly=[(0, 0), (W0, 0)] + bot[::-1], rot=rot)
    # 下緣撕開的紙壓在貓前面
    front = Image.new('RGBA', im.size, (0, 0, 0, 0)); fm = Image.new('L', im.size, 0); ImageDraw.Draw(fm).polygon(bot + [(W0 + 20, H0 + 20), (-20, H0 + 20)], fill=255)
    front.paste(cardboard(3), (0, 0), fm); im.alpha_composite(front)
    d = ImageDraw.Draw(im); edges(d, top, rnd, True); edges(d, bot, rnd, False)
    title(im, 70); scraps(im, rnd, 40, (0, 380, W0, 600))
    return im

def version_b():
    rnd = random.Random(11); im = cardboard(11)
    d = ImageDraw.Draw(im)
    slashes = []
    for k, (x0, y0) in enumerate([(160, 470), (450, 420), (740, 380)]):
        a = .38; L = 760; w = 70 + k * 8
        cx0, cy0, cx1, cy1 = x0, y0, x0 + math.cos(a) * L, y0 + math.sin(a) * L
        nx, ny = -math.sin(a), math.cos(a)
        top = jag([(cx0 + nx * -w * .2, cy0 + ny * -w * .2), ((cx0 + cx1) / 2 + nx * -w, (cy0 + cy1) / 2 + ny * -w), (cx1, cy1)], 12, 18, rnd)
        bot = jag([(cx0, cy0), ((cx0 + cx1) / 2 + nx * w, (cy0 + cy1) / 2 + ny * w), (cx1 + nx * w * .2, cy1 + ny * w * .2)], 12, 18, rnd)
        poly = top + bot[::-1]; slashes.append(poly)
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).polygon([(x + 5, y + 9) for x, y in poly], fill=(0, 0, 0, 110)); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
        d = ImageDraw.Draw(im); d.polygon(poly, fill=(64, 40, 20))
        edges(d, top, rnd, True); edges(d, bot, rnd, False)
    # 貓從三道爪痕探頭
    for poly, name, h in zip(slashes, ['white_peek', 'orange_peek', 'white_peek'], [0, 0, 0]):
        pass
    for poly, (name, cx, by, hh) in zip(slashes, [('orange_sit', 330, 860, 400), ('grey_sit', 640, 720, 400), ('white_sit', 980, 790, 400)]):
        paste_cat(im, name, cx, by, hh, clip_poly=poly)
    d = ImageDraw.Draw(im)
    for poly in slashes:   # 重畫毛邊壓在貓上
        n = len(poly) // 2; edges(d, poly[:n], rnd, True); edges(d, poly[n:], rnd, False)
    # 貓掌正在撕（右下角）
    paw = Image.open(ART + 'orange_paw_out.webp').convert('RGBA'); k = 330 / paw.height; paw = paw.resize((int(paw.width * k), 330), Image.LANCZOS).rotate(28, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(paw, (W0 - paw.width - 30, H0 - paw.height + 40))
    title(im, 60, zh_y=275); scraps(im, rnd, 55, (0, 360, W0, H0))
    return im

os.makedirs(OUT, exist_ok=True)
for tag, im in [('a', version_a()), ('b', version_b())]:
    im = im.convert('RGB'); im.save(OUT + f'cover-{tag}.png'); im.resize((630, 500), Image.LANCZOS).save(OUT + f'cover-{tag}-630x500.png')
print('ok')

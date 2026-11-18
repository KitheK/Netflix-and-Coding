import numpy as np, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont
FONT = 'dist/LibrettoPaleologue-Regular.ttf'
PAPER = (243, 235, 221); VERM = (232, 100, 27); INK = (22, 18, 16)
LABEL = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def F(size): return ImageFont.truetype(FONT, size, layout_engine=ImageFont.Layout.RAQM)
def text_mask(text, size, features=None, tracking=0):
    f = F(size)
    feats = features or []
    if tracking:
        # draw char by char using advance + kerning-less tracking
        widths = [f.getlength(c, features=feats) for c in text]
        W = int(sum(widths) + tracking * (len(text) - 1) + size); H = int(size * 1.5)
        m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m); x = size * 0.25
        for c, w in zip(text, widths):
            d.text((x, size * 0.25), c, font=f, fill=255, features=feats); x += w + tracking
    else:
        W = int(f.getlength(text, features=feats) + size); H = int(size * 1.5)
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).text((size * 0.25, size * 0.25), text, font=f, fill=255, features=feats)
    bb = m.getbbox(); return m, bb

def poster(img, text, xy, size, outline=None, anchor='c', features=None, tracking=0, fill=VERM, ink=INK):
    """black silhouette + vermilion fill inset by `outline` px (reproduces the lithographic outline)"""
    m, bb = text_mask(text, size, features, tracking)
    outline = outline or max(1.5, size * 0.017)
    import cv2
    a = np.asarray(m).astype(np.float32) / 255
    # round (Euclidean) erosion via distance transform at 4x supersampling for an even ink line
    up = cv2.resize(a, None, fx=4, fy=4, interpolation=cv2.INTER_LINEAR) > 0.5
    dist = cv2.distanceTransform(up.astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
    inner_up = np.clip((dist - outline * 4) / 4 + 0.5, 0, 1)
    inner = Image.fromarray((cv2.resize(inner_up, m.size, interpolation=cv2.INTER_AREA) * 255).astype(np.uint8))
    x, y = xy
    asc_off = size * 0.25 + size * (950 - 700) / 1000  # top of caps inside the mask
    if anchor == 'c': ox = int(x - (bb[0] + bb[2]) / 2)
    elif anchor == 'l': ox = int(x - bb[0])
    else: ox = int(x - bb[2])
    oy = int(y - asc_off)  # y = cap-top line
    img.paste(Image.new('RGB', m.size, ink), (ox, oy), m)
    img.paste(Image.new('RGB', m.size, fill), (ox, oy), inner)
    return (ox + bb[0], oy + bb[1], ox + bb[2], oy + bb[3])

def solid(img, text, xy, size, color=INK, features=None, anchor='la'):
    d = ImageDraw.Draw(img); d.text(xy, text, font=F(size), fill=color, features=features or [], anchor=anchor)

def lab(img, text, xy, size=18, color=(120, 105, 90), anchor='la'):
    ImageDraw.Draw(img).text(xy, text, font=ImageFont.truetype(LABEL, size), fill=color, anchor=anchor)

def paper(w, h):
    rng = np.random.default_rng(3)
    base = np.ones((h, w, 3)) * np.array(PAPER)
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))

def spec_az():
    img = paper(1920, 1080)
    rows = ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ']
    size = 250
    for i, r in enumerate(rows):
        poster(img, r, (960, 120 + i * 300), size, tracking=34)
    lab(img, 'LIBRETTO PALÉOLOGUE  ·  REGULAR  ·  AFTER PAL, “STANDARD”, c.1900', (960, 1052), 18, anchor='mm')
    img.save('specimens/specimen-AZ.png')

def spec_standard():
    post = Image.open('work/poster-standard.png').convert('RGB')
    W = 1800; img = Image.new('RGB', (W, 1100), (165, 184, 140))
    pw = 900; ph = int(post.height * pw / post.width); post = post.resize((pw, ph), Image.LANCZOS)
    img.paste(post, ((W - pw) // 2, 40))
    lab(img, 'Original: Jean de Paléologue (PAL), “Standard” sewing-machine poster, c.1900 (public domain)', (W // 2, 40 + ph + 24), 18, (40, 50, 30), 'mm')
    y = 40 + ph + 90
    poster(img, '“STANDARD”', (W // 2, y), 190)
    lab(img, 'Libretto Paléologue — default S', (W // 2, y + 225), 18, (40, 50, 30), 'mm')
    y2 = y + 290
    poster(img, '“STANDARD”', (W // 2, y2), 190, features=['ss01'])
    lab(img, 'Libretto Paléologue — ss01 poster swash S (traced from the poster)', (W // 2, y2 + 225), 18, (40, 50, 30), 'mm')
    img = img.crop((0, 0, W, y2 + 250)); img.save('specimens/specimen-standard.png')

def spec_text():
    img = paper(1920, 1600)
    poster(img, 'Libretto', (80, 70), 200, anchor='l')
    poster(img, 'Conductor', (1840, 70), 200, anchor='r')
    solid(img, 'abcdefghijklmnopqrstuvwxyz', (80, 330), 112)
    solid(img, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', (80, 470), 92)
    solid(img, '0123456789 & ? ! ( ) / “ ” ‘ ’ - – —', (80, 590), 80)
    solid(img, 'The quick brown fox jumps over the lazy dog.', (80, 720), 84, VERM)
    solid(img, 'Belle Époque · « À la française » · Ça déçoit où ?', (80, 830), 64)
    poster(img, 'AVATAR · LT · TAVERN · Yo To P. · WAVY · FLY', (80, 935), 60, anchor='l')
    para = ['Conductor reads your Canvas courses, keeps track of what is due,',
            'and drafts the busywork so you can get back to the actual learning.',
            'Libretto is its manual: each chapter shows the real screens, the',
            'agent thinking, and the services that move a request end to end.']
    for i, l in enumerate(para): solid(img, l, (80, 1050 + i * 62), 46)
    for i, (sz, s) in enumerate([(36, 'Hamburgefonstiv 36px'), (28, 'Hamburgefonstiv 28px — the practical floor'), (20, 'Hamburgefonstiv 20px — too small for this face')]):
        solid(img, s, (80, 1330 + i * 66), sz)
    lab(img, 'Lowercase after É. Mulier, “Lettres et Enseignes Art Nouveau” (c.1900), drawn to the weight of the PAL capitals', (1840, 1570), 18, anchor='rm')
    img.save('specimens/specimen-text.png')

def spec_glyphs():
    tt = TTFont(FONT); cmap = tt.getBestCmap(); order = [g for g in tt.getGlyphOrder() if g not in ('.notdef', 'space', 'nbspace')]
    rev = {}
    for u, g in cmap.items(): rev.setdefault(g, u)
    cols = 14; cw, ch = 132, 170
    rows = (len(order) + cols - 1) // cols
    img = paper(cols * cw + 80, rows * ch + 120)
    lab(img, f'Libretto Paléologue — {len(order)} glyphs', (40, 30), 22, (60, 50, 40))
    f = F(92); d = ImageDraw.Draw(img)
    for i, g in enumerate(order):
        x = 40 + (i % cols) * cw; y = 80 + (i // cols) * ch
        d.rectangle((x, y, x + cw - 6, y + ch - 6), outline=(215, 200, 180))
        if g == 'S.ss01': ch_ = 'S'; feats = ['ss01']
        else: ch_ = chr(rev[g]); feats = []
        d.text((x + cw / 2 - 3, y + 100), ch_, font=f, fill=INK, anchor='ms', features=feats)
        lab(img, g[:14], (x + cw / 2 - 3, y + ch - 22), 12, (130, 115, 100), 'mm')
    img.save('specimens/specimen-glyphs.png')

if __name__ == '__main__':
    which = sys.argv[1:] or ['az', 'standard', 'text', 'glyphs']
    for w in which: globals()['spec_' + w]()

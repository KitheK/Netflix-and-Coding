import sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from PIL import Image, ImageDraw, ImageFont
tt = TTFont('dist/LibrettoPaleologue-Regular.ttf'); gs = tt.getGlyphSet()
names = sys.argv[2:]; out = sys.argv[1]
S = float(__import__("os").environ.get("NVS", 0.7)); W = 0
ims = []
for n in names:
    r = RecordingPen(); gs[n].draw(r)
    adv = gs[n].width
    im = Image.new('RGB', (int(adv * S) + 40, int(1150 * S)), 'white'); d = ImageDraw.Draw(im)
    f = ImageFont.truetype('dist/LibrettoPaleologue-Regular.ttf', int(1000 * S))
    ch = {v: k for k, v in tt.getBestCmap().items()}.get(n)
    tf = lambda p: (20 + p[0] * S, (950 - p[1]) * S)
    # draw filled glyph via outline polygons approximated
    if ch: d.text((20, 0), chr(ch), font=f, fill=(225, 225, 225), anchor='la')
    for op, args in r.value:
        for i, p in enumerate(args):
            on = (i == len(args) - 1)
            x, y = tf(p)
            if on: d.rectangle((x - 3, y - 3, x + 3, y + 3), fill='red')
            else: d.ellipse((x - 2, y - 2, x + 2, y + 2), fill='blue')
    d.line([(0, tf((0, 0))[1]), (im.width, tf((0, 0))[1])], fill='green'); d.line([(0, tf((0, 700))[1]), (im.width, tf((0, 700))[1])], fill='green')
    ims.append(im)
c = Image.new('RGB', (sum(i.width for i in ims), max(i.height for i in ims)), 'white'); x = 0
for i in ims: c.paste(i, (x, 0)); x += i.width
c.save(out)

"""Libretto Paléologue Poster: a COLRv0 colour font. Layer 0 = the black silhouette (the regular glyph),
layer 1 = a vermilion fill inset by a uniform ink line, so the lithographic outline is part of the font."""
import numpy as np, cv2, potrace, copy
from PIL import Image, ImageDraw
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.basePen import BasePen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib.tables import C_O_L_R_, C_P_A_L_
import trace as T
import pathops

INK_UNITS = 20       # ink line width in font units (~2% of the em, like the approved sheet)
PX = 1.0             # pixels per unit
src = TTFont('dist/LibrettoPaleologue-Regular.ttf')
gs = src.getGlyphSet()

def polys_of(name):
    polys = []
    class Flat(BasePen):
        def _moveTo(s, pt): polys.append([pt])
        def _lineTo(s, pt): polys[-1].append(pt)
        def _qCurveToOne(s, a, b):
            p0 = s._getCurrentPoint()
            for i in range(1, 9):
                t = i / 8; mt = 1 - t
                polys[-1].append((mt*mt*p0[0]+2*mt*t*a[0]+t*t*b[0], mt*mt*p0[1]+2*mt*t*a[1]+t*t*b[1]))
        def _curveToOne(s, a, b, c):
            p0 = s._getCurrentPoint()
            for i in range(1, 13):
                t = i / 12; mt = 1 - t
                polys[-1].append((mt**3*p0[0]+3*mt*mt*t*a[0]+3*mt*t*t*b[0]+t**3*c[0], mt**3*p0[1]+3*mt*mt*t*a[1]+3*mt*t*t*b[1]+t**3*c[1]))
        def _closePath(s): pass
    gs[name].draw(Flat(gs))
    return polys

def inset(name):
    polys = polys_of(name)
    if not polys: return None
    pts = np.concatenate([np.array(p) for p in polys])
    x0, y0 = pts.min(0) - 20; x1, y1 = pts.max(0) + 20
    W, H = int((x1 - x0) * PX) + 1, int((y1 - y0) * PX) + 1
    acc = np.zeros((H, W), np.uint8)
    for p in polys:
        m = Image.new('L', (W, H), 0)
        ImageDraw.Draw(m).polygon([((x - x0) * PX, (y1 - y) * PX) for x, y in p], fill=1)
        acc ^= np.asarray(m)
    up = cv2.resize(acc, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
    dist = cv2.distanceTransform(up, cv2.DIST_L2, cv2.DIST_MASK_PRECISE) / 2 / PX
    bm = dist > INK_UNITS
    if bm.sum() < 50: return None
    path = potrace.Bitmap(~bm).trace(turdsize=20, turnpolicy=4, alphamax=1.1, opticurve=False)
    sc = 1 / (2 * PX)
    def P(pt): return [pt.x * sc + x0, y1 - pt.y * sc]
    return [T.refit(c, P) for c in path]

font = TTFont('dist/LibrettoPaleologue-Regular.ttf')
glyf = font['glyf']; hmtx = font['hmtx']
order = list(font.getGlyphOrder())
layers = {}
new_order = list(order)
from geomutil import to_path
for name in order:
    if name in ('.notdef', 'space', 'nbspace'): continue
    cs = inset(name)
    if not cs: continue
    p = to_path(cs); p.simplify(fix_winding=True)
    # orientation: TT wants outer clockwise -> draw PS-oriented then reverse
    pen = TTGlyphPen(None); cpen = Cu2QuPen(pen, max_err=0.8, reverse_direction=True)
    r = RecordingPen(); p.draw(r)
    # pathops simplify yields outer contours CCW in y-up (PostScript order); verify sign once
    rr = RecordingPen(); rr.value = [(op, tuple((round(x), round(y)) for x, y in args)) for op, args in r.value]
    rr.replay(cpen)
    fname = name + '.fill'
    gl = pen.glyph(); gl.recalcBounds(glyf); glyf[fname] = gl; hmtx[fname] = (hmtx[name][0], gl.xMin)
    new_order.append(fname)
    layers[name] = [(name, 0), (fname, 1)]
font.setGlyphOrder(new_order)
font['maxp'].numGlyphs = len(new_order)
colr = newTable('COLR'); colr.version = 0
colr.ColorLayers = {}
for base, ls in layers.items():
    colr[base] = [C_O_L_R_.LayerRecord(name=g, colorID=c) for g, c in ls]
font['COLR'] = colr
cpal = newTable('CPAL'); cpal.version = 0; cpal.numPaletteEntries = 2
from fontTools.ttLib.tables.C_P_A_L_ import Color
def rgba(h, a=255): return Color(red=int(h[1:3], 16), green=int(h[3:5], 16), blue=int(h[5:7], 16), alpha=a)
cpal.palettes = [[rgba('#16120F'), rgba('#E8641B')],   # 0 ink + vermilion (poster)
                 [rgba('#16120F'), rgba('#F3EBDD')],   # 1 ink + paper
                 [rgba('#103DFF'), rgba('#F3EBDD')]]   # 2 Libretto blue + paper
font['CPAL'] = cpal
name = font['name']
for rec in list(name.names):
    if rec.nameID in (1, 3, 4, 6, 16):
        s = rec.toUnicode()
        s = s.replace('Libretto Paléologue', 'Libretto Paléologue Poster').replace('LibrettoPaleologue', 'LibrettoPaleologuePoster')
        rec.string = s
font.save('dist/LibrettoPaleologuePoster-Regular.ttf')
font.flavor = 'woff2'; font.save('dist/LibrettoPaleologuePoster-Regular.woff2')
print('colour glyphs', len(layers))

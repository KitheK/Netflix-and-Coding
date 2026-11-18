"""Build Libretto Paléologue (TTF + WOFF2) from traced outlines + constructed glyphs."""
import json, math, string, copy
import numpy as np, pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from geomutil import to_path

FAMILY = "Libretto Paléologue"; PSNAME = "LibrettoPaleologue-Regular"
UPM = 1000; CAP = 700; XH = 470
T = json.load(open('work/traced.json'))

# ---------------------------------------------------------------- helpers
def rec_from_path(p):
    r = RecordingPen(); p.draw(r); return r.value
def clean(p):
    p = pathops.Path(p) if not isinstance(p, pathops.Path) else p
    p.simplify(fix_winding=True)
    return p
def traced(name):
    return clean(to_path(T[name]['contours']))
def transform(p, m):
    """m = (a,b,c,d,e,f) affine"""
    q = pathops.Path(); p.draw(TransformPen(q.getPen(), m)); return q
def bounds(p): return p.bounds  # xmin ymin xmax ymax
def union(*ps):
    out = pathops.Path()
    for p in ps:
        if p is None: continue
        p.draw(out.getPen())
    return clean(out)
def contours_of(p):
    """split into individual contours (as separate paths)"""
    r = rec_from_path(p); res = []; cur = None
    for op, args in r:
        if op == 'moveTo': cur = pathops.Path(); pen = cur.getPen(); pen.moveTo(*args)
        elif op == 'lineTo': pen.lineTo(*args)
        elif op == 'curveTo': pen.curveTo(*args)
        elif op == 'qCurveTo': pen.qCurveTo(*args)
        elif op in ('closePath', 'endPath'): pen.closePath(); res.append(cur)
    return res
def shift(p, dx, dy): return transform(p, (1, 0, 0, 1, dx, dy))
def scale_about(p, s, cx, cy): return transform(p, (s, 0, 0, s, cx - s * cx, cy - s * cy))
def rotate180(p):
    x0, y0, x1, y1 = bounds(p); cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return transform(p, (-1, 0, 0, -1, 2 * cx, 2 * cy))
def mirror_x(p):
    x0, y0, x1, y1 = bounds(p); return transform(p, (-1, 0, 0, 1, x0 + x1, 0))
def poly(pts, curves=None):
    """pts: list of ('L',x,y) or ('C',x1,y1,x2,y2,x,y); first is start"""
    p = pathops.Path(); pen = p.getPen(); pen.moveTo(pts[0][1:3])
    for q in pts[1:]:
        if q[0] == 'L': pen.lineTo(q[1:3])
        else: pen.curveTo(q[1:3], q[3:5], q[5:7])
    pen.closePath(); return clean(p)

G = {}
# ---------------------------------------------------------------- traced glyphs
for c in string.ascii_uppercase + string.ascii_lowercase: G[c] = traced(c)
for n in ['zero','one','two','three','four','five','six','seven','eight','nine','ampersand','question','exclam','parenleft','parenright','slash']:
    G[n] = traced(n)
G['S.ss01'] = traced('S.ss01')

# punctuation derived from traced parts
ex = contours_of(G['exclam']); dot = min(ex, key=lambda p: bounds(p)[3])
semi = contours_of(traced('semicolon')); comma = min(semi, key=lambda p: bounds(p)[1]); sdot = max(semi, key=lambda p: bounds(p)[1])
# period: the ! dot sitting on the baseline
x0, y0, x1, y1 = bounds(dot); period = shift(dot, 0, -y0)
G['period'] = period
# comma: tail of ; with its head on the baseline like the period
cx0, cy0, cx1, cy1 = bounds(comma); sx0, sy0, sx1, sy1 = bounds(sdot)
G['comma'] = shift(comma, 0, (y1 - y0) - cy1 + 8)
dh = y1 - y0
G['colon'] = union(period, shift(period, 0, XH - dh))
G['semicolon'] = union(G['comma'], shift(period, (bounds(G['comma'])[0] + bounds(G['comma'])[2]) / 2 - (x0 + x1) / 2, XH - dh))
# curly quotes from the traced ” pair
qa, qb = traced('qr_a'), traced('qr_b')
qtop = max(bounds(qa)[3], bounds(qb)[3])
G['quotedblright'] = shift(union(qa, qb), 0, CAP - qtop)
G['quoteright'] = shift(qa, 0, CAP - bounds(qa)[3])
G['quoteleft'] = shift(rotate180(G['quoteright']), 0, 0)
G['quotedblleft'] = rotate180(G['quotedblright'])


# ---------------------------------------------------------------- constructed glyphs
def wedge(x, ytop, ybot, wtop, wbot):
    """tapered vertical stroke with a slightly cupped Tuscan top"""
    return poly([('L', x - wtop / 2, ytop), ('C', x - wtop / 4, ytop - 14, x + wtop / 4, ytop - 14, x + wtop / 2, ytop),
                 ('L', x + wbot / 2, ybot), ('C', x + wbot / 4, ybot - 6, x - wbot / 4, ybot - 6, x - wbot / 2, ybot)])
G['quotesingle'] = wedge(60, CAP + 10, CAP - 230, 92, 34)
G['quotedbl'] = union(wedge(60, CAP + 10, CAP - 230, 92, 34), wedge(190, CAP + 10, CAP - 230, 92, 34))

def bar(w, yc=300, half_end=62, half_mid=36, notch=16):
    """waisted bar with Tuscan notched (pointed-spur) ends"""
    t, b = yc + half_end, yc - half_end
    sag = (half_end - half_mid) * 4 / 3
    return poly([('L', 0, t), ('C', w * .3, t - sag, w * .7, t - sag, w, t),
                 ('L', w - notch, yc), ('L', w, b),
                 ('C', w * .7, b + sag, w * .3, b + sag, 0, b), ('L', notch, yc)])
G['hyphen'] = bar(250, yc=270)
G['periodcentered'] = shift(period, 0, 300 - dh / 2)
def chevron(x0, w=170, h=340, t=80, yc=260):
    return poly([('L', x0, yc), ('L', x0 + w, yc + h / 2), ('L', x0 + w + t * .35, yc + h / 2 - 8), ('L', x0 + t, yc),
                 ('L', x0 + w + t * .35, yc - h / 2 + 8), ('L', x0 + w, yc - h / 2)])
G['guilsinglleft'] = chevron(0); G['guilsinglright'] = mirror_x(chevron(0))
G['guillemotleft'] = union(chevron(0), chevron(135)); G['guillemotright'] = mirror_x(G['guillemotleft'])
G['endash'] = bar(500, yc=270)
G['emdash'] = bar(940, yc=270)

# accents (built for lowercase; caps versions are raised & reduced)
idot = max(contours_of(G['i']), key=lambda p: bounds(p)[3])
istem = min(contours_of(G['i']), key=lambda p: bounds(p)[3])
G['dotlessi'] = istem
def acute_shape():
    return poly([('L', 0, 0), ('L', 30, -6), ('L', 150, 140), ('C', 165, 160, 140, 192, 112, 178), ('C', 100, 172, 95, 168, 90, 160)])
ACUTE = acute_shape(); GRAVE = mirror_x(ACUTE)
CIRC = poly([('L', 0, 0), ('L', 34, 0), ('L', 100, 90), ('L', 166, 0), ('L', 200, 0), ('L', 125, 150), ('L', 75, 150)])
d0 = bounds(idot); dw = d0[2] - d0[0]
DOT = shift(idot, -d0[0], -d0[1])
DIER = union(DOT, shift(DOT, dw + 50, 0))
ced = rotate180(G['comma']); ced = scale_about(ced, 0.8, 0, 0)
CED = shift(ced, -bounds(ced)[0], -bounds(ced)[3])

def place(base, mark, y, s=1.0, dx=0):
    bx0, by0, bx1, by1 = bounds(base)
    m = scale_about(mark, s, 0, 0); mx0, my0, mx1, my1 = bounds(m)
    return union(base, shift(m, (bx0 + bx1) / 2 - (mx0 + mx1) / 2 + dx, y - my0))
LOWACC_Y = XH + 70; CAPACC_Y = CAP + 55
ACCENTS = {
    'agrave': ('a', GRAVE, 'L'), 'acircumflex': ('a', CIRC, 'L'), 'adieresis': ('a', DIER, 'L'),
    'egrave': ('e', GRAVE, 'L'), 'eacute': ('e', ACUTE, 'L'), 'ecircumflex': ('e', CIRC, 'L'), 'edieresis': ('e', DIER, 'L'),
    'icircumflex': ('dotlessi', CIRC, 'L'), 'idieresis': ('dotlessi', DIER, 'L'),
    'ocircumflex': ('o', CIRC, 'L'), 'odieresis': ('o', DIER, 'L'),
    'ugrave': ('u', GRAVE, 'L'), 'ucircumflex': ('u', CIRC, 'L'), 'udieresis': ('u', DIER, 'L'),
    'ydieresis': ('y', DIER, 'L'), 'aacute': ('a', ACUTE, 'L'), 'oacute': ('o', ACUTE, 'L'), 'uacute': ('u', ACUTE, 'L'), 'iacute': ('dotlessi', ACUTE, 'L'),
    'Agrave': ('A', GRAVE, 'C'), 'Acircumflex': ('A', CIRC, 'C'), 'Eacute': ('E', ACUTE, 'C'), 'Egrave': ('E', GRAVE, 'C'),
    'Ecircumflex': ('E', CIRC, 'C'), 'Edieresis': ('E', DIER, 'C'), 'Icircumflex': ('I', CIRC, 'C'), 'Idieresis': ('I', DIER, 'C'),
    'Ocircumflex': ('O', CIRC, 'C'), 'Ugrave': ('U', GRAVE, 'C'), 'Ucircumflex': ('U', CIRC, 'C'), 'Udieresis': ('U', DIER, 'C'),
}
for name, (base, mark, kind) in ACCENTS.items():
    dx = 0
    if base == 'E': dx = -20
    if base == 'a': dx = 10
    if kind == 'L': G[name] = place(G[base], mark, LOWACC_Y, 1.0, dx)
    else: G[name] = place(G[base], mark, CAPACC_Y, 0.8, dx)
def cedilla(base):
    bx0, by0, bx1, by1 = bounds(G[base]); mx0, my0, mx1, my1 = bounds(CED)
    return union(G[base], shift(CED, (bx0 + bx1) / 2 - (mx0 + mx1) / 2 + 10, 25))
G['ccedilla'] = cedilla('c'); G['Ccedilla'] = cedilla('C')

# ---------------------------------------------------------------- spacing
SB = {  # lsb, rsb in font units
 'A': (8, 8), 'B': (42, 28), 'C': (32, 22), 'D': (42, 32), 'E': (42, 18), 'F': (42, 14), 'G': (32, 38), 'H': (42, 42),
 'I': (42, 42), 'J': (14, 46), 'K': (42, 4), 'L': (42, 8), 'M': (44, 44), 'N': (42, 42), 'O': (32, 32), 'P': (42, 22),
 'Q': (32, 28), 'R': (42, 8), 'S': (26, 26), 'T': (12, 12), 'U': (44, 44), 'V': (6, 6), 'W': (6, 6), 'X': (6, 6),
 'Y': (6, 6), 'Z': (22, 22), 'S.ss01': (22, 22),
 'a': (18, 22), 'b': (26, 16), 'c': (16, 10), 'd': (16, 26), 'e': (16, 12), 'f': (16, 2), 'g': (12, 4), 'h': (26, 22),
 'i': (26, 24), 'j': (2, 24), 'k': (26, 2), 'l': (26, 24), 'm': (26, 22), 'n': (26, 22), 'o': (16, 16), 'p': (26, 16),
 'q': (16, 26), 'r': (26, 2), 's': (16, 16), 't': (4, 8), 'u': (22, 26), 'v': (2, 2), 'w': (2, 2), 'x': (2, 2),
 'y': (2, 2), 'z': (10, 10), 'dotlessi': (26, 24),
 'one': (60, 60), 'ampersand': (24, 16), 'question': (24, 24), 'exclam': (40, 40), 'parenleft': (40, 20), 'parenright': (20, 40),
 'slash': (0, 0), 'period': (36, 36), 'comma': (36, 36), 'colon': (36, 36), 'semicolon': (36, 36),
 'quoteright': (30, 30), 'quoteleft': (30, 30), 'quotedblright': (30, 30), 'quotedblleft': (30, 30),
 'quotesingle': (36, 36), 'periodcentered': (40, 40), 'guilsinglleft': (30, 30), 'guilsinglright': (30, 30), 'guillemotleft': (30, 30), 'guillemotright': (30, 30), 'quotedbl': (36, 36), 'hyphen': (24, 24), 'endash': (0, 0), 'emdash': (30, 30),
}
for d in ['zero','two','three','four','five','six','seven','eight','nine']: SB[d] = (30, 30)
for name, (base, _, _) in ACCENTS.items(): SB.setdefault(name, SB[base])
SB['ccedilla'] = SB['c']; SB['Ccedilla'] = SB['C']

GLYPHS = {}; ADV = {}
for name, p in G.items():
    x0, y0, x1, y1 = bounds(p)
    if name not in SB: raise SystemExit('no SB for ' + name)
    l, r = SB[name]
    if name.endswith('acute') or name.endswith('grave') or name.endswith('circumflex') or name.endswith('dieresis') or name.endswith('cedilla'):
        # keep base advance so marks don't widen spacing
        bname = ACCENTS.get(name, ('c' if name == 'ccedilla' else 'C',))[0]
        bx0, _, bx1, _ = bounds(G[bname]); q = shift(p, l - bx0, 0); ADV[name] = round(bx1 - bx0 + l + r)
    else:
        q = shift(p, l - x0, 0); ADV[name] = round(x1 - x0 + l + r)
    GLYPHS[name] = q
ADV['space'] = 215; ADV['nbspace'] = 215
GLYPHS['space'] = pathops.Path(); GLYPHS['nbspace'] = pathops.Path()

# ---------------------------------------------------------------- kerning (profile based)
def profile(name, step=10):
    """left/right ink extents per y band (font units), None where empty"""
    p = GLYPHS[name]; rec = []
    from fontTools.pens.basePen import BasePen
    polys = []
    class Flat(BasePen):
        def _moveTo(s, pt): polys.append([pt])
        def _lineTo(s, pt): polys[-1].append(pt)
        def _curveToOne(s, a, b, c):
            p0 = s._getCurrentPoint()
            for i in range(1, 9):
                t = i / 8; mt = 1 - t
                polys[-1].append((mt**3*p0[0]+3*mt*mt*t*a[0]+3*mt*t*t*b[0]+t**3*c[0], mt**3*p0[1]+3*mt*mt*t*a[1]+3*mt*t*t*b[1]+t**3*c[1]))
        def _closePath(s): pass
    p.draw(Flat(None))
    ys = np.arange(-250, 950, step); L = np.full(len(ys), np.nan); R = np.full(len(ys), np.nan)
    for poly_ in polys:
        P = np.array(poly_ + [poly_[0]])
        for (xa, ya), (xb, yb) in zip(P[:-1], P[1:]):
            lo, hi = min(ya, yb), max(ya, yb)
            m = (ys >= lo) & (ys < hi)
            if not m.any() or hi == lo: continue
            xs = xa + (ys[m] - ya) * (xb - xa) / (yb - ya)
            L[m] = np.fmin(L[m], xs); R[m] = np.fmax(R[m], xs)
    return ys, L, R
PROF = {}
def gap(a, b, k=0):
    ys, La, Ra = PROF.setdefault(a, profile(a)); _, Lb, Rb = PROF.setdefault(b, profile(b))
    d = (ADV[a] - Ra) + Lb + k
    both = ~np.isnan(d)
    if not both.any(): return None, None
    # visual gap: bands where only one glyph has ink count as "open" (capped)
    full = np.where(np.isnan(d), 260, np.minimum(d, 260))
    band = (ys >= 0) & (ys <= CAP)
    return float(np.nanmin(d)), float(full[band].mean())
ref_min, ref_mean = gap('H', 'H')
_, ref_o = gap('O', 'O')
LEFT = list(string.ascii_uppercase) + ['f', 'r', 'v', 'w', 'y', 'k', 'quoteright', 'quotedblright', 'period', 'comma', 'L', 'D', 'O', 'Q', 'B', 'J', 'U', 'C', 'G', 'S', 'S.ss01', 'E']
RIGHT = list(string.ascii_uppercase) + list('adegoqsuvwycmnprxz') + ['period', 'comma', 'hyphen', 'quoteright', 'quotedblright', 'quoteleft', 'quotedblleft', 'S.ss01']
KERN = {}
for a in dict.fromkeys(LEFT):
    for b in dict.fromkeys(RIGHT):
        mn, mean = gap(a, b)
        if mn is None: continue
        # aim: mean visual gap no wider than a round/round pair, never closer than 18u
        target = ref_o
        k = target - mean
        k = min(k, 0)                # tighten only where the pair reads loose
        k = max(k, -140)
        k = max(k, 34 - mn)          # collision guard: never closer than 34u (may loosen, e.g. R+swash S)
        k = int(round(k / 5) * 5)
        if abs(k) >= 15: KERN[(a, b)] = k
# a few hand values for punctuation after tall overhangs
for a, b, v in [('T', 'period', -90), ('T', 'comma', -90), ('P', 'period', -110), ('P', 'comma', -110), ('F', 'period', -70), ('F', 'comma', -70),
                ('V', 'period', -90), ('W', 'period', -80), ('Y', 'period', -100), ('V', 'comma', -90), ('Y', 'comma', -100), ('L', 'quoteright', -110), ('L', 'quotedblright', -110)]:
    KERN[(a, b)] = min(KERN.get((a, b), 0), v)

# ---------------------------------------------------------------- font assembly
CMAP = {ord(c): c for c in string.ascii_letters}
CMAP.update({0x20: 'space', 0xA0: 'nbspace', ord('0'): 'zero', ord('1'): 'one', ord('2'): 'two', ord('3'): 'three', ord('4'): 'four', ord('5'): 'five',
             ord('6'): 'six', ord('7'): 'seven', ord('8'): 'eight', ord('9'): 'nine', ord('.'): 'period', ord(','): 'comma', ord(':'): 'colon',
             ord(';'): 'semicolon', ord('!'): 'exclam', ord('?'): 'question', ord("'"): 'quotesingle', ord('"'): 'quotedbl', 0x201C: 'quotedblleft',
             0x201D: 'quotedblright', 0x2018: 'quoteleft', 0x2019: 'quoteright', ord('-'): 'hyphen', 0x2013: 'endash', 0x2014: 'emdash',
             ord('&'): 'ampersand', 0xB7: 'periodcentered', 0xAB: 'guillemotleft', 0xBB: 'guillemotright', 0x2039: 'guilsinglleft', 0x203A: 'guilsinglright', ord('('): 'parenleft', ord(')'): 'parenright', ord('/'): 'slash', 0x131: 'dotlessi'})
import unicodedata
for name in list(ACCENTS) + ['ccedilla', 'Ccedilla']:
    from fontTools.agl import toUnicode
    CMAP[ord(toUnicode(name))] = name

FIGS = ['zero','one','two','three','four','five','six','seven','eight','nine']
PUNCT = ['period','comma','colon','semicolon','exclam','question','quotesingle','quotedbl','quoteleft','quoteright','quotedblleft','quotedblright',
         'hyphen','endash','emdash','periodcentered','ampersand','parenleft','parenright','slash','guilsinglleft','guilsinglright','guillemotleft','guillemotright']
first = ['.notdef', 'space', 'nbspace'] + list(string.ascii_uppercase) + ['S.ss01'] + list(string.ascii_lowercase) + ['dotlessi'] + FIGS + PUNCT
order = first + sorted(set(CMAP.values()) - set(first), key=lambda n: (n[0].islower(), n))
ADV['.notdef'] = 500
nd = pathops.Path(); pen = nd.getPen()
for (a, b, c, d) in [(50, 0, 450, 700), (100, 50, 400, 650)]:
    pen.moveTo((a, b)); pen.lineTo((c, b)); pen.lineTo((c, d)); pen.lineTo((a, d)); pen.closePath()
GLYPHS['.notdef'] = clean(nd) if False else nd

def orient(p):
    """PostScript direction: outer contours counter-clockwise (positive area)."""
    cs = contours_of(p) if len(rec_from_path(p)) else []
    out = []
    for i, c in enumerate(cs):
        ap = AreaPen(); c.draw(ap)
        # depth = number of other contours containing this one's first point
        r = rec_from_path(c); pt = r[0][1][0]
        depth = sum(1 for j, o in enumerate(cs) if j != i and o.contains(pt))
        want_ccw = depth % 2 == 0
        if (ap.value > 0) != want_ccw:
            c = pathops.Path(c); c.reverse()
        out.append(c)
    return out

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(order)
fb.setupCharacterMap(CMAP)
glyf = {}
for name in order:
    pen = TTGlyphPen(None)
    if name in GLYPHS and len(rec_from_path(GLYPHS[name])):
        cs = orient(GLYPHS[name]) if name != '.notdef' else contours_of(GLYPHS[name])
        cpen = Cu2QuPen(pen, max_err=0.8, reverse_direction=True)
        for c in cs:
            r = RecordingPen(); c.draw(r)
            rr = RecordingPen()
            # round coordinates
            for op, args in r.value:
                rr.value.append((op, tuple((round(x), round(y)) for x, y in args)))
            rr.replay(cpen)
    glyf[name] = pen.glyph()
fb.setupGlyf(glyf)
metrics = {}
for name in order:
    g = glyf[name]
    g.recalcBounds(fb.font['glyf'] if 'glyf' in fb.font else None) if hasattr(g, 'recalcBounds') and False else None
    metrics[name] = (ADV[name], getattr(g, 'xMin', 0) if g.numberOfContours else 0)
fb.setupHorizontalMetrics(metrics)
ASC, DESC = 950, -260
fb.setupHorizontalHeader(ascent=ASC, descent=DESC, lineGap=0)
fb.setupNameTable({
    'familyName': FAMILY, 'styleName': 'Regular', 'uniqueFontIdentifier': f'{PSNAME}-1.000',
    'fullName': f'{FAMILY} Regular', 'psName': PSNAME, 'version': 'Version 1.000',
    'copyright': 'Copyright 2026 Kithe Kisia', 'manufacturer': 'Kithe Kisia', 'designer': 'Kithe Kisia',
    'description': 'Display face after the hand-lettered swash S of Jean de Paléologue (PAL), "Standard" poster, c.1900; lowercase after E. Mulier.',
    'licenseDescription': 'This Font Software is licensed under the SIL Open Font License, Version 1.1.',
    'licenseInfoURL': 'https://openfontlicense.org',
})
fb.setupOS2(sTypoAscender=ASC, sTypoDescender=DESC, sTypoLineGap=0, usWinAscent=1000, usWinDescent=300,
            sxHeight=XH, sCapHeight=CAP, achVendID='KTHK', fsType=0, usWeightClass=400, fsSelection=0x40 | 0x80, version=4)
fb.setupPost()
fb.setupDummyDSIG() if False else None
font = fb.font
# recompute win metrics from real bounds
font['head'].created = font['head'].modified
ymax = max(getattr(glyf[n], 'yMax', 0) for n in order); ymin = min(getattr(glyf[n], 'yMin', 0) for n in order)
font['OS/2'].usWinAscent = max(ASC, int(ymax) + 10); font['OS/2'].usWinDescent = max(-DESC, int(-ymin) + 10)

# features
pairs = '\n'.join(f'    pos {a} {b} {v};' for (a, b), v in sorted(KERN.items()))
fea = f"""
languagesystem DFLT dflt;
languagesystem latn dflt;
feature kern {{
{pairs}
}} kern;
feature ss01 {{
    featureNames {{ name "Poster swash S (PAL Standard)"; }};
    sub S by S.ss01;
}} ss01;
feature salt {{
    sub S by S.ss01;
}} salt;
"""
addOpenTypeFeaturesFromString(font, fea)
import os
os.makedirs('dist', exist_ok=True)
font.save('dist/LibrettoPaleologue-Regular.ttf')
font.flavor = 'woff2'; font.save('dist/LibrettoPaleologue-Regular.woff2')
json.dump({'kern_pairs': len(KERN), 'ref': [ref_min, ref_mean, ref_o], 'adv': ADV}, open('work/build-info.json', 'w'), indent=0)
print('glyphs', len(order), 'kern pairs', len(KERN), 'yMax', ymax, 'yMin', ymin)

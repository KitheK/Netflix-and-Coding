"""Trace glyph silhouettes from the specimen sheets into font-unit cubic contours.
Output: work/traced.json  {glyph: {"contours": [[["M",x,y],["C",x1,y1,x2,y2,x,y],["L",x,y]...]], "bbox":...}}
"""
import numpy as np, cv2, json, potrace
from PIL import Image
from segment import inkmap, components

UP = 8          # upscale factor before tracing
SIGMA = 7.0     # gaussian blur at the upscaled resolution (px) — irons out JPEG wobble
CAP = 700

def group(comps, nrows):
    """rows by y, then merge small components that overlap a big one in x (dots, comma tails)"""
    big = [c for c in comps if c['area'] > 2500]
    small = [c for c in comps if c['area'] <= 2500]
    ys = np.array([c['y'] + c['h'] / 2 for c in big])
    order = np.argsort(ys); gaps = np.diff(ys[order])
    cuts = np.sort(np.argsort(gaps)[-(nrows - 1):]) if nrows > 1 else []
    rows = []; start = 0
    for ct in list(cuts) + [len(order) - 1]:
        rows.append([big[i] for i in order[start:ct + 1]]); start = ct + 1
    glyphs = []
    for r in rows:
        r = [[c] for c in sorted(r, key=lambda c: c['x'])]
        glyphs.append(r)
    for s in small:
        cx = s['x'] + s['w'] / 2; cy = s['y'] + s['h'] / 2
        best = None
        for ri, r in enumerate(glyphs):
            for g in r:
                c = g[0]
                if c['x'] - 4 <= cx <= c['x'] + c['w'] + 4 and abs(cy - (c['y'] + c['h'] / 2)) < 130:
                    best = g
        if best is not None: best.append(s)
        else:
            # standalone small mark -> its own glyph in nearest row
            ri = int(np.argmin([abs(cy - np.mean([g[0]['y'] + g[0]['h'] / 2 for g in r])) for r in glyphs]))
            glyphs[ri].append([s]); glyphs[ri].sort(key=lambda g: g[0]['x'])
    return glyphs

def trace_mask(soft, scale, ox, oy, base):
    """soft: float map crop (ink-ness). returns contours in font units."""
    h, w = soft.shape
    big = cv2.resize(soft, (w * UP, h * UP), interpolation=cv2.INTER_LANCZOS4)
    big = cv2.GaussianBlur(big, (0, 0), SIGMA)
    bm = big > 0.5
    path = potrace.Bitmap(~bm).trace(turdsize=200, turnpolicy=4, alphamax=1.1, opticurve=True, opttolerance=3.5)
    def P(pt):
        x = (pt.x / UP + ox) ; y = (pt.y / UP + oy)
        return [round((x) * scale, 1), round((base - y) * scale, 1)]
    out = []
    for curve in path:
        out.append(refit(curve, P))
    return out

TOL = 3.2   # font units
def _sample_bez(p0, c1, c2, p3, n):
    t = np.linspace(0, 1, n + 1)[1:, None]; mt = 1 - t
    return mt**3*p0 + 3*mt*mt*t*c1 + 3*mt*t*t*c2 + t**3*p3

def smooth_chain(c, sigma=4.5):
    n = len(c)
    if n < 7: return c
    r = int(sigma * 2); k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    pad = np.r_[np.repeat(c[:1], r, 0), c, np.repeat(c[-1:], r, 0)]
    out = np.stack([np.convolve(pad[:, i], k, 'valid') for i in (0, 1)], 1)
    # pin the ends, blend smoothing in over the first/last r points so corners stay sharp
    w = np.minimum(1, np.minimum(np.arange(n), np.arange(n)[::-1]) / r)[:, None]
    return c * (1 - w) + out * w

def refit(curve, P):
    from fitcurves import fit_chain, unit
    pts = [np.array(P(curve.start_point))]; corner = [False]
    cur = pts[0]
    for s in curve.segments:
        if s.is_corner:
            c = np.array(P(s.c)); e = np.array(P(s.end_point))
            for q in np.linspace(cur, c, max(2, int(np.linalg.norm(c - cur) / 2)) + 1)[1:]:
                pts.append(q); corner.append(False)
            corner[-1] = True
            for q in np.linspace(c, e, max(2, int(np.linalg.norm(e - c) / 2)) + 1)[1:]:
                pts.append(q); corner.append(False)
        else:
            c1, c2, e = (np.array(P(x)) for x in (s.c1, s.c2, s.end_point))
            L = np.linalg.norm(c1 - cur) + np.linalg.norm(c2 - c1) + np.linalg.norm(e - c2)
            for q in _sample_bez(cur, c1, c2, e, max(4, int(L / 2))):
                pts.append(q); corner.append(False)
        cur = pts[-1]
    pts = np.array(pts[:-1]); corner = np.array(corner[:-1])  # last == first
    n = len(pts)
    # extrema split points (local max/min in x or y with some prominence)
    W = 18; brk = set(np.where(corner)[0])
    ext = {}
    for ax in (0, 1):
        v = pts[:, ax]
        for i in range(n):
            idx = (np.arange(i - W, i + W + 1)) % n
            w = v[idx]
            if (v[i] >= w.max() or v[i] <= w.min()) and (w.max() - w.min()) > 7:
                # avoid flat runs: require the extreme to be unique-ish
                if not any(((i - j) % n) < 6 or ((j - i) % n) < 6 for j in brk):
                    brk.add(i); ext[i] = ax
    if len(brk) < 4:
        for ax, f in ((1, np.argmax), (1, np.argmin), (0, np.argmax), (0, np.argmin)):
            i = int(f(pts[:, ax]))
            if i not in brk: brk.add(i); ext[i] = ax
    brk = sorted(brk)
    # split any overly long span so no single cubic covers > 1/3 of a loop
    out = []
    for a, b in zip(brk, brk[1:] + [brk[0] + n]):
        out.append(a)
        if b - a > n / 3: out.append((a + (b - a) // 2) % n)
    brk = sorted(set(out))
    segs = []
    for a, b in zip(brk, brk[1:] + [brk[0] + n]):
        chain = pts[np.arange(a, b + 1) % n]
        segs.append((a % n, b % n, chain))
    def tangent(i, forward):
        if corner[i]: return None
        if i in ext:
            # horizontal tangent at y-extreme, vertical at x-extreme
            d = pts[(i + 3) % n] - pts[(i - 3) % n]
            t = np.array([np.sign(d[0]) or 1.0, 0.0]) if ext[i] == 1 else np.array([0.0, np.sign(d[1]) or 1.0])
        else:
            t = unit(pts[(i + 4) % n] - pts[(i - 4) % n])
        return t if forward else -t
    from fitcurves import fit
    cmds = [["M"] + [round(float(x), 1) for x in pts[brk[0]]]]
    for a, b, chain in segs:
        chain = smooth_chain(chain)
        t1 = tangent(a, True); t2 = tangent(b, False)
        k = min(4, len(chain) - 1)
        if t1 is None: t1 = unit(chain[k] - chain[0])
        if t2 is None: t2 = unit(chain[-1 - k] - chain[-1])
        straight = np.max(np.abs((lambda d,u: d[:,0]*u[1]-d[:,1]*u[0])(chain - chain[0], unit(chain[-1] - chain[0])))) < 1.4 if len(chain) > 2 else True
        if straight:
            cmds.append(["L"] + [round(float(x), 1) for x in chain[-1]]); continue
        for c in fit(chain, t1, t2, TOL):
            cmds.append(["C"] + [round(float(x), 1) for x in np.r_[c[1], c[2], c[3]]])
    return unkink(cmds)

KINK = 32  # degrees: joints flatter than this are made smooth (G1); sharper ones stay corners
def unkink(cmds):
    n = len(cmds) - 1                      # segments 1..n, node k = end of segment k (node n == start)
    ends = [np.array(c[-2:], float) for c in cmds]
    for k in range(1, n + 1):
        a = cmds[k]; b = cmds[k % n + 1]   # segment ending at node k, and the next one
        node = ends[k]
        if a[0] != 'C' and b[0] != 'C': continue
        vin = node - (np.array(a[3:5]) if a[0] == 'C' else ends[k - 1])
        vout = (np.array(b[1:3]) if b[0] == 'C' else ends[k % n + 1]) - node
        li, lo = np.linalg.norm(vin), np.linalg.norm(vout)
        if li < 1e-6 or lo < 1e-6: continue
        ang = np.degrees(np.arccos(np.clip(np.dot(vin, vout) / li / lo, -1, 1)))
        if ang < 0.5 or ang > KINK: continue
        if a[0] == 'C' and b[0] == 'C': d = vin / li + vout / lo
        elif a[0] == 'C': d = vout                # keep the straight side, bend the curve handle
        else: d = vin
        d = d / np.linalg.norm(d)
        if a[0] == 'C': a[3:5] = [round(float(x), 1) for x in node - d * li]
        if b[0] == 'C': b[1:3] = [round(float(x), 1) for x in node + d * lo]
    return cmds

def extract(path, mode, nrows, names, row_metric):
    ink = inkmap(path, mode)
    lab, comps = components(ink)
    rows = group(comps, nrows)
    flat = [g for r in rows for g in r]
    assert len(flat) == len(names), (path, len(flat), len(names), [[ (c['x'],c['y']) for c in g] for g in flat])
    res = {}
    i = 0
    for ri, r in enumerate(rows):
        rnames = names[i:i + len(r)]; i += len(r)
        base, scale = row_metric(ri, r, rnames)
        for nm, g in zip(rnames, r):
            x0 = min(c['x'] for c in g) - 6; y0 = min(c['y'] for c in g) - 6
            x1 = max(c['x'] + c['w'] for c in g) + 6; y1 = max(c['y'] + c['h'] for c in g) + 6
            own = np.isin(lab, [c['id'] for c in g]).astype(np.uint8)
            own = cv2.dilate(own, np.ones((7, 7), np.uint8))
            soft = (ink * own)[y0:y1, x0:x1].astype(np.float32)
            res[nm] = dict(contours=trace_mask(soft, scale, x0, y0, base), row=ri)
    return res, rows

def med(v): return float(np.median(v))

if __name__ == '__main__':
    import string
    out = {}; info = {}
    # ---- caps
    caps = list(string.ascii_uppercase)
    def capmetric(ri, r, nm):
        flat = [g[0] for g, n in zip(r, nm) if n in 'EFHIKLMNPRTUVWXYZBDA']
        base = med([c['y'] + c['h'] for c in flat]); top = med([c['y'] for c in flat])
        info[f'caps_row{ri}'] = dict(base=base, top=top, cap_px=base - top)
        return base, CAP / (base - top)
    o, _ = extract('work/sheet-caps.jpg', 'paper', 3, caps, capmetric); out.update(o)
    # ---- lowercase: scale so x-height/stem relation is preserved; baseline from non-descenders
    low = list(string.ascii_lowercase)
    LOWSCALE = {}
    def lowmetric(ri, r, nm):
        nodesc = [g[0] for g, n in zip(r, nm) if n not in 'gjpqy']
        xl = [g[0] for g, n in zip(r, nm) if n in 'acemnorsuvwxz']
        asc = [g[0] for g, n in zip(r, nm) if n in 'bdhkl']
        base = med([c['y'] + c['h'] for c in nodesc]); xtop = med([c['y'] for c in xl])
        d = dict(base=base, xh_px=base - xtop)
        if asc: d['asc_px'] = base - med([c['y'] for c in asc])
        info[f'lower_row{ri}'] = d
        # x-height fixed at 470 units (row 2 has no ascenders, so use x-height as the common ruler)
        return base, 470 / (base - xtop)
    o, _ = extract('work/sheet-lower.jpg', 'paper', 2, low, lowmetric); out.update(o)
    # ---- figures + punctuation
    figs = ['zero','one','two','three','four','five','six','seven','eight','nine',
            'ampersand','question','exclam','parenleft','parenright','slash','qr_a','qr_b','semicolon']
    fscale = {}
    def figmetric(ri, r, nm):
        if ri == 0:
            base = med([g[0]['y'] + g[0]['h'] for g in r]); top = med([g[0]['y'] for g in r])
            fscale['s'] = CAP / (base - top); info['fig_row0'] = dict(base=base, top=top)
            return base, fscale['s']
        # row 2: baseline from the dots of ? and !
        dots = [max(c['y'] + c['h'] for c in g) for g, n in zip(r, nm) if n in ('question', 'exclam')]
        base = med(dots); info['fig_row1'] = dict(base=base)
        return base, fscale['s']
    o, _ = extract('work/sheet-figs.jpg', 'paper', 2, figs, figmetric); out.update(o)
    # ---- poster swash S (ss01)
    ink = inkmap('work/poster-standard.png', 'poster')
    lab, comps = components(ink, 400)
    S = max([c for c in comps if c['x'] < 200], key=lambda c: c['area'])
    own = cv2.dilate((lab == S['id']).astype(np.uint8), np.ones((5, 5), np.uint8))
    x0, y0 = S['x'] - 6, S['y'] - 6; x1, y1 = S['x'] + S['w'] + 6, S['y'] + S['h'] + 6
    soft = (ink * own)[y0:y1, x0:x1].astype(np.float32)
    # scale: whole swash S height -> cap height + overshoots (720 incl. the hanging spur)
    sc = 760 / S['h']; base = S['y'] + S['h'] - 40 / sc
    out['S.ss01'] = dict(contours=trace_mask(soft, sc, x0, y0, base), row=-1)
    info['posterS'] = S
    json.dump(out, open('work/traced.json', 'w'))
    json.dump(info, open('work/trace-info.json', 'w'), indent=1)
    print(json.dumps(info, indent=1)); print(len(out), 'glyphs')

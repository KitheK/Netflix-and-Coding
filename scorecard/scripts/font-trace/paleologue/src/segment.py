"""Segment glyph silhouettes (fill + outline as one solid) from specimen sheets."""
import numpy as np, cv2, json, sys
from PIL import Image

def inkmap(path, mode='paper'):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    if mode == 'paper':
        # paper colour estimated from the border
        b = np.concatenate([a[:8].reshape(-1,3), a[-8:].reshape(-1,3), a[:, :8].reshape(-1,3), a[:, -8:].reshape(-1,3)])
        paper = np.median(b, 0)
        d = np.sqrt(((a - paper) ** 2).sum(-1))
        return np.clip((d - 30) / 90, 0, 1)
    else:  # poster on green ground: orange (R>>G) or dark ink
        R, G, B = a[..., 0], a[..., 1], a[..., 2]
        V = a.max(-1)
        s1 = np.clip((R - G - 15) / 50, 0, 1)
        s2 = np.clip((130 - V) / 50, 0, 1)
        return np.maximum(s1, s2)

def components(ink, minarea=40):
    m = (ink > 0.5).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    comps = []
    for i in range(1, n):
        x, y, w, h, area = st[i]
        if area < minarea: continue
        comps.append(dict(id=i, x=int(x), y=int(y), w=int(w), h=int(h), area=int(area)))
    return lab, comps

def rows(comps, nrows):
    big = sorted([c for c in comps if c['h'] > 25], key=lambda c: c['y'] + c['h'] / 2)
    ys = np.array([c['y'] + c['h'] / 2 for c in big])
    # k-means 1D
    cent = np.quantile(ys, np.linspace(0.1, 0.9, nrows))
    for _ in range(20):
        lab = np.argmin(abs(ys[:, None] - cent[None]), 1)
        cent = np.array([ys[lab == k].mean() for k in range(nrows)])
    return big, lab

if __name__ == '__main__':
    path, mode, nrows = sys.argv[1], sys.argv[2], int(sys.argv[3])
    ink = inkmap(path, mode)
    lab, comps = components(ink)
    for c in sorted(comps, key=lambda c: (c['y'] // 150, c['x'])):
        print(c)

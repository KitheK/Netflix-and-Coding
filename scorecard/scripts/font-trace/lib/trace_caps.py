"""Trace capitals A–Z from a single specimen sheet (3 rows × ~9 letters)."""
from __future__ import annotations

import json
import string
import sys
from pathlib import Path

import cv2
import numpy as np
import potrace
from PIL import Image

ROOT = Path(__file__).resolve().parent
PAL_SRC = ROOT.parent / "paleologue" / "src"
sys.path.insert(0, str(PAL_SRC))

from fitcurves import fit  # noqa: E402
from segment import components, inkmap  # noqa: E402

UP = 8
SIGMA = 7.0
CAP = 700
TOL = 3.2
KINK = 32


def group(comps, nrows):
    big = [c for c in comps if c["area"] > 2500]
    ys = np.array([c["y"] + c["h"] / 2 for c in big])
    order = np.argsort(ys)
    gaps = np.diff(ys[order])
    cuts = np.sort(np.argsort(gaps)[-(nrows - 1) :]) if nrows > 1 else []
    rows = []
    start = 0
    for ct in list(cuts) + [len(order) - 1]:
        rows.append([big[i] for i in order[start : ct + 1]])
        start = ct + 1
    glyphs = []
    for r in rows:
        glyphs.append([[c] for c in sorted(r, key=lambda c: c["x"])])
    flat = [g for r in glyphs for g in r]
    return glyphs, flat


def trace_mask(soft, scale, ox, oy, base):
    h, w = soft.shape
    big = cv2.resize(soft, (w * UP, h * UP), interpolation=cv2.INTER_LANCZOS4)
    big = cv2.GaussianBlur(big, (0, 0), SIGMA)
    bm = big > 0.5
    path = potrace.Bitmap(~bm).trace(turdsize=200, turnpolicy=4, alphamax=1.1, opticurve=True, opttolerance=3.5)

    def P(pt):
        x = pt.x / UP + ox
        y = pt.y / UP + oy
        return [round(x * scale, 1), round((base - y) * scale, 1)]

    return [refit(curve, P) for curve in path]


def refit(curve, P):
    from fitcurves import fit as fit_chain, unit

    pts = [np.array(P(curve.start_point))]
    corner = [False]
    cur = pts[0]
    for s in curve.segments:
        if s.is_corner:
            c = np.array(P(s.c))
            e = np.array(P(s.end_point))
            for q in np.linspace(cur, c, max(2, int(np.linalg.norm(c - cur) / 2)) + 1)[1:]:
                pts.append(q)
                corner.append(False)
            corner[-1] = True
            for q in np.linspace(c, e, max(2, int(np.linalg.norm(e - c) / 2)) + 1)[1:]:
                pts.append(q)
                corner.append(False)
        else:
            c1, c2, e = (np.array(P(x)) for x in (s.c1, s.c2, s.end_point))
            L = np.linalg.norm(c1 - cur) + np.linalg.norm(c2 - c1) + np.linalg.norm(e - c2)
            for q in _sample_bez(cur, c1, c2, e, max(4, int(L / 2))):
                pts.append(q)
                corner.append(False)
        cur = pts[-1]
    pts = np.array(pts[:-1])
    corner = np.array(corner[:-1])
    n = len(pts)
    brk = set(np.where(corner)[0])
    for ax in (0, 1):
        v = pts[:, ax]
        for i in range(n):
            idx = (np.arange(i - 18, i + 19)) % n
            w = v[idx]
            if (v[i] >= w.max() or v[i] <= w.min()) and (w.max() - w.min()) > 7:
                if not any(((i - j) % n) < 6 or ((j - i) % n) < 6 for j in brk):
                    brk.add(i)
    if len(brk) < 4:
        for ax, f in ((1, np.argmax), (1, np.argmin), (0, np.argmax), (0, np.argmin)):
            i = int(f(pts[:, ax]))
            if i not in brk:
                brk.add(i)
    brk = sorted(brk)
    segs = []
    for a, b in zip(brk, brk[1:] + [brk[0] + n]):
        chain = pts[np.arange(a, b + 1) % n]
        segs.append((a % n, b % n, chain))

    def tangent(i, forward):
        if corner[i]:
            return None
        d = pts[(i + 4) % n] - pts[(i - 4) % n]
        t = unit(d)
        return t if forward else -t

    cmds = [["M"] + [round(float(x), 1) for x in pts[brk[0]]]]
    for a, b, chain in segs:
        t1 = tangent(a, True)
        t2 = tangent(b, False)
        k = min(4, len(chain) - 1)
        if t1 is None:
            t1 = unit(chain[k] - chain[0])
        if t2 is None:
            t2 = unit(chain[-1 - k] - chain[-1])
        for c in fit(chain, t1, t2, TOL):
            cmds.append(["C"] + [round(float(x), 1) for x in np.r_[c[1], c[2], c[3]]])
    return cmds


def _sample_bez(p0, c1, c2, p3, n):
    t = np.linspace(0, 1, n + 1)[1:, None]
    mt = 1 - t
    return mt**3 * p0 + 3 * mt**2 * t * c1 + 3 * mt * t**2 * c2 + t**3 * p3


def trace_caps_sheet(reference: Path, out_json: Path, nrows: int = 3) -> dict:
    caps = list(string.ascii_uppercase)
    ink = inkmap(str(reference), "paper")
    lab, comps = components(ink)
    glyphs, flat = group(comps, nrows)
    if len(flat) != len(caps):
        raise SystemExit(f"Expected {len(caps)} glyphs, segmented {len(flat)} — adjust rows or crop the sheet")

    def med(v):
        return float(np.median(v))

    out = {}
    i = 0
    for ri, r in enumerate(glyphs):
        rnames = caps[i : i + len(r)]
        i += len(r)
        flat_letters = [g[0] for g, n in zip(r, rnames) if n in "EFHIKLMNPRTUVWXYZBDA"]
        base = med([c["y"] + c["h"] for c in flat_letters])
        scale = CAP / (base - med([c["y"] for c in flat_letters]))
        for nm, g in zip(rnames, r):
            comps_g = [c for part in g for c in (part if isinstance(part, list) else [part])]
            x0 = min(c["x"] for c in comps_g) - 6
            y0 = min(c["y"] for c in comps_g) - 6
            x1 = max(c["x"] + c["w"] for c in comps_g) + 6
            y1 = max(c["y"] + c["h"] for c in comps_g) + 6
            own = np.isin(lab, [c["id"] for c in comps_g]).astype(np.uint8)
            own = cv2.dilate(own, np.ones((7, 7), np.uint8))
            soft = (ink * own)[y0:y1, x0:x1].astype(np.float32)
            out[nm] = {"contours": trace_mask(soft, scale, x0, y0, base), "row": ri}

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(out, indent=1))
    return out


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("reference", type=Path)
    ap.add_argument("-o", "--out", type=Path, default=Path("traced.json"))
    ap.add_argument("--rows", type=int, default=3)
    args = ap.parse_args()
    trace_caps_sheet(args.reference, args.out, args.rows)
    print(f"Wrote {args.out}")
"""Schneider (1990) least-squares cubic fitting, used to refit potrace output with
far fewer nodes while keeping potrace's corner decisions."""
import numpy as np

def bez(ctrl, t):
    t = np.asarray(t)[:, None]; mt = 1 - t
    return mt**3*ctrl[0] + 3*mt*mt*t*ctrl[1] + 3*mt*t*t*ctrl[2] + t**3*ctrl[3]
def bez1(ctrl, t):
    t = np.asarray(t)[:, None]; mt = 1 - t
    return 3*mt*mt*(ctrl[1]-ctrl[0]) + 6*mt*t*(ctrl[2]-ctrl[1]) + 3*t*t*(ctrl[3]-ctrl[2])
def bez2(ctrl, t):
    t = np.asarray(t)[:, None]
    return 6*(1-t)*(ctrl[2]-2*ctrl[1]+ctrl[0]) + 6*t*(ctrl[3]-2*ctrl[2]+ctrl[1])

def chord_params(P):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    return d / d[-1] if d[-1] > 0 else np.linspace(0, 1, len(P))

def generate(P, u, t1, t2):
    A1 = np.outer(3*(1-u)**2*u, t1); A2 = np.outer(3*(1-u)*u**2, t2)
    C = np.zeros((2, 2)); X = np.zeros(2)
    tmp = P - bez(np.array([P[0], P[0], P[-1], P[-1]]), u)
    C[0, 0] = (A1*A1).sum(); C[0, 1] = C[1, 0] = (A1*A2).sum(); C[1, 1] = (A2*A2).sum()
    X[0] = (A1*tmp).sum(); X[1] = (A2*tmp).sum()
    det = C[0, 0]*C[1, 1] - C[0, 1]**2
    seg = np.linalg.norm(P[-1] - P[0])
    if abs(det) > 1e-12:
        a1 = (X[0]*C[1, 1] - X[1]*C[0, 1]) / det; a2 = (C[0, 0]*X[1] - C[0, 1]*X[0]) / det
    else: a1 = a2 = seg / 3
    eps = 1e-6 * seg
    if a1 < eps or a2 < eps or a1 > seg * 1.2 or a2 > seg * 1.2: a1 = a2 = seg / 3
    return np.array([P[0], P[0] + t1*a1, P[-1] + t2*a2, P[-1]])

def reparam(ctrl, P, u):
    d = bez(ctrl, u) - P; d1 = bez1(ctrl, u); d2 = bez2(ctrl, u)
    num = (d*d1).sum(1); den = (d1*d1).sum(1) + (d*d2).sum(1)
    with np.errstate(divide='ignore', invalid='ignore'):
        nu = np.where(np.abs(den) > 1e-12, u - num/den, u)
    nu = np.clip(nu, 0, 1); nu[0] = 0; nu[-1] = 1
    return np.maximum.accumulate(nu)

def maxerr(ctrl, P, u):
    d = np.linalg.norm(bez(ctrl, u) - P, axis=1); i = int(np.argmax(d)); return d[i], i

def unit(v):
    n = np.linalg.norm(v); return v / n if n > 1e-9 else v

def fit(P, t1, t2, tol):
    if len(P) == 2:
        dist = np.linalg.norm(P[1]-P[0]) / 3
        return [np.array([P[0], P[0]+t1*dist, P[1]+t2*dist, P[1]])]
    u = chord_params(P)
    ctrl = generate(P, u, t1, t2); err, split = maxerr(ctrl, P, u)
    if err < tol: return [ctrl]
    if err < tol * 4:
        for _ in range(20):
            u = reparam(ctrl, P, u); ctrl = generate(P, u, t1, t2); err, split = maxerr(ctrl, P, u)
            if err < tol: return [ctrl]
    split = min(max(split, 1), len(P) - 2)
    tc = unit(P[split-1] - P[split+1])
    return fit(P[:split+1], t1, tc, tol) + fit(P[split:], -tc, t2, tol)

def fit_chain(P, tol, closed_smooth=False):
    """P: (n,2) polyline between two corners (inclusive). returns list of cubic ctrl arrays"""
    P = np.asarray(P, float)
    # drop duplicates
    keep = np.r_[True, np.linalg.norm(np.diff(P, axis=0), axis=1) > 1e-6]; P = P[keep]
    if len(P) < 2: return []
    k = min(4, len(P) - 1)
    t1 = unit(P[k] - P[0]); t2 = unit(P[-1-k] - P[-1])
    return fit(P, t1, t2, tol)

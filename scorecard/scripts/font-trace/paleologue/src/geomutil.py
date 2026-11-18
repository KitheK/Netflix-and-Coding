import pathops, json
def to_path(contours):
    p = pathops.Path(); pen = p.getPen()
    for c in contours:
        for cmd in c:
            if cmd[0] == 'M': pen.moveTo(tuple(cmd[1:3]))
            elif cmd[0] == 'L': pen.lineTo(tuple(cmd[1:3]))
            else: pen.curveTo(tuple(cmd[1:3]), tuple(cmd[3:5]), tuple(cmd[5:7]))
        pen.closePath()
    return p
def raster(contours, scale=0.5, pad=20):
    from PIL import Image, ImageDraw
    from fontTools.pens.recordingPen import RecordingPen
    import numpy as np
    p = to_path(contours); p.simplify()
    xmin, ymin, xmax, ymax = p.bounds
    W = int((xmax - xmin) * scale) + 2 * pad; H = int((ymax - ymin) * scale) + 2 * pad
    from fontTools.pens.basePen import BasePen
    polys = []
    class Flat(BasePen):
        def _moveTo(s, pt): polys.append([pt])
        def _lineTo(s, pt): polys[-1].append(pt)
        def _curveToOne(s, a, b, c):
            p0 = s._getCurrentPoint()
            for i in range(1, 13):
                t = i / 12; mt = 1 - t
                polys[-1].append((mt**3*p0[0]+3*mt*mt*t*a[0]+3*mt*t*t*b[0]+t**3*c[0], mt**3*p0[1]+3*mt*mt*t*a[1]+3*mt*t*t*b[1]+t**3*c[1]))
        def _closePath(s): pass
    p.draw(Flat(None))
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    # even-odd ok after simplify
    import numpy as np
    acc = np.zeros((H, W), np.uint8)
    for poly in polys:
        m = Image.new('L', (W, H), 0)
        ImageDraw.Draw(m).polygon([((x - xmin) * scale + pad, H - ((y - ymin) * scale + pad)) for x, y in poly], fill=1)
        acc ^= np.asarray(m)
    return acc, (xmin, ymin, scale, pad, H)

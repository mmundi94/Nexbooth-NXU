"""Head-local accessories (face center = 0,0; face is about 110 units wide; forehead/hairline at y = -50;
eyes at (+-23, 6); nose at (0, 24); mouth top at (0, 30)). The same drawings dress the alpaca
and are used as face-tracked lens items on people."""
import math, random
from kit import *
from alpaca import santa_hat, antlers, glasses, EAR_O, EAR_I

ORANGE = "#F28C28"; ORANGE_S = "#CF6D12"; ORANGE_L = "#FFB066"
PURPLE = "#6E4BAA"; PURPLE_S = "#4D3282"
BLACK = "#2E2A33"; BLACK_S = "#1B1820"
PINK = "#FF8FB3"; PINK_S = "#E2668E"
CREAM = "#FFF6E8"; CREAM_S = "#E9DCC6"
LEAF_COLORS = [("#E2552C", "#B83E1B"), ("#F28C28", "#CF6D12"), ("#F2BE32", "#D29A16"), ("#B8542A", "#8F3E1C")]


def star_path(cx, cy, R, r, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        rad = R if i % 2 == 0 else r
        a = math.radians(rot + i * 180 / n)
        pts.append(f"{'M' if i == 0 else 'L'}{f(cx + rad*math.cos(a))},{f(cy + rad*math.sin(a))}")
    return " ".join(pts) + " Z"


def maple(cx, cy, s, rot, color, shade):
    """A simple maple leaf centered at cx,cy with size s."""
    pts = [(0, -1), (0.16, -0.62), (0.45, -0.78), (0.38, -0.36), (0.86, -0.42), (0.62, -0.08), (0.8, 0.1),
           (0.3, 0.2), (0.34, 0.5), (0, 0.36), (-0.34, 0.5), (-0.3, 0.2), (-0.8, 0.1), (-0.62, -0.08),
           (-0.86, -0.42), (-0.38, -0.36), (-0.45, -0.78), (-0.16, -0.62)]
    d = "M" + " L".join(f"{f(x*s)},{f(y*s)}" for x, y in pts) + " Z"
    return (f'<g transform="translate({f(cx)} {f(cy)}) rotate({f(rot)})">'
            f'<path d="{d}" fill="{color}" stroke="{color}" stroke-width="{f(s*0.12)}" stroke-linejoin="round"/>'
            f'<path d="M0,{f(s*0.85)} L0,{f(-s*0.55)} M0,{f(-s*0.05)} L{f(s*0.5)},{f(-s*0.3)} M0,{f(-s*0.05)} L{f(-s*0.5)},{f(-s*0.3)}" '
            f'stroke="{shade}" stroke-width="{f(s*0.07)}" stroke-linecap="round" fill="none"/></g>')


# ---------------- everyday ----------------
def alpaca_ears(doc):
    """'Alpaca me' lens: alpaca ears + curly top knot."""
    s = ""
    for side in (-1, 1):
        s += (f'<g transform="translate({62*side} -52) rotate({32*side}) scale(1.25)">'
              + blob(doc, [("p", EAR_O, (-17, -60, 17, 0))], FUR, FUR_S, dx=-3 * side, dy=-3)
              + f'<path d="{EAR_I}" fill="{EAR_IN}"/></g>')
    knot = [("c", -48, -54, 20), ("c", -26, -70, 24), ("c", 0, -76, 25), ("c", 26, -70, 24), ("c", 48, -54, 20),
            ("c", -30, -50, 16), ("c", 0, -54, 18), ("c", 30, -50, 16)]
    s += blob(doc, knot, FUR, FUR_S, dx=-4, dy=-6,
              extra=f'<ellipse cx="-16" cy="-84" rx="13" ry="6" fill="{FUR_HI}" opacity="0.7"/>')
    return s


def party_hat(doc):
    cone = ("p", "M-34,-52 L46,-52 L12,-170 Z", (-34, -170, 46, -52))
    stripes = "".join(f'<path d="M-60,{y} L80,{y-40}" stroke="{c}" stroke-width="12"/>'
                      for y, c in ((-60, GOLD), (-95, "#4CC9F0"), (-130, GOLD)))
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="4" fill="#fff" opacity="0.85"/>' for x, y in ((-6, -78), (20, -112), (6, -142), (26, -70)))
    s = blob(doc, [cone], "#FF5A7A", "#D93C5E", dx=-5, dy=-4, extra=stripes + dots)
    s += blob(doc, cloud(12, -172, 15, 15, 6, 7, seed=3), GOLD, GOLD_S, dx=-3, dy=-3)
    s += blob(doc, cloud(6, -52, 46, 9, 9, 7, seed=4), "#FFFFFF", SNOW_S, dx=-2, dy=-3)
    return f'<g transform="rotate(10 6 -52)">{s}</g>'


def crown(doc):
    d = "M-62,-46 L-66,-118 L-36,-86 L-16,-128 L0,-92 L16,-128 L36,-86 L66,-118 L62,-46 Z"
    s = blob(doc, [("p", d, (-66, -128, 66, -46))], GOLD, GOLD_S, dx=-5, dy=-5,
             extra=f'<rect x="-70" y="-64" width="140" height="18" fill="{GOLD_S}"/>')
    for x, c in ((-36, "#4CC9F0"), (0, RED), (36, "#7BD389")):
        s += f'<circle cx="{x}" cy="-56" r="7" fill="{c}"/><circle cx="{x-2}" cy="-58" r="2.2" fill="#fff" opacity="0.8"/>'
    for x, y in ((-66, -118), (-16, -128), (16, -128), (66, -118)):
        s += f'<circle cx="{x}" cy="{y}" r="7" fill="{GOLD}"/>'
    s += f'<circle cx="0" cy="-100" r="9" fill="{RED}"/><circle cx="-3" cy="-103" r="3" fill="#fff" opacity="0.8"/>'
    return s


def grad_cap(doc):
    base = ("p", "M-50,-44 L50,-44 L46,-80 L-46,-80 Z", (-50, -80, 50, -44))
    s = blob(doc, [base], BLACK, BLACK_S, dx=-4, dy=-3)
    board = ("p", "M-104,-82 L0,-112 L104,-82 L0,-52 Z", (-104, -112, 104, -52))
    s += blob(doc, [board], "#3B3742", BLACK_S, dx=-5, dy=-6,
              extra='<path d="M-60,-86 L0,-104" stroke="#fff" stroke-width="3" opacity="0.18" stroke-linecap="round"/>')
    s += f'<path d="M0,-82 Q50,-80 78,-72 L82,-34" fill="none" stroke="{GOLD}" stroke-width="5" stroke-linecap="round"/>'
    s += f'<path d="M74,-36 L90,-36 L94,-6 L70,-6 Z" fill="{GOLD}"/><path d="M76,-6 L76,4 M82,-6 L82,6 M88,-6 L88,4" stroke="{GOLD_S}" stroke-width="3" stroke-linecap="round"/>'
    s += f'<circle cx="0" cy="-82" r="6" fill="{GOLD}"/>'
    return s


def shades():
    return '<g transform="translate(0 4) scale(1.18) translate(0 -4)">' + _shades() + '</g>'


def _shades():
    s = ""
    for x in (-24, 24):
        s += f'<rect x="{x-21}" y="-10" width="42" height="30" rx="11" fill="#1E1B22"/>'
        s += f'<path d="M{x-12},-2 L{x-2},-2" stroke="#fff" stroke-width="3" opacity="0.5" stroke-linecap="round"/>'
        s += f'<path d="M{x+6},12 L{x+14},4" stroke="#fff" stroke-width="2.5" opacity="0.25" stroke-linecap="round"/>'
    s += '<path d="M-4,-2 Q0,-6 4,-2" fill="none" stroke="#1E1B22" stroke-width="5" stroke-linecap="round"/>'
    s += '<path d="M-44,-4 L-58,-9 M44,-4 L58,-9" stroke="#1E1B22" stroke-width="5" stroke-linecap="round"/>'
    return s


def heart_glasses():
    s = ""
    for x in (-25, 25):
        k = 0.24
        d = (f"M{x},{f(6+30*k)} C{f(x-60*k)},{f(6)} {f(x-56*k)},{f(6-52*k*1.2)} {f(x-24*k)},{f(6-50*k*1.2)} "
             f"C{f(x-8*k)},{f(6-49*k*1.2)} {x},{f(6-36*k*1.2)} {x},{f(6-28*k*1.2)} "
             f"C{x},{f(6-36*k*1.2)} {f(x+8*k)},{f(6-49*k*1.2)} {f(x+24*k)},{f(6-50*k*1.2)} "
             f"C{f(x+56*k)},{f(6-52*k*1.2)} {f(x+60*k)},{f(6)} {x},{f(6+30*k)} Z")
        s += f'<g transform="translate({x} 6) scale(1.9) translate({-x} -6)"><path d="{d}" fill="{PINK}" fill-opacity="0.55" stroke="#E2336B" stroke-width="2.2"/></g>'
        s += f'<ellipse cx="{x-9}" cy="-6" rx="5" ry="3" fill="#fff" opacity="0.7"/>'
    s += '<path d="M-6,0 Q0,-5 6,0" fill="none" stroke="#E2336B" stroke-width="4" stroke-linecap="round"/>'
    return s


def mustache(color="#5A3A22"):
    d = ("M0,30 C-6,24 -18,22 -28,28 C-38,34 -46,32 -52,24 C-50,40 -36,48 -22,44 C-12,41 -4,36 0,36 "
         "C4,36 12,41 22,44 C36,48 50,40 52,24 C46,32 38,34 28,28 C18,22 6,24 0,30 Z")
    return (f'<path d="{d}" fill="{color}"/>'
            f'<path d="M-40,34 C-30,36 -18,32 -8,31" stroke="#fff" stroke-width="2" opacity="0.25" fill="none" stroke-linecap="round"/>')


# ---------------- halloween ----------------
def witch_hat(doc):
    brim = ("e", 0, -48, 104, 19)
    cone = ("p", "M-48,-54 C-40,-110 -10,-150 18,-176 C34,-190 54,-186 68,-170 C46,-168 32,-150 34,-120 C36,-96 44,-72 48,-54 Z",
            (-48, -190, 68, -54))
    s = blob(doc, [cone], PURPLE, PURPLE_S, dx=-6, dy=-4)
    s += blob(doc, [brim], PURPLE, PURPLE_S, dx=-4, dy=-5)
    s += f'<path d="M-46,-62 Q0,-50 46,-62 L44,-80 Q0,-68 -44,-80 Z" fill="{BLACK}"/>'
    s += f'<rect x="-11" y="-82" width="22" height="22" rx="3" fill="none" stroke="{GOLD}" stroke-width="5"/>'
    s += f'<path d="{star_path(22, -132, 9, 4)}" fill="{GOLD}"/><path d="{star_path(-14, -104, 6, 2.6)}" fill="{GOLD}" opacity="0.9"/>'
    return s


def jack_o_lantern(doc, cx=0, cy=0, r=60, glow=True, face=True):
    ribs = [("e", cx - r * 0.55, cy, r * 0.52, r * 0.82), ("e", cx + r * 0.55, cy, r * 0.52, r * 0.82), ("e", cx, cy, r * 0.6, r * 0.86)]
    s = f'<path d="M{f(cx-4)},{f(cy-r*0.8)} C{f(cx-6)},{f(cy-r*1.05)} {f(cx+4)},{f(cy-r*1.2)} {f(cx+14)},{f(cy-r*1.18)}" stroke="#5E8C3A" stroke-width="{f(r*0.18)}" stroke-linecap="round" fill="none"/>'
    s += blob(doc, ribs, ORANGE, ORANGE_S, dx=-5, dy=-6,
              extra=f'<path d="M{f(cx-r*0.28)},{f(cy-r*0.7)} Q{f(cx-r*0.36)},{f(cy)} {f(cx-r*0.28)},{f(cy+r*0.7)} M{f(cx+r*0.28)},{f(cy-r*0.7)} Q{f(cx+r*0.36)},{f(cy)} {f(cx+r*0.28)},{f(cy+r*0.7)}" stroke="{ORANGE_S}" stroke-width="{f(r*0.06)}" fill="none" opacity="0.6"/>'
                    f'<ellipse cx="{f(cx-r*0.55)}" cy="{f(cy-r*0.45)}" rx="{f(r*0.16)}" ry="{f(r*0.08)}" fill="{ORANGE_L}" opacity="0.8" transform="rotate(-30 {f(cx-r*0.55)} {f(cy-r*0.45)})"/>')
    if face:
        fill = "#FFD24A" if glow else "#3A2412"
        k = r / 60
        s += (f'<path d="M{f(cx-34*k)},{f(cy-6*k)} L{f(cx-20*k)},{f(cy-26*k)} L{f(cx-8*k)},{f(cy-6*k)} Z" fill="{fill}"/>'
              f'<path d="M{f(cx+8*k)},{f(cy-6*k)} L{f(cx+20*k)},{f(cy-26*k)} L{f(cx+34*k)},{f(cy-6*k)} Z" fill="{fill}"/>'
              f'<path d="M{f(cx-36*k)},{f(cy+12*k)} Q{f(cx)},{f(cy+50*k)} {f(cx+36*k)},{f(cy+12*k)} L{f(cx+24*k)},{f(cy+16*k)} L{f(cx+18*k)},{f(cy+8*k)} '
              f'L{f(cx+8*k)},{f(cy+18*k)} L{f(cx)},{f(cy+10*k)} L{f(cx-8*k)},{f(cy+18*k)} L{f(cx-18*k)},{f(cy+8*k)} L{f(cx-24*k)},{f(cy+16*k)} Z" fill="{fill}"/>')
    return s


def pumpkin_hat(doc):
    return jack_o_lantern(doc, 0, -96, 58)


def devil_horns(doc):
    s = ""
    for side in (-1, 1):
        d = (f"M{-30*side},-56 C{-40*side},-80 {-58*side},-92 {-66*side},-120 C{-48*side},-108 {-30*side},-96 {-14*side},-62 Z")
        s += blob(doc, [("p", d, (min(-66*side, -14*side), -120, max(-66*side, -14*side), -56))], "#E63946", "#B3202D", dx=-3 * side, dy=-3)
    return s


def cat_ears(doc):
    s = f'<path d="M-74,-34 C-60,-80 60,-80 74,-34" fill="none" stroke="{BLACK}" stroke-width="8" stroke-linecap="round"/>'
    for side in (-1, 1):
        d = f"M{-70*side},-40 L{-58*side},-118 L{-18*side},-66 Z"
        di = f"M{-60*side},-54 L{-54*side},-100 L{-30*side},-68 Z"
        s += f'<path d="{d}" fill="{BLACK}" stroke="{BLACK}" stroke-width="10" stroke-linejoin="round"/>'
        s += f'<path d="{di}" fill="{PINK}" stroke="{PINK}" stroke-width="5" stroke-linejoin="round"/>'
    return s


def fangs():
    s = ""
    for x in (-13, 13):
        s += f'<path d="M{x-6},0 L{x+6},0 L{x},17 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>'
        s += f'<path d="M{x+2},2 L{x},12" stroke="#E6E6EE" stroke-width="2"/>'
    return s


def vampire_collar(doc):
    d = "M-110,40 L-96,-40 L-70,20 L-60,-60 L-40,30 L40,30 L60,-60 L70,20 L96,-40 L110,40 Z"
    return blob(doc, [("p", d, (-110, -60, 110, 40))], "#B3202D", "#7E1420", dx=-4, dy=-4)


# ---------------- thanksgiving ----------------
def pilgrim_hat(doc):
    brim = ("e", 0, -48, 96, 16)
    crown_ = ("p", "M-52,-54 L-42,-160 Q0,-170 42,-160 L52,-54 Z", (-52, -170, 52, -54))
    s = blob(doc, [crown_], BLACK, BLACK_S, dx=-6, dy=-4,
             extra='<path d="M-30,-150 L-38,-70" stroke="#fff" stroke-width="5" opacity="0.12" stroke-linecap="round"/>')
    s += blob(doc, [brim], BLACK, BLACK_S, dx=-4, dy=-5)
    s += f'<path d="M-51,-60 L51,-60 L49,-86 L-49,-86 Z" fill="#8A5A32"/>'
    s += f'<rect x="-15" y="-90" width="30" height="34" rx="3" fill="none" stroke="{GOLD}" stroke-width="7"/>'
    return s


def leaf_crown(doc):
    s = f'<path d="M-86,-30 Q0,-104 86,-30" fill="none" stroke="#8A5A32" stroke-width="7" stroke-linecap="round"/>'
    r = random.Random(5)
    n = 9
    for i in range(n):
        t = i / (n - 1)
        x = -86 + 172 * t
        y = -30 - 74 * (1 - (2 * t - 1) ** 2) * 0.5 * 2 * 0.5
        y = (1 - t) ** 2 * -30 + 2 * (1 - t) * t * -104 + t * t * -30
        ang = (t - 0.5) * 100
        c, cs = LEAF_COLORS[i % len(LEAF_COLORS)]
        s += maple(x + r.uniform(-3, 3), y - 8, 30 + r.uniform(-3, 3), ang + r.uniform(-20, 20), c, cs)
    for x, y in ((-40, -66), (40, -66), (0, -78)):
        s += (f'<ellipse cx="{x}" cy="{y+4}" rx="9" ry="11" fill="#B57A3E"/><path d="M{x-10},{y-2} Q{x},{y-12} {x+10},{y-2} Z" fill="#7A4F2A"/>'
              f'<path d="M{x},{y-10} L{x+2},{y-16}" stroke="#7A4F2A" stroke-width="3" stroke-linecap="round"/>')
    return s


def turkey_feathers(doc, behind=True):
    s = ""
    cols = [("#8A4B2A", "#6B381E"), ("#E2552C", "#B83E1B"), ("#F2BE32", "#D29A16"), ("#F28C28", "#CF6D12")]
    n = 9
    for i in range(n):
        a = -78 + 156 * i / (n - 1)
        c, cs = cols[i % len(cols)]
        feather = ("e", 0, -78, 22, 64)
        s += (f'<g transform="translate(0 -36) rotate({f(a)})">'
              + blob(doc, [feather], c, cs, dx=-3, dy=-4,
                     extra=f'<ellipse cx="0" cy="-118" rx="12" ry="18" fill="#fff" opacity="0.18"/><path d="M0,-20 L0,-130" stroke="{cs}" stroke-width="3"/>')
              + "</g>")
    return s


def chef_hat(doc):
    puff = cloud(0, -112, 66, 42, 9, 30, seed=12)
    s = blob(doc, puff, "#FFFFFF", CREAM_S, dx=-6, dy=-6)
    s += blob(doc, [("r", -54, -78, 108, 32, 6)], "#FFFFFF", CREAM_S, dx=-4, dy=-4,
              extra=''.join(f'<path d="M{x},-76 L{x},-48" stroke="{CREAM_S}" stroke-width="3"/>' for x in (-30, -10, 10, 30)))
    return s


def beanie(doc, color=ORANGE, shade=ORANGE_S, cuff="#E0761A"):
    dome = ("p", "M-74,-40 C-74,-120 74,-120 74,-40 Z", (-74, -120, 74, -40))
    ribs = "".join(f'<path d="M{x},-44 Q{x*0.8},-90 {x*0.4},-116" stroke="{shade}" stroke-width="3" fill="none" opacity="0.6"/>' for x in (-50, -25, 0, 25, 50))
    s = blob(doc, [dome], color, shade, dx=-6, dy=-5, extra=ribs)
    s += blob(doc, [("r", -80, -58, 160, 34, 14)], cuff, shade, dx=-4, dy=-4,
              extra="".join(f'<path d="M{x},-54 L{x},-28" stroke="{shade}" stroke-width="4" opacity="0.7"/>' for x in range(-66, 70, 12)))
    s += blob(doc, cloud(0, -124, 20, 20, 8, 10, seed=7), "#FFF3E2", CREAM_S, dx=-3, dy=-4)
    return s


# ---------------- holidays ----------------
def elf_hat(doc):
    cone = ("p", "M-58,-54 C-50,-110 0,-150 60,-160 C92,-164 118,-150 128,-126 C98,-138 66,-118 58,-54 Z", (-58, -164, 128, -54))
    s = blob(doc, [cone], GREEN, GREEN_S, dx=-6, dy=-5)
    brim = ("r", -66, -70, 132, 26, 13)
    stripes = "".join(f'<rect x="{x}" y="-72" width="12" height="30" fill="{RED}" transform="skewX(-20)"/>' for x in range(-80, 80, 24))
    s += blob(doc, [brim], "#FFFFFF", SNOW_S, dx=-3, dy=-3, extra=stripes)
    s += f'<circle cx="130" cy="-122" r="13" fill="{GOLD}"/><path d="M124,-118 Q130,-112 136,-118" stroke="{GOLD_S}" stroke-width="3" fill="none"/><circle cx="126" cy="-127" r="3.5" fill="#fff" opacity="0.7"/>'
    return s


def earmuffs(doc):
    s = f'<path d="M-82,0 C-82,-120 82,-120 82,0" fill="none" stroke="#C9353D" stroke-width="12" stroke-linecap="round"/>'
    s += f'<path d="M-76,-40 C-60,-104 60,-104 76,-40" fill="none" stroke="#fff" stroke-width="3" opacity="0.35"/>'
    for side in (-1, 1):
        s += blob(doc, cloud(82 * side, 8, 30, 34, 10, 12, seed=20 + side), "#FFFFFF", SNOW_S, dx=-3, dy=-4)
        s += f'<ellipse cx="{82*side}" cy="8" rx="14" ry="17" fill="{RED}"/>'
    return s


def santa_beard(doc):
    beard = (cloud(0, 82, 70, 46, 12, 22, seed=31) + cloud(-58, 52, 26, 34, 6, 13, seed=32) + cloud(58, 52, 26, 34, 6, 13, seed=33))
    s = blob(doc, beard, "#FFFFFF", SNOW_S, dx=-4, dy=-6)
    stache = cloud(-22, 38, 26, 13, 7, 9, seed=34) + cloud(22, 38, 26, 13, 7, 9, seed=35)
    s += blob(doc, stache, "#FFFFFF", SNOW_S, dx=-3, dy=-4)
    return s


def star_glasses():
    s = ""
    for x in (-25, 25):
        s += f'<path d="{star_path(x, 6, 25, 12)}" fill="{GOLD}" stroke="{GOLD}" stroke-width="4" stroke-linejoin="round"/>'
        s += f'<path d="{star_path(x, 7, 15, 7)}" fill="#3D2E58" opacity="0.85" stroke="#3D2E58" stroke-width="2" stroke-linejoin="round"/>'
    s += f'<path d="M-6,2 Q0,-3 6,2" fill="none" stroke="{GOLD_S}" stroke-width="4" stroke-linecap="round"/>'
    return s


def red_nose():
    return (f'<circle cx="0" cy="24" r="17" fill="{RED}"/><circle cx="3" cy="27" r="14" fill="{RED_S}" opacity="0.35"/>'
            f'<ellipse cx="-6" cy="17" rx="5" ry="3.4" fill="#fff" opacity="0.75" transform="rotate(-30 -6 17)"/>')

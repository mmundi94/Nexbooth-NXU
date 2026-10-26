"""Themed stickers (drag-and-drop) for Everyday, Halloween and Thanksgiving.
Holiday stickers live in props.py."""
import math, random
from kit import *
from headwear import *
from alpaca import heart, mug


def _doc(w, h):
    return Doc(w, h)


# ---------------- everyday ----------------
def st_balloons():
    d = _doc(260, 330)
    s = ""
    for (x, y, c, cs, rot) in ((90, 110, "#FF5A7A", "#D93C5E", -12), (170, 96, GOLD, GOLD_S, 10), (130, 70, "#4CC9F0", "#2AA3C9", 0)):
        s += f'<path d="M{x},{y+62} Q{x+(130-x)*0.5+10},{y+150} 130,300" fill="none" stroke="#8E8E9A" stroke-width="2.5"/>'
    for (x, y, c, cs, rot) in ((90, 110, "#FF5A7A", "#D93C5E", -12), (170, 96, GOLD, GOLD_S, 10), (130, 70, "#4CC9F0", "#2AA3C9", 0)):
        s += (f'<g transform="rotate({rot} {x} {y})">' + blob(d, [("e", x, y, 50, 60)], c, cs, dx=-6, dy=-7,
              extra=f'<ellipse cx="{x-18}" cy="{y-24}" rx="11" ry="16" fill="#fff" opacity="0.45" transform="rotate(-25 {x-18} {y-24})"/>')
              + f'<path d="M{x-7},{y+66} L{x+7},{y+66} L{x},{y+58} Z" fill="{cs}"/></g>')
    d.add(s); return d


def st_trophy():
    d = _doc(220, 260)
    cup = ("p", "M50,30 L170,30 C170,110 140,140 110,146 C80,140 50,110 50,30 Z", (50, 30, 170, 146))
    s = (f'<path d="M54,48 C14,48 18,108 66,112" fill="none" stroke="{GOLD_S}" stroke-width="12" stroke-linecap="round"/>'
         f'<path d="M166,48 C206,48 202,108 154,112" fill="none" stroke="{GOLD_S}" stroke-width="12" stroke-linecap="round"/>')
    s += blob(d, [cup], GOLD, GOLD_S, dx=-6, dy=-5, extra=f'<path d="{star_path(110, 80, 22, 10)}" fill="#FFF2B8"/>')
    s += f'<rect x="96" y="144" width="28" height="36" fill="{GOLD_S}"/>'
    s += blob(d, [("r", 62, 178, 96, 52, 8)], "#4A3A5A", "#2F243A", dx=-4, dy=-4,
              extra=f'<rect x="78" y="194" width="64" height="18" rx="3" fill="{GOLD}"/>')
    d.add(s); return d


def st_coffee():
    d = _doc(180, 250)
    cup = ("p", "M40,70 L140,70 L126,230 L54,230 Z", (40, 70, 140, 230))
    s = blob(d, [cup], "#FFFFFF", CREAM_S, dx=-5, dy=-4,
             extra=f'<path d="M45,120 L135,120 L130,180 L50,180 Z" fill="{GOLD}"/>'
                   f'<text x="90" y="160" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700" font-size="24" fill="#2E2A33">NEX</text>')
    s += blob(d, [("r", 32, 50, 116, 24, 8)], "#3B3742", BLACK_S, dx=-3, dy=-3)
    s += blob(d, [("r", 44, 36, 92, 18, 6)], "#3B3742", BLACK_S, dx=-2, dy=-2)
    for dx in (-12, 10):
        s += f'<path d="M{90+dx},28 c-9,-10 9,-16 0,-26" fill="none" stroke="#C9C2D6" stroke-width="4" stroke-linecap="round"/>'
    d.add(s); return d


def st_books():
    d = _doc(260, 200)
    s = ""
    for i, (c, cs, w, x) in enumerate((("#4A86D4", "#2F63A8", 200, 30), ("#E2444A", "#B92F37", 180, 46), ("#3D9A6A", "#2A7550", 190, 36))):
        y = 150 - i * 44
        s += blob(d, [("r", x, y, w, 40, 6)], c, cs, dx=-4, dy=-3,
                  extra=f'<rect x="{x+w-26}" y="{y+6}" width="20" height="28" fill="#FFF6E8"/><rect x="{x+16}" y="{y+16}" width="60" height="7" rx="3" fill="#fff" opacity="0.6"/>')
    d.add(s); return d


def st_heart():
    d = _doc(200, 190)
    d.add(heart(d, 100, 100, size=160, color="#FF5A7A", shade="#D93C5E")); return d


def st_star():
    d = _doc(200, 200)
    d.add(f'<path d="{star_path(100, 106, 86, 40)}" fill="{GOLD_S}" stroke="{GOLD_S}" stroke-width="14" stroke-linejoin="round"/>')
    d.add(f'<path d="{star_path(96, 100, 84, 39)}" fill="{GOLD}" stroke="{GOLD}" stroke-width="10" stroke-linejoin="round"/>')
    d.add(sparkle(74, 82, 10, "#FFFFFF")); return d


# ---------------- halloween ----------------
def st_jack():
    d = _doc(220, 220)
    d.add(jack_o_lantern(d, 110, 124, 82)); return d


def ghost(doc, cx, cy, s=1.0, eyes="dot"):
    d = (f"M{f(cx-50*s)},{f(cy+60*s)} L{f(cx-50*s)},{f(cy-10*s)} C{f(cx-50*s)},{f(cy-80*s)} {f(cx+50*s)},{f(cy-80*s)} {f(cx+50*s)},{f(cy-10*s)} "
         f"L{f(cx+50*s)},{f(cy+60*s)} Q{f(cx+37*s)},{f(cy+46*s)} {f(cx+25*s)},{f(cy+60*s)} Q{f(cx+12*s)},{f(cy+74*s)} {f(cx)},{f(cy+60*s)} "
         f"Q{f(cx-12*s)},{f(cy+46*s)} {f(cx-25*s)},{f(cy+60*s)} Q{f(cx-37*s)},{f(cy+74*s)} {f(cx-50*s)},{f(cy+60*s)} Z")
    out = blob(doc, [("p", d, (cx - 50 * s, cy - 80 * s, cx + 50 * s, cy + 74 * s))], "#FFFFFF", "#DCD6EA", dx=-5 * s, dy=-6 * s)
    out += f'<ellipse cx="{f(cx-17*s)}" cy="{f(cy-12*s)}" rx="{f(7*s)}" ry="{f(10*s)}" fill="{EYE}"/><ellipse cx="{f(cx+17*s)}" cy="{f(cy-12*s)}" rx="{f(7*s)}" ry="{f(10*s)}" fill="{EYE}"/>'
    out += f'<circle cx="{f(cx-19*s)}" cy="{f(cy-16*s)}" r="{f(2.4*s)}" fill="#fff"/><circle cx="{f(cx+15*s)}" cy="{f(cy-16*s)}" r="{f(2.4*s)}" fill="#fff"/>'
    out += f'<ellipse cx="{f(cx)}" cy="{f(cy+12*s)}" rx="{f(8*s)}" ry="{f(10*s)}" fill="{MOUTH}"/>'
    out += f'<ellipse cx="{f(cx-30*s)}" cy="{f(cy+4*s)}" rx="{f(7*s)}" ry="{f(4*s)}" fill="{CHEEK}" opacity="0.6"/><ellipse cx="{f(cx+30*s)}" cy="{f(cy+4*s)}" rx="{f(7*s)}" ry="{f(4*s)}" fill="{CHEEK}" opacity="0.6"/>'
    return out


def st_ghost():
    d = _doc(160, 200)
    d.add(ghost(d, 80, 100)); return d


def bat(doc, cx, cy, s=1.0, color=BLACK, shade=BLACK_S):
    wing = (f"M0,0 C-20,-26 -50,-34 -86,-22 C-74,-14 -70,-4 -72,8 C-62,0 -52,2 -46,12 C-38,4 -28,4 -22,14 C-16,6 -8,4 0,8 Z")
    out = f'<g transform="translate({f(cx)} {f(cy)}) scale({f(s)})">'
    out += f'<path d="{wing}" fill="{color}"/><path d="{wing}" fill="{color}" transform="scale(-1 1)"/>'
    out += f'<ellipse cx="0" cy="2" rx="18" ry="20" fill="{color}"/>'
    out += f'<path d="M-12,-12 L-10,-28 L-3,-16 Z M12,-12 L10,-28 L3,-16 Z" fill="{color}"/>'
    out += f'<circle cx="-7" cy="0" r="4" fill="#FFD24A"/><circle cx="7" cy="0" r="4" fill="#FFD24A"/>'
    out += f'<path d="M-4,9 L-2,13 L0,9 L2,13 L4,9" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>'
    return out + "</g>"


def st_bat():
    d = _doc(200, 110)
    d.add(bat(d, 100, 52, 1.05)); return d


def st_candycorn():
    d = _doc(140, 170)
    p = ("p", "M70,10 C90,10 128,120 124,138 C120,156 20,156 16,138 C12,120 50,10 70,10 Z", (12, 10, 128, 156))
    s = blob(d, [p], "#FFFFFF", CREAM_S, dx=-4, dy=-5,
             extra=f'<rect x="0" y="0" width="140" height="58" fill="#FFF4D6"/><rect x="0" y="58" width="140" height="48" fill="{ORANGE}"/><rect x="0" y="106" width="140" height="60" fill="{GOLD}"/>'
                   f'<path d="M58,26 Q52,60 46,100" stroke="#fff" stroke-width="5" opacity="0.6" fill="none" stroke-linecap="round"/>')
    d.add(s); return d


def st_spider():
    d = _doc(180, 230)
    s = f'<path d="M90,0 L90,120" stroke="#8E8E9A" stroke-width="2.5"/>'
    for side in (-1, 1):
        for i, (a, b) in enumerate(((-30, -50), (-10, -30), (10, 10), (30, 40))):
            s += f'<path d="M90,{150+i*6} Q{90+side*40},{150+a} {90+side*64},{150+b+30}" fill="none" stroke="{BLACK}" stroke-width="6" stroke-linecap="round"/>'
    s += f'<ellipse cx="90" cy="160" rx="34" ry="30" fill="{BLACK}"/><circle cx="90" cy="124" r="20" fill="{BLACK}"/>'
    s += f'<circle cx="82" cy="122" r="6" fill="#fff"/><circle cx="98" cy="122" r="6" fill="#fff"/><circle cx="83" cy="123" r="3" fill="{EYE}"/><circle cx="99" cy="123" r="3" fill="{EYE}"/>'
    s += f'<path d="M84,134 Q90,138 96,134" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>'
    s += f'<path d="M78,152 L90,144 L102,152 L90,176 Z" fill="#E63946"/>'
    d.add(s); return d


def st_moon():
    d = _doc(200, 200)
    s = f'<circle cx="100" cy="100" r="86" fill="#FFE9A8"/><circle cx="140" cy="76" r="76" fill="#FFF" opacity="0"/>'
    s = f'<path d="M130,20 A86,86 0 1 0 180,140 A70,70 0 1 1 130,20 Z" fill="#FFE08A"/>'
    s += f'<circle cx="80" cy="120" r="10" fill="#F5CF6A"/><circle cx="56" cy="80" r="7" fill="#F5CF6A"/><circle cx="104" cy="160" r="6" fill="#F5CF6A"/>'
    d.add(s); return d


def st_cauldron():
    d = _doc(240, 220)
    s = f'<path d="M50,206 L64,176 M190,206 L176,176" stroke="{BLACK}" stroke-width="10" stroke-linecap="round"/>'
    s += blob(d, [("e", 120, 140, 92, 62)], BLACK, BLACK_S, dx=-6, dy=-6)
    s += f'<ellipse cx="120" cy="86" rx="96" ry="18" fill="#3B3742"/><ellipse cx="120" cy="86" rx="84" ry="12" fill="#7BD389"/>'
    for (x, y, r) in ((84, 70, 14), (124, 62, 18), (160, 72, 12), (104, 44, 9), (146, 40, 7)):
        s += f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9BE3A6"/><circle cx="{x-r*0.35}" cy="{y-r*0.35}" r="{r*0.3}" fill="#fff" opacity="0.7"/>'
    d.add(s); return d


# ---------------- thanksgiving ----------------
def st_pumpkin():
    d = _doc(220, 200)
    d.add(jack_o_lantern(d, 110, 112, 80, face=False)); return d


def st_pie():
    d = _doc(260, 170)
    s = blob(d, [("e", 130, 108, 116, 46)], "#E3A35A", "#C1823C", dx=-6, dy=-6)
    s += f'<ellipse cx="130" cy="96" rx="100" ry="34" fill="#C8682A"/><ellipse cx="114" cy="88" rx="44" ry="12" fill="#E07F3C" opacity="0.6"/>'
    s += "".join(f'<circle cx="{f(130+108*math.cos(a))}" cy="{f(98+40*math.sin(a))}" r="9" fill="#EDB774"/>' for a in [i * math.pi / 9 for i in range(18)])
    s += blob(d, cloud(150, 82, 20, 12, 6, 8, seed=4), "#FFFFFF", CREAM_S, dx=-2, dy=-3)
    d.add(s); return d


def st_turkey():
    d = _doc(360, 330)
    s = turkey_feathers(d).replace('translate(0 -36)', 'translate(150 170)')
    s = f'<g transform="translate(150 150) scale(1.15) translate(-150 -150)">{s}</g>'
    s += blob(d, [("e", 150, 200, 66, 70)], "#8A5A32", "#6B4426", dx=-6, dy=-6)
    s += blob(d, [("c", 150, 130, 40)], "#9C6A3C", "#7A5030", dx=-4, dy=-5)
    s += f'<ellipse cx="136" cy="126" rx="7" ry="9" fill="{EYE}"/><ellipse cx="164" cy="126" rx="7" ry="9" fill="{EYE}"/><circle cx="134" cy="123" r="2.6" fill="#fff"/><circle cx="162" cy="123" r="2.6" fill="#fff"/>'
    s += f'<path d="M140,140 L160,140 L150,156 Z" fill="{GOLD}"/><path d="M150,150 C142,158 140,172 148,176 C154,170 156,160 150,150 Z" fill="#E2444A"/>'
    s += f'<ellipse cx="126" cy="146" rx="7" ry="4" fill="{CHEEK}" opacity="0.7"/><ellipse cx="174" cy="146" rx="7" ry="4" fill="{CHEEK}" opacity="0.7"/>'
    s += f'<path d="M128,266 L122,286 M140,268 L140,288 M160,268 L160,288 M172,266 L178,286" stroke="{GOLD_S}" stroke-width="6" stroke-linecap="round"/>'
    d.add(f'<g transform="translate(30 24)">{s}</g>'); return d


def st_leaf(i):
    def fn():
        d = _doc(140, 140)
        c, cs = LEAF_COLORS[i]
        d.add(maple(70, 66, 58, -12 + i * 14, c, cs)); return d
    return fn


def st_corn():
    d = _doc(160, 250)
    s = ""
    for side, rot in ((-1, -18), (1, 18)):
        s += f'<path d="M80,230 C{80+side*60},180 {80+side*56},90 {80+side*20},40 C{80+side*20},120 {80+side*10},180 80,230 Z" fill="#9AB35A" transform="rotate({rot*0.2} 80 230)"/>'
    s += blob(d, [("e", 80, 118, 32, 88)], GOLD, GOLD_S, dx=-4, dy=-5,
              extra="".join(f'<circle cx="{80+dx}" cy="{y}" r="6" fill="#FFE07A"/>' for y in range(50, 200, 14) for dx in (-16, 0, 16)))
    d.add(s); return d


def st_acorn():
    d = _doc(140, 170)
    s = blob(d, [("e", 70, 104, 46, 52)], "#C08A4E", "#9A6A36", dx=-5, dy=-6,
             extra='<ellipse cx="52" cy="104" rx="9" ry="18" fill="#fff" opacity="0.25"/>')
    s += blob(d, [("p", "M18,72 C18,30 122,30 122,72 Q70,84 18,72 Z", (18, 30, 122, 84))], "#7A4F2A", "#5C3A1E", dx=-4, dy=-4,
              extra="".join(f'<path d="M{x},44 L{x+8},74" stroke="#5C3A1E" stroke-width="3"/>' for x in range(24, 120, 14)))
    s += f'<path d="M70,34 Q70,16 82,8" stroke="#5C3A1E" stroke-width="7" stroke-linecap="round" fill="none"/>'
    d.add(s); return d


STICKERS = {
    "everyday": [
        ("st-balloons", "Balloons", st_balloons), ("st-trophy", "Trophy", st_trophy), ("st-coffee", "Coffee", st_coffee),
        ("st-books", "Books", st_books), ("st-heart", "Heart", st_heart), ("st-star", "Star", st_star),
    ],
    "halloween": [
        ("st-jack", "Jack-o'-lantern", st_jack), ("st-ghost", "Ghost", st_ghost), ("st-bat", "Bat", st_bat),
        ("st-candycorn", "Candy corn", st_candycorn), ("st-spider", "Spider", st_spider), ("st-moon", "Moon", st_moon),
        ("st-cauldron", "Cauldron", st_cauldron),
    ],
    "thanksgiving": [
        ("st-pumpkin", "Pumpkin", st_pumpkin), ("st-pie", "Pumpkin pie", st_pie), ("st-turkey", "Turkey", st_turkey),
        ("st-leaf-red", "Red leaf", st_leaf(0)), ("st-leaf-orange", "Orange leaf", st_leaf(1)), ("st-leaf-yellow", "Yellow leaf", st_leaf(2)),
        ("st-corn", "Corn", st_corn), ("st-acorn", "Acorn", st_acorn),
    ],
}

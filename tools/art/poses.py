"""Nexbooth alpaca poses (cute sticker style), grouped by theme."""
from kit import *
from alpaca import *
from headwear import *
from stickers import ghost, bat

HX, HY, HS = 250, 168, 1.36


def ground(*a, **k):
    return ""


def body(doc, legs=True, hind=True, lift=0, tail=False):
    L = lift
    s = ""
    if tail:
        s += blob(doc, cloud(326, 356 - L, 18, 18, 6, 9, seed=31), FUR, FUR_S, dx=-3, dy=-4)
    shapes = (cloud(250, 296 - L, 40, 46, 7, 16, seed=21) + cloud(250, 384 - L, 82, 70, 10, 22, seed=22)
              + cloud(184, 418 - L, 40, 36, 6, 16, seed=23) + cloud(316, 418 - L, 40, 36, 6, 16, seed=24))
    s += blob(doc, shapes, FUR, FUR_S, dx=-6, dy=-8,
              extra=f'<ellipse cx="250" cy="{284 - L}" rx="44" ry="14" fill="{FUR_D}" opacity="0.35"/>'
                    f'<ellipse cx="232" cy="{364 - L}" rx="34" ry="24" fill="{FUR_HI}" opacity="0.35"/>')
    if hind:
        s += nub(doc, 186, 452 - L, 17, 15, 20, tip=9) + nub(doc, 314, 452 - L, 17, 15, -20, tip=9)
    if legs:
        s += nub(doc, 230, 450 - L, 17, 16, 4, tip=9) + nub(doc, 270, 450 - L, 17, 16, -4, tip=9)
    return s


def H(doc, rot=0, lift=0, **kw):
    return place(head(doc, **kw), HX, HY - lift, HS, rot)


def wiggle(x, y, side=1):
    return "".join(f'<path d="M{f(x + side*(10+i*10))},{f(y - 18 + i*3)} q{f(side*8)},18 0,{f(36 - i*6)}" fill="none" '
                   f'stroke="{FUR_D}" stroke-width="4" stroke-linecap="round" opacity="{0.8 - i*0.25}"/>' for i in range(2))


def pose_wave():
    d = Doc(500, 520)
    s = ground() + body(d, legs=False, tail=True)
    s += nub(d, 230, 450, 17, 16, 4, tip=9) + nub(d, 270, 450, 17, 16, -4, tip=9)
    s += nub(d, 204, 352, 14, 20, 18, tip=8)
    s += H(d, rot=-6, mouth_kind="open")
    s += limb(d, 282, 340, 326, 290, w=34, tip=12, shadow=False)
    s += wiggle(344, 268)
    d.add(s); return d


def pose_cheer():
    d = Doc(500, 520)
    lift = 26
    s = ground(rx=95, ry=9) + body(d, legs=False, hind=False, lift=lift)
    s += nub(d, 192, 450 - lift, 15, 17, 30, tip=9) + nub(d, 308, 450 - lift, 15, 17, -30, tip=9)
    s += nub(d, 232, 452 - lift, 15, 18, 6, tip=9) + nub(d, 268, 452 - lift, 15, 18, -6, tip=9)
    s += limb(d, 216, 340 - lift, 172, 292 - lift, w=34, tip=12, shadow=False) + limb(d, 284, 340 - lift, 328, 292 - lift, w=34, tip=12, shadow=False)
    s += H(d, lift=lift, eyes=("happy", "happy"), mouth_kind="open")
    for (x, y, r, c) in [(92, 210, 14, GOLD), (410, 196, 12, "#FF7A85"), (74, 330, 9, "#4CC9F0"), (430, 330, 10, GOLD), (380, 70, 8, "#7BD389")]:
        s += sparkle(x, y, r, c)
    d.add(s); return d


def pose_heart():
    d = Doc(500, 520)
    s = ground() + body(d)
    s += H(d, rot=5, eyes=("happy", "happy"))
    s += heart(d, 250, 400, size=104)
    s += nub(d, 204, 392, 14, 20, -20, tip=8) + nub(d, 296, 392, 14, 20, 20, tip=8)
    s += sparkle(108, 300, 13, "#FF7A85") + sparkle(398, 250, 10, GOLD)
    d.add(s); return d


def pose_santa():
    d = Doc(500, 540)
    s = '<g transform="translate(0 30)">' + ground() + body(d, tail=True)
    s += H(d, rot=-4, ear_angle=62, hat=santa_hat(d))
    s += gift(d, 250, 404, size=110)
    s += nub(d, 198, 398, 14, 20, -15, tip=8) + nub(d, 302, 398, 14, 20, 15, tip=8)
    s += "</g>"
    d.add(s); return d


def pose_cocoa():
    d = Doc(500, 520)
    s = ground() + body(d)
    s += scarf(d, 250, 266, 112)
    s += H(d, rot=6, front=glasses())
    s += mug(d, 244, 402, size=76)
    s += nub(d, 212, 404, 13, 18, -25, tip=8) + nub(d, 280, 408, 13, 18, 25, tip=8)
    d.add(s); return d


def pose_lights():
    d = Doc(500, 520)
    s = ground() + body(d)
    s += light_string([(170, 358), (218, 376), (276, 380), (330, 362), (342, 396)], seed=0)
    s += light_string([(150, 430), (200, 446), (258, 452), (312, 446), (350, 428)], seed=3)
    s += H(d, rot=-3, mouth_kind="o")
    s += light_string([(204, 290), (234, 304), (268, 306), (298, 290)], seed=1, bulb=9)
    d.add(s); return d


def pose_peek():
    d = Doc(420, 470)
    s = blob(d, cloud(212, 420, 54, 150, 10, 18, seed=41), FUR, FUR_S, dx=-6, dy=-8,
             extra=f'<ellipse cx="212" cy="296" rx="54" ry="16" fill="{FUR_D}" opacity="0.35"/>')
    s += place(head(d, eyes=("happy", "dot"), mouth_kind="open", ear_angle=24), 204, 190, 1.3, -12)
    d.add(s); return d


def pose_reindeer():
    d = Doc(400, 400)
    h = head(d, eyes=("dot", "happy"), mouth_kind="open", ear_angle=52, nose="#E2444A", behind=antlers(),
             front='<circle cx="0" cy="23" r="16" fill="#FF5A5F" opacity="0.18"/>')
    d.add(place(h, 200, 236, 1.3, -6)); return d


def pose_head():
    d = Doc(400, 400)
    d.add(place(head(d), 200, 214, 1.35)); return d


def held(d, item, l, r):
    """Hold an item in front of the chest: item first, then the two round hands on its sides."""
    return item + nub(d, l[0], l[1], 14, 20, l[2], tip=8) + nub(d, r[0], r[1], 14, 20, r[2], tip=8)


def pose_study():
    d = Doc(500, 520)
    s = body(d)
    s += H(d, rot=-4, front=glasses())
    book = (blob(d, [("p", "M250,372 L176,352 L176,432 L250,452 Z", (176, 352, 250, 452))], "#4A86D4", "#2F63A8", dx=-3, dy=-3)
            + blob(d, [("p", "M250,372 L324,352 L324,432 L250,452 Z", (250, 352, 324, 452))], "#4A86D4", "#2F63A8", dx=-3, dy=-3)
            + '<path d="M250,366 L184,348 L184,424 L250,442 Z" fill="#FFF9F1"/><path d="M250,366 L316,348 L316,424 L250,442 Z" fill="#FFF3E4"/>'
            + "".join(f'<path d="M{196},{372+i*14} L{238},{383+i*14} M{262},{383+i*14} L{304},{372+i*14}" stroke="#D9CBB8" stroke-width="3" stroke-linecap="round"/>' for i in range(4)))
    s += held(d, book, (186, 404, -20), (314, 404, 20))
    s += sparkle(380, 250, 11, GOLD)
    d.add(s); return d


# ---------------- halloween ----------------
def pose_witch():
    d = Doc(500, 640)
    s = '<g transform="translate(0 110)">' + body(d, tail=True)
    s += H(d, rot=-5, ear_angle=60, hat=witch_hat(d), mouth_kind="open")
    bucket = f'<path d="M204,368 Q250,318 296,368" fill="none" stroke="{BLACK}" stroke-width="6"/>' + jack_o_lantern(d, 250, 404, 50)
    s += held(d, bucket, (200, 402, -15), (300, 402, 15))
    s += "</g>"
    d.add(s); return d


def pose_vampire():
    d = Doc(520, 540)
    cape = blob(d, [("p", "M190,280 C140,350 120,430 136,476 L364,476 C380,430 360,350 310,280 Z", (120, 280, 380, 476))], BLACK, BLACK_S, dx=-6, dy=-4,
                extra='<path d="M150,470 L350,470 L350,480 L150,480 Z" fill="#B3202D"/>')
    collar = f'<g transform="translate(250 262) scale(1.2)">{vampire_collar(d)}</g>'
    s = cape + collar + body(d)
    fang_front = '<g transform="translate(0 32) scale(0.7)">' + fangs() + '</g>'
    s += H(d, rot=4, front=fang_front, mouth_kind="smile")
    s += f'<g transform="translate(10 0)">{bat(d, 408, 120, 0.7)}</g>{bat(d, 96, 200, 0.5)}'
    d.add(f'<g transform="translate(10 0)">{s}</g>'); return d


def pose_pumpkin_hug():
    d = Doc(500, 520)
    s = body(d)
    s += H(d, rot=6, eyes=("happy", "happy"), mouth_kind="open", hat=cat_ears(d))
    s += held(d, jack_o_lantern(d, 250, 410, 70), (176, 404, -25), (324, 404, 25))
    d.add(s); return d


def pose_ghost_friend():
    d = Doc(560, 520)
    s = body(d, legs=False)
    s += nub(d, 230, 450, 17, 16, 4, tip=9) + nub(d, 270, 450, 17, 16, -4, tip=9)
    s += nub(d, 204, 352, 14, 20, 18, tip=8)
    s += H(d, rot=-6, eyes=("dot", "dot"), mouth_kind="o")
    s += limb(d, 282, 340, 326, 290, w=34, tip=12, shadow=False)
    s += ghost(d, 420, 220, 0.95)
    d.add(s); return d


# ---------------- thanksgiving ----------------
def pie(d, cx, cy, k=1.0):
    s = blob(d, [("e", cx, cy, 70 * k, 28 * k)], "#E3A35A", "#C1823C", dx=-4, dy=-4)
    s += f'<ellipse cx="{cx}" cy="{cy-7*k}" rx="{60*k}" ry="{20*k}" fill="#C8682A"/>'
    s += blob(d, cloud(cx + 12 * k, cy - 14 * k, 14 * k, 8 * k, 6, 6 * k, seed=4), "#FFFFFF", "#E9DCC6", dx=-2, dy=-2)
    return s


def pose_pilgrim():
    d = Doc(500, 620)
    s = '<g transform="translate(0 90)">' + body(d, tail=True)
    s += H(d, rot=-4, ear_angle=60, hat=pilgrim_hat(d))
    s += held(d, pie(d, 250, 408, 1.15), (182, 404, -30), (318, 404, 30))
    s += "</g>"
    d.add(s); return d


def autumn_scarf(d):
    return scarf(d, 250, 266, 112).replace(RED, ORANGE).replace(RED_S, "#CF6D12")


def pose_autumn():
    d = Doc(500, 540)
    s = '<g transform="translate(0 20)">' + body(d)
    s += autumn_scarf(d)
    s += H(d, rot=5, eyes=("happy", "dot"), mouth_kind="open", hat=leaf_crown(d))
    s += held(d, maple(250, 408, 44, -10, "#E2552C", "#B83E1B"), (200, 410, -20), (300, 410, 20))
    s += maple(88, 150, 20, 30, "#F2BE32", "#D29A16") + maple(420, 230, 18, -20, "#F28C28", "#CF6D12")
    s += "</g>"
    d.add(s); return d


def pose_turkey():
    d = Doc(560, 660)
    lift = 26
    s = '<g transform="translate(30 130)">' + body(d, legs=False, hind=False, lift=lift)
    s += nub(d, 192, 450 - lift, 15, 17, 30, tip=9) + nub(d, 308, 450 - lift, 15, 17, -30, tip=9)
    s += nub(d, 232, 452 - lift, 15, 18, 6, tip=9) + nub(d, 268, 452 - lift, 15, 18, -6, tip=9)
    s += limb(d, 216, 340 - lift, 172, 292 - lift, w=34, tip=12, shadow=False) + limb(d, 284, 340 - lift, 328, 292 - lift, w=34, tip=12, shadow=False)
    s += H(d, lift=lift, eyes=("happy", "happy"), mouth_kind="open", behind=turkey_feathers(d))
    s += "</g>"
    d.add(s); return d


POSES = {
    "everyday": [
        ("alpaca-wave", "Waving hello", pose_wave), ("alpaca-cheer", "Jumping for joy", pose_cheer),
        ("alpaca-heart", "Big heart", pose_heart), ("alpaca-study", "Study buddy", pose_study),
        ("alpaca-peek", "Photobomb", pose_peek),
    ],
    "halloween": [
        ("alpaca-witch", "Little witch", pose_witch), ("alpaca-vampire", "Count Alpaca", pose_vampire),
        ("alpaca-pumpkin", "Pumpkin hug", pose_pumpkin_hug), ("alpaca-ghost", "Ghost friend", pose_ghost_friend),
    ],
    "thanksgiving": [
        ("alpaca-pilgrim", "Pie time", pose_pilgrim), ("alpaca-autumn", "Autumn leaves", pose_autumn),
        ("alpaca-turkey", "Turkey dance", pose_turkey),
    ],
    "holidays": [
        ("alpaca-santa", "Santa with a gift", pose_santa), ("alpaca-cocoa", "Cozy cocoa", pose_cocoa),
        ("alpaca-lights", "Tangled in lights", pose_lights), ("alpaca-reindeer", "Reindeer wink", pose_reindeer),
    ],
}

if __name__ == "__main__":
    import sys, os
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for th, items in POSES.items():
        for slug, name, fn in items:
            open(os.path.join(out, slug + ".svg"), "w").write(fn().svg())
    print("ok")

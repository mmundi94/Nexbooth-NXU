"""Build all Nexbooth artwork: writes SVG files into assets/ and bundles everything into js/assets.js.
Run:  python3 tools/art/build.py   (needs: pip install playwright && playwright install chromium)"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Doc
from alpaca import head, santa_hat, antlers, glasses
from headwear import *
from poses import POSES, pose_head
from props import PROPS
from stickers import STICKERS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
A = os.path.join(ROOT, "assets")

# lens items: id, name, anchor, drawing (head-local coordinates)
LENS_ITEMS = [
    ("alpaca-ears", "Alpaca ears", "head", lambda d: alpaca_ears(d)),
    ("party-hat", "Party hat", "head", lambda d: party_hat(d)),
    ("crown", "Crown", "head", lambda d: crown(d)),
    ("grad-cap", "Grad cap", "head", lambda d: grad_cap(d)),
    ("shades", "Shades", "eyes", lambda d: shades()),
    ("heart-glasses", "Heart glasses", "eyes", lambda d: heart_glasses()),
    ("specs", "Nexford specs", "eyes", lambda d: glasses(color="#2E2420")),
    ("mustache", "Mustache", "mouth", lambda d: mustache()),
    ("witch-hat", "Witch hat", "head", lambda d: witch_hat(d)),
    ("pumpkin-hat", "Pumpkin hat", "head", lambda d: pumpkin_hat(d)),
    ("devil-horns", "Devil horns", "head", lambda d: devil_horns(d)),
    ("cat-ears", "Cat ears", "head", lambda d: cat_ears(d)),
    ("fangs", "Fangs", "lip", lambda d: '<g transform="translate(0 32)">' + fangs() + "</g>"),
    ("pilgrim-hat", "Pilgrim hat", "head", lambda d: pilgrim_hat(d)),
    ("leaf-crown", "Leaf crown", "head", lambda d: leaf_crown(d)),
    ("turkey-feathers", "Turkey feathers", "head", lambda d: turkey_feathers(d)),
    ("chef-hat", "Chef hat", "head", lambda d: chef_hat(d)),
    ("beanie", "Cozy beanie", "head", lambda d: beanie(d)),
    ("santa-hat", "Santa hat", "head", lambda d: santa_hat(d)),
    ("santa-beard", "Santa beard", "mouth", lambda d: santa_beard(d)),
    ("antlers", "Antlers", "head", lambda d: antlers()),
    ("red-nose", "Red nose", "nose", lambda d: red_nose()),
    ("elf-hat", "Elf hat", "head", lambda d: elf_hat(d)),
    ("earmuffs", "Earmuffs", "head", lambda d: earmuffs(d)),
    ("star-glasses", "Star glasses", "eyes", lambda d: star_glasses()),
]
ANCHOR_LOCAL = {"head": (0, -50), "eyes": (0, 6), "nose": (0, 24), "mouth": (0, 31), "lip": (0, 32)}


def crop_all(items):
    """Crop each SVG to its artwork; returns crop boxes (x0, y0, W, H) in doc units."""
    from playwright.sync_api import sync_playwright
    boxes = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        for it in items:
            svg = it["svg"]
            x, y, w, h, VW, VH = pg.evaluate("""(svg) => { document.body.innerHTML = svg; const el = document.querySelector('svg');
                const bb = el.getBBox(); const vb = el.viewBox.baseVal; return [bb.x, bb.y, bb.width, bb.height, vb.width, vb.height]; }""", svg)
            m = 12
            x0, y0 = max(0, x - m), max(0, y - m)
            x1, y1 = min(VW, x + w + m), min(VH, y + h + m)
            W, H = round(x1 - x0), round(y1 - y0)
            x0, y0 = round(x0), round(y0)
            it["svg"] = re.sub(r'^<svg ([^>]*?)width="[^"]+" height="[^"]+" viewBox="[^"]+"',
                               f'<svg \\1width="{W}" height="{H}" viewBox="{x0} {y0} {W} {H}"', svg, count=1)
            boxes.append((x0, y0, W, H))
        b.close()
    return boxes


def main():
    bundle = {"alpacas": {}, "stickers": {}, "lens": {}, "logo": ""}
    everything = []
    for theme, items in POSES.items():
        bundle["alpacas"][theme] = [{"id": i, "name": n, "svg": fn().svg()} for i, n, fn in items]
        everything += [("alpacas", x) for x in bundle["alpacas"][theme]]
    for theme, items in STICKERS.items():
        bundle["stickers"][theme] = [{"id": i, "name": n, "svg": fn().svg()} for i, n, fn in items]
        everything += [("stickers", x) for x in bundle["stickers"][theme]]
    bundle["stickers"]["holidays"] = [{"id": i, "name": n, "svg": fn().svg()} for i, n, fn in PROPS]
    everything += [("stickers", x) for x in bundle["stickers"]["holidays"]]
    lens_list = []
    for i, n, anchor, fn in LENS_ITEMS:
        d = Doc(700, 700, border=4 if anchor == "head" else 0)
        d.add(f'<g transform="translate(350 380)">{fn(d)}</g>')
        lens_list.append({"id": i, "name": n, "anchor": anchor, "svg": d.svg()})
    everything += [("lens", x) for x in lens_list]
    logo = {"id": "logo", "svg": Doc(400, 400).svg()}
    d = Doc(400, 400); from kit import place
    d.add(place(head(d), 200, 214, 1.35)); logo["svg"] = d.svg()
    everything.append(("logo", logo))

    boxes = crop_all([x for _, x in everything])
    for (kind, it), (x0, y0, W, H) in zip(everything, boxes):
        if kind == "lens":
            ax, ay = ANCHOR_LOCAL[it["anchor"]]
            it.update({"ox": 350 - x0, "oy": 380 - y0, "w": W, "h": H, "ax": ax, "ay": ay})
    for it in lens_list:
        bundle["lens"][it["id"]] = it
    bundle["logo"] = logo["svg"]

    for sub in ("alpacas", "stickers", "lens"):
        os.makedirs(os.path.join(A, sub), exist_ok=True)
        for fn_ in os.listdir(os.path.join(A, sub)):
            os.remove(os.path.join(A, sub, fn_))
    for theme, items in bundle["alpacas"].items():
        for it in items:
            open(os.path.join(A, "alpacas", it["id"] + ".svg"), "w").write(it["svg"])
    for theme, items in bundle["stickers"].items():
        for it in items:
            open(os.path.join(A, "stickers", it["id"] + ".svg"), "w").write(it["svg"])
    for it in lens_list:
        open(os.path.join(A, "lens", it["id"] + ".svg"), "w").write(it["svg"])
    open(os.path.join(A, "nexbooth-logo.svg"), "w").write(bundle["logo"])
    os.makedirs(os.path.join(ROOT, "js"), exist_ok=True)
    with open(os.path.join(ROOT, "js", "assets.js"), "w") as fh:
        fh.write("/* Generated by tools/art/build.py: all Nexbooth artwork (SVG). */\n")
        fh.write("window.NEXBOOTH_ASSETS = " + json.dumps(bundle, separators=(",", ":")) + ";\n")
    n = sum(len(v) for v in bundle["alpacas"].values()), sum(len(v) for v in bundle["stickers"].values()), len(lens_list)
    print("alpacas %d, stickers %d, lens items %d, bundle %d KB" % (*n, os.path.getsize(os.path.join(ROOT, "js", "assets.js")) // 1024))


if __name__ == "__main__":
    main()

/* Nexbooth lenses: draws face-tracked items, face paint, and fun particles. */
window.NexLens = (() => {
  'use strict';
  const TAU = Math.PI * 2;
  let items = {};    // lens item id -> { img, ox, oy, w, h, ax, ay }
  let sprites = {};  // particle sprite name -> Image
  let parts = [];    // live particles (stage-normalized positions)
  const CONFETTI = ['#FF5A7A', '#FFC72C', '#4CC9F0', '#7BD389', '#B983FF', '#FF9F43'];

  function setAssets(i, s) { items = i; sprites = s; }

  // ---------------- particles ----------------
  function spawn(kind, x, y, S, W, H, dir) {
    const r = Math.random;
    const base = { kind, x: x / W, y: y / H, life: 0, rot: r() * TAU, vr: (r() - 0.5) * 6, s: (S / W) * (0.1 + r() * 0.06) };
    const ang = (dir || -Math.PI / 2) + (r() - 0.5) * 1.6, sp = (0.25 + r() * 0.35) * (S / W) * 3.2;
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp * (W / H);
    if (kind === 'confetti') parts.push({ ...base, vx, vy, g: 0.55, max: 1.6, c: CONFETTI[(r() * CONFETTI.length) | 0], s: (S / W) * 0.045 });
    else if (kind === 'snow') parts.push({ ...base, vx: vx * 0.5, vy: vy * 0.4, g: 0.12, max: 2.2, s: (S / W) * (0.06 + r() * 0.06) });
    else if (kind === 'leaves') parts.push({ ...base, vx: vx * 0.7, vy: vy * 0.5, g: 0.18, max: 2.4, sway: r() * TAU, sprite: ['leaf-red', 'leaf-orange', 'leaf-yellow'][(r() * 3) | 0] });
    else if (kind === 'candycorn') parts.push({ ...base, vx, vy, g: 0.7, max: 1.6, s: (S / W) * 0.085 });
    else if (kind === 'hearts') parts.push({ ...base, vx: vx * 0.6, vy: -Math.abs(vy) * 0.8, g: -0.05, max: 1.8, rot: (r() - 0.5) * 0.6, vr: (r() - 0.5) * 1.2, s: (S / W) * (0.07 + r() * 0.05) });
    else if (kind === 'bats') parts.push({ ...base, vx: vx * 1.4, vy: vy * 1.2, g: -0.15, max: 2.2, rot: 0, vr: 0, s: (S / W) * (0.13 + r() * 0.07), flap: r() * TAU });
    else if (kind === 'riseheart') parts.push({ ...base, vx: (r() - 0.5) * 0.02, vy: -0.08 - r() * 0.05, g: 0, max: 2.2, rot: (r() - 0.5) * 0.5, vr: (r() - 0.5) * 0.6, s: (S / W) * (0.06 + r() * 0.05) });
  }

  function update(dt, faces, lens, W, H) {
    if (lens) {
      for (const f of faces) {
        if (lens.mouth && f.mouthOpen > 0.14) {
          const n = Math.random() < dt * 30 ? 1 + ((Math.random() * 2) | 0) : 0;
          for (let i = 0; i < n; i++) spawn(lens.mouth, f.mouthC.x, f.mouthC.y, f.S, W, H, Math.atan2(f.up.y, f.up.x) + Math.PI);
        }
        if (lens.rise === 'heart' && Math.random() < dt * 2.2) {
          const a = (Math.random() - 0.5) * 1.6;
          const cx = f.head.x + f.right.x * Math.sin(a) * f.S * 0.6 + f.up.x * f.S * 0.25;
          const cy = f.head.y + f.right.y * Math.sin(a) * f.S * 0.6 + f.up.y * f.S * 0.25;
          spawn('riseheart', cx, cy, f.S, W, H);
        }
      }
    }
    for (const p of parts) {
      p.life += dt;
      p.vy += p.g * dt * 0.5;
      if (p.sway !== undefined) p.vx += Math.sin(p.life * 3 + p.sway) * dt * 0.05;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    parts = parts.filter((p) => p.life < p.max && p.y < 1.2 && p.y > -0.3 && p.x > -0.3 && p.x < 1.3);
    if (parts.length > 400) parts.splice(0, parts.length - 400);
  }

  function drawParticles(ctx, W, H) {
    for (const p of parts) {
      const a = Math.min(1, (p.max - p.life) / 0.5) * Math.min(1, p.life / 0.08);
      const x = p.x * W, y = p.y * H, s = p.s * W;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.translate(x, y); ctx.rotate(p.rot);
      if (p.kind === 'confetti') {
        ctx.fillStyle = p.c; ctx.fillRect(-s, -s * 0.45, s * 2, s * 0.9);
      } else {
        const key = p.kind === 'snow' ? 'snowflake' : p.kind === 'leaves' ? p.sprite : p.kind === 'candycorn' ? 'candycorn'
          : p.kind === 'bats' ? 'bat' : 'heart';
        const img = sprites[key];
        if (img) {
          const flap = p.kind === 'bats' ? 0.55 + 0.45 * Math.abs(Math.sin(p.life * 14 + p.flap)) : 1;
          const w = s * 2, h = (w * img.naturalHeight) / img.naturalWidth;
          ctx.scale(1, flap);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
      }
      ctx.restore();
    }
  }

  // ---------------- face paint ----------------
  function ellipse(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); }

  function paintFace(ctx, f, kind) {
    const S = f.S;
    ctx.save();
    if (kind === 'blush' || kind === 'rosy' || kind === 'devil') {
      const col = kind === 'devil' ? '226,40,60' : kind === 'rosy' ? '255,90,110' : '255,120,130';
      const alpha = kind === 'rosy' ? 0.42 : 0.35;
      for (const c of [f.cheekL, f.cheekR]) {
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, S * 0.12);
        g.addColorStop(0, `rgba(${col},${alpha})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ellipse(ctx, c.x, c.y, S * 0.12, S * 0.12, 0); ctx.fill();
      }
    }
    if (kind === 'pale' || kind === 'skull') {
      ctx.beginPath();
      f.oval.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = kind === 'skull' ? 'rgba(250,250,255,0.62)' : 'rgba(225,232,255,0.28)';
      ctx.filter = `blur(${Math.max(1, S * 0.02)}px)`;
      ctx.fill();
      ctx.filter = 'none';
    }
    if (kind === 'skull') {
      for (const e of [f.eyeL, f.eyeR]) {
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, S * 0.17);
        g.addColorStop(0, 'rgba(25,18,30,0.9)'); g.addColorStop(0.7, 'rgba(25,18,30,0.75)'); g.addColorStop(1, 'rgba(25,18,30,0)');
        ctx.fillStyle = g; ellipse(ctx, e.x, e.y, S * 0.17, S * 0.17, 0); ctx.fill();
      }
      // nose
      const n = f.nose, k = S * 0.06;
      ctx.translate(n.x, n.y); ctx.rotate(f.roll);
      ctx.fillStyle = 'rgba(25,18,30,0.85)';
      ctx.beginPath(); ctx.moveTo(0, k * 0.9); ctx.bezierCurveTo(-k * 1.4, -k * 0.2, -k * 0.6, -k * 1.2, 0, -k * 0.5);
      ctx.bezierCurveTo(k * 0.6, -k * 1.2, k * 1.4, -k * 0.2, 0, k * 0.9); ctx.fill();
      ctx.restore(); ctx.save();
      // stitched mouth
      const a = f.P(61), b = f.P(291);
      ctx.strokeStyle = 'rgba(25,18,30,0.85)'; ctx.lineWidth = Math.max(1.5, S * 0.012); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      for (let i = 1; i < 8; i++) {
        const t = i / 8, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, l = S * 0.035;
        ctx.beginPath(); ctx.moveTo(x - f.up.x * l, y - f.up.y * l); ctx.lineTo(x + f.up.x * l, y + f.up.y * l); ctx.stroke();
      }
    }
    if (kind === 'whiskers') {
      ctx.strokeStyle = 'rgba(30,25,35,0.85)'; ctx.lineWidth = Math.max(1.5, S * 0.011); ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        const ox = f.nose.x + f.right.x * side * S * 0.13 - f.up.x * S * 0.04;
        const oy = f.nose.y + f.right.y * side * S * 0.13 - f.up.y * S * 0.04;
        for (const ang of [-0.22, 0, 0.22]) {
          const dx = f.right.x * side, dy = f.right.y * side;
          const a = ang * side;
          const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a);
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + rx * S * 0.34, oy + ry * S * 0.34); ctx.stroke();
        }
      }
      const n = f.nose, k = S * 0.05;
      ctx.translate(n.x, n.y); ctx.rotate(f.roll);
      ctx.fillStyle = '#FF8FB3';
      ctx.beginPath(); ctx.moveTo(-k, -k * 0.5); ctx.lineTo(k, -k * 0.5); ctx.quadraticCurveTo(k * 0.2, k * 0.9, 0, k * 0.9); ctx.quadraticCurveTo(-k * 0.2, k * 0.9, -k, -k * 0.5); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------- items ----------------
  function drawItem(ctx, f, spec) {
    const it = items[spec.id];
    if (!it || !it.img) return;
    const anchor = f[it.anchor] || f.head;
    const u = (f.S / 112) * (spec.scale || 1);
    ctx.save();
    ctx.translate(anchor.x, anchor.y);
    ctx.rotate(f.roll);
    ctx.scale(u, u);
    ctx.translate(spec.dx || 0, spec.dy || 0);
    ctx.drawImage(it.img, -(it.ox + it.ax), -(it.oy + it.ay), it.w, it.h);
    ctx.restore();
  }

  function drawOrbit(ctx, f, kind, time) {
    const n = kind === 'sparkle' ? 6 : kind === 'leaf' ? 5 : 3;
    const cx = f.eyes.x + f.up.x * f.S * 0.25, cy = f.eyes.y + f.up.y * f.S * 0.25;
    for (let i = 0; i < n; i++) {
      const a = time * (kind === 'sparkle' ? 0.9 : 1.2) + (i * TAU) / n;
      const depth = (Math.sin(a) + 1) / 2;
      const rx = f.S * 0.82, ry = f.S * 0.3;
      const x = cx + f.right.x * Math.cos(a) * rx + f.up.x * Math.sin(a) * ry + f.up.x * f.S * 0.25;
      const y = cy + f.right.y * Math.cos(a) * rx + f.up.y * Math.sin(a) * ry + f.up.y * f.S * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.45 * depth;
      ctx.translate(x, y);
      if (kind === 'sparkle') {
        const r = f.S * (0.035 + 0.03 * Math.abs(Math.sin(time * 3 + i)));
        ctx.fillStyle = '#FFF2B0'; ctx.shadowColor = 'rgba(255,220,120,.9)'; ctx.shadowBlur = r;
        ctx.beginPath(); ctx.moveTo(0, -r * 2); ctx.quadraticCurveTo(0, 0, r * 2, 0); ctx.quadraticCurveTo(0, 0, 0, r * 2);
        ctx.quadraticCurveTo(0, 0, -r * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -r * 2); ctx.fill();
      } else {
        const key = kind === 'leaf' ? ['leaf-red', 'leaf-orange', 'leaf-yellow'][i % 3] : kind;
        const img = sprites[key];
        if (img) {
          const w = f.S * (kind === 'ghost' ? 0.42 : kind === 'bat' ? 0.5 : 0.28) * (0.75 + 0.25 * depth);
          const h = (w * img.naturalHeight) / img.naturalWidth;
          if (kind === 'bat') ctx.scale(1, 0.6 + 0.4 * Math.abs(Math.sin(time * 12 + i)));
          if (kind === 'leaf') ctx.rotate(time * 2 + i);
          if (kind === 'ghost') ctx.rotate(Math.sin(time * 2 + i) * 0.2);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
      }
      ctx.restore();
    }
  }

  function draw(ctx, faces, lens, time, W, H) {
    if (lens) {
      for (const f of faces) {
        ctx.save();
        ctx.globalAlpha = f.fade;
        (lens.paint || []).forEach((k) => paintFace(ctx, f, k));
        (lens.items || []).forEach((spec) => drawItem(ctx, f, spec));
        if (lens.orbit) drawOrbit(ctx, f, lens.orbit, time);
        ctx.restore();
      }
    }
    drawParticles(ctx, W, H);
  }

  return { setAssets, update, draw, clear: () => (parts = []), get particles() { return parts.length; } };
})();

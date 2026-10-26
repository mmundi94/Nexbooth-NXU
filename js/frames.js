/* Nexbooth frames: drawn with code so they fit any photo size. */
window.NexFrames = (() => {
  'use strict';
  const TAU = Math.PI * 2;
  const DATE_LABEL = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const BULBS = ['#FF4B5C', '#FFD23F', '#3EC1D3', '#7BD389', '#FF8C42', '#B983FF'];
  const HOLLY_LEAF = typeof Path2D !== 'undefined' ? new Path2D('M0,0 C10,-8 18,-6 26,-14 C26,-6 34,-2 36,4 C28,6 24,14 16,12 C14,6 6,6 0,0Z') : null;

  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function borderPath(ctx, W, H, l, t, r, b, rad) {
    ctx.beginPath(); ctx.rect(0, 0, W, H);
    const x = l, y = t, w = W - l - r, h = H - t - b;
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x, y, x, y + h, rad); ctx.arcTo(x, y + h, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x + w, y, rad); ctx.arcTo(x + w, y, x, y, rad);
    ctx.closePath();
  }
  function img(ctx, im, x, y, w, rot = 0, alpha = 1) {
    if (!im) return;
    const h = (w * im.naturalHeight) / im.naturalWidth;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
  }
  function fit(ctx, text, font, size, max) {
    ctx.font = `${font.replace('{s}', size)}`;
    const w = ctx.measureText(text).width;
    if (w > max) { size *= max / w; ctx.font = `${font.replace('{s}', size)}`; }
    return size;
  }

  function drawBulb(ctx, x, y, u, color, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createRadialGradient(0, 2.6 * u, 0, 0, 2.6 * u, 6 * u);
    g.addColorStop(0, color + 'AA'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 2.6 * u, 6 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1F4A2E'; roundRect(ctx, -0.75 * u, -0.2 * u, 1.5 * u, 1.3 * u, 0.25 * u); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 2.7 * u, 1.45 * u, 2.1 * u, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(-0.5 * u, 2.1 * u, 0.35 * u, 0.7 * u, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawLightString(ctx, W, u, y0, sag, phase = 0) {
    const n = Math.max(6, Math.round(W / (13 * u))), seg = W / n;
    ctx.save(); ctx.strokeStyle = '#173A25'; ctx.lineWidth = 0.55 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-u, y0);
    for (let i = 0; i < n; i++) ctx.quadraticCurveTo(seg * (i + 0.5), y0 + sag * 2, seg * (i + 1), y0);
    ctx.stroke(); ctx.restore();
    for (let i = 0; i < n; i++) drawBulb(ctx, seg * (i + 0.5), y0 + sag, u, BULBS[(i + phase) % BULBS.length], (i % 2 ? 1 : -1) * 0.18);
  }
  function drawHolly(ctx, x, y, s, rot = 0) {
    if (!HOLLY_LEAF) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 40, s / 40);
    ctx.lineWidth = 2; ctx.strokeStyle = '#2A7550'; ctx.lineCap = 'round';
    for (const r of [-2.8, -0.35, 1.3]) {
      ctx.save(); ctx.rotate(r); ctx.fillStyle = '#3D9A6A'; ctx.fill(HOLLY_LEAF);
      ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(30, -2); ctx.stroke(); ctx.restore();
    }
    for (const [bx, by] of [[-7, -4], [6, -6], [0, 6]]) {
      ctx.fillStyle = '#E2444A'; ctx.beginPath(); ctx.arc(bx, by, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(bx - 3, by - 3, 2.2, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function drawFlake(ctx, x, y, r, color = '#fff', lw = 0.5) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      ctx.rotate(Math.PI / 3); ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, -r);
      ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.25, -r * 0.8);
      ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.25, -r * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawBow(ctx, x, y, s, color = '#E2444A') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40); ctx.fillStyle = color;
    const loop = (d) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(d * 22, -22, d * 34, 2, 0, 0); ctx.fill(); };
    const tail = (d) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(d * 14, 26); ctx.lineTo(d * 6, 24); ctx.closePath(); ctx.fill(); };
    tail(-1); tail(1); loop(-1); loop(1);
    ctx.fillStyle = '#B92F37'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawCobweb(ctx, x, y, r, flipX, flipY) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1, r * 0.012); ctx.lineCap = 'round';
    const spokes = 5;
    for (let i = 0; i <= spokes; i++) {
      const a = (i / spokes) * (Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
    }
    for (let k = 1; k <= 4; k++) {
      const rr = (r * k) / 4.4;
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const a = (i / spokes) * (Math.PI / 2), x1 = Math.cos(a) * rr, y1 = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x1, y1);
        else {
          const am = ((i - 0.5) / spokes) * (Math.PI / 2), rm = rr * 0.86;
          ctx.quadraticCurveTo(Math.cos(am) * rm, Math.sin(am) * rm, x1, y1);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function pill(ctx, W, H, u, line1, line2, opts = {}) {
    const align = opts.align || 'left', accent = opts.accent || '#FFC72C', bg = opts.bg || 'rgba(8, 20, 16, .74)';
    ctx.save();
    ctx.font = `700 ${4 * u}px Fredoka, Nunito, sans-serif`; const w1 = ctx.measureText(line1).width;
    ctx.font = `800 ${2.4 * u}px Nunito, sans-serif`; const w2 = ctx.measureText(line2).width;
    const logoS = opts.logo ? 10 * u : 0, padX = 2.4 * u;
    const pw = logoS + padX * 2.2 + Math.max(w1, w2) + (opts.logo ? u : 0), ph = 12 * u;
    const x = align === 'left' ? 3 * u : W - 3 * u - pw, y = opts.top ? 3 * u : H - 3 * u - ph;
    ctx.fillStyle = bg; roundRect(ctx, x, y, pw, ph, ph / 2); ctx.fill();
    if (opts.logo) ctx.drawImage(opts.logo, x + padX * 0.5, y + 0.6 * u, logoS + u, logoS + u);
    const tx = x + padX * 0.8 + (opts.logo ? logoS + u : padX * 0.4);
    ctx.fillStyle = accent; ctx.font = `700 ${4 * u}px Fredoka, Nunito, sans-serif`; ctx.fillText(line1, tx, y + 5.6 * u);
    ctx.fillStyle = '#FFF8EC'; ctx.font = `800 ${2.4 * u}px Nunito, sans-serif`; ctx.fillText(line2, tx, y + 9.2 * u);
    ctx.restore();
  }
  const accentOf = (theme) => ({ halloween: '#FF8A1F', thanksgiving: '#F6B04A', holidays: '#FFC72C' }[theme.id] || '#FFC72C');

  const FRAMES = {
    none: { name: 'No frame', draw() {} },

    classic: {
      name: 'Instant photo',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100, side = 3.6 * u, bottom = 17 * u;
        ctx.save();
        borderPath(ctx, W, H, side, side, side, bottom, 0.8 * u);
        ctx.fillStyle = '#FFFBF2'; ctx.fill('evenodd');
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.35 * u;
        ctx.strokeRect(side, side, W - side * 2, H - side - bottom);
        ctx.fillStyle = '#2B2B2B';
        const cap = theme.id === 'everyday' ? 'Hello from Team Nexford!' : theme.caption.title + '!';
        const fs = fit(ctx, cap, '700 {s}px Caveat, "Comic Sans MS", cursive', 8.4 * u, W - side * 2 - 42 * u);
        ctx.fillText(cap, side + 1.5 * u, H - bottom / 2 + fs / 3);
        ctx.fillStyle = '#9A8C78'; ctx.font = `800 ${2.6 * u}px Nunito, sans-serif`; ctx.textAlign = 'right';
        const lx = W - side - 1.5 * u;
        if (im.logo) ctx.drawImage(im.logo, lx - 11.5 * u, H - bottom + 0.8 * u, 11.5 * u, 11.5 * u);
        ctx.fillText(DATE_LABEL, lx - 13 * u, H - bottom / 2 + 1 * u);
        ctx.restore();
      },
    },

    gold: {
      name: 'Nexford gold',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100, t = 3 * u, bar = 11 * u;
        ctx.save(); borderPath(ctx, W, H, t, t, t, bar, 2 * u); ctx.fillStyle = '#FFC72C'; ctx.fill('evenodd'); ctx.restore();
        if (im.logo) ctx.drawImage(im.logo, t + 0.5 * u, H - bar - 0.4 * u, bar + 0.8 * u, bar + 0.8 * u);
        ctx.fillStyle = '#1A1405'; ctx.font = `700 ${5.6 * u}px Fredoka, Nunito, sans-serif`;
        ctx.fillText('Nexbooth', t + bar + 2 * u, H - bar / 2 + 2 * u);
        ctx.textAlign = 'right';
        const msg = theme.id === 'everyday' ? 'Hello from Team Nexford' : `${theme.caption.title} from Nexford`;
        fit(ctx, msg, '800 {s}px Nunito, sans-serif', 2.9 * u, W * 0.5);
        ctx.fillText(msg, W - t - 1.5 * u, H - bar / 2 + 1 * u);
        ctx.textAlign = 'start';
      },
    },

    confetti: {
      name: 'Confetti',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100, r = seeded(9), cols = ['#FF5A7A', '#FFC72C', '#4CC9F0', '#7BD389', '#B983FF', '#FF9F43'];
        for (let i = 0; i < 140; i++) {
          let x = r() * W, y = r() * H;
          const edge = r();
          if (edge < 0.3) y = r() * 12 * u; else if (edge < 0.55) y = H - r() * 10 * u; else if (edge < 0.78) x = r() * 8 * u; else x = W - r() * 8 * u;
          ctx.save(); ctx.translate(x, y); ctx.rotate(r() * TAU); ctx.fillStyle = cols[i % cols.length];
          if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 0.7 * u, 0, TAU); ctx.fill(); } else ctx.fillRect(-1.2 * u, -0.5 * u, 2.4 * u, 1 * u);
          ctx.restore();
        }
        pill(ctx, W, H, u, theme.caption.title, theme.caption.sub, { logo: im.logo, accent: accentOf(theme) });
      },
    },

    minimal: {
      name: 'Simple',
      draw(ctx, W, H, im) {
        const u = Math.min(W, H) / 100;
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 0.6 * u;
        roundRect(ctx, 2.5 * u, 2.5 * u, W - 5 * u, H - 5 * u, 2 * u); ctx.stroke();
        if (im.logo) ctx.drawImage(im.logo, W - 14 * u, H - 14.5 * u, 10 * u, 10 * u);
        ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = u;
        ctx.font = `700 ${3.4 * u}px Fredoka, Nunito, sans-serif`; ctx.textAlign = 'right';
        ctx.fillText('Nexbooth', W - 15 * u, H - 7.4 * u);
        ctx.restore();
      },
    },

    // ---------- halloween ----------
    spooky: {
      name: 'Spooky night',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100;
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
        g.addColorStop(0, 'rgba(40,10,60,0)'); g.addColorStop(1, 'rgba(30,8,50,0.78)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        img(ctx, im.moon, W - 13 * u, 13 * u, 15 * u, 0.2, 0.95);
        drawCobweb(ctx, 0, 0, 20 * u, false, false);
        drawCobweb(ctx, W, 0, 14 * u, true, false);
        img(ctx, im.bat, W - 30 * u, 9 * u, 10 * u, -0.2);
        img(ctx, im.bat, W - 22 * u, 24 * u, 7 * u, 0.25);
        img(ctx, im.bat, 24 * u, 8 * u, 7 * u, 0.15);
        pill(ctx, W, H, u, theme.caption.title, theme.caption.sub, { logo: im.logo, accent: '#FF8A1F', bg: 'rgba(28,10,40,.78)' });
      },
    },
    pumpkins: {
      name: 'Pumpkin patch',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100;
        const g = ctx.createLinearGradient(0, H - 26 * u, 0, H);
        g.addColorStop(0, 'rgba(20,8,30,0)'); g.addColorStop(1, 'rgba(20,8,30,.8)');
        ctx.fillStyle = g; ctx.fillRect(0, H - 26 * u, W, 26 * u);
        const spots = [[0.06, 15, -0.15], [0.17, 10, 0.1], [0.83, 11, -0.1], [0.94, 16, 0.12]];
        for (const [fx, s, rot] of spots) img(ctx, fx < 0.5 && s < 12 ? im.pumpkin : im.jack, W * fx, H - s * u * 0.45, s * u, rot);
        img(ctx, im.bat, W * 0.12, 10 * u, 8 * u, -0.2);
        img(ctx, im.bat, W * 0.88, 12 * u, 6 * u, 0.2);
        ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#FF8A1F';
        ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = u;
        fit(ctx, theme.caption.title, '700 {s}px Fredoka, Nunito, sans-serif', 6 * u, W * 0.5);
        ctx.fillText(theme.caption.title, W / 2, H - 6.5 * u);
        ctx.fillStyle = '#FFF4E6'; ctx.font = `800 ${2.4 * u}px Nunito, sans-serif`;
        ctx.fillText(theme.caption.sub, W / 2, H - 2.8 * u);
        ctx.restore();
      },
    },

    // ---------- thanksgiving ----------
    autumn: {
      name: 'Autumn leaves',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100, r = seeded(3);
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
        g.addColorStop(0, 'rgba(120,50,10,0)'); g.addColorStop(1, 'rgba(110,45,10,.45)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const leaves = im.leaves || [];
        const corner = (cx, cy, dirX, dirY) => {
          for (let i = 0; i < 9; i++) {
            const a = r() * Math.PI / 2, d = r() * 16 * u;
            img(ctx, leaves[i % leaves.length], cx + dirX * Math.cos(a) * d, cy + dirY * Math.sin(a) * d, (6 + r() * 6) * u, r() * TAU);
          }
        };
        corner(0, 0, 1, 1); corner(W, 0, -1, 1); corner(W, H, -1, -1);
        pill(ctx, W, H, u, theme.caption.title, theme.caption.sub, { logo: im.logo, accent: '#F6B04A', bg: 'rgba(48,24,10,.78)' });
      },
    },
    harvest: {
      name: 'Harvest table',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100, side = 3.6 * u, bottom = 17 * u;
        ctx.save(); borderPath(ctx, W, H, side, side, side, bottom, 0.8 * u);
        ctx.fillStyle = '#FFF4E3'; ctx.fill('evenodd'); ctx.restore();
        img(ctx, im.pumpkin, side + 7 * u, H - bottom / 2, 11 * u, -0.1);
        img(ctx, im.pie, W - side - 9 * u, H - bottom / 2 + u, 14 * u, 0);
        (im.leaves || []).forEach((l, i) => img(ctx, l, side + 15 * u + i * 3 * u, H - bottom / 2 - 4 * u, 4 * u, i));
        ctx.save(); ctx.fillStyle = '#7A3E12'; ctx.textAlign = 'center';
        const fs = fit(ctx, theme.caption.sub.split('  ·  ')[0], '700 {s}px Caveat, "Comic Sans MS", cursive', 8 * u, W - 60 * u);
        ctx.fillText(theme.caption.sub.split('  ·  ')[0], W / 2, H - bottom / 2 + fs / 3);
        ctx.restore();
      },
    },

    // ---------- holidays ----------
    lights: {
      name: 'Holiday lights',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100;
        const g = ctx.createLinearGradient(0, 0, 0, 16 * u);
        g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, 16 * u);
        drawLightString(ctx, W, u, 1.2 * u, 4.5 * u);
        pill(ctx, W, H, u, theme.caption.title, theme.caption.sub, { logo: im.logo });
      },
    },
    garland: {
      name: 'Pine garland',
      draw(ctx, W, H, im, theme) {
        const u = Math.min(W, H) / 100, r = seeded(7);
        const greens = ['#1E5E3B', '#2F8F5B', '#3FA36B', '#174A2E', '#26774A'];
        const sags = [[-2 * u, 2 * u, W * 0.25, 17 * u, W * 0.5, 3 * u], [W * 0.5, 3 * u, W * 0.75, 17 * u, W + 2 * u, 2 * u]];
        const q = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
        ctx.save(); ctx.lineCap = 'round';
        for (const [x0, y0, cx, cy, x1, y1] of sags) {
          const steps = Math.round(W / (1.3 * u) / 2);
          for (let i = 0; i <= steps; i++) {
            const t = i / steps, x = q(x0, cx, x1, t), y = q(y0, cy, y1, t);
            for (let k = 0; k < 7; k++) {
              const a = r() * TAU, len = (2.8 + r() * 3) * u;
              ctx.strokeStyle = greens[(r() * greens.length) | 0]; ctx.lineWidth = 0.75 * u;
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
            }
          }
          for (let i = 1; i < 10; i++) {
            const t = i / 10, x = q(x0, cx, x1, t) + (r() - 0.5) * 3 * u, y = q(y0, cy, y1, t) + (r() - 0.5) * 3 * u;
            ctx.fillStyle = i % 3 ? '#D8303B' : '#FFD23F'; ctx.beginPath(); ctx.arc(x, y, 0.9 * u, 0, TAU); ctx.fill();
          }
        }
        ctx.restore();
        const hang = (x, y, len, im2, s) => {
          ctx.strokeStyle = '#C98F1C'; ctx.lineWidth = 0.35 * u;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
          if (im2) img(ctx, im2, x, y + len + s * 0.5, s);
        };
        hang(W * 0.25, 10 * u, 4 * u, im.ornRed, 9 * u); hang(W * 0.75, 10 * u, 4 * u, im.ornRed, 9 * u);
        hang(W * 0.12, 6.5 * u, 2.5 * u, im.ornGold, 6 * u); hang(W * 0.38, 7 * u, 2.5 * u, im.ornGold, 6 * u);
        hang(W * 0.62, 7 * u, 2.5 * u, im.ornGold, 6 * u); hang(W * 0.88, 6.5 * u, 2.5 * u, im.ornGold, 6 * u);
        drawBow(ctx, W * 0.5, 3.5 * u, 7 * u);
        pill(ctx, W, H, u, 'Merry & Bright', theme.caption.sub, { logo: im.logo, align: 'right' });
      },
    },
    snowy: {
      name: 'Snowy day',
      draw(ctx, W, H) {
        const u = Math.min(W, H) / 100, r = seeded(11);
        let g = ctx.createLinearGradient(0, 0, 0, 14 * u);
        g.addColorStop(0, 'rgba(235,245,255,.6)'); g.addColorStop(1, 'rgba(235,245,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, 14 * u);
        const pts = []; const n = 7;
        for (let i = 0; i <= n; i++) pts.push([(W / n) * i, H - (7 + r() * 5) * u]);
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [x, y] = pts[i]; ctx.quadraticCurveTo((px + x) / 2, Math.min(py, y) - 4 * u, x, y); }
        ctx.lineTo(W, H); ctx.closePath();
        ctx.save(); ctx.shadowColor = 'rgba(30,70,120,.35)'; ctx.shadowBlur = 2 * u; ctx.shadowOffsetY = -0.4 * u;
        ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
        g = ctx.createLinearGradient(0, H - 12 * u, 0, H);
        g.addColorStop(0, 'rgba(190,215,240,0)'); g.addColorStop(1, 'rgba(190,215,240,.6)'); ctx.fillStyle = g; ctx.fill();
        for (const [fx, fy, fr] of [[5, 6, 3], [12, 13, 1.8], [4, 20, 1.5], [95, 7, 3], [88, 14, 2], [96, 22, 1.6]]) {
          drawFlake(ctx, fx < 50 ? fx * u : W - (100 - fx) * u, fy * u, fr * u, '#FFFFFF', 0.45 * u);
        }
        ctx.fillStyle = '#1F5FA0'; ctx.textAlign = 'center';
        fit(ctx, "Season's Greetings from Nexford", '700 {s}px Fredoka, Nunito, sans-serif', 4.6 * u, W * 0.8);
        ctx.fillText("Season's Greetings from Nexford", W / 2, H - 2.8 * u); ctx.textAlign = 'start';
      },
    },
    candy: {
      name: 'Candy cane',
      draw(ctx, W, H) {
        const u = Math.min(W, H) / 100, t = 3.6 * u;
        ctx.save(); borderPath(ctx, W, H, t, t, t, t, 2 * u); ctx.clip('evenodd');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#D8303B';
        const step = 4.2 * u;
        for (let x = -H; x < W + H; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + step / 2, 0); ctx.lineTo(x + step / 2 + H, H); ctx.lineTo(x + H, H); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        drawHolly(ctx, t + 2.5 * u, t + 2.5 * u, 7 * u, 0.3); drawHolly(ctx, W - t - 2.5 * u, t + 2.5 * u, 7 * u, -0.3);
        const text = 'Merry & Bright';
        ctx.font = `700 ${4.4 * u}px Fredoka, Nunito, sans-serif`;
        const tw = ctx.measureText(text).width, bw = tw + 10 * u, bh = 8 * u, bx = (W - bw) / 2, by = H - t - bh - 1.5 * u;
        ctx.fillStyle = '#D8303B'; roundRect(ctx, bx, by, bw, bh, 1 * u); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText(text, W / 2, by + bh * 0.7); ctx.textAlign = 'start';
      },
    },
  };

  return { FRAMES, drawLightString, drawHolly, drawFlake, drawCobweb, roundRect, seeded, img, DATE_LABEL };
})();

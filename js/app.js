/* Nexbooth: the Nexford photo booth.
   Everything runs in the browser. Photos and face data never leave the device. */
(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const TAU = Math.PI * 2;
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const { FRAMES, drawLightString, drawFlake, roundRect, seeded, DATE_LABEL } = window.NexFrames;
  const THEMES = window.NEXBOOTH_THEMES;
  const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('nexbooth:' + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('nexbooth:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  // ---------------------------------------------------------------------------
  // Artwork (SVG strings from assets.js, turned into same-origin blob URLs)
  // ---------------------------------------------------------------------------
  const A = window.NEXBOOTH_ASSETS;
  const svgUrl = (svg) => URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const art = { alpacas: {}, stickers: {}, lens: {} };
  Object.entries(A.alpacas).forEach(([theme, list]) => list.forEach((a) => (art.alpacas[a.id] = { ...a, theme, url: svgUrl(a.svg) })));
  Object.entries(A.stickers).forEach(([theme, list]) => list.forEach((a) => (art.stickers[a.id] = { ...a, theme, url: svgUrl(a.svg) })));
  Object.values(A.lens).forEach((a) => (art.lens[a.id] = { ...a, url: svgUrl(a.svg) }));
  const logoUrl = svgUrl(A.logo);
  const imgCache = new Map();
  function getImg(url) {
    if (!imgCache.has(url)) imgCache.set(url, loadImage(url));
    return imgCache.get(url);
  }

  const ICONS = {
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.8l6.1-.9z"/></svg>',
    pumpkin: '<svg viewBox="0 0 24 24"><path d="M12 7c-5 0-8 2.5-8 6.5S7 20 12 20s8-2.5 8-6.5S17 7 12 7z"/><path d="M12 7c-1.6 0-2.6 5-2.6 6.5S10.4 20 12 20s2.6-5 2.6-6.5S13.6 7 12 7z"/><path d="M12 7V4.5c0-.8.6-1.5 1.5-1.5"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l8-8"/></svg>',
    snowflake: '<svg viewBox="0 0 24 24"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10M9 3.5L12 6l3-2.5M9 20.5L12 18l3 2.5"/></svg>',
    none: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/></svg>',
    skull: '<svg viewBox="0 0 24 24" style="stroke:#fff"><path d="M12 3c-4.4 0-8 3.1-8 7.3 0 2.6 1.4 4.3 3 5.2V19h2v-2h2v2h2v-2h2v2h2v-3.5c1.6-.9 3-2.6 3-5.2C20 6.1 16.4 3 12 3z" fill="#fff" stroke="none"/><circle cx="8.8" cy="10.5" r="2" fill="#222" stroke="none"/><circle cx="15.2" cy="10.5" r="2" fill="#222" stroke="none"/><path d="M12 12.5l-1 2h2z" fill="#222" stroke="none"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    flip: '<svg viewBox="0 0 24 24"><path d="M12 3v18M8 7L3 12l5 5V7zM16 7l5 5-5 5V7z"/></svg>',
    front: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/></svg>',
    rot: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
  };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const S = {
    theme: null, stream: null, facing: 'user', source: 'none', mode: 'single',
    frame: 'none', filter: 'natural', fx: {}, lens: null, lensSince: 0,
    stickers: [], sel: null, busy: false, sound: true, bubbleStyle: 0, shots: [], portrait: false, nextSide: 1,
  };
  const el = {
    welcome: $('#welcome'), booth: $('#booth'), stage: $('#stage'), video: $('#video'), still: $('#still'), tint: $('#tint'),
    lens: $('#lensCanvas'), fx: $('#fxCanvas'), frame: $('#frameCanvas'), stickers: $('#stickers'), countdown: $('#countdown'),
    flash: $('#flash'), shutter: $('#shutterBtn'), camError: $('#camError'), chip: $('#faceChip'),
    result: $('#result'), resultImg: $('#resultImg'), download: $('#downloadBtn'), share: $('#shareBtn'),
    gallery: $('#gallery'), stripProgress: $('#stripProgress'),
  };

  // ---------------------------------------------------------------------------
  // Sound
  // ---------------------------------------------------------------------------
  let audio = null;
  const ac = () => (audio = audio || new (window.AudioContext || window.webkitAudioContext)());
  function beep(freq = 880, dur = 0.09) {
    if (!S.sound) return;
    try {
      const a = ac(), o = a.createOscillator(), g = a.createGain();
      o.frequency.value = freq; g.gain.setValueAtTime(0.08, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
    } catch (e) { /* optional */ }
  }
  function shutterSound() {
    if (!S.sound) return;
    try {
      const a = ac(), len = a.sampleRate * 0.12, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = a.createBufferSource(), g = a.createGain();
      g.gain.value = 0.25; src.buffer = buf; src.connect(g).connect(a.destination); src.start();
    } catch (e) { /* optional */ }
  }

  // ---------------------------------------------------------------------------
  // Color filters (same math for preview and saved photo)
  // ---------------------------------------------------------------------------
  const FILTERS = [
    { id: 'natural', name: 'Natural', ops: [] },
    { id: 'warm', name: 'Warm glow', ops: [['sepia', 0.2], ['saturate', 1.3], ['brightness', 1.06]] },
    { id: 'gold', name: 'Nexford gold', ops: [['sepia', 0.38], ['saturate', 1.65], ['hue-rotate', -8], ['brightness', 1.05]] },
    { id: 'pop', name: 'Party pop', ops: [['saturate', 1.55], ['contrast', 1.12]] },
    { id: 'midnight', name: 'Midnight', ops: [['saturate', 0.75], ['contrast', 1.1], ['brightness', 0.95]], tint: { color: '#7A3CFF', alpha: 0.35, blend: 'soft-light' } },
    { id: 'harvest', name: 'Harvest', ops: [['sepia', 0.25], ['saturate', 1.25], ['contrast', 1.04]], tint: { color: '#FF8A2A', alpha: 0.28, blend: 'soft-light' } },
    { id: 'frosty', name: 'Frosty', ops: [['saturate', 0.8], ['brightness', 1.07]], tint: { color: '#7DB4FF', alpha: 0.38, blend: 'soft-light' } },
    { id: 'candle', name: 'Candlelight', ops: [['contrast', 1.05], ['brightness', 1.03]], tint: { color: '#FF9440', alpha: 0.32, blend: 'soft-light' } },
    { id: 'vintage', name: 'Vintage', ops: [['sepia', 0.45], ['contrast', 1.08], ['saturate', 0.9]] },
    { id: 'classic', name: 'Black & white', ops: [['grayscale', 1], ['contrast', 1.15], ['brightness', 1.04]] },
  ];
  const filterById = (id) => FILTERS.find((f) => f.id === id) || FILTERS[0];
  const cssFilter = (ops) => ops.map(([n, v]) => (n === 'hue-rotate' ? `hue-rotate(${v}deg)` : `${n}(${v})`)).join(' ') || 'none';
  function opMatrix([name, a]) {
    const s = 1 - a;
    switch (name) {
      case 'grayscale': return [0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s, 0, 0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s, 0, 0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s, 0];
      case 'sepia': return [0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0, 0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0, 0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s, 0];
      case 'saturate': return [0.213 + 0.787 * a, 0.715 - 0.715 * a, 0.072 - 0.072 * a, 0, 0.213 - 0.213 * a, 0.715 + 0.285 * a, 0.072 - 0.072 * a, 0, 0.213 - 0.213 * a, 0.715 - 0.715 * a, 0.072 + 0.928 * a, 0];
      case 'hue-rotate': {
        const r = (a * Math.PI) / 180, c = Math.cos(r), n = Math.sin(r);
        return [0.213 + c * 0.787 - n * 0.213, 0.715 - c * 0.715 - n * 0.715, 0.072 - c * 0.072 + n * 0.928, 0,
          0.213 - c * 0.213 + n * 0.143, 0.715 + c * 0.285 + n * 0.14, 0.072 - c * 0.072 - n * 0.283, 0,
          0.213 - c * 0.213 - n * 0.787, 0.715 - c * 0.715 + n * 0.715, 0.072 + c * 0.928 + n * 0.072, 0];
      }
      case 'brightness': return [a, 0, 0, 0, 0, a, 0, 0, 0, 0, a, 0];
      case 'contrast': { const o = (0.5 - 0.5 * a) * 255; return [a, 0, 0, o, 0, a, 0, o, 0, 0, a, o]; }
      default: return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    }
  }
  function applyFilter(ctx, W, H, f) {
    if (f.ops.length) {
      const mats = f.ops.map(opMatrix), img = ctx.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];
        for (let k = 0; k < mats.length; k++) {
          const m = mats[k];
          const nr = m[0] * r + m[1] * g + m[2] * b + m[3], ng = m[4] * r + m[5] * g + m[6] * b + m[7], nb = m[8] * r + m[9] * g + m[10] * b + m[11];
          r = nr < 0 ? 0 : nr > 255 ? 255 : nr; g = ng < 0 ? 0 : ng > 255 ? 255 : ng; b = nb < 0 ? 0 : nb > 255 ? 255 : nb;
        }
        d[i] = r; d[i + 1] = g; d[i + 2] = b;
      }
      ctx.putImageData(img, 0, 0);
    }
    if (f.tint) {
      ctx.save(); ctx.globalCompositeOperation = f.tint.blend; ctx.globalAlpha = f.tint.alpha;
      ctx.fillStyle = f.tint.color; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
  function setFilter(id) {
    S.filter = id;
    const f = filterById(id);
    el.video.style.filter = el.still.style.filter = cssFilter(f.ops);
    el.tint.style.background = f.tint ? f.tint.color : 'transparent';
    el.tint.style.opacity = f.tint ? f.tint.alpha : 0;
    el.tint.style.mixBlendMode = f.tint ? f.tint.blend : 'normal';
    $$('#filterGrid .choice').forEach((b) => b.classList.toggle('is-on', b.dataset.id === id));
  }

  // ---------------------------------------------------------------------------
  // Screen effects
  // ---------------------------------------------------------------------------
  const EFFECTS = [
    ['snow', 'Falling snow', 'Gentle snowflakes drift down'],
    ['leaves', 'Falling leaves', 'Autumn leaves float by'],
    ['bats', 'Flying bats', 'Friendly bats flutter past'],
    ['confetti', 'Confetti', 'Colorful party confetti'],
    ['bokeh', 'Fairy lights', 'Soft glowing lights'],
    ['twinkle', 'Twinkles', 'Little stars that sparkle'],
  ];
  const R = seeded(2026);
  const fxP = {
    snow: Array.from({ length: 140 }, () => ({ x: R(), y: R(), r: 0.3 + R() * 0.9, sp: 0.04 + R() * 0.06, ph: R() * TAU })),
    leaves: Array.from({ length: 22 }, (_, i) => ({ x: R(), y: R(), s: 3 + R() * 3, sp: 0.03 + R() * 0.04, ph: R() * TAU, rot: R() * TAU, k: ['leaf-red', 'leaf-orange', 'leaf-yellow'][i % 3] })),
    bats: Array.from({ length: 5 }, () => ({ x: R(), y: 0.05 + R() * 0.4, s: 10 + R() * 7, sp: 0.04 + R() * 0.05, ph: R() * TAU, dir: R() < 0.5 ? -1 : 1 })),
    confetti: Array.from({ length: 110 }, (_, i) => ({ x: R(), y: R(), s: 0.6 + R() * 0.7, sp: 0.05 + R() * 0.06, ph: R() * TAU, rot: R() * TAU, c: ['#FF5A7A', '#FFC72C', '#4CC9F0', '#7BD389', '#B983FF', '#FF9F43'][i % 6] })),
    bokeh: Array.from({ length: 22 }, () => ({ x: R(), y: R(), r: 3 + R() * 6, ph: R() * TAU, sp: 0.5 + R() })),
    twinkle: Array.from({ length: 26 }, () => ({ x: R(), y: R(), r: 0.8 + R() * 1.6, ph: R() * TAU, sp: 1 + R() * 2 })),
  };
  const BOKEH = { everyday: ['255,199,44', '76,201,240', '255,90,122'], halloween: ['255,138,31', '155,92,255', '120,255,140'], thanksgiving: ['246,176,74', '226,85,44', '255,220,140'], holidays: ['255,199,44', '226,59,59', '120,220,140', '140,200,255'] };
  let sprites = {};
  let fxTime = 0;

  function stepFx(dt) {
    const wrap = (p) => { if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); } };
    if (S.fx.snow) for (const p of fxP.snow) { p.y += p.sp * p.r * dt; p.x += Math.sin(fxTime * 0.8 + p.ph) * 0.0006 * p.r; wrap(p); }
    if (S.fx.leaves) for (const p of fxP.leaves) { p.y += p.sp * dt; p.x += Math.sin(fxTime * 1.2 + p.ph) * 0.0012; p.rot += dt * 0.8; wrap(p); }
    if (S.fx.confetti) for (const p of fxP.confetti) { p.y += p.sp * dt; p.x += Math.sin(fxTime * 2 + p.ph) * 0.0008; p.rot += dt * 3; wrap(p); }
    if (S.fx.bats) for (const p of fxP.bats) { p.x += p.sp * p.dir * dt; if (p.x > 1.1) p.x = -0.1; if (p.x < -0.1) p.x = 1.1; }
    for (const b of fxP.bokeh) { b.y -= 0.004 * dt * b.sp; if (b.y < -0.1) b.y = 1.1; }
  }
  function drawFx(ctx, W, H) {
    const u = Math.min(W, H) / 100;
    if (S.fx.bokeh) {
      const cols = BOKEH[S.theme.id] || BOKEH.everyday;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      fxP.bokeh.forEach((b, i) => {
        const a = 0.22 + 0.16 * Math.sin(fxTime * b.sp + b.ph), x = b.x * W, y = b.y * H, r = b.r * u, c = cols[i % cols.length];
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${c},${a + 0.15})`); g.addColorStop(0.7, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      });
      ctx.restore();
    }
    if (S.fx.twinkle) {
      ctx.save();
      for (const t of fxP.twinkle) {
        const a = Math.max(0, Math.sin(fxTime * t.sp + t.ph));
        if (a < 0.05) continue;
        const x = t.x * W, y = t.y * H, r = t.r * u * (0.6 + 0.4 * a);
        ctx.globalAlpha = a; ctx.fillStyle = '#FFF4C2'; ctx.shadowColor = 'rgba(255,220,120,.9)'; ctx.shadowBlur = r * 1.5;
        ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x, y, x + r * 2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2);
        ctx.quadraticCurveTo(x, y, x - r * 2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (S.fx.bats && sprites.bat) {
      for (const p of fxP.bats) {
        const w = p.s * u, h = (w * sprites.bat.naturalHeight) / sprites.bat.naturalWidth;
        ctx.save(); ctx.translate(p.x * W, (p.y + Math.sin(fxTime * 2 + p.ph) * 0.02) * H);
        ctx.scale(p.dir, 0.55 + 0.45 * Math.abs(Math.sin(fxTime * 10 + p.ph)));
        ctx.drawImage(sprites.bat, -w / 2, -h / 2, w, h); ctx.restore();
      }
    }
    if (S.fx.leaves) {
      for (const p of fxP.leaves) {
        const img = sprites[p.k]; if (!img) continue;
        const w = p.s * u; ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.rotate(p.rot); ctx.globalAlpha = 0.95;
        ctx.drawImage(img, -w / 2, -w / 2, w, w); ctx.restore();
      }
    }
    if (S.fx.confetti) {
      for (const p of fxP.confetti) {
        ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        ctx.fillRect(-p.s * u, -p.s * u * 0.4, p.s * u * 2, p.s * u * 0.8); ctx.restore();
      }
    }
    if (S.fx.snow) {
      ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = u * 0.4;
      for (const p of fxP.snow) { ctx.globalAlpha = 0.45 + 0.5 * (p.r / 1.2); ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r * u * 0.85, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Stage, camera and source
  // ---------------------------------------------------------------------------
  const outSize = () => (S.portrait ? [1200, 1600] : [1600, 1200]);
  const srcEl = () => (S.source === 'camera' ? el.video : el.still);
  const mirrored = () => S.source === 'camera' && S.facing === 'user';
  function makeMap(W, H) {
    const src = srcEl(), sw = src.videoWidth || src.naturalWidth || 1, sh = src.videoHeight || src.naturalHeight || 1;
    const k = Math.max(W / sw, H / sh), dw = sw * k, dh = sh * k, dx = (W - dw) / 2, dy = (H - dh) / 2, m = mirrored();
    return (p) => ({ x: m ? W - (dx + p.x * dw) : dx + p.x * dw, y: dy + p.y * dh });
  }
  function layoutStage() {
    const narrow = window.innerWidth <= 760;
    S.portrait = narrow && window.innerHeight > window.innerWidth;
    el.stage.classList.toggle('portrait', S.portrait);
    const shell = el.stage.parentElement;
    const availW = shell.clientWidth - parseFloat(getComputedStyle(shell).paddingLeft) * 2;
    const ratio = S.portrait ? 3 / 4 : 4 / 3;
    const maxH = window.innerWidth > 1060 ? Math.max(window.innerHeight - 330, 320) : Infinity;
    const w = Math.min(availW, maxH * ratio);
    el.stage.style.width = `${Math.floor(w)}px`;
    const h = w / ratio, dpr = DPR();
    for (const c of [el.fx, el.frame, el.lens]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    drawFramePreview();
    renderStickers();
  }
  function showBooth() {
    el.welcome.hidden = true;
    el.booth.hidden = false;
    layoutStage();
    NexFace.init();
  }
  function camErrorMessage(err) {
    const name = err && err.name;
    if (!window.isSecureContext) return 'The camera only works on a secure (https) link. Open Nexbooth from its GitHub Pages address.';
    if (name === 'NotAllowedError' || name === 'SecurityError') return "Camera access was blocked. Click the camera icon in your browser's address bar, allow access, and try again. You can also use a photo instead.";
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'We could not find a camera on this device. You can use a photo instead.';
    if (name === 'NotReadableError') return 'Your camera is busy in another app (for example, a video call). Close that app and try again.';
    return 'The camera could not start. You can use a photo instead.';
  }
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('nocam'), { name: 'NotFoundError' });
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: S.facing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    S.stream = stream;
    el.video.srcObject = stream;
    await el.video.play().catch(() => {});
    el.video.classList.toggle('mirror', S.facing === 'user');
    el.video.hidden = false; el.still.hidden = true;
    S.source = 'camera';
    NexFace.clear();
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      $('#switchCamBtn').hidden = devices.filter((d) => d.kind === 'videoinput').length < 2;
    } catch (e) { /* ignore */ }
  }
  function stopCamera() { if (S.stream) S.stream.getTracks().forEach((t) => t.stop()); S.stream = null; }
  async function useImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    stopCamera();
    if (el.still.dataset.url) URL.revokeObjectURL(el.still.dataset.url);
    const url = URL.createObjectURL(file);
    el.still.dataset.url = url; el.still.src = url;
    await el.still.decode().catch(() => {});
    el.still.hidden = false; el.video.hidden = true;
    S.source = 'image';
    NexFace.clear();
    showBooth();
    toast('Photo loaded. Pick a lens or decorate it!');
  }
  function drawSource(ctx, W, H) {
    const src = srcEl(), sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight;
    ctx.fillStyle = '#08080C'; ctx.fillRect(0, 0, W, H);
    if (!sw || !sh) return;
    const k = Math.max(W / sw, H / sh), dw = sw * k, dh = sh * k;
    ctx.save();
    if (mirrored()) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Lenses
  // ---------------------------------------------------------------------------
  function lensIconHtml(lens) {
    if (!lens) return ICONS.none;
    if (ICONS[lens.icon]) return ICONS[lens.icon];
    const src = (art.lens[lens.icon] || art.stickers['st-' + lens.icon] || {}).url;
    return src ? `<img src="${src}" alt="">` : ICONS.star;
  }
  function buildLensBar() {
    const bar = $('#lensBar');
    bar.innerHTML = '';
    [null, ...S.theme.lenses].forEach((lens) => {
      const b = document.createElement('button');
      b.className = 'lens' + ((S.lens && lens && S.lens.id === lens.id) || (!S.lens && !lens) ? ' is-on' : '');
      b.setAttribute('role', 'radio');
      b.dataset.id = lens ? lens.id : 'none';
      b.innerHTML = `<span class="lens-icon">${lensIconHtml(lens)}</span><span>${lens ? lens.name : 'No lens'}</span>`;
      b.onclick = () => setLens(lens);
      bar.appendChild(b);
    });
  }
  function setLens(lens) {
    S.lens = lens;
    S.lensSince = performance.now();
    NexLens.clear();
    $$('#lensBar .lens').forEach((b) => { const on = b.dataset.id === (lens ? lens.id : 'none'); b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
    if (lens && NexFace.state === 'failed') {
      toast(location.protocol === 'file:' ? 'Face lenses need the online link (GitHub Pages). Stickers still work here.' : 'Face lenses could not load on this device. Stickers still work.', 4200);
    } else if (lens && lens.hint) toast(lens.hint);
  }
  function updateChip() {
    const st = NexFace.state;
    let html = '';
    if (S.lens) {
      if (st === 'loading' || st === 'idle') html = '<span class="spin"></span>Loading face lenses...';
      else if (st === 'failed') html = 'Face lenses are not available here';
      else if (NexFace.count === 0 && performance.now() - S.lensSince > 1200) html = S.source === 'image' ? 'No face found in this photo' : 'Look at the camera';
    }
    if (el.chip.innerHTML !== html) el.chip.innerHTML = html;
    el.chip.hidden = !html;
  }

  // ---------------------------------------------------------------------------
  // Main loop: face tracking, lens, effects
  // ---------------------------------------------------------------------------
  let last = 0;
  function loop(ts) {
    const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
    last = ts; fxTime += dt;
    if (!el.booth.hidden) {
      stepFx(dt);
      const W = el.lens.width, H = el.lens.height;
      let faces = [];
      if (S.lens && NexFace.state === 'ready' && S.source !== 'none') {
        NexFace.detect(srcEl());
        faces = NexFace.geometry(makeMap(W, H));
      }
      NexLens.update(dt, faces, S.lens, W, H);
      const lc = el.lens.getContext('2d');
      lc.clearRect(0, 0, W, H);
      NexLens.draw(lc, faces, S.lens, fxTime, W, H);
      const fc = el.fx.getContext('2d');
      fc.clearRect(0, 0, el.fx.width, el.fx.height);
      drawFx(fc, el.fx.width, el.fx.height);
      updateChip();
    }
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------------------
  // Frames
  // ---------------------------------------------------------------------------
  let frameImgs = {};
  function drawFramePreview() {
    const c = el.frame, ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    (FRAMES[S.frame] || FRAMES.none).draw(ctx, c.width, c.height, frameImgs, S.theme);
  }
  function setFrame(id) {
    S.frame = id;
    drawFramePreview();
    $$('#frameGrid .choice').forEach((b) => b.classList.toggle('is-on', b.dataset.id === id));
  }

  // ---------------------------------------------------------------------------
  // Stickers
  // ---------------------------------------------------------------------------
  let uid = 0;
  async function addSticker({ src, img, w, x, y, anchorBottom = 0 }) {
    img = img || (await getImg(src));
    const aspect = img.naturalHeight / img.naturalWidth || 1;
    const stageRatio = S.portrait ? 4 / 3 : 3 / 4;
    const hFrac = (w * aspect) / stageRatio;
    if (anchorBottom) y = 1 - hFrac / 2 + anchorBottom;
    const st = { id: ++uid, src: img.src, img, w, x, y, rot: 0, flip: false, aspect };
    S.stickers.push(st);
    renderStickers();
    select(st);
    return st;
  }
  function renderStickers() {
    const keep = new Set(S.stickers.map((s) => String(s.id)));
    $$('.sticker', el.stickers).forEach((n) => { if (!keep.has(n.dataset.id)) n.remove(); });
    S.stickers.forEach((st, i) => {
      let n = el.stickers.querySelector(`.sticker[data-id="${st.id}"]`);
      if (!n) {
        n = document.createElement('div');
        n.className = 'sticker'; n.dataset.id = st.id;
        n.innerHTML = `<img alt="" draggable="false" src="${st.src}"><span class="box"></span>
          <button class="h h-del" data-act="del" aria-label="Remove">${ICONS.del}</button>
          <button class="h h-flip" data-act="flip" aria-label="Flip">${ICONS.flip}</button>
          <button class="h h-front" data-act="front" aria-label="Bring to front">${ICONS.front}</button>
          <button class="h h-rot" data-act="rot" aria-label="Resize and rotate">${ICONS.rot}</button>`;
        el.stickers.appendChild(n);
      }
      n.style.zIndex = i + 1;
      n.style.width = `${st.w * 100}%`; n.style.left = `${st.x * 100}%`; n.style.top = `${st.y * 100}%`;
      n.style.transform = `translate(-50%, -50%) rotate(${st.rot}deg)`;
      n.querySelector('img').style.transform = st.flip ? 'scaleX(-1)' : '';
      n.classList.toggle('is-sel', S.sel === st);
    });
  }
  function select(st) { S.sel = st; renderStickers(); }
  function removeSticker(st) { S.stickers = S.stickers.filter((s) => s !== st); if (S.sel === st) S.sel = null; renderStickers(); }
  const stickerById = (id) => S.stickers.find((s) => String(s.id) === String(id));

  const pointers = new Map();
  let gesture = null;
  el.stickers.addEventListener('pointerdown', (e) => {
    const node = e.target.closest('.sticker');
    if (!node) { select(null); return; }
    const st = stickerById(node.dataset.id);
    if (!st) return;
    e.preventDefault();
    const h = e.target.closest('.h'), act = h && h.dataset.act;
    if (act === 'del') { removeSticker(st); return; }
    if (act === 'flip') { st.flip = !st.flip; renderStickers(); return; }
    if (act === 'front') { S.stickers = S.stickers.filter((s) => s !== st).concat(st); renderStickers(); return; }
    select(st);
    const rect = el.stage.getBoundingClientRect();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (act === 'rot') {
      const r = node.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      gesture = { type: 'rot', st, cx, cy, d0: Math.hypot(e.clientX - cx, e.clientY - cy), a0: Math.atan2(e.clientY - cy, e.clientX - cx), w0: st.w, r0: st.rot };
    } else if (pointers.size === 2 && gesture && gesture.st === st) {
      const [p1, p2] = [...pointers.values()];
      gesture = { type: 'pinch', st, d0: Math.hypot(p2.x - p1.x, p2.y - p1.y), a0: Math.atan2(p2.y - p1.y, p2.x - p1.x), w0: st.w, r0: st.rot };
    } else {
      gesture = { type: 'drag', st, sx: e.clientX, sy: e.clientY, x0: st.x, y0: st.y, rw: rect.width, rh: rect.height };
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!gesture || !pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture, st = g.st;
    if (g.type === 'drag') {
      st.x = clamp(g.x0 + (e.clientX - g.sx) / g.rw, -0.2, 1.2);
      st.y = clamp(g.y0 + (e.clientY - g.sy) / g.rh, -0.2, 1.2);
    } else if (g.type === 'rot') {
      const d = Math.hypot(e.clientX - g.cx, e.clientY - g.cy), a = Math.atan2(e.clientY - g.cy, e.clientX - g.cx);
      st.w = clamp(g.w0 * (d / Math.max(g.d0, 1)), 0.03, 1.6);
      st.rot = g.r0 + ((a - g.a0) * 180) / Math.PI;
    } else if (g.type === 'pinch' && pointers.size >= 2) {
      const [p1, p2] = [...pointers.values()];
      st.w = clamp(g.w0 * (Math.hypot(p2.x - p1.x, p2.y - p1.y) / Math.max(g.d0, 1)), 0.03, 1.6);
      st.rot = g.r0 + ((Math.atan2(p2.y - p1.y, p2.x - p1.x) - g.a0) * 180) / Math.PI;
    }
    renderStickers();
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) gesture = null;
    else if (gesture && gesture.type === 'pinch') {
      const [p] = [...pointers.values()], rect = el.stage.getBoundingClientRect();
      gesture = { type: 'drag', st: gesture.st, sx: p.x, sy: p.y, x0: gesture.st.x, y0: gesture.st.y, rw: rect.width, rh: rect.height };
    }
  };
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  el.stickers.addEventListener('wheel', (e) => {
    const node = e.target.closest('.sticker');
    if (!node) return;
    e.preventDefault();
    const st = stickerById(node.dataset.id);
    st.w = clamp(st.w * Math.exp(-e.deltaY * 0.0015), 0.03, 1.6);
    select(st);
  }, { passive: false });
  function drawStickers(ctx, W, H) {
    const k = W / (el.stage.clientWidth || W);
    for (const st of S.stickers) {
      const w = st.w * W, h = w * st.aspect;
      ctx.save();
      ctx.translate(st.x * W, st.y * H); ctx.rotate((st.rot * Math.PI) / 180);
      if (st.flip) ctx.scale(-1, 1);
      ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 10 * k; ctx.shadowOffsetY = 6 * k;
      ctx.drawImage(st.img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Speech bubbles
  // ---------------------------------------------------------------------------
  const bubbleStyles = () => [
    { bg: '#FFFFFF', fg: '#2A1C0E', line: '#2A1C0E' },
    { bg: getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#FFC72C', fg: '#24160A', line: '#24160A' },
    { bg: '#E23B3B', fg: '#FFFFFF', line: '#6E1016' },
    { bg: '#2E2A33', fg: '#FFFFFF', line: '#111014' },
  ];
  async function makeBubble(text, style) {
    try { await document.fonts.load('700 64px Fredoka'); } catch (e) { /* fallback */ }
    const fs = 64, lh = fs * 1.15, maxW = 600, padX = 48, padY = 34, tail = 46, lw = 8;
    const c = document.createElement('canvas'), ctx = c.getContext('2d');
    ctx.font = `700 ${fs}px Fredoka, Nunito, sans-serif`;
    const lines = []; let line = '';
    for (const w of text.split(/\s+/)) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const bw = tw + padX * 2, bh = lines.length * lh + padY * 2 - (lh - fs);
    c.width = Math.ceil(bw + lw * 2); c.height = Math.ceil(bh + tail + lw * 2);
    ctx.translate(lw, lw);
    const r = Math.min(46, bh / 2);
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(bw - r, 0); ctx.arcTo(bw, 0, bw, r, r); ctx.lineTo(bw, bh - r); ctx.arcTo(bw, bh, bw - r, bh, r);
    ctx.lineTo(bw * 0.36, bh); ctx.lineTo(bw * 0.2, bh + tail); ctx.lineTo(bw * 0.24, bh);
    ctx.lineTo(r, bh); ctx.arcTo(0, bh, 0, bh - r, r); ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r); ctx.closePath();
    ctx.fillStyle = style.bg; ctx.fill();
    ctx.lineWidth = lw; ctx.strokeStyle = style.line; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = style.fg; ctx.textAlign = 'center'; ctx.font = `700 ${fs}px Fredoka, Nunito, sans-serif`;
    lines.forEach((l, i) => ctx.fillText(l, bw / 2, padY + fs * 0.82 + i * lh));
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    return loadImage(URL.createObjectURL(blob));
  }
  async function addWords(text) {
    text = text.trim();
    if (!text) return;
    const img = await makeBubble(text, bubbleStyles()[S.bubbleStyle]);
    addSticker({ img, w: clamp(0.12 + text.length * 0.012, 0.2, 0.42), x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.2 });
  }

  // ---------------------------------------------------------------------------
  // Taking photos
  // ---------------------------------------------------------------------------
  function composeShot(W, H, withFrame) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    drawSource(ctx, W, H);
    applyFilter(ctx, W, H, filterById(S.filter));
    const faces = S.lens && NexFace.state === 'ready' ? NexFace.geometry(makeMap(W, H), true) : [];
    NexLens.draw(ctx, faces, S.lens, fxTime, W, H);
    drawFx(ctx, W, H);
    if (withFrame) (FRAMES[S.frame] || FRAMES.none).draw(ctx, W, H, frameImgs, S.theme);
    drawStickers(ctx, W, H);
    return c;
  }
  async function countdown(n) {
    for (let i = n; i > 0; i--) {
      el.countdown.innerHTML = `<span>${i}</span>`;
      beep(i === 1 ? 1175 : 880);
      await sleep(1000);
    }
    el.countdown.innerHTML = '';
  }
  function flash() { shutterSound(); el.flash.classList.remove('go'); void el.flash.offsetWidth; el.flash.classList.add('go'); }
  const STRIP_BG = { everyday: ['#2A3047', '#121318'], halloween: ['#3F2163', '#140C20'], thanksgiving: ['#4D2B12', '#1C110A'], holidays: ['#174535', '#0B1F19'] };
  function stripBackground(ctx, W, H) {
    const th = S.theme.id, [c1, c2] = STRIP_BG[th] || STRIP_BG.everyday, g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = seeded(5);
    for (let i = 0; i < 70; i++) {
      const x = r() * W, y = r() * H, s = 18 + r() * 30;
      ctx.save(); ctx.globalAlpha = 0.1 + r() * 0.12;
      if (th === 'holidays') drawFlake(ctx, x, y, s * 0.6, '#FFFFFF', 2.5);
      else if (th === 'halloween' && sprites.bat) { ctx.translate(x, y); ctx.drawImage(sprites.bat, -s, -s * 0.55, s * 2, s * 1.1); }
      else if (th === 'thanksgiving' && sprites['leaf-orange']) { ctx.translate(x, y); ctx.rotate(r() * TAU); ctx.drawImage(sprites[['leaf-red', 'leaf-orange', 'leaf-yellow'][i % 3]], -s / 2, -s / 2, s, s); }
      else { ctx.translate(x, y); ctx.rotate(r() * TAU); ctx.fillStyle = ['#FF5A7A', '#FFC72C', '#4CC9F0', '#7BD389'][i % 4]; ctx.fillRect(-s * 0.3, -s * 0.12, s * 0.6, s * 0.24); }
      ctx.restore();
    }
  }
  function composeStrip(panels) {
    const vertical = !S.portrait;
    const pw = vertical ? 1060 : 700, ph = vertical ? 795 : 933, pad = 70, gap = vertical ? 34 : 40, header = 270, footer = 250;
    const W = vertical ? pw + pad * 2 : pw * 2 + gap + pad * 2;
    const H = vertical ? header + ph * 4 + gap * 3 + footer : header + ph * 2 + gap + footer;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    stripBackground(ctx, W, H);
    if (S.theme.id === 'holidays') drawLightString(ctx, W, 9, 6, 28, 2);
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#FFC72C';
    ctx.textAlign = 'center'; ctx.fillStyle = accent; ctx.font = '700 118px Fredoka, Nunito, sans-serif';
    ctx.fillText('Nexbooth', W / 2, 185);
    ctx.fillStyle = '#FFF8EC'; ctx.font = '800 40px Nunito, sans-serif';
    ctx.fillText(S.theme.id === 'everyday' ? 'Hello from Team Nexford' : `${S.theme.caption.title}, Team Nexford`, W / 2, 240);
    panels.forEach((p, i) => {
      const col = vertical ? 0 : i % 2, row = vertical ? i : Math.floor(i / 2);
      const x = pad + col * (pw + gap), y = header + row * (ph + gap);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#FFFBF2'; roundRect(ctx, x - 10, y - 10, pw + 20, ph + 20, 22); ctx.fill(); ctx.restore();
      ctx.save(); roundRect(ctx, x, y, pw, ph, 14); ctx.clip(); ctx.drawImage(p, x, y, pw, ph); ctx.restore();
    });
    const fy = H - footer;
    if (frameImgs.logo) ctx.drawImage(frameImgs.logo, W / 2 - 90, fy + 18, 180, 180);
    ctx.fillStyle = 'rgba(255,248,236,.75)'; ctx.font = '800 32px Nunito, sans-serif';
    ctx.fillText(DATE_LABEL, W / 2, H - 26);
    ctx.textAlign = 'start';
    return c;
  }
  async function shoot() {
    if (S.busy || S.source === 'none') return;
    S.busy = true; el.shutter.disabled = true;
    select(null);
    el.stage.classList.add('capturing');
    const timer = parseInt($('#timerSelect').value, 10) || 0;
    try {
      let canvas;
      if (S.mode === 'single') {
        await countdown(timer); flash();
        const [W, H] = outSize();
        canvas = composeShot(W, H, true);
      } else {
        const [pw, ph] = S.portrait ? [700, 933] : [1060, 795];
        const panels = [];
        el.stripProgress.innerHTML = '<i></i><i></i><i></i><i></i>'; el.stripProgress.hidden = false;
        for (let k = 0; k < 4; k++) {
          await countdown(k === 0 ? timer : Math.min(timer || 3, 3)); flash();
          panels.push(composeShot(Math.round(pw * 1.5), Math.round(ph * 1.5), false));
          el.stripProgress.children[k].classList.add('done');
          await sleep(500);
        }
        canvas = composeStrip(panels);
      }
      await finishShot(canvas);
    } catch (err) {
      console.error(err);
      toast('Something went wrong. Please try again.');
    } finally {
      el.countdown.innerHTML = ''; el.stage.classList.remove('capturing'); el.stripProgress.hidden = true;
      el.shutter.disabled = false; S.busy = false;
    }
  }
  async function finishShot(canvas) {
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    const name = `nexbooth-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
    const shot = { blob, url: URL.createObjectURL(blob), name };
    S.shots.unshift(shot);
    renderGallery();
    openResult(shot);
  }
  function openResult(shot) {
    el.resultImg.src = shot.url;
    el.download.href = shot.url; el.download.download = shot.name;
    const file = new File([shot.blob], shot.name, { type: 'image/jpeg' });
    el.share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
    el.share.onclick = () => navigator.share({ files: [file], title: 'My Nexbooth photo', text: 'Hello from Team Nexford!' }).catch(() => {});
    if (typeof el.result.showModal === 'function') el.result.showModal(); else el.result.setAttribute('open', '');
  }
  function renderGallery() {
    $('#galleryCount').textContent = S.shots.length ? `(${S.shots.length})` : '';
    el.gallery.innerHTML = '';
    if (!S.shots.length) { el.gallery.innerHTML = '<p class="gallery-empty">Photos you take will show up here.</p>'; return; }
    S.shots.forEach((shot, i) => {
      const b = document.createElement('button');
      b.title = 'Open photo';
      b.innerHTML = `<img src="${shot.url}" alt="Photo ${S.shots.length - i}">`;
      b.onclick = () => openResult(shot);
      el.gallery.appendChild(b);
    });
  }

  // ---------------------------------------------------------------------------
  // Panel (rebuilt for each theme)
  // ---------------------------------------------------------------------------
  function tile(url, name, onclick) {
    const b = document.createElement('button');
    b.className = 'tile'; b.title = name;
    b.innerHTML = `<img src="${url}" alt=""><span>${name}</span>`;
    b.setAttribute('aria-label', `Add ${name}`);
    b.onclick = onclick;
    return b;
  }
  function addAlpaca(a) {
    getImg(a.url).then((img) => {
      const isPeek = a.id === 'alpaca-peek', isHead = a.id === 'alpaca-reindeer';
      const side = S.nextSide; S.nextSide *= -1;
      const w = (isHead ? 0.22 : isPeek ? 0.22 : 0.24) * (S.portrait ? 1.45 : 1);
      addSticker({ img, w, x: 0.5 + side * (S.portrait ? 0.22 : 0.3), y: isHead ? 0.3 : 0.6, anchorBottom: isHead ? 0 : isPeek ? 0.06 : -0.035 });
    });
  }
  function buildAlpacas() {
    const g = $('#alpacaGrid'); g.innerHTML = '';
    const list = A.alpacas[S.theme.id] || [];
    list.forEach((a) => g.appendChild(tile(art.alpacas[a.id].url, a.name, () => addAlpaca(art.alpacas[a.id]))));
    if (S.theme.id !== 'everyday') {
      const h = document.createElement('h4'); h.className = 'sub'; h.style.gridColumn = '1 / -1'; h.textContent = 'Everyday alpacas';
      g.appendChild(h);
      A.alpacas.everyday.forEach((a) => g.appendChild(tile(art.alpacas[a.id].url, a.name, () => addAlpaca(art.alpacas[a.id]))));
    }
  }
  function buildStickers() {
    const box = $('#stickerGroups'); box.innerHTML = '';
    const group = (title, items, size) => {
      const h = document.createElement('h4'); h.className = 'sub'; h.textContent = title; box.appendChild(h);
      const g = document.createElement('div'); g.className = 'grid grid-art grid-small'; box.appendChild(g);
      items.forEach((it) => g.appendChild(tile(it.url, it.name, () => getImg(it.url).then((img) =>
        addSticker({ img, w: (size(it) || 0.16) * (S.portrait ? 1.4 : 1), x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.35 + (Math.random() - 0.5) * 0.1 })))));
    };
    const stickers = (A.stickers[S.theme.id] || []).map((s) => art.stickers[s.id]);
    group('Stickers', stickers, () => 0.16);
    const wear = [...new Set(S.theme.lenses.flatMap((l) => (l.items || []).map((i) => i.id)))].map((id) => art.lens[id]).filter(Boolean);
    if (wear.length) group('Wear it (place by hand)', wear, (it) => (it.anchor === 'head' ? 0.26 : 0.18));
  }
  function buildWords() {
    const bs = $('#bubbleStyles'); bs.innerHTML = '';
    bubbleStyles().forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'bstyle' + (i === S.bubbleStyle ? ' is-on' : '');
      b.style.background = s.bg; b.style.boxShadow = `inset 0 0 0 3px ${s.line}`;
      b.setAttribute('aria-label', `Bubble style ${i + 1}`);
      b.onclick = () => { S.bubbleStyle = i; $$('.bstyle').forEach((x, j) => x.classList.toggle('is-on', j === i)); };
      bs.appendChild(b);
    });
    const wl = $('#wordList'); wl.innerHTML = '';
    S.theme.words.forEach((p) => {
      const b = document.createElement('button'); b.className = 'word'; b.textContent = p; b.onclick = () => addWords(p); wl.appendChild(b);
    });
  }
  async function buildFrames() {
    const fg = $('#frameGrid'); fg.innerHTML = '';
    const sample = await getImg(art.alpacas[A.alpacas[S.theme.id][0].id].url);
    S.theme.frames.forEach((id) => {
      const f = FRAMES[id]; if (!f) return;
      const b = document.createElement('button');
      b.className = 'choice' + (id === S.frame ? ' is-on' : ''); b.dataset.id = id;
      const c = document.createElement('canvas'); c.width = 320; c.height = 240;
      const ctx = c.getContext('2d'), g = ctx.createLinearGradient(0, 0, 320, 240);
      g.addColorStop(0, '#4E6A8A'); g.addColorStop(1, '#C9A36B'); ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 240);
      const h = 190, w = h / (sample.naturalHeight / sample.naturalWidth);
      ctx.drawImage(sample, (320 - w) / 2, 240 - h - 6, w, h);
      f.draw(ctx, 320, 240, frameImgs, S.theme);
      b.appendChild(c);
      b.appendChild(Object.assign(document.createElement('span'), { textContent: f.name }));
      b.onclick = () => setFrame(id);
      fg.appendChild(b);
    });
  }
  function buildLooks() {
    const flg = $('#filterGrid'); flg.innerHTML = '';
    const sampleUrl = art.alpacas[A.alpacas[S.theme.id][0].id].url;
    FILTERS.forEach((f) => {
      const b = document.createElement('button');
      b.className = 'choice' + (f.id === S.filter ? ' is-on' : ''); b.dataset.id = f.id;
      b.innerHTML = `<div class="thumb" style="position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;background:linear-gradient(160deg,#4E6A8A,#C9A36B);filter:${cssFilter(f.ops)}"></div>
          <img src="${sampleUrl}" alt="" style="position:absolute;inset:6% 20%;width:60%;height:88%;object-fit:contain;filter:${cssFilter(f.ops)}">
          ${f.tint ? `<div style="position:absolute;inset:0;background:${f.tint.color};opacity:${f.tint.alpha};mix-blend-mode:${f.tint.blend}"></div>` : ''}
        </div><span>${f.name}</span>`;
      b.onclick = () => setFilter(f.id);
      flg.appendChild(b);
    });
    const ef = $('#effectList'); ef.innerHTML = '';
    EFFECTS.forEach(([id, name, desc]) => {
      const l = document.createElement('label'); l.className = 'toggle';
      l.innerHTML = `<span><strong>${name}</strong><small>${desc}</small></span><input type="checkbox" ${S.fx[id] ? 'checked' : ''}><span class="switch"></span>`;
      l.querySelector('input').onchange = (e) => { S.fx[id] = e.target.checked; };
      ef.appendChild(l);
    });
  }
  function buildThemeBar() {
    const bar = $('#themeBar'); bar.innerHTML = '';
    THEMES.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'theme-btn'; b.dataset.id = t.id;
      b.innerHTML = `${ICONS[t.icon] || ''}<span class="lbl">${t.name}</span>`;
      b.title = t.name;
      b.onclick = () => { setTheme(t.id); store.set('theme', { id: t.id, month: new Date().getMonth() }); toast(`${t.name} theme`); };
      bar.appendChild(b);
    });
  }
  function setTheme(id) {
    const t = themeById(id);
    S.theme = t;
    document.body.dataset.theme = t.id;
    $$('.theme-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.id === t.id));
    const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    $('meta[name="theme-color"]').setAttribute('content', bg || '#121318');
    // defaults
    S.frame = t.defaults.frame;
    S.fx = { snow: false, leaves: false, bats: false, confetti: false, bokeh: false, twinkle: false, ...t.defaults.fx };
    S.lens = null;
    NexLens.clear();
    buildLensBar(); buildAlpacas(); buildStickers(); buildWords(); buildLooks();
    setFilter(t.defaults.filter);
    buildFrames().then(() => drawFramePreview());
    drawFramePreview();
    const first = A.alpacas[t.id][0];
    $('#welcomeAlpaca').src = art.alpacas[first.id].url;
    $('#welcomeEyebrow').textContent = t.id === 'everyday' ? 'Hello, Team Nexford' : `${t.caption.title}, Team Nexford`;
  }
  function defaultTheme() {
    const saved = store.get('theme'), m = new Date().getMonth();
    if (saved && saved.month === m && THEMES.some((t) => t.id === saved.id)) return saved.id;
    return m === 9 ? 'halloween' : m === 10 ? 'thanksgiving' : m === 11 ? 'holidays' : 'everyday';
  }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------
  function bind() {
    $('#startBtn').addEventListener('click', async () => {
      el.camError.hidden = true;
      const btn = $('#startBtn'); btn.disabled = true;
      try { await startCamera(); showBooth(); toast('Tip: try a face lens from the row under the camera!', 3200); } catch (err) {
        console.warn(err); el.camError.textContent = camErrorMessage(err); el.camError.hidden = false;
      } finally { btn.disabled = false; }
    });
    $('#uploadInput').addEventListener('change', (e) => { useImageFile(e.target.files[0]); e.target.value = ''; });
    $('#switchCamBtn').addEventListener('click', async () => {
      S.facing = S.facing === 'user' ? 'environment' : 'user';
      try { await startCamera(); } catch (e) { toast('Could not switch the camera.'); }
    });
    $('#clearBtn').addEventListener('click', () => { S.stickers = []; S.sel = null; renderStickers(); toast('All stickers removed'); });
    el.shutter.addEventListener('click', shoot);
    $$('.seg-btn').forEach((b) => b.addEventListener('click', () => {
      S.mode = b.dataset.mode;
      $$('.seg-btn').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); });
      toast(S.mode === 'strip' ? 'Strip mode: 4 photos in a row' : 'Single photo mode');
    }));
    $$('.tab').forEach((t) => t.addEventListener('click', () => {
      $$('.tab').forEach((x) => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', x === t); });
      $$('.tab-body').forEach((b) => (b.hidden = b.dataset.body !== t.dataset.tab));
    }));
    $('#resultClose').addEventListener('click', () => el.result.close());
    $('#againBtn').addEventListener('click', () => el.result.close());
    el.result.addEventListener('click', (e) => { if (e.target === el.result) el.result.close(); });
    $('#helpBtn').addEventListener('click', () => $('#help').showModal());
    $('#helpClose').addEventListener('click', () => $('#help').close());
    $('#help').addEventListener('click', (e) => { if (e.target.id === 'help') $('#help').close(); });
    $('#soundBtn').addEventListener('click', (e) => {
      S.sound = !S.sound; e.currentTarget.setAttribute('aria-pressed', S.sound); toast(S.sound ? 'Sound on' : 'Sound off');
    });
    $('#wordForm').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#wordInput'); addWords(i.value); i.value = ''; });
    window.addEventListener('keydown', (e) => {
      if (el.booth.hidden || el.result.open || $('#help').open) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); shoot(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); removeSticker(S.sel); }
      else if (e.key === 'Escape') select(null);
    });
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!el.booth.hidden) layoutStage(); }, 120); });
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) useImageFile(f); });
  }

  async function init() {
    buildThemeBar();
    bind();
    // sprites for effects, lens particles and frames
    const sp = { bat: 'st-bat', ghost: 'st-ghost', heart: 'st-heart', candycorn: 'st-candycorn', snowflake: 'snowflake', 'leaf-red': 'st-leaf-red',
      'leaf-orange': 'st-leaf-orange', 'leaf-yellow': 'st-leaf-yellow', moon: 'st-moon', jack: 'st-jack', pumpkin: 'st-pumpkin', pie: 'st-pie',
      ornRed: 'ornament-red', ornGold: 'ornament-gold', star: 'st-star' };
    const spEntries = await Promise.all(Object.entries(sp).map(async ([k, id]) => [k, art.stickers[id] ? await getImg(art.stickers[id].url) : null]));
    sprites = Object.fromEntries(spEntries);
    const lensItems = {};
    await Promise.all(Object.values(art.lens).map(async (it) => { lensItems[it.id] = { ...it, img: await getImg(it.url) }; }));
    NexLens.setAssets(lensItems, sprites);
    frameImgs = { ...sprites, logo: await getImg(logoUrl), leaves: [sprites['leaf-red'], sprites['leaf-orange'], sprites['leaf-yellow']] };
    try { await Promise.race([document.fonts.ready, sleep(2500)]); } catch (e) { /* ignore */ }
    try { await Promise.all(['700 40px Fredoka', '800 20px Nunito', '700 40px Caveat'].map((f) => document.fonts.load(f))); } catch (e) { /* fallback fonts */ }
    setTheme(defaultTheme());
    requestAnimationFrame(loop);
    window.__nexbooth = { S, shoot, setTheme, setLens: (id) => setLens(S.theme.lenses.find((l) => l.id === id) || null), setFrame, setFilter, composeShot, NexFace };
  }
  init();
})();

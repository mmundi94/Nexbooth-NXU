/* Nexbooth face tracking.
   Uses Google's MediaPipe Face Mesh (Apache 2.0), stored locally in vendor/face_mesh.
   Runs fully inside the browser. Camera frames are never uploaded. */
window.NexFace = (() => {
  'use strict';

  // Landmarks we use (MediaPipe Face Mesh indices)
  const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152,
    148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  const KEY = [1, 0, 2, 13, 14, 61, 291, 33, 133, 362, 263, 168, 6, 205, 425, 50, 280, 98, 327, 17];
  const IDS = [...new Set([...OVAL, ...KEY])];

  let fm = null;
  let state = 'idle'; // idle | loading | ready | failed
  let busy = false;
  let tracks = [];     // smoothed faces: { pts: Map(id -> {x,y}), seen, alive }
  let listeners = [];
  let lastResultAt = 0;

  const setState = (s, msg) => { state = s; listeners.forEach((fn) => fn(s, msg)); };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (state === 'ready' || state === 'loading') return;
    setState('loading');
    try {
      if (location.protocol === 'file:') throw new Error('file-protocol');
      if (typeof window.FaceMesh === 'undefined') await loadScript('vendor/face_mesh/face_mesh.js');
      fm = new window.FaceMesh({ locateFile: (file) => `vendor/face_mesh/${file}` });
      fm.setOptions({ maxNumFaces: 4, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5, selfieMode: false });
      fm.onResults(onResults);
      await fm.initialize();
      setState('ready');
    } catch (err) {
      console.warn('Face tracking unavailable:', err);
      setState('failed', err && err.message);
    }
  }

  function onResults(r) {
    const faces = (r.multiFaceLandmarks || []).map((lm) => {
      const pts = new Map();
      for (const id of IDS) pts.set(id, { x: lm[id].x, y: lm[id].y });
      return pts;
    });
    const now = performance.now();
    lastResultAt = now;
    // match to existing tracks by nearest nose position
    const used = new Set();
    for (const pts of faces) {
      const n = pts.get(1);
      let best = null, bestD = 0.12;
      for (const t of tracks) {
        if (used.has(t)) continue;
        const tn = t.pts.get(1), d = Math.hypot(tn.x - n.x, tn.y - n.y);
        if (d < bestD) { bestD = d; best = t; }
      }
      if (best) {
        used.add(best);
        // adaptive smoothing: follow fast moves, calm small jitter
        const a = Math.min(0.85, 0.35 + bestD * 18);
        for (const id of IDS) {
          const p = best.pts.get(id), q = pts.get(id);
          p.x += (q.x - p.x) * a; p.y += (q.y - p.y) * a;
        }
        best.seen = now;
      } else {
        const t = { pts, seen: now, born: now };
        tracks.push(t); used.add(t);
      }
    }
    tracks = tracks.filter((t) => now - t.seen < 900);
  }

  async function detect(source) {
    if (state !== 'ready' || busy || !source) return;
    const w = source.videoWidth || source.naturalWidth, h = source.videoHeight || source.naturalHeight;
    if (!w || !h) return;
    busy = true;
    try { await fm.send({ image: source }); } catch (e) { /* skip this frame */ } finally { busy = false; }
  }

  async function detectStill(img) {
    if (state !== 'ready') return 0;
    tracks = [];
    for (let i = 0; i < 3; i++) await detect(img); // a few passes let tracking settle
    return tracks.length;
  }

  /* Geometry of each face in a target canvas of size W x H.
     map: function({x,y} normalized to the source) -> {x,y} in pixels. */
  function geometry(map, solid) {
    const now = performance.now();
    return tracks.map((t) => {
      const P = (id) => map(t.pts.get(id));
      const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      let L = mid(P(33), P(133)), R = mid(P(362), P(263));
      if (R.x < L.x) [L, R] = [R, L];
      const roll = Math.atan2(R.y - L.y, R.x - L.x);
      const faceW = dist(P(234), P(454)), faceH = dist(P(10), P(152));
      const S = (faceW + faceH / 1.15) / 2;
      const up = { x: Math.sin(roll), y: -Math.cos(roll) };
      const right = { x: Math.cos(roll), y: Math.sin(roll) };
      const top = P(10);
      const mouthC = mid(P(13), P(14));
      const fade = Math.min(1, (now - t.born) / 200) * Math.min(1, Math.max(0, 1 - (now - t.seen - 500) / 400));
      return {
        S, roll, up, right, fade: solid ? 1 : fade,
        eyes: mid(L, R), eyeL: L, eyeR: R,
        head: { x: top.x + up.x * S * 0.03, y: top.y + up.y * S * 0.03 },
        nose: P(1),
        mouth: mid(P(2), P(0)),
        lip: P(13),
        mouthC,
        mouthOpen: dist(P(13), P(14)) / S,
        mouthW: dist(P(61), P(291)),
        cheekL: P(205), cheekR: P(425),
        chin: P(152),
        oval: OVAL.map(P),
        P,
      };
    });
  }

  return {
    init, detect, detectStill, geometry,
    get state() { return state; },
    get count() { return tracks.length; },
    get fresh() { return performance.now() - lastResultAt < 1000; },
    onState(fn) { listeners.push(fn); fn(state); },
    clear() { tracks = []; },
  };
})();

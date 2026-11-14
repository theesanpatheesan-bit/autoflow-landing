/* =========================================================
   AutoFlow – lightweight 3D engine (no libraries)
   Renders the faceted crimson / gold / black "logo crystal"
   plus floating shards and dust on a <canvas>.
   Flat-shaded polygons, painter's algorithm, mouse parallax.
   ========================================================= */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var C = {
    crimson:  [200, 24, 66],
    crimsonL: [255, 84, 120],
    gold:     [212, 168, 78],
    goldL:    [246, 222, 150],
    black:    [28, 28, 36],
    ink:      [14, 14, 18]
  };
  var input = { pointerX: 0, pointerY: 0, scrollY: window.scrollY || 0 };
  var pendingPointerX = 0, pendingPointerY = 0, pendingScrollY = input.scrollY, inputFrame = 0;
  var visibilityHandlers = [];

  function scheduleInput() {
    if (inputFrame) return;
    inputFrame = requestAnimationFrame(function () {
      input.pointerX = pendingPointerX;
      input.pointerY = pendingPointerY;
      input.scrollY = pendingScrollY;
      inputFrame = 0;
    });
  }

  window.addEventListener("pointermove", function (event) {
    pendingPointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pendingPointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    scheduleInput();
  }, { passive: true });
  window.addEventListener("scroll", function () {
    pendingScrollY = window.scrollY || 0;
    scheduleInput();
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    visibilityHandlers.forEach(function (handler) { handler(document.hidden); });
  });

  /* ---------- tiny seeded random so the scene looks the same every load ---------- */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- mesh builders ---------- */
  function tri(list, a, b, c, col) { list.push({ v: [a, b, c], col: col }); }

  // extrude a 2D quad into a faceted slab with a raised front ridge
  function slab(list, q, d, bulge, cols, dx) {
    var cx = 0, cy = 0, i, n = q.length;
    for (i = 0; i < n; i++) { cx += q[i][0]; cy += q[i][1]; }
    cx = cx / n + dx; cy /= n;
    var apex = [cx, cy, d + bulge], apexB = [cx, cy, -d - bulge * 0.3];
    for (i = 0; i < n; i++) {
      var a = q[i], b = q[(i + 1) % n];
      var A = [a[0] + dx, a[1], d], B = [b[0] + dx, b[1], d];
      var A2 = [a[0] + dx, a[1], -d], B2 = [b[0] + dx, b[1], -d];
      tri(list, apex, A, B, cols[i % cols.length]);                 // front facets
      tri(list, apexB, B2, A2, C.ink);                              // back
      tri(list, A, A2, B2, cols[(i + 2) % cols.length]);            // sides
      tri(list, A, B2, B, cols[(i + 1) % cols.length]);
    }
  }

  function arrowMesh() {
    var t = [];
    // chevron head (right) – two arms
    var up = [[-0.2, 1.55], [0.45, 1.55], [1.65, 0], [0.95, 0]];
    var dn = [[0.95, 0], [1.65, 0], [0.45, -1.55], [-0.2, -1.55]];
    slab(t, up, 0.32, 0.22, [C.crimson, C.crimsonL, C.gold, C.crimson], 0.55);
    slab(t, dn, 0.32, 0.22, [C.black, C.crimson, C.black, C.gold], 0.55);
    // faceted dart / crystal body (left)
    var T = [1.7, 0, 0], A = [-1.0, 1.15, 0], B = [-1.0, -1.15, 0], N = [-0.25, 0, 0],
        U = [-0.35, 0, 0.7], D = [-0.35, 0, -0.7], W = [-1.9, 0.2, 0.25], W2 = [-1.9, -0.35, -0.15],
        top = [-0.2, 0.7, 0.35], bot = [-0.2, -0.7, 0.3];
    var off = -1.15;
    function sh(p) { return [p[0] + off, p[1], p[2]]; }
    var faces = [
      [T, A, U, C.gold], [T, U, B, C.black], [T, B, D, C.crimson], [T, D, A, C.gold],
      [A, N, U, C.crimson], [U, N, B, C.gold], [B, N, D, C.black], [D, N, A, C.crimson],
      [A, W, U, C.black], [U, W, B, C.crimsonL], [B, W2, D, C.gold], [D, W2, A, C.black],
      [U, top, A, C.goldL], [U, bot, B, C.crimson]
    ];
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      tri(t, sh(f[0]), sh(f[1]), sh(f[2]), f[3]);
    }
    return t;
  }

  function shardMesh(rand) {
    var t = [], cols = [C.crimson, C.gold, C.black, C.crimsonL, C.goldL, C.black];
    var L = 0.7 + rand() * 0.9, W = 0.45 + rand() * 0.35;
    var P = [[L, 0, 0], [-L, 0, 0], [0, W, 0], [0, -W, 0], [0, 0, W * 0.8], [0, 0, -W * 0.8]];
    var f = [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]];
    var shift = Math.floor(rand() * cols.length);
    for (var i = 0; i < f.length; i++) tri(t, P[f[i][0]], P[f[i][1]], P[f[i][2]], cols[(i + shift) % cols.length]);
    return t;
  }

  /* ---------- math ---------- */
  function rot(p, rx, ry, rz) {
    var x = p[0], y = p[1], z = p[2], c, s, t;
    c = Math.cos(ry); s = Math.sin(ry); t = x * c + z * s; z = -x * s + z * c; x = t;
    c = Math.cos(rx); s = Math.sin(rx); t = y * c - z * s; z = y * s + z * c; y = t;
    c = Math.cos(rz); s = Math.sin(rz); t = x * c - y * s; y = x * s + y * c; x = t;
    return [x, y, z];
  }
  var LIGHT = (function () { var l = [-0.45, -0.65, -0.62], m = Math.hypot(l[0], l[1], l[2]); return [l[0] / m, l[1] / m, l[2] / m]; })();
  function shade(col, n, boost) {
    // n already facing camera (z negative = towards viewer)
    var d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    var h = [LIGHT[0], LIGHT[1], LIGHT[2] - 1]; var hm = Math.hypot(h[0], h[1], h[2]); // half vector toward camera
    var sp = Math.pow(Math.max(0, -(n[0] * h[0] + n[1] * h[1] + n[2] * h[2]) / hm), 24);
    var k = (0.28 + d * 0.95) * (boost || 1);
    var r = Math.min(255, col[0] * k + sp * 150), g = Math.min(255, col[1] * k + sp * 130), b = Math.min(255, col[2] * k + sp * 100);
    return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
  }

  /* ---------- scene ---------- */
  function create(canvas, opt) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    opt = opt || {};
    var rand = rng(opt.seed || 7);
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, layout = { cx: 0, cy: 0, ppu: 100 };
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var visible = true, running = false, t0 = performance.now(), scrollY = 0, canvasPageTop = 0;

    var arrow = { mesh: arrowMesh(), pos: [0, 0, 0], scale: 1, rx: 0, ry: 0, rz: 0, main: true };
    var shards = [], dust = [], i;
    var nShards = opt.shards != null ? opt.shards : 26;
    for (i = 0; i < nShards; i++) {
      shards.push({
        mesh: shardMesh(rand),
        nx: rand() * 2 - 1, ny: rand() * 2 - 1, z: rand() * 7 - 2.5,
        scale: 0.12 + rand() * 0.26,
        rx: rand() * TAU, ry: rand() * TAU, rz: rand() * TAU,
        vx: (rand() - 0.5) * 0.8, vy: (rand() - 0.5) * 0.8, vz: (rand() - 0.5) * 0.6,
        bob: rand() * TAU
      });
    }
    var nDust = opt.dust != null ? opt.dust : 70;
    for (i = 0; i < nDust; i++) dust.push({ x: rand(), y: rand(), z: rand(), p: rand() * TAU, gold: rand() > 0.4 });

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvasPageTop = r.top + (window.scrollY || 0);
      scrollY = (window.scrollY || 0) - canvasPageTop;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout = opt.layout ? opt.layout(r, W, H) : { cx: W / 2, cy: H / 2, ppu: Math.min(W, H) / 5 };
      if (!running || reduce) frame(performance.now());
    }

    function project(p, cx, cy, ppu) {
      var f = 9, k = f / (f + p[2]);
      return [cx + p[0] * ppu * k, cy + p[1] * ppu * k, p[2]];
    }

    function drawInstance(inst, px, py, ppu, alpha, edge, boost) {
      var m = inst.mesh, out = [], n, j, v, a, b, c, e1, e2, nm, pv = [];
      for (j = 0; j < m.length; j++) {
        var tr = m[j], P = [];
        for (v = 0; v < 3; v++) {
          var q = rot(tr.v[v], inst.rx, inst.ry, inst.rz);
          q = [q[0] * inst.scale + inst.pos[0], q[1] * inst.scale + inst.pos[1], q[2] * inst.scale + inst.pos[2]];
          P.push(q);
        }
        e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]];
        e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
        nm = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        var len = Math.hypot(nm[0], nm[1], nm[2]) || 1; nm = [nm[0] / len, nm[1] / len, nm[2] / len];
        if (nm[2] > 0) nm = [-nm[0], -nm[1], -nm[2]];            // face the camera
        out.push({ P: P, n: nm, col: tr.col, z: (P[0][2] + P[1][2] + P[2][2]) / 3 });
      }
      out.sort(function (A, B) { return B.z - A.z; });
      ctx.lineJoin = "round";
      for (j = 0; j < out.length; j++) {
        var f = out[j];
        a = project(f.P[0], px, py, ppu); b = project(f.P[1], px, py, ppu); c = project(f.P[2], px, py, ppu);
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath();
        ctx.fillStyle = shade(f.col, f.n, boost);
        ctx.fill();
        ctx.lineWidth = edge ? 1.1 : 0.7;
        ctx.strokeStyle = edge ? "rgba(246,222,150,.75)" : "rgba(246,222,150,.28)";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      var t = (now - t0) / 1000;
      mouse.tx = input.pointerX;
      mouse.ty = input.pointerY;
      scrollY = input.scrollY - canvasPageTop;
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      ctx.clearRect(0, 0, W, H);

      // dust
      var d, dx, dy;
      for (i = 0; i < dust.length; i++) {
        d = dust[i];
        dx = ((d.x + t * 0.004 * (0.3 + d.z)) % 1) * W + mouse.x * 16 * d.z;
        dy = ((d.y - t * 0.006 * (0.3 + d.z) + 1) % 1) * H + mouse.y * 12 * d.z;
        ctx.globalAlpha = (0.25 + 0.55 * Math.abs(Math.sin(t * 0.8 + d.p))) * (0.3 + d.z * 0.7);
        ctx.fillStyle = d.gold ? "#f1d48a" : "#ff5c7f";
        ctx.beginPath(); ctx.arc(dx, dy, 0.6 + d.z * 1.4, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      var ppu = layout.ppu, items = [], s;
      // shards (placed on screen-space grid, drift + spin)
      for (i = 0; i < shards.length; i++) {
        s = shards[i];
        s.rx += 0.004 * s.vx + 0.002; s.ry += 0.005 * s.vy + 0.003; s.rz += 0.003 * s.vz;
        var wx = s.nx * (W / ppu) * 0.55 + Math.sin(t * 0.4 + s.bob) * 0.18 + mouse.x * 0.35 * (s.z + 3) * 0.12;
        var wy = s.ny * (H / ppu) * 0.55 + Math.cos(t * 0.35 + s.bob) * 0.22 + mouse.y * 0.25 * (s.z + 3) * 0.12;
        s.pos = [wx, wy - scrollY * 0.0006 * (s.z + 3), s.z];
        items.push(s);
      }
      // main arrow
      var A = arrow;
      var intro = Math.min(1, t / 1.6), ease = 1 - Math.pow(1 - intro, 3);
      A.scale = (opt.arrowScale || 1) * (0.55 + 0.45 * ease);
      A.pos = [0, Math.sin(t * 0.9) * 0.12, 0];
      A.ry = -0.2 + Math.sin(t * 0.55) * 0.35 + mouse.x * 0.45 + (1 - ease) * 3.2 + scrollY * 0.0009;
      A.rx = 0.12 + Math.sin(t * 0.42) * 0.12 - mouse.y * 0.3;
      A.rz = -0.08 + Math.sin(t * 0.3) * 0.05;

      // draw far shards, then arrow, then near shards
      items.sort(function (a, b) { return b.z - a.z; });
      var arrowDrawn = false, fade = opt.shardAlpha != null ? opt.shardAlpha : 0.85;
      for (i = 0; i < items.length; i++) {
        s = items[i];
        if (!arrowDrawn && s.z < 0) { if (!opt.noArrow) drawInstance(A, layout.cx, layout.cy, ppu, 1, true, 1.3); arrowDrawn = true; }
        var sx = layout.cx + s.pos[0] * ppu, a = fade * (1 - (s.z + 2.5) / 12);
        // keep the text column calmer on wide hero layouts
        if (opt.calmLeft && sx < W * opt.calmLeft) a *= 0.28;
        drawInstance(s, layout.cx, layout.cy, ppu, Math.max(0.15, a), false, 0.95);
      }
      if (!arrowDrawn && !opt.noArrow) drawInstance(A, layout.cx, layout.cy, ppu, 1, true, 1.3);
    }

    function loop(now) {
      if (!running) return;
      frame(now);
      requestAnimationFrame(loop);
    }
    function start() { if (running || reduce || !visible || document.hidden) return; running = true; requestAnimationFrame(loop); }
    function stop() { running = false; }

    window.addEventListener("resize", resize, { passive: true });
    visibilityHandlers.push(function (hidden) { hidden ? stop() : start(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(canvas);
    }
    resize();
    // draw the first frame at its final pose when motion is reduced
    if (reduce) { t0 = performance.now() - 5000; frame(performance.now()); } else start();
    return { resize: resize, start: start, stop: stop };
  }

  /* ---------- one fixed universe scene for the whole page ---------- */
  function createUniverse(canvas) {
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mobile = window.matchMedia && matchMedia("(max-width: 700px)").matches;
    var dprCap = mobile ? 1 : 1.35;
    var rand = rng(19);
    var dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    var W = 0, H = 0;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var running = false, t0 = performance.now();
    var scrollY = input.scrollY;
    var band = 900;

    var nShards = mobile ? 10 : 20;
    var nDust = mobile ? 36 : 72;
    var shards = [], dust = [], i;

    function placeX(r) {
      // Bias crystals to the sides so copy stays readable
      if (r < 0.14) return (r / 0.14 - 0.5) * 0.42;
      if (r < 0.57) return -0.92 + (r - 0.14) / 0.43 * 0.38;
      return 0.54 + (r - 0.57) / 0.43 * 0.42;
    }

    for (i = 0; i < nShards; i++) {
      var r = rand();
      shards.push({
        mesh: shardMesh(rand),
        nx: placeX(r),
        ny: rand(),
        z: rand() * 8 - 2.2,
        scale: (Math.abs(placeX(r)) > 0.65 ? 0.16 : 0.09) + rand() * 0.2,
        rx: rand() * TAU, ry: rand() * TAU, rz: rand() * TAU,
        vx: (rand() - 0.5) * 0.7, vy: (rand() - 0.5) * 0.7, vz: (rand() - 0.5) * 0.55,
        bob: rand() * TAU,
        par: 0.22 + rand() * 0.55,
        lane: i % 3
      });
    }
    for (i = 0; i < nDust; i++) {
      dust.push({
        x: rand(), y: rand(), z: 0.15 + rand() * 0.85,
        p: rand() * TAU, gold: rand() > 0.32,
        s: 0.5 + rand() * 1.4, tw: 0.45 + rand() * 1.1
      });
    }

    function measure() {
      band = Math.max(H * 1.35, 720);
    }

    function resize() {
      W = Math.max(1, window.innerWidth);
      H = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
      if (!running || reduce) frame(performance.now());
    }

    function project(p, cx, cy, ppu) {
      var f = 9, k = f / (f + p[2]);
      return [cx + p[0] * ppu * k, cy + p[1] * ppu * k, p[2]];
    }

    function drawInstance(inst, px, py, ppu, alpha, edge, boost) {
      var m = inst.mesh, out = [], j, v;
      for (j = 0; j < m.length; j++) {
        var tr = m[j], P = [];
        for (v = 0; v < 3; v++) {
          var q = rot(tr.v[v], inst.rx, inst.ry, inst.rz);
          P.push([q[0] * inst.scale + inst.pos[0], q[1] * inst.scale + inst.pos[1], q[2] * inst.scale + inst.pos[2]]);
        }
        var e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]];
        var e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
        var nm = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        var len = Math.hypot(nm[0], nm[1], nm[2]) || 1;
        nm = [nm[0] / len, nm[1] / len, nm[2] / len];
        if (nm[2] > 0) nm = [-nm[0], -nm[1], -nm[2]];
        out.push({ P: P, n: nm, col: tr.col, z: (P[0][2] + P[1][2] + P[2][2]) / 3 });
      }
      out.sort(function (A, B) { return B.z - A.z; });
      ctx.lineJoin = "round";
      for (j = 0; j < out.length; j++) {
        var f = out[j];
        var a = project(f.P[0], px, py, ppu), b = project(f.P[1], px, py, ppu), c = project(f.P[2], px, py, ppu);
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath();
        ctx.fillStyle = shade(f.col, f.n, boost);
        ctx.fill();
        ctx.lineWidth = edge ? 1.05 : 0.65;
        ctx.strokeStyle = edge ? "rgba(246,222,150,.7)" : "rgba(246,222,150,.26)";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function wrap(v, span) {
      return ((v % span) + span) % span;
    }

    function frame(now) {
      var t = (now - t0) / 1000;
      mouse.tx = input.pointerX;
      mouse.ty = input.pointerY;
      mouse.x += (mouse.tx - mouse.x) * 0.055;
      mouse.y += (mouse.ty - mouse.y) * 0.055;
      scrollY += (input.scrollY - scrollY) * (reduce ? 1 : 0.12);
      ctx.clearRect(0, 0, W, H);

      // Layer 2 – starfield
      var d, dx, dy, drift;
      for (i = 0; i < dust.length; i++) {
        d = dust[i];
        drift = d.z * (0.35 + d.tw * 0.2);
        dx = wrap(d.x * W + t * (3 + d.z * 8) + mouse.x * 14 * d.z + Math.sin(t * 0.15 + d.p) * 8, W);
        dy = wrap(d.y * H - t * (4 + drift * 6) - scrollY * 0.045 * d.z + mouse.y * 10 * d.z, H);
        var twinkle = 0.22 + 0.58 * Math.abs(Math.sin(t * d.tw + d.p));
        ctx.globalAlpha = twinkle * (0.28 + d.z * 0.6);
        ctx.fillStyle = d.gold ? "#f1d48a" : "#ff6a88";
        ctx.beginPath();
        ctx.arc(dx, dy, d.s * (0.45 + d.z * 1.05), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      var ppu = Math.min(W, H) / (mobile ? 6.2 : 5.6);
      var cx = W / 2, cy = H / 2;
      var s, wx, wy, sy, a, sx;

      for (i = 0; i < shards.length; i++) {
        s = shards[i];
        if (!reduce) {
          s.rx += 0.0032 * s.vx + 0.0016;
          s.ry += 0.004 * s.vy + 0.0024;
          s.rz += 0.0024 * s.vz;
        }
        wx = s.nx * (W / ppu) * 0.52 + Math.sin(t * 0.32 + s.bob) * 0.16 + mouse.x * 0.28 * (s.z + 3) * 0.1;
        sy = wrap(s.ny * band - scrollY * s.par + Math.cos(t * 0.28 + s.bob) * 18, band) - band * 0.12;
        wy = (sy - H * 0.5) / ppu + mouse.y * 0.18 * (s.z + 3) * 0.08;
        s.pos = [wx, wy, s.z];

        if (sy < -80 || sy > H + 80) continue;

        a = 0.72 * (1 - (s.z + 2.2) / 12);
        sx = cx + wx * ppu;
        // keep the reading column calmer, especially on the hero
        if (sx > W * 0.22 && sx < W * 0.78) {
          a *= s.scale > 0.18 ? 0.22 : 0.45;
        }
        if (scrollY < H * 0.85 && sx < W * 0.42) a *= 0.32;
        if (a < 0.06) continue;
        drawInstance(s, cx, cy, ppu, Math.max(0.1, Math.min(0.85, a)), false, 0.92);
      }
    }

    function loop(now) {
      if (!running) return;
      frame(now);
      requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduce || document.hidden) return;
      running = true;
      requestAnimationFrame(loop);
    }
    function stop() { running = false; }

    window.addEventListener("resize", resize, { passive: true });
    visibilityHandlers.push(function (hidden) { hidden ? stop() : start(); });
    if (window.ResizeObserver) {
      new ResizeObserver(function () { measure(); }).observe(document.documentElement);
    }
    resize();
    if (reduce) { t0 = performance.now() - 8000; frame(performance.now()); }
    else start();
    return { resize: resize, start: start, stop: stop };
  }

  window.AF3D = { create: create, createUniverse: createUniverse };

  function init() {
    var universe = document.getElementById("universe-canvas");
    if (universe) createUniverse(universe);

    var front = document.getElementById("hero-arrow");
    if (front) {
      create(front, {
        seed: 3, shards: 0, dust: 0, arrowScale: 0.8,
        layout: function (r, W, H) {
          return { cx: W * 0.51, cy: H * 0.8, ppu: Math.min(W, 760) / 9.4 };
        }
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

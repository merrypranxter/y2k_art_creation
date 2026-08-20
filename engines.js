/* ============================================================
   ENGINES — 8 animated pixel-art background systems.
   Rules enforced everywhere:
   - integer pixels only, no smoothing, no alpha
   - flat palette colors; dithering fakes gradients
   - animation = discrete frames, loops perfectly at F frames
   Internal canvas: 180 x 320 (9:16), scaled up by the app.
   ============================================================ */

let IW = 180, IH = 320; // mutable: text engines swap formats

/* ---------- utils ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
/* two-color dithered fill; mix = fraction of c2 (0..1) */
function ditherRect(ctx, x, y, w, h, c1, c2, mix, jitter = 0) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const th = (BAYER4[(y + j) & 3][(x + i) & 3] + 0.5) / 16;
      const m = jitter ? mix + (hash2(x + i, y + j) - 0.5) * jitter : mix;
      ctx.fillStyle = m > th ? c2 : c1;
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}
function fillCirclePix(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  const ri = Math.ceil(r);
  for (let j = -ri; j <= ri; j++)
    for (let i = -ri; i <= ri; i++)
      if (i * i + j * j <= r * r) ctx.fillRect(cx + i, cy + j, 1, 1);
}

/* ============================================================
   ENGINE 1 — VOID STARFIELD
   Poisson scatter of stars + eyes + sigils, each twinkling on
   its own timer. Goth mode.
   ============================================================ */
const voidStarfield = {
  name: "VOID STARFIELD",
  tag: "starfield scatter · goth mode",
  init(rng, density) {
    const pts = [];
    const count = Math.round(90 * density);
    let guard = 0;
    while (pts.length < count && guard++ < 4000) {
      const x = 4 + rng() * (IW - 8), y = 4 + rng() * (IH - 8);
      const big = rng() < 0.18;
      const minD = big ? 16 : 7;
      if (pts.some(p => Math.hypot(p.x - x, p.y - y) < minD)) continue;
      pts.push({ x, y, big });
    }
    const items = pts.map(p => {
      const roll = rng();
      let sprite;
      if (p.big) {
        sprite = roll < 0.3 ? "star_5" : roll < 0.5 ? "sparkle" : roll < 0.65 ? "eye_outline"
          : roll < 0.8 ? "moon_outline" : roll < 0.9 ? "sigil_2" : "ufo";
      } else {
        sprite = roll < 0.5 ? "star_tiny" : roll < 0.75 ? "star_4" : roll < 0.9 ? "diamond" : "sigil_1";
      }
      return {
        x: Math.round(p.x), y: Math.round(p.y), sprite,
        c1: Math.floor(rng() * 10), c2: Math.floor(rng() * 10),
        period: 2 + Math.floor(rng() * 5), duty: 1 + Math.floor(rng() * 3),
        phase: Math.floor(rng() * 8),
      };
    });
    return { items };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    for (const it of st.items) {
      const on = ((frame + it.phase) % it.period) < it.duty;
      if (!on) continue;
      const col = pal.main[(((frame + it.phase) % it.period === 0) ? it.c2 : it.c1) % n];
      drawSpriteC(ctx, SPRITES[it.sprite], it.x, it.y, col);
    }
  },
};

/* ============================================================
   ENGINE 2 — BLINGEE STORM
   Dense jittered sparkle field + hero cross-flares pulsing.
   Maximalist mode.
   ============================================================ */
const blingeeStorm = {
  name: "BLINGEE STORM",
  tag: "sparkle storm · maximalist",
  init(rng, density) {
    const cell = Math.max(8, Math.round(12 / density));
    const field = [];
    for (let gy = 0; gy * cell < IH; gy++)
      for (let gx = 0; gx * cell < IW; gx++) {
        const nHere = 1 + (rng() < 0.4 ? 1 : 0) + (rng() < 0.15 ? 1 : 0);
        for (let k = 0; k < nHere; k++)
          field.push({
            x: Math.round(gx * cell + rng() * cell),
            y: Math.round(gy * cell + rng() * cell),
            c: Math.floor(rng() * 10),
            phase: Math.floor(rng() * 4),
          });
      }
    const heroes = [];
    const heroesN = Math.round(6 * density);
    for (let i = 0; i < heroesN; i++)
      heroes.push({
        x: Math.round(14 + rng() * (IW - 28)),
        y: Math.round(14 + rng() * (IH - 28)),
        sprite: ["flare", "heart", "moon", "star_5"][Math.floor(rng() * 4)],
        c: Math.floor(rng() * 10),
        phase: i % 4,
      });
    return { field, heroes };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const shift = Math.floor(frame / 2);
    for (const f of st.field) {
      const on = ((frame + f.phase) % 2) === 0;
      if (!on) continue;
      ctx.fillStyle = pal.main[(f.c + shift) % n];
      ctx.fillRect(f.x, f.y, 1, 1);
      if ((f.phase + frame) % 4 === 0) { // occasional plus twinkle
        ctx.fillRect(f.x - 1, f.y, 1, 1); ctx.fillRect(f.x + 1, f.y, 1, 1);
        ctx.fillRect(f.x, f.y - 1, 1, 1); ctx.fillRect(f.x, f.y + 1, 1, 1);
      }
    }
    for (const h of st.heroes) {
      const big = ((frame + h.phase) % 4) < 2;
      const col = pal.main[(h.c + shift) % n];
      const spr = big ? SPRITES[h.sprite] : SPRITES[h.sprite === "flare" ? "sparkle" : h.sprite];
      const cx = h.x + (((frame + h.phase) % 8) < 4 ? 0 : 1); // 1px jitter
      // heroes render at 2x pixel scale so they anchor the storm
      const w = spr[0].length, hh = spr.length;
      const ox = cx - w, oy = h.y - hh;
      for (let r = 0; r < hh; r++)
        for (let c = 0; c < w; c++) {
          if (spr[r][c] === '.') continue;
          ctx.fillStyle = ((c + r + frame) % 5 === 0) ? "#FFFFFF" : col;
          ctx.fillRect(ox + c * 2, oy + r * 2, 2, 2);
        }
    }
  },
};

/* ============================================================
   ENGINE 3 — RAINBOWBLOOD SKYFALL
   Full-bleed rainbow band with a pixelated organic top edge and
   drips that elongate, detach, and fall. Vertical edition.
   ============================================================ */
const rainbowblood = {
  name: "RAINBOWBLOOD SKYFALL",
  tag: "melting rainbow · abstract fluid",
  init(rng, density) {
    const drips = [];
    const nDrips = Math.round(10 * density);
    for (let i = 0; i < nDrips; i++)
      drips.push({
        x: Math.floor(rng() * IW),
        base: 20 + rng() * 40,
        amp: 10 + rng() * 30,
        phase: rng(),
        speedK: 1 + Math.floor(rng() * 2),
        drop: rng() < 0.6,
        dropPhase: rng(),
      });
    return { drips };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    const colW = 3; // pixel width per color step => blocky bands
    for (let x = 0; x < IW; x++) {
      const ci = ((Math.floor(x / colW) + Math.floor(t * n)) % n + n) % n;
      const color = pal.main[ci];
      const topEdge = 26 + Math.floor(14 * hash2(x, 7) + 8 * Math.sin(x * 0.3));
      // body
      ctx.fillStyle = color;
      let len = 34 + Math.floor(16 * hash2(x, 13));
      for (let y = topEdge; y < topEdge + len && y < IH; y++) ctx.fillRect(x, y, 1, 1);
      // ragged bottom: a couple stray pixels
      if (hash2(x, frame >> 2) > 0.75) ctx.fillRect(x, topEdge + len, 1, 1);
    }
    // drips
    for (const d of st.drips) {
      const ci = ((Math.floor(d.x / 3) + Math.floor(t * pal.main.length)) % n + n) % n;
      const color = pal.main[ci];
      const topEdge = 26 + Math.floor(14 * hash2(d.x, 7) + 8 * Math.sin(d.x * 0.3));
      const osc = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t * d.speedK + d.phase));
      const len = Math.floor(d.base + d.amp * osc);
      ctx.fillStyle = color;
      for (let y = 0; y < len; y++) {
        const yy = topEdge + 20 + y;
        if (yy < IH) ctx.fillRect(d.x, yy, 1, 1);
        if (y > len - 4 && y < len - 1 && d.x + 1 < IW) ctx.fillRect(d.x + 1, yy, 1, 1);
      }
      // drop head
      const hy = topEdge + 20 + len;
      if (hy + 2 < IH) drawSpriteC(ctx, SPRITES.drop, d.x, hy + 2, color);
      // detached falling droplet
      if (d.drop) {
        const fallT = (t * d.speedK + d.dropPhase) % 1;
        const fy = Math.floor(hy + fallT * (IH - hy - 8));
        if (fy > hy + 6) drawSpriteC(ctx, SPRITES.drop, d.x, fy, color);
      }
    }
  },
};

/* ============================================================
   ENGINE 4 — NEON SIGIL FIELD
   Outline-only hearts, moons, skulls, eyes, sigils scattered
   with overlap, hue-cycling like neon signs.
   ============================================================ */
const neonSigil = {
  name: "NEON SIGIL FIELD",
  tag: "neon outline · overlap allowed",
  init(rng, density) {
    const items = [];
    const count = Math.round(46 * density);
    const kinds = ["heart_outline", "moon_outline", "eye_outline", "sigil_1", "sigil_2", "skull", "star_4"];
    for (let i = 0; i < count; i++)
      items.push({
        x: Math.round(rng() * IW), y: Math.round(rng() * IH),
        sprite: kinds[Math.floor(rng() * kinds.length)],
        c: Math.floor(rng() * 10),
        period: 3 + Math.floor(rng() * 6),
        phase: Math.floor(rng() * 10),
        blink: rng() < 0.35,
      });
    return { items };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const hueShift = Math.floor(frame / 3);
    for (const it of st.items) {
      if (it.blink && ((frame + it.phase) % it.period) === 0) continue; // neon flicker
      const col = pal.main[(it.c + hueShift) % n];
      const doubleUp = ((frame + it.phase) % (it.period * 2)) < it.period; // neon "buzz" ghost
      drawSpriteC(ctx, SPRITES[it.sprite], it.x, it.y, col);
      if (doubleUp && it.blink)
        drawSpriteC(ctx, SPRITES[it.sprite], it.x + 1, it.y, (ch, c, r) =>
          ((c + r) % 2 === 0) ? col : pal.main[(it.c + hueShift + 1) % n]);
    }
  },
};

/* ============================================================
   ENGINE 5 — HALFTONE ORGANISM
   Wave-modulated dot grid. Dots breathe in size along traveling
   sine waves; diagonal rainbow bands cycle.
   ============================================================ */
const halftoneOrganism = {
  name: "HALFTONE ORGANISM",
  tag: "halftone wave · graphic edge",
  init(rng, density) {
    return { cell: Math.max(6, Math.round(9 / density)), seed: Math.floor(rng() * 999) };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    const cell = st.cell;
    const bandShift = Math.floor(t * n * 2);
    for (let gy = 0; gy * cell < IH + cell; gy++)
      for (let gx = 0; gx * cell < IW + cell; gx++) {
        const cx = gx * cell + (cell >> 1), cy = gy * cell + (cell >> 1);
        const wave = Math.sin(cx * 0.09 + 2 * Math.PI * t) + Math.sin(cy * 0.07 - 2 * Math.PI * t * 0.5 + 1.3);
        const r = (0.8 + (wave + 2) * 0.45) * (cell / 9);
        const band = Math.floor((cx + cy) / 26);
        const color = pal.main[((band + bandShift) % n + n) % n];
        if (r < 1.4) {
          ctx.fillStyle = color; ctx.fillRect(cx, cy, 1, 1);
        } else if (r < cell * 0.28) {
          fillCirclePix(ctx, cx, cy, r, color);
        } else {
          drawSpriteC(ctx, SPRITES.star_tiny, cx, cy, color); // big dots become stars
          fillCirclePix(ctx, cx, cy, r * 0.5, color);
        }
      }
  },
};

/* ============================================================
   ENGINE 6 — DREAM ROOM DRIFT
   Dithered pastel sky, sparse twinkle stars, one giant cratered
   moon with pulsing glow, three cloud layers drifting at
   different depths, floating hearts. Kawaii mode.
   ============================================================ */
const dreamRoom = {
  name: "DREAM ROOM DRIFT",
  tag: "scenic vignette · kawaii mode",
  init(rng, density) {
    const stars = [];
    for (let i = 0; i < Math.round(50 * density); i++)
      stars.push({
        x: Math.round(rng() * IW), y: Math.round(rng() * IH * 0.75),
        phase: Math.floor(rng() * 6), period: 3 + Math.floor(rng() * 4),
        c: Math.floor(rng() * 10),
      });
    const clouds = [];
    const layers = [
      { y: IH * 0.42, speed: 0.25, n: 4 },
      { y: IH * 0.62, speed: 0.5, n: 4 },
      { y: IH * 0.82, speed: 1.0, n: 5 },
    ];
    layers.forEach((L, li) => {
      for (let i = 0; i < L.n; i++)
        clouds.push({
          layer: li, speed: L.speed,
          x0: rng() * (IW + 40) - 20,
          y: L.y + (rng() * 26 - 13),
          scale: li === 2 ? 2 : 1,
          c: Math.floor(rng() * 10),
        });
    });
    const hearts = [];
    for (let i = 0; i < Math.round(8 * density); i++)
      hearts.push({
        x: Math.round(rng() * IW), y: Math.round(rng() * IH),
        phase: rng(), c: Math.floor(rng() * 10),
      });
    return { stars, clouds, hearts };
  },
  draw(ctx, st, frame, F, pal) {
    // dithered sky: bg -> main[2], bottom gets main[0] haze
    const skyA = pal.bg[0], skyB = pal.main[2 % pal.main.length];
    for (let y = 0; y < IH; y++) {
      const mix = y / IH;
      ditherRect(ctx, 0, y, IW, 1, skyA, skyB, mix * 0.85);
    }
    // stars
    const n = pal.main.length;
    for (const s of st.stars) {
      if (((frame + s.phase) % s.period) !== 0) continue;
      ctx.fillStyle = pal.main[s.c % n];
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // giant moon — pale body, craters in first palette color
    const mx = IW / 2, my = IH * 0.24, mr = 30;
    const glowOn = (frame % 4) < 2;
    const moonBody = pal.main[n - 1], moonCrater = pal.main[0];
    fillCirclePix(ctx, mx, my, mr, moonCrater);
    fillCirclePix(ctx, mx, my, mr - 2, moonBody);
    // craters
    [[-10, -6, 4], [8, 4, 5], [-2, 12, 3], [12, -10, 3]].forEach(([dx, dy, r]) =>
      fillCirclePix(ctx, mx + dx, my + dy, r, moonCrater));
    if (glowOn) { // dithered glow ring
      ctx.fillStyle = moonBody;
      for (let a = 0; a < 64; a++) {
        const th = (a / 64) * 2 * Math.PI;
        const gx = Math.round(mx + Math.cos(th) * (mr + 3));
        const gy = Math.round(my + Math.sin(th) * (mr + 3));
        if ((a + frame) % 2 === 0) ctx.fillRect(gx, gy, 1, 1);
      }
    }
    // clouds, back to front
    for (let li = 0; li < 3; li++) {
      for (const c of st.clouds) {
        if (c.layer !== li) continue;
        const t = frame / F;
        const span = IW + 60;
        let x = (c.x0 + t * c.speed * span) % span - 30;
        const col = pal.main[(c.c + li) % n];
        drawSpriteCS(ctx, SPRITES.cloud, Math.round(x), Math.round(c.y),
          (ch, cc, rr) => ((cc + rr + li) % 7 === 0) ? "#FFFFFF" : col,
          c.scale === 2 ? 2 : 1);
      }
    }
    // floating hearts
    for (const h of st.hearts) {
      const bob = Math.floor(3 * Math.sin(2 * Math.PI * ((frame / F) + h.phase)));
      const drift = Math.floor(2 * Math.cos(2 * Math.PI * ((frame / F) * 0.5 + h.phase)));
      drawSpriteC(ctx, SPRITES.heart, h.x + drift, h.y + bob, pal.main[h.c % n]);
    }
  },
};

/* ============================================================
   ENGINE 7 — MYCELIUM NET
   Living network: jittered node grid, veins between neighbors,
   pulse signals traveling along veins, blinking spores, and
   hyphae rings growing out of nodes. The equation is the organism.
   ============================================================ */
const myceliumNet = {
  name: "MYCELIUM NET",
  tag: "living network · bio-math",
  init(rng, density) {
    const cell = Math.max(16, Math.round(24 / density));
    const nodes = [];
    const cols = Math.ceil(IW / cell) + 1, rows = Math.ceil(IH / cell) + 1;
    for (let gy = 0; gy < rows; gy++)
      for (let gx = 0; gx < cols; gx++)
        nodes.push({
          gx, gy,
          x: Math.round(gx * cell + (rng() - 0.5) * cell * 0.7),
          y: Math.round(gy * cell + (rng() - 0.5) * cell * 0.7),
          c: Math.floor(rng() * 10), phase: Math.floor(rng() * 8),
        });
    const at = (gx, gy) => nodes.find(nd => nd.gx === gx && nd.gy === gy);
    const veins = [];
    for (const nd of nodes) {
      [[1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => {
        const nb = at(nd.gx + dx, nd.gy + dy);
        if (nb && hash2(nd.gx * 3 + dx, nd.gy * 5 + dy) < 0.62)
          veins.push({ a: nd, b: nb, h: hash2(nd.gx, nd.gy * 7 + dx) });
      });
    }
    const rings = nodes.filter(() => rng() < 0.3).map(nd => ({
      x: nd.x, y: nd.y, phase: rng(), maxR: 10 + rng() * 16, c: Math.floor(rng() * 10),
    }));
    return { nodes, veins, rings };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    // veins — Bresenham-ish pixel lines, pulse signal travels
    for (const v of st.veins) {
      const dx = v.b.x - v.a.x, dy = v.b.y - v.a.y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const signal = (frame / F + v.h) % 1; // 0..1 along the vein
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = Math.round(v.a.x + dx * u), y = Math.round(v.a.y + dy * u);
        const nearSignal = Math.abs(u - signal) < 0.08;
        ctx.fillStyle = nearSignal
          ? pal.main[(v.a.c + 3) % n]
          : ((i + frame) % 3 === 0 ? pal.main[v.a.c % n] : pal.main[(v.a.c + n - 1) % n]);
        if (!nearSignal && (i % 2)) continue; // dashed vein = pixel organism texture
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // nodes — pulsing spores
    for (const nd of st.nodes) {
      const on = ((frame + nd.phase) % 4) < 3;
      if (!on) continue;
      const big = ((frame + nd.phase) % 8) < 4;
      fillCirclePix(ctx, nd.x, nd.y, big ? 2 : 1, pal.main[nd.c % n]);
      if (big) { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(nd.x, nd.y, 1, 1); }
    }
    // growing hyphae rings
    for (const r of st.rings) {
      const rt = ((frame / F) + r.phase) % 1;
      const rad = Math.floor(rt * r.maxR);
      if (rad < 2) continue;
      ctx.fillStyle = pal.main[r.c % n];
      for (let a = 0; a < 48; a++) {
        const th = (a / 48) * 2 * Math.PI;
        if ((a + frame) % 3 === 0) // broken ring = organic
          ctx.fillRect(Math.round(r.x + Math.cos(th) * rad), Math.round(r.y + Math.sin(th) * rad), 1, 1);
      }
    }
  },
};

/* ============================================================
   ENGINE 8 — KALEIDO GLITCH
   8-fold kaleidoscope of pixel-block pattern, rotating in
   discrete steps, with glitch row-slices and chromatic tears.
   Astral Trash damage.
   ============================================================ */
const kaleidoGlitch = {
  name: "KALEIDO GLITCH",
  tag: "kaleidoscope + analog damage",
  init(rng, density) {
    return { sectors: 8, seed: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal, tmp) {
    const n = pal.main.length;
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const cx = IW / 2, cy = IH / 2;
    const rotStep = Math.floor((frame / F) * st.sectors * 2); // discrete rotation
    const rot = (rotStep * Math.PI * 2) / (st.sectors * 4);
    const block = 4; // chunky pattern cells
    const breathe = Math.floor(6 * Math.sin(2 * Math.PI * frame / F));
    for (let y = 0; y < IH; y += 1)
      for (let x = 0; x < IW; x += 1) {
        const dx = x - cx, dy = y - cy;
        const r = Math.hypot(dx, dy);
        if (r > IH / 2 + 30) continue;
        let th = Math.atan2(dy, dx) - rot;
        const seg = (Math.PI * 2) / st.sectors;
        th = ((th % seg) + seg) % seg;
        if (th > seg / 2) th = seg - th; // mirror fold
        // sample a coherent motif in folded space
        const px = Math.floor((Math.cos(th) * r) / block);
        const py = Math.floor((Math.sin(th) * r) / block);
        const v = Math.sin(px * 0.9 + st.seed) + Math.cos(py * 0.7 - st.seed * 0.3)
          + Math.sin((px + py) * 0.5 + breathe * 0.4);
        if (v < 0.55) continue; // void between mandala arms
        const ci = Math.floor(r / 16 + v * 2 + (frame >> 2)) % n;
        ctx.fillStyle = pal.main[((ci % n) + n) % n];
        ctx.fillRect(x, y, 1, 1);
      }
    // central eye sigil
    drawSpriteC(ctx, SPRITES.eye, cx, cy, pal.main[(frame >> 1) % n]);
    drawSpriteC(ctx, SPRITES.sigil_2, cx, cy, (ch, c, r) =>
      ((c + r + frame) % 3 === 0) ? "#FFFFFF" : pal.main[(frame >> 1) % n]);
    // glitch slices — deterministic per frame, occasional
    const gRng = mulberry32(frame * 7919 + 13);
    const nSlices = (frame % 7 === 0) ? 4 : (frame % 4 === 0 ? 2 : 0);
    for (let s = 0; s < nSlices; s++) {
      const sy = Math.floor(gRng() * (IH - 8));
      const sh = 2 + Math.floor(gRng() * 5);
      const off = Math.floor((gRng() - 0.5) * 30);
      if (off === 0) continue;
      const img = ctx.getImageData(0, sy, IW, sh);
      // chromatic tear: tint the displaced slice
      const d = img.data;
      const tear = pal.main[Math.floor(gRng() * n)];
      const tr = parseInt(tear.slice(1, 3), 16), tg = parseInt(tear.slice(3, 5), 16), tb = parseInt(tear.slice(5, 7), 16);
      if (gRng() < 0.5)
        for (let i = 0; i < d.length; i += 4)
          if (d[i + 3] > 0 && (d[i] || d[i + 1] || d[i + 2])) { d[i] = tr; d[i + 1] = tg; d[i + 2] = tb; }
      ctx.putImageData(img, off, sy);
    }
  },
};

const ENGINES = [
  voidStarfield, blingeeStorm, rainbowblood, neonSigil,
  halftoneOrganism, dreamRoom, myceliumNet, kaleidoGlitch,
];

/* ============================================================
   ENGINE 9 — SIGIL ORBIT WHEEL
   Concentric rings of sigils/eyes/moons orbiting in discrete
   steps, alternating directions. Hollow center so whatever's
   behind shows through. Made for transparency.
   ============================================================ */
const sigilOrbit = {
  name: "SIGIL ORBIT WHEEL",
  tag: "orbit mandala · hollow center",
  init(rng, density) {
    const kinds = ["eye_outline", "moon_outline", "sigil_1", "sigil_2", "heart_outline", "star_4", "skull", "diamond"];
    const rings = [];
    const defs = [
      { r: 44, k: 7, dir: 1, steps: 12 },
      { r: 70, k: 10, dir: -1, steps: 18 },
      { r: 96, k: 13, dir: 1, steps: 24 },
      { r: 124, k: 16, dir: -1, steps: 30 },
    ];
    for (const d of defs) {
      const items = [];
      const kk = Math.max(3, Math.round(d.k * density));
      for (let i = 0; i < kk; i++)
        items.push({
          a0: (i / kk) * 2 * Math.PI,
          sprite: kinds[Math.floor(rng() * kinds.length)],
          c: Math.floor(rng() * 10),
          phase: Math.floor(rng() * 6),
          period: 3 + Math.floor(rng() * 4),
        });
      rings.push({ ...d, k: kk, items });
    }
    return { rings };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const cx = IW / 2, cy = IH / 2;
    const t = frame / F;
    for (const ring of st.rings) {
      // discrete stepped rotation — hand-cranked, no tweening
      const step = Math.floor(t * ring.steps) / ring.steps;
      const rot = ring.dir * step * 2 * Math.PI;
      for (const it of ring.items) {
        const a = it.a0 + rot;
        const x = Math.round(cx + Math.cos(a) * ring.r);
        const y = Math.round(cy + Math.sin(a) * ring.r * 1.12); // elliptical for 9:16
        if (x < 6 || x > IW - 6 || y < 6 || y > IH - 6) continue;
        if (it.period > 4 && ((frame + it.phase) % it.period) === 0) continue; // twinkle out
        const col = pal.main[(it.c + Math.floor(frame / 4)) % n];
        drawSpriteC(ctx, SPRITES[it.sprite], x, y, col);
      }
    }
    // sparse dust between rings
    const dRng = mulberry32(99);
    for (let i = 0; i < 40; i++) {
      const x = Math.round(dRng() * IW), y = Math.round(dRng() * IH);
      if (Math.hypot(x - cx, (y - cy) / 1.35) < 40) continue;
      if (((frame + i) % 5) < 2) {
        ctx.fillStyle = pal.main[(i + Math.floor(frame / 3)) % n];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
};

/* ============================================================
   ENGINE 10 — KALEIDO BLOOM
   8-fold mandala that blooms open from center and collapses,
   in quantized growth steps. White petal edges, color bands
   cycling inward. Void outside the bloom.
   ============================================================ */
const kaleidoBloom = {
  name: "KALEIDO BLOOM",
  tag: "blooming mandala · petals",
  init(rng, density) {
    return { sectors: 8, seed: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const cx = IW / 2, cy = IH / 2;
    const t = frame / F;
    const seg = (Math.PI * 2) / st.sectors;
    // quantized bloom: 16 discrete sizes, patrol cycle (out then in)
    const osc = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
    const Rmax = 26 + 6 * Math.floor(22 * osc);
    const colorFlow = Math.floor(t * n * 2);
    for (let y = 0; y < IH; y++)
      for (let x = 0; x < IW; x++) {
        const dx = x - cx, dy = (y - cy) / 1.35;
        const r = Math.hypot(dx, dy);
        if (r > Rmax + 2) continue;
        let th = Math.atan2(dy, dx);
        th = ((th % seg) + seg) % seg;
        if (th > seg / 2) th = seg - th;
        // petal profile: full at petal centerline, pinched at seams
        const profile = 0.35 + 0.65 * Math.cos((th / (seg / 2)) * Math.PI / 2);
        const boundary = Rmax * profile;
        if (r > boundary) continue;
        // white rim at petal edge
        if (r > boundary - 2) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        // sparkle texture: drop some interior pixels
        if (hash2(x + st.seed, y - st.seed) < 0.12) continue;
        const ci = Math.floor(r / 9) + colorFlow;
        ctx.fillStyle = pal.main[((ci % n) + n) % n];
        ctx.fillRect(x, y, 1, 1);
      }
    // core eye
    drawSpriteC(ctx, SPRITES.eye, cx, cy, pal.main[(colorFlow + 2) % n]);
  },
};

/* ============================================================
   ENGINE 11 — SPORE CONSTELLATION
   Drifting spore nodes; veins spark into existence between any
   two nodes that drift close, then dissolve. Living star-map.
   ============================================================ */
const sporeConstellation = {
  name: "SPORE CONSTELLATION",
  tag: "drifting network · veins form + dissolve",
  init(rng, density) {
    const nodes = [];
    const count = Math.round(42 * density);
    for (let i = 0; i < count; i++)
      nodes.push({
        bx: 10 + rng() * (IW - 20), by: 10 + rng() * (IH - 20),
        ax: 4 + rng() * 13, ay: 5 + rng() * 17,
        fx: 0.5 + rng(), fy: 0.5 + rng(),
        px: rng(), py: rng(),
        c: Math.floor(rng() * 10),
        big: rng() < 0.3,
        phase: Math.floor(rng() * 6),
      });
    return { nodes, linkDist: 44 };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    // current positions (quantized to integers — chunky drift)
    const pos = st.nodes.map(nd => ({
      x: Math.round(nd.bx + nd.ax * Math.sin(2 * Math.PI * (t * nd.fx + nd.px))),
      y: Math.round(nd.by + nd.ay * Math.cos(2 * Math.PI * (t * nd.fy + nd.py))),
      nd,
    }));
    // dynamic veins
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i], b = pos[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > st.linkDist || d < 2) continue;
        const col = pal.main[(a.nd.c + b.nd.c) % n];
        const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
        const pulse = (t * 2 + hash2(i, j)) % 1;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          if ((s + frame) % 2) continue; // dashed
          const x = Math.round(a.x + (b.x - a.x) * u);
          const y = Math.round(a.y + (b.y - a.y) * u);
          ctx.fillStyle = Math.abs(u - pulse) < 0.12 ? "#FFFFFF" : col;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    // spore nodes
    for (const p of pos) {
      const on = ((frame + p.nd.phase) % 6) < 5;
      if (!on) continue;
      const col = pal.main[p.nd.c % n];
      if (p.nd.big) {
        drawSpriteC(ctx, SPRITES.star_tiny, p.x, p.y, col);
        if (((frame + p.nd.phase) % 8) < 4) fillCirclePix(ctx, p.x, p.y, 1, "#FFFFFF");
      } else {
        fillCirclePix(ctx, p.x, p.y, ((frame + p.nd.phase) % 4) < 2 ? 2 : 1, col);
      }
    }
  },
};

/* ============================================================
   ENGINE 12 — HYPHAE FRAME CRAWL
   Mycelium growing inward from the frame edges on wiggling
   random-walk paths, extending and retracting (patrol loop).
   Spore tips glow. The middle stays clear — it frames things.
   ============================================================ */
const hyphaeFrame = {
  name: "HYPHAE FRAME CRAWL",
  tag: "edge network · frames the void",
  init(rng, density) {
    const branches = [];
    const count = Math.round(22 * density);
    for (let i = 0; i < count; i++) {
      // start on a random edge
      const edge = Math.floor(rng() * 4);
      let x, y, dir;
      if (edge === 0) { x = rng() * IW; y = 0; dir = Math.PI / 2; }
      else if (edge === 1) { x = rng() * IW; y = IH; dir = -Math.PI / 2; }
      else if (edge === 2) { x = 0; y = rng() * IH; dir = 0; }
      else { x = IW; y = rng() * IH; dir = Math.PI; }
      // precompute wiggling walk inward, gently pulled toward center
      const path = [[Math.round(x), Math.round(y)]];
      let px = x, py = y;
      const maxLen = 40 + rng() * 70;
      for (let s = 0; s < maxLen; s++) {
        dir += (rng() - 0.5) * 0.9;
        const toCenter = Math.atan2(IH / 2 - py, IW / 2 - px);
        let dd = toCenter - dir;
        while (dd > Math.PI) dd -= 2 * Math.PI;
        while (dd < -Math.PI) dd += 2 * Math.PI;
        dir += dd * 0.12;
        px += Math.cos(dir) * 2; py += Math.sin(dir) * 2;
        path.push([Math.round(px), Math.round(py)]);
        if (rng() < 0.08) dir += (rng() < 0.5 ? 1 : -1) * Math.PI / 3; // fork turn
      }
      branches.push({
        path,
        c: Math.floor(rng() * 10),
        phase: rng(),
        speedK: 1 + Math.floor(rng() * 2),
        sporeEvery: 5 + Math.floor(rng() * 6),
      });
    }
    return { branches };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    for (const br of st.branches) {
      // patrol growth: extend then retract, quantized to whole pixels
      const osc = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t * br.speedK + br.phase));
      const len = Math.floor(br.path.length * (0.25 + 0.75 * osc));
      const col = pal.main[br.c % n];
      for (let s = 0; s < len; s++) {
        const [x, y] = br.path[s];
        if (x < 0 || x >= IW || y < 0 || y >= IH) break;
        if ((s + frame) % 4 === 3) continue; // dashed organism texture
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
        // side spores along the vein
        if (s % br.sporeEvery === 0 && ((frame + s) % 6) < 3) {
          ctx.fillStyle = pal.main[(br.c + 2) % n];
          ctx.fillRect(x + 1, y, 1, 1);
        }
      }
      // glowing tip
      if (len > 2) {
        const [tx, ty] = br.path[len - 1];
        if (tx >= 0 && tx < IW && ty >= 0 && ty < IH) {
          const tipOn = (frame % 4) < 2;
          drawSpriteC(ctx, SPRITES.star_tiny, tx, ty, tipOn ? "#FFFFFF" : col);
        }
      }
    }
  },
};

ENGINES.push(sigilOrbit, kaleidoBloom, sporeConstellation, hyphaeFrame);

/* ============================================================
   TEXT ENGINES — blinkies (150x20) and stamps (88x31).
   The canonical sizes of the old web. 1px bevel borders,
   pixel font, discrete frames. Text comes from APP_OPTS.text.
   ============================================================ */

function bevelBorder(ctx, w, h, cLight, cDark) {
  ctx.fillStyle = cLight;
  for (let x = 0; x < w; x++) { ctx.fillRect(x, 0, 1, 1); ctx.fillRect(x, h - 1, 1, 1); }
  for (let y = 0; y < h; y++) { ctx.fillRect(0, y, 1, 1); ctx.fillRect(w - 1, y, 1, 1); }
  // fake 3D: light top/left, dark bottom/right
  ctx.fillStyle = cLight;
  for (let x = 0; x < w; x++) ctx.fillRect(x, 0, 1, 1);
  for (let y = 0; y < h; y++) ctx.fillRect(0, y, 1, 1);
  ctx.fillStyle = cDark;
  for (let x = 0; x < w; x++) ctx.fillRect(x, h - 1, 1, 1);
  for (let y = 0; y < h; y++) ctx.fillRect(w - 1, y, 1, 1);
}

/* ---------- ENGINE 13 — BLINKIE SCROLLER (150x20) ---------- */
const blinkieScroll = {
  name: "BLINKIE · SCROLLER",
  tag: "150×20 · classic scroll",
  dims: [150, 20],
  isText: true,
  init(rng, density) {
    return { sparkN: Math.round(4 * density) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "WEIRD BITCH").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // border flash: swap bevel colors every 2 frames
    const flip = (frame % 4) < 2;
    bevelBorder(ctx, W, H,
      pal.main[flip ? 0 : 1 % n], pal.main[flip ? 1 % n : 0]);
    // scrolling text, seamless: offset wraps over exactly F frames
    const innerW = W - 4;
    const tw = textWidth(text);
    const total = tw + innerW;
    const off = Math.floor((frame / F) * total);
    const baseX = 2 + innerW - off;
    const colorShift = Math.floor(frame / 2);
    drawText(ctx, text, baseX, Math.round((H - GLYPH_H * TEXT_SCALE) / 2),
      (i) => pal.main[(i + colorShift) % n]);
    // end sparkles
    for (let s = 0; s < st.sparkN; s++) {
      const sx = 2 + ((s * 37 + frame * 3) % innerW);
      if (((frame + s) % 6) < 2) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(sx, 2 + ((s * 13 + frame) % (H - 4)), 1, 1);
      }
    }
  },
};

/* ---------- ENGINE 14 — BLINKIE · WAVER (150x20) ---------- */
const blinkieWave = {
  name: "BLINKIE · WAVER",
  tag: "150×20 · letters bob + cycle",
  dims: [150, 20],
  isText: true,
  init(rng, density) { return {}; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "SPARKLY AS FUCK").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // sparse inner twinkle dust — subtle, never fights the text
    for (let y = 2; y < H - 2; y++)
      for (let x = 2; x < W - 2; x++)
        if (hash2(x, y + (frame >> 1)) < 0.02) {
          ctx.fillStyle = pal.main[(x + y) % n];
          ctx.fillRect(x, y, 1, 1);
        }
    bevelBorder(ctx, W, H, pal.main[2 % n], pal.main[(frame >> 1) % n]);
    const tw = textWidth(text);
    const innerW = W - 6;
    const t = frame / F;
    const ty = Math.round((H - GLYPH_H * TEXT_SCALE) / 2);
    if (tw <= innerW) {
      // wave: each letter bobs on a quantized sine
      const chars = visibleChars(text);
      let cx = Math.round((W - tw) / 2);
      for (let i = 0; i < chars.length; i++) {
        const g = glyphOf(chars[i]);
        const bob = Math.round(1.5 * Math.sin(2 * Math.PI * (t * 2 + i * 0.12)));
        const col = pal.main[(i + Math.floor(frame / 2)) % n];
        let gx = cx;
        for (let r = 0; r < GLYPH_H; r++)
          for (let c = 0; c < g[r].length; c++)
            if (g[r][c] === "X") {
              ctx.fillStyle = col;
              ctx.fillRect(gx + c * TEXT_SCALE, ty + bob + r * TEXT_SCALE, TEXT_SCALE, TEXT_SCALE);
            }
        cx += (g[0].length + GLYPH_SP) * TEXT_SCALE;
      }
    } else {
      // too long — fall back to scroll
      const total = tw + innerW;
      const off = Math.floor(t * total);
      drawText(ctx, text, 3 + innerW - off, ty, (i) => pal.main[(i + Math.floor(frame / 2)) % n]);
    }
  },
};

/* ---------- ENGINE 15 — STAMP · ICON BADGE (88x31) ---------- */
const stampIcon = {
  name: "STAMP · ICON BADGE",
  tag: "88×31 · icon + text",
  dims: [88, 31],
  isText: true,
  init(rng, density) {
    const icons = ["heart", "skull", "ufo", "mushroom", "moon", "star_5", "eye", "sigil_2"];
    // alien icon for alien sayings, obviously
    const txt = (APP_OPTS.text || "").toUpperCase();
    let icon = icons[Math.floor(rng() * icons.length)];
    if (txt.includes("NOT FROM HERE") || txt.includes("MEAT SUIT")) icon = "ufo";
    if (txt.includes("WEIRD BITCH")) icon = "eye";
    return { icon, cIcon: Math.floor(rng() * 10), sparkles: Math.round(3 * density) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "NOT FROM HERE").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // sparse diagonal energy in bg — whispers, doesn't shout
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++)
        if (hash2(x + (frame >> 1), y) < 0.025) {
          ctx.fillStyle = pal.main[(x + y) % n];
          ctx.fillRect(x, y, 1, 1);
        }
    // double border, flashing
    const flip = (frame % 4) < 2;
    bevelBorder(ctx, W, H, pal.main[flip ? 0 : 3 % n], pal.main[flip ? 3 % n : 0]);
    // bouncing icon (2-frame patrol — hand-cranked)
    const bounce = (frame % 2);
    const iconCol = pal.main[(st.cIcon + Math.floor(frame / 4)) % n];
    drawSprite(ctx, SPRITES[st.icon], 4, Math.round((H - spriteH(SPRITES[st.icon])) / 2) - bounce,
      (ch, c, r) => ((c + r + frame) % 6 === 0) ? "#FFFFFF" : iconCol);
    // text zone right of icon
    const tx = 4 + spriteW(SPRITES[st.icon]) + 4;
    const maxW = W - tx - 3;
    const lines = wrapText(text, maxW, 3);
    const colShift = Math.floor(frame / 3);
    if (lines) {
      const totalH = lines.length * (GLYPH_H + 1) * TEXT_SCALE - 1;
      let ty = Math.round((H - totalH) / 2);
      for (const line of lines) {
        drawText(ctx, line, tx, ty, (i) => pal.main[(i + colShift) % n]);
        ty += (GLYPH_H + 1) * TEXT_SCALE;
      }
    } else {
      // too much text — scroll one line through the text zone
      const tw = textWidth(text);
      const total = tw + maxW;
      const off = Math.floor((frame / F) * total);
      drawText(ctx, text, tx + maxW - off, Math.round((H - GLYPH_H * TEXT_SCALE) / 2),
        (i) => pal.main[(i + colShift) % n]);
    }
  },
};

/* ---------- ENGINE 16 — STAMP · VOID BADGE (88x31) ---------- */
const stampVoid = {
  name: "STAMP · VOID BADGE",
  tag: "88×31 · sparkle storm + outlined text",
  dims: [88, 31],
  isText: true,
  init(rng, density) {
    const stars = [];
    for (let i = 0; i < Math.round(26 * density); i++)
      stars.push({
        x: 2 + Math.floor(rng() * (88 - 4)),
        y: 2 + Math.floor(rng() * (31 - 4)),
        c: Math.floor(rng() * 10),
        phase: Math.floor(rng() * 5),
      });
    return { stars };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "MAXIMALISM OR GTFO").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // mini sparkle storm
    for (const s of st.stars) {
      if (((frame + s.phase) % 3) === 0) continue;
      ctx.fillStyle = pal.main[(s.c + Math.floor(frame / 2)) % n];
      ctx.fillRect(s.x, s.y, 1, 1);
      if ((s.phase + frame) % 7 === 0) {
        ctx.fillRect(s.x - 1, s.y, 1, 1); ctx.fillRect(s.x + 1, s.y, 1, 1);
        ctx.fillRect(s.x, s.y - 1, 1, 1); ctx.fillRect(s.x, s.y + 1, 1, 1);
      }
    }
    // cycling double border
    bevelBorder(ctx, W, H, pal.main[Math.floor(frame / 2) % n], pal.main[(Math.floor(frame / 2) + 2) % n]);
    ctx.fillStyle = pal.main[(Math.floor(frame / 2) + 4) % n];
    for (let x = 2; x < W - 2; x++) { if ((x + frame) % 2) ctx.fillRect(x, 2, 1, 1); if ((x + frame) % 2) ctx.fillRect(x, H - 3, 1, 1); }
    // outlined text, centered, up to 2 lines
    const maxW = W - 10;
    const lines = wrapText(text, maxW, 2) || [text];
    const totalH = lines.length * (GLYPH_H + 2) * TEXT_SCALE - 2;
    let ty = Math.round((H - totalH) / 2);
    const shift = Math.floor(frame / 2);
    for (const line of lines) {
      const lw = textWidth(line);
      const lx = Math.round((W - lw) / 2);
      drawTextOutlined(ctx, line, lx, ty, (i) => pal.main[(i + shift) % n], pal.bg[0]);
      ty += (GLYPH_H + 2) * TEXT_SCALE;
    }
  },
};

ENGINES.push(blinkieScroll, blinkieWave, stampIcon, stampVoid);

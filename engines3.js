/* ============================================================
   ENGINES 3 — batch three. 6 backgrounds + 6 text engines.
   Same laws: integer pixels, flat colors, pure f(st, frame),
   seamless loops. No pure #000000 as motif (see-thru safe).
   ============================================================ */

/* ============================================================
   ENGINE 28 — TESSERACT TV
   A 4D hypercube rotating through genuine 4D space, double
   projected down to 2D. Your BFF, rendered. Math wearing pixels.
   ============================================================ */
const tesseractTv = {
  name: "TESSERACT TV",
  tag: "4D hypercube · your BFF",
  init(rng, density) {
    const verts = [];
    for (let i = 0; i < 16; i++)
      verts.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    const edges = [];
    for (let i = 0; i < 16; i++)
      for (let b = 0; b < 4; b++) {
        const j = i ^ (1 << b);
        if (i < j) edges.push([i, j]);
      }
    const stars = [];
    for (let i = 0; i < Math.round(30 * density); i++)
      stars.push({ x: Math.floor(rng() * 180), y: Math.floor(rng() * 320), phase: Math.floor(rng() * 6) });
    return { verts, edges, stars };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    // dust
    for (const s of st.stars) {
      if ((frame + s.phase) % 3 === 0) continue;
      ctx.fillStyle = (s.phase + frame) % 7 === 0 ? "#FFFFFF" : pal.main[s.phase % n];
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // rotate in XW (1 lap) and YZ (2 laps) planes — both integer laps, seamless
    const a = 2 * Math.PI * t, b = 4 * Math.PI * t;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const pts = st.verts.map(v => {
      const x = v[0] * ca - v[3] * sa, w = v[0] * sa + v[3] * ca;
      const y = v[1] * cb - v[2] * sb, z = v[1] * sb + v[2] * cb;
      const wf = 1 / (2.6 - w);              // 4D -> 3D perspective
      const x3 = x * wf, y3 = y * wf, z3 = z * wf;
      const zf = 1 / (3.2 - z3);             // 3D -> 2D perspective
      return [Math.round(90 + x3 * zf * 245), Math.round(160 + y3 * zf * 245 * 1.15)];
    });
    const shift = Math.floor(frame / 2);
    // edges: bresenham, palette-cycled
    st.edges.forEach((e, ei) => {
      const [x1, y1] = pts[e[0]], [x2, y2] = pts[e[1]];
      ctx.fillStyle = pal.main[(ei + shift) % n];
      const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
      let err = dx - dy, x = x1, y = y1;
      for (;;) {
        if (x >= 0 && x < IW && y >= 0 && y < IH) ctx.fillRect(x, y, 1, 1);
        if (x === x2 && y === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
    });
    // vertices get white-hot stars
    pts.forEach((p, vi) => {
      if (p[0] < 2 || p[0] >= IW - 2 || p[1] < 2 || p[1] >= IH - 2) return;
      drawSpriteC(ctx, SPRITES.star_tiny, p[0], p[1],
        (vi + frame) % 4 === 0 ? "#FFFFFF" : pal.main[(vi + shift) % n]);
    });
  },
};

/* ============================================================
   ENGINE 29 — LAVA LAMP LANE
   Metaball goo: blobs rise, sink, merge, split. Thresholded
   field, flat fills, white gloss on every blob. 1972 meets Y2K.
   ============================================================ */
const lavaLamp = {
  name: "LAVA LAMP LANE",
  tag: "metaball goo · it merges",
  init(rng, density) {
    const blobs = [];
    const count = 5 + Math.round(3 * density);
    for (let i = 0; i < count; i++) {
      blobs.push({
        x0: 18 + rng() * (180 - 36),
        p0: rng(),
        laps: 1 + Math.floor(rng() * 2),
        dir: rng() < 0.7 ? 1 : -1,           // most rise, a few sink
        wa: 6 + rng() * 12,                  // wobble amplitude
        wl: 1 + Math.floor(rng() * 2),       // wobble laps
        wp: rng(),
        r: 9 + rng() * 8,
        c: Math.floor(rng() * 10),
      });
    }
    return { blobs };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    // current blob positions
    const pos = st.blobs.map(b => {
      const u = (t * b.laps + b.p0) % 1;
      const y = b.dir > 0 ? IH + 25 - u * (IH + 90) : -25 + u * (IH + 90);
      const x = b.x0 + Math.round(b.wa * Math.sin(2 * Math.PI * (t * b.wl + b.wp)));
      return { x, y, r2: b.r * b.r, c: b.c };
    });
    // field render: core / rim / gloss
    for (let y = 0; y < IH; y++)
      for (let x = 0; x < IW; x++) {
        let f = 0, ci = 0;
        for (let i = 0; i < pos.length; i++) {
          const p = pos[i];
          const dx = x - p.x, dy = y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < p.r2 * 9) { f += p.r2 / Math.max(d2, 1); ci = i; }
        }
        if (f > 1.0) {
          ctx.fillStyle = pal.main[(pos[ci].c + Math.floor(frame / 2)) % n];
          ctx.fillRect(x, y, 1, 1);
        } else if (f > 0.78) {
          ctx.fillStyle = pal.main[(pos[ci].c + 1 + Math.floor(frame / 2)) % n];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    // white gloss dot on each blob
    for (const p of pos) {
      if (p.x < 4 || p.x >= IW - 4 || p.y < 4 || p.y >= IH - 4) continue;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(p.x - 2, p.y - 3, 1, 1);
      ctx.fillRect(p.x - 3, p.y - 2, 1, 1);
    }
    // lamp glow at the base
    ditherRect(ctx, 0, IH - 5, IW, 5, pal.bg[0], pal.main[Math.floor(frame / 2) % n], 0.3);
  },
};

/* ============================================================
   ENGINE 30 — BOUNCE HOUSE
   DVD-logo physics: sprites ricochet forever, color advances
   on every wall hit, ghost trail sparkles behind each one.
   ============================================================ */
const bounceHouse = {
  name: "BOUNCE HOUSE",
  tag: "dvd-logo physics · corner hits",
  init(rng, density) {
    const pool = ["heart", "skull", "ufo", "mushroom", "star_5", "eye", "moon", "wand", "drop", "diamond"];
    const balls = [];
    const count = 3 + Math.round(2 * density);
    for (let i = 0; i < count; i++)
      balls.push({
        sp: pool[Math.floor(rng() * pool.length)],
        lx: 1 + Math.floor(rng() * 3), ly: 1 + Math.floor(rng() * 3),
        p0x: rng(), p0y: rng(),
        c: Math.floor(rng() * 10),
      });
    return { balls };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const tri = (u) => { u = ((u % 1) + 1) % 1; return u < 0.5 ? u * 2 : 2 - u * 2; };
    const S = 2; // chunky 2x sprites — more presence in the void
    const posAt = (b, tt) => {
      const sw = spriteW(SPRITES[b.sp]) * S, sh = spriteH(SPRITES[b.sp]) * S;
      const px = Math.round(tri(tt * b.lx + b.p0x) * (IW - 1 - sw));
      const py = Math.round(tri(tt * b.ly + b.p0y) * (IH - 1 - sh));
      const hits = Math.floor(tt * b.lx + b.p0x) + Math.floor(tt * b.ly + b.p0y);
      return { px, py, hits, sw, sh };
    };
    const t = frame / F;
    st.balls.forEach((b, bi) => {
      // ghost trail: two stale positions as dim sparkles
      for (let k = 2; k >= 1; k--) {
        const g = posAt(b, (frame - k * 2) / F);
        drawSpriteC(ctx, SPRITES.star_tiny,
          g.px + (g.sw >> 1), g.py + (g.sh >> 1),
          pal.main[(b.c + g.hits + k) % n]);
      }
      const { px, py, hits, sw, sh } = posAt(b, t);
      const col = pal.main[(b.c + hits) % n];
      drawSpriteS(ctx, SPRITES[b.sp], px, py, col, S);
      // impact flash on wall contact
      ctx.fillStyle = "#FFFFFF";
      if (px <= 0) ctx.fillRect(0, py + (sh >> 1), 2, 1);
      if (px >= IW - 1 - sw) ctx.fillRect(IW - 2, py + (sh >> 1), 2, 1);
      if (py <= 0) ctx.fillRect(px + (sw >> 1), 0, 1, 2);
      if (py >= IH - 1 - sh) ctx.fillRect(px + (sw >> 1), IH - 2, 1, 2);
    });
  },
};

/* ============================================================
   ENGINE 31 — FREQ FREAK
   A fake equalizer with a scope line on top. No audio input,
   just math pretending to be music. Winamp soul, 1999 forever.
   ============================================================ */
const freqFreak = {
  name: "FREQ FREAK",
  tag: "fake equalizer · winamp soul",
  init(rng, density) {
    const bars = [];
    for (let i = 0; i < 12; i++)
      bars.push({ p1: rng(), p2: rng(), p3: rng(), a1: 42 + rng() * 26, a2: 24 + rng() * 18, a3: 12 + rng() * 10 });
    return { bars };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    // scope line across the top
    for (let x = 0; x < IW; x++) {
      const y = 30 + Math.round(9 * Math.sin(2 * Math.PI * (2 * t + x * 3 / IW))
        + 6 * Math.sin(2 * Math.PI * (3 * t - x * 5 / IW)));
      ctx.fillStyle = pal.main[((x >> 4) + shift) % n];
      ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = pal.main[((x >> 4) + 2 + shift) % n];
      ctx.fillRect(x, y + 2, 1, 1);
    }
    for (let x = 0; x < IW; x += 4) { // baseline dashes
      ctx.fillStyle = pal.main[(1 + shift) % n];
      ctx.fillRect(x, 46, 2, 1);
    }
    // equalizer bars, 3px blocks with 1px gaps
    st.bars.forEach((b, i) => {
      const h = 120 + Math.round(
        b.a1 * Math.sin(2 * Math.PI * (t + b.p1)) +
        b.a2 * Math.sin(2 * Math.PI * (2 * t + b.p2)) +
        b.a3 * Math.sin(2 * Math.PI * (3 * t + b.p3)));
      const hh = Math.max(4, Math.min(IH - 60, h)) & ~2; // quantize to block grid
      const bx = i * 15 + 2, bw = 11;
      for (let by = 0; by < hh; by += 3) {
        const row = by / 3;
        ctx.fillStyle = pal.main[(row + i + shift) % n];
        ctx.fillRect(bx, IH - 3 - by - 2, bw, 2);
      }
      // cap block, blinking white
      if ((frame + i) % 6 < 3) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(bx, IH - 6 - hh, bw, 2);
      }
    });
  },
};

/* ============================================================
   ENGINE 32 — RAINBOW ROAD
   OutRun-style checkered floor flying at a horizon that never
   arrives. Twinkle sky, moon, one ufo commute per loop.
   ============================================================ */
const rainbowRoad = {
  name: "RAINBOW ROAD",
  tag: "checkered horizon · drive forever",
  init(rng, density) {
    const stars = [];
    for (let i = 0; i < Math.round(26 * density); i++)
      stars.push({ x: Math.floor(rng() * 180), y: 4 + Math.floor(rng() * 92), phase: Math.floor(rng() * 6) });
    return { stars, moonC: Math.floor(rng() * 10) };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    const HY = 104, CC = 32448, Z0 = 18, LAPS = 3, KX = 200;
    const shift = Math.floor(frame / 2);
    // sky
    for (const s of st.stars) {
      if ((frame + s.phase) % 3 === 0) continue;
      ctx.fillStyle = (s.phase + frame) % 5 === 0 ? "#FFFFFF" : pal.main[s.phase % n];
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    drawSprite(ctx, SPRITES.moon, 20, 14, (ch) =>
      ch === "X" ? pal.main[(st.moonC + n - 1) % n] : pal.main[st.moonC % n]);
    const ux = -12 + Math.floor(t * (IW + 24)); // exits fully before wrap
    drawSprite(ctx, SPRITES.ufo, ux, 34 + (frame % 2), pal.main[shift % n]);
    // horizon glow
    ditherRect(ctx, 0, HY - 3, IW, 4, pal.bg[0], pal.main[(st.moonC + 1) % n], 0.45);
    // the road: world-space checker, scrolled by an exact integer number of tiles
    const scroll = Math.floor(t * Z0 * LAPS);
    for (let y = HY + 6; y < IH; y++) {
      const dz = y - HY;
      const wz = CC / dz + scroll;
      const bandR = Math.floor(wz / Z0);
      for (let x = 0; x < IW; x++) {
        const wx = (x - 90) * (CC / dz) / KX; // sideways must NOT scroll
        const bandC = Math.floor(wx / Z0);
        const v = ((bandR + bandC) % 2 + 2) % 2;
        ctx.fillStyle = v
          ? pal.main[(((bandR % n) + n) % n + shift) % n]
          : pal.main[(((bandR + 3) % n + n) % n + shift) % n];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
};

/* ============================================================
   ENGINE 33 — MEAT DISCO
   Dance floor tiles flashing in radial waves, a spinning
   mirror ball, stepped light rays, three dancers who never
   stop. The meat is dancing.
   ============================================================ */
const meatDisco = {
  name: "MEAT DISCO",
  tag: "dance floor · the meat is dancing",
  init(rng, density) {
    const pool = ["ufo", "mushroom", "skull", "heart", "star_5"];
    const dancers = [];
    const count = 2 + Math.round(density);
    for (let i = 0; i < count; i++)
      dancers.push({
        sp: pool[Math.floor(rng() * pool.length)],
        x0: 24 + rng() * (180 - 48),
        y0: 190 + rng() * 90,
        wp: rng(), c: Math.floor(rng() * 10),
      });
    return { dancers };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    const BX = 90, BY = 54;
    // stepped light rays, lower hemisphere, dashed
    const rotStep = Math.floor(t * 6); // 6 positions, seamless
    for (let k = 0; k < 6; k++) {
      const ang = ((k * 2 + rotStep) / 12) * 2 * Math.PI;
      if (Math.sin(ang) < 0.15) continue;
      ctx.fillStyle = pal.main[(k + shift) % n];
      for (let s = 18; s < 90; s += 3) {
        const px = BX + Math.round(Math.cos(ang) * s), py = BY + Math.round(Math.sin(ang) * s);
        if (px >= 0 && px < IW && py >= 0 && py < 148) ctx.fillRect(px, py, 1, 1);
      }
    }
    // mirror ball: shifting checker cells
    for (let j = -15; j <= 15; j++)
      for (let i = -15; i <= 15; i++) {
        if (i * i + j * j > 225) continue;
        const cell = (((i + 15) >> 2) + ((j + 15) >> 2) + (frame >> 1)) % 2;
        ctx.fillStyle = cell ? "#FFFFFF" : pal.main[(3 + shift) % n];
        ctx.fillRect(BX + i, BY + j, 1, 1);
      }
    // dance floor: radial flash wave from the ball — floor always lit, wave rides on top
    const TW = 15, TH = 12;
    for (let ry = 0; ry * TH + 150 < IH; ry++)
      for (let rx = 0; rx < 12; rx++) {
        const tx = 1 + rx * TW, ty = 150 + ry * TH;
        const d = Math.abs(tx + 7 - BX) + Math.abs(ty + 6 - BY);
        const wave = Math.sin(2 * Math.PI * 2 * t - d * 0.045);
        const level = wave > 0.45 ? 2 : wave > -0.2 ? 1 : 0; // 0 = dim base tile
        ctx.fillStyle = level === 0
          ? pal.main[((rx + ry) % n + shift) % n]
          : pal.main[(level * 2 + ((rx + ry) >> 1) + shift) % n];
        ctx.fillRect(tx, ty, TW - 1, TH - 1);
        if (level === 0) { // dim it down with a bg dither so the wave pops
          ditherRect(ctx, tx, ty, TW - 1, TH - 1, pal.bg[0], pal.main[((rx + ry) % n + shift) % n], 0.28);
        }
      }
    // dancers, bobbing with squash gloss — 2x chunky
    st.dancers.forEach((d, di) => {
      const x = Math.round(d.x0 + 8 * Math.sin(2 * Math.PI * (t + d.wp)));
      const hop = Math.round(4 * Math.abs(Math.sin(2 * Math.PI * (2 * t + d.wp))));
      drawSpriteCS(ctx, SPRITES[d.sp], x, d.y0 - hop, pal.main[(d.c + shift) % n], 2);
      if ((frame + di) % 8 === 0) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 3, d.y0 - hop - 6, 1, 1);
      }
    });
  },
};

ENGINES.push(tesseractTv, lavaLamp, bounceHouse, freqFreak, rainbowRoad, meatDisco);

/* ============================================================
   TEXT ENGINES, BATCH 3 — blinkies 150x20, stamps 88x31.
   ============================================================ */

/* ---------- ENGINE 34 — BLINKIE · GLITCH (150x20) ---------- */
const blinkieGlitch = {
  name: "BLINKIE · GLITCH",
  tag: "150×20 · rgb split + slice tears",
  dims: [150, 20],
  isText: true,
  init(rng, density) { return { salt: Math.floor(rng() * 1e6) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "FUCK ALL THIS NOISE").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // flickering dashed border
    if ((frame % 4) < 3) {
      ctx.fillStyle = pal.main[Math.floor(frame / 2) % n];
      for (let x = 0; x < W; x += 4) { ctx.fillRect(x, 0, 2, 1); ctx.fillRect(x, H - 1, 2, 1); }
      for (let y = 0; y < H; y += 4) { ctx.fillRect(0, y, 1, 2); ctx.fillRect(W - 1, y, 1, 2); }
    }
    const shift = Math.floor(frame / 2);
    const tw = textWidth(text), innerW = W - 8;
    let tx = 4;
    if (tw <= innerW) tx = Math.round((W - tw) / 2);
    else tx = 4 + innerW - Math.floor((frame / F) * (tw + innerW));
    // row-sliced text with tears + occasional rgb split
    const split = (frame >> 1) % 3 === 0;
    const drawPass = (xoff, colorFor) => {
      let cx = tx + xoff;
      for (let i = 0; i < text.length; i++) {
        const g = glyphOf(text[i]);
        for (let r = 0; r < GLYPH_H; r++) {
          const tear = hash2(st.salt + r * 7, frame >> 1) < 0.12
            ? (hash2(r, frame) < 0.5 ? -2 : 2) : 0;
          for (let c = 0; c < g[r].length; c++)
            if (g[r][c] === "X") {
              ctx.fillStyle = colorFor(i);
              ctx.fillRect(cx + c + tear, 8 + r, 1, 1);
            }
        }
        cx += g[0].length + GLYPH_SP;
      }
    };
    if (split) {
      drawPass(-1, (i) => pal.main[(i + shift + 1) % n]);
      drawPass(1, (i) => pal.main[(i + shift + 3) % n]);
    }
    drawPass(0, (i) => pal.main[(i + shift) % n]);
    // static sparks
    for (let x = 2; x < W - 2; x += 2)
      for (let y = 2; y < H - 2; y += 2)
        if (hash2(st.salt + x, y * (frame + 1)) < 0.015) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(x, y, 1, 1);
        }
  },
};

/* ---------- ENGINE 35 — BLINKIE · CHROME (150x20) ---------- */
const blinkieChrome = {
  name: "BLINKIE · CHROME",
  tag: "150×20 · liquid metal letters",
  dims: [150, 20],
  isText: true,
  init(rng, density) { return {}; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "SPARKLY AS FUCK").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    bevelBorder(ctx, W, H, pal.main[Math.floor(frame / 2) % n], pal.main[(Math.floor(frame / 2) + 2) % n]);
    // rivets
    for (let x = 6; x < W - 4; x += 12) {
      const on = ((x / 12 + frame) % 2) < 1;
      drawSpriteC(ctx, SPRITES.star_tiny, x, 4, on ? "#FFFFFF" : pal.main[(x + Math.floor(frame / 2)) % n]);
      drawSpriteC(ctx, SPRITES.star_tiny, x, H - 4, on ? pal.main[(x + Math.floor(frame / 2)) % n] : "#FFFFFF");
    }
    const shift = Math.floor(frame / 2);
    // chrome fill: specular band sweeps down the glyph rows
    const bandRow = frame % (GLYPH_H + 2); // 0..6, sweep with rest positions
    const chromeFor = (i, c, r) => {
      if (r === bandRow - 1) return "#FFFFFF";          // hot specular line
      if (r === 0) return pal.main[(shift + i) % n];    // top light
      if (r <= 2) return pal.main[(shift + i + 1) % n]; // mid metal
      return pal.main[(shift + i + 3) % n];             // dark base
    };
    const tw = textWidth(text), innerW = W - 8;
    if (tw <= innerW) drawText(ctx, text, Math.round((W - tw) / 2), 8, chromeFor);
    else {
      const off = Math.floor((frame / F) * (tw + innerW));
      drawText(ctx, text, 4 + innerW - off, 8, chromeFor);
    }
  },
};

/* ---------- ENGINE 36 — STAMP · POSTAGE (88x31) ---------- */
const stampPostage = {
  name: "STAMP · POSTAGE",
  tag: "88×31 · snail mail from space",
  dims: [88, 31],
  isText: true,
  init(rng, density) {
    const pool = ["ufo", "heart", "skull", "mushroom", "star_5", "moon"];
    return { icon: pool[Math.floor(rng() * pool.length)], c: Math.floor(rng() * 10) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "NOT FROM HERE").toUpperCase();
    const shift = Math.floor(frame / 2);
    // paper
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    // perforation: punched half-holes along every edge
    ctx.fillStyle = pal.bg[0];
    for (let x = 3; x < W - 1; x += 5) {
      fillCirclePix(ctx, x, 0, 1, pal.bg[0]);
      fillCirclePix(ctx, x, H - 1, 1, pal.bg[0]);
    }
    for (let y = 3; y < H - 1; y += 5) {
      fillCirclePix(ctx, 0, y, 1, pal.bg[0]);
      fillCirclePix(ctx, W - 1, y, 1, pal.bg[0]);
    }
    // inner art panel
    ditherRect(ctx, 4, 4, W - 8, H - 8, pal.main[(st.c + shift) % n], pal.bg[0], 0.22);
    ctx.fillStyle = pal.main[(st.c + 1) % n];
    for (let x = 4; x < W - 4; x++) { ctx.fillRect(x, 4, 1, 1); ctx.fillRect(x, H - 5, 1, 1); }
    for (let y = 4; y < H - 4; y++) { ctx.fillRect(4, y, 1, 1); ctx.fillRect(W - 5, y, 1, 1); }
    // the icon, 2x, bobbing
    const bob = (frame % 8) < 4 ? 0 : 1;
    drawSpriteCS(ctx, SPRITES[st.icon], 16, 15 + bob, pal.main[(st.c + 2 + shift) % n], 2);
    if (frame % 6 === 0) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(12, 10 + bob, 1, 1);
    }
    // tiny Y2K postmark
    drawText(ctx, "Y2K", W - 18, 7, pal.main[(st.c + 3) % n]);
    drawSpriteC(ctx, SPRITES.star_tiny, W - 10, H - 9, (frame % 2) ? "#FFFFFF" : pal.main[(st.c + 3) % n]);
    // caption zone right of the icon
    const tx = 30, maxW = W - tx - 8;
    const lines = wrapText(text, maxW, 2);
    if (lines) {
      const totalH = lines.length * (GLYPH_H + 1) - 1;
      let ty = Math.round((H - totalH) / 2) + 2;
      for (const line of lines) {
        drawTextOutlined(ctx, line, tx, ty, (i) => pal.main[(i + shift + st.c) % n], pal.bg[0]);
        ty += GLYPH_H + 1;
      }
    } else {
      const tw = textWidth(text);
      const off = Math.floor((frame / F) * (tw + maxW));
      drawTextOutlined(ctx, text, tx + maxW - off, Math.round((H - GLYPH_H) / 2) + 2,
        (i) => pal.main[(i + shift + st.c) % n], pal.bg[0]);
    }
  },
};

/* ---------- ENGINE 37 — STAMP · CENSORED (88x31) ---------- */
const stampCensored = {
  name: "STAMP · CENSORED",
  tag: "88×31 · [redacted] energy",
  dims: [88, 31],
  isText: true,
  init(rng, density) { return { c: Math.floor(rng() * 10), phase: Math.floor(rng() * 12) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "VIBE THIS SHIT UP ASSHOLES!").toUpperCase();
    const shift = Math.floor(frame / 2);
    const t = frame / F;
    // grime background
    ditherRect(ctx, 0, 0, W, H, pal.bg[0], pal.main[(st.c + 1) % n], 0.14);
    bevelBorder(ctx, W, H, pal.main[st.c % n], pal.main[(st.c + 2) % n]);
    // two watchers above the bar, pupils wandering, occasional blink
    const lookX = Math.round(Math.sin(2 * Math.PI * t) * 1.4);
    const lookY = Math.round(Math.sin(4 * Math.PI * t) * 1);
    for (const ex of [22, 58]) {
      const blink = ((frame + st.phase + ex) % 26) < 2;
      if (blink) {
        ctx.fillStyle = pal.main[(st.c + 3) % n];
        for (let i = -3; i <= 3; i++) ctx.fillRect(ex + i, 9, 1, 1);
        continue;
      }
      drawSpriteC(ctx, SPRITES.eye, ex, 8, "#FFFFFF");
      fillCirclePix(ctx, ex + lookX, 8 + lookY, 2, pal.main[(st.c + shift) % n]);
      fillCirclePix(ctx, ex + lookX, 8 + lookY, 1, "#111111");
    }
    // the redaction bar (#111111, never pure black — see-thru safe)
    ctx.fillStyle = "#111111";
    ctx.fillRect(2, 14, W - 4, 10);
    ctx.fillStyle = pal.main[(st.c + shift) % n];
    for (let x = 2; x < W - 2; x += 3) { ctx.fillRect(x, 14, 2, 1); ctx.fillRect(x, 23, 2, 1); }
    // text on the bar
    const tw = textWidth(text), barW = W - 10;
    if (tw <= barW) drawText(ctx, text, Math.round((W - tw) / 2), 17, "#FFFFFF");
    else {
      const off = Math.floor(t * (tw + barW));
      drawText(ctx, text, 5 + barW - off, 17, (i) => (i + shift) % 5 === 0 ? pal.main[(i + shift) % n] : "#FFFFFF");
    }
    // stampede of tiny stars below
    for (let x = 4; x < W - 4; x += 7)
      if (((x + frame) % 4) < 2) {
        ctx.fillStyle = pal.main[(x + shift) % n];
        ctx.fillRect(x, 27, 1, 1);
      }
  },
};

/* ---------- ENGINE 38 — STAMP · 8-BALL (88x31) ---------- */
const stampEightBall = {
  name: "STAMP · 8-BALL",
  tag: "88×31 · outlook: weird",
  dims: [88, 31],
  isText: true,
  init(rng, density) { return { c: Math.floor(rng() * 10) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "I'D RATHER BE TRIPPING BALLS").toUpperCase();
    const shift = Math.floor(frame / 2);
    const t = frame / F;
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    bevelBorder(ctx, W, H, pal.main[Math.floor(frame / 4) % n], pal.main[(Math.floor(frame / 4) + 2) % n]);
    // the ball, mid-shake (#111111 — see-thru safe)
    const shake = Math.round(1.5 * Math.sin(2 * Math.PI * 2 * t));
    const bx = 15 + shake, by = 15;
    fillCirclePix(ctx, bx, by, 12, "#111111");
    // rim shine
    ctx.fillStyle = pal.main[(st.c + 1) % n];
    for (let a = 0; a < 40; a++) {
      const ang = (a / 40) * 2 * Math.PI;
      if ((a + frame) % 3 === 0) continue;
      const x = bx + Math.round(Math.cos(ang) * 12), y = by + Math.round(Math.sin(ang) * 12);
      if (x > 1 && x < W - 2 && y > 1 && y < H - 2) ctx.fillRect(x, y, 1, 1);
    }
    // the window: white circle + 8
    fillCirclePix(ctx, bx, by, 5, "#FFFFFF");
    drawText(ctx, "8", bx - 1, by - 2, "#111111");
    // gloss
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(bx - 7, by - 7, 2, 1);
    ctx.fillRect(bx - 8, by - 6, 1, 1);
    // sparkle when the shake peaks
    if (Math.abs(shake) >= 1)
      drawSpriteC(ctx, SPRITES.star_tiny, bx + 12, by - 10, (frame % 2) ? "#FFFFFF" : pal.main[(st.c + 2) % n]);
    // fortune text right of the ball
    const tx = 31, maxW = W - tx - 4;
    const lines = wrapText(text, maxW, 3);
    if (lines) {
      const totalH = lines.length * (GLYPH_H + 1) - 1;
      let ty = Math.round((H - totalH) / 2);
      for (const line of lines) {
        drawText(ctx, line, tx, ty, (i) => pal.main[(i + shift + st.c) % n]);
        ty += GLYPH_H + 1;
      }
    } else {
      const tw = textWidth(text);
      const off = Math.floor(t * (tw + maxW));
      drawText(ctx, text, tx + maxW - off, Math.round((H - GLYPH_H) / 2),
        (i) => pal.main[(i + shift + st.c) % n]);
    }
  },
};

/* ---------- ENGINE 39 — BLINKIE · VHS (150x20) ---------- */
const blinkieVhs = {
  name: "BLINKIE · VHS",
  tag: "150×20 · tracking error · play ▶",
  dims: [150, 20],
  isText: true,
  init(rng, density) { return { salt: Math.floor(rng() * 1e6) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "BEING IN THE STUFFNESS IS STUPID LOL").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    // scanline dimming
    for (let y = 0; y < H; y += 2) {
      ctx.fillStyle = pal.bg[0];
      for (let x = 0; x < W; x++) if ((x + y) % 3 === 0) ctx.fillRect(x, y, 1, 1);
    }
    // solid retro border
    ctx.fillStyle = pal.main[shift % n];
    for (let x = 0; x < W; x++) { ctx.fillRect(x, 0, 1, 1); ctx.fillRect(x, H - 1, 1, 1); }
    for (let y = 0; y < H; y++) { ctx.fillRect(0, y, 1, 1); ctx.fillRect(W - 1, y, 1, 1); }
    // PLAY triangle + REC dot, blinking like a real deck
    ctx.fillStyle = pal.main[(shift + 1) % n];
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r >> 1; c++) ctx.fillRect(4 + c, 8 + r, 1, 1);
    if ((frame % 8) < 4) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(8, 8, 1, 1);
    }
    // text
    const tw = textWidth(text), innerW = W - 18;
    const tx0 = 14;
    if (tw <= innerW) drawText(ctx, text, tx0 + Math.round((innerW - tw) / 2), 8, (i) => pal.main[(i + shift) % n]);
    else {
      const off = Math.floor((frame / F) * (tw + innerW));
      drawText(ctx, text, tx0 + innerW - off, 8, (i) => pal.main[(i + shift) % n]);
    }
    // tracking band: a noisy bar rolling down the tape
    const bandY = Math.floor(t * (H + 8)) - 4;
    for (let x = 1; x < W - 1; x++)
      if (hash2(st.salt + x, frame) < 0.7) {
        ctx.fillStyle = hash2(x, frame) < 0.5 ? "#FFFFFF" : pal.main[(x + shift) % n];
        if (bandY >= 1 && bandY < H - 1) ctx.fillRect(x, bandY, 1, 1);
      }
  },
};

ENGINES.push(blinkieGlitch, blinkieChrome, stampPostage, stampCensored, stampEightBall, blinkieVhs);

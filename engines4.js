/* ============================================================
   ENGINES 4 — FACE STICKERS. Built see-thru first: the bg is
   pure #000000 (keyed transparent on export), motifs never use
   pure black (#111111 instead). Slap them on the meat suit.
   Same laws: integer pixels, pure f(st, frame), seamless loops.
   ============================================================ */

/* ============================================================
   ENGINE 40 — THIRD EYE (120x64)
   A big pixel eye. Iris is a rotating spiral vortex, pupil is
   a void with a glint. It blinks by squash — the eye folds shut
   and your face shows through. Lashes. Occasional glitch tear.
   ============================================================ */
const thirdEye = {
  name: "THIRD EYE",
  tag: "120×64 · forehead vortex · it blinks",
  dims: [120, 64],
  init(rng, density) { return { c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const CX = 60, CY = 34, RX = 46, RY = 24;
    // blink: 2 blinks per loop, squash factor 1 -> 0.12 -> 1
    const bp = (t * 2) % 1;
    const open = bp > 0.88 ? Math.max(0.12, Math.abs(bp - 0.94) / 0.06) : 1;
    const ry = RY * open;
    // eye outline (top + bottom lids) + lashes
    for (let x = CX - RX; x <= CX + RX; x++) {
      const u = (x - CX) / RX;
      const h = Math.round(ry * Math.sqrt(Math.max(0, 1 - u * u)));
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, CY - h, 1, 1);
      ctx.fillRect(x, CY + h, 1, 1);
    }
    for (const lx of [-30, -15, 0, 15, 30]) { // lashes
      const u = lx / RX, h = Math.round(ry * Math.sqrt(Math.max(0, 1 - u * u)));
      ctx.fillStyle = pal.main[(st.c + 2 + shift) % n];
      ctx.fillRect(CX + lx, CY - h - 1, 1, 1);
      ctx.fillRect(CX + lx + (lx < 0 ? -1 : lx > 0 ? 1 : 0), CY - h - 2, 1, 1);
    }
    // iris vortex: spiral arms + rings, clipped to the lids
    const IR = 15;
    const rot = 2 * Math.PI * t; // 1 lap
    for (let y = -IR; y <= IR; y++)
      for (let x = -IR; x <= IR; x++) {
        const r = Math.sqrt(x * x + y * y);
        if (r > IR || r < 5) continue;
        const u = x / RX;
        const lidH = ry * Math.sqrt(Math.max(0, 1 - u * u));
        if (Math.abs(y) > lidH - 1) continue;
        const ang = Math.atan2(y, x);
        const arm = ((ang * 2 + r * 0.55 - rot) / (2 * Math.PI));
        const band = ((arm % 1) + 1) % 1;
        ctx.fillStyle = band < 0.5
          ? pal.main[(st.c + shift) % n]
          : pal.main[(st.c + 2 + shift) % n];
        ctx.fillRect(CX + x, CY + y, 1, 1);
      }
    // pupil void + glint
    fillCirclePix(ctx, CX, CY, 5, "#111111");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(CX - 2, CY - 2, 1, 1);
    ctx.fillRect(CX - 1, CY - 3, 1, 1);
    // occasional glitch tear across the eye
    if (hash2(st.salt, frame >> 2) < 0.3) {
      const gy = CY + Math.round((hash2(st.salt + 1, frame >> 2) - 0.5) * 20);
      const go = hash2(st.salt + 2, frame) < 0.5 ? -3 : 3;
      ctx.fillStyle = pal.main[(st.c + 4) % n];
      for (let x = CX - RX + 6; x < CX + RX - 6; x += 2) ctx.fillRect(x + go, gy, 1, 1);
    }
    // corner sparkles
    if ((frame % 6) < 2) {
      drawSpriteC(ctx, SPRITES.star_tiny, CX - RX + 2, CY - RY + 6, pal.main[(st.c + 3) % n]);
      drawSpriteC(ctx, SPRITES.star_tiny, CX + RX - 2, CY + RY - 6, "#FFFFFF");
    }
  },
};

/* ============================================================
   ENGINE 41 — ALIEN ANTENNAE (120x120)
   Two springy stalks rooted at the bottom edge, glowing orb
   tips, orbiting sparkles. The wobble is pure spring math.
   ============================================================ */
const antennae = {
  name: "ALIEN ANTENNAE",
  tag: "120×120 · contact the mothership",
  dims: [120, 120],
  init(rng, density) { return { c: Math.floor(rng() * 10) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const roots = [38, 82];
    roots.forEach((rx, ai) => {
      const ph = ai * 0.5; // antennae out of phase
      const segs = 22;
      const tips = [];
      for (let s = 0; s <= segs; s++) {
        const k = s / segs; // 0 root .. 1 tip
        const sway = Math.round(14 * k * k * Math.sin(2 * Math.PI * (2 * t + ph + k * 0.6)));
        const x = rx + sway, y = H - 6 - s * 4;
        tips.push([x, y]);
        ctx.fillStyle = pal.main[(st.c + ai + ((s >> 1) % 2) + shift) % n];
        ctx.fillRect(x, y, 2, 2);
      }
      const [tx, ty] = tips[segs];
      // orb tip: pulsing glow + glint
      const pulse = (frame % 8) < 4 ? 0 : 1;
      fillCirclePix(ctx, tx + 1, ty - 2, 4 + pulse, pal.main[(st.c + 3 + shift) % n]);
      fillCirclePix(ctx, tx + 1, ty - 2, 2, pal.main[(st.c + 5) % n]);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(tx - 1, ty - 4, 1, 1);
      // sparkle orbiting the tip
      const a2 = 2 * Math.PI * (t + ph);
      drawSpriteC(ctx, SPRITES.star_tiny,
        tx + 1 + Math.round(8 * Math.cos(a2)), ty - 2 + Math.round(6 * Math.sin(a2)),
        (frame % 4) < 2 ? "#FFFFFF" : pal.main[(st.c + 1) % n]);
      // root plug
      ctx.fillStyle = pal.main[(st.c + 2) % n];
      ctx.fillRect(rx - 2, H - 5, 6, 2);
      ctx.fillRect(rx - 1, H - 6, 4, 1);
    });
  },
};

/* ============================================================
   ENGINE 42 — PIXEL TEARS (88x120)
   Tears pour from two ducts and splash at the bottom. Seed
   decides: gravity ON (falling) or gravity CANCELLED (rising,
   because gravity is a suggestion). Wiggly, rainbow, relentless.
   ============================================================ */
const pixelTears = {
  name: "PIXEL TEARS",
  tag: "88×120 · gravity optional",
  dims: [88, 120],
  init(rng, density) {
    const tears = [];
    const count = 6 + Math.round(4 * density);
    for (let i = 0; i < count; i++)
      tears.push({ duct: i % 2, ph: rng(), laps: 1 + Math.floor(rng() * 2), wig: rng() * 2, c: Math.floor(rng() * 10) });
    return { tears, up: rng() < 0.5 };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const ducts = [26, 62];
    // ducts: little glowing sources
    ducts.forEach((dx, di) => {
      const dy = st.up ? H - 12 : 10;
      ctx.fillStyle = pal.main[(di + shift) % n];
      ctx.fillRect(dx - 2, dy, 5, 1);
      ctx.fillRect(dx - 1, dy + (st.up ? 1 : -1), 3, 1);
      if ((frame % 8) < 2) drawSpriteC(ctx, SPRITES.star_tiny, dx + 4, dy, "#FFFFFF");
    });
    for (const tr of st.tears) {
      const u = (t * tr.laps + tr.ph) % 1;
      const y = st.up
        ? Math.round(H - 14 - u * (H - 30))
        : Math.round(14 + u * (H - 30));
      const x = ducts[tr.duct] + Math.round(2 * Math.sin(2 * Math.PI * (t + tr.wig)));
      const col = pal.main[(tr.c + shift) % n];
      if (u > 0.92) { // splash / pop at journey's end
        drawSpriteC(ctx, SPRITES.star_tiny, x, y, "#FFFFFF");
        drawSpriteC(ctx, SPRITES.star_tiny, x - 3, y + 2, col);
        drawSpriteC(ctx, SPRITES.star_tiny, x + 3, y + 2, col);
      } else {
        drawSprite(ctx, SPRITES.drop, x - 3, y - 3, col);
        ctx.fillStyle = "#FFFFFF"; // glint
        ctx.fillRect(x - 1, y - 2, 1, 1);
        // tiny trail
        if ((frame + tr.c) % 3 === 0) {
          ctx.fillStyle = col;
          ctx.fillRect(x, y + (st.up ? 5 : -5), 1, 1);
        }
      }
    }
  },
};

/* ============================================================
   ENGINE 43 — GLITCH CROWN (120x56)
   A jagged crown that keeps corrupting and reforming. Slice
   tears, spike jitter, blinking jewels, noise sparks. Royalty
   of the wrong dimension.
   ============================================================ */
const glitchCrown = {
  name: "GLITCH CROWN",
  tag: "120×56 · royalty of the wrong dimension",
  dims: [120, 56],
  init(rng, density) { return { c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // every pixel goes through this: torn rows shift sideways
    const px = (x, y, col) => {
      const torn = hash2(st.salt + y * 13, frame >> 1) < 0.14;
      const off = torn ? (hash2(y, frame) < 0.5 ? -3 : 3) : 0;
      if (x + off >= 0 && x + off < W) { ctx.fillStyle = col; ctx.fillRect(x + off, y, 1, 1); }
    };
    const BASE = 44;
    const spikes = [18, 40, 60, 80, 102];
    const heights = [16, 22, 28, 22, 16];
    // spikes (triangles, tips jitter when corrupted)
    spikes.forEach((sx, si) => {
      const jit = hash2(st.salt + si * 31, frame >> 1) < 0.2
        ? Math.round((hash2(si, frame) - 0.5) * 8) : 0;
      const hh = heights[si] + jit;
      for (let dy = 0; dy < hh; dy++) {
        const hw = Math.round(5 * (1 - dy / hh)); // triangle half-width
        for (let dx = -hw; dx <= hw; dx++)
          px(sx + dx, BASE - dy, pal.main[(st.c + si + shift) % n]);
      }
      // tip jewel flash
      if ((frame + si * 3) % 9 < 3)
        px(sx, BASE - hh - 1, "#FFFFFF");
    });
    // band
    for (let y = BASE; y < BASE + 8; y++)
      for (let x = 12; x < W - 12; x++)
        px(x, y, (y === BASE || y === BASE + 7)
          ? pal.main[(st.c + 3) % n]
          : pal.main[(st.c + ((x >> 2) % 2) + shift) % n]);
    // jewels on the band
    spikes.forEach((sx, si) => {
      const on = ((frame >> 1) + si) % 3 !== 0;
      px(sx - 1, BASE + 3, on ? "#FFFFFF" : pal.main[(st.c + 5) % n]);
      px(sx, BASE + 3, on ? "#FFFFFF" : pal.main[(st.c + 5) % n]);
      px(sx, BASE + 2, pal.main[(st.c + 5) % n]);
      px(sx, BASE + 4, pal.main[(st.c + 5) % n]);
    });
    // noise sparks
    for (let i = 0; i < 10; i++) {
      const sx2 = Math.floor(hash2(st.salt + i * 7, frame) * W);
      const sy2 = Math.floor(hash2(st.salt + i * 13, frame + 99) * H);
      if (hash2(i, frame) < 0.4) px(sx2, sy2, i % 3 === 0 ? "#FFFFFF" : pal.main[(i + shift) % n]);
    }
  },
};

/* ============================================================
   ENGINE 44 — MEAT ZIPPER (72x120)
   A zipper down the middle. The slider rides up and down; where
   it has passed, the teeth part and SPACE shows through. The
   meat suit opens. #111111 space, never pure black.
   ============================================================ */
const meatZipper = {
  name: "MEAT ZIPPER",
  tag: "72×120 · the meat suit opens",
  dims: [72, 120],
  init(rng, density) { return { c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const CX = 36;
    // slider ping-pongs the full height, seamless
    const u = t * 2 % 1; const ping = u < 1 ? u : 2 - u;
    const sy = Math.round(10 + ping * (H - 26));
    // meat on both flanks
    ditherRect(ctx, 4, 6, CX - 8, H - 12, pal.main[(st.c) % n], pal.bg[0], 0.5);
    ditherRect(ctx, CX + 4, 6, CX - 8, H - 12, pal.main[(st.c + 1) % n], pal.bg[0], 0.5);
    // the galaxy column revealed above the slider
    for (let y = 8; y < sy; y++)
      for (let x = CX - 5; x <= CX + 5; x++) {
        ctx.fillStyle = "#111111";
        ctx.fillRect(x, y, 1, 1);
        const h = hash2(st.salt + x * 17, y * 31);
        if (h < 0.06) {
          ctx.fillStyle = h < 0.015 ? "#FFFFFF" : pal.main[(Math.floor(h * 1000) + shift) % n];
          ctx.fillRect(x, y, 1, 1);
        } else if (h < 0.12) {
          ctx.fillStyle = pal.main[(st.c + 3) % n]; // nebula dust
          ctx.fillRect(x, y, 1, 1);
        }
      }
    // zipper teeth: closed below slider (interlocked), parted above
    for (let y = 8; y < H - 8; y += 4) {
      const openRow = y < sy;
      const spread = openRow ? 5 : 0;
      ctx.fillStyle = openRow ? pal.main[(st.c + 4) % n] : "#FFFFFF";
      if ((y >> 2) % 2 === 0) {
        ctx.fillRect(CX - 4 - spread, y, 3, 2);   // left tooth
        ctx.fillRect(CX + 1 + spread, y + 2, 3, 2); // right tooth, offset
      } else {
        ctx.fillRect(CX + 1 + spread, y, 3, 2);
        ctx.fillRect(CX - 4 - spread, y + 2, 3, 2);
      }
    }
    // slider: body + pull tab, sparkling as it moves
    ctx.fillStyle = pal.main[(st.c + 2 + shift) % n];
    ctx.fillRect(CX - 4, sy, 9, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(CX - 4, sy, 9, 1);
    ctx.fillRect(CX - 1, sy + 4, 3, 4); // pull
    ctx.fillStyle = pal.main[(st.c + 5) % n];
    ctx.fillRect(CX - 1, sy + 8, 3, 1);
    if ((frame % 4) < 2)
      drawSpriteC(ctx, SPRITES.star_tiny, CX + 8, sy - 2, "#FFFFFF");
    // brand tag
    drawText(ctx, "MEAT", CX - 7, H - 7, pal.main[(st.c + shift) % n]);
  },
};

/* ============================================================
   ENGINE 45 — BRAIN WINDOW (96x96)
   A little porthole with screws. Inside: a rotating 4-fold
   mandala galaxy — the machine-elf realm. Some frames a crack
   of PURE TRANSPARENCY crawls across the glass (bg colored —
   on see-thru export your face shows through the crack).
   ============================================================ */
const brainWindow = {
  name: "BRAIN WINDOW",
  tag: "96×96 · porthole to the elf realm",
  dims: [96, 96],
  init(rng, density) {
    const parts = [];
    const count = 10 + Math.round(6 * density);
    for (let i = 0; i < count; i++)
      parts.push({ ph: rng(), rr: 6 + rng() * 26, c: Math.floor(rng() * 10) });
    return { parts, c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const CX = 48, CY = 48;
    // glass: dark void disc (#111111, see-thru safe)
    fillCirclePix(ctx, CX, CY, 38, "#111111");
    // concentric pulse rings
    for (let ring = 0; ring < 3; ring++) {
      const pr = Math.round(((t * 2 + ring / 3) % 1) * 36);
      ctx.fillStyle = pal.main[(st.c + ring + shift) % n];
      for (let a = 0; a < 36; a++) {
        const ang = (a / 36) * 2 * Math.PI;
        const x = CX + Math.round(Math.cos(ang) * pr), y = CY + Math.round(Math.sin(ang) * pr);
        if ((x - CX) ** 2 + (y - CY) ** 2 <= 36 * 36 && a % 3 === ring) ctx.fillRect(x, y, 1, 1);
      }
    }
    // 4-fold mirrored mandala particles
    for (const p of st.parts) {
      const ang = 2 * Math.PI * (2 * t + p.ph);
      const r = p.rr + Math.round(4 * Math.sin(2 * Math.PI * (t + p.ph * 2)));
      const dx = Math.round(Math.cos(ang) * r), dy = Math.round(Math.sin(ang) * r);
      const col = pal.main[(p.c + shift) % n];
      for (const [mx, my] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const x = CX + dx * mx, y = CY + dy * my;
        if ((x - CX) ** 2 + (y - CY) ** 2 <= 36 * 36) {
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    // center star
    drawSpriteC(ctx, SPRITES.star_4, CX, CY, (frame % 4) < 2 ? "#FFFFFF" : pal.main[(st.c + 2) % n]);
    // the crack of pure transparency, some frames only
    if (hash2(st.salt, frame >> 2) < 0.25) {
      let cx0 = CX - 34, cy0 = CY - 20;
      ctx.fillStyle = pal.bg[0];
      for (let s = 0; s < 26; s++) {
        ctx.fillRect(cx0, cy0, 1, 1);
        if (s % 3 === 0) ctx.fillRect(cx0, cy0 + 1, 1, 1);
        cx0 += 2 + Math.floor(hash2(st.salt + s, 7) * 3);
        cy0 += Math.floor(hash2(st.salt + s, 13) * 5) - 1;
      }
    }
    // frame ring + screws
    for (let a = 0; a < 64; a++) {
      const ang = (a / 64) * 2 * Math.PI;
      const x = CX + Math.round(Math.cos(ang) * 40), y = CY + Math.round(Math.sin(ang) * 40);
      ctx.fillStyle = a % 8 < 4 ? pal.main[(st.c + 1) % n] : pal.main[(st.c + 3) % n];
      ctx.fillRect(x, y, 2, 2);
    }
    for (const [sx2, sy2] of [[CX - 30, CY - 30], [CX + 30, CY - 30], [CX - 30, CY + 30], [CX + 30, CY + 30]])
      drawSpriteC(ctx, SPRITES.star_tiny, sx2, sy2, ((frame >> 1) % 2) ? "#FFFFFF" : pal.main[(st.c + 4) % n]);
  },
};

/* ============================================================
   ENGINE 46 — HYPNOTIC SPIRALS (120x64)
   Two counter-rotating spiral discs. Stick them over your eyes.
   You do not need to see. The spirals see for you.
   ============================================================ */
const hypnoticSpirals = {
  name: "HYPNOTIC SPIRALS",
  tag: "120×64 · let the spirals drive",
  dims: [120, 64],
  init(rng, density) { return { c: Math.floor(rng() * 10) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const eyes = [[34, 32, 1], [86, 32, -1]]; // counter-rotating
    for (const [cx, cy, dir] of eyes) {
      // spiral walk
      for (let s = 0; s < 220; s++) {
        const rr = (s / 220) * 24;
        const aa = s * 0.32 + dir * 2 * Math.PI * 2 * t; // 2 laps
        const x = cx + Math.round(Math.cos(aa) * rr);
        const y = cy + Math.round(Math.sin(aa) * rr);
        ctx.fillStyle = pal.main[(st.c + Math.floor(s / 28) + shift) % n];
        ctx.fillRect(x, y, 1, 1);
      }
      // dashed rotating rim
      for (let a = 0; a < 40; a++) {
        if ((a + shift) % 3 === 0) continue;
        const ang = (a / 40) * 2 * Math.PI;
        ctx.fillStyle = pal.main[(st.c + 6) % n];
        ctx.fillRect(cx + Math.round(Math.cos(ang) * 26), cy + Math.round(Math.sin(ang) * 26), 1, 1);
      }
      // blinking center
      fillCirclePix(ctx, cx, cy, 2, (frame % 10) < 7 ? "#FFFFFF" : pal.main[(st.c + 2) % n]);
    }
  },
};

/* ============================================================
   ENGINE 47 — HALO OF SIGILS (140x140)
   A ring of tiny relics orbiting your head, counter-rotating
   star ring inside it. Center is pure bg — on see-thru export
   your face is the centerpiece of the ritual.
   ============================================================ */
const haloSigils = {
  name: "HALO OF SIGILS",
  tag: "140×140 · orbiting relics · you are the ritual",
  dims: [140, 140],
  init(rng, density) {
    const pool = ["skull", "star_5", "heart", "moon", "eye", "ufo", "mushroom", "sigil_1"];
    const relics = [];
    const count = 7 + Math.round(density);
    for (let i = 0; i < count; i++)
      relics.push({ sp: pool[i % pool.length], c: Math.floor(rng() * 10), bob: rng() });
    return { relics, c: Math.floor(rng() * 10) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const CX = 70, CY = 70;
    const K = st.relics.length;
    // outer relic ring, 1 lap per loop, gentle radial bob
    st.relics.forEach((r, i) => {
      const ang = 2 * Math.PI * (t + i / K);
      const rr = 54 + Math.round(4 * Math.sin(2 * Math.PI * (t * 2 + r.bob)));
      const x = CX + Math.round(Math.cos(ang) * rr);
      const y = CY + Math.round(Math.sin(ang) * rr);
      drawSpriteC(ctx, SPRITES[r.sp], x, y, pal.main[(r.c + shift) % n]);
      if ((frame + i * 5) % 16 < 2)
        drawSpriteC(ctx, SPRITES.star_tiny, x + 5, y - 5, "#FFFFFF");
    });
    // inner counter-rotating star dust ring
    for (let i = 0; i < 14; i++) {
      const ang = 2 * Math.PI * (1 - t + i / 14); // -1 lap, seamless
      const rr = 40 + (i % 3);
      const x = CX + Math.round(Math.cos(ang) * rr);
      const y = CY + Math.round(Math.sin(ang) * rr);
      if ((i + frame) % 4 === 0) continue; // dashed orbit
      ctx.fillStyle = i % 5 === 0 ? "#FFFFFF" : pal.main[(st.c + i + shift) % n];
      ctx.fillRect(x, y, 1, 1);
    }
    // cardinal sparks
    if ((frame % 8) < 3) {
      drawSpriteC(ctx, SPRITES.star_tiny, CX, CY - 60, pal.main[(st.c + 2) % n]);
      drawSpriteC(ctx, SPRITES.star_tiny, CX, CY + 60, pal.main[(st.c + 2) % n]);
    }
  },
};

ENGINES.push(thirdEye, antennae, pixelTears, glitchCrown, meatZipper, brainWindow, hypnoticSpirals, haloSigils);

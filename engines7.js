/* ============================================================
   ENGINES 7 — SQUARE STAMPS. 96x96, 1:1, stamp energy.
   The word sits CENTERED IN THE MIDDLE — horizontally and
   vertically — and the rest of the square is free real estate
   for orbiting junk, watcher eyes, and hazard tape.
   Same laws: integer pixels, flat colors, pure f(st, frame),
   seamless loops, #111111 instead of pure black for motifs.
   ============================================================ */

/* centered text block — the heart of every square stamp.
   returns false when the words can't fit (marquee takes over) */
function sqCenterText(ctx, text, cx, cy, maxW, maxLines, gap, colorFor, outline) {
  const lines = wrapText(text, maxW, maxLines);
  if (!lines) return false;
  const s = TEXT_SCALE;
  const totalH = lines.length * (GLYPH_H + gap) * s - gap * s;
  let ty = Math.round(cy - totalH / 2);
  for (const line of lines) {
    const tx = Math.round(cx - textWidth(line) / 2);
    if (outline) drawTextOutlined(ctx, line, tx, ty, colorFor, outline);
    else drawText(ctx, line, tx, ty, colorFor);
    ty += (GLYPH_H + gap) * s;
  }
  return true;
}
/* when the words refuse to fit: one-line marquee through the
   vertical middle. the word stays centered in spirit. */
function sqMarquee(ctx, text, cx, cy, maxW, frame, F, colorFor, outline) {
  const tw = textWidth(text);
  const x0 = cx - Math.floor(maxW / 2);
  const tx = x0 + maxW - Math.floor((frame / F) * (tw + maxW));
  const ty = Math.round(cy - (GLYPH_H * TEXT_SCALE) / 2);
  if (outline) drawTextOutlined(ctx, text, tx, ty, colorFor, outline);
  else drawText(ctx, text, tx, ty, colorFor);
}

/* ============================================================
   ENGINE 56 — SQ STAMP · ROYAL SEAL (96x96)
   Ornate double border, marching-dash inner frame, blinking
   corner diamonds. A seal icon up top with star courtiers in
   stepped orbit. The word, dead center, like a decree.
   ============================================================ */
const sqRoyalSeal = {
  name: "SQ STAMP · ROYAL SEAL",
  tag: "96×96 · 1:1 · the crown certifies you",
  dims: [96, 96],
  isText: true,
  init(rng, density) {
    const icons = ["star_5", "heart", "eye", "moon", "ufo", "skull"];
    return {
      icon: icons[Math.floor(rng() * icons.length)],
      c: Math.floor(rng() * 10),
    };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "WEIRD BITCH").toUpperCase();
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // outer bevel, flashing
    const flip = (frame % 4) < 2;
    bevelBorder(ctx, W, H, pal.main[flip ? 0 : 2 % n], pal.main[flip ? 2 % n : 0]);
    // inner dashed frame, dashes march around the perimeter
    ctx.fillStyle = pal.main[(st.c + 1 + shift) % n];
    for (let x = 4; x < W - 4; x += 4) {
      if (((x >> 2) + (frame >> 1)) % 2) { ctx.fillRect(x, 4, 2, 1); ctx.fillRect(x, H - 5, 2, 1); }
    }
    for (let y = 4; y < H - 4; y += 4) {
      if (((y >> 2) + (frame >> 1)) % 2) { ctx.fillRect(4, y, 1, 2); ctx.fillRect(W - 5, y, 1, 2); }
    }
    // corner diamonds, blinking in round-robin
    const corners = [[7, 7], [W - 8, 7], [7, H - 8], [W - 8, H - 8]];
    corners.forEach(([dx, dy], ci) => {
      drawSpriteC(ctx, SPRITES.diamond, dx, dy,
        ((frame >> 1) + ci) % 4 === 0 ? "#FFFFFF" : pal.main[(st.c + ci) % n]);
    });
    // the seal icon up top, star courtiers in stepped orbit
    const ix = W >> 1, iy = 20;
    const rotStep = Math.floor((frame / F) * 8); // 8 positions, seamless
    for (let k = 0; k < 8; k++) {
      const ang = ((k + rotStep) / 8) * 2 * Math.PI;
      const x = ix + Math.round(Math.cos(ang) * 12), y = iy + Math.round(Math.sin(ang) * 12);
      if ((k + frame) % 3 === 0) continue; // dashed orbit
      ctx.fillStyle = k % 2 ? pal.main[(st.c + 2) % n] : pal.main[(st.c + 4) % n];
      ctx.fillRect(x, y, 1, 1);
    }
    drawSpriteC(ctx, SPRITES[st.icon], ix, iy + ((frame % 4) < 2 ? 0 : 1),
      (ch, c, r) => ((c + r + frame) % 6 === 0) ? "#FFFFFF" : pal.main[(st.c + shift) % n]);
    // THE WORD, dead center
    const ok = sqCenterText(ctx, text, W >> 1, 58, W - 16, 3, 1,
      (i) => pal.main[(i + shift) % n], pal.bg[0]);
    if (!ok) sqMarquee(ctx, text, W >> 1, 58, W - 16, frame, F,
      (i) => pal.main[(i + shift) % n], pal.bg[0]);
    // bottom bling row
    for (let x = 14; x < W - 14; x += 8) {
      if (((x >> 3) + frame) % 3 === 0) continue;
      drawSpriteC(ctx, SPRITES.star_tiny, x, H - 12,
        ((x >> 3) + (frame >> 1)) % 4 === 0 ? "#FFFFFF" : pal.main[(x + st.c) % n]);
    }
  },
};

/* ============================================================
   ENGINE 57 — SQ STAMP · STICKER CLUB (96x96)
   Die-cut sticker: fat white border, dark pinline, dithered
   panel inside. Four little stickers pinned in the corners,
   dust drifting upward behind the word. Centered, obviously.
   ============================================================ */
const sqStickerClub = {
  name: "SQ STAMP · STICKER CLUB",
  tag: "96×96 · 1:1 · die-cut vibes",
  dims: [96, 96],
  isText: true,
  init(rng, density) {
    const pool = ["heart", "star_5", "moon", "ufo", "mushroom", "eye", "skull", "wand"];
    const stickers = [];
    for (let i = 0; i < 4; i++)
      stickers.push({ sp: pool[Math.floor(rng() * pool.length)], c: Math.floor(rng() * 10) });
    const floaters = [];
    for (let i = 0; i < Math.round(9 * density); i++)
      floaters.push({
        x: 8 + rng() * 80, y0: rng() * 96,
        laps: 1 + Math.floor(rng() * 2),
        sp: rng() < 0.6 ? "star_tiny" : "diamond",
        c: Math.floor(rng() * 10),
        phase: Math.floor(rng() * 6),
      });
    return { stickers, floaters, c: Math.floor(rng() * 10) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "SPARKLY AS FUCK").toUpperCase();
    const shift = Math.floor(frame / 2);
    const t = frame / F;
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // die-cut white frame + dark pinline
    ctx.fillStyle = "#FFFFFF";
    for (let x = 0; x < W; x++) { ctx.fillRect(x, 0, 1, 1); ctx.fillRect(x, 1, 1, 1); ctx.fillRect(x, H - 1, 1, 1); ctx.fillRect(x, H - 2, 1, 1); }
    for (let y = 0; y < H; y++) { ctx.fillRect(0, y, 1, 1); ctx.fillRect(1, y, 1, 1); ctx.fillRect(W - 1, y, 1, 1); ctx.fillRect(W - 2, y, 1, 1); }
    ctx.fillStyle = "#111111";
    for (let x = 3; x < W - 3; x++) { ctx.fillRect(x, 3, 1, 1); ctx.fillRect(x, H - 4, 1, 1); }
    for (let y = 3; y < H - 3; y++) { ctx.fillRect(3, y, 1, 1); ctx.fillRect(W - 4, y, 1, 1); }
    // dithered panel
    ditherRect(ctx, 5, 5, W - 10, H - 10, pal.bg[0], pal.main[(st.c + shift) % n], 0.22);
    // dust drifting straight up, wrapping seamless
    for (const f of st.floaters) {
      const y = Math.round((((f.y0 - t * f.laps * 96) % 96) + 96) % 96);
      if (y < 7 || y > H - 8) continue;
      if (((frame + f.phase) % 5) === 0) continue; // twinkle out
      drawSpriteC(ctx, SPRITES[f.sp], Math.round(f.x), y,
        (f.phase + frame) % 7 === 0 ? "#FFFFFF" : pal.main[(f.c + shift) % n]);
    }
    // corner stickers, bobbing, gloss blink
    const spots = [[13, 13], [W - 13, 13], [13, H - 13], [W - 13, H - 13]];
    st.stickers.forEach((sk, i) => {
      const bob = ((frame + i * 2) % 8) < 4 ? 0 : 1;
      drawSpriteC(ctx, SPRITES[sk.sp], spots[i][0], spots[i][1] - bob,
        (ch, c, r) => ((c + r + frame + i) % 6 === 0) ? "#FFFFFF" : pal.main[(sk.c + shift) % n]);
    });
    // THE WORD, dead center, outlined against the panel
    const ok = sqCenterText(ctx, text, W >> 1, H >> 1, W - 22, 3, 1,
      (i) => pal.main[(i + shift + 2) % n], pal.bg[0]);
    if (!ok) sqMarquee(ctx, text, W >> 1, H >> 1, W - 22, frame, F,
      (i) => pal.main[(i + shift + 2) % n], pal.bg[0]);
  },
};

/* ============================================================
   ENGINE 58 — SQ STAMP · MIDDLE BURST (96x96)
   Radial starburst spinning in stepped jumps behind a solid
   plaque. The plaque hugs the word (grows with text size),
   bolted at the corners. Loud, proud, centered.
   ============================================================ */
const sqMiddleBurst = {
  name: "SQ STAMP · MIDDLE BURST",
  tag: "96×96 · 1:1 · starburst plaque",
  dims: [96, 96],
  isText: true,
  init(rng, density) {
    return { c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "MAXIMALISM OR GTFO").toUpperCase();
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const CX = W >> 1, CY = H >> 1;
    // starburst: 12 spokes, stepped rotation, dashed for texture
    const rotStep = Math.floor((frame / F) * 12); // 12 positions, seamless
    for (let k = 0; k < 12; k++) {
      const ang = ((k + rotStep) / 12) * 2 * Math.PI;
      const col = k % 2 ? pal.main[(st.c + shift) % n] : pal.main[(st.c + 2 + shift) % n];
      for (let r = 12; r < 47; r++) {
        if ((r + k + frame) % 4 === 3) continue;
        const x = CX + Math.round(Math.cos(ang) * r), y = CY + Math.round(Math.sin(ang) * r);
        if (x >= 1 && x < W - 1 && y >= 1 && y < H - 1) {
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // edge sparks where the burst dies
    for (let i = 0; i < 8; i++) {
      const sx = Math.floor(hash2(st.salt + i * 7, frame >> 1) * W);
      const sy = Math.floor(hash2(st.salt + i * 13, frame >> 1) * H);
      if (hash2(i, frame) < 0.35) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
    // the plaque: sized to hug the word, bolts at the corners
    const s = TEXT_SCALE;
    const lines = wrapText(text, W - 22, 3);
    const blockH = (lines ? lines.length * (GLYPH_H + 1) * s - s : GLYPH_H * s);
    const ph = blockH + 10;
    const py0 = Math.round(CY - ph / 2);
    ctx.fillStyle = pal.bg[0];
    ctx.fillRect(5, py0, W - 10, ph);
    ctx.fillStyle = pal.main[(st.c + 1 + shift) % n];
    for (let x = 5; x < W - 5; x++) { ctx.fillRect(x, py0, 1, 1); ctx.fillRect(x, py0 + ph - 1, 1, 1); }
    for (let y = py0; y < py0 + ph; y++) { ctx.fillRect(5, y, 1, 1); ctx.fillRect(W - 6, y, 1, 1); }
    // corner bolts
    const boltOn = (frame % 4) < 2;
    for (const [bx, by] of [[8, py0 + 3], [W - 9, py0 + 3], [8, py0 + ph - 4], [W - 9, py0 + ph - 4]]) {
      ctx.fillStyle = boltOn ? "#FFFFFF" : pal.main[(st.c + 3) % n];
      ctx.fillRect(bx, by, 1, 1);
    }
    // THE WORD, dead center of the plaque
    if (lines) {
      sqCenterText(ctx, text, CX, CY, W - 22, 3, 1,
        (i) => pal.main[(i + shift) % n], null);
    } else {
      sqMarquee(ctx, text, CX, CY, W - 22, frame, F,
        (i) => pal.main[(i + shift) % n], null);
    }
  },
};

/* ============================================================
   ENGINE 59 — SQ STAMP · CURSED LABEL (96x96)
   Scrolling hazard-tape border, two watcher eyes up top that
   track something offscreen, cursed icon bouncing at the
   bottom. In the middle: your words, officially warned.
   ============================================================ */
const sqCursedLabel = {
  name: "SQ STAMP · CURSED LABEL",
  tag: "96×96 · 1:1 · caution: contents weird",
  dims: [96, 96],
  isText: true,
  init(rng, density) {
    const pool = ["skull", "mushroom", "ufo", "heart"];
    return {
      hz: Math.floor(rng() * 10),
      icon: pool[Math.floor(rng() * pool.length)],
      c: Math.floor(rng() * 10),
      phase: Math.floor(rng() * 12),
    };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "WARNING: THIS BITCH GIVES 0 FUCKS").toUpperCase();
    const shift = Math.floor(frame / 2);
    const t = frame / F;
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // hazard tape around every edge, scrolling diagonal stripes
    const hz = pal.main[st.hz % n];
    for (let y = 0; y < H; y++) {
      const inBand = y < 4 || y >= H - 4;
      for (let x = 0; x < W; x++) {
        if (!inBand && x >= 4 && x < W - 4) continue;
        const s = ((x + y + frame) % 6 + 6) % 6;
        ctx.fillStyle = s < 3 ? hz : pal.bg[0];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // inner panel + thin frame
    ctx.fillStyle = pal.bg[0];
    ctx.fillRect(5, 5, W - 10, H - 10);
    ctx.fillStyle = pal.main[(st.hz + 2) % n];
    for (let x = 5; x < W - 5; x++) { ctx.fillRect(x, 5, 1, 1); ctx.fillRect(x, H - 6, 1, 1); }
    for (let y = 5; y < H - 5; y++) { ctx.fillRect(5, y, 1, 1); ctx.fillRect(W - 6, y, 1, 1); }
    // watcher eyes up top, pupils wandering, occasional blink
    const lookX = Math.round(Math.sin(2 * Math.PI * t) * 1.4);
    const lookY = Math.round(Math.sin(4 * Math.PI * t));
    for (const ex of [20, W - 20]) {
      const blink = ((frame + st.phase + ex) % 26) < 2;
      if (blink) {
        ctx.fillStyle = pal.main[(st.c + 3) % n];
        for (let i = -3; i <= 3; i++) ctx.fillRect(ex + i, 14, 1, 1);
        continue;
      }
      drawSpriteC(ctx, SPRITES.eye, ex, 13, "#FFFFFF");
      fillCirclePix(ctx, ex + lookX, 13 + lookY, 2, pal.main[(st.c + shift) % n]);
      fillCirclePix(ctx, ex + lookX, 13 + lookY, 1, "#111111");
    }
    // cursed icon at the bottom, bouncing, sparking
    const ix = W >> 1, iy = H - 16;
    const bob = (frame % 2);
    drawSpriteC(ctx, SPRITES[st.icon], ix, iy - bob,
      (ch, c, r) => ((c + r + frame) % 6 === 0) ? "#FFFFFF" : pal.main[(st.c + 1 + shift) % n]);
    if ((frame % 6) < 2) {
      drawSpriteC(ctx, SPRITES.star_tiny, ix - 10, iy - 4, "#FFFFFF");
      drawSpriteC(ctx, SPRITES.star_tiny, ix + 10, iy - 2, pal.main[(st.hz + shift) % n]);
    }
    // THE WORD, dead center between the eyes and the icon
    const ok = sqCenterText(ctx, text, W >> 1, 48, W - 18, 3, 1,
      (i) => (i + shift) % 5 === 0 ? "#FFFFFF" : pal.main[(i + shift) % n], pal.bg[0]);
    if (!ok) sqMarquee(ctx, text, W >> 1, 48, W - 18, frame, F,
      (i) => (i + shift) % 5 === 0 ? "#FFFFFF" : pal.main[(i + shift) % n], pal.bg[0]);
  },
};

ENGINES.push(sqRoyalSeal, sqStickerClub, sqMiddleBurst, sqCursedLabel);

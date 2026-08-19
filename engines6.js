/* ============================================================
   ENGINES 6 — REACTION MEMES. See-thru-first sticker gags for
   slapping on videos: bg pure #000000 (keyed transparent),
   dark motifs #111111, integer pixels, seamless loops only.
   ============================================================ */

/* ============================================================
   ENGINE 52 — VIBE CHECK (140x88)
   A little gauge of judgment. The needle wanders, then pegs
   into ASTRAL and shakes with sparkles. The needle decides.
   ============================================================ */
const vibeCheck = {
  name: "VIBE CHECK",
  tag: "140×88 · the needle decides",
  dims: [140, 88],
  init(rng, density) { return { c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6), ph: rng() }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    const CX = 70, CY = 76;
    // title
    drawText(ctx, "VIBE CHECK", CX - Math.floor(textWidth("VIBE CHECK") / 2), 6, "#FFFFFF");
    // dial arc: 5 colored zones, upper semicircle r 46..54
    for (let a = 0; a <= 180; a += 1) {
      const ang = Math.PI + (a / 180) * Math.PI;
      const zone = Math.floor(a / 36);
      ctx.fillStyle = pal.main[(st.c + zone + shift) % n];
      for (let r = 47; r <= 54; r += 2) {
        ctx.fillRect(CX + Math.round(Math.cos(ang) * r), CY + Math.round(Math.sin(ang) * r), 1, 2);
      }
      // zone ticks
      if (a % 36 === 0) {
        ctx.fillStyle = "#FFFFFF";
        for (let r = 40; r <= 46; r++)
          ctx.fillRect(CX + Math.round(Math.cos(ang) * r), CY + Math.round(Math.sin(ang) * r), 1, 1);
      }
    }
    // labels
    drawText(ctx, "BAD", 16, CY - 8, pal.main[(st.c + shift) % n]);
    drawText(ctx, "ASTRAL", W - 16 - textWidth("ASTRAL"), CY - 8, pal.main[(st.c + 4 + shift) % n]);
    // needle: wanders on two sines, pegs to ASTRAL with the shakes
    const raw = 0.5 + 0.40 * Math.sin(2 * Math.PI * (t + st.ph)) + 0.08 * Math.sin(2 * Math.PI * 3 * t);
    const pegged = raw > 0.93;
    const sweep = pegged ? 1 : Math.min(0.99, Math.max(0.01, raw));
    const shake = pegged ? Math.round((hash2(st.salt, frame) - 0.5) * 4) : 0;
    const ang = Math.PI + sweep * Math.PI + shake * 0.01;
    for (let r = 6; r <= 44; r++) {
      const x = CX + Math.round(Math.cos(ang) * r), y = CY + Math.round(Math.sin(ang) * r);
      ctx.fillStyle = r > 40 ? "#111111" : "#FFFFFF";
      ctx.fillRect(x, y, 1, 1);
      if (r % 2 === 0) ctx.fillRect(x + 1, y, 1, 1);
    }
    fillCirclePix(ctx, CX, CY, 4, pal.main[(st.c + 2) % n]);
    fillCirclePix(ctx, CX, CY, 2, "#111111");
    // pegged = sparkles + VERDICT
    if (pegged) {
      drawSpriteC(ctx, SPRITES.star_tiny, CX + 34, CY - 40, "#FFFFFF");
      drawSpriteC(ctx, SPRITES.star_tiny, CX + 44, CY - 26, pal.main[(st.c + 4 + shift) % n]);
      if ((frame % 6) < 3)
        drawText(ctx, "ASTRAL!!", CX - Math.floor(textWidth("ASTRAL!!") / 2), 16, pal.main[(st.c + 4 + shift) % n]);
    }
    // bezel screws
    for (const [sx, sy] of [[6, 6], [W - 6, 6], [6, H - 6], [W - 6, H - 6]])
      if ((frame >> 2) % 2) drawSpriteC(ctx, SPRITES.star_tiny, sx, sy, pal.main[(st.c + 3) % n]);
  },
};

/* ============================================================
   ENGINE 53 — ERROR DIALOG (150x110)
   A system dialog from a worse operating system. Seed picks the
   failure: MEAT SUIT MALFUNCTION / VIBES.DLL NOT FOUND /
   REALITY HAS STOPPED RESPONDING. The OK button presses itself.
   Shuffle the layout to re-roll which error you get.
   ============================================================ */
const errorDialog = {
  name: "ERROR DIALOG",
  tag: "150×110 · reality has stopped responding",
  dims: [150, 110],
  init(rng, density) {
    const msgs = ["MEAT SUIT MALFUNCTION", "VIBES.DLL NOT FOUND", "REALITY HAS STOPPED RESPONDING"];
    const mi = Math.floor(rng() * msgs.length);
    const icons = ["skull", "ufo", "eye"];
    return { msg: msgs[mi], icon: icons[mi], c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // the dialog occasionally loses grip on reality
    const jit = hash2(st.salt, frame >> 3) < 0.12 ? (hash2(st.salt + 1, frame) < 0.5 ? -2 : 2) : 0;
    const x0 = 10 + jit, y0 = 14 + (jit ? -jit : 0), WW = 130, HH = 82;
    // shadow + body
    ctx.fillStyle = "#111111"; ctx.fillRect(x0 + 3, y0 + 3, WW, HH);
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x0, y0, WW, HH);
    // title bar
    ctx.fillStyle = pal.main[(st.c + shift) % n];
    ctx.fillRect(x0 + 2, y0 + 2, WW - 4, 10);
    drawText(ctx, "ASTRAL TRASH 98", x0 + 5, y0 + 5, "#FFFFFF");
    // close box
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x0 + WW - 12, y0 + 4, 8, 7);
    ctx.fillStyle = "#111111";
    ctx.fillRect(x0 + WW - 10, y0 + 6, 4, 1); ctx.fillRect(x0 + WW - 10, y0 + 8, 4, 1);
    ctx.fillRect(x0 + WW - 9, y0 + 5, 2, 5);
    // icon + message
    drawSprite(ctx, SPRITES[st.icon], x0 + 8, y0 + 20, pal.main[(st.c + 2 + shift) % n]);
    if ((frame % 12) < 2) drawSpriteC(ctx, SPRITES.star_tiny, x0 + 18, y0 + 16, "#111111");
    const lines = wrapText(st.msg, 88, 3) || [st.msg];
    lines.forEach((ln, li) => drawText(ctx, ln, x0 + 26, y0 + 20 + li * 8, "#111111"));
    // buttons: OK presses itself on a 24-frame cycle, ASCEND just glows
    const pressed = (frame % 24) >= 20;
    const btn = (bx, bw2, label, down, glow) => {
      ctx.fillStyle = glow ? pal.main[(st.c + 4 + shift) % n] : "#FFFFFF";
      ctx.fillRect(bx, y0 + HH - 18, bw2, 12);
      ctx.fillStyle = down ? "#FFFFFF" : "#111111"; // bevel flips when pressed
      ctx.fillRect(bx, y0 + HH - 18, bw2, 1); ctx.fillRect(bx, y0 + HH - 18, 1, 12);
      ctx.fillStyle = down ? "#111111" : "#111111";
      ctx.fillRect(bx, y0 + HH - 7, bw2, 1); ctx.fillRect(bx + bw2 - 1, y0 + HH - 18, 1, 12);
      if (!down) { ctx.fillStyle = "#FFFFFF"; }
      drawText(ctx, label, bx + Math.floor((bw2 - textWidth(label)) / 2) + (down ? 1 : 0), y0 + HH - 14 + (down ? 1 : 0), "#111111");
    };
    btn(x0 + 22, 34, "OK", pressed, false);
    btn(x0 + 74, 46, "ASCEND", false, true);
    // window border
    ctx.fillStyle = "#111111";
    ctx.fillRect(x0, y0, WW, 1); ctx.fillRect(x0, y0 + HH - 1, WW, 1);
    ctx.fillRect(x0, y0, 1, HH); ctx.fillRect(x0 + WW - 1, y0, 1, HH);
  },
};

/* ============================================================
   ENGINE 54 — THOUGHT BUBBLE (120x120)
   Classic comic thought trail rising into a big cloud, and
   inside the cloud: the relic you can't stop thinking about.
   It morphs into a second relic in a poof of stars. Obsessive.
   ============================================================ */
const thoughtBubble = {
  name: "THOUGHT BUBBLE",
  tag: "120×120 · you can't stop thinking about it",
  dims: [120, 120],
  init(rng, density) {
    const pool = ["ufo", "heart", "skull", "mushroom", "eye", "moon", "sigil_1"];
    const a = Math.floor(rng() * pool.length);
    let b = Math.floor(rng() * pool.length);
    if (b === a) b = (b + 1) % pool.length;
    return { spA: pool[a], spB: pool[b], c: Math.floor(rng() * 10), ph: rng() };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // cloud: dark silhouette behind, white on top (clean outline)
    const lobes = [[64, 50, 30], [36, 60, 20], [92, 64, 18], [56, 70, 22]];
    for (const [lx, ly, lr] of lobes) fillCirclePix(ctx, lx, ly, lr + 2, "#111111");
    for (const [lx, ly, lr] of lobes) fillCirclePix(ctx, lx, ly, lr, "#FFFFFF");
    // trail bubbles, pulsing up from bottom-left
    const trail = [[30, 92, 6], [18, 104, 4], [10, 113, 3]];
    trail.forEach(([bx, by, br], i) => {
      const pr = br + (Math.sin(2 * Math.PI * (2 * t + i / 3)) > 0 ? 1 : 0); // 2 laps
      fillCirclePix(ctx, bx, by, pr + 1, "#111111");
      fillCirclePix(ctx, bx, by, pr, "#FFFFFF");
    });
    // the obsession: relic A morphs to relic B once per loop
    const u = (t + st.ph) % 1;
    const nearSwap = (u > 0.42 && u < 0.5) || u > 0.92;
    const bob = Math.round(2 * Math.sin(2 * Math.PI * t));
    const ic = pal.main[(st.c + shift) % n];
    if (nearSwap) {
      drawSpriteC(ctx, SPRITES.star_4, 62, 50 + bob, (frame % 4) < 2 ? "#111111" : ic);
      drawSpriteC(ctx, SPRITES.star_tiny, 48, 40, ic);
      drawSpriteC(ctx, SPRITES.star_tiny, 76, 58, "#111111");
    } else {
      drawSpriteCS(ctx, SPRITES[u < 0.5 ? st.spA : st.spB], 62, 50 + bob, ic, 2);
    }
    // idle sparkles on the cloud rim
    if ((frame % 10) < 3) {
      drawSpriteC(ctx, SPRITES.star_tiny, 34, 34, pal.main[(st.c + 3 + shift) % n]);
      drawSpriteC(ctx, SPRITES.star_tiny, 94, 44, pal.main[(st.c + 5) % n]);
    }
  },
};

/* ============================================================
   ENGINE 55 — RAINBOW PUKE (110x130)
   Little guy had too much aura. A rainbow pours out of his
   face, stripes cycling, wobbling as it falls, pooling at the
   bottom, sparks rising off the pool. He is fine. Probably.
   ============================================================ */
const rainbowPuke = {
  name: "RAINBOW PUKE",
  tag: "110×130 · too much aura",
  dims: [110, 130],
  init(rng, density) {
    const drops = [];
    for (let i = 0; i < 3 + Math.round(2 * density); i++)
      drops.push({ ph: rng(), laps: 1 + Math.floor(rng() * 2), xoff: rng() });
    return { drops, c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // head: dark silhouette then white face
    const HX = 38, HY = 28;
    fillCirclePix(ctx, HX, HY, 15, "#111111");
    fillCirclePix(ctx, HX, HY, 14, "#FFFFFF");
    // X eyes (he's seen too much)
    ctx.fillStyle = "#111111";
    for (const ex of [HX - 6, HX + 5]) {
      ctx.fillRect(ex, HY - 5, 1, 1); ctx.fillRect(ex + 1, HY - 4, 1, 1); ctx.fillRect(ex + 2, HY - 3, 1, 1);
      ctx.fillRect(ex + 2, HY - 5, 1, 1); ctx.fillRect(ex + 1, HY - 4, 1, 1); ctx.fillRect(ex, HY - 3, 1, 1);
    }
    // open mouth (the source)
    ctx.fillStyle = "#111111";
    ctx.fillRect(HX + 6, HY + 6, 7, 4);
    ctx.fillRect(HX + 7, HY + 10, 5, 1);
    // rainbow stream: pours down-right, widening, stripes cycling
    for (let x = HX + 8; x < W - 4; x++) {
      const k = x - (HX + 8);
      const cy = HY + 9 + Math.round(k * 1.15) + Math.round(2 * Math.sin(2 * Math.PI * (2 * t + x / 20)));
      const half = 2 + Math.round(k * 0.22);
      for (let y = cy - half; y <= cy + half; y++) {
        if (y < 0 || y >= H - 16) continue;
        const band = Math.floor((y - (cy - half)) / 2) + Math.floor(k / 10);
        ctx.fillStyle = pal.main[(st.c + band + shift) % n];
        ctx.fillRect(x, y, 1, 1);
      }
      // white froth edge
      if ((x + frame) % 7 === 0) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x, cy - half, 1, 1);
        ctx.fillRect(x, cy + half, 1, 1);
      }
    }
    // droplets peeling off the stream
    for (const d of st.drops) {
      const u = (t * d.laps + d.ph) % 1;
      const dx = HX + 20 + Math.round(d.xoff * 60);
      const dy = HY + 20 + Math.round(u * (H - HY - 40));
      if (u > 0.9) drawSpriteC(ctx, SPRITES.star_tiny, dx, H - 18, "#FFFFFF");
      else {
        ctx.fillStyle = pal.main[(Math.floor(d.ph * 10) + shift) % n];
        ctx.fillRect(dx, dy, 1, 2);
      }
    }
    // the pool: dithered, breathing width, sparks rising
    const poolW = 30 + Math.round(6 * Math.sin(2 * Math.PI * t)); // 1 breath
    ditherRect(ctx, W - 10 - poolW, H - 14, poolW, 10, pal.main[(st.c + shift) % n], pal.main[(st.c + 3 + shift) % n], 0.5);
    ctx.fillStyle = pal.main[(st.c + 4 + shift) % n];
    ctx.fillRect(W - 10 - poolW, H - 14, poolW, 1);
    for (let i = 0; i < 4; i++) {
      const u = (t * 2 + i / 4) % 1; // 2 laps
      const sx = W - 10 - poolW + 4 + Math.round(((poolW - 8) * i) / 3.5);
      const sy = H - 16 - Math.round(u * 12);
      if (u < 0.8) {
        ctx.fillStyle = i % 2 ? "#FFFFFF" : pal.main[(st.c + i + shift) % n];
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
  },
};

ENGINES.push(vibeCheck, errorDialog, thoughtBubble, rainbowPuke);

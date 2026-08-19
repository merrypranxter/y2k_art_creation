/* ============================================================
   ENGINES 5 — VIDEO FRAMES. Full 9:16 (180x320) overlays built
   see-thru first: the middle stays pure #000000 so YOUR VIDEO
   shows through on transparent export. Dark motifs = #111111.
   Same laws: integer pixels, pure f(st, frame), seamless loops.
   ============================================================ */

/* ============================================================
   ENGINE 48 — VOYEUR FRAME (180x320)
   Eyes bulge in from all four edges and watch your video.
   Individual blink phases, pupils drifting to look at you,
   and every so often they ALL blink at once. The walls are
   watching. Center stays wide open.
   ============================================================ */
const voyeurFrame = {
  name: "VOYEUR FRAME",
  tag: "180×320 · the walls are watching",
  dims: [180, 320],
  init(rng, density) {
    const eyes = [];
    const per = 3 + Math.round(density); // per long edge
    for (let i = 0; i < per; i++) { // left / right
      eyes.push({ edge: 0, pos: 26 + (i + 0.15 + rng() * 0.7) * ((320 - 52) / per), r: 9 + Math.floor(rng() * 6), ph: rng(), blinks: 1 + Math.floor(rng() * 2), ph2: rng(), c: Math.floor(rng() * 10) });
      eyes.push({ edge: 1, pos: 26 + (i + 0.15 + rng() * 0.7) * ((320 - 52) / per), r: 9 + Math.floor(rng() * 6), ph: rng(), blinks: 1 + Math.floor(rng() * 2), ph2: rng(), c: Math.floor(rng() * 10) });
    }
    const perT = 2 + Math.round(density * 0.5); // top / bottom
    for (let i = 0; i < perT; i++) {
      eyes.push({ edge: 2, pos: 30 + (i + 0.15 + rng() * 0.7) * ((180 - 60) / perT), r: 8 + Math.floor(rng() * 5), ph: rng(), blinks: 1 + Math.floor(rng() * 2), ph2: rng(), c: Math.floor(rng() * 10) });
      eyes.push({ edge: 3, pos: 30 + (i + 0.15 + rng() * 0.7) * ((180 - 60) / perT), r: 8 + Math.floor(rng() * 5), ph: rng(), blinks: 1 + Math.floor(rng() * 2), ph2: rng(), c: Math.floor(rng() * 10) });
    }
    return { eyes, salt: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // THE GROUP BLINK — rare, deeply unsettling, seamless-safe
    const allBlink = hash2(st.salt, frame >> 4) < 0.05;
    for (const e of st.eyes) {
      const horiz = e.edge < 2; // eye on a vertical edge, opens horizontally
      const bp = (t * e.blinks + e.ph) % 1;
      let open = bp > 0.86 ? Math.max(0.1, Math.abs(bp - 0.93) / 0.07) : 1;
      if (allBlink) open = Math.min(open, 0.1);
      const rw = e.r, rh = Math.max(1, Math.round(e.r * 0.62 * open));
      // eye center sits just off the edge, bulging inward
      const cx = e.edge === 0 ? 2 : e.edge === 1 ? W - 2 : Math.round(e.pos);
      const cy = e.edge === 2 ? 2 : e.edge === 3 ? H - 2 : Math.round(e.pos);
      // pupil slides to stare dead at the center of the screen
      const look = Math.round(3 * Math.sin(2 * Math.PI * (t + e.ph2)));
      const irisC = pal.main[(e.c + shift) % n];
      const outC = pal.main[(e.c + 3 + shift) % n];
      const ir = Math.max(2, Math.round(e.r * 0.42));
      if (horiz) {
        const inw = e.edge === 0 ? 1 : -1; // inward direction
        for (let dx = -rw; dx <= rw; dx++) {
          const h = Math.round(rh * Math.sqrt(Math.max(0, 1 - (dx * dx) / (rw * rw))));
          const x = cx + dx;
          if (x < 0 || x >= W) continue;
          ctx.fillStyle = "#FFFFFF"; // eyeball
          if (h > 0) ctx.fillRect(x, cy - h, 1, 2 * h + 1);
          ctx.fillStyle = outC; // lid outline
          ctx.fillRect(x, cy - h, 1, 1);
          ctx.fillRect(x, cy + h, 1, 1);
        }
        const ix = cx + inw * Math.round(rw * 0.4) + (e.edge === 0 ? look : -look);
        fillCirclePix(ctx, ix, cy, ir, irisC);
        fillCirclePix(ctx, ix, cy, Math.max(1, ir - 2), "#111111");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(ix - 1, cy - 1, 1, 1);
      } else {
        const inw = e.edge === 2 ? 1 : -1;
        for (let dy = -rw; dy <= rw; dy++) {
          const h = Math.round(rh * Math.sqrt(Math.max(0, 1 - (dy * dy) / (rw * rw))));
          const y = cy + dy;
          if (y < 0 || y >= H) continue;
          ctx.fillStyle = "#FFFFFF";
          if (h > 0) ctx.fillRect(cx - h, y, 2 * h + 1, 1);
          ctx.fillStyle = outC;
          ctx.fillRect(cx - h, y, 1, 1);
          ctx.fillRect(cx + h, y, 1, 1);
        }
        const iy = cy + inw * Math.round(rw * 0.4) + (e.edge === 2 ? look : -look);
        fillCirclePix(ctx, cx, iy, ir, irisC);
        fillCirclePix(ctx, cx, iy, Math.max(1, ir - 2), "#111111");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(cx - 1, iy - 1, 1, 1);
      }
    }
  },
};

/* ============================================================
   ENGINE 49 — MYCELIUM CREEP (180x320)
   The network grows in from every edge — branching hyphae,
   pulsing nodes, glowing tips that breathe, spores drifting
   toward your warmth. It never reaches the middle. Yet.
   ============================================================ */
const myceliumCreep = {
  name: "MYCELIUM CREEP",
  tag: "180×320 · it grows toward the warmth",
  dims: [180, 320],
  init(rng, density) {
    const branches = [];
    const roots = 20 + Math.round(10 * density);
    for (let i = 0; i < roots; i++) {
      const edge = i % 4;
      let x, y, ang;
      if (edge === 0) { x = 1; y = 8 + rng() * (320 - 16); ang = 0; }
      else if (edge === 1) { x = 178; y = 8 + rng() * (320 - 16); ang = Math.PI; }
      else if (edge === 2) { x = 8 + rng() * (180 - 16); y = 1; ang = Math.PI / 2; }
      else { x = 8 + rng() * (180 - 16); y = 318; ang = -Math.PI / 2; }
      const seed = Math.floor(rng() * 1e6);
      const len = 30 + Math.floor(rng() * 26); // reach ≤ ~56px in
      const pts = [];
      let px = x, py = y, a = ang;
      for (let s = 0; s < len; s++) {
        pts.push([Math.round(px), Math.round(py)]);
        a += (hash2(seed + i * 77, s) - 0.5) * 1.1;
        px += Math.cos(a) * 1.2; py += Math.sin(a) * 1.2;
      }
      branches.push({ pts, c: Math.floor(rng() * 10), ph: rng() });
      // child fork
      if (rng() < 0.45 && len > 24) {
        const forkAt = 10 + Math.floor(rng() * (len - 16));
        const [fx, fy] = pts[forkAt];
        let fa = a + (rng() < 0.5 ? 0.9 : -0.9);
        let cx2 = fx, cy2 = fy;
        const cpts = [];
        const clen = 10 + Math.floor(rng() * 12);
        for (let s = 0; s < clen; s++) {
          cpts.push([Math.round(cx2), Math.round(cy2)]);
          fa += (hash2(seed + i * 91, s + 40) - 0.5) * 1.2;
          cx2 += Math.cos(fa) * 1.2; cy2 += Math.sin(fa) * 1.2;
        }
        branches.push({ pts: cpts, c: Math.floor(rng() * 10), ph: rng() });
      }
    }
    return { branches, c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    for (const b of st.branches) {
      const L = b.pts.length;
      // nutrient glow travels root -> tip, 2 pulses per loop
      const glow = ((t * 2 + b.ph) % 1) * L;
      for (let j = 0; j < L; j++) {
        const [x, y] = b.pts[j];
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const nearGlow = Math.abs(j - glow) < 2.5;
        ctx.fillStyle = nearGlow ? "#FFFFFF" : pal.main[(b.c + Math.floor(j / 4) + shift) % n];
        ctx.fillRect(x, y, 1, 1);
        // fat nodes every so often, breathing
        if (j % 7 === 3 && ((frame >> 1) + j) % 8 < 4) {
          ctx.fillStyle = pal.main[(b.c + 2 + shift) % n];
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
        }
      }
      // tip: pulsing spore sac
      const [tx, ty] = b.pts[L - 1];
      if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
        const pulse = (frame + Math.floor(b.ph * 16)) % 8 < 4 ? 1 : 2;
        fillCirclePix(ctx, tx, ty, pulse, pal.main[(b.c + 4 + shift) % n]);
        // spore drifts inward off the tip, then pops
        const u = (t * 1 + b.ph) % 1; // 1 lap
        const sx = tx + Math.round((W / 2 - tx) * 0.10 * u) + Math.round(2 * Math.sin(2 * Math.PI * (t + b.ph)));
        const sy = ty + Math.round((H / 2 - ty) * 0.10 * u);
        if (u > 0.85) drawSpriteC(ctx, SPRITES.star_tiny, sx, sy, "#FFFFFF");
        else if ((frame % 3) !== 0) {
          ctx.fillStyle = (frame % 6) < 3 ? "#FFFFFF" : pal.main[(b.c + shift) % n];
          ctx.fillRect(sx, sy, 1, 1);
        }
      }
    }
  },
};

/* ============================================================
   ENGINE 50 — VHS OVERLAY (180x320)
   Your video, but it was taped over something. Scanlines, a
   tracking band that crawls down the screen, breathing focus
   brackets, PLAY / REC / SP / a timestamp that glitches at
   exactly 3:33 AM. Occasional full-frame tracking jitter.
   ============================================================ */
const vhsOverlay = {
  name: "VHS OVERLAY",
  tag: "180×320 · this tape is cursed",
  dims: [180, 320],
  init(rng, density) { return { c: Math.floor(rng() * 10), salt: Math.floor(rng() * 1e6) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // rare tracking jitter: everything HUD-ish jumps 2px
    const jit = hash2(st.salt, frame >> 3) < 0.08 ? 2 : 0;
    // scanlines (see-thru safe dark, subtle)
    ctx.fillStyle = "#111111";
    for (let y = 2; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    // tracking band: 1 full crawl per loop
    const bandY = Math.floor(t * (H + 30)) - 15;
    ditherRect(ctx, 0, bandY, W, 14, "#FFFFFF", pal.bg[0], 0.08);
    for (let y = bandY; y < bandY + 14; y += 2) {
      if (y < 0 || y >= H) continue;
      const x0 = Math.floor(hash2(st.salt + y, frame) * (W - 24));
      const len = 6 + Math.floor(hash2(y, frame * 3 + 7) * 20);
      const pick = hash2(st.salt + y * 3, frame);
      ctx.fillStyle = pick < 0.4 ? "#FFFFFF" : pick < 0.7 ? pal.main[(st.c + shift) % n] : "#111111";
      ctx.fillRect(x0 + jit, y, len, 1);
    }
    // camcorder focus brackets, breathing in/out
    const b = Math.round(2 * Math.sin(2 * Math.PI * 2 * t)); // 2 breaths
    const bx = 5 + b + jit, by = 5 + b;
    const bw = W - 5 - b + jit, bh = H - 5 - b;
    ctx.fillStyle = "#FFFFFF";
    const A = 13; // arm length
    ctx.fillRect(bx, by, A, 1); ctx.fillRect(bx, by, 1, A);
    ctx.fillRect(bw - A, by, A, 1); ctx.fillRect(bw, by, 1, A);
    ctx.fillRect(bx, bh, A, 1); ctx.fillRect(bx, bh - A, 1, A);
    ctx.fillRect(bw - A, bh, A, 1); ctx.fillRect(bw, bh - A, 1, A);
    // PLAY + triangle (top-left)
    drawText(ctx, "PLAY", 9 + jit, 9, "#FFFFFF");
    const triH = [1, 2, 3, 2, 1];
    ctx.fillStyle = pal.main[(st.c + shift) % n];
    triH.forEach((hh, i) => ctx.fillRect(28 + i + jit, 12 - hh, 1, hh * 2 + 1));
    // REC + flashing dot (top-right)
    if ((frame % 8) < 5) fillCirclePix(ctx, W - 45 + jit, 11, 3, pal.main[(st.c + 1) % n]);
    drawText(ctx, "REC", W - 36 + jit, 9, (frame % 8) < 5 ? "#FFFFFF" : pal.main[(st.c + 1) % n]);
    // timestamp (bottom-left) — one digit keeps slipping
    const ts = "3:33 AM";
    drawText(ctx, ts, 9 + jit, H - 13, "#FFFFFF");
    if (hash2(st.salt + 9, frame >> 2) < 0.35) {
      const gi = Math.floor(hash2(st.salt + 10, frame >> 2) * ts.length);
      const gx = 9 + jit + textWidth(ts.slice(0, gi));
      drawText(ctx, ts[gi], gx, H - 13 + (hash2(gi, frame) < 0.5 ? -1 : 1), pal.main[(st.c + 4 + shift) % n]);
    }
    // SP (bottom-right)
    drawText(ctx, "SP", W - 18 + jit, H - 13, pal.main[(st.c + 2 + shift) % n]);
    // chromatic edge fringe, alternating
    ctx.fillStyle = pal.main[(st.c + (frame % 2)) % n];
    ctx.fillRect(0, 0, 1, H);
    ctx.fillStyle = pal.main[(st.c + 5 + (frame % 2)) % n];
    ctx.fillRect(W - 1, 0, 1, H);
  },
};

/* ============================================================
   ENGINE 51 — SIGIL RAIN CURTAIN (180x320)
   Beaded strands of charms rain down both sides of your video
   like the doorway to somewhere excellent, swaying as they
   fall. Chain lines, twinkles, splash stars at the floor, a
   gentle bead valance up top. Center stays open. Walk through.
   ============================================================ */
const sigilRainCurtain = {
  name: "SIGIL RAIN CURTAIN",
  tag: "180×320 · charms guard the door",
  dims: [180, 320],
  init(rng, density) {
    const pool = ["eye", "moon", "star_5", "heart", "skull", "sigil_1", "diamond", "drop", "mushroom", "ufo"];
    const xs = [10, 26, 44, 135, 153, 169];
    const strands = xs.map((x, si) => {
      const charms = [];
      const count = 3 + Math.round(2 * density);
      for (let i = 0; i < count; i++)
        charms.push({ sp: pool[Math.floor(rng() * pool.length)], ph: rng(), laps: 1 + Math.floor(rng() * 2), c: Math.floor(rng() * 10) });
      return { x, charms, ph: rng(), c: si };
    });
    return { strands, salt: Math.floor(rng() * 1e6) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // bead valance across the top, gentle 2-lap wave
    for (let x = 4; x < W - 4; x += 6) {
      const bob = Math.round(2 * Math.sin(2 * Math.PI * (2 * t + x / 90)));
      ctx.fillStyle = pal.main[(Math.floor(x / 6) + shift) % n];
      ctx.fillRect(x, 6 + bob, 2, 2);
      if ((x / 6 + frame) % 5 === 0) { // hanging threads
        ctx.fillRect(x, 9 + bob, 1, 3);
      }
    }
    for (const stnd of st.strands) {
      // dashed chain line
      ctx.fillStyle = pal.main[(stnd.c + 2 + shift) % n];
      for (let y = 0; y < H; y += 3) ctx.fillRect(stnd.x, y, 1, 1);
      stnd.charms.forEach((ch, i) => {
        const u = (t * ch.laps + ch.ph) % 1;
        const y = Math.round(-8 + u * (H + 16));
        const sway = Math.round(2 * Math.sin(2 * Math.PI * (t + ch.ph)));
        const x = stnd.x + sway;
        const col = pal.main[(ch.c + shift) % n];
        if (u > 0.93) { // hits the floor: splash of stars
          drawSpriteC(ctx, SPRITES.star_tiny, x, H - 3, "#FFFFFF");
          if ((frame % 4) < 2) drawSpriteC(ctx, SPRITES.star_tiny, x + 4, H - 6, col);
        } else {
          drawSpriteC(ctx, SPRITES[ch.sp], x, y, col);
          if ((frame + i * 7 + stnd.c * 3) % 14 < 2)
            drawSpriteC(ctx, SPRITES.star_tiny, x + 5, y - 5, "#FFFFFF");
        }
      });
    }
    // corner guardians
    if ((frame % 10) < 6) {
      drawSpriteC(ctx, SPRITES.star_4, 8, H - 8, pal.main[shift % n]);
      drawSpriteC(ctx, SPRITES.star_4, W - 8, H - 8, "#FFFFFF");
    }
  },
};

ENGINES.push(voyeurFrame, myceliumCreep, vhsOverlay, sigilRainCurtain);

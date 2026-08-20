/* ============================================================
   ENGINES 2 — the second batch. 6 backgrounds + 5 text engines.
   Same rules: integer pixels, flat colors, frame-driven,
   seamless loops. Everything is a pure function of (st, frame).
   ============================================================ */

/* ============================================================
   ENGINE 17 — SIGIL RAIN
   Alien matrix rain: columns of mirrored 5x5 glyph-noise,
   white-hot heads, trails decaying through the palette.
   ============================================================ */
const sigilRain = {
  name: "SIGIL RAIN",
  tag: "alien matrix · falling glyphs",
  init(rng, density) {
    const colW = 7;
    const cols = [];
    for (let x = 2; x < 180 - 4; x += colW) {
      if (rng() > 0.28 * density + 0.45) continue;
      const trail = 8 + Math.floor(rng() * 8);
      // travel: a multiple of 48 (glyph period 8 x cell 6) long enough that
      // the whole column is off-screen at both ends of the wrap -> no pop
      const travel = Math.ceil((trail * 6 + 320 + 12) / 48) * 48;
      cols.push({
        x,
        laps: 1 + Math.floor(rng() * 3),            // loops per loop
        trail,
        travel,
        p0: rng(),                                  // phase: screen is populated from frame 0
        salt: Math.floor(rng() * 1e6),
        c: Math.floor(rng() * 10),
      });
    }
    return { cols };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const CELL = 6;
    const t = frame / F;
    for (const col of st.cols) {
      const off = Math.floor(((t * col.laps + col.p0) % 1) * col.travel);
      const headA = Math.floor(off / CELL);         // absolute head cell index
      const yHead = -col.trail * CELL + off;
      for (let j = 0; j < col.trail; j++) {
        const y = yHead - j * CELL;
        if (y >= IH || y + CELL < 0) continue;
        const a = headA - j;
        // trail decay: head white, then palette, then sparse ghost
        let col1;
        if (j === 0) col1 = "#FFFFFF";
        else if (j < 3) col1 = pal.main[col.c % n];
        else if (j < 7) col1 = pal.main[(col.c + 1) % n];
        else col1 = pal.main[(col.c + 2) % n];
        const ghost = j >= 7; // old cells drop pixels
        ctx.fillStyle = col1;
        for (let r = 0; r < 5; r++)
          for (let cc = 0; cc < 3; cc++) { // mirrored -> alien sigil symmetry
            const h = hash2(col.salt + ((a % 8) + 8) % 8 * 31 + r, cc * 7 + r * 13);
            if (h < 0.42 && (!ghost || h < 0.16)) {
              ctx.fillRect(col.x + cc, y + r, 1, 1);
              ctx.fillRect(col.x + 4 - cc, y + r, 1, 1);
            }
          }
      }
    }
  },
};

/* ============================================================
   ENGINE 18 — CHARM CASCADE
   The hanging-charm MySpace divider, grown into a full sky:
   swaying chains, beads, chunky charms on the ends.
   ============================================================ */
const charmCascade = {
  name: "CHARM CASCADE",
  tag: "hanging charms · divider lineage",
  init(rng, density) {
    const charms = ["moon", "heart", "skull", "ufo", "star_5", "eye", "mushroom", "wand", "heart_outline", "moon_outline"];
    const count = Math.round(8 * density) + 3;
    const strings = [];
    for (let i = 0; i < count; i++) {
      strings.push({
        x: Math.round((i + 0.5) * (180 / count) + (rng() - 0.5) * 12),
        L: 50 + Math.floor(rng() * 190),
        amp: 3 + Math.floor(rng() * 7),
        cyc: 1 + Math.floor(rng() * 2),
        phase: rng(),
        charm: charms[Math.floor(rng() * charms.length)],
        beadEvery: 9 + Math.floor(rng() * 8),
        c1: Math.floor(rng() * 10),
        c2: Math.floor(rng() * 10),
      });
    }
    return { strings };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    // whisper dust
    for (let y = 0; y < IH; y += 2)
      for (let x = (y % 4); x < IW; x += 4)
        if (hash2(x, y + (frame >> 1)) < 0.012) {
          ctx.fillStyle = pal.main[(x + y) % n];
          ctx.fillRect(x, y, 1, 1);
        }
    st.strings.forEach((s, si) => {
      const swayK = Math.sin(2 * Math.PI * (t * s.cyc + s.phase));
      const swayAt = (y) => Math.round(s.amp * swayK * Math.pow(y / s.L, 1.5));
      const c1 = pal.main[s.c1 % n], c2 = pal.main[s.c2 % n];
      // dashed chain
      for (let y = 0; y <= s.L; y += 2) {
        ctx.fillStyle = (y % 4 === 0) ? c1 : c2;
        ctx.fillRect(s.x + swayAt(y), y, 1, 1);
      }
      // beads
      for (let y = s.beadEvery; y < s.L - 8; y += s.beadEvery) {
        const tw = ((frame + y) % 8) < 4;
        drawSpriteC(ctx, SPRITES[tw ? "star_tiny" : "diamond"], s.x + swayAt(y), y, tw ? c2 : c1);
      }
      // the charm itself, cycling colors, white gloss blink
      const cx = s.x + swayAt(s.L), cy = s.L + 5;
      const cc = pal.main[(s.c1 + Math.floor(frame / 2)) % n];
      drawSpriteC(ctx, SPRITES[s.charm], cx, cy, cc);
      if ((frame + si) % 6 === 0) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(cx - 2, cy - 3, 1, 1);
      }
    });
  },
};

/* ============================================================
   ENGINE 19 — PRODUCT BELT RIOT
   Sticker-sheet conveyor belts, alternating direction & speed,
   hero rows at 2x. Maximalist collage in motion.
   ============================================================ */
const productBelt = {
  name: "PRODUCT BELT RIOT",
  tag: "sprite conveyor belts · sticker riot",
  init(rng, density) {
    const small = ["heart", "star_5", "skull", "mushroom", "eye", "moon", "drop", "wand", "diamond", "ufo"];
    const heroes = ["skull", "ufo", "heart", "eye", "mushroom"];
    const rows = [];
    const rowH = 26;
    const nRows = Math.ceil(320 / rowH);
    for (let r = 0; r < nRows; r++) {
      const hero = r % 4 === 2;
      const setSize = 3 + Math.floor(rng() * 3);
      const set = [];
      const pool = hero ? heroes : small;
      for (let k = 0; k < setSize; k++) set.push(pool[Math.floor(rng() * pool.length)]);
      rows.push({
        y: r * rowH + 3 + Math.floor(rng() * 5),
        dir: r % 2 === 0 ? 1 : -1,
        laps: 1 + Math.floor(rng() * 2),            // belt cycles per loop
        hero,
        set,
        c: Math.floor(rng() * 10),
        beltC: Math.floor(rng() * 10),
      });
    }
    return { rows };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    st.rows.forEach((row, ri) => {
      const s = row.hero ? 2 : 1;
      const period = row.hero ? 44 : 24;
      const span = IW + period * 2;
      const off = Math.floor(t * period * row.laps) * row.dir;
      // belt dashes
      const beltY = row.y + (row.hero ? 19 : 10);
      ctx.fillStyle = pal.main[(row.beltC + Math.floor(frame / 2)) % n];
      for (let x = 0; x < IW; x++)
        if (((x + off) % 8 + 8) % 8 < 4) ctx.fillRect(x, beltY, 1, 1);
      const count = Math.ceil(span / period);
      for (let i = -1; i < count; i++) {
        let x = (i * period + off) % span;
        if (x < 0) x += span;
        x -= period;
        const itemIdx = ((i % row.set.length) + row.set.length) % row.set.length;
        const sprite = SPRITES[row.set[itemIdx]];
        const bob = ((frame + i + ri) % 8) < 4 ? 0 : 1;
        const col = pal.main[(row.c + itemIdx + Math.floor(frame / 2)) % n];
        if (row.hero) drawSpriteS(ctx, sprite, x, row.y - 4 + bob * 2, col, 2);
        else drawSprite(ctx, sprite, x, row.y + bob, col);
      }
    });
  },
};

/* ============================================================
   ENGINE 20 — WORMHOLE TRIP
   Acid screensaver: palette-cycling rect rings zooming out of
   a vanishing point, stars flung outward. 9:16 tunnel.
   ============================================================ */
const wormholeTrip = {
  name: "WORMHOLE TRIP",
  tag: "zoom rings · screensaver acid",
  init(rng, density) {
    const parts = [];
    for (let i = 0; i < Math.round(42 * density); i++)
      parts.push({ ang: rng() * 2 * Math.PI, salt: rng(), c: Math.floor(rng() * 10) });
    return { parts, cx: 90, cy: 160 };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    const SP = 16, RINGS = 13, RMAX = SP * RINGS;
    const off = Math.floor(t * SP);
    // rings — solid line + dashed echo inside for maximalist thickness
    for (let k = 0; k < RINGS; k++) {
      const r = ((k * SP + off) % RMAX + RMAX) % RMAX;
      if (r < 5) continue;
      const hw = Math.round(r * 0.49), hh = Math.round(r * 0.87);
      const col = pal.main[(k + Math.floor(frame / 2)) % n];
      const col2 = pal.main[(k + 1 + Math.floor(frame / 2)) % n];
      ctx.fillStyle = col;
      for (let x = -hw; x <= hw; x++) {
        ctx.fillRect(st.cx + x, st.cy - hh, 1, 1);
        ctx.fillRect(st.cx + x, st.cy + hh, 1, 1);
      }
      for (let y = -hh; y <= hh; y++) {
        ctx.fillRect(st.cx - hw, st.cy + y, 1, 1);
        ctx.fillRect(st.cx + hw, st.cy + y, 1, 1);
      }
      if (r >= 9) { // dashed echo ring
        const hw2 = hw - 2, hh2 = hh - 3;
        ctx.fillStyle = col2;
        for (let x = -hw2; x <= hw2; x++)
          if (((x + frame) % 6 + 6) % 6 < 3) {
            ctx.fillRect(st.cx + x, st.cy - hh2, 1, 1);
            ctx.fillRect(st.cx + x, st.cy + hh2, 1, 1);
          }
        for (let y = -hh2; y <= hh2; y++)
          if (((y + frame) % 6 + 6) % 6 < 3) {
            ctx.fillRect(st.cx - hw2, st.cy + y, 1, 1);
            ctx.fillRect(st.cx + hw2, st.cy + y, 1, 1);
          }
      }
    }
    // outward-flung stars with a fading twin — wrap = reborn at the center
    for (const p of st.parts) {
      const d = ((t + p.salt) % 1) * 195;
      const x = st.cx + Math.round(Math.cos(p.ang) * d);
      const y = st.cy + Math.round(Math.sin(p.ang) * d * 1.45);
      if (x >= 1 && x < IW - 1 && y >= 1 && y < IH - 1) {
        const hot = d < 60;
        drawSpriteC(ctx, SPRITES.star_tiny, x, y, hot ? "#FFFFFF" : pal.main[p.c % n]);
        const d2 = d - 12;
        if (d2 > 4) {
          const x2 = st.cx + Math.round(Math.cos(p.ang) * d2);
          const y2 = st.cy + Math.round(Math.sin(p.ang) * d2 * 1.45);
          if (x2 >= 1 && x2 < IW - 1 && y2 >= 1 && y2 < IH - 1)
            drawSpriteC(ctx, SPRITES.star_tiny, x2, y2, pal.main[(p.c + 2) % n]);
        }
      }
    }
    // pulsing core
    const coreBig = (frame % 8) < 4;
    drawSpriteC(ctx, SPRITES[coreBig ? "flare" : "star_5"], st.cx, st.cy,
      coreBig ? "#FFFFFF" : pal.main[Math.floor(frame / 4) % n]);
  },
};

/* ============================================================
   ENGINE 21 — EYE CONTACT
   A field of eyeballs that all track one invisible wanderer.
   They blink on their own schedules. The void watches back.
   ============================================================ */
const eyeContact = {
  name: "EYE CONTACT",
  tag: "they blink · they follow · they know",
  init(rng, density) {
    const eyes = [];
    const cell = 34;
    for (let gy = 0; gy * cell < IH - 8; gy++)
      for (let gx = 0; gx * cell < IW - 8; gx++) {
        if (rng() > 0.42 * density + 0.3) continue;
        eyes.push({
          x: Math.round(gx * cell + 10 + rng() * (cell - 14)),
          y: Math.round(gy * cell + 10 + rng() * (cell - 14)),
          r: 4 + Math.floor(rng() * 3),
          phase: Math.floor(rng() * 24),
          blinkPeriod: 12 + Math.floor(rng() * 14),
          iris: Math.floor(rng() * 10),
        });
      }
    return { eyes };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    const t = frame / F;
    // the invisible wanderer every eyeball is watching
    const tx = 90 + Math.round(62 * Math.cos(2 * Math.PI * t));
    const ty = 160 + Math.round(118 * Math.sin(4 * Math.PI * t));
    for (const e of st.eyes) {
      const blinking = ((frame + e.phase) % e.blinkPeriod) < 2;
      const r = e.r;
      if (blinking) {
        // shut: dark lid + single lash line
        fillCirclePix(ctx, e.x, e.y, r, pal.bg[0]);
        ctx.fillStyle = pal.main[e.iris % n];
        for (let i = -r + 1; i <= r - 1; i++) ctx.fillRect(e.x + i, e.y, 1, 1);
        continue;
      }
      const dx = Math.max(-2, Math.min(2, Math.round((tx - e.x) / 26)));
      const dy = Math.max(-2, Math.min(2, Math.round((ty - e.y) / 26)));
      fillCirclePix(ctx, e.x, e.y, r, "#FFFFFF");                    // sclera
      fillCirclePix(ctx, e.x + dx, e.y + dy, Math.max(2, r - 2), pal.main[e.iris % n]); // iris
      fillCirclePix(ctx, e.x + dx, e.y + dy, Math.max(1, r - 4), "#111111");            // pupil
      ctx.fillStyle = "#FFFFFF";                                     // gloss
      ctx.fillRect(e.x + dx - 1, e.y + dy - 1, 1, 1);
    }
  },
};

/* ============================================================
   ENGINE 22 — PETRI DISH
   A pixel organism: coral-rule cellular automaton, precomputed
   at init, played ping-pong so the loop never snaps. Alive.
   ============================================================ */
const petriDish = {
  name: "PETRI DISH",
  tag: "cellular automaton · it's growing",
  init(rng, density) {
    const GW = 90, GH = 160, STEPS = 30;
    let grid = new Uint8Array(GW * GH);
    let age = new Uint8Array(GW * GH);
    // seed blobs
    const blobs = Math.round(12 * density) + 4;
    for (let b = 0; b < blobs; b++) {
      const bx = 6 + rng() * (GW - 12), by = 6 + rng() * (GH - 12), br = 2 + rng() * 3;
      for (let y = 0; y < GH; y++)
        for (let x = 0; x < GW; x++)
          if ((x - bx) * (x - bx) + (y - by) * (y - by) <= br * br && rng() < 0.7)
            grid[y * GW + x] = 1;
    }
    const states = [], ages = [];
    const next = new Uint8Array(GW * GH);
    const step = () => {
      for (let y = 0; y < GH; y++)
        for (let x = 0; x < GW; x++) {
          let nb = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              const xx = x + dx, yy = y + dy;
              if (xx >= 0 && xx < GW && yy >= 0 && yy < GH) nb += grid[yy * GW + xx];
            }
          const i = y * GW + x;
          // coral-ish: birth on 3, survive on 4-8 -> steady blobby growth
          next[i] = grid[i] ? (nb >= 4 ? 1 : 0) : (nb === 3 ? 1 : 0);
          age[i] = next[i] ? (grid[i] ? Math.min(250, age[i] + 1) : 0) : 0;
        }
      grid.set(next);
    };
    for (let w = 0; w < 8; w++) step(); // warmup: colonies established even at frame 0
    for (let s = 0; s < STEPS; s++) {
      states.push(grid.slice()); ages.push(age.slice());
      step();
    }
    return { states, ages, GW, GH };
  },
  draw(ctx, st, frame, F, pal) {
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, IW, IH);
    const n = pal.main.length;
    // ping-pong index so the last frame flows back into the first
    const m = st.states.length - 1, p = 2 * m;
    let idx = Math.round((frame / (F - 1)) * (p - 1));
    if (idx > m) idx = p - idx;
    const grid = st.states[idx], age = st.ages[idx];
    const GW = st.GW, GH = st.GH;
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++) {
        const i = y * GW + x;
        if (!grid[i]) continue;
        const a = age[i];
        let col;
        if (a === 0) col = "#FFFFFF";                    // newborn flash
        else if (a < 3) col = pal.main[(x + y) % n];
        else if (a < 8) col = pal.main[((x >> 2) + (y >> 2)) % n]; // lichen patches
        else col = ((x + y) % 2) ? pal.main[(y * 5 + 2) % n] : pal.bg[0]; // elders fossilize
        ctx.fillStyle = col;
        ctx.fillRect(x * 2, y * 2, 2, 2);
      }
  },
};

ENGINES.push(sigilRain, charmCascade, productBelt, wormholeTrip, eyeContact, petriDish);

/* ============================================================
   TEXT ENGINES, BATCH 2 — more blinkies (150x20), more stamps
   (88x31). Same old-web canon sizes, same pixel font.
   ============================================================ */

/* ---------- ENGINE 23 — BLINKIE · GLITTER (150x20) ---------- */
const blinkieGlitter = {
  name: "BLINKIE · GLITTER",
  tag: "150×20 · 2-frame glitter fill",
  dims: [150, 20],
  isText: true,
  init(rng, density) { return { salt: Math.floor(rng() * 1e6) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "SPARKLY AS FUCK").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // solid border, corners get star studs
    const bc = pal.main[Math.floor(frame / 2) % n];
    ctx.fillStyle = bc;
    for (let x = 0; x < W; x++) { ctx.fillRect(x, 0, 1, 1); ctx.fillRect(x, H - 1, 1, 1); }
    for (let y = 0; y < H; y++) { ctx.fillRect(0, y, 1, 1); ctx.fillRect(W - 1, y, 1, 1); }
    drawSpriteC(ctx, SPRITES.star_tiny, 4, 4, (frame % 2) ? "#FFFFFF" : bc);
    drawSpriteC(ctx, SPRITES.star_tiny, W - 4, H - 4, (frame % 2) ? bc : "#FFFFFF");
    // the glitter: every text pixel re-rolls its shine each frame
    const flip = (frame % 2) * 37;
    const glitterFor = (base) => (i, c, r) => {
      const h = hash2(st.salt + i * 91 + c * 7, r * 13 + flip);
      if (h < 0.16) return "#FFFFFF";                       // hot sparkle
      if (h < 0.55) return pal.main[(base + i) % n];        // base tone
      return pal.main[(base + i + 1) % n];                  // shadow tone
    };
    const tw = textWidth(text), innerW = W - 8;
    const base = Math.floor(frame / 2);
    const ty = Math.round((H - GLYPH_H * TEXT_SCALE) / 2);
    if (tw <= innerW) {
      drawText(ctx, text, Math.round((W - tw) / 2), ty, glitterFor(base));
    } else {
      const total = tw + innerW;
      const off = Math.floor((frame / F) * total);
      drawText(ctx, text, 4 + innerW - off, ty, glitterFor(base));
    }
  },
};

/* ---------- ENGINE 24 — BLINKIE · BOUNCE (150x20) ---------- */
const blinkieBounce = {
  name: "BLINKIE · BOUNCE",
  tag: "150×20 · letters hop + squash",
  dims: [150, 20],
  isText: true,
  init(rng, density) { return {}; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "WEIRD BITCH").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // sparse floor dust
    for (let x = 2; x < W - 2; x++)
      if (hash2(x, frame) < 0.06) {
        ctx.fillStyle = pal.main[x % n];
        ctx.fillRect(x, H - 3, 1, 1);
      }
    bevelBorder(ctx, W, H, pal.main[1 % n], pal.main[(Math.floor(frame / 2) + 2) % n]);
    const tw = textWidth(text), innerW = W - 6;
    const t = frame / F;
    const shift = Math.floor(frame / 2);
    const ty = Math.round((H - GLYPH_H * TEXT_SCALE) / 2);
    if (tw <= innerW) {
      const chars = visibleChars(text);
      let cx = Math.round((W - tw) / 2);
      for (let i = 0; i < chars.length; i++) {
        const g = glyphOf(chars[i]);
        const hop = Math.round(3 * Math.abs(Math.sin(2 * Math.PI * (t * 2 + i * 0.09))));
        const col = pal.main[(i + shift) % n];
        for (let r = 0; r < GLYPH_H; r++)
          for (let c = 0; c < g[r].length; c++)
            if (g[r][c] === "X") {
              ctx.fillStyle = col;
              ctx.fillRect(cx + c * TEXT_SCALE, ty - hop + r * TEXT_SCALE, TEXT_SCALE, TEXT_SCALE);
            }
        // squash shadow when the letter lands
        if (hop === 0) {
          ctx.fillStyle = pal.main[(i + shift + 2) % n];
          for (let c = 0; c < g[0].length; c++)
            ctx.fillRect(cx + c * TEXT_SCALE, ty + GLYPH_H * TEXT_SCALE + 1, TEXT_SCALE, TEXT_SCALE);
        }
        cx += (g[0].length + GLYPH_SP) * TEXT_SCALE;
      }
    } else {
      const total = tw + innerW;
      const off = Math.floor(t * total);
      drawText(ctx, text, 3 + innerW - off, ty, (i) => pal.main[(i + shift) % n]);
    }
  },
};

/* ---------- ENGINE 25 — STAMP · HAZARD (88x31) ---------- */
const stampHazard = {
  name: "STAMP · HAZARD",
  tag: "88×31 · warning tape · caution: vibes",
  dims: [88, 31],
  isText: true,
  init(rng, density) { return { hz: Math.floor(rng() * 10) }; },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "MAXIMALISM OR GTFO").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // scrolling diagonal hazard stripes, 2px tape top & bottom
    const hz = pal.main[st.hz % n];
    for (let y = 0; y < H; y++) {
      if (y >= 3 && y < H - 3) continue;
      for (let x = 0; x < W; x++) {
        const s = ((x + y + frame) % 6 + 6) % 6;
        ctx.fillStyle = s < 3 ? hz : pal.bg[0];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // side tape columns
    for (let y = 3; y < H - 3; y++)
      for (let x = 0; x < W; x++) {
        if (x >= 3 && x < W - 3) continue;
        const s = ((x + y + frame) % 6 + 6) % 6;
        ctx.fillStyle = s < 3 ? hz : pal.bg[0];
        ctx.fillRect(x, y, 1, 1);
      }
    // inner panel
    ctx.fillStyle = pal.bg[0];
    ctx.fillRect(4, 4, W - 8, H - 8);
    ctx.fillStyle = pal.main[(st.hz + 2) % n];
    for (let x = 4; x < W - 4; x++) { ctx.fillRect(x, 4, 1, 1); ctx.fillRect(x, H - 5, 1, 1); }
    for (let y = 4; y < H - 4; y++) { ctx.fillRect(4, y, 1, 1); ctx.fillRect(W - 5, y, 1, 1); }
    // text, outlined, 2 lines max
    const lines = wrapText(text, W - 14, 2) || [text];
    const totalH = lines.length * (GLYPH_H + 2) * TEXT_SCALE - 2;
    let ty = Math.round((H - totalH) / 2);
    const shift = Math.floor(frame / 2);
    for (const line of lines) {
      const lw = textWidth(line);
      drawTextOutlined(ctx, line, Math.round((W - lw) / 2), ty,
        (i) => pal.main[(i + shift + st.hz) % n], pal.bg[0]);
      ty += (GLYPH_H + 2) * TEXT_SCALE;
    }
  },
};

/* ---------- ENGINE 26 — STAMP · CERTIFIED (88x31) ---------- */
const stampCertified = {
  name: "STAMP · CERTIFIED",
  tag: "88×31 · official alien seal",
  dims: [88, 31],
  isText: true,
  init(rng, density) {
    return { ringC: Math.floor(rng() * 10), ufoBob: Math.floor(rng() * 2) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "NOT FROM HERE").toUpperCase();
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    // paper border + corner diamonds, flashing
    const flip = (frame % 4) < 2;
    bevelBorder(ctx, W, H, pal.main[flip ? 0 : 2 % n], pal.main[flip ? 2 % n : 0]);
    drawSpriteC(ctx, SPRITES.diamond, 3, 3, pal.main[1 % n]);
    drawSpriteC(ctx, SPRITES.diamond, W - 4, 3, pal.main[1 % n]);
    drawSpriteC(ctx, SPRITES.diamond, 3, H - 4, pal.main[1 % n]);
    drawSpriteC(ctx, SPRITES.diamond, W - 4, H - 4, pal.main[1 % n]);
    // seal: dashed ring + stepped-rotating star orbit (seamless: 10 positions)
    const cx = 16, cy = 15, RR = 12;
    ctx.fillStyle = pal.main[st.ringC % n];
    for (let a = 0; a < 64; a++) {
      const ang = (a / 64) * 2 * Math.PI;
      if ((a + frame) % 2) continue;
      const x = cx + Math.round(Math.cos(ang) * RR), y = cy + Math.round(Math.sin(ang) * RR);
      if (x > 1 && x < 31 && y > 1 && y < H - 2) ctx.fillRect(x, y, 1, 1);
    }
    const rotStep = Math.floor((frame / F) * 10);
    for (let k = 0; k < 10; k++) {
      const ang = ((k + rotStep) / 10) * 2 * Math.PI;
      const x = cx + Math.round(Math.cos(ang) * RR), y = cy + Math.round(Math.sin(ang) * RR);
      if (x > 1 && x < 31 && y > 1 && y < H - 2)
        drawSpriteC(ctx, SPRITES.star_tiny, x, y, pal.main[(k + st.ringC) % n]);
    }
    // bobbing ufo in the seal center
    const bob = ((frame + st.ufoBob) % 2);
    drawSpriteC(ctx, SPRITES.ufo, cx, cy - bob, (ch, c, r) =>
      (c + r + frame) % 7 === 0 ? "#FFFFFF" : pal.main[(st.ringC + 2) % n]);
    // text zone right of the seal
    const tx = 33, maxW = W - tx - 3;
    const lines = wrapText(text, maxW, 3);
    const shift = Math.floor(frame / 3);
    if (lines) {
      const totalH = lines.length * (GLYPH_H + 1) * TEXT_SCALE - 1;
      let ty = Math.round((H - totalH) / 2);
      for (const line of lines) {
        drawText(ctx, line, tx, ty, (i) => pal.main[(i + shift) % n]);
        ty += (GLYPH_H + 1) * TEXT_SCALE;
      }
    } else {
      const tw = textWidth(text);
      const off = Math.floor((frame / F) * (tw + maxW));
      drawText(ctx, text, tx + maxW - off, Math.round((H - GLYPH_H * TEXT_SCALE) / 2),
        (i) => pal.main[(i + shift) % n]);
    }
  },
};

/* ---------- ENGINE 27 — STAMP · POLAROID (88x31) ---------- */
const stampPolaroid = {
  name: "STAMP · POLAROID",
  tag: "88×31 · tiny vacation photo",
  dims: [88, 31],
  isText: true,
  init(rng, density) {
    const stars = [];
    for (let i = 0; i < Math.round(12 * density); i++)
      stars.push({
        x: 4 + Math.floor(rng() * 80),
        y: 3 + Math.floor(rng() * 17),
        phase: Math.floor(rng() * 6),
      });
    return { stars, moonC: Math.floor(rng() * 10) };
  },
  draw(ctx, st, frame, F, pal) {
    const W = IW, H = IH, n = pal.main.length;
    const text = (APP_OPTS.text || "EW I HATE IT HERE").toUpperCase();
    // the photo: night sky inside
    ctx.fillStyle = pal.bg[0]; ctx.fillRect(0, 0, W, H);
    for (const s of st.stars) {
      if (((frame + s.phase) % 3) === 0) continue;
      ctx.fillStyle = (s.phase + frame) % 5 === 0 ? "#FFFFFF" : pal.main[s.phase % n];
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // moon, cratered
    drawSprite(ctx, SPRITES.moon, W - 16, 3, (ch) =>
      ch === "X" ? pal.main[(st.moonC + n - 1) % n] : pal.main[st.moonC % n]);
    // ufo fly-by, fully exits right edge before the loop wraps
    const ux = -12 + Math.floor((frame / F) * (W + 24));
    drawSprite(ctx, SPRITES.ufo, ux, 8 + (frame % 2), pal.main[Math.floor(frame / 2) % n]);
    // ground dither strip
    ditherRect(ctx, 0, 21, W, 2, pal.bg[0], pal.main[st.moonC % n], 0.35);
    // the white frame + fat bottom strip — polaroid law
    ctx.fillStyle = "#FFFFFF";
    for (let x = 0; x < W; x++) { ctx.fillRect(x, 0, 1, 1); ctx.fillRect(x, 1, 1, 1); }
    for (let y = 0; y < H; y++) { ctx.fillRect(0, y, 1, 1); ctx.fillRect(1, y, 1, 1); ctx.fillRect(W - 1, y, 1, 1); ctx.fillRect(W - 2, y, 1, 1); }
    ctx.fillRect(0, H - 8, W, 8);
    // caption scrolling on the bottom strip
    const tw = textWidth(text), capW = W - 6;
    const shift = Math.floor(frame / 2);
    const capY = H - 2 - GLYPH_H * TEXT_SCALE; // caption hugs the bottom strip
    if (tw <= capW) {
      drawText(ctx, text, Math.round((W - tw) / 2), capY, (i) => pal.main[(i + shift) % n]);
    } else {
      const off = Math.floor((frame / F) * (tw + capW));
      drawText(ctx, text, 3 + capW - off, capY, (i) => pal.main[(i + shift) % n]);
    }
  },
};

ENGINES.push(blinkieGlitter, blinkieBounce, stampHazard, stampCertified, stampPolaroid);

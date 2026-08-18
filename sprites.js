/* ============================================================
   PIXEL SPRITE LIBRARY — chunky bitmaps, char-mapped to palette
   Each sprite: array of strings. '.' = transparent.
   Any other char = index into the color map passed at draw time.
   ============================================================ */

const SPRITES = {

  star_tiny: [
    ".X.",
    "XXX",
    ".X.",
  ],

  star_4: [
    "..X..",
    "..X..",
    "XXXXX",
    "..X..",
    "..X..",
  ],

  star_5: [
    "...X...",
    "...XX..",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    ".XX.XX.",
    "XX...XX",
  ],

  sparkle: [
    "...X...",
    "...X...",
    "..XXX..",
    "XXXXXXX",
    "..XXX..",
    "...X...",
    "...X...",
  ],

  flare: [
    "......X......",
    "......X......",
    "......X......",
    "..X..XXX..X..",
    "......X......",
    "XXXXXXXXXXXXX",
    "......X......",
    "..X..XXX..X..",
    "......X......",
    "......X......",
    "......X......",
  ],

  heart: [
    ".XX...XX.",
    "XXXX.XXXX",
    "XXXXXXXXX",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
    "....X....",
  ],

  heart_outline: [
    ".XX...XX.",
    "X..X.X..X",
    "X....X..X",
    "X.......X",
    ".X.....X.",
    "..X...X..",
    "...X.X...",
    "....X....",
  ],

  moon: [
    "..XXXX...",
    ".XXXXXX..",
    "XXXX..X..",
    "XXX...X..",
    "XXX...X..",
    "XXXX..X..",
    ".XXXXXX..",
    "..XXXX...",
  ],

  moon_outline: [
    "..XXXX...",
    ".XX..XX..",
    "XX....X..",
    "X......X.",
    "X......X.",
    "XX....X..",
    ".XX..XX..",
    "..XXXX...",
  ],

  skull: [
    ".XXXXX.",
    "XXXXXXX",
    "XX.X.XX",
    "XXXXXXX",
    ".XXXXX.",
    ".X.X.X.",
  ],

  eye: [
    "..XXXXX..",
    ".XX...XX.",
    "XX.XXX.XX",
    "XX.XXX.XX",
    ".XX...XX.",
    "..XXXXX..",
  ],

  eye_outline: [
    "..XXXXX..",
    ".X.....X.",
    "X..XXX..X",
    "X..XXX..X",
    ".X.....X.",
    "..XXXXX..",
  ],

  sigil_1: [ // alien glyph
    "X..X..X",
    ".X.X.X.",
    "X..X..X",
    "..XXX..",
    "X..X..X",
    ".X.X.X.",
    "X..X..X",
  ],

  sigil_2: [ // portal ring
    "..XXX..",
    ".X...X.",
    "X..X..X",
    "X.XXX.X",
    "X..X..X",
    ".X...X.",
    "..XXX..",
  ],

  ufo: [
    "....XXX....",
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    "XX.X.X.X.XX",
    ".XXXXXXXXX.",
    "...X...X...",
    "..X.....X..",
  ],

  mushroom: [
    "..XXXXX..",
    ".XXXXXXX.",
    "XX.X.X.XX",
    "XXXXXXXXX",
    "...XXX...",
    "...XXX...",
    "...XXX...",
    "..XXXXX..",
  ],

  cloud: [
    "....XXXX......",
    "..XXXXXXXX....",
    ".XXXXXXXXXX...",
    "XXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXX",
  ],

  drop: [
    "..X..",
    ".XXX.",
    "XXXXX",
    "XXXXX",
    ".XXX.",
  ],

  diamond: [
    "...X...",
    "..XXX..",
    ".XXXXX.",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    "...X...",
  ],

  wand: [
    "XX.......",
    "XXXX.....",
    ".XXXXX...",
    "...XXXX..",
    "....XXXX.",
    ".....XXXX",
    "......XXX",
    ".......XX",
  ],
};

/* Draw a sprite. x,y = top-left in internal pixels.
   colorFor: (char) => color string, or single color string. */
function drawSprite(ctx, sprite, x, y, colorFor) {
  x = Math.round(x); y = Math.round(y);
  for (let r = 0; r < sprite.length; r++) {
    const row = sprite[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      ctx.fillStyle = typeof colorFor === 'function' ? colorFor(ch, c, r) : colorFor;
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
}

/* Draw sprite centered at cx,cy */
function drawSpriteC(ctx, sprite, cx, cy, colorFor) {
  const w = sprite[0].length, h = sprite.length;
  drawSprite(ctx, sprite, cx - (w >> 1), cy - (h >> 1), colorFor);
}

/* Draw sprite at integer pixel scale s (s=2 => each pixel is 2x2) */
function drawSpriteS(ctx, sprite, x, y, colorFor, s) {
  x = Math.round(x); y = Math.round(y);
  for (let r = 0; r < sprite.length; r++) {
    const row = sprite[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      ctx.fillStyle = typeof colorFor === 'function' ? colorFor(ch, c, r) : colorFor;
      ctx.fillRect(x + c * s, y + r * s, s, s);
    }
  }
}
function drawSpriteCS(ctx, sprite, cx, cy, colorFor, s) {
  drawSpriteS(ctx, sprite, cx - (sprite[0].length * s >> 1), cy - (sprite.length * s >> 1), colorFor, s);
}

function spriteW(s){ return s[0].length; }
function spriteH(s){ return s.length; }

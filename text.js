/* ============================================================
   PIXEL FONT — hand-authored bitmap glyphs, 5px tall,
   variable width. Uppercase only, the way GeoCities intended.
   ============================================================ */

const FONT = {
  A: [".X.","X.X","XXX","X.X","X.X"],
  B: ["XX.","X.X","XX.","X.X","XX."],
  C: [".XX","X..","X..","X..",".XX"],
  D: ["XX.","X.X","X.X","X.X","XX."],
  E: ["XXX","X..","XX.","X..","XXX"],
  F: ["XXX","X..","XX.","X..","X.."],
  G: [".XX","X..","X.X","X.X",".XX"],
  H: ["X.X","X.X","XXX","X.X","X.X"],
  I: ["XXX",".X.",".X.",".X.","XXX"],
  J: ["..X","..X","..X","X.X",".X."],
  K: ["X.X","X.X","XX.","X.X","X.X"],
  L: ["X..","X..","X..","X..","XXX"],
  M: ["X...X","XX.XX","X.X.X","X...X","X...X"],
  N: ["X..X","XX.X","X.XX","X..X","X..X"],
  O: [".X.","X.X","X.X","X.X",".X."],
  P: ["XX.","X.X","XX.","X..","X.."],
  Q: [".XX.","X..X","X..X","X.XX",".XXX"],
  R: ["XX.","X.X","XX.","X.X","X.X"],
  S: [".XX","X..",".X.","..X","XX."],
  T: ["XXX",".X.",".X.",".X.",".X."],
  U: ["X.X","X.X","X.X","X.X","XXX"],
  V: ["X.X","X.X","X.X","X.X",".X."],
  W: ["X...X","X...X","X.X.X","XX.XX","X...X"],
  X: ["X.X","X.X",".X.","X.X","X.X"],
  Y: ["X.X","X.X",".X.",".X.",".X."],
  Z: ["XXX","..X",".X.","X..","XXX"],
  "0": ["XXX","X.X","X.X","X.X","XXX"],
  "1": [".X.","XX.",".X.",".X.","XXX"],
  "2": ["XX.","..X",".X.","X..","XXX"],
  "3": ["XX.","..X",".X.","..X","XX."],
  "4": ["X.X","X.X","XXX","..X","..X"],
  "5": ["XXX","X..","XX.","..X","XX."],
  "6": [".XX","X..","XX.","X.X",".X."],
  "7": ["XXX","..X",".X.",".X.",".X."],
  "8": [".X.","X.X",".X.","X.X",".X."],
  "9": [".X.","X.X",".XX","..X","XX."],
  "'": ["X","X",".",".","."],
  "!": ["X","X","X",".","X"],
  "?": ["XX.","..X",".X.","...",".X."],
  ".": [".",".",".",".","X"],
  ",": ["..","..","..",".X","X."],
  "-": ["...","...","XXX","...","..."],
  "&": [".X.","X.X",".X.","X.X",".XX"],
  " ": ["..","..","..","..",".."],
};

const GLYPH_H = 5, GLYPH_SP = 1;

function glyphOf(ch) {
  return FONT[ch.toUpperCase()] || FONT["?"];
}
function textWidth(str) {
  if (!str.length) return 0;
  let w = 0;
  for (const ch of str) w += glyphOf(ch)[0].length + GLYPH_SP;
  return w - GLYPH_SP;
}
/* colorFor: (charIndex, glyphCol, glyphRow) => color, or single color */
function drawText(ctx, str, x, y, colorFor) {
  let cx = Math.round(x);
  for (let i = 0; i < str.length; i++) {
    const g = glyphOf(str[i]);
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] !== "X") continue;
        ctx.fillStyle = typeof colorFor === "function" ? colorFor(i, c, r) : colorFor;
        ctx.fillRect(cx + c, Math.round(y) + r, 1, 1);
      }
    cx += g[0].length + GLYPH_SP;
  }
}
/* outlined text: 4-direction contrast outline + fill (readable over busy bg) */
function drawTextOutlined(ctx, str, x, y, fill, outline) {
  drawText(ctx, str, x - 1, y, outline);
  drawText(ctx, str, x + 1, y, outline);
  drawText(ctx, str, x, y - 1, outline);
  drawText(ctx, str, x, y + 1, outline);
  drawText(ctx, str, x, y, fill);
}
/* word-wrap to lines fitting maxW, up to maxLines; returns null if overflow */
function wrapText(str, maxW, maxLines) {
  const words = str.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial) <= maxW) cur = trial;
    else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) return null;
    }
  }
  if (cur) lines.push(cur);
  return lines.length <= maxLines ? lines : null;
}

const SAYINGS = [
  "I'M JUST A WEIRD LITTLE VIBRATION WEARING MEAT HERE",
  "BEING IN MEAT IS GROSS",
  "EW I HATE IT HERE",
  "MAXIMALISM OR GTFO",
  "SPARKLY AS FUCK",
  "I WANT ALL THE COLORS",
  "NOT FROM HERE",
  "HOW DO YOU LIKE MY MEAT SUIT TODAY?",
  "WEIRD BITCH",
];

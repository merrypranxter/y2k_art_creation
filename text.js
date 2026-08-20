/* ============================================================
   PIXEL FONT — hand-authored bitmap glyphs, 5px tall,
   variable width. Uppercase only, the way GeoCities intended.
   v2: symbols, pixel emoji, and TEXT_SCALE for big type energy.
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
  ":": [".","X",".","X","."],
  ";": ["..",".X","..",".X","X."],
  "?": ["XX.","..X",".X.","...",".X."],
  ".": [".",".",".",".","X"],
  ",": ["..","..","..",".X","X."],
  "-": ["...","...","XXX","...","..."],
  "&": [".X.","X.X",".X.","X.X",".XX"],
  '"': ["X.X","X.X","...","...","..."],
  "~": ["....","..X.",".X.X","X...","...."],
  "#": [".X.X.","XXXXX",".X.X.","XXXXX",".X.X."],
  "+": ["...",".X.","XXX",".X.","..."],
  "*": ["X.X",".X.","XXX",".X.","X.X"],
  "%": ["XX..X","XX.X.","..X..",".X.XX","X..XX"],
  "{": [".XX",".X.","XX.",".X.",".XX"],
  "}": ["XX.",".X.",".XX",".X.","XX."],
  "$": [".XXX.","X.X..",".XXX.","..X.X","XXX.X"],
  "@": [".XXX.","X...X","X.XXX","X.XX.",".XXX."],
  "(": [".X","X.","X.","X.",".X"],
  ")": ["X.",".X",".X",".X","X."],
  "/": ["..X","..X",".X.","X..","X.."],
  "\\": ["X..","X..",".X.","..X","..X"],
  "|": ["X","X","X","X","X"],
  "_": ["...","...","...","...","XXX"],
  "=": ["...","XXX","...","XXX","..."],
  "<": ["..X",".X.","X..",".X.","..X"],
  ">": ["X..",".X.","..X",".X.","X.."],
  "^": [".X.","X.X","...","...","..."],
  " ": ["..","..","..","..",".."],
  /* ---- pixel emoji (5x5, palette-colored unless text says otherwise) ---- */
  "💩": ["..X..",".XXX.","XXXXX","XXXXX",".X.X."],
  "👽": [".XXX.","X.X.X","XXXXX",".XXX.","..X.."],
  "🎤": ["XXX","XXX",".X.",".X.",".X."],
  "💋": [".....","XX.XX","XXXXX",".XXX.","..X.."],
  "🛸": ["..X..",".XXX.","XXXXX","X.X.X","....."],
  "🫠": [".XXX.","X.X.X","XXXXX",".XXXX","X..X."],
  "🔥": ["..X..",".XXX.","XXXXX","XXXXX",".XXX."],
  "🖕": ["..X..","..X..",".XXX.","XXXXX",".XXX."],
};
/* aliases — many emoji, one hand-drawn heart / note */
const HEART = [".X.X.","XXXXX","XXXXX",".XXX.","..X.."];
for (const k of ["💜","❤","♥","💗","💖","💚","💛","💙","🧡","🖤","🤍","💕"]) FONT[k] = HEART;
const NOTE = [".XX",".X.",".X.","XX.","XX."];
for (const k of ["🎶","🎵","♪","♫"]) FONT[k] = NOTE;

const GLYPH_H = 5, GLYPH_SP = 1;

/* global text scale — app.js sets this before each engine draw.
   1 = classic 5px, 2/3/4 = increasingly big type energy. */
var TEXT_SCALE = 1;

/* emoji-safe char list: code-point iteration, strip variation
   selectors, zero-width joiners, and skin-tone modifiers */
function visibleChars(str) {
  const out = [];
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    if (cp === 0xFE0F || cp === 0x200D || (cp >= 0x1F3FB && cp <= 0x1F3FF)) continue;
    out.push(ch);
  }
  return out;
}

function glyphOf(ch) {
  return FONT[ch] || FONT[ch.toUpperCase()] || FONT["?"];
}
function textWidth(str, scale) {
  const s = scale || TEXT_SCALE;
  const chars = visibleChars(str);
  if (!chars.length) return 0;
  let w = 0;
  for (const ch of chars) w += glyphOf(ch)[0].length + GLYPH_SP;
  return (w - GLYPH_SP) * s;
}
/* colorFor: (charIndex, glyphCol, glyphRow) => color, or single color */
function drawText(ctx, str, x, y, colorFor, scale) {
  const s = scale || TEXT_SCALE;
  const chars = visibleChars(str);
  let cx = Math.round(x);
  const yy = Math.round(y);
  for (let i = 0; i < chars.length; i++) {
    const g = glyphOf(chars[i]);
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] !== "X") continue;
        ctx.fillStyle = typeof colorFor === "function" ? colorFor(i, c, r) : colorFor;
        ctx.fillRect(cx + c * s, yy + r * s, s, s);
      }
    cx += (g[0].length + GLYPH_SP) * s;
  }
}
/* outlined text: 4-direction contrast outline + fill (readable over busy bg) */
function drawTextOutlined(ctx, str, x, y, fill, outline, scale) {
  const s = scale || TEXT_SCALE;
  drawText(ctx, str, x - 1, y, outline, s);
  drawText(ctx, str, x + 1, y, outline, s);
  drawText(ctx, str, x, y - 1, outline, s);
  drawText(ctx, str, x, y + 1, outline, s);
  drawText(ctx, str, x, y, fill, s);
}
/* word-wrap to lines fitting maxW, up to maxLines; returns null if overflow */
function wrapText(str, maxW, maxLines, scale) {
  const words = String(str).split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxW) cur = trial;
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
  "MY BFF IS A 4D TESSERACT",
  "BEING IN THE STUFFNESS IS STUPID LOL",
  "SOMEONE GET ME OFF THIS ROCK!",
  "I'M JUST MATH WEARING A MEATSUIT, BABY",
  "JUST HERE TO BE WEIRD",
  "I'D RATHER BE TRIPPING BALLS",
  "FUCK ALL THIS NOISE",
  "VIBE THIS SHIT UP ASSHOLES!",
  "ALL U RAGGEDY ASS H0S GET UR ASS OUT!",
  "WARNING: THIS BITCH GIVES 0 FUCKS",
  "MAY CAUSE DISCOLORATION OF URINE & FECES",
];

/* ============================================================
   APP — preview loop + palette editing + GIF export.
   Animation is strictly frame-based: the engine only ever sees
   integer frame indices, so exports match the preview exactly.
   ============================================================ */

const SCALE = 3;                 // preview scale
const view = document.getElementById("view");
const vctx = view.getContext("2d");
vctx.imageSmoothingEnabled = false;

// internal pixel canvas (never shown directly)
const icv = document.createElement("canvas");
icv.width = IW; icv.height = IH;
const ictx = icv.getContext("2d", { willReadFrequently: true });
ictx.imageSmoothingEnabled = false;

const state = {
  engineIdx: 0,
  palette: JSON.parse(JSON.stringify(PALETTES[0])),
  fps: 6,
  density: 1,
  seed: 1337,
  frame: 0,
  engineState: null,
  transparent: false,
};

/* ---------- transparency (1-bit, GIF-authentic) ---------- */
const CHROMA = "#000000"; // pixels of this exact color become see-thru
const kcv = document.createElement("canvas"); // keyed canvas
kcv.width = IW; kcv.height = IH;
const kctx = kcv.getContext("2d", { willReadFrequently: true });
const checker = (() => {
  const c = document.createElement("canvas");
  c.width = 12; c.height = 12;
  const x = c.getContext("2d");
  x.fillStyle = "#1A1030"; x.fillRect(0, 0, 12, 12);
  x.fillStyle = "#241544"; x.fillRect(0, 0, 6, 6); x.fillRect(6, 6, 6, 6);
  return vctx.createPattern(c, "repeat");
})();
function effectivePalette() {
  if (!state.transparent) return state.palette;
  return { bg: [CHROMA], main: state.palette.main };
}

/* ---------- global engine options (text engines read this) ---------- */
const APP_OPTS = { text: SAYINGS[0] };

/* ---------- format switching (backgrounds vs blinkies/stamps) ---------- */
function applyFormat() {
  const eng = ENGINES[state.engineIdx];
  const dims = eng.dims || [180, 320];
  IW = dims[0]; IH = dims[1];
  icv.width = IW; icv.height = IH;
  ictx.imageSmoothingEnabled = false;
  kcv.width = IW; kcv.height = IH;
  const scale = IH > 100 ? 3 : Math.max(3, Math.floor(Math.min(560 / IW, 200 / IH)));
  view.width = IW * scale; view.height = IH * scale;
  vctx.imageSmoothingEnabled = false;
  // export size options = integer multipliers
  const sel = document.getElementById("expScale");
  const cur = sel.value;
  sel.innerHTML = "";
  [2, 3, 4, 6].forEach(s => {
    const o = document.createElement("option");
    o.value = s; o.textContent = `${IW * s}×${IH * s}`;
    sel.appendChild(o);
  });
  sel.value = [...sel.options].some(o => o.value === cur) ? cur : "3";
  // text controls only for text engines
  document.getElementById("textSect").style.display = eng.isText ? "" : "none";
  document.getElementById("hud").textContent =
    `${IW}×${IH} INTERNAL · ×${scale} NEAREST-NEIGHBOR · 0 ANTI-ALIASING · CHECKERBOARD = SEE-THRU · ∞ VIBES`;
}

/* ---------- engine lifecycle ---------- */
function reinitEngine() {
  const rng = mulberry32(state.seed);
  state.engineState = ENGINES[state.engineIdx].init(rng, state.density);
  state.frame = 0;
}
function renderFrame(frame, F) {
  ENGINES[state.engineIdx].draw(ictx, state.engineState, frame, F, effectivePalette());
}
function blitPreview() {
  vctx.clearRect(0, 0, view.width, view.height);
  if (!state.transparent) {
    vctx.drawImage(icv, 0, 0, view.width, view.height);
    return;
  }
  // key out chroma pixels -> real alpha, over checkerboard
  const img = ictx.getImageData(0, 0, IW, IH);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4)
    if (d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 0) d[i + 3] = 0;
  kctx.putImageData(img, 0, 0);
  vctx.fillStyle = checker;
  vctx.fillRect(0, 0, view.width, view.height);
  vctx.drawImage(kcv, 0, 0, view.width, view.height);
}

/* ---------- preview loop ---------- */
let lastStep = 0;
function loop(ts) {
  const stepMs = 1000 / state.fps;
  if (ts - lastStep >= stepMs) {
    lastStep = ts - ((ts - lastStep) % stepMs);
    state.frame = (state.frame + 1) % 16; // preview loops at 16 frames
    renderFrame(state.frame, 16);
    blitPreview();
  }
  requestAnimationFrame(loop);
}

/* ---------- UI: engines ---------- */
const enginesEl = document.getElementById("engines");
ENGINES.forEach((e, i) => {
  const b = document.createElement("button");
  b.className = "eng-btn" + (i === 0 ? " active" : "");
  b.textContent = e.name;
  b.onclick = () => {
    state.engineIdx = i;
    document.querySelectorAll(".eng-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    document.getElementById("engTag").textContent = "» " + e.tag;
    applyFormat();
    reinitEngine();
  };
  enginesEl.appendChild(b);
});
document.getElementById("engTag").textContent = "» " + ENGINES[0].tag;

/* ---------- UI: palettes ---------- */
const palSel = document.getElementById("paletteSel");
PALETTES.forEach((p, i) => {
  const o = document.createElement("option");
  o.value = i; o.textContent = p.name;
  palSel.appendChild(o);
});
palSel.onchange = () => {
  state.palette = JSON.parse(JSON.stringify(PALETTES[+palSel.value]));
  renderSwatches();
};

function renderSwatches() {
  const el = document.getElementById("swatches");
  el.innerHTML = "";
  const mk = (color, isBg, idx) => {
    const d = document.createElement("div");
    d.className = "sw" + (isBg ? " bg-sw" : "");
    d.style.background = color;
    d.title = (isBg ? "BG " : "") + color;
    const inp = document.createElement("input");
    inp.type = "color"; inp.value = color;
    inp.oninput = () => {
      d.style.background = inp.value; d.title = inp.value;
      if (isBg) state.palette.bg[idx] = inp.value;
      else state.palette.main[idx] = inp.value;
    };
    d.ondblclick = () => { // double-click removes a main color (keep >=2)
      if (!isBg && state.palette.main.length > 2) {
        state.palette.main.splice(idx, 1); renderSwatches();
      }
    };
    d.appendChild(inp);
    el.appendChild(d);
  };
  mk(state.palette.bg[0], true, 0);
  state.palette.main.forEach((c, i) => mk(c, false, i));
  const add = document.createElement("button");
  add.id = "addColor"; add.textContent = "+";
  add.title = "add color";
  add.onclick = () => {
    state.palette.main.push("#FF00E5");
    renderSwatches();
  };
  el.appendChild(add);
}
renderSwatches();

/* ---------- UI: motion ---------- */
const fpsEl = document.getElementById("fps"), densEl = document.getElementById("density");
const updLabels = () => {
  document.getElementById("fpsVal").textContent = state.fps + " fps";
  document.getElementById("densVal").textContent = "×" + state.density.toFixed(1);
};
fpsEl.oninput = () => { state.fps = +fpsEl.value; updLabels(); };
densEl.oninput = () => { state.density = +densEl.value; updLabels(); reinitEngine(); };
document.getElementById("shuffle").onclick = () => {
  state.seed = Math.floor(Math.random() * 1e9);
  reinitEngine();
};
document.getElementById("transparent").onchange = (e) => {
  state.transparent = e.target.checked;
};
updLabels();

/* ---------- UI: text (blinkies & stamps) ---------- */
const sayingSel = document.getElementById("sayingSel");
SAYINGS.forEach(s => {
  const o = document.createElement("option");
  o.value = s; o.textContent = s;
  sayingSel.appendChild(o);
});
const customO = document.createElement("option");
customO.value = "__custom"; customO.textContent = "✎ CUSTOM TEXT…";
sayingSel.appendChild(customO);
const customInp = document.getElementById("customText");
sayingSel.onchange = () => {
  const custom = sayingSel.value === "__custom";
  customInp.style.display = custom ? "" : "none";
  APP_OPTS.text = custom ? customInp.value : sayingSel.value;
  reinitEngine();
};
customInp.oninput = () => { APP_OPTS.text = customInp.value; reinitEngine(); };
APP_OPTS.text = sayingSel.value;

/* ---------- GIF export ---------- */
const prog = document.getElementById("prog");
document.getElementById("export").onclick = async () => {
  const scale = +document.getElementById("expScale").value;
  const F = +document.getElementById("expFrames").value;
  const W = IW * scale, H = IH * scale;
  const btn = document.getElementById("export");
  btn.disabled = true; prog.textContent = "rendering frames…";

  const ecv = document.createElement("canvas");
  ecv.width = W; ecv.height = H;
  const ectx = ecv.getContext("2d");
  ectx.imageSmoothingEnabled = false;

  // web workers can't load a same-dir script when the page is opened via
  // file:// — so the worker ships gzipped+base64'd inside the page and we
  // spawn it from a blob URL. works over http(s) too, so prefer it always.
  let workerScript = "vendor/gif.worker.js";
  if (typeof GIF_WORKER_B64 !== "undefined" && typeof DecompressionStream !== "undefined") {
    const bin = atob(GIF_WORKER_B64);
    const gz = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) gz[i] = bin.charCodeAt(i);
    const plain = await new Response(
      new Blob([gz]).stream().pipeThrough(new DecompressionStream("gzip"))
    ).arrayBuffer();
    workerScript = URL.createObjectURL(new Blob([plain], { type: "application/javascript" }));
  }
  const gif = new GIF({
    workers: 2,
    quality: 1,             // pixel art deserves max quality
    width: W, height: H,
    workerScript,
    dither: false,          // we do our own dithering, thank you
    transparent: state.transparent ? 0x000000 : null,
  });

  const delay = Math.round(1000 / state.fps);
  for (let f = 0; f < F; f++) {
    renderFrame(f, F);
    ectx.clearRect(0, 0, W, H);
    ectx.drawImage(icv, 0, 0, W, H);
    // dispose:2 restores to transparent bg between frames — no ghost trails
    gif.addFrame(ectx, { copy: true, delay, dispose: state.transparent ? 2 : -1 });
  }

  gif.on("progress", p => {
    prog.textContent = "encoding GIF… " + Math.round(p * 100) + "%";
  });
  gif.on("finished", blob => {
    const name = `astral-trash_${ENGINES[state.engineIdx].name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${W}x${H}${state.transparent ? "_seethru" : ""}.gif`;
    if (state.lastGifUrl) URL.revokeObjectURL(state.lastGifUrl);
    const url = URL.createObjectURL(blob);
    state.lastGifUrl = url;
    // desktop: auto-download
    const a = document.createElement("a");
    a.href = url; a.download = name;
    a.click();
    // phone: show the gif in-page so long-press save works
    document.getElementById("resultImg").src = url;
    const dl = document.getElementById("dlLink");
    dl.href = url; dl.download = name;
    document.getElementById("openLink").href = url;
    document.getElementById("result").style.display = "";
    prog.textContent = "✔ done — gif is below ↓";
    btn.disabled = false;
  });
  gif.render();
};

/* ---------- go ---------- */
// deep-link: #engine=N selects engine N (0..7), #pal=N palette, #frame=N freeze frame
const hash = new URLSearchParams(location.hash.slice(1));
if (hash.has("pal")) {
  palSel.value = hash.get("pal");
  state.palette = JSON.parse(JSON.stringify(PALETTES[+palSel.value] || 0));
  renderSwatches();
}
if (hash.has("engine")) {
  const i = Math.min(ENGINES.length - 1, Math.max(0, +hash.get("engine") || 0));
  state.engineIdx = i;
  document.querySelectorAll(".eng-btn").forEach((x, j) => x.classList.toggle("active", j === i));
  document.getElementById("engTag").textContent = "» " + ENGINES[i].tag;
}
applyFormat();
if (hash.has("say")) {
  const si = Math.min(SAYINGS.length - 1, Math.max(0, +hash.get("say") || 0));
  sayingSel.value = SAYINGS[si];
  APP_OPTS.text = SAYINGS[si];
}
if (hash.has("text")) {
  sayingSel.value = "__custom";
  customInp.style.display = "";
  customInp.value = hash.get("text");
  APP_OPTS.text = hash.get("text");
}
if (hash.has("trans")) {
  state.transparent = true;
  const cb = document.getElementById("transparent");
  if (cb) cb.checked = true;
}
reinitEngine();
if (hash.has("frame")) {
  renderFrame(+hash.get("frame"), 16);
  blitPreview();
} else {
  requestAnimationFrame(loop);
}

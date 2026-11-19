// Vice Sunset — the editor.
//
// Owns the app state, loads the photos, wires every control to the
// cover engine in cover.js, and renders the live preview. Photos are
// read on this machine only; nothing is ever uploaded anywhere.

import {
  SIZES,
  LAYOUTS,
  PHOTO_KEYS,
  PHOTO_LABELS,
  makeDrawnSunset,
  panelAt,
  renderCover,
  renderExport,
  canvasPngBlob,
} from './cover.js';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');

const PREVIEW_W = { square: 720, portrait: 600, wide: 960 };

const state = {
  layout: 'collage',
  size: 'wide',
  title: 'VICE SUNSET',
  subtitle: 'A NIGHT IN LEONIDA',
  titleTheme: 'sunset',
  halftone: true,
  selected: 0,
  panels: [],
  photos: {},
};

const DEFAULT_PANEL = (i) => ({
  photo: ['s1', 's2', 'drawn', 's1', 's2'][i % 5],
  zoom: 1,
  ox: 0,
  oy: 0,
  grade: 'sunset',
});

function panelsFor(layout) {
  const n = LAYOUTS[layout].panels;
  const next = [];
  for (let i = 0; i < n; i++) {
    next.push(state.panels[i] ? { ...state.panels[i] } : DEFAULT_PANEL(i));
  }
  return next;
}

state.panels = panelsFor('collage');

let renderQueued = false;
function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function previewDims() {
  const size = SIZES[state.size];
  const w = PREVIEW_W[state.size];
  return { w, h: Math.round((w * size.h) / size.w) };
}

function renderPreview() {
  if (document.body.classList.contains('cover-mode')) {
    renderCoverView();
    return;
  }
  const d = previewDims();
  renderCover(canvas, state, d.w, d.h);
  $('frameTag').textContent =
    `${SIZES[state.size].label} · ${LAYOUTS[state.layout].name} · ` +
    `panel ${state.selected + 1} of ${state.panels.length}`;
}

function renderCoverView() {
  const vw = Math.min(window.innerWidth, 1920);
  const vh = Math.min(window.innerHeight, 1080);
  const size = SIZES[state.size];
  // Fit the poster's aspect inside the viewport, letterboxed.
  const scale = Math.min(vw / size.w, vh / size.h);
  const w = Math.round(size.w * scale);
  const h = Math.round(size.h * scale);
  renderCover(canvas, state, w, h);
}

// ---------- photos ----------

function notePhoto(key, img) {
  state.photos[key] = img;
  refreshChips();
  queueRender();
}

function loadSample(key, src) {
  const img = new Image();
  img.onload = () => notePhoto(key, img);
  img.onerror = () => notePhoto(key, null);
  img.src = src;
}

loadSample('s1', './samples/boulevard.jpg');
loadSample('s2', './samples/pier.jpg');
notePhoto('drawn', makeDrawnSunset(1080, 720));

function bindUpload(inputId, thumbId, key) {
  const input = $(inputId);
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        notePhoto(key, img);
        const thumb = $(thumbId);
        thumb.textContent = '';
        const t = document.createElement('img');
        t.src = reader.result;
        t.alt = '';
        thumb.appendChild(t);
        toast(`${PHOTO_LABELS[key]} loaded`);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

bindUpload('upA', 'thumbA', 'A');
bindUpload('upB', 'thumbB', 'B');
bindUpload('upC', 'thumbC', 'C');

// ---------- photo chips ----------

function refreshChips() {
  const box = $('photoChips');
  box.textContent = '';
  for (const key of PHOTO_KEYS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-btn';
    b.textContent = PHOTO_LABELS[key];
    b.disabled = !state.photos[key];
    const panel = state.panels[state.selected];
    if (panel && panel.photo === key) b.classList.add('is-on');
    b.addEventListener('click', () => {
      state.panels[state.selected].photo = key;
      refreshChips();
      queueRender();
    });
    box.appendChild(b);
  }
}

// ---------- layout ----------

document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    state.layout = radio.value;
    state.panels = panelsFor(state.layout);
    state.selected = 0;
    syncPanelControls();
    refreshChips();
    queueRender();
  });
});

// ---------- caption ----------

$('capTitle').addEventListener('input', (e) => {
  state.title = e.target.value;
  queueRender();
});
$('capSub').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  queueRender();
});
$('capTheme').addEventListener('change', (e) => {
  state.titleTheme = e.target.value;
  queueRender();
});
$('capHalftone').addEventListener('change', (e) => {
  state.halftone = e.target.checked;
  queueRender();
});

// ---------- selected panel ----------

function syncPanelControls() {
  const panel = state.panels[state.selected];
  $('panelHeading').textContent =
    `Selected panel ${state.selected + 1} of ${state.panels.length}`;
  $('panelZoom').value = String(panel.zoom);
  $('zoomOut').textContent = `${panel.zoom.toFixed(2)}×`;
  document.querySelectorAll('#gradeBtns .chip-btn').forEach((b) => {
    b.classList.toggle('is-on', b.dataset.grade === panel.grade);
  });
  refreshChips();
}

function selectPanel(i) {
  state.selected = Math.max(0, Math.min(state.panels.length - 1, i));
  syncPanelControls();
  queueRender();
}

document.querySelectorAll('#gradeBtns .chip-btn').forEach((b) => {
  b.addEventListener('click', () => {
    state.panels[state.selected].grade = b.dataset.grade;
    syncPanelControls();
    queueRender();
  });
});

$('gradeAllBtn').addEventListener('click', () => {
  const grade = state.panels[state.selected].grade;
  state.panels.forEach((p) => { p.grade = grade; });
  toast(`Grade ${grade} applied to all panels`);
  queueRender();
});

$('panelZoom').addEventListener('input', (e) => {
  const z = Math.max(1, Math.min(2.5, Number(e.target.value)));
  state.panels[state.selected].zoom = z;
  $('zoomOut').textContent = `${z.toFixed(2)}×`;
  queueRender();
});

// ---------- pointer: pick, pan, zoom ----------

let drag = null;

function posterPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  return { px, py };
}

canvas.addEventListener('pointerdown', (e) => {
  const { px, py } = posterPoint(e);
  const idx = panelAt(state.layout, canvas.width, canvas.height, px, py);
  if (idx < 0) return;
  selectPanel(idx);
  canvas.setPointerCapture(e.pointerId);
  drag = { x: px, y: py, idx };
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { px, py } = posterPoint(e);
  const panel = state.panels[drag.idx];
  const img = state.photos[panel.photo];
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const geo = { w: canvas.width, h: canvas.height };
  void geo;
  const rect = currentPanelRect(drag.idx);
  if (!rect) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  if (dw > rect.w) {
    panel.ox = Math.max(-1, Math.min(1, panel.ox + ((px - drag.x) * 2) / (dw - rect.w)));
  }
  if (dh > rect.h) {
    panel.oy = Math.max(-1, Math.min(1, panel.oy + ((py - drag.y) * 2) / (dh - rect.h)));
  }
  drag.x = px;
  drag.y = py;
  queueRender();
});

canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  const z = Math.max(1, Math.min(2.5, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
  panel.zoom = z;
  $('panelZoom').value = String(z);
  $('zoomOut').textContent = `${z.toFixed(2)}×`;
  queueRender();
}, { passive: false });

function currentPanelRect(idx) {
  // Recompute the panel rects for the preview canvas size.
  const W = canvas.width;
  const H = canvas.height;
  const g = Math.max(4, Math.round(W * 0.008));
  const photoH = Math.round(H * 0.76);
  if (state.layout === 'collage') {
    const cw = (W - 4 * g) / 3;
    const rh = (photoH - 4 * g) / 3;
    const rects = [
      { x: g, y: g, w: 2 * cw + g, h: 2 * rh + g },
      { x: g + 2 * cw + 2 * g, y: g, w: cw, h: 2 * rh + g },
      { x: g, y: g + 2 * rh + 2 * g, w: cw, h: rh },
      { x: g + cw + g, y: g + 2 * rh + 2 * g, w: cw, h: rh },
      { x: g + 2 * cw + 2 * g, y: g + 2 * rh + 2 * g, w: cw, h: rh },
    ];
    return rects[idx] || null;
  }
  if (state.layout === 'split') {
    const leftW = Math.round((W - 3 * g) * 0.62);
    const rightW = W - 3 * g - leftW;
    const halfH = (photoH - 3 * g) / 2;
    const rects = [
      { x: g, y: g, w: leftW, h: photoH - 2 * g },
      { x: g + leftW + g, y: g, w: rightW, h: halfH },
      { x: g + leftW + g, y: g + halfH + g, w: rightW, h: halfH },
    ];
    return rects[idx] || null;
  }
  const sw = (W - 5 * g) / 4;
  return { x: g + idx * (sw + g), y: g, w: sw, h: photoH - 2 * g };
}

// ---------- export size ----------

function setSize(size) {
  state.size = size;
  document.querySelectorAll('input[name="size"]').forEach((r) => {
    r.checked = r.value === size;
  });
  document.querySelectorAll('.seg-btn').forEach((b) => {
    const on = b.dataset.size === size;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  const d = previewDims();
  canvas.width = d.w;
  canvas.height = d.h;
  queueRender();
}

document.querySelectorAll('input[name="size"]').forEach((r) => {
  r.addEventListener('change', () => { if (r.checked) setSize(r.value); });
});
document.querySelectorAll('.seg-btn').forEach((b) => {
  b.addEventListener('click', () => setSize(b.dataset.size));
});

// ---------- export ----------

async function exportPng() {
  const btn = $('exportBtn');
  btn.disabled = true;
  try {
    const out = renderExport(state, state.size);
    const blob = await canvasPngBlob(out);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-sunset-${state.size}-${SIZES[state.size].w}x${SIZES[state.size].h}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(`Exported ${SIZES[state.size].label} PNG`);
  } catch (err) {
    toast(`Export failed: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

$('exportBtn').addEventListener('click', exportPng);
$('exportBtn2').addEventListener('click', exportPng);

// ---------- full-screen cover view ----------

function enterCoverMode() {
  document.body.classList.add('cover-mode');
  renderCoverView();
}

function exitCoverMode() {
  document.body.classList.remove('cover-mode');
  const d = previewDims();
  canvas.width = d.w;
  canvas.height = d.h;
  renderPreview();
  if (window.location.hash.startsWith('#cover-')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

$('previewBtn').addEventListener('click', () => {
  window.location.hash = `cover-${state.size}`;
  enterCoverMode();
});

window.addEventListener('hashchange', () => {
  if (window.location.hash.startsWith('#cover-')) enterCoverMode();
  else exitCoverMode();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('cover-mode')) {
    exitCoverMode();
  }
});

// ---------- toast ----------

let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- self-test (?selftest=1) ----------
// Fully synchronous on purpose: it runs inside one timer callback, so its
// results are in the DOM even under headless virtual time.

function pngSizeFromDataUrl(dataUrl) {
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64.slice(0, 48));
  const num = (i) => (
    (bin.charCodeAt(i) << 24)
    | (bin.charCodeAt(i + 1) << 16)
    | (bin.charCodeAt(i + 2) << 8)
    | bin.charCodeAt(i + 3)
  );
  return { w: num(16), h: num(20) };
}

function selfTest() {
  const pre = $('selftest');
  pre.hidden = false;
  const lines = [];
  const ok = (name, good, extra = '') => {
    lines.push(`${good ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
    pre.textContent = lines.join('\n');
  };
  try {
    for (const key of Object.keys(SIZES)) {
      const out = renderExport(state, key);
      const url = out.toDataURL('image/png');
      const got = pngSizeFromDataUrl(url);
      ok(`export ${key}`, got.w === SIZES[key].w && got.h === SIZES[key].h, `${got.w}x${got.h}`);
    }
    const first = renderExport(state, 'wide');
    const second = renderExport(state, 'wide');
    ok('deterministic render', first.toDataURL() === second.toDataURL());
    // Any absolute URL (a scheme, or protocol-relative) would be an
    // external reference; the app must have none.
    const slash = String.fromCharCode(47);
    const external = [...document.querySelectorAll('[src],[href]')]
      .map((el) => el.getAttribute('src') || el.getAttribute('href') || '')
      .filter((u) => /^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith(slash + slash));
    ok('no external references', external.length === 0, `${external.length} found`);
    const scene = makeDrawnSunset(400, 300);
    ok('drawn sunset scene', scene.width === 400 && scene.height === 300);
    ok('samples loaded', Boolean(state.photos.s1) && Boolean(state.photos.s2));
  } catch (err) {
    lines.push(`FAIL self-test crashed — ${err.message}`);
    pre.textContent = lines.join('\n');
  }
  const passed = lines.length > 0 && lines.every((l) => l.startsWith('PASS'));
  document.title = passed ? 'SELFTEST PASS' : 'SELFTEST FAIL';
  return passed;
}

// ---------- start ----------

syncPanelControls();
refreshChips();
setSize('wide');
if (window.location.hash.startsWith('#cover-')) {
  const want = window.location.hash.slice('#cover-'.length);
  if (SIZES[want]) setSize(want);
  enterCoverMode();
}
if (new URLSearchParams(window.location.search).has('selftest')) {
  // Wait a beat for the sample photos, then run the checks.
  setTimeout(() => { selfTest(); }, 1200);
}

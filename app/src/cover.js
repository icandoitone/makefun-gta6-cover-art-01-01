// Vice Sunset — the cover rendering engine.
//
// Everything here is drawn with plain Canvas 2D: panel layouts, colour
// grades, halftone dots, lettering, and a procedurally drawn Vice City
// sunset scene. No image, font or artwork is loaded from outside the
// app, so the render is deterministic: the same state always draws the
// same pixels (grain uses a seeded generator, never Math.random).

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const GRADES = ['sunset', 'neon', 'noir', 'original'];

export const LAYOUTS = {
  collage: { panels: 5, name: 'Collage' },
  split: { panels: 3, name: 'Hero Split' },
  strips: { panels: 4, name: 'Strips' },
};

export const PHOTO_KEYS = ['A', 'B', 'C', 's1', 's2', 'drawn'];

export const PHOTO_LABELS = {
  A: 'Photo 1',
  B: 'Photo 2',
  C: 'Photo 3',
  s1: 'Boulevard sample',
  s2: 'Pier sample',
  drawn: 'Drawn sunset',
};

// Seeded generator, so grain and the drawn scene never vary run to run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A Vice City sunset drawn from scratch: gradient sky, glowing sun,
// skyline with lit windows, a Ferris wheel, palm silhouettes, water.
export function makeDrawnSunset(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const rnd = mulberry32(20261119);
  const horizon = h * 0.62;

  const sky = x.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#241159');
  sky.addColorStop(0.45, '#a62c7e');
  sky.addColorStop(0.78, '#ff7a18');
  sky.addColorStop(1, '#ffc53d');
  x.fillStyle = sky;
  x.fillRect(0, 0, w, horizon);

  // sun with glow
  const sunX = w * 0.68;
  const sunY = horizon - h * 0.2;
  const sunR = h * 0.17;
  const glow = x.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, 'rgba(255, 214, 140, 0.85)');
  glow.addColorStop(0.4, 'rgba(255, 122, 24, 0.28)');
  glow.addColorStop(1, 'rgba(255, 122, 24, 0)');
  x.fillStyle = glow;
  x.fillRect(0, 0, w, horizon);
  x.fillStyle = '#ffe3ae';
  x.beginPath();
  x.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#ff9a3c';
  x.beginPath();
  x.arc(sunX, sunY, sunR * 0.82, 0, Math.PI * 2);
  x.fill();

  // skyline
  x.fillStyle = '#1a0f33';
  let bx = 0;
  while (bx < w) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = h * (0.08 + rnd() * 0.22);
    x.fillRect(bx, horizon - bh, bw, bh);
    // lit windows
    x.fillStyle = '#ffd76a';
    const cols = Math.max(1, Math.floor(bw / (w * 0.02)));
    const rows = Math.max(1, Math.floor(bh / (h * 0.045)));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (rnd() < 0.28) {
          x.fillRect(bx + 3 + i * (w * 0.02), horizon - bh + 4 + j * (h * 0.045), 2.5, 3.5);
        }
      }
    }
    x.fillStyle = '#1a0f33';
    bx += bw + w * 0.008;
  }

  // Ferris wheel on the left
  const wx = w * 0.2;
  const wy = horizon - h * 0.1;
  const wr = h * 0.13;
  x.strokeStyle = 'rgba(255, 217, 160, 0.9)';
  x.lineWidth = Math.max(2, h * 0.006);
  x.beginPath();
  x.arc(wx, wy, wr, 0, Math.PI * 2);
  x.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    x.beginPath();
    x.moveTo(wx, wy);
    x.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr);
    x.stroke();
  }
  x.fillStyle = '#ffd9a0';
  x.beginPath();
  x.arc(wx, wy, 4, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.moveTo(wx - wr * 0.28, wy + wr * 0.9);
  x.lineTo(wx + wr * 0.28, wy + wr * 0.9);
  x.lineTo(wx + wr * 0.2, horizon);
  x.lineTo(wx - wr * 0.2, horizon);
  x.closePath();
  x.fillStyle = '#1a0f33';
  x.fill();

  // palm silhouettes
  function palm(px, py, s) {
    x.strokeStyle = '#120a26';
    x.fillStyle = '#120a26';
    x.lineWidth = Math.max(3, s * 0.05);
    x.beginPath();
    x.moveTo(px, py);
    x.quadraticCurveTo(px + s * 0.08, py - s * 0.55, px + s * 0.22, py - s * 0.95);
    x.stroke();
    const topX = px + s * 0.22;
    const topY = py - s * 0.95;
    for (let i = 0; i < 6; i++) {
      const a = (-0.15 - i * 0.32) * Math.PI;
      const ex = topX + Math.cos(a) * s * 0.55;
      const ey = topY + Math.sin(a) * s * 0.4 + s * 0.18;
      x.lineWidth = Math.max(2, s * 0.035);
      x.beginPath();
      x.moveTo(topX, topY);
      x.quadraticCurveTo(topX + (ex - topX) * 0.5, topY - s * 0.16, ex, ey);
      x.stroke();
    }
  }
  palm(w * 0.06, horizon + 2, h * 0.16);
  palm(w * 0.9, horizon + 2, h * 0.2);
  palm(w * 0.97, horizon + 2, h * 0.12);

  // water with sun reflection
  const sea = x.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#2a1a5e');
  sea.addColorStop(1, '#0c0a1e');
  x.fillStyle = sea;
  x.fillRect(0, horizon, w, h - horizon);
  x.fillStyle = 'rgba(255, 170, 80, 0.4)';
  for (let i = 0; i < 26; i++) {
    const ry = horizon + 4 + rnd() * (h - horizon - 8);
    const rw2 = w * (0.02 + rnd() * 0.1);
    const rx = sunX - w * 0.12 + rnd() * w * 0.24;
    x.globalAlpha = 0.12 + rnd() * 0.3;
    x.fillRect(rx, ry, rw2, 2);
  }
  x.globalAlpha = 1;
  return c;
}

// Panel geometry for a layout. Returns the photo area, the title band
// and one rect per panel, all in the poster's own pixel space.
export function layoutPanels(layout, W, H) {
  const g = Math.max(4, Math.round(W * 0.008));
  const photoH = Math.round(H * 0.76);
  const band = { x: 0, y: photoH, w: W, h: H - photoH };
  const panels = [];
  if (layout === 'collage') {
    const cw = (W - 4 * g) / 3;
    const rh = (photoH - 4 * g) / 3;
    const x0 = g;
    const x1 = g + cw + g;
    const x2 = g + 2 * cw + 2 * g;
    const y0 = g;
    const y1 = g + rh + g;
    const y2 = g + 2 * rh + 2 * g;
    panels.push({ x: x0, y: y0, w: 2 * cw + g, h: 2 * rh + g });
    panels.push({ x: x2, y: y0, w: cw, h: 2 * rh + g });
    panels.push({ x: x0, y: y2, w: cw, h: rh });
    panels.push({ x: x1, y: y2, w: cw, h: rh });
    panels.push({ x: x2, y: y2, w: cw, h: rh });
  } else if (layout === 'split') {
    const leftW = Math.round((W - 3 * g) * 0.62);
    const rightW = W - 3 * g - leftW;
    const halfH = (photoH - 3 * g) / 2;
    panels.push({ x: g, y: g, w: leftW, h: photoH - 2 * g });
    panels.push({ x: g + leftW + g, y: g, w: rightW, h: halfH });
    panels.push({ x: g + leftW + g, y: g + halfH + g, w: rightW, h: halfH });
  } else {
    const sw = (W - 5 * g) / 4;
    for (let i = 0; i < 4; i++) {
      panels.push({ x: g + i * (sw + g), y: g, w: sw, h: photoH - 2 * g });
    }
  }
  return { photoArea: { x: 0, y: 0, w: W, h: photoH }, band, panels, gutter: g };
}

// Which panel, if any, holds a point in the poster's pixel space.
export function panelAt(layout, W, H, px, py) {
  const geo = layoutPanels(layout, W, H);
  for (let i = 0; i < geo.panels.length; i++) {
    const p = geo.panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}

function fitFont(ctx, text, maxW, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

function drawHalftone(ctx, r, seed) {
  const rnd = mulberry32(seed);
  const step = Math.max(7, Math.round(r.w / 90));
  ctx.save();
  ctx.fillStyle = 'rgba(10, 6, 24, 0.22)';
  const rows = Math.floor(r.h * 0.24 / step);
  for (let row = 0; row < rows; row++) {
    const y = r.y + r.h - 6 - row * step;
    const rad = Math.max(0.8, step * 0.32 * (1 - row / Math.max(1, rows)));
    for (let col = 0; col * step < r.w; col++) {
      const xx = r.x + 6 + col * step + (row % 2 ? step / 2 : 0);
      if (xx > r.x + r.w - 4) continue;
      if (rnd() < 0.92) {
        ctx.beginPath();
        ctx.arc(xx, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawGrain(ctx, r, seed) {
  const rnd = mulberry32(seed);
  const count = Math.min(420, Math.floor((r.w * r.h) / 1400));
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rnd();
    ctx.fillStyle = v < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(r.x + rnd() * r.w, r.y + rnd() * r.h, 1.4, 1.4);
  }
  ctx.restore();
}

// Draw one photo into a panel rect with its zoom, pan and grade.
function drawPanel(ctx, img, rect, panel, index, halftone) {
  const r = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    g.addColorStop(0, '#2a1a5e');
    g.addColorStop(1, '#120a26');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(246,243,255,0.6)';
    ctx.font = `700 ${Math.max(12, r.w * 0.05)}px "DejaVu Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', r.x + r.w / 2, r.y + r.h / 2);
  } else {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const zoom = panel.zoom || 1;
    const scale = Math.max(r.w / iw, r.h / ih) * zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    const ox = Math.max(-1, Math.min(1, panel.ox || 0));
    const oy = Math.max(-1, Math.min(1, panel.oy || 0));
    const dx = r.x + (r.w - dw) / 2 + (ox * (dw - r.w)) / 2;
    const dy = r.y + (r.h - dh) / 2 + (oy * (dh - r.h)) / 2;
    const grade = panel.grade || 'sunset';
    if (grade === 'sunset') ctx.filter = 'saturate(1.3) contrast(1.06) brightness(1.03)';
    else if (grade === 'neon') ctx.filter = 'grayscale(0.85) contrast(1.18) brightness(1.05)';
    else if (grade === 'noir') ctx.filter = 'grayscale(1) contrast(1.25) brightness(1.06)';
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    if (grade === 'sunset') {
      const warm = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      warm.addColorStop(0, 'rgba(255,122,24,0.10)');
      warm.addColorStop(1, 'rgba(255,46,136,0.14)');
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = warm;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'source-over';
      const glow = ctx.createRadialGradient(
        r.x + r.w * 0.72, r.y + r.h * 0.2, 4,
        r.x + r.w * 0.72, r.y + r.h * 0.2, r.w * 0.55,
      );
      glow.addColorStop(0, 'rgba(255,190,90,0.20)');
      glow.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    } else if (grade === 'neon') {
      const duo = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      duo.addColorStop(0, 'rgba(255,46,136,0.30)');
      duo.addColorStop(0.55, 'rgba(255,46,136,0.04)');
      duo.addColorStop(1, 'rgba(45,226,197,0.30)');
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = duo;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (halftone) drawHalftone(ctx, r, 101 + index * 37);
    drawGrain(ctx, r, 1000 + index * 7919);
  }
  // vignette
  const vig = ctx.createRadialGradient(
    r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.42,
    r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.72,
  );
  vig.addColorStop(0, 'rgba(8,4,20,0)');
  vig.addColorStop(1, 'rgba(8,4,20,0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
  // panel frame
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, r.w * 0.006);
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  if (index === 0) {
    ctx.strokeStyle = 'rgba(255,46,136,0.9)';
    ctx.lineWidth = Math.max(2, r.w * 0.004);
    ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
  }
  ctx.restore();
}

function drawTitleBand(ctx, band, state, W) {
  const { x, y, w, h } = band;
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, '#1a1138');
  bg.addColorStop(1, '#0c0a1e');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  const rule = ctx.createLinearGradient(x, 0, x + w, 0);
  rule.addColorStop(0, '#ff2e88');
  rule.addColorStop(0.5, '#ff7a18');
  rule.addColorStop(1, '#2de2c5');
  ctx.fillStyle = rule;
  ctx.fillRect(x, y, w, Math.max(3, h * 0.02));

  const title = (state.title || 'VICE SUNSET').toUpperCase();
  const family = '"Arial Black", "Impact", "DejaVu Sans", sans-serif';
  // Keep the title clear of the sun mark on the band's right side.
  const tx = x + w * 0.055;
  const glyphR = h * 0.22;
  const glyphLeft = x + w * 0.90 - glyphR * 1.9;
  const maxW = Math.max(w * 0.4, glyphLeft - tx);
  const size = fitFont(ctx, title, maxW, h * 0.46, family);
  const ty = y + h * 0.52;
  try { ctx.letterSpacing = `${Math.max(1, size * 0.01)}px`; } catch (e) { /* older canvas */ }
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = size * 0.08;
  ctx.shadowOffsetY = size * 0.04;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14082a';
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeText(title, tx, ty);
  let fill;
  if (state.titleTheme === 'neon') {
    fill = ctx.createLinearGradient(tx, 0, tx + maxW, 0);
    fill.addColorStop(0, '#ff5df2');
    fill.addColorStop(1, '#ff2e88');
  } else if (state.titleTheme === 'white') {
    fill = ctx.createLinearGradient(0, y, 0, y + h);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, '#d9d3ff');
  } else {
    fill = ctx.createLinearGradient(tx, 0, tx + maxW, 0);
    fill.addColorStop(0, '#ff2e88');
    fill.addColorStop(0.55, '#ff7a18');
    fill.addColorStop(1, '#ffc53d');
  }
  ctx.fillStyle = fill;
  ctx.fillText(title, tx, ty);
  ctx.restore();

  const sub = (state.subtitle || '').toUpperCase();
  if (sub) {
    ctx.save();
    ctx.font = `700 ${Math.max(10, h * 0.15)}px "DejaVu Sans", sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, h * 0.035)}px`; } catch (e) { /* older canvas */ }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cfc8f2';
    ctx.fillText(sub, tx, y + h * 0.84);
    ctx.restore();
  }

  // small sun mark on the right of the band
  const cx = x + w * 0.90;
  const cy = y + h * 0.5;
  const rr = h * 0.22;
  ctx.save();
  ctx.fillStyle = '#ff7a18';
  ctx.beginPath();
  ctx.arc(cx, cy, rr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14102a';
  ctx.fillRect(cx - rr, cy - rr * 0.1, rr * 2, rr * 0.16);
  ctx.fillRect(cx - rr, cy + rr * 0.28, rr * 2, rr * 0.16);
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(2, rr * 0.14);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - rr * 1.5);
  ctx.lineTo(cx, cy - rr * 1.9);
  ctx.moveTo(cx - rr * 1.3, cy - rr * 0.9);
  ctx.lineTo(cx - rr * 1.6, cy - rr * 1.25);
  ctx.moveTo(cx + rr * 1.3, cy - rr * 0.9);
  ctx.lineTo(cx + rr * 1.6, cy - rr * 1.25);
  ctx.stroke();
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
}

// Draw the whole poster onto a canvas of exactly W x H.
export function renderCover(canvas, state, W, H) {
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0c0a1e';
  ctx.fillRect(0, 0, W, H);
  const geo = layoutPanels(state.layout, W, H);
  geo.panels.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 's1', zoom: 1, ox: 0, oy: 0, grade: 'sunset' };
    const img = state.photos ? state.photos[panel.photo] || null : null;
    drawPanel(ctx, img, rect, panel, i, state.halftone !== false);
  });
  drawTitleBand(ctx, geo.band, state, W);
  ctx.restore();
  return canvas;
}

// Render the cover at one of the three export sizes.
export function renderExport(state, sizeKey) {
  const size = SIZES[sizeKey] || SIZES.wide;
  const canvas = document.createElement('canvas');
  return renderCover(canvas, state, size.w, size.h);
}

export function canvasPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas toBlob returned nothing'));
    }, 'image/png');
  });
}

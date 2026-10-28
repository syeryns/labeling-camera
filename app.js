'use strict';

/* =========================================================
   라벨링 카메라 — 순수 JS, 빌드 없음. 외부 라이브러리는 JSZip만.
   ========================================================= */

// ---------- 상수 ----------
const COLORS = [
  { name: '빨강', v: '#ff3b30' },
  { name: '노랑', v: '#ffcc00' },
  { name: '초록', v: '#34c759' },
  { name: '흰색', v: '#ffffff' },
];
const WIDTHS = { thin: 0.005, medium: 0.009, thick: 0.016 }; // 사진 짧은 변 대비
const WIDTH_NAMES = [['thin', '가늘게'], ['medium', '보통'], ['thick', '굵게']];
const LABEL_STYLES = [
  { textColor: '#fff', bgColor: 'rgba(0,0,0,0.6)' },
  { textColor: '#000', bgColor: 'rgba(255,255,255,0.85)' },
  { textColor: '#fff', bgColor: 'rgba(255,59,48,0.85)' },
  { textColor: '#000', bgColor: 'rgba(255,204,0,0.9)' },
];
const LABEL_FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const LABEL_SIZE = 0.05; // 글자 크기 = 짧은 변의 5% × scale
const MAX_EXPORT_LONG = 4032;
const MAX_CANVAS_PIXELS = 16000000; // iOS canvas 한계(약 1,670만 화소) 아래
const MAX_EDIT_LONG = 2560; // 편집 화면 표시용
const TOOLS = [
  ['label', '라벨', 'tag'],
  ['circle', '동그라미', 'circle'],
  ['line', '직선', 'line'],
  ['arrow', '화살표', 'arrow'],
  ['pen', '펜', 'pen'],
  ['eraser', '지우개', 'eraser'],
];

// ---------- 아이콘 ----------
const ICON_PATHS = {
  camera: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
  check: '<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M7.5 12.3l3 3 6-6.3" stroke="#1c1c1e" stroke-width="2.4"/>',
  pencil: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  circle: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  line: '<path d="M5 19L19 5"/>',
  arrow: '<path d="M5 19L19 5M10 5h9v9"/>',
  pen: '<path d="M3 17c3-6 5-9 7-9s1 6 3 6 3-5 4-7 2-2 4-1"/>',
  eraser: '<path d="M8.5 20H20M4.6 15.4l9.9-9.9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8.2z"/><path d="M9 11l5 5"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/>',
  grip: '<path d="M5 9h14M5 15h14"/>',
  skip: '<path d="M6 5l8 7-8 7z"/><path d="M18 5v14"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  share: '<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M7 11H5v9h14v-9h-2"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

// ---------- 유틸 ----------
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round5 = (v) => Math.round(v * 1e5) / 1e5;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'value') n.value = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (typeof v === 'boolean') n[k] = v;
    else n.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const x = [...b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

function localISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${p(Math.floor(a / 60))}:${p(a % 60)}`;
}
function localDate(d = new Date()) {
  return localISO(d).slice(0, 10);
}
function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtBytes(n) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// 파일명에 쓸 수 없는 문자는 _로
function safeName(s) {
  return String(s).replace(/[\/\\:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim().replace(/\.+$/, '') || '_';
}
function cut(s, n) {
  return Array.from(s).slice(0, n).join('');
}
function extFor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('heic')) return 'heic';
  if (t.includes('heif')) return 'heif';
  if (t.includes('webp')) return 'webp';
  if (t.includes('gif')) return 'gif';
  return 'jpg';
}

// ---------- 설정 (localStorage는 설정값에만) ----------
const Settings = {
  _v: { exportMode: 'original', autoNext: false },
  load() {
    try {
      Object.assign(this._v, JSON.parse(localStorage.getItem('lc.settings') || '{}'));
    } catch (e) { /* 비어 있어도 기본값으로 동작 */ }
  },
  save() {
    try { localStorage.setItem('lc.settings', JSON.stringify(this._v)); } catch (e) { /* 무시 */ }
  },
  get exportMode() { return this._v.exportMode; },
  set exportMode(v) { this._v.exportMode = v; this.save(); },
  get autoNext() { return !!this._v.autoNext; },
  set autoNext(v) { this._v.autoNext = !!v; this.save(); },
};

// ---------- IndexedDB ----------
// decks: 덱과 라벨 목록 / photos: 사진 메타데이터·좌표 / blobs: 원본·썸네일 Blob
function reqP(r) {
  return new Promise((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const DB = {
  _p: null,
  open() {
    if (this._p) return this._p;
    this._p = new Promise((res, rej) => {
      const r = indexedDB.open('labelcam', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore('decks', { keyPath: 'id' });
        db.createObjectStore('photos', { keyPath: 'id' }).createIndex('itemId', 'itemId');
        db.createObjectStore('blobs', { keyPath: 'key' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return this._p;
  },
  async get(store, key) {
    const db = await this.open();
    return reqP(db.transaction(store).objectStore(store).get(key));
  },
  async all(store) {
    const db = await this.open();
    return reqP(db.transaction(store).objectStore(store).getAll());
  },
  // ops: [{store, put: value} | {store, del: key}] — 한 트랜잭션으로 묶는다
  async write(ops) {
    const db = await this.open();
    const stores = [...new Set(ops.map((o) => o.store))];
    return new Promise((res, rej) => {
      const tx = db.transaction(stores, 'readwrite');
      for (const o of ops) {
        const s = tx.objectStore(o.store);
        if ('put' in o) s.put(o.put);
        else s.delete(o.del);
      }
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error || new DOMException('저장 실패', 'AbortError'));
    });
  },
  put(store, value) {
    return this.write([{ store, put: value }]);
  },
};

// ---------- 상태 ----------
const S = {
  screen: null,
  deck: null,
  selectedItemId: null,
  filterEmpty: false,
  editMode: false,
  capture: null,
  deckFileCb: null,
};

// ---------- 덱 데이터 ----------
function makeItem(label) {
  return { id: uuid(), order: 0, label, status: 'empty', photoIds: [], skipped: false };
}
function makeDeck(name, labels) {
  const now = localISO();
  const deck = { id: uuid(), name, createdAt: now, updatedAt: now, items: labels.map(makeItem) };
  deck.items.forEach((it, i) => (it.order = i + 1));
  return deck;
}
function deckOps(deck) {
  deck.updatedAt = localISO();
  deck.items.forEach((it, i) => (it.order = i + 1)); // 번호는 항상 목록 순서
  return { store: 'decks', put: deck };
}
function saveDeck(deck) {
  return DB.write([deckOps(deck)]);
}
function shotCount(deck) {
  return deck.items.filter((i) => i.photoIds.length > 0).length;
}
function photoCount(deck) {
  return deck.items.reduce((a, i) => a + i.photoIds.length, 0);
}
// 다음 미촬영(건너뛰지 않은) 라벨. after 다음부터 찾고, 없으면 처음부터.
function nextEmpty(deck, after) {
  const items = deck.items;
  const start = after ? items.indexOf(after) + 1 : 0;
  const ok = (i) => i.status === 'empty' && !i.skipped;
  return items.slice(start).find(ok) || items.slice(0, Math.max(0, start)).find(ok) || null;
}
function photoDeleteOps(ids) {
  const ops = [];
  for (const id of ids) {
    ops.push({ store: 'photos', del: id }, { store: 'blobs', del: id + ':o' }, { store: 'blobs', del: id + ':t' });
    dropThumb(id);
  }
  return ops;
}
function defaultAnnotations() {
  return { labelBox: { x: 0.02, y: 0.02, scale: 1, ...LABEL_STYLES[0] }, shapes: [] };
}

// 썸네일 URL 캐시 (목록은 썸네일만 읽는다)
const thumbCache = new Map();
function thumbUrl(pid) {
  if (!thumbCache.has(pid)) {
    thumbCache.set(pid, DB.get('blobs', pid + ':t').then((r) => (r ? URL.createObjectURL(r.blob) : null)).catch(() => null));
  }
  return thumbCache.get(pid);
}
function dropThumb(pid) {
  const p = thumbCache.get(pid);
  if (p) p.then((u) => u && URL.revokeObjectURL(u));
  thumbCache.delete(pid);
}

// ---------- 이미지 ----------
async function decodeImage(blob) {
  if (window.createImageBitmap) {
    for (const opts of [{ imageOrientation: 'from-image' }, undefined]) {
      try {
        const b = opts ? await createImageBitmap(blob, opts) : await createImageBitmap(blob);
        return { src: b, width: b.width, height: b.height, close: () => b.close && b.close() };
      } catch (e) { /* 다음 방법 시도 */ }
    }
  }
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (e) {
    URL.revokeObjectURL(url);
    throw new Error('사진을 읽을 수 없습니다');
  }
  return { src: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}
function fitSize(w, h, maxLong, maxPixels) {
  let k = Math.min(1, maxLong / Math.max(w, h));
  if (w * h * k * k > maxPixels) k = Math.sqrt(maxPixels / (w * h));
  return { w: Math.max(1, Math.floor(w * k)), h: Math.max(1, Math.floor(h * k)) };
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}
// iOS는 canvas 메모리를 바로 돌려주지 않으므로 크기를 줄여 해제한다
function releaseCanvas(c) {
  if (c) { c.width = 1; c.height = 1; }
}
function canvasBlob(c, type, q) {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('이미지 변환 실패'))), type, q));
}
async function renderThumb(img) {
  const { w, h } = fitSize(img.width, img.height, 300, Infinity);
  const c = makeCanvas(w, h);
  c.getContext('2d').drawImage(img.src, 0, 0, w, h);
  const b = await canvasBlob(c, 'image/jpeg', 0.8);
  releaseCanvas(c);
  return b;
}

// 촬영 파일을 원본 그대로 저장할 준비 (재압축 없음)
async function preparePhoto(file, itemId) {
  const img = await decodeImage(file);
  try {
    const thumb = await renderThumb(img);
    const id = uuid();
    const meta = {
      id,
      itemId,
      width: img.width,
      height: img.height,
      type: file.type || 'image/jpeg',
      size: file.size,
      createdAt: localISO(),
      annotations: defaultAnnotations(),
    };
    return {
      meta,
      ops: [
        { store: 'blobs', put: { key: id + ':o', blob: file } },
        { store: 'blobs', put: { key: id + ':t', blob: thumb } },
        { store: 'photos', put: meta },
      ],
    };
  } finally {
    img.close();
  }
}

// ---------- 주석 그리기 (편집 화면과 내보내기가 같은 함수를 쓴다) ----------
function lineWidthPx(sh, W, H) {
  return (WIDTHS[sh.width] || WIDTHS.medium) * Math.min(W, H);
}
function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
// 긴 라벨명은 두 줄까지 줄바꿈하고 넘치면 …
function wrapText(ctx, text, maxW, maxLines) {
  const chars = Array.from(String(text).trim());
  const lines = [];
  let cur = '';
  let i = 0;
  for (; i < chars.length; i++) {
    const ch = chars[i];
    const test = cur + ch;
    if (cur === '' || ctx.measureText(test).width <= maxW) { cur = test; continue; }
    if (lines.length === maxLines - 1) break;
    const sp = cur.lastIndexOf(' ');
    if (ch !== ' ' && sp > 0) {
      lines.push(cur.slice(0, sp));
      cur = cur.slice(sp + 1) + ch;
    } else {
      lines.push(cur.trimEnd());
      cur = ch === ' ' ? '' : ch;
    }
  }
  if (i < chars.length) {
    while (cur && ctx.measureText(cur + '…').width > maxW) cur = Array.from(cur).slice(0, -1).join('');
    cur += '…';
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}
function labelLayout(ctx, W, H, lb, text) {
  const fs = Math.min(W, H) * LABEL_SIZE * lb.scale;
  const pad = fs * 0.4;
  const lh = fs * 1.25;
  ctx.save();
  ctx.font = `600 ${fs}px ${LABEL_FONT}`;
  const maxW = Math.max(fs * 3, W * (1 - lb.x) - W * 0.02 - pad * 2);
  const lines = wrapText(ctx, text, maxW, 2);
  const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
  ctx.restore();
  return { x: lb.x * W, y: lb.y * H, w: tw + pad * 2, h: lines.length * lh + pad * 1.4, fs, pad, lh, lines };
}
function drawLabel(ctx, L, lb) {
  ctx.save();
  roundRectPath(ctx, L.x, L.y, L.w, L.h, L.fs * 0.3);
  ctx.fillStyle = lb.bgColor;
  ctx.fill();
  ctx.fillStyle = lb.textColor;
  ctx.font = `600 ${L.fs}px ${LABEL_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  L.lines.forEach((line, i) => ctx.fillText(line, L.x + L.pad, L.y + L.pad * 0.7 + L.lh * (i + 0.5)));
  ctx.restore();
}
function drawShape(ctx, sh, W, H) {
  const lw = lineWidthPx(sh, W, H);
  ctx.save();
  ctx.strokeStyle = sh.color;
  ctx.fillStyle = sh.color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (sh.type === 'circle') {
    ctx.beginPath();
    ctx.ellipse(sh.cx * W, sh.cy * H, Math.max(sh.rx * W, 0.5), Math.max(sh.ry * H, 0.5), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (sh.type === 'line' || sh.type === 'arrow') {
    const x1 = sh.x1 * W, y1 = sh.y1 * H, x2 = sh.x2 * W, y2 = sh.y2 * H;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (sh.type === 'line' || len < 1) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else {
      const head = Math.min(len * 0.6, lw * 3.2 + Math.min(W, H) * 0.012);
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8);
      ctx.stroke();
      const a = Math.PI / 7, c = Math.cos(a), s = Math.sin(a);
      const vx = -ux, vy = -uy;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 + head * (vx * c - vy * s), y2 + head * (vx * s + vy * c));
      ctx.lineTo(x2 + head * (vx * c + vy * s), y2 + head * (-vx * s + vy * c));
      ctx.closePath();
      ctx.lineWidth = lw * 0.5;
      ctx.fill();
      ctx.stroke();
    }
  } else if (sh.type === 'pen') {
    const pts = sh.points.map(([x, y]) => [x * W, y * H]);
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0][0], pts[0][1], lw / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function shapeBounds(sh, W, H) {
  if (sh.type === 'circle') return { x0: (sh.cx - sh.rx) * W, y0: (sh.cy - sh.ry) * H, x1: (sh.cx + sh.rx) * W, y1: (sh.cy + sh.ry) * H };
  if (sh.type === 'pen') {
    const xs = sh.points.map((p) => p[0] * W), ys = sh.points.map((p) => p[1] * H);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }
  return { x0: Math.min(sh.x1, sh.x2) * W, y0: Math.min(sh.y1, sh.y2) * H, x1: Math.max(sh.x1, sh.x2) * W, y1: Math.max(sh.y1, sh.y2) * H };
}
function dashedRect(ctx, x, y, w, h, px) {
  ctx.save();
  ctx.lineWidth = 3 * px;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([6 * px, 4 * px]);
  ctx.lineWidth = 1.5 * px;
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
// ui가 있으면 편집 화면(선택 표시 포함), 없으면 내보내기용 합성
function drawAnnotations(ctx, W, H, ann, text, ui) {
  for (const sh of ann.shapes) drawShape(ctx, sh, W, H);
  if (ui && ui.draft) drawShape(ctx, ui.draft, W, H);
  const L = labelLayout(ctx, W, H, ann.labelBox, text);
  drawLabel(ctx, L, ann.labelBox);
  if (!ui || !ui.sel) return;
  const px = ui.px;
  if (ui.sel.type === 'shape') {
    const sh = ann.shapes[ui.sel.i];
    if (sh) {
      const b = shapeBounds(sh, W, H);
      const p = lineWidthPx(sh, W, H) / 2 + 8 * px;
      dashedRect(ctx, b.x0 - p, b.y0 - p, b.x1 - b.x0 + p * 2, b.y1 - b.y0 + p * 2, px);
    }
  } else if (ui.sel.type === 'label') {
    dashedRect(ctx, L.x - 3 * px, L.y - 3 * px, L.w + 6 * px, L.h + 6 * px, px);
    ctx.save();
    ctx.beginPath();
    ctx.arc(L.x + L.w, L.y + L.h, 11 * px, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2 * px;
    ctx.strokeStyle = '#1c1c1e';
    ctx.stroke();
    ctx.restore();
  }
}

// ---------- 공통 UI ----------
function openModal(node, { center = false, dismiss = true } = {}) {
  const back = el('div', { class: 'modal-backdrop' + (center ? ' center' : '') }, node);
  const close = () => back.remove();
  if (dismiss) back.addEventListener('click', (e) => e.target === back && close());
  $('#modal-root').append(back);
  return close;
}
function confirmDialog(msg, { sub, ok = '확인', cancel = '취소', danger = false } = {}) {
  return new Promise((res) => {
    let close;
    const done = (v) => { close(); res(v); };
    const box = el('div', { class: 'dialog' },
      el('div', { class: 'dialog-msg', text: msg }),
      sub && el('div', { class: 'dialog-sub', text: sub }),
      el('div', { class: 'sheet-actions' },
        el('button', { class: 'btn', text: cancel, onclick: () => done(false) }),
        el('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), text: ok, onclick: () => done(true) })));
    close = openModal(box, { center: true, dismiss: false });
  });
}
function alertDialog(msg, sub) {
  return new Promise((res) => {
    let close;
    const box = el('div', { class: 'dialog' },
      el('div', { class: 'dialog-msg', text: msg }),
      sub && el('div', { class: 'dialog-sub', text: sub }),
      el('div', { class: 'sheet-actions' }, el('button', { class: 'btn primary', text: '확인', onclick: () => { close(); res(); } })));
    close = openModal(box, { center: true, dismiss: false });
  });
}
function promptDialog(title, value = '', { placeholder = '', ok = '확인' } = {}) {
  return new Promise((res) => {
    let close;
    const input = el('input', { class: 'input', value, placeholder, enterkeyhint: 'done' });
    const done = (v) => { close(); res(v); };
    const submit = () => {
      const v = input.value.trim();
      if (v) done(v);
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
    const box = el('div', { class: 'dialog' },
      el('div', { class: 'dialog-msg', text: title, style: 'margin-bottom:12px' }),
      input,
      el('div', { class: 'sheet-actions' },
        el('button', { class: 'btn', text: '취소', onclick: () => done(null) }),
        el('button', { class: 'btn primary', text: ok, onclick: submit })));
    close = openModal(box, { center: true, dismiss: false });
    setTimeout(() => { input.focus(); input.select(); }, 50);
  });
}
// 버튼 탭 안에서 바로 run()을 부르므로 카메라 열기(click)가 사용자 동작으로 인정된다
function actionSheet(title, actions) {
  let close;
  const list = el('div', { class: 'action-list' },
    actions.filter(Boolean).map((a) => el('button', {
      class: 'action-item' + (a.danger ? ' danger' : ''),
      html: icon(a.icon) + `<span>${esc(a.label)}</span>`,
      onclick: () => { close(); a.run(); },
    })));
  const sheet = el('div', { class: 'sheet' },
    title && el('div', { class: 'sheet-head', text: title }),
    list,
    el('button', { class: 'btn action-cancel', text: '취소', onclick: () => close() }));
  close = openModal(sheet);
}
let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
function busy(text) {
  $('#busy').hidden = text === false;
  if (text !== false) $('#busy-text').textContent = text || '';
}
function isQuota(e) {
  return e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message || ''));
}
function handleError(e) {
  console.error(e);
  if (isQuota(e)) {
    alertDialog('저장공간 부족', '기기 저장공간이 부족해 저장하지 못했습니다.\n촬영한 사진을 잃지 않도록 먼저 기존 덱을 내보낸 뒤 정리해 주세요.');
  } else {
    toast((e && e.message) || '오류가 발생했습니다');
  }
}

// ---------- 화면 전환 ----------
function show(name) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== 'screen-' + name;
  S.screen = name;
  saveLast();
}
// 앱이 꺼졌다 켜져도 마지막 화면으로 돌아오기 위해
function saveLast() {
  try {
    localStorage.setItem('lc.last', JSON.stringify({
      screen: S.screen,
      deckId: S.deck && S.deck.id,
      itemId: S.screen === 'editor' && ED.item ? ED.item.id : null,
      photoId: S.screen === 'editor' ? ED.photoId : null,
    }));
  } catch (e) { /* 무시 */ }
}
function readLast() {
  try { return JSON.parse(localStorage.getItem('lc.last') || 'null'); } catch (e) { return null; }
}

/* =========================================================
   1. 덱 목록
   ========================================================= */
async function showDecks() {
  const decks = (await DB.all('decks')).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  S.deck = null;
  const list = $('#deck-list');
  list.replaceChildren();
  if (!decks.length) {
    list.append(el('div', { class: 'empty-state' },
      el('strong', { text: '아직 덱이 없습니다' }),
      '‘새 덱’을 눌러 라벨 목록을 붙여넣거나, ‘가져오기’로 .txt · .csv · .json 파일을 불러오세요.'));
  }
  for (const d of decks) {
    const done = shotCount(d), total = d.items.length;
    const card = el('div', { class: 'deck-card', role: 'button', onclick: () => openDetail(d.id) },
      el('div', { class: 'deck-card-main' },
        el('div', { class: 'deck-card-name', text: d.name }),
        el('div', { class: 'deck-card-sub' },
          el('span', { text: `${done}/${total}` }),
          el('span', { text: `수정 ${fmtDate(d.updatedAt)}` })),
        el('div', { class: 'progress' }, el('div', { class: 'progress-fill', style: `width:${total ? (done / total) * 100 : 0}%` }))),
      el('button', {
        class: 'icon-btn', 'aria-label': '덱 메뉴', html: icon('more'),
        onclick: (e) => { e.stopPropagation(); deckMenu(d, true); },
      }));
    list.append(card);
  }
  show('decks');
}

function deckMenu(deck, fromList) {
  actionSheet(deck.name, [
    !fromList && { label: '설정', icon: 'gear', run: settingsModal },
    { label: '덱 이름 변경', icon: 'pencil', run: () => renameDeck(deck, fromList) },
    { label: '덱 복제 (사진 없이)', icon: 'copy', run: () => duplicateDeck(deck) },
    { label: '라벨 목록 내보내기 (.json)', icon: 'file', run: () => exportDeckJson(deck) },
    { label: '덱 삭제', icon: 'trash', danger: true, run: () => deleteDeckFlow(deck) },
  ]);
}
async function renameDeck(deck, fromList) {
  const name = await promptDialog('덱 이름', deck.name);
  if (!name) return;
  deck.name = name;
  try {
    await saveDeck(deck);
    fromList ? showDecks() : renderDetail();
  } catch (e) { handleError(e); }
}
async function duplicateDeck(deck) {
  const copy = makeDeck(`${deck.name} 복사본`, deck.items.map((i) => i.label));
  try {
    await saveDeck(copy);
    toast('복제했습니다');
    showDecks();
  } catch (e) { handleError(e); }
}
function exportDeckJson(deck) {
  const data = JSON.stringify({ name: deck.name, labels: deck.items.map((i) => i.label) }, null, 2);
  downloadBlob(new Blob([data], { type: 'application/json' }), `${safeName(deck.name)}.json`);
}
async function deleteDeckFlow(deck) {
  const n = photoCount(deck);
  if (!(await confirmDialog(`‘${deck.name}’ 덱을 삭제할까요?`, { ok: '삭제', danger: true }))) return;
  const msg = n > 0 ? `사진 ${n}장이 함께 삭제됩니다.` : '정말 삭제할까요?';
  if (!(await confirmDialog(msg, { sub: '되돌릴 수 없습니다.' + (n > 0 ? ' 필요하면 먼저 내보내세요.' : ''), ok: '삭제', danger: true }))) return;
  try {
    const ids = deck.items.flatMap((i) => i.photoIds);
    await DB.write([{ store: 'decks', del: deck.id }, ...photoDeleteOps(ids)]);
    toast('삭제했습니다');
    showDecks();
  } catch (e) { handleError(e); }
}

// ---------- 덱 만들기 / 파일 가져오기 ----------
function parseLines(text) {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
function csvFirstColumn(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let v;
    if (line.trimStart().startsWith('"')) {
      const l = line.trimStart();
      let i = 1, s = '';
      while (i < l.length) {
        if (l[i] === '"') {
          if (l[i + 1] === '"') { s += '"'; i += 2; continue; }
          break;
        }
        s += l[i++];
      }
      v = s;
    } else {
      v = line.split(/[,;\t]/)[0];
    }
    v = v.trim();
    if (v) out.push(v);
  }
  if (out.length && /^(label|labels|name|라벨|라벨명|이름)$/i.test(out[0])) out.shift();
  return out;
}
function parseDeckFile(fileName, text) {
  text = text.replace(/^﻿/, '');
  const base = fileName.replace(/\.[^.]+$/, '');
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'json' || /^\s*[\[{]/.test(text)) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('JSON 형식이 올바르지 않습니다'); }
    const arr = Array.isArray(obj) ? obj : obj.labels;
    if (!Array.isArray(arr)) throw new Error('JSON에 labels 목록이 없습니다');
    const labels = arr.map((x) => (typeof x === 'string' ? x : x && (x.label || x.name)) || '').map((s) => String(s).trim()).filter(Boolean);
    return { name: (!Array.isArray(obj) && obj.name) || base, labels };
  }
  if (ext === 'csv') return { name: base, labels: csvFirstColumn(text) };
  return { name: base, labels: parseLines(text) };
}
function pickDeckFile(cb) {
  S.deckFileCb = cb;
  const inp = $('#deck-file-input');
  inp.value = '';
  inp.click();
}
async function onDeckFile() {
  const f = $('#deck-file-input').files[0];
  const cb = S.deckFileCb;
  S.deckFileCb = null;
  if (!f || !cb) return;
  try {
    const r = parseDeckFile(f.name, await f.text());
    if (!r.labels.length) throw new Error('파일에서 라벨을 찾지 못했습니다');
    cb(r);
  } catch (e) { handleError(e); }
}

function newDeckModal(prefill = { name: '', labels: [] }) {
  const name = el('input', { class: 'input', placeholder: '예: 상지 근육', value: prefill.name });
  const ta = el('textarea', { class: 'textarea', placeholder: '상완두갈래근\n위팔근\n부리위팔근', value: prefill.labels.join('\n') });
  const count = el('span', { class: 'field-hint' });
  const upd = () => (count.textContent = `${parseLines(ta.value).length}개 라벨`);
  ta.addEventListener('input', upd);
  upd();
  let close;
  const create = async () => {
    const labels = parseLines(ta.value);
    const n = name.value.trim();
    if (!n) { toast('덱 이름을 입력하세요'); name.focus(); return; }
    if (!labels.length) { toast('라벨을 한 줄에 하나씩 입력하세요'); ta.focus(); return; }
    const deck = makeDeck(n, labels);
    try {
      await saveDeck(deck);
      close();
      openDetail(deck.id);
    } catch (e) { handleError(e); }
  };
  const sheet = el('div', { class: 'sheet' },
    el('h2', { class: 'sheet-title', text: '새 덱' }),
    el('div', { class: 'sheet-body' },
      el('div', { class: 'field' }, el('label', { text: '덱 이름' }), name),
      el('div', { class: 'field' },
        el('div', { class: 'field-row' },
          el('label', { text: '라벨 (한 줄에 하나)' }),
          el('button', {
            class: 'text-btn', text: '파일에서 불러오기',
            onclick: () => pickDeckFile((r) => {
              if (!name.value.trim()) name.value = r.name;
              ta.value = r.labels.join('\n');
              upd();
            }),
          })),
        ta,
        el('div', { class: 'field-hint' }, count, ' · 빈 줄은 무시합니다. .txt · .csv(첫 열) · .json 파일도 받습니다.'))),
    el('div', { class: 'sheet-actions' },
      el('button', { class: 'btn', text: '취소', onclick: () => close() }),
      el('button', { class: 'btn primary', text: '만들기', onclick: create })));
  close = openModal(sheet, { dismiss: false });
  if (!prefill.name) setTimeout(() => name.focus(), 50);
}

/* =========================================================
   2. 덱 상세
   ========================================================= */
async function openDetail(deckId, { keepSelection = false } = {}) {
  try {
    const deck = S.deck && S.deck.id === deckId ? S.deck : await DB.get('decks', deckId);
    if (!deck) return showDecks();
    S.deck = deck;
    S.editMode = false;
    const sel = deck.items.find((i) => i.id === S.selectedItemId);
    if (!keepSelection || !sel) S.selectedItemId = (nextEmpty(deck) || {}).id || null;
    renderDetail();
    show('detail');
    const row = $(`#item-list [data-id="${S.selectedItemId}"]`);
    if (row) row.scrollIntoView({ block: 'center' });
  } catch (e) { handleError(e); }
}

function itemStatusText(it) {
  if (it.status === 'empty') return it.skipped ? '건너뜀' : '미촬영';
  const n = it.photoIds.length > 1 ? ` · 사진 ${it.photoIds.length}장` : '';
  return (it.status === 'done' ? '완료' : '촬영됨 · 편집 전') + n;
}

function renderDetail() {
  const deck = S.deck;
  const total = deck.items.length, done = shotCount(deck);
  const skipped = deck.items.filter((i) => i.status === 'empty' && i.skipped).length;
  $('#detail-title').textContent = deck.name;
  $('#detail-progress').style.width = `${total ? (done / total) * 100 : 0}%`;
  $('#detail-count').textContent = `촬영 ${done} / ${total}` + (skipped ? ` · 건너뜀 ${skipped}` : '');
  const chip = $('#filter-chip');
  chip.setAttribute('aria-pressed', String(S.filterEmpty));
  chip.hidden = S.editMode;
  $('#edit-toggle').textContent = S.editMode ? '완료' : '편집';

  const list = $('#item-list');
  list.replaceChildren();
  deck.items.forEach((it, idx) => {
    if (!S.editMode && S.filterEmpty && it.status !== 'empty') return;
    list.append(S.editMode ? editRow(it, idx) : itemRow(it, idx));
  });
  if (!list.children.length) {
    list.append(el('div', { class: 'empty-state' },
      el('strong', { text: S.filterEmpty ? '미촬영 라벨이 없습니다' : '라벨이 없습니다' }),
      S.filterEmpty ? '모두 촬영했습니다. ‘전체 저장’으로 내보내세요.' : '‘편집’에서 라벨을 추가하세요.'));
  }

  const bar = $('#detail-bar');
  bar.replaceChildren(...(S.editMode
    ? [
        el('button', { class: 'btn', html: icon('plus') + '라벨 추가', onclick: addLabelsModal }),
        el('button', { class: 'btn primary', text: '완료', onclick: toggleEdit }),
      ]
    : [
        el('button', { class: 'btn primary', html: icon('camera') + '다음 촬영', onclick: shootNext }),
        el('button', { class: 'btn', html: icon('download') + '전체 저장', onclick: () => openExport() }),
      ]));
}

function itemRow(it, idx) {
  const st = it.status;
  const has = it.photoIds.length > 0;
  const thumb = el('div', { class: 'item-thumb' });
  if (has) {
    thumbUrl(it.photoIds[0]).then((u) => { if (u) thumb.style.backgroundImage = `url("${u}")`; });
  } else {
    thumb.innerHTML = icon(it.skipped ? 'skip' : 'camera');
  }
  const statusIcon = st === 'empty' ? (it.skipped ? 'skip' : 'camera') : st === 'shot' ? 'pencil' : 'check';
  return el('div', {
    class: `item-row ${st}${it.skipped && st === 'empty' ? ' skipped' : ''}${it.id === S.selectedItemId ? ' selected' : ''}`,
    'data-id': it.id,
    role: 'button',
    onclick: () => onRowTap(it),
  },
  el('div', { class: 'item-num', text: idx + 1 }),
  thumb,
  el('div', { class: 'item-main' },
    el('div', { class: 'item-label', text: it.label }),
    el('div', { class: 'item-sub', text: itemStatusText(it) })),
  el('div', { class: 'item-status', html: icon(statusIcon), 'aria-label': itemStatusText(it) }),
  el('button', {
    class: 'icon-btn item-more', 'aria-label': '라벨 메뉴', html: icon('more'),
    onclick: (e) => { e.stopPropagation(); rowMenu(it); },
  }));
}

function onRowTap(it) {
  if (it.status === 'empty') {
    S.selectedItemId = it.id;
    startCapture({ mode: 'add', itemId: it.id });
  } else {
    openEditor(it.id);
  }
}

function rowMenu(it) {
  const has = it.photoIds.length > 0;
  actionSheet(it.label, [
    { label: has ? '사진 추가 촬영' : '카메라로 촬영', icon: 'camera', run: () => startCapture({ mode: 'add', itemId: it.id }) },
    { label: '앨범에서 가져오기', icon: 'image', run: () => startAlbum({ mode: 'add', itemId: it.id }) },
    has && { label: '편집 열기', icon: 'pencil', run: () => openEditor(it.id) },
    !has && { label: it.skipped ? '건너뛰기 취소' : '건너뛰기', icon: 'skip', run: () => toggleSkip(it) },
    { label: '이름 수정', icon: 'tag', run: () => renameItem(it) },
    has && { label: '사진 모두 삭제', icon: 'trash', danger: true, run: () => deleteItemPhotos(it) },
  ]);
}

async function toggleSkip(it) {
  it.skipped = !it.skipped;
  if (it.skipped && S.selectedItemId === it.id) S.selectedItemId = (nextEmpty(S.deck, it) || {}).id || null;
  try { await saveDeck(S.deck); } catch (e) { handleError(e); }
  renderDetail();
}
async function renameItem(it) {
  const v = await promptDialog('라벨 이름', it.label);
  if (!v) return;
  it.label = v;
  try { await saveDeck(S.deck); } catch (e) { handleError(e); }
  renderDetail();
}
async function deleteItemPhotos(it) {
  const n = it.photoIds.length;
  if (!(await confirmDialog(`‘${it.label}’ 사진 ${n}장을 삭제할까요?`, { sub: '되돌릴 수 없습니다.', ok: '삭제', danger: true }))) return;
  const ids = it.photoIds;
  it.photoIds = [];
  it.status = 'empty';
  try { await DB.write([...photoDeleteOps(ids), deckOps(S.deck)]); } catch (e) { handleError(e); }
  renderDetail();
}

function shootNext() {
  const deck = S.deck;
  let it = deck.items.find((i) => i.id === S.selectedItemId && i.status === 'empty');
  if (!it) it = nextEmpty(deck);
  if (!it) {
    toast('남은 미촬영 라벨이 없습니다');
    return;
  }
  S.selectedItemId = it.id;
  startCapture({ mode: 'add', itemId: it.id });
}

// ---------- 라벨 편집 모드 (순서·추가·이름·삭제) ----------
function toggleEdit() {
  S.editMode = !S.editMode;
  renderDetail();
}
function editRow(it, idx) {
  const row = el('div', { class: 'item-row editing', 'data-id': it.id });
  const grip = el('div', { class: 'grip', html: icon('grip'), 'aria-label': '끌어서 순서 바꾸기' });
  grip.addEventListener('pointerdown', (e) => startDrag(e, row, grip));
  row.append(
    grip,
    el('div', { class: 'item-num', text: idx + 1 }),
    el('div', { class: 'item-main' },
      el('div', { class: 'item-label', text: it.label }),
      it.photoIds.length ? el('div', { class: 'item-sub', text: `사진 ${it.photoIds.length}장` }) : null),
    el('button', { class: 'icon-btn', 'aria-label': '이름 수정', html: icon('pencil'), onclick: () => renameItem(it) }),
    el('button', { class: 'icon-btn', 'aria-label': '삭제', html: icon('trash'), style: 'color:var(--danger)', onclick: () => deleteItem(it) }));
  return row;
}
function startDrag(e, row, grip) {
  e.preventDefault();
  const list = $('#item-list');
  try { grip.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
  row.classList.add('dragging');
  let startY = e.clientY;
  let lastScroll = list.scrollTop;
  const onMove = (ev) => {
    // 가장자리에 닿으면 목록을 굴린다
    const lr = list.getBoundingClientRect();
    if (ev.clientY < lr.top + 50) list.scrollTop -= 14;
    else if (ev.clientY > lr.bottom - 50) list.scrollTop += 14;
    startY -= list.scrollTop - lastScroll;
    lastScroll = list.scrollTop;

    const rr = row.getBoundingClientRect();
    const mid = rr.top + rr.height / 2;
    const prev = row.previousElementSibling, next = row.nextElementSibling;
    const before = row.offsetTop;
    if (prev && mid < prev.getBoundingClientRect().top + prev.offsetHeight / 2) list.insertBefore(row, prev);
    else if (next && mid > next.getBoundingClientRect().top + next.offsetHeight / 2) list.insertBefore(next, row);
    startY += row.offsetTop - before;
    row.style.transform = `translateY(${ev.clientY - startY}px)`;
  };
  const onUp = async () => {
    grip.removeEventListener('pointermove', onMove);
    grip.removeEventListener('pointerup', onUp);
    grip.removeEventListener('pointercancel', onUp);
    row.classList.remove('dragging');
    row.style.transform = '';
    const order = [...list.querySelectorAll('.item-row')].map((r) => r.dataset.id);
    const byId = new Map(S.deck.items.map((i) => [i.id, i]));
    S.deck.items = order.map((id) => byId.get(id)).filter(Boolean);
    try { await saveDeck(S.deck); } catch (err) { handleError(err); }
    renderDetail();
  };
  grip.addEventListener('pointermove', onMove);
  grip.addEventListener('pointerup', onUp);
  grip.addEventListener('pointercancel', onUp);
}
async function deleteItem(it) {
  const n = it.photoIds.length;
  const ok = await confirmDialog(`‘${it.label}’ 라벨을 삭제할까요?`, {
    sub: n ? `사진 ${n}장이 함께 삭제됩니다.` : '번호는 자동으로 다시 매깁니다.', ok: '삭제', danger: true,
  });
  if (!ok) return;
  S.deck.items = S.deck.items.filter((i) => i !== it);
  if (S.selectedItemId === it.id) S.selectedItemId = (nextEmpty(S.deck) || {}).id || null;
  try { await DB.write([...photoDeleteOps(it.photoIds), deckOps(S.deck)]); } catch (e) { handleError(e); }
  renderDetail();
}
function addLabelsModal() {
  const ta = el('textarea', { class: 'textarea', placeholder: '한 줄에 하나씩', style: 'min-height:140px' });
  let close;
  const sheet = el('div', { class: 'sheet' },
    el('h2', { class: 'sheet-title', text: '라벨 추가' }),
    el('div', { class: 'sheet-body' }, ta, el('div', { class: 'field-hint', text: '목록 맨 끝에 붙습니다. 순서는 끌어서 바꾸세요.' })),
    el('div', { class: 'sheet-actions' },
      el('button', { class: 'btn', text: '취소', onclick: () => close() }),
      el('button', {
        class: 'btn primary', text: '추가',
        onclick: async () => {
          const labels = parseLines(ta.value);
          if (!labels.length) return;
          S.deck.items.push(...labels.map(makeItem));
          close();
          try { await saveDeck(S.deck); } catch (e) { handleError(e); }
          renderDetail();
          const list = $('#item-list');
          list.scrollTop = list.scrollHeight;
        },
      })));
  close = openModal(sheet, { dismiss: false });
  setTimeout(() => ta.focus(), 50);
}

// ---------- 설정 ----------
async function settingsModal() {
  const radios = [['original', '원본만'], ['labeled', '라벨본만'], ['both', '둘 다']].map(([v, t]) =>
    el('label', { class: 'radio-row' },
      el('input', { type: 'radio', name: 'set-export', checked: Settings.exportMode === v, onchange: () => (Settings.exportMode = v) }),
      el('div', { class: 'rr-main' }, el('div', { class: 'rr-title', text: t }))));
  const sw = el('input', { type: 'checkbox', class: 'switch', checked: Settings.autoNext, onchange: (e) => (Settings.autoNext = e.target.checked) });
  const storage = el('div', { class: 'stat-row' }, el('span', { text: '사용 중인 저장공간' }), el('span', { text: '…' }));
  const persist = el('div', { class: 'stat-row' }, el('span', { text: '데이터 보호(자동 삭제 방지)' }), el('span', { text: '…' }));
  let close;
  const sheet = el('div', { class: 'sheet' },
    el('h2', { class: 'sheet-title', text: '설정' }),
    el('div', { class: 'sheet-body' },
      el('div', { class: 'section' }, el('div', { class: 'section-title', text: '내보내기 기본값' }), el('div', { class: 'card' }, radios)),
      el('div', { class: 'section' }, el('div', { class: 'section-title', text: '촬영' }),
        el('div', { class: 'card' },
          el('label', { class: 'toggle-row' },
            el('div', {}, el('div', { text: '완료 후 바로 다음 촬영' }), el('div', { class: 'tr-sub', text: '편집에서 완료를 누르면 다음 미촬영 라벨의 카메라가 열립니다.' })),
            sw))),
      el('div', { class: 'section' }, el('div', { class: 'section-title', text: '저장공간' }), el('div', { class: 'card' }, storage, persist))),
    el('div', { class: 'sheet-actions' }, el('button', { class: 'btn primary', text: '닫기', onclick: () => close() })));
  close = openModal(sheet);
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      storage.lastChild.textContent = `${fmtBytes(est.usage || 0)}${est.quota ? ` / ${fmtBytes(est.quota)}` : ''}`;
    } else storage.lastChild.textContent = '알 수 없음';
    if (navigator.storage && navigator.storage.persisted) {
      persist.lastChild.textContent = (await navigator.storage.persisted()) ? '켜짐' : '꺼짐';
    } else persist.lastChild.textContent = '지원 안 함';
  } catch (e) { /* 표시만 실패 */ }
}

/* =========================================================
   촬영
   ========================================================= */
// click()은 반드시 사용자 탭 처리 안에서 동기적으로 불러야 iOS가 카메라를 연다
function startCapture(ctx) {
  S.capture = ctx;
  const inp = $('#cam-input');
  inp.value = '';
  inp.click();
}
function startAlbum(ctx) {
  S.capture = ctx;
  const inp = $('#album-input');
  inp.value = '';
  inp.click();
}

async function handleFiles(files) {
  const ctx = S.capture;
  S.capture = null;
  if (!ctx || !files.length || !S.deck) return; // 취소하면 change가 오지 않으므로 상태 변화 없음
  const deck = S.deck;
  const item = deck.items.find((i) => i.id === ctx.itemId);
  if (!item) return;
  try {
    if (ctx.mode === 'retake') {
      const meta = await DB.get('photos', ctx.photoId);
      if (!meta) throw new Error('사진을 찾을 수 없습니다');
      const a = meta.annotations;
      const d = defaultAnnotations().labelBox;
      const marked = a.shapes.length > 0 || a.labelBox.x !== d.x || a.labelBox.y !== d.y || a.labelBox.scale !== d.scale || a.labelBox.bgColor !== d.bgColor;
      const keep = marked ? await confirmDialog('그린 라벨·기호를 유지할까요?', { sub: '새 사진 위에 같은 위치로 다시 얹습니다.', ok: '유지', cancel: '지우기' }) : true;
      busy('사진 저장 중…');
      const img = await decodeImage(files[0]);
      let thumb;
      try {
        thumb = await renderThumb(img);
        Object.assign(meta, { width: img.width, height: img.height });
      } finally { img.close(); }
      Object.assign(meta, { type: files[0].type || 'image/jpeg', size: files[0].size, createdAt: localISO() });
      if (!keep) meta.annotations = defaultAnnotations();
      dropThumb(meta.id);
      await DB.write([
        { store: 'blobs', put: { key: meta.id + ':o', blob: files[0] } },
        { store: 'blobs', put: { key: meta.id + ':t', blob: thumb } },
        { store: 'photos', put: meta },
        deckOps(deck),
      ]);
      busy(false);
      await openEditor(item.id, meta.id);
      return;
    }
    let firstId = null;
    for (let i = 0; i < files.length; i++) {
      busy(files.length > 1 ? `사진 저장 중… ${i + 1}/${files.length}` : '사진 저장 중…');
      const { meta, ops } = await preparePhoto(files[i], item.id);
      item.photoIds.push(meta.id);
      if (item.status === 'empty') item.status = 'shot';
      item.skipped = false;
      try {
        await DB.write([...ops, deckOps(deck)]); // 사진과 덱을 한 번에 저장
      } catch (e) {
        item.photoIds.pop();
        if (!item.photoIds.length) item.status = 'empty';
        throw e;
      }
      if (!firstId) firstId = meta.id;
    }
    S.selectedItemId = item.id;
    busy(false);
    await openEditor(item.id, firstId);
  } catch (e) {
    handleError(e);
    if (S.screen === 'detail') renderDetail();
  } finally {
    busy(false);
  }
}

/* =========================================================
   3. 편집기
   ========================================================= */
const ED = {
  item: null, photoId: null, meta: null, disp: null, W: 0, H: 0,
  view: { s: 1, tx: 0, ty: 0 }, fitS: 1, cw: 0, ch: 0, dpr: 1,
  tool: 'label', color: COLORS[0].v, width: 'medium',
  sel: null, draft: null, undo: [], redo: [],
  pointers: new Map(), pinch: null, g: null, raf: 0, needPhoto: false,
  sliderSnap: null,
};
const pc = () => $('#photo-canvas');
const sc = () => $('#shape-canvas');

async function openEditor(itemId, photoId) {
  const item = S.deck && S.deck.items.find((i) => i.id === itemId);
  if (!item || !item.photoIds.length) return;
  if (!photoId || !item.photoIds.includes(photoId)) photoId = item.photoIds[0];
  busy('사진 불러오는 중…');
  try {
    const meta = await DB.get('photos', photoId);
    const rec = await DB.get('blobs', photoId + ':o');
    if (!meta || !rec) throw new Error('사진을 찾을 수 없습니다');
    const img = await decodeImage(rec.blob);
    let disp;
    try {
      const { w, h } = fitSize(img.width, img.height, MAX_EDIT_LONG, MAX_CANVAS_PIXELS);
      disp = makeCanvas(w, h);
      const c = disp.getContext('2d');
      c.imageSmoothingQuality = 'high';
      c.drawImage(img.src, 0, 0, w, h);
    } finally { img.close(); }
    releaseCanvas(ED.disp);
    Object.assign(ED, { item, photoId, meta, disp, W: meta.width, H: meta.height, sel: null, draft: null, undo: [], redo: [], g: null, pinch: null });
    ED.pointers.clear();
    show('editor');
    renderEditorChrome();
    layoutStage();
    fitView();
    requestRender(true);
  } catch (e) {
    handleError(e);
  } finally {
    busy(false);
  }
}

function releaseEditor() {
  releaseCanvas(ED.disp);
  ED.disp = null;
  ED.item = null;
  ED.photoId = null;
  ED.meta = null;
}

function renderEditorChrome() {
  const deck = S.deck, item = ED.item;
  const idx = deck.items.indexOf(item);
  $('#editor-count').textContent = `${idx + 1} / ${deck.items.length}`;
  $('#editor-label').textContent = item.label;

  const tabs = $('#photo-tabs');
  tabs.replaceChildren(
    ...item.photoIds.map((pid, k) => el('button', {
      class: 'photo-tab' + (pid === ED.photoId ? ' active' : ''),
      text: item.photoIds.length > 1 ? `사진 ${k + 1}` : '사진',
      onclick: () => pid !== ED.photoId && openEditor(item.id, pid),
    })),
    el('button', { class: 'photo-tab', html: '+ 추가', onclick: addPhotoSheet }));

  $('#toolbar').replaceChildren(...TOOLS.map(([t, name, ic]) => el('button', {
    class: 'tool' + (ED.tool === t ? ' active' : ''),
    html: icon(ic) + `<span>${name}</span>`,
    onclick: () => {
      ED.tool = t;
      if (t !== 'label') ED.sel = null;
      renderEditorChrome();
      requestRender(false);
    },
  })));
  renderToolOptions();
  updateUndoButtons();
}

function addPhotoSheet() {
  const item = ED.item;
  actionSheet(`${item.label} — 사진 추가`, [
    { label: '카메라로 촬영', icon: 'camera', run: () => startCapture({ mode: 'add', itemId: item.id }) },
    { label: '앨범에서 가져오기', icon: 'image', run: () => startAlbum({ mode: 'add', itemId: item.id }) },
  ]);
}

function colorSwatches(active, onPick) {
  return el('div', { class: 'opt-group' }, COLORS.map((c) => el('button', {
    class: 'swatch' + (active === c.v ? ' active' : ''), style: `background:${c.v}`, 'aria-label': c.name,
    onclick: () => onPick(c.v),
  })));
}
function widthButtons(active, onPick) {
  return el('div', { class: 'opt-group' }, WIDTH_NAMES.map(([k, name], i) => el('button', {
    class: 'width-btn' + (active === k ? ' active' : ''), 'aria-label': name,
    html: `<span style="height:${[2, 4, 7][i]}px"></span>`,
    onclick: () => onPick(k),
  })));
}
function renderToolOptions() {
  const box = $('#tool-options');
  const ann = ED.meta.annotations;
  const kids = [];
  const selShape = ED.tool === 'label' && ED.sel && ED.sel.type === 'shape' ? ann.shapes[ED.sel.i] : null;
  if (selShape) {
    kids.push(
      colorSwatches(selShape.color, (v) => editAnn(() => (selShape.color = v))),
      el('div', { class: 'opt-sep' }),
      widthButtons(selShape.width, (v) => editAnn(() => (selShape.width = v))),
      el('div', { class: 'opt-sep' }),
      el('button', { class: 'small-btn danger', text: '삭제', onclick: deleteSelected }));
  } else if (ED.tool === 'label') {
    const lb = ann.labelBox;
    const range = el('input', { type: 'range', class: 'opt-range', min: '0.3', max: '4', step: '0.05', value: String(lb.scale), 'aria-label': '라벨 크기' });
    const snap = () => { if (!ED.sliderSnap) ED.sliderSnap = JSON.stringify(ann); };
    range.addEventListener('pointerdown', snap);
    range.addEventListener('touchstart', snap, { passive: true });
    range.addEventListener('input', () => {
      snap();
      lb.scale = Number(range.value);
      requestRender(false);
    });
    range.addEventListener('change', () => {
      if (ED.sliderSnap) commit(ED.sliderSnap);
      ED.sliderSnap = null;
    });
    kids.push(
      el('span', { class: 'opt-label', text: '크기' }),
      range,
      el('div', { class: 'opt-sep' }),
      el('div', { class: 'opt-group' }, LABEL_STYLES.map((st) => el('button', {
        class: 'style-btn' + (lb.textColor === st.textColor && lb.bgColor === st.bgColor ? ' active' : ''),
        style: `color:${st.textColor};background:${st.bgColor}`, text: '가',
        onclick: () => editAnn(() => Object.assign(lb, st)),
      }))));
  } else if (ED.tool === 'eraser') {
    kids.push(el('span', { class: 'opt-hint', text: '지울 도형을 탭하거나 문지르세요' }));
    if (ann.shapes.length) kids.push(el('button', { class: 'small-btn danger', text: '모두 지우기', onclick: () => editAnn(() => (ann.shapes = [])) }));
  } else {
    kids.push(
      colorSwatches(ED.color, (v) => { ED.color = v; renderToolOptions(); }),
      el('div', { class: 'opt-sep' }),
      widthButtons(ED.width, (v) => { ED.width = v; renderToolOptions(); }));
  }
  box.replaceChildren(...kids);
}

// ---------- 실행취소 / 저장 ----------
function editAnn(fn) {
  const snap = JSON.stringify(ED.meta.annotations);
  fn();
  commit(snap);
}
function commit(snap) {
  ED.undo.push(snap);
  if (ED.undo.length > 200) ED.undo.shift();
  ED.redo = [];
  afterChange();
}
function afterChange() {
  if (ED.sel && ED.sel.type === 'shape' && !ED.meta.annotations.shapes[ED.sel.i]) ED.sel = null;
  saveAnnotations();
  renderToolOptions();
  updateUndoButtons();
  requestRender(false);
}
// 도형 하나 그릴 때마다 자동 저장 (메타데이터만 쓰므로 가볍다)
function saveAnnotations() {
  const meta = ED.meta;
  if (!meta) return;
  DB.put('photos', meta).catch(handleError);
}
function updateUndoButtons() {
  $('#undo-btn').disabled = !ED.undo.length;
  $('#redo-btn').disabled = !ED.redo.length;
}
function undo() {
  if (!ED.undo.length) return;
  ED.redo.push(JSON.stringify(ED.meta.annotations));
  ED.meta.annotations = JSON.parse(ED.undo.pop());
  ED.sel = null;
  afterChange();
}
function redo() {
  if (!ED.redo.length) return;
  ED.undo.push(JSON.stringify(ED.meta.annotations));
  ED.meta.annotations = JSON.parse(ED.redo.pop());
  ED.sel = null;
  afterChange();
}
function deleteSelected() {
  if (!ED.sel || ED.sel.type !== 'shape') return;
  const i = ED.sel.i;
  ED.sel = null;
  editAnn(() => ED.meta.annotations.shapes.splice(i, 1));
}

// ---------- 화면 배치 / 그리기 ----------
function layoutStage() {
  const r = $('#stage').getBoundingClientRect();
  ED.dpr = Math.min(window.devicePixelRatio || 1, 3);
  ED.cw = r.width;
  ED.ch = r.height;
  for (const c of [pc(), sc()]) {
    c.width = Math.max(1, Math.round(r.width * ED.dpr));
    c.height = Math.max(1, Math.round(r.height * ED.dpr));
  }
}
function fitView() {
  const pad = 8;
  ED.fitS = Math.max(0.0001, Math.min((ED.cw - pad * 2) / ED.W, (ED.ch - pad * 2) / ED.H));
  ED.view = { s: ED.fitS, tx: (ED.cw - ED.W * ED.fitS) / 2, ty: (ED.ch - ED.H * ED.fitS) / 2 };
  $('#fit-btn').hidden = true;
}
function clampView() {
  const v = ED.view;
  v.s = clamp(v.s, ED.fitS, ED.fitS * 10);
  const w = ED.W * v.s, h = ED.H * v.s;
  v.tx = w <= ED.cw ? (ED.cw - w) / 2 : clamp(v.tx, ED.cw - w, 0);
  v.ty = h <= ED.ch ? (ED.ch - h) / 2 : clamp(v.ty, ED.ch - h, 0);
  $('#fit-btn').hidden = v.s <= ED.fitS * 1.01;
}
function requestRender(photo) {
  if (photo) ED.needPhoto = true;
  if (!ED.raf) ED.raf = requestAnimationFrame(doRender);
}
function doRender() {
  ED.raf = 0;
  if (!ED.meta || !ED.disp) return;
  const { s, tx, ty } = ED.view, d = ED.dpr;
  if (ED.needPhoto) {
    const c = pc().getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, pc().width, pc().height);
    c.setTransform(d * s, 0, 0, d * s, d * tx, d * ty);
    c.imageSmoothingQuality = 'high';
    c.drawImage(ED.disp, 0, 0, ED.W, ED.H);
    ED.needPhoto = false;
  }
  const c2 = sc().getContext('2d');
  c2.setTransform(1, 0, 0, 1, 0, 0);
  c2.clearRect(0, 0, sc().width, sc().height);
  c2.setTransform(d * s, 0, 0, d * s, d * tx, d * ty);
  drawAnnotations(c2, ED.W, ED.H, ED.meta.annotations, ED.item.label, { sel: ED.sel, draft: ED.draft, px: 1 / s });
}

// ---------- 히트 테스트 (사진 픽셀 좌표) ----------
function distSeg(p, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((p.x - ax) * dx + (p.y - ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(p.x - (ax + t * dx), p.y - (ay + t * dy));
}
function hitShape(sh, p, tol) {
  const W = ED.W, H = ED.H;
  const t = tol + lineWidthPx(sh, W, H) / 2;
  if (sh.type === 'circle') {
    const rx = Math.max(sh.rx * W, 1), ry = Math.max(sh.ry * H, 1);
    const r = Math.hypot((p.x - sh.cx * W) / rx, (p.y - sh.cy * H) / ry);
    return Math.abs(r - 1) * Math.min(rx, ry) < t;
  }
  if (sh.type === 'pen') {
    const pts = sh.points;
    if (pts.length === 1) return Math.hypot(p.x - pts[0][0] * W, p.y - pts[0][1] * H) < t;
    for (let i = 1; i < pts.length; i++) {
      if (distSeg(p, pts[i - 1][0] * W, pts[i - 1][1] * H, pts[i][0] * W, pts[i][1] * H) < t) return true;
    }
    return false;
  }
  return distSeg(p, sh.x1 * W, sh.y1 * H, sh.x2 * W, sh.y2 * H) < t;
}
function topShapeAt(p, tol) {
  const shapes = ED.meta.annotations.shapes;
  for (let i = shapes.length - 1; i >= 0; i--) if (hitShape(shapes[i], p, tol)) return i;
  return -1;
}
function currentLabelLayout() {
  return labelLayout(sc().getContext('2d'), ED.W, ED.H, ED.meta.annotations.labelBox, ED.item.label);
}
function translateShape(sh, orig, dx, dy) {
  if (sh.type === 'circle') {
    sh.cx = round5(orig.cx + dx);
    sh.cy = round5(orig.cy + dy);
  } else if (sh.type === 'pen') {
    sh.points = orig.points.map(([x, y]) => [round5(x + dx), round5(y + dy)]);
  } else {
    sh.x1 = round5(orig.x1 + dx); sh.y1 = round5(orig.y1 + dy);
    sh.x2 = round5(orig.x2 + dx); sh.y2 = round5(orig.y2 + dy);
  }
}

// ---------- 터치 입력 ----------
function localPt(e) {
  const r = $('#stage').getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function toImg(p) {
  const { s, tx, ty } = ED.view;
  return { x: (p.x - tx) / s, y: (p.y - ty) / s };
}
function onPDown(e) {
  if (!ED.meta || e.target.closest('.fit-btn')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  try { $('#stage').setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
  ED.pointers.set(e.pointerId, localPt(e));
  if (ED.pointers.size === 2) {
    // 두 손가락: 그리던 것은 취소하고 확대·이동
    cancelGesture();
    const [a, b] = [...ED.pointers.values()];
    ED.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v0: { ...ED.view } };
    return;
  }
  if (ED.pointers.size > 2 || ED.pinch) return;
  beginGesture(localPt(e));
}
function onPMove(e) {
  if (!ED.pointers.has(e.pointerId)) return;
  const p = localPt(e);
  ED.pointers.set(e.pointerId, p);
  if (ED.pinch) {
    if (ED.pointers.size < 2) return;
    const [a, b] = [...ED.pointers.values()];
    const pz = ED.pinch;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const s = clamp(pz.v0.s * (d / pz.d0), ED.fitS, ED.fitS * 10);
    const ix = (pz.m0.x - pz.v0.tx) / pz.v0.s, iy = (pz.m0.y - pz.v0.ty) / pz.v0.s;
    ED.view = { s, tx: m.x - ix * s, ty: m.y - iy * s };
    clampView();
    requestRender(true);
    return;
  }
  if (ED.g) moveGesture(p);
}
function onPUp(e) {
  if (!ED.pointers.has(e.pointerId)) return;
  ED.pointers.delete(e.pointerId);
  if (ED.pinch) {
    if (ED.pointers.size === 0) ED.pinch = null; // 손가락을 모두 뗄 때까지 그리기 안 함
    return;
  }
  if (ED.g) endGesture(e.type === 'pointercancel');
}

function beginGesture(p) {
  const ann = ED.meta.annotations;
  const ip = toImg(p);
  const px = 1 / ED.view.s;
  const g = { kind: null, p0: p, ip0: ip, last: p, moved: false, snap: JSON.stringify(ann) };
  ED.g = g;
  switch (ED.tool) {
    case 'label': {
      const L = currentLabelLayout();
      const prevSel = JSON.stringify(ED.sel);
      if (ED.sel && ED.sel.type === 'label' && Math.hypot(ip.x - (L.x + L.w), ip.y - (L.y + L.h)) < 24 * px) {
        Object.assign(g, { kind: 'resize', scale0: ann.labelBox.scale, lx: L.x, ly: L.y, d0: Math.hypot(ip.x - L.x, ip.y - L.y) || 1 });
      } else if (ip.x >= L.x - 6 * px && ip.x <= L.x + L.w + 6 * px && ip.y >= L.y - 6 * px && ip.y <= L.y + L.h + 6 * px) {
        ED.sel = { type: 'label' };
        Object.assign(g, { kind: 'moveLabel', lb0: { x: ann.labelBox.x, y: ann.labelBox.y } });
      } else {
        const i = topShapeAt(ip, 14 * px);
        if (i >= 0) {
          ED.sel = { type: 'shape', i };
          Object.assign(g, { kind: 'moveShape', i, orig: JSON.parse(JSON.stringify(ann.shapes[i])) });
        } else {
          ED.sel = null;
          Object.assign(g, { kind: 'pan', v0: { ...ED.view } });
        }
      }
      if (JSON.stringify(ED.sel) !== prevSel) renderToolOptions();
      requestRender(false);
      break;
    }
    case 'circle':
    case 'line':
    case 'arrow':
      g.kind = 'draw';
      ED.draft = null;
      break;
    case 'pen':
      g.kind = 'pen';
      ED.draft = { type: 'pen', points: [[round5(ip.x / ED.W), round5(ip.y / ED.H)]], color: ED.color, width: ED.width };
      requestRender(false);
      break;
    case 'eraser':
      g.kind = 'erase';
      eraseAt(ip, g);
      break;
  }
}
function moveGesture(p) {
  const g = ED.g;
  const ann = ED.meta.annotations;
  const ip = toImg(p);
  if (!g.moved && Math.hypot(p.x - g.p0.x, p.y - g.p0.y) < 4) return;
  g.moved = true;
  g.last = p;
  const W = ED.W, H = ED.H;
  switch (g.kind) {
    case 'resize': {
      const d = Math.hypot(ip.x - g.lx, ip.y - g.ly);
      ann.labelBox.scale = round5(clamp(g.scale0 * (d / g.d0), 0.3, 4));
      const r = $('#tool-options input[type=range]');
      if (r) r.value = String(ann.labelBox.scale);
      break;
    }
    case 'moveLabel':
      ann.labelBox.x = round5(clamp(g.lb0.x + (ip.x - g.ip0.x) / W, 0, 0.95));
      ann.labelBox.y = round5(clamp(g.lb0.y + (ip.y - g.ip0.y) / H, 0, 0.95));
      break;
    case 'moveShape':
      translateShape(ann.shapes[g.i], g.orig, (ip.x - g.ip0.x) / W, (ip.y - g.ip0.y) / H);
      break;
    case 'pan':
      ED.view.tx = g.v0.tx + (p.x - g.p0.x);
      ED.view.ty = g.v0.ty + (p.y - g.p0.y);
      clampView();
      requestRender(true);
      return;
    case 'draw': {
      const a = g.ip0;
      if (ED.tool === 'circle') {
        ED.draft = {
          type: 'circle',
          cx: round5((a.x + ip.x) / 2 / W), cy: round5((a.y + ip.y) / 2 / H),
          rx: round5(Math.abs(ip.x - a.x) / 2 / W), ry: round5(Math.abs(ip.y - a.y) / 2 / H),
          color: ED.color, width: ED.width,
        };
      } else {
        ED.draft = {
          type: ED.tool,
          x1: round5(a.x / W), y1: round5(a.y / H), x2: round5(ip.x / W), y2: round5(ip.y / H),
          color: ED.color, width: ED.width,
        };
      }
      break;
    }
    case 'pen': {
      const pts = ED.draft.points;
      const lp = pts[pts.length - 1];
      if (Math.hypot(ip.x - lp[0] * W, ip.y - lp[1] * H) * ED.view.s >= 2) pts.push([round5(ip.x / W), round5(ip.y / H)]);
      break;
    }
    case 'erase':
      eraseAt(ip, g);
      return;
  }
  requestRender(false);
}
function endGesture(cancelled) {
  const g = ED.g;
  ED.g = null;
  if (cancelled) { restoreGesture(g); return; }
  const ann = ED.meta.annotations;
  switch (g.kind) {
    case 'resize':
    case 'moveLabel':
    case 'moveShape':
      if (g.moved) commit(g.snap);
      break;
    case 'draw':
      if (ED.draft && Math.hypot(g.last.x - g.p0.x, g.last.y - g.p0.y) > 8) {
        ann.shapes.push(ED.draft);
        ED.draft = null;
        commit(g.snap);
      }
      break;
    case 'pen':
      ann.shapes.push(ED.draft);
      ED.draft = null;
      commit(g.snap);
      break;
    case 'erase':
      if (g.erased) commit(g.snap);
      break;
  }
  ED.draft = null;
  requestRender(false);
}
function restoreGesture(g) {
  if (!g) return;
  ED.meta.annotations = JSON.parse(g.snap);
  ED.draft = null;
  if (g.kind === 'pan') ED.view = { ...g.v0 };
  requestRender(true);
}
function cancelGesture() {
  const g = ED.g;
  ED.g = null;
  restoreGesture(g);
}
function eraseAt(ip, g) {
  const i = topShapeAt(ip, 16 / ED.view.s);
  if (i < 0) return;
  ED.meta.annotations.shapes.splice(i, 1);
  g.erased = true;
  requestRender(false);
}

// ---------- 편집 화면 버튼 ----------
async function editorBack() {
  try { await saveDeck(S.deck); } catch (e) { handleError(e); }
  releaseEditor();
  openDetail(S.deck.id, { keepSelection: true });
}
function editorDone() {
  const deck = S.deck, item = ED.item;
  if (!item) return;
  item.status = 'done';
  const next = nextEmpty(deck, item);
  S.selectedItemId = next ? next.id : null;
  // 카메라는 탭 처리 안에서 바로 열어야 하므로 저장보다 먼저
  if (next && Settings.autoNext) startCapture({ mode: 'add', itemId: next.id });
  (async () => {
    try { await saveDeck(deck); } catch (e) { handleError(e); }
    releaseEditor();
    if (next) {
      openDetail(deck.id, { keepSelection: true });
    } else {
      toast('남은 라벨이 없습니다. 내보내기로 넘어갑니다.');
      openExport();
    }
  })();
}
function editorMenu() {
  const item = ED.item;
  actionSheet(item.label, [
    { label: '사진 추가 촬영', icon: 'camera', run: () => startCapture({ mode: 'add', itemId: item.id }) },
    { label: '앨범에서 추가', icon: 'image', run: () => startAlbum({ mode: 'add', itemId: item.id }) },
    { label: '화면 맞춤', icon: 'fit', run: () => { fitView(); requestRender(true); } },
    { label: '이 사진 삭제', icon: 'trash', danger: true, run: deleteCurrentPhoto },
  ]);
}
async function deleteCurrentPhoto() {
  const item = ED.item, pid = ED.photoId;
  if (!(await confirmDialog('이 사진을 삭제할까요?', { sub: '그린 라벨·기호도 함께 지워집니다.', ok: '삭제', danger: true }))) return;
  item.photoIds = item.photoIds.filter((x) => x !== pid);
  if (!item.photoIds.length) item.status = 'empty';
  try { await DB.write([...photoDeleteOps([pid]), deckOps(S.deck)]); } catch (e) { handleError(e); }
  if (item.photoIds.length) {
    openEditor(item.id, item.photoIds[0]);
  } else {
    releaseEditor();
    S.selectedItemId = item.id;
    openDetail(S.deck.id, { keepSelection: true });
  }
}

/* =========================================================
   4. 내보내기
   ========================================================= */
const EX = { mode: 'original', partial: false, checked: new Set(), metas: new Map(), running: false, cancel: false, progress: null, zip: null };

async function openExport() {
  const deck = S.deck;
  if (!deck) return showDecks();
  EX.mode = Settings.exportMode; // 매번 설정의 기본값(원본만)으로 시작
  EX.partial = false;
  EX.checked = new Set(deck.items.filter((i) => i.photoIds.length).map((i) => i.id));
  EX.zip = null;
  EX.progress = null;
  EX.metas = new Map();
  show('export');
  renderExport();
  try {
    for (const pid of deck.items.flatMap((i) => i.photoIds)) {
      const m = await DB.get('photos', pid);
      if (m) EX.metas.set(pid, m);
    }
  } catch (e) { handleError(e); }
  renderExport();
}

function exportItems() {
  return S.deck.items.filter((i) => i.photoIds.length && (!EX.partial || EX.checked.has(i.id)));
}
function emptyCount() {
  return S.deck.items.filter((i) => !i.photoIds.length).length;
}
function digitsFor(n) {
  return n <= 9 ? 1 : n <= 99 ? 2 : 3;
}
// 경로 규칙: 덱이름/01_라벨.jpg, 여러 장이면 03-1_, 둘 다면 original/·labeled/
function buildEntries(flat) {
  const deck = S.deck;
  const digits = digitsFor(deck.items.length);
  const root = safeName(deck.name);
  const mode = EX.mode;
  const sel = new Set(exportItems());
  const out = [];
  deck.items.forEach((it, idx) => {
    if (!sel.has(it)) return;
    const num = String(idx + 1).padStart(digits, '0');
    it.photoIds.forEach((pid, k) => {
      const meta = EX.metas.get(pid);
      const n = it.photoIds.length > 1 ? `${num}-${k + 1}` : num;
      const base = `${n}_${cut(safeName(it.label), 50)}`;
      const origName = `${base}.${extFor(meta && meta.type)}`;
      if (mode === 'original' || mode === 'both') {
        out.push({ pid, item: it, variant: 'original', name: origName, path: mode === 'both' ? `${root}/original/${origName}` : `${root}/${origName}` });
      }
      if (mode === 'labeled' || mode === 'both') {
        const ln = flat && mode === 'both' ? `${base}_labeled.jpg` : `${base}.jpg`;
        out.push({ pid, item: it, variant: 'labeled', name: ln, path: mode === 'both' ? `${root}/labeled/${base}.jpg` : `${root}/${base}.jpg` });
      }
    });
  });
  return out;
}
function zipName() {
  return `${safeName(S.deck.name)}_${localDate()}.zip`;
}

function renderExport() {
  const deck = S.deck;
  const body = $('#export-body');
  const empty = emptyCount();
  const entries = buildEntries(false);
  let bytes = 0;
  for (const e of entries) {
    const m = EX.metas.get(e.pid);
    if (m) bytes += e.variant === 'original' ? m.size : m.size * 1.1; // 라벨본은 원본과 비슷한 크기로 추정
  }
  const opts = [
    ['original', '원본만', '원본 사진만 저장'],
    ['labeled', '라벨본만', '라벨·기호를 합성한 사진만 저장'],
    ['both', '둘 다', 'original/, labeled/ 하위 폴더로 나눠 저장'],
  ];
  const kids = [];
  kids.push(el('div', { class: 'section' },
    el('div', { class: 'section-title', text: '저장 형식' }),
    el('div', { class: 'card' }, opts.map(([v, t, sub]) => el('label', { class: 'radio-row' },
      el('input', { type: 'radio', name: 'ex-mode', checked: EX.mode === v, disabled: EX.running, onchange: () => { EX.mode = v; EX.zip = null; renderExport(); } }),
      el('div', { class: 'rr-main' }, el('div', { class: 'rr-title', text: t }), el('div', { class: 'rr-sub', text: sub })),
      v === Settings.exportMode && el('span', { class: 'rr-tag', text: '기본' }))))));

  kids.push(el('div', { class: 'section' }, empty
    ? el('div', { class: 'warn-box', html: icon('warn') + `<div><b>${empty}개 미촬영</b><br>미촬영 라벨은 파일 없이 번호만 비워 둡니다.</div>` })
    : el('div', { class: 'ok-box', html: icon('check') + '<div>모든 라벨을 촬영했습니다</div>' })));

  kids.push(el('div', { class: 'section' },
    el('div', { class: 'section-title', text: '요약' }),
    el('div', { class: 'card' },
      el('div', { class: 'stat-row' }, el('span', { text: '파일 수' }), el('span', { text: `${entries.length}개` })),
      el('div', { class: 'stat-row' }, el('span', { text: '예상 용량' }), el('span', { text: EX.metas.size ? `약 ${fmtBytes(bytes)}` : '계산 중…' })),
      el('div', { class: 'stat-row' }, el('span', { text: 'ZIP 이름' }), el('span', { text: zipName(), style: 'max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' })),
      entries[0] && el('div', { class: 'stat-row' }, el('span', { text: '첫 파일' }), el('span', { text: entries[0].path.split('/').slice(1).join('/'), style: 'max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' })))));

  const partialSw = el('input', {
    type: 'checkbox', class: 'switch', checked: EX.partial, disabled: EX.running,
    onchange: (e) => { EX.partial = e.target.checked; EX.zip = null; renderExport(); },
  });
  const partialCard = el('div', { class: 'card' },
    el('label', { class: 'toggle-row' }, el('div', {}, el('div', { text: '일부만 내보내기' }), el('div', { class: 'tr-sub', text: '체크한 라벨만 저장합니다.' })), partialSw));
  if (EX.partial) {
    const digits = digitsFor(deck.items.length);
    deck.items.forEach((it, idx) => {
      const has = it.photoIds.length > 0;
      partialCard.append(el('label', { class: 'check-row' + (has ? '' : ' disabled') },
        el('input', {
          type: 'checkbox', checked: has && EX.checked.has(it.id), disabled: !has || EX.running,
          onchange: (e) => { e.target.checked ? EX.checked.add(it.id) : EX.checked.delete(it.id); EX.zip = null; renderExport(); },
        }),
        el('span', { class: 'cr-num', text: String(idx + 1).padStart(digits, '0') }),
        el('span', { class: 'cr-label', text: it.label }),
        el('span', { class: 'cr-sub', text: has ? (it.photoIds.length > 1 ? `${it.photoIds.length}장` : '') : '미촬영' })));
    });
  }
  kids.push(el('div', { class: 'section' }, partialCard));

  if (EX.progress) {
    kids.push(el('div', { class: 'section' }, el('div', { class: 'card export-progress' },
      el('div', { class: 'progress' }, el('div', { class: 'progress-fill', id: 'ex-fill', style: `width:${EX.progress.pct}%` })),
      el('div', { class: 'ep-text', id: 'ex-text', text: EX.progress.text }))));
  }
  if (EX.zip && !EX.running) {
    kids.push(el('div', { class: 'section' },
      el('div', { class: 'section-title', text: 'ZIP 준비 완료' }),
      el('div', { class: 'card' },
        el('div', { class: 'stat-row' }, el('span', { text: EX.zip.name }), el('span', { text: fmtBytes(EX.zip.blob.size) })),
        el('div', { style: 'display:flex;gap:10px;padding:12px 16px' },
          el('button', { class: 'btn', style: 'flex:1', html: icon('download') + '다시 내려받기', onclick: () => downloadBlob(EX.zip.blob, EX.zip.name) }),
          el('button', { class: 'btn', style: 'flex:1', html: icon('share') + '파일에 저장', onclick: shareZip }))),
      el('div', { class: 'field-hint', text: '파일 앱에서 ZIP을 탭하면 덱 이름 폴더로 풀립니다.' })));
  }
  body.replaceChildren(...kids);
}

function setProgress(pct, text) {
  EX.progress = { pct, text };
  const f = $('#ex-fill'), t = $('#ex-text');
  if (f && t) {
    f.style.width = `${pct}%`;
    t.textContent = text;
  } else {
    renderExport();
  }
}

async function renderLabeled(meta, label) {
  const rec = await DB.get('blobs', meta.id + ':o');
  if (!rec) throw new Error('원본 사진이 없습니다');
  const img = await decodeImage(rec.blob);
  try {
    const { w, h } = fitSize(img.width, img.height, MAX_EXPORT_LONG, MAX_CANVAS_PIXELS);
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.src, 0, 0, w, h);
    ctx.setTransform(w / meta.width, 0, 0, h / meta.height, 0, 0);
    drawAnnotations(ctx, meta.width, meta.height, meta.annotations, label, null);
    const b = await canvasBlob(c, 'image/jpeg', 0.92);
    releaseCanvas(c);
    return b;
  } finally {
    img.close();
  }
}

// 사진을 한 장씩 꺼내 준비한다. kind: 'zip' | 'files'
async function prepareExport(kind) {
  const entries = buildEntries(kind === 'files');
  if (!entries.length) throw new Error('내보낼 사진이 없습니다');
  const zip = kind === 'zip' ? new JSZip() : null;
  const files = [];
  for (let i = 0; i < entries.length; i++) {
    if (EX.cancel) throw new DOMException('취소', 'AbortError');
    const e = entries[i];
    setProgress(Math.round((i / entries.length) * (zip ? 60 : 100)), `사진 준비 ${i + 1} / ${entries.length}`);
    const meta = EX.metas.get(e.pid) || (await DB.get('photos', e.pid));
    let blob;
    if (e.variant === 'original') {
      const rec = await DB.get('blobs', e.pid + ':o');
      if (!rec) throw new Error(`${e.name}: 원본이 없습니다`);
      blob = rec.blob;
    } else {
      blob = await renderLabeled(meta, e.item.label);
    }
    if (zip) zip.file(e.path, blob, { binary: true });
    else files.push(new File([blob], e.name, { type: e.variant === 'original' ? meta.type : 'image/jpeg' }));
  }
  if (!zip) return files;
  // JPEG는 이미 압축돼 있으므로 STORE로 묶어 메모리와 시간을 아낀다
  return zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true, mimeType: 'application/zip' }, (m) => {
    setProgress(60 + Math.round(m.percent * 0.4), `ZIP 묶는 중 ${Math.round(m.percent)}%`);
  });
}

async function confirmMissing() {
  const empty = EX.partial ? 0 : emptyCount();
  if (!empty) return true;
  return confirmDialog(`${empty}개 미촬영. 그래도 저장할까요?`, { ok: '저장' });
}

async function exportSave() {
  if (EX.running) return;
  if (!exportItems().length) { toast('내보낼 사진이 없습니다'); return; }
  if (!(await confirmMissing())) return;
  if (!window.JSZip) { alertDialog('ZIP 라이브러리를 불러오지 못했습니다', '인터넷에 한 번 연결한 뒤 다시 시도하세요.'); return; }
  EX.running = true;
  EX.cancel = false;
  EX.zip = null;
  setProgress(0, '준비 중…');
  try {
    const blob = await prepareExport('zip');
    EX.zip = { blob, name: zipName() };
    setProgress(100, '완료');
    downloadBlob(blob, EX.zip.name);
  } catch (e) {
    if (e.name === 'AbortError') toast('내보내기를 중단했습니다');
    else {
      handleError(e);
      toast('ZIP 생성에 실패했습니다. 다시 저장하면 처음부터 만듭니다.');
    }
  } finally {
    EX.running = false;
    EX.progress = null;
    if (S.screen === 'export') renderExport();
  }
}

async function exportShare() {
  if (EX.running) return;
  if (!navigator.canShare || !navigator.share) { toast('이 기기에서는 공유 시트로 파일을 보낼 수 없습니다'); return; }
  if (!exportItems().length) { toast('내보낼 사진이 없습니다'); return; }
  if (!(await confirmMissing())) return;
  EX.running = true;
  EX.cancel = false;
  setProgress(0, '준비 중…');
  let files;
  try {
    files = await prepareExport('files');
  } catch (e) {
    if (e.name === 'AbortError') toast('내보내기를 중단했습니다');
    else handleError(e);
  } finally {
    EX.running = false;
    EX.progress = null;
    if (S.screen === 'export') renderExport();
  }
  if (!files) return;
  if (!navigator.canShare({ files })) { toast('이 파일들은 공유 시트로 보낼 수 없습니다'); return; }
  // 준비가 오래 걸리면 탭 권한이 만료되므로, 공유는 버튼을 한 번 더 눌러 연다
  let close;
  const box = el('div', { class: 'dialog' },
    el('div', { class: 'dialog-msg', text: `파일 ${files.length}개 준비 완료` }),
    el('div', { class: 'dialog-sub', text: '‘파일에 저장’이나 AirDrop을 고르세요.' }),
    el('div', { class: 'sheet-actions' },
      el('button', { class: 'btn', text: '닫기', onclick: () => close() }),
      el('button', {
        class: 'btn primary', html: icon('share') + '공유',
        onclick: () => {
          close();
          navigator.share({ files, title: S.deck.name }).catch((e) => e.name !== 'AbortError' && handleError(e));
        },
      })));
  close = openModal(box, { center: true, dismiss: false });
}

function shareZip() {
  if (!EX.zip) return;
  const file = new File([EX.zip.blob], EX.zip.name, { type: 'application/zip' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: EX.zip.name }).catch((e) => e.name !== 'AbortError' && handleError(e));
  } else {
    downloadBlob(EX.zip.blob, EX.zip.name);
  }
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: name, style: 'display:none' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function exportBack() {
  if (EX.running) {
    if (!(await confirmDialog('내보내기를 중단할까요?', { ok: '중단', danger: true }))) return;
    EX.cancel = true;
  }
  EX.zip = null;
  openDetail(S.deck.id, { keepSelection: true });
}

/* =========================================================
   시작
   ========================================================= */
const ACTIONS = {
  'settings': settingsModal,
  'new-deck': () => newDeckModal(),
  'import-deck': () => pickDeckFile((r) => newDeckModal(r)),
  'back-decks': () => showDecks(),
  'toggle-edit': toggleEdit,
  'toggle-filter': () => { S.filterEmpty = !S.filterEmpty; renderDetail(); },
  'detail-menu': () => deckMenu(S.deck, false),
  'editor-back': editorBack,
  'editor-menu': editorMenu,
  'editor-done': editorDone,
  'undo': undo,
  'redo': redo,
  'retake': () => ED.item && startCapture({ mode: 'retake', itemId: ED.item.id, photoId: ED.photoId }),
  'fit': () => { fitView(); requestRender(true); },
  'export-back': exportBack,
  'export-save': exportSave,
  'export-share': exportShare,
};
const STATIC_ICONS = {
  'settings': 'gear', 'back-decks': 'back', 'detail-menu': 'more', 'editor-back': 'back',
  'editor-menu': 'more', 'undo': 'undo', 'redo': 'redo', 'export-back': 'back',
};

function bindEvents() {
  for (const [action, ic] of Object.entries(STATIC_ICONS)) {
    for (const b of document.querySelectorAll(`[data-action="${action}"]`)) b.innerHTML = icon(ic);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (b && ACTIONS[b.dataset.action]) ACTIONS[b.dataset.action](e);
  });
  $('#cam-input').addEventListener('change', (e) => handleFiles([...e.target.files]));
  $('#album-input').addEventListener('change', (e) => handleFiles([...e.target.files]));
  $('#deck-file-input').addEventListener('change', onDeckFile);

  const stage = $('#stage');
  stage.addEventListener('pointerdown', onPDown);
  stage.addEventListener('pointermove', onPMove);
  stage.addEventListener('pointerup', onPUp);
  stage.addEventListener('pointercancel', onPUp);
  // 브라우저 기본 확대 막기
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  stage.addEventListener('touchstart', (e) => e.target.closest('.fit-btn') || e.preventDefault(), { passive: false });

  window.addEventListener('resize', () => {
    if (S.screen !== 'editor' || !ED.meta) return;
    layoutStage();
    fitView();
    requestRender(true);
  });
}

async function init() {
  Settings.load();
  bindEvents();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  // 저장공간이 부족할 때 웹앱 데이터가 지워지지 않도록 요청
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((p) => p || navigator.storage.persist()).catch(() => {});
  }
  try {
    await DB.open();
  } catch (e) {
    alertDialog('데이터를 열 수 없습니다', '개인정보 보호 브라우징에서는 저장이 되지 않을 수 있습니다.');
    return;
  }
  // 마지막 화면 복원
  const last = readLast();
  try {
    if (last && last.deckId) {
      const deck = await DB.get('decks', last.deckId);
      if (deck) {
        S.deck = deck;
        const item = last.itemId && deck.items.find((i) => i.id === last.itemId);
        if (last.screen === 'editor' && item && item.photoIds.includes(last.photoId)) {
          S.selectedItemId = item.id;
          await openEditor(item.id, last.photoId);
          if (S.screen === 'editor') return;
        }
        if (last.screen === 'export') { await openExport(); return; }
        await openDetail(deck.id);
        return;
      }
    }
  } catch (e) { console.error(e); }
  await showDecks();
}

init();

/* ===== NeoBook Web v2.0 — app.js ===== */
'use strict';

// ── STATE ──────────────────────────────────────────────────────────────────────
let currentTool    = 'select';
let selectedWidget = null;
let widgets        = [];
let widgetCounter  = 0;
let variables      = {};
let currentPage    = 1;
const totalPages   = 3;
let dragType       = null;
let cmdHistory     = [];
let cmdHistoryIdx  = -1;
let projectName    = 'Sin título';
let zIndexCounter  = 1;

// ── LOGGING ───────────────────────────────────────────────────────────────────
function log(msg, type = 'info') {
  const out  = document.getElementById('console-output');
  const t    = new Date().toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const line = document.createElement('div');
  line.className = 'console-line';
  line.innerHTML = `<span class="console-time">${t}</span><span class="console-${type}">${escHtml(String(msg))}</span>`;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}
function clearConsole() { document.getElementById('console-output').innerHTML = ''; }
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── CANVAS THEMES ─────────────────────────────────────────────────────────────
function applyCanvasTheme(theme) {
  const canvas = document.getElementById('page-canvas');
  canvas.className = theme === 'light' ? '' : `theme-${theme}`;
  log(`Tema canvas: ${theme}`, 'ok');
}

// ── TOOL ──────────────────────────────────────────────────────────────────────
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('tool-' + tool) || document.getElementById('tool-' + tool + '2');
  if (el) el.classList.add('active');
  log(`Herramienta: ${tool}`, 'info');
}

// ── TABS ──────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.neo-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const dv = document.getElementById('design-view');
  const sv = document.getElementById('script-view');
  const vv = document.getElementById('vars-view');
  dv.style.display = 'none'; dv.style.flex = '';
  sv.style.display = 'none';
  vv.style.display = 'none';
  if      (tab === 'design') { dv.style.display = 'flex'; dv.style.flex = '1'; }
  else if (tab === 'script') { sv.style.display = 'flex'; }
  else if (tab === 'vars')   { vv.style.display = 'block'; renderVars(); }
}

function switchRPanel(panel) {
  document.querySelectorAll('.rpanel-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('rtab-' + panel).classList.add('active');
  document.getElementById('rpanel-props').style.display  = panel === 'props'  ? 'block' : 'none';
  document.getElementById('rpanel-style').style.display  = panel === 'style'  ? 'block' : 'none';
  document.getElementById('rpanel-events').style.display = panel === 'events' ? 'block' : 'none';
}

// ── WIDGET FACTORY ────────────────────────────────────────────────────────────
const WIDGET_DEFAULTS = {
  button:   { w:120, h:38,  html: (id) => `<button style="width:100%;height:100%;background:#4f46e5;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;font-family:Syne,sans-serif;transition:opacity .15s" onmouseenter="this.style.opacity='.8'" onmouseleave="this.style.opacity='1'" onclick="widgetEvent('${id}','click')">Botón</button>` },
  label:    { w:120, h:30,  html: (id) => `<span style="font-size:16px;color:#111;font-family:Syne,sans-serif;font-weight:600" contenteditable="false">Etiqueta</span>` },
  input:    { w:180, h:34,  html: (id) => `<input type="text" placeholder="Ingresa texto..." style="width:100%;height:100%;border:1.5px solid #d1d5db;border-radius:6px;padding:0 10px;font-size:13px;box-sizing:border-box;outline:none;font-family:Inter,sans-serif;transition:border-color .15s" onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#d1d5db'" oninput="widgetEvent('${id}','change',this.value)">` },
  checkbox: { w:130, h:28,  html: (id) => `<label style="display:flex;align-items:center;gap:7px;font-size:13px;color:#111;font-family:Inter,sans-serif;cursor:pointer"><input type="checkbox" style="width:15px;height:15px;accent-color:#6366f1" onchange="widgetEvent('${id}','change',this.checked)"> Opción</label>` },
  select:   { w:150, h:34,  html: (id) => `<select style="width:100%;height:100%;border:1.5px solid #d1d5db;border-radius:6px;font-size:13px;padding:0 8px;background:#fff;cursor:pointer;font-family:Inter,sans-serif" onchange="widgetEvent('${id}','change',this.value)"><option>Opción 1</option><option>Opción 2</option><option>Opción 3</option></select>` },
  textarea: { w:200, h:90,  html: (id) => `<textarea placeholder="Área de texto..." style="width:100%;height:100%;border:1.5px solid #d1d5db;border-radius:6px;font-size:13px;padding:8px 10px;resize:none;box-sizing:border-box;font-family:Inter,sans-serif;outline:none" oninput="widgetEvent('${id}','change',this.value)"></textarea>` },
  progress: { w:200, h:24,  html: (id) => `<div style="width:100%;height:100%;background:#e5e7eb;border-radius:99px;overflow:hidden"><div id="${id}_bar" style="width:60%;height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:99px;transition:width .4s"></div></div>` },
  slider:   { w:200, h:30,  html: (id) => `<input type="range" min="0" max="100" value="50" style="width:100%;height:100%;accent-color:#6366f1;cursor:pointer" oninput="widgetEvent('${id}','change',this.value)">` },
  rect:     { w:140, h:90,  html: (id) => `<div style="width:100%;height:100%;background:#e0e7ff;border:2px solid #6366f1;border-radius:6px"></div>` },
  circle:   { w:80,  h:80,  html: (id) => `<div style="width:100%;height:100%;background:#fce7f3;border:2px solid #ec4899;border-radius:50%"></div>` },
  card:     { w:180, h:120, html: (id) => `<div style="width:100%;height:100%;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:14px;box-sizing:border-box;font-family:Inter,sans-serif"><div style="font-weight:700;font-size:14px;color:#111;margin-bottom:5px">Título card</div><div style="font-size:12px;color:#6b7280;line-height:1.5">Contenido de la tarjeta...</div></div>` },
  badge:    { w:80,  h:26,  html: (id) => `<span style="display:inline-flex;align-items:center;background:#dbeafe;color:#1d4ed8;border-radius:99px;padding:3px 12px;font-size:11px;font-weight:600;font-family:Inter,sans-serif">Badge</span>` },
  hline:    { w:200, h:16,  html: (id) => `<div style="width:100%;height:2px;background:#d1d5db;margin-top:7px;border-radius:2px"></div>` },
  image:    { w:140, h:100, html: (id) => `<div style="width:100%;height:100%;background:#f9fafb;border:2px dashed #d1d5db;display:flex;align-items:center;justify-content:center;font-size:11px;color:#9ca3af;border-radius:8px;flex-direction:column;gap:4px;font-family:Inter,sans-serif">🖼<span>Imagen</span></div>` },
};

function makeWidget(type, x, y) {
  const def = WIDGET_DEFAULTS[type];
  if (!def) { log(`Tipo desconocido: ${type}`, 'err'); return; }
  const id   = 'w_' + (++widgetCounter);
  const html = def.html(id);

  const wObj = {
    id, type,
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
    w: def.w, h: def.h,
    html, name: type + '_' + widgetCounter,
    events: {}, style: {}, zIndex: ++zIndexCounter
  };
  widgets.push(wObj);
  renderWidget(wObj);
  selectWidget(wObj);
  updateObjCount();
  log(`Creado: ${wObj.name} en (${wObj.x}, ${wObj.y})`, 'ok');
  return wObj;
}

function renderWidget(wObj) {
  const canvas = document.getElementById('page-canvas');
  let el = document.getElementById(wObj.id);
  if (!el) {
    el = document.createElement('div');
    el.className = 'canvas-widget';
    el.id = wObj.id;
    el.innerHTML = wObj.html + '<div class="resize-handle"></div>';
    canvas.appendChild(el);
    makeDraggable(el, wObj);
    el.addEventListener('click', e => { e.stopPropagation(); selectWidget(wObj); });
  }
  el.style.left    = wObj.x + 'px';
  el.style.top     = wObj.y + 'px';
  el.style.width   = wObj.w + 'px';
  el.style.height  = wObj.h + 'px';
  el.style.zIndex  = wObj.zIndex;
}

function makeDraggable(el, wObj) {
  let sx, sy, ox, oy, resizing = false;
  const handle = el.querySelector('.resize-handle');

  el.addEventListener('mousedown', e => {
    if (e.target === handle) {
      resizing = true; sx = e.clientX; sy = e.clientY; ox = wObj.w; oy = wObj.h;
    } else {
      if (currentTool !== 'select') return;
      sx = e.clientX - wObj.x; sy = e.clientY - wObj.y;
    }
    e.stopPropagation();
    const mm = e2 => {
      if (resizing) {
        wObj.w = Math.max(30, ox + e2.clientX - sx);
        wObj.h = Math.max(16, oy + e2.clientY - sy);
        el.style.width = wObj.w + 'px'; el.style.height = wObj.h + 'px';
      } else {
        wObj.x = e2.clientX - sx; wObj.y = e2.clientY - sy;
        el.style.left = wObj.x + 'px'; el.style.top = wObj.y + 'px';
      }
    };
    const mu = () => { resizing = false; document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
  });
}

function selectWidget(wObj) {
  selectedWidget = wObj;
  document.querySelectorAll('.canvas-widget').forEach(el => el.classList.remove('selected'));
  if (wObj) {
    document.getElementById(wObj.id).classList.add('selected');
    document.getElementById('selected-info').textContent = wObj.name;
    renderPropsPanel(wObj);
    renderStylePanel(wObj);
    renderEventsPanel(wObj);
  }
}

function canvasClick(e) {
  if (e.target.id !== 'page-canvas') return;
  selectedWidget = null;
  document.querySelectorAll('.canvas-widget').forEach(el => el.classList.remove('selected'));
  document.getElementById('selected-info').textContent = 'Nada seleccionado';
  document.getElementById('rpanel-props').innerHTML  = '<div class="props-empty">Selecciona un<br>objeto en el canvas</div>';
  document.getElementById('rpanel-style').innerHTML  = '<div class="props-empty">Selecciona un<br>objeto para estilizarlo</div>';
  document.getElementById('rpanel-events').innerHTML = '<div class="props-empty">—</div>';

  if (currentTool !== 'select') {
    const rect = document.getElementById('page-canvas').getBoundingClientRect();
    makeWidget(currentTool, e.clientX - rect.left - 30, e.clientY - rect.top - 16);
  }
}

// ── DRAG & DROP FROM PALETTE ──────────────────────────────────────────────────
function paletteDrag(e, type) { dragType = type; }
function canvasDrop(e) {
  if (!dragType) return;
  const rect = document.getElementById('page-canvas').getBoundingClientRect();
  makeWidget(dragType, e.clientX - rect.left - 30, e.clientY - rect.top - 16);
  dragType = null;
}
function addFromPalette(type) {
  makeWidget(type, 20 + Math.random() * 180, 20 + Math.random() * 120);
}

// ── PROPERTIES PANEL ─────────────────────────────────────────────────────────

// Types that have editable inner text
const TEXT_EDITABLE = ['button', 'label', 'badge'];
// Types that have a placeholder
const PLACEHOLDER_EDITABLE = ['input', 'textarea'];
// Card has title + body
const CARD_TYPE = ['card'];
// Checkbox has label text
const CHECKBOX_TYPE = ['checkbox'];
// Select has comma-separated options
const SELECT_TYPE = ['select'];

function getInnerText(wObj) {
  const el = document.getElementById(wObj.id);
  if (!el) return '';
  const inner = el.firstElementChild;
  if (!inner) return '';
  if (inner.tagName === 'BUTTON' || inner.tagName === 'SPAN') return inner.textContent;
  return '';
}

function setInnerText(wObj, text) {
  const el = document.getElementById(wObj.id);
  if (!el) return;
  const inner = el.firstElementChild;
  if (!inner) return;
  if (inner.tagName === 'BUTTON' || inner.tagName === 'SPAN') {
    inner.textContent = text;
    wObj._text = text;
  }
}

function renderPropsPanel(wObj) {
  // Build text-editing rows depending on widget type
  let extraRows = '';

  if (TEXT_EDITABLE.includes(wObj.type)) {
    const cur = wObj._text !== undefined ? wObj._text : getInnerText(wObj);
    extraRows += `
    <div class="prop-row">
      <div class="prop-label">📝 Texto</div>
      <input class="prop-input" id="prop-text" value="${escHtml(cur)}"
        oninput="setInnerText(selectedWidget, this.value)"
        placeholder="Escribe el texto...">
    </div>`;
  }

  if (PLACEHOLDER_EDITABLE.includes(wObj.type)) {
    const el = document.getElementById(wObj.id);
    const inner = el ? el.firstElementChild : null;
    const cur = inner ? (inner.placeholder || '') : '';
    extraRows += `
    <div class="prop-row">
      <div class="prop-label">💬 Placeholder</div>
      <input class="prop-input" value="${escHtml(cur)}"
        oninput="setWidgetPlaceholder(this.value)">
    </div>`;
  }

  if (CHECKBOX_TYPE.includes(wObj.type)) {
    const el = document.getElementById(wObj.id);
    const lbl = el ? el.firstElementChild : null;
    const cur = lbl ? lbl.textContent.trim() : 'Opción';
    extraRows += `
    <div class="prop-row">
      <div class="prop-label">📝 Etiqueta</div>
      <input class="prop-input" value="${escHtml(cur)}"
        oninput="setCheckboxLabel(this.value)">
    </div>`;
  }

  if (SELECT_TYPE.includes(wObj.type)) {
    const el = document.getElementById(wObj.id);
    const sel = el ? el.firstElementChild : null;
    const opts = sel ? Array.from(sel.options).map(o => o.text).join(', ') : '';
    extraRows += `
    <div class="prop-row">
      <div class="prop-label">📋 Opciones <span style="font-weight:400;text-transform:none;font-size:9px">(separadas por coma)</span></div>
      <input class="prop-input" value="${escHtml(opts)}"
        onchange="setSelectOptions(this.value)">
    </div>`;
  }

  if (CARD_TYPE.includes(wObj.type)) {
    const el = document.getElementById(wObj.id);
    const inner = el ? el.firstElementChild : null;
    const title = inner ? (inner.querySelector('div:first-child')?.textContent || 'Título card') : '';
    const body  = inner ? (inner.querySelector('div:last-child')?.textContent  || '') : '';
    extraRows += `
    <div class="prop-row">
      <div class="prop-label">📝 Título card</div>
      <input class="prop-input" value="${escHtml(title)}"
        oninput="setCardTitle(this.value)">
    </div>
    <div class="prop-row">
      <div class="prop-label">📝 Contenido</div>
      <textarea class="prop-input" rows="3" style="resize:vertical"
        oninput="setCardBody(this.value)">${escHtml(body)}</textarea>
    </div>`;
  }

  document.getElementById('rpanel-props').innerHTML = `
    <div class="prop-row"><div class="prop-label">ID / Nombre</div>
      <input class="prop-input" value="${wObj.name}" onchange="selectedWidget.name=this.value;document.getElementById('selected-info').textContent=this.value">
    </div>
    ${extraRows}
    <div class="prop-row-2col">
      <div><div class="prop-label">X</div><input class="prop-input" type="number" value="${Math.round(wObj.x)}" onchange="setWidgetPos('x',this.value)"></div>
      <div><div class="prop-label">Y</div><input class="prop-input" type="number" value="${Math.round(wObj.y)}" onchange="setWidgetPos('y',this.value)"></div>
    </div>
    <div class="prop-row-2col">
      <div><div class="prop-label">Ancho</div><input class="prop-input" type="number" value="${Math.round(wObj.w)}" onchange="setWidgetSize('w',this.value)"></div>
      <div><div class="prop-label">Alto</div><input class="prop-input" type="number" value="${Math.round(wObj.h)}" onchange="setWidgetSize('h',this.value)"></div>
    </div>
    <div class="prop-row"><div class="prop-label">Z-Index</div>
      <input class="prop-input" type="number" value="${wObj.zIndex}" onchange="setWidgetZ(this.value)">
    </div>
    <div class="prop-row"><div class="prop-label">Tipo</div>
      <div class="prop-input" style="opacity:.6;cursor:default">${wObj.type}</div>
    </div>
  `;
}

window.setWidgetPos  = (ax, v) => { if (!selectedWidget) return; selectedWidget[ax]=parseInt(v)||0; const el=document.getElementById(selectedWidget.id); el.style[ax==='x'?'left':'top']=selectedWidget[ax]+'px'; };
window.setWidgetSize = (dm, v) => { if (!selectedWidget) return; selectedWidget[dm]=parseInt(v)||20; const el=document.getElementById(selectedWidget.id); el.style[dm==='w'?'width':'height']=selectedWidget[dm]+'px'; };
window.setWidgetZ    = (v)     => { if (!selectedWidget) return; selectedWidget.zIndex=parseInt(v)||1; document.getElementById(selectedWidget.id).style.zIndex=selectedWidget.zIndex; };

window.setWidgetPlaceholder = (v) => {
  if (!selectedWidget) return;
  const el = document.getElementById(selectedWidget.id);
  const inner = el?.firstElementChild;
  if (inner) inner.placeholder = v;
};

window.setCheckboxLabel = (v) => {
  if (!selectedWidget) return;
  const el = document.getElementById(selectedWidget.id);
  const lbl = el?.firstElementChild;
  if (!lbl) return;
  // label has: <input type="checkbox"> text
  const cb = lbl.querySelector('input[type="checkbox"]');
  if (cb) {
    lbl.innerHTML = '';
    lbl.appendChild(cb);
    lbl.append(' ' + v);
  }
};

window.setSelectOptions = (v) => {
  if (!selectedWidget) return;
  const el = document.getElementById(selectedWidget.id);
  const sel = el?.firstElementChild;
  if (!sel) return;
  const opts = v.split(',').map(o => o.trim()).filter(Boolean);
  sel.innerHTML = opts.map(o => `<option>${escHtml(o)}</option>`).join('');
};

window.setCardTitle = (v) => {
  if (!selectedWidget) return;
  const el = document.getElementById(selectedWidget.id);
  const inner = el?.firstElementChild;
  if (inner) { const t = inner.querySelector('div:first-child'); if (t) t.textContent = v; }
};

window.setCardBody = (v) => {
  if (!selectedWidget) return;
  const el = document.getElementById(selectedWidget.id);
  const inner = el?.firstElementChild;
  if (inner) { const b = inner.querySelector('div:last-child'); if (b) b.textContent = v; }
};

// ── STYLE PANEL ───────────────────────────────────────────────────────────────
function renderStylePanel(wObj) {
  const s = wObj.style || {};
  const isText   = ['label'].includes(wObj.type);
  const isButton = wObj.type === 'button';
  const isShape  = ['rect','circle','card','badge'].includes(wObj.type);

  let html = '';

  // ── TEXT STYLES (label + button) ──
  if (isText || isButton) {
    html += `<div class="style-section-title">✏️ Texto</div>
    <div class="prop-row"><div class="prop-label">Color texto</div>
      <input type="color" class="prop-color" value="${s.color||'#111111'}" id="s_color">
    </div>
    <div class="prop-row"><div class="prop-label">Tamaño fuente</div>
      <input type="range" class="prop-range" min="8" max="72" value="${s.fontSize||14}" id="s_fontSize" oninput="document.getElementById('s_fontSizeVal').textContent=this.value+'px'">
      <span id="s_fontSizeVal" style="font-size:10px;color:var(--nb-muted)">${s.fontSize||14}px</span>
    </div>
    <div class="prop-row"><div class="prop-label">Fuente</div>
      <select class="prop-select" id="s_fontFamily">
        <option value="Syne,sans-serif" ${(s.fontFamily||'').includes('Syne')?'selected':''}>Syne</option>
        <option value="Inter,sans-serif" ${(s.fontFamily||'').includes('Inter')?'selected':''}>Inter</option>
        <option value="'JetBrains Mono',monospace" ${(s.fontFamily||'').includes('JetBrains')?'selected':''}>JetBrains Mono</option>
        <option value="Georgia,serif" ${(s.fontFamily||'').includes('Georgia')?'selected':''}>Georgia</option>
        <option value="Arial,sans-serif" ${(s.fontFamily||'').includes('Arial')?'selected':''}>Arial</option>
      </select>
    </div>
    <div class="prop-row"><div class="prop-label">Negrita / Cursiva</div>
      <div style="display:flex;gap:6px">
        <button class="tool-btn ${s.fontWeight==='bold'?'active':''}" id="s_bold"   onclick="toggleStyleBold()"  style="flex:1">B</button>
        <button class="tool-btn ${s.fontStyle==='italic'?'active':''}" id="s_italic" onclick="toggleStyleItalic()" style="flex:1"><i>I</i></button>
      </div>
    </div>
    <div class="prop-row"><div class="prop-label">Alineación</div>
      <div style="display:flex;gap:4px">
        <button class="tool-btn" onclick="applyAlign('left')"   style="flex:1">≡L</button>
        <button class="tool-btn" onclick="applyAlign('center')" style="flex:1">≡C</button>
        <button class="tool-btn" onclick="applyAlign('right')"  style="flex:1">≡R</button>
      </div>
    </div>`;
  }

  // ── BUTTON STYLES ──
  if (isButton) {
    html += `<div class="style-section-title">🔘 Botón</div>
    <div class="prop-row"><div class="prop-label">Color fondo</div>
      <input type="color" class="prop-color" value="${s.bgColor||'#4f46e5'}" id="s_bgColor">
    </div>
    <div class="prop-row"><div class="prop-label">Color borde</div>
      <input type="color" class="prop-color" value="${s.borderColor||'#4f46e5'}" id="s_borderColor">
    </div>
    <div class="prop-row"><div class="prop-label">Grosor borde</div>
      <input type="range" class="prop-range" min="0" max="8" value="${s.borderWidth||0}" id="s_borderWidth">
    </div>
    <div class="prop-row"><div class="prop-label">Radio borde (px)</div>
      <input type="range" class="prop-range" min="0" max="50" value="${s.borderRadius||6}" id="s_borderRadius">
    </div>`;
  }

  // ── SHAPE STYLES ──
  if (isShape) {
    html += `<div class="style-section-title">🎨 Forma</div>
    <div class="prop-row"><div class="prop-label">Color fondo</div>
      <input type="color" class="prop-color" value="${s.bgColor||'#e0e7ff'}" id="s_bgColor">
    </div>
    <div class="prop-row"><div class="prop-label">Color borde</div>
      <input type="color" class="prop-color" value="${s.borderColor||'#6366f1'}" id="s_borderColor">
    </div>
    <div class="prop-row"><div class="prop-label">Grosor borde</div>
      <input type="range" class="prop-range" min="0" max="10" value="${s.borderWidth||2}" id="s_borderWidth">
    </div>
    <div class="prop-row"><div class="prop-label">Radio (px)</div>
      <input type="range" class="prop-range" min="0" max="80" value="${s.borderRadius||6}" id="s_borderRadius">
    </div>
    <div class="prop-row"><div class="prop-label">Opacidad</div>
      <input type="range" class="prop-range" min="10" max="100" value="${s.opacity||100}" id="s_opacity">
    </div>`;
  }

  // ── INPUT STYLES ──
  if (wObj.type === 'input' || wObj.type === 'textarea') {
    html += `<div class="style-section-title">✏️ Campo</div>
    <div class="prop-row"><div class="prop-label">Color borde</div>
      <input type="color" class="prop-color" value="${s.borderColor||'#d1d5db'}" id="s_borderColor">
    </div>
    <div class="prop-row"><div class="prop-label">Radio borde</div>
      <input type="range" class="prop-range" min="0" max="20" value="${s.borderRadius||6}" id="s_borderRadius">
    </div>
    <div class="prop-row"><div class="prop-label">Tamaño fuente</div>
      <input type="range" class="prop-range" min="8" max="24" value="${s.fontSize||13}" id="s_fontSize">
    </div>`;
  }

  html += `<button class="apply-style-btn" onclick="applyStyles()">✓ Aplicar estilos</button>`;
  document.getElementById('rpanel-style').innerHTML = html;
}

window.toggleStyleBold   = () => { if (!selectedWidget) return; const s=selectedWidget.style; s.fontWeight = s.fontWeight==='bold' ? 'normal' : 'bold'; applyStyles(); renderStylePanel(selectedWidget); };
window.toggleStyleItalic = () => { if (!selectedWidget) return; const s=selectedWidget.style; s.fontStyle  = s.fontStyle==='italic' ? 'normal' : 'italic'; applyStyles(); renderStylePanel(selectedWidget); };
window.applyAlign        = (a) => { if (!selectedWidget) return; selectedWidget.style.textAlign = a; applyStyles(); };

window.applyStyles = function() {
  if (!selectedWidget) return;
  const s   = selectedWidget.style;
  const el  = document.getElementById(selectedWidget.id);
  const get = (id) => { const e = document.getElementById(id); return e ? e.value : null; };

  if (get('s_color'))        s.color        = get('s_color');
  if (get('s_fontSize'))     s.fontSize     = parseInt(get('s_fontSize'));
  if (get('s_fontFamily'))   s.fontFamily   = get('s_fontFamily');
  if (get('s_bgColor'))      s.bgColor      = get('s_bgColor');
  if (get('s_borderColor'))  s.borderColor  = get('s_borderColor');
  if (get('s_borderWidth'))  s.borderWidth  = parseInt(get('s_borderWidth'));
  if (get('s_borderRadius')) s.borderRadius = parseInt(get('s_borderRadius'));
  if (get('s_opacity'))      s.opacity      = parseInt(get('s_opacity'));

  // Apply to inner element
  const inner = el.firstElementChild;
  if (!inner) return;

  if (s.color)        inner.style.color       = s.color;
  if (s.fontSize)     inner.style.fontSize    = s.fontSize + 'px';
  if (s.fontFamily)   inner.style.fontFamily  = s.fontFamily;
  if (s.fontWeight)   inner.style.fontWeight  = s.fontWeight;
  if (s.fontStyle)    inner.style.fontStyle   = s.fontStyle;
  if (s.textAlign)    inner.style.textAlign   = s.textAlign;
  if (s.bgColor)      inner.style.background  = s.bgColor;
  if (s.borderColor && s.borderWidth !== undefined)
    inner.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
  else if (s.borderColor) inner.style.borderColor = s.borderColor;
  if (s.borderRadius !== undefined) inner.style.borderRadius = s.borderRadius + 'px';
  if (s.opacity)      el.style.opacity = s.opacity / 100;

  log(`Estilos aplicados a ${selectedWidget.name}`, 'ok');
};

// ── EVENTS PANEL ──────────────────────────────────────────────────────────────
function renderEventsPanel(wObj) {
  const events = ['onClick', 'onChange', 'onHover', 'onLoad'];
  document.getElementById('rpanel-events').innerHTML = events.map(ev => `
    <div class="prop-row">
      <div class="prop-label">${ev}</div>
      <input class="prop-input" value="${wObj.events[ev]||''}" placeholder='ShowMessage "..."'
        onchange="selectedWidget.events['${ev}']=this.value">
    </div>`).join('');
}

function widgetEvent(id, evType, val) {
  const wObj = widgets.find(w => w.id === id);
  if (!wObj) return;
  const evKey = evType === 'click' ? 'onClick' : 'onChange';
  if (wObj.events[evKey]) executeScript(wObj.events[evKey], { value: val });
  log(`${evType} → ${wObj.name}${val !== undefined ? ' = '+val : ''}`, 'info');
}

// ── CANVAS ACTIONS ────────────────────────────────────────────────────────────
function deleteSelected() {
  if (!selectedWidget) { log('Nada seleccionado', 'warn'); return; }
  document.getElementById(selectedWidget.id)?.remove();
  widgets = widgets.filter(w => w.id !== selectedWidget.id);
  selectedWidget = null;
  updateObjCount();
  log('Objeto eliminado', 'warn');
}

function duplicateSelected() {
  if (!selectedWidget) { log('Nada seleccionado', 'warn'); return; }
  const nw = makeWidget(selectedWidget.type, selectedWidget.x+20, selectedWidget.y+20);
  if (nw && Object.keys(selectedWidget.style).length) {
    nw.style = {...selectedWidget.style};
    applyStylesTo(nw);
  }
}

function applyStylesTo(wObj) {
  const s   = wObj.style;
  const el  = document.getElementById(wObj.id);
  if (!el) return;
  const inner = el.firstElementChild;
  if (!inner) return;
  if (s.color)        inner.style.color       = s.color;
  if (s.fontSize)     inner.style.fontSize    = s.fontSize+'px';
  if (s.fontFamily)   inner.style.fontFamily  = s.fontFamily;
  if (s.fontWeight)   inner.style.fontWeight  = s.fontWeight;
  if (s.fontStyle)    inner.style.fontStyle   = s.fontStyle;
  if (s.bgColor)      inner.style.background  = s.bgColor;
  if (s.borderColor && s.borderWidth !== undefined)
    inner.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
  if (s.borderRadius !== undefined) inner.style.borderRadius = s.borderRadius+'px';
  if (s.opacity)      el.style.opacity = s.opacity/100;
}

function bringForward() {
  if (!selectedWidget) return;
  selectedWidget.zIndex = ++zIndexCounter;
  document.getElementById(selectedWidget.id).style.zIndex = selectedWidget.zIndex;
  log(`${selectedWidget.name} al frente (z:${selectedWidget.zIndex})`, 'ok');
}

function sendBackward() {
  if (!selectedWidget) return;
  selectedWidget.zIndex = Math.max(1, selectedWidget.zIndex - 2);
  document.getElementById(selectedWidget.id).style.zIndex = selectedWidget.zIndex;
  log(`${selectedWidget.name} atrás (z:${selectedWidget.zIndex})`, 'ok');
}

function clearCanvas() {
  document.getElementById('page-canvas').innerHTML = '';
  widgets = []; selectedWidget = null; updateObjCount();
  log('Canvas limpiado', 'warn');
}

function updateObjCount() {
  document.getElementById('obj-count').textContent = widgets.length + ' objetos';
}

// ── SAVE / LOAD PROJECT ───────────────────────────────────────────────────────
function saveProject() {
  const name = prompt('Nombre del proyecto:', projectName) || projectName;
  projectName = name;
  const data = {
    version: '2.0', name,
    script: document.getElementById('script-editor').value,
    canvasTheme: document.getElementById('canvas-theme').value,
    variables,
    widgets: widgets.map(w => ({
      id: w.id, type: w.type, name: w.name,
      x: w.x, y: w.y, w: w.w, h: w.h,
      events: w.events, style: w.style, zIndex: w.zIndex
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/\s+/g,'_') + '.neobook.json';
  a.click();
  document.getElementById('project-name-status').textContent = name;
  log(`Proyecto guardado: ${name}.neobook.json`, 'ok');
}

function loadProject() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,.neobook.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version) throw new Error('Formato inválido');
        clearCanvas();
        projectName = data.name || 'Importado';
        variables   = data.variables || {};
        document.getElementById('script-editor').value = data.script || '';
        document.getElementById('project-name-status').textContent = projectName;
        if (data.canvasTheme) {
          document.getElementById('canvas-theme').value = data.canvasTheme;
          applyCanvasTheme(data.canvasTheme);
        }
        (data.widgets || []).forEach(w => {
          const nw = makeWidget(w.type, w.x, w.y);
          if (!nw) return;
          nw.name = w.name;
          nw.events = w.events || {};
          nw.style  = w.style  || {};
          nw.zIndex = w.zIndex || 1;
          nw.w = w.w; nw.h = w.h;
          const el = document.getElementById(nw.id);
          if (el) { el.style.width=nw.w+'px'; el.style.height=nw.h+'px'; el.style.zIndex=nw.zIndex; }
          applyStylesTo(nw);
        });
        log(`Proyecto cargado: ${projectName} (${widgets.length} objetos)`, 'ok');
      } catch(err) { log('Error al cargar: ' + err.message, 'err'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── COMMAND ENGINE ────────────────────────────────────────────────────────────
const COMMANDS = {
  GoPage(args) {
    const n = parseInt(args[0]);
    if (n >= 1 && n <= totalPages) { currentPage = n; document.getElementById('cur-page').textContent = n; log(`Página ${n}`, 'ok'); }
    else log(`Página ${n} no existe`, 'err');
  },
  ShowMessage(args, ctx) {
    const msg = resolveVars(args.join(' ').replace(/^"|"$/g,''), ctx);
    log(`💬 ${msg}`, 'ok');
    setTimeout(() => alert(msg), 10);
  },
  SetVariable(args, ctx) {
    if (args.length < 3) { log('SetVariable: uso → SetVariable nombre = "valor"', 'err'); return; }
    const name = args[0];
    const val  = resolveVars(args.slice(2).join(' ').replace(/^"|"$/g,''), ctx);
    variables[name] = val;
    log(`[${name}] = "${val}"`, 'ok');
  },
  SetText(args, ctx) {
    // SetText widget_name = "nuevo texto"
    const name = args[0];
    const text = resolveVars(args.slice(2).join(' ').replace(/^"|"$/g,''), ctx);
    const wObj = widgets.find(w => w.name === name || w.id === name);
    if (!wObj) { log(`SetText: objeto "${name}" no encontrado`, 'err'); return; }
    const el = document.getElementById(wObj.id);
    if (!el) return;
    const inner = el.firstElementChild;
    if (inner) {
      if (inner.tagName === 'BUTTON' || inner.tagName === 'SPAN') inner.textContent = text;
      else if (inner.tagName === 'INPUT' || inner.tagName === 'TEXTAREA') inner.value = text;
    }
    log(`SetText → ${name}: "${text}"`, 'ok');
  },
  ChangeColor(args, ctx) {
    // ChangeColor widget_name bg=#hex | color=#hex
    const name = args[0];
    const wObj = widgets.find(w => w.name === name || w.id === name);
    if (!wObj) { log(`ChangeColor: objeto "${name}" no encontrado`, 'err'); return; }
    args.slice(1).forEach(a => {
      const [prop, val] = a.split('=');
      if (prop === 'bg')     { wObj.style.bgColor = val; }
      if (prop === 'color')  { wObj.style.color   = val; }
      if (prop === 'border') { wObj.style.borderColor = val; }
    });
    applyStylesTo(wObj);
    log(`ChangeColor → ${name}`, 'ok');
  },
  SetProgress(args) {
    // SetProgress widget_name = 75
    const name = args[0];
    const val  = Math.max(0, Math.min(100, parseInt(args[2]) || 0));
    const wObj = widgets.find(w => w.name === name || w.id === name);
    if (!wObj) { log(`SetProgress: "${name}" no encontrado`, 'err'); return; }
    const bar = document.getElementById(wObj.id + '_bar');
    if (bar) { bar.style.width = val + '%'; log(`Progress ${name} = ${val}%`, 'ok'); }
  },
  Timer(args, ctx) {
    const ms      = parseInt(args[0]) || 1000;
    const blockMatch = args.slice(1).join(' ').match(/\[([\s\S]*)\]/);
    const script  = blockMatch ? blockMatch[1] : '';
    log(`Timer: ${ms}ms iniciado`, 'info');
    setTimeout(() => {
      log(`Timer: ejecutado (${ms}ms)`, 'ok');
      if (script) executeScript(script, ctx);
    }, ms);
  },
  HTTPRequest(args, ctx) {
    const urlArg = args.find(a => a.startsWith('url='));
    const varArg = args.find(a => a.startsWith('var='));
    if (!urlArg) { log('HTTPRequest: falta url=', 'err'); return; }
    const url    = urlArg.slice(4).replace(/^"|"$/g,'');
    const varName = varArg ? varArg.slice(4) : 'response';
    log(`HTTPRequest: ${url}`, 'info');
    fetch(url)
      .then(r => r.json())
      .then(data => {
        variables[varName] = typeof data === 'object' ? JSON.stringify(data) : String(data);
        log(`HTTPRequest OK → [${varName}]`, 'ok');
      })
      .catch(e => log(`HTTPRequest error: ${e.message}`, 'err'));
  },
  Print(args, ctx) {
    log('📄 ' + resolveVars(args.join(' ').replace(/^"|"$/g,''), ctx), 'info');
  },
  GetInput(args, ctx) {
    const pIdx = args.indexOf('prompt'); const vIdx = args.indexOf('var');
    const promptMsg = pIdx >= 0 ? args[pIdx+2].replace(/^"|"$/g,'') : 'Ingresa un valor:';
    const varName   = vIdx >= 0 ? args[vIdx+2] : 'input';
    const val = window.prompt(promptMsg) || '';
    variables[varName] = val;
    log(`GetInput [${varName}] = "${val}"`, 'ok');
  },
  PlaySound(args) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC(); const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = args[0] === 'beep' ? 880 : (parseFloat(args[0]) || 440);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
      log(`PlaySound: ${args[0]}`, 'ok');
    } catch(e) { log('PlaySound no disponible', 'warn'); }
  },
  IfThen(args, ctx) { log('IfThen: usa el editor de scripts para lógica compleja', 'info'); },
  Loop(args, ctx)   { log(`Loop: ${parseInt(args[0])||1} iteraciones`, 'info'); },
  OpenURL(args) { window.open(args[0].replace(/^"|"$/g,''), '_blank'); log('OpenURL ok', 'ok'); },
  ClearConsole()    { clearConsole(); },
  ListVars() {
    const keys = Object.keys(variables);
    if (!keys.length) { log('Sin variables', 'info'); return; }
    keys.forEach(k => log(`  [${k}] = "${variables[k]}"`, 'info'));
  },
  Help() {
    [
      '═══ NeoBook Web v2.0 ═══',
      'GoPage <n>                    Navegar a página',
      'ShowMessage "<msg>"           Mostrar alerta',
      'SetVariable n = "<v>"         Definir variable',
      'SetText obj = "<v>"           Cambiar texto de objeto',
      'ChangeColor obj bg=#hex       Cambiar color',
      'SetProgress obj = <0-100>     Actualizar barra',
      'Timer <ms> [...]              Ejecutar con delay',
      'HTTPRequest url="..." var=x   Fetch a una API',
      'Print <[v]|"msg">             Imprimir en consola',
      'GetInput prompt="?" var=x     Pedir dato',
      'PlaySound <beep|hz>           Sonido',
      'OpenURL "<url>"               Abrir enlace',
      'ClearConsole                  Limpiar consola',
      'ListVars                      Ver variables',
    ].forEach(l => log(l, 'info'));
  }
};

function resolveVars(str, ctx = {}) {
  return String(str).replace(/\[(\w+)\]/g, (_, n) =>
    variables[n] !== undefined ? variables[n] : `[${n}]`
  );
}

function executeScript(scriptText, ctx = {}) {
  const lines = scriptText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  for (const line of lines) {
    const m = line.match(/^(\w+)\s*(.*)?$/);
    if (!m) continue;
    const cmd = m[1]; const argsStr = (m[2]||'').trim();
    const args = argsStr ? (argsStr.match(/(?:[^\s"=\[\]]+|"[^"]*"|\[[^\]]*\])+/g) || []) : [];
    if (COMMANDS[cmd]) {
      try { COMMANDS[cmd](args, ctx); }
      catch(e) { log(`Error en ${cmd}: ${e.message}`, 'err'); }
    } else {
      log(`Comando desconocido: "${cmd}" — escribe Help`, 'err');
    }
  }
}

// ── CONSOLE ───────────────────────────────────────────────────────────────────
function execCmd() {
  const input = document.getElementById('cmd-input');
  const cmd = input.value.trim(); if (!cmd) return;
  cmdHistory.unshift(cmd); cmdHistoryIdx = -1;
  log('> ' + cmd, 'info');
  executeScript(cmd); input.value = '';
}
function cmdKeyDown(e) {
  if (e.key === 'Enter') { execCmd(); return; }
  if (e.key === 'ArrowUp')   { cmdHistoryIdx = Math.min(cmdHistoryIdx+1, cmdHistory.length-1); e.target.value = cmdHistory[cmdHistoryIdx]||''; }
  if (e.key === 'ArrowDown') { cmdHistoryIdx = Math.max(cmdHistoryIdx-1, -1); e.target.value = cmdHistoryIdx<0?'':cmdHistory[cmdHistoryIdx]; }
}
function insertCmd(cmd) { const i=document.getElementById('cmd-input'); i.value=cmd+' '; i.focus(); }
function insertToScript(code) {
  const ta=document.getElementById('script-editor'), pos=ta.selectionStart;
  ta.value = ta.value.substring(0,pos)+'\n'+code+'\n'+ta.value.substring(pos);
  ta.focus();
  log('Insertado: '+code.split('\n')[0], 'info');
}

// ── PAGES ─────────────────────────────────────────────────────────────────────
function changePage(d) {
  const n = currentPage + d;
  if (n<1||n>totalPages) return;
  currentPage = n; document.getElementById('cur-page').textContent = n;
  log(`Página ${n}`, 'info');
}

// ── RUN APP ───────────────────────────────────────────────────────────────────
function runApp() {
  const po = document.getElementById('preview-overlay');
  const pc = document.getElementById('preview-canvas');
  const canvasTheme = document.getElementById('canvas-theme').value;
  po.classList.add('show');
  pc.style.cssText = `position:relative;width:100%;min-height:360px;background:${
    canvasTheme==='dark'?'#1a1a2e':canvasTheme==='paper'?'#f5f0e8':canvasTheme==='retro'?'#000':canvasTheme==='soft'?'#fdf2f8':'#fff'
  }`;
  pc.innerHTML = '';
  widgets.forEach(wObj => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${wObj.x}px;top:${wObj.y}px;width:${wObj.w}px;height:${wObj.h}px;z-index:${wObj.zIndex}`;
    el.innerHTML = wObj.html;
    if (wObj.style && Object.keys(wObj.style).length) {
      const inner = el.firstElementChild;
      if (inner) {
        if (wObj.style.color)      inner.style.color      = wObj.style.color;
        if (wObj.style.fontSize)   inner.style.fontSize   = wObj.style.fontSize+'px';
        if (wObj.style.fontFamily) inner.style.fontFamily = wObj.style.fontFamily;
        if (wObj.style.fontWeight) inner.style.fontWeight = wObj.style.fontWeight;
        if (wObj.style.bgColor)    inner.style.background = wObj.style.bgColor;
        if (wObj.style.borderRadius !== undefined) inner.style.borderRadius = wObj.style.borderRadius+'px';
      }
    }
    pc.appendChild(el);
  });
  const script = document.getElementById('script-editor').value;
  const onLoad = script.match(/OnPageLoad\s*\[([\s\S]*?)\]/);
  if (onLoad) executeScript(onLoad[1]);
  log('▶ App ejecutada', 'ok');
}
function closePreview() { document.getElementById('preview-overlay').classList.remove('show'); }

// ── VARS TAB ──────────────────────────────────────────────────────────────────
function renderVars() {
  const c = document.getElementById('vars-table'), keys = Object.keys(variables);
  if (!keys.length) { c.innerHTML='<div style="color:var(--nb-muted);font-size:12px;text-align:center;padding:20px">Sin variables. Usa <code>SetVariable</code>.</div>'; return; }
  c.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px;font-family:monospace">
    <thead><tr style="border-bottom:1px solid var(--nb-border)">
      <th style="text-align:left;padding:6px;color:var(--nb-muted)">Variable</th>
      <th style="text-align:left;padding:6px;color:var(--nb-muted)">Valor</th>
      <th style="width:30px"></th></tr></thead>
    <tbody>${keys.map(k=>`<tr style="border-bottom:1px solid var(--nb-border)">
      <td style="padding:6px;color:var(--nb-accent2)">[${k}]</td>
      <td style="padding:6px;color:var(--nb-text)">${escHtml(String(variables[k]))}</td>
      <td style="padding:6px"><button onclick="delVar('${k}')" style="background:none;border:none;color:var(--nb-accent3);cursor:pointer">✕</button></td>
      </tr>`).join('')}</tbody></table>`;
}
window.delVar = k => { delete variables[k]; renderVars(); log(`Variable [${k}] eliminada`, 'warn'); };
function addVar() {
  const n = prompt('Nombre:'); if (!n?.trim()) return;
  const v = prompt(`Valor para [${n.trim()}]:`) || '';
  variables[n.trim()] = v; renderVars(); log(`[${n.trim()}] = "${v}"`, 'ok');
}

// ── MENU ──────────────────────────────────────────────────────────────────────
function menuNew() {
  if (confirm('¿Nuevo proyecto? Se borrará el canvas actual.')) {
    clearCanvas(); variables = {};
    document.getElementById('script-editor').value = '';
    projectName = 'Sin título';
    document.getElementById('project-name-status').textContent = projectName;
    log('Nuevo proyecto', 'info');
  }
}
function showHelp() { COMMANDS.Help(); }

// ── EXPORT HTML ───────────────────────────────────────────────────────────────
function exportProject() {
  const script    = document.getElementById('script-editor').value;
  const theme     = document.getElementById('canvas-theme').value;
  const bgColor   = theme==='dark'?'#1a1a2e':theme==='paper'?'#f5f0e8':theme==='retro'?'#000':theme==='soft'?'#fdf2f8':'#fff';
  const widgetHTML = widgets.map(w =>
    `<div style="position:absolute;left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px;z-index:${w.zIndex}">${w.html}</div>`
  ).join('\n  ');
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>${escHtml(projectName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#f3f4f6;font-family:Syne,sans-serif}#app{position:relative;width:700px;min-height:480px;margin:20px auto;background:${bgColor};border-radius:8px;border:1px solid #e5e7eb;overflow:hidden}</style>
</head><body><div id="app">${widgetHTML}</div>
<script>
var variables=${JSON.stringify(variables)};
function rv(s){return String(s).replace(/\\[(\\w+)\\]/g,(_,n)=>variables[n]!==undefined?variables[n]:'['+n+']');}
window.addEventListener('DOMContentLoaded',function(){${script.replace(/OnPageLoad\s*\[([\s\S]*?)\]/,'(function(){\n$1\n})();')}});
<\/script></body></html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], {type:'text/html'}));
  a.download = (projectName||'mi-app').replace(/\s+/g,'_') + '.html';
  a.click();
  log('Exportado como HTML', 'ok');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  log('NeoBook Web v2.0 iniciado', 'ok');
  log('Nuevo: Guardar/Cargar, Estilos avanzados, Temas, SetText, ChangeColor, Timer, HTTPRequest', 'info');
  log('Escribe Help para ver todos los comandos', 'info');
  makeWidget('label',    50, 30);
  makeWidget('button',   50, 90);
  makeWidget('input',    50, 155);
  makeWidget('progress', 50, 220);
  switchTab('design');
  switchRPanel('props');
});

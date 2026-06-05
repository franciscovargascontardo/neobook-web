/* ===== NeoBook Web — app.js ===== */

'use strict';

// ── STATE ─────────────────────────────────────────────────────────────────────
let currentTool   = 'select';
let selectedWidget = null;
let widgets        = [];
let widgetCounter  = 0;
let variables      = {};
let currentPage    = 1;
const totalPages   = 3;
let dragType       = null;
let cmdHistory     = [];
let cmdHistoryIdx  = -1;

// ── LOGGING ───────────────────────────────────────────────────────────────────
function log(msg, type = 'info') {
  const out  = document.getElementById('console-output');
  const now  = new Date();
  const t    = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const line = document.createElement('div');
  line.className = 'console-line';
  line.innerHTML = `<span class="console-time">${t}</span><span class="console-${type}">${msg}</span>`;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

function clearConsole() {
  document.getElementById('console-output').innerHTML = '';
}

// ── TOOL ──────────────────────────────────────────────────────────────────────
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('tool-' + tool);
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

  if (tab === 'design')      { dv.style.display = 'flex'; dv.style.flex = '1'; }
  else if (tab === 'script') { sv.style.display = 'flex'; }
  else if (tab === 'vars')   { vv.style.display = 'block'; renderVars(); }
}

// ── WIDGET FACTORY ────────────────────────────────────────────────────────────
function makeWidget(type, x, y) {
  const id = 'w_' + (++widgetCounter);
  let html = '', w = 120, h = 32;

  switch (type) {
    case 'button':
      html = `<button style="width:100%;height:100%;background:#4f46e5;color:#fff;border:none;border-radius:5px;font-size:13px;cursor:pointer;font-family:Syne,sans-serif" onclick="widgetEvent('${id}','click')">Botón</button>`;
      w = 120; h = 36; break;

    case 'label':
      html = `<span contenteditable="true" style="font-size:14px;color:#111;font-family:Syne,sans-serif;outline:none">Etiqueta</span>`;
      w = 100; h = 28; break;

    case 'input':
      html = `<input type="text" placeholder="Ingresa texto..." style="width:100%;height:100%;border:1px solid #ccc;border-radius:4px;padding:0 8px;font-size:13px;box-sizing:border-box" oninput="widgetEvent('${id}','change',this.value)">`;
      w = 160; h = 32; break;

    case 'checkbox':
      html = `<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#111;font-family:Syne,sans-serif"><input type="checkbox" onchange="widgetEvent('${id}','change',this.checked)"> Opción</label>`;
      w = 120; h = 28; break;

    case 'select':
      html = `<select style="width:100%;height:100%;border:1px solid #ccc;border-radius:4px;font-size:13px;padding:0 6px" onchange="widgetEvent('${id}','change',this.value)"><option>Opción 1</option><option>Opción 2</option><option>Opción 3</option></select>`;
      w = 140; h = 32; break;

    case 'textarea':
      html = `<textarea placeholder="Área de texto..." style="width:100%;height:100%;border:1px solid #ccc;border-radius:4px;font-size:12px;padding:6px;resize:none;box-sizing:border-box" oninput="widgetEvent('${id}','change',this.value)"></textarea>`;
      w = 180; h = 80; break;

    case 'rect':
      html = `<div style="width:100%;height:100%;background:#e0e7ff;border:2px solid #6366f1;border-radius:4px"></div>`;
      w = 120; h = 80; break;

    case 'circle':
      html = `<div style="width:100%;height:100%;background:#fce7f3;border:2px solid #ec4899;border-radius:50%"></div>`;
      w = 80; h = 80; break;

    case 'hline':
      html = `<div style="width:100%;height:2px;background:#555;margin-top:9px"></div>`;
      w = 160; h = 20; break;

    case 'image':
      html = `<div style="width:100%;height:100%;background:#f3f4f6;border:2px dashed #9ca3af;display:flex;align-items:center;justify-content:center;font-size:11px;color:#9ca3af;font-family:Syne,sans-serif">🖼 Imagen</div>`;
      w = 120; h = 90; break;
  }

  const wObj = {
    id,
    type,
    x: Math.max(0, x),
    y: Math.max(0, y),
    w,
    h,
    html,
    name: type + '_' + widgetCounter,
    events: {},
    props:  {}
  };

  widgets.push(wObj);
  renderWidget(wObj);
  selectWidget(wObj);
  updateObjCount();
  log(`Creado: ${wObj.name} (${type}) en (${Math.round(x)}, ${Math.round(y)})`, 'ok');
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
  }

  el.style.left   = wObj.x + 'px';
  el.style.top    = wObj.y + 'px';
  el.style.width  = wObj.w + 'px';
  el.style.height = wObj.h + 'px';
}

function makeDraggable(el, wObj) {
  let sx, sy, ox, oy, resizing = false;
  const handle = el.querySelector('.resize-handle');

  el.addEventListener('mousedown', e => {
    if (e.target === handle) {
      resizing = true;
      sx = e.clientX; sy = e.clientY;
      ox = wObj.w;    oy = wObj.h;
    } else {
      if (currentTool !== 'select') return;
      selectWidget(wObj);
      sx = e.clientX - wObj.x;
      sy = e.clientY - wObj.y;
    }
    e.stopPropagation();

    const onMove = e2 => {
      if (resizing) {
        wObj.w = Math.max(40, ox + e2.clientX - sx);
        wObj.h = Math.max(20, oy + e2.clientY - sy);
        el.style.width  = wObj.w + 'px';
        el.style.height = wObj.h + 'px';
      } else {
        wObj.x = e2.clientX - sx;
        wObj.y = e2.clientY - sy;
        el.style.left = wObj.x + 'px';
        el.style.top  = wObj.y + 'px';
      }
    };

    const onUp = () => {
      resizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function selectWidget(wObj) {
  selectedWidget = wObj;
  document.querySelectorAll('.canvas-widget').forEach(el => el.classList.remove('selected'));

  if (wObj) {
    document.getElementById(wObj.id).classList.add('selected');
    document.getElementById('selected-info').textContent = wObj.name;
    renderProps(wObj);
    renderEvents(wObj);
  }
}

function canvasClick(e) {
  if (e.target.id !== 'page-canvas') return;

  // Deselect
  selectedWidget = null;
  document.querySelectorAll('.canvas-widget').forEach(el => el.classList.remove('selected'));
  document.getElementById('selected-info').textContent = 'Nada seleccionado';
  document.getElementById('props-container').innerHTML = '<div class="props-empty">Selecciona un<br>objeto en el canvas</div>';
  document.getElementById('events-container').innerHTML = '<div class="props-empty">—</div>';

  // Place widget if tool active
  if (currentTool !== 'select') {
    const rect = document.getElementById('page-canvas').getBoundingClientRect();
    makeWidget(currentTool, e.clientX - rect.left - 60, e.clientY - rect.top - 16);
  }
}

// ── PALETTE DRAG & DROP ───────────────────────────────────────────────────────
function paletteDrag(e, type) {
  dragType = type;
}

function canvasDrop(e) {
  if (!dragType) return;
  const rect = document.getElementById('page-canvas').getBoundingClientRect();
  makeWidget(dragType, e.clientX - rect.left - 60, e.clientY - rect.top - 16);
  dragType = null;
}

function addFromPalette(type) {
  const x = 20 + Math.random() * 200;
  const y = 20 + Math.random() * 150;
  makeWidget(type, x, y);
}

// ── PROPERTIES ────────────────────────────────────────────────────────────────
function renderProps(wObj) {
  const c = document.getElementById('props-container');
  c.innerHTML = `
    <div class="prop-row">
      <div class="prop-label">Nombre</div>
      <input class="prop-input" value="${wObj.name}" id="prop-name" onchange="updatePropName(this.value)">
    </div>
    <div class="prop-row">
      <div class="prop-label">X</div>
      <input class="prop-input" type="number" value="${Math.round(wObj.x)}" onchange="updatePropPos('x', this.value)">
    </div>
    <div class="prop-row">
      <div class="prop-label">Y</div>
      <input class="prop-input" type="number" value="${Math.round(wObj.y)}" onchange="updatePropPos('y', this.value)">
    </div>
    <div class="prop-row">
      <div class="prop-label">Ancho</div>
      <input class="prop-input" type="number" value="${Math.round(wObj.w)}" onchange="updatePropSize('w', this.value)">
    </div>
    <div class="prop-row">
      <div class="prop-label">Alto</div>
      <input class="prop-input" type="number" value="${Math.round(wObj.h)}" onchange="updatePropSize('h', this.value)">
    </div>
  `;
}

window.updatePropName = function(val) {
  if (!selectedWidget) return;
  selectedWidget.name = val;
  document.getElementById('selected-info').textContent = val;
};
window.updatePropPos = function(axis, val) {
  if (!selectedWidget) return;
  selectedWidget[axis] = parseInt(val) || 0;
  const el = document.getElementById(selectedWidget.id);
  el.style[axis === 'x' ? 'left' : 'top'] = selectedWidget[axis] + 'px';
};
window.updatePropSize = function(dim, val) {
  if (!selectedWidget) return;
  selectedWidget[dim] = parseInt(val) || 20;
  const el = document.getElementById(selectedWidget.id);
  el.style[dim === 'w' ? 'width' : 'height'] = selectedWidget[dim] + 'px';
};

function renderEvents(wObj) {
  const c = document.getElementById('events-container');
  const events = ['onClick', 'onChange', 'onHover'];
  c.innerHTML = events.map(ev => `
    <div class="prop-row">
      <div class="prop-label">${ev}</div>
      <input class="prop-input" value="${wObj.events[ev] || ''}"
        placeholder='ShowMessage "..."'
        onchange="updateEvent('${ev}', this.value)">
    </div>
  `).join('');
}

window.updateEvent = function(ev, val) {
  if (!selectedWidget) return;
  selectedWidget.events[ev] = val;
};

function widgetEvent(id, evType, val) {
  const wObj = widgets.find(w => w.id === id);
  if (!wObj) return;
  const evKey = evType === 'click' ? 'onClick' : 'onChange';
  const script = wObj.events[evKey];
  if (script) executeScript(script, { value: val });
  log(`Evento ${evType} en ${wObj.name}${val !== undefined ? ' = ' + val : ''}`, 'info');
}

// ── CANVAS ACTIONS ────────────────────────────────────────────────────────────
function deleteSelected() {
  if (!selectedWidget) { log('Nada seleccionado', 'warn'); return; }
  const el = document.getElementById(selectedWidget.id);
  if (el) el.remove();
  widgets = widgets.filter(w => w.id !== selectedWidget.id);
  selectedWidget = null;
  updateObjCount();
  log('Objeto eliminado', 'warn');
}

function duplicateSelected() {
  if (!selectedWidget) { log('Nada seleccionado', 'warn'); return; }
  makeWidget(selectedWidget.type, selectedWidget.x + 20, selectedWidget.y + 20);
}

function clearCanvas() {
  document.getElementById('page-canvas').innerHTML = '';
  widgets = [];
  selectedWidget = null;
  updateObjCount();
  log('Canvas limpiado', 'warn');
}

function updateObjCount() {
  document.getElementById('obj-count').textContent = widgets.length + ' objetos';
}

// ── COMMAND ENGINE ────────────────────────────────────────────────────────────
const COMMANDS = {
  GoPage(args) {
    const n = parseInt(args[0]);
    if (n >= 1 && n <= totalPages) {
      currentPage = n;
      document.getElementById('cur-page').textContent = n;
      log(`Navegando a página ${n}`, 'ok');
    } else {
      log(`Página ${n} no existe (total: ${totalPages})`, 'err');
    }
  },

  ShowMessage(args, ctx) {
    const msg = resolveVars(args.join(' ').replace(/^"|"$/g, ''), ctx);
    log(`💬 ${msg}`, 'ok');
    // Use a small timeout so log renders before alert blocks
    setTimeout(() => alert(msg), 10);
  },

  SetVariable(args, ctx) {
    if (args.length < 3) { log('SetVariable: uso → SetVariable nombre = "valor"', 'err'); return; }
    const name = args[0];
    const val  = resolveVars(args.slice(2).join(' ').replace(/^"|"$/g, ''), ctx);
    variables[name] = val;
    log(`Variable [${name}] = "${val}"`, 'ok');
    if (document.getElementById('tab-vars').classList.contains('active')) renderVars();
  },

  Print(args, ctx) {
    const msg = resolveVars(args.join(' ').replace(/^"|"$/g, ''), ctx);
    log(`📄 ${msg}`, 'info');
  },

  GetInput(args, ctx) {
    const pIdx = args.indexOf('prompt');
    const vIdx = args.indexOf('var');
    const promptMsg = pIdx >= 0 ? args[pIdx + 2].replace(/^"|"$/g, '') : 'Ingresa un valor:';
    const varName   = vIdx >= 0 ? args[vIdx + 2] : 'input';
    const val = window.prompt(promptMsg) || '';
    variables[varName] = val;
    log(`GetInput → [${varName}] = "${val}"`, 'ok');
  },

  PlaySound(args) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = args[0] === 'beep' ? 880 : (parseFloat(args[0]) || 440);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      log(`PlaySound: ${args[0] || 440}hz`, 'ok');
    } catch (e) {
      log('PlaySound: AudioContext no disponible', 'warn');
    }
  },

  IfThen(args, ctx) {
    // Simple: IfThen [var] = "value" [ ... ]
    log('IfThen: evaluado (usa el editor de scripts para lógica compleja)', 'info');
  },

  Loop(args, ctx) {
    const n = parseInt(args[0]) || 1;
    log(`Loop: ${n} iteraciones programadas`, 'info');
  },

  ClearConsole() { clearConsole(); },

  ListVars() {
    const keys = Object.keys(variables);
    if (keys.length === 0) { log('Sin variables definidas', 'info'); return; }
    keys.forEach(k => log(`  [${k}] = "${variables[k]}"`, 'info'));
  },

  OpenURL(args) {
    const url = args[0].replace(/^"|"$/g, '');
    window.open(url, '_blank');
    log(`OpenURL: ${url}`, 'ok');
  },

  Help() {
    log('═══ Comandos NeoBook Web ═══', 'info');
    const cmds = [
      'GoPage <n>                    — navegar a página',
      'ShowMessage "<msg>"           — mostrar alerta',
      'SetVariable <n> = "<val>"     — definir variable',
      'Print <[var]|"msg">           — imprimir en consola',
      'GetInput prompt="?" var=<n>  — pedir input al usuario',
      'PlaySound <beep|hz>           — reproducir sonido',
      'Loop <n> [...]                — repetir n veces',
      'IfThen [v] = "<x>" [...]      — condicional',
      'OpenURL "<url>"               — abrir enlace',
      'ClearConsole                  — limpiar consola',
      'ListVars                      — listar variables',
    ];
    cmds.forEach(c => log('  ' + c, 'info'));
  }
};

function resolveVars(str, ctx = {}) {
  return String(str).replace(/\[(\w+)\]/g, (_, name) =>
    variables[name] !== undefined ? variables[name] : `[${name}]`
  );
}

function executeScript(scriptText, ctx = {}) {
  const lines = scriptText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//'));

  for (const line of lines) {
    const match = line.match(/^(\w+)\s*(.*)?$/);
    if (!match) continue;
    const cmd     = match[1];
    const argsStr = (match[2] || '').trim();
    const args    = argsStr ? (argsStr.match(/(?:[^\s"]+|"[^"]*")+/g) || []) : [];

    if (COMMANDS[cmd]) {
      try { COMMANDS[cmd](args, ctx); }
      catch (e) { log(`Error en ${cmd}: ${e.message}`, 'err'); }
    } else {
      log(`Comando desconocido: "${cmd}" — escribe Help para ver la lista`, 'err');
    }
  }
}

// ── CONSOLE INPUT ─────────────────────────────────────────────────────────────
function execCmd() {
  const input = document.getElementById('cmd-input');
  const cmd   = input.value.trim();
  if (!cmd) return;
  cmdHistory.unshift(cmd);
  cmdHistoryIdx = -1;
  log('> ' + cmd, 'info');
  executeScript(cmd);
  input.value = '';
}

function cmdKeyDown(e) {
  if (e.key === 'Enter') { execCmd(); return; }
  if (e.key === 'ArrowUp') {
    cmdHistoryIdx = Math.min(cmdHistoryIdx + 1, cmdHistory.length - 1);
    e.target.value = cmdHistory[cmdHistoryIdx] || '';
  }
  if (e.key === 'ArrowDown') {
    cmdHistoryIdx = Math.max(cmdHistoryIdx - 1, -1);
    e.target.value = cmdHistoryIdx < 0 ? '' : cmdHistory[cmdHistoryIdx];
  }
}

// ── PAGES ─────────────────────────────────────────────────────────────────────
function changePage(delta) {
  const np = currentPage + delta;
  if (np < 1 || np > totalPages) return;
  currentPage = np;
  document.getElementById('cur-page').textContent = np;
  log(`Página ${np}`, 'info');
}

// ── RUN APP ───────────────────────────────────────────────────────────────────
function runApp() {
  const po = document.getElementById('preview-overlay');
  const pc = document.getElementById('preview-canvas');
  po.classList.add('show');

  pc.style.position  = 'relative';
  pc.style.width     = '100%';
  pc.style.minHeight = '300px';
  pc.innerHTML       = '';

  widgets.forEach(wObj => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${wObj.x}px;top:${wObj.y}px;width:${wObj.w}px;height:${wObj.h}px`;
    el.innerHTML = wObj.html;
    pc.appendChild(el);
  });

  // Execute OnPageLoad
  const script = document.getElementById('script-editor').value;
  const onLoad = script.match(/OnPageLoad\s*\[([\s\S]*?)\]/);
  if (onLoad) executeScript(onLoad[1]);

  log('▶ Aplicación ejecutada', 'ok');
}

function closePreview() {
  document.getElementById('preview-overlay').classList.remove('show');
}

// ── VARIABLES TAB ─────────────────────────────────────────────────────────────
function renderVars() {
  const c    = document.getElementById('vars-table');
  const keys = Object.keys(variables);

  if (keys.length === 0) {
    c.innerHTML = '<div style="color:var(--nb-muted);font-size:12px;text-align:center;padding:20px">Sin variables. Usa <code>SetVariable</code> en la consola.</div>';
    return;
  }

  c.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:12px;font-family:monospace">
      <thead>
        <tr style="border-bottom:1px solid var(--nb-border)">
          <th style="text-align:left;padding:6px;color:var(--nb-muted);font-weight:600">Variable</th>
          <th style="text-align:left;padding:6px;color:var(--nb-muted);font-weight:600">Valor</th>
          <th style="width:40px"></th>
        </tr>
      </thead>
      <tbody>
        ${keys.map(k => `
          <tr style="border-bottom:1px solid var(--nb-border)">
            <td style="padding:6px;color:var(--nb-accent2)">[${k}]</td>
            <td style="padding:6px;color:var(--nb-text)">${variables[k]}</td>
            <td style="padding:6px">
              <button onclick="deleteVar('${k}')"
                style="background:none;border:none;color:var(--nb-accent3);cursor:pointer;font-size:12px">✕</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

window.deleteVar = function(name) {
  delete variables[name];
  renderVars();
  log(`Variable [${name}] eliminada`, 'warn');
};

function addVar() {
  const name = prompt('Nombre de variable:');
  if (!name || !name.trim()) return;
  const val = prompt(`Valor inicial para [${name.trim()}]:`) || '';
  variables[name.trim()] = val;
  renderVars();
  log(`Variable [${name.trim()}] = "${val}"`, 'ok');
}

// ── MENU ACTIONS ──────────────────────────────────────────────────────────────
function menuAction(action) {
  switch (action) {
    case 'new':
      if (confirm('¿Nuevo proyecto? El canvas actual se borrará.')) { clearCanvas(); variables = {}; log('Nuevo proyecto', 'info'); }
      break;
    case 'edit':
      log('Editar: usa el panel derecho de propiedades', 'info');
      break;
    case 'page':
      log(`Páginas: ${totalPages} en total. Navega con ‹ ›`, 'info');
      break;
    case 'obj':
      log('Objetos: arrastra desde la paleta o activa una herramienta y haz clic', 'info');
      break;
  }
}

function showHelp() {
  COMMANDS.Help();
}

// ── QUICK CMD INSERT ──────────────────────────────────────────────────────────
function insertCmd(cmd) {
  const input = document.getElementById('cmd-input');
  input.value = cmd + ' ';
  input.focus();
}

function insertToScript(code) {
  const ta  = document.getElementById('script-editor');
  const pos = ta.selectionStart;
  ta.value  = ta.value.substring(0, pos) + '\n' + code + '\n' + ta.value.substring(pos);
  ta.focus();
  log(`Insertado: ${code.split('\n')[0]}`, 'info');
}

// ── EXPORT HTML ───────────────────────────────────────────────────────────────
function exportProject() {
  let widgetHTML = widgets.map(wObj => `
  <div style="position:absolute;left:${wObj.x}px;top:${wObj.y}px;width:${wObj.w}px;height:${wObj.h}px">
    ${wObj.html}
  </div>`).join('');

  const script = document.getElementById('script-editor').value;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi App NeoBook</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; background: #fff; font-family: Syne, sans-serif; }
    #app { position: relative; width: 600px; min-height: 420px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
  </style>
</head>
<body>
  <div id="app">
    ${widgetHTML}
  </div>
  <script>
    var variables = {};
    function resolveVars(s) { return String(s).replace(/\\[(\\w+)\\]/g, (_,n) => variables[n] !== undefined ? variables[n] : '['+n+']'); }
    // NeoBook runtime script
    window.addEventListener('DOMContentLoaded', function() {
      ${script.replace(/OnPageLoad\s*\[([\s\S]*?)\]/, 'var _onLoad = function(){\n$1\n}; _onLoad();')}
    });
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'mi-app-neobook.html';
  a.click();
  log('Exportado como mi-app-neobook.html', 'ok');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  log('NeoBook Web v1.0 iniciado', 'ok');
  log('Revive el clásico constructor de aplicaciones — ahora en el navegador', 'info');
  log('Escribe Help para ver los comandos disponibles', 'info');

  // Demo widgets
  makeWidget('label',  40, 30);
  makeWidget('button', 40, 80);
  makeWidget('input',  40, 140);

  // Ensure design view visible
  switchTab('design');
});

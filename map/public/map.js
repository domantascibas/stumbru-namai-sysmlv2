const svg = document.getElementById('map');
const coordsEl = document.getElementById('coords');
const gridStepEl = document.getElementById('grid-step');
const zoomEl = document.getElementById('zoom');
const fitBtn = document.getElementById('fit');

// UI elements
const totalAreaEl = document.getElementById('total-area');
const roomListEl = document.getElementById('room-list');
const roomsBtn = document.getElementById('rooms-btn');
const roomsDropdown = document.getElementById('rooms-dropdown');
const addRoomBtn = document.getElementById('add-room');
const editPanel = document.getElementById('edit-panel');
const modalOverlay = document.getElementById('modal-overlay');
const editTitleEl = document.getElementById('edit-title');
const roomForm = document.getElementById('room-form');
const roomIdEl = document.getElementById('room-id');
const roomNameEl = document.getElementById('room-name');
const roomXEl = document.getElementById('room-x');
const roomYEl = document.getElementById('room-y');
const roomWidthEl = document.getElementById('room-width');
const roomDepthEl = document.getElementById('room-depth');
const deleteRoomBtn = document.getElementById('delete-room');
const cancelEditBtn = document.getElementById('cancel-edit');

const nf = new Intl.NumberFormat('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfArea = new Intl.NumberFormat('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let layout = { step: 0.1, rooms: [], devices: [] };
const view = { s: 60, ox: 60, oy: 60 };
let cursor = null;
let drag = null;
let selectedRoomId = null;
let editMode = false;

const STEP_CANDIDATES = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
const MIN_PX = 7;
const MAJOR_PX = 48;

const snap = (v) => Math.round(v / layout.step) * layout.step;
const clean = (v) => +v.toFixed(10);
const toScreenX = (wx) => wx * view.s + view.ox;
const toScreenY = (wy) => wy * view.s + view.oy;
const toWorldX = (px) => (px - view.ox) / view.s;
const toWorldY = (py) => (py - view.oy) / view.s;

function devicePos(d) {
  const room = layout.rooms.find((r) => r.id === d.room);
  return { x: (room?.planX ?? 0) + d.planX, y: (room?.planY ?? 0) + d.planY };
}

// Calculate room area
function calculateRoomArea(room) {
  return room.planWidth * room.planDepth;
}

// Calculate total area of all rooms
function calculateTotalArea() {
  return layout.rooms.reduce((total, room) => total + calculateRoomArea(room), 0);
}

// Find room by ID
function findRoomById(id) {
  return layout.rooms.find(r => r.id === id);
}

// Generate unique room ID
function generateRoomId() {
  let id = 'room-' + Date.now();
  let existing = findRoomById(id);
  let counter = 1;
  while (existing) {
    id = 'room-' + Date.now() + '-' + counter;
    existing = findRoomById(id);
    counter++;
  }
  return id;
}

// Save layout to server
async function saveLayout() {
  try {
    const response = await fetch('/api/layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout)
    });
    if (!response.ok) throw new Error('Failed to save');
    return await response.json();
  } catch (err) {
    console.error('Error saving layout:', err);
    coordsEl.textContent = `klaida: ${err.message}`;
    return null;
  }
}

// Update area display
function updateAreaDisplay() {
  const total = calculateTotalArea();
  totalAreaEl.textContent = `Bendras plotas: ${nfArea.format(total)} m²`;
}

// Update room list
function updateRoomList() {
  roomListEl.innerHTML = layout.rooms.map(room => {
    const area = calculateRoomArea(room);
    return `<div class="room-item" data-id="${escapeHtml(room.id)}">
      <span class="name">${escapeHtml(room.name)}</span>
      <span class="area">${nfArea.format(area)} m²</span>
      <span class="actions">
        <button class="btn-icon edit-btn" data-id="${escapeHtml(room.id)}" title="Redaguoti">✏️</button>
        <button class="btn-icon delete-btn" data-id="${escapeHtml(room.id)}" title="Šalinti">🗑️</button>
      </span>
    </div>`;
  }).join('');
  
  if (layout.rooms.length === 0) {
    roomListEl.innerHTML = '<div class="room-item" style="color: var(--muted);">Nėra kambarių</div>';
  }
  
  // Add event listeners to edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      startEdit(btn.dataset.id);
      closeDropdown();
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteRoom(btn.dataset.id);
      closeDropdown();
    });
  });
  
  // Add click to select room
  document.querySelectorAll('.room-item').forEach(item => {
    item.addEventListener('click', () => {
      const roomId = item.dataset.id;
      const room = findRoomById(roomId);
      if (room) {
        // Select room and center view
        selectedRoomId = roomId;
        const centerX = room.planX + room.planWidth / 2;
        const centerY = room.planY + room.planDepth / 2;
        const w = svg.clientWidth;
        const h = svg.clientHeight;
        if (w && h) {
          view.s = Math.min(Math.max(40, 60), 600);
          view.ox = w / 2 - centerX * view.s;
          view.oy = h / 2 - centerY * view.s;
        }
        closeDropdown();
        render();
      }
    });
  });
}

// Dropdown management
function toggleDropdown() {
  roomsDropdown.classList.toggle('show');
}

function closeDropdown() {
  roomsDropdown.classList.remove('show');
}

// Start editing a room
function startEdit(roomId) {
  const room = findRoomById(roomId);
  if (!room) return;
  
  selectedRoomId = roomId;
  editMode = true;
  editPanel.style.display = 'block';
  modalOverlay.style.display = 'block';
  editTitleEl.textContent = 'Redaguoti kambarį';
  
  roomIdEl.value = room.id;
  roomNameEl.value = room.name;
  roomXEl.value = room.planX;
  roomYEl.value = room.planY;
  roomWidthEl.value = room.planWidth;
  roomDepthEl.value = room.planDepth;
  
  deleteRoomBtn.style.display = 'inline-block';
  roomNameEl.focus();
}

// Start creating a new room
function startCreate() {
  selectedRoomId = null;
  editMode = true;
  editPanel.style.display = 'block';
  modalOverlay.style.display = 'block';
  editTitleEl.textContent = 'Pridėti kambarį';
  
  roomIdEl.value = '';
  roomNameEl.value = '';
  roomXEl.value = cursor ? snap(cursor.x) : 0;
  roomYEl.value = cursor ? snap(cursor.y) : 0;
  roomWidthEl.value = 4;
  roomDepthEl.value = 4;
  
  deleteRoomBtn.style.display = 'none';
  roomNameEl.focus();
}

// Cancel editing
function cancelEdit() {
  editPanel.style.display = 'none';
  modalOverlay.style.display = 'none';
  selectedRoomId = null;
  editMode = false;
}

// Delete a room
async function deleteRoom(roomId) {
  if (!confirm('Ar tikrai norite pašalinti šį kambarį?')) return;
  
  const index = layout.rooms.findIndex(r => r.id === roomId);
  if (index >= 0) {
    layout.rooms.splice(index, 1);
    await saveLayout();
    updateAreaDisplay();
    updateRoomList();
    render();
  }
}

// Save room (create or update)
async function saveRoom(e) {
  e.preventDefault();
  
  const roomId = roomIdEl.value || generateRoomId();
  const room = {
    id: roomId,
    name: roomNameEl.value.trim() || 'Naujas kambarys',
    planX: parseFloat(roomXEl.value) || 0,
    planY: parseFloat(roomYEl.value) || 0,
    planWidth: parseFloat(roomWidthEl.value) || 4,
    planDepth: parseFloat(roomDepthEl.value) || 4
  };
  
  const existingIndex = layout.rooms.findIndex(r => r.id === roomId);
  if (existingIndex >= 0) {
    layout.rooms[existingIndex] = room;
  } else {
    layout.rooms.push(room);
  }
  
  await saveLayout();
  updateAreaDisplay();
  updateRoomList();
  cancelEdit();
  render();
}

function pickStep(minPx) {
  return STEP_CANDIDATES.find((s) => s * view.s >= minPx) ?? STEP_CANDIDATES.at(-1);
}

function gridLines(min, max, step) {
  const lines = [];
  const i0 = Math.ceil(min / step - 1e-9);
  const i1 = Math.floor(max / step + 1e-9);
  for (let i = i0; i <= i1; i++) lines.push(clean(i * step));
  return lines;
}

function render() {
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const minX = toWorldX(0);
  const minY = toWorldY(0);
  const maxX = toWorldX(w);
  const maxY = toWorldY(h);

  const minor = pickStep(MIN_PX);
  const major = pickStep(MAJOR_PX);
  const isMajor = (x) => Math.abs(x / major - Math.round(x / major)) < 1e-6;

  const out = [];

  for (const x of gridLines(minX, maxX, minor)) {
    if (isMajor(x)) continue;
    out.push(`<line class="grid-minor" x1="${toScreenX(x)}" y1="0" x2="${toScreenX(x)}" y2="${h}"/>`);
  }
  for (const y of gridLines(minY, maxY, minor)) {
    if (isMajor(y)) continue;
    out.push(`<line class="grid-minor" x1="0" y1="${toScreenY(y)}" x2="${w}" y2="${toScreenY(y)}"/>`);
  }
  for (const x of gridLines(minX, maxX, major)) {
    out.push(`<line class="grid-major" x1="${toScreenX(x)}" y1="0" x2="${toScreenX(x)}" y2="${h}"/>`);
    out.push(`<text class="grid-label" x="${toScreenX(x) + 3}" y="13">${nf.format(x)}</text>`);
  }
  for (const y of gridLines(minY, maxY, major)) {
    out.push(`<line class="grid-major" x1="0" y1="${toScreenY(y)}" x2="${w}" y2="${toScreenY(y)}"/>`);
    out.push(`<text class="grid-label" x="4" y="${toScreenY(y) - 4}">${nf.format(y)}</text>`);
  }

  if (minX <= 0 && maxX >= 0) {
    out.push(`<line class="axis" x1="${toScreenX(0)}" y1="0" x2="${toScreenX(0)}" y2="${h}"/>`);
    out.push(`<text class="axis-label" x="${w - 24}" y="${toScreenY(0) - 6}">x →</text>`);
  }
  if (minY <= 0 && maxY >= 0) {
    out.push(`<line class="axis" x1="0" y1="${toScreenY(0)}" x2="${w}" y2="${toScreenY(0)}"/>`);
    out.push(`<text class="axis-label" x="${toScreenX(0) + 6}" y="${h - 8}">↓ y</text>`);
  }

  for (const r of layout.rooms) {
    const x = toScreenX(r.planX);
    const y = toScreenY(r.planY);
    const rw = r.planWidth * view.s;
    const rh = r.planDepth * view.s;
    const wall = Math.min(Math.max(0.1 * view.s, 2), 10);
    const isSelected = selectedRoomId === r.id;
    out.push(`<g class="room ${isSelected ? 'selected' : ''}" data-id="${escapeHtml(r.id)}">
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" stroke-width="${wall}" ${isSelected ? 'class="selected"' : ''}/>
      <text class="room-origin" x="${x + wall + 6}" y="${y + wall + 16}">(${nf.format(r.planX)}, ${nf.format(r.planY)})</text>
      <text class="room-name" x="${x + rw / 2}" y="${y + rh / 2 - 4}">${escapeHtml(r.name)}</text>
      <text class="room-size" x="${x + rw / 2}" y="${y + rh / 2 + 16}">${nf.format(r.planWidth)} × ${nf.format(r.planDepth)} m</text>
    </g>`);
  }

  for (const d of layout.devices) {
    const p = devicePos(d);
    const x = toScreenX(p.x);
    const y = toScreenY(p.y);
    out.push(`<g class="device" data-id="${escapeHtml(d.id)}">
      <circle cx="${x}" cy="${y}" r="${Math.min(Math.max(0.06 * view.s, 3), 9)}"/>
      <text x="${x + 12}" y="${y + 4}">${escapeHtml(d.name ?? d.id)}</text>
    </g>`);
  }

  if (cursor) {
    const sx = snap(cursor.x);
    const sy = snap(cursor.y);
    out.push(`<line class="cross" x1="${toScreenX(sx)}" y1="0" x2="${toScreenX(sx)}" y2="${h}"/>`);
    out.push(`<line class="cross" x1="0" y1="${toScreenY(sy)}" x2="${w}" y2="${toScreenY(sy)}"/>`);
    out.push(`<circle class="cross-dot" cx="${toScreenX(sx)}" cy="${toScreenY(sy)}" r="3"/>`);
    coordsEl.textContent = `x ${nf.format(sx)} m · y ${nf.format(sy)} m`;
  } else {
    coordsEl.textContent = 'x – m · y – m';
  }

  gridStepEl.textContent = `tinklelis ${nf.format(minor)} m`;
  zoomEl.textContent = `1 m = ${Math.round(view.s)} px`;

  svg.innerHTML = out.join('\n');
}

function fit() {
  const pts = [[0, 0]];
  for (const r of layout.rooms) {
    pts.push([r.planX, r.planY], [r.planX + r.planWidth, r.planY + r.planDepth]);
  }
  for (const d of layout.devices) pts.push([devicePos(d).x, devicePos(d).y]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs) - 1;
  const minY = Math.min(...ys) - 1;
  const maxX = Math.max(...xs) + 1;
  const maxY = Math.max(...ys) + 1;
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  view.s = Math.min(Math.max(Math.min(w / (maxX - minX), h / (maxY - minY)), 4), 600);
  view.ox = (w - (maxX - minX) * view.s) / 2 - minX * view.s;
  view.oy = (h - (maxY - minY) * view.s) / 2 - minY * view.s;
  render();
}

function pointerPos(e) {
  const rect = svg.getBoundingClientRect();
  return { px: e.clientX - rect.left, py: e.clientY - rect.top };
}

svg.addEventListener('pointerdown', (e) => {
  drag = { cx: e.clientX, cy: e.clientY, ox: view.ox, oy: view.oy };
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove', (e) => {
  const { px, py } = pointerPos(e);
  cursor = { x: toWorldX(px), y: toWorldY(py) };
  if (drag) {
    view.ox = drag.ox + (e.clientX - drag.cx);
    view.oy = drag.oy + (e.clientY - drag.cy);
  }
  render();
});

svg.addEventListener('click', (e) => {
  if (editMode) return;
  const { px, py } = pointerPos(e);
  const wx = toWorldX(px);
  const wy = toWorldY(py);
  
  // Check if clicked on a room
  for (const r of layout.rooms) {
    if (wx >= r.planX && wx <= r.planX + r.planWidth &&
        wy >= r.planY && wy <= r.planY + r.planDepth) {
      // Select the room
      selectedRoomId = r.id;
      startEdit(r.id);
      render();
      return;
    }
  }
  
  // If not editing and clicked on empty space, could start creating a room
  if (e.ctrlKey || e.metaKey) {
    // Ctrl+click to create room at cursor position
    startCreate();
    roomXEl.value = snap(wx);
    roomYEl.value = snap(wy);
  }
});
svg.addEventListener('pointerup', () => { drag = null; });
svg.addEventListener('pointercancel', () => { drag = null; });
svg.addEventListener('pointerleave', () => { cursor = null; render(); });
svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { px, py } = pointerPos(e);
  const wx = toWorldX(px);
  const wy = toWorldY(py);
  view.s = Math.min(Math.max(view.s * Math.exp(-e.deltaY * 0.0012), 4), 600);
  view.ox = px - wx * view.s;
  view.oy = py - wy * view.s;
  render();
}, { passive: false });

fitBtn.addEventListener('click', fit);
window.addEventListener('keydown', (e) => { if (e.key === 'f') fit(); });
window.addEventListener('resize', render);

// Event listeners for room management
roomsBtn.addEventListener('click', toggleDropdown);
addRoomBtn.addEventListener('click', startCreate);
roomForm.addEventListener('submit', saveRoom);
cancelEditBtn.addEventListener('click', cancelEdit);
deleteRoomBtn.addEventListener('click', () => {
  if (selectedRoomId) deleteRoom(selectedRoomId);
});
modalOverlay.addEventListener('click', cancelEdit);

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!roomsDropdown.contains(e.target) && e.target !== roomsBtn) {
    closeDropdown();
  }
});

try {
  const res = await fetch('/api/layout');
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  layout = await res.json();
  fit();
  // Initialize UI
  updateAreaDisplay();
  updateRoomList();
} catch (err) {
  coordsEl.textContent = `klaida: ${err.message}`;
}

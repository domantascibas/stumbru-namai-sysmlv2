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
const roomTypeEl = document.getElementById('room-type');
const roomXEl = document.getElementById('room-x');
const roomYEl = document.getElementById('room-y');
const roomWidthEl = document.getElementById('room-width');
const roomDepthEl = document.getElementById('room-depth');
const roomVerticesEl = document.getElementById('room-vertices');
const rectFormEl = document.getElementById('rect-form');
const polygonFormEl = document.getElementById('polygon-form');
const deleteRoomBtn = document.getElementById('delete-room');
const cancelEditBtn = document.getElementById('cancel-edit');

const nf = new Intl.NumberFormat('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfArea = new Intl.NumberFormat('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let layout = { step: 0.1, rooms: [], devices: [] };
const view = { s: 60, ox: 60, oy: 60 };
let cursor = null;
let panDrag = null;
let roomDrag = null;
let dragStartPos = null;
let dragOffset = { x: 0, y: 0 };
let selectedRoomId = null;
let editMode = false;
let selectedVertexIndex = null;
let vertexDrag = null;

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
  if (room.type === 'polygon' && room.vertices && room.vertices.length > 2) {
    // Use shoelace formula for polygon area
    let area = 0;
    const n = room.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += room.vertices[i][0] * room.vertices[j][1];
      area -= room.vertices[j][0] * room.vertices[i][1];
    }
    return Math.abs(area) / 2;
  }
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
// Calculate center of a room
function getRoomCenter(room) {
  if (room.type === 'polygon' && room.vertices && room.vertices.length > 0) {
    const xs = room.vertices.map(v => v[0]);
    const ys = room.vertices.map(v => v[1]);
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2
    };
  }
  return {
    x: room.planX + room.planWidth / 2,
    y: room.planY + room.planDepth / 2
  };
}

function updateRoomList() {
  roomListEl.innerHTML = layout.rooms.map(room => {
    const area = calculateRoomArea(room);
    const typeLabel = room.type === 'polygon' ? '🔺' : '▭';
    return `<div class="room-item" data-id="${escapeHtml(room.id)}">
      <span class="name">${typeLabel} ${escapeHtml(room.name)}</span>
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
        const center = getRoomCenter(room);
        const w = svg.clientWidth;
        const h = svg.clientHeight;
        if (w && h) {
          view.s = Math.min(Math.max(40, 60), 600);
          view.ox = w / 2 - center.x * view.s;
          view.oy = h / 2 - center.y * view.s;
        }
        closeDropdown();
        render();
      }
    });
  });
}

// Dropdown management
function toggleDropdown() {
  if (roomsDropdown) roomsDropdown.classList.toggle('show');
}

function closeDropdown() {
  if (roomsDropdown) roomsDropdown.classList.remove('show');
}

// Update form visibility based on room type
function updateFormVisibility(type) {
  if (!rectFormEl || !polygonFormEl) return;
  if (type === 'polygon') {
    rectFormEl.style.display = 'none';
    polygonFormEl.style.display = 'block';
  } else {
    rectFormEl.style.display = 'block';
    polygonFormEl.style.display = 'none';
  }
}

// Format vertices as text for textarea
function formatVertices(vertices) {
  if (!vertices) return '';
  return vertices.map(v => `${v[0]},${v[1]}`).join('\n');
}

// Parse vertices from textarea
function parseVertices(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const vertices = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      const parts = trimmed.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
      if (parts.length >= 2) {
        vertices.push([parts[0], parts[1]]);
      }
    }
  }
  return vertices;
}

// Start editing a room
function startEdit(roomId) {
  if (!editPanel || !modalOverlay || !roomIdEl || !roomNameEl || !roomTypeEl || !roomXEl || !roomYEl || !roomWidthEl || !roomDepthEl) return;
  const room = findRoomById(roomId);
  if (!room) return;
  
  selectedRoomId = roomId;
  editMode = true;
  editPanel.style.display = 'block';
  modalOverlay.style.display = 'block';
  editTitleEl.textContent = 'Redaguoti kambarį';
  
  roomIdEl.value = room.id;
  roomNameEl.value = room.name;
  roomTypeEl.value = room.type || 'rect';
  updateFormVisibility(roomTypeEl.value);
  
  if (room.type === 'polygon' && room.vertices) {
    roomVerticesEl.value = formatVertices(room.vertices);
  } else {
    roomXEl.value = room.planX;
    roomYEl.value = room.planY;
    roomWidthEl.value = room.planWidth;
    roomDepthEl.value = room.planDepth;
  }
  
  if (deleteRoomBtn) deleteRoomBtn.style.display = 'inline-block';
  if (roomNameEl) roomNameEl.focus();
}

// Start creating a new room
function startCreate() {
  if (!editPanel || !modalOverlay || !roomIdEl || !roomNameEl || !roomTypeEl || !roomXEl || !roomYEl || !roomWidthEl || !roomDepthEl || !roomVerticesEl) return;
  selectedRoomId = null;
  editMode = true;
  editPanel.style.display = 'block';
  modalOverlay.style.display = 'block';
  editTitleEl.textContent = 'Pridėti kambarį';
  
  roomIdEl.value = '';
  roomNameEl.value = '';
  roomTypeEl.value = 'rect';
  updateFormVisibility('rect');
  
  roomXEl.value = cursor ? snap(cursor.x) : 0;
  roomYEl.value = cursor ? snap(cursor.y) : 0;
  roomWidthEl.value = 4;
  roomDepthEl.value = 4;
  roomVerticesEl.value = '';
  
  if (deleteRoomBtn) deleteRoomBtn.style.display = 'none';
  if (roomNameEl) roomNameEl.focus();
}

// Event listener for room type change
roomTypeEl.addEventListener('change', () => {
  updateFormVisibility(roomTypeEl.value);
});

// Vertex management buttons
document.getElementById('add-vertex')?.addEventListener('click', () => {
  if (!roomVerticesEl) return;
  const current = roomVerticesEl.value;
  const coords = cursor ? `${snap(cursor.x)},${snap(cursor.y)}` : '0,0';
  roomVerticesEl.value = current ? `${current}\n${coords}` : coords;
  roomVerticesEl.focus();
});

document.getElementById('clear-vertices')?.addEventListener('click', () => {
  if (!roomVerticesEl) return;
  roomVerticesEl.value = '';
});

// Cancel editing
function cancelEdit() {
  if (editPanel) editPanel.style.display = 'none';
  if (modalOverlay) modalOverlay.style.display = 'none';
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
  if (!roomIdEl || !roomTypeEl || !roomNameEl) return;
  
  const roomId = roomIdEl.value || generateRoomId();
  const type = roomTypeEl.value;
  
  let room;
  if (type === 'polygon') {
    const vertices = parseVertices(roomVerticesEl.value);
    room = {
      id: roomId,
      type: 'polygon',
      name: roomNameEl.value.trim() || 'Naujas kambarys',
      vertices: vertices.length > 0 ? vertices : [[0, 0], [1, 0], [1, 1], [0, 1]]
    };
  } else {
    room = {
      id: roomId,
      type: 'rect',
      name: roomNameEl.value.trim() || 'Naujas kambarys',
      planX: snap(parseFloat(roomXEl.value) || 0),
      planY: snap(parseFloat(roomYEl.value) || 0),
      planWidth: parseFloat(roomWidthEl.value) || 4,
      planDepth: parseFloat(roomDepthEl.value) || 4
    };
  }
  
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
    const isSelected = selectedRoomId === r.id;
    const isDragging = roomDrag?.roomId === r.id;
    const className = isDragging ? 'dragging' : (isSelected ? 'selected' : '');
    
    let shapeHtml = '';
    let centerX, centerY;
    
    if (r.type === 'polygon' && r.vertices && r.vertices.length > 0) {
      // Render polygon
      const points = r.vertices.map(v => `${toScreenX(v[0])},${toScreenY(v[1])}`).join(' ');
      const wall = Math.min(Math.max(0.1 * view.s, 1), 6);
      shapeHtml = `<polygon points="${points}" stroke-width="${wall}" ${isSelected || isDragging ? 'class="selected"' : ''}/>`;
      
      // Calculate center for labels
      const xs = r.vertices.map(v => v[0]);
      const ys = r.vertices.map(v => v[1]);
      centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      
      // Add vertex handles if this room is selected
      if (isSelected) {
        for (let i = 0; i < r.vertices.length; i++) {
          const v = r.vertices[i];
          const vx = toScreenX(v[0]);
          const vy = toScreenY(v[1]);
          const vClass = selectedVertexIndex === i ? 'selected' : '';
          shapeHtml += `<g class="vertex ${vClass}" data-room="${escapeHtml(r.id)}" data-index="${i}">
            <circle cx="${vx}" cy="${vy}" />
          </g>`;
        }
      }
    } else {
      // Render rectangle
      const x = toScreenX(r.planX);
      const y = toScreenY(r.planY);
      const rw = r.planWidth * view.s;
      const rh = r.planDepth * view.s;
      const wall = Math.min(Math.max(0.1 * view.s, 2), 10);
      shapeHtml = `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" stroke-width="${wall}" ${isSelected || isDragging ? 'class="selected"' : ''}/>`;
      centerX = r.planX + r.planWidth / 2;
      centerY = r.planY + r.planDepth / 2;
    }
    
    const screenCenterX = toScreenX(centerX);
    const screenCenterY = toScreenY(centerY);
    
    // Calculate area for display
    const area = calculateRoomArea(r);
    
    out.push(`<g class="room ${className}" data-id="${escapeHtml(r.id)}" data-type="${r.type || 'rect'}">
      ${shapeHtml}
      <text class="room-name" x="${screenCenterX}" y="${screenCenterY - 4}">${escapeHtml(r.name)}</text>
      <text class="room-size" x="${screenCenterX}" y="${screenCenterY + 16}">${nfArea.format(area)} m²</text>
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
    if (r.type === 'polygon' && r.vertices) {
      for (const v of r.vertices) {
        pts.push([v[0], v[1]]);
      }
    } else {
      pts.push([r.planX, r.planY], [r.planX + r.planWidth, r.planY + r.planDepth]);
    }
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
  const { px, py } = pointerPos(e);
  const wx = toWorldX(px);
  const wy = toWorldY(py);
  cursor = { x: wx, y: wy };
  
  // Check if clicking on a vertex (for polygon editing) - requires room to be selected
  if (selectedRoomId) {
    const room = findRoomById(selectedRoomId);
    if (room && room.type === 'polygon' && room.vertices) {
      for (let i = 0; i < room.vertices.length; i++) {
        const v = room.vertices[i];
        const dx = Math.abs(wx - v[0]);
        const dy = Math.abs(wy - v[1]);
        if (dx < 0.5 && dy < 0.5) {
          vertexDrag = { roomId: room.id, vertexIndex: i };
          dragStartPos = { x: wx, y: wy };
          svg.setPointerCapture(e.pointerId);
          e.preventDefault();
          return;
        }
      }
    }
    
    // Check if clicking on selected room to drag it
    if (pointInRoom(wx, wy, room)) {
      // Calculate drag offset: distance from mouse to room's reference point
      let offsetX, offsetY;
      if (room.type === 'polygon' && room.vertices && room.vertices.length > 0) {
        offsetX = wx - room.vertices[0][0];
        offsetY = wy - room.vertices[0][1];
      } else {
        offsetX = wx - room.planX;
        offsetY = wy - room.planY;
      }
      roomDrag = { roomId: room.id, offsetX, offsetY,
                   originalVertices: room.type === 'polygon' ? JSON.parse(JSON.stringify(room.vertices)) : null,
                   originalX: room.planX, originalY: room.planY };
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
  }
  
  // Check if clicking on ANY room (not just selected) to start dragging
  // Find the topmost room at this position
  let clickedRoom = null;
  for (let i = layout.rooms.length - 1; i >= 0; i--) {
    const r = layout.rooms[i];
    if (pointInRoom(wx, wy, r)) {
      clickedRoom = r;
      break;
    }
  }
  
  if (clickedRoom) {
    // Start dragging this room
    selectedRoomId = clickedRoom.id;
    // Calculate drag offset: distance from mouse to room's reference point
    let offsetX, offsetY;
    if (clickedRoom.type === 'polygon' && clickedRoom.vertices && clickedRoom.vertices.length > 0) {
      // For polygons, use the first vertex as reference
      offsetX = wx - clickedRoom.vertices[0][0];
      offsetY = wy - clickedRoom.vertices[0][1];
    } else {
      // For rectangles, use top-left corner
      offsetX = wx - clickedRoom.planX;
      offsetY = wy - clickedRoom.planY;
    }
    roomDrag = { roomId: clickedRoom.id, offsetX, offsetY,
                 originalX: clickedRoom.planX, originalY: clickedRoom.planY,
                 originalVertices: clickedRoom.type === 'polygon' ? JSON.parse(JSON.stringify(clickedRoom.vertices)) : null };
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }
  
  // Otherwise start panning
  panDrag = { cx: e.clientX, cy: e.clientY, ox: view.ox, oy: view.oy };
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove', (e) => {
  const { px, py } = pointerPos(e);
  const wx = toWorldX(px);
  const wy = toWorldY(py);
  cursor = { x: wx, y: wy };
  
  if (vertexDrag) {
    // Drag vertex
    const room = findRoomById(vertexDrag.roomId);
    if (room && room.type === 'polygon') {
      // Snap to grid
      room.vertices[vertexDrag.vertexIndex] = [snap(wx), snap(wy)];
    }
    render();
  } else if (roomDrag) {
    // Drag room - calculate new position based on mouse and offset
    const room = findRoomById(roomDrag.roomId);
    if (room) {
      const newX = snap(wx - roomDrag.offsetX);
      const newY = snap(wy - roomDrag.offsetY);
      
      if (room.type === 'polygon') {
        // Move all vertices relative to first vertex
        const dx = newX - room.vertices[0][0];
        const dy = newY - room.vertices[0][1];
        room.vertices = room.vertices.map(v => [snap(v[0] + dx), snap(v[1] + dy)]);
      } else {
        // Move rectangle
        room.planX = newX;
        room.planY = newY;
      }
      
      updateAreaDisplay();
    }
    render();
  } else if (panDrag) {
    view.ox = panDrag.ox + (e.clientX - panDrag.cx);
    view.oy = panDrag.oy + (e.clientY - panDrag.cy);
  }
  render();
});

// Check if point is inside polygon using ray casting algorithm
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check if point is inside room
function pointInRoom(wx, wy, room) {
  if (room.type === 'polygon' && room.vertices && room.vertices.length > 0) {
    return pointInPolygon([wx, wy], room.vertices);
  }
  return wx >= room.planX && wx <= room.planX + room.planWidth &&
         wy >= room.planY && wy <= room.planY + room.planDepth;
}

svg.addEventListener('click', (e) => {
  if (editMode) return;
  const { px, py } = pointerPos(e);
  const wx = toWorldX(px);
  const wy = toWorldY(py);
  
  // Don't open edit if this was part of a drag
  if (roomDrag || vertexDrag || panDrag) {
    // Keep the selection but don't open edit
    render();
    return;
  }
  
  // Check if clicked on a room
  let clickedRoom = null;
  for (const r of layout.rooms) {
    if (pointInRoom(wx, wy, r)) {
      clickedRoom = r;
      break;
    }
  }
  
  if (clickedRoom) {
    if (e.detail === 2) {
      // Double click: edit the room
      startEdit(clickedRoom.id);
    } else {
      // Single click: select the room
      selectedRoomId = clickedRoom.id;
    }
    render();
    return;
  }
  
  // Double click on empty space to create room
  if (e.detail === 2) {
    startCreate();
    roomXEl.value = snap(wx);
    roomYEl.value = snap(wy);
  }
  
  // Ctrl+click to create room at cursor position
  if (e.ctrlKey || e.metaKey) {
    startCreate();
    roomXEl.value = snap(wx);
    roomYEl.value = snap(wy);
  }
});

// Add dedicated double click handler for better compatibility
svg.addEventListener('dblclick', (e) => {
  if (editMode) return;
  
  // Use closest() to find room/vertex element from the click target
  // closest() works on SVG elements in modern browsers
  let element = e.target;
  
  // First try: find nearest .room or .vertex parent
  const roomOrVertex = element.closest?.('.room, .vertex');
  if (roomOrVertex) {
    let roomId = roomOrVertex.getAttribute('data-id') || roomOrVertex.getAttribute('data-room');
    if (roomId) {
      startEdit(roomId);
      return;
    }
    // For text elements inside room, try parent
    const roomGroup = element.closest?.('.room');
    if (roomGroup) {
      roomId = roomGroup.getAttribute('data-id');
      if (roomId) {
        startEdit(roomId);
        return;
      }
    }
  }
  
  // Also check for room-name or room-size text elements
  const textElement = element.closest?.('.room-name, .room-size');
  if (textElement) {
    const roomGroup = textElement.parentNode;
    const roomId = roomGroup?.getAttribute('data-id');
    if (roomId) {
      startEdit(roomId);
      return;
    }
  }

  // Fallback: walk up the DOM tree manually for browsers without closest()
  let target = e.target;
  while (target && target !== svg && target !== document) {
    const cls = (target.getAttribute?.('class') || '') + '';
    if (cls.includes('room') || cls.includes('vertex')) {
      let roomId = target.getAttribute?.('data-id') || target.getAttribute?.('data-room');
      if (roomId) {
        startEdit(roomId);
        return;
      }
    }
    target = target.parentNode;
  }

  // Final fallback to coordinate-based detection
  const { px, py } = pointerPos(e);
  const wx = toWorldX(px);
  const wy = toWorldY(py);

  for (const r of layout.rooms) {
    if (pointInRoom(wx, wy, r)) {
      startEdit(r.id);
      return;
    }
  }

  // Double click on empty space to create room
  startCreate();
  roomXEl.value = snap(wx);
  roomYEl.value = snap(wy);
});
svg.addEventListener('pointerup', () => {
  if (roomDrag) {
    // Save the new position
    saveLayout();
    updateAreaDisplay();
    updateRoomList();
    // Keep the room selected after dragging
    selectedRoomId = roomDrag.roomId;
    roomDrag = null;
    render();
  }
  if (vertexDrag) {
    // Save the new vertex position
    saveLayout();
    updateAreaDisplay();
    updateRoomList();
    vertexDrag = null;
  }
  panDrag = null;
  dragStartPos = null;
});
svg.addEventListener('pointercancel', () => {
  if (roomDrag) {
    // Restore original position on cancel
    const room = findRoomById(roomDrag.roomId);
    if (room) {
      if (room.type === 'polygon' && roomDrag.originalVertices) {
        room.vertices = roomDrag.originalVertices;
      } else if (roomDrag.originalX !== undefined) {
        room.planX = roomDrag.originalX;
        room.planY = roomDrag.originalY;
      }
    }
    roomDrag = null;
  }
  vertexDrag = null;
  panDrag = null;
  dragStartPos = null;
});
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
if (roomsBtn) {
  roomsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
}
if (addRoomBtn) {
  addRoomBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startCreate();
  });
}
roomForm.addEventListener('submit', saveRoom);
cancelEditBtn.addEventListener('click', cancelEdit);
deleteRoomBtn.addEventListener('click', () => {
  if (selectedRoomId) deleteRoom(selectedRoomId);
});
modalOverlay.addEventListener('click', cancelEdit);

// Close dropdown when clicking outside
// But prevent closing when clicking inside the dropdown
roomsDropdown.addEventListener('click', (e) => {
  e.stopPropagation();
});

document.addEventListener('click', (e) => {
  // Only close if the click is not on the rooms button or dropdown
  if (roomsBtn && roomsDropdown && !roomsBtn.contains(e.target) && !roomsDropdown.contains(e.target)) {
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

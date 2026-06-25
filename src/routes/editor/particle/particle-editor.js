// Particle Editor Bundled Client Module

// === utils.js ===
// === utils.js === Pure utility functions (no dependencies)

var Utils = {
  generateId: function() {
    return 'layer-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  },

  clamp: function(val, min, max) {
    return Math.min(max, Math.max(min, val));
  },

  lerp: function(a, b, t) {
    return a + (b - a) * t;
  },

  degToRad: function(deg) {
    return deg * (Math.PI / 180);
  },

  rgbToHex: function(r, g, b) {
    return '#' + [r, g, b].map(function(v) {
      return Utils.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    }).join('');
  },

  hexToRgb: function(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(function(c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  },

  deepClone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  debounce: function(fn, delay) {
    var timer;
    return function() {
      var args = arguments;
      var self = this;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(self, args); }, delay);
    };
  },

  capitalize: function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
};


// === shapes.js ===
// === shapes.js === Shape generators + parameter metadata

var ShapeDefaults = {
  ring:    { radius: 1.5, density: 20, speed: 0.0 },
  spiral:  { radius: 1.2, turns: 2, density: 30, speed: 1.0 },
  helix:   { radius: 1.0, turns: 3, density: 20, speed: 1.0 },
  vortex:  { maxRadius: 1.5, density: 30, twistFactor: 3, speed: 1.0 },
  rain:    { density: 15, spread: 1.5, speed: 1.0 },
  border:  { offsetRange: 0.05 },
  random:  { count: 12, spread: 1.0, seed: 42 },
  custom:  { expression: '', count: 10 }
};

var ShapeParamLabels = {
  radius: 'Radius', density: 'Particle Count', speed: 'Speed',
  turns: 'Turns', maxRadius: 'Max Radius', twistFactor: 'Twist',
  spread: 'Spread', count: 'Count', seed: 'Seed',
  offsetRange: 'Offset', expression: 'Expression'
};

var ShapeParamRanges = {
  radius:      { min: 0.1, max: 4.0, step: 0.1 },
  density:     { min: 1,   max: 100, step: 1 },
  speed:       { min: 0,   max: 5.0, step: 0.1 },
  turns:       { min: 1,   max: 10,  step: 1 },
  maxRadius:   { min: 0.1, max: 4.0, step: 0.1 },
  twistFactor: { min: 1,   max: 10,  step: 0.5 },
  spread:      { min: 0.1, max: 3.0, step: 0.1 },
  count:       { min: 1,   max: 100, step: 1 },
  seed:        { min: 1,   max: 9999, step: 1 },
  offsetRange: { min: 0,   max: 0.5, step: 0.01 }
};

var ShapeIcons = {
  ring: 'bi-circle', spiral: 'bi-tornado', helix: 'bi-infinity',
  vortex: 'bi-bullseye', rain: 'bi-cloud-rain', border: 'bi-fire',
  random: 'bi-dice-3', custom: 'bi-code-slash'
};

var Shapes = {
  ring: function(params, pw, ph, t) {
    var points = [];
    var count = Math.round(params.density || 20);
    var radius = params.radius || 1.5;
    var speed = params.speed || 0;
    var angleOffset = t * speed;
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + angleOffset;
      points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: 0 });
    }
    return points;
  },

  spiral: function(params, pw, ph, t) {
    var points = [];
    var count = Math.round(params.density || 30);
    var radius = params.radius || 1.2;
    var turns = params.turns || 2;
    var speed = params.speed || 1.0;
    var angleOffset = t * speed;
    for (var i = 0; i < count; i++) {
      var frac = i / count;
      var angle = frac * turns * Math.PI * 2 + angleOffset;
      var yPos = -ph / 2 + frac * ph;
      points.push({ x: radius * Math.cos(angle), y: yPos, z: radius * Math.sin(angle) });
    }
    return points;
  },

  helix: function(params, pw, ph, t) {
    var points = [];
    var count = Math.round(params.density || 20);
    var radius = params.radius || 1.0;
    var turns = params.turns || 3;
    var speed = params.speed || 1.0;
    var angleOffset = t * speed;
    for (var strand = 0; strand < 2; strand++) {
      var phaseOffset = strand * Math.PI;
      for (var i = 0; i < count; i++) {
        var frac = i / count;
        var angle = frac * turns * Math.PI * 2 + angleOffset + phaseOffset;
        var yPos = -ph / 2 + frac * ph;
        points.push({ x: radius * Math.cos(angle), y: yPos, z: radius * Math.sin(angle), strand: strand });
      }
    }
    return points;
  },

  vortex: function(params, pw, ph, t) {
    var points = [];
    var count = Math.round(params.density || 30);
    var maxRadius = params.maxRadius || 1.5;
    var twist = params.twistFactor || 3;
    var speed = params.speed || 1.0;
    var angleOffset = t * speed;
    for (var i = 0; i < count; i++) {
      var frac = i / count;
      var r = maxRadius * (1 - frac);
      var angle = frac * twist * Math.PI * 2 + angleOffset;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), z: 0 });
    }
    return points;
  },

  rain: function(params, pw, ph, t) {
    var points = [];
    var count = Math.round(params.density || 15);
    var spread = params.spread || 1.5;
    var speed = params.speed || 1.0;
    for (var i = 0; i < count; i++) {
      var frac = i / count;
      var x = -spread + frac * 2 * spread;
      var phase = ((frac * 7.3 + t * speed) % 1.0 + 1.0) % 1.0;
      var y = ph / 2 - phase * ph;
      points.push({ x: x, y: y, z: 0 });
    }
    return points;
  },

  border: function(params, pw, ph, t) {
    var points = [];
    for (var ty = 1; ty < pw - 1; ty++) {
      for (var tx = 1; tx < ph - 1; tx++) {
        points.push({
          x: ty - (pw / 2 - 0.5),
          y: tx - (ph / 2 - 0.5),
          z: 0,
          isTile: true
        });
      }
    }
    return points;
  },

  random: function(params, pw, ph, t) {
    var points = [];
    var count = Math.round(params.count || 12);
    var spread = params.spread || 1.0;
    var seed = params.seed || 42;
    function rand() {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    }
    for (var i = 0; i < count; i++) {
      points.push({
        x: (rand() - 0.5) * pw * spread,
        y: (rand() - 0.5) * ph * spread,
        z: (rand() - 0.5) * 2 * spread
      });
    }
    return points;
  },

  custom: function(params, pw, ph, t) {
    return [];
  }
};


// === viewport.js ===
// === viewport.js === 3D Canvas Renderer (adapted from v1 editor.js)

var CUBE_VERTICES = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
var CUBE_LINES = [[0,1],[1,3],[3,2],[2,0],[2,6],[3,7],[0,4],[1,5],[6,7],[6,4],[7,5],[4,5]];
var CUBE_FACES = [
  { verts: [0,1,3,2], shade: 0.8 },
  { verts: [5,4,6,7], shade: 0.8 },
  { verts: [4,0,2,6], shade: 0.6 },
  { verts: [1,5,7,3], shade: 0.6 },
  { verts: [4,5,1,0], shade: 1.0 },
  { verts: [2,3,7,6], shade: 0.5 }
];

function Viewport(canvasEl) {
  this.canvas = canvasEl;
  this.ctx = canvasEl.getContext('2d');
  this.width = 0;
  this.height = 0;
  this.projCX = 0;
  this.projCY = 0;
  this.fov = 80;
  this.cameraAngleY = 0.4;
  this.cameraAngleX = 0.15;
  this.cameraZoom = -550;
  this.isDragging = false;
  this.lastMouseX = 0;
  this.lastMouseY = 0;
  this.cubes = [];
  this.particles = [];
  this.faceBuffer = [];
  this.animId = null;
  this.textures = { frame: null, inside: null };
  this.texturesLoaded = 0;

  var self = this;

  // Load textures
  this.textures.frame = new Image();
  this.textures.frame.onload = function() { self.texturesLoaded++; self._buildPortal(); };
  this.textures.frame.src = '../portal/Images/frames/obsidian.png';

  this.textures.inside = new Image();
  this.textures.inside.onload = function() { self.texturesLoaded++; self._buildPortal(); };
  this.textures.inside.src = '../portal/Images/frames/nether_portal.png';

  // Events
  canvasEl.addEventListener('mousedown', function(e) {
    self.isDragging = true;
    self.lastMouseX = e.clientX;
    self.lastMouseY = e.clientY;
  });
  canvasEl.addEventListener('mousemove', function(e) {
    if (!self.isDragging) return;
    var dx = e.clientX - self.lastMouseX;
    var dy = e.clientY - self.lastMouseY;
    self.cameraAngleY += dx * 0.005;
    self.cameraAngleX = Utils.clamp(self.cameraAngleX + dy * 0.005, -1.2, 1.2);
    self.lastMouseX = e.clientX;
    self.lastMouseY = e.clientY;
  });
  canvasEl.addEventListener('mouseup', function() { self.isDragging = false; });
  canvasEl.addEventListener('mouseleave', function() { self.isDragging = false; });
  canvasEl.addEventListener('wheel', function(e) {
    e.preventDefault();
    self.cameraZoom -= e.deltaY * 0.15;
    self.cameraZoom = Utils.clamp(self.cameraZoom, -600, -450);
  }, { passive: false });

  // Resize
  var ro = new ResizeObserver(function() { self.resize(); });
  ro.observe(canvasEl.parentElement);

  this.resize();
  this._buildPortal();
}

Viewport.prototype.resize = function() {
  var container = this.canvas.parentElement;
  this.width = container.clientWidth;
  this.height = container.clientHeight;
  var dpr = window.devicePixelRatio || 1;
  this.canvas.width = this.width * dpr;
  this.canvas.height = this.height * dpr;
  this.canvas.style.width = this.width + 'px';
  this.canvas.style.height = this.height + 'px';
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.fov = this.width * 0.5;
  this.projCX = this.width / 2;
  this.projCY = this.height / 2;
};

Viewport.prototype.resetCamera = function() {
  this.cameraAngleY = 0.4;
  this.cameraAngleX = 0.15;
  this.cameraZoom = -550;
};

Viewport.prototype._buildPortal = function() {
  this.cubes = [];
  var pw = 4, ph = 5;
  for (var y = 0; y < pw; y++) {
    for (var x = 0; x < ph; x++) {
      var isFrame = (y === 0 || y === pw - 1) || (x === 0 || x === ph - 1);
      this.cubes.push({
        x: y - 1.5, y: x - 2, z: 0, radius: 0.5,
        texture: isFrame ? this.textures.frame : this.textures.inside,
        alpha: isFrame ? 1.0 : 0.75
      });
    }
  }
};

Viewport.prototype.rotatePoint = function(x, y, z) {
  var cosY = Math.cos(this.cameraAngleY), sinY = Math.sin(this.cameraAngleY);
  var cosX = Math.cos(this.cameraAngleX), sinX = Math.sin(this.cameraAngleX);
  var rx = x * cosY - z * sinY;
  var rz = x * sinY + z * cosY;
  var ry = y * cosX - rz * sinX;
  var rz2 = y * sinX + rz * cosX;
  return { x: rx, y: ry, z: rz2 };
};

Viewport.prototype._project = function(x, y, z) {
  var r = this.rotatePoint(x, y, z);
  var fov = this.fov + this.cameraZoom;
  var sp = fov + r.z * 5;
  return { x: r.x * sp + this.projCX, y: r.y * sp + this.projCY, size: sp };
};

Viewport.prototype._collectCubeFaces = function(cube, buffer) {
  var proj = [], rotated = [];
  for (var i = 0; i < 8; i++) {
    var vx = cube.x + cube.radius * CUBE_VERTICES[i][0];
    var vy = cube.y + cube.radius * CUBE_VERTICES[i][1];
    var vz = cube.z + cube.radius * CUBE_VERTICES[i][2];
    proj.push(this._project(vx, vy, vz));
    rotated.push(this.rotatePoint(vx, vy, vz));
  }
  for (var f = 0; f < CUBE_FACES.length; f++) {
    var face = CUBE_FACES[f];
    var vi = face.verts;
    var p0 = proj[vi[0]], p1 = proj[vi[1]], p2 = proj[vi[2]], p3 = proj[vi[3]];
    var dx1 = p1.x - p0.x, dy1 = p1.y - p0.y;
    var dx2 = p2.x - p0.x, dy2 = p2.y - p0.y;
    if (dx1 * dy2 - dy1 * dx2 >= 0) continue;
    var avgZ = (rotated[vi[0]].z + rotated[vi[1]].z + rotated[vi[2]].z + rotated[vi[3]].z) / 4;
    buffer.push({
      verts: [p0, p1, p2, p3], avgZ: avgZ,
      shade: face.shade, texture: cube.texture, alpha: cube.alpha
    });
  }
};

Viewport.prototype._collectParticle = function(p, buffer) {
  var t = (performance.now() - (p.spawnTime || 0)) * 0.001;
  var ax = p.x + Math.sin(t * 1.5 + (p.phase || 0)) * (p.driftX || 0);
  var ay = p.y + Math.cos(t * 1.2 + (p.phase || 0)) * (p.driftY || 0);
  var az = p.z + Math.sin(t * 0.8 + (p.phase || 0) * 1.3) * (p.driftZ || 0);
  var rot = this.rotatePoint(ax, ay, az);
  buffer.push({
    isParticle: true, rotated: rot, avgZ: rot.z,
    r: p.r, g: p.g, b: p.b, pSize: p.size || 2
  });
};

Viewport.prototype._drawTexTri = function(p0, p1, p2, tex, tw, th, shade, alpha, a, b, c, d, e, f) {
  var ctx = this.ctx;
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
  ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tex, 0, 0);
  ctx.restore();
  if (shade < 1) {
    ctx.save();
    ctx.globalAlpha = (alpha < 1 ? alpha : 1) * (1 - shade);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.closePath(); ctx.fillStyle = '#000'; ctx.fill();
    ctx.restore();
  }
};

Viewport.prototype._drawFace = function(face) {
  var v = face.verts, tex = face.texture, ctx = this.ctx;
  if (tex && tex.complete && tex.naturalWidth > 0) {
    var tw = tex.naturalWidth, th = tex.naturalHeight;
    this._drawTexTri(v[0], v[1], v[3], tex, tw, th, face.shade, face.alpha,
      (v[1].x-v[0].x)/tw, (v[1].y-v[0].y)/tw,
      (v[3].x-v[0].x)/th, (v[3].y-v[0].y)/th, v[0].x, v[0].y);
    this._drawTexTri(v[1], v[2], v[3], tex, tw, th, face.shade, face.alpha,
      (v[2].x-v[3].x)/tw, (v[2].y-v[3].y)/tw,
      (v[2].x-v[1].x)/th, (v[2].y-v[1].y)/th,
      v[1].x-v[2].x+v[3].x, v[1].y-v[2].y+v[3].y);
  } else {
    ctx.save();
    if (face.alpha < 1) ctx.globalAlpha = face.alpha;
    ctx.beginPath();
    ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
    ctx.lineTo(v[2].x, v[2].y); ctx.lineTo(v[3].x, v[3].y);
    ctx.closePath();
    var bv = Math.floor(face.shade * 100 + 50);
    ctx.fillStyle = 'rgb('+bv+','+bv+','+bv+')';
    ctx.fill(); ctx.restore();
  }
};

Viewport.prototype._drawParticle = function(p) {
  var fov = this.fov + this.cameraZoom;
  var sp = fov + p.rotated.z * 5;
  var px = p.rotated.x * sp + this.projCX;
  var py = p.rotated.y * sp + this.projCY;
  var s = Math.max(3, sp * 0.055 * p.pSize);
  var ctx = this.ctx;
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = 'rgb('+p.r+','+p.g+','+p.b+')';
  ctx.fillRect(px - s*0.75, py - s*0.75, s*1.5, s*1.5);
  ctx.restore();
  ctx.fillStyle = 'rgb('+p.r+','+p.g+','+p.b+')';
  ctx.fillRect(px - s/2, py - s/2, s, s);
};

Viewport.prototype.setParticles = function(data) {
  this.particles = data;
};

Viewport.prototype.render = function() {
  var self = this;
  var ctx = this.ctx;
  ctx.clearRect(0, 0, this.width, this.height);

  // Collect faces
  this.faceBuffer.length = 0;
  for (var i = 0; i < this.cubes.length; i++) {
    this._collectCubeFaces(this.cubes[i], this.faceBuffer);
  }
  for (var i = 0; i < this.particles.length; i++) {
    this._collectParticle(this.particles[i], this.faceBuffer);
  }

  // Depth sort
  this.faceBuffer.sort(function(a, b) { return a.avgZ - b.avgZ; });

  // Draw
  for (var i = 0; i < this.faceBuffer.length; i++) {
    var item = this.faceBuffer[i];
    if (item.isParticle) this._drawParticle(item);
    else this._drawFace(item);
  }

  this.animId = requestAnimationFrame(function() { self.render(); });
};

Viewport.prototype.start = function() {
  if (!this.animId) this.render();
};

Viewport.prototype.stop = function() {
  if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
};


// === layers.js ===
// === layers.js === Layer panel UI

function LayerPanel(containerEl, app) {
  this.container = containerEl;
  this.app = app;
}

LayerPanel.prototype.render = function() {
  var self = this;
  this.container.innerHTML = '';
  var layers = this.app.state.layers;

  if (layers.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'inspector-empty';
    empty.style.height = 'auto';
    empty.style.padding = '30px 20px';
    empty.innerHTML = '<i class="bi bi-layers" style="font-size:24px;margin-bottom:8px;opacity:0.4"></i><p>No layers yet. Click + to add one.</p>';
    this.container.appendChild(empty);
    return;
  }

  layers.forEach(function(layer, index) {
    var el = document.createElement('div');
    el.className = 'layer-item';
    if (layer.id === self.app.selectedLayerId) el.className += ' selected';
    if (!layer.enabled) el.className += ' disabled';
    el.dataset.layerId = layer.id;

    // Color dot
    var dot = document.createElement('span');
    dot.className = 'layer-color-dot';
    dot.style.backgroundColor = Utils.rgbToHex(layer.particle.color.r, layer.particle.color.g, layer.particle.color.b);
    el.appendChild(dot);

    // Name
    var nameSpan = document.createElement('span');
    nameSpan.className = 'layer-name';
    nameSpan.textContent = layer.name;
    el.appendChild(nameSpan);

    // Shape type badge
    var badge = document.createElement('span');
    badge.style.cssText = 'font-size:9px;color:var(--pe-text-dim);font-weight:600;text-transform:uppercase;letter-spacing:0.04em;flex-shrink:0';
    badge.textContent = layer.shape.type;
    el.appendChild(badge);

    // Actions
    var actions = document.createElement('span');
    actions.className = 'layer-actions';

    var eyeBtn = document.createElement('button');
    eyeBtn.className = 'layer-action-btn';
    eyeBtn.innerHTML = layer.enabled ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
    eyeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      self.app.toggleLayerVisibility(layer.id);
    });
    actions.appendChild(eyeBtn);

    var delBtn = document.createElement('button');
    delBtn.className = 'layer-action-btn danger';
    delBtn.innerHTML = '<i class="bi bi-trash3"></i>';
    delBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      self.app.deleteLayer(layer.id);
    });
    actions.appendChild(delBtn);

    el.appendChild(actions);

    el.addEventListener('click', function() {
      self.app.selectLayer(layer.id);
    });

    self.container.appendChild(el);
  });
};


// === inspector.js ===
// === inspector.js === Properties inspector panel

var PARTICLE_TYPES = [
  'REDSTONE', 'FLAME', 'ENCHANTMENT_TABLE', 'END_ROD', 'VILLAGER_HAPPY',
  'HEART', 'SMOKE_NORMAL', 'SMOKE_LARGE', 'SPELL_MOB', 'CRIT',
  'CRIT_MAGIC', 'CLOUD', 'FIREWORKS_SPARK', 'WATER_DROP', 'LAVA',
  'NOTE', 'TOTEM', 'DRAGON_BREATH', 'SQUID_INK', 'SNOWFLAKE',
  'SOUL_FIRE_FLAME', 'DRIPPING_HONEY', 'FALLING_NECTAR'
];

function Inspector(containerEl, app) {
  this.container = containerEl;
  this.app = app;
}

Inspector.prototype.render = function() {
  this.container.innerHTML = '';
  var layer = this.app.getSelectedLayer();
  if (!layer) {
    this.container.innerHTML = '<div class="inspector-empty"><i class="bi bi-cursor"></i><p>Select a layer to edit</p></div>';
    return;
  }
  this._addGeneralSection(layer);
  this._addParticleSection(layer);
  this._addShapeSection(layer);
  this._addPositionSection(layer);
  this._addAnimationSection(layer);
};

Inspector.prototype._section = function(title) {
  var sec = document.createElement('div');
  sec.className = 'insp-section';
  var t = document.createElement('div');
  t.className = 'insp-section-title';
  t.textContent = title;
  sec.appendChild(t);
  this.container.appendChild(sec);
  return sec;
};

Inspector.prototype._row = function(parent, label) {
  var row = document.createElement('div');
  row.className = 'insp-row';
  if (label) {
    var lbl = document.createElement('span');
    lbl.className = 'insp-label';
    lbl.textContent = label;
    row.appendChild(lbl);
  }
  parent.appendChild(row);
  return row;
};

Inspector.prototype._input = function(row, value, onChange) {
  var inp = document.createElement('input');
  inp.className = 'insp-input';
  inp.type = 'text';
  inp.value = value;
  inp.addEventListener('change', function() { onChange(inp.value); });
  row.appendChild(inp);
  return inp;
};

Inspector.prototype._select = function(row, value, options, onChange) {
  var sel = document.createElement('select');
  sel.className = 'insp-select';
  options.forEach(function(opt) {
    var o = document.createElement('option');
    o.value = opt; o.textContent = opt;
    if (opt === value) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function() { onChange(sel.value); });
  row.appendChild(sel);
  return sel;
};

Inspector.prototype._slider = function(row, value, min, max, step, onChange) {
  var slider = document.createElement('input');
  slider.className = 'insp-slider';
  slider.type = 'range';
  slider.min = min; slider.max = max; slider.step = step;
  slider.value = value;

  var num = document.createElement('input');
  num.className = 'insp-num';
  num.type = 'text';
  num.value = value;

  slider.addEventListener('input', function() {
    num.value = slider.value;
    onChange(parseFloat(slider.value));
  });
  num.addEventListener('change', function() {
    var v = Utils.clamp(parseFloat(num.value) || 0, min, max);
    num.value = v; slider.value = v;
    onChange(v);
  });

  row.appendChild(slider);
  row.appendChild(num);
};

Inspector.prototype._toggle = function(row, checked, onChange) {
  var sw = document.createElement('label');
  sw.className = 'toggle-switch';
  var inp = document.createElement('input');
  inp.type = 'checkbox'; inp.checked = checked;
  inp.addEventListener('change', function() { onChange(inp.checked); });
  var track = document.createElement('span');
  track.className = 'toggle-track';
  sw.appendChild(inp); sw.appendChild(track);
  row.appendChild(sw);
};

// --- Sections ---

Inspector.prototype._addGeneralSection = function(layer) {
  var self = this, sec = this._section('General');
  var nameRow = this._row(sec, 'Name');
  this._input(nameRow, layer.name, function(v) {
    self.app.updateLayer(layer.id, { name: v });
  });
  var secRow = this._row(sec, 'Section');
  this._select(secRow, layer.section, ['portal', 'tile'], function(v) {
    self.app.updateLayerDeep(layer.id, 'section', v);
  });
  var enRow = document.createElement('div');
  enRow.className = 'toggle-row';
  var enLbl = document.createElement('span');
  enLbl.className = 'insp-label'; enLbl.textContent = 'Enabled';
  enRow.appendChild(enLbl);
  this._toggle(enRow, layer.enabled, function(v) {
    self.app.updateLayer(layer.id, { enabled: v });
  });
  sec.appendChild(enRow);
};

Inspector.prototype._addParticleSection = function(layer) {
  var self = this, sec = this._section('Particle');
  var typeRow = this._row(sec, 'Type');
  this._select(typeRow, layer.particle.type, PARTICLE_TYPES, function(v) {
    self.app.updateLayerDeep(layer.id, 'particle.type', v);
  });
  var sizeRow = this._row(sec, 'Size');
  this._slider(sizeRow, layer.particle.size, 0.5, 10, 0.5, function(v) {
    self.app.updateLayerDeep(layer.id, 'particle.size', v);
  });
  // Color picker
  this._addColorPicker(sec, layer);
};

Inspector.prototype._addColorPicker = function(sec, layer) {
  var self = this;
  var c = layer.particle.color;

  var picker = document.createElement('div');
  picker.className = 'color-picker';

  // Top row: swatch + hex
  var topRow = document.createElement('div');
  topRow.className = 'color-top-row';

  var swatch = document.createElement('div');
  swatch.className = 'color-swatch';
  swatch.style.backgroundColor = Utils.rgbToHex(c.r, c.g, c.b);
  var colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = Utils.rgbToHex(c.r, c.g, c.b);
  swatch.appendChild(colorInput);
  topRow.appendChild(swatch);

  var hexInput = document.createElement('input');
  hexInput.className = 'color-hex';
  hexInput.value = Utils.rgbToHex(c.r, c.g, c.b);
  topRow.appendChild(hexInput);
  picker.appendChild(topRow);

  // RGB sliders
  var channels = [
    { key: 'r', label: 'R', color: '#ff4444' },
    { key: 'g', label: 'G', color: '#44ff44' },
    { key: 'b', label: 'B', color: '#4488ff' }
  ];
  var sliders = {};

  channels.forEach(function(ch) {
    var row = document.createElement('div');
    row.className = 'color-slider-row';

    var lbl = document.createElement('span');
    lbl.className = 'color-slider-label';
    lbl.textContent = ch.label;
    lbl.style.color = ch.color;
    row.appendChild(lbl);

    var slider = document.createElement('input');
    slider.type = 'range'; slider.min = 0; slider.max = 255; slider.step = 1;
    slider.value = c[ch.key];
    slider.style.flex = '1';
    slider.style.accentColor = ch.color;
    row.appendChild(slider);

    var val = document.createElement('span');
    val.className = 'color-slider-val';
    val.textContent = c[ch.key];
    row.appendChild(val);

    sliders[ch.key] = { slider: slider, val: val };
    picker.appendChild(row);
  });

  function updateColor(newC) {
    swatch.style.backgroundColor = Utils.rgbToHex(newC.r, newC.g, newC.b);
    colorInput.value = Utils.rgbToHex(newC.r, newC.g, newC.b);
    hexInput.value = Utils.rgbToHex(newC.r, newC.g, newC.b);
    channels.forEach(function(ch) {
      sliders[ch.key].slider.value = newC[ch.key];
      sliders[ch.key].val.textContent = newC[ch.key];
    });
    self.app.updateLayerDeep(layer.id, 'particle.color', newC);
  }

  colorInput.addEventListener('input', function() {
    var rgb = Utils.hexToRgb(colorInput.value);
    updateColor(rgb);
  });

  hexInput.addEventListener('change', function() {
    var rgb = Utils.hexToRgb(hexInput.value);
    updateColor(rgb);
  });

  channels.forEach(function(ch) {
    sliders[ch.key].slider.addEventListener('input', function() {
      var newC = {
        r: parseInt(sliders.r.slider.value),
        g: parseInt(sliders.g.slider.value),
        b: parseInt(sliders.b.slider.value)
      };
      updateColor(newC);
    });
  });

  sec.appendChild(picker);
};

Inspector.prototype._addShapeSection = function(layer) {
  var self = this, sec = this._section('Shape');

  // Shape selector grid
  var grid = document.createElement('div');
  grid.className = 'shape-selector';
  var shapeTypes = ['ring', 'spiral', 'helix', 'vortex', 'rain', 'border', 'random', 'custom'];
  shapeTypes.forEach(function(type) {
    var btn = document.createElement('button');
    btn.className = 'shape-btn' + (layer.shape.type === type ? ' active' : '');
    btn.innerHTML = '<i class="bi ' + (ShapeIcons[type] || 'bi-circle') + '"></i><span>' + type + '</span>';
    btn.addEventListener('click', function() {
      var newParams = Utils.deepClone(ShapeDefaults[type] || {});
      self.app.updateLayerDeep(layer.id, 'shape', { type: type, params: newParams });
    });
    grid.appendChild(btn);
  });
  sec.appendChild(grid);

  // Dynamic param sliders
  var params = layer.shape.params;
  Object.keys(params).forEach(function(key) {
    if (key === 'expression') return;
    var range = ShapeParamRanges[key] || { min: 0, max: 10, step: 0.1 };
    var row = self._row(sec, ShapeParamLabels[key] || key);
    self._slider(row, params[key], range.min, range.max, range.step, function(v) {
      self.app.updateLayerDeep(layer.id, 'shape.params.' + key, v);
    });
  });
};

Inspector.prototype._addPositionSection = function(layer) {
  var self = this, sec = this._section('Position Offset');
  ['x', 'y', 'z'].forEach(function(axis) {
    var row = self._row(sec, axis.toUpperCase());
    self._slider(row, layer.position[axis], -5, 5, 0.1, function(v) {
      self.app.updateLayerDeep(layer.id, 'position.' + axis, v);
    });
  });
};

Inspector.prototype._addAnimationSection = function(layer) {
  var self = this, sec = this._section('Animation');
  var rotRow = document.createElement('div');
  rotRow.className = 'toggle-row';
  var rotLbl = document.createElement('span');
  rotLbl.className = 'insp-label'; rotLbl.textContent = 'Rotate';
  rotRow.appendChild(rotLbl);
  this._toggle(rotRow, layer.animation.rotate, function(v) {
    self.app.updateLayerDeep(layer.id, 'animation.rotate', v);
  });
  sec.appendChild(rotRow);

  if (layer.animation.rotate) {
    var spdRow = this._row(sec, 'Speed');
    this._slider(spdRow, layer.animation.rotateSpeed, 0, 5, 0.1, function(v) {
      self.app.updateLayerDeep(layer.id, 'animation.rotateSpeed', v);
    });
  }

  var fltRow = document.createElement('div');
  fltRow.className = 'toggle-row';
  var fltLbl = document.createElement('span');
  fltLbl.className = 'insp-label'; fltLbl.textContent = 'Float';
  fltRow.appendChild(fltLbl);
  this._toggle(fltRow, layer.animation.float, function(v) {
    self.app.updateLayerDeep(layer.id, 'animation.float', v);
  });
  sec.appendChild(fltRow);
};


// === presets.js ===
// === presets.js === Preset definitions in v2 format

var Presets = {
  definitions: {
    'Green Spiral': {
      description: 'Spiraling pattern around the portal',
      icon: 'bi-tornado',
      accentColor: '#00ff66',
      frequency: 20,
      layers: [{
        name: 'Green Spiral', enabled: true, section: 'portal',
        particle: { type: 'REDSTONE', color: { r: 0, g: 255, b: 0 }, size: 2 },
        shape: { type: 'spiral', params: { radius: 1.2, turns: 2, density: 30, speed: 1.0 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: true, rotateSpeed: 1.0, float: false }
      }]
    },
    'Pink Ring': {
      description: 'Ring of particles at the portal center',
      icon: 'bi-circle',
      accentColor: '#ff66ff',
      frequency: 5,
      layers: [{
        name: 'Pink Ring', enabled: true, section: 'portal',
        particle: { type: 'REDSTONE', color: { r: 255, g: 100, b: 255 }, size: 1.5 },
        shape: { type: 'ring', params: { radius: 1.5, density: 20, speed: 0 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: false, rotateSpeed: 0, float: false }
      }]
    },
    'Red-Blue Helix': {
      description: 'Double helix with two colors',
      icon: 'bi-infinity',
      accentColor: '#ff3344',
      frequency: 15,
      layers: [{
        name: 'Red Strand', enabled: true, section: 'portal',
        particle: { type: 'REDSTONE', color: { r: 255, g: 50, b: 50 }, size: 1 },
        shape: { type: 'spiral', params: { radius: 1.0, turns: 3, density: 20, speed: 1.0 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: true, rotateSpeed: 1.0, float: false }
      }, {
        name: 'Blue Strand', enabled: true, section: 'portal',
        particle: { type: 'REDSTONE', color: { r: 50, g: 50, b: 255 }, size: 1 },
        shape: { type: 'spiral', params: { radius: 1.0, turns: 3, density: 20, speed: 1.0 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: true, rotateSpeed: 1.0, float: false }
      }]
    },
    'Purple Vortex': {
      description: 'Particles spiraling inward',
      icon: 'bi-bullseye',
      accentColor: '#cc00ff',
      frequency: 10,
      layers: [{
        name: 'Purple Vortex', enabled: true, section: 'portal',
        particle: { type: 'REDSTONE', color: { r: 180, g: 50, b: 255 }, size: 1.5 },
        shape: { type: 'vortex', params: { maxRadius: 1.5, density: 30, twistFactor: 3, speed: 1.0 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: true, rotateSpeed: 1.0, float: false }
      }]
    },
    'Blue Rain': {
      description: 'Particles falling like rain',
      icon: 'bi-cloud-rain',
      accentColor: '#64b4ff',
      frequency: 10,
      layers: [{
        name: 'Blue Rain', enabled: true, section: 'portal',
        particle: { type: 'REDSTONE', color: { r: 100, g: 180, b: 255 }, size: 1 },
        shape: { type: 'rain', params: { density: 15, spread: 1.5, speed: 1.0 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: false, rotateSpeed: 0, float: false }
      }]
    },
    'Flame Border': {
      description: 'Flames on each portal tile',
      icon: 'bi-fire',
      accentColor: '#ff8800',
      frequency: 5,
      layers: [{
        name: 'Flames', enabled: true, section: 'tile',
        particle: { type: 'FLAME', color: { r: 255, g: 140, b: 0 }, size: 1 },
        shape: { type: 'border', params: { offsetRange: 0.05 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: false, rotateSpeed: 0, float: false }
      }]
    },
    'Enchant Glow': {
      description: 'Enchantment particles floating',
      icon: 'bi-stars',
      accentColor: '#66ff66',
      frequency: 8,
      layers: [{
        name: 'Enchant', enabled: true, section: 'portal',
        particle: { type: 'ENCHANTMENT_TABLE', color: { r: 100, g: 255, b: 100 }, size: 1 },
        shape: { type: 'random', params: { count: 12, spread: 1.0, seed: 42 } },
        position: { x: 0, y: 0, z: 0 },
        animation: { rotate: false, rotateSpeed: 0, float: true }
      }]
    },
    'Empty': {
      description: 'Start from scratch',
      icon: 'bi-plus-circle',
      accentColor: '#555570',
      frequency: 20,
      layers: []
    }
  },

  renderGrid: function(containerEl, app) {
    containerEl.innerHTML = '';
    var defs = this.definitions;
    Object.keys(defs).forEach(function(name) {
      var preset = defs[name];
      var card = document.createElement('div');
      card.className = 'preset-card';
      card.innerHTML =
        '<div class="preset-card-icon" style="color:' + preset.accentColor + '"><i class="bi ' + preset.icon + '"></i></div>' +
        '<div class="preset-card-name">' + name + '</div>' +
        '<div class="preset-card-desc">' + preset.description + '</div>';
      card.addEventListener('click', function() { app.loadPreset(name); });
      containerEl.appendChild(card);
    });
  }
};


// === compiler.js ===
// === compiler.js === v2 model -> v1 YAML export

var Compiler = {
  _pc: 0,

  compile: function(state) {
    var v1json = this.toV1Json(state);
    return this.toYaml(v1json, '');
  },

  toV1Json: function(state) {
    var result = {
      start: { frequency: String(state.frequency || 20) },
      tile: {},
      portal: {}
    };
    this._pc = 0;

    var self = this;
    state.layers.forEach(function(layer, idx) {
      if (!layer.enabled) return;

      if (layer.section === 'tile') {
        self._compileTile(layer, idx, result);
      } else {
        self._compilePortal(layer, idx, result);
      }
    });

    return result;
  },

  _compileTile: function(layer, idx, result) {
    // Tile section: one particle at locX, locY, locZ per tile
    if (!result.tile.play) result.tile.play = {};
    var pstr = this._particleStr(layer.particle.type,
      'locX', 'locY', 'locZ', layer.particle.color, layer.particle.size);
    result.tile.play['particle' + (++this._pc)] = pstr;
  },

  _compilePortal: function(layer, idx, result) {
    if (!result.portal.play) result.portal.play = {};
    if (!result.portal.for) result.portal.for = {};

    var p = 'l' + idx + '_'; // variable namespace
    var shape = layer.shape;
    var params = shape.params;
    var pos = layer.position || { x: 0, y: 0, z: 0 };
    var c = layer.particle.color;
    var type = layer.particle.type;
    var size = layer.particle.size;

    switch (shape.type) {
      case 'ring':
        this._compileRing(p, params, pos, type, c, size, result);
        break;
      case 'spiral':
        this._compileSpiral(p, params, pos, type, c, size, result, false);
        break;
      case 'helix':
        this._compileSpiral(p, params, pos, type, c, size, result, true);
        break;
      case 'vortex':
        this._compileVortex(p, params, pos, type, c, size, result);
        break;
      case 'rain':
        this._compileRain(p, params, pos, type, c, size, result);
        break;
      case 'random':
        this._compileRandom(p, params, pos, type, c, size, result);
        break;
      default:
        break;
    }
  },

  _compileRing: function(p, params, pos, type, c, size, result) {
    var count = params.density || 20;
    var radius = params.radius || 1.5;

    result.portal.play[p + 'amount'] = String(count);
    result.portal.play[p + 'increment'] = '(2*3.14)/' + p + 'amount';

    var forKey = p + 'i=0;' + p + 'i<' + p + 'amount;' + p + 'i=' + p + 'i+1';
    var run = {};
    run[p + 'angle'] = p + 'i*' + p + 'increment';
    run[p + 'px'] = 'locX+(' + radius + '*cos(' + p + 'angle))' + this._offset(pos.x);
    run[p + 'py'] = 'locY+(' + radius + '*sin(' + p + 'angle))' + this._offset(pos.y);
    run['particle' + (++this._pc)] = this._particleStr(type,
      p + 'px', p + 'py', 'locZ' + this._offset(pos.z), c, size);
    var forBody = {};
    forBody[p + 'run'] = run;
    result.portal.for[forKey] = forBody;
  },

  _compileSpiral: function(p, params, pos, type, c, size, result, isHelix) {
    var count = params.density || 30;
    var radius = params.radius || 1.2;
    var turns = params.turns || 2;

    result.portal.play[p + 'radius'] = String(radius);
    result.portal.play[p + 'max'] = '0.08*portalHeight';
    result.portal.play[p + 'amount'] = String(count);
    result.portal.play[p + 'increment'] = '(2*3.14)/' + p + 'amount';

    var outerMax = isHelix ? 2 : turns;
    var outerKey = p + 'i=0;' + p + 'i<' + outerMax + ';' + p + 'i=' + p + 'i+1';
    var innerKey = p + 'j=0;' + p + 'j<' + p + 'amount;' + p + 'j=' + p + 'j+1';

    var run = {};
    run[p + 'angle'] = p + 'j*' + p + 'increment';
    run[p + 'px'] = 'locX+(' + p + 'radius*cos(' + p + 'angle))' + this._offset(pos.x);
    run[p + 'pz'] = 'locZ+(' + p + 'radius*sin(' + p + 'angle))' + this._offset(pos.z);
    run['particle' + (++this._pc)] = this._particleStr(type,
      p + 'px',
      'locY-(portalHeight/2)+(' + p + 'i*' + p + 'max*6)+(' + p + 'angle*' + p + 'max)' + this._offset(pos.y),
      p + 'pz', c, size);

    var inner = {};
    inner[p + 'run'] = run;
    var outer = {};
    outer[innerKey] = inner;
    result.portal.for[outerKey] = outer;
  },

  _compileVortex: function(p, params, pos, type, c, size, result) {
    var count = params.density || 30;
    var maxR = params.maxRadius || 1.5;
    var twist = params.twistFactor || 3;

    result.portal.play[p + 'amount'] = String(count);
    result.portal.play[p + 'increment'] = '(2*3.14*' + twist + ')/' + p + 'amount';

    var forKey = p + 'i=0;' + p + 'i<' + p + 'amount;' + p + 'i=' + p + 'i+1';
    var run = {};
    run[p + 'frac'] = p + 'i/' + p + 'amount';
    run[p + 'r'] = maxR + '*(1-' + p + 'frac)';
    run[p + 'angle'] = p + 'i*' + p + 'increment';
    run[p + 'px'] = 'locX+(' + p + 'r*cos(' + p + 'angle))' + this._offset(pos.x);
    run[p + 'py'] = 'locY+(' + p + 'r*sin(' + p + 'angle))' + this._offset(pos.y);
    run['particle' + (++this._pc)] = this._particleStr(type,
      p + 'px', p + 'py', 'locZ' + this._offset(pos.z), c, size);
    var forBody = {};
    forBody[p + 'run'] = run;
    result.portal.for[forKey] = forBody;
  },

  _compileRain: function(p, params, pos, type, c, size, result) {
    var count = params.density || 15;
    var spread = params.spread || 1.5;

    result.portal.play[p + 'amount'] = String(count);

    var forKey = p + 'i=0;' + p + 'i<' + p + 'amount;' + p + 'i=' + p + 'i+1';
    var run = {};
    run[p + 'frac'] = p + 'i/' + p + 'amount';
    run[p + 'px'] = 'locX+(-' + spread + '+' + p + 'frac*' + (spread * 2) + ')' + this._offset(pos.x);
    run['particle' + (++this._pc)] = this._particleStr(type,
      p + 'px', 'locY+(portalHeight/2)' + this._offset(pos.y),
      'locZ' + this._offset(pos.z), c, size);
    var forBody = {};
    forBody[p + 'run'] = run;
    result.portal.for[forKey] = forBody;
  },

  _compileRandom: function(p, params, pos, type, c, size, result) {
    var count = params.count || 12;
    var spread = params.spread || 1.0;

    result.portal.play[p + 'amount'] = String(count);

    var forKey = p + 'i=0;' + p + 'i<' + p + 'amount;' + p + 'i=' + p + 'i+1';
    var run = {};
    run[p + 'px'] = 'locX+(sin(' + p + 'i*7.3)*' + (spread * 2) + ')' + this._offset(pos.x);
    run[p + 'py'] = 'locY+(cos(' + p + 'i*3.7)*' + (spread * 2) + ')' + this._offset(pos.y);
    run['particle' + (++this._pc)] = this._particleStr(type,
      p + 'px', p + 'py', 'locZ' + this._offset(pos.z), c, size);
    var forBody = {};
    forBody[p + 'run'] = run;
    result.portal.for[forKey] = forBody;
  },

  _offset: function(val) {
    if (!val || val === 0) return '';
    return (val > 0 ? '+' : '') + val;
  },

  _particleStr: function(type, xExpr, yExpr, zExpr, color, size) {
    var dustOpts = '';
    if (type === 'REDSTONE') {
      dustOpts = ' DustOptions(Color(' + color.r + ',' + color.g + ',' + color.b + '),' + size + ')';
    }
    return type + ' ' + xExpr + ' ' + yExpr + ' ' + zExpr + ' 1 0 0 0' + dustOpts;
  },

  // YAML serializer (matches v1 createyml format)
  toYaml: function(json, margin) {
    var res = '';
    var self = this;
    Object.keys(json).forEach(function(key) {
      var val = json[key];
      if (typeof val === 'string') {
        if (key.startsWith('particle')) {
          res += margin + "  - 'play " + val + "'\n";
        } else {
          res += margin + "  - '" + key + ' = ' + val + "'\n";
        }
      } else {
        var empty = Object.keys(val).length === 0;
        res += margin + key + ':' + (empty ? ' []' : '') + '\n';
        if (!empty) res += self.toYaml(val, margin + '  ');
      }
    });
    return res;
  }
};


// === app.js ===
// === app.js === Application controller

(function() {
  'use strict';

  function App() {
    this.state = {
      name: 'My Particle Pack',
      frequency: 20,
      layers: []
    };
    this.selectedLayerId = null;
    this.simulationInterval = null;
    this.simulationTime = 0;
    this.undoStack = [];
    this.redoStack = [];

    // Modules
    this.viewport = new Viewport(document.getElementById('viewport'));
    this.layerPanel = new LayerPanel(document.getElementById('layerList'), this);
    this.inspector = new Inspector(document.getElementById('inspector'), this);

    this._bindToolbar();
    this._bindKeyboard();
    this._bindModals();

    // Start viewport
    this.viewport.start();

    // Load default preset
    this.loadPreset('Green Spiral');

    // Hide loading
    setTimeout(function() {
      document.getElementById('loadingOverlay').style.display = 'none';
    }, 600);
  }

  // --- State ---

  App.prototype.pushUndo = function() {
    this.undoStack.push(Utils.deepClone(this.state));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    this._updateUndoRedo();
  };

  App.prototype.undo = function() {
    if (!this.undoStack.length) return;
    this.redoStack.push(Utils.deepClone(this.state));
    this.state = this.undoStack.pop();
    this.selectedLayerId = this.state.layers.length > 0 ? this.state.layers[0].id : null;
    this._refreshAll();
  };

  App.prototype.redo = function() {
    if (!this.redoStack.length) return;
    this.undoStack.push(Utils.deepClone(this.state));
    this.state = this.redoStack.pop();
    this.selectedLayerId = this.state.layers.length > 0 ? this.state.layers[0].id : null;
    this._refreshAll();
  };

  // --- Layers ---

  App.prototype.addLayer = function(shapeType) {
    this.pushUndo();
    var defaults = ShapeDefaults[shapeType] || {};
    var layer = {
      id: Utils.generateId(),
      name: this._genName(shapeType),
      enabled: true,
      section: shapeType === 'border' ? 'tile' : 'portal',
      particle: {
        type: 'REDSTONE',
        color: { r: 0, g: 212, b: 255 },
        size: 2
      },
      shape: {
        type: shapeType,
        params: Utils.deepClone(defaults)
      },
      position: { x: 0, y: 0, z: 0 },
      animation: {
        rotate: shapeType === 'spiral' || shapeType === 'helix' || shapeType === 'vortex',
        rotateSpeed: 1.0,
        float: false
      }
    };
    this.state.layers.push(layer);
    this.selectedLayerId = layer.id;
    this._refreshAll();
  };

  App.prototype.deleteLayer = function(id) {
    this.pushUndo();
    this.state.layers = this.state.layers.filter(function(l) { return l.id !== id; });
    if (this.selectedLayerId === id) {
      this.selectedLayerId = this.state.layers.length > 0 ? this.state.layers[0].id : null;
    }
    this._refreshAll();
  };

  App.prototype.selectLayer = function(id) {
    this.selectedLayerId = id;
    this.layerPanel.render();
    this.inspector.render();
  };

  App.prototype.toggleLayerVisibility = function(id) {
    this.pushUndo();
    var layer = this.state.layers.find(function(l) { return l.id === id; });
    if (layer) layer.enabled = !layer.enabled;
    this._refreshAll();
  };

  App.prototype.updateLayer = function(id, props) {
    this.pushUndo();
    var layer = this.state.layers.find(function(l) { return l.id === id; });
    if (layer) Object.assign(layer, props);
    this._refreshAll();
  };

  App.prototype.updateLayerDeep = function(id, path, value) {
    this.pushUndo();
    var layer = this.state.layers.find(function(l) { return l.id === id; });
    if (!layer) return;
    var keys = path.split('.');
    var obj = layer;
    for (var i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    this._refreshAll();
  };

  App.prototype.getSelectedLayer = function() {
    var sid = this.selectedLayerId;
    return this.state.layers.find(function(l) { return l.id === sid; }) || null;
  };

  // --- Simulation ---

  App.prototype.runSimulation = function() {
    this.stopSimulation();
    this.simulationTime = 0;
    var self = this;

    var tick = function() {
      self.simulationTime += (self.state.frequency / 20);
      self._generateParticles();
    };
    tick();
    var intervalMs = Math.max(50, (this.state.frequency / 20) * 1000);
    this.simulationInterval = setInterval(tick, intervalMs);

    document.getElementById('btnRun').style.display = 'none';
    document.getElementById('btnStop').style.display = '';
  };

  App.prototype.stopSimulation = function() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.viewport.setParticles([]);
    document.getElementById('btnRun').style.display = '';
    document.getElementById('btnStop').style.display = 'none';
    document.getElementById('particleCount').textContent = '0 particles';
  };

  App.prototype._generateParticles = function() {
    var all = [];
    var pw = 4, ph = 5;
    var t = this.simulationTime;

    this.state.layers.forEach(function(layer) {
      if (!layer.enabled) return;
      var shapeFn = Shapes[layer.shape.type];
      if (!shapeFn) return;

      var points = shapeFn(layer.shape.params, pw, ph, t);
      var c = layer.particle.color;
      var s = layer.particle.size;

      points.forEach(function(pt) {
        all.push({
          x: pt.x + (layer.position.x || 0),
          y: pt.y + (layer.position.y || 0),
          z: pt.z + (layer.position.z || 0),
          r: c.r, g: c.g, b: c.b, size: s,
          spawnTime: performance.now(),
          phase: Math.random() * Math.PI * 2,
          driftX: (Math.random() - 0.5) * (layer.animation.float ? 0.06 : 0),
          driftY: (Math.random() - 0.5) * (layer.animation.float ? 0.06 : 0),
          driftZ: (Math.random() - 0.5) * (layer.animation.float ? 0.06 : 0)
        });
      });
    });

    this.viewport.setParticles(all);
    document.getElementById('particleCount').textContent = all.length + ' particles';
  };

  // --- Presets ---

  App.prototype.loadPreset = function(name) {
    var preset = Presets.definitions[name];
    if (!preset) return;
    this.pushUndo();
    this.state.frequency = preset.frequency || 20;
    this.state.layers = preset.layers.map(function(l) {
      var clone = Utils.deepClone(l);
      clone.id = Utils.generateId();
      return clone;
    });
    this.selectedLayerId = this.state.layers.length > 0 ? this.state.layers[0].id : null;
    this.stopSimulation();
    this._refreshAll();
    document.getElementById('presetsModal').style.display = 'none';
    document.getElementById('freqSlider').value = this.state.frequency;
    document.getElementById('freqValue').textContent = this.state.frequency;
  };

  // --- Export ---

  App.prototype.downloadYaml = function() {
    var yaml = Compiler.compile(this.state);
    var blob = new Blob([yaml], { type: 'text/yaml' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (this.state.name || 'particlePack').replace(/\s+/g, '_') + '.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  App.prototype.copyYaml = function() {
    var yaml = Compiler.compile(this.state);
    var btn = document.getElementById('btnCopy');
    navigator.clipboard.writeText(yaml).then(function() {
      btn.innerHTML = '<i class="bi bi-check-lg"></i>';
      setTimeout(function() { btn.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 1500);
    });
  };

  // --- Internal ---

  App.prototype._refreshAll = function() {
    this.layerPanel.render();
    this.inspector.render();
    this._updateUndoRedo();
    document.getElementById('packName').value = this.state.name;
    if (this.simulationInterval) this._generateParticles();
  };

  App.prototype._updateUndoRedo = function() {
    document.getElementById('btnUndo').disabled = this.undoStack.length === 0;
    document.getElementById('btnRedo').disabled = this.redoStack.length === 0;
  };

  App.prototype._genName = function(shapeType) {
    var names = {
      ring: 'Ring', spiral: 'Spiral', helix: 'Helix', vortex: 'Vortex',
      rain: 'Rain', border: 'Border', random: 'Scatter', custom: 'Custom'
    };
    var base = names[shapeType] || 'Layer';
    var existing = this.state.layers.filter(function(l) { return l.name.startsWith(base); }).length;
    return existing === 0 ? base : base + ' ' + (existing + 1);
  };

  App.prototype._bindToolbar = function() {
    var self = this;
    document.getElementById('btnRun').addEventListener('click', function() { self.runSimulation(); });
    document.getElementById('btnStop').addEventListener('click', function() { self.stopSimulation(); });
    document.getElementById('btnDownload').addEventListener('click', function() { self.downloadYaml(); });
    document.getElementById('btnCopy').addEventListener('click', function() { self.copyYaml(); });
    document.getElementById('btnUndo').addEventListener('click', function() { self.undo(); });
    document.getElementById('btnRedo').addEventListener('click', function() { self.redo(); });
    document.getElementById('btnResetCam').addEventListener('click', function() { self.viewport.resetCamera(); });

    document.getElementById('btnPresets').addEventListener('click', function() {
      Presets.renderGrid(document.getElementById('presetGrid'), self);
      document.getElementById('presetsModal').style.display = '';
    });
    document.getElementById('btnAddLayer').addEventListener('click', function() {
      document.getElementById('addLayerModal').style.display = '';
    });

    document.getElementById('packName').addEventListener('change', function(e) {
      self.state.name = e.target.value;
    });

    document.getElementById('freqSlider').addEventListener('input', function(e) {
      self.state.frequency = parseInt(e.target.value);
      document.getElementById('freqValue').textContent = e.target.value;
    });
  };

  App.prototype._bindKeyboard = function() {
    var self = this;
    document.addEventListener('keydown', function(e) {
      // Don't interfere with input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); self.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); self.redo(); }
      if (e.key === 'Delete' && self.selectedLayerId) { self.deleteLayer(self.selectedLayerId); }
      if (e.key === ' ') {
        e.preventDefault();
        if (self.simulationInterval) self.stopSimulation();
        else self.runSimulation();
      }
    });
  };

  App.prototype._bindModals = function() {
    var self = this;

    // Close buttons
    document.getElementById('closePresetsModal').addEventListener('click', function() {
      document.getElementById('presetsModal').style.display = 'none';
    });
    document.getElementById('closeAddLayerModal').addEventListener('click', function() {
      document.getElementById('addLayerModal').style.display = 'none';
    });

    // Click backdrop to close
    ['presetsModal', 'addLayerModal'].forEach(function(id) {
      document.getElementById(id).addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
          e.target.style.display = 'none';
        }
      });
    });

    // Add layer shape cards
    var shapeTypes = ['spiral', 'ring', 'helix', 'vortex', 'rain', 'border', 'random', 'custom'];
    var grid = document.getElementById('addLayerGrid');
    shapeTypes.forEach(function(type) {
      var card = document.createElement('div');
      card.className = 'shape-card';
      card.innerHTML = '<i class="bi ' + (ShapeIcons[type] || 'bi-circle') + '"></i><span>' + Utils.capitalize(type) + '</span>';
      card.addEventListener('click', function() {
        self.addLayer(type);
        document.getElementById('addLayerModal').style.display = 'none';
      });
      grid.appendChild(card);
    });
  };

  // --- Resizable Panels ---
  function initResize() {
    var panelLeft = document.getElementById('panelLeft');
    var panelRight = document.getElementById('panelRight');
    var handleLeft = document.getElementById('resizeLeft');
    var handleRight = document.getElementById('resizeRight');
    if (!handleLeft || !handleRight) return;

    var MIN_W = 200, MAX_W = 500;
    var dragging = null; // 'left' or 'right'

    function onMouseDown(side) {
      return function(e) {
        e.preventDefault();
        dragging = side;
        document.body.classList.add('resizing');
        (side === 'left' ? handleLeft : handleRight).classList.add('active');
      };
    }

    handleLeft.addEventListener('mousedown', onMouseDown('left'));
    handleRight.addEventListener('mousedown', onMouseDown('right'));

    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      if (dragging === 'left') {
        var w = Math.min(MAX_W, Math.max(MIN_W, e.clientX));
        panelLeft.style.width = w + 'px';
      } else {
        var w = Math.min(MAX_W, Math.max(MIN_W, window.innerWidth - e.clientX));
        panelRight.style.width = w + 'px';
      }
    });

    document.addEventListener('mouseup', function() {
      if (!dragging) return;
      document.body.classList.remove('resizing');
      handleLeft.classList.remove('active');
      handleRight.classList.remove('active');
      dragging = null;
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    window.app = new App();
    initResize();
  });
})();


export {};

// Portal Editor Bundled Client Module

// === utils.js ===
// === utils.js === Portal Editor v2 Utilities

var Utils = {
  generateId: function() {
    return 'pe_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  clamp: function(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  rgbToHex: function(r, g, b) {
    return '#' + [r, g, b].map(function(c) {
      var hex = Math.round(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  hexToRgb: function(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  },

  rgbToSemicolon: function(r, g, b) {
    return r + ';' + g + ';' + b;
  },

  semicolonToRgb: function(str) {
    var parts = str.split(';');
    return { r: parseInt(parts[0]) || 0, g: parseInt(parts[1]) || 0, b: parseInt(parts[2]) || 0 };
  },

  deepClone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  debounce: function(fn, delay) {
    var timer = null;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
  },

  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Simple event bus for decoupled communication
  EventBus: {
    _handlers: {},
    on: function(event, fn) {
      if (!this._handlers[event]) this._handlers[event] = [];
      this._handlers[event].push(fn);
    },
    off: function(event, fn) {
      if (!this._handlers[event]) return;
      this._handlers[event] = this._handlers[event].filter(function(h) { return h !== fn; });
    },
    emit: function(event, data) {
      if (!this._handlers[event]) return;
      this._handlers[event].forEach(function(fn) { fn(data); });
    }
  }
};


// === yaml.js ===
// === yaml.js === JSON to YAML converter for portal config

var YamlConverter = {
  INDENT: '  ',

  convert: function(obj) {
    if (typeof obj === 'string') obj = JSON.parse(obj);
    var lines = [];
    this._convertValue(obj, lines, '');
    return lines.join('\n');
  },

  _convertValue: function(val, lines, indent) {
    var type = this._getType(val);
    switch (type) {
      case 'hash': this._convertHash(val, lines, indent); break;
      case 'array': this._convertArray(val, lines, indent); break;
      case 'string': lines.push(this._normalizeStr(val)); break;
      case 'number': lines.push(String(val)); break;
      case 'boolean': lines.push(val ? 'true' : 'false'); break;
      case 'null': lines.push('null'); break;
    }
  },

  _convertHash: function(obj, lines, indent) {
    var self = this;
    var keys = Object.keys(obj);
    keys.forEach(function(key) {
      var val = obj[key];
      var type = self._getType(val);
      if (type === 'string' || type === 'number' || type === 'boolean' || type === 'null') {
        var valLines = [];
        self._convertValue(val, valLines, '');
        lines.push(indent + self._normalizeStr(key) + ': ' + valLines[0]);
      } else {
        lines.push(indent + self._normalizeStr(key) + ':');
        if (type === 'array' && val.length === 0) {
          // Replace last line with empty array notation
          lines[lines.length - 1] = indent + self._normalizeStr(key) + ': []';
        } else if (type === 'hash' && Object.keys(val).length === 0) {
          lines[lines.length - 1] = indent + self._normalizeStr(key) + ': {}';
        } else {
          var sub = [];
          self._convertValue(val, sub, indent + self.INDENT);
          sub.forEach(function(s) { lines.push(s); });
        }
      }
    });
  },

  _convertArray: function(arr, lines, indent) {
    var self = this;
    if (arr.length === 0) {
      lines.push(indent + '[]');
      return;
    }
    arr.forEach(function(item) {
      var type = self._getType(item);
      if (type === 'string' || type === 'number' || type === 'boolean' || type === 'null') {
        var valLines = [];
        self._convertValue(item, valLines, '');
        lines.push(indent + '- ' + valLines[0]);
      } else {
        var sub = [];
        self._convertValue(item, sub, indent + self.INDENT);
        sub.forEach(function(s, i) {
          lines.push(i === 0 ? indent + '- ' + s.trim() : s);
        });
      }
    });
  },

  _getType: function(val) {
    if (val === null || val === undefined) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  },

  _normalizeStr: function(str) {
    if (typeof str !== 'string') return String(str);
    if (/^[\w.]+$/.test(str)) return str;
    return "'" + str.replace(/'/g, "''") + "'";
  }
};


// === viewport.js ===
// === viewport.js === 3D Portal Preview (Canvas 2D renderer)

var CUBE_VERTICES = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
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
  this.faceBuffer = [];
  this.animId = null;

  // Textures cache
  this.textures = {};
  this.frameMat = 'stone';
  this.insideMat = 'nether_portal';
  this.lighterMat = 'flint_and_steel';

  var self = this;

  // Mouse events
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

Viewport.prototype._getTexture = function(name, folder) {
  var key = folder + '/' + name;
  if (this.textures[key]) return this.textures[key];
  var img = new Image();
  img.src = window.TEXTURE_BASE + folder + '/' + name + '.png';
  this.textures[key] = img;
  var self = this;
  img.onload = function() { /* textures auto-render on next frame */ };
  return img;
};

Viewport.prototype.setMaterials = function(frame, inside, lighter) {
  this.frameMat = (frame || 'stone').toLowerCase();
  this.insideMat = (inside || 'nether_portal').toLowerCase();
  this.lighterMat = (lighter || 'flint_and_steel').toLowerCase();
  this._buildPortal();
};

Viewport.prototype._buildPortal = function() {
  this.cubes = [];
  var pw = 4, ph = 5;
  var frameFolder = 'blocks';
  var insideFolder = 'frames';

  var frameTex = this._getTexture(this.frameMat, frameFolder);
  // Fallback: try frames folder if not in blocks
  if (!this.textures['blocks/' + this.frameMat]) {
    this._getTexture(this.frameMat, 'frames');
  }
  var insideTex = this._getTexture(this.insideMat, insideFolder);

  for (var y = 0; y < pw; y++) {
    for (var x = 0; x < ph; x++) {
      var isFrame = (y === 0 || y === pw - 1) || (x === 0 || x === ph - 1);
      this.cubes.push({
        x: y - 1.5, y: x - 2, z: 0, radius: 0.5,
        texture: isFrame ? frameTex : insideTex,
        alpha: isFrame ? 1.0 : 0.75
      });
    }
  }
};

Viewport.prototype._rotatePoint = function(x, y, z) {
  var cosY = Math.cos(this.cameraAngleY), sinY = Math.sin(this.cameraAngleY);
  var cosX = Math.cos(this.cameraAngleX), sinX = Math.sin(this.cameraAngleX);
  var rx = x * cosY - z * sinY;
  var rz = x * sinY + z * cosY;
  var ry = y * cosX - rz * sinX;
  var rz2 = y * sinX + rz * cosX;
  return { x: rx, y: ry, z: rz2 };
};

Viewport.prototype._project = function(x, y, z) {
  var r = this._rotatePoint(x, y, z);
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
    rotated.push(this._rotatePoint(vx, vy, vz));
  }
  for (var f = 0; f < CUBE_FACES.length; f++) {
    var face = CUBE_FACES[f];
    var vi = face.verts;
    var p0 = proj[vi[0]], p1 = proj[vi[1]], p2 = proj[vi[2]], p3 = proj[vi[3]];
    var dx1 = p1.x - p0.x, dy1 = p1.y - p0.y;
    var dx2 = p2.x - p0.x, dy2 = p2.y - p0.y;
    if (dx1 * dy2 - dy1 * dx2 >= 0) continue; // back-face cull
    var avgZ = (rotated[vi[0]].z + rotated[vi[1]].z + rotated[vi[2]].z + rotated[vi[3]].z) / 4;
    buffer.push({
      verts: [p0, p1, p2, p3], avgZ: avgZ,
      shade: face.shade, texture: cube.texture, alpha: cube.alpha
    });
  }
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

Viewport.prototype.render = function() {
  var self = this;
  var ctx = this.ctx;
  ctx.clearRect(0, 0, this.width, this.height);

  // Collect faces
  this.faceBuffer.length = 0;
  for (var i = 0; i < this.cubes.length; i++) {
    this._collectCubeFaces(this.cubes[i], this.faceBuffer);
  }

  // Depth sort (painter's algorithm)
  this.faceBuffer.sort(function(a, b) { return a.avgZ - b.avgZ; });

  // Draw
  for (var i = 0; i < this.faceBuffer.length; i++) {
    this._drawFace(this.faceBuffer[i]);
  }

  this.animId = requestAnimationFrame(function() { self.render(); });
};

Viewport.prototype.start = function() {
  if (!this.animId) {
    this._buildPortal();
    this.render();
  }
};

Viewport.prototype.stop = function() {
  if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
};

Viewport.prototype.captureImage = function() {
  return this.canvas.toDataURL('image/png');
};


// === blocks.js ===
// === blocks.js === Block Selector with search, categories, recently used

var BlockSelector = {
  _recentKey: 'pe2_recent_blocks',
  _maxRecent: 12,

  init: function(gridId, searchId, manualId, textureList, folder, onSelect) {
    var grid = document.getElementById(gridId);
    var search = document.getElementById(searchId);
    var manual = document.getElementById(manualId);
    var self = this;
    var selected = null;

    // Render all blocks
    function renderGrid(filter) {
      grid.innerHTML = '';
      var filterLower = (filter || '').toLowerCase().replace(/\s+/g, '_');
      var shown = 0;

      textureList.forEach(function(id) {
        if (filterLower && id.toLowerCase().indexOf(filterLower) === -1) return;
        var tile = document.createElement('div');
        tile.className = 'block-tile' + (selected === id ? ' selected' : '');
        tile.style.backgroundImage = "url('" + window.TEXTURE_BASE + folder + "/" + id + ".png')";
        tile.title = id.replace(/_/g, ' ');
        tile.addEventListener('click', function() {
          selected = id;
          manual.value = id.toUpperCase();
          onSelect(id);
          self._addRecent(id);
          renderGrid(search.value);
        });
        grid.appendChild(tile);
        shown++;
      });

      if (shown === 0) {
        var empty = document.createElement('div');
        empty.style.cssText = 'padding: 12px; color: #555570; font-size: 11px; text-align: center; width: 100%;';
        empty.textContent = 'No blocks found';
        grid.appendChild(empty);
      }
    }

    // Search with debounce
    var debounced = Utils.debounce(function() {
      renderGrid(search.value);
    }, 150);
    search.addEventListener('input', debounced);

    // Manual input
    manual.addEventListener('change', function() {
      var val = manual.value.trim().toUpperCase();
      if (val) {
        selected = val.toLowerCase();
        onSelect(val);
        self._addRecent(val.toLowerCase());
        renderGrid(search.value);
      }
    });

    // Initial render
    renderGrid('');

    return {
      setSelected: function(id) {
        selected = id ? id.toLowerCase() : null;
        manual.value = id ? id.toUpperCase() : '';
        renderGrid(search.value);
      },
      refresh: function() {
        renderGrid(search.value);
      }
    };
  },

  _addRecent: function(id) {
    try {
      var recent = JSON.parse(localStorage.getItem(this._recentKey) || '[]');
      recent = recent.filter(function(r) { return r !== id; });
      recent.unshift(id);
      if (recent.length > this._maxRecent) recent = recent.slice(0, this._maxRecent);
      localStorage.setItem(this._recentKey, JSON.stringify(recent));
    } catch(e) {}
  },

  getRecent: function() {
    try {
      return JSON.parse(localStorage.getItem(this._recentKey) || '[]');
    } catch(e) { return []; }
  }
};


// === settings.js ===
// === settings.js === Portal settings manager (replaces v1 options.js)

var Settings = {
  // Default portal configuration (flat dot-notation keys)
  defaults: {
    'configVersion': '3.0.1',
    'Enable': true,
    'DisplayName': 'TestPortal',
    'Portal.Frame.Material': 'STONE',
    'Portal.Frame.Face': 'all',
    'Portal.InsideMaterial': 'NETHER_PORTAL',
    'Portal.LighterMaterial': 'FLINT_AND_STEEL',
    'Options.EnableParticles': true,
    'Portal.ParticlesColor': '255;255;255',
    'Portal.MinimumWidth': 4,
    'Portal.MinimumHeight': 5,
    'Portal.MaximumWidth': 14,
    'Portal.MaximumHeight': 15,
    'World.Name': 'world_nether',
    'Options.ExitPortal.Enable': true,
    'Options.ExitPortal.FixedWidth': -1,
    'Options.ExitPortal.FixedHeight': -1,
    'Options.AllowedWorlds': [],
    'Portal.BreakEffect': 'BLOCK_GLASS_BREAK',
    'Options.TeleportDelay': 4,
    'Entities.Transformation': ['SKELETON->WITHER_SKELETON'],
    'Entities.Spawning.Delay': '60000-120000',
    'Entities.Spawning.List': ['ZOMBIE;30', 'SKELETON;30']
  },

  // Create a fresh state object
  createState: function() {
    return Utils.deepClone(this.defaults);
  },

  // Get value from state
  get: function(state, key) {
    return state[key];
  },

  // Set value in state
  set: function(state, key, value) {
    state[key] = value;
  },

  // Convert flat dot-notation state to nested YAML-ready object
  toNested: function(state) {
    var result = {};
    var keys = Object.keys(state);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var val = state[key];

      if (val === 'skip' || val === undefined) continue;

      if (key.indexOf('.') === -1) {
        result[key] = val;
      } else {
        var parts = key.split('.');
        var obj = result;
        for (var j = 0; j < parts.length; j++) {
          if (j === parts.length - 1) {
            obj[parts[j]] = val;
          } else {
            if (!obj[parts[j]] || typeof obj[parts[j]] !== 'object') {
              obj[parts[j]] = {};
            }
            obj = obj[parts[j]];
          }
        }
      }
    }

    return result;
  },

  // Generate YAML from state
  toYaml: function(state) {
    var nested = this.toNested(state);
    return YamlConverter.convert(nested);
  },

  // Save state as JSON string (for DB)
  toSaveString: function(portalID, state, enabledAddons) {
    var data = {};
    var keys = Object.keys(state);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== 'configVersion') {
        data[keys[i]] = state[keys[i]];
      }
    }

    return JSON.stringify({
      portalID: portalID,
      data: data,
      addons: enabledAddons
    });
  },

  // Load state from saved JSON (from DB)
  loadFromSaved: function(saved) {
    var state = this.createState();
    if (!saved || !saved.data) return state;

    var data = saved.data;
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      state[keys[i]] = data[keys[i]];
    }

    return state;
  },

  // Bind a setting to a DOM element
  bindElement: function(elementId, key, state, onChange) {
    var el = document.getElementById(elementId);
    if (!el) return;

    var val = state[key];

    // Set initial value
    if (el.type === 'checkbox') {
      el.checked = !!val;
    } else if (el.tagName === 'TEXTAREA') {
      el.value = Array.isArray(val) ? val.join('\n') : (val || '');
    } else {
      el.value = val !== undefined ? val : '';
    }

    // Listen for changes
    var eventType = (el.type === 'checkbox' || el.type === 'color') ? 'change' : 'change';
    el.addEventListener(eventType, function() {
      var newVal;
      if (el.type === 'checkbox') {
        newVal = el.checked;
      } else if (el.type === 'number') {
        newVal = parseInt(el.value) || 0;
      } else if (el.tagName === 'TEXTAREA') {
        var text = el.value.trim();
        newVal = text === '' ? [] : text.split('\n');
      } else {
        newVal = el.value;
      }
      state[key] = newVal;
      if (onChange) onChange(key, newVal);
    });

    return el;
  }
};


// === addons.js ===
// === addons.js === Addon manager for Portal Editor v2

var AddonManager = {
  addons: [],     // { name, description, options: [{name,type,default,min,max,list}], enabled }
  addonState: {}, // YAML key -> value for enabled addon options

  init: function(addonsData, listEl, optionsEl, onStateChange) {
    this.listEl = listEl;
    this.optionsEl = optionsEl;
    this.onStateChange = onStateChange;

    var self = this;
    addonsData.forEach(function(a) {
      var opts = a.options || [];
      // Ensure options is an array (DB stores as array of {name,type,default,...})
      if (!Array.isArray(opts)) {
        var arr = [];
        var keys = Object.keys(opts);
        for (var i = 0; i < keys.length; i++) {
          var o = opts[keys[i]];
          o.name = o.name || keys[i];
          arr.push(o);
        }
        opts = arr;
      }

      self.addons.push({
        name: a.name,
        description: a.description,
        options: opts,
        enabled: false
      });
    });

    this.render();
  },

  // Get list of enabled addon names
  getEnabledNames: function() {
    return this.addons.filter(function(a) { return a.enabled; }).map(function(a) { return a.name; });
  },

  // Get all addon option values (for YAML export)
  getValues: function() {
    var result = {};
    var keys = Object.keys(this.addonState);
    for (var i = 0; i < keys.length; i++) {
      var val = this.addonState[keys[i]];
      // Skip empty/disabled select values
      if (val === '' || val === 'disabled') continue;
      result[keys[i]] = val;
    }
    return result;
  },

  // Enable/disable by name
  toggle: function(name) {
    var addon = this.addons.find(function(a) { return a.name === name; });
    if (!addon) return;

    addon.enabled = !addon.enabled;

    if (!addon.enabled) {
      addon.options.forEach(function(opt) {
        delete AddonManager.addonState[opt.name];
      });
    } else {
      addon.options.forEach(function(opt) {
        AddonManager.addonState[opt.name] = opt['default'] !== undefined ? opt['default'] : '';
      });
    }

    this.render();
    this.renderOptions();
    if (this.onStateChange) this.onStateChange();
  },

  // Enable addons by name list (for loading saved portals)
  enableByNames: function(names) {
    var self = this;
    if (!names || !Array.isArray(names)) return;
    names.forEach(function(name) {
      var addon = self.addons.find(function(a) { return a.name === name; });
      if (addon && !addon.enabled) {
        addon.enabled = true;
        addon.options.forEach(function(opt) {
          self.addonState[opt.name] = opt['default'] !== undefined ? opt['default'] : '';
        });
      }
    });
    this.render();
    this.renderOptions();
  },

  // Load addon state values from saved data
  loadValues: function(savedData) {
    if (!savedData) return;
    var keys = Object.keys(savedData);
    for (var i = 0; i < keys.length; i++) {
      if (this.addonState.hasOwnProperty(keys[i])) {
        this.addonState[keys[i]] = savedData[keys[i]];
      }
    }
    this.renderOptions();
  },

  render: function() {
    var list = this.listEl;
    list.innerHTML = '';
    var self = this;

    this.addons.forEach(function(addon) {
      var card = document.createElement('div');
      card.className = 'addon-card' + (addon.enabled ? ' enabled' : '');

      var nameRow = document.createElement('div');
      nameRow.className = 'addon-card-top';

      var nameEl = document.createElement('span');
      nameEl.className = 'addon-card-name';
      nameEl.textContent = addon.name;
      nameRow.appendChild(nameEl);

      var toggle = document.createElement('label');
      toggle.className = 'toggle-switch toggle-sm';
      toggle.innerHTML = '<input type="checkbox"' + (addon.enabled ? ' checked' : '') + '><span class="toggle-track"></span>';
      toggle.addEventListener('click', function(e) { e.stopPropagation(); });
      toggle.querySelector('input').addEventListener('change', function() {
        self.toggle(addon.name);
      });
      nameRow.appendChild(toggle);
      card.appendChild(nameRow);

      if (addon.description) {
        var desc = document.createElement('span');
        desc.className = 'addon-card-desc';
        desc.textContent = addon.description;
        card.appendChild(desc);
      }

      list.appendChild(card);
    });
  },

  renderOptions: function() {
    var container = this.optionsEl;
    container.innerHTML = '';
    var self = this;
    var hasOptions = false;

    this.addons.forEach(function(addon) {
      if (!addon.enabled || !addon.options || addon.options.length === 0) return;
      hasOptions = true;

      var group = document.createElement('div');
      group.className = 'addon-option-group';

      var title = document.createElement('div');
      title.className = 'addon-option-title';
      title.innerHTML = '<i class="bi bi-puzzle"></i> ' + addon.name;
      group.appendChild(title);

      addon.options.forEach(function(opt) {
        var row = self._createOptionRow(opt);
        if (row) group.appendChild(row);
      });

      container.appendChild(group);
    });

    if (!hasOptions && this.addons.some(function(a) { return a.enabled; })) {
      var note = document.createElement('div');
      note.className = 'addon-no-options';
      note.textContent = 'Enabled addons have no configurable options.';
      container.appendChild(note);
    }
  },

  _createOptionRow: function(opt) {
    var self = this;
    var type = opt.type || 'string';
    var key = opt.name;
    // Friendly label from YAML key: "Addon.LightAPI.Level" -> "Level"
    var parts = key.split('.');
    var label = parts[parts.length - 1];
    label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
    var value = this.addonState.hasOwnProperty(key) ? this.addonState[key] : opt['default'];

    var row = document.createElement('div');
    row.className = 'field-col';
    row.style.padding = '4px 0';

    var labelEl = document.createElement('span');
    labelEl.className = 'field-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    if (type === 'toggle') {
      row.className = 'field-row';
      var toggle = document.createElement('label');
      toggle.className = 'toggle-switch';
      toggle.innerHTML = '<input type="checkbox"' + (value ? ' checked' : '') + '><span class="toggle-track"></span>';
      toggle.querySelector('input').addEventListener('change', function() {
        self.addonState[key] = this.checked;
        if (self.onStateChange) self.onStateChange();
      });
      row.appendChild(toggle);
    } else if (type === 'int') {
      var input = document.createElement('input');
      input.type = 'number';
      input.className = 'field-input';
      input.value = value;
      if (opt.min !== undefined) input.min = opt.min;
      if (opt.max !== undefined) input.max = opt.max;
      input.addEventListener('change', function() {
        var v = parseInt(this.value) || 0;
        if (opt.min !== undefined && v < opt.min) v = opt.min;
        if (opt.max !== undefined && v > opt.max) v = opt.max;
        this.value = v;
        self.addonState[key] = v;
        if (self.onStateChange) self.onStateChange();
      });
      row.appendChild(input);
      if (opt.min !== undefined && opt.max !== undefined) {
        var help = document.createElement('span');
        help.className = 'field-help';
        help.textContent = 'Range: ' + opt.min + ' \u2013 ' + opt.max;
        row.appendChild(help);
      }
    } else if (type === 'list') {
      var textarea = document.createElement('textarea');
      textarea.className = 'field-textarea';
      textarea.rows = 3;
      textarea.value = Array.isArray(value) ? value.join('\n') : (value || '');
      textarea.placeholder = 'One entry per line';
      textarea.addEventListener('change', function() {
        var text = this.value.trim();
        self.addonState[key] = text === '' ? [] : text.split('\n');
        if (self.onStateChange) self.onStateChange();
      });
      row.appendChild(textarea);
    } else if (type === 'select-single') {
      var select = document.createElement('select');
      select.className = 'field-input';
      var choices = opt.list || [];
      choices.forEach(function(choice) {
        var option = document.createElement('option');
        option.value = choice;
        option.textContent = choice || '(disabled)';
        if (choice === value || (choice === 'disabled' && value === '')) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', function() {
        var v = this.value;
        if (v === 'disabled') v = '';
        self.addonState[key] = v;
        if (self.onStateChange) self.onStateChange();
      });
      row.appendChild(select);
    } else {
      // string / simple
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'field-input';
      input.value = value || '';
      input.addEventListener('change', function() {
        self.addonState[key] = this.value;
        if (self.onStateChange) self.onStateChange();
      });
      row.appendChild(input);
    }

    return row;
  }
};


// === app.js ===
// === app.js === Portal Editor v2 Application Controller

(function() {
  'use strict';

  function App() {
    this.portalID = 'testPortal';
    this.state = Settings.createState();
    this.undoStack = [];
    this.redoStack = [];

    // Modules
    this.viewport = new Viewport(document.getElementById('viewport'));
    this.frameSelector = null;
    this.insideSelector = null;
    this.lighterSelector = null;

    this._bindTabs();
    this._bindToolbar();
    this._bindBlockSelectors();
    this._bindDesignControls();
    this._bindSettingsControls();
    this._bindModals();
    this._bindKeyboard();
    this._initAddons();

    // Start viewport
    this.viewport.start();

    // Load portal if provided by PHP
    if (window.PORTAL_LOAD_DATA) {
      this._loadPortalData(window.PORTAL_LOAD_DATA);
    }

    // Initial YAML render
    this._updateYaml();
    this._updateViewport();

    // Hide loading
    var self = this;
    setTimeout(function() {
      document.getElementById('loadingOverlay').style.display = 'none';
    }, 600);
  }

  // --- Undo / Redo ---

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
    this._refreshAll();
  };

  App.prototype.redo = function() {
    if (!this.redoStack.length) return;
    this.undoStack.push(Utils.deepClone(this.state));
    this.state = this.redoStack.pop();
    this._refreshAll();
  };

  App.prototype._updateUndoRedo = function() {
    document.getElementById('btnUndo').disabled = this.undoStack.length === 0;
    document.getElementById('btnRedo').disabled = this.redoStack.length === 0;
  };

  // --- State Changes ---

  App.prototype._onStateChange = function(key, value) {
    this._updateYaml();
    if (key === 'Portal.Frame.Material' || key === 'Portal.InsideMaterial' || key === 'Portal.LighterMaterial') {
      this._updateViewport();
    }
  };

  App.prototype._updateViewport = function() {
    this.viewport.setMaterials(
      this.state['Portal.Frame.Material'],
      this.state['Portal.InsideMaterial'],
      this.state['Portal.LighterMaterial']
    );
  };

  App.prototype._updateYaml = function() {
    // Merge addon values into state for YAML
    var fullState = Utils.deepClone(this.state);
    var addonVals = AddonManager.getValues();
    var keys = Object.keys(addonVals);
    for (var i = 0; i < keys.length; i++) {
      fullState[keys[i]] = addonVals[keys[i]];
    }

    var yaml = Settings.toYaml(fullState);
    document.getElementById('yamlPreview').textContent = yaml;
  };

  App.prototype._refreshAll = function() {
    // Sync UI with state
    this._syncDesignUI();
    this._syncSettingsUI();
    this._updateViewport();
    this._updateYaml();
    this._updateUndoRedo();
  };

  // --- Tab Navigation ---

  App.prototype._bindTabs = function() {
    var tabs = document.querySelectorAll('.panel-tab');
    var contents = document.querySelectorAll('.tab-content');

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.getAttribute('data-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        contents.forEach(function(c) { c.classList.remove('active'); });
        tab.classList.add('active');
        var targetContent = document.querySelector('.tab-content[data-tab="' + target + '"]');
        if (targetContent) targetContent.classList.add('active');
      });
    });
  };

  // --- Toolbar ---

  App.prototype._bindToolbar = function() {
    var self = this;

    document.getElementById('btnUndo').addEventListener('click', function() { self.undo(); });
    document.getElementById('btnRedo').addEventListener('click', function() { self.redo(); });
    document.getElementById('btnDownload').addEventListener('click', function() { self.downloadYaml(); });
    document.getElementById('btnCopy').addEventListener('click', function() { self.copyYaml(); });
    document.getElementById('btnResetCam').addEventListener('click', function() { self.viewport.resetCamera(); });

    var copyYamlBtn = document.getElementById('btnCopyYaml');
    if (copyYamlBtn) {
      copyYamlBtn.addEventListener('click', function() { self.copyYaml(); });
    }

    document.getElementById('portalID').addEventListener('change', function(e) {
      self.portalID = e.target.value.replace(/\s+/g, '_');
      e.target.value = self.portalID;
    });

    // Save
    var saveBtn = document.getElementById('btnSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() { self.saveToAccount(); });
    }

    // Public toggle
    var publicBtn = document.getElementById('btnPublic');
    if (publicBtn) {
      publicBtn.addEventListener('click', function() { self.togglePublic(); });
    }

    // Delete
    var deleteBtn = document.getElementById('btnDelete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        document.getElementById('deleteModal').style.display = '';
      });
    }

    // Collapsible sections
    document.querySelectorAll('[data-collapse]').forEach(function(head) {
      head.addEventListener('click', function() {
        var targetId = head.getAttribute('data-collapse');
        var body = document.getElementById(targetId);
        if (body) {
          body.classList.toggle('collapsed');
          var chevron = head.querySelector('.design-chevron');
          if (chevron) {
            chevron.style.transform = body.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
          }
        }
      });
    });
  };

  // --- Block Selectors ---

  App.prototype._bindBlockSelectors = function() {
    var self = this;

    this.frameSelector = BlockSelector.init(
      'frameGrid', 'frameSearch', 'frameManual',
      window.TEXTURE_MANIFEST.blocks, 'blocks',
      function(id) {
        self.pushUndo();
        self.state['Portal.Frame.Material'] = id.toUpperCase();
        self._onStateChange('Portal.Frame.Material');
      }
    );

    this.insideSelector = BlockSelector.init(
      'insideGrid', 'insideSearch', 'insideManual',
      window.TEXTURE_MANIFEST.frames, 'frames',
      function(id) {
        self.pushUndo();
        self.state['Portal.InsideMaterial'] = id.toUpperCase();
        self._onStateChange('Portal.InsideMaterial');
      }
    );

    this.lighterSelector = BlockSelector.init(
      'lighterGrid', 'lighterSearch', 'lighterManual',
      window.TEXTURE_MANIFEST.items, 'items',
      function(id) {
        self.pushUndo();
        self.state['Portal.LighterMaterial'] = id.toUpperCase();
        self._onStateChange('Portal.LighterMaterial');
      }
    );

    // Set initial selected values
    this.frameSelector.setSelected(this.state['Portal.Frame.Material']);
    this.insideSelector.setSelected(this.state['Portal.InsideMaterial']);
    this.lighterSelector.setSelected(this.state['Portal.LighterMaterial']);
  };

  // --- Design Controls ---

  App.prototype._bindDesignControls = function() {
    var self = this;

    // Face buttons
    document.querySelectorAll('.face-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self.pushUndo();
        document.querySelectorAll('.face-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        self.state['Portal.Frame.Face'] = btn.getAttribute('data-face');
        self._onStateChange('Portal.Frame.Face');
      });
    });

    // Size inputs
    var sizeInputs = [
      { id: 'minWidth', key: 'Portal.MinimumWidth' },
      { id: 'minHeight', key: 'Portal.MinimumHeight' },
      { id: 'maxWidth', key: 'Portal.MaximumWidth' },
      { id: 'maxHeight', key: 'Portal.MaximumHeight' }
    ];
    sizeInputs.forEach(function(s) {
      var el = document.getElementById(s.id);
      if (el) {
        el.addEventListener('change', function() {
          self.pushUndo();
          self.state[s.key] = parseInt(el.value) || 0;
          self._onStateChange(s.key);
        });
      }
    });

    // Particles enable
    var particlesEnable = document.getElementById('particlesEnable');
    if (particlesEnable) {
      particlesEnable.addEventListener('change', function() {
        self.pushUndo();
        self.state['Options.EnableParticles'] = particlesEnable.checked;
        self._onStateChange('Options.EnableParticles');
      });
    }

    // Particles color
    var particlesColor = document.getElementById('particlesColor');
    if (particlesColor) {
      particlesColor.addEventListener('input', function() {
        var rgb = Utils.hexToRgb(particlesColor.value);
        var semicolon = Utils.rgbToSemicolon(rgb.r, rgb.g, rgb.b);
        self.pushUndo();
        self.state['Portal.ParticlesColor'] = semicolon;
        document.getElementById('particlesColorText').textContent = semicolon;
        self._onStateChange('Portal.ParticlesColor');
      });
    }
  };

  // --- Settings Controls ---

  App.prototype._bindSettingsControls = function() {
    var self = this;
    var bindings = [
      { id: 'optEnable', key: 'Enable' },
      { id: 'optDisplayName', key: 'DisplayName' },
      { id: 'optBreakEffect', key: 'Portal.BreakEffect' },
      { id: 'optWorldName', key: 'World.Name' },
      { id: 'optTeleportDelay', key: 'Options.TeleportDelay' },
      { id: 'optAllowedWorlds', key: 'Options.AllowedWorlds' },
      { id: 'optExitEnable', key: 'Options.ExitPortal.Enable' },
      { id: 'optExitWidth', key: 'Options.ExitPortal.FixedWidth' },
      { id: 'optExitHeight', key: 'Options.ExitPortal.FixedHeight' },
      { id: 'optTransformation', key: 'Entities.Transformation' },
      { id: 'optSpawnDelay', key: 'Entities.Spawning.Delay' },
      { id: 'optSpawnList', key: 'Entities.Spawning.List' }
    ];

    bindings.forEach(function(b) {
      Settings.bindElement(b.id, b.key, self.state, function(key, val) {
        self.pushUndo();
        self._onStateChange(key, val);
      });
    });
  };

  // --- Sync UI from State ---

  App.prototype._syncDesignUI = function() {
    // Frame, inside, lighter selectors
    if (this.frameSelector) this.frameSelector.setSelected(this.state['Portal.Frame.Material']);
    if (this.insideSelector) this.insideSelector.setSelected(this.state['Portal.InsideMaterial']);
    if (this.lighterSelector) this.lighterSelector.setSelected(this.state['Portal.LighterMaterial']);

    // Face
    var face = this.state['Portal.Frame.Face'] || 'all';
    document.querySelectorAll('.face-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-face') === face);
    });

    // Sizes
    document.getElementById('minWidth').value = this.state['Portal.MinimumWidth'];
    document.getElementById('minHeight').value = this.state['Portal.MinimumHeight'];
    document.getElementById('maxWidth').value = this.state['Portal.MaximumWidth'];
    document.getElementById('maxHeight').value = this.state['Portal.MaximumHeight'];

    // Particles
    document.getElementById('particlesEnable').checked = !!this.state['Options.EnableParticles'];
    var pc = this.state['Portal.ParticlesColor'] || '255;255;255';
    var pcRgb = Utils.semicolonToRgb(pc);
    document.getElementById('particlesColor').value = Utils.rgbToHex(pcRgb.r, pcRgb.g, pcRgb.b);
    document.getElementById('particlesColorText').textContent = pc;

    // Portal ID
    document.getElementById('portalID').value = this.portalID;
  };

  App.prototype._syncSettingsUI = function() {
    var s = this.state;
    var sets = {
      'optEnable': { key: 'Enable', type: 'checkbox' },
      'optDisplayName': { key: 'DisplayName', type: 'text' },
      'optBreakEffect': { key: 'Portal.BreakEffect', type: 'text' },
      'optWorldName': { key: 'World.Name', type: 'text' },
      'optTeleportDelay': { key: 'Options.TeleportDelay', type: 'number' },
      'optExitEnable': { key: 'Options.ExitPortal.Enable', type: 'checkbox' },
      'optExitWidth': { key: 'Options.ExitPortal.FixedWidth', type: 'number' },
      'optExitHeight': { key: 'Options.ExitPortal.FixedHeight', type: 'number' },
      'optSpawnDelay': { key: 'Entities.Spawning.Delay', type: 'text' }
    };

    Object.keys(sets).forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      var val = s[sets[id].key];
      if (sets[id].type === 'checkbox') {
        el.checked = !!val;
      } else {
        el.value = val !== undefined ? val : '';
      }
    });

    // Textareas
    var aw = document.getElementById('optAllowedWorlds');
    if (aw) aw.value = Array.isArray(s['Options.AllowedWorlds']) ? s['Options.AllowedWorlds'].join('\n') : '';
    var et = document.getElementById('optTransformation');
    if (et) et.value = Array.isArray(s['Entities.Transformation']) ? s['Entities.Transformation'].join('\n') : '';
    var sl = document.getElementById('optSpawnList');
    if (sl) sl.value = Array.isArray(s['Entities.Spawning.List']) ? s['Entities.Spawning.List'].join('\n') : '';
  };

  // --- Addons ---

  App.prototype._initAddons = function() {
    var self = this;
    AddonManager.init(
      window.ADDONS_DATA || [],
      document.getElementById('addonsList'),
      document.getElementById('addonOptions'),
      function() {
        self._updateYaml();
      }
    );
  };

  // --- Load Portal Data ---

  App.prototype._loadPortalData = function(saved) {
    this.portalID = saved.portalID || 'testPortal';
    this.state = Settings.loadFromSaved(saved);

    // Enable saved addons
    if (saved.addons && Array.isArray(saved.addons)) {
      AddonManager.enableByNames(saved.addons);
      // Load addon values from saved data
      AddonManager.loadValues(saved.data);
    }

    this._refreshAll();
  };

  // --- Export ---

  App.prototype.downloadYaml = function() {
    var fullState = this._getFullState();
    var yaml = Settings.toYaml(fullState);
    var blob = new Blob([yaml], { type: 'text/yaml' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = this.portalID + '.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  App.prototype.copyYaml = function() {
    var fullState = this._getFullState();
    var yaml = Settings.toYaml(fullState);
    var btn = document.getElementById('btnCopy');
    navigator.clipboard.writeText(yaml).then(function() {
      btn.innerHTML = '<i class="bi bi-check-lg"></i>';
      setTimeout(function() { btn.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 1500);
    });
  };

  App.prototype._getFullState = function() {
    var fullState = Utils.deepClone(this.state);
    var addonVals = AddonManager.getValues();
    var keys = Object.keys(addonVals);
    for (var i = 0; i < keys.length; i++) {
      fullState[keys[i]] = addonVals[keys[i]];
    }
    return fullState;
  };

  // --- Save / Delete / Public ---

  App.prototype.saveToAccount = function() {
    var self = this;
    var saveStr = Settings.toSaveString(
      this.portalID,
      this.state,
      AddonManager.getEnabledNames()
    );
    var imgData = this.viewport.captureImage();

    var formData = new FormData();
    formData.append('portalID', this.portalID);
    formData.append('savePortal', saveStr);
    formData.append('portalIMG', imgData);

    fetch(window.location.href, {
      method: 'POST',
      body: formData
    }).then(function(res) { return res.text(); })
      .then(function(id) {
        window.location.href = './?portal=' + id;
      });
  };

  App.prototype.togglePublic = function() {
    var formData = new FormData();
    formData.append('togglePrive', 'true');
    fetch(window.location.href, {
      method: 'POST',
      body: formData
    }).then(function() {
      document.location.reload();
    });
  };

  App.prototype.deletePortal = function() {
    var formData = new FormData();
    formData.append('deletePortal', 'true');
    fetch(window.location.href, {
      method: 'POST',
      body: formData
    }).then(function() {
      document.location.reload();
    });
  };

  // --- Modals ---

  App.prototype._bindModals = function() {
    var self = this;

    var closeDelete = document.getElementById('closeDeleteModal');
    if (closeDelete) {
      closeDelete.addEventListener('click', function() {
        document.getElementById('deleteModal').style.display = 'none';
      });
    }
    var cancelDelete = document.getElementById('cancelDelete');
    if (cancelDelete) {
      cancelDelete.addEventListener('click', function() {
        document.getElementById('deleteModal').style.display = 'none';
      });
    }
    var confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
      confirmDelete.addEventListener('click', function() {
        self.deletePortal();
      });
    }

    // Backdrop click to close
    document.getElementById('deleteModal').addEventListener('click', function(e) {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
      }
    });
  };

  // --- Keyboard ---

  App.prototype._bindKeyboard = function() {
    var self = this;
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); self.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); self.redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); if (window.IS_LOGGED_IN) self.saveToAccount(); }
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

  // --- Init ---
  document.addEventListener('DOMContentLoaded', function() {
    window.app = new App();
    initResize();
  });
})();


export {};

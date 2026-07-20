/* 海上世界文化艺术中心 · 白模研究动画 v2
 * Sea World Culture and Arts Center, Shekou, Shenzhen — Maki and Associates (2017)
 * White-model / line-work concept animation, Three.js r128
 * Site layout calibrated against ESRI World Imagery (2026-07):
 *   Minghua ship plaza ~370 m north, Nanhai Hotel slab between, marina across the bay south,
 *   green-plate park + flower ribbon east, coastal steps / bike greenway / boardwalk along the sea.
 * Coordinate system: +X = east, +Z = south, +Y = up. Units: meters. Origin = podium center.
 */
(function () {
  'use strict';

  // ---------- palette ----------
  var COL = {
    bg:      0xf5f5f1,
    white:   0xffffff,
    white2:  0xfbfbf8,
    glass:   0xe3e7e9,
    glassSea:0xdde4e7,
    granite: 0xc9cfc6,
    ground:  0xf3f3ef,
    pave:    0xefefe9,
    road:    0xe4e4de,
    walk:    0xecece6,
    board:   0xe7ddca,   // timber boardwalk
    sand:    0xeee6d2,
    water:   0xa4c9d2,
    pool:    0x9fd0cc,   // Minghua fountain pool (teal)
    bike:    0xc9695a,   // red greenway
    green:   0x6fbf3f,
    green2:  0x87cc55,
    green3:  0x5aa832,
    trunk:   0xc9c2b4,
    line:    0x2b2b28,
    lineSoft:0xd8d5cc,
    far:     0xf0f0eb,
    steel:   0xd3d6da,   // lion sculpture
    shipRed: 0xa84a3e,
    roofRed: 0xa8524a,
    wood:    0xdccfae,
    flower1: 0xe0523c,
    flower2: 0xf0a13c,
    cream:   0xf1ece0,
    tan:     0xe9e0cd,
    tan2:    0xefe8da,
    warm:    0xfaf6ee,
    coral:   0xe0685c,
    palm:    0x4f9e3d,
    knoll:   0xd3decc
  };

  // ---------- renderer / scene ----------
  var canvasHost = document.getElementById('app');
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent) ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(COL.bg, 1);
  canvasHost.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COL.bg, 800, 2900);
  renderer.localClippingEnabled = true;
  var secPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6);   // x <= constant stays visible

  var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(-520, 320, 620);

  // ---------- lights ----------
  var hemi = new THREE.HemisphereLight(0xffffff, 0xeeeee8, 1.05);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffffff, 0.42);
  sun.position.set(260, 430, 240);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 2600;
  sun.shadow.camera.left = -1150; sun.shadow.camera.right = 1150;
  sun.shadow.camera.top = 1250;   sun.shadow.camera.bottom = -1250;
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  // ---------- materials ----------
  var CLIPMATS = [];              // every material that the section plane should cut
  var NIGHT = [];                 // [material, dayColor, nightColor, dayEmissive, nightEmissive]
  function lam(c, opt) {
    var m = new THREE.MeshLambertMaterial(Object.assign({ color: c, side: THREE.DoubleSide }, opt || {}));
    m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1;
    CLIPMATS.push(m);
    return m;
  }
  var M = {
    white:   lam(COL.white),
    white2:  lam(COL.white2),
    glass:   lam(COL.glass),
    glassSea:lam(COL.glassSea, { transparent: true, opacity: 0.95 }),
    granite: lam(COL.granite),
    ground:  lam(COL.ground),
    pave:    lam(COL.pave),
    road:    lam(COL.road),
    walk:    lam(COL.walk),
    board:   lam(COL.board),
    sand:    lam(COL.sand),
    water:   (function () {
      var m = new THREE.MeshPhongMaterial({ color: 0x6da4bb, flatShading: true, shininess: 80, specular: 0x223038, fog: false });
      m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1;
      return m;
    })(),
    pool:    lam(COL.pool),
    bike:    lam(COL.bike),
    green:   lam(COL.green),
    green2:  lam(COL.green2),
    green3:  lam(COL.green3),
    trunk:   lam(COL.trunk),
    far:     lam(COL.far),
    steel:   lam(COL.steel),
    shipRed: lam(COL.shipRed),
    roofRed: lam(COL.roofRed),
    wood:    lam(COL.wood),
    darkRoof:lam(0x8f887c),
    cream:   lam(COL.cream),
    tan:     lam(COL.tan),
    tan2:    lam(COL.tan2),
    warm:    lam(COL.warm),
    coral:   lam(COL.coral),
    palm:    lam(COL.palm),
    knoll:   lam(COL.knoll),
    wedge:   lam(COL.white, { side: THREE.DoubleSide })
  };
  var edgeMat     = new THREE.LineBasicMaterial({ color: COL.line, transparent: true, opacity: 0.82 });
  var edgeMatSoft = new THREE.LineBasicMaterial({ color: COL.line, transparent: true, opacity: 0.38 });
  var jointMat    = new THREE.LineBasicMaterial({ color: COL.lineSoft, transparent: true, opacity: 0.7 });
  var mullionMat  = new THREE.LineBasicMaterial({ color: COL.line, transparent: true, opacity: 0.32 });
  var whiteLine   = new THREE.LineBasicMaterial({ color: 0xffffff });
  CLIPMATS.push(edgeMat, edgeMatSoft, jointMat, mullionMat, whiteLine, M.water);

  // ---------- helpers ----------
  function addEdges(mesh, soft) {
    var eg = new THREE.EdgesGeometry(mesh.geometry, 24);
    var ls = new THREE.LineSegments(eg, soft ? edgeMatSoft : edgeMat);
    ls.position.copy(mesh.position);
    ls.rotation.copy(mesh.rotation);
    ls.scale.copy(mesh.scale);
    mesh.parent.add(ls);
    return ls;
  }
  function box(parent, w, h, d, cx, baseY, cz, mat, opt) {
    opt = opt || {};
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || M.white);
    m.position.set(cx, baseY + h / 2, cz);
    if (opt.rotY) m.rotation.y = opt.rotY;
    m.castShadow = opt.noShadow ? false : true;
    m.receiveShadow = true;
    parent.add(m);
    if (opt.edges !== false) addEdges(m, opt.soft);
    return m;
  }
  function wedge(parent, w, d, hA, hB, axis, cx, baseY, cz, mat, opt) {
    opt = opt || {};
    var x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
    function topY(x, z) { return axis === 'x' ? hA + (hB - hA) * ((x - x0) / w) : hA + (hB - hA) * ((z - z0) / d); }
    var b0 = [x0, 0, z0], b1 = [x1, 0, z0], b2 = [x1, 0, z1], b3 = [x0, 0, z1];
    var t0 = [x0, topY(x0, z0), z0], t1 = [x1, topY(x1, z0), z0], t2 = [x1, topY(x1, z1), z1], t3 = [x0, topY(x0, z1), z1];
    var tris = [b0, b2, b1, b0, b3, b2, t0, t1, t2, t0, t2, t3,
      b0, b1, t1, b0, t1, t0, b2, b3, t3, b2, t3, t2,
      b1, b2, t2, b1, t2, t1, b3, b0, t0, b3, t0, t3];
    var pos = new Float32Array(tris.length * 3);
    for (var i = 0; i < tris.length; i++) { pos[i * 3] = tris[i][0]; pos[i * 3 + 1] = tris[i][1]; pos[i * 3 + 2] = tris[i][2]; }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.computeVertexNormals();
    var m = new THREE.Mesh(g, mat || M.wedge);
    m.position.set(cx, baseY, cz);
    if (opt.rotY) m.rotation.y = opt.rotY;
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    if (opt.edges !== false) addEdges(m, opt.soft);
    return m;
  }
  function plate(parent, w, d, cx, y, cz, mat, opt) {
    opt = opt || {};
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, opt.t || 0.15, d), mat);
    m.position.set(cx, y, cz);
    if (opt.rotY) m.rotation.y = opt.rotY;
    if (opt.rotX) m.rotation.x = opt.rotX;
    if (opt.rotZ) m.rotation.z = opt.rotZ;
    m.receiveShadow = true;
    m.castShadow = !!opt.cast;
    parent.add(m);
    if (opt.edges) addEdges(m, opt.soft);
    return m;
  }
  function joints(parent, x0, x1, z0, z1, step, y, mat) {
    var pts = [];
    for (var x = x0; x <= x1 + 0.01; x += step) { pts.push(x, y, z0, x, y, z1); }
    for (var z = z0; z <= z1 + 0.01; z += step) { pts.push(x0, y, z, x1, y, z); }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    parent.add(new THREE.LineSegments(g, mat || jointMat));
  }
  function lines(parent, segs, mat) {
    var flat = [];
    segs.forEach(function (s) { flat.push.apply(flat, s); });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flat), 3));
    var ls = new THREE.LineSegments(g, mat || mullionMat);
    parent.add(ls);
    return ls;
  }
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  // trees & palms are collected as specs and built later as InstancedMeshes (perf batching)
  var treeSpecs = [], palmSpecs = [];
  function tree(parent, x, z, s, dark) {
    var spec = { parent: parent, position: { x: x, y: 0, z: z }, s: s || 1, dark: !!dark, blobs: [] };
    var n = 2 + Math.floor(rnd() * 2);
    for (var i = 0; i < n; i++) {
      spec.blobs.push({
        r: 2.6 + rnd() * 2.0,
        ox: (rnd() - 0.5) * 3.4, oy: rnd() * 1.6, oz: (rnd() - 0.5) * 3.4,
        rx: rnd() * 3, ry: rnd() * 3, rz: rnd() * 3
      });
    }
    treeSpecs.push(spec);
    return spec;
  }
  function palm(parent, x, z, s) {
    var spec = { parent: parent, position: { x: x, y: 0, z: z }, s: s || 1, tilt: (rnd() - 0.5) * 0.12, fr: [] };
    for (var i = 0; i < 6; i++) { spec.fr.push(i / 6 * Math.PI * 2 + rnd() * 0.4); }
    palmSpecs.push(spec);
    return spec;
  }
  // a real (non-instanced) tree for parts that move, e.g. the exploding pavilion deck
  function liveTree(parent, x, z, s, dark, y) {
    s = s || 1;
    var g = new THREE.Group();
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.42 * s, 4.0 * s, 5), M.trunk);
    trunk.position.y = 2.0 * s; g.add(trunk);
    var tones = dark ? [M.green3, M.green, M.green3] : [M.green, M.green2, M.green3];
    var n = 2 + Math.floor(rnd() * 2);
    for (var i = 0; i < n; i++) {
      var r = (2.6 + rnd() * 2.0) * s;
      var b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), tones[i % tones.length]);
      b.position.set((rnd() - 0.5) * 3.4 * s, 4.0 * s + r * 0.7 + rnd() * 1.6 * s, (rnd() - 0.5) * 3.4 * s);
      b.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      b.castShadow = true;
      g.add(b);
    }
    g.position.set(x, y || 0, z);
    parent.add(g);
    return g;
  }
  function buildVegetation() {
    var v = new THREE.Vector3();
    var mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
    function worldOf(spec) {
      spec.parent.updateMatrixWorld(true);
      return spec.parent.localToWorld(v.set(spec.position.x, spec.position.y, spec.position.z)).clone();
    }
    // tree trunks
    var trunkGeo = new THREE.CylinderGeometry(0.3, 0.42, 4.0, 5);
    var trunkI = new THREE.InstancedMesh(trunkGeo, M.trunk, treeSpecs.length);
    var nBlobs = 0;
    treeSpecs.forEach(function (t) { nBlobs += t.blobs.length; });
    var blobGeo = new THREE.IcosahedronGeometry(1, 0);
    var blobMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var blobI = new THREE.InstancedMesh(blobGeo, blobMat, nBlobs);
    var tones = [new THREE.Color(COL.green), new THREE.Color(COL.green2), new THREE.Color(COL.green3)];
    var tonesDark = [new THREE.Color(COL.green3), new THREE.Color(COL.green), new THREE.Color(COL.green3)];
    var bi = 0;
    treeSpecs.forEach(function (t, ti) {
      var w = worldOf(t), s = t.s;
      q.setFromEuler(e.set(0, 0, 0));
      mtx.compose(v.set(w.x, w.y + 2.0 * s, w.z), q, sc.set(s, s, s));
      trunkI.setMatrixAt(ti, mtx);
      t.blobs.forEach(function (b, k) {
        var r = b.r * s;
        q.setFromEuler(e.set(b.rx, b.ry, b.rz));
        mtx.compose(v.set(w.x + b.ox * s, w.y + 4.0 * s + r * 0.7 + b.oy * s, w.z + b.oz * s), q, sc.set(r, r, r));
        blobI.setMatrixAt(bi, mtx);
        blobI.setColorAt(bi, (t.dark ? tonesDark : tones)[k % 3]);
        bi++;
      });
    });
    trunkI.castShadow = true; blobI.castShadow = true;
    blobI.instanceColor.needsUpdate = true;
    scene.add(trunkI); scene.add(blobI);
    // palms
    var pTrunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 7, 5);
    var pTrunkI = new THREE.InstancedMesh(pTrunkGeo, M.trunk, palmSpecs.length);
    var frondGeo = new THREE.ConeGeometry(0.55, 3.6, 4);
    var frondI = new THREE.InstancedMesh(frondGeo, M.palm, palmSpecs.length * 6);
    var fi = 0;
    palmSpecs.forEach(function (p, pi) {
      var w = worldOf(p), s = p.s;
      q.setFromEuler(e.set(0, 0, p.tilt));
      mtx.compose(v.set(w.x, w.y + 3.5 * s, w.z), q, sc.set(s, s, s));
      pTrunkI.setMatrixAt(pi, mtx);
      p.fr.forEach(function (a) {
        q.setFromEuler(e.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25));
        mtx.compose(v.set(w.x + Math.cos(a) * 1.5 * s, w.y + 7.1 * s, w.z + Math.sin(a) * 1.5 * s), q, sc.set(s, s, s));
        frondI.setMatrixAt(fi, mtx);
        fi++;
      });
    });
    pTrunkI.castShadow = true; frondI.castShadow = true;
    scene.add(pTrunkI); scene.add(frondI);
    CLIPMATS.push(blobMat);
  }
  function stairs(parent, xC, w, zFrom, zTo, y0, y1, n, mat) {
    for (var i = 0; i < n; i++) {
      var t0 = i / n, t1 = (i + 1) / n;
      var za = zFrom + (zTo - zFrom) * t0, zb = zFrom + (zTo - zFrom) * t1;
      var h = y0 + (y1 - y0) * t1;
      box(parent, w, Math.max(h, 0.3), Math.abs(zb - za), xC, 0, (za + zb) / 2, mat || M.white, { soft: i % 3 !== 0 });
    }
  }
  // extrude a 2D plan shape vertically (plan drawn in XY; +Y in plan becomes -Z north in world)
  function extrudePlan(parent, shape, h, cx, baseY, cz, mat, opt) {
    opt = opt || {};
    var g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    var m = new THREE.Mesh(g, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, baseY, cz);
    m.castShadow = opt.noShadow ? false : true;
    m.receiveShadow = true;
    var holder = new THREE.Group();
    holder.add(m);
    if (opt.rotY) holder.rotation.y = opt.rotY;
    if (opt.px !== undefined) holder.position.set(opt.px, 0, opt.pz);
    parent.add(holder);
    if (opt.edges !== false) {
      var eg = new THREE.EdgesGeometry(g, 30);
      var ls = new THREE.LineSegments(eg, opt.soft ? edgeMatSoft : edgeMat);
      ls.rotation.copy(m.rotation); ls.position.copy(m.position);
      holder.add(ls);
    }
    return holder;
  }

  function roundedRect(w, d, r) {
    var s = new THREE.Shape(), hw = w / 2, hd = d / 2;
    s.moveTo(-hw + r, -hd);
    s.lineTo(hw - r, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + r);
    s.lineTo(hw, hd - r); s.quadraticCurveTo(hw, hd, hw - r, hd);
    s.lineTo(-hw + r, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - r);
    s.lineTo(-hw, -hd + r); s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return s;
  }
  // standing-seam lines on a wedge roof (along the slope axis)
  function roofSeams(parent, w, d, hA, hB, axis, cx, baseY, cz, n) {
    var segs = [];
    for (var i = 1; i < n; i++) {
      if (axis === 'z') {
        var x = cx - w / 2 + (w / n) * i;
        segs.push([x, baseY + hA + 0.06, cz - d / 2, x, baseY + hB + 0.06, cz + d / 2]);
      } else {
        var z = cz - d / 2 + (d / n) * i;
        segs.push([cx - w / 2, baseY + hA + 0.06, z, cx + w / 2, baseY + hB + 0.06, z]);
      }
    }
    lines(parent, segs, jointMat);
  }
  // facade panel-joint grid on a vertical plane (nx × ny cells)
  function panelJoints(parent, x0, y0, z0, x1, y1, z1, nx, ny) {
    var segs = [], i, t;
    for (i = 1; i < nx; i++) {
      t = i / nx;
      segs.push([x0 + (x1 - x0) * t, y0, z0 + (z1 - z0) * t, x0 + (x1 - x0) * t, y1, z0 + (z1 - z0) * t]);
    }
    for (i = 1; i < ny; i++) {
      t = i / ny;
      segs.push([x0, y0 + (y1 - y0) * t, z0, x1, y0 + (y1 - y0) * t, z1]);
    }
    lines(parent, segs, jointMat);
  }

  // ================================================================
  // THE BUILDING  (podium 155 × 128, roof deck +16.8, pavilion boxes)
  // ================================================================
  var B = new THREE.Group();
  scene.add(B);
  // sub-groups for the exploded-axon shot: pavilion spine + the three view volumes
  var GS = new THREE.Group(), GT = new THREE.Group(), GH = new THREE.Group(), GR = new THREE.Group();
  B.add(GS); B.add(GT); B.add(GH); B.add(GR);

  box(B, 154, 5.6, 127, 0.5, 0, 0, M.white);
  box(B, 151, 1.6, 124, 0.5, 5.6, 0, M.glass, { soft: true });
  box(B, 158, 1.6, 131, 0.5, 7.2, 0, M.white);
  box(B, 150, 4.6, 123, 0.5, 8.8, 0, M.white);
  box(B, 147, 1.6, 120, 0.5, 13.4, 0, M.glass, { soft: true });
  box(B, 159, 1.8, 132, 0.5, 15.0, 0, M.white);
  box(B, 2.4, 5.6, 38, -76.9, 0, -18, M.granite, { soft: true });
  box(B, 30, 5.6, 2.4, 30, 0, 63.6, M.granite, { soft: true });

  // Culture Plaza glass (north) + Waterfront Plaza glass (south)
  box(B, 56, 16.2, 1.2, 8, 0, -66.4, M.glassSea, { noShadow: true });
  (function () {
    var segs = [];
    for (var i = 0; i <= 8; i++) { var x = 8 - 28 + i * 7; segs.push([x, 0.2, -67.05, x, 16.1, -67.05]); }
    segs.push([8 - 28, 16.2, -67.05, 8 + 28, 16.2, -67.05]);
    lines(B, segs);
  })();
  box(B, 44, 13, 1.2, -20, 0, 66.4, M.glassSea, { noShadow: true });
  (function () {
    var segs = [];
    for (var i = 0; i <= 6; i++) { var x = -20 - 22 + i * (44 / 6); segs.push([x, 0.2, 67.05, x, 12.9, 67.05]); }
    lines(B, segs);
  })();

  // roof garden — densely planted (per satellite)
  joints(B, -72, 73, -58, 58, 9, 16.95);
  box(B, 158, 0.9, 0.35, 0.5, 16.8, -65.6, M.white, { soft: true, noShadow: true });
  box(B, 158, 0.9, 0.35, 0.5, 16.8, 65.6, M.white, { soft: true, noShadow: true });
  box(B, 0.35, 0.9, 131, -78.6, 16.8, 0, M.white, { soft: true, noShadow: true });
  box(B, 0.35, 0.9, 131, 79.6, 16.8, 0, M.white, { soft: true, noShadow: true });
  // large planted areas + strips
  plate(B, 26, 40, -64, 17.0, -34, M.green3, { t: 0.45, edges: true, soft: true, cast: true });
  plate(B, 24, 34, -64, 17.0, 32, M.green, { t: 0.45, edges: true, soft: true, cast: true });
  plate(B, 44, 12, -36, 17.0, -52, M.green2, { t: 0.45, edges: true, soft: true, cast: true });
  plate(B, 36, 10, 30, 17.0, 50, M.green, { t: 0.45, edges: true, soft: true, cast: true });
  plate(B, 22, 26, 64, 17.0, 40, M.green2, { t: 0.45, edges: true, soft: true, cast: true });
  plate(B, 30, 12, 52, 17.0, -50, M.green, { t: 0.45, edges: true, soft: true, cast: true });
  [[-64, -40], [-66, -22], [-62, 26], [-60, 42], [-34, -52], [-20, -50], [26, 50], [40, 52], [64, 34], [58, 46], [50, -50], [62, -46]]
    .forEach(function (p) { var t = tree(B, p[0], p[1], 0.5, true); t.position.y = 16.8; });

  // pavilion spine + skylight + monitors + upper roof lawns (main roof garden level)
  box(GS, 96, 7, 52, 2, 16.8, -2, M.white);
  joints(GS, -44, 48, -26, 20, 9, 23.95);
  wedge(GS, 17, 13, 0.5, 4.6, 'z', -28, 23.8, -9, M.wedge, {});
  wedge(GS, 12, 9, 0.4, 2.6, 'x', 22, 23.8, -16, M.wedge, {});
  wedge(GS, 10, 8, 0.4, 2.2, 'z', -6, 23.8, 12, M.wedge, {});
  plate(GS, 16, 20, 38, 23.95, -16, M.green2, { t: 0.4, edges: true, soft: true, cast: true });
  plate(GS, 28, 16, -30, 23.95, 11, M.green, { t: 0.4, edges: true, soft: true, cast: true });
  plate(GS, 28, 14, 16, 23.95, 13, M.green2, { t: 0.4, edges: true, soft: true, cast: true });
  [[38, -22], [42, -10], [-38, 8], [-22, 15], [10, 16], [26, 10]].forEach(function (p) {
    liveTree(GS, p[0], p[1], 0.42, true, 23.8);
  });
  // theater (north)
  box(B, 44, 1.4, 30, 14, 16.8, -52, M.glass, { soft: true, noShadow: true });
  box(GT, 46, 11, 34, 14, 18.2, -57, M.white);
  wedge(GT, 46, 34, 5.0, 0.6, 'z', 14, 29.2, -57, M.wedge, {});
  roofSeams(GT, 46, 34, 5.0, 0.6, 'z', 14, 29.2, -57, 8);
  panelJoints(GT, 37.05, 18.5, -72, 37.05, 29.0, -42, 5, 3);
  (function () {
    var segs = []; for (var i = 0; i < 6; i++) { var y = 19.8 + i * 1.7; segs.push([14 - 21, y, -74.2, 14 + 21, y, -74.2]); }
    lines(GT, segs);
  })();
  // multi-purpose hall (south, glazed to the sea)
  box(B, 40, 1.4, 42, -14, 16.8, 49, M.glass, { soft: true, noShadow: true });
  box(GH, 42, 10, 48, -14, 17.4, 54, M.white);
  wedge(GH, 42, 48, 0.6, 5.4, 'z', -14, 27.4, 54, M.wedge, {});
  roofSeams(GH, 42, 48, 0.6, 5.4, 'z', -14, 27.4, 54, 8);
  panelJoints(GH, -35.05, 17.6, 32, -35.05, 27.2, 76, 6, 3);
  box(GH, 40, 9, 0.9, -14, 17.9, 78.4, M.glassSea, { noShadow: true });
  (function () {
    var segs = []; for (var i = 1; i < 8; i++) { var x = -14 - 20 + i * 5; segs.push([x, 18.1, 79.0, x, 26.7, 79.0]); }
    lines(GH, segs);
  })();
  // restaurant (east)
  box(B, 34, 1.4, 24, 71, 16.8, 6, M.glass, { soft: true, noShadow: true });
  box(GR, 38, 8.6, 26, 75, 17.4, 6, M.white);
  wedge(GR, 38, 26, 0.5, 4.4, 'x', 75, 26.0, 6, M.wedge, {});
  roofSeams(GR, 38, 26, 0.5, 4.4, 'x', 75, 26.0, 6, 6);
  panelJoints(GR, 57, 17.6, 19.05, 93, 25.8, 19.05, 6, 3);
  box(GR, 0.9, 7.0, 24, 94.4, 17.9, 6, M.glassSea, { noShadow: true });
  lines(GR, [[94.9, 24.6, -5, 94.9, 18.4, 6], [94.9, 18.4, 6, 94.9, 24.6, 17]], edgeMat);
  // annotation labels + leader lines (visible only in the exploded-axon shot)
  var LBLS = [];
  function makeLabel(grp, text, x, yAnchor, z, yLift) {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
    var cx2 = cv.getContext('2d');
    cx2.font = '600 52px "PingFang SC","Microsoft YaHei",sans-serif';
    cx2.fillStyle = '#2b2b28';
    cx2.textAlign = 'center'; cx2.textBaseline = 'middle';
    cx2.fillText(text, 256, 40);
    cx2.fillStyle = '#6fae3c';
    cx2.fillRect(176, 78, 160, 5);
    var tex = new THREE.CanvasTexture(cv);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false }));
    sp.scale.set(46, 8.6, 1);
    sp.position.set(x, yAnchor + yLift + 3.5, z);
    sp.visible = false;
    grp.add(sp);
    var lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x, yAnchor, z, x, yAnchor + yLift, z]), 3));
    var ln = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: COL.line, transparent: true, opacity: 0 }));
    ln.visible = false;
    grp.add(ln);
    LBLS.push({ sp: sp, ln: ln });
  }
  makeLabel(GT, '剧院 · 望山望城', 14, 34.5, -57, 9);
  makeLabel(GH, '多功能厅 · 望海', -14, 33, 54, 9);
  makeLabel(GR, '餐厅 · 望园', 75, 30.5, 6, 8);

  // grand stairs — SE stair: twin runs flanking a cascade of planted terraces (per photos)
  stairs(B, 47.5, 7, 92, 60, 0, 16.8, 12, M.white);
  stairs(B, 68.5, 7, 92, 60, 0, 16.8, 12, M.white);
  (function () {
    for (var i = 0; i < 12; i++) {
      var t0 = i / 12, t1 = (i + 1) / 12;
      var za = 92 + (60 - 92) * t0, zb = 92 + (60 - 92) * t1;
      var h = (16.8 / 12) * (i + 1);
      box(B, 10, Math.max(h, 0.3), Math.abs(zb - za), 58, 0, (za + zb) / 2, i % 2 ? M.green3 : M.green, { soft: true });
    }
  })();
  stairs(B, -64, 16, -90, -64.5, 0, 16.8, 12, M.white);

  // ================================================================
  // SITE / CONTEXT
  // ================================================================
  var S = new THREE.Group();
  scene.add(S);

  // land plate: covers everything north of the shoreline, with cutouts where water/sunken decks live
  var ground = (function () {
    var sh = new THREE.Shape();                      // shape (x, y) with y = -z after rotation
    sh.moveTo(-2100, -140); sh.lineTo(2100, -140);
    sh.lineTo(2100, 2100); sh.lineTo(-2100, 2100);
    sh.closePath();
    function hole(x0, x1, z0, z1) {
      var p = new THREE.Path();
      p.moveTo(x0, -z1); p.lineTo(x1, -z1); p.lineTo(x1, -z0); p.lineTo(x0, -z0);
      p.closePath();
      return p;
    }
    sh.holes.push(hole(640, 960, -400, -160));       // fishing-port basin
    sh.holes.push(hole(700, 900, -150, 130));        // channel to the bay
    sh.holes.push(hole(-285, 145, 110, 139.5));      // sunken amphitheater steps + boardwalk
    var m = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.ground);
    m.rotation.x = -Math.PI / 2;
    m.position.y = -0.05;
    m.receiveShadow = true;
    S.add(m);
    return m;
  })();
  plate(S, 840, 200, 20, 0.02, -6, M.pave, { t: 0.1 });
  joints(S, -270, 330, -64, 64, 12, 0.16);

  // --- Wanghai Road with cars + street trees ---
  plate(S, 1400, 15, 0, 0.06, -79, M.road, { t: 0.12 });
  plate(S, 1400, 3.5, 0, 0.05, -70, M.walk, { t: 0.1 });
  plate(S, 1400, 3.5, 0, 0.05, -88, M.walk, { t: 0.1 });
  (function () {
    var segs = []; for (var x = -690; x < 690; x += 16) { segs.push([x, 0.2, -79, x + 6, 0.2, -79]); }
    lines(S, segs, whiteLine);
  })();
  var cars = [];
  function car(x, z, dir, speed) {
    var g = new THREE.Group();
    box(g, 4.6, 1.35, 2, 0, 0.1, 0, M.white, { soft: true });
    box(g, 2.4, 0.9, 1.9, -0.2, 1.35, 0, M.glass, { soft: true });
    g.position.set(x, 0, z);
    S.add(g); cars.push({ g: g, dir: dir, speed: speed });
  }
  car(-300, -75.5, 1, 9); car(-80, -75.5, 1, 8); car(160, -75.5, 1, 10); car(420, -75.5, 1, 9);
  car(360, -82.5, -1, 9); car(60, -82.5, -1, 11); car(-260, -82.5, -1, 8);
  for (var xs = -420; xs <= 420; xs += 30) { tree(S, xs + (rnd() - 0.5) * 6, -92.5, 0.85); tree(S, xs + 14 + (rnd() - 0.5) * 6, -68, 0.7); }

  // ================================================================
  // WATERFRONT: promenade → red bike greenway → walk → coastal steps → boardwalk / beach → sea
  // ================================================================
  var W = new THREE.Group(); S.add(W);
  plate(W, 900, 28, -60, 0.04, 80, M.pave, { t: 0.1 });
  joints(W, -420, 300, 68, 93, 12, 0.14);
  // red bike lane with dashes
  plate(W, 900, 4.2, -60, 0.07, 97, M.bike, { t: 0.14 });
  (function () {
    var segs = []; for (var x = -500; x < 380; x += 13) { segs.push([x, 0.22, 97, x + 5, 0.22, 97]); }
    lines(W, segs, whiteLine);
  })();
  // pedestrian walk
  plate(W, 900, 11, -60, 0.05, 105.5, M.walk, { t: 0.1 });
  (function () {
    var k = 0;
    for (var xp = -280; xp <= 260; xp += 30) {
      if (k++ % 2 === 0) palm(W, xp + (rnd() - 0.5) * 5, 108, 0.95 + rnd() * 0.2);
      else tree(W, xp + (rnd() - 0.5) * 5, 108, 0.85);
    }
  })();
  // lawns on upper promenade
  plate(W, 90, 14, -180, 0.35, 78, M.green2, { t: 0.5, edges: true, soft: true });
  plate(W, 56, 12, -300, 0.3, 80, M.green, { t: 0.5, edges: true, soft: true });
  // coastal amphitheater steps down to the water (x -280..140)
  (function () {
    for (var i = 0; i < 5; i++) {
      var zTop = 111 + i * 3.0, drop = 0.58 * (i + 1);
      box(W, 420, 3.4 - drop * 0.0 + 0.6, 3.0, -70, -drop - 3.4, zTop + 1.5, M.white, { soft: i % 2 === 1 });
    }
  })();
  // timber boardwalk at water level
  plate(W, 420, 12, -70, -2.55, 132, M.board, { t: 0.5, edges: true, soft: true });
  (function () { // boardwalk plank joints
    var segs = []; for (var x = -280; x <= 140; x += 6) { segs.push([x, -2.28, 126.4, x, -2.28, 137.6]); }
    lines(W, segs, jointMat);
  })();
  // sandy cove east of the steps
  plate(W, 190, 26, 235, -1.2, 126, M.sand, { t: 2.6, edges: true, soft: true });
  plate(W, 160, 30, -390, -1.2, 124, M.pave, { t: 2.6, edges: true, soft: true });
  // seawall edge
  lines(W, [[-1500, -2.4, 140, 1500, -2.4, 140]], edgeMat);

  // --- COMMUNE 幻师 bar terrace (glass bar pavilion + tiered seating + lawn, in front of SWCAC) ---
  (function () {
    var C = new THREE.Group(); C.position.set(-112, 0, 0); W.add(C);
    plate(C, 64, 18, -6, 0.28, 75, M.green2, { t: 0.5, edges: true, soft: true });     // lawn
    box(C, 16, 4.0, 8.5, 8, 0.1, 84, M.glassSea, {});                                  // glass bar box
    box(C, 17.5, 0.9, 9.5, 8, 4.1, 84, M.white, {});                                   // fascia
    box(C, 6.5, 1.1, 0.3, 8, 2.6, 79.6, lam(0x3c3a36), { soft: true });                // dark sign band
    (function () { // bar glazing mullions
      var segs = []; for (var i = 1; i < 5; i++) { var x = 0 + i * 3.2; segs.push([x, 0.3, 79.7, x, 3.9, 79.7]); }
      lines(C, segs);
    })();
    [[-2, 88], [3, 90.5], [13, 90], [18, 87.5], [0.5, 92.5], [16, 92.5]].forEach(function (p, i) {
      parasol(C, p[0], p[1], i % 3 === 0 ? 0xd6604f : 0xffffff);
      box(C, 0.8, 0.75, 0.8, p[0], 0.1, p[1], M.white, { soft: true, noShadow: true });
    });
    // tiered lawn/timber seating steps facing the sea (north of the greenway)
    for (var i = 0; i < 4; i++) {
      box(C, 46, Math.max(1.7 - i * 0.42, 0.28), 2.9, -20, 0, 82.5 + i * 3.0, i % 2 ? M.green2 : M.wood, { soft: true });
    }
  })();
  // circular viewing deck on the west promenade (per aerial photo)
  (function () {
    var deck = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 0.7, 24), M.pave);
    deck.position.set(-330, -0.1, 122); deck.receiveShadow = true; W.add(deck);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(15.4, 0.12, 5, 40), M.white);
    ring.rotation.x = -Math.PI / 2; ring.position.set(-330, 1.0, 122); W.add(ring);
    var eg = new THREE.EdgesGeometry(deck.geometry, 40);
    var ls = new THREE.LineSegments(eg, edgeMatSoft);
    ls.position.copy(deck.position); W.add(ls);
  })();

  // --- parasols + cafe zone (SE corner, per satellite) ---
  function parasol(parent, x, z, c, y) {
    var g = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), M.trunk);
    pole.position.y = 1.3; g.add(pole);
    var top = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.7, 7), lam(c));
    top.position.y = 2.75; top.castShadow = true; g.add(top);
    addEdges(top, true);
    g.position.set(x, y || 0.1, z);
    parent.add(g);
  }
  [[86, 76, 0xffffff], [93, 82, 0xd6604f], [79, 84, 0xffffff], [100, 76, 0xf0e6d4], [72, 78, 0xd6604f],
   [-150, 74, 0xffffff], [-158, 80, 0xf0e6d4], [-142, 80, 0xffffff]]
    .forEach(function (p) { parasol(W, p[0], p[1], p[2]); });
  parasol(W, -180, 130, 0xffffff, -2.3); parasol(W, -200, 128, 0xd6604f, -2.3);

  // --- cyclists on the greenway ---
  var bikes = [];
  function cyclist(x, dir, speed, c) {
    var g = new THREE.Group();
    var w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.07, 10), lam(0x4a4a46));
    w1.rotation.x = Math.PI / 2; w1.position.set(0.52, 0.36, 0); g.add(w1);
    var w2 = w1.clone(); w2.position.x = -0.52; g.add(w2);
    var fr = box(g, 1.1, 0.09, 0.09, 0, 0.62, 0, lam(0x4a4a46), { edges: false });
    fr.rotation.z = 0.12;
    var bod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.78, 6), lam(c));
    bod.position.set(-0.08, 1.15, 0); bod.rotation.z = 0.35; bod.castShadow = true; g.add(bod);
    var hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), lam(0xf2ede4));
    hd.position.set(0.18, 1.62, 0); g.add(hd);
    if (dir < 0) g.rotation.y = Math.PI;
    g.position.set(x, 0.1, 97 + (dir < 0 ? 1.1 : -1.1));
    W.add(g); bikes.push({ g: g, dir: dir, speed: speed });
  }
  cyclist(-240, 1, 6.5, 0xd6604f); cyclist(40, 1, 5.8, 0xf2f1ec); cyclist(180, -1, 7, 0x6f8fb5); cyclist(-60, -1, 6, 0xe8b64c);

  // --- water with gentle low-poly ripples ---
  var waterGeo = new THREE.PlaneGeometry(3400, 1440, 96, 40);
  var water = new THREE.Mesh(waterGeo, M.water);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -3.0, 105 + 720);
  S.add(water);
  // faked depth gradient: shallows band + mid band over the deep plane (fog-free like the sea itself)
  var shallowMat = lam(0xc4e0e6, { fog: false });
  var midSeaMat = lam(0x93c3d3, { fog: false });
  plate(S, 3400, 55, 0, -2.85, 168, shallowMat, { t: 0.1 });
  plate(S, 3400, 130, 0, -2.9, 262, midSeaMat, { t: 0.1 });
  var wPos = waterGeo.attributes.position;
  var wBase = new Float32Array(wPos.array.length);
  wBase.set(wPos.array);

  var boats = [];
  function boat(x, z, s, sp) {
    var g = new THREE.Group();
    box(g, 16 * s, 2.2 * s, 4.6 * s, 0, 0, 0, M.white, { soft: true });
    wedge(g, 5 * s, 4.6 * s, 2.2 * s, 0.4 * s, 'x', 10.5 * s, 0, 0, M.wedge, { soft: true });
    box(g, 5 * s, 2.4 * s, 3.4 * s, -2 * s, 2.2 * s, 0, M.white, { soft: true });
    lines(g, [[-(8 + 14) * s, 0.3, -2.6 * s, -8 * s, 0.3, -1.4 * s], [-(8 + 14) * s, 0.3, 2.6 * s, -8 * s, 0.3, 1.4 * s]], whiteLine);
    if (sp < 0) g.rotation.y = Math.PI;
    g.position.set(x, -2.6, z); S.add(g); boats.push({ g: g, sp: sp });
  }
  boat(-40, 340, 1.3, 2.4); boat(200, 300, 1.7, -1.8); boat(470, 260, 1.1, 2);

  // --- marina across the bay (finger piers + yachts + curved breakwater) ---
  (function () {
    var MR = new THREE.Group(); S.add(MR);
    plate(MR, 320, 7, 70, -2.0, 428, M.pave, { t: 0.6, edges: true, soft: true });
    var yachtGeo = new THREE.BoxGeometry(2.4, 1.5, 7.5);
    var yachtMat = lam(0xffffff);
    var slots = [];
    [-50, 20, 90, 160].forEach(function (px) {
      plate(MR, 4, 120, px - 30, -2.0, 492, M.pave, { t: 0.6, edges: true, soft: true });
      for (var zz = 444; zz <= 540; zz += 12) {
        if (rnd() < 0.78) slots.push([px - 30 - 4.6, zz]);
        if (rnd() < 0.78) slots.push([px - 30 + 4.6, zz]);
      }
    });
    var inst = new THREE.InstancedMesh(yachtGeo, yachtMat, slots.length);
    var mtx = new THREE.Matrix4();
    slots.forEach(function (s, i) {
      mtx.makeRotationY((rnd() - 0.5) * 0.06);
      mtx.setPosition(s[0], -2.2, s[1]);
      inst.setMatrixAt(i, mtx);
    });
    inst.castShadow = false; MR.add(inst);
    // a couple of larger yachts
    boat(-40, 485, 1.0, 0); boats.pop(); // static reuse of boat builder: keep last group static
    // curved breakwater arm
    for (var i = 0; i <= 26; i++) {
      var th = (140 + i * 6.9) * Math.PI / 180;
      var bx = 110 + 210 * Math.cos(th), bz = 480 + 210 * Math.sin(th) * 0.82;
      box(MR, 16, 2.6, 7, bx, -2.9, bz, M.pave, { soft: true, rotY: -th + Math.PI / 2, edges: i % 3 === 0 });
    }
  })();

  // ================================================================
  // NORTH: Nanhai Hotel slab → Minghua ship plaza (Sea World)
  // ================================================================
  // Nanhai Hotel (long slab between road and plaza)
  (function () {
    var H = new THREE.Group(); S.add(H);
    box(H, 190, 30, 24, -30, 0, -186, M.white);
    box(H, 191, 0.9, 25, -30, 30, -186, M.white, { soft: true });
    (function () {
      var segs = [];
      for (var i = 1; i <= 4; i++) { var y = i * 6.4; segs.push([-125, y, -173.8, 65, y, -173.8]); segs.push([-125, y, -198.2, 65, y, -198.2]); }
      lines(H, segs, mullionMat);
    })();
    box(H, 30, 34, 30, 80, 0, -188, M.white);        // east head tower
    plate(H, 18, 12, 80, 0.3, -166, M.pool, { t: 0.4, edges: true, soft: true });  // pool court
    for (var i = 0; i < 8; i++) { tree(H, -120 + i * 26, -170 + (rnd() - 0.5) * 6, 0.8); }
  })();

  // Minghua ship plaza, ~370 m north (center ≈ (-60, -380))
  (function () {
    var P = new THREE.Group(); P.position.set(-60, 0, -380); S.add(P);
    plate(P, 240, 210, 0, 0.03, 0, M.pave, { t: 0.1 });
    joints(P, -115, 115, -100, 100, 11, 0.15);
    // fountain pool (teal, one organic ellipse) with coping ring
    (function () {
      var e = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.24, 34), M.pool);
      e.scale.set(42, 1, 95);
      e.position.set(0, 0.12, 2);
      e.rotation.y = 0.3;
      e.receiveShadow = true;
      P.add(e);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 4, 48), new THREE.MeshBasicMaterial({ color: COL.line, transparent: true, opacity: 0.38 }));
      rim.scale.set(42, 95, 1);
      rim.rotation.set(-Math.PI / 2, 0, 0.3);
      rim.position.set(0, 0.3, 2);
      P.add(rim);
    })();
    // the Minghua ship (white hull, red waterline, stacked decks) — bow to the SSE
    var ship = new THREE.Group();
    function hullShape(sc) {
      var s = new THREE.Shape();
      s.moveTo(0, 78 * sc);
      s.quadraticCurveTo(8.5 * sc, 46 * sc, 9 * sc, 20 * sc);
      s.lineTo(9 * sc, -58 * sc);
      s.quadraticCurveTo(9 * sc, -72 * sc, 0, -72 * sc);
      s.quadraticCurveTo(-9 * sc, -72 * sc, -9 * sc, -58 * sc);
      s.lineTo(-9 * sc, 20 * sc);
      s.quadraticCurveTo(-8.5 * sc, 46 * sc, 0, 78 * sc);
      return s;
    }
    extrudePlan(ship, hullShape(1.04), 1.3, 0, 0.1, 0, M.shipRed, { soft: true });   // red waterline band
    extrudePlan(ship, hullShape(1.0), 7.5, 0, 1.3, 0, M.white, {});                  // hull
    extrudePlan(ship, hullShape(0.82), 4.2, 0, 8.8, 0, M.white, {});                 // deck 1
    extrudePlan(ship, hullShape(0.6), 3.8, 0, 13.0, 0, M.white, { soft: true });     // deck 2
    box(ship, 12, 3.6, 22, 0, 16.8, -18, M.white, { soft: true });                   // bridge block
    var funnel = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, 7, 10), M.white);
    funnel.position.set(0, 20, -34); funnel.castShadow = true; ship.add(funnel); addEdges(funnel, true);
    var fband = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 1.6, 10), M.shipRed);
    fband.position.set(0, 23.6, -34); ship.add(fband);
    [26, -52].forEach(function (mz) {
      var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 16, 6), M.white);
      mast.position.set(0, 18, mz); ship.add(mast);
      var flag = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 3), lam(0xd6604f));
      flag.position.set(0.9, 26.5, mz); flag.rotation.z = -Math.PI / 2; ship.add(flag);
    });
    ship.rotation.y = Math.PI + 0.3;
    ship.position.set(0, 0, 4);
    P.add(ship);
    // shell stage canopy west of the bow
    var shell = new THREE.Mesh(new THREE.SphereGeometry(11, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.white);
    shell.scale.set(1.5, 0.55, 1);
    shell.position.set(-58, 0.2, 42); shell.rotation.y = 0.5; shell.castShadow = true;
    P.add(shell);
    // surrounding Sea World blocks (east curved mall as 3 offset segments, south + west rows)
    box(P, 56, 18, 22, 96, 0, -32, M.white2, { rotY: -0.45 });
    box(P, 58, 22, 24, 110, 0, 26, M.white2, { rotY: -0.12 });
    box(P, 50, 16, 22, 96, 0, 78, M.white2, { rotY: 0.25 });
    box(P, 60, 16, 24, -60, 0, 96, M.white2, { rotY: 0.06 });
    box(P, 42, 13, 22, -128, 0, 74, M.white2, { rotY: 0.2 });
    box(P, 50, 20, 26, -122, 0, -44, M.white2, { soft: true });
    box(P, 44, 15, 24, -116, 0, 12, M.white2, { soft: true });
    // red-roofed round pavilion
    var pav = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 6, 8), M.white);
    pav.position.set(-88, 3, -78); pav.castShadow = true; P.add(pav); addEdges(pav);
    var pRoof = new THREE.Mesh(new THREE.ConeGeometry(8.6, 4.2, 8), M.roofRed);
    pRoof.position.set(-88, 8.1, -78); pRoof.castShadow = true; P.add(pRoof); addEdges(pRoof);
    // plaza trees + planters
    for (var i = 0; i < 26; i++) {
      var a = rnd() * Math.PI * 2, r = 62 + rnd() * 52;
      var tx = Math.cos(a) * r, tz = 6 + Math.sin(a) * r * 0.8;
      if (tx > -46 && tx < 46 && tz > -66 && tz < 76) continue;
      tree(P, tx, tz, 0.7 + rnd() * 0.4, rnd() > 0.5);
    }
    [[-58, -66, 30, 4], [56, -60, 26, 4], [-64, 60, 26, 4], [58, 56, 30, 4]].forEach(function (p) {
      plate(P, p[2], p[3], p[0], 0.35, p[1], M.green2, { t: 0.45, edges: true, soft: true });
    });
    [[70, -34, 0xffffff], [76, -26, 0xd6604f], [-76, -20, 0xffffff], [-70, 36, 0xf0e6d4]].forEach(function (p) {
      parasol(P, p[0], p[1], p[2]);
    });
    // ∞ observation loop (NE landmark)
    var t1 = new THREE.Mesh(new THREE.TorusGeometry(15, 1.1, 6, 28), M.white);
    t1.rotation.x = -Math.PI / 2; t1.position.set(128, 9, -92); P.add(t1);
    var t2 = new THREE.Mesh(new THREE.TorusGeometry(11, 1.0, 6, 24), M.white);
    t2.rotation.x = -Math.PI / 2; t2.position.set(150, 12, -104); P.add(t2);
    [[118, -84], [140, -98], [156, -110]].forEach(function (p) {
      var col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 10, 6), M.white);
      col.position.set(p[0], 5, p[1]); P.add(col);
    });
  })();

  // ================================================================
  // EAST: green-plate park + flower ribbon + heritage pavilions
  // ================================================================
  var P2 = new THREE.Group(); S.add(P2);
  [[64, 54, 130, -26, 2.6, 0.028, 0.015, M.green],
   [58, 48, 152, 26, 1.9, -0.02, 0.022, M.green2],
   [70, 44, 128, 62, 1.2, 0.018, 0.02, M.green],
   [52, 40, 186, 66, 0.8, -0.014, 0.016, M.green2],
   [60, 38, 208, 12, 1.4, 0.02, 0.012, M.green],
   [46, 34, 236, 52, 0.5, 0, 0.018, M.green2]]
    .forEach(function (p) {
      plate(P2, p[0], p[1], p[2], p[4], p[3], p[7], { t: 0.6, edges: true, cast: true, rotZ: p[5], rotX: p[6] });
    });
  for (var i = 0; i < 46; i++) {
    var px = 104 + rnd() * 155, pz = -44 + rnd() * 135;
    tree(P2, px, pz, 0.8 + rnd() * 0.7, rnd() > 0.6);
  }
  // winding flower ribbon (red-orange, per satellite)
  (function () {
    var pts = [[108, 84], [126, 66], [148, 54], [168, 60], [186, 76], [206, 84], [228, 74]];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var dx = b[0] - a[0], dz = b[1] - a[1];
      var len = Math.sqrt(dx * dx + dz * dz), ang = Math.atan2(dx, dz);
      plate(P2, 5.5, len + 3, (a[0] + b[0]) / 2, 3.0, (a[1] + b[1]) / 2,
        i % 2 ? lam(COL.flower1) : lam(COL.flower2),
        { t: 0.5, edges: true, soft: true, cast: true, rotY: ang });
    }
  })();
  // 女娲补天 statue on the waterfront corner of the park
  (function () {
    var N = new THREE.Group(); N.position.set(246, 2.2, 84); N.rotation.y = 0.35; P2.add(N);
    var plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 1.4, 8), M.pave);
    plinth.position.y = 0.7; plinth.castShadow = true; N.add(plinth); addEdges(plinth, true);
    var skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 2.5, 6.5, 7), M.steel);
    skirt.position.y = 4.6; skirt.castShadow = true; N.add(skirt); addEdges(skirt, true);
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.95, 3.2, 6), M.steel);
    torso.position.set(0.1, 9.2, 0); torso.rotation.z = -0.12; torso.castShadow = true; N.add(torso); addEdges(torso, true);
    var head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), M.steel);
    head.position.set(0.22, 11.3, 0); head.castShadow = true; N.add(head); addEdges(head, true);
    var armUp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.4, 0.34), M.steel);
    armUp.position.set(1.05, 12.0, 0); armUp.rotation.z = -0.5; armUp.castShadow = true; N.add(armUp); addEdges(armUp, true);
    var armSide = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 0.3), M.steel);
    armSide.position.set(-0.85, 9.9, 0); armSide.rotation.z = 0.9; armSide.castShadow = true; N.add(armSide); addEdges(armSide, true);
    var stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), M.coral);
    stone.position.set(1.95, 13.9, 0); stone.rotation.set(0.4, 0.8, 0.2); stone.castShadow = true; N.add(stone); addEdges(stone);
  })();

  // heritage pavilion cluster (dark pitched roofs, NE of park)
  (function () {
    [[168, -52, 20, 12, 0.15], [196, -38, 16, 11, -0.2], [222, -58, 18, 12, 0.05], [248, -30, 15, 10, 0.3], [204, -80, 22, 13, -0.1]]
      .forEach(function (p) {
        var g = new THREE.Group(); g.position.set(p[0], 0, p[1]); g.rotation.y = p[4]; P2.add(g);
        box(g, p[2], 4.6, p[3], 0, 0, 0, M.white2, { soft: true });
        wedge(g, p[2] + 1.6, (p[3] + 1.6) / 2, 0.3, 2.4, 'z', 0, 4.6, -(p[3] + 1.6) / 4, M.darkRoof, { soft: true });
        wedge(g, p[2] + 1.6, (p[3] + 1.6) / 2, 2.4, 0.3, 'z', 0, 4.6, (p[3] + 1.6) / 4, M.darkRoof, { soft: true });
      });
  })();

  // WEST: terraced Sea World A-block
  (function () {
    var T = new THREE.Group(); T.position.set(-265, 0, -20); S.add(T);
    box(T, 70, 6, 46, 0, 0, 0, M.white2, { soft: true });
    box(T, 70, 6, 34, 0, 6, -6, M.white2, { soft: true });
    box(T, 70, 6, 22, 0, 12, -12, M.white2, { soft: true });
    plate(T, 66, 8, 0, 6.3, 14, M.green2, { t: 0.4, edges: true, soft: true });
    plate(T, 66, 8, 0, 12.3, 2, M.green, { t: 0.4, edges: true, soft: true });
  })();

  // ================================================================
  // 太子湾 coastal strip — the real coast runs continuously from the
  // promenade down to Prince Bay; K11 sits on the mainland, not an island
  // ================================================================
  (function () {
    var CS = new THREE.Group(); S.add(CS);
    plate(CS, 560, 296, -430, 0.02, 292, M.pave, { t: 0.1 });
    joints(CS, -700, -160, 150, 432, 14, 0.12);
    plate(CS, 12, 292, -648, 0.06, 292, M.road, { t: 0.12 });          // coast road to Prince Bay
    (function () {
      var segs = []; for (var z = 160; z < 424; z += 15) { segs.push([-648, 0.2, z, -648, 0.2, z + 6]); }
      lines(CS, segs, whiteLine);
    })();
    plate(CS, 190, 64, -300, 0.32, 210, M.green2, { t: 0.5, edges: true, soft: true });
    plate(CS, 130, 50, -480, 0.3, 330, M.green, { t: 0.5, edges: true, soft: true });
    plate(CS, 90, 40, -230, 0.3, 350, M.green2, { t: 0.5, edges: true, soft: true });
    for (var i = 0; i < 16; i++) { tree(CS, -660 + rnd() * 470, 165 + rnd() * 250, 0.8 + rnd() * 0.5, rnd() > 0.5); }
    for (var zp = 170; zp <= 420; zp += 42) { palm(CS, -172, zp, 0.9 + rnd() * 0.2); }
    lines(CS, [[-160, 0.3, 148, -160, 0.3, 434]], edgeMat);            // shore edge facing the marina bay
  })();

  // ================================================================
  // 太子湾 K11 ECOAST — on the mainland coast at the end of the strip
  // ================================================================
  (function () {
    var K = new THREE.Group(); K.position.set(-370, 0, 650); S.add(K);
    plate(K, 520, 330, 0, 0.02, -45, M.pave, { t: 0.1 });
    joints(K, -250, 250, -200, 110, 14, 0.12);
    // K11 ECOAST mall — long terraced hull with a drum prow and the white dome (per aerial photos)
    extrudePlan(K, roundedRect(300, 92, 24), 11, 20, 0, -40, M.warm, {});
    extrudePlan(K, roundedRect(250, 74, 20), 10, 6, 11, -46, M.white, {});
    extrudePlan(K, roundedRect(190, 56, 16), 9.5, -6, 21, -52, M.warm, {});
    (function () {
      var drum = new THREE.Mesh(new THREE.CylinderGeometry(40, 42, 34, 22), M.white);
      drum.position.set(-128, 17, -36); drum.castShadow = true; drum.receiveShadow = true;
      K.add(drum); addEdges(drum, true);
      var dome = new THREE.Mesh(new THREE.IcosahedronGeometry(15, 1), M.white);
      dome.position.set(-128, 40, -36); dome.castShadow = true;
      K.add(dome); addEdges(dome);
    })();
    box(K, 280, 5, 1.2, 10, 0.8, 6.4, M.glassSea, { noShadow: true });
    (function () { // storefront mullions
      var segs = []; for (var x = -120; x <= 140; x += 13) { segs.push([x, 1, 7.1, x, 5.6, 7.1]); }
      lines(K, segs);
    })();
    plate(K, 180, 6, 24, 11.3, -2, M.green2, { t: 0.4, edges: true, soft: true });
    plate(K, 130, 5, 2, 21.3, -22, M.green, { t: 0.4, edges: true, soft: true });
    plate(K, 110, 28, -2, 30.8, -52, M.green2, { t: 0.4, edges: true, soft: true });   // big roof garden
    [[30, -50], [-24, -56], [12, -44]].forEach(function (p) { var t = liveTree(K, p[0], p[1], 0.5, true, 30.7); });
    // K11 HACC — beige stone, sharp geometric, standalone on the waterfront
    box(K, 40, 16, 26, 150, 0, 40, M.tan, {});
    wedge(K, 40, 13, 4.2, 0.4, 'z', 150, 16, 33.5, M.tan, { soft: true });
    // red faceted ferry terminal + piers (Prince Bay cruise home port precinct)
    box(K, 30, 11, 22, -212, 0, 66, M.coral, {});
    wedge(K, 32, 24, 6, 0.5, 'x', -212, 11, 66, M.coral, { soft: true });
    plate(K, 4, 56, -228, -1.9, 128, M.pave, { t: 0.6, edges: true, soft: true });
    plate(K, 4, 48, -192, -1.9, 124, M.pave, { t: 0.6, edges: true, soft: true });
    box(K, 22, 5, 7, -228, -2.2, 148, M.white, { soft: true });
    box(K, 18, 4.5, 6.5, -192, -2.2, 140, M.white, { soft: true });
    // green headland park at the peninsula tip (winding paths + waterside amphitheater)
    (function () {
      var head = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.6, 26), M.green2);
      head.scale.set(85, 1, 64);
      head.position.set(-70, -1.2, 152);
      head.receiveShadow = true; K.add(head);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 4, 40), new THREE.MeshBasicMaterial({ color: COL.line, transparent: true, opacity: 0.5 }));
      rim.scale.set(85, 64, 1); rim.rotation.set(-Math.PI / 2, 0, 0);
      rim.position.set(-70, 0.25, 152);
      K.add(rim);
      [[0.9, 0.5], [0.55, 2.2], [0.72, 4.1]].forEach(function (a) {
        var path = new THREE.Mesh(new THREE.TorusGeometry(1, 0.018, 4, 24, 1.9), lam(0xffffff));
        path.scale.set(85 * a[0], 64 * a[0], 1);
        path.rotation.set(-Math.PI / 2, 0, a[1]);
        path.position.set(-70, 0.32, 152);
        K.add(path);
      });
      for (var i = 0; i < 4; i++) {   // waterside amphitheater rings
        var amp = new THREE.Mesh(new THREE.TorusGeometry(10 + i * 4, 1.3, 4, 22, 2.4), M.pave);
        amp.rotation.set(-Math.PI / 2, 0, 2.4);
        amp.position.set(-96, 0.3 + (3 - i) * 0.12, 196);
        amp.receiveShadow = true; K.add(amp);
      }
      [[-40, 130], [-96, 140], [-56, 178], [-16, 166], [-84, 108]].forEach(function (p) {
        tree(K, p[0], p[1], 0.75 + rnd() * 0.3, rnd() > 0.5);
      });
    })();
    // coral public-art blobs + plaza planting (K11 signature)
    (function () {
      var art = new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 0), M.coral);
      art.position.set(96, 4.4, 42); art.rotation.set(0.4, 0.9, 0.2); art.castShadow = true;
      K.add(art); addEdges(art);
      var art2 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), M.coral);
      art2.position.set(-150, 2.3, 52); art2.rotation.set(0.8, 0.2, 0.5); art2.castShadow = true;
      K.add(art2); addEdges(art2);
    })();
    [[-120, 40, 34, 7], [40, 52, 40, 7], [98, 64, 26, 6], [-176, 30, 22, 6]].forEach(function (p) {
      plate(K, p[2], p[3], p[0], 0.4, p[1], M.green2, { t: 0.5, edges: true, soft: true, cast: true });
    });
    [[-118, 34], [-104, 44], [46, 46], [30, 56], [104, 60], [-174, 26], [64, 50]].forEach(function (p) {
      palm(K, p[0], p[1], 0.85 + rnd() * 0.2);
    });
    // seaside boardwalk with palms
    plate(K, 500, 16, 0, 0.05, 100, M.board, { t: 0.3, edges: true, soft: true });
    for (var bx = -230; bx <= 230; bx += 42) { palm(K, bx + (rnd() - 0.5) * 8, 90, 0.9 + rnd() * 0.25); }
    lines(K, [[-250, 0.9, 108, 250, 0.9, 108]], edgeMatSoft);
    // cruise terminal with wave roof + berthed cruise ship (Prince Bay cruise home port)
    (function () {
      var T2 = new THREE.Group(); T2.position.set(-140, 0, 86); K.add(T2);
      box(T2, 170, 13, 44, 0, 0, 0, M.white2, {});
      for (var i = 0; i < 5; i++) {
        wedge(T2, 34, 44, 0.4, 4.2, 'x', -68 + i * 34, 13, 0, M.wedge, { soft: true, rotY: i % 2 ? Math.PI : 0 });
      }
      plate(T2, 250, 10, 10, -1.9, 40, M.pave, { t: 0.6, edges: true, soft: true });   // berth quay
      var cs = new THREE.Group();
      box(cs, 250, 16, 30, 0, 0.5, 0, M.white);
      box(cs, 200, 12, 26, -8, 16.5, 0, M.white);
      box(cs, 120, 9, 22, -16, 28.5, 0, M.white);
      box(cs, 16, 10, 8, 60, 28.5, 0, M.white, { soft: true });
      lines(cs, [[100, 8, 0, 128, 2, 0]], edgeMat);
      cs.position.set(20, -2.6, 64); cs.rotation.y = 0.06;
      T2.add(cs);
    })();
    // Prince Bay towers behind the mall
    [[-60, -180, 34, 34, 205], [30, -195, 30, 30, 165], [-150, -170, 30, 30, 128], [120, -175, 28, 28, 96]]
      .forEach(function (b) { box(K, b[2], b[4], b[3], b[0], 0, b[1], M.white2, { soft: true }); });
  })();

  // ================================================================
  // 蛇口渔港 fishing port (harbor basin east) + 渔人码头
  // ================================================================
  (function () {
    var F = new THREE.Group(); F.position.set(800, 0, -280); S.add(F);
    plate(F, 320, 240, 0, -2.85, 0, lam(COL.water), { t: 0.1 });        // basin
    plate(F, 200, 290, 0, -2.85, 260, lam(COL.water), { t: 0.1 });      // channel to the bay
    lines(F, [[-160, -2.3, -120, -160, -2.3, 120], [-160, -2.3, 120, -100, -2.3, 405],
      [160, -2.3, -120, 160, -2.3, 120], [160, -2.3, 120, 100, -2.3, 405], [-160, -2.3, -120, 160, -2.3, -120]], edgeMatSoft);
    // moored fishing boats (instanced)
    (function () {
      var g = new THREE.BoxGeometry(2.2, 1.4, 6.5);
      var inst = new THREE.InstancedMesh(g, lam(0xf6f4ee), 16);
      var mtx = new THREE.Matrix4();
      for (var i = 0; i < 16; i++) {
        mtx.makeRotationY((rnd() - 0.5) * 0.5);
        mtx.setPosition(-130 + rnd() * 260, -2.2, -95 + rnd() * 180);
        inst.setMatrixAt(i, mtx);
      }
      F.add(inst);
    })();
    // quay sheds + 渔人码头 boardwalk (west quay)
    box(F, 14, 6, 52, -185, 0, -60, M.white2, { soft: true });
    wedge(F, 15, 26, 0.3, 2.2, 'z', -185, 6, -73, M.darkRoof, { soft: true });
    wedge(F, 15, 26, 2.2, 0.3, 'z', -185, 6, -47, M.darkRoof, { soft: true });
    box(F, 14, 6, 40, -185, 0, 30, M.white2, { soft: true });
    plate(F, 10, 200, -168, 0.1, -10, M.board, { t: 0.3, edges: true, soft: true });
    for (var i = 0; i < 5; i++) { tree(F, -190 - rnd() * 20, -110 + i * 48, 0.7); }
    // east breakwater arm
    box(F, 8, 2.4, 200, 170, -2.8, 30, M.pave, { soft: true });
    box(F, 60, 2.4, 8, 140, -2.8, 126, M.pave, { soft: true });
  })();

  // ================================================================
  // 南海意库 Nanhai E-Cool — six converted factory slabs with planted facades
  // ================================================================
  (function () {
    var E = new THREE.Group(); E.position.set(350, 0, -760); S.add(E);   // 工业三路 × 太子路 (per address record)
    plate(E, 260, 170, 0, 0.02, 0, M.pave, { t: 0.1 });
    joints(E, -125, 125, -80, 80, 12, 0.14);
    (function () {   // central landscape pond (3号楼 eco-retrofit showcase)
      var pond = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 22), M.pool);
      pond.scale.set(15, 1, 10);
      pond.position.set(-2, 0.16, 46);
      pond.receiveShadow = true; E.add(pond);
    })();
    for (var i = 0; i < 6; i++) {
      var bx = -95 + i * 38;
      box(E, 26, 21, 66, bx, 0, -6, M.white2, {});
      for (var j = 0; j < 3; j++) {   // planted facade stripes
        box(E, 0.9, 18.5, 8, bx - 13.6, 1.2, -32 + j * 22, M.green2, { soft: true, noShadow: true });
        box(E, 0.9, 18.5, 8, bx + 13.6, 1.2, -24 + j * 22, M.green, { soft: true, noShadow: true });
      }
      (function (bx) {   // banded windows
        var segs = []; for (var k = 1; k <= 4; k++) { var y = k * 4.2; segs.push([bx - 13.05, y, -36, bx - 13.05, y, 24]); segs.push([bx + 13.05, y, -36, bx + 13.05, y, 24]); }
        lines(E, segs, mullionMat);
      })(bx);
      box(E, 11, 3.6, 15, bx + (i % 2 ? 4 : -4), 21, -18 + (i % 3) * 12, M.white, { soft: true });
      tree(E, bx + 19, 44 - (i % 2) * 14, 0.75, i % 2 === 0);
      if (i === 2) {   // 3号楼: added glass curtain + roof greening (eco retrofit)
        box(E, 26.5, 18.5, 1.1, bx, 1.2, 27.6, M.glassSea, { noShadow: true });
        plate(E, 24, 14, bx, 21.3, -12, M.green, { t: 0.4, edges: true, soft: true });
      }
      if (i < 5) {   // link bridges between slabs
        box(E, 14, 2.6, 4.5, bx + 19, 11.5, -26 + (i % 2) * 26, M.white, { soft: true });
        plate(E, 8, 26, bx + 19, 0.3, -2 + (i % 2) * 16, i % 2 ? M.green2 : M.green, { t: 0.45, edges: true, soft: true });
      }
    }
    box(E, 7, 3.2, 0.9, -60, 0, 62.5, M.coral, { soft: true });   // meC sign block at the entry
    tree(E, -20, 62, 0.9); tree(E, 40, 60, 0.8, true);
  })();

  // ================================================================
  // 蛇口老街 Shekou Old Town — fine-grain urban village + market street
  // ================================================================
  (function () {
    var O = new THREE.Group(); O.position.set(1150, 0, -1150); S.add(O);
    plate(O, 470, 390, 0, 0.01, 0, lam(0xefede6), { t: 0.08 });
    var tones = [M.cream, M.tan, M.tan2, M.white2];
    for (var gx = -5; gx <= 5; gx++) {
      for (var gz = -4; gz <= 4; gz++) {
        if (gz === 0) continue;                                   // main street
        if (gx >= -1 && gx <= 1 && gz === 1) continue;            // market square
        var cx = gx * 38 + (rnd() - 0.5) * 6, cz = gz * 38 + (rnd() - 0.5) * 6;
        var street = Math.abs(gz) === 1;                          // cells fronting the main street
        var n = 2 + Math.floor(rnd() * 2);
        for (var k = 0; k < n; k++) {
          var w = 13 + rnd() * 9, d = 13 + rnd() * 9, h = 10 + rnd() * 15;
          var ox = cx + (k - (n - 1) / 2) * (w * 0.85) + (rnd() - 0.5) * 4;
          var oz = street ? (gz > 0 ? 1 : -1) * (11.5 + d / 2) : cz + (rnd() - 0.5) * 10;
          box(O, w, h, d, ox, 0, oz, tones[Math.floor(rnd() * 4)], { soft: true, edges: rnd() < 0.5, noShadow: rnd() < 0.5 });
          if (rnd() < 0.3) wedge(O, w + 1, (d + 1) / 2, 0.2, 1.8, 'z', ox, h, oz - (d + 1) / 4, M.darkRoof, { soft: true });
        }
      }
    }
    // main pedestrian street with awnings, lanterns, trees
    plate(O, 470, 15, 0, 0.05, 0, M.walk, { t: 0.1 });
    for (var ax = -200; ax <= 200; ax += 34) {
      box(O, 13, 0.5, 2.6, ax, 4.2, -9.6, lam(0xc85548), { soft: true, noShadow: true });
      box(O, 13, 0.5, 2.6, ax + 17, 4.2, 9.6, lam(0xc85548), { soft: true, noShadow: true });
    }
    (function () {   // lantern strings
      var lg = new THREE.SphereGeometry(0.5, 6, 5);
      var inst = new THREE.InstancedMesh(lg, lam(0xd6473c), 30);
      var mtx = new THREE.Matrix4();
      for (var i = 0; i < 30; i++) {
        mtx.makeTranslation(-210 + i * 14.5, 5.6 + Math.sin(i * 1.7) * 0.4, (i % 2 ? 3 : -3));
        inst.setMatrixAt(i, mtx);
      }
      O.add(inst);
    })();
    for (var tx = -180; tx <= 180; tx += 60) { tree(O, tx + (rnd() - 0.5) * 10, (rnd() > 0.5 ? 13 : -13), 0.6 + rnd() * 0.3); }
    // market hall on the square + gate arch at the west entrance
    box(O, 36, 8, 22, 10, 0, 44, M.tan, {});
    wedge(O, 38, 12, 0.3, 3.4, 'z', 10, 8, 38, M.roofRed, { soft: true });
    wedge(O, 38, 12, 3.4, 0.3, 'z', 10, 8, 50, M.roofRed, { soft: true });
    (function () {
      var G = new THREE.Group(); G.position.set(-238, 0, 0); O.add(G);
      box(G, 1.6, 8.5, 1.6, 0, 0, -6, M.roofRed, {});
      box(G, 1.6, 8.5, 1.6, 0, 0, 6, M.roofRed, {});
      box(G, 2.2, 1.4, 16, 0, 8.5, 0, M.roofRed, {});
      wedge(G, 4, 9, 0.2, 1.6, 'z', 0, 9.9, -2.25, M.darkRoof, { soft: true });
      wedge(G, 4, 9, 1.6, 0.2, 'z', 0, 9.9, 2.25, M.darkRoof, { soft: true });
    })();
  })();

  // 微波山 knoll (the little hill with the Sea World sign) + connective avenue and filler blocks
  (function () {
    [[-340, -530, 120, 52], [-290, -470, 90, 38], [-400, -580, 100, 42]].forEach(function (p) {
      var m = new THREE.Mesh(new THREE.ConeGeometry(p[2], p[3], 8, 1), M.knoll);
      m.position.set(p[0], p[3] / 2 - 1, p[1]); m.rotation.y = rnd() * 3; m.castShadow = true;
      S.add(m);
    });
    [[-300, -460], [-360, -500], [-260, -500]].forEach(function (p) { tree(S, p[0], p[1], 1.1, true); });
    for (var i = 0; i < 22; i++) { tree(S, 430 + rnd() * 620, -450 - rnd() * 640, 0.8 + rnd() * 0.5, rnd() > 0.5); }
  })();

  // ================================================================
  // REAL CITY FABRIC from OpenStreetMap (buildings + roads, merged geometry)
  // ================================================================
  var osmMats = {
    near: lam(0xf6f5f0),
    far:  lam(0xf0f0eb),
    road: lam(0xe9e9e3)
  };
  (function () {
    if (typeof OSM === 'undefined' || !window.THREE.BufferGeometryUtils) return;
    var merge = function (arr, groups) { return THREE.BufferGeometryUtils.mergeBufferGeometries(arr, groups); };
    var extraKO = [
      [-210, -30, -700, -540],    // twin towers
      [-60, 20, -585, -535]       // construction block
    ];
    var roadKO = extraKO.concat([
      [-115, 115, -85, 105], [-200, 90, -510, -265], [-145, 105, -220, -158],
      [-710, -145, 415, 890], [210, 510, -870, -650], [895, 1410, -1365, -945],
      [-165, 190, 395, 585], [615, 990, -425, -135], [-480, -200, -660, -415], [-310, -215, -55, 15]
    ]);
    var hills = [[-900, -1050, 760], [-1350, -900, 620], [-560, -1300, 560], [-1450, -1350, 640],
      [300, -1600, 520], [1500, -1500, 560], [-340, -530, 130], [-290, -470, 100], [-400, -580, 110]];
    function blocked(cx, cz) {
      if (cz > 150 && !(cx > -720 && cx < -150 && cz < 435)) return true;  // sea zone, except Prince Bay coast strip
      if (cz > -60 && cz < 150 && cx > -540 && cx < 990) return true;   // promenade / plaza / park / channel band
      for (var i = 0; i < extraKO.length; i++) {
        var k = extraKO[i];
        if (cx >= k[0] && cx <= k[1] && cz >= k[2] && cz <= k[3]) return true;
      }
      for (var j = 0; j < hills.length; j++) {
        var h = hills[j];
        if (Math.hypot(cx - h[0], cz - h[1]) < h[2] * 0.72) return true;
      }
      return false;
    }
    var nearG = [], farG = [];
    OSM.b.forEach(function (b) {
      var p = b.p, n = p.length / 2;
      var cx = 0, cz = 0;
      for (var i = 0; i < n; i++) { cx += p[2 * i]; cz += p[2 * i + 1]; }
      cx /= n; cz /= n;
      if (blocked(cx, cz)) return;
      try {
        var sh = new THREE.Shape();
        sh.moveTo(p[0], -p[1]);
        for (var k = 1; k < n; k++) sh.lineTo(p[2 * k], -p[2 * k + 1]);
        var g = new THREE.ExtrudeGeometry(sh, { depth: b.h, bevelEnabled: false });
        g.rotateX(-Math.PI / 2);
        (Math.hypot(cx, cz) < 700 ? nearG : farG).push(g);
      } catch (e) { /* skip degenerate footprint */ }
    });
    if (nearG.length) {
      var gm = merge(nearG, false);
      var m = new THREE.Mesh(gm, osmMats.near);
      m.castShadow = true; m.receiveShadow = true;
      S.add(m);
      var el = new THREE.LineSegments(new THREE.EdgesGeometry(gm, 32), edgeMatSoft);
      S.add(el);
    }
    if (farG.length) {
      var gf = merge(farG, false);
      var mf = new THREE.Mesh(gf, osmMats.far);
      mf.receiveShadow = true;
      S.add(mf);
    }
    // roads as flat ribbons (skip our stylized corridors)
    var roadG = [];
    var mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    OSM.r.forEach(function (r) {
      var p = r.p;
      for (var i = 0; i + 3 < p.length; i += 2) {
        var x1 = p[i], z1 = p[i + 1], x2 = p[i + 2], z2 = p[i + 3];
        var mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
        if (mz > 150 && !(mx > -720 && mx < -150 && mz < 435)) continue; // sea zone, except Prince Bay coast strip
        if (mz > -100 && mz < 150 && mx > -540 && mx < 640) continue;    // our Wanghai Rd + promenade band
        var kk = false;
        for (var j = 0; j < roadKO.length; j++) {
          var k2 = roadKO[j];
          if (mx >= k2[0] && mx <= k2[1] && mz >= k2[2] && mz <= k2[3]) { kk = true; break; }
        }
        if (kk) continue;
        var len = Math.hypot(x2 - x1, z2 - z1);
        if (len < 4) continue;
        var g2 = new THREE.BoxGeometry(r.w, 0.09, len + r.w * 0.6);
        q.setFromAxisAngle(up, Math.atan2(x2 - x1, z2 - z1));
        mtx.compose(new THREE.Vector3(mx, 0.045, mz), q, new THREE.Vector3(1, 1, 1));
        g2.applyMatrix4(mtx);
        roadG.push(g2);
      }
    });
    if (roadG.length) {
      var gr = merge(roadG, false);
      var mr = new THREE.Mesh(gr, osmMats.road);
      mr.receiveShadow = true;
      S.add(mr);
    }
  })();

  // ================================================================
  // PEOPLE (instanced) — promenade, steps, plazas, roof, ship plaza
  // ================================================================
  (function () {
    var spots = [];
    function scatter(n, x0, x1, z0, z1, y) {
      for (var i = 0; i < n; i++) spots.push([x0 + rnd() * (x1 - x0), y, z0 + rnd() * (z1 - z0)]);
    }
    scatter(26, -260, 240, 70, 92, 0.15);          // promenade
    scatter(8, -240, 100, 104, 110, 0.15);         // walk
    for (var i = 0; i < 10; i++) {                 // on the steps
      var st = Math.floor(rnd() * 5);
      spots.push([-260 + rnd() * 380, -0.58 * (st + 1) + 0.15, 112 + st * 3 + 1.2]);
    }
    scatter(7, -250, 130, 128, 137, -2.4);         // boardwalk
    scatter(6, 180, 300, 118, 136, -1.0);          // beach
    scatter(10, -30, 46, -60, -40, 0.15);          // north entry
    scatter(8, -70, 70, -40, 40, 17.0);            // roof garden
    scatter(14, -150, 30, -320, -260, 0.15);       // ship plaza south
    scatter(8, -120, -20, -470, -420, 0.15);       // ship plaza north
    scatter(6, 120, 240, 20, 80, 2.8);             // green park
    scatter(6, -152, -110, 82, 94, 0.15);          // COMMUNE terrace
    scatter(12, -640, -220, 700, 736, 0.15);       // K11 boardwalk
    scatter(6, -540, -340, 600, 660, 0.15);        // K11 plaza
    scatter(7, 270, 430, -810, -710, 0.15);        // 南海意库 courtyards
    scatter(12, 960, 1330, -1162, -1140, 0.12);    // 老街 main street
    scatter(4, 620, 650, -370, -200, 0.15);        // 渔人码头
    var bodyG = new THREE.CylinderGeometry(0.17, 0.21, 1.15, 6);
    var headG = new THREE.SphereGeometry(0.16, 8, 6);
    // strolling pedestrians ping-pong along paths (updated each frame)
    var walkerDefs = [
      { x0: -240, x1: 240, z: 84, y: 0.15, v: 1.3, ph: 0 }, { x0: -180, x1: 200, z: 88, y: 0.15, v: 1.1, ph: 120 },
      { x0: -120, x1: 240, z: 80, y: 0.15, v: 1.5, ph: 260, }, { x0: -220, x1: 60, z: 106, y: 0.15, v: 1.2, ph: 40 },
      { x0: -60, x1: 200, z: 104, y: 0.15, v: 1.4, ph: 300 },
      { x0: -600, x1: -270, z: 720, y: 0.15, v: 1.2, ph: 60 }, { x0: -560, x1: -220, z: 726, y: 0.15, v: 1.0, ph: 200 },
      { x0: -180, x1: 60, z: -300, y: 0.15, v: 1.3, ph: 90 }, { x0: -140, x1: 30, z: -322, y: 0.15, v: 1.1, ph: 210 },
      { x0: 960, x1: 1330, z: -1150, y: 0.12, v: 1.2, ph: 30 }, { x0: 1000, x1: 1300, z: -1146, y: 0.12, v: 1.4, ph: 400 },
      { x0: 260, x1: 440, z: -700, y: 0.15, v: 1.1, ph: 150 },
      { x0: -70, x1: -42, z: 40, y: 17.0, v: 0.8, ph: 0 }, { x0: -70, x1: 30, z: -46, y: 17.0, v: 0.9, ph: 90 }
    ];
    var total = spots.length + walkerDefs.length;
    var bodyM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var headM = new THREE.MeshLambertMaterial({ color: 0xf2ede4 });
    CLIPMATS.push(bodyM, headM);
    var bodyI = new THREE.InstancedMesh(bodyG, bodyM, total);
    var headI = new THREE.InstancedMesh(headG, headM, total);
    var mtx = new THREE.Matrix4();
    var accents = [0xd6604f, 0x6f8fb5, 0xe8b64c, 0x7fb069];
    var cw = new THREE.Color(0xf2f1ec);
    spots.forEach(function (p, i) {
      var s = 0.9 + rnd() * 0.25;
      mtx.makeScale(s, s, s);
      mtx.setPosition(p[0], p[1] + 0.58 * s, p[2]);
      bodyI.setMatrixAt(i, mtx);
      mtx.setPosition(p[0], p[1] + 1.32 * s, p[2]);
      headI.setMatrixAt(i, mtx);
      bodyI.setColorAt(i, rnd() < 0.22 ? new THREE.Color(accents[Math.floor(rnd() * accents.length)]) : cw);
    });
    walkerDefs.forEach(function (d, k) {
      d.s = 0.92 + rnd() * 0.2;
      var L0 = d.x1 - d.x0;
      var m0 = d.ph % (2 * L0);
      var px0 = m0 < L0 ? d.x0 + m0 : d.x1 - (m0 - L0);
      mtx.makeScale(d.s, d.s, d.s);
      mtx.setPosition(px0, d.y + 0.58 * d.s, d.z);
      bodyI.setMatrixAt(spots.length + k, mtx);
      mtx.setPosition(px0, d.y + 1.32 * d.s, d.z);
      headI.setMatrixAt(spots.length + k, mtx);
      bodyI.setColorAt(spots.length + k, rnd() < 0.35 ? new THREE.Color(accents[Math.floor(rnd() * accents.length)]) : cw);
    });
    bodyI.instanceColor.needsUpdate = true;
    S.add(bodyI); S.add(headI);
    PEOPLE = { bodyI: bodyI, headI: headI, defs: walkerDefs, base: spots.length, mtx: new THREE.Matrix4() };
  })();
  var PEOPLE = PEOPLE || null;

  // ================================================================
  // CITY BACKDROP + MOUNTAINS
  // ================================================================
  // twin towers east of 微波山 (Sea World landmark high-rises) — the rest of the city comes from OSM
  box(S, 34, 195, 34, -160, 0, -635, M.white2, { soft: true });
  box(S, 30, 218, 30, -80, 0, -600, M.white2, { soft: true });
  box(S, 70, 38, 42, -20, 0, -545, M.white2, { soft: true, noShadow: true });

  function hill(x, z, r, h, tone) {
    var m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 1), tone);
    m.position.set(x, h / 2 - 2, z);
    m.rotation.y = rnd() * 3;
    S.add(m);
  }
  var haze = lam(0xebeee8);
  hill(-900, -1050, 760, 320, haze);     // 大南山 massif, NW (per satellite)
  hill(-1350, -900, 620, 260, haze);
  hill(-560, -1300, 560, 220, haze);
  hill(-1450, -1350, 640, 240, haze);
  hill(300, -1600, 520, 150, haze);      // far northern ridge
  hill(1500, -1500, 560, 170, haze);

  // ================================================================
  // CAMERA TOUR
  // ================================================================
  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 20;
  controls.maxDistance = 1600;
  controls.target.set(0, 16, 0);

  var SHOTS = [
    { name: '入海 · 总览',     dur: 11, pos: [[-560, 320, 700], [-170, 150, 330]], look: [[0, 0, 80], [-5, 18, 12]] },
    { name: '滨海阶梯',        dur: 11, pos: [[235, 11, 208], [-175, 15, 192]],   look: [[-60, 17, 36], [40, 19, 28]] },
    { name: '三向体量',        dur: 12, orbit: { c: [0, 12, 0], r: 250, h0: 90, h1: 130, a0: 120, a1: 15 } },
    { name: '剖切生长',        dur: 11, fx: 'section', pos: [[235, 90, 190], [180, 135, 235]], look: [[-20, 12, 0], [0, 16, 0]] },
    { name: '解构 · 山海城',   dur: 12, fx: 'explode', orbit: { c: [0, 30, -2], r: 235, h0: 100, h1: 125, a0: 62, a1: -14 } },
    { name: '面海环绕',        dur: 11, orbit: { c: [0, 16, 8], r: 178, h0: 58, h1: 38, a0: 205, a1: 128 } },
    { name: '明华轮 · 海上世界', dur: 12, pos: [[-10, 150, -60], [95, 40, -298]],  look: [[-60, 20, -380], [-75, 16, -390]] },
    { name: '太子湾 K11',      dur: 12, orbit: { c: [-370, 14, 630], r: 300, h0: 100, h1: 68, a0: 40, a1: 130 } },
    { name: '意库与老街',      dur: 13, pos: [[300, 170, -500], [700, 195, -1060]], look: [[360, 8, -756], [1080, 10, -1150]] },
    { name: '日照',            dur: 10, fx: 'sun', pos: [[280, 150, 320], [190, 125, 265]], look: [[0, 14, 10], [0, 16, 0]] },
    { name: '城市与山海',      dur: 12, pos: [[420, 210, -300], [610, 330, -460]], look: [[0, 20, -40], [-45, 24, -130]] }
  ];
  var LANDMARKS = [
    { id: 'swcac',    name: '文化艺术中心',   c: [0, 12, 10],       r: 235, h: 82,  spd: 0.055,
      en: 'SEA WORLD CULTURE & ARTS CENTER · 2017',
      desc: '槇文彦（Maki and Associates）在中国的首个作品。三个展亭分别望山、望海、望园，屋顶花园全天向公众开放，设计互联（与V&A合作）在此运营。' },
    { id: 'seaworld', name: '海上世界·明华轮', c: [-60, 8, -380],    r: 195, h: 62,  spd: 0.06,
      en: 'SEA WORLD PLAZA · MINGHUA',
      desc: '1962年下水的法国邮轮ANCERVILLE号，1973年购入更名"明华轮"，1983年起泊居蛇口，是海上世界广场的核心与蛇口最早的地标。' },
    { id: 'k11',      name: '太子湾 K11',     c: [-370, 10, 630],   r: 260, h: 84,  spd: 0.05,
      en: 'PRINCE BAY · K11 ECOAST · 2025',
      desc: 'K11集团打造的海滨文化商业区，层叠退台面向深圳湾，与太子湾邮轮母港相邻，是蛇口最新的滨海目的地。' },
    { id: 'ecool',    name: '南海意库',       c: [350, 8, -760],    r: 185, h: 68,  spd: 0.06,
      en: 'NANHAI E-COOL CREATIVE PARK',
      desc: '由1980年代三洋厂房改造的创意产业园，六栋厂房以绿植立面和连桥相接，是蛇口工业遗产更新的代表。' },
    { id: 'oldtown',  name: '蛇口老街',       c: [1150, 8, -1150],  r: 250, h: 90,  spd: 0.05,
      en: 'SHEKOU OLD TOWN',
      desc: '蛇口最早的渔村街市片区，市场、骑楼与市井烟火所在，与一街之隔的新城形成时代对照。' }
  ];
  var FADE = 0.55;
  var NIGHT_ON = false;
  var IS_MOBILE = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 900);
  var AO_ON = !IS_MOBILE;                // SSAO off on mobile; also auto-disabled if fps drops
  var mode = 'tour';                     // 'tour' | 'manual' | 'fly' | 'focus'
  var tour = { shot: 0, t: 0 };
  var fly = null, focus = null;
  var lookCur = new THREE.Vector3(0, 16, 0);

  function ease(t) { return t * t * (3 - 2 * t); }
  function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  // per-shot effects: section sweep / exploded axon / sun study
  function updateFX(fx, e) {
    if (fx === 'section') {
      secPlane.constant = e < 0.8 ? -130 + (e / 0.8) * 262 : 132 + ((e - 0.8) / 0.2) * 1900;
    } else {
      secPlane.constant = 1e6;
    }
    var k = fx === 'explode' ? ease(Math.min(e * 1.25, 1)) : 0;
    GT.position.y = k * 26; GH.position.y = k * 20; GR.position.y = k * 23; GS.position.y = k * 10;
    var lo = fx === 'explode' ? Math.max(0, Math.min((e - 0.3) / 0.25, 1)) : 0;
    for (var i = 0; i < LBLS.length; i++) {
      LBLS[i].sp.visible = LBLS[i].ln.visible = lo > 0.01;
      LBLS[i].sp.material.opacity = lo;
      LBLS[i].ln.material.opacity = lo * 0.7;
    }
    if (fx === 'sun') {
      var a = Math.PI * (0.12 + 0.76 * e);
      sun.position.set(700 * Math.cos(a), 520 * Math.sin(a) + 60, 250);
      sun.color.copy(noonCol);
    } else if (WX.on && WX.isDay && !NIGHT_ON) {
      // real Shenzhen sun: azimuth 0 = due south (+z), positive toward west (-x)
      var sp2 = shenzhenSun();
      var altC = Math.max(sp2.alt, 0.06);
      var ch = Math.cos(altC), sh = Math.sin(altC);
      sun.position.set(-700 * Math.sin(sp2.az) * ch, 700 * sh, 700 * Math.cos(sp2.az) * ch);
      var warm = Math.max(0, Math.min(1, 1 - (sp2.alt / (0.35))));   // warm up below ~20°
      sun.color.copy(noonCol).lerp(duskCol, warm * 0.85);
      hemi.color.setHex(0xffffff).lerp(duskCol, warm * 0.25);
    } else {
      sun.position.set(260, 430, 240);
      if (!NIGHT_ON) { sun.color.copy(noonCol); hemi.color.setHex(0xffffff); }
    }
    // the SSAO depth pre-pass ignores per-material clipping, so fall back to plain render while sectioning
    ssaoPass.output = (!AO_ON || fx === 'section') ? THREE.SSAOPass.OUTPUT.Beauty : THREE.SSAOPass.OUTPUT.Default;
  }

  function applyShot(dt) {
    var s = SHOTS[tour.shot];
    tour.t += dt;
    var t = Math.min(tour.t / s.dur, 1);
    var e = ease(t), p, lk;
    if (s.orbit) {
      var o = s.orbit;
      var a = (o.a0 + (o.a1 - o.a0) * e) * Math.PI / 180;
      var h = o.h0 + (o.h1 - o.h0) * e;
      p = [o.c[0] + o.r * Math.cos(a), h, o.c[2] + o.r * Math.sin(a)];
      lk = o.c;
    } else {
      p = lerp3(s.pos[0], s.pos[1], e);
      lk = lerp3(s.look[0], s.look[1], e);
    }
    camera.position.set(p[0], p[1], p[2]);
    lookCur.set(lk[0], lk[1], lk[2]);
    camera.lookAt(lookCur);
    controls.target.copy(lookCur);
    updateFX(s.fx || null, e);
    var rem = s.dur - tour.t;
    var f = 0;
    if (tour.t < FADE) f = 1 - tour.t / FADE;
    if (rem < FADE) f = 1 - rem / FADE;
    fadePass.uniforms.amount.value = Math.max(0, Math.min(1, f)) * 0.96;
    if (t >= 1) {
      tour.shot = (tour.shot + 1) % SHOTS.length;
      tour.t = 0;
      if (REC.on && tour.shot === 0) stopRecording();   // one full loop recorded
    }
    shotLabel();
  }

  // ---------- landmark fly-to & orbit ----------
  function selectLandmark(i) {
    if (WALK.on) exitWalk();
    var lm = LANDMARKS[i];
    var ang = Math.atan2(camera.position.z - lm.c[2], camera.position.x - lm.c[0]);
    fly = {
      p0: camera.position.clone(),
      l0: lookCur.clone(),
      p1: new THREE.Vector3(lm.c[0] + lm.r * Math.cos(ang), lm.h, lm.c[2] + lm.r * Math.sin(ang)),
      l1: new THREE.Vector3(lm.c[0], lm.c[1], lm.c[2]),
      t: 0, dur: 2.4, lm: lm, ang: ang, idx: i
    };
    mode = 'fly';
    fadePass.uniforms.amount.value = 0;
    btnPlay.textContent = '▶ 继续巡游';
    setChip(i);
    shotEl.textContent = lm.name;
    showCard(lm);
  }
  var cardEl = document.getElementById('lmcard');
  function showCard(lm) {
    if (!lm) { cardEl.classList.remove('show'); return; }
    cardEl.querySelector('.t').textContent = lm.name;
    cardEl.querySelector('.s').textContent = lm.en;
    cardEl.querySelector('.d').textContent = lm.desc;
    cardEl.classList.add('show');
  }
  function stepFly(dt) {
    fly.t += dt;
    var e = ease(Math.min(fly.t / fly.dur, 1));
    camera.position.lerpVectors(fly.p0, fly.p1, e);
    lookCur.lerpVectors(fly.l0, fly.l1, e);
    camera.lookAt(lookCur);
    controls.target.copy(lookCur);
    if (fly.t >= fly.dur) {
      focus = { lm: fly.lm, ang: fly.ang, idx: fly.idx };
      mode = 'focus';
    }
  }
  function stepFocus(dt) {
    var lm = focus.lm;
    focus.ang += lm.spd * dt;
    camera.position.set(lm.c[0] + lm.r * Math.cos(focus.ang), lm.h, lm.c[2] + lm.r * Math.sin(focus.ang));
    lookCur.set(lm.c[0], lm.c[1], lm.c[2]);
    camera.lookAt(lookCur);
    controls.target.copy(lookCur);
    shotEl.textContent = lm.name + ' · 环绕';
  }

  // ---------- UI ----------
  var fadeEl = document.getElementById('fade');
  var shotEl = document.getElementById('shot');
  var dotsEl = document.getElementById('dots');
  var btnPlay = document.getElementById('btnPlay');
  dotsEl.innerHTML = '';
  SHOTS.forEach(function (s, i) {
    var d = document.createElement('span'); d.className = 'dot'; d.title = s.name;
    d.addEventListener('click', function () { jumpTo(i); });
    dotsEl.appendChild(d);
  });
  var lmbarEl = document.getElementById('lmbar');
  LANDMARKS.forEach(function (lm, i) {
    var b = document.createElement('button');
    b.className = 'lm'; b.textContent = lm.name;
    b.addEventListener('click', function () { selectLandmark(i); });
    lmbarEl.appendChild(b);
  });
  function setChip(i) {
    var cs = lmbarEl.children;
    for (var k = 0; k < cs.length; k++) cs[k].className = 'lm' + (k === i ? ' on' : '');
  }
  function shotLabel() {
    var s = SHOTS[tour.shot];
    shotEl.textContent = '0' + (tour.shot + 1) + ' · ' + s.name;
    var ds = dotsEl.children;
    for (var i = 0; i < ds.length; i++) ds[i].className = 'dot' + (i === tour.shot ? ' on' : '');
  }
  function jumpTo(i) { if (WALK.on) exitWalk(); tour.shot = i; tour.t = 0; setPlaying(true); }
  function setPlaying(p) {
    mode = p ? 'tour' : 'manual';
    btnPlay.textContent = p ? '⏸ 暂停巡游' : '▶ 继续巡游';
    document.getElementById('hint').style.opacity = p ? 1 : 0.35;
    if (!p) fadePass.uniforms.amount.value = 0;
    setChip(-1);
    showCard(null);
  }
  btnPlay.addEventListener('click', function () {
    if (mode === 'walk') exitWalk();
    setPlaying(mode !== 'tour');
  });
  renderer.domElement.addEventListener('pointerdown', function (ev) {
    if (mode === 'walk') {
      if (ev.pointerType === 'touch' && ev.clientX < window.innerWidth * 0.42) {
        if (!WALK.joy) { WALK.joy = { id: ev.pointerId, bx: ev.clientX, by: ev.clientY, f: 0, r: 0 }; showJoy(ev.clientX, ev.clientY, 0, 0); }
      } else if (!WALK.look) {
        WALK.look = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
      }
      return;
    }
    if (mode !== 'manual') setPlaying(false);
  });
  renderer.domElement.addEventListener('wheel', function () { if (mode !== 'manual' && mode !== 'walk') setPlaying(false); }, { passive: true });
  window.addEventListener('keydown', function (ev) {
    if (mode === 'walk') return;
    if (ev.code === 'Space') { ev.preventDefault(); setPlaying(mode !== 'tour'); }
    var n = parseInt(ev.key, 10);
    if (n >= 1 && n <= Math.min(SHOTS.length, 9)) jumpTo(n - 1);
    if (ev.key === '0' && SHOTS.length > 9) jumpTo(9);
  });

  // ---------- post-processing: SSAO + in-canvas fade + FXAA ----------
  var composer = new THREE.EffectComposer(renderer);
  var ssaoPass = new THREE.SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssaoPass.kernelRadius = 8;
  ssaoPass.minDistance = 0.0004;
  ssaoPass.maxDistance = 0.012;
  composer.addPass(ssaoPass);
  var FadeShader = {
    uniforms: { tDiffuse: { value: null }, amount: { value: 0 }, col: { value: new THREE.Color(0xf7f7f3) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float amount; uniform vec3 col; varying vec2 vUv;' +
      ' void main(){ vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = vec4(mix(c.rgb, col, amount), c.a); }'
  };
  var fadePass = new THREE.ShaderPass(FadeShader);
  composer.addPass(fadePass);
  var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
  composer.addPass(fxaaPass);
  function setComposerSize(w, h) {
    var pr = renderer.getPixelRatio();
    composer.setSize(w, h);
    fxaaPass.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
  }
  setComposerSize(window.innerWidth, window.innerHeight);

  // ---------- night mode ----------
  var NTABLE = {};   // dayHex -> [nightHex, nightEmissiveHex]
  (function () {
    function T(d, n, e) { NTABLE[d] = [n, e || 0x000000]; }
    T(0xffffff, 0x9aa8bb); T(0xfbfbf8, 0x8d9bae); T(0xfaf6ee, 0x93a1b3);
    T(0xe3e7e9, 0x3a4a5c, 0x6b5a2e); T(0xdde4e7, 0x3d4d60, 0x77622f);
    T(0xc9cfc6, 0x525c66); T(0xf3f3ef, 0x232b36); T(0xefefe9, 0x2c3541);
    T(0xe4e4de, 0x272f3a); T(0xecece6, 0x333c48); T(0xe7ddca, 0x453e30); T(0xeee6d2, 0x3f3b33);
    T(COL.water, 0x101b26); T(0x9fd0cc, 0x1c3b42); T(0xc9695a, 0x5a342e);
    T(0x6fbf3f, 0x2c5526); T(0x87cc55, 0x36622c); T(0x5aa832, 0x234a1e);
    T(0xc9c2b4, 0x3f3a30); T(0xf0f0eb, 0x39424e); T(0xd3d6da, 0x76828f);
    T(0xa84a3e, 0x7e352c); T(0xa8524a, 0x6e3029); T(0xdccfae, 0x5c5140);
    T(0xe0523c, 0x8a3428, 0x481107); T(0xf0a13c, 0x8f5c1e, 0x4a2c05);
    T(0xf1ece0, 0x4f5864); T(0xe9e0cd, 0x49525e); T(0xefe8da, 0x545d69);
    T(0xe0685c, 0xb3493f, 0x6e1a12); T(0x4f9e3d, 0x27461f); T(0xd3decc, 0x2b3a2e);
    T(0x8f887c, 0x1e242b); T(0xebeee8, 0x1c2530);
    T(0xf6f5f0, 0x424c59); T(0xe9e9e3, 0x2a323d); T(0xefede6, 0x272f3a);
    T(0xc85548, 0x7c3129, 0x40100a); T(0xd6473c, 0x892f26, 0xff5a3c);   // awnings / lanterns
    T(0x3c3a36, 0x14171b); T(0x4a4a46, 0x20242a); T(0xf2ede4, 0x8b93a0);
    T(0xf0e6d4, 0x555e6a); T(0xc4e0e6, 0x16242e); T(0x6da4bb, 0x22394a); T(0x93c3d3, 0x1c2f3e); T(0xf6f4ee, 0x8b99a9);
    T(0xd6604f, 0x87352c); T(0xf2f1ec, 0x9aa5b2); T(0x6f8fb5, 0x46607e); T(0xe8b64c, 0x8a6a2a); T(0x7fb069, 0x3d5c35);
    T(COL.line, 0x0c0f13); T(COL.lineSoft, 0x39424e);
  })();
  var nightFallback = new THREE.Color(0x1a222e);
  function applyNight(on) {
    NIGHT_ON = on;
    document.body.classList.toggle('night', on);
    renderer.setClearColor(on ? 0x18202c : COL.bg, 1);
    scene.fog.color.setHex(on ? 0x18202c : COL.bg);
    hemi.color.setHex(on ? 0x46587a : 0xffffff);
    hemi.groundColor.setHex(on ? 0x141b24 : 0xeeeee8);
    hemi.intensity = on ? 0.95 : 1.05;
    sun.color.setHex(on ? 0xcfe0f4 : 0xffffff);
    sun.intensity = on ? 0.22 : 0.42;
    M.water.specular.setHex(on ? 0x8fa5bb : 0x333333);
    M.water.shininess = on ? 42 : 6;
    fadePass.uniforms.col.value.setHex(on ? 0x18202c : 0xf7f7f3);
    CLIPMATS.forEach(function (m) {
      if (!m.color) return;
      if (m.userData.day === undefined) m.userData.day = m.color.getHex();
      if (on) {
        var t = NTABLE[m.userData.day];
        if (t) {
          m.color.setHex(t[0]);
          if (m.emissive) m.emissive.setHex(t[1]);
        } else {
          m.color.setHex(m.userData.day);
          m.color.lerp(nightFallback, 0.72);
        }
      } else {
        m.color.setHex(m.userData.day);
        if (m.emissive) m.emissive.setHex(0x000000);
      }
    });
    drawMinimapBase(on);
    btnNight.textContent = on ? '☀️' : '🌙';
    applyWeatherLight();
  }
  var manualNight = false;
  var btnNight = document.getElementById('btnNight');
  btnNight.addEventListener('click', function () {
    manualNight = !NIGHT_ON;
    applyNight(manualNight);
  });

  // ---------- real-time Shenzhen weather (Open-Meteo) ----------
  var WX = { on: false, dim: 0, fogAmt: 0, rain: null, timer: null, label: '', isDay: true };
  // solar position for Shenzhen (22.483N, 113.912E) at the current local time
  function shenzhenSun() {
    var now = new Date();
    var start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    var doy = (now - start) / 86400000;
    var rad = Math.PI / 180;
    var decl = -23.44 * rad * Math.cos(2 * Math.PI / 365 * (doy + 10));
    var solarHours = now.getUTCHours() + now.getUTCMinutes() / 60 + 113.912 / 15;
    var H = (solarHours - 12) * 15 * rad;
    var lat = 22.483 * rad;
    var alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H));
    var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)); // 0 = due south, + toward west
    return { alt: alt, az: az };
  }
  var duskCol = new THREE.Color(0xffb27a), noonCol = new THREE.Color(0xffffff);
  var WXNAMES = { 0: '晴', 1: '多云', 2: '多云', 3: '阴', 45: '雾', 48: '雾', 51: '毛毛雨', 53: '小雨', 55: '小雨',
    56: '冻雨', 57: '冻雨', 61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '冻雨', 71: '小雪', 73: '中雪',
    75: '大雪', 77: '雪', 80: '阵雨', 81: '阵雨', 82: '暴雨', 85: '阵雪', 86: '阵雪', 95: '雷阵雨', 96: '雷阵雨', 99: '雷暴' };
  var wxinfoEl = document.getElementById('wxinfo');
  function buildRain() {
    var N = 1500;
    var pos = new Float32Array(N * 6);
    for (var i = 0; i < N; i++) {
      var x = (Math.random() - 0.5) * 900, y = Math.random() * 320, z = (Math.random() - 0.5) * 900;
      pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x - 1.2; pos[i * 6 + 4] = y - 8; pos[i * 6 + 5] = z;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x9aa8b5, transparent: true, opacity: 0.32 }));
    m.frustumCulled = false;
    m.visible = false;
    scene.add(m);
    return m;
  }
  function setWeatherFX(code, isDay) {
    var rain = code >= 51;
    var storm = code >= 95;
    WX.dim = storm ? 0.75 : (rain ? 0.55 : (code === 3 ? 0.45 : (code >= 1 && code <= 2 ? 0.15 : (code >= 45 && code <= 48 ? 0.5 : 0))));
    WX.fogAmt = (code >= 45 && code <= 48) ? 1 : (rain ? 0.5 : 0);
    WX.isDay = !!isDay;
    if (WX.on) applyNight(!isDay);
    if (!WX.rain && rain) WX.rain = buildRain();
    if (WX.rain) {
      WX.rain.visible = rain;
      WX.rain.material.opacity = storm ? 0.5 : (code >= 63 ? 0.42 : 0.3);
      WX.rain.material.color.setHex(NIGHT_ON ? 0x6f8298 : 0x9aa8b5);
    }
    applyWeatherLight();
  }
  function applyWeatherLight() {
    var d = WX.on ? WX.dim : 0, f = WX.on ? WX.fogAmt : 0;
    sun.intensity = (NIGHT_ON ? 0.22 : 0.42) * (1 - 0.6 * d);
    hemi.intensity = (NIGHT_ON ? 0.95 : 1.05) * (1 - 0.28 * d);
    scene.fog.near = 800 * (1 - 0.55 * f);
    scene.fog.far = 2900 * (1 - 0.38 * f);
  }
  function fetchWeather() {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=22.483&longitude=113.912&current=temperature_2m,weather_code,is_day&timezone=Asia%2FShanghai')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var cur = j.current;
        WX.label = '深圳 ' + Math.round(cur.temperature_2m) + '° ' + (WXNAMES[cur.weather_code] || '');
        wxinfoEl.textContent = WX.label + (cur.is_day ? '' : ' · 夜');
        setWeatherFX(cur.weather_code, cur.is_day === 1);
      })
      .catch(function () { wxinfoEl.textContent = '天气数据不可用'; });
  }
  window.__wx = setWeatherFX;   // debug hook
  var btnWx = document.getElementById('btnWx');
  btnWx.addEventListener('click', function () {
    WX.on = !WX.on;
    btnWx.classList.toggle('on', WX.on);
    if (WX.on) {
      wxinfoEl.textContent = '获取中…';
      fetchWeather();
      WX.timer = setInterval(fetchWeather, 15 * 60 * 1000);
    } else {
      clearInterval(WX.timer);
      wxinfoEl.textContent = '';
      if (WX.rain) WX.rain.visible = false;
      applyNight(manualNight);
      applyWeatherLight();
    }
  });

  // ---------- ambient sound (procedural: waves / birds / rain) ----------
  var SND = { on: false, ctx: null, waveGain: null, rainGain: null, birdTimer: null };
  function noiseBuffer(ctx, secs) {
    var buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < d.length; i++) {   // brown-ish noise
      var w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }
  function startSound() {
    if (!SND.ctx) {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      SND.ctx = ctx;
      // waves: looped brown noise -> lowpass, slow swell LFO
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 4); src.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      SND.waveGain = ctx.createGain(); SND.waveGain.gain.value = 0.05;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.09;
      var lfoGain = ctx.createGain(); lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain); lfoGain.connect(SND.waveGain.gain);
      src.connect(lp); lp.connect(SND.waveGain); SND.waveGain.connect(ctx.destination);
      src.start(); lfo.start();
      // rain: white noise -> highpass, gated by weather
      var rsrc = ctx.createBufferSource();
      var rbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var rd = rbuf.getChannelData(0);
      for (var i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
      rsrc.buffer = rbuf; rsrc.loop = true;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      SND.rainGain = ctx.createGain(); SND.rainGain.gain.value = 0;
      rsrc.connect(hp); hp.connect(SND.rainGain); SND.rainGain.connect(ctx.destination);
      rsrc.start();
      // birds: sporadic chirps in daytime
      SND.birdTimer = setInterval(function () {
        if (!SND.on || NIGHT_ON || (WX.rain && WX.rain.visible)) return;
        if (Math.random() < 0.45) return;
        var n = 2 + Math.floor(Math.random() * 3);
        for (var k = 0; k < n; k++) {
          (function (k2) {
            var t0 = SND.ctx.currentTime + k2 * (0.12 + Math.random() * 0.08);
            var o = SND.ctx.createOscillator();
            var g = SND.ctx.createGain();
            var f = 2400 + Math.random() * 1600;
            o.frequency.setValueAtTime(f, t0);
            o.frequency.exponentialRampToValueAtTime(f * (1.25 + Math.random() * 0.3), t0 + 0.07);
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(0.028, t0 + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
            o.connect(g); g.connect(SND.ctx.destination);
            o.start(t0); o.stop(t0 + 0.12);
          })(k);
        }
      }, 3800);
    }
    SND.ctx.resume();
    SND.on = true;
  }
  var btnSnd = document.getElementById('btnSnd');
  btnSnd.addEventListener('click', function () {
    if (SND.on) {
      SND.on = false;
      if (SND.ctx) SND.ctx.suspend();
      btnSnd.textContent = '🔇';
    } else {
      startSound();
      btnSnd.textContent = '🔊';
    }
  });

  // ---------- first-person walk mode ----------
  var WALK = { on: false, yaw: Math.PI, pitch: -0.03, pos: new THREE.Vector3(-40, 0, 100), keys: {}, look: null, joy: null, bob: 0 };
  var WALK_AREAS = [
    [-420, 350, -95, 111],     // plaza + promenade + Wanghai Rd
    [-40, 40, -270, -95],      // crossing to the ship plaza
    [-200, 80, -505, -270],    // Minghua plaza
    [-710, -150, 140, 440],    // Prince Bay coast strip
    [-630, -110, 440, 766],    // K11 platform
    [230, 470, -880, -640],    // Nanhai E-Cool courtyards
    [940, 1360, -1163, -1137]  // Old town main street
  ];
  var WALK_BLOCKS = [
    [-81, 82, -68, 68, 8],                       // podium walls (ground level only — the roof deck is walkable)
    [-132, 100, -207, -158], [53, 63.5, 56, 94], // hotel; planted cascade between the twin stair runs
    [-113, -95, 79, 89], [-157, -105, 80, 96], [-300, -228, -45, 5], [-48, 44, -462, -298],
    [-207, -157, -437, -411], [-198, -154, -380, -356], [-213, -163, -319, -293],
    [8, 64, -425, -399], [22, 78, -368, -340], [10, 62, -315, -289],
    [-157, -139, -467, -449], [-135, -101, -350, -326],
    [-545, -195, 558, 660], [-242, -198, 675, 705], [-599, -565, 703, 729], [-597, -423, 712, 760],
    [242, 268, -800, -732], [280, 306, -800, -732], [318, 344, -800, -732],
    [356, 382, -800, -732], [394, 420, -800, -732], [432, 458, -800, -732],
    [-47, 51, -29, 25], [-10, 39, -63, -40], [-36, 9, 28, 63], [54, 79, -8, 20]   // pavilion volumes on the roof
  ];
  // walking surface height: 0 = ground; grand stairs are ramps up to the roof garden (+16.8)
  function groundY(x, z) {
    if (z >= 60 && z <= 92 && ((x >= 44 && x <= 52) || (x >= 64 && x <= 72))) {
      return Math.min(16.8, 16.8 * (92 - z) / 32);                       // SE twin stair runs
    }
    if (x >= -74 && x <= -54 && z >= -90 && z <= -62) {
      return Math.min(16.8, Math.max(0, 16.8 * (z + 90) / 25.5));        // NW grand stair
    }
    if (x >= -77 && x <= 78 && z >= -63 && z <= 63) return 16.8;         // roof garden deck
    return 0;
  }
  function inRect(r, x, z) { return x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]; }
  function canWalk(x, z, wy) {
    var gy = groundY(x, z);
    var ok = gy > 0.1;
    if (!ok) {
      for (var i = 0; i < WALK_AREAS.length; i++) { if (inRect(WALK_AREAS[i], x, z)) { ok = true; break; } }
    }
    if (!ok) return false;
    for (var j = 0; j < WALK_BLOCKS.length; j++) {
      var b = WALK_BLOCKS[j];
      if (b.length > 4 && wy >= b[4]) continue;
      if (inRect(b, x, z)) return false;
    }
    return true;
  }
  var hintEl = document.getElementById('hint');
  var hintDefault = hintEl.innerHTML;
  var joyEl = document.getElementById('joy');
  var btnWalk = document.getElementById('btnWalk');
  var WALK_SPAWNS = {
    swcac:    { p: [16, 103], yaw: Math.PI - 0.35, name: '滨海步道' },
    seaworld: { p: [-60, -292], yaw: Math.PI, name: '海上世界广场' },
    k11:      { p: [-370, 716], yaw: Math.PI, name: 'K11 海滨长廊' },
    ecool:    { p: [352, -662], yaw: Math.PI, name: '南海意库' },
    oldtown:  { p: [1300, -1150], yaw: -Math.PI / 2, name: '蛇口老街' }
  };
  function enterWalk() {
    var id = (focus && focus.lm) ? focus.lm.id : 'swcac';
    var sp = WALK_SPAWNS[id] || WALK_SPAWNS.swcac;
    mode = 'walk';
    WALK.on = true;
    WALK.pos.set(sp.p[0], 0, sp.p[1]); WALK.yaw = sp.yaw; WALK.pitch = 0.02;
    camera.fov = 58; camera.updateProjectionMatrix();
    controls.enabled = false;
    fadePass.uniforms.amount.value = 0;
    btnWalk.classList.add('on'); btnWalk.textContent = '⛔';
    btnPlay.textContent = '▶ 继续巡游';
    setChip(-1); showCard(null);
    shotEl.textContent = '漫步 · ' + sp.name;
    hintEl.innerHTML = IS_MOBILE ? '<span>左半屏摇杆移动 · 右半屏拖拽转视角</span>'
      : '<span>W A S D / 方向键 移动 · 拖拽转视角 · Shift 快走 · Esc 退出</span>';
    hintEl.style.opacity = 1;
  }
  function exitWalk() {
    if (!WALK.on) return;
    WALK.on = false; WALK.joy = null; WALK.look = null; joyEl.style.display = 'none';
    btnWalk.classList.remove('on'); btnWalk.textContent = '🚶';
    camera.fov = 42; camera.updateProjectionMatrix();
    controls.enabled = true;
    controls.target.set(WALK.pos.x + Math.sin(WALK.yaw) * 40, 10, WALK.pos.z + Math.cos(WALK.yaw) * 40);
    mode = 'manual';
    hintEl.innerHTML = hintDefault;
    shotLabel();
  }
  btnWalk.addEventListener('click', function () { WALK.on ? exitWalk() : enterWalk(); });
  window.addEventListener('keydown', function (ev) {
    if (!WALK.on) return;
    var k = ev.key.toLowerCase();
    if (k === 'escape') { exitWalk(); return; }
    if (['w', 'a', 's', 'd', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) {
      WALK.keys[k] = true;
      if (k.indexOf('arrow') === 0 || k === ' ') ev.preventDefault();
    }
  });
  window.addEventListener('keyup', function (ev) { WALK.keys[ev.key.toLowerCase()] = false; });
  function showJoy(bx, by, vx, vy) {
    joyEl.style.display = 'block';
    joyEl.style.left = (bx - 45) + 'px'; joyEl.style.top = (by - 45) + 'px';
    joyEl.firstElementChild.style.transform = 'translate(' + vx * 28 + 'px,' + vy * 28 + 'px)';
  }
  window.addEventListener('pointermove', function (ev) {
    if (!WALK.on) return;
    if (WALK.joy && ev.pointerId === WALK.joy.id) {
      var vx = (ev.clientX - WALK.joy.bx) / 55, vy = (ev.clientY - WALK.joy.by) / 55;
      var l = Math.hypot(vx, vy); if (l > 1) { vx /= l; vy /= l; }
      WALK.joy.r = vx; WALK.joy.f = -vy;
      showJoy(WALK.joy.bx, WALK.joy.by, vx, vy);
    } else if (WALK.look && ev.pointerId === WALK.look.id) {
      WALK.yaw -= (ev.clientX - WALK.look.x) * 0.0042;
      WALK.pitch = Math.max(-0.55, Math.min(0.5, WALK.pitch - (ev.clientY - WALK.look.y) * 0.0032));
      WALK.look.x = ev.clientX; WALK.look.y = ev.clientY;
    }
  });
  window.addEventListener('pointerup', function (ev) {
    if (WALK.joy && ev.pointerId === WALK.joy.id) { WALK.joy = null; joyEl.style.display = 'none'; }
    if (WALK.look && ev.pointerId === WALK.look.id) WALK.look = null;
  });
  function updateWalk(dt) {
    var run = WALK.keys['shift'] ? 8.5 : 4.2;
    var f = ((WALK.keys['w'] || WALK.keys['arrowup']) ? 1 : 0) - ((WALK.keys['s'] || WALK.keys['arrowdown']) ? 1 : 0);
    var r = ((WALK.keys['d'] || WALK.keys['arrowright']) ? 1 : 0) - ((WALK.keys['a'] || WALK.keys['arrowleft']) ? 1 : 0);
    if (WALK.joy) { f += WALK.joy.f; r += WALK.joy.r; }
    var len = Math.hypot(f, r);
    if (len > 1) { f /= len; r /= len; }
    var sinY = Math.sin(WALK.yaw), cosY = Math.cos(WALK.yaw);
    var dx = (sinY * f - cosY * r) * run * dt;
    var dz = (cosY * f + sinY * r) * run * dt;
    var curY = groundY(WALK.pos.x, WALK.pos.z);
    var nx = WALK.pos.x + dx;
    if (canWalk(nx, WALK.pos.z, curY) && Math.abs(groundY(nx, WALK.pos.z) - curY) < 3) WALK.pos.x = nx;
    var nz = WALK.pos.z + dz;
    curY = groundY(WALK.pos.x, WALK.pos.z);
    if (canWalk(WALK.pos.x, nz, curY) && Math.abs(groundY(WALK.pos.x, nz) - curY) < 3) WALK.pos.z = nz;
    var moving = len > 0.05;
    WALK.bob += moving ? dt * 7.5 : 0;
    var eye = groundY(WALK.pos.x, WALK.pos.z) + 1.7 + (moving ? Math.sin(WALK.bob) * 0.045 : 0);
    camera.position.set(WALK.pos.x, eye, WALK.pos.z);
    var cp = Math.cos(WALK.pitch);
    lookCur.set(WALK.pos.x + sinY * cp * 10, eye + Math.sin(WALK.pitch) * 10, WALK.pos.z + cosY * cp * 10);
    camera.lookAt(lookCur);
    controls.target.copy(lookCur);
  }

  // ---------- record / export mode (1080p, UI hidden, one full tour loop -> webm) ----------
  var REC = { on: false, mr: null, chunks: [] };
  var btnRec = document.getElementById('btnRec');
  function startRecording() {
    if (!window.MediaRecorder) { btnRec.textContent = '浏览器不支持'; return; }
    REC.on = true;
    document.body.classList.add('record');
    var vw = window.innerWidth, vh = window.innerHeight;
    var sc = Math.min(vw / 1920, vh / 1080);
    var cw = Math.round(1920 * sc), ch = Math.round(1080 * sc);
    var cv = renderer.domElement;
    renderer.setPixelRatio(1);
    renderer.setSize(1920, 1080, false);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    cv.style.left = ((vw - cw) / 2) + 'px'; cv.style.top = ((vh - ch) / 2) + 'px';
    camera.aspect = 1920 / 1080;
    camera.updateProjectionMatrix();
    setComposerSize(1920, 1080);
    var mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    REC.mr = new MediaRecorder(cv.captureStream(30), { mimeType: mime, videoBitsPerSecond: 14000000 });
    REC.chunks = [];
    REC.mr.ondataavailable = function (ev) { if (ev.data.size) REC.chunks.push(ev.data); };
    REC.mr.onstop = function () {
      var blob = new Blob(REC.chunks, { type: 'video/webm' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '蛇口白模巡游' + (NIGHT_ON ? '-夜景' : '') + '.webm';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    };
    jumpTo(0);
    REC.mr.start(1000);
    btnRec.textContent = '■ 停止出片';
  }
  function stopRecording() {
    if (!REC.on) return;
    REC.on = false;
    if (REC.mr && REC.mr.state !== 'inactive') REC.mr.stop();
    document.body.classList.remove('record');
    var cv = renderer.domElement;
    cv.style.width = ''; cv.style.height = ''; cv.style.left = ''; cv.style.top = '';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    setComposerSize(window.innerWidth, window.innerHeight);
    btnRec.textContent = '🎬 出片';
  }
  btnRec.addEventListener('click', function () { REC.on ? stopRecording() : startRecording(); });
  window.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && REC.on) stopRecording(); });

  // ---------- minimap ----------
  var mmap = document.getElementById('mmap');
  var mmctx = mmap.getContext('2d');
  var mmBase = document.createElement('canvas');
  mmBase.width = 150; mmBase.height = 150;
  var MM = { x0: -950, z0: -1500, span: 2550, sc: 150 / 2550 };
  function mmx(x) { return (x - MM.x0) * MM.sc; }
  function mmz(z) { return (z - MM.z0) * MM.sc; }
  function drawMinimapBase(night) {
    var g = mmBase.getContext('2d');
    g.fillStyle = night ? '#232b36' : '#eceae2';
    g.fillRect(0, 0, 150, 150);
    g.fillStyle = night ? '#131c25' : '#c9dade';
    g.fillRect(0, mmz(140), 150, 150 - mmz(140));                       // main sea
    g.fillRect(mmx(640), mmz(-420), mmx(990) - mmx(640), mmz(150) - mmz(-420));  // fishing port + channel
    g.fillStyle = night ? '#2b3440' : '#e4e2d8';
    g.fillRect(mmx(-710), mmz(140), mmx(-150) - mmx(-710), mmz(440) - mmz(140)); // Prince Bay coast strip
    g.fillRect(mmx(-630), mmz(440), mmx(-110) - mmx(-630), mmz(780) - mmz(440)); // K11 platform
    g.fillStyle = night ? '#1d2630' : '#dfe6e0';
    g.beginPath(); g.arc(mmx(-900), mmz(-1050), 24, 0, 7); g.fill();    // Nanshan haze
    g.beginPath(); g.arc(mmx(-340), mmz(-530), 7, 0, 7); g.fill();
    g.strokeStyle = night ? '#46525f' : '#b9b6ab';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(mmx(-700), mmz(-79)); g.lineTo(mmx(700), mmz(-79)); g.stroke();   // Wanghai Rd
    LANDMARKS.forEach(function (lm) {
      g.fillStyle = '#6fae3c';
      g.beginPath(); g.arc(mmx(lm.c[0]), mmz(lm.c[2]), 3.4, 0, 7); g.fill();
    });
  }
  drawMinimapBase(false);
  function drawMinimap() {
    mmctx.clearRect(0, 0, 150, 150);
    mmctx.drawImage(mmBase, 0, 0);
    var cx = mmx(camera.position.x), cz = mmz(camera.position.z);
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    var a = Math.atan2(dir.z, dir.x);
    mmctx.fillStyle = NIGHT_ON ? '#e8eef5' : '#33332f';
    mmctx.beginPath(); mmctx.arc(cx, cz, 3, 0, 7); mmctx.fill();
    mmctx.strokeStyle = NIGHT_ON ? '#e8eef5' : '#33332f';
    mmctx.lineWidth = 1.4;
    mmctx.beginPath(); mmctx.moveTo(cx, cz);
    mmctx.lineTo(cx + Math.cos(a) * 10, cz + Math.sin(a) * 10); mmctx.stroke();
  }
  mmap.addEventListener('click', function (ev) {
    var r = mmap.getBoundingClientRect();
    var px = (ev.clientX - r.left) * (150 / r.width), pz = (ev.clientY - r.top) * (150 / r.height);
    var best = -1, bd = 18;
    LANDMARKS.forEach(function (lm, i) {
      var d = Math.hypot(px - mmx(lm.c[0]), pz - mmz(lm.c[2]));
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) selectLandmark(best);
  });

  // ---------- loop ----------
  var clock = new THREE.Clock();
  var wt = 0;
  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    wt += dt;
    // fps watchdog: degrade gracefully instead of stuttering
    animate._f = (animate._f || 0) + 1;
    animate._t = (animate._t || 0) + dt;
    if (animate._t > 3) {
      var fps = animate._f / animate._t;
      animate._f = 0; animate._t = 0;
      if (fps < 26 && AO_ON) AO_ON = false;
      if (fps < 18 && renderer.getPixelRatio() > 1 && !REC.on) {
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        setComposerSize(window.innerWidth, window.innerHeight);
      }
    }
    cars.forEach(function (c) {
      c.g.position.x += c.dir * c.speed * dt;
      if (c.g.position.x > 700) c.g.position.x = -700;
      if (c.g.position.x < -700) c.g.position.x = 700;
    });
    bikes.forEach(function (b) {
      b.g.position.x += b.dir * b.speed * dt;
      if (b.g.position.x > 300) b.g.position.x = -500;
      if (b.g.position.x < -500) b.g.position.x = 300;
    });
    boats.forEach(function (b) {
      b.g.position.x += b.sp * dt;
      if (b.g.position.x > 780) b.g.position.x = -90;    // keep clear of the Prince Bay coast strip
      if (b.g.position.x < -90) b.g.position.x = 780;
    });
    if (PEOPLE) {
      for (var wi = 0; wi < PEOPLE.defs.length; wi++) {
        var wd = PEOPLE.defs[wi];
        var L = wd.x1 - wd.x0;
        var m2 = (wt * wd.v + wd.ph) % (2 * L);
        var px2 = m2 < L ? wd.x0 + m2 : wd.x1 - (m2 - L);
        PEOPLE.mtx.makeScale(wd.s, wd.s, wd.s);
        PEOPLE.mtx.setPosition(px2, wd.y + 0.58 * wd.s, wd.z);
        PEOPLE.bodyI.setMatrixAt(PEOPLE.base + wi, PEOPLE.mtx);
        PEOPLE.mtx.setPosition(px2, wd.y + 1.32 * wd.s, wd.z);
        PEOPLE.headI.setMatrixAt(PEOPLE.base + wi, PEOPLE.mtx);
      }
      PEOPLE.bodyI.instanceMatrix.needsUpdate = true;
      PEOPLE.headI.instanceMatrix.needsUpdate = true;
    }
    if (SND.on && SND.rainGain) {
      var rTarget = (WX.rain && WX.rain.visible) ? 0.05 : 0;
      SND.rainGain.gain.value += (rTarget - SND.rainGain.gain.value) * Math.min(dt * 2, 1);
    }
    if (WX.rain && WX.rain.visible) {
      WX.rain.position.x = camera.position.x;
      WX.rain.position.z = camera.position.z;
      var rp = WX.rain.geometry.attributes.position, ra = rp.array;
      var drop = 265 * dt;
      for (var ri = 0; ri < ra.length; ri += 6) {
        ra[ri + 1] -= drop; ra[ri + 4] -= drop;
        if (ra[ri + 1] < -5) { var ny = 300 + Math.random() * 30; ra[ri + 1] = ny; ra[ri + 4] = ny - 8; }
      }
      rp.needsUpdate = true;
    }
    // low-poly water ripple (updated at ~20 Hz)
    if ((animate._n = (animate._n || 0) + 1) % 3 === 0) {
      var arr = wPos.array;
      for (var i = 0; i < arr.length; i += 3) {
        var bx = wBase[i], by = wBase[i + 1];
        arr[i + 2] = Math.sin(bx * 0.016 + wt * 0.9) * 0.55 + Math.sin(by * 0.02 + wt * 1.3) * 0.4;
      }
      wPos.needsUpdate = true;
    }
    if (mode === 'tour') applyShot(dt);
    else if (mode === 'fly') { updateFX(null, 0); stepFly(dt); }
    else if (mode === 'focus') { updateFX(null, 0); stepFocus(dt); }
    else if (mode === 'walk') { updateFX(null, 0); updateWalk(dt); }
    else { updateFX(null, 0); controls.update(); }
    drawMinimap();
    composer.render();
  }
  window.addEventListener('resize', function () {
    if (REC.on) return;                     // viewport is locked to 1080p while exporting
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    setComposerSize(window.innerWidth, window.innerHeight);
  });
  buildVegetation();
  (function () {
    var ld = document.getElementById('loader');
    if (ld) { ld.classList.add('done'); setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 800); }
  })();
  CLIPMATS.forEach(function (m) { m.clippingPlanes = [secPlane]; m.clipShadows = true; });
  // ground-family materials stay uncut so the section reads as a building slice, not a world slice
  [M.ground, M.water, M.pave, M.road, M.walk, M.board, M.sand, M.bike, M.pool, osmMats.road, whiteLine]
    .forEach(function (m) { m.clippingPlanes = null; m.clipShadows = false; });
  shotLabel();
  animate();

  // debug snapshot helpers
  window.__scene = scene;
  window.__waterdbg = function () {
    return JSON.stringify({
      color: M.water.color.getHexString(),
      visible: water.visible,
      pos: water.position.toArray(),
      inScene: water.parent === S,
      clip: !!(M.water.clippingPlanes && M.water.clippingPlanes.length),
      userDay: M.water.userData.day
    });
  };
  window.__plainsnap = function (w) {
    w = w || 960;
    renderer.render(scene, camera);
    var c2 = document.createElement('canvas');
    c2.width = w; c2.height = Math.round(w * window.innerHeight / window.innerWidth);
    c2.getContext('2d').drawImage(renderer.domElement, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/jpeg', 0.82);
  };
  window.__snap = function (w) {
    w = w || 960;
    composer.render();
    var c2 = document.createElement('canvas');
    c2.width = w; c2.height = Math.round(w * window.innerHeight / window.innerWidth);
    c2.getContext('2d').drawImage(renderer.domElement, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/jpeg', 0.82);
  };
  window.__still = function (i, frac, w) {
    tour.shot = i; tour.t = (frac || 0) * SHOTS[i].dur;
    applyShot(0); mode = 'manual';
    btnPlay.textContent = '▶ 继续巡游';
    fadePass.uniforms.amount.value = 0;
    return window.__snap(w);
  };
  window.__lm = function (i, deg, w) {
    var lm = LANDMARKS[i];
    focus = { lm: lm, ang: (deg || 0) * Math.PI / 180, idx: i };
    mode = 'focus'; stepFocus(0); mode = 'manual';
    return window.__snap(w);
  };
  window.__walkdbg = function (steps, key, w, px, pz, yaw, pitch) {
    if (!WALK.on) enterWalk();
    if (px !== undefined) { WALK.pos.set(px, 0, pz); WALK.yaw = yaw !== undefined ? yaw : WALK.yaw; }
    if (pitch !== undefined) WALK.pitch = pitch;
    WALK.keys[key || 'w'] = true;
    for (var i = 0; i < (steps || 60); i++) updateWalk(1 / 60);
    WALK.keys[key || 'w'] = false;
    if (w === 0) {
      return JSON.stringify({
        cam: camera.position.toArray().map(function (v) { return Math.round(v * 10) / 10; }),
        look: lookCur.toArray().map(function (v) { return Math.round(v * 10) / 10; }),
        mode: mode, walkOn: WALK.on, yaw: Math.round(WALK.yaw * 100) / 100
      });
    }
    return window.__snap(w);
  };
})();

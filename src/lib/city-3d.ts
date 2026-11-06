import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COLS, ROWS, point, closedEdge, trafficSignal, type City } from './city-engine';

const STEP = 12;
const ROAD = 4.6;
const CAPACITY = 650;
const world = (id: number) => { const p = point(id); return new THREE.Vector3((p.x - (COLS - 1) / 2) * STEP, 0, (p.y - (ROWS - 1) / 2) * STEP); };

export function createCity3D(canvas: HTMLCanvasElement, onChange: () => void) {
  const mobile = matchMedia('(max-width: 760px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor('#101f2a');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Prédios e árvores são estáticos: a sombra é calculada uma vez.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-65, 65, 50, -50, .1, 450);
  camera.position.set(88, 96, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0);
  controls.enableDamping = false;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.minZoom = .7;
  controls.maxZoom = 8;
  controls.minPolarAngle = Math.PI / 8;
  controls.maxPolarAngle = Math.PI / 2.12;
  controls.rotateSpeed = .65;
  controls.zoomSpeed = .8;
  // Um dedo preserva a rolagem da página. Dois dedos giram/aproximam a maquete.
  controls.touches.ONE = null as unknown as THREE.TOUCH;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  controls.update(); controls.saveState();
  controls.addEventListener('change', onChange);
  canvas.style.touchAction = 'pan-y';
  const multiTouch = (event: TouchEvent) => { if (event.touches.length > 1 && event.cancelable) event.preventDefault(); };
  canvas.addEventListener('touchstart', multiTouch, { passive: false });
  canvas.addEventListener('touchmove', multiTouch, { passive: false });

  scene.add(new THREE.HemisphereLight('#e2eff6', '#5b7778', 2.4));
  const sun = new THREE.DirectionalLight('#fff1d5', 3.2);
  sun.position.set(-40, 80, 35);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 180 });
  sun.shadow.bias = -.0008;
  sun.shadow.normalBias = .1;
  scene.add(sun);

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const materials: THREE.Material[] = [];
  const material = (color: string, roughness = .85) => { const m = new THREE.MeshStandardMaterial({ color, roughness }); materials.push(m); return m; };
  const asphalt = material('#263d49');
  const pavement = material('#a8b9b6');
  const base = material('#2b4651');
  const green = material('#387562');
  const path = material('#b5c5a2');
  const line = material('#c4d1cc');
  const glass = material('#3c6570', .35);
  const buildingMaterial = material('#ffffff');
  const matrix = new THREE.Object3D();
  const color = new THREE.Color();
  const instanced = (geometry: THREE.BufferGeometry, mat: THREE.Material, count: number, shadows = false) => {
    const mesh = new THREE.InstancedMesh(geometry, mat, count);
    mesh.castShadow = shadows; mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    scene.add(mesh); return mesh;
  };
  const place = (mesh: THREE.InstancedMesh, index: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) => {
    matrix.position.set(x, y, z); matrix.rotation.set(0, ry, 0); matrix.scale.set(sx, sy, sz); matrix.updateMatrix(); mesh.setMatrixAt(index, matrix.matrix);
  };
  const box = (mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, shadows = false) => {
    const mesh = new THREE.Mesh(cube, mat); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = shadows; mesh.receiveShadow = true; scene.add(mesh); return mesh;
  };
  box(base, 0, -1.1, 0, 98, 2, 74);
  box(pavement, 0, -.14, 0, 97, .35, 73);
  // O entorno é paisagem de contexto, fora da rede de viagens simuladas.
  const landscape = material('#315a52');
  box(base, 0, -1.6, 0, 124, 1.1, 100);
  box(landscape, 0, -.8, 0, 123, .45, 99);
  const river = material('#457e8a', .3);
  box(river, -55, -.5, 0, 8, .16, 97);
  box(path, -49.7, -.45, 0, 1, .12, 96);
  box(path, 0, -.45, 42, 119, .12, 1.5);
  box(path, 56, -.45, 0, 1.5, .12, 96);
  for (const z of [-24, 24]) {
    box(pavement, -55, -.3, z, 11, .45, 3);
    box(line, -55, .25, z - 1.4, 11, .65, .15);
    box(line, -55, .25, z + 1.4, 11, .65, .15);
  }
  // Vias e interseções correspondem exatamente à rede do motor.
  for (let x = 0; x < COLS; x++) box(asphalt, (x - 3.5) * STEP, .05, 0, ROAD, .12, 64.6);
  for (let y = 0; y < ROWS; y++) box(asphalt, 0, .06, (y - 2.5) * STEP, 88.6, .12, ROAD);
  const markings = instanced(cube, line, 1400);
  let mi = 0;
  for (let i = 0; i < COLS * ROWS; i++) {
    const a = point(i), p = world(i);
    for (const next of [a.x < COLS - 1 ? i + 1 : -1, a.y < ROWS - 1 ? i + COLS : -1]) {
      if (next < 0) continue;
      const q = world(next), horizontal = a.y === point(next).y;
      for (let k = 0; k < 4; k++) {
        const t = .31 + k * .13;
        place(markings, mi++, p.x + (q.x - p.x) * t, .14, p.z + (q.z - p.z) * t, horizontal ? .65 : .09, .018, horizontal ? .09 : .65);
      }
    }
    // Faixas de travessia em todas as interseções internas.
    if (a.x > 0 && a.x < COLS - 1 && a.y > 0 && a.y < ROWS - 1) for (let k = 0; k < 5; k++) {
      place(markings, mi++, p.x - 1.5 + k * .65, .15, p.z + 2.1, .3, .02, .75);
      place(markings, mi++, p.x + 2.1, .15, p.z - 1.5 + k * .65, .75, .02, .3);
    }
  }
  markings.count = mi;

  const buildings = instanced(cube, buildingMaterial, 150, true);
  const windows = instanced(cube, glass, 1600);
  const roofs = instanced(cube, material('#8fa4a5'), 200, true);
  const treeGeometry = new THREE.IcosahedronGeometry(1, 1);
  const trees = instanced(treeGeometry, material('#5e9c74'), 240, true);
  const trunkGeometry = new THREE.CylinderGeometry(.16, .22, 1, 5);
  const trunks = instanced(trunkGeometry, material('#6a6a51'), 240, true);
  let bi = 0, wi = 0, ri = 0, ti = 0;
  const palette = ['#d8d3bd', '#e2dfcf', '#b5c9c7', '#9eb6b7', '#d3baa1', '#becbc1'];
  for (let y = 0; y < ROWS - 1; y++) for (let x = 0; x < COLS - 1; x++) {
    const cx = (x - 3) * STEP, cz = (y - 2) * STEP;
    const park = (x === 1 && y === 1) || (x === 5 && y === 3) || (x === 4 && y === 0);
    box(pavement, cx, .18, cz, 7.1, .3, 7.1);
    if (park) {
      box(green, cx, .38, cz, 6.8, .12, 6.8);
      box(path, cx, .46, cz, 6.8, .04, .65);
      box(path, cx, .46, cz, .65, .04, 6.8);
      if (x === 5) box(material('#5c9eab', .3), cx + 1.65, .47, cz + 1.6, 2.3, .05, 2.2);
      for (let k = 0; k < 7; k++) {
        const tx = cx + [-2.4, -1.1, 1.3, 2.5, -2.2, -1.2, 2.3][k];
        const tz = cz + [-2.2, -2.4, -2.1, -1.2, 1.5, 2.4, 2.3][k];
        const size = .8 + (k % 3) * .18;
        place(trunks, ti, tx, 1, tz, 1, 1.2, 1);
        place(trees, ti, tx, 2, tz, size, size * 1.2, size);
        trees.setColorAt(ti, color.set(k % 2 ? '#6ca77a' : '#417c64')); ti++;
      }
      continue;
    }
    for (let b = 0; b < 3; b++) {
      const bx = cx + (b === 0 ? -1.65 : 1.65), bz = cz + (b === 2 ? 1.7 : -1.25);
      const bw = b === 0 ? 2.7 : 2.5, bd = b === 0 ? 5.7 : 2.65;
      const central = x >= 2 && x <= 4 && y >= 1 && y <= 3;
      const bh = 2.1 + ((x * 13 + y * 7 + b * 11) % (central ? 12 : 5));
      place(buildings, bi, bx, .4 + bh / 2, bz, bw, bh, bd);
      buildings.setColorAt(bi++, color.set(palette[(x + y * 2 + b) % palette.length]));
      place(roofs, ri++, bx, .4 + bh + .12, bz, bw + .1, .24, bd + .1);
      place(roofs, ri++, bx + .3, .4 + bh + .45, bz + .3, .85, .5, .8);
      for (let floor = 1; floor < bh - .25; floor += 1.45) {
        place(windows, wi++, bx, .4 + floor, bz + bd / 2 + .018, bw * .75, .5, .025);
        place(windows, wi++, bx, .4 + floor, bz - bd / 2 - .018, bw * .75, .5, .025);
        place(windows, wi++, bx + bw / 2 + .018, .4 + floor, bz, .025, .5, bd * .72);
        place(windows, wi++, bx - bw / 2 - .018, .4 + floor, bz, .025, .5, bd * .72);
      }
    }
    // Árvores de passeio, afastadas da faixa de rolamento.
    for (const side of [-1, 1]) {
      place(trunks, ti, cx + side * 3.15, .9, cz + 3.12, 1, 1, 1);
      place(trees, ti, cx + side * 3.15, 1.8, cz + 3.12, .65, .95, .65); ti++;
    }
  }
  for (let k = 0; k < 35; k++) {
    const x = -45 + k * 2.9;
    for (const z of [-43, 46]) {
      place(trunks, ti, x, .2, z, 1.2, 1.5, 1.2);
      place(trees, ti, x, 1.7, z, 1.15, 1.6, 1.15);
      trees.setColorAt(ti++, color.set(k % 2 ? '#6c9a70' : '#417c64'));
    }
  }
  for (let k = 0; k < 13; k++) {
    place(trunks, ti, 58.5, .2, -36 + k * 6, 1.1, 1.4, 1.1);
    place(trees, ti, 58.5, 1.6, -36 + k * 6, 1.1, 1.5, 1.1); ti++;
  }
  const furniture = material('#5e6b60');
  const timber = material('#b7946b');
  for (let k = 0; k < 8; k++) {
    const x = -37 + k * 12;
    box(timber, x, .2, 44, 2.4, .22, .7);
    box(furniture, x - .8, -.1, 44, .15, .65, .6);
    box(furniture, x + .8, -.1, 44, .15, .65, .6);
    box(timber, x, .7, 44.3, 2.4, .7, .12);
  }
  const posts = instanced(cube, material('#3b5056'), 120, true);
  const lamps = instanced(cube, material('#e5d7aa'), 120);
  let postCount = 0;
  for (let k = 0; k < 14; k++) for (const z of [-38, 38]) {
    place(posts, postCount, -44 + k * 7, 1.5, z, .13, 3.6, .13);
    place(lamps, postCount, -44 + k * 7, 3.35, z, .5, .18, .5); postCount++;
  }
  posts.count = lamps.count = postCount;
  buildings.count = bi; windows.count = wi; roofs.count = ri; trees.count = ti; trunks.count = ti;

  const busLanes = new THREE.Group(); scene.add(busLanes);
  const busMat = material('#5ec7ac');
  for (let x = 0; x < COLS; x++) { const m = new THREE.Mesh(cube, busMat); m.position.set((x - 3.5) * STEP - 1.7, .15, 0); m.scale.set(.22, .025, 64.5); busLanes.add(m); }
  for (let y = 0; y < ROWS; y++) { const m = new THREE.Mesh(cube, busMat); m.position.set(0, .15, (y - 2.5) * STEP - 1.7); m.scale.set(88.5, .025, .22); busLanes.add(m); }
  const works = new THREE.Group(); scene.add(works);
  const start = world(closedEdge[0]), end = world(closedEdge[1]);
  const barrierMat = material('#ed9b50');
  const coneGeometry = new THREE.ConeGeometry(.28, .75, 5);
  for (const t of [.24, .5, .76]) {
    const x = start.x + (end.x - start.x) * t;
    for (const side of [-1, 1]) { const cone = new THREE.Mesh(coneGeometry, barrierMat); cone.position.set(x, .55, start.z + side * 1.2); works.add(cone); }
  }
  const barrier = new THREE.Mesh(cube, barrierMat); barrier.position.set((start.x + end.x) / 2, .55, start.z); barrier.scale.set(.35, .8, 3.5); works.add(barrier);
  const white = material('#fff1d7');
  for (let k = 0; k < 4; k++) { const stripe = new THREE.Mesh(cube, white); stripe.position.set(barrier.position.x + .18, .55, start.z - 1.25 + k * .8); stripe.scale.set(.025, .8, .32); works.add(stripe); }

  const bodies = instanced(cube, material('#ffffff'), CAPACITY);
  const cabins = instanced(cube, glass, CAPACITY);
  const tops = instanced(cube, material('#ffffff'), CAPACITY);
  const tires = instanced(cube, material('#18262b'), CAPACITY * 4);
  for (const m of [bodies, cabins, tops, tires]) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const signalMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' }); materials.push(signalMaterial);
  signalMaterial.toneMapped = false;
  const signalPoles = instanced(cube, material('#52636a'), 96, true);
  const signalHeads = instanced(cube, material('#15272c'), 96, true);
  const signalArms = instanced(cube, material('#52636a'), 96, true);
  const lensGeometry = new THREE.SphereGeometry(.145, 8, 6);
  const lights = instanced(lensGeometry, signalMaterial, 288);
  const heads: { x: number; y: number; horizontal: boolean; px: number; pz: number; angle: number }[] = [];
  for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
    const p = world(y * COLS + x);
    for (const [sx, sz, horizontal, angle] of [[-1, 1, true, -Math.PI / 2], [1, -1, true, Math.PI / 2], [-1, -1, false, Math.PI], [1, 1, false, 0]] as const) {
      const i = heads.length;
      const px = p.x + sx * (horizontal ? 2.8 : 1.95), pz = p.z + sz * (horizontal ? 1.95 : 2.8);
      place(signalPoles, i, p.x + sx * 2.8, 1.65, p.z + sz * 2.8, .13, 3.2, .13);
      place(signalHeads, i, px, 3.1, pz, .48, 1.22, .4, angle);
      place(signalArms, i, (p.x + sx * 2.8 + px) / 2, 3.55, (p.z + sz * 2.8 + pz) / 2, horizontal ? .12 : .95, .12, horizontal ? .95 : .12);
      heads.push({ x, y, horizontal, px, pz, angle });
    }
  }
  const ringGeo = new THREE.RingGeometry(2.7, 3, 40);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#f0ad66', side: THREE.DoubleSide }); materials.push(ringMat);
  const selectedRing = new THREE.Mesh(ringGeo, ringMat); selectedRing.rotation.x = -Math.PI / 2; selectedRing.visible = false; scene.add(selectedRing);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  let alive = true;
  let lost = false;
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; canvas.dispatchEvent(new CustomEvent('city:3d-lost')); });

  function draw(city: City, selected: number | null) {
    if (!alive || lost) return;
    busLanes.visible = city.settings.busLane; works.visible = city.settings.works;
    let count = 0;
    const cars = ['#efad69', '#d07d55', '#e6c79d', '#b8c7cc', '#d9d8ca'];
    for (const v of city.vehicles) {
      if (count >= CAPACITY) break;
      const a = world(v.route[v.step]), b = world(v.route[v.step + 1]);
      const angle = Math.atan2(b.x - a.x, b.z - a.z);
      const lane = v.bus && city.settings.busLane ? 1.7 : .65;
      const x = a.x + (b.x - a.x) * v.progress - Math.cos(angle) * lane;
      const z = a.z + (b.z - a.z) * v.progress + Math.sin(angle) * lane;
      const length = v.bus ? 2.8 : 1.65;
      place(bodies, count, x, .55, z, v.bus ? .95 : .85, v.bus ? .75 : .45, length, angle);
      bodies.setColorAt(count, color.set(v.bus ? '#67c8ac' : cars[v.id % cars.length]));
      place(cabins, count, x, v.bus ? 1.02 : .88, z, v.bus ? .98 : .68, v.bus ? .4 : .38, length * .7, angle);
      place(tops, count, x, v.bus ? 1.26 : 1.08, z, v.bus ? 1 : .72, .09, length * (v.bus ? .94 : .43), angle);
      tops.setColorAt(count, color.set(v.bus ? '#a2e1cb' : cars[v.id % cars.length]));
      for (let k = 0; k < 4; k++) {
        const lateral = k % 2 ? .46 : -.46, along = k < 2 ? length * .31 : -length * .31;
        place(tires, count * 4 + k, x + Math.cos(angle) * lateral + Math.sin(angle) * along, .33, z - Math.sin(angle) * lateral + Math.cos(angle) * along, .12, .28, .3, angle);
      }
      count++;
    }
    bodies.count = cabins.count = tops.count = count; tires.count = count * 4;
    for (const m of [bodies, cabins, tops, tires]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    let li = 0;
    for (const head of heads) {
      const signal = trafficSignal(city.time, head.x, head.y, city.settings.signal);
      const active = head.horizontal ? signal.horizontal : signal.vertical;
      for (const [k, name, lit, dim] of [[0, 'red', '#ff574b', '#502f30'], [1, 'amber', '#ffca5d', '#4d4230'], [2, 'green', '#64f1a4', '#26463c']] as const) {
        place(lights, li, head.px + Math.sin(head.angle) * .225, 3.48 - k * .38, head.pz + Math.cos(head.angle) * .225, 1, 1, .6, head.angle);
        lights.setColorAt(li++, color.set(active === name ? lit : dim));
      }
    }
    lights.instanceMatrix.needsUpdate = true; if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
    selectedRing.visible = selected !== null;
    if (selected !== null) { const p = world(selected); selectedRing.position.set(p.x, .2, p.z); }
    renderer.render(scene, camera);
  }
  function resize(width: number, height: number) {
    const aspect = width / Math.max(1, height);
    const size = aspect < 1.2 ? 74 : 65;
    camera.left = -size * aspect; camera.right = size * aspect; camera.top = size; camera.bottom = -size;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
  }
  function zoom(direction: string) {
    if (direction === 'reset') controls.reset();
    else { camera.zoom = THREE.MathUtils.clamp(camera.zoom * (direction === 'in' ? 1.25 : 1 / 1.25), .7, 8); camera.updateProjectionMatrix(); }
  }
  function setZoom(value: number) { camera.zoom = THREE.MathUtils.clamp(value, .7, 8); camera.updateProjectionMatrix(); }
  function focus(preset: string, selected: number | null = null) {
    const node = selected ?? 35;
    if (preset === 'geral') { controls.reset(); return; }
    const target = preset === 'parque' ? new THREE.Vector3(24, 0, 12) : world(node);
    controls.target.copy(target);
    const offset = preset === 'avenida' ? new THREE.Vector3(38, 16, 40) : new THREE.Vector3(38, 40, 45);
    camera.position.copy(target).add(offset);
    camera.zoom = preset === 'avenida' ? 5.5 : preset === 'parque' ? 3.5 : 4;
    camera.updateProjectionMatrix(); controls.update();
  }
  function rotate(direction: number) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 8);
    camera.position.copy(controls.target).add(offset); controls.update();
  }
  function pick(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1), camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return null;
    const col = Math.round(hit.x / STEP + (COLS - 1) / 2), row = Math.round(hit.z / STEP + (ROWS - 1) / 2);
    return col >= 0 && col < COLS && row >= 0 && row < ROWS ? row * COLS + col : null;
  }
  function dispose() {
    if (!alive) return; alive = false;
    controls.removeEventListener('change', onChange); controls.dispose();
    canvas.removeEventListener('touchstart', multiTouch); canvas.removeEventListener('touchmove', multiTouch);
    const geometries = new Set<THREE.BufferGeometry>();
    scene.traverse(object => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
  }
  return { draw, resize, zoom, setZoom, focus, rotate, pick, dispose, getZoom: () => camera.zoom };
}
export type City3D = ReturnType<typeof createCity3D>;

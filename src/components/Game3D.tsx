 
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Icon from "@/components/ui/icon";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Enemy {
  id: number;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  alive: boolean;
  name: string;
  team: "T";
  patrolPath: THREE.Vector3[];
  patrolIdx: number;
  speed: number;
  lastShot: number;
}

interface BombSite {
  id: "A" | "B";
  position: THREE.Vector3;
  mesh: THREE.Mesh;
}

type GamePhase = "playing" | "planting" | "planted" | "defusing" | "round_won" | "round_lost";

// ─── AGENTS ──────────────────────────────────────────────────────────────────
export const AGENTS = [
  {
    id: "phoenix", name: "Феникс", role: "Дуэлист",
    ability: "Огненная стена", ult: "Возрождение",
    color: "#e05020", skin: 0xe05020,
    desc: "Агрессивный агент с огненными способностями. Может возродиться после смерти.",
    hp: 100, speed: 1.0,
  },
  {
    id: "ghost", name: "Призрак", role: "Инициатор",
    ability: "Флэш-граната", ult: "Разведка",
    color: "#4a9eff", skin: 0x4a9eff,
    desc: "Тактический агент, вскрывающий позиции врагов и создающий преимущество.",
    hp: 100, speed: 0.95,
  },
  {
    id: "shadow", name: "Тень", role: "Контроллер",
    ability: "Дымовая завеса", ult: "Ядерный дым",
    color: "#9b59b6", skin: 0x9b59b6,
    desc: "Мастер контроля пространства. Перекрывает видимость и берёт контроль.",
    hp: 100, speed: 0.90,
  },
  {
    id: "ironwall", name: "Железная стена", role: "Страж",
    ability: "Барьер", ult: "Крепость",
    color: "#27ae60", skin: 0x27ae60,
    desc: "Защитник команды. Возводит барьеры и удерживает позиции.",
    hp: 125, speed: 0.85,
  },
  {
    id: "viper", name: "Гадюка", role: "Снайпер",
    ability: "Ядовитый туман", ult: "Клетка",
    color: "#f5a623", skin: 0xf5a623,
    desc: "Дальний боец с отравляющими способностями. Контролирует зоны.",
    hp: 100, speed: 0.95,
  },
];

// ─── MAP BUILDER ─────────────────────────────────────────────────────────────
function buildMap(scene: THREE.Scene): BombSite[] {
  // Textures
  const loader = new THREE.TextureLoader();

  // Ground
  const groundGeo = new THREE.PlaneGeometry(120, 120, 20, 20);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x8a7050 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Ground detail tiles
  for (let i = 0; i < 40; i++) {
    const tileGeo = new THREE.PlaneGeometry(3 + Math.random() * 4, 3 + Math.random() * 4);
    const tileMat = new THREE.MeshLambertMaterial({ color: 0x7a6040 + Math.floor(Math.random() * 0x101010) });
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.rotation.x = -Math.PI / 2;
    tile.position.set((Math.random() - 0.5) * 100, 0.01, (Math.random() - 0.5) * 100);
    tile.receiveShadow = true;
    scene.add(tile);
  }

  // Helper to add a box
  const addBox = (
    w: number, h: number, d: number,
    x: number, y: number, z: number,
    color: number,
    castShadow = true
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    if (castShadow) { mesh.castShadow = true; mesh.receiveShadow = true; }
    scene.add(mesh);
    return mesh;
  };

  // ── OUTER WALLS ──
  // North wall
  addBox(120, 8, 2, 0, 0, -60, 0x4a3820);
  // South wall
  addBox(120, 8, 2, 0, 0, 60, 0x4a3820);
  // West wall
  addBox(2, 8, 120, -60, 0, 0, 0x4a3820);
  // East wall
  addBox(2, 8, 120, 60, 0, 0, 0x4a3820);

  // ── MAIN BUILDINGS ──
  // CT Base (south area)
  addBox(24, 6, 16, -30, 0, 48, 0x5a4830);
  addBox(24, 6, 16, 20, 0, 48, 0x5a4830);
  // CT Base roof accent
  addBox(26, 1, 18, -30, 6, 48, 0x3a2810);
  addBox(26, 1, 18, 20, 6, 48, 0x3a2810);

  // T Base (north area)
  addBox(24, 6, 16, -28, 0, -48, 0x4a3020);
  addBox(24, 6, 16, 22, 0, -48, 0x4a3020);

  // ── MID AREA BUILDINGS ──
  // Left corridor buildings
  addBox(14, 5, 8, -40, 0, -10, 0x5a4028);
  addBox(14, 5, 8, -40, 0, 10, 0x5a4028);

  // Right corridor buildings
  addBox(14, 5, 8, 38, 0, -8, 0x4a3828);
  addBox(14, 5, 8, 38, 0, 12, 0x4a3828);

  // Mid platform / tower
  addBox(10, 4, 10, 0, 0, 5, 0x6a5030);
  addBox(8, 0.5, 8, 0, 4, 5, 0x3a2010);  // roof

  // ── SITE A (northwest) ──
  // A site walls
  addBox(18, 5, 2, -38, 0, -28, 0x5a4830);
  addBox(2, 5, 14, -47, 0, -22, 0x5a4830);
  // A boxes / cover
  addBox(4, 3, 4, -38, 0, -20, 0x8a6040);
  addBox(4, 2, 4, -34, 0, -24, 0x8a6040);
  addBox(4, 3, 8, -42, 0, -18, 0x7a5030);

  // ── SITE B (east area) ──
  // B site walls
  addBox(18, 5, 2, 38, 0, 20, 0x5a4830);
  addBox(2, 5, 14, 47, 0, 14, 0x5a4830);
  // B boxes / cover
  addBox(4, 3, 4, 36, 0, 22, 0x8a6040);
  addBox(4, 2, 4, 42, 0, 26, 0x8a6040);
  addBox(8, 3, 4, 38, 0, 14, 0x7a5030);

  // ── COVER OBJECTS (crates, barrels, sandbags) ──
  const crateColor = 0x8a6030;
  // Scattered crates
  const cratePositions = [
    [-15, 0, -15], [15, 0, -15], [-15, 0, 15], [18, 0, 18],
    [5, 0, -20], [-5, 0, 20], [25, 0, 0], [-25, 0, 5],
    [10, 0, 30], [-10, 0, -30], [30, 0, -20], [-30, 0, 20],
  ];
  cratePositions.forEach(([x, y, z]) => {
    const size = 2 + Math.random() * 1.5;
    addBox(size, size, size, x, 0, z, crateColor + Math.floor(Math.random() * 0x101010));
  });

  // Concrete barriers (long thin)
  addBox(8, 1.5, 1.5, -5, 0, -5, 0x706050);
  addBox(8, 1.5, 1.5, 5, 0, 5, 0x706050);
  addBox(1.5, 1.5, 8, -10, 0, 8, 0x706050);
  addBox(1.5, 1.5, 8, 12, 0, -8, 0x706050);

  // ── PILLARS ──
  const pillarPositions = [
    [-20, 0, -20], [20, 0, -20], [-20, 0, 20], [20, 0, 20],
    [0, 0, -30], [0, 0, 30],
  ];
  pillarPositions.forEach(([x, y, z]) => {
    addBox(2, 5, 2, x, 0, z, 0x5a4030);
  });

  // ── DEBRIS / DETAIL ──
  for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 90;
    const z = (Math.random() - 0.5) * 90;
    addBox(
      0.5 + Math.random(), 0.3 + Math.random() * 0.5, 0.5 + Math.random(),
      x, 0, z, 0x6a5030 + Math.floor(Math.random() * 0x202020)
    );
  }

  // ── BOMB SITES ──
  // Site A marker
  const siteAGeo = new THREE.PlaneGeometry(8, 8);
  const siteAMat = new THREE.MeshLambertMaterial({ color: 0xf5a623, transparent: true, opacity: 0.35 });
  const siteA = new THREE.Mesh(siteAGeo, siteAMat);
  siteA.rotation.x = -Math.PI / 2;
  siteA.position.set(-38, 0.05, -20);
  scene.add(siteA);

  // A label pillar
  addBox(0.5, 3, 0.5, -38, 0, -20, 0xf5a623);

  // Site B marker
  const siteBGeo = new THREE.PlaneGeometry(8, 8);
  const siteBMat = new THREE.MeshLambertMaterial({ color: 0xf5a623, transparent: true, opacity: 0.35 });
  const siteB = new THREE.Mesh(siteBGeo, siteBMat);
  siteB.rotation.x = -Math.PI / 2;
  siteB.position.set(38, 0.05, 20);
  scene.add(siteB);

  // B label pillar
  addBox(0.5, 3, 0.5, 38, 0, 20, 0xf5a623);

  return [
    { id: "A", position: new THREE.Vector3(-38, 0, -20), mesh: siteA },
    { id: "B", position: new THREE.Vector3(38, 0, 20), mesh: siteB },
  ];
}

// ─── ENEMY BUILDER ───────────────────────────────────────────────────────────
function createEnemyMesh(color: number): THREE.Group {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.0;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  const headMat = new THREE.MeshLambertMaterial({ color: 0xc8a080 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.85;
  head.castShadow = true;
  group.add(head);

  // Helmet
  const helmGeo = new THREE.BoxGeometry(0.62, 0.3, 0.62);
  const helmMat = new THREE.MeshLambertMaterial({ color: color - 0x202020 });
  const helm = new THREE.Mesh(helmGeo, helmMat);
  helm.position.y = 2.05;
  helm.castShadow = true;
  group.add(helm);

  // Left arm
  const armGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
  const armMat = new THREE.MeshLambertMaterial({ color });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.55, 0.95, 0);
  group.add(leftArm);

  // Right arm
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.55, 0.95, 0);
  group.add(rightArm);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.32, 0.8, 0.32);
  const legMat = new THREE.MeshLambertMaterial({ color: color - 0x101010 });
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.22, 0.4, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.22, 0.4, 0);
  group.add(rightLeg);

  // Weapon
  const gunGeo = new THREE.BoxGeometry(0.15, 0.15, 0.8);
  const gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const gun = new THREE.Mesh(gunGeo, gunMat);
  gun.position.set(0.5, 1.1, 0.4);
  group.add(gun);

  // HP bar background
  const hpBgGeo = new THREE.PlaneGeometry(1.2, 0.15);
  const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
  hpBg.position.y = 2.6;
  hpBg.name = "hpbg";
  group.add(hpBg);

  const hpBarGeo = new THREE.PlaneGeometry(1.2, 0.12);
  const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
  const hpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
  hpBar.position.y = 2.6;
  hpBar.position.z = 0.001;
  hpBar.name = "hpbar";
  group.add(hpBar);

  return group;
}

// ─── COLLISION ───────────────────────────────────────────────────────────────
const WALL_BOXES = [
  // outer walls
  { xMin: -61, xMax: 61, zMin: -61, zMax: -59 },
  { xMin: -61, xMax: 61, zMin: 59, zMax: 61 },
  { xMin: -61, xMax: -59, zMin: -61, zMax: 61 },
  { xMin: 59, xMax: 61, zMin: -61, zMax: 61 },
  // buildings
  { xMin: -43, xMax: -17, zMin: 40, zMax: 57 },
  { xMin: 8, xMax: 33, zMin: 40, zMax: 57 },
  { xMin: -41, xMax: -16, zMin: -57, zMax: -40 },
  { xMin: 9, xMax: 35, zMin: -57, zMax: -40 },
  { xMin: -48, xMax: -33, zMin: -15, zMax: -5 },
  { xMin: -48, xMax: -33, zMin: 5, zMax: 15 },
  { xMin: 30, xMax: 46, zMin: -13, zMax: -3 },
  { xMin: 30, xMax: 46, zMin: 7, zMax: 18 },
  { xMin: -5, xMax: 5, zMin: 0, zMax: 10 },
  // site walls
  { xMin: -48, xMax: -30, zMin: -30, zMax: -27 },
  { xMin: -49, xMax: -46, zMin: -30, zMax: -15 },
  { xMin: 29, xMax: 48, zMin: 18, zMax: 22 },
  { xMin: 45, xMax: 49, zMin: 8, zMax: 22 },
];

function checkCollision(x: number, z: number, radius = 0.5): boolean {
  for (const b of WALL_BOXES) {
    if (x + radius > b.xMin && x - radius < b.xMax && z + radius > b.zMin && z - radius < b.zMax) {
      return true;
    }
  }
  return false;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
interface Game3DProps {
  agentId: string;
  onBack: () => void;
  onOpenShop: () => void;
}

export default function Game3D({ agentId, onBack, onOpenShop }: Game3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ dx: 0, dy: 0, locked: false });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const posRef = useRef(new THREE.Vector3(0, 1.7, 30));
  const enemiesRef = useRef<Enemy[]>([]);
  const bombSitesRef = useRef<BombSite[]>([]);
  const frameRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());
  const bobRef = useRef(0);
  const shootFlashRef = useRef<THREE.PointLight | null>(null);
  const flashTimerRef = useRef(0);

  const agent = AGENTS.find(a => a.id === agentId) || AGENTS[0];

  const [phase, setPhase] = useState<GamePhase>("playing");
  const [hp, setHp] = useState(agent.hp);
  const [armor, setArmor] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [money, setMoney] = useState(4200);
  const [kills, setKills] = useState(0);
  const [roundTime, setRoundTime] = useState(115);
  const [bombTimer, setBombTimer] = useState(40);
  const [plantProgress, setPlantProgress] = useState(0);
  const [defuseProgress, setDefuseProgress] = useState(0);
  const [nearSite, setNearSite] = useState<"A" | "B" | null>(null);
  const [bombSite, setBombSite] = useState<"A" | "B" | null>(null);
  const [score, setScore] = useState({ ct: 5, t: 4 });
  const [killfeed, setKillfeed] = useState<{ text: string; color: string }[]>([]);
  const [crosshairHit, setCrosshairHit] = useState(false);
  const [abilityReady, setAbilityReady] = useState(true);
  const [ultReady, setUltReady] = useState(false);
  const [fps, setFps] = useState(60);
  const [hint, setHint] = useState("WASD — движение  |  Мышь — прицел  |  ЛКМ — выстрел  |  F — действие  |  B — магазин");

  const phaseRef = useRef<GamePhase>("playing");
  const plantProgressRef = useRef(0);
  const defuseProgressRef = useRef(0);
  const bombSiteRef = useRef<"A" | "B" | null>(null);
  const bombTimerRef = useRef(40);
  const roundTimeRef = useRef(115);
  const hpRef = useRef(agent.hp);
  const ammoRef = useRef(30);
  const killsRef = useRef(0);
  const moneyRef = useRef(4200);
  const isPlantingRef = useRef(false);
  const isDefusingRef = useRef(false);
  const lastFpsTime = useRef(0);
  const frameCount = useRef(0);

  const addKillfeed = useCallback((text: string, color = "#f5a623") => {
    setKillfeed(prev => [{ text, color }, ...prev].slice(0, 5));
  }, []);

  // ── INIT THREE.JS ──
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8a9ba8, 30, 120);
    scene.background = new THREE.Color(0x6b9fd4);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.copy(posRef.current);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffe8c0, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff0d0, 1.4);
    sun.position.set(30, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0x8090ff, 0.3);
    fillLight.position.set(-20, 10, -10);
    scene.add(fillLight);

    // Shoot flash
    const flash = new THREE.PointLight(0xffdd88, 0, 3);
    flash.position.set(0, 1.5, 0);
    scene.add(flash);
    shootFlashRef.current = flash;

    // Build map
    const sites = buildMap(scene);
    bombSitesRef.current = sites;

    // Spawn enemies
    const enemyData = [
      { name: "VoidHunter", x: -35, z: -45, color: 0xc03020, path: [new THREE.Vector3(-35, 0, -45), new THREE.Vector3(-25, 0, -40), new THREE.Vector3(-20, 0, -30)] },
      { name: "SteelWolf", x: 35, z: -45, color: 0xa02818, path: [new THREE.Vector3(35, 0, -45), new THREE.Vector3(30, 0, -35), new THREE.Vector3(25, 0, -25)] },
      { name: "PhantomX", x: 0, z: -35, color: 0xb02010, path: [new THREE.Vector3(0, 0, -35), new THREE.Vector3(10, 0, -25), new THREE.Vector3(-10, 0, -20)] },
      { name: "DeathBringer", x: -40, z: -20, color: 0x902010, path: [new THREE.Vector3(-40, 0, -20), new THREE.Vector3(-40, 0, -10), new THREE.Vector3(-30, 0, -15)] },
      { name: "BloodRaven", x: 40, z: 10, color: 0xb03020, path: [new THREE.Vector3(40, 0, 10), new THREE.Vector3(35, 0, 18), new THREE.Vector3(30, 0, 22)] },
    ];

    const enemies: Enemy[] = enemyData.map((d, i) => {
      const mesh = createEnemyMesh(d.color);
      mesh.position.set(d.x, 0, d.z);
      scene.add(mesh);
      return {
        id: i, mesh, hp: 100, maxHp: 100,
        alive: true, name: d.name, team: "T",
        patrolPath: d.path, patrolIdx: 0,
        speed: 2.5 + Math.random() * 1,
        lastShot: 0,
      };
    });
    enemiesRef.current = enemies;

    // Weapon model (arms + gun)
    const weaponGroup = new THREE.Group();
    // Lower arm
    const armGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
    const armMat = new THREE.MeshLambertMaterial({ color: 0xc89060 });
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(0.25, -0.3, -0.4);
    weaponGroup.add(armMesh);
    // Gun body
    const gunBodyGeo = new THREE.BoxGeometry(0.08, 0.16, 0.55);
    const gunBodyMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const gunBody = new THREE.Mesh(gunBodyGeo, gunBodyMat);
    gunBody.position.set(0.2, -0.22, -0.55);
    weaponGroup.add(gunBody);
    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.2, -0.2, -0.85);
    weaponGroup.add(barrel);
    // Magazine
    const magGeo = new THREE.BoxGeometry(0.06, 0.2, 0.1);
    const magMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(0.2, -0.36, -0.58);
    weaponGroup.add(mag);
    weaponGroup.name = "weapon";
    camera.add(weaponGroup);
    scene.add(camera);

    // ── ANIMATION LOOP ──
    let lastTime = 0;

    const animate = (time: number) => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // FPS counter
      frameCount.current++;
      if (time - lastFpsTime.current > 500) {
        setFps(Math.round(frameCount.current / ((time - lastFpsTime.current) / 1000)));
        frameCount.current = 0;
        lastFpsTime.current = time;
      }

      if (!cameraRef.current || !sceneRef.current) return;
      const cam = cameraRef.current;
      const keys = keysRef.current;

      // ── PLAYER MOVEMENT ──
      if (phaseRef.current === "playing" || phaseRef.current === "planted") {
        const spd = agent.speed * 6 * dt;
        const fwd = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
        const right = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));
        const move = new THREE.Vector3();

        if (keys["w"] || keys["arrowup"]) move.addScaledVector(fwd, spd);
        if (keys["s"] || keys["arrowdown"]) move.addScaledVector(fwd, -spd);
        if (keys["a"] || keys["arrowleft"]) move.addScaledVector(right, -spd);
        if (keys["d"] || keys["arrowright"]) move.addScaledVector(right, spd);

        const nx = posRef.current.x + move.x;
        const nz = posRef.current.z + move.z;

        if (!checkCollision(nx, posRef.current.z)) posRef.current.x = nx;
        if (!checkCollision(posRef.current.x, nz)) posRef.current.z = nz;

        // Clamp to map
        posRef.current.x = Math.max(-58, Math.min(58, posRef.current.x));
        posRef.current.z = Math.max(-58, Math.min(58, posRef.current.z));

        // Bobbing
        const moving = move.lengthSq() > 0;
        if (moving) bobRef.current += dt * 8;
        const bobY = moving ? Math.sin(bobRef.current) * 0.06 : 0;
        posRef.current.y = 1.7 + bobY;

        // Apply camera
        cam.position.copy(posRef.current);
        cam.rotation.order = "YXZ";
        cam.rotation.y = yawRef.current;
        cam.rotation.x = pitchRef.current;

        // Weapon bob
        const weaponG = cam.children[0] as THREE.Group;
        if (weaponG) {
          weaponG.position.y = -0.05 + (moving ? Math.sin(bobRef.current * 2) * 0.02 : 0);
          weaponG.position.x = 0 + (moving ? Math.sin(bobRef.current) * 0.01 : 0);
        }

        // ── NEAR BOMB SITE ──
        let nearestSite: "A" | "B" | null = null;
        for (const site of bombSitesRef.current) {
          const dist = posRef.current.distanceTo(site.position);
          if (dist < 6) { nearestSite = site.id; break; }
        }
        setNearSite(nearestSite);
      }

      // ── MOUSE LOOK ──
      if (mouseRef.current.locked) {
        yawRef.current -= mouseRef.current.dx * 0.002;
        pitchRef.current -= mouseRef.current.dy * 0.002;
        pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current));
        mouseRef.current.dx = 0;
        mouseRef.current.dy = 0;
      }

      // ── SHOOT FLASH ──
      if (flashTimerRef.current > 0) {
        flashTimerRef.current -= dt;
        if (shootFlashRef.current) {
          shootFlashRef.current.position.copy(posRef.current);
          shootFlashRef.current.intensity = flashTimerRef.current * 8;
        }
      } else if (shootFlashRef.current) {
        shootFlashRef.current.intensity = 0;
      }

      // ── ENEMY AI ──
      const now = time / 1000;
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue;

        // Patrol
        const target = enemy.patrolPath[enemy.patrolIdx];
        const toTarget = new THREE.Vector3().subVectors(target, enemy.mesh.position);
        toTarget.y = 0;
        if (toTarget.length() < 1.0) {
          enemy.patrolIdx = (enemy.patrolIdx + 1) % enemy.patrolPath.length;
        } else {
          const dir = toTarget.normalize();
          const speed = enemy.speed * dt * 0.4;
          enemy.mesh.position.x += dir.x * speed;
          enemy.mesh.position.z += dir.z * speed;
          enemy.mesh.lookAt(enemy.mesh.position.x + dir.x, enemy.mesh.position.y, enemy.mesh.position.z + dir.z);
        }

        // HP bar face camera
        const hpBg = enemy.mesh.getObjectByName("hpbg") as THREE.Mesh;
        const hpBar = enemy.mesh.getObjectByName("hpbar") as THREE.Mesh;
        if (hpBg && hpBar) {
          hpBg.lookAt(cam.position);
          hpBar.lookAt(cam.position);
          const scale = enemy.hp / enemy.maxHp;
          hpBar.scale.x = Math.max(0, scale);
          (hpBar.material as THREE.MeshBasicMaterial).color.setHex(
            scale > 0.5 ? 0x00ff44 : scale > 0.25 ? 0xffaa00 : 0xff2200
          );
        }

        // Shoot at player
        const distToPlayer = enemy.mesh.position.distanceTo(posRef.current);
        if (distToPlayer < 20 && now - enemy.lastShot > 2.5 + Math.random() * 2) {
          enemy.lastShot = now;
          if (Math.random() > 0.4 && hpRef.current > 0) {
            const dmg = Math.floor(8 + Math.random() * 15);
            hpRef.current = Math.max(0, hpRef.current - dmg);
            setHp(hpRef.current);
            if (hpRef.current <= 0) {
              phaseRef.current = "round_lost";
              setPhase("round_lost");
            }
          }
        }
      }

      // ── SITE PULSE ──
      for (const site of bombSitesRef.current) {
        if (bombSiteRef.current === site.id) {
          (site.mesh.material as THREE.MeshLambertMaterial).color.setHex(0xe02020);
          (site.mesh.material as THREE.MeshLambertMaterial).opacity = 0.4 + Math.sin(time / 200) * 0.15;
        } else {
          (site.mesh.material as THREE.MeshLambertMaterial).color.setHex(0xf5a623);
          (site.mesh.material as THREE.MeshLambertMaterial).opacity = 0.25 + Math.sin(time / 600) * 0.1;
        }
      }

      renderer.render(scene, cam);
    };

    frameRef.current = requestAnimationFrame(animate);

    // ── RESIZE ──
    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── KEYBOARD ──
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === "b") onOpenShop();
      if (e.key.toLowerCase() === "f") handleAction();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      // Stop plant/defuse on release
      if (e.key.toLowerCase() === "f") {
        isPlantingRef.current = false;
        isDefusingRef.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── POINTER LOCK ──
    const onPointerLockChange = () => {
      mouseRef.current.locked = document.pointerLockElement === renderer.domElement;
    };
    document.addEventListener("pointerlockchange", onPointerLockChange);

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.locked) return;
      mouseRef.current.dx += e.movementX;
      mouseRef.current.dy += e.movementY;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onClick = () => {
      if (!mouseRef.current.locked) {
        renderer.domElement.requestPointerLock();
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      renderer.domElement.removeEventListener("click", onClick);
      if (document.pointerLockElement) document.exitPointerLock();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── HANDLE F ACTION ──
  const handleAction = useCallback(() => {
    const site = nearSite;
    if (!site) return;

    if (phaseRef.current === "playing") {
      // Plant
      isPlantingRef.current = true;
      phaseRef.current = "planting";
      setPhase("planting");
      let prog = 0;
      const interval = setInterval(() => {
        if (!isPlantingRef.current) { clearInterval(interval); setPhase("playing"); phaseRef.current = "playing"; plantProgressRef.current = 0; setPlantProgress(0); return; }
        prog += 2.5;
        plantProgressRef.current = prog;
        setPlantProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          isPlantingRef.current = false;
          bombSiteRef.current = site;
          setBombSite(site);
          bombTimerRef.current = 40;
          setBombTimer(40);
          phaseRef.current = "planted";
          setPhase("planted");
          setPlantProgress(0);
          addKillfeed(`💣 Бомба заложена на ${site}!`, "#e02020");
        }
      }, 80);
    } else if (phaseRef.current === "planted" && bombSiteRef.current === site) {
      // Defuse
      isDefusingRef.current = true;
      phaseRef.current = "defusing";
      setPhase("defusing");
      let prog = 0;
      const interval = setInterval(() => {
        if (!isDefusingRef.current) { clearInterval(interval); setPhase("planted"); phaseRef.current = "planted"; defuseProgressRef.current = 0; setDefuseProgress(0); return; }
        prog += 2;
        defuseProgressRef.current = prog;
        setDefuseProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          isDefusingRef.current = false;
          phaseRef.current = "round_won";
          setPhase("round_won");
          setDefuseProgress(0);
          moneyRef.current += 3500;
          setMoney(moneyRef.current);
          setScore(s => ({ ...s, ct: s.ct + 1 }));
          addKillfeed("🔧 Бомба дефузирована! КТ побеждают!", "#00d4aa");
        }
      }, 80);
    }
  }, [nearSite, addKillfeed]);

  // ── SHOOT ──
  const handleShoot = useCallback(() => {
    if (!mouseRef.current.locked) return;
    if (ammoRef.current <= 0) { addKillfeed("⚠️ Нет патронов! [R] Перезарядка", "#f5a623"); return; }
    ammoRef.current--;
    setAmmo(ammoRef.current);
    flashTimerRef.current = 0.08;

    // Crosshair flash
    setCrosshairHit(true);
    setTimeout(() => setCrosshairHit(false), 100);

    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cam);

    // Check enemy hit
    for (const enemy of enemiesRef.current) {
      if (!enemy.alive) continue;
      const hitMeshes = enemy.mesh.children.filter(c => c instanceof THREE.Mesh);
      const intersects = raycaster.intersectObjects(hitMeshes, false);
      if (intersects.length > 0) {
        const isHeadshot = intersects[0].object.geometry instanceof THREE.BoxGeometry &&
          (intersects[0].object as THREE.Mesh).position.y > 1.5;
        const dmg = isHeadshot ? 100 : Math.floor(25 + Math.random() * 30);
        enemy.hp = Math.max(0, enemy.hp - dmg);
        if (enemy.hp <= 0 && enemy.alive) {
          enemy.alive = false;
          enemy.mesh.visible = false;
          killsRef.current++;
          setKills(killsRef.current);
          const reward = isHeadshot ? 350 : 300;
          moneyRef.current += reward;
          setMoney(moneyRef.current);
          addKillfeed(`${isHeadshot ? "🎯 ХЕДШОТ!" : "✓"} ${enemy.name} уничтожен (+$${reward})`, isHeadshot ? "#f5a623" : "#ffffff");

          // Win check
          const allDead = enemiesRef.current.every(e => !e.alive);
          if (allDead) {
            phaseRef.current = "round_won";
            setPhase("round_won");
            setScore(s => ({ ...s, ct: s.ct + 1 }));
            addKillfeed("🏆 ВСЕ ПРОТИВНИКИ УНИЧТОЖЕНЫ! КТ побеждают!", "#00d4aa");
          }
        } else {
          addKillfeed(`${isHeadshot ? "🎯" : "•"} ${enemy.name} ранен (${enemy.hp}/100)`, isHeadshot ? "#f5a623" : "#aaaaaa");
        }
        break;
      }
    }
  }, [addKillfeed]);

  // ── ROUND TIMER ──
  useEffect(() => {
    if (phase !== "playing" && phase !== "planted") return;
    const t = setInterval(() => {
      if (phase === "planted") {
        bombTimerRef.current = Math.max(0, bombTimerRef.current - 1);
        setBombTimer(bombTimerRef.current);
        if (bombTimerRef.current <= 0) {
          phaseRef.current = "round_lost";
          setPhase("round_lost");
          addKillfeed("💥 БОМБА ВЗОРВАЛАСЬ! Террористы победили!", "#e02020");
        }
      } else {
        roundTimeRef.current = Math.max(0, roundTimeRef.current - 1);
        setRoundTime(roundTimeRef.current);
        if (roundTimeRef.current <= 0) {
          phaseRef.current = "round_won";
          setPhase("round_won");
          addKillfeed("⏱ Время вышло! КТ побеждают!", "#4a9eff");
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, addKillfeed]);

  // ── SHOOT LISTENER ──
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) handleShoot();
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [handleShoot]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const resetRound = () => {
    // Reset enemies
    for (const e of enemiesRef.current) {
      e.alive = true;
      e.hp = e.maxHp;
      e.mesh.visible = true;
      e.mesh.position.copy(e.patrolPath[0]);
    }
    // Reset state
    hpRef.current = agent.hp;
    ammoRef.current = 30;
    killsRef.current = 0;
    bombSiteRef.current = null;
    bombTimerRef.current = 40;
    roundTimeRef.current = 115;
    isPlantingRef.current = false;
    isDefusingRef.current = false;
    phaseRef.current = "playing";
    posRef.current.set(0, 1.7, 30);

    setHp(agent.hp);
    setAmmo(30);
    setBombSite(null);
    setBombTimer(40);
    setRoundTime(115);
    setPlantProgress(0);
    setDefuseProgress(0);
    setPhase("playing");
    setKillfeed([]);
    setNearSite(null);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      {/* THREE.JS CANVAS */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* POINTER LOCK OVERLAY */}
      {!mouseRef.current.locked && phase !== "round_won" && phase !== "round_lost" && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/50" onClick={() => rendererRef.current?.domElement.requestPointerLock()}>
          <div className="game-panel p-10 flex flex-col items-center gap-4 animate-fade-in text-center">
            <div className="w-14 h-14 border-2 border-yellow-500/50 flex items-center justify-center">
              <Icon name="MousePointer" size={24} className="text-yellow-400" />
            </div>
            <div className="orbitron text-white font-bold text-xl">НАЖМИ ДЛЯ ИГРЫ</div>
            <div className="rajdhani text-white/50 text-base">Кликни чтобы захватить мышь и начать</div>
            <div className="mono text-white/30 text-xs mt-2">ESC — выйти из режима  |  WASD — движение  |  ЛКМ — выстрел</div>
            <div className="mono text-yellow-400/60 text-xs">F — закладка/дефуз бомбы  |  B — магазин</div>
          </div>
        </div>
      )}

      {/* CROSSHAIR */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <div className={`relative transition-all duration-75 ${crosshairHit ? "scale-150" : "scale-100"}`}>
          <div className={`absolute w-px h-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ top: -14, left: 0 }} />
          <div className={`absolute w-px h-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ bottom: -14, left: 0 }} />
          <div className={`absolute h-px w-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ left: -14, top: 0 }} />
          <div className={`absolute h-px w-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ right: -14, top: 0 }} />
          <div className={`w-1 h-1 rounded-full ${crosshairHit ? "bg-red-400" : "bg-white/60"}`} />
        </div>
      </div>

      {/* ── HUD TOP ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-4 pt-3 pointer-events-none">
        {/* Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0,1,2,3,4].map(i => <div key={i} className="w-2 h-3.5 bg-blue-400" />)}
            </div>
            <span className="orbitron font-bold text-white text-2xl">{score.ct}</span>
          </div>
          <div className="game-panel px-4 py-1.5 flex flex-col items-center min-w-16">
            {phase === "planted" ? (
              <><span className={`orbitron font-black text-2xl ${bombTimer <= 10 ? "text-red-400 animate-pulse-gold" : "text-red-300"}`}>{bombTimer}</span><span className="mono text-red-400/50 text-xs">💣</span></>
            ) : (
              <><span className={`orbitron font-bold text-xl ${roundTime <= 30 ? "text-red-400" : "text-white"}`}>{fmt(roundTime)}</span><span className="mono text-white/25 text-xs">РНД 10</span></>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="orbitron font-bold text-white text-2xl">{score.t}</span>
            <div className="flex gap-0.5">
              {enemiesRef.current.map((e, i) => <div key={i} className={`w-2 h-3.5 ${e.alive ? "bg-red-400" : "bg-red-400/20"}`} />)}
            </div>
          </div>
        </div>

        {/* Bomb planted indicator */}
        {phase === "planted" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 game-panel px-4 py-1.5 border-red-500/40 flex items-center gap-2">
            <span className="text-base animate-pulse-gold">💣</span>
            <span className="orbitron text-red-400 text-xs font-bold tracking-widest">БОМБА НА ТОЧКЕ {bombSite}</span>
          </div>
        )}

        {/* Kill feed */}
        <div className="flex flex-col gap-1">
          {killfeed.map((k, i) => (
            <div key={i} className="game-panel flex items-center gap-2 px-2.5 py-1 max-w-xs">
              <span className="rajdhani text-xs truncate" style={{ color: k.color }}>{k.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HUD BOTTOM ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        {/* Plant/Defuse progress */}
        {(phase === "planting" || phase === "defusing") && (
          <div className="flex justify-center mb-4">
            <div className="game-panel px-8 py-3 flex flex-col items-center gap-2">
              <div className={`orbitron text-sm font-bold ${phase === "planting" ? "text-yellow-400" : "text-green-400"}`}>
                {phase === "planting" ? "ЗАКЛАДКА БОМБЫ" : "ДЕФУЗИРОВАНИЕ"}
              </div>
              <div className="w-56 h-2 bg-white/10 rounded overflow-hidden">
                <div className={`h-full rounded transition-all ${phase === "planting" ? "bg-yellow-400" : "bg-green-400"}`}
                  style={{ width: `${phase === "planting" ? plantProgress : defuseProgress}%` }} />
              </div>
              <div className="mono text-white/35 text-xs">{phase === "planting" ? "УДЕРЖИВАЙТЕ F..." : "НЕ ОТПУСКАЙТЕ F!"}</div>
            </div>
          </div>
        )}

        {/* Near site prompt */}
        {nearSite && phase === "playing" && (
          <div className="flex justify-center mb-4">
            <div className="game-panel px-4 py-2 border-yellow-500/40 flex items-center gap-2 animate-fade-in-fast">
              <span className="text-yellow-400">💣</span>
              <span className="orbitron text-yellow-400 text-xs font-bold">ТОЧКА {nearSite} — [F] ЗАЛОЖИТЬ БОМБУ</span>
            </div>
          </div>
        )}
        {nearSite && phase === "planted" && bombSite === nearSite && (
          <div className="flex justify-center mb-4">
            <div className="game-panel px-4 py-2 border-green-500/40 flex items-center gap-2 animate-fade-in-fast">
              <span className="text-green-400">🔧</span>
              <span className="orbitron text-green-400 text-xs font-bold">ТОЧКА {nearSite} — [F] ДЕФУЗИРОВАТЬ БОМБУ</span>
            </div>
          </div>
        )}

        {/* Main HUD bar */}
        <div className="flex items-end justify-between px-4 pb-4">
          {/* Agent + Stats */}
          <div className="flex items-end gap-4">
            <div className="game-panel p-2 flex flex-col items-center gap-1" style={{ borderColor: agent.color + '60' }}>
              <div className="w-10 h-10 rounded flex items-center justify-center text-xl font-bold" style={{ background: agent.color + '30', color: agent.color }}>
                {agent.name[0]}
              </div>
              <div className="mono text-xs" style={{ color: agent.color }}>{agent.role}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={12} className="text-red-400" />
                <div className="w-28 progress-bar">
                  <div className="progress-fill" style={{ width: `${hp}%`, background: hp > 50 ? "linear-gradient(90deg,#22c55e,#4ade80)" : hp > 25 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#ef4444,#f87171)" }} />
                </div>
                <span className="orbitron font-bold text-white text-lg">{hp}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Shield" size={12} className="text-blue-400" />
                <div className="w-28 progress-bar">
                  <div className="progress-fill" style={{ width: `${armor}%`, background: "linear-gradient(90deg,#3b82f6,#60a5fa)" }} />
                </div>
                <span className="orbitron font-bold text-blue-400 text-sm">{armor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="DollarSign" size={11} className="text-yellow-400/60" />
                <span className="orbitron text-yellow-400 text-sm">${money.toLocaleString()}</span>
                <div className="w-px h-3 bg-white/15" />
                <Icon name="Target" size={11} className="text-white/40" />
                <span className="orbitron text-white/60 text-sm">{kills} убийств</span>
              </div>
            </div>
          </div>

          {/* Abilities */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 flex items-center justify-center border text-xs orbitron font-bold transition-all ${abilityReady ? "border-yellow-500/60 text-yellow-400 bg-yellow-500/10" : "border-white/15 text-white/25"}`}>
                Q
              </div>
              <div className="mono text-white/30 text-xs max-w-20">{agent.ability}</div>
            </div>
            <div className={`flex items-center gap-2`}>
              <div className={`w-10 h-10 flex items-center justify-center border text-xs orbitron font-bold transition-all ${ultReady ? "border-red-500/60 text-red-400 bg-red-500/10 animate-pulse-gold" : "border-white/10 text-white/20"}`}>
                X
              </div>
              <div className="mono text-white/30 text-xs max-w-20">{agent.ult}</div>
            </div>
          </div>

          {/* Ammo */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-end gap-2">
              <span className="orbitron font-black text-white text-4xl">{ammo}</span>
              <span className="orbitron text-white/25 text-xl mb-1">/ 90</span>
            </div>
            <div className="flex gap-0.5 flex-wrap justify-end max-w-32">
              {[...Array(30)].map((_, i) => (
                <div key={i} className={`w-1 h-3.5 ${i < ammo ? "bg-yellow-400" : "bg-white/8"}`} />
              ))}
            </div>
            <div className="rajdhani text-white/45 text-sm tracking-wider">{agentId === "ghost" ? "M4A4" : agentId === "ironwall" ? "AUG" : "AK-47"}</div>
          </div>
        </div>
      </div>

      {/* FPS counter */}
      <div className="absolute top-3 right-4 z-30 mono text-white/25 text-xs pointer-events-none">
        {fps} FPS
      </div>

      {/* Back button */}
      <div className="absolute top-14 left-4 z-30 pointer-events-auto">
        <button className="game-panel px-3 py-1.5 flex items-center gap-2 text-white/35 hover:text-white transition-colors" onClick={onBack}>
          <Icon name="ChevronLeft" size={14} />
          <span className="mono text-xs">МЕНЮ</span>
        </button>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex gap-2">
          <button className="btn-secondary" style={{ clipPath: "none", padding: "5px 12px", fontSize: 10 }} onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); onOpenShop(); }}>[B] МАГАЗИН</button>
          <button className="btn-secondary" style={{ clipPath: "none", padding: "5px 12px", fontSize: 10 }} onClick={handleAction}>[F] ДЕЙСТВИЕ</button>
        </div>
      </div>

      {/* ── ROUND END ── */}
      {(phase === "round_won" || phase === "round_lost") && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="game-panel p-10 flex flex-col items-center gap-5 animate-fade-in text-center max-w-md">
            <div className={`orbitron font-black text-3xl ${phase === "round_won" ? "text-yellow-400" : "text-red-400"}`}>
              {phase === "round_won" ? "КТ ПОБЕДИЛИ!" : "ТЕРРОРИСТЫ ПОБЕДИЛИ!"}
            </div>
            <div className="flex gap-8">
              <div><div className="orbitron text-white text-2xl">{kills}</div><div className="mono text-white/35 text-xs">УБИЙСТВ</div></div>
              <div><div className="orbitron text-yellow-400 text-2xl">${money.toLocaleString()}</div><div className="mono text-white/35 text-xs">ДЕНЬГИ</div></div>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" onClick={() => { resetRound(); onOpenShop(); }}>СЛЕД. РАУНД →</button>
              <button className="btn-secondary" onClick={() => { resetRound(); onBack(); }}>МЕНЮ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

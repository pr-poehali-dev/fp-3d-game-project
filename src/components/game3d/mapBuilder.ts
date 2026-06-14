import * as THREE from "three";
import { BombSite } from "./types";

// ─── MAP BUILDER ─────────────────────────────────────────────────────────────
export function buildMap(scene: THREE.Scene): BombSite[] {
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
  addBox(120, 8, 2, 0, 0, -60, 0x4a3820);
  addBox(120, 8, 2, 0, 0, 60, 0x4a3820);
  addBox(2, 8, 120, -60, 0, 0, 0x4a3820);
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
  addBox(14, 5, 8, -40, 0, -10, 0x5a4028);
  addBox(14, 5, 8, -40, 0, 10, 0x5a4028);
  addBox(14, 5, 8, 38, 0, -8, 0x4a3828);
  addBox(14, 5, 8, 38, 0, 12, 0x4a3828);

  // Mid platform / tower
  addBox(10, 4, 10, 0, 0, 5, 0x6a5030);
  addBox(8, 0.5, 8, 0, 4, 5, 0x3a2010);

  // ── SITE A (northwest) ──
  addBox(18, 5, 2, -38, 0, -28, 0x5a4830);
  addBox(2, 5, 14, -47, 0, -22, 0x5a4830);
  addBox(4, 3, 4, -38, 0, -20, 0x8a6040);
  addBox(4, 2, 4, -34, 0, -24, 0x8a6040);
  addBox(4, 3, 8, -42, 0, -18, 0x7a5030);

  // ── SITE B (east area) ──
  addBox(18, 5, 2, 38, 0, 20, 0x5a4830);
  addBox(2, 5, 14, 47, 0, 14, 0x5a4830);
  addBox(4, 3, 4, 36, 0, 22, 0x8a6040);
  addBox(4, 2, 4, 42, 0, 26, 0x8a6040);
  addBox(8, 3, 4, 38, 0, 14, 0x7a5030);

  // ── COVER OBJECTS ──
  const crateColor = 0x8a6030;
  const cratePositions = [
    [-15, 0, -15], [15, 0, -15], [-15, 0, 15], [18, 0, 18],
    [5, 0, -20], [-5, 0, 20], [25, 0, 0], [-25, 0, 5],
    [10, 0, 30], [-10, 0, -30], [30, 0, -20], [-30, 0, 20],
  ];
  cratePositions.forEach(([x, , z]) => {
    const size = 2 + Math.random() * 1.5;
    addBox(size, size, size, x, 0, z, crateColor + Math.floor(Math.random() * 0x101010));
  });

  // Concrete barriers
  addBox(8, 1.5, 1.5, -5, 0, -5, 0x706050);
  addBox(8, 1.5, 1.5, 5, 0, 5, 0x706050);
  addBox(1.5, 1.5, 8, -10, 0, 8, 0x706050);
  addBox(1.5, 1.5, 8, 12, 0, -8, 0x706050);

  // ── PILLARS ──
  const pillarPositions = [
    [-20, 0, -20], [20, 0, -20], [-20, 0, 20], [20, 0, 20],
    [0, 0, -30], [0, 0, 30],
  ];
  pillarPositions.forEach(([x, , z]) => {
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
  const siteAGeo = new THREE.PlaneGeometry(8, 8);
  const siteAMat = new THREE.MeshLambertMaterial({ color: 0xf5a623, transparent: true, opacity: 0.35 });
  const siteA = new THREE.Mesh(siteAGeo, siteAMat);
  siteA.rotation.x = -Math.PI / 2;
  siteA.position.set(-38, 0.05, -20);
  scene.add(siteA);
  addBox(0.5, 3, 0.5, -38, 0, -20, 0xf5a623);

  const siteBGeo = new THREE.PlaneGeometry(8, 8);
  const siteBMat = new THREE.MeshLambertMaterial({ color: 0xf5a623, transparent: true, opacity: 0.35 });
  const siteB = new THREE.Mesh(siteBGeo, siteBMat);
  siteB.rotation.x = -Math.PI / 2;
  siteB.position.set(38, 0.05, 20);
  scene.add(siteB);
  addBox(0.5, 3, 0.5, 38, 0, 20, 0xf5a623);

  return [
    { id: "A", position: new THREE.Vector3(-38, 0, -20), mesh: siteA },
    { id: "B", position: new THREE.Vector3(38, 0, 20), mesh: siteB },
  ];
}

// ─── ENEMY MESH BUILDER ───────────────────────────────────────────────────────
export function createEnemyMesh(color: number): THREE.Group {
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

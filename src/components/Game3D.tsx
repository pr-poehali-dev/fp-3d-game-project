 
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

import { AGENTS, Enemy, BombSite, GamePhase, checkCollision } from "./game3d/types";
import { buildMap, createEnemyMesh } from "./game3d/mapBuilder";
import GameHUD from "./game3d/GameHUD";

export { AGENTS };

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
  const [abilityReady] = useState(true);
  const [ultReady] = useState(false);
  const [fps, setFps] = useState(60);
  const [mountLocked, setMountLocked] = useState(false);

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
      if (e.key.toLowerCase() === "f") {
        isPlantingRef.current = false;
        isDefusingRef.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── POINTER LOCK ──
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      mouseRef.current.locked = locked;
      setMountLocked(locked);
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

    setCrosshairHit(true);
    setTimeout(() => setCrosshairHit(false), 100);

    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cam);

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

  const resetRound = () => {
    for (const e of enemiesRef.current) {
      e.alive = true;
      e.hp = e.maxHp;
      e.mesh.visible = true;
      e.mesh.position.copy(e.patrolPath[0]);
    }
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

      {/* HUD */}
      <GameHUD
        mountLocked={mountLocked}
        onRequestPointerLock={() => rendererRef.current?.domElement.requestPointerLock()}
        phase={phase}
        hp={hp}
        armor={armor}
        ammo={ammo}
        money={money}
        kills={kills}
        roundTime={roundTime}
        bombTimer={bombTimer}
        plantProgress={plantProgress}
        defuseProgress={defuseProgress}
        nearSite={nearSite}
        bombSite={bombSite}
        score={score}
        killfeed={killfeed}
        crosshairHit={crosshairHit}
        abilityReady={abilityReady}
        ultReady={ultReady}
        fps={fps}
        agent={agent}
        agentId={agentId}
        enemies={enemiesRef.current}
        onBack={onBack}
        onOpenShop={() => { if (document.pointerLockElement) document.exitPointerLock(); onOpenShop(); }}
        onAction={handleAction}
        onResetAndShop={() => { resetRound(); onOpenShop(); }}
        onResetAndBack={() => { resetRound(); onBack(); }}
      />
    </div>
  );
}

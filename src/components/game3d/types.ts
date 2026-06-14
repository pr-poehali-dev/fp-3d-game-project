import * as THREE from "three";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface Enemy {
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

export interface BombSite {
  id: "A" | "B";
  position: THREE.Vector3;
  mesh: THREE.Mesh;
}

export type GamePhase = "playing" | "planting" | "planted" | "defusing" | "round_won" | "round_lost";

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

// ─── COLLISION ───────────────────────────────────────────────────────────────
export const WALL_BOXES = [
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

export function checkCollision(x: number, z: number, radius = 0.5): boolean {
  for (const b of WALL_BOXES) {
    if (x + radius > b.xMin && x - radius < b.xMax && z + radius > b.zMin && z - radius < b.zMax) {
      return true;
    }
  }
  return false;
}

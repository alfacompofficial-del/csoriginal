// Game types and constants
export interface Position {
  x: number;
  y: number;
}

export interface Player {
  pos: Position;
  angle: number;
  health: number;
  armor: number;
  helmet: boolean;
  speed: number;
  weapon: Weapon;
  weapons: Weapon[];
  money: number;
  team: "T" | "CT";
  alive: boolean;
  reloading: boolean;
  reloadTimer: number;
}

export interface Bot {
  id: number;
  pos: Position;
  angle: number;
  health: number;
  armor: number;
  speed: number;
  weapon: Weapon;
  team: "T" | "CT";
  alive: boolean;
  targetPos: Position | null;
  shootTimer: number;
  moveTimer: number;
}

export interface Bullet {
  pos: Position;
  angle: number;
  speed: number;
  damage: number;
  team: "T" | "CT";
  ttl: number;
}

export interface Weapon {
  name: string;
  price: number;
  damage: number;
  fireRate: number;
  reloadTime: number;
  magSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  spread: number;
  auto: boolean;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface GameMap {
  name: string;
  width: number;
  height: number;
  walls: Wall[];
  spawnT: Position[];
  spawnCT: Position[];
  bombSites: { pos: Position; radius: number; label: string }[];
}

export const WEAPONS: Record<string, Weapon> = {
  glock: { name: "Glock-18", price: 200, damage: 18, fireRate: 150, reloadTime: 2200, magSize: 20, currentAmmo: 20, reserveAmmo: 120, spread: 0.06, auto: false },
  usp: { name: "USP-S", price: 200, damage: 22, fireRate: 170, reloadTime: 2200, magSize: 12, currentAmmo: 12, reserveAmmo: 24, spread: 0.04, auto: false },
  deagle: { name: "Desert Eagle", price: 700, damage: 53, fireRate: 400, reloadTime: 2200, magSize: 7, currentAmmo: 7, reserveAmmo: 35, spread: 0.09, auto: false },
  ak47: { name: "AK-47", price: 2700, damage: 27, fireRate: 100, reloadTime: 2500, magSize: 30, currentAmmo: 30, reserveAmmo: 90, spread: 0.07, auto: true },
  m4a4: { name: "M4A4", price: 3100, damage: 23, fireRate: 90, reloadTime: 3100, magSize: 30, currentAmmo: 30, reserveAmmo: 90, spread: 0.05, auto: true },
  awp: { name: "AWP", price: 4750, damage: 115, fireRate: 1500, reloadTime: 3600, magSize: 5, currentAmmo: 5, reserveAmmo: 30, spread: 0.01, auto: false },
  p90: { name: "P90", price: 2350, damage: 16, fireRate: 70, reloadTime: 3400, magSize: 50, currentAmmo: 50, reserveAmmo: 100, spread: 0.08, auto: true },
  mac10: { name: "MAC-10", price: 1050, damage: 17, fireRate: 75, reloadTime: 2600, magSize: 30, currentAmmo: 30, reserveAmmo: 100, spread: 0.09, auto: true },
};

export const DUST2_MAP: GameMap = {
  name: "Dust 2",
  width: 2400,
  height: 1800,
  walls: [
    // Outer walls
    { x: 0, y: 0, w: 2400, h: 30, color: "#4a4a3a" },
    { x: 0, y: 1770, w: 2400, h: 30, color: "#4a4a3a" },
    { x: 0, y: 0, w: 30, h: 1800, color: "#4a4a3a" },
    { x: 2370, y: 0, w: 30, h: 1800, color: "#4a4a3a" },
    
    // Mid area walls
    { x: 1000, y: 30, w: 40, h: 500, color: "#8B7355" },
    { x: 1000, y: 700, w: 40, h: 350, color: "#8B7355" },
    { x: 1350, y: 30, w: 40, h: 400, color: "#8B7355" },
    { x: 1350, y: 600, w: 40, h: 450, color: "#8B7355" },
    
    // Long area
    { x: 200, y: 500, w: 600, h: 40, color: "#6B5B3F" },
    { x: 200, y: 800, w: 500, h: 40, color: "#6B5B3F" },
    
    // B site structures
    { x: 1600, y: 400, w: 200, h: 40, color: "#8B7355" },
    { x: 1800, y: 200, w: 40, h: 280, color: "#8B7355" },
    { x: 1600, y: 700, w: 40, h: 300, color: "#8B7355" },
    { x: 2000, y: 500, w: 40, h: 400, color: "#8B7355" },
    
    // A site structures  
    { x: 300, y: 1100, w: 40, h: 400, color: "#8B7355" },
    { x: 500, y: 1200, w: 300, h: 40, color: "#6B5B3F" },
    { x: 200, y: 1400, w: 400, h: 40, color: "#6B5B3F" },
    
    // Boxes / cover
    { x: 600, y: 300, w: 60, h: 60, color: "#5C4033" },
    { x: 1150, y: 500, w: 80, h: 80, color: "#5C4033" },
    { x: 1700, y: 600, w: 70, h: 70, color: "#5C4033" },
    { x: 400, y: 1350, w: 60, h: 60, color: "#5C4033" },
    { x: 1900, y: 300, w: 60, h: 60, color: "#5C4033" },
    { x: 800, y: 1500, w: 80, h: 60, color: "#5C4033" },
    
    // Mid doors
    { x: 1100, y: 400, w: 200, h: 30, color: "#6B5B3F" },
    { x: 1100, y: 700, w: 200, h: 30, color: "#6B5B3F" },
    
    // CT spawn area
    { x: 400, y: 1600, w: 200, h: 30, color: "#6B5B3F" },
    { x: 800, y: 1600, w: 200, h: 30, color: "#6B5B3F" },
  ],
  spawnT: [
    { x: 2100, y: 100 }, { x: 2200, y: 150 }, { x: 2100, y: 250 },
    { x: 2250, y: 300 }, { x: 2150, y: 400 },
  ],
  spawnCT: [
    { x: 300, y: 1650 }, { x: 450, y: 1700 }, { x: 600, y: 1650 },
    { x: 750, y: 1700 }, { x: 200, y: 1700 },
  ],
  bombSites: [
    { pos: { x: 400, y: 1300 }, radius: 120, label: "A" },
    { pos: { x: 1900, y: 500 }, radius: 120, label: "B" },
  ],
};

export function cloneWeapon(w: Weapon): Weapon {
  return { ...w };
}

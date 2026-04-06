import { useRef, useEffect, useState, useCallback } from "react";
import { Player, Bot, Bullet, WEAPONS, DUST2_MAP, cloneWeapon, GameMap } from "@/game/types";
import { moveWithCollision, updateBots, updateBullets } from "@/game/engine";
import { render, getCamera } from "@/game/renderer";
import WeaponBuyMenu from "./WeaponBuyMenu";

interface GameCanvasProps {
  onExit: () => void;
  mapName?: string;
}

function createInitialPlayer(map: GameMap): Player {
  const spawn = map.spawnCT[0];
  return {
    pos: { ...spawn },
    angle: 0,
    health: 100,
    armor: 0,
    helmet: false,
    speed: 3,
    weapon: cloneWeapon(WEAPONS.usp),
    weapons: [cloneWeapon(WEAPONS.usp)],
    money: 800,
    team: "CT",
    alive: true,
    reloading: false,
    reloadTimer: 0,
  };
}

function createBots(count: number, map: GameMap): Bot[] {
  return Array.from({ length: count }, (_, i) => {
    const spawn = map.spawnT[i % map.spawnT.length];
    return {
      id: i,
      pos: { x: spawn.x + (Math.random() - 0.5) * 40, y: spawn.y + (Math.random() - 0.5) * 40 },
      angle: Math.PI,
      health: 100,
      armor: 50,
      speed: 2,
      weapon: cloneWeapon(WEAPONS.ak47),
      team: "T" as const,
      alive: true,
      targetPos: null,
      shootTimer: 1000 + Math.random() * 2000,
      moveTimer: 0,
    };
  });
}

const GameCanvas = ({ onExit, mapName }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player>(createInitialPlayer(DUST2_MAP));
  const botsRef = useRef<Bot[]>(createBots(5, DUST2_MAP));
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0 });
  const shootingRef = useRef(false);
  const lastShootRef = useRef(0);
  const [showBuyMenu, setShowBuyMenu] = useState(true);
  const [kills, setKills] = useState(0);
  const [roundMessage, setRoundMessage] = useState("ПОКУПКА ОРУЖИЯ — Нажмите B");
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  const buyWeapon = useCallback((weaponKey: string) => {
    const player = playerRef.current;
    const w = WEAPONS[weaponKey];
    if (w && player.money >= w.price) {
      player.money -= w.price;
      const newWeapon = cloneWeapon(w);
      player.weapons.push(newWeapon);
      player.weapon = newWeapon;
    }
  }, []);

  const buyArmor = useCallback((withHelmet: boolean) => {
    const player = playerRef.current;
    const cost = withHelmet ? 1000 : 650;
    if (player.money >= cost) {
      player.money -= cost;
      player.armor = 100;
      if (withHelmet) player.helmet = true;
    }
  }, []);

  const restartRound = useCallback(() => {
    playerRef.current = createInitialPlayer(DUST2_MAP);
    playerRef.current.money = 3200 + kills * 300;
    botsRef.current = createBots(5, DUST2_MAP);
    bulletsRef.current = [];
    setShowBuyMenu(true);
    setRoundMessage("ПОКУПКА ОРУЖИЯ — Нажмите B");
  }, [kills]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "b") setShowBuyMenu(prev => !prev);
      if (e.key.toLowerCase() === "r" && !playerRef.current.alive) restartRound();
      if (e.key.toLowerCase() === "r" && playerRef.current.alive && !playerRef.current.reloading) {
        const p = playerRef.current;
        if (p.weapon.currentAmmo < p.weapon.magSize && p.weapon.reserveAmmo > 0) {
          p.reloading = true;
          p.reloadTimer = p.weapon.reloadTime;
        }
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= playerRef.current.weapons.length) {
        playerRef.current.weapon = playerRef.current.weapons[num - 1];
        playerRef.current.reloading = false;
      }
      if (e.key === "Escape") onExit();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) shootingRef.current = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) shootingRef.current = false;
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);

    const gameLoop = (time: number) => {
      const dt = Math.min(time - (lastTimeRef.current || time), 50);
      lastTimeRef.current = time;
      const player = playerRef.current;
      const bots = botsRef.current;
      const bullets = bulletsRef.current;
      const keys = keysRef.current;
      const map = DUST2_MAP;

      if (player.alive && !showBuyMenu) {
        // Calculate angle from mouse
        const cam = getCamera(player, canvas.width, canvas.height, map);
        const worldMouseX = mouseRef.current.x + cam.x;
        const worldMouseY = mouseRef.current.y + cam.y;
        player.angle = Math.atan2(worldMouseY - player.pos.y, worldMouseX - player.pos.x);

        let dx = 0, dy = 0;
        if (keys.has("w") || keys.has("ц")) dy -= 1;
        if (keys.has("s") || keys.has("ы")) dy += 1;
        if (keys.has("a") || keys.has("ф")) dx -= 1;
        if (keys.has("d") || keys.has("в")) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const mag = Math.sqrt(dx * dx + dy * dy);
          const speed = player.speed * (keys.has("shift") ? 0.5 : 1);
          player.pos = moveWithCollision(player.pos, (dx / mag) * speed, (dy / mag) * speed, 16, map.walls);
        }

        // Reload
        if (player.reloading) {
          player.reloadTimer -= dt;
          if (player.reloadTimer <= 0) {
            const needed = player.weapon.magSize - player.weapon.currentAmmo;
            const available = Math.min(needed, player.weapon.reserveAmmo);
            player.weapon.currentAmmo += available;
            player.weapon.reserveAmmo -= available;
            player.reloading = false;
          }
        }

        // Shooting
        if (shootingRef.current && !player.reloading) {
          const now = performance.now();
          if (now - lastShootRef.current >= player.weapon.fireRate) {
            if (player.weapon.currentAmmo > 0) {
              player.weapon.currentAmmo--;
              const spread = player.weapon.spread * (Math.random() - 0.5);
              bullets.push({
                pos: { x: player.pos.x, y: player.pos.y },
                angle: player.angle + spread,
                speed: 18,
                damage: player.weapon.damage,
                team: player.team,
                ttl: 80,
              });
              lastShootRef.current = now;
              if (!player.weapon.auto) shootingRef.current = false;
            } else if (player.weapon.reserveAmmo > 0) {
              player.reloading = true;
              player.reloadTimer = player.weapon.reloadTime;
            }
          }
        }
      }

      updateBots(bots, player, bullets, map.walls, dt);
      const result = updateBullets(bullets, player, bots, map.walls);
      if (result.killedBots > 0) {
        setKills(prev => prev + result.killedBots);
        player.money += result.killedBots * 300;
      }

      const aliveBots = bots.filter(b => b.alive).length;
      if (aliveBots === 0) {
        setRoundMessage("РАУНД ВЫИГРАН! Нажмите R для нового раунда");
        player.money += 3250;
      }

      // Render 2D
      const camera = getCamera(player, canvas.width, canvas.height, map);
      render(ctx, player, bots, bullets, map, camera, canvas.width, canvas.height);

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [showBuyMenu, kills, restartRound, onExit]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute top-4 left-4 text-white font-bold drop-shadow-md pointer-events-none">
        <div>Убийств: {kills} | Враги: {botsRef.current.filter(b => b.alive).length}/5</div>
        <div className="text-xs text-muted-foreground mt-1">ESC — выход | B — магазин | R — перезарядка</div>
      </div>

      {roundMessage && !showBuyMenu && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 text-yellow-500 font-bold rounded pointer-events-none">
          {roundMessage}
        </div>
      )}

      {showBuyMenu && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <WeaponBuyMenu
            money={playerRef.current.money}
            onBuy={buyWeapon}
            onBuyArmor={buyArmor}
            onClose={() => { setShowBuyMenu(false); setRoundMessage(""); }}
          />
        </div>
      )}

      {!playerRef.current.alive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 text-white pointer-events-none">
          <h1 className="text-6xl font-black mb-4">ВЫ УБИТЫ</h1>
          <p className="text-xl">Нажмите R для рестарта</p>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;

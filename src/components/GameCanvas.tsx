import { useRef, useEffect, useState, useCallback } from "react";
import { Player, Bot, Bullet, WEAPONS, DUST2_MAP, cloneWeapon } from "@/game/types";
import { moveWithCollision, updateBots, updateBullets } from "@/game/engine";
import { Renderer3D } from "@/game/renderer3d";
import WeaponBuyMenu from "./WeaponBuyMenu";

interface GameCanvasProps {
  onExit: () => void;
}

function createInitialPlayer(): Player {
  const spawn = DUST2_MAP.spawnCT[0];
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

function createBots(count: number): Bot[] {
  return Array.from({ length: count }, (_, i) => {
    const spawn = DUST2_MAP.spawnT[i % DUST2_MAP.spawnT.length];
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

const GameCanvas = ({ onExit }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer3dRef = useRef<Renderer3D | null>(null);
  const playerRef = useRef<Player>(createInitialPlayer());
  const botsRef = useRef<Bot[]>(createBots(5));
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
    playerRef.current = createInitialPlayer();
    playerRef.current.money = 3200 + kills * 300;
    botsRef.current = createBots(5);
    bulletsRef.current = [];
    setShowBuyMenu(true);
    setRoundMessage("ПОКУПКА ОРУЖИЯ — Нажмите B");
  }, [kills]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize 3D Renderer
    if (!renderer3dRef.current) {
      renderer3dRef.current = new Renderer3D(canvas);
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderer3dRef.current?.resize(canvas.width, canvas.height);
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
      if (e.key === "Escape") {
        onExit();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      // In 3D we might want to use movementX/Y for first person
      // But for now, keeping the top-down logic or converting to screen pos
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Update player angle based on mouse movement if in pointer lock
      if (document.pointerLockElement === canvas) {
        playerRef.current.angle += e.movementX * 0.005;
      }
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

    canvas.addEventListener("click", () => {
      if (!showBuyMenu) canvas.requestPointerLock();
    });

    const gameLoop = (time: number) => {
      const dt = Math.min(time - (lastTimeRef.current || time), 50);
      lastTimeRef.current = time;
      const player = playerRef.current;
      const bots = botsRef.current;
      const bullets = bulletsRef.current;
      const keys = keysRef.current;
      const map = DUST2_MAP;

      if (player.alive && !showBuyMenu) {
        let dx = 0, dy = 0;
        // Relative movement based on angle
        const moveX = Math.cos(player.angle);
        const moveY = Math.sin(player.angle);
        const sideX = Math.cos(player.angle + Math.PI/2);
        const sideY = Math.sin(player.angle + Math.PI/2);

        if (keys.has("w") || keys.has("ц")) { dx += moveX; dy += moveY; }
        if (keys.has("s") || keys.has("ы")) { dx -= moveX; dy -= moveY; }
        if (keys.has("a") || keys.has("ф")) { dx -= sideX; dy -= sideY; }
        if (keys.has("d") || keys.has("в")) { dx += sideX; dy += sideY; }

        if (dx !== 0 || dy !== 0) {
          const mag = Math.sqrt(dx*dx + dy*dy);
          const speed = player.speed * (keys.has("shift") ? 0.5 : 1);
          player.pos = moveWithCollision(player.pos, (dx/mag) * speed, (dy/mag) * speed, 16, map.walls);
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

      // Render 3D
      if (renderer3dRef.current) {
        renderer3dRef.current.render(player, bots, bullets, map);
      }

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
  }, [showBuyMenu, kills, restartRound, roundMessage, onExit]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* HUD and UI remain in 2D (HTML/React) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 text-white font-bold drop-shadow-md">
          Убийств: {kills} | Враги: {botsRef.current.filter(b => b.alive).length}/5
        </div>

        {roundMessage && !showBuyMenu && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 text-yellow-500 font-bold rounded">
            {roundMessage}
          </div>
        )}

        {/* Crosshair */}
        {playerRef.current.alive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-green-500 rounded-full" />
        )}

        {/* Health/Ammo Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent p-6 flex justify-between items-end pointer-events-auto">
          <div className="flex gap-8 items-end">
            <div className="text-red-500">
              <div className="text-xs uppercase opacity-70">Health</div>
              <div className="text-4xl font-bold">{Math.ceil(playerRef.current.health)}</div>
            </div>
            <div className="text-blue-400">
              <div className="text-xs uppercase opacity-70">Armor</div>
              <div className="text-4xl font-bold">{Math.ceil(playerRef.current.armor)}</div>
            </div>
            <div className="text-green-500">
              <div className="text-xs uppercase opacity-70">Money</div>
              <div className="text-2xl font-bold">${playerRef.current.money}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-yellow-500 text-sm uppercase">{playerRef.current.weapon.name}</div>
            <div className="text-white">
              <span className="text-5xl font-bold">{playerRef.current.weapon.currentAmmo}</span>
              <span className="text-2xl opacity-50 ml-2">/ {playerRef.current.weapon.reserveAmmo}</span>
            </div>
            {playerRef.current.reloading && <div className="text-yellow-500 font-bold animate-pulse">RELOADING...</div>}
          </div>
        </div>
      </div>
      
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 text-white">
          <h1 className="text-6xl font-black mb-4">YOU DIED</h1>
          <p className="text-xl">Press R to restart</p>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;

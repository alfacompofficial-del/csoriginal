import { useRef, useEffect, useState, useCallback } from "react";
import { Player, Bot, Bullet, WEAPONS, DUST2_MAP, cloneWeapon } from "@/game/types";
import { moveWithCollision, updateBots, updateBullets } from "@/game/engine";
import { render, getCamera } from "@/game/renderer";
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
      // Switch weapons with number keys
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
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);

    // Request pointer lock
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
        // Movement
        let dx = 0, dy = 0;
        if (keys.has("w") || keys.has("ц")) dy -= player.speed;
        if (keys.has("s") || keys.has("ы")) dy += player.speed;
        if (keys.has("a") || keys.has("ф")) dx -= player.speed;
        if (keys.has("d") || keys.has("в")) dx += player.speed;
        if (keys.has("shift")) { dx *= 0.5; dy *= 0.5; }

        if (dx !== 0 || dy !== 0) {
          player.pos = moveWithCollision(player.pos, dx, dy, 16, map.walls);
        }

        // Clamp to map
        player.pos.x = Math.max(16, Math.min(map.width - 16, player.pos.x));
        player.pos.y = Math.max(16, Math.min(map.height - 16, player.pos.y));

        // Aim
        const cam = getCamera(player, canvas.width, canvas.height, map);
        const worldX = mouseRef.current.x + cam.x;
        const worldY = mouseRef.current.y + cam.y;
        player.angle = Math.atan2(worldY - player.pos.y, worldX - player.pos.x);

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

      // Update bots
      updateBots(bots, player, bullets, map.walls, dt);

      // Update bullets
      const result = updateBullets(bullets, player, bots, map.walls);
      if (result.killedBots > 0) {
        setKills(prev => prev + result.killedBots);
        player.money += result.killedBots * 300;
      }

      // Check round end
      const aliveBots = bots.filter(b => b.alive).length;
      if (aliveBots === 0) {
        setRoundMessage("РАУНД ВЫИГРАН! Нажмите R для нового раунда");
        player.money += 3250;
      }

      // Render
      const cam = getCamera(player, canvas.width, canvas.height, map);
      render(ctx, player, bots, bullets, map, cam, canvas.width, canvas.height);

      // Round message
      if (roundMessage && !showBuyMenu) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(canvas.width / 2 - 200, 10, 400, 40);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 16px Rajdhani";
        ctx.textAlign = "center";
        ctx.fillText(roundMessage, canvas.width / 2, 36);
      }

      // Kill counter
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 14px Rajdhani";
      ctx.textAlign = "left";
      ctx.fillText(`Убийств: ${kills}  |  Враги: ${aliveBots}/5`, 20, 30);
      ctx.fillText(`ESC — выйти  |  B — магазин  |  R — перезарядка`, 20, 50);

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, [showBuyMenu, kills, restartRound, roundMessage, onExit]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair" />
      
      {showBuyMenu && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <WeaponBuyMenu
            money={playerRef.current.money}
            onBuy={buyWeapon}
            onBuyArmor={buyArmor}
            onClose={() => { setShowBuyMenu(false); setRoundMessage(""); }}
          />
        </div>
      )}
    </div>
  );
};

export default GameCanvas;

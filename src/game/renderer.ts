import { Bot, Bullet, GameMap, Player, Wall } from "./types";

interface Camera {
  x: number;
  y: number;
}

export function getCamera(player: Player, canvasW: number, canvasH: number, map: GameMap): Camera {
  return {
    x: Math.max(0, Math.min(player.pos.x - canvasW / 2, map.width - canvasW)),
    y: Math.max(0, Math.min(player.pos.y - canvasH / 2, map.height - canvasH)),
  };
}

export function render(
  ctx: CanvasRenderingContext2D,
  player: Player,
  bots: Bot[],
  bullets: Bullet[],
  map: GameMap,
  camera: Camera,
  canvasW: number,
  canvasH: number
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Ground
  ctx.fillStyle = "#C2B280";
  ctx.fillRect(0, 0, map.width, map.height);

  // Grid pattern
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < map.width; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, map.height); ctx.stroke();
  }
  for (let y = 0; y < map.height; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(map.width, y); ctx.stroke();
  }

  // Bomb sites
  for (const site of map.bombSites) {
    ctx.beginPath();
    ctx.arc(site.pos.x, site.pos.y, site.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 80, 80, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 80, 80, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255, 80, 80, 0.6)";
    ctx.font = "bold 24px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText(site.label, site.pos.x, site.pos.y + 8);
  }

  // Walls
  for (const wall of map.walls) {
    ctx.fillStyle = wall.color;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    // 3D effect
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(wall.x, wall.y + wall.h - 4, wall.w, 4);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(wall.x, wall.y, wall.w, 3);
  }

  // Bullets
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    // Trail
    ctx.beginPath();
    ctx.moveTo(b.pos.x, b.pos.y);
    ctx.lineTo(b.pos.x - Math.cos(b.angle) * 10, b.pos.y - Math.sin(b.angle) * 10);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Bots
  for (const bot of bots) {
    if (!bot.alive) continue;
    // Body
    ctx.beginPath();
    ctx.arc(bot.pos.x, bot.pos.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = bot.team === "T" ? "#D4A047" : "#4A90D9";
    ctx.fill();
    ctx.strokeStyle = bot.team === "T" ? "#8B6914" : "#2C5F9E";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Direction indicator
    ctx.beginPath();
    ctx.moveTo(bot.pos.x, bot.pos.y);
    ctx.lineTo(bot.pos.x + Math.cos(bot.angle) * 20, bot.pos.y + Math.sin(bot.angle) * 20);
    ctx.strokeStyle = bot.team === "T" ? "#FFD700" : "#87CEEB";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Health bar
    const hpPct = bot.health / 100;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bot.pos.x - 15, bot.pos.y - 24, 30, 5);
    ctx.fillStyle = hpPct > 0.5 ? "#4CAF50" : hpPct > 0.25 ? "#FF9800" : "#F44336";
    ctx.fillRect(bot.pos.x - 15, bot.pos.y - 24, 30 * hpPct, 5);
  }

  // Player
  if (player.alive) {
    // Body
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = player.team === "CT" ? "#4A90D9" : "#D4A047";
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Weapon line
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(player.pos.x + Math.cos(player.angle) * 28, player.pos.y + Math.sin(player.angle) * 28);
    ctx.strokeStyle = "#DDD";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();

  // HUD
  drawHUD(ctx, player, canvasW, canvasH);
}

function drawHUD(ctx: CanvasRenderingContext2D, player: Player, w: number, h: number) {
  // Bottom bar
  const barH = 60;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, h - barH, w, barH);

  // Health
  ctx.fillStyle = "#F44336";
  ctx.font = "bold 14px Rajdhani";
  ctx.textAlign = "left";
  ctx.fillText("❤", 20, h - barH + 25);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(40, h - barH + 12, 150, 18);
  ctx.fillStyle = player.health > 50 ? "#4CAF50" : player.health > 25 ? "#FF9800" : "#F44336";
  ctx.fillRect(40, h - barH + 12, Math.max(0, (player.health / 100) * 150), 18);
  ctx.fillStyle = "#FFF";
  ctx.font = "bold 14px Rajdhani";
  ctx.fillText(`${Math.ceil(player.health)}`, 50, h - barH + 27);

  // Armor
  ctx.fillStyle = "#2196F3";
  ctx.fillText("🛡", 20, h - barH + 48);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(40, h - barH + 35, 150, 18);
  ctx.fillStyle = "#2196F3";
  ctx.fillRect(40, h - barH + 35, Math.max(0, (player.armor / 100) * 150), 18);
  ctx.fillStyle = "#FFF";
  ctx.fillText(`${Math.ceil(player.armor)}`, 50, h - barH + 50);

  // Weapon & Ammo
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 18px Rajdhani";
  ctx.textAlign = "right";
  ctx.fillText(player.weapon.name, w - 20, h - barH + 25);
  ctx.fillStyle = "#FFF";
  ctx.font = "bold 22px Rajdhani";
  ctx.fillText(`${player.weapon.currentAmmo}`, w - 80, h - barH + 50);
  ctx.fillStyle = "#999";
  ctx.font = "16px Rajdhani";
  ctx.fillText(`/ ${player.weapon.reserveAmmo}`, w - 20, h - barH + 50);

  // Money
  ctx.fillStyle = "#4CAF50";
  ctx.font = "bold 16px Rajdhani";
  ctx.textAlign = "center";
  ctx.fillText(`$${player.money}`, w / 2, h - barH + 27);

  // Reloading indicator
  if (player.reloading) {
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 16px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText("ПЕРЕЗАРЯДКА...", w / 2, h - barH - 10);
  }

  // Crosshair
  if (player.alive) {
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    const gap = 4, size = 12;
    ctx.beginPath(); ctx.moveTo(cx - gap - size, cy); ctx.lineTo(cx - gap, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + size, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - gap - size); ctx.lineTo(cx, cy - gap); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + gap + size); ctx.stroke();
  }

  // Dead screen
  if (!player.alive) {
    ctx.fillStyle = "rgba(139, 0, 0, 0.4)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#FF4444";
    ctx.font = "bold 48px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText("ВЫ УБИТЫ", w / 2, h / 2 - 20);
    ctx.fillStyle = "#FFF";
    ctx.font = "20px Rajdhani";
    ctx.fillText("Нажмите R для рестарта", w / 2, h / 2 + 20);
  }
}

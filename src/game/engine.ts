import { Bot, Bullet, GameMap, Player, Position, Wall } from "./types";

export function lineIntersectsWall(
  x1: number, y1: number, x2: number, y2: number, wall: Wall
): boolean {
  // Check if a line segment intersects an axis-aligned rectangle
  const left = wall.x, right = wall.x + wall.w;
  const top = wall.y, bottom = wall.y + wall.h;

  // Cohen-Sutherland clipping simplified
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;

  for (const [p, q] of [[-dx, x1 - left], [dx, right - x1], [-dy, y1 - top], [dy, bottom - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) { if (t > tmax) return false; tmin = Math.max(tmin, t); }
      else { if (t < tmin) return false; tmax = Math.min(tmax, t); }
    }
  }
  return tmin <= tmax;
}

export function rectCollision(
  x: number, y: number, r: number, wall: Wall
): boolean {
  const cx = Math.max(wall.x, Math.min(x, wall.x + wall.w));
  const cy = Math.max(wall.y, Math.min(y, wall.y + wall.h));
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

export function moveWithCollision(
  pos: Position, dx: number, dy: number, radius: number, walls: Wall[]
): Position {
  let newX = pos.x + dx;
  let newY = pos.y + dy;

  for (const wall of walls) {
    if (rectCollision(newX, pos.y, radius, wall)) {
      newX = pos.x;
    }
  }
  for (const wall of walls) {
    if (rectCollision(newX, newY, radius, wall)) {
      newY = pos.y;
    }
  }

  return { x: newX, y: newY };
}

export function updateBots(
  bots: Bot[],
  player: Player,
  bullets: Bullet[],
  walls: Wall[],
  dt: number
) {
  for (const bot of bots) {
    if (!bot.alive) continue;

    // Check if can see player
    const toPlayer = {
      x: player.pos.x - bot.pos.x,
      y: player.pos.y - bot.pos.y,
    };
    const dist = Math.sqrt(toPlayer.x ** 2 + toPlayer.y ** 2);
    const canSeePlayer = player.alive && !walls.some(w =>
      lineIntersectsWall(bot.pos.x, bot.pos.y, player.pos.x, player.pos.y, w)
    );

    if (canSeePlayer && player.alive) {
      // Aim at player
      bot.angle = Math.atan2(toPlayer.y, toPlayer.x);

      // Shoot
      bot.shootTimer -= dt;
      if (bot.shootTimer <= 0 && dist < 800) {
        const spread = 0.08;
        const angle = bot.angle + (Math.random() - 0.5) * spread;
        bullets.push({
          pos: { x: bot.pos.x, y: bot.pos.y },
          angle,
          speed: 15,
          damage: 15 + Math.random() * 10,
          team: bot.team,
          ttl: 60,
        });
        bot.shootTimer = 300 + Math.random() * 400;
      }

      // Strafe while fighting
      if (dist > 200) {
        const moveAngle = bot.angle + (Math.random() > 0.5 ? 0.3 : -0.3);
        const newPos = moveWithCollision(
          bot.pos,
          Math.cos(moveAngle) * bot.speed * dt * 0.003,
          Math.sin(moveAngle) * bot.speed * dt * 0.003,
          12,
          walls
        );
        bot.pos = newPos;
      }
    } else {
      // Patrol
      bot.moveTimer -= dt;
      if (bot.moveTimer <= 0 || !bot.targetPos) {
        bot.targetPos = {
          x: 100 + Math.random() * 2200,
          y: 100 + Math.random() * 1600,
        };
        bot.moveTimer = 2000 + Math.random() * 3000;
      }

      const toTarget = {
        x: bot.targetPos.x - bot.pos.x,
        y: bot.targetPos.y - bot.pos.y,
      };
      const targetDist = Math.sqrt(toTarget.x ** 2 + toTarget.y ** 2);

      if (targetDist > 20) {
        bot.angle = Math.atan2(toTarget.y, toTarget.x);
        const newPos = moveWithCollision(
          bot.pos,
          (toTarget.x / targetDist) * bot.speed * dt * 0.003,
          (toTarget.y / targetDist) * bot.speed * dt * 0.003,
          12,
          walls
        );
        bot.pos = newPos;
      }
    }
  }
}

export function updateBullets(
  bullets: Bullet[],
  player: Player,
  bots: Bot[],
  walls: Wall[]
): { killedBots: number } {
  let killedBots = 0;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.pos.x += Math.cos(b.angle) * b.speed;
    b.pos.y += Math.sin(b.angle) * b.speed;
    b.ttl--;

    // Wall collision
    const hitWall = walls.some(w => rectCollision(b.pos.x, b.pos.y, 3, w));
    if (hitWall || b.ttl <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Hit player
    if (b.team !== player.team && player.alive) {
      const dx = b.pos.x - player.pos.x, dy = b.pos.y - player.pos.y;
      if (dx * dx + dy * dy < 16 * 16) {
        let dmg = b.damage;
        if (player.armor > 0) {
          const absorbed = dmg * 0.5;
          player.armor = Math.max(0, player.armor - absorbed);
          dmg -= absorbed;
        }
        player.health -= dmg;
        if (player.health <= 0) {
          player.health = 0;
          player.alive = false;
        }
        bullets.splice(i, 1);
        continue;
      }
    }

    // Hit bots
    for (const bot of bots) {
      if (!bot.alive || b.team === bot.team) continue;
      const dx = b.pos.x - bot.pos.x, dy = b.pos.y - bot.pos.y;
      if (dx * dx + dy * dy < 14 * 14) {
        let dmg = b.damage;
        if (bot.armor > 0) {
          const absorbed = dmg * 0.4;
          bot.armor = Math.max(0, bot.armor - absorbed);
          dmg -= absorbed;
        }
        bot.health -= dmg;
        if (bot.health <= 0) {
          bot.health = 0;
          bot.alive = false;
          killedBots++;
        }
        bullets.splice(i, 1);
        break;
      }
    }
  }

  return { killedBots };
}

import { Player, Enemy, Powerup, WeaponType, WEAPONS } from '@/types/game';
import { castRay, isLineOfSight, CELL_SIZE, FOV, MAX_DEPTH } from './raycaster';

const wallColorCache = new Map<number, string>();

const getWallColor = (brightness: number): string => {
  const key = Math.floor(brightness * 100);
  const cached = wallColorCache.get(key);
  if (cached) return cached;
  
  const gray = Math.floor(brightness * 100 + 50);
  const color = `rgb(${gray}, ${Math.floor(gray * 0.7)}, ${Math.floor(gray * 0.5)})`;
  wallColorCache.set(key, color);
  return color;
};

interface SpriteData {
  x: number;
  distance: number;
  size: number;
  type: 'enemy' | 'powerup';
  data: Enemy | Powerup;
}

export const renderGame = (
  canvas: HTMLCanvasElement | null,
  player: Player,
  enemies: Enemy[],
  powerups: Powerup[],
  worldMap: number[][],
  shooting: boolean,
  weaponRecoil: number,
  walkCycle: number
) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const numRays = 240;

  ctx.fillStyle = '#0a0505';
  ctx.fillRect(0, 0, width, height / 2);

  ctx.fillStyle = '#1a0f0a';
  ctx.fillRect(0, height / 2, width, height / 2);

  const zBuffer: number[] = new Array(numRays).fill(Infinity);
  const rayWidth = width / numRays;

  for (let ray = 0; ray < numRays; ray++) {
    const rayAngle = player.angle - FOV / 2 + (ray / numRays) * FOV;
    const { distance, hitWall } = castRay(player, rayAngle, worldMap);

    if (hitWall) {
      const perpDistance = distance * Math.cos(rayAngle - player.angle);
      zBuffer[ray] = perpDistance;
      
      const wallHeight = (CELL_SIZE / perpDistance) * 400;
      const brightness = Math.max(0, 1 - perpDistance / (MAX_DEPTH * CELL_SIZE));
      
      ctx.fillStyle = getWallColor(brightness);
      ctx.fillRect(
        ray * rayWidth,
        (height - wallHeight) / 2,
        Math.ceil(rayWidth),
        wallHeight
      );
    }
  }

  const sprites: SpriteData[] = [];

  powerups.forEach((powerup) => {
    if (!powerup.active) return;

    const dx = powerup.x - player.x;
    const dy = powerup.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (!isLineOfSight(player.x, player.y, powerup.x, powerup.y, worldMap)) {
      return;
    }

    const angle = Math.atan2(dy, dx) - player.angle;
    let normalizedAngle = angle;
    while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

    if (Math.abs(normalizedAngle) < FOV / 2 + 0.2 && distance < MAX_DEPTH * CELL_SIZE) {
      const screenX = (normalizedAngle / FOV + 0.5) * width;
      const size = (CELL_SIZE / distance) * 300;
      sprites.push({ x: screenX, distance, size, type: 'powerup', data: powerup });
    }
  });

  enemies.forEach((enemy) => {
    if (!enemy.active) return;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!isLineOfSight(player.x, player.y, enemy.x, enemy.y, worldMap)) {
      return;
    }

    const angle = Math.atan2(dy, dx) - player.angle;
    let normalizedAngle = angle;
    while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

    if (Math.abs(normalizedAngle) < FOV / 2 + 0.2 && distance < MAX_DEPTH * CELL_SIZE) {
      const screenX = (normalizedAngle / FOV + 0.5) * width;
      const size = (CELL_SIZE / distance) * 400;
      sprites.push({ x: screenX, distance, size, type: 'enemy', data: enemy });
    }
  });

  sprites.sort((a, b) => b.distance - a.distance);

  sprites.forEach((sprite) => {
    const rayIndex = Math.floor((sprite.x / width) * numRays);
    if (rayIndex >= 0 && rayIndex < numRays && sprite.distance < zBuffer[rayIndex]) {
      if (sprite.type === 'enemy') {
        const enemy = sprite.data as Enemy;
        drawEnemy(ctx, sprite.x, height / 2, sprite.size, enemy);
      } else {
        const powerup = sprite.data as Powerup;
        drawPowerup(ctx, sprite.x, height / 2, sprite.size, powerup);
      }
    }
  });

  drawWeapon(ctx, width, height, walkCycle, weaponRecoil, shooting, player.weaponType);

  ctx.strokeStyle = '#FF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 10, height / 2);
  ctx.lineTo(width / 2 + 10, height / 2);
  ctx.moveTo(width / 2, height / 2 - 10);
  ctx.lineTo(width / 2, height / 2 + 10);
  ctx.stroke();
};

const drawEnemy = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  enemy: Enemy
) => {
  const headSize = size * 0.35;
  const bodyWidth = size * 0.5;
  const bodyHeight = size * 0.4;
  const legHeight = size * 0.25;
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - bodyWidth / 2, y - size / 2 + headSize, bodyWidth, bodyHeight);
  
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.arc(x, y - size / 2 + headSize / 2, headSize / 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FF4444';
  const eyeSize = headSize * 0.15;
  ctx.fillRect(x - headSize * 0.2, y - size / 2 + headSize / 2 - eyeSize / 2, eyeSize, eyeSize);
  ctx.fillRect(x + headSize * 0.05, y - size / 2 + headSize / 2 - eyeSize / 2, eyeSize, eyeSize);
  
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(x - bodyWidth / 4, y - size / 2 + headSize + bodyHeight, bodyWidth / 5, legHeight);
  ctx.fillRect(x + bodyWidth / 20, y - size / 2 + headSize + bodyHeight, bodyWidth / 5, legHeight);
  
  const gunLength = size * 0.3;
  const gunWidth = size * 0.08;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x + bodyWidth / 2, y - size / 2 + headSize + bodyHeight * 0.3, gunLength, gunWidth);
  
  const healthBarWidth = size * 0.6;
  const healthBarHeight = 4;
  const healthPercent = enemy.health / enemy.maxHealth;
  
  ctx.fillStyle = '#333';
  ctx.fillRect(x - healthBarWidth / 2, y - size / 2 - 10, healthBarWidth, healthBarHeight);
  
  ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFAA00' : '#FF4444';
  ctx.fillRect(x - healthBarWidth / 2, y - size / 2 - 10, healthBarWidth * healthPercent, healthBarHeight);
};

const drawPowerup = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  powerup: Powerup
) => {
  const s = size * 0.5;
  
  switch (powerup.type) {
    case 'health':
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(x - s / 2, y - s * 0.2, s, s * 0.4);
      ctx.fillRect(x - s * 0.2, y - s / 2, s * 0.4, s);
      break;
    case 'ammo':
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.fillStyle = '#FF8800';
      ctx.fillRect(x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.6);
      break;
    case 'armor':
      ctx.fillStyle = '#0088FF';
      ctx.beginPath();
      ctx.moveTo(x, y - s / 2);
      ctx.lineTo(x + s / 2, y);
      ctx.lineTo(x, y + s / 2);
      ctx.lineTo(x - s / 2, y);
      ctx.closePath();
      ctx.fill();
      break;
    case 'weapon':
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(x - s / 2, y - s * 0.15, s, s * 0.3);
      ctx.fillRect(x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.15);
      break;
  }
};

const drawWeapon = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  walkCycle: number,
  weaponRecoil: number,
  shooting: boolean,
  weaponType: WeaponType
) => {
  const weaponX = width / 2;
  const weaponY = height - 100 + Math.sin(walkCycle) * 8 - weaponRecoil * (WEAPONS[weaponType].recoil * 25);
  
  switch (weaponType) {
    case 'pistol':
      drawPistol(ctx, weaponX, weaponY, shooting);
      break;
    case 'shotgun':
      drawShotgun(ctx, weaponX, weaponY, shooting);
      break;
    case 'rifle':
      drawRifle(ctx, weaponX, weaponY, shooting);
      break;
  }
};

const drawPistol = (ctx: CanvasRenderingContext2D, x: number, y: number, shooting: boolean) => {
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(x - 40, y, 80, 60);
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 35, y + 10, 70, 15);
  
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(x - 8, y - 30, 16, 30);
  
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(x - 12, y + 25, 24, 8);
  
  if (shooting) {
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x - 6, y - 40, 12, 15);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x - 4, y - 50, 8, 12);
  }
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 40, y, 80, 60);
};

const drawShotgun = (ctx: CanvasRenderingContext2D, x: number, y: number, shooting: boolean) => {
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(x - 60, y, 120, 70);
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 55, y + 15, 110, 20);
  
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(x - 10, y - 35, 20, 35);
  
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(x - 55, y + 40, 40, 10);
  ctx.fillRect(x + 15, y + 40, 40, 10);
  
  ctx.fillStyle = '#666';
  ctx.fillRect(x - 50, y + 5, 100, 8);
  ctx.fillRect(x - 50, y + 50, 100, 8);
  
  if (shooting) {
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x - 8, y - 45, 16, 20);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x - 12, y - 60, 24, 18);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(x - 6, y - 72, 12, 12);
  }
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 60, y, 120, 70);
};

const drawRifle = (ctx: CanvasRenderingContext2D, x: number, y: number, shooting: boolean) => {
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(x - 70, y, 140, 65);
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 65, y + 12, 130, 18);
  
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(x - 10, y - 32, 20, 32);
  
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(x - 18, y + 28, 36, 10);
  
  ctx.fillStyle = '#666';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x - 60 + i * 25, y + 42, 18, 6);
  }
  
  ctx.fillStyle = '#333';
  ctx.fillRect(x - 65, y + 5, 15, 8);
  
  if (shooting) {
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x - 6, y - 42, 12, 15);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x - 4, y - 52, 8, 12);
  }
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 70, y, 140, 65);
};

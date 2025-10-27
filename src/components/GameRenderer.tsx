import { MutableRefObject } from 'react';
import { Player, Enemy, NUM_RAYS, FOV, MAX_DEPTH, CELL_SIZE, castRay } from './GameEngine';
import { Powerup, renderPowerup } from './Powerups';

export const drawWeapon = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  walkCycle: number,
  weaponRecoil: number,
  shooting: boolean
) => {
  const weaponX = width / 2;
  const weaponY = height - 100 + Math.sin(walkCycle) * 10 - weaponRecoil * 20;
  const weaponWidth = 120;
  const weaponHeight = 80;

  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(weaponX - weaponWidth / 2, weaponY, weaponWidth, weaponHeight);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(weaponX - weaponWidth / 2 + 10, weaponY + 10, weaponWidth - 20, 20);

  ctx.fillStyle = '#8B0000';
  ctx.fillRect(weaponX - 10, weaponY - 40, 20, 40);

  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(weaponX - 15, weaponY + 30, 30, 10);

  ctx.fillStyle = '#666';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(weaponX - weaponWidth / 2 + 20 + i * 25, weaponY + 45, 15, 8);
  }

  if (shooting) {
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(weaponX - 8, weaponY - 50, 16, 20);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(weaponX - 5, weaponY - 60, 10, 15);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(weaponX - 3, weaponY - 70, 6, 10);
  }

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(weaponX - weaponWidth / 2, weaponY, weaponWidth, weaponHeight);
};

const wallColorCache = new Map<number, string>();

const getWallColor = (brightness: number): string => {
  const key = Math.floor(brightness * 100);
  if (wallColorCache.has(key)) {
    return wallColorCache.get(key)!;
  }
  const gray = Math.floor(brightness * 100 + 50);
  const color = `rgb(${gray}, ${Math.floor(gray * 0.7)}, ${Math.floor(gray * 0.5)})`;
  wallColorCache.set(key, color);
  return color;
};

export const renderGame = (
  canvas: HTMLCanvasElement | null,
  playerRef: MutableRefObject<Player>,
  enemies: Enemy[],
  powerups: Powerup[],
  shooting: boolean,
  weaponRecoil: number,
  walkCycle: number
) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = '#1a0f0a';
  ctx.fillRect(0, 0, width, height / 2);

  ctx.fillStyle = '#2d1810';
  ctx.fillRect(0, height / 2, width, height / 2);

  const playerAngle = playerRef.current.angle;
  const rayWidth = width / NUM_RAYS;

  for (let ray = 0; ray < NUM_RAYS; ray++) {
    const rayAngle = playerAngle - FOV / 2 + (ray / NUM_RAYS) * FOV;
    const { distance, hitWall } = castRay(playerRef, rayAngle);

    if (hitWall) {
      const perpDistance = distance * Math.cos(rayAngle - playerAngle);
      const wallHeight = (CELL_SIZE / perpDistance) * 277;
      const brightness = Math.max(0, 1 - perpDistance / (MAX_DEPTH * CELL_SIZE));
      
      ctx.fillStyle = getWallColor(brightness);
      ctx.fillRect(
        ray * rayWidth,
        (height - wallHeight) / 2,
        rayWidth + 1,
        wallHeight
      );
    }
  }

  powerups.forEach((powerup) => {
    renderPowerup(
      ctx,
      powerup,
      playerRef.current.x,
      playerRef.current.y,
      playerRef.current.angle,
      width,
      height,
      FOV,
      MAX_DEPTH,
      CELL_SIZE
    );
  });

  enemies.forEach((enemy) => {
    if (!enemy.active) return;

    const dx = enemy.x - playerRef.current.x;
    const dy = enemy.y - playerRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) - playerRef.current.angle;
    
    let normalizedAngle = angle;
    while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

    if (Math.abs(normalizedAngle) < FOV / 2 && distance < MAX_DEPTH * CELL_SIZE) {
      const enemyScreenX = (normalizedAngle / FOV + 0.5) * width;
      const enemySize = (CELL_SIZE / distance) * 400;
      
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(
        enemyScreenX - enemySize / 2,
        height / 2 - enemySize / 2,
        enemySize,
        enemySize
      );
      
      ctx.fillStyle = '#FF4444';
      const eyeSize = enemySize * 0.15;
      ctx.fillRect(
        enemyScreenX - enemySize * 0.2,
        height / 2 - enemySize * 0.1,
        eyeSize,
        eyeSize
      );
      ctx.fillRect(
        enemyScreenX + enemySize * 0.05,
        height / 2 - enemySize * 0.1,
        eyeSize,
        eyeSize
      );
    }
  });

  drawWeapon(ctx, width, height, walkCycle, weaponRecoil, shooting);

  ctx.strokeStyle = '#FF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 10, height / 2);
  ctx.lineTo(width / 2 + 10, height / 2);
  ctx.moveTo(width / 2, height / 2 - 10);
  ctx.lineTo(width / 2, height / 2 + 10);
  ctx.stroke();
};
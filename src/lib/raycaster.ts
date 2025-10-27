import { Player } from '@/types/game';

export const CELL_SIZE = 64;
export const FOV = Math.PI / 3;
export const MAX_DEPTH = 20;

export interface RayHit {
  distance: number;
  hitWall: boolean;
  x?: number;
  y?: number;
}

export const castRay = (
  player: Player,
  angle: number,
  worldMap: number[][]
): RayHit => {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  let distance = 0;
  const stepSize = 2;
  const mapHeight = worldMap.length;
  const mapWidth = worldMap[0]?.length || 0;

  while (distance < MAX_DEPTH * CELL_SIZE) {
    const x = player.x + rayDirX * distance;
    const y = player.y + rayDirY * distance;
    const mapX = Math.floor(x / CELL_SIZE);
    const mapY = Math.floor(y / CELL_SIZE);

    if (
      mapX < 0 ||
      mapX >= mapWidth ||
      mapY < 0 ||
      mapY >= mapHeight ||
      worldMap[mapY][mapX] === 1
    ) {
      return { distance, hitWall: true, x, y };
    }

    distance += stepSize;
  }

  return { distance: MAX_DEPTH * CELL_SIZE, hitWall: false };
};

export const isLineOfSight = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  worldMap: number[][]
): boolean => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(distance / 8);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    const mapX = Math.floor(x / CELL_SIZE);
    const mapY = Math.floor(y / CELL_SIZE);
    
    if (
      mapY < 0 ||
      mapY >= worldMap.length ||
      mapX < 0 ||
      mapX >= worldMap[0].length ||
      worldMap[mapY][mapX] === 1
    ) {
      return false;
    }
  }
  
  return true;
};

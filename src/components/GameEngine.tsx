import { MutableRefObject } from 'react';

export interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  ammo: number;
}

export interface Enemy {
  x: number;
  y: number;
  health: number;
  active: boolean;
}

export const MAP_SIZE = 8;
export const CELL_SIZE = 64;
export const FOV = Math.PI / 3;
export const MAX_DEPTH = 10;
export const NUM_RAYS = 120;

export const worldMap = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

export const castRay = (
  playerRef: MutableRefObject<Player>,
  angle: number
): { distance: number; hitWall: boolean } => {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  let distance = 0;

  while (distance < MAX_DEPTH * CELL_SIZE) {
    distance += 1;
    const testX = playerRef.current.x + rayDirX * distance;
    const testY = playerRef.current.y + rayDirY * distance;
    const mapX = Math.floor(testX / CELL_SIZE);
    const mapY = Math.floor(testY / CELL_SIZE);

    if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) {
      return { distance, hitWall: true };
    }

    if (worldMap[mapY][mapX] === 1) {
      return { distance, hitWall: true };
    }
  }

  return { distance: MAX_DEPTH * CELL_SIZE, hitWall: false };
};

export const updateGameLogic = (
  player: Player,
  enemies: Enemy[],
  keysPressed: MutableRefObject<Set<string>>,
  paused: boolean,
  gameOver: boolean,
  setPlayer: React.Dispatch<React.SetStateAction<Player>>,
  setWalkCycle: React.Dispatch<React.SetStateAction<number>>,
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (paused || gameOver) return;

  const moveSpeed = 3;
  let newX = player.x;
  let newY = player.y;
  let moving = false;

  if (keysPressed.current.has('w')) {
    newX += Math.cos(player.angle) * moveSpeed;
    newY += Math.sin(player.angle) * moveSpeed;
    moving = true;
  }
  if (keysPressed.current.has('s')) {
    newX -= Math.cos(player.angle) * moveSpeed;
    newY -= Math.sin(player.angle) * moveSpeed;
    moving = true;
  }
  if (keysPressed.current.has('a')) {
    newX += Math.cos(player.angle - Math.PI / 2) * moveSpeed;
    newY += Math.sin(player.angle - Math.PI / 2) * moveSpeed;
    moving = true;
  }
  if (keysPressed.current.has('d')) {
    newX += Math.cos(player.angle + Math.PI / 2) * moveSpeed;
    newY += Math.sin(player.angle + Math.PI / 2) * moveSpeed;
    moving = true;
  }

  if (moving) {
    setWalkCycle((prev) => prev + 0.2);
  }

  const mapX = Math.floor(newX / CELL_SIZE);
  const mapY = Math.floor(newY / CELL_SIZE);

  if (
    mapX >= 0 &&
    mapX < MAP_SIZE &&
    mapY >= 0 &&
    mapY < MAP_SIZE &&
    worldMap[mapY][mapX] === 0
  ) {
    setPlayer((prev) => ({ ...prev, x: newX, y: newY }));
  }

  enemies.forEach((enemy) => {
    if (!enemy.active) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < CELL_SIZE * 0.5) {
      setPlayer((prev) => {
        const newHealth = prev.health - 5;
        if (newHealth <= 0) {
          setGameOver(true);
        }
        return { ...prev, health: Math.max(0, newHealth) };
      });
    }

    if (distance > CELL_SIZE) {
      const moveSpeed = 1;
      const newEnemyX = enemy.x + (dx / distance) * moveSpeed;
      const newEnemyY = enemy.y + (dy / distance) * moveSpeed;
      const enemyMapX = Math.floor(newEnemyX / CELL_SIZE);
      const enemyMapY = Math.floor(newEnemyY / CELL_SIZE);

      if (
        enemyMapX >= 0 &&
        enemyMapX < MAP_SIZE &&
        enemyMapY >= 0 &&
        enemyMapY < MAP_SIZE &&
        worldMap[enemyMapY][enemyMapX] === 0
      ) {
        enemy.x = newEnemyX;
        enemy.y = newEnemyY;
      }
    }
  });
};

export const handleShoot = (
  player: Player,
  enemies: Enemy[],
  paused: boolean,
  gameOver: boolean,
  setPlayer: React.Dispatch<React.SetStateAction<Player>>,
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>,
  setShooting: React.Dispatch<React.SetStateAction<boolean>>,
  setWeaponRecoil: React.Dispatch<React.SetStateAction<number>>,
  setScore: React.Dispatch<React.SetStateAction<number>>
) => {
  if (player.ammo <= 0 || paused || gameOver) return;

  setShooting(true);
  setWeaponRecoil(1);
  setPlayer((prev) => ({ ...prev, ammo: prev.ammo - 1 }));

  setTimeout(() => setShooting(false), 100);
  setTimeout(() => setWeaponRecoil(0), 150);

  let hitEnemy = false;
  const updatedEnemies = enemies.map((enemy) => {
    if (!enemy.active || hitEnemy) return enemy;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) - player.angle;
    
    let normalizedAngle = angle;
    while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

    if (Math.abs(normalizedAngle) < 0.1 && distance < 5 * CELL_SIZE) {
      hitEnemy = true;
      const newHealth = enemy.health - 50;
      if (newHealth <= 0) {
        setScore((prev) => prev + 100);
        return { ...enemy, active: false };
      }
      return { ...enemy, health: newHealth };
    }
    return enemy;
  });

  setEnemies(updatedEnemies);
};

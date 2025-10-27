import { MutableRefObject } from 'react';

export interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  ammo: number;
  maxHealth: number;
  maxAmmo: number;
  kills: number;
  armor: number;
}

export interface Enemy {
  x: number;
  y: number;
  health: number;
  active: boolean;
  lastAttackTime: number;
}

export const MAP_SIZE = 10;
export const CELL_SIZE = 64;
export const FOV = Math.PI / 3;
export const MAX_DEPTH = 10;
export const NUM_RAYS = 120;

export const worldMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const castRay = (
  playerRef: MutableRefObject<Player>,
  angle: number
): { distance: number; hitWall: boolean } => {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  let distance = 0;
  const stepSize = 4;

  while (distance < MAX_DEPTH * CELL_SIZE) {
    distance += stepSize;
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

  const moveSpeed = 3.5;
  const diagonalSpeed = moveSpeed * 0.707;
  let moveX = 0;
  let moveY = 0;
  let moving = false;

  const forward = keysPressed.current.has('w');
  const backward = keysPressed.current.has('s');
  const left = keysPressed.current.has('a');
  const right = keysPressed.current.has('d');

  if (forward && !backward) {
    moveX += Math.cos(player.angle);
    moveY += Math.sin(player.angle);
    moving = true;
  }
  if (backward && !forward) {
    moveX -= Math.cos(player.angle);
    moveY -= Math.sin(player.angle);
    moving = true;
  }
  if (left && !right) {
    moveX += Math.cos(player.angle - Math.PI / 2);
    moveY += Math.sin(player.angle - Math.PI / 2);
    moving = true;
  }
  if (right && !left) {
    moveX += Math.cos(player.angle + Math.PI / 2);
    moveY += Math.sin(player.angle + Math.PI / 2);
    moving = true;
  }

  if (moving) {
    const speed = (forward || backward) && (left || right) ? diagonalSpeed : moveSpeed;
    const length = Math.sqrt(moveX * moveX + moveY * moveY);
    if (length > 0) {
      moveX = (moveX / length) * speed;
      moveY = (moveY / length) * speed;
    }

    const newX = player.x + moveX;
    const newY = player.y + moveY;
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
    
    setWalkCycle((prev) => prev + 0.25);
  }

  enemies.forEach((enemy) => {
    if (!enemy.active) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < CELL_SIZE * 0.5) {
      const now = Date.now();
      if (now - enemy.lastAttackTime > 1000) {
        enemy.lastAttackTime = now;
        setPlayer((prev) => {
          const damage = Math.max(1, 10 - prev.armor);
          const newHealth = prev.health - damage;
          if (newHealth <= 0) {
            setGameOver(true);
          }
          return { ...prev, health: Math.max(0, newHealth) };
        });
      }
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
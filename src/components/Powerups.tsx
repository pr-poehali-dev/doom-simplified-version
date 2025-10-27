import { Player, CELL_SIZE } from './GameEngine';

export interface Powerup {
  x: number;
  y: number;
  type: 'health' | 'ammo' | 'armor';
  active: boolean;
  rotation: number;
}

export const checkPowerupCollision = (
  player: Player,
  powerups: Powerup[],
  setPowerups: React.Dispatch<React.SetStateAction<Powerup[]>>,
  setPlayer: React.Dispatch<React.SetStateAction<Player>>
) => {
  powerups.forEach((powerup) => {
    if (!powerup.active) return;

    const dx = player.x - powerup.x;
    const dy = player.y - powerup.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < CELL_SIZE * 0.4) {
      setPowerups((prev) =>
        prev.map((p) =>
          p === powerup ? { ...p, active: false } : p
        )
      );

      setPlayer((prev) => {
        switch (powerup.type) {
          case 'health':
            return { ...prev, health: Math.min(prev.maxHealth, prev.health + 30) };
          case 'ammo':
            return { ...prev, ammo: Math.min(prev.maxAmmo, prev.ammo + 20) };
          case 'armor':
            return { ...prev, armor: Math.min(5, prev.armor + 2) };
          default:
            return prev;
        }
      });
    }
  });
};

export const renderPowerup = (
  ctx: CanvasRenderingContext2D,
  powerup: Powerup,
  playerX: number,
  playerY: number,
  playerAngle: number,
  width: number,
  height: number,
  fov: number,
  maxDepth: number,
  cellSize: number
) => {
  if (!powerup.active) return;

  const dx = powerup.x - playerX;
  const dy = powerup.y - playerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) - playerAngle;

  let normalizedAngle = angle;
  while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
  while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

  if (Math.abs(normalizedAngle) < fov / 2 && distance < maxDepth * cellSize) {
    const screenX = (normalizedAngle / fov + 0.5) * width;
    const size = (cellSize / distance) * 200;

    const colors = {
      health: '#00FF00',
      ammo: '#FFFF00',
      armor: '#0088FF',
    };

    ctx.save();
    ctx.translate(screenX, height / 2);
    ctx.rotate(powerup.rotation);

    ctx.fillStyle = colors[powerup.type];
    ctx.fillRect(-size / 2, -size / 2, size, size);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    ctx.restore();
  }
};

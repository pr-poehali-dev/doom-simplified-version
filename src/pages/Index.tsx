import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  ammo: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  active: boolean;
}

const MAP_SIZE = 8;
const CELL_SIZE = 64;
const FOV = Math.PI / 3;
const MAX_DEPTH = 10;
const NUM_RAYS = 120;

const worldMap = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<Player>({
    x: 1.5 * CELL_SIZE,
    y: 1.5 * CELL_SIZE,
    angle: 0,
    health: 100,
    ammo: 50,
  });
  const [enemies, setEnemies] = useState<Enemy[]>([
    { x: 4.5 * CELL_SIZE, y: 2.5 * CELL_SIZE, health: 100, active: true },
    { x: 5.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true },
    { x: 2.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true },
  ]);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shooting, setShooting] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());

  const castRay = (angle: number): { distance: number; hitWall: boolean } => {
    const rayDirX = Math.cos(angle);
    const rayDirY = Math.sin(angle);
    let distance = 0;

    while (distance < MAX_DEPTH * CELL_SIZE) {
      distance += 1;
      const testX = player.x + rayDirX * distance;
      const testY = player.y + rayDirY * distance;
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

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, width, height / 2);

    ctx.fillStyle = '#2d1810';
    ctx.fillRect(0, height / 2, width, height / 2);

    for (let ray = 0; ray < NUM_RAYS; ray++) {
      const rayAngle = player.angle - FOV / 2 + (ray / NUM_RAYS) * FOV;
      const { distance, hitWall } = castRay(rayAngle);

      if (hitWall) {
        const perpDistance = distance * Math.cos(rayAngle - player.angle);
        const wallHeight = (CELL_SIZE / perpDistance) * 277;
        const brightness = Math.max(0, 1 - perpDistance / (MAX_DEPTH * CELL_SIZE));
        const gray = Math.floor(brightness * 100 + 50);
        
        ctx.fillStyle = `rgb(${gray}, ${gray * 0.7}, ${gray * 0.5})`;
        ctx.fillRect(
          (ray / NUM_RAYS) * width,
          (height - wallHeight) / 2,
          width / NUM_RAYS + 1,
          wallHeight
        );
      }
    }

    enemies.forEach((enemy) => {
      if (!enemy.active) return;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) - player.angle;
      
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

    if (shooting) {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
      ctx.fillRect(width / 2 - 5, height / 2 - 5, 10, 10);
      ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
      ctx.fillRect(width / 2 - 3, height / 2 - 3, 6, 6);
    }

    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height / 2);
    ctx.lineTo(width / 2 + 10, height / 2);
    ctx.moveTo(width / 2, height / 2 - 10);
    ctx.lineTo(width / 2, height / 2 + 10);
    ctx.stroke();
  };

  const shoot = () => {
    if (player.ammo <= 0 || paused || gameOver) return;

    setShooting(true);
    setPlayer((prev) => ({ ...prev, ammo: prev.ammo - 1 }));

    setTimeout(() => setShooting(false), 100);

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

  const updateGame = () => {
    if (paused || gameOver) return;

    const moveSpeed = 3;
    const rotSpeed = 0.05;
    let newX = player.x;
    let newY = player.y;
    let newAngle = player.angle;

    if (keysPressed.current.has('w')) {
      newX += Math.cos(player.angle) * moveSpeed;
      newY += Math.sin(player.angle) * moveSpeed;
    }
    if (keysPressed.current.has('s')) {
      newX -= Math.cos(player.angle) * moveSpeed;
      newY -= Math.sin(player.angle) * moveSpeed;
    }
    if (keysPressed.current.has('a')) {
      newAngle -= rotSpeed;
    }
    if (keysPressed.current.has('d')) {
      newAngle += rotSpeed;
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
      setPlayer((prev) => ({ ...prev, x: newX, y: newY, angle: newAngle }));
    } else {
      setPlayer((prev) => ({ ...prev, angle: newAngle }));
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        keysPressed.current.add(key);
      }
      if (key === 'escape') {
        setPaused((prev) => !prev);
      }
      if (key === ' ') {
        e.preventDefault();
        shoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    const handleClick = () => {
      shoot();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick);
    };
  }, [player.ammo, paused, gameOver, enemies]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateGame();
      render();
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [player, enemies, paused, gameOver, shooting]);

  const restart = () => {
    setPlayer({
      x: 1.5 * CELL_SIZE,
      y: 1.5 * CELL_SIZE,
      angle: 0,
      health: 100,
      ammo: 50,
    });
    setEnemies([
      { x: 4.5 * CELL_SIZE, y: 2.5 * CELL_SIZE, health: 100, active: true },
      { x: 5.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true },
      { x: 2.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true },
    ]);
    setScore(0);
    setGameOver(false);
    setPaused(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0604] flex items-center justify-center p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-[#8B0000] shadow-2xl"
          style={{ imageRendering: 'pixelated' }}
        />

        <div className="absolute top-4 left-4 font-mono text-[#FF4444] space-y-2 pointer-events-none">
          <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
            <Icon name="Heart" size={16} className="inline mr-2" />
            ЗДОРОВЬЕ: {player.health}%
          </div>
          <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
            <Icon name="Zap" size={16} className="inline mr-2" />
            ПАТРОНЫ: {player.ammo}
          </div>
          <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
            <Icon name="Target" size={16} className="inline mr-2" />
            СЧЁТ: {score}
          </div>
        </div>

        <div className="absolute top-4 right-4 font-mono text-[#999] text-sm bg-black/80 px-3 py-2 border border-[#8B0000] pointer-events-none">
          <div>WASD - движение</div>
          <div>Мышь / Пробел - стрельба</div>
          <div>ESC - пауза</div>
        </div>

        {paused && !gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
            <div className="text-[#FF4444] font-mono text-4xl mb-8 tracking-wider">
              ПАУЗА
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => setPaused(false)}
                className="w-48 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
              >
                ПРОДОЛЖИТЬ
              </Button>
              <Button
                onClick={restart}
                className="w-48 bg-[#4a4a4a] hover:bg-[#666] text-white font-mono text-lg block"
              >
                РЕСТАРТ
              </Button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
            <div className="text-[#FF4444] font-mono text-5xl mb-4 tracking-wider animate-pulse">
              GAME OVER
            </div>
            <div className="text-[#999] font-mono text-2xl mb-8">
              СЧЁТ: {score}
            </div>
            <Button
              onClick={restart}
              className="w-48 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
            >
              РЕСТАРТ
            </Button>
          </div>
        )}

        {enemies.filter((e) => e.active).length === 0 && !gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
            <div className="text-[#FF4444] font-mono text-5xl mb-4 tracking-wider">
              ПОБЕДА!
            </div>
            <div className="text-[#999] font-mono text-2xl mb-8">
              СЧЁТ: {score}
            </div>
            <Button
              onClick={restart}
              className="w-48 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
            >
              НОВАЯ ИГРА
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

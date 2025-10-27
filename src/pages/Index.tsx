import { useState, useEffect, useRef } from 'react';
import { Player, Enemy, CELL_SIZE, updateGameLogic, handleShoot } from '@/components/GameEngine';
import { Powerup, checkPowerupCollision } from '@/components/Powerups';
import { renderGame } from '@/components/GameRenderer';
import { GameHUD } from '@/components/GameHUD';
import { GameMenus } from '@/components/GameMenus';
import { MiniMap } from '@/components/MiniMap';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<Player>({
    x: 1.5 * CELL_SIZE,
    y: 1.5 * CELL_SIZE,
    angle: 0,
    health: 100,
    ammo: 50,
    maxHealth: 100,
    maxAmmo: 100,
    kills: 0,
    armor: 0,
  });
  const [enemies, setEnemies] = useState<Enemy[]>([
    { x: 4.5 * CELL_SIZE, y: 2.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
    { x: 5.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
    { x: 2.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
    { x: 7.5 * CELL_SIZE, y: 3.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
    { x: 3.5 * CELL_SIZE, y: 7.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
  ]);
  const [powerups, setPowerups] = useState<Powerup[]>([
    { x: 3.5 * CELL_SIZE, y: 3.5 * CELL_SIZE, type: 'health', active: true, rotation: 0 },
    { x: 6.5 * CELL_SIZE, y: 6.5 * CELL_SIZE, type: 'ammo', active: true, rotation: 0 },
    { x: 2.5 * CELL_SIZE, y: 7.5 * CELL_SIZE, type: 'armor', active: true, rotation: 0 },
    { x: 7.5 * CELL_SIZE, y: 2.5 * CELL_SIZE, type: 'health', active: true, rotation: 0 },
  ]);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [weaponRecoil, setWeaponRecoil] = useState(0);
  const [walkCycle, setWalkCycle] = useState(0);
  const [pointerLocked, setPointerLocked] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef(player);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    const activeEnemies = enemies.filter((e) => e.active).length;
    const initialEnemies = 5;
    const kills = initialEnemies - activeEnemies;
    setPlayer((prev) => ({ ...prev, kills }));
  }, [enemies]);

  const shoot = () => {
    handleShoot(
      player,
      enemies,
      paused,
      gameOver,
      setPlayer,
      setEnemies,
      setShooting,
      setWeaponRecoil,
      setScore
    );
  };

  const updateGame = () => {
    updateGameLogic(
      player,
      enemies,
      keysPressed,
      paused,
      gameOver,
      setPlayer,
      setWalkCycle,
      setGameOver
    );

    checkPowerupCollision(player, powerups, setPowerups, setPlayer);

    setPowerups((prev) =>
      prev.map((p) => ({ ...p, rotation: p.rotation + 0.05 }))
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
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
      if (!pointerLocked && containerRef.current) {
        containerRef.current.requestPointerLock();
      } else {
        shoot();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!pointerLocked || paused || gameOver) return;
      
      const sensitivity = 0.003;
      const angleChange = e.movementX * sensitivity;
      
      setPlayer((prev) => ({
        ...prev,
        angle: prev.angle + angleChange,
      }));
    };

    const handlePointerLockChange = () => {
      setPointerLocked(document.pointerLockElement === containerRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [player.ammo, paused, gameOver, enemies, pointerLocked]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        updateGame();
        renderGame(canvasRef.current, playerRef, enemies, powerups, shooting, weaponRecoil, walkCycle);
        lastTime = currentTime - (deltaTime % frameTime);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [player, enemies, powerups, paused, gameOver, shooting, weaponRecoil, walkCycle]);

  const restart = () => {
    setPlayer({
      x: 1.5 * CELL_SIZE,
      y: 1.5 * CELL_SIZE,
      angle: 0,
      health: 100,
      ammo: 50,
      maxHealth: 100,
      maxAmmo: 100,
      kills: 0,
      armor: 0,
    });
    setEnemies([
      { x: 4.5 * CELL_SIZE, y: 2.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
      { x: 5.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
      { x: 2.5 * CELL_SIZE, y: 5.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
      { x: 7.5 * CELL_SIZE, y: 3.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
      { x: 3.5 * CELL_SIZE, y: 7.5 * CELL_SIZE, health: 100, active: true, lastAttackTime: 0 },
    ]);
    setPowerups([
      { x: 3.5 * CELL_SIZE, y: 3.5 * CELL_SIZE, type: 'health', active: true, rotation: 0 },
      { x: 6.5 * CELL_SIZE, y: 6.5 * CELL_SIZE, type: 'ammo', active: true, rotation: 0 },
      { x: 2.5 * CELL_SIZE, y: 7.5 * CELL_SIZE, type: 'armor', active: true, rotation: 0 },
      { x: 7.5 * CELL_SIZE, y: 2.5 * CELL_SIZE, type: 'health', active: true, rotation: 0 },
    ]);
    setScore(0);
    setGameOver(false);
    setPaused(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0604] flex items-center justify-center p-4">
      <div ref={containerRef} className="relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-[#8B0000] shadow-2xl"
          style={{ imageRendering: 'pixelated' }}
        />

        <GameHUD 
          health={player.health} 
          maxHealth={player.maxHealth}
          ammo={player.ammo} 
          maxAmmo={player.maxAmmo}
          score={score} 
          kills={player.kills}
          armor={player.armor}
        />

        <MiniMap player={player} enemies={enemies} />

        <GameMenus
          pointerLocked={pointerLocked}
          paused={paused}
          gameOver={gameOver}
          score={score}
          enemiesLeft={enemies.filter((e) => e.active).length}
          onContinue={() => setPaused(false)}
          onRestart={restart}
        />
      </div>
    </div>
  );
};

export default Index;
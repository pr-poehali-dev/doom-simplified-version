import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Enemy, Powerup, Bullet, WeaponType, WEAPONS } from '@/types/game';
import { LEVELS } from '@/data/levels';
import { renderGame } from '@/lib/renderer';
import { castRay, isLineOfSight, CELL_SIZE } from '@/lib/raycaster';
import { GameHUD } from '@/components/GameHUD';
import { GameMenus } from '@/components/GameMenus';
import { MiniMap } from '@/components/MiniMap';
import { MobileControls } from '@/components/MobileControls';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const level = LEVELS[currentLevel];
  
  const [player, setPlayer] = useState<Player>({
    x: level.playerStart.x,
    y: level.playerStart.y,
    angle: 0,
    health: 100,
    ammo: 50,
    maxHealth: 100,
    maxAmmo: 100,
    kills: 0,
    armor: 0,
    weaponType: 'pistol',
  });
  
  const [enemies, setEnemies] = useState<Enemy[]>(
    level.enemyPositions.map((pos) => ({
      x: pos.x,
      y: pos.y,
      health: 100,
      maxHealth: 100,
      active: true,
      lastAttackTime: 0,
      lastShootTime: 0,
      weaponType: pos.weapon,
      spriteFrame: 0,
    }))
  );
  
  const [powerups, setPowerups] = useState<Powerup[]>(
    level.powerupPositions.map((pos) => ({
      x: pos.x,
      y: pos.y,
      type: pos.type,
      active: true,
      weaponType: pos.weaponType,
    }))
  );
  
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [weaponRecoil, setWeaponRecoil] = useState(0);
  const [walkCycle, setWalkCycle] = useState(0);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [lastShootTime, setLastShootTime] = useState(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const mobileMove = useRef({ x: 0, y: 0 });

  const loadLevel = useCallback((levelIndex: number) => {
    if (levelIndex >= LEVELS.length) {
      return;
    }
    
    const newLevel = LEVELS[levelIndex];
    setCurrentLevel(levelIndex);
    setPlayer({
      x: newLevel.playerStart.x,
      y: newLevel.playerStart.y,
      angle: 0,
      health: 100,
      ammo: 50,
      maxHealth: 100,
      maxAmmo: 100,
      kills: 0,
      armor: 0,
      weaponType: 'pistol',
    });
    setEnemies(
      newLevel.enemyPositions.map((pos) => ({
        x: pos.x,
        y: pos.y,
        health: 100,
        maxHealth: 100,
        active: true,
        lastAttackTime: 0,
        lastShootTime: 0,
        weaponType: pos.weapon,
        spriteFrame: 0,
      }))
    );
    setPowerups(
      newLevel.powerupPositions.map((pos) => ({
        x: pos.x,
        y: pos.y,
        type: pos.type,
        active: true,
        weaponType: pos.weaponType,
      }))
    );
    setBullets([]);
    setGameOver(false);
    setPaused(false);
    setLevelComplete(false);
  }, []);

  const shoot = useCallback(() => {
    if (player.ammo <= 0 || paused || gameOver) return;

    const now = Date.now();
    const weapon = WEAPONS[player.weaponType];
    if (now - lastShootTime < weapon.fireRate) return;

    setLastShootTime(now);
    setShooting(true);
    setWeaponRecoil(1);
    setPlayer((prev) => ({ ...prev, ammo: Math.max(0, prev.ammo - weapon.ammoPerShot) }));

    setTimeout(() => setShooting(false), 100);
    setTimeout(() => setWeaponRecoil(0), weapon.fireRate / 2);

    const newBullets: Bullet[] = [];
    for (let i = 0; i < weapon.bulletsPerShot; i++) {
      const spread = (Math.random() - 0.5) * weapon.spread;
      const angle = player.angle + spread;
      newBullets.push({
        x: player.x,
        y: player.y,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        damage: weapon.damage,
        fromEnemy: false,
        active: true,
      });
    }
    setBullets((prev) => [...prev, ...newBullets]);
  }, [player, paused, gameOver, lastShootTime]);

  const updateBullets = useCallback(() => {
    setBullets((prevBullets) => {
      const updated = prevBullets.map((bullet) => {
        if (!bullet.active) return bullet;

        const newX = bullet.x + bullet.dirX * 15;
        const newY = bullet.y + bullet.dirY * 15;
        const mapX = Math.floor(newX / CELL_SIZE);
        const mapY = Math.floor(newY / CELL_SIZE);

        if (
          mapX < 0 ||
          mapX >= level.map[0].length ||
          mapY < 0 ||
          mapY >= level.map.length ||
          level.map[mapY][mapX] === 1
        ) {
          return { ...bullet, active: false };
        }

        if (bullet.fromEnemy) {
          const dx = newX - player.x;
          const dy = newY - player.y;
          if (Math.sqrt(dx * dx + dy * dy) < CELL_SIZE * 0.3) {
            setPlayer((prev) => {
              const damage = Math.max(1, bullet.damage - prev.armor);
              const newHealth = prev.health - damage;
              if (newHealth <= 0) {
                setGameOver(true);
              }
              return { ...prev, health: Math.max(0, newHealth) };
            });
            return { ...bullet, active: false };
          }
        } else {
          let hit = false;
          setEnemies((prevEnemies) =>
            prevEnemies.map((enemy) => {
              if (!enemy.active || hit) return enemy;
              const dx = newX - enemy.x;
              const dy = newY - enemy.y;
              if (Math.sqrt(dx * dx + dy * dy) < CELL_SIZE * 0.3) {
                hit = true;
                const newHealth = enemy.health - bullet.damage;
                if (newHealth <= 0) {
                  setScore((prev) => prev + 100);
                  setPlayer((prev) => ({ ...prev, kills: prev.kills + 1 }));
                  return { ...enemy, active: false };
                }
                return { ...enemy, health: newHealth };
              }
              return enemy;
            })
          );
          if (hit) {
            return { ...bullet, active: false };
          }
        }

        return { ...bullet, x: newX, y: newY };
      });

      return updated.filter((b) => b.active);
    });
  }, [level, player.x, player.y]);

  const updateEnemies = useCallback(() => {
    const now = Date.now();
    const updatedBullets: Bullet[] = [];

    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy) => {
        if (!enemy.active) return enemy;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CELL_SIZE * 0.5) {
          if (now - enemy.lastAttackTime > 1000) {
            const newEnemy = { ...enemy, lastAttackTime: now };
            setPlayer((prev) => {
              const damage = Math.max(1, 15 - prev.armor);
              const newHealth = prev.health - damage;
              if (newHealth <= 0) {
                setGameOver(true);
              }
              return { ...prev, health: Math.max(0, newHealth) };
            });
            return newEnemy;
          }
          return enemy;
        }

        if (distance < CELL_SIZE * 8 && isLineOfSight(enemy.x, enemy.y, player.x, player.y, level.map)) {
          if (now - enemy.lastShootTime > 2000) {
            const angle = Math.atan2(dy, dx);
            updatedBullets.push({
              x: enemy.x,
              y: enemy.y,
              dirX: Math.cos(angle),
              dirY: Math.sin(angle),
              damage: 10,
              fromEnemy: true,
              active: true,
            });
            return { ...enemy, lastShootTime: now };
          }
        }

        return enemy;
      })
    );

    if (updatedBullets.length > 0) {
      setBullets((prev) => [...prev, ...updatedBullets]);
    }
  }, [player.x, player.y, level.map]);

  const updatePowerups = useCallback(() => {
    setPowerups((prevPowerups) =>
      prevPowerups.map((powerup) => {
        if (!powerup.active) return powerup;

        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CELL_SIZE * 0.5) {
          setPlayer((prev) => {
            switch (powerup.type) {
              case 'health':
                return { ...prev, health: Math.min(prev.maxHealth, prev.health + 30) };
              case 'ammo':
                return { ...prev, ammo: Math.min(prev.maxAmmo, prev.ammo + 20) };
              case 'armor':
                return { ...prev, armor: Math.min(10, prev.armor + 2) };
              case 'weapon':
                return { ...prev, weaponType: powerup.weaponType || 'pistol' };
              default:
                return prev;
            }
          });
          return { ...powerup, active: false };
        }

        return powerup;
      })
    );
  }, [player.x, player.y]);

  const updatePlayerMovement = useCallback(() => {
    if (paused || gameOver) return;

    const forward = keysPressed.current.has('w') || keysPressed.current.has('arrowup');
    const backward = keysPressed.current.has('s') || keysPressed.current.has('arrowdown');
    const left = keysPressed.current.has('a') || keysPressed.current.has('arrowleft');
    const right = keysPressed.current.has('d') || keysPressed.current.has('arrowright');

    let moveX = mobileMove.current.x;
    let moveY = mobileMove.current.y;
    let moving = Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1;

    if (forward) {
      moveX += Math.cos(player.angle);
      moveY -= Math.sin(player.angle);
      moving = true;
    }
    if (backward) {
      moveX -= Math.cos(player.angle);
      moveY += Math.sin(player.angle);
      moving = true;
    }
    if (left) {
      moveX += Math.cos(player.angle - Math.PI / 2);
      moveY += Math.sin(player.angle - Math.PI / 2);
      moving = true;
    }
    if (right) {
      moveX += Math.cos(player.angle + Math.PI / 2);
      moveY += Math.sin(player.angle + Math.PI / 2);
      moving = true;
    }

    if (moving) {
      const speed = 3;
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
        mapX < level.map[0].length &&
        mapY >= 0 &&
        mapY < level.map.length &&
        level.map[mapY][mapX] === 0
      ) {
        setPlayer((prev) => ({ ...prev, x: newX, y: newY }));
      }

      setWalkCycle((prev) => prev + 0.2);
    }
  }, [player, paused, gameOver, level.map]);

  useEffect(() => {
    const activeEnemies = enemies.filter((e) => e.active).length;
    if (activeEnemies === 0 && !levelComplete && !gameOver) {
      setLevelComplete(true);
    }
  }, [enemies, levelComplete, gameOver]);

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
      if (key === 'q' || key === 'e') {
        setPlayer((prev) => {
          const weapons: WeaponType[] = ['pistol', 'shotgun', 'rifle'];
          const currentIndex = weapons.indexOf(prev.weaponType);
          const nextIndex = (currentIndex + 1) % weapons.length;
          return { ...prev, weaponType: weapons[nextIndex] };
        });
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
  }, [pointerLocked, paused, gameOver, shoot]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        updatePlayerMovement();
        updateBullets();
        updateEnemies();
        updatePowerups();
        renderGame(canvasRef.current, player, enemies, powerups, level.map, shooting, weaponRecoil, walkCycle);
        lastTime = currentTime - (deltaTime % frameTime);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [player, enemies, powerups, shooting, weaponRecoil, walkCycle, updatePlayerMovement, updateBullets, updateEnemies, updatePowerups, level.map]);

  const restart = () => {
    loadLevel(currentLevel);
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      loadLevel(currentLevel + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0604] flex items-center justify-center p-4">
      <div ref={containerRef} className="relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="border-4 border-[#8B0000] shadow-2xl max-w-full"
          style={{ imageRendering: 'auto' }}
        />

        <GameHUD
          health={player.health}
          maxHealth={player.maxHealth}
          ammo={player.ammo}
          maxAmmo={player.maxAmmo}
          score={score}
          kills={player.kills}
          armor={player.armor}
          weaponType={player.weaponType}
          levelName={level.name}
        />

        <MiniMap player={player} enemies={enemies} worldMap={level.map} />

        <GameMenus
          pointerLocked={pointerLocked}
          paused={paused}
          gameOver={gameOver}
          levelComplete={levelComplete}
          score={score}
          enemiesLeft={enemies.filter((e) => e.active).length}
          currentLevel={currentLevel + 1}
          totalLevels={LEVELS.length}
          onContinue={() => setPaused(false)}
          onRestart={restart}
          onNextLevel={nextLevel}
        />

        <MobileControls
          onMove={(dx, dy) => {
            mobileMove.current = { x: dx * 3, y: dy * 3 };
          }}
          onRotate={(delta) => {
            setPlayer((prev) => ({ ...prev, angle: prev.angle + delta }));
          }}
          onShoot={shoot}
          onWeaponSwitch={() => {
            setPlayer((prev) => {
              const weapons: WeaponType[] = ['pistol', 'shotgun', 'rifle'];
              const currentIndex = weapons.indexOf(prev.weaponType);
              const nextIndex = (currentIndex + 1) % weapons.length;
              return { ...prev, weaponType: weapons[nextIndex] };
            });
          }}
        />
      </div>
    </div>
  );
};

export default Index;

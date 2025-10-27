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
  weaponType: WeaponType;
}

export interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  active: boolean;
  lastAttackTime: number;
  lastShootTime: number;
  weaponType: EnemyWeaponType;
  spriteFrame: number;
}

export interface Powerup {
  x: number;
  y: number;
  type: 'health' | 'ammo' | 'armor' | 'weapon';
  active: boolean;
  weaponType?: WeaponType;
}

export interface Bullet {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  damage: number;
  fromEnemy: boolean;
  active: boolean;
}

export type WeaponType = 'pistol' | 'shotgun' | 'rifle';
export type EnemyWeaponType = 'pistol' | 'rifle';

export interface WeaponStats {
  damage: number;
  fireRate: number;
  ammoPerShot: number;
  spread: number;
  bulletsPerShot: number;
  recoil: number;
}

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  pistol: {
    damage: 30,
    fireRate: 400,
    ammoPerShot: 1,
    spread: 0.05,
    bulletsPerShot: 1,
    recoil: 0.8,
  },
  shotgun: {
    damage: 15,
    fireRate: 800,
    ammoPerShot: 1,
    spread: 0.15,
    bulletsPerShot: 6,
    recoil: 1.5,
  },
  rifle: {
    damage: 25,
    fireRate: 150,
    ammoPerShot: 1,
    spread: 0.03,
    bulletsPerShot: 1,
    recoil: 0.5,
  },
};

export interface GameLevel {
  name: string;
  map: number[][];
  enemyPositions: { x: number; y: number; weapon: EnemyWeaponType }[];
  powerupPositions: { x: number; y: number; type: Powerup['type']; weaponType?: WeaponType }[];
  playerStart: { x: number; y: number };
}

import { WeaponType } from '@/types/game';

export interface GameProgress {
  coins: number;
  unlockedWeapons: WeaponType[];
  completedLevels: number[];
  highScores: Record<number, number>;
}

const STORAGE_KEY = 'doom_game_progress';

export const getDefaultProgress = (): GameProgress => ({
  coins: 0,
  unlockedWeapons: ['pistol'],
  completedLevels: [],
  highScores: {},
});

export const loadProgress = (): GameProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultProgress(), ...parsed };
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return getDefaultProgress();
};

export const saveProgress = (progress: GameProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
};

export const addCoins = (progress: GameProgress, amount: number): GameProgress => {
  return { ...progress, coins: progress.coins + amount };
};

export const unlockWeapon = (progress: GameProgress, weapon: WeaponType): GameProgress => {
  if (progress.unlockedWeapons.includes(weapon)) return progress;
  return { ...progress, unlockedWeapons: [...progress.unlockedWeapons, weapon] };
};

export const completeLevel = (progress: GameProgress, levelIndex: number, score: number): GameProgress => {
  const completedLevels = progress.completedLevels.includes(levelIndex)
    ? progress.completedLevels
    : [...progress.completedLevels, levelIndex];
  
  const highScores = { ...progress.highScores };
  if (!highScores[levelIndex] || score > highScores[levelIndex]) {
    highScores[levelIndex] = score;
  }
  
  return { ...progress, completedLevels, highScores };
};

export const WEAPON_PRICES: Record<WeaponType, number> = {
  pistol: 0,
  shotgun: 500,
  rifle: 1000,
};

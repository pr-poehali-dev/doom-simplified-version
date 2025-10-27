export interface GameSettings {
  sensitivity: number;
  volume: number;
  controlType: 'pc' | 'mobile';
  uiScale: number;
  graphics: GraphicsPreset;
  resolution: Resolution;
}

export type GraphicsPreset = 'potato' | 'very_low' | 'low' | 'medium' | 'high' | 'ultra';

export interface Resolution {
  width: number;
  height: number;
}

export const RESOLUTIONS: Resolution[] = [
  { width: 800, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
];

export const GRAPHICS_PRESETS: Record<GraphicsPreset, { numRays: number; maxDepth: number; shadowQuality: number }> = {
  potato: { numRays: 60, maxDepth: 8, shadowQuality: 0 },
  very_low: { numRays: 120, maxDepth: 12, shadowQuality: 0 },
  low: { numRays: 180, maxDepth: 16, shadowQuality: 1 },
  medium: { numRays: 240, maxDepth: 20, shadowQuality: 1 },
  high: { numRays: 320, maxDepth: 24, shadowQuality: 2 },
  ultra: { numRays: 480, maxDepth: 30, shadowQuality: 3 },
};

const STORAGE_KEY = 'doom_game_settings';

export const getDefaultSettings = (): GameSettings => ({
  sensitivity: 0.003,
  volume: 0.7,
  controlType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'pc',
  uiScale: 1,
  graphics: 'medium',
  resolution: { width: 1280, height: 720 },
});

export const loadSettings = (): GameSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return getDefaultSettings();
};

export const saveSettings = (settings: GameSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

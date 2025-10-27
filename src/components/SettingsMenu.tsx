import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameSettings, RESOLUTIONS, GraphicsPreset, saveSettings } from '@/lib/gameSettings';
import Icon from '@/components/ui/icon';

interface SettingsMenuProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onClose: () => void;
}

const GRAPHICS_NAMES: Record<GraphicsPreset, string> = {
  potato: 'Картошка',
  very_low: 'Очень низкое',
  low: 'Низкое',
  medium: 'Нормальное',
  high: 'Высокое',
  ultra: 'Ультра',
};

export const SettingsMenu = ({ settings, onSettingsChange, onClose }: SettingsMenuProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    saveSettings(localSettings);
    onSettingsChange(localSettings);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border-4 border-[#8B0000] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#FF4444] font-mono text-3xl mb-6 text-center">НАСТРОЙКИ</h2>

        <div className="space-y-6">
          <div>
            <label className="text-[#FF4444] font-mono block mb-2">
              <Icon name="Mouse" size={16} className="inline mr-2" />
              Чувствительность мыши
            </label>
            <Slider
              value={[localSettings.sensitivity * 1000]}
              onValueChange={(val) => setLocalSettings({ ...localSettings, sensitivity: val[0] / 1000 })}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
            <span className="text-[#999] font-mono text-sm">{(localSettings.sensitivity * 1000).toFixed(1)}</span>
          </div>

          <div>
            <label className="text-[#FF4444] font-mono block mb-2">
              <Icon name="Volume2" size={16} className="inline mr-2" />
              Громкость звука
            </label>
            <Slider
              value={[localSettings.volume * 100]}
              onValueChange={(val) => setLocalSettings({ ...localSettings, volume: val[0] / 100 })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <span className="text-[#999] font-mono text-sm">{Math.round(localSettings.volume * 100)}%</span>
          </div>

          <div>
            <label className="text-[#FF4444] font-mono block mb-2">
              <Icon name="Maximize" size={16} className="inline mr-2" />
              Размер интерфейса
            </label>
            <Slider
              value={[localSettings.uiScale * 100]}
              onValueChange={(val) => setLocalSettings({ ...localSettings, uiScale: val[0] / 100 })}
              min={75}
              max={150}
              step={25}
              className="w-full"
            />
            <span className="text-[#999] font-mono text-sm">{Math.round(localSettings.uiScale * 100)}%</span>
          </div>

          <div>
            <label className="text-[#FF4444] font-mono block mb-2">
              <Icon name="Monitor" size={16} className="inline mr-2" />
              Разрешение экрана
            </label>
            <Select
              value={`${localSettings.resolution.width}x${localSettings.resolution.height}`}
              onValueChange={(val) => {
                const [w, h] = val.split('x').map(Number);
                setLocalSettings({ ...localSettings, resolution: { width: w, height: h } });
              }}
            >
              <SelectTrigger className="w-full bg-black border-[#8B0000] text-[#FF4444] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#8B0000]">
                {RESOLUTIONS.map((res) => (
                  <SelectItem
                    key={`${res.width}x${res.height}`}
                    value={`${res.width}x${res.height}`}
                    className="text-[#FF4444] font-mono focus:bg-[#8B0000] focus:text-white"
                  >
                    {res.width} x {res.height}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[#FF4444] font-mono block mb-2">
              <Icon name="Sparkles" size={16} className="inline mr-2" />
              Качество графики
            </label>
            <Select
              value={localSettings.graphics}
              onValueChange={(val: GraphicsPreset) => setLocalSettings({ ...localSettings, graphics: val })}
            >
              <SelectTrigger className="w-full bg-black border-[#8B0000] text-[#FF4444] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#8B0000]">
                {(Object.keys(GRAPHICS_NAMES) as GraphicsPreset[]).map((preset) => (
                  <SelectItem
                    key={preset}
                    value={preset}
                    className="text-[#FF4444] font-mono focus:bg-[#8B0000] focus:text-white"
                  >
                    {GRAPHICS_NAMES[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[#FF4444] font-mono block mb-2">
              <Icon name="Gamepad2" size={16} className="inline mr-2" />
              Тип управления
            </label>
            <Select
              value={localSettings.controlType}
              onValueChange={(val: 'pc' | 'mobile') => setLocalSettings({ ...localSettings, controlType: val })}
            >
              <SelectTrigger className="w-full bg-black border-[#8B0000] text-[#FF4444] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#8B0000]">
                <SelectItem value="pc" className="text-[#FF4444] font-mono focus:bg-[#8B0000] focus:text-white">
                  ПК (Клавиатура + Мышь)
                </SelectItem>
                <SelectItem value="mobile" className="text-[#FF4444] font-mono focus:bg-[#8B0000] focus:text-white">
                  Мобильное (Сенсор)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Button
            onClick={handleSave}
            className="flex-1 h-14 bg-[#00AA00] hover:bg-[#00FF00] hover:text-black text-white font-mono text-lg"
          >
            <Icon name="Check" size={20} className="mr-2" />
            СОХРАНИТЬ
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 h-14 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
          >
            <Icon name="X" size={20} className="mr-2" />
            ОТМЕНА
          </Button>
        </div>
      </div>
    </div>
  );
};

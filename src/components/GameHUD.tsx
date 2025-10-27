import Icon from '@/components/ui/icon';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  kills: number;
  armor: number;
}

export const GameHUD = ({ health, maxHealth, ammo, maxAmmo, score, kills, armor }: GameHUDProps) => {
  const healthPercent = (health / maxHealth) * 100;
  const ammoPercent = (ammo / maxAmmo) * 100;
  
  return (
    <>
      <div className="absolute top-4 left-4 font-mono text-[#FF4444] space-y-2 pointer-events-none">
        <div className="bg-black/80 px-3 py-2 border border-[#8B0000]">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Heart" size={16} className="inline" />
            <span>ЗДОРОВЬЕ: {health}/{maxHealth}</span>
          </div>
          <div className="w-32 h-2 bg-[#2d1810] border border-[#8B0000]">
            <div 
              className="h-full bg-gradient-to-r from-[#FF4444] to-[#FF8888]"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>
        
        <div className="bg-black/80 px-3 py-2 border border-[#8B0000]">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Zap" size={16} className="inline" />
            <span>ПАТРОНЫ: {ammo}/{maxAmmo}</span>
          </div>
          <div className="w-32 h-2 bg-[#2d1810] border border-[#8B0000]">
            <div 
              className="h-full bg-gradient-to-r from-[#FFFF00] to-[#FFAA00]"
              style={{ width: `${ammoPercent}%` }}
            />
          </div>
        </div>

        {armor > 0 && (
          <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
            <Icon name="Shield" size={16} className="inline mr-2" />
            БРОНЯ: {armor}
          </div>
        )}
        
        <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
          <Icon name="Target" size={16} className="inline mr-2" />
          СЧЁТ: {score}
        </div>
        
        <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
          <Icon name="Crosshair" size={16} className="inline mr-2" />
          УБИЙСТВ: {kills}
        </div>
      </div>

      <div className="absolute top-4 right-4 font-mono text-[#999] text-sm bg-black/80 px-3 py-2 border border-[#8B0000] pointer-events-none">
        <div>WASD - движение</div>
        <div>Мышь - камера</div>
        <div>ЛКМ / Пробел - стрельба</div>
        <div>ESC - пауза</div>
        <div className="mt-2 text-[#00FF00]">🟢 Аптечка +30 HP</div>
        <div className="text-[#FFFF00]">🟡 Патроны +20</div>
        <div className="text-[#0088FF]">🔵 Броня +2</div>
      </div>
    </>
  );
};

import Icon from '@/components/ui/icon';

interface GameHUDProps {
  health: number;
  ammo: number;
  score: number;
}

export const GameHUD = ({ health, ammo, score }: GameHUDProps) => {
  return (
    <>
      <div className="absolute top-4 left-4 font-mono text-[#FF4444] space-y-2 pointer-events-none">
        <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
          <Icon name="Heart" size={16} className="inline mr-2" />
          ЗДОРОВЬЕ: {health}%
        </div>
        <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
          <Icon name="Zap" size={16} className="inline mr-2" />
          ПАТРОНЫ: {ammo}
        </div>
        <div className="bg-black/80 px-3 py-1 border border-[#8B0000]">
          <Icon name="Target" size={16} className="inline mr-2" />
          СЧЁТ: {score}
        </div>
      </div>

      <div className="absolute top-4 right-4 font-mono text-[#999] text-sm bg-black/80 px-3 py-2 border border-[#8B0000] pointer-events-none">
        <div>WASD - движение</div>
        <div>Мышь - камера</div>
        <div>ЛКМ / Пробел - стрельба</div>
        <div>ESC - пауза</div>
      </div>
    </>
  );
};

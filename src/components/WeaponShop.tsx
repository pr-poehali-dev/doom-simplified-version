import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { WeaponType, WEAPONS } from '@/types/game';
import { GameProgress, WEAPON_PRICES } from '@/lib/gameProgress';

interface WeaponShopProps {
  progress: GameProgress;
  onPurchase: (weapon: WeaponType) => void;
  onClose: () => void;
}

const WEAPON_NAMES: Record<WeaponType, string> = {
  pistol: 'Пистолет',
  shotgun: 'Дробовик',
  rifle: 'Автомат',
};

const WEAPON_DESCRIPTIONS: Record<WeaponType, string> = {
  pistol: 'Стандартное оружие. Точное, но слабое.',
  shotgun: 'Мощное оружие ближнего боя. 6 пуль за выстрел!',
  rifle: 'Автоматическая винтовка. Высокая скорострельность.',
};

export const WeaponShop = ({ progress, onPurchase, onClose }: WeaponShopProps) => {
  const weapons: WeaponType[] = ['pistol', 'shotgun', 'rifle'];

  const canBuy = (weapon: WeaponType) => {
    return !progress.unlockedWeapons.includes(weapon) && progress.coins >= WEAPON_PRICES[weapon];
  };

  const isOwned = (weapon: WeaponType) => {
    return progress.unlockedWeapons.includes(weapon);
  };

  return (
    <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border-4 border-[#8B0000] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#FF4444] font-mono text-3xl">МАГАЗИН ОРУЖИЯ</h2>
          <div className="text-[#FFD700] font-mono text-2xl">
            <Icon name="Coins" size={24} className="inline mr-2" />
            {progress.coins}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {weapons.map((weapon) => {
            const stats = WEAPONS[weapon];
            const owned = isOwned(weapon);
            const affordable = canBuy(weapon);

            return (
              <div
                key={weapon}
                className={`border-2 p-4 ${
                  owned ? 'border-[#00FF00] bg-[#002200]' : 'border-[#8B0000] bg-[#1a0a0a]'
                }`}
              >
                <h3 className="text-[#FF4444] font-mono text-xl mb-2">{WEAPON_NAMES[weapon]}</h3>
                <p className="text-[#999] font-mono text-sm mb-4">{WEAPON_DESCRIPTIONS[weapon]}</p>

                <div className="space-y-2 mb-4 text-[#999] font-mono text-xs">
                  <div>Урон: {stats.damage}</div>
                  <div>Скорострельность: {1000 / stats.fireRate} в/сек</div>
                  <div>Пуль за выстрел: {stats.bulletsPerShot}</div>
                  <div>Разброс: {stats.spread.toFixed(2)}</div>
                </div>

                {owned ? (
                  <div className="text-[#00FF00] font-mono text-center py-2">
                    <Icon name="Check" size={20} className="inline mr-2" />
                    КУПЛЕНО
                  </div>
                ) : (
                  <Button
                    onClick={() => onPurchase(weapon)}
                    disabled={!affordable}
                    className={`w-full font-mono ${
                      affordable
                        ? 'bg-[#FFD700] hover:bg-[#FFED4E] text-black'
                        : 'bg-[#4a4a4a] text-[#999] cursor-not-allowed'
                    }`}
                  >
                    <Icon name="ShoppingCart" size={16} className="mr-2" />
                    {WEAPON_PRICES[weapon]} монет
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-[#999] font-mono text-sm mb-6 text-center">
          💰 Получайте монеты за убийство врагов и прохождение уровней
        </div>

        <Button
          onClick={onClose}
          className="w-full h-14 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
        >
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          ВЕРНУТЬСЯ
        </Button>
      </div>
    </div>
  );
};

import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface GameMenusProps {
  pointerLocked: boolean;
  paused: boolean;
  gameOver: boolean;
  levelComplete: boolean;
  score: number;
  enemiesLeft: number;
  currentLevel: number;
  totalLevels: number;
  onContinue: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
}

export const GameMenus = ({
  pointerLocked,
  paused,
  gameOver,
  levelComplete,
  score,
  enemiesLeft,
  currentLevel,
  totalLevels,
  onContinue,
  onRestart,
  onNextLevel,
}: GameMenusProps) => {
  return (
    <>
      {!pointerLocked && !paused && !gameOver && !levelComplete && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#FF4444] font-mono text-3xl mb-4 bg-black/80 px-8 py-4 border-2 border-[#8B0000]">
              Кликни для начала
            </div>
            <div className="text-[#999] font-mono text-sm bg-black/80 px-4 py-2 border border-[#8B0000] inline-block">
              <Icon name="Mouse" size={16} className="inline mr-2" />
              Управление мышью для поворота
            </div>
          </div>
        </div>
      )}

      {paused && !gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          <div className="text-[#FF4444] font-mono text-4xl mb-8 tracking-wider">
            ПАУЗА
          </div>
          <div className="space-y-4 flex flex-col">
            <Button
              onClick={onContinue}
              className="w-56 h-14 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
            >
              <Icon name="Play" size={20} className="mr-2" />
              ПРОДОЛЖИТЬ
            </Button>
            <Button
              onClick={onRestart}
              className="w-56 h-14 bg-[#4a4a4a] hover:bg-[#666] text-white font-mono text-lg"
            >
              <Icon name="RotateCcw" size={20} className="mr-2" />
              РЕСТАРТ
            </Button>
          </div>
          <div className="mt-8 text-[#999] font-mono text-sm">
            Уровень {currentLevel} из {totalLevels}
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          <div className="text-[#FF4444] font-mono text-6xl mb-4 tracking-wider animate-pulse">
            GAME OVER
          </div>
          <div className="text-[#999] font-mono text-2xl mb-8">
            СЧЁТ: {score}
          </div>
          <Button
            onClick={onRestart}
            className="w-56 h-14 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
          >
            <Icon name="RotateCcw" size={20} className="mr-2" />
            ПОПРОБОВАТЬ СНОВА
          </Button>
        </div>
      )}

      {levelComplete && !gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          <div className="text-[#00FF00] font-mono text-6xl mb-4 tracking-wider">
            УРОВЕНЬ ПРОЙДЕН!
          </div>
          <div className="text-[#999] font-mono text-2xl mb-2">
            СЧЁТ: {score}
          </div>
          <div className="text-[#999] font-mono text-xl mb-8">
            Уровень {currentLevel} из {totalLevels}
          </div>
          <div className="space-y-4 flex flex-col">
            {currentLevel < totalLevels ? (
              <Button
                onClick={onNextLevel}
                className="w-56 h-14 bg-[#00AA00] hover:bg-[#00FF00] hover:text-black text-white font-mono text-lg"
              >
                <Icon name="ArrowRight" size={20} className="mr-2" />
                СЛЕДУЮЩИЙ УРОВЕНЬ
              </Button>
            ) : (
              <div className="text-[#FFD700] font-mono text-3xl mb-4 animate-pulse">
                ВЫ ПРОШЛИ ВСЕ УРОВНИ!
              </div>
            )}
            <Button
              onClick={onRestart}
              className="w-56 h-14 bg-[#4a4a4a] hover:bg-[#666] text-white font-mono text-lg"
            >
              <Icon name="RotateCcw" size={20} className="mr-2" />
              ПЕРЕИГРАТЬ УРОВЕНЬ
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

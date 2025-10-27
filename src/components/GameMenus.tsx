import { Button } from '@/components/ui/button';

interface GameMenusProps {
  pointerLocked: boolean;
  paused: boolean;
  gameOver: boolean;
  score: number;
  enemiesLeft: number;
  onContinue: () => void;
  onRestart: () => void;
}

export const GameMenus = ({
  pointerLocked,
  paused,
  gameOver,
  score,
  enemiesLeft,
  onContinue,
  onRestart,
}: GameMenusProps) => {
  return (
    <>
      {!pointerLocked && !paused && !gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-[#FF4444] font-mono text-2xl bg-black/80 px-6 py-4 border-2 border-[#8B0000]">
            Кликни для начала
          </div>
        </div>
      )}

      {paused && !gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          <div className="text-[#FF4444] font-mono text-4xl mb-8 tracking-wider">
            ПАУЗА
          </div>
          <div className="space-y-4">
            <Button
              onClick={onContinue}
              className="w-48 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
            >
              ПРОДОЛЖИТЬ
            </Button>
            <Button
              onClick={onRestart}
              className="w-48 bg-[#4a4a4a] hover:bg-[#666] text-white font-mono text-lg block"
            >
              РЕСТАРТ
            </Button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          <div className="text-[#FF4444] font-mono text-5xl mb-4 tracking-wider animate-pulse">
            GAME OVER
          </div>
          <div className="text-[#999] font-mono text-2xl mb-8">
            СЧЁТ: {score}
          </div>
          <Button
            onClick={onRestart}
            className="w-48 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
          >
            РЕСТАРТ
          </Button>
        </div>
      )}

      {enemiesLeft === 0 && !gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
          <div className="text-[#FF4444] font-mono text-5xl mb-4 tracking-wider">
            ПОБЕДА!
          </div>
          <div className="text-[#999] font-mono text-2xl mb-8">
            СЧЁТ: {score}
          </div>
          <Button
            onClick={onRestart}
            className="w-48 bg-[#8B0000] hover:bg-[#FF4444] text-white font-mono text-lg"
          >
            НОВАЯ ИГРА
          </Button>
        </div>
      )}
    </>
  );
};

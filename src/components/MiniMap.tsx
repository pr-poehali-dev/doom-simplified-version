import { Player, Enemy } from '@/types/game';
import { CELL_SIZE } from '@/lib/raycaster';

interface MiniMapProps {
  player: Player;
  enemies: Enemy[];
  worldMap: number[][];
}

export const MiniMap = ({ player, enemies, worldMap }: MiniMapProps) => {
  const mapHeight = worldMap.length;
  const mapWidth = worldMap[0]?.length || 0;
  const miniMapSize = 180;
  const cellSize = miniMapSize / Math.max(mapHeight, mapWidth);

  return (
    <div className="absolute bottom-4 left-4 pointer-events-none">
      <svg
        width={mapWidth * cellSize}
        height={mapHeight * cellSize}
        className="border-2 border-[#8B0000] bg-black/80 rounded"
      >
        {worldMap.map((row, y) =>
          row.map((cell, x) => {
            if (cell === 1) {
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="#4a4a4a"
                  stroke="#666"
                  strokeWidth="0.5"
                />
              );
            }
            return null;
          })
        )}

        {enemies.map((enemy, i) => {
          if (!enemy.active) return null;
          const enemyX = (enemy.x / CELL_SIZE) * cellSize;
          const enemyY = (enemy.y / CELL_SIZE) * cellSize;
          return (
            <circle
              key={i}
              cx={enemyX}
              cy={enemyY}
              r={cellSize * 0.3}
              fill="#FF4444"
            />
          );
        })}

        <g>
          <circle
            cx={(player.x / CELL_SIZE) * cellSize}
            cy={(player.y / CELL_SIZE) * cellSize}
            r={cellSize * 0.4}
            fill="#00FF00"
          />
          <line
            x1={(player.x / CELL_SIZE) * cellSize}
            y1={(player.y / CELL_SIZE) * cellSize}
            x2={(player.x / CELL_SIZE) * cellSize + Math.cos(player.angle) * cellSize * 0.8}
            y2={(player.y / CELL_SIZE) * cellSize + Math.sin(player.angle) * cellSize * 0.8}
            stroke="#00FF00"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
};

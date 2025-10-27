import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  onRotate: (delta: number) => void;
  onShoot: () => void;
  onWeaponSwitch: () => void;
}

export const MobileControls = ({ onMove, onRotate, onShoot, onWeaponSwitch }: MobileControlsProps) => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const rotateStartX = useRef(0);

  const handleJoystickStart = (e: React.TouchEvent) => {
    setJoystickActive(true);
    updateJoystick(e);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    updateJoystick(e);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const updateJoystick = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 40;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      setJoystickPos({
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance,
      });
      onMove(Math.cos(angle), Math.sin(angle));
    } else {
      setJoystickPos({ x: deltaX, y: deltaY });
      onMove(deltaX / maxDistance, deltaY / maxDistance);
    }
  };

  const handleRotateStart = (e: React.TouchEvent) => {
    rotateStartX.current = e.touches[0].clientX;
  };

  const handleRotateMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - rotateStartX.current;
    onRotate(deltaX * 0.01);
    rotateStartX.current = e.touches[0].clientX;
  };

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return () => {
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    };
  }, []);

  return (
    <div className="md:hidden fixed inset-0 pointer-events-none z-50">
      <div className="absolute bottom-8 left-8 pointer-events-auto">
        <div
          ref={joystickRef}
          className="relative w-32 h-32 bg-black/40 rounded-full border-2 border-white/30"
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
        >
          <div
            className="absolute w-12 h-12 bg-white/60 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform"
            style={{
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
            }}
          />
        </div>
      </div>

      <div
        className="absolute bottom-8 right-8 pointer-events-auto flex flex-col gap-4"
      >
        <button
          className="w-20 h-20 bg-red-600/80 rounded-full border-2 border-white/30 flex items-center justify-center active:scale-95 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            onShoot();
          }}
        >
          <Icon name="Target" size={32} className="text-white" />
        </button>
        
        <button
          className="w-16 h-16 bg-blue-600/80 rounded-full border-2 border-white/30 flex items-center justify-center active:scale-95 transition-transform"
          onTouchStart={(e) => {
            e.preventDefault();
            onWeaponSwitch();
          }}
        >
          <Icon name="RefreshCw" size={24} className="text-white" />
        </button>
      </div>

      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-auto"
        onTouchStart={handleRotateStart}
        onTouchMove={handleRotateMove}
      />
    </div>
  );
};

'use client';

import { useStore, CubeType } from '../../lib/store';

const images: Record<CubeType, string> = {
  dirt: '#5d4037',
  grass: '#388e3c',
  glass: '#81d4fa',
  wood: '#795548',
  log: '#4e342e',
  water: '#4fc3f7',
};

export const TextureSelector = () => {
  const activeTexture = useStore((state) => state.texture);
  const setTexture = useStore((state) => state.setTexture);

  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/50 p-2 rounded-lg flex gap-2 pointer-events-auto">
      {Object.entries(images).map(([k, color]) => (
        <button
          key={k}
          onClick={(e) => {
              e.stopPropagation();
              setTexture(k as CubeType);
          }}
          className={`w-10 h-10 border-2 ${k === activeTexture ? 'border-white' : 'border-transparent'} cursor-pointer`}
          style={{ backgroundColor: color }}
          title={k}
        />
      ))}
    </div>
  );
};

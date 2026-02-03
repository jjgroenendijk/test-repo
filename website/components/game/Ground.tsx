'use client';

import { usePlane } from '@react-three/cannon';
import { useStore } from '../../lib/store';

export const Ground = () => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -0.5, 0] }));
  const addCube = useStore((state) => state.addCube);

  return (
    <mesh
      ref={ref as any}
      onClick={(e) => {
        e.stopPropagation();
        if (e.altKey) return;

        const [x, y, z] = Object.values(e.point).map(val => Math.round(val));
        addCube(x, 0, z);
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2e7d32" />
    </mesh>
  );
};

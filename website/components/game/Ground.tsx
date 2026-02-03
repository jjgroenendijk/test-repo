'use client';

import { usePlane } from '@react-three/cannon';
import { Mesh } from 'three';
import { useStore } from '../../lib/store';

export const Ground = () => {
  const [ref] = usePlane<Mesh>(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -0.5, 0] }));
  const addCube = useStore((state) => state.addCube);

  return (
    <mesh
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        if (e.altKey) return;

        const x = Math.round(e.point.x);
        const z = Math.round(e.point.z);
        addCube(x, 0, z);
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2e7d32" />
    </mesh>
  );
};

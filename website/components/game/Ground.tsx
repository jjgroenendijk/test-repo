'use client';

import { RigidBody } from '@react-three/rapier';
import { useStore } from '../../lib/store';

export const Ground = () => {
  const addCube = useStore((state) => state.addCube);

  return (
    <RigidBody type="fixed" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <mesh
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
    </RigidBody>
  );
};

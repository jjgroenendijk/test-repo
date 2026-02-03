'use client';

import { useBox } from '@react-three/cannon';
import { Mesh } from 'three';
import { useStore, CubeType } from '../../lib/store';
import { useState } from 'react';

const colors: Record<CubeType, string> = {
  dirt: '#5d4037',
  grass: '#388e3c',
  glass: '#81d4fa',
  wood: '#795548',
  log: '#4e342e',
};

export const Cube = ({ position, texture }: { position: [number, number, number]; texture: CubeType }) => {
  const [ref] = useBox<Mesh>(() => ({ type: 'Static', position }));
  const addCube = useStore((state) => state.addCube);
  const removeCube = useStore((state) => state.removeCube);
  const [hover, setHover] = useState(false);

  return (
    <mesh
      ref={ref}
      onPointerMove={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (e.altKey) {
            removeCube(position[0], position[1], position[2]);
            return;
        }

        if (!e.face) return;

        const { x, y, z } = e.face.normal;
        addCube(position[0] + x, position[1] + y, position[2] + z);
      }}
    >
      <boxGeometry />
      <meshStandardMaterial
        color={hover ? 'lightgrey' : colors[texture]}
        opacity={texture === 'glass' ? 0.6 : 1}
        transparent={texture === 'glass'}
      />
    </mesh>
  );
};

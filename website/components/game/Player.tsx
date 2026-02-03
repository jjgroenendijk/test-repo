'use client';

import { useSphere } from '@react-three/cannon';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Mesh } from 'three';
import { PointerLockControls } from '@react-three/drei';

const SPEED = 5;

export const Player = () => {
  const { camera } = useThree();
  const [ref, api] = useSphere<Mesh>(() => ({ mass: 1, type: 'Dynamic', position: [0, 5, 0] }));

  const movement = useRef({ forward: false, backward: false, left: false, right: false });
  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          switch(e.code) {
              case 'KeyW': movement.current.forward = true; break;
              case 'KeyS': movement.current.backward = true; break;
              case 'KeyA': movement.current.left = true; break;
              case 'KeyD': movement.current.right = true; break;
              case 'Space':
                if (Math.abs(velocity.current[1]) < 0.05) {
                    api.velocity.set(velocity.current[0], 4, velocity.current[2]);
                }
                break;
          }
      }
      const handleKeyUp = (e: KeyboardEvent) => {
          switch(e.code) {
              case 'KeyW': movement.current.forward = false; break;
              case 'KeyS': movement.current.backward = false; break;
              case 'KeyA': movement.current.left = false; break;
              case 'KeyD': movement.current.right = false; break;
          }
      }
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keyup', handleKeyUp);
      }
  }, [api.velocity]);

  useFrame(() => {
      if (!ref.current) return;

      camera.position.copy(ref.current.position);

      const direction = new Vector3();
      const frontVector = new Vector3(0, 0, Number(movement.current.backward) - Number(movement.current.forward));
      const sideVector = new Vector3(Number(movement.current.left) - Number(movement.current.right), 0, 0);

      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(SPEED)
        .applyEuler(camera.rotation);

      api.velocity.set(direction.x, velocity.current[1], direction.z);
  });

  return (
    <>
      <mesh ref={ref} />
      <PointerLockControls />
    </>
  );
};

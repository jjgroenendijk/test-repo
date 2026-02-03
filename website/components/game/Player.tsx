'use client';

import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { PointerLockControls } from '@react-three/drei';

const SPEED = 5;

export const Player = () => {
  const { camera } = useThree();
  const rigidBody = useRef<RapierRigidBody>(null);

  const movement = useRef({ forward: false, backward: false, left: false, right: false });

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          switch(e.code) {
              case 'KeyW': movement.current.forward = true; break;
              case 'KeyS': movement.current.backward = true; break;
              case 'KeyA': movement.current.left = true; break;
              case 'KeyD': movement.current.right = true; break;
              case 'Space':
                if (rigidBody.current) {
                    const vel = rigidBody.current.linvel();
                    if (Math.abs(vel.y) < 0.1) {
                        rigidBody.current.setLinvel({ x: vel.x, y: 5, z: vel.z }, true);
                    }
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
  }, []);

  useFrame(() => {
      if (!rigidBody.current) return;

      const pos = rigidBody.current.translation();
      camera.position.set(pos.x, pos.y, pos.z);

      // Expose position for testing
      if (typeof window !== 'undefined') {
        (window as any).__PLAYER_POSITION__ = [pos.x, pos.y, pos.z];
      }

      const direction = new Vector3();
      const frontVector = new Vector3(0, 0, Number(movement.current.backward) - Number(movement.current.forward));
      const sideVector = new Vector3(Number(movement.current.left) - Number(movement.current.right), 0, 0);

      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(SPEED)
        .applyEuler(camera.rotation);

      const vel = rigidBody.current.linvel();
      rigidBody.current.setLinvel({ x: direction.x, y: vel.y, z: direction.z }, true);
  });

  return (
    <>
      <RigidBody
        ref={rigidBody}
        colliders="ball"
        mass={1}
        type="dynamic"
        position={[0, 5, 0]}
        enabledRotations={[false, false, false]}
        canSleep={false}
      >
        <mesh>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="hotpink" visible={false} />
        </mesh>
      </RigidBody>
      <PointerLockControls />
    </>
  );
};

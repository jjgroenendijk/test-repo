'use client';

import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { Player } from './Player';
import { Ground } from './Ground';
import { Cube } from './Cube';
import { TextureSelector } from './TextureSelector';
import { useStore } from '../../lib/store';

export const Scene = () => {
  const cubes = useStore((state) => state.cubes);

  return (
    <div className="w-full h-screen">
      <Canvas>
        <Sky sunPosition={[100, 100, 20]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Physics>
          <Player />
          <Ground />
          {cubes.map((cube) => (
            <Cube key={cube.id} position={cube.pos} texture={cube.texture} />
          ))}
        </Physics>
      </Canvas>
      <TextureSelector />
      <div className="absolute top-5 left-5 text-white pointer-events-none bg-black/30 p-4 rounded">
        <h1 className="text-xl font-bold mb-2">Minecraft Explorer</h1>
        <p>WASD to Move, Space to Jump</p>
        <p>Click to Add Block</p>
        <p>Alt+Click to Remove Block</p>
        <p>1-5 to Select Texture (or click below)</p>
      </div>
    </div>
  );
};

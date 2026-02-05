import { createNoise2D } from 'simplex-noise';
import { Cube, CubeType } from './store';

export const generateWorld = (width: number = 20, depth: number = 20): Cube[] => {
  const cubes: Cube[] = [];
  const noise2D = createNoise2D();

  for (let x = -width / 2; x < width / 2; x++) {
    for (let z = -depth / 2; z < depth / 2; z++) {
      const scale = 0.1;
      const noiseValue = noise2D(x * scale, z * scale);

      const height = Math.floor((noiseValue + 1) * 3);

      for (let y = 0; y <= height; y++) {
        let texture: CubeType = 'dirt';

        if (y === height) {
          texture = 'grass';
        }

        const isTree = y === height && Math.random() < 0.02 && x > -width/2 + 2 && x < width/2 - 2 && z > -depth/2 + 2 && z < depth/2 - 2;

        cubes.push({
          id: Math.random().toString(36).slice(2, 11),
          pos: [x, y, z],
          texture,
        });

        if (isTree) {
             cubes.push({
                id: Math.random().toString(36).slice(2, 11),
                pos: [x, y + 1, z],
                texture: 'log'
             });
             cubes.push({
                id: Math.random().toString(36).slice(2, 11),
                pos: [x, y + 2, z],
                texture: 'log'
             });
             cubes.push({
                id: Math.random().toString(36).slice(2, 11),
                pos: [x, y + 3, z],
                texture: 'log'
             });

             const leavesType: CubeType = 'grass';

             for (let lx = -1; lx <= 1; lx++) {
                 for (let lz = -1; lz <= 1; lz++) {
                     if (lx === 0 && lz === 0) {
                         cubes.push({
                             id: Math.random().toString(36).slice(2, 11),
                             pos: [x, y + 4, z],
                             texture: leavesType
                         });
                     } else {
                         cubes.push({
                            id: Math.random().toString(36).slice(2, 11),
                            pos: [x + lx, y + 3, z + lz],
                            texture: leavesType
                         });
                     }
                 }
             }
        }
      }

      const waterLevel = 2;
      if (height < waterLevel) {
        for (let y = height + 1; y <= waterLevel; y++) {
          cubes.push({
            id: Math.random().toString(36).slice(2, 11),
            pos: [x, y, z],
            texture: 'water',
          });
        }
      }
    }
  }
  return cubes;
};

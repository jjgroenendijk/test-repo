import { create } from 'zustand';

export type CubeType = 'dirt' | 'grass' | 'glass' | 'wood' | 'log';

export interface Cube {
  id: string;
  pos: [number, number, number];
  texture: CubeType;
}

interface GameState {
  texture: CubeType;
  cubes: Cube[];
  addCube: (x: number, y: number, z: number) => void;
  removeCube: (x: number, y: number, z: number) => void;
  setTexture: (texture: CubeType) => void;
  saveWorld: () => void;
  resetWorld: () => void;
}

export const useStore = create<GameState>((set) => ({
  texture: 'dirt',
  cubes: [
    { id: '1', pos: [1, 1, 1], texture: 'dirt' },
    { id: '2', pos: [2, 1, 1], texture: 'grass' },
  ],
  addCube: (x, y, z) =>
    set((state) => ({
      cubes: [
        ...state.cubes,
        {
          id: Math.random().toString(36).substr(2, 9),
          pos: [x, y, z],
          texture: state.texture,
        },
      ],
    })),
  removeCube: (x, y, z) =>
    set((state) => ({
      cubes: state.cubes.filter((cube) => {
        const [cx, cy, cz] = cube.pos;
        return cx !== x || cy !== y || cz !== z;
      }),
    })),
  setTexture: (texture) => set(() => ({ texture })),
  saveWorld: () => {},
  resetWorld: () => set(() => ({ cubes: [] })),
}));

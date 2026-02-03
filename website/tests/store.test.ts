import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../lib/store';

describe('Game Store', () => {
  beforeEach(() => {
    useStore.getState().resetWorld();
  });

  it('should start with empty world after reset', () => {
    const { cubes } = useStore.getState();
    expect(cubes).toEqual([]);
  });

  it('should add a cube', () => {
    const { addCube } = useStore.getState();
    addCube(1, 2, 3);
    const { cubes } = useStore.getState();
    expect(cubes).toHaveLength(1);
    expect(cubes[0].pos).toEqual([1, 2, 3]);
  });

  it('should remove a cube', () => {
    const { addCube, removeCube } = useStore.getState();
    addCube(1, 2, 3);
    removeCube(1, 2, 3);
    const { cubes } = useStore.getState();
    expect(cubes).toHaveLength(0);
  });

  it('should set texture', () => {
    const { setTexture } = useStore.getState();
    setTexture('glass');
    expect(useStore.getState().texture).toBe('glass');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../lib/store';

describe('Game Store', () => {
  beforeEach(() => {
    useStore.getState().resetWorld();
  });

  it('should regenerate world after reset', () => {
    const { cubes } = useStore.getState();
    expect(cubes.length).toBeGreaterThan(0);
  });

  it('should add a cube', () => {
    const { addCube } = useStore.getState();
    const initialCount = useStore.getState().cubes.length;
    // Use coordinates far away from generated world
    addCube(100, 200, 300);
    const { cubes } = useStore.getState();
    expect(cubes).toHaveLength(initialCount + 1);
    expect(cubes.find(c => c.pos[0] === 100 && c.pos[1] === 200 && c.pos[2] === 300)).toBeDefined();
  });

  it('should remove a cube', () => {
    const { addCube, removeCube } = useStore.getState();
    addCube(100, 200, 300);
    removeCube(100, 200, 300);
    const { cubes } = useStore.getState();
    expect(cubes.find(c => c.pos[0] === 100 && c.pos[1] === 200 && c.pos[2] === 300)).toBeUndefined();
  });

  it('should set texture', () => {
    const { setTexture } = useStore.getState();
    setTexture('glass');
    expect(useStore.getState().texture).toBe('glass');
  });
});

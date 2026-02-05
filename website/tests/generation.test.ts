import { describe, it, expect } from 'vitest';
import { generateWorld } from '../lib/generation';

describe('World Generation', () => {
  it('should generate cubes for a given width and depth', () => {
    const width = 10;
    const depth = 10;
    const cubes = generateWorld(width, depth);

    expect(cubes.length).toBeGreaterThan(0);

    // Check bounds
    cubes.forEach(cube => {
      const [x, y, z] = cube.pos;
      expect(x).toBeGreaterThanOrEqual(-width / 2);
      expect(x).toBeLessThan(width / 2);
      expect(z).toBeGreaterThanOrEqual(-depth / 2);
      expect(z).toBeLessThan(depth / 2);
    });
  });

  it('should generate valid textures', () => {
      const cubes = generateWorld(5, 5);
      const validTextures = ['dirt', 'grass', 'glass', 'wood', 'log', 'water'];
      cubes.forEach(cube => {
          expect(validTextures).toContain(cube.texture);
      });
  });

  it('should generate water at or below water level', () => {
    const cubes = generateWorld(20, 20);
    const waterCubes = cubes.filter(c => c.texture === 'water');

    // If water is generated, it must be at y <= 2.
    waterCubes.forEach(cube => {
        expect(cube.pos[1]).toBeLessThanOrEqual(2);
    });
  });
});

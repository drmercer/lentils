import { clamp, rangeOverlap } from './math';

describe('clamp', () => {

  it('should work', () => {
    expect(clamp(2, 1, 3)).toBe(2);
    expect(clamp(10, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
  });

});

describe('rangeOverlap', () => {

  it('should handle forward overlap', () => {
    expect(rangeOverlap(1, 3, 2, 4)).toEqual([2, 3]);
  });

  it('should handle backward overlap', () => {
    expect(rangeOverlap(2, 4, 1, 3)).toEqual([2, 3]);
  });

  it('should handle inner overlap', () => {
    expect(rangeOverlap(2, 3, 1, 4)).toEqual([2, 3]);
  });

  it('should handle outer overlap', () => {
    expect(rangeOverlap(1, 4, 2, 3)).toEqual([2, 3]);
  });

});

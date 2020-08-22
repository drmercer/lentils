import { isString, isNumber } from './checks';

describe(module.id, () => {
  describe('isString', () => {
    it('works', () => {
      expect(isString('foo')).toEqual(true);
      expect(isString(12345)).toEqual(false);
    });
  })
  describe('isNumber', () => {
    it('works', () => {
      expect(isNumber('foo')).toEqual(false);
      expect(isNumber(12345)).toEqual(true);
    })
  })
});

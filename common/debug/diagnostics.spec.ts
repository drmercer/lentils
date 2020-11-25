import {getDeviceType} from './diagnostics';

describe("getDeviceType", () => {
  it('should return "Desktop" when in a desktop browser', () => {
    expect(getDeviceType()).toBe("Desktop");
  })
})

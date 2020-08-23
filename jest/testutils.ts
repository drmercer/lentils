export type SpecFn = () => void | Promise<void>

export interface ExpectedLogs {
  error: string[];
  warn: string[];
  log: string[];
  info: string[];
  debug: string[];
}

export function withExactLogs(expectedLogs: Partial<ExpectedLogs>, f: SpecFn): SpecFn {
  return () => {
    const error = expectedLogs.error || [];
    const warn = expectedLogs.warn || [];
    const log = expectedLogs.log || [];
    const info = expectedLogs.info || [];
    const debug = expectedLogs.debug || [];

    const errorSpy = spyOn(console, 'error');
    const warnSpy = spyOn(console, 'warn');
    const logSpy = spyOn(console, 'log');
    const infoSpy = spyOn(console, 'info');
    const debugSpy = spyOn(console, 'debug');

    f();

    expect(allCallsTo(errorSpy)).toEqual(error.map(msg => [msg]))
    expect(allCallsTo(warnSpy)).toEqual(warn.map(msg => [msg]))
    expect(allCallsTo(logSpy)).toEqual(log.map(msg => [msg]))
    expect(allCallsTo(infoSpy)).toEqual(info.map(msg => [msg]))
    expect(allCallsTo(debugSpy)).toEqual(debug.map(msg => [msg]))
  }
}

export function withNoLogs(f: SpecFn): SpecFn {
  return withExactLogs({}, f);
}

export function allCallsTo(spy: jasmine.Spy): any[][] {
  return spy.calls.all().map(call => call.args);
}

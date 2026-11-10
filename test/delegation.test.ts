import { describe, expect, it } from 'vitest';
import * as rx from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import type { RunHelpers } from 'rxjs/testing';
import * as api from '../src/index.js';
import * as c from '../src/controls.js';

type Environment = { cold: RunHelpers['cold']; scheduler: TestScheduler };
type Build = (env: Environment) => rx.OperatorFunction<string, unknown>;
type Case = { name: string; actual: Build; native: Build };
const windows = (op: rx.OperatorFunction<string, rx.Observable<string>>): rx.OperatorFunction<string, unknown> =>
  rx.pipe(op, rx.mergeMap(inner => inner.pipe(rx.toArray())));
const cases: Case[] = [
  { name: 'audit time', actual: e => api.audit(c.withTime(3, e.scheduler)), native: e => rx.auditTime(3, e.scheduler) },
  { name: 'audit signal', actual: e => api.audit(c.withSignal(() => e.cold('---x|'))), native: e => rx.audit(() => e.cold('---x|')) },
  { name: 'sample time', actual: e => api.sample(c.withTime(3, e.scheduler)), native: e => rx.sampleTime(3, e.scheduler) },
  { name: 'sample signal', actual: e => api.sample(c.withSignal(e.cold('---x---x---x|'))), native: e => rx.sample(e.cold('---x---x---x|')) },
  { name: 'debounce time', actual: e => api.debounce(c.withTime(3, e.scheduler)), native: e => rx.debounceTime(3, e.scheduler) },
  { name: 'debounce signal', actual: e => api.debounce(c.withSignal(() => e.cold('---x|'))), native: e => rx.debounce(() => e.cold('---x|')) },
  { name: 'throttle time', actual: e => api.throttle(c.withTime(3, e.scheduler)), native: e => rx.throttleTime(3, e.scheduler) },
  { name: 'throttle signal', actual: e => api.throttle(c.withSignal(() => e.cold('---x|'))), native: e => rx.throttle(() => e.cold('---x|')) },
  { name: 'throttle trailing time', actual: e => api.throttle(c.withTime(3, e.scheduler), c.withEdges({ leading: false, trailing: true })), native: e => rx.throttleTime(3, e.scheduler, { leading: false, trailing: true }) },
  { name: 'throttle both edges', actual: e => api.throttle(c.withSignal(() => e.cold('---x|')), c.withEdges({ leading: true, trailing: true })), native: e => rx.throttle(() => e.cold('---x|'), { leading: true, trailing: true }) },
  { name: 'buffer count overlapping', actual: () => api.buffer(c.withCount(3), c.withStartEvery(2)), native: () => rx.bufferCount(3, 2) },
  { name: 'buffer time overlapping and bounded', actual: e => api.buffer(c.withTime(5, e.scheduler), c.withStartEvery(3), c.withMaxSize(2)), native: e => rx.bufferTime(5, 3, 2, e.scheduler) },
  { name: 'buffer signal', actual: e => api.buffer(c.withSignal(e.cold('----x----x|'))), native: e => rx.buffer(e.cold('----x----x|')) },
  { name: 'buffer closing factory', actual: e => api.buffer(c.withClosing(() => e.cold('----x|'))), native: e => rx.bufferWhen(() => e.cold('----x|')) },
  { name: 'buffer openings and closings', actual: e => api.buffer(c.withOpenings(e.cold('--x---y|')), c.withClosing(() => e.cold('-----x|'))), native: e => rx.bufferToggle(e.cold('--x---y|'), () => e.cold('-----x|')) },
  { name: 'window count overlapping', actual: () => windows(api.window(c.withCount(3), c.withStartEvery(2))), native: () => windows(rx.windowCount(3, 2)) },
  { name: 'window time overlapping and bounded', actual: e => windows(api.window(c.withTime(5, e.scheduler), c.withStartEvery(3), c.withMaxSize(2))), native: e => windows(rx.windowTime(5, 3, 2, e.scheduler)) },
  { name: 'window signal', actual: e => windows(api.window(c.withSignal(e.cold('----x----x|')))), native: e => windows(rx.window(e.cold('----x----x|'))) },
  { name: 'window closing factory', actual: e => windows(api.window(c.withClosing(() => e.cold('----x|')))), native: e => windows(rx.windowWhen(() => e.cold('----x|'))) },
  { name: 'window openings and closings', actual: e => windows(api.window(c.withOpenings(e.cold('--x---y|')), c.withClosing(() => e.cold('-----x|')))), native: e => windows(rx.windowToggle(e.cold('--x---y|'), () => e.cold('-----x|'))) },
  { name: 'take signal', actual: e => api.take(c.withSignal(e.cold('-------x|'))), native: e => rx.takeUntil(e.cold('-------x|')) },
  { name: 'skip signal', actual: e => api.skip(c.withSignal(e.cold('-------x|'))), native: e => rx.skipUntil(e.cold('-------x|')) },
];

describe.each(cases)('$name: parity with RxJS 7.8.2', ({ actual, native }) => {
  it.each(['a-b--c---d----|', 'a-b--c---d----#', '|', 'a-b--c---d----------'])('preserves notifications and source lifetime for %s', pattern => {
    const scheduler = new TestScheduler((a, b) => expect(a).toEqual(b));
    scheduler.run(({ cold, flush }) => {
      const sourceA = cold<string>(pattern);
      const sourceB = cold<string>(pattern);
      const traceA: unknown[] = []; const traceB: unknown[] = [];
      const observer = (trace: unknown[]) => ({
        next: (value: unknown) => trace.push({ frame: scheduler.frame, kind: 'next', value }),
        error: (error: unknown) => trace.push({ frame: scheduler.frame, kind: 'error', error }),
        complete: () => trace.push({ frame: scheduler.frame, kind: 'complete' }),
      });
      const subA = sourceA.pipe(actual({ cold, scheduler })).subscribe(observer(traceA));
      const subB = sourceB.pipe(native({ cold, scheduler })).subscribe(observer(traceB));
      scheduler.schedule(() => { subA.unsubscribe(); subB.unsubscribe(); }, 20);
      flush();
      expect(traceA).toEqual(traceB);
      expect(sourceA.subscriptions).toEqual(sourceB.subscriptions);
    });
  });
});

it('debounce flushes on source completion while audit waits for its duration', () => {
  const scheduler = new TestScheduler((a, b) => expect(a).toEqual(b));
  scheduler.run(({ cold, expectObservable }) => {
    expectObservable(cold('a-b|').pipe(api.debounce(c.withTime(5, scheduler)))).toBe('---(b|)');
    expectObservable(cold('a-b|').pipe(api.audit(c.withTime(5, scheduler)))).toBe('-----(b|)');
  });
});

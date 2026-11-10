import { expect, it } from 'vitest';
import { NEVER, Observable, of } from 'rxjs';
import { audit, buffer, distinct, merge, share, skip, take } from '../src/index.js';
import * as c from '../src/controls.js';

it('configuration construction does not subscribe, schedule, or invoke user selectors', () => {
  let touched = 0;
  const source = new Observable(() => { touched++; });
  const signal = c.withSignal(source);
  const selector = c.withSignal(() => { touched++; return NEVER; });
  const time = c.withTime(10);
  const pipeline = of(1).pipe(audit(selector));
  expect(touched).toBe(0);
  expect(Object.isFrozen(signal) && Object.isFrozen(selector) && Object.isFrozen(time)).toBe(true);
  const sub = pipeline.subscribe(); expect(touched).toBe(1); sub.unsubscribe();
});
it('JavaScript callers get explicit failures for unsupported or conflicting policies', () => {
  expect(() => (take as any)(c.withSignal(NEVER), c.withFromEnd())).toThrow(/Unsupported/);
  expect(() => (buffer as any)(c.withCount(2), c.withMaxSize(4))).toThrow(/Unsupported/);
  expect(() => (buffer as any)(c.withTime(2), c.withStartEvery(1), c.withStartEvery(3))).toThrow(/Duplicate/);
  expect(() => (distinct as any)(c.withHistory('all'), c.withComparer(() => true))).toThrow(/Unsupported/);
  expect(() => (skip as any)(c.withWhile(() => true, true))).toThrow(/Inclusive/);
  expect(() => (merge as any)(c.withSources(of(1)), c.withConcurrency(2))).toThrow(/Concurrency/);
  expect(() => share(c.withConnection('manual'), c.withReplay(1, { refCount: true }))).toThrow(/Manual/);
});

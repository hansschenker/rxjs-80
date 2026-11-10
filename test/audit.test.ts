import { describe, expect, it, vi } from 'vitest';
import { EMPTY, NEVER, Observable, Subject, of } from 'rxjs';
import { audit } from '../src/index.js';
import { withSignal } from '../src/controls.js';

describe('audit: Intuition → Specification → Verification', () => {
  it('Given idle, When A arrives, Then remember A and start waiting exactly once', () => {
    const source = new Subject<string>();
    const duration = new Subject<void>();
    const selector = vi.fn(() => duration);
    const output: string[] = [];
    const subscription = source.pipe(audit(withSignal(selector))).subscribe(v => output.push(v));
    source.next('A');
    expect(selector).toHaveBeenCalledExactlyOnceWith('A');
    expect(output).toEqual([]);
    duration.next();
    expect(output).toEqual(['A']);
    subscription.unsubscribe();
  });
  it('Given waiting, When B and C arrive, Then retain C without restarting the wait', () => {
    const source = new Subject<string>();
    const duration = new Subject<void>();
    const selector = vi.fn(() => duration);
    const output: string[] = [];
    const subscription = source.pipe(audit(withSignal(selector))).subscribe(v => output.push(v));
    source.next('A'); source.next('B'); source.next('C');
    expect(selector).toHaveBeenCalledTimes(1);
    expect(output).toEqual([]);
    duration.next();
    expect(output).toEqual(['C']);
    subscription.unsubscribe();
  });
  it('Given waiting, When duration signals, Then close duration before delivering the retained value', () => {
    const source = new Subject<string>();
    const trigger = new Subject<void>();
    const order: string[] = [];
    const duration = new Observable<void>(subscriber => {
      const inner = trigger.subscribe(subscriber);
      return () => { inner.unsubscribe(); order.push('close duration'); };
    });
    const subscription = source.pipe(audit(withSignal(() => duration))).subscribe(v => order.push(v));
    source.next('A'); trigger.next(); trigger.next();
    expect(order).toEqual(['close duration', 'A']);
    source.next('B'); trigger.next();
    expect(order).toEqual(['close duration', 'A', 'close duration', 'B']);
    subscription.unsubscribe();
  });
  it('Given waiting, When duration completes silently, Then emit nothing and accept a new wait', () => {
    const source = new Subject<string>();
    const durations = [new Subject<void>(), new Subject<void>()];
    let index = 0;
    const output: string[] = [];
    const subscription = source.pipe(audit(withSignal(() => durations[index++]!))).subscribe(v => output.push(v));
    source.next('A'); durations[0]!.complete();
    expect(output).toEqual([]);
    source.next('B'); durations[1]!.next();
    expect(index).toBe(2);
    expect(output).toEqual(['B']);
    subscription.unsubscribe();
  });
  it('waits after source completion, releases on duration next, and then completes', () => {
    const duration = new Subject<void>();
    const events: unknown[] = [];
    of(1, 2).pipe(audit(withSignal(() => duration))).subscribe({ next: v => events.push(v), complete: () => events.push('complete') });
    expect(events).toEqual([]);
    duration.next();
    expect(events).toEqual([2, 'complete']);
  });
  it('duration empty completion after source completion completes without flushing', () => {
    const duration = new Subject<void>();
    const events: unknown[] = [];
    of(1).pipe(audit(withSignal(() => duration))).subscribe({ next: v => events.push(v), complete: () => events.push('complete') });
    duration.complete();
    expect(events).toEqual(['complete']);
  });
  it('EMPTY durations suppress values and NEVER durations can keep completion pending', () => {
    const empty: unknown[] = [];
    of(1, 2).pipe(audit(withSignal(() => EMPTY))).subscribe({ next: v => empty.push(v), complete: () => empty.push('complete') });
    expect(empty).toEqual(['complete']);
    const never: unknown[] = [];
    const subscription = of(1).pipe(audit(withSignal(() => NEVER))).subscribe({ next: v => never.push(v), complete: () => never.push('complete') });
    expect(subscription.closed).toBe(false);
    expect(never).toEqual([]);
    subscription.unsubscribe();
  });
  it('cancellation tears down source and duration without emitting or completing', () => {
    const input = new Subject<number>();
    const closed: string[] = [];
    const source = new Observable<number>(s => { const sub = input.subscribe(s); return () => { sub.unsubscribe(); closed.push('source'); }; });
    const duration = new Observable<void>(() => () => { closed.push('duration'); });
    const next = vi.fn(); const complete = vi.fn();
    const subscription = source.pipe(audit(withSignal(() => duration))).subscribe({ next, complete });
    input.next(1); subscription.unsubscribe();
    expect(closed.sort()).toEqual(['duration', 'source']);
    expect(next).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
  });
  it('a duration error terminates immediately without flushing', () => {
    const source = new Subject<number>(); const duration = new Subject<void>();
    const events: unknown[] = [];
    const subscription = source.pipe(audit(withSignal(() => duration))).subscribe({ next: v => events.push(v), error: e => events.push(e) });
    source.next(1); duration.error('failure');
    expect(events).toEqual(['failure']); expect(subscription.closed).toBe(true);
  });
});

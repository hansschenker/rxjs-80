import { describe, expect, it } from 'vitest';
import { Observable, Subject, of } from 'rxjs';
import { merge, concat, exhaust, switchLatest } from '../src/index.js';
import { withConcurrency, withProjection, withSources } from '../src/controls.js';

describe('flattening admission, projection, and cancellation policies', () => {
  it('exhaust does not project ignored values and indexes accepted inputs only', () => {
    const source = new Subject<string>(); const inner = new Subject<number>();
    const calls: unknown[] = []; const output: number[] = [];
    const sub = source.pipe(exhaust(withProjection((value: string, index) => {
      calls.push([value, index]);
      if (value === 'ignored') throw new Error('must not run');
      return inner;
    }))).subscribe(v => output.push(v));
    source.next('A'); source.next('ignored'); inner.next(10); inner.complete();
    source.next('C');
    expect(calls).toEqual([['A', 0], ['C', 1]]); expect(output).toEqual([10]);
    sub.unsubscribe();
  });
  it('bounded merge delays projection until capacity is available', () => {
    const source = new Subject<string>();
    const inputs = new Map<string, Subject<string>>(); const calls: string[] = []; const output: string[] = [];
    const sub = source.pipe(merge(withProjection((value: string) => {
      calls.push(value); const inner = new Subject<string>(); inputs.set(value, inner); return inner;
    }), withConcurrency(2))).subscribe(v => output.push(v));
    source.next('A'); source.next('B'); source.next('C');
    expect(calls).toEqual(['A', 'B']);
    inputs.get('B')!.next('b'); inputs.get('A')!.complete();
    expect(calls).toEqual(['A', 'B', 'C']); expect(output).toEqual(['b']);
    sub.unsubscribe();
    expect(inputs.get('C')!.observed).toBe(false);
  });
  it('concat queues source values, projects on admission, and drains after source completion', () => {
    const source = new Subject<string>(); const a = new Subject<string>(); const b = new Subject<string>();
    const calls: string[] = []; const events: string[] = [];
    source.pipe(concat(withProjection((value: string) => { calls.push(value); return value === 'A' ? a : b; })))
      .subscribe({ next: v => events.push(v), complete: () => events.push('complete') });
    source.next('A'); source.next('B'); source.complete();
    expect(calls).toEqual(['A']);
    a.next('a'); a.complete(); expect(calls).toEqual(['A', 'B']);
    b.next('b'); b.complete(); expect(events).toEqual(['a', 'b', 'complete']);
  });
  it('switchLatest closes the previous inner before projecting the replacement', () => {
    const source = new Subject<string>(); const events: string[] = [];
    const sub = source.pipe(switchLatest(withProjection((value: string) => {
      events.push(`project ${value}`);
      return new Observable<string>(s => { s.next(value); return () => events.push(`close ${value}`); });
    }))).subscribe(v => events.push(`emit ${v}`));
    source.next('A'); source.next('B');
    expect(events).toEqual(['project A', 'emit A', 'close A', 'project B', 'emit B']);
    sub.unsubscribe(); expect(events.at(-1)).toBe('close B');
  });
  it('switchLatest waits for the current inner after source completion', () => {
    const inner = new Subject<number>(); const events: unknown[] = [];
    of(inner).pipe(switchLatest()).subscribe({ next: v => events.push(v), complete: () => events.push('complete') });
    inner.next(1); expect(events).toEqual([1]); inner.complete(); expect(events).toEqual([1, 'complete']);
  });
  it('plain higher-order flattening and explicit peer sources remain distinct modes', () => {
    const nested: number[] = []; const peers: number[] = [];
    of(of(1, 2), of(3)).pipe(merge()).subscribe(v => nested.push(v));
    of(1).pipe(merge(withSources(of(2), of(3)))).subscribe(v => peers.push(v));
    expect(nested).toEqual([1, 2, 3]); expect(peers).toEqual([1, 2, 3]);
    const serial: number[] = [];
    of(1).pipe(concat(withSources(of(2), of(3)))).subscribe(v => serial.push(v));
    expect(serial).toEqual([1, 2, 3]);
  });
});

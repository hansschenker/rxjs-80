import { expect, it } from 'vitest';
import fc from 'fast-check';
import { of, Subject } from 'rxjs';
import type { Observable } from 'rxjs';
import { take, skip, distinct, map, buffer } from '../src/index.js';
import { withCount, withFromEnd, withHistory, withKey, withComparer, withResetSignal, withWhile, withConstant, withProperty } from '../src/controls.js';

const collect = <T>(source: Observable<T>): T[] => { const values: T[] = []; source.subscribe(v => values.push(v)); return values; };
const options = { numRuns: 200, seed: 80 };

it('count selection obeys array prefix/tail laws over generated finite traces', () => {
  fc.assert(fc.property(fc.array(fc.integer()), fc.integer({ min: 0, max: 40 }), (values, n) => {
    expect(collect(of(...values).pipe(take(withCount(n))))).toEqual(values.slice(0, n));
    expect(collect(of(...values).pipe(skip(withCount(n))))).toEqual(values.slice(n));
    expect(collect(of(...values).pipe(take(withCount(n), withFromEnd())))).toEqual(n === 0 ? [] : values.slice(-n));
    expect(collect(of(...values).pipe(skip(withCount(n), withFromEnd())))).toEqual(values.slice(0, Math.max(0, values.length - n)));
  }), options);
});
it('buffer count partitions a finite trace without losing or reordering values', () => {
  fc.assert(fc.property(fc.array(fc.integer()), fc.integer({ min: 1, max: 20 }), (values, size) => {
    const chunks = collect(of(...values).pipe(buffer(withCount(size))));
    expect(chunks.flat()).toEqual(values);
    expect(chunks.every(chunk => chunk.length > 0 && chunk.length <= size)).toBe(true);
  }), options);
});
it('distinct all-history and last-emitted policies satisfy different reference models', () => {
  fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 5 })), values => {
    expect(collect(of(...values).pipe(distinct(withHistory('all'))))).toEqual([...new Set(values)]);
    expect(collect(of(...values).pipe(distinct(withHistory('lastEmitted')))))
      .toEqual(values.filter((v, i) => i === 0 || v !== values[i - 1]));
  }), options);
});
it('key selection compares keys but preserves original values', () => {
  const values = [{ id: 1, label: 'A' }, { id: 1, label: 'B' }, { id: 2, label: 'C' }, { id: 1, label: 'D' }];
  const key = withKey((v: typeof values[number]) => v.id);
  expect(collect(of(...values).pipe(distinct(withHistory('all'), key)))).toEqual([values[0], values[2]]);
  expect(collect(of(...values).pipe(distinct(withHistory('lastEmitted'), key)))).toEqual([values[0], values[2], values[3]]);
});
it('preserves Set equality for all-history and strict equality for last-emitted', () => {
  expect(collect(of(NaN, NaN).pipe(distinct(withHistory('all'))))).toHaveLength(1);
  expect(collect(of(NaN, NaN).pipe(distinct(withHistory('lastEmitted'))))).toHaveLength(2);
  expect(collect(of(10, 8, 9, 12).pipe(distinct(withHistory('lastEmitted'), withComparer((previous: number, current) => current <= previous)))))
    .toEqual([10, 12]);
});
it('reset signals clear all-history memory without emitting values', () => {
  const source = new Subject<number>(); const reset = new Subject<void>(); const output: number[] = [];
  const sub = source.pipe(distinct(withHistory('all'), withResetSignal(reset))).subscribe(v => output.push(v));
  source.next(1); source.next(1); reset.next(); source.next(1);
  expect(output).toEqual([1, 1]); sub.unsubscribe();
});
it('while selection is a prefix rule, and inclusive take retains the boundary value', () => {
  expect(collect(of(1, 2, 4, 1).pipe(take(withWhile((v: number) => v < 3))))).toEqual([1, 2]);
  expect(collect(of(1, 2, 4, 1).pipe(take(withWhile((v: number) => v < 3, true))))).toEqual([1, 2, 4]);
  expect(collect(of(1, 2, 4, 1).pipe(skip(withWhile((v: number) => v < 3))))).toEqual([4, 1]);
});
it('constant and nested property mapping preserve reference identity and missing paths', () => {
  const value = { fixed: true };
  const mapped = collect(of(1, 2).pipe(map(withConstant(value))));
  expect(mapped[0]).toBe(value); expect(mapped[1]).toBe(value);
  expect(collect(of({ user: { name: 'A' } }, { user: null }, null).pipe(map(withProperty('user', 'name')))))
    .toEqual(['A', undefined, undefined]);
});

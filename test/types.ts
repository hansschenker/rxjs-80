/** Compile-time contract checks; this function is deliberately never called. */
import { of, Subject } from 'rxjs';
import type { ConnectableObservable, Observable } from 'rxjs';
import { audit, buffer, concat, distinct, map, merge, sample, share, skip, take, window } from '../src/index.js';
import { withCount, withFromEnd, withWhile, withTime, withSignal, withProjection, withHistory,
  withKey, withComparer, withResetSignal, withConnection, withReplay, withProperty, withSources,
  withOpenings, withClosing } from '../src/controls.js';

const typeContracts = () => {
  const values = of(1, 2, 3);
  const selected: Observable<number> = values.pipe(take(withCount(2)));
  const projected: Observable<string> = values.pipe(merge(withProjection((n: number) => of(String(n)))));
  const serial: Observable<string> = values.pipe(concat(withProjection((n: number) => of(String(n)))));
  const grouped: Observable<number[]> = values.pipe(buffer(withCount(2)));
  const windows: Observable<Observable<number>> = values.pipe(window(withCount(2)));
  const manual: ConnectableObservable<number> = share<number>(withConnection('manual'), withReplay(1))(values);
  const narrowed: Observable<number> = of(1 as number | string, 'x' as number | string).pipe(take(withWhile((v: number | string): v is number => typeof v === 'number')));
  const keyed: Observable<{ id: number }> = of({ id: 1 }).pipe(distinct(withHistory('lastEmitted'), withKey((v: { id: number }) => v.id)));
  const property: Observable<string | undefined> = of({ user: { name: 'A' } }).pipe(map(withProperty('user', 'name')));
  const mixed: Observable<number | string> = values.pipe(merge(withSources(of('x'))));
  const openings = new Subject<string>();
  const opened: Observable<number[]> = values.pipe(buffer(withOpenings(openings), withClosing((key: string) => of(key))));
  void [selected, projected, serial, grouped, windows, manual, narrowed, keyed, property, mixed, opened];
  // @ts-expect-error audit needs a duration selector, not a directly supplied signal
  audit(withSignal(openings));
  // @ts-expect-error sample takes a notifier directly, not a duration selector
  sample(withSignal(() => of(0)));
  // @ts-expect-error from-end selection applies to count control only
  take(withSignal(openings), withFromEnd());
  // @ts-expect-error count is not a debounce/audit control
  audit(withCount(3));
  // @ts-expect-error skip has no inclusive boundary-value mode
  skip(withWhile((n: number) => n > 0, true));
  // @ts-expect-error all-history uses Set equality, not an adjacent-value comparer
  distinct(withHistory('all'), withComparer((a: number, b: number) => a === b));
  // @ts-expect-error reset signals belong to all-history mode
  distinct(withHistory('lastEmitted'), withResetSignal(openings));
  // @ts-expect-error group openings need their closing selector
  buffer(withOpenings(openings));
  // @ts-expect-error unrelated configuration cannot be silently accepted
  share(withTime(10));
};
void typeContracts;

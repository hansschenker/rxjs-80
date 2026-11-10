import { Subject } from 'rxjs';
import {
  of, buffer, map, take, audit, merge, concat, exhaust, switchLatest, distinct,
} from '../src/index.js';
import {
  withCount, withFromEnd, withSignal, withProjection, withConcurrency, withHistory, withKey,
} from '../src/controls.js';

// Value modulation: the domain function changes values, the family supplies policy.
of(1, 2, 3).pipe(map(n => n * 10), buffer(withCount(2))).subscribe(console.log);
// [10, 20], [30]

// Route modulation: retain a tail and deliver it at source completion.
of(1, 2, 3, 4).pipe(take(withCount(2), withFromEnd())).subscribe(console.log);
// 3, 4

// Time modulation through an event boundary, with no wall-clock timer.
const input = new Subject<string>();
const release = new Subject<void>();
const connection = input.pipe(audit(withSignal(() => release))).subscribe(console.log);
input.next('A'); input.next('B'); release.next(); // B
connection.unsubscribe();

// The same projection under four distinct admission policies.
const load = (id: number) => of({ id, status: 'loaded' as const });
of(1, 2).pipe(merge(withProjection(load), withConcurrency(4))).subscribe(console.log);
of(1, 2).pipe(concat(withProjection(load))).subscribe(console.log);
of(1, 2).pipe(exhaust(withProjection(load))).subscribe(console.log);
of(1, 2).pipe(switchLatest(withProjection(load))).subscribe(console.log);
// These synchronous inners complete immediately; the temporal tests use active inners
// to demonstrate overlap, queueing, cancellation, and ignored inputs.

const getId = (value: { id: number }) => value.id;
of({ id: 1 }, { id: 2 }, { id: 1 }).pipe(
  distinct(withHistory('lastEmitted'), withKey(getId))
).subscribe(console.log); // all three

import { expect, it } from 'vitest';
import { Observable, Subject, merge as rxMerge, of } from 'rxjs';
import { share } from '../src/index.js';
import { withConnection, withInitialValue, withLastValue, withReplay, withSelector, withSharing } from '../src/controls.js';

it('auto sharing starts on demand, shares one connection, and resets when the last consumer leaves', () => {
  const input = new Subject<number>(); let starts = 0; let closes = 0;
  const source = new Observable<number>(s => { starts++; const sub = input.subscribe(s); return () => { sub.unsubscribe(); closes++; }; });
  const shared = source.pipe(share());
  expect(starts).toBe(0);
  const a: number[] = []; const b: number[] = [];
  const one = shared.subscribe(v => a.push(v)); const two = shared.subscribe(v => b.push(v));
  expect(starts).toBe(1); input.next(1); expect(a).toEqual([1]); expect(b).toEqual([1]);
  one.unsubscribe(); expect(closes).toBe(0); two.unsubscribe(); expect(closes).toBe(1);
  const three = shared.subscribe(); expect(starts).toBe(2); three.unsubscribe(); expect(closes).toBe(2);
});
it('replay preserves completed history for late subscribers without re-executing the source', () => {
  let starts = 0;
  const source = new Observable<number>(s => { starts++; s.next(1); s.next(2); s.complete(); });
  const shared = source.pipe(share(withReplay(1, { refCount: true })));
  const a: number[] = []; const b: number[] = [];
  shared.subscribe(v => a.push(v)); shared.subscribe(v => b.push(v));
  expect(a).toEqual([1, 2]); expect(b).toEqual([2]); expect(starts).toBe(1);
});
it('replay refCount false retains an active connection and true closes it at zero consumers', () => {
  for (const refCount of [false, true]) {
    const input = new Subject<number>(); let closed = 0;
    const source = new Observable<number>(s => { const sub = input.subscribe(s); return () => { sub.unsubscribe(); closed++; }; });
    const sub = source.pipe(share(withReplay(1, { refCount }))).subscribe();
    sub.unsubscribe(); expect(closed).toBe(refCount ? 1 : 0);
    input.complete(); expect(closed).toBe(1);
  }
});
it('manual publish modes preserve connection ownership, initial values, replay and completion', () => {
  const source = new Subject<number>();
  const shared = share<number>(withConnection('manual'), withInitialValue(0))(source);
  const values: number[] = []; const consumer = shared.subscribe(v => values.push(v));
  source.next(1); expect(values).toEqual([0]);
  const connection = shared.connect(); source.next(2); expect(values).toEqual([0, 2]);
  consumer.unsubscribe(); expect(connection.closed).toBe(false);
  connection.unsubscribe(); expect(source.observed).toBe(false);

  const replayed = share<number>(withConnection('manual'), withReplay(1))(of(1, 2));
  replayed.connect(); const late: number[] = []; replayed.subscribe(v => late.push(v));
  expect(late).toEqual([2]);

  const input = new Subject<number>(); const last = share<number>(withConnection('manual'), withLastValue())(input);
  const output: number[] = []; last.subscribe(v => output.push(v)); const link = last.connect();
  input.next(1); input.next(2); expect(output).toEqual([]); input.complete(); expect(output).toEqual([2]);
  expect(link.closed).toBe(true);
});
it('selector-scoped publish connects a synchronous source only after its consumers are attached', () => {
  let starts = 0;
  const source = new Observable<number>(s => { starts++; s.next(1); s.next(2); s.complete(); });
  const values: number[] = [];
  source.pipe(share(withSelector((s: Observable<number>) => rxMerge(s, s)))).subscribe(v => values.push(v));
  expect(starts).toBe(1); expect(values).toEqual([1, 1, 2, 2]);
});
it('explicit sharing reset settings preserve a terminal subject when resetOnComplete is false', () => {
  let starts = 0;
  const source = new Observable<number>(s => { starts++; s.next(1); s.complete(); });
  const shared = source.pipe(share(withSharing<number>({ resetOnComplete: false })));
  const a: number[] = []; const b: number[] = [];
  shared.subscribe(v => a.push(v)); shared.subscribe(v => b.push(v));
  expect(a).toEqual([1]); expect(b).toEqual([]); expect(starts).toBe(1);
});

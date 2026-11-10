# Migration by behavioral family

Import operators from `rxjs-80` and configuration helpers from `rxjs-80/controls`. The tables show the ordinary supported signatures; deprecated result-selector overloads are intentionally excluded. Scheduler, boundary, cancellation, and completion behavior comes from the selected RxJS 7.8.2 implementation.

## Delivery controlled by time or signals

| RxJS 7.8.2 | rxjs-80 |
|---|---|
| `audit(selectDuration)` | `audit(withSignal(selectDuration))` |
| `auditTime(ms, scheduler)` | `audit(withTime(ms, scheduler))` |
| `debounce(selectDuration)` | `debounce(withSignal(selectDuration))` |
| `debounceTime(ms, scheduler)` | `debounce(withTime(ms, scheduler))` |
| `sample(trigger$)` | `sample(withSignal(trigger$))` |
| `sampleTime(period, scheduler)` | `sample(withTime(period, scheduler))` |
| `throttle(selectDuration, config)` | `throttle(withSignal(selectDuration), withEdges(config))` |
| `throttleTime(ms, scheduler, config)` | `throttle(withTime(ms, scheduler), withEdges(config))` |

The duration-selector families select a duration after a source value is admitted. Sample listens to a separately supplied notifier. A timer can itself be a signal; the API distinguishes how control is supplied, not two disjoint kinds of time.

## Buffer and window

Replace `F` below with either `buffer` or `window`.

| Original form | Family form |
|---|---|
| `F(boundary$)` | `F(withSignal(boundary$))` |
| `FCount(size)` | `F(withCount(size))` |
| `FCount(size, startEvery)` | `F(withCount(size), withStartEvery(startEvery))` |
| `FTime(ms, scheduler)` | `F(withTime(ms, scheduler))` |
| `FTime(ms, every, maxSize, scheduler)` | `F(withTime(ms, scheduler), withStartEvery(every), withMaxSize(maxSize))` |
| `FTime(ms, undefined, maxSize, scheduler)` | `F(withTime(ms, scheduler), withMaxSize(maxSize))` |
| `FWhen(closeFactory)` | `F(withClosing(closeFactory))` |
| `FToggle(open$, closeFor)` | `F(withOpenings(open$), withClosing(closeFor))` |

`withStartEvery` is interpreted in milliseconds/scheduler units for time control, and in source-value counts for count control. Buffer emits arrays at closure. Window emits each inner Observable when opened; values then flow through that inner stream. Overlapping openings can place one source value in several groups. Source completion, empty groups, and closing-notifier completion follow the selected native variant.

## Take and skip

| RxJS | rxjs-80 |
|---|---|
| `take(n)` | `take(withCount(n))` |
| `takeLast(n)` | `take(withCount(n), withFromEnd())` |
| `takeUntil(stop$)` | `take(withSignal(stop$))` |
| `takeWhile(predicate)` | `take(withWhile(predicate))` |
| `takeWhile(predicate, true)` | `take(withWhile(predicate, true))` |
| `skip(n)` | `skip(withCount(n))` |
| `skipLast(n)` | `skip(withCount(n), withFromEnd())` |
| `skipUntil(start$)` | `skip(withSignal(start$))` |
| `skipWhile(predicate)` | `skip(withWhile(predicate))` |

With a signal, take completes when the notifier emits; skip opens its gate. A while condition describes the initial prefix. It does not re-open when a later value satisfies the predicate again.

## Inner-stream admission and peer sources

| RxJS | rxjs-80 |
|---|---|
| `mergeAll(limit)` | `merge(withConcurrency(limit))` |
| `mergeAll()` | `merge()` |
| `mergeMap(project, limit)` / `flatMap(project, limit)` | `merge(withProjection(project), withConcurrency(limit))` |
| `mergeMapTo(inner$, limit)` | `merge(withProjection(() => inner$), withConcurrency(limit))` |
| pipeable `merge(a$, b$)` / `mergeWith(a$, b$)` | `merge(withSources(a$, b$))` |
| `concatAll()` | `concat()` |
| `concatMap(project)` | `concat(withProjection(project))` |
| `concatMapTo(inner$)` | `concat(withProjection(() => inner$))` |
| pipeable `concat(a$, b$)` / `concatWith(a$, b$)` | `concat(withSources(a$, b$))` |
| `switchAll()` | `switchLatest()` |
| `switchMap(project)` | `switchLatest(withProjection(project))` |
| `switchMapTo(inner$)` | `switchLatest(withProjection(() => inner$))` |
| `exhaust()` / `exhaustAll()` | `exhaust()` |
| `exhaustMap(project)` | `exhaust(withProjection(project))` |

The `merge`/`concat` rows refer to exports from **rxjs/operators**. Static creation functions `rxjs.merge(...)` and `rxjs.concat(...)` remain available from RxJS. Legacy scheduler overloads of the deprecated pipeable merge/concat helpers are not mirrored; use explicit scheduling/source construction when migrating those signatures.

Do not translate the fused variants into eager `map(project)` followed by flattening. Projection itself is subject to admission and cancellation order. `switchLatest` is used as a valid TypeScript identifier because `switch` is a keyword. Accumulating `mergeScan` and `switchScan` retain their existing names and semantics.

## Mapping and distinction

| RxJS | rxjs-80 |
|---|---|
| `map(project)` | `map(project)` |
| `mapTo(value)` | `map(withConstant(value))` |
| `pluck('user', 'name')` | `map(withProperty('user', 'name'))` |
| `distinct()` | `distinct()` or `distinct(withHistory('all'))` |
| `distinct(getKey, reset$)` | `distinct(withHistory('all'), withKey(getKey), withResetSignal(reset$))` |
| `distinct(undefined, reset$)` | `distinct(withHistory('all'), withResetSignal(reset$))` |
| `distinctUntilChanged(compare)` | `distinct(withHistory('lastEmitted'), withComparer(compare))` |
| `distinctUntilChanged(undefined, getKey)` | `distinct(withHistory('lastEmitted'), withKey(getKey))` |
| `distinctUntilChanged(compare, getKey)` | `distinct(withHistory('lastEmitted'), withKey(getKey), withComparer(compare))` |
| `distinctUntilKeyChanged('id', compare)` | `distinct(withHistory('lastEmitted'), withKey(x => x.id), withComparer(compare))` |

Omit optional key/comparer/reset controls when not needed. Key selection changes comparison, not the emitted payload. All-history mode uses Set equality, and its memory can be reset by next notifications. Last-emitted mode compares against the last emitted key, not every incoming key.

## Sharing and publishing

| RxJS | rxjs-80 |
|---|---|
| `share()` | `share()` |
| `share(config)` | `share(withSharing(config))` |
| `shareReplay(n)` | `share(withReplay(n))` |
| `shareReplay({bufferSize: n, windowTime, scheduler, refCount})` | `share(withReplay(n, {windowTime, scheduler, refCount}))` |
| `publish()` | `share(withConnection('manual'))` |
| `publishBehavior(seed)` | `share(withConnection('manual'), withInitialValue(seed))` |
| `publishLast()` | `share(withConnection('manual'), withLastValue())` |
| `publishReplay(n, time, scheduler)` | `share(withConnection('manual'), withReplay(n, {windowTime: time, scheduler}))` |
| `publish(selector)` | `share(withSelector(selector))` |
| `publishReplay(n, time, selector, scheduler)` | `share(withReplay(n, {windowTime: time, scheduler}), withSelector(selector))` |

Selector helpers currently accept Observable-returning selectors; legacy publish selectors returning other ObservableInput types can be wrapped with `from`. The manual modes preserve legacy subject reuse through native delegation. They are not interchangeable with auto sharing defaults. `withReplay` defaults to `refCount: false`, matching native shareReplay. Set it to true when the connection should close at zero consumers. `withSharing` permits explicit reset notifiers and custom connectors.

For manual connections, apply the operator directly so TypeScript retains the ConnectableObservable subtype:

```typescript
const shared = share<number>(
  withConnection('manual'),
  withReplay(1)
)(source$);

const consumer = shared.subscribe(render);
const connection = shared.connect();
// Later: close each owned lifetime explicitly.
consumer.unsubscribe();
connection.unsubscribe();
```

The `publish…` functions are deprecated in RxJS itself. This facade delegates to them only to preserve the selected legacy behavior for the pinned version. `connect`, `multicast`, and `refCount` remain explicit compatibility exports in this release.

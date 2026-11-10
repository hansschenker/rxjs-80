# Operator catalog

Generated from `planning/operator-catalog.json` by `npm run inventory -- --write`.

Exactly **80** public operator/creation functions: **15** consolidated families, **58** unchanged pipeable names, and **7** creation functions.

The comparison scope is 113 names from `rxjs/operators` plus 7 explicitly selected creation names: 120 names represented by 80 public names. Configuration helpers are counted separately; this is not a claim that the complete RxJS API contains only 80 functions.

| Public name | Primary learning group | Implementation | Original names represented |
|---|---|---|---|
| `audit` | time | family | `audit`, `auditTime` |
| `buffer` | value | family | `buffer`, `bufferCount`, `bufferTime`, `bufferToggle`, `bufferWhen` |
| `catchError` | route | passthrough | `catchError` |
| `combineAll` | route | passthrough | `combineAll` |
| `combineLatest` | route | passthrough | `combineLatest` |
| `combineLatestAll` | route | passthrough | `combineLatestAll` |
| `combineLatestWith` | route | passthrough | `combineLatestWith` |
| `concat` | route | family | `concat`, `concatAll`, `concatMap`, `concatMapTo`, `concatWith` |
| `connect` | route | passthrough | `connect` |
| `count` | value | passthrough | `count` |
| `debounce` | time | family | `debounce`, `debounceTime` |
| `defaultIfEmpty` | value | passthrough | `defaultIfEmpty` |
| `defer` | route | creation | `defer` |
| `delay` | time | passthrough | `delay` |
| `delayWhen` | time | passthrough | `delayWhen` |
| `dematerialize` | value | passthrough | `dematerialize` |
| `distinct` | route | family | `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged` |
| `elementAt` | route | passthrough | `elementAt` |
| `endWith` | route | passthrough | `endWith` |
| `every` | value | passthrough | `every` |
| `exhaust` | route | family | `exhaust`, `exhaustAll`, `exhaustMap` |
| `expand` | route | passthrough | `expand` |
| `filter` | route | passthrough | `filter` |
| `finalize` | route | passthrough | `finalize` |
| `find` | route | passthrough | `find` |
| `findIndex` | value | passthrough | `findIndex` |
| `first` | route | passthrough | `first` |
| `from` | route | creation | `from` |
| `generate` | route | creation | `generate` |
| `groupBy` | route | passthrough | `groupBy` |
| `ignoreElements` | route | passthrough | `ignoreElements` |
| `interval` | time | creation | `interval` |
| `isEmpty` | value | passthrough | `isEmpty` |
| `last` | route | passthrough | `last` |
| `map` | value | family | `map`, `mapTo`, `pluck` |
| `materialize` | value | passthrough | `materialize` |
| `max` | value | passthrough | `max` |
| `merge` | route | family | `merge`, `mergeAll`, `mergeMap`, `mergeMapTo`, `mergeWith`, `flatMap` |
| `mergeScan` | value | passthrough | `mergeScan` |
| `min` | value | passthrough | `min` |
| `multicast` | route | passthrough | `multicast` |
| `observeOn` | time | passthrough | `observeOn` |
| `of` | route | creation | `of` |
| `onErrorResumeNext` | route | passthrough | `onErrorResumeNext` |
| `pairwise` | value | passthrough | `pairwise` |
| `partition` | route | passthrough | `partition` |
| `race` | route | passthrough | `race` |
| `raceWith` | route | passthrough | `raceWith` |
| `range` | route | creation | `range` |
| `reduce` | value | passthrough | `reduce` |
| `refCount` | route | passthrough | `refCount` |
| `repeat` | route | passthrough | `repeat` |
| `repeatWhen` | route | passthrough | `repeatWhen` |
| `retry` | route | passthrough | `retry` |
| `retryWhen` | route | passthrough | `retryWhen` |
| `sample` | time | family | `sample`, `sampleTime` |
| `scan` | value | passthrough | `scan` |
| `sequenceEqual` | value | passthrough | `sequenceEqual` |
| `share` | route | family | `share`, `shareReplay`, `publish`, `publishBehavior`, `publishLast`, `publishReplay` |
| `single` | route | passthrough | `single` |
| `skip` | route | family | `skip`, `skipLast`, `skipUntil`, `skipWhile` |
| `startWith` | route | passthrough | `startWith` |
| `subscribeOn` | time | passthrough | `subscribeOn` |
| `switchLatest` | route | family | `switchAll`, `switchMap`, `switchMapTo` |
| `switchScan` | value | passthrough | `switchScan` |
| `take` | route | family | `take`, `takeLast`, `takeUntil`, `takeWhile` |
| `tap` | route | passthrough | `tap` |
| `throttle` | time | family | `throttle`, `throttleTime` |
| `throwIfEmpty` | route | passthrough | `throwIfEmpty` |
| `timeInterval` | value | passthrough | `timeInterval` |
| `timeout` | time | passthrough | `timeout` |
| `timeoutWith` | time | passthrough | `timeoutWith` |
| `timer` | time | creation | `timer` |
| `timestamp` | value | passthrough | `timestamp` |
| `toArray` | value | passthrough | `toArray` |
| `window` | route | family | `window`, `windowCount`, `windowTime`, `windowToggle`, `windowWhen` |
| `withLatestFrom` | route | passthrough | `withLatestFrom` |
| `zip` | route | passthrough | `zip` |
| `zipAll` | route | passthrough | `zipAll` |
| `zipWith` | route | passthrough | `zipWith` |

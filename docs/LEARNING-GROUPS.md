# Learn RxJS behavior: Value, Time, and Route Modulators

Start with **what flows over time**, then choose **what decision the operator must make**. Read the family name as the main behavior and each `with…(...)` clause as an explicit policy choice.

These three groups organize learning. They are not mutually exclusive semantic classes. Each catalog entry has one primary group for navigation and secondary tags for overlapping concerns. Lifecycle, errors, cancellation, state, and sharing remain visible across the groups. Creation functions establish a flow; observer/effect hooks observe one. Their placement is a supporting learning role rather than a claim that every function modifies existing values.

## 1. Value Modulators

**Question:** What values, collections, summaries, or remembered state should flow?

| Related behaviors | What to compare |
|---|---|
| `map` and its constant/property options | Apply a domain function, choose a fixed value, or retrieve a path |
| `scan` / `reduce` | Publish intermediate accumulated states versus wait for the final state |
| `buffer` / `toArray` / `pairwise` | Deliver bounded groups, one completion-delimited group, or consecutive pairs |
| `count` / `min` / `max` / `every` / `isEmpty` | Produce a summary or decision; examine early termination separately |
| `materialize` / `dematerialize` | Represent lifecycle notifications as values or interpret them again |
| `timestamp` / `timeInterval` | Add clock-derived metadata; these do not schedule delivery |
| `mergeScan` / `switchScan` | Combine state accumulation with an inner-subscription policy |

**Intuition:** `map(n => n * 10)` changes each numeric package. `buffer(withCount(2))` changes the shape of packages into arrays.

**Specification:** Given inputs 1, 2, 3 and source completion, mapping then buffering in pairs delivers `[10, 20]`, then `[30]`, then completes.

**Verification:** The generated-array tests check ordering and preservation when count buffers are flattened. See `test/properties.test.ts` and `examples/learning.ts`.

## 2. Time Modulators

**Question:** What event, waiting rule, or scheduled moment controls delivery?

| Related behaviors | On a new source value while waiting |
|---|---|
| `audit` | Remember the latest; keep the existing duration |
| `debounce` | Remember the latest; cancel the duration and start another |
| `sample` | Remember the latest; an independent notifier decides sampling moments |
| `throttle` | Apply leading/trailing delivery under the current duration policy |
| `delay` / `delayWhen` | Delay delivery by a time configuration or selected signal |
| `observeOn` / `subscribeOn` | Schedule notifications versus schedule source subscription |
| `timeout` / `timeoutWith` | Apply a deadline policy and error or change to a fallback |
| `interval` / `timer` | Create timing notifications; these are source roles |

**Time is not necessarily a fixed duration.** A user click can end a wait. A scheduler supplies clock and execution ordering; the family chooses when a schedule starts, resets, or is cancelled. `withTime(300)` has different anchors under audit, debounce, and sample.

**Intuition:** Audit means “remember the latest while waiting for the duration signal.”

**Specification:** Given A is remembered, when B and C arrive before the duration signal, retain C and keep the same duration subscription. When the duration emits next, close that subscription and deliver C. Silent duration completion does not deliver C.

**Verification:** Read `docs/AUDIT.feature`, then `test/audit.test.ts`. Virtual-time tests compare notifications and source lifetimes, including completion, errors, and cancellation. Source-completion flushing is deliberately compared between audit and debounce.

## 3. Route Modulators

**Question:** Which source values, inner streams, subscriptions, or notifications are admitted and connected?

| Related behaviors | Main policy distinction |
|---|---|
| `take` / `skip` / `filter` | Select or suppress a prefix/tail, or decide independently for each value |
| `distinct` history modes | Remember all seen keys versus compare with the last emitted key |
| `merge` / `concat` / `switchLatest` / `exhaust` | Allow overlap / queue / only latest / ignore while busy |
| `window` / `groupBy` / `partition` | Route values into inner streams, groups, or separate outputs |
| `combineLatest…` / `withLatestFrom` / `zip…` / `race…` | Choose which input notifications trigger combinations or determine the active source |
| `share` / `connect` / `multicast` / `refCount` | Own shared execution, connectors, connection lifetime, and reset policies |
| `catchError` / `retry…` / `repeat…` / `onErrorResumeNext` | Route termination into replacement or renewed execution |
| `tap` / `finalize` | Observe notifications or teardown through user-supplied effects |
| `of` / `from` / `defer` / `generate` / `range` | Enter the dataflow; these are source roles |

**Intuition:** `exhaust(withProjection(submit))` accepts a submission only while idle. `switchLatest(withProjection(search))` closes the previous search subscription before selecting its replacement.

**Specification:** Given an active exhaust inner subscription, when another source value arrives, ignore it without invoking the projector. Given a switch inner, when a new source value arrives, close the old inner before invoking the next projector.

**Verification:** `test/flattening.test.ts` checks projector calls, admitted indices, queue draining, cancellation order, and completion. `test/sharing.test.ts` checks reference counts, manual connection ownership, retained replay, and reset behavior. Closing a subscription only cancels underlying work to the extent that its producer supports teardown.

## A suggested learning path

1. **Value:** map → scan → buffer. Explain what is carried, what is retained, and when aggregates appear.
2. **Route:** filter → take/skip → distinct. Separate per-value decisions, prefix rules, and memory scope.
3. **Time:** audit → debounce → sample → throttle. Compare identical input traces under different waiting policies.
4. **Route with inner streams:** merge → concat → switchLatest → exhaust. Track projection, subscription, completion, and cancellation separately.
5. **Sharing:** compare one cold subscription, multiple independent subscriptions, and explicitly shared execution. Make connection ownership visible.
6. **Lifecycle:** add source errors, notifier completion, early cancellation, and same-frame event ordering to each scenario.

For every lesson: **Intuition → Specification → Verification**. A successful ordinary trace is not complete coverage; each lesson identifies lifecycle cases to test next.

## Complete grouped index

Every public name appears once below. The machine-readable catalog contains secondary policy tags and original-name mappings.

### Value Modulators (20)

`buffer`, `count`, `defaultIfEmpty`, `dematerialize`, `every`, `findIndex`, `isEmpty`, `map`, `materialize`, `max`, `mergeScan`, `min`, `pairwise`, `reduce`, `scan`, `sequenceEqual`, `switchScan`, `timeInterval`, `timestamp`, `toArray`.

### Time Modulators (12)

`audit`, `debounce`, `delay`, `delayWhen`, `interval`, `observeOn`, `sample`, `subscribeOn`, `throttle`, `timeout`, `timeoutWith`, `timer`.

### Route Modulators (48)

`catchError`, `combineAll`, `combineLatest`, `combineLatestAll`, `combineLatestWith`, `concat`, `connect`, `defer`, `distinct`, `elementAt`, `endWith`, `exhaust`, `expand`, `filter`, `finalize`, `find`, `first`, `from`, `generate`, `groupBy`, `ignoreElements`, `last`, `merge`, `multicast`, `of`, `onErrorResumeNext`, `partition`, `race`, `raceWith`, `range`, `refCount`, `repeat`, `repeatWhen`, `retry`, `retryWhen`, `share`, `single`, `skip`, `startWith`, `switchLatest`, `take`, `tap`, `throwIfEmpty`, `window`, `withLatestFrom`, `zip`, `zipAll`, `zipWith`.


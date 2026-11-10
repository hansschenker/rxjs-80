# Behavioral contract

The project separates a **family** from explicit **policy configuration**. A family interprets configuration and returns a pipeable operator. Controls are data, not operators. Operators delegate to the pinned RxJS implementation. State belongs to each resulting subscription unless sharing is explicitly selected.

## From intuition to evidence

State → Step → Trace → Behavior → Specification → Implementation → Verification

- **State:** a snapshot, such as audit waiting with a retained value.
- **Step:** an incoming event changes state and may produce ordered actions.
- **Trace:** a finite sequence of observed events/actions, including subscription lifetimes.
- **Behavior:** a possible history permitted by the selected family and policies.
- **Specification:** the allowed behaviors, including termination and cancellation.
- **Implementation:** the facade dispatch plus the RxJS 7.8.2 operator.
- **Verification:** type checks, BDD-derived assertions, virtual-time comparison, property tests, and API inventory checks.

The first implementation has executable evidence, not an independent formal model of every operator. Native delegation does not eliminate the need to check configuration dispatch and observable lifetime boundaries.

## Policies are not interchangeable

| Family | On another source value while inner work or a wait is active |
|---|---|
| audit | Replace the retained value; keep the current duration subscription |
| debounce | Replace the retained value; cancel the duration and select another |
| sample | Remember the value; the independent notifier determines sampling moments |
| throttle | Apply the selected leading/trailing policy; the duration limits admission |
| merge | Start another inner if capacity permits; otherwise queue the source value |
| concat | Queue the source value; invoke the projector when its turn arrives |
| switchLatest | Unsubscribe the old inner before projecting/subscribing the new one |
| exhaust | Ignore the source value without invoking its projector |

`map(project)` followed by flattening is not a universal implementation equality. Projection effects, errors, indices, synchronous reentrancy, and hot inner sources can expose differences. The facade therefore calls fused native operators directly.

## Time and signals

`withTime` describes a duration or period and optional scheduler. The scheduler supplies clock and scheduling behavior; the operator determines when the schedule starts and resets. `withSignal` stores a notifier directly for sample/buffer/window/take/skip, or a duration selector for audit/throttle/debounce.

For audit, **start waiting for the duration signal** means remember the source value, invoke the selector, and subscribe to its result. A duration next closes the subscription before delivering the retained value. Empty completion closes that wait without delivery. Source completion may wait for the active duration; a never-ending duration can keep the result pending. Source/duration errors and consumer cancellation do not flush a retained value.

Do not generalize audit's completion rule to every boundary operator. For example, RxJS 7.8.2 `windowWhen` opens its next window on either a closing next or closing complete; `withClosing` preserves that native behavior. A synchronously completing closing factory therefore needs the same care as native `windowWhen`.

Events with the same timestamp still have an execution order. The tests use deterministic virtual scheduling; no claim is made that timestamp equality makes actions simultaneous.

## Selection and memory

`take(withCount(n))` delivers a prefix and closes its source subscription when satisfied. `take(withCount(n), withFromEnd())` holds up to n values until source completion. `skip(withCount(n), withFromEnd())` maintains a lag of n values and drops that lag at completion.

`withWhile` is a prefix condition, not a filter repeatedly re-opening on later matching values. The optional inclusive flag belongs to take only. Type-guard predicates narrow the output of non-inclusive take.

All-history distinct uses a Set of keys, including SameValueZero behavior for NaN. Last-emitted distinct compares against the last **emitted** value/key, using strict equality by default or the supplied comparer. Reset signals apply to all-history memory. The output remains the original source value.

## Sharing

`share()` delegates to native share and its reference-count/reset defaults. `share(withReplay(n, {refCount}))` delegates to native shareReplay: false is its retained-connection default, errors reset, completion retains the replayed result. `withSharing` exposes the native ShareConfig, including reset notifiers and connector factories.

Manual `share(withConnection('manual'), ...)` delegates to publish/publishReplay/publishBehavior/publishLast and returns a ConnectableObservable. Apply that operator directly to preserve its connectable TypeScript return type; RxJS's Observable.pipe signature erases the subtype. Consumer unsubscription alone does not own a manual connection. Close the subscription returned by connect(). Selector-scoped modes delegate to the matching native publish implementation.

## Compatibility limits

This is a typed facade, not a drop-in replacement for every overload spelling. Deprecated result-selector overloads of flattening operators and the deprecated map thisArg overload are not mirrored. Rewrite result selection inside the projected inner stream as recommended by RxJS. Property paths preserve runtime missing-path behavior; their output type includes undefined conservatively. Explicitly annotate domain callback inputs where inference across nested generic helper calls needs assistance.

The name catalog records all original names represented. It does not claim every historical overload has an identical new signature. The peer version is fixed; upgrading it requires source review and re-running the semantic tests.

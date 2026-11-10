# Start with behavior

An Observable describes a dataflow. Operators decide what happens to values as they arrive; your functions supply the application meaning. Connect a consumer with `subscribe` to begin execution. A live producer, such as a UI event source, can exist independently of that connection.

Learn each operator through **Intuition → Specification → Verification**. Begin with the short story, inspect its event rules and lifetime, then check the implementation and test evidence.

## Run this repository

The initial package is not yet published to npm. Clone and build it locally:

```bash
git clone https://github.com/hansschenker/rxjs-80.git
cd rxjs-80
npm ci
npm run check
npm run docs:dev
```

To install the library into another project, run `npm pack` here, then install the resulting archive alongside RxJS 7.8.2 in that project.

## First pipeline

Take the first five values and collect them in pairs. The final incomplete buffer is delivered when the source completes.

```typescript
import { of, take, buffer } from 'rxjs-80';
import { withCount } from 'rxjs-80/controls';

const packages$ = of(1, 2, 3, 4, 5, 6).pipe(
  take(withCount(5)),
  buffer(withCount(2))
);

packages$.subscribe(console.log);
// [1, 2]
// [3, 4]
// [5]
```

This source emits synchronously and completes during subscription. An Observable can deliver synchronously or asynchronously; the source and scheduler determine timing.

## Choose a learning lens

| Lens | Ask | Begin with |
|---|---|---|
| Value | What values, collections, or state flow? | [map](/operators/map), [scan](/operators/scan), [buffer](/operators/buffer) |
| Time | What signal or scheduled moment controls delivery? | [audit](/operators/audit), [debounce](/operators/debounce), [sample](/operators/sample) |
| Route | Which values and streams stay connected? | [filter](/operators/filter), [take](/operators/take), [switchLatest](/operators/switchLatest) |

These are navigation lenses with overlap. [Read the complete learning guide](/LEARNING-GROUPS).

## Make the policy visible

```typescript
take(withCount(5))                       // stop after five values
take(withSignal(stop$))                 // stop when the signal emits
audit(withTime(300))                    // keep latest during a fixed wait
audit(withSignal(selectDuration))       // choose the wait from a value
merge(withProjection(load), withConcurrency(4))
```

These are wiring sketches; application streams and functions are supplied by you. Helpers are configuration values, not pipeable operators. Creating a helper does not call its selector or subscribe.

## Decide the lifetime

For ongoing event streams, let the consumer or a lifecycle signal close the subscription:

```typescript
import { fromEvent } from 'rxjs';
import { audit, take } from 'rxjs-80';
import { withTime, withSignal } from 'rxjs-80/controls';

// Assume an existing stop button in the page.
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!;
const stop$ = fromEvent(stopButton, 'click');
const moves$ = fromEvent<PointerEvent>(document, 'pointermove');

const connection = moves$.pipe(
  audit(withTime(100)),
  take(withSignal(stop$))
).subscribe(point => console.log(point.clientX, point.clientY));

// Alternative teardown when the owning view is removed:
// connection.unsubscribe();
```

`take(withSignal(stop$))` reacts to a notifier **next**, not a silent completion. Unsubscription removes these event listeners and cancels the pending scheduled work.

## Choose sharing explicitly

Every subscription otherwise has its own operator state. Sharing changes that connection policy:

```typescript
import { scan, share } from 'rxjs-80';
import { withReplay } from 'rxjs-80/controls';

// actions$, update, and initialState belong to your application.
const state$ = actions$.pipe(
  scan(update, initialState),
  share(withReplay(1, { refCount: true }))
);
```

This retains the latest emitted state for consumers sharing the current execution. The seed is not emitted by `scan` itself. If the last consumer leaves before source completion, reference counting closes the connection; a later consumer starts a fresh execution. Completion and error have their own replay/reset rules. [Study sharing policies](/operators/share).

## Check the evidence

`npm run check` verifies TypeScript, builds the library, runs the behavior tests, and checks the exact 80-name inventory. `npm run docs:build` checks generated pages and builds this site with dead-link detection.

Consolidated families have focused test evidence. Direct compatibility exports inherit native RxJS implementations; their catalog pages do not claim independent verification. Read the [semantic commitments](/SEMANTICS) and [audit BDD scenarios](/guide/audit-scenarios).

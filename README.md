# rxjs-80

**80 public RxJS operator names. One name per consolidated behavioral family. Explicit policy choices through `with…(...)`.**

`rxjs-80` is a functional TypeScript facade over **RxJS 7.8.2**. It makes decisions about values, timing, routing, cancellation, and sharing visible in the expression. It delegates execution to RxJS rather than reimplementing its stream machinery.

```typescript
import { of, take, buffer } from 'rxjs-80';
import { withCount, withFromEnd } from 'rxjs-80/controls';

of(1, 2, 3, 4, 5).pipe(take(withCount(3))).subscribe(console.log);
// 1, 2, 3 — then complete

of(1, 2, 3, 4, 5).pipe(take(withCount(3), withFromEnd())).subscribe(console.log);
// 3, 4, 5 — delivered when the source completes

of(1, 2, 3, 4, 5).pipe(buffer(withCount(2))).subscribe(console.log);
// [1, 2], [3, 4], [5]
```

## Learn behavior through three groups

| Learning group | Main question | Examples |
|---|---|---|
| **Value Modulators** | What values, collections, or state flow? | `map`, `scan`, `reduce`, `buffer` |
| **Time Modulators** | What event or scheduled moment controls delivery? | `audit`, `sample`, `throttle`, `debounce` |
| **Route Modulators** | Which values, sources, and inner streams are admitted or connected? | `take`, `skip`, `merge`, `concat`, `exhaust`, `switchLatest`, `window`, `share` |

These are learning lenses, not disjoint mathematical classes. Secondary tags preserve overlaps: a buffer changes value shape and uses a boundary policy; a window routes values into inner streams and also uses boundaries. Creation and observation operators have supporting roles in the index. Cancellation, completion, errors, sharing, and scheduling remain explicit policy dimensions.

Start with [the learning guide](docs/LEARNING-GROUPS.md), then the [complete 80-name catalog](docs/OPERATOR-CATALOG.md) and [migration examples](docs/MIGRATION.md).

## Read the policy in the expression

```typescript
take(withCount(5))
take(withSignal(stop$))
take(withWhile(isValid))
take(withCount(5), withFromEnd())

skip(withCount(5))
skip(withSignal(start$))

audit(withSignal(() => duration$))
audit(withTime(300, scheduler))
buffer(withCount(10))
window(withOpenings(open$), withClosing(closeFor))

merge(withProjection(load), withConcurrency(4))
concat(withProjection(save))
exhaust(withProjection(submit))
switchLatest(withProjection(search))

distinct(withHistory('all'), withKey(getId))
distinct(withHistory('lastEmitted'), withKey(getId))
```

The functions supplied by the application contain domain logic. The operator family owns the execution policy. Helpers return shallowly frozen configuration values; they do not call selectors, start timers, or subscribe. Source execution and operator state are created at subscription. Live producers may already exist independently of the pipeline. Sharing is introduced only through explicit sharing facilities.

## What exactly is counted?

| Component | Public names |
|---|---:|
| Consolidated behavioral families | 15 |
| Unchanged pipeable operator names | 58 |
| Creation operators: `of`, `from`, `defer`, `generate`, `range`, `interval`, `timer` | 7 |
| **Root operator/creation exports** | **80** |

The comparison scope is **113 named exports from `rxjs/operators` plus these seven creation functions: 120 original names represented by 80 public names**. This extends the earlier pipeable-only discussion explicitly. Configuration helpers live in `rxjs-80/controls` and are counted separately. Other RxJS types, subjects, constants, schedulers, creation functions, and testing facilities remain available from `rxjs`; they are not hidden inside the count.

The 15 consolidated families are `audit`, `sample`, `throttle`, `debounce`, `buffer`, `window`, `take`, `skip`, `merge`, `concat`, `exhaust`, `switchLatest`, `distinct`, `map`, and `share`. All count/time/signal/when/toggle variants of `buffer` and `window` count as **one name each**. The selected publish variants belong to `share`.

The remaining 58 names are compatibility exports, including some deprecated RxJS names. Further normalization is a design task, not a claim already completed. `npm run inventory` checks the actual runtime exports, the 113-name baseline, complete name mappings, the three learning groups, and the separate helper count.

## Operator website

Browse [all 80 operators](https://hansschenker.github.io/rxjs-80/catalog.html) on the [VitePress site](https://hansschenker.github.io/rxjs-80/). The site includes behavior descriptions, family configurations, original-name search, Value/Time/Route filters, migration guidance, and verification references.

```bash
npm run docs:dev
npm run docs:build
npm run docs:preview
```

See [site maintenance](docs/guide/site-maintenance.md) for generation and deployment.

## Run the project

```bash
npm ci
npm run check
```

`check` runs strict TypeScript checks, builds ESM and declarations, executes behavioral and property tests, and verifies the 80-name inventory. `npm run test:watch` supports development. `npm run inventory -- --write` regenerates the catalog document after an intentional catalog change.

This repository is an **initial 0.1 implementation**, not a published npm release. To try it in another local project, run `npm pack` here and install the resulting `.tgz`. The peer dependency is pinned to RxJS 7.8.2. The package currently provides ESM exports.

## Semantic commitments

- Keep native notification ordering, completion, error, cancellation, and sharing policies for the selected configuration.
- Preserve projection admission: `exhaust` does not project ignored inputs; bounded `merge` and `concat` defer queued projections; `switchLatest` cancels the old inner before projecting its replacement.
- A duration `next` and a duration `complete` are distinct events. For example, `audit` does not flush on silent duration completion; `debounce` flushes on **source** completion. Individual boundary variants retain their native rules.
- `take` from the end waits for completion. `skip` from the end uses a rolling lag; it does not wait to emit the entire result at completion.
- `distinct` with all-history uses Set equality; last-emitted history uses RxJS's comparator semantics. Selecting a key does not replace emitted values with keys.
- Manual connection, replay retention, reference counting, and reset policies remain distinguishable. See [sharing migration](docs/MIGRATION.md#sharing-and-publishing).
- Typed options reject incompatible families. Runtime checks cover malformed JavaScript configurations as well. This is not a general schema validator for every possible malformed value.

Verification follows **Intuition → Specification → Verification**. See the [audit BDD scenarios](docs/AUDIT.feature), [semantic notes](docs/SEMANTICS.md), and [roadmap](docs/ROADMAP.md). Tests provide executable evidence; no formal proof or complete RxJS conformance claim is made.

## Contributors and attribution

See [CONTRIBUTORS.md](CONTRIBUTORS.md) and the [site contributor page](https://hansschenker.github.io/rxjs-80/contributors.html).

- **Hans Schenker** — project direction, behavioral vocabulary, API design discussion, and review.
- **ChatGPT (OpenAI)** — **main contributor and co-author** of the initial design, implementation, learning material, verification suite, and VitePress website, developed collaboratively with Hans Schenker.
- **RxJS contributors** — the underlying runtime and operator implementations. RxJS is distributed under Apache-2.0; this facade has its own MIT license.

import type { Observable, ObservableInput, SchedulerLike, ShareConfig, ThrottleConfig } from 'rxjs';

/** Configuration values describe policies. They never subscribe or start timers. */
export type TimeControl = Readonly<{ kind: 'time'; duration: number; scheduler?: SchedulerLike }>;
export type CountControl = Readonly<{ kind: 'count'; count: number }>;
export type SignalControl<T = unknown> = Readonly<{ kind: 'signal'; notifier: ObservableInput<T> }>;
export type DurationControl<T> = Readonly<{ kind: 'duration'; selector: (value: T) => ObservableInput<unknown> }>;
export type WhileControl<T> = Readonly<{ kind: 'while'; predicate: (value: T, index: number) => boolean; inclusive: boolean }>;
export type SkipWhileControl<T> = WhileControl<T> & Readonly<{ inclusive: false }>;
export type GuardControl<T, S extends T> = WhileControl<T> & Readonly<{
  predicate: (value: T, index: number) => value is S; inclusive: false;
}>;
export type FromEndControl = Readonly<{ kind: 'fromEnd' }>;
export type StartEveryControl = Readonly<{ kind: 'startEvery'; interval: number }>;
export type MaxSizeControl = Readonly<{ kind: 'maxSize'; size: number }>;
export type ClosingControl<O = void> = Readonly<{ kind: 'closing'; selector: (opening: O) => ObservableInput<unknown> }>;
export type OpeningsControl<O> = Readonly<{ kind: 'openings'; openings: ObservableInput<O> }>;
export type ProjectionControl<T, O extends ObservableInput<unknown>> = Readonly<{
  kind: 'projection'; project: (value: T, index: number) => O;
}>;
export type ConcurrencyControl = Readonly<{ kind: 'concurrency'; limit: number }>;
export type SourcesControl<A extends readonly ObservableInput<unknown>[]> = Readonly<{ kind: 'sources'; sources: A }>;
export type HistoryControl<H extends 'all' | 'lastEmitted' = 'all' | 'lastEmitted'> = Readonly<{ kind: 'history'; history: H }>;
export type KeyControl<T, K> = Readonly<{ kind: 'key'; select: (value: T) => K }>;
export type ComparerControl<K> = Readonly<{ kind: 'comparer'; compare: (previous: K, current: K) => boolean }>;
export type ResetSignalControl = Readonly<{ kind: 'resetSignal'; notifier: ObservableInput<unknown> }>;
export type ConstantControl<T> = Readonly<{ kind: 'constant'; value: T }>;
export type PropertyControl<P extends readonly PropertyKey[] = readonly PropertyKey[]> = Readonly<{ kind: 'property'; keys: P }>;
export type EdgesControl = Readonly<{ kind: 'edges'; config: ThrottleConfig }>;
export type ConnectionControl<M extends 'manual' | 'auto' = 'manual' | 'auto'> = Readonly<{ kind: 'connection'; mode: M }>;
export type ReplayControl = Readonly<{
  kind: 'replay'; size: number; windowTime: number; scheduler?: SchedulerLike; refCount: boolean;
}>;
export type InitialControl<T> = Readonly<{ kind: 'initial'; value: T }>;
export type LastValueControl = Readonly<{ kind: 'lastValue' }>;
export type SharingControl<T> = Readonly<{ kind: 'sharing'; config: ShareConfig<T> }>;
export type SelectorControl<T, R> = Readonly<{ kind: 'selector'; select: (shared: Observable<T>) => Observable<R> }>;

export const withTime = (duration: number, scheduler?: SchedulerLike): TimeControl =>
  Object.freeze({ kind: 'time', duration, scheduler });
export const withCount = (count: number): CountControl => Object.freeze({ kind: 'count', count });
export function withSignal<T>(selector: (value: T) => ObservableInput<unknown>): DurationControl<T>;
export function withSignal<T>(notifier: ObservableInput<T>): SignalControl<T>;
export function withSignal<T>(input: ObservableInput<T> | ((value: T) => ObservableInput<unknown>)) {
  return typeof input === 'function'
    ? Object.freeze({ kind: 'duration' as const, selector: input })
    : Object.freeze({ kind: 'signal' as const, notifier: input });
}
export function withWhile<T, S extends T>(predicate: (value: T, index: number) => value is S, inclusive?: false): GuardControl<T, S>;
export function withWhile<T>(predicate: (value: T, index: number) => boolean, inclusive?: false): SkipWhileControl<T>;
export function withWhile<T>(predicate: (value: T, index: number) => boolean, inclusive?: boolean): WhileControl<T>;
export function withWhile<T>(predicate: (value: T, index: number) => boolean, inclusive = false): WhileControl<T> {
  return Object.freeze({ kind: 'while', predicate, inclusive });
}
export const withFromEnd = (): FromEndControl => Object.freeze({ kind: 'fromEnd' });
export const withStartEvery = (interval: number): StartEveryControl => Object.freeze({ kind: 'startEvery', interval });
export const withMaxSize = (size: number): MaxSizeControl => Object.freeze({ kind: 'maxSize', size });
export const withClosing = <O = void>(selector: (opening: O) => ObservableInput<unknown>): ClosingControl<O> =>
  Object.freeze({ kind: 'closing', selector });
export const withOpenings = <O>(openings: ObservableInput<O>): OpeningsControl<O> =>
  Object.freeze({ kind: 'openings', openings });
export const withProjection = <T, O extends ObservableInput<unknown>>(project: (value: T, index: number) => O): ProjectionControl<T, O> =>
  Object.freeze({ kind: 'projection', project });
export const withConcurrency = (limit: number): ConcurrencyControl => Object.freeze({ kind: 'concurrency', limit });
export const withSources = <A extends readonly ObservableInput<unknown>[]>(...sources: A): SourcesControl<A> =>
  Object.freeze({ kind: 'sources', sources: Object.freeze(sources) as A });
export const withHistory = <H extends 'all' | 'lastEmitted'>(history: H): HistoryControl<H> =>
  Object.freeze({ kind: 'history', history });
export const withKey = <T, K>(select: (value: T) => K): KeyControl<T, K> => Object.freeze({ kind: 'key', select });
export const withComparer = <K>(compare: (previous: K, current: K) => boolean): ComparerControl<K> =>
  Object.freeze({ kind: 'comparer', compare });
export const withResetSignal = (notifier: ObservableInput<unknown>): ResetSignalControl =>
  Object.freeze({ kind: 'resetSignal', notifier });
export const withConstant = <T>(value: T): ConstantControl<T> => Object.freeze({ kind: 'constant', value });
export const withProperty = <const P extends readonly [PropertyKey, ...PropertyKey[]]>(...keys: P): PropertyControl<P> => {
  if (!keys.length) throw new TypeError('withProperty requires at least one property key');
  return Object.freeze({ kind: 'property', keys: Object.freeze([...keys]) as unknown as P });
};
export const withEdges = (config: ThrottleConfig): EdgesControl =>
  Object.freeze({ kind: 'edges', config: Object.freeze({ ...config }) });
export const withConnection = <M extends 'manual' | 'auto'>(mode: M): ConnectionControl<M> =>
  Object.freeze({ kind: 'connection', mode });
export const withReplay = (size = Infinity, options: {
  windowTime?: number; scheduler?: SchedulerLike; refCount?: boolean;
} = {}): ReplayControl => Object.freeze({
  kind: 'replay', size, windowTime: options.windowTime ?? Infinity,
  scheduler: options.scheduler, refCount: options.refCount ?? false,
});
export const withInitialValue = <T>(value: T): InitialControl<T> => Object.freeze({ kind: 'initial', value });
export const withLastValue = (): LastValueControl => Object.freeze({ kind: 'lastValue' });
export const withSharing = <T>(config: ShareConfig<T>): SharingControl<T> =>
  Object.freeze({ kind: 'sharing', config: Object.freeze({ ...config }) });
export const withSelector = <T, R>(select: (shared: Observable<T>) => Observable<R>): SelectorControl<T, R> =>
  Object.freeze({ kind: 'selector', select });

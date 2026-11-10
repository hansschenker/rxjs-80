import { mergeAll, mergeMap, mergeWith, concatAll, concatMap, concatWith, switchAll, switchMap, exhaustAll, exhaustMap } from 'rxjs';
import type { ObservableInput, ObservedValueOf, OperatorFunction } from 'rxjs';
import type { ProjectionControl, ConcurrencyControl, SourcesControl } from './controls.js';
import { checkOptions } from './internal.js';

export function merge<O extends ObservableInput<unknown>>(capacity?: ConcurrencyControl): OperatorFunction<O, ObservedValueOf<O>>;
export function merge<T, O extends ObservableInput<unknown>>(projection: ProjectionControl<T, O>, capacity?: ConcurrencyControl): OperatorFunction<T, ObservedValueOf<O>>;
export function merge<T, A extends readonly ObservableInput<unknown>[]>(sources: SourcesControl<A>): OperatorFunction<T, T | ObservedValueOf<A[number]>>;
export function merge(first?: ProjectionControl<any, any> | ConcurrencyControl | SourcesControl<any>, capacity?: ConcurrencyControl): OperatorFunction<any, any> {
  if (capacity) checkOptions([capacity], ['concurrency']);
  if (!first) return mergeAll(capacity?.limit);
  if (first.kind === 'projection') return mergeMap(first.project, capacity?.limit);
  if (capacity) throw new TypeError('Concurrency must accompany a projection, or stand alone');
  if (first.kind === 'concurrency') return mergeAll(first.limit);
  if (first.kind === 'sources') return mergeWith(...first.sources);
  throw new TypeError('Unsupported merge control');
}
export function concat<O extends ObservableInput<unknown>>(): OperatorFunction<O, ObservedValueOf<O>>;
export function concat<T, O extends ObservableInput<unknown>>(projection: ProjectionControl<T, O>): OperatorFunction<T, ObservedValueOf<O>>;
export function concat<T, A extends readonly ObservableInput<unknown>[]>(sources: SourcesControl<A>): OperatorFunction<T, T | ObservedValueOf<A[number]>>;
export function concat(control?: ProjectionControl<any, any> | SourcesControl<any>): OperatorFunction<any, any> {
  if (!control) return concatAll();
  if (control.kind === 'projection') return concatMap(control.project);
  if (control.kind === 'sources') return concatWith(...control.sources);
  throw new TypeError('Unsupported concat control');
}
export function switchLatest<O extends ObservableInput<unknown>>(): OperatorFunction<O, ObservedValueOf<O>>;
export function switchLatest<T, O extends ObservableInput<unknown>>(projection: ProjectionControl<T, O>): OperatorFunction<T, ObservedValueOf<O>>;
export function switchLatest(projection?: ProjectionControl<any, any>): OperatorFunction<any, any> {
  if (!projection) return switchAll();
  checkOptions([projection], ['projection']);
  return switchMap(projection.project);
}
export function exhaust<O extends ObservableInput<unknown>>(): OperatorFunction<O, ObservedValueOf<O>>;
export function exhaust<T, O extends ObservableInput<unknown>>(projection: ProjectionControl<T, O>): OperatorFunction<T, ObservedValueOf<O>>;
export function exhaust(projection?: ProjectionControl<any, any>): OperatorFunction<any, any> {
  if (!projection) return exhaustAll();
  checkOptions([projection], ['projection']);
  return exhaustMap(projection.project);
}

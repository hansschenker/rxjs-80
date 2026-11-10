import { map as rxMap, distinct as rxDistinct, distinctUntilChanged } from 'rxjs';
import type { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs';
import type { ConstantControl, PropertyControl, HistoryControl, KeyControl, ComparerControl, ResetSignalControl } from './controls.js';
import { checkOptions } from './internal.js';

type PathValue<T, P extends readonly PropertyKey[]> = P extends readonly [infer K extends PropertyKey, ...infer Rest extends PropertyKey[]]
  ? K extends keyof NonNullable<T> ? PathValue<NonNullable<T>[K], Rest> | undefined : undefined
  : T;

export function map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R>;
export function map<R>(constant: ConstantControl<R>): OperatorFunction<unknown, R>;
export function map<T, const P extends readonly PropertyKey[]>(property: PropertyControl<P>): OperatorFunction<T, PathValue<T, P>>;
export function map(control: ((value: any, index: number) => any) | ConstantControl<any> | PropertyControl): OperatorFunction<any, any> {
  if (typeof control === 'function') return rxMap(control);
  if (control.kind === 'constant') return rxMap(() => control.value);
  if (control.kind === 'property') return rxMap((value: any) => {
    let current = value;
    for (const key of control.keys) {
      current = current?.[key];
      if (current === undefined) return undefined;
    }
    return current;
  });
  throw new TypeError('Unsupported map configuration');
}

export function distinct<T>(): MonoTypeOperatorFunction<T>;
export function distinct<T>(history: HistoryControl<'all'>, reset?: ResetSignalControl): MonoTypeOperatorFunction<T>;
export function distinct<T, K>(history: HistoryControl<'all'>, key: KeyControl<T, K>, reset?: ResetSignalControl): MonoTypeOperatorFunction<T>;
export function distinct<T>(history: HistoryControl<'lastEmitted'>, comparer?: ComparerControl<T>): MonoTypeOperatorFunction<T>;
export function distinct<T, K>(history: HistoryControl<'lastEmitted'>, key: KeyControl<T, K>, comparer?: ComparerControl<K>): MonoTypeOperatorFunction<T>;
export function distinct(
  history: HistoryControl = { kind: 'history', history: 'all' },
  ...options: (KeyControl<any, any> | ComparerControl<any> | ResetSignalControl | undefined)[]
): MonoTypeOperatorFunction<any> {
  checkOptions([history], ['history']);
  const present = options.filter((v): v is NonNullable<typeof v> => v !== undefined);
  checkOptions(present, history.history === 'all' ? ['key', 'resetSignal'] : ['key', 'comparer']);
  const key = present.find((v): v is KeyControl<any, any> => v.kind === 'key');
  if (history.history === 'all') {
    const reset = present.find((v): v is ResetSignalControl => v.kind === 'resetSignal');
    return rxDistinct(key?.select, reset?.notifier);
  }
  if (history.history === 'lastEmitted') {
    const compare = present.find((v): v is ComparerControl<any> => v.kind === 'comparer');
    return distinctUntilChanged(compare?.compare ?? ((a: any, b: any) => a === b), key?.select ?? ((value: any) => value));
  }
  throw new TypeError('Unknown distinct history');
}

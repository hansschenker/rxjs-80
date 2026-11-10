import { take as rxTake, takeLast, takeUntil, takeWhile, skip as rxSkip, skipLast, skipUntil, skipWhile } from 'rxjs';
import type { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs';
import type { CountControl, SignalControl, WhileControl, SkipWhileControl, GuardControl, FromEndControl } from './controls.js';
import { checkOptions, unreachable } from './internal.js';

export function take<T, S extends T>(control: GuardControl<T, S>): OperatorFunction<T, S>;
export function take<T>(control: CountControl, fromEnd?: FromEndControl): MonoTypeOperatorFunction<T>;
export function take<T>(control: SignalControl | WhileControl<T>): MonoTypeOperatorFunction<T>;
export function take<T>(control: CountControl | SignalControl | WhileControl<T>, fromEnd?: FromEndControl): MonoTypeOperatorFunction<T> {
  checkOptions(fromEnd ? [fromEnd] : [], control.kind === 'count' ? ['fromEnd'] : []);
  switch (control.kind) {
    case 'count': return fromEnd ? takeLast(control.count) : rxTake(control.count);
    case 'signal': return takeUntil(control.notifier);
    case 'while': return takeWhile(control.predicate, control.inclusive);
    default: return unreachable(control);
  }
}
export function skip<T>(control: CountControl, fromEnd?: FromEndControl): MonoTypeOperatorFunction<T>;
export function skip<T>(control: SignalControl | SkipWhileControl<T>): MonoTypeOperatorFunction<T>;
export function skip<T>(control: CountControl | SignalControl | WhileControl<T>, fromEnd?: FromEndControl): MonoTypeOperatorFunction<T> {
  checkOptions(fromEnd ? [fromEnd] : [], control.kind === 'count' ? ['fromEnd'] : []);
  switch (control.kind) {
    case 'count': return fromEnd ? skipLast(control.count) : rxSkip(control.count);
    case 'signal': return skipUntil(control.notifier);
    case 'while':
      if (control.inclusive) throw new TypeError('Inclusive withWhile is supported only by take');
      return skipWhile(control.predicate);
    default: return unreachable(control);
  }
}

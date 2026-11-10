import {
  buffer as rxBuffer, bufferCount, bufferTime, bufferWhen, bufferToggle,
  window as rxWindow, windowCount, windowTime, windowWhen, windowToggle,
} from 'rxjs';
import type { Observable, OperatorFunction } from 'rxjs';
import type {
  SignalControl, CountControl, TimeControl, ClosingControl, OpeningsControl,
  StartEveryControl, MaxSizeControl,
} from './controls.js';
import { checkOptions, unreachable } from './internal.js';

type TimeOptions = [] | [StartEveryControl] | [MaxSizeControl] | [StartEveryControl, MaxSizeControl];
// These erased implementation types are private; public overloads retain opening types.
type GroupControl = SignalControl | CountControl | TimeControl | ClosingControl<any> | OpeningsControl<any>;
type GroupOption = StartEveryControl | MaxSizeControl | ClosingControl<any>;

export function buffer<T>(control: SignalControl | ClosingControl<void>): OperatorFunction<T, T[]>;
export function buffer<T>(control: CountControl, start?: StartEveryControl): OperatorFunction<T, T[]>;
export function buffer<T>(control: TimeControl, ...options: TimeOptions): OperatorFunction<T, T[]>;
export function buffer<T, O>(control: OpeningsControl<O>, closing: ClosingControl<O>): OperatorFunction<T, T[]>;
export function buffer<T>(control: GroupControl, ...options: (GroupOption | undefined)[]): OperatorFunction<T, T[]> {
  const present = options.filter((v): v is GroupOption => v !== undefined);
  switch (control.kind) {
    case 'signal':
      checkOptions(present, []);
      return rxBuffer(control.notifier);
    case 'closing':
      checkOptions(present, []);
      return bufferWhen(() => control.selector(undefined));
    case 'openings': {
      checkOptions(present, ['closing']);
      const closing = present.find((o): o is ClosingControl<any> => o.kind === 'closing');
      if (!closing) throw new TypeError('Opening signals require withClosing(...)');
      return bufferToggle(control.openings, closing.selector);
    }
    case 'count': {
      checkOptions(present, ['startEvery']);
      const start = present.find((o): o is StartEveryControl => o.kind === 'startEvery');
      return bufferCount(control.count, start?.interval);
    }
    case 'time': {
      checkOptions(present, ['startEvery', 'maxSize']);
      const start = present.find((o): o is StartEveryControl => o.kind === 'startEvery');
      const max = present.find((o): o is MaxSizeControl => o.kind === 'maxSize');
      return bufferTime(control.duration, start?.interval, max?.size ?? Infinity, control.scheduler);
    }
    default: return unreachable(control);
  }
}

export function window<T>(control: SignalControl | ClosingControl<void>): OperatorFunction<T, Observable<T>>;
export function window<T>(control: CountControl, start?: StartEveryControl): OperatorFunction<T, Observable<T>>;
export function window<T>(control: TimeControl, ...options: TimeOptions): OperatorFunction<T, Observable<T>>;
export function window<T, O>(control: OpeningsControl<O>, closing: ClosingControl<O>): OperatorFunction<T, Observable<T>>;
export function window<T>(control: GroupControl, ...options: (GroupOption | undefined)[]): OperatorFunction<T, Observable<T>> {
  const present = options.filter((v): v is GroupOption => v !== undefined);
  switch (control.kind) {
    case 'signal':
      checkOptions(present, []);
      return rxWindow(control.notifier);
    case 'closing':
      checkOptions(present, []);
      return windowWhen(() => control.selector(undefined));
    case 'openings': {
      checkOptions(present, ['closing']);
      const closing = present.find((o): o is ClosingControl<any> => o.kind === 'closing');
      if (!closing) throw new TypeError('Opening signals require withClosing(...)');
      return windowToggle(control.openings, closing.selector);
    }
    case 'count': {
      checkOptions(present, ['startEvery']);
      const start = present.find((o): o is StartEveryControl => o.kind === 'startEvery');
      return windowCount(control.count, start?.interval);
    }
    case 'time': {
      checkOptions(present, ['startEvery', 'maxSize']);
      const start = present.find((o): o is StartEveryControl => o.kind === 'startEvery');
      const max = present.find((o): o is MaxSizeControl => o.kind === 'maxSize');
      return windowTime(control.duration, start?.interval, max?.size ?? Infinity, control.scheduler);
    }
    default: return unreachable(control);
  }
}

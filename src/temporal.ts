import {
  audit as rxAudit, auditTime, sample as rxSample, sampleTime,
  throttle as rxThrottle, throttleTime, debounce as rxDebounce, debounceTime,
} from 'rxjs';
import type { MonoTypeOperatorFunction } from 'rxjs';
import type { DurationControl, EdgesControl, SignalControl, TimeControl } from './controls.js';
import { checkOptions, unreachable } from './internal.js';

export function audit<T>(control: TimeControl | DurationControl<T>): MonoTypeOperatorFunction<T> {
  switch (control.kind) {
    case 'time': return auditTime(control.duration, control.scheduler);
    case 'duration': return rxAudit(control.selector);
    default: return unreachable(control);
  }
}
export function sample<T>(control: TimeControl | SignalControl): MonoTypeOperatorFunction<T> {
  switch (control.kind) {
    case 'time': return sampleTime(control.duration, control.scheduler);
    case 'signal': return rxSample(control.notifier);
    default: return unreachable(control);
  }
}
export function throttle<T>(control: TimeControl | DurationControl<T>, edges?: EdgesControl): MonoTypeOperatorFunction<T> {
  checkOptions(edges ? [edges] : [], ['edges']);
  switch (control.kind) {
    case 'time': return throttleTime(control.duration, control.scheduler, edges?.config);
    case 'duration': return rxThrottle(control.selector, edges?.config);
    default: return unreachable(control);
  }
}
export function debounce<T>(control: TimeControl | DurationControl<T>): MonoTypeOperatorFunction<T> {
  switch (control.kind) {
    case 'time': return debounceTime(control.duration, control.scheduler);
    case 'duration': return rxDebounce(control.selector);
    default: return unreachable(control);
  }
}

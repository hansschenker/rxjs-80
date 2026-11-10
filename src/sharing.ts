import {
  share as rxShare, shareReplay, publish, publishReplay, publishBehavior, publishLast,
  BehaviorSubject, AsyncSubject,
} from 'rxjs';
import type { Observable, ConnectableObservable, MonoTypeOperatorFunction, OperatorFunction, UnaryFunction } from 'rxjs';
import type {
  ConnectionControl, ReplayControl, InitialControl, LastValueControl, SharingControl, SelectorControl,
} from './controls.js';
import { checkOptions } from './internal.js';

type AutoControl<T> = SharingControl<T> | ReplayControl | InitialControl<T> | LastValueControl | ConnectionControl<'auto'>;
type ManualMemory<T> = ReplayControl | InitialControl<T> | LastValueControl;
type AnyShareControl = AutoControl<any> | ConnectionControl | SelectorControl<any, any>;

export function share<T>(control?: AutoControl<T>): MonoTypeOperatorFunction<T>;
export function share<T>(connection: ConnectionControl<'manual'>, memory?: ManualMemory<T>): UnaryFunction<Observable<T>, ConnectableObservable<T>>;
export function share<T, R>(selector: SelectorControl<T, R>): OperatorFunction<T, R>;
export function share<T, R>(replay: ReplayControl, selector: SelectorControl<T, R>): OperatorFunction<T, R>;
export function share(first?: AnyShareControl, second?: ManualMemory<any> | SelectorControl<any, any>): any {
  if (!first) {
    if (second) throw new TypeError('Sharing options require a first control');
    return rxShare();
  }
  if (first.kind === 'connection' && first.mode === 'manual') {
    if (!second) return publish();
    checkOptions([second], ['replay', 'initial', 'lastValue']);
    if (second.kind === 'initial') return publishBehavior(second.value);
    if (second.kind === 'lastValue') return publishLast();
    if (second.kind === 'replay') {
      if (second.refCount) throw new TypeError('Manual connection cannot enable replay refCount');
      return publishReplay(second.size, second.windowTime, second.scheduler);
    }
  }
  if (first.kind === 'replay' && second?.kind === 'selector') {
    if (first.refCount) throw new TypeError('Selector-scoped sharing does not use replay refCount');
    return publishReplay(first.size, first.windowTime, second.select, first.scheduler);
  }
  if (second) throw new TypeError('Unsupported sharing policy combination');
  switch (first.kind) {
    case 'connection':
      if (first.mode !== 'auto') throw new TypeError('Unknown connection policy');
      return rxShare();
    case 'sharing': return rxShare(first.config);
    case 'replay': return shareReplay({
      bufferSize: first.size, windowTime: first.windowTime, scheduler: first.scheduler, refCount: first.refCount,
    });
    case 'initial': return rxShare({ connector: () => new BehaviorSubject(first.value) });
    case 'lastValue': return rxShare({ connector: () => new AsyncSubject() });
    case 'selector': return publish(first.select);
    default: throw new TypeError('Unsupported sharing control');
  }
}

import { BehaviorSubject, Observable, noop, type MonoTypeOperatorFunction } from "rxjs";

export interface TakeToggleOptions {
  /**
   * when true, emits the last value emited by the source when the notifier toggle to true
   * @default true
   */
  emitLastValue?: boolean;
  /**
   * when true, emits the values emite by the observable form start.
   *
   * when false, NO emits any values until the nofifiers toggle to true.
    @default true
   */
  emitInitialState?: boolean;

  /**
   * store the observer when the Notifier completes
   * @default: true
   */
  closeOnNotifierCompletes?: boolean
}

/**
 * emits the values ob the piped observable until the `notifier` observable emits `false`
 * then the subsecuents emitions will be ignores until the notifier emits `true` again.
 *
 * ## Example:
 * ```ts
 * const observable = new BehaviorSubject<any>()
 * const notifier =  new Subject<boolean>();
 *
 * const takeSomeTimes = observable.pipe(takeToggle(notifier));
 *
 * takeSomeTimes.subscribe(val => console.log(val));
 *
 * observable.next(1);
 * // logs: 1
 *
 * observable.next(2);
 * // logs: 2
 *
 * notifier.next(false); // off notifications
 * observable.next(3);
 * observable.next(4);
 *
 * notifier.next(true); // on notifications
 * // logs: 4
 *
 * observable.next(5);
 * // logs: 5
 * ```
 *
 * ---
 *
 * @param notifier - An observable, maybe a subjet, which emits boolean values.
 * When emits true: the operator will emit any value emite by the source.
 * When emits false: the operator will no emit values at all until the notifier emits true again.
 *
 * @note if the `notifier` is a {@link BehaviorSubject}, its current value will be used as the default value for `emitInitialState` options.
 * @see {@link TakeToggleOptions.emitInitialState}.
 *
 * @param options - {@link TakeToggleOptions}.
 *
 * @returns a function that returns an observable which emits values emited by the source based on the notifier observable.

 */
export function takeToggle<T>(notifier: Observable<boolean> | BehaviorSubject<boolean>, options: TakeToggleOptions = {}): MonoTypeOperatorFunction<T> {

  const {
    emitLastValue = true,
    emitInitialState = notifier instanceof BehaviorSubject ? notifier.value : true,
    closeOnNotifierCompletes = true,
  } = options;

  return (observable) => new Observable(observer => {
    let firstTick = false;
    let value: T;
    let emit: boolean = emitInitialState

    const subscription = observable.subscribe({
      next(_value) {
        value = _value
        firstTick ||= true
        if (emit) observer.next(value)
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      }
    })

    subscription.add(
      notifier.subscribe({
        next: (_emit) => {
          if (emit !== _emit) {
            emit = _emit;
            if (emit && firstTick && emitLastValue) observer.next(value)
          }
        },
        complete: closeOnNotifierCompletes
          ? () => {
              subscription.unsubscribe();
              observer.complete();
            }
          : noop
      })
    );

    return () => {
      subscription.unsubscribe();
    }
  })
}

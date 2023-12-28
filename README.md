# take-toggle
Rxjs take-toggle operator

## Example:
```ts
import { BehaviorSubject, Subject } from 'rxjs'

const observable = new BehaviorSubject<any>()
const notifier =  new Subject<boolean>();

const takeSomeTimes = observable.pipe(takeToggle(notifier));

takeSomeTimes.subscribe(val => console.log(val));

observable.next(1);
// logs: 1

observable.next(2);
// logs: 2

notifier.next(false); // off notifications
observable.next(3);
observable.next(4);

notifier.next(true); // on notifications
// logs: 4

observable.next(5);
// logs: 5
```
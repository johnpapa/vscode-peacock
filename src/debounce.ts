/**
 * A debounced function: calling it repeatedly only schedules `fn` to run
 * `delayMs` after the *last* call, canceling and rescheduling on every call
 * in between. `cancel()` drops any pending scheduled call without running
 * it.
 */
export interface Debounced<TArgs extends unknown[]> {
  (...args: TArgs): void;
  /** Cancels a pending scheduled call, if one exists, without running it. */
  cancel(): void;
}

/**
 * Wraps `fn` so a rapid burst of calls (e.g. every 'input' event while
 * dragging the custom color picker's color well, which can fire on
 * essentially every pixel of movement) only actually invokes `fn` once,
 * `delayMs` after the burst's last call -- with that last call's
 * arguments, not an intermediate one (#776 follow-up: bring back live
 * preview without the performance hit of applying on every event).
 *
 * This is a plain trailing-edge debounce (not throttle): `fn` never runs
 * *during* a continuous burst, only once activity settles for `delayMs`.
 * For the color picker this means the live workbench preview lags a
 * fraction of a second behind the cursor while dragging, which is an
 * acceptable trade-off for not writing `workbench.colorCustomizations` to
 * disk on every event.
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): Debounced<TArgs> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: TArgs): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../../debounce';

describe('debounce (#776 follow-up: live preview without the drag performance hit)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("collapses a rapid burst of calls into a single invocation, using the last call's arguments", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    // Simulate a color-well drag: dozens of calls in quick succession, each
    // resetting the timer before the previous one could fire.
    for (let i = 0; i < 50; i++) {
      vi.advanceTimersByTime(5);
      debounced(`#${i.toString(16).padStart(6, '0')}`);
    }

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('#000031');
  });

  it('invokes fn again for a second, separate burst after the first has settled', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('first');

    debounced('second');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('does not invoke fn at all if cancel() is called before the delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('color');
    vi.advanceTimersByTime(50);
    debounced.cancel();
    vi.advanceTimersByTime(1000);

    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel() is a no-op when nothing is pending', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    expect(() => debounced.cancel()).not.toThrow();

    debounced('color');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    // Calling cancel() again after the scheduled call already fired should
    // also be a harmless no-op.
    expect(() => debounced.cancel()).not.toThrow();
  });

  it('only ever schedules one pending timer, even across many resets (regression: proves a leaked timer cannot pile up and fire multiple times)', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    for (let i = 0; i < 1000; i++) {
      debounced(i);
    }

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(999);
  });
});

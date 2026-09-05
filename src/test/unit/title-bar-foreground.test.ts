import { describe, it, expect } from 'vitest';
import { getTitleBarForegroundForApp } from '../../title-bar-foreground';
import { ForegroundColors } from '../../models';

describe('Title bar foreground selection', () => {
  it('keeps the computed foreground when app is not Cursor', () => {
    expect(getTitleBarForegroundForApp('Visual Studio Code', '#123456', '#123456')).toBe(
      '#123456',
    );
  });

  it('uses the Cursor mid-gray foreground when running in Cursor on a light background', () => {
    expect(getTitleBarForegroundForApp('Cursor', '#f5f5f5', '#123456')).toBe(
      ForegroundColors.CursorTitleBarForeground,
    );
  });

  it('matches on a partial/prefixed app name containing Cursor', () => {
    expect(getTitleBarForegroundForApp('Cursor - Insiders', '#f5f5f5', '#123456')).toBe(
      ForegroundColors.CursorTitleBarForeground,
    );
  });

  it('keeps the computed foreground in Cursor on a dark background', () => {
    // On dark backgrounds, the mid-gray Cursor override would hurt contrast, so the
    // already-computed (typically light) foreground is kept instead.
    expect(getTitleBarForegroundForApp('Cursor', '#1857a4', '#e7e7e7')).toBe('#e7e7e7');
  });

  it('keeps the computed foreground when app name is undefined', () => {
    expect(getTitleBarForegroundForApp(undefined, '#f5f5f5', '#123456')).toBe('#123456');
  });
});

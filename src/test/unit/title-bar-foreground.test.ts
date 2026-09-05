import { describe, it, expect } from 'vitest';
import { getTitleBarForegroundForApp } from '../../title-bar-foreground';
import { ForegroundColors } from '../../models';

describe('Title bar foreground selection', () => {
  it('keeps the computed foreground when app is not Cursor', () => {
    expect(getTitleBarForegroundForApp('Visual Studio Code', '#123456')).toBe('#123456');
  });

  it('uses the Cursor mid-gray foreground when app name contains Cursor', () => {
    expect(getTitleBarForegroundForApp('Cursor', '#123456')).toBe(
      ForegroundColors.CursorTitleBarForeground,
    );
  });

  it('matches on a partial/prefixed app name containing Cursor', () => {
    expect(getTitleBarForegroundForApp('Cursor - Insiders', '#123456')).toBe(
      ForegroundColors.CursorTitleBarForeground,
    );
  });

  it('keeps the computed foreground when app name is undefined', () => {
    expect(getTitleBarForegroundForApp(undefined, '#123456')).toBe('#123456');
  });
});

import { describe, it, expect } from 'vitest';
import { getTitleBarForegroundForApp } from '../../title-bar-foreground';

describe('Title bar foreground selection', () => {
  it('keeps the computed foreground when app is not Cursor', () => {
    expect(getTitleBarForegroundForApp('Visual Studio Code', '#123456')).toBe('#123456');
  });
});

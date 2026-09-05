import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { window } from 'vscode';
import { notify } from '../../notification';
import { Logger } from '../../logging';

describe('Notification Tests', () => {
  let loggerInfoStub: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    loggerInfoStub = vi.spyOn(Logger, 'info').mockImplementation(() => undefined);
  });

  afterAll(() => {
    loggerInfoStub.mockRestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('can fire notification without logging', () => {
    notify('test message');
    expect(window.showInformationMessage).toHaveBeenCalledWith('test message');
    expect(Logger.info).not.toHaveBeenCalled();
  });

  it('can fire notification with logging', () => {
    notify('test message', true);
    expect(window.showInformationMessage).toHaveBeenCalledWith('test message');
    expect(Logger.info).toHaveBeenCalledWith('test message');
  });
});

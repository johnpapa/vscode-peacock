import { Logger } from '../logging';

export class State {
  private static _recentColor = '';

  constructor() {}

  public static get recentColor(): string {
    return this._recentColor;
  }

  public static set recentColor(v: string) {
    this._recentColor = v;
    const message = `Saving the most recently used color ${
      this._recentColor
    } to state`;
    Logger.info(message);
  }
}

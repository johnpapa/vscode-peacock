import { log } from 'console';

export class State {
  private static _recentColor = '';

  constructor() {}

  public static get recentColor(): string {
    const message = `Retrieving the most recently used color ${
      this._recentColor
    } from state`;
    log(message);
    return this._recentColor;
  }

  public static set recentColor(v: string) {
    this._recentColor = v;
    const message = `Saving the most recently used color ${
      this._recentColor
    } to state`;
    log(message);
  }
}

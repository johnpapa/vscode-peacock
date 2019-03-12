import { window } from 'vscode';
import { OutputChannel } from 'vscode';

export class Logger {
  private static _outputChannel: OutputChannel;

  static initialize() {
    if (!this._outputChannel) {
      // Only init once
      this._outputChannel = window.createOutputChannel('Peacock');
    }
  }

  static getChannel() {
    this.initialize();
    return this._outputChannel;
  }

  static info(value: string | object | undefined, indent?: boolean) {
    const prefix = '  ';
    let message = '';
    if (typeof value === 'object') {
      let o = '';
      Object.entries(value).map(item => {
        let prefix = indent ? '  ' : '';
        o += `${prefix}${item[0]} = ${item[1]}\n`;
      });
      message = o;
    } else {
      message = (indent ? prefix : '') + value + '';
    }
    this._outputChannel.appendLine(message);
  }
}

Logger.initialize();

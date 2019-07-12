import { OutputChannel, window } from 'vscode';
import { TextDecoder } from 'util';

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

  static info(value: string | object | undefined, indent = false, title = '') {
    if (title) {
      this._outputChannel.appendLine(title);
    }
    let message = prepareMessage(value, indent);
    this._outputChannel.appendLine(message);
  }
}

function prepareMessage(value: string | object | undefined, indent: boolean) {
  const prefix = indent ? '  ' : '';
  let text = '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      text = `${prefix}${JSON.stringify(value, null, 2)}`;
    } else {
      Object.entries(value).map(item => {
        text += `${prefix}${item[0]} = ${item[1]}\n`;
      });
    }
    return text;
  }
  text = `${prefix}${value}`;
  return text;
}

function prepareObjectMessage(o: string, prefix: string) {
  let text = '';
  Object.entries(o).map(item => {
    text += `${prefix}${item[0]} = ${item[1]}\n`;
  });
  return text;
}

Logger.initialize();

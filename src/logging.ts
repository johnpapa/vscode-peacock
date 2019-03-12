import { OutputChannel } from 'vscode';

let outputChannel: OutputChannel;

export function log(value: string | object | undefined) {
  let message = '';
  if (value === typeof Object) {
    message = JSON.stringify(value);
  } else {
    message = value + '';
  }

  outputChannel.appendLine(message);
}

export function setLogChannel(channel: OutputChannel) {
  outputChannel = channel;
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Commands, State } from './models';
import {
  resetColorsHandler,
  enterColorHandler,
  changeColorToRandomHandler,
  changeColorToVueGreenHandler,
  changeColorToAngularRedHandler,
  changeColorToReactBlueHandler,
  changeColorToFavoriteHandler,
  saveColorToFavoritesHandler
} from './commands';
import {
  checkIfPeacockSettingsChanged,
  getCurrentColorBeforeAdjustments
} from './configuration';
import { changeColor } from './color-library';
import { setLogChannel } from './logging';
import { window } from 'vscode';

const { commands, workspace } = vscode;

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "vscode-peacock" is now active!');

  registerCommands();

  State.recentColor = getCurrentColorBeforeAdjustments();

  addSubscriptions(context);

  // context.subscriptions.push(disposable);
}

function addSubscriptions(context: vscode.ExtensionContext) {
  const outputChannel = window.createOutputChannel('peacockOutput');
  setLogChannel(outputChannel);
  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    workspace.onDidChangeConfiguration(applyPeacock())
  );
}

function applyPeacock(): (e: vscode.ConfigurationChangeEvent) => any {
  return async e => {
    if (checkIfPeacockSettingsChanged(e) && State.recentColor) {
      // console.log(
      //   `Configuration changed. Changing the color to most recently selected color: ${
      //     State.recentColor
      //   }`
      // );
      await changeColor(State.recentColor);
    }
  };
}

function registerCommands() {
  commands.registerCommand(Commands.resetColors, resetColorsHandler);
  commands.registerCommand(
    Commands.saveColorToFavorites,
    saveColorToFavoritesHandler
  );
  commands.registerCommand(Commands.enterColor, enterColorHandler);
  commands.registerCommand(
    Commands.changeColorToRandom,
    changeColorToRandomHandler
  );
  commands.registerCommand(
    Commands.changeColorToVueGreen,
    changeColorToVueGreenHandler
  );
  commands.registerCommand(
    Commands.changeColorToAngularRed,
    changeColorToAngularRedHandler
  );
  commands.registerCommand(
    Commands.changeColorToReactBlue,
    changeColorToReactBlueHandler
  );
  commands.registerCommand(
    Commands.changeColorToFavorite,
    changeColorToFavoriteHandler
  );
}

export function deactivate() {
  console.log('Extension "vscode-peacock" is now deactive');
}

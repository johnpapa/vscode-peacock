import * as vscode from 'vscode';
import * as sinon from 'sinon';
import {
  Commands,
  ColorSettings,
  Sections,
  IPeacockElementAdjustments
} from '../../models';

export const executeCommand = vscode.commands.executeCommand;

export const noopElementAdjustments = <IPeacockElementAdjustments>{
  activityBar: 'none',
  statusBar: 'none',
  titleBar: 'none'
};

export function getExtension(extension: vscode.Extension<any>) {
  const ext = vscode.extensions.getExtension('johnpapa.vscode-peacock');
  if (!ext) {
    throw new Error('Extension was not found.');
  }
  if (ext) {
    extension = ext;
  }
  return extension;
}

export async function getColorSettingAfterEnterColor(
  colorInput: string,
  setting: ColorSettings
) {
  // Stub the async input box to return a response
  const stub = await sinon
    .stub(vscode.window, 'showInputBox')
    .returns(Promise.resolve(colorInput));
  // fire the command
  await vscode.commands.executeCommand(Commands.enterColor);
  const config = getPeacockWorkspaceConfig();
  stub.restore();
  return config[setting];
}

export function getPeacockWorkspaceConfig() {
  return vscode.workspace.getConfiguration(Sections.workspacePeacockSection);
}

export function shouldKeepColorTest(
  elementStyle: string | undefined,
  colorSetting: ColorSettings,
  keepColor: boolean
) {
  const config = getPeacockWorkspaceConfig();
  let match = elementStyle === config[colorSetting];
  let passesTest = keepColor ? !match : match;
  return passesTest;
}

export async function getPeacockWorkspaceConfigAfterEnterColor(
  colorInput: string
) {
  // Stub the async input box to return a response
  const stub = await sinon
    .stub(vscode.window, 'showInputBox')
    .returns(Promise.resolve(colorInput));

  // fire the command
  await vscode.commands.executeCommand(Commands.enterColor);
  const config = getPeacockWorkspaceConfig();
  stub.restore();

  return config;
}

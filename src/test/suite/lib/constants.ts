import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { IPeacockAffectedElementSettings, IPeacockElementAdjustments } from '../../../models';

export const executeCommand = vscode.commands.executeCommand;

export const noopElementAdjustments = {
  activityBar: 'none',
  statusBar: 'none',
  titleBar: 'none',
} as IPeacockElementAdjustments;

export const lightenActivityBarElementAdjustments = {
  activityBar: 'lighten',
  statusBar: 'none',
  titleBar: 'none',
} as IPeacockElementAdjustments;

export const allAffectedElements = {
  activityBar: true,
  statusBar: true,
  titleBar: true,
} as IPeacockAffectedElementSettings;

export const stubQuickPick = async (fakeResponse: string) =>
  await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));
export const stubInputBox = async (fakeResponse: string) =>
  await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve<any>(fakeResponse));

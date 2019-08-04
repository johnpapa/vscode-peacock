import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { IPeacockAffectedElementSettings, IPeacockElementAdjustments } from '../../../models';

export const executeCommand = vscode.commands.executeCommand;

export const noopElementAdjustments = <IPeacockElementAdjustments>{
  activityBar: 'none',
  statusBar: 'none',
  titleBar: 'none',
};

export const lightenActivityBarElementAdjustments = <IPeacockElementAdjustments>{
  activityBar: 'lighten',
  statusBar: 'none',
  titleBar: 'none',
};

export const allAffectedElements = <IPeacockAffectedElementSettings>{
  activityBar: true,
  statusBar: true,
  titleBar: true,
};

export const stubQuickPick = async (fakeResponse: string) =>
  await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));
export const stubInputBox = async (fakeResponse: string) =>
  await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve<any>(fakeResponse));

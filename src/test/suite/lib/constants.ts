import * as vscode from 'vscode';
import { IPeacockAffectedElementSettings, IPeacockElementAdjustments } from '../../../models';

export const executeCommand = vscode.commands.executeCommand;

export const timeout = async (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

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
  statusBar: true,
  activityBar: true,
  titleBar: true,
};

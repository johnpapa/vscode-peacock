import * as vscode from 'vscode';
import {
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  Commands
} from '../../models';
import {
  getAffectedElements,
  getPreferredColors,
  updateAffectedElements,
  updatePreferredColors,
  updateElementAdjustments,
  updateKeepForegroundColor,
  getKeepForegroundColor
} from '../../configuration';
import { getExtension, noopElementAdjustments } from './helpers';
import { executeCommand } from './helpers';

export async function setupTestSuite(
  extension: vscode.Extension<any>,
  originalValues: IPeacockSettings
) {
  extension = getExtension(extension);
  // Save the original values
  originalValues.affectedElements = getAffectedElements();
  originalValues.keepForegroundColor = getKeepForegroundColor();
  const { values: preferredColors } = getPreferredColors();
  originalValues.preferredColors = preferredColors;
  // Set the test values
  await updateAffectedElements(<IPeacockAffectedElementSettings>{
    statusBar: true,
    activityBar: true,
    titleBar: true
  });
  await updatePreferredColors([
    { name: 'Gatsby Purple', value: '#639' },
    { name: 'Auth0 Orange', value: '#eb5424' },
    { name: 'Azure Blue', value: '#007fff' }
  ]);
  await updateKeepForegroundColor(false);
  await updateElementAdjustments(noopElementAdjustments);
  return extension;
}

export async function teardownTestSuite(originalValues: IPeacockSettings) {
  await executeCommand(Commands.resetColors);
  // put back the original peacock user settings
  await updateAffectedElements(originalValues.affectedElements);
  await updateElementAdjustments(originalValues.elementAdjustments);
  await updatePreferredColors(originalValues.preferredColors);
  await updateKeepForegroundColor(originalValues.keepForegroundColor);
}

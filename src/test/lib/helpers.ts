import * as vscode from 'vscode';
import {
  IPeacockAffectedElementSettings,
  AffectedSettings,
  extensionId
} from '../../models';
import { updateGlobalConfiguration } from '../../configuration';

export function getExtension() {
  let extension: vscode.Extension<any> | undefined;
  const ext = vscode.extensions.getExtension(extensionId);
  if (!ext) {
    throw new Error('Extension was not found.');
  }
  if (ext) {
    extension = ext;
  }
  return extension;
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function updateAffectedElements(
  values: IPeacockAffectedElementSettings
) {
  await updateGlobalConfiguration(
    AffectedSettings.ActivityBar,
    values.activityBar
  );
  await updateGlobalConfiguration(AffectedSettings.StatusBar, values.statusBar);
  await updateGlobalConfiguration(AffectedSettings.TitleBar, values.titleBar);

  return true;
}

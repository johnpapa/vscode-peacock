import * as vscode from 'vscode';
import { Logger } from '../logging';
import { extensionShortName, ISettingsIndexer } from '../models';
import {
  getColorCustomizationConfigFromWorkspace,
  getColorCustomizationConfig,
} from './read-configuration';
import {
  getColorCustomizationsBackupDoneMemento,
  saveColorCustomizationsBackupDoneMemento,
} from '../mementos';

const ColorCustomizationBackupSection = `${extensionShortName}.colorCustomizationsBackup`;

/**
 * Backs up any existing workbench.colorCustomizations settings before Peacock applies its colors.
 * This prevents data loss when users have pre-existing color customizations.
 *
 * Related issue: #687 - Installing Peacock blows away existing colorCustomizations
 */
export async function backupExistingColorCustomizationsIfNeeded(): Promise<void> {
  // Only run once per workspace
  if (getColorCustomizationsBackupDoneMemento()) {
    return;
  }

  // Only operate in a workspace
  if (!vscode.workspace.workspaceFolders) {
    return;
  }

  const existingColors = getColorCustomizationConfigFromWorkspace();

  // If no colors exist, nothing to back up
  if (!existingColors || Object.keys(existingColors).length === 0) {
    await saveColorCustomizationsBackupDoneMemento();
    return;
  }

  // Store the backup in VS Code's settings
  try {
    const config = vscode.workspace.getConfiguration();
    await config.update(
      ColorCustomizationBackupSection,
      existingColors,
      vscode.ConfigurationTarget.Workspace,
    );

    Logger.info(
      `${extensionShortName}: Backed up existing workbench.colorCustomizations to ${ColorCustomizationBackupSection}`,
    );

    // Show an informational message to the user
    const restoreAction = 'View Backup';
    const response = await vscode.window.showInformationMessage(
      `${extensionShortName}: Existing workbench.colorCustomizations have been backed up to workspace settings. You can access them anytime.`,
      restoreAction,
    );

    if (response === restoreAction) {
      await vscode.commands.executeCommand('workbench.action.openSettingsJson');
    }
  } catch (error) {
    Logger.info(
      `${extensionShortName}: Failed to back up colorCustomizations: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  await saveColorCustomizationsBackupDoneMemento();
}

/**
 * Retrieves the backed-up color customizations if they exist
 */
export function getBackedUpColorCustomizations(): ISettingsIndexer | undefined {
  try {
    const config = getColorCustomizationConfig();
    const backup = config.get<ISettingsIndexer>(ColorCustomizationBackupSection);
    return backup && Object.keys(backup).length > 0 ? backup : undefined;
  } catch {
    return undefined;
  }
}

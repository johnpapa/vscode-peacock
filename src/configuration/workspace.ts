import { workspace } from 'vscode';
import { ISettingsIndexer, Sections } from '../models';

export function getColorCustomizationConfigFromWorkspace() {
  const inspect = workspace.getConfiguration().inspect(Sections.peacockColorCustomizationSection);

  if (!inspect || typeof inspect.workspaceValue !== 'object') {
    return {};
  }

  const colorCustomizations: ISettingsIndexer = inspect.workspaceValue as ISettingsIndexer;
  return colorCustomizations;
}

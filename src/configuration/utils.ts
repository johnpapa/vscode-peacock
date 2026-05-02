import * as vscode from 'vscode';
import { AllSettings, Sections } from '../models/enums';
const { workspace } = vscode;

export function readConfiguration<T>(setting: AllSettings, defaultValue?: T | undefined) {
  const value: T | undefined = workspace
    .getConfiguration(Sections.peacockSection)
    .get<T | undefined>(setting, defaultValue);
  return value as T;
}

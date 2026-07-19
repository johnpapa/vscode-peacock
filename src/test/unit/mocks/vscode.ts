import { vi } from 'vitest';

type ConfigurationInspectResult = {
  workspaceValue?: Record<string, unknown>;
  workspaceFolderValue?: Record<string, unknown>;
};

type ConfigurationResult = {
  get: <T>(setting: string, defaultValue?: T) => T | undefined;
  inspect: (setting: string) => ConfigurationInspectResult | undefined;
};

const defaultConfiguration: ConfigurationResult = {
  get: <T>(setting: string, defaultValue?: T) => {
    void setting;
    return defaultValue;
  },
  inspect: (setting: string) => {
    void setting;
    return undefined;
  },
};

const defaultOutputChannel = {
  appendLine: vi.fn(),
};

export const window = {
  createOutputChannel: vi.fn(() => defaultOutputChannel),
  showInformationMessage: vi.fn(),
};

export const workspace = {
  getConfiguration: vi.fn((section?: string) => {
    void section;
    return defaultConfiguration;
  }),
};

export const env = {
  appName: 'Visual Studio Code',
};

export const Uri = {
  parse: (value: string) => ({
    toString: () => value,
    path: value,
    fsPath: value,
  }),
};

export const commands = {
  executeCommand: vi.fn(),
};

export const extensions = {
  getExtension: vi.fn(),
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
};

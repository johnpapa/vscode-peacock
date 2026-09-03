import { CssProfileRegistry } from './profiles';

export interface ICssPatcher {
  locate(cachedStylesheetPath?: string): Promise<string | undefined>;
  validate(stylesheetPath: string): Promise<boolean>;
  install(stylesheetPath: string, profileRegistry: CssProfileRegistry): Promise<boolean>;
  remove(stylesheetPath: string): Promise<boolean>;
}

export class CssInjectionUnsupportedError extends Error {
  constructor() {
    super('Peacock CSS injection is only available in desktop versions of VS Code.');
    this.name = 'CssInjectionUnsupportedError';
  }
}

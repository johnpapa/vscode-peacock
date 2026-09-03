import { CssProfileRegistry } from './profiles';

export interface ICssPatchOperationResult {
  changed: boolean;
  path: string;
  profileIds: string[];
}

export interface ICssPatcher {
  locate(cachedPath?: string): Promise<string | undefined>;
  validate(cssPath: string): Promise<boolean>;
  install(cssPath: string, registry: CssProfileRegistry): Promise<ICssPatchOperationResult>;
  remove(cssPath: string): Promise<ICssPatchOperationResult>;
}

export class CssInjectionUnsupportedError extends Error {
  constructor() {
    super('Peacock CSS injection is only available in desktop versions of VS Code.');
    this.name = 'CssInjectionUnsupportedError';
  }
}

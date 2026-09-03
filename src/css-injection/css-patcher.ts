import { CssProfileRegistry } from './profiles';

export interface ICssPatcher {
  locate(cachedPath?: string): Promise<string | undefined>;
  validate(cssPath: string): Promise<boolean>;
  install(cssPath: string, registry: CssProfileRegistry): Promise<boolean>;
  remove(cssPath: string): Promise<boolean>;
}

export class CssInjectionUnsupportedError extends Error {
  constructor() {
    super('Peacock CSS injection is only available in desktop versions of VS Code.');
    this.name = 'CssInjectionUnsupportedError';
  }
}

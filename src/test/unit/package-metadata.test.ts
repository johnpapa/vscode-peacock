import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

type PackageJson = {
  engines: {
    vscode: string;
  };
  devDependencies: {
    '@types/vscode': string;
  };
};

describe('Package metadata', () => {
  it('pins @types/vscode to the engines.vscode floor so vsce packaging stays valid', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as PackageJson;
    const engineFloor = packageJson.engines.vscode.replace(/^[^\d]*/, '');

    expect(packageJson.devDependencies['@types/vscode']).toBe(engineFloor);
  });
});

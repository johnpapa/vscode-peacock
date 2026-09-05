import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { backupExistingColorCustomizationsIfNeeded } from '../../configuration/migration';
import { saveColorCustomizationsBackupDoneMemento } from '../../mementos';

suite('Migration Tests', () => {
  suite('Backup Existing Color Customizations', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
      sandbox = sinon.createSandbox();
    });

    teardown(() => {
      sandbox.restore();
    });

    test('should not run backup if already done', async () => {
      // Mark backup as already done
      await saveColorCustomizationsBackupDoneMemento();

      const updateStub = sandbox.stub();
      sandbox.stub(vscode.workspace, 'getConfiguration').returns({ update: updateStub } as any);

      await backupExistingColorCustomizationsIfNeeded();

      assert.strictEqual(
        updateStub.called,
        false,
        'update should not be called if backup was already done',
      );
    });

    test('should skip backup if not in a workspace', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
      const updateStub = sandbox.stub();
      sandbox.stub(vscode.workspace, 'getConfiguration').returns({ update: updateStub } as any);

      await backupExistingColorCustomizationsIfNeeded();

      assert.strictEqual(
        updateStub.called,
        false,
        'update should not be called if not in a workspace',
      );
    });

    test('should handle empty color customizations', async () => {
      const getConfigStub = sandbox.stub(vscode.workspace, 'getConfiguration');
      const configMock = {
        update: sandbox.stub(),
      };
      getConfigStub.returns(configMock as any);

      // Mock getColorCustomizationConfigFromWorkspace to return empty
      const configModule = await import('../../configuration/read-configuration');
      sandbox.stub(configModule, 'getColorCustomizationConfigFromWorkspace').returns({});

      await backupExistingColorCustomizationsIfNeeded();

      assert.strictEqual(
        configMock.update.called,
        false,
        'update should not be called if there are no existing color customizations',
      );
    });
  });
});

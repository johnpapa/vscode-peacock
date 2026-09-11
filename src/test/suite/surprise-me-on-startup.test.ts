import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  Commands,
  IFavoriteColors,
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  IElementColors,
  ElementNames,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import {
  getOriginalColorsForAllElements,
  updateAffectedElements,
  updateFavoriteColors,
  updateSurpriseMeFromFavoritesOnly,
  updateSurpriseMeInFavoritesOrder,
  getEnvironmentAwareColor,
  updateSurpriseMeOnStartup,
  updatePeacockColor,
  updatePeacockRemoteColor,
  getPeacockRemoteColor,
} from '../../configuration';
import { checkSurpriseMeOnStartupLogic } from '../../extension';
import {
  resetFavoritesVersionMemento,
  saveSurpriseMeStartupSelectionGlobalMemento,
} from '../../mementos';
import { RemoteNames } from '../../remote';

suite('Surprise me on startup', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    await executeCommand(Commands.resetWorkspaceColors);
    await resetFavoritesVersionMemento();
    await updateAffectedElements({
      statusBar: true,
      activityBar: true,
      titleBar: true,
    } as IPeacockAffectedElementSettings);
  });

  test('when not set has no effect if no customizations exist', async () => {
    await testColorsBeforeAndAfterInitialConfiguration((actual, expected) => {
      assert.equal(actual, expected);
    });
  });

  suite('when set', () => {
    setup(async () => {
      await updateSurpriseMeOnStartup(true);
    });

    test('applies a random color if no color customizations exist', async () => {
      await testColorsBeforeAndAfterInitialConfiguration((actual, expected) => {
        assert.notEqual(actual, expected);
      });
    });

    test('has no effect when color customizations exist', async () => {
      await vscode.commands.executeCommand(Commands.changeColorToPeacockGreen);
      await testColorsBeforeAndAfterInitialConfiguration((actual, expected) => {
        assert.equal(actual, expected);
      });
    });

    teardown(async () => {
      await updateSurpriseMeOnStartup(false);
    });
  });

  suite('when in a remote environment (#573)', () => {
    setup(async () => {
      await updateSurpriseMeOnStartup(true);
    });

    teardown(async () => {
      await updateSurpriseMeOnStartup(false);
    });

    test('does not pick a new random color when peacock.remoteColor is already set on reload/reconnect', async () => {
      const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.sshRemote);
      try {
        await updatePeacockColor('');
        await updatePeacockRemoteColor('#f13768');

        const randomStub = sinon.stub(Math, 'random');
        try {
          // Simulate reload/reconnect: run the startup logic repeatedly, as would
          // happen on every "Developer: Reload Window" or SSH reconnect.
          await checkSurpriseMeOnStartupLogic();
          await checkSurpriseMeOnStartupLogic();
          await checkSurpriseMeOnStartupLogic();

          assert.equal(randomStub.callCount, 0);
          assert.equal(getPeacockRemoteColor(), '#f13768');
          assert.equal(getEnvironmentAwareColor(), '#f13768');
        } finally {
          randomStub.restore();
        }
      } finally {
        remoteNameStub.restore();
      }
    });
  });

  suite('when surprise uses favorites', () => {
    const deterministicFavorites: IFavoriteColors[] = [
      { name: 'Order One', value: '#111111' },
      { name: 'Order Two', value: '#222222' },
      { name: 'Order Three', value: '#333333' },
    ];

    setup(async () => {
      await updateSurpriseMeOnStartup(true);
      await updateSurpriseMeFromFavoritesOnly(true);
      await updateFavoriteColors(deterministicFavorites);
    });

    teardown(async () => {
      await updateSurpriseMeInFavoritesOrder(false);
      await updateSurpriseMeFromFavoritesOnly(false);
      await updateSurpriseMeOnStartup(false);
    });

    test('cycles deterministically when surpriseMeInFavoritesOrder is true', async () => {
      await updateSurpriseMeInFavoritesOrder(true);

      await assertStartupColor('#111111');
      await assertStartupColor('#222222');
      await assertStartupColor('#333333');
      await assertStartupColor('#111111');
    });

    test('uses random favorite selection when no startup selection is saved', async () => {
      await updateSurpriseMeInFavoritesOrder(false);
      const randomStub = sinon.stub(Math, 'random');
      try {
        randomStub.onCall(0).returns(0.99);
        randomStub.onCall(1).returns(0.01);

        await assertStartupColor('#333333');
        await resetFavoritesVersionMemento();
        await assertStartupColor('#111111');
      } finally {
        randomStub.restore();
      }
    });

    test('restores the last startup surprise selection for the same workspace', async () => {
      await updateSurpriseMeInFavoritesOrder(false);
      const randomStub = sinon.stub(Math, 'random');
      try {
        randomStub.onCall(0).returns(0.99);
        randomStub.onCall(1).returns(0.01);

        await assertStartupColor('#333333');
        await assertStartupColor('#333333');

        assert.equal(randomStub.callCount, 1);
      } finally {
        randomStub.restore();
      }
    });

    test('does not restore startup selections from other workspaces', async () => {
      await updateSurpriseMeInFavoritesOrder(false);
      await saveSurpriseMeStartupSelectionGlobalMemento(
        'workspaceFolder:file:///different-workspace',
        '#111111',
      );

      const randomStub = sinon.stub(Math, 'random');
      try {
        randomStub.onCall(0).returns(0.99);
        await assertStartupColor('#333333');
      } finally {
        randomStub.restore();
      }
    });

    test('resets deterministic index when favorites change', async () => {
      await updateSurpriseMeInFavoritesOrder(true);

      await assertStartupColor('#111111');
      await assertStartupColor('#222222');
      await assertStartupColor('#333333');

      await updateFavoriteColors([
        { name: 'New One', value: '#444444' },
        { name: 'New Two', value: '#555555' },
      ]);

      await assertStartupColor('#444444');
      await assertStartupColor('#555555');
    });
  });

  async function testColorsBeforeAndAfterInitialConfiguration(assertEquality: EqualityAssertion) {
    const colors1: IElementColors = getOriginalColorsForAllElements();
    await checkSurpriseMeOnStartupLogic();
    const colors2: IElementColors = getOriginalColorsForAllElements();
    assertEquality(colors1[ElementNames.activityBar], colors2[ElementNames.activityBar]);
    assertEquality(colors1[ElementNames.statusBar], colors2[ElementNames.statusBar]);
    assertEquality(colors1[ElementNames.titleBar], colors2[ElementNames.titleBar]);
  }

  async function assertStartupColor(expectedHex: string) {
    await executeCommand(Commands.resetWorkspaceColors);
    await checkSurpriseMeOnStartupLogic();
    const actualColor = getEnvironmentAwareColor();
    assert.equal(actualColor?.toLowerCase(), expectedHex);
  }

  interface EqualityAssertion {
    (actual: any, expected: any, message?: string | Error | undefined): void;
  }
});

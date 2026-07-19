import * as assert from 'assert';
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
} from '../../configuration';
import { checkSurpriseMeOnStartupLogic } from '../../extension';
import { resetFavoritesVersionMemento } from '../../mementos';

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
    const colors1: IElementColors = getOriginalColorsForAllElements();
    await checkSurpriseMeOnStartupLogic();
    const colors2: IElementColors = getOriginalColorsForAllElements();
    assert.equal(colors1[ElementNames.activityBar], colors2[ElementNames.activityBar]);
    assert.equal(colors1[ElementNames.statusBar], colors2[ElementNames.statusBar]);
    assert.equal(colors1[ElementNames.titleBar], colors2[ElementNames.titleBar]);
  });

  test('applies a random color when startup surprise is enabled', async () => {
    await updateSurpriseMeOnStartup(true);
    const colors1: IElementColors = getOriginalColorsForAllElements();
    await checkSurpriseMeOnStartupLogic();
    const colors2: IElementColors = getOriginalColorsForAllElements();
    assert.notEqual(colors1[ElementNames.activityBar], colors2[ElementNames.activityBar]);
    await updateSurpriseMeOnStartup(false);
  });

  test('cycles deterministically through favorites when ordered mode is enabled', async () => {
    const deterministicFavorites: IFavoriteColors[] = [
      { name: 'Order One', value: '#111111' },
      { name: 'Order Two', value: '#222222' },
      { name: 'Order Three', value: '#333333' },
    ];

    await updateSurpriseMeOnStartup(true);
    await updateSurpriseMeFromFavoritesOnly(true);
    await updateSurpriseMeInFavoritesOrder(true);
    await updateFavoriteColors(deterministicFavorites);

    await executeCommand(Commands.resetWorkspaceColors);
    await checkSurpriseMeOnStartupLogic();
    assert.equal(getEnvironmentAwareColor()?.toLowerCase(), '#111111');

    await executeCommand(Commands.resetWorkspaceColors);
    await checkSurpriseMeOnStartupLogic();
    assert.equal(getEnvironmentAwareColor()?.toLowerCase(), '#222222');

    await executeCommand(Commands.resetWorkspaceColors);
    await checkSurpriseMeOnStartupLogic();
    assert.equal(getEnvironmentAwareColor()?.toLowerCase(), '#333333');

    await updateSurpriseMeInFavoritesOrder(false);
    await updateSurpriseMeFromFavoritesOnly(false);
    await updateSurpriseMeOnStartup(false);
  });
});

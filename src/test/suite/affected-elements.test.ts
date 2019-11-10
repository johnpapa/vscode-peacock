import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import {
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  Commands,
  ColorSettings,
  ReadabilityRatios,
  peacockGreen,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import {
  getKeepForegroundColor,
  updateKeepForegroundColor,
  getKeepBadgeColor,
  updateKeepBadgeColor,
  getElementStyle,
  getColorCustomizationConfig,
  updateAffectedElements,
} from '../../configuration';
import { getColorBrightness, getReadabilityRatio } from '../../color-library';
import { executeCommand, allAffectedElements } from './lib/constants';

suite('Affected elements', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('keep foreground color = false', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepForegroundColor();
      await updateKeepForegroundColor(false);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepForegroundColor(originalValue);
    });
  });

  suite('keep foreground color = true', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepForegroundColor();
      await updateKeepForegroundColor(true);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepForegroundColor(originalValue);
    });
  });

  suite('keep badge color = false', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepBadgeColor();
      await updateKeepBadgeColor(false);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepBadgeColor(originalValue);
    });
  });

  suite('keep badge color = true', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepBadgeColor();
      await updateKeepBadgeColor(true);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepBadgeColor(originalValue);
    });
  });

  suite('No affected elements', () => {
    suiteSetup(async () => {
      await updateAffectedElements({
        activityBar: false,
        statusBar: false,
        titleBar: false,
        accentBorders: false,
        tabActiveBorder: false,
      } as IPeacockAffectedElementSettings);
    });

    test('does not set any color customizations when no elements affected', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.titleBar_activeBackground]);
      assert.ok(!config[ColorSettings.titleBar_activeForeground]);
      assert.ok(!config[ColorSettings.titleBar_inactiveBackground]);
      assert.ok(!config[ColorSettings.titleBar_activeForeground]);
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.activityBar_foreground]);
      assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
      assert.ok(!config[ColorSettings.activityBar_activeBorder]);
      assert.ok(!config[ColorSettings.statusBar_foreground]);
      assert.ok(!config[ColorSettings.statusBar_background]);
      assert.ok(!config[ColorSettings.accentBorders_panelBorder]);
      assert.ok(!config[ColorSettings.accentBorders_sideBarBorder]);
      assert.ok(!config[ColorSettings.accentBorders_editorGroupBorder]);
      assert.ok(!config[ColorSettings.tabActiveBorder]);
    });

    suiteTeardown(async () => {
      await updateAffectedElements(allAffectedElements);
    });
  });

  suite('Status Bar', () => {
    test('does not set item hover color when status bar is not affected', async () => {
      await updateAffectedElements({
        activityBar: true,
        statusBar: false,
        titleBar: true,
        tabActiveBorder: true,
        accentBorders: true,
      });

      const value = await getColorSettingAfterEnterColor(
        peacockGreen,
        ColorSettings.statusBarItem_hoverBackground,
      );
      assert.ok(!value);

      await updateAffectedElements(allAffectedElements);
    });

    test('sets item hover color to darker on a light background', async () => {
      const config = await getPeacockWorkspaceConfigAfterEnterColor('hsl(0 0.5 0.75)');
      const backgroundHex = config[ColorSettings.statusBar_background];
      const hoverBackgroundHex = config[ColorSettings.statusBarItem_hoverBackground];

      assert.ok(getColorBrightness(backgroundHex) > getColorBrightness(hoverBackgroundHex));
    });

    test('sets item hover color to lighter on a dark background', async () => {
      const config = await getPeacockWorkspaceConfigAfterEnterColor('hsl(0 0.5 0.25)');
      const backgroundHex = config[ColorSettings.statusBar_background];
      const hoverBackgroundHex = config[ColorSettings.statusBarItem_hoverBackground];

      assert.ok(getColorBrightness(backgroundHex) < getColorBrightness(hoverBackgroundHex));
    });
  });

  suite('Activity bar badge', () => {
    test('activity bar badge styles are set when activity bar is affected', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const badgeBackground = config[ColorSettings.activityBar_badgeBackground];
      const badgeForeground = config[ColorSettings.activityBar_badgeForeground];
      assert.ok(badgeBackground);
      assert.ok(badgeForeground);
    });

    test('activity bar badge styles are not set when activity bar is not affected', async () => {
      await updateAffectedElements({
        activityBar: false,
        statusBar: true,
        titleBar: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      assert.ok(!config[ColorSettings.activityBar_badgeBackground]);
      assert.ok(!config[ColorSettings.activityBar_badgeBackground]);

      await updateAffectedElements(allAffectedElements);
    });

    test('activity bar badge is readable over white activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('white');
    });

    test('activity bar badge is readable over 25% luminance activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('hsl (0 0 0.25)');
    });

    test('activity bar badge is readable over 50% luminance activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('hsl (0 0 0.50)');
    });

    test('activity bar badge is readable over 75% luminance activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('hsl (0 0 0.75)');
    });

    test('activity bar badge is readable over black activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('black');
    });

    test('activity bar badge is readable over peacock green activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold(peacockGreen);
    });

    async function testActivityBarBadgeColoringMeetsReadabilityThreshold(backgroundHex: string) {
      // Stub the async input box to return a response
      const stub = await sinon
        .stub(vscode.window, 'showInputBox')
        .returns(Promise.resolve(backgroundHex));
      // fire the command
      await executeCommand(Commands.enterColor);
      const config = getColorCustomizationConfig();
      const value = config[ColorSettings.activityBar_badgeBackground];
      stub.restore();

      assert.ok(getReadabilityRatio(backgroundHex, value) > ReadabilityRatios.UserInterfaceLow);
    }
  });
});

async function testsDoesNotSetColorCustomizationsForAffectedElements() {
  await updateAffectedElements({
    activityBar: false,
    statusBar: false,
  } as IPeacockAffectedElementSettings);
  await executeCommand(Commands.changeColorToPeacockGreen);
  const config = getColorCustomizationConfig();
  const keepForegroundColor = getKeepForegroundColor();
  const style = getElementStyle(peacockGreen);

  assert.equal(style.backgroundHex, config[ColorSettings.titleBar_activeBackground]);

  assert.ok(
    shouldKeepColorTest(
      style.foregroundHex,
      ColorSettings.titleBar_activeForeground,
      keepForegroundColor,
    ),
  );

  assert.equal(style.inactiveBackgroundHex, config[ColorSettings.titleBar_inactiveBackground]);

  assert.ok(
    shouldKeepColorTest(
      style.inactiveForegroundHex,
      ColorSettings.titleBar_inactiveForeground,
      keepForegroundColor,
    ),
  );

  // All others should not exist
  assert.ok(!config[ColorSettings.activityBar_background]);
  assert.ok(!config[ColorSettings.activityBar_foreground]);
  assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
  assert.ok(!config[ColorSettings.statusBar_foreground]);
  assert.ok(!config[ColorSettings.statusBar_background]);
  assert.ok(!config[ColorSettings.activityBar_activeBorder]);

  // reset
  await updateAffectedElements(allAffectedElements);
}

async function testsSetsColorCustomizationsForAffectedElements() {
  await executeCommand(Commands.changeColorToPeacockGreen);
  const config = getColorCustomizationConfig();
  const keepForegroundColor = getKeepForegroundColor();
  const keepBadgeColor = getKeepBadgeColor();

  const titleBarStyle = getElementStyle(peacockGreen, 'titleBar');
  assert.equal(titleBarStyle.backgroundHex, config[ColorSettings.titleBar_activeBackground]);

  assert.ok(
    shouldKeepColorTest(
      titleBarStyle.foregroundHex,
      ColorSettings.titleBar_activeForeground,
      keepForegroundColor,
    ),
  );

  assert.equal(
    titleBarStyle.inactiveBackgroundHex,
    config[ColorSettings.titleBar_inactiveBackground],
  );

  assert.ok(
    shouldKeepColorTest(
      titleBarStyle.inactiveForegroundHex,
      ColorSettings.titleBar_inactiveForeground,
      keepForegroundColor,
    ),
  );

  const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');
  assert.equal(activityBarStyle.backgroundHex, config[ColorSettings.activityBar_background]);
  assert.equal(activityBarStyle.badgeBackgroundHex, config[ColorSettings.activityBar_activeBorder]);

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.foregroundHex,
      ColorSettings.activityBar_foreground,
      keepForegroundColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.inactiveForegroundHex,
      ColorSettings.activityBar_inactiveForeground,
      keepForegroundColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.badgeBackgroundHex,
      ColorSettings.activityBar_badgeBackground,
      keepBadgeColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.badgeForegroundHex,
      ColorSettings.activityBar_badgeForeground,
      keepBadgeColor,
    ),
  );

  const statusBarStyle = getElementStyle(peacockGreen, 'statusBar');
  assert.equal(statusBarStyle.backgroundHex, config[ColorSettings.statusBar_background]);

  assert.ok(
    shouldKeepColorTest(
      statusBarStyle.foregroundHex,
      ColorSettings.statusBar_foreground,
      keepForegroundColor,
    ),
  );
}

async function getColorSettingAfterEnterColor(colorInput: string, setting: ColorSettings) {
  // Stub the async input box to return a response
  const stub = await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve(colorInput));
  // fire the command
  await vscode.commands.executeCommand(Commands.enterColor);
  const config = getColorCustomizationConfig();
  stub.restore();
  return config[setting];
}

function shouldKeepColorTest(
  elementStyle: string | undefined,
  colorSetting: ColorSettings,
  keepColor: boolean,
) {
  const config = getColorCustomizationConfig();
  const match = elementStyle === config[colorSetting];
  const passesTest = keepColor ? !match : match;
  return passesTest;
}
async function getPeacockWorkspaceConfigAfterEnterColor(colorInput: string) {
  // Stub the async input box to return a response
  const stub = await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve(colorInput));

  // fire the command
  await vscode.commands.executeCommand(Commands.enterColor);
  const config = getColorCustomizationConfig();
  stub.restore();

  return config;
}

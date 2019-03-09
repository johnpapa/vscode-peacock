//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  Commands,
  ColorSettings,
  BuiltInColors,
  IPeacockElementAdjustments,
  ForegroundColors,
  ReadabilityRatios
} from '../models';
import {
  updateAffectedElements,
  updateElementAdjustments,
  getElementStyle,
  updateKeepForegroundColor,
  getKeepForegroundColor,
  getKeepBadgeColor,
  updateKeepBadgeColor
} from '../configuration';
import {
  isValidColorInput,
  getLightenedColorHex,
  getDarkenedColorHex,
  getColorBrightness,
  getReadabilityRatio
} from '../color-library';
import { parsePreferredColorValue } from '../inputs';
import {
  executeCommand,
  getPeacockWorkspaceConfig,
  getColorSettingAfterEnterColor,
  getPeacockWorkspaceConfigAfterEnterColor,
  shouldKeepColorTest
} from './lib/helpers';
import {
  setupTestSuite,
  teardownTestSuite
} from './lib/setup-teardown-test-suite';
const allAffectedElements = <IPeacockAffectedElementSettings>{
  statusBar: true,
  activityBar: true,
  titleBar: true
};

suite('Extension Tests', () => {
  let extension: vscode.Extension<any>;
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => {
    extension = await setupTestSuite(extension, originalValues);
  });

  setup(async () => {
    await executeCommand(Commands.resetColors);
  });

  test('can set color to Random color', async () => {
    await executeCommand(Commands.changeColorToRandom);
    let config = getPeacockWorkspaceConfig();
    assert.ok(
      isValidColorInput(config[ColorSettings.titleBar_activeBackground])
    );
  });

  test('can reset colors', async () => {
    await executeCommand(Commands.resetColors);
    let config = getPeacockWorkspaceConfig();
    assert.ok(!config[ColorSettings.titleBar_activeBackground]);
    assert.ok(!config[ColorSettings.statusBar_background]);
    assert.ok(!config[ColorSettings.activityBar_background]);
  });



  suite('Preferred colors', () => {
    test('can set color to preferred color', async () => {
      // Stub the async quick pick to return a response
      const fakeResponse = 'Azure Blue -> #007fff';
      const stub = await sinon
        .stub(vscode.window, 'showQuickPick')
        .returns(Promise.resolve<any>(fakeResponse));

      await executeCommand(Commands.changeColorToPreferred);
      let config = getPeacockWorkspaceConfig();
      const value = config[ColorSettings.titleBar_activeBackground];
      stub.restore();

      const parsedResponse = parsePreferredColorValue(fakeResponse);

      assert.ok(isValidColorInput(value));
      assert.ok(value === parsedResponse);
    });

    test('set to preferred color with no preferences is a noop', async () => {
      // set the color to react blue to start
      await executeCommand(Commands.changeColorToReactBlue);

      // Stub the async quick pick to return a response
      const fakeResponse = '';
      const stub = await sinon
        .stub(vscode.window, 'showQuickPick')
        .returns(Promise.resolve<any>(fakeResponse));

      let config = getPeacockWorkspaceConfig();
      const valueBefore = config[ColorSettings.titleBar_activeBackground];

      await executeCommand(Commands.changeColorToPreferred);
      const valueAfter = config[ColorSettings.titleBar_activeBackground];
      stub.restore();

      assert.ok(valueBefore === valueAfter);
    });
  });

  suite('Affected elements', () => {
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
        await updateAffectedElements(<IPeacockAffectedElementSettings>{
          activityBar: false,
          statusBar: false,
          titleBar: false
        });
      });

      test('does not set any color customizations when no elements affected', async () => {
        await executeCommand(Commands.changeColorToAngularRed);
        let config = getPeacockWorkspaceConfig();

        assert.ok(!config[ColorSettings.titleBar_activeBackground]);
        assert.ok(!config[ColorSettings.titleBar_activeForeground]);
        assert.ok(!config[ColorSettings.titleBar_inactiveBackground]);
        assert.ok(!config[ColorSettings.titleBar_activeForeground]);
        assert.ok(!config[ColorSettings.activityBar_background]);
        assert.ok(!config[ColorSettings.activityBar_foreground]);
        assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
        assert.ok(!config[ColorSettings.statusBar_foreground]);
        assert.ok(!config[ColorSettings.statusBar_background]);
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
          titleBar: true
        });

        const value = await getColorSettingAfterEnterColor(
          BuiltInColors.Angular,
          ColorSettings.statusBarItem_hoverBackground
        );
        assert.ok(!value);

        await updateAffectedElements(allAffectedElements);
      });

      test('sets item hover color to darker on a light background', async () => {
        const config = await getPeacockWorkspaceConfigAfterEnterColor(
          'hsl(0 0.5 0.75)'
        );
        const backgroundHex = config[ColorSettings.statusBar_background];
        const hoverBackgroundHex =
          config[ColorSettings.statusBarItem_hoverBackground];

        assert.ok(
          getColorBrightness(backgroundHex) >
            getColorBrightness(hoverBackgroundHex)
        );
      });

      test('sets item hover color to lighter on a dark background', async () => {
        const config = await getPeacockWorkspaceConfigAfterEnterColor(
          'hsl(0 0.5 0.25)'
        );
        const backgroundHex = config[ColorSettings.statusBar_background];
        const hoverBackgroundHex =
          config[ColorSettings.statusBarItem_hoverBackground];

        assert.ok(
          getColorBrightness(backgroundHex) <
            getColorBrightness(hoverBackgroundHex)
        );
      });
    });

    suite('Activity bar badge', () => {
      test('activity bar badge styles are set when activity bar is affected', async () => {
        await executeCommand(Commands.changeColorToAngularRed);
        let config = getPeacockWorkspaceConfig();
        assert.ok(config[ColorSettings.activityBar_badgeBackground]);
        assert.ok(config[ColorSettings.activityBar_badgeForeground]);
      });

      test('activity bar badge styles are not set when activity bar is not affected', async () => {
        await updateAffectedElements(<IPeacockAffectedElementSettings>{
          activityBar: false,
          statusBar: true,
          titleBar: true
        });

        await executeCommand(Commands.changeColorToAngularRed);
        let config = getPeacockWorkspaceConfig();
        assert.ok(!config[ColorSettings.activityBar_badgeBackground]);
        assert.ok(!config[ColorSettings.activityBar_badgeBackground]);

        await updateAffectedElements(allAffectedElements);
      });

      test('activity bar badge is readable over white activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold('white');
      });

      test('activity bar badge is readable over 25% luminance activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold(
          'hsl (0 0 0.25)'
        );
      });

      test('activity bar badge is readable over 50% luminance activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold(
          'hsl (0 0 0.50)'
        );
      });

      test('activity bar badge is readable over 75% luminance activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold(
          'hsl (0 0 0.75)'
        );
      });

      test('activity bar badge is readable over black activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold('black');
      });

      test('activity bar badge is readable over Angular activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold(
          BuiltInColors.Angular
        );
      });

      test('activity bar badge is readable over React activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold(
          BuiltInColors.React
        );
      });

      test('activity bar badge is readable over Vue activity bar', async () => {
        await testActivityBarBadgeColoringMeetsReadabilityThreshold(
          BuiltInColors.Vue
        );
      });

      async function testActivityBarBadgeColoringMeetsReadabilityThreshold(
        backgroundHex: string
      ) {
        // Stub the async input box to return a response
        const stub = await sinon
          .stub(vscode.window, 'showInputBox')
          .returns(Promise.resolve(backgroundHex));
        // fire the command
        await executeCommand(Commands.enterColor);
        let config = getPeacockWorkspaceConfig();
        const value = config[ColorSettings.activityBar_badgeBackground];
        stub.restore();

        assert.ok(
          getReadabilityRatio(backgroundHex, value) >
            ReadabilityRatios.UserInterfaceLow
        );
      }
    });
  });

  suite('Element adjustments', () => {
    const elementAdjustments: IPeacockElementAdjustments = {
      activityBar: 'lighten',
      statusBar: 'darken',
      titleBar: 'none'
    };

    suiteSetup(async () => {
      await updateElementAdjustments(elementAdjustments);
    });

    test('can lighten the color of an affected element', async () => {
      await executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        getLightenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.activityBar_background]
      );
    });

    test('can darken the color of an affected element', async () => {
      await executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        getDarkenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.statusBar_background]
      );
    });

    test('set adjustment to none for an affected element is noop', async () => {
      await executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        BuiltInColors.Angular,
        config[ColorSettings.titleBar_activeBackground]
      );
    });

    test('set adjustment to lighten for an affected element is lighter color', async () => {
      await executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();

      const originalBrightness = getColorBrightness(BuiltInColors.Angular);
      const adjustedBrightness = getColorBrightness(
        config[ColorSettings.activityBar_background]
      );
      assert.ok(
        originalBrightness < adjustedBrightness,
        `Expected original brightness ${originalBrightness} to be less than ${adjustedBrightness}, but was greater`
      );
    });

    test('set adjustment to darken for an affected element is darker color', async () => {
      await executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();

      const originalBrightness = getColorBrightness(BuiltInColors.Angular);
      const adjustedBrightness = getColorBrightness(
        config[ColorSettings.statusBar_background]
      );
      assert.ok(
        originalBrightness > adjustedBrightness,
        `Expected original brightness ${originalBrightness} to be greater than ${adjustedBrightness}, but was less`
      );
    });

    test('can adjust the color of an affected elements independently', async () => {
      await executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        getLightenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.activityBar_background]
      );
      assert.equal(
        getDarkenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.statusBar_background]
      );
      assert.equal(
        BuiltInColors.Angular,
        config[ColorSettings.titleBar_activeBackground]
      );
    });

    test('can only adjust the color of an element that is affected', async () => {
      await updateAffectedElements(<IPeacockAffectedElementSettings>{
        activityBar: false,
        statusBar: true,
        titleBar: false
      });

      await executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();

      assert.equal(
        getDarkenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.statusBar_background]
      );
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.titleBar_activeBackground]);

      await updateAffectedElements(allAffectedElements);
    });
  });

  suiteTeardown(() => teardownTestSuite(originalValues));
});

// Reusable tests
async function testsDoesNotSetColorCustomizationsForAffectedElements() {
  await updateAffectedElements(<IPeacockAffectedElementSettings>{
    activityBar: false,
    statusBar: false
  });
  await executeCommand(Commands.changeColorToAngularRed);
  const config = getPeacockWorkspaceConfig();
  const keepForegroundColor = getKeepForegroundColor();
  const style = getElementStyle(BuiltInColors.Angular);

  assert.equal(
    style.backgroundHex,
    config[ColorSettings.titleBar_activeBackground]
  );

  assert.ok(
    shouldKeepColorTest(
      style.foregroundHex,
      ColorSettings.titleBar_activeForeground,
      keepForegroundColor
    )
  );

  assert.equal(
    style.inactiveBackgroundHex,
    config[ColorSettings.titleBar_inactiveBackground]
  );

  assert.ok(
    shouldKeepColorTest(
      style.inactiveForegroundHex,
      ColorSettings.titleBar_inactiveForeground,
      keepForegroundColor
    )
  );

  // All others should not exist
  assert.ok(!config[ColorSettings.activityBar_background]);
  assert.ok(!config[ColorSettings.activityBar_foreground]);
  assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
  assert.ok(!config[ColorSettings.statusBar_foreground]);
  assert.ok(!config[ColorSettings.statusBar_background]);

  // reset
  await updateAffectedElements(allAffectedElements);
}

async function testsSetsColorCustomizationsForAffectedElements() {
  await executeCommand(Commands.changeColorToAngularRed);
  const config = getPeacockWorkspaceConfig();
  const keepForegroundColor = getKeepForegroundColor();
  const keepBadgeColor = getKeepBadgeColor();

  const titleBarStyle = getElementStyle(BuiltInColors.Angular, 'titleBar');
  assert.equal(
    titleBarStyle.backgroundHex,
    config[ColorSettings.titleBar_activeBackground]
  );

  assert.ok(
    shouldKeepColorTest(
      titleBarStyle.foregroundHex,
      ColorSettings.titleBar_activeForeground,
      keepForegroundColor
    )
  );

  assert.equal(
    titleBarStyle.inactiveBackgroundHex,
    config[ColorSettings.titleBar_inactiveBackground]
  );

  assert.ok(
    shouldKeepColorTest(
      titleBarStyle.inactiveForegroundHex,
      ColorSettings.titleBar_inactiveForeground,
      keepForegroundColor
    )
  );

  const activityBarStyle = getElementStyle(
    BuiltInColors.Angular,
    'activityBar',
    true
  );
  assert.equal(
    activityBarStyle.backgroundHex,
    config[ColorSettings.activityBar_background]
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.foregroundHex,
      ColorSettings.activityBar_foreground,
      keepForegroundColor
    )
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.inactiveForegroundHex,
      ColorSettings.activityBar_inactiveForeground,
      keepForegroundColor
    )
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.badgeBackgroundHex,
      ColorSettings.activityBar_badgeBackground,
      keepBadgeColor
    )
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.badgeForegroundHex,
      ColorSettings.activityBar_badgeForeground,
      keepBadgeColor
    )
  );

  const statusBarStyle = getElementStyle(BuiltInColors.Angular, 'statusBar');
  assert.equal(
    statusBarStyle.backgroundHex,
    config[ColorSettings.statusBar_background]
  );

  assert.ok(
    shouldKeepColorTest(
      statusBarStyle.foregroundHex,
      ColorSettings.statusBar_foreground,
      keepForegroundColor
    )
  );
}

import * as assert from 'assert';
import { IPeacockSettings, Commands, starterSetOfFavorites } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import {
  getFavoriteColors,
  writeRecommendedFavoriteColors,
  updateFavoriteColors,
} from '../../configuration';
import { executeCommand, stubInputBox } from './lib/constants';

suite('Save starter favorite colors', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('when adding recommended favorites', async () => {
    test('any removed ones are added back', async () => {
      const gatsbyPurpleName = 'Gatsby Purple';
      // Start with starterSetOfFavorites, minus Gatsby

      // Remove 1 starterFaves (Gatsby)
      const starter = starterSetOfFavorites.filter(item => item.name !== 'Gatsby Purple');
      await updateFavoriteColors(starter);

      // Get the faves
      // we should not find Gatsby
      const { values: favesWithoutGatsby } = getFavoriteColors();
      assert.ok(!favesWithoutGatsby.find(item => item.name === gatsbyPurpleName));

      // Now write the recommended favorites
      await executeCommand(Commands.addRecommendedFavorites);

      // Get the faves
      const { values: faves } = getFavoriteColors();

      // we should have the 1 that was removed
      assert.ok(faves.find(item => item.name === gatsbyPurpleName));
    });

    test('any added ones are still there', async () => {
      // Start with starterSetOfFavorites
      await updateFavoriteColors(starterSetOfFavorites);

      // Add Night Blue #103362 to faves.
      const nightBlue = '#103362';
      const nightBlueName = 'Night Blue';

      // input the hex #103362
      const qiColorStub = await stubInputBox(nightBlue);
      await executeCommand(Commands.enterColor);
      qiColorStub.restore();

      // enter the name "Night Blue"
      const qiNameStub = await stubInputBox(nightBlueName);
      await executeCommand(Commands.saveColorToFavorites);
      qiNameStub.restore();

      // Now write the recommended favorites
      await executeCommand(Commands.addRecommendedFavorites);

      // Get the faves
      const { values: favoriteColorsAfter } = getFavoriteColors();

      // re-added and the one new one, as well/
      assert.ok(favoriteColorsAfter.find(item => item.name === nightBlueName));
    });
  });

  test('general test', async () => {
    // started with:
    // starterSetOfFavorites;

    const { values: favoriteColorsBefore } = getFavoriteColors();

    let gatsbyPurple = favoriteColorsBefore.find(item => item.name === 'Gatsby Purple') || {
      name: '',
      value: '',
    };

    let azureBlue = favoriteColorsBefore.find(item => item.name === 'Azure Blue') || {
      name: '',
      value: '',
    };

    const newRecs = {
      yodaGreen: {
        name: 'Yoda Green', // new key
        value: 'green', // new value
      },
      azureBlue: {
        name: 'Azure Blue', // same key
        value: '#007fff', // same value
      },
      gatsbyPurple: {
        name: 'Gatsby Purple', // same key
        value: '639', // new value
      },
    };

    const testRecommended = [newRecs.gatsbyPurple, newRecs.azureBlue, newRecs.yodaGreen];

    // Write 3 to favorites
    await writeRecommendedFavoriteColors(testRecommended);
    const { values: favoriteColors2 } = getFavoriteColors();

    // new unioned set should be one larger than before
    assert.ok(favoriteColors2.length === favoriteColorsBefore.length + 1);

    // 2 Should have same old value for existing favorite azure
    assert.ok(
      favoriteColors2.some(
        f =>
          f.name === azureBlue.name &&
          f.value === azureBlue.value &&
          f.value === newRecs.azureBlue.value,
      ),
    );
    // 2 Should have different value for existing favorite gatsby
    assert.ok(
      favoriteColors2.some(
        f =>
          f.name === gatsbyPurple.name &&
          f.value !== gatsbyPurple.value &&
          f.value === newRecs.gatsbyPurple.value,
      ),
    );
    // 2 Should have new key and value pair (yoda/green)
    assert.ok(
      favoriteColors2.some(
        f => f.name === newRecs.yodaGreen.name && f.value === newRecs.yodaGreen.value,
      ),
    );
  });
});

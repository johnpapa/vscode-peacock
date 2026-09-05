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
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('when adding recommended favorites', async () => {
    test('any removed ones are added back', async () => {
      const vueGreenName = 'Vue Green';
      // Start with starterSetOfFavorites, minus Vue

      // Remove 1 starterFaves (Vue green)
      const starter = starterSetOfFavorites.filter(item => item.name !== 'Vue Green');
      await updateFavoriteColors(starter);

      // Get the faves
      // we should not find Vue green
      const { values: favesWithoutVueGreen } = getFavoriteColors();
      assert.ok(!favesWithoutVueGreen.find(item => item.name === vueGreenName));

      // Now write the recommended favorites
      await executeCommand(Commands.addRecommendedFavorites);

      // Get the faves
      const { values: faves } = getFavoriteColors();

      // we should have the 1 that was removed
      assert.ok(faves.find(item => item.name === vueGreenName));
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

    const vueGreen = favoriteColorsBefore.find(item => item.name === 'Vue Green') || {
      name: '',
      value: '',
    };

    const azureBlue = favoriteColorsBefore.find(item => item.name === 'Azure Blue') || {
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
      vueGreen: {
        name: 'Vue Green', // same key
        value: 'lightgreen', // new value
      },
    };

    const testRecommended = [newRecs.vueGreen, newRecs.azureBlue, newRecs.yodaGreen];

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
    // 2 Should have different value for existing favorite Vue Green
    console.log(vueGreen.name);
    console.log(vueGreen.value);
    console.log(newRecs.vueGreen.value);
    assert.ok(
      favoriteColors2.some(
        f =>
          f.name === vueGreen.name &&
          f.value !== vueGreen.value &&
          f.value === newRecs.vueGreen.value,
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

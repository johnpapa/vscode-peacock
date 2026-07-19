import * as assert from 'assert';
import { IPeacockSettings } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { getFavoriteColors, writeRecommendedFavoriteColors } from '../../configuration';

suite('Save starter favorite colors', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

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

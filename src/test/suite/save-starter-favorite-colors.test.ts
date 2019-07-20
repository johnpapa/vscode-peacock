import * as assert from 'assert';
import { IPeacockSettings } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { getFavoriteColors, writeRecommendedFavoriteColors } from '../../configuration';

suite('Save starter favorite colors', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('with valid name', async () => {
    // started with:
    // starterSetOfFavorites;

    const { values: favoriteColors1 } = getFavoriteColors();

    let gatsbyPurple = favoriteColors1.find(item => item.name === 'Gatsby Purple') || {
      name: '',
      value: '',
    };

    let azureBlue = favoriteColors1.find(item => item.name === 'Azure Blue') || {
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

    await writeRecommendedFavoriteColors(testRecommended);
    const { values: favoriteColors2 } = getFavoriteColors();

    assert.ok(favoriteColors2.length === favoriteColors1.length + 1); // new unioned set

    // 2 Should have same old value for existing favorite azure
    assert.ok(
      favoriteColors2.some(
        f => f.name === azureBlue.name && f.value === azureBlue.value && f.value === newRecs.azureBlue.value,
      ),
    );
    // 2 Should have different value for existing favorite gatsby
    assert.ok(
      favoriteColors2.some(
        f => f.name === gatsbyPurple.name && f.value !== gatsbyPurple.value && f.value === newRecs.gatsbyPurple.value,
      ),
    );
    // 2 Should have new key and value pair (yoda/green)
    assert.ok(favoriteColors2.some(f => f.name === newRecs.yodaGreen.name && f.value === newRecs.yodaGreen.value));
  });
});

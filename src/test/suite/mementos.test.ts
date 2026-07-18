import * as assert from 'assert';
import { State } from '../../models';
import {
  getFavoritesVersionGlobalMemento,
  getSurpriseMeFavoritesOrderIndexGlobalMemento,
  getSurpriseMeFavoritesOrderKeyGlobalMemento,
  getSurpriseMeStartupSelectionsGlobalMemento,
  resetFavoritesVersionMemento,
  saveFavoritesVersionGlobalMemento,
  saveSurpriseMeFavoritesOrderGlobalMemento,
  saveSurpriseMeStartupSelectionGlobalMemento,
} from '../../mementos';

suite('Mementos', () => {
  test('supports surprise-order mementos before extension context is initialized', async () => {
    const originalContext = (State as any)._extContext;

    try {
      (State as any)._extContext = undefined;
      await resetFavoritesVersionMemento();

      await saveFavoritesVersionGlobalMemento('4.2.6');
      await saveSurpriseMeFavoritesOrderGlobalMemento(2, 'one:#111|two:#222');
      await saveSurpriseMeStartupSelectionGlobalMemento('workspaceFolder:file:///repo', '#123456');

      assert.equal(getFavoritesVersionGlobalMemento(), '4.2.6');
      assert.equal(getSurpriseMeFavoritesOrderIndexGlobalMemento(), 2);
      assert.equal(getSurpriseMeFavoritesOrderKeyGlobalMemento(), 'one:#111|two:#222');
      assert.deepEqual(getSurpriseMeStartupSelectionsGlobalMemento(), {
        'workspaceFolder:file:///repo': '#123456',
      });

      await resetFavoritesVersionMemento();

      assert.equal(getFavoritesVersionGlobalMemento(), '');
      assert.equal(getSurpriseMeFavoritesOrderIndexGlobalMemento(), -1);
      assert.equal(getSurpriseMeFavoritesOrderKeyGlobalMemento(), '');
      assert.deepEqual(getSurpriseMeStartupSelectionsGlobalMemento(), {});
    } finally {
      (State as any)._extContext = originalContext;
    }
  });
});

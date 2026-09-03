import * as assert from 'assert';
import { State } from '../../models';
import {
  getFavoritesVersionGlobalMemento,
  getCssInjectionConsentGlobalMemento,
  getCssProfilesGlobalMemento,
  getCssStylesheetPathsGlobalMemento,
  getCssWorkspaceOverridesGlobalMemento,
  getSurpriseMeFavoritesOrderIndexGlobalMemento,
  getSurpriseMeFavoritesOrderKeyGlobalMemento,
  getSurpriseMeStartupSelectionsGlobalMemento,
  resetFavoritesVersionMemento,
  saveFavoritesVersionGlobalMemento,
  saveCssInjectionConsentGlobalMemento,
  saveCssProfilesGlobalMemento,
  saveCssStylesheetPathGlobalMemento,
  saveCssWorkspaceOverrideGlobalMemento,
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
      await saveCssInjectionConsentGlobalMemento(true);
      await saveCssStylesheetPathGlobalMemento('Code:/app', '/app/workbench.desktop.main.css');
      await saveCssWorkspaceOverrideGlobalMemento('workspaceFolder:/repo', {
        color: '#007fff',
        sideBarBackground: '#001122',
      });
      await saveCssProfilesGlobalMemento({
        abcdef0123456789: {
          id: 'abcdef0123456789',
          color: '#007fff',
          variables: { '--vscode-statusBar-background': '#007fff' },
          lastUsed: 1,
        },
      });

      assert.equal(getFavoritesVersionGlobalMemento(), '4.2.6');
      assert.equal(getSurpriseMeFavoritesOrderIndexGlobalMemento(), 2);
      assert.equal(getSurpriseMeFavoritesOrderKeyGlobalMemento(), 'one:#111|two:#222');
      assert.deepEqual(getSurpriseMeStartupSelectionsGlobalMemento(), {
        'workspaceFolder:file:///repo': '#123456',
      });
      assert.equal(getCssInjectionConsentGlobalMemento(), true);
      assert.deepEqual(getCssStylesheetPathsGlobalMemento(), {
        'Code:/app': '/app/workbench.desktop.main.css',
      });
      assert.deepEqual(getCssWorkspaceOverridesGlobalMemento(), {
        'workspaceFolder:/repo': { color: '#007fff', sideBarBackground: '#001122' },
      });
      assert.equal(getCssProfilesGlobalMemento().abcdef0123456789.color, '#007fff');

      await resetFavoritesVersionMemento();

      assert.equal(getFavoritesVersionGlobalMemento(), '');
      assert.equal(getSurpriseMeFavoritesOrderIndexGlobalMemento(), -1);
      assert.equal(getSurpriseMeFavoritesOrderKeyGlobalMemento(), '');
      assert.deepEqual(getSurpriseMeStartupSelectionsGlobalMemento(), {});
      assert.equal(getCssInjectionConsentGlobalMemento(), false);
      assert.deepEqual(getCssProfilesGlobalMemento(), {});
      assert.deepEqual(getCssStylesheetPathsGlobalMemento(), {});
      assert.deepEqual(getCssWorkspaceOverridesGlobalMemento(), {});
    } finally {
      (State as any)._extContext = originalContext;
    }
  });
});

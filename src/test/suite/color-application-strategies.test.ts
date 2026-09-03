import * as assert from 'assert';

import {
  IColorPersistence,
  IColorRenderer,
  captureColorRenderState,
  clearWorkspaceColorSettings,
  configureColorApplication,
  getRenderedSideBarBackground,
  resetColorApplicationForTests,
  restoreColorRenderState,
  updateColorSetting,
  updateRenderedSideBarBackground,
} from '../../apply-color';

suite('Color application strategies', () => {
  teardown(() => resetColorApplicationForTests());

  test('routes persistence and renderer-specific operations through configured strategies', async () => {
    const calls: string[] = [];
    const renderer: IColorRenderer = {
      async apply(color) {
        calls.push(`apply:${color}`);
        return color;
      },
      async unapply() {
        calls.push('unapply');
      },
      async capture() {
        calls.push('capture');
        return 'captured';
      },
      async restore(state) {
        calls.push(`restore:${state}`);
      },
      getSideBarBackground() {
        calls.push('getSideBar');
        return '#111111';
      },
      async updateSideBarBackground(color) {
        calls.push(`sideBar:${color}`);
      },
    };
    const persistence: IColorPersistence = {
      async save(color) {
        calls.push(`save:${color}`);
      },
      async clearWorkspace() {
        calls.push('clear');
      },
    };
    configureColorApplication(renderer, persistence);

    await updateColorSetting('#007fff');
    await clearWorkspaceColorSettings();
    assert.equal(getRenderedSideBarBackground(), '#111111');
    await updateRenderedSideBarBackground('#222222');
    const captured = await captureColorRenderState();
    await restoreColorRenderState(captured);

    assert.deepEqual(calls, [
      'save:#007fff',
      'clear',
      'getSideBar',
      'sideBar:#222222',
      'capture',
      'restore:captured',
    ]);
  });
});

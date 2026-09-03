import * as assert from 'assert';

import {
  IColorPersistence,
  IColorRenderer,
  applyColor,
  applyTransientColor,
  captureColorRenderState,
  clearWorkspaceColorSettings,
  configureColorApplication,
  getCurrentColor,
  getRenderedColor,
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
      async apply(color, options) {
        calls.push(`apply:${color}:${options?.transient ? 'transient' : 'normal'}`);
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
      getAppliedColor() {
        calls.push('getApplied');
        return '#007fff';
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
      getCurrent() {
        calls.push('getCurrent');
        return '#007fff';
      },
    };
    configureColorApplication(renderer, persistence);

    await applyColor('#007fff');
    await applyTransientColor('#ff0000');
    await updateColorSetting('#007fff');
    await clearWorkspaceColorSettings();
    assert.equal(getCurrentColor(), '#007fff');
    assert.equal(getRenderedColor(), '#007fff');
    assert.equal(getRenderedSideBarBackground(), '#111111');
    await updateRenderedSideBarBackground('#222222');
    const captured = await captureColorRenderState();
    await restoreColorRenderState(captured);

    assert.deepEqual(calls, [
      'apply:#007fff:normal',
      'apply:#ff0000:transient',
      'save:#007fff',
      'clear',
      'getCurrent',
      'getApplied',
      'getSideBar',
      'sideBar:#222222',
      'capture',
      'restore:captured',
    ]);
  });
});

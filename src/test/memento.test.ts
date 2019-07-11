import * as assert from 'assert';
import { IPeacockSettings, Commands, peacockMementos } from '../models';
import {
  setupTestSuite,
  teardownTestSuite,
  setupTest
} from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { ExtensionContext } from 'vscode';
import { peacockVslsMementos } from '../live-share/constants';
import { peacockRemoteMementos } from '../remote/constants';

suite('Mementos', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('resetting mementos makes them undefined', async () => {
    const ec = await executeCommand<ExtensionContext>(Commands.resetColors);

    let memento: any;

    // Global
    memento = ec!.globalState.get(peacockMementos.favoritesVersion);
    assert.ok(!memento);

    memento = ec!.globalState.get(peacockVslsMementos.vslsJoinColor);
    assert.ok(!memento);

    memento = ec!.globalState.get(peacockVslsMementos.vslsShareColor);
    assert.ok(!memento);

    memento = ec!.globalState.get(peacockRemoteMementos.remoteContainersColor);
    assert.ok(!memento);

    memento = ec!.globalState.get(peacockRemoteMementos.remoteSshColor);
    assert.ok(!memento);

    memento = ec!.globalState.get(peacockRemoteMementos.remoteWslColor);
    assert.ok(!memento);

    // Workspace
    memento = ec!.globalState.get(peacockMementos.peacockColor);
    assert.ok(!memento);
  });
});

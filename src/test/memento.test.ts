import * as assert from 'assert';
import { IPeacockSettings, Commands, peacockMementos, State } from '../models';
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

  let mementos: any;

  suiteSetup(() => {
    // Save the mementos

    const ec = State.extensionContext;

    // Global
    mementos[peacockMementos.favoritesVersion] = ec!.globalState.get(
      peacockMementos.favoritesVersion
    );

    mementos[peacockVslsMementos.vslsJoinColor] = ec!.globalState.get(
      peacockVslsMementos.vslsJoinColor
    );

    mementos[peacockVslsMementos.vslsShareColor] = ec!.globalState.get(
      peacockVslsMementos.vslsShareColor
    );

    mementos[peacockRemoteMementos.remoteContainersColor] = ec!.globalState.get(
      peacockRemoteMementos.remoteContainersColor
    );

    mementos[peacockRemoteMementos.remoteSshColor] = ec!.globalState.get(
      peacockRemoteMementos.remoteSshColor
    );

    mementos[peacockRemoteMementos.remoteWslColor] = ec!.globalState.get(
      peacockRemoteMementos.remoteWslColor
    );

    // Workspace
    mementos[peacockMementos.peacockColor] = ec!.globalState.get(
      peacockMementos.peacockColor
    );
  });

  suiteTeardown(async () => {
    // Put back the mementos

    const ec = State.extensionContext;

    // Global
    await ec!.globalState.update(
      peacockMementos.favoritesVersion,
      mementos[peacockMementos.favoritesVersion]
    );

    await ec!.globalState.update(
      peacockVslsMementos.vslsJoinColor,
      mementos[peacockVslsMementos.vslsJoinColor]
    );

    await ec!.globalState.update(
      peacockVslsMementos.vslsShareColor,
      mementos[peacockVslsMementos.vslsShareColor]
    );

    await ec!.globalState.update(
      peacockRemoteMementos.remoteContainersColor,
      mementos[peacockRemoteMementos.remoteContainersColor]
    );

    await ec!.globalState.update(
      peacockRemoteMementos.remoteSshColor,
      mementos[peacockRemoteMementos.remoteSshColor]
    );

    await ec!.globalState.update(
      peacockRemoteMementos.remoteWslColor,
      mementos[peacockRemoteMementos.remoteWslColor]
    );

    // Workspace
    await ec!.globalState.update(
      peacockMementos.peacockColor,
      mementos[peacockMementos.peacockColor]
    );
  });

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

import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { Commands } from '../../models';
import { executeCommand } from './lib/constants';

suite('Set SideBar Darkness Level Command', () => {
  let quickPickStub: sinon.SinonStub;

  setup(() => {
    // Stub showQuickPick to simulate user selection
    quickPickStub = sinon.stub(vscode.window, 'showQuickPick');
  });

  teardown(() => {
    quickPickStub.restore();
  });
  test('sets sidebar background to Dark', async () => {
    quickPickStub.returns(Promise.resolve('Dark'));
    await executeCommand(Commands.affectSideBarBackground);

    const config = vscode.workspace.getConfiguration('workbench');
    const colorCustomizations = config.get<any>('colorCustomizations') || {};
    assert.ok(colorCustomizations['sideBar.background'], 'sideBar.background should be set');
  });

  test('sets sidebar background to Dark, Darker, and Darkest', async () => {
    // Set a known Peacock color first
    const peacockColor = '#00aaff';
    await vscode.workspace
      .getConfiguration('peacock')
      .update('color', peacockColor, vscode.ConfigurationTarget.Workspace);

    // Test "Dark"
    quickPickStub.returns(Promise.resolve('Dark'));
    await executeCommand(Commands.affectSideBarBackground);
    let colorCustomizations =
      vscode.workspace.getConfiguration('workbench').get<any>('colorCustomizations') || {};
    const dark = colorCustomizations['sideBar.background'];

    // Test "Darker"
    quickPickStub.returns(Promise.resolve('Darker'));
    await executeCommand(Commands.affectSideBarBackground);
    colorCustomizations =
      vscode.workspace.getConfiguration('workbench').get<any>('colorCustomizations') || {};
    const darker = colorCustomizations['sideBar.background'];
    quickPickStub.returns(Promise.resolve('Darkest'));
    await executeCommand(Commands.affectSideBarBackground);
    colorCustomizations =
      vscode.workspace.getConfiguration('workbench').get<any>('colorCustomizations') || {};
    const darkest = colorCustomizations['sideBar.background'];

    assert.ok(dark, 'Dark should set a color');
    assert.ok(darker, 'Darker should set a color');
    assert.ok(darkest, 'Darkest should set a color');
    assert.notStrictEqual(dark, darker, 'Dark and Darker should be different');
    assert.notStrictEqual(darker, darkest, 'Darker and Darkest should be different');
    assert.notStrictEqual(dark, darkest, 'Dark and Darkest should be different');
  });

  test('removes sidebar background color', async () => {
    // First set a color so we can remove it
    quickPickStub.returns(Promise.resolve('Dark'));
    await executeCommand(Commands.affectSideBarBackground);

    quickPickStub.returns(Promise.resolve('Remove Side Bar Color'));
    await executeCommand(Commands.affectSideBarBackground);

    const config = vscode.workspace.getConfiguration('workbench');
    const colorCustomizations = config.get<any>('colorCustomizations') || {};
    assert.ok(!colorCustomizations['sideBar.background'], 'sideBar.background should be removed');
  });
});

// import * as vscode from 'vscode';
// import * as sinon from 'sinon';
// import * as assert from 'assert';
// import { IPeacockSettings, Commands, docsUri } from '../../models';
// import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
// import { executeCommand } from './lib/constants';

// suite('Documentation Tests', () => {
//   let originalValues = <IPeacockSettings>{};

//   suiteSetup(async () => await setupTestSuite(originalValues));
//   suiteTeardown(async () => await teardownTestSuite(originalValues));
//   setup(async () => await setupTest());

//   suiteSetup(() => {});

//   test('can open documentation web site in a browser', async () => {
//     const openExternalStub = sinon.stub(vscode.env, 'openExternal').callThrough();

//     // Call the function to test.
//     await executeCommand(Commands.showDocumentation);

//     // Ensure it attempted to open the browser.
//     assert.ok(openExternalStub.calledOnce);
//     assert.ok(openExternalStub.calledOnceWithExactly(docsUri), 'wrong Uri was opened');
//     const wrongUri = vscode.Uri.parse('https://google.com');
//     assert.ok(!openExternalStub.calledOnceWithExactly(wrongUri));
//   });
// });

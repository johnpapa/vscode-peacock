import * as assert from 'assert';
import * as vscode from 'vscode';

import {
  canonicalizeWorkspaceAddress,
  createWorkspaceIdentity,
  matchWorkspaceColor,
  resolveWorkspaceColor,
} from '../../configuration';

suite('Workspace color resolution', () => {
  test('normalizes local paths and file URIs without basename matching', () => {
    const identity = createWorkspaceIdentity(undefined, [
      { uri: vscode.Uri.file('/Users/example/projects/peacock') },
    ]);

    assert.ok(identity);
    assert.equal(
      identity?.address,
      canonicalizeWorkspaceAddress('file:///Users/example/projects/peacock/'),
    );
    assert.equal(canonicalizeWorkspaceAddress('peacock'), undefined);
  });

  test('normalizes Windows paths case-insensitively', () => {
    assert.equal(
      canonicalizeWorkspaceAddress('C:\\Users\\Example\\Project\\'),
      canonicalizeWorkspaceAddress('c:/users/example/project'),
    );
  });

  test('uses a saved workspace file instead of its member folders', () => {
    const identity = createWorkspaceIdentity(vscode.Uri.file('/tmp/example.code-workspace'), [
      { uri: vscode.Uri.file('/tmp/member-one') },
      { uri: vscode.Uri.file('/tmp/member-two') },
    ]);

    assert.equal(identity?.kind, 'workspaceFile');
    assert.equal(identity?.address, canonicalizeWorkspaceAddress('/tmp/example.code-workspace'));
  });

  test('does not assign a stable identity to an untitled multi-root workspace', () => {
    const identity = createWorkspaceIdentity(vscode.Uri.parse('untitled:workspace'), [
      { uri: vscode.Uri.file('/tmp/member-one') },
      { uri: vscode.Uri.file('/tmp/member-two') },
    ]);

    assert.equal(identity, undefined);
  });

  test('requires the authority for remote workspace URIs', () => {
    assert.equal(canonicalizeWorkspaceAddress('vscode-remote:///project'), undefined);
    assert.equal(
      canonicalizeWorkspaceAddress('vscode-remote://SSH-REMOTE+Example/project/'),
      'vscode-remote://ssh-remote+example/project',
    );
  });

  test('matches any exact path alias and normalizes named colors', () => {
    const identity = createWorkspaceIdentity(undefined, [{ uri: vscode.Uri.file('/tmp/project') }]);
    const result = matchWorkspaceColor(identity, {
      project: { path: ['/old/project', '/tmp/project'], color: 'rebeccapurple' },
    });

    assert.equal(result.name, 'project');
    assert.equal(result.color, '#663399');
  });

  test('reports invalid and ambiguous definitions without selecting one', () => {
    const identity = createWorkspaceIdentity(undefined, [{ uri: vscode.Uri.file('/tmp/project') }]);
    const result = matchWorkspaceColor(identity, {
      incomplete: { color: '#ff0000' },
      invalidColor: { path: ['/tmp/project'], color: 'not-a-color' },
      first: { path: ['/tmp/project'], color: '#ff0000' },
      second: { path: ['/tmp/project'], color: '#00ff00' },
    });

    assert.deepEqual(result.invalidNames.sort(), ['incomplete', 'invalidColor']);
    assert.deepEqual(result.ambiguousNames, ['first', 'second']);
    assert.equal(result.color, undefined);
  });

  test('resolves transient, private, mapped, and legacy colors in order', () => {
    const identity = createWorkspaceIdentity(undefined, [{ uri: vscode.Uri.file('/tmp/project') }]);
    const workspaces = { mapped: { path: ['/tmp/project'], color: '#333333' } };

    assert.equal(
      resolveWorkspaceColor({
        identity,
        workspaces,
        transientColor: '#111111',
        privateColor: '#222222',
        legacyColor: '#444444',
      }).source,
      'transient',
    );
    assert.equal(
      resolveWorkspaceColor({
        identity,
        workspaces,
        privateColor: '#222222',
        legacyColor: '#444444',
      }).source,
      'private',
    );
    assert.equal(
      resolveWorkspaceColor({ identity, workspaces, legacyColor: '#444444' }).source,
      'workspaceMap',
    );
    assert.equal(resolveWorkspaceColor({ identity, legacyColor: '#444444' }).source, 'legacy');
    assert.equal(resolveWorkspaceColor({ identity }).source, 'none');
  });

  test('falls through to legacy color for an ambiguous map', () => {
    const identity = createWorkspaceIdentity(undefined, [{ uri: vscode.Uri.file('/tmp/project') }]);
    const result = resolveWorkspaceColor({
      identity,
      workspaces: {
        first: { path: ['/tmp/project'], color: '#ff0000' },
        second: { path: ['/tmp/project'], color: '#00ff00' },
      },
      legacyColor: '#007fff',
    });

    assert.equal(result.source, 'legacy');
    assert.equal(result.color, '#007fff');
    assert.deepEqual(result.ambiguousNames, ['first', 'second']);
  });
});

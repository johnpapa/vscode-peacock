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

  test('matches a saved multi-root workspace by its workspace file, not a member folder', () => {
    const folders = [
      { uri: vscode.Uri.file('/tmp/member-one') },
      { uri: vscode.Uri.file('/tmp/member-two') },
    ];
    const saved = createWorkspaceIdentity(vscode.Uri.file('/tmp/example.code-workspace'), folders);
    const match = matchWorkspaceColor(saved, {
      saved: { path: ['/tmp/example.code-workspace'], color: '#007fff' },
      member: { path: ['/tmp/member-one'], color: '#ff0000' },
    });

    assert.equal(match.name, 'saved');
    assert.equal(
      createWorkspaceIdentity(vscode.Uri.parse('untitled:workspace'), folders),
      undefined,
    );
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

  test('ignores invalid or ambiguous mappings and uses the legacy fallback', () => {
    const identity = createWorkspaceIdentity(undefined, [{ uri: vscode.Uri.file('/tmp/project') }]);
    const result = resolveWorkspaceColor({
      identity,
      workspaces: {
        incomplete: { color: '#ff0000' },
        invalidColor: { path: ['/tmp/project'], color: 'not-a-color' },
        first: { path: ['/tmp/project'], color: '#ff0000' },
        second: { path: ['/tmp/project'], color: '#00ff00' },
      },
      legacyColor: '#007fff',
    });

    assert.equal(result.source, 'legacy');
    assert.equal(result.color, '#007fff');
    assert.equal(result.invalidNames.length, 2);
    assert.equal(result.ambiguousNames.length, 2);
  });

  test('resolves transient, private, mapped, and legacy colors in order', () => {
    const identity = createWorkspaceIdentity(undefined, [{ uri: vscode.Uri.file('/tmp/project') }]);
    const workspaces = { mapped: { path: ['/tmp/project'], color: '#333333' } };

    const source = (transientColor?: string, privateColor?: string) =>
      resolveWorkspaceColor({
        identity,
        workspaces,
        transientColor,
        privateColor,
        legacyColor: '#444444',
      }).source;

    assert.equal(source('#111111', '#222222'), 'transient');
    assert.equal(source(undefined, '#222222'), 'private');
    assert.equal(source(), 'workspaceMap');
    assert.equal(resolveWorkspaceColor({ identity, legacyColor: '#444444' }).source, 'legacy');
    assert.equal(resolveWorkspaceColor({ identity }).source, 'none');
  });
});

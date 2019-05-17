#!/usr/bin/env node

const path = require('path');
const { fork } = require('child_process');

const testsPath = path.join(process.cwd(), 'out', 'live-share', 'test');

const child = fork('node_modules/vscode/bin/test', [], {
  env: {
    CODE_TESTS_PATH: testsPath
  },
  cwd: process.cwd()
});

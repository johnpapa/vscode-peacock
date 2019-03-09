//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import { IPeacockSettings } from '../models';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';

suite('Extension Tests', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);
});

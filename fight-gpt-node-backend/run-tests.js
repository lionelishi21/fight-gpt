#!/usr/bin/env node

/**
 * Custom test runner to work around Jest module resolution issues
 */

// Add the test-sequencer to the require cache manually
const path = require('path');
const testSequencerPath = path.join(__dirname, 'node_modules', '@jest', 'test-sequencer', 'build', 'index.js');

try {
  require.resolve(testSequencerPath);
  require.cache[require.resolve('@jest/test-sequencer')] = {
    id: require.resolve('@jest/test-sequencer'),
    exports: require(testSequencerPath),
    loaded: true,
  };
} catch (e) {
  // If manual resolution fails, try to require it normally
  try {
    require('@jest/test-sequencer');
  } catch (e2) {
    console.error('Warning: Could not load @jest/test-sequencer');
  }
}

// Now run jest
require('jest/bin/jest');

#!/usr/bin/env node

/**
 * Jest Wrapper Script
 * Workaround for @jest/test-sequencer module resolution issue
 */

const path = require('path');
const fs = require('fs');

// Manually resolve and cache the test-sequencer module before Jest loads
const testSequencerPath = path.join(__dirname, 'node_modules', '@jest', 'test-sequencer', 'build', 'index.js');

if (fs.existsSync(testSequencerPath)) {
  // Pre-load the module into require cache
  try {
    const testSequencer = require(testSequencerPath);
    // Cache it with the expected module name
    require.cache[require.resolve('@jest/test-sequencer')] = {
      id: require.resolve('@jest/test-sequencer'),
      exports: testSequencer,
      loaded: true,
      parent: module.parent,
      children: [],
      filename: testSequencerPath,
    };
  } catch (e) {
    console.warn('Warning: Could not pre-load test-sequencer:', e.message);
  }
}

// Set NODE_PATH
process.env.NODE_PATH = path.join(__dirname, 'node_modules');
require('module')._initPaths();

// Now run jest
require('jest/bin/jest');

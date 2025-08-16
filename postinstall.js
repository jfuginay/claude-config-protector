#!/usr/bin/env node

/**
 * Post-install script for claude-config-protector
 * Runs after npm install to provide instructions
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('\n🛡️  Claude Config Protector installed successfully!\n');
console.log('Quick Start:');
console.log('  claude-config-protector start   # Start protection');
console.log('  ccp status                      # Check status');
console.log('  ccp fix                         # Fix corrupted config\n');

// Check if config needs fixing
const configPath = path.join(os.homedir(), '.claude.json');
if (fs.existsSync(configPath)) {
  const stats = fs.statSync(configPath);
  const sizeMB = stats.size / 1024 / 1024;
  
  if (sizeMB > 5) {
    console.log(`⚠️  Your config file is ${sizeMB.toFixed(2)}MB (danger zone!)`);
    console.log('   Run: ccp fix');
    console.log('   Then: ccp start\n');
  } else {
    console.log('To start automatic protection:');
    console.log('  ccp start\n');
  }
} else {
  console.log('No Claude config found. Protection will start when Claude Code creates one.\n');
}

console.log('For help: ccp help');
console.log('Docs: https://github.com/jfuginay/claude-config-protector\n');
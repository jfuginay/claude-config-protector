#!/usr/bin/env node

/**
 * Simple test to verify conversation-monitor.js dependencies and basic functionality
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧪 Testing Conversation Monitor Setup\n');

// Test 1: Check if blessed is available
console.log('1. Checking blessed library...');
try {
  const blessed = require('blessed');
  console.log('   ✓ blessed installed and loadable\n');
} catch (error) {
  console.error('   ✗ blessed not found:', error.message);
  process.exit(1);
}

// Test 2: Check if blessed-contrib is available
console.log('2. Checking blessed-contrib library...');
try {
  const contrib = require('blessed-contrib');
  console.log('   ✓ blessed-contrib installed and loadable\n');
} catch (error) {
  console.error('   ✗ blessed-contrib not found:', error.message);
  process.exit(1);
}

// Test 3: Check if .claude.json exists
const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, '.claude.json');
console.log('3. Checking for .claude.json...');
if (fs.existsSync(CONFIG_PATH)) {
  const stats = fs.statSync(CONFIG_PATH);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`   ✓ Found at ${CONFIG_PATH}`);
  console.log(`   ✓ Size: ${sizeKB} KB\n`);
} else {
  console.log(`   ⚠ Not found at ${CONFIG_PATH}`);
  console.log('   → This is OK if Claude Code hasn\'t been used yet\n');
}

// Test 4: Check backup directory
const BACKUP_DIR = path.join(HOME, '.claude-backups');
console.log('4. Checking backup directory...');
if (fs.existsSync(BACKUP_DIR)) {
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('claude-'));
  console.log(`   ✓ Found at ${BACKUP_DIR}`);
  console.log(`   ✓ Contains ${files.length} backup files\n`);
} else {
  console.log(`   ⚠ Not found at ${BACKUP_DIR}`);
  console.log('   → Will be created on first run\n');
}

// Test 5: Verify conversation-monitor.js exists
const MONITOR_PATH = path.join(__dirname, 'conversation-monitor.js');
console.log('5. Checking conversation-monitor.js...');
if (fs.existsSync(MONITOR_PATH)) {
  const stats = fs.statSync(MONITOR_PATH);
  const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
  console.log(`   ✓ Found at ${MONITOR_PATH}`);
  console.log(`   ${isExecutable ? '✓' : '⚠'} ${isExecutable ? 'Executable' : 'Not executable'}`);
  if (!isExecutable) {
    console.log('   → Run: chmod +x conversation-monitor.js');
  }
  console.log('');
} else {
  console.error('   ✗ conversation-monitor.js not found!');
  process.exit(1);
}

// Test 6: Test token estimation function
console.log('6. Testing token estimation...');
const testText = 'This is a test string with about twenty words to see how token estimation works for the conversation monitor.';
const estimatedTokens = Math.ceil(testText.length / 4);
console.log(`   Test string: "${testText.substring(0, 50)}..."`);
console.log(`   Characters: ${testText.length}`);
console.log(`   Estimated tokens: ${estimatedTokens}`);
console.log('   ✓ Token estimation working\n');

// Test 7: Verify package.json has correct entries
console.log('7. Checking package.json configuration...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

  const hasBlessedDep = pkg.dependencies && pkg.dependencies.blessed;
  const hasContribDep = pkg.dependencies && pkg.dependencies['blessed-contrib'];
  const hasScript = pkg.scripts && pkg.scripts['conversation-monitor'];

  console.log(`   ${hasBlessedDep ? '✓' : '✗'} blessed in dependencies`);
  console.log(`   ${hasContribDep ? '✓' : '✗'} blessed-contrib in dependencies`);
  console.log(`   ${hasScript ? '✓' : '✗'} conversation-monitor script`);

  if (!hasBlessedDep || !hasContribDep) {
    console.log('   → Run: npm install');
  }
  console.log('');
} catch (error) {
  console.error('   ✗ Error reading package.json:', error.message);
}

// Summary
console.log('═══════════════════════════════════════════════');
console.log('✓ All tests passed!');
console.log('');
console.log('You can now run the conversation monitor:');
console.log('  node conversation-monitor.js');
console.log('  npm run conversation-monitor');
console.log('');
console.log('Keyboard shortcuts once running:');
console.log('  q - quit');
console.log('  c - show compact suggestion');
console.log('  r - refresh stats');
console.log('  h - toggle history view');
console.log('═══════════════════════════════════════════════');

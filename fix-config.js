#!/usr/bin/env node

/**
 * Fix Claude Config - One-time fix for corrupted/large configs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, '.claude.json');
const BACKUP_DIR = path.join(HOME, '.claude-backups');

// Create backup dir if needed
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log('🔧 Claude Config Fixer');
console.log('======================\n');

if (!fs.existsSync(CONFIG_PATH)) {
  console.log('No config file found at:', CONFIG_PATH);
  console.log('Claude will create one when you run it.');
  process.exit(0);
}

// Backup current file
const backupPath = path.join(BACKUP_DIR, `claude-backup-${Date.now()}.json`);
console.log(`Backing up to: ${path.basename(backupPath)}`);
fs.copyFileSync(CONFIG_PATH, backupPath);

try {
  console.log('Reading config file...');
  const content = fs.readFileSync(CONFIG_PATH, 'utf8');
  
  console.log('Parsing JSON...');
  const config = JSON.parse(content);
  
  console.log('Cleaning up config...');
  
  // Keep only essential fields
  const cleanConfig = {
    numStartups: config.numStartups || 1,
    installMethod: config.installMethod || 'npm',
    autoUpdates: config.autoUpdates !== false,
    hasSeenTasksHint: config.hasSeenTasksHint || false,
    tipsHistory: {}, // Clear tips history - major space saver
    promptQueueUseCount: config.promptQueueUseCount || 0,
    userID: config.userID || require('crypto').randomBytes(32).toString('hex'),
    firstStartTime: config.firstStartTime || new Date().toISOString(),
    projects: {}
  };
  
  // Keep only essential project data
  if (config.projects) {
    for (const projectPath in config.projects) {
      // Only keep last 5 projects
      if (Object.keys(cleanConfig.projects).length >= 5) break;
      
      cleanConfig.projects[projectPath] = {
        allowedTools: config.projects[projectPath].allowedTools || [],
        // Keep only last 10 history items per project
        history: (config.projects[projectPath].history || []).slice(-10).map(h => {
          // Remove large fields from history
          if (typeof h === 'object') {
            return {
              display: h.display || '',
              timestamp: h.timestamp || new Date().toISOString()
            };
          }
          return h;
        })
      };
    }
  }
  
  // Write clean config atomically
  const tempPath = `${CONFIG_PATH}.fixed.${Date.now()}`;
  console.log('Writing cleaned config...');
  fs.writeFileSync(tempPath, JSON.stringify(cleanConfig, null, 2));
  
  // Verify it's valid
  JSON.parse(fs.readFileSync(tempPath, 'utf8'));
  
  // Rename atomically
  fs.renameSync(tempPath, CONFIG_PATH);
  
  const oldSize = fs.statSync(backupPath).size;
  const newSize = fs.statSync(CONFIG_PATH).size;
  
  console.log('\n✅ Success!');
  console.log(`Old size: ${(oldSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`New size: ${(newSize / 1024).toFixed(2)}KB`);
  console.log(`Reduction: ${((1 - newSize/oldSize) * 100).toFixed(1)}%`);
  console.log(`\nBackup saved: ${path.basename(backupPath)}`);
  
} catch (error) {
  console.error('\n❌ Failed to fix config:', error.message);
  console.log('\nCreating minimal new config...');
  
  const minimalConfig = {
    numStartups: 1,
    installMethod: 'npm',
    autoUpdates: true,
    hasSeenTasksHint: false,
    tipsHistory: {},
    promptQueueUseCount: 0,
    userID: require('crypto').randomBytes(32).toString('hex'),
    firstStartTime: new Date().toISOString(),
    projects: {}
  };
  
  const tempPath = `${CONFIG_PATH}.new.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(minimalConfig, null, 2));
  fs.renameSync(tempPath, CONFIG_PATH);
  
  console.log('✅ Created new minimal config');
  console.log(`   Corrupted file backed up: ${path.basename(backupPath)}`);
}

console.log('\nYou can now start Claude Code normally.');
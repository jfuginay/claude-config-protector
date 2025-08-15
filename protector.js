#!/usr/bin/env node

/**
 * Claude Config Protector
 * 
 * Protects Claude Code's configuration file from corruption by:
 * - Monitoring file size and preventing unbounded growth
 * - Creating automatic backups before changes
 * - Implementing atomic writes
 * - Providing automatic recovery from corruption
 * 
 * Compatible with macOS, Linux, and Windows (via WSL)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Configuration
const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, '.claude.json');
const BACKUP_DIR = path.join(HOME, '.claude-backups');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit (well below 8MB corruption threshold)
const MAX_BACKUPS = 10;
const CHECK_INTERVAL = 5000; // Check every 5 seconds
const ENABLE_LOGGING = process.env.CLAUDE_PROTECTOR_DEBUG === 'true' || true;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Logging
const logFile = path.join(BACKUP_DIR, 'protector.log');
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (ENABLE_LOGGING) {
    console.log(logMessage);
  }
  
  // Also write to log file
  try {
    fs.appendFileSync(logFile, logMessage + '\n');
    
    // Rotate log if too large (>10MB)
    const stats = fs.statSync(logFile);
    if (stats.size > 10 * 1024 * 1024) {
      const archivePath = `${logFile}.${Date.now()}`;
      fs.renameSync(logFile, archivePath);
    }
  } catch (error) {
    // Ignore logging errors
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function isValidJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return true;
  } catch (error) {
    return false;
  }
}

function createBackup(reason = 'periodic') {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `claude-${timestamp}.json`);
  
  try {
    fs.copyFileSync(CONFIG_PATH, backupPath);
    log(`Created backup (${reason}): ${path.basename(backupPath)}`);
    rotateBackups();
    return backupPath;
  } catch (error) {
    log(`Failed to create backup: ${error.message}`, 'ERROR');
    return null;
  }
}

function rotateBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('claude-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // Keep only the most recent backups
    if (files.length > MAX_BACKUPS) {
      for (let i = MAX_BACKUPS; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
        log(`Removed old backup: ${files[i].name}`, 'DEBUG');
      }
    }
  } catch (error) {
    log(`Failed to rotate backups: ${error.message}`, 'ERROR');
  }
}

function findLatestValidBackup() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('claude-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    for (const file of files) {
      if (isValidJson(file.path)) {
        return file.path;
      }
    }
  } catch (error) {
    log(`Failed to find valid backup: ${error.message}`, 'ERROR');
  }
  return null;
}

function recoverFromBackup() {
  const validBackup = findLatestValidBackup();
  if (validBackup) {
    try {
      // Use atomic write for recovery
      const tempPath = `${CONFIG_PATH}.recovery.${Date.now()}`;
      fs.copyFileSync(validBackup, tempPath);
      fs.renameSync(tempPath, CONFIG_PATH);
      log(`Recovered from backup: ${path.basename(validBackup)}`, 'WARN');
      return true;
    } catch (error) {
      log(`Failed to recover from backup: ${error.message}`, 'ERROR');
    }
  }
  log('No valid backup found for recovery', 'ERROR');
  return false;
}

function aggressiveTruncate(config) {
  // Remove large data structures
  if (config.projects) {
    for (const projectPath in config.projects) {
      const project = config.projects[projectPath];
      
      // Keep only last 10 history items
      if (project.history && Array.isArray(project.history)) {
        project.history = project.history.slice(-10);
      }
      
      // Remove any cached data
      delete project.cache;
      delete project.analysis;
      delete project.ast;
    }
  }
  
  // Clear tips history
  if (config.tipsHistory) {
    const recentTips = {};
    const tips = Object.entries(config.tipsHistory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    for (const [key, value] of tips) {
      recentTips[key] = value;
    }
    config.tipsHistory = recentTips;
  }
  
  // Remove any test data
  delete config.testData;
  delete config.debug;
  delete config.temp;
  
  // Remove old sessions
  if (config.sessions && Array.isArray(config.sessions)) {
    config.sessions = config.sessions.slice(-10);
  }
  
  return config;
}

function truncateConfig() {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    let config = JSON.parse(content);
    
    // Aggressive truncation
    config = aggressiveTruncate(config);
    
    // Write truncated config atomically
    const tempPath = `${CONFIG_PATH}.truncate.${Date.now()}`;
    const truncated = JSON.stringify(config, null, 2);
    fs.writeFileSync(tempPath, truncated);
    
    // Verify it's valid
    JSON.parse(fs.readFileSync(tempPath, 'utf8'));
    
    // Atomic rename
    fs.renameSync(tempPath, CONFIG_PATH);
    
    const oldSize = content.length;
    const newSize = truncated.length;
    log(`Truncated config: ${(oldSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB`, 'INFO');
    return true;
  } catch (error) {
    log(`Failed to truncate config: ${error.message}`, 'ERROR');
    return false;
  }
}

let lastCheckTime = 0;
let lastBackupTime = 0;

function protectConfig() {
  // Throttle checks
  const now = Date.now();
  if (now - lastCheckTime < 1000) return;
  lastCheckTime = now;
  
  // Check if file exists
  if (!fs.existsSync(CONFIG_PATH)) {
    return;
  }
  
  const fileSize = getFileSize(CONFIG_PATH);
  
  // Check for corruption
  if (!isValidJson(CONFIG_PATH)) {
    log('⚠️  Config file is corrupted! Attempting recovery...', 'ERROR');
    createBackup('corruption');
    if (recoverFromBackup()) {
      log('✅ Successfully recovered from backup', 'INFO');
    } else {
      log('❌ No valid backup found. Claude will create a new config.', 'ERROR');
      // Move corrupted file out of the way
      const corruptPath = `${CONFIG_PATH}.corrupt.${Date.now()}`;
      try {
        fs.renameSync(CONFIG_PATH, corruptPath);
        log(`Moved corrupted file to: ${path.basename(corruptPath)}`, 'INFO');
      } catch (error) {
        log(`Failed to move corrupted file: ${error.message}`, 'ERROR');
      }
    }
    return;
  }
  
  // Check size and truncate if needed
  if (fileSize > MAX_SIZE) {
    log(`⚠️  Config file too large (${(fileSize / 1024 / 1024).toFixed(2)}MB). Truncating...`, 'WARN');
    createBackup('size-limit');
    if (truncateConfig()) {
      const newSize = getFileSize(CONFIG_PATH);
      log(`✅ Reduced size to ${(newSize / 1024 / 1024).toFixed(2)}MB`, 'INFO');
    }
    return;
  }
  
  // Create periodic backups of valid configs (every hour)
  if (now - lastBackupTime > 60 * 60 * 1000) {
    createBackup('periodic');
    lastBackupTime = now;
  }
}

function watchConfig() {
  // Use fs.watch for real-time monitoring
  let debounceTimer = null;
  
  try {
    fs.watch(CONFIG_PATH, (eventType, filename) => {
      // Debounce rapid changes
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (eventType === 'change') {
          protectConfig();
        }
      }, 1000);
    });
    log(`Watching ${CONFIG_PATH} for changes...`, 'INFO');
  } catch (error) {
    log(`Failed to watch config: ${error.message}`, 'ERROR');
  }
}

// Signal handlers for clean shutdown
process.on('SIGINT', () => {
  log('Shutting down Claude Config Protector...', 'INFO');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Shutting down Claude Config Protector...', 'INFO');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'ERROR');
  // Keep running
});

// Main execution
console.log('🛡️  Claude Config Protector v1.1.0');
console.log('====================================');
console.log(`Platform: ${os.platform()}`);
console.log(`Config: ${CONFIG_PATH}`);
console.log(`Max size: ${MAX_SIZE / 1024 / 1024}MB`);
console.log(`Backups: ${BACKUP_DIR}`);
console.log('');

// Initial check
protectConfig();

// Set up file watching
watchConfig();

// Periodic checks as fallback
setInterval(() => {
  protectConfig();
}, CHECK_INTERVAL);

log('Protection active. Press Ctrl+C to stop.', 'INFO');
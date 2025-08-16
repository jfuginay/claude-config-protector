#!/usr/bin/env node

/**
 * Claude Config Protector CLI
 * Command-line interface for managing Claude Code config protection
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const commands = {
  start: 'Start the config protector daemon',
  stop: 'Stop the config protector daemon',
  status: 'Check if protector is running',
  fix: 'Fix corrupted config file',
  backup: 'Create a manual backup',
  install: 'Install as system service',
  uninstall: 'Remove system service',
  help: 'Show this help message'
};

function showHelp() {
  console.log('🛡️  Claude Config Protector\n');
  console.log('Usage: claude-config-protector <command>\n');
  console.log('Commands:');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });
  console.log('\nShorthand: ccp <command>');
  console.log('\nExamples:');
  console.log('  claude-config-protector start    # Start protection');
  console.log('  ccp fix                          # Fix corrupted config');
  console.log('  ccp status                       # Check if running');
}

function isRunning() {
  try {
    const result = require('child_process')
      .execSync('ps aux | grep "[p]rotector.js" | grep -v grep', { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function startProtector() {
  if (isRunning()) {
    console.log('✅ Protector is already running');
    return;
  }

  const protectorPath = path.join(__dirname, 'protector.js');
  const logPath = path.join(os.homedir(), '.claude-backups', 'protector.log');
  
  // Ensure backup directory exists
  const backupDir = path.join(os.homedir(), '.claude-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Start detached process
  const child = spawn('node', [protectorPath], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore']
  });

  child.unref();
  
  console.log('🛡️  Claude Config Protector started');
  console.log(`📝 Logs: ${logPath}`);
}

function stopProtector() {
  if (!isRunning()) {
    console.log('⚠️  Protector is not running');
    return;
  }

  try {
    if (process.platform === 'darwin') {
      // macOS - check for Launch Agent first
      try {
        require('child_process').execSync(
          'launchctl list | grep com.claude.config.protector', 
          { stdio: 'ignore' }
        );
        // If found, unload it
        require('child_process').execSync(
          'launchctl unload ~/Library/LaunchAgents/com.claude.config.protector.plist',
          { stdio: 'inherit' }
        );
        console.log('✅ Stopped Launch Agent');
        return;
      } catch {
        // Not a Launch Agent, kill process directly
      }
    } else if (process.platform === 'linux') {
      // Linux - check for systemd service
      try {
        require('child_process').execSync(
          'systemctl --user status claude-protector',
          { stdio: 'ignore' }
        );
        // If found, stop it
        require('child_process').execSync(
          'systemctl --user stop claude-protector',
          { stdio: 'inherit' }
        );
        console.log('✅ Stopped systemd service');
        return;
      } catch {
        // Not a systemd service, kill process directly
      }
    }
    
    // Kill the process directly
    require('child_process').execSync('pkill -f protector.js');
    console.log('✅ Protector stopped');
  } catch (error) {
    console.error('❌ Failed to stop protector:', error.message);
  }
}

function checkStatus() {
  if (isRunning()) {
    console.log('✅ Protector is running');
    
    // Show config file status
    const configPath = path.join(os.homedir(), '.claude.json');
    if (fs.existsSync(configPath)) {
      const stats = fs.statSync(configPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`📊 Config size: ${sizeMB}MB`);
      
      // Check if valid JSON
      try {
        JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✅ Config is valid JSON');
      } catch {
        console.log('⚠️  Config may be corrupted');
      }
    }
    
    // Show backup count
    const backupDir = path.join(os.homedir(), '.claude-backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('claude-') && f.endsWith('.json'));
      console.log(`💾 Backups: ${backups.length}`);
    }
  } else {
    console.log('❌ Protector is not running');
    console.log('Run: claude-config-protector start');
  }
}

function fixConfig() {
  const fixScriptPath = path.join(__dirname, 'fix-config.js');
  require('child_process').spawn('node', [fixScriptPath], { stdio: 'inherit' });
}

function createBackup() {
  const configPath = path.join(os.homedir(), '.claude.json');
  const backupDir = path.join(os.homedir(), '.claude-backups');
  
  if (!fs.existsSync(configPath)) {
    console.log('⚠️  No config file found');
    return;
  }
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `claude-manual-${timestamp}.json`);
  
  try {
    fs.copyFileSync(configPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

function installService() {
  const installScriptPath = path.join(__dirname, 'install.sh');
  if (fs.existsSync(installScriptPath)) {
    require('child_process').spawn('bash', [installScriptPath], { stdio: 'inherit' });
  } else {
    console.log('⚠️  Install script not found, starting protector directly...');
    startProtector();
  }
}

function uninstallService() {
  stopProtector();
  
  if (process.platform === 'darwin') {
    const plistPath = path.join(os.homedir(), 'Library/LaunchAgents/com.claude.config.protector.plist');
    if (fs.existsSync(plistPath)) {
      fs.unlinkSync(plistPath);
      console.log('✅ Removed Launch Agent');
    }
  } else if (process.platform === 'linux') {
    const servicePath = path.join(os.homedir(), '.config/systemd/user/claude-protector.service');
    if (fs.existsSync(servicePath)) {
      require('child_process').execSync('systemctl --user disable claude-protector', { stdio: 'ignore' });
      fs.unlinkSync(servicePath);
      console.log('✅ Removed systemd service');
    }
  }
  
  console.log('✅ Uninstalled claude-config-protector');
}

// Main CLI logic
const command = process.argv[2];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else if (command === 'start') {
  startProtector();
} else if (command === 'stop') {
  stopProtector();
} else if (command === 'status') {
  checkStatus();
} else if (command === 'fix') {
  fixConfig();
} else if (command === 'backup') {
  createBackup();
} else if (command === 'install') {
  installService();
} else if (command === 'uninstall') {
  uninstallService();
} else {
  console.log(`❌ Unknown command: ${command}`);
  console.log('Run: claude-config-protector help');
  process.exit(1);
}
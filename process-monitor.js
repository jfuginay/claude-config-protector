#!/usr/bin/env node

/**
 * Claude Code Process Monitor
 *
 * Monitors background bash processes started by Claude Code and provides:
 * - Real-time dashboard of running processes
 * - Status tracking (running/completed/zombie)
 * - Resource usage monitoring (CPU, memory, age)
 * - Auto-cleanup capabilities for zombie processes
 * - Interactive Terminal UI with keyboard controls
 *
 * Usage:
 *   node process-monitor.js
 *
 * Keyboard shortcuts:
 *   q       - Quit
 *   k       - Kill selected process
 *   ↑/↓     - Navigate process list
 *   a       - Auto-cleanup zombie processes
 *   r       - Refresh view
 *   h       - Toggle help
 */

const { exec, execSync } = require('child_process');
const os = require('os');

// Check if blessed is available
let blessed, contrib;
try {
  blessed = require('blessed');
  try {
    contrib = require('blessed-contrib');
  } catch (e) {
    // blessed-contrib is optional
    contrib = null;
  }
} catch (e) {
  console.error('\n❌ Missing required dependency: blessed');
  console.error('\nPlease install it by running:');
  console.error('  npm install blessed blessed-contrib\n');
  console.error('Or in the project directory:');
  console.error('  cd /Users/iesouskurios/claude-config-protector');
  console.error('  npm install blessed blessed-contrib\n');
  process.exit(1);
}

// Configuration
const ZOMBIE_THRESHOLD = 300000; // 5 minutes
const OLD_THRESHOLD = 600000; // 10 minutes
const UPDATE_INTERVAL = 2000; // 2 seconds
const CLAUDE_PROCESS_PATTERN = /claude|bash.*claude/i;

// State
let selectedIndex = 0;
let processes = [];
let showHelp = false;
let lastUpdate = Date.now();
let stats = {
  total: 0,
  running: 0,
  zombie: 0,
  old: 0,
  totalCpu: 0,
  totalMem: 0
};

// Terminal UI setup
const screen = blessed.screen({
  smartCSR: true,
  title: 'Claude Code Process Monitor',
  fullUnicode: true
});

// Header box
const header = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'blue',
    border: {
      fg: 'cyan'
    }
  }
});

// Stats panel
const statsBox = blessed.box({
  top: 3,
  left: 0,
  width: '100%',
  height: 5,
  content: '',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'green'
    }
  },
  label: ' Process Statistics '
});

// Process list
const processList = blessed.list({
  top: 8,
  left: 0,
  width: '100%',
  height: '100%-13',
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: '█',
    style: {
      fg: 'cyan'
    }
  },
  border: {
    type: 'line'
  },
  style: {
    selected: {
      bg: 'blue',
      fg: 'white',
      bold: true
    },
    border: {
      fg: 'cyan'
    }
  },
  label: ' Background Processes (↑/↓ to navigate, k to kill, q to quit) '
});

// Footer/Help
const footer = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'yellow'
    }
  }
});

// Help overlay
const helpBox = blessed.box({
  top: 'center',
  left: 'center',
  width: '70%',
  height: '70%',
  content: '',
  tags: true,
  hidden: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'cyan'
    }
  },
  label: ' Help ',
  scrollable: true,
  keys: true,
  vi: true
});

// Add all elements to screen
screen.append(header);
screen.append(statsBox);
screen.append(processList);
screen.append(footer);
screen.append(helpBox);

// Parse process information from ps output
function parseProcesses(psOutput) {
  const lines = psOutput.trim().split('\n');
  const procs = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse ps aux format: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
    const parts = line.split(/\s+/);
    if (parts.length < 11) continue;

    const proc = {
      user: parts[0],
      pid: parts[1],
      cpu: parseFloat(parts[2]) || 0,
      mem: parseFloat(parts[3]) || 0,
      vsz: parseInt(parts[4]) || 0,
      rss: parseInt(parts[5]) || 0,
      tty: parts[6],
      stat: parts[7],
      start: parts[8],
      time: parts[9],
      command: parts.slice(10).join(' ')
    };

    // Filter for Claude-related bash processes
    if (proc.command.includes('bash') || proc.command.includes('sh')) {
      // Check if it's related to Claude Code
      // Look for processes with low CPU that might be background shells
      proc.age = estimateProcessAge(proc.start, proc.time);
      proc.status = determineStatus(proc);
      procs.push(proc);
    }
  }

  return procs;
}

// Estimate process age from start time
function estimateProcessAge(startTime, cpuTime) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parse start time (can be various formats: HH:MM, Mon DD, etc.)
  let ageMs = 0;

  if (startTime.includes(':')) {
    // Today - parse as time
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date(today);
    startDate.setHours(hours, minutes, 0, 0);
    ageMs = now - startDate;
    if (ageMs < 0) {
      // Process started yesterday
      ageMs += 24 * 60 * 60 * 1000;
    }
  } else {
    // Older - approximate as at least 1 day
    ageMs = 24 * 60 * 60 * 1000;
  }

  return ageMs;
}

// Determine process status
function determineStatus(proc) {
  // Check if process is a zombie (Z state)
  if (proc.stat.includes('Z')) {
    return 'zombie';
  }

  // Check if process is sleeping/idle for a long time
  if (proc.stat.includes('S') || proc.stat.includes('I')) {
    if (proc.cpu < 0.1 && proc.age > ZOMBIE_THRESHOLD) {
      return 'idle';
    }
  }

  // Check if process is old
  if (proc.age > OLD_THRESHOLD) {
    return 'old';
  }

  // Otherwise running/active
  if (proc.cpu > 1.0 || proc.stat.includes('R')) {
    return 'active';
  }

  return 'running';
}

// Format age for display
function formatAge(ageMs) {
  const seconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Format memory size
function formatMemory(kb) {
  if (kb > 1024 * 1024) {
    return `${(kb / 1024 / 1024).toFixed(1)}GB`;
  } else if (kb > 1024) {
    return `${(kb / 1024).toFixed(1)}MB`;
  }
  return `${kb}KB`;
}

// Get status color
function getStatusColor(status) {
  switch (status) {
    case 'active': return 'green';
    case 'running': return 'cyan';
    case 'old': return 'yellow';
    case 'idle': return 'magenta';
    case 'zombie': return 'red';
    default: return 'white';
  }
}

// Get status symbol
function getStatusSymbol(status) {
  switch (status) {
    case 'active': return '●';
    case 'running': return '○';
    case 'old': return '◐';
    case 'idle': return '◔';
    case 'zombie': return '✖';
    default: return '?';
  }
}

// Fetch process information
function fetchProcesses(callback) {
  exec('ps aux', (error, stdout, stderr) => {
    if (error) {
      callback(error, null);
      return;
    }

    try {
      const procs = parseProcesses(stdout);
      callback(null, procs);
    } catch (e) {
      callback(e, null);
    }
  });
}

// Update statistics
function updateStats(procs) {
  stats.total = procs.length;
  stats.running = 0;
  stats.zombie = 0;
  stats.old = 0;
  stats.totalCpu = 0;
  stats.totalMem = 0;

  procs.forEach(proc => {
    stats.totalCpu += proc.cpu;
    stats.totalMem += proc.rss;

    if (proc.status === 'zombie') {
      stats.zombie++;
    } else if (proc.status === 'old' || proc.status === 'idle') {
      stats.old++;
    } else {
      stats.running++;
    }
  });
}

// Update header
function updateHeader() {
  const now = new Date().toLocaleString();
  const uptime = Math.floor((Date.now() - lastUpdate) / 1000);

  header.setContent(
    '{center}{bold}Claude Code Process Monitor{/bold}{/center}\n' +
    `{center}${now} | Last update: ${uptime}s ago{/center}`
  );
}

// Update stats panel
function updateStatsPanel() {
  const memUsage = formatMemory(stats.totalMem);

  statsBox.setContent(
    `  {bold}Total Processes:{/bold} ${stats.total}  ` +
    `{green-fg}{bold}Running:{/bold} ${stats.running}{/green-fg}  ` +
    `{yellow-fg}{bold}Old:{/bold} ${stats.old}{/yellow-fg}  ` +
    `{red-fg}{bold}Zombie:{/bold} ${stats.zombie}{/red-fg}\n` +
    `  {bold}Total CPU:{/bold} ${stats.totalCpu.toFixed(1)}%  ` +
    `{bold}Total Memory:{/bold} ${memUsage}`
  );
}

// Update process list
function updateProcessList(procs) {
  const items = procs.map((proc, index) => {
    const color = getStatusColor(proc.status);
    const symbol = getStatusSymbol(proc.status);
    const age = formatAge(proc.age);
    const mem = formatMemory(proc.rss);
    const cmd = proc.command.length > 60 ? proc.command.substring(0, 57) + '...' : proc.command;

    return (
      `{${color}-fg}${symbol}{/${color}-fg} ` +
      `{bold}PID ${proc.pid}{/bold} ` +
      `CPU:${proc.cpu.toFixed(1)}% ` +
      `MEM:${mem} ` +
      `Age:${age} ` +
      `{${color}-fg}[${proc.status.toUpperCase()}]{/${color}-fg}\n` +
      `   ${cmd}`
    );
  });

  processList.setItems(items);
  if (selectedIndex < procs.length) {
    processList.select(selectedIndex);
  }
}

// Update footer
function updateFooter() {
  footer.setContent(
    '  {cyan-fg}[q]{/cyan-fg} Quit  ' +
    '{cyan-fg}[k]{/cyan-fg} Kill Process  ' +
    '{cyan-fg}[a]{/cyan-fg} Auto-cleanup  ' +
    '{cyan-fg}[r]{/cyan-fg} Refresh  ' +
    '{cyan-fg}[h]{/cyan-fg} Help'
  );
}

// Update help overlay
function updateHelp() {
  helpBox.setContent(
    '\n  {bold}{cyan-fg}Claude Code Process Monitor - Help{/cyan-fg}{/bold}\n\n' +
    '  {bold}Navigation:{/bold}\n' +
    '    ↑/k       - Move up in process list\n' +
    '    ↓/j       - Move down in process list\n' +
    '    PgUp      - Page up\n' +
    '    PgDn      - Page down\n\n' +
    '  {bold}Actions:{/bold}\n' +
    '    k         - Kill selected process\n' +
    '    a         - Auto-cleanup zombie/idle processes\n' +
    '    r         - Refresh process list\n' +
    '    h         - Toggle this help\n' +
    '    q/Esc     - Quit\n\n' +
    '  {bold}Process Status:{/bold}\n' +
    '    {green-fg}● ACTIVE{/green-fg}   - High CPU usage, actively running\n' +
    '    {cyan-fg}○ RUNNING{/cyan-fg}  - Normal operation\n' +
    '    {yellow-fg}◐ OLD{/yellow-fg}     - Running for >10 minutes\n' +
    '    {magenta-fg}◔ IDLE{/magenta-fg}    - Low CPU, may be stuck\n' +
    '    {red-fg}✖ ZOMBIE{/red-fg}   - Dead process (needs cleanup)\n\n' +
    '  {bold}Thresholds:{/bold}\n' +
    '    Old process:    >10 minutes\n' +
    '    Zombie detect:  >5 minutes idle\n\n' +
    '  {bold}Auto-cleanup:{/bold}\n' +
    '    Automatically kills processes marked as ZOMBIE or\n' +
    '    IDLE to free up system resources.\n\n' +
    '  Press {cyan-fg}h{/cyan-fg} or {cyan-fg}Esc{/cyan-fg} to close this help.'
  );
}

// Main update function
function update() {
  fetchProcesses((error, procs) => {
    if (error) {
      // Show error in stats box
      statsBox.setContent(`{red-fg}{bold}Error fetching processes:{/bold} ${error.message}{/red-fg}`);
      screen.render();
      return;
    }

    processes = procs;
    updateStats(procs);
    updateHeader();
    updateStatsPanel();
    updateProcessList(procs);
    updateFooter();

    lastUpdate = Date.now();
    screen.render();
  });
}

// Kill process
function killProcess(pid, signal = 'SIGTERM') {
  try {
    process.kill(pid, signal);
    return true;
  } catch (e) {
    return false;
  }
}

// Auto-cleanup zombie/idle processes
function autoCleanup() {
  const toClean = processes.filter(p => p.status === 'zombie' || p.status === 'idle');

  if (toClean.length === 0) {
    showMessage('No zombie or idle processes to clean up');
    return;
  }

  // Confirm with user
  const msg = blessed.question({
    top: 'center',
    left: 'center',
    width: '50%',
    height: 'shrink',
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'yellow'
      }
    },
    label: ' Confirm Cleanup '
  });

  screen.append(msg);
  msg.ask(
    `Found ${toClean.length} processes to clean up.\n` +
    `Kill them all? (y/n)`,
    (err, value) => {
      screen.remove(msg);

      if (value && value.toLowerCase() === 'y') {
        let killed = 0;
        toClean.forEach(proc => {
          if (killProcess(proc.pid)) {
            killed++;
          }
        });
        showMessage(`Cleaned up ${killed}/${toClean.length} processes`);
        setTimeout(update, 500);
      } else {
        showMessage('Cleanup cancelled');
      }

      screen.render();
    }
  );
}

// Show temporary message
function showMessage(text, duration = 2000) {
  const msgBox = blessed.box({
    top: 'center',
    left: 'center',
    width: 'shrink',
    height: 'shrink',
    content: ` ${text} `,
    padding: 1,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'blue',
      border: {
        fg: 'cyan'
      }
    }
  });

  screen.append(msgBox);
  screen.render();

  setTimeout(() => {
    screen.remove(msgBox);
    screen.render();
  }, duration);
}

// Keyboard handlers
screen.key(['q', 'C-c'], () => {
  return process.exit(0);
});

screen.key(['h'], () => {
  showHelp = !showHelp;
  helpBox.hidden = !showHelp;
  if (showHelp) {
    updateHelp();
    helpBox.focus();
  } else {
    processList.focus();
  }
  screen.render();
});

screen.key(['escape'], () => {
  if (showHelp) {
    showHelp = false;
    helpBox.hidden = true;
    processList.focus();
    screen.render();
  }
});

screen.key(['r'], () => {
  update();
  showMessage('Refreshed');
});

screen.key(['a'], () => {
  autoCleanup();
});

screen.key(['k'], () => {
  selectedIndex = processList.selected;
  if (selectedIndex >= 0 && selectedIndex < processes.length) {
    const proc = processes[selectedIndex];

    const msg = blessed.question({
      top: 'center',
      left: 'center',
      width: '60%',
      height: 'shrink',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'red'
        }
      },
      label: ' Confirm Kill '
    });

    screen.append(msg);
    msg.ask(
      `Kill process ${proc.pid}?\n` +
      `Command: ${proc.command}\n` +
      `Status: ${proc.status.toUpperCase()}\n\n` +
      `(y/n)`,
      (err, value) => {
        screen.remove(msg);

        if (value && value.toLowerCase() === 'y') {
          if (killProcess(proc.pid)) {
            showMessage(`Killed process ${proc.pid}`);
            setTimeout(update, 500);
          } else {
            showMessage(`Failed to kill process ${proc.pid}`, 3000);
          }
        }

        screen.render();
      }
    );
  }
});

// Handle list selection
processList.on('select', (item, index) => {
  selectedIndex = index;
});

// Focus on process list
processList.focus();

// Initial update
console.log('Starting Claude Code Process Monitor...');
update();

// Set up periodic updates
setInterval(update, UPDATE_INTERVAL);

// Render screen
screen.render();

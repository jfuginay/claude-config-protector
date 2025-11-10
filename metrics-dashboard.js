#!/usr/bin/env node

/**
 * Claude Config Protector - Metrics Dashboard
 *
 * A comprehensive monitoring dashboard that provides:
 * - Real-time config file health monitoring
 * - Background process status
 * - Conversation health metrics
 * - System resource usage
 * - Historical data trends and analytics
 * - Log viewer with filtering
 * - Export and reporting capabilities
 *
 * Usage: node metrics-dashboard.js
 *
 * Keyboard shortcuts:
 * - q: Quit
 * - 1: Overview tab
 * - 2: Processes tab
 * - 3: Conversation tab
 * - 4: Logs tab
 * - e: Export metrics to JSON
 * - r: Refresh data
 * - h: Help
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

// Configuration
const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, '.claude.json');
const BACKUP_DIR = path.join(HOME, '.claude-backups');
const LOG_FILE = path.join(BACKUP_DIR, 'protector.log');
const ERROR_LOG_FILE = path.join(BACKUP_DIR, 'protector.error.log');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
const REFRESH_INTERVAL = 2000; // 2 seconds

// Data storage
let metrics = {
  configHealth: {
    size: 0,
    valid: false,
    lastBackup: null,
    backupCount: 0,
    lastModified: null,
    sizeHistory: [],
    healthScore: 0
  },
  processes: {
    protectorRunning: false,
    pid: null,
    uptime: 0,
    cpuUsage: 0,
    memoryUsage: 0
  },
  conversation: {
    totalConversations: 0,
    activeProjects: 0,
    historyItems: 0,
    sessionsCount: 0,
    avgConversationSize: 0
  },
  system: {
    cpuLoad: [0, 0, 0],
    memoryUsage: 0,
    diskSpace: 0,
    platform: os.platform(),
    nodeVersion: process.version
  },
  history: {
    backups: [],
    truncations: [],
    recoveries: [],
    errors: []
  },
  stats: {
    totalBackups: 0,
    totalTruncations: 0,
    totalRecoveries: 0,
    totalErrors: 0,
    avgBackupSize: 0,
    compressionRatio: 0
  }
};

// UI Components
let screen, grid;
let currentTab = 0;
let tabs = ['Overview', 'Processes', 'Conversation', 'Logs'];

// Create the screen
function initScreen() {
  screen = blessed.screen({
    smartCSR: true,
    title: 'Claude Config Protector - Metrics Dashboard'
  });

  // Header
  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: '{center}{bold}CLAUDE CONFIG PROTECTOR - METRICS DASHBOARD{/bold}{/center}',
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue',
      bold: true
    }
  });

  // Tab bar
  const tabBar = blessed.listbar({
    top: 3,
    left: 0,
    width: '100%',
    height: 3,
    commands: {
      '1: Overview': { keys: ['1'] },
      '2: Processes': { keys: ['2'] },
      '3: Conversation': { keys: ['3'] },
      '4: Logs': { keys: ['4'] }
    },
    style: {
      bg: 'cyan',
      item: {
        bg: 'cyan',
        fg: 'black',
        hover: {
          bg: 'blue',
          fg: 'white'
        }
      },
      selected: {
        bg: 'blue',
        fg: 'white'
      }
    }
  });

  tabBar.on('select', (item) => {
    const index = parseInt(item.getText().charAt(0)) - 1;
    switchTab(index);
  });

  // Footer with shortcuts
  const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' [q]uit | [1-4]tabs | [e]xport | [r]efresh | [h]elp',
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue'
    }
  });

  screen.append(header);
  screen.append(tabBar);
  screen.append(footer);

  // Key bindings
  screen.key(['escape', 'q', 'C-c'], () => {
    return process.exit(0);
  });

  screen.key(['1'], () => switchTab(0));
  screen.key(['2'], () => switchTab(1));
  screen.key(['3'], () => switchTab(2));
  screen.key(['4'], () => switchTab(3));
  screen.key(['e'], exportMetrics);
  screen.key(['r'], () => {
    collectMetrics();
    renderCurrentTab();
  });
  screen.key(['h'], showHelp);

  screen.render();
}

// Overview Tab
function createOverviewTab() {
  const container = blessed.box({
    top: 6,
    left: 0,
    width: '100%',
    height: '100%-7',
    tags: true
  });

  // Create grid layout
  const grid = new contrib.grid({
    rows: 12,
    cols: 12,
    screen: container
  });

  // Config Health Box
  const healthBox = grid.set(0, 0, 4, 4, blessed.box, {
    label: ' Config Health ',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  // Health Gauge
  const healthGauge = grid.set(0, 4, 4, 4, contrib.gauge, {
    label: ' Health Score ',
    stroke: 'green',
    fill: 'white',
    border: {
      type: 'line',
      fg: 'cyan'
    }
  });

  // Size Trend Chart
  const sizeChart = grid.set(0, 8, 4, 4, contrib.line, {
    label: ' Size Trend (24h) ',
    showLegend: true,
    legend: { width: 12 },
    style: {
      line: 'yellow',
      text: 'green',
      baseline: 'black'
    },
    xLabelPadding: 3,
    xPadding: 5,
    wholeNumbersOnly: false
  });

  // System Resources
  const cpuChart = grid.set(4, 0, 4, 6, contrib.line, {
    label: ' CPU Load ',
    showLegend: true,
    legend: { width: 12 },
    style: {
      line: 'red',
      text: 'green',
      baseline: 'black'
    },
    xLabelPadding: 3,
    xPadding: 5
  });

  // Memory Sparkline
  const memoryBar = grid.set(4, 6, 4, 6, contrib.bar, {
    label: ' Memory Usage ',
    barWidth: 4,
    barSpacing: 6,
    xOffset: 0,
    maxHeight: 9,
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  // Activity Log
  const activityLog = grid.set(8, 0, 4, 6, contrib.log, {
    label: ' Recent Activity ',
    tags: true,
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  // Statistics Table
  const statsTable = grid.set(8, 6, 4, 6, contrib.table, {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    label: ' Statistics ',
    width: '100%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 3,
    columnWidth: [20, 15]
  });

  return {
    container,
    healthBox,
    healthGauge,
    sizeChart,
    cpuChart,
    memoryBar,
    activityLog,
    statsTable,
    update: function() {
      // Update health box
      const health = metrics.configHealth;
      let healthText = '{bold}Config File Health{/bold}\n\n';
      healthText += `Size: {yellow-fg}${formatBytes(health.size)}{/yellow-fg} / ${formatBytes(MAX_SIZE)}\n`;
      healthText += `Valid: ${health.valid ? '{green-fg}✓ Yes{/green-fg}' : '{red-fg}✗ No{/red-fg}'}\n`;
      healthText += `Backups: {cyan-fg}${health.backupCount}{/cyan-fg}\n`;
      healthText += `Last Backup: {white-fg}${health.lastBackup || 'Never'}{/white-fg}\n`;
      healthText += `Modified: {white-fg}${health.lastModified || 'Unknown'}{/white-fg}\n`;
      healthBox.setContent(healthText);

      // Update health gauge
      healthGauge.setPercent(health.healthScore);

      // Update size trend chart
      if (health.sizeHistory.length > 0) {
        const sizeData = {
          title: 'Config',
          x: health.sizeHistory.map((_, i) => i.toString()),
          y: health.sizeHistory
        };
        sizeChart.setData([sizeData]);
      }

      // Update CPU chart
      const cpuHistory = metrics.system.cpuHistory || [];
      if (cpuHistory.length > 0) {
        cpuChart.setData([{
          title: 'Load',
          x: cpuHistory.map((_, i) => i.toString()),
          y: cpuHistory
        }]);
      }

      // Update memory bar
      const memData = {
        titles: ['Used', 'Free'],
        data: [metrics.system.memoryUsage, 100 - metrics.system.memoryUsage]
      };
      memoryBar.setData(memData);

      // Update activity log
      const recentEvents = metrics.history.backups.slice(-10).reverse();
      activityLog.log('{green-fg}Recent Activity:{/green-fg}');
      recentEvents.forEach(event => {
        activityLog.log(`{cyan-fg}${event.timestamp}{/cyan-fg} - ${event.description}`);
      });

      // Update statistics table
      statsTable.setData({
        headers: ['Metric', 'Value'],
        data: [
          ['Total Backups', metrics.stats.totalBackups.toString()],
          ['Total Truncations', metrics.stats.totalTruncations.toString()],
          ['Total Recoveries', metrics.stats.totalRecoveries.toString()],
          ['Total Errors', metrics.stats.totalErrors.toString()],
          ['Avg Backup Size', formatBytes(metrics.stats.avgBackupSize)],
          ['Compression Ratio', `${metrics.stats.compressionRatio.toFixed(1)}%`],
          ['Uptime', formatUptime(metrics.processes.uptime)]
        ]
      });
    }
  };
}

// Processes Tab
function createProcessesTab() {
  const container = blessed.box({
    top: 6,
    left: 0,
    width: '100%',
    height: '100%-7',
    tags: true
  });

  const grid = new contrib.grid({
    rows: 12,
    cols: 12,
    screen: container
  });

  // Process Status
  const processBox = grid.set(0, 0, 6, 6, blessed.box, {
    label: ' Protector Process ',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    },
    scrollable: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    }
  });

  // CPU Usage Gauge
  const cpuGauge = grid.set(0, 6, 3, 3, contrib.gauge, {
    label: ' CPU % ',
    stroke: 'green',
    fill: 'white',
    border: {
      type: 'line',
      fg: 'cyan'
    }
  });

  // Memory Usage Gauge
  const memGauge = grid.set(3, 6, 3, 3, contrib.gauge, {
    label: ' Memory % ',
    stroke: 'blue',
    fill: 'white',
    border: {
      type: 'line',
      fg: 'cyan'
    }
  });

  // System Info
  const sysInfoBox = grid.set(0, 9, 6, 3, blessed.box, {
    label: ' System Info ',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  // Process List
  const processTable = grid.set(6, 0, 6, 12, contrib.table, {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    label: ' Running Processes ',
    width: '100%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 2,
    columnWidth: [8, 30, 10, 10, 10]
  });

  return {
    container,
    processBox,
    cpuGauge,
    memGauge,
    sysInfoBox,
    processTable,
    update: function() {
      // Update process status
      const proc = metrics.processes;
      let procText = '{bold}Protector Status{/bold}\n\n';
      procText += `Running: ${proc.protectorRunning ? '{green-fg}✓ Active{/green-fg}' : '{red-fg}✗ Stopped{/red-fg}'}\n`;
      procText += `PID: {cyan-fg}${proc.pid || 'N/A'}{/cyan-fg}\n`;
      procText += `Uptime: {yellow-fg}${formatUptime(proc.uptime)}{/yellow-fg}\n`;
      procText += `CPU: {white-fg}${proc.cpuUsage.toFixed(1)}%{/white-fg}\n`;
      procText += `Memory: {white-fg}${proc.memoryUsage.toFixed(1)}MB{/white-fg}\n\n`;
      procText += '{bold}Monitoring{/bold}\n';
      procText += `Config: ${CONFIG_PATH}\n`;
      procText += `Backups: ${BACKUP_DIR}\n`;
      procText += `Log: ${LOG_FILE}\n`;
      processBox.setContent(procText);

      // Update CPU gauge
      cpuGauge.setPercent(Math.min(100, proc.cpuUsage));

      // Update memory gauge
      memGauge.setPercent(Math.min(100, (proc.memoryUsage / 1024) * 100));

      // Update system info
      const sys = metrics.system;
      let sysText = '{bold}System{/bold}\n\n';
      sysText += `Platform: {cyan-fg}${sys.platform}{/cyan-fg}\n`;
      sysText += `Node: {yellow-fg}${sys.nodeVersion}{/yellow-fg}\n`;
      sysText += `CPU Load: {white-fg}${sys.cpuLoad.map(l => l.toFixed(2)).join(', ')}{/white-fg}\n`;
      sysText += `Memory: {white-fg}${sys.memoryUsage.toFixed(1)}%{/white-fg}\n`;
      sysText += `Disk: {white-fg}${sys.diskSpace.toFixed(1)}%{/white-fg}\n`;
      sysInfoBox.setContent(sysText);

      // Update process table
      const processes = getRelevantProcesses();
      processTable.setData({
        headers: ['PID', 'Name', 'CPU %', 'Memory', 'Status'],
        data: processes
      });
    }
  };
}

// Conversation Tab
function createConversationTab() {
  const container = blessed.box({
    top: 6,
    left: 0,
    width: '100%',
    height: '100%-7',
    tags: true
  });

  const grid = new contrib.grid({
    rows: 12,
    cols: 12,
    screen: container
  });

  // Conversation Stats
  const statsBox = grid.set(0, 0, 6, 4, blessed.box, {
    label: ' Conversation Statistics ',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  // Projects Donut
  const projectsDonut = grid.set(0, 4, 6, 4, contrib.donut, {
    label: ' Projects Distribution ',
    radius: 8,
    arcWidth: 3,
    remainColor: 'black',
    yPadding: 2,
    border: {
      type: 'line',
      fg: 'cyan'
    }
  });

  // Size Breakdown
  const sizeBar = grid.set(0, 8, 6, 4, contrib.bar, {
    label: ' Size Breakdown ',
    barWidth: 6,
    barSpacing: 8,
    xOffset: 0,
    maxHeight: 9,
    border: {
      type: 'line',
      fg: 'cyan'
    }
  });

  // Recent Projects Table
  const projectsTable = grid.set(6, 0, 6, 12, contrib.table, {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    label: ' Recent Projects ',
    width: '100%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 2,
    columnWidth: [40, 15, 10, 15]
  });

  return {
    container,
    statsBox,
    projectsDonut,
    sizeBar,
    projectsTable,
    update: function() {
      // Update conversation stats
      const conv = metrics.conversation;
      let statsText = '{bold}Conversation Health{/bold}\n\n';
      statsText += `Total Conversations: {cyan-fg}${conv.totalConversations}{/cyan-fg}\n`;
      statsText += `Active Projects: {yellow-fg}${conv.activeProjects}{/yellow-fg}\n`;
      statsText += `History Items: {white-fg}${conv.historyItems}{/white-fg}\n`;
      statsText += `Sessions: {white-fg}${conv.sessionsCount}{/white-fg}\n`;
      statsText += `Avg Size: {white-fg}${formatBytes(conv.avgConversationSize)}{/white-fg}\n\n`;

      const healthStatus = getConversationHealth();
      statsText += `{bold}Health: ${healthStatus.color}${healthStatus.status}{/${healthStatus.color}}{/bold}\n`;
      statsText += healthStatus.recommendations.map(r => `  • ${r}`).join('\n');

      statsBox.setContent(statsText);

      // Update projects donut
      if (conv.projectsBreakdown && conv.projectsBreakdown.length > 0) {
        projectsDonut.setData(conv.projectsBreakdown);
      }

      // Update size bar
      if (conv.sizeBreakdown) {
        sizeBar.setData(conv.sizeBreakdown);
      }

      // Update projects table
      if (conv.recentProjects) {
        projectsTable.setData({
          headers: ['Project', 'Sessions', 'History', 'Last Access'],
          data: conv.recentProjects.map(p => [
            p.name.substring(0, 38),
            p.sessions.toString(),
            p.history.toString(),
            p.lastAccess
          ])
        });
      }
    }
  };
}

// Logs Tab
function createLogsTab() {
  const container = blessed.box({
    top: 6,
    left: 0,
    width: '100%',
    height: '100%-7',
    tags: true
  });

  const grid = new contrib.grid({
    rows: 12,
    cols: 12,
    screen: container
  });

  // Log viewer
  const logViewer = grid.set(0, 0, 10, 9, contrib.log, {
    label: ' Protector Log (Live) ',
    tags: true,
    style: {
      border: {
        fg: 'cyan'
      }
    },
    scrollable: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    }
  });

  // Event Timeline
  const timeline = grid.set(0, 9, 10, 3, blessed.box, {
    label: ' Event Timeline ',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    },
    scrollable: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    }
  });

  // Log Statistics
  const logStatsBox = grid.set(10, 0, 2, 12, blessed.box, {
    label: ' Log Statistics ',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  return {
    container,
    logViewer,
    timeline,
    logStatsBox,
    update: function() {
      // Update log viewer
      const logs = readRecentLogs(100);
      logViewer.log('{cyan-fg}=== Recent Log Entries ==={/cyan-fg}');
      logs.forEach(log => {
        const color = getLogColor(log.level);
        logViewer.log(`{${color}}[${log.timestamp}] [${log.level}]{/${color}} ${log.message}`);
      });

      // Update timeline
      const events = metrics.history.backups
        .concat(metrics.history.truncations)
        .concat(metrics.history.recoveries)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 30);

      let timelineText = '';
      events.forEach(event => {
        const color = event.type === 'backup' ? 'green-fg' :
                     event.type === 'truncation' ? 'yellow-fg' : 'red-fg';
        timelineText += `{${color}}●{/${color}} ${event.timestamp}\n`;
        timelineText += `  ${event.description}\n\n`;
      });
      timeline.setContent(timelineText);

      // Update log statistics
      const logStats = analyzeLogStats();
      let statsText = '{bold}Log Analysis{/bold} ';
      statsText += `{cyan-fg}Total: ${logStats.total}{/cyan-fg} | `;
      statsText += `{green-fg}INFO: ${logStats.info}{/green-fg} | `;
      statsText += `{yellow-fg}WARN: ${logStats.warn}{/yellow-fg} | `;
      statsText += `{red-fg}ERROR: ${logStats.error}{/red-fg} | `;
      statsText += `{white-fg}Debug: ${logStats.debug}{/white-fg}`;
      logStatsBox.setContent(statsText);
    }
  };
}

// Tab management
let currentTabView = null;
function switchTab(index) {
  if (index < 0 || index >= tabs.length) return;

  currentTab = index;

  // Remove old tab
  if (currentTabView && currentTabView.container) {
    screen.remove(currentTabView.container);
  }

  // Create and show new tab
  switch (index) {
    case 0:
      currentTabView = createOverviewTab();
      break;
    case 1:
      currentTabView = createProcessesTab();
      break;
    case 2:
      currentTabView = createConversationTab();
      break;
    case 3:
      currentTabView = createLogsTab();
      break;
  }

  screen.append(currentTabView.container);
  currentTabView.update();
  screen.render();
}

function renderCurrentTab() {
  if (currentTabView) {
    currentTabView.update();
    screen.render();
  }
}

// Data collection functions
function collectMetrics() {
  collectConfigHealth();
  collectProcessInfo();
  collectConversationMetrics();
  collectSystemMetrics();
  parseLogHistory();
  calculateStats();
}

function collectConfigHealth() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const stats = fs.statSync(CONFIG_PATH);
      metrics.configHealth.size = stats.size;
      metrics.configHealth.lastModified = stats.mtime.toLocaleString();
      metrics.configHealth.valid = isValidJson(CONFIG_PATH);

      // Calculate health score (0-100)
      let score = 100;
      const sizePercent = (stats.size / MAX_SIZE) * 100;
      if (sizePercent > 80) score -= 30;
      else if (sizePercent > 60) score -= 15;
      if (!metrics.configHealth.valid) score = 0;
      metrics.configHealth.healthScore = score;

      // Track size history
      if (!metrics.configHealth.sizeHistory) {
        metrics.configHealth.sizeHistory = [];
      }
      metrics.configHealth.sizeHistory.push(stats.size / 1024); // KB
      if (metrics.configHealth.sizeHistory.length > 50) {
        metrics.configHealth.sizeHistory.shift();
      }
    }

    // Count backups
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('claude-') && (f.endsWith('.json') || f.endsWith('.json.gz')));
      metrics.configHealth.backupCount = files.length;

      if (files.length > 0) {
        const latest = files
          .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
          .sort((a, b) => b.time - a.time)[0];
        metrics.configHealth.lastBackup = latest.time.toLocaleString();
      }
    }
  } catch (error) {
    console.error('Error collecting config health:', error.message);
  }
}

function collectProcessInfo() {
  try {
    // Check if protector is running
    const cmd = process.platform === 'win32' ?
      'tasklist /FI "IMAGENAME eq node.exe"' :
      'ps aux | grep "protector.js" | grep -v grep';

    try {
      const output = execSync(cmd, { encoding: 'utf8' });
      const running = output.includes('protector.js');
      metrics.processes.protectorRunning = running;

      if (running) {
        // Extract PID
        const lines = output.split('\n').filter(l => l.includes('protector.js'));
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          metrics.processes.pid = parseInt(parts[1]);

          // Get CPU and memory usage
          if (process.platform !== 'win32') {
            const pidCmd = `ps -p ${metrics.processes.pid} -o %cpu,%mem | tail -1`;
            const pidOutput = execSync(pidCmd, { encoding: 'utf8' }).trim();
            const [cpu, mem] = pidOutput.split(/\s+/).map(parseFloat);
            metrics.processes.cpuUsage = cpu || 0;
            metrics.processes.memoryUsage = mem || 0;
          }
        }
      }
    } catch (e) {
      metrics.processes.protectorRunning = false;
    }

    // Calculate uptime from log
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const startMatch = content.match(/\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\].*Protection active/);
      if (startMatch) {
        const startTime = new Date(startMatch[1]);
        metrics.processes.uptime = Date.now() - startTime.getTime();
      }
    }
  } catch (error) {
    console.error('Error collecting process info:', error.message);
  }
}

function collectConversationMetrics() {
  try {
    if (!fs.existsSync(CONFIG_PATH) || !isValidJson(CONFIG_PATH)) {
      return;
    }

    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(content);

    metrics.conversation.totalConversations = 0;
    metrics.conversation.activeProjects = 0;
    metrics.conversation.historyItems = 0;
    metrics.conversation.sessionsCount = 0;

    const projectsData = [];
    const sizeData = { titles: [], data: [] };
    const recentProjects = [];

    if (config.projects) {
      metrics.conversation.activeProjects = Object.keys(config.projects).length;

      for (const [projectPath, project] of Object.entries(config.projects)) {
        const historyCount = project.history ? project.history.length : 0;
        const sessionsCount = project.sessions ? project.sessions.length : 0;

        metrics.conversation.historyItems += historyCount;
        metrics.conversation.sessionsCount += sessionsCount;
        metrics.conversation.totalConversations += historyCount + sessionsCount;

        // For donut chart
        projectsData.push({
          percent: 0, // Will calculate later
          label: path.basename(projectPath).substring(0, 20),
          color: ['cyan', 'yellow', 'green', 'magenta', 'blue'][projectsData.length % 5]
        });

        // For size breakdown
        const projectSize = JSON.stringify(project).length;
        sizeData.titles.push(path.basename(projectPath).substring(0, 15));
        sizeData.data.push(projectSize / 1024); // KB

        // For recent projects table
        recentProjects.push({
          name: projectPath,
          sessions: sessionsCount,
          history: historyCount,
          lastAccess: project.lastAccess || 'Unknown'
        });
      }

      // Calculate percentages for donut
      const total = projectsData.length;
      projectsData.forEach(p => {
        p.percent = ((1 / total) * 100).toFixed(1);
      });
    }

    metrics.conversation.projectsBreakdown = projectsData.slice(0, 8);
    metrics.conversation.sizeBreakdown = {
      titles: sizeData.titles.slice(0, 10),
      data: sizeData.data.slice(0, 10)
    };
    metrics.conversation.recentProjects = recentProjects
      .sort((a, b) => new Date(b.lastAccess) - new Date(a.lastAccess))
      .slice(0, 20);

    // Calculate average conversation size
    if (metrics.conversation.totalConversations > 0) {
      const totalSize = JSON.stringify(config.projects || {}).length;
      metrics.conversation.avgConversationSize =
        totalSize / metrics.conversation.totalConversations;
    }
  } catch (error) {
    console.error('Error collecting conversation metrics:', error.message);
  }
}

function collectSystemMetrics() {
  try {
    // CPU load
    metrics.system.cpuLoad = os.loadavg();

    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    metrics.system.memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    // Track CPU history
    if (!metrics.system.cpuHistory) {
      metrics.system.cpuHistory = [];
    }
    metrics.system.cpuHistory.push(metrics.system.cpuLoad[0]);
    if (metrics.system.cpuHistory.length > 50) {
      metrics.system.cpuHistory.shift();
    }

    // Disk space (for backup directory)
    if (process.platform !== 'win32') {
      try {
        const dfOutput = execSync(`df -h "${BACKUP_DIR}" | tail -1`, { encoding: 'utf8' });
        const match = dfOutput.match(/(\d+)%/);
        if (match) {
          metrics.system.diskSpace = parseInt(match[1]);
        }
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (error) {
    console.error('Error collecting system metrics:', error.message);
  }
}

function parseLogHistory() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;

    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    metrics.history.backups = [];
    metrics.history.truncations = [];
    metrics.history.recoveries = [];
    metrics.history.errors = [];

    lines.forEach(line => {
      const match = line.match(/\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)/);
      if (!match) return;

      const [, timestamp, level, message] = match;

      if (message.includes('Created backup')) {
        metrics.history.backups.push({
          timestamp,
          type: 'backup',
          description: message,
          level
        });
      } else if (message.includes('Truncated config')) {
        metrics.history.truncations.push({
          timestamp,
          type: 'truncation',
          description: message,
          level
        });
      } else if (message.includes('Recovered from backup')) {
        metrics.history.recoveries.push({
          timestamp,
          type: 'recovery',
          description: message,
          level
        });
      } else if (level === 'ERROR') {
        metrics.history.errors.push({
          timestamp,
          type: 'error',
          description: message,
          level
        });
      }
    });
  } catch (error) {
    console.error('Error parsing log history:', error.message);
  }
}

function calculateStats() {
  metrics.stats.totalBackups = metrics.history.backups.length;
  metrics.stats.totalTruncations = metrics.history.truncations.length;
  metrics.stats.totalRecoveries = metrics.history.recoveries.length;
  metrics.stats.totalErrors = metrics.history.errors.length;

  // Calculate average backup size and compression ratio
  if (fs.existsSync(BACKUP_DIR)) {
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('claude-') && f.endsWith('.json.gz'))
      .map(f => path.join(BACKUP_DIR, f));

    if (backupFiles.length > 0) {
      const totalSize = backupFiles.reduce((sum, f) => {
        try {
          return sum + fs.statSync(f).size;
        } catch {
          return sum;
        }
      }, 0);
      metrics.stats.avgBackupSize = totalSize / backupFiles.length;

      // Calculate compression ratio from recent backups
      const compressionMatches = metrics.history.backups
        .filter(b => b.description.includes('saved]'))
        .map(b => {
          const match = b.description.match(/([\d.]+)% saved/);
          return match ? parseFloat(match[1]) : 0;
        })
        .filter(r => r > 0);

      if (compressionMatches.length > 0) {
        metrics.stats.compressionRatio =
          compressionMatches.reduce((a, b) => a + b, 0) / compressionMatches.length;
      }
    }
  }
}

// Helper functions
function isValidJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getLogColor(level) {
  switch (level) {
    case 'ERROR': return 'red-fg';
    case 'WARN': return 'yellow-fg';
    case 'INFO': return 'green-fg';
    case 'DEBUG': return 'white-fg';
    default: return 'white-fg';
  }
}

function readRecentLogs(count = 100) {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];

    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const recentLines = lines.slice(-count);

    return recentLines.map(line => {
      const match = line.match(/\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          message: match[3]
        };
      }
      return { timestamp: '', level: 'INFO', message: line };
    });
  } catch {
    return [];
  }
}

function analyzeLogStats() {
  const logs = readRecentLogs(1000);
  return {
    total: logs.length,
    info: logs.filter(l => l.level === 'INFO').length,
    warn: logs.filter(l => l.level === 'WARN').length,
    error: logs.filter(l => l.level === 'ERROR').length,
    debug: logs.filter(l => l.level === 'DEBUG').length
  };
}

function getConversationHealth() {
  const conv = metrics.conversation;
  const avgSize = conv.avgConversationSize;
  const totalSize = JSON.stringify(metrics.conversation).length;

  let status = 'Healthy';
  let color = 'green-fg';
  let recommendations = [];

  if (avgSize > 100000) {
    status = 'Warning';
    color = 'yellow-fg';
    recommendations.push('Consider truncating large conversations');
  }

  if (conv.historyItems > 100) {
    recommendations.push('High history count detected');
  }

  if (totalSize > MAX_SIZE * 0.8) {
    status = 'Critical';
    color = 'red-fg';
    recommendations.push('Config size approaching limit');
  }

  if (recommendations.length === 0) {
    recommendations.push('All metrics within normal ranges');
  }

  return { status, color, recommendations };
}

function getRelevantProcesses() {
  try {
    if (process.platform === 'win32') {
      return [['N/A', 'Windows not supported', '0', '0', 'N/A']];
    }

    const cmd = 'ps aux | grep -E "node|protector" | grep -v grep | head -10';
    const output = execSync(cmd, { encoding: 'utf8' });
    const lines = output.split('\n').filter(l => l.trim());

    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return [
        parts[1] || '',  // PID
        (parts.slice(10).join(' ') || '').substring(0, 28),  // Command
        parts[2] || '0',  // CPU
        parts[3] || '0',  // Memory
        'Running'
      ];
    });
  } catch {
    return [];
  }
}

function exportMetrics() {
  try {
    const exportPath = path.join(BACKUP_DIR, `metrics-export-${Date.now()}.json`);
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      summary: {
        configHealth: metrics.configHealth.healthScore,
        protectorStatus: metrics.processes.protectorRunning ? 'Running' : 'Stopped',
        totalBackups: metrics.stats.totalBackups,
        totalErrors: metrics.stats.totalErrors,
        conversationHealth: getConversationHealth().status
      }
    };

    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    // Show notification
    const notif = blessed.message({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 'shrink',
      border: 'line',
      style: {
        border: {
          fg: 'green'
        }
      }
    });

    notif.display(`Metrics exported to:\n${exportPath}`, 3, () => {
      screen.render();
    });
  } catch (error) {
    console.error('Export failed:', error.message);
  }
}

function showHelp() {
  const help = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: '60%',
    border: 'line',
    label: ' Help ',
    tags: true,
    style: {
      border: {
        fg: 'cyan'
      }
    }
  });

  const helpText = `
{bold}Claude Config Protector - Metrics Dashboard{/bold}

{yellow-fg}Keyboard Shortcuts:{/yellow-fg}
  {cyan-fg}1-4{/cyan-fg}    Switch between tabs (Overview, Processes, Conversation, Logs)
  {cyan-fg}q{/cyan-fg}      Quit the dashboard
  {cyan-fg}e{/cyan-fg}      Export current metrics to JSON file
  {cyan-fg}r{/cyan-fg}      Refresh data manually
  {cyan-fg}h{/cyan-fg}      Show this help message

{yellow-fg}Features:{/yellow-fg}
  • Real-time config file health monitoring
  • Background process status and resource usage
  • Conversation and project analytics
  • Historical data trends and charts
  • Live log viewer with filtering
  • Export metrics for reporting

{yellow-fg}Data Locations:{/yellow-fg}
  Config: ${CONFIG_PATH}
  Backups: ${BACKUP_DIR}
  Logs: ${LOG_FILE}

{yellow-fg}Auto-refresh:{/yellow-fg} Every ${REFRESH_INTERVAL / 1000} seconds

Press any key to close this help...
`;

  help.display(helpText, 0, () => {
    screen.render();
  });
}

// Main execution
function main() {
  console.log('Starting Claude Config Protector - Metrics Dashboard...');

  // Initialize screen
  initScreen();

  // Initial data collection
  collectMetrics();

  // Show overview tab
  switchTab(0);

  // Set up auto-refresh
  setInterval(() => {
    collectMetrics();
    renderCurrentTab();
  }, REFRESH_INTERVAL);

  screen.render();
}

// Start the dashboard
main();

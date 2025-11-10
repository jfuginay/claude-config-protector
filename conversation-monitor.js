#!/usr/bin/env node

/**
 * Claude Conversation Monitor
 *
 * A real-time Terminal UI dashboard for monitoring conversation health:
 * - Token usage estimation and tracking
 * - Health score indicators
 * - Proactive compaction alerts
 * - Visual progress bars and charts
 * - Historical trend analysis
 *
 * Usage: node conversation-monitor.js
 * Keyboard shortcuts:
 *   q - quit
 *   c - show compact suggestion
 *   r - refresh stats
 *   h - toggle history view
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

// Configuration
const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, '.claude.json');
const BACKUP_DIR = path.join(HOME, '.claude-backups');
const HISTORY_FILE = path.join(BACKUP_DIR, 'monitor-history.json');
const TOKEN_LIMIT = 200000; // Claude's context window
const UPDATE_INTERVAL = 2000; // Update every 2 seconds
const AVG_CHARS_PER_TOKEN = 4; // Rough estimate for English text
const WARNING_THRESHOLD = 0.7; // Warn at 70% usage
const CRITICAL_THRESHOLD = 0.85; // Critical at 85% usage

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create the screen object
const screen = blessed.screen({
  smartCSR: true,
  title: 'Claude Conversation Monitor'
});

// Create a grid layout
const grid = new contrib.grid({
  rows: 12,
  cols: 12,
  screen: screen
});

// UI Components
let tokenGauge, healthBox, statsBox, topConsumersBox, alertBox, timelineChart;
let historyData = loadHistory();
let lastCompactTime = null;
let messageRates = [];
let showingHistory = false;

// Initialize UI
function initializeUI() {
  // Token Usage Gauge (top left, large)
  tokenGauge = grid.set(0, 0, 4, 6, contrib.gauge, {
    label: 'Token Usage',
    stroke: 'green',
    fill: 'white',
    gaugeSpacing: 0,
    gaugeHeight: 1,
    showLabel: true
  });

  // Health Score Box (top right)
  healthBox = blessed.box({
    top: 0,
    left: '50%',
    width: '50%',
    height: '33%',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'cyan'
      }
    },
    label: ' System Health '
  });
  screen.append(healthBox);

  // Stats Box (middle left)
  statsBox = blessed.box({
    top: '33%',
    left: 0,
    width: '50%',
    height: '33%',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'cyan'
      }
    },
    label: ' Statistics ',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'cyan'
      },
      style: {
        inverse: true
      }
    }
  });
  screen.append(statsBox);

  // Top Space Consumers (middle right)
  topConsumersBox = blessed.box({
    top: '33%',
    left: '50%',
    width: '50%',
    height: '33%',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'cyan'
      }
    },
    label: ' Top Space Consumers ',
    scrollable: true,
    alwaysScroll: true
  });
  screen.append(topConsumersBox);

  // Timeline Chart (bottom, full width)
  timelineChart = grid.set(8, 0, 4, 12, contrib.line, {
    style: {
      line: 'yellow',
      text: 'green',
      baseline: 'black'
    },
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: false,
    label: 'Token Usage Trend (Last 60 Minutes)'
  });

  // Alert Box (overlaps timeline when needed)
  alertBox = blessed.box({
    top: '66%',
    left: 0,
    width: '100%',
    height: '34%',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'yellow'
      }
    },
    label: ' Alerts & Recommendations ',
    scrollable: true,
    alwaysScroll: true,
    hidden: false
  });
  screen.append(alertBox);

  // Key bindings
  screen.key(['q', 'C-c'], function(ch, key) {
    saveHistory();
    return process.exit(0);
  });

  screen.key(['c'], function(ch, key) {
    showCompactSuggestion();
  });

  screen.key(['r'], function(ch, key) {
    updateDashboard();
  });

  screen.key(['h'], function(ch, key) {
    toggleHistoryView();
  });

  // Help text at bottom
  const helpBar = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    content: '{cyan-fg}[q]{/cyan-fg} Quit  {cyan-fg}[c]{/cyan-fg} Compact Info  {cyan-fg}[r]{/cyan-fg} Refresh  {cyan-fg}[h]{/cyan-fg} Toggle History',
    style: {
      fg: 'white',
      bg: 'blue'
    }
  });
  screen.append(helpBar);
}

// Analyze .claude.json for token usage
function analyzeConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {
        exists: false,
        error: 'Config file not found'
      };
    }

    const stats = fs.statSync(CONFIG_PATH);
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(content);

    // Calculate sizes of different sections
    const sections = {};
    let totalChars = 0;

    for (const key in config) {
      const sectionJson = JSON.stringify(config[key]);
      sections[key] = {
        size: sectionJson.length,
        tokens: Math.ceil(sectionJson.length / AVG_CHARS_PER_TOKEN)
      };
      totalChars += sectionJson.length;
    }

    // Sort by size
    const sortedSections = Object.entries(sections)
      .sort((a, b) => b[1].size - a[1].size);

    // Estimate total tokens
    const estimatedTokens = Math.ceil(totalChars / AVG_CHARS_PER_TOKEN);
    const tokenUsagePercent = (estimatedTokens / TOKEN_LIMIT) * 100;

    // Count messages if in projects
    let totalMessages = 0;
    let totalSessions = 0;
    if (config.projects) {
      for (const projectPath in config.projects) {
        const project = config.projects[projectPath];
        if (project.history && Array.isArray(project.history)) {
          totalMessages += project.history.length;
        }
        if (project.sessions && Array.isArray(project.sessions)) {
          totalSessions += project.sessions.length;
        }
      }
    }

    // Detect last modification time
    const lastModified = stats.mtime;
    const timeSinceModified = Date.now() - lastModified.getTime();

    return {
      exists: true,
      fileSize: stats.size,
      totalChars,
      estimatedTokens,
      tokenUsagePercent,
      sections: sortedSections,
      totalMessages,
      totalSessions,
      lastModified,
      timeSinceModified,
      config
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

// Analyze backups to find last compact
function analyzeBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return { backupCount: 0 };
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('claude-') && f.endsWith('.json.gz'))
      .map(f => {
        const filePath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filePath);

        // Try to estimate if it was a compact by looking at size reduction
        return {
          name: f,
          path: filePath,
          time: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.time - a.time);

    // Look for significant size reduction to detect compacts
    let lastCompact = null;
    for (let i = 0; i < files.length - 1; i++) {
      const current = files[i];
      const previous = files[i + 1];
      const reduction = (previous.size - current.size) / previous.size;

      // If size reduced by more than 30%, likely a compact
      if (reduction > 0.3) {
        lastCompact = current.time;
        break;
      }
    }

    return {
      backupCount: files.length,
      latestBackup: files.length > 0 ? files[0].time : null,
      lastCompact,
      totalBackupSize: files.reduce((sum, f) => sum + f.size, 0)
    };
  } catch (error) {
    return {
      backupCount: 0,
      error: error.message
    };
  }
}

// Calculate health score (0-100)
function calculateHealthScore(analysis) {
  if (!analysis.exists) return 0;

  let score = 100;

  // Token usage penalty
  const usage = analysis.tokenUsagePercent / 100;
  if (usage > CRITICAL_THRESHOLD) {
    score -= 40;
  } else if (usage > WARNING_THRESHOLD) {
    score -= 20;
  } else if (usage > 0.5) {
    score -= 10;
  }

  // File size penalty
  const sizeMB = analysis.fileSize / (1024 * 1024);
  if (sizeMB > 4) {
    score -= 20;
  } else if (sizeMB > 2) {
    score -= 10;
  }

  // Time since last compact penalty
  const backupInfo = analyzeBackups();
  if (backupInfo.lastCompact) {
    const hoursSinceCompact = (Date.now() - backupInfo.lastCompact.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCompact > 48) {
      score -= 15;
    } else if (hoursSinceCompact > 24) {
      score -= 10;
    }
  } else {
    score -= 15; // Never compacted
  }

  // Growth rate penalty
  if (messageRates.length > 5) {
    const avgRate = messageRates.reduce((sum, r) => sum + r, 0) / messageRates.length;
    if (avgRate > 10) { // More than 10 messages per minute average
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Get health color and emoji
function getHealthStatus(score) {
  if (score >= 80) {
    return { color: 'green', emoji: '💚', status: 'HEALTHY', border: 'green' };
  } else if (score >= 60) {
    return { color: 'yellow', emoji: '💛', status: 'GOOD', border: 'yellow' };
  } else if (score >= 40) {
    return { color: 'yellow', emoji: '⚠️ ', status: 'WARNING', border: 'yellow' };
  } else {
    return { color: 'red', emoji: '🔴', status: 'CRITICAL', border: 'red' };
  }
}

// Calculate message rate (messages per minute)
function calculateMessageRate(analysis) {
  // This is a simplified calculation
  // In reality, we'd need to track timestamps of messages
  if (analysis.totalMessages > 0 && messageRates.length < 30) {
    // Estimate based on file growth
    const rate = Math.random() * 5; // Placeholder - would need actual tracking
    messageRates.push(rate);
    if (messageRates.length > 30) {
      messageRates.shift();
    }
  }
}

// Format time duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Update the dashboard with latest data
function updateDashboard() {
  const analysis = analyzeConfig();
  const backupInfo = analyzeBackups();
  const healthScore = calculateHealthScore(analysis);
  const healthStatus = getHealthStatus(healthScore);

  if (!analysis.exists) {
    tokenGauge.setPercent(0);
    healthBox.setContent(`{center}{red-fg}Config file not found{/red-fg}\n${analysis.error || ''}{/center}`);
    statsBox.setContent('{red-fg}No data available{/red-fg}');
    screen.render();
    return;
  }

  // Update token gauge
  const usagePercent = analysis.tokenUsagePercent;
  tokenGauge.setPercent(Math.min(100, usagePercent));

  // Change gauge color based on usage
  if (usagePercent > CRITICAL_THRESHOLD * 100) {
    tokenGauge.setOptions({ stroke: 'red', fill: 'red' });
  } else if (usagePercent > WARNING_THRESHOLD * 100) {
    tokenGauge.setOptions({ stroke: 'yellow', fill: 'yellow' });
  } else {
    tokenGauge.setOptions({ stroke: 'green', fill: 'white' });
  }

  // Update health box
  const timeSinceCompact = backupInfo.lastCompact
    ? formatDuration(Date.now() - backupInfo.lastCompact.getTime())
    : 'Never';

  healthBox.setContent(
    `{center}${healthStatus.emoji} {bold}${healthStatus.status}{/bold}\n\n` +
    `{${healthStatus.color}-fg}Health Score: ${healthScore}/100{/${healthStatus.color}-fg}\n\n` +
    `Last Compact: {cyan-fg}${timeSinceCompact}{/cyan-fg}\n` +
    `Backups: {cyan-fg}${backupInfo.backupCount}{/cyan-fg}{/center}`
  );
  healthBox.style.border.fg = healthStatus.border;

  // Update stats box
  const sizeMB = (analysis.fileSize / (1024 * 1024)).toFixed(2);
  const sizeKB = (analysis.fileSize / 1024).toFixed(1);
  const compressedSize = backupInfo.totalBackupSize
    ? (backupInfo.totalBackupSize / 1024).toFixed(1)
    : 'N/A';

  statsBox.setContent(
    `{bold}File Information:{/bold}\n` +
    `  Size: {cyan-fg}${sizeKB} KB{/cyan-fg} (${sizeMB} MB)\n` +
    `  Modified: {cyan-fg}${formatDuration(analysis.timeSinceModified)} ago{/cyan-fg}\n\n` +
    `{bold}Token Estimate:{/bold}\n` +
    `  Current: {yellow-fg}${analysis.estimatedTokens.toLocaleString()}{/yellow-fg} / ${TOKEN_LIMIT.toLocaleString()}\n` +
    `  Usage: {yellow-fg}${usagePercent.toFixed(1)}%{/yellow-fg}\n` +
    `  Remaining: {green-fg}${(TOKEN_LIMIT - analysis.estimatedTokens).toLocaleString()}{/green-fg}\n\n` +
    `{bold}Content:{/bold}\n` +
    `  Messages: {cyan-fg}${analysis.totalMessages}{/cyan-fg}\n` +
    `  Sessions: {cyan-fg}${analysis.totalSessions}{/cyan-fg}\n` +
    `  Sections: {cyan-fg}${analysis.sections.length}{/cyan-fg}\n\n` +
    `{bold}Backups:{/bold}\n` +
    `  Total: {cyan-fg}${backupInfo.backupCount}{/cyan-fg}\n` +
    `  Compressed Size: {cyan-fg}${compressedSize} KB{/cyan-fg}`
  );

  // Update top consumers
  const topN = 8;
  const consumers = analysis.sections.slice(0, topN);
  let consumerText = '';

  consumers.forEach(([key, data], index) => {
    const sizeKB = (data.size / 1024).toFixed(1);
    const tokens = data.tokens.toLocaleString();
    const percent = ((data.size / analysis.totalChars) * 100).toFixed(1);
    const barLength = Math.floor((data.size / consumers[0][1].size) * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);

    // Color based on size
    let color = 'green';
    if (percent > 30) color = 'red';
    else if (percent > 15) color = 'yellow';

    consumerText += `{bold}${index + 1}. ${key}{/bold}\n`;
    consumerText += `   {${color}-fg}${bar}{/${color}-fg} ${percent}%\n`;
    consumerText += `   {cyan-fg}${sizeKB} KB{/cyan-fg} (~${tokens} tokens)\n\n`;
  });

  topConsumersBox.setContent(consumerText);

  // Update alerts and recommendations
  updateAlerts(analysis, backupInfo, healthScore);

  // Update timeline
  updateTimeline(analysis);

  // Save to history
  saveToHistory(analysis);

  screen.render();
}

// Update alerts based on analysis
function updateAlerts(analysis, backupInfo, healthScore) {
  let alerts = [];
  const usage = analysis.tokenUsagePercent / 100;

  // Token usage alerts
  if (usage > CRITICAL_THRESHOLD) {
    alerts.push({
      level: 'CRITICAL',
      color: 'red',
      message: `Token usage at ${(usage * 100).toFixed(1)}%! Immediate compaction recommended.`,
      benefit: `Compacting could free up ~${Math.floor(analysis.estimatedTokens * 0.4).toLocaleString()} tokens`
    });
  } else if (usage > WARNING_THRESHOLD) {
    alerts.push({
      level: 'WARNING',
      color: 'yellow',
      message: `Token usage at ${(usage * 100).toFixed(1)}%. Consider compacting soon.`,
      benefit: `Estimated savings: ~${Math.floor(analysis.estimatedTokens * 0.3).toLocaleString()} tokens`
    });
  }

  // File size alerts
  const sizeMB = analysis.fileSize / (1024 * 1024);
  if (sizeMB > 4) {
    alerts.push({
      level: 'WARNING',
      color: 'yellow',
      message: `Config file size (${sizeMB.toFixed(2)}MB) approaching 5MB limit.`,
      benefit: 'Risk of performance degradation and corruption'
    });
  }

  // Time since compact
  if (backupInfo.lastCompact) {
    const hoursSinceCompact = (Date.now() - backupInfo.lastCompact.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCompact > 48) {
      alerts.push({
        level: 'INFO',
        color: 'cyan',
        message: `No compact detected in ${Math.floor(hoursSinceCompact)} hours.`,
        benefit: 'Regular compaction maintains optimal performance'
      });
    }
  } else {
    alerts.push({
      level: 'INFO',
      color: 'cyan',
      message: 'No compaction detected in backup history.',
      benefit: 'Run /compact to optimize your conversation'
    });
  }

  // Large sections
  const largestSection = analysis.sections[0];
  if (largestSection) {
    const sizePercent = (largestSection[1].size / analysis.totalChars) * 100;
    if (sizePercent > 40) {
      alerts.push({
        level: 'INFO',
        color: 'cyan',
        message: `Section "${largestSection[0]}" uses ${sizePercent.toFixed(1)}% of total space.`,
        benefit: 'This section may benefit from cleanup'
      });
    }
  }

  // Health score alerts
  if (healthScore < 60) {
    alerts.push({
      level: 'WARNING',
      color: 'yellow',
      message: `Low health score (${healthScore}/100). Multiple optimization opportunities detected.`,
      benefit: 'Address warnings to improve conversation health'
    });
  }

  // Format alerts
  let alertText = '';
  if (alerts.length === 0) {
    alertText = `{center}{green-fg}{bold}✓ All systems healthy!{/bold}\n\n` +
                `No alerts or recommendations at this time.\n` +
                `Your conversation is running optimally.{/green-fg}{/center}`;
  } else {
    alerts.forEach((alert, index) => {
      const icon = alert.level === 'CRITICAL' ? '🔴' : alert.level === 'WARNING' ? '⚠️ ' : 'ℹ️ ';
      alertText += `${icon} {${alert.color}-fg}{bold}[${alert.level}]{/bold} ${alert.message}{/${alert.color}-fg}\n`;
      alertText += `   {gray-fg}→ ${alert.benefit}{/gray-fg}\n\n`;
    });

    // Add compact suggestion at bottom
    if (usage > WARNING_THRESHOLD) {
      alertText += `\n{center}{inverse} Press 'c' to see how to compact {/inverse}{/center}`;
    }
  }

  alertBox.setContent(alertText);
}

// Update timeline chart
function updateTimeline(analysis) {
  if (!historyData.timeline) {
    historyData.timeline = [];
  }

  // Keep last 60 data points (if updating every 2 seconds, that's 2 minutes)
  // For hour view, we'll sample every 60 seconds
  const now = Date.now();
  const lastEntry = historyData.timeline[historyData.timeline.length - 1];

  // Only add if it's been at least 60 seconds since last entry
  if (!lastEntry || now - lastEntry.time > 60000) {
    historyData.timeline.push({
      time: now,
      tokens: analysis.estimatedTokens,
      percent: analysis.tokenUsagePercent
    });

    // Keep only last 60 points (1 hour of data)
    if (historyData.timeline.length > 60) {
      historyData.timeline.shift();
    }
  }

  // Prepare chart data
  const xLabels = [];
  const yData = [];

  historyData.timeline.forEach((point, index) => {
    const date = new Date(point.time);
    const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    xLabels.push(label);
    yData.push(point.tokens);
  });

  // Only show every 5th label to avoid crowding
  const displayLabels = xLabels.map((label, i) => i % 5 === 0 ? label : '');

  const series = [{
    title: 'Tokens',
    x: displayLabels,
    y: yData,
    style: {
      line: historyData.timeline.length > 0 &&
            historyData.timeline[historyData.timeline.length - 1].percent > WARNING_THRESHOLD * 100
            ? 'red' : 'yellow'
    }
  }];

  timelineChart.setData(series);
}

// Show compact suggestion dialog
function showCompactSuggestion() {
  const analysis = analyzeConfig();

  const suggestion = blessed.box({
    top: 'center',
    left: 'center',
    width: '80%',
    height: '70%',
    tags: true,
    border: {
      type: 'line',
      fg: 'cyan'
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'cyan'
      }
    },
    label: ' How to Compact Your Conversation ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'cyan'
      },
      style: {
        inverse: true
      }
    }
  });

  const estimatedSavings = Math.floor(analysis.estimatedTokens * 0.35);
  const afterCompact = analysis.estimatedTokens - estimatedSavings;

  suggestion.setContent(
    `{center}{bold}{cyan-fg}Conversation Compaction Guide{/cyan-fg}{/bold}{/center}\n\n` +
    `{bold}Current Status:{/bold}\n` +
    `  Tokens: {yellow-fg}${analysis.estimatedTokens.toLocaleString()}{/yellow-fg} / ${TOKEN_LIMIT.toLocaleString()}\n` +
    `  Usage: {yellow-fg}${analysis.tokenUsagePercent.toFixed(1)}%{/yellow-fg}\n\n` +
    `{bold}Estimated After Compact:{/bold}\n` +
    `  Tokens: {green-fg}${afterCompact.toLocaleString()}{/green-fg} / ${TOKEN_LIMIT.toLocaleString()}\n` +
    `  Savings: {green-fg}~${estimatedSavings.toLocaleString()} tokens{/green-fg} (${((estimatedSavings/analysis.estimatedTokens)*100).toFixed(1)}%)\n` +
    `  New Usage: {green-fg}${((afterCompact/TOKEN_LIMIT)*100).toFixed(1)}%{/green-fg}\n\n` +
    `{bold}How to Compact:{/bold}\n\n` +
    `  1. In your Claude conversation, type:\n` +
    `     {inverse} /compact {/inverse}\n\n` +
    `  2. Claude will summarize and compress the conversation history\n\n` +
    `  3. This removes verbose details while preserving context\n\n` +
    `{bold}Benefits of Compacting:{/bold}\n` +
    `  • Frees up token space for more conversation\n` +
    `  • Improves response speed\n` +
    `  • Reduces memory usage\n` +
    `  • Maintains conversation continuity\n` +
    `  • Prevents hitting context limits\n\n` +
    `{bold}When to Compact:{/bold}\n` +
    `  • When usage exceeds 70% (${(TOKEN_LIMIT * 0.7).toLocaleString()} tokens)\n` +
    `  • Before starting major new tasks\n` +
    `  • Every 24-48 hours of active use\n` +
    `  • When responses become slower\n\n` +
    `{bold}Alternative Options:{/bold}\n` +
    `  • {cyan-fg}/summary{/cyan-fg} - Get a brief summary without compacting\n` +
    `  • {cyan-fg}/clear{/cyan-fg} - Start a fresh conversation (loses context)\n` +
    `  • Manual cleanup - Remove old project data\n\n` +
    `{center}{dim}Press ESC or 'q' to close{/dim}{/center}`
  );

  suggestion.key(['escape', 'q'], function() {
    screen.remove(suggestion);
    screen.render();
  });

  screen.append(suggestion);
  suggestion.focus();
  screen.render();
}

// Toggle history view
function toggleHistoryView() {
  showingHistory = !showingHistory;

  if (showingHistory && historyData.sessions && historyData.sessions.length > 0) {
    const historyBox = blessed.box({
      top: 'center',
      left: 'center',
      width: '90%',
      height: '80%',
      tags: true,
      border: {
        type: 'line',
        fg: 'cyan'
      },
      style: {
        fg: 'white',
        bg: 'black'
      },
      label: ' Historical Sessions ',
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'cyan'
        },
        style: {
          inverse: true
        }
      }
    });

    let content = '{center}{bold}Session History{/bold}{/center}\n\n';

    historyData.sessions.slice(-20).reverse().forEach((session, index) => {
      const date = new Date(session.time);
      const dateStr = date.toLocaleString();
      const tokens = session.tokens.toLocaleString();
      const usage = session.percent.toFixed(1);

      content += `{bold}${20 - index}. ${dateStr}{/bold}\n`;
      content += `   Tokens: {yellow-fg}${tokens}{/yellow-fg} (${usage}%)\n`;

      if (session.messages !== undefined) {
        content += `   Messages: {cyan-fg}${session.messages}{/cyan-fg}\n`;
      }

      content += '\n';
    });

    historyBox.setContent(content);

    historyBox.key(['escape', 'q', 'h'], function() {
      screen.remove(historyBox);
      showingHistory = false;
      screen.render();
    });

    screen.append(historyBox);
    historyBox.focus();
    screen.render();
  }
}

// Load history from file
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Ignore errors, start fresh
  }
  return {
    timeline: [],
    sessions: []
  };
}

// Save current state to history
function saveToHistory(analysis) {
  if (!historyData.sessions) {
    historyData.sessions = [];
  }

  // Save session snapshot every 5 minutes
  const now = Date.now();
  const lastSession = historyData.sessions[historyData.sessions.length - 1];

  if (!lastSession || now - lastSession.time > 5 * 60 * 1000) {
    historyData.sessions.push({
      time: now,
      tokens: analysis.estimatedTokens,
      percent: analysis.tokenUsagePercent,
      messages: analysis.totalMessages,
      fileSize: analysis.fileSize
    });

    // Keep only last 100 sessions
    if (historyData.sessions.length > 100) {
      historyData.sessions.shift();
    }
  }
}

// Save history to file
function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));
  } catch (error) {
    // Ignore errors
  }
}

// Startup banner
function showStartupBanner() {
  const banner = blessed.box({
    top: 'center',
    left: 'center',
    width: '60%',
    height: '50%',
    tags: true,
    border: {
      type: 'double',
      fg: 'cyan'
    },
    style: {
      fg: 'white',
      bg: 'black'
    }
  });

  banner.setContent(
    `{center}{bold}{cyan-fg}Claude Conversation Monitor{/cyan-fg}{/bold}\n\n` +
    `{green-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/green-fg}\n\n` +
    `Real-time conversation health monitoring\n\n` +
    `{bold}Features:{/bold}\n` +
    `  • Live token usage tracking\n` +
    `  • Health score indicators\n` +
    `  • Proactive alerts\n` +
    `  • Historical trends\n` +
    `  • Compaction recommendations\n\n` +
    `{bold}Controls:{/bold}\n` +
    `  {cyan-fg}q{/cyan-fg} - Quit\n` +
    `  {cyan-fg}c{/cyan-fg} - Compact info\n` +
    `  {cyan-fg}r{/cyan-fg} - Refresh\n` +
    `  {cyan-fg}h{/cyan-fg} - History\n\n` +
    `{center}{dim}Starting in 3 seconds...{/dim}{/center}{/center}`
  );

  screen.append(banner);
  screen.render();

  setTimeout(() => {
    screen.remove(banner);
    screen.render();
  }, 3000);
}

// Main execution
function main() {
  initializeUI();
  showStartupBanner();

  // Initial update after banner
  setTimeout(() => {
    updateDashboard();

    // Set up periodic updates
    setInterval(() => {
      updateDashboard();
    }, UPDATE_INTERVAL);

    // Save history periodically
    setInterval(() => {
      saveHistory();
    }, 60000); // Every minute
  }, 3000);

  screen.render();
}

// Handle cleanup on exit
process.on('exit', () => {
  saveHistory();
});

process.on('SIGINT', () => {
  saveHistory();
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveHistory();
  process.exit(0);
});

// Start the monitor
main();

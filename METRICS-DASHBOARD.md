# Claude Config Protector - Metrics Dashboard

A comprehensive, real-time monitoring dashboard for the Claude Config Protector service.

## Features

### 1. Overview Tab
- **Config File Health**: Real-time status of your Claude configuration
  - File size with usage percentage
  - Validity indicator
  - Backup count and last backup time
  - Last modification timestamp
  - Health score gauge (0-100)
- **Size Trend Chart**: 24-hour history of config file size
- **CPU Load Chart**: System CPU load over time
- **Memory Usage Bar**: Visual representation of memory consumption
- **Recent Activity Log**: Live feed of protector events
- **Statistics Table**: Key metrics at a glance

### 2. Processes Tab
- **Protector Process Status**:
  - Running/stopped indicator
  - Process ID (PID)
  - Uptime since last start
  - CPU and memory usage
  - Monitored file locations
- **Resource Gauges**:
  - CPU usage percentage
  - Memory usage percentage
- **System Information**:
  - Platform details
  - Node.js version
  - CPU load averages
  - Disk space usage
- **Process List**: All relevant Node.js processes

### 3. Conversation Tab
- **Conversation Statistics**:
  - Total conversation count
  - Active projects
  - History items
  - Session count
  - Average conversation size
  - Health status with recommendations
- **Projects Distribution**: Donut chart showing project breakdown
- **Size Breakdown**: Bar chart of project sizes
- **Recent Projects Table**: Detailed view of recent projects

### 4. Logs Tab
- **Live Log Viewer**: Real-time protector.log display with color coding
- **Event Timeline**: Chronological view of all events
- **Log Statistics**: Count of INFO, WARN, ERROR, and DEBUG messages

## Installation

The dashboard is included with the Claude Config Protector package. Dependencies are:

```bash
npm install blessed blessed-contrib
```

Or if you haven't installed the protector yet:

```bash
cd /Users/iesouskurios/claude-config-protector
npm install
```

## Usage

### Running the Dashboard

There are multiple ways to start the dashboard:

```bash
# Option 1: Direct execution
node /Users/iesouskurios/claude-config-protector/metrics-dashboard.js

# Option 2: Using npm script
cd /Users/iesouskurios/claude-config-protector
npm run dashboard

# Option 3: Using the bin command (if installed globally)
claude-metrics-dashboard
```

### Keyboard Shortcuts

- **q** or **Ctrl+C**: Quit the dashboard
- **1**: Switch to Overview tab
- **2**: Switch to Processes tab
- **3**: Switch to Conversation tab
- **4**: Switch to Logs tab
- **e**: Export current metrics to JSON file
- **r**: Refresh data manually
- **h**: Show help screen

### Auto-Refresh

The dashboard automatically refreshes data every 2 seconds, providing near real-time monitoring.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│      CLAUDE CONFIG PROTECTOR - METRICS DASHBOARD            │
├─────────────────────────────────────────────────────────────┤
│  1: Overview | 2: Processes | 3: Conversation | 4: Logs    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Config Health │  │Health Score  │  │Size Trend    │     │
│  │              │  │   ●●●●●      │  │    /\        │     │
│  │Size: 42KB    │  │   75%        │  │   /  \  /\   │     │
│  │Valid: ✓      │  │              │  │  /    \/  \  │     │
│  │Backups: 15   │  └──────────────┘  └──────────────┘     │
│  └──────────────┘                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ CPU Load                                           │    │
│  │  ████░░░░░░░░░░░░░░░░░░░░░░░░░░                   │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │Recent Activity       │  │Statistics                │   │
│  │• Backup created      │  │Total Backups: 15         │   │
│  │• Config checked      │  │Total Truncations: 2      │   │
│  │• Health verified     │  │Avg Backup Size: 14.4KB   │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [q]uit | [1-4]tabs | [e]xport | [r]efresh | [h]elp        │
└─────────────────────────────────────────────────────────────┘
```

## Data Collection

The dashboard collects and displays:

1. **Config Health Metrics**:
   - File size and validity
   - Backup count and timestamps
   - Health score calculation
   - Size history tracking

2. **Process Metrics**:
   - Protector running status
   - Process resource usage
   - System metrics

3. **Conversation Metrics**:
   - Project count and sizes
   - History and session data
   - Health recommendations

4. **Historical Data**:
   - Parsed from protector.log
   - Backup events
   - Truncation events
   - Recovery events
   - Error tracking

## Exporting Metrics

Press **e** to export current metrics to a JSON file. The export includes:

- Complete metrics snapshot
- Timestamp
- Summary statistics
- Health scores

Export files are saved to:
```
~/.claude-backups/metrics-export-<timestamp>.json
```

Example export structure:
```json
{
  "timestamp": "2025-11-10T12:00:00.000Z",
  "metrics": {
    "configHealth": { ... },
    "processes": { ... },
    "conversation": { ... },
    "system": { ... },
    "history": { ... },
    "stats": { ... }
  },
  "summary": {
    "configHealth": 85,
    "protectorStatus": "Running",
    "totalBackups": 15,
    "totalErrors": 0,
    "conversationHealth": "Healthy"
  }
}
```

## Health Scoring

The dashboard calculates health scores based on:

- **Config File Health (0-100)**:
  - 100: Optimal (valid, <60% of max size)
  - 85: Good (valid, 60-80% of max size)
  - 70: Warning (valid, >80% of max size)
  - 0: Critical (invalid/corrupted)

- **Conversation Health**:
  - Healthy: All metrics normal
  - Warning: Large conversations detected
  - Critical: Approaching config size limit

## Troubleshooting

### Dashboard won't start
```bash
# Check dependencies
cd /Users/iesouskurios/claude-config-protector
npm install

# Check Node.js version (requires >= 14.0.0)
node --version
```

### No data showing
- Ensure the protector has been run at least once
- Check that ~/.claude.json exists
- Verify ~/.claude-backups directory exists
- Ensure protector.log exists in ~/.claude-backups

### Terminal display issues
- Ensure your terminal supports 256 colors
- Resize terminal window (minimum 100x30 recommended)
- Try a different terminal emulator

### Process detection issues on Windows
- Windows support is limited for process detection
- Core metrics still work, but process details may be unavailable

## Advanced Usage

### Running alongside the protector

Terminal 1 (Protector):
```bash
node /Users/iesouskurios/claude-config-protector/protector.js
```

Terminal 2 (Dashboard):
```bash
node /Users/iesouskurios/claude-config-protector/metrics-dashboard.js
```

### Monitoring multiple systems

Export metrics periodically and aggregate:
```bash
# Create a monitoring script
while true; do
  echo "e" | timeout 5 node metrics-dashboard.js
  sleep 300  # Export every 5 minutes
done
```

### Custom refresh interval

Edit the `REFRESH_INTERVAL` constant in `metrics-dashboard.js`:
```javascript
const REFRESH_INTERVAL = 2000; // Change to desired ms
```

## Color Coding

- **Green**: Healthy status, successful operations
- **Yellow**: Warnings, high usage
- **Red**: Errors, critical status
- **Cyan**: Info, section headers
- **Blue**: Selected items, highlights
- **White**: Normal text, data values

## Performance

The dashboard is lightweight and designed for continuous operation:
- Memory usage: ~30-50MB
- CPU usage: <1% when idle
- Updates every 2 seconds by default
- Log parsing optimized for large files

## Integration with Protector

The dashboard reads:
- `/Users/iesouskurios/.claude.json` - Config file
- `/Users/iesouskurios/.claude-backups/` - Backup directory
- `/Users/iesouskurios/.claude-backups/protector.log` - Main log file

No modification to the protector is required. The dashboard is read-only and non-invasive.

## Future Enhancements

Potential features for future versions:
- Alert notifications
- Email/webhook integration
- Historical data persistence
- Custom metric thresholds
- Remote monitoring support
- Docker container metrics

## Support

For issues or questions:
- GitHub: https://github.com/jfuginay/claude-config-protector
- Report bugs in the issues section
- Include terminal output and metrics export when reporting issues

## License

MIT License - Same as Claude Config Protector

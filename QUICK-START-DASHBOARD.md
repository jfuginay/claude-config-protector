# Quick Start Guide - Metrics Dashboard

## Installation

Dependencies are already installed! Just run:

```bash
cd /Users/iesouskurios/claude-config-protector
node metrics-dashboard.js
```

## Alternative Launch Methods

```bash
# Using npm script
npm run dashboard

# Make it globally available (optional)
npm link
claude-metrics-dashboard
```

## First Launch

When you first run the dashboard, you'll see:

1. **Header**: Application title
2. **Tab Bar**: Four navigation tabs
3. **Main Content**: Overview of all metrics
4. **Footer**: Keyboard shortcuts

## Navigation Quick Reference

```
┌─────────────────────────────────────────────────┐
│  Press 1 → Overview (config health + stats)     │
│  Press 2 → Processes (protector + system)       │
│  Press 3 → Conversation (projects + health)     │
│  Press 4 → Logs (live log viewer)               │
│  Press e → Export metrics to JSON               │
│  Press r → Refresh now                          │
│  Press h → Show help                            │
│  Press q → Quit                                 │
└─────────────────────────────────────────────────┘
```

## What You'll See

### Tab 1: Overview
```
┌──────────────┬──────────────┬──────────────┐
│ Config       │ Health Score │ Size Trend   │
│ Health       │   85%        │   Chart      │
├──────────────┴──────────────┴──────────────┤
│ CPU Load Chart                             │
├────────────────────────────────────────────┤
│ Recent Activity    │ Statistics           │
└────────────────────┴─────────────────────  ┘
```

### Tab 2: Processes
```
┌──────────────────┬──────────┬────────────┐
│ Protector Status │ CPU %    │ System    │
│ • Running        │  2.5%    │ Info      │
│ • PID: 12345     │          │           │
│                  ├──────────┤           │
│                  │ Memory % │           │
│                  │  1.2%    │           │
├──────────────────┴──────────┴───────────┤
│ Running Processes Table                 │
└─────────────────────────────────────────┘
```

### Tab 3: Conversation
```
┌─────────────────┬─────────────┬─────────────┐
│ Conversation    │ Projects    │ Size        │
│ Statistics      │ Donut Chart │ Breakdown   │
├─────────────────┴─────────────┴─────────────┤
│ Recent Projects Table                       │
└─────────────────────────────────────────────┘
```

### Tab 4: Logs
```
┌──────────────────────────┬──────────────┐
│ Protector Log (Live)     │ Event        │
│ [timestamp] message      │ Timeline     │
│ [timestamp] message      │ • Backup     │
│ ...                      │ • Truncate   │
├──────────────────────────┴──────────────┤
│ Log Statistics (INFO/WARN/ERROR counts) │
└─────────────────────────────────────────┘
```

## Understanding the Metrics

### Config Health Score
- **100-85**: Excellent (green)
- **84-70**: Good (yellow)
- **69-50**: Warning (yellow)
- **Below 50**: Critical (red)

### Conversation Health
- **Healthy**: Normal operation
- **Warning**: Consider cleanup
- **Critical**: Action required

### Resource Usage
- CPU and Memory percentages
- System load averages
- Disk space usage

## Common Tasks

### Check if Protector is Running
1. Launch dashboard
2. Press `2` for Processes tab
3. Look for "Running: ✓ Active"

### View Recent Backups
1. Launch dashboard
2. Press `1` for Overview
3. Check "Recent Activity" panel

### Monitor Config Size
1. Launch dashboard
2. Press `1` for Overview
3. Watch "Size Trend" chart

### Check for Errors
1. Launch dashboard
2. Press `4` for Logs tab
3. Look for red ERROR messages

### Export Data
1. Press `e` at any time
2. File saved to: `~/.claude-backups/metrics-export-<timestamp>.json`

## Troubleshooting

### Dashboard shows "No data"
```bash
# Ensure protector has run at least once
node protector.js
# Wait 5 seconds, then Ctrl+C
# Now launch dashboard
node metrics-dashboard.js
```

### Terminal looks garbled
- Resize terminal to at least 100x30 characters
- Use a modern terminal emulator
- Ensure 256-color support

### Can't see charts
```bash
# Ensure dependencies installed
npm install
# Try again
node metrics-dashboard.js
```

## Tips

1. **Split Screen**: Run protector in one terminal, dashboard in another
2. **Auto-Export**: Dashboard auto-refreshes, but export manually for reports
3. **Size Monitoring**: Watch the size trend chart to catch growth early
4. **Health Checks**: Review conversation health recommendations regularly
5. **Log Analysis**: Use log statistics to track protector activity

## Example Session

```bash
# Terminal 1: Start protector
cd /Users/iesouskurios/claude-config-protector
node protector.js

# Terminal 2: Monitor with dashboard
cd /Users/iesouskurios/claude-config-protector
node metrics-dashboard.js

# In dashboard:
# - Press 1 to see overview
# - Press 2 to verify protector is running
# - Press 3 to check conversation health
# - Press 4 to view live logs
# - Press e to export metrics
# - Press q to quit
```

## Data Locations

All data comes from:
- Config: `~/.claude.json`
- Backups: `~/.claude-backups/`
- Logs: `~/.claude-backups/protector.log`
- Exports: `~/.claude-backups/metrics-export-*.json`

## Next Steps

After getting familiar with the dashboard:

1. Set up automated monitoring (run dashboard in background)
2. Export metrics regularly for trend analysis
3. Use conversation health recommendations
4. Monitor backup frequency
5. Watch for error patterns in logs

## Support

Issues? Check:
- Terminal size (100x30 minimum)
- Node.js version (>=14.0.0)
- Dependencies installed (`npm install`)
- Log files exist (`ls ~/.claude-backups/`)

For more details, see: `METRICS-DASHBOARD.md`

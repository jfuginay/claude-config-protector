# Claude Conversation Monitor

A real-time Terminal UI dashboard for monitoring Claude conversation health, token usage, and performance optimization opportunities.

## Features

### Real-Time Monitoring
- **Live Token Usage Tracking**: Monitors estimated token usage with visual progress bar
- **Dynamic Health Scoring**: Continuous health assessment (0-100 scale)
- **File Size Monitoring**: Tracks `.claude.json` growth and file size
- **Message Rate Detection**: Monitors conversation activity levels

### Visual Dashboard Components

#### 1. Token Usage Gauge
- Large, prominent gauge showing current token usage out of 200k limit
- Color-coded warnings:
  - **Green**: Healthy usage (< 70%)
  - **Yellow**: Warning zone (70-85%)
  - **Red**: Critical zone (> 85%)
- Real-time percentage updates

#### 2. Health Score Box
- Overall system health indicator (0-100)
- Visual emoji indicators:
  - 💚 HEALTHY (80-100)
  - 💛 GOOD (60-79)
  - ⚠️  WARNING (40-59)
  - 🔴 CRITICAL (< 40)
- Time since last compact
- Backup count display

#### 3. Statistics Panel
- File size (KB/MB)
- Last modified time
- Current/remaining token estimates
- Message and session counts
- Section breakdown
- Backup information

#### 4. Top Space Consumers
- Lists the 8 largest sections in `.claude.json`
- Visual bars showing relative sizes
- Size in KB and estimated token count
- Percentage of total space used
- Color-coded by impact (green/yellow/red)

#### 5. Timeline Chart
- Historical token usage trend graph
- Tracks last 60 minutes of data
- Time-series visualization
- Color-coded based on usage levels

#### 6. Alerts & Recommendations
- Proactive warnings about token limits
- Compaction suggestions with estimated savings
- File size warnings
- Health score degradation alerts
- Actionable optimization tips

## Installation

The monitor is automatically available after installing claude-config-protector:

```bash
cd /Users/iesouskurios/claude-config-protector
npm install
```

## Usage

### Starting the Monitor

Run directly:
```bash
node conversation-monitor.js
```

Or using npm script:
```bash
npm run conversation-monitor
```

Or if installed globally:
```bash
claude-conversation-monitor
```

### Keyboard Shortcuts

- **q** - Quit the monitor
- **c** - Show compaction guide with estimated savings
- **r** - Force refresh all statistics
- **h** - Toggle historical session view

## Understanding the Metrics

### Token Estimation
The monitor estimates token usage using the formula:
```
Estimated Tokens ≈ Total Characters / 4
```

This is a conservative estimate based on typical English text. Actual token usage may vary based on:
- Code vs natural language
- Special characters and formatting
- JSON structure overhead

### Health Score Calculation

The health score (0-100) considers multiple factors:

1. **Token Usage** (up to -40 points)
   - Critical usage (>85%): -40 points
   - Warning usage (>70%): -20 points
   - Moderate usage (>50%): -10 points

2. **File Size** (up to -20 points)
   - Very large (>4MB): -20 points
   - Large (>2MB): -10 points

3. **Time Since Compact** (up to -15 points)
   - Never compacted: -15 points
   - >48 hours: -15 points
   - >24 hours: -10 points

4. **Growth Rate** (up to -10 points)
   - Rapid growth (>10 msg/min): -10 points

### Alert Levels

- **CRITICAL**: Immediate action required
- **WARNING**: Action recommended soon
- **INFO**: Helpful suggestions for optimization

## Compaction Guide

When you press **'c'**, you'll see detailed information about compacting your conversation:

### What is Compaction?
Compaction is Claude's built-in feature to:
- Summarize conversation history
- Remove verbose details
- Preserve important context
- Free up token space

### How to Compact
Simply type in your Claude conversation:
```
/compact
```

### Expected Savings
- Typical savings: **30-40% of current tokens**
- Larger conversations see better compression
- Context is preserved intelligently

### When to Compact
- Token usage exceeds 70% (140k tokens)
- Before starting major new tasks
- Every 24-48 hours of active use
- When you notice slower responses

## Historical Data

The monitor maintains a history file at:
```
~/.claude-backups/monitor-history.json
```

This stores:
- Timeline data points (last 60 minutes)
- Session snapshots (every 5 minutes)
- Up to 100 historical sessions

Press **'h'** to view your session history.

## Understanding Space Consumers

The "Top Space Consumers" panel shows which sections of `.claude.json` are using the most space:

Common large sections:
- **projects**: Project-specific data and history
- **sessions**: Active conversation sessions
- **history**: Command and file history
- **tipsHistory**: Tip display tracking
- **cache**: Various cached data

## Performance Tips

### For Best Results
1. **Regular Compaction**: Compact every 24-48 hours
2. **Monitor Trends**: Watch the timeline for growth patterns
3. **Address Warnings Early**: Don't wait for critical alerts
4. **Clean Up Projects**: Remove old project data periodically

### What the Protector Does
The claude-config-protector service (separate from this monitor) automatically:
- Creates backups every hour
- Prevents file corruption
- Limits file size to 5MB
- Provides automatic recovery

The conversation monitor complements the protector by:
- Providing visibility into token usage
- Giving advance warning before limits
- Recommending optimal compact timing
- Tracking historical trends

## Troubleshooting

### Monitor Won't Start
```bash
# Check if dependencies are installed
cd /Users/iesouskurios/claude-config-protector
npm install

# Verify file permissions
chmod +x conversation-monitor.js
```

### Display Issues
- Ensure your terminal supports 256 colors
- Resize terminal if layout looks broken
- Minimum recommended size: 120x30 characters

### No Data Showing
- Ensure `.claude.json` exists at `~/.claude.json`
- Check file permissions (should be readable)
- Verify the file contains valid JSON

### Inaccurate Token Estimates
Token estimates are approximations. Factors affecting accuracy:
- Code-heavy content uses more tokens
- Special formatting and JSON overhead
- Different languages have different token ratios

For precise token counts, consult Claude directly.

## Technical Details

### Update Frequency
- Dashboard refreshes: Every 2 seconds
- History snapshots: Every 5 minutes
- Timeline data points: Every 60 seconds

### Data Storage
- History file: `~/.claude-backups/monitor-history.json`
- Automatic persistence on exit
- Automatic cleanup (keeps last 60 timeline points, 100 sessions)

### Resource Usage
- Minimal CPU impact (< 1%)
- Low memory footprint (~ 30-50MB)
- Non-intrusive monitoring (read-only)

## Integration with Claude Config Protector

This monitor is part of the claude-config-protector ecosystem:

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **protector.js** | Automatic protection daemon | Always running in background |
| **conversation-monitor.js** | Interactive monitoring UI | When you want visibility |
| **cli.js** | Command-line management | For quick status checks |
| **fix-config.js** | Emergency recovery | When corruption occurs |

Run them together:
```bash
# Terminal 1: Protection daemon
claude-config-protector start

# Terminal 2: Interactive monitor
node conversation-monitor.js
```

## FAQ

**Q: Does this affect Claude's performance?**
A: No, the monitor is read-only and runs separately from Claude.

**Q: How accurate are the token estimates?**
A: Typically within 10-15% of actual usage. They're intentionally conservative.

**Q: Can I monitor multiple conversations?**
A: Currently monitors the default `.claude.json` file. Multiple conversation support coming soon.

**Q: Does this work with Claude Code?**
A: Yes! It's specifically designed for Claude Code's configuration format.

**Q: What's the difference between this and `/usage`?**
A: This provides continuous monitoring, historical trends, and proactive alerts. `/usage` gives a one-time snapshot.

## Future Enhancements

Planned features:
- [ ] Multi-conversation support
- [ ] Custom alert thresholds
- [ ] Export metrics to CSV/JSON
- [ ] Web-based dashboard option
- [ ] Integration with system notifications
- [ ] Automated compaction suggestions
- [ ] Machine learning growth predictions

## Contributing

Found a bug or have a feature request? Open an issue on the GitHub repository.

## License

MIT License - See LICENSE file for details

---

**Made with ❤️ for Claude Code users**

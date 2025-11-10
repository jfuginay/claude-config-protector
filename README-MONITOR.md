# Conversation Monitor - Complete Guide

> A real-time Terminal UI dashboard for monitoring Claude conversation health, token usage, and optimization opportunities.

## Quick Start

```bash
cd /Users/iesouskurios/claude-config-protector
node conversation-monitor.js
```

**Keyboard shortcuts:** `q` quit | `c` compact info | `r` refresh | `h` history

---

## What It Does

The Conversation Monitor provides real-time visibility into your Claude Code conversation health with:

### Core Features
- **Token Usage Tracking**: Live estimation with visual progress bar (0-200k limit)
- **Health Scoring**: 0-100 composite score considering multiple factors
- **Space Analysis**: Identifies which sections consume the most tokens
- **Historical Trends**: 60-minute rolling timeline chart
- **Proactive Alerts**: Warns before hitting limits
- **Compaction Guide**: Step-by-step instructions with savings estimates

### Dashboard Components

1. **Token Gauge** - Large, color-coded usage indicator
2. **Health Box** - Overall system health with emoji indicators
3. **Statistics Panel** - Detailed metrics and counts
4. **Top Consumers** - Bar charts of largest sections
5. **Timeline Chart** - Historical usage trends
6. **Alerts Panel** - Actionable recommendations

---

## Installation

Already installed with claude-config-protector! Dependencies included:
- `blessed` - Terminal UI framework
- `blessed-contrib` - Charts and graphs

If needed:
```bash
cd /Users/iesouskurios/claude-config-protector
npm install
```

---

## Usage

### Basic Usage
```bash
# Run directly
node conversation-monitor.js

# Or via npm
npm run conversation-monitor

# Test setup
node test-monitor.js
```

### Keyboard Controls
| Key | Action |
|-----|--------|
| `q` | Quit monitor |
| `c` | Show compaction guide with savings estimate |
| `r` | Force refresh of all data |
| `h` | Toggle historical session view |

### Running with Protector
```bash
# Terminal 1: Protection daemon
claude-config-protector start

# Terminal 2: Monitor dashboard
node conversation-monitor.js
```

---

## Understanding Metrics

### Token Estimation
```
Estimated Tokens = Total Characters ÷ 4
```
Conservative estimate for English text. Actual usage varies by:
- Content type (code vs text)
- JSON structure overhead
- Special characters

Typical accuracy: ±10-15%

### Health Score (0-100)

Calculated from:
- **Token usage** (0-40 point penalty)
  - Critical >85%: -40 pts
  - Warning >70%: -20 pts
  - Moderate >50%: -10 pts
- **File size** (0-20 point penalty)
  - >4MB: -20 pts
  - >2MB: -10 pts
- **Time since compact** (0-15 point penalty)
  - Never: -15 pts
  - >48h: -15 pts
  - >24h: -10 pts
- **Growth rate** (0-10 point penalty)
  - Rapid (>10 msg/min): -10 pts

### Status Indicators

| Score | Status | Emoji | Meaning |
|-------|--------|-------|---------|
| 80-100 | HEALTHY | 💚 | Optimal performance |
| 60-79 | GOOD | 💛 | Monitor trends |
| 40-59 | WARNING | ⚠️  | Action recommended |
| 0-39 | CRITICAL | 🔴 | Immediate attention |

### Color Coding

**Gauge Colors:**
- 🟢 Green: 0-70% (safe)
- 🟡 Yellow: 70-85% (warning)
- 🔴 Red: 85-100% (critical)

**Consumer Bars:**
- 🟢 Green: <15% of total
- 🟡 Yellow: 15-30% of total
- 🔴 Red: >30% of total

---

## When to Compact

### Automatic Recommendations
The monitor suggests compacting when:
1. Token usage exceeds 70% (140k tokens)
2. Health score drops below 70
3. File size exceeds 2MB
4. 48+ hours since last compact
5. Rapid growth detected

### Manual Judgment
Also consider compacting:
- Before starting major new tasks
- At natural break points (lunch, end of day)
- When responses feel slower
- After extended coding sessions

### How to Compact
Press `c` in the monitor for detailed guide, or simply:
```
/compact
```
in your Claude conversation.

### Expected Results
- **Typical savings**: 30-40% of tokens
- **Time required**: 10-30 seconds
- **Context preserved**: Yes, intelligently
- **Continuity maintained**: Yes

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Config | `~/.claude.json` | Monitored file |
| Backups | `~/.claude-backups/` | Backup storage |
| History | `~/.claude-backups/monitor-history.json` | Trend data |
| Monitor | `/Users/iesouskurios/claude-config-protector/conversation-monitor.js` | Main script |

---

## Data Collection

### Update Frequencies
- **Dashboard refresh**: 2 seconds
- **Timeline points**: 60 seconds
- **History snapshots**: 5 minutes
- **Auto-save**: 60 seconds

### Data Retention
- **Timeline**: Last 60 points (1 hour)
- **Sessions**: Last 100 snapshots
- **Storage**: ~10-50KB total

### Privacy
- All data stored locally
- No external connections
- Read-only monitoring
- Optional history deletion

---

## Troubleshooting

### Problem: Monitor Won't Start
```bash
# Check dependencies
npm install

# Verify file exists
ls -lh conversation-monitor.js

# Check executable
chmod +x conversation-monitor.js

# Run test
node test-monitor.js
```

### Problem: No Data Showing
- Ensure `.claude.json` exists (start Claude Code first)
- Check file permissions
- Verify valid JSON: `cat ~/.claude.json | jq .`

### Problem: Display Issues
- Resize terminal (minimum 120x30)
- Ensure 256-color support
- Try different terminal emulator

### Problem: Inaccurate Numbers
- Token estimates are approximations
- Press `r` to force refresh
- Compare with Claude's `/usage` command

### Problem: High CPU Usage
- Normal: <1% CPU
- If high: restart monitor
- Check for terminal issues

---

## Advanced Features

### Historical Analysis
Press `h` to view:
- Last 20 session snapshots
- Time-stamped entries
- Token usage progression
- Message counts over time

Use to:
- Identify growth patterns
- Verify compaction effects
- Plan future compactions
- Understand usage trends

### Space Consumers
Top consumers panel shows:
- Section names from `.claude.json`
- Relative size bars
- KB and token estimates
- Percentage of total

Common large sections:
- `projects`: Project data and history
- `sessions`: Active conversations
- `tipsHistory`: Tip tracking
- `history`: Command/file history

### Timeline Chart
Shows 60-minute rolling window of:
- Token count over time
- Growth patterns
- Compaction events (sudden drops)
- Usage trends

Useful for:
- Predicting when to compact
- Identifying usage spikes
- Validating growth rates
- Planning work sessions

---

## Integration

### With Claude Config Protector
```bash
# Both running
claude-config-protector start    # Background protection
node conversation-monitor.js     # Foreground monitoring
```

Benefits:
- Automatic backups + visibility
- Protection + optimization
- Recovery + prevention

### With Development Workflow
```bash
# Morning routine
node test-monitor.js              # Verify setup
node conversation-monitor.js      # Start monitoring

# During development
# Keep monitor visible in separate terminal
# Glance occasionally for status

# Before breaks
# Check status
# Compact if yellow/red

# End of day
# Review timeline
# Compact if >60% for fresh start
```

---

## Best Practices

### Daily Routine
1. **Morning**: Start monitor, check status
2. **Active work**: Keep monitor visible
3. **Breaks**: Glance at trends
4. **Compact at 70%**: Don't wait for red
5. **End of day**: Final check and compact if needed

### Optimal Usage
- ✅ Run monitor during active development
- ✅ Compact proactively at 70%
- ✅ Watch timeline for patterns
- ✅ Check before big tasks
- ✅ Review history periodically

### What to Avoid
- ❌ Waiting until critical (>85%)
- ❌ Ignoring yellow warnings
- ❌ Never compacting
- ❌ Compacting too frequently (<12h)
- ❌ Running multiple monitors

### Performance Tips
1. Regular compaction (every 24-48h)
2. Monitor trends, not just snapshots
3. Address warnings early
4. Clean up old project data
5. Use with protector daemon

---

## Examples & Scenarios

See `EXAMPLES.md` for detailed walkthroughs of:
- Healthy conversation state
- Warning state → compaction
- Critical state → recovery
- Post-compact analysis
- Daily usage patterns
- Growth trend analysis
- Historical session review
- Space consumer optimization

---

## Technical Details

### System Requirements
- Node.js ≥14.0.0
- Terminal with 256 colors
- Minimum 120x30 terminal size
- macOS, Linux, or WSL

### Dependencies
- `blessed@^0.1.81` - Terminal UI
- `blessed-contrib@^4.11.0` - Charts/graphs

### Resource Usage
- CPU: <1% average
- Memory: 30-50MB
- Disk: Negligible (<1MB)
- Network: None (fully local)

### Compatibility
- ✅ macOS (tested)
- ✅ Linux (tested)
- ✅ WSL (should work)
- ❌ Windows CMD (use WSL)
- ✅ iTerm2, Terminal.app, etc.

---

## Documentation

| Document | Purpose |
|----------|---------|
| `README-MONITOR.md` | This file - complete guide |
| `CONVERSATION-MONITOR.md` | Detailed feature documentation |
| `QUICKSTART-MONITOR.md` | Fast-start guide |
| `EXAMPLES.md` | Real-world usage scenarios |

---

## FAQ

**Q: Does this slow down Claude?**
A: No, it's read-only and runs separately.

**Q: How accurate are token estimates?**
A: Typically ±10-15% of actual usage.

**Q: Can I run multiple monitors?**
A: Technically yes, but unnecessary.

**Q: Does it work with Claude Code?**
A: Yes, specifically designed for it!

**Q: What about Claude Desktop?**
A: Different config format, not compatible.

**Q: Is my data sent anywhere?**
A: No, fully local monitoring only.

**Q: Can I customize thresholds?**
A: Not yet, coming in future updates.

**Q: Does it auto-compact?**
A: No, it only recommends. You run `/compact`.

**Q: What's different from `/usage`?**
A: Continuous monitoring, trends, alerts, history.

**Q: Can I export the data?**
A: History stored in JSON, can be parsed.

---

## Support & Contributing

### Get Help
- Check documentation files
- Run `node test-monitor.js`
- Review `EXAMPLES.md` scenarios
- Check GitHub issues

### Report Issues
- Include `node test-monitor.js` output
- Describe expected vs actual behavior
- Share relevant screenshots
- Note your OS and terminal

### Feature Requests
Future enhancements planned:
- Custom alert thresholds
- Multiple conversation support
- CSV/JSON export
- Web dashboard
- System notifications
- Auto-compact suggestions
- ML-based predictions

---

## License

MIT License - See LICENSE file

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│         CONVERSATION MONITOR QUICK REFERENCE         │
├─────────────────────────────────────────────────────┤
│ START                                                │
│   node conversation-monitor.js                       │
│                                                      │
│ CONTROLS                                             │
│   q - quit      c - compact info                     │
│   r - refresh   h - history                          │
│                                                      │
│ STATUS COLORS                                        │
│   💚 Green (80-100)  - Healthy                       │
│   💛 Yellow (60-79)  - Good                          │
│   ⚠️  Yellow (40-59)  - Warning                      │
│   🔴 Red (0-39)      - Critical                      │
│                                                      │
│ WHEN TO COMPACT                                      │
│   • Usage > 70% (140k tokens)                       │
│   • Health < 70                                      │
│   • Time since compact > 48h                        │
│   • Before major tasks                              │
│                                                      │
│ HOW TO COMPACT                                       │
│   Type in Claude: /compact                           │
│                                                      │
│ FILES                                                │
│   Config:  ~/.claude.json                           │
│   Backups: ~/.claude-backups/                       │
│   History: ~/.claude-backups/monitor-history.json   │
└─────────────────────────────────────────────────────┘
```

---

**Happy Monitoring! Keep your conversations healthy!** 💚

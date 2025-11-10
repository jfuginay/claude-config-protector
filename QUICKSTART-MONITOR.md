# Quick Start: Conversation Monitor

## Instant Start

```bash
cd /Users/iesouskurios/claude-config-protector
node conversation-monitor.js
```

## What You'll See

```
┌────────────────────────────────────────────────────┐
│                  Token Usage                       │
│  ████████████████████░░░░░░░░░░░░ 65.3%          │
│  130,600 / 200,000 tokens                         │
└────────────────────────────────────────────────────┘

┌─ System Health ────────────┐  ┌─ Statistics ──────┐
│     💚 HEALTHY              │  │ Size: 45.2 KB     │
│                             │  │ Tokens: 130,600   │
│  Health Score: 85/100       │  │ Usage: 65.3%      │
│  Last Compact: 6h 23m       │  │ Messages: 247     │
│  Backups: 8                 │  │ Sessions: 5       │
└─────────────────────────────┘  └───────────────────┘

┌─ Top Space Consumers ──────────────────────────────┐
│ 1. projects                                        │
│    ██████████████████████████░░░░ 62.3%          │
│    28.2 KB (~7,050 tokens)                        │
│                                                    │
│ 2. tipsHistory                                     │
│    ████████░░░░░░░░░░░░░░░░░░░░░░ 18.5%          │
│    8.4 KB (~2,100 tokens)                         │
└────────────────────────────────────────────────────┘

┌─ Token Usage Trend (Last 60 Minutes) ─────────────┐
│                                                    │
│  140k ┤                                    ╭─     │
│  120k ┤                             ╭──────╯      │
│  100k ┤                      ╭──────╯             │
│   80k ┤              ╭───────╯                    │
│   60k ┼──────────────╯                            │
│        12:00  12:15  12:30  12:45  13:00         │
└────────────────────────────────────────────────────┘

┌─ Alerts & Recommendations ─────────────────────────┐
│ ℹ️  Last compact was 6 hours ago.                  │
│    → Regular compaction maintains performance      │
│                                                    │
│        Press 'c' to see how to compact            │
└────────────────────────────────────────────────────┘

[q] Quit  [c] Compact Info  [r] Refresh  [h] History
```

## Key Features at a Glance

### 1. Real-Time Token Tracking
- **Color-Coded Gauge**: Green (safe) → Yellow (warning) → Red (critical)
- **Live Updates**: Refreshes every 2 seconds
- **Precise Estimates**: Within 10-15% of actual usage

### 2. Health Monitoring
- **Smart Scoring**: Considers usage, size, time since compact
- **Visual Indicators**: Emoji + color coding for instant status
- **Proactive Alerts**: Warns before problems occur

### 3. Space Analysis
- **Top Consumers**: See what's using the most space
- **Visual Bars**: Easy-to-read progress bars
- **Token Breakdown**: KB and token estimates for each section

### 4. Historical Trends
- **Timeline Chart**: 60-minute rolling window
- **Growth Patterns**: Identify usage spikes
- **Session History**: Press 'h' to see past sessions

### 5. Actionable Recommendations
- **Compact Suggestions**: When to compact and why
- **Estimated Savings**: See potential token recovery
- **Step-by-Step Guide**: Press 'c' for detailed instructions

## Common Scenarios

### Scenario 1: Everything Looks Good
```
Status: 💚 HEALTHY
Health: 85/100
Usage: 45.2%
Action: None needed - keep monitoring
```

### Scenario 2: Time to Compact
```
Status: ⚠️  WARNING
Health: 62/100
Usage: 73.8%
Action: Press 'c' and follow compact guide
Expected Savings: ~30-40% tokens
```

### Scenario 3: Critical State
```
Status: 🔴 CRITICAL
Health: 35/100
Usage: 89.5%
Action: Compact IMMEDIATELY
         Type /compact in Claude
Expected Recovery: ~60,000 tokens
```

## Keyboard Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| **q** | Quit | Close the monitor |
| **c** | Compact Info | See detailed compaction guide with savings estimate |
| **r** | Refresh | Force immediate data refresh |
| **h** | History | View past session snapshots (last 20 sessions) |

## Understanding the Colors

### Gauge Colors
- **Green**: Healthy usage (0-70%)
- **Yellow**: Warning zone (70-85%)
- **Red**: Critical zone (85-100%)

### Health Status
- **💚 Green (80-100)**: Excellent health
- **💛 Yellow (60-79)**: Good, monitor trends
- **⚠️  Yellow (40-59)**: Action recommended
- **🔴 Red (<40)**: Immediate attention needed

### Space Consumer Colors
- **Green**: Normal section size (<15%)
- **Yellow**: Large section (15-30%)
- **Red**: Very large section (>30%)

## When to Compact

The monitor will recommend compacting when:

1. **Token usage > 70%** (140,000 tokens)
2. **Health score < 70**
3. **File size > 2MB**
4. **48+ hours since last compact**
5. **Rapid growth detected**

### How to Compact

Just type in your Claude conversation:
```
/compact
```

Claude will:
- Summarize conversation history
- Preserve important context
- Free up 30-40% of tokens
- Keep conversation continuity

## Tips for Best Results

### Monitor Regularly
- Leave it running in a terminal tab
- Check before starting big tasks
- Watch trends during heavy usage

### Compact Proactively
- Don't wait for red alerts
- Compact at 70% usage
- Compact before major work sessions
- Compact every 24-48 hours

### Use with Protector
Run both for complete protection:
```bash
# Terminal 1: Protection daemon
claude-config-protector start

# Terminal 2: Monitor dashboard
node conversation-monitor.js
```

## Troubleshooting Quick Fixes

### Problem: "Config file not found"
**Solution**: Claude hasn't created `.claude.json` yet. Start a Claude conversation first.

### Problem: Display looks broken
**Solution**: Resize your terminal to at least 120x30 characters.

### Problem: Numbers seem wrong
**Solution**: Token estimates are approximations. Press 'r' to refresh for latest data.

### Problem: No historical data
**Solution**: The monitor needs to run for a few minutes to collect trend data.

## Integration Examples

### Run with npm
```bash
npm run conversation-monitor
```

### Background Protection + Live Monitor
```bash
# Start protector in background
claude-config-protector start &

# Run monitor in foreground
node conversation-monitor.js
```

### Check Before Heavy Work
```bash
# Quick status check
node conversation-monitor.js

# Start work if green/yellow
# Compact if red
```

## Next Steps

1. **Try It Now**: Start the monitor and explore
2. **Watch Trends**: Let it run for 15-30 minutes
3. **Test Compaction**: Press 'c' to learn how
4. **Check History**: Press 'h' after a few sessions
5. **Read Full Docs**: See CONVERSATION-MONITOR.md for details

## Help & Support

### Documentation
- **Full Guide**: `CONVERSATION-MONITOR.md`
- **Protector Docs**: `README.md`

### Common Commands
```bash
# Start monitor
node conversation-monitor.js

# Install/update dependencies
npm install

# Check installation
ls -lh conversation-monitor.js

# View source
cat conversation-monitor.js
```

### Key Concepts
- **Token**: ~4 characters of text
- **Context Window**: 200,000 token limit
- **Compaction**: Claude's built-in optimization
- **Health Score**: Composite metric (0-100)

---

**Ready to start?**
```bash
node conversation-monitor.js
```

Press 'q' anytime to exit. Have fun monitoring!

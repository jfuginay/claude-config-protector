# Conversation Monitor - Usage Examples

This document shows real-world usage scenarios and examples of the conversation monitor in action.

## Example 1: Healthy Conversation

### Scenario
You've been using Claude Code for a few hours, working on a small project. Everything is running smoothly.

### What the Monitor Shows

```
┌─────────────────────────────────────────────────────┐
│                  Token Usage                        │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░ 42.3%        │
│  84,600 / 200,000 tokens                            │
└─────────────────────────────────────────────────────┘

┌─ System Health ────────────┐
│     💚 HEALTHY              │
│                             │
│  Health Score: 92/100       │
│  Last Compact: 4h 15m       │
│  Backups: 7                 │
└─────────────────────────────┘

┌─ Alerts & Recommendations ─────────────────┐
│  ✓ All systems healthy!                    │
│                                             │
│  No alerts or recommendations at this time. │
│  Your conversation is running optimally.    │
└─────────────────────────────────────────────┘
```

### Interpretation
- **Green gauge**: Usage well below warning threshold
- **High health score**: No issues detected
- **No alerts**: Continue working normally
- **Action**: None needed, keep monitoring

---

## Example 2: Warning State - Time to Consider Compacting

### Scenario
You've been working intensively for a full day. Token usage is climbing, and you're starting to see yellow warnings.

### What the Monitor Shows

```
┌─────────────────────────────────────────────────────┐
│                  Token Usage                        │
│  ████████████████████████████░░░░░░ 72.5%          │
│  145,000 / 200,000 tokens                           │
└─────────────────────────────────────────────────────┘

┌─ System Health ────────────┐
│     ⚠️  WARNING             │
│                             │
│  Health Score: 65/100       │
│  Last Compact: 28h 42m      │
│  Backups: 10                │
└─────────────────────────────┘

┌─ Top Space Consumers ──────────────────────┐
│ 1. projects                                 │
│    ████████████████████████████░░ 68.2%    │
│    62.4 KB (~15,600 tokens)                │
│                                             │
│ 2. sessions                                 │
│    ████████░░░░░░░░░░░░░░░░░░░░ 22.1%     │
│    20.2 KB (~5,050 tokens)                 │
└─────────────────────────────────────────────┘

┌─ Alerts & Recommendations ─────────────────┐
│ ⚠️  [WARNING] Token usage at 72.5%.        │
│    → Consider compacting soon              │
│    → Estimated savings: ~43,500 tokens     │
│                                             │
│ ℹ️  Last compact was 28 hours ago.         │
│    → Regular compaction maintains          │
│       optimal performance                   │
│                                             │
│        Press 'c' to see how to compact     │
└─────────────────────────────────────────────┘
```

### Interpretation
- **Yellow gauge**: Approaching 75% threshold
- **Warning status**: Action recommended soon
- **Large project section**: Main space consumer
- **28+ hours since compact**: Due for maintenance

### Recommended Action
1. Press **'c'** to see compaction guide
2. Type `/compact` in your Claude conversation
3. Expected savings: ~30-40% (43,500 tokens)
4. New usage would be: ~50-55%

---

## Example 3: Critical State - Immediate Action Required

### Scenario
You've been working on a complex, multi-day project. Token usage has reached critical levels, and the system is at risk of hitting the context limit.

### What the Monitor Shows

```
┌─────────────────────────────────────────────────────┐
│                  Token Usage                        │
│  ██████████████████████████████████████░ 88.7%     │
│  177,400 / 200,000 tokens                           │
└─────────────────────────────────────────────────────┘

┌─ System Health ────────────┐
│     🔴 CRITICAL             │
│                             │
│  Health Score: 28/100       │
│  Last Compact: Never        │
│  Backups: 10                │
└─────────────────────────────┘

┌─ Statistics ───────────────┐
│ Size: 156.8 KB             │
│ Tokens: 177,400            │
│ Usage: 88.7%               │
│ Remaining: 22,600          │
│ Messages: 892              │
│ Sessions: 12               │
└────────────────────────────┘

┌─ Top Space Consumers ──────────────────────┐
│ 1. projects                                 │
│    ██████████████████████████████ 72.8%    │
│    114.2 KB (~28,550 tokens)               │
│                                             │
│ 2. sessions                                 │
│    ████████████░░░░░░░░░░░░░░░░ 18.5%     │
│    29.0 KB (~7,250 tokens)                 │
│                                             │
│ 3. tipsHistory                              │
│    ████░░░░░░░░░░░░░░░░░░░░░░░░░ 5.2%     │
│    8.2 KB (~2,050 tokens)                  │
└─────────────────────────────────────────────┘

┌─ Alerts & Recommendations ─────────────────┐
│ 🔴 [CRITICAL] Token usage at 88.7%!        │
│    → IMMEDIATE compaction recommended      │
│    → Compacting could free up             │
│       ~70,960 tokens                       │
│                                             │
│ ⚠️  [WARNING] Config file size (156.8 KB)  │
│    → Risk of performance degradation       │
│                                             │
│ ℹ️  No compaction detected in history.     │
│    → Run /compact to optimize your         │
│       conversation                          │
│                                             │
│ ℹ️  Section "projects" uses 72.8% of       │
│    total space.                             │
│    → This section may benefit from cleanup │
│                                             │
│        Press 'c' to see how to compact     │
└─────────────────────────────────────────────┘
```

### Interpretation
- **Red gauge**: Dangerously close to 200k limit
- **Critical health**: Multiple severe issues
- **Never compacted**: Conversation has grown unchecked
- **Only 22,600 tokens left**: Could run out soon

### Immediate Action Required
1. **STOP** adding more complex tasks
2. Press **'c'** for compaction guide
3. Type `/compact` in Claude **RIGHT NOW**
4. Expected recovery: 70,960 tokens (40%)
5. After compact: ~106,440 tokens (53% usage)

---

## Example 4: Post-Compact Recovery

### Scenario
You just ran `/compact` after seeing critical warnings. Here's what the monitor shows after compaction.

### Before Compaction
```
Token Usage: 177,400 / 200,000 (88.7%)
Health Score: 28/100
Status: 🔴 CRITICAL
```

### After Compaction
```
┌─────────────────────────────────────────────────────┐
│                  Token Usage                        │
│  ████████████████░░░░░░░░░░░░░░░░░░░░ 51.2%        │
│  102,400 / 200,000 tokens                           │
└─────────────────────────────────────────────────────┘

┌─ System Health ────────────┐
│     💛 GOOD                 │
│                             │
│  Health Score: 88/100       │
│  Last Compact: Just now     │
│  Backups: 11                │
└─────────────────────────────┘

┌─ Statistics ───────────────┐
│ Size: 92.4 KB (-41%)       │
│ Tokens: 102,400 (-42%)     │
│ Usage: 51.2%               │
│ Remaining: 97,600          │
│ Messages: 892              │
└────────────────────────────┘

┌─ Alerts & Recommendations ─────────────────┐
│  ✓ All systems healthy!                    │
│                                             │
│  Recent compaction freed 75,000 tokens!    │
│  Your conversation is running optimally.    │
│                                             │
│  Continue monitoring for best performance.  │
└─────────────────────────────────────────────┘
```

### Results
- **Tokens recovered**: 75,000 (42% reduction)
- **New usage**: 51.2% (was 88.7%)
- **Health improved**: 28 → 88 (60 points)
- **Status**: Critical → Good
- **Space freed**: 64.4 KB

---

## Example 5: Monitoring During Active Development

### Scenario
You're actively coding with Claude. The monitor shows real-time growth patterns.

### Timeline View (Press 'h')

```
┌─ Token Usage Trend (Last 60 Minutes) ─────┐
│                                             │
│  110k ┤                                ╭─  │
│  105k ┤                           ╭────╯   │
│  100k ┤                      ╭────╯        │
│   95k ┤                 ╭────╯             │
│   90k ┼─────────────────╯                  │
│        13:00  13:15  13:30  13:45  14:00  │
└─────────────────────────────────────────────┘
```

### Interpretation
- **Steady growth**: ~500 tokens per 15 minutes
- **No spikes**: Healthy, normal usage pattern
- **Projection**: Will hit 70% in ~3 hours
- **Action**: Schedule compact in 2-3 hours

### Growth Rate Alert
```
ℹ️  Growth rate: ~2,000 tokens/hour
   → At this rate, you'll reach 70% in 3.2 hours
   → Consider compacting before starting the next
     major feature
```

---

## Example 6: Historical Session View

### Press 'h' to See Session History

```
┌─ Historical Sessions ──────────────────────┐
│                                             │
│  Session History                            │
│                                             │
│  1. 2025-11-10 14:23:45                    │
│     Tokens: 102,400 (51.2%)                │
│     Messages: 892                           │
│                                             │
│  2. 2025-11-10 14:18:12                    │
│     Tokens: 177,400 (88.7%)                │
│     Messages: 892                           │
│                                             │
│  3. 2025-11-10 13:42:30                    │
│     Tokens: 165,200 (82.6%)                │
│     Messages: 834                           │
│                                             │
│  4. 2025-11-10 13:15:18                    │
│     Tokens: 152,800 (76.4%)                │
│     Messages: 776                           │
│                                             │
│  5. 2025-11-10 12:50:45                    │
│     Tokens: 138,600 (69.3%)                │
│     Messages: 712                           │
│                                             │
│  [ESC/q/h to close]                        │
└─────────────────────────────────────────────┘
```

### Analysis
- **Session 2 → 1**: Compaction event! 75,000 tokens freed
- **Sessions 3-5**: Steady growth before compact
- **Message count**: Same after compact (context preserved)
- **Pattern**: Growing ~13,000 tokens per 30 minutes

---

## Example 7: Compact Information Dialog

### Press 'c' for Detailed Compaction Guide

```
┌─ How to Compact Your Conversation ─────────┐
│                                             │
│  Conversation Compaction Guide              │
│                                             │
│  Current Status:                            │
│    Tokens: 145,000 / 200,000               │
│    Usage: 72.5%                            │
│                                             │
│  Estimated After Compact:                   │
│    Tokens: 94,250 / 200,000                │
│    Savings: ~50,750 tokens (35.0%)         │
│    New Usage: 47.1%                        │
│                                             │
│  How to Compact:                            │
│                                             │
│    1. In your Claude conversation, type:    │
│       /compact                              │
│                                             │
│    2. Claude will summarize and compress   │
│       the conversation history              │
│                                             │
│    3. This removes verbose details while   │
│       preserving context                    │
│                                             │
│  Benefits of Compacting:                    │
│    • Frees up token space                  │
│    • Improves response speed               │
│    • Reduces memory usage                  │
│    • Maintains conversation continuity     │
│    • Prevents hitting context limits       │
│                                             │
│  When to Compact:                           │
│    • When usage exceeds 70%                │
│    • Before starting major new tasks       │
│    • Every 24-48 hours of active use       │
│    • When responses become slower          │
│                                             │
│  Alternative Options:                       │
│    • /summary - Brief summary only         │
│    • /clear - Start fresh (loses context)  │
│    • Manual cleanup - Remove old data      │
│                                             │
│  [ESC/q to close]                          │
└─────────────────────────────────────────────┘
```

---

## Example 8: Multiple Sessions in One Day

### Morning Session (9:00 AM)
```
Status: 💚 HEALTHY
Tokens: 45,200 (22.6%)
Health: 95/100
Action: None needed
```

### Midday Session (1:00 PM)
```
Status: 💛 GOOD
Tokens: 112,800 (56.4%)
Health: 78/100
Action: Monitor trends
```

### Afternoon Session (5:00 PM)
```
Status: ⚠️  WARNING
Tokens: 148,600 (74.3%)
Health: 62/100
Action: Compact recommended
```

### After Compact (5:15 PM)
```
Status: 💚 HEALTHY
Tokens: 92,400 (46.2%)
Health: 90/100
Action: Continue working
```

### End of Day (9:00 PM)
```
Status: 💛 GOOD
Tokens: 126,500 (63.3%)
Health: 82/100
Action: Ready for tomorrow
```

---

## Example 9: Identifying Space Consumers

### Top Consumers Analysis

```
┌─ Top Space Consumers ──────────────────────┐
│                                             │
│ 1. projects                                 │
│    ██████████████████████████░░ 65.2%      │
│    58.2 KB (~14,550 tokens)                │
│    → Largest consumer, multiple projects   │
│                                             │
│ 2. sessions                                 │
│    ████████░░░░░░░░░░░░░░░░░░░░ 20.3%     │
│    18.2 KB (~4,550 tokens)                 │
│    → Active conversation history           │
│                                             │
│ 3. tipsHistory                              │
│    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░ 8.1%     │
│    7.2 KB (~1,800 tokens)                  │
│    → Can be cleaned manually               │
│                                             │
│ 4. fileHistory                              │
│    █░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 3.5%     │
│    3.1 KB (~775 tokens)                    │
│    → Recent file access history            │
│                                             │
│ 5. commandHistory                           │
│    █░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 2.9%     │
│    2.6 KB (~650 tokens)                    │
│    → Bash command history                  │
└─────────────────────────────────────────────┘
```

### What This Tells You
- **Projects dominate**: Normal for active development
- **Sessions next**: Active conversation data
- **Tips history**: Low impact but can be cleared
- **File/command history**: Minimal impact

### Optimization Strategy
1. **Compact** to reduce projects section (30-40%)
2. Consider **manual cleanup** of tipsHistory
3. **File/command history** can be ignored (small)

---

## Example 10: Best Practices in Action

### Daily Routine with Monitor

#### Morning Startup (9:00 AM)
```bash
# Terminal 1: Start protector
claude-config-protector start

# Terminal 2: Start monitor
node conversation-monitor.js
```

Check status:
- Green? Good to start working
- Yellow? Note when to compact
- Red? Compact before starting

#### Mid-Session Check (12:00 PM)
- Quick glance at monitor
- Check growth rate
- Plan afternoon accordingly

#### Pre-Lunch Compact (12:30 PM)
If usage > 70%:
```
/compact
```
Good breaking point for compaction

#### Afternoon Development (2:00 PM - 5:00 PM)
- Monitor running in background
- Watch for yellow warnings
- Compact if approaching 75%

#### End of Day (6:00 PM)
- Final status check
- Compact if > 60% for fresh start tomorrow
- Review timeline for patterns

---

## Tips from These Examples

### 1. Don't Wait for Red
Compact at yellow (70%) for optimal performance

### 2. Regular Compaction
Every 24-48 hours during active use

### 3. Monitor Trends
Watch timeline for growth patterns

### 4. Break Points
Compact at natural breaks (lunch, end of task)

### 5. Use History
Press 'h' to see growth over time

### 6. Study Consumers
Know where your tokens go

### 7. Proactive Not Reactive
Act on warnings before critical

### 8. Both Tools
Run protector + monitor together

---

These examples show the conversation monitor in real-world scenarios. The key is proactive monitoring and regular maintenance for optimal Claude Code performance!

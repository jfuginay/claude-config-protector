# Quick Start: Claude Code Process Monitor

## Installation

### Step 1: Install Dependencies

```bash
cd /Users/iesouskurios/claude-config-protector
npm install
```

This installs:
- `blessed` - Terminal UI framework
- `blessed-contrib` - Additional widgets

### Step 2: Run the Monitor

```bash
# Option 1: Using npm script
npm run monitor

# Option 2: Direct execution
node process-monitor.js

# Option 3: Make it globally available (optional)
npm link
claude-process-monitor
```

## First Time Usage

When you first run the monitor, you'll see:

1. **Header**: Shows current time and last update timestamp
2. **Statistics Panel**: Total processes, running/old/zombie counts, CPU & memory totals
3. **Process List**: All background bash/shell processes with details
4. **Footer**: Keyboard shortcuts reminder

## Quick Reference

### Essential Commands
- **q** - Quit
- **k** - Kill selected process
- **a** - Auto-cleanup zombies
- **h** - Show help

### Navigation
- **↑/↓** - Move selection
- **Enter** - (on process list, same as 'k')

## Common Tasks

### Check what's running
Just launch the monitor. It auto-refreshes every 2 seconds.

### Kill a stuck process
1. Use ↑/↓ to select it
2. Press **k**
3. Confirm with **y**

### Bulk cleanup
1. Press **a**
2. Confirm to kill all zombie/idle processes

## What You'll See

### Process Information
Each process shows:
- **Symbol**: Status indicator (●○◐◔✖)
- **PID**: Process ID
- **CPU**: CPU usage percentage
- **MEM**: Memory usage (KB/MB/GB)
- **Age**: How long it's been running
- **Status**: Current state
- **Command**: The command being executed

### Status Colors
- Green (●) = Active (high CPU)
- Cyan (○) = Running normally
- Yellow (◐) = Old (>10 min)
- Magenta (◔) = Idle (stuck?)
- Red (✖) = Zombie (dead)

## Troubleshooting

### "Missing required dependency: blessed"
Run: `npm install` in the project directory

### No processes shown
Claude Code hasn't spawned any background processes yet. They appear when:
- Running long operations
- Background bash commands are active
- Build/test processes are running

### Can't kill a process
You may need appropriate permissions. Some system processes cannot be killed.

## Next Steps

- Read the full documentation: `PROCESS-MONITOR.md`
- Explore the keyboard shortcuts (press **h**)
- Customize thresholds in the source code
- Integrate with your workflow

## Tips

1. **Leave it running**: Open in a separate terminal to monitor ongoing tasks
2. **Regular cleanup**: Press **a** periodically to clean zombies
3. **Watch resources**: Keep an eye on total CPU/memory in the stats panel
4. **Check ages**: Old processes might indicate stuck operations

Enjoy monitoring your Claude Code processes!

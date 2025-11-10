# Claude Code Process Monitor

A professional Terminal UI (TUI) dashboard for monitoring and managing background bash processes spawned by Claude Code.

## Features

### Real-time Process Monitoring
- **Live Dashboard**: Updates every 2 seconds with current process information
- **Status Tracking**: Automatically categorizes processes by their state
- **Resource Metrics**: Displays CPU usage, memory consumption, and process age
- **Color-coded Display**: Visual indicators for quick status assessment

### Process Status Categories

| Status | Symbol | Color | Description |
|--------|--------|-------|-------------|
| ACTIVE | ● | Green | High CPU usage, actively running |
| RUNNING | ○ | Cyan | Normal operation |
| OLD | ◐ | Yellow | Running for more than 10 minutes |
| IDLE | ◔ | Magenta | Low CPU for >5 minutes, may be stuck |
| ZOMBIE | ✖ | Red | Dead process requiring cleanup |

### Auto-cleanup Capabilities
- **Smart Detection**: Identifies zombie and idle processes
- **Bulk Cleanup**: Clean up all problematic processes at once
- **Safe Operation**: Confirmation prompts before killing processes
- **Individual Control**: Kill specific processes manually

### Interactive Terminal UI
- **Keyboard Navigation**: Vim-style and arrow key support
- **Process Selection**: Navigate through the process list
- **Real-time Updates**: Live statistics and metrics
- **Help System**: Built-in help overlay with all commands
- **Professional Design**: Unicode box-drawing characters and color coding

## Installation

### Prerequisites
The process monitor requires the `blessed` and `blessed-contrib` npm packages.

```bash
cd /Users/iesouskurios/claude-config-protector
npm install
```

This will install:
- `blessed` (^0.1.81) - Terminal UI framework
- `blessed-contrib` (^4.11.0) - Additional UI widgets

## Usage

### Running the Monitor

There are several ways to start the process monitor:

```bash
# Using npm script
npm run monitor

# Direct execution
node process-monitor.js

# Using the installed binary (after global install)
claude-process-monitor
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `q` or `Ctrl+C` | Quit the monitor |
| `k` | Kill selected process |
| `↑` / `↓` or `j` / `k` | Navigate process list |
| `PgUp` / `PgDn` | Page up/down in list |
| `a` | Auto-cleanup zombie/idle processes |
| `r` | Refresh process list |
| `h` | Toggle help overlay |
| `Esc` | Close help overlay |

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│            Claude Code Process Monitor                      │
│        2025-11-10 | Last update: 2s ago                     │
└─────────────────────────────────────────────────────────────┘
┌─ Process Statistics ────────────────────────────────────────┐
│  Total Processes: 8  Running: 5  Old: 2  Zombie: 1         │
│  Total CPU: 12.3%  Total Memory: 234.5MB                    │
└─────────────────────────────────────────────────────────────┘
┌─ Background Processes (↑/↓ navigate, k kill, q quit) ──────┐
│ ● PID 12345 CPU:5.2% MEM:45.3MB Age:2m 15s [ACTIVE]        │
│    /bin/bash -c "long-running-command.sh"                   │
│ ○ PID 12346 CPU:0.1% MEM:12.1MB Age:5m 30s [RUNNING]       │
│    /bin/bash -c "background-task.sh"                        │
│ ◐ PID 12347 CPU:0.0% MEM:8.2MB Age:15m 45s [OLD]           │
│    /bin/bash -c "older-process.sh"                          │
│ ✖ PID 12348 CPU:0.0% MEM:4.1MB Age:20m 12s [ZOMBIE]        │
│    <defunct>                                                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  [q] Quit  [k] Kill  [a] Auto-cleanup  [r] Refresh  [h] Help│
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Thresholds

You can customize the thresholds by editing the constants at the top of `process-monitor.js`:

```javascript
const ZOMBIE_THRESHOLD = 300000; // 5 minutes (in milliseconds)
const OLD_THRESHOLD = 600000;    // 10 minutes (in milliseconds)
const UPDATE_INTERVAL = 2000;    // 2 seconds (in milliseconds)
```

### Process Detection

The monitor automatically detects bash and shell processes. To customize which processes are monitored, edit the pattern:

```javascript
const CLAUDE_PROCESS_PATTERN = /claude|bash.*claude/i;
```

## Use Cases

### 1. Monitoring Long-running Tasks
When Claude Code starts background processes for compilation, testing, or file operations, use the monitor to:
- Track their progress
- Verify they're still running
- Check resource usage

### 2. Cleaning Up Stuck Processes
Background processes can sometimes get stuck or become zombies. The monitor helps:
- Identify idle or zombie processes
- Clean them up with a single keystroke
- Free up system resources

### 3. Debugging Process Issues
If Claude Code seems slow or unresponsive:
- Check if background processes are consuming too many resources
- Identify processes that have been running too long
- Kill specific problematic processes

### 4. Resource Management
Keep your system running smoothly by:
- Monitoring total CPU and memory usage of background tasks
- Getting alerts about old or zombie processes
- Bulk cleanup of unnecessary processes

## Technical Details

### Process Detection
The monitor uses `ps aux` to list all processes and filters for bash/shell processes that may be related to Claude Code operations.

### Status Determination
Process status is determined by:
- **CPU Usage**: Active processes use >1% CPU
- **Process State**: From `ps` STAT column (R=running, S=sleeping, Z=zombie, etc.)
- **Age**: Calculated from start time and current time
- **Activity**: Combination of CPU usage and running time

### Resource Calculation
- **CPU**: Percentage of CPU time used by the process
- **Memory**: RSS (Resident Set Size) in kilobytes, displayed as KB/MB/GB
- **Age**: Time since process started, formatted as seconds/minutes/hours/days

### Terminal UI
Built with the `blessed` library, providing:
- Cross-platform terminal manipulation
- Unicode support for symbols and box-drawing
- Efficient screen rendering
- Mouse and keyboard input handling

## Troubleshooting

### Monitor won't start
```
❌ Missing required dependency: blessed
```

**Solution**: Install dependencies
```bash
cd /Users/iesouskurios/claude-config-protector
npm install
```

### No processes shown
The monitor only shows bash/shell processes. If you don't see any:
- Claude Code may not have any background processes running
- Try running a command that starts a background task
- Check if processes are running under a different shell

### Cannot kill process
**Permission denied** errors mean:
- The process belongs to another user
- You need elevated privileges
- Try running with `sudo` (not recommended)

### UI rendering issues
If the display looks broken:
- Make sure your terminal supports Unicode
- Try resizing the terminal window
- Check that your terminal emulator is up to date
- Some minimal terminals may not support all features

## Integration with Claude Config Protector

The Process Monitor integrates seamlessly with the Claude Config Protector suite:

1. **Same Installation**: Installed together via `npm install`
2. **Complementary Tools**: While the protector guards config files, the monitor manages processes
3. **Shared Philosophy**: Both tools help keep Claude Code running smoothly
4. **CLI Integration**: Available through npm scripts and bin commands

## Future Enhancements

Potential features for future versions:
- Process history and logging
- CPU/Memory graphs using blessed-contrib
- Process tree visualization
- Export process information to file
- Configurable alerts and notifications
- Process filtering and search
- Custom kill signals (SIGKILL, SIGTERM, etc.)

## Contributing

Contributions are welcome! Some ideas:
- Add support for other process types
- Implement process grouping
- Add filtering capabilities
- Improve status detection algorithms
- Add unit tests

## License

MIT License - Same as Claude Config Protector

## Author

Created as an enhancement to the Claude Config Protector by jfuginay

## Support

For issues, questions, or suggestions:
- Open an issue on the GitHub repository
- Check the built-in help (press `h` in the monitor)
- Review the main README.md for general project information

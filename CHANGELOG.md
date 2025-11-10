# Changelog

## [2.0.0] - 2025-11-10

### 🎉 Major Release: Monitoring Suite

This release introduces a comprehensive monitoring suite with three powerful Terminal UI tools for managing Claude Code health and performance.

### Added

#### 🔧 Process Monitor (`process-monitor.js`)
- **Real-time process monitoring** with blessed Terminal UI
- **Background process detection** - automatically finds Claude Code spawned processes
- **Color-coded status indicators**:
  - 🟢 Green (Active) - High CPU usage
  - 🔵 Cyan (Running) - Normal operation
  - 🟡 Yellow (Old) - Processes > 10 minutes
  - 🟣 Magenta (Idle) - Stuck/low activity
  - 🔴 Red (Zombie) - Dead processes
- **Interactive controls**:
  - `k` - Kill selected process
  - `a` - Auto-cleanup zombies/idle processes
  - Arrow keys/vim keys for navigation
  - `h` - Toggle help overlay
- **Resource tracking** - CPU, memory (RSS), process age
- **Smart categorization** - 5-level status algorithm
- **Scrollable process list** with Unicode status symbols
- **Live statistics** - Total processes, CPU/memory totals
- **Bulk operations** - Clean up multiple processes at once

#### 📊 Conversation Monitor (`conversation-monitor.js`)
- **Token usage dashboard** with visual progress bars
- **Real-time .claude.json analysis**
- **Health scoring system** (0-100) with emoji indicators:
  - 💚 Healthy (80-100)
  - 💛 Good (60-79)
  - ⚠️ Warning (40-59)
  - 🔴 Critical (0-39)
- **Proactive alerting**:
  - Warns at 70% token usage (140k/200k)
  - Critical alerts at 85% (170k/200k)
- **Growth tracking**:
  - Messages per minute calculation
  - File size trends
  - Session/project statistics
- **Timeline chart** - 60-minute token usage visualization
- **Top space consumers** - Shows what's using the most tokens
- **Compaction guide** - Press `c` for step-by-step instructions
- **Historical tracking** - Last 20 sessions with trends
- **Estimated savings** - Shows potential token reduction from compacting

#### 📈 Metrics Dashboard (`metrics-dashboard.js`)
- **4 interactive tabs**:
  - **Overview** - Config health, system resources, activity log
  - **Processes** - Protector daemon status and system info
  - **Conversation** - Project statistics and size distribution
  - **Logs** - Live log viewer with event timeline
- **Rich visualizations** using blessed-contrib:
  - Line charts for CPU/size trends
  - Bar charts for memory/project distribution
  - Gauges for health scores and resource usage
  - Donut charts for project proportions
  - Tables for detailed statistics
- **Real-time updates** - Refreshes every 2 seconds
- **Historical analysis** - Parses protector.log for trends
- **Export functionality** - Press `e` to save metrics as JSON
- **Health scoring** - Comprehensive 0-100 scale
- **Event tracking**:
  - Backup events with compression ratios
  - Truncation events with size reductions
  - Recovery events
  - Error categorization (INFO/WARN/ERROR)

### New Commands

Added 3 new binary commands to package.json:
```bash
claude-process-monitor        # Launch process monitor
claude-conversation-monitor   # Launch conversation monitor
claude-metrics-dashboard      # Launch metrics dashboard
```

Added npm scripts:
```bash
npm run monitor              # Process monitor
npm run conversation-monitor # Conversation monitor
npm run dashboard           # Metrics dashboard
```

### Dependencies

- Added `blessed@^0.1.81` - Terminal UI framework
- Added `blessed-contrib@^4.11.0` - Rich widgets (charts, gauges, graphs)

### Documentation

Added comprehensive documentation:
- `PROCESS-MONITOR.md` - Process monitor feature guide
- `INSTALL-MONITOR.md` - Installation instructions
- `CONVERSATION-MONITOR.md` - Conversation monitor technical docs
- `QUICKSTART-MONITOR.md` - Quick start guide
- `README-MONITOR.md` - Complete reference guide
- `EXAMPLES.md` - 10 real-world usage scenarios
- `METRICS-DASHBOARD.md` - Dashboard technical documentation
- `QUICK-START-DASHBOARD.md` - Dashboard quick start
- `DASHBOARD-README.md` - Dashboard complete guide
- `DASHBOARD-SUMMARY.md` - Implementation details
- `DASHBOARD-VISUAL-GUIDE.txt` - ASCII art layouts
- `test-monitor.js` - Setup verification script

### Changed

- Bumped version from 1.3.0 → 2.0.0 (major release)
- Updated publishConfig for public npm registry
- Enhanced package.json with new bin commands

### Use Cases

1. **Monitor long-running builds** - Track compilation, testing in real-time
2. **Clean up zombie processes** - Identify and kill stuck background tasks
3. **Optimize token usage** - Proactively compact before hitting limits
4. **Debug performance** - Find resource-hungry processes
5. **Maintain conversation health** - Visual feedback on session size
6. **Export metrics** - Generate health reports for analysis
7. **Historical analysis** - Review trends over time

### Breaking Changes

None - All existing functionality preserved. New tools are additive.

### Migration

No migration needed. Simply update:
```bash
npm install -g claude-config-protector@2.0.0
```

All new monitoring tools work alongside the existing protector daemon.

---

## [1.3.0] - 2025-11-01

### Added
- **Compressed backups**: Backups now use gzip compression, reducing size by 74% on average
- **Size analysis**: Detailed logging of config sections before/after truncation
- **Improved truncation logic**: Now properly removes bloat sources
  - Removes `cachedChangelog`, `changelog`, `releaseNotes`
  - Removes `recentFiles`, `fileHistory`, `searchHistory`, `commandHistory`
  - Removes all project cache data (`searchCache`, `fileCache`, `indexCache`)
- **Better backup management**: Supports both `.json` and `.json.gz` backup formats
- **Compression statistics**: Logs show space saved with each backup

### Changed
- Project history reduced from 10 → 3 items for more aggressive cleanup
- Project sessions reduced from 10 → 3 items
- Tips history reduced from 20 → 10 items
- Backup file format changed to `.json.gz` (74% smaller)
- Recovery system now handles decompression automatically

### Fixed
- Truncation now actually removes data (was showing 0% reduction)
- Identified and removed `cachedChangelog` as primary bloat source (34KB)
- Better detection of what's causing config bloat

### Performance
- Backup storage reduced by ~99%: 96MB → 36KB in testing
- Individual backups: 12MB → 18KB
- Same memory footprint: <10MB RAM, <0.1% CPU

## [1.2.0] - 2025-08-16

### Added
- Published to npm registry as `claude-config-protector`
- Global CLI commands (`ccp`) for easy management
- `postinstall` script with helpful setup instructions
- Simplified installation process
- New CLI commands:
  - `ccp start/stop` - Manage protector daemon
  - `ccp status` - Check protection status
  - `ccp fix` - Fix corrupted configs
  - `ccp backup` - Create manual backup
  - `ccp help` - Show all commands

### Changed
- Updated README with npm installation as primary method
- Improved package.json with better description and keywords
- Added clickable npm badges with links

### Installation
```bash
npm install -g claude-config-protector
```

## [1.1.0] - 2025-08-14

### Added
- Initial release with core functionality
- Config file monitoring
- Automatic backup system
- Corruption recovery
- Size management (5MB limit)
- Atomic write operations
- Support for macOS, Linux, and Windows (WSL)

### Features
- Monitors `~/.claude.json` for corruption
- Creates hourly backups
- Auto-recovers from corrupted configs
- Prevents unbounded growth
- Maintains 10 rolling backups
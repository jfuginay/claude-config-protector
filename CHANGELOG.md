# Changelog

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
# Changelog

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
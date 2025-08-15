#!/bin/bash

# Claude Config Protector - Universal Installer
# Supports macOS, Linux, and WSL

set -e

echo "🛡️  Claude Config Protector Installer"
echo "====================================="
echo ""

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if grep -qi microsoft /proc/version 2>/dev/null; then
        OS="wsl"
    else
        OS="linux"
    fi
fi

echo "Detected OS: $OS"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo ""
    echo "Please install Node.js first:"
    if [[ "$OS" == "macos" ]]; then
        echo "  brew install node"
    else
        echo "  sudo apt update && sudo apt install nodejs npm"
    fi
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js installed: $NODE_VERSION"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create backup directory
BACKUP_DIR="$HOME/.claude-backups"
mkdir -p "$BACKUP_DIR"
echo "✅ Backup directory: $BACKUP_DIR"

# Check and fix current config if needed
CONFIG_PATH="$HOME/.claude.json"
if [[ -f "$CONFIG_PATH" ]]; then
    CONFIG_SIZE=$(stat -f%z "$CONFIG_PATH" 2>/dev/null || stat -c%s "$CONFIG_PATH" 2>/dev/null || echo 0)
    if [[ $CONFIG_SIZE -gt 5242880 ]]; then
        echo ""
        echo "⚠️  Config file is large ($(($CONFIG_SIZE / 1024 / 1024))MB)"
        echo "Running fix first..."
        node "$SCRIPT_DIR/fix-config.js"
    fi
fi

# Install based on OS
case "$OS" in
    "macos")
        echo ""
        echo "Installing for macOS..."
        
        # Create Launch Agent
        PLIST_PATH="$HOME/Library/LaunchAgents/com.claude.config.protector.plist"
        mkdir -p "$HOME/Library/LaunchAgents"
        
        cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.config.protector</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$SCRIPT_DIR/protector.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$BACKUP_DIR/protector.log</string>
    <key>StandardErrorPath</key>
    <string>$BACKUP_DIR/protector.error.log</string>
</dict>
</plist>
EOF
        
        # Load agent
        launchctl unload "$PLIST_PATH" 2>/dev/null || true
        launchctl load "$PLIST_PATH"
        
        echo "✅ Installed as Launch Agent"
        echo "   To stop: launchctl unload $PLIST_PATH"
        ;;
        
    "linux")
        echo ""
        echo "Installing for Linux..."
        
        # Create systemd service
        SERVICE_PATH="$HOME/.config/systemd/user/claude-protector.service"
        mkdir -p "$HOME/.config/systemd/user"
        
        cat > "$SERVICE_PATH" << EOF
[Unit]
Description=Claude Config Protector
After=network.target

[Service]
Type=simple
ExecStart=$(which node) $SCRIPT_DIR/protector.js
Restart=always
RestartSec=10
StandardOutput=append:$BACKUP_DIR/protector.log
StandardError=append:$BACKUP_DIR/protector.error.log

[Install]
WantedBy=default.target
EOF
        
        # Enable and start service
        systemctl --user daemon-reload
        systemctl --user enable claude-protector
        systemctl --user restart claude-protector
        
        echo "✅ Installed as systemd service"
        echo "   To stop: systemctl --user stop claude-protector"
        ;;
        
    "wsl"|*)
        echo ""
        echo "Installing for WSL/Generic..."
        
        # Add to bashrc for auto-start
        BASHRC="$HOME/.bashrc"
        STARTUP_CMD="# Claude Config Protector
(cd $SCRIPT_DIR && nohup node protector.js > $BACKUP_DIR/protector.log 2>&1 &)"
        
        if ! grep -q "Claude Config Protector" "$BASHRC" 2>/dev/null; then
            echo "" >> "$BASHRC"
            echo "$STARTUP_CMD" >> "$BASHRC"
            echo "✅ Added to ~/.bashrc for auto-start"
        else
            echo "✅ Already in ~/.bashrc"
        fi
        
        # Start now
        cd "$SCRIPT_DIR"
        nohup node protector.js > "$BACKUP_DIR/protector.log" 2>&1 &
        echo "✅ Started protector (PID: $!)"
        ;;
esac

echo ""
echo "======================================"
echo "✅ Installation complete!"
echo ""
echo "The protector is now:"
echo "  • Monitoring ~/.claude.json"
echo "  • Keeping size under 5MB"
echo "  • Creating hourly backups"
echo "  • Auto-recovering from corruption"
echo ""
echo "Logs: $BACKUP_DIR/protector.log"
echo "Test: ./test.sh"
echo ""
echo "Claude Config Protector is running! 🛡️"
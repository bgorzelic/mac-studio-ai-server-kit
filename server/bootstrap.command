#!/bin/bash
# Mac AI-server bootstrap: Homebrew + server power settings + GPU memory limit.
# One password prompt; idempotent; logs to ~/bootstrap.log
set -uo pipefail
exec > >(tee -a ~/bootstrap.log) 2>&1
echo "=== bootstrap run $(date) ==="

sudo pmset -a sleep 0 disksleep 0 displaysleep 10 womp 1 autorestart 1 powernap 0 hibernatemode 0 standby 0
echo "power settings OK (never sleep, wake-on-LAN, auto-restart)"

# GPU wired limit ≈ 94% of RAM (leave ~16 GB for macOS on big machines)
TOTAL_MB=$(( $(sysctl -n hw.memsize) / 1048576 ))
LIMIT_MB=$(( TOTAL_MB * 94 / 100 ))
sudo sysctl iogpu.wired_limit_mb=$LIMIT_MB
sudo tee /Library/LaunchDaemons/local.iogpu-wired-limit.plist > /dev/null <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>local.iogpu-wired-limit</string>
  <key>ProgramArguments</key><array><string>/usr/sbin/sysctl</string><string>iogpu.wired_limit_mb=$LIMIT_MB</string></array>
  <key>RunAtLoad</key><true/>
</dict></plist>
PLIST
sudo launchctl bootstrap system /Library/LaunchDaemons/local.iogpu-wired-limit.plist 2>/dev/null || true
echo "GPU wired limit: ${LIMIT_MB} MB (persisted)"

if [ ! -x /opt/homebrew/bin/brew ]; then
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
grep -q 'brew shellenv' ~/.zprofile 2>/dev/null || echo '[ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
echo "=== done $(date) ==="

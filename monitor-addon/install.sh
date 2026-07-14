#!/bin/bash
# Studio Monitor add-on installer.
# Usage: ./install.sh /path/to/your/dashboard/source
# Copies the monitor files into a Next.js (app router) dashboard and adds a
# sidebar entry to YOUR copy of Sidebar.tsx (we never redistribute dashboard code).
set -euo pipefail
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:?Usage: ./install.sh /path/to/dashboard/source}"

[ -d "$DEST/src/app" ] || { echo "❌ $DEST doesn't look like a Next.js app-router project"; exit 1; }

mkdir -p "$DEST/src/app/api/studio" "$DEST/src/app/monitor" "$DEST/src/components"
cp "$SRC_DIR/route.ts"          "$DEST/src/app/api/studio/route.ts"
cp "$SRC_DIR/page.tsx"          "$DEST/src/app/monitor/page.tsx"
cp "$SRC_DIR/StudioMonitor.tsx" "$DEST/src/components/StudioMonitor.tsx"
echo "✅ files copied"

SIDEBAR="$DEST/src/components/Sidebar.tsx"
if [ -f "$SIDEBAR" ] && ! grep -q '"/monitor"' "$SIDEBAR"; then
  # add Gauge to the lucide-react import if missing
  grep -q "Gauge" "$SIDEBAR" || sed -i '' 's/} from "lucide-react";/, Gauge } from "lucide-react";/' "$SIDEBAR"
  # append a nav entry right after the NAV array opens
  sed -i '' 's|const NAV: NavItem\[\] = \[|const NAV: NavItem[] = [\n  { href: "/monitor", label: "Studio Monitor", icon: <Gauge size={18} />, accent: "#34d399", dim: "rgba(52,211,153,0.16)" },|' "$SIDEBAR"
  echo "✅ sidebar patched"
else
  echo "ℹ️  sidebar: entry already present or no Sidebar.tsx — add a link to /monitor yourself"
fi

echo "Next: (cd $DEST && npm run build) and restart your dashboard."
echo "Tip: brew install macmon  # enables GPU/power/temperature telemetry"

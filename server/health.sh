#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
echo "── $(hostname -s) · $(date '+%a %H:%M') ──"
for svc in "Ollama:11434:/api/version" "OpenWebUI:3000:/" "LiteLLM:4000:/health/liveliness" "Dashboard:3737:/"; do
  name="${svc%%:*}"; rest="${svc#*:}"; port="${rest%%:*}"; path="${rest#*:}"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:$port$path")
  [ "$code" = "200" ] && echo "✅ $name (:$port)" || echo "❌ $name (:$port) -> $code"
done
echo "Models: $(ollama list 2>/dev/null | tail -n +2 | awk '{print $1}' | tr '\n' ' ')"
echo "Loaded: $(ollama ps 2>/dev/null | tail -n +2 | awk '{print $1}' | tr '\n' ' ')"
command -v tailscale >/dev/null 2>&1 && echo "Tailnet: $(tailscale ip -4 2>/dev/null)"
[ -x "/Applications/Tailscale.app/Contents/MacOS/Tailscale" ] && echo "Tailnet: $(/Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4 2>/dev/null)"
echo "LAN: $(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)"
df -h / | tail -1 | awk '{print "Disk: "$3" used, "$4" free"}'

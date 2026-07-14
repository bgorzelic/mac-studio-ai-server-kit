# Mac Studio AI Server Kit

Turn a fresh Apple Silicon Mac into a tuned, remotely-reachable local-LLM server and agent development machine — in one evening. Extracted from a real setup: M3 Ultra / 256 GB, serving Qwen3-235B at 27 tok/s, Qwen3-30B at 90 tok/s (106 via MLX), reachable over LAN and Tailscale.

MIT licensed. Everything here is original work — no third-party template code is redistributed.

## What's inside

**`server/`** — the machine setup: `bootstrap.command` (Homebrew + never-sleep/wake-on-LAN/auto-restart power settings + raised GPU wired-memory limit with a persistence LaunchDaemon), LaunchAgent templates for Ollama (LAN-exposed, flash attention, q8 KV cache), Open WebUI, and LiteLLM, plus `health.sh` (one-command status of every service, model, and address) and `bench.sh` (reproducible tok/s benchmarks, Ollama + MLX).

**`monitor-addon/`** — a "Studio Monitor" tab for any Next.js-based agent dashboard (built for the Agent OS dashboard layout, adaptable to any Next app): live GPU/CPU utilization, power draw and temperatures via [macmon](https://github.com/vladkens/macmon) (no sudo), unified-memory and disk gauges, service health dots, and which models are loaded in memory right now. `install.sh` copies the three files into your own dashboard source and patches your sidebar.

**`docs/`** — the runbook template and a setup walkthrough.

## Quickstart (fresh Mac)

```bash
# 1. Server foundation — one password prompt, then everything is automatic
./server/bootstrap.command

# 2. LLM serving
brew install ollama jq macmon
cp server/launchagents/*.plist ~/Library/LaunchAgents/   # edit paths/username first
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.YOU.ollama.plist
ollama pull qwen3:30b          # start here; scale up to what your RAM allows

# 3. Check everything
./server/health.sh
./server/bench.sh
```

## Sizing guide (unified memory → what you can serve)

| RAM | Comfortable ceiling |
|---|---|
| 32 GB | Qwen3-30B-A3B q4 (MoE — the value king) |
| 64 GB | 30B q8, 70B q4 |
| 128 GB | gpt-oss:120b, 70B q8 |
| 256 GB+ | Qwen3-235B q4 + a 30B side-loaded |

Raise the GPU wired limit (bootstrap does this) — macOS defaults to ~75% of RAM for Metal; a dedicated server can safely run ~94%.

## Monitor add-on install

```bash
cd monitor-addon && ./install.sh /path/to/your/dashboard/source
# then: npm run build && restart your dashboard
```

Requires `brew install macmon` for GPU/power telemetry (degrades gracefully without it).

## Remote access

Install Tailscale, log in, and every service here is instantly reachable from your other devices at the machine's tailnet IP — nothing exposed to the public internet. `tailscale serve --bg <port>` publishes localhost-only dashboards privately with HTTPS.

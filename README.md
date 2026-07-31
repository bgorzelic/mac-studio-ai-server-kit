# Mac Studio AI Server Kit

**Turn a fresh Apple Silicon Mac into a tuned, remotely-reachable local-LLM server — in one evening.**

[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20·%20Apple%20Silicon-black?style=flat&logo=apple)](https://support.apple.com/en-us/116943)
[![Shell](https://img.shields.io/badge/scripts-bash-4EAA25?style=flat&logo=gnubash&logoColor=white)](server/)

Extracted from a real machine — Apple M3 Ultra, 256 GB unified memory, GPU wired limit 240 GB — measured with the `bench.sh` in this repo:

<table>
  <tr>
    <td align="center"><b>27.1 tok/s</b><br/><sub>Qwen3-235B (MoE)<br/>Ollama</sub></td>
    <td align="center"><b>66.7 tok/s</b><br/><sub>gpt-oss:120b (MoE)<br/>Ollama</sub></td>
    <td align="center"><b>86.5 tok/s</b><br/><sub>Qwen3-30B-A3B<br/>Ollama</sub></td>
    <td align="center"><b>106.5 tok/s</b><br/><sub>Qwen3-30B-A3B 4-bit<br/>MLX</sub></td>
  </tr>
</table>

Full numbers — prompt processing, cold-load times, memory footprints, and the MLX-vs-Ollama routing rule — in [docs/EXAMPLE-BENCHMARKS.md](docs/EXAMPLE-BENCHMARKS.md).

## What is this

A small kit of bash scripts, LaunchAgent templates, and a dashboard add-on that captures a working Mac Studio LLM-server setup so you can replay it on your own machine: never-sleep power settings, a raised (and persisted) GPU wired-memory limit, LAN-exposed Ollama with flash attention and q8 KV cache, Open WebUI and LiteLLM as services, one-command health checks, and reproducible tok/s benchmarks.

MIT licensed. Everything here is original work — no third-party template code is redistributed.

## What's inside

| Path | What it does |
|---|---|
| [`server/bootstrap.command`](server/bootstrap.command) | Homebrew + never-sleep / wake-on-LAN / auto-restart power settings + raised GPU wired-memory limit with a persistence LaunchDaemon. One password prompt, idempotent. |
| [`server/launchagents/`](server/launchagents/) | LaunchAgent templates for Ollama (LAN-exposed, flash attention, q8 KV cache), Open WebUI, and LiteLLM. |
| [`server/health.sh`](server/health.sh) | One-command status of every service, loaded models, and LAN/tailnet addresses. |
| [`server/bench.sh`](server/bench.sh) | Reproducible generation + prompt-processing tok/s benchmarks, Ollama + MLX. |
| [`monitor-addon/`](monitor-addon/) | A "Studio Monitor" tab for any Next.js app-router dashboard: live GPU/CPU utilization, power draw and temperatures via [macmon](https://github.com/vladkens/macmon) (no sudo), unified-memory and disk gauges, service health dots, and which models are loaded right now. `install.sh` copies three files into your dashboard source and patches your sidebar. |
| [`docs/`](docs/) | Setup walkthrough and the example benchmark report. |

## Why it works

macOS defaults Metal to ~75% of RAM; a dedicated server can safely run ~94%. `bootstrap.command` raises `iogpu.wired_limit_mb` and installs a LaunchDaemon so the limit survives reboots — on 256 GB that is the difference between the 235B fitting or not. The rest is boring reliability: the machine never sleeps, wakes on LAN, auto-restarts after power loss, and every service is a LaunchAgent that comes back on login.

## Quick start (fresh Mac)

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

Step-by-step order (toolchain, models, remote, agent layer, monitor): [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md).

## Sizing guide (unified memory → what you can serve)

| RAM | Comfortable ceiling |
|---|---|
| 32 GB | Qwen3-30B-A3B q4 (MoE — the value king) |
| 64 GB | 30B q8, 70B q4 |
| 128 GB | gpt-oss:120b, 70B q8 |
| 256 GB+ | Qwen3-235B q4 + a 30B side-loaded |

## Monitor add-on install

```bash
cd monitor-addon && ./install.sh /path/to/your/dashboard/source
# then: npm run build && restart your dashboard
```

Requires `brew install macmon` for GPU/power telemetry (degrades gracefully without it).

## Remote access

Install Tailscale, log in, and every service here is instantly reachable from your other devices at the machine's tailnet IP — nothing exposed to the public internet. `tailscale serve --bg <port>` publishes localhost-only dashboards privately with HTTPS.

## License

[MIT](LICENSE)

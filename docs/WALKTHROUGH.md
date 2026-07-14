# Setup walkthrough (the order that works)

1. **Bootstrap** — run `server/bootstrap.command` (one password). Gets you Homebrew, never-sleep server power settings, and a persisted GPU wired-memory limit sized to your RAM.
2. **Toolchain** — `brew install ollama jq macmon fnm ripgrep fd fzf bat eza btop gh tmux` · `curl -LsSf https://astral.sh/uv/install.sh | sh` · `uv tool install mlx-lm` · `curl -fsSL https://claude.ai/install.sh | bash`.
3. **Serving** — edit the `launchagents/*.plist` templates (replace `YOU`), copy to `~/Library/LaunchAgents/`, `launchctl bootstrap gui/$(id -u) <plist>`. Ollama binds all interfaces; `uv tool install open-webui "litellm[proxy]"` for the UI + router.
4. **Models** — start small (`ollama pull qwen3:30b`), verify with `server/bench.sh`, then scale to your RAM (see sizing table in the README).
5. **Remote** — install Tailscale, log in; everything is now reachable at your tailnet IP. `tailscale serve --bg <port>` for localhost-only dashboards.
6. **Agent layer** — put a `CLAUDE.md` at `~` (machine context: hardware, services, ports, conventions) and one in your dev root. Agents inherit the machine's story automatically.
7. **Monitor** — `monitor-addon/install.sh` into your dashboard, `npm run build`, done.

Verify each stage with `server/health.sh` — four green checks means the machine is doing its job.

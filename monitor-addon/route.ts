import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

// Studio Monitor API — live hardware + service telemetry for this Mac.
// Part of the Studio Monitor add-on (original work, MIT — safe to share).
const run = promisify(exec);
export const dynamic = "force-dynamic";

async function sh(cmd: string, timeout = 5000): Promise<string> {
  try {
    const { stdout } = await run(cmd, { timeout });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function probe(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

interface MacmonSample {
  ecpu_usage?: [number, number];
  pcpu_usage?: [number, number];
  gpu_usage?: [number, number];
  cpu_power?: number;
  gpu_power?: number;
  all_power?: number;
  temp?: { cpu_temp_avg?: number; gpu_temp_avg?: number };
  memory?: { ram_total?: number; ram_usage?: number; swap_total?: number; swap_usage?: number };
}

// serve at most one macmon spawn per 4s no matter how many clients poll
let cached: { ts: number; body: Record<string, unknown> } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.ts < 4000) {
    return NextResponse.json(cached.body);
  }

  const [macmonRaw, dfRaw, tsIp, lanIp, tags, ps] = await Promise.all([
    sh("/opt/homebrew/bin/macmon pipe -s 1", 6000),
    sh("df -k / | tail -1"),
    sh("/Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4"),
    sh("ipconfig getifaddr en0 || ipconfig getifaddr en1"),
    fetchJson("http://localhost:11434/api/tags"),
    fetchJson("http://localhost:11434/api/ps"),
  ]);

  let mac: MacmonSample | null = null;
  try {
    const lines = macmonRaw.split("\n").filter((l) => l.trim().startsWith("{"));
    if (lines.length) mac = JSON.parse(lines[lines.length - 1]) as MacmonSample;
  } catch {
    mac = null;
  }

  // disk: df -k → blocks used avail
  let disk = { totalGb: 0, usedGb: 0, freeGb: 0 };
  const dfParts = dfRaw.split(/\s+/);
  if (dfParts.length > 4) {
    disk = {
      totalGb: Math.round((parseInt(dfParts[1]) * 1024) / 1e9),
      usedGb: Math.round((parseInt(dfParts[2]) * 1024) / 1e9),
      freeGb: Math.round((parseInt(dfParts[3]) * 1024) / 1e9),
    };
  }

  const ramTotal = mac?.memory?.ram_total ?? os.totalmem();
  const ramUsed = mac?.memory?.ram_usage ?? ramTotal - os.freemem();

  const [ollamaOk, owuiOk, litellmOk, mlxOk] = await Promise.all([
    probe("http://localhost:11434/api/version"),
    probe("http://localhost:3000/"),
    probe("http://localhost:4000/health/liveliness"),
    probe("http://localhost:8080/v1/models"),
  ]);

  interface TagModel { name?: string; size?: number }
  interface PsModel { name?: string; size?: number }
  const models = (((tags as { models?: TagModel[] } | null)?.models) ?? []).map((m) => ({
    name: m.name ?? "?",
    sizeGb: Math.round(((m.size ?? 0) / 1e9) * 10) / 10,
  }));
  const loaded = (((ps as { models?: PsModel[] } | null)?.models) ?? []).map((m) => m.name ?? "?");

  const body: Record<string, unknown> = {
    ts: Date.now(),
    host: os.hostname(),
    uptimeS: Math.round(os.uptime()),
    load: os.loadavg().map((x) => Math.round(x * 100) / 100),
    cores: os.cpus().length,
    cpu: mac
      ? {
          ecpuPct: Math.round((mac.ecpu_usage?.[1] ?? 0) * 100),
          pcpuPct: Math.round((mac.pcpu_usage?.[1] ?? 0) * 100),
          powerW: Math.round((mac.cpu_power ?? 0) * 10) / 10,
          tempC: Math.round(mac.temp?.cpu_temp_avg ?? 0),
        }
      : null,
    gpu: mac
      ? {
          pct: Math.round((mac.gpu_usage?.[1] ?? 0) * 100),
          freqMhz: Math.round(mac.gpu_usage?.[0] ?? 0),
          powerW: Math.round((mac.gpu_power ?? 0) * 10) / 10,
          tempC: Math.round(mac.temp?.gpu_temp_avg ?? 0),
        }
      : null,
    totalPowerW: mac ? Math.round((mac.all_power ?? 0) * 10) / 10 : null,
    ram: {
      totalGb: Math.round((ramTotal / 1e9) * 10) / 10,
      usedGb: Math.round((ramUsed / 1e9) * 10) / 10,
      pct: Math.round((ramUsed / ramTotal) * 100),
      swapUsedGb: Math.round(((mac?.memory?.swap_usage ?? 0) / 1e9) * 10) / 10,
    },
    disk,
    net: { tailscale: tsIp || null, lan: lanIp || null },
    services: [
      { name: "Ollama", port: 11434, ok: ollamaOk },
      { name: "Open WebUI", port: 3000, ok: owuiOk },
      { name: "LiteLLM", port: 4000, ok: litellmOk },
      { name: "MLX Server", port: 8080, ok: mlxOk, optional: true },
    ],
    models,
    loaded,
  };

  cached = { ts: Date.now(), body };
  return NextResponse.json(body);
}

"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, MemoryStick, HardDrive, Zap, Server, Clock, Gauge, Box } from "lucide-react";
import type { ReactNode } from "react";
import { usePollWhileVisible } from "@/lib/usePollWhileVisible";

// Studio Monitor — live hardware + serving telemetry for this Mac.
// Part of the Studio Monitor add-on (original work, MIT — safe to share).

interface StudioData {
  ts: number;
  host: string;
  uptimeS: number;
  load: number[];
  cores: number;
  cpu: { ecpuPct: number; pcpuPct: number; powerW: number; tempC: number } | null;
  gpu: { pct: number; freqMhz: number; powerW: number; tempC: number } | null;
  totalPowerW: number | null;
  ram: { totalGb: number; usedGb: number; pct: number; swapUsedGb: number };
  disk: { totalGb: number; usedGb: number; freeGb: number };
  net: { tailscale: string | null; lan: string | null };
  services: { name: string; port: number; ok: boolean; optional?: boolean }[];
  models: { name: string; sizeGb: number }[];
  loaded: string[];
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", marginTop: 10, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.5 }}
        style={{ height: "100%", borderRadius: 3, background: color }}
      />
    </div>
  );
}

function Tile({ label, icon, value, sub, pct, color }: {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  sub?: string;
  pct?: number;
  color?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="vital-tile">
      <div className="flex items-center justify-between">
        <span className="k flex items-center gap-1.5">
          <span style={{ color: "var(--gold)" }}>{icon}</span>
          {label}
        </span>
      </div>
      <div className="v" style={{ marginTop: 8 }}>{value}</div>
      {sub ? <div style={{ fontSize: "0.72rem", color: "var(--cream-mute)", marginTop: 4 }}>{sub}</div> : null}
      {typeof pct === "number" ? <Bar pct={pct} color={color ?? "var(--gold)"} /> : null}
    </motion.div>
  );
}

function fmtUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StudioMonitor() {
  const [data, setData] = useState<StudioData | null>(null);
  const [err, setErr] = useState(false);

  const refresh = useCallback(() => {
    fetch("/api/studio")
      .then((r) => r.json())
      .then((j: StudioData) => { setData(j); setErr(false); })
      .catch(() => setErr(true));
  }, []);

  usePollWhileVisible(refresh, 5000);

  if (!data) {
    return (
      <div style={{ padding: 32 }}>
        <div className="eyebrow"><span className="num">VII.</span> Studio Monitor</div>
        <p style={{ color: "var(--cream-mute)" }}>{err ? "Monitor API unreachable." : "Reading the machine…"}</p>
      </div>
    );
  }

  const cpuAvgPct = data.cpu ? Math.round((data.cpu.ecpuPct + data.cpu.pcpuPct) / 2) : Math.min(100, Math.round((data.load[0] / data.cores) * 100));

  return (
    <div style={{ padding: 32, maxWidth: 1120 }}>
      <div className="eyebrow"><span className="num">VII.</span> Studio Monitor</div>
      <h1 className="page-title" style={{ marginBottom: 6 }}>
        {data.host.replace(".local", "")} <em>alive</em>
      </h1>
      <p style={{ color: "var(--cream-mute)", marginBottom: 24, fontSize: "0.85rem" }}>
        up {fmtUptime(data.uptimeS)} · LAN {data.net.lan ?? "—"} · tailnet {data.net.tailscale ?? "—"}
        {data.totalPowerW != null ? ` · drawing ${data.totalPowerW} W` : ""}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        <Tile
          label="CPU"
          icon={<Cpu size={13} />}
          value={data.cpu ? `${cpuAvgPct}%` : `load ${data.load[0]}`}
          sub={data.cpu ? `P ${data.cpu.pcpuPct}% · E ${data.cpu.ecpuPct}% · ${data.cpu.powerW} W · ${data.cpu.tempC}°C` : `${data.cores} cores · load ${data.load.join(" / ")}`}
          pct={cpuAvgPct}
          color="#5eead4"
        />
        <Tile
          label="GPU"
          icon={<Gauge size={13} />}
          value={data.gpu ? `${data.gpu.pct}%` : "—"}
          sub={data.gpu ? `${data.gpu.freqMhz} MHz · ${data.gpu.powerW} W · ${data.gpu.tempC}°C` : "macmon not available"}
          pct={data.gpu?.pct ?? 0}
          color="#a855f7"
        />
        <Tile
          label="Unified Memory"
          icon={<MemoryStick size={13} />}
          value={`${data.ram.usedGb} / ${data.ram.totalGb} GB`}
          sub={data.ram.swapUsedGb > 0 ? `swap ${data.ram.swapUsedGb} GB in use` : "no swap in use"}
          pct={data.ram.pct}
          color={data.ram.pct > 90 ? "#ef4444" : "var(--gold)"}
        />
        <Tile
          label="Disk"
          icon={<HardDrive size={13} />}
          value={`${data.disk.freeGb} GB free`}
          sub={`${data.disk.usedGb} of ${data.disk.totalGb} GB used`}
          pct={data.disk.totalGb ? Math.round((data.disk.usedGb / data.disk.totalGb) * 100) : 0}
          color="#60a5fa"
        />
      </div>

      <div className="eyebrow" style={{ marginTop: 34 }}><span className="num">a.</span> Serving</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {data.services.map((s) => (
          <Tile
            key={s.port}
            label={s.name}
            icon={<Server size={13} />}
            value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 5, background: s.ok ? "#34d399" : s.optional ? "rgba(255,255,255,0.25)" : "#ef4444", boxShadow: s.ok ? "0 0 8px rgba(52,211,153,0.7)" : "none" }} />
                {s.ok ? "serving" : s.optional ? "off (on-demand)" : "down"}
              </span>
            }
            sub={`:${s.port}`}
          />
        ))}
      </div>

      <div className="eyebrow" style={{ marginTop: 34 }}><span className="num">b.</span> Models on disk</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {data.models.map((m) => {
          const isLoaded = data.loaded.includes(m.name);
          return (
            <Tile
              key={m.name}
              label={m.name}
              icon={isLoaded ? <Zap size={13} /> : <Box size={13} />}
              value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {isLoaded ? <span style={{ color: "#34d399" }}>in memory</span> : "on disk"}
                </span>
              }
              sub={`${m.sizeGb} GB`}
            />
          );
        })}
        {data.models.length === 0 ? <p style={{ color: "var(--cream-mute)" }}>No models found — is Ollama running?</p> : null}
      </div>

      <p style={{ color: "var(--cream-mute)", marginTop: 28, fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 6 }}>
        <Clock size={11} /> refreshes every 5s while visible · sampled {new Date(data.ts).toLocaleTimeString()}
      </p>
    </div>
  );
}

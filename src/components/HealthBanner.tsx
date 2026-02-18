import { useApi } from "../hooks/useApi";
import type { LiveSignals } from "../types";

const STATUS_COLORS: Record<string, string> = {
  healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  keeping_up: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  catching_up: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  falling_behind: "bg-red-500/20 text-red-400 border-red-500/30",
};

function formatTs(val: unknown): string {
  if (!val) return "n/a";
  const num = typeof val === "number" ? val * 1000 : new Date(val as string).getTime();
  if (isNaN(num)) return String(val);
  return new Date(num).toLocaleTimeString();
}

interface Props {
  health: string | null;
  wsConnected: boolean;
  signalTs: Record<string, number>;
}

export default function HealthBanner({ health, wsConnected, signalTs }: Props) {
  const { data: live } = useApi<LiveSignals>("/api/v1/live", 30_000);
  const { data: hc } = useApi<{ status: string }>("/api/v1/health", 30_000);

  const status = health ?? hc?.status ?? "unknown";
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

  // Prefer live WebSocket timestamps, fall back to HTTP /live endpoint
  const scanTs = signalTs["scan.complete"] ?? (live?.scan as Record<string, unknown>)?.timestamp;
  const vecTs = signalTs["vectorize.complete"] ?? (live?.vectorize as Record<string, unknown>)?.timestamp;
  const healthTs = signalTs["health.check"] ?? (live?.health as Record<string, unknown>)?.timestamp;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 px-5 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-400">Pipeline</span>
        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold uppercase ${colorClass}`}>
          {status}
        </span>
        {wsConnected && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" title="WebSocket connected" />
        )}
      </div>

      <div className="flex gap-6 text-xs text-gray-500">
        {scanTs && (
          <span>Last scan: <span className="text-gray-300">{formatTs(scanTs)}</span></span>
        )}
        {vecTs && (
          <span>Last vectorize: <span className="text-gray-300">{formatTs(vecTs)}</span></span>
        )}
        {healthTs && (
          <span>Health: <span className="text-gray-300">{formatTs(healthTs)}</span></span>
        )}
      </div>
    </div>
  );
}

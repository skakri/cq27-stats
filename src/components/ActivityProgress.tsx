import type { RecheckProgressData } from "../types";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

interface Props {
  recheckProgress: RecheckProgressData | null;
}

export default function ActivityProgress({ recheckProgress }: Props) {
  if (!recheckProgress) return null;

  const { checked, flagged, total, page, duration_seconds } = recheckProgress;
  const pct = total > 0 ? Math.min(100, (checked / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">
          Rechecking entries <span className="text-gray-500">(page {page})</span>
        </span>
        <span className="text-xs text-gray-500">{formatDuration(duration_seconds)}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          <span className="text-gray-300">{checked.toLocaleString()}</span>
          {" / "}
          <span className="text-gray-300">{total.toLocaleString()}</span>
          {" checked"}
        </span>
        <span>
          <span className="text-yellow-400">{flagged.toLocaleString()}</span>
          {" flagged"}
        </span>
        <span className="text-gray-400">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

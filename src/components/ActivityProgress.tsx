import type { VectorizeProgressData } from "../types";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

const STAGE_LABELS: Record<string, string> = {
  fetch: "Fetching entries",
  spam_check: "Spam check",
  llm_check: "LLM check",
  embedding: "Embedding",
  done: "Complete",
};

const STAGE_COLORS: Record<string, string> = {
  fetch: "bg-gray-500",
  spam_check: "bg-amber-500",
  llm_check: "bg-purple-500",
  embedding: "bg-blue-500",
  done: "bg-emerald-500",
};

interface Props {
  progress: VectorizeProgressData | null;
}

export default function ActivityProgress({ progress }: Props) {
  if (!progress || progress.vec_stage === "done") return null;

  const { vec_stage, stage_progress, stage_total, flagged, embedded, duration_seconds } = progress;
  const pct = stage_total > 0 ? Math.min(100, (stage_progress / stage_total) * 100) : 0;
  const label = STAGE_LABELS[vec_stage] ?? vec_stage;
  const barColor = STAGE_COLORS[vec_stage] ?? "bg-blue-500";

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Vectorizing</span>
          <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{label}</span>
        </div>
        {duration_seconds > 0 && (
          <span className="text-xs text-gray-500">{formatDuration(duration_seconds)}</span>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          <span className="text-gray-300">{stage_progress.toLocaleString()}</span>
          {" / "}
          <span className="text-gray-300">{stage_total.toLocaleString()}</span>
        </span>
        {flagged > 0 && (
          <span>
            <span className="text-yellow-400">{flagged.toLocaleString()}</span>
            {" flagged"}
          </span>
        )}
        {embedded > 0 && (
          <span>
            <span className="text-emerald-400">{embedded.toLocaleString()}</span>
            {" embedded"}
          </span>
        )}
        <span className="text-gray-400">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

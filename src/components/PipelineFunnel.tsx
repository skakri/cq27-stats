import { useState } from "react";
import type { PipelineFunnel as FunnelType, FlaggedSample } from "../types";

const STAGE_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
];

function pct(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

export default function PipelineFunnel({ funnel }: { funnel: FunnelType }) {
  const [showSamples, setShowSamples] = useState(false);
  const maxCount = Math.max(...funnel.stages.map((s) => s.count), 1);
  const samples = funnel.stages.find((s) => s.samples?.length)?.samples;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Pipeline Funnel</h2>
      <div className="space-y-2">
        {funnel.stages.map((stage, i) => {
          const width = Math.max((stage.count / maxCount) * 100, 4);
          return (
            <div key={stage.name} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-right text-xs font-medium text-gray-400">{stage.name}</div>
              <div className="relative flex-1">
                <div
                  className={`${STAGE_COLORS[i % STAGE_COLORS.length]} h-7 rounded transition-all`}
                  style={{ width: `${width}%` }}
                />
                <div className="absolute inset-0 flex items-center pl-2">
                  <span className="text-xs font-bold text-white drop-shadow">{stage.count.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-16 shrink-0 text-right text-xs text-gray-500">
                {i > 0 && stage.drop_count > 0 ? (
                  <span className="text-red-400">-{pct(stage.drop_rate)}</span>
                ) : (
                  ""
                )}
              </div>
            </div>
          );
        })}
      </div>

      {samples && samples.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowSamples(!showSamples)}
            className="text-xs text-gray-500 underline hover:text-gray-300"
          >
            {showSamples ? "Hide" : "Show"} flagged samples ({samples.length})
          </button>
          {showSamples && (
            <div className="mt-2 space-y-1">
              {samples.map((s: FlaggedSample) => (
                <div key={s.content_hash} className="flex gap-3 rounded bg-gray-800 px-3 py-1.5 text-xs">
                  <span className="font-mono text-gray-500">{s.content_hash.slice(0, 12)}...</span>
                  <span className="text-red-400">{s.spam_score.toFixed(2)}</span>
                  <span className="text-gray-400">{s.reason ?? "no reason"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

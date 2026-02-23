import type { TopicCluster } from "../types";
import ClusterTrends from "./ClusterTrends";

const BAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
  "bg-pink-500", "bg-rose-500", "bg-orange-500", "bg-amber-500",
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500",
  "bg-indigo-400", "bg-violet-400", "bg-purple-400", "bg-fuchsia-400",
  "bg-pink-400", "bg-rose-400", "bg-orange-400", "bg-amber-400",
];

interface Props {
  clusters: TopicCluster[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function ClusterChart({ clusters, selectedId, onSelect }: Props) {
  // Sort by velocity (24h activity) descending, take top 20
  const data = [...clusters]
    .sort((a, b) => (b.velocity ?? 0) - (a.velocity ?? 0))
    .slice(0, 20);
  const maxVel = Math.max(...data.map((c) => c.velocity ?? 0), 0.1);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Top Clusters <span className="text-gray-600 font-normal normal-case">(by recent velocity)</span>
      </h2>
      {data.length === 0 ? (
        <div className="text-sm text-gray-600">No clusters yet</div>
      ) : (
        <div className="space-y-1.5">
          {data.map((c, i) => {
            const vel = c.velocity ?? 0;
            const width = Math.max((vel / maxVel) * 100, 4);
            const selected = c.id === selectedId;
            return (
              <div key={c.id}>
                <button
                  onClick={() => onSelect(selected ? null : c.id)}
                  className={`flex w-full items-center gap-3 rounded px-1 py-0.5 text-left transition-colors ${selected ? "bg-gray-800" : "hover:bg-gray-800/50"}`}
                >
                  <div className="w-36 shrink-0 truncate text-right text-xs font-medium text-gray-400" title={c.label}>
                    {c.label.length > 22 ? c.label.slice(0, 20) + "..." : c.label}
                  </div>
                  <div className="relative flex-1">
                    <div
                      className={`${BAR_COLORS[i % BAR_COLORS.length]} h-6 rounded transition-all ${selected ? "opacity-100" : "opacity-70"}`}
                      style={{ width: `${width}%` }}
                    />
                    <div className="absolute inset-0 flex items-center pl-2">
                      <span className="text-xs font-bold text-white drop-shadow">{vel.toFixed(1)}/d</span>
                    </div>
                  </div>
                </button>
                {selected && (
                  <div className="mt-1.5 mb-1.5">
                    <ClusterTrends clusterId={c.id} clusters={clusters} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

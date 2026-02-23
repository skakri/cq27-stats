import { useState } from "react";
import { useApi } from "../hooks/useApi";
import type { ClusterGraphResponse } from "../types";
import ClusterGraph from "../components/ClusterGraph";

export default function ClusterGraphPage() {
  const { data, error } = useApi<ClusterGraphResponse>("/api/v1/clusters/graph", 120_000);
  const [threshold, setThreshold] = useState(0.3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          force-directed cluster graph
          {data && <span className="ml-2 text-gray-600">({data.nodes.length} clusters)</span>}
        </span>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Similarity threshold
          <input
            type="range"
            min={0.1}
            max={0.8}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="h-1 w-24 accent-indigo-500"
          />
          <span className="w-8 text-right font-mono text-gray-400">{threshold.toFixed(2)}</span>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Error loading graph: {error}
        </div>
      )}

      {!data && !error && (
        <div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-900 p-12">
          <span className="text-sm text-gray-600">Loading cluster graph...</span>
        </div>
      )}

      {data && <ClusterGraph nodes={data.nodes} similarityThreshold={threshold} />}
    </div>
  );
}

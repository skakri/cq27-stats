import { useState, useCallback, useEffect, useRef } from "react";
import { useApi } from "./hooks/useApi";
import { useSignals } from "./hooks/useSignals";
import { fetchApi } from "./api";
import type {
  PipelineStats,
  PipelineFunnel,
  PaginatedResponse,
  TopicCluster,
  TrendSummary,
  Community,
  LiveSignals,
  SignalMessage,
  HealthSignalData,
  VectorizeProgressData,
} from "./types";
import HealthBanner from "./components/HealthBanner";
import StatsCards from "./components/StatsCards";
import PipelineFunnelChart from "./components/PipelineFunnel";
import ClusterChart from "./components/ClusterChart";
import ClusterTrends from "./components/ClusterTrends";
import TrendsPanel from "./components/TrendsPanel";
import CommunitiesGrid from "./components/CommunitiesGrid";
import ActivityProgress from "./components/ActivityProgress";

export default function App() {
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [liveHealth, setLiveHealth] = useState<HealthSignalData | null>(null);
  const [lastSignalTs, setLastSignalTs] = useState<Record<string, number>>({});
  const [vecProgress, setVecProgress] = useState<VectorizeProgressData | null>(null);

  // Seed vectorize progress from /live on initial load
  useEffect(() => {
    fetchApi<LiveSignals>("/api/v1/live").then((live) => {
      if (live?.vectorize_progress && (live.vectorize_progress as Record<string, unknown>).vec_stage) {
        setVecProgress(live.vectorize_progress as unknown as VectorizeProgressData);
      }
    }).catch(() => {});
  }, []);

  const { data: stats, error: statsErr, refetch: refetchStats } = useApi<PipelineStats>("/api/v1/stats", 30_000);
  const { data: funnel } = useApi<PipelineFunnel>("/api/v1/funnel", 60_000);
  const { data: clustersResp } = useApi<PaginatedResponse<TopicCluster>>("/api/v1/clusters?limit=20", 60_000);
  const { data: trends } = useApi<TrendSummary>("/api/v1/trends", 60_000);
  const { data: commResp } = useApi<PaginatedResponse<Community>>("/api/v1/communities?limit=100", 60_000);

  // Debounce REST refetch to avoid hammering API on rapid signals
  const refetchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => refetchStats(), 2000);
  }, [refetchStats]);

  const handleSignal = useCallback(
    (msg: SignalMessage) => {
      setLastSignalTs((prev) => ({ ...prev, [msg.signal]: (msg.data.timestamp as number) ?? Date.now() / 1000 }));

      if (msg.signal === "health.check") {
        setLiveHealth(msg.data as unknown as HealthSignalData);
      }

      if (msg.signal === "vectorize.progress") {
        const d = msg.data as unknown as VectorizeProgressData;
        setVecProgress(d);
        if (d.vec_stage === "done") {
          setTimeout(() => setVecProgress(null), 3000);
        }
      }

      // Trigger a quiet REST refetch on pipeline events
      if (["scan.complete", "vectorize.complete", "ingest.batch"].includes(msg.signal)) {
        debouncedRefetch();
      }
    },
    [debouncedRefetch],
  );

  const wsConnected = useSignals(handleSignal);

  const clusters = clustersResp?.items ?? [];
  const communities = commResp?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex items-baseline gap-3">
        <h1 className="text-lg font-bold text-gray-100">cq27</h1>
        <span className="text-sm text-gray-500">pipeline dashboard</span>
        {wsConnected && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500" title="Live WebSocket connection">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            live
          </span>
        )}
      </header>

      {statsErr && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          API error: {statsErr}
        </div>
      )}

      <HealthBanner health={liveHealth?.health ?? stats?.health ?? null} wsConnected={wsConnected} signalTs={lastSignalTs} />

      <ActivityProgress progress={vecProgress} />

      {stats && <StatsCards stats={stats} liveHealth={liveHealth} />}

      {funnel && <PipelineFunnelChart funnel={funnel} />}

      <div className="grid gap-5 lg:grid-cols-2">
        <ClusterChart
          clusters={clusters}
          onSelect={setSelectedCluster}
          selectedId={selectedCluster}
        />
        {selectedCluster != null ? (
          <ClusterTrends clusterId={selectedCluster} clusters={clusters} />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-900 p-5">
            <span className="text-sm text-gray-600">Click a cluster to view trends</span>
          </div>
        )}
      </div>

      {trends && <TrendsPanel trends={trends} />}

      <CommunitiesGrid communities={communities} />

      <footer className="pb-4 text-center text-xs text-gray-700">
        {wsConnected ? "Live updates via WebSocket" : "Auto-refreshes every 30-60s"}
      </footer>
    </div>
  );
}

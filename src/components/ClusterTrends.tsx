import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useApi } from "../hooks/useApi";
import type { TrendSnapshot, TopicCluster } from "../types";

interface Props {
  clusterId: number;
  clusters: TopicCluster[];
}

export default function ClusterTrends({ clusterId, clusters }: Props) {
  const { data, loading } = useApi<TrendSnapshot[]>(
    `/api/v1/clusters/${clusterId}/trends`,
    60_000,
  );

  const cluster = clusters.find((c) => c.id === clusterId);
  const label = cluster?.label ?? `Cluster #${clusterId}`;

  const chartData = data
    ? [...data]
        .reverse()
        .map((s) => ({
          time: new Date(s.snapshot_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
          velocity: Number(s.velocity.toFixed(2)),
          members: s.member_count,
          posts: s.post_count,
        }))
    : [];

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-400">Cluster Trends</h2>
      <div className="mb-3 text-xs text-gray-500">{label}</div>

      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : chartData.length === 0 ? (
        <div className="text-sm text-gray-600">No trend data</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#e5e7eb" }}
            />
            <Line type="monotone" dataKey="velocity" stroke="#a78bfa" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="members" stroke="#6366f1" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

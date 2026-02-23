import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useApi } from "../hooks/useApi";
import type { TrendSnapshot, TopicCluster } from "../types";

interface Props {
  clusterId: number;
  clusters: TopicCluster[];
}

export default function ClusterTrends({ clusterId }: Props) {
  const { data, loading } = useApi<TrendSnapshot[]>(
    `/api/v1/clusters/${clusterId}/trends`,
    60_000,
  );

  const chartData = data
    ? [...data]
        .reverse()
        .map((s) => ({
          time: new Date(s.snapshot_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
          velocity: Number(s.velocity.toFixed(2)),
        }))
    : [];

  if (loading) return <div className="py-2 text-sm text-gray-600">Loading...</div>;
  if (chartData.length === 0) return <div className="py-2 text-sm text-gray-600">No trend data</div>;

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 10 }} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={40} />
        <Tooltip
          contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
          labelStyle={{ color: "#e5e7eb" }}
        />
        <Line type="monotone" dataKey="velocity" stroke="#a78bfa" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

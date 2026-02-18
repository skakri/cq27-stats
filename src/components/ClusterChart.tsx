import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TopicCluster } from "../types";

interface Props {
  clusters: TopicCluster[];
  onSelect: (id: number) => void;
  selectedId: number | null;
}

export default function ClusterChart({ clusters, onSelect, selectedId }: Props) {
  const data = clusters.slice(0, 20).map((c) => ({
    id: c.id,
    label: c.label.length > 30 ? c.label.slice(0, 28) + "..." : c.label,
    fullLabel: c.label,
    count: c.member_count,
  }));

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Top Clusters</h2>
      {data.length === 0 ? (
        <div className="text-sm text-gray-600">No clusters yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(data.length * 28, 120)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis
              dataKey="label"
              type="category"
              width={180}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#e5e7eb" }}
              itemStyle={{ color: "#a78bfa" }}
              formatter={(value: number) => [value.toLocaleString(), "Members"]}
              labelFormatter={(_: unknown, payload: Array<{ payload?: { fullLabel?: string } }>) =>
                payload?.[0]?.payload?.fullLabel ?? ""
              }
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d) => onSelect(d.id)}>
              {data.map((d) => (
                <Cell
                  key={d.id}
                  fill={d.id === selectedId ? "#a78bfa" : "#6366f1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

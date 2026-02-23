import type { PipelineStats, HealthSignalData } from "../types";
import { fmtNum } from "../format";

interface CardProps {
  label: string;
  value: number | string;
  sub?: string;
}

function Card({ label, value, sub }: CardProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-5 py-4">
      <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-100">
        {typeof value === "number" ? fmtNum(value) : value}
      </div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

interface Props {
  stats: PipelineStats;
  liveHealth?: HealthSignalData | null;
}

export default function StatsCards({ stats, liveHealth }: Props) {
  // Live health signal overrides REST-polled values for real-time counts
  const posts = liveHealth?.posts ?? stats.posts;
  const comments = liveHealth?.comments ?? stats.comments;
  const embedded = liveHealth?.embedded ?? stats.embedded;
  const pending = liveHealth?.pending ?? stats.pending;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card label="Posts" value={posts} />
        <Card label="Comments" value={comments} />
        <Card label="Embedded" value={embedded} />
        <Card label="Checked" value={stats.checked} />
        <Card label="Pending" value={pending} />
        <Card label="Total" value={posts + comments} />
      </div>

      {stats.backends && Object.keys(stats.backends).length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats.backends).map(([name, b]) => (
            <div key={name} className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
              <div className="text-xs font-semibold uppercase text-gray-400">{name || "unknown"}</div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{fmtNum(b.posts)} posts</span>
                <span>{fmtNum(b.comments)} comments</span>
                {b.scans != null && <span>{fmtNum(b.scans)} scans</span>}
                {b.items_seen != null && <span>{fmtNum(b.items_seen)} seen</span>}
                {b.items_collected != null && <span>{fmtNum(b.items_collected)} collected</span>}
                {b.errors != null && b.errors > 0 && (
                  <span className="text-red-400">{b.errors} errors</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

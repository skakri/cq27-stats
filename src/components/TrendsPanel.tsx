import type { TrendSummary } from "../types";
import { fmtNum } from "../format";

const STATUS_BADGE: Record<string, string> = {
  Hot: "bg-red-500/20 text-red-400",
  Active: "bg-orange-500/20 text-orange-400",
  Moderate: "bg-yellow-500/20 text-yellow-400",
  Quiet: "bg-gray-500/20 text-gray-400",
  SURGE: "bg-fuchsia-500/20 text-fuchsia-400",
};

function Badge({ status }: { status?: string }) {
  if (!status) return null;
  const cls = STATUS_BADGE[status] ?? "bg-gray-500/20 text-gray-400";
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{status}</span>;
}

function QualityDot({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 0.7 ? "bg-emerald-400" : score >= 0.4 ? "bg-yellow-400" : "bg-red-400";
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} title={`Signal: ${score.toFixed(2)}`} />
  );
}

export default function TrendsPanel({ trends }: { trends: TrendSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Hottest</h2>
        {trends.hottest.length === 0 ? (
          <div className="text-sm text-gray-600">No data</div>
        ) : (
          <div className="space-y-2">
            {trends.hottest.map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded bg-gray-800/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate text-sm text-gray-200">
                    <QualityDot score={t.quality_score} />
                    {t.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {t.velocity != null && <span>{t.velocity.toFixed(1)} posts/day</span>}
                    {t.arrow && <span>{t.arrow}</span>}
                  </div>
                </div>
                <Badge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Emerging</h2>
        {trends.emerging.length === 0 ? (
          <div className="text-sm text-gray-600">No data</div>
        ) : (
          <div className="space-y-2">
            {trends.emerging.map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded bg-gray-800/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate text-sm text-gray-200">
                    <QualityDot score={t.quality_score} />
                    {t.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {t.growth_rate != null && <span>+{t.growth_rate.toFixed(2)}/hr</span>}
                    {t.member_count != null && <span>{fmtNum(t.member_count)} members</span>}
                    {t.arrow && <span>{t.arrow}</span>}
                  </div>
                </div>
                <Badge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

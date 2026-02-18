import type { Community } from "../types";

export default function CommunitiesGrid({ communities }: { communities: Community[] }) {
  if (communities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Communities</h2>
        <div className="text-sm text-gray-600">No communities</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Communities</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {communities.map((c) => (
          <div key={c.id} className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
            <div className="text-sm font-medium text-gray-200">c/{c.name}</div>
            {c.display_name && <div className="text-xs text-gray-500">{c.display_name}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

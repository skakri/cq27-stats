# cq27-stats

Pipeline dashboard for [cq27](https://github.com/skakri/cq27-molty). Shows real-time stats, spam funnel, cluster trends, and community overview.

Built with React 19, Recharts, Tailwind CSS 4, and Vite 6. Deployed as an nginx Docker container proxying API requests to the cq27 daemon.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
```

Vite proxies `/api` requests (including WebSocket upgrades) to `localhost:9000` where the cq27 API frontend listens.

Set `VITE_API_URL` to override the API base URL:

```bash
VITE_API_URL=http://192.168.1.10:9000 npm run dev
```

## Production

```bash
docker build -t cq27-stats:latest .
docker run -d --name cq27-stats --network host cq27-stats:latest
```

The container serves on port 8081. nginx proxies `/api/` to `127.0.0.1:9000` with WebSocket upgrade support.

Manage via systemd:

```bash
systemctl --user start cq27-stats
systemctl --user stop cq27-stats
```

## Architecture

```
cq27 daemon (port 9000)
  ├── REST API   /api/v1/*        (stats, funnel, clusters, trends, communities)
  └── WebSocket  /api/v1/ws/signals  (live signal stream)

cq27-stats (port 8081)
  ├── nginx (static files + reverse proxy)
  └── React SPA
       ├── useApi hook      (REST polling, 30-60s intervals)
       └── useSignals hook  (WebSocket, instant updates, auto-reconnect)
```

The dashboard connects via WebSocket for instant updates when pipeline events occur (scans, vectorization, health checks, clustering). REST polling remains as fallback when WebSocket is unavailable.

## Components

| Component | Description |
|-----------|-------------|
| `HealthBanner` | Pipeline health status badge with live signal timestamps |
| `StatsCards` | Post/comment/embedded/pending counts (live-updated via WebSocket) |
| `PipelineFunnel` | Ingested -> checked -> clean -> embedded -> clustered funnel chart |
| `ClusterChart` | Top clusters by member count (bar chart) |
| `ClusterTrends` | Per-cluster velocity over time (line chart) |
| `TrendsPanel` | Hottest and emerging topic clusters |
| `CommunitiesGrid` | Community listing |

## WebSocket Signals

The `/api/v1/ws/signals` endpoint streams all signal types:

| Signal | Description |
|--------|-------------|
| `health.check` | Pipeline health with post/comment/embedded/pending counts |
| `scan.complete` | Backend scan finished |
| `vectorize.complete` | Embedding batch completed |
| `ingest.batch` | Items ingested into DB |
| `cluster.complete` | Full clustering run finished |
| `cluster.incremental` | Incremental clustering run |
| `cluster.detail` | Per-cluster detail after clustering |
| `cluster.trend` | Per-cluster trend after snapshot |

Message format:

```json
{
  "signal": "health.check",
  "data": {
    "timestamp": 1708272000.0,
    "posts": 12345,
    "comments": 45678,
    "embedded": 50000,
    "pending": 234,
    "health": "healthy"
  }
}
```

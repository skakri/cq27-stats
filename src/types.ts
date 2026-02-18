export interface PipelineStats {
  posts: number;
  comments: number;
  artifacts: number;
  embedded: number;
  checked: number;
  pending: number;
  total: number;
  health: string;
  backends: Record<string, BackendStats> | null;
}

export interface BackendStats {
  posts: number;
  comments: number;
  scans?: number;
  items_found?: number;
  errors?: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  drop_count: number;
  drop_rate: number;
  samples?: FlaggedSample[];
}

export interface FlaggedSample {
  content_hash: string;
  spam_score: number;
  reason: string | null;
  checked_at: string;
}

export interface PipelineFunnel {
  stages: FunnelStage[];
}

export interface TopicCluster {
  id: number;
  label: string;
  description: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  total: number;
  offset: number;
  limit: number;
  items: T[];
}

export interface TrendSnapshot {
  id: number;
  cluster_id: number;
  snapshot_at: string;
  member_count: number;
  post_count: number;
  velocity_count: number;
  community_count: number;
  author_count: number;
  velocity: number;
}

export interface TrendEntry {
  label: string;
  velocity?: number;
  status?: string;
  arrow?: string;
  growth_rate?: number;
  member_count?: number;
  cluster_id?: number;
}

export interface TrendSummary {
  hottest: TrendEntry[];
  emerging: TrendEntry[];
}

export interface Community {
  id: string;
  name: string;
  display_name: string | null;
}

export interface LiveSignals {
  health: Record<string, unknown> | null;
  vectorize: Record<string, unknown> | null;
  vectorize_progress: Record<string, unknown> | null;
  scan: Record<string, unknown> | null;
}

export interface SignalMessage {
  signal: string;
  data: Record<string, unknown>;
}

export interface HealthSignalData {
  timestamp: number;
  posts: number;
  comments: number;
  embedded: number;
  pending: number;
  health: string;
}

export interface VectorizeProgressData {
  timestamp: number;
  vec_stage: string;
  stage_progress: number;
  stage_total: number;
  flagged: number;
  embedded: number;
  duration_seconds: number;
}

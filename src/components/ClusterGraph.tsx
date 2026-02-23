import { useEffect, useRef, useState, useCallback } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { scaleOrdinal, scaleLinear } from "d3-scale";
import type { ClusterGraphNode } from "../types";
import Tooltip from "./Tooltip";

// ── Cosine similarity ──────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Types ──────────────────────────────────────────────────────────

interface GraphNode extends SimulationNodeDatum {
  id: number;
  label: string;
  member_count: number;
  description: string | null;
  radius: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  similarity: number;
}

// ── Color palette ──────────────────────────────────────────────────

const NODE_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#2563eb", "#7c3aed", "#c026d3",
];

const colorScale = scaleOrdinal<number, string>(NODE_COLORS);

// ── Helpers ────────────────────────────────────────────────────────

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number, viewBox: ViewBox): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  const scaleX = viewBox.w / rect.width;
  const scaleY = viewBox.h / rect.height;
  return {
    x: viewBox.x + (clientX - rect.left) * scaleX,
    y: viewBox.y + (clientY - rect.top) * scaleY,
  };
}

function pinchDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Component ──────────────────────────────────────────────────────

interface Props {
  nodes: ClusterGraphNode[];
  similarityThreshold?: number;
}

export default function ClusterGraph({ nodes, similarityThreshold = 0.3 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);

  // Drag state (node dragging)
  const dragRef = useRef<{ node: GraphNode; offsetX: number; offsetY: number } | null>(null);

  // Pan/zoom state
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, w: 900, h: 600 });
  const panRef = useRef<{ startX: number; startY: number; vbStart: ViewBox } | null>(null);
  const pinchRef = useRef<{ dist: number; vbStart: ViewBox; centerX: number; centerY: number } | null>(null);

  // Sync viewBox dimensions when container resizes
  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: dimensions.width, h: dimensions.height });
  }, [dimensions.width, dimensions.height]);

  // Measure container
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    observer.observe(svg.parentElement!);
    return () => observer.disconnect();
  }, []);

  // Build graph data and run simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const radiusScale = scaleLinear()
      .domain([0, Math.max(...nodes.map((n) => n.member_count))])
      .range([8, 40]);

    const graphNodes: GraphNode[] = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      member_count: n.member_count,
      description: n.description,
      radius: radiusScale(n.member_count),
    }));

    const graphLinks: GraphLink[] = [];
    const withCentroids = nodes.filter((n) => n.centroid && n.centroid.length > 0);
    for (let i = 0; i < withCentroids.length; i++) {
      for (let j = i + 1; j < withCentroids.length; j++) {
        const sim = cosineSimilarity(withCentroids[i].centroid!, withCentroids[j].centroid!);
        if (sim >= similarityThreshold) {
          graphLinks.push({
            source: withCentroids[i].id,
            target: withCentroids[j].id,
            similarity: sim,
          });
        }
      }
    }

    const nodeMap = new Map(graphNodes.map((n) => [n.id, n]));
    const resolvedLinks: GraphLink[] = graphLinks
      .filter((l) => nodeMap.has(l.source as number) && nodeMap.has(l.target as number))
      .map((l) => ({
        source: nodeMap.get(l.source as number)!,
        target: nodeMap.get(l.target as number)!,
        similarity: l.similarity,
      }));

    setGraphData({ nodes: graphNodes, links: resolvedLinks });

    const sim = forceSimulation(graphNodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(resolvedLinks)
          .id((d) => d.id)
          .distance((d) => 150 * (1 - d.similarity))
          .strength((d) => d.similarity * 0.5),
      )
      .force("charge", forceManyBody().strength(-200))
      .force("center", forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collide", forceCollide<GraphNode>().radius((d) => d.radius + 4))
      .alpha(1)
      .alphaDecay(0.02);

    sim.on("tick", () => {
      setGraphData((prev) => (prev ? { ...prev } : null));
    });

    simulationRef.current = sim;
    return () => { sim.stop(); };
  }, [nodes, similarityThreshold, dimensions.width, dimensions.height]);

  // ── Hit test: find node under point ──────────────────────────────

  const findNodeAt = useCallback((svgX: number, svgY: number): GraphNode | null => {
    if (!graphData) return null;
    for (let i = graphData.nodes.length - 1; i >= 0; i--) {
      const n = graphData.nodes[i];
      if (n.x == null || n.y == null) continue;
      const dx = svgX - n.x, dy = svgY - n.y;
      if (dx * dx + dy * dy <= n.radius * n.radius) return n;
    }
    return null;
  }, [graphData]);

  // ── Mouse handlers (desktop) ─────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, node: GraphNode) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const p = clientToSvg(svg, e.clientX, e.clientY, viewBox);
      dragRef.current = { node, offsetX: p.x - (node.x ?? 0), offsetY: p.y - (node.y ?? 0) };
      node.fx = node.x;
      node.fy = node.y;
      simulationRef.current?.alphaTarget(0.3).restart();
    },
    [viewBox],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const p = clientToSvg(svg, e.clientX, e.clientY, viewBox);
    const { node, offsetX, offsetY } = dragRef.current;
    node.fx = p.x - offsetX;
    node.fy = p.y - offsetY;
  }, [viewBox]);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current.node.fx = null;
    dragRef.current.node.fy = null;
    dragRef.current = null;
    simulationRef.current?.alphaTarget(0);
  }, []);

  // ── Wheel zoom ───────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;

    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const p = clientToSvg(svg, e.clientX, e.clientY, viewBox);

    setViewBox((vb) => {
      const nw = vb.w * factor;
      const nh = vb.h * factor;
      return {
        x: p.x - (p.x - vb.x) * factor,
        y: p.y - (p.y - vb.y) * factor,
        w: nw,
        h: nh,
      };
    });
  }, [viewBox]);

  // ── Touch handlers (mobile) ──────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const p = clientToSvg(svg, t.clientX, t.clientY, viewBox);
      const node = findNodeAt(p.x, p.y);

      if (node) {
        // Drag node
        e.preventDefault();
        dragRef.current = { node, offsetX: p.x - (node.x ?? 0), offsetY: p.y - (node.y ?? 0) };
        node.fx = node.x;
        node.fy = node.y;
        simulationRef.current?.alphaTarget(0.3).restart();
        setTooltip({ x: t.clientX, y: t.clientY, node });
      } else {
        // Pan
        panRef.current = { startX: t.clientX, startY: t.clientY, vbStart: { ...viewBox } };
      }
    } else if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      dragRef.current = null;
      panRef.current = null;
      const dist = pinchDistance(e.touches[0], e.touches[1]);
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchRef.current = { dist, vbStart: { ...viewBox }, centerX: cx, centerY: cy };
    }
  }, [viewBox, findNodeAt]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return;

    if (e.touches.length === 1 && dragRef.current) {
      // Drag node
      e.preventDefault();
      const t = e.touches[0];
      const p = clientToSvg(svg, t.clientX, t.clientY, viewBox);
      const { node, offsetX, offsetY } = dragRef.current;
      node.fx = p.x - offsetX;
      node.fy = p.y - offsetY;
    } else if (e.touches.length === 1 && panRef.current) {
      // Pan
      e.preventDefault();
      const t = e.touches[0];
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (t.clientX - panRef.current.startX) * scaleX;
      const dy = (t.clientY - panRef.current.startY) * scaleY;
      setViewBox({
        x: panRef.current.vbStart.x - dx,
        y: panRef.current.vbStart.y - dy,
        w: viewBox.w,
        h: viewBox.h,
      });
    } else if (e.touches.length === 2 && pinchRef.current) {
      // Pinch zoom
      e.preventDefault();
      const dist = pinchDistance(e.touches[0], e.touches[1]);
      const factor = pinchRef.current.dist / dist;
      const center = clientToSvg(svg, pinchRef.current.centerX, pinchRef.current.centerY, pinchRef.current.vbStart);
      const vb = pinchRef.current.vbStart;
      setViewBox({
        x: center.x - (center.x - vb.x) * factor,
        y: center.y - (center.y - vb.y) * factor,
        w: vb.w * factor,
        h: vb.h * factor,
      });
    }
  }, [viewBox]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (dragRef.current) {
      dragRef.current.node.fx = null;
      dragRef.current.node.fy = null;
      dragRef.current = null;
      simulationRef.current?.alphaTarget(0);
      setTooltip(null);
    }
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length < 1) panRef.current = null;
  }, []);

  // ── Reset zoom ───────────────────────────────────────────────────

  const resetZoom = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: dimensions.width, h: dimensions.height });
  }, [dimensions.width, dimensions.height]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-900 p-12">
        <span className="text-sm text-gray-600">No clusters available</span>
      </div>
    );
  }

  const vbStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height={600}
        viewBox={vbStr}
        className="rounded-lg border border-gray-800 bg-gray-950 touch-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setTooltip(null); }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Edges */}
        {graphData?.links.map((link, i) => {
          const s = link.source as GraphNode;
          const t = link.target as GraphNode;
          if (s.x == null || t.x == null) return null;
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth={1 + link.similarity * 3}
              strokeOpacity={0.2 + link.similarity * 0.6}
            />
          );
        })}

        {/* Nodes */}
        {graphData?.nodes.map((node) => {
          if (node.x == null || node.y == null) return null;
          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              style={{ cursor: "grab" }}
              onMouseDown={(e) => handleMouseDown(e, node)}
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, node })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle
                r={node.radius}
                fill={colorScale(node.id)}
                fillOpacity={0.7}
                stroke={colorScale(node.id)}
                strokeWidth={1.5}
                strokeOpacity={0.9}
              />
              {node.radius > 12 && (
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fill="white"
                  fontSize={Math.min(10, node.radius * 0.6)}
                  pointerEvents="none"
                  className="select-none"
                >
                  {node.label.length > 14 ? node.label.slice(0, 12) + "..." : node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Reset zoom button */}
      <button
        onClick={resetZoom}
        className="absolute bottom-3 right-3 rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
        title="Reset zoom"
      >
        Reset
      </button>

      {tooltip && (
        <Tooltip x={tooltip.x} y={tooltip.y}>
          <div className="font-semibold text-gray-100">{tooltip.node.label}</div>
          <div className="text-gray-400">{tooltip.node.member_count} members</div>
          {tooltip.node.description && (
            <div className="mt-1 max-w-[200px] text-gray-500">{tooltip.node.description}</div>
          )}
        </Tooltip>
      )}
    </div>
  );
}

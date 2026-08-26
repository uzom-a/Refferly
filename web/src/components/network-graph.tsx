"use client";

import { useEffect, useRef } from "react";
import { Data, Edge, Network, Node, Options } from "vis-network";

interface NetworkNode {
  id: string;
  label: string;
  type: "user" | "worker" | "client";
  userId?: string;
  workerId?: string;
  clientId?: string;
  trustScore?: number;
  trade?: string;
  location?: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  type: "connection" | "job" | "referral";
  label?: string;
  jobId?: string;
  reviewId?: string;
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onNodeClick?: (nodeId: string, type: string) => void;
}

export function NetworkGraph({ nodes, edges, onNodeClick }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Convert network nodes to vis-network nodes
    const visNodes: Node[] = nodes.map((node) => {
      let color = { background: "#60a5fa", border: "#3b82f6" };
      let shape: "circle" | "box" | "diamond" = "circle";
      let size = 20;

      if (node.type === "user") {
        color = { background: "#fbbf24", border: "#f59e0b" };
        size = 30;
        shape = "circle";
      } else if (node.type === "worker") {
        // Color by trade
        if (node.trade === "Electrician") {
          color = { background: "#f59e0b", border: "#d97706" };
        } else if (node.trade === "Plumber") {
          color = { background: "#3b82f6", border: "#2563eb" };
        } else if (node.trade === "Cleaner") {
          color = { background: "#10b981", border: "#059669" };
        } else {
          color = { background: "#8b5cf6", border: "#7c3aed" };
        }
        shape = "box";
        size = 25;
      } else if (node.type === "client") {
        color = { background: "#10b981", border: "#059669" };
        shape = "circle";
        size = 20;
      }

      const title = node.type === "worker"
        ? `${node.label}\nTrust: ${node.trustScore ?? 0}\n${node.location ?? ""}`
        : node.label;

      return {
        id: node.id,
        label: node.label,
        color,
        font: { color: "#fff", size: node.type === "user" ? 14 : 11, face: "Lexend Deca" },
        shape,
        size,
        borderWidth: node.type === "user" ? 3 : 2,
        title,
      };
    });

    // Convert network edges to vis-network edges
    const visEdges: Edge[] = edges.map((edge) => {
      let color = { color: "#60a5fa", highlight: "#3b82f6" };
      let width = 2;
      let label = edge.label || "";

      if (edge.type === "connection") {
        color = { color: "#60a5fa", highlight: "#3b82f6" };
        label = "knows";
      } else if (edge.type === "job") {
        color = { color: "#34d399", highlight: "#10b981" };
        label = "hired";
        width = 3;
      } else if (edge.type === "referral") {
        color = { color: "#a78bfa", highlight: "#8b5cf6" };
        label = "referred";
        width = 3;
      }

      return {
        from: edge.from,
        to: edge.to,
        color,
        width,
        arrows: "to",
        label,
        font: { size: 10, color: color.color },
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.5,
        },
      };
    });

    const data: Data = { nodes: visNodes, edges: visEdges };

    const options: Options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
        font: {
          face: "Lexend Deca",
        },
      },
      edges: {
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.5,
        },
        shadow: true,
        font: {
          face: "Lexend Deca",
        },
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 200 },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.1,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
      },
      layout: {
        improvedLayout: true,
      },
    };

    const network = new Network(containerRef.current, data, options);

    // Handle node clicks
    network.on("click", (params) => {
      if (params.nodes.length > 0 && onNodeClick) {
        const nodeId = params.nodes[0] as string;
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          onNodeClick(nodeId, node.type);
        }
      }
    });

    // Handle hover
    network.on("hoverNode", () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = "pointer";
      }
    });

    network.on("blurNode", () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = "default";
      }
    });

    networkRef.current = network;

    return () => {
      network.destroy();
    };
  }, [nodes, edges, onNodeClick]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[420px] rounded-lg"
      style={{ backgroundColor: "#1e293b" }}
    />
  );
}


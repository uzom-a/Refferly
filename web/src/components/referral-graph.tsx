"use client";

import { useEffect, useMemo, useRef } from "react";
import { Data, Edge, Network, Node, Options } from "vis-network";
import type { WorkerSummary } from "@/lib/types";

interface ReferralGraphProps {
  workers: WorkerSummary[];
  minTrust?: number;
  distance?: "you" | "one" | "two" | "all";
  onNodeClick?: (nodeId: string) => void;
}

export function ReferralGraph({
  workers,
  minTrust = 60,
  distance = "two",
  onNodeClick,
}: ReferralGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const derivedClients = useMemo(() => {
    const map = new Map<string, string>();
    workers.forEach((worker) => {
      const path = worker.pathToYou ?? "";
      const parts = path.split("→").map((part) => part.trim());
      if (parts.length >= 3) {
        const clientName = parts[1];
        if (clientName && clientName.toLowerCase() !== "you") {
          map.set(clientName.toLowerCase(), clientName);
        }
      }
    });
    return map;
  }, [workers]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter workers by trust score
    const filteredWorkers = workers.filter(
      (w) => w.trust.total >= minTrust
    );

    // Filter by distance (guard against undefined inYourNetworkSteps)
    let workersToShow = filteredWorkers;
    if (distance === "you") {
      workersToShow = []; // Only show "You" node
    } else if (distance === "one") {
      workersToShow = filteredWorkers.filter((w) => w.inYourNetworkSteps === 1);
    } else if (distance === "two") {
      workersToShow = filteredWorkers.filter(
        (w) => typeof w.inYourNetworkSteps === "number" && w.inYourNetworkSteps <= 2,
      );
    }
    // "all" shows all filtered workers

    // Create nodes
    const nodes: Node[] = [
      {
        id: "you",
        label: "You",
        color: { background: "#fbbf24", border: "#f59e0b" },
        font: { color: "#000", size: 14, face: "Lexend Deca" },
        shape: "circle",
        size: 30,
        borderWidth: 3,
      },
    ];

    // Add clients derived from referral paths
    derivedClients.forEach((label, id) => {
      nodes.push({
        id,
        label,
        color: { background: "#10b981", border: "#059669" },
        font: { color: "#fff", size: 12, face: "Lexend Deca" },
        shape: "circle",
        size: 20,
      });
    });

    // Add workers
    workersToShow.forEach((worker) => {
      const getTradeColor = (trade: string) => {
        if (trade === "Electrician") return { bg: "#f59e0b", border: "#d97706" };
        if (trade === "Plumber") return { bg: "#3b82f6", border: "#2563eb" };
        if (trade === "Cleaner") return { bg: "#10b981", border: "#059669" };
        return { bg: "#8b5cf6", border: "#7c3aed" };
      };

      const colors = getTradeColor(worker.trade);
      nodes.push({
        id: worker.id,
        label: `${worker.name}\n${worker.trade}`,
        color: { background: colors.bg, border: colors.border },
        font: { color: "#fff", size: 11, face: "Lexend Deca" },
        shape: "box",
        size: 25,
        title: `${worker.name} (${worker.trade})\nTrust: ${worker.trust.total}\nLocation: ${worker.locationLabel}`,
      });
    });

    // Create edges based on pathToYou
    const edges: Edge[] = [];
    
    // Connect "You" to first-level clients
    derivedClients.forEach((_, clientId) => {
      edges.push({
        from: "you",
        to: clientId,
        color: { color: "#60a5fa", highlight: "#3b82f6" },
        width: 2,
        arrows: "to",
        label: "knows",
        font: { size: 10, color: "#60a5fa" },
      });
    });

    // Connect clients to workers based on pathToYou
    workersToShow.forEach((worker) => {
      const pathParts = worker.pathToYou?.split("→").map((part) => part.trim()) ?? [];
      if (pathParts.length >= 3) {
        const clientName = pathParts[1].toLowerCase();
        const clientId = derivedClients.has(clientName) ? clientName : null;

        if (clientId) {
          edges.push({
            from: clientId,
            to: worker.id,
            color: { color: "#34d399", highlight: "#10b981" },
            width: 2,
            arrows: "to",
            label: "referred",
            font: { size: 10, color: "#34d399" },
          });
          return;
        }
      }

      edges.push({
        from: "you",
        to: worker.id,
        color: { color: "#34d399", highlight: "#10b981" },
        width: 2,
        arrows: "to",
        label: "knows",
        font: { size: 10, color: "#34d399" },
      });
    });

    const data: Data = { nodes, edges };
    const workerIds = new Set(workersToShow.map((worker) => worker.id));

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
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string;
        if (onNodeClick && workerIds.has(nodeId)) {
          onNodeClick(nodeId);
        }
      }
    });

    // Handle hover
    network.on("hoverNode", () => {
      containerRef.current!.style.cursor = "pointer";
    });

    network.on("blurNode", () => {
      containerRef.current!.style.cursor = "default";
    });

    networkRef.current = network;

    return () => {
      network.destroy();
    };
  }, [derivedClients, distance, minTrust, onNodeClick, workers]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[420px] rounded-lg"
      style={{ backgroundColor: "#1e293b" }}
    />
  );
}


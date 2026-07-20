import React from "react";
import { BaseEdge, getSmoothStepPath, useReactFlow } from "@xyflow/react";

const EDGE_COLORS = [
  "#22d3ee",
  "#9b6cff",
  "#18d9bd",
  "#ff4fb3",
  "#f8c51c",
  "#7bdc16",
  "#ff596e",
];

const EDGE_VARIANTS = [
  {
    name: "solid",
    dasharray: undefined,
    overlayDasharray: "2 13",
    animation: "scenario-edge-shimmer 2.4s ease-in-out infinite",
  },
  {
    name: "dotted",
    dasharray: "1 8",
    overlayDasharray: "1 12",
    animation: "scenario-edge-dash 1.25s linear infinite",
  },
  {
    name: "dashed",
    dasharray: "12 8",
    overlayDasharray: "3 17",
    animation: "scenario-edge-dash 1.8s linear infinite",
  },
  {
    name: "blink",
    dasharray: undefined,
    overlayDasharray: undefined,
    animation: "scenario-edge-blink 1.35s ease-in-out infinite",
  },
  {
    name: "mixed",
    dasharray: "2 6 16 7",
    overlayDasharray: "1 7 7 17",
    animation: "scenario-edge-dash 2.1s linear infinite",
  },
];

const getStringHash = (value = "") =>
  String(value)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

const getEdgeColor = (id, data) => {
  if (data?.color) return data.color;
  return EDGE_COLORS[getStringHash(id) % EDGE_COLORS.length];
};

const getEdgeVariant = (id, data) => {
  const configuredVariant = EDGE_VARIANTS.find(
    (variant) => variant.name === data?.lineStyle,
  );
  return configuredVariant || EDGE_VARIANTS[getStringHash(id) % EDGE_VARIANTS.length];
};

const EditableEdge = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  markerEnd,
  allEdges = [],
}) => {
  const { getEdges } = useReactFlow();
  const flowEdges = allEdges.length > 0 ? allEdges : getEdges();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  const getInitialLabel = () => {
    if (data?.label) return data.label;
    const currentEdge = flowEdges.find((edge) => edge.id === id);
    const existing = flowEdges.find(
      (edge) =>
        edge.id !== id &&
        edge.target === currentEdge?.target &&
        edge.targetHandle === currentEdge?.targetHandle &&
        edge.data?.label,
    );
    return existing?.data.label || "Network Id";
  };

  const label = getInitialLabel();
  const currentEdge = flowEdges.find((edge) => edge.id === id);
  const attackedValue =
    currentEdge?.isAttacked ?? currentEdge?.data?.isAttacked ?? data?.isAttacked;
  const shouldAnimate =
    attackedValue === true ||
    attackedValue === 1 ||
    String(attackedValue).toLowerCase() === "yes" ||
    String(attackedValue).toLowerCase() === "true";
  const showPacket =
    shouldAnimate &&
    currentEdge?.showPacket !== false &&
    data?.showPacket !== false;
  const packetDuration = "2.2s";
  const edgeColor = getEdgeColor(id, data);
  const edgeVariant = getEdgeVariant(id, data);

  return (
    <>
      <path id={`edge-path-${id}`} d={edgePath} fill="none" stroke="none" />
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: 4.5,
          strokeDasharray: edgeVariant.dasharray,
          opacity: 0.08,
          filter: `drop-shadow(0 0 6px ${edgeColor})`,
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor,
          strokeWidth: 2.4,
          strokeLinecap: "round",
          strokeDasharray: edgeVariant.dasharray,
          filter: `drop-shadow(0 0 3px ${edgeColor})`,
          animation: edgeVariant.animation,
        }}
      />
      {edgeVariant.overlayDasharray && (
        <path
          className="scenario-network-edge-flow"
          d={edgePath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.78)"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeDasharray={edgeVariant.overlayDasharray}
          style={{
            animation: "scenario-edge-overlay 1.35s linear infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {showPacket && (
        <g className="scenario-network-packet">
          <circle
            r="10"
            fill={`${edgeColor}2e`}
            stroke={edgeColor}
            style={{ filter: `drop-shadow(0 0 7px ${edgeColor})` }}
          >
            <animate
              attributeName="r"
              values={shouldAnimate ? "8;13;8" : "6;10;6"}
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animateMotion
              dur={packetDuration}
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#edge-path-${id}`} />
            </animateMotion>
          </circle>
          <circle
            r="4.5"
            fill={edgeColor}
            stroke={edgeColor}
            strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 5px ${edgeColor})` }}
          >
            <animateMotion
              dur={packetDuration}
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#edge-path-${id}`} />
            </animateMotion>
          </circle>
        </g>
      )}

      <foreignObject
        width={100}
        height={40}
        x={labelX - 50}
        y={labelY - 20}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <div
            title={label || "Network Id"}
            style={{
              maxWidth: 86,
              overflow: "hidden",
              textOverflow: "ellipsis",
              padding: "3px 7px",
              border: `1px solid ${edgeColor}66`,
              borderRadius: 7,
              background: "rgba(7, 13, 25, 0.9)",
              boxShadow: `0 0 10px ${edgeColor}22`,
              color: "#aebbd0",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: "default",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {label || "Network Id"}
          </div>
        </div>
      </foreignObject>
      <style jsx global>{`
        @keyframes scenario-edge-dash {
          to { stroke-dashoffset: -52; }
        }
        @keyframes scenario-edge-overlay {
          to { stroke-dashoffset: -42; }
        }
        @keyframes scenario-edge-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.18; }
        }
        @keyframes scenario-edge-shimmer {
          0%, 100% { opacity: 0.72; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .scenario-network-edge-flow,
          .react-flow__edge-path { animation: none !important; }
        }
      `}</style>
    </>
  );
};

export default EditableEdge;

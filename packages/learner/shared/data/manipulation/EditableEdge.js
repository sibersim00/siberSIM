import React, { useState, useEffect } from 'react';
import { BaseEdge, getBezierPath, getSmoothStepPath, useReactFlow } from '@xyflow/react';
const EditableEdge = ({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data, markerEnd, allEdges,
  edgeRouting, selected,
}) => {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const pathFactory =
    (edgeRouting || data?.edgeRouting) === 'smooth'
      ? getSmoothStepPath
      : getBezierPath;
  const [edgePath, labelX, labelY] = pathFactory({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 20,
  });
  const getInitialLabel = () => {
    if (data?.label) return data.label;
    const currentEdge = allEdges.find((e) => e.id === id);
    if (!currentEdge) return 'Network Id'; // fallback to default if somehow not found
    const existing = allEdges.find(
      (e) =>
        e.id !== id &&
        e.target === currentEdge?.target &&
        e.targetHandle === currentEdge?.targetHandle &&
        e.data?.label
    );
    return existing?.data.label || 'Network Id';
  };
  const [label, setLabel] = useState(getInitialLabel);
  const saveLabel = () => {
    setIsEditing(false);
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, label } } : e
      )
    );
  };
  useEffect(() => {
    if (!data?.label && label) {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === id ? { ...e, data: { ...e.data, label } } : e
        )
      );
    }
  }, [label, data?.label, id, setEdges]);

  const currentEdge = allEdges.find(e => e.id === id);
  const attackedValue =
    currentEdge?.isAttacked ?? currentEdge?.data?.isAttacked ?? data?.isAttacked;
  const shouldAnimate =
    attackedValue === true ||
    attackedValue === 1 ||
    String(attackedValue).toLowerCase() === "yes" ||
    String(attackedValue).toLowerCase() === "true";
  const edgeColor = selected
    ? "var(--diagram-edge-selected)"
    : "var(--diagram-edge-default)";
  return (
    <>
      <path id={`edge-path-${id}`} d={edgePath} fill="none" stroke="none" />
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: 4.5,
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
          filter: `drop-shadow(0 0 3px ${edgeColor})`,
          animation: "scenario-edge-shimmer 2.4s ease-in-out infinite",
        }}
      />
      <path
        className="scenario-network-edge-flow"
        d={edgePath}
        fill="none"
        stroke="rgba(255, 255, 255, 0.78)"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeDasharray="2 13"
        style={{
          animation: "scenario-edge-overlay 1.35s linear infinite",
          pointerEvents: "none",
        }}
      />
      {shouldAnimate && (
        <g className="scenario-network-packet">
          <circle
            r="10"
            fill="rgba(226, 232, 240, 0.2)"
            stroke="rgba(226, 232, 240, 0.72)"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 0 6px rgba(248, 250, 252, 0.8))" }}
          >
            <animate attributeName="r" values="8;12;8" dur="1.1s" repeatCount="indefinite" />
            <animateMotion
              dur="2.2s"
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#edge-path-${id}`} />
            </animateMotion>
          </circle>
          <circle
            r="4"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1"
            style={{ filter: "drop-shadow(0 0 4px rgba(248, 250, 252, 0.9))" }}
          >
            <animateMotion
              dur="2.2s"
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#edge-path-${id}`} />
            </animateMotion>
          </circle>
        </g>
      )}
      <foreignObject
        width={80}
        height={40}
        x={labelX - 40}
        y={labelY - 20}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {isEditing ? (
            <input
              value={label}
              type="text"
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => e.key === 'Enter' && saveLabel()}
              autoFocus
              style={{
                fontSize: 12,
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '2px 4px',
                width: '100%',
                color: '#000',
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              style={{
                maxWidth: 70,
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
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label || 'Network Id'}
            </div>
          )}
        </div>
      </foreignObject>
      <style jsx global>{`
        @keyframes scenario-edge-overlay {
          to { stroke-dashoffset: -42; }
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




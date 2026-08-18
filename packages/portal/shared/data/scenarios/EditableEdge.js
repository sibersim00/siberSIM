import React, { useEffect, useState } from "react";
import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";

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
  edgeRouting,
  selected,
  readOnly = false,
}) => {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const routing = edgeRouting || data?.edgeRouting || "bezier";
  const pathFactory = routing === "smooth" ? getSmoothStepPath : getBezierPath;
  const [edgePath, labelX, labelY] = pathFactory({
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
    const currentEdge = allEdges.find((edge) => edge.id === id);
    if (!currentEdge) return "Network Id";
    const existing = allEdges.find(
      (edge) =>
        edge.id !== id &&
        edge.target === currentEdge.target &&
        edge.targetHandle === currentEdge.targetHandle &&
        edge.data?.label,
    );
    return existing?.data.label || "Network Id";
  };

  const [label, setLabel] = useState(getInitialLabel);
  const saveLabel = () => {
    setIsEditing(false);
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge,
      ),
    );
  };

  useEffect(() => {
    if (!data?.label && label) {
      setEdges((edges) =>
        edges.map((edge) =>
          edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge,
        ),
      );
    }
  }, [label, data?.label, id, setEdges]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected
            ? "var(--diagram-edge-selected)"
            : "var(--diagram-edge-default)",
          strokeWidth: selected ? 2.2 : 1.6,
        }}
      />
      <foreignObject
        width={80}
        height={40}
        x={labelX - 40}
        y={labelY - 20}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="portal-edge-label-wrap">
          {isEditing && !readOnly ? (
            <input
              value={label}
              type="text"
              onChange={(event) => setLabel(event.target.value)}
              onBlur={saveLabel}
              onKeyDown={(event) => event.key === "Enter" && saveLabel()}
              autoFocus
              className="portal-edge-label-input"
            />
          ) : readOnly ? (
            <div className="portal-edge-label">
              {label || "Network Id"}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="portal-edge-label"
            >
              {label || "Network Id"}
            </button>
          )}
        </div>
      </foreignObject>
    </>
  );
};

export default EditableEdge;

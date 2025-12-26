import React, { useState } from 'react';
import { BaseEdge, getSmoothStepPath, useReactFlow } from '@xyflow/react';

const EditableEdgeAdmin = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  markerEnd,
  allEdges, 
}) => {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });
console.log('allEdgesallEdgesallEdgesallEdges',allEdges)
  const getInitialLabel = () => {
    if (data?.label) return data.label;
    const currentEdge = allEdges.find((e) => e.id === id);
    
    console.log('allEdges',allEdges)
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

const currentEdge = allEdges.find(e => e.id === id);
console.log("currentEdge",currentEdge);

const shouldAnimate = currentEdge?.isAttacked === "Yes";
console.log('shouldAnimate', shouldAnimate, allEdges.find(e => e.id === id));


  return (
    <>
      <path id={`edge-path-${id}`} d={edgePath} fill="none" stroke="none" />
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      
      {shouldAnimate && (
        <circle r="8" fill="red">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            rotate="auto"
            keyPoints="1;0"
            keyTimes="0;1"
            calcMode="linear"
          >
            <mpath href={`#edge-path-${id}`} />
          </animateMotion>
        </circle>
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
          {/* {isEditing ? (
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
              }}
            />
          ) : ( */}
            <div
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: 12,
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label || 'Network Id'}
            </div>
          {/* )} */}
        </div>
      </foreignObject>
    </>
  );
};

export default EditableEdgeAdmin;

import React, { useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EditableEdge from '../../../shared/data/scenarios/EditableEdge';
const resolveImageUrl = (url) => {
  if (!url) return '';
  const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
  return isAbsolute ? url : `${window.location.origin}${url}`;
};

const ImageNode = ({ id, data, isConnectable, deleteNode }) => {
  const networkPorts = data.networkport || [];
  const portKeys = networkPorts.flatMap(obj => Object.keys(obj)).sort();
  const totalPorts = portKeys.length;
  const sides = ['Right', 'Bottom', 'Left', 'Top'];
  const portsPerSide = Math.ceil(totalPorts / 4);
  const spacingRatio = 100 / (portsPerSide + 1);
  const baseSize = 90;
  const portSpacing = 15;
  const nodeSize = Math.max(baseSize, portsPerSide * portSpacing + 20);

  const handleClick = (dataobj) => {
    const vmid = dataobj?.vmid;
    const vmType = dataobj?.vmType;
    if (!vmid) return;
    window.open(`${process.env.BASE_PATH}vnc_view/${vmType}/${vmid}`, "_blank");
  };
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      onClick={() => handleClick(data)}
    >
      <div
        style={{
          width: nodeSize,
          height: nodeSize,
          position: 'relative',
          borderRadius: '8px',
          border: '2px solid #ccc',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            width: nodeSize * 0.6,
            height: nodeSize * 0.6,
            backgroundImage: `url("${resolveImageUrl(data.image)}")`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {portKeys.map((portKey, index) => {
          const sideIndex = Math.floor(index / portsPerSide);
          const side = sides[sideIndex];
          const positionIndex = index % portsPerSide;
          let offsetPercent;

          if (side === 'Right' || side === 'Top') {
            offsetPercent = (positionIndex + 1) * spacingRatio;
          } else {
            offsetPercent = (portsPerSide - positionIndex) * spacingRatio;
          }

          const baseHandleStyle = {
            position: 'absolute',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#005eff',
            border: '1px solid white',
            zIndex: 2,
          };

          const labelStyle = {
            position: 'absolute',
            fontSize: 6,
            background: '#fff',
            padding: '1px 3px',
            whiteSpace: 'nowrap',
            zIndex: 5,
          };

          let handleStyle = {};
          let labelPosition = {};

          switch (side) {
            case 'Top':
              handleStyle = { ...baseHandleStyle, top: -5, left: `${offsetPercent}%`, transform: 'translateX(-50%)' };
              labelPosition = { ...labelStyle, top: -20, left: `${offsetPercent}%`, transform: 'translateX(-50%)' };
              break;
            case 'Right':
              handleStyle = { ...baseHandleStyle, right: -5, top: `${offsetPercent}%`, transform: 'translateY(-50%)' };
              labelPosition = { ...labelStyle, right: -50, top: `${offsetPercent}%`, transform: 'translateY(-50%)' };
              break;
            case 'Bottom':
              handleStyle = { ...baseHandleStyle, bottom: -5, left: `${offsetPercent}%`, transform: 'translateX(-50%)' };
              labelPosition = { ...labelStyle, bottom: -20, left: `${offsetPercent}%`, transform: 'translateX(-50%)' };
              break;
            case 'Left':
              handleStyle = { ...baseHandleStyle, left: -5, top: `${offsetPercent}%`, transform: 'translateY(-50%)' };
              labelPosition = { ...labelStyle, left: -50, top: `${offsetPercent}%`, transform: 'translateY(-50%)' };
              break;
            default:
              break;
          }

          return (
            <React.Fragment key={portKey}>
              <Handle
                type="source"
                position={Position[side]}
                id={`${portKey}-source`}
                style={handleStyle}
                isConnectable={isConnectable}
              />
              <Handle
                type="target"
                position={Position[side]}
                id={`${portKey}-target`}
                style={handleStyle}
                isConnectable={isConnectable}
              />
              <div style={labelPosition}>{portKey}</div>
            </React.Fragment>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 10,
          textAlign: 'center',
          width: '100%',
          zIndex: 10,
          position: 'relative',
          background: '#fff',
          padding: '0 1px',
        }}
      >
        {data.label || 'Unnamed'}

        {data.isOnline === 'Yes' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            color: 'green',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'green',
              marginRight: 4,
            }} />
            Online
          </div>
        )}
      </div>
    </div>
  );
};

const ScenarioDiagram = ({ scenariodiagram }) => {
  const [elements, setelements] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    if (scenariodiagram && scenariodiagram !== '') {
      try {
        const cleanData = scenariodiagram.replace('flowchartData ', '');
        const parsedData = JSON.parse(cleanData);
        const backendBaseUrl = process.env.API_URL_FILEMANAGER;
        const updatedNodes = parsedData.nodes.map(node => {
          const imageUrl = node.data.image;
          if (imageUrl && imageUrl.startsWith('/uploads')) {
            node.data.image = `${backendBaseUrl}${imageUrl}`;
          }
          return node;
        });
        setelements({
          nodes: updatedNodes,
          edges: parsedData.edges,
        });
      } catch (err) {
        console.error('Failed to parse scenariodiagram:', err);
      }
    }
  }, [scenariodiagram]);

  const FlowViewportController = ({ nodes }) => null;
  const reactFlowWrapper = useRef(null);
  const EditableEdgeWrapper = (edgeProps) => {
    const { getEdges, setEdges } = useReactFlow();
    const edges = getEdges();
    return (
      <EditableEdge
        {...edgeProps}
        allEdges={edges}
        setEdges={setEdges}
      />
    );
  };
  const nodeTypes = {
    imageNode: (props) => <ImageNode {...props}/>
  };
  const edgeTypes = { custom: EditableEdgeWrapper };
  return (
    <>
      <style>
        {`
          .react-flow__container{
            top : -75px;
            left: 115px;
          }
        `}
      </style>
      <div
        className="reactflow-wrapper"
        ref={reactFlowWrapper}
        style={{
          width: '100%',
          height: '80vh',
          borderRadius: '8px',
        }}
      >
        {elements.nodes.length > 0 && elements.edges.length > 0 && (
          <ReactFlow
            nodes={elements.nodes}
            edges={elements.edges}
            nodeTypes={nodeTypes}
            onInit={(reactFlowInstance) => {
              setTimeout(() => {
                reactFlowInstance.fitView();
              }, 100);
            }}
            zoomOnDoubleClick={false}
            edgeTypes={edgeTypes}
          >
            <FlowViewportController nodes={elements.nodes} />
            <Background />
          </ReactFlow>
        )}
      </div>
    </>
  );
};
ScenarioDiagram.layout = "Contentlayout";
export default ScenarioDiagram;

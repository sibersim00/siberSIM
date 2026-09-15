import React, { useEffect, useState, useRef } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDispatch, useSelector } from "react-redux";
import EditableEdge from '../../../../../shared/data/scenarios/EditableEdge';
import ScenarioDiagramNode from '../../../../../shared/data/scenarios/ScenarioDiagramNode';

const resolveImageUrl = (url) => {
  if (!url) return '';

  const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
  const isStatic = url.startsWith('/_next') || url.startsWith('/static') || url.startsWith('/images');
  if (isAbsolute) {
    return url;
  } else {
    return `${window.location.origin}${url}`;

  }
};
const ImageNode = ({ id, data, isConnectable, deleteNode }) => {
  // const networkPorts = data.networkport || [];
  // const portKeys = networkPorts.flatMap(obj => Object.keys(obj)).sort();
      let portKeys = [];

    if (Array.isArray(data.networkport)) {
      portKeys = data.networkport
        .flatMap((obj) =>
          Object.entries(obj).map(([key, value]) => {
            const tagMatch = value.match(/tag=(\d+)/);
            return {
              key, // net0 / net1
              label: tagMatch ? `${key} : VLAN-${tagMatch[1]}` : key,
            };
          }),
        )
        .sort((a, b) => a.key.localeCompare(b.key));
    } else if (
      typeof data.networkport === "object" &&
      data.networkport !== null
    ) {
      portKeys = Object.entries(data.networkport)
        .map(([key, value]) => {
          const tagMatch = value.match(/tag=(\d+)/);
          return {
            key,
            label: tagMatch ? `${key} : VLAN-${tagMatch[1]}` : key,
          };
        })
        .sort((a, b) => a.key.localeCompare(b.key));
    } else {
      portKeys = [];
    }

  const totalPorts = portKeys.length;
  const sides = ['Right', 'Bottom', 'Left', 'Top'];
  const portsPerSide = Math.ceil(totalPorts / 4);
  const spacingRatio = 100 / (portsPerSide + 1);

  const baseSize = 90;
  const portSpacing = 15;
  const nodeSize = Math.max(baseSize, portsPerSide * portSpacing + 20);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: nodeSize,
          height: nodeSize,
          position: 'relative',
          borderRadius: '8px',
          border: '2px solid #ccc',
          // background: '#fff',
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
        {portKeys.map((port, index) => {
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
            // background: '#fff',
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
              labelPosition = { ...labelStyle, right: -60, top: `${offsetPercent}%`, transform: 'translateY(-10%)' };
              break;
            case 'Bottom':
              handleStyle = { ...baseHandleStyle, bottom: -5, left: `${offsetPercent}%`, transform: 'translateX(-50%)' };
              labelPosition = { ...labelStyle, bottom: -20, left: `${offsetPercent}%`, transform: 'translateX(-50%)' };
              break;
            case 'Left':
              handleStyle = { ...baseHandleStyle, left: -5, top: `${offsetPercent}%`, transform: 'translateY(-50%)' };
              labelPosition = { ...labelStyle, left: -60, top: `${offsetPercent}%`, transform: 'translateY(-10%)' };
              break;
            default:
              break;
          }

          return (
            <React.Fragment key={port.key}>
              <Handle
                type="source"
                position={Position[side]}
                id={`${port.key}-source`}
                style={handleStyle}
                isConnectable={isConnectable}
              />
              <Handle
                type="target"
                position={Position[side]}
                id={`${port.key}-target`}
                style={handleStyle}
                isConnectable={isConnectable}
              />
              <div style={labelPosition}>{port.label}</div>
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
          // background: '#fff',
          padding: '0 2px',
        }}
      >
        {data.label || 'Unnamed'}
      </div>
    </div>
  );
};
const nodeTypes = {
  imageNode: (props) => <ScenarioDiagramNode {...props} interactive={false} />,
};

const ScenarioDiagram = ({ scenariodiagram }) => {
  const dispatch = useDispatch();
  const {
    getScenarioFlowchart
  } = useSelector((state) => {
    return {
      getScenarioFlowchart: state?.commonMaster?.flowchart?.data,
      errorData: state && state.commonMaster && state.commonMaster.error,
    };
  });
  const [elements, setelements] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    if (scenariodiagram && scenariodiagram !== '') {
      try {
        const cleanData = scenariodiagram.replace('flowchartData ', '');
        const parsedData = JSON.parse(cleanData);
        const edgeRouting = parsedData.edgeRouting === 'smooth' ? 'smooth' : 'bezier';

        // Your backend base URL where images are served from
        const backendBaseUrl = process.env.API_URL_FILEMANAGER;

        const updatedNodes = parsedData.nodes.map(node => {
          const imageUrl = node.data.image;
          if (imageUrl && imageUrl.startsWith('/uploads')) {
            // Prefix with backend URL + /jobapi + image path
            node.data.image = `${backendBaseUrl}${imageUrl}`;
          }
          return node;
        });

        setelements({
          nodes: updatedNodes,
          edges: (parsedData.edges || []).map(edge => ({
            ...edge,
            type: 'custom',
            data: { ...edge.data, edgeRouting },
          })),
        });
      } catch (err) {
        console.error('Failed to parse scenariodiagram:', err);
      }
    }
  }, [scenariodiagram]);
  const FlowViewportController = ({ nodes }) => {
    const { setCenter } = useReactFlow();
    useEffect(() => {
      if (nodes.length > 0) {
        setCenter(500, 300, {
          zoom: 0.7,
        });
      }
    }, [nodes, setCenter]);
    return null;
  };
  const reactFlowWrapper = useRef(null);
  const EditableEdgeWrapper = (edgeProps) => {
    const { getEdges, setEdges } = useReactFlow();
    // You can also pull labelMap or other shared state from context/store here
    const edges = getEdges(); // all current edges
    return (
      <EditableEdge
        {...edgeProps}
        allEdges={edges}
        setEdges={setEdges}
        readOnly
      />
    );
  };
  const edgeTypes = {
    custom: EditableEdgeWrapper,
  };
  return (
    <>
      <style>
      </style>
      <Row className="row-sm mg-t-10">
        <Col md={12}>
          <Card className="custom-card">
            <Card.Body>
              <div
                className="reactflow-wrapper"
                ref={reactFlowWrapper}
                style={{
                  width: '100%', height: '80vh',
                  borderRadius: '8px',
                }}
              >
                {elements.nodes.length > 0 && elements.edges.length > 0 && (
                  <ReactFlow
                    className="portal-flow-canvas portal-flow-canvas--view-only"
                    nodes={elements.nodes}
                    edges={elements.edges}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    nodeTypes={nodeTypes}
                    onInit={(reactFlowInstance) => {
                      setTimeout(() => {
                        reactFlowInstance.fitView();
                      }, 100); 
                    }}
                    zoomOnDoubleClick={false}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.6 }} edgeTypes={edgeTypes}
                  >
                    <FlowViewportController nodes={elements.nodes} />
                    <Background color="var(--diagram-grid, #64748b)" />
                  </ReactFlow>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

ScenarioDiagram.layout = "Contentlayout";
export default ScenarioDiagram;

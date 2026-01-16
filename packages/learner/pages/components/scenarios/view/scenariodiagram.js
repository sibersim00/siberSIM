import React, { useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EditableEdge from '../../../../shared/data/scenarios/EditableEdge';
import { useDispatch,  } from "react-redux";
import { qemuconfig ,vmStartScenario } from "../../../../shared/redux/slices/scenarios/scenarios";
const resolveImageUrl = (url) => {
  if (!url) return '';
  const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
  return isAbsolute ? url : `${window.location.origin}${url}`;
};
const ImageNode = ({ id, data, isConnectable, deleteNode, isTimerVisible, scenarioStatus }) => {
  const networkPorts = data.networkport || [];
  const portKeys = networkPorts.flatMap(obj => Object.keys(obj)).sort();
  const totalPorts = portKeys.length;
  const sides = ['Right', 'Bottom', 'Left', 'Top'];
  const portsPerSide = Math.ceil(totalPorts / 4);
  const spacingRatio = 100 / (portsPerSide + 1);
  const baseSize = 90;
  const portSpacing = 15;
  const nodeSize = Math.max(baseSize, portsPerSide * portSpacing + 20);
    const dispatch = useDispatch();



  // const handleClick = (dataobj) => {
  //   if (scenarioStatus === "Pause") return;
  //   if (!isTimerVisible) return;
  //   const vmid = dataobj?.vmid;
  //   const vmType = dataobj?.vmType;
  //   console.log("vmidvmType", vmid, vmType)
  //   if (!vmid || !vmType) return;
  //   if (vmid && vmType) {
  //     const payload = {
  //       vmid: Number(vmid),
  //       vmType,
  //     };
  //     const res = dispatch(qemuconfig(payload));
  //     console.log("res",res)
  //   }

  //   const rawLabel = dataobj?.label || "";
  //   const namePart = rawLabel.split("-")[1]?.trim() || "";
  //   const cleanName = namePart.replace(/\s+/g, "").toLowerCase();
  //   window.open(
  //     `${process.env.BASE_PATH}vnc_view/${vmType}/${vmid}/${cleanName}`,
  //     "_blank"
  //   );
  // };

const handleClick = (dataobj) => {
  if (scenarioStatus === "Pause") return;
  if (!isTimerVisible) return;

  const vmid = dataobj?.vmid;
  const vmType = dataobj?.vmType;

  if (!vmid || !vmType) return;

  const payload = {
    vmid: Number(vmid),
    vmType,
  };

  dispatch(qemuconfig(payload)).then((res) => {
    // const res = action?.payload;

    console.log("qemuconfig response", res);

    // if (res?.mustStopVM === true) {
    //   dispatch(vmStartScenario({ vmid, vmType }));
    // }

    const rawLabel = dataobj?.label || "";
    const namePart = rawLabel.split("-")[1]?.trim() || "";
    const cleanName = namePart.replace(/\s+/g, "").toLowerCase();

    window.open(
      `${process.env.BASE_PATH}vnc_view/${vmType}/${vmid}/${cleanName}`,
      "_blank"
    );
  });
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
          // background: '#fff',
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


const ScenarioDiagram = ({ scenariodiagram, isTimerVisible, scenarioStatus }) => {
  console.log("scenariodiagram", scenariodiagram);

  const [elements, setElements] = useState({ nodes: [], edges: [] });
  const reactFlowWrapper = useRef(null);
  const flowRef = useRef(null);

  useEffect(() => {
    if (!scenariodiagram) return;

    try {
      const cleanData = scenariodiagram.replace('flowchartData ', '');
      console.log("cleanDatacleanDatacleanData", cleanData);

      const parsedData = JSON.parse(cleanData);
      console.log("parsedDataparsedDataparsedData", parsedData);

      const backendBaseUrl = process.env.API_URL_FILEMANAGER;

      const updatedNodes = parsedData.nodes.map(node => ({
        ...node,
        position: node.position || { x: 0, y: 0 }, // Ensure position exists
        data: {
          ...node.data,
          image:
            node.data.image && node.data.image.startsWith('/uploads')
              ? `${backendBaseUrl}${node.data.image}`
              : node.data.image,
        },
      }));
      console.log("updatedNodesupdatedNodesupdatedNodes",updatedNodes);
      

      setElements({ nodes: updatedNodes, edges: parsedData.edges });
    } catch (err) {
      console.error('Failed to parse scenariodiagram:', err);
    }
  }, [scenariodiagram]);

  // Center graph after nodes are rendered
  // useEffect(() => {
  //   if (flowRef.current && elements.nodes.length > 0) {
  //     requestAnimationFrame(() => {
  //       flowRef.current.fitView({ padding: 0.3 });
  //     });
  //   }
  // }, [elements]);
  // Center graph after nodes are rendered
  useEffect(() => {
    if (!flowRef.current || elements.nodes.length === 0) return;

    // Wait for the next paint to ensure nodes are mounted
    const id = requestAnimationFrame(() => {
      flowRef.current.fitView({ padding: 0.3 });
    });

    return () => cancelAnimationFrame(id);
  }, [elements.nodes]); // Only run when nodes change


  const nodeTypes = {
    imageNode: (props) => <ImageNode {...props} isTimerVisible={isTimerVisible} scenarioStatus={scenarioStatus} />,
  };
  const EditableEdgeWrapper = (edgeProps) => {
    const { getEdges, setEdges } = useReactFlow();

    // You can also pull labelMap or other shared state from context/store here
    const edges = getEdges(); // all current edges
    console.log("fffffffffffffffffffffffffff", edges);


    return (
      <EditableEdge
        {...edgeProps}
        allEdges={edges}
        setEdges={setEdges}
      />
    );
  };
  const edgeTypes = { custom: EditableEdgeWrapper };

  return (
    <div
      ref={reactFlowWrapper}
      style={{ width: '100%', height: '80vh', borderRadius: 8 }}
    >
      {elements.nodes.length > 0 && (
        <ReactFlow
          nodes={elements.nodes}
          edges={elements.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          zoomOnDoubleClick={false}
          onInit={(instance) => (flowRef.current = instance)}
        >
          <Background />
        </ReactFlow>
      )}
    </div>
  );
};

ScenarioDiagram.layout = "Contentlayout";
export default ScenarioDiagram;

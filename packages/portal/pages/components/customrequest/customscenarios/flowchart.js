import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  StraightEdge,
  Handle,
  Position,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "./sidebarFlow";
import EditableEdge from "../../../../shared/data/customScenario/EditableEdge"

import {
  saveScenarioFlow,
  clearsaveScenarioFlow,
} from "../../../../shared/redux/slices/customScenarios/customscenarioManage";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import Router, { useRouter } from "next/router";
import {
  clearSingleScenarios,
  getScenarioList,
} from "../../../../shared/redux/slices/customScenarios/customscenarioManage";

const DnDFlow = ({
  numLans,
  toBeDragComponent,
  scenarioId,
  setTabIndex,
  selectedScenario,
}) => {


  const dispatch = useDispatch();

  const reactFlowWrapper = useRef(null);
  const [imageNodeData, setImageNodeData] = useState([]);
  const { push } = useRouter();
  const [initialNodes, setInitialNodes] = useState(() => {
    const nodesArray = [];

    return nodesArray;
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [draggedNode, setDraggedNode] = useState(null);
  const [droppedImages, setDroppedImages] = useState([]);
  const [drggerdComponent, setDraggedComponent] = useState([]);
  const resolveImageUrl = (url) => {
    if (!url) return "";

    const backendBaseUrl =
      process.env.API_URL_FILEMANAGER || window.location.origin + "/jobapi";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("/uploads")) {
      return `${backendBaseUrl}${url}`;
    }
    return `${window.location.origin}${url}`;
  };

  const portPositionMap = {
    net0: Position.Right,
    net1: Position.Bottom,
    net2: Position.Left,
    net3: Position.Top,
  };
  const ImageNode = ({ id, data, isConnectable, deleteNode }) => {
    // const networkPorts = data.networkport || [];
    // const portKeys = networkPorts.flatMap((obj) => Object.keys(obj)).sort();
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
    const sides = ["Right", "Bottom", "Left", "Top"];
    const portsPerSide = Math.ceil(totalPorts / 4);
    const spacingRatio = 100 / (portsPerSide + 1);

    const baseSize = 90;
    const portSpacing = 15;
    const nodeSize = Math.max(baseSize, portsPerSide * portSpacing + 20);

    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: nodeSize,
            height: nodeSize,
            position: "relative",
            borderRadius: "8px",
            border: "2px solid #ccc",
            // background: '#fff',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Delete Button */}
          <button
            onClick={() => deleteNode(id)}
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              color: "black",
              border: "none",
              borderRadius: "50%",
              width: 14,
              height: 14,
              fontSize: 10,
              fontWeight: "bold",
              cursor: "pointer",
              background: "#fff",
              zIndex: 2,
            }}
          >
            ×
          </button>

          {/* Image */}
          <div
            style={{
              width: nodeSize * 0.6,
              height: nodeSize * 0.6,
              backgroundImage: `url("${resolveImageUrl(data.image)}")`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
  {/* Ports */}
          {portKeys.map((port, index) => {
            const sideIndex = Math.floor(index / portsPerSide);
            const side = sides[sideIndex];
            const positionIndex = index % portsPerSide;
            let offsetPercent;
            if (side === "Right" || side === "Top") {
              offsetPercent = (positionIndex + 1) * spacingRatio;
            } else {
              offsetPercent = (portsPerSide - positionIndex) * spacingRatio;
            }

            const baseHandleStyle = {
              position: "absolute",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#005eff",
              border: "1px solid white",
              zIndex: 2,
            };

            const labelStyle = {
              position: "absolute",
              fontSize: 6,
              // background: '#fff',
              padding: "1px 3px",
              whiteSpace: "nowrap",
              zIndex: 5,
            };

            let handleStyle = {};
            let labelPosition = {};

            switch (side) {
              case "Top":
                handleStyle = {
                  ...baseHandleStyle,
                  top: -5,
                  left: `${offsetPercent}%`,
                  transform: "translateX(-50%)",
                };
                labelPosition = {
                  ...labelStyle,
                  top: -20,
                  left: `${offsetPercent}%`,
                  transform: "translateX(-50%)",
                };
                break;
              case "Right":
                handleStyle = {
                  ...baseHandleStyle,
                  right: -5,
                  top: `${offsetPercent}%`,
                  transform: "translateY(-50%)",
                };
                labelPosition = {
                  ...labelStyle,
                  right: -60,
                  top: `${offsetPercent}%`,
                  transform: "translateY(-10%)",
                };
                break;
              case "Bottom":
                handleStyle = {
                  ...baseHandleStyle,
                  bottom: -5,
                  left: `${offsetPercent}%`,
                  transform: "translateX(-50%)",
                };
                labelPosition = {
                  ...labelStyle,
                  bottom: -20,
                  left: `${offsetPercent}%`,
                  transform: "translateX(-50%)",
                };
                break;
              case "Left":
                handleStyle = {
                  ...baseHandleStyle,
                  left: -5,
                  top: `${offsetPercent}%`,
                  transform: "translateY(-50%)",
                };
                labelPosition = {
                  ...labelStyle,
                  left: -60,
                  top: `${offsetPercent}%`,
                  transform: "translateY(-10%)",
                };
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

        {/* Node Label */}
        <div
          style={{
            marginTop: 18,
            fontSize: 10,
            textAlign: "center",
            width: "100%",
            zIndex: 10,
            position: "relative",
            // background: '#fff',
            padding: "0 2px",
          }}
        >
          {data.label || "Unnamed"}
        </div>
      </div>
    );
  };

  const idRef = useRef(0);
  const getId = () => `dndnode_${idRef.current++}`;
  const { saveScenarioFlowChart, getScenarioFlowchart } = useSelector(
    (state) => ({
      saveScenarioFlowChart: state?.customScenario?.saveflowchartData,
      getScenarioFlowchart:
        state &&
        state.customScenario &&
        state.customScenario.singleScenarios &&
        state.customScenario.singleScenarios.data,
    })
  );
  useEffect(() => {
    if (toBeDragComponent && toBeDragComponent.length > 0) {
      let temp = toBeDragComponent.map((cat) => ({
        id: cat?.value,
        imageUrl: cat?.subcategoryimage
          ? `${process.env.API_URL_FILEMANAGER}${cat?.subcategoryimage}`
          : "",
        label: cat?.label,
        networkport: cat?.networkport,
      }));
      setImageNodeData(temp);
    }
  }, [toBeDragComponent]);

  useEffect(() => {
    if (
      selectedScenario &&
      selectedScenario.scenariodiagram &&
      selectedScenario.scenariodiagram != ""
    ) {
      const data = selectedScenario.scenariodiagram;
      const parsedData = JSON.parse(data.replace("flowchartData ", ""));
      if (parsedData?.nodes && parsedData?.edges) {
        setNodes(parsedData.nodes);
        setEdges(parsedData.edges);
      }
    }

    if (selectedScenario && selectedScenario.digramcomponent) {
      const componentsdata = selectedScenario.digramcomponent;

      const parsedcomponentData = JSON.parse(componentsdata);
      setImageNodeData(parsedcomponentData);
      setDroppedImages(parsedcomponentData.map((comp) => comp.id));
      setDraggedComponent(parsedcomponentData);
    }
  }, [selectedScenario]);

  const onConnect = useCallback((params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "custom",
            isAttacked: "No",
            data: {
              label: "",
              source: params.source,
              sourceHandle: params.sourceHandle,
              target: params.target,
              targetHandle: params.targetHandle,
            }, // this is what will be editable
          },
          eds
        )
      );
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      let id = `dndnode_${0 + 1}`;
      if (nodes.length > 0) {
        id = nodes[nodes.length - 1].id;
      } else {
        const numberId = 0;
        id = `dndnode_${numberId}`;
      }

      let number = parseInt(id.split("_")[1], 10);
      setDraggedComponent((prev) => [...prev, draggedNode]);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: `dndnode_${number + 1}`,
        type: "imageNode",
        position,
        data: {
          image: draggedNode.imageUrl,
          label: draggedNode.label,
          componentId: draggedNode.componentid,
          networkport: draggedNode.networkport,
          duration: draggedNode.duration,
        },
      };
      setNodes((nds) => nds.concat(newNode));
      setDroppedImages((prev) => [...prev, draggedNode.id]); 
    },
    [screenToFlowPosition, draggedNode, droppedImages]
  );
const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );

    const nodeToDelete = nodes.find((node) => node.id === nodeId);
    if (nodeToDelete && nodeToDelete.data && nodeToDelete.data.componentId) {
      const imageUrl = nodeToDelete.data.image;
      const imageComponent = nodeToDelete.data.componentId;
    
      const imageNode = imageNodeData.find(
        (item) => item.id === imageComponent
      );
 if (imageNode) {
        const imageId = imageNode.id;
        setDroppedImages((prev) => prev.filter((id) => id !== imageId)); // Re-enable image by removing it from droppedImages
        setDraggedComponent((prev) =>
          prev.filter((item) => item.id !== imageId)
        );
        setImageNodeData((prev) => prev.filter((item) => item.id !== imageId));
      }
    }
  };
  function generateComponentConfig(nodes, edges) {
    const config = [];
    const networkIdSet = new Set();

    nodes.forEach((node, index) => {
      const { id: nodeId, data } = node;
      const network_ids = {};
      edges.forEach((edge) => {
        const label = edge.data?.label;
        if (edge.source === nodeId && edge.sourceHandle) {
          const port = edge.sourceHandle.split("-")[0];
          network_ids[port] = label;
          networkIdSet.add(label);
        }

        if (edge.target === nodeId && edge.targetHandle) {
          const port = edge.targetHandle.split("-")[0];
          network_ids[port] = label;
          networkIdSet.add(label);
        }
      });

      config.push({
        order: index + 1,
        componentid: data.componentId,
        vmid: data.label.split(" - ")[0],
        componentname: data.label.split(" - ")[1],
        duration: data.duration,
        imageurl: data.image,
        nodeid: nodeId,
        network_ids,
      });
    });

    // Convert to array
    const network_config = [...networkIdSet];
    return {
      component_config: config,
      network_config,
    };
  }
  const saveFlowchart = async (status) => {
    const flowchartData = { nodes, edges };
    let componentsData = [];
    const configData = generateComponentConfig(
      flowchartData.nodes,
      flowchartData.edges
    );
    if (nodes && nodes.length > 0) {
      const mapped = nodes
        .filter((node) => node.data && node.data.componentId)
        .map((node) => {
          const data = node.data;
          return {
            id: data.componentId,
            imageUrl: data.image || "",
            componentid: data.componentId,
            duration: data.duration,
            label: data.label || "",
            networkport: data.networkport || [],
          };
        });

      // Deduplicate by `id` using Map
      const uniqueByIdMap = new Map();
      mapped.forEach((component) => {
        if (!uniqueByIdMap.has(component.id)) {
          uniqueByIdMap.set(component.id, component);
        }
      });

      componentsData = Array.from(uniqueByIdMap.values());
    }
    const payload = {
      scenariodiagram: flowchartData,
      scenarioid: scenarioId,
      numberoflan: numLans.toString(),
      components: componentsData,
      scenariostatus: status,
      component_config: configData.component_config,
      network_config: configData.network_config,
    };
    dispatch(saveScenarioFlow(payload));
  };

  useEffect(() => {
    if (saveScenarioFlowChart && saveScenarioFlowChart.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveScenarioFlowChart?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearsaveScenarioFlow());
      dispatch(clearSingleScenarios());
      dispatch(getScenarioList());
      setNodes([]);
      setEdges([]);
      setTabIndex("tab3");
    }
  }, [saveScenarioFlowChart]);

  const nodeTypes = useMemo(
    () => ({
      imageNode: (props) => <ImageNode {...props} deleteNode={deleteNode} />,
    }),
    [deleteNode]
  );

  const handleKeyDown = (event) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      const selectedNode = nodes.find((node) => node.selected);

      if (selectedNode) {
        deleteNode(selectedNode.id);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nodes]);

  const defaultEdgeOptions = {
    type: "straight",
    style: { stroke: "#000", strokeWidth: 2 },
  };
  const { t } = useTranslation();
  const EditableEdgeWrapper = (edgeProps) => {
    const { getEdges, setEdges } = useReactFlow();
    const edges = getEdges(); // all current edges

    return (
      <EditableEdge
        {...edgeProps}
        allNodes={nodes}
        allEdges={edges}
        setEdges={setEdges}
      />
    );
  };
  const edgeTypes = {
    custom: EditableEdgeWrapper,
  };

  return (
    <>
      <div
        className="dndflow  mb-2"
        style={{ display: "flex", height: "80vh", gap: "20px" }}
      >
        <div style={{ width: "28%", height: "100%" }}>
          <SideBar
            imageNodeData={imageNodeData}
            setDraggedNode={setDraggedNode} 
            scenarioId={scenarioId}
            setNodes={setNodes}
            setEdges={setEdges}
            setDraggedComponent={setDraggedComponent}
          />
        </div>
        <div
          className="reactflow-wrapper"
          ref={reactFlowWrapper}
          style={{
            width: "72%",
            height: "100%",
            borderRadius: "8px",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType="floating" 
            connectionLineStyle={{ stroke: "#000", strokeWidth: 2 }}
            zoomOnDoubleClick={false} 
            edgeTypes={edgeTypes}
          >
            {/* <Controls /> */}
            <Background />
          </ReactFlow>
        </div>
      </div>
      <div className="justify-content-end d-flex">
        <div class="pull-left">
          <small class="text-warning d-block mt-2">
            Note: After saving the diagram, ensure the components order is
            reinitialized or reset to maintain consistency.
          </small>
        </div>
        <Button className={"mx-2"} onClick={() => saveFlowchart("Draft")}>
          {t("Save & Next ")}
        </Button>
      </div>
    </>
  );
};
export default ({
  numLans,
  scenarioId,
  setScenarioId,
  setTabIndex,
  setView,
  setRowValues,
  selectedScenario,
}) => (
  <>
    <ReactFlowProvider>
      <DnDFlow
        numLans={numLans}
        scenarioId={scenarioId}
        setScenarioId={setScenarioId}
        setTabIndex={setTabIndex}
        setView={setView}
        setRowValues={setRowValues}
        selectedScenario={selectedScenario}
      />
    </ReactFlowProvider>
  </>
);

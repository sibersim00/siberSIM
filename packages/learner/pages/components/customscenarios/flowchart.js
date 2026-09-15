import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Handle,
  Position,
  useReactFlow,
  ConnectionLineType,
  useUpdateNodeInternals,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "./sidebarFlow";
import EditableEdge from "../../../shared/data/customScenario/EditableEdge";
import ScenarioDiagramNode from "../../../shared/data/scenarios/ScenarioDiagramNode";

import {
  saveScenarioFlow,
  clearsaveScenarioFlow,
} from "../../../shared/redux/slices/customScenarios/customscenarioManage";
import "../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import {
  clearSingleScenarios,
  getScenarioList,
} from "../../../shared/redux/slices/customScenarios/customscenarioManage";

const COMPONENT_ANIMATION_OPTIONS = [
  { value: "circle", name: "Circular orbit", description: "Moves continuously around its saved position in a smooth circle.", icon: "↻" },
  { value: "spiral", name: "Spiral movement", description: "Moves outward in a recognisable diamond pattern, then returns and repeats.", icon: "◉" },
  { value: "leftToRight", name: "Left to right", description: "Enters from the left, pauses in the middle, and exits right.", icon: "→" },
  { value: "rightToLeft", name: "Right to left", description: "Enters from the right, pauses in the middle, and exits left.", icon: "←" },
  { value: "diagonalTopLeft", name: "Top-left to bottom-right", description: "Crosses diagonally, pausing at the canvas centre.", icon: "↘" },
  { value: "diagonalTopRight", name: "Top-right to bottom-left", description: "Crosses along the opposite diagonal with a centre pause.", icon: "↙" },
  { value: "diagonalBottomLeft", name: "Bottom-left to top-right", description: "Enters from the bottom-left, pauses at centre, and exits top-right.", icon: "↗" },
  { value: "diagonalBottomRight", name: "Bottom-right to top-left", description: "Enters from the bottom-right, pauses at centre, and exits top-left.", icon: "↖" },
];

const DEFAULT_COMPONENT_ANIMATION = { type: "circle", pauseSeconds: 2 };

const getFlowComponentDetails = (data = {}) => {
  const label = String(data.label || "Unnamed component").trim();
  const separatorIndex = label.indexOf("-");
  return {
    title: separatorIndex > -1 ? label.slice(separatorIndex + 1).trim() : label,
    vmId: data.vmid || (separatorIndex > -1 ? label.slice(0, separatorIndex).trim() : ""),
  };
};

const PORT_SIDES = ["Top", "Right", "Bottom", "Left"];
const PORT_PLACEMENT_OPTIONS = ["Auto", ...PORT_SIDES];
const DEFAULT_PORT_SIDE_ORDER = ["Right", "Bottom", "Left", "Top"];

const getNetworkPorts = (networkport) => {
  const entries = Array.isArray(networkport)
    ? networkport.flatMap((port) => Object.entries(port || {}))
    : networkport && typeof networkport === "object"
      ? Object.entries(networkport)
      : [];

  return entries
    .map(([key, value]) => {
      const tagMatch = String(value).match(/tag=(\d+)/);
      return { key, label: tagMatch ? `${key} : VLAN-${tagMatch[1]}` : key };
    })
    .sort((first, second) => first.key.localeCompare(second.key));
};

const getPortLayouts = (ports, savedPositions = {}, autoPositions = {}) => {
  const portsPerSide = Math.max(1, Math.ceil(ports.length / 4));
  const assignments = ports.map((port, index) => ({
    ...port,
    side: PORT_SIDES.includes(savedPositions?.[port.key])
      ? savedPositions[port.key]
      : PORT_SIDES.includes(autoPositions?.[port.key])
        ? autoPositions[port.key]
        : DEFAULT_PORT_SIDE_ORDER[
            Math.min(3, Math.floor(index / portsPerSide))
          ],
  }));
  const totals = assignments.reduce((result, port) => {
    result[port.side] = (result[port.side] || 0) + 1;
    return result;
  }, {});
  const used = {};

  return assignments.map((port) => {
    const index = used[port.side] || 0;
    used[port.side] = index + 1;
    return {
      ...port,
      offsetPercent: ((index + 1) * 100) / ((totals[port.side] || 0) + 1),
    };
  });
};

const getPortKeyFromHandle = (handleId = "") =>
  String(handleId).replace(/-(source|target)$/, "");

const getClosestPortSide = (
  deltaX,
  deltaY,
  halfWidth = 50,
  halfHeight = 60,
) => {
  const distances = {
    Top: Math.hypot(deltaX, deltaY + halfHeight),
    Right: Math.hypot(deltaX - halfWidth, deltaY),
    Bottom: Math.hypot(deltaX, deltaY - halfHeight),
    Left: Math.hypot(deltaX + halfWidth, deltaY),
  };

  return PORT_SIDES.reduce((closest, side) =>
    distances[side] < distances[closest] ? side : closest,
  );
};

const PortPlacementModal = ({ show, node, draft, onChange, onClose, onApply }) => {
  const ports = getNetworkPorts(node?.data?.networkport);

  return (
    <Modal show={show} onHide={onClose} centered size="sm" dialogClassName="port-placement-modal">
      <Modal.Header closeButton>
        <div>
          <Modal.Title>Port location</Modal.Title>
          <div className="port-placement-modal-subtitle">
            Auto follows the nearest side as connected components move.
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        {ports.length ? (
          <div className="port-placement-list">
            {ports.map((port) => (
              <div className="port-placement-row" key={port.key}>
                <strong title={port.label}>{port.label}</strong>
                <div className="port-placement-sides" role="radiogroup" aria-label={`${port.label} location`}>
                  {PORT_PLACEMENT_OPTIONS.map((side) => (
                    <button
                      key={side}
                      type="button"
                      className={draft?.[port.key] === side ? "is-selected" : ""}
                      onClick={() => onChange({ ...draft, [port.key]: side })}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="port-placement-empty">This component has no network ports.</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={onApply} disabled={!ports.length}>Apply locations</Button>
      </Modal.Footer>
    </Modal>
  );
};

const ComponentAnimationModal = ({ show, node, draft, imageUrl, onChange, onClose, onApply, onClear }) => {
  const [previewKey, setPreviewKey] = useState(0);
  const selectedOption = COMPONENT_ANIMATION_OPTIONS.find((option) => option.value === draft.type);
  const usesPause = [
    "leftToRight", "rightToLeft", "diagonalTopLeft", "diagonalTopRight",
    "diagonalBottomLeft", "diagonalBottomRight",
  ].includes(draft.type);
  const { title, vmId } = getFlowComponentDetails(node?.data);

  return (
    <Modal show={show} onHide={onClose} centered size="lg" dialogClassName="component-animation-modal">
      <Modal.Header closeButton>
        <div>
          <Modal.Title>Component animation</Modal.Title>
          <div className="component-animation-modal-subtitle">{title || "Select a movement"}</div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="component-animation-layout">
          <div className="component-animation-options" role="radiogroup">
            {COMPONENT_ANIMATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={draft.type === option.value}
                className={`component-animation-option ${draft.type === option.value ? "is-selected" : ""}`}
                onClick={() => {
                  onChange({ ...draft, type: option.value });
                  setPreviewKey((value) => value + 1);
                }}
              >
                <span className="component-animation-option-icon">{option.icon}</span>
                <span><strong>{option.name}</strong><small>{option.description}</small></span>
                <span className="component-animation-radio" />
              </button>
            ))}
          </div>
          <div className="component-animation-preview-panel">
            <div className="component-animation-preview-heading">
              <span>Live preview</span>
              <span className="component-animation-preview-status">{selectedOption?.name}</span>
            </div>
            <div className="component-animation-stage">
              <div key={`${draft.type}-${previewKey}`} className={`component-animation-demo component-animation-demo--${draft.type}`}>
                <div className="component-animation-demo-image" style={{ backgroundImage: `url("${imageUrl || ""}")` }} />
                <strong>{title}</strong>
                {vmId && <small>VM ID: {vmId}</small>}
              </div>
              <span className="component-animation-stage-centre">Centre pause</span>
            </div>
            {usesPause && (
              <Form.Group className="component-animation-pause-field">
                <Form.Label>Pause at centre</Form.Label>
                <div className="component-animation-pause-control">
                  <Form.Control
                    type="number"
                    min={1}
                    max={10}
                    value={draft.pauseSeconds}
                    onChange={(event) => onChange({
                      ...draft,
                      pauseSeconds: Math.min(10, Math.max(1, Number(event.target.value) || 1)),
                    })}
                  />
                  <span>seconds</span>
                </div>
              </Form.Group>
            )}
            <Button type="button" variant="outline-info" className="component-animation-watch-button" onClick={() => setPreviewKey((value) => value + 1)}>
              Watch demo again
            </Button>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {node?.data?.componentAnimation?.type && <Button variant="outline-danger" onClick={onClear}>Remove animation</Button>}
        <div className="ms-auto d-flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onApply}>Apply animation</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

const DnDFlow = ({
  numLans,
  toBeDragComponent,
  scenarioId,
  setView,
  selectedScenario,
}) => {


  const dispatch = useDispatch();

  const reactFlowWrapper = useRef(null);
  const [imageNodeData, setImageNodeData] = useState([]); // sidebar data
  const [initialNodes, setInitialNodes] = useState(() => {
    const nodesArray = [];

    return nodesArray;
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [edgeRouting, setEdgeRouting] = useState("bezier");
  const { screenToFlowPosition } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [draggedNode, setDraggedNode] = useState(null);
  const [droppedImages, setDroppedImages] = useState([]); // Track dropped images
  const [drggerdComponent, setDraggedComponent] = useState([]);
  const resolveImageUrl = (url) => {
    if (!url) return "";

    const backendBaseUrl =
      process.env.API_URL_FILEMANAGER || window.location.origin + "/jobapi";

    // If URL is already absolute, use it directly
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // If URL starts with /uploads, prefix with backendBaseUrl
    if (url.startsWith("/uploads")) {
      return `${backendBaseUrl}${url}`;
    }

    // Otherwise, treat it as static/public path
    return `${window.location.origin}${url}`;
  };

  const [animationNodeId, setAnimationNodeId] = useState(null);
  const [animationDraft, setAnimationDraft] = useState(DEFAULT_COMPONENT_ANIMATION);
  const [portNodeId, setPortNodeId] = useState(null);
  const [portDraft, setPortDraft] = useState({});

  const openAnimationModal = useCallback((nodeId, nodeData) => {
    setAnimationNodeId(nodeId);
    setAnimationDraft({
      ...DEFAULT_COMPONENT_ANIMATION,
      ...(nodeData?.componentAnimation || {}),
    });
  }, []);

  const openPortModal = useCallback((nodeId, nodeData) => {
    const ports = getNetworkPorts(nodeData?.networkport);
    const positions = Object.fromEntries(
      ports.map((port) => [
        port.key,
        PORT_SIDES.includes(nodeData?.portPositions?.[port.key])
          ? nodeData.portPositions[port.key]
          : "Auto",
      ]),
    );
    setPortNodeId(nodeId);
    setPortDraft(positions);
  }, []);

  //   const portKeys = Array.from({ length: 64 }, (_, i) => `net${i}`); // Or based on data
  const ImageNode = ({ id, data, isConnectable, deleteNode }) => {
    const portKeys = getPortLayouts(
      getNetworkPorts(data.networkport),
      data.portPositions,
      data.autoPortPositions,
    );
    const totalPorts = portKeys.length;

    const portsPerSide = Math.max(1, Math.ceil(totalPorts / 4));

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
          {portKeys.map((port) => {
            const side = port.side;
            const offsetPercent = port.offsetPercent;

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
        state.scenarioManage &&
        state.scenarioManage.singleScenarios &&
        state.scenarioManage.singleScenarios.data,
    })
  );

  useEffect(() => {
    if (toBeDragComponent && toBeDragComponent.length > 0) {
      let temp = toBeDragComponent.map((cat) => ({
        id: cat?.value,
        //imageUrl: 'http://localhost:4001/_next/static/media/Firewall.7fb2a1cd.png',
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
        const routing = parsedData.edgeRouting === "smooth" ? "smooth" : "bezier";
        setEdgeRouting(routing);
        setEdges(parsedData.edges.map((edge) => ({
          ...edge,
          type: "custom",
          data: { ...edge.data, edgeRouting: routing },
        })));
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

  useEffect(() => {
    if (!nodes.length) return;

    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const vectorsByNode = new Map(nodes.map((node) => [node.id, {}]));
    const getNodeCenter = (node) => {
      const position = node.positionAbsolute || node.position || { x: 0, y: 0 };
      return {
        x: position.x + (node.measured?.width || node.width || 100) / 2,
        y: position.y + (node.measured?.height || node.height || 120) / 2,
      };
    };
    const addVector = (nodeId, portKey, deltaX, deltaY) => {
      if (!nodeId || !portKey || !vectorsByNode.has(nodeId)) return;
      const nodeVectors = vectorsByNode.get(nodeId);
      nodeVectors[portKey] = nodeVectors[portKey] || [];
      nodeVectors[portKey].push({ deltaX, deltaY });
    };

    edges.forEach((edge) => {
      const sourceNode = nodesById.get(edge.source);
      const targetNode = nodesById.get(edge.target);
      if (!sourceNode || !targetNode) return;

      const sourceCenter = getNodeCenter(sourceNode);
      const targetCenter = getNodeCenter(targetNode);
      const deltaX = targetCenter.x - sourceCenter.x;
      const deltaY = targetCenter.y - sourceCenter.y;

      addVector(
        edge.source,
        getPortKeyFromHandle(edge.sourceHandle),
        deltaX,
        deltaY,
      );
      addVector(
        edge.target,
        getPortKeyFromHandle(edge.targetHandle),
        -deltaX,
        -deltaY,
      );
    });

    const nextPositionsByNode = new Map();
    vectorsByNode.forEach((portVectors, nodeId) => {
      const positions = {};
      Object.entries(portVectors).forEach(([portKey, vectors]) => {
        const totals = vectors.reduce(
          (result, vector) => ({
            deltaX: result.deltaX + vector.deltaX,
            deltaY: result.deltaY + vector.deltaY,
          }),
          { deltaX: 0, deltaY: 0 },
        );
        const node = nodesById.get(nodeId);
        const halfWidth = (node?.measured?.width || node?.width || 100) / 2;
        const halfHeight = (node?.measured?.height || node?.height || 120) / 2;

        positions[portKey] = getClosestPortSide(
          totals.deltaX / vectors.length,
          totals.deltaY / vectors.length,
          halfWidth,
          halfHeight,
        );
      });
      nextPositionsByNode.set(nodeId, positions);
    });

    const changedNodeIds = nodes
      .filter(
        (node) =>
          JSON.stringify(node.data?.autoPortPositions || {}) !==
          JSON.stringify(nextPositionsByNode.get(node.id) || {}),
      )
      .map((node) => node.id);

    if (!changedNodeIds.length) return;

    const changedNodeIdSet = new Set(changedNodeIds);
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        changedNodeIdSet.has(node.id)
          ? {
              ...node,
              data: {
                ...node.data,
                autoPortPositions: nextPositionsByNode.get(node.id) || {},
              },
            }
          : node,
      ),
    );

    requestAnimationFrame(() => {
      changedNodeIds.forEach((nodeId) => updateNodeInternals(nodeId));
    });
  }, [nodes, edges, setNodes, updateNodeInternals]);

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
              edgeRouting,
            }, // this is what will be editable
          },
          eds
        )
      );
  }, [edgeRouting]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      let id = `dndnode_${0 + 1}`;
      //  if (!draggedNode || droppedImages.includes(draggedNode.id)) return; // Prevent drop if already dropped
      if (nodes.length > 0) {
        id = nodes[nodes.length - 1].id;
      } else {
        const numberId = 0;
        id = `dndnode_${numberId}`;
      }

      let number = parseInt(id.split("_")[1], 10); //
      setDraggedComponent((prev) => [...prev, draggedNode]);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        // id: getId(),
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
        // style: { width: 50, height: 50 },
      };
      setNodes((nds) => nds.concat(newNode));
      setDroppedImages((prev) => [...prev, draggedNode.id]); // Add to dropped images
    },
    [screenToFlowPosition, draggedNode, droppedImages]
  );

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    // Find the image used in the node and remove it from the droppedImages array
    const nodeToDelete = nodes.find((node) => node.id === nodeId);

    if (nodeToDelete && nodeToDelete.data && nodeToDelete.data.componentId) {
      const imageUrl = nodeToDelete.data.image;
      const imageComponent = nodeToDelete.data.componentId;

      // Find the id associated with the image URL
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
    const flowchartData = { nodes, edges, edgeRouting };
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
            componentid: data.componentId,
            duration: data.duration,
            imageUrl: data.image || "",
            label: data.label || "",
            networkport: data.networkport || [],
          };
        });

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
      scenariostatus: status === "SaveAsDraft" ? "Draft" : status,
      component_config: configData.component_config,
      network_config: configData.network_config,
      approval_status: status === "SaveAsDraft" ? "Draft" : "Pending", // ✅ add this
    };

    await dispatch(saveScenarioFlow(payload));
    setView("list");
    dispatch(getScenarioList());
  };

  useEffect(() => {
    if (saveScenarioFlowChart.statusCode === 200) {
  
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
    
    }
  }, [saveScenarioFlowChart]);

  const animationNode = nodes.find((node) => node.id === animationNodeId);
  const closeAnimationModal = () => setAnimationNodeId(null);
  const applyComponentAnimation = () => {
    if (!animationNodeId) return;
    setNodes((currentNodes) => currentNodes.map((node) =>
      node.id === animationNodeId
        ? {
            ...node,
            data: {
              ...node.data,
              componentAnimation: {
                type: animationDraft.type,
                pauseSeconds: Number(animationDraft.pauseSeconds) || 2,
              },
            },
          }
        : node,
    ));
    closeAnimationModal();
  };
  const clearComponentAnimation = () => {
    if (!animationNodeId) return;
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (node.id !== animationNodeId) return node;
      const dataWithoutAnimation = { ...node.data };
      delete dataWithoutAnimation.componentAnimation;
      return { ...node, data: dataWithoutAnimation };
    }));
    closeAnimationModal();
  };

  const portNode = nodes.find((node) => node.id === portNodeId);
  const closePortModal = () => setPortNodeId(null);
  const applyPortPositions = () => {
    if (!portNodeId) return;
    setNodes((currentNodes) => currentNodes.map((node) =>
      node.id === portNodeId
        ? { ...node, data: { ...node.data, portPositions: portDraft } }
        : node,
    ));
    requestAnimationFrame(() => updateNodeInternals(portNodeId));
    closePortModal();
  };

  const nodeTypes = useMemo(
    () => ({
      imageNode: (props) => {
        const animationOption = COMPONENT_ANIMATION_OPTIONS.find(
          (option) => option.value === props.data?.componentAnimation?.type,
        );
        return (
          <ScenarioDiagramNode
            {...props}
            deleteNode={deleteNode}
            interactive={false}
            onConfigurePorts={openPortModal}
            onConfigureAnimation={openAnimationModal}
            animationLabel={animationOption?.name}
            animationIcon={animationOption?.icon}
          />
        );
      },
    }),
    [deleteNode, openAnimationModal, openPortModal]
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
    type: "custom",
  };
  const { t } = useTranslation();
  const EditableEdgeWrapper = (edgeProps) => {
    const { getEdges, setEdges } = useReactFlow();

    // You can also pull labelMap or other shared state from context/store here
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
            setDraggedNode={setDraggedNode} // Passing setDraggedNode to Sidebar
            //  droppedImages={droppedImages} // Pass dropped images to Sidebar
            scenarioId={scenarioId}
            setNodes={setNodes}
            setEdges={setEdges}
            setEdgeRouting={setEdgeRouting}
            setDraggedComponent={setDraggedComponent}
          />
        </div>
        <div
          className="reactflow-wrapper scenario-diagram-shell"
          ref={reactFlowWrapper}
          style={{
            width: "72%",
            height: "100%",
            borderRadius: "8px",
          }}
        >
          <label className="edge-routing-control">
            <span>Link style</span>
            <Form.Select
              size="sm"
              value={edgeRouting}
              onChange={(event) => {
                const routing = event.target.value;
                setEdgeRouting(routing);
                setEdges((currentEdges) => currentEdges.map((edge) => ({
                  ...edge,
                  type: "custom",
                  data: { ...edge.data, edgeRouting: routing },
                })));
              }}
            >
              <option value="bezier">Bezier (default)</option>
              <option value="smooth">Smooth Step</option>
            </Form.Select>
          </label>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            // style={{ backgroundColor: '#F7F9FB' }}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={edgeRouting === "smooth" ? ConnectionLineType.SmoothStep : ConnectionLineType.Bezier}
            connectionLineStyle={{ stroke: "var(--diagram-edge-default)", strokeWidth: 1.6 }}
            zoomOnDoubleClick={false} // disables zoom on double-click
            edgeTypes={edgeTypes}
          >
            {/* <Controls /> */}
            <Background color="var(--diagram-grid)" gap={20} size={1.15} />
          </ReactFlow>
        </div>
      </div>
      <div className="justify-content-end d-flex">
        <div className="pull-left">
          <small className="text-warning d-block mt-2">
            Note: After saving the diagram, ensure the components order is
            reinitialized or reset to maintain consistency.
          </small>
        </div>
        <Button className={"mx-2"} onClick={() => saveFlowchart("Draft")}>
          {t("Submit ")}
        </Button>
        <Button className="mx-2" onClick={() => saveFlowchart("SaveAsDraft")}>
          {t("Save as Draft")}
        </Button>
      </div>
      <ComponentAnimationModal
        show={Boolean(animationNodeId)}
        node={animationNode}
        draft={animationDraft}
        imageUrl={resolveImageUrl(animationNode?.data?.image)}
        onChange={setAnimationDraft}
        onClose={closeAnimationModal}
        onApply={applyComponentAnimation}
        onClear={clearComponentAnimation}
      />
      <PortPlacementModal
        show={Boolean(portNode)}
        node={portNode}
        draft={portDraft}
        onChange={setPortDraft}
        onClose={closePortModal}
        onApply={applyPortPositions}
      />
    </>
  );
};
const Flowchart = ({
  numLans,
  scenarioId,
  setScenarioId,
  setTabIndex,
  setView,
  setRowValues,
  selectedScenario,
}) => (
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
);

//Give it a display name for better debugging and to silence ESLint
Flowchart.displayName = "Flowchart";

export default Flowchart;


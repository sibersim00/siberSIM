import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import EditableEdge from "../../../../shared/data/scenarios/EditableEdge";
import { useDispatch, useSelector } from "react-redux";
import { changeEditStatus } from "../../../../shared/redux/slices/scenarios/scenarios";

const getIconMotion = (value = "") => {
  const hash = String(value)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  const durations = [7.5, 9, 10.5];

  return {
    direction: hash % 2 === 0 ? "normal" : "reverse",
    duration: durations[hash % durations.length],
    delay: -((hash % 10) / 10) * durations[hash % durations.length],
    patrolDuration: [5.8, 6.8, 7.8][hash % 3],
  };
};

const separateOverlappingNodes = (nodes) => {
  const separatedNodes = nodes.map((node) => ({
    ...node,
    position: { ...node.position },
  }));
  const minimumXDistance = 196;
  const minimumYDistance = 206;

  for (let pass = 0; pass < 12; pass += 1) {
    let moved = false;
    for (let first = 0; first < separatedNodes.length; first += 1) {
      for (let second = first + 1; second < separatedNodes.length; second += 1) {
        const firstNode = separatedNodes[first];
        const secondNode = separatedNodes[second];
        const deltaX = secondNode.position.x - firstNode.position.x;
        const deltaY = secondNode.position.y - firstNode.position.y;
        const overlapX = minimumXDistance - Math.abs(deltaX);
        const overlapY = minimumYDistance - Math.abs(deltaY);

        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        if (overlapX < overlapY) {
          const direction = deltaX === 0 ? (second % 2 === 0 ? 1 : -1) : Math.sign(deltaX);
          const shift = overlapX / 2 + 1;
          firstNode.position.x -= direction * shift;
          secondNode.position.x += direction * shift;
        } else {
          const direction = deltaY === 0 ? (second % 2 === 0 ? 1 : -1) : Math.sign(deltaY);
          const shift = overlapY / 2 + 1;
          firstNode.position.y -= direction * shift;
          secondNode.position.y += direction * shift;
        }
      }
    }
    if (!moved) break;
  }

  return separatedNodes;
};


const COMPONENT_ANIMATION_TYPES = new Set([
  "circle",
  "spiral",
  "leftToRight",
  "rightToLeft",
  "diagonalTopLeft",
  "diagonalTopRight",
  "diagonalBottomLeft",
  "diagonalBottomRight",
]);

const getConfiguredAnimationOffset = (
  elapsedTime,
  animation,
  canvasWidth = 900,
  canvasHeight = 600,
) => {
  const type = animation?.type;
  if (!COMPONENT_ANIMATION_TYPES.has(type)) return null;

  if (type === "circle") {
    const progress = (elapsedTime % 8000) / 8000;
    const angle = progress * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * 58, y: Math.sin(angle) * 58 };
  }

  if (type === "spiral") {
    const diamondSpiralPoints = [
      { x: 0, y: 0 },
      { x: 0, y: -24 },
      { x: 32, y: 0 },
      { x: 0, y: 44 },
      { x: -56, y: 0 },
      { x: 0, y: -68 },
      { x: 82, y: 0 },
      { x: 0, y: 76 },
      { x: -82, y: 0 },
      { x: 0, y: 0 },
    ];
    const progress = (elapsedTime % 9000) / 9000;
    const pathProgress = progress * (diamondSpiralPoints.length - 1);
    const segmentIndex = Math.min(
      diamondSpiralPoints.length - 2,
      Math.floor(pathProgress),
    );
    const segmentProgress = pathProgress - segmentIndex;
    const start = diamondSpiralPoints[segmentIndex];
    const end = diamondSpiralPoints[segmentIndex + 1];

    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress,
    };
  }

  const pauseMilliseconds =
    Math.min(10, Math.max(1, Number(animation.pauseSeconds) || 2)) * 1000;
  const travelMilliseconds = 3000;
  const cycleDuration = travelMilliseconds * 2 + pauseMilliseconds;
  const cycleTime = elapsedTime % cycleDuration;
  const horizontalTravel = Math.max(420, canvasWidth * 0.72);
  const verticalTravel = Math.max(280, canvasHeight * 0.64);
  let distanceProgress;

  if (cycleTime < travelMilliseconds) {
    distanceProgress = -1 + cycleTime / travelMilliseconds;
  } else if (cycleTime < travelMilliseconds + pauseMilliseconds) {
    distanceProgress = 0;
  } else {
    distanceProgress =
      (cycleTime - travelMilliseconds - pauseMilliseconds) /
      travelMilliseconds;
  }

  if (type === "leftToRight") {
    return { x: distanceProgress * horizontalTravel, y: 0 };
  }
  if (type === "rightToLeft") {
    return { x: -distanceProgress * horizontalTravel, y: 0 };
  }
  if (type === "diagonalTopLeft") {
    return {
      x: distanceProgress * horizontalTravel,
      y: distanceProgress * verticalTravel,
    };
  }
  if (type === "diagonalBottomLeft") {
    return {
      x: distanceProgress * horizontalTravel,
      y: -distanceProgress * verticalTravel,
    };
  }
  if (type === "diagonalBottomRight") {
    return {
      x: -distanceProgress * horizontalTravel,
      y: -distanceProgress * verticalTravel,
    };
  }
  return {
    x: -distanceProgress * horizontalTravel,
    y: distanceProgress * verticalTravel,
  };
};
const getCardPatrolOffset = (time, motion) => {
  const points = [
    { x: 0, y: -10 },
    { x: 10, y: 0 },
    { x: 0, y: 10 },
    { x: -10, y: 0 },
    { x: 0, y: -10 },
  ];
  const duration = motion.patrolDuration * 1000;
  const progress = ((time + Math.abs(motion.delay) * 1000) / duration) % 1;
  const pathProgress = progress * 4;
  const segment = Math.floor(pathProgress);
  const amount = pathProgress - segment;
  const start = points[segment];
  const end = points[segment + 1];

  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
  };
};
const getComponentDetails = (data) => {
  const label = String(data?.label || "Unnamed component").trim();
  const separatorIndex = label.indexOf("-");
  const labelVmId = separatorIndex > -1 ? label.slice(0, separatorIndex).trim() : "";
  const title = separatorIndex > -1 ? label.slice(separatorIndex + 1).trim() : label;

  return { title: title || label, vmId: data?.vmid || labelVmId };
};
const PORT_SIDES = ["Top", "Right", "Bottom", "Left"];
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
      : DEFAULT_PORT_SIDE_ORDER[Math.min(3, Math.floor(index / portsPerSide))],
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
const resolveImageUrl = (url) => {
  if (!url) return "";
  const isAbsolute = url.startsWith("http://") || url.startsWith("https://");
  return isAbsolute ? url : `${window.location.origin}${url}`;
};
const ImageNode = ({
  id,
  data,
  isConnectable,
  isTimerVisible,
  scenarioStatus,
  ambientMotionEnabled,
}) => {
  const ports = getPortLayouts(
    getNetworkPorts(data.networkport),
    data.portPositions,
    data.autoPortPositions,
  );
  const iconMotion = getIconMotion(data?.componentId || id || data?.label);
  const imageMotion = ambientMotionEnabled
    ? data?.visualMotion || "rotate"
    : null;
  const { title, vmId } = getComponentDetails(data);
  const isOnline = data?.isOnline === "Yes";

  const handleClick = (dataobj) => {
    if (scenarioStatus === "Pause" || !isTimerVisible) return;
    const vmid = dataobj?.vmid;
    const vmType = dataobj?.vmType;
    if (!vmid || !vmType) return;

    const rawLabel = dataobj?.label || "";
    const namePart = rawLabel.split("-")[1]?.trim() || "";
    const cleanName = namePart.replace(/\s+/g, "").toLowerCase();
    window.open(
      `${process.env.BASE_PATH}vnc_view/${vmType}/${vmid}/${cleanName}`,
      "_blank",
    );
  };

  return (
    <div className="scenario-node" onClick={() => handleClick(data)}>
      <div className="scenario-node-glow" aria-hidden="true" />
      <div
        className="scenario-node-card"
        style={{ cursor: scenarioStatus !== "Pause" && isTimerVisible ? "pointer" : "default" }}
      >
        <div
          className={`scenario-node-icon-frame ${
            imageMotion ? `scenario-node-icon-${imageMotion}` : ""
          }`}
          style={{
            animationDuration: imageMotion
              ? `${
                  imageMotion === "rotate"
                    ? iconMotion.duration
                    : iconMotion.patrolDuration
                }s`
              : undefined,
            animationDirection:
              imageMotion === "rotate" ? iconMotion.direction : "normal",
            animationDelay: imageMotion ? `${iconMotion.delay}s` : undefined,
          }}
        >
          <div
            className="scenario-node-icon-image"
            style={{
              backgroundImage: `url("${resolveImageUrl(data.image)}")`,
            }}
          />
        </div>
        <div className="scenario-node-copy">
          <strong title={title}>{title}</strong>
          <small>{vmId ? `VM ID: ${vmId}` : "Virtual component"}</small>
        </div>

        <div className={`scenario-node-status ${isOnline ? "is-online" : "is-offline"}`}>
          <span
            className={isOnline ? "scenario-status-pulse" : undefined}
          />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </div>

        {ports.map((port) => {
          const { side, offsetPercent } = port;
          const offsetStyle = { "--scenario-port-offset": `${offsetPercent}%` };
          return (
            <React.Fragment key={port.key}>
              <Handle
                type="source"
                position={Position[side]}
                id={`${port.key}-source`}
                className={`scenario-node-port scenario-node-port--${side.toLowerCase()}`}
                style={offsetStyle}
                isConnectable={isConnectable}
              />
              <Handle
                type="target"
                position={Position[side]}
                id={`${port.key}-target`}
                className={`scenario-node-port scenario-node-port--${side.toLowerCase()}`}
                style={offsetStyle}
                isConnectable={isConnectable}
              />
              <div
                className={`scenario-node-port-label scenario-node-port-label--${side.toLowerCase()}`}
                style={offsetStyle}
                title={port.label}
              >
                {port.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
const ScenarioDiagram = ({
  scenariodiagram,
  isTimerVisible,
  scenarioStatus,
  scenarioId,
  rowValues,
  manipulationFlag,
  isrunning,
}) => {
  const { getSingleScenariosSucc, errorData } = useSelector((state) => ({
    getSingleScenariosSucc: state?.scenarios?.singleScenarios?.data,
    errorData: state?.scenarios?.error,
  }));
  const dispatch = useDispatch();
  const [elements, setElements] = useState({ nodes: [], edges: [] });
  const [ambientMotionEnabled, setAmbientMotionEnabled] = useState(true);
  const reactFlowWrapper = useRef(null);
  const flowRef = useRef(null);
  const basePositionsRef = useRef(new Map());
  const draggingNodesRef = useRef(new Set());
  const lastCardMotionFrameRef = useRef(0);
  const componentAnimationStartedAtRef = useRef(0);
  const router = useRouter();
  // const { push } = useRouter();

  useEffect(() => {
    if (!scenariodiagram) return;

    try {
      const cleanData = scenariodiagram.replace("flowchartData ", "");
      const parsedData = JSON.parse(cleanData);
      const edgeRouting = parsedData.edgeRouting === "smooth" ? "smooth" : "bezier";
      const backendBaseUrl = process.env.API_URL_FILEMANAGER;
      const visualMotionPattern = ["rotate", "patrol", "rotate", "patrol", "rotate"];
      const cardPatrolPattern = [true, false, false, true, false];
      const updatedNodes = parsedData.nodes.map((node, index) => ({
        ...node,
        position: node.position || { x: 0, y: 0 }, // Ensure position exists
        data: {
          ...node.data,
          visualMotion:
            node.data.visualMotion || visualMotionPattern[index % visualMotionPattern.length],
          cardPatrol: COMPONENT_ANIMATION_TYPES.has(
            node.data?.componentAnimation?.type,
          )
            ? false
            : node.data.cardPatrol ??
              cardPatrolPattern[index % cardPatrolPattern.length],
          image:
            node.data.image && node.data.image.startsWith("/uploads")
              ? `${backendBaseUrl}${node.data.image}`
              : node.data.image,
        },
      }));
      const separatedNodes = separateOverlappingNodes(updatedNodes);
      basePositionsRef.current = new Map(
        separatedNodes.map((node) => [node.id, { ...node.position }]),
      );
      const updatedEdges = (parsedData.edges || []).map((edge) => ({
        ...edge,
        type: "custom",
        data: {
          ...edge.data,
          isAttacked: edge.isAttacked ?? edge.data?.isAttacked ?? "No",
          edgeRouting,
        },
      }));
      componentAnimationStartedAtRef.current = performance.now();
      setElements({ nodes: separatedNodes, edges: updatedEdges });
    } catch (err) {
      console.error("Failed to parse scenariodiagram:", err);
    }
  }, [scenariodiagram]);
  useEffect(() => {
    if (!flowRef.current || elements.nodes.length === 0) return;
    const id = requestAnimationFrame(() => {
      flowRef.current.fitView({ padding: 0.3 });
    });
    return () => cancelAnimationFrame(id);
  }, [elements.nodes.length]); // Only run when the graph first receives nodes

  const onNodesChange = useCallback((changes) => {
    changes.forEach((change) => {
      if (change.type !== "position") return;
      if (change.dragging) draggingNodesRef.current.add(change.id);
      else draggingNodesRef.current.delete(change.id);
      if (change.position) {
        basePositionsRef.current.set(change.id, { ...change.position });
      }
    });

    setElements((current) => ({
      ...current,
      nodes: applyNodeChanges(changes, current.nodes),
    }));
  }, []);

  useEffect(() => {
    if (ambientMotionEnabled) return;
    setElements((current) => ({
      ...current,
      nodes: current.nodes.map((node) => {
        if (
          COMPONENT_ANIMATION_TYPES.has(node.data?.componentAnimation?.type)
        ) {
          return node;
        }
        const basePosition = basePositionsRef.current.get(node.id);
        return basePosition ? { ...node, position: { ...basePosition } } : node;
      }),
    }));
  }, [ambientMotionEnabled]);

  useEffect(() => {
    if (elements.nodes.length === 0 || scenarioStatus === "Pause") return undefined;
    let animationFrameId;

    const animateCards = (time) => {
      if (time - lastCardMotionFrameRef.current >= 32) {
        lastCardMotionFrameRef.current = time;
        const wrapperRect = reactFlowWrapper.current?.getBoundingClientRect();
        const screenToFlowPosition = flowRef.current?.screenToFlowPosition;
        let canvasFlowWidth = reactFlowWrapper.current?.clientWidth || 900;
        let canvasFlowHeight = reactFlowWrapper.current?.clientHeight || 600;
        let canvasCentre = null;

        if (wrapperRect && screenToFlowPosition) {
          const topLeft = screenToFlowPosition({
            x: wrapperRect.left,
            y: wrapperRect.top,
          });
          const bottomRight = screenToFlowPosition({
            x: wrapperRect.right,
            y: wrapperRect.bottom,
          });
          canvasCentre = screenToFlowPosition({
            x: wrapperRect.left + wrapperRect.width / 2,
            y: wrapperRect.top + wrapperRect.height / 2,
          });
          canvasFlowWidth = Math.abs(bottomRight.x - topLeft.x);
          canvasFlowHeight = Math.abs(bottomRight.y - topLeft.y);
        }
        setElements((current) => ({
          ...current,
          nodes: current.nodes.map((node) => {
            if (draggingNodesRef.current.has(node.id)) return node;

            const configuredAnimation = node.data?.componentAnimation;
            const hasConfiguredAnimation = COMPONENT_ANIMATION_TYPES.has(
              configuredAnimation?.type,
            );
            if (
              !hasConfiguredAnimation &&
              (!ambientMotionEnabled || !node.data?.cardPatrol)
            ) {
              return node;
            }

            const basePosition =
              basePositionsRef.current.get(node.id) || node.position;
            const crossesCanvas = [
              "leftToRight",
              "rightToLeft",
              "diagonalTopLeft",
              "diagonalTopRight",
              "diagonalBottomLeft",
              "diagonalBottomRight",
            ].includes(configuredAnimation?.type);
            const animationAnchor =
              crossesCanvas && canvasCentre
                ? { x: canvasCentre.x - 78, y: canvasCentre.y - 85 }
                : basePosition;
            let offset;
            if (hasConfiguredAnimation) {
              const elapsedTime = Math.max(
                0,
                time - componentAnimationStartedAtRef.current,
              );
              offset = getConfiguredAnimationOffset(
                elapsedTime,
                configuredAnimation,
                canvasFlowWidth,
                canvasFlowHeight,
              );
            } else {
              const motion = getIconMotion(
                node.data?.componentId || node.id || node.data?.label,
              );
              offset = getCardPatrolOffset(time, motion);
            }

            if (!offset) return node;
            return {
              ...node,
              position: {
                x: animationAnchor.x + offset.x,
                y: animationAnchor.y + offset.y,
              },
            };
          }),
        }));
      }
      animationFrameId = requestAnimationFrame(animateCards);
    };

    animationFrameId = requestAnimationFrame(animateCards);
    return () => cancelAnimationFrame(animationFrameId);
  }, [elements.nodes.length, scenarioStatus, ambientMotionEnabled]);

  const nodeTypes = useMemo(
    () => ({
      imageNode: (props) => (
        <ImageNode
          {...props}
          isTimerVisible={isTimerVisible}
          scenarioStatus={scenarioStatus}
          ambientMotionEnabled={ambientMotionEnabled}
        />
      ),
    }),
    [isTimerVisible, scenarioStatus, ambientMotionEnabled],
  );
  const edgeTypes = useMemo(() => ({ custom: EditableEdge }), []);
  const canShowEditButton =
    !router.asPath.includes("/invite_scenarios") &&
    String(manipulationFlag).toLowerCase() === "true" &&
    ["start", "resume", "running"].includes(
      String(isrunning || scenarioStatus).toLowerCase(),
    );

  return (
    <div
      ref={reactFlowWrapper}
      className="scenario-diagram-shell"
    >
      <button
        type="button"
        className={`scenario-ambient-motion-toggle ${
          ambientMotionEnabled ? "is-enabled" : ""
        }`}
        aria-pressed={ambientMotionEnabled}
        onClick={() => setAmbientMotionEnabled((enabled) => !enabled)}
        title="Toggle idle component and image motion"
      >
        <span aria-hidden="true" />
        Ambient motion: {ambientMotionEnabled ? "On" : "Off"}
      </button>

      {canShowEditButton && (
        <button
          className="scenario-diagram-edit-button"
      onClick={async () => {
        try {
          const vmrequestid =
            getSingleScenariosSucc?.[0]?.vmrequestid;

          if (!vmrequestid) return;

          // call API
          await dispatch(
            changeEditStatus({ vmrequestid })
          );

          //  only runs if 200
          router.push(`/scenarios_edit/${scenarioId}`);

        } catch (error) {
          //  LOCK CASE (409)
          if (error?.response?.status === 409) {
            toast.error(
              error.response?.data?.message ||
                "You cannot edit this scenario",
              {
                position: toast.POSITION.TOP_RIGHT,
                theme: "colored",
              }
            );
          }
          // stop flow
          return;
        }
      }}
      title="Edit"
      style={{
        position: "absolute",
        zIndex: 20,
        top: 16,
        right: 16,
        backgroundColor: "#292942",
        color: "#4d4c4c",
        border: "none",
        padding: "4px 4px",
        borderRadius: 15,
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      ✏️
    </button>
)}


      {elements.nodes.length > 0 && (
        <ReactFlow
          nodes={elements.nodes}
          edges={elements.edges}
          onNodesChange={onNodesChange}
          nodesDraggable
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          zoomOnDoubleClick={false}
          onInit={(instance) => (flowRef.current = instance)}
        >
          <Background color="var(--diagram-grid)" gap={20} size={1.15} />
        </ReactFlow>
      )}
      <style jsx global>{`
        @keyframes scenario-node-breathe {
          0%, 100% { opacity: 0.55; transform: scale(0.985); }
          50% { opacity: 1; transform: scale(1.015); }
        }
        @keyframes scenario-icon-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scenario-icon-patrol {
          0%, 100% { transform: translate(0, -6px); }
          25% { transform: translate(6px, 0); }
          50% { transform: translate(0, 6px); }
          75% { transform: translate(-6px, 0); }
        }
        @keyframes scenario-status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45, 227, 140, 0.55); }
          50% { box-shadow: 0 0 0 4px rgba(45, 227, 140, 0); }
        }
        .scenario-node-glow { animation: scenario-node-breathe 3.8s ease-in-out infinite; }
        .scenario-node-icon-rotate {
          animation-name: scenario-icon-spin;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .scenario-node-icon-patrol {
          animation-name: scenario-icon-patrol;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .scenario-status-pulse { animation: scenario-status-pulse 1.8s ease-out infinite; }
        .scenario-diagram-shell .react-flow__node { background: transparent; border: 0; }
        .scenario-diagram-shell .react-flow__attribution {
          background: rgba(5, 8, 17, 0.72);
          color: #6e7e98;
        }
        @media (prefers-reduced-motion: reduce) {
          .scenario-node-glow,
          .scenario-node-icon-rotate,
          .scenario-node-icon-patrol,
          .scenario-status-pulse,
          .scenario-network-edge-flow,
          .scenario-network-packet { animation: none !important; }
        }
      `}</style>
    </div>
  );
};
ScenarioDiagram.layout = "Contentlayout";
export default ScenarioDiagram;

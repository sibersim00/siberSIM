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

const NODE_PALETTES = [
  { accent: "#ff3d5a", glow: "rgba(255, 61, 90, 0.34)" },
  { accent: "#ff4fb3", glow: "rgba(255, 79, 179, 0.34)" },
  { accent: "#9b6cff", glow: "rgba(155, 108, 255, 0.34)" },
  { accent: "#22d3ee", glow: "rgba(34, 211, 238, 0.34)" },
  { accent: "#18d9bd", glow: "rgba(24, 217, 189, 0.34)" },
  { accent: "#f8c51c", glow: "rgba(248, 197, 28, 0.34)" },
  { accent: "#7bdc16", glow: "rgba(123, 220, 22, 0.34)" },
  { accent: "#ff8a00", glow: "rgba(255, 138, 0, 0.34)" },
];

const getNodePalette = (value = "") => {
  const hash = String(value)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  return NODE_PALETTES[hash % NODE_PALETTES.length];
};


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
  const minimumXDistance = 276;
  const minimumYDistance = 124;

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
  "diagonalTopLeft",
  "diagonalTopRight",
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
  if (type === "diagonalTopLeft") {
    return {
      x: distanceProgress * horizontalTravel,
      y: distanceProgress * verticalTravel,
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
const resolveImageUrl = (url) => {
  if (!url) return "";
  const isAbsolute = url.startsWith("http://") || url.startsWith("https://");
  return isAbsolute ? url : `${window.location.origin}${url}`;
};
const ImageNode = ({ id, data, isConnectable, isTimerVisible, scenarioStatus }) => {  
  let portKeys = [];
  if (Array.isArray(data.networkport)) {
    portKeys = data.networkport
      .flatMap((obj) =>
        Object.entries(obj).map(([key, value]) => {
          const tagMatch = String(value).match(/tag=(\d+)/);
          return { key, label: tagMatch ? `${key} : VLAN-${tagMatch[1]}` : key };
        }),
      )
      .sort((a, b) => a.key.localeCompare(b.key));
  } else if (typeof data.networkport === "object" && data.networkport !== null) {
    portKeys = Object.entries(data.networkport)
      .map(([key, value]) => {
        const tagMatch = String(value).match(/tag=(\d+)/);
        return { key, label: tagMatch ? `${key} : VLAN-${tagMatch[1]}` : key };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  const sides = ["Right", "Bottom", "Left", "Top"];
  const portsPerSide = Math.ceil(portKeys.length / 4);
  const spacingRatio = 100 / (portsPerSide + 1);
  const palette = getNodePalette(data?.componentId || id || data?.label);
  const iconMotion = getIconMotion(data?.componentId || id || data?.label);
  const imageMotion = data?.visualMotion || "rotate";
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
    <div
      style={{ position: "relative", width: 236, minHeight: 92 }}
      onClick={() => handleClick(data)}
    >
      <div
        className="scenario-node-glow"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 5,
          borderRadius: 13,
          boxShadow: `0 0 28px ${palette.glow}`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          minHeight: 92,
          position: "relative",
          boxSizing: "border-box",
          borderRadius: 12,
          border: `1.5px solid ${palette.accent}`,
          background:
            "linear-gradient(135deg, rgba(20, 24, 42, 0.98), rgba(8, 11, 23, 0.98))",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          color: "#f8fafc",
          boxShadow: `inset 0 0 22px ${palette.glow}, 0 10px 28px rgba(0, 0, 0, 0.42)`,
          cursor: scenarioStatus !== "Pause" && isTimerVisible ? "pointer" : "default",
          overflow: "visible",
        }}
      >
        <div
          className={`scenario-node-icon-frame scenario-node-icon-${imageMotion}`}
          style={{
            position: "relative",
            width: 55,
            height: 55,
            flex: "0 0 58px",
            borderRadius: 10,
            border: `1px solid ${palette.accent}`,
            backgroundColor: `${palette.accent}12`,
            boxShadow: `inset 0 0 18px ${palette.glow}, 0 0 12px ${palette.glow}`,
            transformOrigin: "center",
            willChange: "transform",
            animationDuration: `${
              imageMotion === "rotate"
                ? iconMotion.duration
                : iconMotion.patrolDuration
            }s`,
            animationDirection:
              imageMotion === "rotate" ? iconMotion.direction : "normal",
            animationDelay: `${iconMotion.delay}s`,
          }}
        >
          <div
            className="scenario-node-icon-image"
            style={{
              position: "absolute",
              inset: 6,
              backgroundImage: `url("${resolveImageUrl(data.image)}")`,
              backgroundSize: "78%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundColor: "transparent",
            }}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1, paddingRight: 3 }}>
          <div
            title={title}
            style={{
              fontSize: 14,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: "0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 6,
              color: "#9aa8bd",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {vmId ? `VM ID: ${vmId}` : "Virtual component"}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: -10,
            right: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 8px",
            borderRadius: 6,
            border: `1px solid ${isOnline ? "#2de38c" : "#ff6675"}`,
            background: isOnline ? "#0c3028" : "#3a1821",
            color: isOnline ? "#5cf2ad" : "#ff8b96",
            boxShadow: `0 0 14px ${isOnline ? "rgba(45, 227, 140, .34)" : "rgba(255, 102, 117, .34)"}`,
            fontSize: 9,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: "0.08em",
            zIndex: 8,
          }}
        >
          <span
            className={isOnline ? "scenario-status-pulse" : undefined}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isOnline ? "#2de38c" : "#ff6675",
            }}
          />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </div>

        {portKeys.map((port, index) => {
          const side = sides[Math.floor(index / portsPerSide)];
          const positionIndex = index % portsPerSide;
          const offsetPercent =
            side === "Right" || side === "Top"
              ? (positionIndex + 1) * spacingRatio
              : (portsPerSide - positionIndex) * spacingRatio;
          const baseHandleStyle = {
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: palette.accent,
            border: "1.5px solid #07101d",
            boxShadow: `0 0 0 1px ${palette.accent}, 0 0 10px ${palette.accent}`,
            zIndex: 7,
          };
          const labelStyle = {
            position: "absolute",
            boxSizing: "border-box",
            minWidth: 24,
            maxWidth: 88,
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "#e7edf8",
            background: "#09101e",
            border: `1px solid ${palette.accent}`,
            borderRadius: 5,
            boxShadow: `0 0 8px ${palette.glow}`,
            fontSize: 7,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "0.035em",
            textAlign: "center",
            textTransform: "uppercase",
            padding: "3px 5px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 8,
          };
          let handleStyle;
          let labelPosition;

          if (side === "Top") {
            handleStyle = { ...baseHandleStyle, top: -4, left: `${offsetPercent}%`, transform: "translateX(-50%)" };
            labelPosition = { ...labelStyle, top: -22, left: `${offsetPercent}%`, transform: "translateX(-50%)" };
          } else if (side === "Right") {
            handleStyle = { ...baseHandleStyle, right: -4, top: `${offsetPercent}%`, transform: "translateY(-50%)" };
            labelPosition = { ...labelStyle, right: -6, top: `${offsetPercent}%`, transform: "translate(100%, -50%)" };
          } else if (side === "Bottom") {
            handleStyle = { ...baseHandleStyle, bottom: -4, left: `${offsetPercent}%`, transform: "translateX(-50%)" };
            labelPosition = { ...labelStyle, bottom: -22, left: `${offsetPercent}%`, transform: "translateX(-50%)" };
          } else {
            handleStyle = { ...baseHandleStyle, left: -4, top: `${offsetPercent}%`, transform: "translateY(-50%)" };
            labelPosition = { ...labelStyle, left: -6, top: `${offsetPercent}%`, transform: "translate(-100%, -50%)" };
          }

          return (
            <React.Fragment key={port.key}>
              <Handle type="source" position={Position[side]} id={`${port.key}-source`} style={handleStyle} isConnectable={isConnectable} />
              <Handle type="target" position={Position[side]} id={`${port.key}-target`} style={handleStyle} isConnectable={isConnectable} />
              <div style={labelPosition} title={port.label}>{port.label}</div>
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
        data: {
          ...edge.data,
          isAttacked: edge.isAttacked ?? edge.data?.isAttacked ?? "No",
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
            if (!hasConfiguredAnimation && !node.data?.cardPatrol) return node;

            const basePosition =
              basePositionsRef.current.get(node.id) || node.position;
            const crossesCanvas = [
              "leftToRight",
              "diagonalTopLeft",
              "diagonalTopRight",
            ].includes(configuredAnimation?.type);
            const animationAnchor =
              crossesCanvas && canvasCentre
                ? { x: canvasCentre.x - 118, y: canvasCentre.y - 46 }
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
  }, [elements.nodes.length, scenarioStatus]);

  const nodeTypes = useMemo(
    () => ({
      imageNode: (props) => (
        <ImageNode
          {...props}
          isTimerVisible={isTimerVisible}
          scenarioStatus={scenarioStatus}
        />
      ),
    }),
    [isTimerVisible, scenarioStatus],
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
      style={{
        position: "relative",
        width: "100%",
        height: "80vh",
        borderRadius: 10,
        overflow: "hidden",
        background: "#050811",
        border: "1px solid #182236",
        boxShadow: "inset 0 0 80px rgba(17, 31, 57, 0.42)",
      }}
    >

      
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
          colorMode="dark"
        >
          <Background color="#26334b" gap={20} size={1.15} />
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

import React from "react";
import { Handle, Position } from "@xyflow/react";

const PORT_SIDES = ["Top", "Right", "Bottom", "Left"];
const DEFAULT_PORT_SIDE_ORDER = ["Right", "Bottom", "Left", "Top"];

const getPorts = (networkport) => {
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

const getLayouts = (ports, saved = {}, automatic = {}) => {
  const perSide = Math.max(1, Math.ceil(ports.length / 4));
  const assigned = ports.map((port, index) => ({
    ...port,
    side: PORT_SIDES.includes(saved?.[port.key])
      ? saved[port.key]
      : PORT_SIDES.includes(automatic?.[port.key])
        ? automatic[port.key]
        : DEFAULT_PORT_SIDE_ORDER[Math.min(3, Math.floor(index / perSide))],
  }));
  const totals = assigned.reduce((result, port) => {
    result[port.side] = (result[port.side] || 0) + 1;
    return result;
  }, {});
  const used = {};
  return assigned.map((port) => {
    const index = used[port.side] || 0;
    used[port.side] = index + 1;
    return {
      ...port,
      offset: ((index + 1) * 100) / (totals[port.side] + 1),
    };
  });
};

const getDetails = (data) => {
  const label = String(data?.label || "Unnamed component").trim();
  const separator = label.indexOf("-");
  return {
    title: separator > -1 ? label.slice(separator + 1).trim() : label,
    vmId: data?.vmid || (separator > -1 ? label.slice(0, separator).trim() : ""),
  };
};

const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return typeof window === "undefined" ? url : `${window.location.origin}${url}`;
};

const ScenarioDiagramNode = ({
  id,
  data,
  isConnectable,
  onClick,
  interactive = true,
  deleteNode,
  onConfigureAnimation,
  animationLabel,
  animationIcon,
}) => {
  const ports = getLayouts(
    getPorts(data?.networkport),
    data?.portPositions,
    data?.autoPortPositions,
  );
  const { title, vmId } = getDetails(data);
  const isOnline = data?.isOnline === "Yes";
  const handleClick = () => {
    if (!interactive) return;
    if (onClick) {
      onClick(data);
      return;
    }
    if (!data?.vmid || !data?.vmType) return;
    const name = String(data.label || "").split("-")[1]?.trim() || "";
    window.open(
      `${process.env.BASE_PATH}vnc_view/${data.vmType}/${data.vmid}/${name.replace(/\s+/g, "").toLowerCase()}`,
      "_blank",
    );
  };

  return (
    <div className="portal-flow-node" onClick={handleClick}>
      <div className="portal-flow-node-glow" aria-hidden="true" />
      <div className="portal-flow-node-card">
        {(deleteNode || onConfigureAnimation) && (
          <div className="portal-flow-node-actions nodrag">
            {onConfigureAnimation && (
              <button
                type="button"
                className="portal-flow-node-action portal-flow-node-action--motion"
                title="Configure component animation"
                aria-label="Configure component animation"
                onClick={(event) => {
                  event.stopPropagation();
                  onConfigureAnimation(id, data);
                }}
              >
                ✦
              </button>
            )}
            {deleteNode && (
              <button type="button" className="portal-flow-node-action portal-flow-node-action--delete" title="Delete component" onClick={(event) => { event.stopPropagation(); deleteNode(id); }}>×</button>
            )}
          </div>
        )}
        <div className="portal-flow-node-icon-frame">
          <div
            className="portal-flow-node-icon"
            style={{ backgroundImage: `url("${resolveImageUrl(data?.image)}")` }}
          />
        </div>
        <div className="portal-flow-node-copy">
          <strong title={title}>{title}</strong>
          <small>{vmId ? `VM ID: ${vmId}` : "Virtual component"}</small>
          {animationLabel && (
            <button
              type="button"
              className="portal-flow-node-motion-badge nodrag"
              onClick={(event) => {
                event.stopPropagation();
                onConfigureAnimation?.(id, data);
              }}
            >
              <span>{animationIcon}</span>{animationLabel}
            </button>
          )}
        </div>
        {data?.isOnline != null && (
          <div className={`portal-flow-node-status ${isOnline ? "is-online" : "is-offline"}`}>
            <span />
            {isOnline ? "ONLINE" : "OFFLINE"}
          </div>
        )}
        {ports.map((port) => {
          const style = { "--portal-port-offset": `${port.offset}%` };
          const side = port.side.toLowerCase();
          return (
            <React.Fragment key={port.key}>
              <Handle type="source" position={Position[port.side]} id={`${port.key}-source`} className={`portal-flow-port portal-flow-port--${side}`} style={style} isConnectable={isConnectable} />
              <Handle type="target" position={Position[port.side]} id={`${port.key}-target`} className={`portal-flow-port portal-flow-port--${side}`} style={style} isConnectable={isConnectable} />
              <div className={`portal-flow-port-label portal-flow-port-label--${side}`} style={style} title={port.label}>{port.label}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ScenarioDiagramNode;

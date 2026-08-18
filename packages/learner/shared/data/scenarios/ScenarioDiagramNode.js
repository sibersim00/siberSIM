import React from "react";
import { Handle, Position } from "@xyflow/react";

const SIDES = ["Top", "Right", "Bottom", "Left"];
const DEFAULT_SIDES = ["Right", "Bottom", "Left", "Top"];

const getPorts = (networkport) => {
  const entries = Array.isArray(networkport)
    ? networkport.flatMap((port) => Object.entries(port || {}))
    : networkport && typeof networkport === "object"
      ? Object.entries(networkport)
      : [];
  return entries.map(([key, value]) => {
    const tag = String(value).match(/tag=(\d+)/);
    return { key, label: tag ? `${key} : VLAN-${tag[1]}` : key };
  }).sort((a, b) => a.key.localeCompare(b.key));
};

const getLayouts = (ports, saved = {}, automatic = {}) => {
  const perSide = Math.max(1, Math.ceil(ports.length / 4));
  const assigned = ports.map((port, index) => ({
    ...port,
    side: SIDES.includes(saved?.[port.key])
      ? saved[port.key]
      : SIDES.includes(automatic?.[port.key])
        ? automatic[port.key]
        : DEFAULT_SIDES[Math.min(3, Math.floor(index / perSide))],
  }));
  const totals = assigned.reduce((result, port) => {
    result[port.side] = (result[port.side] || 0) + 1;
    return result;
  }, {});
  const used = {};
  return assigned.map((port) => {
    const index = used[port.side] || 0;
    used[port.side] = index + 1;
    return { ...port, offset: ((index + 1) * 100) / (totals[port.side] + 1) };
  });
};

const ScenarioDiagramNode = ({
  data,
  isConnectable,
  interactive = true,
  vncPath = "vnc_view",
  id,
  deleteNode,
  onConfigureAnimation,
  animationLabel,
  animationIcon,
}) => {
  const ports = getLayouts(getPorts(data?.networkport), data?.portPositions, data?.autoPortPositions);
  const label = String(data?.label || "Unnamed component").trim();
  const separator = label.indexOf("-");
  const title = separator > -1 ? label.slice(separator + 1).trim() : label;
  const vmId = data?.vmid || (separator > -1 ? label.slice(0, separator).trim() : "");
  const isOnline = data?.isOnline === "Yes";
  const image = data?.image?.startsWith("http")
    ? data.image
    : data?.image
      ? typeof window === "undefined" ? data.image : `${window.location.origin}${data.image}`
      : "";
  const openComponent = () => {
    if (!interactive || !data?.vmid || !data?.vmType) return;
    window.open(
      `${process.env.BASE_PATH}${vncPath}/${data.vmType}/${data.vmid}/${title.replace(/\s+/g, "").toLowerCase()}`,
      "_blank",
    );
  };

  return (
    <div className="scenario-node" onClick={openComponent}>
      <div className="scenario-node-glow" aria-hidden="true" />
      <div className="scenario-node-card">
        {deleteNode && (
          <button type="button" className="scenario-node-delete nodrag" title="Delete component" onClick={(event) => { event.stopPropagation(); deleteNode(id); }}>×</button>
        )}
        {onConfigureAnimation && (
          <button
            type="button"
            className="scenario-node-animation nodrag"
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
        <div className="scenario-node-icon-frame">
          <div className="scenario-node-icon-image" style={{ backgroundImage: `url("${image}")` }} />
        </div>
        <div className="scenario-node-copy">
          <strong title={title}>{title}</strong>
          <small>{vmId ? `VM ID: ${vmId}` : "Virtual component"}</small>
          {animationLabel && (
            <button
              type="button"
              className="scenario-node-animation-badge nodrag"
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
          <div className={`scenario-node-status ${isOnline ? "is-online" : "is-offline"}`}>
            <span />{isOnline ? "ONLINE" : "OFFLINE"}
          </div>
        )}
        {ports.map((port) => {
          const style = { "--scenario-port-offset": `${port.offset}%` };
          const side = port.side.toLowerCase();
          return (
            <React.Fragment key={port.key}>
              <Handle type="source" position={Position[port.side]} id={`${port.key}-source`} className={`scenario-node-port scenario-node-port--${side}`} style={style} isConnectable={isConnectable} />
              <Handle type="target" position={Position[port.side]} id={`${port.key}-target`} className={`scenario-node-port scenario-node-port--${side}`} style={style} isConnectable={isConnectable} />
              <div className={`scenario-node-port-label scenario-node-port-label--${side}`} style={style}>{port.label}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ScenarioDiagramNode;

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../redux/axios/axiosMaster";
import defaultFavicon from "../../../public/assets/img/brand/favicon.png";

// Mounted only while the console is disconnected, so timers stop on connection.
export default function VncConsoleLanding({ vmid, vmType, cleanName, loading, status, onConnect }) {
  const matrixCanvasRef = useRef(null);
  const [vmMeta, setVmMeta] = useState(null);
  const [detailsError, setDetailsError] = useState(false);
  const [bootLog, setBootLog] = useState([]);
  useEffect(() => {
    let active = true;
    setVmMeta(null);
    setDetailsError(false);
    if (vmid) {
      axios.get(`/vmstart/get/${encodeURIComponent(vmid)}`).then((response) => {
        if (active) setVmMeta(response.data?.data || null);
      }).catch(() => { if (active) setDetailsError(true); });
    }
    return () => { active = false; };
  }, [vmid]);

  const vmStatus = vmMeta?.vm_status;
  const vmDetails = useMemo(() => {
    let ports = vmMeta?.network_ports;
    if (typeof ports === "string") {
      try { ports = JSON.parse(ports); }
      catch { ports = ports.split("\n").filter(Boolean); }
    }
    return {
      cpu: vmMeta?.cores,
      memory: vmMeta?.memory,
      storage: vmMeta?.storage,
      ports: ports && typeof ports === "object" ? Object.keys(ports) : [],
    };
  }, [vmMeta]);
  // These bars represent configured capacity, not live utilization.
  const telemetry = {
    cpu: Math.min(100, (Number(vmDetails.cpu) || 0) / 16 * 100),
    mem: Math.min(100, (Number(vmDetails.memory) || 0) / 16384 * 100),
    net: Math.min(100, vmDetails.ports.length * 22),
    disk: Math.min(100, (Number(vmDetails.storage) || 0) / 500 * 100),
  };
  const bootScript = useMemo(() => [
    `> target endpoint: ${vmMeta?.componentname || cleanName || "Loading..."}`,
    `> vmid #${vmid} · ${String(vmType || "").toUpperCase()}`,
    vmMeta
      ? `> configured: ${vmMeta.cores ?? "?"} vCPU / ${vmMeta.memory ?? "?"} MB RAM / ${vmMeta.storage ?? "?"} GB disk`
      : detailsError ? "> VM details unavailable; console connection is still available." : "> loading VM details...",
    "> click Connect to request a console ticket.",
  ], [vmMeta, vmid, vmType, cleanName, detailsError]);

  useEffect(() => {
    setBootLog([]);
    let index = 0;
    const timer = setInterval(() => {
      const line = bootScript[index++];
      setBootLog((lines) => [...lines, line]);
      if (index >= bootScript.length) clearInterval(timer);
    }, 450);
    return () => clearInterval(timer);
  }, [bootScript]);

  useEffect(() => {
    const canvas = matrixCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let columns = 0;
    let drops = [];
    let frame;
    let lastDraw = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      columns = Math.floor(canvas.width / 16);
      drops = Array.from({ length: columns }, () => Math.random() * -40);
    };
    const glyphs = "0123456789ABCDEF{}<>/#";
    const draw = (time) => {
      if (!document.hidden && time - lastDraw >= 50) {
        lastDraw = time;
        ctx.fillStyle = "rgba(3,6,10,0.14)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "14px monospace";
        for (let x = 0; x < columns; x++) {
          ctx.fillStyle = Math.random() > 0.94 ? "rgba(160,255,220,0.9)" : "rgba(0,180,216,0.35)";
          ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], x * 16, drops[x] * 16);
          if (drops[x] * 16 > canvas.height && Math.random() > 0.975) drops[x] = 0;
          drops[x]++;
        }
      }
      if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
    };
    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="portal-vnc-landing">
      <div className="ssc-root" style={{ position: "absolute", inset: 0 }}>
            <div className="ssc-bg">
              <canvas ref={matrixCanvasRef} className="ssc-matrix" />
              <div className="ssc-vignette" />
              <div className="ssc-grid" />
              <div className="ssc-circuit" />

              {/* drifting VM cluster nodes — echoes a hypervisor topology view */}
              <div className="ssc-node" style={{ top: "18%", left: "22%", animationDelay: "0s" }} />
              <div className="ssc-node red" style={{ top: "28%", left: "30%", animationDelay: "1.2s" }} />
              <div className="ssc-node" style={{ top: "22%", left: "38%", animationDelay: "0.6s" }} />
              <div className="ssc-node" style={{ top: "72%", left: "68%", animationDelay: "2s" }} />
              <div className="ssc-node red" style={{ top: "80%", left: "76%", animationDelay: "0.3s" }} />
              <div className="ssc-node" style={{ top: "76%", left: "84%", animationDelay: "1.6s" }} />
              <div className="ssc-line" style={{ top: "23%", left: "22%", width: "80px", transform: "rotate(18deg)" }} />
              <div className="ssc-line" style={{ top: "27%", left: "30%", width: "70px", transform: "rotate(-8deg)" }} />
              <div className="ssc-line" style={{ top: "76%", left: "68%", width: "80px", transform: "rotate(18deg)" }} />
            </div>

            <div className="ssc-panel">
              <div className="ssc-corner tl" />
              <div className="ssc-corner tr" />
              <div className="ssc-corner bl" />
              <div className="ssc-corner br" />
              <div className="ssc-panel-sweep" />

              <img
                alt="SIMMaster Panel Logo Preview"
                src={`${defaultFavicon.src}`}
                className="ssc-logo"
              />

              <div className="ssc-eyebrow">
                <span className={`ssc-led${vmStatus === "Running" ? "" : " red"}`} />
                CONSOLE // {vmStatus ? vmStatus.toUpperCase() : "SECURE LINK"}
                <span className="ssc-led" />
              </div>

              <h2 className="ssc-title" data-text="siberSIM Console">
                <span style={{ color: "#00d4ff" }}>siber</span>
                <span style={{ color: "#ff1f4c" }}>SIM</span>{" "}
                <span style={{ color: "#e6f1f8" }}>Console</span>
              </h2>

              <button
                className="ssc-btn"
                onClick={onConnect}
                disabled={loading}
              >
                <span className="ssc-btn-glyph">{loading ? "◐" : "▶"}</span>
                {loading ? "Connecting…" : "Connect"}
              </button>

              <div className="ssc-telemetry-grid">
                <div className="ssc-tele">
                  <span className="tele-label">vCPU</span>
                  <span className="tele-value">
                    {vmDetails?.cpu && vmDetails.cpu !== "N/A"
                      ? `${vmDetails.cpu} CORES`
                      : "— —"}
                  </span>
                  <div className="tele-bar">
                    <div className="tele-fill" style={{ width: `${telemetry.cpu}%` }} />
                  </div>
                </div>
                <div className="ssc-tele">
                  <span className="tele-label">MEMORY</span>
                  <span className="tele-value">
                    {vmDetails?.memory && vmDetails.memory !== "N/A"
                      ? `${vmDetails.memory} MB`
                      : "— —"}
                  </span>
                  <div className="tele-bar">
                    <div className="tele-fill amber" style={{ width: `${telemetry.mem}%` }} />
                  </div>
                </div>
                <div className="ssc-tele">
                  <span className="tele-label">NETWORK</span>
                  <span className="tele-value">
                    {vmDetails?.ports?.length > 0
                      ? `${vmDetails.ports.length} NIC${vmDetails.ports.length > 1 ? "S" : ""}`
                      : vmMeta ? "NO LINK" : "— —"}
                  </span>
                  <div className="tele-bar">
                    <div className="tele-fill green" style={{ width: `${telemetry.net}%` }} />
                  </div>
                </div>
                <div className="ssc-tele">
                  <span className="tele-label">DISK</span>
                  <span className="tele-value">
                    {vmDetails?.storage && vmDetails.storage !== "N/A"
                      ? `${vmDetails.storage} GB`
                      : "— —"}
                  </span>
                  <div className="tele-bar">
                    <div className="tele-fill" style={{ width: `${telemetry.disk}%` }} />
                  </div>
                </div>
              </div>

              <div className="ssc-terminal">
                {bootLog.map((line, idx) => (
                  <div
                    className={`ssc-terminal-line${idx === bootLog.length - 1 ? " active" : ""}`}
                    key={idx}
                  >
                    {line}
                  </div>
                ))}
              </div>

              <p className="ssc-status">
                {status}
                <span className="cursor" />
              </p>

              {loading && <div className="ssc-spinner" />}
            </div>
          </div>
    </div>
  );
}

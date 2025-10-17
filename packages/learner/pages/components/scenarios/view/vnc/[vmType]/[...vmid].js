"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import {
  vmStartScenario,
  vmRestartScenario,
} from "../../../../../../shared/redux/slices/scenarios/scenarios";
import Seo from "../../../../../../shared/layout-components/seo/seo";
export default function ProxmoxConsole() {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const rfbRef = useRef(null);
  const router = useRouter();
  const [backend] = useState(`${process.env.VNC_PROXY_URL}`);
  const { vmid, vmType  } = router.query;

  const [status, setStatus] = useState("Click Connect to start.");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [skipConnectUI, setSkipConnectUI] = useState(false);
  const updateStatus = (msg) => setStatus(msg);
  useEffect(() => {
    const token = localStorage.getItem("accessTokenLearner");
    if (!token) router.replace("/404");
  }, [router]);
let cleanName = "";
let realVmid = "";
if (Array.isArray(vmid)) {
  realVmid = vmid[0];        // "4747"
  cleanName = vmid[1] || ""; // "windows10"
} else {
  realVmid = vmid || "";
}

const fetchVNCTicket = async () => {
  const res = await fetch(
    backend.replace(/^ws/, "http") +
      `/ticket?vmid=${encodeURIComponent(realVmid)}&vmType=${encodeURIComponent(
        vmType
      )}&cleanName=${encodeURIComponent(cleanName)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessTokenLearner")}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();
  if (!data.ticket) throw new Error("Failed to get VNC ticket");
  return data.ticket;
};


  const intentionalDisconnect = useRef(false);
  const connect = async (reconnecting = false) => {
    try {
      setLoading(true);
      updateStatus("Requesting ticket...");
      intentionalDisconnect.current = false;

      const { default: RFB } = await import("@novnc/novnc/core/rfb");

      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect();
        } catch {}
        rfbRef.current = null;
      }

      const ticket = await fetchVNCTicket();
      const wsUrl = `${backend.replace(
        /\/$/,
        ""
      )}/vnc?vmid=${encodeURIComponent(vmid)}&vmType=${encodeURIComponent(
        vmType
      )}`;

      updateStatus("Connecting to VNC...");

      const rfb = new RFB(containerRef.current, wsUrl, {
        credentials: { password: ticket },
      });
      rfb.viewOnly = false;
      rfb.scaleViewport = true;
      rfb.resizeSession = true;

      rfb.addEventListener("connect", () => {
        updateStatus("Connected!");
        setLoading(false);
        setConnected(true); // keep screen visible
      });

      rfb.addEventListener("disconnect", () => {
        if (!intentionalDisconnect.current) {
          updateStatus("Disconnected");
          setConnected(false); // only on unintentional disconnect
          setSidebarOpen(false);
        }
        setLoading(false);
        intentionalDisconnect.current = false;
      });

      rfbRef.current = rfb;
    } catch (err) {
      updateStatus(err.message);
      if (!reconnecting) setConnected(false); // only hide screen on failure if not reconnecting
      setLoading(false);
    }
  };
  useEffect(() => {
    return () => {
      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect();
        } catch {}
      }
    };
  }, []);
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) setSidebarOpen(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // VNC actions
  const sendCtrlAltDel = () => rfbRef.current?.sendCtrlAltDel();

  const wrapperRef = useRef(null);
  const toggleFullscreen = () => {
    if (wrapperRef.current) {
      if (!document.fullscreenElement) {
        wrapperRef.current
          .requestFullscreen()
          .catch((err) =>
            console.error(`Error attempting fullscreen: ${err.message}`)
          );
      } else {
        document.exitFullscreen();
      }
    }
    setSidebarOpen(true); // ensure sidebar opens in fullscreen
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) setSidebarOpen(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleStartClick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to start VM/CT ${vmid}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, start it!",
      allowOutsideClick: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        intentionalDisconnect.current = true;
        setSkipConnectUI(true); // hide Connect button immediately
        setOverlayLoading(true); // show loader during API
        updateStatus("Starting VM...");

        try {
          await dispatch(vmStartScenario({ vmid, vmType })); // API call
        } catch (err) {
          updateStatus(err.message);
        } finally {
          setOverlayLoading(false);
        }

        // reconnect in background (no loader, no black screen)
        updateStatus("Reconnecting to VNC...");
        connect(true);
      }
    });
  };

  const handleRestartClick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to reset VM/CT ${vmid}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, reset it!",
      allowOutsideClick: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        intentionalDisconnect.current = true;

        // Show overlay only, keep old VNC screen visible
        setOverlayLoading(true);
        updateStatus("Resetting VM...");

        try {
          await dispatch(vmRestartScenario({ vmid, vmType })); // API call
        } catch (err) {
          updateStatus(err.message);
        } finally {
          setOverlayLoading(false); // hide overlay after API finishes
        }

        // Reconnect without flicker
        updateStatus("Reconnecting to VNC...");
        await connect(true);
      }
    });
  };

  return (
    <>
      <Seo title={`${cleanName}`} />

      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#0d1117",
          color: "#fff",
          position: "relative",
        }}
      >
        {/* Wrapper for fullscreen */}
        <div
          ref={wrapperRef}
          id="vnc_wrapper"
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          {/* Sidebar + Controls */}
          {connected && (
            <>
              {/* Arrow toggle */}
              <div
                onClick={() => {
                  if (sidebarOpen) setPowerMenuOpen(false);
                  setSidebarOpen(!sidebarOpen);
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  transform: "translateY(-50%)",
                  background: "#111",
                  color: "#aaa",
                  padding: "20px 10px",
                  borderTopRightRadius: "6px",
                  borderBottomRightRadius: "6px",
                  cursor: "pointer",
                  zIndex: 9999,
                  userSelect: "none",
                }}
                title="Toggle controls"
              >
                {sidebarOpen ? "◀" : "▶"}
              </div>

              {/* Menu overlay */}
              {sidebarOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "40px",
                    transform: "translateY(-50%)",
                    background: "rgba(17,17,17,0.95)",
                    padding: "10px",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    zIndex: 9998,
                  }}
                >
                  <button
                    onClick={sendCtrlAltDel}
                    title="Ctrl+Alt+Del"
                    style={buttonStyle}
                  >
                    ⌨️
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    style={buttonStyle}
                  >
                    ⛶
                  </button>

                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setPowerMenuOpen(!powerMenuOpen)}
                      title="Power Options"
                      style={buttonStyle}
                    >
                      ⏻
                    </button>

                    {powerMenuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "110%",
                          transform: "translateY(-50%)",
                          background: "rgba(17,17,17,0.95)",
                          borderRadius: "6px",
                          padding: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          zIndex: 9999,
                        }}
                      >
                        <button
                          onClick={handleStartClick}
                          style={subButtonStyle}
                          title="Start VM"
                        >
                          Start
                        </button>
                        <button
                          onClick={handleRestartClick}
                          style={subButtonStyle}
                          title="Hard Reset VM"
                        >
                          Hard Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* VNC Container */}
          <div
            id="noVNC_container"
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              background: "#000",
              border: "none",
              overflow: "hidden",
              display: connected ? "block" : "none",
            }}
          />
        </div>

        {/* Main content when not connected */}

        {!connected && !skipConnectUI && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: "20px" }}>Siber Sim VM Console</h2>
            <button
              onClick={connect}
              disabled={loading}
              style={{
                padding: "12px 28px",
                fontSize: "16px",
                background: "#2a62f2",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {loading ? "Connecting..." : "Connect"}
            </button>
            <p style={{ marginTop: "20px", color: "#aaa" }}>{status}</p>
            {loading && (
              <div
                style={{
                  marginTop: "20px",
                  border: "6px solid #ccc",
                  borderTop: "6px solid #2a62f2",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                }}
              />
            )}
          </div>
        )}

        {/* Full-screen overlay loader */}
        {overlayLoading && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10000,
              color: "#fff",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            Connecting...
            <div
              style={{
                marginTop: "20px",
                border: "6px solid rgba(255,255,255,0.3)",
                borderTop: "6px solid #2a62f2",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          button:focus {
            outline: none;
          }
        `}</style>
      </div>
    </>
  );
}

const buttonStyle = {
  backgroundColor: "#222",
  border: "none",
  borderRadius: "6px",
  color: "#ddd",
  fontSize: "20px",
  padding: "15px 10px",
  width: "40px",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const subButtonStyle = {
  backgroundColor: "#333",
  border: "none",
  borderRadius: "4px",
  color: "#ddd",
  fontSize: "16px",
  padding: "7px 14px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Modal,
  Card,
  Button,
  Nav,
  Tab,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Swal from "sweetalert2";
import {
  vmStartScenario,
  vmRestartScenario,
  getSnapshot,
} from "../../../../../../shared/redux/slices/usersession/usersessionManage";
import defaultFavicon from "../../../../../../public/assets/img/brand/favicon.png";
import snapicon from "../../../../../../public/assets/img/pngs/imageimg.png";

import Seo from "../../../../../../shared/layout-components/seo/seo";
export default function ProxmoxConsole() {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const rfbRef = useRef(null);
  const router = useRouter();
  const [backend] = useState(`${process.env.VNC_PROXY_URL}`);
  const { vmid, vmType } = router.query;

  const [status, setStatus] = useState("Click Connect to start.");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [skipConnectUI, setSkipConnectUI] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [snapshotList, setSnapshotList] = useState([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const snapshotApiData = useSelector(
    (state) => state.usersessionManage?.getSnapshot?.data?.snapshots || []
  );
  const snapshotApiData1 = useSelector(
    (state) => state.usersessionManage?.getSnapshot?.data || []
  );
  const saveSnapdata = useSelector(
    (state) => state.usersessionManage?.saveSnapshot || []
  );
  const rollSnapdata = useSelector(
    (state) => state.usersessionManage?.getrestoresnapshot || []
  );
  const handleSelectSnapshot = (snapshotId) => {
    setSelectedSnapshotId(snapshotId);
  };

  const updateStatus = (msg) => setStatus(msg);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.replace("/404");
  }, [router]);
  let cleanName = "";
  let realVmid = "";
  if (Array.isArray(vmid)) {
    realVmid = vmid[0];
    cleanName = vmid[1] || "";
  } else {
    realVmid = vmid || "";
  }
  console.log("vmType", vmType);
  const fetchVNCTicket = async () => {
    const res = await fetch(
      backend.replace(/^ws/, "http") +
        `/ticket?vmid=${encodeURIComponent(
          realVmid
        )}&vmType=${encodeURIComponent(vmType)}&cleanName=${encodeURIComponent(
          cleanName
        )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
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
        setConnected(true);
      });

      rfb.addEventListener("disconnect", () => {
        if (!intentionalDisconnect.current) {
          updateStatus("Disconnected");
          setConnected(false);
          setSidebarOpen(false);
        }
        setLoading(false);
        intentionalDisconnect.current = false;
      });

      rfbRef.current = rfb;
    } catch (err) {
      updateStatus(err.message);
      if (!reconnecting) setConnected(false);
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
    setSidebarOpen(true);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) setSidebarOpen(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (rollSnapdata?.status === "success") {
      setShowRollbackModal(false);

      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect();
        } catch (e) {}
      }

      setConnected(false);
      setStatus("Click Connect to start.");
      setSkipConnectUI(false);

      dispatch(getSnapshot({ vmid: realVmid, vmType }));

      Swal.fire({
        icon: "success",
        text: "Rollback completed successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }, [rollSnapdata]);

  const handleDeleteSnapshott = async (snapshotName, snapshotId) => {
    try {
      setOverlayLoading(true);
      const deletePayload = {
        snapname: snapshotName,
        vmType,
        vmid: Number(realVmid),
      };
      await dispatch(deleteSnapshot(deletePayload));
      const createPayload =
        vmType === "qemu"
          ? { vmid: Number(realVmid), vmType, vmstate: 1 }
          : { vmid: Number(realVmid), vmType };

      await dispatch(saveSnapshot(createPayload));
      setSelectedSnapshotId(null);
      dispatch(getSnapshot({ vmid: Number(realVmid), vmType }));
    } catch (err) {
      console.log("ERROR", err);
    } finally {
      setOverlayLoading(false);
    }
  };

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
        setSkipConnectUI(true);
        setOverlayLoading(true);
        updateStatus("Starting VM...");

        try {
          await dispatch(vmStartScenario({ vmid, vmType }));
        } catch (err) {
          updateStatus(err.message);
        } finally {
          setOverlayLoading(false);
        }
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

        setOverlayLoading(true);
        updateStatus("Resetting VM...");

        try {
          await dispatch(vmRestartScenario({ vmid, vmType }));
        } catch (err) {
          updateStatus(err.message);
        } finally {
          setOverlayLoading(false);
        }

        updateStatus("Reconnecting to VNC...");
        await connect(true);
      }
    });
  };

  useEffect(() => {
    if (snapshotApiData?.length > 0) {
      const formatted = snapshotApiData.map((s) => ({
        snapshotid: s.snapshotid,
        snapshot_name: s.snapshot_name,
        createdon: s.createdon,
      }));
      console.log("formattedformattedformattedformattedformatted", formatted);

      setSnapshotList(formatted);
    }

    if (snapshotApiData?.data) {
      setLocalSnapshots(snapshotApiData.data);
    }
  }, [snapshotApiData]);
  console.log("snapshotListsnapshotListsnapshotList", snapshotList);

  useEffect(() => {
    if (realVmid && vmType) {
      dispatch(getSnapshot({ vmid: Number(realVmid), vmType }));
    }
  }, [realVmid, vmType]);

  return (
    <>
      <Seo title={`${cleanName}`} />
      <Modal
        show={showRollbackModal}
        onHide={() => setShowRollbackModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Body className="text-white" style={{ background: "#24243E" }}>
          <h2 className="text-center mb-2">Snapshot List</h2>
          <div className="p-3 rounded" style={{ background: "#24243E" }}>
            <div
              className=" justify-content-between align-items-center p-3 rounded-5"
              style={{
                background: "#0E0E23",
                fontSize: "13px",
                border: "3px dashed #6f6f8a",
              }}
            >
<div style={{
  display: "grid",
  gridTemplateColumns: "95px 10px auto",
  rowGap: "6px",
}}>
  {/* Row 1 */}
  <div style={{ fontSize: "12px", fontWeight: 400 }}>
    Component Name
  </div>
  <div>:</div>
  <div className="fs-6 fw-bold" style={{ color: "#dc3545" }}>
    {snapshotApiData1?.componentname}
  </div>

  {/* Row 2 */}
  <div style={{  fontSize: "12px", fontWeight: 400 }}>
    Scenario Name
  </div>
  <div >:</div>
  <div className="fs-6 fw-bold" style={{ color: "#dc3545" }}>
    {snapshotApiData1?.scenariotitle}
  </div>
</div>



              {/* <p>Component Type : {snapshotApiData1?.componenttype}</p> */}
            </div>
          </div>
          <div className="p-2 rounded" style={{ background: "#24243E" }}>
            <div className="p-4 rounded" style={{ background: "#24243E" }}>
              <div className="d-flex justify-content-center align-items-center gap-4">
                {snapshotList.slice(0, 3).map((snap, index) => (
                  <React.Fragment key={snap.snapshotid}>
                    <div
                      className=" rounded-5 d-flex flex-column justify-content-between"
                      style={{
                        background: "#0E0E23",
                        minWidth: "190px",
                        height: "245px",
                        padding: "15px",
                        color: "#fff",
                        position: "relative",
                        boxShadow: "0px 0px 15px rgba(0,0,0,0.25)",
                      }}
                    >
                      {index === 0 && (
                        <span
                          className="position-absolute fw-bold"
                          style={{
                            top: "-8px",
                            right: "-8px",
                            background: "#00D26A",
                            color: "#000",
                            padding: "2px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            boxShadow: "0px 2px 6px rgba(0,0,0,0.3)",
                          }}
                        >
                          Parent
                        </span>
                      )}
                      <img
                        src={snapicon.src}
                        className="mx-auto"
                        style={{ width: "75px", height: "75px", opacity: 0.9 }}
                      />
                      <h5
                        className="text-center"
                        style={{
                          fontSize: "12px",
                          fontWeight: 400,
                          lineHeight: "16px",
                          margin: "4px 0 2px",
                          wordBreak: "break-all",
                        }}
                      >
                        {snap.snapshot_name}
                      </h5>
                      <p
                        className="text-center m-0"
                        style={{ fontSize: "11px", opacity: 0.7 }}
                      >
                        Created: {new Date(snap.createdon).toLocaleString()}
                      </p>
                    </div>
                    {index < snapshotList.slice(0, 3).length - 1 && (
                      <div
                        className="align-self-center"
                        style={{
                          fontSize: "26px",
                          color: "#fff",
                          opacity: 0.5,
                        }}
                      >
                        {/* → */}
                        <i class="fa fa-arrow-right"></i>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          {/* NOTE */}
          <div
            className="text-center p-1 rounded"
            style={{ fontSize: "12px", color: "#FFA500" }}
          >
            Note : Restoring the parent snapshot will automatically delete all
            of its child snapshots.
          </div>

          {/* CLOSE BUTTON */}
          <div className="text-center mt-3">
            <Button
              variant="secondary"
              onClick={() => setShowRollbackModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Body style={{ background: "#24243E", color: "#fff" }}>
          {/* ERROR MESSAGE */}
          <h3
            style={{
              textAlign: "center",
              marginBottom: "10px",
              color: "#ff7272",
            }}
          >
            Snapshot Failed
          </h3>

          <p
            style={{
              textAlign: "center",
              marginBottom: "20px",
              opacity: 0.8,
              fontSize: "15px",
            }}
          >
            {errorMessage}
          </p>

          <hr style={{ borderColor: "rgba(255,255,255,0.1)" }} />

          <div
            style={{
              background: "#24243E",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                background: "#24243E",
                padding: "25px",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                }}
              >
                {snapshotList.slice(0, 3).map((snap) => (
                  <div
                    key={snap.snapshotid}
                    onClick={() => handleSelectSnapshot(snap.snapshotid)}
                    style={{
                      background:
                        selectedSnapshotId === snap.snapshotid
                          ? "#FF4D4D"
                          : "#0E0E23",
                      width: "230px",
                      height: "245px",
                      padding: "15px",
                      borderRadius: "12px",
                      color: "#fff",
                      position: "relative",
                      boxShadow: "0px 0px 15px rgba(0,0,0,0.25)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                  >
                    {/* IMAGE */}
                    <img
                      src={`${snapicon.src}`}
                      style={{
                        width: "45px",
                        height: "45px",
                        margin: "0 auto",
                        opacity: 0.9,
                      }}
                    />

                    {/* TITLE */}
                    <h5
                      style={{
                        fontSize: "12px",
                        fontWeight: "400",
                        margin: "4px 0 2px 0",
                        textAlign: "center",
                        lineHeight: "16px",
                        wordBreak: "break-all",
                      }}
                    >
                      {snap.snapshot_name}
                    </h5>

                    {/* DATE */}
                    <p
                      style={{
                        fontSize: "11px",
                        opacity: 0.7,
                        margin: "0",
                        textAlign: "center",
                      }}
                    >
                      Created: {new Date(snap.createdon).toLocaleString()}
                    </p>

                    {/* DELETE BUTTON (only visible on selected card) */}
                    {selectedSnapshotId === snap.snapshotid && (
                      <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <Button
                          style={{
                            background: "#fff",
                            color: "#000",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card re-click
                            handleDeleteSnapshott(
                              snap.snapshot_name,
                              snap.snapshotid
                            );
                          }}
                        >
                          Delete Snapshot
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CLOSE BUTTON */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => setShowErrorModal(false)}
              style={{
                background: "#FF4D4D",
                color: "#fff",
                padding: "10px 25px",
                borderRadius: "8px",
                border: "none",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </Modal.Body>
      </Modal>

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
                        {/* <button
                          onClick={handleCreateSnapshot}
                          style={subButtonStyle}
                          title="Snapshot VM"
                        >
                          Snapshot
                        </button> */}

                        <Button
                          onClick={() => {
                            dispatch(
                              getSnapshot({ vmid: Number(realVmid), vmType })
                            );
                            setShowRollbackModal(true);
                          }}
                          style={subButtonStyle}
                        >
                          Snapshot
                        </Button>
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
            <img
              alt="SIMMaster Panel Logo Preview"
              src={`${defaultFavicon.src}`}
              style={{
                objectFit: "cover",
                width: "15%",
                height: "15%",
              }}
            />
            <h2 style={{ marginBottom: "20px" }}>
              <span style={{ color: "#0077B6" }}>siber</span>
              <span style={{ color: "#D21F3C" }}>SIM</span> Console
            </h2>
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

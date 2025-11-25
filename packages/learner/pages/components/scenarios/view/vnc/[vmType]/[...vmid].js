"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
  vmStartScenario,
  vmRestartScenario,
  saveSnapshot,
  clearSaveSnapshot,
  getSnapshot,
  deleteSnapshot,
  restoresnapshot,
} from "../../../../../../shared/redux/slices/scenarios/scenarios";
import Seo from "../../../../../../shared/layout-components/seo/seo";
import defaultFavicon from "../../../../../../public/assets/img/brand/favicon.png";
import snapicon from "../../../../../../public/assets/img/pngs/snap.png";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [skipConnectUI, setSkipConnectUI] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [snapshotList, setSnapshotList] = useState([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const snapshotApiData = useSelector(
    (state) => state.scenarios?.getSnapshot?.data?.snapshots || []
  );
  const snapshotApiData1 = useSelector(
    (state) => state.scenarios?.getSnapshot?.data || []
  );
  const rollSnapdata = useSelector(
    (state) => state.scenarios?.getrestoresnapshot || []
  );
  const handleSelectSnapshot = (snapshotId) => {
    setSelectedSnapshotId(snapshotId);
  };

  const updateStatus = (msg) => setStatus(msg);
  useEffect(() => {
    const token = localStorage.getItem("accessTokenLearner");
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
      setShowErrorModal(false);
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
      setSnapshotList(formatted);
    }

    if (snapshotApiData?.data) {
      setLocalSnapshots(snapshotApiData.data);
    }
  }, [snapshotApiData]);

  const handleCreateSnapshot = async () => {
    const payload =
      vmType === "qemu"
        ? { vmid: Number(realVmid), vmType, vmstate: 1 }
        : { vmid: Number(realVmid), vmType };

    try {
      setOverlayLoading(true);
      const result = await dispatch(saveSnapshot(payload));

      Swal.fire({
        icon: "success",
        title: "Snapshot Created",
        text: result?.message || "Snapshot created successfully.",
      });
      dispatch(clearSaveSnapshot());
    } catch (err) {
      const errMsg =
        err?.error?.error?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to create snapshot.";

      // Instead of Swal → open modal
      setErrorMessage(errMsg);
      setShowErrorModal(true);
    } finally {
      dispatch(getSnapshot({ vmid: Number(realVmid), vmType }));
      setOverlayLoading(false);
      setShowWarning(false);
    }
  };
  console.log("showWarning",showWarning);
  
  useEffect(() => {
    if (realVmid && vmType) {
      dispatch(getSnapshot({ vmid: Number(realVmid), vmType }));
    }
  }, [realVmid, vmType]);

  // useEffect(() => {
  //   if (snapshotList.length > 0 && !selectedSnapshotId) {
  //     setSelectedSnapshotId(snapshotList[0].snapshotid); // Auto-select first card
  //   }
  // }, [snapshotList, selectedSnapshotId]);

  const confirmRollback = async (payload) => {
    const confirm = await Swal.fire({
      title: "Rollback Snapshot?",
      text: `Are you sure you want to roll back '${payload.snapname}'?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, rollback",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;
    handleRollback(payload);
  };
  const handleRollback = async (payload) => {
    try {
      setOverlayLoading(true);

      const result = await dispatch(restoresnapshot(payload));
      if (!result?.success) {
        throw result?.error;
      }
      Swal.fire({
        icon: "success",
        title: "Rollback Successful",
        text: result?.data?.message || "Snapshot rollback completed.",
      });

      setShowRollbackModal(false);
      setConnected(false);
    } catch (err) {
      console.log("rolllback  error ", err);
      const errMsg =
        err?.error?.message || err?.message || "Unable to rollback snapshot.";

      Swal.fire({
        icon: "error",
        title: "Rollback Failed",
        text: errMsg,
      });
    } finally {
      setOverlayLoading(false);
    }
  };
  const handleDeleteSnapshot = async (snapName) => {
    const payload = {
      vmid: Number(realVmid),
      vmType,
      snapname: snapName,
    };

    try {
      const confirm = await Swal.fire({
        title: "Delete Snapshot?",
        text: `Are you sure you want to delete '${snapName}'?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });
      if (!confirm.isConfirmed) return;
      setOverlayLoading(true);
      const result = await dispatch(deleteSnapshot(payload));
      Swal.fire({
        icon: "success",
        title: "Snapshot Deleted",
        text:
          result?.data?.message ||
          result?.message ||
          "Snapshot deleted successfully.",
      });
      setSnapshotList((prev) =>
        prev.filter((s) => s.snapshot_name !== snapName)
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Unable to delete snapshot.",
      });
    } finally {
      dispatch(getSnapshot({ vmid: Number(realVmid), vmType }));
      setOverlayLoading(false);
      setShowRollbackModal(false);
    }
  };
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
          <h2 className="text-center mb-2">Rollback Snapshot</h2>
          <div className="p-3 rounded" style={{ background: "#24243E" }}>
            <div
              className=" justify-content-between align-items-center p-3 rounded-5"
              style={{
                background: "#0E0E23",
                fontSize: "13px",
                border: "3px dashed #6f6f8a",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 10px auto",
                  rowGap: "6px",
                }}
              >
                {/* Row 1 */}
                <div style={{ fontSize: "12px", fontWeight: 400 }}>
                  Component Name
                </div>
                <div>:</div>
                <div className="fs-6 fw-bold" style={{ color: "#dc3545" }}>
                  {snapshotApiData1?.componentname}
                </div>

                {/* Row 2 */}
                <div style={{ fontSize: "12px", fontWeight: 400 }}>
                  Scenario Name
                </div>
                <div>:</div>
                <div className="fs-6 fw-bold" style={{ color: "#dc3545" }}>
                  {snapshotApiData1?.scenariotitle}
                </div>
              </div>
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
                        style={{ width: "55px", height: "55px", opacity: 0.9 }}
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
                      <div className="d-flex justify-content-center gap-2 mt-2">
                        <button
                          className="btn d-flex align-items-center justify-content-center"
                          style={{
                            background: "#007bff",
                            border: "none",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "#fff",
                          }}
                          onClick={() =>
                            confirmRollback({
                              vmid: Number(realVmid),
                              vmType,
                              snapname: snap.snapshot_name,
                              startValue: 1,
                            })
                          }
                        >
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Rollback</Tooltip>}
                          >
                            <i className="fas fa-undo"></i>
                          </OverlayTrigger>
                        </button>

                        {/* DELETE BTN */}
                        <button
                          className="btn d-flex align-items-center justify-content-center"
                          style={{
                            background: "#dc3545",
                            border: "none",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "#fff",
                          }}
                          onClick={() =>
                            handleDeleteSnapshot(snap.snapshot_name)
                          }
                        >
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Delete</Tooltip>}
                          >
                            <i className="fe fe-trash"></i>
                          </OverlayTrigger>
                        </button>
                      </div>
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
        <Modal.Body className="text-white" style={{ background: "#24243E" }}>
          {/* HEADER */}
          <h3 className="text-center mb-2" style={{ color: "#ff7272" }}>
            Snapshot Failed
          </h3>
          <p
            className="text-center mb-4"
            style={{ opacity: 0.8, fontSize: "15px" }}
          >
            {errorMessage}
          </p>
          <hr className="border-secondary" />
          {/* SNAPSHOT CARD CONTAINER */}
          <div className="p-3 rounded" style={{ background: "#24243E" }}>
            <div className="p-4 rounded" style={{ background: "#24243E" }}>
              <div
                className={`d-flex justify-content-center align-items-center gap-3
  ${showWarning ? "snapshot-warning-animate" : ""}`}
              >
                {snapshotList.slice(0, 3).map((snap) => (
                  <div
                    key={snap.snapshotid}
                    onClick={() => handleSelectSnapshot(snap.snapshotid)}
                    className="rounded-5 d-flex flex-column justify-content-between"
                    style={{
                      background:
                        selectedSnapshotId === snap.snapshotid
                          ? "#007bff"
                          : "#0E0E23",
                      width: "230px",
                      height: "200px",
                      padding: "10px",
                      cursor: "pointer",
                      boxShadow: "0px 0px 15px rgba(0,0,0,0.25)",
                      transition: "0.2s",
                    }}
                  >
                    <img
                      src={snapicon.src}
                      className="mx-auto"
                      style={{ width: "55px", height: "55px", opacity: 0.9 }}
                    />

                    <h5
                      className="text-center mt-1"
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        lineHeight: "16px",
                        wordBreak: "break-all",
                      }}
                    >
                      {snap.snapshot_name}
                    </h5>

                    <p
                      className="text-center"
                      style={{ fontSize: "11px", opacity: 0.7 }}
                    >
                      Created: {new Date(snap.createdon).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {showWarning && (
            <div
              className="text-center mb-3 rounded"
              style={{
                // background: "#FFE066",
                color: "#FFA500",
                // fontWeight: "600",
                fontSize: "12px",
              }}
            >
              Please select at least one snapshot.
            </div>
          )}

          {/* BUTTONS: CLOSE & SUBMIT */}
          <div className="d-flex justify-content-center gap-3 mt-2">
            {/* CLOSE BUTTON */}
            <button
              className="btn"
              style={{
                background: "#FF4D4D",
                color: "#fff",
                padding: "10px 25px",
                borderRadius: "8px",
                fontSize: "15px",
              }}
              onClick={() => {
                setSelectedSnapshotId(null);
                setShowErrorModal(false);
                setShowWarning(false);
              }}
            >
              Close
            </button>

            {/* SUBMIT BUTTON */}
            <button
              className="btn"
              style={{
                background: "#007bff",
                color: "#fff",
                padding: "10px 25px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
              }}
              onClick={() => {
                const selected = snapshotList.find(
                  (s) => s.snapshotid === selectedSnapshotId
                );
                if (!selected) {
                  setShowWarning(true);
                  return;
                }
                handleDeleteSnapshott(
                  selected.snapshot_name,
                  selected.snapshotid
                );
              }}
            >
              Submit
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
                        <button
                          onClick={handleCreateSnapshot}
                          style={subButtonStyle}
                          title="Snapshot VM"
                        >
                          Snapshot
                        </button>

                        {/* <Button
                          onClick={() => {
                            dispatch(getSnapshot({ vmid: Number(realVmid), vmType }));
                            setShowRollbackModal(true);
                          }}
                          style={subButtonStyle}
                        >
                          Rollback
                        </Button> */}
                        <Button
                          disabled={snapshotApiData.length === 0} // <<✔ disable when no snapshots
                          onClick={() => {
                            if (snapshotApiData.length > 0) {
                              // ✔ only open modal if snapshots exist
                              dispatch(
                                getSnapshot({ vmid: Number(realVmid), vmType })
                              );
                              setShowRollbackModal(true);
                            }
                          }}
                          style={{
                            ...subButtonStyle,
                            opacity: snapshotApiData.length === 0 ? 0.5 : 1, // UI feedback
                            cursor:
                              snapshotApiData.length === 0
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Rollback
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

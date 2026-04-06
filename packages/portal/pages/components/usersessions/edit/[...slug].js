import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import { Button, Card, Row, Col, Modal,OverlayTrigger,Tooltip  } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import {ReactFlow,ReactFlowProvider,addEdge,useNodesState,useEdgesState,Background,Handle,Position,useReactFlow,useUpdateNodeInternals,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "./sidebarFlow";
import EditableEdge from "../../../../shared/data/manipulation/EditableEdge";
import {
  saveScenarioFlow,
  clearsaveScenarioFlow,
} from "../../../../shared/redux/slices/customScenarios/customscenarioManage";
import {getSingleScenarios,getSingleUserSession,addNetworkPort,deleteNetworkPort,saveDraggedComponent,deleteDraggedComponent,clearDraggedComponent,clearDeleteDraggedComponent,clearSaveNetworkPort,clearDeleteNetworkPort,modifyNetworkId,clearModifyNetworkId,plugNetworkPort,unplugNetworkPort,connectNetworkPort,disconnectNetworkPort,changeReleaseEditLock,clearPlugNetworkPort,clearUnplugNetworkPort,clearConnectNetworkPort,clearDisconnectNetworkPort,deletebridge
} from "../../../../shared/redux/slices/usersession/usersessionManage";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import Router, { useRouter } from "next/router";
import {
  clearSingleScenarios,
  getScenarioList,
} from "../../../../shared/redux/slices/customScenarios/customscenarioManage";


const NetworkPopover = ({
  nodeId,
  existingPorts,
  pendingNets,
  handleAddMore,
  handleRemovePendingNet,
  handleAddNetworkPort,
  handleConfirmDelete,
  confirmDelete,
  setConfirmDelete,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const popoverRef = useRef(null);
  // const onAddPort = async (e) => {
  //   e.stopPropagation();
  //   if (!pendingNets.length) return;

  //   try {
  //     setLoading(true);
  //     await handleAddNetworkPort(nodeId, pendingNets.join(","));
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(event.target)
    ) {
      onClose();
    }
  };

  // ✅ USE CAPTURE MODE (3rd param = true)
  document.addEventListener("mousedown", handleClickOutside, true);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside, true);
  };
}, [onClose]);
  const onAddPort = async (e) => {
  e.stopPropagation();
  if (!pendingNets.length) return;

  try {
    setLoading(true);
    await handleAddNetworkPort(nodeId, pendingNets.join(","));

    // ✅ CLOSE POPOVER AFTER SUCCESS
    onClose();

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    setDeleteLoading(true);

    try {
      await handleConfirmDelete(nodeId, confirmDelete.port);
      setConfirmDelete({ open: false, port: null });
    } finally {
      setDeleteLoading(false);
    }
  };
  return (
  <div
   ref={popoverRef}
    style={{
      width: 340,
      background: "linear-gradient(180deg,#0f172a,#0b1220)",
      borderRadius: 18,
      padding: 18,
      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      color: "#e5e7eb",
      fontSize: 13,
      border: "1px solid rgba(255,255,255,0.05)",
    }}
    onMouseDown={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
  >
    {/* HEADER */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600 }}>Manage Ports</div>
      <div
        onClick={onClose}
        style={{ cursor: "pointer", opacity: 0.6, fontSize: 16 }}
      >
        ✕
      </div>
    </div>

    {/* EXISTING PORTS LABEL */}
    <div
      style={{
        fontSize: 11,
        letterSpacing: 1,
        color: "#9cafc9",
        marginBottom: 8,
      }}
    >
      EXISTING PORTS
    </div>

    {/* SCROLL ONLY PORT LIST */}
    <div
      className="existing-scroll"
      style={{
        maxHeight: 150,
        overflowY: "auto",
        paddingRight: 6,
        marginBottom: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {existingPorts.map((port) => (
        <div
          key={port}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.03)",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <span style={{ fontWeight: 500 }}>{port}</span>

          <span
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ open: true, port });
            }}
            style={{
              cursor: "pointer",
              color: "#ef4444",
              fontSize: 14,
              opacity: 0.8,
            }}
          >
            ✕
          </span>
        </div>
      ))}
    </div>

    {/* ✅ CONFIRM DELETE OUTSIDE SCROLL */}
    {confirmDelete?.open && (
      <div
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          Delete <b>{confirmDelete.port}</b> ?
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={deleteLoading}
            onClick={handleDeleteClick}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 10,
              border: "none",
              background: "#ef4444",
              color: "#fff",
              cursor: deleteLoading ? "not-allowed" : "pointer",
              opacity: deleteLoading ? 0.6 : 1,
            }}
          >
            {deleteLoading ? "Deleting..." : "Yes"}
          </button>

          <button
            onClick={() =>
              !deleteLoading &&
              setConfirmDelete({ open: false, port: null })
            }
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            No
          </button>
        </div>
      </div>
    )}

    {/* ---------------- FIXED BELOW ---------------- */}

    {/* PENDING PORTS */}
    {pendingNets.length > 0 && (
      <>
        <div
          style={{
            marginBottom: 8,
            fontSize: 11,
            letterSpacing: 1,
            color: "#a0b0c7",
          }}
        >
          NEW PORTS (PENDING)
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            background: "rgba(37,99,235,0.06)",
            padding: 10,
            borderRadius: 14,
            border: "1px solid rgba(37,99,235,0.15)",
            marginBottom: 16,
          }}
        >
          {pendingNets.map((net) => (
            <div
              key={net}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                background: "rgba(37,99,235,0.15)",
                borderRadius: 20,
                fontSize: 12,
                color: "#60a5fa",
              }}
            >
              {net}
              <span
                onClick={(e) => handleRemovePendingNet(e, net)}
                style={{
                  marginLeft: 6,
                  cursor: "pointer",
                  color: "#ef4444",
                }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>
      </>
    )}

    {/* NEW PORT NUMBER */}
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1,
          color: "#acb8c9",
          marginBottom: 6,
        }}
      >
        NEW PORT NUMBER
      </div>

      <input
        value={pendingNets.join(",")}
        disabled
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "#fff",
          fontSize: 13,
        }}
      />
    </div>

    {/* BUTTONS */}
    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={handleAddMore}
        style={{
          flex: 1,
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        + Add More
      </button>

      <button
        onClick={onAddPort}
        disabled={loading}
        style={{
          flex: 1,
          padding: 10,
          borderRadius: 12,
          border: "none",
          background: "#2563eb",
          color: "#fff",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Adding..." : "Add Port"}
      </button>
    </div>
  </div>
);

};
const blockEvent = (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.nativeEvent) {
    e.nativeEvent.stopImmediatePropagation();
  }
};

const PortActionPopover = ({ data, onClose, runtimeState, actions }) => {
  const { nodeId, portKey } = data;
  const { plugged = true, connected = true } = runtimeState || {};
  const [loading, setLoading] = useState(null);
  const handleAction = async (type, fn, e) => {
    blockEvent(e);
    try {
      setLoading(type);
      await fn(nodeId, portKey); // wait for API
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };
  return (
    <div
      className="port-pop"
      onPointerDown={blockEvent}
      onMouseDown={blockEvent}
      onClick={blockEvent}
      onWheel={blockEvent}
      onContextMenu={blockEvent}
    >
      <div className="header">
        <span>{portKey}</span>
        <span className="close" onClick={onClose}>
          ✕
        </span>
      </div>

      {/* Row 1 */}
      {/* <div className="mb-2">
        {!plugged ? (
          <button
            className="btn plug"
            disabled={loading}
            onPointerUp={(e) => handleAction("plug", actions.plug, e)}
          >
            {loading === "plug" ? (
              <>
                Plugging... <span className="spinneredit" />
              </>
            ) : (
              "Plug"
            )}
          </button>
        ) : (
          <button
            className="btn unplug"
            disabled={loading}
            onPointerUp={(e) => handleAction("unplug", actions.unplug, e)}
          >
            {loading === "unplug" ? (
              <>
                Unpluging... <span className="spinneredit" />
              </>
            ) : (
              "Unplug"
            )}
          </button>
        )}
      </div> */}
      <div className="mb-2">
  {plugged ? (
    <button
      className="btn unplug"
      disabled={loading}
      onPointerUp={(e) => handleAction("unplug", actions.unplug, e)}
    >
      {loading === "unplug" ? (
        <>
          Unpluging... <span className="spinneredit" />
        </>
      ) : (
        "Unplug"
      )}
    </button>
  ) : (
    <button
      className="btn plug"
      disabled={loading}
      onPointerUp={(e) => handleAction("plug", actions.plug, e)}
    >
      {loading === "plug" ? (
        <>
          Plugging... <span className="spinneredit" />
        </>
      ) : (
        "Plug"
      )}
    </button>
  )}
</div>

      {/* Row 2 */}
      {/* <div className="mb-2">
        {!connected ? (
          <button
            className="btn connect"
            disabled={loading}
            onPointerUp={(e) => handleAction("connect", actions.connect, e)}
          >
            {loading === "connect" ? (
              <>
                Conncting... <span className="spinneredit" />
              </>
            ) : (
              "Connect"
            )}
          </button>
        ) : (
          <button
            className="btn disconnect"
            disabled={loading}
            onPointerUp={(e) =>
              handleAction("disconnect", actions.disconnect, e)
            }
          >
            {loading === "disconnect" ? (
              <>
                Disconnecting... <span className="spinneredit" />
              </>
            ) : (
              "Disconnect"
            )}
          </button>
        )}
      </div> */}
<div className="mb-2">
  {connected ? (
    <button
      className="btn disconnect"
      disabled={loading}
      onPointerUp={(e) =>
        handleAction("disconnect", actions.disconnect, e)
      }
    >
      {loading === "disconnect" ? (
        <>
          Disconnecting... <span className="spinneredit" />
        </>
      ) : (
        "Disconnect"
      )}
    </button>
  ) : (
    <button
      className="btn connect"
      disabled={loading}
      onPointerUp={(e) => handleAction("connect", actions.connect, e)}
    >
      {loading === "connect" ? (
        <>
          Conncting... <span className="spinneredit" />
        </>
      ) : (
        "Connect"
      )}
    </button>
  )}
</div>
      {/* Row 3 */}
      {/* <button className="btn advanced">⚙ Advanced Options</button> */}

      <style jsx>{`
        .port-pop {
          min-width: 250px;
          background: #171a2f;
          border: 1px solid #2a2f4a;
          border-radius: 14px;
          padding: 14px;
          color: #e6e9ff;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65);
        }

        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-weight: 600;
          color: #ffffff;
        }

        .row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .btn {
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.18s ease;
        }

        .plug {
          width: 100%;
          background: #3a3f66;
        }
        .plug:hover {
          background: #4a5080;
        }

        .unplug {
          width: 100%;
          background: #3a3f66;
        }
        .unplug:hover {
          background: #4a5080;
        }

        .connect {
          width: 100%;
          background: #3a3f66;
        }
        .connect:hover {
          background: #4a5080;
        }

        .disconnect {
          width: 100%;
          background: #3a3f66;
        }
        .disconnect:hover {
          background: #4a5080;
        }

        .advanced {
          width: 100%;
          background: #3a3f66;
        }
        .advanced:hover {
          background: #4a5080;
        }

        .btn:disabled {
          background: #2a2f4a;
          color: #7b84b6;
          cursor: not-allowed;
        }

        .close {
          cursor: pointer;
          color: #9aa3d4;
        }
        .close:hover {
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

const DnDFlow = ({
  numLans,
  toBeDragComponent,
  scenarioId,
  setView,
  selectedScenario,
}) => {
  const pollingRef = useRef(null);
  const dispatch = useDispatch();
  const reactFlowWrapper = useRef(null);
  const [imageNodeData, setImageNodeData] = useState([]); // sidebar data
  const [initialNodes, setInitialNodes] = useState(() => {
    const nodesArray = [];
    return nodesArray;
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [draggedNode, setDraggedNode] = useState(null);
  const [droppedImages, setDroppedImages] = useState([]); // Track dropped images
  const [drggerdComponent, setDraggedComponent] = useState([]);
  const { query, push } = useRouter();
  const router = useRouter();
  const [rowId, setRowId] = useState("");
  const [activePopover, setActivePopover] = useState(null);
  const [pendingNets, setPendingNets] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    port: null,
  });
  const [portPopover, setPortPopover] = useState(null);
  const [connectPopover, setConnectPopover] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);

  // Modals
  const [showCloneProgress, setShowCloneProgress] = useState(false);
  const [vmStep, setVmStep] = useState("Cloning");
  const [showStopDestroyModal, setShowStopDestroyModal] = useState(false);
  const [stopStep, setStopStep] = useState("Stopping");
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [portRuntimeState, setPortRuntimeState] = useState({});
  const [hydrated, setHydrated] = useState(false);


    const [loadingScenario, setLoadingScenario] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem("portRuntimeState");

    if (saved) {
      setPortRuntimeState(JSON.parse(saved));
    }

    setHydrated(true);
  }, []);
  useEffect(() => {
    const theme = localStorage.getItem("theme_preference");

    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, []);
    const refreshScenario = async () => {
    setLoadingScenario(true);
    try {
      await dispatch(getSingleUserSession(query.slug[0]));
    } finally {
      setLoadingScenario(false);
    }
  };

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
  const ImageNode = ({ id, data, isConnectable, deleteNode, openPopover }) => {
    const getPortColor = (portKey) => {
      const state = portRuntimeState?.[`${id}-${portKey}`];
      if (!state) return "#2F80ED";
      return state.plugged ? "#2F80ED" : "#ff0000";
    };
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
    const [showPopover, setShowPopover] = useState(false);
    const existingPorts = Array.isArray(data.networkport)
      ? data.networkport.flatMap((obj) => Object.keys(obj))
      : [];
    const getNextNetName = (ports = []) => {
      const nums = ports
        .flatMap((obj) => Object.keys(obj))
        .map((k) => parseInt(k.replace("net", ""), 10))
        .filter((n) => !isNaN(n));
      return `net${nums.length ? Math.max(...nums) + 1 : 0}`;
    };
    const nextNet = getNextNetName(data.networkport);
    useEffect(() => {
      if (showPopover) {
        setPendingNets(nextNet ? [nextNet] : []);
      }
    }, [nextNet]);
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
                style={{width: nodeSize,height: nodeSize,position: "relative",borderRadius: "8px",border: "2px solid #ccc",display: "flex",alignItems: "center",justifyContent: "center",boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tooltip-${id}`}>Add/Delete Node</Tooltip>}
      >
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            openPopover(id, {
              x: e.clientX,
              y: e.clientY,
            });
          }}
          style={{ position: "absolute", top: 6, left: 6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0, 123, 255, 0.15)", color: "#3f89ff", fontSize: 14, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)", transition: "all 0.2s ease", zIndex: 10,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0, 123, 255, 0.25)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(0, 123, 255, 0.15)")
          }
        >
          +
        </button>
      </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id={`delete-tooltip-${id}`}>Stop & Destroy VM</Tooltip>}
                >
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                
                      Swal.fire({
                        title: "Are you sure?",
                        html: `
                          Do you really want to <b>Stop & Destroy</b> this VM?<br/><br/>
                          <span style="color:#dc3545;">
                            This will remove it from the scenario diagram.
                          </span>
                        `,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#dc3545",
                        cancelButtonColor: "#6c757d",
                        confirmButtonText: "Yes, Stop & Destroy",
                        cancelButtonText: "Cancel",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          deleteNode(id);
                        }
                      });
                    }}
                    style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(220, 53, 69, 0.15)", color: "#ff2828", fontSize: 14, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)", transition: "all 0.2s ease", zIndex: 10,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(220, 53, 69, 0.25)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "rgba(220, 53, 69, 0.15)")
                    }
                  >
                    ×
                  </button>
                </OverlayTrigger>
                <div
                  style={{width: nodeSize * 0.6,height: nodeSize * 0.6,backgroundImage: `url("${resolveImageUrl(data.image)}")`,backgroundSize: "contain",backgroundPosition: "center",backgroundRepeat: "no-repeat",
                  }}
                />
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
                  const baseHandleStyle = {position: "absolute",width: 10,height: 10,borderRadius: "50%",background: "#005eff",border: "1px solid white",zIndex: 2,
                  };
                  const labelStyle = {position: "absolute",fontSize: 6,padding: "1px 3px",whiteSpace: "nowrap",zIndex: 5,
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
                        onMouseDown={(e) => onHandleMouseDown(e, port.key, id)}
                        // style={handleStyle}
                        style={{ ...handleStyle, background: getPortColor(port.key) }}
                        // isConnectable={isConnectable}
                      />
      
                      <Handle
                        type="target"
                        position={Position[side]}
                        id={`${port.key}-target`}
                        onMouseDown={(e) => onHandleMouseDown(e, port.key, id)}
                        // style={handleStyle}
                        style={{ ...handleStyle, background: getPortColor(port.key) }}
                        // isConnectable={isConnectable}
                      />
      
                      <div style={labelPosition}>{port.label}</div>
                    </React.Fragment>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontSize: 10,
                  textAlign: "center",
                  width: "100%",
                }}
              >
                {data.label || "Unnamed"}
              </div>
            </div>
    );
  };
  const idRef = useRef(0);
  const { saveScenarioFlowChart, getScenarioFlowchart } = useSelector(
    (state) => ({
      saveScenarioFlowChart: state?.customScenario?.saveflowchartData,
      getScenarioFlowchart:
        state &&
        state.scenarioManage &&
        state.scenarioManage.singleScenarios &&
        state.scenarioManage.singleScenarios.data,
    }),
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
  const getSingleScenariosSucc = useSelector(
    (state) => state?.usersessionManage?.singleUserSession?.data,
  );
    const bridgeremove = useSelector((state) => state?.usersessionManage?.gethasdeletebridge);
  
  const addDraggedCompSucc = useSelector(
    (state) => state?.usersessionManage?.saveDraggedComponentData?.data,
  );
  const deleteDraggedCompSucc = useSelector(
    (state) => state?.usersessionManage?.deleteDraggedComponentData?.data,
  );
  const addNetwork = useSelector((state) => state?.usersessionManage?.addNetwork?.data);

  const removeNetwork = useSelector(
    (state) => state?.usersessionManage?.deleteNetwork?.data,
  );
  const addNetwordId = useSelector(
    (state) => state?.usersessionManage?.modifyNetworkIdData?.data,
  );
  const plugNetwork = useSelector(
    (state) => state?.usersessionManage?.plugNetworkPort?.data,
  );
  const unplugNetwork = useSelector(
    (state) => state?.usersessionManage?.unplugNetworkPort?.data,
  );
  const connectNetwork = useSelector(
    (state) => state?.usersessionManage?.connectNetworkPort?.data,
  );
  const disconnectNetwork = useSelector(
    (state) => state?.usersessionManage?.disconnectNetworkPort?.data,
  );

  const scenario = getSingleScenariosSucc?.[0] || null;

  const parsedDiagram = useMemo(() => {
    if (!scenario?.scenariodiagram) return null;
    try {
      return typeof scenario.scenariodiagram === "string"
        ? JSON.parse(scenario.scenariodiagram)
        : scenario.scenariodiagram;
    } catch (err) {
      console.error("Failed to parse scenariodiagram", err);
      return null;
    }
  }, [scenario?.scenariodiagram]);
  const scenarioNodes = parsedDiagram?.nodes || [];
  
  useEffect(() => {
    if (query.slug) {
      setRowId(query.slug[0]);
      // dispatch(getSingleScenarios(query.slug[0]));
      dispatch(getSingleUserSession(query.slug[0]));
      // refreshScenario();
    }
  }, [query.slug]);
    const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
  if (!scenario?.scenariodiagram) return;

  try {
    const parsedData =
      typeof scenario.scenariodiagram === "string"
        ? JSON.parse(scenario.scenariodiagram)
        : scenario.scenariodiagram;

    const newNodes = parsedData.nodes || [];

    setNodes(newNodes);
    setEdges([]);

    requestAnimationFrame(() => {
      // update ALL node internals (handles)
      newNodes.forEach((node) => {
        updateNodeInternals(node.id);
      });
      // then set edges
      setEdges(parsedData.edges || []);
    });
  } catch (err) {
    console.error("Invalid scenariodiagram JSON", err);
  }
}, [scenario]);

  const diagram = useMemo(() => {
    if (!scenario?.scenariodiagram) return null;
    return JSON.parse(scenario.scenariodiagram);
  }, [scenario]);
  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      "portRuntimeState",
      JSON.stringify(portRuntimeState)
    );

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          portRuntimeState,
        },
      }))
    );
  }, [portRuntimeState, hydrated]);

  useEffect(() => {
    const saved = localStorage.getItem("portRuntimeState");
    if (saved) {
      setPortRuntimeState(JSON.parse(saved));
    }
  }, []);
  const nodeMap = useMemo(() => {
    if (!diagram?.nodes) return {};

    const map = {};
    diagram.nodes.forEach((n) => {
      map[n.id] = {
        vmid: n.data.vmid,
        vmType: n.data.vmType,
        networkport: n.data.networkport,
      };
    });
    return map;
  }, [diagram]);
  const getNetKey = (handle) => handle?.split("-")[0];
//   const buildNetworkPayload = (type) => {
//     if (!pendingConnection) return null;

//     const sourceNode = nodeMap[pendingConnection.source];
//     const targetNode = nodeMap[pendingConnection.target];
// console.log("sourceNodesourceNodesourceNode",sourceNode);

//     if (!sourceNode || !targetNode) return null;

//     const netKey = getNetKey(pendingConnection.sourceHandle);

//     let payload = {
//       vmid: sourceNode.vmid,
//       vmType: sourceNode.vmType,
//       netKey,
//       mode: type,
//       source: pendingConnection.source,
//       sourceHandle: pendingConnection.sourceHandle,
//       target: pendingConnection.target,
//       targetHandle: pendingConnection.targetHandle,
//     };
//     // LABEL RULES
//     if (type === "static") {
//       payload.label = "Network Id";
//     }
//     if (type === "existing") {
//       payload.label = connectPopover?.existingNetwork || null;
//     }
//     return payload;
//   };

const buildNetworkPayload = (type, staticValue) => {
  if (!pendingConnection) return null;

  const sourceNode = nodeMap[pendingConnection.source];
  const targetNode = nodeMap[pendingConnection.target];

  if (!sourceNode || !targetNode) return null;

  const netKey = getNetKey(pendingConnection.sourceHandle);

  let payload = {
    vmid: sourceNode.vmid,
    Targetvmid: targetNode.vmid,
    vmType: sourceNode.vmType,
    netKey,
    mode: type,
    source: pendingConnection.source,
    sourceHandle: pendingConnection.sourceHandle,
    target: pendingConnection.target,
    targetHandle: pendingConnection.targetHandle,
  };

  // ONLY CHANGE HERE
  if (type === "static") {
    payload.label = staticValue || "Network Id";
    payload.staticVmbr = staticValue || null;
  }

  if (type === "existing") {
    payload.label = connectPopover?.existingNetwork || null;
  }

  return payload;
};

  const [dragStart, setDragStart] = useState(null);
  const onConnectStart = useCallback((event, params) => {
     connectingRef.current = true;
    setDragStart({
      nodeId: params.nodeId,
      handleId: params.handleId,
    });
  }, []);

  const clickTimer = useRef(null);
  const isDragging = useRef(false);

  // const onHandleMouseDown = (event, portKey, nodeId) => {
  //   event.stopPropagation();
  //   isDragging.current = false;
  //   const startX = event.clientX;
  //   const startY = event.clientY;
  //   const moveListener = (e) => {
  //     if (
  //       Math.abs(e.clientX - startX) > 5 ||
  //       Math.abs(e.clientY - startY) > 5
  //     ) {
  //       isDragging.current = true;
  //     }
  //   };
  //   document.addEventListener("mousemove", moveListener);
  //   clickTimer.current = setTimeout(() => {
  //     document.removeEventListener("mousemove", moveListener);
  //     if (!isDragging.current) {
  //       setPortPopover({
  //         nodeId,
  //         portKey,
  //         x: startX,
  //         y: startY,
  //       });
  //     }
  //   }, 160); // <-- MAGIC NUMBER (must be small)
  // };
const onHandleMouseDown = (event, portKey, nodeId) => {
  event.stopPropagation();

  isDragging.current = false;

  const startX = event.clientX;
  const startY = event.clientY;

  // ✅ SAVE element reference BEFORE timeout
  const targetElement = event.currentTarget;

  const moveListener = (e) => {
    if (
      Math.abs(e.clientX - startX) > 5 ||
      Math.abs(e.clientY - startY) > 5
    ) {
      isDragging.current = true;
    }
  };

  document.addEventListener("mousemove", moveListener);

  clickTimer.current = setTimeout(() => {
    document.removeEventListener("mousemove", moveListener);

    if (!isDragging.current && targetElement) {
      const rect = targetElement.getBoundingClientRect();

      setPortPopover({
        nodeId,
        portKey,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, 160);
};
  
  
  const onConnect = useCallback(
    (params) => {
      let corrected = { ...params };
      if (dragStart && params.target === dragStart.nodeId) {
        corrected = {
          ...params,
          source: params.target,
          sourceHandle: params.targetHandle,
          target: params.source,
          targetHandle: params.sourceHandle,
        };
      }
      const sourceEdge = edges.find(
        (e) =>
          (e.source === corrected.source || e.target === corrected.source) &&
          e.data?.label,
      );
      const targetEdge = edges.find(
        (e) =>
          (e.source === corrected.target || e.target === corrected.target) &&
          e.data?.label,
      );
      const hasTargetLink = edges.some(
        (e) =>
          (e.source === corrected.target || e.target === corrected.target) &&
          e.data?.label
      );
      const hasSourceLink = edges.some(
        (e) =>
          (e.source === corrected.source || e.source === corrected.source) &&
          e.data?.label
      );
      //  normalize handle types (THIS WAS MISSING)
      corrected.sourceHandle = normalizeHandle(
        corrected.sourceHandle,
        "source",
      );
      corrected.targetHandle = normalizeHandle(
        corrected.targetHandle,
        "target",
      );
      // const existingNetwork = sourceEdge?.data?.label || null;
      // const options = ["static", "existing", "new"];
        const existingNetwork =
  sourceEdge?.data?.label || targetEdge?.data?.label || null;
      // const options = ["static", "existing", "new"];
      let options = [];
if (existingNetwork) {
  // FORCE existing if already available
  options = ["existing"];
} else if (!hasSourceLink && !hasTargetLink) {
  options = ["static", "new"];
} else if (hasSourceLink && hasTargetLink) {
  options = ["static", "existing"];
} else {
  options = ["existing"];
}
      const handleEl = document.querySelector(
        `.react-flow__handle[data-nodeid="${corrected.target}"][data-handleid="${corrected.targetHandle}"]`,
      );
      let pos = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };

      if (handleEl) {
        const rect = handleEl.getBoundingClientRect();
        pos = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      setPendingConnection(corrected);

      setConnectPopover({
        x: pos.x,
        y: pos.y,
        options,
        existingNetwork,
      });
    },
    [edges, dragStart],
  );
//  const ConnectionPopover = ({ data, onSelect, onClose }) => {
//       const popoverRef = useRef(null);
//     const labelMap = {
//       static: "Static Network",
//       existing: "Use Existing Network",
//       new: "Create New Network",
//     };
//       useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         popoverRef.current &&
//         !popoverRef.current.contains(event.target)
//       ) {
//         onClose(); // close popover
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [onClose]);


//     return (
//       <div
//        ref={popoverRef}
//         id="connection-popover"
//         style={{
//           minWidth: 200,
//           background: "linear-gradient(145deg,#141428,#1c1c3a)",
//           border: "1px solid rgba(255,255,255,0.12)",
//           borderRadius: 14,
//           padding: 14,
//           boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
//           color: "#fff",
//           // transform: "translate(-50%, -120%)",
//           animation: "popIn 0.18s ease-out",
//           position: "relative",
//         }}
//       >
//         {/* Close Button */}
//         <div
//         onClick={onClose}
//         style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: "50%", zIndex: 10, pointerEvents: "auto",
//         }}
//         >
//         ✕
//         </div>

//         <div
//           style={{
//             fontSize: 12,
//             marginBottom: 12,
//             opacity: 0.75,
//             fontWeight: 600,
//             textAlign: "center",
//           }}
//         >
//           Choose Network Type
//         </div>

//         {data.options.map((opt) => (
//           <div
//             key={opt}
//             onClick={() => {
//               onSelect(opt);
//               onClose();
//             }}
//             style={{
//               padding: "10px 12px",
//               borderRadius: 10,
//               cursor: "pointer",
//               marginBottom: 8,
//               background: "#202048",
//               transition: "0.15s",
//               fontSize: 12,
//               textAlign: "center",
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = "#2d2d66")}
//             onMouseLeave={(e) => (e.currentTarget.style.background = "#202048")}
//           >
//             {labelMap[opt]}
//           </div>
//         ))}
//       </div>
//     );
//   };

const ConnectionPopover = ({ data, onSelect, onClose }) => {
  console.log("onSelectonSelectonSelectonSelect",data);
  
  const popoverRef = useRef(null);

  const [selectedType, setSelectedType] = useState(null);
  const [staticInput, setStaticInput] = useState("");

  const isValidVmbr = (val) => {
    if (!val) return true;
    const match = val.match(/^vmbr(\d+)$/);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    return num >= 50 && num <= 999;
  };
      // const popoverRef = useRef(null);
    const labelMap = {
      static: "Static Network",
      existing: "Use Existing Network",
      new: "Create New Network",
    };
    useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        onClose(); // close popover
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
const iconMap = {
  static: <i className="fe fe-link" />,
  existing: <i className="fe fe-refresh-cw" />,
  new: <i className="fe fe-plus-circle" />,
};

  return (
    <div
      ref={popoverRef}
      style={{ width: 320, background: "linear-gradient(180deg,#0b1220,#0f1b2e)", borderRadius: 16, padding: 16, color: "#fff", boxShadow: "0 25px 50px rgba(0,0,0,0.6)", position: "relative",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          Choose Network Type
        </div>
        <div
          onClick={onClose}
          style={{ cursor: "pointer", opacity: 0.7 }}
        >
          ✕
        </div>
      </div>

      {/* SECTION LABEL */}
      <div
        style={{ fontSize: 10, opacity: 0.6, marginTop: 12, marginBottom: 9, letterSpacing: 1,}}
      >
        DEPLOYMENT MODE
      </div>

      {/* STATIC NETWORK BUTTON */}
      {data.options.includes("static") && (
        <div
  onClick={() => setSelectedType("static")}
  style={{
    padding: "12px",
    borderRadius: 10,
    background:
      selectedType === "static"
        ? "rgba(80,200,120,0.15)"
        : "#162235",
    cursor: "pointer",
    marginBottom: 10,
    border:
      selectedType === "static"
        ? "1px solid #4ade80"
        : "1px solid transparent",
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}
>
  <span>{iconMap.static}</span>
  <span>Static Network</span>
</div>
      )}

      {/* INPUT FIELD (ONLY WHEN STATIC CLICKED) */}
      {selectedType === "static" && (
        <>
          <div
            style={{ fontSize: 10, opacity: 0.6, marginBottom: 6, letterSpacing: 1,
            }}
          >
            BRIDGE RANGE IDENTIFIER
          </div>

          <div
            style={{ display: "flex", alignItems: "center", background: "#0b1220", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 14,
            }}
          >
            <input
              type="text"
              placeholder="vmbr50 - vmbr999"
              value={staticInput}
              onChange={(e) => setStaticInput(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 12,
              }}
            />
            <span
              style={{ fontSize: 9, background: "#1f3b2d", color: "#4ade80", padding: "3px 6px", borderRadius: 6,
              }}
            >
              RANGE
            </span>
          </div>
        </>
      )}

        {data.options
  .filter((opt) => opt !== "static")
  .map((opt) => (
    <div
      key={opt}
      onClick={() => {
        onSelect(opt);
        onClose();
      }}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "#162235",
        cursor: "pointer",
        marginBottom: 8,
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{iconMap[opt]}</span>

      <span>
        {opt === "existing"
          ? "Use Existing Network"
          : "Create New Network"}
      </span>
    </div>
  ))}

      {/* SUBMIT BUTTON */}
      {selectedType === "static" && (
        <div
          onClick={() => {
            if (!isValidVmbr(staticInput)) {
              // alert("Enter valid vmbr (700–1000)");
              toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
              Enter valid vmbr (50–999)
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: false,
              theme: "colored",
            },
          );
              return;
            }

            onSelect("static", staticInput);
            onClose();
          }}
          style={{
            marginTop: 10,
            padding: "12px",
            borderRadius: 10,
            textAlign: "center",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            background: "linear-gradient(90deg,#34d399,#22c55e)",
            color: "#000",
          }}
        >
          Submit Node
        </div>
      )}
    </div>
  );
};
  // const handleConnectionType = async (type) => {
  //   if (!pendingConnection) return;
  //   const connection = { ...pendingConnection };
  //   const apiPayload = buildNetworkPayload(type,staticValue);
  //   try {
  //     setShowBridgeModal(true);
  //     setBridgeLoading(true);
  //     await dispatch(modifyNetworkId(apiPayload));
  //     // ---------------- EDGE LABEL ----------------
  //     let label = "";
  //     if (type === "static") label = "Network Id";
  //     if (type === "existing") label = connectPopover?.existingNetwork || "";
  //     if (type === "new") label = "";
  //     const newEdge = {
  //       id: `e-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}-${Date.now()}`,
  //       source: connection.source,
  //       sourceHandle: connection.sourceHandle,
  //       target: connection.target,
  //       targetHandle: connection.targetHandle,
  //       type: "custom",
  //       data: { label },
  //     };
  //     // setEdges((eds) => addEdge(newEdge, eds));
  //     // ✅ CLOSE MODAL AFTER SHORT DELAY
  //     setTimeout(() => {
  //       setShowBridgeModal(false);
  //       setBridgeLoading(false);
  //     }, 1200);

  //     // cleanup
  //     setPendingConnection(null);
  //     setConnectPopover(null);
  //     setDragStart(null);
  //   } catch (err) {
  //     console.error(err);
  //     setShowBridgeModal(false);
  //     setBridgeLoading(false);
  //   }
  // };


    const handleConnectionType = async (type,staticValue = null) => {
      console.log("typetypetypetypetypetypetype",type);
      
      if (!pendingConnection) return;
      const connection = { ...pendingConnection };
      const apiPayload = buildNetworkPayload(type,staticValue);
      try {
        setShowBridgeModal(true);
        setBridgeLoading(true);
        await dispatch(modifyNetworkId(apiPayload));
        // ---------------- EDGE LABEL ----------------
        let label = "";
        // if (type === "static") label = "Network Id";
        if (type === "static") label = staticValue || "Network Id";
        if (type === "existing") label = connectPopover?.existingNetwork || "";
        if (type === "new") label = "";
        const newEdge = {
          id: `e-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}-${Date.now()}`,
          source: connection.source,
          sourceHandle: connection.sourceHandle,
          target: connection.target,
          targetHandle: connection.targetHandle,
          type: "custom",
          data: { label },
        };
        // setEdges((eds) => addEdge(newEdge, eds));
        setTimeout(() => {
          setShowBridgeModal(false);
          setBridgeLoading(false);
        }, 200);
  
        // cleanup
        setPendingConnection(null);
        setConnectPopover(null);
        setDragStart(null);
      } catch (err) {
        console.error(err);
        setShowBridgeModal(false);
        setBridgeLoading(false);
      }
    };
  const normalizeHandle = (handle, expectedType) => {
    if (!handle) return handle;
    const [port, type] = handle.split("-");
    if (expectedType === "source" && type === "target") return `${port}-source`;
    if (expectedType === "target" && type === "source") return `${port}-target`;
    return handle;
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  const connectingRef = useRef(false);
  const onConnectEnd = () => {
  connectingRef.current = false;
};
  const onDrop = useCallback(
    (event) => {
      setShowCloneProgress(true);
      setVmStep("Cloning");

      event.preventDefault();
      connectingRef.current = false;
      document.dispatchEvent(new MouseEvent("mouseup"));
      let id = `dndnode_${0 + 1}`;
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
        id: `dndnode_${number + 1}`,
        type: "imageNode",
        position,
        data: {
          image: draggedNode.imageUrl,
          label: draggedNode.label,
          vmid: draggedNode.vmid,
          vmType: (draggedNode.vmType).toLowerCase(), // fallback
          componentId: draggedNode.componentid,
          networkport: draggedNode.networkport,
          duration: draggedNode.duration,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setDraggedComponent((prev) => [...prev, draggedNode]);
      setDroppedImages((prev) => [...prev, draggedNode.id]); // Add to dropped images
      const payload = {
        vmrequestid: scenario.vmrequestid,
        scenarioid: scenario.scenarioid,
        requestedby_id: scenario.requestedby_id,
        newNode,
      };
      dispatch(saveDraggedComponent(payload))
        .then(() => {
          setVmStep("Starting");
          setTimeout(() => {
            setShowCloneProgress(false);
          }, 3000);
        })
        .catch(() => {
          setShowCloneProgress(false);
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
              Clone failed
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: false,
              theme: "colored",
            },
          );
        });
    },
    [
      screenToFlowPosition,
      draggedNode,
      droppedImages,
      nodes,
      scenario,
      dispatch,
    ],
  );
  // const deleteNode = async (nodeId) => {
  //   const nodeToDelete = nodes.find((node) => node.id === nodeId);
  //   if (!nodeToDelete) return;
  //   const vmid = nodeToDelete?.data?.vmid;
  //   const vmrequestid = scenario?.vmrequestid;
  //   try {
  //     setShowStopDestroyModal(true);
  //     setStopStep("Stopping");
  //     if (vmid && vmrequestid) {
  //       await dispatch(deleteDraggedComponent({ vmid, vmrequestid }));
  //     }
  //     setStopStep("Destroying");
  //     setTimeout(() => {
  //       setShowStopDestroyModal(false);
  //     }, 2000);
  //     setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  //     setEdges((eds) =>
  //       eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  //     );
  //     if (nodeToDelete?.data?.componentId) {
  //       const imageComponent = nodeToDelete.data.componentId;
  //       const imageNode = imageNodeData.find(
  //         (item) => item.id === imageComponent,
  //       );

  //       if (imageNode) {
  //         const imageId = imageNode.id;

  //         setDroppedImages((prev) => prev.filter((id) => id !== imageId));
  //         setDraggedComponent((prev) =>
  //           prev.filter((item) => item.id !== imageId),
  //         );
  //         setImageNodeData((prev) =>
  //           prev.filter((item) => item.id !== imageId),
  //         );
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Delete VM failed", err);
  //     setShowStopDestroyModal(false);
  //   }
  // };


const deleteNode = async (nodeId) => {
  const nodeToDelete = nodes.find((node) => node.id === nodeId);
  if (!nodeToDelete) return;

  const vmid = nodeToDelete?.data?.vmid;
  const vmrequestid = scenario?.vmrequestid;
  const vmbrList = edges
    .filter(
      (e) => e.source === nodeId || e.target === nodeId
    )
    .map((e) => e?.data?.label)
    .filter(Boolean);
  try {
    setShowStopDestroyModal(true);
    setStopStep("Stopping");

    if (vmid && vmrequestid) {
      await dispatch(
        deleteDraggedComponent({
          vmid,
          vmrequestid,
          vmbrList,
        })
      );
    }

    setStopStep("Destroying");

    setTimeout(() => {
      setShowStopDestroyModal(false);
    }, 100);

    setNodes((nds) => nds.filter((node) => node.id !== nodeId));

    setEdges((eds) =>
      eds.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      )
    );

  } catch (err) {
    console.error("Delete VM failed", err);
    setShowStopDestroyModal(false);
  }
};

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const getStepClass = (step) => {
    if (vmStep === step) return "text-warning";
    if ((vmStep === "Starting" && step === "Cloning") || vmStep === "Running")
      return "text-success";

    return "text-muted";
  };
  const getStopStepClass = (step) => {
    if (stopStep === step) return "text-warning";
    if (stopStep === "Destroying" && step === "Stopping") return "text-success";
    return "text-muted";
  };

  const getNodePortKeys = (node) => {
    if (!node?.data?.networkport) return [];
    return node.data.networkport.flatMap((obj) => Object.keys(obj));
  };
  const buildPayload = (nodeId, portKey) => {
    const node = scenarioNodes.find((n) => n.id === nodeId);
    if (!node) {
      return null;
    }
    const payload = {
      vmrequestid: scenario?.vmrequestid,
      vmid: node?.data?.vmid,
      netKey: portKey,
    };
    return payload;
  };
  const plugHandler = async (nodeId, portKey) => {
    const payload = buildPayload(nodeId, portKey);
    if (!payload) return;

    const res = await dispatch(plugNetworkPort(payload));
    const ok =
      res?.data?.data?.statusCode === 200 ||
      res?.data?.data?.statusCode === 200;
    if (ok) {
      setPortRuntimeState((prev) => ({
        ...prev,
        [`${nodeId}-${portKey}`]: { plugged: true, connected: false },
      }));

      setPortPopover(null);
    }
  };

  const unplugHandler = async (nodeId, portKey) => {
    const res = await dispatch(
      unplugNetworkPort(buildPayload(nodeId, portKey)),
    );

    const ok =
      res?.data?.data?.statusCode === 200 ||
      res?.data?.data?.statusCode === 200;

    if (ok) {
      setPortRuntimeState((prev) => ({
        ...prev,
        [`${nodeId}-${portKey}`]: { plugged: false, connected: false },
      }));
      setPortPopover(null);
    }
  };

  const connectHandler = async (nodeId, portKey) => {
    const res = await dispatch(
      connectNetworkPort(buildPayload(nodeId, portKey)),
    );
    const ok =
      res?.data?.data?.statusCode === 200 ||
      res?.data?.data?.statusCode === 200;
    if (ok) {
      setPortRuntimeState((prev) => ({
        ...prev,
        [`${nodeId}-${portKey}`]: { plugged: true, connected: true },
      }));
      setPortPopover(null);
    }
  };

  const disconnectHandler = async (nodeId, portKey) => {
    const res = await dispatch(
      disconnectNetworkPort(buildPayload(nodeId, portKey)),
    );
    const ok =
      res?.data?.data?.statusCode === 200 ||
      res?.data?.data?.statusCode === 200;
    if (ok) {
      setPortRuntimeState((prev) => ({
        ...prev,
        [`${nodeId}-${portKey}`]: { plugged: false, connected: false },
      }));
      setPortPopover(null);
    }
  };

  useEffect(() => {
    if (!portPopover) return;
    const close = () => setPortPopover(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [portPopover]);

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
      flowchartData.edges,
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
      approval_status: status === "SaveAsDraft" ? "Draft" : "Pending",
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
        },
      );
      dispatch(clearsaveScenarioFlow());
      dispatch(clearSingleScenarios());
      dispatch(getScenarioList());
      // setNodes([]);
      // setEdges([]);
    }
  }, [saveScenarioFlowChart]);
  useEffect(() => {
    if (addDraggedCompSucc?.statusCode === 200) {
      // toast.success(
      //   <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
      //     {addDraggedCompSucc?.message}
      //   </p>,
      //   {
      //     position: toast.POSITION.TOP_RIGHT,
      //     hideProgressBar: false,
      //     theme: "colored",
      //   },
      // );
      
      dispatch(clearDraggedComponent());
      dispatch(getSingleUserSession(query.slug[0]));
      // refreshScenario();
      // dispatch(getScenarioList());
      // setNodes([]);
      // setEdges([]);
    }
  }, [addDraggedCompSucc]);
  useEffect(() => {
    if (deleteDraggedCompSucc?.statusCode === 200) {
      // toast.success(
      //   <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
      //     {deleteDraggedCompSucc?.message}
      //   </p>,
      //   {
      //     position: toast.POSITION.TOP_RIGHT,
      //     hideProgressBar: false,
      //     theme: "colored",
      //   },
      // );
      dispatch(clearDeleteDraggedComponent());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [deleteDraggedCompSucc]);
  useEffect(() => {
    if (addNetwork?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addNetwork?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearSaveNetworkPort());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [addNetwork]);

useEffect(() => {
    if (bridgeremove?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {bridgeremove?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearSaveNetworkPort());
      // dispatch(getSingleScenarios(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [bridgeremove]);

  useEffect(() => {
    if (removeNetwork?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {removeNetwork?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearDeleteNetworkPort());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [removeNetwork]);
  useEffect(() => {
    if (addNetwordId?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addNetwordId?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearModifyNetworkId());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [addNetwordId]);
  useEffect(() => {
    if (plugNetwork?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {plugNetwork?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearPlugNetworkPort());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [plugNetwork]);
  useEffect(() => {
    if (unplugNetwork?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {unplugNetwork?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearUnplugNetworkPort());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [unplugNetwork]);
  useEffect(() => {
    if (connectNetwork?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {connectNetwork?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearConnectNetworkPort());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [connectNetwork]);
  useEffect(() => {
    if (disconnectNetwork?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {disconnectNetwork?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearDisconnectNetworkPort());
      // dispatch(getSingleUserSession(query.slug[0]));
      refreshScenario();
      // setNodes([]);
      // setEdges([]);
    }
  }, [disconnectNetwork]);

  const nodeTypes = useMemo(
    () => ({
      imageNode: (props) => (
        <ImageNode
          {...props}
          deleteNode={deleteNode}
          openPopover={(nodeId, anchor) => setActivePopover({ nodeId, anchor })}
        />
      ),
    }),
    [deleteNode],
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
  const activeNode = nodes.find((n) => n.id === activePopover?.nodeId);

  const existingPorts = useMemo(() => {
    if (!activeNode?.data?.networkport) return [];
    return activeNode.data.networkport.flatMap((obj) => Object.keys(obj));
  }, [activeNode]);

  const getNextNetName = (ports = []) => {
    const nums = ports
      .flatMap((obj) => Object.keys(obj))
      .map((k) => parseInt(k.replace("net", ""), 10))
      .filter((n) => !isNaN(n));
    return `net${nums.length ? Math.max(...nums) + 1 : 0}`;
  };

  const nextNet = getNextNetName(activeNode?.data?.networkport || []);
  const getVmDetailsByNodeId = (nodeId) => {
    const node = scenarioNodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return {
      vmid: node.data.vmid,
      vmType: node.data.vmType,
    };
  };
  const handleConfirmDelete = async (nodeId, portKey) => {
    const vmDetails = getVmDetailsByNodeId(nodeId);
    if (!vmDetails) {
      console.error("VM details not found");
      return;
    }
    const payload = {
      vmid: vmDetails.vmid,
      vmType: vmDetails.vmType,
      netKey: portKey,
    };
    try {
      await dispatch(deleteNetworkPort(payload));
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              data: {
                ...node.data,
                networkport: node.data.networkport.filter(
                  (obj) => !obj[portKey],
                ),
              },
            }
            : node,
        ),
      );
      setConfirmDelete({ open: false, port: null });
      setPortPopover(null);      // <-- ADD THIS (or your popover state reset)
      setActivePopover(null); // CLOSE POPOVER

    } catch (err) {
      toast.error("Failed to delete network port");
    }
  };

  // const handleAddNetworkPort = async (nodeId, netName) => {
  //   const vmDetails = getVmDetailsByNodeId(nodeId);
  //   if (!vmDetails) return;

  //   const payload = {
  //     vmid: vmDetails.vmid,
  //     vmType: vmDetails.vmType,
  //     netKey: netName,
  //   };

  //   const res = await dispatch(addNetworkPort(payload));

  //   const ok = res?.data?.data?.statusCode === 200;

  //   if (ok) {
  //     setActivePopover(null); // CLOSE POPOVER
  //     setPendingNets([]);     // optional cleanup
  //   }

  //   return res;
  // };
  const handleAddNetworkPort = async (nodeId, netName) => {
    const vmDetails = getVmDetailsByNodeId(nodeId);
    if (!vmDetails) return;

    const payload = {
      vmid: vmDetails.vmid,
      vmType: vmDetails.vmType,
      netKey: netName,
    };

    const res = await dispatch(addNetworkPort(payload));

    if (res?.statusCode === 200) {
      setActivePopover(null);
      setPendingNets([]);
    } else {
      toast.error(res?.message || "Failed to add network");
    }
  };

  useEffect(() => {
    if (activePopover) {
      setPendingNets([nextNet]);
    }
  }, [activePopover]);
  const handleAddMore = () => {
    setPendingNets((prev) => {
      const last = prev?.length ? prev[prev.length - 1] : nextNet;
      const nextIndex = Number(last.replace("net", "")) + 1;
      return [...(prev || []), `net${nextIndex}`];
    });
  };
  const handleRemovePendingNet = (e, net) => {
    e.stopPropagation();
    setPendingNets((prev) => prev.filter((n) => n !== net));
  };
  const closeConnectPopover = () => {
    setConnectPopover(null);
    setPendingConnection(null);
  };
  useEffect(() => {
    if (!connectPopover) return;

    const handleClickOutside = (e) => {
      const pop = document.getElementById("connection-popover");
      if (pop && !pop.contains(e.target)) {
        closeConnectPopover();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [connectPopover]);



    const getPopoverPosition = (anchor) => {
  const popoverWidth = 340;
  const margin = 20;

  let left = anchor.x;
  let top = anchor.y;

  // if popover goes outside right screen → move left
  if (anchor.x + popoverWidth > window.innerWidth) {
    left = anchor.x - popoverWidth - margin;
  }

  // prevent bottom overflow
  const popoverHeight = 400;
  if (anchor.y + popoverHeight > window.innerHeight) {
    top = window.innerHeight - popoverHeight - margin;
  }

  return { left, top };
};
const getPopoverConnectionPosition = () => {
  return {
    left: window.innerWidth / 2,
    top: window.innerHeight / 2,
  };
};
const getPopoverplugPosition = (popover) => {
  const popWidth = 260;
  const popHeight = 180;
  if (
    !popover ||
    typeof popover.x !== "number" ||
    typeof popover.y !== "number" ||
    popover.x === 0 ||
    popover.y === 0
  ) {
    return {
      left: window.innerWidth / 2 - popWidth / 2,
      top: window.innerHeight / 2 - popHeight / 2,
    };
  }

  let left = popover.x;
  let top = popover.y;
  left += 10;
  top += 10;
  if (left + popWidth > window.innerWidth) {
    left = left - popWidth - 20;
  }
  if (top + popHeight > window.innerHeight) {
    top = top - popHeight - 20;
  }
  left = Math.max(10, left);
  top = Math.max(10, top);

  return { left, top };
};

const handleEdgeClick = async (event, edge) => {
  event.stopPropagation();
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to remove this network bridge?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      const bridge = edge?.data?.label;
      const payload = {
        vmrequestid: getSingleScenariosSucc?.[0]?.vmrequestid,
        edgeId: edge.id,
        bridge,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      };
      //Redux API call
      await dispatch(deletebridge(payload));
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    } catch (error) {
      console.error("Delete bridge error:", error);
      Swal.fire("Error", "Failed to remove bridge", "error");
    }
  }
};

  return (
    <>
      <ToastContainer />
      <Card className="view-component-card overflow-hidden mb-3">
        <Card.Body className="p-3">
          <Row className="view-component-row-sm">
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="me-3 d-flex align-items-center">
                    {(() => {
                      const level = scenario?.scenariolevel;
                      const filledStars =
                        level === "Easy"
                          ? 1
                          : level === "Medium"
                            ? 2
                            : level === "Hard"
                              ? 3
                              : 0;
                      const colorClass =
                        level === "Easy"
                          ? "text-success"
                          : level === "Medium"
                            ? "text-warning"
                            : level === "Hard"
                              ? "text-danger"
                              : "text-muted";

                      return [1, 2, 3].map((star) => (
                        <i
                          key={star}
                          className={`me-1 ${
                            star <= filledStars
                              ? `fas fa-star ${colorClass}`
                              : "far fa-star text-muted"
                          }`}
                          style={{ fontSize: "18px" }}
                        ></i>
                      ));
                    })()}
                  </div>
                  <span className="fw-semibold" style={{ fontSize: "18px" }}>
                    {scenario?.scenarioidentification || "—"} -{" "}
                    {scenario?.scenariotitle || "—"}
                  </span>
                </div>
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "12px", maxWidth: "50%" }}
                >
                  <Button
                    variant="outline-secondary"
                    className="btn-sm"
                    onClick={() => {
                      router.push(
                        `/usersession_view/${scenario?.vmrequestuuid}
                        `,
                      );
                      dispatch(clearSingleScenarios());
                    }}
                  >
                    <i className="fe fe-arrow-left"></i>
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <div
        className="dndflow  mb-2"
        style={{ display: "flex", height: "80vh", gap: "20px" }}
      >
        <div style={{ width: "28%", height: "100%" }}>
          <SideBar
            imageNodeData={imageNodeData}
            setDraggedNode={setDraggedNode} // Passing setDraggedNode to Sidebar
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
          {loadingScenario && (
            <div className="scenario-loader-overlay">
              <div className="vertical-bounce-loader">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p className="loader-text">Updating scenario...</p>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            key={nodes.length} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnectStart={onConnectStart}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType="floating" //  This makes the connection line float
            connectionLineStyle={{ stroke: "#000", strokeWidth: 2 }}
            zoomOnDoubleClick={false} // disables zoom on double-click
            edgeTypes={edgeTypes}
            onConnectEnd={onConnectEnd}
            onEdgeClick={handleEdgeClick} 


          >
            <Background />
          </ReactFlow>
          {activePopover && (
            <div
              style={{
                position: "fixed",
                ...getPopoverPosition(activePopover.anchor),
                zIndex: 9999,
              }}
            >
              <NetworkPopover
                nodeId={activePopover.nodeId}
                existingPorts={existingPorts}
                pendingNets={pendingNets}
                setPendingNets={setPendingNets}
                handleAddMore={handleAddMore}
                handleRemovePendingNet={handleRemovePendingNet}
                handleAddNetworkPort={handleAddNetworkPort}
                handleConfirmDelete={handleConfirmDelete}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                onClose={() => setActivePopover(null)}
              />
            </div>
          )}
          {connectPopover && (
            <div
              style={{
                position: "fixed",
                ...getPopoverConnectionPosition(),
                zIndex: 9999,
                transform: "translate(-50%, -50%)",
              }}
            >
              <ConnectionPopover
                data={connectPopover}
                // onSelect={handleConnectionType}
                onSelect={(opt, value) => handleConnectionType(opt, value)}
                onClose={closeConnectPopover}
              />
            </div>
          )}
          {portPopover && (
            <div
               style={{
                position: "fixed",
                ...getPopoverplugPosition(portPopover),
                zIndex: 9999,
              }}
            >
              <PortActionPopover
                data={portPopover}
                runtimeState={
                  portRuntimeState?.[
                    `${portPopover.nodeId}-${portPopover.portKey}`
                  ]
                }
                onClose={() => setPortPopover(null)}
                actions={{
                  plug: plugHandler,
                  unplug: unplugHandler,
                  connect: connectHandler,
                  disconnect: disconnectHandler,
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="justify-content-end d-flex">
        <div className="pull-left">
          <small className="text-warning d-block mt-2">
            Note: After saving the diagram, ensure the components order is
            reinitialized or reset to maintain consistency.
          </small>
        </div>
        <Button
          className="mx-2"
          onClick={async () => {
            const vmrequestid = getSingleScenariosSucc?.[0]?.vmrequestid;

            if (!vmrequestid) return;

            try {
              await dispatch(changeReleaseEditLock({ vmrequestid }));
              toast.success(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
              Scenario edit successfully
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: false,
              theme: "colored",
            },
          );
            } catch (error) {
              toast.error(error.response?.data?.message || "Failed to save", {
                position: toast.POSITION.TOP_RIGHT,
                theme: "colored",
              });
            }
            router.push(
              `/usersession_view/${scenario?.vmrequestuuid}    `,
            );
          }}
        >
          {t("Submit")}
        </Button>
      </div>
      <Modal
        show={showCloneProgress}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>VM Setup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul className="timeline-1 mb-0">
            {/* CLONING */}
            <li className="mt-0 d-flex justify-content-between align-items-start">
              <div className="d-flex justify-content-between align-items-center gap-4">
                <i className={`fa fa-clone ${getStepClass("Cloning")}`} />
                <div className="ml-2">
                  <span className={getStepClass("Cloning")}>Cloning VM</span>
                  <p className="text-muted mb-0">
                    Duplicating virtual machine...
                  </p>
                </div>
              </div>

              {vmStep === "Cloning" && (
                <i className="fas fa-spinner fa-spin text-warning" />
              )}
            </li>
            {/* STARTING */}
            <li className="d-flex justify-content-between align-items-start mt-3">
              <div className="d-flex justify-content-between align-items-center gap-4">
                <i className={`fa fa-play ${getStepClass("Starting")}`} />
                <div className="ml-2">
                  <span className={getStepClass("Starting")}>Starting VM</span>
                  <p className="text-muted mb-0">Booting virtual machine...</p>
                </div>
              </div>

              {vmStep === "Starting" && (
                <i className="fas fa-spinner fa-spin text-success" />
              )}
            </li>
          </ul>
        </Modal.Body>
      </Modal>
      <Modal
        show={showStopDestroyModal}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>VM Cleanup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul className="timeline-1 mb-0">
            {/* STOPPING */}
            <li className="d-flex justify-content-between align-items-start mt-3">
              <div className="d-flex justify-content-between align-items-center gap-4">
                <i className={`fa fa-stop ${getStopStepClass("Stopping")}`} />
                <div className="ml-2">
                  <span className={getStopStepClass("Stopping")}>
                    Stopping VM
                  </span>
                  <p className="text-muted mb-0">
                    Shutting down virtual machine...
                  </p>
                </div>
              </div>
              {stopStep === "Stopping" && (
                <i className="fas fa-spinner fa-spin text-warning" />
              )}
            </li>

            {/* DESTROYING */}
            <li className="d-flex justify-content-between align-items-start mt-3">
              <div className="d-flex justify-content-between align-items-center gap-4">
                <i
                  className={`fa fa-trash ${getStopStepClass("Destroying")}`}
                />
                <div className="ml-2">
                  <span className={getStopStepClass("Destroying")}>
                    Destroying VM
                  </span>
                  <p className="text-muted mb-0">Removing virtual machine...</p>
                </div>
              </div>

              {stopStep === "Destroying" && (
                <i className="fas fa-spinner fa-spin text-success" />
              )}
            </li>
          </ul>
        </Modal.Body>
      </Modal>
      <Modal show={showBridgeModal} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Network Setup</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ul className="timeline-1 mb-0">
            <li className="d-flex justify-content-between align-items-start">
              <div className="d-flex justify-content-between align-items-center gap-4">
                <i className="fa fa-network-wired text-warning" />
                <div className="ml-2">
                  <span className="text-warning font-weight-semibold">
                    Bridge Configuration
                  </span>
                  <p className="text-muted mb-0">
                    Configuring network bridge...
                  </p>
                </div>
              </div>

              {bridgeLoading && (
                <i className="fas fa-spinner fa-spin text-warning" />
              )}
            </li>
          </ul>
        </Modal.Body>
      </Modal>
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
Flowchart.displayName = "Flowchart";
export default Flowchart;

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import {
  triggerScenarioImport,
  checkScenarioIdentification,
  pollImportStatus,
  startScenarioRestore,
  uploadComponentZst,
  pollZstUploadStatus
} from "../../../shared/redux/slices/scenario/scenarioManage";

// ── Inline SVG icons ───────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", strokeWidth = 2, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
    strokeLinejoin="round" style={style} className={className}>
    <path d={d} />
  </svg>
);
const FileText      = (p) => <Icon {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />;
const Search        = (p) => <Icon {...p} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const AlertTriangle = (p) => <Icon {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />;
const AlertOctagon  = (p) => <Icon {...p} d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86zM12 8v4M12 16h.01" />;
const Cloud         = (p) => <Icon {...p} d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />;
const Wrench        = (p) => <Icon {...p} d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />;
const Database      = (p) => <Icon {...p} d="M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zM2 12c0 2.76 4.48 5 10 5s10-2.24 10-5M2 7c0 2.76 4.48 5 10 5s10-2.24 10-5" />;
const CheckCircle   = (p) => <Icon {...p} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />;
const XCircle       = (p) => <Icon {...p} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM15 9l-6 6M9 9l6 6" />;
const Package       = (p) => <Icon {...p} d="M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />;
const Info          = (p) => <Icon {...p} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 16v-4M12 8h.01" />;
const Check         = (p) => <Icon {...p} d="M20 6 9 17l-5-5" />;
const X             = (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />;
const Loader        = (p) => <Icon {...p} d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />;
const HardDrive     = (p) => <Icon {...p} d="M22 12H2M22 12a10 10 0 0 1-10 10A10 10 0 0 1 2 12M22 12a10 10 0 0 0-10-10A10 10 0 0 0 2 12M6 12h.01M10 12h.01" />;
const Upload        = (p) => <Icon {...p} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
const Cpu           = (p) => <Icon {...p} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM9 9h6v6H9zM9 1v2M15 1v2M9 21v2M15 21v2M1 9h2M1 15h2M21 9h2M21 15h2" />;
const PlayCircle    = (p) => <Icon {...p} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM10 8l6 4-6 4V8z" />;

// ── Constants ──────────────────────────────────────────────────────────────
const PHASES = [
  { id: "idle",        label: "",                           Icon: null },
  { id: "reading",     label: "Reading manifest...",        Icon: FileText },
  { id: "check_id",    label: "Checking identification...", Icon: Search },
  { id: "id_conflict", label: "Conflict detected",          Icon: AlertTriangle },
  { id: "zst_upload",  label: "Uploading components...",    Icon: Upload },
  { id: "uploading",   label: "Uploading to Proxmox...",    Icon: Cloud },
  { id: "restoring",   label: "Restoring VMs...",           Icon: Wrench },
  { id: "db",          label: "Saving scenario...",         Icon: Database },
  { id: "done",        label: "Import complete!",           Icon: CheckCircle },
  { id: "failed",      label: "Import failed",              Icon: XCircle },
];

const STEP_SEQUENCE = ["reading", "check_id", "zst_upload", "restoring", "db", "done"];
const STEP_LABELS   = {
  reading:    "Read",
  check_id:   "Check ID",
  zst_upload: "Components",
  restoring:  "Restore",
  db:         "Save",
  done:       "Done",
};

const PHASE_MAP = {
  "Extracting ZIP":    { phase: "uploading", progress: 65 },
  "Uploading":         { phase: "uploading", progress: 70 },
  "Restoring":         { phase: "restoring", progress: 80 },
  "Creating scenario": { phase: "db",        progress: 90 },
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Small sub-components ───────────────────────────────────────────────────
const CheckIcon = ({ status }) => {
  if (status === "ok")    return <Check         size={11} strokeWidth={2.5} />;
  if (status === "warn")  return <AlertTriangle size={11} strokeWidth={2.5} />;
  if (status === "error") return <X             size={11} strokeWidth={2.5} />;
  return <Info size={11} strokeWidth={2} />;
};

const ZstRow = ({ component, onFileSelect, uploading, transferring, uploaded, restored, progress, error }) => {
  const inputRef = useRef(null);
  const statusColor = restored    ? "#b794f4"
                    : uploaded    ? "#68d391"
                    : error       ? "#fc8181"
                    : (uploading || transferring) ? "#63b3ed"
                    : "#718096";

  return (
    <div className={[
      "sim-zst-row",
      restored ? "sim-zst-row--restored" : "",
      uploaded ? "sim-zst-row--done"     : "",
      error    ? "sim-zst-row--error"    : "",
    ].join(" ")}>
      <div className="sim-zst-info">
        <div className="sim-zst-icon">
          <Cpu size={14} color={statusColor} strokeWidth={1.5} />
        </div>
        <div className="sim-zst-meta">
          <div className="sim-zst-name">{component.name}</div>
          <div className="sim-zst-file">{component.file}</div>
          {component.type && (
            <div className="sim-zst-type">{component.type.toUpperCase()}</div>
          )}
        </div>
      </div>

      <div className="sim-zst-right">

        {/* Priority 1 — Restored (locked, can never re-upload) */}
        {restored ? (
          <div className="sim-zst-status sim-zst-status--restored">
            <CheckCircle size={14} color="#b794f4" strokeWidth={2} />
            <span>Restored ✓</span>
          </div>

        /* Priority 2 — Uploaded & waiting for restore */
        ) : uploaded ? (
          <div className="sim-zst-status sim-zst-status--ok">
            <CheckCircle size={14} color="#68d391" strokeWidth={2} />
            <span>Uploaded</span>
          </div>

        /* Priority 3 — Phase 2: Jobs → Proxmox background transfer */
        ) : transferring ? (
          <div className="sim-zst-status sim-zst-status--loading">
            <Loader size={13} strokeWidth={2} className="sim-spin" />
            <span>Transferring...</span>
          </div>

        /* Priority 4 — Phase 1: browser → Jobs disk */
        ) : uploading ? (
          <div className="sim-zst-status sim-zst-status--loading">
            <Loader size={13} strokeWidth={2} className="sim-spin" />
            <span>{progress ? `${progress}%` : "Uploading…"}</span>
          </div>

        /* Priority 5 — Failed */
        ) : error ? (
          <div className="sim-zst-status sim-zst-status--error">
            <XCircle size={14} color="#fc8181" strokeWidth={2} />
            <span title={error}>Failed</span>
            <input
              ref={inputRef} type="file" accept=".zst"
              style={{ display: "none" }}
              onChange={(e) => onFileSelect(component, e.target.files[0])}
            />
            <button
              className="sim-zst-pick-btn"
              style={{ marginLeft: 6 }}
              onClick={() => inputRef.current?.click()}
            >
              Retry
            </button>
          </div>

        /* Priority 6 — Idle, awaiting file selection */
        ) : (
          <>
            <input
              ref={inputRef} type="file" accept=".zst"
              style={{ display: "none" }}
              onChange={(e) => onFileSelect(component, e.target.files[0])}
            />
            <button
              className="sim-zst-pick-btn"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={12} strokeWidth={2} /> Select .zst
            </button>
          </>
        )}

      </div>
    </div>
  );
};



const ScenarioImportModal = ({ show, onHide, onImportStarted }) => {
  const dispatch   = useDispatch();
  const fileInput  = useRef(null);
  const idInputRef = useRef(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [file,         setFile]         = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [phase,        setPhase]        = useState("idle");
  const [progress,     setProgress]     = useState(0);
  const [customId,     setCustomId]     = useState("");
  const [idError,      setIdError]      = useState("");
  const [manifestInfo, setManifestInfo] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [particles,    setParticles]    = useState([]);
  const [importid,     setImportid]     = useState(null);
  const [components,   setComponents]   = useState([]);
  const [zstStatus,    setZstStatus]    = useState({});
  const [restoring,    setRestoring]    = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isImporting     = ["reading", "check_id", "uploading"].includes(phase);
  const isZstPhase      = phase === "zst_upload";
  const isDone          = phase === "done";
  const isFailed        = phase === "failed";
  const isConflict      = phase === "id_conflict";
  const allZstsUploaded = components.length > 0 &&
    components.every((c) => zstStatus[c.file]?.uploaded);
  const currentPhaseObj = PHASES.find((p) => p.id === phase) || PHASES[0];
  const activeStep      = STEP_SEQUENCE.indexOf(phase);


  const uploadedCount   = components.filter((c) => zstStatus[c.file]?.uploaded || zstStatus[c.file]?.restored).length;
  const restoredCount   = components.filter((c) => zstStatus[c.file]?.restored).length;
  const uploadingAny    = components.some((c)  => zstStatus[c.file]?.uploading);
  const anyReadyToRestore = components.some((c) => zstStatus[c.file]?.uploaded && !zstStatus[c.file]?.restored);
  const allRestored     = components.length > 0 && components.every((c) => zstStatus[c.file]?.restored);

  // ── Particle burst on done ────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "done") {
      setParticles(
        Array.from({ length: 18 }, (_, i) => ({
          id:    i,
          x:     Math.random() * 100,
          y:     Math.random() * 60 + 20,
          color: ["#63b3ed","#68d391","#f6ad55","#fc8181","#b794f4"][i % 5],
          size:  Math.random() * 8 + 4,
          delay: Math.random() * 0.5,
        }))
      );
    } else {
      setParticles([]);
    }
  }, [phase]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const reset = () => {
    setFile(null); setDragging(false); setPhase("idle"); setProgress(0);
    setCustomId(""); setIdError(""); setManifestInfo(null); setCheckedItems([]);
    setImportid(null); setComponents([]); setZstStatus({}); setRestoring(false);
  };

  const handleClose = () => {
    if (isImporting || restoring || uploadingAny) return;
    reset();
    onHide();
  };

  const addCheck = (label, status = "ok") =>
    setCheckedItems((prev) => [
      ...prev,
      { label, status, key: Date.now() + Math.random() },
    ]);

  const formatSize = (b) => {
    if (!b) return "";
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 ** 3)   return `${(b / 1024 / 1024).toFixed(1)} MB`;
    return `${(b / 1024 ** 3).toFixed(2)} GB`;
  };

  // ── File select ───────────────────────────────────────────────────────────
  const handleFileSelect = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".zip")) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">Only ZIP files are allowed.</p>,
        { position: toast.POSITION.TOP_RIGHT, hideProgressBar: true, theme: "colored" },
      );
      return;
    }
    setFile(f);
    setPhase("idle");
    setCheckedItems([]);
    setManifestInfo(null);
    setImportid(null);
    setComponents([]);
    setZstStatus({});
  };

  const onInputChange = (e) => handleFileSelect(e.target.files[0]);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  // ── STEP 1: Submit ZIP → get importid + components ────────────────────────
  const handleSubmit = async (overrideId = null) => {
    if (!file || isImporting) return;

    setCheckedItems([]);
    setPhase("reading");
    setProgress(5);
    await delay(700);
    addCheck("ZIP file validated", "ok");
    setProgress(12);
    await delay(400);

    // ── Check identification conflict ─────────────────────────────────────
    setPhase("check_id");
    setProgress(20);

    const checkForm = new FormData();
    checkForm.append("zipfile", file);
    checkForm.append("userid", "2");
    if (overrideId) checkForm.append("customIdentification", overrideId);

    let checkResult;
    try {
      checkResult = await dispatch(checkScenarioIdentification(checkForm));
    } catch (_) {
      checkResult = { data: { data: { conflict: false } } };
    }

    await delay(300);

    const payload = checkResult?.data?.data || {};

    if (payload.manifest) {
      setManifestInfo(payload.manifest);
      await delay(200);
      addCheck(`Title: ${payload.manifest.title || "—"}`, "info");
      await delay(150);
      addCheck(`Identification: ${payload.manifest.identification || "—"}`, "info");
      await delay(150);
      if (payload.manifest.components)
        addCheck(`Components: ${payload.manifest.components}`, "info");
    }

    await delay(300);

    if (payload.conflict) {
      addCheck(`Identification "${payload.conflictId}" already exists`, "warn");
      setPhase("id_conflict");
      setCustomId(overrideId ? `${overrideId}_v2` : `${payload.conflictId}_IMP`);
      setIdError(overrideId ? `"${overrideId}" also already exists — try a different name` : "");
      setProgress(25);
      setTimeout(() => idInputRef.current?.focus(), 200);
      return;
    }

    addCheck("Identification checked ✓", "ok");
    setProgress(35);

    // ── Upload ZIP to get importid + component list ───────────────────────
    setPhase("uploading");
    await delay(300);

    const importForm = new FormData();
    importForm.append("zipfile", file);
    importForm.append("userid", "2");
    if (overrideId) importForm.append("customIdentification", overrideId);
    let result;
    try {
      result = await dispatch(triggerScenarioImport(importForm));
    } catch (err) {
      addCheck("ZIP upload failed: " + err.message, "error");
      setPhase("failed");
      return;
    }
    const data          = result?.data?.data?.data || {};
    const newImportid   = result?.data?.data?.data?.importid;
    const newComponents = result?.data?.data?.data?.components || [];
    if (!newImportid) {
      addCheck("Failed to start import: " + (result?.data?.message || "Unknown error"), "error");
      setPhase("failed");
      return;
    }
    addCheck("Scenario package accepted ✓", "ok");
    setProgress(45);
    if (newComponents.length === 0) {
      addCheck("No VM components — triggering restore directly", "warn");
      setImportid(newImportid);
      await kickOffRestore(newImportid);
      return;
    }
    // VMs found — show ZST upload panel
    addCheck(`Found ${newComponents.length} components — upload .zst files below ↓`, "ok");
    setImportid(newImportid);
    setComponents(newComponents);
    const initStatus = {};
    newComponents.forEach((c) => {
      initStatus[c.file] = { uploading: false, uploaded: false,restored: false, progress: 0, error: null };
    });
    setZstStatus(initStatus);
    setPhase("zst_upload");
    setProgress(50);
  };

  const handleZstFileSelect = async (component, zstFile) => {
    if (!zstFile) return;

    if (!zstFile.name.endsWith(".zst")) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">Only .zst files are accepted.</p>,
        { position: toast.POSITION.TOP_RIGHT, hideProgressBar: true, theme: "colored" },
      );
      return;
    }

    if (zstFile.name !== component.file) {
      await Swal.fire({
        icon:               "warning",
        title:              "Wrong File Selected",
        html:               `<div style="font-size:14px;line-height:2;">
                              <p>Expected: <strong style="color:#28a745">${component.file}</strong></p>
                              <p>Selected: <strong style="color:#dc3545">${zstFile.name}</strong></p>
                            </div>`,
        confirmButtonText:  "Got it",
        confirmButtonColor: "#f0ad4e",
        customClass: {
          popup: "swal-popup-zindex",
          container: "swal-container-zindex",
        },
      });
      return;
    }

    // ── Phase 1: uploading browser → Jobs disk ─────────────────────────────
    setZstStatus((prev) => ({
      ...prev,
      [component.file]: { uploading: true, transferring: false, uploaded: false, progress: 0, error: null },
    }));

    try {
      const result = await dispatch(
        uploadComponentZst(
          { file: zstFile, importid, vmFile: component.file },
          (pct) => {
            setZstStatus((prev) => ({
              ...prev,
              [component.file]: { ...prev[component.file], progress: pct },
            }));
          },
        ),
      );
      console.log("resultresultresultresultresult",result);
      

      const data = result?.data?.data?.data || result;

      console.log("parsed data:", data);

      if (data?.received || data?.transferring) {
        // ── Phase 2: transferring Jobs disk → Proxmox (poll) ──────────
        setZstStatus((prev) => ({
          ...prev,
          [component.file]: {
            uploading: false, transferring: true,
            uploaded: false, progress: 100, error: null,
          },
        }));
        addCheck(`${component.name} received — transferring to Proxmox...`, "ok");
        startPollingZstStatus(component);
      }

    } catch (err) {
      setZstStatus((prev) => ({
        ...prev,
        [component.file]: { uploading: false, transferring: false, uploaded: false, progress: 0, error: err.message },
      }));
      addCheck(`${component.name} upload failed: ${err.message}`, "error");
    }
  };

  // ── startPollingZstStatus — polls every 5s until done ────────────────────
  const pollIntervals = useRef({});

  const startPollingZstStatus = (component) => {
    // Clear any existing poll for this component
    if (pollIntervals.current[component.file]) {
      clearInterval(pollIntervals.current[component.file]);
    }

    pollIntervals.current[component.file] = setInterval(async () => {
      try {
        const result   = await dispatch(pollZstUploadStatus(importid));
        console.log("resultresultresultresultresultresudddddltresult",result);
        
        const statuses = result?.data?.data || result?.data || [];
        console.log("statusesstatusesstatusesstatuses",statuses);
        
        // const thisComp = statuses.find((s) => s.vm_file === component.file);
        const PRIORITY = { uploaded: 4, transferring: 3, failed: 2, pending: 1 };

        const allForComp = Array.isArray(statuses)
          ? statuses.filter((s) => s.vm_file === component.file)
          : [];

        // pick the one with highest priority status
        const thisComp = allForComp.sort(
          (a, b) => (PRIORITY[b.status] || 0) - (PRIORITY[a.status] || 0)
        )[0];

        console.log("thisComp:", thisComp);

        if (!thisComp) return;

        if (thisComp.status === "uploaded") {
          clearInterval(pollIntervals.current[component.file]);
          setZstStatus((prev) => ({
            ...prev,
            [component.file]: {
              uploading: false, transferring: false,
              uploaded: true, progress: 100, error: null,
            },
          }));
          addCheck(`${component.name} transferred to Proxmox ✓`, "ok");
        }

        if (thisComp.status === "failed") {
          clearInterval(pollIntervals.current[component.file]);
          setZstStatus((prev) => ({
            ...prev,
            [component.file]: {
              uploading: false, transferring: false,
              uploaded: false, progress: 0,
              error: thisComp.error_message || "Transfer failed",
            },
          }));
          addCheck(`${component.name} transfer failed`, "error");
        }

      } catch (_) {
        // network blip — keep polling
      }
    }, 15000);
  };

// ── Cleanup intervals on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, []);

  
  const kickOffRestore = async (id = importid) => {
  const thisBatch = components
    .filter((c) => zstStatus[c.file]?.uploaded && !zstStatus[c.file]?.restored)
    .map((c) => c.file);

  if (thisBatch.length === 0) return;

  setRestoring(true);
  setPhase("restoring");
  setProgress(60);

  let startResult;
  try {
    startResult = await dispatch(startScenarioRestore({
      importid: id,
      vmFiles: thisBatch,
    }));
  } catch (err) {
    addCheck("Failed to start restore: " + err.message, "error");
    setPhase("zst_upload");
    setRestoring(false);
    return;
  }

  const startStatus = startResult?.data?.statusCode || startResult?.statusCode;
  if (startStatus !== 200) {
    addCheck(startResult?.data?.message || "Failed to start restore", "error");
    setPhase("zst_upload");
    setRestoring(false);
    return;
  }

  addCheck("Restore job started ✓", "ok");

  const MAX_POLLS   = 120;
  const INTERVAL_MS = 10000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await delay(INTERVAL_MS);

    let statusData;
    try {
      const action = await dispatch(pollImportStatus(id));
      statusData   = action?.data?.data || action?.data;
    } catch (_) {
      continue;
    }

    const { status, message } = statusData ?? {};
    if (!status) continue;

    const matched = Object.entries(PHASE_MAP).find(([key]) => message?.includes(key));
    if (matched) {
      const [, { phase: p, progress: prog }] = matched;
      setPhase(p);
      setProgress(prog);
    }

    // ──  Partial batch done ─────────────────────────────────────────
    if (status === "Running" && message?.startsWith("BatchCompleted:")) {
      setZstStatus((prev) => {
        const next = { ...prev };
        thisBatch.forEach((file) => {
          next[file] = { ...next[file], restored: true, uploaded: true };
        });
        return next;
      });

      const newRestoredCount = restoredCount + thisBatch.length;
      const remaining        = components.length - newRestoredCount;

      addCheck(`Batch restored ✓ — ${remaining} components remaining, upload to continue`, "ok");
      setRestoring(false);
      setPhase("zst_upload");
      setProgress(50);

      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          VM restored! Upload the remaining files to continue.
        </p>,
        { position: toast.POSITION.TOP_RIGHT, hideProgressBar: true, theme: "colored" },
      );
      return;
    }

    // ──  ALL batches done — final ───────────────────────────────────
    if (status === "Completed") {
      setZstStatus((prev) => {
        const next = { ...prev };
        thisBatch.forEach((file) => {
          next[file] = { ...next[file], restored: true, uploaded: true };
        });
        return next;
      });

      addCheck("All VMs restored in Proxmox ✓", "ok");
      addCheck("Scenario saved to database ✓", "ok");
      setProgress(100);
      setPhase("done");
      setRestoring(false);
      if (onImportStarted) onImportStarted();
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">Import completed successfully!</p>,
        { position: toast.POSITION.TOP_RIGHT, hideProgressBar: true, theme: "colored" },
      );
      return;
    }

    // ──  Failed ─────────────────────────────────────────────────────
    if (status === "Failed") {
      addCheck(message || "Restore failed", "error");
      setPhase("zst_upload");
      setRestoring(false);
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">Restore failed — try again</p>,
        { position: toast.POSITION.TOP_RIGHT, hideProgressBar: true, theme: "colored" },
      );
      return;
    }
  }

      addCheck("Restore timed out", "warn");
      setPhase("zst_upload");
      setRestoring(false);
    };
      
  
  const handleIdSubmit = async () => {
    if (!customId.trim()) { setIdError("Identification cannot be empty"); return; }
    if (!/^[a-zA-Z0-9_\-]+$/.test(customId)) {
      setIdError("Only letters, numbers, _ and - allowed");
      return;
    }
    setIdError("");
    setCheckedItems([]);
    await handleSubmit(customId.trim());
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      className="sim-import-modal"
      backdrop={isImporting || restoring || uploadingAny ? "static" : true}
    >
      {/* ── Header ── */}
      <Modal.Header closeButton={!isImporting && !restoring && !uploadingAny}>
        <div className="sim-header-content">
          <div className="sim-logo-mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L20 7V15L11 20L2 15V7L11 2Z" stroke="#63b3ed" strokeWidth="1.5" fill="rgba(99,179,237,0.08)" />
              <path d="M11 6L16 9V13L11 16L6 13V9L11 6Z" fill="#63b3ed" opacity="0.6" />
            </svg>
          </div>
          <div>
            <div className="sim-title">Import Scenario</div>
            <div className="sim-subtitle">Restore a scenario package from a .zip export file</div>
          </div>
        </div>
      </Modal.Header>

      {/* ── Body ── */}
      <Modal.Body>
        {/* Particle burst on done */}
        {particles.map((p) => (
          <div key={p.id} className="sim-particle"
            style={{ left: `${p.x}%`, top: `${p.y}%`,
                     width: p.size, height: p.size,
                     background: p.color, animationDelay: `${p.delay}s` }} />
        ))}

        {/* ── Step bar ── */}
        <div className="sim-steps">
          {STEP_SEQUENCE.map((sid, i) => {
            const state     = i < activeStep ? "done" : i === activeStep ? "active" : "pending";
            const PhaseIcon = PHASES.find((p) => p.id === sid)?.Icon;
            return (
              <React.Fragment key={sid}>
                <div className={`sim-step sim-step--${state}`}>
                  <div className="sim-step-dot">
                    {state === "done" ? (
                      <Check size={12} strokeWidth={3} />
                    ) : PhaseIcon ? (
                      <PhaseIcon size={12} strokeWidth={2} />
                    ) : i + 1}
                  </div>
                  <div className="sim-step-label">{STEP_LABELS[sid]}</div>
                </div>
                {i < STEP_SEQUENCE.length - 1 && (
                  <div className={`sim-step-line ${state === "done" ? "sim-step-line--done" : ""}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="sim-body-grid">
          {/* ══ LEFT PANEL ══ */}
          <div className="sim-left">

            {/* DROP ZONE — shown during idle/reading/check_id/uploading/conflict/done/failed */}
            {!isZstPhase && !restoring && (
              <div
                className={[
                  "sim-dropzone",
                  dragging ? "sim-dropzone--drag" : "",
                  file     ? "sim-dropzone--has"  : "",
                  isDone   ? "sim-dropzone--done"  : "",
                ].join(" ")}
                onDrop={file || isImporting || isDone || isFailed ? undefined : onDrop}
                onDragOver={file || isImporting || isDone || isFailed ? undefined
                  : (e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={file || isImporting || isDone || isFailed
                  ? undefined : () => setDragging(false)}
                onClick={file || isImporting || isDone || isFailed
                  ? undefined : () => fileInput.current?.click()}
              >
                <input ref={fileInput} type="file" accept=".zip"
                  style={{ display: "none" }} onChange={onInputChange} />

                {/* Done state */}
                {isDone && (
                  <div className="sim-done-state">
                    <div className="sim-done-ring">
                      <CheckCircle size={32} color="#68d391" strokeWidth={1.5} />
                    </div>
                    <div className="sim-done-text">Import Complete!</div>
                    <div className="sim-done-sub">Scenario restored and saved to database</div>
                  </div>
                )}

                {/* Failed state */}
                {isFailed && (
                  <div className="sim-done-state">
                    <div className="sim-done-ring sim-done-ring--fail">
                      <XCircle size={32} color="#fc8181" strokeWidth={1.5} />
                    </div>
                    <div className="sim-done-text sim-done-text--fail">Import Failed</div>
                    <div className="sim-done-sub">Check the import log for details</div>
                  </div>
                )}

                {/* Idle — no file yet */}
                {!file && !isDone && !isFailed && (
                  <div className="sim-drop-idle">
                    <div className="sim-upload-icon-wrap">
                      <div className="sim-upload-bounce">
                        <svg width="31" height="38" viewBox="0 0 24 24" fill="none"
                          stroke="#63b3ed" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                    </div>
                    <div className="sim-drop-title">Drop your .zip export here</div>
                    <div className="sim-drop-hint">or click to browse files</div>
                    <div className="sim-drop-badge">.zip only — no .zst files</div>
                  </div>
                )}

                {/* File selected */}
                {file && !isDone && !isFailed && (
                  <div className="sim-file-ready">
                    <div className={`sim-file-orb ${isImporting ? "sim-file-orb--pulse" : ""}`}>
                      {isImporting
                        ? <div className="sim-orb-spinner" />
                        : <Package size={28} color="#63b3ed" strokeWidth={1.5} />}
                    </div>
                    <div className="sim-file-name">{file.name}</div>
                    <div className="sim-file-size">{formatSize(file.size)}</div>

                    {isImporting && currentPhaseObj.Icon && (
                      <div className="sim-phase-label">
                        <span className="sim-phase-dot" />
                        <currentPhaseObj.Icon size={12} strokeWidth={2} />
                        {currentPhaseObj.label}
                      </div>
                    )}

                    {isImporting && (
                      <div className="sim-progress-track">
                        <div className="sim-progress-fill" style={{ width: `${progress}%` }}>
                          <div className="sim-progress-glow" />
                        </div>
                        <span className="sim-progress-pct">{progress}%</span>
                      </div>
                    )}

                    {!isImporting && (
                      <button
                        className="sim-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null); setPhase("idle"); setProgress(0);
                          setCheckedItems([]); setManifestInfo(null);
                          setCustomId(""); setIdError("");
                          setImportid(null); setComponents([]); setZstStatus({});
                          if (fileInput.current) fileInput.current.value = "";
                        }}
                      >
                        <X size={12} strokeWidth={2.5} /> Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ZST UPLOAD PANEL — shown when phase === "zst_upload" */}
            {isZstPhase && (
              <div className="sim-zst-panel">
                <div className="sim-zst-panel-header">
                  <HardDrive size={16} color="#63b3ed" strokeWidth={1.5} />
                  <div>
                    <div className="sim-zst-panel-title">Upload VM Component Files</div>
                    <div className="sim-zst-panel-sub">
                      Select the <strong>.zst</strong> backup file for each component.
                      Files stream directly to Proxmox — nothing stored on this server.
                    </div>
                  </div>
                </div>

                {/* Overall progress */}
                <div className="sim-zst-overall">
                  <div className="sim-zst-overall-label">
                    {uploadedCount} / {components.length} components uploaded
                  </div>
                  <div className="sim-progress-track sim-progress-track--sm">
                    <div className="sim-progress-fill"
                      style={{ width: `${components.length ? (uploadedCount / components.length) * 100 : 0}%` }}>
                      <div className="sim-progress-glow" />
                    </div>
                  </div>
                </div>

                {/* Per-component rows */}
                <div className="sim-zst-list">
                  {components.map((c) => (
                    <ZstRow
                      key={c.file}
                      component={c}
                      onFileSelect={handleZstFileSelect}
                      uploading={zstStatus[c.file]?.uploading || false}
                      uploaded={zstStatus[c.file]?.uploaded   || false}
                      transferring={zstStatus[c.file]?.transferring || false} 
                      restored={zstStatus[c.file]?.restored   || false}   //  add this
                      progress={zstStatus[c.file]?.progress   || 0}
                      error={zstStatus[c.file]?.error         || null}
                    />
                  ))}
                </div>

                <div className="sim-zst-note">
                  <Info size={13} color="#63b3ed" strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span>
                    Large files (10–20 GB) stream directly from your browser to Proxmox.
                    This may take several minutes per component.
                  </span>
                </div>
              </div>
            )}

            {/* RESTORE PROGRESS — shown while polling after ZST phase */}
            {restoring && (
              <div className="sim-file-ready" style={{ marginTop: 12 }}>
                <div className="sim-phase-label">
                  <span className="sim-phase-dot" />
                  {currentPhaseObj.Icon && (
                    <currentPhaseObj.Icon size={12} strokeWidth={2} />
                  )}
                  {currentPhaseObj.label}
                </div>
                <div className="sim-progress-track">
                  <div className="sim-progress-fill" style={{ width: `${progress}%` }}>
                    <div className="sim-progress-glow" />
                  </div>
                  <span className="sim-progress-pct">{progress}%</span>
                </div>
              </div>
            )}

            {/* ID CONFLICT PANEL */}
            {isConflict && (
              <div className="sim-conflict-panel">
                <div className="sim-conflict-header">
                  <AlertOctagon size={20} color="#f6ad55" strokeWidth={1.5} />
                  <div>
                    <div className="sim-conflict-title">Identification Conflict</div>
                    <div className="sim-conflict-sub">
                      This scenario ID already exists. Enter a new unique identification to continue.
                    </div>
                  </div>
                </div>
                <div className="sim-id-field-wrap">
                  <label className="sim-id-label">New Scenario Identification</label>
                  <div className="sim-id-input-row">
                    <input
                      ref={idInputRef}
                      className={`sim-id-input ${idError ? "sim-id-input--error" : ""}`}
                      value={customId}
                      onChange={(e) => { setCustomId(e.target.value); setIdError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleIdSubmit()}
                      placeholder="e.g. my_scenario_v2"
                      maxLength={80}
                    />
                    <button className="sim-id-confirm-btn" onClick={handleIdSubmit}>
                      Confirm &amp; Continue →
                    </button>
                  </div>
                  {idError && <div className="sim-id-error">{idError}</div>}
                  <div className="sim-id-hint">Only letters, numbers, underscores and hyphens</div>
                </div>
              </div>
            )}

            {/* INFO NOTE */}
            {!isDone && !isFailed && !isZstPhase && !restoring && (
              <div className="sim-note">
                <Info size={14} color="#63b3ed" strokeWidth={2}
                  style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  The scenario .zip contains JSON assets only. VM backup files (.zst) are
                  uploaded separately and streamed directly.
                </span>
              </div>
            )}
          </div>

          {/* ══ RIGHT PANEL — import log ══ */}
          <div className="sim-right">
            <div className="sim-checklist-header">
              <div className="sim-checklist-title">Import Log</div>
              {(isImporting || restoring || uploadingAny) && (
                <div className="sim-live-badge">
                  <span className="sim-live-dot" />
                  LIVE
                </div>
              )}
            </div>

            <div className="sim-checklist">
              {checkedItems.length === 0 && !isImporting && !isZstPhase && !restoring && (
                <div className="sim-checklist-empty">
                  Checks will appear here once import starts
                </div>
              )}

              {checkedItems.map((item, idx) => (
                <div key={item.key}
                  className={`sim-check-item sim-check-item--${item.status}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}>
                  <span className="sim-check-icon"><CheckIcon status={item.status} /></span>
                  <span className="sim-check-label">{item.label}</span>
                </div>
              ))}

              {/* Scanning dots while processing */}
              {(isImporting || restoring) && (
                <div className="sim-check-scanning">
                  <div className="sim-scan-dots"><span /><span /><span /></div>
                  {currentPhaseObj.Icon && (
                    <currentPhaseObj.Icon size={11} strokeWidth={2} style={{ opacity: 0.6 }} />
                  )}
                  <span>{currentPhaseObj.label}</span>
                </div>
              )}

              {isZstPhase && uploadingAny && (
                <div className="sim-check-scanning">
                  <div className="sim-scan-dots"><span /><span /><span /></div>
                  <Upload size={11} strokeWidth={2} style={{ opacity: 0.6 }} />
                  <span>Streaming to Proxmox…</span>
                </div>
              )}
            </div>

            {/* Manifest details box */}
            {manifestInfo && (
              <div className="sim-manifest-box">
                <div className="sim-manifest-title">
                  <FileText size={11} strokeWidth={2}
                    style={{ display: "inline", marginRight: 5 }} />
                  Manifest Details
                </div>
                {[
                  ["Title",      manifestInfo.title],
                  ["ID",         manifestInfo.identification],
                  ["Level",      manifestInfo.level],
                  ["Components", manifestInfo.components],
                  ["Type",       manifestInfo.type],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="sim-manifest-row">
                    <span className="sim-manifest-key">{k}</span>
                    <span className="sim-manifest-val">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      {/* ── Footer ── */}
      <Modal.Footer>
        <div className="sim-footer">

          {/* Left status message */}
          <div className="sim-footer-left">
            {(isImporting || restoring) && (
              <div className="sim-uploading-msg">
                <Loader size={14} strokeWidth={2} className="sim-spin" />
                Processing… do not close this window
              </div>
            )}
            {isZstPhase && (
              <div className="sim-uploading-msg" style={{ color: "#63b3ed" }}>
                <Upload size={14} strokeWidth={2} />
                {uploadedCount}/{components.length} component{components.length !== 1 ? "s" : ""} uploaded
              </div>
            )}

            {isDone   && (
              <div className="sim-success-msg">
                <Check size={14} strokeWidth={2.5} /> Import completed successfully
              </div>
            )}
            {isFailed && (
              <div className="sim-fail-msg">
                <X size={14} strokeWidth={2.5} /> Import encountered an error
              </div>
            )}
          </div>

          {/* Right action buttons */}
          <div className="sim-footer-actions">

            {/* Done or Failed */}
            {(isDone || isFailed) && (
              <button className="sim-btn sim-btn--primary"
                onClick={() => { reset(); onHide(); }}>
                Close
              </button>
            )}

            {/* ID Conflict */}
            {isConflict && (
              <>
                <button className="sim-btn sim-btn--ghost" onClick={handleClose}>
                  Cancel
                </button>
                <button className="sim-btn sim-btn--primary" onClick={handleIdSubmit}>
                  Confirm &amp; Import →
                </button>
              </>
            )}

                {isZstPhase && (
                <>
                  <button className="sim-btn sim-btn--ghost"
                    onClick={handleClose} disabled={uploadingAny || restoring}>
                    Cancel
                  </button>
                  <button
                    className="sim-btn sim-btn--primary"
                    onClick={() => kickOffRestore()}
                    disabled={!anyReadyToRestore || uploadingAny || restoring}  //  any uploaded = enabled
                    title={!anyReadyToRestore ? "Upload at least one component file first" : ""}
                  >
                    {restoring ? (
                      <><Loader size={14} strokeWidth={2} className="sim-spin" /> Restoring…</>
                    ) : uploadingAny ? (
                      <><Loader size={14} strokeWidth={2} className="sim-spin" /> Uploading…</>
                    ) : (
                      <>
                        <PlayCircle size={14} strokeWidth={2} />
                        Start Restore ({components.filter(c => zstStatus[c.file]?.uploaded && !zstStatus[c.file]?.restored).length} ready)
                      </>
                    )}
                  </button>
                </>
              )}

            {/* Idle / reading / check_id / uploading */}
            {!isDone && !isFailed && !isConflict && !isZstPhase && (
              <>
                <button className="sim-btn sim-btn--ghost"
                  onClick={handleClose}
                  disabled={isImporting || restoring}>
                  Cancel
                </button>
                <button
                  className="sim-btn sim-btn--primary"
                  onClick={() => handleSubmit()}
                  disabled={!file || isImporting || restoring}
                >
                  {isImporting ? (
                    <><Loader size={14} strokeWidth={2} className="sim-spin" /> Importing…</>
                  ) : (
                    <><Cloud size={14} strokeWidth={2} /> Start Import</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ScenarioImportModal;
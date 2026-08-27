"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, OverlayTrigger, Tooltip, Offcanvas, Form, Table, Row, Col, Spinner,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import Select from "react-select";
import { saveComponent, saveCustomComponent, vmStartScenario, vmRestartScenario, saveSnapshot, clearSaveSnapshot, getSnapshot, deleteSnapshot, restoresnapshot, getSingleVMDetail, clearCustomComponent, clearSaveComponent, qemuconfig, stopVm, rejectStoppedVm,
} from "../../../../../../shared/redux/slices/scenarios/scenarios";
import Seo from "../../../../../../shared/layout-components/seo/seo";
import defaultFavicon from "../../../../../../public/assets/img/brand/favicon.png";
import snapicon from "../../../../../../public/assets/img/pngs/snap.png";
import { getCategoriesList } from "../../../../../../shared/redux/slices/commons/commons";
import dynamic from "next/dynamic";
const FileUploader = dynamic(
  () => {
    return import("../../../../../../shared/data/common/fileuploads/fileuploader");
  },
  { ssr: false },
);
import { FilePath } from "../../../../../../shared/data/common/fileuploads/filepath";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

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
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [catDropDownData, setCatDropDownData] = useState([]);
  const updateStatus = (msg) => setStatus(msg);
  const [isSaving, setIsSaving] = useState(false);
  const ismulti = false;
  const category_path = FilePath.component_image;
  const snapshotApiData = useSelector(
    (state) => state.scenarios?.getSnapshot?.data?.snapshots || [],
  );
  const snapshotApiData1 = useSelector(
    (state) => state.scenarios?.getSnapshot?.data || [],
  );
  const saveCustomComponent1 = useSelector(
    (state) => state.scenarios?.saveCustomComponent || {},
  );
  const hasgetqemuconfig = useSelector(
    (state) => state.scenarios?.hasgetqemuconfig || {},
  );
  const handleSelectSnapshot = (snapshotId) => {
    setSelectedSnapshotId(snapshotId);
  };
  const { getVMdetail } = useSelector((state) => state.scenarios);
  const catListData = useSelector(
    (state) => state.commonsdata?.getMasterCatListData?.data || [],
  );

  const customcomponentid = saveCustomComponent1?.customcomponentid;
  const vmStatus = getVMdetail?.data?.vm_status;
  const customRequestStatus = getVMdetail?.data?.custom_request_status;
  const qemuConfigRef = useRef({});
  useEffect(() => {
    if (hasgetqemuconfig && Object.keys(hasgetqemuconfig).length > 0) {
      qemuConfigRef.current = hasgetqemuconfig;
    }
  }, [hasgetqemuconfig]);
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

  useEffect(() => {
    if (realVmid) {
      dispatch(getSingleVMDetail(realVmid));
    }
  }, [dispatch, realVmid]);

  const handleConnectClick = async () => {
    if (vmStatus === "Stopped" && customRequestStatus) {
      const result = await Swal.fire({
        title: "Virtual Machine is Stopped",
        text: "This VM is currently stopped. If you force start it, your request against this VM may be automatically rejected. Do you want to continue?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Start VM",
        cancelButtonText: "No, Cancel",
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        // User clicked YES → Start VM
        setOverlayLoading(true);
        updateStatus("Processing request...");
        await dispatch(
          rejectStoppedVm({
            vmid: realVmid,
          }),
        );
        updateStatus("Starting virtual machine...");
        setTimeout(() => {
          setOverlayLoading(false);
          connect(); // 🚀 Continue normal VNC flow
        }, 3000);
      } catch (err) {
        setOverlayLoading(false);
        Swal.fire(
          "Failed",
          "Unable to start the virtual machine. Please try again later.",
          "error",
        );
      }

      return;
    }
    if (vmStatus === "Stopped" && !customRequestStatus) {
      try {
        setOverlayLoading(true);
        updateStatus("Starting virtual machine...");

        await dispatch(
          vmStartScenario({
            vmid: realVmid,
            vmType,
          }),
        );

        setTimeout(() => {
          setOverlayLoading(false);
          connect();
        }, 3000);
      } catch (err) {
        setOverlayLoading(false);
        Swal.fire(
          "Failed",
          "Unable to start the virtual machine. Please try again later.",
          "error",
        );
      }

      return;
    }

    //  VM is not stopped → connect directly
    connect();
  };
  const fetchVNCTicket = async () => {
    const res = await fetch(
      backend.replace(/^ws/, "http") +
        `/ticket?vmid=${encodeURIComponent(
          realVmid,
        )}&vmType=${encodeURIComponent(vmType)}&cleanName=${encodeURIComponent(
          cleanName,
        )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessTokenLearner")}`,
          "Content-Type": "application/json",
        },
      },
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
      // await dispatch(vmStartScenario({ vmid, vmType }));
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
        "",
      )}/vnc?vmid=${encodeURIComponent(vmid)}&vmType=${encodeURIComponent(
        vmType,
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

  const closeVNC = () => {
    intentionalDisconnect.current = true;

    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect();
      } catch (e) {
        console.error("VNC disconnect error:", e);
      }
      rfbRef.current = null;
    }

    setConnected(false);
    setSidebarOpen(false);
    setStatus(
      "The VM is currently stopped Please click on the component again to start the VM and connect to the console.",
    );
  };
  const wrapperRef = useRef(null);
  const toggleFullscreen = () => {
    if (wrapperRef.current) {
      if (!document.fullscreenElement) {
        wrapperRef.current
          .requestFullscreen()
          .catch((err) =>
            console.error(`Error attempting fullscreen: ${err.message}`),
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
          await dispatch(vmStartScenario({ vmid: realVmid, vmType }));
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
          await dispatch(vmRestartScenario({ vmid: Number(realVmid), vmType }));
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
  useEffect(() => {
    if (realVmid && vmType) {
      dispatch(getSnapshot({ vmid: Number(realVmid), vmType }));
    }
  }, [realVmid, vmType]);

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
        prev.filter((s) => s.snapshot_name !== snapName),
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

  const [showConvertDrawer, setShowConvertDrawer] = useState(false);
  const [vmDetails, setVmDetails] = useState({
    memory: "",
    cpu: "",
    ports: [],
    storage: "",
  });

  // const handleOpenDrawer = () => setShowConvertDrawer(true);
  const handleOpenDrawer = async () => {
    setShowConvertDrawer(true); // open drawer immediately

    const payload = {
      vmid: Number(realVmid),
      vmType: getVMdetail?.data?.componenttype,
    };
    const result = await dispatch(qemuconfig(payload));
  };

  const handleCloseDrawer = () => {
    setShowConvertDrawer(false);
    formik.resetForm();
  };
  useEffect(() => {
    if (getVMdetail?.data) {
      const details = getVMdetail.data;
      setVmDetails({
        memory: details.memory || "N/A",
        cpu: details.cores || "N/A",
        ports: details.network_ports ? details.network_ports.split("\n") : [],
        storage: details.storage || "N/A",
      });
    }
  }, [getVMdetail]);

  useEffect(() => {
    dispatch(getCategoriesList());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(catListData) && catListData.length > 0) {
      const formatted = catListData.map((item) => ({
        label: item.componentcategory,
        value: item.componentcategoryid,
      }));
      setCatDropDownData(formatted);
    }
  }, [catListData]);

  const handleUpload = (name = "", files = "", flag = "") => {
    formik.setFieldValue("flag", flag); // Set remove or update
    if (ismulti) {
      let selectedFiles = [];
      files.filter((f) => {
        selectedFiles.push(f.file);
      });
      let filesStr = selectedFiles.join(",");
      // formik.setFieldValue(name, filesStr ? filesStr : "");
      setUploadedFile(files && files.length > 0 && filesStr ? filesStr : "");
    } else {
      formik.setFieldValue(name, files[0]?.file ? files[0]?.file : "");
    }
  };
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      // componentName: "",
      componentName: getVMdetail?.data?.componentname
        ? `${getVMdetail.data.componentname}.NEW`
        : "",
      componentcategoryid: "",
      duration: "", // <-- added
      componentimage: "",
    },
    validationSchema: Yup.object({
      componentName: Yup.string()
  .required("Component name is required")
  .matches(
    /^[A-Za-z0-9.-]{1,63}$/,
    "Only letters (a-z, A-Z), numbers (0-9), dash (-) and dot (.) are allowed. No spaces, underscore or special characters.",
  )
  .test(
    "no-leading-dash",
    "Component name cannot start with '-'",
    (value) => !value || !/^-/.test(value),
  )
  .test(
    "no-trailing-dash",
    "Component name cannot end with '-'",
    (value) => !value || !/-$/.test(value),
  )
  .test(
    "no-leading-dot",
    "Component name cannot start with '.'",
    (value) => !value || !/^\./.test(value),
  )
  .test(
    "no-trailing-dot",
    "Component name cannot end with '.'",
    (value) => !value || !/\.$/.test(value),
  ),

      componentcategoryid: Yup.string().required(
        "Component category is required",
      ),
      duration: Yup.number().nullable(), // optional field
      componentimage: Yup.string().nullable(),
    }),

    onSubmit: async (values) => {
      try {
        setIsSaving(true);
        setOverlayLoading(true);
        const approvalFlag = qemuConfigRef?.current?.approvalFlag;
        const stopMessage = qemuConfigRef?.current?.stopMessage;
        const mustStopVM = qemuConfigRef?.current?.mustStopVM;
        if (mustStopVM === true) {
          const stopConfirm = await Swal.fire({
            title: "Stop Virtual Machine?",
            text:
              stopMessage ||
              "This action requires stopping the virtual machine. Do you want to continue?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Stop it",
            cancelButtonText: "No, Cancel",
          });

          //  User clicked NO → STOP submission completely
          if (!stopConfirm.isConfirmed) {
            setIsSaving(false);
            return;
          }
          const stopRes = await dispatch(
            stopVm({
              vmid: realVmid,
              vmType: getVMdetail?.data?.componenttype,
            }),
          );
          if (stopRes?.statusCode === 200) {
            closeVNC();
            Swal.fire(
              "Success",
              stopRes?.message || "Successfully stopped VM",
              "success",
            );
          } else {
            await Swal.fire(
              "Error",
              stopRes?.message || "Failed to stop VM",
              "error",
            );
            setShowConvertDrawer(false);
            return;
          }
        }

        /************** AUTO APPROVAL *****************/
        if (approvalFlag === true) {
          const payload1 = {
            componentname: values.componentName,
            componentcategoryid: values.componentcategoryid,
            scenarioid: getVMdetail?.data?.scenarioid,
            componenttype: getVMdetail?.data?.componenttype,
            learner_id: getVMdetail?.data?.learner_id,
            clone_vmid: realVmid,
            duration: values.duration || null,
            componentimage: values.componentimage || "",
          };

          const saveRes = await dispatch(saveCustomComponent(payload1));
          if (!saveRes?.success) {
            setIsSaving(false);
            setOverlayLoading(false);
            await Swal.fire(
              "Error",
              saveRes?.error?.error ||
                saveRes?.error?.message
            );
            setShowConvertDrawer(false);
            return;
          }

          //THEN CREATE ACTUAL COMPONENT
          const payload = {
            componentname: values.componentName,
            componentcategoryid: values.componentcategoryid,
            subcategoryTypeid: getVMdetail?.data?.componenttype,
            scenarioid: getVMdetail?.data?.scenarioid,
            learner_id: getVMdetail?.data?.learner_id,
            vmid: realVmid,
            vmid_name: getVMdetail?.data?.vmid_name,
            duration: values.duration || null,
            componentimage: values.componentimage || "",
            customcomponentid: saveRes?.data?.customcomponentid,
          };
          const res = await dispatch(saveComponent(payload));

          if (!res?.success) {
            setOverlayLoading(false);
            setIsSaving(false);
            await Swal.fire(
              "Error",
              res?.error?.error ||
                res?.error?.message ||
                "Failed to Save component",
              "error",
            );
            setShowConvertDrawer(false);
            return;
          }

          Swal.fire("Success", "Component created successfully", "success");
          setShowConvertDrawer(false);
          dispatch(clearCustomComponent());
          dispatch(clearSaveComponent());
          formik.resetForm();
          return;
        }

        /************** MANUAL APPROVAL CONFIRMATION *****************/
        const confirmResult = await Swal.fire({
          title: "Are you sure?",
          text: stopMessage || "Do you want to proceed?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, proceed",
          cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;
        /************** SAVE CUSTOM COMPONENT (MANUAL APPROVAL) *****************/
        const payload1 = {
          componentname: values.componentName,
          componentcategoryid: values.componentcategoryid,
          scenarioid: getVMdetail?.data?.scenarioid,
          componenttype: getVMdetail?.data?.componenttype,
          learner_id: getVMdetail?.data?.learner_id,
          clone_vmid: realVmid,
          duration: values.duration || 0,
          componentimage: values.componentimage || "",
        };

        const saveRes = await dispatch(saveCustomComponent(payload1));

        if (!saveRes?.success) {
          await Swal.fire(
            "Error",
            saveRes?.error?.error ||
              saveRes?.error?.message ||
              "Failed to save component",
            "error",
          );
          setShowConvertDrawer(false);
          return;
        }

        Swal.fire(
          "Success",
          "Component creation request submitted successfully. Approval may take some time.",
          "success",
        );

        setShowConvertDrawer(false);
        dispatch(clearCustomComponent());
        dispatch(clearSaveComponent());
        formik.resetForm();
      } catch (err) {
        console.error("Unexpected error:", err);
        Swal.fire("Error", "Something went wrong", "error");
        // setShowConvertDrawer(false);
      } finally {
        // await dispatch(vmStartScenario({ vmid: realVmid, vmType }));
        setOverlayLoading(false);
        setIsSaving(false); // stop loading
      }
    },
  });
  /* ============================================================
     LANDING HUD — matrix rain canvas, boot log, live telemetry.
     Boot log + telemetry are DERIVED FROM REAL VM DATA
     (getVMdetail / vmDetails). Does not touch VM/session logic above.
  ============================================================ */
  const matrixCanvasRef = useRef(null);
  const vmMeta = getVMdetail?.data;

  const bootScript = useMemo(() => {
    const lines = [
      "> establishing secure tunnel to hypervisor node...",
      "> verifying operator credentials...  [OK]",
    ];
    if (vmMeta) {
      lines.push(
        `> target endpoint: ${vmMeta.componentname || vmMeta.vmid_name || `VM#${realVmid}`}`,
      );
      lines.push(
        `> vmid #${vmMeta.vmid || realVmid}  ·  ${(vmMeta.componenttype || "qemu").toUpperCase()}  ·  status: ${vmMeta.vm_status || "unknown"}`,
      );
      lines.push(
        `> allocating ${vmMeta.cores ?? "?"} vCPU / ${vmMeta.memory ?? "?"} MB RAM / ${vmMeta.storage ?? "?"} GB disk`,
      );
    } else {
      lines.push("> querying scenario inventory...");
    }
    lines.push("> negotiating VNC handshake protocol...");
    lines.push("> siberSIM console bridge ready.");
    lines.push("> awaiting operator input_");
    return lines;
  }, [vmMeta, realVmid]);

  const [bootLog, setBootLog] = useState([]);
  const [telemetry, setTelemetry] = useState({ cpu: 6, mem: 10, net: 4, disk: 8 });
  const baseTelemetryRef = useRef({ cpu: 6, mem: 10, net: 4, disk: 8 });
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  useEffect(() => {
    if (connected || skipConnectUI) return;
    let cancelled = false;
    setBootLog([]);
    let i = 0;
    const typeNext = () => {
      if (cancelled || i >= bootScript.length) return;
      setBootLog((prev) => [...prev, bootScript[i]]);
      i += 1;
      setTimeout(typeNext, 520 + Math.random() * 260);
    };
    const kickoff = setTimeout(typeNext, 400);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
    };
  }, [connected, skipConnectUI, bootScript]);

  // Recompute the telemetry baseline from the real VM spec whenever it loads/changes.
  useEffect(() => {
    const cores = Number(vmDetails?.cpu) || 0;
    const mem = Number(vmDetails?.memory) || 0;
    const netCount = Array.isArray(vmDetails?.ports) ? vmDetails.ports.length : 0;
    const disk = Number(vmDetails?.storage) || 0;

    const base = {
      cpu: cores > 0 ? clamp((cores / 16) * 100, 6, 100) : 6,
      mem: mem > 0 ? clamp((mem / 16384) * 100, 8, 100) : 8,
      net: netCount > 0 ? clamp(netCount * 22, 10, 100) : 4,
      disk: disk > 0 ? clamp((disk / 500) * 100, 8, 100) : 8,
    };
    baseTelemetryRef.current = base;
    setTelemetry(base);
  }, [vmDetails]);

  // Gentle live jitter around the real baseline so the HUD still feels "alive".
  useEffect(() => {
    if (connected || skipConnectUI) return;
    const id = setInterval(() => {
      const base = baseTelemetryRef.current;
      setTelemetry({
        cpu: clamp(base.cpu + (Math.random() * 8 - 4), 2, 100),
        mem: clamp(base.mem + (Math.random() * 6 - 3), 2, 100),
        net: clamp(base.net + (Math.random() * 16 - 8), 1, 100),
        disk: clamp(base.disk + (Math.random() * 3 - 1.5), 2, 100),
      });
    }, 1500);
    return () => clearInterval(id);
  }, [connected, skipConnectUI]);

  useEffect(() => {
    if (connected || skipConnectUI) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const glyphs = "01アイウエオカキクケコサシスセソ0123456789ABCDEF{}<>/#$";
    let cols = 0;
    let drops = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.floor(canvas.width / 16);
      drops = new Array(cols).fill(0).map(() => Math.random() * -40);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "rgba(3,6,10,0.14)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "14px monospace";
      for (let x = 0; x < cols; x++) {
        const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        const isHead = Math.random() > 0.94;
        ctx.fillStyle = isHead ? "rgba(160,255,220,0.9)" : "rgba(0,180,216,0.35)";
        ctx.fillText(glyph, x * 16, drops[x] * 16);
        if (drops[x] * 16 > canvas.height && Math.random() > 0.975) {
          drops[x] = 0;
        }
        drops[x]++;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [connected, skipConnectUI]);

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
                  (s) => s.snapshotid === selectedSnapshotId,
                );
                if (!selected) {
                  setShowWarning(true);
                  return;
                }
                handleDeleteSnapshott(
                  selected.snapshot_name,
                  selected.snapshotid,
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
                        >
                          Start
                        </button>

                        <button
                          onClick={handleRestartClick}
                          style={subButtonStyle}
                        >
                          Hard Reset
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    style={buttonStyle}
                  >
                    ⛶
                  </button>

                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                      title="Settings"
                      style={buttonStyle}
                    >
                      ⚙️
                    </button>

                    {settingsMenuOpen && (
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
                        {/* Snapshot Rollback */}
                        <button
                          onClick={handleCreateSnapshot}
                          style={subButtonStyle}
                          title="Snapshot VM"
                        >
                          Snapshot
                        </button>
                        <Button
                          disabled={snapshotApiData.length === 0}
                          onClick={() => {
                            if (snapshotApiData.length > 0) {
                              dispatch(
                                getSnapshot({ vmid: Number(realVmid), vmType }),
                              );
                              setShowRollbackModal(true);
                            }
                          }}
                          style={{
                            ...subButtonStyle,
                            opacity: snapshotApiData.length === 0 ? 0.5 : 1,
                            cursor:
                              snapshotApiData.length === 0
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Rollback Snapshot
                        </Button>

                        {/* Convert Component */}
                        <button
                          onClick={handleOpenDrawer}
                          style={subButtonStyle}
                        >
                          Convert Component
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
                onClick={handleConnectClick}
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
                      : "NO LINK"}
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
        )}

        {/* Full-screen overlay loader */}
        {overlayLoading && (
          <div className="ssc-overlay">
            Please Wait
            <div className="ssc-spinner" style={{ marginTop: "22px" }} />
          </div>
        )}
        <Modal
          show={showConvertDrawer}
          onHide={handleCloseDrawer}
          centered
          backdrop="static"
          size="xl"
          dialogClassName="convert-modal-dialog"
          contentClassName="convert-modal-content"
        >
          <Modal.Header closeButton className="convert-modal-header">
            <div className="d-flex align-items-center gap-2">
              <div className="modal-icon">🧩</div>
              <Modal.Title>Convert to Component</Modal.Title>
            </div>
          </Modal.Header>
          <hr
            style={{
              borderColor: "white",
              marginTop: "2px",
              marginBottom: "12px",
            }}
          />
          {hasgetqemuconfig?.mustStopVM && hasgetqemuconfig?.stopMessage && (
            <div
              className="p-2 mb-3 rounded-3"
              style={{
                background: "#401010",
                border: "1px solid #FF4D4D",
                color: "#FF4D4D",
                fontSize: "12px",
                fontWeight: "500",
                margin: "10px 25px",
              }}
            >
              {hasgetqemuconfig.stopMessage}
            </div>
          )}
          <Modal.Body
            className="px-4 d-flex flex-column"
            style={{ flex: 1, overflow: "hidden" }}
          >
            <Form
              onSubmit={formik.handleSubmit}
              className="d-flex flex-column h-100"
            >
              <Row className="g-4 align-items-start">
                {/* ================= LEFT SECTION ================= */}
                <Col md={5}>
                  <div className="convert-card">
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-modern">
                        Component Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="componentName"
                        placeholder="Enter component name"
                        value={formik.values.componentName}
                        onChange={formik.handleChange}
                        className="modern-input"
                          isInvalid={
      formik.touched.componentName && formik.errors.componentName
    }
                      />
                        {formik.touched.componentName && formik.errors.componentName && (
    <Form.Control.Feedback type="invalid">
      {formik.errors.componentName}
    </Form.Control.Feedback>
  )}
                    </Form.Group>
                    <Row>
                      {/* Category */}
                      <Col md={12}>
                        <Form.Group className="mb-4">
                          <Form.Label className="form-label-modern">
                            Component Category
                          </Form.Label>
                          <Form.Select
                            name="componentcategoryid"
                            value={formik.values.componentcategoryid}
                            onChange={formik.handleChange}
                            className="modern-input"
                             isInvalid={
      formik.touched.componentcategoryid && formik.errors.componentcategoryid
    }
                          >
                            <option value="">Select Category</option>
                            {catDropDownData.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </Form.Select>
                            {formik.touched.componentcategoryid &&
                            formik.errors.componentcategoryid && (
                              <Form.Control.Feedback type="invalid">
                                {formik.errors.componentcategoryid}
                              </Form.Control.Feedback>
                            )}
                        </Form.Group>
                      </Col>

                      {/* Delay */}
                      <Col md={12}>
                        <Form.Group className="mb-4">
                          <Form.Label className="form-label-modern">
                            Configuration Delay (Sec)
                          </Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="Enter configuartion delay"
                            name="duration"
                            value={formik.values.duration}
                            onChange={formik.handleChange}
                            className="modern-input"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4" controlId="componentimage">
                      <Form.Label className="form-label-modern">
                        Upload Component Image
                      </Form.Label>
                      <div className="upload-box">
                        <FileUploader
                          className="file-uploader-container"
                          folderpath={category_path}
                          ismulti={false}
                          name="componentimage"
                          acceptedFileTypes={["image/png", "image/jpeg"]}
                          handleUpload={handleUpload}
                          fetchfiles={
                            formik.values.componentimage
                              ? [formik.values.componentimage]
                              : []
                          }
                        />
                      </div>
                    </Form.Group>
                    {formik.values.componentimage && (
                      <div className="preview-wrapper mt-3">
                        <img
                          alt="Component Preview"
                          src={`${process.env.API_URL_FILEMANAGER}${formik.values.componentimage}`}
                          className="preview-image"
                        />
                      </div>
                    )}
                  </div>
                </Col>

                {/* ================= RIGHT SECTION ================= */}
                <Col md={7}>
                  <div className="convert-card">
                    <div className="vm-header d-flex justify-content-between align-items-center mb-3">
                      <h6 className="section-title">VM Details</h6>
                    </div>

                    <div className="vm-row">
                      <span>Virtual Memory</span>
                      <span className="vm-badge">
                        {vmDetails?.memory || "0"} MB
                      </span>
                    </div>

                    <div className="vm-row">
                      <span>Virtual CPU</span>
                      <span className="vm-badge">
                        {vmDetails?.cpu || "0"} Cores
                      </span>
                    </div>

                    <div className="vm-row align-items-start">
                      <span>Network Ports</span>
                      <div className="network-box">
                        {vmDetails?.ports?.length > 0
                          ? vmDetails.ports.map((p, i) => (
                              <div key={i}>{p}</div>
                            ))
                          : "No Network Configured"}
                      </div>
                    </div>

                    <div className="vm-row">
                      <span>Storage Size</span>
                      <span className="vm-badge">
                        {vmDetails?.storage || "0"} GB
                      </span>
                    </div>

                    <div className="vm-footer-note">
                      <i className="fa fa-info-circle info-icon"></i>
                      <span className="ml-4">
                        These settings are derived from the source VM template.
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* ================= FOOTER ================= */}
              <div className="convert-footer">
                <Button
                  variant="outline-light"
                  onClick={handleCloseDrawer}
                  disabled={isSaving}
                  className="rounded-pill px-4"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="convert-btn"
                >
                  Convert & Save
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/*
          Landing/connect-screen styling (the .ssc-* / .tele-* rules) now
          lives in a global stylesheet — see proxmox-console.css.
          Import it once in pages/_app.js, e.g.:
            import "../styles/proxmox-console.css";
        */}
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

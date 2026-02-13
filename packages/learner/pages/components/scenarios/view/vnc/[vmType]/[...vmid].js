"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Button,
  OverlayTrigger,
  Tooltip,
  Offcanvas,
  Form,
  Table,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import Select from "react-select";
import {
  saveComponent,
  saveCustomComponent,
  vmStartScenario,
  vmRestartScenario,
  saveSnapshot,
  clearSaveSnapshot,
  getSnapshot,
  deleteSnapshot,
  restoresnapshot,
  getSingleVMDetail,
  clearCustomComponent,
  clearSaveComponent,
  qemuconfig,
  stopVm,
  rejectStoppedVm,
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
        // ❌ User clicked NO
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

        await dispatch(
          vmStartScenario({
            vmid: realVmid,
            vmType,
          }),
        );

        // Optional small delay to allow VM to boot
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
        } catch { }
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
        } catch { }
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
  console.log("showWarning", showWarning);

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
    console.log("payloadpayloadpayloadpayload", payload);

    const result = await dispatch(qemuconfig(payload));
    console.log("resultresultresult", result);
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
      formik.setFieldValue(name, filesStr ? filesStr : "");
      setUploadedFile(files && files.length > 0 && filesStr ? filesStr : "");
    } else {
      formik.setFieldValue(name, files[0]?.file ? files[0]?.file : "");
      setUploadedFile(
        files && files.length > 0 && files[0]?.file ? files[0]?.file : "",
      );
    }
  };
  console.log("getVMdetail", getVMdetail);

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

      // componentName: Yup.string()
      //   .required("Component name is required")
      //   .test(
      //     "no-leading-trailing-spaces",
      //     "Component name must not have spaces at the beginning or end",
      //     (value) => value === value?.trim(),
      //   ),
      componentName: Yup.string()
        .required("Component name is required")
        .matches(
          /^[A-Za-z0-9-]{1,63}$/,
          "Only letters, numbers and dash (-) allowed. No spaces, underscore or full stop."
        )
        .test(
          "no-leading-dash",
          "Component name cannot start with '-'",
          value => !value || !/^-/.test(value)
        )
        .test(
          "no-trailing-dash",
          "Component name cannot end with '-'",
          value => !value || !/-$/.test(value)
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

        console.log("approvalFlag", approvalFlag);
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
          console.log("stopRes", stopRes);
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
          // 1️⃣ SAVE CUSTOM COMPONENT FIRST
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
          console.log("saveRes", saveRes?.data?.customcomponentid);
          if (!saveRes?.success) {
            setIsSaving(false);
            setOverlayLoading(false);
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

          // 2️⃣ THEN CREATE ACTUAL COMPONENT
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
          console.log("payload", payload);
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
              // onClick={connect}
              onClick={handleConnectClick}
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
            Please Wait...
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
            Please Wait...
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

        {/* Convert Component Drawer */}
        <Offcanvas
          show={showConvertDrawer}
          onHide={handleCloseDrawer}
          placement="end"
          backdrop="static"
          className=" text-light"
          style={{ width: "900px", background: "#24243E" }}
        >
          <Offcanvas.Header
            closeButton
            closeVariant="white"
            className="d-flex align-items-center justify-content-between mt-2"
            style={{ position: "relative" }}
          >
            <Offcanvas.Title
              className="fw-semibold"
              style={{ marginBottom: "0" }}
            >
              Convert to Component
            </Offcanvas.Title>
          </Offcanvas.Header>
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

          <Offcanvas.Body style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <Form onSubmit={formik.handleSubmit} className="px-2">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4" controlId="componentName">
                    <Form.Label className="fw-semibold text-white mb-1">
                      Component Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="componentName"
                      placeholder="Enter component name"
                      value={formik.values.componentName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="custom-input"
                    />
                    {formik.touched.componentName &&
                      formik.errors.componentName && (
                        <div className="text-danger small mt-1">
                          {formik.errors.componentName}
                        </div>
                      )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-4" controlId="componentcategoryid">
                    <Form.Label className="fw-semibold mb-1 text-white">
                      Component Category
                    </Form.Label>
                    <Form.Select
                      name="componentcategoryid"
                      value={formik.values.componentcategoryid}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="custom-input"
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary25: "var(--primary-bg-color)",
                          primary: "var(--primary-bg-color)",
                        },
                      })}
                    >
                      <option value="">-- Select Category --</option>
                      {catDropDownData.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Form.Select>
                    {formik.touched.componentcategoryid &&
                      formik.errors.componentcategoryid && (
                        <div className="text-danger small mt-1">
                          {formik.errors.componentcategoryid}
                        </div>
                      )}
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4" controlId="duration">
                    <Form.Label className="fw-semibold text-white mb-1">
                      Configuration Delay (Seconds)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="duration"
                      placeholder="Enter duration"
                      value={formik.values.duration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="custom-input"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-4" controlId="componentimage">
                    <Form.Label className="fw-semibold text-white mb-1">
                      Upload Component Image
                    </Form.Label>

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
                    {formik.values.componentimage && (
                      <div className="picture avatar-lg online text-center mt-2">
                        <img
                          alt="Component Preview"
                          src={`${process.env.API_URL_FILEMANAGER}${formik.values.componentimage}`}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = dummy_network.src;
                          }}
                        />
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <div
                className="rounded-4 p-3 mb-4"
                style={{
                  background: "#0E0E23",
                  boxShadow: "0 0 10px rgba(0,0,0,0.4)",
                  overflow: "hidden",
                }}
              >
                <h6
                  className="fw-semibold mb-3"
                  style={{ letterSpacing: "0.4px" }}
                >
                  VM Details
                </h6>

                <Table
                  bordered
                  responsive
                  size="sm"
                  className="mb-0 text-light vm-table "
                  style={{
                    borderColor: "#000000ff", // or #0E0E23 for invisible border
                  }}
                >
                  <thead>
                    <tr style={{ background: "#0E0E23" }}>
                      <th className="text-center" style={{ color: "#fff" }}>
                        PROPERTY
                      </th>
                      <th className="text-center" style={{ color: "#fff" }}>
                        VALUE
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ background: "#0E0E23" }}>
                    <tr>
                      <td>Virtual Memory</td>
                      <td>
                        {vmDetails?.memory ? `${vmDetails.memory} M ` : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td>Virtual CPU</td>
                      <td>
                        {vmDetails?.cpu ? `${vmDetails.cpu} cores` : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td>Network Ports</td>
                      {/* <td style={{ whiteSpace: "pre-wrap" }}>{vmDetails.ports}</td> */}
                      <td>
                        {vmDetails.ports?.length > 0
                          ? vmDetails.ports.map((p, i) => (
                            <div key={i}>{p}</div>
                          ))
                          : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td>Storage Size</td>
                      <td>
                        {vmDetails?.storage ? `${vmDetails.storage} GB` : "N/A"}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-3">
                <Button
                  variant="outline-light"
                  onClick={handleCloseDrawer}
                  className="px-4 rounded-4"
                  disabled={isSaving}
                >
                  Close
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 rounded-4"
                  style={{ background: "#19B159", borderColor: "#19B159" }}
                >
                  {isSaving ? (
                    <>
                      <Spinner
                        as="span"
                        animation="grow"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      Loading...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </Form>
          </Offcanvas.Body>
        </Offcanvas>

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

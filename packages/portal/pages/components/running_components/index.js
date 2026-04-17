import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  Overlay,
  OverlayTrigger,
  Tooltip,
  Badge,
  Dropdown,
  Popover,
  Spinner
} from "react-bootstrap";

import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import {
  getrunningcomponent,
  stopcomponent,
  startcomponent,
  restartcomponent,
  listRunningScenarios,
  listAllExceptRunning,
} from "../../../shared/redux/slices/runningComponents/runningComponents.js";
import Seo from "../../../shared/layout-components/seo/seo";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import PaginationComponent from "../../../shared/data/common/pagination.js";

const RunningComponent = () => {
  const dispatch = useDispatch();
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [learnerOptions, setLearnerOptions] = useState([]);
  const [scenType, setScenType] = useState("Running");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordSize, setRecordSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const totalPages = Math.ceil(totalCount / recordSize);
  const startIndex = (currentPage - 1) * recordSize + 1;
  let endIndex = currentPage * recordSize;
  if (endIndex > totalCount) endIndex = totalCount;
  const perPageCount = [10, 20, 50, 100];
  const [popoverData, setPopoverData] = useState({
    show: false,
    target: null,
    row: null,  
  });
  const [componentLoading, setComponentLoading] = useState({
    vmid: null,
    action: null,
  });

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const isDarkNow = document.body.classList.contains("dark-theme");
    setIsDark(isDarkNow);
    const observer = new MutationObserver(() => {
      const isDarkNow = document.body.classList.contains("dark-theme");
      setIsDark(isDarkNow);
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const {
    runningComponents,
    runningLearners,
    hasgetlistRunningScenariosSucc,
    hasgetlistAllExceptRunningSucc,
  } = useSelector((state) => {
    return {
      runningComponents: state?.runningComponent?.getrunningcomponentSucc?.data,
      hasgetlistRunningScenariosSucc:state?.runningComponent?.listRunningScenariosData,
      hasgetlistAllExceptRunningSucc:state?.runningComponent?.listAllExceptRunningData,
    };
  });

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "",
      cellRenderer: "srNoRender",
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      sortable: false,
      headerTooltip: "Sr No.",
    },
    {
      headerName: "Scenario Title",
      field: "scenariotitle",
      filter: true,
      floatingFilter: true,
      minWidth: 200,
      tooltipValueGetter: (params) => params.value,
      headerTooltip: "Scenario Title",
    },
    {
      headerName: "Component Name",
      field: "componentname",
      filter: true,
      floatingFilter: true,
      minWidth: 200,
      tooltipValueGetter: (params) => params.value,
      headerTooltip: "Component Name",
    },
     {
      headerName: "VMID",
      field: "vmid",
      filter: true,
      floatingFilter: true,
      minWidth: 110,
      tooltipValueGetter: (params) => params.value,
      headerTooltip:  "VMID",
    },
    {
      headerName: "Scenario Identification",
      field: "scenarioidentification",
      filter: true,
      floatingFilter: true,
      minWidth: 200,
      tooltipValueGetter: (params) => params.value,
      headerTooltip:"Scenario Identification",
    },
    {
      headerName: "Scenario Level",
      field: "scenariolevel",
      filter: true,
      floatingFilter: true,
      minWidth: 140,
      tooltipValueGetter: (params) => params.value,
      cellRenderer: "scenarioLevelRenderer",
      headerTooltip: "Scenario Level",
    },
    {
      headerName: "Component Type",
      field: "componenttype",
      filter: true,
      floatingFilter: true,
      minWidth: 140,
      tooltipValueGetter: (params) => params.value,
      headerTooltip: "Component Type",
    },
    {
      headerName: "Status",
      field: "status",
      pinned: "right",
      filter: true,
      floatingFilter: true,
      width: 130,
      minWidth: 130,
      maxWidth: 130,
      cellRenderer: "vmStatusRenderer",
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      width: 90,
      minWidth: 90,
      maxWidth: 90,
      pinned: "right",
      cellRenderer: "actionButtonRenderer",
      hide: scenType !== "Running",
    },
  ];

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    vmStatusRenderer: (props) => {
      const status = props.value;

      const getStyle = () => {
        switch (status) {
          case "Running":
            return "rgba(70, 245, 111, 0.16)";
          case "Initializing":
          case "Cloning":
          case "Bridge Configuration":
          case "Starting":
            return "rgba(75, 145, 250, 0.35)";
          case "Pause":
          case "Hibernate":
            return "rgba(255, 193, 7, 0.26)";
          case "Stopped":
          case "Destroyed":
            return "rgba(214, 72, 6, 0.15)";
          case "Failed":
          case "Operation Failed":
            return "rgba(220, 53, 70, 0.71)";
          case "Completed":
            return "rgba(252, 202, 54, 0.28)";
          default:
            return "rgba(173, 181, 189, 0.25)";
        }
      };
      const bg = getStyle();

      const badge = (
        <span
          className="badge"
          style={{
            backgroundColor: bg,
            color: "#ffffff",
            fontSize: "12px",
            padding: "5px 10px",
            borderRadius: "12px",
            border: `1px solid ${bg}`,
            cursor: status === "Stopped" ? "pointer" : "default",
          }}
        >
          {status}
        </span>
      );

      if (status === "Stopped") {
            const item = props.data;
      const handleClick = async (e) => {
        const target = e.currentTarget;
        await dispatch(getrunningcomponent({ vmrequestid: item.vmrequestid }));
        setPopoverData({
          show: true,
          target: target,
          row: item,
        });
      };
      return (
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id={`tooltip-${item.vmrequestid}`}>Component List</Tooltip>
          }
        >
          <div
            onClick={handleClick}
          >
             {badge}
          </div>
        </OverlayTrigger>
      );
      }

      return badge;
    },
    actionButtonRenderer: function (props) {
      const item = props.data;
      const handleClick = async (e) => {
        const target = e.currentTarget;
        await dispatch(getrunningcomponent({ vmrequestid: item.vmrequestid }));
        setPopoverData({
          show: true,
          target: target,
          row: item,
        });
      };
      return (
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id={`tooltip-${item.vmrequestid}`}>Component List</Tooltip>
          }
        >
          <div
            className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle"
            onClick={handleClick}
          >
            <i className="fe fe-layers"></i>
          </div>
        </OverlayTrigger>
      );
    },

    scenarioLevelRenderer: (props) => {
      const level = props.value?.toLowerCase();

      const getStyle = () => {
        switch (level) {
          case "high":
          case "hard":
            return "rgba(220, 53, 70, 0.71)";
          case "medium":
            return "rgba(255, 193, 7, 0.26)";
          case "low":
          case "easy":
            return "rgba(70, 245, 111, 0.16)";
          default:
            return "rgba(108, 117, 125, 0.4)";
        }
      };

      const bg = getStyle();

      return (
        <span
          className="badge"
          style={{
            backgroundColor: bg,
            color: "white",
            fontSize: "12px",
            padding: "5px 10px",
            borderRadius: "12px",
            textTransform: "capitalize",
            border: `1px solid ${bg}`,
          }}
        >
          {props.value}
        </span>
      );
    },
  };

  // const handleStartComponent = (comp) => {
  //   Swal.fire({
  //     title: "Start Component?",
  //     text: `Do you want to start ${comp.componentname}?`,
  //     icon: "question",
  //     showCancelButton: true,
  //     confirmButtonColor: "#22c55e",
  //     cancelButtonColor: "#6b7280",
  //     confirmButtonText: "Yes, Start",
  //     customClass: { container: "swal2-container-custom" },
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       try {
  //         setComponentLoading({ vmid: comp.vmid, action: "start" });
  //         await dispatch(
  //           startcomponent({ vmrequestid: comp.vmrequestid, vmid: comp.vmid }),
  //         );

  //         if (scenType === "Running") {
  //           dispatch(
  //             listRunningScenarios({ page: currentPage, limit: recordSize }),
  //           );
  //         }
  //         setPopoverData({
  //           show: false,
  //           target: null,
  //           row: null,
  //         });
  //         toast.success(
  //           <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
  //             Component Started Successfully
  //           </p>,
  //           {
  //             position: toast.POSITION.TOP_RIGHT,
  //             hideProgressBar: false,
  //             theme: "colored",
  //           },
  //         );
  //       } catch (err) {
  //         toast.error(
  //           <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
  //             Component failed to start
  //           </p>,
  //           {
  //             position: toast.POSITION.TOP_RIGHT,
  //             hideProgressBar: false,
  //             theme: "colored",
  //           },
  //         );
  //       } finally {
  //         setComponentLoading({ vmid: null, action: null });
  //       }
  //     }
  //   });
  // };

  // const handleStopComponent = (comp) => {
  //   Swal.fire({
  //     title: "Stop Component?",
  //     text: `Do you want to stop ${comp.componentname}?`,
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#ef4444",
  //     cancelButtonColor: "#6b7280",
  //     confirmButtonText: "Yes, Stop",
  //     customClass: {
  //       container: "swal2-container-custom",
  //     },
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       try {
  //         setComponentLoading({ vmid: comp.vmid, action: "stop" });
  //         await dispatch(
  //           stopcomponent({ vmrequestid: comp.vmrequestid, vmid: comp.vmid }),
  //         );

  //         if (scenType === "Running") {
  //           dispatch(
  //             listRunningScenarios({ page: currentPage, limit: recordSize }),
  //           );
  //         }
  //         setPopoverData({
  //           show: false,
  //           target: null,
  //           row: null,
  //         });
  //         toast.success(
  //           <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
  //             Component Stopped Successfully
  //           </p>,
  //           {
  //             position: toast.POSITION.TOP_RIGHT,
  //             hideProgressBar: false,
  //             theme: "colored",
  //           },
  //         );
  //       } catch (err) {
  //         toast.error(
  //           <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
  //             Component failed to stop
  //           </p>,
  //           {
  //             position: toast.POSITION.TOP_RIGHT,
  //             hideProgressBar: false,
  //             theme: "colored",
  //           },
  //         );
  //       } finally {
  //         setComponentLoading({ vmid: null, action: null });
  //       }
  //     }
  //   });
  // };

  const handleStartComponent = (comp) => {
  Swal.fire({
    title: "Start Component?",
    text: `Do you want to start ${comp.componentname}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#22c55e",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Start",
    customClass: { container: "swal2-container-custom" },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        setComponentLoading({ vmid: comp.vmid, action: "start" });

        const res = await dispatch(
          startcomponent({ vmrequestid: comp.vmrequestid, vmid: comp.vmid })
        );
        const statusCode = res?.data?.statusCode;
        if (statusCode === 200) {
           const payload = {
            page: currentPage,
            limit: recordSize,
            search: searchText, 
          };
          if (scenType === "Running") {
            dispatch(listRunningScenarios(payload));
          } else {
            dispatch(listAllExceptRunning(payload));
          }
          setPopoverData({ show: false, target: null, row: null });
          toast.success(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              Component Started Successfully
            </p>,
            { position: toast.POSITION.TOP_RIGHT, theme: "colored" }
          );
        } else {
          throw new Error(res?.payload?.message || "Start failed");
        }
      } catch (err) {
        toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {err.message || "Component failed to start"}
          </p>,
          { position: toast.POSITION.TOP_RIGHT, theme: "colored" }
        );
      } finally {
        setComponentLoading({ vmid: null, action: null });
      }
    }
  });
};
  const handleStopComponent = (comp) => {
  Swal.fire({
    title: "Stop Component?",
    text: `Do you want to stop ${comp.componentname}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Stop",
    customClass: { container: "swal2-container-custom" },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        setComponentLoading({ vmid: comp.vmid, action: "stop" });

        const res = await dispatch(
          stopcomponent({ vmrequestid: comp.vmrequestid, vmid: comp.vmid })
        );
        const statusCode = res?.data?.statusCode;

        if (statusCode === 200) {

           const payload = {
            page: currentPage,
            limit: recordSize,
            search: searchText, 
          };
          if (scenType === "Running") {
            dispatch(listRunningScenarios(payload));
          } else {
            dispatch(listAllExceptRunning(payload));
          }

          setPopoverData({ show: false, target: null, row: null });

          toast.success(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              Component Stopped Successfully
            </p>,
            { position: toast.POSITION.TOP_RIGHT, theme: "colored" }
          );
        } else {
          throw new Error(res?.payload?.message || "Stop failed");
        }
      } catch (err) {
        toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {err.message || "Component failed to stop"}
          </p>,
          { position: toast.POSITION.TOP_RIGHT, theme: "colored" }
        );
      } finally {
        setComponentLoading({ vmid: null, action: null });
      }
    }
  });
};

const handleRestartComponent = (comp) => {
  Swal.fire({
    title: "Restart Component?",
    text: `Do you want to restart ${comp.componentname}?`,
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Restart",
    customClass: { container: "swal2-container-custom" },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        setComponentLoading({ vmid: comp.vmid, action: "restart" });

        const res = await dispatch(
          restartcomponent({
            vmrequestid: comp.vmrequestid,
            vmid: comp.vmid,
          })
        );

        const statusCode = res?.data?.statusCode;

        if (statusCode === 200) {

            const payload = {
            page: currentPage,
            limit: recordSize,
            search: searchText, 
          };
          if (scenType === "Running") {
            dispatch(listRunningScenarios(payload));
          } else {
            dispatch(listAllExceptRunning(payload));
          }

          setPopoverData({ show: false, target: null, row: null });

          toast.success(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              Component Restarted Successfully
            </p>,
            { position: toast.POSITION.TOP_RIGHT, theme: "colored" }
          );
        } else {
          throw new Error(res?.payload?.message || "Restart failed");
        }
      } catch (err) {
        toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {err.message || "Component failed to restart"}
          </p>,
          { position: toast.POSITION.TOP_RIGHT, theme: "colored" }
        );
      } finally {
        setComponentLoading({ vmid: null, action: null });
      }
    }
  });
};
  // const handleRestartComponent = (comp) => {
  //   Swal.fire({
  //     title: "Restart Component?",
  //     text: `Do you want to restart ${comp.componentname}?`,
  //     icon: "info",
  //     showCancelButton: true,
  //     confirmButtonColor: "#f59e0b",
  //     cancelButtonColor: "#6b7280",
  //     confirmButtonText: "Yes, Restart",
  //     customClass: {
  //       container: "swal2-container-custom",
  //     },
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       try {
  //         setComponentLoading({ vmid: comp.vmid, action: "restart" });
  //         await dispatch(
  //           restartcomponent({
  //             vmrequestid: comp.vmrequestid,
  //             vmid: comp.vmid,
  //           }),
  //         );

  //         if (scenType === "Running") {
  //           dispatch(
  //             listRunningScenarios({ page: currentPage, limit: recordSize }),
  //           );
  //         }
  //         setPopoverData({
  //           show: false,
  //           target: null,
  //           row: null,
  //         });
  //         toast.success(
  //           <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
  //             Component Restarted Successfully
  //           </p>,
  //           {
  //             position: toast.POSITION.TOP_RIGHT,
  //             hideProgressBar: false,
  //             theme: "colored",
  //           },
  //         );
  //       } catch (err) {
  //         toast.error(
  //           <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
  //             Component failed to restart
  //           </p>,
  //           {
  //             position: toast.POSITION.TOP_RIGHT,
  //             hideProgressBar: false,
  //             theme: "colored",
  //           },
  //         );
  //       } finally {
  //         setComponentLoading({ vmid: null, action: null });
  //       }
  //     }
  //   });
  // };

  useEffect(() => {
    if (runningLearners && runningLearners.length > 0) {
      setLearnerOptions(runningLearners);
    }
  }, [runningLearners]);

  useEffect(() => {
  const payload = {
    page: currentPage,
    limit: recordSize,
    search: searchText, 
  };

  if (scenType === "Running") {
    dispatch(listRunningScenarios(payload));
  }

  if (scenType === "All") {
    dispatch(listAllExceptRunning(payload));
  }
}, [scenType, currentPage, recordSize, searchText]);

  useEffect(() => {
    if (scenType === "Running" && hasgetlistRunningScenariosSucc) {
      setRowData(hasgetlistRunningScenariosSucc.records || []);
      setTotalCount(hasgetlistRunningScenariosSucc.totalCount || 0);
    }
  }, [hasgetlistRunningScenariosSucc]);

  useEffect(() => {
    if (scenType === "All" && hasgetlistAllExceptRunningSucc) {
      setRowData(hasgetlistAllExceptRunningSucc.records || []);
      setTotalCount(hasgetlistAllExceptRunningSucc.totalCount || 0);
    }
  }, [hasgetlistAllExceptRunningSucc]);

useEffect(() => {
  const timer = setTimeout(() => {
    setSearchText(quickFilter); 
    setCurrentPage(1); 
  }, 2000); 

  return () => clearTimeout(timer); 
}, [quickFilter]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <Seo title="Running Components" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Running Components</h5>
                  <div className="d-flex align-items-center">
                    <div className="d-flex gap-2">
                      <ToggleButtonGroup
                        color="success"
                        size="small"
                        exclusive
                        value={scenType}
                        onChange={(e, value) => {
                          if (value !== null) {
                            setScenType(value);
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <CustomToggleButton value="Running">
                          Running
                        </CustomToggleButton>
                        <CustomToggleButton value="All">All</CustomToggleButton>
                      </ToggleButtonGroup>
                    </div>
                    &nbsp;
                    <input
                      className="form-control bd bd-2 ms-2 w-auto"
                      value={quickFilter}
                      placeholder="Search..."
                      type="text"
                      onChange={(e) => setQuickFilter(e.target.value)}
                    />
                  </div>
                </div>
              </Col>
              <Col md={12}>
                <div
                  className="ag-theme-alpine mt-2"
                  style={{ height: "40em", width: "100%" }}
                >
                  <AgGridReact
                    id="cat_grid"
                    headerHeight={35}
                    rowHeight={40}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={false}
                    onGridReady={onGridReady}
                    components={frameworkComponents}
                    defaultColDef={defaultColDef}
                  />
                </div>

                <Overlay
                  key={popoverData.row?.vmid || "overlay"}
                  show={popoverData.show && !!popoverData.target}
                  target={popoverData.target}
                  placement="left"
                  container={document.body}
                  rootClose
                  popperConfig={{
                    strategy: "fixed",
                    modifiers: [
                      {
                        name: "computeStyles",
                        options: {
                          gpuAcceleration: false,
                        },
                      },
                    ],
                  }}
                  onHide={() => {
                    if (componentLoading.vmid !== null) return;
                    setPopoverData({ show: false, target: null, row: null });
                  }}
                >
                  {(propsOverlay) => {
                    const filteredData = Array.isArray(runningComponents)
                      ? runningComponents.filter(
                          (comp) => comp.vmid === popoverData.row?.vmid,
                        )
                      : [];
                    return (
                      <Popover
                        {...propsOverlay}
                        style={{ minWidth: "320px", ...propsOverlay.style }}
                      >
                        <Popover.Body style={{ maxHeight: "148px" }}>
                          {filteredData.length === 0 ? (
                            <div className="text-center">No Components</div>
                          ) : (
                            filteredData.map((comp) => {
                              const statusColor =
                                comp.status === "Running"
                                  ? "#22c55e"
                                  : comp.status === "Stopped"
                                    ? "#6b7280"
                                    : "#ef4444";
                              return (
                                // <div
                                //   key={comp.vmconfigurationid}
                                //   style={{
                                //     borderRadius: "10px",
                                //     padding: "12px",
                                //     marginBottom: "10px",
                                //     background: isDark ? "#0f0f1b" : "#ffffff",
                                //     color: isDark ? "#ffffff" : "#000000",
                                //     border: isDark
                                //       ? "1px solid #2a2a3b"
                                //       : "1px solid #e5e7eb",
                                //     boxShadow: isDark
                                //       ? "0 4px 20px rgba(0,0,0,0.5)"
                                //       : "0 4px 20px rgba(0,0,0,0.08)",
                                //     transition: "all 0.2s ease-in-out",
                                //   }}
                                // >
                                //   <div className="d-flex justify-content-between align-items-center mb-1">
                                //     <strong>{comp.componentname}</strong>
                                //     <span
                                //       style={{
                                //         background: statusColor,
                                //         padding: "2px 8px",
                                //         borderRadius: "12px",
                                //         fontSize: "10px",
                                //       }}
                                //     >
                                //       {comp.status}
                                //     </span>
                                //   </div>

                                //   <div style={{ fontSize: "11px" }}>
                                //     VMID: {comp.vmid}
                                //   </div>
                                //   <div
                                //     style={{
                                //       fontSize: "11px",
                                //       marginBottom: "8px",
                                //     }}
                                //   >
                                //     Type: {comp.componenttype}
                                //   </div>

                                //   <div className="d-flex justify-content-between">
                                //     <Button
                                //       size="sm"
                                //       variant="outline-primary"
                                //       disabled={
                                //         comp.status === "Running" ||
                                //         componentLoading.vmid === comp.vmid
                                //       }
                                //       onClick={(e) => {
                                //         e.stopPropagation();
                                //         handleStartComponent(comp);
                                //       }}
                                //     >
                                //       {componentLoading.vmid === comp.vmid &&
                                //       componentLoading.action === "start" ? (
                                //         <>
                                //           <Spinner
                                //             as="span"
                                //             animation="grow"
                                //             size="sm"
                                //             role="status"
                                //             aria-hidden="true"
                                //           />{" "}
                                //           Starting...
                                //         </>
                                //       ) : (
                                //         <>▶ Start</>
                                //       )}
                                //     </Button>

                                //     <Button
                                //       size="sm"
                                //       variant="outline-danger"
                                //       disabled={
                                //         comp.status !== "Running" ||
                                //         componentLoading.vmid === comp.vmid
                                //       }
                                //       onClick={(e) => {
                                //         e.stopPropagation();
                                //         handleStopComponent(comp);
                                //       }}
                                //     >
                                //       {componentLoading.vmid === comp.vmid &&
                                //       componentLoading.action === "stop" ? (
                                //         <>
                                //           <Spinner
                                //             as="span"
                                //             animation="grow"
                                //             size="sm"
                                //             role="status"
                                //             aria-hidden="true"
                                //           />{" "}
                                //           Stopping...
                                //         </>
                                //       ) : (
                                //         <>■ Stop</>
                                //       )}
                                //     </Button>

                                //     <Button
                                //       size="sm"
                                //       variant="outline-warning"
                                //       disabled={
                                //         comp.status !== "Running" ||
                                //         componentLoading.vmid === comp.vmid
                                //       }
                                //       onClick={(e) => {
                                //         e.stopPropagation();
                                //         handleRestartComponent(comp);
                                //       }}
                                //     >
                                //       {componentLoading.vmid === comp.vmid &&
                                //       componentLoading.action === "restart" ? (
                                //         <>
                                //           <Spinner
                                //             as="span"
                                //             animation="grow"
                                //             size="sm"
                                //             role="status"
                                //             aria-hidden="true"
                                //           />{" "}
                                //           Restarting...
                                //         </>
                                //       ) : (
                                //         <>↻ Restart</>
                                //       )}
                                //     </Button>
                                //   </div>
                                // </div>
                                <div
                                  key={comp.vmconfigurationid}
                                  className="vm-card"
                                >
                                  {/* Header */}
                                  <div className="vm-card-header">
                                    <span className="vm-title">
                                      {comp.componentname}
                                    </span>
                                    <span
                                      className={`vm-status ${comp.status.toLowerCase()}`}
                                    >
                                      ● {comp.status.toUpperCase()}
                                    </span>
                                  </div>

                                  {/* Info */}
                                  <div className="vm-info">
                                    <div>
                                      <span>VMID :</span> {comp.vmid}
                                    </div>
                                    <div>
                                      <span>TYPE :</span> {comp.componenttype}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="vm-actions">
                                    <button
                                      className="btn-start"
                                      disabled={
                                        comp.status === "Running" ||
                                        componentLoading.vmid === comp.vmid
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartComponent(comp);
                                      }}
                                    >
                                      {/* ▶ START */}
                                      {componentLoading.vmid === comp.vmid &&
                                      componentLoading.action === "start" ? (
                                        <>
                                          <Spinner
                                            as="span"
                                            animation="grow"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                          />{" "}
                                          Starting
                                        </>
                                      ) : (
                                        <>▶ Start</>
                                      )}
                                    </button>

                                    <button
                                      className="btn-stop"
                                      disabled={
                                        comp.status !== "Running" ||
                                        componentLoading.vmid === comp.vmid
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStopComponent(comp);
                                      }}
                                    >
                                      {/* ■ STOP */}
                                      {componentLoading.vmid === comp.vmid &&
                                      componentLoading.action === "stop" ? (
                                        <>
                                          <Spinner
                                            as="span"
                                            animation="grow"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                          />{" "}
                                          Stopping
                                        </>
                                      ) : (
                                        <>■ Stop</>
                                      )}
                                    </button>

                                    <button
                                      className="btn-restart"
                                      disabled={
                                        comp.status !== "Running" ||
                                        componentLoading.vmid === comp.vmid
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRestartComponent(comp);
                                      }}
                                    >
                                      {/* ↻ RESTART */}
                                      {componentLoading.vmid === comp.vmid &&
                                      componentLoading.action === "restart" ? (
                                        <>
                                          <Spinner
                                            as="span"
                                            animation="grow"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                          />{" "}
                                          Restarting
                                        </>
                                      ) : (
                                        <>↻ Restart</>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </Popover.Body>
                      </Popover>
                    );
                  }}
                </Overlay>

                {totalCount > 0 && (
                  <div className="d-flex justify-content-end bd bd-gray-500">
                    <div className="my-auto me-2 d-flex d-none d-lg-block">
                      <span className="my-auto me-2"> {"Page Size"}: </span>
                      <Dropdown className="me-2">
                        <Dropdown.Toggle variant="link" className="p-0">
                          <Badge
                            bg="link"
                            className="border py-2 text-dark tx-12"
                          >
                            {" "}
                            {recordSize}
                            <i className="fas fa-caret-down ms-4"></i>
                          </Badge>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {perPageCount &&
                            perPageCount.map((item, index) => (
                              <Dropdown.Item key={index}>
                                <div
                                  className="d-flex align-items-center"
                                  onClick={() => {
                                    setRecordSize(item);
                                    setCurrentPage(1);
                                  }}
                                >
                                  <p className="mb-0">{item}</p>
                                </div>
                              </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className="my-auto d-none d-lg-block">
                      {startIndex} {"To"} {endIndex} {"From"} {totalCount}
                    </div>
                    <PaginationComponent
                      currentPage={currentPage}
                      totalPages={totalPages}
                      handlePageChange={handlePageChange}
                    />
                  </div>
                )}
              </Col>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};
RunningComponent.layout = "Contentlayout";
export default RunningComponent;

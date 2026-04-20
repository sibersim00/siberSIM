import { useState, useEffect, useMemo,useRef,useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import {
  getComponentList,
  changeStatusComponent,
  clearComponentChangeStatus,
  deleteComponent,
  cleardeleteComponent,
  clearHasError,
} from "../../../shared/redux/slices/component/componentManage";
import * as XLSX from "xlsx";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import "../../../shared/utils/i18n";
import ComponentForm from "../../../shared/data/component/componentForm";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";



const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const ManageComponent = () => {
    const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const [openImportModal, setOpenImportModal] = useState(false);
  const { push } = useRouter();
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
    const [scenType, setScenType] = useState("Public"); // Public/Private
    const [scenStatus, setscenStatus] = useState("true");
  
  const [viewCatModal, setviewCatModal] = useState(false);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setformModal] = useState(false);
  const [rowId, setRowId] = useState("");
  const [viewModal, setViewModal] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    componentcategoryid: 0,
    componenttype: "",
    educationcode: "",
    categoryname: "",
    status: true,
    subcategoryname: "",
    componentidentification: "",
    image_url: "",
    componentname: "",
    ComponentIdentificationVMName: "",
  });
  const [oneClick, setOneClick] = useState(false);
  const [backview, setBackView] = useState("card");


  const [pageSize, setPageSize] = useState(20);
  const gridRef = useRef(null);
   const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  const viewType = router.query.view || "card";
  useEffect(() => {
    if (viewType == "") {
      setView("list");
    } else {
      setView(viewType);
    }
  }, [viewType]);
  const {
    hasGetComponentListSucc,
    errorData,
    deleteComponentRes,
    statusChangeComponentRes,
  } = useSelector((state) => {
    return {
      hasGetComponentListSucc:
        state &&
        state.componentManage &&
        state.componentManage.getComponentListData &&
        state.componentManage.getComponentListData.data,
      deleteComponentRes:
        state &&
        state.componentManage &&
        state.componentManage.deleteComponent &&
        state.componentManage.deleteComponent,
      statusChangeComponentRes:
        state &&
        state.componentManage &&
        state.componentManage.statusChangeComponent,
      errorData: state && state.componentManage && state.componentManage.error,
    };
  });
  console.log("hasGetComponentListSucc",hasGetComponentListSucc);
  
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      minWidth: 80,
      sortable: false,
    },
    {
      headerName: "Component Category",
      field: "categoryname",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },

    {
      headerName: "Type",
      field: "componenttype",
      filter: true,
      floatingFilter: true,
      minWidth: 100,
    },
    {
      headerName: "Vmid",
      field: "vmid",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      cellRenderer: "vmidWithImageRenderer",
    },

    {
      headerName: "Name",
      field: "componentname",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Configuration Delay",
      field: "duration",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) =>
        params.value != null ? `${params.value} Sec` : "N/A",
    },

    {
      headerName: "Virtual Memory",
      field: "memory",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) => (params.value ? `${params.value} M` : "N/A"),
    },
    {
      headerName: "Virtual CPU",
      field: "cores",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) =>
        params.value !== undefined && params.value !== null
          ? `${params.value} Cores`
          : "N/A",
    },
    {
      headerName: "Storage Size",
      field: "storage",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) => {
        const val = params.value;
        if (val == null || val === "") return "N/A";
        const match = val.toString().match(/^([\d.]+)([KMGTP])$/i);
        if (match) {
          const size = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          const sizeInGB = {
            K: size / (1024 * 1024),
            M: size / 1024,
            G: size,
            T: size * 1024,
            P: size * 1024 * 1024,
          }[unit];
          return `${Math.round(sizeInGB)} GB`;
        }
        const numeric = parseFloat(val);
        return isNaN(numeric) ? "N/A" : `${Math.round(numeric)} GB`;
      },
    },

    {
      headerName: "Status",
      field: "status",
      pinned: "right",
      maxWidth: 80,
      cellRenderer: "actionSwitchRenderer",
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      minWidth: 30,
      cellRenderer: "actionButtonRenderer",
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

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  const handleExport = () => {
    const filteredData = hasGetComponentListSucc.filter((row) => {
      if (compStatus === "") return true; // All
      return row.status === compStatus;
    });

    const exportData = filteredData.map((row, index) => {
      const createdDate = row.createdon ? new Date(row.createdon) : null;
      const modifiedDate = row.modifiedon ? new Date(row.modifiedon) : null;

      const createdDateOnly =
        createdDate && !isNaN(createdDate)
          ? createdDate.toLocaleDateString()
          : "N/A";
      const createdTime =
        createdDate && !isNaN(createdDate)
          ? createdDate.toLocaleTimeString()
          : "N/A";

      const modifiedDateOnly =
        modifiedDate && !isNaN(modifiedDate)
          ? modifiedDate.toLocaleDateString()
          : " ";
      const modifiedTime =
        modifiedDate && !isNaN(modifiedDate)
          ? modifiedDate.toLocaleTimeString()
          : " ";
      const storageSize = (() => {
        if (!row.storage) return "N/A";

        const match = row.storage.match(/size=([\d.]+)([KMGTP])/i);
        if (!match) return "N/A";

        const size = parseFloat(match[1]);
        const unit = match[2].toUpperCase();

        const sizeInGB = {
          K: size / (1024 * 1024),
          M: size / 1024,
          G: size,
          T: size * 1024,
          P: size * 1024 * 1024,
        }[unit];

        return `${Math.round(sizeInGB)}GB`;
      })();

      const networkPorts = row.network_ports
        ? JSON.parse(row.network_ports)
        : {};
      const networkPortsList = Object.entries(networkPorts)
        .map(([key, value]) => `${key}: ${value.replace(/\n/g, " ")}`)
        .join(", ");
      return [
        index + 1,
        row.categoryname,
        row.componenttype,
        row.vmid,
        row.vmid_name,
        row.duration,
        row.memory,
        row.cores,
        storageSize,
        networkPortsList || "N/A",
        row.status === "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });
    const header = [
      "Sr No.",
      "Component Category",
      "Type",
      "Vmid",
      "Name",
      "Configuration delay (Seconds)",
      "Virtual memory (M)",
      "Virtual CPU (Cores)",
      "Storage size",
      "Network Ports",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Components");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);

    const filePrefix =
      compStatus === ""
        ? "Component_All"
        : compStatus === "true"
        ? "Component_Active"
        : "Component_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  // const gridOptions = {
  //   pagination: true,
  //   paginationPageSize: 20,
  // };
    const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };
const onGridReady = useCallback((params) => {
  gridRef.current = params.api;
  const initialPageSize = params.api.paginationGetPageSize();
  const totalRows = params.api.getDisplayedRowCount();
  const effectiveRows = Math.min(initialPageSize, totalRows);
  setPageSize(effectiveRows);
}, []);
  
   const onPaginationChanged = useCallback((params) => {
  if (params.api) {
    const newPageSize = params.api.paginationGetPageSize();
    const totalRows = params.api.getDisplayedRowCount();
    const effectiveRows = Math.min(newPageSize, totalRows);
    setPageSize(effectiveRows);
  }
}, []);

  // const onGridReady = (params) => {
  //   setGridApi(params.api);
  // };
  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    const applyFilter = (list) => {
      return list.filter((item) => {
        return Object.keys(item).some((key) => {
          const fieldValue = item[key];

          if (typeof fieldValue === "string") {
            return fieldValue.toLowerCase().includes(val);
          }

          if (typeof fieldValue === "number") {
            return fieldValue.toString().includes(val);
          }

          return false;
        });
      });
    };

    let filteredList = hasGetComponentListSucc || [];

    if (compStatus === "true") {
      filteredList = filteredList.filter(
        (item) => item.status?.toString() === "true"
      );
    } else if (compStatus === "false") {
      filteredList = filteredList.filter(
        (item) => item.status?.toString() === "false"
      );
    }
    const temp = applyFilter(filteredList);
    setGridData(temp);
    setRowData(temp);
  };

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);


    useEffect(() => {
      if (hasGetComponentListSucc) {
        if (scenStatus === "") {
          setRowData(hasGetComponentListSucc);
          setGridData(hasGetComponentListSucc);
        } else if (scenStatus === "true") {
          const filteredData = hasGetComponentListSucc.filter(
            (data) => data.status.toString() === "true"
          );
          setRowData(filteredData);
          setGridData(filteredData);
        } else if (scenStatus === "false") {
          const filteredData = hasGetComponentListSucc.filter(
            (data) => data.status.toString() === "false"
          );
          setRowData(filteredData);
          setGridData(filteredData);
        }
      }
    }, [hasGetComponentListSucc, scenStatus]);
  

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    setBackView(thisView);
    router.push(`/components?view=${thisView || "list"}`);
    if (compStatus == "" && scenStatus == "") {
      setRowData(hasGetComponentListSucc);
      setGridData(hasGetComponentListSucc);
    } else if (compStatus == "true" && scenStatus == "true") {
      const filteredData =
        hasGetComponentListSucc.length > 0 &&
        hasGetComponentListSucc.filter(
          (data) => data?.status?.toString() == "true"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false" && scenStatus == "false") {
      const filteredData =
        hasGetComponentListSucc.length > 0 &&
        hasGetComponentListSucc.filter(
          (data) => data?.status?.toString() == "false"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };

  useEffect(() => {
    if (errorData?.statusCode) {
      errorData.errors && errorData.errors.length > 0
        ? errorData.errors.map((data) => {
            toast.error(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0">
                {data}
              </p>,
              {
                position: toast.POSITION.TOP_RIGHT,
                hideProgressBar: true,
                theme: "colored",
              }
            );
          })
        : toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {errorData?.message}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    if (statusChangeComponentRes?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {statusChangeComponentRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      dispatch(getComponentList());
      dispatch(clearComponentChangeStatus());
    }
  }, [statusChangeComponentRes]);


  useEffect(() => {
    if (hasGetComponentListSucc) {
      let filtered = [...hasGetComponentListSucc];

      if (scenStatus !== "") {
        filtered = filtered.filter((d) => d.status.toString() === scenStatus);
      }

      if (scenType !== "") {
        filtered = filtered.filter((d) => d.component_status === scenType);
      }

      setRowData(filtered);
      setGridData(filtered);
    }
  }, [hasGetComponentListSucc, scenStatus, scenType]);


  useEffect(() => {
    if (deleteComponentRes?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {deleteComponentRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getComponentList());
      dispatch(cleardeleteComponent());
    }
  }, [deleteComponentRes]);

  useEffect(() => {
    dispatch(getComponentList());
  }, []);
  const handleReturnView = (props) => {
    router.push(`/component_view/${props?.componentuuid}?backView=${view}`);
  };

  useEffect(() => {
    if (hasGetComponentListSucc && hasGetComponentListSucc != undefined) {
      if (compStatus == "") {
        setGridData(hasGetComponentListSucc);
        setRowData(hasGetComponentListSucc);
      } else if (compStatus == "true") {
        const filteredData =
          hasGetComponentListSucc.length > 0 &&
          hasGetComponentListSucc.filter(
            (data) => data?.status?.toString() == "true"
          );

        setGridData(filteredData);
        setRowData(filteredData);
      } else if (compStatus == "false") {
        const filteredData =
          hasGetComponentListSucc.length > 0 &&
          hasGetComponentListSucc.filter(
            (data) => data?.status?.toString() == "false"
          );
        setGridData(filteredData);
        setRowData(filteredData);
      }
    }
  }, [hasGetComponentListSucc, compStatus]);

  const handleEdit = (props) => {
    handleOneClick(false);
    setBackView(view);
    if (props && props.componentuuid) {
      setRowId(props.componentuuid);

      setView("Form");
    }
  };

  const handleView = (props) => {
    if (props && props.componentname) {
      setviewCatModal(true);
    }
  };

  let viewCatClose = (modal) => {
    setviewCatModal(false);
  };
  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to change the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const Id = data?.componentid;
        const payload = {
          status: data.status == "true" ? "false" : "true",
          id: Id,
        };
        dispatch(changeStatusComponent(payload, Id));
      }
    });
  };

  const handleDeletecard = (item) => {
    console.log("itemitemitemitemitemitemitem",item);
    
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_delete"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          vmid: item?.vmid,
        };
        dispatch(deleteComponent(payload));
      }
    });
  };
  const handleDelete = (props, flag) => {
    if (flag == true) {
      const payload = {
        component_id: props?.componentid,
      };
      dispatch(deleteComponent(payload));
    }
  };


  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleShowEditView={true}
          handleEdit={handleEdit}
          propsVal={props}
          handleDelete={handleDelete}
          handleShowEdit={true}

        />
      );
    },

    actionSwitchRenderer: function (props) {
      return (
        <ToggleButton
          data={props?.data}
          handleStatusSwitch={handleStatusSwitch}
        />
      );
    },
    vmidWithImageRenderer: function (props) {
      const { data } = props;
      const imageUrl = data?.componentimage
        ? `${process.env.API_URL_FILEMANAGER}${data.componentimage}`
        : dummy_network;

      return (
        <div className="d-flex align-items-center gap-2">
          <span>{data?.vmid} - </span>
          <img
            src={imageUrl}
            alt="vm"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = dummy_network.src;
            }}
            style={{
              width: "22px",
              height: "22px",
              objectFit: "cover",
            }}
          />
        </div>
      );
    },

    identificationRender: function (props) {
      return (
        <div className="identification-container">
          <span>{props?.data?.componentidentification}</span> &nbsp;
          {props?.data && props.data?.url ? (
            <a href={props.data.url} target="_blank">
              <Badge bg="danger">
                <i class="fa fa-link" aria-hidden="true"></i>
              </Badge>
            </a>
          ) : (
            ""
          )}
        </div>
      );
    },
  };

  const handleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues({
      title: "Add",
      componentcategoryid: 0,
      parentcategoryname: "",
      status: true,
    });
    setformModal(flag);
  };
  const handleViewModal = (flag) => {
    handleOneClick(false);
    setViewModal(flag);
  };
  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const colarray = [6, 4, 3, 2];
  const zoomIn = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex > 0) {
      setColumnsPerRow(colarray[currentIndex - 1]);
    }
  };
  const zoomOut = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex < colarray.length - 1) {
      setColumnsPerRow(colarray[currentIndex + 1]);
    }
  };

  const handleImportModal = () => {
    dispatch(clearVerifyComponentCategoryModel());
    setOpenImportModal(!openImportModal);
  };

  return (
    <>
      <Seo title="Components" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            {(view === "list" || view === "card") && (
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Component</h5>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <button
                            onClick={zoomOut}
                            className="btn bd bd-success text-success mx-1"
                            title="Zoom In"
                          >
                            <i className="fas fa-search-plus"></i>
                          </button>
                          <button
                            onClick={zoomIn}
                            className="btn bd bd-success text-success"
                            title="Zoom Out"
                          >
                            <i className="fas fa-search-minus"></i>
                          </button>
                          &nbsp;
                        </>
                      )}
                      <Button
                        type="button"
                        title="Card View"
                        variant="outline-success"
                        onClick={() => handleChangeView("card")}
                        className={
                          view === "card" ? "mx-1 active text-white" : "mx-1"
                        }
                      >
                        <i className="fe fe-grid"></i>
                      </Button>
                      <Button
                        type="button"
                        title="List View"
                        variant="outline-success"
                        onClick={() => handleChangeView("list")}
                        className={view === "list" ? "active text-white" : ""}
                      >
                        <i className="fe fe-list"></i>
                      </Button>
                      &nbsp;&nbsp;
                      <ToggleButtonGroup
                        color="success"
                        value={compStatus}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          setCompStatus(e.target.value);
                          setscenStatus(e.target.value);

                          dispatch(
                            getComponentList({ status: e.target.value })
                          );
                        }}
                        aria-label="Platform"
                      >
                        <CustomToggleButton value="">All</CustomToggleButton>
                        <CustomToggleButton value="true" defaultChecked>
                          Active
                        </CustomToggleButton>
                        <CustomToggleButton value="false">
                          Inactive
                        </CustomToggleButton>
                      </ToggleButtonGroup>
                      &nbsp;&nbsp; &nbsp;
                      <ToggleButtonGroup
                                              color="success"
                                              value={scenType}
                                              size="small"
                                              exclusive
                                              onChange={(e) => {
                                                setScenType(e.target.value);
                                              }}
                                            >
                                              <CustomToggleButton value="Public">
                                                Public
                                              </CustomToggleButton>
                                              <CustomToggleButton value="Private">
                                                Private
                                              </CustomToggleButton>
                                            </ToggleButtonGroup>
                                            &nbsp; &nbsp;
                      <Button
                        type="button"
                        variant="outline-info"
                        onClick={() => handleExport()}
                      >
                        <i className="fa fa-file-excel-o"></i> Export
                      </Button>
                      &nbsp;
                      <Button
                        type="button"
                        variant="outline-primary"
                        onClick={() => {
                          setView("Form");
                          setBackView(view);
                          setRowId("");
                          handleOneClick(false);
                        }}
                      >
                        <i className="fa fa-plus"></i> Add
                      </Button>
                      &nbsp;
                      <input
                        className="form-control bd bd-2 ms-2 w-auto"
                        value={quickFilter}
                        placeholder="Search..."
                        type="text"
                        onChange={(e) => onFilterChanged(e.target.value)}
                      />
                    </div>
                  </div>
                </Col>
              </Card.Body>
            )}
            {view === "list" && (
                              <Col md={12}>
                    {view === "list" && (
                      <div
                        className="ag-theme-alpine mt-2"
                        style={{
                          height: `${gridHeight}px`,
                          width: "100%",
                          overflow: "visible",     
                        }}
                      >
                        <AgGridReact
                          ref={gridRef}
                          headerHeight={HEADER_HEIGHT}
                          rowHeight={ROW_HEIGHT}
                          gridOptions={gridOptions}
                          rowData={rowData}
                          columnDefs={columnDefs}
                          pagination={true}
                          onGridReady={onGridReady}
                          paginationPageSize={20}
                          onPaginationChanged={onPaginationChanged}
                          components={frameworkComponents}
                          defaultColDef={defaultColDef}
                        />
                      </div>
                    )}
                  </Col>
            )}
          </Card>
        </Col>

        <Col md={12}>
          {view == "card" ? (
            <>
              {gridData && gridData.length > 0 ? (
                <Row className="row-sm">
                  {gridData.map((item, index) => {
                    return (
                      <Col key={index} md={12 / columnsPerRow} className="p-0">
                        <Card className="card custom-card our-team component-status-card">
                          <Card.Body className="p-3">
                            <div className="text-center mb-2">
                              <div
                                className="rounded-circle mx-auto d-flex justify-content-center align-items-center "
                                style={{
                                  width: "100px",
                                  height: "100px",
                                }}
                              >
                                <img
                                  alt="avatar"
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                  }}
                                  src={
                                    `${process.env.API_URL_FILEMANAGER}${item?.componentimage}` ||
                                    dummy_network.src
                                  }
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = dummy_network.src;
                                  }}
                                />
                              </div>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-category">
                                    Category: {item.categoryname}
                                  </Tooltip>
                                }
                              >
                                <h6 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                  <a>{item.categoryname}</a>
                                </h6>
                              </OverlayTrigger>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-vmid-name pointer">
                                    VM Name: {item.componentname}
                                  </Tooltip>
                                }
                              >
                                <h5 className="pro-user-desc mb-1 mt-1 pointer">
                                  {item.componentname}
                                </h5>
                              </OverlayTrigger>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-vmid pointer">
                                    VMID: {item.vmid}
                                  </Tooltip>
                                }
                              >
                                <p className="pro-user-desc text-success mb-1 mt-1 pointer">
                                  {item.vmid}
                                </p>
                              </OverlayTrigger>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              
                              <div className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip>{item.componenttype}</Tooltip>
                                  }
                                >
                                  <i className="fe fe-box"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
                                onClick={() => handleEdit(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Update</Tooltip>}
                                >
                                  <i className="fe fe-edit"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle"
                                onClick={() => {
                                   handleDeletecard(item);
                                }}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Delete</Tooltip>}
                                >
                                  <i className="fe fe-trash"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() =>
                                  push(
                                    `/component_view/${item?.componentuuid}?backView=${view}`
                                  )
                                }
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>View</Tooltip>}
                                >
                                  <i className="fe fe-eye"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              <div className="btn btn-sm ripple me-1 mg-t-5">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{"Change Status"}</Tooltip>}
                                >
                                  <label className="custom-switch mg-t-50">
                                    <input
                                      type="checkbox"
                                      name="custom-switch-checkbox1"
                                      className="custom-switch-input"
                                      checked={item?.status === "true"}
                                      onChange={() => handleStatusSwitch(item)}
                                    />
                                    <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                  </label>
                                </OverlayTrigger>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <Row>
                  <Col sm={12}>
                    <Card className="custom-card">
                      <Card.Body className="overflow-auto pd-t-10">
                        <Row
                          className=" text-center"
                          style={{ height: "70vh" }}
                        >
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                                // backgroundColor: "#f6f7fb",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center mt-5">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150 mt-5"
                                  />
                                  <h5 className="mt-4">Loading...</h5>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          ) : (
            ""
          )}
        </Col>
      </Row>
      {view == "Form" ? (
        <ComponentForm
          setView={setView}
          rowId={rowId}
          rowData={rowData}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
          backView={backview}
          mode={rowId ? "update" : "add"}
        />
      ) : (
        <></>
      )}
    </>
  );
};
ManageComponent.layout = "Contentlayout";
export default ManageComponent;

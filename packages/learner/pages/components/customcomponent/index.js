import { useState, useEffect, useMemo } from "react";
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
  Nav,
  Tab,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import {
  getComponentList,
  cleardeleteComponent,
  clearHasError,
} from "../../../shared/redux/slices/customcomponent/customcomponentManage";
// import * as XLSX from "xlsx";
import { styled } from "@mui/system";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterbuttons/action-button";
import { ToggleButton } from "@mui/material";

import "../../../shared/utils/i18n";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";

const ManageCustomComponent = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const [openImportModal, setOpenImportModal] = useState(false);
  const { push } = useRouter();
  const [compStatus, setCompStatus] = useState("approved");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
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

  console.log("rowData", rowData);
  console.log("gridData", gridData);
  const [oneClick, setOneClick] = useState(false);
  const [backview, setBackView] = useState("card");
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
        state.customComponent &&
        state.customComponent.getComponentListData &&
        state.customComponent.getComponentListData.data,

      statusChangeComponentRes:
        state &&
        state.customComponent &&
        state.customComponent.statusChangeComponent,
      errorData: state && state.customComponent && state.customComponent.error,
    };
  });
  console.log("hasGetComponentListSucc", hasGetComponentListSucc);

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
      field: "main_memory",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) => (params.value ? `${params.value} M` : "N/A"),
    },
    {
      headerName: "Virtual CPU",
      field: "main_cores",
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
      field: "main_storage",
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
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      minWidth: 130,
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

  const CustomToggleButton = styled(ToggleButton)(({ value }) => {
    const isDark = document.body.classList.contains("dark-theme");

    // Define colors based on value
    const statusColors = {
      reject: "#19B159",
      pending: "#19B159",
      approved: "#19B159",
    };
    const greenBorder = "#19B159";
    const borderColor = "#d1d1d1";

    return {
      textTransform: "none",
      fontWeight: 500,
      border: `1px solid ${isDark ? greenBorder : borderColor}`,
      color: isDark ? "#19B159" : "#888686ff",

      "&.Mui-selected": {
        backgroundColor: "#19B159",
        borderColor: greenBorder,
        color: "#fff",
        "&:hover": {
          backgroundColor: "#19B159",
          opacity: 0.9,
        },
      },

      "&:not(.Mui-selected)": {
        backgroundColor: "transparent",
        "&:hover": {
          borderColor: isDark ? "#19B159" : "#9c9a9aff",
          color: isDark ? "#fff" : "#000",
        },
      },
    };
  });
  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  // const onFilterChanged = (data) => {
  //   setQuickFilter(data);
  //   const val = data.toLowerCase();

  //   let filteredList = hasGetComponentListSucc;

  //   if (compStatus !== "") {
  //     filteredList = filteredList.filter(
  //       (item) => item.status?.toLowerCase() === compStatus.toLowerCase()
  //     );
  //   }

  //   const temp = filteredList.filter((item) =>
  //     Object.keys(item).some((key) => {
  //       const fieldValue = item[key];
  //       if (typeof fieldValue === "string") {
  //         return fieldValue.toLowerCase().includes(val);
  //       }
  //       if (typeof fieldValue === "number") {
  //         return fieldValue.toString().includes(val);
  //       }
  //       return false;
  //     })
  //   );

  //   setGridData(temp);
  //   setRowData(temp);
  // };

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    let filteredList = hasGetComponentListSucc;

    //  STATUS FILTER
    if (compStatus === "Unapproved") {
      filteredList = filteredList.filter(
        (item) =>
          item.status &&
          ["pending", "reject", "draft"].includes(item.status.toLowerCase())
      );
    } else if (compStatus.toLowerCase() === "approved") {
      filteredList = filteredList.filter(
        (item) => item.status?.toLowerCase() === "approved"
      );
    }

    // SEARCH FILTER
    const temp = filteredList.filter((item) =>
      Object.keys(item).some((key) => {
        const fieldValue = item[key];
        if (typeof fieldValue === "string") {
          return fieldValue.toLowerCase().includes(val);
        }
        if (typeof fieldValue === "number") {
          return fieldValue.toString().includes(val);
        }
        return false;
      })
    );

    setGridData(temp);
    setRowData(temp);
  };

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    setBackView(thisView);
    router.push(`/customComponent?view=${thisView || "list"}`);
    if (compStatus === "") {
      setGridData(hasGetComponentListSucc);
      setRowData(hasGetComponentListSucc);
    } else if (compStatus === "true") {
      const filteredData = hasGetComponentListSucc.filter(
        (data) => data?.status?.toLowerCase() !== "false"
      );
      setGridData(filteredData);
      setRowData(filteredData);
    } else if (compStatus === "false") {
      const filteredData = hasGetComponentListSucc.filter(
        (data) => data?.status?.toLowerCase() === "false"
      );
      setGridData(filteredData);
      setRowData(filteredData);
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
    dispatch(getComponentList());
  }, []);
  const handleReturnView = (props) => {
    router.push(
      `/custom_component_view/${props?.customcomponentuuid}?backView=${view}`
    );
  };

  useEffect(() => {
    if (!hasGetComponentListSucc) return;

    let filtered;
    if (compStatus === "Unapproved") {
      filtered = hasGetComponentListSucc.filter(
        (item) =>
          item.status &&
          ["pending", "reject", "draft"].includes(item.status.toLowerCase())
      );
    } else if (compStatus.toLowerCase() === "approved") {
      filtered = hasGetComponentListSucc.filter(
        (item) => item.status && item.status.toLowerCase() === "approved"
      );
    } else {
      filtered = hasGetComponentListSucc;
    }

    setGridData(filtered);
    setRowData(filtered);
  }, [hasGetComponentListSucc, compStatus]);

  const handleEdit = (props) => {
    handleOneClick(false);
    setBackView(view);
    if (props && props.customcomponentuuid) {
      setRowId(props.customcomponentuuid);

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

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      const status = props?.data?.status?.toLowerCase();
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleShowEditView={true}
          handleEdit={handleEdit}
          propsVal={props}
        // handleShowEdit={status === "pending"}
        />
      );
    },
    vmidWithImageRenderer: function (props) {
      const { data } = props;
      console.log("data", data);
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

      <Row className="mg-b-10 text-wrap">
        <Col md={12}>
          <div className="panel panel-primary tabs-style-2">
            <div className="tab-menu-heading">
              <div className="tabs-menu ">
                <Tab.Container
                  id="scenario-tabs"
                  //             activeKey={compStatus}
                  //             onSelect={(key) => {
                  // console.log("keyvalue---------------",key)
                  //               setCompStatus(key);
                  //             }}
                  activeKey={compStatus}
                  onSelect={(key) => setCompStatus(key)}
                >
                  <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                    <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white">
                    

                      <Nav.Item
                        className="mastermenu"
                        onClick={() => {
                          setCompStatus("approved");
                        }}
                      >
                        <Nav.Link
                          eventKey="approved"
                          className="masterlist"
                          value={compStatus}
                          exclusive
                          style={{
                            color:
                              compStatus === "approved" ? "#007bff" : "gray",
                            fontWeight:
                              compStatus === "approved" ? "bold" : "normal",
                          }}
                        >
                          {" "}
                          Approved
                        </Nav.Link>
                      </Nav.Item>

                        <Nav.Item
                        className="mastermenu"
                        onClick={() => {
                          setCompStatus("Unapproved");
                        }}
                      >
                        <Nav.Link
                          eventKey="Unapproved"
                          className="masterlist"
                          value={compStatus}
                          exclusive
                          style={{
                            color:
                              compStatus === "Unapproved" ? "#007bff" : "gray",
                            fontWeight:
                              compStatus === "Unapproved" ? "bold" : "normal",
                          }}
                        >
                          Unapproved
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Row>
                </Tab.Container>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ============================== */}
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            {(view === "list" || view === "card") && (
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Custom Component</h5>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <button
                            onClick={zoomOut}
                            className="btn bd bd-success text-success mx-1"
                            title="Zoom In"
                            variant="outline-primary"
                            type="button"
                          >
                            <i className="fas fa-search-plus"></i>
                          </button>
                          <button
                            onClick={zoomIn}
                            className="btn bd bd-success text-success"
                            title="Zoom Out"
                            variant="outline-primary"
                            type="button"
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
                      {/* <ToggleButtonGroup
                        color="success"
                        value={compStatus}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          const value = e.target.value;
                          setCompStatus(value);
                        }}
                        aria-label="Platform"
                      >
                        <CustomToggleButton value="reject">Reject</CustomToggleButton>
                        <CustomToggleButton value="pending" defaultChecked>
                          Pending
                        </CustomToggleButton>
                        <CustomToggleButton value="approved">Approved</CustomToggleButton>
                      </ToggleButtonGroup>
                      &nbsp;&nbsp; */}
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
                {view == "list" ? (
                  <div
                    className="ag-theme-alpine mt-2"
                    style={{ height: "40em", width: "100%" }}
                  >
                    <AgGridReact
                      id="cat_grid"
                      headerHeight={35}
                      rowHeight={40}
                      gridOptions={gridOptions}
                      rowData={rowData}
                      columnDefs={columnDefs}
                      pagination={true}
                      onGridReady={onGridReady}
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
                    ></AgGridReact>
                  </div>
                ) : (
                  ""
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
                          <Card.Body className="p-3 position-relative">
                            <div className="text-center mb-2">
                              {item?.status && (
                                <span
                                  className="badge position-absolute"
                                  style={{
                                    top: "10px",
                                    right: "12px",
                                    fontSize: "11px",
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    backgroundColor:
                                      item.status.toLowerCase() === "approved"
                                        ? "#28a745"
                                        : item.status.toLowerCase() === "reject"
                                          ? "#ec43548e"
                                          : "#ffc107",
                                    color: "#fff",
                                    zIndex: 10,
                                    textTransform: "capitalize",
                                    pointerEvents: "none",
                                  }}
                                >
                                  {item.status}
                                </span>
                              )}
                              <div
                                className="rounded-circle mx-auto d-flex justify-content-center align-items-center position-relative"
                                style={{
                                  width: "100px",
                                  height: "100px",
                                }}
                              >
                                {/* STATUS BADGE */}




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

                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() =>
                                  push(
                                    `/custom_component_view/${item?.customcomponentuuid}?backView=${view}`
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
    </>
  );
};
ManageCustomComponent.layout = "Contentlayout";
export default ManageCustomComponent;

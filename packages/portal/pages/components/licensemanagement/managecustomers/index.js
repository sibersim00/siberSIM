// import ManageCustomers from "../../customers";

// export default ManageCustomers;


import React, { useEffect, useMemo, useState,useRef,useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
  Modal,
  Popover,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import ToggleButton from "../../../../shared/data/masterButtons/toggleButton";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Seo from "../../../../shared/layout-components/seo/seo";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import dummy_profile from "../../../../public/assets/img/dummy_profile.png";
import * as XLSX from "xlsx";
import {
  clearAddCustomerData,
  clearEditCustomerData,
  cleareditStatusCustomerData,
  editStatusCustomer,
  getCustomerList,
  getCustomerLicense,
  clearAddLicenseData,
  clearHasError,
  resendLicenseEmail,
  clearResendLicenseData,
} from "../../../../shared/redux/slices/customers/customer";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import CustomerModal from "../../../../shared/data/admin/modals/CustomerModal";
import LicenseModal from "../../../../shared/data/admin/modals/LicenseModal";
import styles from "./manage-customers.module.scss";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;


const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for HTTP / older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  } catch (err) {
    console.error("Copy failed", err);
  }
};


const Customers = () => {
  const dispatch = useDispatch();
  const [view, setView] = useState("card");
  const [compStatus, setCompStatus] = useState("true");
  const [quickFilter, setQuickFilter] = useState("");
  const [rowData, setRowData] = useState([]);
  const [licenseData, setLicenseData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [formModal, setformModal] = useState(false);
  const [openTooltip, setOpenTooltip] = useState({ gridId: null, rowIndex: null });
  const [pageSize, setPageSize] = useState(20);
  const gridRef = useRef(null);
  const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  
  const [rowValues, setRowValues] = useState({
    title: "Add",
    orgcode: "",
    orgname: "",
    status: true,
    empcode_prefix: "",
  });
  const [oneClick, setOneClick] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasData, setCanvasData] = useState(null);
  const [licenseFormModal, setLicenseFormModal] = useState(false);
  const [customerID, setCustomerId] = useState();
  const [licenseSearch, setLicenseSearch] = useState("");
  const [originalLicenseData, setOriginalLicenseData] = useState([]);
  const [hideCanvasForModal, setHideCanvasForModal] = useState(false);
  

  const handleOpenCanvas = (data) => {
    setCanvasData(data);
    setCustomerId(data.customer_id);
    setLicenseSearch("");
    setShowCanvas(true);
    dispatch(getCustomerLicense(data.customer_id));
  };

  const handleCloseCanvas = () => {
    setShowCanvas(false);
    setCanvasData(null);
    setLicenseSearch("");
  };
  const {
    hasGetCustomersListSucc,
    editStatusCustomerData,
    addCustomerData,
    addLisenceData,
    editCustomerData,
    getCustomerLicenseData,
    resendEmailSucc,
    errorData,
  } = useSelector((state) => {
    return {
      hasGetCustomersListSucc:
        state &&
        state.customerData &&
        state.customerData.customerListResp &&
        state.customerData.customerListResp.data,

      editStatusCustomerData:
        state &&
        state.customerData &&
        state.customerData.editStatusCustomerResp,

      addCustomerData:
        state && state.customerData && state.customerData.addCustomerResp,
      addLisenceData:
        state && state.customerData && state.customerData.addLicenseResp,
      editCustomerData:
        state && state.customerData && state.customerData.editCustomerResp,

      getCustomerLicenseData:
        state && state.customerData && state.customerData.customerLicenseResp,
      resendEmailSucc:
        state &&
        state.customerData &&
        state.customerData.resendLicenseResp,
      errorData: state && state.customerData && state.customerData.error,
    };
  });

  useEffect(() => {
    dispatch(getCustomerList());
  }, [dispatch]);

  useEffect(() => {
    if (hasGetCustomersListSucc && hasGetCustomersListSucc.length > 0) {
      let filteredData = hasGetCustomersListSucc;

      if (compStatus === "true") {
        filteredData = hasGetCustomersListSucc.filter(
          (d) => d?.status?.toString() === "true"
        );
      } else if (compStatus === "false") {
        filteredData = hasGetCustomersListSucc.filter(
          (d) => d?.status?.toString() === "false"
        );
      }

      setRowData(filteredData);
      setGridData(filteredData);
    }
  }, [hasGetCustomersListSucc, compStatus]);

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
  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      maxWidth: 110,
      cellRenderer: "srNoRfender",
      floatingFilter: true,
    },

    {
      headerName: "First Name",
      field: "firstname",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Last Name",
      field: "lastname",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Email",
      field: "email",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Mobile",
      field: "mobile",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },

    {
      headerName: "Status",
      field: "status",
      maxWidth: 80,
      pinned: "right",
      cellRenderer: "actionSwitchRenderer",
    },
    {
      headerName: "Action",
      field: "",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      maxWidth: 80,
      pinned: "right",
    },
    {
    headerName: "View",
    field: "",
    sortable: false,
    cellRenderer: "viewButtonRenderer",
    maxWidth: 80,
    pinned: "right",
  },
    
  ];
  useEffect(() => {
    if (getCustomerLicenseData?.statusCode === 200) {
      // Set the grid rows here
      setLicenseData(getCustomerLicenseData.data);
      setOriginalLicenseData(getCustomerLicenseData.data);
    }
  }, [getCustomerLicenseData]);

  const y_m_d = (date) => {
  const d = new Date(date);
  return (
    ("0" + d.getDate()).slice(-2) +
    "-" +
    ("0" + (d.getMonth() + 1)).slice(-2) +
    "-" +
    d.getFullYear()
  );
};

  const handleLicenseSearch = (val) => {
    setLicenseSearch(val);
    val = val.toLowerCase();

    if (!val) {
      setLicenseData(originalLicenseData);
      return;
    }

    const filtered = originalLicenseData.filter((d) => {
      return (
        (d.domain_url && d.domain_url.toLowerCase().includes(val)) ||
        (d.license_key && d.license_key.toLowerCase().includes(val)) ||
        (d.start_date && y_m_d(d.start_date).includes(val)) ||
        (d.expiry_date && y_m_d(d.expiry_date).includes(val))
      );
    });

    setLicenseData(filtered);
  };

  const handleCopy = (licenseKey, gridId, rowIndex) => {
    navigator.clipboard.writeText(licenseKey);
    
    // Show copied state briefly, then close
    setOpenTooltip({ gridId, rowIndex, copied: true });
    
    setTimeout(() => {
      setOpenTooltip({ gridId: null, rowIndex: null });
    }, 1500);
  };

  const licenseColumnDefs = [
    {
      headerName: "Sr No.",
      valueGetter: "node.rowIndex + 1",
      width: 80,
      maxWidth: 80,
      minWidth: 80,
      floatingFilter: true,
    },
   {
      headerName: "Domain URL",
      field: "domain_url",
      filter: true,
      width: 420,
      minWidth: 420,
      floatingFilter: true,
      tooltipField: "domain_url",
    },
    {
      headerName: "Start Date",
      field: "start_date",
      filter: true,
      width: 200,
      floatingFilter: true,
      valueFormatter: (params) => (params.value ? y_m_d(params.value) : ""),
      tooltipValueGetter: (params) => (params.value ? y_m_d(params.value) : ""),
    },

    {
      headerName: "End Date",
      field: "expiry_date",
      filter: true,
      width: 200,
      floatingFilter: true,
      valueFormatter: (params) => (params.value ? y_m_d(params.value) : ""),
      tooltipValueGetter: (params) => (params.value ? y_m_d(params.value) : ""),
    },

    {
      headerName: "User Scenario Limit",
      field: "sim_user_count",
      filter: true,
      width: 170,
      minWidth: 170,
      floatingFilter: true,
      tooltipField: "sim_user_count",
    },

      {
      headerName: "License Key",
      field: "license_key",
      sortable: false,
      cellRenderer: "viewLicenseButtonRenderer",
      maxWidth: 120,
      pinned: "right",

      cellStyle: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
    },

  {
  headerName: "Resend Email",
  field: "",
  sortable: false,
  maxWidth: 120,
  pinned: "right",
  cellRenderer: "resendLicenseButtonRenderer",
}

  ];

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    let filteredList = hasGetCustomersListSucc ?? [];

    // Apply status filter based on compStatus
    if (compStatus === "true") {
      filteredList = filteredList.filter(
        (d) => d?.status?.toString() === "true"
      );
    } else if (compStatus === "false") {
      filteredList = filteredList.filter(
        (d) => d?.status?.toString() === "false"
      );
    }

    const temp = filteredList.filter((d) => {
      const fullName = `${d.firstname ?? ""} ${d.lastname ?? ""}`.toLowerCase();

      return (
        fullName.includes(val) || // match combined full name
        (typeof d.firstname === "string" &&
          d.firstname.toLowerCase().includes(val)) ||
        (typeof d.lastname === "string" &&
          d.lastname.toLowerCase().includes(val)) ||
        (typeof d.email === "string" && d.email.toLowerCase().includes(val)) ||
        ((typeof d.mobile === "number" || typeof d.mobile === "string") &&
          String(d.mobile).toLowerCase().includes(val)) ||
        !val
      );
    });

    setGridData(temp);
    setRowData(temp);
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
        const Id = data?.customer_id;
        const payload = {
          customer_id: data?.customer_id,
          status: data?.status == "true" ? "false" : "true",
        };
        dispatch(editStatusCustomer(payload, Id));
      }
    });
  };
  const frameworkComponents = {
    srNoRfender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      return (
        <>
          <ActionButtonRenderer
            handleEdit={handleEdit}
            handleShowEdit={true} // Always show Edit button
            propsVal={props}
          />
        </>
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
    viewButtonRenderer: function (props) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div
          className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle"
          onClick={() => handleOpenCanvas(props.data)}
        >
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>Customer License</Tooltip>}
          >
            <i className="fe fe-eye"></i>
          </OverlayTrigger>
        </div>
      </div>
    );
  },
viewLicenseButtonRenderer: function (props) {
  const licenseKey = props.data.license_key;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    copyToClipboard(licenseKey);
    setCopied(true);

    setTimeout(() => setCopied(false), 1200);
  };

  const popover = (
    <Popover id="license-popover" className={styles.licensePopover}>
      <Popover.Header as="h3">
        <span className={styles.popoverTitleIcon}>
          <i className="fe fe-key"></i>
        </span>
        License Key
      </Popover.Header>
      <Popover.Body>
        <div className={styles.licenseKeyRow}>
          <span className={styles.licenseKeyText}>{licenseKey}</span>

          {/* COPY or TICK ICON */}
          {!copied ? (
            <button
              type="button"
              className={styles.copyButton}
              title="Copy"
              onClick={handleCopy}
              aria-label="Copy license key"
            >
              <i className="mdi mdi-content-copy"></i>
            </button>
          ) : (
            <span className={styles.copiedState}>
              <i className="mdi mdi-check"></i> Copied
            </span>
          )}
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="left" overlay={popover} rootClose>
      <div
        className={styles.keyAction}
        onClick={(e) => e.stopPropagation()}
        title="View license key"
      >
        <i className="mdi mdi-content-copy" aria-hidden="true"></i>
      </div>
    </OverlayTrigger>
  );
},

resendLicenseButtonRenderer: function (props) {
  const dispatch = useDispatch();

  const handleResend = () => {
    Swal.fire({
      title: "Resend Email?",
      text: "Do you want to resend this license email?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, resend",
      cancelButtonText: "Cancel",
      customClass: {
        container: "swal2-container-custom",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(
          resendLicenseEmail({
             customer_license_id: props.data.customer_license_id,
              // customer_id: props.data.customer_id  
          })
        );
      }
    });
  };

  return (
    <div className="text-center">
      <Button
        size="sm"
        className="btn btn-success"
        onClick={handleResend}
      >
        <i className="fe fe-send"></i>
      </Button>
    </div>
  );
},

  };

  useEffect(() => {
    if (addCustomerData?.statusCode == 200) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addCustomerData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCustomerList());
      dispatch(clearAddCustomerData());
    }
  }, [addCustomerData]);

  useEffect(() => {
    if (editCustomerData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editCustomerData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCustomerList());
      dispatch(clearEditCustomerData());
    }
  }, [editCustomerData]);

  useEffect(() => {
    if (addLisenceData?.statusCode == 200) {
      setLicenseFormModal(false); // close license modal

      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addLisenceData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      // Re-fetch license list with correct customer_id
      if (customerID) {
        dispatch(getCustomerLicense(customerID));
      }
      setHideCanvasForModal(false);
      setShowCanvas(true);
      dispatch(clearAddLicenseData());
    }
  }, [addLisenceData, customerID]);

  useEffect(() => {
    if (editStatusCustomerData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusCustomerData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCustomerList());
      dispatch(cleareditStatusCustomerData());
    }
  }, [editStatusCustomerData]);

    useEffect(() => {
    if (resendEmailSucc?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {resendEmailSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      // dispatch(getCustomerList());
      dispatch(clearResendLicenseData());
    }
  }, [resendEmailSucc]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    if (compStatus == "") {
      setRowData(hasGetCustomersListSucc);
      setGridData(hasGetCustomersListSucc);
    } else if (compStatus == "true") {
      const filteredData =
        hasGetCustomersListSucc.length > 0 &&
        hasGetCustomersListSucc.filter(
          (data) => data?.status?.toString() == "true"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        hasGetCustomersListSucc.length > 0 &&
        hasGetCustomersListSucc.filter(
          (data) => data?.status?.toString() == "false"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    }
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

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  const handleEdit = (props) => {
    handleOneClick(false);
    if (props) {
      setRowValues({
        title: "Edit",
        id: props.customer_id,
        firstname: props.firstname,
        lastname: props.lastname,
        email: props.email,
        mobile: props.mobile,
        isactive: JSON.parse(props.status),
      });
      setformModal(true);
    }
  };
  const handleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues(undefined);
    setformModal(flag);
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

  const handleExport = () => {
    const filteredData = hasGetCustomersListSucc.filter((row) => {
      if (compStatus === "") return true; // All
      return row.status === compStatus;
    });
    const exportData = filteredData.map((row) => {
      return [
        row.customer_id,
        row.firstname,
        row.lastname,
        row.email,
        row.mobile,
        row.status == "true" ? "Active" : "Inactive",
      ];
    });

    const header = [
      "Customer Id",
      "First Name",
      "Last Name",
      "Email",
      "Mobile",
      "Status",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const filePrefix =
      compStatus === ""
        ? "Customer_All"
        : compStatus === "true"
        ? "Customer_Active"
        : "Customer_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };
  const handleLicenseExport = () => {
    if (!licenseData || licenseData.length === 0) return;

    const exportData = licenseData.map((row) => [
      row.domain_url,
      y_m_d(row.start_date),
      y_m_d(row.expiry_date),
      row.sim_user_count,
      row.license_key,
    
    ]);

    const header = [
      "Domain URL",
      "Start Date",
      "End Date",
      "User Scenario Limit",
      "License Key",
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customer-License");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);

    XLSX.writeFile(wb, `Customer_License_${timestamp}.xlsx`);
  };

  return (
    <>
      <Seo title="Customers" />
      <ToastContainer />
      <Col md={12}>
        <Card className="custom-card overflow-hidden">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5>Customers</h5>
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
                    dispatch(getCustomerList({ status: e.target.value }));
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
                  onClick={() => handleFormModal(true)}
                >
                  <i className="fa fa-plus"></i> Add
                </Button>
                &nbsp;
                <input
                  className="form-control bd bd-2 ms-2 w-auto"
                  //    value={quickFilter}
                  placeholder="Search..."
                  type="text"
                  onChange={(e) => onFilterChanged(e.target.value)}
                />
              </div>
            </div>
            {/* List View */}
            {view === "list" && (
              <Col md={12}>
                <div
                  className="ag-theme-alpine mt-2"
                 style={{
                          height: `${gridHeight}px`,
                          width: "100%",
                          overflow: "visible",     
                        }}
                >
                  <AgGridReact
                    id="cat_grid"
                    className="ag-theme-alpine"
                    headerHeight={35}
                    rowHeight={40}
                    gridOptions={gridOptions}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    paginationPageSize={20}
                    onGridReady={onGridReady}
                    components={frameworkComponents}
                    defaultColDef={defaultColDef}
                  />
                </div>
              </Col>
            )}
          </Card.Body>
        </Card>
      </Col>
      <Col md={12}>
        {view == "card" ? (
          <>
            {gridData && gridData.length > 0 ? (
              <Row className="row-sm">
                {gridData.map((item, index) => {
                  const isValidMobile =
                    item?.mobile &&
                    String(item.mobile).trim() !== "" &&
                    String(item.mobile).trim() !== "0" &&
                    String(item.mobile).trim().toLowerCase() !== "null";

                  const mobileDisplay = isValidMobile ? item.mobile : "NA";
                  return (
                    <Col key={index} md={12 / columnsPerRow} className="p-0">
                      <Card className="card custom-card our-team">
                        <Card.Body>
                          <div className="picture avatar-lg online text-center">
                            <div className="rounded-circle">
                              <img alt="avatar" src={dummy_profile.src} />
                            </div>
                          </div>
                          <div className="text-center mt-3">
                            <h5 className="pro-user-username text-dark mt-2 mb-0">
                              {item.firstname} {item.lastname}
                            </h5>
                          </div>
                          <div className="contact-info mb-0 text-center">
                            {/* Phone Button */}
                            <div className="btn btn-sm ripple bg-primary-transparent text-primary rounded-circle mx-1">
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>{mobileDisplay}</Tooltip>}
                              >
                                <i className="fe fe-phone-call"></i>
                              </OverlayTrigger>
                            </div>

                            <div className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle mx-1">
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>{item.email}</Tooltip>}
                              >
                                <i className="fe fe-mail"></i>
                              </OverlayTrigger>
                            </div>

                            <div
                              className="btn btn-sm ripple bg-info-transparent text-info rounded-circle mx-1"
                              onClick={() => handleEdit(item)}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>Update</Tooltip>}
                              >
                                <i className="fe fe-edit"></i>
                              </OverlayTrigger>
                            </div>

                            <div className="d-flex justify-content-center align-items-center mt-2 w-100">
                              <div className="btn btn-sm ripple mx-1">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Change Status</Tooltip>}
                                >
                                  <label className="custom-switch mb-0">
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
                              <div
                                className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle mx-1"
                                onClick={() => handleOpenCanvas(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Customer License</Tooltip>}
                                >
                                  <i className="fe fe-eye"></i>
                                </OverlayTrigger>
                              </div>
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
                      <Row className="text-center" style={{ height: "70vh" }}>
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
                                  onClick={() => handleFormModal(true)}
                                />
                                <h5 className="mt-4">No data found.</h5>
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
      {formModal && (
        <CustomerModal
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
        />
      )}
      {licenseFormModal && (
        <LicenseModal
          openFlag={licenseFormModal}
          handleFormModal={(flag) => {
            setLicenseFormModal(flag);
            setHideCanvasForModal(false); 
            if (!flag) setShowCanvas(true); 
          }}
          rowValues={canvasData}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
          licenseData={licenseData}
        />
      )}

      <Modal
        show={showCanvas && !hideCanvasForModal}
        onHide={handleCloseCanvas}
        centered
        fullscreen="lg-down"
        dialogClassName={styles.licenseDialog}
        contentClassName={styles.licenseModalContent}
        backdrop="static"
      >
        <Modal.Body className={styles.licenseModalBody}>
          <section className={styles.licenseHero}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCloseCanvas}
              aria-label="Close license workspace"
            >
              <i className="fe fe-x"></i>
            </button>

            <div className={styles.heroContent}>
              <div className={styles.heroIcon}>
                <i className="fe fe-shield"></i>
              </div>
              <div>
                <div className={styles.eyebrow}>License management</div>
                <h2>Customer licenses</h2>
                <p>Review and manage licenses issued to this customer.</p>
              </div>
            </div>

            <div className={styles.customerStrip}>
              <div className={styles.customerIdentity}>
                <div className={styles.avatarBadge}>
                  {(canvasData?.firstname?.[0] || "C").toUpperCase()}
                  {(canvasData?.lastname?.[0] || "").toUpperCase()}
                </div>
                <div>
                  <span className={styles.infoLabel}>Customer</span>
                  <strong>
                    {canvasData?.firstname || "-"} {canvasData?.lastname || ""}
                  </strong>
                </div>
              </div>

              <div className={styles.customerDetails}>
                {canvasData?.mobile && (
                  <div className={styles.contactItem}>
                    <span className={`${styles.contactIcon} ${styles.phoneIcon}`}>
                      <i className="fe fe-phone-call"></i>
                    </span>
                    <div>
                      <span className={styles.infoLabel}>Phone</span>
                      <strong>{canvasData.mobile}</strong>
                    </div>
                  </div>
                )}
                <div className={styles.contactItem}>
                  <span className={`${styles.contactIcon} ${styles.emailIcon}`}>
                    <i className="fe fe-mail"></i>
                  </span>
                  <div>
                    <span className={styles.infoLabel}>Email</span>
                    <strong>{canvasData?.email || "-"}</strong>
                  </div>
                </div>
                <div className={styles.licenseCount}>
                  <span>{originalLicenseData?.length || 0}</span>
                  <small>{originalLicenseData?.length === 1 ? "License" : "Licenses"}</small>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.workspaceBody}>
            <div className={styles.toolbar}>
              <div>
                <h4>License directory</h4>
                <p>Manage every license issued to this customer.</p>
              </div>

              <div className={styles.toolbarActions}>
                <div className={styles.searchBox}>
                  <i className="fe fe-search"></i>
                  <input
                    value={licenseSearch}
                    placeholder="Search domain, key or date"
                    type="search"
                    aria-label="Search customer licenses"
                    onChange={(e) => handleLicenseSearch(e.target.value)}
                  />
                  {licenseSearch && (
                    <button
                      type="button"
                      onClick={() => handleLicenseSearch("")}
                      aria-label="Clear license search"
                    >
                      <i className="fe fe-x"></i>
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  className={styles.exportButton}
                  onClick={handleLicenseExport}
                  disabled={!licenseData?.length}
                >
                  <i className="fa fa-file-excel-o"></i>
                  Export
                </Button>
                <Button
                  type="button"
                  className={styles.createButton}
                  onClick={() => {
                    setHideCanvasForModal(true);
                    setLicenseFormModal(true);
                  }}
                >
                  <span><i className="fe fe-plus"></i></span>
                  Create license
                </Button>
              </div>
            </div>

            <div
              className={`${styles.licenseGrid} ag-theme-alpine`}
              style={{
                height: `${Math.min(
                  560,
                  Math.max(250, 152 + Math.min(licenseData?.length || 1, 9) * 48)
                )}px`,
              }}
            >
              <AgGridReact
                id="license_grid"
                className="ag-theme-alpine"
                headerHeight={44}
                rowHeight={48}
                gridOptions={gridOptions}
                rowData={licenseData}
                columnDefs={licenseColumnDefs}
                pagination={true}
                paginationPageSize={20}
                onPaginationChanged={onPaginationChanged}
                defaultColDef={defaultColDef}
                components={frameworkComponents}
                context={{ gridId: "license_grid" }}
                overlayNoRowsTemplate={'<div class="license-empty-state"><i class="fe fe-award"></i><strong>No licenses yet</strong><span>Create the first license for this customer.</span></div>'}
              />
            </div>
          </section>
        </Modal.Body>
      </Modal>
    </>
  );
};
Customers.layout = "Contentlayout";
export default Customers;

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import {
  Button,
  Card,
  Col,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import WebhookUserModal from "../../../shared/data/admin/modals/WebhookUserModal";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import { getInitials, stringToColor } from "../../../shared/utils/regex";
import {
  addWebhookUser,
  changeWebhookUserStatus,
  deleteWebhookUser,
  getWebhookUsers,
  updateWebhookUser,
} from "../../../shared/redux/slices/webhookUsers/webhookUsers";

const ROW_HEIGHT = 140;
const HEADER_HEIGHT = 135;
const PAGINATION_BAR_HEIGHT = 148;

const WebhookUser = () => {
  const dispatch = useDispatch();
  const { getWebhookUsersData, isLoading } = useSelector(
    (state) =>
      state.webhookUsers || { getWebhookUsersData: [], isLoading: false },
  );
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setFormModal] = useState(false);
  const [rowValues, setRowValues] = useState(undefined);
  const [oneClick, setOneClick] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const [visibleCount, setVisibleCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const gridRef = useRef(null);
  const observerInstance = useRef(null);
  const gridHeight =
    HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 40;

  const webhookUsers = useMemo(
    () =>
      (getWebhookUsersData?.data || []).map((item) => ({
        ...item,
        username: item.loginid,
        status_label: item.status,
        status: item.status_boolean,
      })),
    [getWebhookUsersData],
  );

  useEffect(() => {
    dispatch(getWebhookUsers());
  }, [dispatch]);

  const filterUsers = useCallback(
    (searchValue = quickFilter, statusValue = compStatus) => {
      const value = (searchValue || "").toLowerCase();
      return webhookUsers.filter((item) => {
        const statusMatches = statusValue === "" || item.status === statusValue;
        const searchable =
          `${item.firstname || ""} ${item.lastname || ""} ${item.email || ""} ${item.mobile || ""} ${item.username || ""} ${item.organization || ""}`.toLowerCase();
        return statusMatches && searchable.includes(value);
      });
    },
    [webhookUsers, quickFilter, compStatus],
  );

  useEffect(() => {
    const filtered = filterUsers();
    setRowData(filtered);
    setGridData(filtered.slice(0, 50));
    setVisibleCount(50);
  }, [filterUsers]);

  const onFilterChanged = (value) => {
    setQuickFilter(value);
    const filtered = filterUsers(value, compStatus);
    setRowData(filtered);
    setGridData(filtered.slice(0, 50));
    setVisibleCount(50);
  };

  const handleChangeView = (nextView) => {
    setQuickFilter("");
    setView(nextView);
    const filtered = filterUsers("", compStatus);
    setRowData(filtered);
    setGridData(filtered.slice(0, 50));
    setVisibleCount(50);
  };

  const handleStatusFilter = (_event, value) => {
    if (value === null) return;
    setCompStatus(value);
    const filtered = filterUsers(quickFilter, value);
    setRowData(filtered);
    setGridData(filtered.slice(0, 50));
    setVisibleCount(50);
  };

  const defaultColDef = useMemo(
    () => ({ sortable: true, suppressMovable: true, flex: 1, resizable: true }),
    [],
  );
  const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };

  const onGridReady = useCallback((params) => {
    gridRef.current = params.api;
    const rows = Math.min(
      params.api.paginationGetPageSize(),
      params.api.getDisplayedRowCount(),
    );
    setPageSize(rows || 1);
  }, []);

  const onPaginationChanged = useCallback((params) => {
    if (!params.api) return;
    const rows = Math.min(
      params.api.paginationGetPageSize(),
      params.api.getDisplayedRowCount(),
    );
    setPageSize(rows || 1);
  }, []);

  const handleFormModal = (flag) => {
    setOneClick(false);
    setRowValues(undefined);
    setFormModal(flag);
  };

  const handleEdit = (item) => {
    setOneClick(false);
    setRowValues(item);
    setFormModal(true);
  };

  const refreshUsers = () => dispatch(getWebhookUsers());

  const save = async (values) => {
    try {
      setOneClick(true);
      const payload = { ...values };
      delete payload.isNew;
      if (!rowValues?.webhook_user_id) {
        await dispatch(addWebhookUser(payload));
      await refreshUsers();

        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            Webhook user has been created successfully.
          </p>,
          { position: toast.POSITION.TOP_RIGHT, theme: "colored" },
        );
      } else {
        delete payload.password;
        await dispatch(
          updateWebhookUser({
            ...payload,
            webhook_user_id: rowValues.webhook_user_id,
          }),
        );
      await refreshUsers();
        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            Webhook user has been updated successfully.
          </p>,
          { position: toast.POSITION.TOP_RIGHT, theme: "colored" },
        );
      }
      setFormModal(false);
      setRowValues(undefined);
    } catch (error) {
      void error;
    } finally {
      setOneClick(false);
    }
  };

  const handleStatusSwitch = (item) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to change the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await dispatch(
          changeWebhookUserStatus({
            webhook_user_id: item.webhook_user_id,
            status: item.status === "true" ? "Inactive" : "Active",
          }),
        );
        await refreshUsers();
        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            Webhook user status has been updated successfully.
          </p>,
          { position: toast.POSITION.TOP_RIGHT, theme: "colored" },
        );
      } catch (error) {
        void error;
      }
    });
  };

  const deleteUser = async (item) => {
    try {
      await dispatch(
        deleteWebhookUser({ webhook_user_id: item.webhook_user_id }),
      );
      await refreshUsers();
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          Webhook user has been deleted successfully.
        </p>,
        { position: toast.POSITION.TOP_RIGHT, theme: "colored" },
      );
    } catch (error) {
      void error;
    }
  };

  const handleDelete = (item, flag) => {
    if (flag) deleteUser(item);
  };
  const handleDeleteCard = (item) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) deleteUser(item);
    });
  };

  const frameworkComponents = {
    srNoRender: (props) => props.node.rowIndex + 1,
    actionButtonRenderer: (props) => (
      <ActionButtonRenderer
        handleEdit={handleEdit}
        handleShowEdit={true}
        handleDelete={handleDelete}
        propsVal={props}
      />
    ),
    actionSwitchRenderer: (props) => (
      <ToggleButton data={props.data} handleStatusSwitch={handleStatusSwitch} />
    ),
  };

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      maxWidth: 80,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
    {
      headerName: "Username",
      field: "username",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "First Name",
      field: "firstname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Last Name",
      field: "lastname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Email Id",
      field: "email",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Mobile No.",
      field: "mobile",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Status",
      field: "status",
      cellRenderer: "actionSwitchRenderer",
      width: 100,
      pinned: "right",
    },
    {
      headerName: "Action",
      field: "",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      minWidth: 90,
      pinned: "right",
    },
  ];

  const handleExport = () => {
    const data = rowData.map((item) => [
      item.firstname,
      item.lastname,
      item.email,
      item.mobile,
      item.username,
      item.status === "true" ? "Active" : "Inactive",
      item.createdon || "",
      item.modifiedon || "",
    ]);
    const headers = [
      "First Name",
      "Last Name",
      "Email Id",
      "Mobile No.",
      "Username",
      "Status",
      "Created On",
      "Modified On",
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Webhook Users");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.]/g, "")
      .slice(0, 15);
    XLSX.writeFile(workbook, `Webhook_Users_${timestamp}.xlsx`);
  };

  const columnOptions = [6, 4, 3, 2];
  const zoomIn = () => {
    const index = columnOptions.indexOf(columnsPerRow);
    if (index > 0) setColumnsPerRow(columnOptions[index - 1]);
  };
  const zoomOut = () => {
    const index = columnOptions.indexOf(columnsPerRow);
    if (index < columnOptions.length - 1)
      setColumnsPerRow(columnOptions[index + 1]);
  };

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !rowData.length || visibleCount >= rowData.length)
      return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((previous) => {
        const next = Math.min(previous + 50, rowData.length);
        setGridData(rowData.slice(0, next));
        return next;
      });
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, rowData, visibleCount]);

  const observerRef = useCallback(
    (node) => {
      if (observerInstance.current) observerInstance.current.disconnect();
      if (!node) return;
      observerInstance.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) handleLoadMore();
      });
      observerInstance.current.observe(node);
    },
    [handleLoadMore],
  );

  useEffect(
    () => () => {
      if (observerInstance.current) observerInstance.current.disconnect();
    },
    [],
  );

  return (
    <>
      <Seo title="Webhook User" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4>Webhook User</h4>
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
                      onChange={handleStatusFilter}
                      aria-label="Status"
                    >
                      <CustomToggleButton value="">All</CustomToggleButton>
                      <CustomToggleButton value="true">
                        Active
                      </CustomToggleButton>
                      <CustomToggleButton value="false">
                        Inactive
                      </CustomToggleButton>
                    </ToggleButtonGroup>
                    &nbsp;&nbsp;
                    <Button
                      type="button"
                      variant="outline-info"
                      onClick={handleExport}
                    >
                      <i className="fa fa-file-excel-o"></i> Export
                    </Button>
                    &nbsp;&nbsp;
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
                      value={quickFilter}
                      placeholder="Search..."
                      type="text"
                      onChange={(event) => onFilterChanged(event.target.value)}
                    />
                  </div>
                </div>
              </Col>
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
                      id="webhook_users_grid"
                      headerHeight={35}
                      rowHeight={40}
                      gridOptions={gridOptions}
                      rowData={rowData}
                      columnDefs={columnDefs}
                      pagination={true}
                      onGridReady={onGridReady}
                      paginationPageSize={20}
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
                      onPaginationChanged={onPaginationChanged}
                    />
                  </div>
                )}
              </Col>
            </Card.Body>
          </Card>
        </Col>

        <Col md={12}>
          {view === "card" && (
            <>
              {isLoading ? (
                <LoadingCards />
              ) : gridData.length ? (
                <>
                  <Row className="row-sm">
                    {gridData.map((item) => (
                      <WebhookUserCard
                        key={item.webhook_user_id}
                        item={item}
                        columnsPerRow={columnsPerRow}
                        handleEdit={handleEdit}
                        handleDelete={handleDeleteCard}
                        handleStatusSwitch={handleStatusSwitch}
                      />
                    ))}
                  </Row>
                  {visibleCount < rowData.length && (
                    <div
                      ref={observerRef}
                      className="d-flex justify-content-center my-4"
                      style={{ height: "40px" }}
                    >
                      {isLoadingMore && (
                        <div className="vertical-bounce-loader">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState onAdd={() => handleFormModal(true)} />
              )}
            </>
          )}
        </Col>
      </Row>
      {formModal && (
        <WebhookUserModal
          show={formModal}
          user={rowValues}
          loading={oneClick}
          onClose={() => handleFormModal(false)}
          onSubmit={save}
        />
      )}
    </>
  );
};

const LoadingCards = () => (
  <Row>
    <Col sm={12}>
      <Card className="custom-card">
        <Card.Body
          className="d-flex align-items-center justify-content-center"
          style={{ minHeight: "70vh" }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              aria-label="Loading"
            />
            <h5 className="mt-3 mb-0">Loading...</h5>
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

const EmptyState = ({ onAdd }) => (
  <Row>
    <Col sm={12}>
      <Card className="custom-card">
        <Card.Body className="overflow-auto pd-t-10">
          <Row className="text-center" style={{ height: "70vh" }}>
            <Col md={10} className="mx-auto">
              <Card style={{ border: "none" }}>
                <Card.Body>
                  <div className="text-center mt-5">
                    <img
                      src={crossEvalicon.src}
                      alt="user-img"
                      className="wd-150 mt-5"
                      onClick={onAdd}
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
);

const WebhookUserCard = ({
  item,
  columnsPerRow,
  handleEdit,
  handleDelete,
  handleStatusSwitch,
}) => {
  const mobile =
    item.mobile && String(item.mobile) !== "0" ? item.mobile : "NA";
  return (
    <Col md={12 / columnsPerRow} className="p-0">
      <Card
        className="card custom-card our-team"
        style={{ minHeight: "300px", height: "310px" }}
      >
        <Card.Body className="d-flex flex-column">
          <div className="picture avatar-lg online text-center">
            <div
              className="rounded-circle pointer"
              style={{
                width: "100px",
                height: "100px",
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: stringToColor(item.username || "Webhook User"),
                color: "#2b2b2b",
                fontWeight: 600,
                fontSize: "28px",
                userSelect: "none",
              }}
            >
              {getInitials(
                `${item.firstname || ""} ${item.lastname || ""}`.trim() ||
                  "Webhook User",
              )}
            </div>
          </div>
          <div className="text-center my-2">
            <h5 className="pro-user-username text-dark my-2 mb-0 pointer">
              <a>
                {item.firstname} {item.lastname}
              </a>
            </h5>
            <p className="pro-user-desc text-success mb-1 my-1">
              {item.username}
            </p>
          </div>
          <div className="contact-info mb-0 text-center">
            <div className="btn btn-sm ripple bg-primary-transparent text-primary rounded-circle mx-1">
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip>{mobile}</Tooltip>}
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
            <div
              className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle mx-1"
              onClick={() => handleDelete(item)}
            >
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip>Delete</Tooltip>}
              >
                <i className="fe fe-trash-2"></i>
              </OverlayTrigger>
            </div>
            <div className="btn btn-sm ripple">
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip>Change Status</Tooltip>}
              >
                <label className="custom-switch mb-0">
                  <input
                    type="checkbox"
                    className="custom-switch-input"
                    checked={item.status === "true"}
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
};

WebhookUser.layout = "Contentlayout";
export default WebhookUser;

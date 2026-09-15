import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
  Button,
  Card,
  Col,
  Form,
  Modal,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Select, { components as selectComponents } from "react-select";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import {
  changeThirdPartyIntegrationStatus,
  clearDeleteThirdPartyIntegration,
  clearThirdPartyError,
  clearSaveThirdPartyIntegration,
  clearStatusThirdPartyIntegration,
  clearUpdateThirdPartyIntegration,
  deleteThirdPartyIntegration,
  getThirdPartyIntegrations,
  saveThirdPartyIntegration,
  updateThirdPartyIntegration,
} from "../../../../shared/redux/slices/masters/thirdPartyIntegrations";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;
const emptyForm = {
  integration_name: "",
  integration_url: "",
  description: "",
  order: 0,
  target_panels: ["SIMUser"],
};
const targetPanelOptions = [
  { value: "SIMUser", label: "SIMUser" },
  { value: "SIMInstructor", label: "SIMInstructor" },
  { value: "SIMMaster", label: "SIMMaster" },
];
const CheckboxOption = (props) => (
  <selectComponents.Option {...props}>
    <input
      type="checkbox"
      checked={props.isSelected}
      readOnly
      className="me-2"
    />
    {props.label}
  </selectComponents.Option>
);
const normalizeUrl = (value) =>
  /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;

const ThirdPartyIntegrations = () => {
  const dispatch = useDispatch();
  const gridRef = useRef(null);
  const [view, setView] = useState("card");
  const [statusFilter, setStatusFilter] = useState("true");
  const [quickFilter, setQuickFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const [pageSize, setPageSize] = useState(20);

  const { items, isLoading, error, saved, updated, statusChanged, deleted } =
    useSelector((state) => {
      const data = state.thirdPartyIntegrationsMaster || {};
      return {
        items: data.getThirdPartyIntegrationData?.data || [],
        isLoading: data.isLoading,
        error: data.error,
        saved: data.saveThirdPartyIntegrationData,
        updated: data.updateThirdPartyIntegrationData,
        statusChanged: data.statusChangeThirdPartyIntegrationData,
        deleted: data.deleteThirdPartyIntegrationData,
      };
    });

  useEffect(() => {
    dispatch(getThirdPartyIntegrations());
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    const value = quickFilter.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesSearch =
        !value ||
        `${item.integration_name} ${item.integration_url} ${item.description || ""} ${item.target_panel} ${item.order}`
          .toLowerCase()
          .includes(value);
      return matchesStatus && matchesSearch;
    });
  }, [items, quickFilter, statusFilter]);

  useEffect(() => {
    if (!error) return;
    const responseError = error?.response?.data || error;
    const responseMessages = responseError?.errors || responseError?.message;
    const messages = Array.isArray(responseMessages)
      ? responseMessages
      : [responseMessages || "Something went wrong."];
    messages.forEach((message) =>
      toast.error(message, {
        position: toast.POSITION.TOP_RIGHT,
        theme: "colored",
      }),
    );
    dispatch(clearThirdPartyError());
  }, [dispatch, error]);

  useEffect(() => {
    if (!saved?.statusCode) return;
    toast.success(saved.message, {
      position: toast.POSITION.TOP_RIGHT,
      theme: "colored",
    });
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    dispatch(getThirdPartyIntegrations());
    dispatch(clearSaveThirdPartyIntegration());
  }, [saved]);

  useEffect(() => {
    if (!updated?.statusCode) return;
    toast.success(updated.message, {
      position: toast.POSITION.TOP_RIGHT,
      theme: "colored",
    });
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    dispatch(getThirdPartyIntegrations());
    dispatch(clearUpdateThirdPartyIntegration());
  }, [updated]);

  useEffect(() => {
    if (!statusChanged?.statusCode) return;
    toast.success(statusChanged.message, {
      position: toast.POSITION.TOP_RIGHT,
      theme: "colored",
    });
    dispatch(getThirdPartyIntegrations());
    dispatch(clearStatusThirdPartyIntegration());
  }, [statusChanged]);

  useEffect(() => {
    if (!deleted?.statusCode) return;
    toast.success(deleted.message, {
      position: toast.POSITION.TOP_RIGHT,
      theme: "colored",
    });
    dispatch(getThirdPartyIntegrations());
    dispatch(clearDeleteThirdPartyIntegration());
  }, [deleted]);

  const openForm = (item = null) => {
    setEditingId(item?.integration_id || null);
    setForm(
      item
        ? {
            integration_name: item.integration_name,
            integration_url: item.integration_url,
            description: item.description || "",
            order: item.order || 0,
            target_panels: (item.target_panel || "").split(",").filter(Boolean),
          }
        : emptyForm,
    );
    setShowForm(true);
  };

  const submitForm = (event) => {
    event.preventDefault();
    if (!form.target_panels.length) {
      toast.error("Select at least one target panel.", {
        position: toast.POSITION.TOP_RIGHT,
        theme: "colored",
      });
      return;
    }
    const payload = {
      ...form,
      integration_url: normalizeUrl(form.integration_url),
      order: Number(form.order),
    };
    dispatch(
      editingId
        ? updateThirdPartyIntegration({ integration_id: editingId, ...payload })
        : saveThirdPartyIntegration(payload),
    );
  };

  const confirmDelete = (item, confirmed = false) => {
    if (confirmed)
      return dispatch(
        deleteThirdPartyIntegration({ integration_id: item.integration_id }),
      );
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this integration?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      confirmButtonText: "Yes, delete it!",
      allowOutsideClick: false,
    }).then(
      (result) =>
        result.isConfirmed &&
        dispatch(
          deleteThirdPartyIntegration({ integration_id: item.integration_id }),
        ),
    );
  };

  const changeStatus = (item) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to change the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then(
      (result) =>
        result.isConfirmed &&
        dispatch(
          changeThirdPartyIntegrationStatus({
            integration_id: item.integration_id,
            status: item.status === "false" ? "true" : "false",
          }),
        ),
    );
  };

  const defaultColDef = useMemo(
    () => ({ sortable: true, suppressMovable: true, flex: 1, resizable: true }),
    [],
  );
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Sr No.",
        cellRenderer: (props) => props.node.rowIndex + 1,
        maxWidth: 80,
        sortable: false,
      },
      {
        headerName: "Application Name",
        field: "integration_name",
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: "Application URL",
        field: "integration_url",
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: "Target Panels",
        field: "target_panel",
        filter: true,
        floatingFilter: true,
        valueFormatter: (props) => (props.value || "").split(",").join(", "),
      },
      { headerName: "Order", field: "order", maxWidth: 100 },
      {
        headerName: "Status",
        field: "status",
        pinned: "right",
        width: 90,
        cellRenderer: (props) => (
          <label className="custom-switch">
            <input
              type="checkbox"
              className="custom-switch-input"
              checked={props.data.status === "true"}
              readOnly
              onClick={() => changeStatus(props.data)}
            />
            <span className="custom-switch-indicator custom-switch-indicator-md" />
          </label>
        ),
      },
      {
        headerName: "Action",
        pinned: "right",
        width: 110,
        sortable: false,
        cellRenderer: (props) => (
          <ActionButtonRenderer
            handleEdit={openForm}
            propsVal={props}
            handleShowEdit={true}
            handleDelete={confirmDelete}
          />
        ),
      },
    ],
    [],
  );

  const onGridReady = useCallback((params) => {
    gridRef.current = params.api;
    setPageSize(
      Math.min(
        params.api.paginationGetPageSize(),
        params.api.getDisplayedRowCount(),
      ),
    );
  }, []);
  const onPaginationChanged = useCallback((params) => {
    if (params.api)
      setPageSize(
        Math.min(
          params.api.paginationGetPageSize(),
          params.api.getDisplayedRowCount(),
        ),
      );
  }, []);
  const gridHeight =
    HEADER_HEIGHT +
    ROW_HEIGHT * Math.max(pageSize, 1) +
    PAGINATION_BAR_HEIGHT +
    4;
  const zoomValues = [6, 4, 3, 2];
  const zoomOut = () =>
    setColumnsPerRow(
      (value) =>
        zoomValues[
          Math.min(zoomValues.indexOf(value) + 1, zoomValues.length - 1)
        ],
    );
  const zoomIn = () =>
    setColumnsPerRow(
      (value) => zoomValues[Math.max(zoomValues.indexOf(value) - 1, 0)],
    );

  return (
    <>
      <Seo title="Third Party Integrations" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5>Third Party Integrations</h5>
                <div className="d-flex align-items-center flex-wrap gap-1">
                  {view === "card" && (
                    <>
                      <Button
                        variant="outline-success"
                        onClick={zoomOut}
                        title="Zoom In"
                      >
                        <i className="fas fa-search-plus" />
                      </Button>
                      <Button
                        variant="outline-success"
                        onClick={zoomIn}
                        title="Zoom Out"
                      >
                        <i className="fas fa-search-minus" />
                      </Button>
                    </>
                  )}
                  <Button
                    title="Card View"
                    variant="outline-success"
                    onClick={() => setView("card")}
                    className={view === "card" ? "active text-white" : ""}
                  >
                    <i className="fe fe-grid" />
                  </Button>
                  <Button
                    title="List View"
                    variant="outline-success"
                    onClick={() => setView("list")}
                    className={view === "list" ? "active text-white" : ""}
                  >
                    <i className="fe fe-list" />
                  </Button>
                  <ToggleButtonGroup
                    color="success"
                    value={statusFilter}
                    size="small"
                    exclusive
                    onChange={(_, value) =>
                      value !== null && setStatusFilter(value)
                    }
                  >
                    <CustomToggleButton value="">All</CustomToggleButton>
                    <CustomToggleButton value="true">Active</CustomToggleButton>
                    <CustomToggleButton value="false">
                      Inactive
                    </CustomToggleButton>
                  </ToggleButtonGroup>
                  <Button variant="outline-primary" onClick={() => openForm()}>
                    <i className="fa fa-plus" /> Add
                  </Button>
                  <input
                    className="form-control bd bd-2 ms-1 w-auto"
                    value={quickFilter}
                    placeholder="Search..."
                    onChange={(event) => setQuickFilter(event.target.value)}
                  />
                </div>
              </div>
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
                    rowData={filteredItems}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    headerHeight={HEADER_HEIGHT}
                    rowHeight={ROW_HEIGHT}
                    pagination
                    paginationPageSize={20}
                    onGridReady={onGridReady}
                    onPaginationChanged={onPaginationChanged}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {view === "card" && (
        <Row className="row-sm">
          {filteredItems.map((item) => (
            <Col
              key={item.integration_id}
              md={12 / columnsPerRow}
              className="p-1"
            >
              <Card className="card custom-card our-team h-100">
                <Card.Body className="p-3 text-center">
                  <div className="avatar avatar-lg rounded-circle bg-primary-transparent text-primary mx-auto mb-2 d-flex align-items-center justify-content-center">
                    <i className="fa fa-plug fs-24" />
                  </div>
                  <h5
                    className="pro-user-username text-dark mb-1"
                    title={item.integration_name}
                  >
                    {item.integration_name.length > 24
                      ? `${item.integration_name.substring(0, 24)}...`
                      : item.integration_name}
                  </h5>
                  <p className="text-muted mb-1">
                    {(item.target_panel || "").split(",").join(", ")} · Order{" "}
                    {item.order}
                  </p>
                  <p
                    className="text-muted text-truncate"
                    title={item.description}
                  >
                    {item.description || "No description"}
                  </p>
                  <div className="mb-0">
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Open</Tooltip>}
                    >
                      <Button
                        variant={null}
                        // as="a"
                        href={item.integration_url}
                        target="_blank"
                        // rel="noopener noreferrer"
                        size="sm"
                        className="rounded-circle bg-primary-transparent text-primary border-0"
                      >
                        <i className="fe fe-external-link" />
                      </Button>
                    </OverlayTrigger>{" "}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Update</Tooltip>}
                    >
                      <Button
                        variant={null}
                        size="sm"
                        className="rounded-circle bg-info-transparent text-info border-0"
                        onClick={() => openForm(item)}
                      >
                        <i className="fe fe-edit" />
                      </Button>
                    </OverlayTrigger>{" "}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip>
                          {item.status === "true" ? "Active" : "Inactive"}
                        </Tooltip>
                      }
                    >
                      <span>
                        <label className="custom-switch d-inline-block ms-1">
                          <input
                            type="checkbox"
                            className="custom-switch-input"
                            checked={item.status === "true"}
                            readOnly
                            onClick={() => changeStatus(item)}
                          />
                          <span className="custom-switch-indicator custom-switch-indicator-md" />
                        </label>
                      </span>
                    </OverlayTrigger>{" "}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Delete</Tooltip>}
                    >
                      <Button
                        size="sm"
                        className="rounded-circle bg-danger-transparent text-danger border-0"
                        onClick={() => confirmDelete(item)}
                      >
                        <i className="fe fe-trash-2" />
                      </Button>
                    </OverlayTrigger>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {!isLoading && filteredItems.length === 0 && (
            <Col md={12}>
              <Card className="custom-card">
                <Card.Body className="text-center p-5">
                  No integrations found.
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      <Modal
        show={showForm}
        onHide={() => !isLoading && setShowForm(false)}
        backdrop="static"
        size="lg"
      >
        <Form onSubmit={submitForm}>
          <Modal.Header>
            <Modal.Title>
              {editingId ? "Update" : "Add"} Third Party Integration
            </Modal.Title>
            <i
              className="fas fa-close fs-18 pointer"
              onClick={() => !isLoading && setShowForm(false)}
            />
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Application Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={150}
                  value={form.integration_name}
                  onChange={(event) =>
                    setForm({ ...form, integration_name: event.target.value })
                  }
                />
              </Form.Group>
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Target Panels <span className="text-danger">*</span>
                </Form.Label>
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  options={targetPanelOptions}
                  components={{ Option: CheckboxOption }}
                  value={targetPanelOptions.filter((option) =>
                    form.target_panels.includes(option.value),
                  )}
                  onChange={(selected) =>
                    setForm({
                      ...form,
                      target_panels: selected.map((option) => option.value),
                    })
                  }
                  placeholder="Select target panels"
                  classNamePrefix="third-party-target"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: 38,
                      backgroundColor: "var(--dark-bg-color)",
                      borderColor: state.isFocused
                        ? "var(--primary-bg-color)"
                        : "var(--border)",
                      boxShadow: "none",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                      backgroundColor: "var(--dark-bg-color)",
                    }),
                    option: (base, state) => ({
                      ...base,
                      color: "var(--light-text-color)",
                      backgroundColor: state.isFocused
                        ? "var(--primary-bg-color)"
                        : "transparent",
                      cursor: "pointer",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "var(--primary-bg-color)",
                    }),
                    multiValueLabel: (base) => ({ ...base, color: "#fff" }),
                    input: (base) => ({
                      ...base,
                      color: "var(--light-text-color)",
                    }),
                  }}
                />
                <Form.Text>
                  Select every panel where this integration should appear.
                </Form.Text>
              </Form.Group>
              <Form.Group as={Col} md="8" className="mb-3">
                <Form.Label>
                  Application URL <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  maxLength={2048}
                  placeholder="https://example.com"
                  value={form.integration_url}
                  onChange={(event) =>
                    setForm({ ...form, integration_url: event.target.value })
                  }
                />
              </Form.Group>
              <Form.Group as={Col} md="4" className="mb-3">
                <Form.Label>
                  Order <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(event) =>
                    setForm({ ...form, order: event.target.value })
                  }
                />
              </Form.Group>
              <Form.Group as={Col} md="12">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </Form.Group>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            {isLoading ? (
              <Button disabled>
                <Spinner animation="grow" size="sm" /> Loading...
              </Button>
            ) : (
              <Button type="submit">Submit</Button>
            )}
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={() => setShowForm(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default ThirdPartyIntegrations;

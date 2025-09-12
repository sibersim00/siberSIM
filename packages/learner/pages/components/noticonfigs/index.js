import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import TB from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { AgGridReact } from "ag-grid-react";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterbuttons/action-button";
import "../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  getNotiTemplateList,
  getSelectors,
  saveTemplate,
  clearHasError,
  clearSaveTemplateData,
} from "../../../shared/redux/slices/noticonfigs/noticonfigs";
import Swal from "sweetalert2";
import EditViewTemplate from "../../../shared/data/noticonfigs/editViewTemplate";

const NotiConfigs = () => {
  const { t } = useTranslation();
  const [templateStatus, setTemplateStatus] = useState("Active");
  const [quickFilter, setQuickFilter] = useState("");
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const dispatch = useDispatch();
  const [openOffcanvas, setOpenOffcanvas] = useState(false);
  const [rowValues, setRowValues] = useState({
    name: "",
    body: "",
    link: "",
  });
  const { getNotiTempData, getSelectorData, saveTemplateResponse, errorData } =
    useSelector((state) => {
      return {
        getNotiTempData:
          state &&
          state.noticonfigs &&
          state.noticonfigs.getNotiTempData &&
          state.noticonfigs.getNotiTempData.data,

        getSelectorData:
          state &&
          state.noticonfigs &&
          state.noticonfigs.getSelectorData &&
          state.noticonfigs.getSelectorData.data,

        saveTemplateResponse:
          state &&
          state.noticonfigs &&
          state.noticonfigs.saveTemplateResponse &&
          state.noticonfigs.saveTemplateResponse,

        errorData: state && state.noticonfigs && state.noticonfigs.error,
      };
    });

  const columnDefs = [
    {
      headerName: t("noti_config.column_defs.template_name"),
      field: "template_name",
      filter: true,
      floatingFilter: true,
      flex: 1,
    },
    {
      headerName: t("noti_config.column_defs.template_action"),
      field: "template_action",
      filter: true,
      floatingFilter: true,
      flex: 1,
    },
    {
      headerName: t("noti_config.column_defs.status"),
      field: "status",
      cellRenderer: "actionStatusChange",
      width: 150,
    },
    {
      headerName: t("noti_config.column_defs.action"),
      field: "action",
      cellRenderer: "actionButtonRenderer",
      pinned: "right",
      width: 150,
    },
  ];

  useEffect(() => {
    if (saveTemplateResponse?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveTemplateResponse?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getNotiTemplateList());
      dispatch(clearSaveTemplateData());
    }
  }, [saveTemplateResponse]);

  useEffect(() => {
    if (getNotiTempData) {
      setRowData(getNotiTempData);
    }
  }, [getNotiTempData]);

  useEffect(() => {
    dispatch(getNotiTemplateList());
  }, []);

  useEffect(() => {
    if (getNotiTempData) {
      if (templateStatus === "") {
        setRowData(getNotiTempData);
      } else if (templateStatus === "Active") {
        const filteredData =
          getNotiTempData.length > 0 &&
          getNotiTempData.filter(
            (data) => data?.status?.toString() == "Active"
          );
        setRowData(filteredData);
      } else if (templateStatus === "In Active") {
        const filteredData =
          getNotiTempData.length > 0 &&
          getNotiTempData.filter(
            (data) => data?.status?.toString() == "In Active"
          );
        setRowData(filteredData);
      }
    }
  }, [getNotiTempData, templateStatus]);

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
      dispatch(clearHasError());
    }
  }, [errorData]);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
    };
  }, []);

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const onFilterChanged = (data) => {
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };
  const handleEdit = (props) => {
    handleOffcanvas();
    setRowValues(props);
    dispatch(getSelectors(props.template_id));
  };



  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_status"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          id: data?.template_id,
          template_name: data?.template_name,
          body: data?.body,
          link: data?.link,
          status: data?.status == "Active" ? "In Active" : "Active",
        };
        dispatch(saveTemplate(payload));
      }
    });
  };

  const frameworkComponents = {
    actionStatusChange: function (props) {
      return (
        <label className="custom-switch">
          <input
            type="checkbox"
            name="custom-switch-checkbox1"
            className="custom-switch-input"
            checked={props?.data?.status == "Active" ? true : false}
            onChange={() => handleStatusSwitch(props?.data)}
          />
          <span className="custom-switch-indicator custom-switch-indicator-md"></span>
        </label>
      );
    },
    actionButtonRenderer: function (props) {
      return (
        <div>
          <ActionButtonRenderer
            propsVal={props}
            handleShowEdit={true}
            handleEdit={handleEdit}
          />
        </div>
      );
    },
  };

  const handleOffcanvas = () => {
    setOpenOffcanvas(!openOffcanvas);
  };

  return (
    <div>
      <Seo title="Notification Configuration" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <div className="">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex flex-grow-1 mg-r-5">
                    <h5>{t("noti_config.title")}</h5>
                  </div>
                  <div className="mg-r-2">
                    <ToggleButtonGroup
                      className="mg-r-10"
                      color="success"
                      value={templateStatus}
                      size="small"
                      exclusive
                      onChange={(e) => {
                        setTemplateStatus(e.target.value);
                      }}
                      aria-label="Platform"
                    >
                      <TB value="">{t("common.all")}</TB>
                      <TB value="Active">{t("common.active")}</TB>
                      <TB value="In Active">{t("common.inactive")}</TB>
                    </ToggleButtonGroup>{" "}
                    &nbsp;&nbsp;
                  </div>

                  <div>
                    <input
                      className="form-control bd bd-2"
                      value={quickFilter}
                      placeholder={t("common.search")}
                      type="text"
                      onChange={(e) => onFilterChanged(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div
                className="ag-theme-alpine mg-t-20"
                style={{ height: "40.2em", width: "100%" }}
              >
                <AgGridReact
                  id="staff_grid"
                  gridOptions={gridOptions}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  pagination={true}
                  onGridReady={onGridReady}
                  components={frameworkComponents}
                  defaultColDef={defaultColDef}
                  overlayNoRowsTemplate="No data available"
                  suppressRowClickSelection={true}
                ></AgGridReact>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <EditViewTemplate
        openOffcanvas={openOffcanvas}
        handleOffcanvas={handleOffcanvas}
        rowValues={rowValues}
        getSelectorData={getSelectorData}
      />
    </div>
  );
};
NotiConfigs.layout = "Contentlayout";
export default NotiConfigs;

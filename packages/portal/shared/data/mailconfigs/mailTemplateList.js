import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button } from "react-bootstrap";
import ActionButtonRenderer from "../masterButtons/action-button";
import ToggleButton from "../masterButtons/toggleButton";
import Swal from "sweetalert2";
import TB from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ViewOffCanvas from "./offcanvas/workflowOffcanvas";
import { getTemplateByactionId } from "../../redux/slices/mailconfig/activitiesWorkflow";
import { setLocalStorageData } from "../../redux/slices/localstorage/LocalStorage";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";

const ActionTemplates = (props) => {
  const { selectedAdmin, setTabIndex } = props;
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [compStatus, setCompStatus] = useState("true");
  const [quickFilter, setQuickFilter] = useState("");
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);

  const { TemplateListResp, errorData } = useSelector((state) => {
    return {
      TemplateListResp:
        state &&
        state.activitydata &&
        state.activitydata.templateData &&
        state.activitydata.templateData.data,

      errorData: state && state.activitydata && state.mailconfigSlice.error,
    };
  });

  useEffect(() => {
    if (selectedAdmin && selectedAdmin != "") {
      dispatch(getTemplateByactionId(selectedAdmin?.action_id));
    }
  }, [selectedAdmin]);

  useEffect(() => {
    if (TemplateListResp && TemplateListResp != undefined) {
      setCompStatus("true");
      setRowData(TemplateListResp);
    }
  }, [TemplateListResp]);

  useEffect(() => {
    if (
      TemplateListResp &&
      TemplateListResp !== undefined &&
      TemplateListResp.length > 0
    ) {
      if (compStatus === "") {
        setRowData(TemplateListResp);
      } else if (compStatus == "true") {
        const filteredData = TemplateListResp.filter(
          (location) => location?.status == "Active"
        );
        setRowData(filteredData);
      } else if (compStatus == "false") {
        const filteredData = TemplateListResp.filter(
          (location) => location?.isactive == "Inactive"
        );
        setRowData(filteredData);
      }
    }
  }, [TemplateListResp, compStatus]);

  const columnDefs = [
    {
      headerName: t("mail_config.action_template.columns.template_name"),
      field: "template_name",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
      width: 250,
      resizable: true,
    },
    {
      headerName: t("mail_config.action_template.columns.subject"),
      field: "subject",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
      width: 250,
      resizable: true,
    },

    {
      headerName: t("mail_config.action_template.columns.status"),
      field: "status",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
      width: 150,
      resizable: true,
    },
    {
      headerName: t("mail_config.action_template.columns.action"),
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      minWidth: 100,
      width: 100,
      resizable: true,
      pinned: "right",
    },
  ];

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  const frameworkComponents = {
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEdit={handleEdit}
          propsVal={props}
          handleShowEdit={true}
          handleShowEditView={true}
          handleEditView={handleEditView}
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
  };

  const handleEdit = (props) => {
    dispatch(setLocalStorageData("tempateData", props));
    setTabIndex("tab4");
  };

  const [opencanvas, setOpenCanvas] = useState(false);
  const [opencanvasdata, setOpenCanvasdata] = useState("");

  const handleEditView = (props) => {
    setOpenCanvas(true);
    setOpenCanvasdata(props);
  };
  const handleCanvas = () => {
    setOpenCanvas(false);
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
        const payload = {
          isactive: !data.isactive,
        };
        const Id = data?.menuid;
      }
    });
  };

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

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
    };
  }, []);

  return (
    <>
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <Col md={12} className="mg-b-10">
                <div className="">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex flex-grow-1 mg-r-5">
                    <h5>{selectedAdmin.displayname}</h5>
                  </div>
                  <div className="mg-r-2">
                    <ToggleButtonGroup
                      className="mg-r-10"
                      value={compStatus}
                      size="small"
                      exclusive
                      onChange={(e) => {
                        setCompStatus(e.target.value);
                      }}
                      aria-label="Platform"
                    >
                      <TB value="">{t("common.all")}</TB>
                      <TB value="true">{t("common.active")}</TB>
                      <TB value="false">{t("common.inactive")}c</TB>
                    </ToggleButtonGroup>{" "}
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
              </Col>

              <Col md={12}>
                <div
                  className="ag-theme-alpine"
                  style={{ height: "38em", width: "100%" }}
                >
                  <AgGridReact
                    id="staff_grid"
                    headerHeight={35}
                    rowHeight={40}
                    gridOptions={gridOptions}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    onGridReady={onGridReady}
                    frameworkComponents={frameworkComponents}
                    defaultColDef={defaultColDef}
                  ></AgGridReact>
                </div>
              </Col>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {opencanvas && (
        <ViewOffCanvas
          opencanvas={opencanvas}
          handleCanvas={handleCanvas}
          opencanvasdata={opencanvasdata}
          selectedAdmin={selectedAdmin}
        />
      )}
    </>
  );
};

export default ActionTemplates;

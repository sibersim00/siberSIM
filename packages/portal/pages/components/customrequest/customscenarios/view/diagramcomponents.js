import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Swal from "sweetalert2";

import { AgGridReact } from "ag-grid-react";
import {
  saveComponentConfiguration,
  getSingleScenarios,
  clearSingleScenarios,
  clearSaveComponentConfiguration,
  getScenarioList,
} from "../../../../../shared/redux/slices/customScenarios/customscenarioManage";
import dummy_network from "../../../../../public/assets/img/dummy.jpg";
import { toast } from "react-toastify";
import { maxWidth } from "@mui/system";

const DiagramComponents = (props) => {
  const { scenarioId, setScenarioId, setTabIndex, setView, setRowValues } =
    props;
  const [networkconfigData, setNetworkconfigData] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (scenarioId) {
      dispatch(getSingleScenarios(scenarioId));
    }
  }, []);

  const { hasGetScenarioListSucc, saveComponentConfigRes, errorData } =
    useSelector((state) => {
      return {
        hasGetScenarioListSucc:
          state &&
          state.customScenario &&
          state.customScenario.singleScenarios &&
          state.customScenario.singleScenarios.data,
        saveComponentConfigRes:
          state &&
          state.customScenario &&
          state.customScenario.saveComponentConfigData &&
          state.customScenario.saveComponentConfigData,
        errorData: state && state.customScenario && state.customScenario.error,
      };
    });
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };
  const [rowData, setRowData] = useState([]);
  const [rowData2, setRowData2] = useState([]);
  const [publishedDate, setPublishedDate] = useState(null);
  const columnDefs = [
    {
      headerName: "",
      field: "drag",
      rowDrag: true,
      width: 25,
      flex: 0,
      suppressSizeToFit: true,
    },
    {
      headerName: "VM ID",
      field: "vmid", // any field, since you're customizing it anyway
      width: 200,
      cellRenderer: (params) => {
        const imageUrl = params.data?.imageurl;
        const vmid = params.data?.vmid;

        return (
          <div className="d-flex align-items-center">
            <img
              src={imageUrl || dummy_network.src}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = dummy_network.src;
              }}
              alt="VM"
              style={{
                width: "30px",
                height: "30px",
                objectFit: "cover",
                borderRadius: "6px",
                marginRight: "8px",
              }}
            />
            <span>{vmid}</span>
          </div>
        );
      },
    },
    {
      headerName: "VM Name",
      field: "componentname",
    },
    {
      headerName: "Delay(Seconds)",
      field: "duration",
      width: 150,
      cellRenderer: (params) => {
        const delay = params.data?.duration;
        const value = typeof delay === "number" ? delay : 0;
        return <span>{value} Sec</span>;
      },
    },
  ];
  const frameworkComponents = {
    imageData: function (props) {
      return (
        <div className="d-flex justify-content-center align-items-center">
          <img
            alt="VM"
            src={props.value || dummy_network.src}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = dummy_network.src;
            }}
            style={{
              width: "30px",
              height: "30px",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />
        </div>
      );
    },
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
    };
  }, []);

  useEffect(() => {
    if (
      hasGetScenarioListSucc &&
      hasGetScenarioListSucc.component_config &&
      hasGetScenarioListSucc.component_config !== ""
    ) {
      const parsedcomponentData = JSON.parse(
        hasGetScenarioListSucc.component_config
      );

      // Map to set default duration = 0 if missing or falsy
      const sanitizedData = parsedcomponentData.map((item) => ({
        ...item,
        duration: item.duration != null ? item.duration : 0, // if duration is null/undefined, set 0
      }));

      setRowData(sanitizedData);
      setGridData(sanitizedData);
    }
    if (hasGetScenarioListSucc && hasGetScenarioListSucc.network_config) {
      setNetworkconfigData(hasGetScenarioListSucc.network_config);

      // Instead of pushing one network per row, create a single row with all network ids
      setRowData2([{ networkid: hasGetScenarioListSucc.network_config }]);

      // Format publishedon date
      const publishedRaw = hasGetScenarioListSucc.publishedon;
      if (publishedRaw) {
        const formatted = new Date(publishedRaw)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, "-"); // eg. "11-Jun-2025"
        setPublishedDate(formatted);
      }
    }
  }, [hasGetScenarioListSucc]);
  const onRowDragEnd = useCallback((event) => {
    const updatedData = [];

    // Collect the updated order of rows
    event.api.forEachNodeAfterFilterAndSort((node) => {
      updatedData.push(node.data);
    });
    setRowData(updatedData); // Update the state with the new order
  }, []);
  const onRejectClick = async () => {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to reject this scenario?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Reject",
    cancelButtonText: "Cancel",
    confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
    reverseButtons: true,
  });

  if (confirmResult.isConfirmed) {
    const { value: reason } = await Swal.fire({
      title: "Reject Reason",
      input: "textarea",
      inputLabel: "Please provide a reason for rejection",
      inputPlaceholder: "Enter reason here...",
      inputAttributes: {
        "aria-label": "Reject reason",
      },
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
     confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      inputValidator: (value) => {
        if (!value) {
          return "Reject reason is required!";
        }
      },
    });

    if (reason) {
      // Proceed to submit with reject reason
      onSubmit("Reject", reason);
    }
  }
};
  const onSubmit = (status, rejectReason = "") => {
  let list = [];
  rowData.map((obj, index) => {
    list.push({
      order: index + 1,
      componentid: obj.componentid,
      network_ids: obj.network_ids,
      vmid: obj.vmid,
      componentname: obj.componentname,
      duration: obj.duration,
      imageurl: obj.imageurl,
      nodeid: obj.nodeid,
    });
  });

  const payload = {
    component_config: list,
    network_config: networkconfigData,
    approval_status: status,
    scenarioid: scenarioId,
    reject_reason: rejectReason, // 👈 New field
  };

  dispatch(saveComponentConfiguration(payload));
};
  useEffect(() => {
    if (saveComponentConfigRes && saveComponentConfigRes.statusCode === 200) {
      setScenarioId("");
      setRowValues({});
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveComponentConfigRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearSaveComponentConfiguration());
      dispatch(clearSingleScenarios());
      setView("list");
      dispatch(getScenarioList());
      //    push(`/scenarios_view/${scenarioId}?tab=diagram`);
    }
  }, [saveComponentConfigRes]);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(rowData);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setRowData(reordered);
  };
  return (
    <>
      <Row className="row-sm mg-t-10">
        <Col md={12}>
          <Card className="custom-card d-flex">
            <Card.Body>
              <Row className="d-flex flex-row gap-2 space between ">
                <Col md={6}>
                  <label className="form-label text-muted fw-semibold">
                    VM Orders
                  </label>

                  <div
                    className="ag-theme-alpine"
                    style={{ height: "30em", width: "100%" }}
                  >
                    <AgGridReact
                      rowData={rowData}
                      columnDefs={columnDefs}
                      defaultColDef={defaultColDef}
                      rowDragManaged={true}
                      animateRows={true}
                      onRowDragEnd={onRowDragEnd}
                      components={frameworkComponents}
                      headerHeight={30}
                      rowHeight={35}
                    />
                  </div>
                </Col>

                {/* <Col md={4} className="ms-3">
                  <div
                    className="ag-theme-alpine mt-2"
                    style={{ height: "30em", width: "100%" }}
                  >
                    <AgGridReact
                      rowData={rowData2}
                      defaultColDef={defaultColDef}
                      columnDefs={columnDefs2}
                      rowHeight={30}

                      headerHeight={30}
                    />
                  </div>
                </Col> */}

                <Col md={4} className="ms-3">
                  <label className="form-label text-muted fw-semibold">
                    VM Network
                  </label>
                  <div
                    className=""
                    style={{ width: "100%", overflowY: "auto" }}
                  >
                    {/* <h6 className="mb-3 fw-semibold text-muted">VM Network</h6> */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginBottom: "1rem",
                      }}
                    >
                      {rowData2?.map((item, idx) =>
                        (Array.isArray(item.networkid)
                          ? item.networkid
                          : [item.networkid]
                        )?.map((network, i) => (
                          <span
                            key={`${idx}-${i}`}
                            className="badge bg-primary text-white"
                            style={{
                              borderRadius: "999px",
                              fontSize: "0.75rem",
                              padding: "0.4em 0.75em",
                              lineHeight: "1.2",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {network}
                          </span>
                        ))
                      )}
                    </div>

                    {/* Published Date */}
                    <div className="mt-3">
                      <h6 className="fw-semibold text-muted mb-1">
                        Published Date
                      </h6>
                      <p className="mb-0 text-dark">{publishedDate || "-"}</p>
                    </div>
                  </div>
                </Col>
              </Row>
            
              {/* <div className="justify-content-end d-flex mt-2">
  {hasGetScenarioListSucc?.approval_status === "Pending" && (
    <>
      <Button className="bg-secondary" onClick={() => onSubmit("Pending")}>
        Save as Draft
      </Button>
      <Button className="mx-2 bg-danger" onClick={() => onSubmit("Reject")}>
        Reject
      </Button>
      <Button className="bg-success" onClick={() => onSubmit("Approve")}>
        Approve
      </Button>
    </>
  )}
</div> */}
<div className="justify-content-end d-flex mt-2">
  {hasGetScenarioListSucc?.approval_status === "Pending" && (
    <>
      <Button className="bg-secondary" onClick={() => onSubmit("Pending")}>
        Save as Draft
      </Button>
      <Button className="mx-2 bg-danger" onClick={onRejectClick}>
        Reject
      </Button>
      <Button className="bg-success" onClick={() => onSubmit("Approve")}>
        Approve
      </Button>
    </>
  )}
</div>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};
DiagramComponents.layout = "Contentlayout";
export default DiagramComponents;

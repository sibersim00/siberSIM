import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { useRouter } from "next/router";
import { getRunningInviteLearnersList } from "../../../shared/redux/slices/invitescenario/invitescenario";
import Seo from "../../../shared/layout-components/seo/seo";
import "../../../shared/utils/i18n";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
// import { useTranslation } from "react-i18next";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";

const InviteScenarios = () => {
  // const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { push } = useRouter();
  const [compStatus, setCompStatus] = useState("approved");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
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

  const { hasgetRunningInviteLearnersData, errorData } = useSelector(
    (state) => {
      return {
        hasgetRunningInviteLearnersData:
          state &&
          state.invitescenarioReducer &&
          state.invitescenarioReducer.getRunningInviteLearners &&
          state.invitescenarioReducer.getRunningInviteLearners.data,
        errorData:
          state &&
          state.invitescenarioReducer &&
          state.invitescenarioReducer.error,
      };
    },
  );

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      maxWidth: 100,
      sortable: false,
      headerTooltip:  "Sr No.",
    },
    {
      headerName: "scenario title",
      field: "scenariotitle",
      filter: true,
      floatingFilter: true,
      minWidth: 300,
      tooltipValueGetter: (params) => params.value,
      headerTooltip: "scenario title",
    },
    {
      headerName: "Scenario Level",
      field: "scenariolevel",
      filter: true,
      floatingFilter: true,
      minWidth: 120,
      tooltipValueGetter: (params) => params.value,
      headerTooltip: "Scenario Level",
    },
    {
      headerName: "Learner Name",
      field: "learner_name",
      filter: true,
      floatingFilter: true,
      minWidth: 300,
      tooltipValueGetter: (params) => params.value,
      headerTooltip: "Learner Name",
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      minWidth: 100,
      pinned: "right",
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

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();
    let filteredList = hasgetRunningInviteLearnersData;
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
      }),
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
    if (compStatus === "") {
      setGridData(hasgetRunningInviteLearnersData);
      setRowData(hasgetRunningInviteLearnersData);
    } else if (compStatus === "true") {
      const filteredData = hasgetRunningInviteLearnersData.filter(
        (data) => data?.status?.toLowerCase() !== "false",
      );
      setGridData(filteredData);
      setRowData(filteredData);
    } else if (compStatus === "false") {
      const filteredData = hasgetRunningInviteLearnersData.filter(
        (data) => data?.status?.toLowerCase() === "false",
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
              },
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
            },
          );
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    dispatch(getRunningInviteLearnersList());
  }, []);

  useEffect(() => {
    if (hasgetRunningInviteLearnersData?.length) {
      setGridData(hasgetRunningInviteLearnersData);
      setRowData(hasgetRunningInviteLearnersData);
    }
  }, [hasgetRunningInviteLearnersData]);

   const handleReturnView = (props) => {
     push({
    pathname: `/invite_scenarios/${props?.scenariouuid}`,
    query: { view: "list" },
  });
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
              propsVal={props}
            />
          );
        },
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
                    <h5>Assigned Scenarios</h5>
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
                      enableBrowserTooltips={true}
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
                        <Card
                          className="card custom-card our-team component-status-card"
                          onClick={() =>
                            router.push({
                              pathname: `/invite_scenarios/${item?.scenariouuid}`,
                            })
                          }
                        >
                          <Card.Body className="p-3 position-relative">
                            <div className="text-center mb-2">
                              <div
                                className="rounded-circle mx-auto d-flex justify-content-center align-items-center position-relative"
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
                                  <Tooltip id="tooltip">
                                    Scenario Title: {item.scenariotitle}
                                  </Tooltip>
                                }
                              >
                                <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                  <a>{item.scenariotitle}</a>
                                </h5>
                              </OverlayTrigger>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-vmid-name pointer">
                                    Scenario Level: {item.scenariolevel}
                                  </Tooltip>
                                }
                              >
                                <h6 className="pro-user-desc mb-1 mt-1 pointer">
                                  {item.scenariolevel}
                                </h6>
                              </OverlayTrigger>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-vmid-name pointer">
                                    Learner Name: {item.learner_name}
                                  </Tooltip>
                                }
                              >
                                <h6
                                  className="pro-user-desc mb-1 mt-1 pointer"
                                  style={{ color: "#19b159" }}
                                >
                                  {item.learner_name}
                                </h6>
                              </OverlayTrigger>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              &nbsp; &nbsp;
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() =>
                                  router.push({
                                    pathname: `/invite_scenarios/${item?.scenariouuid}`,
                                    query: { view: "card" },
                                  })
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
                              }}
                            >
                              <Card.Body>
                                <div className="text-center mt-5">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150 mt-5"
                                  />
                                  <h5 className="mt-4">No Data Found</h5>
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
InviteScenarios.layout = "Contentlayout";
export default InviteScenarios;

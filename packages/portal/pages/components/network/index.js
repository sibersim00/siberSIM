import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { Row, Col, Card, Button } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { clearHasError } from "../../../shared/redux/slices/component/componentManage";
import {
  fetchNetwork,
  fetchNetworlist,
  clearfetchNetwork,
} from "../../../shared/redux/slices/network/networkManage.js";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import "../../../shared/utils/i18n";

const ManageComponent = () => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [compStatus, setCompStatus] = useState("Available");
  const [oneClick, setOneClick] = useState(false);
  const { hasFetchNetworkSuccess, hasFetchNetworkSuccesslist, errorData } =
    useSelector((state) => ({
      errorData: state?.componentManage?.error,
      hasFetchNetworkSuccess: state?.networkManage?.networkData,
      hasFetchNetworkSuccesslist: state?.networkManage?.networkDatalist?.data,
    }));
  console.log("hasFetchNetworkSuccesshasFetchNetworkSuccesshasFetchNetworkSuccess", hasFetchNetworkSuccesslist);
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      // floatingFilter: true,
      // filter: true,
      maxWidth: 80,
      sortable: false
    },
    {
      headerName: "Network Name",
      field: "networkname",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Status",
      cellRenderer: "statusRenderer",
      field: "status",
      pinned: "right",
      filter: true,
      floatingFilter: true,
      maxWidth: 220,
    },
  ];
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    }),
    []
  );

  const handleExport = () => {
    const filteredData = hasFetchNetworkSuccesslist.filter((row) => {
      if (compStatus === "") return true; // All
      return row.status === compStatus;
    });

    const exportData = filteredData.map((row, index) => {
       const createdDate = row.createdon ? new Date(row.createdon) : null;
        const modifiedDate = row.modifiedon ? new Date(row.modifiedon) : null;
        const deletedDate = row.deletedon ? new Date(row.deletedon) : null;
  
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

            const deletedDateOnly =
          deletedDate && !isNaN(deletedDate)
            ? deletedDate.toLocaleDateString()
            : " ";
        const deletedTime =
          deletedDate && !isNaN(deletedDate)
            ? deletedDate.toLocaleTimeString()
            : " ";
  

   

      const networkPorts = row.networkjson
        ? (() => {
            try {
              const parsed = JSON.parse(row.networkjson);
              return Object.entries(parsed)
                .map(([k, v]) => `${k}: ${String(v).replace(/\n/g, " ")}`)
                .join(", ");
            } catch {
              return "Invalid JSON";
            }
          })()
        : "N/A";

      return [
        index + 1,
        row.networkid,
        row.networkname,
        networkPorts,
        row.issync || "N/A",
        row.status || "N/A",
        createdDateOnly,
          createdTime,
          modifiedDateOnly,
          modifiedTime,
        deletedDateOnly,
        deletedTime,
      ];
    });

    const header = [
      "Sr No.",
      "Network ID",
      "Network Name",
      "Network JSON (Parsed)",
      "Is Synced",
      "Status",
       "Created Date",
        "Created Time",
        "Modified Date",
        "Modified Time",
        "Deleted Date",
        "Deleted Time",

    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Networks");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);

    const filePrefix =
      compStatus === ""
        ? "Network_All"
        : compStatus === "Available"
        ? "Network_Available"
        : "Network_Filtered";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  useEffect(() => {
    dispatch(fetchNetworlist());
  }, []);

  useEffect(() => {
    if (hasFetchNetworkSuccess?.statusCode === 200) {
      dispatch(fetchNetworlist());
    }
  }, [hasFetchNetworkSuccess, dispatch]);

  useEffect(() => {}, [hasFetchNetworkSuccesslist]);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi, rowData]);

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  useEffect(() => {
    if (hasFetchNetworkSuccess.statusCode === 200) {
      setOneClick(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Network Data Sync Successfully
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearfetchNetwork());
    }
  }, [hasFetchNetworkSuccess]);

  useEffect(() => {
    if (errorData?.statusCode) {
      if (errorData.errors && errorData.errors.length > 0) {
        errorData.errors.forEach((data) => {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">{data}</p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        });
      } else {
        toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {errorData?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: true,
            theme: "colored",
          }
        );
      }
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData, dispatch]);

  useEffect(() => {
    if (hasFetchNetworkSuccesslist && hasFetchNetworkSuccesslist.length > 0) {
      const processed = hasFetchNetworkSuccesslist.map((d) => {
        let parsedJson;
        try {
          parsedJson = JSON.parse(d.networkjson);
        } catch {
          parsedJson = null;
        }
        return {
          networkid: d.networkid,
          networkname: d.networkname,
          status: d.status,
          networkjson: parsedJson ? JSON.stringify(parsedJson) : d.networkjson,
        };
      });
      setRowData(processed);
    }
  }, [hasFetchNetworkSuccesslist]);

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const handleSync = () => {
    dispatch(fetchNetwork());
    dispatch(clearfetchNetwork());
  };

  const frameworkComponents = {
    srNoRender: (props) => props.node.rowIndex + 1,
    actionButtonRenderer: (props) => <ActionButtonRenderer propsVal={props} />,
    actionSwitchRenderer: (props) => (
      <ToggleButton
        data={props?.data}
        handleStatusSwitch={handleStatusSwitch}
      />
    ),
    statusRenderer: (params) => {
      const status = params.value || "";
      let badgeClass = "badge bg-secondary";
      if (status === "Available") badgeClass = "badge bg-success";
      else if (status === "In Use") badgeClass = "badge bg-danger";
      else if (status === "Occupied") badgeClass = "badge bg-warning";
      return (
        <span
          className={badgeClass}
          style={{
            padding: "0.4em 0.75em",
            fontSize: "0.9em",
            fontWeight: "500",
            borderRadius: "0.5em",
          }}
        >
          {status}
        </span>
      );
    },
  };

  return (
    <>
      <Seo title="Networks" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Networks</h5>
                  <div className="d-flex align-items-center">
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
                      variant="outline-success"
                      onClick={() => {
                        handleOneClick(true);
                        handleSync();
                      }}
                      disabled={oneClick}
                    >
                      {oneClick ? (
                        <>
                          <Spinner
                            as="span"
                            animation="grow"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />{" "}
                          Syncing...
                        </>
                      ) : (
                        <>Sync</>
                      )}
                    </Button>
                  </div>
                </div>
              </Col>
            </Card.Body>
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
                    pagination={true}
                    paginationPageSize={20}
                    onGridReady={onGridReady}
                    components={frameworkComponents}
                    defaultColDef={defaultColDef}
                  />
                </div>
              </Col>
           
          </Card>
        </Col>
      </Row>
    </>
  );
};
ManageComponent.layout = "Contentlayout";
export default ManageComponent;

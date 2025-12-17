import React, { useState, useEffect, useMemo } from "react";
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

import {
    clearHasError,
    handleManageView,
    ScenarioExport,
    getScenarioExportList
} from "../../../shared/redux/slices/scenario/scenarioManage";
import * as XLSX from "xlsx";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";
const ManageScenarios = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [scenStatus, setscenStatus] = useState("true");
    const [view, setView] = useState("card");
    const [rowData, setRowData] = useState([]);
    const [gridData, setGridData] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [quickFilter, setQuickFilter] = useState("");
    const [oneClick, setOneClick] = useState(false);
    const [backview, setBackView] = useState("card");
    const [selectedScenarios, setSelectedScenarios] = useState([]);

    const {
        errorData,
        viewNameResp,
        getUserDataFromLocal,
        hasGetScenarioExportSucc,
        hasGetScenarioexportListSucc
    } = useSelector((state) => {
        return {
            hasGetScenarioexportListSucc:
                state &&
                state.scenarioManage &&
                state.scenarioManage.ScenarioexportList.data,
            errorData: state && state.scenarioManage && state.scenarioManage.error,
            getUserDataFromLocal:
                state && state.localData && state.localData.getLocalData,
            viewNameResp:
                state && state.scenarioManage && state.scenarioManage.viewNameResp,
        };
    });
    console.log("hasGetScenarioexportListSucchasGetScenarioexportListSucc", hasGetScenarioexportListSucc);
    const columnDefs = [
        {
            headerName: "Sr No.",
            field: "",
            cellRenderer: "srNoRender",
            floatingFilter: true,
            maxWidth: 120,
            sortable: false,
        },
        {
            headerName: "Identification No",
            field: "scenarioidentification",
            filter: true,
            floatingFilter: true,
            maxWidth: 240,
        },
        {
            headerName: "Scenario Title",
            field: "scenariotitle",
            filter: true,
            floatingFilter: true,
            minWidth: 240,
        },
        {
            headerName: "Export Status",
            field: "status",
            filter: true,
            floatingFilter: true,
            cellRenderer: "vmStatusRenderer",
            maxWidth: 200,
        },

        {
            headerName: "Action",
            field: "status",
            sortable: false,
            pinned: "right",
            maxWidth: 110,
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

    //Function to Download Excel file
    const handleExportExcel = () => {
        // If no scenario selected → export all (with scenStatus filter)
        let filteredData = hasGetScenarioexportListSucc.filter((row) => {
            if (scenStatus === "") return true; // All statuses
            return row.status === scenStatus;
        });

        // If specific scenarios are selected → filter by those scenario IDs
        if (selectedScenarios && selectedScenarios.length > 0) {
            const selectedIds = selectedScenarios.map((s) => s.value);
            filteredData = filteredData.filter((row) =>
                selectedIds.includes(row.scenarioid)
            );
        }

        if (!filteredData.length) {
            alert("No scenarios found to export!");
            return;
        }

        // Prepare Excel data
        const exportData = filteredData.map((row) => {
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

            return [
                row.scenarioid,
                row.scenarioidentification,
                row.scenariotitle,
                row.scenariodescription,
                row.components,
                row.scenariodiagram,
                row.component_config,
                row.network_config,
                row.scenariocategory,
                row.scenariosubcategory,
                row.scenariolevel,
                row.instructor_name,
                row.instruction_file,
                row.duration,
                row.status === "true" ? "Active" : "Inactive",
                createdDateOnly,
                createdTime,
                modifiedDateOnly,
                modifiedTime,
            ];
        });

        const header = [
            "Scenario Id",
            "Identification no",
            "Title",
            "Desciption",
            "Components",
            "Scenario Diagram",
            "Component Config",
            "Network Config",
            "Scenario Category",
            "Scenario Sub Category",
            "Level",
            "SIMManager Name",
            "Instruction File",
            "Duration",
            "Status",
            "Created Date",
            "Created Time",
            "Modified Date",
            "Modified Time",
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Scenarios");

        const timestamp = new Date()
            .toISOString()
            .replace(/[-T:\.]/g, "")
            .slice(0, 15);

        let filePrefix = "Scenarios_All";
        if (selectedScenarios.length > 0) {
            filePrefix = "Scenarios_Selected";
        } else if (scenStatus === "true") {
            filePrefix = "Scenarios_Active";
        } else if (scenStatus === "false") {
            filePrefix = "Scenarios_Inactive";
        }

        XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
    };

    const gridOptions = {
        pagination: true,
        paginationPageSize: 10, // use state variable for page size
    };

    const onGridReady = (params) => {
        setGridApi(params.api);
    };

    const onFilterChanged = (data) => {
        setQuickFilter(data);
        let val = data.toLowerCase();
        if (scenStatus == "") {
            const temp =
                hasGetScenarioexportListSucc &&
                hasGetScenarioexportListSucc.filter((d) => {
                    return (
                        d.scenarioidentification?.toLowerCase().includes(val) ||
                        // d.instructor_name?.toLowerCase().includes(val) ||
                        (d.instructor_name?.toLowerCase() || "").includes(val) ||
                        d.scenariotitle?.toLowerCase().includes(val) ||
                        d.scenariolevel?.toLowerCase().includes(val) ||
                        (typeof d.duration === "number" &&
                            d.duration.toString().toLowerCase().includes(val)) ||
                        d.name?.toLowerCase().includes(val) ||
                        d.scenariocategory?.toLowerCase().includes(val) ||
                        d.scenariosubcategory?.toLowerCase().includes(val) ||
                        !val
                    );
                });

            setGridData(temp);
            setRowData(temp);
        } else if (scenStatus == "true") {
            const filteredData =
                hasGetScenarioexportListSucc.length > 0 &&
                hasGetScenarioexportListSucc.filter(
                    (data) => data?.status?.toString() == "true"
                );

            const temp =
                filteredData &&
                filteredData.filter((d) => {
                    return (
                        d.scenarioidentification.toLowerCase().indexOf(val) !== -1 ||
                        d.scenariotitle.toLowerCase().indexOf(val) !== -1 ||
                        // d.instructor_name.toLowerCase().indexOf(val) !== -1 ||
                        (d.instructor_name?.toLowerCase() || "").includes(val) ||
                        d.scenariolevel.toLowerCase().indexOf(val) !== -1 ||
                        (typeof d.duration === "number" &&
                            d.duration.toString().indexOf(val.toLowerCase()) !== -1) ||
                        (d.name &&
                            d.name != null &&
                            d.name.toLowerCase().indexOf(val) !== -1) ||
                        (d.scenariocategory &&
                            d.scenariocategory != null &&
                            d.scenariocategory.toLowerCase().indexOf(val) !== -1) ||
                        (d.scenariosubcategory &&
                            d.scenariosubcategory != null &&
                            d.scenariosubcategory.toLowerCase().indexOf(val) !== -1) ||
                        !val
                    );
                });
            setGridData(temp);
            setRowData(temp);
        } else if (scenStatus == "false") {
            const filteredData =
                hasGetScenarioexportListSucc.length > 0 &&
                hasGetScenarioexportListSucc.filter(
                    (data) => data?.status?.toString() == "false"
                );

            const temp =
                filteredData &&
                filteredData.filter((d) => {
                    return (
                        d.scenarioidentification.toLowerCase().indexOf(val) !== -1 ||
                        d.scenariotitle.toLowerCase().indexOf(val) !== -1 ||
                        // d.instructor_name.toLowerCase().indexOf(val) !== -1 ||
                        (d.instructor_name?.toLowerCase() || "").includes(val) ||
                        d.scenariolevel.toLowerCase().indexOf(val) !== -1 ||
                        (typeof d.duration === "number" &&
                            d.duration.toString().indexOf(val.toLowerCase()) !== -1) ||
                        (d.name &&
                            d.name != null &&
                            d.name.toLowerCase().indexOf(val) !== -1) ||
                        (d.scenariocategory &&
                            d.scenariocategory != null &&
                            d.scenariocategory.toLowerCase().indexOf(val) !== -1) ||
                        (d.scenariosubcategory &&
                            d.scenariosubcategory != null &&
                            d.scenariosubcategory.toLowerCase().indexOf(val) !== -1) ||
                        !val
                    );
                });
            setGridData(temp);
            setRowData(temp);
        }
    };

    useEffect(() => {
        if (hasGetScenarioexportListSucc) {
            setRowData(hasGetScenarioexportListSucc);
            setGridData(hasGetScenarioexportListSucc);
        }
    }, [hasGetScenarioexportListSucc]);

    const handleChangeView = (thisView) => {
        setQuickFilter("");
        dispatch(handleManageView(thisView));
        setBackView(thisView);
        setRowData(hasGetScenarioexportListSucc);
        setGridData(hasGetScenarioexportListSucc);

    };

    useEffect(() => {
        if (viewNameResp) {
            setView(viewNameResp);
        }
    }, [viewNameResp]);

    useEffect(() => {
        dispatch(getScenarioExportList());
        if (viewNameResp != "list") {
            dispatch(handleManageView("card"));
        }
    }, []);

    useEffect(() => {
        if (gridApi) {
            gridApi.sizeColumnsToFit();
        }
    }, [gridApi]);

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
    const [userType, setUserType] = useState("");
    useEffect(() => {
        if (getUserDataFromLocal) {
            try {
                if (getUserDataFromLocal?.usertype) {
                    setUserType(getUserDataFromLocal.usertype);
                }
            } catch (error) {
                console.error("Error retrieving user data:", error);
            }
        }
    }, [getUserDataFromLocal]);


    const handleDownloadZip = (row) => {
        console.log("rohgggggggggggggw",row)
        const fileUrl = `${process.env.API_URL_FILEMANAGER}/temp_zip/${row.file_name}`;
         console.log("fileUrlfileUrl",fileUrl)
        const link = document.createElement("a");
        link.href = fileUrl;
        link.setAttribute("download", row.file_name);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };



    const frameworkComponents = {
        srNoRender: function (props) {
            return props.node.rowIndex + 1;
        },
        vmStatusRenderer: (props) => {
            const status = props.value;

            const bg =
                status === "Inprogress"
                    ? "orange"
                    : status === "Complete"
                        ? "green" // yellow
                        : "#6c757d"; // grey default

            return (
                <span
                    className="badge"
                    style={{
                        backgroundColor: bg,
                        color: "white",
                        fontSize: "12px",
                        padding: "5px 10px",
                        borderRadius: "12px",
                    }}
                >
                    {status}
                </span>
            );
        },
        // actionButtonRenderer: function (props) {
        //     return (
        //         <ActionButtonRenderer
        //             handleFiles={props.data.status === "Complete" ? handleFiles : false}
        //             handleShowEditView={true}
        //             propsVal={props}
        //         />
        //     );
        // },
        actionButtonRenderer: function (props) {
            console.log("props",props)
            return (
                <ActionButtonRenderer
                    handleFiles={props.data.status === "Complete" ? handleDownloadZip : null}
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
            <Seo title="Export Scenarios" />
            <ToastContainer />
            <Row className="row-sm">
                {view != "Form" && (
                    <Col md={12}>
                        <Card className="custom-card overflow-hidden">
                            <Card.Body className="p-3">
                                <Col md={12}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5>Export Scenarios</h5>
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
                                                onClick={() => {
                                                    handleChangeView("card");
                                                    dispatch(handleManageView("card"));
                                                }}
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
                                                onClick={() => {
                                                    handleChangeView("list");
                                                    dispatch(handleManageView("list"));
                                                }}
                                                className={view === "list" ? "active text-white" : ""}
                                            >
                                                <i className="fe fe-list"></i>
                                            </Button>
                                            &nbsp;&nbsp;
                                            {/* <ToggleButtonGroup
                                                color="success"
                                                value={scenStatus}
                                                size="small"
                                                exclusive
                                                onChange={(e) => {
                                                    setscenStatus(e.target.value);
                                                    dispatch(getScenarioExportList());
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
                                            </ToggleButtonGroup> */}
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
                                {console.log(scenStatus, "000000000", rowData)}
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
                                            //  overlayNoRowsTemplate={
                                            //   rowData && rowData.length === 0 ? "No Rows to Show" : "Loading..."
                                            // }
                                            ></AgGridReact>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </Col>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                <Col md={12}>
                    {view === "card" ? (
                        <>
                            {gridData && gridData.length > 0 ? (
                                <Row className="g-3 mb-3">
                                    {gridData.map((item, index) => (
                                        <Col key={index} md={12 / columnsPerRow}>
                                            {/* <Card className="card custom-card our-team h-100 shadow-sm"> */}
                                            <Card
                                                className={`card custom-card our-team h-100 custom-scenario-card ${item.scenariostatus === "Publish"
                                                    ? "shadow-publish"
                                                    : item.scenariostatus === "Draft"
                                                        ? "shadow-draft"
                                                        : ""
                                                    }`}
                                            >
                                                <Card.Body className="p-3 position-relative d-flex flex-column justify-content-between text-center">

                                                    {/* Card Content */}
                                                    <div className="mb-3">
                                                        {/* Scenario Title */}
                                                        <div
                                                            className="rounded-circle mx-auto d-flex justify-content-center align-items-center "
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                            }}
                                                        >
                                                            <img
                                                                alt="avatar"
                                                                src={
                                                                    item?.scenarioimage
                                                                        ? `${process.env.API_URL_FILEMANAGER}${item.scenarioimage}`
                                                                        : dummy_network.src
                                                                }
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = dummy_network.src;
                                                                }}
                                                            />
                                                        </div>

                                                        <h5 className="text-dark mt-2 mb-1 fs-5 pointer">
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={
                                                                    <Tooltip>{item.scenariotitle}</Tooltip>
                                                                }
                                                            >
                                                                <span
                                                                    className="d-inline-block text-truncate w-100"
                                                                    style={{ maxWidth: "100%" }}
                                                                >
                                                                    {item.scenariotitle?.length > 30
                                                                        ? `${item.scenariotitle.substring(
                                                                            0,
                                                                            27
                                                                        )}...`
                                                                        : item.scenariotitle}
                                                                </span>
                                                            </OverlayTrigger>
                                                        </h5>

                                                        {/* Scenario Identification */}
                                                        <p className="text-success mb-1">
                                                            {item.scenarioidentification}
                                                        </p>
                                                    </div>

                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
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
                                                            }}
                                                        >
                                                            <Card.Body>
                                                                <div className="text-center mt-5">
                                                                    <img
                                                                        src={crossEvalicon.src}
                                                                        alt="user-img"
                                                                        className="wd-150 mt-5"
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
            </Row>
        </>
    );
};
ManageScenarios.layout = "Contentlayout";
export default ManageScenarios;

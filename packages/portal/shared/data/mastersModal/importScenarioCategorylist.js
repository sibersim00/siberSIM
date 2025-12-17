import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Row, Col, Form, Tooltip, OverlayTrigger } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";

import { verifyScenarioCategoryModal, importScenarioCategoryModal, clearVerifyScenarioCategoryModel } from "../../redux/slices/masters/ScenarioCategories";
import * as XLSX from "xlsx";
import { AgGridReact } from "ag-grid-react";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CustomToggleButton from "@mui/material/ToggleButton";

const ImportScenarioCategoryList = ({ openImportModal, handleImportModal, showListImort, setShowListImport }) => {
    const [file, setFile] = useState("");
    const [rowData, setRowData] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState();
    const [importDataType, setImportDataType] = useState("success");
    const [length, setLength] = useState({});

    const dispatch = useDispatch();
    const getScenarioCategoryListVerifyImportData = useSelector(state => state?.scenariocategories?.verifyScenarioCategory?.data);
    const ImportScenarioCategoryListData = useSelector(state => state?.scenariocategories?.importScenarioCategory);

    useEffect(() => {
        if (getScenarioCategoryListVerifyImportData) {
            const successData = getScenarioCategoryListVerifyImportData?.success || [];
            const errorData = getScenarioCategoryListVerifyImportData?.errors || [];
            const totalSuccessLength = successData?.length;
            const totalErrorLength = errorData?.length;
            const totalLength = totalSuccessLength + totalErrorLength;

            setLength({
                success: totalSuccessLength,
                error: totalErrorLength,
                total: totalLength,
            });

            if (importDataType === "success") {
                setRowData(successData);
            } else if (importDataType === "error") {
                setRowData(errorData);
            } else {
                setRowData([...successData, ...errorData]);
            }
            setShowListImport(false);
        }
    }, [getScenarioCategoryListVerifyImportData, importDataType]);

    const readExcel = (file) => {
        const promise = new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onload = (e) => {
                const bufferArray = e.target.result;
                const wb = XLSX.read(bufferArray, { type: "buffer" });

                if (wb.SheetNames.length > 0) {
                    const firstSheetName = wb.SheetNames[0];
                    const ws = wb.Sheets[firstSheetName];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                    const headers = data.shift();
                    const mappedHeaders = headers.map((header, index) => ['scenariocategoryid','categoryname'][index] || header);
                    const parsedData = data.map((row) => {
                        const rowData = {};
                        row.forEach((cell, index) => {
                            const key = mappedHeaders[index];
                            rowData[key] = cell;
                        });
                        return rowData;
                    });

                    resolve(parsedData);
                } else {
                    resolve([]);
                }
            };
            fileReader.onerror = (error) => reject(error);
        });

        promise
            .then((data) => {
                setParsedData(data);
            })
            .catch((error) => {
                console.error("Error reading Excel file:", error);
            });
    };

    const handleCancel = () => {
        setFile("");
        setError("");
        setParsedData(null);
        setRowData([]);
        handleImportModal();
        setImportDataType("success");
        setLength({});
        setShowListImport(true);
    };

    const handleCancelVerifyData = () => {
        dispatch(clearVerifyScenarioCategoryModel());
        setFile("");
        setError("");
        setParsedData(null);
        setRowData([]);
        setImportDataType("success");
        setLength({});
        setShowListImport(true);
    };

    const handleImport = () => {
        setRowData([]);
        setLength({});
        setImportDataType("success");
        dispatch(clearVerifyScenarioCategoryModel());
        if (file) {
            dispatch(verifyScenarioCategoryModal(parsedData));
        } else {
            setError("Required");
        }
    };

    const handleVerify = () => {
        if (getScenarioCategoryListVerifyImportData?.success && getScenarioCategoryListVerifyImportData?.success?.length > 0) {
            dispatch(importScenarioCategoryModal(getScenarioCategoryListVerifyImportData.success));
        }
        
    };

    useEffect(() => {
        if (ImportScenarioCategoryListData?.statusCode) {
            handleCancel();
        }
    }, [ImportScenarioCategoryListData]);

    const columnDefs = [

        {
            headerName: "Id",
            headerTooltip: "Id",
            field: "scenariocategoryid",
            tooltipValueGetter: (params) => `${params.data.scenariocategoryid}`,
            minWidth: 150,
        },
        {
            headerName: "Category Name",
            headerTooltip: "Category Name",
            field: "categoryname",
            tooltipValueGetter: (params) => `${params.data.categoryname}`,
            minWidth: 150,
        },


       
       
        {
            headerName: "Error",
            headerTooltip: "Error",
            pinned: "right",
            width: 500,
            cellRenderer: "ErrorRenderer",
            autoHeight: true,
        },
    ];

    const defaultColDef = useMemo(() => {
        return {
            sortable: true,
            suppressMovable: true,
            cellClass: "cell-wrap-text ag-grid-cell",
            wrapHeaderText: true,
            autoHeaderHeight: true,
            tooltipShowDelay: 0,
        };
    }, []);

    const gridOptions = {
        enableBrowserTooltips: true,
        pagination: true,
        paginationPageSize: 10,
    };

    const ErrorRenderer = (item) => {
        return (
            <>
                {item?.data?.issues?.length > 0 ? (
                    <ol>
                        {item.data.issues.map((issue, index) => (
                            <li key={index}>
                                <OverlayTrigger placement={"bottom"} overlay={<Tooltip>{issue?.message}</Tooltip>}>
                                    <span>{issue?.message}</span>
                                </OverlayTrigger>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <span>-</span>
                )}
            </>
        );
    };

    const frameworkComponents = {
        ErrorRenderer: ErrorRenderer,
    };

    return (
        <Modal
            show={openImportModal}
            backdrop="static"
            size="xl"
            className="overflow-auto"
            centered
        >
            <Modal.Header>
                <Modal.Title>Import Scenario Category</Modal.Title>
            </Modal.Header>
            <Form>
                <Modal.Body>
                    <Row className="align-items-end">
                        {showListImort ? (
                            <Form.Group
                                as={Col}
                                md="6"
                                lg="6"
                                controlid="validationFormik102"
                                className=""
                            >
                                <Form.Label>
                                    Import your XLSX File
                                </Form.Label>

                                <Form.Control
                                    type="file"
                                    name="uploadfile"
                                    autoComplete="off"
                                    value={file}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        const file1 = e.target.value;
                                        setFile(file1);
                                        if (file) {
                                            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                                            const validExtensions = ['.xls', '.xlsx', '.csv'];

                                            if (validExtensions.includes(fileExtension)) {
                                                setError('');
                                                readExcel(file);
                                            } else {
                                                setError('Please upload a valid Excel or XLSX file.');
                                                return;
                                            }
                                        }
                                    }}
                                    placeholder="Browse file"
                                />
                                {error && (
                                    <div className="ms-1 invalid-tooltiped"> {error}</div>
                                )}
                            </Form.Group>
                        ) : null}

                        {getScenarioCategoryListVerifyImportData && (
                            <>
                                <div className="row-sm mg-b-20 d-flex justify-content-end">
                                    <ToggleButtonGroup
                                        className="mg-r-10"
                                        color="warning"
                                        value={importDataType}
                                        size="small"
                                        exclusive
                                        onChange={(e) => {
                                            setImportDataType(e.target.value);
                                        }}
                                        aria-label="Platform"
                                    >
                                        <CustomToggleButton value="all">All: {length?.total}</CustomToggleButton>
                                        <CustomToggleButton value="success" defaultChecked>
                                            Success: {length?.success}
                                        </CustomToggleButton>
                                        <CustomToggleButton value="error">
                                            Error: {length?.error}
                                        </CustomToggleButton>
                                    </ToggleButtonGroup>
                                </div>
                                <div className="ag-theme-alpine" style={{ height: "20em", width: "100%" }}>
                                    <AgGridReact
                                        id="staff_grid"
                                        headerHeight={35}
                                        rowHeight={40}
                                        gridOptions={gridOptions}
                                        rowData={rowData}
                                        columnDefs={columnDefs}
                                        pagination={true}
                                        onGridReady={(params) => setGridApi(params.api)}
                                        defaultColDef={defaultColDef}
                                        components={frameworkComponents}
                                    ></AgGridReact>
                                </div>
                            </>
                        )}
                    </Row>
                </Modal.Body>
                <Row>
                    {showListImort === false ? (
                        <Col md={12} className="text-center">
                            <Button
                                onClick={() => handleCancelVerifyData()}
                                variant="outline-dark"
                                className="fw-500 rounded-5 pd-x-30"
                            >
                                Cancel
                            </Button>
                            &nbsp;&nbsp;
                            {length?.success > 0 ? (
                                <Button
                                    className="custome-button-actions-cw pd-x-30"
                                    onClick={handleVerify}
                                >
                                    Continue with Success
                                </Button>
                            ) : ""}
                        </Col>
                    ) : (
                        <Col md={12} className="text-center">
                            <Button
                                onClick={() => handleCancel()}
                                variant="outline-dark"
                                className="fw-500 rounded-5 pd-x-30"
                            >
                                Cancel
                            </Button>
                            &nbsp;&nbsp;
                            <Button
                                className="custome-button-actions-cw pd-x-30"
                                onClick={handleImport}
                            >
                                Import
                            </Button>
                        </Col>
                    )}
                </Row>
                <Row className="p-3">
                    <a href={`${process.env.NEXT_PUBLIC_BASE_PATH}/assets/docs/sample-scenario-category-Import.xlsx`} className="ms-2 link-color-tbs pointer">
                        <i className="fe fe-download"></i> Download XLSX Sample
                    </a>
                </Row>
            </Form>
        </Modal>
    );
};

ImportScenarioCategoryList.propTypes = {
    openImportModal: PropTypes.bool,
    handleImportModal: PropTypes.func,
};

export default ImportScenarioCategoryList;

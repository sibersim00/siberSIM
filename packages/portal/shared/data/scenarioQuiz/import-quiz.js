import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Row, Col, Form, Tooltip, OverlayTrigger, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import { getScenarioQuizlist, verifyScenarioImportQuiz, saveImportQuestion, clearVerifyScenarioImportQuiz, clearSaveImportQuestion } from "../../../shared/redux/slices/scenarioquiz/quizManage";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { AgGridReact } from "ag-grid-react";
import "../../../shared/utils/i18n";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CustomToggleButton from "@mui/material/ToggleButton";

const ImportScenarioQuizList = ({ openImportModal, handleImportModal, showListImort, setShowListImport }) => {
    const [file, setFile] = useState("");
    const [rowData, setRowData] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState();
    const [importDataType, setImportDataType] = useState("success");
    const [length, setLength] = useState({});
    const { push, query } = useRouter();
    const [querySlug, setQuerySlug] = useState("");
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const scenarioQuizResp = useSelector(state => state?.quizManage?.ScenarioQuizData?.data);
    const getVeriefyScenarioQuizData = useSelector(state => state?.quizManage?.verifyQuizData?.data);
    const getVeriefyScenarioQuiz = useSelector(state => state?.quizManage?.verifyQuizData);
    const importScenarioQuizData = useSelector(state => state?.quizManage?.importQuizData);

    useEffect(() => {
        if (getVeriefyScenarioQuizData) {
            const successData = getVeriefyScenarioQuizData?.success || [];
            const errorData = getVeriefyScenarioQuizData?.errors || [];
            const totalSuccessLength = successData?.length;
            const totalErrorLength = errorData?.length;
            const totalLength = totalSuccessLength + totalErrorLength;

            setLength({
                success: totalSuccessLength,
                error: totalErrorLength,
                total: totalLength,
            });

            if (importDataType == "success") {
                setRowData(successData);
            }
            else if (importDataType == "error") {
                setRowData(errorData);
            }
            else {
                const successData = getVeriefyScenarioQuizData?.success || [];
                const errorData = getVeriefyScenarioQuizData?.errors || [];
                setRowData([...successData, ...errorData]);
            }
            setShowListImport(false)
        }
    }, [getVeriefyScenarioQuizData, importDataType])


    useEffect(() => {
        if (query.slug && query.slug.length > 0) {
            setQuerySlug(query.slug[0]);
            dispatch(getScenarioQuizlist(query.slug[0]));
        }
    }, [query.slug]);

    function isValidExcelDate(num) {
        const jsDate = new Date((num - 25569) * 86400 * 1000);
        const minValidDate = new Date(2000, 0, 1);
        return jsDate >= minValidDate > 0 && num < 100000;
    }

    const readExcel = (file) => {
        const promise=new Promise((resolve, reject) => {
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
                     const datakey = ['scenarioquestionid', 'question_text', 'question_type', 'Option1', 'Option2', 'Option3', 'Option4', 'Option5', 'Option6', 'is_correct'];
                    const mappedHeaders = headers.map((header, index) => datakey[index] || header);
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
        setShowListImport(true)
    }

    const handleCancelVerifyData = () => {
        dispatch(clearVerifyScenarioImportQuiz());
        setFile("");
        setError("");
        setParsedData(null);
        setRowData([]);
        setImportDataType("success");
        setLength({});
        setShowListImport(true)
    }
   
    const handleImport = () => {
        setRowData([]);
        setLength({});
        setImportDataType("success");
        setIsLoading(true); //  This is enough

        dispatch(clearVerifyScenarioImportQuiz());

        if (!file) {
            setError("Required");
            setIsLoading(false);
            return;
        }

        if (!parsedData || parsedData.length === 0) {
            setError("Parsed data is empty");
            setIsLoading(false);
            return;
        }

        const scenarioid = scenarioQuizResp?.scenarioid;

        const transformedPayload = parsedData.map((item) => {
            const transformedItem = {
                scenarioquestionid: item.scenarioquestionid?.toString() || null,
                scenarioid: scenarioid || "",
                question_text: item.question_text || "",
                question_type: item.question_type || "",
            };

            const correctAnswers = typeof item.is_correct === "string" && item.is_correct.trim() !== ""
                ? item.is_correct.split(',').map(a => a.trim())
                : [];

            let hasCorrect = false;

            for (let i = 1; i <= 6; i++) {
                const ansKey = `Option${i}`;
                const answerText = item[ansKey] || "";
                transformedItem[`answer_text_${i}`] = answerText;
                const isCorrect = correctAnswers.includes(ansKey);
                transformedItem[`is_correct_${i}`] = isCorrect ? "Yes" : "No";

                if (isCorrect) hasCorrect = true;
            }

            if (!hasCorrect) {
                transformedItem.issues = [{
                    message: "At least one correct answer must be marked."
                }];
            }

            return transformedItem;
        });

        console.log("verify payload", transformedPayload);

        dispatch(verifyScenarioImportQuiz(transformedPayload));
        dispatch(clearVerifyScenarioImportQuiz(transformedPayload));
    };


    useEffect(() => {
        if (length?.success > 0 || length?.error > 0) {
            setIsLoading(false); // Stop loading when result comes
        }
    }, [length]);
    
   useEffect(() => {
        if (getVeriefyScenarioQuiz?.statusCode && getVeriefyScenarioQuiz?.message) {
            toast.success(
                <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
                    {getVeriefyScenarioQuiz?.message}
                </p>,
                {
                    position: toast.POSITION.TOP_RIGHT,
                    hideProgressBar: false,
                    theme: "colored",
                }
            );
        }
    }, [getVeriefyScenarioQuiz]);

    useEffect(() => {
        if (importScenarioQuizData?.statusCode === 200 && importScenarioQuizData?.message) {
            toast.success(
                <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
                    {importScenarioQuizData?.message}
                </p>,
                {
                    position: toast.POSITION.TOP_RIGHT,
                    hideProgressBar: false,
                    theme: "colored",
                }
            );
            dispatch(getScenarioQuizlist(querySlug));
            dispatch(clearSaveImportQuestion());
        }
    }, [importScenarioQuizData]);

   const handleVerify = async () => {
        if (getVeriefyScenarioQuizData?.success && getVeriefyScenarioQuizData?.success?.length > 0) {
            setIsLoading(true);
           const transformedData = getVeriefyScenarioQuizData.success.map(item => ({
                scenarioquestionid: item.scenarioquestionid || 0,
                scenarioid: item.scenarioid,
                question_text: item.question_text,
                question_type: item.question_type,
                answer_text_1: item.answer_text_1 || "",
                is_correct_1: item.is_correct_1 || "",
                answer_text_2: item.answer_text_2 || "",
                is_correct_2: item.is_correct_2 || "",
                answer_text_3: item.answer_text_3 || "",
                is_correct_3: item.is_correct_3 || "",
                answer_text_4: item.answer_text_4 || "",
                is_correct_4: item.is_correct_4 || "",
                answer_text_5: item.answer_text_5 || "",
                is_correct_5: item.is_correct_5 || "",
                answer_text_6: item.answer_text_6 || "",
                is_correct_6: item.is_correct_6 || ""
            }));

            try {
                const response = await dispatch(saveImportQuestion(transformedData));
                const payload = response?.payload;

                if (payload?.statusCode === 200) {
                    // Let the useEffect toast handle it
                    // You can optionally log or update local state here
                } 
            } catch (error) {
                console.error("Unexpected API error:", error);
                toast.error("Unexpected error occurred while saving.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (importScenarioQuizData?.statusCode) {
            handleCancel();
        }
    }, [importScenarioQuizData]);

    const columnDefs = useMemo(() => {
        const baseColumns = [
            {
                headerName: "ID",
                headerTooltip: "ID",
                width: 100,
                field: "scenarioquestionid",
                filter: true,
                floatingFilter: true,
            },
            {
                headerName: "Question",
                headerTooltip: "Question",
                width: 250,
                field: "question_text",
                filter: true,
                floatingFilter: true,
                tooltipField: "question_text"
            },
            {
                headerName: "Question Type(MCQ & SCQ)",
                headerTooltip: "Question Type",
                field: "question_type",
                width: 120,
                filter: true,
                floatingFilter: true,
                tooltipField: "question_type"
            },
            {
                headerName: "Option1",
                headerTooltip: "Option1",
                width: 110,
                field: "answer_text_1",
                filter: true,
                floatingFilter: true,
                tooltipField: "answer_text_1",
                cellStyle: (params) => {
                    return params.data?.is_correct_1 === "Yes"
                        ? { color: "green", fontWeight: "bold" }
                        : {};
                },
            },
            {
                headerName: "Option2",
                headerTooltip: "Option2",
                field: "answer_text_2",
                width: 110,
                filter: true,
                floatingFilter: true,
                tooltipField: "answer_text_2",
                cellStyle: (params) => {
                    return params.data?.is_correct_2 === "Yes"
                        ? { color: "green", fontWeight: "bold" }
                        : {};
                },
            },
            {
                headerName: "Option3",
                headerTooltip: "Option3",
                field: "answer_text_3",
                width: 110,
                filter: true,
                floatingFilter: true,
                tooltipField: "answer_text_3",
                cellStyle: (params) => {
                    return params.data?.is_correct_3 === "Yes"
                        ? { color: "green", fontWeight: "bold" }
                        : {};
                },
            },
            {
                headerName: "Option4",
                headerTooltip: "Option4",
                field: "answer_text_4",
                width: 110,
                filter: true,
                floatingFilter: true,
                tooltipField: "answer_text_4",
                cellStyle: (params) => {
                    return params.data?.is_correct_4 === "Yes"
                        ? { color: "green", fontWeight: "bold" }
                        : {};
                },
            },
            {
                headerName: "Option5",
                headerTooltip: "Option5",
                field: "answer_text_5",
                width: 110,
                filter: true,
                floatingFilter: true,
                tooltipField: "answer_text_5",
                cellStyle: (params) => {
                    return params.data?.is_correct_5 === "Yes"
                        ? { color: "green", fontWeight: "bold" }
                        : {};
                },
            },
            {
                headerName: "Option6",
                headerTooltip: "Option6",
                field: "answer_text_6",
                width: 110,
                filter: true,
                floatingFilter: true,
                tooltipField: "answer_text_6",
                cellStyle: (params) => {
                    return params.data?.is_correct_6 === "Yes"
                        ? { color: "green", fontWeight: "bold" }
                        : {};
                },
            },
        ];

     if (importDataType !== "success") {
            baseColumns.push({
                headerName: "Error",
                headerTooltip: "Error",
                pinned: "right",
                width: 300,
                cellRenderer: "ErrorRenderer",
                autoHeight: true,
            });
        }

        return baseColumns;
    }, [importDataType]);

    const defaultColDef = useMemo(() => {
        return {
            sortable: true,
            suppressMovable: true,
            cellClass: "cell-wrap-text ag-grid-cell",
            wrapHeaderText: true, // Wrap Text
            autoHeaderHeight: true,
            tooltipShowDelay: 0,
        };
    }, []);

    const onGridReady = (params) => {
        setGridApi(params.api);
        console.log("params.data.categoryname", params)
    };

    const gridOptions = {
        enableBrowserTooltips: true,
        pagination: true,
        paginationPageSizeSelector: false,
        paginationPageSize: 10, // use state variable for page size
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
    }

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
                <Modal.Title>Import Scenario Quiz Question by XLSX File</Modal.Title>
            </Modal.Header>
            <Form>
                <Modal.Body>
                    <Row className="align-items-end">
                        {showListImort ?
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
                                                readExcel(file)
                                            }
                                            else {
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
                            </Form.Group> : ""}
                       
                        {getVeriefyScenarioQuizData && (
                            <>
                                <div className="row-sm mg-b-20 d-flex justify-content-end">
                                    <ToggleButtonGroup
                                        className="mg-r-10"
                                        color="warning"
                                        value={importDataType}
                                        size="small"
                                        exclusive
                                        onChange={(e) => {
                                            setImportDataType(e.target.value)
                                        }}
                                        aria-label="Platform"
                                    >
                                        <CustomToggleButton value="all">All : {length?.total}</CustomToggleButton>
                                        <CustomToggleButton value="success" defaultChecked>
                                            Success : {length?.success}
                                        </CustomToggleButton>
                                        <CustomToggleButton value="error">
                                            Error : {length?.error}
                                        </CustomToggleButton>
                                    </ToggleButtonGroup>
                                </div>
                                <div
                                    className="ag-theme-alpine"
                                    style={{ height: "20em", width: "100%" }}
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
                                        defaultColDef={defaultColDef}
                                        components={frameworkComponents}
                                    ></AgGridReact>
                                </div>
                            </>)}
                    </Row>
                </Modal.Body>
                <Row>
                    {!showListImort ? (
                        <Col md={12} className="text-center">
                            <Button
                                onClick={() => handleCancelVerifyData()}
                                variant="outline-dark"
                                className="fw-500 rounded-5 pd-x-30"
                            >
                                Cancel
                            </Button>
                            &nbsp;&nbsp;
                            {length?.success > 0 && (
                                !isLoading ? (
                                    <Button
                                        className="custome-button-actions-cw pd-x-30"
                                        onClick={handleVerify}
                                    >
                                        Continue with Success
                                    </Button>
                                ) : (
                                    <Button
                                        className="custome-button-actions-cw pd-x-30"
                                        disabled
                                    >
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        />{" "}
                                        <span>Continue with Success...</span>
                                    </Button>
                                )
                            )}
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
                    <a href={`${process.env.BASE_PATH}assets/docs/sample-scenario-quiz-list-import.xlsx`} className="ms-2 link-color-tbs pointer">
                        <i className="fe fe-download"></i> Download XLSX Sample
                    </a>
                </Row>
            </Form>
        </Modal>
    );
};
ImportScenarioQuizList.propTypes = {
    openImportModal: PropTypes.bool,
    handleImportModal: PropTypes.func,
};
export default ImportScenarioQuizList;
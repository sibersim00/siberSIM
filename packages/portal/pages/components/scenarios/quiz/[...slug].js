import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import TB from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { getScenarioQuizlist, changeQuizStatus, clearchangeQuizStatus, deleteScenarioQuiz, clearDeleteQuiz, clearVerifyScenarioImportQuiz, clearSaveImportQuestion, clearHasError } from "../../../../shared/redux/slices/scenarioquiz/quizManage";
import CreateQuestions from "../../../../shared/data/scenarioQuiz/create-quiz";
import ImportScenarioQuizList from "../../../../shared/data/scenarioQuiz/import-quiz";
import { maxWidth, width } from "@mui/system";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const ScenarioQuiz = () => {
  const dispatch = useDispatch();
  const { push, query } = useRouter();

  const { t } = useTranslation();
  const [empStatus, setEmpStatus] = useState("true");
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [openImportModal, setOpenImportModal] = useState(false);
  const [querySlug, setQuerySlug] = useState("");
  const [showListImort, setShowListImport] = useState(true);
  const [questionModal, setQuestionModal] = useState(false);
  const [scenarioid, setScenarioid] = useState(0);
  const [ScenarioQuizData, setScenarioQuizData] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
     const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  const [rowValues, setRowValues] = useState({
    scenarioid: scenarioid,
    scenarioquestionid: 0,
    question_type: "",
    question_text: "",
    status: true,
    answers: []
  });

  const { scenarioQuizResp, scenarioQuizResponseId, changeStatusResp, deleteQuizResp, errorData } = useSelector((state) => ({
    scenarioQuizResp: state?.quizManage?.ScenarioQuizData?.data,
    scenarioQuizResponseId: state?.quizManage?.ScenarioQuizData?.data?.scenarioid,
    changeStatusResp: state?.quizManage?.statusChangeData,
    deleteQuizResp: state?.quizManage?.deleteQuiz,
    errorData: state?.quizManage?.error,
  }));
  const scenariotitle = scenarioQuizResp?.scenariotitle || "";

  useEffect(() => {
    if (scenarioQuizResp) {
      setScenarioQuizData(scenarioQuizResp?.questionlist);
      if (scenarioQuizResp?.questionlist && scenarioQuizResp?.questionlist.length > 0) {

        setScenarioid(scenarioQuizResp?.questionlist[0]?.scenarioid);
      }
    }
  }, [scenarioQuizResp]);

  const handleQuestionModal = () => {
    setQuestionModal(!questionModal);
  };

  useEffect(() => {
    if (query.slug && query.slug.length > 0) {
      setQuerySlug(query.slug[0]);
      dispatch(getScenarioQuizlist(query.slug[0]));
    }
  }, [query.slug]);

  // useEffect(() => {
  //   if (errorData?.statusCode) {
  //     errorData.errors && errorData.errors.length > 0
  //       ? errorData.errors.forEach((data) => {
  //         toast.error(
  //           <p className="mx-2 tx-16 d-flex align-items-center mb-0">{data}</p>,
  //           {
  //             position: toast.POSITION.TOP_RIGHT,
  //             hideProgressBar: true,
  //             theme: "colored",
  //           }
  //         );
  //       })
  //       : toast.error(
  //         <p className="mx-2 tx-16 d-flex align-items-center mb-0">{errorData?.message}</p>,
  //         {
  //           position: toast.POSITION.TOP_RIGHT,
  //           hideProgressBar: true,
  //           theme: "colored",
  //         }
  //       );
  //     dispatch(clearHasError());
  //   }
  // }, [errorData]);

  useEffect(() => {
    if (ScenarioQuizData) {
      if (empStatus === "") {
        setRowData(ScenarioQuizData);
      } else if (empStatus === "true") {
        const filteredData = ScenarioQuizData.filter(data => data?.status?.toString() === "Active");
        setRowData(filteredData);
      } else if (empStatus === "false") {
        const filteredData = ScenarioQuizData.filter(data => data?.status?.toString() === "Inactive");
        setRowData(filteredData);
      }
    }
  }, [ScenarioQuizData, empStatus]);

  useEffect(() => {
    if (changeStatusResp?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {changeStatusResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioQuizlist(querySlug));
      dispatch(clearchangeQuizStatus());
    }
  }, [changeStatusResp]);


  useEffect(() => {
    if (deleteQuizResp?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">{deleteQuizResp?.message}</p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioQuizlist(querySlug));
      dispatch(clearDeleteQuiz());
    }
  }, [deleteQuizResp]);

  const columnDefs = [
    {
      headerName: "Sr. No",
      headerTooltip: "Sr. No",
      field: "sr_no",
      minWidth: 100,
      maxWidth: 120,
      valueFormatter: (params) => params.value || "",
      valueGetter: "node.rowIndex + 1",
      // filter: true,              
      // floatingFilter: true,
      sortable: false,
    },

    {
      headerName: "Question",
      field: "question_text",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },

    {
      headerName: "Question Type",
      field: "question_type",
      filter: true,
      floatingFilter: true,
      width: 120,
      pinned: "right",
      //suppressSizeToFit: true,
    },

    {
      headerName: "Status",
      field: "status",
      cellRenderer: "actionStatusChange",
      pinned: "right",
      width: 120,
    },
    {
      headerName: "Action",
      field: "",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      width: 100,
      pinned: "right",
    },
  ];

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
    };
  }, []);


 const gridOptions = {
     headerHeight: HEADER_HEIGHT,
     rowHeight: ROW_HEIGHT,
     suppressScrollOnNewData: true,
   };
 
 const onGridReady = useCallback((params) => {
   gridRef.current = params.api;
 
   // Set correct height on first load as well
   const initialPageSize = params.api.paginationGetPageSize();
   const totalRows = params.api.getDisplayedRowCount();
   const effectiveRows = Math.min(initialPageSize, totalRows);
   setPageSize(effectiveRows);
 }, []);
   
     // Fires when page size changes via the built-in dropdown
    const onPaginationChanged = useCallback((params) => {
   if (params.api) {
     const newPageSize = params.api.paginationGetPageSize();
     const totalRows = params.api.getDisplayedRowCount(); // ✅ actual rows in data
 
     // Use whichever is smaller — actual rows vs page size
     const effectiveRows = Math.min(newPageSize, totalRows);
     setPageSize(effectiveRows);
   }
 }, []);

  const onFilterChanged = (data) => {
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };

  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_status"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          scenarioquestionid: data?.scenarioquestionid,
          status: data.status === "Active" ? "false" : "true",
        };
        dispatch(changeQuizStatus(payload));
      }
    });
  };

  const autoSizeAll = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }, []);

  const handleEdit = (data) => {
    setRowValues({
      scenarioid: data?.scenarioid,
      scenarioquestionid: data?.scenarioquestionid,
      question_type: data?.question_type,
      question_text: data?.question_text,
      status: data?.status === "Active",
      answers: data?.answers
    });
    setQuestionModal(true);
      // setIsLoading(false);  
  };

  // const handleDelete = (data, flag) => {
  //   if (flag) {
  //     dispatch(deleteScenarioQuiz(data?.scenarioquestionid));
  //   }
  // };

  const frameworkComponents = {
    actionButtonRenderer: function (props) {
      return (
        <div>
          <ActionButtonRenderer
            propsVal={props}
            handleShowEdit={true}
            // handleDelete={handleDelete}
            handleEdit={handleEdit}
          />
        </div>
      );
    },
    actionStatusChange: function (props) {
      return (
        <label className="custom-switch">
          <input
            type="checkbox"
            name="custom-switch-checkbox1"
            className="custom-switch-input"
            checked={props?.data?.status === "Active"}
            onChange={() => handleStatusSwitch(props?.data)}
          />
          <span className="custom-switch-indicator custom-switch-indicator-md"></span>
        </label>
      );
    },
  };


  // const handleImport = () => {
  //   hanldeImportModal();
  // };

  const handleExport = () => {
    const exportData = ScenarioQuizData?.map((row, index) => {
      // Parse createdon and modifiedon from your row (assuming those fields exist)
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
          : "N/A";
      const modifiedTime =
        modifiedDate && !isNaN(modifiedDate)
          ? modifiedDate.toLocaleTimeString()
          : "N/A";

      // Existing options extraction
      const answers = row.answers || [];
      const optionColumns = Array.from({ length: 6 }, (_, i) => {
        return answers[i] ? answers[i].answer_text : "No answer";
      });

      const correctOptions = answers
        .map((ans, idx) => (ans.is_correct === "Yes" ? `Option${idx + 1}` : null))
        .filter(Boolean);

      return [
        index + 1,
        row.scenarioquestionid,
        row.question_text,
        row.question_type,
        ...optionColumns,
        correctOptions.length > 0 ? correctOptions.join(",") : "",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "S.No",
      "ID",
      "Question",
      "Question Type (MCQ & SCQ)",
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4",
      "Option 5",
      "Option 6",
      "Correct Option",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    if (exportData?.length > 0) {
      const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Scenario Questions Data");
      XLSX.writeFile(workbook, "Questions_Data.xlsx");
    }
  };


  const handleAddModal = () => {

    setRowValues({
      scenarioid: scenarioid,
      scenarioquestionid: 0,
      question_type: "",
      question_text: "",
      status: true,
      answers: []
    });
    setQuestionModal(true);
    setIsLoading(false);
  };

  const handleImportModal = () => {
    dispatch(clearVerifyScenarioImportQuiz());
    dispatch(clearSaveImportQuestion());

    setOpenImportModal(!openImportModal);
  };

  return (
    <>
      <Seo title="Quiz" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <div className="">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex flex-grow-1 mg-r-5">
                    <h5
                      title={scenariotitle} // Tooltip on hover
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}
                    >
                      {scenariotitle
                        ? scenariotitle.split(" ").slice(0, 5).join(" ") +
                        (scenariotitle.split(" ").length > 5 ? "..." : "")
                        : "Questions"}
                    </h5>
                  </div>

                  <div className="mg-r-2">
                    <ToggleButtonGroup
                      className="mg-r-10"
                      color="success"
                      value={empStatus}
                      size="small"
                      exclusive
                      onChange={(e) => {
                        setEmpStatus(e.target.value);
                      }}
                      aria-label="Platform"
                    >
                      <TB value="">{t("common.all")}</TB>
                      <TB value="true">{t("common.active")}</TB>
                      <TB value="false">{t("common.inactive")}</TB>
                    </ToggleButtonGroup>{" "}
                    &nbsp;&nbsp;
                    <Button
                      type="button"
                      style={{ minHeight: "33px" }}
                      variant="outline-primary"
                      onClick={() => handleAddModal()}
                    >
                      <i className="fa fa-plus"></i>{" "}
                      {t("common.add")}
                    </Button>
                    &nbsp;&nbsp;
                    <Button
                      type="button"
                      style={{ minHeight: "33px" }}
                      variant="outline-info"
                      onClick={() => handleExport()}
                    >
                      <i className="fa fa-file-excel-o"></i>{" "}
                      {t("common.export")}
                    </Button>
                    &nbsp;&nbsp;
                    <Button
                      type="button"
                      style={{ minHeight: "33px" }}

                      variant="outline-warning"
                      onClick={() => {
                        setShowListImport(true);
                        handleImportModal();
                      }}
                    >
                      <i className="fa fa-upload"></i>{" "}
                      {t("common.import")}
                    </Button>
                    &nbsp;&nbsp;
                    <Button
                      type="button"
                      style={{ minHeight: "33px" }}

                      variant="outline-secondary"

                      onClick={() =>
                        push("/scenarios")
                      }
                    >
                      <i className="fe fe-arrow-left"></i>{" "}
                      {t("")}
                    </Button>

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
                  {/* for back button view  */}

                </div>
              </div>

              <div
                  className="ag-theme-alpine mt-2"
                       style={{
                          height: `${gridHeight}px`, //  dynamic, grows with page size
                          width: "100%",
                          overflow: "visible",        // no internal scrollbar
                        }}
              >
                <AgGridReact
                  id="staff_grid"
                  gridOptions={gridOptions}
                  rowData={rowData}
                  ref={gridRef}
                  columnDefs={columnDefs}
                  pagination={true}
                  onGridReady={onGridReady}
                  components={frameworkComponents}
                  paginationPageSize={20}
                  defaultColDef={defaultColDef}
                  overlayNoRowsTemplate="No data available"
                  suppressRowClickSelection={true}
                // onFirstDataRendered={autoSizeAll}
                  onPaginationChanged={onPaginationChanged} //  track page size changes
                ></AgGridReact>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>
      <CreateQuestions
        openModal={questionModal}
        handleModal={handleQuestionModal}
        rowValues={rowValues}
        scenarioid={scenarioQuizResponseId}
        questionlist={ScenarioQuizData}

      />
      <ImportScenarioQuizList
        openImportModal={openImportModal}
        handleImportModal={handleImportModal}
        showListImort={showListImort}
        setShowListImport={setShowListImport}
        scenarioid={scenarioQuizResponseId}
        rowValues={rowValues}
      />

    </>
  );
};

ScenarioQuiz.layout = "Contentlayout";
export default ScenarioQuiz;

import React, { useEffect, useState, useMemo,useRef,useCallback } from "react";
import * as yup from "yup";
import * as XLSX from "xlsx";
import { AgGridReact } from "ag-grid-react";
import {
  Col,
  Button,
  Form,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import { useFormik } from "formik";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { error } from "../../../shared/data/common/vaidationMessage/formValidationMsg";
import {
  getListOfUser,
  saveImportAdUser,
  clearImportAdUser,
  clearHasError,
} from "../../../shared/redux/slices/admin/Users";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

function ImportAdUser({ impUser, setimpUser }) {
  const dispatch = useDispatch();
  const [questionBanlList, setQuestionBanlList] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [agGrid, setAgGrid] = useState("Hide");
  const [clearClose, setClearClose] = useState("");
   const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
    
  const { saveImportAdUserResp, errorData } = useSelector(
    (state) => (
      {
        saveImportAdUserResp: state.user?.saveImportUserResp,
        errorData: state && state.user && state.user.error,
      }
    )
  );
  useEffect(() => {
    if (saveImportAdUserResp?.statusCode == 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveImportAdUserResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      setRowData([]);
      setQuestionBanlList([]);
      dispatch(clearImportAdUser());
      dispatch(clearHasError());
      dispatch(getListOfUser());
      setimpUser(false);
      setAgGrid("Hide");
    }
  }, [saveImportAdUserResp]);
  useEffect(() => {
    if (clearClose == "Clear") {
      setAgGrid("Hide");
      setClearClose("");
      setQuestionBanlList([]);
      setRowData([]);
      dispatch(clearImportAdUser());
      dispatch(clearHasError());
      dispatch(getListOfUser());
      setimpUser(false);
    }
  }, [clearClose]);

  const readExcel = (file) => {
    setRowData([]);
    setQuestionBanlList([]);
    dispatch(clearHasError());
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = (e) => {
        const bufferArray = e.target.result;
        const wb = XLSX.read(bufferArray, { type: "buffer" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        resolve(data);
      };
      fileReader.onerror = (error) => {
        console.error(error);
      };
    });

    promise.then((uploadedData) => {
      setRowData(uploadedData);
      setQuestionBanlList(uploadedData);
      setAgGrid("Show");
    });
  };

  const frameworkComponents = {
    statusRendere: function (props) {
      if (props.data.status && props.data.status.length > 0) {
        return (
          <div className="text-danger">
            {props.data.status.map((msg, index) => (
              <div key={index}>{msg}</div>
            ))}
          </div>
        );
      }
      return null; // Return null if there are no status messages
    },
  };
 const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };

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
  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
    };
  }, []);

  let columnDefs = [];

  if (errorData?.statusCode === 400) {
    columnDefs = [
      {
        headerName: `Status`,
        headerTooltip: `Status`,
        field: "Status",
        width: 100,
        cellRenderer: (params) => {
          return params?.data?.status == "valid" ? (
            <div className="text-success">{params?.data["status"]}</div>
          ) : (
            <div className="text-secondary">{params?.data["status"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
        hide: (params) => !params?.data?.status,
      },
      {
        headerName: `Message`,
        headerTooltip: `Message`,
        field: "message",
        width: 300,
        cellRenderer: (params) => {
          return <div>{params?.data["message"] || "-"}</div>;
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `Login Id`,
        headerTooltip: `Login Id`,
        field: "Login Id",
        width: 200,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["loginid"] || params?.data["loginid"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `First Name`,
        headerTooltip: `First Name`,
        field: "First Name",
        width: 200,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["First Name"] || params?.data["firstname"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `Last Name`,
        headerTooltip: `Last Name`,
        field: "Last Name",
        width: 200,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["Last Name"] || params?.data["lastname"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `Email Address`,
        headerTooltip: `Email Address`,
        field: "Email Address",
        width: 200,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["Email Address"] || params?.data["email"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `Phone Number`,
        headerTooltip: `Phone Number`,
        field: "Phone Number",
        width: 200,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["Phone Number"] || params?.data["mobile"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
    ];
  } else {
    columnDefs = [
      {
        headerName: `Login Id`,
        headerTooltip: `Login Id`,
        field: "Login Id",
        width: 200,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["Login Id"] || params?.data["loginid"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `First Name`,
        headerTooltip: `First Name`,
        field: "First Name",
        width: 250,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["First Name"] || params?.data["firstname"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `Last Name`,
        headerTooltip: `Last Name`,
        field: "Last Name",
        width: 250,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["Last Name"] || params?.data["lastname"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `Email Address`,
        headerTooltip: `Email Address`,
        field: "Email Address",
        width: 250,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["Email Address"] || params?.data["email"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
      {
        headerName: `Phone Number`,
        headerTooltip: `Phone Number`,
        field: "Phone Number",
        width: 270,
        cellRenderer: (params) => {
          return (
            <div>{params?.data["Phone Number"] || params?.data["mobile"]}</div>
          );
        },
        filter: true,
        floatingFilter: true,
      },
    ];
  }

  const handleSubmit = () => {
    let errorMessage = "";
    const selectedQuestions = questionBanlList;

    if (selectedQuestions && selectedQuestions.length > 0) {
      let finalArray = [];
      selectedQuestions.forEach((obj) => {
        let temp = {
          loginid: obj["Login Id"] || obj["loginid"],
          firstname: obj["First Name"] || obj["firstname"],
          lastname: obj["Last Name"] || obj["lastname"],
          mobile: obj["Phone Number"] || obj["email"],
          email: obj["Email Address"] || obj["mobile"],
        };
        finalArray.push(temp);
      });

      const payload = {
        leadImport: finalArray,
      };
      dispatch(saveImportAdUser(finalArray));
    } else {
      errorMessage = "No questions selected!";
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      uploadfile: null,
    },
    validationSchema: yup.object().shape({
      uploadfile: yup
        .mixed()
        .required(error?.required)
        .test("fileType", "Invalid file", (value) => {
          if (!value) return false;
          const fileExtension = value?.name?.split(".").pop();
          const validExtensions = ["xls", "xlsx"];
          const isValidExtension = validExtensions.includes(fileExtension);
          return isValidExtension;
        }),
    }),
    onSubmit: (data, action) => {
      if (uploadFiles == "Show") {
        try {
          const validationMessages = [];
          if (questionImport && questionImport.length == 0) {
            toast.error(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0">
                File you are trying to import is empty
              </p>,
              {
                position: toast.POSITION.TOP_RIGHT,
                hideProgressBar: true,
                theme: "colored",
              }
            );
            return false;
          } else {
            questionImport.forEach((question, index) => {
              question.status = [];
              // Collect defined options
              const options = {
                1: question[1],
                2: question[2],
                3: question[3],
                4: question[4],
                5: question[5],
                6: question[6],
              };

              const definedOptionsCount = Object.values(options).filter(
                (option) => option !== undefined
              ).length;

              // Check for valid correct_answer
              if (question.correct_answer.length == 0) {
                validationMessages.push(
                  `Question ${
                    index + 1
                  }: correct_answer cannot be an empty array.`
                );
                question.status.push(
                  `correct_answer cannot be an empty array.`
                );
              } else if (
                question.correct_answer.length > 1 &&
                question.question_type == "SCQ"
              ) {
                validationMessages.push(
                  `Question ${
                    index + 1
                  }: Single choice question should not have two answers`
                );
                question.status.push(
                  `Single choice question should not have two answers`
                );
              }

              // Check for minimum two defined options
              if (definedOptionsCount < 2) {
                validationMessages.push(
                  `Question ${
                    index + 1
                  }: At least two options must be provided.`
                );
                question.status.push(`At least two options must be provided.`);
              }

              question.correct_answer.forEach((correctOption) => {
                if (
                  options[correctOption] === undefined ||
                  options[correctOption] === ""
                ) {
                  validationMessages.push(
                    `Question ${
                      index + 1
                    }: Option ${correctOption} cannot be empty if it is Correct Answer.`
                  );
                  question.status.push(
                    `Option ${correctOption} cannot be empty if it is Correct Answer.`
                  );
                }
              });
            });
          }
          setRowData(questionImport);
          setValidationMessage(validationMessages);
        } catch (error) {
          console.error(error);
        }
      } else {
        try {
          const selectedQuestions = questionBanlList
            .filter((question) => question.isSelected)
            .map((question) => ({
              question_id: question.question_id,
              marks: question.marks,
              question_order: question.question_order,
            }));

          const payload = {
            exam_id: listExamQuestionsData?.exam_id,
            questionOptions: selectedQuestions,
          };
        } catch (error) {
          console.error("Error submitting the form:", error);
        }
      }
    },
  });

  return (
    <Modal show={impUser} size="xl" backdrop="static">
      <Modal.Header>
        <Modal.Title>Import</Modal.Title>
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>Download Sample File</Tooltip>}
        >
          <Button
            id="editBtnCommon"
            type="button"
            variant="outline-dark"
            className="mg-r-3"
            size="sm"
          >
            <a
              href={`${process.env.BASE_PATH}assets/docs/aduser-import.xlsx`}
              download
              target="_blank"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <i className="fa fa-download"></i>
            </a>
          </Button>
        </OverlayTrigger>
      </Modal.Header>
      <Form>
        <Modal.Body>
          <Form.Group
            as={Col}
            lg={12}
            controlId="validationFormik102"
            className="mb-3"
          >
            <Form.Label>Upload Files</Form.Label>
            <Form.Control
              type="file"
              name="uploadfile"
              onChange={(e) => {
                formik.handleChange(e);
                const file = e.target.files[0];
                formik.setFieldValue("uploadfile", file);
                readExcel(file);
              }}
              accept=".xls,.xlsx"
            />
            {agGrid === "Show" && (
              <Col md={12}>
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
                    headerHeight={35}
                    rowHeight={"auto"}
                    gridOptions={gridOptions}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    paginationPageSize={20}
                    defaultColDef={defaultColDef}
                    components={frameworkComponents}
                    onPaginationChanged={onPaginationChanged} //  track page size changes
                  ></AgGridReact>
                </div>
              </Col>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit}>Submit</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setimpUser(false);
              setClearClose("Clear");
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ImportAdUser;

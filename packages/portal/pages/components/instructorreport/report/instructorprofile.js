import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
} from "react-bootstrap";
import { useFormik } from "formik";
import * as yup from "yup";
import { useRouter } from "next/router";
import "../../../../shared/utils/i18n";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import { getLocalStorageData } from "../../../../shared/redux/slices/localstorage/LocalStorage";
import {
  getNormalusersManageList,
  deleteNormalUser,
  clearMappedInstructorById,
} from "../../../../shared/redux/slices/normalusers/normalUserManage";
import { getInstructorList } from "../../../../shared/redux/slices/common/masters.js";
import { instructorReportList } from "../../../../shared/redux/slices/instructorreports/instructorreportsManage.js";
import * as XLSX from "xlsx";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";

const instructorreport = () => {
  const { hasGetInstructorListSucc, hasinstructorreportslist } = useSelector(
    (state) => {
      return {
        errorData:
          state &&
          state.commonMaster &&
          state.commonMaster.error &&
          state.commonMaster.error,
        hasGetInstructorListSucc:
          state &&
          state.commonMaster &&
          state.commonMaster.getInstructorListData.data,
        hasinstructorreportslist:
          state &&
          state.instructorreportsManage &&
          state.instructorreportsManage.getinstructorreportslist.data,
        hasaddparticipants:
          state && state.eventsManage && state.eventsManage.getaddparticipants,
        hasaddLearnerEvent:
          state && state.eventsManage && state.eventsManage.getaddLearnerEvent,
        hasupdateLearnerEvent:
          state &&
          state.eventsManage &&
          state.eventsManage.getupdateparticipants,
      };
    }
  );
  const dispatch = useDispatch();
  const { push } = useRouter();
  const { t } = useTranslation();
  const [view, setView] = useState("list");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [InstructorDropdown, setInstructorropdown] = useState([]);
  const [formModal, setformModal] = useState(false);
  const [mapInstructors, setMapInstructors] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    componentcategoryid: 0,
    educationcode: "",
    parentcategoryname: "",
    status: true,
    description: "",
  });
  const [oneClick, setOneClick] = useState(false);


  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"));
    }
  }, []);

  useEffect(() => {
    dispatch(getInstructorList());
  }, []);
  useEffect(() => {
    if (hasinstructorreportslist && Object.keys(hasinstructorreportslist).length > 0) {
      setRowData(hasinstructorreportslist);
    } else {
      setRowData([]);
    }
  }, [hasinstructorreportslist]);

  useEffect(() => {
    const payload = {
      instructor_id: hasGetInstructorListSucc?.instructor_id,
    };
    dispatch(instructorReportList(payload));
  }, []);

  const [userType, setUserType] = useState("");
  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstname: rowValues?.firstname || "",
      lastname: rowValues?.lastname || "",
      email: rowValues?.email || "",
      mobile: rowValues?.mobile || "",
      password: rowValues?.password || "",
      username: rowValues?.username || "",
      team_name: rowValues?.team_name || "",
      team_description: rowValues?.team_description || "",
      instructor_id: [],
      eventlearnerid: rowValues?.eventlearnerid,
    },
  });
  const customStyles = () => {
    return {
      control: (styles) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)",
        borderColor: "#ced4da",
        minHeight: "38px",
      }),
      multiValue: (styles) => ({
        ...styles,
        backgroundColor: "var(--primary-bg-color)",
      }),
      multiValueLabel: (styles) => ({
        ...styles,
        color: "#fff",
      }),
      multiValueRemove: (styles) => ({
        ...styles,
        color: "#fff",
        ":hover": {
          backgroundColor: "#EB5757",
          color: "white",
        },
      }),
      input: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      singleValue: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      placeholder: (styles) => ({
        ...styles,
        color: "#aaa",
      }),
    };
  };
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      maxWidth: 80,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.username"),
      field: "username",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Full Name",
      valueGetter: (params) => {
        const firstName = params.data?.firstname || "";
        const lastName = params.data?.lastname || "";
        return `${firstName} ${lastName}`.trim();
      },
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.email_id"),
      field: "email",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.mobile_no"),
      field: "mobile",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Last Login",
      field: "last_login",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Last Logout",
      field: "last_logout",
      filter: true,
      floatingFilter: true,
    },
  ];

  const handleExport = () => {
    const exportData = (hasinstructorreportslist || []).map((row, index) => {
      const fullName = `${row.firstname || ""} ${row.lastname || ""}`.trim();

      return [
        index + 1,
        row.username || "N/A",
        fullName || "N/A",
        row.email || "N/A",
        row.mobile || "N/A",
        row.last_login || "N/A",
        row.last_logout || "N/A",
      ];
    });

    const header = [
      "Sr No.",
      "Username",
      "Full Name",
      "Email",
      "Mobile",
      "Last Login",
      "Last Logout",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SIMUser Report");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const fileName = `InstructorProfile_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };
  const onGridReady = (params) => {
    setGridApi(params.api);
  };


  useEffect(() => {
    dispatch(getNormalusersManageList());
    return () => { };
  }, []);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);
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
  const handleMapInstructorModal = (data) => {
    dispatch(clearMappedInstructorById());
    handleOneClick(false);
    if (data.instructor_id) {
      setRowValues(data);
      setMapInstructors(true);
    }
  };

  const handleReturnView = (props) => {
    push(`/normalusers_view/${props?.learner_uuid}`);

    console.log("props", props);
  };
  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleEdit={handleEdit}
          handleShowEdit={true}
          resetPswd={resetPswd}
          handleShowResetPswd={props?.data?.isverified == "Yes"}
          verifyAccount={verifyAccount}
          handleShowVerifyAccount={props?.data?.isverified == "No"}
          mapInstructor={handleMapInstructorModal}
          handleShowMapInstructort={userType == "Admin" ? true : false}
          handleDelete={handleDelete}
          propsVal={props}
        />
      );
    },
  };
  const handleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues(undefined);
    setformModal(flag);
  };
  useEffect(() => {
    if (hasGetInstructorListSucc?.length > 0) {
      const dropdownData = hasGetInstructorListSucc.map((item) => ({
        instructor_id: item.instructor_id,
        name: item.name,
      }));

      setInstructorropdown(dropdownData);
    }
  }, [hasGetInstructorListSucc]);

  return (
    <>
      <Seo title="SIMManager Report" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4> SIMManager Report</h4>
                  <Form.Group as={Col} md="6" className="">

                    <Select
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary25: "var(--primary-bg-color)",
                          primary: "var(--primary-bg-color)",
                        },
                      })}
                      isMulti
                      styles={customStyles()}
                      name="instructor_id"
                      value={formValidation.values.instructor_id}
                      options={InstructorDropdown}
                      getOptionLabel={(x) => x.name}
                      getOptionValue={(x) => x.instructor_id}
                      placeholder="Select SIMManager"
                      onChange={(selectedOptions) => {
                        formValidation.setFieldValue(
                          "instructor_id",
                          selectedOptions || []
                        );

                        const selectedIds = (selectedOptions || []).map(
                          (s) => s.instructor_id
                        );

                        const payload =
                          selectedIds.length > 0
                            ? { instructor_id: selectedIds }
                            : {};

                        dispatch(instructorReportList(payload));
                      }}
                      menuPosition="fixed"
                    />

                    <div
                      className="text-danger mt-1"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {formValidation.touched.instructor_id &&
                        formValidation.errors.instructor_id}
                    </div>
                  </Form.Group>
                  <div className="d-flex align-items-center">
                    <Button
                      type="button"
                      variant="outline-info"
                      onClick={() => handleExport()}
                    >
                      <i className="fa fa-file-excel-o"></i> Generate Report
                    </Button>
                  </div>
                </div>
              </Col>
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
                    ></AgGridReact>
                  </div>
                ) : (
                  ""
                )}
              </Col>
            </Card.Body>
          </Card>
        </Col>

        <Col md={12}>
          {view == "card" ? (
            <>
              {gridData && gridData.length > 0 ? (
                <Row className="row-sm">
                  {gridData.map((item, index) => {
                    console.log("item", item);
                    const isValidMobile =
                      item?.mobile &&
                      String(item.mobile).trim() !== "" &&
                      String(item.mobile).trim() !== "0" &&
                      String(item.mobile).trim().toLowerCase() !== "null";
                    return (
                      <Col key={index} md={12 / columnsPerRow} className="p-0">
                        <Card className="card custom-card our-team">
                          <Card.Body></Card.Body>
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
                          className="text-center"
                          style={{ height: "70vh" }}
                        >
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                                // backgroundColor: "#f6f7fb",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center mt-5">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150 mt-5"
                                    onClick={() => handleFormModal(true)}
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

instructorreport.layout = "Contentlayout";
export default instructorreport;

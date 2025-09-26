import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { useFormik } from "formik";
import * as yup from "yup";
import { useRouter } from "next/router";
import "../../../../shared/utils/i18n.js";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button.js";

import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../../shared/layout-components/seo/seo.js";
import "../../../../shared/utils/i18n.js";
import { useTranslation } from "react-i18next";
import { getLocalStorageData } from "../../../../shared/redux/slices/localstorage/LocalStorage.js";
import {
  getNormalusersManageList,
  clearMappedInstructorById,
} from "../../../../shared/redux/slices/normalusers/normalUserManage.js";
import { getStudentListreport } from "../../../../shared/redux/slices/common/masters.js";
import { UserReportList } from "../../../../shared/redux/slices/userreports/userreportsManage.js";

import * as XLSX from "xlsx";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";

const Userreport = () => {
  const { hasGetStudentListSuccreport, hasuserreportslist } = useSelector(
    (state) => {
      return {
        errorData:
          state &&
          state.commonMaster &&
          state.commonMaster.error &&
          state.commonMaster.error,
        hasGetStudentListSuccreport:
          state &&
          state.commonMaster &&
          state.commonMaster.getStudentListDatareport.data,
        hasuserreportslist:
          state &&
          state.userreportsManage &&
          state.userreportsManage.getuserreportslist.data,
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
  const [openImportModal, setOpenImportModal] = useState(false);
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("list");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [studentDropdown, setStudentDropdown] = useState([]);
  const [quickFilter, setQuickFilter] = useState("");
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
    dispatch(getStudentListreport());
  }, []);
  useEffect(() => {
    if (hasuserreportslist && Object.keys(hasuserreportslist).length > 0) {
      setRowData(hasuserreportslist);
    } else {
      setRowData([]);
    }
  }, [hasuserreportslist]);

  useEffect(() => {
    const payload = {
      learner_id: hasGetStudentListSuccreport?.learner_id,
    };
    dispatch(UserReportList(payload));
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
      learner_id: [],
      eventlearnerid: rowValues?.eventlearnerid,
    },
  });
  const customStyles = {
    control: (styles, { isFocused, isDisabled }) => ({
      ...styles,
      borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
      boxShadow: isDisabled
        ? null
        : isFocused
        ? "0 0 0 0.001rem #00d683"
        : null,
      "&:hover": {
        borderColor: isDisabled
          ? "#e8e8f7"
          : isFocused
          ? "#00d683"
          : styles.borderColor,
      },
    }),
  };
  const getSelectStyles = (fieldName) => {
    const error =
      !formValidation.values[fieldName] &&
      formValidation.errors[fieldName] &&
      formValidation.touched[fieldName];
    return error
      ? {
          ...customStyles,
          control: (styles) => ({
            ...styles,
            borderColor: "#EB5757",
            boxShadow: "0 0 0 0.001rem #EB5757",
          }),
        }
      : customStyles;
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
    const exportData = (hasuserreportslist || []).map((row, index) => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Report");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const fileName = `UserProfile_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fileName);
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
    const val = data.toLowerCase();

    let filteredList = hasuserreportslist ?? [];

    if (compStatus === "true") {
      filteredList = filteredList.filter(
        (d) => d?.status?.toString() === "true"
      );
    } else if (compStatus === "false") {
      filteredList = filteredList.filter(
        (d) => d?.status?.toString() === "false"
      );
    }

    const temp = filteredList.filter((d) => {
      const fullName = `${d.firstname ?? ""} ${d.lastname ?? ""}`.toLowerCase();
      const firstName = d.firstname?.toLowerCase() ?? "";
      const lastName = d.lastname?.toLowerCase() ?? "";

      const email = d.email?.toLowerCase() ?? "";
      const mobile = d.mobile?.toString().toLowerCase() ?? "";
      const username = d.username?.toLowerCase() ?? "";

      return (
        fullName.includes(val) || // match combined full name
        (typeof d.username === "string" &&
          d.username.toLowerCase().includes(val)) ||
        (typeof d.firstname === "string" &&
          d.firstname.toLowerCase().includes(val)) ||
        (typeof d.lastname === "string" &&
          d.lastname.toLowerCase().includes(val)) ||
        (typeof d.email === "string" && d.email.toLowerCase().includes(val)) ||
        (typeof d.address === "string" &&
          d.address.toLowerCase().includes(val)) ||
        (typeof d.organization === "string" &&
          d.organization.toLowerCase().includes(val)) ||
        ((typeof d.mobile === "number" || typeof d.mobile === "string") &&
          String(d.mobile).toLowerCase().includes(val)) ||
        !val
      );
    });

    setGridData(temp);
    setRowData(temp);
  };

  useEffect(() => {
    dispatch(getNormalusersManageList());
    return () => {};
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
    if (data.learner_id) {
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
    if (hasGetStudentListSuccreport?.length > 0) {
      const dropdownData = hasGetStudentListSuccreport.map((item) => ({
        learner_id: item.learner_id,
        Student_name: item.Student_name,
      }));

      setStudentDropdown(dropdownData);
    }
  }, [hasGetStudentListSuccreport]);

  return (
    <>
      <Seo title="User Report" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4> User Report</h4>
                  <Form.Group as={Col} md="4" className="">
                    <Select
                      isMulti
  styles={{
    ...customStyles,
    multiValue: (base) => ({
      ...base,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      borderRadius: "2px",
      fontSize: "85%",
      padding: "3px 3px 3px 6px",
      boxSizing: "border-box",
    }),
  }}
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary25: "var(--primary-bg-color)",
                          primary: "var(--primary-bg-color)",
                        },
                      })}
                      name="learner_id"
                      value={formValidation.values.learner_id}
                      options={studentDropdown}
                      getOptionLabel={(x) => x.Student_name}
                      getOptionValue={(x) => x.learner_id}
                      placeholder="Select Users"
                      onChange={(selectedOptions) => {
                        formValidation.setFieldValue(
                          "learner_id",
                          selectedOptions || []
                        );

                        const selectedIds = (selectedOptions || []).map(
                          (s) => s.learner_id
                        );

                        const payload =
                          selectedIds.length > 0
                            ? { learner_id: selectedIds }
                            : {};

                        dispatch(UserReportList(payload));
                      }}
                      menuPosition="fixed"
                    />

                    <div
                      className="text-danger mt-1"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {formValidation.touched.learner_id &&
                        formValidation.errors.learner_id}
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

Userreport.layout = "Contentlayout";
export default Userreport;

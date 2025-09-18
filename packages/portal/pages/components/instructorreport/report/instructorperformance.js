import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { useFormik } from "formik";
import "../../../../shared/utils/i18n.js";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../../shared/layout-components/seo/seo.js";
import "../../../../shared/utils/i18n.js";
import { getLocalStorageData } from "../../../../shared/redux/slices/localstorage/LocalStorage.js";
import { getInstructorList } from "../../../../shared/redux/slices/common/masters.js";
import { getScenarioList } from "../../../../shared/redux/slices/event/eventsManage.js";
import { instructorPerformanceList } from "../../../../shared/redux/slices/instructorreports/instructorreportsManage.js";
import * as XLSX from "xlsx";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";

const Userperformance = () => {
  const dispatch = useDispatch();
  const [view, setView] = useState("list");
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [scenarioDropdown, setscenarioDropdown] = useState([]);
  const [InstructorDropdown, setInstructorropdown] = useState([]);
  const {
    hasGetInstructorListSucc,
    hasGetScenarioListSuccess,
    hasinstructorperformancelist,
  } = useSelector((state) => {
    return {
      hasGetInstructorListSucc:
        state &&
        state.commonMaster &&
        state.commonMaster.getInstructorListData.data,

      hasGetScenarioListSuccess: state?.eventsManage?.getScenarioListsucc?.data,

      hasinstructorperformancelist:
        state &&
        state.instructorreportsManage &&
        state.instructorreportsManage.getinstructorperformancelist.data,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"));
    }
  }, []);

  useEffect(() => {
    dispatch(getInstructorList());
  }, []);
  useEffect(() => {
    dispatch(getScenarioList());
  }, []);

  useEffect(() => {
    if (hasGetInstructorListSucc?.length > 0) {
      const dropdownData = hasGetInstructorListSucc.map((item) => ({
        instructor_id: item.instructor_id,
        name: item.name,
      }));

      setInstructorropdown(dropdownData);
    }
  }, [hasGetInstructorListSucc]);

  useEffect(() => {
    if (hasGetScenarioListSuccess?.length > 0) {
      const dropdownData = hasGetScenarioListSuccess.map((item) => ({
        scenarioid: item.scenarioid,
        scenariotitle: item.scenariotitle,
      }));

      setscenarioDropdown(dropdownData);
    }
  }, [hasGetScenarioListSuccess]);

  useEffect(() => {
    const payload = {
      instructor_id: hasGetInstructorListSucc?.instructor_id,
      scenario_id: hasGetScenarioListSuccess?.scenario_id,
    };
    dispatch(instructorPerformanceList(payload));
  }, []);

  useEffect(() => {
    if (hasinstructorperformancelist) {
      // Wrap single object into array for uniform handling
      if (Array.isArray(hasinstructorperformancelist)) {
        setRowData(hasinstructorperformancelist);
      } else if (typeof hasinstructorperformancelist === "object") {
        setRowData([hasinstructorperformancelist]); // wrap single object in array
      } else {
        setRowData([]);
      }
    } else {
      setRowData([]);
    }
  }, [hasinstructorperformancelist]);

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      instructor_id: [],
      scenario_id: [],
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
      field: "srNo",
      maxWidth: 80,
      cellRenderer: "srNoRender",
      headerTooltip: "Sr No.",
    },
    {
      headerName: "Full Name",
      field: "instructor_name",
      headerTooltip: "Full Name",
      filter: true,
      floatingFilter: true,
      // maxWidth: 140,
    },

    {
      headerName: "Total Scenarios",
      field: "total_scenarios",
      headerTooltip: "Total Scenarios Created",
      filter: true,
      floatingFilter: true,
      // maxWidth: 100,
    },
    {
      headerName: "Published",
      field: "total_published",
      headerTooltip: "Published Scenarios",
      filter: true,
      floatingFilter: true,
      // maxWidth: 100,
    },
    {
      headerName: "Draft",
      field: "total_draft",
      headerTooltip: "Draft Scenarios",
      filter: true,
      floatingFilter: true,
      // maxWidth: 100,
    },
    {
      headerName: "Scenarios by Category",
      field: "by_category",
      headerTooltip: "Scenario Count by Category",
      cellRenderer: "categoryCountRenderer",
      filter: true,
      floatingFilter: true,
      minWidth: 300,
    },
    {
      headerName: "By Level",
      field: "by_level",
      headerTooltip: "Scenarios by Level",
      cellRenderer: "scenarioLevelStatsRenderer",
      filter: true,
      floatingFilter: true,
      minWidth: 250,
    },
    {
      headerName: "Quizzes by Category",
      field: "by_category_quiz",
      headerTooltip: "Quiz Count by Category",
      cellRenderer: "categoryQuizCountRenderer",
      filter: true,
      floatingFilter: true,
      // minWidth: 250,
    },
  ];

  const handleExport = () => {
    const data = Array.isArray(hasinstructorperformancelist)
      ? hasinstructorperformancelist
      : [hasinstructorperformancelist]; // ensure it's always an array

    const exportData = data.map((row) => {
      // Format levels
      const easy = row.by_level?.Easy?.count || 0;
      const easyPct = row.by_level?.Easy?.pct || "0.00";
      const medium = row.by_level?.Medium?.count || 0;
      const mediumPct = row.by_level?.Medium?.pct || "0.00";
      const hard = row.by_level?.Hard?.count || 0;
      const hardPct = row.by_level?.Hard?.pct || "0.00";

      // Format categories
      const categoryStr = row.by_category
        ? Object.entries(row.by_category)
            .map(([cat, count]) => `${cat} (${count})`)
            .join(", ")
        : "-";

      const quizCategoryStr = row.by_category_quiz
        ? Object.entries(row.by_category_quiz)
            .map(([cat, count]) => `${cat} (${count})`)
            .join(", ")
        : "-";

      return [
        row.total_scenarios,
        row.total_published,
        row.total_draft,
        row.total_created_scenarios,
        `Easy: ${easy} (${easyPct}%)`,
        `Medium: ${medium} (${mediumPct}%)`,
        `Hard: ${hard} (${hardPct}%)`,
        categoryStr,
        quizCategoryStr,
      ];
    });

    const header = [
      "Total Scenarios",
      "Published",
      "Draft",
      "Created Scenarios",
      "Easy Level",
      "Medium Level",
      "Hard Level",
      "By Category",
      "By Category (Quiz)",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Instructor Performance");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);

    const fileName = `Instructor_Performance_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };
  const onGridReady = (params) => {
    setGridApi(params.api);
  };

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

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },

    scenarioLevelStatsRenderer: function (props) {
      const levels = props?.value;

      if (!levels || typeof levels !== "object") return "-";

      const formatLevel = (label, data) => {
        if (!data) return `${label}: 0 (0%)`;
        return `${label}: ${data.pct}%`;
      };

      return (
        <div>
          {formatLevel("E", levels.Easy)}, {formatLevel("M", levels.Medium)},{" "}
          {formatLevel("H", levels.Hard)}
        </div>
      );
    },

    categoryCountRenderer: function (props) {
      const data = props?.value;
      if (!data || typeof data !== "object") return "-";

      const formatted = Object.entries(data)
        .map(([category, count]) => `${category} (${count})`)
        .join(", ");

      return <span>{formatted}</span>;
    },

    categoryQuizCountRenderer: function (props) {
      const data = props?.value;
      if (!data || typeof data !== "object") return "-";

      const formatted = Object.entries(data)
        .map(([category, count]) => `${category} (${count})`)
        .join(", ");

      return <span>{formatted}</span>;
    },
  };

  return (
    <>
      <Seo title="Instructor Performance" />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4> Instructor Performance</h4>

                  <Form.Group as={Col} md="3" className="">
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
                      name="instructor_id"
                      value={formValidation.values.instructor_id}
                      options={InstructorDropdown}
                      getOptionLabel={(x) => x.name}
                      getOptionValue={(x) => x.instructor_id}
                      placeholder="Select Instructors"
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

                        dispatch(instructorPerformanceList(payload));
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
                      name="scenario_id"
                      // styles={getSelectStyles("scenario_id")}
                      value={formValidation.values.scenario_id}
                      options={scenarioDropdown}
                      getOptionLabel={(x) => x.scenariotitle}
                      getOptionValue={(x) => x.scenarioid}
                      placeholder="Select scenario"
                      onChange={(selectedOptions) => {
                        formValidation.setFieldValue(
                          "scenario_id",
                          selectedOptions || []
                        );

                        const selectedIds = (selectedOptions || []).map(
                          (s) => s.scenarioid
                        );

                        const payload =
                          selectedIds.length > 0
                            ? { scenario_id: selectedIds }
                            : {};

                        dispatch(instructorPerformanceList(payload));
                      }}
                      menuPosition="fixed"
                    />
                    <div
                      className="text-danger mt-1"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {formValidation.touched.scenario_id &&
                        formValidation.errors.scenario_id}
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
              </Col>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

Userperformance.layout = "Contentlayout";
export default Userperformance;

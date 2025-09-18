import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  
} from "react-bootstrap";
import Select from "react-select";

import { useFormik } from "formik";
import "../../../../shared/utils/i18n";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import { getLocalStorageData } from "../../../../shared/redux/slices/localstorage/LocalStorage.js";
import * as XLSX from "xlsx";
import { getStudentListreport } from "../../../../shared/redux/slices/common/masters.js";
import { getScenarioList } from "../../../../shared/redux/slices/event/eventsManage";
import { UserPerformanceList } from "../../../../shared/redux/slices/userreports/userreportsManage.js";

const Userperformance = () => {
  const dispatch = useDispatch();
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [studentDropdown, setStudentDropdown] = useState([]);
  const [scenarioDropdown, setscenarioDropdown] = useState([]);

  const {
    hasGetStudentListSuccreport,
    hasGetScenarioListSuccess,
    hasuserperformancelist,
  } = useSelector((state) => {
    return {
      hasGetStudentListSuccreport:
        state &&
        state.commonMaster &&
        state.commonMaster.getStudentListDatareport.data,
      hasGetScenarioListSuccess: state?.eventsManage?.getScenarioListsucc?.data,
      hasuserperformancelist:
        state &&
        state.userreportsManage &&
        state.userreportsManage.getuserperformancelist.data,
    };
  });
  console.log("hasuserperformancelist",hasuserperformancelist)

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"));
    }
  }, []);

  useEffect(() => {
    dispatch(getStudentListreport());
  }, []);
  useEffect(() => {
    dispatch(getScenarioList());
  }, []);

  useEffect(() => {
    if (hasGetStudentListSuccreport?.length > 0) {
      const dropdownData = hasGetStudentListSuccreport.map((item) => ({
        learner_id: item.learner_id,
        Student_name: item.Student_name,
      }));

      setStudentDropdown(dropdownData);
    }
  }, [hasGetStudentListSuccreport]);

  useEffect(() => {
    if (hasGetScenarioListSuccess?.length > 0) {
      const dropdownData = hasGetScenarioListSuccess.map((item) => ({
        scenarioid: item.scenarioid,
        scenariotitle: item.scenariotitle,
      }));

      setscenarioDropdown(dropdownData);
    }
  }, [hasGetScenarioListSuccess]);

  console.log("hasGetStudentListSuccreport", hasGetStudentListSuccreport);

  useEffect(() => {
    const payload = {
      learner_id: hasGetStudentListSuccreport?.learner_id,
      scenario_id: hasGetScenarioListSuccess?.scenario_id,
    };
    dispatch(UserPerformanceList(payload));
  }, []);

  useEffect(() => {
    if (
      hasuserperformancelist &&
      Object.keys(hasuserperformancelist).length > 0
    ) {
      setRowData(hasuserperformancelist);
    } else {
      setRowData([]);
    }
  }, [hasuserperformancelist]);

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {

      learner_id: [],
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
      field: "Sr No.",
      headerTooltip: "Sr No.",
      maxWidth: 80,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
     {
      headerName: "Full Name",
      field: "name",
      headerTooltip: "Full Name",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Number of Scenarios Taken",
      field: "total_attempted_scenarios",
      headerTooltip: "Number of Scenarios Taken",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Scenario Level Stats (%)",
      field: "scenario_level_stats",
      headerTooltip: "Scenario Level Stats (%)",
      cellRenderer: "scenarioLevelStatsRenderer",
      minWidth: 300,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Scenario Completion Rate (%)",
      field: "scenario_completion_data",
      headerTooltip: "Scenario Completion Rate (%)",
      filter: true,
      floatingFilter: true,
    },

    {
      headerName: "Quiz Success Rate (%)",
      field: "quiz_answer_data",
      headerTooltip: "Quiz Success Rate (%)",
      filter: true,
      floatingFilter: true,
    },
  ];

  const handleExport = () => {
    const data = Array.isArray(hasuserperformancelist)
      ? hasuserperformancelist
      : [hasuserperformancelist]; // ensure array

    const exportData = data.map((row) => {
      // Format scenario_level_stats
      const levels = row.scenario_level_stats || {};
      const formatLevel = (level) => {
        const comp = levels[level]?.completed ?? 0;
        const tot = levels[level]?.total ?? 0;
        return `${level}: ${comp}/${tot}`;
      };
      const scenarioLevelStr = ["Easy", "Medium", "Hard"]
        .map(formatLevel)
        .join(", ");

      return [
        row.total_attempted_scenarios ?? "-",
        scenarioLevelStr,
        row.scenario_completion_data ?? "-",
        row.quiz_answer_data ?? "-",
      ];
    });

    const header = [
      "Number of Scenarios Taken",
      "Scenario Level Stats",
      "Scenario Completion Rate (%)",
      "Quiz Success Rate (%)",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Performance");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);

    XLSX.writeFile(workbook, `User_Performance_${timestamp}.xlsx`);
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
      const stats = props?.value;

      if (!stats || typeof stats !== "object") return "-";

      const getDisplay = (label, statObj) => {
        const completed = statObj?.completed || 0;
        const total = statObj?.total || 0;
        return `${label}: ${completed}/${total}`;
      };

      return (
        <div>
          {getDisplay("E", stats.Easy)}, {getDisplay("M", stats.Medium)},{" "}
          {getDisplay("H", stats.Hard)}
        </div>
      );
    },
  };

  return (
    <>
      <Seo title="User Performance" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4> User Performance</h4>

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
                      // styles={getSelectStyles("learner_id")}
                      value={formValidation.values.learner_id || null}
                      options={studentDropdown}
                      getOptionLabel={(x) => x.Student_name}
                      getOptionValue={(x) => x.learner_id}
                      placeholder="Select User"
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

                        dispatch(UserPerformanceList(payload));
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
                      value={formValidation.values.scenario_id || null}
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

                        dispatch(UserPerformanceList(payload));
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

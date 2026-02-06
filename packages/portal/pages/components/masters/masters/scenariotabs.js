import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Select from "react-select";
import Seo from "../../../../shared/layout-components/seo/seo";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  getsceanriotabList,
  savescenariotab,
  clearsavescenariotab,
  getsceanriotabwidget,
  clearHasError,
} from "../../../../shared/redux/slices/scenariotabs/scenariotabsManage";
const ScenarioTabs = () => {
  const dispatch = useDispatch();
  const [oneClick, setOneClick] = useState(false);
  const [dynamicTabs, setDynamicTabs] = useState([]);
  const {
    hasGetscenariotabsListSucc,
    hasGetSavescenariotabSucc,
    hasGetscenariotabswidgetSucc,
    errorData,
  } = useSelector((state) => ({
    hasGetscenariotabsListSucc:
      state.scenarioTabs?.getscenariotabData?.data || [],
    hasGetscenariotabswidgetSucc:
      state.scenarioTabs?.getscenariowidgetData?.data || [],
    hasGetSavescenariotabSucc: state.scenarioTabs?.savescenariotab,
    errorData: state.scenarioTabs?.error,
  }));
  const getSelectStyles = (fieldName) => {
    const error =
      !formValidation.values[fieldName] &&
      formValidation.errors[fieldName] &&
      formValidation.touched[fieldName];

    return {
      ...customStyles,
      control: (styles, state) => ({
        ...styles,
        borderColor: error ? "#EB5757" : styles.borderColor,
        boxShadow: error ? "0 0 0 0.001rem #EB5757" : styles.boxShadow,
        backgroundColor: "var(--dark-bg-color)",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "var(--light-text-color)",
      }),
      input: (provided) => ({
        ...provided,
        color: "var(--light-text-color)",
      }),
    };
  };
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

  useEffect(() => {
    dispatch(getsceanriotabList());
  }, []);

  useEffect(() => {
    dispatch(getsceanriotabwidget());
  }, []);

  useEffect(() => {
    if (
      !Array.isArray(hasGetscenariotabsListSucc) ||
      hasGetscenariotabsListSucc.length === 0
    ) {
      return;
    }
    const fixedTabs = hasGetscenariotabsListSucc.filter(
      (t) => t.tab_type === "Fixed"
    );
    const flexibleTabs = hasGetscenariotabsListSucc.filter(
      (t) => t.tab_type === "Flexible"
    );

    // Build fixed tab form values
    const fixedValues = fixedTabs.reduce((acc, tab, idx) => {
      const i = idx + 1;
      acc[`fixed_event_${i}`] = tab.event_status === "True";
      acc[`fixed_tab_${i}`] = tab.tab_name || "";
      acc[`fixed_toggle_${i}`] = tab.tab_status === "True";
      acc[`fixed_order_${i}`] = tab.tab_ordering || "";
      acc[`fixed_id_${i}`] = tab.scenariotabid || "";
      return acc;
    }, {});

    // Update form only if changed
    formValidation.setValues((prev) =>
      JSON.stringify(prev) === JSON.stringify(fixedValues) ? prev : fixedValues
    );

    // Build dynamic tabs
    const newDynamicTabs = flexibleTabs.map((tab) => ({
      scenariotabid: tab.scenariotabid,
      name: tab.tab_name,
      enabled: tab.tab_status === "True",
      event_status: tab.event_status === "True",
      order: tab.tab_ordering || "",
      type: tab.tab_type,
      widget_url: tab.widget_url || "",
    }));

    // Update dynamic tabs only if changed
    setDynamicTabs((prev) =>
      JSON.stringify(prev) === JSON.stringify(newDynamicTabs)
        ? prev
        : newDynamicTabs
    );
  }, [hasGetscenariotabsListSucc]);

  useEffect(() => {
    if (errorData?.statusCode) {
      let message = "";

      if (errorData.errors && errorData.errors.length > 0) {
        const uniqueErrors = [...new Set(errorData.errors)];
        message = uniqueErrors.join(", ");
      } else {
        message = errorData?.message || "Something went wrong";
      }
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">{message}</p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    if (hasGetSavescenariotabSucc?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasGetSavescenariotabSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      setOneClick(false);
      dispatch(clearsavescenariotab());
    }
  }, [hasGetSavescenariotabSucc]);

  const handleDynamicChange = (index, key, value) => {
    const updated = [...dynamicTabs];
    updated[index][key] = value;
    setDynamicTabs(updated);
  };

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {},
    validationSchema: yup.object().shape({
      fixed_order_1: yup
        .number()
        .typeError("Order is required")
        .min(1, "Order must be at least 1")
        .max(50, "Order cannot exceed 50")
        .required("Order is required"),
      fixed_order_2: yup
        .number()
        .typeError("Order is required")
        .min(1, "Order must be at least 1")
        .max(50, "Order cannot exceed 50")
        .required("Order is required"),
      fixed_order_3: yup
        .number()
        .typeError("Order is required")
        .min(1, "Order must be at least 1")
        .max(50, "Order cannot exceed 50")
        .required("Order is required"),
      fixed_order_4: yup
        .number()
        .typeError("Order is required")
        .min(1, "Order must be at least 1")
        .max(50, "Order cannot exceed 50")
        .required("Order is required"),
      fixed_order_5: yup
        .number()
        .typeError("Order is required")
        .min(1, "Order must be at least 1")
        .max(50, "Order cannot exceed 50")
        .required("Order is required"),
    }),

    onSubmit: async (data) => {
      setOneClick(true);
      const fixedPayloads = Object.keys(data)
        .filter((key) => key.startsWith("fixed_tab_"))
        .map((key, i) => ({
          scenariotabid: data[`fixed_id_${i + 1}`] || 0,
          tab_name: data[key],
          tab_status: data[`fixed_toggle_${i + 1}`] ? "True" : "False",
          // event_status: data[`fixed_event_${i + 1}`] ? "True" : "False",
          event_status:
            i + 1 === 4
              ? "False"
              : data[`fixed_event_${i + 1}`]
              ? "True"
              : "False",

          tab_type: "Fixed",
          widget_url: null,
          tab_ordering: data[`fixed_order_${i + 1}`] || i + 1,
        }));
      const dynamicPayloads = dynamicTabs.map((tab) => ({
        scenariotabid: tab.scenariotabid || 0,
        tab_name: tab.name,
        tab_status: tab.enabled ? "True" : "False",
        event_status: tab.event_status ? "True" : "False",
        tab_type: tab.type || "Flexible",
        widget_url: tab.widget_url || null,
        tab_ordering: tab.order || null,
      }));
      const allPayloads = [...fixedPayloads, ...dynamicPayloads];
      await dispatch(savescenariotab(allPayloads));
    },
  });

  return (
    <>
      <Seo title="Scenario Tabs" />
      <ToastContainer />
      <Card className="custom-card mt-4">
        <Card.Body>
          <h5 className="mb-3">Scenario Tabs</h5>
          <Col md={12} className="mg-b-5 bd-b mb-4">
            <div className="d-flex justify-content-between">
              <h5></h5>
              <div></div>
            </div>
          </Col>
          <Form onSubmit={formValidation.handleSubmit}>
            {/* Fixed Tabs */}
            <h6 className="text-info mb-3">Fixed Tabs</h6>
            <Row className="g-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Col md={6} key={i}>
                  <div className="d-flex align-items-center gap-2 p-2 border rounded ">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <Form.Control
                        type="text"
                        placeholder={`Tab ${i} Name`}
                        name={`fixed_tab_${i}`}
                        value={formValidation.values[`fixed_tab_${i}`] || ""}
                        disabled
                        onChange={formValidation.handleChange}
                      />
                      {formValidation.touched[`fixed_order_${i}`] &&
                        formValidation.errors[`fixed_order_${i}`] && (
                          <div
                            className="text-danger mt-1"
                            style={{ fontSize: "12px" }}
                          >
                            {formValidation.errors[`fixed_order_${i}`]}
                          </div>
                        )}
                    </div>
                    <label className="custom-switch mb-0">
                      <input
                        type="checkbox"
                        className="custom-switch-input"
                        checked={
                          formValidation.values[`fixed_toggle_${i}`] || false
                        }
                        onChange={(e) =>
                          formValidation.setFieldValue(
                            `fixed_toggle_${i}`,
                            e.target.checked
                          )
                        }
                      />
                      <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                    </label>
                    <Form.Control
                      type="number"
                      placeholder="Order"
                      name={`fixed_order_${i}`}
                      value={formValidation.values[`fixed_order_${i}`] || ""}
                      onChange={formValidation.handleChange}
                      onBlur={formValidation.handleBlur}
                      onWheel={(e) => e.target.blur()}
                      isInvalid={
                        formValidation.touched[`fixed_order_${i}`] &&
                        !!formValidation.errors[`fixed_order_${i}`]
                      }
                      style={{ width: "90px" }}
                    />
                    {/* Event Status Checkbox (skip for 4th tab) */}
                    {i !== 4 && (
                      <div className="ms-2 d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="green-checkbox"
                          checked={
                            formValidation.values[`fixed_event_${i}`] || false
                          }
                          onChange={(e) =>
                            formValidation.setFieldValue(
                              `fixed_event_${i}`,
                              e.target.checked
                            )
                          }
                        />
                        <span className="ms-1">Event</span>
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
            {/* Dynamic Tabs */}
            <h6 className="text-info mt-4 mb-3 d-flex justify-content-between">
              Dynamic Tab
            </h6>
            <Row className="g-3">
              {dynamicTabs.map((tab, index) => (
                <>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2 p-2 border rounded ">
                      <Form.Control
                        type="text"
                        placeholder="Tab Name"
                        value={tab.name}
                        onChange={(e) =>
                          handleDynamicChange(index, "name", e.target.value)
                        }
                        disabled={!tab.enabled}
                      />
                      <label className="custom-switch mb-0">
                        <input
                          type="checkbox"
                          className="custom-switch-input"
                          checked={tab.enabled}
                          onChange={(e) =>
                            handleDynamicChange(
                              index,
                              "enabled",
                              e.target.checked
                            )
                          }
                        />
                        <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                      </label>
                      <Form.Control
                        type="number"
                        placeholder="Order"
                        value={tab.order}
                        style={{ width: "90px" }}
                        onWheel={(e) => e.target.blur()}
                        onChange={(e) =>
                          handleDynamicChange(index, "order", e.target.value)
                        }
                      />
                      <div className="ms-2 d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="green-checkbox"
                          checked={tab.event_status}
                          onChange={(e) =>
                            handleDynamicChange(
                              index,
                              "event_status",
                              e.target.checked
                            )
                          }
                        />
                        <span className="ms-1">Event</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="gap-2 p-2 border rounded  ">
                      <Select
                        theme={(theme) => ({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary25: "var(--primary-bg-color)",
                            primary: "var(--primary-bg-color)",
                          },
                        })}
                        styles={getSelectStyles("widget_url")}
                        name={`widget_${index}`}
                        value={
                          hasGetscenariotabswidgetSucc
                            ?.map((item) => ({
                              label: item.label,
                              value: item.value,
                              id: item.webbrowserwidgetid,
                            }))
                            .find((opt) => opt.value === tab.widget_url) || null
                        }
                        options={
                          hasGetscenariotabswidgetSucc?.map((item) => ({
                            label: item.label,
                            value: item.value,
                            id: item.webbrowserwidgetid,
                          })) || []
                        }
                        getOptionLabel={(x) => x.label}
                        getOptionValue={(x) => x.value}
                        placeholder="Select Widget"
                        onChange={(selectedOption) => {
                          handleDynamicChange(
                            index,
                            "widget_url",
                            selectedOption?.value || ""
                          );
                        }}
                      />
                    </div>
                  </Col>
                </>
              ))}
            </Row>
            <div className="text-end mt-3">
              <Button type="submit" variant="primary" disabled={oneClick}>
                {oneClick ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};
ScenarioTabs.layout = "Contentlayout";
export default ScenarioTabs;

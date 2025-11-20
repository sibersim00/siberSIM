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
  const [abortController, setAbortController] = useState(null);

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
  const customStyles = () => {
    return {
      control: (styles) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)",
        borderColor: "#333435ff",
        // minHeight: "38px",
      }),
      multiValue: (styles) => ({
        ...styles,
        backgroundColor: "var(--primary-bg-color)",
      }),
      multiValueLabel: (styles) => ({
        ...styles,
        // color: "#fff",
      }),
      multiValueRemove: (styles) => ({
        ...styles,
        // color: "#fff",
        ":hover": {
          // backgroundColor: "#EB5757",
          // color: "white",
        },
      }),
      input: (styles) => ({
        ...styles,
        // color: "var(--light-text-color)",
      }),
      singleValue: (styles) => ({
        ...styles,
        // color: "var(--light-text-color)",
      }),
      placeholder: (styles) => ({
        ...styles,
        // color: "#aaa",
      }),
    };
  };

  useEffect(() => {
    dispatch(getsceanriotabList());
  }, []);

  useEffect(() => {
    dispatch(getsceanriotabwidget());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAbortController(controller);
    dispatch(getsceanriotabList({ signal: controller.signal }));

    return () => {
      controller.abort();
    };
  }, [dispatch]);

  useEffect(() => {
    if (
      hasGetscenariotabsListSucc &&
      Array.isArray(hasGetscenariotabsListSucc) &&
      hasGetscenariotabsListSucc.length > 0
    ) {
      const fixedTabs = hasGetscenariotabsListSucc.filter(
        (tab) => tab.tab_type === "Fixed"
      );
      const flexibleTabs = hasGetscenariotabsListSucc.filter(
        (tab) => tab.tab_type === "Flexible"
      );

      const fixedValues = {};
      fixedTabs.forEach((tab, index) => {
        fixedValues[`fixed_tab_${index + 1}`] = tab.tab_name || "";
        fixedValues[`fixed_toggle_${index + 1}`] = tab.tab_status === "True";
        fixedValues[`fixed_order_${index + 1}`] = tab.tab_ordering || "";
        fixedValues[`fixed_id_${index + 1}`] = tab.scenariotabid || "";
      });
      formValidation.setValues((prevValues) => {
        const isSame =
          JSON.stringify(prevValues) === JSON.stringify(fixedValues);
        return isSame ? prevValues : fixedValues;
      });

      setDynamicTabs((prevTabs) => {
        const newTabs = flexibleTabs.map((tab) => ({
          scenariotabid: tab.scenariotabid,
          name: tab.tab_name,
          enabled: tab.tab_status === "True",
          order: tab.tab_ordering || "",
          type: tab.tab_type,
          widget_url: tab.widget_url || "",
        }));

        const isSame = JSON.stringify(prevTabs) === JSON.stringify(newTabs);
        return isSame ? prevTabs : newTabs;
      });
    }
  }, [hasGetscenariotabsListSucc]);

  // Error Toast
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
      // handleOneClick(false);
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
      dispatch(clearsavescenariotab());
    }
  }, [hasGetSavescenariotabSucc]);

  const handleDynamicChange = (index, key, value) => {
    const updated = [...dynamicTabs];
    updated[index][key] = value;
    setDynamicTabs(updated);
  };

  const handleRemoveDynamic = (index) => {
    setDynamicTabs(dynamicTabs.filter((_, i) => i !== index));
  };

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {},
    validationSchema: yup.object().shape({}),
    onSubmit: async (data) => {
      setOneClick(true);

      const fixedPayloads = Object.keys(data)
        .filter((key) => key.startsWith("fixed_tab_"))
        .map((key, i) => ({
          scenariotabid: data[`fixed_id_${i + 1}`] || 0,
          tab_name: data[key],
          tab_status: data[`fixed_toggle_${i + 1}`] ? "True" : "False",
          tab_type: "Fixed",
          widget_url: null,
          tab_ordering: data[`fixed_order_${i + 1}`] || i + 1,
        }));

      const dynamicPayloads = dynamicTabs.map((tab) => ({
        scenariotabid: tab.scenariotabid || 0,
        tab_name: tab.name,
        tab_status: tab.enabled ? "True" : "False",
        tab_type: tab.type || "Flexible",
        widget_url: tab.widget_url || null,
        tab_ordering: tab.order || null,
      }));

      const allPayloads = [...fixedPayloads, ...dynamicPayloads];
      console.log(
        "Final payload before sending:",
        JSON.stringify(allPayloads, null, 2)
      );
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
                    <Form.Control
                      type="text"
                      placeholder={`Tab ${i} Name`}
                      name={`fixed_tab_${i}`}
                      value={formValidation.values[`fixed_tab_${i}`] || ""}
                      disabled
                      onChange={formValidation.handleChange}
                    />
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
                      style={{ width: "90px" }}
                      disabled={!formValidation.values[`fixed_toggle_${i}`]} // 👈 Disable when toggle is false
                    />
                  </div>
                </Col>
              ))}
            </Row>

            {/* Dynamic Tabs */}
            <h6 className="text-info mt-4 mb-3 d-flex justify-content-between">
              Dynamic Tab
              {/* <Button
                variant="outline-success"
                size="sm"
                onClick={() =>
                  setDynamicTabs([
                    ...dynamicTabs,
                    {
                      name: "",
                      enabled: false,
                      order: "",
                      type: "Flexible",
                      widget_url: "",
                    },
                  ])
                }
              >
                + Add Tab
              </Button> */}
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
                         disabled={!tab.enabled} // 👈 disable input when toggle is false
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
                        onChange={(e) =>
                          handleDynamicChange(index, "order", e.target.value)
                        }
                        disabled={!tab.enabled}
                      />
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
                        name={`widget_${index}`}
                        styles={customStyles()}
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
                  {/* </div> */}
                </>
              ))}
            </Row>

            <div className="text-end mt-3">
              <Button type="submit" variant="primary">
                save
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

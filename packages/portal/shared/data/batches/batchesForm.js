import React, { useState, useEffect, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import {
  clearSaveBatches,
  clearSingleBatch,
  getBatchesList,
  getSingleBatch,
  saveBatches,
  updateBatches,
  clearUpdateBatches,
} from "../../redux/slices/batches/batches";
import { getStudentList } from "../../redux/slices/common/masters";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import "../../utils/i18n";
import { useFormik } from "formik";
import { Row, Col, Card, Button, Form, Spinner } from "react-bootstrap";
import { emojiRegex } from "../../utils/regex";
import { useRouter } from "next/router";

const FormBatches = (props) => {
  const dispatch = useDispatch();
   const { query, push } = useRouter();
  const { t, i18n } = useTranslation();
  const [heading, setHeading] = useState("Add");
  const [rowValues, setRowValues] = useState({});
  const { setView, rowId, oneClick, handleOneClick, backView } = props;
console.log('backView',backView);
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

  const customStyles = {
    control: (styles, { isFocused, isDisabled }) => ({
      ...styles,
      padding: 1,
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

  const {
    getStudentListData,
    saveBatchesData,
    getSingleBatchSucc,
    updateBatchesData,
  } = useSelector((state) => ({
    getStudentListData: state?.commonMaster?.getStudentListData?.data,
    saveBatchesData: state?.batches?.saveBatches?.data,
    getSingleBatchSucc: state?.batches?.singleBatch?.data,
    updateBatchesData: state?.batches?.updateBatches,
  }));

  useEffect(() => {
    if (getSingleBatchSucc && getSingleBatchSucc !== "") {
      setRowValues(getSingleBatchSucc);
    }
  }, [getSingleBatchSucc]);

  useEffect(() => {
    dispatch(getStudentList());
    dispatch(clearSingleBatch());
  }, []);
  const handleSubmit = (e) => {
    e.preventDefault();
    formValidation.handleSubmit();
  };

  useEffect(() => {
    if (formValidation.isValid) {
      if (saveBatchesData?.statusCode === 200) {
        handleOneClick(false);
        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
            {saveBatchesData?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: false,
            theme: "colored",
          }
        );
        setView(backView);
        dispatch(getBatchesList());
        dispatch(clearSaveBatches());
      }
    }
  }, [saveBatchesData]);

  useEffect(() => {
    if (updateBatchesData?.statusCode === 200) {
      handleOneClick(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {updateBatchesData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      setView(backView);
      dispatch(getBatchesList());
      dispatch(clearUpdateBatches());
      dispatch(clearSingleBatch());
    }
  }, [updateBatchesData]);

  useEffect(() => {
    if (rowId && rowId !== "") {
      setHeading("Update");
      dispatch(getSingleBatch(rowId));
    }
  }, [rowId, dispatch]);
  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      batchname: rowValues?.batchname || "",
      selectedStudents:
        rowValues?.learner_data?.map((learner) => learner.learner_id) || [],
    },
    validationSchema: Yup.object().shape({
      batchname: Yup.string()
        .required("Required")
        .matches(/^[A-Za-z0-9 ]+$/, "No special characters allowed")
        .min(5, "Batch Name must be at least 5 characters")
        .max(30, "Batch Name should not exceed 30 characters")
        .test("no-emoji", "Emojis are not allowed", noEmojiTest),
      selectedStudents: Yup.array().min(1, "Required"),
    }),
    onSubmit: (data, action) => {
      const payload = {
        batchid: rowValues?.batchid,
        batchname: data.batchname,
        students: data.selectedStudents.map((learner_id) => ({ learner_id })),
      };
    
      handleOneClick(true);
      if (rowValues?.batchid) {
        dispatch(updateBatches(payload));
      } else {
        dispatch(saveBatches(payload));
      }
    },
  });

  const studentOptions =
    getStudentListData?.map((student) => ({
      value: student.learner_id,
      label: student.Student_name,
    })) || [];

  return (
    <>
      <Row className="row-sm mg-t-10">
        <Col md={12}>
          <Form noValidate onSubmit={handleSubmit}>
            <Card className="custom-card">
              <Card.Body>
                <div className="learnerTitle d-flex justify-content-between align-items-center">
                  <h5>
                    {heading} {t("batches.title")}
                  </h5>
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => {
                      setView(backView); 
                      push(`/batches?view=${backView || 'list'}`);
                      formValidation.resetForm();
                      dispatch(clearSingleBatch());
                      dispatch(clearSaveBatches()); ;
                    }}
                  >
                    <i className="fe fe-arrow-left"></i>&nbsp;
                    {t("")}
                  </Button>
                  
                  
                </div>

                <Row className="row-sm">
                  <Col md={12}>
                    <Card className="custom-card">
                      <Row>
                        {/* Batch Name Field */}
                        <Col md={4}>
                          <Form.Group
                            as={Col}
                            md="12"
                            controlId="validationFormik102"
                            className="mb-3"
                          >
                            <Form.Label>
                              Batch Name <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              autoComplete="off"
                              name="batchname"
                              value={formValidation.values.batchname}
                              placeholder="Enter Batch Name"
                              onChange={formValidation.handleChange}
                              isInvalid={
                                formValidation.touched.batchname &&
                                formValidation.errors.batchname
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.batchname}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        {/* Student Name Multi-Select Field */}
                        <Col md={8}>
                          <Form.Group
                            as={Col}
                            md="12"
                            controlId="validationFormik101"
                            className="mb-3"
                          >
                            <Form.Label>
                              Student Name{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Select
                              theme={(theme) => ({
                                ...theme,
                                borderRadius: 5,

                                colors: {
                                  ...theme.colors,
                                  primary25: "var(--primary-bg-color)",
                                  primary: "var(--primary-bg-color)",
                                },
                              })}
                              name="selectedStudents"
                              placeholder="Select Student"
                              styles={getSelectStyles("selectedStudents")}
                              options={studentOptions}
                              value={studentOptions.filter((option) =>
                                formValidation.values.selectedStudents.includes(
                                  option.value
                                )
                              )}
                              getOptionLabel={(x) => x.label}
                              getOptionValue={(x) => x.value}
                              onChange={(selectedOptions) => {
                                formValidation.setFieldValue(
                                  "selectedStudents",
                                  selectedOptions.map((opt) => opt.value)
                                );
                              }}
                              isMulti
                            />
                            {formValidation.errors.selectedStudents &&
                              formValidation.touched.selectedStudents && (
                                <div className="invalid-tooltiped">
                                  {formValidation.errors.selectedStudents}
                                </div>
                              )}
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col className="d-flex justify-content-end">
                          {oneClick ? (
                            <Button variant="primary" disabled>
                              <Spinner
                                as="span"
                                animation="grow"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                              />
                              Loading...
                            </Button>
                          ) : (
                            <Button type="submit" disabled={oneClick}>
        {oneClick ? (
          <>
            <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
            Loading...
          </>
        ) : (
          t("common.submit")
        )}
      </Button>
                          )}
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Form>
        </Col>
      </Row>
    </>
  );
};
FormBatches.layout = "Contentlayout";
export default FormBatches;

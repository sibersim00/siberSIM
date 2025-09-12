import React, { useState, Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Button,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import * as yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import "../../../../shared/utils/i18n";

import {
  saveMappedInstructor, getMappedInstructorById
} from "../../../redux/slices/normalusers/normalUserManage";
import { 
  getInstructorList,
} from "../../../redux/slices/common/masters";
import Select from 'react-select'
import { MultiSelect } from "react-multi-select-component";

const MapInstructorModal = (props) => {
  const { openFlag, setMapInstructors, rowValues, } =
    props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const [isChecked, setIsChecked] = useState(false);
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");
  const handleToggle = () => {
    setIsChecked(!isChecked);
  };
  const [instructorsDropdown, setInstructorsDropdown] = useState([]);

  const phoneRegExp =
    /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
  const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const {
    hasGetinstructorSucc, getMappedInstructorByIdRes,hasgetInstructorListSucc
  } = useSelector((state) => {
    return {
     
      getMappedInstructorByIdRes:
        state &&
        state.normalUSerData &&
        state.normalUSerData.getMappedInstructorByIdRes &&
        state.normalUSerData.getMappedInstructorByIdRes.data,
     hasgetInstructorListSucc:
        state &&
        state.commonMaster &&
        state.commonMaster.getInstructorListData &&
        state.commonMaster.getInstructorListData.data,
    };
  });

  useEffect(() => {
   // dispatch(getListOfinstructor());
    dispatch(getInstructorList());
  }, [])
  useEffect(() => {
    if (rowValues && rowValues.learner_id) {
      const payload = {
        "learner_id": rowValues.learner_id
      }
      dispatch(getMappedInstructorById(payload));
    }
  }, [rowValues]);
  const viewDemoShow = (modal) => {
    if (modal === false) {
      setMapInstructors(false);
    }
  };
  useEffect(() => {
    if (hasgetInstructorListSucc && hasgetInstructorListSucc.length > 0) {
      const dropdownData = hasgetInstructorListSucc.map((cat) => ({
        instructor_id: cat?.instructor_id,
     
        instructor_name: `${cat?.name}`,

      }));

      setInstructorsDropdown(dropdownData);

      // Filter the instructors that are mapped in getMappedInstructorByIdRes
      if (getMappedInstructorByIdRes && getMappedInstructorByIdRes.length > 0) {
        const selected = dropdownData.filter((inst) =>
          getMappedInstructorByIdRes.some(
            (mapped) => mapped.instructor_id === inst.instructor_id
          )
        );

        formValidation.setFieldValue("instructor_id", selected);
      }
    }
  }, [hasgetInstructorListSucc, getMappedInstructorByIdRes]);


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
  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
         instructor_id: getMappedInstructorByIdRes
        ? instructorsDropdown.filter(
          (inst) => inst.instructor_id === getMappedInstructorByIdRes.instructor_id
        )
        : [],

    },

    validationSchema: yup.object().shape({
      instructor_id: yup
        .array()
        .of(
          yup.object().shape({
            instructor_id: yup.string().required(),
            instructor_name: yup.string().required(),
          })
        )
        .min(1, 'At least one instructor is required')
        .required('Required'),
    }),

    onSubmit: (data, action) => {
      try {
        let payload;
        payload = {
          learner_id: rowValues?.learner_id,
          instructorlist: Array.isArray(data?.instructor_id)
            ? data.instructor_id
            : [data?.instructor_id]
        };
       
        dispatch(saveMappedInstructor(payload));

      } catch (error) {
        console.error("Error submitting the form:", error);
        // Handle the error, maybe show a message to the user
      }
    },
  });
 
  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static" size="lg">
          <Modal.Header
            closeButton
            onClick={() => {
              viewDemoShow(false);
            }}
          >
            <Modal.Title>Assign Instructor</Modal.Title>
          </Modal.Header>
          <Form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              formValidation.handleSubmit();
              return false;
            }}
          >
            <Modal.Body>
              <Row>
                <Form.Group
                  as={Col}
                  md="8"
                  controlid="validationFormik102"
                  className="mb-3"
                >
                  <Form.Label>
                    Instructor <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary25: "var(--primary-bg-color)",
                        primary: "var(--primary-bg-color)",
                      },
                    })}
                    name="instructor_id"
                    styles={getSelectStyles("instructor_id")}
                    value={formValidation.values.instructor_id?.[0] || null} // single object from array
                    options={instructorsDropdown}
                    getOptionLabel={(x) => x.instructor_name}
                    getOptionValue={(x) => x.instructor_id}
                    placeholder="Select Instructor"
                    onChange={(e) => {
                      console.log("Selected:", e);
                      formValidation.setFieldValue("instructor_id", [e]); // store as array
                    }}
                    menuPosition="fixed"
                  />
                  {formValidation.errors.instructor_id && formValidation.touched.instructor_id && (
                    <div className="invalid-tooltiped">
                      {formValidation.errors.instructor_id}
                    </div>
                  )}
                </Form.Group>

              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" type="submit">
                Assign
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  viewDemoShow(false);
                }}
              >
                Close
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Fragment>
    </>
  );
};

export default MapInstructorModal;

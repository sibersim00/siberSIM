import React, { Fragment, useEffect, useMemo } from "react";
import { Modal, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import { useFormik } from "formik";
import * as yup from "yup";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dynamic from "next/dynamic";
import { getUserTypeWiseList } from "../../../redux/slices/common/masters";
import { useDispatch, useSelector } from "react-redux";
import { getStudentListreport } from "../../../redux/slices/common/masters";
import { addLabDetails, editLabDetails } from "../../../redux/slices/labs/labs";
import { toast, ToastContainer } from "react-toastify";
import dummy_network from "../../../../public/assets/img/dummy.jpg";
const FileUploader = dynamic(
  () => {
    return import("../../common/fileuploads/fileuploader");
  },
  { ssr: false },
);

import { FilePath } from "../../common/fileuploads/filepath";
const labImagePath = FilePath.labs;
const ismulti = false;


const LabsAdd = ({
  openFlag,
  handleFormModal,
  rowValues,
  oneClick,
  handleOneClick,
}) => {
  const accessLevelOptions = [
    { label: "Sim Manager", value: "simManager" },
    { label: "Sim Master", value: "simMaster" },
  ];
  const dispatch = useDispatch();
  const { getUserTypeWiseListData, hasGetStudentListSuccreport } = useSelector(
    (state) => {
      return {
        getUserTypeWiseListData:
          state &&
          state.commonMaster &&
          state.commonMaster.getUserTypeWiseListData &&
          state.commonMaster.getUserTypeWiseListData,
        hasGetStudentListSuccreport:
          state &&
          state.commonMaster &&
          state.commonMaster.getStudentListDatareport.data,
      };
    },
  );

  useEffect(() => {
    dispatch(getStudentListreport());
  }, []);

  const formatToLocal = (date) => {
    if (!date) return null;
    const pad = (n) => (n < 10 ? "0" + n : n);
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds())
    );
  };

  const userOptions =
    getUserTypeWiseListData?.map((u) => ({
      label: `${u.firstname} ${u.lastname}`,
      value: u.userid,
    })) || [];

  const studentOptions =
    hasGetStudentListSuccreport?.map((s) => ({
      label: s.Student_name,
      value: s.learner_id,
    })) || [];
  useEffect(() => {
    if (openFlag) handleOneClick(false);
  }, [openFlag]);

  // ------------------ Validation Schema ------------------
  const schema = yup.object({
    bookingname: yup.string().required("Required"),
    datetime: yup.date().required("Required"),
    duration: yup
      .number()
      .typeError("Duration must be a number")
      .min(1, "Minimum 1 hour required")
      .required("Required"),
    accesslevel: yup.string().required("Required"),
    personincharge: yup
      .number()
      .typeError("Must be a number")
      .required("Required"),
    reservedseats: yup
      .number()
      .typeError("Reserved seats must be a number")
      .min(1, "Minimum 1 seat required")
      .required("Required"),
    allowedusers: yup
      .array()
      .min(1, "Minimum 1 user is required")
      .required("Required"),
  });

  // ------------------ useFormik Hook ------------------
  const formik = useFormik({
    initialValues: {
      lab_id: rowValues?.lab_id ?? "",
      bookingname: rowValues?.bookingname || "",
      labimage: rowValues?.labimage || "",
      datetime: rowValues?.datetime ? new Date(rowValues?.datetime) : "",
      duration: rowValues?.duration || "",
      accesslevel: rowValues?.accesslevel || "",
      personincharge: rowValues?.personincharge || "",
      reservedseats: rowValues?.reservedseats || "",
      allowedusers: Array.isArray(rowValues?.allowedusers)
        ? rowValues.allowedusers
        : typeof rowValues?.allowedusers === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(rowValues.allowedusers);
                return parsed.map((u) => ({
                  label: u.name,
                  value: Number(u.learner_id),
                }));
              } catch (e) {
                return [];
              }
            })()
          : [],
    },
    validationSchema: schema,
    onSubmit: async (data) => {
      const payload = {
        lab_id: data.lab_id,
        bookingname: data.bookingname,
        labimage: data.labimage || "",
        datetime: formatToLocal(data.datetime),
        duration: Number(data.duration),
        accesslevel: data.accesslevel,
        personincharge: Number(data.personincharge),
        reservedseats: Number(data.reservedseats),
        allowedusers: data.allowedusers.map((u) => String(u.value)),
      };
      handleOneClick(true);

      let result;

      // ---------- ADD MODE ----------
      if (!rowValues || rowValues.lab_id === 0) {
        result = await dispatch(addLabDetails(payload));
      }
      // ---------- EDIT MODE ----------
      else {
        result = await dispatch(editLabDetails(payload));
      }

      handleOneClick(false);
    },
  });
  const { values, errors, touched, handleChange, handleSubmit, setFieldValue } =
    formik;

  const handleUpload = (name = "", files = "", flag = "") => {
    formik.setFieldValue("flag", flag);
    if (ismulti) {
      const selectedFiles = files.map((file) => file.file);
      const filesStr = selectedFiles.join(",");
      formik.setFieldValue(name, filesStr || "");
      return;
    }

    const uploadedPath = files?.[0]?.file || "";
    formik.setFieldValue(name, uploadedPath);
  };

  const memoizedFetchImageFiles = useMemo(() => {
    if (!values.labimage) return [];
    return ismulti ? values.labimage.split(",") : [values.labimage];
  }, [values.labimage]);

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
// =====================================================
//   const getSelectStyles = (fieldName) => {
//   const isDark = document.body.classList.contains("dark-theme");

//   const error =
//     touched[fieldName] &&
//     errors[fieldName] &&
//     (Array.isArray(values[fieldName])
//       ? values[fieldName].length === 0
//       : !values[fieldName]);

//   return {
//     control: (styles) => ({
//       ...styles,
//       borderColor: error ? "#EB5757" : styles.borderColor,
//       boxShadow: error ? "0 0 0 0.001rem #EB5757" : "none",
//       backgroundColor: isDark ? "var(--dark-bg-color)" : "#ffffff",
//       color: isDark ? "#fff" : "#111827",
//       minHeight: "38px",
//     }),

//     menu: (styles) => ({
//       ...styles,
//       backgroundColor: isDark ? "#1e263a" : "#ffffff",
//       color: isDark ? "#fff" : "#111827",
//       zIndex: 9999,
//     }),

//     option: (styles, state) => ({
//       ...styles,
//       backgroundColor: state.isFocused
//         ? isDark
//           ? "#04aa1f"
//           : "#04aa1f"
//         : state.isSelected
//         ? isDark
//           ? "#04aa1f"
//           : "#04aa1f"
//         : "transparent",
//       color: state.isSelected ? "#fff" : isDark ? "#fff" : "#111827",
//       cursor: "pointer",
//     }),

//     singleValue: (provided) => ({
//       ...provided,
//       color: isDark ? "#fff" : "#111827",
//     }),

//     input: (provided) => ({
//       ...provided,
//       color: isDark ? "#04aa1f" : "#04aa1f",
//     }),

//     placeholder: (provided) => ({
//       ...provided,
//       color: isDark ? "#aaa" : "#6b7280",
//     }),

//     multiValue: (provided) => ({
//       ...provided,
//       backgroundColor: isDark ? "#1e263a" : "#e5e7eb",
//       borderRadius: "6px",
//       padding: "2px 4px",
//     }),

//     multiValueLabel: (provided) => ({
//       ...provided,
//       color: isDark ? "#fff" : "#111827",
//       fontWeight: 500,
//     }),

//     multiValueRemove: (provided) => ({
//       ...provided,
//       color: isDark ? "#fff" : "#333",
//       cursor: "pointer",
//       ":hover": {
//         backgroundColor: "#ef4444",
//         color: "#fff",
//       },
//     }),
//   };
// };
// ====================================
const getSelectStyles = (fieldName) => {
  const hasError =
    touched[fieldName] &&
    errors[fieldName] &&
    (Array.isArray(values[fieldName])
      ? values[fieldName].length === 0
      : !values[fieldName]);

  return {
    control: (base, state) => ({
      ...base,
      borderColor: hasError ? "#EB5757" : base.borderColor,
      boxShadow: hasError
        ? "0 0 0 1px #EB5757"
        : state.isFocused
        ? base.boxShadow
        : "none",
      "&:hover": {
        borderColor: hasError ? "#EB5757" : base.borderColor,
      },
    }),
  };
};

  useEffect(() => {
    const reserved = Number(formik.values.reservedseats || 0);
    if (reserved > 0 && formik.values.allowedusers.length > reserved) {
      const trimmed = formik.values.allowedusers.slice(0, reserved);
      //  YOUR REQUIRED TOAST FORMAT
      // toast.error(
      //   // `Only ${reserved} users allowed. Extra users removed.`,
      //   `Allowed users cannot exceed the number of reserved seats.`,
      //   {
      //     position: toast.POSITION.TOP_RIGHT,
      //     hideProgressBar: true,
      //     theme: "colored",
      //   }
      // );
      formik.setFieldValue("allowedusers", trimmed);
    }
  }, [formik.values.reservedseats]);

  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static" size="lg">
        <Form noValidate onSubmit={handleSubmit}>
          <Modal.Header closeButton onClick={() => handleFormModal(false)}>
            <Modal.Title>
              {rowValues && rowValues.lab_id
                ? "Edit Lab Session"
                : "Add Lab Session"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              {/* Booking Name */}
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Booking Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="bookingname"
                  placeholder="Enter Booking Name"
                  value={values.bookingname}
                  onChange={handleChange}
                  isInvalid={touched.bookingname && errors.bookingname}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.bookingname}
                </Form.Control.Feedback>
              </Form.Group>

            

              {/* Date & Time */}
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Date & Time <span className="text-danger">*</span>
                </Form.Label>

                <DatePicker
                  selected={values.datetime}
                  onChange={(val) => setFieldValue("datetime", val)}
                  showTimeSelect
                  dateFormat="dd-MM-yyyy h:mm aa"
                  placeholderText="Select date & time"
                  onKeyDown={(e) => e.preventDefault()}
                  className={`form-control ${
                    touched.datetime && errors.datetime ? "is-invalid" : ""
                  }`}
                />

                {touched.datetime && errors.datetime && (
                  <div className="invalid-feedback d-block">
                    {errors.datetime}
                  </div>
                )}
              </Form.Group>

              {/* Duration */}
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Duration (In Hours) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="duration"
                  value={values.duration}
                  onChange={handleChange}
                  placeholder="Enter duration"
                  isInvalid={touched.duration && errors.duration}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.duration}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Access Level */}
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Access Level <span className="text-danger">*</span>
                </Form.Label>

                <Select
                  name="accesslevel"
                  classNamePrefix="custom-select"
                  styles={getSelectStyles("accesslevel")}
                  value={
                    accessLevelOptions.find(
                      (opt) => opt.value === values.accesslevel,
                    ) || null
                  }
                  options={accessLevelOptions}
                  placeholder="Select Access Level"
                  onChange={(selected) => {
                    setFieldValue("accesslevel", selected.value);
                    setFieldValue("personincharge", "");

                    dispatch(getUserTypeWiseList(selected.value));
                  }}
                  menuPosition="fixed"
                />
                {touched.accesslevel && errors.accesslevel && (
                  <div className="invalid-feedback d-block">
                    {errors.accesslevel}
                  </div>
                )}
              </Form.Group>

              {/* Person In Charge */}
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Person In Charge <span className="text-danger">*</span>
                </Form.Label>

                <Select
                  //  theme={(theme) => ({
                  //     ...theme,
                  //     colors: {
                  //       ...theme.colors,
                  //       primary25: "var(--primary-bg-color)",
                  //       primary: "var(--primary-bg-color)",
                  //     },
                  //   })}
                  name="personincharge"
                  classNamePrefix="custom-select"
                  styles={getSelectStyles("personincharge")}
                  value={
                    userOptions.find(
                      (opt) => opt.value === values.personincharge,
                    ) || null
                  }
                  options={userOptions}
                  placeholder={
                    values.accesslevel
                      ? "Select Person In Charge"
                      : "Select access level first"
                  }
                  isDisabled={!values.accesslevel}
                  onChange={(selected) =>
                    setFieldValue("personincharge", selected.value)
                  }
                  menuPosition="fixed"
                />

                {touched.personincharge && errors.personincharge && (
                  <div className="invalid-feedback d-block">
                    {errors.personincharge}
                  </div>
                )}

                <Form.Control.Feedback type="invalid">
                  {errors.personincharge}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Reserved Seats */}
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Reserved Seats <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="reservedseats"
                  placeholder="Enter the no. of reserved seats"
                  value={values.reservedseats}
                  onChange={handleChange}
                  isInvalid={touched.reservedseats && errors.reservedseats}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.reservedseats}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Allowed Users */}
              <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>
                  Allowed Users <span className="text-danger">*</span>
                </Form.Label>
                <Select
                  isMulti
                  name="allowedusers"
                  classNamePrefix="custom-select"
                  options={studentOptions}
                  value={values.allowedusers}
                  styles={getSelectStyles("allowedusers")}
                  onBlur={() => formik.setFieldTouched("allowedusers", true)}
                  //  theme={(theme) => ({
                  //     ...theme,
                  //     colors: {
                  //       ...theme.colors,
                  //       primary25: "var(--primary-bg-color)",
                  //       primary: "var(--primary-bg-color)",
                  //     },
                  //   })}
                  menuPosition="fixed"
                  placeholder="Select Allowed Users"
                  onChange={(selectedList) => {
                    const reserved = Number(values.reservedseats || 0);

                    if (selectedList.length > reserved) {
                      toast.error(
                        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
                          You can select only {reserved} users!
                        </p>,
                        {
                          position: toast.POSITION.TOP_RIGHT,
                          hideProgressBar: false,
                          theme: "colored",
                        },
                      );
                      return;
                    }

                    setFieldValue("allowedusers", selectedList);
                  }}
                />

                {touched.allowedusers && errors.allowedusers && (
                  <div className="invalid-feedback d-block">
                    {errors.allowedusers}
                  </div>
                )}

                <Form.Control.Feedback type="invalid">
                  {errors.allowedusers}
                </Form.Control.Feedback>
              </Form.Group>

                <Form.Group as={Col} md="6" className="mb-3">
                <Form.Label>Lab Image</Form.Label>
                <FileUploader
                  folderpath={labImagePath}
                  ismulti={ismulti}
                  name="labimage"
                  acceptedFileTypes={["image/png", "image/jpeg"]}
                  handleUpload={handleUpload}
                  fetchfiles={memoizedFetchImageFiles}
                />
                {values.labimage && (
                  <div className="picture avatar-lg online text-center mt-2">
                    <div className="pointer overflow-hidden">
                      <img
                        alt="Lab Preview"
                        src={`${process.env.API_URL_FILEMANAGER}${values.labimage}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = dummy_network.src;
                        }}
                        style={{
                          objectFit: "cover",
                          width: "100px",
                          height: "100px",
                          borderRadius: "10px",
                        }}
                      />
                    </div>
                  </div>
                )}
              </Form.Group>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            {oneClick ? (
              <Button disabled>
                <Spinner animation="grow" size="sm" /> Loading...
              </Button>
            ) : (
              <Button type="submit" variant="primary">
                {rowValues && rowValues.lab_id ? "Update" : "Save"}
              </Button>
            )}

            <Button variant="secondary" onClick={() => handleFormModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Fragment>
  );
};

export default LabsAdd;




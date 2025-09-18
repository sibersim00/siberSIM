import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo.js";
import { toast, ToastContainer } from "react-toastify";
import { Modal, Button } from "react-bootstrap";
import * as yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import "../../../shared/utils/i18n.js";
import { AgGridReact } from "ag-grid-react";
import {
  addparticipant,
  addeventlearner,
  getparticipantList,
  deleteLearnerFromEvent,
  clearDeleteLearnerFromEvent,
} from "../../../shared/redux/slices/event/eventsManage.js";
import ActionButtonRenderer from "../masterButtons/action-button.js";
import AddParticipantModal from "../../../shared/data/events/addParticipantModal.js";
import {
  phoneRegExp,
  emailRegExp,
  passwordRegExp,
  emojiRegex,
} from "../../utils/regex.js";
const ListParticipantModal = (props) => {
  const {
    openFlag,
    handlelistModal,
    handleOneClick,
    selectedEventId,
    handleFormModal,
    handleCallBack,
  } = props;

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const [quickFilter, setQuickFilter] = useState("");
  const [oneClick, setOneClick] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [formModal, setformModal] = useState(false);
  // const [selectedEventId, setSelectedEventId] = useState(null);

  const [rowData, setRowData] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    eventid: 0,
    learner_id: 0,
    firstname: "",
    lastname: "",
    email: "",
    mobile: "",
    username: "",
  });

  const { hasGetparticipantListSucc, hasDeleteLearnerEvent } = useSelector(
    (state) => {
      return {
        errorData:
          state &&
          state.scenarioManage &&
          state.scenarioManage.error &&
          state.scenarioManage.error,
        hasGetparticipantListSucc: state?.eventsManage?.getlistparticipants,
        hasDeleteLearnerEvent: state?.eventsManage?.getdeleteparticipants,
      };
    }
  );



  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase().trim();
    if (val) {
      const filtered = hasGetparticipantListSucc.filter((item) => {
        const firstname = item.firstname?.toLowerCase().includes(val);
        const lastname = item.lastname?.toLowerCase().includes(val);
        const mobile = item.mobile
          ? String(item.mobile).toLowerCase().includes(val)
          : false;
        return firstname || lastname || mobile;
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(hasGetparticipantListSucc);
    }
  };

  useEffect(() => {
    if (hasGetparticipantListSucc) {
      setFilteredData(hasGetparticipantListSucc);
    }
  }, [hasGetparticipantListSucc]);

  useEffect(() => {
    if (rowValues) {
      setIsChecked(rowValues.isactive);
      setModalTitle("Update");
    }
  }, [rowValues]);

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handlelistModal(false);
    }
  };

  useEffect(() => {
    if (hasDeleteLearnerEvent?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          Participant Removed Successfully
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getparticipantList(selectedEventId));
      dispatch(clearDeleteLearnerFromEvent());
    }
  }, [hasDeleteLearnerEvent]);

  useEffect(() => {
    dispatch(getparticipantList(selectedEventId));
  }, []);
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "",
      cellRenderer: "srNoRender",
      floatingFilter: false,
      filter: false,
      headerClass: "ag-header-cell",
      minWidth: 90,
      maxWidth: 90,
    },
    {
      headerName: "User Name",
      // Use valueGetter to combine firstname and lastname
      valueGetter: (params) => {
        const first = params.data?.firstname || "";
        const last = params.data?.lastname || "";
        return `${first} ${last}`.trim();
      },
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Email",
      field: "email",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Mobile",
      field: "mobile",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      pinned: "right",
      maxWidth: 150,
    },
  ];

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
  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };
  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      suppressMovable: true,
      flex: 1,
    }),
    []
  );

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstname: rowValues?.firstname || "",
      lastname: rowValues?.lastname || "",
      email: rowValues?.email || "",
      mobile: rowValues?.mobile || "",
      password: rowValues?.password || "",
      username: rowValues?.username || "",
      learner_id: [],
    },

    validationSchema: yup.lazy(() => {
      if (mode === "existing") {
        return yup.object().shape({
          firstname: yup.string().notRequired(), // optional or you can remove if you want
          lastname: yup.string().notRequired(),
          email: yup.string().notRequired(),
          mobile: yup.string().notRequired(),
          password: yup.string().notRequired(),
          username: yup.string().notRequired(),
          learner_id: yup
            .array()
            .of(
              yup.object().shape({
                learner_id: yup.string().required("User is required"),
              })
            )
            .min(1, "User is required"),
        });
      } else {
        return yup.object().shape({
          firstname: yup
            .string()
            .required("Required")
            .max(30, "First name should not exceed 30 characters")
            .matches(
              "^[A-Za-z.]+(?:[ ][A-Za-z.]+)*$",
              "Invalid - only alphabetical - no spaces are allowed"
            )
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
            ),
          lastname: yup
            .string()
            .max(30, "Last name should not exceed 30 characters")
            .matches(
              "^[A-Za-z.]+(?:[ ][A-Za-z.]+)*$",
              "Invalid - only alphabetical - no spaces are allowed"
            )
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
            ),
          email: yup
            .string()
            .required("Required")
            .matches(
              emailRegExp,
              "Invalid - invalid email format - no spaces are allowed"
            )
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
            )
            .test("no-emoji", "Emojis are not allowed", noEmojiTest),
          mobile: yup
            .string()
            .matches(phoneRegExp, "Invalid - minimum 8 digits required")
            .min(8, "Invalid - minimum 8 digits required")
            .max(10, "Invalid - maximum 10 digits required"),
          username: yup
            .string()
            .required("Required")
            .matches(
              /^(?=.*[a-zA-Z])[a-zA-Z0-9 ]+$/,
              "Invalid - only letters, numbers, and spaces are allowed (must contain at least one letter)"
            )
            .max(30, "Username should not exceed 30 characters")
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => value === undefined || (value === value.trim())
            ),

          password:
            rowValues === undefined
              ? yup
                .string()
                .required("Invalid Password. Please check info")
                .min(8, "Password must be at least 8 characters")
                .max(20, "Password should not exceed 20 characters")
                .matches(passwordRegExp, "Please follow the password rules")
              : yup.string(),
          learner_id: yup.array().notRequired(),
        });
      }
    }),
  });
  const handleDelete = (data, flag) => {
   
    if (flag) {
      const payload = {
        eventlearnerid: data?.eventlearnerid, // Wrap in object with key
      };

      dispatch(deleteLearnerFromEvent(payload));
    }
  };
  const handleEdit = (props) => {
   
    handleCallBack(props);
    handleOneClick(false);
    setRowValues({
      title: "Update",
      eventid: "",
      learner_id: props.learner_id,
      firstname: props.firstname,
      lastname: props.lastname,
      email: props.email,
      mobile: props.mobile,
      username: props.username,
      team_name: props.team_name,
      team_description: props.team_description,
    });
    console.log("rowDaltarowDaltarowDalta here we are", {
      title: "Update",
      eventid: "",
      learner_id: props.learner_id,
      firstname: props.firstname,
      lastname: props.lastname,
      email: props.email,
      mobile: props.mobile,
      username: props.username,
      team_name: props.team_name,
      team_description: props.team_description,
    });

    handlelistModal(false);
    // setTimeout(() => {
    //   handleFormModal(true);
    // }, 0);
  };

  const frameworkComponents = {
    srNoRender: (props) => props.node.rowIndex + 1,
    actionButtonRenderer: (props) => (
      <ActionButtonRenderer
        addparticipants={handleFormModal}
        propsVal={props}
        handleEdit={handleEdit}
        handleShowEdit={true}
        handleDelete={handleDelete}
      />
    ),
  };
  return (
    <>
      <Modal show={openFlag} size="lg" backdrop="static">
        <Modal.Header
          closeButton
          onClick={() => {
            viewDemoShow(false);
          }}
        >
          <Modal.Title>Participants List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            className="form-control mb-3"
            value={quickFilter}
            placeholder="Search..."
            type="text"
            onChange={(e) => onFilterChanged(e.target.value)}
          />
          <div
            className="ag-theme-alpine"
            style={{ height: "400px", width: "100%" }}
          >
            <AgGridReact
              id="modal_ag_grid"
              className="ag-theme-alpine"
              headerHeight={35}
              rowHeight={40}
              rowData={filteredData}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              onGridReady={onGridReady}
              components={frameworkComponents}
              defaultColDef={defaultColDef}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              viewDemoShow(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default ListParticipantModal;

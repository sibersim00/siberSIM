import React, { useState, Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Button, Row, Col, Form,Spinner,OverlayTrigger,Tooltip } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import Select from "react-select";
import {
  addMenusDetails,
  getParentList
} from "../../../redux/slices/admin/Menus"; 


const FormMenus = (props) => {
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderWidth: 1,
      borderRadius: 3,
      boxShadow: state.isFocused ? 0 : 0,
      borderColor: state.isFocused ? base.borderColor : "#e8e8f7",
      "&:hover": {
        borderColor: state.isFocused ? base.borderColor : "#e8e8f7",
      },
    }),
  };

  const { openFlag, handleFormModal, rowValues,oneClick,handleOneClick,subtitle  } = props;
  const dispatch = useDispatch();
  const [stateId, setStateId] = useState({});
  const [stateData, setStateData] = useState([]);
  const [modalTitle, setModalTitle] = useState("Add");
  const [isChecked, setIsChecked] = useState(false);
  let [options, setOptions] = useState([
    { value: "Menu", label: "Menu" },
    { value: "Tab Menu", label: "Tab Menu" },
    { value: "Nav Menu", label: "Nav Menu" },
    { value: "Tree Menu", label: "Tree Menu" },
  ]);
  const handleToggle = () => {
    setIsChecked(!isChecked);
  };

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handleFormModal(false);
      // setMltSltRoleList([]);
    }
  };

  const { getParentListData} = useSelector((state) => {
    return {
      getParentListData:
        state &&
        state.menus &&
        state.menus.getParentListData &&
        state.menus.getParentListData.data,
    };
  });
  
  

  const schema = yup.object().shape({
    menuname: yup.string().required("Required"),
    displaymenuname: yup.string().required("Required"),
    singularmenuname: yup.string().required("Required"),
    orderno: yup.string().required("Required"),
  });

  useEffect(() => {
    if (rowValues) {
      setIsChecked(rowValues.isactive);
      setModalTitle(rowValues.title);
    }
  }, [rowValues]);

  useEffect(() => {
    dispatch(getParentList());
    return () => {};
  }, []);

  useEffect(() => {
    let obj = "";
    if (rowValues?.parentmenuname) {
      getParentListData && getParentListData.length > 0 && getParentListData.forEach((key) => {
        if (key.menuname == rowValues?.parentmenuname) {
          obj = key;
        }
      });
    }
    setStateId(obj);
    if(obj?.menuname == "Tab Menu" || obj?.menuname == "Nav Menu"){
      setOptions([
        { value: "Menu", label: "Menu" }])
    }
    
  }, [rowValues?.parentmenuname]);


  useEffect(() => {
    if (getParentListData) {
      setStateData(getParentListData);
    }
  }, [getParentListData]);

  let initialValues = {
    menuname: rowValues?.menuname,
    displaymenuname: rowValues?.displaymenuname,
    singularmenuname: rowValues?.singularmenuname,
    icon: rowValues?.icon,
    path: rowValues?.path,
    source: rowValues?.source,
    type: rowValues?.type,
    orderno:rowValues?.orderno,
    parentmenuname: rowValues?.parentmenuname && getParentListData && getParentListData.length > 0 &&
      getParentListData.find((obj) => obj.menuid === rowValues.parentmenuid),
  };
  

  const handleSubmit = (data) => {
      const payload = {
        menuid : rowValues?.menuid,
        menuname: data?.menuname,
        displaymenuname:data?.displaymenuname,
        singularmenuname:data?.singularmenuname,
        icon: data?.icon,
        menupath: data?.path,
        source: data?.source,
        menutype: data?.type,
        parentmenuid: data?.parentmenuname == "" || data?.parentmenuname == null ? 0 : data?.parentmenuname?.menuid,
        orderno: data?.orderno,
        status: isChecked ? 'true' : 'false',
      };
      handleOneClick(true);
      dispatch(addMenusDetails(payload));
  }

  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static" size="lg">
        <Formik
          validationSchema={schema}
          onSubmit={(e) => handleSubmit(e)}
          initialValues={initialValues}
        >
          {({
            handleSubmit,
            handleChange,
            setFieldValue,
            values,
            touched,
            errors,
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Header
                closeButton
                onClick={() => {
                  viewDemoShow(false);
                }}
              >
                <Modal.Title>{modalTitle} {subtitle}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row>
                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik102"
                    className="mb-3"
                  >
                    <Form.Label>{subtitle} Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="menuname"
                      autoComplete="off"
                      value={values.menuname}
                      onChange={handleChange}
                      placeholder={`Enter ${subtitle} Name`}
                      isValid={touched.menuname && !errors.menuname}
                      isInvalid={touched.menuname && errors.menuname}
                    />

                    <Form.Control.Feedback type="invalid">
                      {errors.menuname}
                    </Form.Control.Feedback>
                  </Form.Group>

                  
                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik102"
                    className="mb-3"
                  >
                    <Form.Label>Icon</Form.Label>
                    <Form.Control
                      type="text"
                      name="icon"
                      autoComplete="off"
                      value={values.icon}
                      onChange={handleChange}
                      placeholder="Enter Icon"
                    />
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik102"
                    className="mb-3"
                  >
                    <Form.Label>Title {subtitle} Name <span className="text-danger">* </span><span className="text-info">(Plural)</span> <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip >It is used to display {subtitle} name in tree, show {subtitle} title in component etc.</Tooltip>}
                    >
                      <span className="pull-right mg-r-10 tx-16 text-secondary">
                        <i className="fe fe-info"></i>
                      </span>
                    </OverlayTrigger></Form.Label>
                    <Form.Control
                      type="text"
                      name="displaymenuname"
                      autoComplete="off"
                      value={values.displaymenuname}
                      onChange={handleChange}
                      placeholder={`Enter Title ${subtitle} Name`}
                      isValid={touched.displaymenuname && !errors.displaymenuname}
                      isInvalid={touched.displaymenuname && errors.displaymenuname}
                    />

                    <Form.Control.Feedback type="invalid">
                      {errors.displaymenuname}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik102"
                    className="mb-3"
                  >
                    <Form.Label>Form/Column {subtitle} Name <span className="text-danger">* </span><span className="text-info">(Singular)</span><OverlayTrigger
                      placement="top"
                      overlay={<Tooltip >It is used to display  in forms, columns, error message etc..</Tooltip>}
                    >
                      <span className="pull-right mg-r-10 tx-16 text-secondary">
                        <i className="fe fe-info"></i>
                      </span>
                    </OverlayTrigger></Form.Label>
                    <Form.Control
                      type="text"
                      name="singularmenuname"
                      autoComplete="off"
                      value={values.singularmenuname}
                      onChange={handleChange}
                      placeholder={`Enter Form/Column ${subtitle} Name`}
                      isValid={touched.singularmenuname && !errors.singularmenuname}
                      isInvalid={touched.singularmenuname && errors.singularmenuname}
                    />

                    <Form.Control.Feedback type="invalid">
                      {errors.singularmenuname}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik103"
                    className="mb-3"
                  >
                    <Form.Label>Parent {subtitle}</Form.Label>
                    <Select
                      styles={selectStyles}
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary25: "var(--primary-bg-color)",
                          primary: "var(--primary-bg-color)",
                        },
                      })}
                      name="parentmenuname"
                      placeholder="Select"
                      value={(values.parentmenuname = stateId ? stateId : values.parentmenuname)}
                      options={stateData}
                      getOptionLabel={(x) => x.menuname}
                      getOptionValue={(x) => x.menuid}
                      onChange={(e) => {
                        
                        setFieldValue("stateId", e);
                        setStateId(e);
                        if(e?.menuname=="Tab Menu"||e?.menuname=="Nav Menu"){
                          setOptions([{ value: "Menu", label: "Menu" }]);
                          setFieldValue("type", "Menu");
                        }else{
                          setOptions([
                            { value: "Menu", label: "Menu" },
                            { value: "Tab Menu", label: "Tab Menu" },
                            { value: "Nav Menu", label: "Nav Menu" },
                            { value: "Tree Menu", label: "Tree Menu" },
                          ])
                        }
                        
                      }}
                    />
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik102"
                    className=" mb-3"
                  >
                    <Form.Label>{subtitle} Type</Form.Label>
                    <Select
                      styles={selectStyles}
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary25: "var(--primary-bg-color)",
                          primary: "var(--primary-bg-color)",
                        },
                      })}
                      name="type"
                      placeholder="Select Menu Type"
                      options={options}
                      value={options.find(
                        (option) => option.value === values.type
                      )}
                      onChange={(e) => handleChange("type")(e.value)}
                    />
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik102"
                    className="mb-3"
                  >
                    <Form.Label>{subtitle} Route</Form.Label>
                    <Form.Control
                      type="text"
                      name="path"
                      autoComplete="off"
                      value={values.path}
                      onChange={handleChange}
                      placeholder={`Enter ${subtitle} Route`}
                    />
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    md="6"
                    controlid="validationFormik102"
                    className="mb-3"
                  >
                    <Form.Label>Display Route</Form.Label>
                    <Form.Control
                      type="text"
                      name="source"
                      autoComplete="off"
                      value={values.source}
                      onChange={handleChange}
                      placeholder="Enter Display Route"
                    />
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    md="3"
                    controlid="validationFormik102"
                    className="mb-3"
                  >
                    <Form.Label>Order No. <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="orderno"
                      autoComplete="off"
                      value={values.orderno}
                      onChange={handleChange}
                      placeholder="Enter Order Number"
                      isValid={touched.orderno && !errors.orderno}
                      isInvalid={touched.orderno && errors.orderno}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.orderno}
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group
                    as={Col}
                    md="3"
                    controlid="validationFormik102"
                    className="mb-0"
                  >
                    <div className="form-group ">
                      <Form.Label>Status</Form.Label>
                      <label className="custom-switch">
                        <input
                          type="checkbox"
                          name="custom-switch-checkbox1"
                          className="custom-switch-input"
                          // defaultChecked
                          checked={isChecked}
                          onChange={handleToggle}
                        />
                        <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                      </label>
                    </div>
                  </Form.Group>

                </Row>
              </Modal.Body>
              <Modal.Footer>
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
                  ) 
                  : (
                <Button variant="primary" type="submit">
                {modalTitle === "Add" ? "Submit" : "Update"}
                </Button>)}
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
          )}
        </Formik>
      </Modal>
    </Fragment>
  );
};

export default FormMenus;

import React, { useState, useEffect, useMemo,useRef,useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import Select from "react-select";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import {
  clearHasError,
  getRoleList,
  getOrgUserList,
  getAddList,
  getShowRight,
  clearDeleteUserRole,
  deleteUserRoleData,
  clearGetAddList,
} from "../../../shared/redux/slices/admin/UserRoleMapping";
import { useFormik } from "formik";
import * as yup from "yup";
import { getComponentDetails } from "../../../shared/redux/slices/localstorage/LocalStorage";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const UserRoleMapping = () => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [subtitle, setSubTitle] = useState('');
  const [userData, setUserData] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [buttonName, setButtonName] = useState("Add");
  const [rowData, SetRowData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showData, setshowData] = useState();

 const [pageSize, setPageSize] = useState(20);
    const gridRef = useRef(null);
     const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  const [oneClick, setOneClick] = useState(false);
  const {
    errorData,
    getRoleListData,
    getOrgUserListData,
    resAddListData,
    getShowRightData,
    getdeleteUserRole,
    componentData
  } = useSelector((state) => {
    return {
      getRoleListData:
        state &&
        state.userRoleMapping &&
        state.userRoleMapping.getRoleListData &&
        state.userRoleMapping.getRoleListData.data,

      getOrgUserListData:
        state &&
        state.userRoleMapping &&
        state.userRoleMapping.getOrgUserListData &&
        state.userRoleMapping.getOrgUserListData.data,

      resAddListData:
        state && state.userRoleMapping && state.userRoleMapping.getAddListData,

      getShowRightData:
        state &&
        state.userRoleMapping &&
        state.userRoleMapping.getShowRightData &&
        state.userRoleMapping.getShowRightData.data,

      getdeleteUserRole:
        state &&
        state.userRoleMapping &&
        state.userRoleMapping.getdeleteUserRole,

      componentData:
        state && state.localData && state.localData.componentData,

      errorData: state && state.userRoleMapping && state.userRoleMapping.error,  
    };
  });

  useEffect(() => {
    if(componentData){
      setTitle(componentData?.title ? componentData.title : "");
      setSubTitle(componentData?.subtitle ? componentData.subtitle : componentData?.title ? componentData.title : "");
    }
  }, [componentData]);

  useEffect(() => {
    dispatch(getComponentDetails("/userrolepermission"))
    dispatch(getOrgUserList());
    return () => {};
  }, []);

  const columnDefs = [
    {
      headerName: "Role Name",
      field: "rolename",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Action",
      sortable: true,
      cellRenderer: "actionButtonRenderer",
    },
  ];

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  useEffect(() => {
    if (getOrgUserListData) {
      setUserData(getOrgUserListData);
    }
  }, [getOrgUserListData]);

  useEffect(() => {
    dispatch(getRoleList());
    return () => {};
  }, []);

  useEffect(() => {
    if (getRoleListData) {
      setRoleData(getRoleListData);
    }
  }, [getRoleListData]);

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
          handleOneClick(false)
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    if (buttonName !== "Add") {
      SetRowData(getShowRightData);
    }
  }, [getShowRightData]);

 const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };

const onGridReady = useCallback((params) => {
  gridRef.current = params.api;

  // Set correct height on first load as well
  const initialPageSize = params.api.paginationGetPageSize();
  const totalRows = params.api.getDisplayedRowCount();
  const effectiveRows = Math.min(initialPageSize, totalRows);
  setPageSize(effectiveRows);
}, []);
  
    // Fires when page size changes via the built-in dropdown
   const onPaginationChanged = useCallback((params) => {
  if (params.api) {
    const newPageSize = params.api.paginationGetPageSize();
    const totalRows = params.api.getDisplayedRowCount(); // ✅ actual rows in data

    // Use whichever is smaller — actual rows vs page size
    const effectiveRows = Math.min(newPageSize, totalRows);
    setPageSize(effectiveRows);
  }
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
    };
  }, []);

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

  const handleClear = () => {
    validation.resetForm();
    validation.setFieldValue("userlist", "");
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      userlist: "",
      rolelist: "",
      isActive: true,
    },

    validationSchema: yup.object().shape({
      userlist: yup.object().required("Required"),
    }),

    onSubmit: (data) => {
      if (buttonName === "Add") {
        const payload = {
          userid: data.userlist.userid,
          roleid: data.rolelist.roleid.toString(),
          status: data.status,
        };
        handleOneClick(true);
        dispatch(getAddList(payload));
        Refresh();
      } else {
        const payload = {
          userid: data.userlist.userid,
        };
        dispatch(getShowRight(payload));
        setshowData(payload);
      }
    },
  });

  useEffect(() => {
    if (getdeleteUserRole?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {getdeleteUserRole?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      // Swal.fire("Deleted!", "Your imaginary file has been deleted.", "success");
      dispatch(getShowRight(showData));
      dispatch(clearDeleteUserRole());
    }
  }, [getdeleteUserRole]);

  const handleDelete = (props, flag) => {
    if (flag === true) {
      dispatch(deleteUserRoleData(props?.userrolemapid));
    }
  };

  const frameworkComponents = {
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer propsVal={props} handleDelete={handleDelete} />
      );
    },
  };

  const Refresh = () => {
    SetRowData([]);
    setButtonName("");
    handleClear();
    setRefreshKey((prevKey) => prevKey + 1);
  };

  useEffect(() => {
    if (resAddListData?.statusCode && resAddListData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {resAddListData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      handleOneClick(false);
      dispatch(clearGetAddList());
    }
  }, [resAddListData]);

  return (
    <>
      <Seo title={title} />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <div>
                {" "}
                <h5>{title}</h5>
              </div>
              <Row>
                <Col md={12}>
                  <Form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                  >
                    <Row>
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik103"
                        className="mb-3"
                      >
                        <Form.Label>
                          SIMUser <span className="text-danger">*</span>
                        </Form.Label>
                        <Select
                          key={refreshKey}
                          styles={selectStyles}
                          theme={(theme) => ({
                            ...theme,
                            colors: {
                              ...theme.colors,
                              primary25: "var(--primary-bg-color)",
                              primary: "var(--primary-bg-color)",
                            },
                          })}
                          className={
                            validation.touched.userlist &&
                            validation.errors.userlist
                              ? "red-field is-invalid"
                              : ""
                          }
                          name="userlist"
                          placeholder="Select"
                          values={validation?.values?.userlist}
                          options={userData}
                          getOptionLabel={(x) => x.name}
                          getOptionValue={(x) => x.userid}
                          onChange={(e) => {
                            validation.setFieldValue("userlist", e);
                            SetRowData([]);
                            //   setStateId(e);
                          }}
                        />
                        {validation.errors.userlist &&
                          validation.touched.userlist && (
                            <div className="invalid-tooltiped">
                              {validation.errors.userlist}
                            </div>
                          )}
                      </Form.Group>
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik103"
                        className="mb-3"
                      >
                        <Form.Label>Role</Form.Label>
                        <Select
                          key={refreshKey}
                          styles={selectStyles}
                          theme={(theme) => ({
                            ...theme,
                            colors: {
                              ...theme.colors,
                              primary25: "var(--primary-bg-color)",
                              primary: "var(--primary-bg-color)",
                            },
                          })}
                          name="rolelist"
                          placeholder="Select"
                          values={validation.values.rolelist}
                          options={roleData}
                          getOptionLabel={(x) => x.rolename}
                          getOptionValue={(x) => x.roleid}
                          onChange={(e) => {
                            validation.setFieldValue("rolelist", e);
                            //   setStateId(e);
                          }}
                        />
                      </Form.Group>

                      <div className="col-md-4 mt-3 d-flex jusify-content-end align-items-center">
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
                          <Button
                            variant="primary"
                            type="submit"
                            className="mg-5 "
                            onClick={() => setButtonName("Add")}
                          >
                            <i className="fa fa-plus"></i> Add
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          type="submit"
                          onClick={() => setButtonName("Show Right")}
                        >
                          Show Right
                        </Button>
                        <Button
                          variant="danger"
                          className="mx-1"
                          onClick={() => Refresh()}
                        >
                          <i className="fa fa-refresh "></i>
                        </Button>
                      </div>
                    </Row>
                  </Form>
                </Col>

                <Col md={12}>
                  <div
  className="ag-theme-alpine mt-2"
                       style={{
                          height: `${gridHeight}px`, //  dynamic, grows with page size
                          width: "100%",
                          overflow: "visible",        // no internal scrollbar
                        }}
                  >
                    <AgGridReact
                      id="staff_grid"
                      headerHeight={35}
                      rowHeight={40}
                      gridOptions={gridOptions}
                      rowData={rowData}
                      columnDefs={columnDefs}
                      paginationPageSize={20}
                      pagination={true}
                      onGridReady={onGridReady}
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
                       onPaginationChanged={onPaginationChanged} //  track page size changes
                    ></AgGridReact>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

UserRoleMapping.layout = "Contentlayout";
export default UserRoleMapping;

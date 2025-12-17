import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  clearHasError,
  getListOfRole,
  clearaddRoleData,
  editStatusRoleData,
  cleareditStatusRoleData,
  getViewRoleMenusData,
  clearStoreRoleMenus
} from "../../../shared/redux/slices/admin/Roles";
import { Row, Col, Card, Button } from "react-bootstrap";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import Swal from "sweetalert2";
import FormRole from "../../../shared/data/admin/modals/role";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as XLSX from "xlsx";
import Treeviewoffcanvas from "../../../shared/data/admin/modals/treeviewoffcanvas";
import { getComponentDetails } from "../../../shared/redux/slices/localstorage/LocalStorage";
import { getLocalStorageData } from "../../../shared/redux/slices/localstorage/LocalStorage";

const Roles = () => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [subtitle, setSubTitle] = useState('');
  const [compStatus, setCompStatus] = useState("true");
  const [quickFilter, setQuickFilter] = useState("");
  const [rowData, setRowData] = useState([]);
  const [formModal, setformModal] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    roleid: 0,
    rolename: "",
    description: "",
    displayname: "",
    default_role: "",
    isactive: true,
  });
  const [oneClick, setOneClick] = useState(false);
  const [treeOffcanvas, setTreeOffcanvas] = useState(false)
  const [loaderForTreeView, setLoaderForTreeView] = useState(false)
  const {
    listRoleData,
    addRoleData,
    editStatusRoleResData,
    storeRoleMenusData,
    componentData,
    getUserDataFromLocal,
    errorData,
  } = useSelector((state) => {
    return {
      listRoleData:
        state &&
        state.roles &&
        state.roles.getRoleData &&
        state.roles.getRoleData.data,

      addRoleData: state && state.roles && state.roles.addRoleData,

      editStatusRoleResData:
        state && state.roles && state.roles.editStatusRoleData,

      storeRoleMenusData:
        state && state.roles && state.roles.storeRoleMenusData,

      componentData:
        state && state.localData && state.localData.componentData,

           getUserDataFromLocal:
          state &&
          state.localData &&
          state.localData.getLocalData,

      errorData: state && state.roles && state.roles.error,
    };
  });

  useEffect(() => {
    dispatch(getListOfRole());
    dispatch(getComponentDetails("/roles"))
    return () => { };
  }, []);

   useEffect(() => {
      if (typeof window !== "undefined") {
        dispatch(getLocalStorageData("selectedmenu"));
        dispatch(getLocalStorageData("user"));
      }
    }, []);

  console.log("listRoleDatalistRoleData", listRoleData)
  useEffect(() => {
    if (componentData) {
      setTitle(componentData?.title ? componentData.title : "");
      setSubTitle(componentData?.subtitle ? componentData.subtitle : componentData?.title ? componentData.title : "");
    }
  }, [componentData]);

   // Determine if user is superadmin
  const isSuperAdmin = getUserDataFromLocal?.loginid === "superadmin";

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      floatingFilter: true,
      maxWidth: 80,
    },
    // {
    //   headerName: "Role Id",
    //   field: "roleid",
    //   filter: true,
    //   floatingFilter: true,
    // },
    {
      headerName: "Role Name",
      field: "rolename",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Role Description",
      field: "description",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Display Name",
      field: "displayname",
      filter: true,
      floatingFilter: true,
    },
   // Show Status column only for superadmin
    ...(isSuperAdmin
      ? [
          {
            headerName: "Status",
            field: "status",
            cellRenderer: "actionSwitchRenderer",
            pinned: "right",
            width: 80,
          },
        ]
      : []),
    {
      headerName: "Action",
      field: "isactive",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      pinned: "right",
      width: 100,
    },
  ];

  const handleTreeViewOffcanvas = () => {
    setTreeOffcanvas(!treeOffcanvas)
  }

  const handleLoaderForTreeViewOffcanvas = (flag) => {
    setLoaderForTreeView(flag)
  }

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  //Function to Download Excel file
  const handleExport = () => {
    const exportData = listRoleData.map((row) => [
      row.roleid,
      row.rolename,
      row.description,
      row.displayname,
      row.status,
    ]);

    const header = [
      "Id",
      "Role Name",
      "Role Description",
      "Display Name",
      "Status",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
    XLSX.writeFile(workbook, "Roles_data.xlsx");
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };

    // Role filtering logic (superadmin = all, others = default_role = "Yes")
  useEffect(() => {
    if (listRoleData && getUserDataFromLocal) {
       const isSuperAdmin = getUserDataFromLocal?.loginid === "superadmin";

      const visibleRoles = isSuperAdmin
        ? listRoleData
        : listRoleData.filter((role) => role?.default_role === "Yes");

      let finalData = visibleRoles;
      if (compStatus === "") {
        finalData = visibleRoles;
      } else if (compStatus === "true") {
        finalData = visibleRoles.filter(
          (data) => data?.status?.toString() === "true"
        );
      } else if (compStatus === "false") {
        finalData = visibleRoles.filter(
          (data) => data?.status?.toString() === "false"
        );
      }

      setRowData(finalData);
    }
  }, [listRoleData, compStatus, getUserDataFromLocal]);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

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
      handleLoaderForTreeViewOffcanvas(false)
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    if (addRoleData?.statusCode) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addRoleData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfRole());
      dispatch(clearaddRoleData());
    }
  }, [addRoleData]);


  useEffect(() => {
    if (editStatusRoleResData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusRoleResData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      setCompStatus("");
      dispatch(getListOfRole());
      dispatch(cleareditStatusRoleData());
    }
  }, [editStatusRoleResData]);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);

  const handleEdit = (props) => {
    if (props && props.roleid) {
      setRowValues({
        title: "Edit",
        roleid: props.roleid,
        rolename: props.rolename,
        description: props.description,
        displayname: props.displayname,
        default_role:props.default_role,
        isactive: JSON.parse(props.status),
      });
      setOneClick(false);
      setformModal(true);
    }
  };

  const handleBranch = (props) => {
    if (props && props.roleid) {
      setRowValues({
        title: "Edit",
        roleid: props.roleid,
        rolename: props.rolename,
        description: props.description,
        displayname: props.displayname,
        isactive: props.status,
      });
      handleTreeViewOffcanvas()
    }
    let payload = { "roleid": props?.roleid }
    dispatch(getViewRoleMenusData(payload))
  };

  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to change the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          status: data.status == "true" ? 'false' : "true",
        };
        const Id = data?.roleid;
        dispatch(editStatusRoleData(payload, Id));
      }
    });
  };

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEdit={handleEdit}
          handleBranch={handleBranch}
          propsVal={props}
          handleShowEdit={true}
        />
      );
    },

    actionSwitchRenderer: function (props) {
      if (props?.data?.default_role === "Yes") {
        return null; // returning null = no button rendered
      }

      return (
        <ToggleButton
          data={props?.data}
          handleStatusSwitch={handleStatusSwitch}
        />
      );
    },
  };

  const handleFormModal = (flag) => {
    setRowValues({
      title: "Add",
      roleid: 0,
      rolename: "",
      description: "",
      displayname: "",
      isactive: true,
    });
    setformModal(flag);
    setOneClick(false);
  };

  return (
    <>
      <Seo title={title} />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center ">
                  <h5>{title}</h5>
                  <div className="d-flex align-items-center">
                    <ToggleButtonGroup
                      color="success"
                      value={compStatus}
                      size="small"
                      exclusive
                      onChange={(e) => {
                        setCompStatus(e.target.value),
                          dispatch(
                            getListOfRole({ isactive: e.target.value })
                          );
                      }}
                      aria-label="Platform"
                    >
                      <CustomToggleButton value="">All</CustomToggleButton>
                      <CustomToggleButton value="true" defaultChecked>
                        Active
                      </CustomToggleButton>
                      <CustomToggleButton value="false">Inactive</CustomToggleButton>
                    </ToggleButtonGroup>
                    &nbsp;&nbsp;

                    <Button type="button" variant="outline-info" onClick={() => handleExport()}>
                      <i className="fa fa-file-excel-o"></i> Export
                    </Button>&nbsp;
                

                       {/* Show Add button only for superadmin */}
                    {isSuperAdmin && (
                      <Button
                        type="button"
                        variant="outline-primary"
                        onClick={() => handleFormModal(true)}
                      >
                        <i className="fa fa-plus"></i> Add
                      </Button>
                    )}&nbsp;
                    <input className="form-control bd bd-2 ms-2 w-auto" value={quickFilter} placeholder="Search..." type="text" onChange={(e) => onFilterChanged(e.target.value)} />
                  </div>
                </div>
              </Col>

              <Col md={12}>
                <div
                  className="ag-theme-alpine mt-2"
                  style={{ height: "38em", width: "100%" }}
                >
                  <AgGridReact
                    id="staff_grid"
                    headerHeight={35}
                    rowHeight={40}
                    gridOptions={gridOptions}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    onGridReady={onGridReady}
                    frameworkComponents={frameworkComponents}
                    defaultColDef={defaultColDef}
                  ></AgGridReact>
                </div>
              </Col>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {formModal && (
        <FormRole
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
        />
      )}
      <Treeviewoffcanvas
        treeOffcanvas={treeOffcanvas}
        handleTreeViewOffcanvas={handleTreeViewOffcanvas}
        rowValues={rowValues}
        handleLoaderForTreeViewOffcanvas={handleLoaderForTreeViewOffcanvas}
        loaderForTreeView={loaderForTreeView}
      />
    </>
  );
};

Roles.layout = "Contentlayout";
export default Roles;

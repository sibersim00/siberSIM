import { useRouter } from "next/router";
import React,{useState} from "react";
import {
  Button,
  Row,
  Col,
  Popover,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

const ActionButtonRenderer = (props) => {
  
  const navigate = useRouter();
  const popover = (
    <Popover id="popover-basic">
      <Popover.Body>
        <a
          href="#!"
          className="text-secondary"
          onClick={(e) => handleOnFiles(propsVal?.data, "pf")}
        >
          {" "}
          PF Form{" "}
        </a>
        <br />
        <a
          href="#!"
          className="text-secondary"
          onClick={(e) => handleOnFiles(propsVal?.data, "gf")}
        >
          {" "}
          Gratuity Form{" "}
        </a>
        <br />
        <a
          href="#!"
          className="text-secondary"
          onClick={(e) => handleOnFiles(propsVal?.data, "lic")}
        >
          {" "}
          LIC Form{" "}
        </a>
        <br />
        <a
          href="#!"
          className="text-secondary"
          onClick={(e) => handleOnFiles(propsVal?.data, "rf")} 
        >
          {" "}
          Employee Record Form{" "}
        </a>{" "}
        <br />
      </Popover.Body>
    </Popover>
  );

  const popoverDelete = (
    <Popover id="popover-basic-delete">
      <Popover.Body>
        <p className="text-center mb-1">
          Are you sure you want to
          <br /> delete this record?{" "}
        </p>
        <Row className="text-center">
          <Col
            className="pointer pd-0"
            onClick={(e) => handleOnDelete(propsVal?.data, true)}
          >
            <Button size="sm" className="wd-100p" variant="outline-success">
              Yes
            </Button>
          </Col>
          <Col onClick={(e) => handleOnDelete(propsVal?.data, false)}>
            <Button size="sm" className="wd-100p" variant="outline-danger">
              No
            </Button>
          </Col>
        </Row>
      </Popover.Body>
    </Popover>
  );

  const popoverDeleteExam = (
    <Popover id="popover-basic-delete">
      <Popover.Body>
        <p className="text-center mb-1">
          Are you sure you want to
          <br /> delete this record?{" "}
        </p>
        <Row className="text-center">
          <Col
            className="pointer pd-0"
            onClick={(e) => handleOnExamDelete(propsVal?.data, true)}
          >
            <Button size="sm" className="wd-100p" variant="outline-success">
              Yes
            </Button>
          </Col>
          <Col onClick={(e) => handleOnExamDelete(propsVal?.data, false)}>
            <Button size="sm" className="wd-100p" variant="outline-danger">
              No
            </Button>
          </Col>
        </Row>
      </Popover.Body>
    </Popover>
  );

  const popoverPublishExam = (
    <Popover id="popover-basic-delete">
      <Popover.Body>
        <p className="text-center mb-1">
        Are you sure?
          <br /> you want to publish the exam?{" "}
        </p>
        <Row className="text-center">
          <Col
            className="pointer pd-0"
            onClick={(e) => handleOnPublishExam(propsVal?.data, true)}
          >
            <Button size="sm" className="wd-100p" variant="outline-success">
              Yes
            </Button>
          </Col>
          <Col onClick={(e) => handleOnPublishExam(propsVal?.data, false)}>
            <Button size="sm" className="wd-100p" variant="outline-danger">
              No
            </Button>
          </Col>
        </Row>
      </Popover.Body>
    </Popover>
  );

  const {
    handleView,
    handleDownload,
    handleFiles,
    handleDelete,
    handleExamDelete,
    handlePublishExam,
    handleEdit,
    propsVal,
    handleShowProfile,
    handleReturnShowProfile,
    handleBranch,
    handleShowEdit,
    handleEditView,
    viewOrderRequest,
    handleShowOrderReq,
    viewPaymenResp,
    handleShowpaymentResp,
    handleShowEditView,
    handleShowToggleButton,
    handleStatusSwitch,
    handleDeleteExam,
    handleShowPublishExam,
    verifyAccount,
    handleShowVerifyAccount,
    handleShowResetPswd,
    resetPswd,
    mapInstructor,
    handleShowMapInstructort,
    assignScenario,
    handleShowAssignScenario,
    data
  } = props;
  
  const [isChecked, setIsChecked] = useState(data?.status == "Active" ? true : false);

  const handleOnEdit = (e) => {
    handleEdit(e);
  };

  const handleOnView = (e) => {
      (e);
  };

  const handleOnDownload = (e) => {
    handleDownload(e);
  };

  const handleOnFiles = (e, f) => {
    handleFiles(e, f);
  };

  const handleOnDelete = (e, flag) => {
    handleDelete(e, flag);
  };

  const handleOnExamDelete = (e, flag) => {
    handleExamDelete(e, flag);
  };
  const handleOnPublishExam = (e, flag) => {
    handlePublishExam(e, flag);
  };

  const handleOnBranch = (e) => {
    handleBranch(e);
  };

  const handleViewProfile = (e) => {
     handleReturnShowProfile(e);
  };

  const handleOnViewConf = (e) => {
    handleEditView(e);
  };
  const handleViewOrder = (e) => {
    viewOrderRequest(e);
  };
  const handleViewPayment = (e) => {
    viewPaymenResp(e);
  };

  const handleToggle = (values) => {
    handleStatusSwitch(values)
  };
  const handleVerifyAccount = (e) => {
   verifyAccount(e);
  };
  const handleResetPswd = (e) => {
    resetPswd(e);
   };
   const handleMapInstructor = (e) => {
    mapInstructor(e);
   };

   const handleAssignScenario = (e) => {
    assignScenario(e);
   }; 

  return (
    
    <div style={{ marginTop: "-3px" }}>
      {handleShowToggleButton && (
        <span>
       <label className="custom-switch">
         <input
           type="checkbox"
           name="custom-switch-checkbox1"
           className="custom-switch-input"
           // defaultChecked
           checked={isChecked}
           onClick={e => handleToggle(data)}
         />
         {/* <span className="custom-switch-indicator custom-switch-indicator-md">{isChecked ? 'ON' : 'OFF'}</span> */}
         <span className="custom-switch-indicator custom-switch-indicator-md"></span>
       </label>&nbsp;</span>
      )}
      {handleShowEdit && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Edit</Tooltip>}>
          <Button
            id="editBtnCommon"
            type="button"
            variant="outline-info"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleOnEdit(propsVal?.data)}
          >
            <i
              className="fe fe-edit-2"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Edit"
            ></i>
          </Button>
        </OverlayTrigger>
      )}
      {handleShowEditView && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>View</Tooltip>}>
          <Button
            id="editBtnCommon"
            type="button"
            variant="outline-dark"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleOnViewConf(propsVal?.data)}
          >
            <i
              className="fe fe-eye"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Edit"
            ></i>
          </Button>
        </OverlayTrigger>
      )}
      {handleShowOrderReq && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>View Order Request</Tooltip>}>
          <Button
            id="editBtnCommon"
            type="button"
            variant="outline-info"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleViewOrder(propsVal?.data)}
          >
            <i
              className="fa fa-cog"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Edit"
            ></i>
          </Button>
        </OverlayTrigger>
      )}
      {handleShowpaymentResp && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>View Payment Response</Tooltip>}>
          <Button
            id="editBtnCommon"
            type="button"
            variant="outline-dark"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleViewPayment(propsVal?.data)}
          >
            <i
              className="fe fe-eye"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Edit"
            ></i>
            
          </Button>
        </OverlayTrigger>
      )}
      {handleView && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Profile</Tooltip>}>
          <Button
            id="viewBtnCommon"
            type="button"
            variant="outline-success"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleOnView(propsVal?.data)}
          >
            <i className="ti ti-id-badge"></i>
          </Button>
        </OverlayTrigger>
      )}
      {handleDownload && (
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>Download Zip</Tooltip>}
        >
          <Button
            id="downloadBtnCommon"
            type="button"
            variant="outline-secondary"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleOnDownload(propsVal?.data)}
          >
            <i
              className="fa fa-file-zip-o"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Download"
            ></i>
          </Button>
        </OverlayTrigger>
      )}
      {handleFiles && (
         <OverlayTrigger
         placement="bottom"
         overlay={<Tooltip>Download File</Tooltip>}
       >
         <Button
           id="downloadBtnCommon"
           type="button"
           variant="outline-secondary"
           className="mg-r-3"
           size="sm" 
           onClick={(e) => handleFiles(propsVal?.data)}
         >
           <i
             className="fe fe-download"
             data-bs-toggle="tooltip"
             title=""
             data-bs-placement="top"
             data-bs-original-title="Download"
           ></i>
         </Button>
       </OverlayTrigger>
        // <OverlayTrigger trigger="focus" placement="left"  >
        //   <Button size="sm" variant="outline-primary" className="mg-r-3">
        //     <OverlayTrigger
        //       placement="bottom"
        //       overlay={<Tooltip>Download Forms</Tooltip>}
        //     >
        //       <i className="fe fe-download"></i>
        //     </OverlayTrigger>
        //   </Button>
        // </OverlayTrigger>
      )}
      {handleDelete && (
        <OverlayTrigger
          trigger="focus"
          title="Delete"
          placement="left"
          overlay={popoverDelete}
        >
          <Button
            id="deleteBtnCommon"
            type="button"
            variant="outline-danger"
            className="mg-r-3"
            size="sm"
          >
            <i className="fe fe-trash-2"></i>
          </Button>
        </OverlayTrigger>
      )}
      {handleShowProfile && (
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>Profile View</Tooltip>}
        >
          <Button
            id="deleteBtnCommon"
            type="button"
            variant="outline-secondary"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleViewProfile(propsVal?.data)}
          >
            <i className="fe fe-user-plus"></i>
          </Button>
        </OverlayTrigger>
      )}
      {handleBranch && (
        <Button
          id="editBtnCommon"
          type="button"
          variant="outline-warning"
          className="mg-r-3"
          size="sm"
          onClick={() => handleOnBranch(propsVal?.data)}
        >
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>Branch</Tooltip>}
          >
            <i
              className="fas fa-code-branch"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Edit"
            ></i>
          </OverlayTrigger>
        </Button>
      )}

      {handleDeleteExam && (
        <OverlayTrigger
        trigger="focus"
        title="Delete"
        placement="left"
        overlay={popoverDeleteExam}
      >
        <Button
          id="deleteBtnCommon"
          type="button"
          variant="outline-danger"
          className="mg-r-3"
          size="sm"
        >
          <i className="fe fe-trash-2"></i>
        </Button>
        </OverlayTrigger>
      )}

      {handleShowPublishExam && (
        <OverlayTrigger
        trigger="focus"
        title="Publish"
        placement="left"
        overlay={popoverPublishExam}
      >
        <Button
          id="deleteBtnCommon"
          type="button"
          variant="outline-success"
          className="mg-r-3"
          size="sm"
        >
          <i
            className="fa fa-bullhorn text-success"
            data-bs-toggle="tooltip"
            title=""
            data-bs-placement="top"
            data-bs-original-title="Publish"
          ></i>
        </Button>
        </OverlayTrigger>
      )}

    {handleShowVerifyAccount && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Verify Account</Tooltip>}>
          <Button
            id="editBtnCommon"
            type="button"
            variant="outline-dark"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleVerifyAccount(propsVal?.data)}
          >
            <i
              className="fa fa-check"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Verify"
            ></i>
          </Button>
        </OverlayTrigger>
      )}

    {handleShowResetPswd && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Reset Password</Tooltip>}>
          <Button
            id="resetBtnCommon"
            type="button"
            variant="outline-secondary"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleResetPswd(propsVal?.data)}
          >
            <i
              className="fa fa-refresh"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Reset Password"
            ></i>
          </Button>
        </OverlayTrigger>
      )}

{handleShowMapInstructort && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Map SIMManager</Tooltip>}>
          <Button
            id="mapBtn"
            type="button"
            variant="outline-warning"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleMapInstructor(propsVal?.data)}
          >
            <i
              className="fa fa-map-o"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Map SIMManager"
            ></i>
          </Button>
        </OverlayTrigger>
      )}

{handleShowAssignScenario && (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Assign Scenario</Tooltip>}>
          <Button
            id="mapBtn"
            type="button"
            variant="outline-warning"
            className="mg-r-3"
            size="sm"
            onClick={(e) => handleAssignScenario(propsVal?.data)}
          >
            <i
              className="fa fa-map-o"
              data-bs-toggle="tooltip"
              title=""
              data-bs-placement="top"
              data-bs-original-title="Map SIMManager"
            ></i>
          </Button>
        </OverlayTrigger>
  )}

    </div>
  );
};

export default ActionButtonRenderer;

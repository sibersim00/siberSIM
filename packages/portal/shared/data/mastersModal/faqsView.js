import React, { Fragment, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";

const ViewForm = (props) => {
  const { openFlag, handleViewModal, rowValues } = props;

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handleViewModal(false);
    }
  };

  const getTypeBadgeColor = (type) => {
  switch ((type || "").toLowerCase()) {
    case "learner":
      return "bg-success text-white";
    case "instructor":
      return "bg-warning text-white";
    case "admin":
      return "bg-info text-white";
    default:
      return "bg-secondary text-white";
  }
};


  return (
    <>
     <Fragment>
  <Modal show={openFlag} backdrop="static" className={"modal-md"} size="lg" >
    <Modal.Header>
      <Modal.Title>
        <div className="d-flex align-items-center gap-2">
          {/* Order By badge */}
          <span className="badge bg-primary">
            {rowValues.order_by || "N/A"}
          </span>
          {/* Question text */}
          <h5 className="mb-0">{rowValues.question}</h5>
        </div>
      </Modal.Title>
      <i
        className="fas fa-close fs-18"
        style={{ cursor: "pointer" }}
        onClick={() => {
          viewDemoShow(false);
        }}
      ></i>
    </Modal.Header>
    <Modal.Body>
      <div>
        {/* Type badge above answer */}
        <div className="mb-2">
          <span className={`badge ${getTypeBadgeColor(rowValues.type)}`}>
            {rowValues.type || "N/A"}
          </span>
        </div>

        {/* Answer text */}
        {rowValues.answer ? (
          <p>{rowValues.answer}</p>
        ) : (
          <strong>No Answer Available</strong>
        )}
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
</Fragment>

    </>
  );
};

export default ViewForm;

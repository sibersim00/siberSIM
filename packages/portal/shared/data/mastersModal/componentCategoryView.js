import React, { Fragment, useEffect } from "react";
import { Modal, Button} from "react-bootstrap";  


const ViewComponentCategory = (props) => {
  const { openFlag, handleViewModal, rowValues } = props; 
 
 
  const viewDemoShow = (modal) => { if (modal === false) { handleViewModal(false); } };
 
  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static" className={'modal-md'}>
                <Modal.Header>
                  <Modal.Title> <h5>{rowValues.parentcategoryname}</h5>
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
                    {rowValues.description ? 
                        <p> {rowValues.description}</p>
                    : 
                    <strong>No Description Available</strong>
                    }
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

export default ViewComponentCategory;
  
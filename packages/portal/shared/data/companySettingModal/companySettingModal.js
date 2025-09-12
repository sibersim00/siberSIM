import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { importMastersAction } from "../../redux/slices/companySetting/companySetting";

const ImportSqlSourceFile = ({
  openImportModal,
  handleImportModal,
  showListImort,          // not used but accepted
  setShowListImport,      // not used but accepted
}) => {
  const [file, setFile] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const importStatus = useSelector(
    (state) => state.companySetting?.importResp
  );

  const handleCancel = () => {
    setFile("");
    setError("");
    if (setShowListImport) setShowListImport(true); //reset list flag if provided
    handleImportModal();
  };

  const handleImport = () => {
    if (!file) {
      setError("SQL file is required");
      return;
    }

    const formData = new FormData();
    formData.append("sqlFile", file);  // 👈 matches multer field name
    // Optional: send DB name if you want to override
    // formData.append("importDb", "testweb");

    dispatch(importMastersAction(formData));
  };

  return (
    <Modal
      show={openImportModal}
      backdrop="static"
      size="lg"
      className="overflow-auto"
      centered
    >
      <Modal.Header>
        <Modal.Title>Import SQL Source File</Modal.Title>
      </Modal.Header>
      <Form>
        <Modal.Body>
          <Row>
            <Form.Group as={Col} md="12">
              <Form.Label>Upload your SQL File</Form.Label>
              <Form.Control
                type="file"
                name="uploadfile"
                autoComplete="off"
                accept=".sql"
                onChange={(e) => {
                  const selectedFile = e.target.files[0];
                  if (selectedFile) {
                    const ext = selectedFile.name
                      .substring(selectedFile.name.lastIndexOf("."))
                      .toLowerCase();
                    if (ext === ".sql") {
                      setError("");
                      setFile(selectedFile);
                    } else {
                      setError("Please upload a valid .sql file");
                      setFile("");
                    }
                  }
                }}
              />
              {error && (
                <div className="ms-1 invalid-tooltiped">{error}</div>
              )}
            </Form.Group>
          </Row>

          {importStatus?.loading && (
            <p className="text-info">Importing... please wait</p>
          )}
          {importStatus?.success && (
            <p className="text-success">{importStatus.message}</p>
          )}
          {importStatus?.error && (
            <p className="text-danger">{importStatus.error}</p>
          )}
        </Modal.Body>
        <Row className="pb-3 text-center">
          <Col>
            <Button
              onClick={handleCancel}
              variant="outline-dark"
              className="fw-500 rounded-5 pd-x-30"
            >
              Cancel
            </Button>
            {/* &nbsp;&nbsp;
            <Button
              className="custome-button-actions-cw pd-x-30"
              onClick={handleImport}
            >
              Import
            </Button> */}
            &nbsp;&nbsp;
            {importStatus?.loading ? (
              <Button
                className="custome-button-actions-cw pd-x-30"
                disabled
              >
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />{" "}
                Importing...
              </Button>
            ) : (
              <Button
                className="custome-button-actions-cw pd-x-30"
                onClick={handleImport}
              >
                Import
              </Button>
            )}

          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

ImportSqlSourceFile.propTypes = {
  openImportModal: PropTypes.bool,
  handleImportModal: PropTypes.func,
  showListImort: PropTypes.bool,
  setShowListImport: PropTypes.func,
};

export default ImportSqlSourceFile;

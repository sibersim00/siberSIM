import React from "react";
import { Row, Col, Card, Nav, Tab } from "react-bootstrap";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";

const ModuleNotAssigned = () => {
  return (
    <Row className="row-sm">
      <Col md={12}>
        <Card className="custom-card overflow-hidden">
          <Row className="signpages ext-center" style={{ height: "70vh" }}>
            <Col md={10} className="mx-auto">
              <Card
                style={{
                  border: "none",
                  backgroundColor: "#f6f7fb",
                }}
              >
                <Card.Body>
                  <div className="text-center">
                    <img
                      src={crossEvalicon.src}
                      alt="user-img"
                      className="wd-150"
                    />
                    <h5 className="mt-4">Module Not Yet Assigned</h5>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default ModuleNotAssigned;

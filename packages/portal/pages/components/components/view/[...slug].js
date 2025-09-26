import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Table } from "react-bootstrap";
import { useRouter } from "next/router";
import {
  getSingleComponent,
  clearSingleComponent,
} from "../../../../shared/redux/slices/component/componentManage";
import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import dummy_network from "../../../../public/assets/img/dummy.jpg";

const ComponentView = () => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const [rowId, setRowId] = useState("");
  const [rowValues, setRowValues] = useState({});
  const backTo = query && query.backView;
  const { getSingleComponentSucc } = useSelector((state) => {
    return {
      getSingleComponentSucc:
        state &&
        state.componentManage &&
        state.componentManage.singleComponent &&
        state.componentManage.singleComponent.data,
    };
  });

  useEffect(() => {
    if (getSingleComponentSucc && getSingleComponentSucc !== "") {
      setRowValues(getSingleComponentSucc);
    }
  }, [getSingleComponentSucc]);

  useEffect(() => {
    if (query.slug) {
      setRowId(query.slug[0]);
      dispatch(getSingleComponent(query.slug[0]));
    }
  }, [query.slug]);
  console.log("rowValuesrowValues",rowValues)
  return (
    <>
      <Seo title="Components" />
      <Row className="view-component-row-sm">
        <Col md={12}>
          <Card className="view-component-card overflow-hidden">
            <Card.Body className="p-4">
              {/* Header Section */}
              <Row className="align-items-center mb-4">
                <Col>
                  <h4 className="view-component-card-header m-0">
                    View Component
                  </h4>
                </Col>
                <Col className="text-end">
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => {
                      push(`/components?view=${backTo || "list"}`);
                      dispatch(clearSingleComponent());
                    }}
                    className="view-component-button"
                  >
                    <i className="fe fe-arrow-left"></i>
                  </Button>
                </Col>
              </Row>
              <Row className="mb-4 g-4">
                <Col md={3}>
                  <label className="view-component-label text-dark">
                    Component Category
                  </label>
                  <div className="view-component-value">
                    {rowValues?.categoryname}
                  </div>
                </Col>
                <Col md={3}>
                  <label className="view-component-label text-dark">Type</label>
                  <div className="view-component-value">
                    {rowValues?.componenttype}
                  </div>
                </Col>
                <Col md={3}>
                  <label className="view-component-label text-dark">
                    Component VMID
                  </label>
                  <div className="view-component-value">{rowValues?.vmid}</div>
                </Col>
                <Col md={3}>
                  <label className="view-component-label text-dark">
                    Component
                  </label>
                  <div className="view-component-value">
                    {rowValues?.vmid_name}
                  </div>
                </Col>
                <Col md={3}>
                  <label className="view-component-label text-dark">
                    Configuration Delay(Seconds)
                  </label>
                  <div className="view-component-value">
                    {rowValues?.duration} Sec
                  </div>
                </Col>  
                <Col md={3}>
                  <label className="view-component-label text-dark">
                    Component Name
                  </label>
                  <div className="view-component-value">
                    {rowValues?.componentname}
                  </div>
                </Col>  
              </Row>

              <Row className="mb-5">
                <Col md={3}>
                  <label className="view-component-label text-dark">
                    Component Image
                  </label>
                  <div className="mt-2">
                    <img
                      src={
                        rowValues?.componentimage
                          ? `${process.env.API_URL_FILEMANAGER}${rowValues.componentimage}`
                          : dummy_network.src
                      }
                      alt="Subcategory Preview"
                      className=""
                      style={{
                        width: "150px",
                        height: "auto",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </Col>
                {rowValues && (
                  <Col md={8}>
                    <h6 className="mb-3">VM Details</h6>
                    <Table responsive bordered className="mb-0">
                      <thead>
                        <tr>
                          <td style={{ width: "30%" }}>Property</td>
                          <td>Value</td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Virtual Memory</td>
                          <td>
                            {rowValues?.memory
                              ? `${rowValues.memory} M`
                              : "N/A"}
                          </td>
                        </tr>
                        <tr>
                          <td>Virtual CPU</td>
                          <td>
                            {rowValues?.cores
                              ? `${rowValues.cores} Cores`
                              : "N/A"}
                          </td>
                        </tr>
                        <tr>
                          <td>Network Ports</td>
                          <td>
                            {rowValues?.network_ports
                              ? rowValues.network_ports
                                  .split(/(?=net\d+ -)/)
                                  .map((line, i) => {
                                    const [ifacePart, ...rest] =
                                      line.split(" - ");
                                    const truncatedDetails = rest
                                      .join(" - ")
                                      .split(",ip=")[0];
                                    return (
                                      <div key={i}>
                                        <strong>{ifacePart}</strong> -{" "}
                                        {truncatedDetails}
                                      </div>
                                    );
                                  })
                              : "N/A"}
                          </td>
                        </tr>
                        <tr>
                          <td>Storage Size</td>
                          <td>
                            {rowValues?.storage
                              ? `${rowValues.storage} GB`
                              : "N/A"}
                          </td>
                        </tr>
                        
                      </tbody>
                    </Table>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

ComponentView.layout = "Contentlayout";
export default ComponentView;

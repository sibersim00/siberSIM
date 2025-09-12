import React from 'react'
import {
  Col,
  Row,
  OverlayTrigger,
  Tooltip,
  Alert,
  Badge,
} from "react-bootstrap";
import "../../utils/i18n";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

const EnrollProgram = ({learnerDetails}) => {
	const { t } = useTranslation();
  const router = useRouter();
  
  return (
    <>
      <Row className="row-sm">
        {learnerDetails &&
          learnerDetails.length == 0 && (
            <Col md={12}>
              <Alert variant="warning" role="alert">
                <span className="alert-inner--icon">
                  {" "}
                  <i className="fe fe-info me-2"></i>
                </span>
                <span className="alert-inner--text">
									{t("learner.no_program_msg")}
                </span>
              </Alert>
            </Col>
          )}

        {learnerDetails &&
          learnerDetails.length > 0 &&
          learnerDetails.map((program) => {
            console.log(learnerDetails,"dasdasdasdas")
            return (
              <>
                <Col md={4}>
                  <div className="card custom-card ht-200 shadow-lg">
                    <div className="card-body">
                      <div className="card-item">
                        <div className="card-item-title mb-2">
                          {program?.title && program?.title.length > 100 ? (
                            <label className="main-content-label tx-13 font-weight-bold mb-1">
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>{program.title}</Tooltip>}
                              >
                                <div>
                                  {program.title?.slice(0, 100)}{" "}
                                  <span className="pointer"> ...</span>
                                </div>
                              </OverlayTrigger>
                            </label>
                          ) : (
                            <label className="main-content-label tx-13 font-weight-bold mb-1">
                              <div className='text-primary pointer' onClick={()=>{router.push('/components/programs/view/'+ program?.uuid);}}>{program.title}</div>   
                                                         
                            </label>
                          )}
                          <span className="d-block tx-12 mb-0 text-muted">
                            {program?.categoryname}
                          </span>
                        </div>
                        <div className="card-item-body">
                          <div className="card-item-stat">
                            <h6>
                              {program?.is_free == "Y" ? (
                                <span className="fs-30 me-2 text-success">
                                  {t("learner.free")}
                                </span>
                              ) : (
                                <span className="fs-30 me-2">
                                  &#8377; {program?.final_price}
                                </span>
                              )}
                              {program?.program_learning_status == "Started" ? (
                                <Badge bg="warning">
                                  {program?.program_learning_status}
                                </Badge>
                              ) : program?.program_learning_status == "Pending" ? (
                                <Badge bg="secondary">
                                  {program?.program_learning_status}
                                </Badge>
                              ) : program?.program_learning_status == "Completed" ? (
                                <Badge bg="success">
                                  {program?.program_learning_status}
                                </Badge>
                              ) : (
                                <Badge bg="danger">
                                  {program?.program_learning_status}
                                </Badge>
                              )}
                            </h6>
                            {program?.subtitle ? (
                              <>
                                <small>
                                  <b className="text-info">
                                    {program?.subtitle}
                                  </b>
                                </small>{" "}
                                <br />{" "}
                              </>
                            ) : (
                              ""
                            )}
                            {program?.description &&
                            program?.description.length > 90 ? (
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>{program.description}</Tooltip>
                                }
                              >
                                <small>
                                  {program.description?.slice(0, 90)}{" "}
                                  <span className="pointer text-info">
                                    {" "}
                                    ...
                                  </span>
                                </small>
                              </OverlayTrigger>
                            ) : (
                              <small>{program.description}</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </>
            );
          })}
      </Row>
    </>
  )
}

export default EnrollProgram
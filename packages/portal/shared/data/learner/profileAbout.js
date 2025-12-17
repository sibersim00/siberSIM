import React from 'react'
import { Form, Card,Row,Col } from "react-bootstrap";
import Link from "next/link";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";

const ProfileAbout = ({learnerDetails}) => {
	const { t } = useTranslation();
  return (
    <>
      <Row>
       <Col md={12}>
        <Card className="custom-card">
          <div className="tab-content">
            <div className="main-content-body tab-pane p-sm-4 p-0 border-top-0 active">
              <div className=" p-0 border p-0 rounded-10">
                <div className="p-4">
								{learnerDetails?.bio && <>
                  <h4 className="tx-15 text-uppercase mb-3">{t("learner.view.biodata")}</h4>
                  <p className="m-b-5">
                    {learnerDetails?.bio}
                  </p></>} 
									<div className='d-flex'>
									{learnerDetails?.designation && 
                  <div className="me-5">
                    <h4 className="tx-15 text-uppercase mt-3">{t("learner.view.designation")}</h4>
                    <div className="p-t-10">
                      <h5 className="text-primary m-b-5 tx-14">
                      	{learnerDetails?.designation} 
                      </h5>
                    </div>
                  </div>}
									{learnerDetails?.dob && 
									<div>
                    <h4 className="tx-15 text-uppercase mt-3">{t("learner.view.dob")}</h4>
                    <div className="p-t-10">
                      <h5 className="text-primary m-b-5 tx-14">
                      	{learnerDetails?.dob} 
                      </h5>
                    </div>
                  </div>}
									</div>
                </div>
                <div className="border-top"></div>
                <div className="p-4">
                  <Form.Label className="main-content-label tx-13 mg-b-20">
									{t("learner.view.contact")}
                  </Form.Label>
                  <div className="d-sm-flex">
                    <div className="mg-sm-r-20 mg-b-10">
                      <div className="main-profile-contact-list">
                        <div className="media">
                          <div className="media-icon bg-primary-transparent text-primary">
                            <i className="fe fe-phone-call"></i>
                          </div>
                          <div className="media-body">
                            <span>{t("learner.view.p_mobile_no")}</span>
                            <div> {learnerDetails?.mobile ? learnerDetails?.mobile  : "-" } </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mg-sm-r-20 mg-b-10">
                      <div className="main-profile-contact-list">
                        <div className="media">
                          <div className="media-icon bg-success-transparent text-success">
                            <i className="fe fe-phone-call"></i>
                          </div>
                          <div className="media-body">
                            <span>{t("learner.view.s_mobile_no")}</span>
                            <div> {learnerDetails?.mobile2 ? learnerDetails?.mobile2  : "-"} </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mg-sm-r-20 mg-b-10">
                      <div className="main-profile-contact-list">
                        <div className="media">
                          <div className="media-icon bg-danger-transparent text-danger">
                            <i className="fe fe-mail"></i>
                          </div>
                          <div className="media-body">
                            <span>{t("learner.view.email_id")}</span>
                            <div> {learnerDetails?.email ? learnerDetails?.email  : "-"} </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="">
                      <div className="main-profile-contact-list">
                        <div className="media">
                          <div className="media-icon bg-info-transparent text-info">
                            <i className="icon ion-location tx-26"></i>
                          </div>
                          <div className="media-body">
                            <span>{t("learner.view.current_address")}</span>
                            <div> {learnerDetails?.add1}, {learnerDetails?.add2}, {learnerDetails?.pincode} </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-top"></div>
                <div className="p-3 p-sm-4">
                  <Form.Label className="main-content-label tx-13 mg-b-20">
									SOCIAL INFO
                  </Form.Label>
                  <div className="row">
                  {learnerDetails && learnerDetails?.socialmedia && learnerDetails?.socialmedia.length > 0 ?
										learnerDetails?.socialmedia.map((item, index) => (
											<div className="col-md-4" key={index}>
											<div className="main-profile-social-list mb-4">
												<div className="media">
													<div className="media-icon bg-primary-transparent text-primary">
														<i className={item?.icon}></i>
													</div>
													<div className="media-body">
														<span>{item?.social_media_label}</span>
														{item?.social_media_value ? 
														<Link href={item?.social_media_value ? item?.social_media_value : "!#"} target='_blank'>{item?.social_media_value ? item?.social_media_value : "-"}</Link>
														: "-"}
													</div>
												</div>
											</div>
											</div>   
										)) : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
       </Col>
      </Row>
    </>
  )
}

export default ProfileAbout
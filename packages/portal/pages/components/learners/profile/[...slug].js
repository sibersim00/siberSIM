import React, {useState, useEffect} from 'react';
import {
  Tab,
  Nav,
  Button,
  Row,
  Card,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { getLearnersInfo, clearHasError } from '../../../../shared/redux/slices/learner/learnerManage';
import ProfileAbout from '../../../../shared/data/learner/profileAbout';
import EnrollProgram from '../../../../shared/data/learner/enrollProgram';
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import dummy_profile from '../../../../public/assets/img/dummy_profile.png'
import Seo from "../../../../shared/layout-components/seo/seo";

const LearnerProfile = () => {
  const dispatch = useDispatch();
  const { push, query } = useRouter();
  const [tabIndex, setTabIndex] = useState("tab1");
  const [profileId, setProfileId] = useState("");
  const [learnerDetails, setLearnerDetails] = useState([]);
  const { t } = useTranslation();
  const { learnerInfoResp, errorData } = useSelector((state) => {
    return {
      learnerInfoResp:
        state &&
        state.learnerData &&
        state.learnerData.learnerInfoResp &&
        state.learnerData.learnerInfoResp.data,

      errorData: state && state.learnerData && state.learnerData.error,
    };
  });
  const programsCount = learnerInfoResp?.programs?.length;
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
      dispatch(clearHasError());
    }
  }, [errorData]);


  useEffect(()=>{
    if(learnerInfoResp){
      setLearnerDetails(learnerInfoResp)
    }
  },[learnerInfoResp])

  useEffect(() => {
    if (query.slug) {
      setProfileId(query.slug[0]);
      dispatch(getLearnersInfo(query.slug[0]));
    }
  }, [query.slug]);

  const handleReturnBack = () => {
    push(`/learners`);
  };
  return (
    <>
    <Seo title="View Learner" />
    < ToastContainer/>
    <Tab.Container
      id="center-tabs-example"
      activeKey={`${tabIndex}`}
      className="bg-gray-100"
    >
      <Row className="square">
        <div lg={12} md={12}>
          <Card className="custom-card">
            <Card.Body>
              <div className="panel profile-cover">
                <div className="profile-cover__img">
                  <img src={dummy_profile.src} alt="img"/>
                  <h3 className="h3">
                    {learnerDetails && learnerDetails?.firstname} {""}{" "}
                    {learnerDetails && learnerDetails?.lastname}
                  </h3>
                </div>
                <div className="btn-list btn-profile">
                  
                  <Button
                    variant="success"
                    className="btn btn-rounded"
                    onClick={handleReturnBack}
                  >
                    <i className="fa fa-arrow-left me-2"></i>
                    <span>Back</span>
                  </Button>
                </div>
                <div className="profile-cover__action"></div>
                <div className="profile-cover__info">
                  <ul className="nav">
                    <li>
                      <strong>{programsCount}</strong>Programs
                    </li>
                  </ul>
                </div>
                <div className="profile-tab tab-menu-heading">
                  <Nav variant="pills" className="p-3 bg-primary-transparent">
                    <Nav.Item>
                      <Nav.Link
                        eventKey="tab1"
                        onClick={(e) => {
                          setTabIndex("tab1");
                        }}
                      >
                        {t("learner.tab.about")}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        eventKey="tab2"
                        onClick={(e) => {
                          setTabIndex("tab2");
                        }}
                      >
                        {t("learner.tab.programs")}
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Row>

      <Tab.Content className="p-0">
        {tabIndex == "tab1" && (
          <Tab.Pane eventKey="tab1" className="p-0">
            <ProfileAbout learnerDetails={learnerDetails} />
          </Tab.Pane>
        )}
        {tabIndex == "tab2" && (
          <Tab.Pane eventKey="tab2" className="p-0">
            <EnrollProgram learnerDetails={learnerDetails?.programs && learnerDetails?.programs} />
          </Tab.Pane>
        )}
        {tabIndex == "tab3" && (
          <Tab.Pane eventKey="tab3" className="p-0">
            {/* <TutorPrograms tutorDetails={tutorDetails} /> */}
          </Tab.Pane>
        )}
      </Tab.Content>
    </Tab.Container>
    
    </>
  )
}

LearnerProfile.layout = "Contentlayout";
export default LearnerProfile;
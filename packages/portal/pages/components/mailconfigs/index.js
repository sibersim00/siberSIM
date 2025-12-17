import React, { useState} from "react";
import { useDispatch} from "react-redux";
import { ToastContainer } from "react-toastify";
import { Row, Col,Nav, Tab } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import MailOverview from "../../../shared/data/mailconfigs/mailOverview";
import MailActivities from "../../../shared/data/mailconfigs/mailActivities";
import MailPlaceholder from "../../../shared/data/mailconfigs/mailPlaceholder";
import MailConfigure from "../../../shared/data/mailconfigs/mailConfigure";
import "../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import {
  clearLocalStorageKey,
  CleargetLocalStorageData,
} from "../../../shared/redux/slices/localstorage/LocalStorage";

const MailConfig = () => {
  const dispatch = useDispatch();
  const { t, } = useTranslation();
  const [tabIndex, setTabIndex] = useState("tab1");
  return (
    <>
      <Seo title="Mail Configuration" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Row className="mg-b-10 text-wrap">
            <div className="panel panel-primary tabs-style-2">
              <div className="tab-menu-heading">
                <div className="tabs-menu ">
                  <Tab.Container
                    id="left-tabs-example"
                    // defaultActiveKey={tabIndex}
                    activeKey={`${tabIndex}`}
                  >
                    <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                      <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 bg-white">
                        <Nav.Item>
                          <Nav.Link
                            eventKey="tab1"
                            onClick={(e) => {
                              setTabIndex("tab1");
                              dispatch(clearLocalStorageKey("tempateData"));
                              dispatch(CleargetLocalStorageData());
                            }}
                          >
                            {t("mail_config.tabs.overview")}
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            eventKey="tab2"
                            onClick={(e) => {
                              setTabIndex("tab2");
                              dispatch(clearLocalStorageKey("tempateData"));
                              dispatch(CleargetLocalStorageData());
                            }}
                          >
                            {t("mail_config.tabs.action_templates")}{" "}
                          </Nav.Link>
                        </Nav.Item>

                        <Nav.Item>
                          <Nav.Link
                            eventKey="tab4"
                            onClick={(e) => {
                              setTabIndex("tab4");
                              dispatch(clearLocalStorageKey("tempateData"));
                              dispatch(CleargetLocalStorageData());
                            }}
                          >
                            {t("mail_config.tabs.configure_template")}{" "}
                          </Nav.Link>
                        </Nav.Item>

                        <Nav.Item>
                          <Nav.Link
                            eventKey="tab3"
                            onClick={(e) => {
                              setTabIndex("tab3");
                              dispatch(clearLocalStorageKey("tempateData"));
                            }}
                          >
                            {t("mail_config.tabs.shortcodes")}{" "}
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Row>
                    <Tab.Content className="p-0">
                      {tabIndex == "tab1" && (
                        <Tab.Pane eventKey="tab1" className="p-0">
                          <MailOverview />
                        </Tab.Pane>
                      )}

                      {tabIndex == "tab2" && (
                        <Tab.Pane eventKey="tab2" className="p-0">
                          <MailActivities setTabIndex={setTabIndex} />
                        </Tab.Pane>
                      )}

                      {tabIndex == "tab3" && (
                        <Tab.Pane eventKey="tab3" className="p-0">
                          <MailPlaceholder />
                        </Tab.Pane>
                      )}

                      {tabIndex == "tab4" && (
                        <Tab.Pane eventKey="tab4" className="p-0">
                          <MailConfigure setTabIndex={setTabIndex} />
                        </Tab.Pane>
                      )}
                    </Tab.Content>
                  </Tab.Container>
                </div>
              </div>
            </div>
          </Row>
        </Col>
      </Row>
    </>
  );
};

MailConfig.layout = "Contentlayout";
export default MailConfig;

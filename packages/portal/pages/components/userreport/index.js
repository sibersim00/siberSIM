import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Nav, Tab } from "react-bootstrap";
import { getLocalStorageData } from "../../../shared/redux/slices/localstorage/LocalStorage";

import Seo from "../../../shared/layout-components/seo/seo";
//LOADED COMPONENT
import Userreport from "./report/userprofile";
import Userperformance from "./report/userperformance";
// import ScenarioCategory from "./reports/scenariocaregories";
// import ScenarioSubCategory from "./reports/scenariosubcategories";
// import Faqs from "./reports/faqs";
// import Widgets from "./reports/widgets";

// import Componenets from "../components/index";

const Master = () => {
  const [tabOrNav, setTabOrNav] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState({});
  const [subMenus, setSubmenus] = useState([]);
  const [indexId, setIndexId] = useState('tab1');
  const [selectedSubMenu, setSelectedSubMenu] = useState({});
  const [filteredSubMenus, setfilteredSubMenus] = useState([]);
  const dispatch = useDispatch();
  const { getSubMenus } = useSelector((state) => {
    return {
     getSubMenus: state && state.localData && state.localData.getLocalData,
    };
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("selectedmenu"));
    }
  }, []);
  useEffect(() => {
    if (getSubMenus && getSubMenus?.source == "/report") {
      const checktabnav = getSubMenus.menutype == "Tab Menu" ? true : false;
      setTabOrNav(checktabnav);
      setSelectedMenu(getSubMenus);
      if (getSubMenus?.children && getSubMenus?.children.length > 0) {
        setSubmenus(getSubMenus.children);
        setfilteredSubMenus(getSubMenus.children);
        setSelectedSubMenu(getSubMenus.children[0]);
      }
    }
  }, [getSubMenus]);
  const onFilterChanged = (e) => {
    const inputValue = e.target.value;
    if (inputValue) {
      let filteredList = subMenus;
      filteredList = subMenus.filter((tablename) => {
        const employeeName = tablename?.title
          ? tablename?.title.toLowerCase()
          : "";
        return employeeName.includes(inputValue.toLowerCase());
      });
      setfilteredSubMenus(filteredList);
    } else {
      setfilteredSubMenus(subMenus);
    }
  };

  return (
    <>
      <Seo title={selectedMenu?.title} />
        <Row className="row-sm">
      
            <Col md={12}>
              <Row className="mg-b-10 text-wrap">
                <div className="panel panel-primary tabs-style-2">
                  <div className="tab-menu-heading">
                    <div className="tabs-menu ">
                      <Tab.Container
                        id="left-tabs-example"
                        activeKey={`${indexId}`}
                      >
                        <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                          <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white">
                            
                            <Nav.Item
                              className="mastermenu"
                              onClick={() => {
                                setIndexId("tab1");
                              }}
                            >
                              <Nav.Link
                                eventKey={"tab1"}
                                className="masterlist"
                              >SIMUser Profile
                              </Nav.Link>
                            </Nav.Item>

                            <Nav.Item
                              className="mastermenu"
                              onClick={() => {
                                setIndexId("tab2");
                              }}
                            >
                              <Nav.Link
                                eventKey={"tab2"}
                                className="masterlist"
                              >SIMUser Performance
                              </Nav.Link>
                            </Nav.Item>
                          </Nav>
                        </Row>
                      </Tab.Container>
                    </div>
                  </div>
                </div>
              </Row>
            </Col>
            <Col md={12}>
            {indexId=="tab1" && <Userreport />}
            {indexId=="tab2" && <Userperformance />}
            </Col>
       
        </Row>
      
    </>
  );
};

Master.layout = "Contentlayout";
export default Master;

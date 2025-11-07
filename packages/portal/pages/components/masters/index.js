import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Nav, Tab } from "react-bootstrap";
import { getLocalStorageData } from "../../../shared/redux/slices/localstorage/LocalStorage";
import PerfectScrollbar from "react-perfect-scrollbar";
import ModuleNotAssigned from "../../../shared/data/common/moduleNotAssigned";
import Seo from "../../../shared/layout-components/seo/seo";
//LOADED COMPONENT
import ComponentCategories from "./masters/componentcategories";
import ComponentSubCategories from "./masters/componentsubcategories";
import ScenarioCategory from "./masters/scenariocaregories";
import ScenarioSubCategory from "./masters/scenariosubcategories";
import Faqs from "./masters/faqs";
import Widgets from "./masters/widgets";


// import Componenets from "../components/index";

const Master = () => {
  const [tabOrNav, setTabOrNav] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState({});
  const [subMenus, setSubmenus] = useState([]);
  const [indexId, setIndexId] = useState(0);
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
    if (getSubMenus && getSubMenus?.source == "/masters") {
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
      {subMenus && subMenus.length > 0 ? (
        <Row className="row-sm">
          {tabOrNav && (
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
                            {subMenus
                              ? subMenus.map((policy, i) => {
                                return (
                                  <Nav.Item
                                    key={i}
                                    className="mastermenu"
                                    onClick={() => {
                                      setIndexId(i);
                                      setSelectedSubMenu(policy);
                                    }}
                                  >
                                    <Nav.Link
                                      eventKey={i}
                                      className="masterlist"
                                    >
                                      &nbsp;&nbsp;
                                      <i
                                        className={`${policy.iconname}`}
                                      ></i>{" "}
                                      {policy.title}
                                    </Nav.Link>
                                  </Nav.Item>
                                );
                              })
                              : null}
                          </Nav>
                        </Row>
                      </Tab.Container>
                    </div>
                  </div>
                </div>
              </Row>
            </Col>
          )}
          {tabOrNav == false && (
            <Col md={2} className="">
              <Card className=" custom-card mail-container task-container overflow-hidden">
                <div className="">
                  <div className="p-3 mg-t-5 border-bottom">
                    <input
                      className="form-control bd bd-2"
                      type="text"
                      placeholder={selectedMenu?.title}
                      onChange={onFilterChanged}
                    />
                    <span
                      className="pos-absolute tx-16 r-25"
                      style={{ top: "1.7em", zIndex: "3", opacity: "0.5" }}
                    >
                      <i className="ion-search"></i>
                    </span>
                  </div>
                  <Card.Body className="card-body tab-list-items pd-0">
                    <PerfectScrollbar style={{ height: "73vh" }}>
                      <div className="main-content-left main-content-left-mail">
                        <div className="main-mail-menu">
                          <Nav
                            className=" main-nav-column mg-b-20"
                            defaultActiveKey={`${indexId}`}
                          >
                            {filteredSubMenus
                              ? filteredSubMenus.map((policy, i) => {
                                return (
                                  <Nav.Item
                                    key={i}
                                    className="mastermenu"
                                    onClick={() => {
                                      setIndexId(i);
                                      setSelectedSubMenu(policy);
                                    }}
                                  >
                                    <Nav.Link
                                      eventKey={i}
                                      className="masterlist"
                                    >
                                      &nbsp;&nbsp;
                                      <i
                                        className={`${policy.iconname}`}
                                      ></i>{" "}
                                      {policy.title}
                                    </Nav.Link>
                                  </Nav.Item>
                                );
                              })
                              : null}
                          </Nav>
                        </div>
                      </div>
                    </PerfectScrollbar>
                  </Card.Body>
                </div>
              </Card>
            </Col>
          )}
          <Col md={tabOrNav ? 12 : 10}>
            {console.log("selectedSubMenu", selectedSubMenu)}
            {selectedSubMenu && (
              <div>
                {/* {selectedSubMenu.source === "/components" && <Componenets />} */}
                {selectedSubMenu.source === "/component_categories" && (
                  <ComponentCategories />
                )}
                {selectedSubMenu.source === "/component_sub_categories" && (
                  <ComponentSubCategories />
                )}
                {selectedSubMenu.source === "/scenario_categories" && (
                  <ScenarioCategory />
                )}
                {selectedSubMenu.source === "/scenario_subcategories" && (
                  <ScenarioSubCategory />
                )}
                {selectedSubMenu.source === "/faqs" && (
                  <Faqs />
                )}
                {selectedSubMenu.source === "/widgets" && (
                  <Widgets />
                )}

              </div>
            )}
          </Col>
        </Row>
      ) : (
        <ModuleNotAssigned />
      )}
    </>
  );
};

Master.layout = "Contentlayout";
export default Master;

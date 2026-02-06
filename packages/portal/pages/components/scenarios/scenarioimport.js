import React, { useState, useEffect } from "react";
import { Row, Col, Card, Nav, Tab } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import ScenarioComponent from "./scenariocomponent";
import ScenarioImportView from "./importview/[...slug]";


const ScenarioImport = () => {
  const [tabOrNav, setTabOrNav] = useState(true); 
  const [selectedMenu, setSelectedMenu] = useState({});
  const [subMenus, setSubmenus] = useState([]);
  const [indexId, setIndexId] = useState(0);
  const [selectedSubMenu, setSelectedSubMenu] = useState({});
  const [filteredSubMenus, setFilteredSubMenus] = useState([]);

  // Load Menus (STATIC for now like Master did dynamic)
  useEffect(() => {
    const menuData = {
      title: "Import Scenario",
      menutype: "Tab Menu",
      children: [
        {
          title: "Scenario",
          source: "/scenario",
        },
        {
          title: "Component",
          source: "/component",
        },
      ],
    };

    const checkTabNav = menuData.menutype === "Tab Menu";
    setTabOrNav(checkTabNav);
    setSelectedMenu(menuData);
    setSubmenus(menuData.children);
    setFilteredSubMenus(menuData.children);
    setSelectedSubMenu(menuData.children[0]);
  }, []);

  const onFilterChanged = (e) => {
    const inputValue = e.target.value;
    if (inputValue) {
      const filtered = subMenus.filter((m) =>
        m.title.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSubMenus(filtered);
    } else {
      setFilteredSubMenus(subMenus);
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
                    <div className="tabs-menu">
                      <Tab.Container id="scenario-tabs" activeKey={`${indexId}`}>
                        <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                          <Nav className="d-flex align-items-center tabs-menu-body pills bd-b pb-0 pt-1 bg-white">
                            {subMenus.map((menu, i) => (
                              <Nav.Item
                                key={i}
                                className="mastermenu"
                                onClick={() => {
                                  setIndexId(i);
                                  setSelectedSubMenu(menu);
                                }}
                              >
                                <Nav.Link eventKey={i} className="masterlist">
                                
                                  {menu.title}
                                </Nav.Link>
                              </Nav.Item>
                            ))}
                          </Nav>
                        </Row>
                      </Tab.Container>
                    </div>
                  </div>
                </div>
              </Row>
            </Col>
          )}

          <Col md={12}>
            {selectedSubMenu && (
              <>
                {selectedSubMenu.source === "/scenario" && <ScenarioImportView />}
                {selectedSubMenu.source === "/component" && <ScenarioComponent/>}
              </>
            )}
          </Col>
        </Row>
      ) : (
        <div>No Modules Assigned</div>
      )}
    </>
  );
};

ScenarioImport.layout = "Contentlayout";
export default ScenarioImport;

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Col, Nav, Row, Tab } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import { getLocalStorageData } from "../../../shared/redux/slices/localstorage/LocalStorage";
import ModuleNotAssigned from "../../../shared/data/common/moduleNotAssigned";
import Seo from "../../../shared/layout-components/seo/seo";
import ManageCustomers from "./managecustomers";
import CustomerDashboard from "./customerDashboard";

const LicenseManagement = () => {
  const dispatch = useDispatch();
  const [tabOrNav, setTabOrNav] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState({});
  const [subMenus, setSubMenus] = useState([]);
  const [filteredSubMenus, setFilteredSubMenus] = useState([]);
  const [selectedSubMenu, setSelectedSubMenu] = useState({});
  const [indexId, setIndexId] = useState(0);

  const { getSubMenus } = useSelector((state) => ({
    getSubMenus: state?.localData?.getLocalData,
  }));

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("selectedmenu"));
    }
  }, [dispatch]);

  useEffect(() => {
    const isLicenseManagement =
      getSubMenus?.source === "/license-management" ||
      getSubMenus?.source === "/licensemanagement";

    if (!isLicenseManagement) return;

    const children = Array.isArray(getSubMenus.children)
      ? getSubMenus.children
      : [];

    setTabOrNav(getSubMenus.menutype === "Tab Menu");
    setSelectedMenu(getSubMenus);
    setSubMenus(children);
    setFilteredSubMenus(children);
    setSelectedSubMenu(children[0] || {});
    setIndexId(0);
  }, [getSubMenus]);

  const selectSubMenu = (menu, index) => {
    setIndexId(index);
    setSelectedSubMenu(menu);
  };

  const onFilterChanged = (event) => {
    const searchText = event.target.value.trim().toLowerCase();
    setFilteredSubMenus(
      searchText
        ? subMenus.filter((menu) =>
            (menu?.title || "").toLowerCase().includes(searchText)
          )
        : subMenus
    );
  };

  const renderSubMenuItems = (menus) =>
    menus.map((menu, index) => (
      <Nav.Item
        key={menu.menuid || menu.source || index}
        className="mastermenu"
        onClick={() => selectSubMenu(menu, index)}
      >
        <Nav.Link eventKey={`${index}`} className="masterlist">
          &nbsp;&nbsp;
          <i className={menu.iconname}></i> {menu.title}
        </Nav.Link>
      </Nav.Item>
    ));

  const selectedSource = selectedSubMenu?.source;

  return (
    <>
      <Seo title={selectedMenu?.title || "License Management"} />
      {subMenus.length > 0 ? (
        <Row className="row-sm">
          {tabOrNav ? (
            <Col md={12}>
              <Row className="mg-b-10 text-wrap">
                <div className="panel panel-primary tabs-style-2">
                  <div className="tab-menu-heading">
                    <div className="tabs-menu">
                      <Tab.Container activeKey={`${indexId}`}>
                        <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                          <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white">
                            {renderSubMenuItems(subMenus)}
                          </Nav>
                        </Row>
                      </Tab.Container>
                    </div>
                  </div>
                </div>
              </Row>
            </Col>
          ) : (
            <Col md={2}>
              <Card className="custom-card mail-container task-container overflow-hidden">
                <div className="p-3 mg-t-5 border-bottom">
                  <input
                    className="form-control bd bd-2"
                    type="text"
                    placeholder={selectedMenu?.title || "License Management"}
                    onChange={onFilterChanged}
                  />
                  <span
                    className="pos-absolute tx-16 r-25"
                    style={{ top: "1.7em", zIndex: 3, opacity: 0.5 }}
                  >
                    <i className="ion-search"></i>
                  </span>
                </div>
                <Card.Body className="card-body tab-list-items pd-0">
                  <PerfectScrollbar style={{ height: "73vh" }}>
                    <div className="main-content-left main-content-left-mail">
                      <div className="main-mail-menu">
                        <Nav
                          className="main-nav-column mg-b-20"
                          activeKey={`${indexId}`}
                        >
                          {renderSubMenuItems(filteredSubMenus)}
                        </Nav>
                      </div>
                    </div>
                  </PerfectScrollbar>
                </Card.Body>
              </Card>
            </Col>
          )}

          <Col md={tabOrNav ? 12 : 10}>
            {selectedSource === "/customer-dashboard" && (
              <CustomerDashboard />
            )}
            {(selectedSource === "/customers" ||
              selectedSource === "/customer-management") && (
              <ManageCustomers />
            )}
          </Col>
        </Row>
      ) : (
        <ModuleNotAssigned />
      )}
    </>
  );
};

LicenseManagement.layout = "Contentlayout";

export default LicenseManagement;

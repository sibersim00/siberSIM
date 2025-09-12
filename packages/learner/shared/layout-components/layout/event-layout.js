import React, {Fragment,useEffect } from 'react';
import { Container, Form, Nav, Navbar,Dropdown, InputGroup, } from "react-bootstrap";
import favicon from "../../../public/assets/img/brand/favicon.png"

const Eventlayout = ({ children }) => {
  useEffect(() => {
    document.querySelector("body").classList.add("ltr", "main-body", "leftmenu", "error-1");
  }, []);

    const handleLogout = () => {
    alert("Logged out!");
  };

  const Darkmode = () => {
  document.querySelector("body").classList.toggle("dark-theme");

  const switchEl = document.querySelector("#myonoffswitch2");
  if (switchEl) {
    switchEl.checked = true;
  }

  if (document.body.classList.contains("dark-theme")) {
    localStorage.setItem("DSPdark", true);
  } else {
    localStorage.removeItem("DSPdark");
  }
};

  return (
    <>
     <Fragment>
        <Navbar expand="lg" className="main-header sticky ">
          <Container fluid className="main-container container-fluid d-flex justify-content-between align-items-center">
            
            <div className="d-flex align-items-center">
              <img src={favicon.src} alt="Favicon" style={{ height: '32px', marginRight: '12px' }} />
              
            </div>

            <div className="d-flex align-items-center">
              {/* <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button> */}
              <Dropdown className="dropdown d-flex main-header-theme">
                        <Nav.Link
                          className="nav-link icon layout-setting"
                          onClick={() => Darkmode()}
                        >
                          <span className="dark-layout">
                            <i className="fe fe-sun header-icons"></i>
                          </span>
                          <span className="light-layout">
                            <i className="fe fe-moon header-icons"></i>
                          </span>
                        </Nav.Link>
                      </Dropdown>
            </div>
          </Container>
        </Navbar>
      </Fragment>

      <main className="layout-content">
        {children}
      </main>
    </>
  );
};

export default Eventlayout;

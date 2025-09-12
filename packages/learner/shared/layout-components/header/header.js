import React, { Fragment, useState } from "react";
import { Container, Form, Nav, Navbar, InputGroup, } from "react-bootstrap";
import Link  from "next/link";
import logo from "../../../public/assets/img/brand/logo.png"
import logo_dark from "../../../public/assets/img/brand/logo-dark.png"
import favicon from "../../../public/assets/img/brand/favicon.png"
import logolight from "../../../public/assets/img/brand/logo-light.png"
import dynamic from "next/dynamic";
const HeadDropDown = dynamic(
  () => import('./head'),
  { ssr: false }
)

// FullScreen-end
function Header() {
  const openCloseSidebar1 = () => {
    document.querySelector(".header-settings").classList.toggle("show");
    document.querySelector(".sidebar-right").classList.toggle("sidebar-open");
  };
//  headerToggleButton

const headerToggleButton = () => {
  let body = document.querySelector("body")
  let innerWidth = window.innerWidth
  if (body) {
  // if (body !== !body) {
    if (innerWidth >= 992) {
      document.querySelector('body')?.classList.toggle('main-sidebar-hide');
      document.querySelector('body')?.classList.remove('main-sidebar-show');
    }
    else if (document.body.classList.contains('horizontalmenu')) {
      document.querySelector('body')?.classList.toggle('main-navbar-show');
      document.querySelector('body')?.classList.remove('main-sidebar-show');
      document.querySelector('body')?.classList.remove('main-sidebar-hide');
    }
    else {
      document.querySelector('body')?.classList.toggle('main-sidebar-show');
      document.querySelector('body')?.classList.remove('main-sidebar-hide');
    }
  }
}


  function Swicherbutton() {
    document.querySelector(".demo_changer").classList.toggle("active");
    document.querySelector(".demo_changer").style.right = "0px";
  }
  const Darkmode = () => {
    document.querySelector("body").classList.toggle("dark-theme");
    document.querySelector("#myonoffswitch2").checked = true
  }


  return (
    <Fragment>
      <Navbar expand="lg" className="main-header side-header sticky"
      // style={{ marginBottom: "-64px" }}
      >
        <Container fluid className="main-container ">
          <div className="main-header-left">
            <a className="main-header-menu-icon" id="mainSidebarToggle" onClick={() => headerToggleButton()}>
              <span></span>
            </a>
            <div className="hor-logo">
              <Link className="main-logo" href="/components/dashboard/dashboard">
                <img src={logo.src} className="header-brand-img desktop-logo" alt="logo" />
                <img src={favicon.src} className="header-brand-img desktop-logo-dark" alt="logo" />
              </Link>
            </div>
          </div>
          <div className="main-header-center">
            <div className="responsive-logo">
              <Link href="/components/dashboard/dashboard">
                <img src={logo_dark.src} className="mobile-logo" alt="logo" />
              </Link>
              <Link href="/components/dashboard/dashboard">
                <img src={logo_dark.src} className="mobile-logo-dark" alt="logo" />
              </Link>
            </div>
            
          </div>
          <div className="main-header-right">
            <Navbar.Toggle aria-controls="navbarSupportedContent-4" className="navresponsive-toggler" >
              <i className="fe fe-more-vertical header-icons navbar-toggler-icon"></i>
            </Navbar.Toggle>
            <div className="navbar navbar-expand-lg nav nav-item navbar-nav-right responsive-navbar navbar-dark">
              <Navbar.Collapse className="collapse navbar-collapse" id="navbarSupportedContent-4">
                <HeadDropDown/>
              </Navbar.Collapse>
              
            </div>
          </div>
        </Container>
      </Navbar>
    </Fragment>
  );
}

Header.propTypes = {};

Header.defaultProps = {};

export default Header;

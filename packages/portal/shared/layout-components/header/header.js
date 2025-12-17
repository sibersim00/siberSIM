import React, { Fragment, useState } from "react";
import { Dropdown, Container, Form, Nav, Navbar, InputGroup, } from "react-bootstrap";
import Link  from "next/link";
// FuScreen-start

//Images

import logo from "../../../public/assets/img/brand/logo-dark.png"
import logolight from "../../../public/assets/img/brand/logo-dark.png"
import favicon from "../../../public/assets/img/brand/favicon.png"

// import HeadDropDown from "../../data/header/head";
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
    if (body !== !body) {
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

  const [show1, setShow1] = useState(false);
  const [InputValue, setInputValue] = useState("");
  const [show2, setShow2] = useState(false);
  const [searchcolor, setsearchcolor] = useState("text-dark");
  const [searchval, setsearchval] = useState("Type something");
  const [NavData, setNavData] = useState([]);

  return (
    <Fragment>
      <Navbar expand="lg" className="main-header side-header sticky"
      >
        <Container fluid className="main-container container-fluid">
          <div className="main-header-left">
            <a className="main-header-menu-icon" id="mainSidebarToggle" onClick={() => headerToggleButton()}>
              <span></span>
            </a>
            <div className="hor-logo">
              <Link className="main-logo" href="/dashboard">
                <img src={logo.src} className="header-brand-img desktop-logo" alt="logo" />
                <img src={favicon.src} className="header-brand-img desktop-logo-dark" alt="logo" />
              </Link>
            </div>
          </div>
          <div className="main-header-center">
            <div className="responsive-logo">
              <Link href="/dashboard">
                <img src={logo.src} className="mobile-logo" alt="logo" />
              </Link>
              <Link href="/dashboard">
                <img src={logolight.src} className="mobile-logo-dark" alt="logo" />
              </Link>
            </div>
          
            {show1 ?
                <div className="card search-result p-absolute w-40  border mt-1">
                <div className="card-header">
                <h4 className="card-title me-2 text-break">Search result of {InputValue}</h4>
                </div>
                <ul className='mt-2'>
                    {show2 ?
                  NavData.map((e) => 
                  <li  key={Math.random()} className="">
                    <Link href={`${e.path}/`}  className='search-result-item' onClick={()=>{setShow1(false),setInputValue("")}} >{e.title}</Link>
                  </li>
                    )
                    :<b className={`${searchcolor} `}>{searchval}</b>}
                </ul>
                 
                 </div>
                : ""}
          </div>
          <div className="main-header-right">
            <Navbar.Toggle aria-controls="navbarSupportedContent-4" className="navresponsive-toggler" >
              <i className="fe fe-more-vertical header-icons navbar-toggler-icon"></i>
            </Navbar.Toggle>
            <div className="navbar navbar-expand-lg nav nav-item navbar-nav-right responsive-navbar navbar-dark">
              <Navbar.Collapse className="collapse navbar-collapse" id="navbarSupportedContent-4">
                <HeadDropDown/>
              </Navbar.Collapse>
              <div className="d-flex header-setting-icon demo-icon fa-spin">
                <Nav.Link className="nav-link icon" onClick={Swicherbutton}>
                  <i className="fe fe-settings settings-icon "></i>
                </Nav.Link>
              </div>
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

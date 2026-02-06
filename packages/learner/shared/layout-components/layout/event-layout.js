import React, { Fragment, useEffect, useState } from "react";
import {
  Container,
  Form,
  Nav,
  Navbar,
  Dropdown,
  InputGroup,
} from "react-bootstrap";
import favicon from "../../../public/assets/img/brand/favicon.png";
import { getOrSetTheme } from "../../redux/slices/commons/commons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

const Eventlayout = ({ children }) => {
  const dispatch = useDispatch();
  let navigate = useRouter();
  const currentPath = navigate.pathname;
  const [isUserValid, setIsUserValid] = useState(false);

  const { theme } = useSelector((state) => {
    return {
      theme: state.commonsdata?.theme,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const accessToken = JSON.parse(localStorage.getItem("accessTokenLearner"));
      const menus =  localStorage.getItem("menusLearner") != "undefined" ? JSON.parse(localStorage.getItem("menusLearner")) : []
      console.log("currentPath===>",currentPath, menus[0].Items)
        if(accessToken){
          if(menus?.[0].Items?.length > 0){
            if (!isTabAllowed(currentPath, menus[0].Items)) {
              navigate.replace("/404", "", { shallow: true });

            }else{
              setIsUserValid(true);
            }
          }
        }else{
          navigate.replace("/", '', { shallow: true });
          localStorage.removeItem("userLearner");
          localStorage.removeItem("accessTokenLearner");
          localStorage.removeItem("menusLearner");
          localStorage.clear();
          dispatch({ type: 'LOGOUT' });
        }
      }
    }, [currentPath]);
  
    const checkPath = (path, tabs) => {
      return tabs.some(tab => {
        if (tab.path === path) {
          return true;
        }else if(tab.sub_path && tab.sub_path.includes(path)){
          return true;
        }
        // Recursively check the children if they exist
        if (tab.children && tab.children.length > 0) {
          return checkPath(path, tab.children);
        }
        return false;
      });
    }
  
    const isTabAllowed = (currentPath, allowedTabs) => {
      return checkPath(currentPath,allowedTabs)
    }




  useEffect(() => {
    dispatch(getOrSetTheme()); // fetch theme on load
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme_preference", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme_preference", "light");
    }
  }, [theme]);
  useEffect(() => {
  const body = document.body;

  // Remove unwanted classes
  body.classList.remove(
    "error-1",
    "app",
    "sidebar-mini",
    "ltr",
    "landing-page",
    "horizontalmenu"
  );

  // Add default layout classes
  body.classList.add("main-body", "leftmenu", "ltr", "main-sidebar-hide");

  // Apply theme based on localStorage
  const storedTheme = localStorage.getItem("theme_preference"); // "dark" or "light"
  if (storedTheme === "dark") {
    body.classList.add("dark-theme");
  } else {
    body.classList.remove("dark-theme");
  }
}, []);
  const handleLogout = () => {
    alert("Logged out!");
  };

  const handleThemeToggle = () => {
    const isNowDark = document.body.classList.toggle("dark-theme");
    const newTheme = isNowDark ? "dark" : "light";

    localStorage.setItem("theme_preference", newTheme);

    dispatch(getOrSetTheme(newTheme));
  };
  return (
    
    <>
    {isUserValid && 
      <Fragment>
        <Navbar expand="lg" className="main-header sticky ">
          <Container
            fluid
            className="main-container container-fluid d-flex justify-content-between align-items-center"
          >
            <div className="d-flex align-items-center">
              <img
                src={favicon.src}
                alt="Favicon"
                style={{ height: "32px", marginRight: "12px" }}
              />
            </div>

            <div className="d-flex align-items-center">
              {/* <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button> */}
              <Dropdown className="dropdown d-flex main-header-theme">
                <Nav.Link
                  className="nav-link icon layout-setting"
                  onClick={() => handleThemeToggle()}
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
    }
      <main className="layout-content">{children}</main>
    </>
              
  );
};

export default Eventlayout;

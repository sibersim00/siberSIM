import React, { useEffect, useState } from "react";
import Footer from "../footer/footer";
import dynamic from "next/dynamic";
import TabToTop from "../tab-to-top/tab-to-top";
import Header from "../header/header";
import PropTypes from 'prop-types';
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
const Sidebar = dynamic(() => import("../sidebar/sidebar"), { ssr: false });

const Contentlayout = ({ children }) => {
  let navigate = useRouter();
  const currentPath = navigate.pathname;
  const dispatch = useDispatch();
  const [isUserValid, setIsUserValid] = useState(false);

  const Add = () => {
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
  // body.classList.add("main-body", "leftmenu", "ltr", "main-sidebar-hide");
  body.classList.add("main-body", "leftmenu", "ltr", "main-sidebar-show");

  // Apply theme based on localStorage
  const storedTheme = localStorage.getItem("theme_preference"); // "dark" or "light"
  if (storedTheme === "dark") {
    body.classList.add("dark-theme");
  } else {
    body.classList.remove("dark-theme");
  }
};
  useEffect(() => {
    Add();

    if (localStorage.getItem("Tbshorizontal")) {
      document.querySelector("body").classList.add("horizontalmenu");
      document.querySelector(".main-content").classList.add("hor-content");
      if (document.querySelector("main-container-1") != null) {
        document.querySelector(".main-container-1").classList.add("container");
        document
          .querySelector(".main-menu")
          .classList.add("main-navbar", "hor-menu");
        document
          .querySelector(".main-container-1")
          .classList.remove("main-sidebar-header");
        document
          .querySelector(".main-menu")
          .classList.remove("main-sidebar", "main-sidebar-sticky", "side-menu");
        document
          .querySelector(".main-body-1")
          .classList.remove("main-sidebar-body");
      }
      document
        .querySelectorAll(".main-container")
        .forEach((e) => e.classList.add("container"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.add("hor-icon"));
      document
        .querySelector("body")
        .classList.remove(
          "horizontalmenu-hover",
          "leftmenu",
          "main-body",
          "default-menu"
        );
      document.querySelector(".main-content").classList.remove("side-content");
      document
        .querySelectorAll(".main-container")
        .forEach((e) => e.classList.remove("container-fluid"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.remove("sidemenu-icon"));
    }

    if (localStorage.getItem("Tbshorizontalhover")) {
      document
        .querySelector("body")
        .classList.add("horizontalmenu", "horizontalmenu-hover");
      document.querySelector(".main-content").classList.add("hor-content");
      if(document.querySelector(".main-menu")!=null){
          document.querySelector(".main-menu").classList.add("main-navbar", "hor-menu");
          document.querySelector(".main-container-1").classList.add("container");
          document
            .querySelector(".main-menu")
            .classList.remove("main-sidebar", "main-sidebar-sticky", "side-menu");
            document
              .querySelector(".main-container-1")
              .classList.remove("main-sidebar-header");
              document
                .querySelector(".main-body-1")
                .classList.remove("main-sidebar-body");
      }
      document.querySelectorAll(".main-container").forEach((e) => e.classList.add("container"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.add("hor-icon"));
      document.querySelector("body").classList.remove("leftmenu", "main-body");
      // document.querySelector('.main-header').classList.remove('sticky');
      document.querySelector(".main-content").classList.remove("side-content");
      document.querySelector("body").classList.remove("default-menu");
      document
        .querySelectorAll(".main-container")
        .forEach((e) => e.classList.remove("container-fluid"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.remove("sidemenu-icon"));
    //    
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const accessToken = JSON.parse(localStorage.getItem("accessTokenLearner"));
      const menus =  localStorage.getItem("menusLearner") != "undefined" ? JSON.parse(localStorage.getItem("menusLearner")) : []
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
      if (tab.path === path || path == "/components/profile") {
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
  
  // const checkPath = (path, tabs) => {
  //   return tabs.some(tab => {
  //     if (tab.path === path) {
  //       return true;
  //     }
  //     // Recursively check the children if they exist
  //     if (tab.children && tab.children.length > 0) {
  //       return checkPath(path, tab.children);
  //     }
  //     return false;
  //   });
  // }
  // const isTabAllowed = (currentPath, allowedTabs) => {
  //   if(currentPath.includes('slug') || currentPath.includes('notification') || currentPath.includes('profile')){
  //     return true;
  //   }else{
  //     return checkPath(currentPath,allowedTabs)
  //   }
  // }
  const remove = () => {
    document.querySelector("body").classList.remove("main-sidebar-show");
    if (document.querySelector(".card.search-result") != null) {
      document.querySelector(".card.search-result").classList.add("d-none");
    }
    if (document.body.classList.contains("horizontalmenu")){
      document.querySelectorAll(".nav-sub").forEach((res)=>{
        res.classList = "nav-sub"
        res.style.display = "none"
      })
    }
  };
  return (
    <>
    {isUserValid &&
      <div className="horizontalMenucontainer">
        <div className="page">
          <Header />
          <Sidebar />
          <div className="main-content side-content pt-0">
            <div
              className="main-container container-fluid"
              onClick={() => remove()}
              onKeyDown = {(event)=>{
                if(event.key === 'Enter'){
                  event.preventDefault();
                  remove();
                }
              }}
            >
              <div className="inner-body mg-t-25">{children}</div>
            </div>
          </div>
        </div>
        <TabToTop />
        <Footer />
      </div>}
    </>
  );
};

Contentlayout.propTypes = {
  children: PropTypes.node,
};
export default Contentlayout;

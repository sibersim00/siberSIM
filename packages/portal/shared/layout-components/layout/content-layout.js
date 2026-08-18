import React, { useEffect, useState } from "react";
import Footer from "../footer/footer";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import { store } from "../../redux/store";
import dynamic from "next/dynamic";
import Rightside from "../right-sidebar/right-sidebar";
import TabToTop from "../tab-to-top/tab-to-top";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Header from "../header/header";
const Switcher = dynamic(() => import("../switcher/switcher"), { ssr: false });
const Sidebar = dynamic(() => import("../sidebar/sidebar"), { ssr: false });
import Script from "next/script";

const Contentlayout = ({ children }) => {
  let navigate = useRouter();
  const dispatch = useDispatch();
  const currentPath = navigate.pathname;
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

    if (localStorage.getItem("DSPhorizontal")) {
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

    if (localStorage.getItem("DSPhorizontalhover")) {
      document
        .querySelector("body")
        .classList.add("horizontalmenu", "horizontalmenu-hover");
      document.querySelector(".main-content").classList.add("hor-content");
      if (document.querySelector(".main-menu") != null) {
        document
          .querySelector(".main-menu")
          .classList.add("main-navbar", "hor-menu");
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
      document
        .querySelectorAll(".main-container")
        .forEach((e) => e.classList.add("container"));
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

  const remove = () => {
    document.querySelector(".sidebar-right").classList.remove("sidebar-open");
    // document.querySelector("body").classList.remove("main-sidebar-show");
    document.querySelector(".demo_changer").classList.remove("active");
    document.querySelector(".demo_changer").style.right = "-270px";
    if (document.querySelector(".card.search-result") != null) {
      document.querySelector(".card.search-result").classList.add("d-none");
    }
    if (document.body.classList.contains("horizontalmenu")) {
      document.querySelectorAll(".nav-sub").forEach((res) => {
        res.classList = "nav-sub";
        res.style.display = "none";
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const accessToken = JSON.parse(localStorage.getItem("accessToken"));
      const menus =  localStorage.getItem("menus") != "undefined" ? JSON.parse(localStorage.getItem("menus")) : []
      if(accessToken){
        if(menus?.[0].Items?.length > 0){
          if (!isTabAllowed(currentPath, menus[0].Items)) {
            navigate.replace("/404", "", { shallow: true });
          }else{
            setIsUserValid(true);
          }
        }
      }else{
        navigate.replace("/", "", { shallow: true });
        localStorage.removeItem("user");
        localStorage.removeItem("menus");
        localStorage.clear();
        dispatch({ type: "LOGOUT" });
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



  return (
    <>
    {isUserValid &&
      <ReduxProvider store={store}>
        <div className="horizontalMenucontainer">
          <div className="page">
            <Header />
            <Sidebar />
            <div className="main-content side-content pt-0">
              <div
                className="main-container container-fluid"
                onClick={(e) => {
                  // Only perform remove logic if clicked outside sidebar or header
                  if (
                    !e.target.closest(".main-sidebar") &&
                    !e.target.closest(".header")
                  ) {
                    remove(); // cleans right-sidebar etc.
                  }
                }}
              >
                <div className="inner-body mg-t-25">{children}</div>
              </div>
            </div>
            <Rightside />
          </div>
          <Switcher />
          <TabToTop />
          <Footer />
        </div>
      </ReduxProvider>}
    </>
  );
};

export default Contentlayout;
